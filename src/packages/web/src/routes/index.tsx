// =============================================
// TRAILSYSTEM ERP - Routes Completas
// Atualizado: 26/12/2025 - Rotas hierárquicas Módulo > Categoria > Item
// =============================================

import React from 'react';
import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/stores/auth.store';

// Layouts
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Auth Pages
import {
  LoginPage,
  CadastroPage,
  VerificarEmailPage,
  EsqueciSenhaPage,
  RedefinirSenhaPage,
} from '@/pages/auth';

// Core Pages
import {
  DashboardPage,
  EmpresasPage,
  EmpresaFormPage,
  FiliaisPage,
  InscricoesEstaduaisPage,
  UsuariosPage,
  UsuarioFormPage,
  PerfisPage,
  ConfiguracoesPage,
} from '@/pages/core';

// Comercial Pages (ClienteFormPage removido - agora usa Modal Popup)
import {
  ClientesPage,
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

// Cadastros Pages
import {
  CategoriasPage,
  MarcasPage,
  UnidadesPage,
  TabelasPrecosPage,
  CondicoesPagamentoPage,
  VendedoresPage,
  ContasBancariasPage,
  ContaBancariaFormPage,
  TransportadorasPage,
  VeiculosPage,
  CentrosCustoPage,
} from '@/pages/cadastros';

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

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin';
import { ClientesListPage } from '@/pages/admin/clientes/ClientesListPage';
import { ClienteNovoPage } from '@/pages/admin/clientes/ClienteNovoPage';
import { ClienteDetalhePage } from '@/pages/admin/clientes/ClienteDetalhePage';
import { ModulosPage } from '@/pages/admin/catalogo/ModulosPage';
import { PlanosPage } from '@/pages/admin/catalogo/PlanosPage';
import { AssinaturasPage } from '@/pages/admin/billing/AssinaturasPage';
import { TicketsPage as AdminTicketsPage } from '@/pages/admin/suporte/TicketsPage';
import { AtivacoesPage } from '@/pages/admin/licenciamento/AtivacoesPage';
import { SaudePage } from '@/pages/admin/monitoramento/SaudePage';
import { LogsPage } from '@/pages/admin/auditoria/LogsPage';
import { GeralPage as AdminGeralPage } from '@/pages/admin/configuracoes/GeralPage';
import { TagsPage } from '@/pages/admin/configuracoes/TagsPage';

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

// Helper function to determine default path based on user type
function getDefaultAppPath(usuario: { email?: string } | null): string {
  if (usuario?.email === 'admin@trailsystem.com.br') {
    return '/admin';
  }
  return '/dashboard';
}

// Public Route Component (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, usuario } = useAuth();

  if (isLoading) {
    return <PageLoading />;
  }

  if (isAuthenticated) {
    const defaultPath = getDefaultAppPath(usuario);
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* ========== AUTH ROUTES (Public) ========== */}
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
      
      <Route
        path="/cadastro"
        element={
          <PublicRoute>
            <AuthLayout>
              <CadastroPage />
            </AuthLayout>
          </PublicRoute>
        }
      />
      
      <Route
        path="/verificar-email"
        element={
          <AuthLayout>
            <VerificarEmailPage />
          </AuthLayout>
        }
      />
      
      <Route
        path="/esqueci-senha"
        element={
          <PublicRoute>
            <AuthLayout>
              <EsqueciSenhaPage />
            </AuthLayout>
          </PublicRoute>
        }
      />
      
      <Route
        path="/redefinir-senha"
        element={
          <AuthLayout>
            <RedefinirSenhaPage />
          </AuthLayout>
        }
      />

      {/* ========== ADMIN ROUTES (Protected - Softwarehouse) ========== */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<PageLoading />}>
                <Routes>
                  <Route path="/" element={<AdminDashboardPage />} />
                  
                  {/* Clientes/Tenants */}
                  <Route path="/clientes" element={<ClientesListPage />} />
                  <Route path="/clientes/novo" element={<ClienteNovoPage />} />
                  <Route path="/clientes/:id" element={<ClienteDetalhePage />} />
                  
                  {/* Catálogo */}
                  <Route path="/catalogo/modulos" element={<ModulosPage />} />
                  <Route path="/catalogo/planos" element={<PlanosPage />} />
                  <Route path="/catalogo/addons" element={<EmDesenvolvimento titulo="Add-ons" />} />
                  
                  {/* Billing */}
                  <Route path="/billing/assinaturas" element={<AssinaturasPage />} />
                  <Route path="/billing/faturas" element={<EmDesenvolvimento titulo="Faturas" />} />
                  <Route path="/billing/pagamentos" element={<EmDesenvolvimento titulo="Pagamentos" />} />
                  
                  {/* Licenciamento */}
                  <Route path="/licenciamento/ativacoes" element={<AtivacoesPage />} />
                  <Route path="/licenciamento/provisionamento" element={<EmDesenvolvimento titulo="Provisionamento" />} />
                  
                  {/* Parametrizações */}
                  <Route path="/parametrizacoes/templates" element={<EmDesenvolvimento titulo="Templates" />} />
                  <Route path="/parametrizacoes/overrides" element={<EmDesenvolvimento titulo="Overrides" />} />
                  
                  {/* Segurança */}
                  <Route path="/seguranca/usuarios" element={<EmDesenvolvimento titulo="Usuários Admin" />} />
                  <Route path="/seguranca/papeis" element={<EmDesenvolvimento titulo="Papéis" />} />
                  <Route path="/seguranca/sessoes" element={<EmDesenvolvimento titulo="Sessões" />} />
                  
                  {/* Integrações */}
                  <Route path="/integracoes/gateways" element={<EmDesenvolvimento titulo="Gateways" />} />
                  <Route path="/integracoes/credenciais" element={<EmDesenvolvimento titulo="Credenciais" />} />
                  <Route path="/integracoes/webhooks" element={<EmDesenvolvimento titulo="Webhooks" />} />
                  
                  {/* Suporte */}
                  <Route path="/suporte/tickets" element={<AdminTicketsPage />} />
                  <Route path="/suporte/playbooks" element={<EmDesenvolvimento titulo="Playbooks" />} />
                  <Route path="/suporte/ferramentas" element={<EmDesenvolvimento titulo="Ferramentas" />} />
                  
                  {/* Monitoramento */}
                  <Route path="/monitoramento/saude" element={<SaudePage />} />
                  <Route path="/monitoramento/uso" element={<EmDesenvolvimento titulo="Uso por Cliente" />} />
                  <Route path="/monitoramento/alertas" element={<EmDesenvolvimento titulo="Alertas" />} />
                  
                  {/* Comunicação */}
                  <Route path="/comunicacao/notificacoes" element={<EmDesenvolvimento titulo="Notificações" />} />
                  <Route path="/comunicacao/releases" element={<EmDesenvolvimento titulo="Release Notes" />} />
                  
                  {/* Relatórios */}
                  <Route path="/relatorios/mrr" element={<EmDesenvolvimento titulo="MRR/ARR" />} />
                  <Route path="/relatorios/churn" element={<EmDesenvolvimento titulo="Churn" />} />
                  <Route path="/relatorios/inadimplencia" element={<EmDesenvolvimento titulo="Inadimplência" />} />
                  
                  {/* Auditoria */}
                  <Route path="/auditoria/logs" element={<LogsPage />} />
                  <Route path="/auditoria/lgpd" element={<EmDesenvolvimento titulo="LGPD" />} />
                  
                  {/* Configurações */}
                  <Route path="/configuracoes/geral" element={<AdminGeralPage />} />
                  <Route path="/configuracoes/politicas" element={<EmDesenvolvimento titulo="Políticas" />} />
                  <Route path="/configuracoes/versoes" element={<EmDesenvolvimento titulo="Versões" />} />
                  
                  {/* Catch all - redireciona para dashboard admin */}
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* ========== PROTECTED ROUTES (ERP - User View) ========== */}
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
                  
                  {/* --- Clientes (Modal Popup - sem página de formulário separada) --- */}
                  <Route path="/cadastros/entidades/clientes" element={<ClientesPage />} />
                  
                  <Route path="/cadastros/entidades/fornecedores" element={<FornecedoresPage />} />
                  <Route path="/cadastros/entidades/fornecedores/novo" element={<FornecedorFormPage />} />
                  <Route path="/cadastros/entidades/fornecedores/:id" element={<FornecedorFormPage />} />
                  
                                    <Route path="/cadastros/entidades/transportadoras" element={<TransportadorasPage />} />
                  
                  <Route path="/cadastros/entidades/colaboradores" element={<FuncionariosPage />} />
                  <Route path="/cadastros/entidades/colaboradores/novo" element={<EmDesenvolvimento titulo="Novo Colaborador" />} />
                  <Route path="/cadastros/entidades/colaboradores/:id" element={<EmDesenvolvimento titulo="Editar Colaborador" />} />
                  
                  <Route path="/cadastros/entidades/parceiros" element={<EmDesenvolvimento titulo="Parceiros de Negócio" />} />
                  <Route path="/cadastros/entidades/parceiros/novo" element={<EmDesenvolvimento titulo="Novo Parceiro" />} />
                  <Route path="/cadastros/entidades/parceiros/:id" element={<EmDesenvolvimento titulo="Editar Parceiro" />} />

                  {/* --- Produtos --- */}
                  <Route path="/cadastros/produtos/lista" element={<ProdutosPage />} />
                  <Route path="/cadastros/produtos/novo" element={<ProdutoFormPage />} />
                  <Route path="/cadastros/produtos/:id" element={<ProdutoFormPage />} />

                  {/* --- Empresa --- */}
                  <Route path="/cadastros/empresa/filiais" element={<EmpresasPage />} />
                  <Route path="/cadastros/empresa/filiais/novo" element={<EmpresaFormPage />} />
                  <Route path="/cadastros/empresa/filiais/:id" element={<EmpresaFormPage />} />
                  <Route path="/cadastros/empresa/filiais/:filialId/inscricoes-estaduais" element={<InscricoesEstaduaisPage />} />

                  {/* --- Financeiro (Cadastros) --- */}
                                    <Route path="/cadastros/financeiro/contas-bancarias" element={<ContasBancariasPage />} />
                                    <Route path="/cadastros/financeiro/contas-bancarias/novo" element={<ContaBancariaFormPage />} />
                                    <Route path="/cadastros/financeiro/contas-bancarias/:id" element={<ContaBancariaFormPage />} />
                  
                  <Route path="/cadastros/financeiro/plano-contas" element={<PlanoContasPage />} />
                  
                                    <Route path="/cadastros/financeiro/centros-custo" element={<CentrosCustoPage />} />
                  
                  <Route path="/cadastros/financeiro/condicoes-pagamento" element={<CondicoesPagamentoPage />} />

                  {/* --- Comercial (Cadastros) --- */}
                  <Route path="/cadastros/comercial/tabelas-preco" element={<TabelasPrecosPage />} />
                  <Route path="/cadastros/comercial/categorias" element={<CategoriasPage />} />
                  <Route path="/cadastros/comercial/marcas" element={<MarcasPage />} />
                  <Route path="/cadastros/comercial/unidades" element={<UnidadesPage />} />
                  <Route path="/cadastros/comercial/vendedores" element={<VendedoresPage />} />

                  {/* --- Patrimônio (Cadastros) --- */}
                                    <Route path="/cadastros/patrimonio/veiculos" element={<VeiculosPage />} />
                  
                  <Route path="/cadastros/patrimonio/bens" element={<AtivosPage />} />
                  <Route path="/cadastros/patrimonio/bens/novo" element={<EmDesenvolvimento titulo="Novo Bem" />} />
                  <Route path="/cadastros/patrimonio/bens/:id" element={<EmDesenvolvimento titulo="Editar Bem" />} />

                  {/* --- Acessos (Cadastros) --- */}
                  <Route path="/cadastros/acessos/usuarios" element={<UsuariosPage />} />
                  <Route path="/cadastros/acessos/usuarios/novo" element={<UsuarioFormPage />} />
                  <Route path="/cadastros/acessos/usuarios/:id" element={<UsuarioFormPage />} />
                  
                  <Route path="/cadastros/acessos/perfis" element={<PerfisPage />} />
                  <Route path="/cadastros/acessos/perfis/novo" element={<EmDesenvolvimento titulo="Novo Perfil" />} />
                  <Route path="/cadastros/acessos/perfis/:id" element={<EmDesenvolvimento titulo="Editar Perfil" />} />

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
                  <Route path="/configuracoes/tags" element={<TagsPage />} />

                  {/* ========== REDIRECTS LEGADOS ========== */}
                  {/* Mantém compatibilidade com URLs antigas */}
                  <Route path="/clientes" element={<Navigate to="/cadastros/entidades/clientes" replace />} />
                  <Route path="/clientes/*" element={<Navigate to="/cadastros/entidades/clientes" replace />} />
                  <Route path="/fornecedores" element={<Navigate to="/cadastros/entidades/fornecedores" replace />} />
                  <Route path="/produtos" element={<Navigate to="/cadastros/produtos/lista" replace />} />
                  <Route path="/produtos/*" element={<Navigate to="/cadastros/produtos/lista" replace />} />
                  <Route path="/empresas" element={<Navigate to="/cadastros/empresa/filiais" replace />} />
                  <Route path="/empresas/*" element={<Navigate to="/cadastros/empresa/filiais" replace />} />
                  <Route path="/usuarios" element={<Navigate to="/cadastros/acessos/usuarios" replace />} />
                  <Route path="/cadastros/acessos/usuarios" element={<Navigate to="/cadastros/acessos/usuarios" replace />} />
                  <Route path="/cadastros/acessos/perfis" element={<Navigate to="/cadastros/acessos/perfis" replace />} />
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
