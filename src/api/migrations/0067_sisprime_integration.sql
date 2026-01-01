-- =============================================
-- PLANAC ERP - Migration 0067
-- Integração Sisprime (Banco 084)
-- =============================================
-- Criado em: 01/01/2026
-- Descrição: Adiciona banco Sisprime e configurações
--            para integração via API CobExpress
-- =============================================

-- =============================================
-- 1. ADICIONAR BANCO SISPRIME
-- =============================================

-- Inserir Sisprime na tabela de bancos (se não existir)
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
    '084',
    'Sisprime do Brasil',
    'Sisprime',
    1,
    1,
    1,
    'https://homologa-ws.cobexpress.com.br/webservice',
    'https://sisprimebr.cobexpress.com.br/webservice',
    1,
    datetime('now'),
    datetime('now')
);

-- =============================================
-- 2. ADICIONAR CAMPOS ESPECÍFICOS PARA SISPRIME
-- =============================================

-- Adicionar campo para ID externo do boleto (id_boleto do Sisprime)
-- Este campo armazena o identificador único retornado pela API
ALTER TABLE boleto_titulos ADD COLUMN id_externo TEXT;

-- Adicionar campo para QR Code PIX (payload copia e cola)
-- O Sisprime retorna o QR Code PIX no webhook quando habilitado
ALTER TABLE boleto_titulos ADD COLUMN qr_code_pix TEXT;

-- Adicionar campo para chave simétrica do webhook (por conta)
-- Cada conta pode ter uma chave diferente para decriptação
ALTER TABLE boleto_contas ADD COLUMN webhook_symmetric_key TEXT;

-- Adicionar campo para URL do webhook (por conta)
-- Permite configurar webhook específico por conta
ALTER TABLE boleto_contas ADD COLUMN webhook_url TEXT;

-- Adicionar campo para status do webhook (ativo/inativo)
ALTER TABLE boleto_contas ADD COLUMN webhook_ativo INTEGER DEFAULT 0;

-- =============================================
-- 3. CRIAR ÍNDICES
-- =============================================

-- Índice para busca por ID externo (id_boleto do Sisprime)
CREATE INDEX IF NOT EXISTS idx_boleto_titulos_id_externo ON boleto_titulos(id_externo);

-- =============================================
-- 4. ADICIONAR PSP SISPRIME PARA PIX
-- =============================================

-- Inserir Sisprime como PSP para PIX (se não existir)
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
    'sisprime',
    'Sisprime do Brasil',
    'banco',
    'https://homologa-ws.cobexpress.com.br/webservice',
    'https://sisprimebr.cobexpress.com.br/webservice',
    1,
    datetime('now'),
    datetime('now')
);

-- =============================================
-- COMENTÁRIOS PARA DESENVOLVEDORES
-- =============================================
-- 
-- INTEGRAÇÃO SISPRIME:
-- - API REST com autenticação JWT (HS512)
-- - Duas chaves: geral (assinatura) e conta (payload)
-- - Endpoints: enviarboleto, consultarboleto
-- - Webhooks criptografados com AES-256-CBC
--
-- CAMPOS ADICIONADOS:
-- - boleto_titulos.id_externo: ID do boleto no Sisprime
-- - boleto_titulos.qr_code_pix: Payload do QR Code PIX
-- - boleto_contas.webhook_symmetric_key: Chave para decriptar webhooks
-- - boleto_contas.webhook_url: URL do webhook configurado
-- - boleto_contas.webhook_ativo: Status do webhook
--
-- CONFIGURAÇÃO:
-- - Credenciais armazenadas em boleto_contas (api_client_id, api_client_secret)
-- - Para Sisprime: api_client_id = chave_acesso_geral
-- - Para Sisprime: api_client_secret = chave_acesso_conta
--
-- =============================================
