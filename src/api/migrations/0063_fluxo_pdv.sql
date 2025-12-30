-- =============================================
-- TRAILSYSTEM ERP - Migration 0063
-- Fluxo do PDV (Ponto de Venda)
-- Criado em: 2025-12-30
-- =============================================

-- =============================================
-- TABELA: pdv_caixas (caixas/terminais)
-- =============================================
CREATE TABLE IF NOT EXISTS pdv_caixas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    filial_id TEXT REFERENCES filiais(id),
    
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    
    tipo TEXT DEFAULT 'caixa' CHECK (tipo IN (
        'caixa',
        'balcao',
        'autoatendimento'
    )),
    
    ativo INTEGER DEFAULT 1,
    
    impressora_nfce TEXT,
    impressora_cupom TEXT,
    
    serie_nfce TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_pdv_caixas_empresa ON pdv_caixas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pdv_caixas_filial ON pdv_caixas(filial_id);

-- =============================================
-- TABELA: pdv_sessoes (abertura/fechamento de caixa)
-- =============================================
CREATE TABLE IF NOT EXISTS pdv_sessoes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    caixa_id TEXT NOT NULL REFERENCES pdv_caixas(id),
    
    numero_sessao INTEGER NOT NULL,
    
    status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN (
        'aberto',
        'fechado',
        'conferido',
        'cancelado'
    )),
    
    data_abertura TEXT NOT NULL,
    data_fechamento TEXT,
    
    operador_abertura_id TEXT REFERENCES usuarios(id),
    operador_abertura_nome TEXT,
    operador_fechamento_id TEXT REFERENCES usuarios(id),
    operador_fechamento_nome TEXT,
    
    valor_abertura REAL DEFAULT 0,
    
    valor_vendas_dinheiro REAL DEFAULT 0,
    valor_vendas_cartao_credito REAL DEFAULT 0,
    valor_vendas_cartao_debito REAL DEFAULT 0,
    valor_vendas_pix REAL DEFAULT 0,
    valor_vendas_outros REAL DEFAULT 0,
    valor_vendas_total REAL DEFAULT 0,
    
    valor_sangrias REAL DEFAULT 0,
    valor_suprimentos REAL DEFAULT 0,
    
    valor_esperado REAL DEFAULT 0,
    valor_informado REAL DEFAULT 0,
    valor_diferenca REAL DEFAULT 0,
    
    qtd_vendas INTEGER DEFAULT 0,
    qtd_cancelamentos INTEGER DEFAULT 0,
    
    observacao_abertura TEXT,
    observacao_fechamento TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pdv_sessoes_empresa ON pdv_sessoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pdv_sessoes_caixa ON pdv_sessoes(caixa_id);
CREATE INDEX IF NOT EXISTS idx_pdv_sessoes_status ON pdv_sessoes(status);
CREATE INDEX IF NOT EXISTS idx_pdv_sessoes_data ON pdv_sessoes(data_abertura);

-- =============================================
-- TABELA: pdv_vendas (vendas do PDV)
-- =============================================
CREATE TABLE IF NOT EXISTS pdv_vendas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    sessao_id TEXT NOT NULL REFERENCES pdv_sessoes(id),
    caixa_id TEXT NOT NULL REFERENCES pdv_caixas(id),
    
    numero TEXT NOT NULL,
    
    status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN (
        'em_andamento',
        'finalizada',
        'cancelada'
    )),
    
    cliente_id TEXT REFERENCES clientes(id),
    cliente_nome TEXT,
    cliente_cpf_cnpj TEXT,
    
    vendedor_id TEXT REFERENCES usuarios(id),
    vendedor_nome TEXT,
    
    subtotal REAL DEFAULT 0,
    desconto_percentual REAL DEFAULT 0,
    desconto_valor REAL DEFAULT 0,
    acrescimo REAL DEFAULT 0,
    total REAL DEFAULT 0,
    
    credito_utilizado REAL DEFAULT 0,
    
    troco REAL DEFAULT 0,
    
    nfce_id TEXT,
    nfce_numero TEXT,
    nfce_chave TEXT,
    
    motivo_cancelamento TEXT,
    
    data_venda TEXT NOT NULL,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pdv_vendas_empresa ON pdv_vendas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pdv_vendas_sessao ON pdv_vendas(sessao_id);
CREATE INDEX IF NOT EXISTS idx_pdv_vendas_status ON pdv_vendas(status);
CREATE INDEX IF NOT EXISTS idx_pdv_vendas_data ON pdv_vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_pdv_vendas_cliente ON pdv_vendas(cliente_id);

-- =============================================
-- TABELA: pdv_vendas_itens (itens da venda)
-- =============================================
CREATE TABLE IF NOT EXISTS pdv_vendas_itens (
    id TEXT PRIMARY KEY,
    venda_id TEXT NOT NULL REFERENCES pdv_vendas(id),
    
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_nome TEXT,
    produto_ean TEXT,
    
    quantidade REAL NOT NULL,
    unidade TEXT DEFAULT 'UN',
    
    valor_unitario REAL NOT NULL,
    desconto_percentual REAL DEFAULT 0,
    desconto_valor REAL DEFAULT 0,
    valor_total REAL NOT NULL,
    
    cancelado INTEGER DEFAULT 0,
    motivo_cancelamento TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pdv_vendas_itens_venda ON pdv_vendas_itens(venda_id);
CREATE INDEX IF NOT EXISTS idx_pdv_vendas_itens_produto ON pdv_vendas_itens(produto_id);

-- =============================================
-- TABELA: pdv_vendas_pagamentos (pagamentos da venda)
-- =============================================
CREATE TABLE IF NOT EXISTS pdv_vendas_pagamentos (
    id TEXT PRIMARY KEY,
    venda_id TEXT NOT NULL REFERENCES pdv_vendas(id),
    
    forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN (
        'dinheiro',
        'cartao_credito',
        'cartao_debito',
        'pix',
        'credito_cliente',
        'vale',
        'cheque',
        'outros'
    )),
    
    valor REAL NOT NULL,
    
    bandeira TEXT,
    nsu TEXT,
    autorizacao TEXT,
    parcelas INTEGER DEFAULT 1,
    
    pix_txid TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pdv_vendas_pagamentos_venda ON pdv_vendas_pagamentos(venda_id);

-- =============================================
-- TABELA: pdv_movimentacoes (sangrias e suprimentos)
-- =============================================
CREATE TABLE IF NOT EXISTS pdv_movimentacoes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    sessao_id TEXT NOT NULL REFERENCES pdv_sessoes(id),
    
    tipo TEXT NOT NULL CHECK (tipo IN (
        'sangria',
        'suprimento'
    )),
    
    valor REAL NOT NULL,
    motivo TEXT NOT NULL,
    
    operador_id TEXT REFERENCES usuarios(id),
    operador_nome TEXT,
    
    autorizado_por_id TEXT REFERENCES usuarios(id),
    autorizado_por_nome TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pdv_movimentacoes_sessao ON pdv_movimentacoes(sessao_id);

-- =============================================
-- TABELA: config_pdv (configuracoes)
-- =============================================
CREATE TABLE IF NOT EXISTS config_pdv (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL UNIQUE REFERENCES empresas(id),
    
    permitir_desconto INTEGER DEFAULT 1,
    desconto_maximo_percentual REAL DEFAULT 10,
    desconto_requer_senha INTEGER DEFAULT 0,
    
    permitir_venda_sem_estoque INTEGER DEFAULT 0,
    
    identificar_cliente_obrigatorio INTEGER DEFAULT 0,
    cpf_na_nota_obrigatorio INTEGER DEFAULT 0,
    
    emitir_nfce_automatico INTEGER DEFAULT 1,
    imprimir_cupom_automatico INTEGER DEFAULT 1,
    
    abrir_gaveta_dinheiro INTEGER DEFAULT 1,
    
    sangria_requer_autorizacao INTEGER DEFAULT 1,
    suprimento_requer_autorizacao INTEGER DEFAULT 1,
    
    diferenca_caixa_tolerancia REAL DEFAULT 5,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- VIEW: vw_pdv_sessoes_abertas
-- =============================================
CREATE VIEW IF NOT EXISTS vw_pdv_sessoes_abertas AS
SELECT 
    s.*,
    c.codigo as caixa_codigo,
    c.nome as caixa_nome
FROM pdv_sessoes s
JOIN pdv_caixas c ON c.id = s.caixa_id
WHERE s.status = 'aberto';

-- =============================================
-- VIEW: vw_pdv_vendas_hoje
-- =============================================
CREATE VIEW IF NOT EXISTS vw_pdv_vendas_hoje AS
SELECT 
    v.*,
    c.codigo as caixa_codigo,
    c.nome as caixa_nome
FROM pdv_vendas v
JOIN pdv_caixas c ON c.id = v.caixa_id
WHERE date(v.data_venda) = date('now')
AND v.status = 'finalizada';

-- =============================================
-- VIEW: vw_pdv_resumo_diario
-- =============================================
CREATE VIEW IF NOT EXISTS vw_pdv_resumo_diario AS
SELECT 
    empresa_id,
    date(data_venda) as data,
    COUNT(*) as total_vendas,
    SUM(CASE WHEN status = 'finalizada' THEN 1 ELSE 0 END) as vendas_finalizadas,
    SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as vendas_canceladas,
    SUM(CASE WHEN status = 'finalizada' THEN total ELSE 0 END) as valor_total
FROM pdv_vendas
GROUP BY empresa_id, date(data_venda);
