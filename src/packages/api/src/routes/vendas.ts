// =============================================
// PLANAC ERP - Rotas de Vendas (Pedidos de Venda)
// Tabela: pedidos_venda
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const vendas = new Hono<{ Bindings: Env }>();

// =============================================
// GET /vendas - Listar
// =============================================
vendas.get('/', async (c) => {
  const { page = '1', limit = '20', busca, status, cliente_id, vendedor_id, data_inicio, data_fim, empresa_id } = c.req.query();

  try {
    let query = `
      SELECT pv.*, c.razao_social as cliente_razao_social
      FROM pedidos_venda pv
      LEFT JOIN clientes c ON c.id = pv.cliente_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (empresa_id) {
      query += ` AND pv.empresa_id = ?`;
      params.push(empresa_id);
    }

    if (busca) {
      query += ` AND (CAST(pv.numero AS TEXT) LIKE ? OR pv.cliente_nome LIKE ?)`;
      params.push(`%${busca}%`, `%${busca}%`);
    }

    if (status) {
      query += ` AND pv.status = ?`;
      params.push(status);
    }

    if (cliente_id) {
      query += ` AND pv.cliente_id = ?`;
      params.push(cliente_id);
    }

    if (vendedor_id) {
      query += ` AND pv.vendedor_id = ?`;
      params.push(vendedor_id);
    }

    if (data_inicio) {
      query += ` AND pv.data_emissao >= ?`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND pv.data_emissao <= ?`;
      params.push(data_fim);
    }

    const countQuery = query.replace('SELECT pv.*, c.razao_social as cliente_razao_social', 'SELECT COUNT(*) as total');
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    query += ` ORDER BY pv.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limitNum, (pageNum - 1) * limitNum);

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: result.results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar vendas:', error);
    return c.json({ success: false, error: 'Erro ao listar vendas' }, 500);
  }
});

// =============================================
// GET /vendas/:id - Buscar
// =============================================
vendas.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const venda = await c.env.DB.prepare(`
      SELECT pv.*, c.razao_social as cliente_razao_social, c.email as cliente_email
      FROM pedidos_venda pv
      LEFT JOIN clientes c ON c.id = pv.cliente_id
      WHERE pv.id = ?
    `).bind(id).first();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada' }, 404);
    }

    const itens = await c.env.DB.prepare(`
      SELECT pvi.*, p.nome as produto_nome, p.codigo as produto_codigo
      FROM pedidos_venda_itens pvi
      LEFT JOIN produtos p ON p.id = pvi.produto_id
      WHERE pvi.pedido_venda_id = ?
      ORDER BY pvi.item
    `).bind(id).all();

    const parcelas = await c.env.DB.prepare(`
      SELECT * FROM pedidos_venda_parcelas WHERE pedido_venda_id = ? ORDER BY parcela
    `).bind(id).all();

    return c.json({
      success: true,
      data: { ...venda, itens: itens.results, parcelas: parcelas.results }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao buscar venda' }, 500);
  }
});

// =============================================
// POST /vendas - Criar
// =============================================
vendas.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      cliente_id: string;
      cliente_nome: string;
      vendedor_id?: string;
      vendedor_nome?: string;
      observacao_interna?: string;
      observacao_nf?: string;
      empresa_id?: string;
      filial_id?: string;
      itens: Array<{
        produto_id: string;
        quantidade: number;
        valor_unitario: number;
        desconto_percentual?: number;
        desconto_valor?: number;
      }>;
    }>();

    if (!body.cliente_id) {
      return c.json({ success: false, error: 'Cliente obrigatorio' }, 400);
    }

    if (!body.itens || body.itens.length === 0) {
      return c.json({ success: false, error: 'Adicione ao menos um item' }, 400);
    }

    const empresaId = body.empresa_id || 'empresa_planac_001';
    const filialId = body.filial_id || 'filial_matriz_001';

    // Gerar numero sequencial
    const ultimoNumero = await c.env.DB.prepare(`
      SELECT MAX(numero) as max_numero FROM pedidos_venda WHERE empresa_id = ?
    `).bind(empresaId).first<{ max_numero: number }>();
    const novoNumero = (ultimoNumero?.max_numero || 0) + 1;

    // Calcular totais
    let subtotal = 0;
    let totalDesconto = 0;

    for (const item of body.itens) {
      const valorBruto = item.quantidade * item.valor_unitario;
      const desconto = item.desconto_valor || (valorBruto * (item.desconto_percentual || 0) / 100);
      subtotal += valorBruto;
      totalDesconto += desconto;
    }

    const valorTotal = subtotal - totalDesconto;

    // Criar venda
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO pedidos_venda (
        id, empresa_id, filial_id, numero, cliente_id, cliente_nome,
        vendedor_id, vendedor_nome, status, data_emissao,
        subtotal, desconto_valor, valor_total,
        observacao_interna, observacao_nf, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, empresaId, filialId, novoNumero, body.cliente_id, body.cliente_nome,
      body.vendedor_id || null, body.vendedor_nome || null, now.split('T')[0],
      subtotal, totalDesconto, valorTotal,
      body.observacao_interna || null, body.observacao_nf || null, now, now
    ).run();

    // Criar itens
    let item_num = 1;
    for (const item of body.itens) {
      const valorBruto = item.quantidade * item.valor_unitario;
      const descontoValor = item.desconto_valor || (valorBruto * (item.desconto_percentual || 0) / 100);
      const valorLiquido = valorBruto - descontoValor;

      await c.env.DB.prepare(`
        INSERT INTO pedidos_venda_itens (
          id, pedido_venda_id, item, produto_id, quantidade, valor_unitario,
          desconto_percentual, desconto_valor, valor_total, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, item_num++, item.produto_id,
        item.quantidade, item.valor_unitario,
        item.desconto_percentual || 0, descontoValor, valorLiquido, now
      ).run();
    }

    return c.json({
      success: true,
      data: { id, numero: novoNumero },
      message: 'Venda criada com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar venda:', error);
    return c.json({ success: false, error: 'Erro ao criar venda' }, 500);
  }
});

// =============================================
// PUT /vendas/:id - Editar
// =============================================
vendas.put('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      vendedor_id?: string;
      vendedor_nome?: string;
      observacao_interna?: string;
      observacao_nf?: string;
    }>();

    const venda = await c.env.DB.prepare(`
      SELECT * FROM pedidos_venda WHERE id = ?
    `).bind(id).first<any>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada' }, 404);
    }

    if (venda.status !== 'pendente') {
      return c.json({ success: false, error: 'Apenas vendas pendentes podem ser editadas' }, 400);
    }

    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [new Date().toISOString()];

    if (body.vendedor_id !== undefined) { updates.push('vendedor_id = ?'); params.push(body.vendedor_id); }
    if (body.vendedor_nome !== undefined) { updates.push('vendedor_nome = ?'); params.push(body.vendedor_nome); }
    if (body.observacao_interna !== undefined) { updates.push('observacao_interna = ?'); params.push(body.observacao_interna); }
    if (body.observacao_nf !== undefined) { updates.push('observacao_nf = ?'); params.push(body.observacao_nf); }

    params.push(id);

    await c.env.DB.prepare(`
      UPDATE pedidos_venda SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return c.json({ success: true, message: 'Venda atualizada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao editar venda' }, 500);
  }
});

// =============================================
// POST /vendas/:id/aprovar - Aprovar venda
// =============================================
vendas.post('/:id/aprovar', async (c) => {
  const { id } = c.req.param();

  try {
    const venda = await c.env.DB.prepare(`
      SELECT status FROM pedidos_venda WHERE id = ?
    `).bind(id).first<{ status: string }>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada' }, 404);
    }

    if (venda.status !== 'pendente') {
      return c.json({ success: false, error: 'Venda ja foi processada' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE pedidos_venda SET status = 'aprovada', data_aprovacao = datetime('now'), updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Venda aprovada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao aprovar venda' }, 500);
  }
});

// =============================================
// POST /vendas/:id/faturar - Faturar venda
// =============================================
vendas.post('/:id/faturar', async (c) => {
  const { id } = c.req.param();

  try {
    const venda = await c.env.DB.prepare(`
      SELECT * FROM pedidos_venda WHERE id = ?
    `).bind(id).first<any>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada' }, 404);
    }

    if (venda.status !== 'aprovada' && venda.status !== 'pendente') {
      return c.json({ success: false, error: 'Venda nao pode ser faturada' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE pedidos_venda SET status = 'faturada', data_faturamento = datetime('now'), updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Venda faturada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao faturar venda:', error);
    return c.json({ success: false, error: 'Erro ao faturar venda' }, 500);
  }
});

// =============================================
// POST /vendas/:id/cancelar - Cancelar venda
// =============================================
vendas.post('/:id/cancelar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{ motivo?: string }>();

    const venda = await c.env.DB.prepare(`
      SELECT status FROM pedidos_venda WHERE id = ?
    `).bind(id).first<{ status: string }>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE pedidos_venda SET status = 'cancelada', observacao_interna = COALESCE(observacao_interna, '') || ' | Cancelado: ' || ?, updated_at = datetime('now') WHERE id = ?
    `).bind(body.motivo || 'Nao informado', id).run();

    return c.json({ success: true, message: 'Venda cancelada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao cancelar venda' }, 500);
  }
});

// =============================================
// GET /vendas/dashboard - Dashboard de vendas
// =============================================
vendas.get('/relatorio/dashboard', async (c) => {
  const { empresa_id, periodo = '30' } = c.req.query();

  try {
    const dias = parseInt(periodo);
    
    let where = `WHERE data_emissao >= date('now', '-${dias} days')`;
    const params: any[] = [];

    if (empresa_id) {
      where += ` AND empresa_id = ?`;
      params.push(empresa_id);
    }

    // Total de vendas
    const totais = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as quantidade,
        SUM(valor_total) as valor_total,
        SUM(CASE WHEN status = 'faturada' THEN valor_total ELSE 0 END) as valor_faturado,
        SUM(CASE WHEN status = 'pendente' THEN valor_total ELSE 0 END) as valor_pendente
      FROM pedidos_venda ${where}
    `).bind(...params).first();

    // Vendas por status
    const porStatus = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as quantidade, SUM(valor_total) as valor
      FROM pedidos_venda ${where}
      GROUP BY status
    `).bind(...params).all();

    // Top vendedores
    const topVendedores = await c.env.DB.prepare(`
      SELECT vendedor_nome as nome, COUNT(*) as quantidade, SUM(valor_total) as valor
      FROM pedidos_venda 
      ${where} AND vendedor_nome IS NOT NULL
      GROUP BY vendedor_id
      ORDER BY valor DESC
      LIMIT 5
    `).bind(...params).all();

    return c.json({
      success: true,
      data: {
        totais,
        por_status: porStatus.results,
        top_vendedores: topVendedores.results
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao gerar dashboard' }, 500);
  }
});

export default vendas;
