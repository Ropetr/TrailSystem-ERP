-- =============================================
-- 🔐 PLANAC ERP - Migration 0002
-- Core: Usuários, Perfis, Permissões
-- =============================================
-- Criado em: 09/12/2025
-- Tabelas: 10

-- =============================================
-- 1. PERFIS
-- =============================================
CREATE TABLE IF NOT EXISTS perfis (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL,
    
    -- Identificação
    nome TEXT NOT NULL,
    descricao TEXT,
    
    -- Hierarquia (1=Máximo, 10=Mínimo)
    nivel INTEGER NOT NULL DEFAULT 5,
    
    -- Controle
    padrao INTEGER NOT NULL DEFAULT 0, -- 1=Perfil padrão para novos usuários
    ativo INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    UNIQUE(empresa_id, nome)
);

CREATE INDEX idx_perfis_empresa ON perfis(empresa_id);
CREATE INDEX idx_perfis_ativo ON perfis(ativo);

-- =============================================
-- 2. PERMISSÕES
-- =============================================
CREATE TABLE IF NOT EXISTS permissoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    -- Identificação
    modulo TEXT NOT NULL,  -- clientes, produtos, vendas, etc
    acao TEXT NOT NULL,    -- ver, criar, editar, excluir, aprovar
    descricao TEXT,
    
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(modulo, acao)
);

CREATE INDEX idx_permissoes_modulo ON permissoes(modulo);

-- =============================================
-- 3. PERFIS_PERMISSÕES (N:N)
-- =============================================
CREATE TABLE IF NOT EXISTS perfis_permissoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    perfil_id TEXT NOT NULL,
    permissao_id TEXT NOT NULL,
    
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (perfil_id) REFERENCES perfis(id) ON DELETE CASCADE,
    FOREIGN KEY (permissao_id) REFERENCES permissoes(id) ON DELETE CASCADE,
    UNIQUE(perfil_id, permissao_id)
);

CREATE INDEX idx_perfis_permissoes_perfil ON perfis_permissoes(perfil_id);
CREATE INDEX idx_perfis_permissoes_permissao ON perfis_permissoes(permissao_id);

-- =============================================
-- 4. USUÁRIOS
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL,
    
    -- Identificação
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    senha_hash TEXT NOT NULL,
    
    -- Contato
    telefone TEXT,
    avatar_url TEXT,
    cargo TEXT,
    
    -- Segurança
    ativo INTEGER NOT NULL DEFAULT 1,
    bloqueado INTEGER NOT NULL DEFAULT 0,
    tentativas_login INTEGER NOT NULL DEFAULT 0,
    bloqueado_ate TEXT,
    
    -- 2FA
    two_factor_secret TEXT,
    two_factor_ativo INTEGER NOT NULL DEFAULT 0,
    
    -- Controle
    ultimo_login TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    UNIQUE(email)
);

CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);

-- =============================================
-- 5. USUÁRIOS_PERFIS (N:N com Filial)
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios_perfis (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    usuario_id TEXT NOT NULL,
    perfil_id TEXT NOT NULL,
    filial_id TEXT, -- NULL = todas as filiais
    
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (perfil_id) REFERENCES perfis(id) ON DELETE CASCADE,
    FOREIGN KEY (filial_id) REFERENCES filiais(id) ON DELETE SET NULL,
    UNIQUE(usuario_id, perfil_id, filial_id)
);

CREATE INDEX idx_usuarios_perfis_usuario ON usuarios_perfis(usuario_id);
CREATE INDEX idx_usuarios_perfis_perfil ON usuarios_perfis(perfil_id);
CREATE INDEX idx_usuarios_perfis_filial ON usuarios_perfis(filial_id);

-- =============================================
-- 6. USUÁRIOS_SESSÕES
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios_sessoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    usuario_id TEXT NOT NULL,
    
    -- Sessão
    token_hash TEXT NOT NULL UNIQUE,
    refresh_token_hash TEXT,
    
    -- Metadados
    ip_address TEXT,
    user_agent TEXT,
    device_info TEXT,
    
    -- Controle
    expires_at TEXT NOT NULL,
    revogado INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_usuarios_sessoes_usuario ON usuarios_sessoes(usuario_id);
CREATE INDEX idx_usuarios_sessoes_token ON usuarios_sessoes(token_hash);
CREATE INDEX idx_usuarios_sessoes_expires ON usuarios_sessoes(expires_at);

-- =============================================
-- 7. USUÁRIOS_TOKENS (Reset, 2FA, etc)
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios_tokens (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    usuario_id TEXT NOT NULL,
    
    -- Token
    tipo TEXT NOT NULL, -- reset_senha, verificacao_email, 2fa_backup
    token_hash TEXT NOT NULL UNIQUE,
    
    -- Controle
    usado INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_usuarios_tokens_usuario ON usuarios_tokens(usuario_id);
CREATE INDEX idx_usuarios_tokens_token ON usuarios_tokens(token_hash);
CREATE INDEX idx_usuarios_tokens_tipo ON usuarios_tokens(tipo);

-- =============================================
-- 8. AUDIT_LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL,
    usuario_id TEXT,
    
    -- Ação
    acao TEXT NOT NULL, -- criar, editar, excluir, login, logout, aprovar
    modulo TEXT NOT NULL,
    tabela TEXT,
    registro_id TEXT,
    
    -- Dados
    dados_antes TEXT, -- JSON
    dados_depois TEXT, -- JSON
    descricao TEXT,
    
    -- Metadados
    ip_address TEXT,
    user_agent TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_empresa ON audit_logs(empresa_id);
CREATE INDEX idx_audit_logs_usuario ON audit_logs(usuario_id);
CREATE INDEX idx_audit_logs_modulo ON audit_logs(modulo);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- =============================================
-- 9. NOTIFICAÇÕES
-- =============================================
CREATE TABLE IF NOT EXISTS notificacoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    
    -- Conteúdo
    tipo TEXT NOT NULL, -- info, alerta, erro, sucesso, aprovacao
    titulo TEXT NOT NULL,
    mensagem TEXT,
    link TEXT,
    
    -- Controle
    lida INTEGER NOT NULL DEFAULT 0,
    lida_em TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX idx_notificacoes_created ON notificacoes(created_at);

-- =============================================
-- 10. ALÇADAS DE APROVAÇÃO
-- =============================================
CREATE TABLE IF NOT EXISTS alcadas_aprovacao (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL,
    
    -- Regra
    tipo TEXT NOT NULL, -- desconto, credito, devolucao, compra
    modulo TEXT NOT NULL,
    
    -- Faixas
    valor_minimo REAL NOT NULL DEFAULT 0,
    valor_maximo REAL,
    
    -- Aprovador
    perfil_aprovador_id TEXT NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 1,
    
    -- Controle
    ativo INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (perfil_aprovador_id) REFERENCES perfis(id) ON DELETE CASCADE
);

CREATE INDEX idx_alcadas_empresa ON alcadas_aprovacao(empresa_id);
CREATE INDEX idx_alcadas_tipo ON alcadas_aprovacao(tipo);
CREATE INDEX idx_alcadas_perfil ON alcadas_aprovacao(perfil_aprovador_id);
