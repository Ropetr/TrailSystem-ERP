// ============================================
// PLANAC ERP - Rotas de Devoluções e Trocas
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const devolucoes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

devolucoes.use('/*', requireAuth());

// Schemas
const devolucaoSchema = z.object({
  pedido_id: z.string().uuid(),
  cliente_id: z.string().uuid(),
  motivo: z.enum(['DEFEITO', 'ERRO_PEDIDO', 'DESISTENCIA', 'DIVERGENCIA', 'OUTROS']),
  descricao_motivo: z.string().optional(),
  tipo: z.enum(['DEVOLUCAO', 'TROCA']),
  itens: z.array(z.object({
    pedido_item_id: z.string().uuid(),
    produto_id: z.string().uuid(),
    quantidade: z.number().positive(),
    motivo_item: z.string().optional()
  })).min(1)
});

const trocaItensNovosSchema = z.object({
  itens: z.array(z.object({
    produto_id: z.string().uuid(),
    quantidade: z.number().positive(),
    preco_unitario: z.number().positive()
  })).min(1)
});

const aprovarDevolucaoSchema = z.object({
  aprovado: z.boolean(),
  motivo_rejeicao: z.string().optional(),
  reembolso_tipo: z.enum(['CREDITO', 'DINHEIRO', 'ESTORNO']).optional()
});

// GET /devolucoes - Listar
devolucoes.get('/', requirePermission('vendas', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { status, tipo, cliente_id, page = '1', limit = '20' } = c.req.query();

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT 
      d.*,
      c.razao_social as cliente_nome,
      p.numero as pedido_numero,
      u.nome as solicitante_nome,
      (SELECT COUNT(*) FROM devolucoes_itens WHERE devolucao_id = d.id) as total_itens
    FROM devolucoes d
    JOIN clientes c ON d.cliente_id = c.id
    JOIN pedidos p ON d.pedido_id = p.id
    JOIN usuarios u ON d.usuario_id = u.id
    WHERE d.empresa_id = ?
  `;
  const params: any[] = [usuario.empresa_id];

  if (status) {
    query += ` AND d.status = ?`;
    params.push(status);
  }

  if (tipo) {
    query += ` AND d.tipo = ?`;
    params.push(tipo);
  }

  if (cliente_id) {
    query += ` AND d.cliente_id = ?`;
    params.push(cliente_id);
  }

  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
  const totalResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();

  query += ` ORDER BY d.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalResult?.total || 0,
      pages: Math.ceil((totalResult?.total || 0) / parseInt(limit))
    }
  });
});

// GET /devolucoes/resumo - Dashboard
devolucoes.get('/resumo', requirePermission('vendas', 'listar'), async (c) => {
  const usuario = c.get('usuario');

  // Por status
  const porStatus = await c.env.DB.prepare(`
    SELECT status, tipo, COUNT(*) as total
    FROM devolucoes
    WHERE empresa_id = ?
    GROUP BY status, tipo
  `).bind(usuario.empresa_id).all();

  // Por motivo (últimos 30 dias)
  const porMotivo = await c.env.DB.prepare(`
    SELECT motivo, COUNT(*) as total
    FROM devolucoes
    WHERE empresa_id = ? AND created_at >= DATE('now', '-30 days')
    GROUP BY motivo
    ORDER BY total DESC
  `).bind(usuario.empresa_id).all();

  // Pendentes de análise
  const pendentes = await c.env.DB.prepare(`
    SELECT 
      d.*,
      c.razao_social as cliente_nome,
      p.numero as pedido_numero
    FROM devolucoes d
    JOIN clientes c ON d.cliente_id = c.id
    JOIN pedidos p ON d.pedido_id = p.id
    WHERE d.empresa_id = ? AND d.status = 'PENDENTE'
    ORDER BY d.created_at
    LIMIT 10
  `).bind(usuario.empresa_id).all();

  // Valor total em devoluções (últimos 30 dias)
  const valorTotal = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(valor_total), 0) as total
    FROM devolucoes
    WHERE empresa_id = ? 
      AND created_at >= DATE('now', '-30 days')
      AND status = 'APROVADA'
  `).bind(usuario.empresa_id).first<{ total: number }>();

  return c.json({
    success: true,
    data: {
      por_status: porStatus.results,
      por_motivo: porMotivo.results,
      pendentes: pendentes.results,
      valor_devolucoes_30d: valorTotal?.total || 0
    }
  });
});

// GET /devolucoes/:id - Buscar
devolucoes.get('/:id', requirePermission('vendas', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const devolucao = await c.env.DB.prepare(`
    SELECT 
      d.*,
      c.razao_social as cliente_nome,
      c.cnpj_cpf as cliente_documento,
      p.numero as pedido_numero,
      p.data_emissao as pedido_data,
      u.nome as solicitante_nome,
      ua.nome as aprovador_nome
    FROM devolucoes d
    JOIN clientes c ON d.cliente_id = c.id
    JOIN pedidos p ON d.pedido_id = p.id
    JOIN usuarios u ON d.usuario_id = u.id
    LEFT JOIN usuarios ua ON d.aprovador_id = ua.id
    WHERE d.id = ? AND d.empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!devolucao) {
    return c.json({ success: false, error: 'Devolução não encontrada' }, 404);
  }

  // Itens devolvidos
  const itensDevolvidos = await c.env.DB.prepare(`
    SELECT 
      di.*,
      pr.codigo,
      pr.descricao as produto_descricao,
      un.sigla as unidade_sigla
    FROM devolucoes_itens di
    JOIN produtos pr ON di.produto_id = pr.id
    LEFT JOIN unidades un ON pr.unidade_id = un.id
    WHERE di.devolucao_id = ?
  `).bind(id).all();

  // Se for troca, buscar itens novos
  let itensNovos: any[] = [];
  if ((devolucao as any).tipo === 'TROCA') {
    const novos = await c.env.DB.prepare(`
      SELECT 
        ti.*,
        pr.codigo,
        pr.descricao as produto_descricao,
        un.sigla as unidade_sigla
      FROM trocas_itens_novos ti
      JOIN produtos pr ON ti.produto_id = pr.id
      LEFT JOIN unidades un ON pr.unidade_id = un.id
      WHERE ti.devolucao_id = ?
    `).bind(id).all();
    itensNovos = novos.results as any[];
  }

  // Histórico
  const historico = await c.env.DB.prepare(`
    SELECT h.*, u.nome as usuario_nome
    FROM devolucoes_historico h
    LEFT JOIN usuarios u ON h.usuario_id = u.id
    WHERE h.devolucao_id = ?
    ORDER BY h.created_at
  `).bind(id).all();

  return c.json({
    success: true,
    data: {
      ...devolucao,
      itens_devolvidos: itensDevolvidos.results,
      itens_novos: itensNovos,
      historico: historico.results
    }
  });
});

// POST /devolucoes - Criar
devolucoes.post('/', requirePermission('vendas', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = devolucaoSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  // Verificar pedido
  const pedido = await c.env.DB.prepare(`
    SELECT * FROM pedidos WHERE id = ? AND empresa_id = ? AND status IN ('ENTREGUE', 'FATURADO')
  `).bind(data.pedido_id, usuario.empresa_id).first();

  if (!pedido) {
    return c.json({ success: false, error: 'Pedido não encontrado ou não pode ser devolvido' }, 404);
  }

  // Verificar itens
  for (const item of data.itens) {
    const pedidoItem = await c.env.DB.prepare(`
      SELECT pi.*, pi.quantidade - COALESCE(
        (SELECT SUM(di.quantidade) FROM devolucoes_itens di 
         JOIN devolucoes d ON di.devolucao_id = d.id 
         WHERE di.pedido_item_id = pi.id AND d.status != 'REJEITADA'), 0
      ) as disponivel
      FROM pedidos_itens pi
      WHERE pi.id = ? AND pi.pedido_id = ?
    `).bind(item.pedido_item_id, data.pedido_id).first<any>();

    if (!pedidoItem) {
      return c.json({ success: false, error: 'Item do pedido não encontrado' }, 404);
    }

    if (item.quantidade > pedidoItem.disponivel) {
      return c.json({ 
        success: false, 
        error: `Quantidade maior que disponível para devolução (${pedidoItem.disponivel})` 
      }, 400);
    }
  }

  const id = crypto.randomUUID();

  // Gerar número
  const seq = await c.env.DB.prepare(`
    SELECT COALESCE(MAX(CAST(numero AS INTEGER)), 0) + 1 as proximo
    FROM devolucoes WHERE empresa_id = ?
  `).bind(usuario.empresa_id).first<{ proximo: number }>();

  const numero = String(seq?.proximo || 1).padStart(6, '0');

  // Calcular valor total
  let valorTotal = 0;
  for (const item of data.itens) {
    const pedidoItem = await c.env.DB.prepare(`
      SELECT preco_unitario FROM pedidos_itens WHERE id = ?
    `).bind(item.pedido_item_id).first<{ preco_unitario: number }>();
    valorTotal += item.quantidade * (pedidoItem?.preco_unitario || 0);
  }

  await c.env.DB.prepare(`
    INSERT INTO devolucoes (
      id, empresa_id, numero, pedido_id, cliente_id, usuario_id,
      motivo, descricao_motivo, tipo, valor_total, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE')
  `).bind(
    id, usuario.empresa_id, numero, data.pedido_id, data.cliente_id, usuario.id,
    data.motivo, data.descricao_motivo || null, data.tipo, valorTotal
  ).run();

  // Inserir itens
  for (const item of data.itens) {
    const itemId = crypto.randomUUID();
    const pedidoItem = await c.env.DB.prepare(`
      SELECT preco_unitario FROM pedidos_itens WHERE id = ?
    `).bind(item.pedido_item_id).first<{ preco_unitario: number }>();

    await c.env.DB.prepare(`
      INSERT INTO devolucoes_itens (
        id, devolucao_id, pedido_item_id, produto_id, quantidade, preco_unitario, motivo
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      itemId, id, item.pedido_item_id, item.produto_id, item.quantidade,
      pedidoItem?.preco_unitario || 0, item.motivo_item || null
    ).run();
  }

  // Histórico
  const histId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO devolucoes_historico (id, devolucao_id, status, observacao, usuario_id)
    VALUES (?, ?, 'PENDENTE', 'Solicitação criada', ?)
  `).bind(histId, id, usuario.id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'devolucoes',
    entidade_id: id,
    dados_novos: data
  });

  return c.json({ success: true, data: { id, numero } }, 201);
});

// POST /devolucoes/:id/analisar - Aprovar/Rejeitar
devolucoes.post('/:id/analisar', requirePermission('vendas', 'aprovar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = aprovarDevolucaoSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  const devolucao = await c.env.DB.prepare(`
    SELECT * FROM devolucoes WHERE id = ? AND empresa_id = ? AND status = 'PENDENTE'
  `).bind(id, usuario.empresa_id).first();

  if (!devolucao) {
    return c.json({ success: false, error: 'Devolução não encontrada ou já analisada' }, 404);
  }

  const novoStatus = data.aprovado ? 'APROVADA' : 'REJEITADA';

  await c.env.DB.prepare(`
    UPDATE devolucoes SET
      status = ?,
      aprovador_id = ?,
      data_aprovacao = CURRENT_TIMESTAMP,
      motivo_rejeicao = ?,
      reembolso_tipo = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    novoStatus, usuario.id,
    data.aprovado ? null : (data.motivo_rejeicao || 'Não informado'),
    data.aprovado ? (data.reembolso_tipo || 'CREDITO') : null,
    id
  ).run();

  // Histórico
  const histId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO devolucoes_historico (id, devolucao_id, status, observacao, usuario_id)
    VALUES (?, ?, ?, ?, ?)
  `).bind(histId, id, novoStatus, data.aprovado ? 'Aprovada' : `Rejeitada: ${data.motivo_rejeicao}`, usuario.id).run();

  // Se aprovada, dar entrada no estoque
  if (data.aprovado) {
    const itens = await c.env.DB.prepare(`
      SELECT * FROM devolucoes_itens WHERE devolucao_id = ?
    `).bind(id).all();

    for (const item of itens.results as any[]) {
      // Verificar estoque
      const estoqueExistente = await c.env.DB.prepare(`
        SELECT id, quantidade FROM estoque 
        WHERE produto_id = ? AND local_estoque_id = (SELECT local_estoque_id FROM empresas WHERE id = ? LIMIT 1)
      `).bind(item.produto_id, usuario.empresa_id).first<any>();

      if (estoqueExistente) {
        await c.env.DB.prepare(`
          UPDATE estoque SET quantidade = quantidade + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(item.quantidade, estoqueExistente.id).run();
      }

      // Movimentação
      const movId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO estoque_movimentacoes (
          id, empresa_id, produto_id, local_estoque_id, tipo, quantidade,
          motivo, referencia_tipo, referencia_id, usuario_id
        ) VALUES (?, ?, ?, 
          (SELECT local_estoque_id FROM empresas WHERE id = ? LIMIT 1),
          'ENTRADA', ?, 'DEVOLUCAO', 'DEVOLUCAO', ?, ?)
      `).bind(movId, usuario.empresa_id, item.produto_id, usuario.empresa_id, item.quantidade, id, usuario.id).run();
    }
  }

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: data.aprovado ? 'APROVAR' : 'REJEITAR',
    entidade: 'devolucoes',
    entidade_id: id,
    dados_novos: data
  });

  return c.json({ 
    success: true, 
    message: data.aprovado ? 'Devolução aprovada' : 'Devolução rejeitada'
  });
});

// POST /devolucoes/:id/itens-troca - Adicionar itens novos na troca
devolucoes.post('/:id/itens-troca', requirePermission('vendas', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const devolucao = await c.env.DB.prepare(`
    SELECT * FROM devolucoes WHERE id = ? AND empresa_id = ? AND tipo = 'TROCA' AND status = 'APROVADA'
  `).bind(id, usuario.empresa_id).first<any>();

  if (!devolucao) {
    return c.json({ success: false, error: 'Devolução não encontrada, não é troca ou não está aprovada' }, 404);
  }

  const validation = trocaItensNovosSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  // Calcular valor dos novos itens
  let valorNovosItens = 0;
  for (const item of data.itens) {
    valorNovosItens += item.quantidade * item.preco_unitario;

    const itemId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO trocas_itens_novos (id, devolucao_id, produto_id, quantidade, preco_unitario)
      VALUES (?, ?, ?, ?, ?)
    `).bind(itemId, id, item.produto_id, item.quantidade, item.preco_unitario).run();
  }

  // Atualizar diferença
  const diferenca = valorNovosItens - devolucao.valor_total;

  await c.env.DB.prepare(`
    UPDATE devolucoes SET
      valor_troca = ?,
      diferenca_troca = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(valorNovosItens, diferenca, id).run();

  return c.json({ 
    success: true, 
    data: {
      valor_devolucao: devolucao.valor_total,
      valor_novos_itens: valorNovosItens,
      diferenca
    }
  });
});

// POST /devolucoes/:id/finalizar - Finalizar devolução/troca
devolucoes.post('/:id/finalizar', requirePermission('vendas', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const devolucao = await c.env.DB.prepare(`
    SELECT * FROM devolucoes WHERE id = ? AND empresa_id = ? AND status = 'APROVADA'
  `).bind(id, usuario.empresa_id).first<any>();

  if (!devolucao) {
    return c.json({ success: false, error: 'Devolução não encontrada ou não está aprovada' }, 404);
  }

  // Se for troca, verificar se tem itens novos
  if (devolucao.tipo === 'TROCA') {
    const itensNovos = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM trocas_itens_novos WHERE devolucao_id = ?
    `).bind(id).first<{ total: number }>();

    if (!itensNovos || itensNovos.total === 0) {
      return c.json({ success: false, error: 'Troca sem itens novos definidos' }, 400);
    }
  }

  await c.env.DB.prepare(`
    UPDATE devolucoes SET
      status = 'FINALIZADA',
      data_finalizacao = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run();

  // Histórico
  const histId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO devolucoes_historico (id, devolucao_id, status, observacao, usuario_id)
    VALUES (?, ?, 'FINALIZADA', 'Processo concluído', ?)
  `).bind(histId, id, usuario.id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'FINALIZAR',
    entidade: 'devolucoes',
    entidade_id: id
  });

  return c.json({ success: true, message: 'Devolução finalizada' });
});

// DELETE /devolucoes/:id - Cancelar
devolucoes.delete('/:id', requirePermission('vendas', 'excluir'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const devolucao = await c.env.DB.prepare(`
    SELECT * FROM devolucoes WHERE id = ? AND empresa_id = ? AND status = 'PENDENTE'
  `).bind(id, usuario.empresa_id).first();

  if (!devolucao) {
    return c.json({ success: false, error: 'Devolução não encontrada ou não pode ser cancelada' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE devolucoes SET status = 'CANCELADA', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(id).run();

  // Histórico
  const histId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO devolucoes_historico (id, devolucao_id, status, observacao, usuario_id)
    VALUES (?, ?, 'CANCELADA', 'Solicitação cancelada', ?)
  `).bind(histId, id, usuario.id).run();

  return c.json({ success: true, message: 'Devolução cancelada' });
});

export default devolucoes;
