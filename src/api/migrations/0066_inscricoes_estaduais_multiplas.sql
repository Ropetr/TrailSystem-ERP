-- =============================================
-- PLANAC ERP - Migration 0066
-- Múltiplas Inscrições Estaduais por CNPJ/UF
-- Suporte a IE de Substituto Tributário (IEST)
-- =============================================
-- Criado em: 01/01/2026
-- Descrição: Permite que uma filial/CNPJ tenha múltiplas
--            inscrições estaduais em diferentes UFs,
--            especialmente para casos de Substituição
--            Tributária onde a empresa precisa de IEST
--            em estados onde não possui estabelecimento.
-- =============================================

-- =============================================
-- 1. INSCRIÇÕES ESTADUAIS POR FILIAL/UF
-- =============================================
-- Cada filial pode ter múltiplas IEs em diferentes estados
-- Tipos: normal (IE principal), st (IEST - Substituto Tributário), produtor_rural

CREATE TABLE IF NOT EXISTS filiais_inscricoes_estaduais (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    filial_id TEXT NOT NULL REFERENCES filiais(id),
    
    -- Identificação da IE
    uf TEXT NOT NULL,                             -- UF da inscrição (2 caracteres)
    inscricao_estadual TEXT NOT NULL,             -- Número da IE
    
    -- Tipo de inscrição
    tipo TEXT NOT NULL DEFAULT 'normal' CHECK (tipo IN ('normal', 'st', 'produtor_rural')),
    -- normal: IE principal do estabelecimento
    -- st: IE de Substituto Tributário (IEST) em UF de destino
    -- produtor_rural: IE de produtor rural
    
    -- Dados complementares
    indicador_ie TEXT DEFAULT '1' CHECK (indicador_ie IN ('1', '2', '9')),
    -- 1 = Contribuinte ICMS
    -- 2 = Contribuinte isento de inscrição
    -- 9 = Não Contribuinte
    
    -- Vigência
    data_inicio TEXT,                             -- Data de início da validade
    data_fim TEXT,                                -- Data de fim (NULL = vigente)
    
    -- Situação cadastral na SEFAZ
    situacao_cadastral TEXT DEFAULT 'ativa' CHECK (situacao_cadastral IN ('ativa', 'suspensa', 'cancelada', 'baixada')),
    data_situacao TEXT,
    
    -- Regime especial (quando aplicável)
    regime_especial TEXT,                         -- Número do regime especial
    regime_especial_descricao TEXT,
    regime_especial_validade TEXT,
    
    -- Controle
    principal INTEGER DEFAULT 0,                  -- 1 = IE principal para esta UF
    ativo INTEGER DEFAULT 1,
    observacoes TEXT,
    
    -- Auditoria
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(filial_id, uf, tipo),                  -- Uma IE por tipo por UF por filial
    UNIQUE(empresa_id, uf, inscricao_estadual)    -- IE única por empresa/UF
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_filiais_ie_empresa ON filiais_inscricoes_estaduais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_filiais_ie_filial ON filiais_inscricoes_estaduais(filial_id);
CREATE INDEX IF NOT EXISTS idx_filiais_ie_uf ON filiais_inscricoes_estaduais(uf);
CREATE INDEX IF NOT EXISTS idx_filiais_ie_tipo ON filiais_inscricoes_estaduais(tipo);
CREATE INDEX IF NOT EXISTS idx_filiais_ie_uf_tipo ON filiais_inscricoes_estaduais(uf, tipo);
CREATE INDEX IF NOT EXISTS idx_filiais_ie_ativo ON filiais_inscricoes_estaduais(ativo);
CREATE INDEX IF NOT EXISTS idx_filiais_ie_principal ON filiais_inscricoes_estaduais(filial_id, uf, principal);

-- =============================================
-- 2. CONFIGURAÇÕES TRIBUTÁRIAS POR IE
-- =============================================
-- Regras específicas de tributação vinculadas a cada IE

CREATE TABLE IF NOT EXISTS inscricoes_estaduais_config (
    id TEXT PRIMARY KEY,
    inscricao_estadual_id TEXT NOT NULL REFERENCES filiais_inscricoes_estaduais(id) ON DELETE CASCADE,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Configurações de ICMS
    aliquota_icms_interna REAL,                   -- Alíquota interna padrão
    aliquota_icms_interestadual_sul_sudeste REAL, -- Para Sul/Sudeste (12%)
    aliquota_icms_interestadual_outros REAL,      -- Para outros estados (7%)
    
    -- Configurações de ST
    responsavel_st INTEGER DEFAULT 0,             -- 1 = É responsável por ST nesta UF
    mva_padrao REAL,                              -- MVA padrão para ST
    
    -- Configurações de DIFAL
    recolhe_difal INTEGER DEFAULT 0,              -- 1 = Recolhe DIFAL nesta UF
    
    -- FCP
    aliquota_fcp REAL,                            -- Alíquota FCP para esta UF
    
    -- Benefícios fiscais vinculados
    beneficio_fiscal_id TEXT,                     -- Benefício fiscal padrão
    codigo_beneficio TEXT,                        -- Código CBENEF
    
    -- CFOP padrão para operações com esta IE
    cfop_venda_interna TEXT,
    cfop_venda_interestadual TEXT,
    cfop_devolucao TEXT,
    
    -- Informações adicionais para NF-e
    informacoes_complementares TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ie_config_ie ON inscricoes_estaduais_config(inscricao_estadual_id);
CREATE INDEX IF NOT EXISTS idx_ie_config_empresa ON inscricoes_estaduais_config(empresa_id);

-- =============================================
-- 3. HISTÓRICO DE ALTERAÇÕES DE IE
-- =============================================
-- Auditoria de mudanças nas inscrições estaduais

CREATE TABLE IF NOT EXISTS inscricoes_estaduais_historico (
    id TEXT PRIMARY KEY,
    inscricao_estadual_id TEXT NOT NULL REFERENCES filiais_inscricoes_estaduais(id) ON DELETE CASCADE,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Tipo de alteração
    tipo_alteracao TEXT NOT NULL CHECK (tipo_alteracao IN ('criacao', 'alteracao', 'suspensao', 'reativacao', 'cancelamento', 'baixa')),
    
    -- Dados da alteração
    campo_alterado TEXT,
    valor_anterior TEXT,
    valor_novo TEXT,
    
    -- Motivo
    motivo TEXT,
    
    -- Auditoria
    usuario_id TEXT REFERENCES usuarios(id),
    ip TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ie_hist_ie ON inscricoes_estaduais_historico(inscricao_estadual_id);
CREATE INDEX IF NOT EXISTS idx_ie_hist_empresa ON inscricoes_estaduais_historico(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ie_hist_data ON inscricoes_estaduais_historico(created_at);

-- =============================================
-- 4. VIEW PARA CONSULTA DE IEs ATIVAS
-- =============================================
-- Facilita a consulta de IEs ativas por filial/UF

CREATE VIEW IF NOT EXISTS vw_filiais_inscricoes_ativas AS
SELECT 
    fie.id,
    fie.empresa_id,
    fie.filial_id,
    f.nome AS filial_nome,
    f.cnpj AS filial_cnpj,
    fie.uf,
    fie.inscricao_estadual,
    fie.tipo,
    fie.indicador_ie,
    fie.situacao_cadastral,
    fie.principal,
    fie.data_inicio,
    fie.data_fim,
    fie.regime_especial,
    iec.aliquota_icms_interna,
    iec.responsavel_st,
    iec.recolhe_difal,
    iec.aliquota_fcp
FROM filiais_inscricoes_estaduais fie
JOIN filiais f ON f.id = fie.filial_id
LEFT JOIN inscricoes_estaduais_config iec ON iec.inscricao_estadual_id = fie.id AND iec.ativo = 1
WHERE fie.ativo = 1
  AND fie.situacao_cadastral = 'ativa'
  AND (fie.data_fim IS NULL OR fie.data_fim > datetime('now'));

-- =============================================
-- 5. VIEW PARA IEST (Substituto Tributário)
-- =============================================
-- Lista todas as IEs de Substituto Tributário por empresa

CREATE VIEW IF NOT EXISTS vw_empresas_iest AS
SELECT 
    fie.empresa_id,
    e.razao_social AS empresa_razao_social,
    e.cnpj AS empresa_cnpj,
    fie.filial_id,
    f.nome AS filial_nome,
    fie.uf AS uf_destino,
    fie.inscricao_estadual AS iest,
    fie.situacao_cadastral,
    fie.regime_especial,
    iec.responsavel_st,
    iec.mva_padrao
FROM filiais_inscricoes_estaduais fie
JOIN empresas e ON e.id = fie.empresa_id
JOIN filiais f ON f.id = fie.filial_id
LEFT JOIN inscricoes_estaduais_config iec ON iec.inscricao_estadual_id = fie.id AND iec.ativo = 1
WHERE fie.tipo = 'st'
  AND fie.ativo = 1
  AND fie.situacao_cadastral = 'ativa';

-- =============================================
-- 6. FUNÇÃO AUXILIAR: Buscar IE para NF-e
-- =============================================
-- Comentário: Em SQLite não temos funções, mas documentamos a lógica
-- que deve ser implementada no código da aplicação:
--
-- buscar_ie_para_nfe(filial_id, uf_destino, tipo_operacao):
--   1. Se operação interna (uf_origem = uf_destino):
--      - Retornar IE tipo='normal' da filial para a UF
--   2. Se operação interestadual com ST:
--      - Verificar se existe IE tipo='st' para uf_destino
--      - Se existir, usar como IEST no campo específico da NF-e
--   3. Se não encontrar IE específica:
--      - Usar IE principal da filial (campo inscricao_estadual da tabela filiais)

-- =============================================
-- 7. MIGRAÇÃO DE DADOS EXISTENTES
-- =============================================
-- Migra as IEs existentes na tabela filiais para a nova estrutura

INSERT OR IGNORE INTO filiais_inscricoes_estaduais (
    id,
    empresa_id,
    filial_id,
    uf,
    inscricao_estadual,
    tipo,
    indicador_ie,
    principal,
    ativo,
    created_at,
    updated_at
)
SELECT 
    'IE-' || f.id || '-' || f.uf AS id,
    f.empresa_id,
    f.id AS filial_id,
    f.uf,
    f.inscricao_estadual,
    'normal' AS tipo,
    '1' AS indicador_ie,  -- Contribuinte ICMS
    1 AS principal,
    f.ativo,
    f.created_at,
    f.updated_at
FROM filiais f
WHERE f.inscricao_estadual IS NOT NULL 
  AND f.inscricao_estadual != ''
  AND f.uf IS NOT NULL
  AND f.uf != '';

-- =============================================
-- 8. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =============================================

-- Índice composto para busca rápida de IE por filial e UF de destino
CREATE INDEX IF NOT EXISTS idx_filiais_ie_busca_nfe 
ON filiais_inscricoes_estaduais(filial_id, uf, tipo, ativo);

-- Índice para consulta de IEs por situação cadastral
CREATE INDEX IF NOT EXISTS idx_filiais_ie_situacao 
ON filiais_inscricoes_estaduais(empresa_id, situacao_cadastral, ativo);
