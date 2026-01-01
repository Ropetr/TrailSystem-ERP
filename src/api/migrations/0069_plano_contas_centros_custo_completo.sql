-- ============================================
-- PLANAC ERP - Migration 0069: Plano de Contas e Centro de Custos Completo
-- Adiciona colunas extras e tabelas de suporte para modulo contabil
-- ============================================

-- ============================================
-- ALTERACOES NA TABELA CENTROS_CUSTO
-- ============================================

-- Adicionar coluna tipo (DEPARTAMENTO, FILIAL, PROJETO, PRODUTO, CLIENTE, ATIVIDADE)
ALTER TABLE centros_custo ADD COLUMN tipo TEXT DEFAULT 'DEPARTAMENTO';

-- Adicionar coluna aceita_lancamento (se pode apropriar direto neste CC)
ALTER TABLE centros_custo ADD COLUMN aceita_lancamento INTEGER DEFAULT 1;

-- Adicionar coluna responsavel_id (usuario responsavel pelo centro)
ALTER TABLE centros_custo ADD COLUMN responsavel_id TEXT REFERENCES usuarios(id);

-- Adicionar coluna orcamento_mensal
ALTER TABLE centros_custo ADD COLUMN orcamento_mensal REAL DEFAULT 0;

-- Adicionar coluna filial_id (filial vinculada)
ALTER TABLE centros_custo ADD COLUMN filial_id TEXT REFERENCES filiais(id);

-- Adicionar colunas de data para projetos
ALTER TABLE centros_custo ADD COLUMN data_inicio TEXT;
ALTER TABLE centros_custo ADD COLUMN data_fim TEXT;

-- Adicionar coluna observacoes
ALTER TABLE centros_custo ADD COLUMN observacoes TEXT;

-- ============================================
-- ALTERACOES NA TABELA PLANO_CONTAS
-- ============================================

-- Adicionar coluna aceita_lancamento
ALTER TABLE plano_contas ADD COLUMN aceita_lancamento INTEGER DEFAULT 1;

-- Adicionar coluna codigo_reduzido
ALTER TABLE plano_contas ADD COLUMN codigo_reduzido TEXT;

-- Adicionar coluna conta_sped (mapeamento SPED)
ALTER TABLE plano_contas ADD COLUMN conta_sped TEXT;

-- Adicionar coluna conta_dre (classificacao DRE)
ALTER TABLE plano_contas ADD COLUMN conta_dre TEXT;

-- Adicionar coluna grupo (ATIVO, PASSIVO, PL, RECEITA, CUSTO, DESPESA, APURACAO)
ALTER TABLE plano_contas ADD COLUMN grupo TEXT;

-- Adicionar coluna data_inativacao
ALTER TABLE plano_contas ADD COLUMN data_inativacao TEXT;

-- Adicionar coluna observacoes
ALTER TABLE plano_contas ADD COLUMN observacoes TEXT;

-- ============================================
-- TABELA: LANCAMENTOS CONTABEIS
-- ============================================

CREATE TABLE IF NOT EXISTS lancamentos_contabeis (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  numero_lancamento INTEGER NOT NULL,
  data_lancamento TEXT NOT NULL,
  data_competencia TEXT NOT NULL,
  conta_id TEXT NOT NULL REFERENCES plano_contas(id),
  centro_custo_id TEXT REFERENCES centros_custo(id),
  tipo_lancamento TEXT NOT NULL CHECK (tipo_lancamento IN ('DEBITO', 'CREDITO')),
  valor REAL NOT NULL CHECK (valor > 0),
  historico TEXT NOT NULL,
  documento_origem_tipo TEXT, -- NF, BOLETO, PAGAMENTO, RECEBIMENTO, MANUAL
  documento_origem_id TEXT,
  lote_id TEXT,
  lancamento_original_id TEXT REFERENCES lancamentos_contabeis(id),
  estornado INTEGER DEFAULT 0,
  data_estorno TEXT,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_lancamentos_contabeis_empresa ON lancamentos_contabeis(empresa_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_contabeis_data ON lancamentos_contabeis(data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_contabeis_competencia ON lancamentos_contabeis(data_competencia);
CREATE INDEX IF NOT EXISTS idx_lancamentos_contabeis_conta ON lancamentos_contabeis(conta_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_contabeis_centro ON lancamentos_contabeis(centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_contabeis_lote ON lancamentos_contabeis(lote_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lancamentos_contabeis_numero ON lancamentos_contabeis(empresa_id, numero_lancamento);

-- ============================================
-- TABELA: LOTES DE LANCAMENTOS
-- ============================================

CREATE TABLE IF NOT EXISTS lotes_lancamentos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  numero_lote INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  data_lote TEXT NOT NULL,
  status TEXT DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'FECHADO', 'CANCELADO')),
  total_debitos REAL DEFAULT 0,
  total_creditos REAL DEFAULT 0,
  quantidade_lancamentos INTEGER DEFAULT 0,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_lotes_lancamentos_empresa ON lotes_lancamentos(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lotes_lancamentos_numero ON lotes_lancamentos(empresa_id, numero_lote);

-- ============================================
-- TABELA: FECHAMENTOS CONTABEIS
-- ============================================

CREATE TABLE IF NOT EXISTS fechamentos_contabeis (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  data_fechamento TEXT NOT NULL,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  status TEXT DEFAULT 'FECHADO' CHECK (status IN ('FECHADO', 'REABERTO')),
  data_reabertura TEXT,
  usuario_reabertura_id TEXT REFERENCES usuarios(id),
  observacoes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_fechamentos_empresa ON fechamentos_contabeis(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fechamentos_periodo ON fechamentos_contabeis(empresa_id, ano, mes);

-- ============================================
-- TABELA: REGRAS DE RATEIO
-- ============================================

CREATE TABLE IF NOT EXISTS regras_rateio (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  descricao TEXT NOT NULL,
  conta_origem_id TEXT NOT NULL REFERENCES plano_contas(id),
  criterio TEXT NOT NULL CHECK (criterio IN ('FATURAMENTO', 'HEADCOUNT', 'AREA_M2', 'HORAS_TRAB', 'CONSUMO', 'FIXO')),
  periodicidade TEXT DEFAULT 'MENSAL' CHECK (periodicidade IN ('MENSAL', 'TRIMESTRAL', 'ANUAL')),
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_regras_rateio_empresa ON regras_rateio(empresa_id);
CREATE INDEX IF NOT EXISTS idx_regras_rateio_conta ON regras_rateio(conta_origem_id);

-- ============================================
-- TABELA: DESTINOS DE RATEIO
-- ============================================

CREATE TABLE IF NOT EXISTS rateio_destinos (
  id TEXT PRIMARY KEY,
  regra_rateio_id TEXT NOT NULL REFERENCES regras_rateio(id) ON DELETE CASCADE,
  centro_custo_id TEXT NOT NULL REFERENCES centros_custo(id),
  percentual REAL CHECK (percentual >= 0 AND percentual <= 100),
  conta_destino_id TEXT REFERENCES plano_contas(id),
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (regra_rateio_id) REFERENCES regras_rateio(id)
);

CREATE INDEX IF NOT EXISTS idx_rateio_destinos_regra ON rateio_destinos(regra_rateio_id);
CREATE INDEX IF NOT EXISTS idx_rateio_destinos_centro ON rateio_destinos(centro_custo_id);

-- ============================================
-- TABELA: EXECUCOES DE RATEIO
-- ============================================

CREATE TABLE IF NOT EXISTS rateio_execucoes (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  regra_rateio_id TEXT NOT NULL REFERENCES regras_rateio(id),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  valor_total REAL NOT NULL,
  data_execucao TEXT NOT NULL,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  status TEXT DEFAULT 'EXECUTADO' CHECK (status IN ('EXECUTADO', 'ESTORNADO')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_rateio_execucoes_empresa ON rateio_execucoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_rateio_execucoes_regra ON rateio_execucoes(regra_rateio_id);

-- ============================================
-- TABELA: SALDOS POR CONTA (CACHE)
-- ============================================

CREATE TABLE IF NOT EXISTS saldos_contas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  conta_id TEXT NOT NULL REFERENCES plano_contas(id),
  centro_custo_id TEXT REFERENCES centros_custo(id),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  saldo_anterior REAL DEFAULT 0,
  debitos REAL DEFAULT 0,
  creditos REAL DEFAULT 0,
  saldo_atual REAL DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_saldos_contas_empresa ON saldos_contas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_saldos_contas_conta ON saldos_contas(conta_id);
CREATE INDEX IF NOT EXISTS idx_saldos_contas_centro ON saldos_contas(centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_saldos_contas_periodo ON saldos_contas(ano, mes);

-- ============================================
-- TABELA: ORCAMENTOS POR CENTRO DE CUSTO
-- ============================================

CREATE TABLE IF NOT EXISTS orcamentos_centro_custo (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  centro_custo_id TEXT NOT NULL REFERENCES centros_custo(id),
  conta_id TEXT REFERENCES plano_contas(id),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  valor_orcado REAL DEFAULT 0,
  valor_realizado REAL DEFAULT 0,
  observacoes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_orcamentos_cc_empresa ON orcamentos_centro_custo(empresa_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cc_centro ON orcamentos_centro_custo(centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cc_periodo ON orcamentos_centro_custo(ano, mes);

-- ============================================
-- TABELA: HISTORICO PADRAO
-- ============================================

CREATE TABLE IF NOT EXISTS historicos_padrao (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  conta_debito_id TEXT REFERENCES plano_contas(id),
  conta_credito_id TEXT REFERENCES plano_contas(id),
  centro_custo_id TEXT REFERENCES centros_custo(id),
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_historicos_padrao_empresa ON historicos_padrao(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_historicos_padrao_codigo ON historicos_padrao(empresa_id, codigo);

-- ============================================
-- ATUALIZAR CONTAS A PAGAR/RECEBER COM CENTRO DE CUSTO
-- (Ja existe a coluna, apenas garantir indice)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_contas_pagar_centro ON contas_pagar(centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_centro ON contas_receber(centro_custo_id);
