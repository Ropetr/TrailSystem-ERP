// =============================================
// 👥 PLANAC ERP - Rotas de Usuários
// =============================================
// Arquivo: src/api/src/routes/usuarios.routes.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { hashSenha, registrarAuditoria } from '../services/auth.service';
import { authMiddleware, requirePermission, getClientIP, getUserAgent } from '../middleware/auth.middleware';

// Tipos
interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
}

// Schemas de Validação
const criarUsuarioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  telefone: z.string().optional(),
  cargo: z.string().optional(),
  perfis: z.array(z.string()).min(1, 'Selecione ao menos um perfil')
});

const editarUsuarioSchema = z.object({
  nome: z.string().min(3).optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional().nullable(),
  cargo: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  perfis: z.array(z.string()).optional()
});

const resetarSenhaSchema = z.object({
  novaSenha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres')
});

// Criar router
const usuarios = new Hono<{ Bindings: Env }>();

// Aplicar autenticação em todas as rotas
usuarios.use('*', authMiddleware());

// =============================================
// GET /usuarios - Listar usuários
// =============================================
usuarios.get('/', requirePermission('usuarios', 'ver'), async (c) => {
  const empresaId = c.get('empresa_id');
  
  // Query params para filtros
  const { page = '1', limit = '20', busca, ativo, perfil } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  try {
    // Construir query dinâmica
    let whereClause = 'WHERE u.empresa_id = ?';
    const params: any[] = [empresaId];
    
    if (busca) {
      whereClause += ' AND (u.nome LIKE ? OR u.email LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`);
    }
    
    if (ativo !== undefined && ativo !== '') {
      whereClause += ' AND u.ativo = ?';
      params.push(ativo === 'true' ? 1 : 0);
    }
    
    if (perfil) {
      whereClause += ' AND EXISTS (SELECT 1 FROM usuarios_perfis up2 WHERE up2.usuario_id = u.id AND up2.perfil_id = ?)';
      params.push(perfil);
    }
    
    // Contar total
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM usuarios u ${whereClause}
    `).bind(...params).first<{ total: number }>();
    
    // Buscar usuários
    const usuarios = await c.env.DB.prepare(`
      SELECT 
        u.id, u.nome, u.email, u.telefone, u.cargo, u.avatar_url,
        u.ativo, u.bloqueado, u.ultimo_login, u.created_at,
        GROUP_CONCAT(p.nome, ', ') as perfis_nomes
      FROM usuarios u
      LEFT JOIN usuarios_perfis up ON up.usuario_id = u.id
      LEFT JOIN perfis p ON p.id = up.perfil_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.nome
      LIMIT ? OFFSET ?
    `).bind(...params, parseInt(limit), offset).all();
    
    return c.json({
      success: true,
      data: usuarios.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return c.json({ success: false, error: 'Erro ao listar usuários' }, 500);
  }
});

// =============================================
// GET /usuarios/:id - Buscar usuário por ID
// =============================================
usuarios.get('/:id', requirePermission('usuarios', 'ver'), async (c) => {
  const empresaId = c.get('empresa_id');
  const { id } = c.req.param();
  
  try {
    const usuario = await c.env.DB.prepare(`
      SELECT 
        u.id, u.nome, u.email, u.telefone, u.cargo, u.avatar_url,
        u.ativo, u.bloqueado, u.two_factor_ativo, u.ultimo_login,
        u.created_at, u.updated_at
      FROM usuarios u
      WHERE u.id = ? AND u.empresa_id = ?
    `).bind(id, empresaId).first();
    
    if (!usuario) {
      return c.json({ success: false, error: 'Usuário não encontrado' }, 404);
    }
    
    // Buscar perfis
    const perfis = await c.env.DB.prepare(`
      SELECT p.id, p.nome, up.filial_id
      FROM perfis p
      INNER JOIN usuarios_perfis up ON up.perfil_id = p.id
      WHERE up.usuario_id = ?
    `).bind(id).all();
    
    return c.json({
      success: true,
      data: {
        ...usuario,
        perfis: perfis.results
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return c.json({ success: false, error: 'Erro ao buscar usuário' }, 500);
  }
});

// =============================================
// POST /usuarios - Criar usuário
// =============================================
usuarios.post('/', requirePermission('usuarios', 'criar'), zValidator('json', criarUsuarioSchema), async (c) => {
  const empresaId = c.get('empresa_id');
  const user = c.get('user');
  const body = c.req.valid('json');
  const ip = getClientIP(c);
  const userAgent = getUserAgent(c);
  
  try {
    // Verificar se e-mail já existe
    const existe = await c.env.DB.prepare(`
      SELECT id FROM usuarios WHERE email = ?
    `).bind(body.email.toLowerCase()).first();
    
    if (existe) {
      return c.json({ success: false, error: 'E-mail já cadastrado' }, 400);
    }
    
    // Hash da senha
    const senhaHash = await hashSenha(body.senha);
    
    // Criar usuário
    const usuarioId = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO usuarios (id, empresa_id, nome, email, senha_hash, telefone, cargo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      usuarioId,
      empresaId,
      body.nome,
      body.email.toLowerCase(),
      senhaHash,
      body.telefone || null,
      body.cargo || null
    ).run();
    
    // Vincular perfis
    for (const perfilId of body.perfis) {
      await c.env.DB.prepare(`
        INSERT INTO usuarios_perfis (id, usuario_id, perfil_id)
        VALUES (?, ?, ?)
      `).bind(crypto.randomUUID(), usuarioId, perfilId).run();
    }
    
    // Auditoria
    await registrarAuditoria(c.env.DB, empresaId, user.id,
      'criar', 'usuarios', `Usuário ${body.nome} criado`, ip, userAgent,
      'usuarios', usuarioId, null, { nome: body.nome, email: body.email });
    
    return c.json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: { id: usuarioId }
    }, 201);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return c.json({ success: false, error: 'Erro ao criar usuário' }, 500);
  }
});

// =============================================
// PUT /usuarios/:id - Editar usuário
// =============================================
usuarios.put('/:id', requirePermission('usuarios', 'editar'), zValidator('json', editarUsuarioSchema), async (c) => {
  const empresaId = c.get('empresa_id');
  const user = c.get('user');
  const { id } = c.req.param();
  const body = c.req.valid('json');
  const ip = getClientIP(c);
  const userAgent = getUserAgent(c);
  
  try {
    // Verificar se usuário existe
    const usuarioAtual = await c.env.DB.prepare(`
      SELECT * FROM usuarios WHERE id = ? AND empresa_id = ?
    `).bind(id, empresaId).first<any>();
    
    if (!usuarioAtual) {
      return c.json({ success: false, error: 'Usuário não encontrado' }, 404);
    }
    
    // Verificar se e-mail já existe (se estiver alterando)
    if (body.email && body.email.toLowerCase() !== usuarioAtual.email) {
      const existe = await c.env.DB.prepare(`
        SELECT id FROM usuarios WHERE email = ? AND id != ?
      `).bind(body.email.toLowerCase(), id).first();
      
      if (existe) {
        return c.json({ success: false, error: 'E-mail já cadastrado' }, 400);
      }
    }
    
    // Construir update
    const updates: string[] = [];
    const params: any[] = [];
    
    if (body.nome !== undefined) {
      updates.push('nome = ?');
      params.push(body.nome);
    }
    if (body.email !== undefined) {
      updates.push('email = ?');
      params.push(body.email.toLowerCase());
    }
    if (body.telefone !== undefined) {
      updates.push('telefone = ?');
      params.push(body.telefone);
    }
    if (body.cargo !== undefined) {
      updates.push('cargo = ?');
      params.push(body.cargo);
    }
    if (body.ativo !== undefined) {
      updates.push('ativo = ?');
      params.push(body.ativo ? 1 : 0);
    }
    
    if (updates.length > 0) {
      updates.push('updated_at = datetime(\'now\')');
      params.push(id);
      
      await c.env.DB.prepare(`
        UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?
      `).bind(...params).run();
    }
    
    // Atualizar perfis se fornecidos
    if (body.perfis) {
      // Remover perfis antigos
      await c.env.DB.prepare(`
        DELETE FROM usuarios_perfis WHERE usuario_id = ?
      `).bind(id).run();
      
      // Adicionar novos
      for (const perfilId of body.perfis) {
        await c.env.DB.prepare(`
          INSERT INTO usuarios_perfis (id, usuario_id, perfil_id)
          VALUES (?, ?, ?)
        `).bind(crypto.randomUUID(), id, perfilId).run();
      }
    }
    
    // Auditoria
    await registrarAuditoria(c.env.DB, empresaId, user.id,
      'editar', 'usuarios', `Usuário ${usuarioAtual.nome} editado`, ip, userAgent,
      'usuarios', id, usuarioAtual, body);
    
    return c.json({ success: true, message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao editar usuário:', error);
    return c.json({ success: false, error: 'Erro ao editar usuário' }, 500);
  }
});

// =============================================
// DELETE /usuarios/:id - Desativar usuário
// =============================================
usuarios.delete('/:id', requirePermission('usuarios', 'excluir'), async (c) => {
  const empresaId = c.get('empresa_id');
  const user = c.get('user');
  const { id } = c.req.param();
  const ip = getClientIP(c);
  const userAgent = getUserAgent(c);
  
  try {
    // Verificar se usuário existe
    const usuario = await c.env.DB.prepare(`
      SELECT nome FROM usuarios WHERE id = ? AND empresa_id = ?
    `).bind(id, empresaId).first<{ nome: string }>();
    
    if (!usuario) {
      return c.json({ success: false, error: 'Usuário não encontrado' }, 404);
    }
    
    // Não pode desativar a si mesmo
    if (id === user.id) {
      return c.json({ success: false, error: 'Você não pode desativar sua própria conta' }, 400);
    }
    
    // Desativar (soft delete)
    await c.env.DB.prepare(`
      UPDATE usuarios SET ativo = 0, updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();
    
    // Revogar todas as sessões
    await c.env.DB.prepare(`
      UPDATE usuarios_sessoes SET revogado = 1 WHERE usuario_id = ?
    `).bind(id).run();
    
    // Auditoria
    await registrarAuditoria(c.env.DB, empresaId, user.id,
      'excluir', 'usuarios', `Usuário ${usuario.nome} desativado`, ip, userAgent,
      'usuarios', id);
    
    return c.json({ success: true, message: 'Usuário desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    return c.json({ success: false, error: 'Erro ao desativar usuário' }, 500);
  }
});

// =============================================
// POST /usuarios/:id/resetar-senha
// =============================================
usuarios.post('/:id/resetar-senha', requirePermission('usuarios', 'resetar'), zValidator('json', resetarSenhaSchema), async (c) => {
  const empresaId = c.get('empresa_id');
  const user = c.get('user');
  const { id } = c.req.param();
  const { novaSenha } = c.req.valid('json');
  const ip = getClientIP(c);
  const userAgent = getUserAgent(c);
  
  try {
    // Verificar se usuário existe
    const usuario = await c.env.DB.prepare(`
      SELECT nome FROM usuarios WHERE id = ? AND empresa_id = ?
    `).bind(id, empresaId).first<{ nome: string }>();
    
    if (!usuario) {
      return c.json({ success: false, error: 'Usuário não encontrado' }, 404);
    }
    
    // Hash da nova senha
    const senhaHash = await hashSenha(novaSenha);
    
    // Atualizar senha
    await c.env.DB.prepare(`
      UPDATE usuarios SET senha_hash = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(senhaHash, id).run();
    
    // Revogar todas as sessões do usuário
    await c.env.DB.prepare(`
      UPDATE usuarios_sessoes SET revogado = 1 WHERE usuario_id = ?
    `).bind(id).run();
    
    // Auditoria
    await registrarAuditoria(c.env.DB, empresaId, user.id,
      'resetar_senha', 'usuarios', `Senha do usuário ${usuario.nome} resetada`, ip, userAgent,
      'usuarios', id);
    
    return c.json({ success: true, message: 'Senha resetada com sucesso' });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    return c.json({ success: false, error: 'Erro ao resetar senha' }, 500);
  }
});

export default usuarios;
