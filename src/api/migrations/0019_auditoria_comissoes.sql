-- ============================================
-- PLANAC ERP - Migration 0019: Auditoria e Comissoes
-- Tabelas de Auditoria e Comissoes de Vendas
-- ============================================

-- ============================================
-- AUDITORIA / LOGS
-- ============================================

-- Logs de Auditoria
CREATE TABLE IF NOT EXISTS auditoria_logs (
  id TEXT PRIMARY KEY,
  empresa_id TEXT,
  usuario_id TEXT,
  usuario_nome TEXT,
  acao TEXT NOT NULL, -- CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, etc
  entidade_tipo TEXT,
  entidade_id TEXT,
  dados_anteriores TEXT, -- JSON
  dados_novos TEXT, -- JSON
  ip TEXT,
  user_agent TEXT,
  modulo TEXT,
  descricao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_empresa ON auditoria_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidade ON auditoria_logs(entidade_tipo, entidade_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_data ON auditoria_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auditoria_acao ON auditoria_logs(acao);

-- Logs de Acesso
CREATE TABLE IF NOT EXISTS logs_acesso (
  id TEXT PRIMARY KEY,
  empresa_id TEXT,
  usuario_id TEXT,
  tipo TEXT NOT NULL, -- LOGIN, LOGOUT, FALHA_LOGIN, SESSAO_EXPIRADA
  ip TEXT,
  user_agent TEXT,
  dispositivo TEXT,
  localizacao TEXT,
  sucesso INTEGER DEFAULT 1,
  motivo_falha TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_acesso_usuario ON logs_acesso(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_acesso_data ON logs_acesso(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_acesso_tipo ON logs_acesso(tipo);

-- ============================================
-- COMISSOES
-- ============================================

-- Regras de Comissao
CREATE TABLE IF NOT EXISTS comissoes_regras (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL, -- PERCENTUAL, VALOR_FIXO, ESCALONADA
  base_calculo TEXT DEFAULT 'VALOR_VENDA', -- VALOR_VENDA, LUCRO, MARGEM
  percentual REAL,
  valor_fixo REAL,
  categoria_id TEXT,
  produto_id TEXT,
  vendedor_id TEXT,
  cliente_id TEXT,
  prioridade INTEGER DEFAULT 0,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_comissoes_regras_empresa ON comissoes_regras(empresa_id);

-- Faixas de Comissao (para comissao escalonada)
CREATE TABLE IF NOT EXISTS comissoes_faixas (
  id TEXT PRIMARY KEY,
  regra_id TEXT NOT NULL,
  valor_minimo REAL NOT NULL,
  valor_maximo REAL,
  percentual REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (regra_id) REFERENCES comissoes_regras(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comissoes_faixas_regra ON comissoes_faixas(regra_id);

-- Comissoes Calculadas
CREATE TABLE IF NOT EXISTS comissoes_calculadas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  vendedor_id TEXT NOT NULL,
  pedido_id TEXT,
  pedido_item_id TEXT,
  regra_id TEXT,
  base_calculo REAL NOT NULL,
  percentual REAL,
  valor REAL NOT NULL,
  data_venda TEXT NOT NULL,
  data_pagamento TEXT,
  status TEXT DEFAULT 'PENDENTE', -- PENDENTE, APROVADA, PAGA, CANCELADA
  competencia TEXT, -- YYYY-MM
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (vendedor_id) REFERENCES usuarios(id),
  FOREIGN KEY (regra_id) REFERENCES comissoes_regras(id)
);

CREATE INDEX IF NOT EXISTS idx_comissoes_calc_empresa ON comissoes_calculadas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_calc_vendedor ON comissoes_calculadas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_calc_status ON comissoes_calculadas(status);
CREATE INDEX IF NOT EXISTS idx_comissoes_calc_competencia ON comissoes_calculadas(competencia);

-- Bonificacoes
CREATE TABLE IF NOT EXISTS bonificacoes (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL, -- META, CAMPANHA, PREMIO
  meta_tipo TEXT, -- VALOR, QUANTIDADE, MARGEM
  meta_valor REAL,
  premio_tipo TEXT, -- PERCENTUAL, VALOR_FIXO, PRODUTO
  premio_valor REAL,
  premio_produto_id TEXT,
  data_inicio TEXT,
  data_fim TEXT,
  ativo INTEGER DEFAULT 1,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_bonificacoes_empresa ON bonificacoes(empresa_id);

-- Participantes da Bonificacao
CREATE TABLE IF NOT EXISTS bonificacoes_participantes (
  id TEXT PRIMARY KEY,
  bonificacao_id TEXT NOT NULL,
  vendedor_id TEXT NOT NULL,
  meta_atingida REAL DEFAULT 0,
  meta_percentual REAL DEFAULT 0,
  premio_calculado REAL DEFAULT 0,
  status TEXT DEFAULT 'EM_ANDAMENTO', -- EM_ANDAMENTO, ATINGIDA, NAO_ATINGIDA, PAGA
  data_pagamento TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bonificacao_id) REFERENCES bonificacoes(id) ON DELETE CASCADE,
  FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_bonif_part_bonificacao ON bonificacoes_participantes(bonificacao_id);
CREATE INDEX IF NOT EXISTS idx_bonif_part_vendedor ON bonificacoes_participantes(vendedor_id);
