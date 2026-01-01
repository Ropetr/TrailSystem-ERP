// ============================================
// PLANAC ERP - Rotas de Centros de Custo
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const centrosCusto = new Hono<{ Bindings: Bindings; Variables: Variables }>();

centrosCusto.use('/*', requireAuth());

// Schemas
const centroCustoSchema = z.object({
  codigo: z.string().min(1).max(20),
  nome: z.string().min(2).max(100),
  descricao: z.string().optional(),
  centro_pai_id: z.string().uuid().optional().nullable(),
  tipo: z.enum(['DEPARTAMENTO', 'FILIAL', 'PROJETO', 'PRODUTO', 'CLIENTE', 'ATIVIDADE']).default('DEPARTAMENTO'),
  aceita_lancamento: z.boolean().default(true),
  responsavel_id: z.string().uuid().optional().nullable(),
  orcamento_mensal: z.number().min(0).default(0),
  filial_id: z.string().uuid().optional().nullable(),
  data_inicio: z.string().optional().nullable(),
  data_fim: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  ativo: z.boolean().default(true)
});

// GET /centros-custo - Listar todos
centrosCusto.get('/', requirePermission('financeiro', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { busca, ativo, hierarquia } = c.req.query();

  let query = `
    SELECT 
      cc.*,
      cp.nome as centro_pai_nome,
      cp.codigo as centro_pai_codigo,
      (SELECT COUNT(*) FROM centros_custo sub WHERE sub.centro_pai_id = cc.id) as total_filhos
    FROM centros_custo cc
    LEFT JOIN centros_custo cp ON cc.centro_pai_id = cp.id
    WHERE cc.empresa_id = ?
  `;
  const params: any[] = [usuario.empresa_id];

  if (busca) {
    query += ` AND (cc.codigo LIKE ? OR cc.nome LIKE ?)`;
    params.push(`%${busca}%`, `%${busca}%`);
  }

  if (ativo !== undefined) {
    query += ` AND cc.ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }

  // Se hierarquia=true, ordenar para exibir em arvore
  if (hierarquia === 'true') {
    query += ` ORDER BY cc.centro_pai_id NULLS FIRST, cc.codigo`;
  } else {
    query += ` ORDER BY cc.codigo`;
  }

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results
  });
});

// GET /centros-custo/arvore - Retornar em formato de arvore
centrosCusto.get('/arvore', requirePermission('financeiro', 'listar'), async (c) => {
  const usuario = c.get('usuario');

  const result = await c.env.DB.prepare(`
    SELECT * FROM centros_custo
    WHERE empresa_id = ? AND ativo = 1
    ORDER BY codigo
  `).bind(usuario.empresa_id).all();

  // Montar arvore
  const centros = result.results as any[];
  const map = new Map();
  const roots: any[] = [];

  centros.forEach(centro => {
    map.set(centro.id, { ...centro, filhos: [] });
  });

  centros.forEach(centro => {
    const node = map.get(centro.id);
    if (centro.centro_pai_id && map.has(centro.centro_pai_id)) {
      map.get(centro.centro_pai_id).filhos.push(node);
    } else {
      roots.push(node);
    }
  });

  return c.json({ success: true, data: roots });
});

// GET /centros-custo/:id - Buscar por ID
centrosCusto.get('/:id', requirePermission('financeiro', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const centro = await c.env.DB.prepare(`
    SELECT 
      cc.*,
      cp.nome as centro_pai_nome,
      cp.codigo as centro_pai_codigo
    FROM centros_custo cc
    LEFT JOIN centros_custo cp ON cc.centro_pai_id = cp.id
    WHERE cc.id = ? AND cc.empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!centro) {
    return c.json({ success: false, error: 'Centro de custo nao encontrado' }, 404);
  }

  // Buscar filhos
  const filhos = await c.env.DB.prepare(`
    SELECT id, codigo, nome, ativo FROM centros_custo
    WHERE centro_pai_id = ? AND empresa_id = ?
    ORDER BY codigo
  `).bind(id, usuario.empresa_id).all();

  // Estatisticas de uso
  const estatisticas = await c.env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM contas_pagar WHERE centro_custo_id = ?) as contas_pagar,
      (SELECT COUNT(*) FROM contas_receber WHERE centro_custo_id = ?) as contas_receber,
      (SELECT COUNT(*) FROM lancamentos_contabeis WHERE centro_custo_id = ?) as lancamentos
  `).bind(id, id, id).first();

  return c.json({
    success: true,
    data: {
      ...centro,
      filhos: filhos.results,
      estatisticas
    }
  });
});

// POST /centros-custo - Criar
centrosCusto.post('/', requirePermission('financeiro', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = centroCustoSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados invalidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  // Verificar codigo duplicado
  const existe = await c.env.DB.prepare(`
    SELECT id FROM centros_custo WHERE empresa_id = ? AND codigo = ?
  `).bind(usuario.empresa_id, data.codigo).first();

  if (existe) {
    return c.json({ success: false, error: 'Codigo ja cadastrado' }, 400);
  }

  // Verificar centro pai
  let nivel = 1;
  if (data.centro_pai_id) {
    const pai = await c.env.DB.prepare(`
      SELECT id, nivel FROM centros_custo WHERE id = ? AND empresa_id = ?
    `).bind(data.centro_pai_id, usuario.empresa_id).first<{ id: string; nivel: number }>();

    if (!pai) {
      return c.json({ success: false, error: 'Centro de custo pai nao encontrado' }, 400);
    }
    nivel = pai.nivel + 1;
  }

  const id = crypto.randomUUID();

    await c.env.DB.prepare(`
      INSERT INTO centros_custo (
        id, empresa_id, codigo, nome, descricao, centro_pai_id, nivel, tipo,
        aceita_lancamento, responsavel_id, orcamento_mensal, filial_id,
        data_inicio, data_fim, observacoes, ativo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, usuario.empresa_id, data.codigo, data.nome, data.descricao || null,
      data.centro_pai_id || null, nivel, data.tipo || 'DEPARTAMENTO',
      data.aceita_lancamento !== false ? 1 : 0, data.responsavel_id || null,
      data.orcamento_mensal || 0, data.filial_id || null,
      data.data_inicio || null, data.data_fim || null, data.observacoes || null,
      data.ativo ? 1 : 0
    ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'centros_custo',
    entidade_id: id,
    dados_novos: data
  });

  return c.json({ success: true, data: { id } }, 201);
});

// PUT /centros-custo/:id - Atualizar
centrosCusto.put('/:id', requirePermission('financeiro', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const centroAtual = await c.env.DB.prepare(`
    SELECT * FROM centros_custo WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!centroAtual) {
    return c.json({ success: false, error: 'Centro de custo nao encontrado' }, 404);
  }

  const validation = centroCustoSchema.partial().safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados invalidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  // Verificar codigo duplicado
  if (data.codigo) {
    const existe = await c.env.DB.prepare(`
      SELECT id FROM centros_custo WHERE empresa_id = ? AND codigo = ? AND id != ?
    `).bind(usuario.empresa_id, data.codigo, id).first();

    if (existe) {
      return c.json({ success: false, error: 'Codigo ja cadastrado para outro centro de custo' }, 400);
    }
  }

  // Verificar centro pai (nao pode ser ele mesmo ou um filho)
  let nivel = (centroAtual as any).nivel;
  if (data.centro_pai_id !== undefined) {
    if (data.centro_pai_id === id) {
      return c.json({ success: false, error: 'Centro de custo nao pode ser pai de si mesmo' }, 400);
    }

    if (data.centro_pai_id) {
      const pai = await c.env.DB.prepare(`
        SELECT id, nivel FROM centros_custo WHERE id = ? AND empresa_id = ?
      `).bind(data.centro_pai_id, usuario.empresa_id).first<{ id: string; nivel: number }>();

      if (!pai) {
        return c.json({ success: false, error: 'Centro de custo pai nao encontrado' }, 400);
      }
      nivel = pai.nivel + 1;
    } else {
      nivel = 1;
    }
  }

    await c.env.DB.prepare(`
      UPDATE centros_custo SET
        codigo = COALESCE(?, codigo),
        nome = COALESCE(?, nome),
        descricao = COALESCE(?, descricao),
        centro_pai_id = ?,
        nivel = ?,
        tipo = COALESCE(?, tipo),
        aceita_lancamento = COALESCE(?, aceita_lancamento),
        responsavel_id = COALESCE(?, responsavel_id),
        orcamento_mensal = COALESCE(?, orcamento_mensal),
        filial_id = COALESCE(?, filial_id),
        data_inicio = COALESCE(?, data_inicio),
        data_fim = COALESCE(?, data_fim),
        observacoes = COALESCE(?, observacoes),
        ativo = COALESCE(?, ativo),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND empresa_id = ?
    `).bind(
      data.codigo, data.nome, data.descricao,
      data.centro_pai_id !== undefined ? data.centro_pai_id : (centroAtual as any).centro_pai_id,
      nivel,
      data.tipo, data.aceita_lancamento !== undefined ? (data.aceita_lancamento ? 1 : 0) : null,
      data.responsavel_id, data.orcamento_mensal, data.filial_id,
      data.data_inicio, data.data_fim, data.observacoes,
      data.ativo !== undefined ? (data.ativo ? 1 : 0) : null,
      id, usuario.empresa_id
    ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'EDITAR',
    entidade: 'centros_custo',
    entidade_id: id,
    dados_anteriores: centroAtual,
    dados_novos: data
  });

  return c.json({ success: true });
});

// DELETE /centros-custo/:id - Excluir
centrosCusto.delete('/:id', requirePermission('financeiro', 'excluir'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const centro = await c.env.DB.prepare(`
    SELECT * FROM centros_custo WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!centro) {
    return c.json({ success: false, error: 'Centro de custo nao encontrado' }, 404);
  }

  // Verificar se tem filhos
  const temFilhos = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM centros_custo WHERE centro_pai_id = ?
  `).bind(id).first<{ total: number }>();

  if (temFilhos && temFilhos.total > 0) {
    return c.json({ success: false, error: 'Centro de custo possui subcentros. Remova-os primeiro.' }, 400);
  }

  // Verificar se esta em uso
  const emUso = await c.env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM contas_pagar WHERE centro_custo_id = ?) +
      (SELECT COUNT(*) FROM contas_receber WHERE centro_custo_id = ?) as total
  `).bind(id, id).first<{ total: number }>();

  if (emUso && emUso.total > 0) {
    return c.json({ success: false, error: 'Centro de custo esta em uso e nao pode ser excluido' }, 400);
  }

  await c.env.DB.prepare(`
    DELETE FROM centros_custo WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'EXCLUIR',
    entidade: 'centros_custo',
    entidade_id: id,
    dados_anteriores: centro
  });

  return c.json({ success: true });
});

export default centrosCusto;
