-- =============================================
-- TRAILSYSTEM ERP - Migration 0062
-- Fluxo de Bonificacao
-- Criado em: 2025-12-30
-- =============================================

-- =============================================
-- TABELA: bonificacoes (itens bonificados em vendas)
-- =============================================
CREATE TABLE IF NOT EXISTS bonificacoes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    venda_id TEXT REFERENCES pedidos_venda(id),
    venda_numero TEXT,
    
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_nome TEXT,
    
    quantidade REAL NOT NULL,
    unidade TEXT DEFAULT 'UN',
    
    valor_unitario REAL DEFAULT 0,
    valor_total REAL DEFAULT 0,
    
    motivo TEXT NOT NULL CHECK (motivo IN (
        'amostra',
        'acordo_comercial',
        'avaria_parcial',
        'brinde_promocional',
        'fidelizacao',
        'compensacao',
        'outro'
    )),
    motivo_descricao TEXT,
    
    cfop TEXT DEFAULT '5.910',
    
    status TEXT DEFAULT 'pendente' CHECK (status IN (
        'pendente',
        'aprovado',
        'reprovado',
        'faturado',
        'cancelado'
    )),
    
    cliente_id TEXT REFERENCES clientes(id),
    cliente_nome TEXT,
    
    vendedor_id TEXT REFERENCES usuarios(id),
    vendedor_nome TEXT,
    
    aprovador_id TEXT REFERENCES usuarios(id),
    aprovador_nome TEXT,
    data_aprovacao TEXT,
    motivo_reprovacao TEXT,
    
    nfe_id TEXT,
    nfe_numero TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bonificacoes_empresa ON bonificacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bonificacoes_venda ON bonificacoes(venda_id);
CREATE INDEX IF NOT EXISTS idx_bonificacoes_produto ON bonificacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_bonificacoes_status ON bonificacoes(status);
CREATE INDEX IF NOT EXISTS idx_bonificacoes_vendedor ON bonificacoes(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_bonificacoes_data ON bonificacoes(created_at);

-- =============================================
-- TABELA: limites_bonificacao (limites por vendedor/periodo)
-- =============================================
CREATE TABLE IF NOT EXISTS limites_bonificacao (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    tipo TEXT NOT NULL CHECK (tipo IN (
        'vendedor',
        'equipe',
        'empresa'
    )),
    
    referencia_id TEXT,
    referencia_nome TEXT,
    
    periodo TEXT NOT NULL CHECK (periodo IN (
        'diario',
        'semanal',
        'mensal',
        'anual'
    )),
    
    limite_quantidade REAL DEFAULT 0,
    limite_valor REAL DEFAULT 0,
    
    ativo INTEGER DEFAULT 1,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(empresa_id, tipo, referencia_id, periodo)
);

CREATE INDEX IF NOT EXISTS idx_limites_bonificacao_empresa ON limites_bonificacao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_limites_bonificacao_tipo ON limites_bonificacao(tipo);

-- =============================================
-- TABELA: saldos_bonificacao (saldos utilizados)
-- =============================================
CREATE TABLE IF NOT EXISTS saldos_bonificacao (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    tipo TEXT NOT NULL CHECK (tipo IN (
        'vendedor',
        'equipe',
        'empresa'
    )),
    
    referencia_id TEXT,
    
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    
    quantidade_utilizada REAL DEFAULT 0,
    valor_utilizado REAL DEFAULT 0,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(empresa_id, tipo, referencia_id, ano, mes)
);

CREATE INDEX IF NOT EXISTS idx_saldos_bonificacao_empresa ON saldos_bonificacao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_saldos_bonificacao_periodo ON saldos_bonificacao(ano, mes);

-- =============================================
-- TABELA: config_bonificacao (configuracoes)
-- =============================================
CREATE TABLE IF NOT EXISTS config_bonificacao (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL UNIQUE REFERENCES empresas(id),
    
    requer_aprovacao INTEGER DEFAULT 1,
    valor_minimo_aprovacao REAL DEFAULT 0,
    
    cfop_mesma_uf TEXT DEFAULT '5.910',
    cfop_outra_uf TEXT DEFAULT '6.910',
    
    motivos_permitidos TEXT DEFAULT 'amostra,acordo_comercial,avaria_parcial,brinde_promocional,fidelizacao,compensacao,outro',
    
    limite_padrao_mensal_qtd REAL DEFAULT 0,
    limite_padrao_mensal_valor REAL DEFAULT 0,
    
    notificar_aprovador INTEGER DEFAULT 1,
    notificar_vendedor INTEGER DEFAULT 1,
    
    bloquear_acima_limite INTEGER DEFAULT 1,
    permitir_excecao_diretor INTEGER DEFAULT 1,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: bonificacoes_historico (auditoria)
-- =============================================
CREATE TABLE IF NOT EXISTS bonificacoes_historico (
    id TEXT PRIMARY KEY,
    bonificacao_id TEXT NOT NULL REFERENCES bonificacoes(id),
    acao TEXT NOT NULL,
    status_anterior TEXT,
    status_novo TEXT,
    usuario_id TEXT REFERENCES usuarios(id),
    usuario_nome TEXT,
    descricao TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bonificacoes_historico_bonificacao ON bonificacoes_historico(bonificacao_id);

-- =============================================
-- VIEW: vw_bonificacoes_pendentes
-- =============================================
CREATE VIEW IF NOT EXISTS vw_bonificacoes_pendentes AS
SELECT 
    b.*,
    CAST(julianday('now') - julianday(b.created_at) AS INTEGER) as dias_pendente
FROM bonificacoes b
WHERE b.status = 'pendente'
ORDER BY b.created_at ASC;

-- =============================================
-- VIEW: vw_bonificacoes_por_vendedor_mes
-- =============================================
CREATE VIEW IF NOT EXISTS vw_bonificacoes_por_vendedor_mes AS
SELECT 
    empresa_id,
    vendedor_id,
    vendedor_nome,
    strftime('%Y', created_at) as ano,
    strftime('%m', created_at) as mes,
    COUNT(*) as total_bonificacoes,
    SUM(quantidade) as total_quantidade,
    SUM(valor_total) as total_valor,
    SUM(CASE WHEN status = 'aprovado' OR status = 'faturado' THEN 1 ELSE 0 END) as aprovadas,
    SUM(CASE WHEN status = 'reprovado' THEN 1 ELSE 0 END) as reprovadas
FROM bonificacoes
GROUP BY empresa_id, vendedor_id, vendedor_nome, strftime('%Y', created_at), strftime('%m', created_at);

-- =============================================
-- VIEW: vw_bonificacoes_por_motivo
-- =============================================
CREATE VIEW IF NOT EXISTS vw_bonificacoes_por_motivo AS
SELECT 
    empresa_id,
    motivo,
    strftime('%Y-%m', created_at) as periodo,
    COUNT(*) as total,
    SUM(quantidade) as quantidade_total,
    SUM(valor_total) as valor_total
FROM bonificacoes
WHERE status IN ('aprovado', 'faturado')
GROUP BY empresa_id, motivo, strftime('%Y-%m', created_at);
