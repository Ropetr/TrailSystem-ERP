// =============================================
// PLANAC ERP - Rotas IBPT (Lei da Transparência)
// =============================================
// Lei 12.741 - Informação de Tributos em Documentos Fiscais
// Atualizado: 26/12/2025 - Adaptado para API Unificada

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';
import { 
  IBPTApiService, 
  IBPTService, 
  IBPTCSVImporter,
  IBPTAutoUpdateJob 
} from '../services/ibpt';

const ibpt = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware de autenticação para todas as rotas
ibpt.use('/*', requireAuth());

// =============================================
// CONSULTAS DE ALÍQUOTAS
// =============================================

// GET /ibpt/consultar/:ncm - Consultar alíquota por NCM
ibpt.get('/consultar/:ncm', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const { ncm } = c.req.param();
    const { ex, uf } = c.req.query();
    
    const service = new IBPTApiService(c.env.DB_IBPT, c.env.KV_CACHE);
    const resultado = await service.consultarNCM(ncm, ex, uf || 'PR');
    
    if (!resultado) {
      return c.json({
        success: false,
        error: 'NCM não encontrado na base IBPT'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: resultado
    });
  } catch (error: any) {
    console.error('[IBPT] Erro ao consultar NCM:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao consultar NCM'
    }, 500);
  }
});

// GET /ibpt/consultar/lote - Consultar múltiplos NCMs
ibpt.post('/consultar/lote', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const { ncms, uf } = await c.req.json();
    
    if (!Array.isArray(ncms) || ncms.length === 0) {
      return c.json({
        success: false,
        error: 'Lista de NCMs inválida'
      }, 400);
    }
    
    if (ncms.length > 100) {
      return c.json({
        success: false,
        error: 'Máximo de 100 NCMs por consulta'
      }, 400);
    }
    
    const service = new IBPTApiService(c.env.DB_IBPT, c.env.KV_CACHE);
    const resultados = await Promise.all(
      ncms.map(ncm => service.consultarNCM(ncm, undefined, uf || 'PR'))
    );
    
    return c.json({
      success: true,
      data: resultados.filter(Boolean),
      total: resultados.filter(Boolean).length
    });
  } catch (error: any) {
    console.error('[IBPT] Erro ao consultar lote:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao consultar lote'
    }, 500);
  }
});

// =============================================
// CACHE E ATUALIZAÇÃO
// =============================================

// GET /ibpt/cache/status - Status do cache
ibpt.get('/cache/status', requirePermission('fiscal', 'configurar'), async (c) => {
  try {
    const service = new IBPTService(c.env.DB_IBPT);
    const status = await service.getStatusCache();
    
    return c.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('[IBPT] Erro ao obter status:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao obter status'
    }, 500);
  }
});

// POST /ibpt/cache/atualizar - Forçar atualização
ibpt.post('/cache/atualizar', requirePermission('fiscal', 'configurar'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const job = new IBPTAutoUpdateJob({
      DB_IBPT: c.env.DB_IBPT,
      KV_CACHE: c.env.KV_CACHE,
      EMAIL_API_KEY: c.env.EMAIL_API_KEY,
      WHATSAPP_API_KEY: c.env.WHATSAPP_API_KEY
    });
    
    const resultado = await job.executar();
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'atualizar_ibpt',
      tabela: 'ibpt_cache',
      dados_novos: { resultado }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'Tabela IBPT atualizada com sucesso'
    });
  } catch (error: any) {
    console.error('[IBPT] Erro ao atualizar:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao atualizar tabela IBPT'
    }, 500);
  }
});

// POST /ibpt/cache/limpar - Limpar cache
ibpt.post('/cache/limpar', requirePermission('fiscal', 'configurar'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const service = new IBPTService(c.env.DB_IBPT);
    await service.limparCache();
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'limpar_cache_ibpt',
      tabela: 'ibpt_cache',
      dados_novos: {}
    });
    
    return c.json({
      success: true,
      message: 'Cache IBPT limpo com sucesso'
    });
  } catch (error: any) {
    console.error('[IBPT] Erro ao limpar cache:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao limpar cache'
    }, 500);
  }
});

// =============================================
// IMPORTAÇÃO CSV
// =============================================

// POST /ibpt/importar - Importar arquivo CSV
ibpt.post('/importar', requirePermission('fiscal', 'configurar'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const contentType = c.req.header('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return c.json({
        success: false,
        error: 'Content-Type deve ser multipart/form-data'
      }, 400);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('arquivo') as File;
    
    if (!file) {
      return c.json({
        success: false,
        error: 'Arquivo CSV não enviado'
      }, 400);
    }
    
    const csvContent = await file.text();
    const importer = new IBPTCSVImporter(c.env.DB_IBPT);
    const resultado = await importer.importar(csvContent);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'importar_ibpt',
      tabela: 'ibpt_aliquotas',
      dados_novos: {
        arquivo: file.name,
        registros: resultado.importados
      }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: `${resultado.importados} registros importados`
    });
  } catch (error: any) {
    console.error('[IBPT] Erro ao importar CSV:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao importar CSV'
    }, 500);
  }
});

// GET /ibpt/importacoes - Histórico de importações
ibpt.get('/importacoes', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const { page = '1', limit = '20' } = c.req.query();
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const resultado = await c.env.DB_IBPT.prepare(`
      SELECT * FROM ibpt_importacoes 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(parseInt(limit), offset).all();
    
    const total = await c.env.DB_IBPT.prepare(`
      SELECT COUNT(*) as total FROM ibpt_importacoes
    `).first<{ total: number }>();
    
    return c.json({
      success: true,
      data: resultado.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total?.total || 0,
        pages: Math.ceil((total?.total || 0) / parseInt(limit))
      }
    });
  } catch (error: any) {
    console.error('[IBPT] Erro ao listar importações:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao listar importações'
    }, 500);
  }
});

// =============================================
// ESTATÍSTICAS
// =============================================

// GET /ibpt/estatisticas - Estatísticas gerais
ibpt.get('/estatisticas', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const stats = await c.env.DB_IBPT.prepare(`
      SELECT 
        COUNT(*) as total_registros,
        COUNT(DISTINCT ncm) as total_ncms,
        MIN(vigencia_inicio) as vigencia_mais_antiga,
        MAX(vigencia_fim) as vigencia_mais_recente,
        AVG(nacional_federal + importados_federal + estadual + municipal) as carga_media
      FROM ibpt_aliquotas
      WHERE vigencia_fim >= date('now')
    `).first();
    
    const ultimaAtualizacao = await c.env.DB_IBPT.prepare(`
      SELECT created_at FROM ibpt_importacoes 
      ORDER BY created_at DESC LIMIT 1
    `).first<{ created_at: string }>();
    
    return c.json({
      success: true,
      data: {
        ...stats,
        ultima_atualizacao: ultimaAtualizacao?.created_at
      }
    });
  } catch (error: any) {
    console.error('[IBPT] Erro ao obter estatísticas:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao obter estatísticas'
    }, 500);
  }
});

// GET /ibpt/vencimentos - Verificar vencimentos próximos
ibpt.get('/vencimentos', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const { dias = '30' } = c.req.query();
    
    const vencimentos = await c.env.DB_IBPT.prepare(`
      SELECT 
        ncm,
        descricao,
        vigencia_fim,
        julianday(vigencia_fim) - julianday('now') as dias_restantes
      FROM ibpt_aliquotas
      WHERE vigencia_fim BETWEEN date('now') AND date('now', '+' || ? || ' days')
      GROUP BY ncm
      ORDER BY vigencia_fim ASC
      LIMIT 100
    `).bind(parseInt(dias)).all();
    
    return c.json({
      success: true,
      data: vencimentos.results
    });
  } catch (error: any) {
    console.error('[IBPT] Erro ao verificar vencimentos:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao verificar vencimentos'
    }, 500);
  }
});

export default ibpt;
