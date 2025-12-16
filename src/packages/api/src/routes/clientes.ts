// =============================================
// PLANAC ERP - Rotas de Clientes
// Migrado de src/api/ para src/packages/api/
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const clientes = new Hono<{ Bindings: Env }>();

// =============================================
// GET /clientes - Listar clientes
// =============================================
clientes.get('/', async (c) => {
  const { page = '1', limit = '20', busca, segmento, ativo, vendedor_id, empresa_id } = c.req.query();

  try {
    let query = `SELECT * FROM clientes WHERE 1=1`;
    const params: any[] = [];

    if (empresa_id) {
      query += ` AND empresa_id = ?`;
      params.push(empresa_id);
    }

    if (busca) {
      query += ` AND (razao_social LIKE ? OR nome_fantasia LIKE ? OR cpf_cnpj LIKE ? OR email LIKE ?)`;
      const termo = `%${busca}%`;
      params.push(termo, termo, termo, termo);
    }

    if (segmento) {
      query += ` AND segmento = ?`;
      params.push(segmento);
    }

    if (ativo !== undefined && ativo !== '') {
      query += ` AND ativo = ?`;
      params.push(ativo === 'true' ? 1 : 0);
    }

    if (vendedor_id) {
      query += ` AND vendedor_id = ?`;
      params.push(vendedor_id);
    }

    // Contagem
    const countResult = await c.env.DB.prepare(
      query.replace('SELECT *', 'SELECT COUNT(*) as total')
    ).bind(...params).first<{ total: number }>();

    // Paginacao
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
    console.error('Erro ao listar clientes:', error);
    return c.json({ success: false, error: 'Erro ao listar clientes' }, 500);
  }
});

// =============================================
// GET /clientes/:id - Buscar cliente
// =============================================
clientes.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const cliente = await c.env.DB.prepare(`
      SELECT * FROM clientes WHERE id = ?
    `).bind(id).first();

    if (!cliente) {
      return c.json({ success: false, error: 'Cliente nao encontrado' }, 404);
    }

    // Buscar enderecos
    const enderecos = await c.env.DB.prepare(`
      SELECT * FROM clientes_enderecos WHERE cliente_id = ? ORDER BY principal DESC
    `).bind(id).all();

    // Buscar contatos
    const contatos = await c.env.DB.prepare(`
      SELECT * FROM clientes_contatos WHERE cliente_id = ?
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...cliente,
        enderecos: enderecos.results,
        contatos: contatos.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar cliente:', error);
    return c.json({ success: false, error: 'Erro ao buscar cliente' }, 500);
  }
});

// =============================================
// POST /clientes - Criar cliente
// =============================================
clientes.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      tipo: 'PF' | 'PJ';
      razao_social: string;
      nome_fantasia?: string;
      cpf_cnpj: string;
      inscricao_estadual?: string;
      inscricao_municipal?: string;
      email?: string;
      telefone?: string;
      celular?: string;
      vendedor_id?: string;
      tabela_preco_id?: string;
      condicao_pagamento_id?: string;
      limite_credito?: number;
      segmento?: string;
      origem?: string;
      observacao?: string;
      empresa_id?: string;
      endereco?: {
        cep: string;
        logradouro: string;
        numero: string;
        complemento?: string;
        bairro: string;
        cidade: string;
        uf: string;
        codigo_ibge?: string;
      };
      contato?: {
        nome: string;
        cargo?: string;
        email?: string;
        telefone?: string;
        celular?: string;
      };
    }>();

    // Validacoes basicas
    if (!body.razao_social || body.razao_social.length < 3) {
      return c.json({ success: false, error: 'Razao social deve ter no minimo 3 caracteres' }, 400);
    }
    if (!body.cpf_cnpj || body.cpf_cnpj.length < 11) {
      return c.json({ success: false, error: 'CPF/CNPJ invalido' }, 400);
    }

    const empresaId = body.empresa_id || 'empresa_planac_001';

    // Verificar CPF/CNPJ unico
    const existe = await c.env.DB.prepare(`
      SELECT id FROM clientes WHERE cpf_cnpj = ? AND empresa_id = ?
    `).bind(body.cpf_cnpj.replace(/\D/g, ''), empresaId).first();

    if (existe) {
      return c.json({ success: false, error: 'CPF/CNPJ ja cadastrado' }, 400);
    }

    // Gerar codigo sequencial
    const ultimoCodigo = await c.env.DB.prepare(`
      SELECT MAX(CAST(codigo AS INTEGER)) as max_codigo FROM clientes WHERE empresa_id = ?
    `).bind(empresaId).first<{ max_codigo: number }>();
    const novoCodigo = String((ultimoCodigo?.max_codigo || 0) + 1).padStart(6, '0');

    // Criar cliente
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO clientes (
        id, empresa_id, codigo, tipo, razao_social, nome_fantasia, cpf_cnpj,
        inscricao_estadual, inscricao_municipal, email, telefone, celular,
        vendedor_id, tabela_preco_id, condicao_pagamento_id, limite_credito,
        segmento, origem, observacao, ativo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      id, empresaId, novoCodigo, body.tipo || 'PJ',
      body.razao_social, body.nome_fantasia || null,
      body.cpf_cnpj.replace(/\D/g, ''),
      body.inscricao_estadual || null, body.inscricao_municipal || null,
      body.email || null, body.telefone || null, body.celular || null,
      body.vendedor_id || null, body.tabela_preco_id || null,
      body.condicao_pagamento_id || null, body.limite_credito || 0,
      body.segmento || null, body.origem || null, body.observacao || null,
      now, now
    ).run();

    // Criar endereco se fornecido
    if (body.endereco) {
      await c.env.DB.prepare(`
        INSERT INTO clientes_enderecos (
          id, cliente_id, tipo, cep, logradouro, numero, complemento,
          bairro, cidade, uf, codigo_ibge, principal, created_at
        ) VALUES (?, ?, 'principal', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `).bind(
        crypto.randomUUID(), id,
        body.endereco.cep, body.endereco.logradouro, body.endereco.numero,
        body.endereco.complemento || null, body.endereco.bairro,
        body.endereco.cidade, body.endereco.uf, body.endereco.codigo_ibge || null,
        now
      ).run();
    }

    // Criar contato se fornecido
    if (body.contato) {
      await c.env.DB.prepare(`
        INSERT INTO clientes_contatos (
          id, cliente_id, nome, cargo, email, telefone, celular, principal, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
      `).bind(
        crypto.randomUUID(), id,
        body.contato.nome, body.contato.cargo || null,
        body.contato.email || null, body.contato.telefone || null,
        body.contato.celular || null, now
      ).run();
    }

    return c.json({
      success: true,
      data: { id, codigo: novoCodigo },
      message: 'Cliente criado com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error);
    return c.json({ success: false, error: 'Erro ao criar cliente' }, 500);
  }
});

// =============================================
// PUT /clientes/:id - Editar cliente
// =============================================
clientes.put('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      razao_social?: string;
      nome_fantasia?: string;
      email?: string;
      telefone?: string;
      celular?: string;
      vendedor_id?: string;
      tabela_preco_id?: string;
      condicao_pagamento_id?: string;
      limite_credito?: number;
      segmento?: string;
      observacao?: string;
      ativo?: boolean;
    }>();

    const cliente = await c.env.DB.prepare(`
      SELECT * FROM clientes WHERE id = ?
    `).bind(id).first();

    if (!cliente) {
      return c.json({ success: false, error: 'Cliente nao encontrado' }, 404);
    }

    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [new Date().toISOString()];

    if (body.razao_social !== undefined) { updates.push('razao_social = ?'); params.push(body.razao_social); }
    if (body.nome_fantasia !== undefined) { updates.push('nome_fantasia = ?'); params.push(body.nome_fantasia); }
    if (body.email !== undefined) { updates.push('email = ?'); params.push(body.email); }
    if (body.telefone !== undefined) { updates.push('telefone = ?'); params.push(body.telefone); }
    if (body.celular !== undefined) { updates.push('celular = ?'); params.push(body.celular); }
    if (body.vendedor_id !== undefined) { updates.push('vendedor_id = ?'); params.push(body.vendedor_id); }
    if (body.tabela_preco_id !== undefined) { updates.push('tabela_preco_id = ?'); params.push(body.tabela_preco_id); }
    if (body.condicao_pagamento_id !== undefined) { updates.push('condicao_pagamento_id = ?'); params.push(body.condicao_pagamento_id); }
    if (body.limite_credito !== undefined) { updates.push('limite_credito = ?'); params.push(body.limite_credito); }
    if (body.segmento !== undefined) { updates.push('segmento = ?'); params.push(body.segmento); }
    if (body.observacao !== undefined) { updates.push('observacao = ?'); params.push(body.observacao); }
    if (body.ativo !== undefined) { updates.push('ativo = ?'); params.push(body.ativo ? 1 : 0); }

    params.push(id);

    await c.env.DB.prepare(`
      UPDATE clientes SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return c.json({ success: true, message: 'Cliente atualizado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao editar cliente:', error);
    return c.json({ success: false, error: 'Erro ao editar cliente' }, 500);
  }
});

// =============================================
// DELETE /clientes/:id - Desativar cliente
// =============================================
clientes.delete('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const cliente = await c.env.DB.prepare(`
      SELECT razao_social FROM clientes WHERE id = ?
    `).bind(id).first();

    if (!cliente) {
      return c.json({ success: false, error: 'Cliente nao encontrado' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE clientes SET ativo = 0, updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Cliente desativado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desativar cliente:', error);
    return c.json({ success: false, error: 'Erro ao desativar cliente' }, 500);
  }
});

// =============================================
// GET /clientes/:id/historico - Historico de compras
// =============================================
clientes.get('/:id/historico', async (c) => {
  const { id } = c.req.param();
  const { limit = '10' } = c.req.query();

  try {
    const vendas = await c.env.DB.prepare(`
      SELECT id, numero, data_emissao, valor_total, status
      FROM vendas
      WHERE cliente_id = ?
      ORDER BY data_emissao DESC
      LIMIT ?
    `).bind(id, parseInt(limit)).all();

    const orcamentos = await c.env.DB.prepare(`
      SELECT id, numero, data_emissao, valor_total, status
      FROM orcamentos
      WHERE cliente_id = ?
      ORDER BY data_emissao DESC
      LIMIT ?
    `).bind(id, parseInt(limit)).all();

    return c.json({
      success: true,
      data: {
        vendas: vendas.results,
        orcamentos: orcamentos.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar historico:', error);
    return c.json({ success: false, error: 'Erro ao buscar historico' }, 500);
  }
});

// =============================================
// POST /clientes/:id/enderecos - Adicionar endereco
// =============================================
clientes.post('/:id/enderecos', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      tipo: string;
      cep: string;
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
      codigo_ibge?: string;
      principal?: boolean;
    }>();

    const enderecoId = crypto.randomUUID();

    // Se for principal, desmarcar outros
    if (body.principal) {
      await c.env.DB.prepare(`
        UPDATE clientes_enderecos SET principal = 0 WHERE cliente_id = ?
      `).bind(id).run();
    }

    await c.env.DB.prepare(`
      INSERT INTO clientes_enderecos (
        id, cliente_id, tipo, cep, logradouro, numero, complemento,
        bairro, cidade, uf, codigo_ibge, principal, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      enderecoId, id, body.tipo, body.cep, body.logradouro, body.numero,
      body.complemento || null, body.bairro, body.cidade, body.uf,
      body.codigo_ibge || null, body.principal ? 1 : 0
    ).run();

    return c.json({ success: true, data: { id: enderecoId }, message: 'Endereco adicionado' }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao adicionar endereco' }, 500);
  }
});

// =============================================
// POST /clientes/:id/contatos - Adicionar contato
// =============================================
clientes.post('/:id/contatos', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      nome: string;
      cargo?: string;
      email?: string;
      telefone?: string;
      celular?: string;
      principal?: boolean;
    }>();

    const contatoId = crypto.randomUUID();

    if (body.principal) {
      await c.env.DB.prepare(`
        UPDATE clientes_contatos SET principal = 0 WHERE cliente_id = ?
      `).bind(id).run();
    }

    await c.env.DB.prepare(`
      INSERT INTO clientes_contatos (
        id, cliente_id, nome, cargo, email, telefone, celular, principal, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      contatoId, id, body.nome, body.cargo || null,
      body.email || null, body.telefone || null, body.celular || null,
      body.principal ? 1 : 0
    ).run();

    return c.json({ success: true, data: { id: contatoId }, message: 'Contato adicionado' }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao adicionar contato' }, 500);
  }
});

export default clientes;
