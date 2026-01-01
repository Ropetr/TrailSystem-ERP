// =============================================
// PLANAC ERP - Sicoob Authentication Service
// Autenticação OAuth2 com mTLS para API Sicoob
// =============================================

import {
  SicoobConfig,
  SicoobEnv,
  SicoobTokenResponse,
  SICOOB_URLS,
  SICOOB_ESCOPOS,
  SicoobApiError,
} from './types';

// ===== CONFIGURAÇÃO =====

/**
 * Cria configuração do Sicoob a partir das variáveis de ambiente
 */
export function createSicoobConfig(env: SicoobEnv): SicoobConfig {
  if (!env.SICOOB_CLIENT_ID) {
    throw new Error('SICOOB_CLIENT_ID não configurado');
  }
  if (!env.SICOOB_CERTIFICADO_PEM) {
    throw new Error('SICOOB_CERTIFICADO_PEM não configurado');
  }
  if (!env.SICOOB_CHAVE_PRIVADA_PEM) {
    throw new Error('SICOOB_CHAVE_PRIVADA_PEM não configurado');
  }
  if (!env.SICOOB_NUMERO_COOPERADO) {
    throw new Error('SICOOB_NUMERO_COOPERADO não configurado');
  }
  if (!env.SICOOB_CONTA_CORRENTE) {
    throw new Error('SICOOB_CONTA_CORRENTE não configurado');
  }

  return {
    clientId: env.SICOOB_CLIENT_ID,
    certificadoPem: env.SICOOB_CERTIFICADO_PEM,
    chavePrivadaPem: env.SICOOB_CHAVE_PRIVADA_PEM,
    ambiente: env.SICOOB_AMBIENTE || 'homologacao',
    numeroCooperado: parseInt(env.SICOOB_NUMERO_COOPERADO, 10),
    contaCorrente: parseInt(env.SICOOB_CONTA_CORRENTE, 10),
  };
}

/**
 * Retorna as URLs base para o ambiente especificado
 */
export function getUrls(ambiente: 'homologacao' | 'producao') {
  return SICOOB_URLS[ambiente];
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
function getCacheKey(config: SicoobConfig): string {
  return `sicoob:${config.clientId}:${config.numeroCooperado}`;
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
 * Obtém token de acesso OAuth2 do Sicoob
 * Utiliza client_credentials com certificado mTLS
 */
export async function getAccessToken(
  config: SicoobConfig,
  kvCache?: KVNamespace
): Promise<string> {
  const cacheKey = getCacheKey(config);

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
  const scopes = SICOOB_ESCOPOS.join(' ');

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.clientId,
    scope: scopes,
  });

  // Nota: Em produção, o Cloudflare Workers precisa de um mTLS binding
  // configurado para enviar o certificado cliente
  const response = await fetch(urls.auth, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new SicoobApiError(
      'AUTH_ERROR',
      `Falha na autenticação: ${response.status}`,
      errorText
    );
  }

  const tokenData: SicoobTokenResponse = await response.json();

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
 * Faz uma requisição autenticada à API do Sicoob
 */
export async function sicoobRequest<T>(
  config: SicoobConfig,
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: Record<string, unknown>;
    queryParams?: Record<string, string | number>;
    kvCache?: KVNamespace;
  } = {}
): Promise<T> {
  const { method = 'GET', body, queryParams, kvCache } = options;

  const token = await getAccessToken(config, kvCache);
  const urls = getUrls(config.ambiente);

  let url = `${urls.api}${endpoint}`;

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
    'x-sicoob-clientid': config.clientId,
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

    throw new SicoobApiError(
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
 * Testa a conexão com a API do Sicoob
 */
export async function testConnection(
  config: SicoobConfig,
  kvCache?: KVNamespace
): Promise<{ success: boolean; message: string }> {
  try {
    await getAccessToken(config, kvCache);
    return {
      success: true,
      message: 'Conexão com Sicoob estabelecida com sucesso',
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
 * Cria configuração para mTLS binding do Cloudflare
 * Nota: O certificado deve ser configurado no dashboard do Cloudflare
 * como um mTLS certificate e vinculado ao Worker
 */
export interface SicoobMtlsBinding {
  /** Nome do binding mTLS configurado no wrangler.toml */
  bindingName: string;
  /** Fetch function do binding */
  fetch: typeof fetch;
}

/**
 * Faz requisição usando mTLS binding do Cloudflare
 * Use esta função quando precisar de autenticação mTLS real
 */
export async function sicoobMtlsRequest<T>(
  config: SicoobConfig,
  endpoint: string,
  mtlsBinding: SicoobMtlsBinding,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: Record<string, unknown>;
    queryParams?: Record<string, string | number>;
    kvCache?: KVNamespace;
  } = {}
): Promise<T> {
  const { method = 'GET', body, queryParams, kvCache } = options;

  const token = await getAccessToken(config, kvCache);
  const urls = getUrls(config.ambiente);

  let url = `${urls.api}${endpoint}`;

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
    'x-sicoob-clientid': config.clientId,
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  // Usa o fetch do mTLS binding
  const response = await mtlsBinding.fetch(url, fetchOptions);

  if (!response.ok) {
    const errorBody = await response.text();
    let errorData: { codigo?: string; mensagem?: string; detalhe?: string } = {};
    
    try {
      errorData = JSON.parse(errorBody);
    } catch {
      errorData = { mensagem: errorBody };
    }

    throw new SicoobApiError(
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
