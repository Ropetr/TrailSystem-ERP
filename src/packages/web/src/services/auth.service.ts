// =============================================
// PLANAC ERP - Auth Service
// =============================================

import api from './api';
import type { LoginRequest, LoginResponse, Usuario } from '@/types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    
    if (response.success && response.token) {
      api.setToken(response.token);
      if (response.usuario) {
        localStorage.setItem('planac_user', JSON.stringify(response.usuario));
      }
    }
    
    return response;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignorar erro de logout
    } finally {
      api.setToken(null);
      localStorage.removeItem('planac_user');
      localStorage.removeItem('planac_refresh');
    }
  },

  async me(): Promise<Usuario | null> {
    try {
      const response = await api.get<{ success: boolean; usuario: Usuario }>('/auth/me');
      return response.usuario;
    } catch {
      return null;
    }
  },

  async alterarSenha(senhaAtual: string, novaSenha: string): Promise<boolean> {
    const response = await api.post<{ success: boolean }>('/auth/alterar-senha', {
      senhaAtual,
      novaSenha,
    });
    return response.success;
  },

  getStoredUser(): Usuario | null {
    const stored = localStorage.getItem('planac_user');
    return stored ? JSON.parse(stored) : null;
  },

  isAuthenticated(): boolean {
    return !!api.getToken() && !!this.getStoredUser();
  },
};

export default authService;
