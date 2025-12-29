-- =============================================
-- PLANAC ERP - Migration 0043
-- Tributação de Vendas e Benefícios Fiscais
-- CBENEF, Reduções, ST, DIFAL
-- =============================================
-- Criado em: 29/12/2025
-- Descrição: Tabelas para motor de tributação de vendas
--            com suporte a benefícios fiscais (CBENEF)
-- =============================================

-- =============================================
-- 1. BENEFÍCIOS FISCAIS (CBENEF)
-- =============================================
-- Cadastro de códigos de benefícios fiscais por UF
CREATE TABLE IF NOT EXISTS beneficios_fiscais (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES empresas(id),      -- NULL = benefício padrão/público
    
    -- Identificação
    uf TEXT NOT NULL,                             -- UF do benefício
    codigo TEXT NOT NULL,                         -- Código CBENEF (ex: PR800001)
    
    -- Descrição
    nome TEXT NOT NULL,
    descricao TEXT,
    
    -- Tipo de benefício
    tipo TEXT NOT NULL,                           -- isencao, reducao_base, diferimento, suspensao, credito_presumido, outros
    
    -- Fundamento legal
    fundamento_legal TEXT,                        -- Lei/Decreto/Convênio
    numero_ato TEXT,
    data_ato TEXT,
    
    -- Vigência
    vigencia_inicio TEXT NOT NULL,
    vigencia_fim TEXT,
    
    -- Aplicação
    aplica_icms INTEGER DEFAULT 1,
    aplica_icms_st INTEGER DEFAULT 0,
    aplica_fcp INTEGER DEFAULT 0,
    
    -- Valores do benefício
    percentual_reducao REAL,                      -- % de redução de base
    percentual_credito REAL,                      -- % de crédito presumido
    percentual_diferimento REAL,                  -- % de diferimento
    aliquota_efetiva REAL,                        -- Alíquota efetiva após benefício
    
    -- Condições gerais
    exige_destaque_nota INTEGER DEFAULT 0,        -- Deve destacar na NF-e
    exige_informacao_adicional INTEGER DEFAULT 0,
    texto_informacao_adicional TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    observacoes TEXT,
    created_at TEXT,
    updated_at TEXT,
    
    UNIQUE(uf, codigo)
);

CREATE INDEX IF NOT EXISTS idx_beneficios_uf ON beneficios_fiscais(uf);
CREATE INDEX IF NOT EXISTS idx_beneficios_codigo ON beneficios_fiscais(codigo);
CREATE INDEX IF NOT EXISTS idx_beneficios_tipo ON beneficios_fiscais(tipo);
CREATE INDEX IF NOT EXISTS idx_beneficios_vigencia ON beneficios_fiscais(vigencia_inicio, vigencia_fim);

-- =============================================
-- 2. REGRAS DE APLICAÇÃO DE BENEFÍCIOS
-- =============================================
-- Define quando um benefício fiscal se aplica
CREATE TABLE IF NOT EXISTS beneficios_fiscais_regras (
    id TEXT PRIMARY KEY,
    beneficio_id TEXT NOT NULL REFERENCES beneficios_fiscais(id),
    empresa_id TEXT REFERENCES empresas(id),
    
    -- Prioridade (menor = maior prioridade)
    prioridade INTEGER DEFAULT 100,
    
    -- Condições de NCM/CEST
    ncm_inicio TEXT,                              -- NCM inicial do range
    ncm_fim TEXT,                                 -- NCM final do range (NULL = exato)
    ncm_lista TEXT,                               -- JSON array de NCMs específicos
    cest TEXT,                                    -- CEST específico
    
    -- Condições de operação
    cfop_lista TEXT,                              -- JSON array de CFOPs aplicáveis
    cst_icms_lista TEXT,                          -- JSON array de CSTs aplicáveis
    csosn_lista TEXT,                             -- JSON array de CSOSNs (Simples)
    
    -- Condições de origem/destino
    uf_origem TEXT,                               -- NULL = qualquer
    uf_destino TEXT,                              -- NULL = qualquer
    operacao_interna INTEGER,                     -- 1 = só interna, 0 = só interestadual, NULL = ambas
    
    -- Condições de cliente
    tipo_cliente TEXT,                            -- contribuinte, nao_contribuinte, consumidor_final, NULL = todos
    regime_cliente TEXT,                          -- simples, normal, NULL = todos
    
    -- Condições de produto
    origem_mercadoria TEXT,                       -- 0-8 (tabela origem), NULL = todas
    tipo_produto TEXT,                            -- mercadoria, servico, NULL = todos
    
    -- Condições de valor
    valor_minimo REAL,                            -- Valor mínimo da operação
    valor_maximo REAL,                            -- Valor máximo da operação
    
    -- Vigência da regra
    vigencia_inicio TEXT,
    vigencia_fim TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    observacoes TEXT,
    created_at TEXT,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_benef_regras_beneficio ON beneficios_fiscais_regras(beneficio_id);
CREATE INDEX IF NOT EXISTS idx_benef_regras_ncm ON beneficios_fiscais_regras(ncm_inicio, ncm_fim);
CREATE INDEX IF NOT EXISTS idx_benef_regras_uf ON beneficios_fiscais_regras(uf_origem, uf_destino);
CREATE INDEX IF NOT EXISTS idx_benef_regras_prioridade ON beneficios_fiscais_regras(prioridade);

-- =============================================
-- 3. TABELA CEST (Código Especificador da ST)
-- =============================================
CREATE TABLE IF NOT EXISTS cest (
    id TEXT PRIMARY KEY,
    
    -- Código CEST
    codigo TEXT NOT NULL UNIQUE,                  -- Formato: 00.000.00
    
    -- Descrição
    descricao TEXT NOT NULL,
    
    -- Segmento
    segmento TEXT,
    segmento_descricao TEXT,
    
    -- NCMs vinculados
    ncm_lista TEXT,                               -- JSON array de NCMs aplicáveis
    
    -- Vigência
    vigencia_inicio TEXT,
    vigencia_fim TEXT,
    
    -- Fonte
    convenio TEXT,                                -- Convênio ICMS de origem
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_cest_codigo ON cest(codigo);
CREATE INDEX IF NOT EXISTS idx_cest_segmento ON cest(segmento);

-- =============================================
-- 4. TABELA TIPI (IPI por NCM)
-- =============================================
CREATE TABLE IF NOT EXISTS ipi_tipi (
    id TEXT PRIMARY KEY,
    
    -- NCM
    ncm TEXT NOT NULL,
    ex TEXT,                                      -- Exceção TIPI
    
    -- Descrição
    descricao TEXT,
    
    -- Alíquota
    aliquota REAL NOT NULL,
    unidade_tributavel TEXT,                      -- Quando IPI específico
    valor_especifico REAL,                        -- Valor por unidade
    
    -- Vigência
    vigencia_inicio TEXT NOT NULL,
    vigencia_fim TEXT,
    
    -- Fonte
    decreto TEXT,
    data_decreto TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    
    UNIQUE(ncm, ex, vigencia_inicio)
);

CREATE INDEX IF NOT EXISTS idx_tipi_ncm ON ipi_tipi(ncm);
CREATE INDEX IF NOT EXISTS idx_tipi_vigencia ON ipi_tipi(vigencia_inicio, vigencia_fim);

-- =============================================
-- 5. MVA (Margem de Valor Agregado) para ST
-- =============================================
CREATE TABLE IF NOT EXISTS icms_st_mva (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES empresas(id),
    
    -- Identificação
    uf_origem TEXT NOT NULL,
    uf_destino TEXT NOT NULL,
    
    -- Produto
    ncm TEXT,
    ncm_inicio TEXT,
    ncm_fim TEXT,
    cest TEXT,
    
    -- MVA
    mva_original REAL NOT NULL,                   -- MVA para operações internas
    mva_ajustada REAL,                            -- MVA ajustada para interestaduais
    mva_importado REAL,                           -- MVA para produtos importados
    
    -- Pauta (quando aplicável)
    valor_pauta REAL,
    unidade_pauta TEXT,
    
    -- Vigência
    vigencia_inicio TEXT NOT NULL,
    vigencia_fim TEXT,
    
    -- Fonte
    protocolo TEXT,                               -- Protocolo/Convênio ICMS
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    observacoes TEXT,
    created_at TEXT,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_mva_uf ON icms_st_mva(uf_origem, uf_destino);
CREATE INDEX IF NOT EXISTS idx_mva_ncm ON icms_st_mva(ncm);
CREATE INDEX IF NOT EXISTS idx_mva_cest ON icms_st_mva(cest);
CREATE INDEX IF NOT EXISTS idx_mva_vigencia ON icms_st_mva(vigencia_inicio, vigencia_fim);

-- =============================================
-- 6. FCP (Fundo de Combate à Pobreza) por UF
-- =============================================
CREATE TABLE IF NOT EXISTS fcp_uf (
    id TEXT PRIMARY KEY,
    
    -- UF
    uf TEXT NOT NULL,
    
    -- Alíquotas
    aliquota_fcp REAL NOT NULL,                   -- Alíquota FCP normal
    aliquota_fcp_st REAL,                         -- Alíquota FCP-ST
    aliquota_fcp_difal REAL,                      -- Alíquota FCP DIFAL
    
    -- Condições
    ncm_lista TEXT,                               -- JSON - NCMs com FCP diferenciado
    
    -- Vigência
    vigencia_inicio TEXT NOT NULL,
    vigencia_fim TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    observacoes TEXT,
    created_at TEXT,
    updated_at TEXT,
    
    UNIQUE(uf, vigencia_inicio)
);

CREATE INDEX IF NOT EXISTS idx_fcp_uf ON fcp_uf(uf);

-- =============================================
-- 7. CONJUNTOS DE REGRAS FISCAIS (Versionamento)
-- =============================================
CREATE TABLE IF NOT EXISTS fiscal_rule_sets (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Identificação
    nome TEXT NOT NULL,
    descricao TEXT,
    
    -- Versão
    versao INTEGER DEFAULT 1,
    versao_anterior_id TEXT REFERENCES fiscal_rule_sets(id),
    
    -- Vigência
    vigencia_inicio TEXT NOT NULL,
    vigencia_fim TEXT,
    
    -- Status
    status TEXT DEFAULT 'rascunho',               -- rascunho, ativo, inativo, arquivado
    
    -- Auditoria
    criado_por TEXT,
    aprovado_por TEXT,
    data_aprovacao TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    observacoes TEXT,
    created_at TEXT,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_rule_sets_empresa ON fiscal_rule_sets(empresa_id);
CREATE INDEX IF NOT EXISTS idx_rule_sets_status ON fiscal_rule_sets(status);
CREATE INDEX IF NOT EXISTS idx_rule_sets_vigencia ON fiscal_rule_sets(vigencia_inicio, vigencia_fim);

-- =============================================
-- 8. SNAPSHOT DE TRIBUTOS CALCULADOS
-- =============================================
-- Guarda o cálculo aplicado em cada item de venda
CREATE TABLE IF NOT EXISTS venda_itens_tributos (
    id TEXT PRIMARY KEY,
    venda_item_id TEXT NOT NULL,                  -- Referência ao item da venda
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Regra aplicada
    regra_fiscal_id TEXT,
    rule_set_id TEXT,
    beneficio_id TEXT,
    
    -- Dados do cálculo - ICMS
    cst_icms TEXT,
    csosn TEXT,
    origem_mercadoria TEXT,
    base_icms REAL DEFAULT 0,
    aliquota_icms REAL DEFAULT 0,
    valor_icms REAL DEFAULT 0,
    reducao_base_icms REAL DEFAULT 0,
    valor_icms_desonerado REAL DEFAULT 0,
    motivo_desoneracao TEXT,
    cbenef TEXT,
    
    -- ICMS-ST
    base_icms_st REAL DEFAULT 0,
    aliquota_icms_st REAL DEFAULT 0,
    valor_icms_st REAL DEFAULT 0,
    mva_aplicada REAL,
    
    -- FCP
    base_fcp REAL DEFAULT 0,
    aliquota_fcp REAL DEFAULT 0,
    valor_fcp REAL DEFAULT 0,
    base_fcp_st REAL DEFAULT 0,
    aliquota_fcp_st REAL DEFAULT 0,
    valor_fcp_st REAL DEFAULT 0,
    
    -- DIFAL (quando aplicável)
    base_difal REAL DEFAULT 0,
    aliquota_difal_origem REAL DEFAULT 0,
    aliquota_difal_destino REAL DEFAULT 0,
    valor_difal_origem REAL DEFAULT 0,
    valor_difal_destino REAL DEFAULT 0,
    valor_fcp_difal REAL DEFAULT 0,
    
    -- IPI
    cst_ipi TEXT,
    base_ipi REAL DEFAULT 0,
    aliquota_ipi REAL DEFAULT 0,
    valor_ipi REAL DEFAULT 0,
    
    -- PIS
    cst_pis TEXT,
    base_pis REAL DEFAULT 0,
    aliquota_pis REAL DEFAULT 0,
    valor_pis REAL DEFAULT 0,
    
    -- COFINS
    cst_cofins TEXT,
    base_cofins REAL DEFAULT 0,
    aliquota_cofins REAL DEFAULT 0,
    valor_cofins REAL DEFAULT 0,
    
    -- Totais
    valor_total_tributos REAL DEFAULT 0,
    percentual_tributos REAL DEFAULT 0,           -- Para Lei da Transparência
    
    -- IBPT (Lei da Transparência)
    ibpt_nacional REAL,
    ibpt_estadual REAL,
    ibpt_municipal REAL,
    ibpt_importado REAL,
    
    -- Auditoria
    calculado_em TEXT NOT NULL,
    versao_calculo TEXT,
    
    created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_venda_tributos_item ON venda_itens_tributos(venda_item_id);
CREATE INDEX IF NOT EXISTS idx_venda_tributos_empresa ON venda_itens_tributos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_venda_tributos_regra ON venda_itens_tributos(regra_fiscal_id);
CREATE INDEX IF NOT EXISTS idx_venda_tributos_beneficio ON venda_itens_tributos(beneficio_id);

-- =============================================
-- 9. PIS/COFINS TABELAS
-- =============================================
CREATE TABLE IF NOT EXISTS pis_cofins_tabelas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES empresas(id),
    
    -- Regime
    regime TEXT NOT NULL,                         -- cumulativo, nao_cumulativo
    
    -- CST
    cst_pis TEXT NOT NULL,
    cst_cofins TEXT NOT NULL,
    
    -- Natureza da receita (para não cumulativo)
    natureza_receita TEXT,
    
    -- Alíquotas
    aliquota_pis REAL NOT NULL,
    aliquota_cofins REAL NOT NULL,
    
    -- Condições
    ncm_lista TEXT,                               -- JSON array de NCMs
    cfop_lista TEXT,                              -- JSON array de CFOPs
    
    -- Vigência
    vigencia_inicio TEXT,
    vigencia_fim TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    observacoes TEXT,
    created_at TEXT,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_pis_cofins_regime ON pis_cofins_tabelas(regime);
CREATE INDEX IF NOT EXISTS idx_pis_cofins_cst ON pis_cofins_tabelas(cst_pis, cst_cofins);

-- =============================================
-- 10. LOG DE CÁLCULOS FISCAIS
-- =============================================
CREATE TABLE IF NOT EXISTS fiscal_calc_logs (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL,
    
    -- Contexto
    documento_tipo TEXT,                          -- nfe, nfce, orcamento, pedido
    documento_id TEXT,
    item_id TEXT,
    
    -- Entrada do cálculo
    ncm TEXT,
    cest TEXT,
    cfop TEXT,
    uf_origem TEXT,
    uf_destino TEXT,
    valor_produto REAL,
    
    -- Regras avaliadas
    regras_avaliadas TEXT,                        -- JSON array de regras testadas
    regra_aplicada_id TEXT,
    beneficio_aplicado_id TEXT,
    
    -- Resultado
    resultado TEXT,                               -- JSON com todos os valores calculados
    
    -- Performance
    tempo_calculo_ms INTEGER,
    
    -- Controle
    usuario_id TEXT,
    created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_fiscal_logs_empresa ON fiscal_calc_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_logs_documento ON fiscal_calc_logs(documento_tipo, documento_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_logs_data ON fiscal_calc_logs(created_at);
