// =============================================
// PLANAC ERP - Environment Types
// Tipagem do ambiente Cloudflare Workers
// =============================================

/**
 * Bindings do ambiente Cloudflare
 */
export interface Env {
  // ===== D1 Databases =====
  /** Banco de dados principal */
  DB: D1Database;
  /** Banco de dados IBPT (Lei da Transparência) */
  DB_IBPT: D1Database;

  // ===== R2 Buckets =====
  /** Storage geral (arquivos, anexos) */
  STORAGE: R2Bucket;
  /** Storage específico para certificados digitais */
  CERTIFICADOS_BUCKET: R2Bucket;

  // ===== KV Namespaces =====
  /** Cache geral (tokens OAuth, sessões, etc) */
  CACHE: KVNamespace;

  // ===== Secrets (configurar via wrangler secret put) =====
  /** Chave mestra para criptografia de senhas de certificados */
  ENCRYPTION_KEY: string;

  /** Nuvem Fiscal - Client ID OAuth */
  NUVEM_FISCAL_CLIENT_ID: string;
  /** Nuvem Fiscal - Client Secret OAuth */
  NUVEM_FISCAL_CLIENT_SECRET: string;

  /** IBPT - Token da API (opcional, pode usar tabela local) */
  IBPT_TOKEN?: string;

  /** JWT Secret para autenticação */
  JWT_SECRET: string;

  /** Chave para validar chamadas de cron jobs */
  CRON_SECRET: string;

  // ===== Variáveis de ambiente =====
  /** Ambiente atual: development, staging, production */
  ENVIRONMENT: 'development' | 'staging' | 'production';
  /** Ambiente Nuvem Fiscal: homologacao, producao */
  NUVEM_FISCAL_AMBIENTE: 'homologacao' | 'producao';
  /** Nível de log: debug, info, warn, error */
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';

  // ===== Configurações de Email (para notificações) =====
  /** Resend API Key (ou outro provedor) */
  EMAIL_API_KEY?: string;
  /** Email remetente padrão */
  EMAIL_FROM?: string;

  // ===== Configurações de Push (para notificações) =====
  /** Firebase Server Key (para push notifications) */
  FIREBASE_SERVER_KEY?: string;

  // ===== Multi-tenant =====
  /** ID do tenant padrão (para instalação single-tenant) */
  DEFAULT_TENANT_ID?: string;
}

/**
 * Contexto de execução
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
 * Configuração da Nuvem Fiscal derivada do ambiente
 */
export function getNuvemFiscalConfig(env: Env) {
  return {
    clientId: env.NUVEM_FISCAL_CLIENT_ID,
    clientSecret: env.NUVEM_FISCAL_CLIENT_SECRET,
    ambiente: env.NUVEM_FISCAL_AMBIENTE,
    baseUrl: env.NUVEM_FISCAL_AMBIENTE === 'producao'
      ? 'https://api.nuvemfiscal.com.br'
      : 'https://api.sandbox.nuvemfiscal.com.br',
  };
}

/**
 * Verifica se está em produção
 */
export function isProduction(env: Env): boolean {
  return env.ENVIRONMENT === 'production';
}

/**
 * Verifica se deve logar no nível especificado
 */
export function shouldLog(env: Env, level: 'debug' | 'info' | 'warn' | 'error'): boolean {
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevel = levels.indexOf(env.LOG_LEVEL || 'info');
  const checkLevel = levels.indexOf(level);
  return checkLevel >= currentLevel;
}
