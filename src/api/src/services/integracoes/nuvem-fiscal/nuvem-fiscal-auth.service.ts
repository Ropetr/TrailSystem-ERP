// =============================================
// PLANAC ERP - Nuvem Fiscal Auth Service
// =============================================
// Gerencia autenticação OAuth2 com a API Nuvem Fiscal
// Documentação: https://dev.nuvemfiscal.com.br/docs/

import { Env } from '../types';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface NuvemFiscalConfig {
  clientId: string;
  clientSecret: string;
  ambiente: 'sandbox' | 'producao';
}

// Cache de tokens por empresa
const tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

/**
 * Obtém as credenciais da Nuvem Fiscal
 */
export function getNuvemFiscalConfig(): NuvemFiscalConfig {
  return {
    clientId: 'AJReDlHes8aBNlTzTF9X',
    clientSecret: '3yMYNk2hzBLQihujZf0jfFyAKDRc403v4D1SBDFL',
    ambiente: 'sandbox', // Mudar para 'producao' quando homologado
  };
}

/**
 * Retorna a URL base da API baseado no ambiente
 */
export function getBaseUrl(ambiente: 'sandbox' | 'producao' = 'sandbox'): string {
  return ambiente === 'producao'
    ? 'https://api.nuvemfiscal.com.br'
    : 'https://api.sandbox.nuvemfiscal.com.br';
}

/**
 * Obtém token de acesso via OAuth2 Client Credentials
 */
export async function getAccessToken(config?: NuvemFiscalConfig): Promise<string> {
  const cfg = config || getNuvemFiscalConfig();
  const cacheKey = `${cfg.clientId}_${cfg.ambiente}`;
  
  // Verifica cache
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  // Solicita novo token
  const authUrl = 'https://auth.nuvemfiscal.com.br/oauth/token';
  
  const credentials = btoa(`${cfg.clientId}:${cfg.clientSecret}`);
  
  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=empresa cep cnpj nfe nfce mdfe cte nfse',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao obter token Nuvem Fiscal: ${response.status} - ${error}`);
  }

  const data: TokenResponse = await response.json();
  
  // Armazena em cache (com margem de segurança de 60s)
  tokenCache.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  });

  return data.access_token;
}

/**
 * Faz requisição autenticada para a API Nuvem Fiscal
 */
export async function nuvemFiscalRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    ambiente?: 'sandbox' | 'producao';
  } = {}
): Promise<T> {
  const { method = 'GET', body, ambiente = 'sandbox' } = options;
  
  const token = await getAccessToken({ ...getNuvemFiscalConfig(), ambiente });
  const baseUrl = getBaseUrl(ambiente);
  
  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${endpoint}`, fetchOptions);
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    
    throw new Error(
      `Nuvem Fiscal API Error [${response.status}]: ${JSON.stringify(errorData)}`
    );
  }

  // Alguns endpoints retornam 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Verifica status da conexão com a Nuvem Fiscal
 */
export async function verificarConexao(): Promise<{
  conectado: boolean;
  ambiente: string;
  mensagem: string;
}> {
  try {
    const token = await getAccessToken();
    return {
      conectado: true,
      ambiente: getNuvemFiscalConfig().ambiente,
      mensagem: 'Conexão estabelecida com sucesso',
    };
  } catch (error) {
    return {
      conectado: false,
      ambiente: getNuvemFiscalConfig().ambiente,
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Limpa o cache de tokens (útil para forçar renovação)
 */
export function limparCacheTokens(): void {
  tokenCache.clear();
}

export default {
  getAccessToken,
  nuvemFiscalRequest,
  verificarConexao,
  limparCacheTokens,
  getNuvemFiscalConfig,
  getBaseUrl,
};
