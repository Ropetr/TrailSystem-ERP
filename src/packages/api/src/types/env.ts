// =============================================
// PLANAC ERP - Environment Types
// Tipagem do ambiente Cloudflare Workers
// Atualizado: 16/12/2025 - Adicionados bindings faltantes
// =============================================

/**
 * Bindings do ambiente Cloudflare
 */
export interface Env {
  // ===== D1 Databases =====
  /** Banco de dados principal */
  DB: D1Database;
  /** Banco de dados IBPT (Lei da Transparencia) */
  DB_IBPT: D1Database;

  // ===== R2 Buckets =====
  /** Storage geral (arquivos, anexos) */
  STORAGE: R2Bucket;
  /** Storage especifico para certificados digitais */
  CERTIFICADOS_BUCKET: R2Bucket;
  /** Storage para imagens de produtos */
  IMAGES: R2Bucket;
  /** Storage para midia do CMS/E-commerce */
  CMS_MEDIA: R2Bucket;

  // ===== KV Namespaces =====
  /** Cache geral (tokens OAuth, etc) */
  CACHE: KVNamespace;
  /** Sessoes de usuarios */
  SESSIONS: KVNamespace;
  /** Rate limiting */
  RATE_LIMIT: KVNamespace;

  // ===== Secrets (configurar via wrangler secret put) =====
  /** Chave mestra para criptografia de senhas de certificados */
  ENCRYPTION_KEY: string;

  /** Nuvem Fiscal - Client ID OAuth */
  NUVEM_FISCAL_CLIENT_ID: string;
  /** Nuvem Fiscal - Client Secret OAuth */
  NUVEM_FISCAL_CLIENT_SECRET: string;

  /** IBPT - Token da API (opcional, pode usar por empresa) */
  IBPT_TOKEN?: string;

  /** JWT Secret para autenticacao */
  JWT_SECRET: string;

  /** Chave para validar chamadas de cron jobs */
  CRON_SECRET: string;

  // ===== Email (Resend) =====
  /** Resend API Key */
  EMAIL_API_KEY?: string;
  /** Email remetente padrao */
  EMAIL_FROM?: string;

  // ===== WhatsApp (API Brasil ou similar) =====
  /** API Key para envio de WhatsApp */
  WHATSAPP_API_KEY?: string;

  // ===== Push Notifications (Firebase) =====
  /** Firebase Server Key */
  FIREBASE_SERVER_KEY?: string;

  // ===== Variaveis de ambiente =====
  /** Ambiente atual: development, staging, production */
  ENVIRONMENT: 'development' | 'staging' | 'production';
  /** Ambiente Nuvem Fiscal: homologacao, producao */
  NUVEM_FISCAL_AMBIENTE: 'homologacao' | 'producao';
  /** Nivel de log: debug, info, warn, error */
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  /** URL da API Nuvem Fiscal */
  NUVEM_FISCAL_URL: string;

  // ===== Multi-tenant =====
  /** ID do tenant padrao (para instalacao single-tenant) */
  DEFAULT_TENANT_ID?: string;
}

/**
 * Contexto de execucao
 */
export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

/**
 * Scheduled Event (para cron triggers)
 */
export interface ScheduledEvent {
  cron: string;
  scheduledTime: number;
}

/**
 * Configuracao da Nuvem Fiscal derivada do ambiente
 */
export function getNuvemFiscalConfig(env: Env) {
  return {
    clientId: env.NUVEM_FISCAL_CLIENT_ID,
    clientSecret: env.NUVEM_FISCAL_CLIENT_SECRET,
    ambiente: env.NUVEM_FISCAL_AMBIENTE,
    baseUrl: env.NUVEM_FISCAL_URL || (
      env.NUVEM_FISCAL_AMBIENTE === 'producao'
        ? 'https://api.nuvemfiscal.com.br'
        : 'https://api.sandbox.nuvemfiscal.com.br'
    ),
  };
}

/**
 * Verifica se esta em producao
 */
export function isProduction(env: Env): boolean {
  return env.ENVIRONMENT === 'production';
}

/**
 * Verifica se deve logar no nivel especificado
 */
export function shouldLog(env: Env, level: 'debug' | 'info' | 'warn' | 'error'): boolean {
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevel = levels.indexOf(env.LOG_LEVEL || 'info');
  const checkLevel = levels.indexOf(level);
  return checkLevel >= currentLevel;
}

/**
 * Logger helper
 */
export function createLogger(env: Env, module: string) {
  return {
    debug: (msg: string, ...args: any[]) => {
      if (shouldLog(env, 'debug')) console.log(`[${module}] ${msg}`, ...args);
    },
    info: (msg: string, ...args: any[]) => {
      if (shouldLog(env, 'info')) console.log(`[${module}] ${msg}`, ...args);
    },
    warn: (msg: string, ...args: any[]) => {
      if (shouldLog(env, 'warn')) console.warn(`[${module}] ${msg}`, ...args);
    },
    error: (msg: string, ...args: any[]) => {
      if (shouldLog(env, 'error')) console.error(`[${module}] ${msg}`, ...args);
    },
  };
}
