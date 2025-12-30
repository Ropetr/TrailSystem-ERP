-- =============================================
-- TRAILSYSTEM ERP - Migration 0057: Fluxo de Consignacao
-- Suporte completo ao fluxo de consignacao de mercadorias
-- =============================================

-- =============================================
-- ROMANEIOS DE CONSIGNACAO
-- =============================================

CREATE TABLE IF NOT EXISTS consignacoes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Cliente depositario
    cliente_id TEXT NOT NULL REFERENCES clientes(id),
    cliente_nome TEXT,
    
    -- Numeracao
    numero TEXT NOT NULL,
    
    -- Datas
    data_emissao TEXT NOT NULL,
    data_prazo_acerto TEXT NOT NULL,
    data_ultimo_acerto TEXT,
    data_encerramento TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN (
        'rascunho', 'emitido', 'em_transito', 'entregue', 'ativo',
        'acerto_parcial', 'acerto_total', 'encerrado', 'cancelado'
    )),
    
    -- Valores
    valor_total_consignado REAL NOT NULL DEFAULT 0,
    valor_total_vendido REAL NOT NULL DEFAULT 0,
    valor_total_devolvido REAL NOT NULL DEFAULT 0,
    valor_saldo_consignado REAL NOT NULL DEFAULT 0,
    
    -- Quantidades
    qtd_itens_consignados INTEGER DEFAULT 0,
    qtd_itens_vendidos INTEGER DEFAULT 0,
    qtd_itens_devolvidos INTEGER DEFAULT 0,
    qtd_itens_saldo INTEGER DEFAULT 0,
    
    -- NF-e de remessa em consignacao
    nfe_remessa_id TEXT,
    nfe_remessa_numero TEXT,
    nfe_remessa_chave TEXT,
    nfe_remessa_data TEXT,
    
    -- Prazo
    prazo_acerto_dias INTEGER DEFAULT 30,
    dias_em_consignacao INTEGER DEFAULT 0,
    prazo_vencido INTEGER DEFAULT 0,
    
    -- Vendedor responsavel
    vendedor_id TEXT REFERENCES usuarios(id),
    vendedor_nome TEXT,
    
    -- Local de estoque origem
    local_estoque_origem_id TEXT,
    
    -- Observacoes
    observacao TEXT,
    observacao_interna TEXT,
    
    -- Auditoria
    criado_por_id TEXT REFERENCES usuarios(id),
    criado_por_nome TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_consignacoes_empresa ON consignacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_consignacoes_cliente ON consignacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_consignacoes_status ON consignacoes(status);
CREATE INDEX IF NOT EXISTS idx_consignacoes_numero ON consignacoes(numero);
CREATE INDEX IF NOT EXISTS idx_consignacoes_prazo ON consignacoes(data_prazo_acerto);

-- =============================================
-- ITENS DA CONSIGNACAO
-- =============================================

CREATE TABLE IF NOT EXISTS consignacoes_itens (
    id TEXT PRIMARY KEY,
    consignacao_id TEXT NOT NULL REFERENCES consignacoes(id),
    
    -- Produto
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_nome TEXT,
    
    -- Quantidades
    quantidade_consignada REAL NOT NULL,
    quantidade_vendida REAL DEFAULT 0,
    quantidade_devolvida REAL DEFAULT 0,
    quantidade_saldo REAL NOT NULL, -- consignada - vendida - devolvida
    unidade TEXT DEFAULT 'UN',
    
    -- Valores
    valor_unitario REAL NOT NULL,
    valor_total_consignado REAL NOT NULL,
    valor_total_vendido REAL DEFAULT 0,
    valor_total_devolvido REAL DEFAULT 0,
    
    -- Estoque
    estoque_saida_realizada INTEGER DEFAULT 0,
    local_estoque_id TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consignacoes_itens_consignacao ON consignacoes_itens(consignacao_id);
CREATE INDEX IF NOT EXISTS idx_consignacoes_itens_produto ON consignacoes_itens(produto_id);

-- =============================================
-- ACERTOS DE CONSIGNACAO
-- =============================================

CREATE TABLE IF NOT EXISTS consignacoes_acertos (
    id TEXT PRIMARY KEY,
    consignacao_id TEXT NOT NULL REFERENCES consignacoes(id),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Numeracao
    numero TEXT NOT NULL,
    
    -- Tipo de acerto
    tipo TEXT NOT NULL CHECK (tipo IN ('parcial', 'total')),
    
    -- Datas
    data_acerto TEXT NOT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
        'pendente', 'processando', 'concluido', 'cancelado'
    )),
    
    -- Valores do acerto
    valor_itens_vendidos REAL DEFAULT 0,
    valor_itens_devolvidos REAL DEFAULT 0,
    valor_financeiro_gerado REAL DEFAULT 0,
    
    -- NF-e de venda (itens vendidos)
    nfe_venda_id TEXT,
    nfe_venda_numero TEXT,
    nfe_venda_chave TEXT,
    
    -- NF-e de retorno (itens devolvidos)
    nfe_retorno_id TEXT,
    nfe_retorno_numero TEXT,
    nfe_retorno_chave TEXT,
    
    -- Financeiro gerado
    contas_receber_ids TEXT, -- JSON array de IDs
    
    -- Usuario que realizou
    usuario_id TEXT REFERENCES usuarios(id),
    usuario_nome TEXT,
    
    -- Observacoes
    observacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consignacoes_acertos_consignacao ON consignacoes_acertos(consignacao_id);
CREATE INDEX IF NOT EXISTS idx_consignacoes_acertos_status ON consignacoes_acertos(status);

-- =============================================
-- ITENS DO ACERTO
-- =============================================

CREATE TABLE IF NOT EXISTS consignacoes_acertos_itens (
    id TEXT PRIMARY KEY,
    acerto_id TEXT NOT NULL REFERENCES consignacoes_acertos(id),
    consignacao_item_id TEXT NOT NULL REFERENCES consignacoes_itens(id),
    
    -- Produto
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_nome TEXT,
    
    -- Tipo: vendido ou devolvido
    tipo TEXT NOT NULL CHECK (tipo IN ('vendido', 'devolvido')),
    
    -- Quantidades
    quantidade REAL NOT NULL,
    unidade TEXT DEFAULT 'UN',
    
    -- Valores
    valor_unitario REAL NOT NULL,
    valor_total REAL NOT NULL,
    
    -- Estoque
    estoque_processado INTEGER DEFAULT 0,
    local_estoque_id TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consignacoes_acertos_itens_acerto ON consignacoes_acertos_itens(acerto_id);
CREATE INDEX IF NOT EXISTS idx_consignacoes_acertos_itens_tipo ON consignacoes_acertos_itens(tipo);

-- =============================================
-- ESTOQUE EM CONSIGNACAO
-- =============================================

CREATE TABLE IF NOT EXISTS estoque_consignacao (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Consignacao
    consignacao_id TEXT NOT NULL REFERENCES consignacoes(id),
    consignacao_item_id TEXT NOT NULL REFERENCES consignacoes_itens(id),
    
    -- Cliente depositario
    cliente_id TEXT NOT NULL REFERENCES clientes(id),
    
    -- Produto
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_nome TEXT,
    
    -- Quantidade em consignacao
    quantidade REAL NOT NULL,
    unidade TEXT DEFAULT 'UN',
    
    -- Valor
    valor_unitario REAL NOT NULL,
    valor_total REAL NOT NULL,
    
    -- Datas
    data_entrada TEXT NOT NULL,
    data_prazo TEXT NOT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'vendido', 'devolvido')),
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_estoque_consignacao_empresa ON estoque_consignacao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_estoque_consignacao_cliente ON estoque_consignacao(cliente_id);
CREATE INDEX IF NOT EXISTS idx_estoque_consignacao_produto ON estoque_consignacao(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_consignacao_consignacao ON estoque_consignacao(consignacao_id);
CREATE INDEX IF NOT EXISTS idx_estoque_consignacao_status ON estoque_consignacao(status);

-- =============================================
-- CONFIGURACAO DE CONSIGNACAO
-- =============================================

CREATE TABLE IF NOT EXISTS config_consignacao (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Prazos
    prazo_acerto_padrao_dias INTEGER DEFAULT 30,
    dias_alerta_vencimento INTEGER DEFAULT 7,
    
    -- CFOP
    cfop_remessa_consignacao TEXT DEFAULT '5.917', -- Dentro do estado
    cfop_remessa_consignacao_interestadual TEXT DEFAULT '6.917', -- Fora do estado
    cfop_venda_consignacao TEXT DEFAULT '5.115', -- Venda de mercadoria em consignacao
    cfop_retorno_consignacao TEXT DEFAULT '5.918', -- Retorno de mercadoria em consignacao
    
    -- Estoque
    local_estoque_consignacao_id TEXT, -- Local virtual para estoque em consignacao
    
    -- Notificacoes
    notificar_vencimento INTEGER DEFAULT 1,
    notificar_vendedor INTEGER DEFAULT 1,
    
    -- Aprovacao
    requer_aprovacao_acerto INTEGER DEFAULT 0,
    valor_minimo_aprovacao REAL DEFAULT 0,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- HISTORICO DE CONSIGNACAO
-- =============================================

CREATE TABLE IF NOT EXISTS consignacoes_historico (
    id TEXT PRIMARY KEY,
    
    -- Referencia
    consignacao_id TEXT NOT NULL REFERENCES consignacoes(id),
    acerto_id TEXT REFERENCES consignacoes_acertos(id),
    
    -- Acao
    acao TEXT NOT NULL,
    status_anterior TEXT,
    status_novo TEXT,
    
    -- Usuario
    usuario_id TEXT REFERENCES usuarios(id),
    usuario_nome TEXT,
    
    -- Detalhes
    descricao TEXT,
    dados_json TEXT, -- JSON com dados adicionais
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consignacoes_historico_consignacao ON consignacoes_historico(consignacao_id);

-- =============================================
-- VIEW DE CONSIGNACOES ATIVAS
-- =============================================

CREATE VIEW IF NOT EXISTS vw_consignacoes_ativas AS
SELECT 
    c.id,
    c.empresa_id,
    c.numero,
    c.cliente_id,
    cl.razao_social as cliente_nome,
    c.status,
    c.valor_total_consignado,
    c.valor_saldo_consignado,
    c.qtd_itens_saldo,
    c.data_emissao,
    c.data_prazo_acerto,
    CAST(julianday('now') - julianday(c.data_emissao) AS INTEGER) as dias_em_consignacao,
    CAST(julianday(c.data_prazo_acerto) - julianday('now') AS INTEGER) as dias_para_vencimento,
    CASE WHEN julianday('now') > julianday(c.data_prazo_acerto) THEN 1 ELSE 0 END as prazo_vencido
FROM consignacoes c
JOIN clientes cl ON cl.id = c.cliente_id
WHERE c.status IN ('ativo', 'acerto_parcial', 'entregue')
AND c.deleted_at IS NULL;

-- =============================================
-- VIEW DE CONSIGNACOES VENCENDO
-- =============================================

CREATE VIEW IF NOT EXISTS vw_consignacoes_vencendo AS
SELECT 
    c.id,
    c.empresa_id,
    c.numero,
    c.cliente_id,
    cl.razao_social as cliente_nome,
    cl.telefone as cliente_telefone,
    cl.email as cliente_email,
    c.valor_saldo_consignado,
    c.qtd_itens_saldo,
    c.data_prazo_acerto,
    CAST(julianday(c.data_prazo_acerto) - julianday('now') AS INTEGER) as dias_para_vencimento,
    c.vendedor_id,
    c.vendedor_nome
FROM consignacoes c
JOIN clientes cl ON cl.id = c.cliente_id
WHERE c.status IN ('ativo', 'acerto_parcial', 'entregue')
AND c.deleted_at IS NULL
AND julianday(c.data_prazo_acerto) - julianday('now') <= 7
AND julianday(c.data_prazo_acerto) >= julianday('now')
ORDER BY c.data_prazo_acerto ASC;

-- =============================================
-- VIEW DE ESTOQUE EM CONSIGNACAO POR CLIENTE
-- =============================================

CREATE VIEW IF NOT EXISTS vw_estoque_consignacao_por_cliente AS
SELECT 
    ec.empresa_id,
    ec.cliente_id,
    cl.razao_social as cliente_nome,
    COUNT(DISTINCT ec.consignacao_id) as qtd_consignacoes,
    COUNT(DISTINCT ec.produto_id) as qtd_produtos,
    SUM(ec.quantidade) as quantidade_total,
    SUM(ec.valor_total) as valor_total
FROM estoque_consignacao ec
JOIN clientes cl ON cl.id = ec.cliente_id
WHERE ec.status = 'ativo'
GROUP BY ec.empresa_id, ec.cliente_id, cl.razao_social;

-- =============================================
-- VIEW DE ESTOQUE EM CONSIGNACAO POR PRODUTO
-- =============================================

CREATE VIEW IF NOT EXISTS vw_estoque_consignacao_por_produto AS
SELECT 
    ec.empresa_id,
    ec.produto_id,
    ec.produto_codigo,
    ec.produto_nome,
    COUNT(DISTINCT ec.cliente_id) as qtd_clientes,
    COUNT(DISTINCT ec.consignacao_id) as qtd_consignacoes,
    SUM(ec.quantidade) as quantidade_total,
    SUM(ec.valor_total) as valor_total
FROM estoque_consignacao ec
WHERE ec.status = 'ativo'
GROUP BY ec.empresa_id, ec.produto_id, ec.produto_codigo, ec.produto_nome;
