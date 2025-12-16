// =============================================
// PLANAC ERP - Auth Service
// =============================================

import api from "./api";
import type { LoginRequest, LoginResponse, Usuario } from "@/types";

// URL base do auth (diferente do /v1 das outras rotas)
const AUTH_BASE = "https://planac-erp-api.planacacabamentos.workers.dev/api/auth";

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${AUTH_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    
    const data: LoginResponse = await response.json();
    
    if (data.success && data.token) {
      api.setToken(data.token);
      if (data.usuario) {
        localStorage.setItem("planac_user", JSON.stringify(data.usuario));
      }
    }
    
    return data;
  },

  async logout(): Promise<void> {
    try {
      const token = api.getToken();
      await fetch(`${AUTH_BASE}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // Ignorar erro de logout
    } finally {
      api.setToken(null);
      localStorage.removeItem("planac_user");
      localStorage.removeItem("planac_refresh");
    }
  },

  async me(): Promise<Usuario | null> {
    try {
      const token = api.getToken();
      const response = await fetch(`${AUTH_BASE}/me`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();
      return data.usuario;
    } catch {
      return null;
    }
  },

  async alterarSenha(senhaAtual: string, novaSenha: string): Promise<boolean> {
    const token = api.getToken();
    const response = await fetch(`${AUTH_BASE}/alterar-senha`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ senhaAtual, novaSenha }),
    });
    const data = await response.json();
    return data.success;
  },

  isAuthenticated(): boolean {
    return !!api.getToken() && !!this.getStoredUser();
  },

  getStoredUser(): Usuario | null {
    const stored = localStorage.getItem("planac_user");
    return stored ? JSON.parse(stored) : null;
  },
};

export default authService;
