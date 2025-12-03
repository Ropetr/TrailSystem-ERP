/**
 * 🔧 PLANAC ERP - Código Compartilhado
 * 
 * Types, Utils, Validations compartilhados entre API e Web
 * 
 * @version 0.1.0
 */

import { z } from 'zod';

// =============================================
// 📋 TYPES BASE
// =============================================

export interface BaseEntity {
  id: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =============================================
// 🏢 EMPRESA
// =============================================

export interface Empresa extends BaseEntity {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  ie?: string;
  im?: string;
  regime_tributario: 'simples' | 'presumido' | 'real';
  ativo: boolean;
}

// =============================================
// 👤 USUÁRIO
// =============================================

export interface Usuario extends BaseEntity {
  nome: string;
  email: string;
  ativo: boolean;
  two_factor_enabled: boolean;
  ultimo_acesso?: string;
}

export interface UsuarioComPerfis extends Usuario {
  perfis: string[];
  permissoes: string[];
}

// =============================================
// 👥 CLIENTE
// =============================================

export interface Cliente extends BaseEntity {
  tipo: 'PF' | 'PJ';
  nome_razao: string;
  nome_fantasia?: string;
  cpf_cnpj: string;
  ie?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  whatsapp?: string;
  tipo_cliente: string;
  tabela_preco_id?: string;
  vendedor_id?: string;
  limite_credito: number;
  saldo_credito: number;
  ativo: boolean;
  bloqueado: boolean;
}

// =============================================
// 📦 PRODUTO
// =============================================

export interface Produto extends BaseEntity {
  codigo: string;
  codigo_barras?: string;
  nome: string;
  descricao?: string;
  categoria_id: string;
  unidade: string;
  preco_custo: number;
  preco_venda: number;
  margem: number;
  estoque_minimo: number;
  estoque_atual: number;
  ativo: boolean;
  tipo: 'produto' | 'servico' | 'kit';
}

// =============================================
// 🛒 PEDIDO DE VENDA
// =============================================

export type StatusPedido = 
  | 'rascunho'
  | 'pendente_aprovacao'
  | 'aprovado'
  | 'parcialmente_faturado'
  | 'faturado'
  | 'parcialmente_entregue'
  | 'entregue'
  | 'finalizado'
  | 'cancelado';

export interface Pedido extends BaseEntity {
  numero: number;
  cliente_id: string;
  vendedor_id: string;
  status: StatusPedido;
  total_produtos: number;
  total_desconto: number;
  total_frete: number;
  total_geral: number;
  observacoes?: string;
}

// =============================================
// ✅ VALIDAÇÕES (Zod Schemas)
// =============================================

// CPF
export const cpfSchema = z.string()
  .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
  .refine(validarCPF, 'CPF inválido');

// CNPJ
export const cnpjSchema = z.string()
  .regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos')
  .refine(validarCNPJ, 'CNPJ inválido');

// CPF ou CNPJ
export const cpfCnpjSchema = z.string()
  .refine(
    (val) => {
      const clean = val.replace(/\D/g, '');
      if (clean.length === 11) return validarCPF(clean);
      if (clean.length === 14) return validarCNPJ(clean);
      return false;
    },
    'CPF/CNPJ inválido'
  );

// Email
export const emailSchema = z.string()
  .email('Email inválido')
  .toLowerCase();

// Telefone
export const telefoneSchema = z.string()
  .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos');

// Senha
export const senhaSchema = z.string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .max(128, 'Senha deve ter no máximo 128 caracteres')
  .regex(/[A-Z]/, 'Senha deve ter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve ter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve ter pelo menos um número')
  .regex(/[!@#$%^&*]/, 'Senha deve ter pelo menos um caractere especial');

// =============================================
// 🔧 UTILS
// =============================================

/**
 * Valida CPF
 */
export function validarCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1+$/.test(clean)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(clean[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(clean[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean[10])) return false;

  return true;
}

/**
 * Valida CNPJ
 */
export function validarCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1+$/.test(clean)) return false;

  let tamanho = clean.length - 2;
  let numeros = clean.substring(0, tamanho);
  const digitos = clean.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = clean.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
}

/**
 * Formata CPF
 */
export function formatarCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ
 */
export function formatarCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '');
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata moeda (BRL)
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Formata data
 */
export function formatarData(data: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(data));
}

/**
 * Formata data e hora
 */
export function formatarDataHora(data: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data));
}

/**
 * Gera UUID
 */
export function gerarUUID(): string {
  return crypto.randomUUID();
}

// =============================================
// 🚀 EXPORTS
// =============================================

export default {
  validarCPF,
  validarCNPJ,
  formatarCPF,
  formatarCNPJ,
  formatarMoeda,
  formatarData,
  formatarDataHora,
  gerarUUID,
};
