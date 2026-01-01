-- =============================================
-- PLANAC ERP - Migration 0069
-- Fiscal: ADRC-ST (Arquivo Digital da Recuperacao, Ressarcimento e Complementacao do ICMS-ST)
-- Obrigacao acessoria da Receita Estadual do Parana
-- =============================================
-- Criado em: 01/01/2026
-- Descricao: Tabelas para geracao do arquivo ADRC-ST conforme Manual versao 1.6
--            Suporta recuperacao, ressarcimento e complementacao de ICMS-ST e FECOP
-- =============================================

-- =============================================
-- 1. ADICIONAR CAMPOS DE ICMS-ST NA TABELA DE ITENS DE ENTRADA
-- =============================================
-- Campos necessarios para calcular o ICMS suportado na entrada
ALTER TABLE dfe_documentos_entrada_itens ADD COLUMN icms_st_base_retencao REAL DEFAULT 0;
ALTER TABLE dfe_documentos_entrada_itens ADD COLUMN icms_st_valor_retido REAL DEFAULT 0;
ALTER TABLE dfe_documentos_entrada_itens ADD COLUMN icms_st_aliquota REAL DEFAULT 0;
ALTER TABLE dfe_documentos_entrada_itens ADD COLUMN icms_proprio_valor REAL DEFAULT 0;
ALTER TABLE dfe_documentos_entrada_itens ADD COLUMN icms_suportado_total REAL DEFAULT 0;

-- =============================================
-- 2. TABELA DE MVA (Margem de Valor Agregado)
-- =============================================
-- Baseado na Resolucao SEFA 571/2019
CREATE TABLE IF NOT EXISTS mva_tabela (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    -- Identificacao do produto
    cest TEXT NOT NULL,                     -- Codigo CEST (7 digitos)
    ncm TEXT,                               -- NCM (8 digitos) - opcional para filtro mais especifico
    descricao TEXT NOT NULL,                -- Descricao do produto
    
    -- MVA
    mva_original REAL NOT NULL,             -- MVA ST Original (%)
    mva_ajustada_4 REAL,                    -- MVA Ajustada para aliquota interestadual 4%
    mva_ajustada_7 REAL,                    -- MVA Ajustada para aliquota interestadual 7%
    mva_ajustada_12 REAL,                   -- MVA Ajustada para aliquota interestadual 12%
    
    -- Vigencia
    vigencia_inicio TEXT NOT NULL,          -- Data inicio vigencia
    vigencia_fim TEXT,                      -- Data fim vigencia (NULL = vigente)
    
    -- Fonte
    resolucao TEXT,                         -- Numero da resolucao (ex: 571/2019)
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_mva_cest ON mva_tabela(cest);
CREATE INDEX idx_mva_ncm ON mva_tabela(ncm);
CREATE INDEX idx_mva_vigencia ON mva_tabela(vigencia_inicio, vigencia_fim);

-- =============================================
-- 3. APURACOES ADRC-ST (Cabecalho)
-- =============================================
-- Registro principal da apuracao mensal
CREATE TABLE IF NOT EXISTS adrcst_apuracoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    filial_id TEXT REFERENCES filiais(id),
    
    -- Periodo de referencia
    mes_ano TEXT NOT NULL,                  -- Formato MMAAAA
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    
    -- Versao do leiaute (campo A02)
    cod_versao INTEGER NOT NULL DEFAULT 110,
    
    -- Finalidade (campo A07)
    cd_fin INTEGER NOT NULL DEFAULT 0,      -- 0=Original, 1=Substituto
    
    -- Regime especial (campo A08)
    n_reg_especial TEXT,
    
    -- Centro de distribuicao (campos A09, A10)
    cnpj_cd TEXT,                           -- CNPJ do CD
    ie_cd TEXT,                             -- IE do CD
    
    -- Opcoes de recuperacao/ressarcimento/complementacao (campos A11-A14)
    opcao_r1200 INTEGER,                    -- 0=Conta grafica, 1=Ressarcimento, 2=Complementacao
    opcao_r1300 INTEGER,                    -- 0=Conta grafica, 1=Ressarcimento
    opcao_r1400 INTEGER,                    -- 0=Conta grafica, 1=Ressarcimento
    opcao_r1500 INTEGER,                    -- 0=Conta grafica, 1=Ressarcimento
    
    -- Totais do Registro 9000 (Apuracao Total)
    -- Saidas para consumidor final (R1200)
    x01_vl_icmsst_ressarcir_r1200 REAL DEFAULT 0,
    x02_vl_icmsst_recuperar_r1200 REAL DEFAULT 0,
    x03_vl_icmsst_complementar_r1200 REAL DEFAULT 0,
    -- Saidas interestaduais (R1300)
    x04_vl_icmsst_recuperar_r1300 REAL DEFAULT 0,
    -- Saidas art. 119 (R1400)
    x05_vl_icmsst_recuperar_r1400 REAL DEFAULT 0,
    -- Saidas Simples Nacional (R1500)
    x06_vl_icmsst_recuperar_r1500 REAL DEFAULT 0,
    -- FECOP
    x07_vl_fecop_ressarcir_r1200 REAL DEFAULT 0,
    x08_vl_fecop_recuperar_r1200 REAL DEFAULT 0,
    x09_vl_fecop_complementar_r1200 REAL DEFAULT 0,
    x10_vl_fecop_recuperar_r1300 REAL DEFAULT 0,
    x11_vl_fecop_recuperar_r1400 REAL DEFAULT 0,
    x12_vl_fecop_recuperar_r1500 REAL DEFAULT 0,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN (
        'rascunho',         -- Em elaboracao
        'calculado',        -- Calculos realizados
        'gerado',           -- Arquivo TXT gerado
        'enviado',          -- Enviado ao portal
        'protocolado',      -- Protocolo recebido
        'substituido',      -- Substituido por outro arquivo
        'erro'              -- Erro na geracao/envio
    )),
    
    -- Protocolo
    protocolo_adrcst TEXT,                  -- Numero do protocolo recebido
    data_protocolo TEXT,
    
    -- Estatisticas do arquivo
    total_registros INTEGER DEFAULT 0,
    total_linhas INTEGER DEFAULT 0,
    
    -- Armazenamento
    arquivo_txt_storage_key TEXT,           -- Arquivo TXT no R2
    arquivo_zip_storage_key TEXT,           -- Arquivo ZIP no R2
    hash_arquivo TEXT,
    
    -- Observacoes
    observacoes TEXT,
    
    -- Erro
    erro_mensagem TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, filial_id, mes_ano, cd_fin)
);

CREATE INDEX idx_adrcst_apuracoes_empresa ON adrcst_apuracoes(empresa_id);
CREATE INDEX idx_adrcst_apuracoes_filial ON adrcst_apuracoes(filial_id);
CREATE INDEX idx_adrcst_apuracoes_periodo ON adrcst_apuracoes(ano, mes);
CREATE INDEX idx_adrcst_apuracoes_status ON adrcst_apuracoes(status);

-- =============================================
-- 4. ITENS DA APURACAO (Registro 1000)
-- =============================================
-- Um registro por produto na apuracao
CREATE TABLE IF NOT EXISTS adrcst_itens (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    apuracao_id TEXT NOT NULL REFERENCES adrcst_apuracoes(id) ON DELETE CASCADE,
    
    -- Produto
    produto_id TEXT REFERENCES produtos(id),
    
    -- Campos do Registro 1000
    ind_fecop INTEGER NOT NULL DEFAULT 0,   -- 0=Nao sujeito, 1=Sujeito ao FECOP
    cod_item TEXT NOT NULL,                 -- Codigo do item (B03)
    cod_barras TEXT,                        -- GTIN/EAN (B04)
    cod_anp TEXT,                           -- Codigo ANP (B05)
    ncm TEXT NOT NULL,                      -- NCM 8 digitos (B06)
    cest TEXT NOT NULL,                     -- CEST 7 digitos (B07)
    descr_item TEXT NOT NULL,               -- Descricao (B08)
    unid_item TEXT NOT NULL,                -- Unidade de medida (B09)
    aliq_icms_item REAL NOT NULL,           -- Aliquota ICMS interna (B10)
    aliq_fecop REAL DEFAULT 0,              -- Aliquota FECOP (B11)
    qtd_tot_entrada REAL NOT NULL DEFAULT 0, -- Quantidade total entrada (B12)
    qtd_tot_saida REAL NOT NULL DEFAULT 0,  -- Quantidade total saida (B13)
    
    -- Campos do Registro 1100 (Totalizador entradas)
    d02_qtd_tot_entrada REAL DEFAULT 0,
    d03_menor_vl_unit_item REAL DEFAULT 0,
    d04_vl_bc_icmsst_unit_med REAL DEFAULT 0,
    d05_vl_tot_icms_suport_entr REAL DEFAULT 0,
    d06_vl_unit_med_icms_suport_entr REAL DEFAULT 0,
    
    -- Campos do Registro 1010 (Inventario - apenas Simples Nacional)
    c03_unid_item TEXT,
    c04_qtd REAL DEFAULT 0,
    c05_vl_tot_item REAL DEFAULT 0,
    c06_txt_compl TEXT,
    
    -- Totais por cenario (calculados)
    -- R1200 - Saidas consumidor final
    f02_qtd_saida_r1200 REAL DEFAULT 0,
    f03_vl_unit_icms_efetivo_r1200 REAL DEFAULT 0,
    f04_vl_icms_efetivo_r1200 REAL DEFAULT 0,
    f05_vl_confronto_r1200 REAL DEFAULT 0,
    f06_vl_ressarcir_r1200 REAL DEFAULT 0,
    f07_vl_complementar_r1200 REAL DEFAULT 0,
    f08_vl_icmsst_ressarcir_r1200 REAL DEFAULT 0,
    f09_vl_icmsst_complementar_r1200 REAL DEFAULT 0,
    f10_vl_fecop_ressarcir_r1200 REAL DEFAULT 0,
    f11_vl_fecop_complementar_r1200 REAL DEFAULT 0,
    
    -- R1300 - Saidas interestaduais
    h02_qtd_saida_r1300 REAL DEFAULT 0,
    h03_vl_confronto_r1300 REAL DEFAULT 0,
    h04_vl_icmsst_recuperar_r1300 REAL DEFAULT 0,
    h05_vl_fecop_recuperar_r1300 REAL DEFAULT 0,
    
    -- R1400 - Saidas art. 119
    j02_qtd_saida_r1400 REAL DEFAULT 0,
    j03_vl_confronto_r1400 REAL DEFAULT 0,
    j04_vl_icmsst_recuperar_r1400 REAL DEFAULT 0,
    j05_vl_fecop_recuperar_r1400 REAL DEFAULT 0,
    
    -- R1500 - Saidas Simples Nacional
    l02_qtd_saida_r1500 REAL DEFAULT 0,
    l03_vl_unit_icms_efetivo_r1500 REAL DEFAULT 0,
    l04_vl_icms_efetivo_r1500 REAL DEFAULT 0,
    l05_mva_icmsst REAL DEFAULT 0,
    l06_vl_confronto_r1500 REAL DEFAULT 0,
    l07_vl_icmsst_recuperar_r1500 REAL DEFAULT 0,
    l08_vl_fecop_recuperar_r1500 REAL DEFAULT 0,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_adrcst_itens_apuracao ON adrcst_itens(apuracao_id);
CREATE INDEX idx_adrcst_itens_produto ON adrcst_itens(produto_id);
CREATE INDEX idx_adrcst_itens_ncm ON adrcst_itens(ncm);
CREATE INDEX idx_adrcst_itens_cest ON adrcst_itens(cest);

-- =============================================
-- 5. DOCUMENTOS DA APURACAO (Entradas e Saidas)
-- =============================================
-- Registros 1110, 1120, 1210, 1220, 1310, 1320, 1410, 1420, 1510, 1520
CREATE TABLE IF NOT EXISTS adrcst_documentos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    item_id TEXT NOT NULL REFERENCES adrcst_itens(id) ON DELETE CASCADE,
    
    -- Tipo de documento
    tipo_registro TEXT NOT NULL CHECK (tipo_registro IN (
        '1110',     -- Entrada
        '1120',     -- Devolucao entrada
        '1210',     -- Saida consumidor final
        '1220',     -- Devolucao saida consumidor final
        '1310',     -- Saida interestadual
        '1320',     -- Devolucao saida interestadual
        '1410',     -- Saida art. 119
        '1420',     -- Devolucao saida art. 119
        '1510',     -- Saida Simples Nacional
        '1520'      -- Devolucao saida Simples Nacional
    )),
    
    -- Campos comuns
    dt_doc TEXT NOT NULL,                   -- Data emissao (DDMMAAAA)
    cst_csosn TEXT,                         -- CST ou CSOSN
    chave TEXT NOT NULL,                    -- Chave de acesso 44 digitos
    n_nf INTEGER NOT NULL,                  -- Numero NF
    cnpj_emit TEXT NOT NULL,                -- CNPJ emitente
    uf_emit TEXT NOT NULL,                  -- UF emitente
    cnpj_dest TEXT NOT NULL,                -- CNPJ destinatario
    uf_dest TEXT NOT NULL,                  -- UF destinatario
    cfop TEXT NOT NULL,                     -- CFOP
    n_item INTEGER NOT NULL,                -- Numero do item na NF
    unid_item TEXT NOT NULL,                -- Unidade de medida
    
    -- Campos especificos de entrada (1110)
    cod_resp_ret INTEGER,                   -- 1=Remetente direto, 2=Indireto, 3=Proprio
    qtd_entrada REAL DEFAULT 0,
    vl_unit_item REAL DEFAULT 0,
    vl_bc_icms_st REAL DEFAULT 0,
    vl_icms_suport_entr REAL DEFAULT 0,
    
    -- Campos especificos de devolucao entrada (1120)
    qtd_devolvida_entrada REAL DEFAULT 0,
    vl_unit_item_dev_entrada REAL DEFAULT 0,
    vl_bc_icms_st_dev_entrada REAL DEFAULT 0,
    vl_icms_suport_dev_entrada REAL DEFAULT 0,
    
    -- Campos especificos de saida (1210, 1310, 1410, 1510)
    qtd_saida REAL DEFAULT 0,
    vl_unit_icms_efetivo REAL DEFAULT 0,
    vl_icms_efetivo REAL DEFAULT 0,
    
    -- Campos especificos de devolucao saida (1220, 1320, 1420, 1520)
    qtd_devolvida_saida REAL DEFAULT 0,
    vl_unit_icms_efetivo_dev REAL DEFAULT 0,
    vl_icms_efetivo_dev REAL DEFAULT 0,
    
    -- Vinculacao com documentos do ERP
    dfe_documento_id TEXT REFERENCES dfe_documentos_entrada(id),
    nfe_id TEXT REFERENCES notas_fiscais(id),
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_adrcst_docs_item ON adrcst_documentos(item_id);
CREATE INDEX idx_adrcst_docs_tipo ON adrcst_documentos(tipo_registro);
CREATE INDEX idx_adrcst_docs_chave ON adrcst_documentos(chave);
CREATE INDEX idx_adrcst_docs_data ON adrcst_documentos(dt_doc);

-- =============================================
-- 6. GUIAS DE RECOLHIMENTO (Registro 1115)
-- =============================================
-- Obrigatorio a partir de 01/06/2025 para ST recolhido pela entrada
CREATE TABLE IF NOT EXISTS adrcst_guias_recolhimento (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    documento_id TEXT NOT NULL REFERENCES adrcst_documentos(id) ON DELETE CASCADE,
    
    -- Campos do Registro 1115
    tp_guia INTEGER NOT NULL,               -- 1=GNRE, 2=GR-PR
    num_ident TEXT NOT NULL,                -- Numero SEFA (GR-PR) ou Numero Controle (GNRE)
    dt_doc TEXT NOT NULL,                   -- Data emissao (DDMMAAAA)
    dt_pag TEXT NOT NULL,                   -- Data pagamento (DDMMAAAA)
    cod_arrecad TEXT NOT NULL,              -- Codigo de arrecadacao
    vl_recol REAL NOT NULL,                 -- Valor recolhido
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_adrcst_guias_documento ON adrcst_guias_recolhimento(documento_id);

-- =============================================
-- 7. VALIDACOES/ALERTAS DA APURACAO
-- =============================================
CREATE TABLE IF NOT EXISTS adrcst_validacoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    apuracao_id TEXT NOT NULL REFERENCES adrcst_apuracoes(id) ON DELETE CASCADE,
    item_id TEXT REFERENCES adrcst_itens(id) ON DELETE CASCADE,
    documento_id TEXT REFERENCES adrcst_documentos(id) ON DELETE CASCADE,
    
    -- Tipo de validacao
    tipo TEXT NOT NULL CHECK (tipo IN ('erro', 'aviso', 'info')),
    codigo TEXT NOT NULL,                   -- Codigo da regra (ex: B13-20, I15-10)
    mensagem TEXT NOT NULL,
    
    -- Detalhes
    campo TEXT,                             -- Campo relacionado
    valor_encontrado TEXT,
    valor_esperado TEXT,
    
    -- Controle
    resolvido INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_adrcst_validacoes_apuracao ON adrcst_validacoes(apuracao_id);
CREATE INDEX idx_adrcst_validacoes_tipo ON adrcst_validacoes(tipo);

-- =============================================
-- 8. ARQUIVOS GERADOS
-- =============================================
CREATE TABLE IF NOT EXISTS adrcst_arquivos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    apuracao_id TEXT NOT NULL REFERENCES adrcst_apuracoes(id) ON DELETE CASCADE,
    
    -- Identificacao
    nome_arquivo TEXT NOT NULL,
    versao INTEGER NOT NULL DEFAULT 1,      -- Versao do arquivo (incrementa em substituicoes)
    
    -- Estatisticas
    total_linhas INTEGER NOT NULL,
    tamanho_bytes INTEGER,
    hash_sha256 TEXT,
    
    -- Armazenamento
    storage_key TEXT NOT NULL,              -- Chave no R2
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_adrcst_arquivos_apuracao ON adrcst_arquivos(apuracao_id);

-- =============================================
-- 9. LOG DE OPERACOES ADRC-ST
-- =============================================
CREATE TABLE IF NOT EXISTS adrcst_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    apuracao_id TEXT REFERENCES adrcst_apuracoes(id),
    
    -- Operacao
    operacao TEXT NOT NULL,                 -- calculo, geracao, envio, substituicao, etc.
    descricao TEXT,
    
    -- Resultado
    sucesso INTEGER DEFAULT 1,
    erro_mensagem TEXT,
    
    -- Detalhes
    detalhes TEXT,                          -- JSON com detalhes adicionais
    
    -- Usuario
    usuario_id TEXT REFERENCES usuarios(id),
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_adrcst_logs_empresa ON adrcst_logs(empresa_id);
CREATE INDEX idx_adrcst_logs_apuracao ON adrcst_logs(apuracao_id);
CREATE INDEX idx_adrcst_logs_operacao ON adrcst_logs(operacao);
CREATE INDEX idx_adrcst_logs_data ON adrcst_logs(created_at);

-- =============================================
-- 10. CONFIGURACOES ADRC-ST POR EMPRESA
-- =============================================
CREATE TABLE IF NOT EXISTS adrcst_configuracoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Opcoes padrao de recuperacao/ressarcimento
    opcao_padrao_r1200 INTEGER DEFAULT 0,   -- 0=Conta grafica, 1=Ressarcimento, 2=Complementacao
    opcao_padrao_r1300 INTEGER DEFAULT 0,   -- 0=Conta grafica, 1=Ressarcimento
    opcao_padrao_r1400 INTEGER DEFAULT 0,   -- 0=Conta grafica, 1=Ressarcimento
    opcao_padrao_r1500 INTEGER DEFAULT 0,   -- 0=Conta grafica, 1=Ressarcimento
    
    -- Centro de distribuicao padrao
    cnpj_cd_padrao TEXT,
    ie_cd_padrao TEXT,
    
    -- Regime especial
    n_reg_especial TEXT,
    
    -- Alertas
    alertar_entradas_insuficientes INTEGER DEFAULT 1,
    alertar_unidade_divergente INTEGER DEFAULT 1,
    alertar_inventario_faltante INTEGER DEFAULT 1,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id)
);

CREATE INDEX idx_adrcst_config_empresa ON adrcst_configuracoes(empresa_id);

-- =============================================
-- COMENTARIOS PARA DESENVOLVEDORES
-- =============================================
-- 
-- FLUXO DE USO:
-- 1. Configurar empresa (adrcst_configuracoes)
-- 2. Criar nova apuracao para o mes/ano (adrcst_apuracoes)
-- 3. Sistema coleta automaticamente:
--    - Entradas do periodo (dfe_documentos_entrada + itens)
--    - Saidas do periodo (notas_fiscais + itens)
--    - Devolucoes
-- 4. Sistema calcula valores por produto (adrcst_itens)
-- 5. Sistema valida regras (adrcst_validacoes)
-- 6. Usuario confere e ajusta se necessario
-- 7. Sistema gera arquivo TXT (adrcst_arquivos)
-- 8. Usuario baixa ZIP e envia ao portal Receita/PR
-- 9. Usuario registra protocolo recebido
--
-- CENARIOS DE RECUPERACAO/RESSARCIMENTO:
-- R1200: Saidas internas para consumidor final
--        - Pode recuperar, ressarcir OU complementar
-- R1300: Saidas interestaduais
--        - Apenas recuperar ou ressarcir
-- R1400: Saidas art. 119 (merenda escolar, restaurantes, etc.)
--        - Apenas recuperar ou ressarcir
-- R1500: Saidas para contribuintes Simples Nacional
--        - Apenas recuperar ou ressarcir
--        - Requer inventario (Registro 1010)
--
-- CODIGOS DE AJUSTE EFD:
-- PR020211: Recuperacao ICMS-ST saidas interestaduais
-- PR020170: Recuperacao ICMS-ST saidas consumidor final
-- PR020222: Recuperacao ICMS-ST saidas Simples Nacional
-- PR020171: Recuperacao ICMS-ST saidas art. 119
--
-- REGISTRO 1115 (a partir de 01/06/2025):
-- Obrigatorio quando houver recolhimento de ST pela entrada por operacao
-- Vinculado ao Registro 1110 (entrada)
-- =============================================
