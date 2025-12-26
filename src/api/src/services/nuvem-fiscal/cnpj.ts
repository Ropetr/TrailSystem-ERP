// =============================================
// PLANAC ERP - Nuvem Fiscal CNPJ Service
// Consulta de empresas por CNPJ
// =============================================

import type { NuvemFiscalConfig, CnpjEmpresa, CnpjListagem, PaginacaoParams } from './types';
import { nuvemFiscalRequest } from './auth';

/**
 * Consulta dados completos de uma empresa pelo CNPJ
 * @param config Configuração da API
 * @param cnpj CNPJ sem máscara (apenas números)
 * @returns Dados completos da empresa
 */
export async function consultarCnpj(
  config: NuvemFiscalConfig,
  cnpj: string,
  kv?: KVNamespace
): Promise<CnpjEmpresa> {
  // Remover máscara do CNPJ
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  if (cnpjLimpo.length !== 14) {
    throw new Error('CNPJ deve ter 14 dígitos');
  }

  return nuvemFiscalRequest<CnpjEmpresa>(
    config,
    `/cnpj/${cnpjLimpo}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Lista estabelecimentos ativos por CNAE e município
 * @param config Configuração da API
 * @param cnae_principal Código CNAE da atividade principal
 * @param municipio Código IBGE do município
 * @param natureza_juridica Código da natureza jurídica
 * @param paginacao Parâmetros de paginação
 */
export async function listarCnpj(
  config: NuvemFiscalConfig,
  cnae_principal: string,
  municipio: string,
  natureza_juridica: string,
  paginacao?: PaginacaoParams,
  kv?: KVNamespace
): Promise<CnpjListagem> {
  const params = new URLSearchParams({
    cnae_principal: cnae_principal.replace(/\D/g, ''),
    municipio: municipio.replace(/\D/g, ''),
    natureza_juridica: natureza_juridica.replace(/\D/g, ''),
  });

  if (paginacao?.$top) params.append('$top', paginacao.$top.toString());
  if (paginacao?.$skip) params.append('$skip', paginacao.$skip.toString());
  if (paginacao?.$inlinecount) params.append('$inlinecount', 'true');

  return nuvemFiscalRequest<CnpjListagem>(
    config,
    `/cnpj?${params.toString()}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Formata CNPJ para exibição (00.000.000/0000-00)
 */
export function formatarCnpj(cnpj: string): string {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  if (cnpjLimpo.length !== 14) return cnpj;
  return cnpjLimpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Formata CPF para exibição (000.000.000-00)
 */
export function formatarCpf(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    '$1.$2.$3-$4'
  );
}

/**
 * Valida CNPJ
 */
export function validarCnpj(cnpj: string): boolean {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  if (cnpjLimpo.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpjLimpo)) return false; // Todos dígitos iguais
  
  // Validar dígitos verificadores
  let soma = 0;
  let peso = 5;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpjLimpo[i]) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  let digito = 11 - (soma % 11);
  if (digito > 9) digito = 0;
  if (parseInt(cnpjLimpo[12]) !== digito) return false;
  
  soma = 0;
  peso = 6;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpjLimpo[i]) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  digito = 11 - (soma % 11);
  if (digito > 9) digito = 0;
  if (parseInt(cnpjLimpo[13]) !== digito) return false;
  
  return true;
}

/**
 * Valida CPF
 */
export function validarCpf(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpfLimpo)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo[i]) * (10 - i);
  }
  let digito = 11 - (soma % 11);
  if (digito > 9) digito = 0;
  if (parseInt(cpfLimpo[9]) !== digito) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo[i]) * (11 - i);
  }
  digito = 11 - (soma % 11);
  if (digito > 9) digito = 0;
  if (parseInt(cpfLimpo[10]) !== digito) return false;
  
  return true;
}

/**
 * Identifica se é CPF ou CNPJ
 */
export function identificarDocumento(documento: string): 'cpf' | 'cnpj' | 'invalido' {
  const docLimpo = documento.replace(/\D/g, '');
  if (docLimpo.length === 11 && validarCpf(docLimpo)) return 'cpf';
  if (docLimpo.length === 14 && validarCnpj(docLimpo)) return 'cnpj';
  return 'invalido';
}

