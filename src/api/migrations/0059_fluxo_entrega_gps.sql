-- =============================================
-- TRAILSYSTEM ERP - Migration 0059
-- Fluxo de Entrega com Rastreamento GPS
-- Criado em: 2025-12-30
-- =============================================

-- =============================================
-- TABELA: romaneios_carga (romaneio de entregas)
-- =============================================
CREATE TABLE IF NOT EXISTS romaneios_carga (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    numero TEXT NOT NULL,
    
    -- Motorista
    motorista_id TEXT REFERENCES usuarios(id),
    motorista_nome TEXT,
    motorista_telefone TEXT,
    
    -- Veiculo
    veiculo_id TEXT,
    veiculo_placa TEXT,
    veiculo_modelo TEXT,
    
    -- Datas
    data_romaneio TEXT NOT NULL,
    data_saida TEXT,
    data_retorno TEXT,
    hora_saida TEXT,
    hora_retorno TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN (
        'rascunho',
        'planejado',
        'em_carregamento',
        'em_rota',
        'finalizado',
        'cancelado'
    )),
    
    -- Totais
    qtd_entregas INTEGER DEFAULT 0,
    qtd_entregas_realizadas INTEGER DEFAULT 0,
    qtd_entregas_pendentes INTEGER DEFAULT 0,
    qtd_ocorrencias INTEGER DEFAULT 0,
    peso_total REAL DEFAULT 0,
    valor_total REAL DEFAULT 0,
    
    -- Rota
    km_inicial REAL,
    km_final REAL,
    km_percorrido REAL,
    rota_otimizada INTEGER DEFAULT 0,
    
    -- Controle
    observacao TEXT,
    criado_por_id TEXT REFERENCES usuarios(id),
    criado_por_nome TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    
    UNIQUE(empresa_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_romaneios_carga_empresa ON romaneios_carga(empresa_id);
CREATE INDEX IF NOT EXISTS idx_romaneios_carga_motorista ON romaneios_carga(motorista_id);
CREATE INDEX IF NOT EXISTS idx_romaneios_carga_status ON romaneios_carga(status);
CREATE INDEX IF NOT EXISTS idx_romaneios_carga_data ON romaneios_carga(data_romaneio);

-- =============================================
-- TABELA: romaneios_entregas (entregas do romaneio)
-- =============================================
CREATE TABLE IF NOT EXISTS romaneios_entregas (
    id TEXT PRIMARY KEY,
    romaneio_id TEXT NOT NULL REFERENCES romaneios_carga(id),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Pedido/Venda origem
    pedido_id TEXT,
    pedido_numero TEXT,
    nfe_id TEXT,
    nfe_numero TEXT,
    
    -- Cliente
    cliente_id TEXT REFERENCES clientes(id),
    cliente_nome TEXT,
    cliente_telefone TEXT,
    cliente_email TEXT,
    
    -- Endereco de entrega
    endereco_cep TEXT,
    endereco_logradouro TEXT,
    endereco_numero TEXT,
    endereco_complemento TEXT,
    endereco_bairro TEXT,
    endereco_cidade TEXT,
    endereco_uf TEXT,
    endereco_latitude REAL,
    endereco_longitude REAL,
    
    -- Sequencia na rota
    sequencia INTEGER DEFAULT 0,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
        'pendente',
        'em_transito',
        'chegou',
        'entregue',
        'ausente',
        'recusado',
        'reagendado',
        'retornado',
        'cancelado'
    )),
    
    -- Valores
    peso REAL DEFAULT 0,
    volumes INTEGER DEFAULT 1,
    valor REAL DEFAULT 0,
    
    -- Entrega
    data_prevista TEXT,
    hora_prevista_inicio TEXT,
    hora_prevista_fim TEXT,
    data_entrega TEXT,
    hora_entrega TEXT,
    
    -- Check-in GPS
    checkin_latitude REAL,
    checkin_longitude REAL,
    checkin_data TEXT,
    checkin_hora TEXT,
    checkin_automatico INTEGER DEFAULT 0,
    
    -- Comprovante
    assinatura_url TEXT,
    assinatura_nome TEXT,
    assinatura_documento TEXT,
    foto_comprovante_url TEXT,
    
    -- Ocorrencia
    ocorrencia_tipo TEXT,
    ocorrencia_descricao TEXT,
    ocorrencia_data TEXT,
    
    -- Reagendamento
    reagendamento_data TEXT,
    reagendamento_motivo TEXT,
    
    -- Notificacoes
    notificacao_enviada INTEGER DEFAULT 0,
    notificacao_chegada_enviada INTEGER DEFAULT 0,
    notificacao_entrega_enviada INTEGER DEFAULT 0,
    
    observacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_romaneios_entregas_romaneio ON romaneios_entregas(romaneio_id);
CREATE INDEX IF NOT EXISTS idx_romaneios_entregas_cliente ON romaneios_entregas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_romaneios_entregas_status ON romaneios_entregas(status);
CREATE INDEX IF NOT EXISTS idx_romaneios_entregas_sequencia ON romaneios_entregas(romaneio_id, sequencia);

-- =============================================
-- TABELA: rastreamento_gps (posicoes do motorista)
-- =============================================
CREATE TABLE IF NOT EXISTS rastreamento_gps (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    romaneio_id TEXT REFERENCES romaneios_carga(id),
    motorista_id TEXT REFERENCES usuarios(id),
    
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    precisao REAL,
    velocidade REAL,
    direcao REAL,
    altitude REAL,
    
    bateria_nivel INTEGER,
    conexao_tipo TEXT,
    
    data_hora TEXT NOT NULL,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rastreamento_gps_romaneio ON rastreamento_gps(romaneio_id);
CREATE INDEX IF NOT EXISTS idx_rastreamento_gps_motorista ON rastreamento_gps(motorista_id);
CREATE INDEX IF NOT EXISTS idx_rastreamento_gps_data ON rastreamento_gps(data_hora);

-- =============================================
-- TABELA: entregas_historico (auditoria)
-- =============================================
CREATE TABLE IF NOT EXISTS entregas_historico (
    id TEXT PRIMARY KEY,
    entrega_id TEXT NOT NULL REFERENCES romaneios_entregas(id),
    romaneio_id TEXT REFERENCES romaneios_carga(id),
    acao TEXT NOT NULL,
    status_anterior TEXT,
    status_novo TEXT,
    usuario_id TEXT REFERENCES usuarios(id),
    usuario_nome TEXT,
    descricao TEXT,
    latitude REAL,
    longitude REAL,
    dados_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entregas_historico_entrega ON entregas_historico(entrega_id);

-- =============================================
-- TABELA: config_entrega (configuracoes por empresa)
-- =============================================
CREATE TABLE IF NOT EXISTS config_entrega (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL UNIQUE REFERENCES empresas(id),
    
    -- GPS
    intervalo_rastreamento_segundos INTEGER DEFAULT 30,
    raio_checkin_metros INTEGER DEFAULT 100,
    checkin_automatico INTEGER DEFAULT 1,
    
    -- Notificacoes
    notificar_cliente_saida INTEGER DEFAULT 1,
    notificar_cliente_chegada INTEGER DEFAULT 1,
    notificar_cliente_entrega INTEGER DEFAULT 1,
    notificar_via_whatsapp INTEGER DEFAULT 1,
    notificar_via_email INTEGER DEFAULT 0,
    notificar_via_sms INTEGER DEFAULT 0,
    
    -- Comprovante
    exigir_assinatura INTEGER DEFAULT 1,
    exigir_foto INTEGER DEFAULT 0,
    exigir_documento INTEGER DEFAULT 0,
    
    -- Tentativas
    max_tentativas_entrega INTEGER DEFAULT 3,
    
    -- Horarios
    horario_inicio_entregas TEXT DEFAULT '08:00',
    horario_fim_entregas TEXT DEFAULT '18:00',
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: motoristas (dados adicionais do motorista)
-- =============================================
CREATE TABLE IF NOT EXISTS motoristas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    
    cnh_numero TEXT,
    cnh_categoria TEXT,
    cnh_validade TEXT,
    
    telefone TEXT,
    telefone_emergencia TEXT,
    
    veiculo_padrao_id TEXT,
    
    ativo INTEGER DEFAULT 1,
    disponivel INTEGER DEFAULT 1,
    
    ultima_latitude REAL,
    ultima_longitude REAL,
    ultima_atualizacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(empresa_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_motoristas_empresa ON motoristas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_motoristas_usuario ON motoristas(usuario_id);

-- =============================================
-- VIEW: vw_romaneios_em_rota
-- =============================================
CREATE VIEW IF NOT EXISTS vw_romaneios_em_rota AS
SELECT 
    r.*,
    m.ultima_latitude as motorista_latitude,
    m.ultima_longitude as motorista_longitude,
    m.ultima_atualizacao as motorista_ultima_atualizacao
FROM romaneios_carga r
LEFT JOIN motoristas m ON m.usuario_id = r.motorista_id
WHERE r.deleted_at IS NULL AND r.status = 'em_rota';

-- =============================================
-- VIEW: vw_entregas_pendentes_hoje
-- =============================================
CREATE VIEW IF NOT EXISTS vw_entregas_pendentes_hoje AS
SELECT 
    e.*,
    r.numero as romaneio_numero,
    r.motorista_nome,
    r.status as romaneio_status
FROM romaneios_entregas e
JOIN romaneios_carga r ON r.id = e.romaneio_id
WHERE e.status IN ('pendente', 'em_transito', 'chegou')
AND r.data_romaneio = date('now')
AND r.deleted_at IS NULL;

-- =============================================
-- VIEW: vw_rastreamento_atual
-- =============================================
CREATE VIEW IF NOT EXISTS vw_rastreamento_atual AS
SELECT 
    r.empresa_id,
    r.romaneio_id,
    r.motorista_id,
    r.latitude,
    r.longitude,
    r.velocidade,
    r.data_hora,
    rc.numero as romaneio_numero,
    rc.motorista_nome
FROM rastreamento_gps r
JOIN romaneios_carga rc ON rc.id = r.romaneio_id
WHERE r.id IN (
    SELECT id FROM rastreamento_gps r2 
    WHERE r2.romaneio_id = r.romaneio_id 
    ORDER BY r2.data_hora DESC 
    LIMIT 1
);
