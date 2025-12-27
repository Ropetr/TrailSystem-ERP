-- ============================================
-- PLANAC ERP - Migration 0009: Financeiro
-- Tabelas do modulo Financeiro
-- ============================================

-- Contas Bancarias
CREATE TABLE IF NOT EXISTS contas_bancarias (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  tipo TEXT DEFAULT 'CORRENTE', -- CORRENTE, POUPANCA, INVESTIMENTO
  saldo_inicial REAL DEFAULT 0,
  saldo_atual REAL DEFAULT 0,
  data_saldo_inicial TEXT,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_contas_bancarias_empresa ON contas_bancarias(empresa_id);

-- Movimentacoes Bancarias
CREATE TABLE IF NOT EXISTS movimentacoes_bancarias (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  conta_bancaria_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- CREDITO, DEBITO
  valor REAL NOT NULL,
  data TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  documento TEXT,
  conciliado INTEGER DEFAULT 0,
  data_conciliacao TEXT,
  origem_tipo TEXT, -- PAGAMENTO, RECEBIMENTO, TRANSFERENCIA, MANUAL
  origem_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id)
);

CREATE INDEX IF NOT EXISTS idx_mov_bancarias_empresa ON movimentacoes_bancarias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mov_bancarias_conta ON movimentacoes_bancarias(conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_mov_bancarias_data ON movimentacoes_bancarias(data);

-- Contas a Pagar
CREATE TABLE IF NOT EXISTS contas_pagar (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  numero TEXT,
  fornecedor_id TEXT,
  descricao TEXT NOT NULL,
  categoria TEXT,
  valor_original REAL NOT NULL,
  valor_juros REAL DEFAULT 0,
  valor_multa REAL DEFAULT 0,
  valor_desconto REAL DEFAULT 0,
  valor_pago REAL DEFAULT 0,
  valor_saldo REAL NOT NULL,
  data_emissao TEXT NOT NULL,
  data_vencimento TEXT NOT NULL,
  data_pagamento TEXT,
  status TEXT DEFAULT 'ABERTO', -- ABERTO, PAGO, PARCIAL, CANCELADO, VENCIDO
  forma_pagamento TEXT,
  conta_bancaria_id TEXT,
  documento TEXT,
  observacao TEXT,
  pedido_compra_id TEXT,
  nota_fiscal_id TEXT,
  centro_custo_id TEXT,
  plano_conta_id TEXT,
  recorrente INTEGER DEFAULT 0,
  parcela_atual INTEGER,
  total_parcelas INTEGER,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id),
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id),
  FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id)
);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_empresa ON contas_pagar(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor ON contas_pagar(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON contas_pagar(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON contas_pagar(status);

-- Contas a Receber
CREATE TABLE IF NOT EXISTS contas_receber (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  numero TEXT,
  cliente_id TEXT,
  descricao TEXT NOT NULL,
  categoria TEXT,
  valor_original REAL NOT NULL,
  valor_juros REAL DEFAULT 0,
  valor_multa REAL DEFAULT 0,
  valor_desconto REAL DEFAULT 0,
  valor_recebido REAL DEFAULT 0,
  valor_saldo REAL NOT NULL,
  data_emissao TEXT NOT NULL,
  data_vencimento TEXT NOT NULL,
  data_recebimento TEXT,
  status TEXT DEFAULT 'ABERTO', -- ABERTO, RECEBIDO, PARCIAL, CANCELADO, VENCIDO
  forma_pagamento TEXT,
  conta_bancaria_id TEXT,
  documento TEXT,
  observacao TEXT,
  pedido_venda_id TEXT,
  nota_fiscal_id TEXT,
  centro_custo_id TEXT,
  plano_conta_id TEXT,
  boleto_gerado INTEGER DEFAULT 0,
  boleto_url TEXT,
  parcela_atual INTEGER,
  total_parcelas INTEGER,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id)
);

CREATE INDEX IF NOT EXISTS idx_contas_receber_empresa ON contas_receber(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente ON contas_receber(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento ON contas_receber(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON contas_receber(status);

-- Pagamentos (baixas de contas a pagar)
CREATE TABLE IF NOT EXISTS pagamentos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  conta_pagar_id TEXT NOT NULL,
  valor REAL NOT NULL,
  data_pagamento TEXT NOT NULL,
  forma_pagamento TEXT,
  conta_bancaria_id TEXT,
  documento TEXT,
  observacao TEXT,
  usuario_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (conta_pagar_id) REFERENCES contas_pagar(id),
  FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_conta ON pagamentos(conta_pagar_id);

-- Pagamentos Formas (multiplas formas de pagamento)
CREATE TABLE IF NOT EXISTS pagamentos_formas (
  id TEXT PRIMARY KEY,
  pagamento_id TEXT NOT NULL,
  forma_pagamento_id TEXT,
  valor REAL NOT NULL,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pagamento_id) REFERENCES pagamentos(id) ON DELETE CASCADE
);

-- Recebimentos (baixas de contas a receber)
CREATE TABLE IF NOT EXISTS recebimentos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  conta_receber_id TEXT NOT NULL,
  valor REAL NOT NULL,
  data_recebimento TEXT NOT NULL,
  forma_pagamento TEXT,
  conta_bancaria_id TEXT,
  documento TEXT,
  observacao TEXT,
  usuario_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id),
  FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_recebimentos_conta ON recebimentos(conta_receber_id);

-- Recebimentos Formas (multiplas formas de recebimento)
CREATE TABLE IF NOT EXISTS recebimentos_formas (
  id TEXT PRIMARY KEY,
  recebimento_id TEXT NOT NULL,
  forma_pagamento_id TEXT,
  valor REAL NOT NULL,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recebimento_id) REFERENCES recebimentos(id) ON DELETE CASCADE
);

-- Caixas (pontos de caixa)
CREATE TABLE IF NOT EXISTS caixas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  conta_bancaria_id TEXT,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id),
  FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id)
);

CREATE INDEX IF NOT EXISTS idx_caixas_empresa ON caixas(empresa_id);

-- Sessoes de Caixa
CREATE TABLE IF NOT EXISTS caixas_sessoes (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  caixa_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  data_abertura TEXT NOT NULL,
  data_fechamento TEXT,
  valor_abertura REAL DEFAULT 0,
  valor_fechamento REAL,
  valor_sistema REAL,
  diferenca REAL,
  status TEXT DEFAULT 'ABERTO', -- ABERTO, FECHADO
  observacao_abertura TEXT,
  observacao_fechamento TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (caixa_id) REFERENCES caixas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_caixas_sessoes_caixa ON caixas_sessoes(caixa_id);
CREATE INDEX IF NOT EXISTS idx_caixas_sessoes_status ON caixas_sessoes(status);

-- Movimentacoes de Caixa
CREATE TABLE IF NOT EXISTS caixas_movimentacoes (
  id TEXT PRIMARY KEY,
  sessao_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- ENTRADA, SAIDA, SANGRIA, SUPRIMENTO
  valor REAL NOT NULL,
  forma_pagamento TEXT,
  descricao TEXT,
  pedido_id TEXT,
  usuario_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sessao_id) REFERENCES caixas_sessoes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_caixas_mov_sessao ON caixas_movimentacoes(sessao_id);

-- Plano de Contas
CREATE TABLE IF NOT EXISTS plano_contas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL, -- RECEITA, DESPESA, ATIVO, PASSIVO, PATRIMONIO
  natureza TEXT, -- DEVEDORA, CREDORA
  sintetica INTEGER DEFAULT 0,
  conta_pai_id TEXT,
  nivel INTEGER DEFAULT 1,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (conta_pai_id) REFERENCES plano_contas(id)
);

CREATE INDEX IF NOT EXISTS idx_plano_contas_empresa ON plano_contas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_plano_contas_codigo ON plano_contas(codigo);
CREATE UNIQUE INDEX IF NOT EXISTS idx_plano_contas_empresa_codigo ON plano_contas(empresa_id, codigo);

-- Sequencias (numeracao automatica)
CREATE TABLE IF NOT EXISTS sequencias (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  tipo TEXT NOT NULL, -- PEDIDO, ORCAMENTO, NF, BOLETO, etc
  prefixo TEXT,
  sufixo TEXT,
  tamanho INTEGER DEFAULT 6,
  ultimo_numero INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id)
);

CREATE INDEX IF NOT EXISTS idx_sequencias_empresa ON sequencias(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sequencias_tipo ON sequencias(empresa_id, filial_id, tipo);
