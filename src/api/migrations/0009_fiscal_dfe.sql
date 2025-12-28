-- =============================================
-- PLANAC ERP - Migration 0009
-- Fiscal: DF-e (Distribuição de Documentos Fiscais)
-- Suporte para ACBr API/ACBrLib
-- =============================================
-- Criado em: 28/12/2025
-- Descrição: Tabelas para gerenciamento de documentos fiscais
--            de entrada (NF-e, CT-e) via Distribuição DF-e SEFAZ
-- =============================================

-- =============================================
-- 1. DISTRIBUIÇÕES DF-e (Jobs de consulta)
-- =============================================
-- Registra cada consulta de distribuição feita à SEFAZ
CREATE TABLE IF NOT EXISTS dfe_distribuicoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Tipo de documento
    tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('nfe', 'cte')),
    
    -- Ambiente
    ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao')),
    
    -- Parâmetros da consulta
    uf_autor INTEGER NOT NULL,              -- Código UF do autor (ex: 41 para PR)
    cnpj_cpf TEXT NOT NULL,                 -- CNPJ/CPF consultado
    ult_nsu TEXT,                           -- Último NSU consultado
    nsu_especifico TEXT,                    -- NSU específico (quando consulta pontual)
    chave_acesso TEXT,                      -- Chave de acesso (quando consulta por chave)
    
    -- Resultado
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'sucesso', 'erro')),
    max_nsu TEXT,                           -- Maior NSU retornado
    documentos_retornados INTEGER DEFAULT 0,
    
    -- Resposta SEFAZ
    codigo_status INTEGER,                  -- cStat da resposta
    motivo_status TEXT,                     -- xMotivo da resposta
    data_hora_resposta TEXT,                -- dhResp
    
    -- Armazenamento
    request_storage_key TEXT,               -- Chave R2 do XML de request
    response_storage_key TEXT,              -- Chave R2 do XML de response
    
    -- Erro (se houver)
    erro_mensagem TEXT,
    erro_detalhes TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_dfe_dist_empresa ON dfe_distribuicoes(empresa_id);
CREATE INDEX idx_dfe_dist_tipo ON dfe_distribuicoes(tipo_documento);
CREATE INDEX idx_dfe_dist_status ON dfe_distribuicoes(status);
CREATE INDEX idx_dfe_dist_cnpj ON dfe_distribuicoes(cnpj_cpf);
CREATE INDEX idx_dfe_dist_data ON dfe_distribuicoes(created_at);

-- =============================================
-- 2. DOCUMENTOS FISCAIS DE ENTRADA (NF-e/CT-e recebidos)
-- =============================================
-- Armazena metadados dos documentos recebidos via DF-e
CREATE TABLE IF NOT EXISTS dfe_documentos_entrada (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    distribuicao_id TEXT REFERENCES dfe_distribuicoes(id),
    
    -- Identificação do documento
    tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('nfe', 'cte', 'nfe_resumo', 'cte_resumo', 'evento')),
    nsu TEXT NOT NULL,                      -- NSU do documento
    chave_acesso TEXT NOT NULL,             -- Chave de acesso (44 dígitos)
    
    -- Ambiente
    ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao')),
    
    -- Dados do emitente
    emitente_cnpj TEXT,
    emitente_cpf TEXT,
    emitente_razao_social TEXT,
    emitente_nome_fantasia TEXT,
    emitente_ie TEXT,
    emitente_uf TEXT,
    
    -- Dados do destinatário (sua empresa)
    destinatario_cnpj TEXT,
    destinatario_cpf TEXT,
    destinatario_razao_social TEXT,
    
    -- Dados do documento
    numero INTEGER,
    serie INTEGER,
    data_emissao TEXT,
    data_saida_entrada TEXT,
    natureza_operacao TEXT,
    
    -- Valores
    valor_total REAL DEFAULT 0,
    valor_produtos REAL DEFAULT 0,
    valor_frete REAL DEFAULT 0,
    valor_seguro REAL DEFAULT 0,
    valor_desconto REAL DEFAULT 0,
    valor_icms REAL DEFAULT 0,
    valor_ipi REAL DEFAULT 0,
    valor_pis REAL DEFAULT 0,
    valor_cofins REAL DEFAULT 0,
    
    -- Situação do documento
    situacao TEXT DEFAULT 'autorizada' CHECK (situacao IN ('autorizada', 'cancelada', 'denegada', 'inutilizada')),
    
    -- Manifestação do destinatário
    manifestacao_status TEXT CHECK (manifestacao_status IN ('pendente', 'ciencia', 'confirmada', 'desconhecida', 'nao_realizada')),
    manifestacao_data TEXT,
    manifestacao_protocolo TEXT,
    manifestacao_justificativa TEXT,
    
    -- Vinculação com módulos do ERP
    fornecedor_id TEXT REFERENCES fornecedores(id),
    pedido_compra_id TEXT,                  -- Vínculo com pedido de compra
    entrada_estoque_id TEXT,                -- Vínculo com entrada de estoque
    conta_pagar_id TEXT,                    -- Vínculo com contas a pagar
    
    -- Armazenamento
    xml_storage_key TEXT,                   -- Chave R2 do XML completo
    pdf_storage_key TEXT,                   -- Chave R2 do PDF (DANFE/DACTE)
    xml_hash TEXT,                          -- Hash SHA256 do XML
    
    -- Flags de processamento
    xml_completo INTEGER DEFAULT 0,         -- 1 = XML completo baixado
    processado INTEGER DEFAULT 0,           -- 1 = Processado pelo ERP
    importado_estoque INTEGER DEFAULT 0,    -- 1 = Importado para estoque
    importado_financeiro INTEGER DEFAULT 0, -- 1 = Importado para financeiro
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, chave_acesso)
);

CREATE INDEX idx_dfe_docs_empresa ON dfe_documentos_entrada(empresa_id);
CREATE INDEX idx_dfe_docs_tipo ON dfe_documentos_entrada(tipo_documento);
CREATE INDEX idx_dfe_docs_chave ON dfe_documentos_entrada(chave_acesso);
CREATE INDEX idx_dfe_docs_nsu ON dfe_documentos_entrada(nsu);
CREATE INDEX idx_dfe_docs_emitente ON dfe_documentos_entrada(emitente_cnpj);
CREATE INDEX idx_dfe_docs_data ON dfe_documentos_entrada(data_emissao);
CREATE INDEX idx_dfe_docs_manifestacao ON dfe_documentos_entrada(manifestacao_status);
CREATE INDEX idx_dfe_docs_processado ON dfe_documentos_entrada(processado);
CREATE INDEX idx_dfe_docs_fornecedor ON dfe_documentos_entrada(fornecedor_id);

-- =============================================
-- 3. ITENS DOS DOCUMENTOS DE ENTRADA
-- =============================================
CREATE TABLE IF NOT EXISTS dfe_documentos_entrada_itens (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    documento_id TEXT NOT NULL REFERENCES dfe_documentos_entrada(id) ON DELETE CASCADE,
    
    -- Identificação do item
    numero_item INTEGER NOT NULL,
    
    -- Produto
    codigo_produto TEXT,
    codigo_barras TEXT,
    descricao TEXT NOT NULL,
    ncm TEXT,
    cest TEXT,
    cfop TEXT,
    unidade TEXT,
    
    -- Quantidades e valores
    quantidade REAL NOT NULL,
    valor_unitario REAL NOT NULL,
    valor_total REAL NOT NULL,
    valor_desconto REAL DEFAULT 0,
    valor_frete REAL DEFAULT 0,
    valor_seguro REAL DEFAULT 0,
    valor_outros REAL DEFAULT 0,
    
    -- Impostos
    icms_base_calculo REAL DEFAULT 0,
    icms_aliquota REAL DEFAULT 0,
    icms_valor REAL DEFAULT 0,
    icms_cst TEXT,
    
    ipi_base_calculo REAL DEFAULT 0,
    ipi_aliquota REAL DEFAULT 0,
    ipi_valor REAL DEFAULT 0,
    ipi_cst TEXT,
    
    pis_base_calculo REAL DEFAULT 0,
    pis_aliquota REAL DEFAULT 0,
    pis_valor REAL DEFAULT 0,
    pis_cst TEXT,
    
    cofins_base_calculo REAL DEFAULT 0,
    cofins_aliquota REAL DEFAULT 0,
    cofins_valor REAL DEFAULT 0,
    cofins_cst TEXT,
    
    -- Vinculação com produto do ERP
    produto_id TEXT REFERENCES produtos(id),
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_dfe_itens_documento ON dfe_documentos_entrada_itens(documento_id);
CREATE INDEX idx_dfe_itens_produto ON dfe_documentos_entrada_itens(produto_id);
CREATE INDEX idx_dfe_itens_ncm ON dfe_documentos_entrada_itens(ncm);

-- =============================================
-- 4. EVENTOS DOS DOCUMENTOS (Manifestação, Cancelamento, etc.)
-- =============================================
CREATE TABLE IF NOT EXISTS dfe_documentos_eventos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    documento_id TEXT NOT NULL REFERENCES dfe_documentos_entrada(id) ON DELETE CASCADE,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Identificação do evento
    tipo_evento TEXT NOT NULL,              -- 210200=Confirmação, 210210=Ciência, 210220=Desconhecimento, 210240=Não Realizada
    codigo_evento TEXT NOT NULL,            -- Código do evento
    descricao_evento TEXT,                  -- Descrição do evento
    
    -- Dados do evento
    sequencial INTEGER DEFAULT 1,           -- Sequencial do evento
    data_evento TEXT NOT NULL,
    justificativa TEXT,                     -- Justificativa (obrigatória para alguns eventos)
    
    -- Resposta SEFAZ
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'registrado', 'rejeitado', 'erro')),
    protocolo TEXT,                         -- Número do protocolo
    codigo_status INTEGER,                  -- cStat
    motivo_status TEXT,                     -- xMotivo
    data_registro TEXT,                     -- Data/hora do registro na SEFAZ
    
    -- Armazenamento
    xml_evento_storage_key TEXT,            -- XML do evento enviado
    xml_retorno_storage_key TEXT,           -- XML do retorno
    
    -- Erro
    erro_mensagem TEXT,
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_dfe_eventos_documento ON dfe_documentos_eventos(documento_id);
CREATE INDEX idx_dfe_eventos_empresa ON dfe_documentos_eventos(empresa_id);
CREATE INDEX idx_dfe_eventos_tipo ON dfe_documentos_eventos(tipo_evento);
CREATE INDEX idx_dfe_eventos_status ON dfe_documentos_eventos(status);
CREATE INDEX idx_dfe_eventos_data ON dfe_documentos_eventos(data_evento);

-- =============================================
-- 5. CONFIGURAÇÃO DF-e POR EMPRESA
-- =============================================
CREATE TABLE IF NOT EXISTS dfe_configuracoes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Tipo de documento
    tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('nfe', 'cte')),
    
    -- Configurações de consulta
    ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao')),
    uf_autor INTEGER NOT NULL,              -- UF do autor
    consulta_automatica INTEGER DEFAULT 0,  -- 1 = Consultar automaticamente
    intervalo_consulta INTEGER DEFAULT 60,  -- Intervalo em minutos
    
    -- Último NSU consultado (para consultas incrementais)
    ultimo_nsu TEXT DEFAULT '0',
    ultima_consulta TEXT,
    
    -- Manifestação automática
    manifestar_ciencia_auto INTEGER DEFAULT 0,  -- 1 = Manifestar ciência automaticamente
    dias_para_manifestar INTEGER DEFAULT 10,    -- Dias antes do prazo para alertar
    
    -- Notificações
    notificar_novos_documentos INTEGER DEFAULT 1,
    email_notificacao TEXT,
    
    -- Controle
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(empresa_id, tipo_documento)
);

CREATE INDEX idx_dfe_config_empresa ON dfe_configuracoes(empresa_id);

-- =============================================
-- 6. LOG DE OPERAÇÕES DF-e
-- =============================================
CREATE TABLE IF NOT EXISTS dfe_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    
    -- Referência
    documento_id TEXT REFERENCES dfe_documentos_entrada(id),
    distribuicao_id TEXT REFERENCES dfe_distribuicoes(id),
    evento_id TEXT REFERENCES dfe_documentos_eventos(id),
    
    -- Operação
    operacao TEXT NOT NULL,                 -- consulta, download, manifestacao, importacao, etc.
    descricao TEXT,
    
    -- Resultado
    sucesso INTEGER DEFAULT 1,
    erro_mensagem TEXT,
    
    -- Dados adicionais (JSON)
    dados_adicionais TEXT,
    
    -- Usuário
    usuario_id TEXT REFERENCES usuarios(id),
    
    -- Controle
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_dfe_logs_empresa ON dfe_logs(empresa_id);
CREATE INDEX idx_dfe_logs_documento ON dfe_logs(documento_id);
CREATE INDEX idx_dfe_logs_operacao ON dfe_logs(operacao);
CREATE INDEX idx_dfe_logs_data ON dfe_logs(created_at);

-- =============================================
-- COMENTÁRIOS PARA DESENVOLVEDORES
-- =============================================
-- 
-- FLUXO DE USO:
-- 1. Configurar dfe_configuracoes para a empresa
-- 2. Executar consulta de distribuição (cria registro em dfe_distribuicoes)
-- 3. Processar documentos retornados (cria registros em dfe_documentos_entrada)
-- 4. Baixar XML completo dos documentos de interesse
-- 5. Registrar manifestação quando necessário (dfe_documentos_eventos)
-- 6. Importar para estoque/financeiro conforme necessidade
--
-- INTEGRAÇÃO ACBr:
-- - ACBr API: Usar endpoints /distribuicao/nfe para NF-e
-- - ACBr Microserviço: Para CT-e (não disponível na API SaaS ainda)
--
-- ARMAZENAMENTO:
-- - XMLs e PDFs devem ser armazenados no R2
-- - Apenas metadados e chaves de referência no D1
--
-- MANIFESTAÇÃO:
-- - 210200: Confirmação da Operação
-- - 210210: Ciência da Operação (libera download XML)
-- - 210220: Desconhecimento da Operação
-- - 210240: Operação não Realizada
-- =============================================
