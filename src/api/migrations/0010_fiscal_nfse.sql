-- =============================================
-- PLANAC ERP - Migration 0010
-- Fiscal: NFS-e (Nota Fiscal de Serviços Eletrônica)
-- Suporte para ACBr API/ACBrLib (140+ provedores)
-- =============================================
-- Criado em: 28/12/2025
-- Descrição: Tabelas para emissão e gestão de NFS-e
--            com suporte a múltiplos provedores municipais
-- =============================================

-- =============================================
-- 1. PROVEDORES NFS-e (Referência)
-- =============================================
-- Lista de provedores suportados pelo ACBr
CREATE TABLE IF NOT EXISTS nfse_provedores (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    -- Identificação
    codigo TEXT NOT NULL UNIQUE,            -- Código do provedor (ex: 'ginfes', 'betha', 'webiss')
    nome TEXT NOT NULL,                     -- Nome do provedor
    versao TEXT,                            -- Versão do layout
    
    -- Padrão
    padrao TEXT CHECK (padrao IN ('abrasf_v1', 'abrasf_v2', 'proprio', 'padrao_nacional')),
    
    -- Funcionalidades suportadas
    suporta_consulta_tomador INTEGER DEFAULT 0,  -- 1 = Suporta ConsultarNFSeServicoTomado
    suporta_cancelamento INTEGER DEFAULT 1,
    suporta_substituicao INTEGER DEFAULT 0,
    suporta_lote INTEGER DEFAULT 1,
    
    -- URLs de documentação
    url_documentacao TEXT,
    url_homologacao TEXT,
    url_producao TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_nfse_provedores_codigo ON nfse_provedores(codigo);

-- =============================================
-- 2. MUNICÍPIOS NFS-e
-- =============================================
-- Configuração de NFS-e por município
CREATE TABLE IF NOT EXISTS nfse_municipios (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    -- Identificação do município
    codigo_ibge TEXT NOT NULL UNIQUE,       -- Código IBGE (7 dígitos)
    nome TEXT NOT NULL,
    uf TEXT NOT NULL,
    
    -- Provedor
    provedor_id TEXT REFERENCES nfse_provedores(id),
    provedor_codigo TEXT,                   -- Código do provedor (redundante para facilitar queries)
    
    -- URLs específicas do município (se diferentes do provedor)
    url_homologacao TEXT,
    url_producao TEXT,
    
    -- Configurações específicas
    versao_schema TEXT,
    codigo_municipio_siafi TEXT,            -- Código SIAFI do município
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_nfse_municipios_ibge ON nfse_municipios(codigo_ibge);
CREATE INDEX idx_nfse_municipios_uf ON nfse_municipios(uf);
CREATE INDEX idx_nfse_municipios_provedor ON nfse_municipios(provedor_id);

-- =============================================
-- 3. CONFIGURAÇÃO NFS-e POR EMPRESA
-- =============================================
CREATE TABLE IF NOT EXISTS nfse_configuracoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Município de emissão
    municipio_id TEXT REFERENCES nfse_municipios(id),
    codigo_ibge TEXT NOT NULL,
    
    -- Ambiente
    ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao')),
    
    -- Credenciais do provedor (criptografadas)
    usuario TEXT,                           -- Usuário/Login do provedor
    senha_encrypted TEXT,                   -- Senha criptografada
    senha_iv TEXT,                          -- IV para decriptação
    token TEXT,                             -- Token de acesso (se aplicável)
    
    -- Inscrição Municipal
    inscricao_municipal TEXT NOT NULL,
    
    -- Configurações de emissão
    regime_especial_tributacao INTEGER,     -- Código do regime especial
    natureza_operacao INTEGER DEFAULT 1,    -- 1=Tributação no município, 2=Fora do município, etc.
    incentivo_fiscal INTEGER DEFAULT 0,     -- 0=Não, 1=Sim
    
    -- Séries e numeração
    serie_rps TEXT DEFAULT 'RPS',
    proximo_numero_rps INTEGER DEFAULT 1,
    lote_atual INTEGER DEFAULT 1,
    
    -- Configurações de envio
    envio_sincrono INTEGER DEFAULT 1,       -- 1=Síncrono, 0=Assíncrono (lote)
    tamanho_lote INTEGER DEFAULT 50,        -- Máximo de RPS por lote
    
    -- Configurações de impressão
    logo_url TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, codigo_ibge)
);

CREATE INDEX idx_nfse_config_empresa ON nfse_configuracoes(empresa_id);
CREATE INDEX idx_nfse_config_municipio ON nfse_configuracoes(codigo_ibge);

-- =============================================
-- 4. NFS-e EMITIDAS
-- =============================================
CREATE TABLE IF NOT EXISTS nfse_emitidas (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    configuracao_id TEXT REFERENCES nfse_configuracoes(id),
    
    -- Identificação RPS
    numero_rps INTEGER NOT NULL,
    serie_rps TEXT NOT NULL,
    tipo_rps INTEGER DEFAULT 1,             -- 1=RPS, 2=Nota Conjugada, 3=Cupom
    
    -- Identificação NFS-e (após autorização)
    numero_nfse TEXT,
    codigo_verificacao TEXT,
    data_emissao TEXT,
    
    -- Ambiente
    ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao')),
    
    -- Tomador do serviço
    tomador_tipo TEXT CHECK (tomador_tipo IN ('PF', 'PJ', 'estrangeiro')),
    tomador_cpf_cnpj TEXT,
    tomador_razao_social TEXT,
    tomador_nome_fantasia TEXT,
    tomador_inscricao_municipal TEXT,
    tomador_email TEXT,
    tomador_telefone TEXT,
    
    -- Endereço do tomador
    tomador_cep TEXT,
    tomador_logradouro TEXT,
    tomador_numero TEXT,
    tomador_complemento TEXT,
    tomador_bairro TEXT,
    tomador_cidade TEXT,
    tomador_uf TEXT,
    tomador_codigo_ibge TEXT,
    
    -- Serviço
    codigo_servico TEXT NOT NULL,           -- Código do serviço (LC 116)
    codigo_cnae TEXT,
    discriminacao TEXT NOT NULL,            -- Descrição do serviço
    
    -- Valores
    valor_servicos REAL NOT NULL,
    valor_deducoes REAL DEFAULT 0,
    valor_pis REAL DEFAULT 0,
    valor_cofins REAL DEFAULT 0,
    valor_inss REAL DEFAULT 0,
    valor_ir REAL DEFAULT 0,
    valor_csll REAL DEFAULT 0,
    valor_iss REAL DEFAULT 0,
    valor_iss_retido REAL DEFAULT 0,
    outras_retencoes REAL DEFAULT 0,
    base_calculo REAL DEFAULT 0,
    aliquota_iss REAL DEFAULT 0,
    valor_liquido REAL DEFAULT 0,
    valor_credito REAL DEFAULT 0,           -- Crédito para abatimento
    desconto_incondicionado REAL DEFAULT 0,
    desconto_condicionado REAL DEFAULT 0,
    
    -- Tributação
    iss_retido INTEGER DEFAULT 0,           -- 1=Sim, 0=Não
    natureza_operacao INTEGER DEFAULT 1,
    regime_especial_tributacao INTEGER,
    optante_simples INTEGER DEFAULT 0,
    incentivo_fiscal INTEGER DEFAULT 0,
    
    -- Local de prestação
    local_prestacao_codigo_ibge TEXT,
    local_prestacao_cidade TEXT,
    local_prestacao_uf TEXT,
    
    -- Construção civil (se aplicável)
    construcao_civil_codigo_obra TEXT,
    construcao_civil_art TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'pendente', 'processando', 'autorizada', 'rejeitada', 'cancelada', 'substituida')),
    
    -- Lote (se envio assíncrono)
    lote_id TEXT,
    numero_lote INTEGER,
    
    -- Resposta do provedor
    protocolo TEXT,
    codigo_status INTEGER,
    motivo_status TEXT,
    
    -- Cancelamento
    cancelada INTEGER DEFAULT 0,
    data_cancelamento TEXT,
    motivo_cancelamento TEXT,
    protocolo_cancelamento TEXT,
    
    -- Substituição
    substituida INTEGER DEFAULT 0,
    nfse_substituta_id TEXT,
    nfse_substituida_id TEXT,
    
    -- Vinculação com módulos do ERP
    cliente_id TEXT REFERENCES clientes(id),
    pedido_venda_id TEXT,
    ordem_servico_id TEXT,
    conta_receber_id TEXT,
    
    -- Armazenamento
    xml_rps_storage_key TEXT,               -- XML do RPS enviado
    xml_nfse_storage_key TEXT,              -- XML da NFS-e autorizada
    pdf_storage_key TEXT,                   -- PDF da NFS-e
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, numero_rps, serie_rps)
);

CREATE INDEX idx_nfse_emitidas_empresa ON nfse_emitidas(empresa_id);
CREATE INDEX idx_nfse_emitidas_numero ON nfse_emitidas(numero_nfse);
CREATE INDEX idx_nfse_emitidas_rps ON nfse_emitidas(numero_rps, serie_rps);
CREATE INDEX idx_nfse_emitidas_tomador ON nfse_emitidas(tomador_cpf_cnpj);
CREATE INDEX idx_nfse_emitidas_status ON nfse_emitidas(status);
CREATE INDEX idx_nfse_emitidas_data ON nfse_emitidas(data_emissao);
CREATE INDEX idx_nfse_emitidas_cliente ON nfse_emitidas(cliente_id);

-- =============================================
-- 5. NFS-e RECEBIDAS (Serviços Tomados)
-- =============================================
-- NFS-e onde a empresa é o tomador do serviço
CREATE TABLE IF NOT EXISTS nfse_recebidas (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Identificação
    numero_nfse TEXT NOT NULL,
    codigo_verificacao TEXT,
    data_emissao TEXT NOT NULL,
    
    -- Município de emissão
    codigo_ibge_emissao TEXT,
    municipio_emissao TEXT,
    uf_emissao TEXT,
    
    -- Prestador do serviço
    prestador_cpf_cnpj TEXT NOT NULL,
    prestador_razao_social TEXT,
    prestador_nome_fantasia TEXT,
    prestador_inscricao_municipal TEXT,
    prestador_email TEXT,
    
    -- Endereço do prestador
    prestador_cep TEXT,
    prestador_logradouro TEXT,
    prestador_numero TEXT,
    prestador_bairro TEXT,
    prestador_cidade TEXT,
    prestador_uf TEXT,
    
    -- Serviço
    codigo_servico TEXT,
    discriminacao TEXT,
    
    -- Valores
    valor_servicos REAL NOT NULL,
    valor_deducoes REAL DEFAULT 0,
    valor_pis REAL DEFAULT 0,
    valor_cofins REAL DEFAULT 0,
    valor_inss REAL DEFAULT 0,
    valor_ir REAL DEFAULT 0,
    valor_csll REAL DEFAULT 0,
    valor_iss REAL DEFAULT 0,
    valor_iss_retido REAL DEFAULT 0,
    base_calculo REAL DEFAULT 0,
    aliquota_iss REAL DEFAULT 0,
    valor_liquido REAL DEFAULT 0,
    
    -- Retenções
    iss_retido INTEGER DEFAULT 0,
    
    -- Situação
    situacao TEXT DEFAULT 'normal' CHECK (situacao IN ('normal', 'cancelada')),
    
    -- Vinculação com módulos do ERP
    fornecedor_id TEXT REFERENCES fornecedores(id),
    conta_pagar_id TEXT,
    
    -- Armazenamento
    xml_storage_key TEXT,
    pdf_storage_key TEXT,
    
    -- Origem
    origem TEXT DEFAULT 'manual' CHECK (origem IN ('manual', 'consulta_tomador', 'importacao')),
    
    -- Controle
    processado INTEGER DEFAULT 0,
    importado_financeiro INTEGER DEFAULT 0,
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, numero_nfse, prestador_cpf_cnpj, codigo_ibge_emissao)
);

CREATE INDEX idx_nfse_recebidas_empresa ON nfse_recebidas(empresa_id);
CREATE INDEX idx_nfse_recebidas_numero ON nfse_recebidas(numero_nfse);
CREATE INDEX idx_nfse_recebidas_prestador ON nfse_recebidas(prestador_cpf_cnpj);
CREATE INDEX idx_nfse_recebidas_data ON nfse_recebidas(data_emissao);
CREATE INDEX idx_nfse_recebidas_fornecedor ON nfse_recebidas(fornecedor_id);

-- =============================================
-- 6. LOTES NFS-e (Envio assíncrono)
-- =============================================
CREATE TABLE IF NOT EXISTS nfse_lotes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    configuracao_id TEXT REFERENCES nfse_configuracoes(id),
    
    -- Identificação do lote
    numero_lote INTEGER NOT NULL,
    
    -- Ambiente
    ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao')),
    
    -- Quantidade de RPS
    quantidade_rps INTEGER DEFAULT 0,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'processando', 'processado', 'erro')),
    
    -- Resposta
    protocolo TEXT,
    codigo_status INTEGER,
    motivo_status TEXT,
    data_recebimento TEXT,
    
    -- Armazenamento
    xml_lote_storage_key TEXT,
    xml_retorno_storage_key TEXT,
    
    -- Erro
    erro_mensagem TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_nfse_lotes_empresa ON nfse_lotes(empresa_id);
CREATE INDEX idx_nfse_lotes_numero ON nfse_lotes(numero_lote);
CREATE INDEX idx_nfse_lotes_status ON nfse_lotes(status);

-- =============================================
-- 7. LOG DE OPERAÇÕES NFS-e
-- =============================================
CREATE TABLE IF NOT EXISTS nfse_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Referência
    nfse_emitida_id TEXT REFERENCES nfse_emitidas(id),
    nfse_recebida_id TEXT REFERENCES nfse_recebidas(id),
    lote_id TEXT REFERENCES nfse_lotes(id),
    
    -- Operação
    operacao TEXT NOT NULL,                 -- emissao, consulta, cancelamento, substituicao, consulta_tomador
    descricao TEXT,
    
    -- Resultado
    sucesso INTEGER DEFAULT 1,
    codigo_status INTEGER,
    motivo_status TEXT,
    erro_mensagem TEXT,
    
    -- Request/Response
    request_storage_key TEXT,
    response_storage_key TEXT,
    
    -- Usuário
    usuario_id TEXT REFERENCES usuarios(id),
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_nfse_logs_empresa ON nfse_logs(empresa_id);
CREATE INDEX idx_nfse_logs_nfse ON nfse_logs(nfse_emitida_id);
CREATE INDEX idx_nfse_logs_operacao ON nfse_logs(operacao);
CREATE INDEX idx_nfse_logs_data ON nfse_logs(created_at);

-- =============================================
-- SEED: Provedores NFS-e principais
-- =============================================
INSERT OR IGNORE INTO nfse_provedores (id, codigo, nome, padrao, suporta_consulta_tomador, ativo) VALUES
    (lower(hex(randomblob(16))), 'ginfes', 'Ginfes', 'abrasf_v1', 1, 1),
    (lower(hex(randomblob(16))), 'betha', 'Betha Sistemas', 'abrasf_v2', 1, 1),
    (lower(hex(randomblob(16))), 'webiss', 'WebISS', 'abrasf_v2', 1, 1),
    (lower(hex(randomblob(16))), 'issnet', 'ISSNet', 'abrasf_v2', 1, 1),
    (lower(hex(randomblob(16))), 'fiorilli', 'Fiorilli', 'abrasf_v2', 1, 1),
    (lower(hex(randomblob(16))), 'elotech', 'EloTech', 'abrasf_v2', 1, 1),
    (lower(hex(randomblob(16))), 'ipm', 'IPM Sistemas', 'proprio', 0, 1),
    (lower(hex(randomblob(16))), 'pronim', 'Pronim', 'abrasf_v2', 1, 1),
    (lower(hex(randomblob(16))), 'sigiss', 'SigISS', 'proprio', 0, 1),
    (lower(hex(randomblob(16))), 'tecnos', 'Tecnos', 'abrasf_v2', 1, 1),
    (lower(hex(randomblob(16))), 'thema', 'Thema', 'abrasf_v2', 1, 1),
    (lower(hex(randomblob(16))), 'conam', 'Conam', 'proprio', 0, 1),
    (lower(hex(randomblob(16))), 'equiplano', 'Equiplano', 'abrasf_v2', 1, 1),
    (lower(hex(randomblob(16))), 'dsf', 'DSF', 'proprio', 0, 1),
    (lower(hex(randomblob(16))), 'simpliss', 'SimplISS', 'abrasf_v2', 1, 1),
    (lower(hex(randomblob(16))), 'govbr', 'Gov.BR', 'abrasf_v2', 1, 1),
    (lower(hex(randomblob(16))), 'padrao_nacional', 'Padrão Nacional', 'padrao_nacional', 1, 1),
    (lower(hex(randomblob(16))), 'isssp', 'ISS São Paulo', 'proprio', 0, 1),
    (lower(hex(randomblob(16))), 'issrj', 'ISS Rio de Janeiro', 'proprio', 0, 1),
    (lower(hex(randomblob(16))), 'issbh', 'BHISS Digital', 'proprio', 0, 1);

-- =============================================
-- COMENTÁRIOS PARA DESENVOLVEDORES
-- =============================================
-- 
-- PROVEDORES:
-- O ACBr suporta 140+ provedores NFS-e. A tabela nfse_provedores
-- contém os principais. Novos provedores podem ser adicionados
-- conforme necessidade.
--
-- CONSULTA POR TOMADOR:
-- Nem todos os provedores suportam ConsultarNFSeServicoTomado.
-- Verificar o campo suporta_consulta_tomador antes de tentar.
--
-- CREDENCIAIS:
-- Cada prefeitura pode exigir credenciais diferentes:
-- - Usuário/Senha
-- - Token
-- - Certificado Digital
-- Armazenar de forma segura (criptografado).
--
-- INTEGRAÇÃO ACBr:
-- - ACBr API: Suporta 1845+ cidades
-- - Endpoint CidadesAtendidas para lista atualizada
-- =============================================
