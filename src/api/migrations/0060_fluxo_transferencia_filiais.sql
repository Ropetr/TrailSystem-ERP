-- =============================================
-- TRAILSYSTEM ERP - Migration 0060
-- Fluxo de Transferencia entre Filiais
-- Criado em: 2025-12-30
-- =============================================

-- =============================================
-- TABELA: transferencias_filiais (solicitacoes de transferencia)
-- =============================================
CREATE TABLE IF NOT EXISTS transferencias_filiais (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    numero TEXT NOT NULL,
    
    -- Filiais
    filial_origem_id TEXT NOT NULL REFERENCES filiais(id),
    filial_origem_nome TEXT,
    filial_destino_id TEXT NOT NULL REFERENCES filiais(id),
    filial_destino_nome TEXT,
    
    -- Motivo
    motivo TEXT NOT NULL CHECK (motivo IN (
        'solicitacao_filial',
        'balanceamento_estoque',
        'venda_outra_filial',
        'devolucao',
        'outro'
    )),
    motivo_descricao TEXT,
    
    -- Datas
    data_solicitacao TEXT NOT NULL,
    data_aprovacao TEXT,
    data_emissao_nfe TEXT,
    data_despacho TEXT,
    data_recebimento TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN (
        'rascunho',
        'solicitado',
        'aguardando_aprovacao',
        'aprovado',
        'reprovado',
        'nfe_emitida',
        'em_separacao',
        'despachado',
        'em_transito',
        'recebido',
        'conferido',
        'divergencia',
        'concluido',
        'cancelado'
    )),
    
    -- Valores e quantidades
    qtd_itens INTEGER DEFAULT 0,
    qtd_itens_conferidos INTEGER DEFAULT 0,
    valor_total REAL DEFAULT 0,
    peso_total REAL DEFAULT 0,
    
    -- NF-e de transferencia
    nfe_id TEXT,
    nfe_numero TEXT,
    nfe_chave TEXT,
    nfe_cfop TEXT DEFAULT '5.152',
    
    -- NF-e de entrada (destino)
    nfe_entrada_id TEXT,
    nfe_entrada_numero TEXT,
    
    -- Aprovacao
    aprovador_id TEXT REFERENCES usuarios(id),
    aprovador_nome TEXT,
    motivo_reprovacao TEXT,
    
    -- Transporte
    transportadora_id TEXT,
    transportadora_nome TEXT,
    veiculo_placa TEXT,
    motorista_nome TEXT,
    
    -- Controle
    urgente INTEGER DEFAULT 0,
    observacao TEXT,
    observacao_interna TEXT,
    solicitante_id TEXT REFERENCES usuarios(id),
    solicitante_nome TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    
    UNIQUE(empresa_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_transferencias_filiais_empresa ON transferencias_filiais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_filiais_origem ON transferencias_filiais(filial_origem_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_filiais_destino ON transferencias_filiais(filial_destino_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_filiais_status ON transferencias_filiais(status);
CREATE INDEX IF NOT EXISTS idx_transferencias_filiais_data ON transferencias_filiais(data_solicitacao);

-- =============================================
-- TABELA: transferencias_filiais_itens (itens da transferencia)
-- =============================================
CREATE TABLE IF NOT EXISTS transferencias_filiais_itens (
    id TEXT PRIMARY KEY,
    transferencia_id TEXT NOT NULL REFERENCES transferencias_filiais(id),
    
    -- Produto
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_nome TEXT,
    
    -- Quantidades
    quantidade_solicitada REAL NOT NULL,
    quantidade_aprovada REAL DEFAULT 0,
    quantidade_enviada REAL DEFAULT 0,
    quantidade_recebida REAL DEFAULT 0,
    quantidade_divergencia REAL DEFAULT 0,
    
    unidade TEXT DEFAULT 'UN',
    
    -- Valores
    valor_unitario REAL DEFAULT 0,
    valor_total REAL DEFAULT 0,
    
    -- Estoque
    estoque_disponivel_origem REAL DEFAULT 0,
    local_estoque_origem_id TEXT,
    local_estoque_destino_id TEXT,
    
    -- Conferencia
    conferido INTEGER DEFAULT 0,
    conferido_por_id TEXT REFERENCES usuarios(id),
    conferido_por_nome TEXT,
    conferido_em TEXT,
    observacao_conferencia TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transferencias_itens_transferencia ON transferencias_filiais_itens(transferencia_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_itens_produto ON transferencias_filiais_itens(produto_id);

-- =============================================
-- TABELA: transferencias_filiais_historico (auditoria)
-- =============================================
CREATE TABLE IF NOT EXISTS transferencias_filiais_historico (
    id TEXT PRIMARY KEY,
    transferencia_id TEXT NOT NULL REFERENCES transferencias_filiais(id),
    acao TEXT NOT NULL,
    status_anterior TEXT,
    status_novo TEXT,
    usuario_id TEXT REFERENCES usuarios(id),
    usuario_nome TEXT,
    descricao TEXT,
    dados_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transferencias_historico_transferencia ON transferencias_filiais_historico(transferencia_id);

-- =============================================
-- TABELA: config_transferencia (configuracoes por empresa)
-- =============================================
CREATE TABLE IF NOT EXISTS config_transferencia (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL UNIQUE REFERENCES empresas(id),
    
    -- Aprovacao
    requer_aprovacao INTEGER DEFAULT 1,
    valor_minimo_aprovacao REAL DEFAULT 0,
    aprovador_padrao_id TEXT REFERENCES usuarios(id),
    
    -- CFOP
    cfop_mesma_uf TEXT DEFAULT '5.152',
    cfop_outra_uf TEXT DEFAULT '6.152',
    
    -- Notificacoes
    notificar_solicitante INTEGER DEFAULT 1,
    notificar_filial_origem INTEGER DEFAULT 1,
    notificar_filial_destino INTEGER DEFAULT 1,
    
    -- Prazos
    prazo_aprovacao_horas INTEGER DEFAULT 24,
    prazo_separacao_horas INTEGER DEFAULT 48,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- VIEW: vw_transferencias_pendentes
-- =============================================
CREATE VIEW IF NOT EXISTS vw_transferencias_pendentes AS
SELECT 
    t.*,
    CAST(julianday('now') - julianday(t.data_solicitacao) AS INTEGER) as dias_pendente
FROM transferencias_filiais t
WHERE t.deleted_at IS NULL 
AND t.status IN ('solicitado', 'aguardando_aprovacao', 'aprovado', 'em_separacao');

-- =============================================
-- VIEW: vw_transferencias_em_transito
-- =============================================
CREATE VIEW IF NOT EXISTS vw_transferencias_em_transito AS
SELECT 
    t.*,
    CAST(julianday('now') - julianday(t.data_despacho) AS INTEGER) as dias_em_transito
FROM transferencias_filiais t
WHERE t.deleted_at IS NULL 
AND t.status IN ('despachado', 'em_transito');

-- =============================================
-- VIEW: vw_transferencias_por_filial
-- =============================================
CREATE VIEW IF NOT EXISTS vw_transferencias_por_filial AS
SELECT 
    empresa_id,
    filial_origem_id,
    filial_origem_nome,
    filial_destino_id,
    filial_destino_nome,
    COUNT(*) as total_transferencias,
    SUM(valor_total) as valor_total,
    SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as concluidas,
    SUM(CASE WHEN status IN ('solicitado', 'aguardando_aprovacao', 'aprovado', 'em_separacao', 'despachado', 'em_transito') THEN 1 ELSE 0 END) as em_andamento
FROM transferencias_filiais
WHERE deleted_at IS NULL
GROUP BY empresa_id, filial_origem_id, filial_origem_nome, filial_destino_id, filial_destino_nome;
