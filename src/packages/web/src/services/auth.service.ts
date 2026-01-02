// =============================================
// TRAILSYSTEM ERP - Auth Service
// Rebuild: 31/12/2025 - Fix hardcoded URL, use env vars
// =============================================

import api from "./api";
import type { LoginRequest, LoginResponse, Usuario } from "@/types";

// URL base do auth - detecta ambiente automaticamente
const getAuthUrl = () => {
  // Se VITE_API_URL está definida, usa ela + /auth
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/auth`;
  }
  
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    
    // Produção (app.trailsystem.com.br) - usa API de produção
    if (hostname === "app.trailsystem.com.br") {
      return "https://trailsystem-erp-api.planacacabamentos.workers.dev/v1/auth";
    }
    
    // Preview (Cloudflare Pages) - usa API de produção
    if (hostname.includes("pages.dev")) {
      return "https://trailsystem-erp-api.planacacabamentos.workers.dev/v1/auth";
    }
  }
  
  // Desenvolvimento local - usa proxy do Vite
  return "/v1/auth";
};

const AUTH_BASE = getAuthUrl();

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
        localStorage.setItem("trailsystem_user", JSON.stringify(data.usuario));
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
      localStorage.removeItem("trailsystem_user");
      localStorage.removeItem("trailsystem_refresh");
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
    const stored = localStorage.getItem("trailsystem_user");
    return stored ? JSON.parse(stored) : null;
  },
};

export default authService;
