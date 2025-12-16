// =============================================
// PLANAC ERP - Rotas de Usuarios
// Migrado de src/api/ para src/packages/api/
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const usuarios = new Hono<{ Bindings: Env }>();

// =============================================
// GET /usuarios - Listar usuarios
// =============================================
usuarios.get('/', async (c) => {
  const { page = '1', limit = '20', busca, ativo } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (busca) {
      whereClause += ' AND (nome LIKE ? OR email LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`);
    }
    
    if (ativo !== undefined && ativo !== '') {
      whereClause += ' AND ativo = ?';
      params.push(ativo === 'true' ? 1 : 0);
    }
    
    // Contar total
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM usuarios ${whereClause}
    `).bind(...params).first<{ total: number }>();
    
    // Buscar usuarios
    const result = await c.env.DB.prepare(`
      SELECT 
        id, nome, email, telefone, cargo, avatar_url,
        ativo, bloqueado, ultimo_login, created_at
      FROM usuarios
      ${whereClause}
      ORDER BY nome
      LIMIT ? OFFSET ?
    `).bind(...params, parseInt(limit), offset).all();
    
    return c.json({
      success: true,
      data: result.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / parseInt(limit))
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar usuarios:', error);
    return c.json({ success: false, error: 'Erro ao listar usuarios' }, 500);
  }
});

// =============================================
// GET /usuarios/:id - Buscar usuario por ID
// =============================================
usuarios.get('/:id', async (c) => {
  const { id } = c.req.param();
  
  try {
    const usuario = await c.env.DB.prepare(`
      SELECT 
        id, nome, email, telefone, cargo, avatar_url,
        ativo, bloqueado, two_factor_ativo, ultimo_login,
        created_at, updated_at
      FROM usuarios
      WHERE id = ?
    `).bind(id).first();
    
    if (!usuario) {
      return c.json({ success: false, error: 'Usuario nao encontrado' }, 404);
    }
    
    // Buscar perfis
    const perfis = await c.env.DB.prepare(`
      SELECT p.id, p.nome
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
  } catch (error: any) {
    console.error('Erro ao buscar usuario:', error);
    return c.json({ success: false, error: 'Erro ao buscar usuario' }, 500);
  }
});

// =============================================
// POST /usuarios - Criar usuario
// =============================================
usuarios.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      nome: string;
      email: string;
      senha: string;
      telefone?: string;
      cargo?: string;
      empresa_id?: string;
      perfis?: string[];
    }>();
    
    // Validacoes basicas
    if (!body.nome || body.nome.length < 3) {
      return c.json({ success: false, error: 'Nome deve ter no minimo 3 caracteres' }, 400);
    }
    if (!body.email || !body.email.includes('@')) {
      return c.json({ success: false, error: 'E-mail invalido' }, 400);
    }
    if (!body.senha || body.senha.length < 6) {
      return c.json({ success: false, error: 'Senha deve ter no minimo 6 caracteres' }, 400);
    }
    
    // Verificar se e-mail ja existe
    const existe = await c.env.DB.prepare(`
      SELECT id FROM usuarios WHERE email = ?
    `).bind(body.email.toLowerCase()).first();
    
    if (existe) {
      return c.json({ success: false, error: 'E-mail ja cadastrado' }, 400);
    }
    
    // Hash da senha (simples para MVP - usar bcrypt em producao)
    const encoder = new TextEncoder();
    const data = encoder.encode(body.senha);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const senhaHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Criar usuario
    const usuarioId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await c.env.DB.prepare(`
      INSERT INTO usuarios (id, empresa_id, nome, email, senha_hash, telefone, cargo, ativo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      usuarioId,
      body.empresa_id || 'empresa_planac_001',
      body.nome,
      body.email.toLowerCase(),
      senhaHash,
      body.telefone || null,
      body.cargo || null,
      now,
      now
    ).run();
    
    // Vincular perfis se fornecidos
    if (body.perfis && body.perfis.length > 0) {
      for (const perfilId of body.perfis) {
        await c.env.DB.prepare(`
          INSERT INTO usuarios_perfis (id, usuario_id, perfil_id)
          VALUES (?, ?, ?)
        `).bind(crypto.randomUUID(), usuarioId, perfilId).run();
      }
    }
    
    return c.json({
      success: true,
      message: 'Usuario criado com sucesso',
      data: { id: usuarioId, nome: body.nome, email: body.email }
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar usuario:', error);
    return c.json({ success: false, error: 'Erro ao criar usuario' }, 500);
  }
});

// =============================================
// PUT /usuarios/:id - Editar usuario
// =============================================
usuarios.put('/:id', async (c) => {
  const { id } = c.req.param();
  
  try {
    const body = await c.req.json<{
      nome?: string;
      email?: string;
      telefone?: string;
      cargo?: string;
      ativo?: boolean;
      perfis?: string[];
    }>();
    
    // Verificar se usuario existe
    const usuarioAtual = await c.env.DB.prepare(`
      SELECT * FROM usuarios WHERE id = ?
    `).bind(id).first<any>();
    
    if (!usuarioAtual) {
      return c.json({ success: false, error: 'Usuario nao encontrado' }, 404);
    }
    
    // Verificar se e-mail ja existe (se estiver alterando)
    if (body.email && body.email.toLowerCase() !== usuarioAtual.email) {
      const existe = await c.env.DB.prepare(`
        SELECT id FROM usuarios WHERE email = ? AND id != ?
      `).bind(body.email.toLowerCase(), id).first();
      
      if (existe) {
        return c.json({ success: false, error: 'E-mail ja cadastrado' }, 400);
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
      updates.push("updated_at = datetime('now')");
      params.push(id);
      
      await c.env.DB.prepare(`
        UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?
      `).bind(...params).run();
    }
    
    // Atualizar perfis se fornecidos
    if (body.perfis) {
      await c.env.DB.prepare(`
        DELETE FROM usuarios_perfis WHERE usuario_id = ?
      `).bind(id).run();
      
      for (const perfilId of body.perfis) {
        await c.env.DB.prepare(`
          INSERT INTO usuarios_perfis (id, usuario_id, perfil_id)
          VALUES (?, ?, ?)
        `).bind(crypto.randomUUID(), id, perfilId).run();
      }
    }
    
    return c.json({ success: true, message: 'Usuario atualizado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao editar usuario:', error);
    return c.json({ success: false, error: 'Erro ao editar usuario' }, 500);
  }
});

// =============================================
// DELETE /usuarios/:id - Desativar usuario
// =============================================
usuarios.delete('/:id', async (c) => {
  const { id } = c.req.param();
  
  try {
    const usuario = await c.env.DB.prepare(`
      SELECT nome FROM usuarios WHERE id = ?
    `).bind(id).first<{ nome: string }>();
    
    if (!usuario) {
      return c.json({ success: false, error: 'Usuario nao encontrado' }, 404);
    }
    
    // Desativar (soft delete)
    await c.env.DB.prepare(`
      UPDATE usuarios SET ativo = 0, updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();
    
    return c.json({ success: true, message: 'Usuario desativado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desativar usuario:', error);
    return c.json({ success: false, error: 'Erro ao desativar usuario' }, 500);
  }
});

// =============================================
// POST /usuarios/:id/resetar-senha
// =============================================
usuarios.post('/:id/resetar-senha', async (c) => {
  const { id } = c.req.param();
  
  try {
    const body = await c.req.json<{ novaSenha: string }>();
    
    if (!body.novaSenha || body.novaSenha.length < 6) {
      return c.json({ success: false, error: 'Senha deve ter no minimo 6 caracteres' }, 400);
    }
    
    const usuario = await c.env.DB.prepare(`
      SELECT nome FROM usuarios WHERE id = ?
    `).bind(id).first<{ nome: string }>();
    
    if (!usuario) {
      return c.json({ success: false, error: 'Usuario nao encontrado' }, 404);
    }
    
    // Hash da nova senha
    const encoder = new TextEncoder();
    const data = encoder.encode(body.novaSenha);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const senhaHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    await c.env.DB.prepare(`
      UPDATE usuarios SET senha_hash = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(senhaHash, id).run();
    
    return c.json({ success: true, message: 'Senha resetada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao resetar senha:', error);
    return c.json({ success: false, error: 'Erro ao resetar senha' }, 500);
  }
});

// =============================================
// POST /usuarios/:id/bloquear
// =============================================
usuarios.post('/:id/bloquear', async (c) => {
  const { id } = c.req.param();
  
  try {
    await c.env.DB.prepare(`
      UPDATE usuarios SET bloqueado = 1, updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();
    
    return c.json({ success: true, message: 'Usuario bloqueado com sucesso' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao bloquear usuario' }, 500);
  }
});

// =============================================
// POST /usuarios/:id/desbloquear
// =============================================
usuarios.post('/:id/desbloquear', async (c) => {
  const { id } = c.req.param();
  
  try {
    await c.env.DB.prepare(`
      UPDATE usuarios SET bloqueado = 0, tentativas_login = 0, updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();
    
    return c.json({ success: true, message: 'Usuario desbloqueado com sucesso' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao desbloquear usuario' }, 500);
  }
});

export default usuarios;
