// =============================================
// PLANAC ERP - Routes Completas
// Atualizado: 15/12/2025 - Rotas alinhadas com Sidebar
// =============================================

import React, { Suspense } from 'react';
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
  ContaReceberFormPage,
  ContasPagarPage,
  ContaPagarFormPage,
  FluxoCaixaPage,
  BoletosPage,
  ConciliacaoPage,
} from '@/pages/financeiro';

// Compras Pages
import {
  FornecedoresPage,
  FornecedorFormPage,
  CotacoesPage,
  CotacaoFormPage,
  PedidosCompraPage,
  PedidoCompraFormPage,
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
      <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{titulo}</h2>
      <p className="text-gray-500 dark:text-gray-400">Esta funcionalidade está em desenvolvimento.</p>
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

                  {/* ========================================== */}
                  {/* CADASTROS - Módulo Central de Dados Base   */}
                  {/* ========================================== */}
                  
                  {/* --- Entidades --- */}
                  <Route path="/cadastros/clientes" element={<ClientesPage />} />
                  <Route path="/cadastros/clientes/novo" element={<ClienteFormPage />} />
                  <Route path="/cadastros/clientes/:id" element={<ClienteFormPage />} />
                  
                  <Route path="/cadastros/fornecedores" element={<FornecedoresPage />} />
                  <Route path="/cadastros/fornecedores/novo" element={<FornecedorFormPage />} />
                  <Route path="/cadastros/fornecedores/:id" element={<FornecedorFormPage />} />
                  
                  <Route path="/cadastros/transportadoras" element={<EmDesenvolvimento titulo="Transportadoras" />} />
                  <Route path="/cadastros/transportadoras/novo" element={<EmDesenvolvimento titulo="Nova Transportadora" />} />
                  <Route path="/cadastros/transportadoras/:id" element={<EmDesenvolvimento titulo="Editar Transportadora" />} />
                  
                  <Route path="/cadastros/colaboradores" element={<FuncionariosPage />} />
                  <Route path="/cadastros/colaboradores/novo" element={<EmDesenvolvimento titulo="Novo Colaborador" />} />
                  <Route path="/cadastros/colaboradores/:id" element={<EmDesenvolvimento titulo="Editar Colaborador" />} />
                  
                  <Route path="/cadastros/parceiros" element={<EmDesenvolvimento titulo="Parceiros de Negócio" />} />
                  <Route path="/cadastros/parceiros/novo" element={<EmDesenvolvimento titulo="Novo Parceiro" />} />
                  <Route path="/cadastros/parceiros/:id" element={<EmDesenvolvimento titulo="Editar Parceiro" />} />

                  {/* --- Produtos --- */}
                  <Route path="/cadastros/produtos" element={<ProdutosPage />} />
                  <Route path="/cadastros/produtos/novo" element={<ProdutoFormPage />} />
                  <Route path="/cadastros/produtos/:id" element={<ProdutoFormPage />} />

                  {/* --- Empresa --- */}
                  <Route path="/cadastros/empresas" element={<EmpresasPage />} />
                  <Route path="/cadastros/empresas/novo" element={<EmpresaFormPage />} />
                  <Route path="/cadastros/empresas/:id" element={<EmpresaFormPage />} />

                  {/* --- Financeiro (Cadastros) --- */}
                  <Route path="/cadastros/contas-bancarias" element={<EmDesenvolvimento titulo="Contas Bancárias" />} />
                  <Route path="/cadastros/contas-bancarias/novo" element={<EmDesenvolvimento titulo="Nova Conta Bancária" />} />
                  <Route path="/cadastros/contas-bancarias/:id" element={<EmDesenvolvimento titulo="Editar Conta Bancária" />} />
                  
                  <Route path="/cadastros/plano-contas" element={<PlanoContasPage />} />
                  
                  <Route path="/cadastros/centros-custo" element={<EmDesenvolvimento titulo="Centros de Custo" />} />
                  <Route path="/cadastros/centros-custo/novo" element={<EmDesenvolvimento titulo="Novo Centro de Custo" />} />
                  <Route path="/cadastros/centros-custo/:id" element={<EmDesenvolvimento titulo="Editar Centro de Custo" />} />
                  
                  <Route path="/cadastros/condicoes-pagamento" element={<EmDesenvolvimento titulo="Condições de Pagamento" />} />
                  <Route path="/cadastros/condicoes-pagamento/novo" element={<EmDesenvolvimento titulo="Nova Condição" />} />
                  <Route path="/cadastros/condicoes-pagamento/:id" element={<EmDesenvolvimento titulo="Editar Condição" />} />

                  {/* --- Comercial (Cadastros) --- */}
                  <Route path="/cadastros/tabelas-preco" element={<EmDesenvolvimento titulo="Tabelas de Preço" />} />
                  <Route path="/cadastros/tabelas-preco/novo" element={<EmDesenvolvimento titulo="Nova Tabela" />} />
                  <Route path="/cadastros/tabelas-preco/:id" element={<EmDesenvolvimento titulo="Editar Tabela" />} />

                  {/* --- Patrimônio (Cadastros) --- */}
                  <Route path="/cadastros/veiculos" element={<EmDesenvolvimento titulo="Veículos" />} />
                  <Route path="/cadastros/veiculos/novo" element={<EmDesenvolvimento titulo="Novo Veículo" />} />
                  <Route path="/cadastros/veiculos/:id" element={<EmDesenvolvimento titulo="Editar Veículo" />} />
                  
                  <Route path="/cadastros/bens" element={<AtivosPage />} />
                  <Route path="/cadastros/bens/novo" element={<EmDesenvolvimento titulo="Novo Bem" />} />
                  <Route path="/cadastros/bens/:id" element={<EmDesenvolvimento titulo="Editar Bem" />} />

                  {/* --- Acessos (Cadastros) --- */}
                  <Route path="/cadastros/usuarios" element={<UsuariosPage />} />
                  <Route path="/cadastros/usuarios/novo" element={<UsuarioFormPage />} />
                  <Route path="/cadastros/usuarios/:id" element={<UsuarioFormPage />} />
                  
                  <Route path="/cadastros/perfis" element={<PerfisPage />} />
                  <Route path="/cadastros/perfis/novo" element={<EmDesenvolvimento titulo="Novo Perfil" />} />
                  <Route path="/cadastros/perfis/:id" element={<EmDesenvolvimento titulo="Editar Perfil" />} />

                  {/* ========== COMERCIAL ========== */}
                  <Route path="/comercial/orcamentos" element={<OrcamentosPage />} />
                  <Route path="/comercial/orcamentos/novo" element={<OrcamentoFormPage />} />
                  <Route path="/comercial/orcamentos/:id" element={<OrcamentoFormPage />} />
                  
                  <Route path="/comercial/vendas" element={<VendasPage />} />
                  <Route path="/comercial/vendas/novo" element={<VendaFormPage />} />
                  <Route path="/comercial/vendas/:id" element={<VendaFormPage />} />

                  {/* ========== ESTOQUE ========== */}
                  <Route path="/estoque/saldos" element={<SaldosPage />} />
                  <Route path="/estoque/movimentacoes" element={<MovimentacoesPage />} />
                  <Route path="/estoque/movimentacoes/novo" element={<EmDesenvolvimento titulo="Nova Movimentação" />} />
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

                  {/* ========== FINANCEIRO ========== */}
                  <Route path="/financeiro/receber" element={<ContasReceberPage />} />
                  <Route path="/financeiro/receber/novo" element={<ContaReceberFormPage />} />
                  <Route path="/financeiro/receber/:id" element={<ContaReceberFormPage />} />
                  <Route path="/financeiro/pagar" element={<ContasPagarPage />} />
                  <Route path="/financeiro/pagar/novo" element={<ContaPagarFormPage />} />
                  <Route path="/financeiro/pagar/:id" element={<ContaPagarFormPage />} />
                  <Route path="/financeiro/fluxo-caixa" element={<FluxoCaixaPage />} />
                  <Route path="/financeiro/boletos" element={<BoletosPage />} />
                  <Route path="/financeiro/conciliacao" element={<ConciliacaoPage />} />

                  {/* ========== COMPRAS ========== */}
                  <Route path="/compras/cotacoes" element={<CotacoesPage />} />
                  <Route path="/compras/cotacoes/nova" element={<CotacaoFormPage />} />
                  <Route path="/compras/cotacoes/:id" element={<CotacaoFormPage />} />
                  <Route path="/compras/pedidos" element={<PedidosCompraPage />} />
                  <Route path="/compras/pedidos/novo" element={<PedidoCompraFormPage />} />
                  <Route path="/compras/pedidos/:id" element={<PedidoCompraFormPage />} />

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

                  {/* ========== CONTÁBIL ========== */}
                  <Route path="/contabil/lancamentos" element={<LancamentosPage />} />
                  <Route path="/contabil/fechamento" element={<EmDesenvolvimento titulo="Fechamento Contábil" />} />
                  <Route path="/contabil/dre" element={<DREPage />} />
                  <Route path="/contabil/balanco" element={<BalancoPage />} />

                  {/* ========== RH ========== */}
                  <Route path="/rh/folha" element={<FolhaPage />} />
                  <Route path="/rh/ponto" element={<PontoPage />} />
                  <Route path="/rh/ferias" element={<EmDesenvolvimento titulo="Férias" />} />

                  {/* ========== PATRIMÔNIO ========== */}
                  <Route path="/patrimonio/depreciacao" element={<DepreciacaoPage />} />
                  <Route path="/patrimonio/manutencao" element={<EmDesenvolvimento titulo="Manutenção" />} />

                  {/* ========== BI & RELATÓRIOS ========== */}
                  <Route path="/bi/dashboards" element={<BIDashboardPage />} />
                  <Route path="/bi/relatorios" element={<RelatoriosPage />} />
                  <Route path="/bi/indicadores" element={<IndicadoresPage />} />

                  {/* ========== SUPORTE ========== */}
                  <Route path="/suporte/tickets" element={<TicketsPage />} />
                  <Route path="/suporte/base" element={<BaseConhecimentoPage />} />

                  {/* ========== CONFIGURAÇÕES ========== */}
                  <Route path="/configuracoes/geral" element={<ConfiguracoesPage />} />
                  <Route path="/configuracoes/fiscal" element={<ConfigFiscalPage />} />
                  <Route path="/configuracoes/impostos" element={<EmDesenvolvimento titulo="Configuração de Impostos" />} />
                  <Route path="/configuracoes/comercial" element={<EmDesenvolvimento titulo="Configurações Comerciais" />} />
                  <Route path="/configuracoes/email" element={<EmDesenvolvimento titulo="Configurações de E-mail" />} />
                  <Route path="/configuracoes/integracoes" element={<IntegracaoPage />} />

                  {/* ========== REDIRECTS LEGADOS ========== */}
                  {/* Mantém compatibilidade com URLs antigas */}
                  <Route path="/clientes" element={<Navigate to="/cadastros/clientes" replace />} />
                  <Route path="/clientes/*" element={<Navigate to="/cadastros/clientes" replace />} />
                  <Route path="/fornecedores" element={<Navigate to="/cadastros/fornecedores" replace />} />
                  <Route path="/produtos" element={<Navigate to="/cadastros/produtos" replace />} />
                  <Route path="/produtos/*" element={<Navigate to="/cadastros/produtos" replace />} />
                  <Route path="/empresas" element={<Navigate to="/cadastros/empresas" replace />} />
                  <Route path="/empresas/*" element={<Navigate to="/cadastros/empresas" replace />} />
                  <Route path="/usuarios" element={<Navigate to="/cadastros/usuarios" replace />} />
                  <Route path="/usuarios/*" element={<Navigate to="/cadastros/usuarios" replace />} />
                  <Route path="/perfis" element={<Navigate to="/cadastros/perfis" replace />} />
                  <Route path="/orcamentos" element={<Navigate to="/comercial/orcamentos" replace />} />
                  <Route path="/orcamentos/*" element={<Navigate to="/comercial/orcamentos" replace />} />
                  <Route path="/vendas" element={<Navigate to="/comercial/vendas" replace />} />
                  <Route path="/vendas/*" element={<Navigate to="/comercial/vendas" replace />} />
                  <Route path="/configuracoes" element={<Navigate to="/configuracoes/geral" replace />} />

                  {/* Catch all - redireciona para dashboard */}
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
