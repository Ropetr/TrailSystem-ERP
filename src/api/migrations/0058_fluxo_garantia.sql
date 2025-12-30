-- =============================================
-- TRAILSYSTEM ERP - Migration 0058
-- Fluxo de Garantia de Produtos
-- Criado em: 2025-12-30
-- =============================================

-- =============================================
-- TABELA: garantias (chamados de garantia)
-- =============================================
CREATE TABLE IF NOT EXISTS garantias (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    numero TEXT NOT NULL,
    
    -- Cliente
    cliente_id TEXT REFERENCES clientes(id),
    cliente_nome TEXT,
    cliente_documento TEXT,
    cliente_telefone TEXT,
    cliente_email TEXT,
    
    -- Produto
    produto_id TEXT REFERENCES produtos(id),
    produto_codigo TEXT,
    produto_nome TEXT,
    numero_serie TEXT,
    
    -- Origem da compra
    nfe_origem_id TEXT,
    nfe_origem_numero TEXT,
    nfe_origem_chave TEXT,
    data_compra TEXT,
    
    -- Garantia
    prazo_garantia_meses INTEGER DEFAULT 12,
    data_fim_garantia TEXT,
    garantia_valida INTEGER DEFAULT 0,
    
    -- Chamado
    data_abertura TEXT NOT NULL,
    descricao_defeito TEXT NOT NULL,
    fotos_urls TEXT,
    
    -- Status do chamado
    status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN (
        'aberto',
        'aguardando_documentacao',
        'em_analise',
        'defeito_confirmado',
        'defeito_nao_confirmado',
        'aguardando_resolucao',
        'em_reparo',
        'em_troca',
        'em_devolucao',
        'enviado_fabricante',
        'aguardando_fabricante',
        'resolvido',
        'cancelado',
        'garantia_expirada',
        'garantia_negada'
    )),
    
    -- Resolucao
    tipo_resolucao TEXT CHECK (tipo_resolucao IN (
        'reparo',
        'troca',
        'devolucao_valor',
        'envio_fabricante',
        'reparo_pago',
        'sem_resolucao'
    )),
    
    -- Analise tecnica
    tecnico_id TEXT REFERENCES usuarios(id),
    tecnico_nome TEXT,
    data_analise TEXT,
    parecer_tecnico TEXT,
    defeito_confirmado INTEGER,
    motivo_negacao TEXT,
    
    -- Reparo
    data_inicio_reparo TEXT,
    data_fim_reparo TEXT,
    descricao_reparo TEXT,
    custo_reparo REAL DEFAULT 0,
    
    -- Troca
    produto_troca_id TEXT REFERENCES produtos(id),
    produto_troca_codigo TEXT,
    produto_troca_nome TEXT,
    nfe_troca_id TEXT,
    nfe_troca_numero TEXT,
    
    -- Devolucao de valor
    valor_devolucao REAL DEFAULT 0,
    forma_devolucao TEXT,
    credito_id TEXT,
    
    -- Fabricante
    fabricante_protocolo TEXT,
    fabricante_data_envio TEXT,
    fabricante_data_retorno TEXT,
    fabricante_parecer TEXT,
    fabricante_resolveu INTEGER,
    
    -- Entrega ao cliente
    data_entrega_cliente TEXT,
    forma_entrega TEXT,
    
    -- Fechamento
    data_fechamento TEXT,
    motivo_fechamento TEXT,
    satisfacao_cliente INTEGER,
    
    -- Controle
    prioridade TEXT DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
    observacao_interna TEXT,
    criado_por_id TEXT REFERENCES usuarios(id),
    criado_por_nome TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    
    UNIQUE(empresa_id, numero)
);

-- Indices para garantias
CREATE INDEX IF NOT EXISTS idx_garantias_empresa ON garantias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_garantias_cliente ON garantias(cliente_id);
CREATE INDEX IF NOT EXISTS idx_garantias_produto ON garantias(produto_id);
CREATE INDEX IF NOT EXISTS idx_garantias_status ON garantias(status);
CREATE INDEX IF NOT EXISTS idx_garantias_numero ON garantias(numero);
CREATE INDEX IF NOT EXISTS idx_garantias_numero_serie ON garantias(numero_serie);
CREATE INDEX IF NOT EXISTS idx_garantias_data_abertura ON garantias(data_abertura);

-- =============================================
-- TABELA: garantias_anexos (fotos e documentos)
-- =============================================
CREATE TABLE IF NOT EXISTS garantias_anexos (
    id TEXT PRIMARY KEY,
    garantia_id TEXT NOT NULL REFERENCES garantias(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('foto_defeito', 'documento', 'nota_fiscal', 'laudo_tecnico', 'outro')),
    nome TEXT NOT NULL,
    url TEXT NOT NULL,
    tamanho_bytes INTEGER,
    mime_type TEXT,
    descricao TEXT,
    enviado_por_id TEXT REFERENCES usuarios(id),
    enviado_por_nome TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_garantias_anexos_garantia ON garantias_anexos(garantia_id);

-- =============================================
-- TABELA: garantias_interacoes (comunicacao com cliente)
-- =============================================
CREATE TABLE IF NOT EXISTS garantias_interacoes (
    id TEXT PRIMARY KEY,
    garantia_id TEXT NOT NULL REFERENCES garantias(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('mensagem_cliente', 'mensagem_interna', 'email', 'telefone', 'whatsapp')),
    direcao TEXT NOT NULL CHECK (direcao IN ('entrada', 'saida')),
    conteudo TEXT NOT NULL,
    usuario_id TEXT REFERENCES usuarios(id),
    usuario_nome TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_garantias_interacoes_garantia ON garantias_interacoes(garantia_id);

-- =============================================
-- TABELA: garantias_historico (auditoria)
-- =============================================
CREATE TABLE IF NOT EXISTS garantias_historico (
    id TEXT PRIMARY KEY,
    garantia_id TEXT NOT NULL REFERENCES garantias(id),
    acao TEXT NOT NULL,
    status_anterior TEXT,
    status_novo TEXT,
    usuario_id TEXT REFERENCES usuarios(id),
    usuario_nome TEXT,
    descricao TEXT,
    dados_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_garantias_historico_garantia ON garantias_historico(garantia_id);

-- =============================================
-- TABELA: config_garantia (configuracoes por empresa)
-- =============================================
CREATE TABLE IF NOT EXISTS config_garantia (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL UNIQUE REFERENCES empresas(id),
    
    -- Prazos padrao
    prazo_garantia_padrao_meses INTEGER DEFAULT 12,
    prazo_analise_dias INTEGER DEFAULT 7,
    prazo_reparo_dias INTEGER DEFAULT 15,
    prazo_fabricante_dias INTEGER DEFAULT 30,
    
    -- Notificacoes
    notificar_cliente_abertura INTEGER DEFAULT 1,
    notificar_cliente_analise INTEGER DEFAULT 1,
    notificar_cliente_resolucao INTEGER DEFAULT 1,
    notificar_responsavel_novo_chamado INTEGER DEFAULT 1,
    
    -- Responsaveis
    responsavel_padrao_id TEXT REFERENCES usuarios(id),
    email_notificacoes TEXT,
    
    -- Politicas
    permitir_reparo_pago INTEGER DEFAULT 1,
    exigir_nota_fiscal INTEGER DEFAULT 1,
    exigir_fotos INTEGER DEFAULT 1,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: produtos_garantia (garantias especificas por produto)
-- =============================================
CREATE TABLE IF NOT EXISTS produtos_garantia (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    
    prazo_garantia_meses INTEGER NOT NULL DEFAULT 12,
    tipo_garantia TEXT DEFAULT 'fabricante' CHECK (tipo_garantia IN ('fabricante', 'loja', 'estendida')),
    condicoes TEXT,
    exclusoes TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(empresa_id, produto_id)
);

CREATE INDEX IF NOT EXISTS idx_produtos_garantia_empresa ON produtos_garantia(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_garantia_produto ON produtos_garantia(produto_id);

-- =============================================
-- VIEW: vw_garantias_abertas
-- =============================================
CREATE VIEW IF NOT EXISTS vw_garantias_abertas AS
SELECT 
    g.*,
    CAST(julianday('now') - julianday(g.data_abertura) AS INTEGER) as dias_aberto,
    CASE 
        WHEN g.status IN ('aberto', 'aguardando_documentacao') THEN 'aguardando_cliente'
        WHEN g.status IN ('em_analise') THEN 'aguardando_analise'
        WHEN g.status IN ('aguardando_resolucao', 'em_reparo', 'em_troca', 'em_devolucao') THEN 'em_andamento'
        WHEN g.status IN ('enviado_fabricante', 'aguardando_fabricante') THEN 'aguardando_fabricante'
        ELSE 'outro'
    END as fase
FROM garantias g
WHERE g.deleted_at IS NULL 
AND g.status NOT IN ('resolvido', 'cancelado', 'garantia_expirada', 'garantia_negada');

-- =============================================
-- VIEW: vw_garantias_por_status
-- =============================================
CREATE VIEW IF NOT EXISTS vw_garantias_por_status AS
SELECT 
    empresa_id,
    status,
    COUNT(*) as quantidade,
    AVG(CAST(julianday('now') - julianday(data_abertura) AS INTEGER)) as media_dias_aberto
FROM garantias
WHERE deleted_at IS NULL
GROUP BY empresa_id, status;

-- =============================================
-- VIEW: vw_garantias_por_produto
-- =============================================
CREATE VIEW IF NOT EXISTS vw_garantias_por_produto AS
SELECT 
    empresa_id,
    produto_id,
    produto_codigo,
    produto_nome,
    COUNT(*) as total_chamados,
    SUM(CASE WHEN defeito_confirmado = 1 THEN 1 ELSE 0 END) as defeitos_confirmados,
    SUM(CASE WHEN tipo_resolucao = 'troca' THEN 1 ELSE 0 END) as trocas,
    SUM(CASE WHEN tipo_resolucao = 'reparo' THEN 1 ELSE 0 END) as reparos,
    SUM(CASE WHEN tipo_resolucao = 'devolucao_valor' THEN 1 ELSE 0 END) as devolucoes
FROM garantias
WHERE deleted_at IS NULL
GROUP BY empresa_id, produto_id, produto_codigo, produto_nome;
