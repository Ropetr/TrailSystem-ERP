// =============================================
// PLANAC ERP - Rotas de Vendas
// Migrado de src/api/ para src/packages/api/
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
      SELECT v.*, c.razao_social as cliente_nome, u.nome as vendedor_nome
      FROM vendas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      LEFT JOIN usuarios u ON u.id = v.vendedor_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (empresa_id) {
      query += ` AND v.empresa_id = ?`;
      params.push(empresa_id);
    }

    if (busca) {
      query += ` AND (v.numero LIKE ? OR c.razao_social LIKE ?)`;
      params.push(`%${busca}%`, `%${busca}%`);
    }

    if (status) {
      query += ` AND v.status = ?`;
      params.push(status);
    }

    if (cliente_id) {
      query += ` AND v.cliente_id = ?`;
      params.push(cliente_id);
    }

    if (vendedor_id) {
      query += ` AND v.vendedor_id = ?`;
      params.push(vendedor_id);
    }

    if (data_inicio) {
      query += ` AND v.data_emissao >= ?`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND v.data_emissao <= ?`;
      params.push(data_fim);
    }

    const countQuery = query.replace('SELECT v.*, c.razao_social as cliente_nome, u.nome as vendedor_nome', 'SELECT COUNT(*) as total');
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    query += ` ORDER BY v.created_at DESC LIMIT ? OFFSET ?`;
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
      SELECT v.*, c.razao_social as cliente_nome, c.cpf_cnpj as cliente_cpf_cnpj,
             c.email as cliente_email, c.telefone as cliente_telefone,
             u.nome as vendedor_nome
      FROM vendas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      LEFT JOIN usuarios u ON u.id = v.vendedor_id
      WHERE v.id = ?
    `).bind(id).first();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada' }, 404);
    }

    const itens = await c.env.DB.prepare(`
      SELECT vi.*, p.nome as produto_nome, p.codigo as produto_codigo,
             p.ncm, um.sigla as unidade_sigla
      FROM vendas_itens vi
      LEFT JOIN produtos p ON p.id = vi.produto_id
      LEFT JOIN unidades_medida um ON um.id = p.unidade_medida_id
      WHERE vi.venda_id = ?
      ORDER BY vi.ordem
    `).bind(id).all();

    const parcelas = await c.env.DB.prepare(`
      SELECT * FROM vendas_parcelas WHERE venda_id = ? ORDER BY numero
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
      vendedor_id?: string;
      tabela_preco_id?: string;
      condicao_pagamento_id?: string;
      observacao?: string;
      empresa_id?: string;
      itens: Array<{
        produto_id: string;
        quantidade: number;
        valor_unitario: number;
        desconto_percentual?: number;
        desconto_valor?: number;
      }>;
      parcelas?: Array<{
        numero: number;
        data_vencimento: string;
        valor: number;
        forma_pagamento: string;
      }>;
    }>();

    if (!body.cliente_id) {
      return c.json({ success: false, error: 'Cliente obrigatorio' }, 400);
    }

    if (!body.itens || body.itens.length === 0) {
      return c.json({ success: false, error: 'Adicione ao menos um item' }, 400);
    }

    const empresaId = body.empresa_id || 'empresa_planac_001';

    // Gerar numero sequencial
    const ultimoNumero = await c.env.DB.prepare(`
      SELECT MAX(CAST(numero AS INTEGER)) as max_numero FROM vendas WHERE empresa_id = ?
    `).bind(empresaId).first<{ max_numero: number }>();
    const novoNumero = String((ultimoNumero?.max_numero || 0) + 1).padStart(6, '0');

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
      INSERT INTO vendas (
        id, empresa_id, numero, cliente_id, vendedor_id, tabela_preco_id,
        condicao_pagamento_id, data_emissao, status,
        subtotal, desconto_total, valor_total,
        observacao, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?, ?, ?)
    `).bind(
      id, empresaId, novoNumero, body.cliente_id, body.vendedor_id || null,
      body.tabela_preco_id || null, body.condicao_pagamento_id || null,
      now.split('T')[0], subtotal, totalDesconto, valorTotal,
      body.observacao || null, now, now
    ).run();

    // Criar itens
    let ordem = 1;
    for (const item of body.itens) {
      const valorBruto = item.quantidade * item.valor_unitario;
      const descontoValor = item.desconto_valor || (valorBruto * (item.desconto_percentual || 0) / 100);
      const valorLiquido = valorBruto - descontoValor;

      await c.env.DB.prepare(`
        INSERT INTO vendas_itens (
          id, venda_id, produto_id, ordem, quantidade, valor_unitario,
          desconto_percentual, desconto_valor, valor_total, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, item.produto_id, ordem++,
        item.quantidade, item.valor_unitario,
        item.desconto_percentual || 0, descontoValor, valorLiquido, now
      ).run();
    }

    // Criar parcelas se fornecidas
    if (body.parcelas && body.parcelas.length > 0) {
      for (const parcela of body.parcelas) {
        await c.env.DB.prepare(`
          INSERT INTO vendas_parcelas (
            id, venda_id, numero, data_vencimento, valor, forma_pagamento,
            status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'pendente', ?)
        `).bind(
          crypto.randomUUID(), id, parcela.numero,
          parcela.data_vencimento, parcela.valor, parcela.forma_pagamento, now
        ).run();
      }
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
      observacao?: string;
      itens?: Array<{
        produto_id: string;
        quantidade: number;
        valor_unitario: number;
        desconto_percentual?: number;
        desconto_valor?: number;
      }>;
    }>();

    const venda = await c.env.DB.prepare(`
      SELECT * FROM vendas WHERE id = ?
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
    if (body.observacao !== undefined) { updates.push('observacao = ?'); params.push(body.observacao); }

    // Atualizar itens se fornecidos
    if (body.itens && body.itens.length > 0) {
      await c.env.DB.prepare(`DELETE FROM vendas_itens WHERE venda_id = ?`).bind(id).run();

      let subtotal = 0;
      let totalDesconto = 0;
      let ordem = 1;
      const now = new Date().toISOString();

      for (const item of body.itens) {
        const valorBruto = item.quantidade * item.valor_unitario;
        const descontoValor = item.desconto_valor || (valorBruto * (item.desconto_percentual || 0) / 100);
        const valorLiquido = valorBruto - descontoValor;

        subtotal += valorBruto;
        totalDesconto += descontoValor;

        await c.env.DB.prepare(`
          INSERT INTO vendas_itens (
            id, venda_id, produto_id, ordem, quantidade, valor_unitario,
            desconto_percentual, desconto_valor, valor_total, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(), id, item.produto_id, ordem++,
          item.quantidade, item.valor_unitario,
          item.desconto_percentual || 0, descontoValor, valorLiquido, now
        ).run();
      }

      updates.push('subtotal = ?', 'desconto_total = ?', 'valor_total = ?');
      params.push(subtotal, totalDesconto, subtotal - totalDesconto);
    }

    params.push(id);

    await c.env.DB.prepare(`
      UPDATE vendas SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return c.json({ success: true, message: 'Venda atualizada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao editar venda' }, 500);
  }
});

// =============================================
// POST /vendas/:id/faturar - Faturar venda
// =============================================
vendas.post('/:id/faturar', async (c) => {
  const { id } = c.req.param();

  try {
    const venda = await c.env.DB.prepare(`
      SELECT * FROM vendas WHERE id = ?
    `).bind(id).first<any>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada' }, 404);
    }

    if (venda.status !== 'pendente') {
      return c.json({ success: false, error: 'Venda ja foi faturada ou cancelada' }, 400);
    }

    // Verificar estoque
    const itens = await c.env.DB.prepare(`
      SELECT vi.*, p.nome, p.estoque_atual 
      FROM vendas_itens vi
      JOIN produtos p ON p.id = vi.produto_id
      WHERE vi.venda_id = ?
    `).bind(id).all();

    for (const item of itens.results as any[]) {
      if (item.estoque_atual < item.quantidade) {
        return c.json({ 
          success: false, 
          error: `Estoque insuficiente para ${item.nome}. Disponivel: ${item.estoque_atual}` 
        }, 400);
      }
    }

    // Baixar estoque
    for (const item of itens.results as any[]) {
      await c.env.DB.prepare(`
        UPDATE produtos SET estoque_atual = estoque_atual - ?, updated_at = datetime('now') WHERE id = ?
      `).bind(item.quantidade, item.produto_id).run();

      // Registrar movimentacao
      await c.env.DB.prepare(`
        INSERT INTO movimentacoes_estoque (
          id, empresa_id, produto_id, tipo, quantidade, documento_tipo, documento_id,
          motivo, created_at
        ) VALUES (?, ?, ?, 'saida', ?, 'venda', ?, 'Venda faturada', datetime('now'))
      `).bind(crypto.randomUUID(), venda.empresa_id, item.produto_id, item.quantidade, id).run();
    }

    // Atualizar status
    await c.env.DB.prepare(`
      UPDATE vendas SET status = 'faturada', data_faturamento = datetime('now'), updated_at = datetime('now') WHERE id = ?
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
    const body = await c.req.json<{ motivo: string }>();

    const venda = await c.env.DB.prepare(`
      SELECT * FROM vendas WHERE id = ?
    `).bind(id).first<any>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada' }, 404);
    }

    // Se ja faturada, estornar estoque
    if (venda.status === 'faturada') {
      const itens = await c.env.DB.prepare(`
        SELECT * FROM vendas_itens WHERE venda_id = ?
      `).bind(id).all();

      for (const item of itens.results as any[]) {
        await c.env.DB.prepare(`
          UPDATE produtos SET estoque_atual = estoque_atual + ?, updated_at = datetime('now') WHERE id = ?
        `).bind(item.quantidade, item.produto_id).run();

        await c.env.DB.prepare(`
          INSERT INTO movimentacoes_estoque (
            id, empresa_id, produto_id, tipo, quantidade, documento_tipo, documento_id,
            motivo, created_at
          ) VALUES (?, ?, ?, 'entrada', ?, 'venda', ?, 'Cancelamento de venda', datetime('now'))
        `).bind(crypto.randomUUID(), venda.empresa_id, item.produto_id, item.quantidade, id).run();
      }
    }

    await c.env.DB.prepare(`
      UPDATE vendas SET status = 'cancelada', motivo_cancelamento = ?, updated_at = datetime('now') WHERE id = ?
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
      FROM vendas ${where}
    `).bind(...params).first();

    // Vendas por status
    const porStatus = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as quantidade, SUM(valor_total) as valor
      FROM vendas ${where}
      GROUP BY status
    `).bind(...params).all();

    // Top vendedores
    const topVendedores = await c.env.DB.prepare(`
      SELECT u.nome, COUNT(v.id) as quantidade, SUM(v.valor_total) as valor
      FROM vendas v
      JOIN usuarios u ON u.id = v.vendedor_id
      ${where}
      GROUP BY v.vendedor_id
      ORDER BY valor DESC
      LIMIT 5
    `).bind(...params).all();

    // Vendas por dia
    const porDia = await c.env.DB.prepare(`
      SELECT date(data_emissao) as data, COUNT(*) as quantidade, SUM(valor_total) as valor
      FROM vendas ${where}
      GROUP BY date(data_emissao)
      ORDER BY data DESC
      LIMIT 30
    `).bind(...params).all();

    return c.json({
      success: true,
      data: {
        totais,
        por_status: porStatus.results,
        top_vendedores: topVendedores.results,
        por_dia: porDia.results
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao gerar dashboard' }, 500);
  }
});

export default vendas;
