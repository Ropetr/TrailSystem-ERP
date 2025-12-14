// =============================================
// PLANAC ERP - Worker Main Entry Point
// Cloudflare Workers API
// =============================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import type { Env, ExecutionContext, ScheduledEvent } from './types/env';

// Routes
import fiscal from './routes/fiscal';
import ibpt from './routes/ibpt';
import certificados from './routes/certificados';
import empresasConfig from './routes/empresas-config';

// Scheduled Jobs
import { handleScheduled } from './scheduled/jobs';

// ===== APP SETUP =====

const app = new Hono<{ Bindings: Env }>();

// ===== MIDDLEWARES =====

// CORS
app.use('*', cors({
  origin: (origin) => {
    // Em produção, restringir para domínios específicos
    const allowedOrigins = [
      'https://app.planac.com.br',
      'https://planac.com.br',
      'http://localhost:3000',
      'http://localhost:5173',
    ];
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-Tenant-Id'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 600,
  credentials: true,
}));

// Secure Headers
app.use('*', secureHeaders());

// Logger (apenas em desenvolvimento)
app.use('*', async (c, next) => {
  if (c.env.LOG_LEVEL === 'debug') {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${c.req.method} ${c.req.path} - ${c.res.status} - ${ms}ms`);
  } else {
    await next();
  }
});

// ===== HEALTH CHECK =====

app.get('/', (c) => {
  return c.json({
    name: 'PLANAC ERP API',
    version: '1.0.0',
    status: 'online',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (c) => {
  try {
    // Testar conexão com D1
    await c.env.DB.prepare('SELECT 1').first();
    
    return c.json({
      status: 'healthy',
      services: {
        api: 'up',
        database: 'up',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      services: {
        api: 'up',
        database: 'down',
      },
      error: String(error),
      timestamp: new Date().toISOString(),
    }, 503);
  }
});

// ===== ROUTES =====

// API v1
app.route('/v1/fiscal', fiscal);
app.route('/v1/ibpt', ibpt);
app.route('/v1/certificados', certificados);
app.route('/v1/empresas-config', empresasConfig);

// Aliases sem versão (para compatibilidade)
app.route('/fiscal', fiscal);
app.route('/ibpt', ibpt);
app.route('/certificados', certificados);
app.route('/empresas-config', empresasConfig);

// ===== ERROR HANDLING =====

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  
  // Não expor detalhes em produção
  const message = c.env.ENVIRONMENT === 'production' 
    ? 'Erro interno do servidor' 
    : err.message;
  
  return c.json({
    error: message,
    timestamp: new Date().toISOString(),
  }, 500);
});

app.notFound((c) => {
  return c.json({
    error: 'Endpoint não encontrado',
    path: c.req.path,
    method: c.req.method,
  }, 404);
});

// ===== EXPORTS =====

export default {
  // HTTP Handler
  fetch: app.fetch,
  
  // Scheduled Handler (Cron)
  scheduled: async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
    await handleScheduled(event, env, ctx);
  },
};
