// =============================================
// PLANAC ERP - Routes
// =============================================

import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/core/DashboardPage';
import { EmpresasPage } from '@/pages/core/EmpresasPage';
import { UsuariosPage } from '@/pages/core/UsuariosPage';

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('planac_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// Public Route Wrapper (redirect if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('planac_token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  // Auth Routes
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
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'empresas', element: <EmpresasPage /> },
      { path: 'empresas/:id', element: <div>Empresa Form (TODO)</div> },
      { path: 'filiais', element: <div>Filiais (TODO)</div> },
      { path: 'usuarios', element: <UsuariosPage /> },
      { path: 'usuarios/:id', element: <div>Usuário Form (TODO)</div> },
      { path: 'perfis', element: <div>Perfis (TODO)</div> },
      { path: 'configuracoes', element: <div>Configurações (TODO)</div> },
    ],
  },

  // 404
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export default router;
