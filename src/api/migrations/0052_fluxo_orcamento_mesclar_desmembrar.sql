-- =============================================
-- TRAILSYSTEM ERP - Migration 0052: Fluxo de Orçamento (Mesclar/Desmembrar)
-- Suporte a orçamentos pai/filho, histórico de mesclagem e desmembramento
-- =============================================

-- =============================================
-- ADICIONAR COLUNAS PARA RELACIONAMENTO PAI/FILHO
-- =============================================

-- Adicionar coluna para orçamento pai (quando desmembrado)
ALTER TABLE orcamentos ADD COLUMN orcamento_pai_id TEXT REFERENCES orcamentos(id);

-- Adicionar coluna para número do filho (.1, .2, etc)
ALTER TABLE orcamentos ADD COLUMN numero_filho INTEGER;

-- Adicionar coluna para tipo de origem
ALTER TABLE orcamentos ADD COLUMN origem TEXT DEFAULT 'direto' CHECK (origem IN ('direto', 'mesclado', 'desmembrado', 'duplicado'));

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_orcamentos_pai ON orcamentos(orcamento_pai_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_origem ON orcamentos(origem);

-- =============================================
-- HISTÓRICO DE MESCLAGEM
-- Registra todas as operações de mesclagem
-- =============================================

CREATE TABLE IF NOT EXISTS orcamentos_mesclagem_historico (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Orçamento resultante
    orcamento_resultado_id TEXT NOT NULL REFERENCES orcamentos(id),
    
    -- Orçamentos de origem (JSON array)
    orcamentos_origem_ids TEXT NOT NULL, -- JSON: ["id1", "id2", ...]
    
    -- Configuração usada
    regra_preco TEXT NOT NULL CHECK (regra_preco IN ('menor', 'maior', 'recente', 'manual')),
    cliente_id TEXT NOT NULL REFERENCES clientes(id),
    
    -- Usuário que executou
    usuario_id TEXT REFERENCES usuarios(id),
    
    -- Observações
    observacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mesclagem_hist_empresa ON orcamentos_mesclagem_historico(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mesclagem_hist_resultado ON orcamentos_mesclagem_historico(orcamento_resultado_id);

-- =============================================
-- HISTÓRICO DE DESMEMBRAMENTO
-- Registra todas as operações de desmembramento
-- =============================================

CREATE TABLE IF NOT EXISTS orcamentos_desmembramento_historico (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Orçamento pai
    orcamento_pai_id TEXT NOT NULL REFERENCES orcamentos(id),
    
    -- Orçamentos filhos criados (JSON array)
    orcamentos_filhos_ids TEXT NOT NULL, -- JSON: ["id1", "id2", ...]
    
    -- Usuário que executou
    usuario_id TEXT REFERENCES usuarios(id),
    
    -- Observações
    observacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_desmembramento_hist_empresa ON orcamentos_desmembramento_historico(empresa_id);
CREATE INDEX IF NOT EXISTS idx_desmembramento_hist_pai ON orcamentos_desmembramento_historico(orcamento_pai_id);

-- =============================================
-- VIEW DE ORÇAMENTOS COM FILHOS
-- =============================================

CREATE VIEW IF NOT EXISTS vw_orcamentos_com_filhos AS
SELECT 
    o.*,
    (SELECT COUNT(*) FROM orcamentos f WHERE f.orcamento_pai_id = o.id) as total_filhos,
    (SELECT GROUP_CONCAT(f.numero || '.' || f.numero_filho, ', ') FROM orcamentos f WHERE f.orcamento_pai_id = o.id) as numeros_filhos
FROM orcamentos o
WHERE o.orcamento_pai_id IS NULL;

-- =============================================
-- VIEW DE ORÇAMENTOS FILHOS
-- =============================================

CREATE VIEW IF NOT EXISTS vw_orcamentos_filhos AS
SELECT 
    f.*,
    p.numero as numero_pai,
    p.cliente_id as cliente_pai_id,
    c.razao_social as cliente_pai_nome
FROM orcamentos f
JOIN orcamentos p ON p.id = f.orcamento_pai_id
LEFT JOIN clientes c ON c.id = p.cliente_id
WHERE f.orcamento_pai_id IS NOT NULL;
