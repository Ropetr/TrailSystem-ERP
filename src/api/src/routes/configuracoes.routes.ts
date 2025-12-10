// ============================================
// PLANAC ERP - Rotas de Configurações
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const configuracoes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

configuracoes.use('/*', requireAuth());

// Schema
const configuracaoSchema = z.object({
  chave: z.string().min(1),
  valor: z.string(),
  tipo: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
  descricao: z.string().optional(),
  editavel: z.boolean().default(true)
});

// GET /configuracoes - Listar todas configurações
configuracoes.get('/', requirePermission('configuracoes', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const { grupo, editavel } = c.req.query();

  let query = `SELECT * FROM configuracoes WHERE empresa_id = ?`;
  const params: any[] = [usuario.empresa_id];

  if (grupo) {
    query += ` AND chave LIKE ?`;
    params.push(`${grupo}%`);
  }

  if (editavel !== undefined) {
    query += ` AND editavel = ?`;
    params.push(editavel === 'true' ? 1 : 0);
  }

  query += ` ORDER BY chave`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  // Agrupar por prefixo
  const configs: Record<string, any[]> = {};
  result.results?.forEach((cfg: any) => {
    const grupo = cfg.chave.split('.')[0];
    if (!configs[grupo]) configs[grupo] = [];
    configs[grupo].push({
      ...cfg,
      valor_parseado: parseValor(cfg.valor, cfg.tipo)
    });
  });

  return c.json({
    success: true,
    data: result.results,
    agrupado: configs
  });
});

// GET /configuracoes/:chave - Buscar configuração específica
configuracoes.get('/:chave', requirePermission('configuracoes', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const chave = c.req.param('chave');

  const config = await c.env.DB.prepare(
    `SELECT * FROM configuracoes WHERE empresa_id = ? AND chave = ?`
  ).bind(usuario.empresa_id, chave).first();

  if (!config) {
    return c.json({ success: false, error: 'Configuração não encontrada' }, 404);
  }

  return c.json({
    success: true,
    data: {
      ...config,
      valor_parseado: parseValor((config as any).valor, (config as any).tipo)
    }
  });
});

// PUT /configuracoes/:chave - Atualizar configuração
configuracoes.put('/:chave', requirePermission('configuracoes', 'editar'), async (c) => {
  const usuario = c.get('usuario');
  const chave = c.req.param('chave');

  try {
    const body = await c.req.json();
    const { valor } = body;

    if (valor === undefined) {
      return c.json({ success: false, error: 'Valor é obrigatório' }, 400);
    }

    // Verificar se existe e é editável
    const configAtual = await c.env.DB.prepare(
      `SELECT * FROM configuracoes WHERE empresa_id = ? AND chave = ?`
    ).bind(usuario.empresa_id, chave).first<any>();

    if (!configAtual) {
      return c.json({ success: false, error: 'Configuração não encontrada' }, 404);
    }

    if (!configAtual.editavel) {
      return c.json({ success: false, error: 'Esta configuração não pode ser alterada' }, 403);
    }

    // Validar tipo
    const valorString = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);

    await c.env.DB.prepare(`
      UPDATE configuracoes SET valor = ?, updated_at = ? WHERE empresa_id = ? AND chave = ?
    `).bind(valorString, new Date().toISOString(), usuario.empresa_id, chave).run();

    await registrarAuditoria(c.env.DB, {
      usuario_id: usuario.id,
      empresa_id: usuario.empresa_id,
      acao: 'editar',
      entidade: 'configuracoes',
      entidade_id: chave,
      dados_anteriores: { valor: configAtual.valor },
      dados_novos: { valor: valorString }
    });

    // Invalidar cache
    await c.env.KV_CACHE.delete(`config:${usuario.empresa_id}:${chave}`);

    return c.json({ success: true, message: 'Configuração atualizada' });
  } catch (error) {
    return c.json({ success: false, error: 'Erro ao atualizar configuração' }, 500);
  }
});

// POST /configuracoes - Criar nova configuração
configuracoes.post('/', requirePermission('configuracoes', 'criar'), async (c) => {
  const usuario = c.get('usuario');

  try {
    const body = await c.req.json();
    const dados = configuracaoSchema.parse(body);

    // Verificar se já existe
    const existe = await c.env.DB.prepare(
      `SELECT id FROM configuracoes WHERE empresa_id = ? AND chave = ?`
    ).bind(usuario.empresa_id, dados.chave).first();

    if (existe) {
      return c.json({ success: false, error: 'Configuração já existe' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO configuracoes (id, empresa_id, chave, valor, tipo, descricao, editavel, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, usuario.empresa_id, dados.chave, dados.valor, dados.tipo,
      dados.descricao || null, dados.editavel ? 1 : 0, now, now
    ).run();

    await registrarAuditoria(c.env.DB, {
      usuario_id: usuario.id,
      empresa_id: usuario.empresa_id,
      acao: 'criar',
      entidade: 'configuracoes',
      entidade_id: dados.chave,
      dados_novos: dados
    });

    return c.json({ success: true, data: { id, chave: dados.chave } }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: 'Dados inválidos', details: error.errors }, 400);
    }
    throw error;
  }
});

// POST /configuracoes/lote - Atualizar várias configurações
configuracoes.post('/lote', requirePermission('configuracoes', 'editar'), async (c) => {
  const usuario = c.get('usuario');

  try {
    const body = await c.req.json();
    const { configs } = body;

    if (!Array.isArray(configs)) {
      return c.json({ success: false, error: 'Formato inválido' }, 400);
    }

    const atualizados: string[] = [];
    const erros: { chave: string; erro: string }[] = [];

    for (const { chave, valor } of configs) {
      const config = await c.env.DB.prepare(
        `SELECT editavel FROM configuracoes WHERE empresa_id = ? AND chave = ?`
      ).bind(usuario.empresa_id, chave).first<any>();

      if (!config) {
        erros.push({ chave, erro: 'Não encontrada' });
        continue;
      }

      if (!config.editavel) {
        erros.push({ chave, erro: 'Não editável' });
        continue;
      }

      const valorString = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);

      await c.env.DB.prepare(`
        UPDATE configuracoes SET valor = ?, updated_at = ? WHERE empresa_id = ? AND chave = ?
      `).bind(valorString, new Date().toISOString(), usuario.empresa_id, chave).run();

      await c.env.KV_CACHE.delete(`config:${usuario.empresa_id}:${chave}`);
      atualizados.push(chave);
    }

    await registrarAuditoria(c.env.DB, {
      usuario_id: usuario.id,
      empresa_id: usuario.empresa_id,
      acao: 'editar',
      entidade: 'configuracoes',
      descricao: `Atualização em lote: ${atualizados.length} configurações`
    });

    return c.json({
      success: true,
      atualizados,
      erros
    });
  } catch (error) {
    return c.json({ success: false, error: 'Erro ao atualizar configurações' }, 500);
  }
});

// Função auxiliar para parsear valor
function parseValor(valor: string, tipo: string): any {
  switch (tipo) {
    case 'number':
      return Number(valor);
    case 'boolean':
      return valor === 'true' || valor === '1';
    case 'json':
      try {
        return JSON.parse(valor);
      } catch {
        return valor;
      }
    default:
      return valor;
  }
}

export default configuracoes;
