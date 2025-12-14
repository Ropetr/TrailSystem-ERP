-- =============================================
-- PLANAC ERP - Schema IBPT
-- Tabelas para Lei da Transparência (12.741/2012)
-- =============================================

-- ===== CACHE DE CONSULTAS API =====
CREATE TABLE IF NOT EXISTS ibpt_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL,              -- NCM (8 dígitos) ou NBS (9 dígitos)
    tipo TEXT DEFAULT 'NCM',           -- NCM ou NBS
    uf TEXT NOT NULL,                  -- UF (2 caracteres)
    ex INTEGER DEFAULT 0,              -- Exceção tarifária
    descricao TEXT,                    -- Descrição do produto/serviço
    
    -- Alíquotas (em percentual)
    aliquota_nacional REAL DEFAULT 0,  -- Federal (produto nacional)
    aliquota_importado REAL DEFAULT 0, -- Federal (produto importado)
    aliquota_estadual REAL DEFAULT 0,  -- Estadual (ICMS)
    aliquota_municipal REAL DEFAULT 0, -- Municipal (ISS)
    
    -- Vigência
    vigencia_inicio TEXT,              -- Data início vigência (ISO 8601)
    vigencia_fim TEXT,                 -- Data fim vigência (ISO 8601)
    versao TEXT,                       -- Versão da tabela IBPT
    fonte TEXT,                        -- Fonte dos dados
    
    -- Controle de cache
    consultado_em TEXT,                -- Data da primeira consulta
    atualizado_em TEXT,                -- Data da última atualização
    
    UNIQUE(codigo, uf, ex)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ibpt_cache_codigo ON ibpt_cache(codigo);
CREATE INDEX IF NOT EXISTS idx_ibpt_cache_uf ON ibpt_cache(uf);
CREATE INDEX IF NOT EXISTS idx_ibpt_cache_vigencia ON ibpt_cache(vigencia_fim);
CREATE INDEX IF NOT EXISTS idx_ibpt_cache_tipo ON ibpt_cache(tipo);
CREATE INDEX IF NOT EXISTS idx_ibpt_cache_codigo_uf ON ibpt_cache(codigo, uf);

-- ===== HISTÓRICO DE IMPORTAÇÕES =====
CREATE TABLE IF NOT EXISTS ibpt_importacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uf TEXT NOT NULL,
    versao TEXT,
    vigencia_fim TEXT,
    registros_total INTEGER DEFAULT 0,
    registros_inseridos INTEGER DEFAULT 0,
    registros_erro INTEGER DEFAULT 0,
    importado_em TEXT DEFAULT (datetime('now')),
    fonte TEXT DEFAULT 'CSV'           -- CSV, API
);

CREATE INDEX IF NOT EXISTS idx_ibpt_import_uf ON ibpt_importacoes(uf);
CREATE INDEX IF NOT EXISTS idx_ibpt_import_data ON ibpt_importacoes(importado_em);

-- ===== ALÍQUOTAS NCM (Importação CSV) =====
CREATE TABLE IF NOT EXISTS ibpt_aliquotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ncm TEXT NOT NULL,
    ex INTEGER DEFAULT 0,
    tipo INTEGER DEFAULT 0,            -- 0=NCM, 1=NBS, 2=LC116
    descricao TEXT,
    nacional_federal REAL DEFAULT 0,
    importados_federal REAL DEFAULT 0,
    estadual REAL DEFAULT 0,
    municipal REAL DEFAULT 0,
    vigencia_inicio TEXT,
    vigencia_fim TEXT,
    chave TEXT,
    versao TEXT,
    fonte TEXT,
    uf TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ibpt_aliq_ncm ON ibpt_aliquotas(ncm);
CREATE INDEX IF NOT EXISTS idx_ibpt_aliq_uf ON ibpt_aliquotas(uf);
CREATE INDEX IF NOT EXISTS idx_ibpt_aliq_ncm_uf ON ibpt_aliquotas(ncm, uf);

-- ===== NBS (Serviços) =====
CREATE TABLE IF NOT EXISTS ibpt_nbs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nbs TEXT NOT NULL,
    descricao TEXT,
    nacional_federal REAL DEFAULT 0,
    importados_federal REAL DEFAULT 0,
    estadual REAL DEFAULT 0,
    municipal REAL DEFAULT 0,
    vigencia_inicio TEXT,
    vigencia_fim TEXT,
    versao TEXT,
    fonte TEXT,
    uf TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ibpt_nbs_codigo ON ibpt_nbs(nbs);
CREATE INDEX IF NOT EXISTS idx_ibpt_nbs_uf ON ibpt_nbs(uf);
