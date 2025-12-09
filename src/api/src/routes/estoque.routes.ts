// =============================================
// 🏢 PLANAC ERP - Rotas de Estoque
// =============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const estoque = new Hono<{ Bindings: Bindings; Variables: Variables }>();

estoque.use('*', authMiddleware());

// Schemas
const movimentacaoSchema = z.object({
  filial_id: z.string().uuid(),
  produto_id: z.string().uuid(),
  local_id: z.string().uuid().optional(),
  tipo: z.enum(['entrada', 'saida', 'ajuste']),
  subtipo: z.string().optional(),
  quantidade: z.number().positive(),
  custo_unitario: z.number().min(0).optional(),
  documento_tipo: z.string().optional(),
  documento_id: z.string().optional(),
  documento_numero: z.string().optional(),
  observacao: z.string().optional()
});

const reservaSchema = z.object({
  filial_id: z.string().uuid(),
  produto_id: z.string().uuid(),
  local_id: z.string().uuid().optional(),
  quantidade: z.number().positive(),
  documento_tipo: z.string(),
  documento_id: z.string(),
  data_expiracao: z.string().optional()
});

// GET /estoque - Consultar saldos
estoque.get('/', requirePermission('estoque', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { filial_id, local_id, produto_id, abaixo_minimo, page = '1', limit = '50' } = c.req.query();
  
  let where = 'WHERE e.empresa_id = ?';
  const params: any[] = [user.empresa_id];
  
  if (filial_id) {
    where += ' AND e.filial_id = ?';
    params.push(filial_id);
  }
  
  if (local_id) {
    where += ' AND e.local_id = ?';
    params.push(local_id);
  }
  
  if (produto_id) {
    where += ' AND e.produto_id = ?';
    params.push(produto_id);
  }
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `
    SELECT 
      e.*,
      p.codigo as produto_codigo, p.nome as produto_nome,
      p.estoque_minimo, p.estoque_maximo, p.ponto_pedido,
      f.nome as filial_nome,
      le.nome as local_nome,
      (e.quantidade - e.quantidade_reservada) as quantidade_disponivel
    FROM estoque e
    JOIN produtos p ON e.produto_id = p.id
    JOIN filiais f ON e.filial_id = f.id
    LEFT JOIN locais_estoque le ON e.local_id = le.id
    ${where}
  `;
  
  if (abaixo_minimo === 'true') {
    query += ' AND e.quantidade < p.estoque_minimo';
  }
  
  query += ' ORDER BY p.nome LIMIT ? OFFSET ?';
  
  const data = await c.env.DB.prepare(query).bind(...params, parseInt(limit), offset).all();
  
  return c.json({
    success: true,
    data: data.results
  });
});

// GET /estoque/produto/:produtoId - Estoque por produto
estoque.get('/produto/:produtoId', requirePermission('estoque', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { produtoId } = c.req.param();
  
  // Total consolidado
  const total = await c.env.DB.prepare(`
    SELECT 
      SUM(quantidade) as quantidade_total,
      SUM(quantidade_reservada) as reservada_total,
      SUM(quantidade - quantidade_reservada) as disponivel_total
    FROM estoque
    WHERE produto_id = ? AND empresa_id = ?
  `).bind(produtoId, user.empresa_id).first();
  
  // Detalhado por local
  const detalhes = await c.env.DB.prepare(`
    SELECT 
      e.*,
      f.nome as filial_nome,
      le.nome as local_nome,
      (e.quantidade - e.quantidade_reservada) as quantidade_disponivel
    FROM estoque e
    JOIN filiais f ON e.filial_id = f.id
    LEFT JOIN locais_estoque le ON e.local_id = le.id
    WHERE e.produto_id = ? AND e.empresa_id = ?
    ORDER BY f.nome, le.nome
  `).bind(produtoId, user.empresa_id).all();
  
  return c.json({
    success: true,
    data: {
      total,
      detalhes: detalhes.results
    }
  });
});

// POST /estoque/movimentacao - Registrar movimentação
estoque.post('/movimentacao', requirePermission('estoque', 'movimentar'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const validacao = movimentacaoSchema.safeParse(body);
  if (!validacao.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validacao.error.errors }, 400);
  }
  
  const dados = validacao.data;
  
  // Busca saldo atual
  let saldo = await c.env.DB.prepare(`
    SELECT * FROM estoque 
    WHERE empresa_id = ? AND filial_id = ? AND produto_id = ? AND COALESCE(local_id, '') = COALESCE(?, '')
  `).bind(user.empresa_id, dados.filial_id, dados.produto_id, dados.local_id || '').first<any>();
  
  const quantidadeAnterior = saldo?.quantidade || 0;
  let quantidadePosterior = quantidadeAnterior;
  
  // Calcula nova quantidade
  if (dados.tipo === 'entrada') {
    quantidadePosterior = quantidadeAnterior + dados.quantidade;
  } else if (dados.tipo === 'saida') {
    if (quantidadeAnterior - (saldo?.quantidade_reservada || 0) < dados.quantidade) {
      return c.json({ success: false, error: 'Estoque disponível insuficiente' }, 400);
    }
    quantidadePosterior = quantidadeAnterior - dados.quantidade;
  } else if (dados.tipo === 'ajuste') {
    quantidadePosterior = dados.quantidade;
  }
  
  const movimentacaoId = crypto.randomUUID();
  
  // Registra movimentação
  await c.env.DB.prepare(`
    INSERT INTO estoque_movimentacoes (
      id, empresa_id, filial_id, produto_id, local_id, tipo, subtipo,
      quantidade, quantidade_anterior, quantidade_posterior,
      custo_unitario, custo_total, documento_tipo, documento_id, documento_numero,
      observacao, usuario_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    movimentacaoId, user.empresa_id, dados.filial_id, dados.produto_id,
    dados.local_id || null, dados.tipo, dados.subtipo || null,
    dados.quantidade, quantidadeAnterior, quantidadePosterior,
    dados.custo_unitario || null,
    dados.custo_unitario ? dados.quantidade * dados.custo_unitario : null,
    dados.documento_tipo || null, dados.documento_id || null,
    dados.documento_numero || null, dados.observacao || null,
    user.id, new Date().toISOString()
  ).run();
  
  // Atualiza ou cria saldo
  if (saldo) {
    await c.env.DB.prepare(`
      UPDATE estoque SET 
        quantidade = ?,
        custo_ultima_compra = COALESCE(?, custo_ultima_compra),
        ultima_entrada = CASE WHEN ? = 'entrada' THEN ? ELSE ultima_entrada END,
        ultima_saida = CASE WHEN ? = 'saida' THEN ? ELSE ultima_saida END,
        updated_at = ?
      WHERE id = ?
    `).bind(
      quantidadePosterior,
      dados.tipo === 'entrada' ? dados.custo_unitario : null,
      dados.tipo, new Date().toISOString(),
      dados.tipo, new Date().toISOString(),
      new Date().toISOString(),
      saldo.id
    ).run();
  } else {
    await c.env.DB.prepare(`
      INSERT INTO estoque (
        id, empresa_id, filial_id, produto_id, local_id,
        quantidade, quantidade_reservada, custo_medio, custo_ultima_compra,
        ultima_entrada, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), user.empresa_id, dados.filial_id, dados.produto_id,
      dados.local_id || null, quantidadePosterior, dados.custo_unitario || 0,
      dados.custo_unitario || 0, new Date().toISOString(),
      new Date().toISOString(), new Date().toISOString()
    ).run();
  }
  
  await registrarAuditoria(c.env.DB, {
    empresa_id: user.empresa_id,
    usuario_id: user.id,
    acao: 'movimentar',
    tabela: 'estoque',
    registro_id: movimentacaoId,
    dados_novos: { tipo: dados.tipo, quantidade: dados.quantidade, produto_id: dados.produto_id }
  });
  
  return c.json({
    success: true,
    data: { id: movimentacaoId, quantidade_anterior: quantidadeAnterior, quantidade_posterior: quantidadePosterior },
    message: 'Movimentação registrada com sucesso'
  }, 201);
});

// GET /estoque/movimentacoes - Histórico de movimentações
estoque.get('/movimentacoes', requirePermission('estoque', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { filial_id, produto_id, tipo, data_inicio, data_fim, page = '1', limit = '50' } = c.req.query();
  
  let where = 'WHERE m.empresa_id = ?';
  const params: any[] = [user.empresa_id];
  
  if (filial_id) {
    where += ' AND m.filial_id = ?';
    params.push(filial_id);
  }
  
  if (produto_id) {
    where += ' AND m.produto_id = ?';
    params.push(produto_id);
  }
  
  if (tipo) {
    where += ' AND m.tipo = ?';
    params.push(tipo);
  }
  
  if (data_inicio) {
    where += ' AND DATE(m.created_at) >= ?';
    params.push(data_inicio);
  }
  
  if (data_fim) {
    where += ' AND DATE(m.created_at) <= ?';
    params.push(data_fim);
  }
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  const data = await c.env.DB.prepare(`
    SELECT 
      m.*,
      p.codigo as produto_codigo, p.nome as produto_nome,
      f.nome as filial_nome,
      le.nome as local_nome,
      u.nome as usuario_nome
    FROM estoque_movimentacoes m
    JOIN produtos p ON m.produto_id = p.id
    JOIN filiais f ON m.filial_id = f.id
    LEFT JOIN locais_estoque le ON m.local_id = le.id
    LEFT JOIN usuarios u ON m.usuario_id = u.id
    ${where}
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, parseInt(limit), offset).all();
  
  return c.json({ success: true, data: data.results });
});

// POST /estoque/reserva - Criar reserva
estoque.post('/reserva', requirePermission('estoque', 'reservar'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const validacao = reservaSchema.safeParse(body);
  if (!validacao.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validacao.error.errors }, 400);
  }
  
  const dados = validacao.data;
  
  // Verifica disponibilidade
  const saldo = await c.env.DB.prepare(`
    SELECT quantidade, quantidade_reservada, (quantidade - quantidade_reservada) as disponivel
    FROM estoque
    WHERE empresa_id = ? AND filial_id = ? AND produto_id = ?
  `).bind(user.empresa_id, dados.filial_id, dados.produto_id).first<any>();
  
  if (!saldo || saldo.disponivel < dados.quantidade) {
    return c.json({
      success: false,
      error: 'Estoque disponível insuficiente',
      details: { disponivel: saldo?.disponivel || 0, solicitado: dados.quantidade }
    }, 400);
  }
  
  const reservaId = crypto.randomUUID();
  
  // Cria reserva
  await c.env.DB.prepare(`
    INSERT INTO estoque_reservas (
      id, empresa_id, filial_id, produto_id, local_id, quantidade,
      documento_tipo, documento_id, status, data_expiracao, usuario_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ativa', ?, ?, ?, ?)
  `).bind(
    reservaId, user.empresa_id, dados.filial_id, dados.produto_id,
    dados.local_id || null, dados.quantidade,
    dados.documento_tipo, dados.documento_id,
    dados.data_expiracao || null, user.id,
    new Date().toISOString(), new Date().toISOString()
  ).run();
  
  // Atualiza quantidade reservada
  await c.env.DB.prepare(`
    UPDATE estoque SET quantidade_reservada = quantidade_reservada + ?, updated_at = ?
    WHERE empresa_id = ? AND filial_id = ? AND produto_id = ?
  `).bind(dados.quantidade, new Date().toISOString(), user.empresa_id, dados.filial_id, dados.produto_id).run();
  
  return c.json({
    success: true,
    data: { id: reservaId },
    message: 'Reserva criada com sucesso'
  }, 201);
});

// DELETE /estoque/reserva/:id - Cancelar reserva
estoque.delete('/reserva/:id', requirePermission('estoque', 'reservar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  
  const reserva = await c.env.DB.prepare(`
    SELECT * FROM estoque_reservas WHERE id = ? AND empresa_id = ? AND status = 'ativa'
  `).bind(id, user.empresa_id).first<any>();
  
  if (!reserva) {
    return c.json({ success: false, error: 'Reserva não encontrada ou já cancelada' }, 404);
  }
  
  // Cancela reserva
  await c.env.DB.prepare(`
    UPDATE estoque_reservas SET status = 'cancelada', updated_at = ? WHERE id = ?
  `).bind(new Date().toISOString(), id).run();
  
  // Libera quantidade reservada
  await c.env.DB.prepare(`
    UPDATE estoque SET quantidade_reservada = quantidade_reservada - ?, updated_at = ?
    WHERE empresa_id = ? AND filial_id = ? AND produto_id = ?
  `).bind(reserva.quantidade, new Date().toISOString(), user.empresa_id, reserva.filial_id, reserva.produto_id).run();
  
  return c.json({ success: true, message: 'Reserva cancelada com sucesso' });
});

// GET /estoque/locais - Listar locais de estoque
estoque.get('/locais', requirePermission('estoque', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { filial_id } = c.req.query();
  
  let where = 'WHERE empresa_id = ? AND ativo = 1';
  const params: any[] = [user.empresa_id];
  
  if (filial_id) {
    where += ' AND filial_id = ?';
    params.push(filial_id);
  }
  
  const data = await c.env.DB.prepare(`
    SELECT * FROM locais_estoque ${where} ORDER BY nome
  `).bind(...params).all();
  
  return c.json({ success: true, data: data.results });
});

// POST /estoque/locais - Criar local de estoque
estoque.post('/locais', requirePermission('estoque', 'criar'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO locais_estoque (
      id, empresa_id, filial_id, codigo, nome, tipo, local_pai_id,
      rua, predio, nivel, posicao, capacidade_m3, capacidade_kg,
      permite_venda, permite_compra, bloqueado, ativo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(
    id, user.empresa_id, body.filial_id, body.codigo, body.nome,
    body.tipo || 'almoxarifado', body.local_pai_id || null,
    body.rua || null, body.predio || null, body.nivel || null, body.posicao || null,
    body.capacidade_m3 || null, body.capacidade_kg || null,
    body.permite_venda ? 1 : 0, body.permite_compra ? 1 : 0, 0,
    new Date().toISOString(), new Date().toISOString()
  ).run();
  
  return c.json({ success: true, data: { id }, message: 'Local de estoque criado' }, 201);
});

// GET /estoque/alertas - Produtos abaixo do mínimo
estoque.get('/alertas', requirePermission('estoque', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { filial_id } = c.req.query();
  
  let where = 'WHERE e.empresa_id = ?';
  const params: any[] = [user.empresa_id];
  
  if (filial_id) {
    where += ' AND e.filial_id = ?';
    params.push(filial_id);
  }
  
  const abaixoMinimo = await c.env.DB.prepare(`
    SELECT 
      p.id, p.codigo, p.nome, p.estoque_minimo, p.ponto_pedido,
      e.filial_id, f.nome as filial_nome,
      SUM(e.quantidade) as quantidade_atual,
      SUM(e.quantidade_reservada) as quantidade_reservada,
      SUM(e.quantidade - e.quantidade_reservada) as quantidade_disponivel
    FROM estoque e
    JOIN produtos p ON e.produto_id = p.id
    JOIN filiais f ON e.filial_id = f.id
    ${where}
    GROUP BY p.id, e.filial_id
    HAVING quantidade_atual < p.estoque_minimo OR quantidade_atual < p.ponto_pedido
    ORDER BY (p.estoque_minimo - quantidade_atual) DESC
  `).bind(...params).all();
  
  return c.json({
    success: true,
    data: abaixoMinimo.results
  });
});

export default estoque;
