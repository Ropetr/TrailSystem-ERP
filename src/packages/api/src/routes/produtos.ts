// =============================================
// PLANAC ERP - Rotas de Produtos
// Migrado de src/api/ para src/packages/api/
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const produtos = new Hono<{ Bindings: Env }>();

// =============================================
// GET /produtos - Listar produtos
// =============================================
produtos.get('/', async (c) => {
  const { page = '1', limit = '20', busca, categoria_id, ativo, estoque_baixo, empresa_id } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND p.empresa_id = ?';
      params.push(empresa_id);
    }

    if (busca) {
      where += ' AND (p.codigo LIKE ? OR p.nome LIKE ? OR p.codigo_barras LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }

    if (categoria_id) {
      where += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    if (ativo !== undefined && ativo !== '') {
      where += ' AND p.ativo = ?';
      params.push(ativo === 'true' ? 1 : 0);
    }

    if (estoque_baixo === 'true') {
      where += ' AND p.estoque_atual <= p.estoque_minimo';
    }

    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM produtos p ${where}`
    ).bind(...params).first<{ total: number }>();

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await c.env.DB.prepare(`
      SELECT 
        p.id, p.codigo, p.codigo_barras, p.nome, p.descricao,
        p.categoria_id, p.marca, p.modelo, p.unidade_medida_id,
        p.ncm, p.origem, p.preco_custo, p.preco_venda, p.margem_lucro,
        p.estoque_atual, p.estoque_minimo, p.estoque_maximo,
        p.ativo, p.disponivel_ecommerce, p.created_at,
        c.nome as categoria_nome,
        um.sigla as unidade_sigla
      FROM produtos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      LEFT JOIN unidades_medida um ON um.id = p.unidade_medida_id
      ${where}
      ORDER BY p.nome
      LIMIT ? OFFSET ?
    `).bind(...params, parseInt(limit), offset).all();

    return c.json({
      success: true,
      data: result.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / parseInt(limit))
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar produtos:', error);
    return c.json({ success: false, error: 'Erro ao listar produtos' }, 500);
  }
});

// =============================================
// GET /produtos/:id - Buscar produto
// =============================================
produtos.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const produto = await c.env.DB.prepare(`
      SELECT 
        p.*,
        c.nome as categoria_nome,
        um.nome as unidade_nome, um.sigla as unidade_sigla
      FROM produtos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      LEFT JOIN unidades_medida um ON um.id = p.unidade_medida_id
      WHERE p.id = ?
    `).bind(id).first();

    if (!produto) {
      return c.json({ success: false, error: 'Produto nao encontrado' }, 404);
    }

    // Buscar saldos por local de estoque
    const saldos = await c.env.DB.prepare(`
      SELECT le.nome as local, pe.saldo
      FROM produtos_estoque pe
      JOIN locais_estoque le ON le.id = pe.local_estoque_id
      WHERE pe.produto_id = ?
    `).bind(id).all();

    // Buscar imagens
    const imagens = await c.env.DB.prepare(`
      SELECT id, url, principal, ordem FROM produtos_imagens WHERE produto_id = ? ORDER BY ordem
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...produto,
        saldos: saldos.results,
        imagens: imagens.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar produto:', error);
    return c.json({ success: false, error: 'Erro ao buscar produto' }, 500);
  }
});

// =============================================
// POST /produtos - Criar produto
// =============================================
produtos.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      codigo: string;
      codigo_barras?: string;
      nome: string;
      descricao?: string;
      categoria_id?: string;
      marca?: string;
      modelo?: string;
      unidade_medida_id: string;
      peso_liquido?: number;
      peso_bruto?: number;
      largura?: number;
      altura?: number;
      profundidade?: number;
      ncm?: string;
      cest?: string;
      origem?: number;
      cfop_venda?: string;
      cst_icms?: string;
      aliquota_icms?: number;
      aliquota_pis?: number;
      aliquota_cofins?: number;
      aliquota_ipi?: number;
      preco_custo?: number;
      margem_lucro?: number;
      preco_venda?: number;
      estoque_minimo?: number;
      estoque_maximo?: number;
      ponto_pedido?: number;
      disponivel_ecommerce?: boolean;
      destaque?: boolean;
      empresa_id?: string;
    }>();

    // Validacoes
    if (!body.codigo) {
      return c.json({ success: false, error: 'Codigo e obrigatorio' }, 400);
    }
    if (!body.nome || body.nome.length < 2) {
      return c.json({ success: false, error: 'Nome deve ter no minimo 2 caracteres' }, 400);
    }

    const empresaId = body.empresa_id || 'empresa_planac_001';

    // Verificar codigo unico
    const codigoExiste = await c.env.DB.prepare(`
      SELECT id FROM produtos WHERE codigo = ? AND empresa_id = ?
    `).bind(body.codigo, empresaId).first();

    if (codigoExiste) {
      return c.json({ success: false, error: 'Codigo ja existe' }, 400);
    }

    // Verificar codigo de barras unico
    if (body.codigo_barras) {
      const codigoBarrasExiste = await c.env.DB.prepare(`
        SELECT id FROM produtos WHERE codigo_barras = ? AND empresa_id = ?
      `).bind(body.codigo_barras, empresaId).first();

      if (codigoBarrasExiste) {
        return c.json({ success: false, error: 'Codigo de barras ja existe' }, 400);
      }
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO produtos (
        id, empresa_id, codigo, codigo_barras, nome, descricao,
        categoria_id, marca, modelo, unidade_medida_id,
        peso_liquido, peso_bruto, largura, altura, profundidade,
        ncm, cest, origem, cfop_venda, cst_icms,
        aliquota_icms, aliquota_pis, aliquota_cofins, aliquota_ipi,
        preco_custo, margem_lucro, preco_venda,
        estoque_minimo, estoque_maximo, ponto_pedido, estoque_atual,
        disponivel_ecommerce, destaque, ativo, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, 0,
        ?, ?, 1, ?, ?
      )
    `).bind(
      id, empresaId, body.codigo, body.codigo_barras || null, body.nome, body.descricao || null,
      body.categoria_id || null, body.marca || null, body.modelo || null, body.unidade_medida_id || null,
      body.peso_liquido || null, body.peso_bruto || null, body.largura || null, body.altura || null, body.profundidade || null,
      body.ncm || null, body.cest || null, body.origem || 0, body.cfop_venda || null, body.cst_icms || null,
      body.aliquota_icms || null, body.aliquota_pis || null, body.aliquota_cofins || null, body.aliquota_ipi || null,
      body.preco_custo || 0, body.margem_lucro || 0, body.preco_venda || 0,
      body.estoque_minimo || 0, body.estoque_maximo || 0, body.ponto_pedido || 0,
      body.disponivel_ecommerce ? 1 : 0, body.destaque ? 1 : 0, now, now
    ).run();

    return c.json({
      success: true,
      data: { id, codigo: body.codigo },
      message: 'Produto criado com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar produto:', error);
    return c.json({ success: false, error: 'Erro ao criar produto' }, 500);
  }
});

// =============================================
// PUT /produtos/:id - Editar produto
// =============================================
produtos.put('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      nome?: string;
      descricao?: string;
      categoria_id?: string;
      marca?: string;
      modelo?: string;
      ncm?: string;
      origem?: number;
      preco_custo?: number;
      margem_lucro?: number;
      preco_venda?: number;
      estoque_minimo?: number;
      estoque_maximo?: number;
      disponivel_ecommerce?: boolean;
      destaque?: boolean;
      ativo?: boolean;
    }>();

    const produto = await c.env.DB.prepare(`
      SELECT * FROM produtos WHERE id = ?
    `).bind(id).first();

    if (!produto) {
      return c.json({ success: false, error: 'Produto nao encontrado' }, 404);
    }

    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [new Date().toISOString()];

    if (body.nome !== undefined) { updates.push('nome = ?'); params.push(body.nome); }
    if (body.descricao !== undefined) { updates.push('descricao = ?'); params.push(body.descricao); }
    if (body.categoria_id !== undefined) { updates.push('categoria_id = ?'); params.push(body.categoria_id); }
    if (body.marca !== undefined) { updates.push('marca = ?'); params.push(body.marca); }
    if (body.modelo !== undefined) { updates.push('modelo = ?'); params.push(body.modelo); }
    if (body.ncm !== undefined) { updates.push('ncm = ?'); params.push(body.ncm); }
    if (body.origem !== undefined) { updates.push('origem = ?'); params.push(body.origem); }
    if (body.preco_custo !== undefined) { updates.push('preco_custo = ?'); params.push(body.preco_custo); }
    if (body.margem_lucro !== undefined) { updates.push('margem_lucro = ?'); params.push(body.margem_lucro); }
    if (body.preco_venda !== undefined) { updates.push('preco_venda = ?'); params.push(body.preco_venda); }
    if (body.estoque_minimo !== undefined) { updates.push('estoque_minimo = ?'); params.push(body.estoque_minimo); }
    if (body.estoque_maximo !== undefined) { updates.push('estoque_maximo = ?'); params.push(body.estoque_maximo); }
    if (body.disponivel_ecommerce !== undefined) { updates.push('disponivel_ecommerce = ?'); params.push(body.disponivel_ecommerce ? 1 : 0); }
    if (body.destaque !== undefined) { updates.push('destaque = ?'); params.push(body.destaque ? 1 : 0); }
    if (body.ativo !== undefined) { updates.push('ativo = ?'); params.push(body.ativo ? 1 : 0); }

    params.push(id);

    await c.env.DB.prepare(`
      UPDATE produtos SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return c.json({ success: true, message: 'Produto atualizado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao editar produto:', error);
    return c.json({ success: false, error: 'Erro ao editar produto' }, 500);
  }
});

// =============================================
// DELETE /produtos/:id - Desativar produto
// =============================================
produtos.delete('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const produto = await c.env.DB.prepare(`
      SELECT nome, estoque_atual FROM produtos WHERE id = ?
    `).bind(id).first<{ nome: string; estoque_atual: number }>();

    if (!produto) {
      return c.json({ success: false, error: 'Produto nao encontrado' }, 404);
    }

    if (produto.estoque_atual > 0) {
      return c.json({ 
        success: false, 
        error: 'Nao e possivel desativar produto com estoque' 
      }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE produtos SET ativo = 0, updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Produto desativado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desativar produto:', error);
    return c.json({ success: false, error: 'Erro ao desativar produto' }, 500);
  }
});

// =============================================
// GET /produtos/:id/estoque - Saldo de estoque
// =============================================
produtos.get('/:id/estoque', async (c) => {
  const { id } = c.req.param();

  try {
    const saldos = await c.env.DB.prepare(`
      SELECT 
        le.id as local_id, le.nome as local_nome,
        pe.saldo, pe.reservado, pe.disponivel
      FROM produtos_estoque pe
      JOIN locais_estoque le ON le.id = pe.local_estoque_id
      WHERE pe.produto_id = ?
    `).bind(id).all();

    const totalGeral = await c.env.DB.prepare(`
      SELECT 
        SUM(saldo) as total_saldo,
        SUM(reservado) as total_reservado,
        SUM(disponivel) as total_disponivel
      FROM produtos_estoque WHERE produto_id = ?
    `).bind(id).first();

    return c.json({
      success: true,
      data: {
        por_local: saldos.results,
        totais: totalGeral
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar estoque:', error);
    return c.json({ success: false, error: 'Erro ao buscar estoque' }, 500);
  }
});

// =============================================
// POST /produtos/:id/ajuste-estoque - Ajustar estoque
// =============================================
produtos.post('/:id/ajuste-estoque', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      local_estoque_id: string;
      quantidade: number;
      tipo: 'entrada' | 'saida' | 'ajuste';
      motivo: string;
    }>();

    // Buscar saldo atual
    const saldoAtual = await c.env.DB.prepare(`
      SELECT saldo FROM produtos_estoque 
      WHERE produto_id = ? AND local_estoque_id = ?
    `).bind(id, body.local_estoque_id).first<{ saldo: number }>();

    const saldo = saldoAtual?.saldo || 0;
    let novoSaldo: number;

    if (body.tipo === 'entrada') {
      novoSaldo = saldo + body.quantidade;
    } else if (body.tipo === 'saida') {
      novoSaldo = saldo - body.quantidade;
      if (novoSaldo < 0) {
        return c.json({ success: false, error: 'Saldo insuficiente' }, 400);
      }
    } else {
      novoSaldo = body.quantidade;
    }

    // Atualizar ou inserir saldo
    await c.env.DB.prepare(`
      INSERT INTO produtos_estoque (id, produto_id, local_estoque_id, saldo, disponivel, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(produto_id, local_estoque_id) 
      DO UPDATE SET saldo = ?, disponivel = ?, updated_at = datetime('now')
    `).bind(
      crypto.randomUUID(), id, body.local_estoque_id, novoSaldo, novoSaldo,
      novoSaldo, novoSaldo
    ).run();

    // Atualizar estoque total no produto
    const totalEstoque = await c.env.DB.prepare(`
      SELECT SUM(saldo) as total FROM produtos_estoque WHERE produto_id = ?
    `).bind(id).first<{ total: number }>();

    await c.env.DB.prepare(`
      UPDATE produtos SET estoque_atual = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(totalEstoque?.total || 0, id).run();

    // Registrar movimentacao
    await c.env.DB.prepare(`
      INSERT INTO movimentacoes_estoque (
        id, empresa_id, produto_id, local_estoque_id, tipo, quantidade,
        saldo_anterior, saldo_posterior, motivo, created_at
      ) VALUES (?, 'empresa_planac_001', ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      crypto.randomUUID(), id, body.local_estoque_id, body.tipo,
      body.quantidade, saldo, novoSaldo, body.motivo
    ).run();

    return c.json({ 
      success: true, 
      message: 'Estoque ajustado com sucesso',
      data: { saldo_anterior: saldo, saldo_atual: novoSaldo }
    });
  } catch (error: any) {
    console.error('Erro ao ajustar estoque:', error);
    return c.json({ success: false, error: 'Erro ao ajustar estoque' }, 500);
  }
});

// =============================================
// GET /produtos/estoque-baixo - Produtos com estoque baixo
// =============================================
produtos.get('/relatorio/estoque-baixo', async (c) => {
  const { empresa_id } = c.req.query();

  try {
    let where = 'WHERE p.estoque_atual <= p.estoque_minimo AND p.ativo = 1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND p.empresa_id = ?';
      params.push(empresa_id);
    }

    const result = await c.env.DB.prepare(`
      SELECT 
        p.id, p.codigo, p.nome, p.estoque_atual, p.estoque_minimo, p.ponto_pedido,
        (p.estoque_minimo - p.estoque_atual) as faltante
      FROM produtos p
      ${where}
      ORDER BY faltante DESC
    `).bind(...params).all();

    return c.json({
      success: true,
      data: result.results,
      total: result.results.length
    });
  } catch (error: any) {
    console.error('Erro ao buscar estoque baixo:', error);
    return c.json({ success: false, error: 'Erro ao buscar produtos com estoque baixo' }, 500);
  }
});

export default produtos;
