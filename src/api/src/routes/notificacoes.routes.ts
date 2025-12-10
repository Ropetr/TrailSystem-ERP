// ============================================
// PLANAC ERP - Rotas de Notificações
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';

const notificacoes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

notificacoes.use('/*', requireAuth());

// ============================================
// SCHEMAS
// ============================================

const notificacaoSchema = z.object({
  usuario_id: z.string().uuid(),
  tipo: z.enum([
    'INFO', 'SUCESSO', 'AVISO', 'ERRO', 'TAREFA', 'PEDIDO', 'PAGAMENTO',
    'ESTOQUE', 'VENCIMENTO', 'SISTEMA'
  ]).default('INFO'),
  titulo: z.string().min(2).max(200),
  mensagem: z.string().max(1000),
  link: z.string().max(500).optional(),
  link_texto: z.string().max(100).optional(),
  dados: z.record(z.any()).optional(),
  prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA']).default('NORMAL'),
  expira_em: z.string().optional()
});

const configSchema = z.object({
  tipo: z.string(),
  email: z.boolean().default(false),
  push: z.boolean().default(false),
  sistema: z.boolean().default(true)
});

// ============================================
// MINHAS NOTIFICAÇÕES
// ============================================

// GET /notificacoes - Listar minhas notificações
notificacoes.get('/', async (c) => {
  const usuario = c.get('usuario');
  const { lida, tipo, page = '1', limit = '20' } = c.req.query();

  let query = `
    SELECT * FROM notificacoes
    WHERE empresa_id = ? AND usuario_id = ?
  `;
  const params: any[] = [usuario.empresa_id, usuario.id];

  if (lida !== undefined) {
    query += ` AND lida = ?`;
    params.push(lida === 'true' ? 1 : 0);
  }

  if (tipo) {
    query += ` AND tipo = ?`;
    params.push(tipo);
  }

  // Não mostrar expiradas
  query += ` AND (expira_em IS NULL OR expira_em > CURRENT_TIMESTAMP)`;

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({ success: true, data: result.results });
});

// GET /notificacoes/nao-lidas - Contador de não lidas
notificacoes.get('/nao-lidas', async (c) => {
  const usuario = c.get('usuario');

  const count = await c.env.DB.prepare(`
    SELECT COUNT(*) as total
    FROM notificacoes
    WHERE empresa_id = ? AND usuario_id = ? AND lida = 0
      AND (expira_em IS NULL OR expira_em > CURRENT_TIMESTAMP)
  `).bind(usuario.empresa_id, usuario.id).first<{ total: number }>();

  // Por tipo
  const porTipo = await c.env.DB.prepare(`
    SELECT tipo, COUNT(*) as quantidade
    FROM notificacoes
    WHERE empresa_id = ? AND usuario_id = ? AND lida = 0
      AND (expira_em IS NULL OR expira_em > CURRENT_TIMESTAMP)
    GROUP BY tipo
  `).bind(usuario.empresa_id, usuario.id).all();

  return c.json({
    success: true,
    data: {
      total: count?.total || 0,
      por_tipo: porTipo.results
    }
  });
});

// GET /notificacoes/recentes - Últimas 5 para dropdown
notificacoes.get('/recentes', async (c) => {
  const usuario = c.get('usuario');

  const result = await c.env.DB.prepare(`
    SELECT * FROM notificacoes
    WHERE empresa_id = ? AND usuario_id = ?
      AND (expira_em IS NULL OR expira_em > CURRENT_TIMESTAMP)
    ORDER BY created_at DESC
    LIMIT 5
  `).bind(usuario.empresa_id, usuario.id).all();

  const naoLidas = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM notificacoes
    WHERE empresa_id = ? AND usuario_id = ? AND lida = 0
      AND (expira_em IS NULL OR expira_em > CURRENT_TIMESTAMP)
  `).bind(usuario.empresa_id, usuario.id).first<{ total: number }>();

  return c.json({
    success: true,
    data: {
      notificacoes: result.results,
      nao_lidas: naoLidas?.total || 0
    }
  });
});

// GET /notificacoes/:id - Buscar notificação
notificacoes.get('/:id', async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const notificacao = await c.env.DB.prepare(`
    SELECT * FROM notificacoes
    WHERE id = ? AND empresa_id = ? AND usuario_id = ?
  `).bind(id, usuario.empresa_id, usuario.id).first();

  if (!notificacao) {
    return c.json({ success: false, error: 'Notificação não encontrada' }, 404);
  }

  return c.json({ success: true, data: notificacao });
});

// POST /notificacoes/:id/ler - Marcar como lida
notificacoes.post('/:id/ler', async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const notificacao = await c.env.DB.prepare(`
    SELECT * FROM notificacoes WHERE id = ? AND usuario_id = ?
  `).bind(id, usuario.id).first();

  if (!notificacao) {
    return c.json({ success: false, error: 'Notificação não encontrada' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE notificacoes SET lida = 1, lida_em = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(id).run();

  return c.json({ success: true, message: 'Notificação marcada como lida' });
});

// POST /notificacoes/ler-todas - Marcar todas como lidas
notificacoes.post('/ler-todas', async (c) => {
  const usuario = c.get('usuario');

  const result = await c.env.DB.prepare(`
    UPDATE notificacoes SET lida = 1, lida_em = CURRENT_TIMESTAMP
    WHERE usuario_id = ? AND lida = 0
  `).bind(usuario.id).run();

  return c.json({
    success: true,
    message: 'Todas notificações marcadas como lidas',
    data: { atualizadas: result.meta.changes }
  });
});

// DELETE /notificacoes/:id - Excluir notificação
notificacoes.delete('/:id', async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const notificacao = await c.env.DB.prepare(`
    SELECT * FROM notificacoes WHERE id = ? AND usuario_id = ?
  `).bind(id, usuario.id).first();

  if (!notificacao) {
    return c.json({ success: false, error: 'Notificação não encontrada' }, 404);
  }

  await c.env.DB.prepare(`DELETE FROM notificacoes WHERE id = ?`).bind(id).run();

  return c.json({ success: true, message: 'Notificação excluída' });
});

// DELETE /notificacoes - Limpar todas as lidas
notificacoes.delete('/', async (c) => {
  const usuario = c.get('usuario');

  const result = await c.env.DB.prepare(`
    DELETE FROM notificacoes WHERE usuario_id = ? AND lida = 1
  `).bind(usuario.id).run();

  return c.json({
    success: true,
    message: 'Notificações lidas excluídas',
    data: { excluidas: result.meta.changes }
  });
});

// ============================================
// ENVIAR NOTIFICAÇÕES (ADMIN)
// ============================================

// POST /notificacoes/enviar - Enviar notificação
notificacoes.post('/enviar', requirePermission('sistema', 'admin'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = notificacaoSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;
  const id = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO notificacoes (
      id, empresa_id, usuario_id, tipo, titulo, mensagem, link, link_texto,
      dados, prioridade, expira_em, enviado_por
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, usuario.empresa_id, data.usuario_id, data.tipo, data.titulo, data.mensagem,
    data.link || null, data.link_texto || null, data.dados ? JSON.stringify(data.dados) : null,
    data.prioridade, data.expira_em || null, usuario.id
  ).run();

  return c.json({ success: true, data: { id } }, 201);
});

// POST /notificacoes/broadcast - Enviar para todos
notificacoes.post('/broadcast', requirePermission('sistema', 'admin'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();
  const { tipo, titulo, mensagem, link, prioridade = 'NORMAL', perfil_id } = body;

  if (!titulo || !mensagem) {
    return c.json({ success: false, error: 'Título e mensagem são obrigatórios' }, 400);
  }

  // Buscar usuários
  let queryUsuarios = `SELECT id FROM usuarios WHERE empresa_id = ? AND ativo = 1`;
  const paramsUsuarios: any[] = [usuario.empresa_id];

  if (perfil_id) {
    queryUsuarios += ` AND perfil_id = ?`;
    paramsUsuarios.push(perfil_id);
  }

  const usuarios = await c.env.DB.prepare(queryUsuarios).bind(...paramsUsuarios).all();

  // Criar notificação para cada usuário
  let criadas = 0;
  for (const u of usuarios.results as any[]) {
    await c.env.DB.prepare(`
      INSERT INTO notificacoes (
        id, empresa_id, usuario_id, tipo, titulo, mensagem, link, prioridade, enviado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), usuario.empresa_id, u.id,
      tipo || 'INFO', titulo, mensagem, link || null, prioridade, usuario.id
    ).run();
    criadas++;
  }

  return c.json({
    success: true,
    message: 'Notificações enviadas',
    data: { enviadas: criadas }
  });
});

// ============================================
// CONFIGURAÇÕES DE NOTIFICAÇÃO
// ============================================

// GET /notificacoes/configuracoes - Minhas configurações
notificacoes.get('/config/minhas', async (c) => {
  const usuario = c.get('usuario');

  const configs = await c.env.DB.prepare(`
    SELECT * FROM notificacoes_configuracoes WHERE usuario_id = ?
  `).bind(usuario.id).all();

  // Se não tem configs, retornar defaults
  if (configs.results.length === 0) {
    const defaults = [
      { tipo: 'PEDIDO', email: true, push: true, sistema: true },
      { tipo: 'PAGAMENTO', email: true, push: true, sistema: true },
      { tipo: 'ESTOQUE', email: false, push: true, sistema: true },
      { tipo: 'VENCIMENTO', email: true, push: true, sistema: true },
      { tipo: 'TAREFA', email: false, push: true, sistema: true },
      { tipo: 'SISTEMA', email: false, push: false, sistema: true },
    ];
    return c.json({ success: true, data: defaults, is_default: true });
  }

  return c.json({ success: true, data: configs.results, is_default: false });
});

// PUT /notificacoes/configuracoes - Atualizar configurações
notificacoes.put('/config/minhas', async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();
  const { configuracoes } = body;

  if (!Array.isArray(configuracoes)) {
    return c.json({ success: false, error: 'Formato inválido' }, 400);
  }

  // Limpar configs atuais
  await c.env.DB.prepare(`
    DELETE FROM notificacoes_configuracoes WHERE usuario_id = ?
  `).bind(usuario.id).run();

  // Inserir novas
  for (const config of configuracoes) {
    const validation = configSchema.safeParse(config);
    if (validation.success) {
      const data = validation.data;
      await c.env.DB.prepare(`
        INSERT INTO notificacoes_configuracoes (id, usuario_id, tipo, email, push, sistema)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), usuario.id, data.tipo,
        data.email ? 1 : 0, data.push ? 1 : 0, data.sistema ? 1 : 0
      ).run();
    }
  }

  return c.json({ success: true, message: 'Configurações atualizadas' });
});

// ============================================
// PUSH TOKENS (para app mobile)
// ============================================

// POST /notificacoes/push-token - Registrar token
notificacoes.post('/push-token', async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();
  const { token, plataforma, device_id } = body;

  if (!token) {
    return c.json({ success: false, error: 'Token é obrigatório' }, 400);
  }

  // Verificar se já existe
  const existe = await c.env.DB.prepare(`
    SELECT id FROM push_tokens WHERE usuario_id = ? AND device_id = ?
  `).bind(usuario.id, device_id || 'default').first();

  if (existe) {
    await c.env.DB.prepare(`
      UPDATE push_tokens SET token = ?, plataforma = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(token, plataforma || 'WEB', (existe as any).id).run();
  } else {
    await c.env.DB.prepare(`
      INSERT INTO push_tokens (id, usuario_id, token, plataforma, device_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), usuario.id, token, plataforma || 'WEB', device_id || 'default').run();
  }

  return c.json({ success: true, message: 'Token registrado' });
});

// DELETE /notificacoes/push-token - Remover token
notificacoes.delete('/push-token', async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();
  const { device_id } = body;

  await c.env.DB.prepare(`
    DELETE FROM push_tokens WHERE usuario_id = ? AND device_id = ?
  `).bind(usuario.id, device_id || 'default').run();

  return c.json({ success: true, message: 'Token removido' });
});

// ============================================
// UTILITÁRIO: Criar notificação (para uso interno)
// ============================================

export async function criarNotificacao(
  db: D1Database,
  params: {
    empresa_id: string;
    usuario_id: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    link?: string;
    dados?: any;
    prioridade?: string;
  }
) {
  const id = crypto.randomUUID();

  await db.prepare(`
    INSERT INTO notificacoes (
      id, empresa_id, usuario_id, tipo, titulo, mensagem, link, dados, prioridade
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, params.empresa_id, params.usuario_id, params.tipo,
    params.titulo, params.mensagem, params.link || null,
    params.dados ? JSON.stringify(params.dados) : null,
    params.prioridade || 'NORMAL'
  ).run();

  return id;
}

export default notificacoes;
