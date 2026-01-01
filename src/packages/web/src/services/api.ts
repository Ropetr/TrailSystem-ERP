// =============================================
// TRAILSYSTEM ERP - API Client
// Rebuild: 17/12/2025 - Fix VITE_API_URL /v1
// =============================================

// Em produção (pages.dev), usa a URL completa do worker
// Em desenvolvimento, usa proxy do Vite
const getApiUrl = () => {
  // Se VITE_API_URL está definida, usa ela
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    
    // Produção (app.trailsystem.com.br) - usa API de produção
    if (hostname === "app.trailsystem.com.br") {
      return "https://planac-erp-api.planacacabamentos.workers.dev/api";
    }
    
    // Preview (Cloudflare Pages) - usa API de produção
    if (hostname.includes("pages.dev")) {
      return "https://planac-erp-api.planacacabamentos.workers.dev/api";
    }
  }
  
  // Desenvolvimento local - usa proxy
  return "";
};

const API_URL = getApiUrl();

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Recuperar token do localStorage
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("trailsystem_token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("trailsystem_token", token);
      } else {
        localStorage.removeItem("trailsystem_token");
      }
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    console.log("[API] Request:", options.method || "GET", url);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Se 401, limpar token e redirecionar para login
    if (response.status === 401) {
      this.setToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("trailsystem_user");
        window.location.href = "/login";
      }
      throw new Error("Sessao expirada");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro na requisicao");
    }

    return data;
  }

  // GET
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  // POST
  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PUT
  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // DELETE
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient(API_URL);
export default api;


