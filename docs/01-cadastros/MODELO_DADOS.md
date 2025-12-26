# 🗃️ Modelo de Dados - Módulo Cadastros

## Diagrama ER - Clientes

```
┌─────────────────────────────────────────┐
│               clientes                  │
├─────────────────────────────────────────┤
│ id               VARCHAR(36) PK         │
│ empresa_id       VARCHAR(36) FK         │
│ codigo           VARCHAR(10) UNIQUE     │
│ tipo             VARCHAR(2)             │◄─── 'pf' ou 'pj'
│ documento        VARCHAR(18) UNIQUE     │
│ razao_social     VARCHAR(200)           │
│ nome_fantasia    VARCHAR(200)           │
│ inscricao_estadual VARCHAR(20)          │
│ inscricao_municipal VARCHAR(20)         │
│ rg               VARCHAR(20)            │◄─── Apenas PF
│ data_nascimento  DATE                   │◄─── Apenas PF
│ sexo             VARCHAR(10)            │◄─── Apenas PF
│ contribuinte_icms VARCHAR(20)           │
│ tipologia        VARCHAR(20)            │
│ origem           VARCHAR(20)            │
│ parceiro_indicador_id VARCHAR(36) FK    │
│ vendedor_id      VARCHAR(36) FK         │
│ tabela_preco_id  VARCHAR(36) FK         │
│ condicao_pagamento_id VARCHAR(36) FK    │
│ limite_credito   DECIMAL(15,2)          │
│ desconto_maximo  DECIMAL(5,2)           │
│ comissao_vendedor DECIMAL(5,2)          │
│ status           VARCHAR(20)            │
│ bloqueado        BOOLEAN                │
│ motivo_bloqueio  TEXT                   │
│ data_bloqueio    DATETIME               │
│ bloqueado_por    VARCHAR(36) FK         │
│ ativo            BOOLEAN                │
│ created_at       DATETIME               │
│ updated_at       DATETIME               │
│ created_by       VARCHAR(36) FK         │
│ updated_by       VARCHAR(36) FK         │
└─────────────────────────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────────────────────────┐
│          clientes_enderecos             │
├─────────────────────────────────────────┤
│ id               VARCHAR(36) PK         │
│ cliente_id       VARCHAR(36) FK         │
│ tipo             VARCHAR(20)            │
│ cep              VARCHAR(9)             │
│ logradouro       VARCHAR(200)           │
│ numero           VARCHAR(20)            │
│ complemento      VARCHAR(100)           │
│ bairro           VARCHAR(100)           │
│ cidade           VARCHAR(100)           │
│ uf               VARCHAR(2)             │
│ codigo_ibge      VARCHAR(7)             │
│ referencia       VARCHAR(200)           │
│ principal        BOOLEAN                │
│ created_at       DATETIME               │
│ updated_at       DATETIME               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          clientes_contatos              │
├─────────────────────────────────────────┤
│ id               VARCHAR(36) PK         │
│ cliente_id       VARCHAR(36) FK         │
│ nome             VARCHAR(100)           │
│ cargo            VARCHAR(50)            │
│ email            VARCHAR(200)           │
│ telefone         VARCHAR(20)            │
│ celular          VARCHAR(20)            │
│ whatsapp         BOOLEAN                │
│ principal        BOOLEAN                │
│ notif_orcamentos BOOLEAN                │
│ notif_pedidos    BOOLEAN                │
│ notif_nfe        BOOLEAN                │
│ notif_boletos    BOOLEAN                │
│ notif_vencimentos BOOLEAN               │
│ notif_cobrancas  BOOLEAN                │
│ created_at       DATETIME               │
│ updated_at       DATETIME               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          clientes_arquivos              │
├─────────────────────────────────────────┤
│ id               VARCHAR(36) PK         │
│ cliente_id       VARCHAR(36) FK         │
│ nome             VARCHAR(200)           │
│ tipo             VARCHAR(50)            │
│ url              VARCHAR(500)           │
│ tamanho_bytes    INTEGER                │
│ created_at       DATETIME               │
│ created_by       VARCHAR(36) FK         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│        clientes_bloqueio_log            │
├─────────────────────────────────────────┤
│ id               VARCHAR(36) PK         │
│ cliente_id       VARCHAR(36) FK         │
│ acao             VARCHAR(20)            │◄─── 'bloquear' ou 'desbloquear'
│ motivo           TEXT                   │
│ usuario_id       VARCHAR(36) FK         │
│ created_at       DATETIME               │
└─────────────────────────────────────────┘
```

---

## Tabela: clientes

### Estrutura

```sql
CREATE TABLE clientes (
  id VARCHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  empresa_id VARCHAR(36) NOT NULL,
  codigo VARCHAR(10) NOT NULL,
  tipo VARCHAR(2) NOT NULL CHECK (tipo IN ('pf', 'pj')),
  documento VARCHAR(18) NOT NULL,
  razao_social VARCHAR(200) NOT NULL,
  nome_fantasia VARCHAR(200),
  inscricao_estadual VARCHAR(20),
  inscricao_municipal VARCHAR(20),
  rg VARCHAR(20),
  data_nascimento DATE,
  sexo VARCHAR(10) CHECK (sexo IN ('masculino', 'feminino', 'outro')),
  contribuinte_icms VARCHAR(20) NOT NULL DEFAULT 'nao_contribuinte' 
    CHECK (contribuinte_icms IN ('contribuinte', 'nao_contribuinte')),
  tipologia VARCHAR(20) NOT NULL DEFAULT 'consumidor_final'
    CHECK (tipologia IN ('profissional', 'consumidor_final')),
  origem VARCHAR(20) CHECK (origem IN ('prospeccao', 'indicacao', 'anuncios')),
  parceiro_indicador_id VARCHAR(36),
  vendedor_id VARCHAR(36),
  tabela_preco_id VARCHAR(36),
  condicao_pagamento_id VARCHAR(36),
  limite_credito DECIMAL(15,2) DEFAULT 0,
  desconto_maximo DECIMAL(5,2) DEFAULT 0,
  comissao_vendedor DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo' 
    CHECK (status IN ('ativo', 'inativo', 'bloqueado')),
  bloqueado BOOLEAN DEFAULT FALSE,
  motivo_bloqueio TEXT,
  data_bloqueio DATETIME,
  bloqueado_por VARCHAR(36),
  ativo BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  
  UNIQUE(empresa_id, codigo),
  UNIQUE(empresa_id, documento),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  FOREIGN KEY (vendedor_id) REFERENCES usuarios(id),
  FOREIGN KEY (tabela_preco_id) REFERENCES tabelas_preco(id),
  FOREIGN KEY (condicao_pagamento_id) REFERENCES condicoes_pagamento(id),
  FOREIGN KEY (parceiro_indicador_id) REFERENCES parceiros_negocio(id),
  FOREIGN KEY (bloqueado_por) REFERENCES usuarios(id),
  FOREIGN KEY (created_by) REFERENCES usuarios(id),
  FOREIGN KEY (updated_by) REFERENCES usuarios(id)
);

-- Índices
CREATE INDEX idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX idx_clientes_documento ON clientes(documento);
CREATE INDEX idx_clientes_razao ON clientes(razao_social);
CREATE INDEX idx_clientes_status ON clientes(status);
CREATE INDEX idx_clientes_vendedor ON clientes(vendedor_id);
CREATE INDEX idx_clientes_bloqueado ON clientes(bloqueado);
CREATE INDEX idx_clientes_ativo ON clientes(ativo);
```

### Campos

| Campo | Tipo | Null | Default | Descrição |
|-------|------|------|---------|-----------|
| id | VARCHAR(36) | N | UUID | Identificador único |
| empresa_id | VARCHAR(36) | N | - | FK para empresas (tenant) |
| codigo | VARCHAR(10) | N | - | Código sequencial único |
| tipo | VARCHAR(2) | N | - | 'pf' ou 'pj' |
| documento | VARCHAR(18) | N | - | CPF ou CNPJ formatado |
| razao_social | VARCHAR(200) | N | - | Nome (PF) ou Razão Social (PJ) |
| nome_fantasia | VARCHAR(200) | S | NULL | Nome fantasia (PJ) |
| inscricao_estadual | VARCHAR(20) | S | NULL | IE (PJ) |
| inscricao_municipal | VARCHAR(20) | S | NULL | IM (PJ) |
| rg | VARCHAR(20) | S | NULL | RG (PF) |
| data_nascimento | DATE | S | NULL | Data nascimento (PF) |
| sexo | VARCHAR(10) | S | NULL | masculino/feminino/outro (PF) |
| contribuinte_icms | VARCHAR(20) | N | nao_contribuinte | Classificação fiscal |
| tipologia | VARCHAR(20) | N | consumidor_final | Perfil de compra |
| origem | VARCHAR(20) | S | NULL | Como chegou ao cliente |
| parceiro_indicador_id | VARCHAR(36) | S | NULL | FK parceiro que indicou |
| vendedor_id | VARCHAR(36) | S | NULL | FK vendedor responsável |
| tabela_preco_id | VARCHAR(36) | S | NULL | FK tabela de preço |
| condicao_pagamento_id | VARCHAR(36) | S | NULL | FK condição pagamento |
| limite_credito | DECIMAL(15,2) | N | 0 | Limite de crédito (só PJ) |
| desconto_maximo | DECIMAL(5,2) | N | 0 | % desconto máximo |
| comissao_vendedor | DECIMAL(5,2) | N | 0 | % comissão vendedor |
| status | VARCHAR(20) | N | ativo | ativo/inativo/bloqueado |
| bloqueado | BOOLEAN | N | FALSE | Flag de bloqueio rápido |
| motivo_bloqueio | TEXT | S | NULL | Motivo do bloqueio |
| data_bloqueio | DATETIME | S | NULL | Quando foi bloqueado |
| bloqueado_por | VARCHAR(36) | S | NULL | FK quem bloqueou |
| ativo | BOOLEAN | N | TRUE | Soft delete |
| created_at | DATETIME | N | NOW | Data criação |
| updated_at | DATETIME | N | NOW | Data atualização |
| created_by | VARCHAR(36) | S | NULL | FK quem criou |
| updated_by | VARCHAR(36) | S | NULL | FK quem atualizou |

---

## Tabela: clientes_enderecos

### Estrutura

```sql
CREATE TABLE clientes_enderecos (
  id VARCHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  cliente_id VARCHAR(36) NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'principal'
    CHECK (tipo IN ('principal', 'entrega', 'cobranca', 'obra', 'outro')),
  cep VARCHAR(9) NOT NULL,
  logradouro VARCHAR(200) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  complemento VARCHAR(100),
  bairro VARCHAR(100) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  codigo_ibge VARCHAR(7),
  referencia VARCHAR(200),
  principal BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE INDEX idx_enderecos_cliente ON clientes_enderecos(cliente_id);
CREATE INDEX idx_enderecos_principal ON clientes_enderecos(cliente_id, principal);
```

### Campos

| Campo | Tipo | Null | Default | Descrição |
|-------|------|------|---------|-----------|
| id | VARCHAR(36) | N | UUID | Identificador único |
| cliente_id | VARCHAR(36) | N | - | FK para clientes |
| tipo | VARCHAR(20) | N | principal | Tipo do endereço |
| cep | VARCHAR(9) | N | - | CEP formatado |
| logradouro | VARCHAR(200) | N | - | Rua/Avenida |
| numero | VARCHAR(20) | N | - | Número |
| complemento | VARCHAR(100) | S | NULL | Complemento |
| bairro | VARCHAR(100) | N | - | Bairro |
| cidade | VARCHAR(100) | N | - | Cidade |
| uf | VARCHAR(2) | N | - | Estado |
| codigo_ibge | VARCHAR(7) | S | NULL | Código IBGE da cidade |
| referencia | VARCHAR(200) | S | NULL | Ponto de referência |
| principal | BOOLEAN | N | FALSE | É o endereço principal |

---

## Tabela: clientes_contatos

### Estrutura

```sql
CREATE TABLE clientes_contatos (
  id VARCHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  cliente_id VARCHAR(36) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  cargo VARCHAR(50) NOT NULL DEFAULT 'outro'
    CHECK (cargo IN ('comprador', 'financeiro', 'diretor', 'socio', 'outro')),
  email VARCHAR(200),
  telefone VARCHAR(20),
  celular VARCHAR(20),
  whatsapp BOOLEAN DEFAULT FALSE,
  principal BOOLEAN DEFAULT FALSE,
  notif_orcamentos BOOLEAN DEFAULT FALSE,
  notif_pedidos BOOLEAN DEFAULT FALSE,
  notif_nfe BOOLEAN DEFAULT FALSE,
  notif_boletos BOOLEAN DEFAULT FALSE,
  notif_vencimentos BOOLEAN DEFAULT FALSE,
  notif_cobrancas BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE INDEX idx_contatos_cliente ON clientes_contatos(cliente_id);
CREATE INDEX idx_contatos_principal ON clientes_contatos(cliente_id, principal);
CREATE INDEX idx_contatos_whatsapp ON clientes_contatos(cliente_id, whatsapp);
```

### Notificações Padrão por Cargo

```sql
-- Trigger para definir notificações padrão ao inserir contato
-- Comprador: orcamentos, pedidos, nfe
-- Financeiro: boletos, vencimentos, cobrancas, nfe
-- Diretor/Sócio: sem padrão (relatório mensal é job separado)
```

---

## Tabela: clientes_arquivos

### Estrutura

```sql
CREATE TABLE clientes_arquivos (
  id VARCHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  cliente_id VARCHAR(36) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'outro'
    CHECK (tipo IN ('contrato', 'procuracao', 'rg', 'cnpj', 'comprovante', 'outro')),
  url VARCHAR(500) NOT NULL,
  tamanho_bytes INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

CREATE INDEX idx_arquivos_cliente ON clientes_arquivos(cliente_id);
```

---

## Tabela: clientes_bloqueio_log

### Estrutura

```sql
CREATE TABLE clientes_bloqueio_log (
  id VARCHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  cliente_id VARCHAR(36) NOT NULL,
  acao VARCHAR(20) NOT NULL CHECK (acao IN ('bloquear', 'desbloquear')),
  motivo TEXT NOT NULL,
  usuario_id VARCHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX idx_bloqueio_cliente ON clientes_bloqueio_log(cliente_id);
CREATE INDEX idx_bloqueio_data ON clientes_bloqueio_log(created_at);
```

---

## Queries Úteis

### Gerar próximo código
```sql
SELECT PRINTF('%06d', COALESCE(MAX(CAST(codigo AS INTEGER)), 0) + 1) as proximo
FROM clientes
WHERE empresa_id = ?;
```

### Clientes com títulos vencidos (para job de bloqueio)
```sql
SELECT DISTINCT c.id, c.razao_social, c.vendedor_id,
       MIN(t.vencimento) as primeiro_vencido,
       JULIANDAY('now') - JULIANDAY(MIN(t.vencimento)) as dias_atraso
FROM clientes c
JOIN titulos t ON t.cliente_id = c.id
WHERE c.empresa_id = ?
  AND c.bloqueado = FALSE
  AND c.ativo = TRUE
  AND t.status = 'aberto'
  AND t.vencimento < DATE('now', '-' || ? || ' days')
GROUP BY c.id
ORDER BY dias_atraso DESC;
```

### Resumo financeiro do cliente
```sql
SELECT 
  COALESCE(SUM(CASE WHEN t.vencimento < DATE('now') THEN t.valor_aberto ELSE 0 END), 0) as vencidos,
  COALESCE(SUM(CASE WHEN t.vencimento >= DATE('now') THEN t.valor_aberto ELSE 0 END), 0) as a_vencer,
  COALESCE(SUM(t.valor_aberto), 0) as total_devedor,
  c.limite_credito,
  c.limite_credito - COALESCE(SUM(t.valor_aberto), 0) as saldo_disponivel,
  MAX(CASE WHEN t.vencimento < DATE('now') 
      THEN JULIANDAY('now') - JULIANDAY(t.vencimento) ELSE 0 END) as maior_atraso
FROM clientes c
LEFT JOIN titulos t ON t.cliente_id = c.id AND t.status = 'aberto'
WHERE c.id = ?
GROUP BY c.id;
```

### Busca de clientes
```sql
SELECT c.*, 
       v.nome as vendedor_nome,
       (SELECT SUM(valor_aberto) FROM titulos WHERE cliente_id = c.id AND status = 'aberto') as saldo_devedor
FROM clientes c
LEFT JOIN usuarios v ON c.vendedor_id = v.id
WHERE c.empresa_id = ?
  AND c.ativo = TRUE
  AND (
    c.razao_social LIKE '%' || ? || '%'
    OR c.nome_fantasia LIKE '%' || ? || '%'
    OR c.documento LIKE '%' || ? || '%'
    OR c.codigo LIKE '%' || ? || '%'
  )
ORDER BY c.razao_social
LIMIT ? OFFSET ?;
```

---

**Última atualização:** 26/12/2025
