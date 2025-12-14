// =============================================
// PLANAC ERP - IBPT API Routes
// Lei da Transparência Fiscal
// =============================================

import { Hono } from 'hono';
import {
  buscarPorNCM_D1,
  buscarPorNBS_D1,
  calcularTributos_D1,
  calcularTributosLote_D1,
  importarCSV_D1,
  obterMetadados_D1,
  contarRegistros_D1,
  limparRegistrosAntigos_D1,
} from '../services/ibpt/ibpt-d1-service';
import {
  gerarTextoLeiTransparencia,
  gerarTextoResumido,
} from '../services/ibpt/ibpt-service';

// Tipos do ambiente
interface Env {
  DB: D1Database;
  IBPT_TOKEN?: string;
  IBPT_CNPJ?: string;
}

const ibpt = new Hono<{ Bindings: Env }>();

// ===== CONSULTAS =====

/**
 * Consulta alíquota por NCM
 * GET /ibpt/ncm/:ncm?uf=PR&ex=01
 */
ibpt.get('/ncm/:ncm', async (c) => {
  try {
    const { ncm } = c.req.param();
    const { uf, ex } = c.req.query();
    
    if (!uf) {
      return c.json({ error: 'UF é obrigatório' }, 400);
    }
    
    const registro = await buscarPorNCM_D1(c.env.DB, ncm, uf, ex);
    
    if (!registro) {
      return c.json({ error: 'NCM não encontrado' }, 404);
    }
    
    return c.json(registro);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Consulta alíquota por NBS (serviços)
 * GET /ibpt/nbs/:nbs?uf=PR
 */
ibpt.get('/nbs/:nbs', async (c) => {
  try {
    const { nbs } = c.req.param();
    const { uf } = c.req.query();
    
    if (!uf) {
      return c.json({ error: 'UF é obrigatório' }, 400);
    }
    
    const registro = await buscarPorNBS_D1(c.env.DB, nbs, uf);
    
    if (!registro) {
      return c.json({ error: 'NBS não encontrado' }, 404);
    }
    
    return c.json(registro);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== CÁLCULOS =====

/**
 * Calcula tributos para um item
 * POST /ibpt/calcular
 * Body: { ncm, uf, valor, origem?, ex? }
 */
ibpt.post('/calcular', async (c) => {
  try {
    const { ncm, uf, valor, origem, ex } = await c.req.json();
    
    if (!ncm || !uf || valor === undefined) {
      return c.json({ error: 'ncm, uf e valor são obrigatórios' }, 400);
    }
    
    const calculo = await calcularTributos_D1(
      c.env.DB,
      ncm,
      uf,
      valor,
      origem || 0,
      ex
    );
    
    // Adicionar texto formatado
    const textoCompleto = gerarTextoLeiTransparencia(calculo);
    const textoResumido = gerarTextoResumido(calculo.total.valor, calculo.total.aliquota);
    
    return c.json({
      ...calculo,
      texto_nfe: textoCompleto,
      texto_cupom: textoResumido,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Calcula tributos em lote
 * POST /ibpt/calcular/lote
 * Body: { uf, itens: [{ id, ncm, valor, origem?, ex? }] }
 */
ibpt.post('/calcular/lote', async (c) => {
  try {
    const { uf, itens } = await c.req.json();
    
    if (!uf || !itens || !Array.isArray(itens)) {
      return c.json({ error: 'uf e itens são obrigatórios' }, 400);
    }
    
    const resultado = await calcularTributosLote_D1(c.env.DB, uf, itens);
    
    // Adicionar texto resumido
    const textoResumido = gerarTextoResumido(
      resultado.totais.tributos_total,
      resultado.totais.aliquota_media
    );
    
    return c.json({
      ...resultado,
      texto_cupom: textoResumido,
      vTotTrib: resultado.totais.tributos_total,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== IMPORTAÇÃO =====

/**
 * Importa tabela IBPT do CSV
 * POST /ibpt/importar
 * Body: { uf, csv } ou form-data com arquivo
 */
ibpt.post('/importar', async (c) => {
  try {
    const contentType = c.req.header('content-type') || '';
    
    let uf: string;
    let csv: string;
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      uf = formData.get('uf') as string;
      const arquivo = formData.get('arquivo') as File;
      
      if (!arquivo) {
        return c.json({ error: 'Arquivo CSV é obrigatório' }, 400);
      }
      
      csv = await arquivo.text();
    } else {
      const body = await c.req.json();
      uf = body.uf;
      csv = body.csv;
    }
    
    if (!uf || !csv) {
      return c.json({ error: 'uf e csv são obrigatórios' }, 400);
    }
    
    const resultado = await importarCSV_D1(c.env.DB, csv, uf);
    
    return c.json({
      success: true,
      uf: uf.toUpperCase(),
      registros_importados: resultado.registros,
      erros: resultado.erros.length > 0 ? resultado.erros.slice(0, 10) : [],
      total_erros: resultado.erros.length,
    }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== METADADOS =====

/**
 * Obtém metadados da tabela
 * GET /ibpt/metadados?uf=PR
 */
ibpt.get('/metadados', async (c) => {
  try {
    const { uf } = c.req.query();
    
    if (uf) {
      const metadados = await obterMetadados_D1(c.env.DB, uf);
      if (!metadados) {
        return c.json({ error: 'Tabela não encontrada para esta UF' }, 404);
      }
      return c.json(metadados);
    }
    
    // Listar todas as UFs
    const contagem = await contarRegistros_D1(c.env.DB);
    return c.json({ ufs: contagem });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Conta registros por UF
 * GET /ibpt/contagem?uf=PR
 */
ibpt.get('/contagem', async (c) => {
  try {
    const { uf } = c.req.query();
    const contagem = await contarRegistros_D1(c.env.DB, uf);
    return c.json({ contagem });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== MANUTENÇÃO =====

/**
 * Limpa registros antigos
 * DELETE /ibpt/antigos?dias=30
 */
ibpt.delete('/antigos', async (c) => {
  try {
    const { dias } = c.req.query();
    const diasNum = dias ? parseInt(dias) : 30;
    
    const removidos = await limparRegistrosAntigos_D1(c.env.DB, diasNum);
    
    return c.json({
      success: true,
      registros_removidos: removidos,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Health check do serviço IBPT
 * GET /ibpt/health
 */
ibpt.get('/health', async (c) => {
  try {
    // Testar conexão com D1
    const contagem = await contarRegistros_D1(c.env.DB);
    const totalRegistros = contagem.reduce((acc, item) => acc + item.total, 0);
    
    return c.json({
      status: 'ok',
      service: 'ibpt',
      database: 'connected',
      ufs_disponiveis: contagem.length,
      total_registros: totalRegistros,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return c.json({
      status: 'error',
      service: 'ibpt',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

export default ibpt;
