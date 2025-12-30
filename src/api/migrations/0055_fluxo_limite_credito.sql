-- =============================================
-- TRAILSYSTEM ERP - Migration 0055: Fluxo de Limite de Crédito
-- Suporte completo ao fluxo de análise e gestão de limite de crédito
-- =============================================

-- =============================================
-- SOLICITAÇÕES DE AUMENTO DE LIMITE
-- =============================================

CREATE TABLE IF NOT EXISTS solicitacoes_limite_credito (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    cliente_id TEXT NOT NULL REFERENCES clientes(id),
    
    -- Valores
    limite_atual REAL NOT NULL DEFAULT 0,
    limite_solicitado REAL NOT NULL,
    limite_aprovado REAL,
    
    -- Origem
    origem TEXT NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual', 'pedido_bloqueado', 'renovacao')),
    pedido_origem_id TEXT, -- Pedido que originou a solicitação
    
    -- Solicitante
    solicitante_id TEXT REFERENCES usuarios(id),
    solicitante_nome TEXT,
    vendedor_id TEXT REFERENCES usuarios(id),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
        'pendente', 'em_analise', 'aprovado', 'aprovado_parcial', 'reprovado', 'cancelado'
    )),
    
    -- Análise
    analista_id TEXT REFERENCES usuarios(id),
    analista_nome TEXT,
    data_analise TEXT,
    
    -- Justificativas
    justificativa_solicitacao TEXT,
    justificativa_decisao TEXT,
    
    -- Dados da análise
    score_credito INTEGER,
    consulta_serasa TEXT, -- JSON com resultado da consulta
    consulta_spc TEXT, -- JSON com resultado da consulta
    historico_pagamentos TEXT, -- JSON com resumo do histórico
    
    -- Observações
    observacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_limite_empresa ON solicitacoes_limite_credito(empresa_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_limite_cliente ON solicitacoes_limite_credito(cliente_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_limite_status ON solicitacoes_limite_credito(status);

-- =============================================
-- HISTÓRICO DE ALTERAÇÕES DE LIMITE
-- =============================================

CREATE TABLE IF NOT EXISTS historico_limite_credito (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    cliente_id TEXT NOT NULL REFERENCES clientes(id),
    
    -- Valores
    limite_anterior REAL NOT NULL,
    limite_novo REAL NOT NULL,
    
    -- Motivo
    motivo TEXT NOT NULL CHECK (motivo IN (
        'cadastro_inicial', 'aumento_aprovado', 'reducao', 'bloqueio', 'desbloqueio', 'ajuste_manual'
    )),
    
    -- Referência
    solicitacao_id TEXT REFERENCES solicitacoes_limite_credito(id),
    
    -- Usuário
    usuario_id TEXT REFERENCES usuarios(id),
    usuario_nome TEXT,
    
    -- Observação
    observacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historico_limite_cliente ON historico_limite_credito(cliente_id);

-- =============================================
-- CONFIGURAÇÃO DE ANÁLISE DE CRÉDITO
-- =============================================

CREATE TABLE IF NOT EXISTS config_analise_credito (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Limites automáticos
    limite_inicial_padrao REAL DEFAULT 0,
    limite_maximo_automatico REAL DEFAULT 0, -- Até este valor, aprovação automática
    
    -- Critérios de aprovação automática
    dias_cliente_minimo INTEGER DEFAULT 90, -- Mínimo de dias como cliente
    compras_minimas INTEGER DEFAULT 3, -- Mínimo de compras realizadas
    atraso_maximo_dias INTEGER DEFAULT 0, -- Máximo de dias de atraso permitido
    
    -- Score mínimo
    score_minimo_aprovacao INTEGER DEFAULT 500,
    
    -- Consultas externas
    consultar_serasa INTEGER DEFAULT 0,
    consultar_spc INTEGER DEFAULT 0,
    
    -- Notificações
    notificar_vendedor INTEGER DEFAULT 1,
    notificar_financeiro INTEGER DEFAULT 1,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PEDIDOS BLOQUEADOS POR LIMITE
-- =============================================

CREATE TABLE IF NOT EXISTS pedidos_bloqueados_credito (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    cliente_id TEXT NOT NULL REFERENCES clientes(id),
    pedido_id TEXT NOT NULL, -- Referência ao pedido (vendas ou orçamentos)
    pedido_tipo TEXT NOT NULL CHECK (pedido_tipo IN ('venda', 'orcamento')),
    
    -- Valores
    valor_pedido REAL NOT NULL,
    limite_disponivel REAL NOT NULL,
    valor_excedente REAL NOT NULL,
    
    -- Motivo
    motivo TEXT NOT NULL CHECK (motivo IN ('limite_excedido', 'cliente_inadimplente', 'cliente_bloqueado')),
    
    -- Detalhes do saldo
    saldo_pedidos_abertos REAL DEFAULT 0,
    saldo_titulos_vencer REAL DEFAULT 0,
    saldo_titulos_vencidos REAL DEFAULT 0,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'bloqueado' CHECK (status IN ('bloqueado', 'liberado', 'cancelado')),
    
    -- Liberação
    liberado_por_id TEXT REFERENCES usuarios(id),
    liberado_por_nome TEXT,
    data_liberacao TEXT,
    motivo_liberacao TEXT,
    
    -- Solicitação de aumento
    solicitacao_limite_id TEXT REFERENCES solicitacoes_limite_credito(id),
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pedidos_bloqueados_empresa ON pedidos_bloqueados_credito(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_bloqueados_cliente ON pedidos_bloqueados_credito(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_bloqueados_status ON pedidos_bloqueados_credito(status);

-- =============================================
-- VIEW DE SALDO DE CRÉDITO DO CLIENTE
-- =============================================

CREATE VIEW IF NOT EXISTS vw_saldo_credito_cliente AS
SELECT 
    c.id as cliente_id,
    c.empresa_id,
    c.razao_social as cliente_nome,
    c.limite_credito as limite_aprovado,
    
    -- Pedidos em aberto (não faturados)
    COALESCE((
        SELECT SUM(v.valor_total)
        FROM vendas v
        WHERE v.cliente_id = c.id 
        AND v.status IN ('pendente', 'aprovado', 'em_separacao')
        AND v.deleted_at IS NULL
    ), 0) as saldo_pedidos_abertos,
    
    -- Títulos a vencer
    COALESCE((
        SELECT SUM(cr.valor_aberto)
        FROM contas_receber cr
        WHERE cr.cliente_id = c.id 
        AND cr.status = 'aberto'
        AND cr.data_vencimento >= date('now')
        AND cr.deleted_at IS NULL
    ), 0) as saldo_titulos_vencer,
    
    -- Títulos vencidos
    COALESCE((
        SELECT SUM(cr.valor_aberto)
        FROM contas_receber cr
        WHERE cr.cliente_id = c.id 
        AND cr.status = 'aberto'
        AND cr.data_vencimento < date('now')
        AND cr.deleted_at IS NULL
    ), 0) as saldo_titulos_vencidos,
    
    -- Dias de maior atraso
    COALESCE((
        SELECT MAX(CAST(julianday('now') - julianday(cr.data_vencimento) AS INTEGER))
        FROM contas_receber cr
        WHERE cr.cliente_id = c.id 
        AND cr.status = 'aberto'
        AND cr.data_vencimento < date('now')
        AND cr.deleted_at IS NULL
    ), 0) as maior_atraso_dias,
    
    -- Bloqueio ativo
    CASE WHEN EXISTS (
        SELECT 1 FROM clientes_bloqueios cb 
        WHERE cb.cliente_id = c.id AND cb.status = 'ativo'
    ) THEN 1 ELSE 0 END as cliente_bloqueado
    
FROM clientes c
WHERE c.deleted_at IS NULL;

-- =============================================
-- VIEW DE LIMITE DISPONÍVEL
-- =============================================

CREATE VIEW IF NOT EXISTS vw_limite_disponivel AS
SELECT 
    cliente_id,
    empresa_id,
    cliente_nome,
    limite_aprovado,
    saldo_pedidos_abertos,
    saldo_titulos_vencer,
    saldo_titulos_vencidos,
    (saldo_pedidos_abertos + saldo_titulos_vencer + saldo_titulos_vencidos) as saldo_comprometido,
    (limite_aprovado - saldo_pedidos_abertos - saldo_titulos_vencer - saldo_titulos_vencidos) as limite_disponivel,
    maior_atraso_dias,
    cliente_bloqueado,
    CASE 
        WHEN cliente_bloqueado = 1 THEN 'bloqueado'
        WHEN saldo_titulos_vencidos > 0 THEN 'inadimplente'
        WHEN (limite_aprovado - saldo_pedidos_abertos - saldo_titulos_vencer - saldo_titulos_vencidos) <= 0 THEN 'sem_limite'
        ELSE 'disponivel'
    END as situacao_credito
FROM vw_saldo_credito_cliente;
