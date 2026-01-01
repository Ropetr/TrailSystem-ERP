// =============================================
// PLANAC ERP - Caixa Econômica Federal Authentication Service
// Autenticação OAuth2 com certificado para API Caixa
// =============================================

import {
  CaixaConfig,
  CaixaEnv,
  CaixaTokenResponse,
  CAIXA_URLS,
  CaixaApiError,
} from './types';

// ===== CONFIGURAÇÃO =====

/**
 * Cria configuração da Caixa a partir das variáveis de ambiente
 */
export function createCaixaConfig(env: CaixaEnv): CaixaConfig {
  if (!env.CAIXA_CODIGO_BENEFICIARIO) {
    throw new Error('CAIXA_CODIGO_BENEFICIARIO não configurado');
  }
  if (!env.CAIXA_CNPJ_BENEFICIARIO) {
    throw new Error('CAIXA_CNPJ_BENEFICIARIO não configurado');
  }
  if (!env.CAIXA_CLIENT_ID) {
    throw new Error('CAIXA_CLIENT_ID não configurado');
  }
  if (!env.CAIXA_CLIENT_SECRET) {
    throw new Error('CAIXA_CLIENT_SECRET não configurado');
  }

  return {
    codigoBeneficiario: env.CAIXA_CODIGO_BENEFICIARIO,
    cnpjBeneficiario: env.CAIXA_CNPJ_BENEFICIARIO,
    unidade: env.CAIXA_UNIDADE || '',
    codigoConvenio: env.CAIXA_CODIGO_CONVENIO || '',
    certificadoPem: env.CAIXA_CERTIFICADO_PEM || '',
    chavePrivadaPem: env.CAIXA_CHAVE_PRIVADA_PEM || '',
    ambiente: env.CAIXA_AMBIENTE || 'homologacao',
    clientId: env.CAIXA_CLIENT_ID,
    clientSecret: env.CAIXA_CLIENT_SECRET,
  };
}

/**
 * Retorna as URLs base para o ambiente especificado
 */
export function getUrls(ambiente: 'homologacao' | 'producao') {
  return CAIXA_URLS[ambiente];
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
function getCacheKey(config: CaixaConfig): string {
  return `caixa:${config.clientId}:${config.codigoBeneficiario}`;
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
 * Obtém token de acesso OAuth2 da Caixa
 */
export async function getAccessToken(
  config: CaixaConfig,
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

  // Basic Auth com client_id:client_secret
  const credentials = btoa(`${config.clientId}:${config.clientSecret}`);

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
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
    throw new CaixaApiError(
      'AUTH_ERROR',
      `Falha na autenticação: ${response.status}`,
      errorText
    );
  }

  const tokenData: CaixaTokenResponse = await response.json();

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
 * Faz uma requisição autenticada à API da Caixa
 */
export async function caixaRequest<T>(
  config: CaixaConfig,
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

  const token = await getAccessToken(config, kvCache);
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

    throw new CaixaApiError(
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
 * Testa a conexão com a API da Caixa
 */
export async function testConnection(
  config: CaixaConfig,
  kvCache?: KVNamespace
): Promise<{ success: boolean; message: string }> {
  try {
    await getAccessToken(config, kvCache);
    return {
      success: true,
      message: 'Conexão com Caixa Econômica Federal estabelecida com sucesso',
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
export interface CaixaMtlsBinding {
  bindingName: string;
  fetch: typeof fetch;
}

/**
 * Faz requisição usando mTLS binding do Cloudflare
 */
export async function caixaMtlsRequest<T>(
  config: CaixaConfig,
  endpoint: string,
  mtlsBinding: CaixaMtlsBinding,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: Record<string, unknown>;
    queryParams?: Record<string, string | number>;
    scope?: 'cobranca' | 'pix';
    kvCache?: KVNamespace;
  } = {}
): Promise<T> {
  const { method = 'GET', body, queryParams, scope = 'cobranca', kvCache } = options;

  const token = await getAccessToken(config, kvCache);
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

    throw new CaixaApiError(
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
