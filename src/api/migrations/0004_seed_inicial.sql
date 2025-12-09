-- =============================================
-- 🌱 PLANAC ERP - Migration 0004
-- Seed: Empresa Planac + Usuário Admin
-- =============================================
-- Criado em: 09/12/2025

-- =============================================
-- EMPRESA PLANAC (Matriz)
-- =============================================
INSERT INTO empresas (
    id, razao_social, nome_fantasia, cnpj, inscricao_estadual,
    regime_tributario, cep, logradouro, numero, bairro, cidade, uf, ibge,
    telefone, email
) VALUES (
    '01PLANAC00000000000000000000',
    'PLANAC DISTRIBUIDORA DE DRYWALL LTDA',
    'PLANAC',
    '00000000000191',
    'ISENTO',
    1,
    '80000000',
    'Rua Principal',
    '100',
    'Centro',
    'Curitiba',
    'PR',
    '4106902',
    '41999999999',
    'contato@planac.com.br'
);

-- =============================================
-- FILIAL MATRIZ
-- =============================================
INSERT INTO filiais (
    id, empresa_id, nome, tipo, cep, logradouro, numero, bairro, cidade, uf, ibge
) VALUES (
    '01FILIAL0000000000000000MATRIZ',
    '01PLANAC00000000000000000000',
    'Matriz Curitiba',
    1,
    '80000000',
    'Rua Principal',
    '100',
    'Centro',
    'Curitiba',
    'PR',
    '4106902'
);

-- =============================================
-- PERFIL ADMINISTRADOR
-- =============================================
INSERT INTO perfis (
    id, empresa_id, nome, descricao, nivel, padrao
) VALUES (
    '01PERFIL000000000000000ADMIN',
    '01PLANAC00000000000000000000',
    'Administrador',
    'Acesso total ao sistema',
    1,
    1
);

-- =============================================
-- VINCULAR TODAS AS PERMISSÕES AO ADMIN
-- =============================================
INSERT INTO perfis_permissoes (id, perfil_id, permissao_id)
SELECT 
    lower(hex(randomblob(16))),
    '01PERFIL000000000000000ADMIN',
    id
FROM permissoes;

-- =============================================
-- PERFIS ADICIONAIS
-- =============================================
INSERT INTO perfis (id, empresa_id, nome, descricao, nivel) VALUES 
('01PERFIL000000000000000GERENTE', '01PLANAC00000000000000000000', 'Gerente', 'Gerente com acesso amplo', 2),
('01PERFIL000000000000VENDEDOR', '01PLANAC00000000000000000000', 'Vendedor', 'Acesso a vendas e clientes', 5),
('01PERFIL000000000000FINANCEIRO', '01PLANAC00000000000000000000', 'Financeiro', 'Acesso ao módulo financeiro', 4),
('01PERFIL000000000000000ESTOQUE', '01PLANAC00000000000000000000', 'Estoquista', 'Acesso ao estoque', 6),
('01PERFIL000000000000EXPEDICAO', '01PLANAC00000000000000000000', 'Expedição', 'Acesso à expedição e entregas', 6);

-- =============================================
-- USUÁRIO ADMIN
-- Senha: Admin@123 (hash gerado com PBKDF2)
-- NOTA: Este hash deve ser atualizado na primeira execução
-- =============================================
INSERT INTO usuarios (
    id, empresa_id, nome, email, senha_hash, cargo, ativo
) VALUES (
    '01USER0000000000000000000ADMIN',
    '01PLANAC00000000000000000000',
    'Administrador',
    'admin@planac.com.br',
    'TROCAR_SENHA_NO_PRIMEIRO_ACESSO',
    'Administrador do Sistema',
    1
);

-- Vincular admin ao perfil Admin
INSERT INTO usuarios_perfis (id, usuario_id, perfil_id) VALUES (
    '01USERPERFIL0000000000000001',
    '01USER0000000000000000000ADMIN',
    '01PERFIL000000000000000ADMIN'
);

-- =============================================
-- CONFIGURAÇÕES PADRÃO
-- =============================================
INSERT INTO configuracoes (id, empresa_id, chave, valor, tipo, descricao) VALUES
('conf_001', '01PLANAC00000000000000000000', 'sessao_timeout_horas', '8', 'number', 'Tempo de expiração da sessão em horas'),
('conf_002', '01PLANAC00000000000000000000', 'tentativas_login_max', '5', 'number', 'Máximo de tentativas de login antes de bloquear'),
('conf_003', '01PLANAC00000000000000000000', 'bloqueio_minutos', '15', 'number', 'Tempo de bloqueio após exceder tentativas'),
('conf_004', '01PLANAC00000000000000000000', 'desconto_maximo_vendedor', '5', 'number', 'Desconto máximo que vendedor pode dar (%)'),
('conf_005', '01PLANAC00000000000000000000', 'desconto_maximo_gerente', '15', 'number', 'Desconto máximo que gerente pode dar (%)'),
('conf_006', '01PLANAC00000000000000000000', 'estoque_minimo_alerta', '1', 'boolean', 'Alertar quando estoque atingir mínimo'),
('conf_007', '01PLANAC00000000000000000000', 'nfe_ambiente', '2', 'number', '1=Produção, 2=Homologação'),
('conf_008', '01PLANAC00000000000000000000', 'nfe_serie', '1', 'number', 'Série da NF-e');
