-- =============================================
-- PLANAC ERP - Migration 0066 - Sistema de Tags
-- Sistema de tags flexivel para todo o ERP
-- =============================================

-- =============================================
-- CATEGORIAS DE TAGS
-- Organiza tags por modulo/submodulo do sistema
-- =============================================

CREATE TABLE IF NOT EXISTS tags_categorias (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    parent_id TEXT REFERENCES tags_categorias(id),
    nome TEXT NOT NULL,
    slug TEXT NOT NULL,
    descricao TEXT,
    icone TEXT,
    ordem INTEGER DEFAULT 0,
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(empresa_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_tags_categorias_empresa ON tags_categorias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tags_categorias_parent ON tags_categorias(parent_id);
CREATE INDEX IF NOT EXISTS idx_tags_categorias_slug ON tags_categorias(empresa_id, slug);

-- =============================================
-- TAGS
-- Tags individuais com cores e icones
-- =============================================

CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    categoria_id TEXT REFERENCES tags_categorias(id),
    nome TEXT NOT NULL,
    slug TEXT NOT NULL,
    cor_hex TEXT DEFAULT '#6B7280',
    icone TEXT,
    descricao TEXT,
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(empresa_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_tags_empresa ON tags(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tags_categoria ON tags(categoria_id);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(empresa_id, slug);

-- =============================================
-- VINCULOS DE TAGS
-- Associa tags a qualquer entidade do sistema
-- entidade_tipo: clientes, fornecedores, produtos, pedidos_venda, orcamentos, etc.
-- =============================================

CREATE TABLE IF NOT EXISTS tags_vinculos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    entidade_tipo TEXT NOT NULL,
    entidade_id TEXT NOT NULL,
    created_by TEXT REFERENCES usuarios(id),
    created_at TEXT NOT NULL,
    UNIQUE(empresa_id, tag_id, entidade_tipo, entidade_id)
);

CREATE INDEX IF NOT EXISTS idx_tags_vinculos_empresa ON tags_vinculos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tags_vinculos_tag ON tags_vinculos(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_vinculos_entidade ON tags_vinculos(empresa_id, entidade_tipo, entidade_id);

-- =============================================
-- SEED: Categorias padrao de tags
-- =============================================

-- Nota: O seed sera feito via codigo para gerar UUIDs corretos
-- Categorias sugeridas:
-- - Cadastros (parent)
--   - Cadastros/Clientes
--   - Cadastros/Fornecedores
--   - Cadastros/Produtos
-- - Comercial (parent)
--   - Comercial/Orcamentos
--   - Comercial/Pedidos
-- - Financeiro (parent)
--   - Financeiro/Contas a Pagar
--   - Financeiro/Contas a Receber
-- - Estoque (parent)
--   - Estoque/Movimentacoes
-- - Fiscal (parent)
--   - Fiscal/Notas Fiscais
-- - CRM (parent)
--   - CRM/Oportunidades
--   - CRM/Leads
-- - Logistica (parent)
--   - Logistica/Entregas
