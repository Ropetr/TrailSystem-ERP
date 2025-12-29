-- =============================================
-- PLANAC ERP - Migration 0015
-- Integração: Configuração ACBr API/Microserviço
-- =============================================
-- Criado em: 28/12/2025
-- Descrição: Tabelas para configuração centralizada
--            da integração com ACBr (API SaaS e Microserviço)
-- =============================================

-- =============================================
-- 1. CONFIGURAÇÃO GLOBAL ACBr
-- =============================================
CREATE TABLE IF NOT EXISTS acbr_configuracoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Tipo de integração
    tipo_integracao TEXT NOT NULL DEFAULT 'api' CHECK (tipo_integracao IN (
        'api',              -- ACBr API SaaS (https://www.acbr.api.br)
        'microservico',     -- Microserviço Docker próprio
        'hibrido'           -- Usa API para alguns módulos e microserviço para outros
    )),
    
    -- ACBr API SaaS
    api_url TEXT DEFAULT 'https://api.acbr.api.br',
    api_client_id TEXT,
    api_client_secret_encrypted TEXT,
    api_client_secret_iv TEXT,
    api_access_token_encrypted TEXT,
    api_access_token_iv TEXT,
    api_refresh_token_encrypted TEXT,
    api_refresh_token_iv TEXT,
    api_token_expira_em TEXT,
    
    -- Microserviço (se aplicável)
    microservico_url TEXT,                  -- URL do microserviço Docker
    microservico_api_key_encrypted TEXT,
    microservico_api_key_iv TEXT,
    
    -- Ambiente padrão
    ambiente_padrao TEXT DEFAULT 'homologacao' CHECK (ambiente_padrao IN ('homologacao', 'producao')),
    
    -- Módulos habilitados (JSON array)
    modulos_habilitados TEXT DEFAULT '["nfe", "nfse"]',
    
    -- Configurações de retry
    max_tentativas INTEGER DEFAULT 3,
    intervalo_retry INTEGER DEFAULT 5000,   -- Milissegundos
    
    -- Timeout
    timeout_padrao INTEGER DEFAULT 30000,   -- Milissegundos
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id)
);

CREATE INDEX idx_acbr_config_empresa ON acbr_configuracoes(empresa_id);

-- =============================================
-- 2. CERTIFICADOS DIGITAIS (Complemento)
-- =============================================
-- Nota: A tabela empresas_certificados já existe em certificados.sql
-- Esta tabela armazena configurações adicionais para uso com ACBr
CREATE TABLE IF NOT EXISTS acbr_certificados_config (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    certificado_id INTEGER REFERENCES empresas_certificados(id),
    
    -- Uso do certificado
    uso TEXT NOT NULL CHECK (uso IN (
        'nfe',              -- NF-e/NFC-e
        'nfse',             -- NFS-e
        'cte',              -- CT-e
        'mdfe',             -- MDF-e
        'esocial',          -- eSocial
        'reinf',            -- EFD-Reinf
        'sped',             -- SPED (assinatura)
        'boleto',           -- Boletos (API bancária)
        'pix'               -- PIX (mTLS)
    )),
    
    -- Configurações específicas
    ambiente TEXT DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao')),
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, uso, ambiente)
);

CREATE INDEX idx_acbr_cert_config_empresa ON acbr_certificados_config(empresa_id);
CREATE INDEX idx_acbr_cert_config_uso ON acbr_certificados_config(uso);

-- =============================================
-- 3. FILAS DE PROCESSAMENTO ACBr
-- =============================================
-- Fila para processamento assíncrono de operações ACBr
CREATE TABLE IF NOT EXISTS acbr_filas (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Identificação
    tipo_operacao TEXT NOT NULL,            -- emissao_nfe, consulta_dfe, envio_boleto, etc.
    modulo TEXT NOT NULL,                   -- nfe, nfse, cte, boleto, pix, sped, esocial, reinf
    
    -- Prioridade
    prioridade INTEGER DEFAULT 5,           -- 1=Máxima, 10=Mínima
    
    -- Dados da operação (JSON)
    payload TEXT NOT NULL,
    
    -- Referência ao registro original
    referencia_tipo TEXT,                   -- nfe_emitida, boleto_titulo, etc.
    referencia_id TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
        'pendente',
        'processando',
        'sucesso',
        'erro',
        'cancelado'
    )),
    
    -- Tentativas
    tentativas INTEGER DEFAULT 0,
    max_tentativas INTEGER DEFAULT 3,
    proxima_tentativa TEXT,
    
    -- Resultado
    resultado TEXT,                         -- JSON com resultado
    erro_mensagem TEXT,
    erro_codigo TEXT,
    
    -- Agendamento
    agendar_para TEXT,                      -- Data/hora para processar
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    processed_at TEXT
);

CREATE INDEX idx_acbr_filas_empresa ON acbr_filas(empresa_id);
CREATE INDEX idx_acbr_filas_status ON acbr_filas(status);
CREATE INDEX idx_acbr_filas_modulo ON acbr_filas(modulo);
CREATE INDEX idx_acbr_filas_prioridade ON acbr_filas(prioridade);
CREATE INDEX idx_acbr_filas_proxima ON acbr_filas(proxima_tentativa);

-- =============================================
-- 4. CACHE DE CONSULTAS ACBr
-- =============================================
-- Cache para consultas frequentes (CEP, CNPJ, NCM, etc.)
CREATE TABLE IF NOT EXISTS acbr_cache (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    -- Tipo de cache
    tipo TEXT NOT NULL,                     -- cep, cnpj, ncm, ibpt, municipio
    
    -- Chave de busca
    chave TEXT NOT NULL,                    -- CEP, CNPJ, código NCM, etc.
    
    -- Dados cacheados (JSON)
    dados TEXT NOT NULL,
    
    -- Validade
    expira_em TEXT NOT NULL,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(tipo, chave)
);

CREATE INDEX idx_acbr_cache_tipo ON acbr_cache(tipo);
CREATE INDEX idx_acbr_cache_chave ON acbr_cache(chave);
CREATE INDEX idx_acbr_cache_expira ON acbr_cache(expira_em);

-- =============================================
-- 5. WEBHOOKS ACBr
-- =============================================
-- Configuração de webhooks para receber notificações
CREATE TABLE IF NOT EXISTS acbr_webhooks_config (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Tipo de webhook
    tipo TEXT NOT NULL,                     -- dfe_recebido, boleto_pago, pix_recebido, etc.
    
    -- URL de callback
    url TEXT NOT NULL,
    
    -- Autenticação
    auth_type TEXT DEFAULT 'none' CHECK (auth_type IN ('none', 'basic', 'bearer', 'hmac')),
    auth_credentials_encrypted TEXT,
    auth_credentials_iv TEXT,
    
    -- Headers adicionais (JSON)
    headers TEXT,
    
    -- Filtros (JSON - quais eventos receber)
    filtros TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_acbr_webhooks_empresa ON acbr_webhooks_config(empresa_id);
CREATE INDEX idx_acbr_webhooks_tipo ON acbr_webhooks_config(tipo);

-- =============================================
-- 6. LOG GERAL DE OPERAÇÕES ACBr
-- =============================================
CREATE TABLE IF NOT EXISTS acbr_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Operação
    modulo TEXT NOT NULL,                   -- nfe, nfse, cte, boleto, pix, sped, esocial, reinf, dfe
    operacao TEXT NOT NULL,                 -- emissao, consulta, cancelamento, etc.
    
    -- Referência
    referencia_tipo TEXT,
    referencia_id TEXT,
    
    -- Resultado
    sucesso INTEGER DEFAULT 1,
    codigo_status TEXT,
    mensagem TEXT,
    
    -- Tempo de execução
    tempo_execucao_ms INTEGER,
    
    -- Request/Response (armazenados no R2)
    request_storage_key TEXT,
    response_storage_key TEXT,
    
    -- Dados resumidos (para queries rápidas)
    request_resumo TEXT,                    -- JSON com dados principais do request
    response_resumo TEXT,                   -- JSON com dados principais do response
    
    -- IP e User Agent (para auditoria)
    ip_origem TEXT,
    user_agent TEXT,
    
    -- Usuário
    usuario_id TEXT REFERENCES usuarios(id),
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_acbr_logs_empresa ON acbr_logs(empresa_id);
CREATE INDEX idx_acbr_logs_modulo ON acbr_logs(modulo);
CREATE INDEX idx_acbr_logs_operacao ON acbr_logs(operacao);
CREATE INDEX idx_acbr_logs_sucesso ON acbr_logs(sucesso);
CREATE INDEX idx_acbr_logs_data ON acbr_logs(created_at);
CREATE INDEX idx_acbr_logs_referencia ON acbr_logs(referencia_tipo, referencia_id);

-- =============================================
-- 7. MÉTRICAS E ESTATÍSTICAS ACBr
-- =============================================
CREATE TABLE IF NOT EXISTS acbr_metricas (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Período
    data TEXT NOT NULL,                     -- YYYY-MM-DD
    
    -- Módulo
    modulo TEXT NOT NULL,
    
    -- Contadores
    total_operacoes INTEGER DEFAULT 0,
    operacoes_sucesso INTEGER DEFAULT 0,
    operacoes_erro INTEGER DEFAULT 0,
    
    -- Tempo médio (ms)
    tempo_medio_ms INTEGER DEFAULT 0,
    tempo_maximo_ms INTEGER DEFAULT 0,
    tempo_minimo_ms INTEGER DEFAULT 0,
    
    -- Custos (se aplicável - ACBr API SaaS)
    creditos_consumidos INTEGER DEFAULT 0,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, data, modulo)
);

CREATE INDEX idx_acbr_metricas_empresa ON acbr_metricas(empresa_id);
CREATE INDEX idx_acbr_metricas_data ON acbr_metricas(data);
CREATE INDEX idx_acbr_metricas_modulo ON acbr_metricas(modulo);

-- =============================================
-- 8. CONTINGÊNCIA (Modo offline/fallback)
-- =============================================
CREATE TABLE IF NOT EXISTS acbr_contingencia (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Módulo
    modulo TEXT NOT NULL,                   -- nfe, nfse, cte, etc.
    
    -- Status da contingência
    ativo INTEGER DEFAULT 0,
    motivo TEXT,
    
    -- Tipo de contingência (para NF-e)
    tipo_contingencia TEXT,                 -- SCAN, DPEC, FSDA, SVCAN, SVCRS, EPEC
    
    -- Datas
    inicio TEXT,
    fim TEXT,
    
    -- Justificativa
    justificativa TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_acbr_contingencia_empresa ON acbr_contingencia(empresa_id);
CREATE INDEX idx_acbr_contingencia_modulo ON acbr_contingencia(modulo);
CREATE INDEX idx_acbr_contingencia_ativo ON acbr_contingencia(ativo);

-- =============================================
-- COMENTÁRIOS PARA DESENVOLVEDORES
-- =============================================
-- 
-- ARQUITETURA DE INTEGRAÇÃO:
-- 
-- Opção 1: ACBr API SaaS (Recomendado para início)
--   - URL: https://www.acbr.api.br
--   - Autenticação: OAuth 2.0
--   - Suporta: NF-e, NFC-e, NFS-e, CT-e, MDF-e
--   - Preço: A partir de R$ 42/mês
--   - Vantagem: Zero infraestrutura, pronto para usar
--
-- Opção 2: Microserviço Docker
--   - Imagem: Projeto-ACBr-Oficial/Docker
--   - Deploy: Fly.io, AWS ECS, GCP Cloud Run
--   - Suporta: Todos os módulos ACBr
--   - Vantagem: Sem limites de operações, mais controle
--
-- Opção 3: Híbrido
--   - ACBr API para módulos comuns (NF-e, NFS-e)
--   - Microserviço para módulos não suportados (SPED, eSocial)
--
-- FLUXO DE AUTENTICAÇÃO ACBr API:
-- 1. Obter access_token via OAuth 2.0
-- 2. Armazenar tokens criptografados
-- 3. Renovar automaticamente antes de expirar
-- 4. Usar access_token em todas as requisições
--
-- FILA DE PROCESSAMENTO:
-- - Usar Cloudflare Queues ou D1 polling
-- - Processar operações assíncronas
-- - Implementar retry com backoff exponencial
-- - Notificar via webhook quando concluído
--
-- CACHE:
-- - CEP: 30 dias
-- - CNPJ: 7 dias
-- - NCM: 30 dias
-- - IBPT: 30 dias (ou até nova tabela)
-- - Municípios: 90 dias
--
-- MÉTRICAS:
-- - Agregar diariamente para relatórios
-- - Monitorar consumo de créditos (API SaaS)
-- - Alertar sobre erros frequentes
--
-- CONTINGÊNCIA:
-- - Ativar automaticamente quando SEFAZ indisponível
-- - Registrar justificativa
-- - Processar documentos em contingência
-- - Transmitir quando normalizar
-- =============================================
