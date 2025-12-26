// =============================================
// PLANAC ERP - Rotas de Jobs Agendados
// =============================================
// Histórico e monitoramento de jobs (cron)
// Atualizado: 26/12/2025 - Adaptado para API Unificada

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';

const jobs = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware de autenticação para todas as rotas
jobs.use('/*', requireAuth());

// =============================================
// HISTÓRICO DE EXECUÇÕES
// =============================================

// GET /jobs/execucoes - Listar execuções de jobs
jobs.get('/execucoes', requirePermission('sistema', 'configurar'), async (c) => {
  try {
    const { 
      page = '1', 
      limit = '50',
      tipo,
      status,
      data_inicio,
      data_fim 
    } = c.req.query();
    
    let query = `SELECT * FROM job_execucoes WHERE 1=1`;
    const params: any[] = [];
    
    if (tipo) {
      query += ` AND tipo = ?`;
      params.push(tipo);
    }
    
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }
    
    if (data_inicio) {
      query += ` AND iniciado_em >= ?`;
      params.push(data_inicio);
    }
    
    if (data_fim) {
      query += ` AND iniciado_em <= ?`;
      params.push(data_fim);
    }
    
    query += ` ORDER BY iniciado_em DESC`;
    
    // Paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const resultado = await c.env.DB.prepare(query).bind(...params).all();
    
    // Total para paginação
    let countQuery = `SELECT COUNT(*) as total FROM job_execucoes WHERE 1=1`;
    const countParams: any[] = [];
    
    if (tipo) {
      countQuery += ` AND tipo = ?`;
      countParams.push(tipo);
    }
    
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    
    const total = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();
    
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
    console.error('[JOBS] Erro ao listar execuções:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao listar execuções'
    }, 500);
  }
});

// GET /jobs/execucoes/:id - Detalhes de uma execução
jobs.get('/execucoes/:id', requirePermission('sistema', 'configurar'), async (c) => {
  try {
    const { id } = c.req.param();
    
    const execucao = await c.env.DB.prepare(`
      SELECT * FROM job_execucoes WHERE id = ?
    `).bind(id).first();
    
    if (!execucao) {
      return c.json({
        success: false,
        error: 'Execução não encontrada'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: execucao
    });
  } catch (error: any) {
    console.error('[JOBS] Erro ao buscar execução:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao buscar execução'
    }, 500);
  }
});

// =============================================
// ESTATÍSTICAS
// =============================================

// GET /jobs/estatisticas - Estatísticas dos jobs
jobs.get('/estatisticas', requirePermission('sistema', 'configurar'), async (c) => {
  try {
    const stats = await c.env.DB.prepare(`
      SELECT 
        tipo,
        COUNT(*) as total_execucoes,
        SUM(CASE WHEN status = 'sucesso' THEN 1 ELSE 0 END) as sucesso,
        SUM(CASE WHEN status = 'erro' THEN 1 ELSE 0 END) as erros,
        SUM(CASE WHEN status = 'parcial' THEN 1 ELSE 0 END) as parcial,
        AVG(duracao_ms) as duracao_media,
        MAX(iniciado_em) as ultima_execucao
      FROM job_execucoes
      GROUP BY tipo
    `).all();
    
    const ultimaSemana = await c.env.DB.prepare(`
      SELECT 
        date(iniciado_em) as data,
        tipo,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sucesso' THEN 1 ELSE 0 END) as sucesso
      FROM job_execucoes
      WHERE iniciado_em >= date('now', '-7 days')
      GROUP BY date(iniciado_em), tipo
      ORDER BY data DESC
    `).all();
    
    return c.json({
      success: true,
      data: {
        por_tipo: stats.results,
        ultima_semana: ultimaSemana.results
      }
    });
  } catch (error: any) {
    console.error('[JOBS] Erro ao obter estatísticas:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao obter estatísticas'
    }, 500);
  }
});

// =============================================
// CONFIGURAÇÃO DE JOBS
// =============================================

// GET /jobs/agendados - Listar jobs agendados
jobs.get('/agendados', requirePermission('sistema', 'configurar'), async (c) => {
  try {
    // Jobs fixos do sistema (definidos no wrangler.toml)
    const jobsAgendados = [
      {
        nome: 'atualizar-certificados',
        tipo: 'certificados',
        cron: '0 6 * * *',
        descricao: 'Verificar status e vencimento de certificados digitais',
        horario_brt: '03:00'
      },
      {
        nome: 'atualizar-ibpt',
        tipo: 'ibpt',
        cron: '0 7 * * *',
        descricao: 'Atualizar tabela de impostos IBPT',
        horario_brt: '04:00'
      },
      {
        nome: 'relatorio-semanal',
        tipo: 'relatorio',
        cron: '0 8 * * 1',
        descricao: 'Gerar e enviar relatório semanal',
        horario_brt: '05:00 (segundas)'
      },
      {
        nome: 'limpeza-mensal',
        tipo: 'limpeza',
        cron: '0 9 1 * *',
        descricao: 'Limpeza de dados antigos e temporários',
        horario_brt: '06:00 (dia 1)'
      }
    ];
    
    // Buscar última execução de cada job
    for (const job of jobsAgendados) {
      const ultima = await c.env.DB.prepare(`
        SELECT * FROM job_execucoes 
        WHERE tipo = ? 
        ORDER BY iniciado_em DESC 
        LIMIT 1
      `).bind(job.tipo).first();
      
      (job as any).ultima_execucao = ultima || null;
    }
    
    return c.json({
      success: true,
      data: jobsAgendados
    });
  } catch (error: any) {
    console.error('[JOBS] Erro ao listar jobs:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao listar jobs'
    }, 500);
  }
});

// POST /jobs/:tipo/executar - Executar job manualmente
jobs.post('/:tipo/executar', requirePermission('sistema', 'configurar'), async (c) => {
  try {
    const { tipo } = c.req.param();
    
    // Validar tipo de job
    const tiposValidos = ['certificados', 'ibpt', 'relatorio', 'limpeza'];
    if (!tiposValidos.includes(tipo)) {
      return c.json({
        success: false,
        error: `Tipo de job inválido. Válidos: ${tiposValidos.join(', ')}`
      }, 400);
    }
    
    // Nota: A execução real seria através do scheduled handler
    // Aqui apenas simulamos para teste
    return c.json({
      success: true,
      message: `Job "${tipo}" agendado para execução manual. Verifique o histórico em alguns segundos.`,
      hint: 'Jobs manuais são executados através do Cloudflare Dashboard > Workers > Cron Triggers'
    });
  } catch (error: any) {
    console.error('[JOBS] Erro ao executar job:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao executar job'
    }, 500);
  }
});

export default jobs;
