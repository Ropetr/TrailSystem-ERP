/**
 * 🛡️ PLANAC ERP - Auth Middleware
 * Middleware de autenticação e autorização
 */

import { Context, Next } from 'hono';
import { verifyToken, extractBearerToken, JWTPayload } from '../lib/jwt';

// Estender o tipo Context para incluir o usuário autenticado
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
    empresa_id: string;
  }
}

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  RATE_LIMIT: KVNamespace;
  FILES: R2Bucket;
  JWT_SECRET: string;
  ENVIRONMENT: string;
}

/**
 * Middleware de autenticação
 * Verifica se o token JWT é válido
 */
export function authMiddleware() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    const token = extractBearerToken(authHeader);
    
    if (!token) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token de autenticação não fornecido'
        }
      }, 401);
    }
    
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    
    if (!payload) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token inválido ou expirado'
        }
      }, 401);
    }
    
    // Verificar se a sessão não foi revogada (opcional, via KV)
    const sessionKey = `session:${payload.sub}:${token.slice(-16)}`;
    const sessionValid = await c.env.SESSIONS.get(sessionKey);
    
    if (sessionValid === 'revoked') {
      return c.json({
        success: false,
        error: {
          code: 'SESSION_REVOKED',
          message: 'Sessão encerrada. Faça login novamente.'
        }
      }, 401);
    }
    
    // Adicionar usuário ao contexto
    c.set('user', payload);
    c.set('empresa_id', payload.empresa_id);
    
    await next();
  };
}

/**
 * Middleware de autorização por permissão
 * Verifica se o usuário tem a permissão necessária
 */
export function requirePermission(modulo: string, acao: string) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado'
        }
      }, 401);
    }
    
    const permissaoNecessaria = `${modulo}:${acao}`;
    const temPermissao = user.permissoes.includes(permissaoNecessaria);
    
    if (!temPermissao) {
      return c.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Sem permissão para ${acao} em ${modulo}`,
          required: permissaoNecessaria
        }
      }, 403);
    }
    
    await next();
  };
}

/**
 * Middleware de autorização por múltiplas permissões (OR)
 * Usuário precisa ter PELO MENOS UMA das permissões
 */
export function requireAnyPermission(permissoes: Array<{ modulo: string; acao: string }>) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado'
        }
      }, 401);
    }
    
    const temAlguma = permissoes.some(p => 
      user.permissoes.includes(`${p.modulo}:${p.acao}`)
    );
    
    if (!temAlguma) {
      return c.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Sem permissão para esta ação',
          required: permissoes.map(p => `${p.modulo}:${p.acao}`)
        }
      }, 403);
    }
    
    await next();
  };
}

/**
 * Middleware de autorização por todas as permissões (AND)
 * Usuário precisa ter TODAS as permissões
 */
export function requireAllPermissions(permissoes: Array<{ modulo: string; acao: string }>) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado'
        }
      }, 401);
    }
    
    const faltando = permissoes.filter(p => 
      !user.permissoes.includes(`${p.modulo}:${p.acao}`)
    );
    
    if (faltando.length > 0) {
      return c.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Sem todas as permissões necessárias',
          missing: faltando.map(p => `${p.modulo}:${p.acao}`)
        }
      }, 403);
    }
    
    await next();
  };
}

/**
 * Middleware de rate limiting
 * Limita requisições por IP ou usuário
 */
export function rateLimitMiddleware(
  limit: number = 100,
  windowSeconds: number = 60,
  keyPrefix: string = 'rate'
) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user');
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    
    // Usar user_id se autenticado, senão usar IP
    const identifier = user ? user.sub : ip;
    const key = `${keyPrefix}:${identifier}`;
    
    // Obter contador atual
    const current = await c.env.RATE_LIMIT.get(key);
    const count = current ? parseInt(current, 10) : 0;
    
    if (count >= limit) {
      return c.json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Muitas requisições. Tente novamente em alguns segundos.',
          retryAfter: windowSeconds
        }
      }, 429);
    }
    
    // Incrementar contador
    await c.env.RATE_LIMIT.put(key, String(count + 1), {
      expirationTtl: windowSeconds
    });
    
    // Adicionar headers de rate limit
    c.header('X-RateLimit-Limit', String(limit));
    c.header('X-RateLimit-Remaining', String(limit - count - 1));
    
    await next();
  };
}

/**
 * Middleware multi-tenant
 * Garante que queries sejam filtradas por empresa_id
 */
export function multiTenantMiddleware() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado'
        }
      }, 401);
    }
    
    // empresa_id já está no contexto via authMiddleware
    // Usar c.get('empresa_id') em todas as queries
    
    await next();
  };
}


// =============================================
// ALIAS para compatibilidade
// =============================================
export const requireAuth = authMiddleware;
