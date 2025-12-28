-- ============================================================================
-- TRAILSYSTEM ERP - SCHEMA COMPLETO DE BANCO DE DADOS
-- ============================================================================
-- Baseado na análise do Projeto ACBr
-- Versão: 1.0.0
-- Data: 2024-12-28
-- ============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================================
-- PARTE 1: MÓDULO CORE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 LOCALIZAÇÃO (IBGE)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_paises (
    id SERIAL PRIMARY KEY,
    codigo_bacen VARCHAR(5) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    sigla VARCHAR(3),
    codigo_iso VARCHAR(3),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_estados (
    id SERIAL PRIMARY KEY,
    pais_id INTEGER REFERENCES tb_paises(id),
    codigo_ibge VARCHAR(2) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    sigla VARCHAR(2) NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_municipios (
    id SERIAL PRIMARY KEY,
    estado_id INTEGER REFERENCES tb_estados(id),
    codigo_ibge VARCHAR(7) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    codigo_siafi VARCHAR(10),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 1.2 EMPRESAS E FILIAIS
-- Baseado em: ACBrNFe.TEmit, ACBrBoleto.TACBrCedente
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    cnpj VARCHAR(14) NOT NULL UNIQUE,
    inscricao_estadual VARCHAR(20),
    inscricao_estadual_st VARCHAR(20),
    inscricao_municipal VARCHAR(20),
    cnae_principal VARCHAR(10),
    
    -- Dados Cadastrais
    razao_social VARCHAR(150) NOT NULL,
    nome_fantasia VARCHAR(60),
    
    -- Regime Tributário (CRT) - 1=Simples, 2=Simples Excesso, 3=Normal
    regime_tributario SMALLINT DEFAULT 3,
    
    -- Endereço
    logradouro VARCHAR(100),
    numero VARCHAR(10),
    complemento VARCHAR(60),
    bairro VARCHAR(60),
    municipio_id INTEGER REFERENCES tb_municipios(id),
    cep VARCHAR(8),
    telefone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(100),
    
    -- Configurações Fiscais
    ambiente_nfe SMALLINT DEFAULT 2,  -- 1=Produção, 2=Homologação
    serie_nfe INTEGER DEFAULT 1,
    numero_nfe INTEGER DEFAULT 1,
    serie_nfce INTEGER DEFAULT 1,
    numero_nfce INTEGER DEFAULT 1,
    csc_id VARCHAR(10),              -- ID do CSC para NFC-e
    csc_token VARCHAR(50),           -- Token CSC para NFC-e
    
    -- Certificado Digital
    certificado_tipo VARCHAR(10) DEFAULT 'A1',
    certificado_arquivo TEXT,
    certificado_senha_encrypted TEXT,
    certificado_validade DATE,
    
    -- Logo
    logo_base64 TEXT,
    
    -- Controle
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_filiais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    cnpj VARCHAR(14) NOT NULL,
    inscricao_estadual VARCHAR(20),
    inscricao_municipal VARCHAR(20),
    nome VARCHAR(100) NOT NULL,
    
    logradouro VARCHAR(100),
    numero VARCHAR(10),
    complemento VARCHAR(60),
    bairro VARCHAR(60),
    municipio_id INTEGER REFERENCES tb_municipios(id),
    cep VARCHAR(8),
    telefone VARCHAR(20),
    email VARCHAR(100),
    
    serie_nfe INTEGER,
    numero_nfe INTEGER,
    
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(empresa_id, cnpj)
);

-- ----------------------------------------------------------------------------
-- 1.3 CONFIGURAÇÕES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    categoria VARCHAR(50) NOT NULL,
    chave VARCHAR(100) NOT NULL,
    valor TEXT,
    tipo VARCHAR(20) DEFAULT 'string',
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, categoria, chave)
);

-- ----------------------------------------------------------------------------
-- 1.4 USUÁRIOS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES tb_empresas(id),
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(11),
    telefone VARCHAR(20),
    avatar_url TEXT,
    perfil VARCHAR(50) DEFAULT 'usuario',
    permissoes JSONB DEFAULT '{}',
    ultimo_login TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    email_verificado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 1.5 AUDITORIA
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_audit_log (
    id BIGSERIAL PRIMARY KEY,
    empresa_id UUID REFERENCES tb_empresas(id),
    usuario_id UUID REFERENCES tb_usuarios(id),
    tabela VARCHAR(100) NOT NULL,
    registro_id VARCHAR(50),
    acao VARCHAR(20) NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PARTE 2: MÓDULO CADASTROS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 PESSOAS (Clientes, Fornecedores, Transportadoras)
-- Baseado em: ACBrNFe.TDest, ACBrBoleto.TACBrSacado
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_pessoas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    -- Tipo
    tipo_pessoa CHAR(1) NOT NULL CHECK (tipo_pessoa IN ('F', 'J', 'E')), -- Física, Jurídica, Estrangeiro
    
    -- Documentos
    cpf_cnpj VARCHAR(14),
    inscricao_estadual VARCHAR(20),
    inscricao_municipal VARCHAR(20),
    inscricao_suframa VARCHAR(20),
    id_estrangeiro VARCHAR(20),
    
    -- Indicador IE Destino (NF-e)
    -- 1=Contribuinte, 2=Isento, 9=Não Contribuinte
    indicador_ie_dest SMALLINT DEFAULT 9,
    
    -- Dados
    razao_social VARCHAR(150) NOT NULL,
    nome_fantasia VARCHAR(60),
    
    -- Endereço Principal
    logradouro VARCHAR(100),
    numero VARCHAR(10),
    complemento VARCHAR(60),
    bairro VARCHAR(60),
    municipio_id INTEGER REFERENCES tb_municipios(id),
    cep VARCHAR(8),
    
    -- Contato
    telefone VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(100),
    email_nfe VARCHAR(100),  -- E-mail para recebimento de NF-e
    
    -- Classificação
    is_cliente BOOLEAN DEFAULT FALSE,
    is_fornecedor BOOLEAN DEFAULT FALSE,
    is_transportadora BOOLEAN DEFAULT FALSE,
    is_funcionario BOOLEAN DEFAULT FALSE,
    is_vendedor BOOLEAN DEFAULT FALSE,
    
    -- Financeiro (para boletos)
    codigo_cliente VARCHAR(20),       -- Código do cliente no sistema
    
    -- Dados Adicionais
    observacoes TEXT,
    dados_adicionais JSONB DEFAULT '{}',
    
    -- Controle
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_pessoas_empresa ON tb_pessoas(empresa_id);
CREATE INDEX idx_pessoas_cpf_cnpj ON tb_pessoas(cpf_cnpj);
CREATE INDEX idx_pessoas_razao ON tb_pessoas(razao_social);

-- Endereços adicionais (entrega, cobrança, etc)
CREATE TABLE IF NOT EXISTS tb_pessoas_enderecos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES tb_pessoas(id),
    
    tipo VARCHAR(20) NOT NULL,  -- principal, entrega, cobranca, retirada
    descricao VARCHAR(50),
    
    logradouro VARCHAR(100),
    numero VARCHAR(10),
    complemento VARCHAR(60),
    bairro VARCHAR(60),
    municipio_id INTEGER REFERENCES tb_municipios(id),
    cep VARCHAR(8),
    
    contato_nome VARCHAR(100),
    contato_telefone VARCHAR(20),
    contato_email VARCHAR(100),
    
    principal BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contatos adicionais
CREATE TABLE IF NOT EXISTS tb_pessoas_contatos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES tb_pessoas(id),
    
    nome VARCHAR(100) NOT NULL,
    cargo VARCHAR(50),
    departamento VARCHAR(50),
    telefone VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(100),
    
    principal BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dados bancários
CREATE TABLE IF NOT EXISTS tb_pessoas_dados_bancarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES tb_pessoas(id),
    
    banco_codigo VARCHAR(5),
    banco_nome VARCHAR(100),
    agencia VARCHAR(10),
    agencia_digito VARCHAR(2),
    conta VARCHAR(15),
    conta_digito VARCHAR(2),
    tipo_conta VARCHAR(20),  -- corrente, poupanca
    
    -- PIX
    chave_pix VARCHAR(100),
    tipo_chave_pix VARCHAR(20),  -- cpf, cnpj, email, telefone, aleatoria
    
    principal BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2.2 PRODUTOS
-- Baseado em: ACBrNFe.TProd
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    -- Identificação
    codigo VARCHAR(60) NOT NULL,       -- cProd
    codigo_barras VARCHAR(14),          -- cEAN
    codigo_barras_trib VARCHAR(14),     -- cEANTrib
    
    -- Descrição
    descricao VARCHAR(120) NOT NULL,    -- xProd
    descricao_complementar TEXT,
    
    -- Classificação Fiscal
    ncm VARCHAR(8) NOT NULL,            -- NCM
    cest VARCHAR(7),                     -- CEST
    nve VARCHAR(50),                     -- NVE (múltiplos separados por ;)
    extipi VARCHAR(3),                   -- EX TIPI
    
    -- Unidades
    unidade_comercial VARCHAR(6) NOT NULL,    -- uCom
    unidade_tributavel VARCHAR(6),             -- uTrib
    fator_conversao DECIMAL(15,6) DEFAULT 1,   -- qCom/qTrib
    
    -- Valores
    valor_unitario DECIMAL(15,10) DEFAULT 0,   -- vUnCom
    valor_unitario_trib DECIMAL(15,10),        -- vUnTrib
    
    -- Custos
    custo_medio DECIMAL(15,4) DEFAULT 0,
    custo_ultima_compra DECIMAL(15,4) DEFAULT 0,
    
    -- Estoque
    controla_estoque BOOLEAN DEFAULT TRUE,
    estoque_minimo DECIMAL(15,4) DEFAULT 0,
    estoque_maximo DECIMAL(15,4) DEFAULT 0,
    estoque_atual DECIMAL(15,4) DEFAULT 0,
    
    -- Origem (CST Origem)
    -- 0=Nacional, 1=Estrangeira Importação Direta, 2=Estrangeira Mercado Interno, etc
    origem SMALLINT DEFAULT 0,
    
    -- Características
    peso_liquido DECIMAL(15,4) DEFAULT 0,
    peso_bruto DECIMAL(15,4) DEFAULT 0,
    
    -- Tipo
    tipo_produto CHAR(1) DEFAULT 'M',  -- M=Mercadoria, S=Serviço, P=Produção
    tipo_item_sped VARCHAR(2) DEFAULT '00',  -- Tipo item SPED
    
    -- FCI (Ficha de Conteúdo de Importação)
    nfci VARCHAR(36),
    
    -- ANP (Combustíveis)
    codigo_anp INTEGER,
    descricao_anp VARCHAR(100),
    
    -- ANVISA (Medicamentos)
    codigo_anvisa VARCHAR(20),
    
    -- Imagem
    imagem_url TEXT,
    
    -- Controle
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(empresa_id, codigo)
);

CREATE INDEX idx_produtos_empresa ON tb_produtos(empresa_id);
CREATE INDEX idx_produtos_codigo ON tb_produtos(codigo);
CREATE INDEX idx_produtos_barras ON tb_produtos(codigo_barras);
CREATE INDEX idx_produtos_ncm ON tb_produtos(ncm);
CREATE INDEX idx_produtos_descricao ON tb_produtos USING gin(to_tsvector('portuguese', descricao));

-- Tributação por produto (ICMS, IPI, PIS, COFINS)
CREATE TABLE IF NOT EXISTS tb_produtos_tributacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produto_id UUID NOT NULL REFERENCES tb_produtos(id),
    estado_id INTEGER REFERENCES tb_estados(id),  -- NULL = regra geral
    
    -- CFOP
    cfop_venda_interna VARCHAR(4),
    cfop_venda_interestadual VARCHAR(4),
    cfop_devolucao VARCHAR(4),
    cfop_compra VARCHAR(4),
    
    -- ICMS
    cst_icms VARCHAR(3),
    csosn VARCHAR(3),               -- Para Simples Nacional
    aliquota_icms DECIMAL(5,2),
    reducao_bc_icms DECIMAL(5,2),
    aliquota_icms_st DECIMAL(5,2),
    mva_st DECIMAL(5,2),
    reducao_bc_icms_st DECIMAL(5,2),
    codigo_beneficio_fiscal VARCHAR(10),  -- cBenef
    
    -- IPI
    cst_ipi VARCHAR(2),
    aliquota_ipi DECIMAL(5,2),
    codigo_enquadramento_ipi VARCHAR(3),
    
    -- PIS
    cst_pis VARCHAR(2),
    aliquota_pis DECIMAL(6,4),
    
    -- COFINS
    cst_cofins VARCHAR(2),
    aliquota_cofins DECIMAL(6,4),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grupos/Categorias de Produtos
CREATE TABLE IF NOT EXISTS tb_produtos_categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    categoria_pai_id UUID REFERENCES tb_produtos_categorias(id),
    
    codigo VARCHAR(20),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_produtos_categoria_rel (
    produto_id UUID NOT NULL REFERENCES tb_produtos(id),
    categoria_id UUID NOT NULL REFERENCES tb_produtos_categorias(id),
    PRIMARY KEY (produto_id, categoria_id)
);

-- ----------------------------------------------------------------------------
-- 2.3 SERVIÇOS
-- Baseado em: ACBrNFSe
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    codigo VARCHAR(20) NOT NULL,
    descricao VARCHAR(200) NOT NULL,
    
    -- LC 116/2003
    codigo_servico_municipio VARCHAR(20),
    codigo_lista_servico VARCHAR(5),       -- Item da LC 116
    cnae VARCHAR(10),
    
    -- Tributação
    aliquota_iss DECIMAL(5,2),
    
    -- Retenções
    reter_iss BOOLEAN DEFAULT FALSE,
    reter_pis BOOLEAN DEFAULT FALSE,
    reter_cofins BOOLEAN DEFAULT FALSE,
    reter_csll BOOLEAN DEFAULT FALSE,
    reter_irrf BOOLEAN DEFAULT FALSE,
    reter_inss BOOLEAN DEFAULT FALSE,
    
    -- Valores padrão
    valor_unitario DECIMAL(15,4) DEFAULT 0,
    
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(empresa_id, codigo)
);

-- ----------------------------------------------------------------------------
-- 2.4 TABELAS AUXILIARES FISCAIS
-- ----------------------------------------------------------------------------

-- NCM
CREATE TABLE IF NOT EXISTS tb_ncm (
    codigo VARCHAR(8) PRIMARY KEY,
    descricao TEXT NOT NULL,
    unidade_tributavel VARCHAR(6),
    aliquota_nacional DECIMAL(5,2),
    aliquota_importacao DECIMAL(5,2),
    ex_tipi VARCHAR(3),
    ativo BOOLEAN DEFAULT TRUE,
    vigencia_inicio DATE,
    vigencia_fim DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CEST
CREATE TABLE IF NOT EXISTS tb_cest (
    codigo VARCHAR(7) PRIMARY KEY,
    ncm VARCHAR(8),
    descricao TEXT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CFOP
CREATE TABLE IF NOT EXISTS tb_cfop (
    codigo VARCHAR(4) PRIMARY KEY,
    descricao TEXT NOT NULL,
    tipo CHAR(1),  -- E=Entrada, S=Saída
    gera_credito BOOLEAN DEFAULT FALSE,
    gera_debito BOOLEAN DEFAULT FALSE,
    movimenta_estoque BOOLEAN DEFAULT TRUE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Natureza de Operação
CREATE TABLE IF NOT EXISTS tb_natureza_operacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    codigo VARCHAR(10) NOT NULL,
    descricao VARCHAR(100) NOT NULL,
    
    cfop_padrao_interno VARCHAR(4),
    cfop_padrao_interestadual VARCHAR(4),
    cfop_padrao_exterior VARCHAR(4),
    
    tipo CHAR(1),  -- E=Entrada, S=Saída
    
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(empresa_id, codigo)
);

-- ============================================================================
-- PARTE 3: MÓDULO FISCAL (NF-e, NFC-e, CT-e, NFS-e)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 DOCUMENTOS FISCAIS ELETRÔNICOS
-- Baseado em: ACBrNFe.TNFe, ACBrNFe.TIde
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_documentos_fiscais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    filial_id UUID REFERENCES tb_filiais(id),
    
    -- Tipo de Documento
    tipo_documento VARCHAR(10) NOT NULL,  -- NFE, NFCE, CTE, MDFE, NFSE, SAT
    
    -- Identificação (Ide)
    codigo_uf SMALLINT NOT NULL,          -- cUF
    codigo_aleatorio INTEGER,              -- cNF (8 dígitos)
    natureza_operacao VARCHAR(60),         -- natOp
    modelo SMALLINT NOT NULL,              -- mod (55=NFe, 65=NFCe, 57=CTe, 58=MDFe)
    serie INTEGER NOT NULL,                -- serie
    numero INTEGER NOT NULL,               -- nNF
    data_emissao TIMESTAMP NOT NULL,       -- dhEmi
    data_saida_entrada TIMESTAMP,          -- dhSaiEnt
    
    -- Tipo e Finalidade
    tipo_operacao SMALLINT,               -- tpNF (0=Entrada, 1=Saída)
    destino_operacao SMALLINT,            -- idDest (1=Interna, 2=Interestadual, 3=Exterior)
    tipo_impressao SMALLINT,              -- tpImp
    tipo_emissao SMALLINT DEFAULT 1,      -- tpEmis (1=Normal, 2=Contingência, etc)
    finalidade SMALLINT DEFAULT 1,        -- finNFe (1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução)
    consumidor_final SMALLINT DEFAULT 1,  -- indFinal (0=Não, 1=Sim)
    presenca_comprador SMALLINT,          -- indPres
    
    -- Processo
    processo_emissao SMALLINT DEFAULT 0,  -- procEmi
    versao_processo VARCHAR(20),          -- verProc
    
    -- Chave e Protocolo
    chave_acesso VARCHAR(44) UNIQUE,      -- Chave NFe/CTe/MDFe
    digito_verificador SMALLINT,          -- cDV
    protocolo_autorizacao VARCHAR(20),
    data_autorizacao TIMESTAMP,
    
    -- Situação
    situacao VARCHAR(20) DEFAULT 'DIGITACAO',  -- DIGITACAO, PENDENTE, AUTORIZADA, CANCELADA, DENEGADA, INUTILIZADA
    
    -- Destinatário
    destinatario_id UUID REFERENCES tb_pessoas(id),
    
    -- Valores Totais
    valor_produtos DECIMAL(15,2) DEFAULT 0,      -- vProd
    valor_frete DECIMAL(15,2) DEFAULT 0,         -- vFrete
    valor_seguro DECIMAL(15,2) DEFAULT 0,        -- vSeg
    valor_desconto DECIMAL(15,2) DEFAULT 0,      -- vDesc
    valor_outras_despesas DECIMAL(15,2) DEFAULT 0, -- vOutro
    
    -- Impostos Totais
    valor_total_icms_base DECIMAL(15,2) DEFAULT 0,   -- vBC
    valor_total_icms DECIMAL(15,2) DEFAULT 0,        -- vICMS
    valor_total_icms_deson DECIMAL(15,2) DEFAULT 0,  -- vICMSDeson
    valor_total_fcp DECIMAL(15,2) DEFAULT 0,         -- vFCP
    valor_total_icms_st_base DECIMAL(15,2) DEFAULT 0,-- vBCST
    valor_total_icms_st DECIMAL(15,2) DEFAULT 0,     -- vST
    valor_total_fcp_st DECIMAL(15,2) DEFAULT 0,      -- vFCPST
    valor_total_ipi DECIMAL(15,2) DEFAULT 0,         -- vIPI
    valor_total_pis DECIMAL(15,2) DEFAULT 0,         -- vPIS
    valor_total_cofins DECIMAL(15,2) DEFAULT 0,      -- vCOFINS
    valor_total_ii DECIMAL(15,2) DEFAULT 0,          -- vII
    
    -- Total da NF
    valor_total_nota DECIMAL(15,2) DEFAULT 0,       -- vNF
    valor_total_tributos DECIMAL(15,2) DEFAULT 0,   -- vTotTrib (Lei da Transparência)
    
    -- Transporte
    modalidade_frete SMALLINT DEFAULT 9,  -- modFrete (0=Emit, 1=Dest, 2=Terceiros, 9=Sem Frete)
    transportadora_id UUID REFERENCES tb_pessoas(id),
    
    -- Informações Adicionais
    info_complementar TEXT,               -- infCpl
    info_fisco TEXT,                      -- infAdFisco
    
    -- XML
    xml_envio TEXT,
    xml_retorno TEXT,
    xml_cancelamento TEXT,
    
    -- Referências
    pedido_id UUID,                       -- Referência ao pedido de venda
    nfe_referenciada VARCHAR(44),         -- Chave NFe referenciada
    
    -- Controle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_docs_fiscais_empresa ON tb_documentos_fiscais(empresa_id);
CREATE INDEX idx_docs_fiscais_chave ON tb_documentos_fiscais(chave_acesso);
CREATE INDEX idx_docs_fiscais_numero ON tb_documentos_fiscais(numero, serie, modelo);
CREATE INDEX idx_docs_fiscais_data ON tb_documentos_fiscais(data_emissao);
CREATE INDEX idx_docs_fiscais_situacao ON tb_documentos_fiscais(situacao);
CREATE INDEX idx_docs_fiscais_destinatario ON tb_documentos_fiscais(destinatario_id);

-- ----------------------------------------------------------------------------
-- 3.2 ITENS DO DOCUMENTO FISCAL
-- Baseado em: ACBrNFe.TDetCollectionItem, TProd
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_documentos_fiscais_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    documento_id UUID NOT NULL REFERENCES tb_documentos_fiscais(id) ON DELETE CASCADE,
    
    numero_item INTEGER NOT NULL,          -- nItem
    
    -- Produto
    produto_id UUID REFERENCES tb_produtos(id),
    codigo_produto VARCHAR(60),            -- cProd
    codigo_barras VARCHAR(14),             -- cEAN
    descricao VARCHAR(120) NOT NULL,       -- xProd
    ncm VARCHAR(8),                        -- NCM
    cest VARCHAR(7),                       -- CEST
    cfop VARCHAR(4) NOT NULL,              -- CFOP
    
    -- Quantidades e Valores
    unidade VARCHAR(6) NOT NULL,           -- uCom
    quantidade DECIMAL(15,4) NOT NULL,     -- qCom
    valor_unitario DECIMAL(15,10) NOT NULL, -- vUnCom
    valor_total DECIMAL(15,2) NOT NULL,    -- vProd
    
    -- Tributável (se diferente)
    unidade_tributavel VARCHAR(6),         -- uTrib
    quantidade_tributavel DECIMAL(15,4),   -- qTrib
    valor_unitario_tributavel DECIMAL(15,10), -- vUnTrib
    
    -- Descontos e Acréscimos
    valor_frete DECIMAL(15,2) DEFAULT 0,   -- vFrete
    valor_seguro DECIMAL(15,2) DEFAULT 0,  -- vSeg
    valor_desconto DECIMAL(15,2) DEFAULT 0, -- vDesc
    valor_outras DECIMAL(15,2) DEFAULT 0,  -- vOutro
    
    -- Indica se compõe valor total
    ind_total SMALLINT DEFAULT 1,          -- indTot (0=Não, 1=Sim)
    
    -- Pedido
    numero_pedido VARCHAR(15),             -- xPed
    item_pedido INTEGER,                   -- nItemPed
    
    -- Informações Adicionais
    info_adicional TEXT,                   -- infAdProd
    
    -- Rastreabilidade
    numero_lote VARCHAR(20),               -- nLote
    quantidade_lote DECIMAL(15,4),         -- qLote
    data_fabricacao DATE,                  -- dFab
    data_validade DATE,                    -- dVal
    codigo_agregacao VARCHAR(20),          -- cAgreg
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(documento_id, numero_item)
);

-- ----------------------------------------------------------------------------
-- 3.3 IMPOSTOS DOS ITENS
-- Baseado em: ACBrNFe.TImposto, TICMS, TIPI, TPIS, TCOFINS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_documentos_fiscais_itens_impostos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES tb_documentos_fiscais_itens(id) ON DELETE CASCADE,
    
    -- ICMS
    icms_origem SMALLINT,                  -- orig
    icms_cst VARCHAR(3),                   -- CST ou CSOSN
    icms_modalidade_bc SMALLINT,           -- modBC
    icms_reducao_bc DECIMAL(5,2),          -- pRedBC
    icms_base_calculo DECIMAL(15,2),       -- vBC
    icms_aliquota DECIMAL(5,2),            -- pICMS
    icms_valor DECIMAL(15,2),              -- vICMS
    
    -- ICMS ST
    icms_st_modalidade_bc SMALLINT,        -- modBCST
    icms_st_mva DECIMAL(5,2),              -- pMVAST
    icms_st_reducao_bc DECIMAL(5,2),       -- pRedBCST
    icms_st_base_calculo DECIMAL(15,2),    -- vBCST
    icms_st_aliquota DECIMAL(5,2),         -- pICMSST
    icms_st_valor DECIMAL(15,2),           -- vICMSST
    
    -- ICMS Desonerado
    icms_valor_desonerado DECIMAL(15,2),   -- vICMSDeson
    icms_motivo_desoneracao SMALLINT,      -- motDesICMS
    
    -- FCP (Fundo Combate Pobreza)
    fcp_base_calculo DECIMAL(15,2),        -- vBCFCP
    fcp_aliquota DECIMAL(5,2),             -- pFCP
    fcp_valor DECIMAL(15,2),               -- vFCP
    
    -- ICMS Diferimento
    icms_diferido_perc DECIMAL(5,2),       -- pDif
    icms_diferido_valor DECIMAL(15,2),     -- vICMSDif
    
    -- Partilha ICMS UF Destino
    icms_uf_dest_base_calculo DECIMAL(15,2),  -- vBCUFDest
    icms_uf_dest_aliquota DECIMAL(5,2),       -- pICMSUFDest
    icms_uf_dest_valor DECIMAL(15,2),         -- vICMSUFDest
    icms_uf_remet_valor DECIMAL(15,2),        -- vICMSUFRemet
    
    -- IPI
    ipi_cst VARCHAR(2),                    -- CST
    ipi_classe_enquadramento VARCHAR(5),   -- clEnq
    ipi_codigo_enquadramento VARCHAR(3),   -- cEnq
    ipi_base_calculo DECIMAL(15,2),        -- vBC
    ipi_aliquota DECIMAL(5,2),             -- pIPI
    ipi_valor DECIMAL(15,2),               -- vIPI
    
    -- PIS
    pis_cst VARCHAR(2),                    -- CST
    pis_base_calculo DECIMAL(15,2),        -- vBC
    pis_aliquota DECIMAL(6,4),             -- pPIS
    pis_valor DECIMAL(15,2),               -- vPIS
    
    -- COFINS
    cofins_cst VARCHAR(2),                 -- CST
    cofins_base_calculo DECIMAL(15,2),     -- vBC
    cofins_aliquota DECIMAL(6,4),          -- pCOFINS
    cofins_valor DECIMAL(15,2),            -- vCOFINS
    
    -- II (Imposto de Importação)
    ii_base_calculo DECIMAL(15,2),         -- vBC
    ii_despesas_aduaneiras DECIMAL(15,2),  -- vDespAdu
    ii_valor DECIMAL(15,2),                -- vII
    ii_iof DECIMAL(15,2),                  -- vIOF
    
    -- ISSQN (Serviços)
    issqn_base_calculo DECIMAL(15,2),      -- vBC
    issqn_aliquota DECIMAL(5,2),           -- vAliq
    issqn_valor DECIMAL(15,2),             -- vISSQN
    issqn_municipio INTEGER,               -- cMunFG
    issqn_item_lista VARCHAR(5),           -- cListServ
    
    -- Valor aproximado tributos (Lei Transparência)
    valor_tributos_aprox DECIMAL(15,2),    -- vTotTrib
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3.4 FORMAS DE PAGAMENTO
-- Baseado em: ACBrNFe.TpagCollectionItem
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_documentos_fiscais_pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    documento_id UUID NOT NULL REFERENCES tb_documentos_fiscais(id) ON DELETE CASCADE,
    
    -- Indicador forma pagamento
    indicador_forma SMALLINT DEFAULT 0,    -- indPag (0=À Vista, 1=A Prazo, 2=Outros)
    
    -- Meio de Pagamento
    meio_pagamento VARCHAR(3) NOT NULL,    -- tPag
    -- 01=Dinheiro, 02=Cheque, 03=Cartão Crédito, 04=Cartão Débito,
    -- 05=Crédito Loja, 10=Vale Alimentação, 11=Vale Refeição,
    -- 12=Vale Presente, 13=Vale Combustível, 15=Boleto, 
    -- 16=Depósito, 17=PIX, 18=Transferência, 90=Sem Pagamento, 99=Outros
    
    valor DECIMAL(15,2) NOT NULL,          -- vPag
    
    -- Troco
    valor_troco DECIMAL(15,2),             -- vTroco
    
    -- Cartões
    tipo_integracao SMALLINT,              -- tpIntegra (1=Integrado TEF, 2=Não Integrado)
    cnpj_credenciadora VARCHAR(14),        -- CNPJ
    bandeira_operadora VARCHAR(2),         -- tBand
    autorizacao VARCHAR(20),               -- cAut
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3.5 DUPLICATAS/COBRANÇAS
-- Baseado em: ACBrNFe.TCobr, TDupCollectionItem
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_documentos_fiscais_duplicatas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    documento_id UUID NOT NULL REFERENCES tb_documentos_fiscais(id) ON DELETE CASCADE,
    
    numero VARCHAR(60),                    -- nDup
    data_vencimento DATE,                  -- dVenc
    valor DECIMAL(15,2),                   -- vDup
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3.6 TRANSPORTE
-- Baseado em: ACBrNFe.TTransp
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_documentos_fiscais_transporte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    documento_id UUID NOT NULL REFERENCES tb_documentos_fiscais(id) ON DELETE CASCADE,
    
    -- Transportadora
    transportadora_id UUID REFERENCES tb_pessoas(id),
    cnpj_cpf VARCHAR(14),
    nome VARCHAR(60),
    inscricao_estadual VARCHAR(20),
    endereco VARCHAR(100),
    municipio VARCHAR(60),
    uf VARCHAR(2),
    
    -- Veículo
    veiculo_placa VARCHAR(7),
    veiculo_uf VARCHAR(2),
    veiculo_rntc VARCHAR(20),
    
    -- Reboque
    reboque_placa VARCHAR(7),
    reboque_uf VARCHAR(2),
    reboque_rntc VARCHAR(20),
    
    -- Volumes
    quantidade_volumes INTEGER,            -- qVol
    especie VARCHAR(60),                   -- esp
    marca VARCHAR(60),                     -- marca
    numeracao VARCHAR(60),                 -- nVol
    peso_liquido DECIMAL(15,3),            -- pesoL
    peso_bruto DECIMAL(15,3),              -- pesoB
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3.7 EVENTOS (Cancelamento, Carta Correção, etc)
-- Baseado em: ACBrNFe Eventos
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_documentos_fiscais_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    documento_id UUID NOT NULL REFERENCES tb_documentos_fiscais(id),
    
    tipo_evento VARCHAR(10) NOT NULL,      -- 110111=Cancelamento, 110110=CCe
    sequencia INTEGER DEFAULT 1,           -- nSeqEvento
    
    data_evento TIMESTAMP NOT NULL,
    protocolo VARCHAR(20),
    
    justificativa TEXT,                    -- xJust (cancelamento)
    correcao TEXT,                         -- xCorrecao (CCe)
    
    xml_evento TEXT,
    xml_retorno TEXT,
    
    situacao VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3.8 INUTILIZAÇÃO
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_documentos_fiscais_inutilizacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    modelo SMALLINT NOT NULL,
    serie INTEGER NOT NULL,
    numero_inicial INTEGER NOT NULL,
    numero_final INTEGER NOT NULL,
    
    justificativa TEXT NOT NULL,
    
    protocolo VARCHAR(20),
    data_inutilizacao TIMESTAMP,
    
    xml_envio TEXT,
    xml_retorno TEXT,
    
    situacao VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PARTE 4: MÓDULO FINANCEIRO
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 BANCOS
-- Baseado em: ACBrBoleto tipos de cobrança
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_bancos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(5) NOT NULL UNIQUE,     -- Código FEBRABAN
    nome VARCHAR(100) NOT NULL,
    website VARCHAR(100),
    
    -- Configurações padrão para boleto
    digitos_agencia INTEGER DEFAULT 4,
    digitos_conta INTEGER DEFAULT 8,
    digitos_nosso_numero INTEGER DEFAULT 11,
    
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4.2 CONTAS BANCÁRIAS DA EMPRESA
-- Baseado em: ACBrBoleto.TACBrCedente
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_contas_bancarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    banco_id INTEGER REFERENCES tb_bancos(id),
    banco_codigo VARCHAR(5),
    banco_nome VARCHAR(100),
    
    agencia VARCHAR(10) NOT NULL,
    agencia_digito VARCHAR(2),
    conta VARCHAR(15) NOT NULL,
    conta_digito VARCHAR(2),
    tipo_conta VARCHAR(20) DEFAULT 'corrente',  -- corrente, poupanca
    
    -- Dados para Cobrança (Boleto)
    convenio VARCHAR(20),                  -- Código do convênio
    carteira VARCHAR(5),                   -- Carteira de cobrança
    variacao_carteira VARCHAR(5),
    modalidade VARCHAR(5),
    codigo_cedente VARCHAR(20),            -- Código do cedente no banco
    codigo_transmissao VARCHAR(20),
    
    -- Configurações de Boleto
    local_pagamento VARCHAR(100),
    aceite CHAR(1) DEFAULT 'N',
    especie_doc VARCHAR(3) DEFAULT 'DM',   -- DM, NP, NS, RC, etc
    
    -- Instruções padrão
    instrucao1 VARCHAR(100),
    instrucao2 VARCHAR(100),
    dias_protesto INTEGER DEFAULT 0,
    dias_baixa INTEGER DEFAULT 60,
    
    -- WebService Boleto (APIs)
    ws_client_id VARCHAR(100),
    ws_client_secret_encrypted TEXT,
    ws_ambiente SMALLINT DEFAULT 2,        -- 1=Produção, 2=Homologação
    
    -- PIX
    chave_pix VARCHAR(100),
    tipo_chave_pix VARCHAR(20),
    
    -- Controle
    descricao VARCHAR(100),
    padrao BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4.3 FORMAS DE PAGAMENTO
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_formas_pagamento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    codigo VARCHAR(10) NOT NULL,
    descricao VARCHAR(50) NOT NULL,
    
    -- Tipo conforme NF-e
    codigo_nfe VARCHAR(3),                 -- tPag
    
    -- Configurações
    gera_financeiro BOOLEAN DEFAULT TRUE,
    conta_bancaria_id UUID REFERENCES tb_contas_bancarias(id),
    
    -- TEF
    usa_tef BOOLEAN DEFAULT FALSE,
    tipo_cartao VARCHAR(20),               -- credito, debito, voucher
    
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4.4 CONDIÇÕES DE PAGAMENTO
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_condicoes_pagamento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    codigo VARCHAR(10) NOT NULL,
    descricao VARCHAR(50) NOT NULL,
    
    -- Configuração de parcelas
    numero_parcelas INTEGER DEFAULT 1,
    dias_primeira_parcela INTEGER DEFAULT 0,
    intervalo_dias INTEGER DEFAULT 30,
    
    -- Taxas
    percentual_entrada DECIMAL(5,2) DEFAULT 0,
    percentual_juros DECIMAL(5,4) DEFAULT 0,
    percentual_desconto DECIMAL(5,2) DEFAULT 0,
    
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(empresa_id, codigo)
);

-- Parcelas da condição
CREATE TABLE IF NOT EXISTS tb_condicoes_pagamento_parcelas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condicao_id UUID NOT NULL REFERENCES tb_condicoes_pagamento(id) ON DELETE CASCADE,
    
    numero_parcela INTEGER NOT NULL,
    dias INTEGER NOT NULL,
    percentual DECIMAL(5,2) NOT NULL,
    
    UNIQUE(condicao_id, numero_parcela)
);

-- ----------------------------------------------------------------------------
-- 4.5 CONTAS A RECEBER
-- Baseado em: ACBrBoleto.TACBrTitulo
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_contas_receber (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    -- Identificação
    numero_documento VARCHAR(20) NOT NULL,
    seu_numero VARCHAR(20),                -- Controle interno
    nosso_numero VARCHAR(20),              -- Nosso número do boleto
    nosso_numero_formatado VARCHAR(30),
    
    -- Pessoa
    pessoa_id UUID REFERENCES tb_pessoas(id),
    
    -- Origem
    documento_fiscal_id UUID REFERENCES tb_documentos_fiscais(id),
    pedido_id UUID,
    contrato_id UUID,
    
    -- Parcela
    parcela INTEGER DEFAULT 1,
    total_parcelas INTEGER DEFAULT 1,
    
    -- Datas
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    data_credito DATE,
    
    -- Valores
    valor_original DECIMAL(15,2) NOT NULL,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_juros DECIMAL(15,2) DEFAULT 0,
    valor_multa DECIMAL(15,2) DEFAULT 0,
    valor_abatimento DECIMAL(15,2) DEFAULT 0,
    valor_pago DECIMAL(15,2) DEFAULT 0,
    valor_liquido DECIMAL(15,2) DEFAULT 0,
    
    -- Descontos programados
    tipo_desconto SMALLINT DEFAULT 0,
    valor_desconto1 DECIMAL(15,2) DEFAULT 0,
    data_desconto1 DATE,
    valor_desconto2 DECIMAL(15,2) DEFAULT 0,
    data_desconto2 DATE,
    valor_desconto3 DECIMAL(15,2) DEFAULT 0,
    data_desconto3 DATE,
    
    -- Juros e Multa
    tipo_juros SMALLINT DEFAULT 0,         -- 0=Isento, 1=Valor dia, 2=Taxa mensal, 3=Taxa diária
    valor_juros_dia DECIMAL(15,4) DEFAULT 0,
    tipo_multa SMALLINT DEFAULT 0,         -- 0=Não tem, 1=Valor fixo, 2=Percentual
    percentual_multa DECIMAL(5,2) DEFAULT 0,
    data_limite_desconto DATE,
    
    -- Protesto
    protestar BOOLEAN DEFAULT FALSE,
    dias_protesto INTEGER DEFAULT 0,
    tipo_dias_protesto SMALLINT,           -- 1=Dias corridos, 2=Dias úteis
    
    -- Boleto
    conta_bancaria_id UUID REFERENCES tb_contas_bancarias(id),
    carteira VARCHAR(5),
    especie_doc VARCHAR(3),
    aceite CHAR(1) DEFAULT 'N',
    
    linha_digitavel VARCHAR(54),
    codigo_barras VARCHAR(44),
    codigo_barras_imagem TEXT,
    qrcode_pix TEXT,
    
    -- Remessa/Retorno
    remessa_enviada BOOLEAN DEFAULT FALSE,
    remessa_arquivo VARCHAR(100),
    remessa_data TIMESTAMP,
    retorno_arquivo VARCHAR(100),
    retorno_data TIMESTAMP,
    
    -- Situação
    situacao VARCHAR(20) DEFAULT 'ABERTO',  -- ABERTO, PAGO, PAGO_PARCIAL, CANCELADO, BAIXADO, PROTESTADO
    
    -- Observações
    observacoes TEXT,
    
    -- Controle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_contas_receber_empresa ON tb_contas_receber(empresa_id);
CREATE INDEX idx_contas_receber_pessoa ON tb_contas_receber(pessoa_id);
CREATE INDEX idx_contas_receber_vencimento ON tb_contas_receber(data_vencimento);
CREATE INDEX idx_contas_receber_situacao ON tb_contas_receber(situacao);
CREATE INDEX idx_contas_receber_nosso_numero ON tb_contas_receber(nosso_numero);

-- ----------------------------------------------------------------------------
-- 4.6 CONTAS A PAGAR
-- Baseado em: ACBrPagFor
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_contas_pagar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    -- Identificação
    numero_documento VARCHAR(20) NOT NULL,
    
    -- Fornecedor
    pessoa_id UUID REFERENCES tb_pessoas(id),
    
    -- Origem
    documento_fiscal_id UUID REFERENCES tb_documentos_fiscais(id),
    pedido_compra_id UUID,
    
    -- Parcela
    parcela INTEGER DEFAULT 1,
    total_parcelas INTEGER DEFAULT 1,
    
    -- Datas
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    
    -- Valores
    valor_original DECIMAL(15,2) NOT NULL,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_juros DECIMAL(15,2) DEFAULT 0,
    valor_multa DECIMAL(15,2) DEFAULT 0,
    valor_pago DECIMAL(15,2) DEFAULT 0,
    
    -- Pagamento
    forma_pagamento_id UUID REFERENCES tb_formas_pagamento(id),
    conta_bancaria_id UUID REFERENCES tb_contas_bancarias(id),
    
    -- Dados para pagamento bancário
    banco_favorecido VARCHAR(5),
    agencia_favorecido VARCHAR(10),
    conta_favorecido VARCHAR(15),
    tipo_conta_favorecido VARCHAR(20),
    cpf_cnpj_favorecido VARCHAR(14),
    nome_favorecido VARCHAR(100),
    
    -- PIX
    chave_pix VARCHAR(100),
    tipo_chave_pix VARCHAR(20),
    
    -- Código de Barras (contas de consumo)
    codigo_barras VARCHAR(48),
    
    -- Situação
    situacao VARCHAR(20) DEFAULT 'ABERTO',  -- ABERTO, PAGO, PAGO_PARCIAL, CANCELADO
    
    -- Observações
    observacoes TEXT,
    
    -- Controle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_contas_pagar_empresa ON tb_contas_pagar(empresa_id);
CREATE INDEX idx_contas_pagar_pessoa ON tb_contas_pagar(pessoa_id);
CREATE INDEX idx_contas_pagar_vencimento ON tb_contas_pagar(data_vencimento);
CREATE INDEX idx_contas_pagar_situacao ON tb_contas_pagar(situacao);

-- ----------------------------------------------------------------------------
-- 4.7 MOVIMENTAÇÕES BANCÁRIAS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_movimentacoes_bancarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    conta_bancaria_id UUID NOT NULL REFERENCES tb_contas_bancarias(id),
    
    tipo CHAR(1) NOT NULL,                 -- E=Entrada, S=Saída, T=Transferência
    
    data_movimento DATE NOT NULL,
    data_compensacao DATE,
    
    valor DECIMAL(15,2) NOT NULL,
    
    -- Origem
    conta_receber_id UUID REFERENCES tb_contas_receber(id),
    conta_pagar_id UUID REFERENCES tb_contas_pagar(id),
    
    -- Identificação
    numero_documento VARCHAR(50),
    historico VARCHAR(200),
    
    -- Conciliação
    conciliado BOOLEAN DEFAULT FALSE,
    data_conciliacao DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4.8 REMESSAS E RETORNOS BANCÁRIOS
-- Baseado em: ACBrBoleto Remessa/Retorno
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_remessas_bancarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    conta_bancaria_id UUID NOT NULL REFERENCES tb_contas_bancarias(id),
    
    tipo VARCHAR(20) NOT NULL,             -- BOLETO, PAGAMENTO
    layout VARCHAR(10) NOT NULL,           -- CNAB240, CNAB400
    
    numero_remessa INTEGER NOT NULL,
    data_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    nome_arquivo VARCHAR(100),
    conteudo_arquivo TEXT,
    
    quantidade_titulos INTEGER,
    valor_total DECIMAL(15,2),
    
    enviado BOOLEAN DEFAULT FALSE,
    data_envio TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_remessas_bancarias_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    remessa_id UUID NOT NULL REFERENCES tb_remessas_bancarias(id) ON DELETE CASCADE,
    conta_receber_id UUID REFERENCES tb_contas_receber(id),
    conta_pagar_id UUID REFERENCES tb_contas_pagar(id),
    
    sequencia INTEGER,
    situacao VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_retornos_bancarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    conta_bancaria_id UUID NOT NULL REFERENCES tb_contas_bancarias(id),
    
    tipo VARCHAR(20) NOT NULL,
    layout VARCHAR(10) NOT NULL,
    
    nome_arquivo VARCHAR(100),
    conteudo_arquivo TEXT,
    
    data_arquivo DATE,
    data_processamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    quantidade_titulos INTEGER,
    valor_total DECIMAL(15,2),
    
    processado BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_retornos_bancarios_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    retorno_id UUID NOT NULL REFERENCES tb_retornos_bancarios(id) ON DELETE CASCADE,
    conta_receber_id UUID REFERENCES tb_contas_receber(id),
    conta_pagar_id UUID REFERENCES tb_contas_pagar(id),
    
    sequencia INTEGER,
    nosso_numero VARCHAR(20),
    seu_numero VARCHAR(20),
    
    data_ocorrencia DATE,
    codigo_ocorrencia VARCHAR(5),
    descricao_ocorrencia VARCHAR(200),
    
    valor_titulo DECIMAL(15,2),
    valor_pago DECIMAL(15,2),
    valor_juros DECIMAL(15,2),
    valor_desconto DECIMAL(15,2),
    valor_abatimento DECIMAL(15,2),
    valor_tarifa DECIMAL(15,2),
    
    data_credito DATE,
    
    processado BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4.9 PIX
-- Baseado em: ACBrPIXCD
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_pix_transacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    conta_bancaria_id UUID REFERENCES tb_contas_bancarias(id),
    
    -- Identificação
    txid VARCHAR(35) UNIQUE,               -- ID da transação PIX
    end_to_end_id VARCHAR(32),             -- E2E ID
    
    -- Tipo
    tipo VARCHAR(20) NOT NULL,             -- COBRANCA, COBRANCA_VENCIMENTO, PAGAMENTO
    
    -- Cobrança (QR Code)
    location VARCHAR(200),                 -- URL location
    emv_qrcode TEXT,                       -- Payload EMV
    
    -- Valores
    valor_original DECIMAL(15,2) NOT NULL,
    valor_pago DECIMAL(15,2),
    
    -- Datas
    data_criacao TIMESTAMP,
    data_expiracao TIMESTAMP,
    data_pagamento TIMESTAMP,
    
    -- Pagador (quando recebimento)
    pagador_cpf_cnpj VARCHAR(14),
    pagador_nome VARCHAR(100),
    
    -- Recebedor (quando pagamento)
    recebedor_cpf_cnpj VARCHAR(14),
    recebedor_nome VARCHAR(100),
    recebedor_chave VARCHAR(100),
    
    -- Vínculo
    conta_receber_id UUID REFERENCES tb_contas_receber(id),
    conta_pagar_id UUID REFERENCES tb_contas_pagar(id),
    
    -- Status
    status VARCHAR(20),                    -- ATIVA, CONCLUIDA, REMOVIDA_PELO_USUARIO, REMOVIDA_PELO_PSP
    
    -- Devolução
    tem_devolucao BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_pix_devolucoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transacao_id UUID NOT NULL REFERENCES tb_pix_transacoes(id),
    
    id_devolucao VARCHAR(35),
    
    valor DECIMAL(15,2) NOT NULL,
    motivo TEXT,
    
    status VARCHAR(20),
    data_horario_solicitacao TIMESTAMP,
    data_horario_liquidacao TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4.10 TEF
-- Baseado em: ACBrTEFD
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_tef_transacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    -- Documento fiscal vinculado
    documento_fiscal_id UUID REFERENCES tb_documentos_fiscais(id),
    
    -- Tipo
    tipo_operacao VARCHAR(20) NOT NULL,    -- CREDITO, DEBITO, VOUCHER, PIX
    
    -- Valores
    valor DECIMAL(15,2) NOT NULL,
    valor_saque DECIMAL(15,2),
    
    -- Cartão
    bandeira VARCHAR(20),
    bin_cartao VARCHAR(6),
    ultimos_digitos VARCHAR(4),
    
    -- Autorização
    nsu VARCHAR(20),                       -- NSU TEF
    nsu_host VARCHAR(20),                  -- NSU Rede
    codigo_autorizacao VARCHAR(20),
    data_hora_transacao TIMESTAMP,
    
    -- Rede/Adquirente
    rede VARCHAR(50),
    cnpj_adquirente VARCHAR(14),
    
    -- Comprovantes
    comprovante_cliente TEXT,
    comprovante_estabelecimento TEXT,
    
    -- Status
    status VARCHAR(20),                    -- APROVADA, NEGADA, CANCELADA
    mensagem_retorno TEXT,
    
    -- Cancelamento
    cancelada BOOLEAN DEFAULT FALSE,
    data_cancelamento TIMESTAMP,
    nsu_cancelamento VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PARTE 5: MÓDULO ESTOQUE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1 LOCAIS DE ESTOQUE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_locais_estoque (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    codigo VARCHAR(20) NOT NULL,
    descricao VARCHAR(100) NOT NULL,
    
    tipo VARCHAR(20) DEFAULT 'DEPOSITO',   -- DEPOSITO, LOJA, TERCEIROS, TRANSITO
    
    endereco TEXT,
    responsavel VARCHAR(100),
    
    principal BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(empresa_id, codigo)
);

-- ----------------------------------------------------------------------------
-- 5.2 SALDOS DE ESTOQUE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_estoque_saldos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produto_id UUID NOT NULL REFERENCES tb_produtos(id),
    local_estoque_id UUID NOT NULL REFERENCES tb_locais_estoque(id),
    
    quantidade DECIMAL(15,4) DEFAULT 0,
    quantidade_reservada DECIMAL(15,4) DEFAULT 0,
    quantidade_disponivel DECIMAL(15,4) GENERATED ALWAYS AS (quantidade - quantidade_reservada) STORED,
    
    custo_medio DECIMAL(15,4) DEFAULT 0,
    custo_total DECIMAL(15,2) DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(produto_id, local_estoque_id)
);

-- ----------------------------------------------------------------------------
-- 5.3 MOVIMENTAÇÕES DE ESTOQUE
-- Baseado em: Movimentos derivados de NF-e entrada/saída
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_estoque_movimentacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    produto_id UUID NOT NULL REFERENCES tb_produtos(id),
    local_estoque_id UUID NOT NULL REFERENCES tb_locais_estoque(id),
    
    -- Tipo
    tipo CHAR(1) NOT NULL,                 -- E=Entrada, S=Saída
    natureza VARCHAR(30) NOT NULL,         -- COMPRA, VENDA, DEVOLUCAO, TRANSFERENCIA, AJUSTE, PRODUCAO, CONSUMO
    
    -- Documento origem
    documento_fiscal_id UUID REFERENCES tb_documentos_fiscais(id),
    documento_fiscal_item_id UUID,
    pedido_id UUID,
    
    -- Data
    data_movimento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Quantidades
    quantidade DECIMAL(15,4) NOT NULL,
    
    -- Custos
    custo_unitario DECIMAL(15,4) DEFAULT 0,
    custo_total DECIMAL(15,2) DEFAULT 0,
    
    -- Saldos (snapshot)
    saldo_anterior DECIMAL(15,4),
    saldo_posterior DECIMAL(15,4),
    custo_medio_anterior DECIMAL(15,4),
    custo_medio_posterior DECIMAL(15,4),
    
    -- Rastreabilidade (se aplicável)
    numero_lote VARCHAR(20),
    data_validade DATE,
    numero_serie VARCHAR(50),
    
    observacao TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_estoque_mov_produto ON tb_estoque_movimentacoes(produto_id);
CREATE INDEX idx_estoque_mov_data ON tb_estoque_movimentacoes(data_movimento);
CREATE INDEX idx_estoque_mov_documento ON tb_estoque_movimentacoes(documento_fiscal_id);

-- ----------------------------------------------------------------------------
-- 5.4 LOTES
-- Baseado em: ACBrNFe.TRastroCollectionItem
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_estoque_lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produto_id UUID NOT NULL REFERENCES tb_produtos(id),
    local_estoque_id UUID NOT NULL REFERENCES tb_locais_estoque(id),
    
    numero_lote VARCHAR(20) NOT NULL,
    data_fabricacao DATE,
    data_validade DATE,
    codigo_agregacao VARCHAR(20),          -- cAgreg
    
    quantidade DECIMAL(15,4) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(produto_id, local_estoque_id, numero_lote)
);

-- ----------------------------------------------------------------------------
-- 5.5 INVENTÁRIO
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_inventarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    local_estoque_id UUID NOT NULL REFERENCES tb_locais_estoque(id),
    
    codigo VARCHAR(20) NOT NULL,
    descricao VARCHAR(100),
    
    data_inicio DATE NOT NULL,
    data_conclusao DATE,
    
    tipo VARCHAR(20) DEFAULT 'COMPLETO',   -- COMPLETO, PARCIAL, CICLICO
    
    status VARCHAR(20) DEFAULT 'ABERTO',   -- ABERTO, EM_CONTAGEM, FINALIZADO, CANCELADO
    
    responsavel_id UUID REFERENCES tb_usuarios(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_inventarios_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventario_id UUID NOT NULL REFERENCES tb_inventarios(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES tb_produtos(id),
    
    quantidade_sistema DECIMAL(15,4),
    quantidade_contada DECIMAL(15,4),
    diferenca DECIMAL(15,4),
    
    custo_unitario DECIMAL(15,4),
    valor_diferenca DECIMAL(15,2),
    
    justificativa TEXT,
    
    contado_em TIMESTAMP,
    contado_por UUID REFERENCES tb_usuarios(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PARTE 6: MÓDULO VENDAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 6.1 PEDIDOS DE VENDA
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_pedidos_venda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    -- Identificação
    numero INTEGER NOT NULL,
    
    -- Cliente
    cliente_id UUID NOT NULL REFERENCES tb_pessoas(id),
    
    -- Vendedor
    vendedor_id UUID REFERENCES tb_pessoas(id),
    
    -- Datas
    data_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
    data_entrega_prevista DATE,
    data_entrega DATE,
    
    -- Valores
    valor_produtos DECIMAL(15,2) DEFAULT 0,
    valor_servicos DECIMAL(15,2) DEFAULT 0,
    valor_frete DECIMAL(15,2) DEFAULT 0,
    valor_seguro DECIMAL(15,2) DEFAULT 0,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_outras_despesas DECIMAL(15,2) DEFAULT 0,
    valor_total DECIMAL(15,2) DEFAULT 0,
    
    -- Pagamento
    condicao_pagamento_id UUID REFERENCES tb_condicoes_pagamento(id),
    forma_pagamento_id UUID REFERENCES tb_formas_pagamento(id),
    
    -- Transporte
    modalidade_frete SMALLINT DEFAULT 9,
    transportadora_id UUID REFERENCES tb_pessoas(id),
    
    -- Situação
    situacao VARCHAR(20) DEFAULT 'ORCAMENTO',  -- ORCAMENTO, PENDENTE, APROVADO, EM_SEPARACAO, FATURADO, ENTREGUE, CANCELADO
    
    -- Documentos gerados
    documento_fiscal_id UUID REFERENCES tb_documentos_fiscais(id),
    
    -- Observações
    observacoes TEXT,
    observacoes_internas TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_pedidos_venda_empresa ON tb_pedidos_venda(empresa_id);
CREATE INDEX idx_pedidos_venda_cliente ON tb_pedidos_venda(cliente_id);
CREATE INDEX idx_pedidos_venda_data ON tb_pedidos_venda(data_pedido);
CREATE INDEX idx_pedidos_venda_situacao ON tb_pedidos_venda(situacao);

CREATE TABLE IF NOT EXISTS tb_pedidos_venda_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES tb_pedidos_venda(id) ON DELETE CASCADE,
    
    sequencia INTEGER NOT NULL,
    
    -- Produto/Serviço
    produto_id UUID REFERENCES tb_produtos(id),
    servico_id UUID REFERENCES tb_servicos(id),
    
    codigo VARCHAR(60),
    descricao VARCHAR(200) NOT NULL,
    
    -- Quantidades
    unidade VARCHAR(6) NOT NULL,
    quantidade DECIMAL(15,4) NOT NULL,
    quantidade_entregue DECIMAL(15,4) DEFAULT 0,
    quantidade_faturada DECIMAL(15,4) DEFAULT 0,
    quantidade_cancelada DECIMAL(15,4) DEFAULT 0,
    
    -- Valores
    valor_unitario DECIMAL(15,4) NOT NULL,
    percentual_desconto DECIMAL(5,2) DEFAULT 0,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_total DECIMAL(15,2) NOT NULL,
    
    -- Situação do item
    situacao VARCHAR(20) DEFAULT 'PENDENTE',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6.2 TABELAS DE PREÇO
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_tabelas_preco (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    codigo VARCHAR(20) NOT NULL,
    descricao VARCHAR(100) NOT NULL,
    
    -- Vigência
    data_inicio DATE,
    data_fim DATE,
    
    -- Regras
    tipo_ajuste VARCHAR(20),               -- PERCENTUAL, VALOR
    percentual_ajuste DECIMAL(5,2) DEFAULT 0,
    
    -- Prioridade (menor = mais prioritário)
    prioridade INTEGER DEFAULT 100,
    
    padrao BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS tb_tabelas_preco_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tabela_id UUID NOT NULL REFERENCES tb_tabelas_preco(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES tb_produtos(id),
    
    preco DECIMAL(15,4) NOT NULL,
    
    -- Quantidade mínima para este preço
    quantidade_minima DECIMAL(15,4) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tabela_id, produto_id, quantidade_minima)
);

-- ============================================================================
-- PARTE 7: MÓDULO COMPRAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 7.1 PEDIDOS DE COMPRA
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_pedidos_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    numero INTEGER NOT NULL,
    
    -- Fornecedor
    fornecedor_id UUID NOT NULL REFERENCES tb_pessoas(id),
    
    -- Comprador
    comprador_id UUID REFERENCES tb_usuarios(id),
    
    -- Datas
    data_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
    data_entrega_prevista DATE,
    data_entrega DATE,
    
    -- Valores
    valor_produtos DECIMAL(15,2) DEFAULT 0,
    valor_frete DECIMAL(15,2) DEFAULT 0,
    valor_seguro DECIMAL(15,2) DEFAULT 0,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_outras_despesas DECIMAL(15,2) DEFAULT 0,
    valor_ipi DECIMAL(15,2) DEFAULT 0,
    valor_icms_st DECIMAL(15,2) DEFAULT 0,
    valor_total DECIMAL(15,2) DEFAULT 0,
    
    -- Pagamento
    condicao_pagamento_id UUID REFERENCES tb_condicoes_pagamento(id),
    
    -- Situação
    situacao VARCHAR(20) DEFAULT 'COTACAO',  -- COTACAO, ENVIADO, CONFIRMADO, RECEBIDO_PARCIAL, RECEBIDO, CANCELADO
    
    -- Observações
    observacoes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_pedidos_compra_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES tb_pedidos_compra(id) ON DELETE CASCADE,
    
    sequencia INTEGER NOT NULL,
    
    produto_id UUID REFERENCES tb_produtos(id),
    
    codigo_fornecedor VARCHAR(60),
    descricao VARCHAR(200) NOT NULL,
    
    unidade VARCHAR(6) NOT NULL,
    quantidade DECIMAL(15,4) NOT NULL,
    quantidade_recebida DECIMAL(15,4) DEFAULT 0,
    
    valor_unitario DECIMAL(15,4) NOT NULL,
    percentual_desconto DECIMAL(5,2) DEFAULT 0,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_ipi DECIMAL(15,2) DEFAULT 0,
    valor_icms_st DECIMAL(15,2) DEFAULT 0,
    valor_total DECIMAL(15,2) NOT NULL,
    
    situacao VARCHAR(20) DEFAULT 'PENDENTE',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PARTE 8: MÓDULO TRANSPORTE (CT-e, MDF-e)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 8.1 CT-e (Conhecimento de Transporte Eletrônico)
-- Baseado em: ACBrCTe
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_cte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    -- Identificação
    modelo SMALLINT DEFAULT 57,            -- mod
    serie INTEGER NOT NULL,
    numero INTEGER NOT NULL,
    data_emissao TIMESTAMP NOT NULL,
    
    -- Chave e protocolo
    chave_acesso VARCHAR(44) UNIQUE,
    protocolo_autorizacao VARCHAR(20),
    data_autorizacao TIMESTAMP,
    
    -- Tipo
    tipo_cte SMALLINT,                     -- tpCTe (0=Normal, 1=Complemento, 2=Anulação, 3=Substituto)
    tipo_servico SMALLINT,                 -- tpServ (0=Normal, 1=Subcontratação, 2=Redespacho, etc)
    modal SMALLINT,                        -- modal (01=Rodoviário, 02=Aéreo, 03=Aquaviário, etc)
    
    -- CFOP
    cfop VARCHAR(4) NOT NULL,
    natureza_operacao VARCHAR(60),
    
    -- Emitente (transportadora = a empresa)
    
    -- Remetente
    remetente_id UUID REFERENCES tb_pessoas(id),
    
    -- Destinatário
    destinatario_id UUID REFERENCES tb_pessoas(id),
    
    -- Expedidor
    expedidor_id UUID REFERENCES tb_pessoas(id),
    
    -- Recebedor
    recebedor_id UUID REFERENCES tb_pessoas(id),
    
    -- Tomador do serviço
    tomador_tipo SMALLINT,                 -- toma (0=Remetente, 1=Expedidor, 2=Recebedor, 3=Destinatário, 4=Outros)
    tomador_id UUID REFERENCES tb_pessoas(id),
    
    -- Origem e Destino
    municipio_origem_id INTEGER REFERENCES tb_municipios(id),
    municipio_destino_id INTEGER REFERENCES tb_municipios(id),
    
    -- Valores
    valor_total_servico DECIMAL(15,2),     -- vTPrest
    valor_receber DECIMAL(15,2),           -- vRec
    
    -- Carga
    valor_carga DECIMAL(15,2),             -- vCarga
    produto_predominante VARCHAR(60),      -- proPred
    peso_bruto DECIMAL(15,3),
    cubagem DECIMAL(15,3),
    
    -- Impostos
    icms_situacao_tributaria VARCHAR(3),
    icms_base_calculo DECIMAL(15,2),
    icms_aliquota DECIMAL(5,2),
    icms_valor DECIMAL(15,2),
    
    -- Situação
    situacao VARCHAR(20) DEFAULT 'DIGITACAO',
    
    -- XML
    xml_envio TEXT,
    xml_retorno TEXT,
    xml_cancelamento TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Documentos vinculados ao CT-e (NF-es transportadas)
CREATE TABLE IF NOT EXISTS tb_cte_documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cte_id UUID NOT NULL REFERENCES tb_cte(id) ON DELETE CASCADE,
    
    tipo_documento VARCHAR(10),            -- NFE, NFCE, OUTROS
    chave_nfe VARCHAR(44),
    
    -- Se não tiver chave
    cnpj_emitente VARCHAR(14),
    serie INTEGER,
    numero INTEGER,
    data_emissao DATE,
    valor DECIMAL(15,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 8.2 MDF-e (Manifesto de Documentos Fiscais Eletrônico)
-- Baseado em: ACBrMDFe
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_mdfe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    -- Identificação
    modelo SMALLINT DEFAULT 58,
    serie INTEGER NOT NULL,
    numero INTEGER NOT NULL,
    data_emissao TIMESTAMP NOT NULL,
    
    -- Chave e protocolo
    chave_acesso VARCHAR(44) UNIQUE,
    protocolo_autorizacao VARCHAR(20),
    data_autorizacao TIMESTAMP,
    
    -- Tipo
    tipo_emitente SMALLINT,                -- tpEmit (1=Prestador Serv. Transporte, 2=Transp. Carga Própria, 3=Prestador Serv. Transp. CTRC)
    tipo_transportador SMALLINT,           -- tpTransp
    modal SMALLINT NOT NULL,               -- modal (1=Rodoviário, 2=Aéreo, 3=Aquaviário, 4=Ferroviário)
    
    -- UF percurso
    uf_inicio VARCHAR(2) NOT NULL,
    uf_fim VARCHAR(2) NOT NULL,
    
    -- Informações de carregamento
    municipio_carregamento_id INTEGER REFERENCES tb_municipios(id),
    
    -- Informações de descarregamento
    municipio_descarregamento_id INTEGER REFERENCES tb_municipios(id),
    
    -- Totais
    quantidade_cte INTEGER DEFAULT 0,
    quantidade_nfe INTEGER DEFAULT 0,
    valor_total_carga DECIMAL(15,2),
    peso_total_carga DECIMAL(15,3),
    
    -- Veículo (modal rodoviário)
    veiculo_placa VARCHAR(7),
    veiculo_uf VARCHAR(2),
    veiculo_rntrc VARCHAR(20),
    veiculo_tara DECIMAL(15,3),
    veiculo_capacidade_kg DECIMAL(15,3),
    veiculo_capacidade_m3 DECIMAL(15,3),
    
    -- Condutor
    condutor_cpf VARCHAR(11),
    condutor_nome VARCHAR(60),
    
    -- Situação
    situacao VARCHAR(20) DEFAULT 'DIGITACAO',
    
    -- Encerramento
    encerrado BOOLEAN DEFAULT FALSE,
    data_encerramento TIMESTAMP,
    protocolo_encerramento VARCHAR(20),
    
    -- XML
    xml_envio TEXT,
    xml_retorno TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Documentos vinculados ao MDF-e
CREATE TABLE IF NOT EXISTS tb_mdfe_documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mdfe_id UUID NOT NULL REFERENCES tb_mdfe(id) ON DELETE CASCADE,
    
    municipio_descarregamento_id INTEGER REFERENCES tb_municipios(id),
    
    tipo_documento VARCHAR(10),            -- NFE, CTE
    chave_documento VARCHAR(44),
    segundo_codigo_barras VARCHAR(36),     -- Segundo código de barras (se houver)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Percurso
CREATE TABLE IF NOT EXISTS tb_mdfe_percurso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mdfe_id UUID NOT NULL REFERENCES tb_mdfe(id) ON DELETE CASCADE,
    
    sequencia INTEGER NOT NULL,
    uf VARCHAR(2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PARTE 9: MÓDULO RH / ESOCIAL
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 9.1 FUNCIONÁRIOS
-- Baseado em: ACBreSocial - S-2200, S-2300
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_funcionarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    pessoa_id UUID NOT NULL REFERENCES tb_pessoas(id),
    
    -- Matrícula
    matricula VARCHAR(30) NOT NULL,
    
    -- Contrato
    data_admissao DATE NOT NULL,
    data_demissao DATE,
    tipo_contrato SMALLINT,                -- 1=Prazo Indeterminado, 2=Prazo Determinado
    
    -- Cargo/Função
    cargo VARCHAR(100),
    cbo VARCHAR(6),                        -- CBO
    
    -- Jornada
    tipo_jornada SMALLINT,
    carga_horaria_semanal DECIMAL(5,2),
    
    -- Remuneração
    salario DECIMAL(15,2),
    
    -- Categoria eSocial
    categoria_trabalhador SMALLINT,        -- Código categoria eSocial
    
    -- CTPS
    ctps_numero VARCHAR(20),
    ctps_serie VARCHAR(10),
    ctps_uf VARCHAR(2),
    
    -- PIS/PASEP
    pis_pasep VARCHAR(15),
    
    -- Banco
    banco_codigo VARCHAR(5),
    agencia VARCHAR(10),
    conta VARCHAR(15),
    tipo_conta VARCHAR(20),
    
    -- Departamento
    departamento VARCHAR(50),
    centro_custo VARCHAR(20),
    
    -- Situação
    situacao VARCHAR(20) DEFAULT 'ATIVO',  -- ATIVO, AFASTADO, FERIAS, DEMITIDO
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(empresa_id, matricula)
);

-- ----------------------------------------------------------------------------
-- 9.2 DEPENDENTES
-- Baseado em: ACBreSocial
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_funcionarios_dependentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcionario_id UUID NOT NULL REFERENCES tb_funcionarios(id) ON DELETE CASCADE,
    
    cpf VARCHAR(11),
    nome VARCHAR(100) NOT NULL,
    data_nascimento DATE,
    
    tipo_dependente SMALLINT,              -- Código tipo dependente eSocial
    
    -- Para IRRF
    deduz_irrf BOOLEAN DEFAULT FALSE,
    
    -- Para Salário Família
    salario_familia BOOLEAN DEFAULT FALSE,
    
    -- Incapacidade
    tem_incapacidade BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9.3 EVENTOS ESOCIAL
-- Baseado em: ACBreSocial todos os eventos
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_esocial_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    funcionario_id UUID REFERENCES tb_funcionarios(id),
    
    -- Identificação do evento
    tipo_evento VARCHAR(10) NOT NULL,      -- S-1000, S-1200, S-2200, etc
    id_evento VARCHAR(40),
    
    -- Período
    periodo_apuracao VARCHAR(7),           -- YYYY-MM
    
    -- Situação
    situacao VARCHAR(20) DEFAULT 'PENDENTE', -- PENDENTE, ENVIADO, PROCESSADO, REJEITADO
    
    -- Protocolo
    protocolo_envio VARCHAR(50),
    data_envio TIMESTAMP,
    
    -- Recibo
    numero_recibo VARCHAR(50),
    data_processamento TIMESTAMP,
    
    -- XML
    xml_evento TEXT,
    xml_retorno TEXT,
    
    -- Erros
    codigo_erro VARCHAR(10),
    mensagem_erro TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9.4 FOLHA DE PAGAMENTO
-- Baseado em: ACBreSocial - S-1200
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_folha_pagamento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    -- Competência
    competencia VARCHAR(7) NOT NULL,       -- YYYY-MM
    tipo_folha VARCHAR(20) DEFAULT 'MENSAL', -- MENSAL, ADIANTAMENTO, 13_1, 13_2, FERIAS, RESCISAO
    
    -- Totais
    total_proventos DECIMAL(15,2) DEFAULT 0,
    total_descontos DECIMAL(15,2) DEFAULT 0,
    total_liquido DECIMAL(15,2) DEFAULT 0,
    
    -- Encargos
    inss_empresa DECIMAL(15,2) DEFAULT 0,
    fgts DECIMAL(15,2) DEFAULT 0,
    
    -- Situação
    situacao VARCHAR(20) DEFAULT 'ABERTA', -- ABERTA, CALCULADA, FECHADA
    
    data_fechamento TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_folha_pagamento_funcionarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folha_id UUID NOT NULL REFERENCES tb_folha_pagamento(id) ON DELETE CASCADE,
    funcionario_id UUID NOT NULL REFERENCES tb_funcionarios(id),
    
    -- Totais do funcionário
    total_proventos DECIMAL(15,2) DEFAULT 0,
    total_descontos DECIMAL(15,2) DEFAULT 0,
    total_liquido DECIMAL(15,2) DEFAULT 0,
    
    -- Bases de cálculo
    base_inss DECIMAL(15,2) DEFAULT 0,
    base_irrf DECIMAL(15,2) DEFAULT 0,
    base_fgts DECIMAL(15,2) DEFAULT 0,
    
    -- Descontos
    inss_desconto DECIMAL(15,2) DEFAULT 0,
    irrf_desconto DECIMAL(15,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_folha_pagamento_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folha_funcionario_id UUID NOT NULL REFERENCES tb_folha_pagamento_funcionarios(id) ON DELETE CASCADE,
    
    codigo_evento VARCHAR(10) NOT NULL,
    descricao VARCHAR(100) NOT NULL,
    
    tipo CHAR(1) NOT NULL,                 -- P=Provento, D=Desconto
    referencia DECIMAL(15,4),              -- Horas, dias, percentual
    valor DECIMAL(15,2) NOT NULL,
    
    -- Incidências
    incide_inss BOOLEAN DEFAULT FALSE,
    incide_irrf BOOLEAN DEFAULT FALSE,
    incide_fgts BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9.5 EFD-REINF
-- Baseado em: ACBrReinf
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_reinf_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    -- Identificação
    tipo_evento VARCHAR(10) NOT NULL,      -- R-1000, R-2010, R-4010, etc
    id_evento VARCHAR(40),
    
    -- Período
    periodo_apuracao VARCHAR(7),
    
    -- Situação
    situacao VARCHAR(20) DEFAULT 'PENDENTE',
    
    -- Protocolo
    protocolo_envio VARCHAR(50),
    data_envio TIMESTAMP,
    numero_recibo VARCHAR(50),
    
    -- XML
    xml_evento TEXT,
    xml_retorno TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PARTE 10: MÓDULO SPED
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 10.1 SPED FISCAL (EFD ICMS/IPI)
-- Baseado em: ACBrSPEDFiscal
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_sped_fiscal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    -- Período
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    
    -- Perfil
    perfil CHAR(1) NOT NULL,               -- A, B, C
    
    -- Finalidade
    finalidade SMALLINT DEFAULT 0,         -- 0=Original, 1=Retificadora
    
    -- Arquivo
    nome_arquivo VARCHAR(100),
    conteudo_arquivo TEXT,
    hash_arquivo VARCHAR(64),
    
    -- Validação
    validado BOOLEAN DEFAULT FALSE,
    data_validacao TIMESTAMP,
    erros_validacao JSONB,
    
    -- Transmissão
    transmitido BOOLEAN DEFAULT FALSE,
    data_transmissao TIMESTAMP,
    recibo VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 10.2 SPED CONTRIBUIÇÕES (EFD PIS/COFINS)
-- Baseado em: ACBrSPEDPisCofins
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_sped_contribuicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    -- Período
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    
    -- Tipo de escrituração
    tipo_escrituracao SMALLINT,            -- 0=Original, 1=Retificadora
    
    -- Indicador
    indicador_situacao_especial SMALLINT,  -- 0=Abertura, 1=Cisão, etc
    
    -- Arquivo
    nome_arquivo VARCHAR(100),
    conteudo_arquivo TEXT,
    hash_arquivo VARCHAR(64),
    
    -- Status
    validado BOOLEAN DEFAULT FALSE,
    transmitido BOOLEAN DEFAULT FALSE,
    data_transmissao TIMESTAMP,
    recibo VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 10.3 SPED CONTÁBIL (ECD)
-- Baseado em: ACBrSPEDContabil
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tb_sped_contabil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES tb_empresas(id),
    
    -- Período
    ano INTEGER NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    
    -- Tipo
    finalidade SMALLINT,                   -- G=Livro Diário Geral, R=Livro Diário Resumido, etc
    
    -- Arquivo
    nome_arquivo VARCHAR(100),
    conteudo_arquivo TEXT,
    hash_arquivo VARCHAR(64),
    
    -- Status
    validado BOOLEAN DEFAULT FALSE,
    transmitido BOOLEAN DEFAULT FALSE,
    data_transmissao TIMESTAMP,
    recibo VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ÍNDICES ADICIONAIS
-- ============================================================================

CREATE INDEX idx_municipios_estado ON tb_municipios(estado_id);
CREATE INDEX idx_municipios_nome ON tb_municipios(nome);
CREATE INDEX idx_audit_log_empresa ON tb_audit_log(empresa_id);
CREATE INDEX idx_audit_log_tabela ON tb_audit_log(tabela);
CREATE INDEX idx_audit_log_data ON tb_audit_log(created_at);

-- ============================================================================
-- FUNÇÃO DE TRIGGER PARA UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_update_timestamp ON %I;
            CREATE TRIGGER trg_update_timestamp
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION fn_update_timestamp();
        ', t, t);
    END LOOP;
END;
$$;

-- ============================================================================
-- DADOS INICIAIS - PAÍSES
-- ============================================================================

INSERT INTO tb_paises (codigo_bacen, nome, sigla, codigo_iso) VALUES
('1058', 'BRASIL', 'BRA', '076'),
('0132', 'AFEGANISTÃO', 'AFG', '004'),
('7560', 'ALEMANHA', 'DEU', '276'),
('0493', 'ARGENTINA', 'ARG', '032'),
('0817', 'AUSTRÁLIA', 'AUS', '036'),
('0965', 'ÁUSTRIA', 'AUT', '040'),
('0973', 'BÉLGICA', 'BEL', '056'),
('0990', 'BOLÍVIA', 'BOL', '068'),
('1112', 'CANADÁ', 'CAN', '124'),
('1589', 'CHILE', 'CHL', '152'),
('1600', 'CHINA', 'CHN', '156'),
('1694', 'COLÔMBIA', 'COL', '170'),
('2356', 'ESPANHA', 'ESP', '724'),
('2496', 'ESTADOS UNIDOS', 'USA', '840'),
('2852', 'FRANÇA', 'FRA', '250'),
('3310', 'HOLANDA', 'NLD', '528'),
('3611', 'ITÁLIA', 'ITA', '380'),
('3999', 'JAPÃO', 'JPN', '392'),
('4618', 'MÉXICO', 'MEX', '484'),
('5380', 'PARAGUAI', 'PRY', '600'),
('5894', 'PORTUGAL', 'PRT', '620'),
('6076', 'REINO UNIDO', 'GBR', '826'),
('7820', 'URUGUAI', 'URY', '858')
ON CONFLICT (codigo_bacen) DO NOTHING;

-- ============================================================================
-- DADOS INICIAIS - ESTADOS BRASILEIROS
-- ============================================================================

INSERT INTO tb_estados (pais_id, codigo_ibge, nome, sigla) VALUES
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '12', 'ACRE', 'AC'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '27', 'ALAGOAS', 'AL'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '16', 'AMAPÁ', 'AP'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '13', 'AMAZONAS', 'AM'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '29', 'BAHIA', 'BA'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '23', 'CEARÁ', 'CE'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '53', 'DISTRITO FEDERAL', 'DF'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '32', 'ESPÍRITO SANTO', 'ES'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '52', 'GOIÁS', 'GO'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '21', 'MARANHÃO', 'MA'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '51', 'MATO GROSSO', 'MT'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '50', 'MATO GROSSO DO SUL', 'MS'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '31', 'MINAS GERAIS', 'MG'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '15', 'PARÁ', 'PA'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '25', 'PARAÍBA', 'PB'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '41', 'PARANÁ', 'PR'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '26', 'PERNAMBUCO', 'PE'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '22', 'PIAUÍ', 'PI'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '33', 'RIO DE JANEIRO', 'RJ'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '24', 'RIO GRANDE DO NORTE', 'RN'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '43', 'RIO GRANDE DO SUL', 'RS'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '11', 'RONDÔNIA', 'RO'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '14', 'RORAIMA', 'RR'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '42', 'SANTA CATARINA', 'SC'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '35', 'SÃO PAULO', 'SP'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '28', 'SERGIPE', 'SE'),
((SELECT id FROM tb_paises WHERE codigo_bacen = '1058'), '17', 'TOCANTINS', 'TO')
ON CONFLICT (codigo_ibge) DO NOTHING;

-- ============================================================================
-- DADOS INICIAIS - BANCOS PRINCIPAIS
-- ============================================================================

INSERT INTO tb_bancos (codigo, nome, digitos_agencia, digitos_conta, digitos_nosso_numero) VALUES
('001', 'BANCO DO BRASIL S.A.', 4, 8, 17),
('033', 'BANCO SANTANDER (BRASIL) S.A.', 4, 8, 13),
('104', 'CAIXA ECONÔMICA FEDERAL', 4, 11, 17),
('237', 'BANCO BRADESCO S.A.', 4, 7, 11),
('341', 'ITAÚ UNIBANCO S.A.', 4, 5, 8),
('422', 'BANCO SAFRA S.A.', 4, 8, 9),
('748', 'BANCO COOPERATIVO SICREDI S.A.', 4, 5, 9),
('756', 'BANCO COOPERATIVO DO BRASIL S.A. - BANCOOB', 4, 8, 7),
('041', 'BANCO DO ESTADO DO RIO GRANDE DO SUL S.A.', 4, 9, 10),
('077', 'BANCO INTER S.A.', 4, 9, 11),
('260', 'NU PAGAMENTOS S.A.', 4, 10, 0),
('336', 'BANCO C6 S.A.', 4, 9, 0),
('212', 'BANCO ORIGINAL S.A.', 4, 7, 0)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================================================

COMMENT ON TABLE tb_empresas IS 'Cadastro de empresas (matriz e filiais) com configurações fiscais e certificado digital';
COMMENT ON TABLE tb_pessoas IS 'Cadastro unificado de pessoas (clientes, fornecedores, transportadoras, funcionários)';
COMMENT ON TABLE tb_produtos IS 'Cadastro de produtos com dados fiscais (NCM, CEST, origem)';
COMMENT ON TABLE tb_documentos_fiscais IS 'Documentos fiscais eletrônicos (NF-e, NFC-e, CT-e, MDF-e, NFS-e)';
COMMENT ON TABLE tb_contas_receber IS 'Títulos a receber com integração a boletos bancários e PIX';
COMMENT ON TABLE tb_contas_pagar IS 'Títulos a pagar com integração a pagamentos bancários';
COMMENT ON TABLE tb_estoque_movimentacoes IS 'Movimentações de estoque com rastreabilidade';
COMMENT ON TABLE tb_esocial_eventos IS 'Eventos do eSocial';
COMMENT ON TABLE tb_sped_fiscal IS 'Arquivos SPED Fiscal (EFD ICMS/IPI)';

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================
