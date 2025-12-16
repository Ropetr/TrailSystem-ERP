// =============================================
// PLANAC ERP - Main Layout
// Cores iOS/Samsung Dark Mode (preto puro)
// =============================================

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface MainLayoutProps {
  children?: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-50 dark:bg-black flex overflow-hidden transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
