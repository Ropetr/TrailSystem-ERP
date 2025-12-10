// ============================================
// PLANAC ERP - Rotas de Ordens de Serviço
// Bloco 3 - Pós-venda
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const ordensServico = new Hono<{ Bindings: Env }>();

// Schemas
const osSchema = z.object({
  cliente_id: z.string().uuid(),
  tipo: z.enum(['INSTALACAO', 'MANUTENCAO', 'REPARO', 'VISITA_TECNICA', 'ORCAMENTO_TECNICO', 'OUTROS']),
  prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).default('NORMAL'),
  titulo: z.string().min(1).max(200),
  descricao: z.string().min(1),
  endereco_servico: z.string().optional(),
  data_agendada: z.string().optional(),
  hora_agendada: z.string().optional(),
  tecnico_id: z.string().uuid().optional(),
  valor_estimado: z.number().min(0).optional(),
  pedido_id: z.string().uuid().optional(),
  observacoes: z.string().optional()
});

const osItemSchema = z.object({
  tipo: z.enum(['PRODUTO', 'SERVICO']),
  produto_id: z.string().uuid().optional(),
  descricao: z.string(),
  quantidade: z.number().min(0.01),
  valor_unitario: z.number().min(0),
  observacao: z.string().optional()
});

// GET /api/ordens-servico - Listar OS
ordensServico.get('/', async (c) => {
  const empresaId = c.get('empresaId');
  const { cliente_id, tecnico_id, tipo, status, prioridade, data_inicio, data_fim, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT os.*, c.razao_social as cliente_nome, t.nome as tecnico_nome
               FROM ordens_servico os
               JOIN clientes c ON os.cliente_id = c.id
               LEFT JOIN funcionarios t ON os.tecnico_id = t.id
               WHERE os.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (cliente_id) {
    query += ` AND os.cliente_id = ?`;
    params.push(cliente_id);
  }
  
  if (tecnico_id) {
    query += ` AND os.tecnico_id = ?`;
    params.push(tecnico_id);
  }
  
  if (tipo) {
    query += ` AND os.tipo = ?`;
    params.push(tipo);
  }
  
  if (status) {
    query += ` AND os.status = ?`;
    params.push(status);
  }
  
  if (prioridade) {
    query += ` AND os.prioridade = ?`;
    params.push(prioridade);
  }
  
  if (data_inicio) {
    query += ` AND os.data_agendada >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    query += ` AND os.data_agendada <= ?`;
    params.push(data_fim);
  }
  
  // Contagem
  const countQuery = query.replace(/SELECT os\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY 
    CASE os.prioridade WHEN 'URGENTE' THEN 1 WHEN 'ALTA' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END,
    os.data_agendada ASC NULLS LAST
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

// GET /api/ordens-servico/:id - Buscar OS com itens e histórico
ordensServico.get('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const os = await c.env.DB.prepare(`
    SELECT os.*, c.razao_social as cliente_nome, c.telefone as cliente_telefone, c.email as cliente_email,
           t.nome as tecnico_nome, t.telefone as tecnico_telefone,
           p.numero as pedido_numero
    FROM ordens_servico os
    JOIN clientes c ON os.cliente_id = c.id
    LEFT JOIN funcionarios t ON os.tecnico_id = t.id
    LEFT JOIN pedidos p ON os.pedido_id = p.id
    WHERE os.id = ? AND os.empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!os) {
    return c.json({ error: 'Ordem de serviço não encontrada' }, 404);
  }
  
  // Buscar itens
  const itens = await c.env.DB.prepare(`
    SELECT osi.*, pr.descricao as produto_descricao, pr.codigo as produto_codigo
    FROM os_itens osi
    LEFT JOIN produtos pr ON osi.produto_id = pr.id
    WHERE osi.os_id = ?
  `).bind(id).all();
  
  // Buscar histórico
  const historico = await c.env.DB.prepare(`
    SELECT osh.*, u.nome as usuario_nome
    FROM os_historico osh
    LEFT JOIN usuarios u ON osh.created_by = u.id
    WHERE osh.os_id = ?
    ORDER BY osh.created_at DESC
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: {
      ...os,
      itens: itens.results,
      historico: historico.results
    }
  });
});

// POST /api/ordens-servico - Criar OS
ordensServico.post('/', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const validation = osSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const { cliente_id, tipo, prioridade, titulo, descricao, endereco_servico, 
          data_agendada, hora_agendada, tecnico_id, valor_estimado, pedido_id, observacoes } = validation.data;
  
  // Gerar número
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM ordens_servico WHERE empresa_id = ?
  `).bind(empresaId).first();
  const numero = `OS${String(((countResult?.total as number) || 0) + 1).padStart(6, '0')}`;
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO ordens_servico (id, empresa_id, numero, cliente_id, tipo, prioridade, titulo, descricao,
                                endereco_servico, data_agendada, hora_agendada, tecnico_id, valor_estimado,
                                pedido_id, observacoes, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ABERTA', ?)
  `).bind(id, empresaId, numero, cliente_id, tipo, prioridade, titulo, descricao,
          endereco_servico || null, data_agendada || null, hora_agendada || null,
          tecnico_id || null, valor_estimado || null, pedido_id || null, observacoes || null, usuarioId).run();
  
  // Registrar histórico
  await c.env.DB.prepare(`
    INSERT INTO os_historico (id, os_id, tipo, descricao, created_by)
    VALUES (?, ?, 'ABERTURA', 'Ordem de serviço criada', ?)
  `).bind(crypto.randomUUID(), id, usuarioId).run();
  
  return c.json({ id, numero, message: 'Ordem de serviço criada com sucesso' }, 201);
});

// PUT /api/ordens-servico/:id - Atualizar OS
ordensServico.put('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const validation = osSchema.partial().safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const os = await c.env.DB.prepare(`
    SELECT id, status FROM ordens_servico WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!os) {
    return c.json({ error: 'Ordem de serviço não encontrada' }, 404);
  }
  
  if (['FINALIZADA', 'CANCELADA'].includes(os.status as string)) {
    return c.json({ error: 'OS finalizada/cancelada não pode ser alterada' }, 400);
  }
  
  const campos = Object.keys(validation.data);
  const valores = Object.values(validation.data);
  
  if (campos.length > 0) {
    const setClause = campos.map(c => `${c} = ?`).join(', ');
    await c.env.DB.prepare(`
      UPDATE ordens_servico SET ${setClause}, updated_at = CURRENT_TIMESTAMP, updated_by = ?
      WHERE id = ? AND empresa_id = ?
    `).bind(...valores, usuarioId, id, empresaId).run();
  }
  
  return c.json({ message: 'Ordem de serviço atualizada' });
});

// POST /api/ordens-servico/:id/itens - Adicionar item à OS
ordensServico.post('/:id/itens', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const validation = osItemSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const os = await c.env.DB.prepare(`
    SELECT id, status FROM ordens_servico WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!os) {
    return c.json({ error: 'Ordem de serviço não encontrada' }, 404);
  }
  
  if (['FINALIZADA', 'CANCELADA'].includes(os.status as string)) {
    return c.json({ error: 'OS finalizada/cancelada não aceita novos itens' }, 400);
  }
  
  const itemId = crypto.randomUUID();
  const { tipo, produto_id, descricao, quantidade, valor_unitario, observacao } = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO os_itens (id, os_id, tipo, produto_id, descricao, quantidade, valor_unitario, observacao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(itemId, id, tipo, produto_id || null, descricao, quantidade, valor_unitario, observacao || null).run();
  
  // Atualizar valor total da OS
  const totalItens = await c.env.DB.prepare(`
    SELECT SUM(quantidade * valor_unitario) as total FROM os_itens WHERE os_id = ?
  `).bind(id).first();
  
  await c.env.DB.prepare(`
    UPDATE ordens_servico SET valor_total = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(totalItens?.total || 0, id).run();
  
  return c.json({ id: itemId, message: 'Item adicionado' }, 201);
});

// DELETE /api/ordens-servico/:id/itens/:itemId - Remover item
ordensServico.delete('/:id/itens/:itemId', async (c) => {
  const empresaId = c.get('empresaId');
  const { id, itemId } = c.req.param();
  
  const os = await c.env.DB.prepare(`
    SELECT id, status FROM ordens_servico WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!os) {
    return c.json({ error: 'Ordem de serviço não encontrada' }, 404);
  }
  
  if (['FINALIZADA', 'CANCELADA'].includes(os.status as string)) {
    return c.json({ error: 'OS finalizada/cancelada não pode ter itens removidos' }, 400);
  }
  
  await c.env.DB.prepare(`DELETE FROM os_itens WHERE id = ? AND os_id = ?`).bind(itemId, id).run();
  
  // Atualizar valor total
  const totalItens = await c.env.DB.prepare(`
    SELECT SUM(quantidade * valor_unitario) as total FROM os_itens WHERE os_id = ?
  `).bind(id).first();
  
  await c.env.DB.prepare(`
    UPDATE ordens_servico SET valor_total = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(totalItens?.total || 0, id).run();
  
  return c.json({ message: 'Item removido' });
});

// POST /api/ordens-servico/:id/iniciar - Iniciar execução
ordensServico.post('/:id/iniciar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  
  const os = await c.env.DB.prepare(`
    SELECT id, status, tecnico_id FROM ordens_servico WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!os) {
    return c.json({ error: 'Ordem de serviço não encontrada' }, 404);
  }
  
  if (os.status !== 'ABERTA' && os.status !== 'AGENDADA') {
    return c.json({ error: 'OS precisa estar aberta ou agendada para iniciar' }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE ordens_servico SET status = 'EM_EXECUCAO', data_inicio = CURRENT_TIMESTAMP,
                              updated_at = CURRENT_TIMESTAMP, updated_by = ?
    WHERE id = ?
  `).bind(usuarioId, id).run();
  
  await c.env.DB.prepare(`
    INSERT INTO os_historico (id, os_id, tipo, descricao, created_by)
    VALUES (?, ?, 'INICIO', 'Execução iniciada', ?)
  `).bind(crypto.randomUUID(), id, usuarioId).run();
  
  return c.json({ message: 'Execução iniciada' });
});

// POST /api/ordens-servico/:id/pausar - Pausar execução
ordensServico.post('/:id/pausar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({ motivo: z.string().min(1) });
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Informe o motivo da pausa' }, 400);
  }
  
  const os = await c.env.DB.prepare(`
    SELECT id, status FROM ordens_servico WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!os) {
    return c.json({ error: 'Ordem de serviço não encontrada' }, 404);
  }
  
  if (os.status !== 'EM_EXECUCAO') {
    return c.json({ error: 'OS precisa estar em execução para pausar' }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE ordens_servico SET status = 'PAUSADA', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(id).run();
  
  await c.env.DB.prepare(`
    INSERT INTO os_historico (id, os_id, tipo, descricao, created_by)
    VALUES (?, ?, 'PAUSA', ?, ?)
  `).bind(crypto.randomUUID(), id, validation.data.motivo, usuarioId).run();
  
  return c.json({ message: 'Execução pausada' });
});

// POST /api/ordens-servico/:id/retomar - Retomar execução
ordensServico.post('/:id/retomar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  
  const os = await c.env.DB.prepare(`
    SELECT id, status FROM ordens_servico WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!os) {
    return c.json({ error: 'Ordem de serviço não encontrada' }, 404);
  }
  
  if (os.status !== 'PAUSADA') {
    return c.json({ error: 'OS precisa estar pausada para retomar' }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE ordens_servico SET status = 'EM_EXECUCAO', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(id).run();
  
  await c.env.DB.prepare(`
    INSERT INTO os_historico (id, os_id, tipo, descricao, created_by)
    VALUES (?, ?, 'RETOMADA', 'Execução retomada', ?)
  `).bind(crypto.randomUUID(), id, usuarioId).run();
  
  return c.json({ message: 'Execução retomada' });
});

// POST /api/ordens-servico/:id/finalizar - Finalizar OS
ordensServico.post('/:id/finalizar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    relatorio_tecnico: z.string().min(1),
    assinatura_cliente: z.string().optional(),
    fotos_urls: z.array(z.string()).optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Informe o relatório técnico' }, 400);
  }
  
  const os = await c.env.DB.prepare(`
    SELECT id, status FROM ordens_servico WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!os) {
    return c.json({ error: 'Ordem de serviço não encontrada' }, 404);
  }
  
  if (os.status !== 'EM_EXECUCAO') {
    return c.json({ error: 'OS precisa estar em execução para finalizar' }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE ordens_servico SET status = 'FINALIZADA', data_fim = CURRENT_TIMESTAMP,
                              relatorio_tecnico = ?, assinatura_cliente = ?,
                              fotos_urls = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
    WHERE id = ?
  `).bind(validation.data.relatorio_tecnico, validation.data.assinatura_cliente || null,
          validation.data.fotos_urls ? JSON.stringify(validation.data.fotos_urls) : null, usuarioId, id).run();
  
  await c.env.DB.prepare(`
    INSERT INTO os_historico (id, os_id, tipo, descricao, created_by)
    VALUES (?, ?, 'FINALIZACAO', 'Serviço finalizado', ?)
  `).bind(crypto.randomUUID(), id, usuarioId).run();
  
  return c.json({ message: 'Ordem de serviço finalizada' });
});

// POST /api/ordens-servico/:id/cancelar - Cancelar OS
ordensServico.post('/:id/cancelar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({ motivo: z.string().min(1) });
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Informe o motivo do cancelamento' }, 400);
  }
  
  const os = await c.env.DB.prepare(`
    SELECT id, status FROM ordens_servico WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!os) {
    return c.json({ error: 'Ordem de serviço não encontrada' }, 404);
  }
  
  if (os.status === 'FINALIZADA') {
    return c.json({ error: 'OS finalizada não pode ser cancelada' }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE ordens_servico SET status = 'CANCELADA', motivo_cancelamento = ?,
                              updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(validation.data.motivo, id).run();
  
  await c.env.DB.prepare(`
    INSERT INTO os_historico (id, os_id, tipo, descricao, created_by)
    VALUES (?, ?, 'CANCELAMENTO', ?, ?)
  `).bind(crypto.randomUUID(), id, validation.data.motivo, usuarioId).run();
  
  return c.json({ message: 'Ordem de serviço cancelada' });
});

// GET /api/ordens-servico/agenda - Agenda de OS
ordensServico.get('/agenda', async (c) => {
  const empresaId = c.get('empresaId');
  const { data_inicio, data_fim, tecnico_id } = c.req.query();
  
  let query = `SELECT os.*, c.razao_social as cliente_nome, t.nome as tecnico_nome
               FROM ordens_servico os
               JOIN clientes c ON os.cliente_id = c.id
               LEFT JOIN funcionarios t ON os.tecnico_id = t.id
               WHERE os.empresa_id = ?
                 AND os.status NOT IN ('FINALIZADA', 'CANCELADA')
                 AND os.data_agendada IS NOT NULL`;
  const params: any[] = [empresaId];
  
  if (data_inicio) {
    query += ` AND os.data_agendada >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    query += ` AND os.data_agendada <= ?`;
    params.push(data_fim);
  }
  
  if (tecnico_id) {
    query += ` AND os.tecnico_id = ?`;
    params.push(tecnico_id);
  }
  
  query += ` ORDER BY os.data_agendada ASC, os.hora_agendada ASC`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: result.results
  });
});

export default ordensServico;
