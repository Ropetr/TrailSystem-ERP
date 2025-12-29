-- =============================================
-- PLANAC ERP - CNPjá Integration
-- Integração com API CNPjá para consulta de CNPJ
-- =============================================

-- Tabela de cache para consultas CNPjá
CREATE TABLE IF NOT EXISTS cnpja_cache (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    tax_id TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('office', 'simples', 'suframa', 'zip')),
    payload TEXT NOT NULL,
    source_updated TEXT,
    fetched_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(empresa_id, tax_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_cnpja_cache_empresa ON cnpja_cache(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cnpja_cache_tax_id ON cnpja_cache(tax_id);
CREATE INDEX IF NOT EXISTS idx_cnpja_cache_fetched ON cnpja_cache(fetched_at);

-- Adicionar campos fiscais na tabela de clientes
-- indicador_ie: 1=Contribuinte ICMS, 2=Contribuinte isento, 9=Não Contribuinte
ALTER TABLE clientes ADD COLUMN indicador_ie INTEGER DEFAULT 9;

-- consumidor_final: 0=Normal, 1=Consumidor final
ALTER TABLE clientes ADD COLUMN consumidor_final INTEGER DEFAULT 0;

-- regime_tributario: simples, lucro_presumido, lucro_real
ALTER TABLE clientes ADD COLUMN regime_tributario TEXT;

-- simples_optante: 0=Não, 1=Sim (optante pelo Simples Nacional)
ALTER TABLE clientes ADD COLUMN simples_optante INTEGER DEFAULT 0;

-- Rastreamento da fonte dos dados fiscais
ALTER TABLE clientes ADD COLUMN fonte_regime TEXT;
ALTER TABLE clientes ADD COLUMN regime_atualizado_em TEXT;

-- Campos adicionais para dados do CNPjá
ALTER TABLE clientes ADD COLUMN cnae_principal TEXT;
ALTER TABLE clientes ADD COLUMN cnae_principal_descricao TEXT;
ALTER TABLE clientes ADD COLUMN natureza_juridica TEXT;
ALTER TABLE clientes ADD COLUMN porte_empresa TEXT;
ALTER TABLE clientes ADD COLUMN situacao_cadastral TEXT;
ALTER TABLE clientes ADD COLUMN data_situacao TEXT;
ALTER TABLE clientes ADD COLUMN capital_social REAL;

-- Índices para consultas fiscais
CREATE INDEX IF NOT EXISTS idx_clientes_indicador_ie ON clientes(indicador_ie);
CREATE INDEX IF NOT EXISTS idx_clientes_regime ON clientes(regime_tributario);
CREATE INDEX IF NOT EXISTS idx_clientes_simples ON clientes(simples_optante);
