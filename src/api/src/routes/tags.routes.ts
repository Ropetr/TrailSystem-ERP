// ============================================
// PLANAC ERP - Rotas de Tags
// Sistema de tags flexivel para todo o ERP
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables, TagCategoria, Tag, TagVinculo } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const tags = new Hono<{ Bindings: Bindings; Variables: Variables }>();

tags.use('/*', requireAuth());

// =============================================
// SCHEMAS
// =============================================

const categoriaSchema = z.object({
  nome: z.string().min(2).max(100),
  parent_id: z.string().uuid().optional(),
  descricao: z.string().optional(),
  icone: z.string().optional(),
  ordem: z.number().int().min(0).default(0),
});

const tagSchema = z.object({
  nome: z.string().min(2).max(50),
  categoria_id: z.string().uuid().optional(),
  cor_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280'),
  icone: z.string().optional(),
  descricao: z.string().optional(),
});

const vinculoSchema = z.object({
  tag_id: z.string().uuid(),
  entidade_tipo: z.string().min(1),
  entidade_id: z.string().uuid(),
});

// Helper para gerar slug
function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// =============================================
// CATEGORIAS DE TAGS
// =============================================

// GET /tags/categorias - Listar categorias
tags.get('/categorias', requirePermission('configuracoes', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const { ativo } = c.req.query();

  let query = `SELECT * FROM tags_categorias WHERE empresa_id = ?`;
  const params: any[] = [usuario.empresa_id];

  if (ativo !== undefined) {
    query += ` AND ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }

  query += ` ORDER BY ordem, nome`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  // Organizar em arvore hierarquica
  const categorias = result.results as TagCategoria[];
  const raizes = categorias.filter(c => !c.parent_id);
  
  const construirArvore = (parent_id: string | null): any[] => {
    return categorias
      .filter(c => c.parent_id === parent_id)
      .map(cat => ({
        ...cat,
        filhos: construirArvore(cat.id)
      }));
  };

  return c.json({
    success: true,
    data: raizes.map(cat => ({
      ...cat,
      filhos: construirArvore(cat.id)
    }))
  });
});

// POST /tags/categorias - Criar categoria
tags.post('/categorias', requirePermission('configuracoes', 'editar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validacao = categoriaSchema.safeParse(body);
  if (!validacao.success) {
    return c.json({ success: false, error: 'Dados invalidos', details: validacao.error.errors }, 400);
  }

  const dados = validacao.data;
  const slug = gerarSlug(dados.nome);

  // Verificar duplicidade de slug
  const existe = await c.env.DB.prepare(`
    SELECT id FROM tags_categorias WHERE empresa_id = ? AND slug = ?
  `).bind(usuario.empresa_id, slug).first();

  if (existe) {
    return c.json({ success: false, error: 'Ja existe uma categoria com este nome' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    INSERT INTO tags_categorias (
      id, empresa_id, parent_id, nome, slug, descricao, icone, ordem, ativo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(
    id, usuario.empresa_id, dados.parent_id || null, dados.nome, slug,
    dados.descricao || null, dados.icone || null, dados.ordem, now, now
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'criar',
    tabela: 'tags_categorias',
    registro_id: id,
    dados_novos: { nome: dados.nome, slug }
  });

  return c.json({ success: true, data: { id, slug }, message: 'Categoria criada com sucesso' }, 201);
});

// PUT /tags/categorias/:id - Editar categoria
tags.put('/categorias/:id', requirePermission('configuracoes', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const categoria = await c.env.DB.prepare(`
    SELECT * FROM tags_categorias WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first<TagCategoria>();

  if (!categoria) {
    return c.json({ success: false, error: 'Categoria nao encontrada' }, 404);
  }

  const campos = ['nome', 'parent_id', 'descricao', 'icone', 'ordem', 'ativo'];
  const updates: string[] = ['updated_at = ?'];
  const params: any[] = [new Date().toISOString()];

  for (const campo of campos) {
    if (body[campo] !== undefined) {
      updates.push(`${campo} = ?`);
      params.push(body[campo]);
    }
  }

  // Atualizar slug se nome mudou
  if (body.nome && body.nome !== categoria.nome) {
    const novoSlug = gerarSlug(body.nome);
    const existe = await c.env.DB.prepare(`
      SELECT id FROM tags_categorias WHERE empresa_id = ? AND slug = ? AND id != ?
    `).bind(usuario.empresa_id, novoSlug, id).first();

    if (existe) {
      return c.json({ success: false, error: 'Ja existe uma categoria com este nome' }, 400);
    }

    updates.push('slug = ?');
    params.push(novoSlug);
  }

  params.push(id);

  await c.env.DB.prepare(`
    UPDATE tags_categorias SET ${updates.join(', ')} WHERE id = ?
  `).bind(...params).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'editar',
    tabela: 'tags_categorias',
    registro_id: id,
    dados_anteriores: categoria,
    dados_novos: body
  });

  return c.json({ success: true, message: 'Categoria atualizada com sucesso' });
});

// DELETE /tags/categorias/:id - Excluir categoria
tags.delete('/categorias/:id', requirePermission('configuracoes', 'excluir'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const categoria = await c.env.DB.prepare(`
    SELECT * FROM tags_categorias WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first<TagCategoria>();

  if (!categoria) {
    return c.json({ success: false, error: 'Categoria nao encontrada' }, 404);
  }

  // Verificar se tem tags vinculadas
  const tagsVinculadas = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM tags WHERE categoria_id = ?
  `).bind(id).first<{ total: number }>();

  if (tagsVinculadas && tagsVinculadas.total > 0) {
    return c.json({ 
      success: false, 
      error: `Categoria possui ${tagsVinculadas.total} tags vinculadas. Remova as tags primeiro.` 
    }, 400);
  }

  // Verificar se tem subcategorias
  const subcategorias = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM tags_categorias WHERE parent_id = ?
  `).bind(id).first<{ total: number }>();

  if (subcategorias && subcategorias.total > 0) {
    return c.json({ 
      success: false, 
      error: `Categoria possui ${subcategorias.total} subcategorias. Remova as subcategorias primeiro.` 
    }, 400);
  }

  await c.env.DB.prepare(`DELETE FROM tags_categorias WHERE id = ?`).bind(id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'excluir',
    tabela: 'tags_categorias',
    registro_id: id,
    dados_anteriores: categoria
  });

  return c.json({ success: true, message: 'Categoria excluida com sucesso' });
});

// =============================================
// TAGS
// =============================================

// GET /tags - Listar tags
tags.get('/', requirePermission('configuracoes', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const { categoria_id, ativo, busca } = c.req.query();

  let query = `
    SELECT t.*, tc.nome as categoria_nome 
    FROM tags t 
    LEFT JOIN tags_categorias tc ON t.categoria_id = tc.id 
    WHERE t.empresa_id = ?
  `;
  const params: any[] = [usuario.empresa_id];

  if (categoria_id) {
    query += ` AND t.categoria_id = ?`;
    params.push(categoria_id);
  }

  if (ativo !== undefined) {
    query += ` AND t.ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }

  if (busca) {
    query += ` AND (t.nome LIKE ? OR t.descricao LIKE ?)`;
    const termo = `%${busca}%`;
    params.push(termo, termo);
  }

  query += ` ORDER BY tc.nome, t.nome`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results
  });
});

// GET /tags/:id - Buscar tag
tags.get('/:id', requirePermission('configuracoes', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const tag = await c.env.DB.prepare(`
    SELECT t.*, tc.nome as categoria_nome 
    FROM tags t 
    LEFT JOIN tags_categorias tc ON t.categoria_id = tc.id 
    WHERE t.id = ? AND t.empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!tag) {
    return c.json({ success: false, error: 'Tag nao encontrada' }, 404);
  }

  // Contar vinculos por tipo de entidade
  const vinculos = await c.env.DB.prepare(`
    SELECT entidade_tipo, COUNT(*) as total 
    FROM tags_vinculos 
    WHERE tag_id = ? 
    GROUP BY entidade_tipo
  `).bind(id).all();

  return c.json({
    success: true,
    data: {
      ...tag,
      vinculos_por_tipo: vinculos.results
    }
  });
});

// POST /tags - Criar tag
tags.post('/', requirePermission('configuracoes', 'editar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validacao = tagSchema.safeParse(body);
  if (!validacao.success) {
    return c.json({ success: false, error: 'Dados invalidos', details: validacao.error.errors }, 400);
  }

  const dados = validacao.data;
  const slug = gerarSlug(dados.nome);

  // Verificar duplicidade de slug
  const existe = await c.env.DB.prepare(`
    SELECT id FROM tags WHERE empresa_id = ? AND slug = ?
  `).bind(usuario.empresa_id, slug).first();

  if (existe) {
    return c.json({ success: false, error: 'Ja existe uma tag com este nome' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    INSERT INTO tags (
      id, empresa_id, categoria_id, nome, slug, cor_hex, icone, descricao, ativo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(
    id, usuario.empresa_id, dados.categoria_id || null, dados.nome, slug,
    dados.cor_hex, dados.icone || null, dados.descricao || null, now, now
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'criar',
    tabela: 'tags',
    registro_id: id,
    dados_novos: { nome: dados.nome, slug, cor_hex: dados.cor_hex }
  });

  return c.json({ success: true, data: { id, slug }, message: 'Tag criada com sucesso' }, 201);
});

// PUT /tags/:id - Editar tag
tags.put('/:id', requirePermission('configuracoes', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const tag = await c.env.DB.prepare(`
    SELECT * FROM tags WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first<Tag>();

  if (!tag) {
    return c.json({ success: false, error: 'Tag nao encontrada' }, 404);
  }

  const campos = ['nome', 'categoria_id', 'cor_hex', 'icone', 'descricao', 'ativo'];
  const updates: string[] = ['updated_at = ?'];
  const params: any[] = [new Date().toISOString()];

  for (const campo of campos) {
    if (body[campo] !== undefined) {
      updates.push(`${campo} = ?`);
      params.push(body[campo]);
    }
  }

  // Atualizar slug se nome mudou
  if (body.nome && body.nome !== tag.nome) {
    const novoSlug = gerarSlug(body.nome);
    const existe = await c.env.DB.prepare(`
      SELECT id FROM tags WHERE empresa_id = ? AND slug = ? AND id != ?
    `).bind(usuario.empresa_id, novoSlug, id).first();

    if (existe) {
      return c.json({ success: false, error: 'Ja existe uma tag com este nome' }, 400);
    }

    updates.push('slug = ?');
    params.push(novoSlug);
  }

  params.push(id);

  await c.env.DB.prepare(`
    UPDATE tags SET ${updates.join(', ')} WHERE id = ?
  `).bind(...params).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'editar',
    tabela: 'tags',
    registro_id: id,
    dados_anteriores: tag,
    dados_novos: body
  });

  return c.json({ success: true, message: 'Tag atualizada com sucesso' });
});

// DELETE /tags/:id - Excluir tag
tags.delete('/:id', requirePermission('configuracoes', 'excluir'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const tag = await c.env.DB.prepare(`
    SELECT * FROM tags WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first<Tag>();

  if (!tag) {
    return c.json({ success: false, error: 'Tag nao encontrada' }, 404);
  }

  // Excluir vinculos primeiro (CASCADE ja faz isso, mas vamos ser explicitos)
  await c.env.DB.prepare(`DELETE FROM tags_vinculos WHERE tag_id = ?`).bind(id).run();
  await c.env.DB.prepare(`DELETE FROM tags WHERE id = ?`).bind(id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'excluir',
    tabela: 'tags',
    registro_id: id,
    dados_anteriores: tag
  });

  return c.json({ success: true, message: 'Tag excluida com sucesso' });
});

// =============================================
// VINCULOS DE TAGS
// =============================================

// GET /tags/vinculos/:entidade_tipo/:entidade_id - Listar tags de uma entidade
tags.get('/vinculos/:entidade_tipo/:entidade_id', requireAuth(), async (c) => {
  const { entidade_tipo, entidade_id } = c.req.param();
  const usuario = c.get('usuario');

  const result = await c.env.DB.prepare(`
    SELECT t.*, tv.created_at as vinculado_em
    FROM tags_vinculos tv
    JOIN tags t ON tv.tag_id = t.id
    WHERE tv.empresa_id = ? AND tv.entidade_tipo = ? AND tv.entidade_id = ?
    ORDER BY t.nome
  `).bind(usuario.empresa_id, entidade_tipo, entidade_id).all();

  return c.json({
    success: true,
    data: result.results
  });
});

// POST /tags/vinculos - Vincular tag a entidade
tags.post('/vinculos', requireAuth(), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validacao = vinculoSchema.safeParse(body);
  if (!validacao.success) {
    return c.json({ success: false, error: 'Dados invalidos', details: validacao.error.errors }, 400);
  }

  const dados = validacao.data;

  // Verificar se tag existe
  const tag = await c.env.DB.prepare(`
    SELECT id FROM tags WHERE id = ? AND empresa_id = ?
  `).bind(dados.tag_id, usuario.empresa_id).first();

  if (!tag) {
    return c.json({ success: false, error: 'Tag nao encontrada' }, 404);
  }

  // Verificar se vinculo ja existe
  const existe = await c.env.DB.prepare(`
    SELECT id FROM tags_vinculos 
    WHERE empresa_id = ? AND tag_id = ? AND entidade_tipo = ? AND entidade_id = ?
  `).bind(usuario.empresa_id, dados.tag_id, dados.entidade_tipo, dados.entidade_id).first();

  if (existe) {
    return c.json({ success: false, error: 'Tag ja vinculada a esta entidade' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    INSERT INTO tags_vinculos (
      id, empresa_id, tag_id, entidade_tipo, entidade_id, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, usuario.empresa_id, dados.tag_id, dados.entidade_tipo, dados.entidade_id, usuario.id, now
  ).run();

  return c.json({ success: true, data: { id }, message: 'Tag vinculada com sucesso' }, 201);
});

// DELETE /tags/vinculos/:id - Desvincular tag
tags.delete('/vinculos/:id', requireAuth(), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const vinculo = await c.env.DB.prepare(`
    SELECT * FROM tags_vinculos WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first<TagVinculo>();

  if (!vinculo) {
    return c.json({ success: false, error: 'Vinculo nao encontrado' }, 404);
  }

  await c.env.DB.prepare(`DELETE FROM tags_vinculos WHERE id = ?`).bind(id).run();

  return c.json({ success: true, message: 'Tag desvinculada com sucesso' });
});

// POST /tags/vinculos/batch - Vincular multiplas tags a uma entidade
tags.post('/vinculos/batch', requireAuth(), async (c) => {
  const usuario = c.get('usuario');
  const { tag_ids, entidade_tipo, entidade_id } = await c.req.json();

  if (!Array.isArray(tag_ids) || !entidade_tipo || !entidade_id) {
    return c.json({ success: false, error: 'Dados invalidos' }, 400);
  }

  const now = new Date().toISOString();
  let vinculados = 0;

  for (const tag_id of tag_ids) {
    // Verificar se tag existe
    const tag = await c.env.DB.prepare(`
      SELECT id FROM tags WHERE id = ? AND empresa_id = ?
    `).bind(tag_id, usuario.empresa_id).first();

    if (!tag) continue;

    // Verificar se vinculo ja existe
    const existe = await c.env.DB.prepare(`
      SELECT id FROM tags_vinculos 
      WHERE empresa_id = ? AND tag_id = ? AND entidade_tipo = ? AND entidade_id = ?
    `).bind(usuario.empresa_id, tag_id, entidade_tipo, entidade_id).first();

    if (existe) continue;

    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO tags_vinculos (
        id, empresa_id, tag_id, entidade_tipo, entidade_id, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, usuario.empresa_id, tag_id, entidade_tipo, entidade_id, usuario.id, now).run();

    vinculados++;
  }

  return c.json({ 
    success: true, 
    data: { vinculados }, 
    message: `${vinculados} tags vinculadas com sucesso` 
  });
});

// DELETE /tags/vinculos/entidade/:entidade_tipo/:entidade_id - Remover todas as tags de uma entidade
tags.delete('/vinculos/entidade/:entidade_tipo/:entidade_id', requireAuth(), async (c) => {
  const { entidade_tipo, entidade_id } = c.req.param();
  const usuario = c.get('usuario');

  await c.env.DB.prepare(`
    DELETE FROM tags_vinculos 
    WHERE empresa_id = ? AND entidade_tipo = ? AND entidade_id = ?
  `).bind(usuario.empresa_id, entidade_tipo, entidade_id).run();

  return c.json({ success: true, message: 'Tags removidas com sucesso' });
});

export default tags;
