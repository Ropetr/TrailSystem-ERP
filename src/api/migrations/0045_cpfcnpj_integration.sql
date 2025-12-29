-- =============================================
-- PLANAC ERP - Migration 0045
-- CPF.CNPJ Integration - Cache table for CPF queries
-- =============================================

-- Cache para consultas CPF.CNPJ
-- Reduz custos de API armazenando resultados por período configurável
CREATE TABLE IF NOT EXISTS cpfcnpj_cache (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL,
    documento TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('cpf', 'cnpj')),
    pacote INTEGER NOT NULL,
    payload TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Índice único para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_cpfcnpj_cache_unique 
ON cpfcnpj_cache(empresa_id, documento, tipo, pacote);

-- Índice para busca por documento
CREATE INDEX IF NOT EXISTS idx_cpfcnpj_cache_documento 
ON cpfcnpj_cache(documento);

-- Índice para limpeza de cache antigo
CREATE INDEX IF NOT EXISTS idx_cpfcnpj_cache_fetched 
ON cpfcnpj_cache(fetched_at);
