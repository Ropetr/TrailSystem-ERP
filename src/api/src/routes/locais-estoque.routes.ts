// ============================================
// PLANAC ERP - Rotas de Locais de Estoque
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const locaisEstoque = new Hono<{ Bindings: Bindings; Variables: Variables }>();

locaisEstoque.use('/*', requireAuth());

// Schemas
const localEstoqueSchema = z.object({
  filial_id: z.string().uuid(),
  codigo: z.string().max(20),
  nome: z.string().min(2).max(100),
  tipo: z.enum(['ALMOXARIFADO', 'PRATELEIRA', 'CORREDOR', 'GAVETA', 'PATIO', 'TRANSITO', 'AVARIADO', 'DEVOLUCAO']).default('ALMOXARIFADO'),
  local_pai_id: z.string().uuid().optional(),
  capacidade_maxima: z.number().min(0).optional(),
  unidade_capacidade: z.string().optional(),
  permite_negativo: z.boolean().default(false),
  bloqueado: z.boolean().default(false),
  motivo_bloqueio: z.string().optional(),
  endereco: z.string().optional(),
  observacao: z.string().optional(),
  ativo: z.boolean().default(true)
});

// GET /locais-estoque - Listar
locaisEstoque.get('/', requirePermission('estoque', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { filial_id, tipo, ativo, flat } = c.req.query();

  let query = `
    SELECT le.*, f.nome as filial_nome, lp.nome as local_pai_nome
    FROM locais_estoque le
    JOIN filiais f ON le.filial_id = f.id
    LEFT JOIN locais_estoque lp ON le.local_pai_id = lp.id
    WHERE le.empresa_id = ?
  `;
  const params: any[] = [usuario.empresa_id];

  if (filial_id) {
    query += ` AND le.filial_id = ?`;
    params.push(filial_id);
  }

  if (tipo) {
    query += ` AND le.tipo = ?`;
    params.push(tipo);
  }

  if (ativo !== undefined) {
    query += ` AND le.ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }

  query += ` ORDER BY f.nome, le.codigo`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  // Se flat=true, retorna lista plana
  if (flat === 'true') {
    return c.json({ success: true, data: result.results });
  }

  // Montar árvore hierárquica por filial
  const porFilial = new Map();
  
  result.results.forEach((local: any) => {
    if (!porFilial.has(local.filial_id)) {
      porFilial.set(local.filial_id, {
        filial_id: local.filial_id,
        filial_nome: local.filial_nome,
        locais: []
      });
    }
    porFilial.get(local.filial_id).locais.push(local);
  });

  return c.json({ success: true, data: Array.from(porFilial.values()) });
});

// GET /locais-estoque/:id - Buscar
locaisEstoque.get('/:id', requirePermission('estoque', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const local = await c.env.DB.prepare(`
    SELECT le.*, f.nome as filial_nome, lp.nome as local_pai_nome
    FROM locais_estoque le
    JOIN filiais f ON le.filial_id = f.id
    LEFT JOIN locais_estoque lp ON le.local_pai_id = lp.id
    WHERE le.id = ? AND le.empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!local) {
    return c.json({ success: false, error: 'Local não encontrado' }, 404);
  }

  // Sublocais
  const sublocais = await c.env.DB.prepare(`
    SELECT * FROM locais_estoque WHERE local_pai_id = ? ORDER BY codigo
  `).bind(id).all();

  // Resumo de estoque
  const resumoEstoque = await c.env.DB.prepare(`
    SELECT 
      COUNT(DISTINCT produto_id) as total_produtos,
      SUM(quantidade) as quantidade_total,
      SUM(quantidade * custo_medio) as valor_total
    FROM estoque WHERE local_id = ?
  `).bind(id).first();

  return c.json({
    success: true,
    data: {
      ...local,
      sublocais: sublocais.results,
      resumo_estoque: resumoEstoque
    }
  });
});

// POST /locais-estoque - Criar
locaisEstoque.post('/', requirePermission('estoque', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = localEstoqueSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;
  const id = crypto.randomUUID();

  // Verificar código duplicado na mesma filial
  const existente = await c.env.DB.prepare(`
    SELECT id FROM locais_estoque WHERE empresa_id = ? AND filial_id = ? AND codigo = ?
  `).bind(usuario.empresa_id, data.filial_id, data.codigo).first();

  if (existente) {
    return c.json({ success: false, error: 'Código já existe nesta filial' }, 400);
  }

  await c.env.DB.prepare(`
    INSERT INTO locais_estoque (
      id, empresa_id, filial_id, codigo, nome, tipo, local_pai_id,
      capacidade_maxima, unidade_capacidade, permite_negativo,
      bloqueado, motivo_bloqueio, endereco, observacao, ativo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, usuario.empresa_id, data.filial_id, data.codigo, data.nome, data.tipo,
    data.local_pai_id || null, data.capacidade_maxima || null,
    data.unidade_capacidade || null, data.permite_negativo ? 1 : 0,
    data.bloqueado ? 1 : 0, data.motivo_bloqueio || null,
    data.endereco || null, data.observacao || null, data.ativo ? 1 : 0
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'locais_estoque',
    entidade_id: id,
    dados_novos: data
  });

  return c.json({ success: true, data: { id } }, 201);
});

// PUT /locais-estoque/:id - Atualizar
locaisEstoque.put('/:id', requirePermission('estoque', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const localAtual = await c.env.DB.prepare(`
    SELECT * FROM locais_estoque WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!localAtual) {
    return c.json({ success: false, error: 'Local não encontrado' }, 404);
  }

  const validation = localEstoqueSchema.partial().safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  await c.env.DB.prepare(`
    UPDATE locais_estoque SET
      nome = COALESCE(?, nome),
      tipo = COALESCE(?, tipo),
      local_pai_id = COALESCE(?, local_pai_id),
      capacidade_maxima = COALESCE(?, capacidade_maxima),
      unidade_capacidade = COALESCE(?, unidade_capacidade),
      permite_negativo = COALESCE(?, permite_negativo),
      bloqueado = COALESCE(?, bloqueado),
      motivo_bloqueio = COALESCE(?, motivo_bloqueio),
      endereco = COALESCE(?, endereco),
      observacao = COALESCE(?, observacao),
      ativo = COALESCE(?, ativo),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(
    data.nome, data.tipo, data.local_pai_id, data.capacidade_maxima,
    data.unidade_capacidade, data.permite_negativo !== undefined ? (data.permite_negativo ? 1 : 0) : null,
    data.bloqueado !== undefined ? (data.bloqueado ? 1 : 0) : null, data.motivo_bloqueio,
    data.endereco, data.observacao, data.ativo !== undefined ? (data.ativo ? 1 : 0) : null,
    id, usuario.empresa_id
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'ATUALIZAR',
    entidade: 'locais_estoque',
    entidade_id: id,
    dados_anteriores: localAtual,
    dados_novos: data
  });

  return c.json({ success: true, message: 'Local atualizado' });
});

// DELETE /locais-estoque/:id - Excluir
locaisEstoque.delete('/:id', requirePermission('estoque', 'excluir'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const local = await c.env.DB.prepare(`
    SELECT * FROM locais_estoque WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!local) {
    return c.json({ success: false, error: 'Local não encontrado' }, 404);
  }

  // Verificar estoque
  const estoque = await c.env.DB.prepare(`
    SELECT SUM(quantidade) as total FROM estoque WHERE local_id = ?
  `).bind(id).first<{ total: number }>();

  if (estoque && estoque.total > 0) {
    return c.json({ success: false, error: 'Local possui estoque. Transfira os produtos primeiro.' }, 400);
  }

  // Verificar sublocais
  const sublocais = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM locais_estoque WHERE local_pai_id = ?
  `).bind(id).first<{ total: number }>();

  if (sublocais && sublocais.total > 0) {
    return c.json({ success: false, error: 'Local possui sublocais. Remova-os primeiro.' }, 400);
  }

  await c.env.DB.prepare(`DELETE FROM locais_estoque WHERE id = ?`).bind(id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'EXCLUIR',
    entidade: 'locais_estoque',
    entidade_id: id,
    dados_anteriores: local
  });

  return c.json({ success: true, message: 'Local excluído' });
});

// POST /locais-estoque/:id/bloquear - Bloquear/Desbloquear
locaisEstoque.post('/:id/bloquear', requirePermission('estoque', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const { bloqueado, motivo } = await c.req.json();

  await c.env.DB.prepare(`
    UPDATE locais_estoque SET 
      bloqueado = ?, 
      motivo_bloqueio = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(bloqueado ? 1 : 0, motivo || null, id, usuario.empresa_id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: bloqueado ? 'BLOQUEAR' : 'DESBLOQUEAR',
    entidade: 'locais_estoque',
    entidade_id: id,
    dados_novos: { bloqueado, motivo }
  });

  return c.json({ success: true, message: bloqueado ? 'Local bloqueado' : 'Local desbloqueado' });
});

// GET /locais-estoque/:id/produtos - Produtos no local
locaisEstoque.get('/:id/produtos', requirePermission('estoque', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const { page = '1', limit = '50' } = c.req.query();

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const result = await c.env.DB.prepare(`
    SELECT e.*, p.codigo as produto_codigo, p.descricao as produto_descricao,
           p.unidade, p.preco_venda
    FROM estoque e
    JOIN produtos p ON e.produto_id = p.id
    WHERE e.local_id = ? AND e.empresa_id = ?
    ORDER BY p.descricao
    LIMIT ? OFFSET ?
  `).bind(id, usuario.empresa_id, limitNum, (pageNum - 1) * limitNum).all();

  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM estoque WHERE local_id = ?
  `).bind(id).first<{ total: number }>();

  return c.json({
    success: true,
    data: result.results,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: countResult?.total || 0,
      pages: Math.ceil((countResult?.total || 0) / limitNum)
    }
  });
});

export default locaisEstoque;
