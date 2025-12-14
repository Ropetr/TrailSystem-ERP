// =============================================
// PLANAC ERP - Routes Jobs
// Endpoint para consultar execuções de jobs
// =============================================

import { Hono } from 'hono';

interface Env {
  DB: D1Database;
}

const jobs = new Hono<{ Bindings: Env }>();

/**
 * Lista execuções de jobs
 * GET /jobs/execucoes?job_name=xxx&limit=10
 */
jobs.get('/execucoes', async (c) => {
  try {
    const { job_name, limit = '20' } = c.req.query();

    let query = 'SELECT * FROM jobs_execucoes';
    const params: string[] = [];

    if (job_name) {
      query += ' WHERE job_name = ?';
      params.push(job_name);
    }

    query += ' ORDER BY executed_at DESC LIMIT ?';
    params.push(limit);

    const stmt = c.env.DB.prepare(query);
    const result = await stmt.bind(...params).all<any>();

    return c.json({ data: result.results || [] });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Detalhes de uma execução específica
 * GET /jobs/execucoes/:id
 */
jobs.get('/execucoes/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const result = await c.env.DB
      .prepare('SELECT * FROM jobs_execucoes WHERE id = ?')
      .bind(id)
      .first();

    if (!result) {
      return c.json({ error: 'Execução não encontrada' }, 404);
    }

    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Estatísticas de jobs
 * GET /jobs/estatisticas
 */
jobs.get('/estatisticas', async (c) => {
  try {
    const result = await c.env.DB
      .prepare(`
        SELECT 
          job_name,
          COUNT(*) as total_execucoes,
          SUM(CASE WHEN status = 'sucesso' THEN 1 ELSE 0 END) as sucesso,
          SUM(CASE WHEN status = 'erro' THEN 1 ELSE 0 END) as erro,
          MAX(executed_at) as ultima_execucao
        FROM jobs_execucoes
        GROUP BY job_name
        ORDER BY job_name
      `)
      .all<any>();

    return c.json({ data: result.results || [] });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default jobs;
