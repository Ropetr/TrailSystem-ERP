// =============================================
// PLANAC ERP - Routes
// =============================================

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/stores/auth.store';

// Layouts
import { MainLayout, AuthLayout } from '@/components/layout';

// Pages - Auth
import { LoginPage } from '@/pages/auth/LoginPage';

// Pages - Core
import { DashboardPage } from '@/pages/core/DashboardPage';
import { EmpresasPage } from '@/pages/core/EmpresasPage';
import { UsuariosPage } from '@/pages/core/UsuariosPage';

// Protected Route Wrapper
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Wrapper (redirect if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full"></div>
      </div>
    );
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
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
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
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/empresas" element={<EmpresasPage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
        
        {/* Placeholder routes */}
        <Route path="/perfis" element={<PlaceholderPage title="Perfis de Acesso" />} />
        <Route path="/configuracoes" element={<PlaceholderPage title="Configurações" />} />
      </Route>

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// Placeholder for pages not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
      <p className="text-gray-500">Esta página está em desenvolvimento.</p>
    </div>
  );
}

// 404 Page
function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-xl text-gray-500 mt-4">Página não encontrada</p>
      <a href="/dashboard" className="mt-6 text-red-500 hover:text-red-600">
        Voltar para o início
      </a>
    </div>
  );
}

export default AppRoutes;
