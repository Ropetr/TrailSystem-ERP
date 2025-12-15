// =============================================
// PLANAC ERP - Routes Completas
// Todos os módulos do sistema
// =============================================

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/stores/auth.store';

// Layouts
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';

// Core Pages
import {
  DashboardPage,
  EmpresasPage,
  EmpresaFormPage,
  FiliaisPage,
  UsuariosPage,
  UsuarioFormPage,
  PerfisPage,
  ConfiguracoesPage,
} from '@/pages/core';

// Comercial Pages
import {
  ClientesPage,
  ClienteFormPage,
  ProdutosPage,
  ProdutoFormPage,
  OrcamentosPage,
  OrcamentoFormPage,
  VendasPage,
  VendaFormPage,
} from '@/pages/comercial';

// Estoque Pages
import {
  SaldosPage,
  MovimentacoesPage,
  TransferenciasPage,
  InventarioPage,
} from '@/pages/estoque';

// Fiscal Pages
import {
  NotasPage,
  NotaFormPage,
  NFCePage,
  ConfigFiscalPage,
} from '@/pages/fiscal';

// Financeiro Pages
import {
  ContasReceberPage,
  ContasPagarPage,
  FluxoCaixaPage,
  BoletosPage,
  ConciliacaoPage,
} from '@/pages/financeiro';

// Compras Pages
import {
  FornecedoresPage,
  CotacoesPage,
  PedidosCompraPage,
} from '@/pages/compras';

// Logística Pages
import {
  EntregasPage,
  RotasPage,
  RastreioPage,
} from '@/pages/logistica';

// CRM Pages
import {
  CRMDashboardPage,
  PipelinePage,
  LeadsPage,
  OportunidadesPage,
  AtividadesPage,
} from '@/pages/crm';

// E-commerce Pages
import {
  ProdutosOnlinePage,
  PedidosOnlinePage,
  IntegracaoPage,
} from '@/pages/ecommerce';

// Contábil Pages
import {
  PlanoContasPage,
  LancamentosPage,
  DREPage,
  BalancoPage,
} from '@/pages/contabil';

// RH Pages
import {
  FuncionariosPage,
  FolhaPage,
  PontoPage,
} from '@/pages/rh';

// Patrimônio Pages
import {
  AtivosPage,
  DepreciacaoPage,
} from '@/pages/patrimonio';

// BI Pages
import {
  DashboardPage as BIDashboardPage,
  RelatoriosPage,
  IndicadoresPage,
} from '@/pages/bi';

// Suporte Pages
import {
  TicketsPage,
  BaseConhecimentoPage,
} from '@/pages/suporte';

// Loading component
function PageLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
    </div>
  );
}

// Página "Em Desenvolvimento"
function EmDesenvolvimento({ titulo }: { titulo: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{titulo}</h2>
      <p className="text-gray-500">Esta funcionalidade está em desenvolvimento.</p>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Suspense fallback={<PageLoading />}>
                <Routes>
                  {/* ========== DASHBOARD ========== */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />

                  {/* ========== COMERCIAL ========== */}
                  {/* Clientes */}
                  <Route path="/clientes" element={<ClientesPage />} />
                  <Route path="/clientes/novo" element={<ClienteFormPage />} />
                  <Route path="/clientes/:id" element={<ClienteFormPage />} />

                  {/* Produtos */}
                  <Route path="/produtos" element={<ProdutosPage />} />
                  <Route path="/produtos/novo" element={<ProdutoFormPage />} />
                  <Route path="/produtos/:id" element={<ProdutoFormPage />} />

                  {/* Orçamentos */}
                  <Route path="/orcamentos" element={<OrcamentosPage />} />
                  <Route path="/orcamentos/novo" element={<OrcamentoFormPage />} />
                  <Route path="/orcamentos/:id" element={<OrcamentoFormPage />} />

                  {/* Vendas */}
                  <Route path="/vendas" element={<VendasPage />} />
                  <Route path="/vendas/novo" element={<VendaFormPage />} />
                  <Route path="/vendas/:id" element={<VendaFormPage />} />

                  {/* Tabelas de Preço */}
                  <Route path="/tabelas-preco" element={<EmDesenvolvimento titulo="Tabelas de Preço" />} />

                  {/* ========== ESTOQUE ========== */}
                  <Route path="/estoque/saldos" element={<SaldosPage />} />
                  <Route path="/estoque/movimentacoes" element={<MovimentacoesPage />} />
                  <Route path="/estoque/transferencias" element={<TransferenciasPage />} />
                  <Route path="/estoque/inventario" element={<InventarioPage />} />

                  {/* ========== FISCAL ========== */}
                  <Route path="/fiscal/notas" element={<NotasPage />} />
                  <Route path="/fiscal/nfe/nova" element={<NotaFormPage />} />
                  <Route path="/fiscal/nfe/:id" element={<NotaFormPage />} />
                  <Route path="/fiscal/pdv" element={<NFCePage />} />
                  <Route path="/fiscal/nfse" element={<EmDesenvolvimento titulo="NFS-e (Serviços)" />} />
                  <Route path="/fiscal/cte" element={<EmDesenvolvimento titulo="CT-e / MDF-e" />} />
                  <Route path="/fiscal/sped" element={<EmDesenvolvimento titulo="SPED Fiscal" />} />
                  <Route path="/fiscal/configuracoes" element={<ConfigFiscalPage />} />

                  {/* ========== FINANCEIRO ========== */}
                  <Route path="/financeiro/receber" element={<ContasReceberPage />} />
                  <Route path="/financeiro/pagar" element={<ContasPagarPage />} />
                  <Route path="/financeiro/fluxo-caixa" element={<FluxoCaixaPage />} />
                  <Route path="/financeiro/boletos" element={<BoletosPage />} />
                  <Route path="/financeiro/conciliacao" element={<ConciliacaoPage />} />
                  <Route path="/financeiro/contas" element={<EmDesenvolvimento titulo="Contas Bancárias" />} />

                  {/* ========== COMPRAS ========== */}
                  <Route path="/fornecedores" element={<FornecedoresPage />} />
                  <Route path="/compras/cotacoes" element={<CotacoesPage />} />
                  <Route path="/compras/pedidos" element={<PedidosCompraPage />} />

                  {/* ========== LOGÍSTICA ========== */}
                  <Route path="/logistica/entregas" element={<EntregasPage />} />
                  <Route path="/logistica/rotas" element={<RotasPage />} />
                  <Route path="/logistica/rastreamento" element={<RastreioPage />} />

                  {/* ========== CRM ========== */}
                  <Route path="/crm" element={<CRMDashboardPage />} />
                  <Route path="/crm/pipeline" element={<PipelinePage />} />
                  <Route path="/crm/leads" element={<LeadsPage />} />
                  <Route path="/crm/oportunidades" element={<OportunidadesPage />} />
                  <Route path="/crm/atividades" element={<AtividadesPage />} />

                  {/* ========== E-COMMERCE ========== */}
                  <Route path="/ecommerce/config" element={<EmDesenvolvimento titulo="Configurar Loja" />} />
                  <Route path="/ecommerce/produtos" element={<ProdutosOnlinePage />} />
                  <Route path="/ecommerce/pedidos" element={<PedidosOnlinePage />} />
                  <Route path="/ecommerce/banners" element={<EmDesenvolvimento titulo="Banners" />} />
                  <Route path="/ecommerce/cupons" element={<EmDesenvolvimento titulo="Cupons" />} />
                  <Route path="/ecommerce/integracoes" element={<IntegracaoPage />} />

                  {/* ========== CONTÁBIL ========== */}
                  <Route path="/contabil/plano-contas" element={<PlanoContasPage />} />
                  <Route path="/contabil/lancamentos" element={<LancamentosPage />} />
                  <Route path="/contabil/fechamento" element={<EmDesenvolvimento titulo="Fechamento Contábil" />} />
                  <Route path="/contabil/dre" element={<DREPage />} />
                  <Route path="/contabil/balanco" element={<BalancoPage />} />

                  {/* ========== RH ========== */}
                  <Route path="/rh/colaboradores" element={<FuncionariosPage />} />
                  <Route path="/rh/folha" element={<FolhaPage />} />
                  <Route path="/rh/ponto" element={<PontoPage />} />
                  <Route path="/rh/ferias" element={<EmDesenvolvimento titulo="Férias" />} />

                  {/* ========== PATRIMÔNIO ========== */}
                  <Route path="/patrimonio/bens" element={<AtivosPage />} />
                  <Route path="/patrimonio/depreciacao" element={<DepreciacaoPage />} />
                  <Route path="/patrimonio/manutencao" element={<EmDesenvolvimento titulo="Manutenção" />} />

                  {/* ========== BI & RELATÓRIOS ========== */}
                  <Route path="/bi/dashboards" element={<BIDashboardPage />} />
                  <Route path="/bi/relatorios" element={<RelatoriosPage />} />
                  <Route path="/bi/indicadores" element={<IndicadoresPage />} />

                  {/* ========== SUPORTE ========== */}
                  <Route path="/suporte/tickets" element={<TicketsPage />} />
                  <Route path="/suporte/base" element={<BaseConhecimentoPage />} />

                  {/* ========== ADMINISTRAÇÃO ========== */}
                  <Route path="/empresas" element={<EmpresasPage />} />
                  <Route path="/empresas/novo" element={<EmpresaFormPage />} />
                  <Route path="/empresas/:id" element={<EmpresaFormPage />} />
                  <Route path="/filiais" element={<FiliaisPage />} />
                  <Route path="/usuarios" element={<UsuariosPage />} />
                  <Route path="/usuarios/novo" element={<UsuarioFormPage />} />
                  <Route path="/usuarios/:id" element={<UsuarioFormPage />} />
                  <Route path="/perfis" element={<PerfisPage />} />
                  <Route path="/configuracoes" element={<ConfiguracoesPage />} />

                  {/* Catch all */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
