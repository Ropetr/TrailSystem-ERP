// =============================================
// PLANAC ERP - Header
// =============================================

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../ui/Icons';
import { useAuth } from '@/stores/auth.store';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { usuario, logout } = useAuth();
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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Menu mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
      >
        <Icons.menu className="w-6 h-6" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Menu */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="w-8 h-8 bg-planac-100 rounded-full flex items-center justify-center">
            {usuario?.avatar_url ? (
              <img src={usuario.avatar_url} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <Icons.user className="w-5 h-5 text-planac-600" />
            )}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-900">{usuario?.nome}</p>
            <p className="text-xs text-gray-500">{usuario?.email}</p>
          </div>
          <Icons.chevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {isProfileOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 animate-fade-in">
            <button
              onClick={() => { navigate('/configuracoes'); setIsProfileOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Icons.settings className="w-5 h-5" />
              <span>Configurações</span>
            </button>
            <div className="border-t border-gray-100 my-2" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Icons.logout className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
