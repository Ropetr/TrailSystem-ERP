// =============================================
// PLANAC ERP - Nuvem Fiscal CEP Service
// Consulta de endereços por CEP
// =============================================

import type { NuvemFiscalConfig, CepEndereco } from './types';
import { nuvemFiscalRequest } from './auth';

/**
 * Consulta endereço pelo CEP
 * @param config Configuração da API
 * @param cep CEP sem máscara (apenas números)
 * @returns Dados do endereço
 */
export async function consultarCep(
  config: NuvemFiscalConfig,
  cep: string,
  kv?: KVNamespace
): Promise<CepEndereco> {
  // Remover máscara do CEP
  const cepLimpo = cep.replace(/\D/g, '');
  
  if (cepLimpo.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos');
  }

  return nuvemFiscalRequest<CepEndereco>(
    config,
    `/cep/${cepLimpo}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Formata CEP para exibição (00000-000)
 */
export function formatarCep(cep: string): string {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) return cep;
  return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
}

/**
 * Valida formato do CEP
 */
export function validarCep(cep: string): boolean {
  const cepLimpo = cep.replace(/\D/g, '');
  return cepLimpo.length === 8;
}

