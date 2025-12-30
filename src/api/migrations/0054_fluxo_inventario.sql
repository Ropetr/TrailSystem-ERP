-- =============================================
-- TRAILSYSTEM ERP - Migration 0054: Fluxo de Inventário
-- Suporte completo ao fluxo de inventário: contagens, divergências, ajustes
-- =============================================

-- =============================================
-- INVENTÁRIOS
-- Tipos: geral, rotativo, por_categoria
-- =============================================

CREATE TABLE IF NOT EXISTS inventarios (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    filial_id TEXT REFERENCES filiais(id),
    
    -- Identificação
    numero INTEGER NOT NULL,
    descricao TEXT,
    
    -- Tipo de inventário
    tipo TEXT NOT NULL DEFAULT 'geral' CHECK (tipo IN ('geral', 'rotativo', 'por_categoria')),
    
    -- Datas
    data_abertura TEXT NOT NULL,
    data_fechamento TEXT,
    
    -- Responsável
    responsavel_id TEXT REFERENCES usuarios(id),
    responsavel_nome TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN (
        'aberto', 'em_contagem', 'aguardando_recontagem', 'em_ajuste', 'finalizado', 'cancelado'
    )),
    
    -- Bloqueio de movimentação
    bloquear_movimentacao INTEGER DEFAULT 0,
    
    -- Filtros (para inventário rotativo ou por categoria)
    categorias_ids TEXT, -- JSON array de IDs de categorias
    produtos_ids TEXT, -- JSON array de IDs de produtos (para rotativo)
    local_id TEXT REFERENCES locais_estoque(id),
    
    -- Totais
    total_produtos INTEGER DEFAULT 0,
    total_itens_contados INTEGER DEFAULT 0,
    total_divergencias INTEGER DEFAULT 0,
    valor_divergencia REAL DEFAULT 0,
    
    -- Observações
    observacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventarios_empresa ON inventarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_inventarios_status ON inventarios(status);
CREATE INDEX IF NOT EXISTS idx_inventarios_data ON inventarios(data_abertura);

-- =============================================
-- ITENS DO INVENTÁRIO
-- Lista de produtos a serem contados
-- =============================================

CREATE TABLE IF NOT EXISTS inventarios_itens (
    id TEXT PRIMARY KEY,
    inventario_id TEXT NOT NULL REFERENCES inventarios(id) ON DELETE CASCADE,
    
    -- Produto
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_descricao TEXT,
    unidade TEXT,
    
    -- Local
    local_id TEXT REFERENCES locais_estoque(id),
    local_nome TEXT,
    
    -- Quantidade no sistema
    quantidade_sistema REAL NOT NULL DEFAULT 0,
    custo_unitario REAL DEFAULT 0,
    
    -- Status da contagem
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
        'pendente', 'contagem_1', 'contagem_2', 'contagem_3', 'validado', 'ajustado'
    )),
    
    -- Contagens
    contagem_1 REAL,
    contagem_1_usuario_id TEXT REFERENCES usuarios(id),
    contagem_1_usuario_nome TEXT,
    contagem_1_data TEXT,
    
    contagem_2 REAL,
    contagem_2_usuario_id TEXT REFERENCES usuarios(id),
    contagem_2_usuario_nome TEXT,
    contagem_2_data TEXT,
    
    contagem_3 REAL,
    contagem_3_usuario_id TEXT REFERENCES usuarios(id),
    contagem_3_usuario_nome TEXT,
    contagem_3_data TEXT,
    
    -- Quantidade final (após contagens)
    quantidade_final REAL,
    
    -- Divergência
    tem_divergencia INTEGER DEFAULT 0,
    quantidade_divergencia REAL DEFAULT 0,
    tipo_divergencia TEXT CHECK (tipo_divergencia IN ('sobra', 'falta')),
    valor_divergencia REAL DEFAULT 0,
    
    -- Observação
    observacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventarios_itens_inventario ON inventarios_itens(inventario_id);
CREATE INDEX IF NOT EXISTS idx_inventarios_itens_produto ON inventarios_itens(produto_id);
CREATE INDEX IF NOT EXISTS idx_inventarios_itens_status ON inventarios_itens(status);

-- =============================================
-- DIVERGÊNCIAS DO INVENTÁRIO
-- Registro detalhado de cada divergência
-- =============================================

CREATE TABLE IF NOT EXISTS inventarios_divergencias (
    id TEXT PRIMARY KEY,
    inventario_id TEXT NOT NULL REFERENCES inventarios(id) ON DELETE CASCADE,
    inventario_item_id TEXT NOT NULL REFERENCES inventarios_itens(id) ON DELETE CASCADE,
    
    -- Produto
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_descricao TEXT,
    
    -- Quantidades
    quantidade_sistema REAL NOT NULL,
    quantidade_contada REAL NOT NULL,
    quantidade_divergencia REAL NOT NULL,
    
    -- Tipo
    tipo TEXT NOT NULL CHECK (tipo IN ('sobra', 'falta')),
    
    -- Valores
    custo_unitario REAL DEFAULT 0,
    valor_divergencia REAL DEFAULT 0,
    
    -- Causa identificada
    causa TEXT CHECK (causa IN ('furto', 'erro_lancamento', 'quebra', 'vencimento', 'nao_identificada')),
    causa_descricao TEXT,
    
    -- Ação tomada
    acao TEXT CHECK (acao IN ('ajuste_entrada', 'ajuste_saida', 'ocorrencia', 'correcao_historico')),
    acao_descricao TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'investigando', 'resolvida')),
    
    -- Resolução
    resolvido_por_id TEXT REFERENCES usuarios(id),
    resolvido_por_nome TEXT,
    data_resolucao TEXT,
    
    -- Movimentação de ajuste gerada
    movimentacao_ajuste_id TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_divergencias_inventario ON inventarios_divergencias(inventario_id);
CREATE INDEX IF NOT EXISTS idx_divergencias_status ON inventarios_divergencias(status);
CREATE INDEX IF NOT EXISTS idx_divergencias_causa ON inventarios_divergencias(causa);

-- =============================================
-- FICHAS DE CONTAGEM
-- Para impressão e distribuição
-- =============================================

CREATE TABLE IF NOT EXISTS inventarios_fichas (
    id TEXT PRIMARY KEY,
    inventario_id TEXT NOT NULL REFERENCES inventarios(id) ON DELETE CASCADE,
    
    -- Identificação
    numero INTEGER NOT NULL,
    
    -- Responsável pela contagem
    contador_id TEXT REFERENCES usuarios(id),
    contador_nome TEXT,
    
    -- Área/setor
    area TEXT,
    local_id TEXT REFERENCES locais_estoque(id),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'gerada' CHECK (status IN ('gerada', 'impressa', 'em_contagem', 'finalizada')),
    
    -- Datas
    data_impressao TEXT,
    data_inicio_contagem TEXT,
    data_fim_contagem TEXT,
    
    -- Itens da ficha (JSON array de inventario_item_id)
    itens_ids TEXT,
    total_itens INTEGER DEFAULT 0,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fichas_inventario ON inventarios_fichas(inventario_id);

-- =============================================
-- HISTÓRICO DE AJUSTES DE INVENTÁRIO
-- =============================================

CREATE TABLE IF NOT EXISTS inventarios_ajustes (
    id TEXT PRIMARY KEY,
    inventario_id TEXT NOT NULL REFERENCES inventarios(id),
    divergencia_id TEXT REFERENCES inventarios_divergencias(id),
    
    -- Produto
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    local_id TEXT REFERENCES locais_estoque(id),
    
    -- Tipo de ajuste
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    
    -- Quantidades
    quantidade REAL NOT NULL,
    quantidade_anterior REAL NOT NULL,
    quantidade_posterior REAL NOT NULL,
    
    -- Valores
    custo_unitario REAL DEFAULT 0,
    valor_ajuste REAL DEFAULT 0,
    
    -- Motivo
    motivo TEXT,
    
    -- Usuário
    usuario_id TEXT REFERENCES usuarios(id),
    usuario_nome TEXT,
    
    -- Movimentação gerada
    movimentacao_id TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ajustes_inventario ON inventarios_ajustes(inventario_id);

-- =============================================
-- CONFIGURAÇÃO DE INVENTÁRIO
-- =============================================

CREATE TABLE IF NOT EXISTS inventarios_config (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Regras de contagem
    exigir_segunda_contagem INTEGER DEFAULT 1,
    exigir_terceira_contagem INTEGER DEFAULT 1,
    tolerancia_divergencia_percentual REAL DEFAULT 0, -- 0 = qualquer divergência exige recontagem
    
    -- Bloqueio
    bloquear_movimentacao_automatico INTEGER DEFAULT 1,
    
    -- Notificações
    notificar_divergencias INTEGER DEFAULT 1,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- VIEW DE INVENTÁRIOS COM PROGRESSO
-- =============================================

CREATE VIEW IF NOT EXISTS vw_inventarios_progresso AS
SELECT 
    i.*,
    (SELECT COUNT(*) FROM inventarios_itens ii WHERE ii.inventario_id = i.id) as total_itens,
    (SELECT COUNT(*) FROM inventarios_itens ii WHERE ii.inventario_id = i.id AND ii.status = 'validado') as itens_validados,
    (SELECT COUNT(*) FROM inventarios_itens ii WHERE ii.inventario_id = i.id AND ii.status = 'ajustado') as itens_ajustados,
    (SELECT COUNT(*) FROM inventarios_itens ii WHERE ii.inventario_id = i.id AND ii.tem_divergencia = 1) as itens_com_divergencia,
    CASE 
        WHEN (SELECT COUNT(*) FROM inventarios_itens ii WHERE ii.inventario_id = i.id) = 0 THEN 0
        ELSE ROUND(
            (SELECT COUNT(*) FROM inventarios_itens ii WHERE ii.inventario_id = i.id AND ii.status IN ('validado', 'ajustado')) * 100.0 /
            (SELECT COUNT(*) FROM inventarios_itens ii WHERE ii.inventario_id = i.id), 2
        )
    END as percentual_concluido
FROM inventarios i;

-- =============================================
-- VIEW DE DIVERGÊNCIAS PENDENTES
-- =============================================

CREATE VIEW IF NOT EXISTS vw_divergencias_pendentes AS
SELECT 
    d.*,
    i.numero as inventario_numero,
    i.descricao as inventario_descricao,
    p.codigo as produto_codigo_atual,
    p.nome as produto_nome_atual
FROM inventarios_divergencias d
JOIN inventarios i ON i.id = d.inventario_id
JOIN produtos p ON p.id = d.produto_id
WHERE d.status = 'pendente'
ORDER BY d.created_at DESC;
