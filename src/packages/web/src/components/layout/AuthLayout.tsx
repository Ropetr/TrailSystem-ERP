// =============================================
// PLANAC ERP - Auth Layout (Login, etc)
// =============================================

import React from 'react';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-planac-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <span className="font-bold text-3xl text-gray-900">PLANAC</span>
          </div>
          <p className="mt-2 text-gray-500">Sistema de Gestão Empresarial</p>
        </div>

        {/* Content */}
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
