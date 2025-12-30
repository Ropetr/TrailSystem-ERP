-- =============================================
-- TRAILSYSTEM ERP - Migration 0051: Fluxo de Recebimento Financeiro
-- Suporte a régua de cobrança, bloqueio de cliente, histórico de cobrança
-- =============================================

-- =============================================
-- RÉGUA DE COBRANÇA (Collection Rules)
-- Define as regras de cobrança automática por dias de atraso
-- =============================================

CREATE TABLE IF NOT EXISTS regua_cobranca (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    nome TEXT NOT NULL,
    ativo INTEGER DEFAULT 1,
    
    -- Configuração padrão
    is_default INTEGER DEFAULT 0,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_regua_cobranca_empresa ON regua_cobranca(empresa_id);

-- Etapas da régua de cobrança
CREATE TABLE IF NOT EXISTS regua_cobranca_etapas (
    id TEXT PRIMARY KEY,
    regua_id TEXT NOT NULL REFERENCES regua_cobranca(id) ON DELETE CASCADE,
    
    -- Configuração da etapa
    dias_atraso INTEGER NOT NULL, -- 1, 3, 7, 15, 30, 45, 60
    tipo TEXT NOT NULL CHECK (tipo IN ('lembrete', 'cobranca', 'bloqueio', 'negativacao')),
    
    -- Ações
    enviar_email INTEGER DEFAULT 1,
    enviar_whatsapp INTEGER DEFAULT 0,
    enviar_sms INTEGER DEFAULT 0,
    bloquear_cliente INTEGER DEFAULT 0,
    negativar_cliente INTEGER DEFAULT 0,
    
    -- Templates
    assunto_email TEXT,
    template_email TEXT,
    template_whatsapp TEXT,
    template_sms TEXT,
    
    -- Ordem de execução
    ordem INTEGER NOT NULL,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_regua_etapas_regua ON regua_cobranca_etapas(regua_id);
CREATE INDEX IF NOT EXISTS idx_regua_etapas_dias ON regua_cobranca_etapas(dias_atraso);

-- =============================================
-- HISTÓRICO DE COBRANÇA
-- Registra todas as ações de cobrança realizadas
-- =============================================

CREATE TABLE IF NOT EXISTS cobrancas_historico (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    conta_receber_id TEXT NOT NULL REFERENCES contas_receber(id),
    cliente_id TEXT NOT NULL REFERENCES clientes(id),
    
    -- Etapa da régua
    regua_etapa_id TEXT REFERENCES regua_cobranca_etapas(id),
    dias_atraso INTEGER NOT NULL,
    tipo TEXT NOT NULL, -- lembrete, cobranca, bloqueio, negativacao, manual
    
    -- Canais utilizados
    email_enviado INTEGER DEFAULT 0,
    whatsapp_enviado INTEGER DEFAULT 0,
    sms_enviado INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'enviado' CHECK (status IN ('enviado', 'entregue', 'lido', 'erro', 'respondido')),
    erro_mensagem TEXT,
    
    -- Resposta do cliente
    cliente_respondeu INTEGER DEFAULT 0,
    resposta_cliente TEXT,
    data_resposta TEXT,
    
    -- Usuário que executou (se manual)
    usuario_id TEXT REFERENCES usuarios(id),
    observacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cobrancas_hist_empresa ON cobrancas_historico(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_hist_conta ON cobrancas_historico(conta_receber_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_hist_cliente ON cobrancas_historico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_hist_data ON cobrancas_historico(created_at);

-- =============================================
-- BLOQUEIO DE CLIENTES
-- Controle de clientes bloqueados por inadimplência
-- =============================================

CREATE TABLE IF NOT EXISTS clientes_bloqueios (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    cliente_id TEXT NOT NULL REFERENCES clientes(id),
    
    -- Motivo do bloqueio
    motivo TEXT NOT NULL CHECK (motivo IN ('inadimplencia', 'limite_credito', 'negativacao', 'manual', 'outro')),
    descricao TEXT,
    
    -- Referência
    conta_receber_id TEXT REFERENCES contas_receber(id),
    cobranca_historico_id TEXT REFERENCES cobrancas_historico(id),
    
    -- Status
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'liberado')),
    data_bloqueio TEXT NOT NULL,
    data_liberacao TEXT,
    
    -- Usuários
    bloqueado_por TEXT REFERENCES usuarios(id),
    liberado_por TEXT REFERENCES usuarios(id),
    motivo_liberacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clientes_bloqueios_empresa ON clientes_bloqueios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_bloqueios_cliente ON clientes_bloqueios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_bloqueios_status ON clientes_bloqueios(status);

-- =============================================
-- NEGATIVAÇÃO DE CLIENTES
-- Controle de clientes negativados (Serasa, SPC)
-- =============================================

CREATE TABLE IF NOT EXISTS clientes_negativacoes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    cliente_id TEXT NOT NULL REFERENCES clientes(id),
    
    -- Dados da negativação
    orgao TEXT NOT NULL CHECK (orgao IN ('serasa', 'spc', 'boa_vista', 'outro')),
    protocolo TEXT,
    valor_negativado REAL NOT NULL,
    
    -- Referências
    conta_receber_id TEXT REFERENCES contas_receber(id),
    
    -- Status
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'baixado', 'contestado')),
    data_negativacao TEXT NOT NULL,
    data_baixa TEXT,
    
    -- Usuários
    negativado_por TEXT REFERENCES usuarios(id),
    baixado_por TEXT REFERENCES usuarios(id),
    motivo_baixa TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clientes_negativacoes_empresa ON clientes_negativacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_negativacoes_cliente ON clientes_negativacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_negativacoes_status ON clientes_negativacoes(status);

-- =============================================
-- TABELA DE BAIXAS (se não existir)
-- =============================================

CREATE TABLE IF NOT EXISTS contas_receber_baixas (
    id TEXT PRIMARY KEY,
    conta_receber_id TEXT NOT NULL REFERENCES contas_receber(id) ON DELETE CASCADE,
    
    -- Valores
    valor_pago REAL NOT NULL,
    valor_juros REAL DEFAULT 0,
    valor_multa REAL DEFAULT 0,
    valor_desconto REAL DEFAULT 0,
    
    -- Dados do pagamento
    data_baixa TEXT NOT NULL,
    forma_pagamento_id TEXT,
    conta_bancaria_id TEXT,
    
    -- Origem da baixa
    origem TEXT DEFAULT 'manual' CHECK (origem IN ('manual', 'pix', 'boleto_retorno', 'cartao', 'conciliacao')),
    referencia_externa TEXT, -- ID do PIX, linha do retorno, etc
    
    -- Observações
    observacao TEXT,
    usuario_id TEXT REFERENCES usuarios(id),
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cr_baixas_conta ON contas_receber_baixas(conta_receber_id);
CREATE INDEX IF NOT EXISTS idx_cr_baixas_data ON contas_receber_baixas(data_baixa);

-- =============================================
-- VIEWS ÚTEIS
-- =============================================

-- View de títulos vencidos com dias de atraso
CREATE VIEW IF NOT EXISTS vw_titulos_vencidos AS
SELECT 
    cr.id,
    cr.empresa_id,
    cr.cliente_id,
    cr.numero_documento,
    cr.valor_original,
    cr.valor_aberto,
    cr.data_vencimento,
    CAST(julianday('now') - julianday(cr.data_vencimento) AS INTEGER) as dias_atraso,
    c.razao_social as cliente_nome,
    c.email as cliente_email,
    c.telefone as cliente_telefone,
    (SELECT MAX(ch.dias_atraso) FROM cobrancas_historico ch WHERE ch.conta_receber_id = cr.id) as ultima_cobranca_dias
FROM contas_receber cr
JOIN clientes c ON c.id = cr.cliente_id
WHERE cr.status = 'ABERTO' 
  AND cr.data_vencimento < date('now')
ORDER BY dias_atraso DESC;

-- View de clientes bloqueados ativos
CREATE VIEW IF NOT EXISTS vw_clientes_bloqueados AS
SELECT 
    cb.*,
    c.razao_social as cliente_nome,
    c.cpf_cnpj as cliente_documento
FROM clientes_bloqueios cb
JOIN clientes c ON c.id = cb.cliente_id
WHERE cb.status = 'ativo';

-- =============================================
-- DADOS INICIAIS - Régua de cobrança padrão
-- =============================================

-- Inserir régua padrão (será executado apenas se não existir)
INSERT OR IGNORE INTO regua_cobranca (id, empresa_id, nome, ativo, is_default, created_at, updated_at)
VALUES ('REGUA_PADRAO_001', '01PLANAC00000000000000000000', 'Régua Padrão', 1, 1, datetime('now'), datetime('now'));

-- Inserir etapas da régua padrão
INSERT OR IGNORE INTO regua_cobranca_etapas (id, regua_id, dias_atraso, tipo, enviar_email, enviar_whatsapp, bloquear_cliente, negativar_cliente, assunto_email, template_email, ordem)
VALUES 
('ETAPA_D1', 'REGUA_PADRAO_001', 1, 'lembrete', 1, 1, 0, 0, 'Lembrete: Seu boleto venceu ontem', 'Olá {cliente_nome}, identificamos que o título no valor de R$ {valor} venceu ontem ({data_vencimento}). Por favor, regularize o pagamento.', 1),
('ETAPA_D3', 'REGUA_PADRAO_001', 3, 'lembrete', 1, 0, 0, 0, 'Segunda via do boleto - Título vencido', 'Olá {cliente_nome}, segue a segunda via do boleto no valor de R$ {valor}. Vencimento original: {data_vencimento}.', 2),
('ETAPA_D7', 'REGUA_PADRAO_001', 7, 'cobranca', 1, 1, 0, 0, 'Regularize seu pagamento', 'Prezado(a) {cliente_nome}, seu título está vencido há 7 dias. Valor: R$ {valor}. Evite a negativação do seu nome.', 3),
('ETAPA_D15', 'REGUA_PADRAO_001', 15, 'cobranca', 1, 1, 0, 0, 'Aviso: Cadastro será bloqueado em 15 dias', 'Prezado(a) {cliente_nome}, informamos que seu cadastro será bloqueado em 15 dias caso o débito de R$ {valor} não seja regularizado.', 4),
('ETAPA_D30', 'REGUA_PADRAO_001', 30, 'bloqueio', 1, 1, 1, 0, 'Cadastro bloqueado por inadimplência', 'Prezado(a) {cliente_nome}, seu cadastro foi bloqueado devido ao débito de R$ {valor} vencido há 30 dias.', 5),
('ETAPA_D45', 'REGUA_PADRAO_001', 45, 'cobranca', 1, 1, 0, 0, 'Última chance antes da negativação', 'Prezado(a) {cliente_nome}, esta é sua última chance de regularizar o débito de R$ {valor} antes da inclusão no Serasa/SPC.', 6),
('ETAPA_D60', 'REGUA_PADRAO_001', 60, 'negativacao', 1, 1, 1, 1, 'Inclusão no Serasa/SPC', 'Prezado(a) {cliente_nome}, informamos que seu nome foi incluído nos órgãos de proteção ao crédito devido ao débito de R$ {valor}.', 7);
