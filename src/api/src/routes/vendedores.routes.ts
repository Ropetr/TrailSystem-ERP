// ============================================
// PLANAC ERP - Rotas de Vendedores
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const vendedores = new Hono<{ Bindings: Bindings; Variables: Variables }>();

vendedores.use('/*', requireAuth());

// Schemas
const vendedorSchema = z.object({
  usuario_id: z.string().uuid().optional(),
  codigo: z.string().max(20).optional(),
  nome: z.string().min(3).max(100),
  cpf: z.string().length(11).optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  comissao_padrao: z.number().min(0).max(100).default(0),
  meta_mensal: z.number().min(0).default(0),
  filial_id: z.string().uuid().optional(),
  supervisor_id: z.string().uuid().optional(),
  tipo: z.enum(['INTERNO', 'EXTERNO', 'REPRESENTANTE']).default('INTERNO'),
  data_admissao: z.string().optional(),
  data_demissao: z.string().optional(),
  observacao: z.string().optional(),
  ativo: z.boolean().default(true)
});

// GET /vendedores - Listar
vendedores.get('/', requirePermission('vendedores', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { page = '1', limit = '20', busca, ativo, tipo, filial_id } = c.req.query();

  let query = `SELECT v.*, u.nome as usuario_nome, f.nome as filial_nome
               FROM vendedores v
               LEFT JOIN usuarios u ON v.usuario_id = u.id
               LEFT JOIN filiais f ON v.filial_id = f.id
               WHERE v.empresa_id = ?`;
  const params: any[] = [usuario.empresa_id];

  if (busca) {
    query += ` AND (v.nome LIKE ? OR v.codigo LIKE ? OR v.email LIKE ?)`;
    const termo = `%${busca}%`;
    params.push(termo, termo, termo);
  }

  if (ativo !== undefined) {
    query += ` AND v.ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }

  if (tipo) {
    query += ` AND v.tipo = ?`;
    params.push(tipo);
  }

  if (filial_id) {
    query += ` AND v.filial_id = ?`;
    params.push(filial_id);
  }

  // Contagem
  const countQuery = query.replace(/SELECT v\.\*, .* FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();

  // Paginação
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  query += ` ORDER BY v.nome LIMIT ? OFFSET ?`;
  params.push(limitNum, (pageNum - 1) * limitNum);

  const result = await c.env.DB.prepare(query).bind(...params).all();

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

// GET /vendedores/:id - Buscar
vendedores.get('/:id', requirePermission('vendedores', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const vendedor = await c.env.DB.prepare(`
    SELECT v.*, u.nome as usuario_nome, u.email as usuario_email,
           f.nome as filial_nome, s.nome as supervisor_nome
    FROM vendedores v
    LEFT JOIN usuarios u ON v.usuario_id = u.id
    LEFT JOIN filiais f ON v.filial_id = f.id
    LEFT JOIN vendedores s ON v.supervisor_id = s.id
    WHERE v.id = ? AND v.empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!vendedor) {
    return c.json({ success: false, error: 'Vendedor não encontrado' }, 404);
  }

  // Estatísticas do vendedor
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_pedidos,
      COALESCE(SUM(valor_total), 0) as valor_total_vendas,
      COUNT(DISTINCT cliente_id) as total_clientes
    FROM pedidos 
    WHERE vendedor_id = ? AND status != 'CANCELADO'
  `).bind(id).first();

  // Comissões pendentes
  const comissoesPendentes = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(valor_comissao), 0) as total
    FROM comissoes_calculadas
    WHERE vendedor_id = ? AND status = 'PENDENTE'
  `).bind(id).first<{ total: number }>();

  return c.json({
    success: true,
    data: {
      ...vendedor,
      estatisticas: stats,
      comissoes_pendentes: comissoesPendentes?.total || 0
    }
  });
});

// POST /vendedores - Criar
vendedores.post('/', requirePermission('vendedores', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = vendedorSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;
  const id = crypto.randomUUID();

  // Gerar código automático se não informado
  let codigo = data.codigo;
  if (!codigo) {
    const ultimoCodigo = await c.env.DB.prepare(`
      SELECT codigo FROM vendedores WHERE empresa_id = ? ORDER BY codigo DESC LIMIT 1
    `).bind(usuario.empresa_id).first<{ codigo: string }>();
    
    const num = ultimoCodigo?.codigo ? parseInt(ultimoCodigo.codigo) + 1 : 1;
    codigo = num.toString().padStart(4, '0');
  }

  await c.env.DB.prepare(`
    INSERT INTO vendedores (
      id, empresa_id, usuario_id, codigo, nome, cpf, email, telefone, celular,
      comissao_padrao, meta_mensal, filial_id, supervisor_id, tipo,
      data_admissao, data_demissao, observacao, ativo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, usuario.empresa_id, data.usuario_id || null, codigo, data.nome,
    data.cpf || null, data.email || null, data.telefone || null, data.celular || null,
    data.comissao_padrao, data.meta_mensal, data.filial_id || null,
    data.supervisor_id || null, data.tipo, data.data_admissao || null,
    data.data_demissao || null, data.observacao || null, data.ativo ? 1 : 0
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'vendedores',
    entidade_id: id,
    dados_novos: { ...data, codigo }
  });

  return c.json({ success: true, data: { id, codigo } }, 201);
});

// PUT /vendedores/:id - Atualizar
vendedores.put('/:id', requirePermission('vendedores', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const vendedorAtual = await c.env.DB.prepare(`
    SELECT * FROM vendedores WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!vendedorAtual) {
    return c.json({ success: false, error: 'Vendedor não encontrado' }, 404);
  }

  const validation = vendedorSchema.partial().safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  await c.env.DB.prepare(`
    UPDATE vendedores SET
      usuario_id = COALESCE(?, usuario_id),
      nome = COALESCE(?, nome),
      cpf = COALESCE(?, cpf),
      email = COALESCE(?, email),
      telefone = COALESCE(?, telefone),
      celular = COALESCE(?, celular),
      comissao_padrao = COALESCE(?, comissao_padrao),
      meta_mensal = COALESCE(?, meta_mensal),
      filial_id = COALESCE(?, filial_id),
      supervisor_id = COALESCE(?, supervisor_id),
      tipo = COALESCE(?, tipo),
      data_admissao = COALESCE(?, data_admissao),
      data_demissao = COALESCE(?, data_demissao),
      observacao = COALESCE(?, observacao),
      ativo = COALESCE(?, ativo),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(
    data.usuario_id, data.nome, data.cpf, data.email, data.telefone, data.celular,
    data.comissao_padrao, data.meta_mensal, data.filial_id, data.supervisor_id,
    data.tipo, data.data_admissao, data.data_demissao, data.observacao,
    data.ativo !== undefined ? (data.ativo ? 1 : 0) : null,
    id, usuario.empresa_id
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'ATUALIZAR',
    entidade: 'vendedores',
    entidade_id: id,
    dados_anteriores: vendedorAtual,
    dados_novos: data
  });

  return c.json({ success: true, message: 'Vendedor atualizado' });
});

// DELETE /vendedores/:id - Excluir (soft delete)
vendedores.delete('/:id', requirePermission('vendedores', 'excluir'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const vendedor = await c.env.DB.prepare(`
    SELECT * FROM vendedores WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!vendedor) {
    return c.json({ success: false, error: 'Vendedor não encontrado' }, 404);
  }

  // Verificar vínculos
  const pedidos = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM pedidos WHERE vendedor_id = ?
  `).bind(id).first<{ total: number }>();

  if (pedidos && pedidos.total > 0) {
    // Soft delete - apenas inativar
    await c.env.DB.prepare(`
      UPDATE vendedores SET ativo = 0, deleted_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(id).run();
  } else {
    // Hard delete se não tiver vínculos
    await c.env.DB.prepare(`DELETE FROM vendedores WHERE id = ?`).bind(id).run();
  }

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'EXCLUIR',
    entidade: 'vendedores',
    entidade_id: id,
    dados_anteriores: vendedor
  });

  return c.json({ success: true, message: 'Vendedor excluído' });
});

// GET /vendedores/:id/comissoes - Comissões do vendedor
vendedores.get('/:id/comissoes', requirePermission('vendedores', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const { mes, ano, status } = c.req.query();

  let query = `
    SELECT cc.*, p.numero as pedido_numero, c.razao_social as cliente_nome
    FROM comissoes_calculadas cc
    JOIN pedidos p ON cc.pedido_id = p.id
    JOIN clientes c ON p.cliente_id = c.id
    WHERE cc.vendedor_id = ? AND cc.empresa_id = ?
  `;
  const params: any[] = [id, usuario.empresa_id];

  if (mes && ano) {
    query += ` AND strftime('%m', cc.created_at) = ? AND strftime('%Y', cc.created_at) = ?`;
    params.push(mes.padStart(2, '0'), ano);
  }

  if (status) {
    query += ` AND cc.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY cc.created_at DESC`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  // Totais
  const totais = await c.env.DB.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'PENDENTE' THEN valor_comissao ELSE 0 END) as pendente,
      SUM(CASE WHEN status = 'PAGO' THEN valor_comissao ELSE 0 END) as pago,
      SUM(valor_comissao) as total
    FROM comissoes_calculadas
    WHERE vendedor_id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  return c.json({
    success: true,
    data: result.results,
    totais
  });
});

// GET /vendedores/:id/metas - Metas e desempenho
vendedores.get('/:id/metas', requirePermission('vendedores', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const { ano } = c.req.query();

  const anoAtual = ano || new Date().getFullYear().toString();

  // Vendas por mês
  const vendasMes = await c.env.DB.prepare(`
    SELECT 
      strftime('%m', created_at) as mes,
      COUNT(*) as quantidade,
      SUM(valor_total) as valor
    FROM pedidos
    WHERE vendedor_id = ? AND strftime('%Y', created_at) = ? AND status != 'CANCELADO'
    GROUP BY strftime('%m', created_at)
    ORDER BY mes
  `).bind(id, anoAtual).all();

  // Meta mensal do vendedor
  const vendedor = await c.env.DB.prepare(`
    SELECT meta_mensal FROM vendedores WHERE id = ?
  `).bind(id).first<{ meta_mensal: number }>();

  return c.json({
    success: true,
    data: {
      ano: anoAtual,
      meta_mensal: vendedor?.meta_mensal || 0,
      vendas_por_mes: vendasMes.results
    }
  });
});

export default vendedores;
