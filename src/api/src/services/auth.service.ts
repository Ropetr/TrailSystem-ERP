// =============================================
// 🔐 PLANAC ERP - Serviço de Autenticação
// =============================================
// Arquivo: src/api/src/services/auth.service.ts

import { Context } from 'hono';
import { sign, verify } from 'hono/jwt';

// Tipos
export interface JWTPayload {
  sub: string;           // usuario_id
  email: string;
  empresa_id: string;
  perfis: string[];      // IDs dos perfis
  permissoes: string[];  // Lista de permissões
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    empresa_id: string;
    avatar_url?: string;
    perfis: { id: string; nome: string }[];
  };
  error?: string;
}

// =============================================
// FUNÇÕES DE HASH (usando Web Crypto API)
// =============================================

export async function hashSenha(senha: string): Promise<string> {
  // Gerar salt aleatório
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Criar hash com PBKDF2
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(senha),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Retornar salt:hash
  return `${saltHex}:${hashHex}`;
}

export async function verificarSenha(senha: string, hashArmazenado: string): Promise<boolean> {
  const [saltHex, hashOriginal] = hashArmazenado.split(':');
  
  if (!saltHex || !hashOriginal) return false;
  
  // Converter salt de hex para Uint8Array
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  
  // Gerar hash da senha fornecida
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(senha),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex === hashOriginal;
}

// =============================================
// FUNÇÕES DE TOKEN
// =============================================

export async function gerarToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: number = 8 * 60 * 60 // 8 horas padrão
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };
  
  return await sign(fullPayload, secret);
}

export async function gerarRefreshToken(
  usuarioId: string,
  secret: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  return await sign({
    sub: usuarioId,
    type: 'refresh',
    iat: now,
    exp: now + (30 * 24 * 60 * 60) // 30 dias
  }, secret);
}

export async function verificarToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const payload = await verify(token, secret) as JWTPayload;
    return payload;
  } catch {
    return null;
  }
}

// =============================================
// FUNÇÕES DE SESSÃO
// =============================================

export async function criarSessao(
  db: D1Database,
  kv: KVNamespace,
  usuarioId: string,
  tokenHash: string,
  refreshTokenHash: string,
  ip: string,
  userAgent: string
): Promise<string> {
  const sessaoId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // 8 horas
  
  // Salvar no D1
  await db.prepare(`
    INSERT INTO usuarios_sessoes (id, usuario_id, token_hash, refresh_token_hash, ip_address, user_agent, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(sessaoId, usuarioId, tokenHash, refreshTokenHash, ip, userAgent, expiresAt).run();
  
  // Cache no KV (para validação rápida)
  await kv.put(`session:${tokenHash}`, JSON.stringify({
    usuario_id: usuarioId,
    expires_at: expiresAt
  }), { expirationTtl: 8 * 60 * 60 }); // 8 horas
  
  return sessaoId;
}

export async function revogarSessao(
  db: D1Database,
  kv: KVNamespace,
  tokenHash: string
): Promise<void> {
  await db.prepare(`
    UPDATE usuarios_sessoes SET revogado = 1 WHERE token_hash = ?
  `).bind(tokenHash).run();
  
  await kv.delete(`session:${tokenHash}`);
}

export async function revogarTodasSessoes(
  db: D1Database,
  kv: KVNamespace,
  usuarioId: string
): Promise<void> {
  // Buscar todas as sessões do usuário
  const sessoes = await db.prepare(`
    SELECT token_hash FROM usuarios_sessoes WHERE usuario_id = ? AND revogado = 0
  `).bind(usuarioId).all();
  
  // Revogar no D1
  await db.prepare(`
    UPDATE usuarios_sessoes SET revogado = 1 WHERE usuario_id = ?
  `).bind(usuarioId).run();
  
  // Remover do KV
  for (const sessao of sessoes.results) {
    await kv.delete(`session:${sessao.token_hash}`);
  }
}

// =============================================
// HASH SIMPLES PARA TOKENS
// =============================================

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// =============================================
// AUDITORIA
// =============================================

export async function registrarAuditoria(
  db: D1Database,
  empresaId: string,
  usuarioId: string | null,
  acao: string,
  modulo: string,
  descricao: string,
  ip: string,
  userAgent: string,
  tabela?: string,
  registroId?: string,
  dadosAntes?: object,
  dadosDepois?: object
): Promise<void> {
  await db.prepare(`
    INSERT INTO audit_logs (
      id, empresa_id, usuario_id, acao, modulo, tabela, registro_id,
      dados_antes, dados_depois, descricao, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    empresaId,
    usuarioId,
    acao,
    modulo,
    tabela || null,
    registroId || null,
    dadosAntes ? JSON.stringify(dadosAntes) : null,
    dadosDepois ? JSON.stringify(dadosDepois) : null,
    descricao,
    ip,
    userAgent
  ).run();
}
