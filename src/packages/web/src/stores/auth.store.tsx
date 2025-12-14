// =============================================
// PLANAC ERP - Auth Store (Context)
// =============================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Usuario } from '@/types';
import authService from '@/services/auth.service';

interface AuthContextType {
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = authService.getStoredUser();
      if (storedUser) {
        setUsuario(storedUser);
        // Validar token no backend
        const currentUser = await authService.me();
        if (currentUser) {
          setUsuario(currentUser);
        } else {
          setUsuario(null);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    try {
      const response = await authService.login({ email, senha });
      if (response.success && response.usuario) {
        setUsuario(response.usuario);
        return { success: true };
      }
      return { success: false, error: response.error || 'Erro ao fazer login' };
    } catch (err) {
      return { success: false, error: 'Erro ao conectar com o servidor' };
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUsuario(null);
  }, []);

  const refresh = useCallback(async () => {
    const currentUser = await authService.me();
    if (currentUser) {
      setUsuario(currentUser);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isLoading,
        isAuthenticated: !!usuario,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
