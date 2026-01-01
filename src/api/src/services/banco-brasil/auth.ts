// =============================================
// PLANAC ERP - Banco do Brasil Authentication Service
// Autenticação OAuth2 com mTLS para API BB
// =============================================

import {
  BancoBrasilConfig,
  BancoBrasilEnv,
  BancoBrasilTokenResponse,
  BB_URLS,
  BB_ESCOPOS,
  BancoBrasilApiError,
} from './types';

// ===== CONFIGURAÇÃO =====

/**
 * Cria configuração do Banco do Brasil a partir das variáveis de ambiente
 */
export function createBancoBrasilConfig(env: BancoBrasilEnv): BancoBrasilConfig {
  if (!env.BB_CLIENT_ID) {
    throw new Error('BB_CLIENT_ID não configurado');
  }
  if (!env.BB_CLIENT_SECRET) {
    throw new Error('BB_CLIENT_SECRET não configurado');
  }
  if (!env.BB_DEVELOPER_APPLICATION_KEY) {
    throw new Error('BB_DEVELOPER_APPLICATION_KEY não configurado');
  }
  if (!env.BB_NUMERO_CONVENIO) {
    throw new Error('BB_NUMERO_CONVENIO não configurado');
  }

  return {
    clientId: env.BB_CLIENT_ID,
    clientSecret: env.BB_CLIENT_SECRET,
    developerApplicationKey: env.BB_DEVELOPER_APPLICATION_KEY,
    certificadoPem: env.BB_CERTIFICADO_PEM || '',
    chavePrivadaPem: env.BB_CHAVE_PRIVADA_PEM || '',
    ambiente: env.BB_AMBIENTE || 'homologacao',
    numeroConvenio: parseInt(env.BB_NUMERO_CONVENIO, 10),
    numeroCarteira: parseInt(env.BB_NUMERO_CARTEIRA || '17', 10),
    numeroVariacaoCarteira: parseInt(env.BB_NUMERO_VARIACAO_CARTEIRA || '35', 10),
    agencia: parseInt(env.BB_AGENCIA || '0', 10),
    contaCorrente: parseInt(env.BB_CONTA_CORRENTE || '0', 10),
  };
}

/**
 * Retorna as URLs base para o ambiente especificado
 */
export function getUrls(ambiente: 'homologacao' | 'producao') {
  return BB_URLS[ambiente];
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
function getCacheKey(config: BancoBrasilConfig): string {
  return `bb:${config.clientId}:${config.numeroConvenio}`;
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
 * Obtém token de acesso OAuth2 do Banco do Brasil
 * Utiliza client_credentials com Basic Auth
 */
export async function getAccessToken(
  config: BancoBrasilConfig,
  scope: 'cobranca' | 'pix' = 'cobranca',
  kvCache?: KVNamespace
): Promise<string> {
  const cacheKey = `${getCacheKey(config)}:${scope}`;

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
  const scopes = BB_ESCOPOS[scope];

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
    throw new BancoBrasilApiError(
      'AUTH_ERROR',
      `Falha na autenticação: ${response.status}`,
      errorText
    );
  }

  const tokenData: BancoBrasilTokenResponse = await response.json();

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
 * Faz uma requisição autenticada à API do Banco do Brasil
 */
export async function bbRequest<T>(
  config: BancoBrasilConfig,
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
    // Adiciona gw-dev-app-key como query param (obrigatório)
    params.append('gw-dev-app-key', config.developerApplicationKey);
    url += `?${params.toString()}`;
  } else {
    url += `?gw-dev-app-key=${config.developerApplicationKey}`;
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
    let errorData: { erros?: Array<{ codigo: string; mensagem: string; ocorrencia?: string }> } = {};
    
    try {
      errorData = JSON.parse(errorBody);
    } catch {
      errorData = { erros: [{ codigo: `HTTP_${response.status}`, mensagem: errorBody }] };
    }

    const firstError = errorData.erros?.[0];
    throw new BancoBrasilApiError(
      firstError?.codigo || `HTTP_${response.status}`,
      firstError?.mensagem || `Erro na requisição: ${response.status}`,
      firstError?.ocorrencia
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
 * Testa a conexão com a API do Banco do Brasil
 */
export async function testConnection(
  config: BancoBrasilConfig,
  kvCache?: KVNamespace
): Promise<{ success: boolean; message: string }> {
  try {
    await getAccessToken(config, 'cobranca', kvCache);
    return {
      success: true,
      message: 'Conexão com Banco do Brasil estabelecida com sucesso',
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
export interface BBMtlsBinding {
  bindingName: string;
  fetch: typeof fetch;
}

/**
 * Faz requisição usando mTLS binding do Cloudflare
 */
export async function bbMtlsRequest<T>(
  config: BancoBrasilConfig,
  endpoint: string,
  mtlsBinding: BBMtlsBinding,
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
    params.append('gw-dev-app-key', config.developerApplicationKey);
    url += `?${params.toString()}`;
  } else {
    url += `?gw-dev-app-key=${config.developerApplicationKey}`;
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
    let errorData: { erros?: Array<{ codigo: string; mensagem: string; ocorrencia?: string }> } = {};
    
    try {
      errorData = JSON.parse(errorBody);
    } catch {
      errorData = { erros: [{ codigo: `HTTP_${response.status}`, mensagem: errorBody }] };
    }

    const firstError = errorData.erros?.[0];
    throw new BancoBrasilApiError(
      firstError?.codigo || `HTTP_${response.status}`,
      firstError?.mensagem || `Erro na requisição: ${response.status}`,
      firstError?.ocorrencia
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
