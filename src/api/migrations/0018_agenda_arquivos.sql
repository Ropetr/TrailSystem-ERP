-- ============================================
-- PLANAC ERP - Migration 0018: Agenda e Arquivos
-- Tabelas de Agenda e Gestao de Arquivos
-- ============================================

-- ============================================
-- AGENDA / CALENDARIO
-- ============================================

-- Eventos
CREATE TABLE IF NOT EXISTS eventos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'EVENTO', -- EVENTO, REUNIAO, TAREFA, LEMBRETE
  data_inicio TEXT NOT NULL,
  data_fim TEXT,
  hora_inicio TEXT,
  hora_fim TEXT,
  dia_inteiro INTEGER DEFAULT 0,
  local TEXT,
  cor TEXT,
  recorrente INTEGER DEFAULT 0,
  recorrencia_tipo TEXT, -- DIARIA, SEMANAL, MENSAL, ANUAL
  recorrencia_fim TEXT,
  privado INTEGER DEFAULT 0,
  status TEXT DEFAULT 'CONFIRMADO', -- CONFIRMADO, TENTATIVO, CANCELADO
  criador_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (criador_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_eventos_empresa ON eventos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_criador ON eventos(criador_id);

-- Participantes do Evento
CREATE TABLE IF NOT EXISTS eventos_participantes (
  id TEXT PRIMARY KEY,
  evento_id TEXT NOT NULL,
  usuario_id TEXT,
  email TEXT,
  nome TEXT,
  status TEXT DEFAULT 'PENDENTE', -- PENDENTE, CONFIRMADO, RECUSADO, TALVEZ
  obrigatorio INTEGER DEFAULT 0,
  notificado INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_eventos_part_evento ON eventos_participantes(evento_id);
CREATE INDEX IF NOT EXISTS idx_eventos_part_usuario ON eventos_participantes(usuario_id);

-- Lembretes
CREATE TABLE IF NOT EXISTS lembretes (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_lembrete TEXT NOT NULL,
  hora_lembrete TEXT,
  tipo_notificacao TEXT DEFAULT 'EMAIL', -- EMAIL, PUSH, SMS
  antecedencia_minutos INTEGER DEFAULT 30,
  repetir INTEGER DEFAULT 0,
  entidade_tipo TEXT, -- EVENTO, TAREFA, CONTA_PAGAR, CONTA_RECEBER, etc
  entidade_id TEXT,
  enviado INTEGER DEFAULT 0,
  data_envio TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_lembretes_usuario ON lembretes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_data ON lembretes(data_lembrete);
CREATE INDEX IF NOT EXISTS idx_lembretes_enviado ON lembretes(enviado);

-- ============================================
-- ARQUIVOS / DOCUMENTOS
-- ============================================

-- Arquivos
CREATE TABLE IF NOT EXISTS arquivos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  nome_original TEXT,
  extensao TEXT,
  mime_type TEXT,
  tamanho INTEGER,
  url TEXT,
  storage_key TEXT,
  pasta_id TEXT,
  entidade_tipo TEXT, -- CLIENTE, PRODUTO, PEDIDO, CONTRATO, etc
  entidade_id TEXT,
  descricao TEXT,
  tags TEXT,
  publico INTEGER DEFAULT 0,
  versao INTEGER DEFAULT 1,
  checksum TEXT,
  uploaded_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (uploaded_by) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_arquivos_empresa ON arquivos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_entidade ON arquivos(entidade_tipo, entidade_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_pasta ON arquivos(pasta_id);

-- Pastas
CREATE TABLE IF NOT EXISTS pastas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  pasta_pai_id TEXT,
  caminho TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (pasta_pai_id) REFERENCES pastas(id)
);

CREATE INDEX IF NOT EXISTS idx_pastas_empresa ON pastas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pastas_pai ON pastas(pasta_pai_id);

-- Anexos (vinculo generico de arquivos)
CREATE TABLE IF NOT EXISTS anexos (
  id TEXT PRIMARY KEY,
  arquivo_id TEXT NOT NULL,
  entidade_tipo TEXT NOT NULL,
  entidade_id TEXT NOT NULL,
  descricao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (arquivo_id) REFERENCES arquivos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_anexos_arquivo ON anexos(arquivo_id);
CREATE INDEX IF NOT EXISTS idx_anexos_entidade ON anexos(entidade_tipo, entidade_id);

-- Modelos de Documentos
CREATE TABLE IF NOT EXISTS modelos_documentos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT, -- CONTRATO, PROPOSTA, ORCAMENTO, RECIBO, etc
  conteudo TEXT, -- HTML/Template
  variaveis TEXT, -- JSON com variaveis disponiveis
  ativo INTEGER DEFAULT 1,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_modelos_empresa ON modelos_documentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_modelos_categoria ON modelos_documentos(categoria);
