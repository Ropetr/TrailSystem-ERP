/**
 * 🔐 PLANAC ERP - Auth Routes
 * Rotas de autenticação: login, logout, refresh, me
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { verifyPassword } from '../lib/password';
import { generateToken, generateRefreshToken, verifyToken, extractBearerToken } from '../lib/jwt';
import { authMiddleware, Env } from '../middleware/auth';

const auth = new Hono<{ Bindings: Env }>();

// ============================================
// Schemas de Validação
// ============================================

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória')
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token obrigatório')
});

// ============================================
// POST /auth/login - Autenticação
// ============================================

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, senha } = c.req.valid('json');
  const db = c.env.DB;
  
  try {
    // 1. Buscar usuário pelo email
    const usuario = await db.prepare(`
      SELECT 
        u.id,
        u.empresa_id,
        u.nome,
        u.email,
        u.senha_hash,
        u.ativo,
        u.bloqueado,
        u.tentativas_login,
        u.bloqueado_ate,
        u.two_factor_ativo
      FROM usuarios u
      WHERE u.email = ?
    `).bind(email.toLowerCase()).first<{
      id: string;
      empresa_id: string;
      nome: string;
      email: string;
      senha_hash: string;
      ativo: number;
      bloqueado: number;
      tentativas_login: number;
      bloqueado_ate: string | null;
      two_factor_ativo: number;
    }>();
    
    if (!usuario) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'E-mail ou senha inválidos'
        }
      }, 401);
    }
    
    // 2. Verificar se está bloqueado
    if (usuario.bloqueado && usuario.bloqueado_ate) {
      const bloqueadoAte = new Date(usuario.bloqueado_ate);
      if (bloqueadoAte > new Date()) {
        return c.json({
          success: false,
          error: {
            code: 'USER_BLOCKED',
            message: 'Usuário bloqueado temporariamente. Tente novamente mais tarde.',
            bloqueado_ate: usuario.bloqueado_ate
          }
        }, 403);
      }
      // Desbloquear se o tempo passou
      await db.prepare(`
        UPDATE usuarios SET bloqueado = 0, tentativas_login = 0, bloqueado_ate = NULL
        WHERE id = ?
      `).bind(usuario.id).run();
    }
    
    // 3. Verificar se está ativo
    if (!usuario.ativo) {
      return c.json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'Usuário inativo. Contate o administrador.'
        }
      }, 403);
    }
    
    // 4. Verificar senha
    const senhaValida = await verifyPassword(senha, usuario.senha_hash);
    
    if (!senhaValida) {
      // Incrementar tentativas
      const novasTentativas = usuario.tentativas_login + 1;
      
      if (novasTentativas >= 5) {
        // Bloquear por 15 minutos
        const bloqueadoAte = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await db.prepare(`
          UPDATE usuarios SET 
            tentativas_login = ?,
            bloqueado = 1,
            bloqueado_ate = ?
          WHERE id = ?
        `).bind(novasTentativas, bloqueadoAte, usuario.id).run();
        
        return c.json({
          success: false,
          error: {
            code: 'USER_BLOCKED',
            message: 'Muitas tentativas. Usuário bloqueado por 15 minutos.',
            bloqueado_ate: bloqueadoAte
          }
        }, 403);
      }
      
      await db.prepare(`
        UPDATE usuarios SET tentativas_login = ? WHERE id = ?
      `).bind(novasTentativas, usuario.id).run();
      
      return c.json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'E-mail ou senha inválidos',
          tentativas_restantes: 5 - novasTentativas
        }
      }, 401);
    }
    
    // 5. Buscar perfis e permissões do usuário
    const perfisResult = await db.prepare(`
      SELECT p.id, p.nome
      FROM perfis p
      INNER JOIN usuarios_perfis up ON up.perfil_id = p.id
      WHERE up.usuario_id = ? AND p.ativo = 1
    `).bind(usuario.id).all<{ id: string; nome: string }>();
    
    const perfis = perfisResult.results || [];
    const perfisIds = perfis.map(p => p.id);
    
    // Buscar permissões de todos os perfis
    let permissoes: string[] = [];
    if (perfisIds.length > 0) {
      const placeholders = perfisIds.map(() => '?').join(',');
      const permissoesResult = await db.prepare(`
        SELECT DISTINCT perm.modulo || ':' || perm.acao as permissao
        FROM permissoes perm
        INNER JOIN perfis_permissoes pp ON pp.permissao_id = perm.id
        WHERE pp.perfil_id IN (${placeholders})
      `).bind(...perfisIds).all<{ permissao: string }>();
      
      permissoes = (permissoesResult.results || []).map(p => p.permissao);
    }
    
    // 6. Gerar tokens
    const accessToken = await generateToken({
      sub: usuario.id,
      empresa_id: usuario.empresa_id,
      email: usuario.email,
      nome: usuario.nome,
      perfis: perfisIds,
      permissoes
    }, c.env.JWT_SECRET, 8 * 60 * 60); // 8 horas
    
    const refreshToken = generateRefreshToken();
    
    // 7. Salvar sessão no banco
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const userAgent = c.req.header('User-Agent') || 'unknown';
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 dias
    
    // Hash do refresh token para armazenar
    const encoder = new TextEncoder();
    const refreshHashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(refreshToken));
    const refreshHash = Array.from(new Uint8Array(refreshHashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    await db.prepare(`
      INSERT INTO usuarios_sessoes (usuario_id, token_hash, refresh_token_hash, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      usuario.id,
      accessToken.slice(-32), // Últimos 32 chars do token como identificador
      refreshHash,
      ip,
      userAgent,
      expiresAt
    ).run();
    
    // 8. Atualizar último login e zerar tentativas
    await db.prepare(`
      UPDATE usuarios SET 
        ultimo_login = datetime('now'),
        tentativas_login = 0,
        bloqueado = 0,
        bloqueado_ate = NULL
      WHERE id = ?
    `).bind(usuario.id).run();
    
    // 9. Registrar no audit log
    await db.prepare(`
      INSERT INTO audit_logs (empresa_id, usuario_id, acao, modulo, descricao, ip_address, user_agent)
      VALUES (?, ?, 'login', 'auth', 'Login realizado com sucesso', ?, ?)
    `).bind(usuario.empresa_id, usuario.id, ip, userAgent).run();
    
    return c.json({
      success: true,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 8 * 60 * 60,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          empresa_id: usuario.empresa_id,
          perfis: perfis.map(p => p.nome),
          permissoes
        }
      }
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno no servidor'
      }
    }, 500);
  }
});

// ============================================
// POST /auth/logout - Encerrar sessão
// ============================================

auth.post('/logout', authMiddleware(), async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const token = extractBearerToken(c.req.header('Authorization'))!;
  
  try {
    // Revogar sessão no banco
    await db.prepare(`
      UPDATE usuarios_sessoes SET revogado = 1
      WHERE usuario_id = ? AND token_hash = ?
    `).bind(user.sub, token.slice(-32)).run();
    
    // Marcar no KV como revogada (para cache rápido)
    const sessionKey = `session:${user.sub}:${token.slice(-16)}`;
    await c.env.SESSIONS.put(sessionKey, 'revoked', {
      expirationTtl: 8 * 60 * 60 // 8 horas
    });
    
    // Audit log
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const userAgent = c.req.header('User-Agent') || 'unknown';
    
    await db.prepare(`
      INSERT INTO audit_logs (empresa_id, usuario_id, acao, modulo, descricao, ip_address, user_agent)
      VALUES (?, ?, 'logout', 'auth', 'Logout realizado', ?, ?)
    `).bind(user.empresa_id, user.sub, ip, userAgent).run();
    
    return c.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro no logout:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao encerrar sessão'
      }
    }, 500);
  }
});

// ============================================
// GET /auth/me - Dados do usuário logado
// ============================================

auth.get('/me', authMiddleware(), async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  
  try {
    // Buscar dados atualizados do usuário
    const usuario = await db.prepare(`
      SELECT 
        u.id,
        u.empresa_id,
        u.nome,
        u.email,
        u.telefone,
        u.avatar_url,
        u.cargo,
        u.two_factor_ativo,
        u.ultimo_login,
        e.razao_social as empresa_nome,
        e.nome_fantasia as empresa_fantasia
      FROM usuarios u
      INNER JOIN empresas e ON e.id = u.empresa_id
      WHERE u.id = ?
    `).bind(user.sub).first<{
      id: string;
      empresa_id: string;
      nome: string;
      email: string;
      telefone: string | null;
      avatar_url: string | null;
      cargo: string | null;
      two_factor_ativo: number;
      ultimo_login: string | null;
      empresa_nome: string;
      empresa_fantasia: string | null;
    }>();
    
    if (!usuario) {
      return c.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado'
        }
      }, 404);
    }
    
    // Buscar perfis
    const perfisResult = await db.prepare(`
      SELECT p.id, p.nome, p.nivel
      FROM perfis p
      INNER JOIN usuarios_perfis up ON up.perfil_id = p.id
      WHERE up.usuario_id = ? AND p.ativo = 1
    `).bind(usuario.id).all<{ id: string; nome: string; nivel: number }>();
    
    return c.json({
      success: true,
      data: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        avatar_url: usuario.avatar_url,
        cargo: usuario.cargo,
        two_factor_ativo: Boolean(usuario.two_factor_ativo),
        ultimo_login: usuario.ultimo_login,
        empresa: {
          id: usuario.empresa_id,
          razao_social: usuario.empresa_nome,
          nome_fantasia: usuario.empresa_fantasia
        },
        perfis: (perfisResult.results || []).map(p => ({
          id: p.id,
          nome: p.nome,
          nivel: p.nivel
        })),
        permissoes: user.permissoes
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao buscar dados do usuário'
      }
    }, 500);
  }
});

// ============================================
// POST /auth/refresh - Renovar token
// ============================================

auth.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  const { refresh_token } = c.req.valid('json');
  const db = c.env.DB;
  
  try {
    // Hash do refresh token
    const encoder = new TextEncoder();
    const refreshHashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(refresh_token));
    const refreshHash = Array.from(new Uint8Array(refreshHashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Buscar sessão
    const sessao = await db.prepare(`
      SELECT 
        s.id,
        s.usuario_id,
        s.expires_at,
        s.revogado,
        u.empresa_id,
        u.nome,
        u.email,
        u.ativo
      FROM usuarios_sessoes s
      INNER JOIN usuarios u ON u.id = s.usuario_id
      WHERE s.refresh_token_hash = ?
    `).bind(refreshHash).first<{
      id: string;
      usuario_id: string;
      expires_at: string;
      revogado: number;
      empresa_id: string;
      nome: string;
      email: string;
      ativo: number;
    }>();
    
    if (!sessao || sessao.revogado || !sessao.ativo) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token inválido ou expirado'
        }
      }, 401);
    }
    
    // Verificar expiração
    if (new Date(sessao.expires_at) < new Date()) {
      return c.json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Sessão expirada. Faça login novamente.'
        }
      }, 401);
    }
    
    // Buscar perfis e permissões
    const perfisResult = await db.prepare(`
      SELECT p.id
      FROM perfis p
      INNER JOIN usuarios_perfis up ON up.perfil_id = p.id
      WHERE up.usuario_id = ? AND p.ativo = 1
    `).bind(sessao.usuario_id).all<{ id: string }>();
    
    const perfisIds = (perfisResult.results || []).map(p => p.id);
    
    let permissoes: string[] = [];
    if (perfisIds.length > 0) {
      const placeholders = perfisIds.map(() => '?').join(',');
      const permissoesResult = await db.prepare(`
        SELECT DISTINCT perm.modulo || ':' || perm.acao as permissao
        FROM permissoes perm
        INNER JOIN perfis_permissoes pp ON pp.permissao_id = perm.id
        WHERE pp.perfil_id IN (${placeholders})
      `).bind(...perfisIds).all<{ permissao: string }>();
      
      permissoes = (permissoesResult.results || []).map(p => p.permissao);
    }
    
    // Gerar novo access token
    const accessToken = await generateToken({
      sub: sessao.usuario_id,
      empresa_id: sessao.empresa_id,
      email: sessao.email,
      nome: sessao.nome,
      perfis: perfisIds,
      permissoes
    }, c.env.JWT_SECRET, 8 * 60 * 60);
    
    // Atualizar token_hash na sessão
    await db.prepare(`
      UPDATE usuarios_sessoes SET token_hash = ? WHERE id = ?
    `).bind(accessToken.slice(-32), sessao.id).run();
    
    return c.json({
      success: true,
      data: {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 8 * 60 * 60
      }
    });
    
  } catch (error) {
    console.error('Erro no refresh:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao renovar token'
      }
    }, 500);
  }
});

export default auth;
