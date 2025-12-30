-- =============================================
-- TRAILSYSTEM ERP - Migration 0053: Fluxo de Compra Completa
-- Suporte completo ao fluxo de compras: solicitação, cotação, pedido, recebimento
-- =============================================

-- =============================================
-- SOLICITAÇÕES DE COMPRA
-- Origem: sugestão automática ou manual
-- =============================================

CREATE TABLE IF NOT EXISTS solicitacoes_compra (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    filial_id TEXT REFERENCES filiais(id),
    
    -- Identificação
    numero INTEGER NOT NULL,
    data_solicitacao TEXT NOT NULL,
    
    -- Origem
    origem TEXT NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual', 'sugestao_automatica', 'ponto_reposicao')),
    
    -- Solicitante
    solicitante_id TEXT REFERENCES usuarios(id),
    solicitante_nome TEXT,
    departamento TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_cotacao', 'cotada', 'pedido_gerado', 'cancelada')),
    
    -- Urgência
    urgencia TEXT DEFAULT 'normal' CHECK (urgencia IN ('baixa', 'normal', 'alta', 'urgente')),
    data_necessidade TEXT,
    
    -- Observações
    justificativa TEXT,
    observacao TEXT,
    
    -- Totais
    valor_estimado REAL DEFAULT 0,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_compra_empresa ON solicitacoes_compra(empresa_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_compra_status ON solicitacoes_compra(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_compra_data ON solicitacoes_compra(data_solicitacao);

-- Itens da solicitação
CREATE TABLE IF NOT EXISTS solicitacoes_compra_itens (
    id TEXT PRIMARY KEY,
    solicitacao_id TEXT NOT NULL REFERENCES solicitacoes_compra(id) ON DELETE CASCADE,
    
    -- Produto
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_descricao TEXT,
    unidade TEXT,
    
    -- Quantidades
    quantidade REAL NOT NULL,
    quantidade_atendida REAL DEFAULT 0,
    
    -- Valores estimados
    valor_unitario_estimado REAL,
    valor_total_estimado REAL,
    
    -- Observação
    observacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_itens_solicitacao ON solicitacoes_compra_itens(solicitacao_id);

-- =============================================
-- COTAÇÕES DE COMPRA
-- Envio para múltiplos fornecedores
-- =============================================

CREATE TABLE IF NOT EXISTS cotacoes_compra (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    filial_id TEXT REFERENCES filiais(id),
    
    -- Identificação
    numero INTEGER NOT NULL,
    data_abertura TEXT NOT NULL,
    data_fechamento TEXT,
    data_validade TEXT,
    
    -- Vínculo com solicitação
    solicitacao_id TEXT REFERENCES solicitacoes_compra(id),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_analise', 'fechada', 'cancelada')),
    
    -- Comprador responsável
    comprador_id TEXT REFERENCES usuarios(id),
    comprador_nome TEXT,
    
    -- Observações
    observacao TEXT,
    criterio_selecao TEXT DEFAULT 'menor_preco' CHECK (criterio_selecao IN ('menor_preco', 'melhor_prazo', 'melhor_condicao', 'manual')),
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cotacoes_compra_empresa ON cotacoes_compra(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cotacoes_compra_status ON cotacoes_compra(status);

-- Itens da cotação
CREATE TABLE IF NOT EXISTS cotacoes_compra_itens (
    id TEXT PRIMARY KEY,
    cotacao_id TEXT NOT NULL REFERENCES cotacoes_compra(id) ON DELETE CASCADE,
    
    -- Produto
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_descricao TEXT,
    unidade TEXT,
    
    -- Quantidade solicitada
    quantidade REAL NOT NULL,
    
    -- Especificações
    especificacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cotacoes_itens_cotacao ON cotacoes_compra_itens(cotacao_id);

-- Fornecedores convidados para cotação
CREATE TABLE IF NOT EXISTS cotacoes_compra_fornecedores (
    id TEXT PRIMARY KEY,
    cotacao_id TEXT NOT NULL REFERENCES cotacoes_compra(id) ON DELETE CASCADE,
    fornecedor_id TEXT NOT NULL REFERENCES fornecedores(id),
    
    -- Status do convite
    status TEXT NOT NULL DEFAULT 'convidado' CHECK (status IN ('convidado', 'respondido', 'recusado', 'sem_resposta', 'selecionado')),
    
    -- Datas
    data_convite TEXT NOT NULL,
    data_resposta TEXT,
    
    -- Condições gerais da proposta
    prazo_entrega_dias INTEGER,
    condicao_pagamento TEXT,
    validade_proposta_dias INTEGER,
    frete TEXT CHECK (frete IN ('CIF', 'FOB')),
    valor_frete REAL DEFAULT 0,
    
    -- Totais
    valor_total REAL DEFAULT 0,
    desconto_total REAL DEFAULT 0,
    
    -- Observações
    observacao TEXT,
    
    -- Seleção
    selecionado INTEGER DEFAULT 0,
    motivo_selecao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cotacoes_fornecedores_cotacao ON cotacoes_compra_fornecedores(cotacao_id);
CREATE INDEX IF NOT EXISTS idx_cotacoes_fornecedores_fornecedor ON cotacoes_compra_fornecedores(fornecedor_id);

-- Respostas dos fornecedores por item
CREATE TABLE IF NOT EXISTS cotacoes_compra_respostas (
    id TEXT PRIMARY KEY,
    cotacao_fornecedor_id TEXT NOT NULL REFERENCES cotacoes_compra_fornecedores(id) ON DELETE CASCADE,
    cotacao_item_id TEXT NOT NULL REFERENCES cotacoes_compra_itens(id) ON DELETE CASCADE,
    
    -- Valores
    valor_unitario REAL NOT NULL,
    desconto_percentual REAL DEFAULT 0,
    valor_total REAL NOT NULL,
    
    -- Disponibilidade
    quantidade_disponivel REAL,
    prazo_entrega_dias INTEGER,
    
    -- Observação
    observacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cotacoes_respostas_fornecedor ON cotacoes_compra_respostas(cotacao_fornecedor_id);

-- =============================================
-- PEDIDOS DE COMPRA
-- Com workflow de aprovação
-- =============================================

CREATE TABLE IF NOT EXISTS pedidos_compra (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    filial_id TEXT REFERENCES filiais(id),
    
    -- Identificação
    numero INTEGER NOT NULL,
    data_emissao TEXT NOT NULL,
    data_previsao_entrega TEXT,
    
    -- Fornecedor
    fornecedor_id TEXT NOT NULL REFERENCES fornecedores(id),
    fornecedor_nome TEXT,
    fornecedor_cnpj TEXT,
    
    -- Vínculos
    cotacao_id TEXT REFERENCES cotacoes_compra(id),
    cotacao_fornecedor_id TEXT REFERENCES cotacoes_compra_fornecedores(id),
    solicitacao_id TEXT REFERENCES solicitacoes_compra(id),
    
    -- Comprador
    comprador_id TEXT REFERENCES usuarios(id),
    comprador_nome TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN (
        'rascunho', 'aguardando_aprovacao', 'aprovado', 'reprovado',
        'enviado', 'confirmado', 'parcialmente_recebido', 'recebido', 'cancelado'
    )),
    
    -- Aprovação
    valor_limite_aprovacao REAL,
    aprovador_id TEXT REFERENCES usuarios(id),
    aprovador_nome TEXT,
    data_aprovacao TEXT,
    motivo_reprovacao TEXT,
    
    -- Condições
    condicao_pagamento TEXT,
    prazo_pagamento_dias INTEGER,
    forma_pagamento TEXT,
    
    -- Frete
    frete TEXT DEFAULT 'CIF' CHECK (frete IN ('CIF', 'FOB')),
    valor_frete REAL DEFAULT 0,
    transportadora_id TEXT,
    
    -- Totais
    subtotal REAL DEFAULT 0,
    desconto_total REAL DEFAULT 0,
    valor_total REAL DEFAULT 0,
    
    -- Observações
    observacao TEXT,
    observacao_interna TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pedidos_compra_empresa ON pedidos_compra(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_compra_fornecedor ON pedidos_compra(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_compra_status ON pedidos_compra(status);

-- Itens do pedido de compra
CREATE TABLE IF NOT EXISTS pedidos_compra_itens (
    id TEXT PRIMARY KEY,
    pedido_id TEXT NOT NULL REFERENCES pedidos_compra(id) ON DELETE CASCADE,
    
    -- Produto
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_descricao TEXT,
    unidade TEXT,
    ncm TEXT,
    
    -- Quantidades
    quantidade REAL NOT NULL,
    quantidade_recebida REAL DEFAULT 0,
    
    -- Valores
    valor_unitario REAL NOT NULL,
    desconto_percentual REAL DEFAULT 0,
    desconto_valor REAL DEFAULT 0,
    valor_total REAL NOT NULL,
    
    -- IPI
    ipi_percentual REAL DEFAULT 0,
    ipi_valor REAL DEFAULT 0,
    
    -- Observação
    observacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pedidos_compra_itens_pedido ON pedidos_compra_itens(pedido_id);

-- =============================================
-- RECEBIMENTOS DE MERCADORIA
-- Conferência física e divergências
-- =============================================

CREATE TABLE IF NOT EXISTS recebimentos_compra (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    filial_id TEXT REFERENCES filiais(id),
    
    -- Identificação
    numero INTEGER NOT NULL,
    data_recebimento TEXT NOT NULL,
    
    -- Vínculo com pedido
    pedido_id TEXT REFERENCES pedidos_compra(id),
    
    -- NF-e do fornecedor
    nfe_chave TEXT,
    nfe_numero TEXT,
    nfe_serie TEXT,
    nfe_data_emissao TEXT,
    nfe_valor_total REAL,
    
    -- Fornecedor
    fornecedor_id TEXT NOT NULL REFERENCES fornecedores(id),
    fornecedor_nome TEXT,
    
    -- Conferente
    conferente_id TEXT REFERENCES usuarios(id),
    conferente_nome TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'em_conferencia' CHECK (status IN (
        'em_conferencia', 'conferido', 'com_divergencia', 'finalizado', 'cancelado'
    )),
    
    -- Resultado da conferência
    conferencia_ok INTEGER DEFAULT 0,
    tem_divergencia INTEGER DEFAULT 0,
    
    -- Totais
    valor_total_nfe REAL DEFAULT 0,
    valor_total_conferido REAL DEFAULT 0,
    
    -- Observações
    observacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recebimentos_empresa ON recebimentos_compra(empresa_id);
CREATE INDEX IF NOT EXISTS idx_recebimentos_pedido ON recebimentos_compra(pedido_id);
CREATE INDEX IF NOT EXISTS idx_recebimentos_nfe ON recebimentos_compra(nfe_chave);

-- Itens do recebimento
CREATE TABLE IF NOT EXISTS recebimentos_compra_itens (
    id TEXT PRIMARY KEY,
    recebimento_id TEXT NOT NULL REFERENCES recebimentos_compra(id) ON DELETE CASCADE,
    pedido_item_id TEXT REFERENCES pedidos_compra_itens(id),
    
    -- Produto
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_descricao TEXT,
    unidade TEXT,
    
    -- Quantidades
    quantidade_nfe REAL NOT NULL,
    quantidade_conferida REAL DEFAULT 0,
    quantidade_aceita REAL DEFAULT 0,
    
    -- Valores
    valor_unitario REAL NOT NULL,
    valor_total REAL NOT NULL,
    
    -- Conferência
    conferido INTEGER DEFAULT 0,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recebimentos_itens_recebimento ON recebimentos_compra_itens(recebimento_id);

-- =============================================
-- DIVERGÊNCIAS DE RECEBIMENTO
-- Falta, sobra, avaria
-- =============================================

CREATE TABLE IF NOT EXISTS recebimentos_divergencias (
    id TEXT PRIMARY KEY,
    recebimento_id TEXT NOT NULL REFERENCES recebimentos_compra(id) ON DELETE CASCADE,
    recebimento_item_id TEXT NOT NULL REFERENCES recebimentos_compra_itens(id) ON DELETE CASCADE,
    
    -- Tipo de divergência
    tipo TEXT NOT NULL CHECK (tipo IN ('falta', 'sobra', 'avaria', 'produto_errado', 'qualidade')),
    
    -- Quantidades
    quantidade_esperada REAL NOT NULL,
    quantidade_recebida REAL NOT NULL,
    quantidade_divergente REAL NOT NULL,
    
    -- Descrição
    descricao TEXT,
    
    -- Ação tomada
    acao TEXT CHECK (acao IN ('reclamar_fornecedor', 'devolver', 'aceitar', 'solicitar_credito', 'solicitar_troca')),
    acao_descricao TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_tratamento', 'resolvida', 'cancelada')),
    
    -- Resolução
    data_resolucao TEXT,
    resolucao_descricao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_divergencias_recebimento ON recebimentos_divergencias(recebimento_id);
CREATE INDEX IF NOT EXISTS idx_divergencias_tipo ON recebimentos_divergencias(tipo);
CREATE INDEX IF NOT EXISTS idx_divergencias_status ON recebimentos_divergencias(status);

-- =============================================
-- HISTÓRICO DE APROVAÇÕES
-- Workflow de aprovação de pedidos
-- =============================================

CREATE TABLE IF NOT EXISTS pedidos_compra_aprovacoes (
    id TEXT PRIMARY KEY,
    pedido_id TEXT NOT NULL REFERENCES pedidos_compra(id) ON DELETE CASCADE,
    
    -- Aprovador
    aprovador_id TEXT NOT NULL REFERENCES usuarios(id),
    aprovador_nome TEXT,
    
    -- Decisão
    decisao TEXT NOT NULL CHECK (decisao IN ('aprovado', 'reprovado', 'devolvido')),
    
    -- Motivo
    motivo TEXT,
    
    -- Valor no momento da aprovação
    valor_pedido REAL,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aprovacoes_pedido ON pedidos_compra_aprovacoes(pedido_id);

-- =============================================
-- CONFIGURAÇÃO DE LIMITES DE APROVAÇÃO
-- =============================================

CREATE TABLE IF NOT EXISTS limites_aprovacao_compra (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Perfil ou usuário
    perfil_id TEXT REFERENCES perfis(id),
    usuario_id TEXT REFERENCES usuarios(id),
    
    -- Limites
    valor_minimo REAL DEFAULT 0,
    valor_maximo REAL,
    
    -- Ativo
    ativo INTEGER DEFAULT 1,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_limites_aprovacao_empresa ON limites_aprovacao_compra(empresa_id);

-- =============================================
-- VIEW DE PEDIDOS COM STATUS DE RECEBIMENTO
-- =============================================

CREATE VIEW IF NOT EXISTS vw_pedidos_compra_status AS
SELECT 
    p.*,
    f.razao_social as fornecedor_razao_social,
    f.nome_fantasia as fornecedor_fantasia,
    COALESCE(SUM(pi.quantidade_recebida), 0) as total_recebido,
    COALESCE(SUM(pi.quantidade), 0) as total_pedido,
    CASE 
        WHEN COALESCE(SUM(pi.quantidade_recebida), 0) = 0 THEN 'nao_recebido'
        WHEN COALESCE(SUM(pi.quantidade_recebida), 0) < COALESCE(SUM(pi.quantidade), 0) THEN 'parcial'
        ELSE 'completo'
    END as status_recebimento
FROM pedidos_compra p
LEFT JOIN fornecedores f ON f.id = p.fornecedor_id
LEFT JOIN pedidos_compra_itens pi ON pi.pedido_id = p.id
GROUP BY p.id;

-- =============================================
-- VIEW DE COTAÇÕES COM MELHOR PREÇO
-- =============================================

CREATE VIEW IF NOT EXISTS vw_cotacoes_melhor_preco AS
SELECT 
    c.id as cotacao_id,
    c.numero as cotacao_numero,
    ci.id as item_id,
    ci.produto_id,
    ci.produto_descricao,
    ci.quantidade,
    cf.fornecedor_id,
    f.razao_social as fornecedor_nome,
    cr.valor_unitario,
    cr.valor_total,
    cr.prazo_entrega_dias,
    ROW_NUMBER() OVER (PARTITION BY ci.id ORDER BY cr.valor_unitario ASC) as ranking_preco
FROM cotacoes_compra c
JOIN cotacoes_compra_itens ci ON ci.cotacao_id = c.id
JOIN cotacoes_compra_fornecedores cf ON cf.cotacao_id = c.id
JOIN cotacoes_compra_respostas cr ON cr.cotacao_fornecedor_id = cf.id AND cr.cotacao_item_id = ci.id
JOIN fornecedores f ON f.id = cf.fornecedor_id
WHERE c.status = 'aberta' OR c.status = 'em_analise';
