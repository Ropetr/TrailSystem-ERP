// ============================================
// PLANAC ERP - Rotas de CRM
// Oportunidades, Atividades e Tarefas
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const crm = new Hono<{ Bindings: Bindings; Variables: Variables }>();

crm.use('/*', requireAuth());

// ============================================
// SCHEMAS
// ============================================

const oportunidadeSchema = z.object({
  cliente_id: z.string().uuid().optional(),
  cliente_potencial_nome: z.string().max(200).optional(),
  cliente_potencial_telefone: z.string().max(20).optional(),
  cliente_potencial_email: z.string().email().optional(),
  titulo: z.string().min(2).max(200),
  descricao: z.string().optional(),
  valor_estimado: z.number().min(0).optional(),
  probabilidade: z.number().min(0).max(100).default(50),
  etapa: z.enum(['LEAD', 'QUALIFICACAO', 'PROPOSTA', 'NEGOCIACAO', 'FECHAMENTO', 'GANHO', 'PERDIDO']).default('LEAD'),
  origem: z.enum(['INDICACAO', 'SITE', 'TELEFONE', 'VISITA', 'WHATSAPP', 'EMAIL', 'FEIRA', 'OUTRO']).optional(),
  vendedor_id: z.string().uuid().optional(),
  data_previsao_fechamento: z.string().optional(),
  produtos_interesse: z.string().optional()
});

const tarefaSchema = z.object({
  oportunidade_id: z.string().uuid().optional(),
  cliente_id: z.string().uuid().optional(),
  titulo: z.string().min(2).max(200),
  descricao: z.string().optional(),
  tipo: z.enum(['LIGACAO', 'EMAIL', 'REUNIAO', 'VISITA', 'FOLLOWUP', 'PROPOSTA', 'OUTRO']).default('OUTRO'),
  prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).default('NORMAL'),
  data_vencimento: z.string(),
  hora_vencimento: z.string().optional(),
  responsavel_id: z.string().uuid().optional(),
  lembrete: z.boolean().default(false),
  lembrete_minutos: z.number().optional()
});

const atividadeSchema = z.object({
  oportunidade_id: z.string().uuid().optional(),
  cliente_id: z.string().uuid().optional(),
  tipo: z.enum(['LIGACAO', 'EMAIL', 'REUNIAO', 'VISITA', 'WHATSAPP', 'NOTA', 'OUTRO']),
  titulo: z.string().min(2).max(200),
  descricao: z.string().optional(),
  resultado: z.string().optional(),
  duracao_minutos: z.number().optional()
});

// ============================================
// OPORTUNIDADES (PIPELINE DE VENDAS)
// ============================================

// GET /crm/oportunidades - Listar
crm.get('/oportunidades', requirePermission('crm', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { etapa, vendedor_id, cliente_id, busca, page = '1', limit = '20' } = c.req.query();

  let query = `
    SELECT o.*, c.razao_social as cliente_nome, v.nome as vendedor_nome,
           (SELECT COUNT(*) FROM crm_tarefas t WHERE t.oportunidade_id = o.id AND t.status = 'PENDENTE') as tarefas_pendentes
    FROM crm_oportunidades o
    LEFT JOIN clientes c ON o.cliente_id = c.id
    LEFT JOIN vendedores v ON o.vendedor_id = v.id
    WHERE o.empresa_id = ?
  `;
  const params: any[] = [usuario.empresa_id];

  if (etapa) {
    query += ` AND o.etapa = ?`;
    params.push(etapa);
  }

  if (vendedor_id) {
    query += ` AND o.vendedor_id = ?`;
    params.push(vendedor_id);
  }

  if (cliente_id) {
    query += ` AND o.cliente_id = ?`;
    params.push(cliente_id);
  }

  if (busca) {
    query += ` AND (o.titulo LIKE ? OR c.razao_social LIKE ? OR o.cliente_potencial_nome LIKE ?)`;
    params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
  }

  query += ` ORDER BY o.updated_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({ success: true, data: result.results });
});

// GET /crm/oportunidades/pipeline - Visão Kanban
crm.get('/oportunidades/pipeline', requirePermission('crm', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const { vendedor_id } = c.req.query();

  let whereVendedor = '';
  const params: any[] = [usuario.empresa_id];
  
  if (vendedor_id) {
    whereVendedor = ' AND o.vendedor_id = ?';
    params.push(vendedor_id);
  }

  const etapas = ['LEAD', 'QUALIFICACAO', 'PROPOSTA', 'NEGOCIACAO', 'FECHAMENTO'];
  const pipeline: any = {};

  for (const etapa of etapas) {
    const result = await c.env.DB.prepare(`
      SELECT o.*, c.razao_social as cliente_nome
      FROM crm_oportunidades o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      WHERE o.empresa_id = ? ${whereVendedor} AND o.etapa = ?
      ORDER BY o.updated_at DESC
    `).bind(...params, etapa).all();

    const totais = await c.env.DB.prepare(`
      SELECT COUNT(*) as quantidade, SUM(valor_estimado) as valor_total
      FROM crm_oportunidades
      WHERE empresa_id = ? ${whereVendedor} AND etapa = ?
    `).bind(...params, etapa).first<any>();

    pipeline[etapa] = {
      etapa,
      quantidade: totais?.quantidade || 0,
      valor_total: totais?.valor_total || 0,
      oportunidades: result.results
    };
  }

  // Resumo geral
  const resumo = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_oportunidades,
      SUM(valor_estimado) as valor_pipeline,
      SUM(valor_estimado * probabilidade / 100) as valor_ponderado,
      SUM(CASE WHEN etapa = 'GANHO' THEN 1 ELSE 0 END) as ganhas,
      SUM(CASE WHEN etapa = 'PERDIDO' THEN 1 ELSE 0 END) as perdidas
    FROM crm_oportunidades
    WHERE empresa_id = ? ${whereVendedor} AND etapa NOT IN ('GANHO', 'PERDIDO')
  `).bind(...params).first<any>();

  return c.json({
    success: true,
    data: {
      pipeline,
      resumo
    }
  });
});

// GET /crm/oportunidades/:id - Buscar com histórico
crm.get('/oportunidades/:id', requirePermission('crm', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const oportunidade = await c.env.DB.prepare(`
    SELECT o.*, c.razao_social as cliente_nome, c.cpf_cnpj as cliente_documento,
           c.telefone as cliente_telefone, c.email as cliente_email,
           v.nome as vendedor_nome
    FROM crm_oportunidades o
    LEFT JOIN clientes c ON o.cliente_id = c.id
    LEFT JOIN vendedores v ON o.vendedor_id = v.id
    WHERE o.id = ? AND o.empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!oportunidade) {
    return c.json({ success: false, error: 'Oportunidade não encontrada' }, 404);
  }

  // Histórico de etapas
  const historico = await c.env.DB.prepare(`
    SELECT h.*, u.nome as usuario_nome
    FROM crm_oportunidades_historico h
    LEFT JOIN usuarios u ON h.usuario_id = u.id
    WHERE h.oportunidade_id = ?
    ORDER BY h.created_at DESC
  `).bind(id).all();

  // Atividades
  const atividades = await c.env.DB.prepare(`
    SELECT a.*, u.nome as usuario_nome
    FROM crm_atividades a
    LEFT JOIN usuarios u ON a.usuario_id = u.id
    WHERE a.oportunidade_id = ?
    ORDER BY a.created_at DESC
    LIMIT 10
  `).bind(id).all();

  // Tarefas
  const tarefas = await c.env.DB.prepare(`
    SELECT t.*, u.nome as responsavel_nome
    FROM crm_tarefas t
    LEFT JOIN usuarios u ON t.responsavel_id = u.id
    WHERE t.oportunidade_id = ?
    ORDER BY t.data_vencimento ASC
  `).bind(id).all();

  return c.json({
    success: true,
    data: {
      ...oportunidade,
      historico: historico.results,
      atividades: atividades.results,
      tarefas: tarefas.results
    }
  });
});

// POST /crm/oportunidades - Criar
crm.post('/oportunidades', requirePermission('crm', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = oportunidadeSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;
  const id = crypto.randomUUID();

  // Gerar número
  const seq = await c.env.DB.prepare(`
    SELECT COALESCE(MAX(CAST(numero AS INTEGER)), 0) + 1 as proximo
    FROM crm_oportunidades WHERE empresa_id = ?
  `).bind(usuario.empresa_id).first<{ proximo: number }>();

  const numero = String(seq?.proximo || 1).padStart(6, '0');

  await c.env.DB.prepare(`
    INSERT INTO crm_oportunidades (
      id, empresa_id, numero, cliente_id, cliente_potencial_nome, cliente_potencial_telefone,
      cliente_potencial_email, titulo, descricao, valor_estimado, probabilidade, etapa,
      origem, vendedor_id, data_previsao_fechamento, produtos_interesse, criado_por
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, usuario.empresa_id, numero, data.cliente_id || null,
    data.cliente_potencial_nome || null, data.cliente_potencial_telefone || null,
    data.cliente_potencial_email || null, data.titulo, data.descricao || null,
    data.valor_estimado || 0, data.probabilidade, data.etapa,
    data.origem || null, data.vendedor_id || null,
    data.data_previsao_fechamento || null, data.produtos_interesse || null, usuario.id
  ).run();

  // Registrar histórico
  await c.env.DB.prepare(`
    INSERT INTO crm_oportunidades_historico (id, oportunidade_id, etapa_anterior, etapa_nova, usuario_id, observacao)
    VALUES (?, ?, NULL, ?, ?, 'Oportunidade criada')
  `).bind(crypto.randomUUID(), id, data.etapa, usuario.id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'crm_oportunidades',
    entidade_id: id,
    dados_novos: { numero, ...data }
  });

  return c.json({ success: true, data: { id, numero } }, 201);
});

// PUT /crm/oportunidades/:id - Atualizar
crm.put('/oportunidades/:id', requirePermission('crm', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const oportunidadeAtual = await c.env.DB.prepare(`
    SELECT * FROM crm_oportunidades WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first<any>();

  if (!oportunidadeAtual) {
    return c.json({ success: false, error: 'Oportunidade não encontrada' }, 404);
  }

  const validation = oportunidadeSchema.partial().safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  // Se mudou de etapa, registrar histórico
  if (data.etapa && data.etapa !== oportunidadeAtual.etapa) {
    await c.env.DB.prepare(`
      INSERT INTO crm_oportunidades_historico (id, oportunidade_id, etapa_anterior, etapa_nova, usuario_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), id, oportunidadeAtual.etapa, data.etapa, usuario.id).run();

    // Se ganhou ou perdeu, registrar data
    if (data.etapa === 'GANHO' || data.etapa === 'PERDIDO') {
      await c.env.DB.prepare(`
        UPDATE crm_oportunidades SET data_fechamento = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(id).run();
    }
  }

  await c.env.DB.prepare(`
    UPDATE crm_oportunidades SET
      cliente_id = COALESCE(?, cliente_id),
      cliente_potencial_nome = COALESCE(?, cliente_potencial_nome),
      cliente_potencial_telefone = COALESCE(?, cliente_potencial_telefone),
      cliente_potencial_email = COALESCE(?, cliente_potencial_email),
      titulo = COALESCE(?, titulo),
      descricao = COALESCE(?, descricao),
      valor_estimado = COALESCE(?, valor_estimado),
      probabilidade = COALESCE(?, probabilidade),
      etapa = COALESCE(?, etapa),
      origem = COALESCE(?, origem),
      vendedor_id = COALESCE(?, vendedor_id),
      data_previsao_fechamento = COALESCE(?, data_previsao_fechamento),
      produtos_interesse = COALESCE(?, produtos_interesse),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(
    data.cliente_id, data.cliente_potencial_nome, data.cliente_potencial_telefone,
    data.cliente_potencial_email, data.titulo, data.descricao, data.valor_estimado,
    data.probabilidade, data.etapa, data.origem, data.vendedor_id,
    data.data_previsao_fechamento, data.produtos_interesse, id, usuario.empresa_id
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'ATUALIZAR',
    entidade: 'crm_oportunidades',
    entidade_id: id,
    dados_anteriores: oportunidadeAtual,
    dados_novos: data
  });

  return c.json({ success: true, message: 'Oportunidade atualizada' });
});

// POST /crm/oportunidades/:id/converter - Converter em cliente e pedido
crm.post('/oportunidades/:id/converter', requirePermission('crm', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const oportunidade = await c.env.DB.prepare(`
    SELECT * FROM crm_oportunidades WHERE id = ? AND empresa_id = ? AND etapa = 'GANHO'
  `).bind(id, usuario.empresa_id).first<any>();

  if (!oportunidade) {
    return c.json({ success: false, error: 'Oportunidade não encontrada ou não está como GANHO' }, 404);
  }

  let cliente_id = oportunidade.cliente_id;

  // Se não tem cliente vinculado e tem dados de cliente potencial, criar cliente
  if (!cliente_id && oportunidade.cliente_potencial_nome) {
    cliente_id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO clientes (id, empresa_id, tipo_pessoa, razao_social, telefone, email, origem, status)
      VALUES (?, ?, 'PJ', ?, ?, ?, 'CRM', 'ATIVO')
    `).bind(
      cliente_id, usuario.empresa_id, oportunidade.cliente_potencial_nome,
      oportunidade.cliente_potencial_telefone, oportunidade.cliente_potencial_email
    ).run();

    // Vincular à oportunidade
    await c.env.DB.prepare(`
      UPDATE crm_oportunidades SET cliente_id = ? WHERE id = ?
    `).bind(cliente_id, id).run();
  }

  // Marcar como convertido
  await c.env.DB.prepare(`
    UPDATE crm_oportunidades SET
      convertida = 1,
      data_conversao = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run();

  return c.json({
    success: true,
    message: 'Oportunidade convertida',
    data: { cliente_id }
  });
});

// DELETE /crm/oportunidades/:id - Excluir
crm.delete('/oportunidades/:id', requirePermission('crm', 'excluir'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const oportunidade = await c.env.DB.prepare(`
    SELECT * FROM crm_oportunidades WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!oportunidade) {
    return c.json({ success: false, error: 'Oportunidade não encontrada' }, 404);
  }

  // Excluir relacionados
  await c.env.DB.prepare(`DELETE FROM crm_oportunidades_historico WHERE oportunidade_id = ?`).bind(id).run();
  await c.env.DB.prepare(`DELETE FROM crm_atividades WHERE oportunidade_id = ?`).bind(id).run();
  await c.env.DB.prepare(`DELETE FROM crm_tarefas WHERE oportunidade_id = ?`).bind(id).run();
  await c.env.DB.prepare(`DELETE FROM crm_oportunidades WHERE id = ?`).bind(id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'EXCLUIR',
    entidade: 'crm_oportunidades',
    entidade_id: id,
    dados_anteriores: oportunidade
  });

  return c.json({ success: true, message: 'Oportunidade excluída' });
});

// ============================================
// TAREFAS
// ============================================

// GET /crm/tarefas - Listar tarefas
crm.get('/tarefas', requirePermission('crm', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { status, responsavel_id, prioridade, data_inicio, data_fim, page = '1', limit = '20' } = c.req.query();

  let query = `
    SELECT t.*, o.titulo as oportunidade_titulo, c.razao_social as cliente_nome,
           u.nome as responsavel_nome
    FROM crm_tarefas t
    LEFT JOIN crm_oportunidades o ON t.oportunidade_id = o.id
    LEFT JOIN clientes c ON t.cliente_id = c.id
    LEFT JOIN usuarios u ON t.responsavel_id = u.id
    WHERE t.empresa_id = ?
  `;
  const params: any[] = [usuario.empresa_id];

  if (status) {
    query += ` AND t.status = ?`;
    params.push(status);
  } else {
    query += ` AND t.status != 'CANCELADA'`;
  }

  if (responsavel_id) {
    query += ` AND t.responsavel_id = ?`;
    params.push(responsavel_id);
  }

  if (prioridade) {
    query += ` AND t.prioridade = ?`;
    params.push(prioridade);
  }

  if (data_inicio) {
    query += ` AND t.data_vencimento >= ?`;
    params.push(data_inicio);
  }

  if (data_fim) {
    query += ` AND t.data_vencimento <= ?`;
    params.push(data_fim);
  }

  query += ` ORDER BY t.data_vencimento ASC, t.prioridade DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({ success: true, data: result.results });
});

// GET /crm/tarefas/hoje - Tarefas do dia
crm.get('/tarefas/hoje', requirePermission('crm', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const hoje = new Date().toISOString().split('T')[0];

  const tarefas = await c.env.DB.prepare(`
    SELECT t.*, o.titulo as oportunidade_titulo, c.razao_social as cliente_nome
    FROM crm_tarefas t
    LEFT JOIN crm_oportunidades o ON t.oportunidade_id = o.id
    LEFT JOIN clientes c ON t.cliente_id = c.id
    WHERE t.empresa_id = ?
      AND t.data_vencimento = ?
      AND t.status = 'PENDENTE'
      AND (t.responsavel_id = ? OR t.responsavel_id IS NULL)
    ORDER BY t.hora_vencimento ASC, t.prioridade DESC
  `).bind(usuario.empresa_id, hoje, usuario.id).all();

  return c.json({ success: true, data: tarefas.results });
});

// GET /crm/tarefas/atrasadas - Tarefas atrasadas
crm.get('/tarefas/atrasadas', requirePermission('crm', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const hoje = new Date().toISOString().split('T')[0];

  const tarefas = await c.env.DB.prepare(`
    SELECT t.*, o.titulo as oportunidade_titulo, c.razao_social as cliente_nome,
           u.nome as responsavel_nome
    FROM crm_tarefas t
    LEFT JOIN crm_oportunidades o ON t.oportunidade_id = o.id
    LEFT JOIN clientes c ON t.cliente_id = c.id
    LEFT JOIN usuarios u ON t.responsavel_id = u.id
    WHERE t.empresa_id = ?
      AND t.data_vencimento < ?
      AND t.status = 'PENDENTE'
    ORDER BY t.data_vencimento ASC
  `).bind(usuario.empresa_id, hoje).all();

  return c.json({ success: true, data: tarefas.results });
});

// POST /crm/tarefas - Criar tarefa
crm.post('/tarefas', requirePermission('crm', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = tarefaSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;
  const id = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO crm_tarefas (
      id, empresa_id, oportunidade_id, cliente_id, titulo, descricao, tipo,
      prioridade, status, data_vencimento, hora_vencimento, responsavel_id,
      lembrete, lembrete_minutos, criado_por
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE', ?, ?, ?, ?, ?, ?)
  `).bind(
    id, usuario.empresa_id, data.oportunidade_id || null, data.cliente_id || null,
    data.titulo, data.descricao || null, data.tipo, data.prioridade,
    data.data_vencimento, data.hora_vencimento || null,
    data.responsavel_id || usuario.id, data.lembrete ? 1 : 0,
    data.lembrete_minutos || null, usuario.id
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'crm_tarefas',
    entidade_id: id,
    dados_novos: data
  });

  return c.json({ success: true, data: { id } }, 201);
});

// PUT /crm/tarefas/:id - Atualizar tarefa
crm.put('/tarefas/:id', requirePermission('crm', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const tarefaAtual = await c.env.DB.prepare(`
    SELECT * FROM crm_tarefas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!tarefaAtual) {
    return c.json({ success: false, error: 'Tarefa não encontrada' }, 404);
  }

  const validation = tarefaSchema.partial().safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  await c.env.DB.prepare(`
    UPDATE crm_tarefas SET
      oportunidade_id = COALESCE(?, oportunidade_id),
      cliente_id = COALESCE(?, cliente_id),
      titulo = COALESCE(?, titulo),
      descricao = COALESCE(?, descricao),
      tipo = COALESCE(?, tipo),
      prioridade = COALESCE(?, prioridade),
      data_vencimento = COALESCE(?, data_vencimento),
      hora_vencimento = COALESCE(?, hora_vencimento),
      responsavel_id = COALESCE(?, responsavel_id),
      lembrete = COALESCE(?, lembrete),
      lembrete_minutos = COALESCE(?, lembrete_minutos),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(
    data.oportunidade_id, data.cliente_id, data.titulo, data.descricao,
    data.tipo, data.prioridade, data.data_vencimento, data.hora_vencimento,
    data.responsavel_id, data.lembrete !== undefined ? (data.lembrete ? 1 : 0) : null,
    data.lembrete_minutos, id, usuario.empresa_id
  ).run();

  return c.json({ success: true, message: 'Tarefa atualizada' });
});

// POST /crm/tarefas/:id/concluir - Concluir tarefa
crm.post('/tarefas/:id/concluir', requirePermission('crm', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();
  const { resultado } = body;

  const tarefa = await c.env.DB.prepare(`
    SELECT * FROM crm_tarefas WHERE id = ? AND empresa_id = ? AND status = 'PENDENTE'
  `).bind(id, usuario.empresa_id).first<any>();

  if (!tarefa) {
    return c.json({ success: false, error: 'Tarefa não encontrada ou já concluída' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE crm_tarefas SET
      status = 'CONCLUIDA',
      resultado = ?,
      data_conclusao = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(resultado || null, id).run();

  // Criar atividade automaticamente
  if (tarefa.oportunidade_id || tarefa.cliente_id) {
    await c.env.DB.prepare(`
      INSERT INTO crm_atividades (
        id, empresa_id, oportunidade_id, cliente_id, tipo, titulo, descricao, resultado, usuario_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), usuario.empresa_id,
      tarefa.oportunidade_id || null, tarefa.cliente_id || null,
      tarefa.tipo, `Tarefa concluída: ${tarefa.titulo}`,
      tarefa.descricao, resultado || null, usuario.id
    ).run();
  }

  return c.json({ success: true, message: 'Tarefa concluída' });
});

// DELETE /crm/tarefas/:id - Cancelar tarefa
crm.delete('/tarefas/:id', requirePermission('crm', 'excluir'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const tarefa = await c.env.DB.prepare(`
    SELECT * FROM crm_tarefas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!tarefa) {
    return c.json({ success: false, error: 'Tarefa não encontrada' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE crm_tarefas SET status = 'CANCELADA', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(id).run();

  return c.json({ success: true, message: 'Tarefa cancelada' });
});

// ============================================
// ATIVIDADES
// ============================================

// GET /crm/atividades - Listar atividades
crm.get('/atividades', requirePermission('crm', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { oportunidade_id, cliente_id, tipo, page = '1', limit = '20' } = c.req.query();

  let query = `
    SELECT a.*, o.titulo as oportunidade_titulo, c.razao_social as cliente_nome,
           u.nome as usuario_nome
    FROM crm_atividades a
    LEFT JOIN crm_oportunidades o ON a.oportunidade_id = o.id
    LEFT JOIN clientes c ON a.cliente_id = c.id
    LEFT JOIN usuarios u ON a.usuario_id = u.id
    WHERE a.empresa_id = ?
  `;
  const params: any[] = [usuario.empresa_id];

  if (oportunidade_id) {
    query += ` AND a.oportunidade_id = ?`;
    params.push(oportunidade_id);
  }

  if (cliente_id) {
    query += ` AND a.cliente_id = ?`;
    params.push(cliente_id);
  }

  if (tipo) {
    query += ` AND a.tipo = ?`;
    params.push(tipo);
  }

  query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({ success: true, data: result.results });
});

// POST /crm/atividades - Registrar atividade
crm.post('/atividades', requirePermission('crm', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = atividadeSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  if (!data.oportunidade_id && !data.cliente_id) {
    return c.json({ success: false, error: 'Informe oportunidade ou cliente' }, 400);
  }

  const id = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO crm_atividades (
      id, empresa_id, oportunidade_id, cliente_id, tipo, titulo, descricao,
      resultado, duracao_minutos, usuario_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, usuario.empresa_id, data.oportunidade_id || null, data.cliente_id || null,
    data.tipo, data.titulo, data.descricao || null, data.resultado || null,
    data.duracao_minutos || null, usuario.id
  ).run();

  // Atualizar updated_at da oportunidade
  if (data.oportunidade_id) {
    await c.env.DB.prepare(`
      UPDATE crm_oportunidades SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(data.oportunidade_id).run();
  }

  return c.json({ success: true, data: { id } }, 201);
});

export default crm;
