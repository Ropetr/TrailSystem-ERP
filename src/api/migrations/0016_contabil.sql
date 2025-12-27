-- ============================================
-- PLANAC ERP - Migration 0016: Contabil
-- Tabelas do modulo Contabilidade
-- ============================================

-- Lancamentos Contabeis
CREATE TABLE IF NOT EXISTS lancamentos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  numero INTEGER,
  data TEXT NOT NULL,
  historico TEXT NOT NULL,
  documento TEXT,
  tipo TEXT DEFAULT 'MANUAL', -- MANUAL, AUTOMATICO, IMPORTADO
  origem TEXT, -- VENDA, COMPRA, PAGAMENTO, RECEBIMENTO, etc
  origem_id TEXT,
  status TEXT DEFAULT 'RASCUNHO', -- RASCUNHO, CONFIRMADO, ESTORNADO
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_lancamentos_empresa ON lancamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON lancamentos(data);
CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON lancamentos(status);

-- Itens do Lancamento (partidas)
CREATE TABLE IF NOT EXISTS lancamentos_itens (
  id TEXT PRIMARY KEY,
  lancamento_id TEXT NOT NULL,
  conta_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- DEBITO, CREDITO
  valor REAL NOT NULL,
  historico TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lancamento_id) REFERENCES lancamentos(id) ON DELETE CASCADE,
  FOREIGN KEY (conta_id) REFERENCES plano_contas(id)
);

CREATE INDEX IF NOT EXISTS idx_lancamentos_itens_lanc ON lancamentos_itens(lancamento_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_itens_conta ON lancamentos_itens(conta_id);

-- Fechamentos Contabeis
CREATE TABLE IF NOT EXISTS fechamentos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  competencia TEXT NOT NULL, -- YYYY-MM
  tipo TEXT DEFAULT 'MENSAL', -- MENSAL, TRIMESTRAL, ANUAL
  data_fechamento TEXT,
  status TEXT DEFAULT 'ABERTO', -- ABERTO, FECHADO, REABERTO
  saldo_anterior REAL DEFAULT 0,
  total_debitos REAL DEFAULT 0,
  total_creditos REAL DEFAULT 0,
  saldo_final REAL DEFAULT 0,
  observacao TEXT,
  fechado_por TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (fechado_por) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_fechamentos_empresa ON fechamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_fechamentos_competencia ON fechamentos(competencia);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fechamentos_empresa_comp ON fechamentos(empresa_id, competencia);
