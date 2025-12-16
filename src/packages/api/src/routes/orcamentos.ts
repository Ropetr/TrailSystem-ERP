// =============================================
// PLANAC ERP - Rotas de Orcamentos
// Migrado de src/api/ para src/packages/api/
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const orcamentos = new Hono<{ Bindings: Env }>();

// =============================================
// GET /orcamentos - Listar
// =============================================
orcamentos.get('/', async (c) => {
  const { page = '1', limit = '20', busca, status, cliente_id, vendedor_id, data_inicio, data_fim, empresa_id } = c.req.query();

  try {
    let query = `
      SELECT o.*, c.razao_social as cliente_nome, u.nome as vendedor_nome
      FROM orcamentos o
      LEFT JOIN clientes c ON c.id = o.cliente_id
      LEFT JOIN usuarios u ON u.id = o.vendedor_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (empresa_id) {
      query += ` AND o.empresa_id = ?`;
      params.push(empresa_id);
    }

    if (busca) {
      query += ` AND (o.numero LIKE ? OR c.razao_social LIKE ?)`;
      params.push(`%${busca}%`, `%${busca}%`);
    }

    if (status) {
      query += ` AND o.status = ?`;
      params.push(status);
    }

    if (cliente_id) {
      query += ` AND o.cliente_id = ?`;
      params.push(cliente_id);
    }

    if (vendedor_id) {
      query += ` AND o.vendedor_id = ?`;
      params.push(vendedor_id);
    }

    if (data_inicio) {
      query += ` AND o.data_emissao >= ?`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND o.data_emissao <= ?`;
      params.push(data_fim);
    }

    const countQuery = query.replace('SELECT o.*, c.razao_social as cliente_nome, u.nome as vendedor_nome', 'SELECT COUNT(*) as total');
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
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
    console.error('Erro ao listar orcamentos:', error);
    return c.json({ success: false, error: 'Erro ao listar orcamentos' }, 500);
  }
});

// =============================================
// GET /orcamentos/:id - Buscar
// =============================================
orcamentos.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const orcamento = await c.env.DB.prepare(`
      SELECT o.*, c.razao_social as cliente_nome, c.cpf_cnpj as cliente_cpf_cnpj,
             c.email as cliente_email, c.telefone as cliente_telefone,
             u.nome as vendedor_nome
      FROM orcamentos o
      LEFT JOIN clientes c ON c.id = o.cliente_id
      LEFT JOIN usuarios u ON u.id = o.vendedor_id
      WHERE o.id = ?
    `).bind(id).first();

    if (!orcamento) {
      return c.json({ success: false, error: 'Orcamento nao encontrado' }, 404);
    }

    const itens = await c.env.DB.prepare(`
      SELECT oi.*, p.nome as produto_nome, p.codigo as produto_codigo,
             um.sigla as unidade_sigla
      FROM orcamentos_itens oi
      LEFT JOIN produtos p ON p.id = oi.produto_id
      LEFT JOIN unidades_medida um ON um.id = p.unidade_medida_id
      WHERE oi.orcamento_id = ?
      ORDER BY oi.ordem
    `).bind(id).all();

    return c.json({
      success: true,
      data: { ...orcamento, itens: itens.results }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao buscar orcamento' }, 500);
  }
});

// =============================================
// POST /orcamentos - Criar
// =============================================
orcamentos.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      cliente_id: string;
      vendedor_id?: string;
      tabela_preco_id?: string;
      condicao_pagamento_id?: string;
      data_validade?: string;
      observacao?: string;
      observacao_interna?: string;
      empresa_id?: string;
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

    // Gerar numero sequencial
    const ultimoNumero = await c.env.DB.prepare(`
      SELECT MAX(CAST(numero AS INTEGER)) as max_numero FROM orcamentos WHERE empresa_id = ?
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

    // Criar orcamento
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const dataValidade = body.data_validade || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await c.env.DB.prepare(`
      INSERT INTO orcamentos (
        id, empresa_id, numero, cliente_id, vendedor_id, tabela_preco_id,
        condicao_pagamento_id, data_emissao, data_validade, status,
        subtotal, desconto_total, valor_total,
        observacao, observacao_interna, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, empresaId, novoNumero, body.cliente_id, body.vendedor_id || null,
      body.tabela_preco_id || null, body.condicao_pagamento_id || null,
      now.split('T')[0], dataValidade,
      subtotal, totalDesconto, valorTotal,
      body.observacao || null, body.observacao_interna || null, now, now
    ).run();

    // Criar itens
    let ordem = 1;
    for (const item of body.itens) {
      const valorBruto = item.quantidade * item.valor_unitario;
      const descontoValor = item.desconto_valor || (valorBruto * (item.desconto_percentual || 0) / 100);
      const valorLiquido = valorBruto - descontoValor;

      await c.env.DB.prepare(`
        INSERT INTO orcamentos_itens (
          id, orcamento_id, produto_id, ordem, quantidade, valor_unitario,
          desconto_percentual, desconto_valor, valor_total, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, item.produto_id, ordem++,
        item.quantidade, item.valor_unitario,
        item.desconto_percentual || 0, descontoValor, valorLiquido, now
      ).run();
    }

    return c.json({
      success: true,
      data: { id, numero: novoNumero },
      message: 'Orcamento criado com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar orcamento:', error);
    return c.json({ success: false, error: 'Erro ao criar orcamento' }, 500);
  }
});

// =============================================
// PUT /orcamentos/:id - Editar
// =============================================
orcamentos.put('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      cliente_id?: string;
      vendedor_id?: string;
      data_validade?: string;
      observacao?: string;
      observacao_interna?: string;
      itens?: Array<{
        produto_id: string;
        quantidade: number;
        valor_unitario: number;
        desconto_percentual?: number;
        desconto_valor?: number;
      }>;
    }>();

    const orcamento = await c.env.DB.prepare(`
      SELECT * FROM orcamentos WHERE id = ?
    `).bind(id).first<any>();

    if (!orcamento) {
      return c.json({ success: false, error: 'Orcamento nao encontrado' }, 404);
    }

    if (orcamento.status !== 'pendente') {
      return c.json({ success: false, error: 'Apenas orcamentos pendentes podem ser editados' }, 400);
    }

    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [new Date().toISOString()];

    if (body.cliente_id !== undefined) { updates.push('cliente_id = ?'); params.push(body.cliente_id); }
    if (body.vendedor_id !== undefined) { updates.push('vendedor_id = ?'); params.push(body.vendedor_id); }
    if (body.data_validade !== undefined) { updates.push('data_validade = ?'); params.push(body.data_validade); }
    if (body.observacao !== undefined) { updates.push('observacao = ?'); params.push(body.observacao); }
    if (body.observacao_interna !== undefined) { updates.push('observacao_interna = ?'); params.push(body.observacao_interna); }

    // Atualizar itens se fornecidos
    if (body.itens && body.itens.length > 0) {
      // Remover itens antigos
      await c.env.DB.prepare(`DELETE FROM orcamentos_itens WHERE orcamento_id = ?`).bind(id).run();

      // Recalcular totais
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
          INSERT INTO orcamentos_itens (
            id, orcamento_id, produto_id, ordem, quantidade, valor_unitario,
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
      UPDATE orcamentos SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return c.json({ success: true, message: 'Orcamento atualizado' });
  } catch (error: any) {
    console.error('Erro ao editar orcamento:', error);
    return c.json({ success: false, error: 'Erro ao editar orcamento' }, 500);
  }
});

// =============================================
// POST /orcamentos/:id/aprovar - Aprovar
// =============================================
orcamentos.post('/:id/aprovar', async (c) => {
  const { id } = c.req.param();

  try {
    const orcamento = await c.env.DB.prepare(`
      SELECT status FROM orcamentos WHERE id = ?
    `).bind(id).first<{ status: string }>();

    if (!orcamento) {
      return c.json({ success: false, error: 'Orcamento nao encontrado' }, 404);
    }

    if (orcamento.status !== 'pendente') {
      return c.json({ success: false, error: 'Orcamento ja foi processado' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE orcamentos SET status = 'aprovado', updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Orcamento aprovado' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao aprovar orcamento' }, 500);
  }
});

// =============================================
// POST /orcamentos/:id/rejeitar - Rejeitar
// =============================================
orcamentos.post('/:id/rejeitar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{ motivo?: string }>();

    await c.env.DB.prepare(`
      UPDATE orcamentos SET status = 'rejeitado', motivo_cancelamento = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(body.motivo || null, id).run();

    return c.json({ success: true, message: 'Orcamento rejeitado' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao rejeitar orcamento' }, 500);
  }
});

// =============================================
// POST /orcamentos/:id/converter-venda - Converter em Venda
// =============================================
orcamentos.post('/:id/converter-venda', async (c) => {
  const { id } = c.req.param();

  try {
    const orcamento = await c.env.DB.prepare(`
      SELECT * FROM orcamentos WHERE id = ?
    `).bind(id).first<any>();

    if (!orcamento) {
      return c.json({ success: false, error: 'Orcamento nao encontrado' }, 404);
    }

    if (orcamento.status !== 'aprovado' && orcamento.status !== 'pendente') {
      return c.json({ success: false, error: 'Orcamento nao pode ser convertido' }, 400);
    }

    // Buscar itens
    const itens = await c.env.DB.prepare(`
      SELECT * FROM orcamentos_itens WHERE orcamento_id = ?
    `).bind(id).all();

    // Gerar numero da venda
    const ultimoNumero = await c.env.DB.prepare(`
      SELECT MAX(CAST(numero AS INTEGER)) as max_numero FROM vendas WHERE empresa_id = ?
    `).bind(orcamento.empresa_id).first<{ max_numero: number }>();
    const novoNumero = String((ultimoNumero?.max_numero || 0) + 1).padStart(6, '0');

    // Criar venda
    const vendaId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO vendas (
        id, empresa_id, numero, orcamento_id, cliente_id, vendedor_id,
        tabela_preco_id, condicao_pagamento_id, data_emissao, status,
        subtotal, desconto_total, valor_total,
        observacao, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?, ?, ?)
    `).bind(
      vendaId, orcamento.empresa_id, novoNumero, id,
      orcamento.cliente_id, orcamento.vendedor_id,
      orcamento.tabela_preco_id, orcamento.condicao_pagamento_id,
      now.split('T')[0], orcamento.subtotal, orcamento.desconto_total,
      orcamento.valor_total, orcamento.observacao, now, now
    ).run();

    // Copiar itens
    for (const item of itens.results as any[]) {
      await c.env.DB.prepare(`
        INSERT INTO vendas_itens (
          id, venda_id, produto_id, ordem, quantidade, valor_unitario,
          desconto_percentual, desconto_valor, valor_total, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), vendaId, item.produto_id, item.ordem,
        item.quantidade, item.valor_unitario, item.desconto_percentual,
        item.desconto_valor, item.valor_total, now
      ).run();
    }

    // Atualizar status do orcamento
    await c.env.DB.prepare(`
      UPDATE orcamentos SET status = 'convertido', venda_id = ?, updated_at = ? WHERE id = ?
    `).bind(vendaId, now, id).run();

    return c.json({
      success: true,
      data: { venda_id: vendaId, numero: novoNumero },
      message: 'Orcamento convertido em venda'
    });
  } catch (error: any) {
    console.error('Erro ao converter orcamento:', error);
    return c.json({ success: false, error: 'Erro ao converter orcamento' }, 500);
  }
});

// =============================================
// POST /orcamentos/:id/duplicar - Duplicar
// =============================================
orcamentos.post('/:id/duplicar', async (c) => {
  const { id } = c.req.param();

  try {
    const orcamento = await c.env.DB.prepare(`
      SELECT * FROM orcamentos WHERE id = ?
    `).bind(id).first<any>();

    if (!orcamento) {
      return c.json({ success: false, error: 'Orcamento nao encontrado' }, 404);
    }

    const itens = await c.env.DB.prepare(`
      SELECT * FROM orcamentos_itens WHERE orcamento_id = ?
    `).bind(id).all();

    // Gerar novo numero
    const ultimoNumero = await c.env.DB.prepare(`
      SELECT MAX(CAST(numero AS INTEGER)) as max_numero FROM orcamentos WHERE empresa_id = ?
    `).bind(orcamento.empresa_id).first<{ max_numero: number }>();
    const novoNumero = String((ultimoNumero?.max_numero || 0) + 1).padStart(6, '0');

    // Criar novo orcamento
    const novoId = crypto.randomUUID();
    const now = new Date().toISOString();
    const dataValidade = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await c.env.DB.prepare(`
      INSERT INTO orcamentos (
        id, empresa_id, numero, cliente_id, vendedor_id, tabela_preco_id,
        condicao_pagamento_id, data_emissao, data_validade, status,
        subtotal, desconto_total, valor_total,
        observacao, observacao_interna, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      novoId, orcamento.empresa_id, novoNumero, orcamento.cliente_id,
      orcamento.vendedor_id, orcamento.tabela_preco_id, orcamento.condicao_pagamento_id,
      now.split('T')[0], dataValidade, orcamento.subtotal, orcamento.desconto_total,
      orcamento.valor_total, orcamento.observacao, orcamento.observacao_interna, now, now
    ).run();

    // Copiar itens
    for (const item of itens.results as any[]) {
      await c.env.DB.prepare(`
        INSERT INTO orcamentos_itens (
          id, orcamento_id, produto_id, ordem, quantidade, valor_unitario,
          desconto_percentual, desconto_valor, valor_total, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), novoId, item.produto_id, item.ordem,
        item.quantidade, item.valor_unitario, item.desconto_percentual,
        item.desconto_valor, item.valor_total, now
      ).run();
    }

    return c.json({
      success: true,
      data: { id: novoId, numero: novoNumero },
      message: 'Orcamento duplicado'
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao duplicar orcamento' }, 500);
  }
});

export default orcamentos;
