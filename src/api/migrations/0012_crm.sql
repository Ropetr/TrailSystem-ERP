-- ============================================
-- PLANAC ERP - Migration 0012: CRM
-- Tabelas do modulo CRM (Gestao de Relacionamento)
-- ============================================

-- Oportunidades CRM
CREATE TABLE IF NOT EXISTS crm_oportunidades (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  numero TEXT,
  titulo TEXT NOT NULL,
  descricao TEXT,
  cliente_id TEXT,
  cliente_nome TEXT,
  cliente_telefone TEXT,
  cliente_email TEXT,
  vendedor_id TEXT,
  origem TEXT, -- INDICACAO, SITE, TELEFONE, VISITA, REDE_SOCIAL, OUTRO
  etapa TEXT DEFAULT 'LEAD', -- LEAD, QUALIFICACAO, PROPOSTA, NEGOCIACAO, GANHO, PERDIDO
  valor_estimado REAL DEFAULT 0,
  probabilidade INTEGER DEFAULT 50,
  data_previsao_fechamento TEXT,
  data_fechamento TEXT,
  motivo_perda TEXT,
  concorrente TEXT,
  produto_interesse TEXT,
  observacoes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_crm_oportunidades_empresa ON crm_oportunidades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crm_oportunidades_etapa ON crm_oportunidades(etapa);
CREATE INDEX IF NOT EXISTS idx_crm_oportunidades_vendedor ON crm_oportunidades(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_crm_oportunidades_cliente ON crm_oportunidades(cliente_id);

-- Historico de Oportunidades
CREATE TABLE IF NOT EXISTS crm_oportunidades_historico (
  id TEXT PRIMARY KEY,
  oportunidade_id TEXT NOT NULL,
  etapa_anterior TEXT,
  etapa_nova TEXT NOT NULL,
  observacao TEXT,
  usuario_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (oportunidade_id) REFERENCES crm_oportunidades(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_crm_historico_oportunidade ON crm_oportunidades_historico(oportunidade_id);

-- Atividades CRM
CREATE TABLE IF NOT EXISTS crm_atividades (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  oportunidade_id TEXT,
  cliente_id TEXT,
  tipo TEXT NOT NULL, -- LIGACAO, EMAIL, REUNIAO, VISITA, WHATSAPP, OUTRO
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_atividade TEXT NOT NULL,
  duracao_minutos INTEGER,
  resultado TEXT,
  usuario_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (oportunidade_id) REFERENCES crm_oportunidades(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_crm_atividades_empresa ON crm_atividades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crm_atividades_oportunidade ON crm_atividades(oportunidade_id);

-- Tarefas CRM
CREATE TABLE IF NOT EXISTS crm_tarefas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  oportunidade_id TEXT,
  cliente_id TEXT,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_vencimento TEXT,
  prioridade TEXT DEFAULT 'MEDIA', -- BAIXA, MEDIA, ALTA, URGENTE
  status TEXT DEFAULT 'PENDENTE', -- PENDENTE, EM_ANDAMENTO, CONCLUIDA, CANCELADA
  responsavel_id TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (oportunidade_id) REFERENCES crm_oportunidades(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_crm_tarefas_empresa ON crm_tarefas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crm_tarefas_status ON crm_tarefas(status);
CREATE INDEX IF NOT EXISTS idx_crm_tarefas_responsavel ON crm_tarefas(responsavel_id);
