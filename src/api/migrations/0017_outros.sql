-- ============================================
-- PLANAC ERP - Migration 0017: Outros Modulos
-- Tabelas de modulos diversos
-- ============================================

-- ============================================
-- CONTRATOS
-- ============================================

CREATE TABLE IF NOT EXISTS contratos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  numero TEXT,
  tipo TEXT NOT NULL, -- CLIENTE, FORNECEDOR, SERVICO, LOCACAO
  cliente_id TEXT,
  fornecedor_id TEXT,
  objeto TEXT NOT NULL,
  valor_total REAL,
  valor_mensal REAL,
  data_inicio TEXT NOT NULL,
  data_fim TEXT,
  data_ativacao TEXT,
  data_encerramento TEXT,
  status TEXT DEFAULT 'RASCUNHO', -- RASCUNHO, ATIVO, SUSPENSO, ENCERRADO, CANCELADO
  indice_reajuste TEXT,
  periodicidade_reajuste TEXT,
  proximo_reajuste TEXT,
  observacao TEXT,
  arquivo_url TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
);

CREATE INDEX IF NOT EXISTS idx_contratos_empresa ON contratos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON contratos(cliente_id);

-- Aditivos de Contrato
CREATE TABLE IF NOT EXISTS contratos_aditivos (
  id TEXT PRIMARY KEY,
  contrato_id TEXT NOT NULL,
  numero INTEGER NOT NULL,
  tipo TEXT NOT NULL, -- PRORROGACAO, REAJUSTE, ALTERACAO, RESCISAO
  descricao TEXT,
  nova_data_fim TEXT,
  novo_valor REAL,
  data_assinatura TEXT,
  arquivo_url TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contratos_aditivos_contrato ON contratos_aditivos(contrato_id);

-- Parcelas de Contrato
CREATE TABLE IF NOT EXISTS contratos_parcelas (
  id TEXT PRIMARY KEY,
  contrato_id TEXT NOT NULL,
  numero INTEGER NOT NULL,
  data_vencimento TEXT NOT NULL,
  valor REAL NOT NULL,
  valor_pago REAL DEFAULT 0,
  data_pagamento TEXT,
  status TEXT DEFAULT 'PENDENTE', -- PENDENTE, PAGO, ATRASADO, CANCELADO
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contratos_parcelas_contrato ON contratos_parcelas(contrato_id);

-- ============================================
-- PATRIMONIO
-- ============================================

-- Categorias de Patrimonio
CREATE TABLE IF NOT EXISTS categorias_patrimonio (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  vida_util_meses INTEGER,
  taxa_depreciacao REAL,
  conta_ativo_id TEXT,
  conta_depreciacao_id TEXT,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Bens Patrimoniais
CREATE TABLE IF NOT EXISTS bens (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  codigo TEXT,
  descricao TEXT NOT NULL,
  categoria_id TEXT,
  marca TEXT,
  modelo TEXT,
  numero_serie TEXT,
  data_aquisicao TEXT,
  valor_aquisicao REAL,
  valor_residual REAL,
  vida_util_meses INTEGER,
  taxa_depreciacao REAL,
  valor_depreciado REAL DEFAULT 0,
  valor_atual REAL,
  localizacao TEXT,
  responsavel_id TEXT,
  nota_fiscal TEXT,
  fornecedor_id TEXT,
  status TEXT DEFAULT 'ATIVO', -- ATIVO, BAIXADO, VENDIDO, TRANSFERIDO
  data_baixa TEXT,
  motivo_baixa TEXT,
  observacao TEXT,
  foto_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id),
  FOREIGN KEY (categoria_id) REFERENCES categorias_patrimonio(id),
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
);

CREATE INDEX IF NOT EXISTS idx_bens_empresa ON bens(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bens_categoria ON bens(categoria_id);
CREATE INDEX IF NOT EXISTS idx_bens_status ON bens(status);

-- Depreciacoes
CREATE TABLE IF NOT EXISTS depreciacoes (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  bem_id TEXT NOT NULL,
  competencia TEXT NOT NULL, -- YYYY-MM
  valor REAL NOT NULL,
  valor_acumulado REAL NOT NULL,
  valor_residual REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (bem_id) REFERENCES bens(id)
);

CREATE INDEX IF NOT EXISTS idx_depreciacoes_bem ON depreciacoes(bem_id);
CREATE INDEX IF NOT EXISTS idx_depreciacoes_competencia ON depreciacoes(competencia);

-- Movimentacoes de Patrimonio
CREATE TABLE IF NOT EXISTS patrimonio_movimentacoes (
  id TEXT PRIMARY KEY,
  bem_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- TRANSFERENCIA, MANUTENCAO, BAIXA
  data TEXT NOT NULL,
  descricao TEXT,
  localizacao_origem TEXT,
  localizacao_destino TEXT,
  responsavel_origem_id TEXT,
  responsavel_destino_id TEXT,
  valor REAL,
  observacao TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bem_id) REFERENCES bens(id)
);

CREATE INDEX IF NOT EXISTS idx_patrimonio_mov_bem ON patrimonio_movimentacoes(bem_id);

-- Manutencoes de Patrimonio
CREATE TABLE IF NOT EXISTS patrimonio_manutencoes (
  id TEXT PRIMARY KEY,
  bem_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- PREVENTIVA, CORRETIVA
  data TEXT NOT NULL,
  descricao TEXT,
  fornecedor TEXT,
  valor REAL,
  nota_fiscal TEXT,
  proxima_manutencao TEXT,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bem_id) REFERENCES bens(id)
);

CREATE INDEX IF NOT EXISTS idx_patrimonio_manut_bem ON patrimonio_manutencoes(bem_id);

-- ============================================
-- BI & RELATORIOS
-- ============================================

-- Dashboards
CREATE TABLE IF NOT EXISTS dashboards (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  publico INTEGER DEFAULT 0,
  ordem INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_dashboards_empresa ON dashboards(empresa_id);

-- Widgets do Dashboard
CREATE TABLE IF NOT EXISTS dashboards_widgets (
  id TEXT PRIMARY KEY,
  dashboard_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- GRAFICO, TABELA, INDICADOR, MAPA
  titulo TEXT,
  subtitulo TEXT,
  consulta_sql TEXT,
  configuracao TEXT, -- JSON com configuracoes do widget
  largura INTEGER DEFAULT 1,
  altura INTEGER DEFAULT 1,
  ordem INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_widgets_dashboard ON dashboards_widgets(dashboard_id);

-- Relatorios
CREATE TABLE IF NOT EXISTS relatorios (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  consulta_sql TEXT,
  parametros TEXT, -- JSON com definicao dos parametros
  formato_saida TEXT DEFAULT 'PDF', -- PDF, EXCEL, CSV
  ativo INTEGER DEFAULT 1,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_relatorios_empresa ON relatorios(empresa_id);

-- Execucoes de Relatorios
CREATE TABLE IF NOT EXISTS relatorios_execucoes (
  id TEXT PRIMARY KEY,
  relatorio_id TEXT NOT NULL,
  usuario_id TEXT,
  parametros TEXT, -- JSON com valores dos parametros
  status TEXT DEFAULT 'PROCESSANDO', -- PROCESSANDO, CONCLUIDO, ERRO
  arquivo_url TEXT,
  erro TEXT,
  tempo_execucao INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (relatorio_id) REFERENCES relatorios(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_relatorios_exec_relatorio ON relatorios_execucoes(relatorio_id);

-- ============================================
-- E-COMMERCE
-- ============================================

-- Carrinhos de Compra
CREATE TABLE IF NOT EXISTS carrinhos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  cliente_id TEXT,
  session_id TEXT,
  status TEXT DEFAULT 'ATIVO', -- ATIVO, ABANDONADO, CONVERTIDO
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE INDEX IF NOT EXISTS idx_carrinhos_empresa ON carrinhos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_carrinhos_cliente ON carrinhos(cliente_id);

-- Itens do Carrinho
CREATE TABLE IF NOT EXISTS carrinhos_itens (
  id TEXT PRIMARY KEY,
  carrinho_id TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  quantidade REAL NOT NULL,
  valor_unitario REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (carrinho_id) REFERENCES carrinhos(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE INDEX IF NOT EXISTS idx_carrinhos_itens_carrinho ON carrinhos_itens(carrinho_id);

-- Cupons de Desconto
CREATE TABLE IF NOT EXISTS cupons (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  codigo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL, -- PERCENTUAL, VALOR_FIXO, FRETE_GRATIS
  valor REAL,
  valor_minimo_pedido REAL,
  quantidade_maxima INTEGER,
  quantidade_usada INTEGER DEFAULT 0,
  data_inicio TEXT,
  data_fim TEXT,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_cupons_empresa ON cupons(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cupons_codigo ON cupons(empresa_id, codigo);

-- Uso de Cupons
CREATE TABLE IF NOT EXISTS cupons_uso (
  id TEXT PRIMARY KEY,
  cupom_id TEXT NOT NULL,
  pedido_id TEXT,
  cliente_id TEXT,
  valor_desconto REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cupom_id) REFERENCES cupons(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE INDEX IF NOT EXISTS idx_cupons_uso_cupom ON cupons_uso(cupom_id);

-- Avaliacoes de Produtos
CREATE TABLE IF NOT EXISTS avaliacoes (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  cliente_id TEXT,
  nota INTEGER NOT NULL,
  titulo TEXT,
  comentario TEXT,
  aprovado INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_produto ON avaliacoes(produto_id);

-- Lista de Desejos
CREATE TABLE IF NOT EXISTS wishlists (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  cliente_id TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlists_cliente_produto ON wishlists(cliente_id, produto_id);

-- ============================================
-- SUPORTE / TICKETS
-- ============================================

-- Tickets de Suporte
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  numero TEXT,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  prioridade TEXT DEFAULT 'MEDIA', -- BAIXA, MEDIA, ALTA, URGENTE
  status TEXT DEFAULT 'ABERTO', -- ABERTO, EM_ANDAMENTO, AGUARDANDO, RESOLVIDO, FECHADO
  cliente_id TEXT,
  solicitante_id TEXT,
  responsavel_id TEXT,
  data_abertura TEXT NOT NULL,
  data_primeira_resposta TEXT,
  data_resolucao TEXT,
  data_fechamento TEXT,
  sla_resposta INTEGER,
  sla_resolucao INTEGER,
  avaliacao INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_tickets_empresa ON tickets(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_responsavel ON tickets(responsavel_id);

-- Mensagens do Ticket
CREATE TABLE IF NOT EXISTS tickets_mensagens (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  usuario_id TEXT,
  tipo TEXT DEFAULT 'RESPOSTA', -- RESPOSTA, NOTA_INTERNA
  mensagem TEXT NOT NULL,
  anexos TEXT, -- JSON com lista de anexos
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_tickets_msg_ticket ON tickets_mensagens(ticket_id);

-- Historico do Ticket
CREATE TABLE IF NOT EXISTS tickets_historico (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  campo TEXT,
  valor_anterior TEXT,
  valor_novo TEXT,
  usuario_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_tickets_hist_ticket ON tickets_historico(ticket_id);

-- Base de Conhecimento
CREATE TABLE IF NOT EXISTS categorias_ajuda (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE TABLE IF NOT EXISTS artigos_ajuda (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  categoria_id TEXT,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  tags TEXT,
  visualizacoes INTEGER DEFAULT 0,
  util_sim INTEGER DEFAULT 0,
  util_nao INTEGER DEFAULT 0,
  publico INTEGER DEFAULT 1,
  ativo INTEGER DEFAULT 1,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (categoria_id) REFERENCES categorias_ajuda(id)
);

CREATE INDEX IF NOT EXISTS idx_artigos_empresa ON artigos_ajuda(empresa_id);
CREATE INDEX IF NOT EXISTS idx_artigos_categoria ON artigos_ajuda(categoria_id);
