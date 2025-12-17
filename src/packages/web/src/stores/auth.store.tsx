// =============================================
// PLANAC ERP - Auth Store (Context)
// Fix: Manter sessão após F5 (17/12/2025)
// =============================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Usuario } from '@/types';
import authService from '@/services/auth.service';
import api from '@/services/api';

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
        // 1. Recuperar dados do localStorage
        const storedUser = authService.getStoredUser();
        const storedToken = api.getToken();
        
        console.log('[Auth] Verificando sessão...', { 
          temUser: !!storedUser, 
          temToken: !!storedToken 
        });

        // 2. Se não tem token ou usuário, não está logado
        if (!storedToken || !storedUser) {
          console.log('[Auth] Sem token/usuário armazenado');
          setIsLoading(false);
          return;
        }

        // 3. Tem token e usuário → considera logado imediatamente
        setUsuario(storedUser);
        console.log('[Auth] Usuário restaurado do localStorage:', storedUser.nome);

        // 4. Validar token no backend (em background, sem bloquear)
        try {
          const currentUser = await authService.me();
          if (currentUser) {
            // Token válido - atualiza dados do usuário
            setUsuario(currentUser);
            localStorage.setItem('planac_user', JSON.stringify(currentUser));
            console.log('[Auth] Token validado, usuário atualizado');
          } else {
            // me() retornou null mas sem erro explícito - mantém sessão
            console.log('[Auth] me() retornou null, mantendo sessão local');
          }
        } catch (error: any) {
          // Se for erro 401, o token expirou - desloga
          if (error.message === 'Sessao expirada' || error.status === 401) {
            console.log('[Auth] Token expirado, deslogando');
            setUsuario(null);
            api.setToken(null);
            localStorage.removeItem('planac_user');
          } else {
            // Outro erro (rede, servidor) - mantém sessão local
            console.log('[Auth] Erro ao validar, mantendo sessão:', error.message);
          }
        }
      } catch (error) {
        console.error('[Auth] Erro no checkAuth:', error);
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
        console.log('[Auth] Login bem-sucedido:', response.usuario.nome);
        return { success: true };
      }
      return { success: false, error: response.error || 'Erro ao fazer login' };
    } catch (err) {
      console.error('[Auth] Erro no login:', err);
      return { success: false, error: 'Erro ao conectar com o servidor' };
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('[Auth] Fazendo logout...');
    await authService.logout();
    setUsuario(null);
  }, []);

  const refresh = useCallback(async () => {
    const currentUser = await authService.me();
    if (currentUser) {
      setUsuario(currentUser);
      localStorage.setItem('planac_user', JSON.stringify(currentUser));
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
