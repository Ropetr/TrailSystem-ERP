// ============================================
// PLANAC ERP - Rotas de Tarefas
// Bloco 2 - Gestão de Tarefas
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const tarefas = new Hono<{ Bindings: Env }>();

// ============================================
// CRUD DE TAREFAS
// ============================================

// GET /api/tarefas - Listar tarefas
tarefas.get('/', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { 
    status, prioridade, responsavel_id, entidade_tipo, entidade_id,
    data_inicio, data_fim, minhas, page = '1', limit = '20'
  } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT t.*, 
               u_criador.nome as criado_por_nome,
               u_resp.nome as responsavel_nome
               FROM tarefas t
               LEFT JOIN usuarios u_criador ON t.created_by = u_criador.id
               LEFT JOIN usuarios u_resp ON t.responsavel_id = u_resp.id
               WHERE t.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (status) {
    query += ` AND t.status = ?`;
    params.push(status);
  }
  
  if (prioridade) {
    query += ` AND t.prioridade = ?`;
    params.push(prioridade);
  }
  
  if (responsavel_id) {
    query += ` AND t.responsavel_id = ?`;
    params.push(responsavel_id);
  }
  
  if (minhas === 'true') {
    query += ` AND t.responsavel_id = ?`;
    params.push(usuarioId);
  }
  
  if (entidade_tipo && entidade_id) {
    query += ` AND t.entidade_tipo = ? AND t.entidade_id = ?`;
    params.push(entidade_tipo, entidade_id);
  }
  
  if (data_inicio) {
    query += ` AND t.data_vencimento >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    query += ` AND t.data_vencimento <= ?`;
    params.push(data_fim);
  }
  
  // Count
  const countQuery = query.replace(/SELECT t\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY 
    CASE t.prioridade 
      WHEN 'URGENTE' THEN 1 
      WHEN 'ALTA' THEN 2 
      WHEN 'MEDIA' THEN 3 
      ELSE 4 
    END,
    t.data_vencimento ASC
    LIMIT ? OFFSET ?`;
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

// GET /api/tarefas/:id - Buscar tarefa
tarefas.get('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const tarefa = await c.env.DB.prepare(`
    SELECT t.*, 
           u_criador.nome as criado_por_nome,
           u_resp.nome as responsavel_nome
    FROM tarefas t
    LEFT JOIN usuarios u_criador ON t.created_by = u_criador.id
    LEFT JOIN usuarios u_resp ON t.responsavel_id = u_resp.id
    WHERE t.id = ? AND t.empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!tarefa) {
    return c.json({ error: 'Tarefa não encontrada' }, 404);
  }
  
  // Buscar comentários
  const comentarios = await c.env.DB.prepare(`
    SELECT tc.*, u.nome as usuario_nome
    FROM tarefas_comentarios tc
    LEFT JOIN usuarios u ON tc.usuario_id = u.id
    WHERE tc.tarefa_id = ?
    ORDER BY tc.created_at ASC
  `).bind(id).all();
  
  return c.json({ 
    success: true, 
    data: { 
      ...tarefa, 
      comentarios: comentarios.results 
    } 
  });
});

// POST /api/tarefas - Criar tarefa
tarefas.post('/', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    titulo: z.string().min(1).max(200),
    descricao: z.string().optional(),
    tipo: z.enum(['TAREFA', 'LEMBRETE', 'FOLLOWUP', 'LIGACAO', 'EMAIL', 'REUNIAO', 'VISITA']).default('TAREFA'),
    prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).default('MEDIA'),
    status: z.enum(['PENDENTE', 'EM_ANDAMENTO', 'AGUARDANDO', 'CONCLUIDA', 'CANCELADA']).default('PENDENTE'),
    responsavel_id: z.string().uuid().optional(),
    entidade_tipo: z.enum(['CLIENTE', 'FORNECEDOR', 'PEDIDO', 'ORCAMENTO', 'OPORTUNIDADE', 'TICKET']).optional(),
    entidade_id: z.string().uuid().optional(),
    data_vencimento: z.string().optional(),
    data_lembrete: z.string().optional(),
    recorrente: z.boolean().default(false),
    recorrencia: z.enum(['DIARIA', 'SEMANAL', 'QUINZENAL', 'MENSAL']).optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO tarefas (id, empresa_id, titulo, descricao, tipo, prioridade, status,
                         responsavel_id, entidade_tipo, entidade_id, data_vencimento,
                         data_lembrete, recorrente, recorrencia, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, empresaId, data.titulo, data.descricao || null, data.tipo, data.prioridade,
    data.status, data.responsavel_id || usuarioId, data.entidade_tipo || null,
    data.entidade_id || null, data.data_vencimento || null, data.data_lembrete || null,
    data.recorrente ? 1 : 0, data.recorrencia || null, usuarioId
  ).run();
  
  return c.json({ id, message: 'Tarefa criada com sucesso' }, 201);
});

// PUT /api/tarefas/:id - Atualizar tarefa
tarefas.put('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const campos: string[] = [];
  const valores: any[] = [];
  
  if (body.titulo) { campos.push('titulo = ?'); valores.push(body.titulo); }
  if (body.descricao !== undefined) { campos.push('descricao = ?'); valores.push(body.descricao); }
  if (body.prioridade) { campos.push('prioridade = ?'); valores.push(body.prioridade); }
  if (body.status) { campos.push('status = ?'); valores.push(body.status); }
  if (body.responsavel_id) { campos.push('responsavel_id = ?'); valores.push(body.responsavel_id); }
  if (body.data_vencimento) { campos.push('data_vencimento = ?'); valores.push(body.data_vencimento); }
  if (body.data_lembrete) { campos.push('data_lembrete = ?'); valores.push(body.data_lembrete); }
  
  // Se concluindo a tarefa
  if (body.status === 'CONCLUIDA') {
    campos.push('data_conclusao = ?');
    valores.push(new Date().toISOString());
  }
  
  if (campos.length === 0) {
    return c.json({ error: 'Nenhum campo para atualizar' }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE tarefas SET ${campos.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(...valores, id, empresaId).run();
  
  return c.json({ message: 'Tarefa atualizada' });
});

// PUT /api/tarefas/:id/concluir - Concluir tarefa
tarefas.put('/:id/concluir', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const tarefa = await c.env.DB.prepare(`
    SELECT * FROM tarefas WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!tarefa) {
    return c.json({ error: 'Tarefa não encontrada' }, 404);
  }
  
  await c.env.DB.prepare(`
    UPDATE tarefas SET status = 'CONCLUIDA', data_conclusao = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run();
  
  // Se for recorrente, criar próxima tarefa
  if (tarefa.recorrente && tarefa.recorrencia) {
    const novaData = new Date(tarefa.data_vencimento as string);
    
    switch (tarefa.recorrencia) {
      case 'DIARIA': novaData.setDate(novaData.getDate() + 1); break;
      case 'SEMANAL': novaData.setDate(novaData.getDate() + 7); break;
      case 'QUINZENAL': novaData.setDate(novaData.getDate() + 15); break;
      case 'MENSAL': novaData.setMonth(novaData.getMonth() + 1); break;
    }
    
    const novaId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO tarefas (id, empresa_id, titulo, descricao, tipo, prioridade, status,
                           responsavel_id, entidade_tipo, entidade_id, data_vencimento,
                           recorrente, recorrencia, created_by)
      SELECT ?, empresa_id, titulo, descricao, tipo, prioridade, 'PENDENTE',
             responsavel_id, entidade_tipo, entidade_id, ?,
             recorrente, recorrencia, created_by
      FROM tarefas WHERE id = ?
    `).bind(novaId, novaData.toISOString().split('T')[0], id).run();
    
    return c.json({ 
      message: 'Tarefa concluída. Nova tarefa criada para ' + novaData.toISOString().split('T')[0],
      nova_tarefa_id: novaId
    });
  }
  
  return c.json({ message: 'Tarefa concluída' });
});

// DELETE /api/tarefas/:id - Excluir tarefa
tarefas.delete('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  await c.env.DB.prepare(`
    DELETE FROM tarefas_comentarios WHERE tarefa_id = ?
  `).bind(id).run();
  
  await c.env.DB.prepare(`
    DELETE FROM tarefas WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).run();
  
  return c.json({ message: 'Tarefa excluída' });
});

// ============================================
// COMENTÁRIOS
// ============================================

// POST /api/tarefas/:id/comentarios - Adicionar comentário
tarefas.post('/:id/comentarios', async (c) => {
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const comentarioId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO tarefas_comentarios (id, tarefa_id, usuario_id, comentario)
    VALUES (?, ?, ?, ?)
  `).bind(comentarioId, id, usuarioId, body.comentario).run();
  
  return c.json({ id: comentarioId, message: 'Comentário adicionado' }, 201);
});

// ============================================
// DASHBOARD E ESTATÍSTICAS
// ============================================

// GET /api/tarefas/dashboard - Dashboard de tarefas
tarefas.get('/dashboard/resumo', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  
  // Por status
  const porStatus = await c.env.DB.prepare(`
    SELECT status, COUNT(*) as quantidade
    FROM tarefas WHERE empresa_id = ? AND responsavel_id = ?
    GROUP BY status
  `).bind(empresaId, usuarioId).all();
  
  // Atrasadas
  const atrasadas = await c.env.DB.prepare(`
    SELECT COUNT(*) as quantidade
    FROM tarefas 
    WHERE empresa_id = ? AND responsavel_id = ?
      AND status NOT IN ('CONCLUIDA', 'CANCELADA')
      AND data_vencimento < date('now')
  `).bind(empresaId, usuarioId).first();
  
  // Vencendo hoje
  const hoje = await c.env.DB.prepare(`
    SELECT COUNT(*) as quantidade
    FROM tarefas 
    WHERE empresa_id = ? AND responsavel_id = ?
      AND status NOT IN ('CONCLUIDA', 'CANCELADA')
      AND date(data_vencimento) = date('now')
  `).bind(empresaId, usuarioId).first();
  
  // Próximas 7 dias
  const proximos7dias = await c.env.DB.prepare(`
    SELECT * FROM tarefas 
    WHERE empresa_id = ? AND responsavel_id = ?
      AND status NOT IN ('CONCLUIDA', 'CANCELADA')
      AND data_vencimento BETWEEN date('now') AND date('now', '+7 days')
    ORDER BY data_vencimento ASC
    LIMIT 10
  `).bind(empresaId, usuarioId).all();
  
  return c.json({
    success: true,
    data: {
      por_status: porStatus.results,
      atrasadas: atrasadas?.quantidade || 0,
      vencendo_hoje: hoje?.quantidade || 0,
      proximas_tarefas: proximos7dias.results
    }
  });
});

// GET /api/tarefas/atrasadas - Listar tarefas atrasadas
tarefas.get('/atrasadas/lista', async (c) => {
  const empresaId = c.get('empresaId');
  const { responsavel_id } = c.req.query();
  
  let query = `SELECT t.*, u.nome as responsavel_nome,
               julianday('now') - julianday(t.data_vencimento) as dias_atraso
               FROM tarefas t
               LEFT JOIN usuarios u ON t.responsavel_id = u.id
               WHERE t.empresa_id = ?
                 AND t.status NOT IN ('CONCLUIDA', 'CANCELADA')
                 AND t.data_vencimento < date('now')`;
  const params: any[] = [empresaId];
  
  if (responsavel_id) {
    query += ` AND t.responsavel_id = ?`;
    params.push(responsavel_id);
  }
  
  query += ` ORDER BY t.data_vencimento ASC`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

export default tarefas;
