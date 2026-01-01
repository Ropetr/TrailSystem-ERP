// ============================================
// PLANAC ERP - Rotas de Integração Sisprime
// Webhooks e operações de boletos via API
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';
import {
  createSisprimeService,
  processWebhook,
  processTituloData,
  processLancamentoData,
  generateTituloUpdate,
  generateRetornoItem,
  generateHash,
  decryptWebhookPayload,
  mapErpToSisprime,
  validarTitulo,
  type WebhookConfig,
} from '../services/sisprime';

const sisprime = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ==========================================
// SCHEMAS
// ==========================================

const enviarBoletoSchema = z.object({
  conta_id: z.string().uuid(),
  numero_documento: z.string().max(10),
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
});

// ==========================================
// WEBHOOK - Recebe atualizações do Sisprime
// ==========================================

/**
 * POST /sisprime/webhook/:contaId
 * 
 * Endpoint para receber webhooks do Sisprime.
 * O contaId na URL identifica qual conta bancária está recebendo o webhook.
 * O payload é criptografado com AES-256-CBC.
 * 
 * Headers esperados:
 * - Content-Type: application/json ou text/plain
 * 
 * Body:
 * - Payload criptografado no formato "IV::ENCRYPTED_DATA"
 */
sisprime.post('/webhook/:contaId', async (c) => {
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
      WHERE bc.id = ? AND bb.codigo = '084'
    `).bind(contaId).first<{
      id: string;
      empresa_id: string;
      webhook_symmetric_key: string | null;
      webhook_ativo: number;
      banco_codigo: string;
    }>();
    
    if (!conta) {
      console.error(`[Sisprime Webhook] Conta não encontrada: ${contaId}`);
      return c.json({ success: false, error: 'Conta não encontrada' }, 404);
    }
    
    if (!conta.webhook_ativo) {
      console.warn(`[Sisprime Webhook] Webhook inativo para conta: ${contaId}`);
      return c.json({ success: false, error: 'Webhook inativo' }, 403);
    }
    
    if (!conta.webhook_symmetric_key) {
      console.error(`[Sisprime Webhook] Chave simétrica não configurada: ${contaId}`);
      return c.json({ success: false, error: 'Chave simétrica não configurada' }, 500);
    }
    
    // Obter payload criptografado
    const encryptedPayload = await c.req.text();
    
    if (!encryptedPayload || !encryptedPayload.includes('::')) {
      console.error(`[Sisprime Webhook] Payload inválido`);
      return c.json({ success: false, error: 'Payload inválido' }, 400);
    }
    
    // Gerar hash para deduplicação
    const payloadHash = await generateHash(encryptedPayload);
    
    // Verificar se já processamos este webhook
    const existingWebhook = await c.env.DB.prepare(`
      SELECT id FROM pix_webhooks 
      WHERE payload_hash = ? AND empresa_id = ?
    `).bind(payloadHash, conta.empresa_id).first();
    
    if (existingWebhook) {
      console.log(`[Sisprime Webhook] Webhook duplicado ignorado: ${payloadHash}`);
      return c.json({ success: true, message: 'Webhook já processado' });
    }
    
    // Decriptar payload
    let decryptedJson: string;
    try {
      decryptedJson = await decryptWebhookPayload(
        encryptedPayload,
        conta.webhook_symmetric_key
      );
    } catch (decryptError) {
      console.error(`[Sisprime Webhook] Erro ao decriptar:`, decryptError);
      return c.json({ success: false, error: 'Erro ao decriptar payload' }, 400);
    }
    
    // Parse JSON
    let payload;
    try {
      payload = JSON.parse(decryptedJson);
    } catch (parseError) {
      console.error(`[Sisprime Webhook] Erro ao parsear JSON:`, parseError);
      return c.json({ success: false, error: 'JSON inválido' }, 400);
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
      null, // configuracao_id não se aplica para boletos
      'boleto',
      'sisprime_webhook',
      payloadHash,
      'recebido',
      payload.dados_titulo?.id_boleto || null
    ).run();
    
    // Processar dados do título
    const { dados_titulo, lancamentos } = payload;
    
    if (!dados_titulo) {
      await c.env.DB.prepare(`
        UPDATE pix_webhooks SET status = 'erro', erro_mensagem = ? WHERE id = ?
      `).bind('Payload sem dados_titulo', webhookId).run();
      
      return c.json({ success: false, error: 'Payload sem dados_titulo' }, 400);
    }
    
    // Processar título
    const tituloProcessado = processTituloData(dados_titulo);
    const lancamentosProcessados = (lancamentos || []).map(processLancamentoData);
    
    // Buscar título no banco de dados
    const titulo = await c.env.DB.prepare(`
      SELECT id, status, valor_documento FROM boleto_titulos
      WHERE empresa_id = ? AND conta_id = ? AND (
        id_externo = ? OR nosso_numero = ?
      )
    `).bind(
      conta.empresa_id,
      conta.id,
      tituloProcessado.id_boleto,
      tituloProcessado.nosso_numero
    ).first<{
      id: string;
      status: string;
      valor_documento: number;
    }>();
    
    if (!titulo) {
      console.warn(`[Sisprime Webhook] Título não encontrado: ${tituloProcessado.id_boleto}`);
      
      await c.env.DB.prepare(`
        UPDATE pix_webhooks SET status = 'ignorado', erro_mensagem = ? WHERE id = ?
      `).bind('Título não encontrado no sistema', webhookId).run();
      
      // Retornar sucesso para o Sisprime não reenviar
      return c.json({ success: true, message: 'Título não encontrado' });
    }
    
    // Gerar dados de atualização
    const updateData = generateTituloUpdate(tituloProcessado, lancamentosProcessados);
    
    // Atualizar título
    await c.env.DB.prepare(`
      UPDATE boleto_titulos SET
        status = ?,
        codigo_ocorrencia = ?,
        motivo_ocorrencia = ?,
        valor_pago = COALESCE(?, valor_pago),
        data_pagamento = COALESCE(?, data_pagamento),
        data_credito = COALESCE(?, data_credito),
        codigo_barras = COALESCE(?, codigo_barras),
        linha_digitavel = COALESCE(?, linha_digitavel),
        qr_code_pix = COALESCE(?, qr_code_pix),
        id_externo = COALESCE(?, id_externo),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      updateData.status,
      updateData.codigo_situacao,
      updateData.motivo_ocorrencia,
      updateData.valor_pago,
      updateData.data_pagamento,
      updateData.data_credito,
      updateData.codigo_barras,
      updateData.linha_digitavel,
      updateData.qr_code,
      tituloProcessado.id_boleto,
      titulo.id
    ).run();
    
    // Registrar lançamentos como itens de retorno
    for (const lancamento of lancamentosProcessados) {
      const retornoItem = generateRetornoItem(tituloProcessado, lancamento);
      
      // Verificar se já existe este lançamento (por identificador)
      const existingLancamento = await c.env.DB.prepare(`
        SELECT id FROM boleto_retornos_itens
        WHERE titulo_id = ? AND nosso_numero = ? AND data_ocorrencia = ? AND valor_pago = ?
      `).bind(
        titulo.id,
        retornoItem.nosso_numero,
        retornoItem.data_ocorrencia,
        retornoItem.valor_pago
      ).first();
      
      if (!existingLancamento) {
        const itemId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO boleto_retornos_itens (
            id, retorno_id, titulo_id, nosso_numero, seu_numero,
            codigo_ocorrencia, descricao_ocorrencia, valor_titulo,
            valor_pago, valor_credito, data_ocorrencia, data_credito,
            data_pagamento, motivos_rejeicao, processado, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
        `).bind(
          itemId,
          null, // retorno_id - não temos arquivo de retorno, é webhook
          titulo.id,
          retornoItem.nosso_numero,
          null, // seu_numero
          retornoItem.codigo_ocorrencia,
          retornoItem.descricao_ocorrencia,
          retornoItem.valor_titulo,
          retornoItem.valor_pago,
          retornoItem.valor_credito,
          retornoItem.data_ocorrencia,
          retornoItem.data_credito,
          retornoItem.data_pagamento,
          retornoItem.motivos_rejeicao
        ).run();
      }
    }
    
    // Registrar log de operação
    await c.env.DB.prepare(`
      INSERT INTO boleto_logs (
        id, empresa_id, titulo_id, operacao, descricao, sucesso, created_at
      ) VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(
      crypto.randomUUID(),
      conta.empresa_id,
      titulo.id,
      'webhook',
      `Webhook Sisprime: ${tituloProcessado.descricao_situacao} - ${lancamentosProcessados.length} lançamento(s)`
    ).run();
    
    // Atualizar status do webhook
    await c.env.DB.prepare(`
      UPDATE pix_webhooks SET 
        status = 'processado',
        processed_at = datetime('now')
      WHERE id = ?
    `).bind(webhookId).run();
    
    const processingTime = Date.now() - startTime;
    console.log(`[Sisprime Webhook] Processado em ${processingTime}ms: ${tituloProcessado.id_boleto} - ${tituloProcessado.descricao_situacao}`);
    
    return c.json({
      success: true,
      message: 'Webhook processado',
      data: {
        id_boleto: tituloProcessado.id_boleto,
        situacao: tituloProcessado.descricao_situacao,
        lancamentos: lancamentosProcessados.length,
      }
    });
    
  } catch (error) {
    console.error(`[Sisprime Webhook] Erro:`, error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno'
    }, 500);
  }
});

// ==========================================
// ROTAS AUTENTICADAS
// ==========================================

sisprime.use('/*', requireAuth());

// ==========================================
// ENVIAR BOLETO
// ==========================================

/**
 * POST /sisprime/boletos
 * 
 * Registra um novo boleto no Sisprime via API
 */
sisprime.post('/boletos', requirePermission('financeiro', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();
  
  const validation = enviarBoletoSchema.safeParse(body);
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
      bb.codigo as banco_codigo,
      bb.url_homologacao,
      bb.url_producao
    FROM boleto_contas bc
    JOIN boleto_bancos bb ON bc.banco_id = bb.id
    WHERE bc.id = ? AND bc.empresa_id = ? AND bb.codigo = '084'
  `).bind(data.conta_id, usuario.empresa_id).first<{
    id: string;
    empresa_id: string;
    api_client_id: string;
    api_client_secret_encrypted: string;
    api_client_secret_iv: string;
    ambiente: string;
    nosso_numero_atual: number;
    digitos_nosso_numero: number;
    banco_codigo: string;
  }>();
  
  if (!conta) {
    return c.json({ success: false, error: 'Conta Sisprime não encontrada' }, 404);
  }
  
  if (!conta.api_client_id || !conta.api_client_secret_encrypted) {
    return c.json({ success: false, error: 'Credenciais Sisprime não configuradas' }, 400);
  }
  
  // Decriptar chave de acesso da conta
  // TODO: Implementar decriptação das credenciais
  // Por enquanto, assumimos que api_client_id = chave_geral e api_client_secret = chave_conta
  
  // Validar dados do título
  const tituloSisprime = mapErpToSisprime({
    ...data,
    nosso_numero: data.nosso_numero || String(conta.nosso_numero_atual + 1).padStart(conta.digitos_nosso_numero, '0'),
  });
  
  const errosValidacao = validarTitulo(tituloSisprime);
  if (errosValidacao.length > 0) {
    return c.json({
      success: false,
      error: 'Dados do título inválidos',
      details: errosValidacao
    }, 400);
  }
  
  // Criar serviço Sisprime
  const sisprimeService = createSisprimeService({
    SISPRIME_CHAVE_ACESSO_GERAL: conta.api_client_id,
    SISPRIME_CHAVE_ACESSO_CONTA: conta.api_client_secret_encrypted, // TODO: decriptar
    SISPRIME_AMBIENTE: conta.ambiente as 'homologacao' | 'producao',
  });
  
  // Enviar boleto
  const response = await sisprimeService.boleto.enviar(tituloSisprime);
  
  if (response.status !== 'sucesso' || !response.dados) {
    // Registrar erro
    await c.env.DB.prepare(`
      INSERT INTO boleto_logs (
        id, empresa_id, operacao, descricao, sucesso, erro_mensagem, created_at
      ) VALUES (?, ?, ?, ?, 0, ?, datetime('now'))
    `).bind(
      crypto.randomUUID(),
      usuario.empresa_id,
      'registro_api',
      'Erro ao registrar boleto no Sisprime',
      response.mensagem || JSON.stringify(response.erros)
    ).run();
    
    return c.json({
      success: false,
      error: response.mensagem || 'Erro ao registrar boleto',
      details: response.erros
    }, 400);
  }
  
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
    response.dados.nosso_numero,
    data.numero_documento,
    data.numero_documento,
    tituloSisprime.sacado_tipo,
    tituloSisprime.sacado_cpf_cnpj,
    tituloSisprime.sacado_nome,
    tituloSisprime.sacado_endereco,
    tituloSisprime.sacado_numero || null,
    tituloSisprime.sacado_complemento || null,
    tituloSisprime.sacado_bairro,
    tituloSisprime.sacado_cidade,
    tituloSisprime.sacado_uf,
    tituloSisprime.sacado_cep,
    tituloSisprime.sacado_email || null,
    tituloSisprime.sacado_telefone || null,
    data.valor_documento,
    data.valor_abatimento || 0,
    data.data_emissao,
    data.data_vencimento,
    data.percentual_multa || 0,
    data.percentual_juros || 0,
    data.dias_protesto || 0,
    response.dados.codigo_barras,
    response.dados.linha_digitavel,
    response.dados.qr_code || null,
    response.dados.id_boleto,
    data.cliente_id || null,
    data.conta_receber_id || null,
    data.venda_id || null
  ).run();
  
  // Atualizar sequência do nosso número
  await c.env.DB.prepare(`
    UPDATE boleto_contas SET
      nosso_numero_atual = nosso_numero_atual + 1,
      updated_at = datetime('now')
    WHERE id = ?
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
    `Boleto registrado no Sisprime: ${response.dados.nosso_numero}`
  ).run();
  
  // Registrar auditoria
  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'boleto_titulos',
    entidade_id: tituloId,
    dados_novos: {
      nosso_numero: response.dados.nosso_numero,
      id_boleto: response.dados.id_boleto,
      valor: data.valor_documento,
    }
  });
  
  return c.json({
    success: true,
    data: {
      id: tituloId,
      id_boleto: response.dados.id_boleto,
      nosso_numero: response.dados.nosso_numero,
      codigo_barras: response.dados.codigo_barras,
      linha_digitavel: response.dados.linha_digitavel,
      qr_code: response.dados.qr_code,
    }
  }, 201);
});

// ==========================================
// CONSULTAR BOLETO
// ==========================================

/**
 * GET /sisprime/boletos/:id
 * 
 * Consulta um boleto no Sisprime via API
 */
sisprime.get('/boletos/:id', requirePermission('financeiro', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  
  // Buscar título
  const titulo = await c.env.DB.prepare(`
    SELECT 
      bt.*,
      bc.api_client_id,
      bc.api_client_secret_encrypted,
      bc.ambiente
    FROM boleto_titulos bt
    JOIN boleto_contas bc ON bt.conta_id = bc.id
    WHERE bt.id = ? AND bt.empresa_id = ?
  `).bind(id, usuario.empresa_id).first<{
    id: string;
    id_externo: string;
    api_client_id: string;
    api_client_secret_encrypted: string;
    ambiente: string;
  }>();
  
  if (!titulo) {
    return c.json({ success: false, error: 'Boleto não encontrado' }, 404);
  }
  
  if (!titulo.id_externo) {
    return c.json({ success: false, error: 'Boleto não registrado no Sisprime' }, 400);
  }
  
  // Criar serviço Sisprime
  const sisprimeService = createSisprimeService({
    SISPRIME_CHAVE_ACESSO_GERAL: titulo.api_client_id,
    SISPRIME_CHAVE_ACESSO_CONTA: titulo.api_client_secret_encrypted, // TODO: decriptar
    SISPRIME_AMBIENTE: titulo.ambiente as 'homologacao' | 'producao',
  });
  
  // Consultar boleto
  const response = await sisprimeService.boleto.consultar(titulo.id_externo);
  
  if (response.status !== 'sucesso' || !response.dados) {
    return c.json({
      success: false,
      error: response.mensagem || 'Erro ao consultar boleto'
    }, 400);
  }
  
  // Atualizar dados locais se houver mudança
  const dadosErp = sisprimeService.boleto.mapToErp(response.dados);
  
  await c.env.DB.prepare(`
    UPDATE boleto_titulos SET
      status = ?,
      codigo_ocorrencia = ?,
      valor_pago = COALESCE(?, valor_pago),
      data_pagamento = COALESCE(?, data_pagamento),
      data_credito = COALESCE(?, data_credito),
      qr_code_pix = COALESCE(?, qr_code_pix),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    dadosErp.status,
    dadosErp.codigo_situacao,
    dadosErp.valor_pago,
    dadosErp.data_pagamento,
    dadosErp.data_credito,
    dadosErp.qr_code,
    id
  ).run();
  
  return c.json({
    success: true,
    data: {
      ...dadosErp,
      titulo_id: id,
    }
  });
});

// ==========================================
// TESTAR CONEXÃO
// ==========================================

/**
 * POST /sisprime/testar-conexao
 * 
 * Testa a conexão com a API Sisprime
 */
sisprime.post('/testar-conexao', requirePermission('financeiro', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const { conta_id } = await c.req.json();
  
  if (!conta_id) {
    return c.json({ success: false, error: 'conta_id é obrigatório' }, 400);
  }
  
  // Buscar conta
  const conta = await c.env.DB.prepare(`
    SELECT 
      bc.api_client_id,
      bc.api_client_secret_encrypted,
      bc.ambiente,
      bb.codigo as banco_codigo
    FROM boleto_contas bc
    JOIN boleto_bancos bb ON bc.banco_id = bb.id
    WHERE bc.id = ? AND bc.empresa_id = ? AND bb.codigo = '084'
  `).bind(conta_id, usuario.empresa_id).first<{
    api_client_id: string;
    api_client_secret_encrypted: string;
    ambiente: string;
    banco_codigo: string;
  }>();
  
  if (!conta) {
    return c.json({ success: false, error: 'Conta Sisprime não encontrada' }, 404);
  }
  
  if (!conta.api_client_id || !conta.api_client_secret_encrypted) {
    return c.json({ success: false, error: 'Credenciais não configuradas' }, 400);
  }
  
  // Criar serviço e testar
  const sisprimeService = createSisprimeService({
    SISPRIME_CHAVE_ACESSO_GERAL: conta.api_client_id,
    SISPRIME_CHAVE_ACESSO_CONTA: conta.api_client_secret_encrypted,
    SISPRIME_AMBIENTE: conta.ambiente as 'homologacao' | 'producao',
  });
  
  const connected = await sisprimeService.utils.testConnection();
  
  return c.json({
    success: connected,
    message: connected ? 'Conexão estabelecida com sucesso' : 'Falha na conexão',
    ambiente: conta.ambiente,
  });
});

export default sisprime;
