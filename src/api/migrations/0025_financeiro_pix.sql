-- =============================================
-- PLANAC ERP - Migration 0012
-- Financeiro: PIX (Pagamentos Instantâneos)
-- Suporte para ACBr API/ACBrLib (20+ PSPs)
-- =============================================
-- Criado em: 28/12/2025
-- Descrição: Tabelas para gestão de cobranças PIX,
--            QR Codes, webhooks e conciliação
-- =============================================

-- =============================================
-- 1. PSPs (Provedores de Serviço de Pagamento)
-- =============================================
CREATE TABLE IF NOT EXISTS pix_psps (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    -- Identificação
    codigo TEXT NOT NULL UNIQUE,            -- Código do PSP (ex: 'bb', 'itau', 'mercadopago')
    nome TEXT NOT NULL,
    
    -- Tipo
    tipo TEXT CHECK (tipo IN ('banco', 'fintech', 'adquirente')),
    
    -- URLs
    url_homologacao TEXT,
    url_producao TEXT,
    url_webhook TEXT,
    
    -- Documentação
    url_documentacao TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_pix_psps_codigo ON pix_psps(codigo);

-- =============================================
-- 2. CONFIGURAÇÃO PIX POR EMPRESA
-- =============================================
CREATE TABLE IF NOT EXISTS pix_configuracoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    psp_id TEXT NOT NULL REFERENCES pix_psps(id),
    
    -- Chave PIX
    tipo_chave TEXT NOT NULL CHECK (tipo_chave IN ('cpf', 'cnpj', 'email', 'telefone', 'evp')),
    chave_pix TEXT NOT NULL,
    
    -- Dados do recebedor
    recebedor_nome TEXT NOT NULL,
    recebedor_cpf_cnpj TEXT NOT NULL,
    recebedor_cidade TEXT NOT NULL,
    
    -- Credenciais (criptografadas)
    client_id TEXT,
    client_secret_encrypted TEXT,
    client_secret_iv TEXT,
    
    -- Certificado mTLS (obrigatório para a maioria dos PSPs)
    certificado_r2_key TEXT,                -- Certificado no R2
    certificado_senha_encrypted TEXT,
    certificado_senha_iv TEXT,
    
    -- Tokens
    access_token_encrypted TEXT,
    access_token_iv TEXT,
    refresh_token_encrypted TEXT,
    refresh_token_iv TEXT,
    token_expira_em TEXT,
    
    -- Webhook
    webhook_url TEXT,
    webhook_secret TEXT,
    webhook_ativo INTEGER DEFAULT 0,
    
    -- Ambiente
    ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao')),
    
    -- Configurações de cobrança
    expiracao_padrao INTEGER DEFAULT 3600,  -- Segundos (1 hora)
    
    -- Controle
    padrao INTEGER DEFAULT 0,               -- 1 = Configuração padrão
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, chave_pix)
);

CREATE INDEX idx_pix_config_empresa ON pix_configuracoes(empresa_id);
CREATE INDEX idx_pix_config_psp ON pix_configuracoes(psp_id);

-- =============================================
-- 3. COBRANÇAS PIX
-- =============================================
CREATE TABLE IF NOT EXISTS pix_cobrancas (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    configuracao_id TEXT NOT NULL REFERENCES pix_configuracoes(id),
    
    -- Identificação
    txid TEXT,                              -- ID da transação no PSP
    location TEXT,                          -- URL do payload
    
    -- Tipo de cobrança
    tipo TEXT NOT NULL DEFAULT 'cob' CHECK (tipo IN ('cob', 'cobv')),  -- cob=imediata, cobv=com vencimento
    
    -- Devedor (pagador)
    devedor_tipo TEXT CHECK (devedor_tipo IN ('PF', 'PJ')),
    devedor_cpf TEXT,
    devedor_cnpj TEXT,
    devedor_nome TEXT,
    
    -- Valores
    valor_original REAL NOT NULL,
    valor_final REAL,                       -- Valor após multa/juros/desconto
    valor_pago REAL,
    
    -- Multa e juros (para cobv)
    multa_modalidade INTEGER,               -- 1=Valor fixo, 2=Percentual
    multa_valor REAL,
    juros_modalidade INTEGER,               -- 1=Valor por dia, 2=Percentual por dia, etc.
    juros_valor REAL,
    
    -- Desconto (para cobv)
    desconto_modalidade INTEGER,
    desconto_valor REAL,
    desconto_data_limite TEXT,
    
    -- Abatimento
    abatimento_modalidade INTEGER,
    abatimento_valor REAL,
    
    -- Datas
    data_criacao TEXT NOT NULL,
    data_vencimento TEXT,                   -- Obrigatório para cobv
    data_expiracao TEXT,
    data_pagamento TEXT,
    
    -- Expiração
    expiracao INTEGER,                      -- Segundos até expirar
    
    -- Informações adicionais
    solicitacao_pagador TEXT,               -- Texto para o pagador
    info_adicionais TEXT,                   -- JSON array de {nome, valor}
    
    -- QR Code
    qrcode_payload TEXT,                    -- Payload do QR Code (copia e cola)
    qrcode_imagem_storage_key TEXT,         -- Imagem do QR Code no R2
    
    -- Status
    status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN (
        'criando',          -- Em criação
        'ativa',            -- Aguardando pagamento
        'concluida',        -- Paga
        'removida_pelo_usuario_recebedor',
        'removida_pelo_psp',
        'expirada',
        'cancelada'
    )),
    
    -- Revisão (para alterações)
    revisao INTEGER DEFAULT 0,
    
    -- Vinculação com módulos do ERP
    cliente_id TEXT REFERENCES clientes(id),
    conta_receber_id TEXT,
    venda_id TEXT,
    boleto_id TEXT REFERENCES boleto_titulos(id),  -- Se PIX vinculado a boleto
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, txid)
);

CREATE INDEX idx_pix_cobrancas_empresa ON pix_cobrancas(empresa_id);
CREATE INDEX idx_pix_cobrancas_config ON pix_cobrancas(configuracao_id);
CREATE INDEX idx_pix_cobrancas_txid ON pix_cobrancas(txid);
CREATE INDEX idx_pix_cobrancas_status ON pix_cobrancas(status);
CREATE INDEX idx_pix_cobrancas_data ON pix_cobrancas(data_criacao);
CREATE INDEX idx_pix_cobrancas_vencimento ON pix_cobrancas(data_vencimento);
CREATE INDEX idx_pix_cobrancas_cliente ON pix_cobrancas(cliente_id);

-- =============================================
-- 4. PAGAMENTOS PIX RECEBIDOS
-- =============================================
CREATE TABLE IF NOT EXISTS pix_pagamentos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    cobranca_id TEXT REFERENCES pix_cobrancas(id),
    configuracao_id TEXT REFERENCES pix_configuracoes(id),
    
    -- Identificação
    end_to_end_id TEXT NOT NULL,            -- ID único do pagamento (E2E)
    txid TEXT,                              -- Referência à cobrança
    
    -- Pagador
    pagador_tipo TEXT CHECK (pagador_tipo IN ('PF', 'PJ')),
    pagador_cpf TEXT,
    pagador_cnpj TEXT,
    pagador_nome TEXT,
    
    -- Valores
    valor REAL NOT NULL,
    
    -- Datas
    data_pagamento TEXT NOT NULL,
    
    -- Informações do pagamento
    info_pagador TEXT,                      -- Mensagem do pagador
    
    -- Devolução
    devolvido INTEGER DEFAULT 0,
    valor_devolvido REAL DEFAULT 0,
    
    -- Origem
    origem TEXT DEFAULT 'webhook' CHECK (origem IN ('webhook', 'consulta', 'manual')),
    
    -- Controle
    processado INTEGER DEFAULT 0,           -- 1 = Processado pelo ERP
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, end_to_end_id)
);

CREATE INDEX idx_pix_pagamentos_empresa ON pix_pagamentos(empresa_id);
CREATE INDEX idx_pix_pagamentos_cobranca ON pix_pagamentos(cobranca_id);
CREATE INDEX idx_pix_pagamentos_e2e ON pix_pagamentos(end_to_end_id);
CREATE INDEX idx_pix_pagamentos_data ON pix_pagamentos(data_pagamento);

-- =============================================
-- 5. DEVOLUÇÕES PIX
-- =============================================
CREATE TABLE IF NOT EXISTS pix_devolucoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    pagamento_id TEXT NOT NULL REFERENCES pix_pagamentos(id),
    
    -- Identificação
    devolucao_id TEXT NOT NULL,             -- ID da devolução no PSP
    rtr_id TEXT,                            -- ID de retorno
    
    -- Valores
    valor REAL NOT NULL,
    
    -- Motivo
    natureza TEXT CHECK (natureza IN ('original', 'retirada')),
    descricao TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'em_processamento' CHECK (status IN (
        'em_processamento',
        'devolvido',
        'nao_realizado'
    )),
    motivo_status TEXT,
    
    -- Datas
    data_solicitacao TEXT NOT NULL,
    data_efetivacao TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_pix_devolucoes_empresa ON pix_devolucoes(empresa_id);
CREATE INDEX idx_pix_devolucoes_pagamento ON pix_devolucoes(pagamento_id);
CREATE INDEX idx_pix_devolucoes_status ON pix_devolucoes(status);

-- =============================================
-- 6. WEBHOOKS PIX
-- =============================================
CREATE TABLE IF NOT EXISTS pix_webhooks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    configuracao_id TEXT REFERENCES pix_configuracoes(id),
    
    -- Dados do webhook
    tipo TEXT NOT NULL,                     -- pix, cob, cobv
    evento TEXT,                            -- Tipo de evento
    
    -- Payload
    payload_storage_key TEXT,               -- Payload completo no R2
    payload_hash TEXT,                      -- Hash para deduplicação
    
    -- Processamento
    status TEXT NOT NULL DEFAULT 'recebido' CHECK (status IN ('recebido', 'processado', 'erro', 'ignorado')),
    erro_mensagem TEXT,
    tentativas INTEGER DEFAULT 0,
    
    -- Referências extraídas
    txid TEXT,
    end_to_end_id TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    processed_at TEXT
);

CREATE INDEX idx_pix_webhooks_empresa ON pix_webhooks(empresa_id);
CREATE INDEX idx_pix_webhooks_status ON pix_webhooks(status);
CREATE INDEX idx_pix_webhooks_data ON pix_webhooks(created_at);
CREATE INDEX idx_pix_webhooks_txid ON pix_webhooks(txid);

-- =============================================
-- 7. LOG DE OPERAÇÕES PIX
-- =============================================
CREATE TABLE IF NOT EXISTS pix_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Referência
    cobranca_id TEXT REFERENCES pix_cobrancas(id),
    pagamento_id TEXT REFERENCES pix_pagamentos(id),
    devolucao_id TEXT REFERENCES pix_devolucoes(id),
    
    -- Operação
    operacao TEXT NOT NULL,                 -- criar_cob, consultar_cob, webhook, devolucao, etc.
    descricao TEXT,
    
    -- Resultado
    sucesso INTEGER DEFAULT 1,
    erro_mensagem TEXT,
    
    -- Request/Response
    request_storage_key TEXT,
    response_storage_key TEXT,
    
    -- Usuário
    usuario_id TEXT REFERENCES usuarios(id),
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_pix_logs_empresa ON pix_logs(empresa_id);
CREATE INDEX idx_pix_logs_cobranca ON pix_logs(cobranca_id);
CREATE INDEX idx_pix_logs_operacao ON pix_logs(operacao);
CREATE INDEX idx_pix_logs_data ON pix_logs(created_at);

-- =============================================
-- SEED: PSPs principais
-- =============================================
INSERT OR IGNORE INTO pix_psps (id, codigo, nome, tipo, ativo) VALUES
    (lower(hex(randomblob(16))), 'bb', 'Banco do Brasil', 'banco', 1),
    (lower(hex(randomblob(16))), 'bradesco', 'Bradesco', 'banco', 1),
    (lower(hex(randomblob(16))), 'itau', 'Itaú', 'banco', 1),
    (lower(hex(randomblob(16))), 'santander', 'Santander', 'banco', 1),
    (lower(hex(randomblob(16))), 'caixa', 'Caixa Econômica Federal', 'banco', 1),
    (lower(hex(randomblob(16))), 'sicoob', 'Sicoob', 'banco', 1),
    (lower(hex(randomblob(16))), 'sicredi', 'Sicredi', 'banco', 1),
    (lower(hex(randomblob(16))), 'inter', 'Banco Inter', 'banco', 1),
    (lower(hex(randomblob(16))), 'c6', 'C6 Bank', 'banco', 1),
    (lower(hex(randomblob(16))), 'nubank', 'Nubank', 'fintech', 1),
    (lower(hex(randomblob(16))), 'mercadopago', 'Mercado Pago', 'fintech', 1),
    (lower(hex(randomblob(16))), 'pagseguro', 'PagSeguro', 'fintech', 1),
    (lower(hex(randomblob(16))), 'cielo', 'Cielo', 'adquirente', 1),
    (lower(hex(randomblob(16))), 'getnet', 'Getnet', 'adquirente', 1),
    (lower(hex(randomblob(16))), 'rede', 'Rede', 'adquirente', 1),
    (lower(hex(randomblob(16))), 'stone', 'Stone', 'adquirente', 1),
    (lower(hex(randomblob(16))), 'shipay', 'Shipay', 'fintech', 1),
    (lower(hex(randomblob(16))), 'gerencianet', 'Gerencianet/Efí', 'fintech', 1),
    (lower(hex(randomblob(16))), 'banrisul', 'Banrisul', 'banco', 1),
    (lower(hex(randomblob(16))), 'ailos', 'Ailos', 'banco', 1);

-- =============================================
-- COMENTÁRIOS PARA DESENVOLVEDORES
-- =============================================
-- 
-- TIPOS DE COBRANÇA:
-- - cob: Cobrança imediata (sem vencimento)
-- - cobv: Cobrança com vencimento (permite multa, juros, desconto)
--
-- FLUXO DE COBRANÇA:
-- 1. Criar cobrança (POST /cob ou /cobv)
-- 2. Gerar QR Code
-- 3. Aguardar pagamento (webhook ou polling)
-- 4. Processar pagamento recebido
-- 5. Conciliar com contas a receber
--
-- WEBHOOKS:
-- - Configurar URL de webhook no PSP
-- - Validar assinatura do webhook
-- - Processar eventos de pagamento
-- - Implementar idempotência (payload_hash)
--
-- INTEGRAÇÃO ACBr:
-- - ACBrPIXCD suporta 20+ PSPs
-- - Autenticação OAuth 2.0 com mTLS
-- - Geração de payload PIX
-- - Consulta de cobranças e pagamentos
--
-- SEGURANÇA:
-- - Certificados mTLS obrigatórios
-- - Credenciais criptografadas
-- - Validação de webhooks
-- =============================================
