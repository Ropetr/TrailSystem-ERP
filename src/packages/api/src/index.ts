// =============================================
// PLANAC ERP - API Entry Point
// Cloudflare Workers com Hono
// Atualizado: 16/12/2025 - Adicao de rotas migradas
// =============================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from 'hono/logger';

// Routes - Core
import auth from './routes/auth';
import usuarios from './routes/usuarios';
import perfis from './routes/perfis';

// Routes - Comercial
import clientes from './routes/clientes';
import fornecedores from './routes/fornecedores';
import produtos from './routes/produtos';
import orcamentos from './routes/orcamentos';
import vendas from './routes/vendas';
import entregas from './routes/entregas';
import creditos from './routes/creditos';
import devolucoes from './routes/devolucoes';
import trocas from './routes/trocas';
import consignacoes from './routes/consignacoes';
import garantias from './routes/garantias';

// Routes - Financeiro
import contasPagar from './routes/contas-pagar';
import contasReceber from './routes/contas-receber';
import cobranca from './routes/cobranca';
import limiteCredito from './routes/limite-credito';

// Routes - Compras
import compras from './routes/compras';

// Routes - Estoque
import estoque from './routes/estoque';
import inventario from './routes/inventario';

// Routes - Fiscal/Integracao
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

// CORS - Permitir origens necessarias
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://planac.com.br',
    'https://*.planac.com.br',
    'https://planac-erp.pages.dev',
    'https://app.trailsystem.com.br',
    'https://trailsystem.com.br',
    'https://*.trailsystem.com.br',
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
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development',
        routes: {
          core: ['/v1/auth', '/v1/usuarios', '/v1/perfis'],
          comercial: ['/v1/clientes', '/v1/fornecedores', '/v1/produtos', '/v1/orcamentos', '/v1/vendas', '/v1/entregas', '/v1/creditos', '/v1/devolucoes', '/v1/trocas', '/v1/consignacoes', '/v1/garantias'],
          financeiro: ['/v1/contas-pagar', '/v1/contas-receber', '/v1/cobranca', '/v1/limite-credito'],
          compras: ['/v1/compras'],
          estoque: ['/v1/estoque', '/v1/inventario'],
          fiscal: ['/v1/fiscal', '/v1/ibpt', '/v1/certificados'],
          config: ['/v1/empresas-config', '/v1/jobs']
        }
  });
});

// Auth (sem prefixo v1 para compatibilidade com frontend)
app.route('/api/auth', auth);

// ===== API v1 - Core =====
app.route('/v1/auth', auth);
app.route('/v1/usuarios', usuarios);
app.route('/v1/perfis', perfis);

// ===== API v1 - Comercial =====
app.route('/v1/clientes', clientes);
app.route('/v1/fornecedores', fornecedores);
app.route('/v1/produtos', produtos);
app.route('/v1/orcamentos', orcamentos);
app.route('/v1/vendas', vendas);
app.route('/v1/entregas', entregas);
app.route('/v1/creditos', creditos);
app.route('/v1/devolucoes', devolucoes);
app.route('/v1/trocas', trocas);
app.route('/v1/consignacoes', consignacoes);
app.route('/v1/garantias', garantias);

// ===== API v1 - Financeiro =====
app.route('/v1/contas-pagar', contasPagar);
app.route('/v1/contas-receber', contasReceber);
app.route('/v1/cobranca', cobranca);
app.route('/v1/limite-credito', limiteCredito);

// ===== API v1 - Compras =====
app.route('/v1/compras', compras);

// ===== API v1 - Estoque =====
app.route('/v1/estoque', estoque);
app.route('/v1/inventario', inventario);

// ===== API v1 - Fiscal/Integracao =====
app.route('/v1/fiscal', fiscal);
app.route('/v1/ibpt', ibpt);
app.route('/v1/certificados', certificados);
app.route('/v1/empresas-config', empresasConfig);
app.route('/v1/jobs', jobs);

// Root
app.get('/', (c) => {
  return c.json({
    name: 'PLANAC ERP API',
    version: '2.1.0',
    description: 'API do sistema ERP PLANAC',
    docs: '/v1/docs',
    health: '/health',
    auth: '/api/auth/login',
    modules: {
      core: 'Usuarios, Perfis, Autenticacao',
      comercial: 'Clientes, Fornecedores, Produtos, Orcamentos, Vendas',
      financeiro: 'Contas a Pagar, Contas a Receber',
      estoque: 'Saldos, Movimentacoes, Locais',
      fiscal: 'NF-e, NFC-e, NFS-e, CT-e, MDF-e, IBPT',
      config: 'Empresas, Certificados, Jobs'
    }
  });
});

// 404
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
                available_routes: [
                  '/health',
                  '/api/auth/*',
                  '/v1/usuarios',
                  '/v1/perfis',
                  '/v1/clientes',
                  '/v1/fornecedores',
                  '/v1/produtos',
                  '/v1/orcamentos',
                  '/v1/vendas',
                  '/v1/entregas/*',
                                    '/v1/creditos/*',
                                    '/v1/devolucoes/*',
                                                                        '/v1/trocas/*',
                                                                                                                                                '/v1/consignacoes/*',
                                                                                                            '/v1/garantias/*',
                                                                                                            '/v1/contas-pagar/*',
                  '/v1/contas-receber/*',
                                    '/v1/cobranca/*',
                                    '/v1/limite-credito/*',
                                                      '/v1/compras/*',
                                    '/v1/estoque/*',
                                    '/v1/inventario/*',
                  '/v1/fiscal/*',
                  '/v1/ibpt/*',
                  '/v1/certificados/*',
                  '/v1/empresas-config/*',
                  '/v1/jobs/*'
                ]
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
