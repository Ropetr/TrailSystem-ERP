-- =============================================
-- PLANAC ERP - Migration 0042
-- Cosmos/Bluesoft Integration
-- Cadastro automático de produtos via GTIN
-- =============================================
-- Criado em: 29/12/2025
-- Descrição: Tabelas para integração com API Cosmos
--            para enriquecimento de cadastro de produtos
-- =============================================

-- =============================================
-- 1. CONFIGURAÇÃO COSMOS POR EMPRESA
-- =============================================
CREATE TABLE IF NOT EXISTS cosmos_config (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Configuração da API
    habilitado INTEGER DEFAULT 1,
    ambiente TEXT DEFAULT 'producao',
    
    -- Cache settings
    cache_ttl_horas INTEGER DEFAULT 168,          -- 7 dias padrão
    auto_enriquecer_cadastro INTEGER DEFAULT 1,   -- Preencher dados automaticamente
    sobrescrever_dados_manuais INTEGER DEFAULT 0, -- Não sobrescrever por padrão
    
    -- Limites
    limite_consultas_dia INTEGER DEFAULT 1000,
    consultas_hoje INTEGER DEFAULT 0,
    data_reset_limite TEXT,
    
    -- Campos a preencher automaticamente
    preencher_descricao INTEGER DEFAULT 1,
    preencher_ncm INTEGER DEFAULT 1,
    preencher_marca INTEGER DEFAULT 1,
    preencher_categoria INTEGER DEFAULT 1,
    preencher_dimensoes INTEGER DEFAULT 1,
    preencher_preco_medio INTEGER DEFAULT 0,      -- Desabilitado por padrão
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    
    UNIQUE(empresa_id)
);

CREATE INDEX IF NOT EXISTS idx_cosmos_config_empresa ON cosmos_config(empresa_id);

-- =============================================
-- 2. CACHE DE PRODUTOS COSMOS
-- =============================================
-- Armazena respostas da API para evitar consultas repetidas
CREATE TABLE IF NOT EXISTS cosmos_cache (
    id TEXT PRIMARY KEY,
    empresa_id TEXT,                              -- NULL = cache global
    
    -- Identificação
    gtin TEXT NOT NULL,
    
    -- Dados do produto
    descricao TEXT,
    thumbnail TEXT,
    
    -- Dimensões
    largura REAL,
    altura REAL,
    comprimento REAL,
    peso_liquido REAL,
    peso_bruto REAL,
    
    -- Preços
    preco_medio REAL,
    preco_minimo REAL,
    preco_maximo REAL,
    
    -- Classificação fiscal
    ncm_codigo TEXT,
    ncm_descricao TEXT,
    ncm_descricao_completa TEXT,
    ncm_ex TEXT,
    
    -- Marca e categoria
    marca_nome TEXT,
    marca_imagem TEXT,
    categoria_id INTEGER,
    categoria_descricao TEXT,
    categoria_pai_id INTEGER,
    
    -- GPC (Global Product Classification)
    gpc_codigo TEXT,
    gpc_descricao TEXT,
    
    -- GTINs alternativos (JSON array)
    gtins_alternativos TEXT,
    
    -- Origem e controle
    origem TEXT DEFAULT 'cosmos',
    response_json TEXT,                           -- Resposta completa para debug
    
    -- Cache control
    fetched_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    hit_count INTEGER DEFAULT 0,
    
    -- Status
    status_code INTEGER,
    erro TEXT,
    
    created_at TEXT,
    updated_at TEXT,
    
    UNIQUE(gtin)
);

CREATE INDEX IF NOT EXISTS idx_cosmos_cache_gtin ON cosmos_cache(gtin);
CREATE INDEX IF NOT EXISTS idx_cosmos_cache_ncm ON cosmos_cache(ncm_codigo);
CREATE INDEX IF NOT EXISTS idx_cosmos_cache_expires ON cosmos_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_cosmos_cache_marca ON cosmos_cache(marca_nome);

-- =============================================
-- 3. JOBS DE IMPORTAÇÃO/SINCRONIZAÇÃO
-- =============================================
-- Para enriquecimento em lote de produtos
CREATE TABLE IF NOT EXISTS cosmos_sync_jobs (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Tipo de job
    tipo TEXT NOT NULL,                           -- 'enriquecimento_lote', 'atualizacao_cache', 'importacao_nfe'
    
    -- Parâmetros
    filtro_produtos TEXT,                         -- JSON com filtros (categoria, sem_ncm, etc)
    gtins_lista TEXT,                             -- Lista de GTINs específicos
    
    -- Progresso
    status TEXT DEFAULT 'pendente',               -- pendente, processando, concluido, erro, cancelado
    total_itens INTEGER DEFAULT 0,
    itens_processados INTEGER DEFAULT 0,
    itens_sucesso INTEGER DEFAULT 0,
    itens_erro INTEGER DEFAULT 0,
    itens_cache_hit INTEGER DEFAULT 0,
    
    -- Timing
    data_inicio TEXT,
    data_fim TEXT,
    tempo_execucao_ms INTEGER,
    
    -- Resultado
    log_processamento TEXT,
    erros TEXT,                                   -- JSON array de erros
    
    -- Controle
    usuario_id TEXT,
    created_at TEXT,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_cosmos_jobs_empresa ON cosmos_sync_jobs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cosmos_jobs_status ON cosmos_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_cosmos_jobs_tipo ON cosmos_sync_jobs(tipo);

-- =============================================
-- 4. VÍNCULO PRODUTO-COSMOS
-- =============================================
-- Liga produtos internos aos dados do Cosmos
CREATE TABLE IF NOT EXISTS cosmos_product_links (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    
    -- GTINs
    gtin_principal TEXT NOT NULL,
    gtins_alternativos TEXT,                      -- JSON array
    
    -- Origem dos dados por campo
    origem_descricao TEXT DEFAULT 'manual',       -- cosmos, nfe, manual
    origem_ncm TEXT DEFAULT 'manual',
    origem_marca TEXT DEFAULT 'manual',
    origem_categoria TEXT DEFAULT 'manual',
    origem_dimensoes TEXT DEFAULT 'manual',
    
    -- Última sincronização
    ultima_sync TEXT,
    sync_status TEXT,                             -- sucesso, erro, pendente
    sync_erro TEXT,
    
    -- Controle de alterações
    dados_cosmos_alterados INTEGER DEFAULT 0,     -- Flag se Cosmos tem dados diferentes
    data_verificacao TEXT,
    
    created_at TEXT,
    updated_at TEXT,
    
    UNIQUE(empresa_id, produto_id),
    UNIQUE(empresa_id, gtin_principal)
);

CREATE INDEX IF NOT EXISTS idx_cosmos_links_produto ON cosmos_product_links(produto_id);
CREATE INDEX IF NOT EXISTS idx_cosmos_links_gtin ON cosmos_product_links(gtin_principal);
CREATE INDEX IF NOT EXISTS idx_cosmos_links_empresa ON cosmos_product_links(empresa_id);

-- =============================================
-- 5. LOG DE CONSULTAS COSMOS
-- =============================================
CREATE TABLE IF NOT EXISTS cosmos_logs (
    id TEXT PRIMARY KEY,
    empresa_id TEXT,
    
    -- Request
    gtin TEXT NOT NULL,
    endpoint TEXT,
    
    -- Response
    status_code INTEGER,
    tempo_resposta_ms INTEGER,
    cache_hit INTEGER DEFAULT 0,
    
    -- Resultado
    sucesso INTEGER DEFAULT 0,
    erro_mensagem TEXT,
    erro_codigo TEXT,
    
    -- Contexto
    origem TEXT,                                  -- cadastro_produto, importacao_nfe, sync_job, manual
    job_id TEXT,
    usuario_id TEXT,
    
    created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_cosmos_logs_empresa ON cosmos_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cosmos_logs_gtin ON cosmos_logs(gtin);
CREATE INDEX IF NOT EXISTS idx_cosmos_logs_data ON cosmos_logs(created_at);
