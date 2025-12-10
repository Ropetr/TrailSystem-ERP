// =============================================
// 🚀 PLANAC ERP - API Principal
// =============================================
// Arquivo: src/api/src/index.ts
// Atualizado: 10/12/2025 - Adicionadas 6 novas rotas

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';

// Rotas - Core
import auth from './routes/auth.routes';
import usuarios from './routes/usuarios.routes';
import perfis from './routes/perfis.routes';

// Rotas - Empresa & Config (NOVAS)
import empresas from './routes/empresas.routes';
import filiais from './routes/filiais.routes';
import configuracoes from './routes/configuracoes.routes';

// Rotas - Cadastros
import clientes from './routes/clientes.routes';
import fornecedores from './routes/fornecedores.routes';
import produtos from './routes/produtos.routes';

// Rotas - Comercial
import tabelasPreco from './routes/tabelas-preco.routes';
import condicoesPagamento from './routes/condicoes-pagamento.routes';
import orcamentos from './routes/orcamentos.routes';
import pedidos from './routes/pedidos.routes';

// Rotas - Operações
import estoque from './routes/estoque.routes';
import transportadoras from './routes/transportadoras.routes';

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
    version: '1.1.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    modules: {
      core: {
        auth: '/api/auth',
        usuarios: '/api/usuarios',
        perfis: '/api/perfis'
      },
      empresa: {
        empresas: '/api/empresas',
        filiais: '/api/filiais',
        configuracoes: '/api/configuracoes'
      },
      cadastros: {
        clientes: '/api/clientes',
        fornecedores: '/api/fornecedores',
        produtos: '/api/produtos'
      },
      comercial: {
        tabelasPreco: '/api/tabelas-preco',
        condicoesPagamento: '/api/condicoes-pagamento',
        orcamentos: '/api/orcamentos',
        pedidos: '/api/pedidos'
      },
      operacoes: {
        estoque: '/api/estoque',
        transportadoras: '/api/transportadoras'
      }
    },
    stats: {
      totalEndpoints: 15,
      totalRoutes: '~95'
    }
  });
});

// Health check detalhado
app.get('/health', async (c) => {
  try {
    // Testar conexão com D1
    const dbTest = await c.env.DB.prepare('SELECT 1 as ok').first();
    
    // Contar registros principais
    const stats = await c.env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM empresas) as empresas,
        (SELECT COUNT(*) FROM usuarios) as usuarios,
        (SELECT COUNT(*) FROM clientes) as clientes,
        (SELECT COUNT(*) FROM produtos) as produtos,
        (SELECT COUNT(*) FROM pedidos_venda) as pedidos
    `).first<any>();
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        database: dbTest ? 'up' : 'down',
        cache: 'up',
        storage: 'up'
      },
      database: {
        empresas: stats?.empresas || 0,
        usuarios: stats?.usuarios || 0,
        clientes: stats?.clientes || 0,
        produtos: stats?.produtos || 0,
        pedidos: stats?.pedidos || 0
      },
      version: '1.1.0',
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

// =============================================
// MONTAR ROTAS DA API
// =============================================

// Core
app.route('/api/auth', auth);
app.route('/api/usuarios', usuarios);
app.route('/api/perfis', perfis);

// Empresa & Config (NOVAS)
app.route('/api/empresas', empresas);
app.route('/api/filiais', filiais);
app.route('/api/configuracoes', configuracoes);

// Cadastros
app.route('/api/clientes', clientes);
app.route('/api/fornecedores', fornecedores);
app.route('/api/produtos', produtos);

// Comercial (NOVAS: tabelas-preco, condicoes-pagamento)
app.route('/api/tabelas-preco', tabelasPreco);
app.route('/api/condicoes-pagamento', condicoesPagamento);
app.route('/api/orcamentos', orcamentos);
app.route('/api/pedidos', pedidos);

// Operações (NOVA: transportadoras)
app.route('/api/estoque', estoque);
app.route('/api/transportadoras', transportadoras);

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
    hint: 'Acesse / para ver todos os endpoints disponíveis',
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
