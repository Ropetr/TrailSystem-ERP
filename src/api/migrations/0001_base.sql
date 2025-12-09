-- =============================================
-- 🏢 PLANAC ERP - Migration 0001
-- Base: Empresas, Filiais, Configurações
-- =============================================
-- Criado em: 09/12/2025
-- Tabelas: 3

-- =============================================
-- 1. EMPRESAS (Multi-tenant)
-- =============================================
CREATE TABLE IF NOT EXISTS empresas (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    -- Identificação
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT NOT NULL UNIQUE,
    inscricao_estadual TEXT,
    inscricao_municipal TEXT,
    
    -- Regime Tributário
    -- 1=Simples Nacional, 2=Simples Excesso, 3=Lucro Presumido, 4=Lucro Real
    regime_tributario INTEGER NOT NULL DEFAULT 1,
    
    -- Endereço
    cep TEXT,
    logradouro TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT,
    ibge TEXT,
    
    -- Contato
    telefone TEXT,
    email TEXT,
    site TEXT,
    
    -- Configurações
    logo_url TEXT,
    certificado_digital TEXT, -- Base64 do certificado A1
    certificado_validade TEXT,
    
    -- Controle
    ativo INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_empresas_cnpj ON empresas(cnpj);
CREATE INDEX idx_empresas_ativo ON empresas(ativo);

-- =============================================
-- 2. FILIAIS
-- =============================================
CREATE TABLE IF NOT EXISTS filiais (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL,
    
    -- Identificação
    nome TEXT NOT NULL,
    cnpj TEXT, -- Se filial tiver CNPJ próprio
    inscricao_estadual TEXT,
    
    -- Tipo
    -- 1=Matriz, 2=Filial, 3=CD, 4=Loja
    tipo INTEGER NOT NULL DEFAULT 2,
    
    -- Endereço
    cep TEXT,
    logradouro TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT,
    ibge TEXT,
    
    -- Contato
    telefone TEXT,
    email TEXT,
    
    -- Controle
    ativo INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE INDEX idx_filiais_empresa ON filiais(empresa_id);
CREATE INDEX idx_filiais_ativo ON filiais(ativo);

-- =============================================
-- 3. CONFIGURAÇÕES
-- =============================================
CREATE TABLE IF NOT EXISTS configuracoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL,
    
    -- Chave/Valor
    chave TEXT NOT NULL,
    valor TEXT,
    tipo TEXT NOT NULL DEFAULT 'string', -- string, number, boolean, json
    descricao TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    UNIQUE(empresa_id, chave)
);

CREATE INDEX idx_configuracoes_empresa ON configuracoes(empresa_id);
CREATE INDEX idx_configuracoes_chave ON configuracoes(chave);

-- =============================================
-- Configurações Padrão (inserir após criar empresa)
-- =============================================
-- Serão inseridas via seed ou API ao criar empresa
