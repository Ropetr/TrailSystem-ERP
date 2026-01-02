-- Migration: Platform Admins e Email Verifications
-- Descrição: Tabelas para administradores da plataforma TrailSystem e verificação de email
-- Data: 2026-01-02

-- =====================================================
-- PLATFORM ADMINS
-- Administradores da plataforma TrailSystem (não são usuários de empresa)
-- =====================================================

CREATE TABLE IF NOT EXISTS platform_admins (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    nome TEXT NOT NULL,
    ativo INTEGER NOT NULL DEFAULT 1,
    ultimo_login TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Índices para platform_admins
CREATE INDEX IF NOT EXISTS idx_platform_admins_email ON platform_admins(email);
CREATE INDEX IF NOT EXISTS idx_platform_admins_ativo ON platform_admins(ativo);

-- =====================================================
-- EMAIL VERIFICATIONS
-- Verificação de email para novos usuários
-- =====================================================

CREATE TABLE IF NOT EXISTS email_verifications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    tentativas INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL,
    verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Índices para email_verifications
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON email_verifications(expires_at);

-- =====================================================
-- SEED: Admin inicial da plataforma
-- =====================================================

INSERT OR IGNORE INTO platform_admins (id, email, senha_hash, nome, ativo, created_at, updated_at)
VALUES (
    'admin001',
    'admin@trailsystem.com.br',
    '83d9dccc5b85c68119bfa378bbdc3898:e6a29755b3092281af95a348ee53cb6622a437a85324967332d57b6869dee041',
    'Administrador TrailSystem',
    1,
    datetime('now'),
    datetime('now')
);
