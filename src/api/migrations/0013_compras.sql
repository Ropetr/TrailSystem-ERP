-- ============================================
-- PLANAC ERP - Migration 0013: Compras
-- Tabelas do modulo Compras
-- ============================================

-- Requisicoes de Compra
CREATE TABLE IF NOT EXISTS requisicoes_compra (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  numero TEXT,
  solicitante_id TEXT,
  departamento TEXT,
  data_solicitacao TEXT NOT NULL,
  data_necessidade TEXT,
  prioridade TEXT DEFAULT 'NORMAL', -- BAIXA, NORMAL, ALTA, URGENTE
  status TEXT DEFAULT 'PENDENTE', -- PENDENTE, APROVADA, REJEITADA, COTACAO, COMPRADA, CANCELADA
  justificativa TEXT,
  observacao TEXT,
  aprovador_id TEXT,
  data_aprovacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id),
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (aprovador_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_requisicoes_empresa ON requisicoes_compra(empresa_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_status ON requisicoes_compra(status);

-- Itens da Requisicao
CREATE TABLE IF NOT EXISTS requisicoes_itens (
  id TEXT PRIMARY KEY,
  requisicao_id TEXT NOT NULL,
  produto_id TEXT,
  descricao TEXT NOT NULL,
  quantidade REAL NOT NULL,
  unidade TEXT,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requisicao_id) REFERENCES requisicoes_compra(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE INDEX IF NOT EXISTS idx_requisicoes_itens_req ON requisicoes_itens(requisicao_id);

-- Cotacoes de Compra
CREATE TABLE IF NOT EXISTS cotacoes (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  numero TEXT,
  titulo TEXT,
  descricao TEXT,
  data_abertura TEXT NOT NULL,
  data_encerramento TEXT,
  status TEXT DEFAULT 'ABERTA', -- ABERTA, EM_ANALISE, FINALIZADA, CANCELADA
  requisicao_id TEXT,
  comprador_id TEXT,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id),
  FOREIGN KEY (requisicao_id) REFERENCES requisicoes_compra(id),
  FOREIGN KEY (comprador_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_cotacoes_empresa ON cotacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cotacoes_status ON cotacoes(status);

-- Itens da Cotacao
CREATE TABLE IF NOT EXISTS cotacoes_itens (
  id TEXT PRIMARY KEY,
  cotacao_id TEXT NOT NULL,
  produto_id TEXT,
  descricao TEXT NOT NULL,
  quantidade REAL NOT NULL,
  unidade TEXT,
  especificacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cotacao_id) REFERENCES cotacoes(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE INDEX IF NOT EXISTS idx_cotacoes_itens_cotacao ON cotacoes_itens(cotacao_id);

-- Fornecedores da Cotacao (respostas)
CREATE TABLE IF NOT EXISTS cotacoes_fornecedores (
  id TEXT PRIMARY KEY,
  cotacao_id TEXT NOT NULL,
  fornecedor_id TEXT NOT NULL,
  data_envio TEXT,
  data_resposta TEXT,
  respondido INTEGER DEFAULT 0,
  selecionado INTEGER DEFAULT 0,
  valor_total REAL,
  prazo_entrega INTEGER,
  condicao_pagamento TEXT,
  validade_proposta TEXT,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cotacao_id) REFERENCES cotacoes(id) ON DELETE CASCADE,
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
);

CREATE INDEX IF NOT EXISTS idx_cotacoes_forn_cotacao ON cotacoes_fornecedores(cotacao_id);
CREATE INDEX IF NOT EXISTS idx_cotacoes_forn_fornecedor ON cotacoes_fornecedores(fornecedor_id);

-- Pedidos de Compra
CREATE TABLE IF NOT EXISTS pedidos_compra (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  numero TEXT,
  fornecedor_id TEXT NOT NULL,
  data_pedido TEXT NOT NULL,
  data_previsao_entrega TEXT,
  data_entrega TEXT,
  status TEXT DEFAULT 'RASCUNHO', -- RASCUNHO, ENVIADO, CONFIRMADO, PARCIAL, ENTREGUE, CANCELADO
  
  -- Valores
  valor_produtos REAL DEFAULT 0,
  valor_frete REAL DEFAULT 0,
  valor_desconto REAL DEFAULT 0,
  valor_outras REAL DEFAULT 0,
  valor_total REAL DEFAULT 0,
  
  -- Pagamento
  condicao_pagamento_id TEXT,
  forma_pagamento TEXT,
  
  -- Relacionamentos
  cotacao_id TEXT,
  requisicao_id TEXT,
  
  -- Informacoes
  observacao TEXT,
  observacao_interna TEXT,
  
  comprador_id TEXT,
  aprovador_id TEXT,
  data_aprovacao TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id),
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id),
  FOREIGN KEY (cotacao_id) REFERENCES cotacoes(id),
  FOREIGN KEY (comprador_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_pedidos_compra_empresa ON pedidos_compra(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_compra_fornecedor ON pedidos_compra(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_compra_status ON pedidos_compra(status);

-- Itens do Pedido de Compra
CREATE TABLE IF NOT EXISTS pedidos_compra_itens (
  id TEXT PRIMARY KEY,
  pedido_compra_id TEXT NOT NULL,
  produto_id TEXT,
  sequencia INTEGER,
  codigo TEXT,
  descricao TEXT NOT NULL,
  unidade TEXT,
  quantidade REAL NOT NULL,
  quantidade_recebida REAL DEFAULT 0,
  valor_unitario REAL NOT NULL,
  valor_desconto REAL DEFAULT 0,
  valor_total REAL NOT NULL,
  data_previsao TEXT,
  observacao TEXT,
  cotacao_item_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_compra_id) REFERENCES pedidos_compra(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE INDEX IF NOT EXISTS idx_pedidos_compra_itens_pedido ON pedidos_compra_itens(pedido_compra_id);
