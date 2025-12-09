// =============================================
// 🏢 PLANAC ERP - Rotas de Pedidos de Venda
// =============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const pedidos = new Hono<{ Bindings: Bindings; Variables: Variables }>();

pedidos.use('*', authMiddleware());

// Schemas
const criarPedidoSchema = z.object({
  filial_id: z.string().uuid(),
  cliente_id: z.string().uuid(),
  vendedor_id: z.string().uuid().optional(),
  canal: z.enum(['interno', 'ecommerce', 'marketplace', 'whatsapp']).default('interno'),
  tabela_preco_id: z.string().uuid().optional(),
  condicao_pagamento_id: z.string().uuid().optional(),
  transportadora_id: z.string().uuid().optional(),
  endereco_entrega_id: z.string().uuid().optional(),
  valor_frete: z.number().min(0).default(0),
  data_entrega_prevista: z.string().optional(),
  observacao: z.string().optional(),
  observacao_interna: z.string().optional(),
  itens: z.array(z.object({
    produto_id: z.string().uuid(),
    quantidade: z.number().positive(),
    preco_unitario: z.number().min(0),
    desconto_percentual: z.number().min(0).max(100).default(0),
    observacao: z.string().optional()
  })).min(1)
});

// GET /pedidos - Listar
pedidos.get('/', requirePermission('pedidos', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { page = '1', limit = '20', status, cliente_id, vendedor_id, canal, data_inicio, data_fim } = c.req.query();
  
  let where = 'WHERE p.empresa_id = ?';
  const params: any[] = [user.empresa_id];
  
  if (status) {
    where += ' AND p.status = ?';
    params.push(status);
  }
  
  if (cliente_id) {
    where += ' AND p.cliente_id = ?';
    params.push(cliente_id);
  }
  
  if (vendedor_id) {
    where += ' AND p.vendedor_id = ?';
    params.push(vendedor_id);
  }
  
  if (canal) {
    where += ' AND p.canal = ?';
    params.push(canal);
  }
  
  if (data_inicio) {
    where += ' AND DATE(p.data_emissao) >= ?';
    params.push(data_inicio);
  }
  
  if (data_fim) {
    where += ' AND DATE(p.data_emissao) <= ?';
    params.push(data_fim);
  }
  
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM pedidos_venda p ${where}`
  ).bind(...params).first<{ total: number }>();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  const data = await c.env.DB.prepare(`
    SELECT 
      p.*,
      f.nome as filial_nome,
      (SELECT COUNT(*) FROM pedidos_venda_itens WHERE pedido_id = p.id) as total_itens
    FROM pedidos_venda p
    JOIN filiais f ON p.filial_id = f.id
    ${where}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, parseInt(limit), offset).all();
  
  return c.json({
    success: true,
    data: data.results,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: countResult?.total || 0,
      pages: Math.ceil((countResult?.total || 0) / parseInt(limit))
    }
  });
});

// GET /pedidos/:id - Buscar por ID
pedidos.get('/:id', requirePermission('pedidos', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  
  const pedido = await c.env.DB.prepare(`
    SELECT p.*, f.nome as filial_nome
    FROM pedidos_venda p
    JOIN filiais f ON p.filial_id = f.id
    WHERE p.id = ? AND p.empresa_id = ?
  `).bind(id, user.empresa_id).first();
  
  if (!pedido) {
    return c.json({ success: false, error: 'Pedido não encontrado' }, 404);
  }
  
  // Buscar itens
  const itens = await c.env.DB.prepare(`
    SELECT 
      pi.*,
      pr.codigo as produto_codigo_atual,
      um.sigla as unidade_sigla
    FROM pedidos_venda_itens pi
    LEFT JOIN produtos pr ON pi.produto_id = pr.id
    LEFT JOIN unidades_medida um ON pr.unidade_medida_id = um.id
    WHERE pi.pedido_id = ?
    ORDER BY pi.sequencia
  `).bind(id).all();
  
  // Buscar parcelas
  const parcelas = await c.env.DB.prepare(`
    SELECT * FROM pedidos_venda_parcelas WHERE pedido_id = ? ORDER BY numero
  `).bind(id).all();
  
  // Buscar histórico
  const historico = await c.env.DB.prepare(`
    SELECT ph.*, u.nome as usuario_nome
    FROM pedidos_venda_historico ph
    LEFT JOIN usuarios u ON ph.usuario_id = u.id
    WHERE ph.pedido_id = ?
    ORDER BY ph.created_at DESC
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: {
      ...pedido,
      itens: itens.results,
      parcelas: parcelas.results,
      historico: historico.results
    }
  });
});

// POST /pedidos - Criar
pedidos.post('/', requirePermission('pedidos', 'criar'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const validacao = criarPedidoSchema.safeParse(body);
  if (!validacao.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validacao.error.errors }, 400);
  }
  
  const dados = validacao.data;
  
  // Buscar dados do cliente
  const cliente = await c.env.DB.prepare(`
    SELECT id, razao_social, nome_fantasia, cpf_cnpj FROM clientes 
    WHERE id = ? AND empresa_id = ? AND ativo = 1 AND bloqueado = 0
  `).bind(dados.cliente_id, user.empresa_id).first<any>();
  
  if (!cliente) {
    return c.json({ success: false, error: 'Cliente não encontrado ou bloqueado' }, 404);
  }
  
  // Gerar número
  const ultimoNumero = await c.env.DB.prepare(`
    SELECT MAX(CAST(numero AS INTEGER)) as ultimo
    FROM pedidos_venda WHERE empresa_id = ? AND filial_id = ?
  `).bind(user.empresa_id, dados.filial_id).first<{ ultimo: number }>();
  
  const numero = String((ultimoNumero?.ultimo || 0) + 1).padStart(6, '0');
  
  // Buscar vendedor
  let vendedorNome = null;
  if (dados.vendedor_id) {
    const vendedor = await c.env.DB.prepare('SELECT nome FROM usuarios WHERE id = ?')
      .bind(dados.vendedor_id).first<{ nome: string }>();
    vendedorNome = vendedor?.nome;
  }
  
  // Calcular valores
  let valorSubtotal = 0;
  let valorDesconto = 0;
  
  for (const item of dados.itens) {
    const subtotalItem = item.quantidade * item.preco_unitario;
    const descontoItem = subtotalItem * (item.desconto_percentual / 100);
    valorSubtotal += subtotalItem;
    valorDesconto += descontoItem;
  }
  
  const valorTotal = valorSubtotal - valorDesconto + (dados.valor_frete || 0);
  
  const id = crypto.randomUUID();
  const agora = new Date().toISOString();
  
  // Criar pedido
  await c.env.DB.prepare(`
    INSERT INTO pedidos_venda (
      id, empresa_id, filial_id, numero, canal,
      cliente_id, cliente_nome, cliente_cpf_cnpj,
      vendedor_id, vendedor_nome, tabela_preco_id, condicao_pagamento_id,
      transportadora_id, endereco_entrega_id,
      status, data_emissao, data_entrega_prevista,
      valor_subtotal, valor_desconto, valor_frete, valor_total,
      observacao, observacao_interna, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, user.empresa_id, dados.filial_id, numero, dados.canal,
    cliente.id, cliente.razao_social || cliente.nome_fantasia, cliente.cpf_cnpj,
    dados.vendedor_id || null, vendedorNome,
    dados.tabela_preco_id || null, dados.condicao_pagamento_id || null,
    dados.transportadora_id || null, dados.endereco_entrega_id || null,
    agora, dados.data_entrega_prevista || null,
    valorSubtotal, valorDesconto, dados.valor_frete || 0, valorTotal,
    dados.observacao || null, dados.observacao_interna || null, agora, agora
  ).run();
  
  // Criar itens
  let sequencia = 1;
  for (const item of dados.itens) {
    const produto = await c.env.DB.prepare(`
      SELECT codigo, nome, ncm, preco_custo FROM produtos WHERE id = ?
    `).bind(item.produto_id).first<any>();
    
    const subtotalItem = item.quantidade * item.preco_unitario;
    const descontoItem = subtotalItem * (item.desconto_percentual / 100);
    
    await c.env.DB.prepare(`
      INSERT INTO pedidos_venda_itens (
        id, pedido_id, sequencia, produto_id, produto_codigo, produto_nome,
        quantidade, preco_unitario, preco_custo, desconto_percentual, valor_desconto,
        valor_subtotal, valor_total, observacao, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, sequencia++,
      item.produto_id, produto.codigo, produto.nome,
      item.quantidade, item.preco_unitario, produto.preco_custo || 0,
      item.desconto_percentual, descontoItem, subtotalItem, subtotalItem - descontoItem,
      item.observacao || null, agora
    ).run();
  }
  
  // Registrar histórico
  await c.env.DB.prepare(`
    INSERT INTO pedidos_venda_historico (id, pedido_id, status_anterior, status_novo, observacao, usuario_id, created_at)
    VALUES (?, ?, NULL, 'pendente', 'Pedido criado', ?, ?)
  `).bind(crypto.randomUUID(), id, user.id, agora).run();
  
  await registrarAuditoria(c.env.DB, {
    empresa_id: user.empresa_id,
    usuario_id: user.id,
    acao: 'criar',
    tabela: 'pedidos_venda',
    registro_id: id,
    dados_novos: { numero, cliente_nome: cliente.razao_social, valor_total: valorTotal }
  });
  
  return c.json({ success: true, data: { id, numero }, message: 'Pedido criado com sucesso' }, 201);
});

// POST /pedidos/:id/aprovar - Aprovar pedido
pedidos.post('/:id/aprovar', requirePermission('pedidos', 'aprovar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  
  const pedido = await c.env.DB.prepare(`
    SELECT * FROM pedidos_venda WHERE id = ? AND empresa_id = ?
  `).bind(id, user.empresa_id).first<any>();
  
  if (!pedido) {
    return c.json({ success: false, error: 'Pedido não encontrado' }, 404);
  }
  
  if (pedido.status !== 'pendente') {
    return c.json({ success: false, error: 'Apenas pedidos pendentes podem ser aprovados' }, 400);
  }
  
  const agora = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE pedidos_venda SET status = 'aprovado', data_aprovacao = ?, updated_at = ? WHERE id = ?
  `).bind(agora, agora, id).run();
  
  await c.env.DB.prepare(`
    INSERT INTO pedidos_venda_historico (id, pedido_id, status_anterior, status_novo, observacao, usuario_id, created_at)
    VALUES (?, ?, 'pendente', 'aprovado', 'Pedido aprovado', ?, ?)
  `).bind(crypto.randomUUID(), id, user.id, agora).run();
  
  return c.json({ success: true, message: 'Pedido aprovado com sucesso' });
});

// POST /pedidos/:id/separar - Iniciar separação
pedidos.post('/:id/separar', requirePermission('pedidos', 'separar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  
  const pedido = await c.env.DB.prepare(`
    SELECT * FROM pedidos_venda WHERE id = ? AND empresa_id = ?
  `).bind(id, user.empresa_id).first<any>();
  
  if (!pedido) {
    return c.json({ success: false, error: 'Pedido não encontrado' }, 404);
  }
  
  if (pedido.status !== 'aprovado') {
    return c.json({ success: false, error: 'Apenas pedidos aprovados podem iniciar separação' }, 400);
  }
  
  const agora = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE pedidos_venda SET status = 'separando', updated_at = ? WHERE id = ?
  `).bind(agora, id).run();
  
  await c.env.DB.prepare(`
    INSERT INTO pedidos_venda_historico (id, pedido_id, status_anterior, status_novo, observacao, usuario_id, created_at)
    VALUES (?, ?, 'aprovado', 'separando', 'Iniciada separação do pedido', ?, ?)
  `).bind(crypto.randomUUID(), id, user.id, agora).run();
  
  return c.json({ success: true, message: 'Separação iniciada' });
});

// POST /pedidos/:id/confirmar-separacao - Confirmar separação concluída
pedidos.post('/:id/confirmar-separacao', requirePermission('pedidos', 'separar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  
  const pedido = await c.env.DB.prepare(`
    SELECT * FROM pedidos_venda WHERE id = ? AND empresa_id = ?
  `).bind(id, user.empresa_id).first<any>();
  
  if (!pedido) {
    return c.json({ success: false, error: 'Pedido não encontrado' }, 404);
  }
  
  if (pedido.status !== 'separando') {
    return c.json({ success: false, error: 'Apenas pedidos em separação podem ser confirmados' }, 400);
  }
  
  const agora = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE pedidos_venda SET status = 'separado', updated_at = ? WHERE id = ?
  `).bind(agora, id).run();
  
  await c.env.DB.prepare(`
    INSERT INTO pedidos_venda_historico (id, pedido_id, status_anterior, status_novo, observacao, usuario_id, created_at)
    VALUES (?, ?, 'separando', 'separado', 'Separação concluída', ?, ?)
  `).bind(crypto.randomUUID(), id, user.id, agora).run();
  
  return c.json({ success: true, message: 'Separação confirmada' });
});

// POST /pedidos/:id/faturar - Faturar pedido
pedidos.post('/:id/faturar', requirePermission('pedidos', 'faturar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const { nfe_numero, nfe_chave } = await c.req.json();
  
  const pedido = await c.env.DB.prepare(`
    SELECT * FROM pedidos_venda WHERE id = ? AND empresa_id = ?
  `).bind(id, user.empresa_id).first<any>();
  
  if (!pedido) {
    return c.json({ success: false, error: 'Pedido não encontrado' }, 404);
  }
  
  if (pedido.status !== 'separado') {
    return c.json({ success: false, error: 'Apenas pedidos separados podem ser faturados' }, 400);
  }
  
  const agora = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE pedidos_venda SET 
      status = 'faturado', 
      data_faturamento = ?,
      nfe_numero = ?,
      nfe_chave = ?,
      updated_at = ? 
    WHERE id = ?
  `).bind(agora, nfe_numero || null, nfe_chave || null, agora, id).run();
  
  // Baixar estoque
  const itens = await c.env.DB.prepare(
    'SELECT * FROM pedidos_venda_itens WHERE pedido_id = ?'
  ).bind(id).all<any>();
  
  for (const item of itens.results || []) {
    // Registrar movimentação de saída
    const saldo = await c.env.DB.prepare(`
      SELECT * FROM estoque WHERE empresa_id = ? AND filial_id = ? AND produto_id = ?
    `).bind(user.empresa_id, pedido.filial_id, item.produto_id).first<any>();
    
    if (saldo) {
      const quantidadeAnterior = saldo.quantidade;
      const quantidadePosterior = quantidadeAnterior - item.quantidade;
      
      await c.env.DB.prepare(`
        INSERT INTO estoque_movimentacoes (
          id, empresa_id, filial_id, produto_id, tipo, subtipo,
          quantidade, quantidade_anterior, quantidade_posterior,
          custo_unitario, documento_tipo, documento_id, documento_numero,
          observacao, usuario_id, created_at
        ) VALUES (?, ?, ?, ?, 'saida', 'venda', ?, ?, ?, ?, 'pedido_venda', ?, ?, 'Faturamento pedido', ?, ?)
      `).bind(
        crypto.randomUUID(), user.empresa_id, pedido.filial_id, item.produto_id,
        item.quantidade, quantidadeAnterior, quantidadePosterior,
        item.preco_custo, id, pedido.numero, user.id, agora
      ).run();
      
      await c.env.DB.prepare(`
        UPDATE estoque SET quantidade = ?, ultima_saida = ?, updated_at = ?
        WHERE id = ?
      `).bind(quantidadePosterior, agora, agora, saldo.id).run();
    }
  }
  
  await c.env.DB.prepare(`
    INSERT INTO pedidos_venda_historico (id, pedido_id, status_anterior, status_novo, observacao, usuario_id, created_at)
    VALUES (?, ?, 'separado', 'faturado', ?, ?, ?)
  `).bind(crypto.randomUUID(), id, `Faturado - NF-e ${nfe_numero || 'não informada'}`, user.id, agora).run();
  
  return c.json({ success: true, message: 'Pedido faturado com sucesso' });
});

// POST /pedidos/:id/entregar - Registrar entrega
pedidos.post('/:id/entregar', requirePermission('pedidos', 'entregar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const { observacao } = await c.req.json();
  
  const pedido = await c.env.DB.prepare(`
    SELECT * FROM pedidos_venda WHERE id = ? AND empresa_id = ?
  `).bind(id, user.empresa_id).first<any>();
  
  if (!pedido) {
    return c.json({ success: false, error: 'Pedido não encontrado' }, 404);
  }
  
  if (!['faturado', 'em_entrega'].includes(pedido.status)) {
    return c.json({ success: false, error: 'Status inválido para registrar entrega' }, 400);
  }
  
  const agora = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE pedidos_venda SET status = 'entregue', data_entrega_realizada = ?, updated_at = ? WHERE id = ?
  `).bind(agora, agora, id).run();
  
  await c.env.DB.prepare(`
    INSERT INTO pedidos_venda_historico (id, pedido_id, status_anterior, status_novo, observacao, usuario_id, created_at)
    VALUES (?, ?, ?, 'entregue', ?, ?, ?)
  `).bind(crypto.randomUUID(), id, pedido.status, observacao || 'Entrega realizada', user.id, agora).run();
  
  return c.json({ success: true, message: 'Entrega registrada com sucesso' });
});

// POST /pedidos/:id/cancelar - Cancelar pedido
pedidos.post('/:id/cancelar', requirePermission('pedidos', 'cancelar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const { motivo } = await c.req.json();
  
  if (!motivo) {
    return c.json({ success: false, error: 'Motivo do cancelamento é obrigatório' }, 400);
  }
  
  const pedido = await c.env.DB.prepare(`
    SELECT * FROM pedidos_venda WHERE id = ? AND empresa_id = ?
  `).bind(id, user.empresa_id).first<any>();
  
  if (!pedido) {
    return c.json({ success: false, error: 'Pedido não encontrado' }, 404);
  }
  
  if (['entregue', 'cancelado'].includes(pedido.status)) {
    return c.json({ success: false, error: 'Pedido não pode ser cancelado neste status' }, 400);
  }
  
  const agora = new Date().toISOString();
  
  // Se já foi faturado, precisa estornar estoque
  if (['faturado', 'em_entrega'].includes(pedido.status)) {
    const itens = await c.env.DB.prepare(
      'SELECT * FROM pedidos_venda_itens WHERE pedido_id = ?'
    ).bind(id).all<any>();
    
    for (const item of itens.results || []) {
      const saldo = await c.env.DB.prepare(`
        SELECT * FROM estoque WHERE empresa_id = ? AND filial_id = ? AND produto_id = ?
      `).bind(user.empresa_id, pedido.filial_id, item.produto_id).first<any>();
      
      if (saldo) {
        const quantidadeAnterior = saldo.quantidade;
        const quantidadePosterior = quantidadeAnterior + item.quantidade;
        
        await c.env.DB.prepare(`
          INSERT INTO estoque_movimentacoes (
            id, empresa_id, filial_id, produto_id, tipo, subtipo,
            quantidade, quantidade_anterior, quantidade_posterior,
            documento_tipo, documento_id, documento_numero,
            observacao, usuario_id, created_at
          ) VALUES (?, ?, ?, ?, 'entrada', 'estorno', ?, ?, ?, 'pedido_venda', ?, ?, 'Cancelamento de pedido', ?, ?)
        `).bind(
          crypto.randomUUID(), user.empresa_id, pedido.filial_id, item.produto_id,
          item.quantidade, quantidadeAnterior, quantidadePosterior,
          id, pedido.numero, user.id, agora
        ).run();
        
        await c.env.DB.prepare(`
          UPDATE estoque SET quantidade = ?, updated_at = ? WHERE id = ?
        `).bind(quantidadePosterior, agora, saldo.id).run();
      }
    }
  }
  
  // Liberar reservas se houver
  await c.env.DB.prepare(`
    UPDATE estoque_reservas SET status = 'cancelada', updated_at = ?
    WHERE documento_tipo = 'pedido_venda' AND documento_id = ? AND status = 'ativa'
  `).bind(agora, id).run();
  
  await c.env.DB.prepare(`
    UPDATE pedidos_venda SET 
      status = 'cancelado', 
      motivo_cancelamento = ?,
      updated_at = ? 
    WHERE id = ?
  `).bind(motivo, agora, id).run();
  
  await c.env.DB.prepare(`
    INSERT INTO pedidos_venda_historico (id, pedido_id, status_anterior, status_novo, observacao, usuario_id, created_at)
    VALUES (?, ?, ?, 'cancelado', ?, ?, ?)
  `).bind(crypto.randomUUID(), id, pedido.status, `Cancelado: ${motivo}`, user.id, agora).run();
  
  await registrarAuditoria(c.env.DB, {
    empresa_id: user.empresa_id,
    usuario_id: user.id,
    acao: 'cancelar',
    tabela: 'pedidos_venda',
    registro_id: id,
    dados_novos: { motivo }
  });
  
  return c.json({ success: true, message: 'Pedido cancelado com sucesso' });
});

// POST /pedidos/:id/reservar-estoque - Reservar estoque dos itens
pedidos.post('/:id/reservar-estoque', requirePermission('pedidos', 'reservar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  
  const pedido = await c.env.DB.prepare(`
    SELECT * FROM pedidos_venda WHERE id = ? AND empresa_id = ?
  `).bind(id, user.empresa_id).first<any>();
  
  if (!pedido) {
    return c.json({ success: false, error: 'Pedido não encontrado' }, 404);
  }
  
  const itens = await c.env.DB.prepare(
    'SELECT * FROM pedidos_venda_itens WHERE pedido_id = ?'
  ).bind(id).all<any>();
  
  const erros: string[] = [];
  const agora = new Date().toISOString();
  
  for (const item of itens.results || []) {
    const saldo = await c.env.DB.prepare(`
      SELECT quantidade, quantidade_reservada, (quantidade - quantidade_reservada) as disponivel
      FROM estoque WHERE empresa_id = ? AND filial_id = ? AND produto_id = ?
    `).bind(user.empresa_id, pedido.filial_id, item.produto_id).first<any>();
    
    if (!saldo || saldo.disponivel < item.quantidade) {
      erros.push(`${item.produto_nome}: disponível ${saldo?.disponivel || 0}, necessário ${item.quantidade}`);
      continue;
    }
    
    // Criar reserva
    await c.env.DB.prepare(`
      INSERT INTO estoque_reservas (
        id, empresa_id, filial_id, produto_id, quantidade,
        documento_tipo, documento_id, status, usuario_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pedido_venda', ?, 'ativa', ?, ?, ?)
    `).bind(
      crypto.randomUUID(), user.empresa_id, pedido.filial_id,
      item.produto_id, item.quantidade, id, user.id, agora, agora
    ).run();
    
    // Atualizar quantidade reservada
    await c.env.DB.prepare(`
      UPDATE estoque SET quantidade_reservada = quantidade_reservada + ?, updated_at = ?
      WHERE empresa_id = ? AND filial_id = ? AND produto_id = ?
    `).bind(item.quantidade, agora, user.empresa_id, pedido.filial_id, item.produto_id).run();
  }
  
  if (erros.length > 0) {
    return c.json({
      success: false,
      error: 'Estoque insuficiente para alguns itens',
      details: erros
    }, 400);
  }
  
  return c.json({ success: true, message: 'Estoque reservado com sucesso' });
});

// GET /pedidos/dashboard - Dashboard de pedidos
pedidos.get('/dashboard/resumo', requirePermission('pedidos', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { filial_id, data_inicio, data_fim } = c.req.query();
  
  let where = 'WHERE empresa_id = ?';
  const params: any[] = [user.empresa_id];
  
  if (filial_id) {
    where += ' AND filial_id = ?';
    params.push(filial_id);
  }
  
  if (data_inicio) {
    where += ' AND DATE(data_emissao) >= ?';
    params.push(data_inicio);
  }
  
  if (data_fim) {
    where += ' AND DATE(data_emissao) <= ?';
    params.push(data_fim);
  }
  
  // Resumo por status
  const porStatus = await c.env.DB.prepare(`
    SELECT status, COUNT(*) as quantidade, SUM(valor_total) as valor
    FROM pedidos_venda ${where}
    GROUP BY status
  `).bind(...params).all();
  
  // Totais
  const totais = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_pedidos,
      SUM(valor_total) as valor_total,
      SUM(CASE WHEN status NOT IN ('cancelado') THEN valor_total ELSE 0 END) as valor_efetivo
    FROM pedidos_venda ${where}
  `).bind(...params).first();
  
  // Top 5 clientes
  const topClientes = await c.env.DB.prepare(`
    SELECT cliente_nome, COUNT(*) as pedidos, SUM(valor_total) as valor
    FROM pedidos_venda ${where} AND status != 'cancelado'
    GROUP BY cliente_id
    ORDER BY valor DESC
    LIMIT 5
  `).bind(...params).all();
  
  return c.json({
    success: true,
    data: {
      por_status: porStatus.results,
      totais,
      top_clientes: topClientes.results
    }
  });
});

export default pedidos;
