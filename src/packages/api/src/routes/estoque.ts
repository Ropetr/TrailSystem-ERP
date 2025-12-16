// =============================================
// PLANAC ERP - Rotas de Estoque e Movimentações
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const estoque = new Hono<{ Bindings: Env }>();

// =============================================
// GET /estoque - Listar saldos
// =============================================
estoque.get('/', async (c) => {
  const { 
    page = '1', limit = '20', 
    produto_id, local_id, 
    estoque_baixo, empresa_id 
  } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND e.empresa_id = ?';
      params.push(empresa_id);
    }

    if (produto_id) {
      where += ' AND e.produto_id = ?';
      params.push(produto_id);
    }

    if (local_id) {
      where += ' AND e.local_id = ?';
      params.push(local_id);
    }

    if (estoque_baixo === 'true') {
      where += ' AND e.quantidade <= p.estoque_minimo';
    }

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM estoque e
      LEFT JOIN produtos p ON p.id = e.produto_id
      ${where}
    `).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await c.env.DB.prepare(`
      SELECT 
        e.*,
        p.codigo as produto_codigo, p.nome as produto_nome, 
        p.estoque_minimo, p.estoque_maximo,
        l.nome as local_nome,
        (e.quantidade - e.quantidade_reservada) as quantidade_disponivel
      FROM estoque e
      LEFT JOIN produtos p ON p.id = e.produto_id
      LEFT JOIN locais_estoque l ON l.id = e.local_id
      ${where}
      ORDER BY p.nome
      LIMIT ? OFFSET ?
    `).bind(...params, limitNum, offset).all();

    return c.json({
      success: true,
      data: result.results,
      pagination: { page: pageNum, limit: limitNum, total: countResult?.total || 0, totalPages: Math.ceil((countResult?.total || 0) / limitNum) }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao listar estoque' }, 500);
  }
});

// =============================================
// GET /estoque/resumo
// =============================================
estoque.get('/resumo', async (c) => {
  const { empresa_id } = c.req.query();
  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (empresa_id) { where += ' AND e.empresa_id = ?'; params.push(empresa_id); }

    const resumo = await c.env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT e.produto_id) as total_produtos,
        SUM(e.quantidade) as total_itens,
        SUM(e.quantidade * e.custo_medio) as valor_total_estoque,
        SUM(CASE WHEN e.quantidade <= p.estoque_minimo THEN 1 ELSE 0 END) as produtos_estoque_baixo
      FROM estoque e
      LEFT JOIN produtos p ON p.id = e.produto_id ${where}
    `).bind(...params).first();

    return c.json({ success: true, data: resumo });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao buscar resumo' }, 500);
  }
});

// =============================================
// GET /estoque/produto/:produto_id
// =============================================
estoque.get('/produto/:produto_id', async (c) => {
  const { produto_id } = c.req.param();
  try {
    const saldos = await c.env.DB.prepare(`
      SELECT e.*, l.nome as local_nome FROM estoque e
      LEFT JOIN locais_estoque l ON l.id = e.local_id WHERE e.produto_id = ?
    `).bind(produto_id).all();

    const total = await c.env.DB.prepare(`
      SELECT SUM(quantidade) as total, SUM(quantidade_reservada) as reservada, AVG(custo_medio) as custo_medio
      FROM estoque WHERE produto_id = ?
    `).bind(produto_id).first();

    const movs = await c.env.DB.prepare(`
      SELECT * FROM estoque_movimentacoes WHERE produto_id = ? ORDER BY created_at DESC LIMIT 10
    `).bind(produto_id).all();

    return c.json({ success: true, data: { saldos: saldos.results, totais: total, movimentacoes: movs.results } });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao buscar estoque' }, 500);
  }
});

// =============================================
// GET /estoque/movimentacoes
// =============================================
estoque.get('/movimentacoes', async (c) => {
  const { page = '1', limit = '20', produto_id, tipo, data_inicio, data_fim, empresa_id } = c.req.query();
  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (empresa_id) { where += ' AND m.empresa_id = ?'; params.push(empresa_id); }
    if (produto_id) { where += ' AND m.produto_id = ?'; params.push(produto_id); }
    if (tipo) { where += ' AND m.tipo = ?'; params.push(tipo); }
    if (data_inicio) { where += ' AND m.created_at >= ?'; params.push(data_inicio); }
    if (data_fim) { where += ' AND m.created_at <= ?'; params.push(data_fim + 'T23:59:59'); }

    const countResult = await c.env.DB.prepare(`SELECT COUNT(*) as total FROM estoque_movimentacoes m ${where}`).bind(...params).first<{ total: number }>();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const result = await c.env.DB.prepare(`
      SELECT m.*, p.codigo as produto_codigo, p.nome as produto_nome
      FROM estoque_movimentacoes m
      LEFT JOIN produtos p ON p.id = m.produto_id
      ${where} ORDER BY m.created_at DESC LIMIT ? OFFSET ?
    `).bind(...params, limitNum, (pageNum - 1) * limitNum).all();

    return c.json({ success: true, data: result.results, pagination: { page: pageNum, limit: limitNum, total: countResult?.total || 0, totalPages: Math.ceil((countResult?.total || 0) / limitNum) } });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao listar movimentacoes' }, 500);
  }
});

// =============================================
// POST /estoque/movimentar
// =============================================
estoque.post('/movimentar', async (c) => {
  try {
    const body = await c.req.json<{
      produto_id: string; local_id?: string; tipo: 'entrada' | 'saida' | 'ajuste';
      quantidade: number; custo_unitario?: number; observacao?: string;
      empresa_id?: string; filial_id?: string;
    }>();

    if (!body.produto_id || !body.tipo || !body.quantidade) {
      return c.json({ success: false, error: 'Produto, tipo e quantidade obrigatorios' }, 400);
    }

    const empresaId = body.empresa_id || 'empresa_planac_001';
    const filialId = body.filial_id || 'filial_matriz_001';
    const localId = body.local_id || 'local_padrao';

    let saldoAtual = await c.env.DB.prepare(`
      SELECT * FROM estoque WHERE produto_id = ? AND local_id = ? AND empresa_id = ?
    `).bind(body.produto_id, localId, empresaId).first<any>();

    const qtdAnterior = saldoAtual?.quantidade || 0;
    let qtdPosterior: number;
    let custoMedio = saldoAtual?.custo_medio || body.custo_unitario || 0;

    if (body.tipo === 'entrada') {
      qtdPosterior = qtdAnterior + body.quantidade;
      if (body.custo_unitario && body.custo_unitario > 0 && qtdPosterior > 0) {
        custoMedio = ((qtdAnterior * custoMedio) + (body.quantidade * body.custo_unitario)) / qtdPosterior;
      }
    } else if (body.tipo === 'saida') {
      if (qtdAnterior < body.quantidade) return c.json({ success: false, error: 'Saldo insuficiente' }, 400);
      qtdPosterior = qtdAnterior - body.quantidade;
    } else {
      qtdPosterior = body.quantidade;
    }

    if (saldoAtual) {
      await c.env.DB.prepare(`UPDATE estoque SET quantidade = ?, custo_medio = ?, updated_at = datetime('now') WHERE id = ?`).bind(qtdPosterior, custoMedio, saldoAtual.id).run();
    } else {
      await c.env.DB.prepare(`INSERT INTO estoque (id, empresa_id, filial_id, produto_id, local_id, quantidade, custo_medio, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`).bind(crypto.randomUUID(), empresaId, filialId, body.produto_id, localId, qtdPosterior, custoMedio).run();
    }

    const movId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO estoque_movimentacoes (id, empresa_id, filial_id, produto_id, local_id, tipo, quantidade, quantidade_anterior, quantidade_posterior, custo_unitario, custo_total, observacao, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(movId, empresaId, filialId, body.produto_id, localId, body.tipo, body.quantidade, qtdAnterior, qtdPosterior, body.custo_unitario || 0, (body.custo_unitario || 0) * body.quantidade, body.observacao || null).run();

    return c.json({ success: true, data: { movimentacao_id: movId, quantidade_anterior: qtdAnterior, quantidade_posterior: qtdPosterior }, message: 'Movimentacao registrada' }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao movimentar estoque' }, 500);
  }
});

// =============================================
// GET /estoque/locais
// =============================================
estoque.get('/locais', async (c) => {
  const { empresa_id } = c.req.query();
  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (empresa_id) { where += ' AND empresa_id = ?'; params.push(empresa_id); }

    const result = await c.env.DB.prepare(`SELECT * FROM locais_estoque ${where} ORDER BY nome`).bind(...params).all();
    return c.json({ success: true, data: result.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao listar locais' }, 500);
  }
});

// =============================================
// POST /estoque/locais
// =============================================
estoque.post('/locais', async (c) => {
  try {
    const body = await c.req.json<{ nome: string; tipo?: string; empresa_id?: string; filial_id?: string }>();
    if (!body.nome) return c.json({ success: false, error: 'Nome obrigatorio' }, 400);

    const id = crypto.randomUUID();
    await c.env.DB.prepare(`INSERT INTO locais_estoque (id, empresa_id, filial_id, nome, tipo, ativo, created_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`)
      .bind(id, body.empresa_id || 'empresa_planac_001', body.filial_id || null, body.nome, body.tipo || 'deposito').run();

    return c.json({ success: true, data: { id }, message: 'Local criado' }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao criar local' }, 500);
  }
});

export default estoque;
