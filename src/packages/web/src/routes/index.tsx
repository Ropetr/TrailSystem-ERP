// =============================================
// PLANAC ERP - Routes Configuration
// =============================================

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

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
  VendasPage,
} from '@/pages/comercial';

// Auth Guard
import { useAuthStore } from '@/stores/auth.store';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected Routes */}
      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Core - Empresas */}
        <Route path="/empresas" element={<EmpresasPage />} />
        <Route path="/empresas/novo" element={<EmpresaFormPage />} />
        <Route path="/empresas/:id" element={<EmpresaFormPage />} />

        {/* Core - Filiais */}
        <Route path="/filiais" element={<FiliaisPage />} />

        {/* Core - Usuários */}
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/usuarios/novo" element={<UsuarioFormPage />} />
        <Route path="/usuarios/:id" element={<UsuarioFormPage />} />

        {/* Core - Perfis */}
        <Route path="/perfis" element={<PerfisPage />} />

        {/* Core - Configurações */}
        <Route path="/configuracoes" element={<ConfiguracoesPage />} />

        {/* Comercial - Clientes */}
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/clientes/novo" element={<ClienteFormPage />} />
        <Route path="/clientes/:id" element={<ClienteFormPage />} />

        {/* Comercial - Produtos */}
        <Route path="/produtos" element={<ProdutosPage />} />
        <Route path="/produtos/novo" element={<ProdutoFormPage />} />
        <Route path="/produtos/:id" element={<ProdutoFormPage />} />

        {/* Comercial - Orçamentos */}
        <Route path="/orcamentos" element={<OrcamentosPage />} />
        <Route path="/orcamentos/novo" element={<OrcamentosPage />} />
        <Route path="/orcamentos/:id" element={<OrcamentosPage />} />

        {/* Comercial - Vendas */}
        <Route path="/vendas" element={<VendasPage />} />
        <Route path="/vendas/novo" element={<VendasPage />} />
        <Route path="/vendas/:id" element={<VendasPage />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
