// =============================================
// PLANAC ERP - Banco Safra Authentication Service
// Autenticação OAuth2 com certificado para API Safra
// =============================================

import {
  SafraConfig,
  SafraEnv,
  SafraTokenResponse,
  SAFRA_URLS,
  SAFRA_ESCOPOS,
  SafraApiError,
} from './types';

// ===== CONFIGURAÇÃO =====

/**
 * Cria configuração do Safra a partir das variáveis de ambiente
 */
export function createSafraConfig(env: SafraEnv): SafraConfig {
  if (!env.SAFRA_CLIENT_ID) {
    throw new Error('SAFRA_CLIENT_ID não configurado');
  }
  if (!env.SAFRA_CLIENT_SECRET) {
    throw new Error('SAFRA_CLIENT_SECRET não configurado');
  }
  if (!env.SAFRA_CODIGO_BENEFICIARIO) {
    throw new Error('SAFRA_CODIGO_BENEFICIARIO não configurado');
  }

  return {
    clientId: env.SAFRA_CLIENT_ID,
    clientSecret: env.SAFRA_CLIENT_SECRET,
    certificadoPem: env.SAFRA_CERTIFICADO_PEM || '',
    chavePrivadaPem: env.SAFRA_CHAVE_PRIVADA_PEM || '',
    ambiente: env.SAFRA_AMBIENTE || 'homologacao',
    codigoBeneficiario: env.SAFRA_CODIGO_BENEFICIARIO,
    agencia: env.SAFRA_AGENCIA || '',
    contaCorrente: env.SAFRA_CONTA_CORRENTE || '',
    carteira: env.SAFRA_CARTEIRA || '',
  };
}

/**
 * Retorna as URLs base para o ambiente especificado
 */
export function getUrls(ambiente: 'homologacao' | 'producao') {
  return SAFRA_URLS[ambiente];
}

// ===== TOKEN CACHE =====

interface TokenCache {
  token: string;
  expiresAt: number;
}

const tokenCache = new Map<string, TokenCache>();

/**
 * Gera uma chave única para o cache do token
 */
function getCacheKey(config: SafraConfig, scope: string): string {
  return `safra:${config.clientId}:${config.codigoBeneficiario}:${scope}`;
}

/**
 * Verifica se o token em cache ainda é válido
 */
function isTokenValid(cache: TokenCache | undefined): boolean {
  if (!cache) return false;
  // Considera inválido se faltar menos de 60 segundos para expirar
  return cache.expiresAt > Date.now() + 60000;
}

// ===== AUTENTICAÇÃO OAuth2 =====

/**
 * Obtém token de acesso OAuth2 do Safra
 */
export async function getAccessToken(
  config: SafraConfig,
  scope: 'cobranca' | 'pix' = 'cobranca',
  kvCache?: KVNamespace
): Promise<string> {
  const cacheKey = getCacheKey(config, scope);

  // Verifica cache em memória
  const memCache = tokenCache.get(cacheKey);
  if (isTokenValid(memCache)) {
    return memCache!.token;
  }

  // Verifica cache em KV (se disponível)
  if (kvCache) {
    const kvToken = await kvCache.get(cacheKey);
    if (kvToken) {
      const parsed = JSON.parse(kvToken) as TokenCache;
      if (isTokenValid(parsed)) {
        tokenCache.set(cacheKey, parsed);
        return parsed.token;
      }
    }
  }

  // Gera novo token
  const urls = getUrls(config.ambiente);
  const scopes = SAFRA_ESCOPOS[scope];

  // Basic Auth com client_id:client_secret
  const credentials = btoa(`${config.clientId}:${config.clientSecret}`);

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: scopes,
  });

  const response = await fetch(urls.auth, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new SafraApiError(
      'AUTH_ERROR',
      `Falha na autenticação: ${response.status}`,
      errorText
    );
  }

  const tokenData: SafraTokenResponse = await response.json();

  // Calcula tempo de expiração (com margem de segurança)
  const expiresAt = Date.now() + (tokenData.expires_in - 60) * 1000;

  const cache: TokenCache = {
    token: tokenData.access_token,
    expiresAt,
  };

  // Salva em cache
  tokenCache.set(cacheKey, cache);

  if (kvCache) {
    await kvCache.put(cacheKey, JSON.stringify(cache), {
      expirationTtl: tokenData.expires_in - 60,
    });
  }

  return tokenData.access_token;
}

// ===== REQUISIÇÕES À API =====

/**
 * Faz uma requisição autenticada à API do Safra
 */
export async function safraRequest<T>(
  config: SafraConfig,
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: Record<string, unknown>;
    queryParams?: Record<string, string | number>;
    scope?: 'cobranca' | 'pix';
    kvCache?: KVNamespace;
  } = {}
): Promise<T> {
  const { method = 'GET', body, queryParams, scope = 'cobranca', kvCache } = options;

  const token = await getAccessToken(config, scope, kvCache);
  const urls = getUrls(config.ambiente);
  const baseUrl = scope === 'pix' ? urls.pix : urls.api;

  let url = `${baseUrl}${endpoint}`;

  // Adiciona query params
  if (queryParams) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      params.append(key, String(value));
    }
    url += `?${params.toString()}`;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  // Trata erros
  if (!response.ok) {
    const errorBody = await response.text();
    let errorData: { codigo?: string; mensagem?: string; detalhe?: string } = {};
    
    try {
      errorData = JSON.parse(errorBody);
    } catch {
      errorData = { mensagem: errorBody };
    }

    throw new SafraApiError(
      errorData.codigo || `HTTP_${response.status}`,
      errorData.mensagem || `Erro na requisição: ${response.status}`,
      errorData.detalhe
    );
  }

  // Retorna resposta vazia para DELETE sem conteúdo
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ===== TESTE DE CONEXÃO =====

/**
 * Testa a conexão com a API do Safra
 */
export async function testConnection(
  config: SafraConfig,
  kvCache?: KVNamespace
): Promise<{ success: boolean; message: string }> {
  try {
    await getAccessToken(config, 'cobranca', kvCache);
    return {
      success: true,
      message: 'Conexão com Banco Safra estabelecida com sucesso',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// ===== HELPERS PARA mTLS =====

/**
 * Interface para mTLS binding do Cloudflare
 */
export interface SafraMtlsBinding {
  bindingName: string;
  fetch: typeof fetch;
}

/**
 * Faz requisição usando mTLS binding do Cloudflare
 */
export async function safraMtlsRequest<T>(
  config: SafraConfig,
  endpoint: string,
  mtlsBinding: SafraMtlsBinding,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: Record<string, unknown>;
    queryParams?: Record<string, string | number>;
    scope?: 'cobranca' | 'pix';
    kvCache?: KVNamespace;
  } = {}
): Promise<T> {
  const { method = 'GET', body, queryParams, scope = 'cobranca', kvCache } = options;

  const token = await getAccessToken(config, scope, kvCache);
  const urls = getUrls(config.ambiente);
  const baseUrl = scope === 'pix' ? urls.pix : urls.api;

  let url = `${baseUrl}${endpoint}`;

  if (queryParams) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      params.append(key, String(value));
    }
    url += `?${params.toString()}`;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await mtlsBinding.fetch(url, fetchOptions);

  if (!response.ok) {
    const errorBody = await response.text();
    let errorData: { codigo?: string; mensagem?: string; detalhe?: string } = {};
    
    try {
      errorData = JSON.parse(errorBody);
    } catch {
      errorData = { mensagem: errorBody };
    }

    throw new SafraApiError(
      errorData.codigo || `HTTP_${response.status}`,
      errorData.mensagem || `Erro na requisição: ${response.status}`,
      errorData.detalhe
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
