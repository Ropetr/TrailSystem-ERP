// ============================================
// PLANAC ERP - Rotas de Empresas
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const empresas = new Hono<{ Bindings: Bindings; Variables: Variables }>();

empresas.use('/*', requireAuth());

// Schemas
const empresaSchema = z.object({
  razao_social: z.string().min(3),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().min(14),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  regime_tributario: z.number().min(1).max(4).default(1), // 1=SN, 2=SN Excesso, 3=LP, 4=LR
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
  site: z.string().url().optional(),
  logo_url: z.string().url().optional()
});

// GET /empresas - Dados da empresa do usuário
empresas.get('/', requirePermission('empresas', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');

  const empresa = await c.env.DB.prepare(
    `SELECT * FROM empresas WHERE id = ?`
  ).bind(usuario.empresa_id).first();

  if (!empresa) {
    return c.json({ success: false, error: 'Empresa não encontrada' }, 404);
  }

  // Buscar filiais
  const filiais = await c.env.DB.prepare(
    `SELECT id, nome, tipo, cidade, uf, ativo FROM filiais WHERE empresa_id = ? ORDER BY tipo, nome`
  ).bind(usuario.empresa_id).all();

  return c.json({
    success: true,
    data: {
      ...empresa,
      filiais: filiais.results
    }
  });
});

// GET /empresas/:id - Buscar empresa por ID (admin)
empresas.get('/:id', requirePermission('empresas', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  // Verificar se usuário tem acesso a essa empresa
  if (id !== usuario.empresa_id) {
    return c.json({ success: false, error: 'Acesso negado' }, 403);
  }

  const empresa = await c.env.DB.prepare(
    `SELECT * FROM empresas WHERE id = ?`
  ).bind(id).first();

  if (!empresa) {
    return c.json({ success: false, error: 'Empresa não encontrada' }, 404);
  }

  return c.json({ success: true, data: empresa });
});

// PUT /empresas - Atualizar dados da empresa
empresas.put('/', requirePermission('empresas', 'editar'), async (c) => {
  const usuario = c.get('usuario');

  try {
    const body = await c.req.json();
    const dados = empresaSchema.partial().parse(body);

    const empresaAtual = await c.env.DB.prepare(
      `SELECT * FROM empresas WHERE id = ?`
    ).bind(usuario.empresa_id).first();

    if (!empresaAtual) {
      return c.json({ success: false, error: 'Empresa não encontrada' }, 404);
    }

    const campos: string[] = [];
    const valores: any[] = [];

    Object.entries(dados).forEach(([key, value]) => {
      if (value !== undefined) {
        campos.push(`${key} = ?`);
        valores.push(value);
      }
    });

    if (campos.length > 0) {
      campos.push('updated_at = ?');
      valores.push(new Date().toISOString());
      valores.push(usuario.empresa_id);

      await c.env.DB.prepare(
        `UPDATE empresas SET ${campos.join(', ')} WHERE id = ?`
      ).bind(...valores).run();

      await registrarAuditoria(c.env.DB, {
        usuario_id: usuario.id,
        empresa_id: usuario.empresa_id,
        acao: 'editar',
        entidade: 'empresas',
        entidade_id: usuario.empresa_id,
        dados_anteriores: empresaAtual,
        dados_novos: dados
      });
    }

    return c.json({ success: true, message: 'Empresa atualizada' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: 'Dados inválidos', details: error.errors }, 400);
    }
    throw error;
  }
});

// POST /empresas/certificado - Upload certificado digital
empresas.post('/certificado', requirePermission('empresas', 'editar'), async (c) => {
  const usuario = c.get('usuario');

  try {
    const body = await c.req.json();
    const { certificado_base64, senha, validade } = body;

    if (!certificado_base64 || !senha) {
      return c.json({ success: false, error: 'Certificado e senha são obrigatórios' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE empresas SET 
        certificado_digital = ?,
        certificado_validade = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      certificado_base64,
      validade || null,
      new Date().toISOString(),
      usuario.empresa_id
    ).run();

    // Salvar senha no KV (criptografada em produção)
    await c.env.KV_CACHE.put(
      `cert_senha:${usuario.empresa_id}`,
      senha,
      { expirationTtl: 86400 * 365 } // 1 ano
    );

    await registrarAuditoria(c.env.DB, {
      usuario_id: usuario.id,
      empresa_id: usuario.empresa_id,
      acao: 'editar',
      entidade: 'empresas',
      entidade_id: usuario.empresa_id,
      descricao: 'Certificado digital atualizado'
    });

    return c.json({ success: true, message: 'Certificado salvo com sucesso' });
  } catch (error) {
    return c.json({ success: false, error: 'Erro ao salvar certificado' }, 500);
  }
});

// GET /empresas/regimes - Listar regimes tributários
empresas.get('/aux/regimes', async (c) => {
  return c.json({
    success: true,
    data: [
      { id: 1, nome: 'Simples Nacional', sigla: 'SN' },
      { id: 2, nome: 'Simples Nacional - Excesso', sigla: 'SN-E' },
      { id: 3, nome: 'Lucro Presumido', sigla: 'LP' },
      { id: 4, nome: 'Lucro Real', sigla: 'LR' }
    ]
  });
});

export default empresas;
