// =============================================
// PLANAC ERP - Certificado Digital Service
// Gestão segura de certificados A1/A3
// Multi-tenant ready
// =============================================

// ===== TIPOS =====

export interface CertificadoInfo {
  id?: number;
  cnpj: string;
  tipo: 'A1' | 'A3';
  nome_arquivo?: string;
  hash_arquivo?: string;
  
  // Dados do certificado
  serial_number?: string;
  subject?: string;
  issuer?: string;
  razao_social_certificado?: string;
  cnpj_certificado?: string;
  
  // Validade
  validade_inicio?: string;
  validade_fim?: string;
  dias_para_vencer?: number;
  
  // Status
  status: 'ativo' | 'expirado' | 'revogado' | 'pendente';
  principal: boolean;
  nuvem_fiscal_sync: boolean;
  nuvem_fiscal_sync_at?: string;
  
  // Auditoria
  uploaded_by?: string;
  uploaded_at?: string;
  updated_at?: string;
  
  // Multi-tenant
  tenant_id?: string;
}

export interface CertificadoUploadInput {
  cnpj: string;
  arquivo: ArrayBuffer | Uint8Array;  // Conteúdo do .pfx
  senha: string;
  nome_arquivo?: string;
  definir_como_principal?: boolean;
  sincronizar_nuvem_fiscal?: boolean;
  tenant_id?: string;
  uploaded_by?: string;
}

export interface CertificadoValidacao {
  valido: boolean;
  serial_number?: string;
  subject?: string;
  issuer?: string;
  razao_social?: string;
  cnpj?: string;
  validade_inicio?: string;
  validade_fim?: string;
  dias_para_vencer?: number;
  erro?: string;
}

// ===== INTERFACES =====

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: any;
}

interface R2Bucket {
  put(key: string, value: ArrayBuffer | Uint8Array, options?: R2PutOptions): Promise<R2Object>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
  head(key: string): Promise<R2Object | null>;
}

interface R2PutOptions {
  customMetadata?: Record<string, string>;
}

interface R2Object {
  key: string;
  size: number;
  etag: string;
  uploaded: Date;
  customMetadata?: Record<string, string>;
}

interface R2ObjectBody extends R2Object {
  arrayBuffer(): Promise<ArrayBuffer>;
}

// ===== CRIPTOGRAFIA =====

/**
 * Gera chave de criptografia derivada do tenant
 */
async function gerarChaveCripto(secret: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Criptografa a senha do certificado
 */
async function criptografarSenha(
  senha: string,
  encryptionKey: string,
  cnpj: string
): Promise<{ encrypted: string; iv: string }> {
  const key = await gerarChaveCripto(encryptionKey, cnpj);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(senha)
  );
  
  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/**
 * Descriptografa a senha do certificado
 */
async function descriptografarSenha(
  encrypted: string,
  iv: string,
  encryptionKey: string,
  cnpj: string
): Promise<string> {
  const key = await gerarChaveCripto(encryptionKey, cnpj);
  const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const encryptedBuffer = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    encryptedBuffer
  );
  
  return new TextDecoder().decode(decrypted);
}

/**
 * Gera hash SHA-256 do arquivo
 */
async function gerarHashArquivo(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===== FUNÇÕES PRINCIPAIS =====

/**
 * Faz upload de certificado digital
 */
export async function uploadCertificado(
  db: D1Database,
  r2: R2Bucket,
  encryptionKey: string,
  input: CertificadoUploadInput,
  nuvemFiscalConfig?: {
    clientId: string;
    clientSecret: string;
    ambiente: 'homologacao' | 'producao';
  }
): Promise<CertificadoInfo> {
  const cnpjLimpo = input.cnpj.replace(/\D/g, '');
  
  // 1. Gerar hash do arquivo
  const arquivoBuffer = input.arquivo instanceof ArrayBuffer 
    ? input.arquivo 
    : input.arquivo.buffer;
  const hashArquivo = await gerarHashArquivo(arquivoBuffer);
  
  // 2. Validar certificado (extrair informações)
  // Nota: A validação completa requer biblioteca como node-forge
  // Por ora, vamos confiar nos dados da Nuvem Fiscal após upload
  
  // 3. Criptografar senha
  const { encrypted: senhaEncrypted, iv: senhaIv } = await criptografarSenha(
    input.senha,
    encryptionKey,
    cnpjLimpo
  );
  
  // 4. Salvar no R2 (criptografado com metadados)
  const r2Key = `certificados/${cnpjLimpo}/${hashArquivo}.pfx`;
  await r2.put(r2Key, arquivoBuffer, {
    customMetadata: {
      cnpj: cnpjLimpo,
      nome_arquivo: input.nome_arquivo || 'certificado.pfx',
      uploaded_at: new Date().toISOString(),
      tenant_id: input.tenant_id || '',
    },
  });
  
  // 5. Se definir como principal, remover flag dos outros
  if (input.definir_como_principal) {
    await db
      .prepare('UPDATE empresas_certificados SET principal = 0 WHERE cnpj = ?')
      .bind(cnpjLimpo)
      .run();
  }
  
  // 6. Inserir no D1
  const result = await db
    .prepare(`
      INSERT INTO empresas_certificados (
        cnpj, tipo, nome_arquivo, hash_arquivo,
        r2_key, senha_encrypted, senha_iv,
        status, principal,
        uploaded_by, tenant_id
      ) VALUES (?, 'A1', ?, ?, ?, ?, ?, 'pendente', ?, ?, ?)
    `)
    .bind(
      cnpjLimpo,
      input.nome_arquivo || 'certificado.pfx',
      hashArquivo,
      r2Key,
      senhaEncrypted,
      senhaIv,
      input.definir_como_principal ? 1 : 0,
      input.uploaded_by || null,
      input.tenant_id || null
    )
    .run();
  
  const certificadoId = result.meta?.last_row_id;
  
  // 7. Sincronizar com Nuvem Fiscal (se configurado)
  if (input.sincronizar_nuvem_fiscal && nuvemFiscalConfig) {
    try {
      await sincronizarComNuvemFiscal(
        db,
        cnpjLimpo,
        arquivoBuffer,
        input.senha,
        nuvemFiscalConfig
      );
      
      // Atualizar status
      await db
        .prepare(`
          UPDATE empresas_certificados 
          SET nuvem_fiscal_sync = 1, 
              nuvem_fiscal_sync_at = datetime('now'),
              status = 'ativo',
              updated_at = datetime('now')
          WHERE id = ?
        `)
        .bind(certificadoId)
        .run();
    } catch (error) {
      console.error('Erro ao sincronizar com Nuvem Fiscal:', error);
      // Não falha, apenas marca como não sincronizado
    }
  }
  
  // 8. Retornar informações
  return (await buscarCertificado(db, cnpjLimpo))!;
}

/**
 * Sincroniza certificado com a Nuvem Fiscal
 */
async function sincronizarComNuvemFiscal(
  db: D1Database,
  cnpj: string,
  arquivo: ArrayBuffer,
  senha: string,
  config: {
    clientId: string;
    clientSecret: string;
    ambiente: 'homologacao' | 'producao';
  }
): Promise<void> {
  // Obter token OAuth2
  const tokenResponse = await fetch('https://auth.nuvemfiscal.com.br/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: 'empresa',
    }),
  });
  
  if (!tokenResponse.ok) {
    throw new Error('Falha ao obter token da Nuvem Fiscal');
  }
  
  const { access_token } = await tokenResponse.json() as { access_token: string };
  
  // Upload do certificado
  const baseUrl = config.ambiente === 'producao'
    ? 'https://api.nuvemfiscal.com.br'
    : 'https://api.sandbox.nuvemfiscal.com.br';
  
  const uploadResponse = await fetch(`${baseUrl}/empresas/${cnpj}/certificado`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      certificado: btoa(String.fromCharCode(...new Uint8Array(arquivo))),
      password: senha,
    }),
  });
  
  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Falha ao enviar certificado para Nuvem Fiscal: ${error}`);
  }
  
  // Obter informações do certificado
  const infoResponse = await fetch(`${baseUrl}/empresas/${cnpj}/certificado`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${access_token}` },
  });
  
  if (infoResponse.ok) {
    const info = await infoResponse.json() as any;
    
    // Atualizar D1 com informações do certificado
    await db
      .prepare(`
        UPDATE empresas_certificados SET
          serial_number = ?,
          subject = ?,
          issuer = ?,
          razao_social_certificado = ?,
          cnpj_certificado = ?,
          validade_inicio = ?,
          validade_fim = ?,
          dias_para_vencer = ?,
          updated_at = datetime('now')
        WHERE cnpj = ? AND principal = 1
      `)
      .bind(
        info.serial_number || null,
        info.subject || null,
        info.issuer || null,
        info.razao_social || null,
        info.cnpj || null,
        info.date_not_before || null,
        info.date_not_after || null,
        calcularDiasParaVencer(info.date_not_after),
        cnpj
      )
      .run();
  }
}

/**
 * Busca certificado principal da empresa
 */
export async function buscarCertificado(
  db: D1Database,
  cnpj: string
): Promise<CertificadoInfo | null> {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  const result = await db
    .prepare(`
      SELECT * FROM empresas_certificados 
      WHERE cnpj = ? AND principal = 1 AND status != 'revogado'
      ORDER BY uploaded_at DESC
      LIMIT 1
    `)
    .bind(cnpjLimpo)
    .first<any>();
  
  if (!result) return null;
  
  return mapRowToCertificado(result);
}

/**
 * Lista todos os certificados da empresa
 */
export async function listarCertificados(
  db: D1Database,
  cnpj: string
): Promise<CertificadoInfo[]> {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  const result = await db
    .prepare(`
      SELECT * FROM empresas_certificados 
      WHERE cnpj = ?
      ORDER BY principal DESC, uploaded_at DESC
    `)
    .bind(cnpjLimpo)
    .all<any>();
  
  return (result.results || []).map(mapRowToCertificado);
}

/**
 * Lista certificados próximos do vencimento (para alertas)
 */
export async function listarCertificadosVencendo(
  db: D1Database,
  diasAntecedencia: number = 30,
  tenantId?: string
): Promise<CertificadoInfo[]> {
  const query = tenantId
    ? `SELECT * FROM empresas_certificados 
       WHERE status = 'ativo' AND dias_para_vencer <= ? AND dias_para_vencer > 0 
       AND tenant_id = ?
       ORDER BY dias_para_vencer ASC`
    : `SELECT * FROM empresas_certificados 
       WHERE status = 'ativo' AND dias_para_vencer <= ? AND dias_para_vencer > 0
       ORDER BY dias_para_vencer ASC`;
  
  const result = tenantId
    ? await db.prepare(query).bind(diasAntecedencia, tenantId).all<any>()
    : await db.prepare(query).bind(diasAntecedencia).all<any>();
  
  return (result.results || []).map(mapRowToCertificado);
}

/**
 * Remove certificado
 */
export async function removerCertificado(
  db: D1Database,
  r2: R2Bucket,
  cnpj: string,
  certificadoId: number
): Promise<boolean> {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  // Buscar informações do certificado
  const cert = await db
    .prepare('SELECT r2_key FROM empresas_certificados WHERE id = ? AND cnpj = ?')
    .bind(certificadoId, cnpjLimpo)
    .first<{ r2_key: string }>();
  
  if (!cert) return false;
  
  // Remover do R2
  if (cert.r2_key) {
    try {
      await r2.delete(cert.r2_key);
    } catch (e) {
      console.warn('Erro ao remover arquivo do R2:', e);
    }
  }
  
  // Remover do D1
  const result = await db
    .prepare('DELETE FROM empresas_certificados WHERE id = ? AND cnpj = ?')
    .bind(certificadoId, cnpjLimpo)
    .run();
  
  return (result.meta?.changes || 0) > 0;
}

/**
 * Define certificado como principal
 */
export async function definirCertificadoPrincipal(
  db: D1Database,
  cnpj: string,
  certificadoId: number
): Promise<boolean> {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  // Remover flag principal dos outros
  await db
    .prepare('UPDATE empresas_certificados SET principal = 0, updated_at = datetime(\'now\') WHERE cnpj = ?')
    .bind(cnpjLimpo)
    .run();
  
  // Definir novo principal
  const result = await db
    .prepare('UPDATE empresas_certificados SET principal = 1, updated_at = datetime(\'now\') WHERE id = ? AND cnpj = ?')
    .bind(certificadoId, cnpjLimpo)
    .run();
  
  return (result.meta?.changes || 0) > 0;
}

/**
 * Atualiza status dos certificados (job diário)
 */
export async function atualizarStatusCertificados(
  db: D1Database
): Promise<{ atualizados: number; expirados: number }> {
  // Atualizar dias para vencer
  await db
    .prepare(`
      UPDATE empresas_certificados 
      SET dias_para_vencer = CAST(julianday(validade_fim) - julianday('now') AS INTEGER),
          updated_at = datetime('now')
      WHERE validade_fim IS NOT NULL
    `)
    .run();
  
  // Marcar expirados
  const expirados = await db
    .prepare(`
      UPDATE empresas_certificados 
      SET status = 'expirado', updated_at = datetime('now')
      WHERE status = 'ativo' AND dias_para_vencer <= 0
    `)
    .run();
  
  return {
    atualizados: 1,
    expirados: expirados.meta?.changes || 0,
  };
}

/**
 * Obtém arquivo do certificado para uso (descriptografa senha)
 */
export async function obterCertificadoParaUso(
  db: D1Database,
  r2: R2Bucket,
  encryptionKey: string,
  cnpj: string
): Promise<{ arquivo: ArrayBuffer; senha: string } | null> {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  // Buscar certificado principal
  const cert = await db
    .prepare(`
      SELECT r2_key, senha_encrypted, senha_iv 
      FROM empresas_certificados 
      WHERE cnpj = ? AND principal = 1 AND status = 'ativo'
    `)
    .bind(cnpjLimpo)
    .first<{ r2_key: string; senha_encrypted: string; senha_iv: string }>();
  
  if (!cert) return null;
  
  // Obter arquivo do R2
  const r2Object = await r2.get(cert.r2_key);
  if (!r2Object) return null;
  
  const arquivo = await r2Object.arrayBuffer();
  
  // Descriptografar senha
  const senha = await descriptografarSenha(
    cert.senha_encrypted,
    cert.senha_iv,
    encryptionKey,
    cnpjLimpo
  );
  
  return { arquivo, senha };
}

// ===== HELPERS =====

function calcularDiasParaVencer(dataFim?: string): number | null {
  if (!dataFim) return null;
  const fim = new Date(dataFim);
  const hoje = new Date();
  const diff = fim.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function mapRowToCertificado(row: any): CertificadoInfo {
  return {
    id: row.id,
    cnpj: row.cnpj,
    tipo: row.tipo,
    nome_arquivo: row.nome_arquivo,
    hash_arquivo: row.hash_arquivo,
    serial_number: row.serial_number,
    subject: row.subject,
    issuer: row.issuer,
    razao_social_certificado: row.razao_social_certificado,
    cnpj_certificado: row.cnpj_certificado,
    validade_inicio: row.validade_inicio,
    validade_fim: row.validade_fim,
    dias_para_vencer: row.dias_para_vencer,
    status: row.status,
    principal: row.principal === 1,
    nuvem_fiscal_sync: row.nuvem_fiscal_sync === 1,
    nuvem_fiscal_sync_at: row.nuvem_fiscal_sync_at,
    uploaded_by: row.uploaded_by,
    uploaded_at: row.uploaded_at,
    updated_at: row.updated_at,
    tenant_id: row.tenant_id,
  };
}

export type { D1Database, R2Bucket };
