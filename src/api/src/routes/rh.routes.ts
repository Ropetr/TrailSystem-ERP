// ============================================
// PLANAC ERP - Rotas de RH / Funcionários
// Bloco 3 - RH
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const rh = new Hono<{ Bindings: Env }>();

// ============================================
// FUNCIONÁRIOS
// ============================================

const funcionarioSchema = z.object({
  nome: z.string().min(1).max(200),
  cpf: z.string().length(11),
  rg: z.string().optional(),
  data_nascimento: z.string(),
  sexo: z.enum(['M', 'F', 'O']).optional(),
  estado_civil: z.enum(['SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO', 'OUTROS']).optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2).optional(),
  cep: z.string().optional(),
  cargo_id: z.string().uuid().optional(),
  departamento_id: z.string().uuid().optional(),
  data_admissao: z.string(),
  salario: z.number().min(0),
  tipo_contrato: z.enum(['CLT', 'PJ', 'ESTAGIO', 'TEMPORARIO', 'AUTONOMO']),
  carga_horaria: z.number().int().min(1).max(44).default(44),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  pix: z.string().optional(),
  observacoes: z.string().optional()
});

// GET /api/rh/funcionarios - Listar funcionários
rh.get('/funcionarios', async (c) => {
  const empresaId = c.get('empresaId');
  const { departamento_id, cargo_id, ativo, busca, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT f.*, c.nome as cargo_nome, d.nome as departamento_nome
               FROM funcionarios f
               LEFT JOIN cargos c ON f.cargo_id = c.id
               LEFT JOIN departamentos d ON f.departamento_id = d.id
               WHERE f.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (departamento_id) {
    query += ` AND f.departamento_id = ?`;
    params.push(departamento_id);
  }
  
  if (cargo_id) {
    query += ` AND f.cargo_id = ?`;
    params.push(cargo_id);
  }
  
  if (ativo !== undefined) {
    query += ` AND f.ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }
  
  if (busca) {
    query += ` AND (f.nome LIKE ? OR f.cpf LIKE ?)`;
    params.push(`%${busca}%`, `%${busca}%`);
  }
  
  const countQuery = query.replace(/SELECT f\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY f.nome LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: result.results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult?.total || 0 }
  });
});

// GET /api/rh/funcionarios/:id
rh.get('/funcionarios/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const funcionario = await c.env.DB.prepare(`
    SELECT f.*, c.nome as cargo_nome, d.nome as departamento_nome
    FROM funcionarios f
    LEFT JOIN cargos c ON f.cargo_id = c.id
    LEFT JOIN departamentos d ON f.departamento_id = d.id
    WHERE f.id = ? AND f.empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!funcionario) {
    return c.json({ error: 'Funcionário não encontrado' }, 404);
  }
  
  return c.json({ success: true, data: funcionario });
});

// POST /api/rh/funcionarios
rh.post('/funcionarios', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const validation = funcionarioSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  // Verificar CPF duplicado
  const existente = await c.env.DB.prepare(`
    SELECT id FROM funcionarios WHERE cpf = ? AND empresa_id = ?
  `).bind(validation.data.cpf, empresaId).first();
  
  if (existente) {
    return c.json({ error: 'CPF já cadastrado' }, 409);
  }
  
  // Gerar matrícula
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM funcionarios WHERE empresa_id = ?
  `).bind(empresaId).first();
  const matricula = `MAT${String(((countResult?.total as number) || 0) + 1).padStart(5, '0')}`;
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO funcionarios (id, empresa_id, matricula, nome, cpf, rg, data_nascimento, sexo, estado_civil,
                              email, telefone, celular, endereco, cidade, uf, cep, cargo_id, departamento_id,
                              data_admissao, salario, tipo_contrato, carga_horaria, banco, agencia, conta, pix,
                              observacoes, ativo, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).bind(id, empresaId, matricula, data.nome, data.cpf, data.rg || null, data.data_nascimento,
          data.sexo || null, data.estado_civil || null, data.email || null, data.telefone || null,
          data.celular || null, data.endereco || null, data.cidade || null, data.uf || null, data.cep || null,
          data.cargo_id || null, data.departamento_id || null, data.data_admissao, data.salario,
          data.tipo_contrato, data.carga_horaria, data.banco || null, data.agencia || null,
          data.conta || null, data.pix || null, data.observacoes || null, usuarioId).run();
  
  return c.json({ id, matricula, message: 'Funcionário cadastrado com sucesso' }, 201);
});

// PUT /api/rh/funcionarios/:id
rh.put('/funcionarios/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const validation = funcionarioSchema.partial().safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const campos = Object.keys(validation.data);
  const valores = Object.values(validation.data);
  
  if (campos.length > 0) {
    const setClause = campos.map(c => `${c} = ?`).join(', ');
    await c.env.DB.prepare(`
      UPDATE funcionarios SET ${setClause}, updated_at = CURRENT_TIMESTAMP, updated_by = ?
      WHERE id = ? AND empresa_id = ?
    `).bind(...valores, usuarioId, id, empresaId).run();
  }
  
  return c.json({ message: 'Funcionário atualizado' });
});

// POST /api/rh/funcionarios/:id/demitir - Demitir funcionário
rh.post('/funcionarios/:id/demitir', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    data_demissao: z.string(),
    motivo: z.string().min(1),
    tipo_demissao: z.enum(['PEDIDO', 'SEM_JUSTA_CAUSA', 'COM_JUSTA_CAUSA', 'ACORDO'])
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE funcionarios SET ativo = 0, data_demissao = ?, motivo_demissao = ?,
                           tipo_demissao = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(validation.data.data_demissao, validation.data.motivo, validation.data.tipo_demissao, id, empresaId).run();
  
  return c.json({ message: 'Funcionário demitido' });
});

// ============================================
// CARGOS
// ============================================

// GET /api/rh/cargos
rh.get('/cargos', async (c) => {
  const empresaId = c.get('empresaId');
  
  const cargos = await c.env.DB.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM funcionarios WHERE cargo_id = c.id AND ativo = 1) as total_funcionarios
    FROM cargos c WHERE c.empresa_id = ? ORDER BY c.nome
  `).bind(empresaId).all();
  
  return c.json({ success: true, data: cargos.results });
});

// POST /api/rh/cargos
rh.post('/cargos', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    nome: z.string().min(1).max(100),
    descricao: z.string().optional(),
    salario_base: z.number().min(0).optional(),
    nivel: z.enum(['JUNIOR', 'PLENO', 'SENIOR', 'GERENTE', 'DIRETOR']).optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO cargos (id, empresa_id, nome, descricao, salario_base, nivel, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, empresaId, validation.data.nome, validation.data.descricao || null,
          validation.data.salario_base || null, validation.data.nivel || null, usuarioId).run();
  
  return c.json({ id, message: 'Cargo criado' }, 201);
});

// PUT /api/rh/cargos/:id
rh.put('/cargos/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const campos = Object.keys(body);
  const valores = Object.values(body);
  
  if (campos.length > 0) {
    const setClause = campos.map(c => `${c} = ?`).join(', ');
    await c.env.DB.prepare(`
      UPDATE cargos SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND empresa_id = ?
    `).bind(...valores, id, empresaId).run();
  }
  
  return c.json({ message: 'Cargo atualizado' });
});

// DELETE /api/rh/cargos/:id
rh.delete('/cargos/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const funcionarios = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM funcionarios WHERE cargo_id = ? AND ativo = 1
  `).bind(id).first();
  
  if (funcionarios && (funcionarios.total as number) > 0) {
    return c.json({ error: 'Cargo possui funcionários vinculados' }, 400);
  }
  
  await c.env.DB.prepare(`DELETE FROM cargos WHERE id = ? AND empresa_id = ?`).bind(id, empresaId).run();
  
  return c.json({ message: 'Cargo excluído' });
});

// ============================================
// DEPARTAMENTOS
// ============================================

// GET /api/rh/departamentos
rh.get('/departamentos', async (c) => {
  const empresaId = c.get('empresaId');
  
  const departamentos = await c.env.DB.prepare(`
    SELECT d.*, (SELECT COUNT(*) FROM funcionarios WHERE departamento_id = d.id AND ativo = 1) as total_funcionarios,
           g.nome as gestor_nome
    FROM departamentos d
    LEFT JOIN funcionarios g ON d.gestor_id = g.id
    WHERE d.empresa_id = ? ORDER BY d.nome
  `).bind(empresaId).all();
  
  return c.json({ success: true, data: departamentos.results });
});

// POST /api/rh/departamentos
rh.post('/departamentos', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    nome: z.string().min(1).max(100),
    descricao: z.string().optional(),
    gestor_id: z.string().uuid().optional(),
    centro_custo: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO departamentos (id, empresa_id, nome, descricao, gestor_id, centro_custo, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, empresaId, validation.data.nome, validation.data.descricao || null,
          validation.data.gestor_id || null, validation.data.centro_custo || null, usuarioId).run();
  
  return c.json({ id, message: 'Departamento criado' }, 201);
});

// ============================================
// FÉRIAS
// ============================================

// GET /api/rh/ferias
rh.get('/ferias', async (c) => {
  const empresaId = c.get('empresaId');
  const { funcionario_id, status, ano } = c.req.query();
  
  let query = `SELECT fer.*, f.nome as funcionario_nome
               FROM ferias fer
               JOIN funcionarios f ON fer.funcionario_id = f.id
               WHERE fer.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (funcionario_id) {
    query += ` AND fer.funcionario_id = ?`;
    params.push(funcionario_id);
  }
  
  if (status) {
    query += ` AND fer.status = ?`;
    params.push(status);
  }
  
  if (ano) {
    query += ` AND strftime('%Y', fer.data_inicio) = ?`;
    params.push(ano);
  }
  
  query += ` ORDER BY fer.data_inicio DESC`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// POST /api/rh/ferias
rh.post('/ferias', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    funcionario_id: z.string().uuid(),
    data_inicio: z.string(),
    data_fim: z.string(),
    dias: z.number().int().min(1).max(30),
    abono_pecuniario: z.boolean().default(false),
    dias_abono: z.number().int().min(0).max(10).optional(),
    observacoes: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO ferias (id, empresa_id, funcionario_id, data_inicio, data_fim, dias,
                        abono_pecuniario, dias_abono, observacoes, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SOLICITADA', ?)
  `).bind(id, empresaId, data.funcionario_id, data.data_inicio, data.data_fim, data.dias,
          data.abono_pecuniario ? 1 : 0, data.dias_abono || 0, data.observacoes || null, usuarioId).run();
  
  return c.json({ id, message: 'Férias solicitadas' }, 201);
});

// POST /api/rh/ferias/:id/aprovar
rh.post('/ferias/:id/aprovar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  
  await c.env.DB.prepare(`
    UPDATE ferias SET status = 'APROVADA', aprovado_por = ?, data_aprovacao = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(usuarioId, id, empresaId).run();
  
  return c.json({ message: 'Férias aprovadas' });
});

// ============================================
// PONTO
// ============================================

// GET /api/rh/ponto
rh.get('/ponto', async (c) => {
  const empresaId = c.get('empresaId');
  const { funcionario_id, data_inicio, data_fim } = c.req.query();
  
  let query = `SELECT p.*, f.nome as funcionario_nome
               FROM ponto p
               JOIN funcionarios f ON p.funcionario_id = f.id
               WHERE p.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (funcionario_id) {
    query += ` AND p.funcionario_id = ?`;
    params.push(funcionario_id);
  }
  
  if (data_inicio) {
    query += ` AND p.data >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    query += ` AND p.data <= ?`;
    params.push(data_fim);
  }
  
  query += ` ORDER BY p.data DESC, p.hora_entrada DESC`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// POST /api/rh/ponto/registrar - Registrar ponto
rh.post('/ponto/registrar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    funcionario_id: z.string().uuid(),
    tipo: z.enum(['ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO', 'SAIDA']),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    observacao: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  const hoje = new Date().toISOString().split('T')[0];
  const agora = new Date().toTimeString().split(' ')[0];
  
  // Buscar registro do dia
  let ponto = await c.env.DB.prepare(`
    SELECT id, hora_entrada, hora_saida_almoco, hora_retorno_almoco, hora_saida
    FROM ponto WHERE funcionario_id = ? AND data = ?
  `).bind(validation.data.funcionario_id, hoje).first();
  
  if (!ponto && validation.data.tipo === 'ENTRADA') {
    // Criar novo registro
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO ponto (id, empresa_id, funcionario_id, data, hora_entrada, latitude_entrada, longitude_entrada)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, empresaId, validation.data.funcionario_id, hoje, agora,
            validation.data.latitude || null, validation.data.longitude || null).run();
    
    return c.json({ id, tipo: 'ENTRADA', hora: agora, message: 'Entrada registrada' }, 201);
  }
  
  if (!ponto) {
    return c.json({ error: 'Nenhum registro de entrada encontrado para hoje' }, 400);
  }
  
  // Atualizar registro existente
  const campo = {
    'SAIDA_ALMOCO': 'hora_saida_almoco',
    'RETORNO_ALMOCO': 'hora_retorno_almoco',
    'SAIDA': 'hora_saida'
  }[validation.data.tipo];
  
  if (campo) {
    await c.env.DB.prepare(`
      UPDATE ponto SET ${campo} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(agora, ponto.id).run();
  }
  
  return c.json({ tipo: validation.data.tipo, hora: agora, message: `${validation.data.tipo} registrado` });
});

// GET /api/rh/ponto/resumo/:funcionarioId - Resumo mensal de ponto
rh.get('/ponto/resumo/:funcionarioId', async (c) => {
  const empresaId = c.get('empresaId');
  const { funcionarioId } = c.req.param();
  const { mes, ano } = c.req.query();
  
  const mesAtual = mes || String(new Date().getMonth() + 1).padStart(2, '0');
  const anoAtual = ano || String(new Date().getFullYear());
  
  const registros = await c.env.DB.prepare(`
    SELECT * FROM ponto 
    WHERE funcionario_id = ? AND strftime('%m', data) = ? AND strftime('%Y', data) = ?
    ORDER BY data
  `).bind(funcionarioId, mesAtual, anoAtual).all();
  
  // Calcular horas trabalhadas
  let totalMinutos = 0;
  for (const reg of registros.results as any[]) {
    if (reg.hora_entrada && reg.hora_saida) {
      const entrada = reg.hora_entrada.split(':').map(Number);
      const saida = reg.hora_saida.split(':').map(Number);
      let minutos = (saida[0] * 60 + saida[1]) - (entrada[0] * 60 + entrada[1]);
      
      // Descontar almoço
      if (reg.hora_saida_almoco && reg.hora_retorno_almoco) {
        const saidaAlmoco = reg.hora_saida_almoco.split(':').map(Number);
        const retornoAlmoco = reg.hora_retorno_almoco.split(':').map(Number);
        minutos -= (retornoAlmoco[0] * 60 + retornoAlmoco[1]) - (saidaAlmoco[0] * 60 + saidaAlmoco[1]);
      }
      
      totalMinutos += minutos;
    }
  }
  
  return c.json({
    success: true,
    data: {
      registros: registros.results,
      resumo: {
        dias_trabalhados: registros.results.length,
        horas_trabalhadas: Math.floor(totalMinutos / 60),
        minutos_trabalhados: totalMinutos % 60,
        total_minutos: totalMinutos
      }
    }
  });
});

// ============================================
// ADMISSÕES (Processo de Admissão com e-Social)
// ============================================

const admissaoSchema = z.object({
  nome: z.string().min(1).max(200),
  cpf: z.string().length(11),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  data_nascimento: z.string(),
  cargo_id: z.string().uuid(),
  departamento_id: z.string().uuid().optional(),
  salario_proposto: z.number().min(0),
  data_prevista_admissao: z.string(),
  tipo_contrato: z.enum(['CLT', 'PJ', 'ESTAGIO', 'TEMPORARIO', 'AUTONOMO']),
  observacoes: z.string().optional()
});

// GET /api/rh/admissoes - Listar processos de admissão
rh.get('/admissoes', async (c) => {
  const empresaId = c.get('empresaId');
  const { status, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT a.*, c.nome as cargo_nome, d.nome as departamento_nome
               FROM admissoes a
               LEFT JOIN cargos c ON a.cargo_id = c.id
               LEFT JOIN departamentos d ON a.departamento_id = d.id
               WHERE a.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (status) {
    query += ` AND a.status = ?`;
    params.push(status);
  }
  
  const countQuery = query.replace(/SELECT a\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: result.results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult?.total || 0 }
  });
});

// GET /api/rh/admissoes/:id
rh.get('/admissoes/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const admissao = await c.env.DB.prepare(`
    SELECT a.*, c.nome as cargo_nome, d.nome as departamento_nome
    FROM admissoes a
    LEFT JOIN cargos c ON a.cargo_id = c.id
    LEFT JOIN departamentos d ON a.departamento_id = d.id
    WHERE a.id = ? AND a.empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!admissao) {
    return c.json({ error: 'Admissão não encontrada' }, 404);
  }
  
  // Buscar dependentes
  const dependentes = await c.env.DB.prepare(`
    SELECT * FROM admissoes_dependentes WHERE admissao_id = ?
  `).bind(id).all();
  
  // Buscar histórico
  const historico = await c.env.DB.prepare(`
    SELECT h.*, u.nome as usuario_nome FROM admissoes_historico h
    LEFT JOIN usuarios u ON h.usuario_id = u.id
    WHERE h.admissao_id = ? ORDER BY h.created_at DESC
  `).bind(id).all();
  
  return c.json({ 
    success: true, 
    data: { ...admissao, dependentes: dependentes.results, historico: historico.results }
  });
});

// POST /api/rh/admissoes - Criar processo de admissão
rh.post('/admissoes', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const validation = admissaoSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO admissoes (id, empresa_id, nome, cpf, email,
                           telefone, celular, data_nascimento, cargo_id, departamento_id, salario_proposto,
                           data_prevista_admissao, tipo_contrato, observacoes, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'rascunho', ?)
  `).bind(id, empresaId, data.nome, data.cpf, data.email || null,
          data.telefone || null, data.celular || null, data.data_nascimento, data.cargo_id, data.departamento_id || null,
          data.salario_proposto, data.data_prevista_admissao, data.tipo_contrato,
          data.observacoes || null, usuarioId).run();
  
  // Registrar histórico
  await c.env.DB.prepare(`
    INSERT INTO admissoes_historico (id, admissao_id, status_anterior, status_novo, observacao, usuario_id)
    VALUES (?, ?, NULL, 'rascunho', 'Processo de admissão iniciado', ?)
  `).bind(crypto.randomUUID(), id, usuarioId).run();
  
  return c.json({ id, message: 'Processo de admissão criado' }, 201);
});

// PUT /api/rh/admissoes/:id - Atualizar admissão
rh.put('/admissoes/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const campos = Object.keys(body);
  const valores = Object.values(body);
  
  if (campos.length > 0) {
    const setClause = campos.map(c => `${c} = ?`).join(', ');
    await c.env.DB.prepare(`
      UPDATE admissoes SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND empresa_id = ?
    `).bind(...valores, id, empresaId).run();
  }
  
  return c.json({ message: 'Admissão atualizada' });
});

// POST /api/rh/admissoes/:id/atualizar-status - Atualizar status da admissão
rh.post('/admissoes/:id/atualizar-status', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    status: z.enum(['rascunho', 'documentacao_pendente', 'documentacao_completa', 'exame_admissional', 
                    'aguardando_aprovacao', 'aprovada', 'contratada', 'cancelada']),
    observacao: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  // Buscar status atual
  const admissao = await c.env.DB.prepare(`
    SELECT status FROM admissoes WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!admissao) {
    return c.json({ error: 'Admissão não encontrada' }, 404);
  }
  
  // Atualizar status
  await c.env.DB.prepare(`
    UPDATE admissoes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(validation.data.status, id).run();
  
  // Registrar histórico
  await c.env.DB.prepare(`
    INSERT INTO admissoes_historico (id, admissao_id, status_anterior, status_novo, observacao, usuario_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(crypto.randomUUID(), id, admissao.status, validation.data.status, 
          validation.data.observacao || null, usuarioId).run();
  
  return c.json({ message: 'Status atualizado' });
});

// POST /api/rh/admissoes/:id/finalizar - Finalizar admissão e criar funcionário
rh.post('/admissoes/:id/finalizar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  
  // Buscar admissão
  const admissao = await c.env.DB.prepare(`
    SELECT * FROM admissoes WHERE id = ? AND empresa_id = ? AND status = 'aprovada'
  `).bind(id, empresaId).first() as any;
  
  if (!admissao) {
    return c.json({ error: 'Admissão não encontrada ou não está aprovada' }, 404);
  }
  
  // Gerar matrícula
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM funcionarios WHERE empresa_id = ?
  `).bind(empresaId).first();
  const matricula = `MAT${String(((countResult?.total as number) || 0) + 1).padStart(5, '0')}`;
  
  // Criar funcionário
  const funcionarioId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO funcionarios (id, empresa_id, matricula, nome, cpf, email, telefone, cargo_id,
                              departamento_id, data_admissao, salario, tipo_contrato, ativo, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).bind(funcionarioId, empresaId, matricula, admissao.nome, admissao.cpf,
          admissao.email, admissao.telefone, admissao.cargo_id,
          admissao.departamento_id, admissao.data_prevista_admissao, admissao.salario_proposto,
          admissao.tipo_contrato, usuarioId).run();
  
  // Atualizar admissão
  await c.env.DB.prepare(`
    UPDATE admissoes SET status = 'contratada', funcionario_id = ?, data_efetiva_admissao = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(funcionarioId, id).run();
  
  // Registrar histórico
  await c.env.DB.prepare(`
    INSERT INTO admissoes_historico (id, admissao_id, status_anterior, status_novo, observacao, usuario_id)
    VALUES (?, ?, 'aprovada', 'contratada', 'Funcionário criado com matrícula ' || ?, ?)
  `).bind(crypto.randomUUID(), id, matricula, usuarioId).run();
  
  return c.json({ funcionario_id: funcionarioId, matricula, message: 'Admissão finalizada e funcionário criado' });
});

// POST /api/rh/admissoes/:id/gerar-esocial - Gerar evento e-Social S-2200
rh.post('/admissoes/:id/gerar-esocial', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  
  // Buscar admissão
  const admissao = await c.env.DB.prepare(`
    SELECT a.*, f.matricula, f.data_nascimento, f.sexo, f.rg, f.endereco, f.cidade, f.uf, f.cep
    FROM admissoes a
    LEFT JOIN funcionarios f ON a.funcionario_id = f.id
    WHERE a.id = ? AND a.empresa_id = ? AND a.status = 'contratada'
  `).bind(id, empresaId).first() as any;
  
  if (!admissao) {
    return c.json({ error: 'Admissão não encontrada ou não está contratada' }, 404);
  }
  
  // Criar evento e-Social S-2200
  const eventoId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO esocial_eventos (id, empresa_id, tipo_evento, codigo_evento, funcionario_id,
                                 data_evento, status, dados_evento, created_by)
    VALUES (?, ?, 'S-2200', 'evtAdmissao', ?, ?, 'pendente', ?, ?)
  `).bind(eventoId, empresaId, admissao.funcionario_id, admissao.data_efetiva_admissao,
          JSON.stringify({
            cpfTrab: admissao.cpf,
            nmTrab: admissao.nome,
            dtNascto: admissao.data_nascimento,
            sexo: admissao.sexo,
            matricula: admissao.matricula,
            dtAdm: admissao.data_efetiva_admissao,
            tpContr: admissao.tipo_contrato === 'CLT' ? 1 : 2
          }), usuarioId).run();
  
  // Atualizar admissão com referência ao evento
  await c.env.DB.prepare(`
    UPDATE admissoes SET esocial_evento_id = ?, esocial_status = 'pendente' WHERE id = ?
  `).bind(eventoId, id).run();
  
  return c.json({ evento_id: eventoId, message: 'Evento e-Social S-2200 gerado' });
});

// ============================================
// FOLHA DE PAGAMENTO - CÁLCULOS
// ============================================

// GET /api/rh/folha-calculos - Listar cálculos de folha
rh.get('/folha-calculos', async (c) => {
  const empresaId = c.get('empresaId');
  const { competencia, funcionario_id, status, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT fc.*, f.nome as funcionario_nome, f.matricula
               FROM folha_calculos fc
               JOIN funcionarios f ON fc.funcionario_id = f.id
               WHERE fc.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (competencia) {
    query += ` AND fc.competencia = ?`;
    params.push(competencia);
  }
  
  if (funcionario_id) {
    query += ` AND fc.funcionario_id = ?`;
    params.push(funcionario_id);
  }
  
  if (status) {
    query += ` AND fc.status = ?`;
    params.push(status);
  }
  
  const countQuery = query.replace(/SELECT fc\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY fc.competencia DESC, f.nome LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: result.results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult?.total || 0 }
  });
});

// POST /api/rh/folha-calculos/processar - Processar folha de pagamento
rh.post('/folha-calculos/processar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    competencia: z.string().regex(/^\d{4}-\d{2}$/),
    funcionario_ids: z.array(z.string().uuid()).optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  // Buscar funcionários ativos
  let funcionariosQuery = `SELECT * FROM funcionarios WHERE empresa_id = ? AND ativo = 1`;
  const params: any[] = [empresaId];
  
  if (validation.data.funcionario_ids && validation.data.funcionario_ids.length > 0) {
    funcionariosQuery += ` AND id IN (${validation.data.funcionario_ids.map(() => '?').join(',')})`;
    params.push(...validation.data.funcionario_ids);
  }
  
  const funcionarios = await c.env.DB.prepare(funcionariosQuery).bind(...params).all();
  
  const calculos: string[] = [];
  
  for (const func of funcionarios.results as any[]) {
    // Verificar se já existe cálculo para esta competência
    const existente = await c.env.DB.prepare(`
      SELECT id FROM folha_calculos WHERE funcionario_id = ? AND competencia = ?
    `).bind(func.id, validation.data.competencia).first();
    
    if (existente) continue;
    
    // Calcular valores (simplificado - em produção seria mais complexo)
    const salarioBruto = func.salario;
    
    // INSS (alíquotas 2024)
    let inssAliquota = 0;
    let inssValor = 0;
    if (salarioBruto <= 1412.00) {
      inssAliquota = 7.5;
      inssValor = salarioBruto * 0.075;
    } else if (salarioBruto <= 2666.68) {
      inssAliquota = 9;
      inssValor = salarioBruto * 0.09;
    } else if (salarioBruto <= 4000.03) {
      inssAliquota = 12;
      inssValor = salarioBruto * 0.12;
    } else {
      inssAliquota = 14;
      inssValor = Math.min(salarioBruto * 0.14, 908.85);
    }
    
    // IRRF (alíquotas 2024)
    const baseIRRF = salarioBruto - inssValor;
    let irrfAliquota = 0;
    let irrfDeducao = 0;
    let irrfValor = 0;
    
    if (baseIRRF <= 2259.20) {
      irrfAliquota = 0;
    } else if (baseIRRF <= 2826.65) {
      irrfAliquota = 7.5;
      irrfDeducao = 169.44;
      irrfValor = baseIRRF * 0.075 - irrfDeducao;
    } else if (baseIRRF <= 3751.05) {
      irrfAliquota = 15;
      irrfDeducao = 381.44;
      irrfValor = baseIRRF * 0.15 - irrfDeducao;
    } else if (baseIRRF <= 4664.68) {
      irrfAliquota = 22.5;
      irrfDeducao = 662.77;
      irrfValor = baseIRRF * 0.225 - irrfDeducao;
    } else {
      irrfAliquota = 27.5;
      irrfDeducao = 896.00;
      irrfValor = baseIRRF * 0.275 - irrfDeducao;
    }
    
    // FGTS
    const fgtsValor = salarioBruto * 0.08;
    
    const salarioLiquido = salarioBruto - inssValor - Math.max(0, irrfValor);
    
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO folha_calculos (id, empresa_id, funcionario_id, competencia, salario_base,
                                  salario_bruto, inss_aliquota, inss_valor, irrf_base, irrf_aliquota,
                                  irrf_deducao, irrf_valor, fgts_valor, salario_liquido, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'calculado', ?)
    `).bind(id, empresaId, func.id, validation.data.competencia, func.salario, salarioBruto,
            inssAliquota, inssValor, baseIRRF, irrfAliquota, irrfDeducao, Math.max(0, irrfValor),
            fgtsValor, salarioLiquido, usuarioId).run();
    
    calculos.push(id);
  }
  
  return c.json({ 
    calculos_criados: calculos.length, 
    ids: calculos,
    message: `${calculos.length} cálculos processados` 
  });
});

// POST /api/rh/folha-calculos/:id/aprovar - Aprovar cálculo
rh.post('/folha-calculos/:id/aprovar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  
  await c.env.DB.prepare(`
    UPDATE folha_calculos SET status = 'aprovado', aprovado_por = ?, data_aprovacao = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(usuarioId, id, empresaId).run();
  
  return c.json({ message: 'Cálculo aprovado' });
});

// POST /api/rh/folha-calculos/:id/gerar-esocial - Gerar evento e-Social S-1200
rh.post('/folha-calculos/:id/gerar-esocial', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  
  const calculo = await c.env.DB.prepare(`
    SELECT fc.*, f.cpf, f.nome, f.matricula
    FROM folha_calculos fc
    JOIN funcionarios f ON fc.funcionario_id = f.id
    WHERE fc.id = ? AND fc.empresa_id = ?
  `).bind(id, empresaId).first() as any;
  
  if (!calculo) {
    return c.json({ error: 'Cálculo não encontrado' }, 404);
  }
  
  const eventoId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO esocial_eventos (id, empresa_id, tipo_evento, codigo_evento, funcionario_id,
                                 data_evento, status, dados_evento, created_by)
    VALUES (?, ?, 'S-1200', 'evtRemun', ?, ?, 'pendente', ?, ?)
  `).bind(eventoId, empresaId, calculo.funcionario_id, calculo.competencia + '-01',
          JSON.stringify({
            perApur: calculo.competencia,
            cpfTrab: calculo.cpf,
            matricula: calculo.matricula,
            vrSalFx: calculo.salario_base,
            vrBruto: calculo.salario_bruto,
            vrDescINSS: calculo.inss_valor,
            vrDescIRRF: calculo.irrf_valor,
            vrLiq: calculo.salario_liquido
          }), usuarioId).run();
  
  await c.env.DB.prepare(`
    UPDATE folha_calculos SET esocial_evento_id = ?, esocial_status = 'pendente' WHERE id = ?
  `).bind(eventoId, id).run();
  
  return c.json({ evento_id: eventoId, message: 'Evento e-Social S-1200 gerado' });
});

// ============================================
// FÉRIAS - SOLICITAÇÕES E PROGRAMAÇÃO
// ============================================

// GET /api/rh/ferias-solicitacoes - Listar solicitações de férias
rh.get('/ferias-solicitacoes', async (c) => {
  const empresaId = c.get('empresaId');
  const { funcionario_id, status, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT fs.*, f.nome as funcionario_nome, f.matricula,
                      fp.periodo_aquisitivo_inicio, fp.periodo_aquisitivo_fim, fp.dias_direito
               FROM ferias_solicitacoes fs
               JOIN funcionarios f ON fs.funcionario_id = f.id
               LEFT JOIN ferias_programacao fp ON fs.programacao_id = fp.id
               WHERE fs.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (funcionario_id) {
    query += ` AND fs.funcionario_id = ?`;
    params.push(funcionario_id);
  }
  
  if (status) {
    query += ` AND fs.status = ?`;
    params.push(status);
  }
  
  const countQuery = query.replace(/SELECT fs\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY fs.data_inicio DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: result.results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult?.total || 0 }
  });
});

// POST /api/rh/ferias-solicitacoes - Criar solicitação de férias
rh.post('/ferias-solicitacoes', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    funcionario_id: z.string().uuid(),
    programacao_id: z.string().uuid().optional(),
    data_inicio: z.string(),
    data_fim: z.string(),
    dias_gozo: z.number().int().min(5).max(30),
    abono_pecuniario: z.boolean().default(false),
    dias_abono: z.number().int().min(0).max(10).optional(),
    adiantamento_13: z.boolean().default(false),
    observacoes: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO ferias_solicitacoes (id, empresa_id, funcionario_id, programacao_id, data_inicio,
                                     data_fim, dias_gozo, abono_pecuniario, dias_abono,
                                     adiantamento_13, observacoes, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'solicitada', ?)
  `).bind(id, empresaId, data.funcionario_id, data.programacao_id || null, data.data_inicio,
          data.data_fim, data.dias_gozo, data.abono_pecuniario ? 1 : 0, data.dias_abono || 0,
          data.adiantamento_13 ? 1 : 0, data.observacoes || null, usuarioId).run();
  
  return c.json({ id, message: 'Solicitação de férias criada' }, 201);
});

// POST /api/rh/ferias-solicitacoes/:id/aprovar - Aprovar férias
rh.post('/ferias-solicitacoes/:id/aprovar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  
  await c.env.DB.prepare(`
    UPDATE ferias_solicitacoes SET status = 'aprovada', aprovado_por = ?, data_aprovacao = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(usuarioId, id, empresaId).run();
  
  return c.json({ message: 'Férias aprovadas' });
});

// POST /api/rh/ferias-solicitacoes/:id/gerar-esocial - Gerar evento e-Social S-2230
rh.post('/ferias-solicitacoes/:id/gerar-esocial', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  
  const ferias = await c.env.DB.prepare(`
    SELECT fs.*, f.cpf, f.nome, f.matricula
    FROM ferias_solicitacoes fs
    JOIN funcionarios f ON fs.funcionario_id = f.id
    WHERE fs.id = ? AND fs.empresa_id = ? AND fs.status = 'aprovada'
  `).bind(id, empresaId).first() as any;
  
  if (!ferias) {
    return c.json({ error: 'Solicitação não encontrada ou não aprovada' }, 404);
  }
  
  const eventoId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO esocial_eventos (id, empresa_id, tipo_evento, codigo_evento, funcionario_id,
                                 data_evento, status, dados_evento, created_by)
    VALUES (?, ?, 'S-2230', 'evtAfastTemp', ?, ?, 'pendente', ?, ?)
  `).bind(eventoId, empresaId, ferias.funcionario_id, ferias.data_inicio,
          JSON.stringify({
            cpfTrab: ferias.cpf,
            matricula: ferias.matricula,
            codMotAfast: '15', // Férias
            dtIniAfast: ferias.data_inicio,
            dtFimAfast: ferias.data_fim,
            qtdDiasAfast: ferias.dias_gozo
          }), usuarioId).run();
  
  await c.env.DB.prepare(`
    UPDATE ferias_solicitacoes SET esocial_evento_id = ?, esocial_status = 'pendente' WHERE id = ?
  `).bind(eventoId, id).run();
  
  return c.json({ evento_id: eventoId, message: 'Evento e-Social S-2230 gerado' });
});

// ============================================
// AFASTAMENTOS
// ============================================

// GET /api/rh/afastamentos - Listar afastamentos
rh.get('/afastamentos', async (c) => {
  const empresaId = c.get('empresaId');
  const { funcionario_id, tipo, ativo, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT af.*, f.nome as funcionario_nome, f.matricula
               FROM afastamentos af
               JOIN funcionarios f ON af.funcionario_id = f.id
               WHERE af.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (funcionario_id) {
    query += ` AND af.funcionario_id = ?`;
    params.push(funcionario_id);
  }
  
  if (tipo) {
    query += ` AND af.tipo = ?`;
    params.push(tipo);
  }
  
  if (ativo === 'true') {
    query += ` AND (af.data_fim IS NULL OR af.data_fim >= date('now'))`;
  }
  
  const countQuery = query.replace(/SELECT af\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY af.data_inicio DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: result.results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult?.total || 0 }
  });
});

// POST /api/rh/afastamentos - Criar afastamento
rh.post('/afastamentos', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    funcionario_id: z.string().uuid(),
    tipo: z.enum(['doenca', 'acidente_trabalho', 'acidente_trajeto', 'licenca_maternidade',
                  'licenca_paternidade', 'servico_militar', 'mandato_sindical', 'outros']),
    data_inicio: z.string(),
    data_fim: z.string().optional(),
    cid: z.string().optional(),
    motivo: z.string(),
    atestado_numero: z.string().optional(),
    atestado_medico: z.string().optional(),
    observacoes: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO afastamentos (id, empresa_id, funcionario_id, tipo, data_inicio, data_fim,
                              cid, motivo, atestado_numero, atestado_medico, observacoes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, empresaId, data.funcionario_id, data.tipo, data.data_inicio, data.data_fim || null,
          data.cid || null, data.motivo, data.atestado_numero || null, data.atestado_medico || null,
          data.observacoes || null, usuarioId).run();
  
  return c.json({ id, message: 'Afastamento registrado' }, 201);
});

// ============================================
// RESCISÕES
// ============================================

// GET /api/rh/rescisoes - Listar rescisões
rh.get('/rescisoes', async (c) => {
  const empresaId = c.get('empresaId');
  const { funcionario_id, status, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT r.*, f.nome as funcionario_nome, f.matricula
               FROM rescisoes r
               JOIN funcionarios f ON r.funcionario_id = f.id
               WHERE r.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (funcionario_id) {
    query += ` AND r.funcionario_id = ?`;
    params.push(funcionario_id);
  }
  
  if (status) {
    query += ` AND r.status = ?`;
    params.push(status);
  }
  
  const countQuery = query.replace(/SELECT r\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY r.data_demissao DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: result.results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult?.total || 0 }
  });
});

// POST /api/rh/rescisoes - Criar rescisão
rh.post('/rescisoes', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    funcionario_id: z.string().uuid(),
    tipo_rescisao: z.enum(['pedido_demissao', 'sem_justa_causa', 'com_justa_causa', 
                           'acordo_mutuo', 'termino_contrato', 'falecimento']),
    data_aviso: z.string().optional(),
    data_demissao: z.string(),
    aviso_previo: z.enum(['trabalhado', 'indenizado', 'dispensado']),
    motivo: z.string()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  // Buscar dados do funcionário para cálculo
  const funcionario = await c.env.DB.prepare(`
    SELECT * FROM funcionarios WHERE id = ? AND empresa_id = ?
  `).bind(validation.data.funcionario_id, empresaId).first() as any;
  
  if (!funcionario) {
    return c.json({ error: 'Funcionário não encontrado' }, 404);
  }
  
  // Calcular verbas rescisórias (simplificado)
  const saldoSalario = funcionario.salario; // Proporcional ao mês
  const feriasVencidas = funcionario.salario * 1.33; // Com 1/3
  const feriasProporcional = (funcionario.salario * 1.33) / 12 * 6; // 6 meses exemplo
  const decimoTerceiro = funcionario.salario / 12 * 6; // Proporcional
  const multaFGTS = validation.data.tipo_rescisao === 'sem_justa_causa' ? funcionario.salario * 0.4 : 0;
  
  const totalBruto = saldoSalario + feriasVencidas + feriasProporcional + decimoTerceiro;
  const totalLiquido = totalBruto + multaFGTS;
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO rescisoes (id, empresa_id, funcionario_id, tipo_rescisao, data_aviso, data_demissao,
                           aviso_previo, motivo, saldo_salario, ferias_vencidas, ferias_proporcionais,
                           decimo_terceiro, multa_fgts, total_bruto, total_liquido, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'calculada', ?)
  `).bind(id, empresaId, data.funcionario_id, data.tipo_rescisao, data.data_aviso || null,
          data.data_demissao, data.aviso_previo, data.motivo, saldoSalario, feriasVencidas,
          feriasProporcional, decimoTerceiro, multaFGTS, totalBruto, totalLiquido, usuarioId).run();
  
  return c.json({ 
    id, 
    valores: { saldoSalario, feriasVencidas, feriasProporcional, decimoTerceiro, multaFGTS, totalBruto, totalLiquido },
    message: 'Rescisão calculada' 
  }, 201);
});

// POST /api/rh/rescisoes/:id/gerar-esocial - Gerar evento e-Social S-2299
rh.post('/rescisoes/:id/gerar-esocial', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  
  const rescisao = await c.env.DB.prepare(`
    SELECT r.*, f.cpf, f.nome, f.matricula
    FROM rescisoes r
    JOIN funcionarios f ON r.funcionario_id = f.id
    WHERE r.id = ? AND r.empresa_id = ?
  `).bind(id, empresaId).first() as any;
  
  if (!rescisao) {
    return c.json({ error: 'Rescisão não encontrada' }, 404);
  }
  
  const eventoId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO esocial_eventos (id, empresa_id, tipo_evento, codigo_evento, funcionario_id,
                                 data_evento, status, dados_evento, created_by)
    VALUES (?, ?, 'S-2299', 'evtDeslig', ?, ?, 'pendente', ?, ?)
  `).bind(eventoId, empresaId, rescisao.funcionario_id, rescisao.data_demissao,
          JSON.stringify({
            cpfTrab: rescisao.cpf,
            matricula: rescisao.matricula,
            dtDeslig: rescisao.data_demissao,
            mtvDeslig: rescisao.tipo_rescisao,
            vrSaldoFGTS: rescisao.multa_fgts,
            vrTotVerbas: rescisao.total_bruto
          }), usuarioId).run();
  
  await c.env.DB.prepare(`
    UPDATE rescisoes SET esocial_evento_id = ?, esocial_status = 'pendente' WHERE id = ?
  `).bind(eventoId, id).run();
  
  return c.json({ evento_id: eventoId, message: 'Evento e-Social S-2299 gerado' });
});

// ============================================
// HOLERITES
// ============================================

// GET /api/rh/holerites - Listar holerites
rh.get('/holerites', async (c) => {
  const empresaId = c.get('empresaId');
  const { funcionario_id, competencia, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT h.*, f.nome as funcionario_nome, f.matricula
               FROM holerites h
               JOIN funcionarios f ON h.funcionario_id = f.id
               WHERE h.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (funcionario_id) {
    query += ` AND h.funcionario_id = ?`;
    params.push(funcionario_id);
  }
  
  if (competencia) {
    query += ` AND h.competencia = ?`;
    params.push(competencia);
  }
  
  query += ` ORDER BY h.competencia DESC, f.nome LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// POST /api/rh/holerites/gerar - Gerar holerites a partir dos cálculos
rh.post('/holerites/gerar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    competencia: z.string().regex(/^\d{4}-\d{2}$/)
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  // Buscar cálculos aprovados da competência
  const calculos = await c.env.DB.prepare(`
    SELECT fc.*, f.nome, f.cpf, f.cargo_id, c.nome as cargo_nome
    FROM folha_calculos fc
    JOIN funcionarios f ON fc.funcionario_id = f.id
    LEFT JOIN cargos c ON f.cargo_id = c.id
    WHERE fc.empresa_id = ? AND fc.competencia = ? AND fc.status = 'aprovado'
  `).bind(empresaId, validation.data.competencia).all();
  
  const holerites: string[] = [];
  
  for (const calc of calculos.results as any[]) {
    // Verificar se já existe holerite
    const existente = await c.env.DB.prepare(`
      SELECT id FROM holerites WHERE folha_calculo_id = ?
    `).bind(calc.id).first();
    
    if (existente) continue;
    
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO holerites (id, empresa_id, funcionario_id, folha_calculo_id, competencia,
                             salario_bruto, total_descontos, salario_liquido, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'gerado', ?)
    `).bind(id, empresaId, calc.funcionario_id, calc.id, calc.competencia,
            calc.salario_bruto, calc.inss_valor + calc.irrf_valor, calc.salario_liquido, usuarioId).run();
    
    holerites.push(id);
  }
  
  return c.json({ 
    holerites_gerados: holerites.length, 
    ids: holerites,
    message: `${holerites.length} holerites gerados` 
  });
});

export default rh;
