// =============================================
// PLANAC ERP - Nuvem Fiscal Auth Service
// Autenticação OAuth2 Client Credentials
// =============================================

import type { NuvemFiscalConfig, NuvemFiscalEnv, TokenResponse, TokenCache, NuvemFiscalError } from './types';

// URLs da API
const AUTH_URL = 'https://auth.nuvemfiscal.com.br/oauth/token';
const API_URL_SANDBOX = 'https://api.sandbox.nuvemfiscal.com.br';
const API_URL_PRODUCAO = 'https://api.nuvemfiscal.com.br';

// Scopes disponíveis
const SCOPES = [
  'empresa',
  'cep',
  'cnpj',
  'mdfe',
  'cte',
  'nfse',
  'nfe',
  'nfce',
  'conta'
].join(' ');

// Cache em memória
let tokenCache: TokenCache | null = null;

/**
 * Cria configuração a partir das variáveis de ambiente
 */
export function createNuvemFiscalConfig(env: NuvemFiscalEnv): NuvemFiscalConfig {
  return {
    clientId: env.NUVEM_FISCAL_CLIENT_ID,
    clientSecret: env.NUVEM_FISCAL_CLIENT_SECRET,
    ambiente: env.NUVEM_FISCAL_AMBIENTE || 'homologacao'
  };
}

/**
 * Retorna a URL base da API
 */
export function getBaseUrl(ambiente: 'homologacao' | 'producao'): string {
  return ambiente === 'producao' ? API_URL_PRODUCAO : API_URL_SANDBOX;
}

/**
 * Obtém token de acesso (com cache em memória)
 */
export async function getAccessToken(config: NuvemFiscalConfig): Promise<string> {
  // Verificar cache em memória
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  // Buscar novo token
  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: SCOPES,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro na autenticação Nuvem Fiscal: ${response.status} - ${error}`);
  }

  const data: TokenResponse = await response.json();

  // Cachear token (expira 5 minutos antes do tempo real)
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return data.access_token;
}

/**
 * Obtém token de acesso (com cache em KV - compartilhado entre workers)
 */
export async function getAccessTokenWithKV(
  config: NuvemFiscalConfig,
  kv: KVNamespace
): Promise<string> {
  const cacheKey = `nuvem_fiscal_token_${config.clientId}`;

  // Verificar cache no KV
  const cached = await kv.get<TokenCache>(cacheKey, 'json');
  if (cached && cached.expiresAt > Date.now()) {
    return cached.accessToken;
  }

  // Buscar novo token
  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: SCOPES,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro na autenticação Nuvem Fiscal: ${response.status} - ${error}`);
  }

  const data: TokenResponse = await response.json();

  // Cachear no KV (TTL de 55 minutos)
  const tokenData: TokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  await kv.put(cacheKey, JSON.stringify(tokenData), {
    expirationTtl: 3300, // 55 minutos
  });

  return data.access_token;
}

/**
 * Faz requisição autenticada para a API Nuvem Fiscal
 */
export async function nuvemFiscalRequest<T>(
  config: NuvemFiscalConfig,
  endpoint: string,
  options: RequestInit = {},
  kv?: KVNamespace
): Promise<T> {
  const token = kv 
    ? await getAccessTokenWithKV(config, kv)
    : await getAccessToken(config);

  const baseUrl = getBaseUrl(config.ambiente);
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    
    const error = new Error(`Nuvem Fiscal API Error: ${response.status}`) as any;
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  // Se resposta vazia (204), retornar objeto vazio
  if (response.status === 204) {
    return {} as T;
  }

  // Se for download de arquivo (PDF/XML)
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/pdf') || contentType?.includes('application/xml')) {
    return response.blob() as unknown as T;
  }

  return response.json();
}

/**
 * Testa conexão com a API
 */
export async function testConnection(config: NuvemFiscalConfig): Promise<boolean> {
  try {
    await getAccessToken(config);
    return true;
  } catch {
    return false;
  }
}

/**
 * Limpa cache de token
 */
export function clearTokenCache(): void {
  tokenCache = null;
}

export { AUTH_URL, API_URL_SANDBOX, API_URL_PRODUCAO, SCOPES };

