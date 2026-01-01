// =============================================
// PLANAC ERP - Sisprime Crypto Helpers
// Criptografia AES-256-CBC para webhooks Sisprime
// =============================================

/**
 * Decripta payload do webhook Sisprime usando AES-256-CBC
 * 
 * O Sisprime envia os dados do webhook criptografados com AES-256-CBC.
 * O formato do payload é: IV::ENCRYPTED_DATA (separados por "::")
 * 
 * @param encryptedPayload - Payload criptografado no formato "IV::ENCRYPTED_DATA"
 * @param symmetricKey - Chave simétrica UUID fornecida pelo Sisprime
 * @returns Dados decriptados como string JSON
 * 
 * @example
 * ```typescript
 * const decrypted = await decryptWebhookPayload(
 *   'base64IV::base64EncryptedData',
 *   'uuid-symmetric-key'
 * );
 * const data = JSON.parse(decrypted);
 * ```
 */
export async function decryptWebhookPayload(
  encryptedPayload: string,
  symmetricKey: string
): Promise<string> {
  // Separar IV e dados criptografados
  const parts = encryptedPayload.split('::');
  if (parts.length !== 2) {
    throw new Error('Formato de payload inválido. Esperado: IV::ENCRYPTED_DATA');
  }
  
  const [ivBase64, encryptedBase64] = parts;
  
  // Decodificar Base64
  const iv = base64ToArrayBuffer(ivBase64);
  const encryptedData = base64ToArrayBuffer(encryptedBase64);
  
  // Preparar a chave (UUID para 32 bytes)
  // O Sisprime usa o UUID como chave, precisamos converter para 32 bytes
  const keyBytes = await prepareKey(symmetricKey);
  
  // Importar chave para Web Crypto API
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-CBC' },
    false,
    ['decrypt']
  );
  
  // Decriptar
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: iv.buffer as ArrayBuffer },
    cryptoKey,
    encryptedData.buffer as ArrayBuffer
  );
  
  // Converter para string
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(decryptedBuffer);
}

/**
 * Encripta dados usando AES-256-CBC (para testes)
 * 
 * @param data - Dados a serem criptografados
 * @param symmetricKey - Chave simétrica UUID
 * @returns Payload criptografado no formato "IV::ENCRYPTED_DATA"
 */
export async function encryptData(
  data: string,
  symmetricKey: string
): Promise<string> {
  // Gerar IV aleatório de 16 bytes
  const iv = crypto.getRandomValues(new Uint8Array(16));
  
  // Preparar a chave
  const keyBytes = await prepareKey(symmetricKey);
  
  // Importar chave
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-CBC' },
    false,
    ['encrypt']
  );
  
  // Converter dados para bytes
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  
  // Encriptar
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: iv.buffer as ArrayBuffer },
    cryptoKey,
    dataBytes
  );
  
  // Converter para Base64
  const ivBase64 = arrayBufferToBase64(iv);
  const encryptedBase64 = arrayBufferToBase64(new Uint8Array(encryptedBuffer));
  
  return `${ivBase64}::${encryptedBase64}`;
}

/**
 * Prepara a chave UUID para uso com AES-256 (32 bytes)
 * 
 * O Sisprime usa UUID como chave simétrica. Precisamos converter
 * o UUID para exatamente 32 bytes para AES-256.
 * 
 * Estratégia: Remover hífens do UUID e usar SHA-256 para garantir 32 bytes
 */
async function prepareKey(uuid: string): Promise<Uint8Array> {
  // Remover hífens e converter para bytes
  const cleanUuid = uuid.replace(/-/g, '');
  
  // Se o UUID limpo tem 32 caracteres hex (16 bytes), precisamos expandir para 32 bytes
  // Usamos SHA-256 do UUID para garantir 32 bytes consistentes
  const encoder = new TextEncoder();
  const uuidBytes = encoder.encode(cleanUuid);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', uuidBytes);
  return new Uint8Array(hashBuffer);
}

/**
 * Converte Base64 para ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converte ArrayBuffer para Base64
 */
function arrayBufferToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Gera hash SHA-256 de uma string (para deduplicação de webhooks)
 */
export async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Converter para hex string
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Valida se uma string é um UUID válido
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Gera um UUID v4 aleatório
 */
export function generateUuid(): string {
  return crypto.randomUUID();
}
