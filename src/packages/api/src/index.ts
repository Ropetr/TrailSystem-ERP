// =============================================
// PLANAC ERP - API Entry Point
// Cloudflare Workers com Hono
// =============================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from 'hono/logger';

// Routes
import auth from './routes/auth';
import fiscal from './routes/fiscal';
import ibpt from './routes/ibpt';
import certificados from './routes/certificados';
import empresasConfig from './routes/empresas-config';
import jobs from './routes/jobs';

// Scheduled handlers
import { handleScheduled } from './scheduled/jobs';

// Types
import type { Env, ScheduledEvent, ExecutionContext } from './types/env';

// ===== APP =====

const app = new Hono<{ Bindings: Env }>();

// ===== MIDDLEWARES =====

// CORS - Permitir origens necessárias
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://planac.com.br',
    'https://*.planac.com.br',
    'https://planac-erp.pages.dev',
    'https://*.planac-erp.pages.dev',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'X-Cron-Secret'],
  credentials: true,
}));

// Secure Headers
app.use('*', secureHeaders());

// Logger (apenas em dev)
app.use('*', async (c, next) => {
  if (c.env.ENVIRONMENT !== 'production') {
    return logger()(c, next);
  }
  return next();
});

// ===== ROUTES =====

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development',
  });
});

// Auth (sem prefixo v1 para compatibilidade com frontend)
app.route('/api/auth', auth);

// API v1
app.route('/v1/auth', auth);
app.route('/v1/fiscal', fiscal);
app.route('/v1/ibpt', ibpt);
app.route('/v1/certificados', certificados);
app.route('/v1/empresas-config', empresasConfig);
app.route('/v1/jobs', jobs);

// Root
app.get('/', (c) => {
  return c.json({
    name: 'PLANAC ERP API',
    version: '1.0.0',
    docs: '/v1/docs',
    health: '/health',
    auth: '/api/auth/login',
  });
});

// 404
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('[ERROR]', err);
  return c.json({
    error: 'Internal Server Error',
    message: c.env.ENVIRONMENT === 'production' ? 'An unexpected error occurred' : err.message,
  }, 500);
});

// ===== EXPORTS =====

export default {
  fetch: app.fetch,
  
  // Scheduled handler (cron)
  scheduled: async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
    await handleScheduled(event, env, ctx);
  },
};
