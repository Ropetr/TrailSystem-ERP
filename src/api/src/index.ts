// =============================================
// 🚀 PLANAC ERP - API Principal (Unificada)
// =============================================
// Arquivo: src/api/src/index.ts
// Atualizado: 26/12/2025 - Unificação APIs + Integrações Fiscais
// 
// HISTÓRICO:
// - 10/12/2025: Versão inicial com 16 rotas
// - 26/12/2025: Unificação com packages/api + Nuvem Fiscal, IBPT, Certificados

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';

// =============================================
// ROTAS - CORE
// =============================================
import auth from './routes/auth.routes';
import usuarios from './routes/usuarios.routes';
import perfis from './routes/perfis.routes';

// =============================================
// ROTAS - EMPRESA & CONFIG
// =============================================
import empresas from './routes/empresas.routes';
import filiais from './routes/filiais.routes';
import configuracoes from './routes/configuracoes.routes';
import empresasConfig from './routes/empresas-config.routes'; // NOVO

// =============================================
// ROTAS - CADASTROS
// =============================================
import clientes from './routes/clientes.routes';
import fornecedores from './routes/fornecedores.routes';
import produtos from './routes/produtos.routes';
import categorias from './routes/categorias.routes';
import marcas from './routes/marcas.routes';
import unidades from './routes/unidades.routes';
import transportadoras from './routes/transportadoras.routes';
import motoristas from './routes/motoristas.routes';
import veiculos from './routes/veiculos.routes';
import vendedores from './routes/vendedores.routes';
import centrosCusto from './routes/centros-custo.routes';
import planoContas from './routes/plano-contas.routes';
import lancamentosContabeis from './routes/lancamentos-contabeis.routes';

// =============================================
// ROTAS - COMERCIAL
// =============================================
import tabelasPreco from './routes/tabelas-preco.routes';
import condicoesPagamento from './routes/condicoes-pagamento.routes';
import orcamentos from './routes/orcamentos.routes';
import pedidos from './routes/pedidos.routes';
import comissoes from './routes/comissoes.routes';

// =============================================
// ROTAS - ESTOQUE
// =============================================
import estoque from './routes/estoque.routes';
import inventarios from './routes/inventarios.routes';
import transferencias from './routes/transferencias.routes';
import locaisEstoque from './routes/locais-estoque.routes';

// =============================================
// ROTAS - FISCAL (NOVO - Nuvem Fiscal + IBPT)
// =============================================
import fiscal from './routes/fiscal.routes';           // NF-e, NFC-e, NFS-e, CT-e, MDF-e
import ibpt from './routes/ibpt.routes';               // Lei da Transparência
import certificados from './routes/certificados.routes'; // Certificados A1
import notasFiscais from './routes/notas-fiscais.routes';
import adrcst from './routes/adrcst.routes';           // ADRC-ST - Recuperação ICMS-ST (Paraná)

// =============================================
// ROTAS - FINANCEIRO
// =============================================
import contasPagar from './routes/contas-pagar.routes';
import contasReceber from './routes/contas-receber.routes';
import bancos from './routes/bancos.routes';
import caixas from './routes/caixas.routes';

// =============================================
// ROTAS - INTEGRAÇÕES BANCÁRIAS
// =============================================
import sisprime from './routes/sisprime.routes'; // Sisprime (Banco 084)
import sicoob from './routes/sicoob.routes'; // Sicoob (Banco 756)
import bancoBrasil from './routes/banco-brasil.routes'; // Banco do Brasil (Banco 001)
import caixa from './routes/caixa.routes'; // Caixa Econômica Federal (Banco 104)
import safra from './routes/safra.routes'; // Banco Safra (Banco 422)

// =============================================
// ROTAS - COMPRAS
// =============================================
import compras from './routes/compras.routes';
import consignacoes from './routes/consignacoes.routes';

// =============================================
// ROTAS - LOGÍSTICA
// =============================================
import entregas from './routes/entregas.routes';
import rotas from './routes/rotas.routes';
import rastreamento from './routes/rastreamento.routes';

// =============================================
// ROTAS - CRM
// =============================================
import crm from './routes/crm.routes';
import tarefas from './routes/tarefas.routes';

// =============================================
// ROTAS - PDV
// =============================================
import pdv from './routes/pdv.routes';

// =============================================
// ROTAS - RH
// =============================================
import rh from './routes/rh.routes';
import folhaPagamento from './routes/folha-pagamento.routes';

// =============================================
// ROTAS - PATRIMÔNIO
// =============================================
import patrimonio from './routes/patrimonio.routes';

// =============================================
// ROTAS - CONTÁBIL
// =============================================
import contabilidade from './routes/contabilidade.routes';

// =============================================
// ROTAS - E-COMMERCE
// =============================================
import ecommerce from './routes/ecommerce.routes';

// =============================================
// ROTAS - BI
// =============================================
import bi from './routes/bi.routes';

// =============================================
// ROTAS - SUPORTE
// =============================================
import tickets from './routes/tickets.routes';
import ocorrencias from './routes/ocorrencias.routes';

// =============================================
// ROTAS - SERVIÇOS
// =============================================
import ordensServico from './routes/ordens-servico.routes';
import contratos from './routes/contratos.routes';
import garantias from './routes/garantias.routes';
import devolucoes from './routes/devolucoes.routes';
import trocas from './routes/trocas.routes';

// =============================================
// ROTAS - SISTEMA
// =============================================
import auditoria from './routes/auditoria.routes';
import notificacoes from './routes/notificacoes.routes';
import arquivos from './routes/arquivos.routes';
import importExport from './routes/import-export.routes';
import workflows from './routes/workflows.routes';
import agenda from './routes/agenda.routes';
import jobs from './routes/jobs.routes'; // NOVO - Jobs agendados
import configSistema from './routes/configuracoes-sistema.routes';
import tags from './routes/tags.routes'; // NOVO - Sistema de Tags

// =============================================
// TIPOS
// =============================================
interface Env {
  // Databases D1
  DB: D1Database;
  DB_IBPT: D1Database; // NOVO - Banco IBPT
  
  // KV Namespaces
  KV_CACHE: KVNamespace;
  KV_SESSIONS: KVNamespace;
  KV_RATE_LIMIT: KVNamespace;
  
  // R2 Buckets
  R2_STORAGE: R2Bucket;
  R2_DOCS: R2Bucket;
  R2_BACKUP: R2Bucket;
  R2_CERTIFICADOS: R2Bucket; // NOVO - Certificados A1
  
  // Secrets
  JWT_SECRET: string;
  ENCRYPTION_KEY: string; // NOVO - Criptografia certificados
  
  // Config
  ENVIRONMENT: string;
  
  // Nuvem Fiscal
  NUVEM_FISCAL_URL: string;
  NUVEM_FISCAL_CLIENT_ID: string;
  NUVEM_FISCAL_CLIENT_SECRET: string;
  
  // Email (Resend)
  EMAIL_API_KEY: string;
  
  // WhatsApp (API Brasil)
  WHATSAPP_API_KEY: string;
}

// Criar aplicação
const app = new Hono<{ Bindings: Env }>();

// =============================================
// MIDDLEWARES GLOBAIS
// =============================================

// CORS - Função para validar origens permitidas
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:5173',
  'http://localhost:5174',
  'https://planac.com.br', 
  'https://planacdistribuidora.com.br',
  'https://trailsystem.com.br',
  'https://app.trailsystem.com.br',
  'https://claude.ai'
];

const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return false;
  
  // Origens exatas
  if (allowedOrigins.includes(origin)) return true;
  
  // Subdomínios permitidos
  if (origin.endsWith('.planac.com.br')) return true;
  if (origin.endsWith('.planacdistribuidora.com.br')) return true;
  if (origin.endsWith('.trailsystem.com.br')) return true;
  
  // Cloudflare Pages (preview deployments)
  if (origin.endsWith('.pages.dev')) return true;
  if (origin.endsWith('.trailsystem-erp.pages.dev')) return true;
  
  return false;
};

app.use('*', cors({
  origin: (origin) => {
    return isAllowedOrigin(origin) ? origin : allowedOrigins[0];
  },
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
// ROTAS - REGISTRO
// =============================================

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'PLANAC ERP API',
    version: '2.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
    routes: {
      core: ['/api/auth', '/api/usuarios', '/api/perfis'],
      empresa: ['/api/empresas', '/api/filiais', '/api/configuracoes', '/api/empresas-config'],
      cadastros: ['/api/clientes', '/api/fornecedores', '/api/produtos', '/api/categorias', '/api/marcas', '/api/unidades', '/api/transportadoras', '/api/motoristas', '/api/veiculos', '/api/vendedores'],
      comercial: ['/api/tabelas-preco', '/api/condicoes-pagamento', '/api/orcamentos', '/api/pedidos', '/api/comissoes'],
      estoque: ['/api/estoque', '/api/inventarios', '/api/transferencias', '/api/locais-estoque'],
      fiscal: ['/api/fiscal', '/api/ibpt', '/api/certificados', '/api/notas-fiscais', '/api/adrcst'],
      financeiro: ['/api/contas-pagar', '/api/contas-receber', '/api/bancos', '/api/caixas'],
      compras: ['/api/compras', '/api/consignacoes'],
      logistica: ['/api/entregas', '/api/rotas', '/api/rastreamento'],
      crm: ['/api/crm', '/api/tarefas'],
      pdv: ['/api/pdv'],
      rh: ['/api/rh', '/api/folha-pagamento'],
      patrimonio: ['/api/patrimonio'],
      contabil: ['/api/contabilidade'],
      ecommerce: ['/api/ecommerce'],
      bi: ['/api/bi'],
      suporte: ['/api/tickets', '/api/ocorrencias'],
      servicos: ['/api/ordens-servico', '/api/contratos', '/api/garantias', '/api/devolucoes', '/api/trocas'],
      sistema: ['/api/auditoria', '/api/notificacoes', '/api/arquivos', '/api/import-export', '/api/workflows', '/api/agenda', '/api/jobs', '/api/config-sistema', '/api/tags']
    }
  });
});

// Health check detalhado
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime?.() || 'N/A'
  });
});

// =============================================
// ROTAS - CORE (suporte /api e /v1 para compatibilidade)
// =============================================
app.route('/api/auth', auth);
app.route('/api/usuarios', usuarios);
app.route('/api/perfis', perfis);

// Alias /v1 -> /api para compatibilidade com frontends antigos
app.route('/v1/auth', auth);
app.route('/v1/usuarios', usuarios);
app.route('/v1/perfis', perfis);

// =============================================
// ROTAS - EMPRESA & CONFIG
// =============================================
app.route('/api/empresas', empresas);
app.route('/api/filiais', filiais);
app.route('/api/configuracoes', configuracoes);
app.route('/api/empresas-config', empresasConfig); // NOVO

// Alias /v1 para empresa & config
app.route('/v1/empresas', empresas);
app.route('/v1/filiais', filiais);
app.route('/v1/configuracoes', configuracoes);
app.route('/v1/empresas-config', empresasConfig);

// =============================================
// ROTAS - CADASTROS
// =============================================
app.route('/api/clientes', clientes);
app.route('/api/fornecedores', fornecedores);
app.route('/api/produtos', produtos);
app.route('/api/categorias', categorias);
app.route('/api/marcas', marcas);
app.route('/api/unidades', unidades);
app.route('/api/transportadoras', transportadoras);
app.route('/api/motoristas', motoristas);
app.route('/api/veiculos', veiculos);
app.route('/api/vendedores', vendedores);
app.route('/api/centros-custo', centrosCusto);
app.route('/api/plano-contas', planoContas);
app.route('/api/lancamentos-contabeis', lancamentosContabeis);

// Alias /v1 para cadastros
app.route('/v1/clientes', clientes);
app.route('/v1/fornecedores', fornecedores);
app.route('/v1/produtos', produtos);
app.route('/v1/categorias', categorias);
app.route('/v1/marcas', marcas);
app.route('/v1/unidades', unidades);
app.route('/v1/transportadoras', transportadoras);
app.route('/v1/motoristas', motoristas);
app.route('/v1/veiculos', veiculos);
app.route('/v1/vendedores', vendedores);
app.route('/v1/centros-custo', centrosCusto);
app.route('/v1/plano-contas', planoContas);
app.route('/v1/lancamentos-contabeis', lancamentosContabeis);

// =============================================
// ROTAS - COMERCIAL
// =============================================
app.route('/api/tabelas-preco', tabelasPreco);
app.route('/api/condicoes-pagamento', condicoesPagamento);
app.route('/api/orcamentos', orcamentos);
app.route('/api/pedidos', pedidos);
app.route('/api/comissoes', comissoes);

// Alias /v1 para comercial
app.route('/v1/tabelas-preco', tabelasPreco);
app.route('/v1/condicoes-pagamento', condicoesPagamento);
app.route('/v1/orcamentos', orcamentos);
app.route('/v1/pedidos', pedidos);
app.route('/v1/comissoes', comissoes);

// =============================================
// ROTAS - ESTOQUE
// =============================================
app.route('/api/estoque', estoque);
app.route('/api/inventarios', inventarios);
app.route('/api/transferencias', transferencias);
app.route('/api/locais-estoque', locaisEstoque);

// Alias /v1 para estoque
app.route('/v1/estoque', estoque);
app.route('/v1/inventarios', inventarios);
app.route('/v1/transferencias', transferencias);
app.route('/v1/locais-estoque', locaisEstoque);

// =============================================
// ROTAS - FISCAL (NOVO)
// =============================================
app.route('/api/fiscal', fiscal);             // Nuvem Fiscal - NF-e, NFC-e, NFS-e, CT-e, MDF-e
app.route('/api/ibpt', ibpt);                 // IBPT - Lei da Transparência
app.route('/api/certificados', certificados); // Certificados A1
app.route('/api/notas-fiscais', notasFiscais);
app.route('/api/adrcst', adrcst);             // ADRC-ST - Recuperação ICMS-ST (Paraná)

// Alias /v1 para fiscal
app.route('/v1/fiscal', fiscal);
app.route('/v1/ibpt', ibpt);
app.route('/v1/certificados', certificados);
app.route('/v1/notas-fiscais', notasFiscais);
app.route('/v1/adrcst', adrcst);

// =============================================
// ROTAS - FINANCEIRO
// =============================================
app.route('/api/contas-pagar', contasPagar);
app.route('/api/contas-receber', contasReceber);
app.route('/api/bancos', bancos);
app.route('/api/caixas', caixas);

// Alias /v1 para financeiro
app.route('/v1/contas-pagar', contasPagar);
app.route('/v1/contas-receber', contasReceber);
app.route('/v1/bancos', bancos);
app.route('/v1/caixas', caixas);

// =============================================
// ROTAS - INTEGRAÇÕES BANCÁRIAS
// =============================================
app.route('/api/sisprime', sisprime);  // Sisprime (Banco 084) - Boletos e PIX
app.route('/v1/sisprime', sisprime);   // Alias /v1
app.route('/api/sicoob', sicoob);      // Sicoob (Banco 756) - Boletos e PIX
app.route('/v1/sicoob', sicoob);       // Alias /v1
app.route('/api/banco-brasil', bancoBrasil);  // Banco do Brasil (Banco 001) - Boletos e PIX
app.route('/v1/banco-brasil', bancoBrasil);   // Alias /v1
app.route('/api/caixa', caixa);        // Caixa Econômica Federal (Banco 104) - Boletos e PIX
app.route('/v1/caixa', caixa);         // Alias /v1
app.route('/api/safra', safra);        // Banco Safra (Banco 422) - Boletos e PIX
app.route('/v1/safra', safra);         // Alias /v1

// =============================================
// ROTAS - COMPRAS
// =============================================
app.route('/api/compras', compras);
app.route('/api/consignacoes', consignacoes);

// =============================================
// ROTAS - LOGÍSTICA
// =============================================
app.route('/api/entregas', entregas);
app.route('/api/rotas', rotas);
app.route('/api/rastreamento', rastreamento);

// Alias /api/logistica/* para compatibilidade com frontend
app.route('/api/logistica/entregas', entregas);
app.route('/api/logistica/rotas', rotas);
app.route('/api/logistica/rastreio', rastreamento);
app.route('/api/logistica/veiculos', veiculos);
app.route('/api/logistica/motoristas', motoristas);
app.route('/api/logistica/manutencoes', veiculos); // Manutenções são sub-rota de veículos

// Alias /v1/logistica/* para compatibilidade com frontend (algumas páginas usam /v1/)
app.route('/v1/logistica/entregas', entregas);
app.route('/v1/logistica/rotas', rotas);
app.route('/v1/logistica/rastreio', rastreamento);
app.route('/v1/logistica/veiculos', veiculos);
app.route('/v1/logistica/motoristas', motoristas);
app.route('/v1/logistica/manutencoes', veiculos);

// =============================================
// ROTAS - CRM
// =============================================
app.route('/api/crm', crm);
app.route('/api/tarefas', tarefas);

// =============================================
// ROTAS - PDV
// =============================================
app.route('/api/pdv', pdv);

// =============================================
// ROTAS - RH
// =============================================
app.route('/api/rh', rh);
app.route('/api/folha-pagamento', folhaPagamento);

// =============================================
// ROTAS - PATRIMÔNIO
// =============================================
app.route('/api/patrimonio', patrimonio);

// =============================================
// ROTAS - CONTÁBIL
// =============================================
app.route('/api/contabilidade', contabilidade);

// =============================================
// ROTAS - E-COMMERCE
// =============================================
app.route('/api/ecommerce', ecommerce);

// =============================================
// ROTAS - BI
// =============================================
app.route('/api/bi', bi);

// =============================================
// ROTAS - SUPORTE
// =============================================
app.route('/api/tickets', tickets);
app.route('/api/ocorrencias', ocorrencias);

// =============================================
// ROTAS - SERVIÇOS
// =============================================
app.route('/api/ordens-servico', ordensServico);
app.route('/api/contratos', contratos);
app.route('/api/garantias', garantias);
app.route('/api/devolucoes', devolucoes);
app.route('/api/trocas', trocas);

// =============================================
// ROTAS - SISTEMA
// =============================================
app.route('/api/auditoria', auditoria);
app.route('/api/notificacoes', notificacoes);
app.route('/api/arquivos', arquivos);
app.route('/api/import-export', importExport);
app.route('/api/workflows', workflows);
app.route('/api/agenda', agenda);
app.route('/api/jobs', jobs); // NOVO
app.route('/api/config-sistema', configSistema);
app.route('/api/tags', tags); // NOVO - Sistema de Tags

// Alias /v1 para sistema
app.route('/v1/auditoria', auditoria);
app.route('/v1/notificacoes', notificacoes);
app.route('/v1/arquivos', arquivos);
app.route('/v1/import-export', importExport);
app.route('/v1/workflows', workflows);
app.route('/v1/agenda', agenda);
app.route('/v1/jobs', jobs);
app.route('/v1/config-sistema', configSistema);
app.route('/v1/tags', tags);

// =============================================
// ERROR HANDLING
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
