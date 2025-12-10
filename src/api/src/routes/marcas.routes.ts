// ============================================
// PLANAC ERP - Rotas de Marcas
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const marcas = new Hono<{ Bindings: Bindings; Variables: Variables }>();

marcas.use('/*', requireAuth());

// Schemas
const marcaSchema = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().optional(),
  logo_url: z.string().url().optional(),
  site: z.string().url().optional(),
  ativa: z.boolean().default(true)
});

// GET /marcas - Listar
marcas.get('/', requirePermission('produtos', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { busca, ativa } = c.req.query();

  let query = `SELECT * FROM marcas WHERE empresa_id = ?`;
  const params: any[] = [usuario.empresa_id];

  if (busca) {
    query += ` AND nome LIKE ?`;
    params.push(`%${busca}%`);
  }

  if (ativa !== undefined) {
    query += ` AND ativa = ?`;
    params.push(ativa === 'true' ? 1 : 0);
  }

  query += ` ORDER BY nome`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({ success: true, data: result.results });
});

// GET /marcas/:id - Buscar
marcas.get('/:id', requirePermission('produtos', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const marca = await c.env.DB.prepare(`
    SELECT * FROM marcas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!marca) {
    return c.json({ success: false, error: 'Marca não encontrada' }, 404);
  }

  // Quantidade de produtos
  const qtdProdutos = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM produtos WHERE marca_id = ?
  `).bind(id).first<{ total: number }>();

  return c.json({
    success: true,
    data: { ...marca, quantidade_produtos: qtdProdutos?.total || 0 }
  });
});

// POST /marcas - Criar
marcas.post('/', requirePermission('produtos', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = marcaSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;
  const id = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO marcas (id, empresa_id, nome, descricao, logo_url, site, ativa)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, usuario.empresa_id, data.nome, data.descricao || null,
    data.logo_url || null, data.site || null, data.ativa ? 1 : 0
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'marcas',
    entidade_id: id,
    dados_novos: data
  });

  return c.json({ success: true, data: { id } }, 201);
});

// PUT /marcas/:id - Atualizar
marcas.put('/:id', requirePermission('produtos', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const marcaAtual = await c.env.DB.prepare(`
    SELECT * FROM marcas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!marcaAtual) {
    return c.json({ success: false, error: 'Marca não encontrada' }, 404);
  }

  const validation = marcaSchema.partial().safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  await c.env.DB.prepare(`
    UPDATE marcas SET
      nome = COALESCE(?, nome),
      descricao = COALESCE(?, descricao),
      logo_url = COALESCE(?, logo_url),
      site = COALESCE(?, site),
      ativa = COALESCE(?, ativa),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(
    data.nome, data.descricao, data.logo_url, data.site,
    data.ativa !== undefined ? (data.ativa ? 1 : 0) : null,
    id, usuario.empresa_id
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'ATUALIZAR',
    entidade: 'marcas',
    entidade_id: id,
    dados_anteriores: marcaAtual,
    dados_novos: data
  });

  return c.json({ success: true, message: 'Marca atualizada' });
});

// DELETE /marcas/:id - Excluir
marcas.delete('/:id', requirePermission('produtos', 'excluir'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const marca = await c.env.DB.prepare(`
    SELECT * FROM marcas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!marca) {
    return c.json({ success: false, error: 'Marca não encontrada' }, 404);
  }

  // Verificar produtos vinculados
  const produtos = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM produtos WHERE marca_id = ?
  `).bind(id).first<{ total: number }>();

  if (produtos && produtos.total > 0) {
    return c.json({ success: false, error: 'Marca possui produtos vinculados' }, 400);
  }

  await c.env.DB.prepare(`DELETE FROM marcas WHERE id = ?`).bind(id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'EXCLUIR',
    entidade: 'marcas',
    entidade_id: id,
    dados_anteriores: marca
  });

  return c.json({ success: true, message: 'Marca excluída' });
});

export default marcas;
