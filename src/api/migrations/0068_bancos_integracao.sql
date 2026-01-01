-- =============================================
-- PLANAC ERP - Migration 0068
-- Integração Bancária (Sicoob, BB, Caixa, Safra)
-- =============================================
-- Criado em: 01/01/2026
-- Descrição: Adiciona bancos Sicoob, Banco do Brasil, 
--            Caixa Econômica Federal e Safra para
--            integração via API REST
-- =============================================

-- =============================================
-- 1. ADICIONAR BANCO SICOOB (756)
-- =============================================

INSERT OR IGNORE INTO boleto_bancos (
    id,
    codigo,
    nome,
    nome_curto,
    suporta_api,
    suporta_cnab240,
    suporta_cnab400,
    url_homologacao,
    url_producao,
    ativo,
    created_at,
    updated_at
) VALUES (
    lower(hex(randomblob(16))),
    '756',
    'Banco Cooperativo Sicoob',
    'Sicoob',
    1,
    1,
    1,
    'https://sandbox.sicoob.com.br/sicoob/cobranca-bancaria/v3',
    'https://api.sicoob.com.br/cobranca-bancaria/v3',
    1,
    datetime('now'),
    datetime('now')
);

-- Inserir Sicoob como PSP para PIX
INSERT OR IGNORE INTO pix_psps (
    id,
    codigo,
    nome,
    tipo,
    url_homologacao,
    url_producao,
    ativo,
    created_at,
    updated_at
) VALUES (
    lower(hex(randomblob(16))),
    'sicoob',
    'Banco Cooperativo Sicoob',
    'banco',
    'https://sandbox.sicoob.com.br/sicoob/pix/v2',
    'https://api.sicoob.com.br/pix/v2',
    1,
    datetime('now'),
    datetime('now')
);

-- =============================================
-- 2. ADICIONAR BANCO DO BRASIL (001)
-- =============================================

INSERT OR IGNORE INTO boleto_bancos (
    id,
    codigo,
    nome,
    nome_curto,
    suporta_api,
    suporta_cnab240,
    suporta_cnab400,
    url_homologacao,
    url_producao,
    ativo,
    created_at,
    updated_at
) VALUES (
    lower(hex(randomblob(16))),
    '001',
    'Banco do Brasil S.A.',
    'BB',
    1,
    1,
    1,
    'https://api.hm.bb.com.br/cobrancas/v2',
    'https://api.bb.com.br/cobrancas/v2',
    1,
    datetime('now'),
    datetime('now')
);

-- Inserir BB como PSP para PIX
INSERT OR IGNORE INTO pix_psps (
    id,
    codigo,
    nome,
    tipo,
    url_homologacao,
    url_producao,
    ativo,
    created_at,
    updated_at
) VALUES (
    lower(hex(randomblob(16))),
    'bb',
    'Banco do Brasil S.A.',
    'banco',
    'https://api.hm.bb.com.br/pix/v2',
    'https://api.bb.com.br/pix/v2',
    1,
    datetime('now'),
    datetime('now')
);

-- =============================================
-- 3. ADICIONAR CAIXA ECONÔMICA FEDERAL (104)
-- =============================================

INSERT OR IGNORE INTO boleto_bancos (
    id,
    codigo,
    nome,
    nome_curto,
    suporta_api,
    suporta_cnab240,
    suporta_cnab400,
    url_homologacao,
    url_producao,
    ativo,
    created_at,
    updated_at
) VALUES (
    lower(hex(randomblob(16))),
    '104',
    'Caixa Econômica Federal',
    'Caixa',
    1,
    1,
    1,
    'https://apihom.caixa.gov.br/cobranca-bancaria/v2',
    'https://api.caixa.gov.br/cobranca-bancaria/v2',
    1,
    datetime('now'),
    datetime('now')
);

-- Inserir Caixa como PSP para PIX
INSERT OR IGNORE INTO pix_psps (
    id,
    codigo,
    nome,
    tipo,
    url_homologacao,
    url_producao,
    ativo,
    created_at,
    updated_at
) VALUES (
    lower(hex(randomblob(16))),
    'caixa',
    'Caixa Econômica Federal',
    'banco',
    'https://apihom.caixa.gov.br/pix/v2',
    'https://api.caixa.gov.br/pix/v2',
    1,
    datetime('now'),
    datetime('now')
);

-- =============================================
-- 4. ADICIONAR BANCO SAFRA (422)
-- =============================================

INSERT OR IGNORE INTO boleto_bancos (
    id,
    codigo,
    nome,
    nome_curto,
    suporta_api,
    suporta_cnab240,
    suporta_cnab400,
    url_homologacao,
    url_producao,
    ativo,
    created_at,
    updated_at
) VALUES (
    lower(hex(randomblob(16))),
    '422',
    'Banco Safra S.A.',
    'Safra',
    1,
    1,
    1,
    'https://api-sandbox.safra.com.br/cobranca/v1',
    'https://api.safra.com.br/cobranca/v1',
    1,
    datetime('now'),
    datetime('now')
);

-- Inserir Safra como PSP para PIX
INSERT OR IGNORE INTO pix_psps (
    id,
    codigo,
    nome,
    tipo,
    url_homologacao,
    url_producao,
    ativo,
    created_at,
    updated_at
) VALUES (
    lower(hex(randomblob(16))),
    'safra',
    'Banco Safra S.A.',
    'banco',
    'https://api-sandbox.safra.com.br/pix/v1',
    'https://api.safra.com.br/pix/v1',
    1,
    datetime('now'),
    datetime('now')
);

-- =============================================
-- 5. ADICIONAR CAMPOS PARA OAUTH2 E mTLS
-- =============================================

-- Adicionar campo para Developer Application Key (BB)
ALTER TABLE boleto_contas ADD COLUMN api_developer_key TEXT;

-- Adicionar campo para certificado PEM (mTLS)
ALTER TABLE boleto_contas ADD COLUMN certificado_pem TEXT;

-- Adicionar campo para chave privada PEM (mTLS)
ALTER TABLE boleto_contas ADD COLUMN chave_privada_pem TEXT;

-- Adicionar campo para código do beneficiário (Caixa)
ALTER TABLE boleto_contas ADD COLUMN codigo_beneficiario TEXT;

-- Adicionar campo para variação da carteira (BB, Sicoob)
ALTER TABLE boleto_contas ADD COLUMN variacao_carteira TEXT;

-- Adicionar campo para escopo OAuth2
ALTER TABLE boleto_contas ADD COLUMN oauth_scope TEXT;

-- =============================================
-- 6. ADICIONAR CAMPOS PARA PIX
-- =============================================

-- Adicionar campo para chave PIX da conta
ALTER TABLE boleto_contas ADD COLUMN chave_pix TEXT;

-- Adicionar campo para tipo da chave PIX (cpf, cnpj, email, telefone, evp)
ALTER TABLE boleto_contas ADD COLUMN tipo_chave_pix TEXT;

-- =============================================
-- COMENTÁRIOS PARA DESENVOLVEDORES
-- =============================================
-- 
-- BANCOS ADICIONADOS:
-- - Sicoob (756): OAuth2 + mTLS, Boleto Híbrido com PIX
-- - Banco do Brasil (001): OAuth2 + Developer Key, PIX integrado
-- - Caixa (104): OAuth2 + Certificado, SIGCB
-- - Safra (422): OAuth2 + Certificado
--
-- AUTENTICAÇÃO:
-- - Sicoob: OAuth2 client_credentials + mTLS
-- - BB: OAuth2 client_credentials + gw-dev-app-key
-- - Caixa: OAuth2 client_credentials + certificado
-- - Safra: OAuth2 client_credentials + certificado
--
-- CAMPOS ADICIONADOS:
-- - boleto_contas.api_developer_key: Developer Key (BB)
-- - boleto_contas.certificado_pem: Certificado para mTLS
-- - boleto_contas.chave_privada_pem: Chave privada para mTLS
-- - boleto_contas.codigo_beneficiario: Código do beneficiário (Caixa)
-- - boleto_contas.variacao_carteira: Variação da carteira (BB, Sicoob)
-- - boleto_contas.oauth_scope: Escopo OAuth2
-- - boleto_contas.chave_pix: Chave PIX da conta
-- - boleto_contas.tipo_chave_pix: Tipo da chave PIX
--
-- CONFIGURAÇÃO:
-- - Credenciais OAuth2 em boleto_contas (api_client_id, api_client_secret)
-- - Certificados em boleto_contas (certificado_pem, chave_privada_pem)
-- - Webhook em boleto_contas (webhook_url, webhook_symmetric_key, webhook_ativo)
--
-- =============================================
