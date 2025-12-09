-- =============================================
-- 🏢 PLANAC ERP - Migration 002 - Cadastros
-- Clientes, Fornecedores, Produtos
-- =============================================

-- =============================================
-- CLIENTES
-- =============================================

CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('PF', 'PJ')),
    razao_social TEXT,
    nome_fantasia TEXT,
    cpf_cnpj TEXT NOT NULL,
    rg_ie TEXT,
    inscricao_estadual TEXT,
    inscricao_municipal TEXT,
    email TEXT,
    telefone TEXT,
    celular TEXT,
    data_nascimento TEXT,
    vendedor_id TEXT REFERENCES usuarios(id),
    tabela_preco_id TEXT,
    condicao_pagamento_id TEXT,
    limite_credito REAL DEFAULT 0,
    saldo_devedor REAL DEFAULT 0,
    segmento TEXT,
    origem TEXT,
    tags TEXT,
    observacao TEXT,
    bloqueado INTEGER DEFAULT 0,
    motivo_bloqueio TEXT,
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(empresa_id, cpf_cnpj)
);

CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_vendedor ON clientes(vendedor_id);

CREATE TABLE IF NOT EXISTS clientes_enderecos (
    id TEXT PRIMARY KEY,
    cliente_id TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    tipo TEXT DEFAULT 'principal',
    cep TEXT NOT NULL,
    logradouro TEXT NOT NULL,
    numero TEXT,
    complemento TEXT,
    bairro TEXT NOT NULL,
    cidade TEXT NOT NULL,
    uf TEXT NOT NULL,
    codigo_ibge TEXT,
    referencia TEXT,
    padrao INTEGER DEFAULT 0,
    entrega INTEGER DEFAULT 1,
    cobranca INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clientes_enderecos_cliente ON clientes_enderecos(cliente_id);

CREATE TABLE IF NOT EXISTS clientes_contatos (
    id TEXT PRIMARY KEY,
    cliente_id TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cargo TEXT,
    email TEXT,
    telefone TEXT,
    celular TEXT,
    whatsapp INTEGER DEFAULT 0,
    principal INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clientes_contatos_cliente ON clientes_contatos(cliente_id);

-- =============================================
-- FORNECEDORES
-- =============================================

CREATE TABLE IF NOT EXISTS fornecedores (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('PF', 'PJ')),
    razao_social TEXT,
    nome_fantasia TEXT,
    cpf_cnpj TEXT NOT NULL,
    inscricao_estadual TEXT,
    email TEXT,
    telefone TEXT,
    celular TEXT,
    prazo_entrega_padrao INTEGER,
    condicao_pagamento_padrao TEXT,
    tipo_fornecedor TEXT CHECK (tipo_fornecedor IN ('fabricante', 'distribuidor', 'importador', 'servicos')),
    categorias TEXT,
    avaliacao REAL,
    observacao TEXT,
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(empresa_id, cpf_cnpj)
);

CREATE INDEX IF NOT EXISTS idx_fornecedores_empresa ON fornecedores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cpf_cnpj ON fornecedores(cpf_cnpj);

CREATE TABLE IF NOT EXISTS fornecedores_enderecos (
    id TEXT PRIMARY KEY,
    fornecedor_id TEXT NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
    tipo TEXT DEFAULT 'principal',
    cep TEXT NOT NULL,
    logradouro TEXT NOT NULL,
    numero TEXT,
    complemento TEXT,
    bairro TEXT NOT NULL,
    cidade TEXT NOT NULL,
    uf TEXT NOT NULL,
    codigo_ibge TEXT,
    padrao INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fornecedores_enderecos_fornecedor ON fornecedores_enderecos(fornecedor_id);

CREATE TABLE IF NOT EXISTS fornecedores_contatos (
    id TEXT PRIMARY KEY,
    fornecedor_id TEXT NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cargo TEXT,
    email TEXT,
    telefone TEXT,
    celular TEXT,
    principal INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fornecedores_contatos_fornecedor ON fornecedores_contatos(fornecedor_id);

-- =============================================
-- PRODUTOS
-- =============================================

CREATE TABLE IF NOT EXISTS categorias_produtos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    categoria_pai_id TEXT REFERENCES categorias_produtos(id),
    nome TEXT NOT NULL,
    slug TEXT,
    descricao TEXT,
    imagem_url TEXT,
    ordem INTEGER DEFAULT 0,
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categorias_empresa ON categorias_produtos(empresa_id);

CREATE TABLE IF NOT EXISTS unidades_medida (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    sigla TEXT NOT NULL,
    descricao TEXT,
    unidade_base_id TEXT REFERENCES unidades_medida(id),
    fator_conversao REAL DEFAULT 1,
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(empresa_id, sigla)
);

CREATE INDEX IF NOT EXISTS idx_unidades_empresa ON unidades_medida(empresa_id);

CREATE TABLE IF NOT EXISTS produtos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    codigo TEXT NOT NULL,
    codigo_barras TEXT,
    nome TEXT NOT NULL,
    descricao TEXT,
    slug TEXT,
    categoria_id TEXT REFERENCES categorias_produtos(id),
    marca TEXT,
    modelo TEXT,
    unidade_medida_id TEXT NOT NULL REFERENCES unidades_medida(id),
    peso_liquido REAL,
    peso_bruto REAL,
    largura REAL,
    altura REAL,
    profundidade REAL,
    ncm TEXT,
    cest TEXT,
    origem INTEGER DEFAULT 0,
    cfop_venda TEXT,
    cst_icms TEXT,
    aliquota_icms REAL,
    aliquota_pis REAL,
    aliquota_cofins REAL,
    aliquota_ipi REAL,
    preco_custo REAL DEFAULT 0,
    preco_custo_medio REAL DEFAULT 0,
    margem_lucro REAL DEFAULT 0,
    preco_venda REAL DEFAULT 0,
    estoque_minimo REAL DEFAULT 0,
    estoque_maximo REAL DEFAULT 0,
    ponto_pedido REAL DEFAULT 0,
    disponivel_ecommerce INTEGER DEFAULT 0,
    destaque INTEGER DEFAULT 0,
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_produtos_empresa ON produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);

CREATE TABLE IF NOT EXISTS produtos_imagens (
    id TEXT PRIMARY KEY,
    produto_id TEXT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    titulo TEXT,
    ordem INTEGER DEFAULT 0,
    principal INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_produtos_imagens_produto ON produtos_imagens(produto_id);

CREATE TABLE IF NOT EXISTS produtos_fornecedores (
    id TEXT PRIMARY KEY,
    produto_id TEXT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    fornecedor_id TEXT NOT NULL REFERENCES fornecedores(id),
    codigo_fornecedor TEXT,
    preco_custo REAL DEFAULT 0,
    prazo_entrega INTEGER,
    quantidade_minima REAL DEFAULT 1,
    principal INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(produto_id, fornecedor_id)
);

CREATE INDEX IF NOT EXISTS idx_produtos_fornecedores_produto ON produtos_fornecedores(produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_fornecedores_fornecedor ON produtos_fornecedores(fornecedor_id);

-- =============================================
-- TABELAS DE PREÇO E CONDIÇÕES
-- =============================================

CREATE TABLE IF NOT EXISTS tabelas_preco (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT DEFAULT 'markup' CHECK (tipo IN ('markup', 'desconto', 'fixo')),
    percentual REAL DEFAULT 0,
    data_inicio TEXT,
    data_fim TEXT,
    padrao INTEGER DEFAULT 0,
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tabelas_preco_empresa ON tabelas_preco(empresa_id);

CREATE TABLE IF NOT EXISTS tabelas_preco_itens (
    id TEXT PRIMARY KEY,
    tabela_preco_id TEXT NOT NULL REFERENCES tabelas_preco(id) ON DELETE CASCADE,
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    preco REAL NOT NULL,
    quantidade_minima REAL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(tabela_preco_id, produto_id, quantidade_minima)
);

CREATE INDEX IF NOT EXISTS idx_tabelas_preco_itens_tabela ON tabelas_preco_itens(tabela_preco_id);

CREATE TABLE IF NOT EXISTS condicoes_pagamento (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT DEFAULT 'prazo' CHECK (tipo IN ('avista', 'prazo', 'entrada_prazo', 'cartao')),
    parcelas INTEGER DEFAULT 1,
    dias_primeira_parcela INTEGER DEFAULT 0,
    intervalo_parcelas INTEGER DEFAULT 30,
    percentual_entrada REAL DEFAULT 0,
    acrescimo_percentual REAL DEFAULT 0,
    desconto_percentual REAL DEFAULT 0,
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_condicoes_pagamento_empresa ON condicoes_pagamento(empresa_id);

CREATE TABLE IF NOT EXISTS transportadoras (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT,
    inscricao_estadual TEXT,
    email TEXT,
    telefone TEXT,
    cep TEXT,
    logradouro TEXT,
    numero TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT,
    tipo_frete TEXT DEFAULT 'cif' CHECK (tipo_frete IN ('cif', 'fob')),
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transportadoras_empresa ON transportadoras(empresa_id);
