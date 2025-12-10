// ============================================
// PLANAC ERP - Rotas de Categorias
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const categorias = new Hono<{ Bindings: Bindings; Variables: Variables }>();

categorias.use('/*', requireAuth());

// Schemas
const categoriaSchema = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().optional(),
  categoria_pai_id: z.string().uuid().optional(),
  codigo: z.string().max(20).optional(),
  icone: z.string().optional(),
  cor: z.string().optional(),
  ordem: z.number().int().default(0),
  exibir_ecommerce: z.boolean().default(true),
  ativa: z.boolean().default(true)
});

// GET /categorias - Listar (árvore)
categorias.get('/', requirePermission('categorias', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { flat, ativa, ecommerce } = c.req.query();

  let query = `SELECT * FROM categorias WHERE empresa_id = ?`;
  const params: any[] = [usuario.empresa_id];

  if (ativa !== undefined) {
    query += ` AND ativa = ?`;
    params.push(ativa === 'true' ? 1 : 0);
  }

  if (ecommerce === 'true') {
    query += ` AND exibir_ecommerce = 1`;
  }

  query += ` ORDER BY ordem, nome`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  // Se flat=true, retorna lista plana
  if (flat === 'true') {
    return c.json({ success: true, data: result.results });
  }

  // Montar árvore hierárquica
  const categoriasMap = new Map();
  const raizes: any[] = [];

  result.results.forEach((cat: any) => {
    categoriasMap.set(cat.id, { ...cat, subcategorias: [] });
  });

  result.results.forEach((cat: any) => {
    const categoria = categoriasMap.get(cat.id);
    if (cat.categoria_pai_id && categoriasMap.has(cat.categoria_pai_id)) {
      categoriasMap.get(cat.categoria_pai_id).subcategorias.push(categoria);
    } else {
      raizes.push(categoria);
    }
  });

  return c.json({ success: true, data: raizes });
});

// GET /categorias/:id - Buscar
categorias.get('/:id', requirePermission('categorias', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const categoria = await c.env.DB.prepare(`
    SELECT c.*, cp.nome as categoria_pai_nome
    FROM categorias c
    LEFT JOIN categorias cp ON c.categoria_pai_id = cp.id
    WHERE c.id = ? AND c.empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!categoria) {
    return c.json({ success: false, error: 'Categoria não encontrada' }, 404);
  }

  // Subcategorias
  const subcategorias = await c.env.DB.prepare(`
    SELECT * FROM categorias WHERE categoria_pai_id = ? ORDER BY ordem, nome
  `).bind(id).all();

  // Quantidade de produtos
  const qtdProdutos = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM produtos WHERE categoria_id = ?
  `).bind(id).first<{ total: number }>();

  return c.json({
    success: true,
    data: {
      ...categoria,
      subcategorias: subcategorias.results,
      quantidade_produtos: qtdProdutos?.total || 0
    }
  });
});

// POST /categorias - Criar
categorias.post('/', requirePermission('categorias', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = categoriaSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;
  const id = crypto.randomUUID();

  // Verificar se categoria pai existe
  if (data.categoria_pai_id) {
    const pai = await c.env.DB.prepare(`
      SELECT id FROM categorias WHERE id = ? AND empresa_id = ?
    `).bind(data.categoria_pai_id, usuario.empresa_id).first();
    
    if (!pai) {
      return c.json({ success: false, error: 'Categoria pai não encontrada' }, 400);
    }
  }

  // Gerar código automático se não informado
  let codigo = data.codigo;
  if (!codigo) {
    const ultimoCodigo = await c.env.DB.prepare(`
      SELECT codigo FROM categorias WHERE empresa_id = ? ORDER BY codigo DESC LIMIT 1
    `).bind(usuario.empresa_id).first<{ codigo: string }>();
    
    const num = ultimoCodigo?.codigo ? parseInt(ultimoCodigo.codigo) + 1 : 1;
    codigo = num.toString().padStart(4, '0');
  }

  await c.env.DB.prepare(`
    INSERT INTO categorias (
      id, empresa_id, nome, descricao, categoria_pai_id, codigo,
      icone, cor, ordem, exibir_ecommerce, ativa
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, usuario.empresa_id, data.nome, data.descricao || null,
    data.categoria_pai_id || null, codigo, data.icone || null,
    data.cor || null, data.ordem, data.exibir_ecommerce ? 1 : 0, data.ativa ? 1 : 0
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'categorias',
    entidade_id: id,
    dados_novos: { ...data, codigo }
  });

  return c.json({ success: true, data: { id, codigo } }, 201);
});

// PUT /categorias/:id - Atualizar
categorias.put('/:id', requirePermission('categorias', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const categoriaAtual = await c.env.DB.prepare(`
    SELECT * FROM categorias WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!categoriaAtual) {
    return c.json({ success: false, error: 'Categoria não encontrada' }, 404);
  }

  const validation = categoriaSchema.partial().safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  // Verificar se não está tentando ser pai de si mesma
  if (data.categoria_pai_id === id) {
    return c.json({ success: false, error: 'Categoria não pode ser pai de si mesma' }, 400);
  }

  await c.env.DB.prepare(`
    UPDATE categorias SET
      nome = COALESCE(?, nome),
      descricao = COALESCE(?, descricao),
      categoria_pai_id = COALESCE(?, categoria_pai_id),
      icone = COALESCE(?, icone),
      cor = COALESCE(?, cor),
      ordem = COALESCE(?, ordem),
      exibir_ecommerce = COALESCE(?, exibir_ecommerce),
      ativa = COALESCE(?, ativa),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(
    data.nome, data.descricao, data.categoria_pai_id, data.icone, data.cor,
    data.ordem, data.exibir_ecommerce !== undefined ? (data.exibir_ecommerce ? 1 : 0) : null,
    data.ativa !== undefined ? (data.ativa ? 1 : 0) : null,
    id, usuario.empresa_id
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'ATUALIZAR',
    entidade: 'categorias',
    entidade_id: id,
    dados_anteriores: categoriaAtual,
    dados_novos: data
  });

  return c.json({ success: true, message: 'Categoria atualizada' });
});

// DELETE /categorias/:id - Excluir
categorias.delete('/:id', requirePermission('categorias', 'excluir'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const categoria = await c.env.DB.prepare(`
    SELECT * FROM categorias WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!categoria) {
    return c.json({ success: false, error: 'Categoria não encontrada' }, 404);
  }

  // Verificar subcategorias
  const subcategorias = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM categorias WHERE categoria_pai_id = ?
  `).bind(id).first<{ total: number }>();

  if (subcategorias && subcategorias.total > 0) {
    return c.json({ success: false, error: 'Categoria possui subcategorias. Remova-as primeiro.' }, 400);
  }

  // Verificar produtos vinculados
  const produtos = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM produtos WHERE categoria_id = ?
  `).bind(id).first<{ total: number }>();

  if (produtos && produtos.total > 0) {
    return c.json({ success: false, error: 'Categoria possui produtos vinculados. Mova-os primeiro.' }, 400);
  }

  await c.env.DB.prepare(`DELETE FROM categorias WHERE id = ?`).bind(id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'EXCLUIR',
    entidade: 'categorias',
    entidade_id: id,
    dados_anteriores: categoria
  });

  return c.json({ success: true, message: 'Categoria excluída' });
});

// PUT /categorias/:id/ordem - Reordenar
categorias.put('/:id/ordem', requirePermission('categorias', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const { ordem } = await c.req.json();

  await c.env.DB.prepare(`
    UPDATE categorias SET ordem = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(ordem, id, usuario.empresa_id).run();

  return c.json({ success: true, message: 'Ordem atualizada' });
});

// PUT /categorias/reordenar - Reordenar múltiplas
categorias.put('/reordenar', requirePermission('categorias', 'editar'), async (c) => {
  const usuario = c.get('usuario');
  const { items } = await c.req.json(); // [{ id, ordem }]

  for (const item of items) {
    await c.env.DB.prepare(`
      UPDATE categorias SET ordem = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND empresa_id = ?
    `).bind(item.ordem, item.id, usuario.empresa_id).run();
  }

  return c.json({ success: true, message: 'Categorias reordenadas' });
});

export default categorias;
