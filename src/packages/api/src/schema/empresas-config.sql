-- =============================================
-- PLANAC ERP - Empresas Config Schema
-- Configurações locais das empresas (D1)
-- =============================================

-- Tabela de configurações extras das empresas
CREATE TABLE IF NOT EXISTS empresas_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Identificação
    cnpj TEXT NOT NULL UNIQUE,
    razao_social TEXT,
    nome_fantasia TEXT,
    
    -- IBPT (Lei da Transparência Fiscal)
    ibpt_token TEXT,                      -- Token da API IBPT
    ibpt_uf TEXT DEFAULT 'PR',            -- UF para consulta IBPT
    
    -- Configurações fiscais locais
    regime_tributario INTEGER DEFAULT 1,  -- 1=Simples, 2=SN Excesso, 3=Normal
    ambiente_fiscal TEXT DEFAULT 'homologacao',  -- homologacao, producao
    
    -- Séries e numeração (backup local)
    nfe_serie INTEGER DEFAULT 1,
    nfe_proximo_numero INTEGER DEFAULT 1,
    nfce_serie INTEGER DEFAULT 1,
    nfce_proximo_numero INTEGER DEFAULT 1,
    
    -- Configurações de impressão
    logo_url TEXT,                        -- URL do logo para DANFE
    danfe_tipo INTEGER DEFAULT 1,         -- 1=Retrato, 2=Paisagem
    
    -- Informações padrão para notas
    natureza_operacao_padrao TEXT DEFAULT 'VENDA DE MERCADORIA',
    informacoes_complementares_padrao TEXT,
    
    -- Integração com módulo de vendas
    emitir_nfe_automatico INTEGER DEFAULT 0,  -- 0=Não, 1=Sim
    enviar_email_automatico INTEGER DEFAULT 0, -- 0=Não, 1=Sim
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_empresas_config_cnpj ON empresas_config(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_config_ativo ON empresas_config(ativo);

-- Exemplo de uso:
-- INSERT INTO empresas_config (cnpj, razao_social, ibpt_token, ibpt_uf) 
-- VALUES ('12345678000190', 'PLANAC DISTRIBUIDORA LTDA', 'seu-token-ibpt', 'PR');
