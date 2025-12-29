-- =============================================
-- PLANAC ERP - Migration 0013
-- Fiscal: SPED (Sistema Público de Escrituração Digital)
-- Suporte para ACBr API/ACBrLib
-- =============================================
-- Criado em: 28/12/2025
-- Descrição: Tabelas para gestão de obrigações SPED
--            (EFD ICMS/IPI, EFD Contribuições, ECD, ECF)
-- =============================================

-- =============================================
-- 1. CONFIGURAÇÃO SPED POR EMPRESA
-- =============================================
CREATE TABLE IF NOT EXISTS sped_configuracoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Tipo de SPED
    tipo_sped TEXT NOT NULL CHECK (tipo_sped IN (
        'efd_icms_ipi',     -- SPED Fiscal
        'efd_contribuicoes', -- SPED PIS/Cofins
        'ecd',              -- SPED Contábil
        'ecf'               -- Escrituração Contábil Fiscal
    )),
    
    -- Dados do contribuinte
    cnpj TEXT NOT NULL,
    inscricao_estadual TEXT,
    inscricao_municipal TEXT,
    
    -- Perfil de apresentação (EFD ICMS/IPI)
    perfil TEXT DEFAULT 'A' CHECK (perfil IN ('A', 'B', 'C')),
    
    -- Indicadores
    tipo_atividade INTEGER DEFAULT 0,       -- 0=Industrial/Equiparado, 1=Outros
    indicador_inicio_periodo INTEGER DEFAULT 0,  -- 0=Primeira do período, 1=Não é primeira
    
    -- Regime tributário
    regime_tributario INTEGER DEFAULT 1,    -- 1=Simples, 2=Simples Excesso, 3=Normal
    
    -- Contador responsável
    contador_nome TEXT,
    contador_cpf TEXT,
    contador_crc TEXT,
    contador_cnpj TEXT,
    contador_email TEXT,
    
    -- Configurações de geração
    versao_layout TEXT,                     -- Versão do layout (ex: '017' para EFD ICMS/IPI)
    finalidade TEXT DEFAULT 'original' CHECK (finalidade IN ('original', 'retificadora')),
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, tipo_sped)
);

CREATE INDEX idx_sped_config_empresa ON sped_configuracoes(empresa_id);
CREATE INDEX idx_sped_config_tipo ON sped_configuracoes(tipo_sped);

-- =============================================
-- 2. ARQUIVOS SPED GERADOS
-- =============================================
CREATE TABLE IF NOT EXISTS sped_arquivos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    configuracao_id TEXT REFERENCES sped_configuracoes(id),
    
    -- Tipo de SPED
    tipo_sped TEXT NOT NULL CHECK (tipo_sped IN (
        'efd_icms_ipi',
        'efd_contribuicoes',
        'ecd',
        'ecf'
    )),
    
    -- Período de referência
    ano INTEGER NOT NULL,
    mes INTEGER,                            -- NULL para ECD/ECF (anual)
    data_inicio TEXT NOT NULL,
    data_fim TEXT NOT NULL,
    
    -- Finalidade
    finalidade TEXT NOT NULL DEFAULT 'original' CHECK (finalidade IN ('original', 'retificadora')),
    numero_recibo_anterior TEXT,            -- Para retificadora
    
    -- Versão do layout
    versao_layout TEXT NOT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN (
        'rascunho',         -- Em elaboração
        'gerado',           -- Arquivo gerado
        'validado',         -- Validado pelo PVA
        'assinado',         -- Assinado digitalmente
        'transmitido',      -- Transmitido à RFB
        'aceito',           -- Aceito pela RFB
        'rejeitado',        -- Rejeitado pela RFB
        'erro'              -- Erro na geração
    )),
    
    -- Validação
    validado INTEGER DEFAULT 0,
    data_validacao TEXT,
    erros_validacao TEXT,                   -- JSON array de erros
    avisos_validacao TEXT,                  -- JSON array de avisos
    
    -- Assinatura
    assinado INTEGER DEFAULT 0,
    data_assinatura TEXT,
    certificado_usado TEXT,
    
    -- Transmissão
    transmitido INTEGER DEFAULT 0,
    data_transmissao TEXT,
    numero_recibo TEXT,
    protocolo TEXT,
    
    -- Estatísticas
    total_registros INTEGER DEFAULT 0,
    total_linhas INTEGER DEFAULT 0,
    
    -- Armazenamento
    arquivo_txt_storage_key TEXT,           -- Arquivo TXT no R2
    arquivo_assinado_storage_key TEXT,      -- Arquivo assinado no R2
    recibo_storage_key TEXT,                -- Recibo de transmissão no R2
    
    -- Hash
    hash_arquivo TEXT,                      -- Hash do arquivo gerado
    
    -- Erro
    erro_mensagem TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sped_arquivos_empresa ON sped_arquivos(empresa_id);
CREATE INDEX idx_sped_arquivos_tipo ON sped_arquivos(tipo_sped);
CREATE INDEX idx_sped_arquivos_periodo ON sped_arquivos(ano, mes);
CREATE INDEX idx_sped_arquivos_status ON sped_arquivos(status);

-- =============================================
-- 3. BLOCOS SPED (Controle de geração)
-- =============================================
-- Controla quais blocos foram gerados para cada arquivo
CREATE TABLE IF NOT EXISTS sped_arquivos_blocos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    arquivo_id TEXT NOT NULL REFERENCES sped_arquivos(id) ON DELETE CASCADE,
    
    -- Identificação do bloco
    bloco TEXT NOT NULL,                    -- 0, 1, 9, B, C, D, E, G, H, K, etc.
    descricao TEXT,
    
    -- Estatísticas
    total_registros INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'gerado', 'erro')),
    erro_mensagem TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sped_blocos_arquivo ON sped_arquivos_blocos(arquivo_id);

-- =============================================
-- 4. REGISTROS SPED (Para auditoria/debug)
-- =============================================
-- Armazena registros específicos para auditoria (opcional, pode ser muito grande)
CREATE TABLE IF NOT EXISTS sped_registros_auditoria (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    arquivo_id TEXT NOT NULL REFERENCES sped_arquivos(id) ON DELETE CASCADE,
    
    -- Identificação
    bloco TEXT NOT NULL,
    registro TEXT NOT NULL,                 -- Ex: 0000, C100, D100, etc.
    linha INTEGER,
    
    -- Conteúdo
    conteudo TEXT,                          -- Linha completa do registro
    
    -- Referência (para rastreabilidade)
    documento_tipo TEXT,                    -- nfe, cte, nfse, etc.
    documento_chave TEXT,                   -- Chave de acesso ou ID
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sped_registros_arquivo ON sped_registros_auditoria(arquivo_id);
CREATE INDEX idx_sped_registros_tipo ON sped_registros_auditoria(registro);

-- =============================================
-- 5. APURAÇÕES ICMS (EFD ICMS/IPI - Bloco E)
-- =============================================
CREATE TABLE IF NOT EXISTS sped_apuracoes_icms (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    arquivo_id TEXT REFERENCES sped_arquivos(id),
    
    -- Período
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    
    -- Valores de entrada
    valor_total_debitos REAL DEFAULT 0,
    valor_ajustes_debitos REAL DEFAULT 0,
    valor_total_ajustes_debitos REAL DEFAULT 0,
    valor_estornos_creditos REAL DEFAULT 0,
    
    -- Valores de saída
    valor_total_creditos REAL DEFAULT 0,
    valor_ajustes_creditos REAL DEFAULT 0,
    valor_total_ajustes_creditos REAL DEFAULT 0,
    valor_estornos_debitos REAL DEFAULT 0,
    
    -- Saldo
    valor_saldo_credor_anterior REAL DEFAULT 0,
    valor_saldo_apurado REAL DEFAULT 0,
    valor_total_deducoes REAL DEFAULT 0,
    valor_icms_recolher REAL DEFAULT 0,
    valor_saldo_credor_transportar REAL DEFAULT 0,
    valor_debitado_extra_apuracao REAL DEFAULT 0,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, ano, mes)
);

CREATE INDEX idx_sped_apuracoes_icms_empresa ON sped_apuracoes_icms(empresa_id);
CREATE INDEX idx_sped_apuracoes_icms_periodo ON sped_apuracoes_icms(ano, mes);

-- =============================================
-- 6. APURAÇÕES PIS/COFINS (EFD Contribuições)
-- =============================================
CREATE TABLE IF NOT EXISTS sped_apuracoes_contribuicoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    arquivo_id TEXT REFERENCES sped_arquivos(id),
    
    -- Período
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    
    -- PIS
    pis_debito REAL DEFAULT 0,
    pis_credito REAL DEFAULT 0,
    pis_ajuste_debito REAL DEFAULT 0,
    pis_ajuste_credito REAL DEFAULT 0,
    pis_saldo_credor_anterior REAL DEFAULT 0,
    pis_valor_recolher REAL DEFAULT 0,
    pis_saldo_credor_transportar REAL DEFAULT 0,
    
    -- COFINS
    cofins_debito REAL DEFAULT 0,
    cofins_credito REAL DEFAULT 0,
    cofins_ajuste_debito REAL DEFAULT 0,
    cofins_ajuste_credito REAL DEFAULT 0,
    cofins_saldo_credor_anterior REAL DEFAULT 0,
    cofins_valor_recolher REAL DEFAULT 0,
    cofins_saldo_credor_transportar REAL DEFAULT 0,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, ano, mes)
);

CREATE INDEX idx_sped_apuracoes_contrib_empresa ON sped_apuracoes_contribuicoes(empresa_id);
CREATE INDEX idx_sped_apuracoes_contrib_periodo ON sped_apuracoes_contribuicoes(ano, mes);

-- =============================================
-- 7. INVENTÁRIO (EFD ICMS/IPI - Bloco H)
-- =============================================
CREATE TABLE IF NOT EXISTS sped_inventarios (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    arquivo_id TEXT REFERENCES sped_arquivos(id),
    
    -- Período
    data_inventario TEXT NOT NULL,
    ano INTEGER NOT NULL,
    
    -- Motivo
    motivo_inventario INTEGER NOT NULL,     -- 01=Final período, 02=Mudança tributação, etc.
    
    -- Totais
    valor_total REAL DEFAULT 0,
    quantidade_itens INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'fechado', 'enviado')),
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sped_inventarios_empresa ON sped_inventarios(empresa_id);
CREATE INDEX idx_sped_inventarios_data ON sped_inventarios(data_inventario);

-- =============================================
-- 8. ITENS DO INVENTÁRIO
-- =============================================
CREATE TABLE IF NOT EXISTS sped_inventarios_itens (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    inventario_id TEXT NOT NULL REFERENCES sped_inventarios(id) ON DELETE CASCADE,
    
    -- Produto
    produto_id TEXT REFERENCES produtos(id),
    codigo_produto TEXT NOT NULL,
    descricao TEXT NOT NULL,
    unidade TEXT NOT NULL,
    
    -- Quantidades e valores
    quantidade REAL NOT NULL,
    valor_unitario REAL NOT NULL,
    valor_total REAL NOT NULL,
    
    -- Classificação fiscal
    ncm TEXT,
    
    -- Indicadores
    indicador_propriedade INTEGER DEFAULT 0,  -- 0=Próprio, 1=Terceiros, etc.
    conta_contabil TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sped_inv_itens_inventario ON sped_inventarios_itens(inventario_id);
CREATE INDEX idx_sped_inv_itens_produto ON sped_inventarios_itens(produto_id);

-- =============================================
-- 9. CIAP (Controle de Crédito ICMS Ativo Permanente)
-- =============================================
CREATE TABLE IF NOT EXISTS sped_ciap (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Identificação do bem
    codigo_bem TEXT NOT NULL,
    descricao TEXT NOT NULL,
    
    -- Dados da aquisição
    data_aquisicao TEXT NOT NULL,
    valor_aquisicao REAL NOT NULL,
    valor_icms REAL NOT NULL,
    
    -- Parcelas
    parcela_atual INTEGER DEFAULT 1,
    total_parcelas INTEGER DEFAULT 48,
    valor_parcela REAL,
    
    -- Situação
    situacao TEXT DEFAULT 'ativo' CHECK (situacao IN ('ativo', 'baixado', 'transferido')),
    data_baixa TEXT,
    motivo_baixa TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sped_ciap_empresa ON sped_ciap(empresa_id);
CREATE INDEX idx_sped_ciap_bem ON sped_ciap(codigo_bem);

-- =============================================
-- 10. LOG DE OPERAÇÕES SPED
-- =============================================
CREATE TABLE IF NOT EXISTS sped_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Referência
    arquivo_id TEXT REFERENCES sped_arquivos(id),
    
    -- Operação
    operacao TEXT NOT NULL,                 -- geracao, validacao, assinatura, transmissao
    descricao TEXT,
    
    -- Resultado
    sucesso INTEGER DEFAULT 1,
    erro_mensagem TEXT,
    
    -- Detalhes
    detalhes TEXT,                          -- JSON com detalhes adicionais
    
    -- Usuário
    usuario_id TEXT REFERENCES usuarios(id),
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sped_logs_empresa ON sped_logs(empresa_id);
CREATE INDEX idx_sped_logs_arquivo ON sped_logs(arquivo_id);
CREATE INDEX idx_sped_logs_operacao ON sped_logs(operacao);
CREATE INDEX idx_sped_logs_data ON sped_logs(created_at);

-- =============================================
-- COMENTÁRIOS PARA DESENVOLVEDORES
-- =============================================
-- 
-- TIPOS DE SPED:
-- - EFD ICMS/IPI (SPED Fiscal): Mensal, obrigatório para contribuintes ICMS/IPI
-- - EFD Contribuições: Mensal, PIS/Cofins
-- - ECD (SPED Contábil): Anual, livros contábeis
-- - ECF: Anual, escrituração contábil fiscal
--
-- FLUXO DE GERAÇÃO:
-- 1. Configurar empresa (sped_configuracoes)
-- 2. Coletar dados do período (notas, movimentações, etc.)
-- 3. Gerar arquivo TXT (sped_arquivos)
-- 4. Validar no PVA (Programa Validador)
-- 5. Assinar digitalmente
-- 6. Transmitir à RFB
-- 7. Guardar recibo
--
-- INTEGRAÇÃO ACBr:
-- - ACBrSPED gera arquivos TXT no formato oficial
-- - Suporta todos os blocos e registros
-- - Validação de estrutura antes de gerar
--
-- BLOCOS EFD ICMS/IPI:
-- 0: Abertura, Identificação e Referências
-- 1: Outras Informações
-- 9: Controle e Encerramento
-- B: Escrituração e Apuração ISS (opcional)
-- C: Documentos Fiscais I (Mercadorias)
-- D: Documentos Fiscais II (Serviços)
-- E: Apuração do ICMS e IPI
-- G: Controle do Crédito ICMS Ativo Permanente
-- H: Inventário Físico
-- K: Controle da Produção e Estoque
--
-- ARMAZENAMENTO:
-- - Arquivos TXT no R2
-- - Recibos no R2
-- - Metadados no D1
-- =============================================
