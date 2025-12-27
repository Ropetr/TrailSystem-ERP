-- ============================================
-- PLANAC ERP - Migration 0021: Certificados e Configuracoes
-- Tabelas de Certificados Digitais e Configuracoes do Sistema
-- ============================================

-- ============================================
-- CERTIFICADOS DIGITAIS
-- ============================================

-- Certificados Digitais
CREATE TABLE IF NOT EXISTS certificados (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- A1, A3
  nome TEXT NOT NULL,
  cnpj TEXT,
  razao_social TEXT,
  data_validade TEXT NOT NULL,
  data_upload TEXT,
  arquivo_nome TEXT,
  arquivo_url TEXT,
  senha_hash TEXT,
  ativo INTEGER DEFAULT 1,
  principal INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_certificados_empresa ON certificados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_certificados_validade ON certificados(data_validade);

-- ============================================
-- CONFIGURACOES DO SISTEMA
-- ============================================

-- Configuracoes do Sistema (chave-valor)
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
  id TEXT PRIMARY KEY,
  empresa_id TEXT,
  chave TEXT NOT NULL,
  valor TEXT,
  tipo TEXT DEFAULT 'STRING', -- STRING, NUMBER, BOOLEAN, JSON
  descricao TEXT,
  modulo TEXT,
  editavel INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_config_sistema_empresa ON configuracoes_sistema(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_config_sistema_chave ON configuracoes_sistema(empresa_id, chave);

-- Configuracoes Fiscais
CREATE TABLE IF NOT EXISTS configuracoes_fiscais (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  
  -- Regime Tributario
  regime_tributario TEXT, -- SIMPLES, LUCRO_PRESUMIDO, LUCRO_REAL
  
  -- ICMS
  aliquota_icms_interna REAL,
  aliquota_icms_interestadual REAL,
  
  -- PIS/COFINS
  regime_pis_cofins TEXT, -- CUMULATIVO, NAO_CUMULATIVO
  aliquota_pis REAL,
  aliquota_cofins REAL,
  
  -- IPI
  aliquota_ipi REAL,
  
  -- ISS
  aliquota_iss REAL,
  
  -- Simples Nacional
  aliquota_simples REAL,
  
  -- CFOP padrao
  cfop_venda_interna TEXT,
  cfop_venda_interestadual TEXT,
  cfop_devolucao TEXT,
  cfop_transferencia TEXT,
  
  -- CST padrao
  cst_icms_padrao TEXT,
  cst_pis_padrao TEXT,
  cst_cofins_padrao TEXT,
  cst_ipi_padrao TEXT,
  
  -- Outros
  informacoes_complementares_padrao TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_config_fiscais_empresa ON configuracoes_fiscais(empresa_id);

-- Configuracoes de Email
CREATE TABLE IF NOT EXISTS configuracoes_email (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  smtp_host TEXT,
  smtp_porta INTEGER,
  smtp_usuario TEXT,
  smtp_senha TEXT,
  smtp_seguranca TEXT, -- TLS, SSL, NONE
  email_remetente TEXT,
  nome_remetente TEXT,
  email_resposta TEXT,
  assinatura_html TEXT,
  ativo INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_config_email_empresa ON configuracoes_email(empresa_id);

-- Integracoes
CREATE TABLE IF NOT EXISTS integracoes (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- NUVEM_FISCAL, IBPT, CORREIOS, GATEWAY_PAGAMENTO, etc
  nome TEXT NOT NULL,
  configuracao TEXT, -- JSON com configuracoes especificas
  credenciais TEXT, -- JSON com credenciais (criptografado)
  ambiente TEXT DEFAULT 'HOMOLOGACAO', -- HOMOLOGACAO, PRODUCAO
  ativo INTEGER DEFAULT 0,
  ultimo_teste TEXT,
  status_teste TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_integracoes_empresa ON integracoes(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_integracoes_tipo ON integracoes(empresa_id, tipo);

-- Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  eventos TEXT NOT NULL, -- JSON array de eventos
  headers TEXT, -- JSON com headers customizados
  ativo INTEGER DEFAULT 1,
  secret TEXT,
  ultimo_envio TEXT,
  ultimo_status INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_webhooks_empresa ON webhooks(empresa_id);

-- Logs de Webhooks
CREATE TABLE IF NOT EXISTS webhooks_logs (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL,
  evento TEXT NOT NULL,
  payload TEXT,
  resposta TEXT,
  status_code INTEGER,
  tempo_resposta INTEGER,
  erro TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_webhooks_logs_webhook ON webhooks_logs(webhook_id);

-- ============================================
-- NOTIFICACOES
-- ============================================

-- Notificacoes
CREATE TABLE IF NOT EXISTS notificacoes (
  id TEXT PRIMARY KEY,
  empresa_id TEXT,
  usuario_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- INFO, ALERTA, ERRO, SUCESSO
  titulo TEXT NOT NULL,
  mensagem TEXT,
  link TEXT,
  lida INTEGER DEFAULT 0,
  data_leitura TEXT,
  entidade_tipo TEXT,
  entidade_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);

-- Preferencias de Notificacao
CREATE TABLE IF NOT EXISTS notificacoes_preferencias (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  tipo_notificacao TEXT NOT NULL,
  email INTEGER DEFAULT 1,
  push INTEGER DEFAULT 1,
  sistema INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_pref_usuario_tipo ON notificacoes_preferencias(usuario_id, tipo_notificacao);

-- ============================================
-- CENTRO DE CUSTOS
-- ============================================

-- Centros de Custo
CREATE TABLE IF NOT EXISTS centros_custo (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  centro_pai_id TEXT,
  nivel INTEGER DEFAULT 1,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (centro_pai_id) REFERENCES centros_custo(id)
);

CREATE INDEX IF NOT EXISTS idx_centros_custo_empresa ON centros_custo(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_centros_custo_codigo ON centros_custo(empresa_id, codigo);
