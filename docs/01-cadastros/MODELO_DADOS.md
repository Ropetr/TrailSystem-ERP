# 🗄️ Modelo de Dados - Módulo Cadastros

**Última atualização:** 26/12/2025

---

## 📊 Diagrama ER - Clientes

```mermaid
erDiagram
    clientes ||--o{ clientes_enderecos : possui
    clientes ||--o{ clientes_contatos : possui
    clientes ||--o{ clientes_documentos : possui
    clientes }o--|| tabelas_preco : usa
    clientes }o--o| vendedores : atendido_por
    clientes }o--o| clientes : indicado_por
    
    clientes {
        text id PK
        text empresa_id FK
        text tipo "PF ou PJ"
        text nome_razao
        text apelido_fantasia
        text cpf_cnpj UK
        text rg_ie
        text inscricao_municipal
        text email
        text telefone
        text celular
        text whatsapp
        date data_nascimento
        text sexo
        text estado_civil
        text profissao
        text indicado_por_id FK
        text vendedor_id FK
        text tabela_preco_id FK
        real limite_credito
        real saldo_credito
        text observacoes
        text tags
        integer contribuinte_icms
        integer consumidor_final
        integer optante_simples
        text classificacao
        integer ativo
        integer bloqueado
        text motivo_bloqueio
        datetime bloqueado_em
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    
    clientes_enderecos {
        text id PK
        text cliente_id FK
        text tipo "entrega, cobranca, correspondencia"
        text cep
        text logradouro
        text numero
        text complemento
        text bairro
        text cidade
        text uf
        text pais
        text ibge
        text referencia
        integer principal
        integer ativo
        datetime created_at
        datetime updated_at
    }
    
    clientes_contatos {
        text id PK
        text cliente_id FK
        text nome
        text cargo
        text email
        text telefone
        text celular
        text whatsapp
        text observacao
        integer principal
        integer ativo
        datetime created_at
        datetime updated_at
    }
    
    clientes_documentos {
        text id PK
        text cliente_id FK
        text tipo
        text descricao
        text arquivo_url
        text arquivo_nome
        datetime validade
        datetime created_at
    }
```

---

## 📊 Diagrama ER - Fornecedores

```mermaid
erDiagram
    fornecedores ||--o{ fornecedores_enderecos : possui
    fornecedores ||--o{ fornecedores_contatos : possui
    fornecedores ||--o{ fornecedores_produtos : fornece
    
    fornecedores {
        text id PK
        text empresa_id FK
        text tipo
        text razao_social
        text nome_fantasia
        text cnpj_cpf UK
        text inscricao_estadual
        text email
        text telefone
        text celular
        text whatsapp
        text site
        text observacoes
        integer prazo_entrega_dias
        real pedido_minimo
        text condicao_pagamento
        real score
        integer ativo
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    
    fornecedores_enderecos {
        text id PK
        text fornecedor_id FK
        text tipo
        text cep
        text logradouro
        text numero
        text complemento
        text bairro
        text cidade
        text uf
        integer principal
        datetime created_at
        datetime updated_at
    }
    
    fornecedores_contatos {
        text id PK
        text fornecedor_id FK
        text nome
        text cargo
        text email
        text telefone
        text celular
        text whatsapp
        integer principal
        datetime created_at
        datetime updated_at
    }
```

---

## 📊 Diagrama ER - Produtos

```mermaid
erDiagram
    produtos ||--o{ produtos_fotos : possui
    produtos ||--o{ produtos_fornecedores : tem
    produtos }o--|| categorias : pertence
    produtos }o--|| unidades_medida : usa
    
    produtos {
        text id PK
        text empresa_id FK
        text codigo
        text codigo_barras
        text descricao
        text descricao_resumida
        text tipo "PRODUTO ou SERVICO"
        text categoria_id FK
        text unidade_id FK
        text ncm
        text cest
        text origem
        text cst_icms
        text csosn
        real preco_custo
        real margem
        real preco_venda
        integer estoque_minimo
        integer estoque_maximo
        real peso_bruto
        real peso_liquido
        text observacoes
        integer ativo
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    
    produtos_fotos {
        text id PK
        text produto_id FK
        text url
        text nome
        integer ordem
        integer principal
        datetime created_at
    }
    
    produtos_fornecedores {
        text id PK
        text produto_id FK
        text fornecedor_id FK
        text codigo_fornecedor
        real preco_custo
        integer prazo_entrega
        integer principal
        datetime created_at
        datetime updated_at
    }
```

---

## 📋 Tabelas do Módulo

| Tabela | Registros | Descrição |
|--------|-----------|-----------|
| `clientes` | ~500 | Clientes PF/PJ |
| `clientes_enderecos` | ~800 | Endereços dos clientes |
| `clientes_contatos` | ~600 | Contatos dos clientes |
| `clientes_documentos` | ~200 | Documentos anexados |
| `fornecedores` | ~50 | Fornecedores |
| `fornecedores_enderecos` | ~80 | Endereços fornecedores |
| `fornecedores_contatos` | ~100 | Contatos fornecedores |
| `produtos` | ~2000 | Catálogo de produtos |
| `produtos_fotos` | ~1500 | Fotos dos produtos |
| `produtos_fornecedores` | ~3000 | Relação produto-fornecedor |
| `categorias` | ~50 | Categorias de produtos |
| `unidades_medida` | ~20 | Unidades (UN, M², KG) |
| `usuarios` | ~30 | Usuários do sistema |
| `perfis` | ~10 | Perfis de acesso |
| `empresas` | ~3 | Matriz e filiais |

---

## 🔑 Índices Importantes

```sql
-- Clientes
CREATE INDEX idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX idx_clientes_vendedor ON clientes(vendedor_id);
CREATE INDEX idx_clientes_ativo ON clientes(ativo);

-- Produtos
CREATE INDEX idx_produtos_codigo ON produtos(codigo);
CREATE INDEX idx_produtos_codigo_barras ON produtos(codigo_barras);
CREATE INDEX idx_produtos_empresa ON produtos(empresa_id);
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);

-- Fornecedores
CREATE INDEX idx_fornecedores_cnpj ON fornecedores(cnpj_cpf);
CREATE INDEX idx_fornecedores_empresa ON fornecedores(empresa_id);
```
