// =============================================
// PLANAC ERP - ADRC-ST API Routes
// =============================================
// Arquivo: src/api/src/routes/adrcst.routes.ts
// Endpoints para geracao do arquivo ADRC-ST (Parana)

import { Hono } from 'hono';
import { createADRCSTService } from '../services/adrcst';
import type { 
  CriarApuracaoRequest, 
  CalcularApuracaoRequest,
  StatusApuracao 
} from '../services/adrcst/types';

// Tipos do ambiente
interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
}

const adrcst = new Hono<{ Bindings: Env }>();

// Helper para criar o service
const getService = (env: Env) => createADRCSTService(env.DB, env.R2_BUCKET);

// =============================================
// CONFIGURACOES
// =============================================

/**
 * GET /adrcst/configuracoes/:empresa_id
 * Obtem configuracoes ADRC-ST da empresa
 */
adrcst.get('/configuracoes/:empresa_id', async (c) => {
  try {
    const { empresa_id } = c.req.param();
    const service = getService(c.env);
    const config = await service.obterConfiguracoes(empresa_id);
    
    if (!config) {
      return c.json({ 
        message: 'Configuracoes nao encontradas. Use POST para criar.',
        defaults: {
          opcao_padrao_r1200: 0,
          opcao_padrao_r1300: 0,
          opcao_padrao_r1400: 0,
          opcao_padrao_r1500: 0,
        }
      }, 404);
    }
    
    return c.json(config);
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

/**
 * POST /adrcst/configuracoes
 * Cria ou atualiza configuracoes ADRC-ST
 */
adrcst.post('/configuracoes', async (c) => {
  try {
    const service = getService(c.env);
    const body = await c.req.json();
    
    if (!body.empresa_id) {
      return c.json({ error: 'empresa_id e obrigatorio' }, 400);
    }
    
    const config = await service.salvarConfiguracoes(body);
    return c.json(config, 201);
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// APURACOES
// =============================================

/**
 * GET /adrcst/apuracoes
 * Lista apuracoes de uma empresa
 */
adrcst.get('/apuracoes', async (c) => {
  try {
    const service = getService(c.env);
    const { empresa_id, filial_id, ano, status, limit, offset } = c.req.query();
    
    if (!empresa_id) {
      return c.json({ error: 'empresa_id e obrigatorio' }, 400);
    }
    
    const resultado = await service.listarApuracoes(empresa_id, {
      filial_id,
      ano: ano ? parseInt(ano) : undefined,
      status: status as StatusApuracao,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    
    return c.json(resultado);
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

/**
 * GET /adrcst/apuracoes/:id
 * Obtem uma apuracao por ID
 */
adrcst.get('/apuracoes/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const apuracao = await service.obterApuracao(id);
    
    if (!apuracao) {
      return c.json({ error: 'Apuracao nao encontrada' }, 404);
    }
    
    return c.json(apuracao);
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

/**
 * POST /adrcst/apuracoes
 * Cria uma nova apuracao
 */
adrcst.post('/apuracoes', async (c) => {
  try {
    const service = getService(c.env);
    const body = await c.req.json() as CriarApuracaoRequest;
    
    if (!body.empresa_id) {
      return c.json({ error: 'empresa_id e obrigatorio' }, 400);
    }
    if (!body.mes || !body.ano) {
      return c.json({ error: 'mes e ano sao obrigatorios' }, 400);
    }
    if (body.mes < 1 || body.mes > 12) {
      return c.json({ error: 'mes deve estar entre 1 e 12' }, 400);
    }
    if (body.ano < 2019 || body.ano > 2100) {
      return c.json({ error: 'ano invalido' }, 400);
    }
    
    const apuracao = await service.criarApuracao(body);
    return c.json(apuracao, 201);
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

/**
 * DELETE /adrcst/apuracoes/:id
 * Exclui uma apuracao (apenas rascunho)
 */
adrcst.delete('/apuracoes/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    await service.excluirApuracao(id);
    return c.json({ success: true, message: 'Apuracao excluida' });
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

/**
 * POST /adrcst/apuracoes/:id/calcular
 * Calcula a apuracao coletando dados de entradas e saidas
 */
adrcst.post('/apuracoes/:id/calcular', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const body = await c.req.json() as Partial<CalcularApuracaoRequest>;
    
    const apuracao = await service.calcularApuracao({
      apuracao_id: id,
      retroagir_entradas: body.retroagir_entradas,
      meses_retroacao: body.meses_retroacao,
    });
    
    return c.json({
      success: true,
      message: 'Apuracao calculada com sucesso',
      apuracao,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

/**
 * POST /adrcst/apuracoes/:id/gerar-arquivo
 * Gera o arquivo TXT ADRC-ST
 */
adrcst.post('/apuracoes/:id/gerar-arquivo', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    
    const resultado = await service.gerarArquivo(id);
    
    return c.json({
      success: true,
      message: 'Arquivo gerado com sucesso',
      arquivo: {
        nome: resultado.nome,
        total_linhas: resultado.totalLinhas,
        hash: resultado.hash,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

/**
 * GET /adrcst/apuracoes/:id/download
 * Baixa o arquivo TXT ADRC-ST
 */
adrcst.get('/apuracoes/:id/download', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    
    const resultado = await service.gerarArquivo(id);
    
    return new Response(resultado.conteudo, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${resultado.nome}"`,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

/**
 * POST /adrcst/apuracoes/:id/protocolo
 * Registra o protocolo recebido do portal Receita/PR
 */
adrcst.post('/apuracoes/:id/protocolo', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const body = await c.req.json();
    
    if (!body.protocolo) {
      return c.json({ error: 'protocolo e obrigatorio' }, 400);
    }
    
    const apuracao = await service.registrarProtocolo(id, body.protocolo, body.data_protocolo);
    
    return c.json({
      success: true,
      message: 'Protocolo registrado com sucesso',
      apuracao,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// ITENS DA APURACAO
// =============================================

/**
 * GET /adrcst/apuracoes/:id/itens
 * Lista itens de uma apuracao
 */
adrcst.get('/apuracoes/:id/itens', async (c) => {
  try {
    const { id } = c.req.param();
    const db = c.env.DB;
    
    const itens = await db.prepare(`
      SELECT * FROM adrcst_itens WHERE apuracao_id = ? ORDER BY cod_item
    `).bind(id).all();
    
    return c.json({
      apuracao_id: id,
      total: itens.results.length,
      itens: itens.results,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

/**
 * GET /adrcst/apuracoes/:id/itens/:item_id
 * Obtem detalhes de um item
 */
adrcst.get('/apuracoes/:id/itens/:item_id', async (c) => {
  try {
    const { item_id } = c.req.param();
    const db = c.env.DB;
    
    const item = await db.prepare(`
      SELECT * FROM adrcst_itens WHERE id = ?
    `).bind(item_id).first();
    
    if (!item) {
      return c.json({ error: 'Item nao encontrado' }, 404);
    }
    
    // Busca documentos do item
    const documentos = await db.prepare(`
      SELECT * FROM adrcst_documentos WHERE item_id = ? ORDER BY tipo_registro, dt_doc
    `).bind(item_id).all();
    
    return c.json({
      item,
      documentos: documentos.results,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// VALIDACOES
// =============================================

/**
 * GET /adrcst/apuracoes/:id/validacoes
 * Lista validacoes/alertas de uma apuracao
 */
adrcst.get('/apuracoes/:id/validacoes', async (c) => {
  try {
    const { id } = c.req.param();
    const { tipo } = c.req.query();
    const db = c.env.DB;
    
    let query = 'SELECT * FROM adrcst_validacoes WHERE apuracao_id = ?';
    const params: string[] = [id];
    
    if (tipo) {
      query += ' AND tipo = ?';
      params.push(tipo);
    }
    
    query += ' ORDER BY tipo, codigo';
    
    const validacoes = await db.prepare(query).bind(...params).all();
    
    return c.json({
      apuracao_id: id,
      total: validacoes.results.length,
      validacoes: validacoes.results,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// ARQUIVOS GERADOS
// =============================================

/**
 * GET /adrcst/apuracoes/:id/arquivos
 * Lista arquivos gerados de uma apuracao
 */
adrcst.get('/apuracoes/:id/arquivos', async (c) => {
  try {
    const { id } = c.req.param();
    const db = c.env.DB;
    
    const arquivos = await db.prepare(`
      SELECT * FROM adrcst_arquivos WHERE apuracao_id = ? ORDER BY created_at DESC
    `).bind(id).all();
    
    return c.json({
      apuracao_id: id,
      total: arquivos.results.length,
      arquivos: arquivos.results,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// LOGS
// =============================================

/**
 * GET /adrcst/logs
 * Lista logs de operacoes ADRC-ST
 */
adrcst.get('/logs', async (c) => {
  try {
    const { empresa_id, apuracao_id, operacao, limit, offset } = c.req.query();
    const db = c.env.DB;
    
    let query = 'SELECT * FROM adrcst_logs WHERE 1=1';
    const params: (string | number)[] = [];
    
    if (empresa_id) {
      query += ' AND empresa_id = ?';
      params.push(empresa_id);
    }
    if (apuracao_id) {
      query += ' AND apuracao_id = ?';
      params.push(apuracao_id);
    }
    if (operacao) {
      query += ' AND operacao = ?';
      params.push(operacao);
    }
    
    query += ' ORDER BY created_at DESC';
    query += ` LIMIT ${limit ? parseInt(limit) : 100}`;
    query += ` OFFSET ${offset ? parseInt(offset) : 0}`;
    
    const logs = await db.prepare(query).bind(...params).all();
    
    return c.json({
      total: logs.results.length,
      logs: logs.results,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// MVA
// =============================================

/**
 * GET /adrcst/mva
 * Lista tabela de MVA
 */
adrcst.get('/mva', async (c) => {
  try {
    const { cest, ncm, limit, offset } = c.req.query();
    const db = c.env.DB;
    
    let query = 'SELECT * FROM mva_tabela WHERE ativo = 1';
    const params: string[] = [];
    
    if (cest) {
      query += ' AND cest = ?';
      params.push(cest);
    }
    if (ncm) {
      query += ' AND ncm LIKE ?';
      params.push(`${ncm}%`);
    }
    
    query += ' ORDER BY cest, ncm';
    query += ` LIMIT ${limit ? parseInt(limit) : 100}`;
    query += ` OFFSET ${offset ? parseInt(offset) : 0}`;
    
    const mvas = await db.prepare(query).bind(...params).all();
    
    return c.json({
      total: mvas.results.length,
      mvas: mvas.results,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

/**
 * POST /adrcst/mva
 * Adiciona ou atualiza MVA
 */
adrcst.post('/mva', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json();
    
    if (!body.cest || !body.descricao || body.mva_original === undefined) {
      return c.json({ error: 'cest, descricao e mva_original sao obrigatorios' }, 400);
    }
    
    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO mva_tabela (id, cest, ncm, descricao, mva_original, mva_ajustada_4, mva_ajustada_7, mva_ajustada_12, vigencia_inicio, resolucao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.cest,
      body.ncm || null,
      body.descricao,
      body.mva_original,
      body.mva_ajustada_4 || null,
      body.mva_ajustada_7 || null,
      body.mva_ajustada_12 || null,
      body.vigencia_inicio || new Date().toISOString().split('T')[0],
      body.resolucao || null
    ).run();
    
    const mva = await db.prepare('SELECT * FROM mva_tabela WHERE id = ?').bind(id).first();
    return c.json(mva, 201);
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// CODIGOS DE AJUSTE EFD
// =============================================

/**
 * GET /adrcst/codigos-ajuste
 * Retorna os codigos de ajuste EFD para recuperacao/ressarcimento
 */
adrcst.get('/codigos-ajuste', async (c) => {
  return c.json({
    recuperacao: {
      r1200: { codigo: 'PR020170', descricao: 'Recuperacao ICMS-ST saidas consumidor final' },
      r1300: { codigo: 'PR020211', descricao: 'Recuperacao ICMS-ST saidas interestaduais' },
      r1400: { codigo: 'PR020171', descricao: 'Recuperacao ICMS-ST saidas art. 119' },
      r1500: { codigo: 'PR020222', descricao: 'Recuperacao ICMS-ST saidas Simples Nacional' },
    },
    complementacao: {
      icms: { codigo: 'PR000092', descricao: 'Complementacao ICMS-ST' },
      fecop: { codigo: '5037', descricao: 'GR-PR para complementacao FECOP' },
    },
    instrucoes: {
      conta_grafica: 'Lancar no Registro E111 da EFD informando o numero do Protocolo ADRC-ST',
      ressarcimento: 'Emitir NF com CFOP 5.603 ou 6.603 apos autorizacao do Fisco',
    },
  });
});

export default adrcst;
