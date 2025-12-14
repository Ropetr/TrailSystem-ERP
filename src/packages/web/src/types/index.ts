// =============================================
// PLANAC ERP - Types
// =============================================

// Auth
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  empresa_id: string;
  avatar_url?: string;
  perfis: Perfil[];
}

export interface Perfil {
  id: string;
  nome: string;
  descricao?: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  usuario?: Usuario;
  error?: string;
}

// Empresa
export interface Empresa {
  id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  regime_tributario: number;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  telefone?: string;
  email?: string;
  logo_url?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Filial
export interface Filial {
  id: string;
  empresa_id: string;
  nome: string;
  cnpj?: string;
  ativo: boolean;
}

// API Response padrão
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
