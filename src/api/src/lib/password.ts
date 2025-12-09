/**
 * 🔐 PLANAC ERP - Password Utilities
 * Hash e verificação de senhas usando Web Crypto API
 * Compatível com Cloudflare Workers
 */

const ITERATIONS = 100000;
const HASH_LENGTH = 64;
const ALGORITHM = 'PBKDF2';

/**
 * Gera um hash seguro da senha
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    ALGORITHM,
    false,
    ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    HASH_LENGTH * 8
  );
  
  // Formato: iterations:salt:hash (tudo em base64)
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  
  return `${ITERATIONS}:${saltB64}:${hashB64}`;
}

/**
 * Verifica se a senha corresponde ao hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [iterationsStr, saltB64, hashB64] = storedHash.split(':');
    const iterations = parseInt(iterationsStr, 10);
    
    // Decodificar salt
    const saltStr = atob(saltB64);
    const salt = new Uint8Array(saltStr.length);
    for (let i = 0; i < saltStr.length; i++) {
      salt[i] = saltStr.charCodeAt(i);
    }
    
    // Decodificar hash original
    const originalHashStr = atob(hashB64);
    const originalHash = new Uint8Array(originalHashStr.length);
    for (let i = 0; i < originalHashStr.length; i++) {
      originalHash[i] = originalHashStr.charCodeAt(i);
    }
    
    // Gerar hash da senha fornecida
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      ALGORITHM,
      false,
      ['deriveBits']
    );
    
    const newHash = await crypto.subtle.deriveBits(
      {
        name: ALGORITHM,
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      HASH_LENGTH * 8
    );
    
    // Comparar hashes de forma segura (timing-safe)
    const newHashArray = new Uint8Array(newHash);
    if (originalHash.length !== newHashArray.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < originalHash.length; i++) {
      result |= originalHash[i] ^ newHashArray[i];
    }
    
    return result === 0;
  } catch {
    return false;
  }
}
