// =============================================
// PLANAC ERP - Sidebar
// =============================================

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icons } from '../ui/Icons';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: { label: string; path: string }[];
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: <Icons.home className="w-5 h-5" />, path: '/dashboard' },
  { label: 'Empresas', icon: <Icons.building className="w-5 h-5" />, path: '/empresas' },
  { label: 'Filiais', icon: <Icons.building className="w-5 h-5" />, path: '/filiais' },
  { label: 'Usuários', icon: <Icons.users className="w-5 h-5" />, path: '/usuarios' },
  { label: 'Perfis', icon: <Icons.lock className="w-5 h-5" />, path: '/perfis' },
  { label: 'Configurações', icon: <Icons.settings className="w-5 h-5" />, path: '/configuracoes' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-planac-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="font-bold text-xl text-gray-900">PLANAC</span>
          </div>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-planac-50 text-planac-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
