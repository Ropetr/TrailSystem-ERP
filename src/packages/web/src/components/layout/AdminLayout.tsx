// =============================================
// TRAILSYSTEM ERP - Admin Layout (Softwarehouse)
// Layout separado para o painel de administração
// =============================================

import React from 'react';
import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { Header } from './Header';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-50 dark:bg-black flex overflow-hidden transition-colors">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
