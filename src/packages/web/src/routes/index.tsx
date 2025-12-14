// =============================================
// PLANAC ERP - Routes
// =============================================

import React from 'react';
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
} from '@/pages/comercial';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

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
              <Routes>
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

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
