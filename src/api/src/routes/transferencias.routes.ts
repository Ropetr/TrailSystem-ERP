// ============================================
// PLANAC ERP - Rotas de Transferências de Estoque
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const transferencias = new Hono<{ Bindings: Bindings; Variables: Variables }>();

transferencias.use('/*', requireAuth());

// Schemas
const transferenciaSchema = z.object({
  local_origem_id: z.string().uuid(),
  local_destino_id: z.string().uuid(),
  data_prevista: z.string().optional(),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    produto_id: z.string().uuid(),
    quantidade: z.number().positive(),
    lote: z.string().optional()
  })).min(1)
});

// GET /transferencias - Listar
transferencias.get('/', requirePermission('estoque', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { status, local_origem_id, local_destino_id, page = '1', limit = '20' } = c.req.query();

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT 
      t.*,
      lo.nome as local_origem_nome,
      ld.nome as local_destino_nome,
      u.nome as solicitante_nome,
      (SELECT COUNT(*) FROM transferencias_itens WHERE transferencia_id = t.id) as total_itens,
      (SELECT SUM(quantidade) FROM transferencias_itens WHERE transferencia_id = t.id) as total_unidades
    FROM transferencias t
    JOIN locais_estoque lo ON t.local_origem_id = lo.id
    JOIN locais_estoque ld ON t.local_destino_id = ld.id
    JOIN usuarios u ON t.solicitante_id = u.id
    WHERE t.empresa_id = ?
  `;
  const params: any[] = [usuario.empresa_id];

  if (status) {
    query += ` AND t.status = ?`;
    params.push(status);
  }

  if (local_origem_id) {
    query += ` AND t.local_origem_id = ?`;
    params.push(local_origem_id);
  }

  if (local_destino_id) {
    query += ` AND t.local_destino_id = ?`;
    params.push(local_destino_id);
  }

  // Count total
  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
  const totalResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();

  query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
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

// GET /transferencias/resumo - Dashboard
transferencias.get('/resumo', requirePermission('estoque', 'listar'), async (c) => {
  const usuario = c.get('usuario');

  // Por status
  const porStatus = await c.env.DB.prepare(`
    SELECT status, COUNT(*) as total
    FROM transferencias
    WHERE empresa_id = ?
    GROUP BY status
  `).bind(usuario.empresa_id).all();

  // Pendentes de aprovação
  const pendentesAprovacao = await c.env.DB.prepare(`
    SELECT 
      t.*,
      lo.nome as local_origem_nome,
      ld.nome as local_destino_nome
    FROM transferencias t
    JOIN locais_estoque lo ON t.local_origem_id = lo.id
    JOIN locais_estoque ld ON t.local_destino_id = ld.id
    WHERE t.empresa_id = ? AND t.status = 'PENDENTE'
    ORDER BY t.created_at
    LIMIT 10
  `).bind(usuario.empresa_id).all();

  // Em trânsito
  const emTransito = await c.env.DB.prepare(`
    SELECT 
      t.*,
      lo.nome as local_origem_nome,
      ld.nome as local_destino_nome
    FROM transferencias t
    JOIN locais_estoque lo ON t.local_origem_id = lo.id
    JOIN locais_estoque ld ON t.local_destino_id = ld.id
    WHERE t.empresa_id = ? AND t.status = 'EM_TRANSITO'
    ORDER BY t.data_envio
    LIMIT 10
  `).bind(usuario.empresa_id).all();

  // Últimas recebidas
  const ultimasRecebidas = await c.env.DB.prepare(`
    SELECT 
      t.*,
      lo.nome as local_origem_nome,
      ld.nome as local_destino_nome
    FROM transferencias t
    JOIN locais_estoque lo ON t.local_origem_id = lo.id
    JOIN locais_estoque ld ON t.local_destino_id = ld.id
    WHERE t.empresa_id = ? AND t.status = 'RECEBIDA'
    ORDER BY t.data_recebimento DESC
    LIMIT 5
  `).bind(usuario.empresa_id).all();

  return c.json({
    success: true,
    data: {
      por_status: porStatus.results,
      pendentes_aprovacao: pendentesAprovacao.results,
      em_transito: emTransito.results,
      ultimas_recebidas: ultimasRecebidas.results
    }
  });
});

// GET /transferencias/:id - Buscar
transferencias.get('/:id', requirePermission('estoque', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const transferencia = await c.env.DB.prepare(`
    SELECT 
      t.*,
      lo.nome as local_origem_nome,
      ld.nome as local_destino_nome,
      u.nome as solicitante_nome,
      ua.nome as aprovador_nome
    FROM transferencias t
    JOIN locais_estoque lo ON t.local_origem_id = lo.id
    JOIN locais_estoque ld ON t.local_destino_id = ld.id
    JOIN usuarios u ON t.solicitante_id = u.id
    LEFT JOIN usuarios ua ON t.aprovador_id = ua.id
    WHERE t.id = ? AND t.empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!transferencia) {
    return c.json({ success: false, error: 'Transferência não encontrada' }, 404);
  }

  // Itens
  const itens = await c.env.DB.prepare(`
    SELECT 
      ti.*,
      p.codigo,
      p.descricao as produto_descricao,
      un.sigla as unidade_sigla
    FROM transferencias_itens ti
    JOIN produtos p ON ti.produto_id = p.id
    LEFT JOIN unidades un ON p.unidade_id = un.id
    WHERE ti.transferencia_id = ?
    ORDER BY p.descricao
  `).bind(id).all();

  return c.json({
    success: true,
    data: { ...transferencia, itens: itens.results }
  });
});

// POST /transferencias - Criar
transferencias.post('/', requirePermission('estoque', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = transferenciaSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  // Validar locais diferentes
  if (data.local_origem_id === data.local_destino_id) {
    return c.json({ success: false, error: 'Local de origem e destino devem ser diferentes' }, 400);
  }

  // Verificar locais
  const localOrigem = await c.env.DB.prepare(`
    SELECT id, nome FROM locais_estoque WHERE id = ? AND empresa_id = ?
  `).bind(data.local_origem_id, usuario.empresa_id).first();

  const localDestino = await c.env.DB.prepare(`
    SELECT id, nome FROM locais_estoque WHERE id = ? AND empresa_id = ?
  `).bind(data.local_destino_id, usuario.empresa_id).first();

  if (!localOrigem || !localDestino) {
    return c.json({ success: false, error: 'Local de estoque não encontrado' }, 404);
  }

  // Verificar estoque disponível
  for (const item of data.itens) {
    const estoque = await c.env.DB.prepare(`
      SELECT quantidade FROM estoque 
      WHERE produto_id = ? AND local_estoque_id = ?
    `).bind(item.produto_id, data.local_origem_id).first<{ quantidade: number }>();

    if (!estoque || estoque.quantidade < item.quantidade) {
      const produto = await c.env.DB.prepare(`
        SELECT descricao FROM produtos WHERE id = ?
      `).bind(item.produto_id).first<{ descricao: string }>();

      return c.json({ 
        success: false, 
        error: `Estoque insuficiente para: ${produto?.descricao || item.produto_id}. Disponível: ${estoque?.quantidade || 0}` 
      }, 400);
    }
  }

  const id = crypto.randomUUID();

  // Gerar número sequencial
  const seq = await c.env.DB.prepare(`
    SELECT COALESCE(MAX(CAST(numero AS INTEGER)), 0) + 1 as proximo
    FROM transferencias WHERE empresa_id = ?
  `).bind(usuario.empresa_id).first<{ proximo: number }>();

  const numero = String(seq?.proximo || 1).padStart(6, '0');

  await c.env.DB.prepare(`
    INSERT INTO transferencias (
      id, empresa_id, numero, local_origem_id, local_destino_id,
      solicitante_id, data_prevista, observacoes, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE')
  `).bind(
    id, usuario.empresa_id, numero, data.local_origem_id, data.local_destino_id,
    usuario.id, data.data_prevista || null, data.observacoes || null
  ).run();

  // Inserir itens
  for (const item of data.itens) {
    const itemId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO transferencias_itens (
        id, transferencia_id, produto_id, quantidade, lote
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(itemId, id, item.produto_id, item.quantidade, item.lote || null).run();
  }

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'transferencias',
    entidade_id: id,
    dados_novos: data
  });

  return c.json({ success: true, data: { id, numero } }, 201);
});

// POST /transferencias/:id/aprovar - Aprovar transferência
transferencias.post('/:id/aprovar', requirePermission('estoque', 'aprovar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const transferencia = await c.env.DB.prepare(`
    SELECT * FROM transferencias WHERE id = ? AND empresa_id = ? AND status = 'PENDENTE'
  `).bind(id, usuario.empresa_id).first();

  if (!transferencia) {
    return c.json({ success: false, error: 'Transferência não encontrada ou não está pendente' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE transferencias SET 
      status = 'APROVADA',
      aprovador_id = ?,
      data_aprovacao = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(usuario.id, id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'APROVAR',
    entidade: 'transferencias',
    entidade_id: id
  });

  return c.json({ success: true, message: 'Transferência aprovada' });
});

// POST /transferencias/:id/rejeitar - Rejeitar transferência
transferencias.post('/:id/rejeitar', requirePermission('estoque', 'aprovar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const transferencia = await c.env.DB.prepare(`
    SELECT * FROM transferencias WHERE id = ? AND empresa_id = ? AND status = 'PENDENTE'
  `).bind(id, usuario.empresa_id).first();

  if (!transferencia) {
    return c.json({ success: false, error: 'Transferência não encontrada ou não está pendente' }, 404);
  }

  const { motivo } = body;
  if (!motivo) {
    return c.json({ success: false, error: 'Informe o motivo da rejeição' }, 400);
  }

  await c.env.DB.prepare(`
    UPDATE transferencias SET 
      status = 'REJEITADA',
      aprovador_id = ?,
      data_aprovacao = CURRENT_TIMESTAMP,
      observacoes = COALESCE(observacoes || ' | ', '') || 'REJEITADA: ' || ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(usuario.id, motivo, id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'REJEITAR',
    entidade: 'transferencias',
    entidade_id: id,
    dados_novos: { motivo }
  });

  return c.json({ success: true, message: 'Transferência rejeitada' });
});

// POST /transferencias/:id/enviar - Enviar (separar e despachar)
transferencias.post('/:id/enviar', requirePermission('estoque', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const transferencia = await c.env.DB.prepare(`
    SELECT * FROM transferencias WHERE id = ? AND empresa_id = ? AND status = 'APROVADA'
  `).bind(id, usuario.empresa_id).first<any>();

  if (!transferencia) {
    return c.json({ success: false, error: 'Transferência não encontrada ou não está aprovada' }, 404);
  }

  // Buscar itens
  const itens = await c.env.DB.prepare(`
    SELECT * FROM transferencias_itens WHERE transferencia_id = ?
  `).bind(id).all();

  // Verificar e dar baixa no estoque de origem
  for (const item of itens.results as any[]) {
    const estoque = await c.env.DB.prepare(`
      SELECT id, quantidade FROM estoque 
      WHERE produto_id = ? AND local_estoque_id = ?
    `).bind(item.produto_id, transferencia.local_origem_id).first<any>();

    if (!estoque || estoque.quantidade < item.quantidade) {
      const produto = await c.env.DB.prepare(`
        SELECT descricao FROM produtos WHERE id = ?
      `).bind(item.produto_id).first<{ descricao: string }>();

      return c.json({ 
        success: false, 
        error: `Estoque insuficiente para: ${produto?.descricao}` 
      }, 400);
    }

    // Dar baixa no origem
    await c.env.DB.prepare(`
      UPDATE estoque SET 
        quantidade = quantidade - ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE produto_id = ? AND local_estoque_id = ?
    `).bind(item.quantidade, item.produto_id, transferencia.local_origem_id).run();

    // Criar movimentação de saída
    const movSaidaId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO estoque_movimentacoes (
        id, empresa_id, produto_id, local_estoque_id, tipo, quantidade,
        motivo, referencia_tipo, referencia_id, usuario_id
      ) VALUES (?, ?, ?, ?, 'SAIDA', ?, 'TRANSFERENCIA', 'TRANSFERENCIA', ?, ?)
    `).bind(
      movSaidaId, usuario.empresa_id, item.produto_id, transferencia.local_origem_id,
      item.quantidade, id, usuario.id
    ).run();
  }

  await c.env.DB.prepare(`
    UPDATE transferencias SET 
      status = 'EM_TRANSITO',
      data_envio = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'ENVIAR',
    entidade: 'transferencias',
    entidade_id: id
  });

  return c.json({ success: true, message: 'Transferência enviada. Produtos em trânsito.' });
});

// POST /transferencias/:id/receber - Receber no destino
transferencias.post('/:id/receber', requirePermission('estoque', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const transferencia = await c.env.DB.prepare(`
    SELECT * FROM transferencias WHERE id = ? AND empresa_id = ? AND status = 'EM_TRANSITO'
  `).bind(id, usuario.empresa_id).first<any>();

  if (!transferencia) {
    return c.json({ success: false, error: 'Transferência não encontrada ou não está em trânsito' }, 404);
  }

  // Buscar itens
  const itens = await c.env.DB.prepare(`
    SELECT * FROM transferencias_itens WHERE transferencia_id = ?
  `).bind(id).all();

  // Itens com divergência (opcional)
  const { divergencias } = body; // [{ produto_id, quantidade_recebida }]

  for (const item of itens.results as any[]) {
    const divergencia = divergencias?.find((d: any) => d.produto_id === item.produto_id);
    const qtdRecebida = divergencia ? divergencia.quantidade_recebida : item.quantidade;

    // Atualizar quantidade recebida
    await c.env.DB.prepare(`
      UPDATE transferencias_itens SET 
        quantidade_recebida = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(qtdRecebida, item.id).run();

    // Verificar se já existe estoque no destino
    const estoqueDestino = await c.env.DB.prepare(`
      SELECT id FROM estoque WHERE produto_id = ? AND local_estoque_id = ?
    `).bind(item.produto_id, transferencia.local_destino_id).first();

    if (estoqueDestino) {
      await c.env.DB.prepare(`
        UPDATE estoque SET 
          quantidade = quantidade + ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE produto_id = ? AND local_estoque_id = ?
      `).bind(qtdRecebida, item.produto_id, transferencia.local_destino_id).run();
    } else {
      const estoqueId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO estoque (id, empresa_id, produto_id, local_estoque_id, quantidade)
        VALUES (?, ?, ?, ?, ?)
      `).bind(estoqueId, usuario.empresa_id, item.produto_id, transferencia.local_destino_id, qtdRecebida).run();
    }

    // Criar movimentação de entrada
    const movEntradaId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO estoque_movimentacoes (
        id, empresa_id, produto_id, local_estoque_id, tipo, quantidade,
        motivo, referencia_tipo, referencia_id, usuario_id
      ) VALUES (?, ?, ?, ?, 'ENTRADA', ?, 'TRANSFERENCIA', 'TRANSFERENCIA', ?, ?)
    `).bind(
      movEntradaId, usuario.empresa_id, item.produto_id, transferencia.local_destino_id,
      qtdRecebida, id, usuario.id
    ).run();
  }

  await c.env.DB.prepare(`
    UPDATE transferencias SET 
      status = 'RECEBIDA',
      data_recebimento = CURRENT_TIMESTAMP,
      recebedor_id = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(usuario.id, id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'RECEBER',
    entidade: 'transferencias',
    entidade_id: id,
    dados_novos: { divergencias }
  });

  return c.json({ success: true, message: 'Transferência recebida. Estoque atualizado.' });
});

// DELETE /transferencias/:id - Cancelar
transferencias.delete('/:id', requirePermission('estoque', 'excluir'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const transferencia = await c.env.DB.prepare(`
    SELECT * FROM transferencias WHERE id = ? AND empresa_id = ? AND status IN ('PENDENTE', 'APROVADA')
  `).bind(id, usuario.empresa_id).first();

  if (!transferencia) {
    return c.json({ success: false, error: 'Transferência não encontrada ou não pode ser cancelada' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE transferencias SET 
      status = 'CANCELADA',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CANCELAR',
    entidade: 'transferencias',
    entidade_id: id
  });

  return c.json({ success: true, message: 'Transferência cancelada' });
});

export default transferencias;
