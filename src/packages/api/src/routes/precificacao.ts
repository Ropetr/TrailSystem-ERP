// =============================================
// TRAILSYSTEM ERP - Rotas de Precificacao
// Fluxo completo: tabelas de preco, custos, simulacoes
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const precificacao = new Hono<{ Bindings: Env }>();

// =============================================
// TABELAS DE PRECO
// =============================================

// GET /precificacao/tabelas - Listar tabelas de preco
precificacao.get('/tabelas', async (c) => {
  const { empresa_id, tipo, ativo } = c.req.query();

  try {
    let where = 'WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND empresa_id = ?';
      params.push(empresa_id);
    }

    if (tipo) {
      where += ' AND tipo = ?';
      params.push(tipo);
    }

    if (ativo !== undefined) {
      where += ' AND ativo = ?';
      params.push(ativo === 'true' ? 1 : 0);
    }

    const result = await c.env.DB.prepare(`
      SELECT * FROM tabelas_preco ${where} ORDER BY padrao DESC, nome ASC
    `).bind(...params).all();

    return c.json({ success: true, data: result.results });
  } catch (error: any) {
    console.error('Erro ao listar tabelas de preco:', error);
    return c.json({ success: false, error: 'Erro ao listar tabelas de preco' }, 500);
  }
});

// GET /precificacao/tabelas/:id - Buscar tabela por ID
precificacao.get('/tabelas/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const tabela = await c.env.DB.prepare(`
      SELECT * FROM tabelas_preco WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!tabela) {
      return c.json({ success: false, error: 'Tabela nao encontrada' }, 404);
    }

    const produtos = await c.env.DB.prepare(`
      SELECT tp.*, p.codigo as produto_codigo, p.nome as produto_nome
      FROM tabelas_preco_produtos tp
      JOIN produtos p ON p.id = tp.produto_id
      WHERE tp.tabela_preco_id = ?
    `).bind(id).all();

    const clientes = await c.env.DB.prepare(`
      SELECT tc.*, c.nome as cliente_nome, c.cpf_cnpj
      FROM tabelas_preco_clientes tc
      JOIN clientes c ON c.id = tc.cliente_id
      WHERE tc.tabela_preco_id = ?
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...tabela,
        produtos: produtos.results,
        clientes: clientes.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar tabela:', error);
    return c.json({ success: false, error: 'Erro ao buscar tabela' }, 500);
  }
});

// POST /precificacao/tabelas - Criar tabela de preco
precificacao.post('/tabelas', async (c) => {
  try {
    const body = await c.req.json<{
      codigo: string;
      nome: string;
      descricao?: string;
      tipo?: string;
      padrao?: boolean;
      vigencia_inicio?: string;
      vigencia_fim?: string;
      desconto_percentual?: number;
      acrescimo_percentual?: number;
      quantidade_minima?: number;
      valor_minimo_pedido?: number;
      aplicar_a?: string;
      empresa_id: string;
    }>();

    if (!body.codigo || !body.nome) {
      return c.json({ success: false, error: 'Codigo e nome sao obrigatorios' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    if (body.padrao) {
      await c.env.DB.prepare(`
        UPDATE tabelas_preco SET padrao = 0, updated_at = ? WHERE empresa_id = ?
      `).bind(now, body.empresa_id).run();
    }

    await c.env.DB.prepare(`
      INSERT INTO tabelas_preco (
        id, empresa_id, codigo, nome, descricao, tipo, padrao,
        vigencia_inicio, vigencia_fim, desconto_percentual, acrescimo_percentual,
        quantidade_minima, valor_minimo_pedido, aplicar_a, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.empresa_id, body.codigo, body.nome, body.descricao || null,
      body.tipo || 'varejo', body.padrao ? 1 : 0,
      body.vigencia_inicio || null, body.vigencia_fim || null,
      body.desconto_percentual || 0, body.acrescimo_percentual || 0,
      body.quantidade_minima || 1, body.valor_minimo_pedido || 0,
      body.aplicar_a || 'todos', now, now
    ).run();

    return c.json({ success: true, data: { id }, message: 'Tabela criada com sucesso' }, 201);
  } catch (error: any) {
    console.error('Erro ao criar tabela:', error);
    return c.json({ success: false, error: 'Erro ao criar tabela' }, 500);
  }
});

// PUT /precificacao/tabelas/:id - Atualizar tabela
precificacao.put('/tabelas/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      codigo?: string;
      nome?: string;
      descricao?: string;
      tipo?: string;
      ativo?: boolean;
      padrao?: boolean;
      vigencia_inicio?: string;
      vigencia_fim?: string;
      desconto_percentual?: number;
      acrescimo_percentual?: number;
      quantidade_minima?: number;
      valor_minimo_pedido?: number;
      aplicar_a?: string;
      empresa_id?: string;
    }>();

    const tabela = await c.env.DB.prepare(`
      SELECT * FROM tabelas_preco WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!tabela) {
      return c.json({ success: false, error: 'Tabela nao encontrada' }, 404);
    }

    const now = new Date().toISOString();

    if (body.padrao) {
      await c.env.DB.prepare(`
        UPDATE tabelas_preco SET padrao = 0, updated_at = ? WHERE empresa_id = ?
      `).bind(now, tabela.empresa_id).run();
    }

    await c.env.DB.prepare(`
      UPDATE tabelas_preco SET
        codigo = COALESCE(?, codigo),
        nome = COALESCE(?, nome),
        descricao = COALESCE(?, descricao),
        tipo = COALESCE(?, tipo),
        ativo = COALESCE(?, ativo),
        padrao = COALESCE(?, padrao),
        vigencia_inicio = COALESCE(?, vigencia_inicio),
        vigencia_fim = COALESCE(?, vigencia_fim),
        desconto_percentual = COALESCE(?, desconto_percentual),
        acrescimo_percentual = COALESCE(?, acrescimo_percentual),
        quantidade_minima = COALESCE(?, quantidade_minima),
        valor_minimo_pedido = COALESCE(?, valor_minimo_pedido),
        aplicar_a = COALESCE(?, aplicar_a),
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.codigo || null, body.nome || null, body.descricao || null,
      body.tipo || null, body.ativo !== undefined ? (body.ativo ? 1 : 0) : null,
      body.padrao !== undefined ? (body.padrao ? 1 : 0) : null,
      body.vigencia_inicio || null, body.vigencia_fim || null,
      body.desconto_percentual ?? null, body.acrescimo_percentual ?? null,
      body.quantidade_minima ?? null, body.valor_minimo_pedido ?? null,
      body.aplicar_a || null, now, id
    ).run();

    return c.json({ success: true, message: 'Tabela atualizada' });
  } catch (error: any) {
    console.error('Erro ao atualizar tabela:', error);
    return c.json({ success: false, error: 'Erro ao atualizar tabela' }, 500);
  }
});

// POST /precificacao/tabelas/:id/produtos - Adicionar produtos a tabela
precificacao.post('/tabelas/:id/produtos', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      produtos: Array<{
        produto_id: string;
        preco_venda: number;
        preco_promocional?: number;
        desconto_maximo?: number;
        quantidade_minima?: number;
        vigencia_inicio?: string;
        vigencia_fim?: string;
      }>;
    }>();

    if (!body.produtos || body.produtos.length === 0) {
      return c.json({ success: false, error: 'Produtos sao obrigatorios' }, 400);
    }

    const tabela = await c.env.DB.prepare(`
      SELECT * FROM tabelas_preco WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!tabela) {
      return c.json({ success: false, error: 'Tabela nao encontrada' }, 404);
    }

    const now = new Date().toISOString();

    for (const prod of body.produtos) {
      const existing = await c.env.DB.prepare(`
        SELECT id FROM tabelas_preco_produtos WHERE tabela_preco_id = ? AND produto_id = ?
      `).bind(id, prod.produto_id).first();

      if (existing) {
        await c.env.DB.prepare(`
          UPDATE tabelas_preco_produtos SET
            preco_venda = ?,
            preco_promocional = ?,
            desconto_maximo = ?,
            quantidade_minima = ?,
            vigencia_inicio = ?,
            vigencia_fim = ?,
            updated_at = ?
          WHERE tabela_preco_id = ? AND produto_id = ?
        `).bind(
          prod.preco_venda, prod.preco_promocional || null,
          prod.desconto_maximo || 0, prod.quantidade_minima || 1,
          prod.vigencia_inicio || null, prod.vigencia_fim || null,
          now, id, prod.produto_id
        ).run();
      } else {
        await c.env.DB.prepare(`
          INSERT INTO tabelas_preco_produtos (
            id, tabela_preco_id, produto_id, preco_venda, preco_promocional,
            desconto_maximo, quantidade_minima, vigencia_inicio, vigencia_fim,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(), id, prod.produto_id, prod.preco_venda,
          prod.preco_promocional || null, prod.desconto_maximo || 0,
          prod.quantidade_minima || 1, prod.vigencia_inicio || null,
          prod.vigencia_fim || null, now, now
        ).run();
      }
    }

    return c.json({ success: true, message: `${body.produtos.length} produtos adicionados/atualizados` });
  } catch (error: any) {
    console.error('Erro ao adicionar produtos:', error);
    return c.json({ success: false, error: 'Erro ao adicionar produtos' }, 500);
  }
});

// POST /precificacao/tabelas/:id/clientes - Vincular clientes a tabela
precificacao.post('/tabelas/:id/clientes', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      cliente_ids: string[];
    }>();

    if (!body.cliente_ids || body.cliente_ids.length === 0) {
      return c.json({ success: false, error: 'Clientes sao obrigatorios' }, 400);
    }

    const tabela = await c.env.DB.prepare(`
      SELECT * FROM tabelas_preco WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!tabela) {
      return c.json({ success: false, error: 'Tabela nao encontrada' }, 404);
    }

    const now = new Date().toISOString();

    for (const clienteId of body.cliente_ids) {
      const existing = await c.env.DB.prepare(`
        SELECT id FROM tabelas_preco_clientes WHERE tabela_preco_id = ? AND cliente_id = ?
      `).bind(id, clienteId).first();

      if (!existing) {
        await c.env.DB.prepare(`
          INSERT INTO tabelas_preco_clientes (id, tabela_preco_id, cliente_id, created_at)
          VALUES (?, ?, ?, ?)
        `).bind(crypto.randomUUID(), id, clienteId, now).run();
      }
    }

    return c.json({ success: true, message: `${body.cliente_ids.length} clientes vinculados` });
  } catch (error: any) {
    console.error('Erro ao vincular clientes:', error);
    return c.json({ success: false, error: 'Erro ao vincular clientes' }, 500);
  }
});

// =============================================
// CUSTOS DE PRODUTOS
// =============================================

// GET /precificacao/custos - Listar custos de produtos
precificacao.get('/custos', async (c) => {
  const { empresa_id, produto_id } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND c.empresa_id = ?';
      params.push(empresa_id);
    }

    if (produto_id) {
      where += ' AND c.produto_id = ?';
      params.push(produto_id);
    }

    const result = await c.env.DB.prepare(`
      SELECT c.*, p.codigo as produto_codigo, p.nome as produto_nome, p.preco_venda,
        CASE 
          WHEN p.preco_venda > 0 THEN ((p.preco_venda - c.custo_total) / p.preco_venda) * 100
          ELSE 0
        END as margem_atual
      FROM custos_produtos c
      JOIN produtos p ON p.id = c.produto_id
      ${where}
      ORDER BY p.nome
    `).bind(...params).all();

    return c.json({ success: true, data: result.results });
  } catch (error: any) {
    console.error('Erro ao listar custos:', error);
    return c.json({ success: false, error: 'Erro ao listar custos' }, 500);
  }
});

// POST /precificacao/custos - Registrar/atualizar custo de produto
precificacao.post('/custos', async (c) => {
  try {
    const body = await c.req.json<{
      produto_id: string;
      custo_aquisicao: number;
      custo_frete?: number;
      custo_impostos_nao_recuperaveis?: number;
      rateio_aluguel?: number;
      rateio_salarios?: number;
      rateio_energia?: number;
      rateio_marketing?: number;
      rateio_outros?: number;
      empresa_id: string;
    }>();

    if (!body.produto_id || body.custo_aquisicao === undefined) {
      return c.json({ success: false, error: 'Produto e custo de aquisicao sao obrigatorios' }, 400);
    }

    const now = new Date().toISOString();

    const custoDiretoTotal = (body.custo_aquisicao || 0) + 
                            (body.custo_frete || 0) + 
                            (body.custo_impostos_nao_recuperaveis || 0);

    const custoIndiretoTotal = (body.rateio_aluguel || 0) + 
                               (body.rateio_salarios || 0) + 
                               (body.rateio_energia || 0) + 
                               (body.rateio_marketing || 0) + 
                               (body.rateio_outros || 0);

    const custoTotal = custoDiretoTotal + custoIndiretoTotal;

    const existing = await c.env.DB.prepare(`
      SELECT id FROM custos_produtos WHERE empresa_id = ? AND produto_id = ?
    `).bind(body.empresa_id, body.produto_id).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE custos_produtos SET
          custo_aquisicao = ?,
          custo_frete = ?,
          custo_impostos_nao_recuperaveis = ?,
          custo_direto_total = ?,
          rateio_aluguel = ?,
          rateio_salarios = ?,
          rateio_energia = ?,
          rateio_marketing = ?,
          rateio_outros = ?,
          custo_indireto_total = ?,
          custo_total = ?,
          data_calculo = ?,
          updated_at = ?
        WHERE empresa_id = ? AND produto_id = ?
      `).bind(
        body.custo_aquisicao, body.custo_frete || 0,
        body.custo_impostos_nao_recuperaveis || 0, custoDiretoTotal,
        body.rateio_aluguel || 0, body.rateio_salarios || 0,
        body.rateio_energia || 0, body.rateio_marketing || 0,
        body.rateio_outros || 0, custoIndiretoTotal, custoTotal,
        now.split('T')[0], now, body.empresa_id, body.produto_id
      ).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO custos_produtos (
          id, empresa_id, produto_id, custo_aquisicao, custo_frete,
          custo_impostos_nao_recuperaveis, custo_direto_total,
          rateio_aluguel, rateio_salarios, rateio_energia, rateio_marketing,
          rateio_outros, custo_indireto_total, custo_total, data_calculo,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), body.empresa_id, body.produto_id,
        body.custo_aquisicao, body.custo_frete || 0,
        body.custo_impostos_nao_recuperaveis || 0, custoDiretoTotal,
        body.rateio_aluguel || 0, body.rateio_salarios || 0,
        body.rateio_energia || 0, body.rateio_marketing || 0,
        body.rateio_outros || 0, custoIndiretoTotal, custoTotal,
        now.split('T')[0], now, now
      ).run();
    }

    return c.json({ 
      success: true, 
      data: { custo_total: custoTotal },
      message: 'Custo registrado com sucesso' 
    });
  } catch (error: any) {
    console.error('Erro ao registrar custo:', error);
    return c.json({ success: false, error: 'Erro ao registrar custo' }, 500);
  }
});

// =============================================
// CALCULO DE PRECO
// =============================================

// POST /precificacao/calcular - Calcular preco de venda
precificacao.post('/calcular', async (c) => {
  try {
    const body = await c.req.json<{
      produto_id?: string;
      custo_total?: number;
      metodo: 'markup' | 'margem' | 'mercado';
      valor: number;
      preco_mercado?: number;
      empresa_id: string;
    }>();

    if (!body.metodo || body.valor === undefined) {
      return c.json({ success: false, error: 'Metodo e valor sao obrigatorios' }, 400);
    }

    let custoTotal = body.custo_total;

    if (body.produto_id && !custoTotal) {
      const custo = await c.env.DB.prepare(`
        SELECT custo_total FROM custos_produtos WHERE empresa_id = ? AND produto_id = ?
      `).bind(body.empresa_id, body.produto_id).first<{ custo_total: number }>();
      custoTotal = custo?.custo_total || 0;
    }

    if (!custoTotal || custoTotal <= 0) {
      return c.json({ success: false, error: 'Custo total nao encontrado ou invalido' }, 400);
    }

    let precoCalculado = 0;
    let margemCalculada = 0;

    switch (body.metodo) {
      case 'markup':
        precoCalculado = custoTotal * (1 + body.valor / 100);
        margemCalculada = (precoCalculado - custoTotal) / precoCalculado * 100;
        break;
      case 'margem':
        precoCalculado = custoTotal / (1 - body.valor / 100);
        margemCalculada = body.valor;
        break;
      case 'mercado':
        precoCalculado = body.preco_mercado || 0;
        margemCalculada = precoCalculado > 0 ? (precoCalculado - custoTotal) / precoCalculado * 100 : 0;
        break;
    }

    const config = await c.env.DB.prepare(`
      SELECT margem_minima FROM config_precificacao WHERE empresa_id = ?
    `).bind(body.empresa_id).first<{ margem_minima: number }>();

    const margemMinima = config?.margem_minima || 15;
    const abaixoMargemMinima = margemCalculada < margemMinima;

    return c.json({
      success: true,
      data: {
        custo_total: custoTotal,
        preco_calculado: Math.round(precoCalculado * 100) / 100,
        margem_calculada: Math.round(margemCalculada * 100) / 100,
        margem_minima: margemMinima,
        abaixo_margem_minima: abaixoMargemMinima
      }
    });
  } catch (error: any) {
    console.error('Erro ao calcular preco:', error);
    return c.json({ success: false, error: 'Erro ao calcular preco' }, 500);
  }
});

// POST /precificacao/aplicar - Aplicar preco calculado ao produto
precificacao.post('/aplicar', async (c) => {
  try {
    const body = await c.req.json<{
      produto_id: string;
      preco_novo: number;
      tabela_preco_id?: string;
      motivo?: string;
      usuario_id?: string;
      usuario_nome?: string;
      empresa_id: string;
    }>();

    if (!body.produto_id || body.preco_novo === undefined) {
      return c.json({ success: false, error: 'Produto e preco sao obrigatorios' }, 400);
    }

    const produto = await c.env.DB.prepare(`
      SELECT id, preco_venda FROM produtos WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL
    `).bind(body.produto_id, body.empresa_id).first<any>();

    if (!produto) {
      return c.json({ success: false, error: 'Produto nao encontrado' }, 404);
    }

    const now = new Date().toISOString();
    const precoAnterior = produto.preco_venda;

    const custo = await c.env.DB.prepare(`
      SELECT custo_total FROM custos_produtos WHERE empresa_id = ? AND produto_id = ?
    `).bind(body.empresa_id, body.produto_id).first<{ custo_total: number }>();

    const custoTotal = custo?.custo_total || 0;
    const margemNaData = body.preco_novo > 0 ? (body.preco_novo - custoTotal) / body.preco_novo * 100 : 0;

    if (body.tabela_preco_id) {
      const existing = await c.env.DB.prepare(`
        SELECT id FROM tabelas_preco_produtos WHERE tabela_preco_id = ? AND produto_id = ?
      `).bind(body.tabela_preco_id, body.produto_id).first();

      if (existing) {
        await c.env.DB.prepare(`
          UPDATE tabelas_preco_produtos SET preco_venda = ?, updated_at = ?
          WHERE tabela_preco_id = ? AND produto_id = ?
        `).bind(body.preco_novo, now, body.tabela_preco_id, body.produto_id).run();
      } else {
        await c.env.DB.prepare(`
          INSERT INTO tabelas_preco_produtos (id, tabela_preco_id, produto_id, preco_venda, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), body.tabela_preco_id, body.produto_id, body.preco_novo, now, now).run();
      }
    } else {
      await c.env.DB.prepare(`
        UPDATE produtos SET preco_venda = ?, updated_at = ? WHERE id = ?
      `).bind(body.preco_novo, now, body.produto_id).run();
    }

    await c.env.DB.prepare(`
      INSERT INTO historico_precos (
        id, empresa_id, produto_id, tabela_preco_id, preco_anterior, preco_novo,
        custo_na_data, margem_na_data, motivo, usuario_id, usuario_nome, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), body.empresa_id, body.produto_id,
      body.tabela_preco_id || null, precoAnterior, body.preco_novo,
      custoTotal, margemNaData, body.motivo || null,
      body.usuario_id || null, body.usuario_nome || null, now
    ).run();

    return c.json({ success: true, message: 'Preco aplicado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao aplicar preco:', error);
    return c.json({ success: false, error: 'Erro ao aplicar preco' }, 500);
  }
});

// =============================================
// SIMULACOES DE PRECO
// =============================================

// GET /precificacao/simulacoes - Listar simulacoes
precificacao.get('/simulacoes', async (c) => {
  const { empresa_id, status } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND empresa_id = ?';
      params.push(empresa_id);
    }

    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }

    const result = await c.env.DB.prepare(`
      SELECT * FROM simulacoes_preco ${where} ORDER BY created_at DESC
    `).bind(...params).all();

    return c.json({ success: true, data: result.results });
  } catch (error: any) {
    console.error('Erro ao listar simulacoes:', error);
    return c.json({ success: false, error: 'Erro ao listar simulacoes' }, 500);
  }
});

// GET /precificacao/simulacoes/:id - Buscar simulacao por ID
precificacao.get('/simulacoes/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const simulacao = await c.env.DB.prepare(`
      SELECT * FROM simulacoes_preco WHERE id = ?
    `).bind(id).first();

    if (!simulacao) {
      return c.json({ success: false, error: 'Simulacao nao encontrada' }, 404);
    }

    const itens = await c.env.DB.prepare(`
      SELECT * FROM simulacoes_preco_itens WHERE simulacao_id = ?
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...simulacao,
        itens: itens.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar simulacao:', error);
    return c.json({ success: false, error: 'Erro ao buscar simulacao' }, 500);
  }
});

// POST /precificacao/simulacoes - Criar simulacao de precificacao
precificacao.post('/simulacoes', async (c) => {
  try {
    const body = await c.req.json<{
      nome: string;
      descricao?: string;
      metodo: 'markup' | 'margem' | 'mercado' | 'ajuste_percentual';
      valor_ajuste: number;
      produto_ids?: string[];
      categoria_id?: string;
      usuario_id?: string;
      usuario_nome?: string;
      empresa_id: string;
    }>();

    if (!body.nome || !body.metodo || body.valor_ajuste === undefined) {
      return c.json({ success: false, error: 'Nome, metodo e valor de ajuste sao obrigatorios' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    let produtosQuery = `
      SELECT p.id, p.codigo, p.nome, p.preco_venda, c.custo_total
      FROM produtos p
      LEFT JOIN custos_produtos c ON c.produto_id = p.id AND c.empresa_id = p.empresa_id
      WHERE p.empresa_id = ? AND p.deleted_at IS NULL
    `;
    const params: any[] = [body.empresa_id];

    if (body.produto_ids && body.produto_ids.length > 0) {
      produtosQuery += ` AND p.id IN (${body.produto_ids.map(() => '?').join(',')})`;
      params.push(...body.produto_ids);
    }

    if (body.categoria_id) {
      produtosQuery += ' AND p.categoria_id = ?';
      params.push(body.categoria_id);
    }

    const produtos = await c.env.DB.prepare(produtosQuery).bind(...params).all();

    await c.env.DB.prepare(`
      INSERT INTO simulacoes_preco (
        id, empresa_id, nome, descricao, status, metodo, valor_ajuste,
        qtd_produtos, usuario_id, usuario_nome, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'rascunho', ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.empresa_id, body.nome, body.descricao || null,
      body.metodo, body.valor_ajuste, produtos.results.length,
      body.usuario_id || null, body.usuario_nome || null, now, now
    ).run();

    for (const prod of produtos.results as any[]) {
      const custoTotal = prod.custo_total || 0;
      const precoAtual = prod.preco_venda || 0;
      const margemAtual = precoAtual > 0 && custoTotal > 0 
        ? (precoAtual - custoTotal) / precoAtual * 100 
        : 0;

      let precoCalculado = 0;
      switch (body.metodo) {
        case 'markup':
          precoCalculado = custoTotal * (1 + body.valor_ajuste / 100);
          break;
        case 'margem':
          precoCalculado = custoTotal > 0 ? custoTotal / (1 - body.valor_ajuste / 100) : 0;
          break;
        case 'ajuste_percentual':
          precoCalculado = precoAtual * (1 + body.valor_ajuste / 100);
          break;
        default:
          precoCalculado = precoAtual;
      }

      const margemCalculada = precoCalculado > 0 && custoTotal > 0
        ? (precoCalculado - custoTotal) / precoCalculado * 100
        : 0;

      await c.env.DB.prepare(`
        INSERT INTO simulacoes_preco_itens (
          id, simulacao_id, produto_id, produto_codigo, produto_nome,
          custo_atual, preco_atual, margem_atual,
          preco_calculado, margem_calculada, preco_final, margem_final,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, prod.id, prod.codigo, prod.nome,
        custoTotal, precoAtual, margemAtual,
        Math.round(precoCalculado * 100) / 100, Math.round(margemCalculada * 100) / 100,
        Math.round(precoCalculado * 100) / 100, Math.round(margemCalculada * 100) / 100,
        now, now
      ).run();
    }

    return c.json({ 
      success: true, 
      data: { id, qtd_produtos: produtos.results.length },
      message: 'Simulacao criada com sucesso' 
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar simulacao:', error);
    return c.json({ success: false, error: 'Erro ao criar simulacao' }, 500);
  }
});

// POST /precificacao/simulacoes/:id/aprovar - Aprovar simulacao
precificacao.post('/simulacoes/:id/aprovar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const simulacao = await c.env.DB.prepare(`
      SELECT * FROM simulacoes_preco WHERE id = ?
    `).bind(id).first<any>();

    if (!simulacao) {
      return c.json({ success: false, error: 'Simulacao nao encontrada' }, 404);
    }

    if (simulacao.status !== 'rascunho' && simulacao.status !== 'em_analise') {
      return c.json({ success: false, error: 'Simulacao nao pode ser aprovada' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE simulacoes_preco SET
        status = 'aprovada',
        aprovador_id = ?,
        aprovador_nome = ?,
        data_aprovacao = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(body.usuario_id || null, body.usuario_nome || null, now, now, id).run();

    return c.json({ success: true, message: 'Simulacao aprovada' });
  } catch (error: any) {
    console.error('Erro ao aprovar simulacao:', error);
    return c.json({ success: false, error: 'Erro ao aprovar simulacao' }, 500);
  }
});

// POST /precificacao/simulacoes/:id/aplicar - Aplicar simulacao aos produtos
precificacao.post('/simulacoes/:id/aplicar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      tabela_preco_id?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const simulacao = await c.env.DB.prepare(`
      SELECT * FROM simulacoes_preco WHERE id = ?
    `).bind(id).first<any>();

    if (!simulacao) {
      return c.json({ success: false, error: 'Simulacao nao encontrada' }, 404);
    }

    if (simulacao.status !== 'aprovada') {
      return c.json({ success: false, error: 'Simulacao precisa estar aprovada' }, 400);
    }

    const itens = await c.env.DB.prepare(`
      SELECT * FROM simulacoes_preco_itens WHERE simulacao_id = ?
    `).bind(id).all();

    const now = new Date().toISOString();

    for (const item of itens.results as any[]) {
      const produto = await c.env.DB.prepare(`
        SELECT preco_venda FROM produtos WHERE id = ?
      `).bind(item.produto_id).first<any>();

      if (body.tabela_preco_id) {
        const existing = await c.env.DB.prepare(`
          SELECT id FROM tabelas_preco_produtos WHERE tabela_preco_id = ? AND produto_id = ?
        `).bind(body.tabela_preco_id, item.produto_id).first();

        if (existing) {
          await c.env.DB.prepare(`
            UPDATE tabelas_preco_produtos SET preco_venda = ?, updated_at = ?
            WHERE tabela_preco_id = ? AND produto_id = ?
          `).bind(item.preco_final, now, body.tabela_preco_id, item.produto_id).run();
        } else {
          await c.env.DB.prepare(`
            INSERT INTO tabelas_preco_produtos (id, tabela_preco_id, produto_id, preco_venda, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(crypto.randomUUID(), body.tabela_preco_id, item.produto_id, item.preco_final, now, now).run();
        }
      } else {
        await c.env.DB.prepare(`
          UPDATE produtos SET preco_venda = ?, updated_at = ? WHERE id = ?
        `).bind(item.preco_final, now, item.produto_id).run();
      }

      await c.env.DB.prepare(`
        INSERT INTO historico_precos (
          id, empresa_id, produto_id, tabela_preco_id, preco_anterior, preco_novo,
          custo_na_data, margem_na_data, motivo, usuario_id, usuario_nome, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), simulacao.empresa_id, item.produto_id,
        body.tabela_preco_id || null, produto?.preco_venda || 0, item.preco_final,
        item.custo_atual, item.margem_final, `Simulacao: ${simulacao.nome}`,
        body.usuario_id || null, body.usuario_nome || null, now
      ).run();
    }

    await c.env.DB.prepare(`
      UPDATE simulacoes_preco SET status = 'aplicada', data_aplicacao = ?, updated_at = ? WHERE id = ?
    `).bind(now, now, id).run();

    return c.json({ 
      success: true, 
      message: `Precos aplicados a ${itens.results.length} produtos` 
    });
  } catch (error: any) {
    console.error('Erro ao aplicar simulacao:', error);
    return c.json({ success: false, error: 'Erro ao aplicar simulacao' }, 500);
  }
});

// =============================================
// CONFIGURACOES
// =============================================

// GET /precificacao/config - Buscar configuracoes
precificacao.get('/config', async (c) => {
  const { empresa_id } = c.req.query();

  try {
    if (!empresa_id) {
      return c.json({ success: false, error: 'empresa_id e obrigatorio' }, 400);
    }

    let config = await c.env.DB.prepare(`
      SELECT * FROM config_precificacao WHERE empresa_id = ?
    `).bind(empresa_id).first();

    if (!config) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await c.env.DB.prepare(`
        INSERT INTO config_precificacao (id, empresa_id, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).bind(id, empresa_id, now, now).run();

      config = await c.env.DB.prepare(`
        SELECT * FROM config_precificacao WHERE empresa_id = ?
      `).bind(empresa_id).first();
    }

    return c.json({ success: true, data: config });
  } catch (error: any) {
    console.error('Erro ao buscar config:', error);
    return c.json({ success: false, error: 'Erro ao buscar config' }, 500);
  }
});

// PUT /precificacao/config - Atualizar configuracoes
precificacao.put('/config', async (c) => {
  try {
    const body = await c.req.json<{
      metodo_padrao?: string;
      markup_padrao?: number;
      margem_minima?: number;
      incluir_frete_custo?: boolean;
      incluir_impostos_custo?: boolean;
      rateio_aluguel_percentual?: number;
      rateio_salarios_percentual?: number;
      rateio_energia_percentual?: number;
      rateio_marketing_percentual?: number;
      alerta_margem_minima?: boolean;
      bloquear_abaixo_margem?: boolean;
      arredondar_preco?: boolean;
      casas_decimais?: number;
      empresa_id: string;
    }>();

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE config_precificacao SET
        metodo_padrao = COALESCE(?, metodo_padrao),
        markup_padrao = COALESCE(?, markup_padrao),
        margem_minima = COALESCE(?, margem_minima),
        incluir_frete_custo = COALESCE(?, incluir_frete_custo),
        incluir_impostos_custo = COALESCE(?, incluir_impostos_custo),
        rateio_aluguel_percentual = COALESCE(?, rateio_aluguel_percentual),
        rateio_salarios_percentual = COALESCE(?, rateio_salarios_percentual),
        rateio_energia_percentual = COALESCE(?, rateio_energia_percentual),
        rateio_marketing_percentual = COALESCE(?, rateio_marketing_percentual),
        alerta_margem_minima = COALESCE(?, alerta_margem_minima),
        bloquear_abaixo_margem = COALESCE(?, bloquear_abaixo_margem),
        arredondar_preco = COALESCE(?, arredondar_preco),
        casas_decimais = COALESCE(?, casas_decimais),
        updated_at = ?
      WHERE empresa_id = ?
    `).bind(
      body.metodo_padrao || null, body.markup_padrao ?? null, body.margem_minima ?? null,
      body.incluir_frete_custo !== undefined ? (body.incluir_frete_custo ? 1 : 0) : null,
      body.incluir_impostos_custo !== undefined ? (body.incluir_impostos_custo ? 1 : 0) : null,
      body.rateio_aluguel_percentual ?? null, body.rateio_salarios_percentual ?? null,
      body.rateio_energia_percentual ?? null, body.rateio_marketing_percentual ?? null,
      body.alerta_margem_minima !== undefined ? (body.alerta_margem_minima ? 1 : 0) : null,
      body.bloquear_abaixo_margem !== undefined ? (body.bloquear_abaixo_margem ? 1 : 0) : null,
      body.arredondar_preco !== undefined ? (body.arredondar_preco ? 1 : 0) : null,
      body.casas_decimais ?? null, now, body.empresa_id
    ).run();

    return c.json({ success: true, message: 'Configuracoes atualizadas' });
  } catch (error: any) {
    console.error('Erro ao atualizar config:', error);
    return c.json({ success: false, error: 'Erro ao atualizar config' }, 500);
  }
});

// =============================================
// HISTORICO E DASHBOARD
// =============================================

// GET /precificacao/historico - Historico de alteracoes de preco
precificacao.get('/historico', async (c) => {
  const { empresa_id, produto_id, limit = '50' } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND h.empresa_id = ?';
      params.push(empresa_id);
    }

    if (produto_id) {
      where += ' AND h.produto_id = ?';
      params.push(produto_id);
    }

    const result = await c.env.DB.prepare(`
      SELECT h.*, p.codigo as produto_codigo, p.nome as produto_nome,
             t.nome as tabela_nome
      FROM historico_precos h
      JOIN produtos p ON p.id = h.produto_id
      LEFT JOIN tabelas_preco t ON t.id = h.tabela_preco_id
      ${where}
      ORDER BY h.created_at DESC
      LIMIT ?
    `).bind(...params, parseInt(limit)).all();

    return c.json({ success: true, data: result.results });
  } catch (error: any) {
    console.error('Erro ao buscar historico:', error);
    return c.json({ success: false, error: 'Erro ao buscar historico' }, 500);
  }
});

// GET /precificacao/dashboard/resumo - Dashboard de precificacao
precificacao.get('/dashboard/resumo', async (c) => {
  const { empresa_id } = c.req.query();

  try {
    if (!empresa_id) {
      return c.json({ success: false, error: 'empresa_id e obrigatorio' }, 400);
    }

    const totalProdutos = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM produtos WHERE empresa_id = ? AND deleted_at IS NULL
    `).bind(empresa_id).first<{ total: number }>();

    const produtosComCusto = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM custos_produtos WHERE empresa_id = ?
    `).bind(empresa_id).first<{ total: number }>();

    const produtosMargemBaixa = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM vw_produtos_margem_baixa WHERE empresa_id = ?
    `).bind(empresa_id).first<{ total: number }>();

    const tabelasAtivas = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM tabelas_preco WHERE empresa_id = ? AND ativo = 1 AND deleted_at IS NULL
    `).bind(empresa_id).first<{ total: number }>();

    const alteracoesHoje = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM historico_precos 
      WHERE empresa_id = ? AND date(created_at) = date('now')
    `).bind(empresa_id).first<{ total: number }>();

    const simulacoesPendentes = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM simulacoes_preco 
      WHERE empresa_id = ? AND status IN ('rascunho', 'em_analise', 'aprovada')
    `).bind(empresa_id).first<{ total: number }>();

    return c.json({
      success: true,
      data: {
        total_produtos: totalProdutos?.total || 0,
        produtos_com_custo: produtosComCusto?.total || 0,
        produtos_margem_baixa: produtosMargemBaixa?.total || 0,
        tabelas_ativas: tabelasAtivas?.total || 0,
        alteracoes_hoje: alteracoesHoje?.total || 0,
        simulacoes_pendentes: simulacoesPendentes?.total || 0
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar dashboard:', error);
    return c.json({ success: false, error: 'Erro ao buscar dashboard' }, 500);
  }
});

export default precificacao;
