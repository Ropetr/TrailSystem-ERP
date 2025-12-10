// ============================================
// PLANAC ERP - Rotas de Tabelas de Preço
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const tabelasPreco = new Hono<{ Bindings: Bindings; Variables: Variables }>();

tabelasPreco.use('/*', requireAuth());

// Schemas
const tabelaPrecoSchema = z.object({
  nome: z.string().min(3),
  descricao: z.string().optional(),
  tipo: z.enum(['padrao', 'atacado', 'varejo', 'promocional', 'especial']).default('padrao'),
  vigencia_inicio: z.string().optional(),
  vigencia_fim: z.string().optional(),
  ativo: z.boolean().default(true)
});

const itemTabelaSchema = z.object({
  produto_id: z.string().uuid(),
  preco: z.number().positive(),
  preco_minimo: z.number().positive().optional(),
  quantidade_minima: z.number().int().positive().default(1),
  desconto_maximo: z.number().min(0).max(100).default(0)
});

// GET /tabelas-preco - Listar tabelas
tabelasPreco.get('/', requirePermission('produtos', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { ativo, tipo } = c.req.query();

  let query = `SELECT * FROM tabelas_preco WHERE empresa_id = ?`;
  const params: any[] = [usuario.empresa_id];

  if (ativo !== undefined) {
    query += ` AND ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }

  if (tipo) {
    query += ` AND tipo = ?`;
    params.push(tipo);
  }

  query += ` ORDER BY nome`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results
  });
});

// GET /tabelas-preco/:id - Buscar tabela com itens
tabelasPreco.get('/:id', requirePermission('produtos', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  const tabela = await c.env.DB.prepare(
    `SELECT * FROM tabelas_preco WHERE id = ? AND empresa_id = ?`
  ).bind(id, usuario.empresa_id).first();

  if (!tabela) {
    return c.json({ success: false, error: 'Tabela de preço não encontrada' }, 404);
  }

  // Buscar itens
  const itens = await c.env.DB.prepare(`
    SELECT 
      tpi.*,
      p.nome as produto_nome,
      p.codigo as produto_codigo
    FROM tabelas_preco_itens tpi
    JOIN produtos p ON p.id = tpi.produto_id
    WHERE tpi.tabela_preco_id = ?
    ORDER BY p.nome
  `).bind(id).all();

  return c.json({
    success: true,
    data: {
      ...tabela,
      itens: itens.results
    }
  });
});

// POST /tabelas-preco - Criar tabela
tabelasPreco.post('/', requirePermission('produtos', 'editar_preco'), async (c) => {
  const usuario = c.get('usuario');

  try {
    const body = await c.req.json();
    const dados = tabelaPrecoSchema.parse(body);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO tabelas_preco (
        id, empresa_id, nome, descricao, tipo,
        vigencia_inicio, vigencia_fim, ativo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, usuario.empresa_id, dados.nome, dados.descricao || null, dados.tipo,
      dados.vigencia_inicio || null, dados.vigencia_fim || null,
      dados.ativo ? 1 : 0, now, now
    ).run();

    await registrarAuditoria(c.env.DB, {
      usuario_id: usuario.id,
      empresa_id: usuario.empresa_id,
      acao: 'criar',
      entidade: 'tabelas_preco',
      entidade_id: id,
      dados_novos: dados
    });

    return c.json({ success: true, data: { id } }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: 'Dados inválidos', details: error.errors }, 400);
    }
    throw error;
  }
});

// PUT /tabelas-preco/:id - Atualizar tabela
tabelasPreco.put('/:id', requirePermission('produtos', 'editar_preco'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  try {
    const body = await c.req.json();
    const dados = tabelaPrecoSchema.partial().parse(body);

    const tabelaAtual = await c.env.DB.prepare(
      `SELECT * FROM tabelas_preco WHERE id = ? AND empresa_id = ?`
    ).bind(id, usuario.empresa_id).first();

    if (!tabelaAtual) {
      return c.json({ success: false, error: 'Tabela não encontrada' }, 404);
    }

    const campos: string[] = [];
    const valores: any[] = [];

    Object.entries(dados).forEach(([key, value]) => {
      if (value !== undefined) {
        campos.push(`${key} = ?`);
        valores.push(key === 'ativo' ? (value ? 1 : 0) : value);
      }
    });

    if (campos.length > 0) {
      campos.push('updated_at = ?');
      valores.push(new Date().toISOString());
      valores.push(id, usuario.empresa_id);

      await c.env.DB.prepare(
        `UPDATE tabelas_preco SET ${campos.join(', ')} WHERE id = ? AND empresa_id = ?`
      ).bind(...valores).run();

      await registrarAuditoria(c.env.DB, {
        usuario_id: usuario.id,
        empresa_id: usuario.empresa_id,
        acao: 'editar',
        entidade: 'tabelas_preco',
        entidade_id: id,
        dados_anteriores: tabelaAtual,
        dados_novos: dados
      });
    }

    return c.json({ success: true, message: 'Tabela atualizada' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: 'Dados inválidos', details: error.errors }, 400);
    }
    throw error;
  }
});

// POST /tabelas-preco/:id/itens - Adicionar/atualizar item
tabelasPreco.post('/:id/itens', requirePermission('produtos', 'editar_preco'), async (c) => {
  const usuario = c.get('usuario');
  const tabelaId = c.req.param('id');

  try {
    const body = await c.req.json();
    const dados = itemTabelaSchema.parse(body);

    // Verificar tabela
    const tabela = await c.env.DB.prepare(
      `SELECT id FROM tabelas_preco WHERE id = ? AND empresa_id = ?`
    ).bind(tabelaId, usuario.empresa_id).first();

    if (!tabela) {
      return c.json({ success: false, error: 'Tabela não encontrada' }, 404);
    }

    // Verificar produto
    const produto = await c.env.DB.prepare(
      `SELECT id FROM produtos WHERE id = ? AND empresa_id = ?`
    ).bind(dados.produto_id, usuario.empresa_id).first();

    if (!produto) {
      return c.json({ success: false, error: 'Produto não encontrado' }, 404);
    }

    // Verificar se já existe
    const itemExiste = await c.env.DB.prepare(
      `SELECT id FROM tabelas_preco_itens WHERE tabela_preco_id = ? AND produto_id = ?`
    ).bind(tabelaId, dados.produto_id).first<any>();

    const now = new Date().toISOString();

    if (itemExiste) {
      // Atualizar
      await c.env.DB.prepare(`
        UPDATE tabelas_preco_itens SET
          preco = ?, preco_minimo = ?, quantidade_minima = ?, desconto_maximo = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        dados.preco, dados.preco_minimo || null, dados.quantidade_minima, dados.desconto_maximo, now,
        itemExiste.id
      ).run();

      return c.json({ success: true, message: 'Item atualizado', data: { id: itemExiste.id } });
    } else {
      // Inserir
      const id = crypto.randomUUID();

      await c.env.DB.prepare(`
        INSERT INTO tabelas_preco_itens (
          id, tabela_preco_id, produto_id, preco, preco_minimo, quantidade_minima, desconto_maximo, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, tabelaId, dados.produto_id, dados.preco, dados.preco_minimo || null,
        dados.quantidade_minima, dados.desconto_maximo, now, now
      ).run();

      return c.json({ success: true, message: 'Item adicionado', data: { id } }, 201);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: 'Dados inválidos', details: error.errors }, 400);
    }
    throw error;
  }
});

// DELETE /tabelas-preco/:id/itens/:produtoId - Remover item
tabelasPreco.delete('/:id/itens/:produtoId', requirePermission('produtos', 'editar_preco'), async (c) => {
  const usuario = c.get('usuario');
  const tabelaId = c.req.param('id');
  const produtoId = c.req.param('produtoId');

  // Verificar tabela
  const tabela = await c.env.DB.prepare(
    `SELECT id FROM tabelas_preco WHERE id = ? AND empresa_id = ?`
  ).bind(tabelaId, usuario.empresa_id).first();

  if (!tabela) {
    return c.json({ success: false, error: 'Tabela não encontrada' }, 404);
  }

  await c.env.DB.prepare(
    `DELETE FROM tabelas_preco_itens WHERE tabela_preco_id = ? AND produto_id = ?`
  ).bind(tabelaId, produtoId).run();

  return c.json({ success: true, message: 'Item removido' });
});

// DELETE /tabelas-preco/:id - Excluir tabela
tabelasPreco.delete('/:id', requirePermission('produtos', 'editar_preco'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  const tabela = await c.env.DB.prepare(
    `SELECT * FROM tabelas_preco WHERE id = ? AND empresa_id = ?`
  ).bind(id, usuario.empresa_id).first();

  if (!tabela) {
    return c.json({ success: false, error: 'Tabela não encontrada' }, 404);
  }

  // Verificar uso em clientes
  const emUso = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM clientes WHERE tabela_preco_id = ?`
  ).bind(id).first<{ total: number }>();

  if (emUso && emUso.total > 0) {
    return c.json({ 
      success: false, 
      error: `Tabela está vinculada a ${emUso.total} cliente(s). Remova os vínculos primeiro.` 
    }, 400);
  }

  // Excluir itens e tabela
  await c.env.DB.prepare(`DELETE FROM tabelas_preco_itens WHERE tabela_preco_id = ?`).bind(id).run();
  await c.env.DB.prepare(`DELETE FROM tabelas_preco WHERE id = ?`).bind(id).run();

  await registrarAuditoria(c.env.DB, {
    usuario_id: usuario.id,
    empresa_id: usuario.empresa_id,
    acao: 'excluir',
    entidade: 'tabelas_preco',
    entidade_id: id,
    dados_anteriores: tabela
  });

  return c.json({ success: true, message: 'Tabela excluída' });
});

export default tabelasPreco;
