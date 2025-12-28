-- =============================================
-- PLANAC ERP - Migration 0011
-- Financeiro: Boletos Bancários
-- Suporte para ACBr API/ACBrLib (60+ bancos)
-- =============================================
-- Criado em: 28/12/2025
-- Descrição: Tabelas para gestão de boletos bancários,
--            remessas CNAB e retornos de liquidação
-- =============================================

-- =============================================
-- 1. BANCOS (Referência)
-- =============================================
CREATE TABLE IF NOT EXISTS boleto_bancos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    -- Identificação
    codigo TEXT NOT NULL UNIQUE,            -- Código FEBRABAN (ex: '001', '341', '033')
    nome TEXT NOT NULL,                     -- Nome do banco
    nome_curto TEXT,                        -- Nome abreviado
    
    -- Configurações
    suporta_api INTEGER DEFAULT 0,          -- 1 = Suporta registro via API
    suporta_cnab240 INTEGER DEFAULT 1,      -- 1 = Suporta CNAB 240
    suporta_cnab400 INTEGER DEFAULT 1,      -- 1 = Suporta CNAB 400
    
    -- URLs de API (quando suportado)
    url_homologacao TEXT,
    url_producao TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_boleto_bancos_codigo ON boleto_bancos(codigo);

-- =============================================
-- 2. CONTAS BANCÁRIAS PARA BOLETOS
-- =============================================
CREATE TABLE IF NOT EXISTS boleto_contas (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    banco_id TEXT NOT NULL REFERENCES boleto_bancos(id),
    
    -- Dados da conta
    agencia TEXT NOT NULL,
    agencia_dv TEXT,
    conta TEXT NOT NULL,
    conta_dv TEXT,
    
    -- Dados do cedente/beneficiário
    cedente_nome TEXT NOT NULL,
    cedente_cpf_cnpj TEXT NOT NULL,
    cedente_endereco TEXT,
    cedente_cidade TEXT,
    cedente_uf TEXT,
    cedente_cep TEXT,
    
    -- Carteira e convênio
    carteira TEXT NOT NULL,                 -- Código da carteira
    variacao_carteira TEXT,                 -- Variação da carteira (se aplicável)
    convenio TEXT,                          -- Número do convênio
    codigo_cedente TEXT,                    -- Código do cedente no banco
    modalidade TEXT,                        -- Modalidade de cobrança
    
    -- Configurações de numeração
    nosso_numero_inicio INTEGER DEFAULT 1,
    nosso_numero_atual INTEGER DEFAULT 1,
    nosso_numero_fim INTEGER,
    digitos_nosso_numero INTEGER DEFAULT 10,
    
    -- Configurações de emissão
    tipo_documento TEXT DEFAULT 'DM',       -- DM=Duplicata Mercantil, DS=Duplicata Serviço, etc.
    aceite TEXT DEFAULT 'N',                -- A=Aceite, N=Não aceite
    especie_documento TEXT DEFAULT 'R$',
    local_pagamento TEXT DEFAULT 'Pagável em qualquer banco até o vencimento',
    
    -- Instruções padrão
    instrucao1 TEXT,
    instrucao2 TEXT,
    instrucao3 TEXT,
    
    -- Multa e juros padrão
    percentual_multa REAL DEFAULT 2.0,
    percentual_juros_dia REAL DEFAULT 0.033,
    dias_protesto INTEGER DEFAULT 0,        -- 0 = Não protestar
    dias_baixa INTEGER DEFAULT 60,          -- Dias para baixa automática
    
    -- Credenciais API (criptografadas)
    api_client_id TEXT,
    api_client_secret_encrypted TEXT,
    api_client_secret_iv TEXT,
    api_scope TEXT,
    api_certificado_r2_key TEXT,            -- Certificado para mTLS
    api_certificado_senha_encrypted TEXT,
    api_certificado_senha_iv TEXT,
    
    -- Ambiente
    ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao')),
    
    -- Tipo de integração
    tipo_integracao TEXT DEFAULT 'cnab' CHECK (tipo_integracao IN ('cnab', 'api', 'hibrido')),
    
    -- Layout CNAB
    layout_cnab TEXT DEFAULT '240' CHECK (layout_cnab IN ('240', '400')),
    
    -- Controle
    padrao INTEGER DEFAULT 0,               -- 1 = Conta padrão para boletos
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_boleto_contas_empresa ON boleto_contas(empresa_id);
CREATE INDEX idx_boleto_contas_banco ON boleto_contas(banco_id);

-- =============================================
-- 3. TÍTULOS (Boletos)
-- =============================================
CREATE TABLE IF NOT EXISTS boleto_titulos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    conta_id TEXT NOT NULL REFERENCES boleto_contas(id),
    
    -- Identificação
    nosso_numero TEXT NOT NULL,
    seu_numero TEXT,                        -- Número do documento do cliente
    numero_documento TEXT,                  -- Número do documento/fatura
    
    -- Sacado/Pagador
    sacado_tipo TEXT NOT NULL CHECK (sacado_tipo IN ('PF', 'PJ')),
    sacado_cpf_cnpj TEXT NOT NULL,
    sacado_nome TEXT NOT NULL,
    sacado_endereco TEXT,
    sacado_numero TEXT,
    sacado_complemento TEXT,
    sacado_bairro TEXT,
    sacado_cidade TEXT,
    sacado_uf TEXT,
    sacado_cep TEXT,
    sacado_email TEXT,
    sacado_telefone TEXT,
    
    -- Valores
    valor_documento REAL NOT NULL,
    valor_abatimento REAL DEFAULT 0,
    valor_desconto REAL DEFAULT 0,
    valor_mora REAL DEFAULT 0,
    valor_multa REAL DEFAULT 0,
    valor_outros_acrescimos REAL DEFAULT 0,
    valor_outros_descontos REAL DEFAULT 0,
    valor_pago REAL DEFAULT 0,
    valor_credito REAL DEFAULT 0,           -- Valor creditado na conta
    
    -- Datas
    data_documento TEXT NOT NULL,
    data_vencimento TEXT NOT NULL,
    data_processamento TEXT,
    data_credito TEXT,
    data_pagamento TEXT,
    data_baixa TEXT,
    
    -- Desconto
    data_desconto TEXT,
    tipo_desconto INTEGER DEFAULT 0,        -- 0=Sem desconto, 1=Valor fixo, 2=Percentual
    
    -- Multa e juros
    percentual_multa REAL DEFAULT 0,
    data_multa TEXT,
    percentual_juros REAL DEFAULT 0,
    valor_juros_dia REAL DEFAULT 0,
    
    -- Protesto
    dias_protesto INTEGER DEFAULT 0,
    data_protesto TEXT,
    
    -- Baixa
    dias_baixa INTEGER DEFAULT 0,
    
    -- Código de barras e linha digitável
    codigo_barras TEXT,
    linha_digitavel TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'gerado' CHECK (status IN (
        'rascunho',         -- Ainda não gerado
        'gerado',           -- Boleto gerado, aguardando envio
        'enviado',          -- Enviado para o banco (remessa)
        'registrado',       -- Registrado no banco
        'rejeitado',        -- Rejeitado pelo banco
        'pago',             -- Pago pelo sacado
        'baixado',          -- Baixado (manual ou automático)
        'protestado',       -- Protestado
        'cancelado'         -- Cancelado
    )),
    
    -- Motivo (para rejeição/baixa)
    codigo_ocorrencia TEXT,
    motivo_ocorrencia TEXT,
    
    -- Remessa/Retorno
    remessa_id TEXT,                        -- ID da remessa que enviou
    retorno_id TEXT,                        -- ID do retorno que atualizou
    
    -- Vinculação com módulos do ERP
    cliente_id TEXT REFERENCES clientes(id),
    conta_receber_id TEXT,                  -- Vínculo com contas a receber
    venda_id TEXT,                          -- Vínculo com venda
    
    -- Armazenamento
    pdf_storage_key TEXT,                   -- PDF do boleto
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, conta_id, nosso_numero)
);

CREATE INDEX idx_boleto_titulos_empresa ON boleto_titulos(empresa_id);
CREATE INDEX idx_boleto_titulos_conta ON boleto_titulos(conta_id);
CREATE INDEX idx_boleto_titulos_nosso_numero ON boleto_titulos(nosso_numero);
CREATE INDEX idx_boleto_titulos_sacado ON boleto_titulos(sacado_cpf_cnpj);
CREATE INDEX idx_boleto_titulos_vencimento ON boleto_titulos(data_vencimento);
CREATE INDEX idx_boleto_titulos_status ON boleto_titulos(status);
CREATE INDEX idx_boleto_titulos_cliente ON boleto_titulos(cliente_id);

-- =============================================
-- 4. REMESSAS CNAB
-- =============================================
CREATE TABLE IF NOT EXISTS boleto_remessas (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    conta_id TEXT NOT NULL REFERENCES boleto_contas(id),
    
    -- Identificação
    numero_remessa INTEGER NOT NULL,
    data_geracao TEXT NOT NULL,
    
    -- Layout
    layout TEXT NOT NULL CHECK (layout IN ('240', '400')),
    
    -- Conteúdo
    quantidade_titulos INTEGER DEFAULT 0,
    valor_total REAL DEFAULT 0,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'gerada' CHECK (status IN ('gerada', 'enviada', 'processada', 'erro')),
    
    -- Armazenamento
    arquivo_storage_key TEXT,               -- Arquivo CNAB no R2
    nome_arquivo TEXT,
    
    -- Erro
    erro_mensagem TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_boleto_remessas_empresa ON boleto_remessas(empresa_id);
CREATE INDEX idx_boleto_remessas_conta ON boleto_remessas(conta_id);
CREATE INDEX idx_boleto_remessas_numero ON boleto_remessas(numero_remessa);
CREATE INDEX idx_boleto_remessas_data ON boleto_remessas(data_geracao);

-- =============================================
-- 5. RETORNOS CNAB
-- =============================================
CREATE TABLE IF NOT EXISTS boleto_retornos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    conta_id TEXT NOT NULL REFERENCES boleto_contas(id),
    
    -- Identificação
    numero_retorno INTEGER,
    data_arquivo TEXT,
    data_credito TEXT,
    
    -- Layout
    layout TEXT NOT NULL CHECK (layout IN ('240', '400')),
    
    -- Conteúdo
    quantidade_registros INTEGER DEFAULT 0,
    quantidade_liquidados INTEGER DEFAULT 0,
    quantidade_baixados INTEGER DEFAULT 0,
    quantidade_rejeitados INTEGER DEFAULT 0,
    valor_total_liquidado REAL DEFAULT 0,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'importado' CHECK (status IN ('importado', 'processado', 'erro')),
    
    -- Armazenamento
    arquivo_storage_key TEXT,               -- Arquivo CNAB no R2
    nome_arquivo TEXT,
    
    -- Erro
    erro_mensagem TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_boleto_retornos_empresa ON boleto_retornos(empresa_id);
CREATE INDEX idx_boleto_retornos_conta ON boleto_retornos(conta_id);
CREATE INDEX idx_boleto_retornos_data ON boleto_retornos(data_arquivo);

-- =============================================
-- 6. ITENS DO RETORNO (Ocorrências)
-- =============================================
CREATE TABLE IF NOT EXISTS boleto_retornos_itens (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    retorno_id TEXT NOT NULL REFERENCES boleto_retornos(id) ON DELETE CASCADE,
    titulo_id TEXT REFERENCES boleto_titulos(id),
    
    -- Identificação do título
    nosso_numero TEXT NOT NULL,
    seu_numero TEXT,
    
    -- Ocorrência
    codigo_ocorrencia TEXT NOT NULL,
    descricao_ocorrencia TEXT,
    
    -- Valores
    valor_titulo REAL,
    valor_pago REAL,
    valor_tarifa REAL,
    valor_abatimento REAL,
    valor_desconto REAL,
    valor_mora REAL,
    valor_multa REAL,
    valor_credito REAL,
    
    -- Datas
    data_ocorrencia TEXT,
    data_credito TEXT,
    data_pagamento TEXT,
    
    -- Motivos de rejeição (se aplicável)
    motivos_rejeicao TEXT,                  -- JSON array de motivos
    
    -- Status de processamento
    processado INTEGER DEFAULT 0,
    erro_processamento TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_boleto_retornos_itens_retorno ON boleto_retornos_itens(retorno_id);
CREATE INDEX idx_boleto_retornos_itens_titulo ON boleto_retornos_itens(titulo_id);
CREATE INDEX idx_boleto_retornos_itens_nosso_numero ON boleto_retornos_itens(nosso_numero);

-- =============================================
-- 7. LOG DE OPERAÇÕES BOLETO
-- =============================================
CREATE TABLE IF NOT EXISTS boleto_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Referência
    titulo_id TEXT REFERENCES boleto_titulos(id),
    remessa_id TEXT REFERENCES boleto_remessas(id),
    retorno_id TEXT REFERENCES boleto_retornos(id),
    
    -- Operação
    operacao TEXT NOT NULL,                 -- geracao, registro_api, remessa, retorno, baixa, cancelamento
    descricao TEXT,
    
    -- Resultado
    sucesso INTEGER DEFAULT 1,
    erro_mensagem TEXT,
    
    -- Request/Response (para API)
    request_storage_key TEXT,
    response_storage_key TEXT,
    
    -- Usuário
    usuario_id TEXT REFERENCES usuarios(id),
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_boleto_logs_empresa ON boleto_logs(empresa_id);
CREATE INDEX idx_boleto_logs_titulo ON boleto_logs(titulo_id);
CREATE INDEX idx_boleto_logs_operacao ON boleto_logs(operacao);
CREATE INDEX idx_boleto_logs_data ON boleto_logs(created_at);

-- =============================================
-- SEED: Bancos principais
-- =============================================
INSERT OR IGNORE INTO boleto_bancos (id, codigo, nome, nome_curto, suporta_api, ativo) VALUES
    (lower(hex(randomblob(16))), '001', 'Banco do Brasil S.A.', 'BB', 1, 1),
    (lower(hex(randomblob(16))), '033', 'Banco Santander (Brasil) S.A.', 'Santander', 1, 1),
    (lower(hex(randomblob(16))), '104', 'Caixa Econômica Federal', 'Caixa', 1, 1),
    (lower(hex(randomblob(16))), '237', 'Banco Bradesco S.A.', 'Bradesco', 1, 1),
    (lower(hex(randomblob(16))), '341', 'Itaú Unibanco S.A.', 'Itaú', 1, 1),
    (lower(hex(randomblob(16))), '756', 'Banco Cooperativo do Brasil S.A. - Bancoob', 'Sicoob', 1, 1),
    (lower(hex(randomblob(16))), '748', 'Banco Cooperativo Sicredi S.A.', 'Sicredi', 1, 1),
    (lower(hex(randomblob(16))), '077', 'Banco Inter S.A.', 'Inter', 1, 1),
    (lower(hex(randomblob(16))), '336', 'Banco C6 S.A.', 'C6 Bank', 1, 1),
    (lower(hex(randomblob(16))), '260', 'Nu Pagamentos S.A.', 'Nubank', 1, 1),
    (lower(hex(randomblob(16))), '422', 'Banco Safra S.A.', 'Safra', 1, 1),
    (lower(hex(randomblob(16))), '745', 'Banco Citibank S.A.', 'Citibank', 0, 1),
    (lower(hex(randomblob(16))), '041', 'Banco do Estado do Rio Grande do Sul S.A.', 'Banrisul', 1, 1),
    (lower(hex(randomblob(16))), '070', 'Banco de Brasília S.A.', 'BRB', 1, 1),
    (lower(hex(randomblob(16))), '085', 'Cooperativa Central de Crédito - Ailos', 'Ailos', 1, 1),
    (lower(hex(randomblob(16))), '136', 'Confederação Nacional das Cooperativas Centrais Unicred', 'Unicred', 1, 1),
    (lower(hex(randomblob(16))), '212', 'Banco Original S.A.', 'Original', 1, 1),
    (lower(hex(randomblob(16))), '218', 'Banco BS2 S.A.', 'BS2', 1, 1),
    (lower(hex(randomblob(16))), '246', 'Banco ABC Brasil S.A.', 'ABC Brasil', 0, 1),
    (lower(hex(randomblob(16))), '389', 'Banco Mercantil do Brasil S.A.', 'Mercantil', 0, 1);

-- =============================================
-- COMENTÁRIOS PARA DESENVOLVEDORES
-- =============================================
-- 
-- FLUXO CNAB:
-- 1. Gerar títulos (boleto_titulos)
-- 2. Gerar arquivo de remessa (boleto_remessas)
-- 3. Enviar arquivo para o banco (upload no internet banking ou API)
-- 4. Importar arquivo de retorno (boleto_retornos)
-- 5. Processar ocorrências (boleto_retornos_itens)
-- 6. Atualizar status dos títulos
--
-- FLUXO API:
-- 1. Gerar título (boleto_titulos)
-- 2. Registrar via API do banco
-- 3. Receber webhook de pagamento ou consultar status
-- 4. Atualizar título
--
-- INTEGRAÇÃO ACBr:
-- - ACBrBoleto suporta 60+ bancos
-- - Geração de remessa CNAB 240/400
-- - Leitura de retorno CNAB 240/400
-- - Cálculo de DV (módulo 10/11)
-- - Geração de código de barras e linha digitável
--
-- ARMAZENAMENTO:
-- - Arquivos CNAB no R2
-- - PDFs de boletos no R2
-- - Apenas metadados no D1
--
-- SEGURANÇA:
-- - Credenciais de API criptografadas
-- - Certificados mTLS no R2 com referência criptografada
-- =============================================
