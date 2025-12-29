-- =============================================
-- PLANAC ERP - Migration 0014
-- RH: eSocial e EFD-Reinf
-- Suporte para ACBr API/ACBrLib
-- =============================================
-- Criado em: 28/12/2025
-- Descrição: Tabelas para gestão de eventos eSocial
--            e EFD-Reinf (obrigações trabalhistas/previdenciárias)
-- =============================================

-- =============================================
-- 1. CONFIGURAÇÃO eSocial POR EMPRESA
-- =============================================
CREATE TABLE IF NOT EXISTS esocial_configuracoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Dados do empregador
    tipo_inscricao INTEGER NOT NULL DEFAULT 1,  -- 1=CNPJ, 2=CPF
    numero_inscricao TEXT NOT NULL,
    
    -- Ambiente
    ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao', 'producao_restrita')),
    
    -- Versão do layout
    versao_layout TEXT DEFAULT 'S-1.2',
    
    -- Classificação tributária
    classificacao_tributaria TEXT,
    
    -- Indicadores
    indicador_cooperativa INTEGER DEFAULT 0,
    indicador_construtora INTEGER DEFAULT 0,
    indicador_desonerado INTEGER DEFAULT 0,
    indicador_acordo_isencao_multa INTEGER DEFAULT 0,
    indicador_situacao_pj INTEGER,
    
    -- Processo judicial (se houver)
    processo_judicial TEXT,
    
    -- Software house (para identificação)
    software_nome TEXT DEFAULT 'TrailSystem-ERP',
    software_versao TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id)
);

CREATE INDEX idx_esocial_config_empresa ON esocial_configuracoes(empresa_id);

-- =============================================
-- 2. EVENTOS eSocial
-- =============================================
CREATE TABLE IF NOT EXISTS esocial_eventos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    configuracao_id TEXT REFERENCES esocial_configuracoes(id),
    
    -- Identificação do evento
    tipo_evento TEXT NOT NULL,              -- S-1000, S-1010, S-1200, S-2200, etc.
    id_evento TEXT NOT NULL,                -- ID único do evento (gerado)
    
    -- Período de apuração (quando aplicável)
    periodo_apuracao TEXT,                  -- AAAA-MM
    
    -- Ambiente
    ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao', 'producao_restrita')),
    
    -- Tipo de operação
    operacao TEXT NOT NULL DEFAULT 'inclusao' CHECK (operacao IN ('inclusao', 'alteracao', 'exclusao')),
    
    -- Referência (para eventos de trabalhador)
    trabalhador_cpf TEXT,
    trabalhador_nome TEXT,
    matricula TEXT,
    
    -- Dados do evento (JSON com campos específicos)
    dados_evento TEXT,                      -- JSON com os dados do evento
    
    -- Status
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN (
        'rascunho',         -- Em elaboração
        'validado',         -- Validado localmente
        'assinado',         -- Assinado digitalmente
        'enviado',          -- Enviado ao eSocial
        'processando',      -- Em processamento
        'aceito',           -- Aceito pelo eSocial
        'rejeitado',        -- Rejeitado pelo eSocial
        'erro'              -- Erro no envio
    )),
    
    -- Lote
    lote_id TEXT,
    
    -- Resposta do eSocial
    recibo TEXT,                            -- Número do recibo
    protocolo TEXT,                         -- Protocolo de envio
    codigo_resposta INTEGER,
    descricao_resposta TEXT,
    data_recepcao TEXT,
    
    -- Ocorrências (erros/avisos)
    ocorrencias TEXT,                       -- JSON array de ocorrências
    
    -- Armazenamento
    xml_evento_storage_key TEXT,            -- XML do evento no R2
    xml_retorno_storage_key TEXT,           -- XML do retorno no R2
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, id_evento)
);

CREATE INDEX idx_esocial_eventos_empresa ON esocial_eventos(empresa_id);
CREATE INDEX idx_esocial_eventos_tipo ON esocial_eventos(tipo_evento);
CREATE INDEX idx_esocial_eventos_status ON esocial_eventos(status);
CREATE INDEX idx_esocial_eventos_periodo ON esocial_eventos(periodo_apuracao);
CREATE INDEX idx_esocial_eventos_trabalhador ON esocial_eventos(trabalhador_cpf);
CREATE INDEX idx_esocial_eventos_recibo ON esocial_eventos(recibo);

-- =============================================
-- 3. LOTES eSocial
-- =============================================
CREATE TABLE IF NOT EXISTS esocial_lotes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    configuracao_id TEXT REFERENCES esocial_configuracoes(id),
    
    -- Identificação
    id_lote TEXT NOT NULL,
    
    -- Ambiente
    ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao', 'producao_restrita')),
    
    -- Grupo de eventos
    grupo TEXT NOT NULL,                    -- 1=Tabelas, 2=Não periódicos, 3=Periódicos
    
    -- Quantidade
    quantidade_eventos INTEGER DEFAULT 0,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
        'pendente',
        'enviado',
        'processando',
        'processado',
        'erro'
    )),
    
    -- Resposta
    protocolo TEXT,
    codigo_resposta INTEGER,
    descricao_resposta TEXT,
    data_recepcao TEXT,
    
    -- Armazenamento
    xml_lote_storage_key TEXT,
    xml_retorno_storage_key TEXT,
    
    -- Erro
    erro_mensagem TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_esocial_lotes_empresa ON esocial_lotes(empresa_id);
CREATE INDEX idx_esocial_lotes_status ON esocial_lotes(status);
CREATE INDEX idx_esocial_lotes_protocolo ON esocial_lotes(protocolo);

-- =============================================
-- 4. CONFIGURAÇÃO EFD-Reinf POR EMPRESA
-- =============================================
CREATE TABLE IF NOT EXISTS reinf_configuracoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Dados do contribuinte
    tipo_inscricao INTEGER NOT NULL DEFAULT 1,  -- 1=CNPJ, 2=CPF
    numero_inscricao TEXT NOT NULL,
    
    -- Ambiente
    ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao', 'producao_restrita')),
    
    -- Versão do layout
    versao_layout TEXT DEFAULT '2.1.2',
    
    -- Classificação tributária
    classificacao_tributaria TEXT,
    
    -- Indicadores
    indicador_escrituracao INTEGER DEFAULT 0,
    indicador_desonerado INTEGER DEFAULT 0,
    indicador_acordo_isencao_multa INTEGER DEFAULT 0,
    indicador_situacao_pj INTEGER,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id)
);

CREATE INDEX idx_reinf_config_empresa ON reinf_configuracoes(empresa_id);

-- =============================================
-- 5. EVENTOS EFD-Reinf
-- =============================================
CREATE TABLE IF NOT EXISTS reinf_eventos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    configuracao_id TEXT REFERENCES reinf_configuracoes(id),
    
    -- Identificação do evento
    tipo_evento TEXT NOT NULL,              -- R-1000, R-2010, R-4010, etc.
    id_evento TEXT NOT NULL,
    
    -- Período de apuração
    periodo_apuracao TEXT NOT NULL,         -- AAAA-MM
    
    -- Ambiente
    ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao', 'producao_restrita')),
    
    -- Tipo de operação
    operacao TEXT NOT NULL DEFAULT 'inclusao' CHECK (operacao IN ('inclusao', 'alteracao', 'exclusao')),
    
    -- Referência (para eventos de prestador/tomador)
    cnpj_prestador TEXT,
    nome_prestador TEXT,
    
    -- Dados do evento (JSON)
    dados_evento TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN (
        'rascunho',
        'validado',
        'assinado',
        'enviado',
        'processando',
        'aceito',
        'rejeitado',
        'erro'
    )),
    
    -- Lote
    lote_id TEXT,
    
    -- Resposta
    recibo TEXT,
    protocolo TEXT,
    codigo_resposta INTEGER,
    descricao_resposta TEXT,
    data_recepcao TEXT,
    
    -- Ocorrências
    ocorrencias TEXT,
    
    -- Armazenamento
    xml_evento_storage_key TEXT,
    xml_retorno_storage_key TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, id_evento)
);

CREATE INDEX idx_reinf_eventos_empresa ON reinf_eventos(empresa_id);
CREATE INDEX idx_reinf_eventos_tipo ON reinf_eventos(tipo_evento);
CREATE INDEX idx_reinf_eventos_status ON reinf_eventos(status);
CREATE INDEX idx_reinf_eventos_periodo ON reinf_eventos(periodo_apuracao);
CREATE INDEX idx_reinf_eventos_recibo ON reinf_eventos(recibo);

-- =============================================
-- 6. LOTES EFD-Reinf
-- =============================================
CREATE TABLE IF NOT EXISTS reinf_lotes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    configuracao_id TEXT REFERENCES reinf_configuracoes(id),
    
    -- Identificação
    id_lote TEXT NOT NULL,
    
    -- Ambiente
    ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao', 'producao_restrita')),
    
    -- Quantidade
    quantidade_eventos INTEGER DEFAULT 0,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
        'pendente',
        'enviado',
        'processando',
        'processado',
        'erro'
    )),
    
    -- Resposta
    protocolo TEXT,
    codigo_resposta INTEGER,
    descricao_resposta TEXT,
    data_recepcao TEXT,
    
    -- Armazenamento
    xml_lote_storage_key TEXT,
    xml_retorno_storage_key TEXT,
    
    -- Erro
    erro_mensagem TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_reinf_lotes_empresa ON reinf_lotes(empresa_id);
CREATE INDEX idx_reinf_lotes_status ON reinf_lotes(status);

-- =============================================
-- 7. FECHAMENTO eSocial/Reinf (Eventos de fechamento)
-- =============================================
CREATE TABLE IF NOT EXISTS esocial_reinf_fechamentos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Sistema
    sistema TEXT NOT NULL CHECK (sistema IN ('esocial', 'reinf')),
    
    -- Período
    periodo_apuracao TEXT NOT NULL,         -- AAAA-MM
    
    -- Tipo de fechamento
    tipo_fechamento TEXT NOT NULL,          -- S-1299 (eSocial), R-2099/R-4099 (Reinf)
    
    -- Status
    status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN (
        'aberto',           -- Período aberto para envio
        'fechado',          -- Período fechado
        'reaberto'          -- Período reaberto para correções
    )),
    
    -- Evento de fechamento
    evento_fechamento_id TEXT,
    recibo_fechamento TEXT,
    data_fechamento TEXT,
    
    -- Totalizadores (JSON com valores calculados)
    totalizadores TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, sistema, periodo_apuracao)
);

CREATE INDEX idx_esocial_reinf_fech_empresa ON esocial_reinf_fechamentos(empresa_id);
CREATE INDEX idx_esocial_reinf_fech_periodo ON esocial_reinf_fechamentos(periodo_apuracao);

-- =============================================
-- 8. LOG DE OPERAÇÕES eSocial/Reinf
-- =============================================
CREATE TABLE IF NOT EXISTS esocial_reinf_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Sistema
    sistema TEXT NOT NULL CHECK (sistema IN ('esocial', 'reinf')),
    
    -- Referência
    evento_id TEXT,
    lote_id TEXT,
    
    -- Operação
    operacao TEXT NOT NULL,                 -- geracao, validacao, assinatura, envio, consulta
    descricao TEXT,
    
    -- Resultado
    sucesso INTEGER DEFAULT 1,
    codigo_resposta INTEGER,
    descricao_resposta TEXT,
    erro_mensagem TEXT,
    
    -- Request/Response
    request_storage_key TEXT,
    response_storage_key TEXT,
    
    -- Usuário
    usuario_id TEXT REFERENCES usuarios(id),
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_esocial_reinf_logs_empresa ON esocial_reinf_logs(empresa_id);
CREATE INDEX idx_esocial_reinf_logs_sistema ON esocial_reinf_logs(sistema);
CREATE INDEX idx_esocial_reinf_logs_operacao ON esocial_reinf_logs(operacao);
CREATE INDEX idx_esocial_reinf_logs_data ON esocial_reinf_logs(created_at);

-- =============================================
-- COMENTÁRIOS PARA DESENVOLVEDORES
-- =============================================
-- 
-- eSocial - EVENTOS PRINCIPAIS:
-- Tabelas (Grupo 1):
--   S-1000: Informações do Empregador
--   S-1005: Estabelecimentos
--   S-1010: Rubricas
--   S-1020: Lotações Tributárias
--   S-1070: Processos Administrativos/Judiciais
--
-- Não Periódicos (Grupo 2):
--   S-2190: Registro Preliminar
--   S-2200: Cadastramento Inicial / Admissão
--   S-2205: Alteração de Dados Cadastrais
--   S-2206: Alteração de Contrato
--   S-2230: Afastamento Temporário
--   S-2299: Desligamento
--   S-2300: TSV - Início
--   S-2399: TSV - Término
--
-- Periódicos (Grupo 3):
--   S-1200: Remuneração
--   S-1210: Pagamentos
--   S-1260: Comercialização Produção Rural
--   S-1270: Contratação de Avulsos
--   S-1280: Informações Complementares
--   S-1298: Reabertura
--   S-1299: Fechamento
--
-- EFD-Reinf - EVENTOS PRINCIPAIS:
--   R-1000: Informações do Contribuinte
--   R-1050: Tabela de Entidades Ligadas
--   R-1070: Processos Administrativos/Judiciais
--   R-2010: Retenção - Serviços Tomados (até 07/2023)
--   R-2020: Retenção - Serviços Prestados (até 07/2023)
--   R-2055: Aquisição de Produção Rural
--   R-2060: CPRB
--   R-2098: Reabertura
--   R-2099: Fechamento
--   R-4010: Pagamentos a Beneficiários PF
--   R-4020: Pagamentos a Beneficiários PJ
--   R-4040: Pagamentos a Beneficiários Não Identificados
--   R-4080: Retenção no Recebimento
--   R-4099: Fechamento Série R-4000
--   R-9000: Exclusão de Eventos
--
-- INTEGRAÇÃO ACBr:
-- - ACBreSocial: Geração e envio de eventos eSocial
-- - ACBrReinf: Geração e envio de eventos Reinf
-- - Validação de schemas XML
-- - Assinatura digital
-- - Comunicação com webservices
--
-- FLUXO:
-- 1. Configurar empresa (esocial_configuracoes / reinf_configuracoes)
-- 2. Gerar eventos conforme operações do RH/Fiscal
-- 3. Validar eventos localmente
-- 4. Assinar digitalmente
-- 5. Enviar em lotes
-- 6. Processar retornos
-- 7. Fechar período (S-1299 / R-2099 / R-4099)
-- =============================================
