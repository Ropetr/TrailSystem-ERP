-- =============================================
-- TRAILSYSTEM ERP - Migration 0061
-- Fluxo de Precificacao
-- Criado em: 2025-12-30
-- =============================================

-- =============================================
-- TABELA: tabelas_preco (tabelas de preco)
-- =============================================
CREATE TABLE IF NOT EXISTS tabelas_preco (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    
    tipo TEXT NOT NULL DEFAULT 'varejo' CHECK (tipo IN (
        'varejo',
        'atacado',
        'promocional',
        'especial',
        'b2b',
        'b2c'
    )),
    
    ativo INTEGER DEFAULT 1,
    padrao INTEGER DEFAULT 0,
    
    vigencia_inicio TEXT,
    vigencia_fim TEXT,
    
    desconto_percentual REAL DEFAULT 0,
    acrescimo_percentual REAL DEFAULT 0,
    
    quantidade_minima REAL DEFAULT 1,
    valor_minimo_pedido REAL DEFAULT 0,
    
    aplicar_a TEXT DEFAULT 'todos' CHECK (aplicar_a IN (
        'todos',
        'clientes_selecionados',
        'categorias_clientes',
        'regioes'
    )),
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    
    UNIQUE(empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_tabelas_preco_empresa ON tabelas_preco(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tabelas_preco_tipo ON tabelas_preco(tipo);
CREATE INDEX IF NOT EXISTS idx_tabelas_preco_ativo ON tabelas_preco(ativo);

-- =============================================
-- TABELA: tabelas_preco_produtos (precos por produto)
-- =============================================
CREATE TABLE IF NOT EXISTS tabelas_preco_produtos (
    id TEXT PRIMARY KEY,
    tabela_preco_id TEXT NOT NULL REFERENCES tabelas_preco(id),
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    
    preco_venda REAL NOT NULL,
    preco_promocional REAL,
    
    desconto_maximo REAL DEFAULT 0,
    
    quantidade_minima REAL DEFAULT 1,
    
    vigencia_inicio TEXT,
    vigencia_fim TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tabela_preco_id, produto_id)
);

CREATE INDEX IF NOT EXISTS idx_tabelas_preco_produtos_tabela ON tabelas_preco_produtos(tabela_preco_id);
CREATE INDEX IF NOT EXISTS idx_tabelas_preco_produtos_produto ON tabelas_preco_produtos(produto_id);

-- =============================================
-- TABELA: tabelas_preco_clientes (vinculo tabela-cliente)
-- =============================================
CREATE TABLE IF NOT EXISTS tabelas_preco_clientes (
    id TEXT PRIMARY KEY,
    tabela_preco_id TEXT NOT NULL REFERENCES tabelas_preco(id),
    cliente_id TEXT NOT NULL REFERENCES clientes(id),
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tabela_preco_id, cliente_id)
);

CREATE INDEX IF NOT EXISTS idx_tabelas_preco_clientes_tabela ON tabelas_preco_clientes(tabela_preco_id);
CREATE INDEX IF NOT EXISTS idx_tabelas_preco_clientes_cliente ON tabelas_preco_clientes(cliente_id);

-- =============================================
-- TABELA: custos_produtos (custos detalhados)
-- =============================================
CREATE TABLE IF NOT EXISTS custos_produtos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    
    custo_aquisicao REAL DEFAULT 0,
    custo_frete REAL DEFAULT 0,
    custo_impostos_nao_recuperaveis REAL DEFAULT 0,
    custo_direto_total REAL DEFAULT 0,
    
    rateio_aluguel REAL DEFAULT 0,
    rateio_salarios REAL DEFAULT 0,
    rateio_energia REAL DEFAULT 0,
    rateio_marketing REAL DEFAULT 0,
    rateio_outros REAL DEFAULT 0,
    custo_indireto_total REAL DEFAULT 0,
    
    custo_total REAL DEFAULT 0,
    
    data_calculo TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(empresa_id, produto_id)
);

CREATE INDEX IF NOT EXISTS idx_custos_produtos_empresa ON custos_produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_custos_produtos_produto ON custos_produtos(produto_id);

-- =============================================
-- TABELA: config_precificacao (configuracoes)
-- =============================================
CREATE TABLE IF NOT EXISTS config_precificacao (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL UNIQUE REFERENCES empresas(id),
    
    metodo_padrao TEXT DEFAULT 'markup' CHECK (metodo_padrao IN (
        'markup',
        'margem',
        'mercado'
    )),
    
    markup_padrao REAL DEFAULT 30,
    margem_minima REAL DEFAULT 15,
    
    incluir_frete_custo INTEGER DEFAULT 1,
    incluir_impostos_custo INTEGER DEFAULT 1,
    
    rateio_aluguel_percentual REAL DEFAULT 0,
    rateio_salarios_percentual REAL DEFAULT 0,
    rateio_energia_percentual REAL DEFAULT 0,
    rateio_marketing_percentual REAL DEFAULT 0,
    
    alerta_margem_minima INTEGER DEFAULT 1,
    bloquear_abaixo_margem INTEGER DEFAULT 0,
    
    arredondar_preco INTEGER DEFAULT 1,
    casas_decimais INTEGER DEFAULT 2,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: historico_precos (auditoria de precos)
-- =============================================
CREATE TABLE IF NOT EXISTS historico_precos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    tabela_preco_id TEXT REFERENCES tabelas_preco(id),
    
    preco_anterior REAL,
    preco_novo REAL NOT NULL,
    
    custo_na_data REAL,
    margem_na_data REAL,
    
    motivo TEXT,
    
    usuario_id TEXT REFERENCES usuarios(id),
    usuario_nome TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historico_precos_empresa ON historico_precos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_historico_precos_produto ON historico_precos(produto_id);
CREATE INDEX IF NOT EXISTS idx_historico_precos_data ON historico_precos(created_at);

-- =============================================
-- TABELA: simulacoes_preco (simulacoes de precificacao)
-- =============================================
CREATE TABLE IF NOT EXISTS simulacoes_preco (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    nome TEXT NOT NULL,
    descricao TEXT,
    
    status TEXT DEFAULT 'rascunho' CHECK (status IN (
        'rascunho',
        'em_analise',
        'aprovada',
        'aplicada',
        'cancelada'
    )),
    
    metodo TEXT NOT NULL CHECK (metodo IN (
        'markup',
        'margem',
        'mercado',
        'ajuste_percentual'
    )),
    
    valor_ajuste REAL,
    
    qtd_produtos INTEGER DEFAULT 0,
    
    aprovador_id TEXT REFERENCES usuarios(id),
    aprovador_nome TEXT,
    data_aprovacao TEXT,
    
    data_aplicacao TEXT,
    
    usuario_id TEXT REFERENCES usuarios(id),
    usuario_nome TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_simulacoes_preco_empresa ON simulacoes_preco(empresa_id);
CREATE INDEX IF NOT EXISTS idx_simulacoes_preco_status ON simulacoes_preco(status);

-- =============================================
-- TABELA: simulacoes_preco_itens (itens da simulacao)
-- =============================================
CREATE TABLE IF NOT EXISTS simulacoes_preco_itens (
    id TEXT PRIMARY KEY,
    simulacao_id TEXT NOT NULL REFERENCES simulacoes_preco(id),
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    
    produto_codigo TEXT,
    produto_nome TEXT,
    
    custo_atual REAL,
    preco_atual REAL,
    margem_atual REAL,
    
    preco_calculado REAL,
    margem_calculada REAL,
    
    preco_final REAL,
    margem_final REAL,
    
    ajuste_manual INTEGER DEFAULT 0,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_simulacoes_itens_simulacao ON simulacoes_preco_itens(simulacao_id);
CREATE INDEX IF NOT EXISTS idx_simulacoes_itens_produto ON simulacoes_preco_itens(produto_id);

-- =============================================
-- VIEW: vw_produtos_margem_baixa
-- =============================================
CREATE VIEW IF NOT EXISTS vw_produtos_margem_baixa AS
SELECT 
    p.id as produto_id,
    p.codigo as produto_codigo,
    p.nome as produto_nome,
    p.empresa_id,
    c.custo_total,
    p.preco_venda,
    CASE 
        WHEN p.preco_venda > 0 THEN ((p.preco_venda - c.custo_total) / p.preco_venda) * 100
        ELSE 0
    END as margem_percentual,
    cfg.margem_minima
FROM produtos p
LEFT JOIN custos_produtos c ON c.produto_id = p.id AND c.empresa_id = p.empresa_id
LEFT JOIN config_precificacao cfg ON cfg.empresa_id = p.empresa_id
WHERE p.deleted_at IS NULL
AND p.preco_venda > 0
AND c.custo_total > 0
AND ((p.preco_venda - c.custo_total) / p.preco_venda) * 100 < COALESCE(cfg.margem_minima, 15);

-- =============================================
-- VIEW: vw_historico_precos_recente
-- =============================================
CREATE VIEW IF NOT EXISTS vw_historico_precos_recente AS
SELECT 
    h.*,
    p.codigo as produto_codigo,
    p.nome as produto_nome,
    t.nome as tabela_nome
FROM historico_precos h
JOIN produtos p ON p.id = h.produto_id
LEFT JOIN tabelas_preco t ON t.id = h.tabela_preco_id
WHERE h.created_at >= date('now', '-30 days')
ORDER BY h.created_at DESC;
