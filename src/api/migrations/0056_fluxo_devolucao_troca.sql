-- =============================================
-- TRAILSYSTEM ERP - Migration 0056: Fluxo de Devolução e Troca
-- Suporte completo aos fluxos de devolução e troca de vendas
-- =============================================

-- =============================================
-- DEVOLUÇÕES DE VENDA
-- =============================================

CREATE TABLE IF NOT EXISTS devolucoes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Venda original
    venda_id TEXT NOT NULL REFERENCES vendas(id),
    venda_numero TEXT,
    cliente_id TEXT NOT NULL REFERENCES clientes(id),
    
    -- Numeração
    numero TEXT NOT NULL,
    
    -- Datas
    data_solicitacao TEXT NOT NULL,
    data_aprovacao TEXT,
    data_conclusao TEXT,
    
    -- Motivo
    motivo TEXT NOT NULL CHECK (motivo IN (
        'defeito', 'arrependimento', 'produto_errado', 'avaria_transporte', 
        'nao_conforme', 'duplicidade', 'outro'
    )),
    motivo_descricao TEXT,
    
    -- Condição do produto
    condicao_produto TEXT CHECK (condicao_produto IN (
        'novo_lacrado', 'novo_aberto', 'usado_bom', 'usado_regular', 'danificado'
    )),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
        'pendente', 'em_analise', 'aprovado', 'reprovado', 'em_processamento', 
        'aguardando_produto', 'produto_recebido', 'concluido', 'cancelado'
    )),
    
    -- Aprovação
    requer_aprovacao INTEGER DEFAULT 0,
    aprovador_id TEXT REFERENCES usuarios(id),
    aprovador_nome TEXT,
    motivo_reprovacao TEXT,
    
    -- Valores
    valor_total_itens REAL NOT NULL DEFAULT 0,
    valor_frete_devolucao REAL DEFAULT 0,
    valor_restituicao REAL DEFAULT 0,
    
    -- Tipo de estorno
    tipo_estorno TEXT CHECK (tipo_estorno IN ('dinheiro', 'credito', 'troca')),
    
    -- NF-e de entrada (devolução)
    nfe_entrada_id TEXT,
    nfe_entrada_numero TEXT,
    nfe_entrada_chave TEXT,
    
    -- Financeiro
    estorno_financeiro_id TEXT,
    credito_gerado_id TEXT REFERENCES clientes_creditos(id),
    
    -- Prazo
    prazo_devolucao_dias INTEGER DEFAULT 7,
    dentro_prazo INTEGER DEFAULT 1,
    
    -- Solicitante
    solicitante_id TEXT REFERENCES usuarios(id),
    solicitante_nome TEXT,
    
    -- Observações
    observacao TEXT,
    observacao_interna TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_devolucoes_empresa ON devolucoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_devolucoes_venda ON devolucoes(venda_id);
CREATE INDEX IF NOT EXISTS idx_devolucoes_cliente ON devolucoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_devolucoes_status ON devolucoes(status);
CREATE INDEX IF NOT EXISTS idx_devolucoes_numero ON devolucoes(numero);

-- =============================================
-- ITENS DA DEVOLUÇÃO
-- =============================================

CREATE TABLE IF NOT EXISTS devolucoes_itens (
    id TEXT PRIMARY KEY,
    devolucao_id TEXT NOT NULL REFERENCES devolucoes(id),
    
    -- Item original da venda
    venda_item_id TEXT,
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_nome TEXT,
    
    -- Quantidades
    quantidade_vendida REAL NOT NULL,
    quantidade_devolvida REAL NOT NULL,
    unidade TEXT DEFAULT 'UN',
    
    -- Valores
    valor_unitario REAL NOT NULL,
    valor_total REAL NOT NULL,
    
    -- Condição
    condicao TEXT CHECK (condicao IN (
        'novo_lacrado', 'novo_aberto', 'usado_bom', 'usado_regular', 'danificado'
    )),
    
    -- Motivo específico do item
    motivo_item TEXT,
    
    -- Estoque
    estoque_entrada_realizada INTEGER DEFAULT 0,
    local_estoque_id TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devolucoes_itens_devolucao ON devolucoes_itens(devolucao_id);
CREATE INDEX IF NOT EXISTS idx_devolucoes_itens_produto ON devolucoes_itens(produto_id);

-- =============================================
-- TROCAS DE VENDA
-- =============================================

CREATE TABLE IF NOT EXISTS trocas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Venda original
    venda_id TEXT NOT NULL REFERENCES vendas(id),
    venda_numero TEXT,
    cliente_id TEXT NOT NULL REFERENCES clientes(id),
    
    -- Numeração
    numero TEXT NOT NULL,
    
    -- Datas
    data_solicitacao TEXT NOT NULL,
    data_aprovacao TEXT,
    data_conclusao TEXT,
    
    -- Motivo
    motivo TEXT NOT NULL CHECK (motivo IN (
        'defeito', 'tamanho_errado', 'cor_errada', 'modelo_errado', 
        'preferencia', 'avaria_transporte', 'outro'
    )),
    motivo_descricao TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
        'pendente', 'em_analise', 'aprovado', 'reprovado', 'em_processamento',
        'aguardando_produto_antigo', 'produto_antigo_recebido', 
        'aguardando_produto_novo', 'produto_novo_enviado', 'concluido', 'cancelado'
    )),
    
    -- Aprovação
    requer_aprovacao INTEGER DEFAULT 0,
    aprovador_id TEXT REFERENCES usuarios(id),
    aprovador_nome TEXT,
    motivo_reprovacao TEXT,
    
    -- Valores
    valor_itens_antigos REAL NOT NULL DEFAULT 0,
    valor_itens_novos REAL NOT NULL DEFAULT 0,
    valor_diferenca REAL DEFAULT 0, -- Positivo = cliente paga, Negativo = cliente recebe
    
    -- Tipo de diferença
    tipo_diferenca TEXT CHECK (tipo_diferenca IN ('cliente_paga', 'cliente_recebe', 'sem_diferenca')),
    
    -- NF-e de devolução (produto antigo)
    nfe_devolucao_id TEXT,
    nfe_devolucao_numero TEXT,
    nfe_devolucao_chave TEXT,
    
    -- NF-e de venda (produto novo)
    nfe_venda_id TEXT,
    nfe_venda_numero TEXT,
    nfe_venda_chave TEXT,
    
    -- Financeiro
    financeiro_diferenca_id TEXT,
    credito_gerado_id TEXT REFERENCES clientes_creditos(id),
    
    -- Prazo
    prazo_troca_dias INTEGER DEFAULT 7,
    dentro_prazo INTEGER DEFAULT 1,
    
    -- Solicitante
    solicitante_id TEXT REFERENCES usuarios(id),
    solicitante_nome TEXT,
    
    -- Observações
    observacao TEXT,
    observacao_interna TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_trocas_empresa ON trocas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_trocas_venda ON trocas(venda_id);
CREATE INDEX IF NOT EXISTS idx_trocas_cliente ON trocas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_trocas_status ON trocas(status);
CREATE INDEX IF NOT EXISTS idx_trocas_numero ON trocas(numero);

-- =============================================
-- ITENS ANTIGOS DA TROCA (devolvidos)
-- =============================================

CREATE TABLE IF NOT EXISTS trocas_itens_antigos (
    id TEXT PRIMARY KEY,
    troca_id TEXT NOT NULL REFERENCES trocas(id),
    
    -- Item original da venda
    venda_item_id TEXT,
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_nome TEXT,
    
    -- Quantidades
    quantidade REAL NOT NULL,
    unidade TEXT DEFAULT 'UN',
    
    -- Valores
    valor_unitario REAL NOT NULL,
    valor_total REAL NOT NULL,
    
    -- Condição
    condicao TEXT CHECK (condicao IN (
        'novo_lacrado', 'novo_aberto', 'usado_bom', 'usado_regular', 'danificado'
    )),
    
    -- Estoque
    estoque_entrada_realizada INTEGER DEFAULT 0,
    local_estoque_id TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trocas_itens_antigos_troca ON trocas_itens_antigos(troca_id);

-- =============================================
-- ITENS NOVOS DA TROCA (enviados)
-- =============================================

CREATE TABLE IF NOT EXISTS trocas_itens_novos (
    id TEXT PRIMARY KEY,
    troca_id TEXT NOT NULL REFERENCES trocas(id),
    
    -- Novo produto
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_nome TEXT,
    
    -- Quantidades
    quantidade REAL NOT NULL,
    unidade TEXT DEFAULT 'UN',
    
    -- Valores
    valor_unitario REAL NOT NULL,
    valor_total REAL NOT NULL,
    
    -- Estoque
    estoque_saida_realizada INTEGER DEFAULT 0,
    local_estoque_id TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trocas_itens_novos_troca ON trocas_itens_novos(troca_id);

-- =============================================
-- CONFIGURAÇÃO DE DEVOLUÇÃO/TROCA
-- =============================================

CREATE TABLE IF NOT EXISTS config_devolucao_troca (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Prazos
    prazo_devolucao_dias INTEGER DEFAULT 7,
    prazo_troca_dias INTEGER DEFAULT 30,
    
    -- Aprovação
    valor_minimo_aprovacao REAL DEFAULT 0, -- Acima deste valor, requer aprovação
    aprovador_padrao_id TEXT REFERENCES usuarios(id),
    
    -- Estorno padrão
    tipo_estorno_padrao TEXT DEFAULT 'credito' CHECK (tipo_estorno_padrao IN ('dinheiro', 'credito')),
    
    -- Estoque
    local_estoque_devolucao_id TEXT, -- Local padrão para entrada de devoluções
    
    -- Notificações
    notificar_vendedor INTEGER DEFAULT 1,
    notificar_financeiro INTEGER DEFAULT 1,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- HISTÓRICO DE DEVOLUÇÃO/TROCA
-- =============================================

CREATE TABLE IF NOT EXISTS devolucoes_trocas_historico (
    id TEXT PRIMARY KEY,
    
    -- Referência
    tipo TEXT NOT NULL CHECK (tipo IN ('devolucao', 'troca')),
    referencia_id TEXT NOT NULL, -- ID da devolução ou troca
    
    -- Ação
    acao TEXT NOT NULL,
    status_anterior TEXT,
    status_novo TEXT,
    
    -- Usuário
    usuario_id TEXT REFERENCES usuarios(id),
    usuario_nome TEXT,
    
    -- Detalhes
    descricao TEXT,
    dados_json TEXT, -- JSON com dados adicionais
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devolucoes_trocas_historico_ref ON devolucoes_trocas_historico(tipo, referencia_id);

-- =============================================
-- VIEW DE DEVOLUÇÕES PENDENTES
-- =============================================

CREATE VIEW IF NOT EXISTS vw_devolucoes_pendentes AS
SELECT 
    d.id,
    d.empresa_id,
    d.numero,
    d.venda_numero,
    d.cliente_id,
    c.razao_social as cliente_nome,
    d.motivo,
    d.status,
    d.valor_total_itens,
    d.tipo_estorno,
    d.data_solicitacao,
    d.requer_aprovacao,
    CAST(julianday('now') - julianday(d.data_solicitacao) AS INTEGER) as dias_pendente
FROM devolucoes d
JOIN clientes c ON c.id = d.cliente_id
WHERE d.status IN ('pendente', 'em_analise', 'aprovado', 'em_processamento', 'aguardando_produto')
AND d.deleted_at IS NULL;

-- =============================================
-- VIEW DE TROCAS PENDENTES
-- =============================================

CREATE VIEW IF NOT EXISTS vw_trocas_pendentes AS
SELECT 
    t.id,
    t.empresa_id,
    t.numero,
    t.venda_numero,
    t.cliente_id,
    c.razao_social as cliente_nome,
    t.motivo,
    t.status,
    t.valor_itens_antigos,
    t.valor_itens_novos,
    t.valor_diferenca,
    t.tipo_diferenca,
    t.data_solicitacao,
    t.requer_aprovacao,
    CAST(julianday('now') - julianday(t.data_solicitacao) AS INTEGER) as dias_pendente
FROM trocas t
JOIN clientes c ON c.id = t.cliente_id
WHERE t.status IN ('pendente', 'em_analise', 'aprovado', 'em_processamento', 
    'aguardando_produto_antigo', 'produto_antigo_recebido', 'aguardando_produto_novo')
AND t.deleted_at IS NULL;
