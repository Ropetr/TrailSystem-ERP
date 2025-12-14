// =============================================
// PLANAC ERP - Routes (ATUALIZADO)
// =============================================

import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';

// Core Pages
import { DashboardPage } from '@/pages/core/DashboardPage';
import { EmpresasPage } from '@/pages/core/EmpresasPage';
import { EmpresaFormPage } from '@/pages/core/EmpresaFormPage';
import { FiliaisPage } from '@/pages/core/FiliaisPage';
import { UsuariosPage } from '@/pages/core/UsuariosPage';
import { UsuarioFormPage } from '@/pages/core/UsuarioFormPage';
import { PerfisPage } from '@/pages/core/PerfisPage';
import { ConfiguracoesPage } from '@/pages/core/ConfiguracoesPage';

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('planac_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// Public Route Wrapper
function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('planac_token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  // Auth Routes (Public)
  {
    path: '/',
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'recuperar-senha', element: <div>Recuperar Senha (TODO)</div> },
    ],
  },

  // Protected Routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      // Dashboard
      { path: 'dashboard', element: <DashboardPage /> },
      
      // Empresas
      { path: 'empresas', element: <EmpresasPage /> },
      { path: 'empresas/novo', element: <EmpresaFormPage /> },
      { path: 'empresas/:id', element: <EmpresaFormPage /> },
      
      // Filiais
      { path: 'filiais', element: <FiliaisPage /> },
      
      // Usuários
      { path: 'usuarios', element: <UsuariosPage /> },
      { path: 'usuarios/novo', element: <UsuarioFormPage /> },
      { path: 'usuarios/:id', element: <UsuarioFormPage /> },
      
      // Perfis
      { path: 'perfis', element: <PerfisPage /> },
      
      // Configurações
      { path: 'configuracoes', element: <ConfiguracoesPage /> },
    ],
  },

  // 404
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export default router;
