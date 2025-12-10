// ============================================
// PLANAC ERP - Rotas de Garantias
// Bloco 3 - Pós-venda
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const garantias = new Hono<{ Bindings: Env }>();

// Schemas
const garantiaSchema = z.object({
  cliente_id: z.string().uuid(),
  pedido_id: z.string().uuid().optional(),
  produto_id: z.string().uuid(),
  numero_serie: z.string().optional(),
  data_compra: z.string(),
  data_fim_garantia: z.string(),
  tipo_garantia: z.enum(['FABRICANTE', 'LOJA', 'ESTENDIDA']),
  descricao_problema: z.string().min(1),
  observacoes: z.string().optional()
});

const acionamentoSchema = z.object({
  garantia_id: z.string().uuid(),
  descricao: z.string().min(1),
  fotos_urls: z.array(z.string().url()).optional(),
  solucao_solicitada: z.enum(['REPARO', 'TROCA', 'REEMBOLSO'])
});

// GET /api/garantias - Listar garantias
garantias.get('/', async (c) => {
  const empresaId = c.get('empresaId');
  const { cliente_id, status, vencidas, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT g.*, c.razao_social as cliente_nome, p.descricao as produto_descricao,
               CASE WHEN g.data_fim_garantia < date('now') THEN 1 ELSE 0 END as vencida
               FROM garantias g
               JOIN clientes c ON g.cliente_id = c.id
               JOIN produtos p ON g.produto_id = p.id
               WHERE g.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (cliente_id) {
    query += ` AND g.cliente_id = ?`;
    params.push(cliente_id);
  }
  
  if (status) {
    query += ` AND g.status = ?`;
    params.push(status);
  }
  
  if (vencidas === 'true') {
    query += ` AND g.data_fim_garantia < date('now')`;
  } else if (vencidas === 'false') {
    query += ` AND g.data_fim_garantia >= date('now')`;
  }
  
  // Contagem
  const countQuery = query.replace(/SELECT g\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY g.data_fim_garantia ASC LIMIT ? OFFSET ?`;
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

// GET /api/garantias/:id - Buscar garantia com histórico
garantias.get('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const garantia = await c.env.DB.prepare(`
    SELECT g.*, c.razao_social as cliente_nome, c.email as cliente_email, c.telefone as cliente_telefone,
           p.descricao as produto_descricao, p.codigo as produto_codigo,
           ped.numero as pedido_numero
    FROM garantias g
    JOIN clientes c ON g.cliente_id = c.id
    JOIN produtos p ON g.produto_id = p.id
    LEFT JOIN pedidos ped ON g.pedido_id = ped.id
    WHERE g.id = ? AND g.empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!garantia) {
    return c.json({ error: 'Garantia não encontrada' }, 404);
  }
  
  // Buscar histórico de acionamentos
  const historico = await c.env.DB.prepare(`
    SELECT gh.*, u.nome as usuario_nome
    FROM garantias_historico gh
    LEFT JOIN usuarios u ON gh.created_by = u.id
    WHERE gh.garantia_id = ?
    ORDER BY gh.created_at DESC
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: {
      ...garantia,
      historico: historico.results
    }
  });
});

// POST /api/garantias - Criar garantia
garantias.post('/', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const validation = garantiaSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const id = crypto.randomUUID();
  const { cliente_id, pedido_id, produto_id, numero_serie, data_compra, 
          data_fim_garantia, tipo_garantia, descricao_problema, observacoes } = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO garantias (id, empresa_id, cliente_id, pedido_id, produto_id, numero_serie,
                           data_compra, data_fim_garantia, tipo_garantia, descricao_problema,
                           observacoes, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ATIVA', ?)
  `).bind(id, empresaId, cliente_id, pedido_id || null, produto_id, numero_serie || null,
          data_compra, data_fim_garantia, tipo_garantia, descricao_problema, 
          observacoes || null, usuarioId).run();
  
  return c.json({ id, message: 'Garantia registrada com sucesso' }, 201);
});

// PUT /api/garantias/:id - Atualizar garantia
garantias.put('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const validation = garantiaSchema.partial().safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const garantia = await c.env.DB.prepare(`
    SELECT id FROM garantias WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!garantia) {
    return c.json({ error: 'Garantia não encontrada' }, 404);
  }
  
  const campos = Object.keys(validation.data);
  const valores = Object.values(validation.data);
  
  if (campos.length > 0) {
    const setClause = campos.map(c => `${c} = ?`).join(', ');
    await c.env.DB.prepare(`
      UPDATE garantias SET ${setClause}, updated_at = CURRENT_TIMESTAMP, updated_by = ?
      WHERE id = ? AND empresa_id = ?
    `).bind(...valores, usuarioId, id, empresaId).run();
  }
  
  return c.json({ message: 'Garantia atualizada com sucesso' });
});

// POST /api/garantias/:id/acionar - Acionar garantia
garantias.post('/:id/acionar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    descricao: z.string().min(1),
    fotos_urls: z.array(z.string()).optional(),
    solucao_solicitada: z.enum(['REPARO', 'TROCA', 'REEMBOLSO'])
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const garantia = await c.env.DB.prepare(`
    SELECT id, status, data_fim_garantia FROM garantias WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!garantia) {
    return c.json({ error: 'Garantia não encontrada' }, 404);
  }
  
  // Verificar se ainda está válida
  const hoje = new Date().toISOString().split('T')[0];
  if (garantia.data_fim_garantia < hoje) {
    return c.json({ error: 'Garantia vencida. Não é possível acionar.' }, 400);
  }
  
  const historicoId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO garantias_historico (id, garantia_id, tipo, descricao, fotos_urls, 
                                     solucao_solicitada, status, created_by)
    VALUES (?, ?, 'ACIONAMENTO', ?, ?, ?, 'AGUARDANDO_ANALISE', ?)
  `).bind(historicoId, id, validation.data.descricao, 
          validation.data.fotos_urls ? JSON.stringify(validation.data.fotos_urls) : null,
          validation.data.solucao_solicitada, usuarioId).run();
  
  // Atualizar status da garantia
  await c.env.DB.prepare(`
    UPDATE garantias SET status = 'EM_ANALISE', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(id).run();
  
  return c.json({ historico_id: historicoId, message: 'Garantia acionada com sucesso' });
});

// POST /api/garantias/:id/aprovar - Aprovar acionamento
garantias.post('/:id/aprovar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    solucao_aprovada: z.enum(['REPARO', 'TROCA', 'REEMBOLSO']),
    valor_reembolso: z.number().optional(),
    observacoes: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const garantia = await c.env.DB.prepare(`
    SELECT id, status FROM garantias WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!garantia) {
    return c.json({ error: 'Garantia não encontrada' }, 404);
  }
  
  if (garantia.status !== 'EM_ANALISE') {
    return c.json({ error: 'Garantia não está em análise' }, 400);
  }
  
  const historicoId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO garantias_historico (id, garantia_id, tipo, descricao, solucao_aprovada, 
                                     valor_reembolso, status, created_by)
    VALUES (?, ?, 'APROVACAO', ?, ?, ?, 'APROVADA', ?)
  `).bind(historicoId, id, validation.data.observacoes || 'Garantia aprovada',
          validation.data.solucao_aprovada, validation.data.valor_reembolso || null, usuarioId).run();
  
  await c.env.DB.prepare(`
    UPDATE garantias SET status = 'APROVADA', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(id).run();
  
  return c.json({ message: 'Garantia aprovada' });
});

// POST /api/garantias/:id/rejeitar - Rejeitar acionamento
garantias.post('/:id/rejeitar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    motivo: z.string().min(1)
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Informe o motivo da rejeição' }, 400);
  }
  
  const garantia = await c.env.DB.prepare(`
    SELECT id, status FROM garantias WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!garantia) {
    return c.json({ error: 'Garantia não encontrada' }, 404);
  }
  
  const historicoId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO garantias_historico (id, garantia_id, tipo, descricao, status, created_by)
    VALUES (?, ?, 'REJEICAO', ?, 'REJEITADA', ?)
  `).bind(historicoId, id, validation.data.motivo, usuarioId).run();
  
  await c.env.DB.prepare(`
    UPDATE garantias SET status = 'REJEITADA', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(id).run();
  
  return c.json({ message: 'Garantia rejeitada' });
});

// POST /api/garantias/:id/concluir - Concluir atendimento
garantias.post('/:id/concluir', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    descricao_conclusao: z.string().min(1)
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Informe a descrição da conclusão' }, 400);
  }
  
  const garantia = await c.env.DB.prepare(`
    SELECT id, status FROM garantias WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!garantia) {
    return c.json({ error: 'Garantia não encontrada' }, 404);
  }
  
  if (garantia.status !== 'APROVADA') {
    return c.json({ error: 'Garantia precisa estar aprovada para ser concluída' }, 400);
  }
  
  const historicoId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO garantias_historico (id, garantia_id, tipo, descricao, status, created_by)
    VALUES (?, ?, 'CONCLUSAO', ?, 'CONCLUIDA', ?)
  `).bind(historicoId, id, validation.data.descricao_conclusao, usuarioId).run();
  
  await c.env.DB.prepare(`
    UPDATE garantias SET status = 'CONCLUIDA', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(id).run();
  
  return c.json({ message: 'Garantia concluída com sucesso' });
});

// GET /api/garantias/vencendo - Garantias próximas do vencimento
garantias.get('/vencendo', async (c) => {
  const empresaId = c.get('empresaId');
  const { dias = '30' } = c.req.query();
  
  const garantias_list = await c.env.DB.prepare(`
    SELECT g.*, c.razao_social as cliente_nome, c.email as cliente_email,
           p.descricao as produto_descricao,
           julianday(g.data_fim_garantia) - julianday(date('now')) as dias_restantes
    FROM garantias g
    JOIN clientes c ON g.cliente_id = c.id
    JOIN produtos p ON g.produto_id = p.id
    WHERE g.empresa_id = ?
      AND g.status = 'ATIVA'
      AND g.data_fim_garantia BETWEEN date('now') AND date('now', '+' || ? || ' days')
    ORDER BY g.data_fim_garantia ASC
  `).bind(empresaId, dias).all();
  
  return c.json({
    success: true,
    data: garantias_list.results
  });
});

export default garantias;
