-- =============================================
-- TRAILSYSTEM ERP - Migration 0050: Fluxo de Venda Completa
-- Suporte a entregas fracionadas, créditos do cliente, reserva de estoque
-- =============================================

-- =============================================
-- ENTREGAS FRACIONADAS
-- Permite dividir um pedido em múltiplas entregas (.E1, .E2, etc)
-- =============================================

CREATE TABLE IF NOT EXISTS pedidos_venda_entregas (
    id TEXT PRIMARY KEY,
    pedido_venda_id TEXT NOT NULL REFERENCES pedidos_venda(id) ON DELETE CASCADE,
    numero TEXT NOT NULL, -- .E1, .E2, .E3
    
    -- Status da entrega
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'separando', 'separado', 'faturado', 'em_transito', 'entregue', 'cancelado')),
    
    -- Datas
    data_prevista TEXT,
    data_separacao TEXT,
    data_faturamento TEXT,
    data_expedicao TEXT,
    data_entrega TEXT,
    
    -- Valores
    valor_produtos REAL DEFAULT 0,
    valor_frete REAL DEFAULT 0,
    valor_desconto REAL DEFAULT 0,
    valor_credito_usado REAL DEFAULT 0,
    valor_total REAL DEFAULT 0,
    
    -- Financeiro
    forma_financeiro TEXT DEFAULT 'proporcional' CHECK (forma_financeiro IN ('integral', 'proporcional', 'definir_depois')),
    financeiro_gerado INTEGER DEFAULT 0,
    
    -- NF-e
    nfe_id TEXT,
    nfe_numero TEXT,
    nfe_serie TEXT,
    nfe_chave TEXT,
    nfe_protocolo TEXT,
    nfe_data TEXT,
    
    -- Transporte
    transportadora_id TEXT,
    volumes INTEGER DEFAULT 1,
    peso_bruto REAL,
    peso_liquido REAL,
    
    -- Observações
    observacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(pedido_venda_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_pv_entregas_pedido ON pedidos_venda_entregas(pedido_venda_id);
CREATE INDEX IF NOT EXISTS idx_pv_entregas_status ON pedidos_venda_entregas(status);
CREATE INDEX IF NOT EXISTS idx_pv_entregas_data_prevista ON pedidos_venda_entregas(data_prevista);

-- Itens por entrega (quais itens vão em cada entrega)
CREATE TABLE IF NOT EXISTS pedidos_venda_entregas_itens (
    id TEXT PRIMARY KEY,
    entrega_id TEXT NOT NULL REFERENCES pedidos_venda_entregas(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES pedidos_venda_itens(id) ON DELETE CASCADE,
    quantidade REAL NOT NULL,
    quantidade_separada REAL DEFAULT 0,
    quantidade_entregue REAL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(entrega_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_pv_entregas_itens_entrega ON pedidos_venda_entregas_itens(entrega_id);
CREATE INDEX IF NOT EXISTS idx_pv_entregas_itens_item ON pedidos_venda_entregas_itens(item_id);

-- =============================================
-- CRÉDITOS DO CLIENTE
-- Carteira de créditos (indicação, devolução, bonificação, etc)
-- =============================================

CREATE TABLE IF NOT EXISTS clientes_creditos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    cliente_id TEXT NOT NULL REFERENCES clientes(id),
    
    -- Origem do crédito
    origem TEXT NOT NULL CHECK (origem IN ('indicacao', 'devolucao', 'bonificacao', 'promocao', 'ajuste', 'outro')),
    origem_id TEXT, -- ID do documento de origem (devolução, etc)
    descricao TEXT,
    
    -- Valores
    valor_original REAL NOT NULL,
    valor_usado REAL DEFAULT 0,
    valor_saldo REAL NOT NULL,
    
    -- Validade
    data_emissao TEXT NOT NULL,
    data_validade TEXT,
    
    -- Status
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'usado', 'expirado', 'cancelado')),
    
    -- Uso
    pedido_venda_id TEXT, -- Pedido onde foi usado (se usar na venda pai)
    entrega_id TEXT, -- Entrega onde foi usado (se reservar para entregas)
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clientes_creditos_empresa ON clientes_creditos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_creditos_cliente ON clientes_creditos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_creditos_status ON clientes_creditos(status);
CREATE INDEX IF NOT EXISTS idx_clientes_creditos_validade ON clientes_creditos(data_validade);

-- Histórico de uso de créditos
CREATE TABLE IF NOT EXISTS clientes_creditos_uso (
    id TEXT PRIMARY KEY,
    credito_id TEXT NOT NULL REFERENCES clientes_creditos(id),
    pedido_venda_id TEXT REFERENCES pedidos_venda(id),
    entrega_id TEXT REFERENCES pedidos_venda_entregas(id),
    valor REAL NOT NULL,
    data_uso TEXT NOT NULL,
    usuario_id TEXT REFERENCES usuarios(id),
    observacao TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_creditos_uso_credito ON clientes_creditos_uso(credito_id);
CREATE INDEX IF NOT EXISTS idx_creditos_uso_pedido ON clientes_creditos_uso(pedido_venda_id);

-- =============================================
-- RESERVA DE ESTOQUE
-- Controle de reservas para pedidos de venda
-- =============================================

CREATE TABLE IF NOT EXISTS estoque_reservas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    filial_id TEXT NOT NULL REFERENCES filiais(id),
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    
    -- Origem da reserva
    pedido_venda_id TEXT REFERENCES pedidos_venda(id),
    entrega_id TEXT REFERENCES pedidos_venda_entregas(id),
    item_id TEXT REFERENCES pedidos_venda_itens(id),
    
    -- Quantidades
    quantidade_reservada REAL NOT NULL,
    quantidade_baixada REAL DEFAULT 0,
    quantidade_saldo REAL NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'baixado', 'cancelado')),
    
    -- Datas
    data_reserva TEXT NOT NULL,
    data_validade TEXT, -- Reserva expira se não faturar
    data_baixa TEXT,
    
    usuario_id TEXT REFERENCES usuarios(id),
    observacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_estoque_reservas_empresa ON estoque_reservas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_estoque_reservas_produto ON estoque_reservas(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_reservas_pedido ON estoque_reservas(pedido_venda_id);
CREATE INDEX IF NOT EXISTS idx_estoque_reservas_status ON estoque_reservas(status);

-- =============================================
-- ALTERAÇÕES EM TABELAS EXISTENTES
-- =============================================

-- Adicionar campos ao pedido de venda para suporte a entregas fracionadas
-- SQLite não suporta ADD COLUMN IF NOT EXISTS, então usamos uma abordagem segura

-- Verificar e adicionar colunas na tabela pedidos_venda
-- tipo_entrega: 'unica' ou 'fracionada'
-- tipo_financeiro: 'integral', 'por_entrega', 'definir_depois'
-- valor_credito_usado: total de crédito usado na venda
-- usar_credito: 'nao', 'na_venda', 'nas_entregas'

-- Criar tabela temporária para verificar se colunas existem
CREATE TABLE IF NOT EXISTS _migration_check (
    id INTEGER PRIMARY KEY,
    executed INTEGER DEFAULT 0
);

-- Adicionar colunas se não existirem (usando INSERT OR IGNORE para evitar erros)
-- Nota: Em produção, essas alterações devem ser feitas via Cloudflare D1 console ou wrangler

-- =============================================
-- VIEWS ÚTEIS
-- =============================================

-- View de saldo de crédito por cliente
CREATE VIEW IF NOT EXISTS vw_clientes_saldo_credito AS
SELECT 
    cliente_id,
    empresa_id,
    SUM(CASE WHEN status = 'ativo' THEN valor_saldo ELSE 0 END) as saldo_disponivel,
    COUNT(CASE WHEN status = 'ativo' THEN 1 END) as qtd_creditos_ativos
FROM clientes_creditos
GROUP BY cliente_id, empresa_id;

-- View de entregas pendentes
CREATE VIEW IF NOT EXISTS vw_entregas_pendentes AS
SELECT 
    e.*,
    pv.numero as pedido_numero,
    pv.cliente_nome,
    pv.cliente_id
FROM pedidos_venda_entregas e
JOIN pedidos_venda pv ON pv.id = e.pedido_venda_id
WHERE e.status IN ('pendente', 'separando', 'separado')
ORDER BY e.data_prevista;

-- View de reservas ativas por produto
CREATE VIEW IF NOT EXISTS vw_estoque_reservado AS
SELECT 
    produto_id,
    empresa_id,
    filial_id,
    SUM(quantidade_saldo) as total_reservado
FROM estoque_reservas
WHERE status = 'ativo'
GROUP BY produto_id, empresa_id, filial_id;
