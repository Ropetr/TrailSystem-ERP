// =============================================
// PLANAC ERP - Rotas de Fornecedores
// Migrado de src/api/ para src/packages/api/
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const fornecedores = new Hono<{ Bindings: Env }>();

// =============================================
// GET /fornecedores - Listar
// =============================================
fornecedores.get('/', async (c) => {
  const { page = '1', limit = '20', busca, ativo, empresa_id } = c.req.query();

  try {
    let query = `SELECT * FROM fornecedores WHERE 1=1`;
    const params: any[] = [];

    if (empresa_id) {
      query += ` AND empresa_id = ?`;
      params.push(empresa_id);
    }

    if (busca) {
      query += ` AND (razao_social LIKE ? OR nome_fantasia LIKE ? OR cpf_cnpj LIKE ?)`;
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }

    if (ativo !== undefined && ativo !== '') {
      query += ` AND ativo = ?`;
      params.push(ativo === 'true' ? 1 : 0);
    }

    const countResult = await c.env.DB.prepare(
      query.replace('SELECT *', 'SELECT COUNT(*) as total')
    ).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    query += ` ORDER BY razao_social LIMIT ? OFFSET ?`;
    params.push(limitNum, (pageNum - 1) * limitNum);

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: result.results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar fornecedores:', error);
    return c.json({ success: false, error: 'Erro ao listar fornecedores' }, 500);
  }
});

// =============================================
// GET /fornecedores/:id - Buscar
// =============================================
fornecedores.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const fornecedor = await c.env.DB.prepare(`
      SELECT * FROM fornecedores WHERE id = ?
    `).bind(id).first();

    if (!fornecedor) {
      return c.json({ success: false, error: 'Fornecedor nao encontrado' }, 404);
    }

    const contatos = await c.env.DB.prepare(`
      SELECT * FROM fornecedores_contatos WHERE fornecedor_id = ?
    `).bind(id).all();

    return c.json({
      success: true,
      data: { ...fornecedor, contatos: contatos.results }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao buscar fornecedor' }, 500);
  }
});

// =============================================
// POST /fornecedores - Criar
// =============================================
fornecedores.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      tipo: 'PF' | 'PJ';
      razao_social: string;
      nome_fantasia?: string;
      cpf_cnpj: string;
      inscricao_estadual?: string;
      email?: string;
      telefone?: string;
      celular?: string;
      cep?: string;
      logradouro?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      cidade?: string;
      uf?: string;
      observacao?: string;
      empresa_id?: string;
    }>();

    if (!body.razao_social || body.razao_social.length < 3) {
      return c.json({ success: false, error: 'Razao social obrigatoria' }, 400);
    }

    const empresaId = body.empresa_id || 'empresa_planac_001';

    const existe = await c.env.DB.prepare(`
      SELECT id FROM fornecedores WHERE cpf_cnpj = ? AND empresa_id = ?
    `).bind(body.cpf_cnpj?.replace(/\D/g, ''), empresaId).first();

    if (existe) {
      return c.json({ success: false, error: 'CNPJ ja cadastrado' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO fornecedores (
        id, empresa_id, tipo, razao_social, nome_fantasia, cpf_cnpj,
        inscricao_estadual, email, telefone, celular,
        cep, logradouro, numero, complemento, bairro, cidade, uf,
        observacao, ativo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      id, empresaId, body.tipo || 'PJ', body.razao_social, body.nome_fantasia || null,
      body.cpf_cnpj?.replace(/\D/g, '') || null, body.inscricao_estadual || null,
      body.email || null, body.telefone || null, body.celular || null,
      body.cep || null, body.logradouro || null, body.numero || null,
      body.complemento || null, body.bairro || null, body.cidade || null, body.uf || null,
      body.observacao || null, now, now
    ).run();

    return c.json({ success: true, data: { id }, message: 'Fornecedor criado' }, 201);
  } catch (error: any) {
    console.error('Erro ao criar fornecedor:', error);
    return c.json({ success: false, error: 'Erro ao criar fornecedor' }, 500);
  }
});

// =============================================
// PUT /fornecedores/:id - Editar
// =============================================
fornecedores.put('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      razao_social?: string;
      nome_fantasia?: string;
      email?: string;
      telefone?: string;
      celular?: string;
      cep?: string;
      logradouro?: string;
      numero?: string;
      bairro?: string;
      cidade?: string;
      uf?: string;
      observacao?: string;
      ativo?: boolean;
    }>();

    const fornecedor = await c.env.DB.prepare(`
      SELECT id FROM fornecedores WHERE id = ?
    `).bind(id).first();

    if (!fornecedor) {
      return c.json({ success: false, error: 'Fornecedor nao encontrado' }, 404);
    }

    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [new Date().toISOString()];

    if (body.razao_social !== undefined) { updates.push('razao_social = ?'); params.push(body.razao_social); }
    if (body.nome_fantasia !== undefined) { updates.push('nome_fantasia = ?'); params.push(body.nome_fantasia); }
    if (body.email !== undefined) { updates.push('email = ?'); params.push(body.email); }
    if (body.telefone !== undefined) { updates.push('telefone = ?'); params.push(body.telefone); }
    if (body.celular !== undefined) { updates.push('celular = ?'); params.push(body.celular); }
    if (body.cep !== undefined) { updates.push('cep = ?'); params.push(body.cep); }
    if (body.logradouro !== undefined) { updates.push('logradouro = ?'); params.push(body.logradouro); }
    if (body.numero !== undefined) { updates.push('numero = ?'); params.push(body.numero); }
    if (body.bairro !== undefined) { updates.push('bairro = ?'); params.push(body.bairro); }
    if (body.cidade !== undefined) { updates.push('cidade = ?'); params.push(body.cidade); }
    if (body.uf !== undefined) { updates.push('uf = ?'); params.push(body.uf); }
    if (body.observacao !== undefined) { updates.push('observacao = ?'); params.push(body.observacao); }
    if (body.ativo !== undefined) { updates.push('ativo = ?'); params.push(body.ativo ? 1 : 0); }

    params.push(id);

    await c.env.DB.prepare(`
      UPDATE fornecedores SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return c.json({ success: true, message: 'Fornecedor atualizado' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao editar fornecedor' }, 500);
  }
});

// =============================================
// DELETE /fornecedores/:id - Desativar
// =============================================
fornecedores.delete('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    await c.env.DB.prepare(`
      UPDATE fornecedores SET ativo = 0, updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Fornecedor desativado' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao desativar fornecedor' }, 500);
  }
});

export default fornecedores;
