-- =============================================
-- TRAILSYSTEM ERP - Migration 0064
-- Fluxo de RH Completo com e-Social
-- Criado em: 2025-12-30
-- =============================================

-- =============================================
-- TABELA: admissoes (processo de admissao)
-- =============================================
CREATE TABLE IF NOT EXISTS admissoes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Dados do candidato
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL,
    rg TEXT,
    data_nascimento TEXT NOT NULL,
    sexo TEXT CHECK (sexo IN ('M', 'F', 'O')),
    estado_civil TEXT CHECK (estado_civil IN ('SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO', 'UNIAO_ESTAVEL', 'OUTROS')),
    nacionalidade TEXT DEFAULT 'BRASILEIRA',
    naturalidade TEXT,
    nome_mae TEXT,
    nome_pai TEXT,
    
    -- Contato
    email TEXT,
    telefone TEXT,
    celular TEXT,
    
    -- Endereco
    cep TEXT,
    endereco TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT,
    
    -- Documentos
    ctps_numero TEXT,
    ctps_serie TEXT,
    ctps_uf TEXT,
    pis TEXT,
    titulo_eleitor TEXT,
    zona_eleitoral TEXT,
    secao_eleitoral TEXT,
    certificado_reservista TEXT,
    cnh_numero TEXT,
    cnh_categoria TEXT,
    cnh_validade TEXT,
    
    -- Dados bancarios
    banco TEXT,
    agencia TEXT,
    conta TEXT,
    tipo_conta TEXT CHECK (tipo_conta IN ('CORRENTE', 'POUPANCA', 'SALARIO')),
    pix TEXT,
    
    -- Contrato
    cargo_id TEXT REFERENCES cargos(id),
    departamento_id TEXT REFERENCES departamentos(id),
    filial_id TEXT REFERENCES filiais(id),
    data_admissao_prevista TEXT NOT NULL,
    tipo_contrato TEXT NOT NULL CHECK (tipo_contrato IN ('CLT', 'PJ', 'ESTAGIO', 'TEMPORARIO', 'AUTONOMO', 'APRENDIZ')),
    salario_proposto REAL NOT NULL,
    carga_horaria INTEGER DEFAULT 44,
    horario_trabalho TEXT,
    
    -- Beneficios
    vale_transporte INTEGER DEFAULT 0,
    vale_refeicao INTEGER DEFAULT 0,
    vale_alimentacao INTEGER DEFAULT 0,
    plano_saude INTEGER DEFAULT 0,
    plano_odontologico INTEGER DEFAULT 0,
    
    -- Status do processo
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN (
        'rascunho',
        'documentos_pendentes',
        'exame_admissional',
        'aguardando_aprovacao',
        'aprovado',
        'reprovado',
        'admitido',
        'cancelado'
    )),
    
    -- Checklist de documentos
    doc_rg INTEGER DEFAULT 0,
    doc_cpf INTEGER DEFAULT 0,
    doc_ctps INTEGER DEFAULT 0,
    doc_pis INTEGER DEFAULT 0,
    doc_titulo_eleitor INTEGER DEFAULT 0,
    doc_reservista INTEGER DEFAULT 0,
    doc_comprovante_residencia INTEGER DEFAULT 0,
    doc_comprovante_escolaridade INTEGER DEFAULT 0,
    doc_foto INTEGER DEFAULT 0,
    doc_certidao_nascimento_filhos INTEGER DEFAULT 0,
    doc_cartao_vacina_filhos INTEGER DEFAULT 0,
    doc_exame_admissional INTEGER DEFAULT 0,
    
    -- Exame admissional
    exame_data TEXT,
    exame_resultado TEXT CHECK (exame_resultado IN ('APTO', 'INAPTO', 'APTO_COM_RESTRICAO')),
    exame_observacoes TEXT,
    exame_aso_url TEXT,
    
    -- Aprovacao
    aprovador_id TEXT REFERENCES usuarios(id),
    aprovador_nome TEXT,
    data_aprovacao TEXT,
    motivo_reprovacao TEXT,
    
    -- e-Social
    esocial_evento_id TEXT,
    esocial_status TEXT CHECK (esocial_status IN ('pendente', 'enviado', 'aceito', 'rejeitado')),
    esocial_recibo TEXT,
    
    -- Funcionario gerado
    funcionario_id TEXT REFERENCES funcionarios(id),
    
    observacoes TEXT,
    
    created_by TEXT REFERENCES usuarios(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admissoes_empresa ON admissoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_admissoes_cpf ON admissoes(cpf);
CREATE INDEX IF NOT EXISTS idx_admissoes_status ON admissoes(status);
CREATE INDEX IF NOT EXISTS idx_admissoes_data ON admissoes(data_admissao_prevista);

-- =============================================
-- TABELA: admissoes_dependentes (dependentes do candidato)
-- =============================================
CREATE TABLE IF NOT EXISTS admissoes_dependentes (
    id TEXT PRIMARY KEY,
    admissao_id TEXT NOT NULL REFERENCES admissoes(id) ON DELETE CASCADE,
    
    nome TEXT NOT NULL,
    cpf TEXT,
    data_nascimento TEXT NOT NULL,
    parentesco TEXT NOT NULL CHECK (parentesco IN (
        'CONJUGE',
        'FILHO',
        'FILHA',
        'ENTEADO',
        'ENTEADA',
        'PAI',
        'MAE',
        'OUTROS'
    )),
    
    ir_dependente INTEGER DEFAULT 0,
    salario_familia INTEGER DEFAULT 0,
    plano_saude INTEGER DEFAULT 0,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admissoes_dependentes_admissao ON admissoes_dependentes(admissao_id);

-- =============================================
-- TABELA: admissoes_historico (auditoria do processo)
-- =============================================
CREATE TABLE IF NOT EXISTS admissoes_historico (
    id TEXT PRIMARY KEY,
    admissao_id TEXT NOT NULL REFERENCES admissoes(id),
    acao TEXT NOT NULL,
    status_anterior TEXT,
    status_novo TEXT,
    usuario_id TEXT REFERENCES usuarios(id),
    usuario_nome TEXT,
    descricao TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admissoes_historico_admissao ON admissoes_historico(admissao_id);

-- =============================================
-- TABELA: folha_calculos (calculos da folha)
-- =============================================
CREATE TABLE IF NOT EXISTS folha_calculos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    folha_id TEXT NOT NULL REFERENCES folha_pagamento(id),
    funcionario_id TEXT NOT NULL REFERENCES funcionarios(id),
    
    -- Dados do funcionario na epoca
    funcionario_nome TEXT,
    funcionario_cpf TEXT,
    cargo TEXT,
    departamento TEXT,
    salario_base REAL NOT NULL,
    
    -- Proventos
    salario REAL DEFAULT 0,
    horas_extras_50 REAL DEFAULT 0,
    horas_extras_100 REAL DEFAULT 0,
    adicional_noturno REAL DEFAULT 0,
    adicional_insalubridade REAL DEFAULT 0,
    adicional_periculosidade REAL DEFAULT 0,
    comissoes REAL DEFAULT 0,
    gratificacoes REAL DEFAULT 0,
    dsr REAL DEFAULT 0,
    outros_proventos REAL DEFAULT 0,
    total_proventos REAL DEFAULT 0,
    
    -- Descontos
    inss REAL DEFAULT 0,
    inss_aliquota REAL DEFAULT 0,
    irrf REAL DEFAULT 0,
    irrf_base REAL DEFAULT 0,
    irrf_aliquota REAL DEFAULT 0,
    irrf_deducao REAL DEFAULT 0,
    vale_transporte REAL DEFAULT 0,
    vale_refeicao REAL DEFAULT 0,
    vale_alimentacao REAL DEFAULT 0,
    plano_saude REAL DEFAULT 0,
    plano_odontologico REAL DEFAULT 0,
    adiantamento REAL DEFAULT 0,
    faltas REAL DEFAULT 0,
    atrasos REAL DEFAULT 0,
    pensao_alimenticia REAL DEFAULT 0,
    emprestimo_consignado REAL DEFAULT 0,
    outros_descontos REAL DEFAULT 0,
    total_descontos REAL DEFAULT 0,
    
    -- Liquido
    salario_liquido REAL DEFAULT 0,
    
    -- FGTS
    fgts_base REAL DEFAULT 0,
    fgts_valor REAL DEFAULT 0,
    
    -- Horas trabalhadas
    dias_trabalhados INTEGER DEFAULT 0,
    horas_normais REAL DEFAULT 0,
    horas_extras_50_qtd REAL DEFAULT 0,
    horas_extras_100_qtd REAL DEFAULT 0,
    horas_noturnas REAL DEFAULT 0,
    faltas_dias INTEGER DEFAULT 0,
    
    -- e-Social
    esocial_evento_id TEXT,
    esocial_status TEXT CHECK (esocial_status IN ('pendente', 'enviado', 'aceito', 'rejeitado')),
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(folha_id, funcionario_id)
);

CREATE INDEX IF NOT EXISTS idx_folha_calculos_empresa ON folha_calculos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_folha_calculos_folha ON folha_calculos(folha_id);
CREATE INDEX IF NOT EXISTS idx_folha_calculos_funcionario ON folha_calculos(funcionario_id);

-- =============================================
-- TABELA: folha_rubricas (rubricas da folha - e-Social S-1010)
-- =============================================
CREATE TABLE IF NOT EXISTS folha_rubricas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    
    tipo TEXT NOT NULL CHECK (tipo IN ('PROVENTO', 'DESCONTO', 'INFORMATIVO')),
    natureza TEXT NOT NULL,
    
    incide_inss INTEGER DEFAULT 0,
    incide_irrf INTEGER DEFAULT 0,
    incide_fgts INTEGER DEFAULT 0,
    incide_dsr INTEGER DEFAULT 0,
    
    codigo_esocial TEXT,
    
    ativo INTEGER DEFAULT 1,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_folha_rubricas_empresa ON folha_rubricas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_folha_rubricas_tipo ON folha_rubricas(tipo);

-- =============================================
-- TABELA: ferias_programacao (programacao de ferias)
-- =============================================
CREATE TABLE IF NOT EXISTS ferias_programacao (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    funcionario_id TEXT NOT NULL REFERENCES funcionarios(id),
    
    -- Periodo aquisitivo
    periodo_aquisitivo_inicio TEXT NOT NULL,
    periodo_aquisitivo_fim TEXT NOT NULL,
    
    -- Dias de direito
    dias_direito INTEGER DEFAULT 30,
    dias_ja_gozados INTEGER DEFAULT 0,
    dias_vendidos INTEGER DEFAULT 0,
    dias_disponiveis INTEGER DEFAULT 30,
    
    -- Limite para gozo
    limite_gozo TEXT NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'disponivel' CHECK (status IN (
        'disponivel',
        'programada',
        'em_gozo',
        'concluida',
        'vencida'
    )),
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(empresa_id, funcionario_id, periodo_aquisitivo_inicio)
);

CREATE INDEX IF NOT EXISTS idx_ferias_programacao_empresa ON ferias_programacao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ferias_programacao_funcionario ON ferias_programacao(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_ferias_programacao_status ON ferias_programacao(status);

-- =============================================
-- TABELA: ferias_solicitacoes (solicitacoes de ferias)
-- =============================================
CREATE TABLE IF NOT EXISTS ferias_solicitacoes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    funcionario_id TEXT NOT NULL REFERENCES funcionarios(id),
    programacao_id TEXT REFERENCES ferias_programacao(id),
    
    -- Periodo solicitado
    data_inicio TEXT NOT NULL,
    data_fim TEXT NOT NULL,
    dias_gozo INTEGER NOT NULL,
    
    -- Abono pecuniario (venda de ferias)
    abono_pecuniario INTEGER DEFAULT 0,
    dias_abono INTEGER DEFAULT 0,
    
    -- Adiantamento 13o
    adiantamento_13 INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'solicitada' CHECK (status IN (
        'solicitada',
        'aprovada',
        'reprovada',
        'em_gozo',
        'concluida',
        'cancelada'
    )),
    
    -- Aprovacao
    aprovador_id TEXT REFERENCES usuarios(id),
    aprovador_nome TEXT,
    data_aprovacao TEXT,
    motivo_reprovacao TEXT,
    
    -- Calculo
    salario_base REAL,
    valor_ferias REAL,
    valor_terco REAL,
    valor_abono REAL,
    valor_adiantamento_13 REAL,
    total_bruto REAL,
    inss REAL,
    irrf REAL,
    total_liquido REAL,
    
    -- e-Social
    esocial_evento_id TEXT,
    esocial_status TEXT CHECK (esocial_status IN ('pendente', 'enviado', 'aceito', 'rejeitado')),
    
    observacoes TEXT,
    
    created_by TEXT REFERENCES usuarios(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ferias_solicitacoes_empresa ON ferias_solicitacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ferias_solicitacoes_funcionario ON ferias_solicitacoes(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_ferias_solicitacoes_status ON ferias_solicitacoes(status);
CREATE INDEX IF NOT EXISTS idx_ferias_solicitacoes_data ON ferias_solicitacoes(data_inicio);

-- =============================================
-- TABELA: ferias_historico (auditoria)
-- =============================================
CREATE TABLE IF NOT EXISTS ferias_historico (
    id TEXT PRIMARY KEY,
    solicitacao_id TEXT NOT NULL REFERENCES ferias_solicitacoes(id),
    acao TEXT NOT NULL,
    status_anterior TEXT,
    status_novo TEXT,
    usuario_id TEXT REFERENCES usuarios(id),
    usuario_nome TEXT,
    descricao TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ferias_historico_solicitacao ON ferias_historico(solicitacao_id);

-- =============================================
-- TABELA: afastamentos (afastamentos de funcionarios)
-- =============================================
CREATE TABLE IF NOT EXISTS afastamentos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    funcionario_id TEXT NOT NULL REFERENCES funcionarios(id),
    
    tipo TEXT NOT NULL CHECK (tipo IN (
        'DOENCA',
        'ACIDENTE_TRABALHO',
        'LICENCA_MATERNIDADE',
        'LICENCA_PATERNIDADE',
        'SERVICO_MILITAR',
        'MANDATO_SINDICAL',
        'MANDATO_ELETIVO',
        'SUSPENSAO_DISCIPLINAR',
        'OUTROS'
    )),
    
    motivo TEXT NOT NULL,
    cid TEXT,
    
    data_inicio TEXT NOT NULL,
    data_fim_prevista TEXT,
    data_fim_real TEXT,
    
    dias_afastamento INTEGER,
    
    -- Documentos
    atestado_url TEXT,
    laudo_url TEXT,
    
    -- INSS (para afastamentos > 15 dias)
    inss_requerido INTEGER DEFAULT 0,
    inss_numero_beneficio TEXT,
    inss_data_concessao TEXT,
    
    -- Status
    status TEXT DEFAULT 'ativo' CHECK (status IN (
        'ativo',
        'encerrado',
        'prorrogado',
        'cancelado'
    )),
    
    -- e-Social (S-2230)
    esocial_evento_id TEXT,
    esocial_status TEXT CHECK (esocial_status IN ('pendente', 'enviado', 'aceito', 'rejeitado')),
    
    observacoes TEXT,
    
    created_by TEXT REFERENCES usuarios(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_afastamentos_empresa ON afastamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_afastamentos_funcionario ON afastamentos(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_afastamentos_tipo ON afastamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_afastamentos_status ON afastamentos(status);
CREATE INDEX IF NOT EXISTS idx_afastamentos_data ON afastamentos(data_inicio);

-- =============================================
-- TABELA: rescisoes (rescisoes de contrato)
-- =============================================
CREATE TABLE IF NOT EXISTS rescisoes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    funcionario_id TEXT NOT NULL REFERENCES funcionarios(id),
    
    tipo TEXT NOT NULL CHECK (tipo IN (
        'PEDIDO_DEMISSAO',
        'DISPENSA_SEM_JUSTA_CAUSA',
        'DISPENSA_COM_JUSTA_CAUSA',
        'TERMINO_CONTRATO',
        'ACORDO_MUTUO',
        'FALECIMENTO',
        'APOSENTADORIA'
    )),
    
    data_aviso TEXT,
    data_demissao TEXT NOT NULL,
    
    aviso_previo TEXT CHECK (aviso_previo IN (
        'TRABALHADO',
        'INDENIZADO',
        'DISPENSADO',
        'NAO_APLICAVEL'
    )),
    dias_aviso INTEGER DEFAULT 0,
    
    motivo TEXT,
    
    -- Calculo rescisorio
    saldo_salario REAL DEFAULT 0,
    ferias_vencidas REAL DEFAULT 0,
    ferias_proporcionais REAL DEFAULT 0,
    terco_ferias REAL DEFAULT 0,
    decimo_terceiro REAL DEFAULT 0,
    aviso_previo_valor REAL DEFAULT 0,
    multa_fgts REAL DEFAULT 0,
    outros_proventos REAL DEFAULT 0,
    total_proventos REAL DEFAULT 0,
    
    inss REAL DEFAULT 0,
    irrf REAL DEFAULT 0,
    outros_descontos REAL DEFAULT 0,
    total_descontos REAL DEFAULT 0,
    
    total_liquido REAL DEFAULT 0,
    
    -- FGTS
    fgts_depositar REAL DEFAULT 0,
    fgts_multa REAL DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'em_calculo' CHECK (status IN (
        'em_calculo',
        'calculada',
        'homologada',
        'paga',
        'cancelada'
    )),
    
    -- Homologacao
    data_homologacao TEXT,
    local_homologacao TEXT,
    
    -- Exame demissional
    exame_data TEXT,
    exame_resultado TEXT CHECK (exame_resultado IN ('APTO', 'INAPTO')),
    exame_aso_url TEXT,
    
    -- e-Social (S-2299)
    esocial_evento_id TEXT,
    esocial_status TEXT CHECK (esocial_status IN ('pendente', 'enviado', 'aceito', 'rejeitado')),
    
    observacoes TEXT,
    
    created_by TEXT REFERENCES usuarios(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rescisoes_empresa ON rescisoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_rescisoes_funcionario ON rescisoes(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_rescisoes_tipo ON rescisoes(tipo);
CREATE INDEX IF NOT EXISTS idx_rescisoes_status ON rescisoes(status);
CREATE INDEX IF NOT EXISTS idx_rescisoes_data ON rescisoes(data_demissao);

-- =============================================
-- TABELA: holerites (recibos de pagamento)
-- =============================================
CREATE TABLE IF NOT EXISTS holerites (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    funcionario_id TEXT NOT NULL REFERENCES funcionarios(id),
    folha_id TEXT REFERENCES folha_pagamento(id),
    calculo_id TEXT REFERENCES folha_calculos(id),
    
    competencia TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('MENSAL', 'FERIAS', '13_SALARIO', 'RESCISAO', 'ADIANTAMENTO')),
    
    -- PDF gerado
    pdf_url TEXT,
    pdf_gerado_em TEXT,
    
    -- Envio
    enviado INTEGER DEFAULT 0,
    enviado_em TEXT,
    enviado_para TEXT,
    
    -- Visualizacao
    visualizado INTEGER DEFAULT 0,
    visualizado_em TEXT,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_holerites_empresa ON holerites(empresa_id);
CREATE INDEX IF NOT EXISTS idx_holerites_funcionario ON holerites(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_holerites_competencia ON holerites(competencia);

-- =============================================
-- TABELA: config_rh (configuracoes do modulo RH)
-- =============================================
CREATE TABLE IF NOT EXISTS config_rh (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL UNIQUE REFERENCES empresas(id),
    
    -- Folha de pagamento
    dia_fechamento_folha INTEGER DEFAULT 25,
    dia_pagamento INTEGER DEFAULT 5,
    
    -- Ferias
    dias_antecedencia_aviso_ferias INTEGER DEFAULT 30,
    permitir_fracionamento_ferias INTEGER DEFAULT 1,
    minimo_dias_periodo_ferias INTEGER DEFAULT 5,
    
    -- Ponto
    tolerancia_atraso_minutos INTEGER DEFAULT 10,
    hora_extra_automatica INTEGER DEFAULT 0,
    
    -- Beneficios
    percentual_desconto_vt REAL DEFAULT 6,
    
    -- e-Social
    esocial_ativo INTEGER DEFAULT 0,
    esocial_ambiente TEXT DEFAULT 'homologacao',
    
    -- Notificacoes
    notificar_vencimento_ferias INTEGER DEFAULT 1,
    notificar_aniversarios INTEGER DEFAULT 1,
    notificar_vencimento_documentos INTEGER DEFAULT 1,
    
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- VIEW: vw_ferias_vencendo
-- =============================================
CREATE VIEW IF NOT EXISTS vw_ferias_vencendo AS
SELECT 
    fp.id,
    fp.empresa_id,
    fp.funcionario_id,
    f.nome as funcionario_nome,
    f.matricula,
    fp.periodo_aquisitivo_inicio,
    fp.periodo_aquisitivo_fim,
    fp.dias_disponiveis,
    fp.limite_gozo,
    CAST(julianday(fp.limite_gozo) - julianday('now') AS INTEGER) as dias_para_vencer,
    CASE 
        WHEN julianday(fp.limite_gozo) < julianday('now') THEN 'VENCIDA'
        WHEN julianday(fp.limite_gozo) - julianday('now') <= 30 THEN 'URGENTE'
        WHEN julianday(fp.limite_gozo) - julianday('now') <= 60 THEN 'ATENCAO'
        ELSE 'OK'
    END as situacao
FROM ferias_programacao fp
JOIN funcionarios f ON f.id = fp.funcionario_id
WHERE fp.status = 'disponivel'
AND fp.dias_disponiveis > 0
ORDER BY fp.limite_gozo ASC;

-- =============================================
-- VIEW: vw_admissoes_pendentes
-- =============================================
CREATE VIEW IF NOT EXISTS vw_admissoes_pendentes AS
SELECT 
    a.*,
    c.nome as cargo_nome,
    d.nome as departamento_nome,
    CAST(julianday(a.data_admissao_prevista) - julianday('now') AS INTEGER) as dias_para_admissao
FROM admissoes a
LEFT JOIN cargos c ON c.id = a.cargo_id
LEFT JOIN departamentos d ON d.id = a.departamento_id
WHERE a.status NOT IN ('admitido', 'reprovado', 'cancelado')
ORDER BY a.data_admissao_prevista ASC;

-- =============================================
-- VIEW: vw_folha_resumo
-- =============================================
CREATE VIEW IF NOT EXISTS vw_folha_resumo AS
SELECT 
    fp.id as folha_id,
    fp.empresa_id,
    fp.competencia,
    fp.tipo,
    fp.status,
    COUNT(fc.id) as total_funcionarios,
    SUM(fc.total_proventos) as total_proventos,
    SUM(fc.total_descontos) as total_descontos,
    SUM(fc.salario_liquido) as total_liquido,
    SUM(fc.inss) as total_inss,
    SUM(fc.irrf) as total_irrf,
    SUM(fc.fgts_valor) as total_fgts
FROM folha_pagamento fp
LEFT JOIN folha_calculos fc ON fc.folha_id = fp.id
GROUP BY fp.id, fp.empresa_id, fp.competencia, fp.tipo, fp.status;

-- =============================================
-- VIEW: vw_afastamentos_ativos
-- =============================================
CREATE VIEW IF NOT EXISTS vw_afastamentos_ativos AS
SELECT 
    a.*,
    f.nome as funcionario_nome,
    f.matricula,
    CAST(julianday('now') - julianday(a.data_inicio) AS INTEGER) as dias_afastado
FROM afastamentos a
JOIN funcionarios f ON f.id = a.funcionario_id
WHERE a.status = 'ativo'
ORDER BY a.data_inicio ASC;
