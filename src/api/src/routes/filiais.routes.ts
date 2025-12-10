// ============================================
// PLANAC ERP - Rotas de Filiais
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const filiais = new Hono<{ Bindings: Bindings; Variables: Variables }>();

filiais.use('/*', requireAuth());

// Schemas
const filialSchema = z.object({
  nome: z.string().min(3),
  cnpj: z.string().optional(),
  inscricao_estadual: z.string().optional(),
  tipo: z.number().min(1).max(4).default(2), // 1=Matriz, 2=Filial, 3=CD, 4=Loja
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2).optional(),
  ibge: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
  responsavel: z.string().optional(),
  ativo: z.boolean().default(true)
});

// GET /filiais - Listar filiais da empresa
filiais.get('/', requirePermission('filiais', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { ativo } = c.req.query();

  let query = `SELECT * FROM filiais WHERE empresa_id = ?`;
  const params: any[] = [usuario.empresa_id];

  if (ativo !== undefined) {
    query += ` AND ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }

  query += ` ORDER BY tipo, nome`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results
  });
});

// GET /filiais/:id - Buscar filial por ID
filiais.get('/:id', requirePermission('filiais', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  const filial = await c.env.DB.prepare(
    `SELECT * FROM filiais WHERE id = ? AND empresa_id = ?`
  ).bind(id, usuario.empresa_id).first();

  if (!filial) {
    return c.json({ success: false, error: 'Filial não encontrada' }, 404);
  }

  return c.json({ success: true, data: filial });
});

// POST /filiais - Criar filial
filiais.post('/', requirePermission('filiais', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const body = await c.req.json();
    const dados = filialSchema.parse(body);
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO filiais (
        id, empresa_id, nome, cnpj, inscricao_estadual, tipo,
        cep, logradouro, numero, complemento, bairro, cidade, uf, ibge,
        telefone, email, responsavel, ativo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, usuario.empresa_id, dados.nome, dados.cnpj || null, dados.inscricao_estadual || null, dados.tipo,
      dados.cep || null, dados.logradouro || null, dados.numero || null, dados.complemento || null,
      dados.bairro || null, dados.cidade || null, dados.uf || null, dados.ibge || null,
      dados.telefone || null, dados.email || null, dados.responsavel || null,
      dados.ativo ? 1 : 0, now, now
    ).run();

    await registrarAuditoria(c.env.DB, {
      usuario_id: usuario.id,
      empresa_id: usuario.empresa_id,
      acao: 'criar',
      entidade: 'filiais',
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

// PUT /filiais/:id - Atualizar filial
filiais.put('/:id', requirePermission('filiais', 'editar'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  try {
    const body = await c.req.json();
    const dados = filialSchema.partial().parse(body);

    // Verificar se existe
    const filialAtual = await c.env.DB.prepare(
      `SELECT * FROM filiais WHERE id = ? AND empresa_id = ?`
    ).bind(id, usuario.empresa_id).first();

    if (!filialAtual) {
      return c.json({ success: false, error: 'Filial não encontrada' }, 404);
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
        `UPDATE filiais SET ${campos.join(', ')} WHERE id = ? AND empresa_id = ?`
      ).bind(...valores).run();

      await registrarAuditoria(c.env.DB, {
        usuario_id: usuario.id,
        empresa_id: usuario.empresa_id,
        acao: 'editar',
        entidade: 'filiais',
        entidade_id: id,
        dados_anteriores: filialAtual,
        dados_novos: dados
      });
    }

    return c.json({ success: true, message: 'Filial atualizada' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: 'Dados inválidos', details: error.errors }, 400);
    }
    throw error;
  }
});

// DELETE /filiais/:id - Excluir filial
filiais.delete('/:id', requirePermission('filiais', 'excluir'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  // Verificar se é matriz
  const filial = await c.env.DB.prepare(
    `SELECT * FROM filiais WHERE id = ? AND empresa_id = ?`
  ).bind(id, usuario.empresa_id).first<any>();

  if (!filial) {
    return c.json({ success: false, error: 'Filial não encontrada' }, 404);
  }

  if (filial.tipo === 1) {
    return c.json({ success: false, error: 'Não é possível excluir a matriz' }, 400);
  }

  // Verificar dependências
  const deps = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM pedidos_venda WHERE filial_id = ?`
  ).bind(id).first<{ total: number }>();

  if (deps && deps.total > 0) {
    return c.json({ 
      success: false, 
      error: 'Filial possui pedidos vinculados. Inative-a ao invés de excluir.' 
    }, 400);
  }

  await c.env.DB.prepare(
    `DELETE FROM filiais WHERE id = ? AND empresa_id = ?`
  ).bind(id, usuario.empresa_id).run();

  await registrarAuditoria(c.env.DB, {
    usuario_id: usuario.id,
    empresa_id: usuario.empresa_id,
    acao: 'excluir',
    entidade: 'filiais',
    entidade_id: id,
    dados_anteriores: filial
  });

  return c.json({ success: true, message: 'Filial excluída' });
});

export default filiais;
