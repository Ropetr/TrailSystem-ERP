// ============================================
// PLANAC ERP - Rotas de Rastreamento
// Bloco 3 - Logística Complementar
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const rastreamento = new Hono<{ Bindings: Env }>();

// Schemas
const posicaoSchema = z.object({
  entrega_id: z.string().uuid().optional(),
  rota_id: z.string().uuid().optional(),
  veiculo_id: z.string().uuid().optional(),
  motorista_id: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  velocidade: z.number().min(0).optional(),
  direcao: z.number().min(0).max(360).optional(),
  precisao: z.number().min(0).optional(),
  bateria: z.number().min(0).max(100).optional(),
  evento: z.string().optional()
});

// POST /api/rastreamento/posicao - Registrar posição (usado pelo app do motorista)
rastreamento.post('/posicao', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const validation = posicaoSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const id = crypto.randomUUID();
  const { entrega_id, rota_id, veiculo_id, motorista_id, latitude, longitude, 
          velocidade, direcao, precisao, bateria, evento } = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO rastreamento (id, empresa_id, entrega_id, rota_id, veiculo_id, motorista_id,
                              latitude, longitude, velocidade, direcao, precisao, bateria, evento, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, empresaId, entrega_id || null, rota_id || null, veiculo_id || null, motorista_id || null,
          latitude, longitude, velocidade || null, direcao || null, precisao || null, 
          bateria || null, evento || null, usuarioId).run();
  
  return c.json({ id, message: 'Posição registrada' }, 201);
});

// POST /api/rastreamento/posicoes - Registrar múltiplas posições (batch)
rastreamento.post('/posicoes', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    posicoes: z.array(posicaoSchema)
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const ids: string[] = [];
  
  for (const pos of validation.data.posicoes) {
    const id = crypto.randomUUID();
    ids.push(id);
    
    await c.env.DB.prepare(`
      INSERT INTO rastreamento (id, empresa_id, entrega_id, rota_id, veiculo_id, motorista_id,
                                latitude, longitude, velocidade, direcao, precisao, bateria, evento, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, empresaId, pos.entrega_id || null, pos.rota_id || null, pos.veiculo_id || null, 
            pos.motorista_id || null, pos.latitude, pos.longitude, pos.velocidade || null, 
            pos.direcao || null, pos.precisao || null, pos.bateria || null, pos.evento || null, usuarioId).run();
  }
  
  return c.json({ ids, message: `${ids.length} posições registradas` }, 201);
});

// GET /api/rastreamento/entrega/:entregaId - Histórico de posições de uma entrega
rastreamento.get('/entrega/:entregaId', async (c) => {
  const empresaId = c.get('empresaId');
  const { entregaId } = c.req.param();
  const { limit = '100' } = c.req.query();
  
  const posicoes = await c.env.DB.prepare(`
    SELECT * FROM rastreamento 
    WHERE entrega_id = ? AND empresa_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(entregaId, empresaId, parseInt(limit)).all();
  
  return c.json({
    success: true,
    data: posicoes.results
  });
});

// GET /api/rastreamento/rota/:rotaId - Histórico de posições de uma rota
rastreamento.get('/rota/:rotaId', async (c) => {
  const empresaId = c.get('empresaId');
  const { rotaId } = c.req.param();
  const { limit = '500' } = c.req.query();
  
  const posicoes = await c.env.DB.prepare(`
    SELECT * FROM rastreamento 
    WHERE rota_id = ? AND empresa_id = ?
    ORDER BY created_at ASC
    LIMIT ?
  `).bind(rotaId, empresaId, parseInt(limit)).all();
  
  return c.json({
    success: true,
    data: posicoes.results
  });
});

// GET /api/rastreamento/veiculo/:veiculoId - Posições de um veículo
rastreamento.get('/veiculo/:veiculoId', async (c) => {
  const empresaId = c.get('empresaId');
  const { veiculoId } = c.req.param();
  const { data_inicio, data_fim, limit = '500' } = c.req.query();
  
  let query = `SELECT * FROM rastreamento WHERE veiculo_id = ? AND empresa_id = ?`;
  const params: any[] = [veiculoId, empresaId];
  
  if (data_inicio) {
    query += ` AND created_at >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    query += ` AND created_at <= ?`;
    params.push(data_fim);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(parseInt(limit));
  
  const posicoes = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: posicoes.results
  });
});

// GET /api/rastreamento/motorista/:motoristaId - Posições de um motorista
rastreamento.get('/motorista/:motoristaId', async (c) => {
  const empresaId = c.get('empresaId');
  const { motoristaId } = c.req.param();
  const { data_inicio, data_fim, limit = '500' } = c.req.query();
  
  let query = `SELECT * FROM rastreamento WHERE motorista_id = ? AND empresa_id = ?`;
  const params: any[] = [motoristaId, empresaId];
  
  if (data_inicio) {
    query += ` AND created_at >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    query += ` AND created_at <= ?`;
    params.push(data_fim);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(parseInt(limit));
  
  const posicoes = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: posicoes.results
  });
});

// GET /api/rastreamento/tempo-real - Última posição de todos os veículos/motoristas ativos
rastreamento.get('/tempo-real', async (c) => {
  const empresaId = c.get('empresaId');
  
  // Buscar última posição de cada veículo nas últimas 2 horas
  const posicoes = await c.env.DB.prepare(`
    SELECT r.*, v.placa, v.modelo, m.nome as motorista_nome
    FROM rastreamento r
    LEFT JOIN veiculos v ON r.veiculo_id = v.id
    LEFT JOIN motoristas m ON r.motorista_id = m.id
    WHERE r.empresa_id = ?
      AND r.created_at >= datetime('now', '-2 hours')
      AND r.id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY COALESCE(veiculo_id, motorista_id) ORDER BY created_at DESC) as rn
          FROM rastreamento
          WHERE empresa_id = ? AND created_at >= datetime('now', '-2 hours')
        ) WHERE rn = 1
      )
    ORDER BY r.created_at DESC
  `).bind(empresaId, empresaId).all();
  
  return c.json({
    success: true,
    data: posicoes.results
  });
});

// GET /api/rastreamento/entrega/:entregaId/ultima - Última posição de uma entrega
rastreamento.get('/entrega/:entregaId/ultima', async (c) => {
  const empresaId = c.get('empresaId');
  const { entregaId } = c.req.param();
  
  const posicao = await c.env.DB.prepare(`
    SELECT r.*, m.nome as motorista_nome, v.placa as veiculo_placa
    FROM rastreamento r
    LEFT JOIN motoristas m ON r.motorista_id = m.id
    LEFT JOIN veiculos v ON r.veiculo_id = v.id
    WHERE r.entrega_id = ? AND r.empresa_id = ?
    ORDER BY r.created_at DESC
    LIMIT 1
  `).bind(entregaId, empresaId).first();
  
  if (!posicao) {
    return c.json({ error: 'Nenhuma posição encontrada para esta entrega' }, 404);
  }
  
  return c.json({
    success: true,
    data: posicao
  });
});

// GET /api/rastreamento/estatisticas/:veiculoId - Estatísticas de um veículo
rastreamento.get('/estatisticas/:veiculoId', async (c) => {
  const empresaId = c.get('empresaId');
  const { veiculoId } = c.req.param();
  const { data_inicio, data_fim } = c.req.query();
  
  let whereClause = `WHERE veiculo_id = ? AND empresa_id = ?`;
  const params: any[] = [veiculoId, empresaId];
  
  if (data_inicio) {
    whereClause += ` AND created_at >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    whereClause += ` AND created_at <= ?`;
    params.push(data_fim);
  }
  
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_posicoes,
      AVG(velocidade) as velocidade_media,
      MAX(velocidade) as velocidade_maxima,
      MIN(created_at) as primeira_posicao,
      MAX(created_at) as ultima_posicao
    FROM rastreamento
    ${whereClause}
  `).bind(...params).first();
  
  return c.json({
    success: true,
    data: stats
  });
});

export default rastreamento;
