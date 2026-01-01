// =============================================
// PLANAC ERP - Sisprime Auth Service
// Autenticação JWT HS512 para API Sisprime/CobExpress
// =============================================

import type { SisprimeConfig, SisprimeEnv, SisprimeError } from './types';

// URLs da API
const URL_HOMOLOGACAO = 'https://homologa-ws.cobexpress.com.br/webservice';
const URL_PRODUCAO = 'https://sisprimebr.cobexpress.com.br/webservice';

/**
 * Cria configuração a partir das variáveis de ambiente
 */
export function createSisprimeConfig(env: SisprimeEnv): SisprimeConfig {
  return {
    chaveAcessoGeral: env.SISPRIME_CHAVE_ACESSO_GERAL,
    chaveAcessoConta: env.SISPRIME_CHAVE_ACESSO_CONTA,
    ambiente: env.SISPRIME_AMBIENTE || 'homologacao',
  };
}

/**
 * Retorna a URL base da API
 */
export function getBaseUrl(ambiente: 'homologacao' | 'producao'): string {
  return ambiente === 'producao' ? URL_PRODUCAO : URL_HOMOLOGACAO;
}

/**
 * Codifica string para Base64 URL-safe
 */
function base64UrlEncode(str: string): string {
  // Converter string para Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  
  // Converter para base64
  let base64 = '';
  const bytes = new Uint8Array(data);
  for (let i = 0; i < bytes.length; i++) {
    base64 += String.fromCharCode(bytes[i]);
  }
  base64 = btoa(base64);
  
  // Tornar URL-safe
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Codifica bytes para Base64 URL-safe
 */
function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let base64 = '';
  for (let i = 0; i < bytes.length; i++) {
    base64 += String.fromCharCode(bytes[i]);
  }
  base64 = btoa(base64);
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Gera assinatura HMAC-SHA512
 */
async function hmacSha512(key: string, message: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return new Uint8Array(signature);
}

/**
 * Gera token JWT para autenticação na API Sisprime
 * 
 * O Sisprime usa JWT com algoritmo HS512 (HMAC-SHA512)
 * - Header: { "alg": "HS512" }
 * - Payload: { "iat": timestamp, "exp": timestamp+600, "iss": "cobexpress", "hash": chaveAcessoConta }
 * - Assinatura: HMAC-SHA512 com chaveAcessoGeral
 */
export async function generateJwtToken(config: SisprimeConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  // Header
  const header = {
    alg: 'HS512',
    typ: 'JWT',
  };
  
  // Payload
  const payload = {
    iat: now,
    exp: now + 600, // Token válido por 10 minutos
    iss: 'cobexpress',
    hash: config.chaveAcessoConta,
  };
  
  // Codificar header e payload
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  
  // Criar mensagem para assinatura
  const message = `${headerEncoded}.${payloadEncoded}`;
  
  // Gerar assinatura
  const signatureBytes = await hmacSha512(config.chaveAcessoGeral, message);
  const signatureEncoded = base64UrlEncodeBytes(signatureBytes);
  
  // Montar token completo
  return `${message}.${signatureEncoded}`;
}

/**
 * Faz requisição autenticada para a API Sisprime
 */
export async function sisprimeRequest<T>(
  config: SisprimeConfig,
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const baseUrl = getBaseUrl(config.ambiente);
  const url = `${baseUrl}/${endpoint}`;
  
  // Gerar token JWT
  const token = await generateJwtToken(config);
  
  // Adicionar token ao body
  const requestBody = {
    token,
    ...body,
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    
    const error = new Error(`Sisprime API Error: ${response.status}`) as SisprimeError;
    error.status = response.status;
    error.response = errorData;
    throw error;
  }
  
  return response.json();
}

/**
 * Testa conexão com a API Sisprime
 */
export async function testConnection(config: SisprimeConfig): Promise<boolean> {
  try {
    // Tentar gerar um token para validar as credenciais
    await generateJwtToken(config);
    return true;
  } catch {
    return false;
  }
}

export { URL_HOMOLOGACAO, URL_PRODUCAO };
