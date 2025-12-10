// ============================================
// PLANAC ERP - Rotas de Ocorrências
// Bloco 3 - Logística Complementar
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const ocorrencias = new Hono<{ Bindings: Env }>();

// Schemas
const ocorrenciaSchema = z.object({
  entrega_id: z.string().uuid(),
  tipo: z.enum(['AUSENTE', 'ENDERECO_NAO_ENCONTRADO', 'RECUSADO', 'AVARIA', 'EXTRAVIO', 
                'ATRASO', 'REAGENDAMENTO', 'PROBLEMA_ACESSO', 'OUTROS']),
  descricao: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  foto_url: z.string().url().optional(),
  data_reagendamento: z.string().optional(),
  responsavel_contato: z.string().optional()
});

const tentativaSchema = z.object({
  entrega_id: z.string().uuid(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  observacao: z.string().optional(),
  foto_url: z.string().url().optional(),
  resultado: z.enum(['SUCESSO', 'AUSENTE', 'RECUSADO', 'ENDERECO_INCORRETO', 'OUTROS'])
});

// GET /api/ocorrencias - Listar ocorrências
ocorrencias.get('/', async (c) => {
  const empresaId = c.get('empresaId');
  const { entrega_id, tipo, data_inicio, data_fim, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT o.*, e.numero as entrega_numero, c.razao_social as cliente_nome
               FROM ocorrencias o
               JOIN entregas e ON o.entrega_id = e.id
               JOIN clientes c ON e.cliente_id = c.id
               WHERE o.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (entrega_id) {
    query += ` AND o.entrega_id = ?`;
    params.push(entrega_id);
  }
  
  if (tipo) {
    query += ` AND o.tipo = ?`;
    params.push(tipo);
  }
  
  if (data_inicio) {
    query += ` AND o.created_at >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    query += ` AND o.created_at <= ?`;
    params.push(data_fim);
  }
  
  // Contagem
  const countQuery = query.replace(/SELECT o\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: result.results,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: countResult?.total || 0
    }
  });
});

// GET /api/ocorrencias/:id - Buscar ocorrência
ocorrencias.get('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const ocorrencia = await c.env.DB.prepare(`
    SELECT o.*, e.numero as entrega_numero, e.status as entrega_status,
           c.razao_social as cliente_nome, c.telefone as cliente_telefone,
           u.nome as registrado_por_nome
    FROM ocorrencias o
    JOIN entregas e ON o.entrega_id = e.id
    JOIN clientes c ON e.cliente_id = c.id
    LEFT JOIN usuarios u ON o.created_by = u.id
    WHERE o.id = ? AND o.empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!ocorrencia) {
    return c.json({ error: 'Ocorrência não encontrada' }, 404);
  }
  
  return c.json({ success: true, data: ocorrencia });
});

// POST /api/ocorrencias - Registrar ocorrência
ocorrencias.post('/', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const validation = ocorrenciaSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  // Verificar se entrega existe
  const entrega = await c.env.DB.prepare(`
    SELECT id, status FROM entregas WHERE id = ? AND empresa_id = ?
  `).bind(validation.data.entrega_id, empresaId).first();
  
  if (!entrega) {
    return c.json({ error: 'Entrega não encontrada' }, 404);
  }
  
  const id = crypto.randomUUID();
  const { entrega_id, tipo, descricao, latitude, longitude, foto_url, data_reagendamento, responsavel_contato } = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO ocorrencias (id, empresa_id, entrega_id, tipo, descricao, latitude, longitude,
                             foto_url, data_reagendamento, responsavel_contato, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, empresaId, entrega_id, tipo, descricao, latitude || null, longitude || null,
          foto_url || null, data_reagendamento || null, responsavel_contato || null, usuarioId).run();
  
  // Atualizar status da entrega conforme o tipo de ocorrência
  let novoStatus = null;
  if (tipo === 'REAGENDAMENTO' && data_reagendamento) {
    novoStatus = 'REAGENDADA';
  } else if (['AUSENTE', 'ENDERECO_NAO_ENCONTRADO', 'PROBLEMA_ACESSO'].includes(tipo)) {
    novoStatus = 'TENTATIVA_FALHA';
  } else if (tipo === 'RECUSADO') {
    novoStatus = 'RECUSADA';
  } else if (['AVARIA', 'EXTRAVIO'].includes(tipo)) {
    novoStatus = 'COM_PROBLEMA';
  }
  
  if (novoStatus) {
    await c.env.DB.prepare(`
      UPDATE entregas SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(novoStatus, entrega_id).run();
  }
  
  return c.json({ id, message: 'Ocorrência registrada com sucesso' }, 201);
});

// PUT /api/ocorrencias/:id - Atualizar ocorrência
ocorrencias.put('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const validation = ocorrenciaSchema.partial().safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const ocorrencia = await c.env.DB.prepare(`
    SELECT id FROM ocorrencias WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!ocorrencia) {
    return c.json({ error: 'Ocorrência não encontrada' }, 404);
  }
  
  const campos = Object.keys(validation.data).filter(k => k !== 'entrega_id');
  const valores = campos.map(k => (validation.data as any)[k]);
  
  if (campos.length > 0) {
    const setClause = campos.map(c => `${c} = ?`).join(', ');
    await c.env.DB.prepare(`
      UPDATE ocorrencias SET ${setClause}, updated_at = CURRENT_TIMESTAMP, updated_by = ?
      WHERE id = ? AND empresa_id = ?
    `).bind(...valores, usuarioId, id, empresaId).run();
  }
  
  return c.json({ message: 'Ocorrência atualizada com sucesso' });
});

// POST /api/ocorrencias/:id/resolver - Marcar como resolvida
ocorrencias.post('/:id/resolver', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    resolucao: z.string().min(1)
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Informe a resolução' }, 400);
  }
  
  const ocorrencia = await c.env.DB.prepare(`
    SELECT id, resolvida FROM ocorrencias WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!ocorrencia) {
    return c.json({ error: 'Ocorrência não encontrada' }, 404);
  }
  
  if (ocorrencia.resolvida) {
    return c.json({ error: 'Ocorrência já foi resolvida' }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE ocorrencias SET resolvida = 1, resolucao = ?, data_resolucao = CURRENT_TIMESTAMP,
                          resolvida_por = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(validation.data.resolucao, usuarioId, id).run();
  
  return c.json({ message: 'Ocorrência resolvida' });
});

// === TENTATIVAS DE ENTREGA ===

// GET /api/ocorrencias/tentativas/:entregaId - Listar tentativas de uma entrega
ocorrencias.get('/tentativas/:entregaId', async (c) => {
  const empresaId = c.get('empresaId');
  const { entregaId } = c.req.param();
  
  const tentativas = await c.env.DB.prepare(`
    SELECT t.*, u.nome as registrado_por_nome
    FROM tentativas t
    LEFT JOIN usuarios u ON t.created_by = u.id
    WHERE t.entrega_id = ? AND t.empresa_id = ?
    ORDER BY t.created_at DESC
  `).bind(entregaId, empresaId).all();
  
  return c.json({
    success: true,
    data: tentativas.results
  });
});

// POST /api/ocorrencias/tentativas - Registrar tentativa de entrega
ocorrencias.post('/tentativas', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const validation = tentativaSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  // Verificar se entrega existe
  const entrega = await c.env.DB.prepare(`
    SELECT id, status FROM entregas WHERE id = ? AND empresa_id = ?
  `).bind(validation.data.entrega_id, empresaId).first();
  
  if (!entrega) {
    return c.json({ error: 'Entrega não encontrada' }, 404);
  }
  
  const id = crypto.randomUUID();
  const { entrega_id, latitude, longitude, observacao, foto_url, resultado } = validation.data;
  
  // Contar tentativas anteriores
  const tentativasAnteriores = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM tentativas WHERE entrega_id = ?
  `).bind(entrega_id).first();
  
  const numeroTentativa = ((tentativasAnteriores?.total as number) || 0) + 1;
  
  await c.env.DB.prepare(`
    INSERT INTO tentativas (id, empresa_id, entrega_id, numero_tentativa, latitude, longitude,
                            observacao, foto_url, resultado, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, empresaId, entrega_id, numeroTentativa, latitude || null, longitude || null,
          observacao || null, foto_url || null, resultado, usuarioId).run();
  
  // Atualizar status da entrega
  if (resultado === 'SUCESSO') {
    await c.env.DB.prepare(`
      UPDATE entregas SET status = 'ENTREGUE', data_entrega = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(entrega_id).run();
  } else {
    await c.env.DB.prepare(`
      UPDATE entregas SET status = 'TENTATIVA_FALHA', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(entrega_id).run();
  }
  
  return c.json({ id, numero_tentativa: numeroTentativa, message: 'Tentativa registrada' }, 201);
});

// GET /api/ocorrencias/estatisticas - Estatísticas de ocorrências
ocorrencias.get('/estatisticas', async (c) => {
  const empresaId = c.get('empresaId');
  const { data_inicio, data_fim } = c.req.query();
  
  let whereClause = `WHERE empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (data_inicio) {
    whereClause += ` AND created_at >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    whereClause += ` AND created_at <= ?`;
    params.push(data_fim);
  }
  
  // Total por tipo
  const porTipo = await c.env.DB.prepare(`
    SELECT tipo, COUNT(*) as total
    FROM ocorrencias
    ${whereClause}
    GROUP BY tipo
    ORDER BY total DESC
  `).bind(...params).all();
  
  // Resolvidas vs pendentes
  const resolucao = await c.env.DB.prepare(`
    SELECT 
      SUM(CASE WHEN resolvida = 1 THEN 1 ELSE 0 END) as resolvidas,
      SUM(CASE WHEN resolvida = 0 THEN 1 ELSE 0 END) as pendentes
    FROM ocorrencias
    ${whereClause}
  `).bind(...params).first();
  
  // Taxa de sucesso nas tentativas
  const tentativas = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN resultado = 'SUCESSO' THEN 1 ELSE 0 END) as sucesso
    FROM tentativas
    ${whereClause}
  `).bind(...params).first();
  
  return c.json({
    success: true,
    data: {
      por_tipo: porTipo.results,
      resolucao,
      tentativas: {
        ...tentativas,
        taxa_sucesso: tentativas && (tentativas.total as number) > 0 
          ? ((tentativas.sucesso as number) / (tentativas.total as number) * 100).toFixed(2) + '%'
          : '0%'
      }
    }
  });
});

export default ocorrencias;
