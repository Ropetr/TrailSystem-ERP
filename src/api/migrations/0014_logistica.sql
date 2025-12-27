-- ============================================
-- PLANAC ERP - Migration 0014: Logistica
-- Tabelas do modulo Logistica (Entregas, Rotas)
-- ============================================

-- Motoristas
CREATE TABLE IF NOT EXISTS motoristas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  cnh TEXT,
  cnh_categoria TEXT,
  cnh_validade TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  data_admissao TEXT,
  data_demissao TEXT,
  ativo INTEGER DEFAULT 1,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_motoristas_empresa ON motoristas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_motoristas_cpf ON motoristas(cpf);

-- Veiculos
CREATE TABLE IF NOT EXISTS veiculos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  placa TEXT NOT NULL,
  renavam TEXT,
  chassi TEXT,
  marca TEXT,
  modelo TEXT,
  ano_fabricacao INTEGER,
  ano_modelo INTEGER,
  cor TEXT,
  tipo TEXT, -- CAMINHAO, VAN, MOTO, CARRO, UTILITARIO
  capacidade_kg REAL,
  capacidade_m3 REAL,
  combustivel TEXT,
  km_atual REAL,
  data_aquisicao TEXT,
  valor_aquisicao REAL,
  ativo INTEGER DEFAULT 1,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_veiculos_empresa ON veiculos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);

-- Vinculo Veiculo-Motorista
CREATE TABLE IF NOT EXISTS veiculos_motoristas (
  id TEXT PRIMARY KEY,
  veiculo_id TEXT NOT NULL,
  motorista_id TEXT NOT NULL,
  data_inicio TEXT NOT NULL,
  data_fim TEXT,
  principal INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),
  FOREIGN KEY (motorista_id) REFERENCES motoristas(id)
);

-- Abastecimentos
CREATE TABLE IF NOT EXISTS veiculos_abastecimentos (
  id TEXT PRIMARY KEY,
  veiculo_id TEXT NOT NULL,
  data TEXT NOT NULL,
  km REAL NOT NULL,
  litros REAL NOT NULL,
  valor_litro REAL NOT NULL,
  valor_total REAL NOT NULL,
  combustivel TEXT,
  posto TEXT,
  motorista_id TEXT,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),
  FOREIGN KEY (motorista_id) REFERENCES motoristas(id)
);

CREATE INDEX IF NOT EXISTS idx_abastecimentos_veiculo ON veiculos_abastecimentos(veiculo_id);

-- Manutencoes de Veiculos
CREATE TABLE IF NOT EXISTS veiculos_manutencoes (
  id TEXT PRIMARY KEY,
  veiculo_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- PREVENTIVA, CORRETIVA, REVISAO
  descricao TEXT NOT NULL,
  data TEXT NOT NULL,
  km REAL,
  valor REAL,
  fornecedor TEXT,
  nota_fiscal TEXT,
  proxima_km REAL,
  proxima_data TEXT,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
);

CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo ON veiculos_manutencoes(veiculo_id);

-- Rotas de Entrega
CREATE TABLE IF NOT EXISTS rotas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  data TEXT NOT NULL,
  motorista_id TEXT,
  veiculo_id TEXT,
  status TEXT DEFAULT 'PLANEJADA', -- PLANEJADA, EM_ANDAMENTO, CONCLUIDA, CANCELADA
  km_previsto REAL,
  km_realizado REAL,
  hora_saida_prevista TEXT,
  hora_saida_real TEXT,
  hora_retorno_prevista TEXT,
  hora_retorno_real TEXT,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id),
  FOREIGN KEY (motorista_id) REFERENCES motoristas(id),
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
);

CREATE INDEX IF NOT EXISTS idx_rotas_empresa ON rotas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_rotas_data ON rotas(data);
CREATE INDEX IF NOT EXISTS idx_rotas_status ON rotas(status);

-- Entregas
CREATE TABLE IF NOT EXISTS entregas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  filial_id TEXT,
  numero TEXT,
  pedido_id TEXT,
  cliente_id TEXT,
  rota_id TEXT,
  
  -- Endereco de entrega
  endereco_cep TEXT,
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_uf TEXT,
  
  -- Contato
  contato_nome TEXT,
  contato_telefone TEXT,
  
  -- Datas
  data_previsao TEXT,
  data_entrega TEXT,
  hora_previsao TEXT,
  hora_entrega TEXT,
  
  -- Status
  status TEXT DEFAULT 'PENDENTE', -- PENDENTE, EM_ROTA, ENTREGUE, DEVOLVIDA, CANCELADA
  tentativas INTEGER DEFAULT 0,
  
  -- Valores
  valor_frete REAL DEFAULT 0,
  valor_cobrar REAL DEFAULT 0,
  
  -- Comprovante
  assinatura_url TEXT,
  foto_url TEXT,
  latitude REAL,
  longitude REAL,
  
  observacao TEXT,
  observacao_entrega TEXT,
  
  motorista_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (filial_id) REFERENCES filiais(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (rota_id) REFERENCES rotas(id),
  FOREIGN KEY (motorista_id) REFERENCES motoristas(id)
);

CREATE INDEX IF NOT EXISTS idx_entregas_empresa ON entregas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas(status);
CREATE INDEX IF NOT EXISTS idx_entregas_rota ON entregas(rota_id);
CREATE INDEX IF NOT EXISTS idx_entregas_cliente ON entregas(cliente_id);

-- Itens da Entrega
CREATE TABLE IF NOT EXISTS entregas_itens (
  id TEXT PRIMARY KEY,
  entrega_id TEXT NOT NULL,
  pedido_item_id TEXT,
  produto_id TEXT,
  descricao TEXT,
  quantidade REAL NOT NULL,
  quantidade_entregue REAL DEFAULT 0,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE INDEX IF NOT EXISTS idx_entregas_itens_entrega ON entregas_itens(entrega_id);

-- Rotas de Entrega (vinculo rota-entrega)
CREATE TABLE IF NOT EXISTS rotas_entregas (
  id TEXT PRIMARY KEY,
  rota_id TEXT NOT NULL,
  entrega_id TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rota_id) REFERENCES rotas(id) ON DELETE CASCADE,
  FOREIGN KEY (entrega_id) REFERENCES entregas(id)
);

CREATE INDEX IF NOT EXISTS idx_rotas_entregas_rota ON rotas_entregas(rota_id);

-- Rastreamento de Entregas
CREATE TABLE IF NOT EXISTS entregas_rastreamento (
  id TEXT PRIMARY KEY,
  entrega_id TEXT NOT NULL,
  status TEXT NOT NULL,
  data_hora TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  observacao TEXT,
  foto_url TEXT,
  usuario_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_rastreamento_entrega ON entregas_rastreamento(entrega_id);

-- Tentativas de Entrega
CREATE TABLE IF NOT EXISTS entregas_tentativas (
  id TEXT PRIMARY KEY,
  entrega_id TEXT NOT NULL,
  data_tentativa TEXT NOT NULL,
  motivo TEXT NOT NULL,
  observacao TEXT,
  latitude REAL,
  longitude REAL,
  foto_url TEXT,
  usuario_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_tentativas_entrega ON entregas_tentativas(entrega_id);

-- Ocorrencias de Entrega
CREATE TABLE IF NOT EXISTS entregas_ocorrencias (
  id TEXT PRIMARY KEY,
  entrega_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- AVARIA, EXTRAVIO, RECUSA, ENDERECO_NAO_ENCONTRADO, OUTRO
  descricao TEXT,
  foto_url TEXT,
  latitude REAL,
  longitude REAL,
  usuario_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_ocorrencias_entrega ON entregas_ocorrencias(entrega_id);

-- Rastreamento (tabela generica)
CREATE TABLE IF NOT EXISTS rastreamento (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  entidade_tipo TEXT NOT NULL, -- ENTREGA, VEICULO, MOTORISTA
  entidade_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  velocidade REAL,
  direcao REAL,
  precisao REAL,
  data_hora TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX IF NOT EXISTS idx_rastreamento_entidade ON rastreamento(entidade_tipo, entidade_id);
CREATE INDEX IF NOT EXISTS idx_rastreamento_data ON rastreamento(data_hora);
