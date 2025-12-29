-- ============================================
-- PLANAC ERP - Migration 0010: Fiscal
-- Tabelas do modulo Fiscal (NF-e, NFC-e, NFS-e)
-- ============================================

-- Notas Fiscais
CREATE TABLE IF NOT EXISTS notas_fiscais (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  tipo TEXT NOT NULL, -- NFE, NFCE, NFSE, CTE, MDFE
  modelo TEXT, -- 55, 65, etc
  serie TEXT,
  numero INTEGER,
  chave TEXT,
  natureza_operacao TEXT,
  finalidade TEXT, -- NORMAL, COMPLEMENTAR, AJUSTE, DEVOLUCAO
  
  -- Destinatario
  cliente_id TEXT,
  fornecedor_id TEXT,
  dest_nome TEXT,
  dest_cpf_cnpj TEXT,
  dest_ie TEXT,
  dest_email TEXT,
  dest_endereco TEXT,
  dest_numero TEXT,
  dest_complemento TEXT,
  dest_bairro TEXT,
  dest_cidade TEXT,
  dest_uf TEXT,
  dest_cep TEXT,
  dest_telefone TEXT,
  
  -- Valores
  valor_produtos REAL DEFAULT 0,
  valor_frete REAL DEFAULT 0,
  valor_seguro REAL DEFAULT 0,
  valor_desconto REAL DEFAULT 0,
  valor_outras REAL DEFAULT 0,
  valor_total REAL DEFAULT 0,
  
  -- Impostos
  base_icms REAL DEFAULT 0,
  valor_icms REAL DEFAULT 0,
  base_icms_st REAL DEFAULT 0,
  valor_icms_st REAL DEFAULT 0,
  valor_ipi REAL DEFAULT 0,
  valor_pis REAL DEFAULT 0,
  valor_cofins REAL DEFAULT 0,
  valor_aproximado_tributos REAL DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'RASCUNHO', -- RASCUNHO, PENDENTE, AUTORIZADA, CANCELADA, DENEGADA, INUTILIZADA
  data_emissao TEXT,
  data_saida TEXT,
  data_autorizacao TEXT,
  data_cancelamento TEXT,
  
  -- Protocolo
  protocolo TEXT,
  motivo_cancelamento TEXT,
  
  -- XML
  xml_envio TEXT,
  xml_retorno TEXT,
  xml_cancelamento TEXT,
  
  -- PDF
  pdf_url TEXT,
  
  -- Relacionamentos
  pedido_venda_id TEXT,
  pedido_compra_id TEXT,
  nf_referenciada_id TEXT,
  
  -- Informacoes adicionais
  informacoes_complementares TEXT,
  informacoes_fisco TEXT,
  
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_empresa ON notas_fiscais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_tipo ON notas_fiscais(tipo);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_status ON notas_fiscais(status);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_chave ON notas_fiscais(chave);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_numero ON notas_fiscais(numero);

-- Itens da Nota Fiscal
CREATE TABLE IF NOT EXISTS nfe_itens (
  id TEXT PRIMARY KEY,
  nota_fiscal_id TEXT NOT NULL,
  produto_id TEXT,
  sequencia INTEGER NOT NULL,
  codigo TEXT,
  descricao TEXT NOT NULL,
  ncm TEXT,
  cest TEXT,
  cfop TEXT,
  unidade TEXT,
  quantidade REAL NOT NULL,
  valor_unitario REAL NOT NULL,
  valor_total REAL NOT NULL,
  valor_desconto REAL DEFAULT 0,
  valor_frete REAL DEFAULT 0,
  valor_seguro REAL DEFAULT 0,
  valor_outras REAL DEFAULT 0,
  
  -- ICMS
  origem TEXT,
  cst_icms TEXT,
  base_icms REAL DEFAULT 0,
  aliquota_icms REAL DEFAULT 0,
  valor_icms REAL DEFAULT 0,
  
  -- ICMS ST
  base_icms_st REAL DEFAULT 0,
  aliquota_icms_st REAL DEFAULT 0,
  valor_icms_st REAL DEFAULT 0,
  
  -- IPI
  cst_ipi TEXT,
  base_ipi REAL DEFAULT 0,
  aliquota_ipi REAL DEFAULT 0,
  valor_ipi REAL DEFAULT 0,
  
  -- PIS
  cst_pis TEXT,
  base_pis REAL DEFAULT 0,
  aliquota_pis REAL DEFAULT 0,
  valor_pis REAL DEFAULT 0,
  
  -- COFINS
  cst_cofins TEXT,
  base_cofins REAL DEFAULT 0,
  aliquota_cofins REAL DEFAULT 0,
  valor_cofins REAL DEFAULT 0,
  
  -- Tributos aproximados
  valor_aproximado_tributos REAL DEFAULT 0,
  
  informacoes_adicionais TEXT,
  pedido_item_id TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE INDEX IF NOT EXISTS idx_nfe_itens_nota ON nfe_itens(nota_fiscal_id);

-- Duplicatas da Nota Fiscal
CREATE TABLE IF NOT EXISTS nfe_duplicatas (
  id TEXT PRIMARY KEY,
  nota_fiscal_id TEXT NOT NULL,
  numero TEXT NOT NULL,
  data_vencimento TEXT NOT NULL,
  valor REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nfe_duplicatas_nota ON nfe_duplicatas(nota_fiscal_id);

-- Pagamentos da Nota Fiscal
CREATE TABLE IF NOT EXISTS nfe_pagamentos (
  id TEXT PRIMARY KEY,
  nota_fiscal_id TEXT NOT NULL,
  forma TEXT NOT NULL, -- 01=Dinheiro, 02=Cheque, 03=Cartao Credito, etc
  valor REAL NOT NULL,
  bandeira TEXT,
  autorizacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nfe_pagamentos_nota ON nfe_pagamentos(nota_fiscal_id);

-- Volumes da Nota Fiscal
CREATE TABLE IF NOT EXISTS nfe_volumes (
  id TEXT PRIMARY KEY,
  nota_fiscal_id TEXT NOT NULL,
  quantidade INTEGER,
  especie TEXT,
  marca TEXT,
  numeracao TEXT,
  peso_liquido REAL,
  peso_bruto REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id) ON DELETE CASCADE
);

-- Eventos da Nota Fiscal (carta de correcao, cancelamento, etc)
CREATE TABLE IF NOT EXISTS nfe_eventos (
  id TEXT PRIMARY KEY,
  nota_fiscal_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- CANCELAMENTO, CARTA_CORRECAO, CIENCIA, CONFIRMACAO, etc
  sequencia INTEGER DEFAULT 1,
  data_evento TEXT NOT NULL,
  protocolo TEXT,
  motivo TEXT,
  xml_envio TEXT,
  xml_retorno TEXT,
  status TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nfe_eventos_nota ON nfe_eventos(nota_fiscal_id);

-- Cache IBPT (tributos aproximados)
CREATE TABLE IF NOT EXISTS ibpt_cache (
  id TEXT PRIMARY KEY,
  ncm TEXT NOT NULL,
  uf TEXT NOT NULL,
  ex TEXT,
  descricao TEXT,
  aliquota_nacional REAL,
  aliquota_importado REAL,
  aliquota_estadual REAL,
  aliquota_municipal REAL,
  vigencia_inicio TEXT,
  vigencia_fim TEXT,
  fonte TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ibpt_cache_ncm_uf ON ibpt_cache(ncm, uf);

-- Configuracoes da Empresa (fiscal)
CREATE TABLE IF NOT EXISTS empresas_config (
  id TEXT PRIMARY KEY,
  cnpj TEXT NOT NULL UNIQUE,
  razao_social TEXT,
  nome_fantasia TEXT,
  
  -- Configuracoes fiscais
  regime_tributario TEXT, -- SIMPLES, LUCRO_PRESUMIDO, LUCRO_REAL
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  cnae TEXT,
  
  -- Certificado digital
  certificado_tipo TEXT, -- A1, A3
  certificado_validade TEXT,
  
  -- Series NF
  serie_nfe TEXT DEFAULT '1',
  serie_nfce TEXT DEFAULT '1',
  serie_nfse TEXT DEFAULT '1',
  
  -- Ambiente
  ambiente TEXT DEFAULT 'HOMOLOGACAO', -- HOMOLOGACAO, PRODUCAO
  
  -- IBPT
  ibpt_token TEXT,
  ibpt_uf TEXT,
  ibpt_configurado_em TEXT,
  
  -- Nuvem Fiscal
  nuvem_fiscal_configurado INTEGER DEFAULT 0,
  
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_empresas_config_cnpj ON empresas_config(cnpj);
