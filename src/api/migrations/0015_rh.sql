-- ============================================
-- PLANAC ERP - Migration 0015: RH
-- Tabelas do modulo Recursos Humanos
-- ============================================

-- Departamentos
CREATE TABLE IF NOT EXISTS departamentos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  responsavel_id TEXT,
  departamento_pai_id TEXT,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (departamento_pai_id) REFERENCES departamentos(id)
);

CREATE INDEX IF NOT EXISTS idx_departamentos_empresa ON departamentos(empresa_id);

-- Cargos
CREATE TABLE IF NOT EXISTS cargos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  cbo TEXT,
  salario_base REAL,
  departamento_id TEXT,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);

CREATE INDEX IF NOT EXISTS idx_cargos_empresa ON cargos(empresa_id);

-- Funcionarios
CREATE TABLE IF NOT EXISTS funcionarios (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  usuario_id TEXT,
  
  -- Dados pessoais
  nome TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  data_nascimento TEXT,
  sexo TEXT,
  estado_civil TEXT,
  nacionalidade TEXT,
  naturalidade TEXT,
  
  -- Contato
  telefone TEXT,
  celular TEXT,
  email TEXT,
  email_corporativo TEXT,
  
  -- Endereco
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  
  -- Documentos
  ctps TEXT,
  ctps_serie TEXT,
  pis TEXT,
  titulo_eleitor TEXT,
  zona_eleitoral TEXT,
  secao_eleitoral TEXT,
  certificado_reservista TEXT,
  
  -- Dados bancarios
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  tipo_conta TEXT,
  pix TEXT,
  
  -- Contrato
  cargo_id TEXT,
  departamento_id TEXT,
  data_admissao TEXT,
  data_demissao TEXT,
  tipo_contrato TEXT, -- CLT, PJ, ESTAGIO, TEMPORARIO
  jornada_trabalho TEXT,
  salario REAL,
  
  -- Status
  status TEXT DEFAULT 'ATIVO', -- ATIVO, FERIAS, AFASTADO, DEMITIDO
  
  foto_url TEXT,
  observacao TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (cargo_id) REFERENCES cargos(id),
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);

CREATE INDEX IF NOT EXISTS idx_funcionarios_empresa ON funcionarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf ON funcionarios(cpf);
CREATE INDEX IF NOT EXISTS idx_funcionarios_status ON funcionarios(status);

-- Folha de Pagamento
CREATE TABLE IF NOT EXISTS folha_pagamento (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  competencia TEXT NOT NULL, -- YYYY-MM
  tipo TEXT DEFAULT 'MENSAL', -- MENSAL, FERIAS, 13_SALARIO, RESCISAO
  status TEXT DEFAULT 'ABERTA', -- ABERTA, CALCULADA, FECHADA, PAGA
  data_pagamento TEXT,
  total_proventos REAL DEFAULT 0,
  total_descontos REAL DEFAULT 0,
  total_liquido REAL DEFAULT 0,
  observacao TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id)
);

CREATE INDEX IF NOT EXISTS idx_folha_empresa ON folha_pagamento(empresa_id);
CREATE INDEX IF NOT EXISTS idx_folha_competencia ON folha_pagamento(competencia);

-- Eventos da Folha (proventos e descontos)
CREATE TABLE IF NOT EXISTS folha_eventos (
  id TEXT PRIMARY KEY,
  folha_id TEXT NOT NULL,
  funcionario_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- PROVENTO, DESCONTO
  codigo TEXT,
  descricao TEXT NOT NULL,
  referencia REAL,
  valor REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folha_id) REFERENCES folha_pagamento(id) ON DELETE CASCADE,
  FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id)
);

CREATE INDEX IF NOT EXISTS idx_folha_eventos_folha ON folha_eventos(folha_id);
CREATE INDEX IF NOT EXISTS idx_folha_eventos_funcionario ON folha_eventos(funcionario_id);

-- Ponto Eletronico
CREATE TABLE IF NOT EXISTS ponto (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  funcionario_id TEXT NOT NULL,
  data TEXT NOT NULL,
  tipo TEXT NOT NULL, -- ENTRADA, SAIDA, INTERVALO_INICIO, INTERVALO_FIM
  hora TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  foto_url TEXT,
  dispositivo TEXT,
  ip TEXT,
  observacao TEXT,
  ajustado INTEGER DEFAULT 0,
  ajustado_por TEXT,
  motivo_ajuste TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id)
);

CREATE INDEX IF NOT EXISTS idx_ponto_funcionario ON ponto(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_ponto_data ON ponto(data);

-- Ferias
CREATE TABLE IF NOT EXISTS ferias (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  funcionario_id TEXT NOT NULL,
  periodo_aquisitivo_inicio TEXT NOT NULL,
  periodo_aquisitivo_fim TEXT NOT NULL,
  data_inicio TEXT,
  data_fim TEXT,
  dias_gozados INTEGER,
  dias_vendidos INTEGER,
  valor_ferias REAL,
  valor_abono REAL,
  valor_adiantamento_13 REAL,
  status TEXT DEFAULT 'PENDENTE', -- PENDENTE, PROGRAMADA, EM_GOZO, CONCLUIDA
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id)
);

CREATE INDEX IF NOT EXISTS idx_ferias_funcionario ON ferias(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_ferias_status ON ferias(status);
