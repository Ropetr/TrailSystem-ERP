-- =============================================
-- PLANAC ERP - IBPT Database Schema
-- Tabela para Lei da Transparência Fiscal
-- =============================================

-- Tabela principal de alíquotas IBPT
CREATE TABLE IF NOT EXISTS ibpt_aliquotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Identificação do produto/serviço
    ncm TEXT NOT NULL,                    -- Código NCM (8 dígitos)
    ex TEXT DEFAULT '',                   -- Exceção tarifária
    tipo INTEGER DEFAULT 0,               -- 0=Nacional, 1=Importado
    uf TEXT NOT NULL,                     -- UF do estado
    
    -- Descrição
    descricao TEXT,
    
    -- Alíquotas (%)
    aliquota_nacional_federal REAL DEFAULT 0,
    aliquota_importado_federal REAL DEFAULT 0,
    aliquota_estadual REAL DEFAULT 0,
    aliquota_municipal REAL DEFAULT 0,
    
    -- Vigência
    vigencia_inicio TEXT,
    vigencia_fim TEXT,
    
    -- Metadados
    chave_ibpt TEXT,                      -- Chave original da tabela
    versao TEXT,                          -- Versão da tabela
    fonte TEXT DEFAULT 'IBPT',            -- Fonte dos dados
    
    -- Controle
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    -- Índice único para evitar duplicatas
    UNIQUE(ncm, ex, uf, tipo)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ibpt_ncm ON ibpt_aliquotas(ncm);
CREATE INDEX IF NOT EXISTS idx_ibpt_uf ON ibpt_aliquotas(uf);
CREATE INDEX IF NOT EXISTS idx_ibpt_ncm_uf ON ibpt_aliquotas(ncm, uf);
CREATE INDEX IF NOT EXISTS idx_ibpt_vigencia ON ibpt_aliquotas(vigencia_inicio, vigencia_fim);

-- Tabela para NBS (serviços)
CREATE TABLE IF NOT EXISTS ibpt_nbs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Identificação do serviço
    nbs TEXT NOT NULL,                    -- Código NBS (9 dígitos)
    uf TEXT NOT NULL,                     -- UF do estado
    
    -- Descrição
    descricao TEXT,
    
    -- Alíquotas (%)
    aliquota_federal REAL DEFAULT 0,
    aliquota_municipal REAL DEFAULT 0,
    
    -- Vigência
    vigencia_inicio TEXT,
    vigencia_fim TEXT,
    
    -- Metadados
    versao TEXT,
    fonte TEXT DEFAULT 'IBPT',
    
    -- Controle
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    -- Índice único
    UNIQUE(nbs, uf)
);

CREATE INDEX IF NOT EXISTS idx_ibpt_nbs ON ibpt_nbs(nbs);
CREATE INDEX IF NOT EXISTS idx_ibpt_nbs_uf ON ibpt_nbs(nbs, uf);

-- Tabela de metadados das importações
CREATE TABLE IF NOT EXISTS ibpt_importacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    uf TEXT NOT NULL,
    versao TEXT NOT NULL,
    total_registros INTEGER DEFAULT 0,
    total_nbs INTEGER DEFAULT 0,
    
    vigencia_inicio TEXT,
    vigencia_fim TEXT,
    
    arquivo_origem TEXT,
    hash_arquivo TEXT,
    
    importado_em TEXT DEFAULT (datetime('now')),
    importado_por TEXT,
    
    status TEXT DEFAULT 'concluido',      -- pendente, processando, concluido, erro
    mensagem_erro TEXT
);

CREATE INDEX IF NOT EXISTS idx_ibpt_importacoes_uf ON ibpt_importacoes(uf);

-- View para consulta simplificada
CREATE VIEW IF NOT EXISTS v_ibpt_consulta AS
SELECT 
    ncm,
    ex,
    uf,
    descricao,
    CASE 
        WHEN tipo = 0 THEN aliquota_nacional_federal 
        ELSE aliquota_importado_federal 
    END as aliquota_federal,
    aliquota_estadual,
    aliquota_municipal,
    (CASE 
        WHEN tipo = 0 THEN aliquota_nacional_federal 
        ELSE aliquota_importado_federal 
    END + aliquota_estadual + aliquota_municipal) as aliquota_total,
    tipo,
    vigencia_inicio,
    vigencia_fim,
    chave_ibpt,
    versao,
    fonte
FROM ibpt_aliquotas
WHERE vigencia_fim >= date('now') OR vigencia_fim IS NULL;

-- Procedure para limpar registros antigos
-- (executar via aplicação)
-- DELETE FROM ibpt_aliquotas WHERE vigencia_fim < date('now', '-30 days');
