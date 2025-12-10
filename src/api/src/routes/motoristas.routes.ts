// ============================================
// PLANAC ERP - Rotas de Motoristas
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const motoristas = new Hono<{ Bindings: Bindings; Variables: Variables }>();

motoristas.use('/*', requireAuth());

// Schemas
const motoristaSchema = z.object({
  nome: z.string().min(3).max(100),
  cpf: z.string().length(11),
  rg: z.string().optional(),
  cnh: z.string().optional(),
  categoria_cnh: z.enum(['A', 'B', 'AB', 'C', 'D', 'E', 'AC', 'AD', 'AE']).optional(),
  validade_cnh: z.string().optional(),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().email().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2).optional(),
  cep: z.string().optional(),
  data_admissao: z.string().optional(),
  salario: z.number().optional(),
  tipo: z.enum(['PROPRIO', 'TERCEIRO', 'AGREGADO']).default('PROPRIO'),
  ativo: z.boolean().default(true)
});

// GET /motoristas - Listar
motoristas.get('/', requirePermission('logistica', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { busca, tipo, ativo, page = '1', limit = '20' } = c.req.query();

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT 
      m.*,
      (SELECT COUNT(*) FROM veiculos_motoristas vm WHERE vm.motorista_id = m.id AND vm.ativo = 1) as veiculos_vinculados,
      (SELECT COUNT(*) FROM entregas e WHERE e.motorista_id = m.id AND e.status = 'ENTREGUE') as entregas_realizadas
    FROM motoristas m
    WHERE m.empresa_id = ?
  `;
  const params: any[] = [usuario.empresa_id];

  if (busca) {
    query += ` AND (m.nome LIKE ? OR m.cpf LIKE ?)`;
    params.push(`%${busca}%`, `%${busca}%`);
  }

  if (tipo) {
    query += ` AND m.tipo = ?`;
    params.push(tipo);
  }

  if (ativo !== undefined) {
    query += ` AND m.ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }

  // Count total
  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
  const totalResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();

  query += ` ORDER BY m.nome LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalResult?.total || 0,
      pages: Math.ceil((totalResult?.total || 0) / parseInt(limit))
    }
  });
});

// GET /motoristas/disponiveis - Disponíveis para entrega
motoristas.get('/disponiveis', requirePermission('logistica', 'listar'), async (c) => {
  const usuario = c.get('usuario');

  // Motoristas sem entregas em andamento hoje
  const result = await c.env.DB.prepare(`
    SELECT 
      m.*,
      v.placa as veiculo_atual_placa,
      v.modelo as veiculo_atual_modelo
    FROM motoristas m
    LEFT JOIN veiculos_motoristas vm ON m.id = vm.motorista_id AND vm.ativo = 1
    LEFT JOIN veiculos v ON vm.veiculo_id = v.id
    WHERE m.empresa_id = ? 
      AND m.ativo = 1
      AND m.id NOT IN (
        SELECT DISTINCT motorista_id FROM entregas 
        WHERE empresa_id = ? 
          AND DATE(data_entrega) = DATE('now')
          AND status IN ('EM_TRANSITO', 'EM_SEPARACAO')
      )
    ORDER BY m.nome
  `).bind(usuario.empresa_id, usuario.empresa_id).all();

  return c.json({ success: true, data: result.results });
});

// GET /motoristas/:id - Buscar
motoristas.get('/:id', requirePermission('logistica', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const motorista = await c.env.DB.prepare(`
    SELECT * FROM motoristas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!motorista) {
    return c.json({ success: false, error: 'Motorista não encontrado' }, 404);
  }

  // Veículos vinculados
  const veiculos = await c.env.DB.prepare(`
    SELECT 
      v.*,
      vm.ativo as vinculo_ativo,
      vm.data_inicio,
      vm.data_fim
    FROM veiculos v
    JOIN veiculos_motoristas vm ON v.id = vm.veiculo_id
    WHERE vm.motorista_id = ?
    ORDER BY vm.ativo DESC, vm.data_inicio DESC
  `).bind(id).all();

  // Estatísticas de entregas
  const estatisticas = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_entregas,
      SUM(CASE WHEN status = 'ENTREGUE' THEN 1 ELSE 0 END) as entregas_sucesso,
      SUM(CASE WHEN status = 'NAO_ENTREGUE' THEN 1 ELSE 0 END) as entregas_falha,
      AVG(CASE 
        WHEN status = 'ENTREGUE' AND data_entrega_real IS NOT NULL 
        THEN julianday(data_entrega_real) - julianday(data_saida)
        ELSE NULL 
      END) * 24 as tempo_medio_horas
    FROM entregas
    WHERE motorista_id = ?
  `).bind(id).first();

  // Últimas entregas
  const ultimasEntregas = await c.env.DB.prepare(`
    SELECT 
      e.*,
      c.razao_social as cliente_nome
    FROM entregas e
    LEFT JOIN clientes c ON e.cliente_id = c.id
    WHERE e.motorista_id = ?
    ORDER BY e.created_at DESC
    LIMIT 10
  `).bind(id).all();

  return c.json({
    success: true,
    data: {
      ...motorista,
      veiculos: veiculos.results,
      estatisticas,
      ultimas_entregas: ultimasEntregas.results
    }
  });
});

// POST /motoristas - Criar
motoristas.post('/', requirePermission('logistica', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = motoristaSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  // Verificar CPF duplicado
  const existe = await c.env.DB.prepare(`
    SELECT id FROM motoristas WHERE empresa_id = ? AND cpf = ?
  `).bind(usuario.empresa_id, data.cpf).first();

  if (existe) {
    return c.json({ success: false, error: 'CPF já cadastrado' }, 400);
  }

  const id = crypto.randomUUID();

  // Gerar código sequencial
  const seq = await c.env.DB.prepare(`
    SELECT COALESCE(MAX(CAST(codigo AS INTEGER)), 0) + 1 as proximo
    FROM motoristas WHERE empresa_id = ?
  `).bind(usuario.empresa_id).first<{ proximo: number }>();

  const codigo = String(seq?.proximo || 1).padStart(4, '0');

  await c.env.DB.prepare(`
    INSERT INTO motoristas (
      id, empresa_id, codigo, nome, cpf, rg, cnh, categoria_cnh, validade_cnh,
      telefone, celular, email, endereco, numero, complemento, bairro, cidade, uf, cep,
      data_admissao, salario, tipo, ativo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, usuario.empresa_id, codigo, data.nome, data.cpf, data.rg || null,
    data.cnh || null, data.categoria_cnh || null, data.validade_cnh || null,
    data.telefone || null, data.celular || null, data.email || null,
    data.endereco || null, data.numero || null, data.complemento || null,
    data.bairro || null, data.cidade || null, data.uf || null, data.cep || null,
    data.data_admissao || null, data.salario || null, data.tipo, data.ativo ? 1 : 0
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'motoristas',
    entidade_id: id,
    dados_novos: data
  });

  return c.json({ success: true, data: { id, codigo } }, 201);
});

// PUT /motoristas/:id - Atualizar
motoristas.put('/:id', requirePermission('logistica', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const motoristaAtual = await c.env.DB.prepare(`
    SELECT * FROM motoristas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!motoristaAtual) {
    return c.json({ success: false, error: 'Motorista não encontrado' }, 404);
  }

  const validation = motoristaSchema.partial().safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  // Verificar CPF duplicado
  if (data.cpf) {
    const existe = await c.env.DB.prepare(`
      SELECT id FROM motoristas WHERE empresa_id = ? AND cpf = ? AND id != ?
    `).bind(usuario.empresa_id, data.cpf, id).first();

    if (existe) {
      return c.json({ success: false, error: 'CPF já cadastrado para outro motorista' }, 400);
    }
  }

  await c.env.DB.prepare(`
    UPDATE motoristas SET
      nome = COALESCE(?, nome),
      cpf = COALESCE(?, cpf),
      rg = COALESCE(?, rg),
      cnh = COALESCE(?, cnh),
      categoria_cnh = COALESCE(?, categoria_cnh),
      validade_cnh = COALESCE(?, validade_cnh),
      telefone = COALESCE(?, telefone),
      celular = COALESCE(?, celular),
      email = COALESCE(?, email),
      endereco = COALESCE(?, endereco),
      numero = COALESCE(?, numero),
      complemento = COALESCE(?, complemento),
      bairro = COALESCE(?, bairro),
      cidade = COALESCE(?, cidade),
      uf = COALESCE(?, uf),
      cep = COALESCE(?, cep),
      data_admissao = COALESCE(?, data_admissao),
      salario = COALESCE(?, salario),
      tipo = COALESCE(?, tipo),
      ativo = COALESCE(?, ativo),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(
    data.nome, data.cpf, data.rg, data.cnh, data.categoria_cnh, data.validade_cnh,
    data.telefone, data.celular, data.email, data.endereco, data.numero, data.complemento,
    data.bairro, data.cidade, data.uf, data.cep, data.data_admissao, data.salario,
    data.tipo, data.ativo !== undefined ? (data.ativo ? 1 : 0) : null,
    id, usuario.empresa_id
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'ATUALIZAR',
    entidade: 'motoristas',
    entidade_id: id,
    dados_anteriores: motoristaAtual,
    dados_novos: data
  });

  return c.json({ success: true, message: 'Motorista atualizado' });
});

// POST /motoristas/:id/vincular-veiculo - Vincular veículo
motoristas.post('/:id/vincular-veiculo', requirePermission('logistica', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const motorista = await c.env.DB.prepare(`
    SELECT id FROM motoristas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!motorista) {
    return c.json({ success: false, error: 'Motorista não encontrado' }, 404);
  }

  const { veiculo_id } = body;
  if (!veiculo_id) {
    return c.json({ success: false, error: 'Informe o veículo' }, 400);
  }

  const veiculo = await c.env.DB.prepare(`
    SELECT id FROM veiculos WHERE id = ? AND empresa_id = ?
  `).bind(veiculo_id, usuario.empresa_id).first();

  if (!veiculo) {
    return c.json({ success: false, error: 'Veículo não encontrado' }, 404);
  }

  // Desativar vínculos anteriores do motorista
  await c.env.DB.prepare(`
    UPDATE veiculos_motoristas SET ativo = 0, data_fim = DATE('now')
    WHERE motorista_id = ? AND ativo = 1
  `).bind(id).run();

  // Desativar vínculos anteriores do veículo
  await c.env.DB.prepare(`
    UPDATE veiculos_motoristas SET ativo = 0, data_fim = DATE('now')
    WHERE veiculo_id = ? AND ativo = 1
  `).bind(veiculo_id).run();

  // Criar novo vínculo
  const vinculoId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO veiculos_motoristas (id, veiculo_id, motorista_id, data_inicio, ativo)
    VALUES (?, ?, ?, DATE('now'), 1)
  `).bind(vinculoId, veiculo_id, id).run();

  return c.json({ success: true, message: 'Veículo vinculado ao motorista' });
});

// POST /motoristas/:id/desvincular-veiculo - Desvincular veículo
motoristas.post('/:id/desvincular-veiculo', requirePermission('logistica', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const motorista = await c.env.DB.prepare(`
    SELECT id FROM motoristas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!motorista) {
    return c.json({ success: false, error: 'Motorista não encontrado' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE veiculos_motoristas SET ativo = 0, data_fim = DATE('now')
    WHERE motorista_id = ? AND ativo = 1
  `).bind(id).run();

  return c.json({ success: true, message: 'Veículo desvinculado' });
});

// DELETE /motoristas/:id - Inativar
motoristas.delete('/:id', requirePermission('logistica', 'excluir'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const motorista = await c.env.DB.prepare(`
    SELECT * FROM motoristas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!motorista) {
    return c.json({ success: false, error: 'Motorista não encontrado' }, 404);
  }

  // Verificar entregas pendentes
  const entregasPendentes = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM entregas 
    WHERE motorista_id = ? AND status IN ('PENDENTE', 'EM_SEPARACAO', 'EM_TRANSITO')
  `).bind(id).first<{ total: number }>();

  if (entregasPendentes && entregasPendentes.total > 0) {
    return c.json({ success: false, error: 'Motorista possui entregas pendentes' }, 400);
  }

  // Inativar ao invés de excluir
  await c.env.DB.prepare(`
    UPDATE motoristas SET ativo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(id).run();

  // Desvincular veículos
  await c.env.DB.prepare(`
    UPDATE veiculos_motoristas SET ativo = 0, data_fim = DATE('now')
    WHERE motorista_id = ? AND ativo = 1
  `).bind(id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'INATIVAR',
    entidade: 'motoristas',
    entidade_id: id
  });

  return c.json({ success: true, message: 'Motorista inativado' });
});

export default motoristas;
