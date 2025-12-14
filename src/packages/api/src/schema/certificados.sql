-- =============================================
-- PLANAC ERP - Certificados Digitais Schema
-- Multi-tenant ready para comercialização SaaS
-- =============================================

-- Tabela de certificados digitais das empresas
CREATE TABLE IF NOT EXISTS empresas_certificados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Identificação da empresa
    cnpj TEXT NOT NULL,
    
    -- Tipo do certificado
    tipo TEXT DEFAULT 'A1',               -- A1 (arquivo .pfx) ou A3 (token/cartão)
    nome_arquivo TEXT,                    -- Nome original do arquivo
    hash_arquivo TEXT,                    -- Hash SHA256 para verificação de integridade
    
    -- Dados extraídos do certificado (preenchidos após validação)
    serial_number TEXT,                   -- Número de série único
    subject TEXT,                         -- DN do titular (Distinguished Name)
    issuer TEXT,                          -- DN da Autoridade Certificadora
    razao_social_certificado TEXT,        -- Razão social extraída do certificado
    cnpj_certificado TEXT,                -- CNPJ extraído do certificado
    
    -- Validade
    validade_inicio TEXT,                 -- Data início validade (ISO 8601)
    validade_fim TEXT,                    -- Data fim validade (ISO 8601)
    dias_para_vencer INTEGER,             -- Dias restantes (atualizado por job)
    
    -- Armazenamento seguro
    r2_key TEXT,                          -- Chave do arquivo no R2 Bucket
    nuvem_fiscal_sync INTEGER DEFAULT 0,  -- Sincronizado com Nuvem Fiscal? 0=Não, 1=Sim
    nuvem_fiscal_sync_at TEXT,            -- Data/hora da última sincronização
    
    -- Segurança da senha (AES-256-GCM)
    senha_encrypted TEXT,                 -- Senha criptografada
    senha_iv TEXT,                        -- IV (Initialization Vector) para decriptação
    
    -- Status do certificado
    status TEXT DEFAULT 'pendente',       -- pendente, ativo, expirado, revogado
    principal INTEGER DEFAULT 0,          -- É o certificado principal da empresa? 0=Não, 1=Sim
    
    -- Auditoria
    uploaded_by TEXT,                     -- ID do usuário que fez upload
    uploaded_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    -- Multi-tenant (essencial para comercialização SaaS)
    tenant_id TEXT,                       -- ID do tenant/cliente
    
    -- Garantir que não haja duplicatas por número de série
    UNIQUE(cnpj, serial_number)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cert_cnpj ON empresas_certificados(cnpj);
CREATE INDEX IF NOT EXISTS idx_cert_status ON empresas_certificados(status);
CREATE INDEX IF NOT EXISTS idx_cert_validade ON empresas_certificados(validade_fim);
CREATE INDEX IF NOT EXISTS idx_cert_tenant ON empresas_certificados(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cert_principal ON empresas_certificados(cnpj, principal);
CREATE INDEX IF NOT EXISTS idx_cert_vencimento ON empresas_certificados(dias_para_vencer);

-- =============================================
-- COMENTÁRIOS PARA DESENVOLVEDORES
-- =============================================
-- 
-- SEGURANÇA:
-- 1. O arquivo .pfx é armazenado no R2 (object storage)
-- 2. A senha é criptografada com AES-256-GCM usando chave derivada (PBKDF2)
-- 3. Cada tenant tem isolamento de dados via tenant_id
-- 4. Nunca expor senha_encrypted ou senha_iv via API
--
-- MULTI-TENANT:
-- 1. Sempre filtrar queries por tenant_id em ambiente SaaS
-- 2. Usar o tenant_id do contexto autenticado
-- 3. Validar permissões antes de acessar certificados de outras empresas
--
-- JOBS NECESSÁRIOS:
-- 1. Atualizar dias_para_vencer diariamente
-- 2. Enviar alertas de vencimento (30, 15, 7, 1 dias)
-- 3. Marcar certificados expirados automaticamente
--
-- INTEGRAÇÃO NUVEM FISCAL:
-- 1. Após upload, sincronizar automaticamente
-- 2. Extrair informações do certificado via API
-- 3. Manter flag de sincronização atualizado
-- =============================================
