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


// =============================================
// POST /orcamentos/mesclar - Mesclar orçamentos
// =============================================
orcamentos.post('/mesclar', async (c) => {
  try {
    const body = await c.req.json();
    const { orcamentos_ids, cliente_id } = body;
    
    if (!orcamentos_ids || orcamentos_ids.length < 2) {
      return c.json({ success: false, error: 'Selecione pelo menos 2 orçamentos para mesclar' }, 400);
    }
    
    if (!cliente_id) {
      return c.json({ success: false, error: 'Cliente é obrigatório' }, 400);
    }
    
    // Buscar todos os orçamentos
    const placeholders = orcamentos_ids.map(() => '?').join(',');
    const orcamentosResult = await c.env.DB.prepare(`
      SELECT * FROM orcamentos WHERE id IN (${placeholders})
    `).bind(...orcamentos_ids).all();
    
    if (!orcamentosResult.results || orcamentosResult.results.length !== orcamentos_ids.length) {
      return c.json({ success: false, error: 'Um ou mais orçamentos não encontrados' }, 404);
    }
    
    const orcamentosData = orcamentosResult.results as any[];
    
    // Buscar dados do cliente selecionado
    const cliente = await c.env.DB.prepare(`
      SELECT id, razao_social, cpf_cnpj FROM clientes WHERE id = ?
    `).bind(cliente_id).first();
    
    if (!cliente) {
      return c.json({ success: false, error: 'Cliente não encontrado' }, 404);
    }
    
    // Obter próximo número
    const primeiro = orcamentosData[0];
    const maxNumero = await c.env.DB.prepare(`
      SELECT MAX(numero) as max FROM orcamentos WHERE empresa_id = ?
    `).bind(primeiro.empresa_id).first<{ max: number }>();
    const novoNumero = (maxNumero?.max || 0) + 1;
    
    // Buscar todos os itens dos orçamentos
    const itensResult = await c.env.DB.prepare(`
      SELECT oi.*, p.codigo, p.descricao, p.unidade
      FROM orcamentos_itens oi
      LEFT JOIN produtos p ON p.id = oi.produto_id
      WHERE oi.orcamento_id IN (${placeholders})
      ORDER BY oi.ordem
    `).bind(...orcamentos_ids).all();
    
    // Agrupar itens por produto, pegando o menor preço
    const itensAgrupados = new Map<string, any>();
    for (const item of (itensResult.results || []) as any[]) {
      const key = item.produto_id;
      if (itensAgrupados.has(key)) {
        const existing = itensAgrupados.get(key);
        existing.quantidade += item.quantidade;
        // Usar o menor valor unitário
        if (item.valor_unitario < existing.valor_unitario) {
          existing.valor_unitario = item.valor_unitario;
        }
        existing.valor_total = existing.quantidade * existing.valor_unitario;
      } else {
        itensAgrupados.set(key, {
          ...item,
          quantidade: item.quantidade,
          valor_total: item.quantidade * item.valor_unitario
        });
      }
    }
    
    // Calcular totais
    let subtotal = 0;
    const itensFinais = Array.from(itensAgrupados.values());
    itensFinais.forEach((item, index) => {
      item.ordem = index + 1;
      subtotal += item.valor_total;
    });
    
    // Criar registro de orçamentos mesclados
    const mesclados = orcamentosData.map(o => ({ id: o.id, numero: String(o.numero) }));
    
    const now = new Date().toISOString();
    const novoId = crypto.randomUUID();
    const dataValidade = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Inserir novo orçamento
    await c.env.DB.prepare(`
      INSERT INTO orcamentos (
        id, empresa_id, filial_id, numero, cliente_id, cliente_nome, cliente_cpf_cnpj,
        vendedor_id, vendedor_nome, status, data_emissao, validade_dias, data_validade,
        subtotal, valor_total, observacao_interna, orcamentos_mesclados, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'rascunho', ?, 30, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      novoId, primeiro.empresa_id, primeiro.filial_id, novoNumero,
      cliente.id, cliente.razao_social, cliente.cpf_cnpj,
      primeiro.vendedor_id, primeiro.vendedor_nome,
      now.split('T')[0], dataValidade, subtotal, subtotal,
      `Orçamento mesclado de: ${mesclados.map(m => m.numero).join(', ')}`,
      JSON.stringify(mesclados), now, now
    ).run();
    
    // Inserir itens
    for (const item of itensFinais) {
      await c.env.DB.prepare(`
        INSERT INTO orcamentos_itens (
          id, orcamento_id, produto_id, ordem, quantidade, valor_unitario,
          desconto_percentual, desconto_valor, valor_total, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), novoId, item.produto_id, item.ordem,
        item.quantidade, item.valor_unitario, item.desconto_percentual || 0,
        item.desconto_valor || 0, item.valor_total, now
      ).run();
    }
    
    return c.json({
      success: true,
      data: { id: novoId, numero: novoNumero },
      message: `Orçamento ${novoNumero} criado com ${itensFinais.length} itens`
    });
  } catch (error: any) {
    console.error('Erro ao mesclar orçamentos:', error);
    return c.json({ success: false, error: 'Erro ao mesclar orçamentos' }, 500);
  }
});

// =============================================
// POST /orcamentos/:id/desmembrar - Desmembrar orçamento em filhos
// =============================================
orcamentos.post('/:id/desmembrar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      grupos: Array<{
        itens_ids: string[];
        cliente_id?: string;
        observacao?: string;
      }>;
      usuario_id?: string;
    }>();

    if (!body.grupos || body.grupos.length < 1) {
      return c.json({ success: false, error: 'Informe pelo menos um grupo de itens para desmembrar' }, 400);
    }

    // Buscar orçamento pai
    const orcamentoPai = await c.env.DB.prepare(`
      SELECT * FROM orcamentos WHERE id = ?
    `).bind(id).first<{
      id: string;
      empresa_id: string;
      filial_id: string;
      numero: string;
      cliente_id: string;
      vendedor_id: string;
      tabela_preco_id: string;
      condicao_pagamento_id: string;
      status: string;
    }>();

    if (!orcamentoPai) {
      return c.json({ success: false, error: 'Orçamento não encontrado' }, 404);
    }

    if (orcamentoPai.status !== 'pendente' && orcamentoPai.status !== 'rascunho') {
      return c.json({ success: false, error: 'Apenas orçamentos pendentes podem ser desmembrados' }, 400);
    }

    // Buscar itens do orçamento
    const itensResult = await c.env.DB.prepare(`
      SELECT * FROM orcamentos_itens WHERE orcamento_id = ?
    `).bind(id).all<{
      id: string;
      produto_id: string;
      ordem: number;
      quantidade: number;
      valor_unitario: number;
      desconto_percentual: number;
      desconto_valor: number;
      valor_total: number;
    }>();

    const itensMap = new Map<string, typeof itensResult.results[0]>();
    for (const item of itensResult.results || []) {
      itensMap.set(item.id, item);
    }

    // Verificar se todos os itens existem
    for (const grupo of body.grupos) {
      for (const itemId of grupo.itens_ids) {
        if (!itensMap.has(itemId)) {
          return c.json({ success: false, error: `Item ${itemId} não encontrado no orçamento` }, 400);
        }
      }
    }

    // Buscar próximo número filho
    const maxFilho = await c.env.DB.prepare(`
      SELECT MAX(numero_filho) as max FROM orcamentos WHERE orcamento_pai_id = ?
    `).bind(id).first<{ max: number }>();
    let proximoFilho = (maxFilho?.max || 0) + 1;

    const now = new Date().toISOString();
    const filhosCriados: Array<{ id: string; numero: string; numero_filho: number }> = [];

    // Criar orçamentos filhos
    for (const grupo of body.grupos) {
      const filhoId = crypto.randomUUID();
      const clienteId = grupo.cliente_id || orcamentoPai.cliente_id;

      // Calcular totais do filho
      let subtotal = 0;
      let totalDesconto = 0;
      const itensDoGrupo: typeof itensResult.results = [];

      for (const itemId of grupo.itens_ids) {
        const item = itensMap.get(itemId);
        if (item) {
          itensDoGrupo.push(item);
          subtotal += item.quantidade * item.valor_unitario;
          totalDesconto += item.desconto_valor || 0;
        }
      }

      const valorTotal = subtotal - totalDesconto;
      const dataValidade = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Inserir orçamento filho
      await c.env.DB.prepare(`
        INSERT INTO orcamentos (
          id, empresa_id, filial_id, numero, numero_filho, orcamento_pai_id, origem,
          cliente_id, vendedor_id, tabela_preco_id, condicao_pagamento_id,
          data_emissao, data_validade, status, subtotal, desconto_total, valor_total,
          observacao, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'desmembrado', ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?, ?, ?)
      `).bind(
        filhoId, orcamentoPai.empresa_id, orcamentoPai.filial_id || null,
        orcamentoPai.numero, proximoFilho, id,
        clienteId, orcamentoPai.vendedor_id, orcamentoPai.tabela_preco_id || null,
        orcamentoPai.condicao_pagamento_id || null,
        now.split('T')[0], dataValidade, subtotal, totalDesconto, valorTotal,
        grupo.observacao || `Desmembrado do orçamento ${orcamentoPai.numero}`, now, now
      ).run();

      // Copiar itens para o filho
      let ordem = 1;
      for (const item of itensDoGrupo) {
        await c.env.DB.prepare(`
          INSERT INTO orcamentos_itens (
            id, orcamento_id, produto_id, ordem, quantidade, valor_unitario,
            desconto_percentual, desconto_valor, valor_total, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(), filhoId, item.produto_id, ordem++,
          item.quantidade, item.valor_unitario, item.desconto_percentual || 0,
          item.desconto_valor || 0, item.valor_total, now
        ).run();
      }

      filhosCriados.push({
        id: filhoId,
        numero: `${orcamentoPai.numero}.${proximoFilho}`,
        numero_filho: proximoFilho
      });

      proximoFilho++;
    }

    // Registrar histórico de desmembramento
    await c.env.DB.prepare(`
      INSERT INTO orcamentos_desmembramento_historico (
        id, empresa_id, orcamento_pai_id, orcamentos_filhos_ids, usuario_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), orcamentoPai.empresa_id, id,
      JSON.stringify(filhosCriados.map(f => f.id)),
      body.usuario_id || null, now
    ).run();

    return c.json({
      success: true,
      data: { filhos: filhosCriados },
      message: `Orçamento desmembrado em ${filhosCriados.length} orçamento(s) filho(s)`
    });
  } catch (error: unknown) {
    console.error('Erro ao desmembrar orçamento:', error);
    return c.json({ success: false, error: 'Erro ao desmembrar orçamento' }, 500);
  }
});

// =============================================
// GET /orcamentos/:id/filhos - Listar orçamentos filhos
// =============================================
orcamentos.get('/:id/filhos', async (c) => {
  const { id } = c.req.param();

  try {
    const filhos = await c.env.DB.prepare(`
      SELECT o.*, c.razao_social as cliente_nome
      FROM orcamentos o
      LEFT JOIN clientes c ON c.id = o.cliente_id
      WHERE o.orcamento_pai_id = ?
      ORDER BY o.numero_filho ASC
    `).bind(id).all();

    return c.json({ success: true, data: filhos.results });
  } catch (error: unknown) {
    console.error('Erro ao listar filhos:', error);
    return c.json({ success: false, error: 'Erro ao listar orçamentos filhos' }, 500);
  }
});

// =============================================
// POST /orcamentos/mesclar-v2 - Mesclar com regras de preço
// =============================================
orcamentos.post('/mesclar-v2', async (c) => {
  try {
    const body = await c.req.json<{
      orcamentos_ids: string[];
      cliente_id: string;
      regra_preco: 'menor' | 'maior' | 'recente' | 'manual';
      precos_manuais?: Record<string, number>; // produto_id -> valor_unitario
      usuario_id?: string;
    }>();

    if (!body.orcamentos_ids || body.orcamentos_ids.length < 2) {
      return c.json({ success: false, error: 'Selecione pelo menos 2 orçamentos para mesclar' }, 400);
    }

    if (!body.cliente_id) {
      return c.json({ success: false, error: 'Cliente é obrigatório' }, 400);
    }

    if (!body.regra_preco) {
      return c.json({ success: false, error: 'Regra de preço é obrigatória' }, 400);
    }

    // Buscar todos os orçamentos
    const placeholders = body.orcamentos_ids.map(() => '?').join(',');
    const orcamentosResult = await c.env.DB.prepare(`
      SELECT * FROM orcamentos WHERE id IN (${placeholders}) AND status IN ('pendente', 'rascunho')
    `).bind(...body.orcamentos_ids).all<{
      id: string;
      empresa_id: string;
      filial_id: string;
      numero: string;
      vendedor_id: string;
      created_at: string;
    }>();

    if (!orcamentosResult.results || orcamentosResult.results.length !== body.orcamentos_ids.length) {
      return c.json({ success: false, error: 'Um ou mais orçamentos não encontrados ou não estão pendentes' }, 404);
    }

    const orcamentosData = orcamentosResult.results;

    // Buscar dados do cliente
    const cliente = await c.env.DB.prepare(`
      SELECT id, razao_social, cpf_cnpj FROM clientes WHERE id = ?
    `).bind(body.cliente_id).first<{ id: string; razao_social: string; cpf_cnpj: string }>();

    if (!cliente) {
      return c.json({ success: false, error: 'Cliente não encontrado' }, 404);
    }

    // Obter próximo número
    const primeiro = orcamentosData[0];
    const maxNumero = await c.env.DB.prepare(`
      SELECT MAX(CAST(numero AS INTEGER)) as max FROM orcamentos WHERE empresa_id = ?
    `).bind(primeiro.empresa_id).first<{ max: number }>();
    const novoNumero = String((maxNumero?.max || 0) + 1).padStart(6, '0');

    // Buscar todos os itens dos orçamentos com data de criação
    const itensResult = await c.env.DB.prepare(`
      SELECT oi.*, o.created_at as orcamento_created_at
      FROM orcamentos_itens oi
      JOIN orcamentos o ON o.id = oi.orcamento_id
      WHERE oi.orcamento_id IN (${placeholders})
      ORDER BY o.created_at DESC
    `).bind(...body.orcamentos_ids).all<{
      id: string;
      orcamento_id: string;
      produto_id: string;
      quantidade: number;
      valor_unitario: number;
      desconto_percentual: number;
      desconto_valor: number;
      valor_total: number;
      orcamento_created_at: string;
    }>();

    // Agrupar itens por produto aplicando regra de preço
    const itensAgrupados = new Map<string, {
      produto_id: string;
      quantidade: number;
      valor_unitario: number;
      desconto_percentual: number;
      desconto_valor: number;
      valor_total: number;
      created_at: string;
    }>();

    for (const item of (itensResult.results || [])) {
      const key = item.produto_id;
      
      if (itensAgrupados.has(key)) {
        const existing = itensAgrupados.get(key)!;
        existing.quantidade += item.quantidade;
        
        // Aplicar regra de preço
        let novoPreco = existing.valor_unitario;
        switch (body.regra_preco) {
          case 'menor':
            novoPreco = Math.min(existing.valor_unitario, item.valor_unitario);
            break;
          case 'maior':
            novoPreco = Math.max(existing.valor_unitario, item.valor_unitario);
            break;
          case 'recente':
            // O mais recente vem primeiro (ORDER BY created_at DESC)
            // Então mantemos o primeiro valor encontrado
            break;
          case 'manual':
            if (body.precos_manuais && body.precos_manuais[key]) {
              novoPreco = body.precos_manuais[key];
            }
            break;
        }
        
        existing.valor_unitario = novoPreco;
        existing.valor_total = existing.quantidade * novoPreco;
      } else {
        let valorUnitario = item.valor_unitario;
        if (body.regra_preco === 'manual' && body.precos_manuais && body.precos_manuais[key]) {
          valorUnitario = body.precos_manuais[key];
        }
        
        itensAgrupados.set(key, {
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          valor_unitario: valorUnitario,
          desconto_percentual: item.desconto_percentual || 0,
          desconto_valor: item.desconto_valor || 0,
          valor_total: item.quantidade * valorUnitario,
          created_at: item.orcamento_created_at
        });
      }
    }

    // Calcular totais
    let subtotal = 0;
    let totalDesconto = 0;
    const itensFinais = Array.from(itensAgrupados.values());
    
    for (const item of itensFinais) {
      subtotal += item.valor_total;
      totalDesconto += item.desconto_valor;
    }

    const valorTotal = subtotal - totalDesconto;
    const now = new Date().toISOString();
    const novoId = crypto.randomUUID();
    const dataValidade = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Inserir novo orçamento
    await c.env.DB.prepare(`
      INSERT INTO orcamentos (
        id, empresa_id, filial_id, numero, origem, cliente_id,
        vendedor_id, data_emissao, data_validade, status,
        subtotal, desconto_total, valor_total,
        observacao_interna, orcamentos_mesclados, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'mesclado', ?, ?, ?, ?, 'pendente', ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      novoId, primeiro.empresa_id, primeiro.filial_id || null, novoNumero,
      cliente.id, primeiro.vendedor_id,
      now.split('T')[0], dataValidade, subtotal, totalDesconto, valorTotal,
      `Mesclado de: ${orcamentosData.map(o => o.numero).join(', ')} | Regra: ${body.regra_preco}`,
      JSON.stringify(orcamentosData.map(o => ({ id: o.id, numero: o.numero }))),
      now, now
    ).run();

    // Inserir itens
    let ordem = 1;
    for (const item of itensFinais) {
      await c.env.DB.prepare(`
        INSERT INTO orcamentos_itens (
          id, orcamento_id, produto_id, ordem, quantidade, valor_unitario,
          desconto_percentual, desconto_valor, valor_total, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), novoId, item.produto_id, ordem++,
        item.quantidade, item.valor_unitario, item.desconto_percentual,
        item.desconto_valor, item.valor_total, now
      ).run();
    }

    // Registrar histórico de mesclagem
    await c.env.DB.prepare(`
      INSERT INTO orcamentos_mesclagem_historico (
        id, empresa_id, orcamento_resultado_id, orcamentos_origem_ids,
        regra_preco, cliente_id, usuario_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), primeiro.empresa_id, novoId,
      JSON.stringify(body.orcamentos_ids), body.regra_preco,
      body.cliente_id, body.usuario_id || null, now
    ).run();

    return c.json({
      success: true,
      data: { id: novoId, numero: novoNumero, total_itens: itensFinais.length },
      message: `Orçamento ${novoNumero} criado com ${itensFinais.length} itens (regra: ${body.regra_preco})`
    });
  } catch (error: unknown) {
    console.error('Erro ao mesclar orçamentos:', error);
    return c.json({ success: false, error: 'Erro ao mesclar orçamentos' }, 500);
  }
});

// =============================================
// GET /orcamentos/:id/historico-mesclagem - Histórico de mesclagem
// =============================================
orcamentos.get('/:id/historico-mesclagem', async (c) => {
  const { id } = c.req.param();

  try {
    const historico = await c.env.DB.prepare(`
      SELECT h.*, u.nome as usuario_nome
      FROM orcamentos_mesclagem_historico h
      LEFT JOIN usuarios u ON u.id = h.usuario_id
      WHERE h.orcamento_resultado_id = ?
      ORDER BY h.created_at DESC
    `).bind(id).all();

    return c.json({ success: true, data: historico.results });
  } catch (error: unknown) {
    console.error('Erro ao buscar histórico:', error);
    return c.json({ success: false, error: 'Erro ao buscar histórico de mesclagem' }, 500);
  }
});

// =============================================
// GET /orcamentos/:id/historico-desmembramento - Histórico de desmembramento
// =============================================
orcamentos.get('/:id/historico-desmembramento', async (c) => {
  const { id } = c.req.param();

  try {
    const historico = await c.env.DB.prepare(`
      SELECT h.*, u.nome as usuario_nome
      FROM orcamentos_desmembramento_historico h
      LEFT JOIN usuarios u ON u.id = h.usuario_id
      WHERE h.orcamento_pai_id = ?
      ORDER BY h.created_at DESC
    `).bind(id).all();

    return c.json({ success: true, data: historico.results });
  } catch (error: unknown) {
    console.error('Erro ao buscar histórico:', error);
    return c.json({ success: false, error: 'Erro ao buscar histórico de desmembramento' }, 500);
  }
});

export default orcamentos;

