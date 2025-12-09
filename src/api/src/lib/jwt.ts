/**
 * 🔑 PLANAC ERP - JWT Utilities
 * Geração e validação de tokens JWT usando Web Crypto API
 * Compatível com Cloudflare Workers
 */

export interface JWTPayload {
  sub: string;           // user_id
  empresa_id: string;
  email: string;
  nome: string;
  perfis: string[];      // IDs dos perfis
  permissoes: string[];  // Lista de permissões (modulo:acao)
  iat: number;           // issued at
  exp: number;           // expiration
}

export interface JWTHeader {
  alg: 'HS256';
  typ: 'JWT';
}

/**
 * Codifica para Base64 URL-safe
 */
function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string;
  
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    const bytes = new Uint8Array(data);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }
  
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decodifica de Base64 URL-safe
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  return atob(base64);
}

/**
 * Importa a chave secreta para uso com HMAC
 */
async function importKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Gera a assinatura HMAC-SHA256
 */
async function sign(data: string, secret: string): Promise<ArrayBuffer> {
  const key = await importKey(secret);
  const encoder = new TextEncoder();
  return crypto.subtle.sign('HMAC', key, encoder.encode(data));
}

/**
 * Verifica a assinatura HMAC-SHA256
 */
async function verify(data: string, signature: ArrayBuffer, secret: string): Promise<boolean> {
  const key = await importKey(secret);
  const encoder = new TextEncoder();
  return crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
}

/**
 * Gera um token JWT
 */
export async function generateToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: number = 8 * 60 * 60 // 8 horas em segundos
): Promise<string> {
  const header: JWTHeader = { alg: 'HS256', typ: 'JWT' };
  
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };
  
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(fullPayload));
  
  const data = `${headerEncoded}.${payloadEncoded}`;
  const signature = await sign(data, secret);
  const signatureEncoded = base64UrlEncode(signature);
  
  return `${data}.${signatureEncoded}`;
}

/**
 * Valida e decodifica um token JWT
 */
export async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
    const data = `${headerEncoded}.${payloadEncoded}`;
    
    // Decodificar assinatura
    const signatureStr = base64UrlDecode(signatureEncoded);
    const signature = new Uint8Array(signatureStr.length);
    for (let i = 0; i < signatureStr.length; i++) {
      signature[i] = signatureStr.charCodeAt(i);
    }
    
    // Verificar assinatura
    const isValid = await verify(data, signature.buffer, secret);
    if (!isValid) {
      return null;
    }
    
    // Decodificar payload
    const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadEncoded));
    
    // Verificar expiração
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

/**
 * Gera um refresh token (token opaco mais longo)
 */
export function generateRefreshToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Extrai o token do header Authorization
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}
