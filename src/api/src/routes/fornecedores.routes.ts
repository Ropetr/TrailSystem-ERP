// =============================================
// 🏢 PLANAC ERP - Rotas de Fornecedores
// =============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const fornecedores = new Hono<{ Bindings: Bindings; Variables: Variables }>();

fornecedores.use('*', authMiddleware());

// Schemas
const criarFornecedorSchema = z.object({
  tipo: z.enum(['PF', 'PJ']),
  razao_social: z.string().min(2),
  nome_fantasia: z.string().optional(),
  cpf_cnpj: z.string().min(11),
  inscricao_estadual: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  prazo_entrega_padrao: z.number().optional(),
  condicao_pagamento_padrao: z.string().optional(),
  tipo_fornecedor: z.enum(['fabricante', 'distribuidor', 'importador', 'servicos']).optional(),
  categorias: z.array(z.string()).optional(),
  observacao: z.string().optional(),
  endereco: z.object({
    cep: z.string(),
    logradouro: z.string(),
    numero: z.string(),
    complemento: z.string().optional(),
    bairro: z.string(),
    cidade: z.string(),
    uf: z.string().length(2),
    codigo_ibge: z.string().optional()
  }).optional(),
  contato: z.object({
    nome: z.string(),
    cargo: z.string().optional(),
    email: z.string().email().optional(),
    telefone: z.string().optional(),
    celular: z.string().optional()
  }).optional()
});

// GET /fornecedores - Listar
fornecedores.get('/', requirePermission('fornecedores', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { page = '1', limit = '20', busca, tipo_fornecedor, ativo } = c.req.query();
  
  let where = 'WHERE empresa_id = ?';
  const params: any[] = [user.empresa_id];
  
  if (busca) {
    where += ' AND (razao_social LIKE ? OR nome_fantasia LIKE ? OR cpf_cnpj LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
  }
  
  if (tipo_fornecedor) {
    where += ' AND tipo_fornecedor = ?';
    params.push(tipo_fornecedor);
  }
  
  if (ativo !== undefined) {
    where += ' AND ativo = ?';
    params.push(ativo === 'true' ? 1 : 0);
  }
  
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM fornecedores ${where}`
  ).bind(...params).first<{ total: number }>();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  const data = await c.env.DB.prepare(`
    SELECT * FROM fornecedores ${where}
    ORDER BY razao_social
    LIMIT ? OFFSET ?
  `).bind(...params, parseInt(limit), offset).all();
  
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

// GET /fornecedores/:id - Buscar por ID
fornecedores.get('/:id', requirePermission('fornecedores', 'visualizar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  
  const fornecedor = await c.env.DB.prepare(`
    SELECT * FROM fornecedores WHERE id = ? AND empresa_id = ?
  `).bind(id, user.empresa_id).first();
  
  if (!fornecedor) {
    return c.json({ success: false, error: 'Fornecedor não encontrado' }, 404);
  }
  
  // Buscar endereços
  const enderecos = await c.env.DB.prepare(`
    SELECT * FROM fornecedores_enderecos WHERE fornecedor_id = ?
  `).bind(id).all();
  
  // Buscar contatos
  const contatos = await c.env.DB.prepare(`
    SELECT * FROM fornecedores_contatos WHERE fornecedor_id = ?
  `).bind(id).all();
  
  // Buscar produtos vinculados
  const produtos = await c.env.DB.prepare(`
    SELECT pf.*, p.nome as produto_nome, p.codigo as produto_codigo
    FROM produtos_fornecedores pf
    JOIN produtos p ON pf.produto_id = p.id
    WHERE pf.fornecedor_id = ?
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: {
      ...fornecedor,
      enderecos: enderecos.results,
      contatos: contatos.results,
      produtos: produtos.results
    }
  });
});

// POST /fornecedores - Criar
fornecedores.post('/', requirePermission('fornecedores', 'criar'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const validacao = criarFornecedorSchema.safeParse(body);
  if (!validacao.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validacao.error.errors }, 400);
  }
  
  const dados = validacao.data;
  
  // Verifica CPF/CNPJ único
  const cpfCnpjExiste = await c.env.DB.prepare(
    'SELECT id FROM fornecedores WHERE cpf_cnpj = ? AND empresa_id = ?'
  ).bind(dados.cpf_cnpj, user.empresa_id).first();
  
  if (cpfCnpjExiste) {
    return c.json({ success: false, error: 'CPF/CNPJ já cadastrado' }, 400);
  }
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO fornecedores (
      id, empresa_id, tipo, razao_social, nome_fantasia, cpf_cnpj, inscricao_estadual,
      email, telefone, celular, prazo_entrega_padrao, condicao_pagamento_padrao,
      tipo_fornecedor, categorias, observacao, ativo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(
    id, user.empresa_id, dados.tipo, dados.razao_social, dados.nome_fantasia || null,
    dados.cpf_cnpj, dados.inscricao_estadual || null, dados.email || null,
    dados.telefone || null, dados.celular || null, dados.prazo_entrega_padrao || null,
    dados.condicao_pagamento_padrao || null, dados.tipo_fornecedor || null,
    dados.categorias ? JSON.stringify(dados.categorias) : null,
    dados.observacao || null, new Date().toISOString(), new Date().toISOString()
  ).run();
  
  // Criar endereço se informado
  if (dados.endereco) {
    await c.env.DB.prepare(`
      INSERT INTO fornecedores_enderecos (
        id, fornecedor_id, tipo, cep, logradouro, numero, complemento,
        bairro, cidade, uf, codigo_ibge, padrao, created_at
      ) VALUES (?, ?, 'principal', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(
      crypto.randomUUID(), id, dados.endereco.cep, dados.endereco.logradouro,
      dados.endereco.numero, dados.endereco.complemento || null,
      dados.endereco.bairro, dados.endereco.cidade, dados.endereco.uf,
      dados.endereco.codigo_ibge || null, new Date().toISOString()
    ).run();
  }
  
  // Criar contato se informado
  if (dados.contato) {
    await c.env.DB.prepare(`
      INSERT INTO fornecedores_contatos (
        id, fornecedor_id, nome, cargo, email, telefone, celular, principal, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(
      crypto.randomUUID(), id, dados.contato.nome, dados.contato.cargo || null,
      dados.contato.email || null, dados.contato.telefone || null,
      dados.contato.celular || null, new Date().toISOString()
    ).run();
  }
  
  await registrarAuditoria(c.env.DB, {
    empresa_id: user.empresa_id,
    usuario_id: user.id,
    acao: 'criar',
    tabela: 'fornecedores',
    registro_id: id,
    dados_novos: { razao_social: dados.razao_social, cpf_cnpj: dados.cpf_cnpj }
  });
  
  return c.json({ success: true, data: { id }, message: 'Fornecedor criado com sucesso' }, 201);
});

// PUT /fornecedores/:id - Editar
fornecedores.put('/:id', requirePermission('fornecedores', 'editar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const fornecedorExiste = await c.env.DB.prepare(
    'SELECT id FROM fornecedores WHERE id = ? AND empresa_id = ?'
  ).bind(id, user.empresa_id).first();
  
  if (!fornecedorExiste) {
    return c.json({ success: false, error: 'Fornecedor não encontrado' }, 404);
  }
  
  // Verifica CPF/CNPJ único se alterado
  if (body.cpf_cnpj) {
    const cpfCnpjExiste = await c.env.DB.prepare(
      'SELECT id FROM fornecedores WHERE cpf_cnpj = ? AND empresa_id = ? AND id != ?'
    ).bind(body.cpf_cnpj, user.empresa_id, id).first();
    
    if (cpfCnpjExiste) {
      return c.json({ success: false, error: 'CPF/CNPJ já cadastrado por outro fornecedor' }, 400);
    }
  }
  
  const updates: string[] = ['updated_at = ?'];
  const params: any[] = [new Date().toISOString()];
  
  const campos = ['tipo', 'razao_social', 'nome_fantasia', 'cpf_cnpj', 'inscricao_estadual',
    'email', 'telefone', 'celular', 'prazo_entrega_padrao', 'condicao_pagamento_padrao',
    'tipo_fornecedor', 'observacao', 'ativo'];
  
  for (const campo of campos) {
    if (body[campo] !== undefined) {
      updates.push(`${campo} = ?`);
      params.push(body[campo]);
    }
  }
  
  if (body.categorias !== undefined) {
    updates.push('categorias = ?');
    params.push(JSON.stringify(body.categorias));
  }
  
  params.push(id);
  
  await c.env.DB.prepare(`
    UPDATE fornecedores SET ${updates.join(', ')} WHERE id = ?
  `).bind(...params).run();
  
  await registrarAuditoria(c.env.DB, {
    empresa_id: user.empresa_id,
    usuario_id: user.id,
    acao: 'editar',
    tabela: 'fornecedores',
    registro_id: id,
    dados_novos: body
  });
  
  return c.json({ success: true, message: 'Fornecedor atualizado com sucesso' });
});

// DELETE /fornecedores/:id - Desativar
fornecedores.delete('/:id', requirePermission('fornecedores', 'excluir'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  
  const fornecedorExiste = await c.env.DB.prepare(
    'SELECT id FROM fornecedores WHERE id = ? AND empresa_id = ?'
  ).bind(id, user.empresa_id).first();
  
  if (!fornecedorExiste) {
    return c.json({ success: false, error: 'Fornecedor não encontrado' }, 404);
  }
  
  await c.env.DB.prepare(`
    UPDATE fornecedores SET ativo = 0, updated_at = ? WHERE id = ?
  `).bind(new Date().toISOString(), id).run();
  
  await registrarAuditoria(c.env.DB, {
    empresa_id: user.empresa_id,
    usuario_id: user.id,
    acao: 'excluir',
    tabela: 'fornecedores',
    registro_id: id
  });
  
  return c.json({ success: true, message: 'Fornecedor desativado com sucesso' });
});

// POST /fornecedores/:id/enderecos - Adicionar endereço
fornecedores.post('/:id/enderecos', requirePermission('fornecedores', 'editar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const fornecedorExiste = await c.env.DB.prepare(
    'SELECT id FROM fornecedores WHERE id = ? AND empresa_id = ?'
  ).bind(id, user.empresa_id).first();
  
  if (!fornecedorExiste) {
    return c.json({ success: false, error: 'Fornecedor não encontrado' }, 404);
  }
  
  const enderecoId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO fornecedores_enderecos (
      id, fornecedor_id, tipo, cep, logradouro, numero, complemento,
      bairro, cidade, uf, codigo_ibge, padrao, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    enderecoId, id, body.tipo || 'principal', body.cep, body.logradouro,
    body.numero, body.complemento || null, body.bairro, body.cidade,
    body.uf, body.codigo_ibge || null, body.padrao ? 1 : 0, new Date().toISOString()
  ).run();
  
  return c.json({ success: true, data: { id: enderecoId }, message: 'Endereço adicionado' }, 201);
});

// POST /fornecedores/:id/contatos - Adicionar contato
fornecedores.post('/:id/contatos', requirePermission('fornecedores', 'editar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const fornecedorExiste = await c.env.DB.prepare(
    'SELECT id FROM fornecedores WHERE id = ? AND empresa_id = ?'
  ).bind(id, user.empresa_id).first();
  
  if (!fornecedorExiste) {
    return c.json({ success: false, error: 'Fornecedor não encontrado' }, 404);
  }
  
  const contatoId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO fornecedores_contatos (
      id, fornecedor_id, nome, cargo, email, telefone, celular, principal, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    contatoId, id, body.nome, body.cargo || null, body.email || null,
    body.telefone || null, body.celular || null, body.principal ? 1 : 0,
    new Date().toISOString()
  ).run();
  
  return c.json({ success: true, data: { id: contatoId }, message: 'Contato adicionado' }, 201);
});

// POST /fornecedores/:id/avaliar - Registrar avaliação
fornecedores.post('/:id/avaliar', requirePermission('fornecedores', 'editar'), async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const { avaliacao } = await c.req.json();
  
  if (avaliacao < 0 || avaliacao > 5) {
    return c.json({ success: false, error: 'Avaliação deve ser entre 0 e 5' }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE fornecedores SET avaliacao = ?, updated_at = ? WHERE id = ? AND empresa_id = ?
  `).bind(avaliacao, new Date().toISOString(), id, user.empresa_id).run();
  
  return c.json({ success: true, message: 'Avaliação registrada' });
});

export default fornecedores;
