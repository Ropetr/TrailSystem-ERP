// ============================================
// PLANAC ERP - Rotas de Integração Sicoob
// Webhooks e operações de boletos via API
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';
import {
  createSicoobService,
  processWebhook,
  generateTituloUpdate,
  generateRetornoItem,
  generateWebhookHash,
  validarAssinaturaWebhook,
  mapErpToSicoob,
  validarBoleto,
  SICOOB_CODIGO_BANCO,
} from '../services/sicoob';

const sicoob = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ==========================================
// SCHEMAS
// ==========================================

const registrarBoletoSchema = z.object({
  conta_id: z.string().uuid(),
  numero_documento: z.string().max(15),
  nosso_numero: z.string().optional(),
  data_emissao: z.string(),
  data_vencimento: z.string(),
  valor_documento: z.number().positive(),
  valor_abatimento: z.number().optional(),
  percentual_multa: z.number().optional(),
  percentual_juros: z.number().optional(),
  dias_protesto: z.number().optional(),
  sacado_cpf_cnpj: z.string(),
  sacado_nome: z.string(),
  sacado_endereco: z.string().optional(),
  sacado_numero: z.string().optional(),
  sacado_complemento: z.string().optional(),
  sacado_bairro: z.string().optional(),
  sacado_cidade: z.string().optional(),
  sacado_uf: z.string().length(2).optional(),
  sacado_cep: z.string().optional(),
  sacado_email: z.string().email().optional(),
  sacado_telefone: z.string().optional(),
  mensagem_1: z.string().max(40).optional(),
  mensagem_2: z.string().max(40).optional(),
  mensagem_3: z.string().max(40).optional(),
  cliente_id: z.string().uuid().optional(),
  conta_receber_id: z.string().uuid().optional(),
  venda_id: z.string().uuid().optional(),
  gerar_pix: z.boolean().optional().default(true),
});

// ==========================================
// WEBHOOK - Recebe atualizações do Sicoob
// ==========================================

/**
 * POST /sicoob/webhook/:contaId
 * 
 * Endpoint para receber webhooks do Sicoob.
 * O contaId na URL identifica qual conta bancária está recebendo o webhook.
 */
sicoob.post('/webhook/:contaId', async (c) => {
  const { contaId } = c.req.param();
  const startTime = Date.now();
  
  try {
    // Buscar configuração da conta
    const conta = await c.env.DB.prepare(`
      SELECT 
        bc.id,
        bc.empresa_id,
        bc.webhook_symmetric_key,
        bc.webhook_ativo,
        bb.codigo as banco_codigo
      FROM boleto_contas bc
      JOIN boleto_bancos bb ON bc.banco_id = bb.id
      WHERE bc.id = ? AND bb.codigo = ?
    `).bind(contaId, SICOOB_CODIGO_BANCO).first<{
      id: string;
      empresa_id: string;
      webhook_symmetric_key: string | null;
      webhook_ativo: number;
      banco_codigo: string;
    }>();
    
    if (!conta) {
      console.error(`[Sicoob Webhook] Conta não encontrada: ${contaId}`);
      return c.json({ success: false, error: 'Conta não encontrada' }, 404);
    }
    
    if (!conta.webhook_ativo) {
      console.warn(`[Sicoob Webhook] Webhook inativo para conta: ${contaId}`);
      return c.json({ success: false, error: 'Webhook inativo' }, 403);
    }
    
    // Obter payload
    const payload = await c.req.json();
    const payloadString = JSON.stringify(payload);
    
    // Validar assinatura (se configurada)
    const assinatura = c.req.header('X-Webhook-Signature');
    if (conta.webhook_symmetric_key && assinatura) {
      const isValid = await validarAssinaturaWebhook(
        payloadString,
        assinatura,
        conta.webhook_symmetric_key
      );
      
      if (!isValid) {
        console.error(`[Sicoob Webhook] Assinatura inválida`);
        return c.json({ success: false, error: 'Assinatura inválida' }, 401);
      }
    }
    
    // Gerar hash para deduplicação
    const payloadHash = await generateWebhookHash(payloadString);
    
    // Verificar se já processamos este webhook
    const existingWebhook = await c.env.DB.prepare(`
      SELECT id FROM pix_webhooks 
      WHERE payload_hash = ? AND empresa_id = ?
    `).bind(payloadHash, conta.empresa_id).first();
    
    if (existingWebhook) {
      console.log(`[Sicoob Webhook] Webhook duplicado ignorado: ${payloadHash}`);
      return c.json({ success: true, message: 'Webhook já processado' });
    }
    
    // Registrar webhook recebido
    const webhookId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO pix_webhooks (
        id, empresa_id, configuracao_id, tipo, evento,
        payload_hash, status, txid, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      webhookId,
      conta.empresa_id,
      null,
      payload.tipo || 'boleto',
      'sicoob_webhook',
      payloadHash,
      'recebido',
      payload.boleto?.nossoNumero || payload.pix?.[0]?.txid || null
    ).run();
    
    // Processar webhook
    const results = processWebhook(payload);
    
    for (const result of results) {
      if (!result.success) {
        continue;
      }
      
      if (result.tipo === 'boleto') {
        // Buscar título no banco de dados
        const titulo = await c.env.DB.prepare(`
          SELECT id, status, valor_documento FROM boleto_titulos
          WHERE empresa_id = ? AND conta_id = ? AND nosso_numero = ?
        `).bind(
          conta.empresa_id,
          conta.id,
          result.dados.nossoNumero
        ).first<{
          id: string;
          status: string;
          valor_documento: number;
        }>();
        
        if (!titulo) {
          console.warn(`[Sicoob Webhook] Título não encontrado: ${result.dados.nossoNumero}`);
          continue;
        }
        
        // Gerar dados de atualização
        const updateData = generateTituloUpdate(result);
        
        // Atualizar título
        await c.env.DB.prepare(`
          UPDATE boleto_titulos SET
            status = ?,
            valor_pago = COALESCE(?, valor_pago),
            data_pagamento = COALESCE(?, data_pagamento),
            data_credito = COALESCE(?, data_credito),
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          updateData.status,
          updateData.valor_pago,
          updateData.data_pagamento,
          updateData.data_credito,
          titulo.id
        ).run();
        
        // Registrar item de retorno
        const retornoItem = generateRetornoItem(result);
        const itemId = crypto.randomUUID();
        
        await c.env.DB.prepare(`
          INSERT INTO boleto_retornos_itens (
            id, retorno_id, titulo_id, nosso_numero,
            codigo_ocorrencia, valor_pago, data_ocorrencia,
            data_credito, processado, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
        `).bind(
          itemId,
          null,
          titulo.id,
          retornoItem.nosso_numero,
          retornoItem.ocorrencia,
          retornoItem.valor_pago,
          retornoItem.data_ocorrencia,
          retornoItem.data_credito
        ).run();
        
        // Registrar log
        await c.env.DB.prepare(`
          INSERT INTO boleto_logs (
            id, empresa_id, titulo_id, operacao, descricao, sucesso, created_at
          ) VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
        `).bind(
          crypto.randomUUID(),
          conta.empresa_id,
          titulo.id,
          'webhook',
          `Webhook Sicoob: ${result.acao}`
        ).run();
      }
    }
    
    // Atualizar status do webhook
    await c.env.DB.prepare(`
      UPDATE pix_webhooks SET 
        status = 'processado',
        processed_at = datetime('now')
      WHERE id = ?
    `).bind(webhookId).run();
    
    const processingTime = Date.now() - startTime;
    console.log(`[Sicoob Webhook] Processado em ${processingTime}ms`);
    
    return c.json({
      success: true,
      message: 'Webhook processado',
      data: {
        resultados: results.length,
      }
    });
    
  } catch (error) {
    console.error(`[Sicoob Webhook] Erro:`, error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno'
    }, 500);
  }
});

// ==========================================
// ROTAS AUTENTICADAS
// ==========================================

sicoob.use('/*', requireAuth());

// ==========================================
// REGISTRAR BOLETO
// ==========================================

/**
 * POST /sicoob/boletos
 * 
 * Registra um novo boleto no Sicoob via API
 */
sicoob.post('/boletos', requirePermission('financeiro', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();
  
  const validation = registrarBoletoSchema.safeParse(body);
  if (!validation.success) {
    return c.json({
      success: false,
      error: 'Dados inválidos',
      details: validation.error.errors
    }, 400);
  }
  
  const data = validation.data;
  
  // Buscar conta e credenciais
  const conta = await c.env.DB.prepare(`
    SELECT 
      bc.*,
      bb.codigo as banco_codigo
    FROM boleto_contas bc
    JOIN boleto_bancos bb ON bc.banco_id = bb.id
    WHERE bc.id = ? AND bc.empresa_id = ? AND bb.codigo = ?
  `).bind(data.conta_id, usuario.empresa_id, SICOOB_CODIGO_BANCO).first<{
    id: string;
    empresa_id: string;
    api_client_id: string;
    api_client_secret_encrypted: string;
    ambiente: string;
    nosso_numero_atual: number;
    digitos_nosso_numero: number;
    agencia: string;
    conta_corrente: string;
    carteira: string;
    codigo_beneficiario: string;
    variacao_carteira: string;
  }>();
  
  if (!conta) {
    return c.json({ success: false, error: 'Conta Sicoob não encontrada' }, 404);
  }
  
  if (!conta.api_client_id || !conta.api_client_secret_encrypted) {
    return c.json({ success: false, error: 'Credenciais Sicoob não configuradas' }, 400);
  }
  
  // Mapear dados para formato Sicoob
  const boletoSicoob = mapErpToSicoob({
    nossoNumero: data.nosso_numero || String(conta.nosso_numero_atual + 1).padStart(conta.digitos_nosso_numero, '0'),
    numeroDocumento: data.numero_documento,
    dataEmissao: data.data_emissao,
    dataVencimento: data.data_vencimento,
    valor: data.valor_documento,
    valorAbatimento: data.valor_abatimento,
    gerarPix: data.gerar_pix,
    pagadorCpfCnpj: data.sacado_cpf_cnpj,
    pagadorNome: data.sacado_nome,
    pagadorEndereco: data.sacado_endereco || '',
    pagadorBairro: data.sacado_bairro || '',
    pagadorCidade: data.sacado_cidade || '',
    pagadorUf: data.sacado_uf || '',
    pagadorCep: data.sacado_cep || '',
    pagadorEmail: data.sacado_email,
    pagadorTelefone: data.sacado_telefone,
    descontoValor: undefined,
    multaValor: data.percentual_multa,
    jurosValor: data.percentual_juros,
    mensagem1: data.mensagem_1,
    mensagem2: data.mensagem_2,
    mensagem3: data.mensagem_3,
  });
  
  // Validar dados
  const errosValidacao = validarBoleto(boletoSicoob);
  if (errosValidacao.length > 0) {
    return c.json({
      success: false,
      error: 'Dados do boleto inválidos',
      details: errosValidacao
    }, 400);
  }
  
  // Criar serviço Sicoob
  const sicoobService = createSicoobService({
    SICOOB_CLIENT_ID: conta.api_client_id,
    SICOOB_CLIENT_SECRET: conta.api_client_secret_encrypted, // TODO: decriptar
    SICOOB_AMBIENTE: conta.ambiente as 'homologacao' | 'producao',
    SICOOB_NUMERO_CONTRATO: conta.codigo_beneficiario,
  });
  
  try {
    // Incluir boleto
    const response = await sicoobService.boleto.incluir(boletoSicoob);
    
    // Criar título no banco de dados
    const tituloId = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO boleto_titulos (
        id, empresa_id, conta_id, nosso_numero, seu_numero, numero_documento,
        sacado_tipo, sacado_cpf_cnpj, sacado_nome, sacado_endereco, sacado_numero,
        sacado_complemento, sacado_bairro, sacado_cidade, sacado_uf, sacado_cep,
        sacado_email, sacado_telefone, valor_documento, valor_abatimento,
        data_documento, data_vencimento, percentual_multa, percentual_juros,
        dias_protesto, codigo_barras, linha_digitavel, qr_code_pix, id_externo,
        status, cliente_id, conta_receber_id, venda_id, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, 'registrado', ?, ?, ?, datetime('now'), datetime('now')
      )
    `).bind(
      tituloId,
      usuario.empresa_id,
      data.conta_id,
      response.nossoNumero,
      data.numero_documento,
      data.numero_documento,
      data.sacado_cpf_cnpj.replace(/\D/g, '').length === 11 ? 'PF' : 'PJ',
      data.sacado_cpf_cnpj,
      data.sacado_nome,
      data.sacado_endereco,
      data.sacado_numero,
      data.sacado_complemento,
      data.sacado_bairro,
      data.sacado_cidade,
      data.sacado_uf,
      data.sacado_cep,
      data.sacado_email,
      data.sacado_telefone,
      data.valor_documento,
      data.valor_abatimento,
      data.data_emissao,
      data.data_vencimento,
      data.percentual_multa,
      data.percentual_juros,
      data.dias_protesto,
      response.codigoBarras,
      response.linhaDigitavel,
      response.qrCode,
      response.nossoNumero,
      data.cliente_id,
      data.conta_receber_id,
      data.venda_id
    ).run();
    
    // Atualizar nosso número atual
    await c.env.DB.prepare(`
      UPDATE boleto_contas SET nosso_numero_atual = nosso_numero_atual + 1 WHERE id = ?
    `).bind(data.conta_id).run();
    
    // Registrar log
    await c.env.DB.prepare(`
      INSERT INTO boleto_logs (
        id, empresa_id, titulo_id, operacao, descricao, sucesso, created_at
      ) VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(
      crypto.randomUUID(),
      usuario.empresa_id,
      tituloId,
      'registro_api',
      'Boleto registrado via API Sicoob'
    ).run();
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'criar',
      entidade: 'boleto_titulos',
      entidade_id: tituloId,
      dados_novos: { nosso_numero: response.nossoNumero },
    });
    
    return c.json({
      success: true,
      data: {
        id: tituloId,
        nosso_numero: response.nossoNumero,
        codigo_barras: response.codigoBarras,
        linha_digitavel: response.linhaDigitavel,
        qr_code_pix: response.qrCode,
      }
    });
    
  } catch (error) {
    // Registrar erro
    await c.env.DB.prepare(`
      INSERT INTO boleto_logs (
        id, empresa_id, operacao, descricao, sucesso, erro_mensagem, created_at
      ) VALUES (?, ?, ?, ?, 0, ?, datetime('now'))
    `).bind(
      crypto.randomUUID(),
      usuario.empresa_id,
      'registro_api',
      'Erro ao registrar boleto no Sicoob',
      error instanceof Error ? error.message : 'Erro desconhecido'
    ).run();
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao registrar boleto'
    }, 500);
  }
});

// ==========================================
// CONSULTAR BOLETO
// ==========================================

/**
 * GET /sicoob/boletos/:id
 * 
 * Consulta um boleto no Sicoob via API
 */
sicoob.get('/boletos/:id', requirePermission('financeiro', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const { id } = c.req.param();
  
  // Buscar título
  const titulo = await c.env.DB.prepare(`
    SELECT 
      bt.*,
      bc.api_client_id,
      bc.api_client_secret_encrypted,
      bc.ambiente,
      bc.codigo_beneficiario
    FROM boleto_titulos bt
    JOIN boleto_contas bc ON bt.conta_id = bc.id
    JOIN boleto_bancos bb ON bc.banco_id = bb.id
    WHERE bt.id = ? AND bt.empresa_id = ? AND bb.codigo = ?
  `).bind(id, usuario.empresa_id, SICOOB_CODIGO_BANCO).first<{
    id: string;
    nosso_numero: string;
    api_client_id: string;
    api_client_secret_encrypted: string;
    ambiente: string;
    codigo_beneficiario: string;
  }>();
  
  if (!titulo) {
    return c.json({ success: false, error: 'Boleto não encontrado' }, 404);
  }
  
  // Criar serviço Sicoob
  const sicoobService = createSicoobService({
    SICOOB_CLIENT_ID: titulo.api_client_id,
    SICOOB_CLIENT_SECRET: titulo.api_client_secret_encrypted,
    SICOOB_AMBIENTE: titulo.ambiente as 'homologacao' | 'producao',
    SICOOB_NUMERO_CONTRATO: titulo.codigo_beneficiario,
  });
  
  try {
    const response = await sicoobService.boleto.consultar(titulo.nosso_numero);
    
    return c.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao consultar boleto'
    }, 500);
  }
});

// ==========================================
// TESTAR CONEXÃO
// ==========================================

/**
 * POST /sicoob/testar-conexao
 * 
 * Testa a conexão com a API do Sicoob
 */
sicoob.post('/testar-conexao', requirePermission('configuracoes', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();
  
  const { conta_id } = body;
  
  if (!conta_id) {
    return c.json({ success: false, error: 'conta_id é obrigatório' }, 400);
  }
  
  // Buscar conta
  const conta = await c.env.DB.prepare(`
    SELECT 
      bc.api_client_id,
      bc.api_client_secret_encrypted,
      bc.ambiente,
      bc.codigo_beneficiario
    FROM boleto_contas bc
    JOIN boleto_bancos bb ON bc.banco_id = bb.id
    WHERE bc.id = ? AND bc.empresa_id = ? AND bb.codigo = ?
  `).bind(conta_id, usuario.empresa_id, SICOOB_CODIGO_BANCO).first<{
    api_client_id: string;
    api_client_secret_encrypted: string;
    ambiente: string;
    codigo_beneficiario: string;
  }>();
  
  if (!conta) {
    return c.json({ success: false, error: 'Conta Sicoob não encontrada' }, 404);
  }
  
  // Criar serviço e testar conexão
  const sicoobService = createSicoobService({
    SICOOB_CLIENT_ID: conta.api_client_id,
    SICOOB_CLIENT_SECRET: conta.api_client_secret_encrypted,
    SICOOB_AMBIENTE: conta.ambiente as 'homologacao' | 'producao',
    SICOOB_NUMERO_CONTRATO: conta.codigo_beneficiario,
  });
  
  const result = await sicoobService.utils.testConnection();
  
  return c.json(result);
});

export default sicoob;
