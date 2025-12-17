// =============================================
// PLANAC ERP - Auth Store (Context)
// Fix: Manter sessão após F5 - 17/12/2025
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
      try {
        // 1. Verificar se há usuário e token salvos
        const storedUser = authService.getStoredUser();
        const hasToken = !!authService.getToken?.() || !!localStorage.getItem('planac_token');
        
        if (storedUser && hasToken) {
          // 2. Confiar no usuário salvo imediatamente
          setUsuario(storedUser);
          
          // 3. Tentar validar com a API em background (opcional)
          try {
            const currentUser = await authService.me();
            if (currentUser) {
              // Atualizar com dados frescos da API
              setUsuario(currentUser);
            }
            // Se me() retornar null mas não der erro, mantém o storedUser
          } catch (apiError) {
            // Erro de rede/API - mantém o usuário logado com dados salvos
            console.log('[Auth] API indisponível, usando dados locais');
          }
        }
      } catch (error) {
        console.error('[Auth] Erro ao verificar autenticação:', error);
      } finally {
        setIsLoading(false);
      }
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
    try {
      const currentUser = await authService.me();
      if (currentUser) {
        setUsuario(currentUser);
      }
    } catch (error) {
      console.error('[Auth] Erro ao atualizar usuário:', error);
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
