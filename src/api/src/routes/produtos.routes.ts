// =============================================
// PLANAC ERP - Rotas de Produtos
// =============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';
import {
  buscarPorGtin,
  buscarPorNcm,
  buscarEEnriquecer,
  vincularProduto,
  buscarVinculo,
  buscarProdutoPorGtin,
  obterConfig,
  salvarConfig,
  obterEstatisticas,
  validarGtin,
  extrairEnriquecimento,
  importarProdutoCosmos,
  type CosmosConfig,
} from '../services/cosmos';
import {
  consultarTributacaoPorNCM,
  consultarTributacaoProduto,
  listarAliquotasIPI,
  listarMVA,
  listarFCP,
} from '../services/tributacao';

const produtos = new Hono<{ Bindings: Bindings; Variables: Variables }>();

produtos.use('*', authMiddleware());

// Schemas
const criarProdutoSchema = z.object({
  codigo: z.string().min(1),
  codigo_barras: z.string().optional(),
  nome: z.string().min(2),
  descricao: z.string().optional(),
  categoria_id: z.string().uuid().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  unidade_medida_id: z.string().uuid(),
  peso_liquido: z.number().optional(),
  peso_bruto: z.number().optional(),
  largura: z.number().optional(),
  altura: z.number().optional(),
  profundidade: z.number().optional(),
  ncm: z.string().optional(),
  cest: z.string().optional(),
  origem: z.number().min(0).max(8).default(0),
  cfop_venda: z.string().optional(),
  cst_icms: z.string().optional(),
  aliquota_icms: z.number().optional(),
  aliquota_pis: z.number().optional(),
  aliquota_cofins: z.number().optional(),
  aliquota_ipi: z.number().optional(),
  preco_custo: z.number().min(0).default(0),
  margem_lucro: z.number().min(0).default(0),
  preco_venda: z.number().min(0).default(0),
  estoque_minimo: z.number().min(0).default(0),
  estoque_maximo: z.number().min(0).default(0),
  ponto_pedido: z.number().min(0).default(0),
  disponivel_ecommerce: z.boolean().default(false),
  destaque: z.boolean().default(false)
});

// GET /produtos - Listar
produtos.get('/', requirePermission('produtos', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { page = '1', limit = '20', busca, categoria_id, ativo, estoque_baixo } = c.req.query();
  
  let where = 'WHERE p.empresa_id = ?';
  const params: any[] = [user.empresa_id];
  
  if (busca) {
    where += ' AND (p.codigo LIKE ? OR p.nome LIKE ? OR p.codigo_barras LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
  }
  
  if (categoria_id) {
    where += ' AND p.categoria_id = ?';
    params.push(categoria_id);
  }
  
  if (ativo !== undefined) {
    where += ' AND p.ativo = ?';
    params.push(ativo === 'true' ? 1 : 0);
  }
  
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM produtos p ${where}`
  ).bind(...params).first<{ total: number }>();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  const data = await c.env.DB.prepare(`
    SELECT 
      p.*,
      c.nome as categoria_nome,
      um.sigla as unidade_sigla,
      COALESCE(e.quantidade, 0) as estoque_atual
    FROM produtos p
    LEFT JOIN categorias_produtos c ON p.categoria_id = c.id
    LEFT JOIN unidades_medida um ON p.unidade_medida_id = um.id
    LEFT JOIN (
      SELECT produto_id, SUM(quantidade) as quantidade 
      FROM estoque 
      WHERE empresa_id = ?
      GROUP BY produto_id
    ) e ON p.id = e.produto_id
    ${where}
    ${estoque_baixo === 'true' ? 'HAVING estoque_atual < p.estoque_minimo' : ''}
    ORDER BY p.nome
    LIMIT ? OFFSET ?
  `).bind(user.empresa_id, ...params, parseInt(limit), offset).all();
  
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

// GET /produtos/:id - Buscar por ID
produtos.get('/:id', requirePermission('produtos', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  
  const produto = await c.env.DB.prepare(`
    SELECT 
      p.*,
      c.nome as categoria_nome,
      um.sigla as unidade_sigla, um.descricao as unidade_nome
    FROM produtos p
    LEFT JOIN categorias_produtos c ON p.categoria_id = c.id
    LEFT JOIN unidades_medida um ON p.unidade_medida_id = um.id
    WHERE p.id = ? AND p.empresa_id = ?
  `).bind(id, user.empresa_id).first();
  
  if (!produto) {
    return c.json({ success: false, error: 'Produto não encontrado' }, 404);
  }
  
  // Buscar imagens
  const imagens = await c.env.DB.prepare(`
    SELECT * FROM produtos_imagens WHERE produto_id = ? ORDER BY ordem
  `).bind(id).all();
  
  // Buscar fornecedores
  const fornecedores = await c.env.DB.prepare(`
    SELECT pf.*, f.razao_social, f.nome_fantasia
    FROM produtos_fornecedores pf
    JOIN fornecedores f ON pf.fornecedor_id = f.id
    WHERE pf.produto_id = ?
  `).bind(id).all();
  
  // Buscar estoque por local
  const estoque = await c.env.DB.prepare(`
    SELECT e.*, le.nome as local_nome, f.nome as filial_nome
    FROM estoque e
    JOIN locais_estoque le ON e.local_id = le.id
    JOIN filiais f ON e.filial_id = f.id
    WHERE e.produto_id = ? AND e.empresa_id = ?
  `).bind(id, user.empresa_id).all();
  
  return c.json({
    success: true,
    data: {
      ...produto,
      imagens: imagens.results,
      fornecedores: fornecedores.results,
      estoque: estoque.results
    }
  });
});

// POST /produtos - Criar
produtos.post('/', requirePermission('produtos', 'criar'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const validacao = criarProdutoSchema.safeParse(body);
  if (!validacao.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validacao.error.errors }, 400);
  }
  
  const dados = validacao.data;
  
  // Verifica código único
  const codigoExiste = await c.env.DB.prepare(
    'SELECT id FROM produtos WHERE codigo = ? AND empresa_id = ?'
  ).bind(dados.codigo, user.empresa_id).first();
  
  if (codigoExiste) {
    return c.json({ success: false, error: 'Código já cadastrado' }, 400);
  }
  
  const id = crypto.randomUUID();
  const slug = dados.nome.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  await c.env.DB.prepare(`
    INSERT INTO produtos (
      id, empresa_id, codigo, codigo_barras, nome, descricao, slug,
      categoria_id, marca, modelo, unidade_medida_id,
      peso_liquido, peso_bruto, largura, altura, profundidade,
      ncm, cest, origem, cfop_venda, cst_icms,
      aliquota_icms, aliquota_pis, aliquota_cofins, aliquota_ipi,
      preco_custo, preco_custo_medio, margem_lucro, preco_venda,
      estoque_minimo, estoque_maximo, ponto_pedido,
      disponivel_ecommerce, destaque, ativo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(
    id, user.empresa_id, dados.codigo, dados.codigo_barras || null,
    dados.nome, dados.descricao || null, slug,
    dados.categoria_id || null, dados.marca || null, dados.modelo || null,
    dados.unidade_medida_id,
    dados.peso_liquido || null, dados.peso_bruto || null,
    dados.largura || null, dados.altura || null, dados.profundidade || null,
    dados.ncm || null, dados.cest || null, dados.origem,
    dados.cfop_venda || null, dados.cst_icms || null,
    dados.aliquota_icms || null, dados.aliquota_pis || null,
    dados.aliquota_cofins || null, dados.aliquota_ipi || null,
    dados.preco_custo, dados.preco_custo, dados.margem_lucro, dados.preco_venda,
    dados.estoque_minimo, dados.estoque_maximo, dados.ponto_pedido,
    dados.disponivel_ecommerce ? 1 : 0, dados.destaque ? 1 : 0,
    new Date().toISOString(), new Date().toISOString()
  ).run();
  
  await registrarAuditoria(c.env.DB, {
    empresa_id: user.empresa_id,
    usuario_id: user.id,
    acao: 'criar',
    tabela: 'produtos',
    registro_id: id,
    dados_novos: { codigo: dados.codigo, nome: dados.nome }
  });
  
  return c.json({ success: true, data: { id }, message: 'Produto criado com sucesso' }, 201);
});

// PUT /produtos/:id - Editar
produtos.put('/:id', requirePermission('produtos', 'editar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const produtoExiste = await c.env.DB.prepare(
    'SELECT id FROM produtos WHERE id = ? AND empresa_id = ?'
  ).bind(id, user.empresa_id).first();
  
  if (!produtoExiste) {
    return c.json({ success: false, error: 'Produto não encontrado' }, 404);
  }
  
  // Verifica código único se alterado
  if (body.codigo) {
    const codigoExiste = await c.env.DB.prepare(
      'SELECT id FROM produtos WHERE codigo = ? AND empresa_id = ? AND id != ?'
    ).bind(body.codigo, user.empresa_id, id).first();
    
    if (codigoExiste) {
      return c.json({ success: false, error: 'Código já cadastrado por outro produto' }, 400);
    }
  }
  
  const updates: string[] = ['updated_at = ?'];
  const params: any[] = [new Date().toISOString()];
  
  const campos = [
    'codigo', 'codigo_barras', 'nome', 'descricao', 'categoria_id', 'marca', 'modelo',
    'unidade_medida_id', 'peso_liquido', 'peso_bruto', 'largura', 'altura', 'profundidade',
    'ncm', 'cest', 'origem', 'cfop_venda', 'cst_icms', 'aliquota_icms', 'aliquota_pis',
    'aliquota_cofins', 'aliquota_ipi', 'preco_custo', 'margem_lucro', 'preco_venda',
    'estoque_minimo', 'estoque_maximo', 'ponto_pedido', 'ativo'
  ];
  
  for (const campo of campos) {
    if (body[campo] !== undefined) {
      updates.push(`${campo} = ?`);
      params.push(body[campo]);
    }
  }
  
  if (body.disponivel_ecommerce !== undefined) {
    updates.push('disponivel_ecommerce = ?');
    params.push(body.disponivel_ecommerce ? 1 : 0);
  }
  
  if (body.destaque !== undefined) {
    updates.push('destaque = ?');
    params.push(body.destaque ? 1 : 0);
  }
  
  // Atualiza slug se nome mudou
  if (body.nome) {
    const slug = body.nome.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    updates.push('slug = ?');
    params.push(slug);
  }
  
  params.push(id);
  
  await c.env.DB.prepare(`
    UPDATE produtos SET ${updates.join(', ')} WHERE id = ?
  `).bind(...params).run();
  
  await registrarAuditoria(c.env.DB, {
    empresa_id: user.empresa_id,
    usuario_id: user.id,
    acao: 'editar',
    tabela: 'produtos',
    registro_id: id,
    dados_novos: body
  });
  
  return c.json({ success: true, message: 'Produto atualizado com sucesso' });
});

// DELETE /produtos/:id - Desativar
produtos.delete('/:id', requirePermission('produtos', 'excluir'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  
  const produto = await c.env.DB.prepare(
    'SELECT id FROM produtos WHERE id = ? AND empresa_id = ?'
  ).bind(id, user.empresa_id).first();
  
  if (!produto) {
    return c.json({ success: false, error: 'Produto não encontrado' }, 404);
  }
  
  // Verifica estoque
  const temEstoque = await c.env.DB.prepare(
    'SELECT SUM(quantidade) as total FROM estoque WHERE produto_id = ? AND empresa_id = ?'
  ).bind(id, user.empresa_id).first<{ total: number }>();
  
  if (temEstoque && temEstoque.total > 0) {
    return c.json({ success: false, error: 'Produto possui estoque. Zere o estoque antes de desativar.' }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE produtos SET ativo = 0, updated_at = ? WHERE id = ?
  `).bind(new Date().toISOString(), id).run();
  
  await registrarAuditoria(c.env.DB, {
    empresa_id: user.empresa_id,
    usuario_id: user.id,
    acao: 'excluir',
    tabela: 'produtos',
    registro_id: id
  });
  
  return c.json({ success: true, message: 'Produto desativado com sucesso' });
});

// POST /produtos/:id/fornecedores - Vincular fornecedor
produtos.post('/:id/fornecedores', requirePermission('produtos', 'editar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const vinculoId = crypto.randomUUID();
  
  // Upsert - atualiza se já existe
  await c.env.DB.prepare(`
    INSERT INTO produtos_fornecedores (
      id, produto_id, fornecedor_id, codigo_fornecedor, preco_custo,
      prazo_entrega, quantidade_minima, principal, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(produto_id, fornecedor_id) DO UPDATE SET
      codigo_fornecedor = excluded.codigo_fornecedor,
      preco_custo = excluded.preco_custo,
      prazo_entrega = excluded.prazo_entrega,
      quantidade_minima = excluded.quantidade_minima,
      principal = excluded.principal,
      updated_at = excluded.updated_at
  `).bind(
    vinculoId, id, body.fornecedor_id, body.codigo_fornecedor || null,
    body.preco_custo || 0, body.prazo_entrega || null,
    body.quantidade_minima || 1, body.principal ? 1 : 0,
    new Date().toISOString(), new Date().toISOString()
  ).run();
  
  return c.json({ success: true, message: 'Fornecedor vinculado com sucesso' }, 201);
});

// GET /produtos/aux/categorias - Listar categorias
produtos.get('/aux/categorias', requirePermission('produtos', 'visualizar'), async (c) => {
  const user = c.get('user');
  
  const data = await c.env.DB.prepare(`
    SELECT * FROM categorias_produtos WHERE empresa_id = ? AND ativo = 1 ORDER BY nome
  `).bind(user.empresa_id).all();
  
  return c.json({ success: true, data: data.results });
});

// GET /produtos/aux/unidades - Listar unidades de medida
produtos.get('/aux/unidades', requirePermission('produtos', 'visualizar'), async (c) => {
  const user = c.get('user');
  
  const data = await c.env.DB.prepare(`
    SELECT * FROM unidades_medida WHERE empresa_id = ? AND ativo = 1 ORDER BY sigla
  `).bind(user.empresa_id).all();
  
  return c.json({ success: true, data: data.results });
});

// POST /produtos/aux/categorias - Criar categoria
produtos.post('/aux/categorias', requirePermission('produtos', 'criar'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const id = crypto.randomUUID();
  const slug = body.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  await c.env.DB.prepare(`
    INSERT INTO categorias_produtos (id, empresa_id, nome, categoria_pai_id, slug, ativo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(
    id, user.empresa_id, body.nome, body.categoria_pai_id || null, slug,
    new Date().toISOString(), new Date().toISOString()
  ).run();
  
  return c.json({ success: true, data: { id }, message: 'Categoria criada' }, 201);
});

// POST /produtos/aux/unidades - Criar unidade
produtos.post('/aux/unidades', requirePermission('produtos', 'criar'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO unidades_medida (id, empresa_id, sigla, descricao, fator_conversao, ativo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(
    id, user.empresa_id, body.sigla, body.descricao, body.fator_conversao || 1,
    new Date().toISOString(), new Date().toISOString()
  ).run();
  
  return c.json({ success: true, data: { id }, message: 'Unidade criada' }, 201);
});

// =============================================
// COSMOS/BLUESOFT - Cadastro automático de produtos
// =============================================

// GET /produtos/cosmos/buscar/:gtin - Buscar produto por GTIN
produtos.get('/cosmos/buscar/:gtin', requirePermission('produtos', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { gtin } = c.req.param();

  // Validar GTIN
  if (!validarGtin(gtin)) {
    return c.json({ success: false, error: 'GTIN inválido' }, 400);
  }

  // Obter token do ambiente
  const cosmosToken = c.env.COSMOS_TOKEN;
  if (!cosmosToken) {
    return c.json({ success: false, error: 'Token Cosmos não configurado' }, 500);
  }

  // Obter configuração da empresa
  const configDb = await obterConfig(c.env.DB, user.empresa_id);
  const config: CosmosConfig = {
    token: cosmosToken,
    ambiente: configDb?.ambiente || 'producao',
    cache_ttl: configDb?.cache_ttl,
    preencher_descricao: configDb?.preencher_descricao,
    preencher_ncm: configDb?.preencher_ncm,
    preencher_cest: configDb?.preencher_cest,
    preencher_marca: configDb?.preencher_marca,
    preencher_categoria: configDb?.preencher_categoria,
    preencher_peso: configDb?.preencher_peso,
    preencher_dimensoes: configDb?.preencher_dimensoes,
    preencher_imagem: configDb?.preencher_imagem,
  };

  const resultado = await buscarPorGtin(config, gtin, c.env.DB, user.empresa_id);

  if (resultado.status === 'erro') {
    return c.json({ success: false, error: resultado.erro }, 500);
  }

  if (resultado.status === 'nao_encontrado') {
    return c.json({ 
      success: false, 
      error: 'Produto não encontrado no Cosmos',
      cache_hit: resultado.cache_hit,
      tempo_resposta_ms: resultado.tempo_resposta_ms
    }, 404);
  }

  // Extrair dados para enriquecimento
  const enriquecimento = resultado.produto ? extrairEnriquecimento(resultado.produto, config) : null;

  return c.json({
    success: true,
    data: {
      produto_cosmos: resultado.produto,
      enriquecimento,
      cache_hit: resultado.cache_hit,
      tempo_resposta_ms: resultado.tempo_resposta_ms
    }
  });
});

// POST /produtos/cosmos/enriquecer/:id - Enriquecer produto existente com dados do Cosmos
produtos.post('/cosmos/enriquecer/:id', requirePermission('produtos', 'editar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  const { gtin, campos_sobrescrever } = body;

  if (!gtin) {
    return c.json({ success: false, error: 'GTIN é obrigatório' }, 400);
  }

  // Verificar se produto existe
  const produto = await c.env.DB.prepare(
    'SELECT * FROM produtos WHERE id = ? AND empresa_id = ?'
  ).bind(id, user.empresa_id).first();

  if (!produto) {
    return c.json({ success: false, error: 'Produto não encontrado' }, 404);
  }

  // Obter token do ambiente
  const cosmosToken = c.env.COSMOS_TOKEN;
  if (!cosmosToken) {
    return c.json({ success: false, error: 'Token Cosmos não configurado' }, 500);
  }

  // Obter configuração
  const configDb = await obterConfig(c.env.DB, user.empresa_id);
  const config: CosmosConfig = {
    token: cosmosToken,
    ambiente: configDb?.ambiente || 'producao',
    cache_ttl: configDb?.cache_ttl,
    sobrescrever_dados_manuais: campos_sobrescrever ? true : configDb?.sobrescrever_dados_manuais,
    preencher_descricao: configDb?.preencher_descricao,
    preencher_ncm: configDb?.preencher_ncm,
    preencher_cest: configDb?.preencher_cest,
    preencher_marca: configDb?.preencher_marca,
    preencher_categoria: configDb?.preencher_categoria,
    preencher_peso: configDb?.preencher_peso,
    preencher_dimensoes: configDb?.preencher_dimensoes,
    preencher_imagem: configDb?.preencher_imagem,
  };

  // Buscar dados do Cosmos
  const resultado = await buscarPorGtin(config, gtin, c.env.DB, user.empresa_id);

  if (resultado.status !== 'encontrado' || !resultado.produto) {
    return c.json({ 
      success: false, 
      error: resultado.status === 'erro' ? resultado.erro : 'Produto não encontrado no Cosmos'
    }, resultado.status === 'erro' ? 500 : 404);
  }

  const enriquecimento = extrairEnriquecimento(resultado.produto, config);

  // Montar updates
  const updates: string[] = ['updated_at = ?'];
  const params: (string | number | null)[] = [new Date().toISOString()];
  const camposAtualizados: string[] = [];

  // Campos a sobrescrever (se especificado) ou apenas campos vazios
  const sobrescrever = campos_sobrescrever || [];
  const deveAtualizar = (campo: string, valorAtual: unknown) => {
    return sobrescrever.includes(campo) || !valorAtual;
  };

  if (enriquecimento.ncm && deveAtualizar('ncm', produto.ncm)) {
    updates.push('ncm = ?');
    params.push(enriquecimento.ncm);
    camposAtualizados.push('ncm');
  }

  if (enriquecimento.cest && deveAtualizar('cest', produto.cest)) {
    updates.push('cest = ?');
    params.push(enriquecimento.cest);
    camposAtualizados.push('cest');
  }

  if (enriquecimento.marca && deveAtualizar('marca', produto.marca)) {
    updates.push('marca = ?');
    params.push(enriquecimento.marca);
    camposAtualizados.push('marca');
  }

  if (enriquecimento.peso_liquido && deveAtualizar('peso_liquido', produto.peso_liquido)) {
    updates.push('peso_liquido = ?');
    params.push(enriquecimento.peso_liquido);
    camposAtualizados.push('peso_liquido');
  }

  if (enriquecimento.peso_bruto && deveAtualizar('peso_bruto', produto.peso_bruto)) {
    updates.push('peso_bruto = ?');
    params.push(enriquecimento.peso_bruto);
    camposAtualizados.push('peso_bruto');
  }

  if (enriquecimento.largura && deveAtualizar('largura', produto.largura)) {
    updates.push('largura = ?');
    params.push(enriquecimento.largura);
    camposAtualizados.push('largura');
  }

  if (enriquecimento.altura && deveAtualizar('altura', produto.altura)) {
    updates.push('altura = ?');
    params.push(enriquecimento.altura);
    camposAtualizados.push('altura');
  }

  if (enriquecimento.profundidade && deveAtualizar('profundidade', produto.profundidade)) {
    updates.push('profundidade = ?');
    params.push(enriquecimento.profundidade);
    camposAtualizados.push('profundidade');
  }

  // Atualizar código de barras se não existir
  if (!produto.codigo_barras) {
    updates.push('codigo_barras = ?');
    params.push(gtin);
    camposAtualizados.push('codigo_barras');
  }

  params.push(id);

  // Executar update
  await c.env.DB.prepare(`
    UPDATE produtos SET ${updates.join(', ')} WHERE id = ?
  `).bind(...params).run();

  // Vincular produto ao Cosmos
  await vincularProduto(c.env.DB, user.empresa_id, id, gtin, resultado.produto, {
    origem_ncm: enriquecimento.ncm ? 'cosmos' : undefined,
    origem_cest: enriquecimento.cest ? 'cosmos' : undefined,
    origem_marca: enriquecimento.marca ? 'cosmos' : undefined,
    origem_peso: enriquecimento.peso_liquido ? 'cosmos' : undefined,
    origem_dimensoes: enriquecimento.largura ? 'cosmos' : undefined,
  });

  await registrarAuditoria(c.env.DB, {
    empresa_id: user.empresa_id,
    usuario_id: user.id,
    acao: 'editar',
    tabela: 'produtos',
    registro_id: id,
    dados_novos: { cosmos_enriquecimento: camposAtualizados }
  });

  return c.json({
    success: true,
    message: 'Produto enriquecido com dados do Cosmos',
    data: {
      campos_atualizados: camposAtualizados,
      enriquecimento,
      cache_hit: resultado.cache_hit
    }
  });
});

// GET /produtos/cosmos/vinculo/:id - Verificar vínculo Cosmos de um produto
produtos.get('/cosmos/vinculo/:id', requirePermission('produtos', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  const vinculo = await buscarVinculo(c.env.DB, user.empresa_id, id);

  if (!vinculo) {
    return c.json({ success: false, error: 'Produto não vinculado ao Cosmos' }, 404);
  }

  return c.json({
    success: true,
    data: {
      gtin_principal: vinculo.gtin_principal,
      gtins_alternativos: vinculo.gtins_alternativos ? JSON.parse(vinculo.gtins_alternativos) : [],
      ultima_sincronizacao: vinculo.ultima_sincronizacao,
      origens: {
        descricao: vinculo.origem_descricao,
        ncm: vinculo.origem_ncm,
        cest: vinculo.origem_cest,
        marca: vinculo.origem_marca,
        peso: vinculo.origem_peso,
        dimensoes: vinculo.origem_dimensoes,
        imagem: vinculo.origem_imagem,
      }
    }
  });
});

// GET /produtos/cosmos/por-gtin/:gtin - Buscar produto interno por GTIN
produtos.get('/cosmos/por-gtin/:gtin', requirePermission('produtos', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { gtin } = c.req.param();

  const resultado = await buscarProdutoPorGtin(c.env.DB, user.empresa_id, gtin);

  if (!resultado) {
    return c.json({ success: false, error: 'Nenhum produto encontrado com este GTIN' }, 404);
  }

  // Buscar dados completos do produto
  const produto = await c.env.DB.prepare(`
    SELECT p.*, c.nome as categoria_nome, um.sigla as unidade_sigla
    FROM produtos p
    LEFT JOIN categorias_produtos c ON p.categoria_id = c.id
    LEFT JOIN unidades_medida um ON p.unidade_medida_id = um.id
    WHERE p.id = ? AND p.empresa_id = ?
  `).bind(resultado.produto_id, user.empresa_id).first();

  return c.json({
    success: true,
    data: {
      produto,
      dados_cosmos: resultado.dados_cosmos ? JSON.parse(resultado.dados_cosmos) : null
    }
  });
});

// GET /produtos/cosmos/estatisticas - Estatísticas de uso da API Cosmos
produtos.get('/cosmos/estatisticas', requirePermission('produtos', 'visualizar'), async (c) => {
  const user = c.get('user');

  const estatisticas = await obterEstatisticas(c.env.DB, user.empresa_id);

  return c.json({
    success: true,
    data: estatisticas
  });
});

// GET /produtos/cosmos/config - Obter configuração Cosmos
produtos.get('/cosmos/config', requirePermission('produtos', 'visualizar'), async (c) => {
  const user = c.get('user');

  const config = await obterConfig(c.env.DB, user.empresa_id);

  return c.json({
    success: true,
    data: config || {
      habilitado: false,
      ambiente: 'producao',
      cache_ttl_horas: 168,
      auto_enriquecer: true,
      sobrescrever_dados_manuais: false,
      preencher_descricao: true,
      preencher_ncm: true,
      preencher_cest: true,
      preencher_marca: true,
      preencher_categoria: true,
      preencher_peso: true,
      preencher_dimensoes: true,
      preencher_imagem: true,
    }
  });
});

// PUT /produtos/cosmos/config - Salvar configuração Cosmos
produtos.put('/cosmos/config', requirePermission('produtos', 'editar'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  await salvarConfig(c.env.DB, user.empresa_id, body);

  await registrarAuditoria(c.env.DB, {
    empresa_id: user.empresa_id,
    usuario_id: user.id,
    acao: 'editar',
    tabela: 'cosmos_config',
    registro_id: user.empresa_id,
    dados_novos: body
  });

  return c.json({ success: true, message: 'Configuração Cosmos salva' });
});

// GET /produtos/cosmos/ncm/:ncm - Buscar produtos por NCM
produtos.get('/cosmos/ncm/:ncm', requirePermission('produtos', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { ncm } = c.req.param();
  const { pagina, itens_por_pagina, descricao, marca } = c.req.query();

  const cosmosToken = c.env.COSMOS_TOKEN;
  if (!cosmosToken) {
    return c.json({ success: false, error: 'Token Cosmos não configurado' }, 500);
  }

  const configDb = await obterConfig(c.env.DB, user.empresa_id);
  const config: CosmosConfig = {
    token: cosmosToken,
    ambiente: configDb?.ambiente || 'producao',
  };

  const resultado = await buscarPorNcm(config, {
    ncm,
    pagina: pagina ? parseInt(pagina) : 1,
    itens_por_pagina: itens_por_pagina ? parseInt(itens_por_pagina) : 30,
    descricao,
    marca,
  }, c.env.DB, user.empresa_id);

  if (resultado.status === 'erro') {
    return c.json({ success: false, error: resultado.erro }, 500);
  }

  if (resultado.status === 'nao_encontrado') {
    return c.json({ 
      success: false, 
      error: 'Nenhum produto encontrado com este NCM',
      tempo_resposta_ms: resultado.tempo_resposta_ms
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      produtos: resultado.produtos,
      ncm_info: resultado.ncm_info,
      paginacao: {
        pagina_atual: resultado.pagina_atual,
        itens_por_pagina: resultado.itens_por_pagina,
        total_paginas: resultado.total_paginas,
        total_produtos: resultado.total_produtos,
      },
      tempo_resposta_ms: resultado.tempo_resposta_ms
    }
  });
});

// POST /produtos/cosmos/importar - Importar produto do Cosmos para o cadastro
produtos.post('/cosmos/importar', requirePermission('produtos', 'criar'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { gtin, codigo, unidade_medida_id, categoria_id, preco_custo, margem_lucro, preco_venda, estoque_minimo } = body;

  if (!gtin) {
    return c.json({ success: false, error: 'GTIN é obrigatório' }, 400);
  }

  if (!unidade_medida_id) {
    return c.json({ success: false, error: 'Unidade de medida é obrigatória' }, 400);
  }

  const cosmosToken = c.env.COSMOS_TOKEN;
  if (!cosmosToken) {
    return c.json({ success: false, error: 'Token Cosmos não configurado' }, 500);
  }

  const produtoExistente = await c.env.DB.prepare(
    'SELECT id FROM produtos WHERE empresa_id = ? AND (gtin = ? OR codigo_barras = ?)'
  ).bind(user.empresa_id, gtin, gtin).first();

  if (produtoExistente) {
    return c.json({ success: false, error: 'Já existe um produto com este GTIN' }, 409);
  }

  const configDb = await obterConfig(c.env.DB, user.empresa_id);
  const config: CosmosConfig = {
    token: cosmosToken,
    ambiente: configDb?.ambiente || 'producao',
    preencher_descricao: true,
    preencher_ncm: true,
    preencher_cest: true,
    preencher_marca: true,
    preencher_peso: true,
    preencher_dimensoes: true,
  };

  const resultado = await importarProdutoCosmos(c.env.DB, user.empresa_id, config, gtin, {
    codigo,
    unidade_medida_id,
    categoria_id,
    preco_custo,
    margem_lucro,
    preco_venda,
    estoque_minimo,
  });

  if (!resultado.sucesso) {
    return c.json({ success: false, error: resultado.erro }, 400);
  }

  await registrarAuditoria(c.env.DB, {
    empresa_id: user.empresa_id,
    usuario_id: user.id,
    acao: 'criar',
    tabela: 'produtos',
    registro_id: resultado.produto_id!,
    dados_novos: { origem: 'cosmos', gtin }
  });

  const produtoCriado = await c.env.DB.prepare(`
    SELECT p.*, c.nome as categoria_nome, um.sigla as unidade_sigla
    FROM produtos p
    LEFT JOIN categorias_produtos c ON p.categoria_id = c.id
    LEFT JOIN unidades_medida um ON p.unidade_medida_id = um.id
    WHERE p.id = ? AND p.empresa_id = ?
  `).bind(resultado.produto_id, user.empresa_id).first();

  return c.json({
    success: true,
    message: 'Produto importado do Cosmos com sucesso',
    data: produtoCriado
  }, 201);
});

// =============================================
// TRIBUTAÇÃO - Consulta de tributação por NCM
// =============================================

// GET /produtos/tributacao/ncm/:ncm - Consultar tributação por NCM
produtos.get('/tributacao/ncm/:ncm', requirePermission('produtos', 'visualizar'), async (c) => {
  const { ncm } = c.req.param();
  const { uf_origem, uf_destino, regime } = c.req.query();

  const resultado = await consultarTributacaoPorNCM(c.env.DB, {
    ncm,
    uf_origem,
    uf_destino,
    regime: regime as 'simples' | 'lucro_presumido' | 'lucro_real' | undefined,
  });

  return c.json({
    success: resultado.status !== 'nao_encontrado',
    data: resultado.tributacao,
    status: resultado.status,
    mensagem: resultado.mensagem,
    tempo_resposta_ms: resultado.tempo_resposta_ms
  });
});

// GET /produtos/tributacao/:id - Consultar tributação de um produto específico
produtos.get('/tributacao/:id', requirePermission('produtos', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const { uf_origem, uf_destino, regime } = c.req.query();

  const resultado = await consultarTributacaoProduto(c.env.DB, user.empresa_id, id, {
    uf_origem,
    uf_destino,
    regime: regime as 'simples' | 'lucro_presumido' | 'lucro_real' | undefined,
  });

  if (!resultado) {
    return c.json({ 
      success: false, 
      error: 'Produto não encontrado ou sem NCM cadastrado' 
    }, 404);
  }

  return c.json({
    success: true,
    data: resultado
  });
});

// GET /produtos/tributacao/tabelas/ipi - Listar alíquotas IPI (TIPI)
produtos.get('/tributacao/tabelas/ipi', requirePermission('produtos', 'visualizar'), async (c) => {
  const { ncm_prefixo } = c.req.query();

  const aliquotas = await listarAliquotasIPI(c.env.DB, ncm_prefixo);

  return c.json({
    success: true,
    data: aliquotas,
    total: aliquotas.length
  });
});

// GET /produtos/tributacao/tabelas/mva - Listar MVA (ICMS-ST)
produtos.get('/tributacao/tabelas/mva', requirePermission('produtos', 'visualizar'), async (c) => {
  const { uf_origem, uf_destino } = c.req.query();

  const mvas = await listarMVA(c.env.DB, uf_origem, uf_destino);

  return c.json({
    success: true,
    data: mvas,
    total: mvas.length
  });
});

// GET /produtos/tributacao/tabelas/fcp - Listar FCP por UF
produtos.get('/tributacao/tabelas/fcp', requirePermission('produtos', 'visualizar'), async (c) => {
  const { uf } = c.req.query();

  const fcps = await listarFCP(c.env.DB, uf);

  return c.json({
    success: true,
    data: fcps,
    total: fcps.length
  });
});

export default produtos;
