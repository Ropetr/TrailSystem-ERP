// =============================================
// 🛡️ PLANAC ERP - Middleware de Autenticação
// =============================================
// Arquivo: src/api/src/middleware/auth.middleware.ts

import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { HTTPException } from 'hono/http-exception';

// Tipos
export interface AuthUser {
  id: string;
  email: string;
  empresa_id: string;
  perfis: string[];
  permissoes: string[];
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

// Extender o Context do Hono para incluir o usuário
declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
    empresa_id: string;
  }
}

// =============================================
// MIDDLEWARE DE AUTENTICAÇÃO
// =============================================

export function authMiddleware() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Token não fornecido' });
    }
    
    const token = authHeader.substring(7);
    
    try {
      // Verificar JWT
      const payload = await verify(token, c.env.JWT_SECRET) as any;
      
      // Verificar expiração
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new HTTPException(401, { message: 'Token expirado' });
      }
      
      // Verificar se sessão está ativa no KV (cache rápido)
      const tokenHash = await hashToken(token);
      const sessaoCache = await c.env.SESSIONS.get(`session:${tokenHash}`);
      
      if (!sessaoCache) {
        // Verificar no D1 (fallback)
        const sessao = await c.env.DB.prepare(`
          SELECT id FROM usuarios_sessoes 
          WHERE token_hash = ? AND revogado = 0 AND expires_at > datetime('now')
        `).bind(tokenHash).first();
        
        if (!sessao) {
          throw new HTTPException(401, { message: 'Sessão inválida ou expirada' });
        }
      }
      
      // Definir usuário no contexto
      const user: AuthUser = {
        id: payload.sub,
        email: payload.email,
        empresa_id: payload.empresa_id,
        perfis: payload.perfis || [],
        permissoes: payload.permissoes || []
      };
      
      c.set('user', user);
      c.set('empresa_id', payload.empresa_id);
      
      await next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(401, { message: 'Token inválido' });
    }
  };
}

// =============================================
// MIDDLEWARE DE PERMISSÃO
// =============================================

export function requirePermission(modulo: string, acao: string) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      throw new HTTPException(401, { message: 'Não autenticado' });
    }
    
    const permissaoNecessaria = `${modulo}:${acao}`;
    
    // Verificar se usuário tem a permissão
    if (!user.permissoes.includes(permissaoNecessaria)) {
      throw new HTTPException(403, { 
        message: `Sem permissão para ${acao} em ${modulo}` 
      });
    }
    
    await next();
  };
}

// =============================================
// MIDDLEWARE DE RATE LIMIT
// =============================================

export function rateLimitMiddleware(
  maxRequests: number = 100,
  windowSeconds: number = 60
) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const key = `ratelimit:${ip}`;
    
    const current = await c.env.RATE_LIMIT.get(key);
    const count = current ? parseInt(current) : 0;
    
    if (count >= maxRequests) {
      throw new HTTPException(429, { message: 'Muitas requisições. Tente novamente em breve.' });
    }
    
    // Incrementar contador
    await c.env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: windowSeconds });
    
    // Headers de rate limit
    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(maxRequests - count - 1));
    
    await next();
  };
}

// =============================================
// MIDDLEWARE DE MULTI-TENANT
// =============================================

export function tenantMiddleware() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user');
    
    if (!user || !user.empresa_id) {
      throw new HTTPException(400, { message: 'Empresa não identificada' });
    }
    
    // Todas as queries devem filtrar por empresa_id
    // O middleware apenas garante que o contexto está correto
    
    await next();
  };
}

// =============================================
// HELPER: Hash de Token
// =============================================

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// =============================================
// HELPER: Obter IP do Request
// =============================================

export function getClientIP(c: Context): string {
  return c.req.header('CF-Connecting-IP') || 
         c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || 
         'unknown';
}

// =============================================
// HELPER: Obter User Agent
// =============================================

export function getUserAgent(c: Context): string {
  return c.req.header('User-Agent') || 'unknown';
}
