-- ============================================
-- PLANAC ERP - Migration 0011: PDV
-- Tabelas do modulo PDV (Ponto de Venda)
-- ============================================

-- Terminais PDV
CREATE TABLE IF NOT EXISTS pdv_terminais (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  numero INTEGER NOT NULL,
  nome TEXT NOT NULL,
  serie_nfce TEXT,
  impressora TEXT,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id)
);

CREATE INDEX IF NOT EXISTS idx_pdv_terminais_empresa ON pdv_terminais(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pdv_terminais_numero ON pdv_terminais(empresa_id, filial_id, numero);

-- Sessoes PDV
CREATE TABLE IF NOT EXISTS pdv_sessoes (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  terminal_id TEXT NOT NULL,
  operador_id TEXT NOT NULL,
  data_abertura TEXT NOT NULL,
  data_fechamento TEXT,
  valor_abertura REAL DEFAULT 0,
  valor_fechamento REAL,
  saldo_atual REAL DEFAULT 0,
  status TEXT DEFAULT 'ABERTA', -- ABERTA, FECHADA
  observacao_abertura TEXT,
  observacao_fechamento TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (terminal_id) REFERENCES pdv_terminais(id),
  FOREIGN KEY (operador_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_pdv_sessoes_terminal ON pdv_sessoes(terminal_id);
CREATE INDEX IF NOT EXISTS idx_pdv_sessoes_status ON pdv_sessoes(status);
CREATE INDEX IF NOT EXISTS idx_pdv_sessoes_operador ON pdv_sessoes(operador_id);

-- Movimentacoes PDV
CREATE TABLE IF NOT EXISTS pdv_movimentacoes (
  id TEXT PRIMARY KEY,
  sessao_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- VENDA, SANGRIA, SUPRIMENTO, CANCELAMENTO
  valor REAL NOT NULL,
  forma_pagamento TEXT,
  descricao TEXT,
  pedido_id TEXT,
  usuario_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sessao_id) REFERENCES pdv_sessoes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_pdv_mov_sessao ON pdv_movimentacoes(sessao_id);
CREATE INDEX IF NOT EXISTS idx_pdv_mov_tipo ON pdv_movimentacoes(tipo);
