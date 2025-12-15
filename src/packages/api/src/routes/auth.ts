// =============================================
// PLANAC ERP - Auth Routes
// =============================================

import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import type { Env } from '../types/env';

const auth = new Hono<{ Bindings: Env }>();

// Função para criar hash SHA-256 (compatível com Workers)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Função para verificar senha
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// ===== LOGIN =====
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, senha } = body;

    if (!email || !senha) {
      return c.json({ success: false, error: 'Email e senha são obrigatórios' }, 400);
    }

    // Buscar usuário
    const result = await c.env.DB.prepare(
      `SELECT u.*, e.razao_social as empresa_nome 
       FROM usuarios u 
       LEFT JOIN empresas e ON u.empresa_id = e.id 
       WHERE u.email = ? AND u.ativo = 1`
    ).bind(email.toLowerCase()).first();

    if (!result) {
      return c.json({ success: false, error: 'Credenciais inválidas' }, 401);
    }

    // Verificar se está bloqueado
    if (result.bloqueado === 1) {
      return c.json({ success: false, error: 'Usuário bloqueado. Contate o suporte.' }, 403);
    }

    // Verificar senha
    const senhaValida = await verifyPassword(senha, result.senha_hash as string);
    if (!senhaValida) {
      // Incrementar tentativas
      await c.env.DB.prepare(
        `UPDATE usuarios SET tentativas_login = tentativas_login + 1 WHERE id = ?`
      ).bind(result.id).run();
      
      return c.json({ success: false, error: 'Credenciais inválidas' }, 401);
    }

    // Resetar tentativas e atualizar último login
    await c.env.DB.prepare(
      `UPDATE usuarios SET tentativas_login = 0, ultimo_login = ? WHERE id = ?`
    ).bind(new Date().toISOString(), result.id).run();

    // Gerar JWT
    const payload = {
      sub: result.id,
      email: result.email,
      nome: result.nome,
      empresa_id: result.empresa_id,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 horas
    };

    const secret = c.env.JWT_SECRET || 'planac-erp-secret-key-2025';
    const token = await sign(payload, secret);

    // Retornar sucesso
    return c.json({
      success: true,
      token,
      usuario: {
        id: result.id,
        nome: result.nome,
        email: result.email,
        cargo: result.cargo,
        avatar_url: result.avatar_url,
        empresa: {
          id: result.empresa_id,
          nome: result.empresa_nome,
        },
      },
    });
  } catch (error) {
    console.error('[AUTH ERROR]', error);
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500);
  }
});

// ===== REGISTRO (para primeiro acesso) =====
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { nome, email, senha, empresa_id } = body;

    if (!nome || !email || !senha) {
      return c.json({ success: false, error: 'Nome, email e senha são obrigatórios' }, 400);
    }

    // Verificar se email já existe
    const existente = await c.env.DB.prepare(
      `SELECT id FROM usuarios WHERE email = ?`
    ).bind(email.toLowerCase()).first();

    if (existente) {
      return c.json({ success: false, error: 'Email já cadastrado' }, 409);
    }

    // Criar hash da senha
    const senhaHash = await hashPassword(senha);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Inserir usuário
    await c.env.DB.prepare(
      `INSERT INTO usuarios (id, empresa_id, nome, email, senha_hash, ativo, bloqueado, tentativas_login, two_factor_ativo, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, 0, 0, 0, ?, ?)`
    ).bind(userId, empresa_id || 'empresa_planac_001', nome, email.toLowerCase(), senhaHash, now, now).run();

    return c.json({
      success: true,
      message: 'Usuário criado com sucesso',
      usuario: { id: userId, nome, email },
    });
  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    return c.json({ success: false, error: 'Erro ao criar usuário' }, 500);
  }
});

// ===== VERIFICAR TOKEN =====
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Token não fornecido' }, 401);
  }

  // Validação do token seria feita aqui
  return c.json({ success: true, message: 'Token válido' });
});

export default auth;
