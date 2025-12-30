-- =============================================
-- TRAILSYSTEM ERP - Migration 0065
-- Fluxo de E-commerce com Integracao Nuvem Shop
-- Criado em: 2025-12-30
-- =============================================

-- =============================================
-- TABELA: nuvemshop_lojas (lojas conectadas)
-- =============================================
CREATE TABLE IF NOT EXISTS nuvemshop_lojas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Dados da loja Nuvem Shop
    store_id TEXT NOT NULL,
    store_name TEXT,
    store_url TEXT,
    
    -- Autenticacao OAuth2
    access_token TEXT NOT NULL,
    token_type TEXT DEFAULT 'bearer',
    scope TEXT,
    
    -- Dados adicionais
    email TEXT,
    plano TEXT,
    moeda TEXT DEFAULT 'BRL',
    idioma_principal TEXT DEFAULT 'pt',
    
    -- Configuracoes de sincronizacao
    sync_produtos INTEGER DEFAULT 1,
    sync_estoque INTEGER DEFAULT 1,
    sync_precos INTEGER DEFAULT 1,
    sync_pedidos INTEGER DEFAULT 1,
    sync_clientes INTEGER DEFAULT 1,
    
    -- Mapeamentos
    tabela_preco_id TEXT REFERENCES tabelas_preco(id),
    local_estoque_id TEXT,
    vendedor_padrao_id TEXT REFERENCES usuarios(id),
    
    -- Status
    ativo INTEGER DEFAULT 1,
    ultima_sincronizacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(empresa_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_nuvemshop_lojas_empresa ON nuvemshop_lojas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_nuvemshop_lojas_store ON nuvemshop_lojas(store_id);

-- =============================================
-- TABELA: nuvemshop_produtos (vinculo produtos ERP-Nuvem Shop)
-- =============================================
CREATE TABLE IF NOT EXISTS nuvemshop_produtos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    loja_id TEXT NOT NULL REFERENCES nuvemshop_lojas(id),
    
    -- IDs
    produto_id TEXT NOT NULL REFERENCES produtos(id),
    nuvemshop_product_id TEXT NOT NULL,
    
    -- Dados sincronizados
    nome_nuvemshop TEXT,
    sku_nuvemshop TEXT,
    
    -- Controle de sincronizacao
    sync_nome INTEGER DEFAULT 1,
    sync_descricao INTEGER DEFAULT 1,
    sync_preco INTEGER DEFAULT 1,
    sync_estoque INTEGER DEFAULT 1,
    sync_imagens INTEGER DEFAULT 1,
    
    -- Status
    ativo INTEGER DEFAULT 1,
    ultima_sincronizacao TEXT,
    erro_sincronizacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(loja_id, produto_id),
    UNIQUE(loja_id, nuvemshop_product_id)
);

CREATE INDEX IF NOT EXISTS idx_nuvemshop_produtos_empresa ON nuvemshop_produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_nuvemshop_produtos_loja ON nuvemshop_produtos(loja_id);
CREATE INDEX IF NOT EXISTS idx_nuvemshop_produtos_produto ON nuvemshop_produtos(produto_id);

-- =============================================
-- TABELA: nuvemshop_variacoes (vinculo variacoes)
-- =============================================
CREATE TABLE IF NOT EXISTS nuvemshop_variacoes (
    id TEXT PRIMARY KEY,
    nuvemshop_produto_id TEXT NOT NULL REFERENCES nuvemshop_produtos(id),
    
    -- IDs
    variacao_erp_id TEXT,
    nuvemshop_variant_id TEXT NOT NULL,
    
    -- Dados
    sku TEXT,
    nome TEXT,
    
    -- Estoque
    estoque_nuvemshop INTEGER DEFAULT 0,
    estoque_erp INTEGER DEFAULT 0,
    
    ativo INTEGER DEFAULT 1,
    ultima_sincronizacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(nuvemshop_produto_id, nuvemshop_variant_id)
);

CREATE INDEX IF NOT EXISTS idx_nuvemshop_variacoes_produto ON nuvemshop_variacoes(nuvemshop_produto_id);

-- =============================================
-- TABELA: nuvemshop_categorias (vinculo categorias)
-- =============================================
CREATE TABLE IF NOT EXISTS nuvemshop_categorias (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    loja_id TEXT NOT NULL REFERENCES nuvemshop_lojas(id),
    
    -- IDs
    categoria_id TEXT REFERENCES categorias_produtos(id),
    nuvemshop_category_id TEXT NOT NULL,
    
    -- Dados
    nome_nuvemshop TEXT,
    
    ativo INTEGER DEFAULT 1,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(loja_id, nuvemshop_category_id)
);

CREATE INDEX IF NOT EXISTS idx_nuvemshop_categorias_loja ON nuvemshop_categorias(loja_id);

-- =============================================
-- TABELA: nuvemshop_pedidos (pedidos recebidos)
-- =============================================
CREATE TABLE IF NOT EXISTS nuvemshop_pedidos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    loja_id TEXT NOT NULL REFERENCES nuvemshop_lojas(id),
    
    -- IDs
    nuvemshop_order_id TEXT NOT NULL,
    pedido_venda_id TEXT REFERENCES pedidos_venda(id),
    
    -- Dados do pedido Nuvem Shop
    numero TEXT NOT NULL,
    status_nuvemshop TEXT,
    status_pagamento TEXT,
    status_envio TEXT,
    
    -- Cliente
    cliente_nome TEXT,
    cliente_email TEXT,
    cliente_cpf_cnpj TEXT,
    cliente_telefone TEXT,
    nuvemshop_customer_id TEXT,
    cliente_id TEXT REFERENCES clientes(id),
    
    -- Endereco entrega
    endereco_cep TEXT,
    endereco_rua TEXT,
    endereco_numero TEXT,
    endereco_complemento TEXT,
    endereco_bairro TEXT,
    endereco_cidade TEXT,
    endereco_uf TEXT,
    
    -- Valores
    subtotal REAL DEFAULT 0,
    desconto REAL DEFAULT 0,
    frete REAL DEFAULT 0,
    total REAL DEFAULT 0,
    
    -- Pagamento
    forma_pagamento TEXT,
    gateway TEXT,
    parcelas INTEGER DEFAULT 1,
    
    -- Frete
    transportadora TEXT,
    servico_frete TEXT,
    codigo_rastreio TEXT,
    
    -- Cupom
    cupom_codigo TEXT,
    cupom_desconto REAL DEFAULT 0,
    
    -- Datas Nuvem Shop
    data_pedido TEXT,
    data_pagamento TEXT,
    data_envio TEXT,
    data_entrega TEXT,
    
    -- Status de processamento no ERP
    status_erp TEXT DEFAULT 'pendente' CHECK (status_erp IN (
        'pendente',
        'importado',
        'processando',
        'faturado',
        'enviado',
        'entregue',
        'cancelado',
        'erro'
    )),
    
    erro_processamento TEXT,
    
    -- JSON original
    dados_originais TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(loja_id, nuvemshop_order_id)
);

CREATE INDEX IF NOT EXISTS idx_nuvemshop_pedidos_empresa ON nuvemshop_pedidos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_nuvemshop_pedidos_loja ON nuvemshop_pedidos(loja_id);
CREATE INDEX IF NOT EXISTS idx_nuvemshop_pedidos_status ON nuvemshop_pedidos(status_erp);
CREATE INDEX IF NOT EXISTS idx_nuvemshop_pedidos_data ON nuvemshop_pedidos(data_pedido);
CREATE INDEX IF NOT EXISTS idx_nuvemshop_pedidos_pedido ON nuvemshop_pedidos(pedido_venda_id);

-- =============================================
-- TABELA: nuvemshop_pedidos_itens (itens dos pedidos)
-- =============================================
CREATE TABLE IF NOT EXISTS nuvemshop_pedidos_itens (
    id TEXT PRIMARY KEY,
    pedido_id TEXT NOT NULL REFERENCES nuvemshop_pedidos(id) ON DELETE CASCADE,
    
    -- IDs
    nuvemshop_product_id TEXT,
    nuvemshop_variant_id TEXT,
    produto_id TEXT REFERENCES produtos(id),
    
    -- Dados
    sku TEXT,
    nome TEXT,
    
    quantidade REAL NOT NULL,
    preco_unitario REAL NOT NULL,
    desconto REAL DEFAULT 0,
    total REAL NOT NULL,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nuvemshop_pedidos_itens_pedido ON nuvemshop_pedidos_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_nuvemshop_pedidos_itens_produto ON nuvemshop_pedidos_itens(produto_id);

-- =============================================
-- TABELA: nuvemshop_clientes (vinculo clientes)
-- =============================================
CREATE TABLE IF NOT EXISTS nuvemshop_clientes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    loja_id TEXT NOT NULL REFERENCES nuvemshop_lojas(id),
    
    -- IDs
    cliente_id TEXT REFERENCES clientes(id),
    nuvemshop_customer_id TEXT NOT NULL,
    
    -- Dados
    nome TEXT,
    email TEXT,
    cpf_cnpj TEXT,
    telefone TEXT,
    
    total_pedidos INTEGER DEFAULT 0,
    total_gasto REAL DEFAULT 0,
    
    ativo INTEGER DEFAULT 1,
    ultima_sincronizacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(loja_id, nuvemshop_customer_id)
);

CREATE INDEX IF NOT EXISTS idx_nuvemshop_clientes_empresa ON nuvemshop_clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_nuvemshop_clientes_loja ON nuvemshop_clientes(loja_id);
CREATE INDEX IF NOT EXISTS idx_nuvemshop_clientes_cliente ON nuvemshop_clientes(cliente_id);

-- =============================================
-- TABELA: nuvemshop_webhooks (webhooks configurados)
-- =============================================
CREATE TABLE IF NOT EXISTS nuvemshop_webhooks (
    id TEXT PRIMARY KEY,
    loja_id TEXT NOT NULL REFERENCES nuvemshop_lojas(id),
    
    -- Dados do webhook
    nuvemshop_webhook_id TEXT,
    evento TEXT NOT NULL,
    url TEXT NOT NULL,
    
    ativo INTEGER DEFAULT 1,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(loja_id, evento)
);

CREATE INDEX IF NOT EXISTS idx_nuvemshop_webhooks_loja ON nuvemshop_webhooks(loja_id);

-- =============================================
-- TABELA: nuvemshop_webhooks_log (log de webhooks recebidos)
-- =============================================
CREATE TABLE IF NOT EXISTS nuvemshop_webhooks_log (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    loja_id TEXT NOT NULL REFERENCES nuvemshop_lojas(id),
    
    evento TEXT NOT NULL,
    store_id TEXT,
    
    -- Payload
    payload TEXT,
    
    -- Processamento
    processado INTEGER DEFAULT 0,
    data_processamento TEXT,
    resultado TEXT,
    erro TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nuvemshop_webhooks_log_loja ON nuvemshop_webhooks_log(loja_id);
CREATE INDEX IF NOT EXISTS idx_nuvemshop_webhooks_log_evento ON nuvemshop_webhooks_log(evento);
CREATE INDEX IF NOT EXISTS idx_nuvemshop_webhooks_log_processado ON nuvemshop_webhooks_log(processado);

-- =============================================
-- TABELA: nuvemshop_sync_log (log de sincronizacoes)
-- =============================================
CREATE TABLE IF NOT EXISTS nuvemshop_sync_log (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    loja_id TEXT NOT NULL REFERENCES nuvemshop_lojas(id),
    
    tipo TEXT NOT NULL CHECK (tipo IN (
        'produtos',
        'estoque',
        'precos',
        'pedidos',
        'clientes',
        'categorias'
    )),
    
    direcao TEXT NOT NULL CHECK (direcao IN ('erp_para_nuvemshop', 'nuvemshop_para_erp')),
    
    -- Resultado
    total_itens INTEGER DEFAULT 0,
    itens_sucesso INTEGER DEFAULT 0,
    itens_erro INTEGER DEFAULT 0,
    
    -- Detalhes
    detalhes TEXT,
    erros TEXT,
    
    -- Tempo
    inicio TEXT NOT NULL,
    fim TEXT,
    duracao_segundos INTEGER,
    
    -- Status
    status TEXT DEFAULT 'em_andamento' CHECK (status IN (
        'em_andamento',
        'concluido',
        'concluido_com_erros',
        'erro',
        'cancelado'
    )),
    
    usuario_id TEXT REFERENCES usuarios(id),
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nuvemshop_sync_log_loja ON nuvemshop_sync_log(loja_id);
CREATE INDEX IF NOT EXISTS idx_nuvemshop_sync_log_tipo ON nuvemshop_sync_log(tipo);
CREATE INDEX IF NOT EXISTS idx_nuvemshop_sync_log_status ON nuvemshop_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_nuvemshop_sync_log_data ON nuvemshop_sync_log(created_at);

-- =============================================
-- TABELA: config_ecommerce (configuracoes do modulo)
-- =============================================
CREATE TABLE IF NOT EXISTS config_ecommerce (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL UNIQUE REFERENCES empresas(id),
    
    -- Nuvem Shop
    nuvemshop_client_id TEXT,
    nuvemshop_client_secret TEXT,
    nuvemshop_redirect_url TEXT,
    
    -- Sincronizacao automatica
    sync_automatica INTEGER DEFAULT 1,
    intervalo_sync_minutos INTEGER DEFAULT 15,
    
    -- Pedidos
    importar_pedidos_automatico INTEGER DEFAULT 1,
    criar_cliente_automatico INTEGER DEFAULT 1,
    gerar_pedido_venda_automatico INTEGER DEFAULT 1,
    
    -- Estoque
    reservar_estoque_pedido INTEGER DEFAULT 1,
    baixar_estoque_faturamento INTEGER DEFAULT 1,
    
    -- Precos
    usar_tabela_preco_especifica INTEGER DEFAULT 0,
    tabela_preco_ecommerce_id TEXT REFERENCES tabelas_preco(id),
    
    -- Notificacoes
    notificar_novo_pedido INTEGER DEFAULT 1,
    notificar_erro_sync INTEGER DEFAULT 1,
    email_notificacoes TEXT,
    
    -- Webhook URL base
    webhook_base_url TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- VIEW: vw_nuvemshop_pedidos_pendentes
-- =============================================
CREATE VIEW IF NOT EXISTS vw_nuvemshop_pedidos_pendentes AS
SELECT 
    np.*,
    nl.store_name as loja_nome,
    CAST(julianday('now') - julianday(np.data_pedido) AS INTEGER) as dias_pendente
FROM nuvemshop_pedidos np
JOIN nuvemshop_lojas nl ON nl.id = np.loja_id
WHERE np.status_erp IN ('pendente', 'importado')
ORDER BY np.data_pedido ASC;

-- =============================================
-- VIEW: vw_nuvemshop_produtos_sem_vinculo
-- =============================================
CREATE VIEW IF NOT EXISTS vw_nuvemshop_produtos_sem_vinculo AS
SELECT 
    p.id as produto_id,
    p.codigo,
    p.nome,
    p.sku,
    p.empresa_id,
    nl.id as loja_id,
    nl.store_name as loja_nome
FROM produtos p
CROSS JOIN nuvemshop_lojas nl ON nl.empresa_id = p.empresa_id AND nl.ativo = 1
LEFT JOIN nuvemshop_produtos np ON np.produto_id = p.id AND np.loja_id = nl.id
WHERE np.id IS NULL
AND p.ativo = 1
AND p.deleted_at IS NULL;

-- =============================================
-- VIEW: vw_nuvemshop_sync_resumo
-- =============================================
CREATE VIEW IF NOT EXISTS vw_nuvemshop_sync_resumo AS
SELECT 
    nl.id as loja_id,
    nl.empresa_id,
    nl.store_name,
    nl.ultima_sincronizacao,
    (SELECT COUNT(*) FROM nuvemshop_produtos WHERE loja_id = nl.id AND ativo = 1) as produtos_vinculados,
    (SELECT COUNT(*) FROM nuvemshop_pedidos WHERE loja_id = nl.id AND status_erp = 'pendente') as pedidos_pendentes,
    (SELECT COUNT(*) FROM nuvemshop_pedidos WHERE loja_id = nl.id AND status_erp = 'erro') as pedidos_com_erro,
    (SELECT COUNT(*) FROM nuvemshop_clientes WHERE loja_id = nl.id) as clientes_vinculados
FROM nuvemshop_lojas nl
WHERE nl.ativo = 1;

-- =============================================
-- VIEW: vw_nuvemshop_vendas_por_dia
-- =============================================
CREATE VIEW IF NOT EXISTS vw_nuvemshop_vendas_por_dia AS
SELECT 
    np.empresa_id,
    np.loja_id,
    nl.store_name as loja_nome,
    date(np.data_pedido) as data,
    COUNT(*) as total_pedidos,
    SUM(np.total) as valor_total,
    AVG(np.total) as ticket_medio
FROM nuvemshop_pedidos np
JOIN nuvemshop_lojas nl ON nl.id = np.loja_id
WHERE np.status_erp NOT IN ('cancelado', 'erro')
GROUP BY np.empresa_id, np.loja_id, nl.store_name, date(np.data_pedido)
ORDER BY date(np.data_pedido) DESC;
