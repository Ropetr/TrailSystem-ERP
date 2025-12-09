-- =============================================
-- 🏢 PLANAC ERP - Migration 003 - Estoque
-- Locais, Saldos, Movimentações, Reservas
-- =============================================

-- Locais de Estoque
CREATE TABLE IF NOT EXISTS locais_estoque (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    filial_id TEXT NOT NULL REFERENCES filiais(id),
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT DEFAULT 'almoxarifado' CHECK (tipo IN ('almoxarifado', 'deposito', 'loja', 'transito', 'terceiros')),
    local_pai_id TEXT REFERENCES locais_estoque(id),
    rua TEXT,
    predio TEXT,
    nivel TEXT,
    posicao TEXT,
    capacidade_m3 REAL,
    capacidade_kg REAL,
    permite_venda INTEGER DEFAULT 1,
    permite_compra INTEGER DEFAULT 1,
    bloqueado INTEGER DEFAULT 0,
    motivo_bloqueio TEXT,
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(empresa_id, filial_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_locais_estoque_empresa ON locais_estoque(empresa_id);
CREATE INDEX IF NOT EXISTS idx_locais_estoque_filial ON locais_estoque(filial_id);

-- Saldos de Estoque
CREATE TABLE IF NOT EXISTS estoque (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    filial_id TEXT NOT NULL REFERENCES filiais(id),
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    local_id TEXT REFERENCES locais_estoque(id),
    quantidade REAL DEFAULT 0,
    quantidade_reservada REAL DEFAULT 0,
    custo_medio REAL DEFAULT 0,
    custo_ultima_compra REAL DEFAULT 0,
    ultima_entrada TEXT,
    ultima_saida TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(empresa_id, filial_id, produto_id, local_id)
);

CREATE INDEX IF NOT EXISTS idx_estoque_empresa ON estoque(empresa_id);
CREATE INDEX IF NOT EXISTS idx_estoque_filial ON estoque(filial_id);
CREATE INDEX IF NOT EXISTS idx_estoque_produto ON estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_local ON estoque(local_id);

-- Movimentações de Estoque
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    filial_id TEXT NOT NULL REFERENCES filiais(id),
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    local_id TEXT REFERENCES locais_estoque(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'transferencia', 'reserva', 'liberacao')),
    subtipo TEXT,
    quantidade REAL NOT NULL,
    quantidade_anterior REAL NOT NULL,
    quantidade_posterior REAL NOT NULL,
    custo_unitario REAL,
    custo_total REAL,
    documento_tipo TEXT,
    documento_id TEXT,
    documento_numero TEXT,
    observacao TEXT,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa ON estoque_movimentacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_filial ON estoque_movimentacoes(filial_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto ON estoque_movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON estoque_movimentacoes(created_at);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_documento ON estoque_movimentacoes(documento_tipo, documento_id);

-- Reservas de Estoque
CREATE TABLE IF NOT EXISTS estoque_reservas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    filial_id TEXT NOT NULL REFERENCES filiais(id),
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    local_id TEXT REFERENCES locais_estoque(id),
    quantidade REAL NOT NULL,
    documento_tipo TEXT NOT NULL,
    documento_id TEXT NOT NULL,
    status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'consumida', 'cancelada', 'expirada')),
    data_expiracao TEXT,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reservas_empresa ON estoque_reservas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_reservas_produto ON estoque_reservas(produto_id);
CREATE INDEX IF NOT EXISTS idx_reservas_documento ON estoque_reservas(documento_tipo, documento_id);
CREATE INDEX IF NOT EXISTS idx_reservas_status ON estoque_reservas(status);

-- Inventários
CREATE TABLE IF NOT EXISTS inventarios (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    filial_id TEXT NOT NULL REFERENCES filiais(id),
    codigo TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT DEFAULT 'total' CHECK (tipo IN ('total', 'parcial', 'rotativo')),
    local_id TEXT REFERENCES locais_estoque(id),
    categoria_id TEXT REFERENCES categorias_produtos(id),
    status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'em_contagem', 'finalizado', 'cancelado')),
    data_inicio TEXT,
    data_fim TEXT,
    responsavel_id TEXT REFERENCES usuarios(id),
    observacao TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventarios_empresa ON inventarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_inventarios_filial ON inventarios(filial_id);

-- Itens do Inventário
CREATE TABLE IF NOT EXISTS inventarios_itens (
    id TEXT PRIMARY KEY,
    inventario_id TEXT NOT NULL REFERENCES inventarios(id) ON DELETE CASCADE,
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    local_id TEXT REFERENCES locais_estoque(id),
    quantidade_sistema REAL NOT NULL,
    quantidade_contada REAL,
    custo_unitario REAL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'contado', 'conferido')),
    usuario_contagem_id TEXT REFERENCES usuarios(id),
    data_contagem TEXT,
    observacao TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventarios_itens_inventario ON inventarios_itens(inventario_id);
CREATE INDEX IF NOT EXISTS idx_inventarios_itens_produto ON inventarios_itens(produto_id);

-- Transferências entre Filiais/Locais
CREATE TABLE IF NOT EXISTS transferencias (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    numero TEXT NOT NULL,
    filial_origem_id TEXT NOT NULL REFERENCES filiais(id),
    filial_destino_id TEXT NOT NULL REFERENCES filiais(id),
    local_origem_id TEXT REFERENCES locais_estoque(id),
    local_destino_id TEXT REFERENCES locais_estoque(id),
    status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'em_transito', 'recebida', 'cancelada')),
    data_envio TEXT,
    data_recebimento TEXT,
    responsavel_envio_id TEXT REFERENCES usuarios(id),
    responsavel_recebimento_id TEXT REFERENCES usuarios(id),
    observacao TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transferencias_empresa ON transferencias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_origem ON transferencias(filial_origem_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_destino ON transferencias(filial_destino_id);

-- Itens da Transferência
CREATE TABLE IF NOT EXISTS transferencias_itens (
    id TEXT PRIMARY KEY,
    transferencia_id TEXT NOT NULL REFERENCES transferencias(id) ON DELETE CASCADE,
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    quantidade_enviada REAL NOT NULL,
    quantidade_recebida REAL,
    custo_unitario REAL,
    observacao TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transferencias_itens_transferencia ON transferencias_itens(transferencia_id);
