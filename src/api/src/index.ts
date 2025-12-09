// =============================================
// 🚀 PLANAC ERP - API Principal
// =============================================
// Arquivo: src/api/src/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';

// Rotas
import auth from './routes/auth.routes';
import usuarios from './routes/usuarios.routes';
import perfis from './routes/perfis.routes';
import clientes from './routes/clientes.routes';
import fornecedores from './routes/fornecedores.routes';
import produtos from './routes/produtos.routes';
import estoque from './routes/estoque.routes';
import orcamentos from './routes/orcamentos.routes';
import pedidos from './routes/pedidos.routes';

// Tipos
interface Env {
  DB: D1Database;
  KV_CACHE: KVNamespace;
  KV_SESSIONS: KVNamespace;
  KV_RATE_LIMIT: KVNamespace;
  R2_STORAGE: R2Bucket;
  R2_DOCS: R2Bucket;
  R2_BACKUP: R2Bucket;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  NUVEM_FISCAL_URL: string;
  NUVEM_FISCAL_CLIENT_ID: string;
  NUVEM_FISCAL_CLIENT_SECRET: string;
}

// Criar aplicação
const app = new Hono<{ Bindings: Env }>();

// =============================================
// MIDDLEWARES GLOBAIS
// =============================================

// CORS
app.use('*', cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'https://planac.com.br', 
    'https://*.planac.com.br',
    'https://claude.ai'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400
}));

// Logger (apenas em dev)
app.use('*', async (c, next) => {
  if (c.env.ENVIRONMENT === 'development') {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${c.req.method} ${c.req.path} - ${c.res.status} ${ms}ms`);
  } else {
    await next();
  }
});

// Secure Headers
app.use('*', secureHeaders());

// =============================================
// ROTAS
// =============================================

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'PLANAC ERP API',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      usuarios: '/api/usuarios',
      perfis: '/api/perfis',
      clientes: '/api/clientes',
      fornecedores: '/api/fornecedores',
      produtos: '/api/produtos',
      estoque: '/api/estoque',
      orcamentos: '/api/orcamentos',
      pedidos: '/api/pedidos'
    }
  });
});

// Health check detalhado
app.get('/health', async (c) => {
  try {
    // Testar conexão com D1
    const dbTest = await c.env.DB.prepare('SELECT 1 as ok').first();
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        database: dbTest ? 'up' : 'down',
        cache: 'up',
        storage: 'up'
      },
      version: '1.0.0',
      environment: c.env.ENVIRONMENT || 'production'
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Montar rotas da API
app.route('/api/auth', auth);
app.route('/api/usuarios', usuarios);
app.route('/api/perfis', perfis);
app.route('/api/clientes', clientes);
app.route('/api/fornecedores', fornecedores);
app.route('/api/produtos', produtos);
app.route('/api/estoque', estoque);
app.route('/api/orcamentos', orcamentos);
app.route('/api/pedidos', pedidos);

// =============================================
// TRATAMENTO DE ERROS
// =============================================

// 404 - Rota não encontrada
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Endpoint não encontrado',
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString()
  }, 404);
});

// Erro global
app.onError((err, c) => {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err);

  if (err instanceof HTTPException) {
    return c.json({
      success: false,
      error: err.message,
      status: err.status
    }, err.status);
  }

  // Erro de validação Zod
  if (err.name === 'ZodError') {
    return c.json({
      success: false,
      error: 'Erro de validação',
      details: JSON.parse(err.message)
    }, 400);
  }

  // Erro genérico
  return c.json({
    success: false,
    error: c.env.ENVIRONMENT === 'development' 
      ? err.message 
      : 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  }, 500);
});

// =============================================
// EXPORTAR
// =============================================

export default app;
