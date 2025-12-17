import { test, expect } from '@playwright/test';

// =====================================================
// PLANAC ERP - Testes E2E de Páginas
// Verifica se todas as páginas carregam sem erros
// =====================================================

// Helper: Simula login antes dos testes
async function login(page: any) {
  // Definir localStorage para simular usuário logado
  await page.addInitScript(() => {
    localStorage.setItem('user', JSON.stringify({
      id: 'test-user',
      nome: 'Teste Automatizado',
      email: 'teste@planac.com.br',
      perfil: 'admin'
    }));
    localStorage.setItem('token', 'test-token-e2e');
    localStorage.setItem('temUser', 'true');
    localStorage.setItem('temToken', 'true');
  });
}

// Helper: Verificar se página carregou sem erros fatais
async function checkPageLoads(page: any, route: string, pageName: string) {
  const errors: string[] = [];
  
  // Capturar erros do console
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignorar erros de API (esperados sem backend real)
      if (!text.includes('net::ERR') && !text.includes('Failed to fetch') && !text.includes('NetworkError')) {
        errors.push(text);
      }
    }
  });

  // Capturar erros de página
  page.on('pageerror', (err: any) => {
    errors.push(err.message);
  });

  await page.goto(route, { waitUntil: 'networkidle', timeout: 20000 });
  
  // Aguardar um pouco para erros assíncronos
  await page.waitForTimeout(1000);

  // Verificar se não há erros fatais de React
  const hasReactError = errors.some(e => 
    e.includes('Minified React error') || 
    e.includes('Cannot read properties of undefined') ||
    e.includes('is not a function') ||
    e.includes('is not defined')
  );

  if (hasReactError) {
    throw new Error(`Erro fatal na página ${pageName}:\n${errors.join('\n')}`);
  }

  // Verificar se a página não está em branco
  const bodyText = await page.locator('body').textContent();
  expect(bodyText?.length).toBeGreaterThan(10);
}

// =====================================================
// TESTES POR MÓDULO
// =====================================================

test.describe('🔐 Auth', () => {
  test('Login Page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('📊 Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Dashboard Principal', async ({ page }) => {
    await checkPageLoads(page, '/dashboard', 'Dashboard');
  });
});

test.describe('📁 Cadastros - Entidades', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Clientes - Lista', async ({ page }) => {
    await checkPageLoads(page, '/cadastros/clientes', 'Clientes');
  });

  test('Clientes - Novo', async ({ page }) => {
    await checkPageLoads(page, '/cadastros/clientes/novo', 'Novo Cliente');
  });

  test('Fornecedores - Lista', async ({ page }) => {
    await checkPageLoads(page, '/cadastros/fornecedores', 'Fornecedores');
  });

  test('Colaboradores - Lista', async ({ page }) => {
    await checkPageLoads(page, '/cadastros/colaboradores', 'Colaboradores');
  });
});

test.describe('📁 Cadastros - Produtos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Produtos - Lista', async ({ page }) => {
    await checkPageLoads(page, '/cadastros/produtos', 'Produtos');
  });

  test('Produtos - Novo', async ({ page }) => {
    await checkPageLoads(page, '/cadastros/produtos/novo', 'Novo Produto');
  });
});

test.describe('📁 Cadastros - Empresa', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Empresas - Lista', async ({ page }) => {
    await checkPageLoads(page, '/cadastros/empresas', 'Empresas');
  });

  test('Empresas - Nova', async ({ page }) => {
    await checkPageLoads(page, '/cadastros/empresas/novo', 'Nova Empresa');
  });
});

test.describe('📁 Cadastros - Financeiro', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Plano de Contas', async ({ page }) => {
    await checkPageLoads(page, '/cadastros/plano-contas', 'Plano de Contas');
  });

  test('Bens/Ativos', async ({ page }) => {
    await checkPageLoads(page, '/cadastros/bens', 'Bens');
  });
});

test.describe('📁 Cadastros - Acessos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Usuários - Lista', async ({ page }) => {
    await checkPageLoads(page, '/cadastros/usuarios', 'Usuários');
  });

  test('Usuários - Novo', async ({ page }) => {
    await checkPageLoads(page, '/cadastros/usuarios/novo', 'Novo Usuário');
  });

  test('Perfis', async ({ page }) => {
    await checkPageLoads(page, '/cadastros/perfis', 'Perfis');
  });
});

test.describe('🛒 Comercial', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Orçamentos - Lista', async ({ page }) => {
    await checkPageLoads(page, '/comercial/orcamentos', 'Orçamentos');
  });

  test('Orçamentos - Novo', async ({ page }) => {
    await checkPageLoads(page, '/comercial/orcamentos/novo', 'Novo Orçamento');
  });

  test('Vendas - Lista', async ({ page }) => {
    await checkPageLoads(page, '/comercial/vendas', 'Vendas');
  });

  test('Vendas - Nova', async ({ page }) => {
    await checkPageLoads(page, '/comercial/vendas/novo', 'Nova Venda');
  });
});

test.describe('📦 Estoque', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Saldos', async ({ page }) => {
    await checkPageLoads(page, '/estoque/saldos', 'Saldos');
  });

  test('Movimentações', async ({ page }) => {
    await checkPageLoads(page, '/estoque/movimentacoes', 'Movimentações');
  });

  test('Transferências', async ({ page }) => {
    await checkPageLoads(page, '/estoque/transferencias', 'Transferências');
  });

  test('Inventário', async ({ page }) => {
    await checkPageLoads(page, '/estoque/inventario', 'Inventário');
  });
});

test.describe('📄 Fiscal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Notas Fiscais - Lista', async ({ page }) => {
    await checkPageLoads(page, '/fiscal/notas', 'Notas Fiscais');
  });

  test('NF-e - Nova', async ({ page }) => {
    await checkPageLoads(page, '/fiscal/nfe/nova', 'Nova NF-e');
  });

  test('PDV (NFC-e)', async ({ page }) => {
    await checkPageLoads(page, '/fiscal/pdv', 'PDV');
  });
});

test.describe('💰 Financeiro', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Contas a Receber', async ({ page }) => {
    await checkPageLoads(page, '/financeiro/receber', 'Contas a Receber');
  });

  test('Contas a Pagar', async ({ page }) => {
    await checkPageLoads(page, '/financeiro/pagar', 'Contas a Pagar');
  });

  test('Fluxo de Caixa', async ({ page }) => {
    await checkPageLoads(page, '/financeiro/fluxo-caixa', 'Fluxo de Caixa');
  });

  test('Boletos', async ({ page }) => {
    await checkPageLoads(page, '/financeiro/boletos', 'Boletos');
  });

  test('Conciliação', async ({ page }) => {
    await checkPageLoads(page, '/financeiro/conciliacao', 'Conciliação');
  });
});

test.describe('🛍️ Compras', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Cotações', async ({ page }) => {
    await checkPageLoads(page, '/compras/cotacoes', 'Cotações');
  });

  test('Pedidos de Compra', async ({ page }) => {
    await checkPageLoads(page, '/compras/pedidos', 'Pedidos de Compra');
  });
});

test.describe('🚚 Logística', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Entregas', async ({ page }) => {
    await checkPageLoads(page, '/logistica/entregas', 'Entregas');
  });

  test('Rotas', async ({ page }) => {
    await checkPageLoads(page, '/logistica/rotas', 'Rotas');
  });

  test('Rastreamento', async ({ page }) => {
    await checkPageLoads(page, '/logistica/rastreamento', 'Rastreamento');
  });
});

test.describe('👥 CRM', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Dashboard CRM', async ({ page }) => {
    await checkPageLoads(page, '/crm', 'CRM Dashboard');
  });

  test('Pipeline', async ({ page }) => {
    await checkPageLoads(page, '/crm/pipeline', 'Pipeline');
  });

  test('Leads', async ({ page }) => {
    await checkPageLoads(page, '/crm/leads', 'Leads');
  });

  test('Oportunidades', async ({ page }) => {
    await checkPageLoads(page, '/crm/oportunidades', 'Oportunidades');
  });

  test('Atividades', async ({ page }) => {
    await checkPageLoads(page, '/crm/atividades', 'Atividades');
  });
});

test.describe('🌐 E-commerce', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Produtos Online', async ({ page }) => {
    await checkPageLoads(page, '/ecommerce/produtos', 'Produtos Online');
  });

  test('Pedidos Online', async ({ page }) => {
    await checkPageLoads(page, '/ecommerce/pedidos', 'Pedidos Online');
  });
});

test.describe('🧮 Contábil', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Lançamentos', async ({ page }) => {
    await checkPageLoads(page, '/contabil/lancamentos', 'Lançamentos');
  });

  test('DRE', async ({ page }) => {
    await checkPageLoads(page, '/contabil/dre', 'DRE');
  });

  test('Balanço', async ({ page }) => {
    await checkPageLoads(page, '/contabil/balanco', 'Balanço');
  });
});

test.describe('👔 RH', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Folha de Pagamento', async ({ page }) => {
    await checkPageLoads(page, '/rh/folha', 'Folha');
  });

  test('Ponto Eletrônico', async ({ page }) => {
    await checkPageLoads(page, '/rh/ponto', 'Ponto');
  });
});

test.describe('🏠 Patrimônio', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Depreciação', async ({ page }) => {
    await checkPageLoads(page, '/patrimonio/depreciacao', 'Depreciação');
  });
});

test.describe('📊 BI & Relatórios', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Dashboards BI', async ({ page }) => {
    await checkPageLoads(page, '/bi/dashboards', 'Dashboards BI');
  });

  test('Relatórios', async ({ page }) => {
    await checkPageLoads(page, '/bi/relatorios', 'Relatórios');
  });

  test('Indicadores', async ({ page }) => {
    await checkPageLoads(page, '/bi/indicadores', 'Indicadores');
  });
});

test.describe('🎧 Suporte', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Tickets', async ({ page }) => {
    await checkPageLoads(page, '/suporte/tickets', 'Tickets');
  });

  test('Base de Conhecimento', async ({ page }) => {
    await checkPageLoads(page, '/suporte/base', 'Base de Conhecimento');
  });
});

test.describe('⚙️ Configurações', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Configurações Gerais', async ({ page }) => {
    await checkPageLoads(page, '/configuracoes/geral', 'Configurações');
  });

  test('Configurações Fiscais', async ({ page }) => {
    await checkPageLoads(page, '/configuracoes/fiscal', 'Config Fiscal');
  });

  test('Integrações', async ({ page }) => {
    await checkPageLoads(page, '/configuracoes/integracoes', 'Integrações');
  });
});
