-- ============================================
-- PLANAC ERP - Migration 0020: Consignacoes e Devolucoes
-- Tabelas de Consignacoes e Devolucoes
-- ============================================

-- ============================================
-- CONSIGNACOES
-- ============================================

-- Consignacoes
CREATE TABLE IF NOT EXISTS consignacoes (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  numero TEXT,
  cliente_id TEXT NOT NULL,
  vendedor_id TEXT,
  data_saida TEXT NOT NULL,
  data_previsao_retorno TEXT,
  data_retorno TEXT,
  status TEXT DEFAULT 'ABERTA', -- ABERTA, PARCIAL, FECHADA, CANCELADA
  valor_total REAL DEFAULT 0,
  valor_vendido REAL DEFAULT 0,
  valor_devolvido REAL DEFAULT 0,
  observacao TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_consignacoes_empresa ON consignacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_consignacoes_cliente ON consignacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_consignacoes_status ON consignacoes(status);

-- Itens da Consignacao
CREATE TABLE IF NOT EXISTS consignacoes_itens (
  id TEXT PRIMARY KEY,
  consignacao_id TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  quantidade REAL NOT NULL,
  quantidade_vendida REAL DEFAULT 0,
  quantidade_devolvida REAL DEFAULT 0,
  valor_unitario REAL NOT NULL,
  valor_total REAL NOT NULL,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consignacao_id) REFERENCES consignacoes(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE INDEX IF NOT EXISTS idx_consignacoes_itens_consig ON consignacoes_itens(consignacao_id);

-- Movimentacoes de Consignacao
CREATE TABLE IF NOT EXISTS consignacoes_movimentacoes (
  id TEXT PRIMARY KEY,
  consignacao_id TEXT NOT NULL,
  consignacao_item_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- VENDA, DEVOLUCAO
  quantidade REAL NOT NULL,
  valor_unitario REAL,
  valor_total REAL,
  data TEXT NOT NULL,
  pedido_id TEXT,
  observacao TEXT,
  usuario_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consignacao_id) REFERENCES consignacoes(id),
  FOREIGN KEY (consignacao_item_id) REFERENCES consignacoes_itens(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_consig_mov_consig ON consignacoes_movimentacoes(consignacao_id);

-- ============================================
-- DEVOLUCOES
-- ============================================

-- Devolucoes
CREATE TABLE IF NOT EXISTS devolucoes (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  numero TEXT,
  tipo TEXT NOT NULL, -- VENDA, COMPRA
  pedido_id TEXT,
  nota_fiscal_id TEXT,
  cliente_id TEXT,
  fornecedor_id TEXT,
  data TEXT NOT NULL,
  motivo TEXT NOT NULL,
  status TEXT DEFAULT 'PENDENTE', -- PENDENTE, APROVADA, PROCESSADA, CANCELADA
  valor_total REAL DEFAULT 0,
  gerar_credito INTEGER DEFAULT 0,
  credito_gerado REAL DEFAULT 0,
  observacao TEXT,
  aprovador_id TEXT,
  data_aprovacao TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
);

CREATE INDEX IF NOT EXISTS idx_devolucoes_empresa ON devolucoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_devolucoes_tipo ON devolucoes(tipo);
CREATE INDEX IF NOT EXISTS idx_devolucoes_status ON devolucoes(status);

-- Itens da Devolucao
CREATE TABLE IF NOT EXISTS devolucoes_itens (
  id TEXT PRIMARY KEY,
  devolucao_id TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  pedido_item_id TEXT,
  quantidade REAL NOT NULL,
  valor_unitario REAL NOT NULL,
  valor_total REAL NOT NULL,
  motivo TEXT,
  estado_produto TEXT, -- BOM, AVARIADO, DEFEITO
  destino TEXT, -- ESTOQUE, DESCARTE, FORNECEDOR
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (devolucao_id) REFERENCES devolucoes(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE INDEX IF NOT EXISTS idx_devolucoes_itens_dev ON devolucoes_itens(devolucao_id);

-- Historico da Devolucao
CREATE TABLE IF NOT EXISTS devolucoes_historico (
  id TEXT PRIMARY KEY,
  devolucao_id TEXT NOT NULL,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  observacao TEXT,
  usuario_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (devolucao_id) REFERENCES devolucoes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_devolucoes_hist_dev ON devolucoes_historico(devolucao_id);

-- ============================================
-- TROCAS
-- ============================================

-- Trocas
CREATE TABLE IF NOT EXISTS trocas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  numero TEXT,
  pedido_original_id TEXT,
  cliente_id TEXT NOT NULL,
  data TEXT NOT NULL,
  motivo TEXT NOT NULL,
  status TEXT DEFAULT 'PENDENTE', -- PENDENTE, APROVADA, PROCESSADA, CANCELADA
  valor_devolucao REAL DEFAULT 0,
  valor_novo_pedido REAL DEFAULT 0,
  diferenca REAL DEFAULT 0,
  observacao TEXT,
  pedido_novo_id TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE INDEX IF NOT EXISTS idx_trocas_empresa ON trocas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_trocas_cliente ON trocas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_trocas_status ON trocas(status);

-- Itens Devolvidos na Troca
CREATE TABLE IF NOT EXISTS trocas_itens_devolvidos (
  id TEXT PRIMARY KEY,
  troca_id TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  quantidade REAL NOT NULL,
  valor_unitario REAL NOT NULL,
  valor_total REAL NOT NULL,
  motivo TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (troca_id) REFERENCES trocas(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- Itens Novos na Troca
CREATE TABLE IF NOT EXISTS trocas_itens_novos (
  id TEXT PRIMARY KEY,
  troca_id TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  quantidade REAL NOT NULL,
  valor_unitario REAL NOT NULL,
  valor_total REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (troca_id) REFERENCES trocas(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);
