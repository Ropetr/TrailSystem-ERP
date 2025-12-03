/**
 * 🚀 PLANAC ERP - API Entry Point
 * 
 * Backend em Cloudflare Workers com Hono
 * 
 * @version 0.1.0
 * @author DEV.com
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

// Types
import type { Context } from 'hono';

// Bindings do Cloudflare
interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  RATE_LIMIT: KVNamespace;
  FILES: R2Bucket;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  ENVIRONMENT: string;
}

// App instance
const app = new Hono<{ Bindings: Env }>();

// =============================================
// 🛡️ MIDDLEWARES GLOBAIS
// =============================================

// Logger
app.use('*', logger());

// Secure Headers
app.use('*', secureHeaders());

// CORS
app.use('*', cors({
  origin: [
    'https://app.planac.com.br',
    'https://admin.planac.com.br',
    'http://localhost:3000',
  ],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token'],
}));

// =============================================
// 🏠 ROTAS BASE
// =============================================

// Health Check
app.get('/', (c: Context) => {
  return c.json({
    name: 'PLANAC ERP API',
    version: '0.1.0',
    status: 'healthy',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

// Health Check detalhado
app.get('/health', async (c: Context) => {
  const checks = {
    api: 'ok',
    database: 'unknown',
    cache: 'unknown',
  };

  // Verificar D1
  try {
    await c.env.DB.prepare('SELECT 1').first();
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Verificar KV
  try {
    await c.env.CACHE.get('__health_check__');
    checks.cache = 'ok';
  } catch {
    checks.cache = 'error';
  }

  const allOk = Object.values(checks).every(v => v === 'ok');

  return c.json({
    status: allOk ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  }, allOk ? 200 : 503);
});

// =============================================
// 📁 ROTAS DOS MÓDULOS (a serem implementados)
// =============================================

// Auth Routes
// app.route('/auth', authRoutes);

// API v1 Routes
// app.route('/api/v1/empresas', empresasRoutes);
// app.route('/api/v1/usuarios', usuariosRoutes);
// app.route('/api/v1/clientes', clientesRoutes);
// app.route('/api/v1/produtos', produtosRoutes);
// app.route('/api/v1/vendas', vendasRoutes);
// ... outros módulos

// =============================================
// ❌ NOT FOUND
// =============================================

app.notFound((c: Context) => {
  return c.json({
    error: 'Not Found',
    message: `Rota ${c.req.method} ${c.req.path} não encontrada`,
    timestamp: new Date().toISOString(),
  }, 404);
});

// =============================================
// 🔥 ERROR HANDLER
// =============================================

app.onError((err, c: Context) => {
  console.error('Error:', err);

  return c.json({
    error: 'Internal Server Error',
    message: c.env.ENVIRONMENT === 'development' ? err.message : 'Erro interno',
    timestamp: new Date().toISOString(),
  }, 500);
});

// =============================================
// 🚀 EXPORT
// =============================================

export default app;
