// =============================================
// PLANAC ERP - Header
// Com suporte a tema claro/escuro
// =============================================

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../ui/Icons';
import { useAuth } from '@/stores/auth.store';
import { useTheme } from '@/stores/theme.store';

// Ícones de tema
const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { usuario, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 transition-colors">
      {/* Menu mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Icons.menu className="w-6 h-6" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={resolvedTheme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* User Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 bg-planac-100 dark:bg-planac-900 rounded-full flex items-center justify-center">
              {usuario?.avatar_url ? (
                <img src={usuario.avatar_url} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <Icons.user className="w-5 h-5 text-planac-600 dark:text-planac-400" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{usuario?.nome}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{usuario?.email}</p>
            </div>
            <Icons.chevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 z-50 animate-fade-in">
              <button
                onClick={() => { navigate('/configuracoes'); setIsProfileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Icons.settings className="w-5 h-5" />
                <span>Configurações</span>
              </button>
              <div className="border-t border-gray-100 dark:border-gray-700 my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Icons.logout className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
