# 🗃️ Modelo de Dados - Módulo Configurações

## Diagrama ER

```
┌─────────────────────────────────────────┐
│              configuracoes              │
├─────────────────────────────────────────┤
│ id           VARCHAR(36) PK             │
│ empresa_id   VARCHAR(36) FK             │
│ chave        VARCHAR(100) NOT NULL      │
│ valor        TEXT                       │
│ tipo         VARCHAR(20)                │
│ categoria    VARCHAR(50) NOT NULL       │
│ descricao    TEXT                       │
│ created_at   DATETIME                   │
│ updated_at   DATETIME                   │
├─────────────────────────────────────────┤
│ UNIQUE(empresa_id, chave)               │
└─────────────────────────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────────────────────────┐
│         configuracoes_historico         │
├─────────────────────────────────────────┤
│ id              VARCHAR(36) PK          │
│ configuracao_id VARCHAR(36) FK          │
│ valor_anterior  TEXT                    │
│ valor_novo      TEXT                    │
│ usuario_id      VARCHAR(36) FK          │
│ created_at      DATETIME                │
└─────────────────────────────────────────┘
```

---

## Tabela: configuracoes

### Estrutura

```sql
CREATE TABLE configuracoes (
  id VARCHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  empresa_id VARCHAR(36) NOT NULL,
  chave VARCHAR(100) NOT NULL,
  valor TEXT,
  tipo VARCHAR(20) DEFAULT 'string',
  categoria VARCHAR(50) NOT NULL,
  descricao TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(empresa_id, chave),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Índices
CREATE INDEX idx_config_empresa ON configuracoes(empresa_id);
CREATE INDEX idx_config_categoria ON configuracoes(categoria);
CREATE INDEX idx_config_chave ON configuracoes(chave);
```

### Campos

| Campo | Tipo | Null | Default | Descrição |
|-------|------|------|---------|-----------|
| id | VARCHAR(36) | N | UUID | Identificador único |
| empresa_id | VARCHAR(36) | N | - | FK para empresas |
| chave | VARCHAR(100) | N | - | Nome da configuração |
| valor | TEXT | S | NULL | Valor da configuração |
| tipo | VARCHAR(20) | N | 'string' | Tipo do valor |
| categoria | VARCHAR(50) | N | - | Categoria/aba |
| descricao | TEXT | S | NULL | Descrição da config |
| created_at | DATETIME | N | NOW | Data criação |
| updated_at | DATETIME | N | NOW | Data atualização |

### Tipos de Valor

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| string | Texto | "homologacao" |
| number | Número | "2", "15.5" |
| boolean | Booleano | "true", "false" |
| json | Objeto JSON | "{\"a\":1}" |

### Categorias

| Categoria | Descrição |
|-----------|-----------|
| empresa | Dados da empresa |
| comercial | Configurações comerciais |
| fiscal | Configurações fiscais |
| financeiro | Configurações financeiras |
| estoque | Configurações de estoque |
| email | Configurações de e-mail |
| whatsapp | Configurações WhatsApp |
| integracoes | APIs externas |
| seguranca | Políticas de segurança |
| sistema | Configurações gerais |

---

## Tabela: configuracoes_historico

### Estrutura

```sql
CREATE TABLE configuracoes_historico (
  id VARCHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  configuracao_id VARCHAR(36) NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  usuario_id VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (configuracao_id) REFERENCES configuracoes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Índice
CREATE INDEX idx_config_hist_config ON configuracoes_historico(configuracao_id);
CREATE INDEX idx_config_hist_data ON configuracoes_historico(created_at);
```

### Campos

| Campo | Tipo | Null | Descrição |
|-------|------|------|-----------|
| id | VARCHAR(36) | N | Identificador único |
| configuracao_id | VARCHAR(36) | N | FK para configuracoes |
| valor_anterior | TEXT | S | Valor antes da alteração |
| valor_novo | TEXT | S | Valor após alteração |
| usuario_id | VARCHAR(36) | S | Quem alterou |
| created_at | DATETIME | N | Quando alterou |

---

## Seed de Dados Padrão

```sql
-- =============================================
-- SEED: Configurações padrão para novas empresas
-- =============================================

-- COMERCIAL
INSERT INTO configuracoes (empresa_id, chave, valor, tipo, categoria, descricao) VALUES
('default', 'bloqueio_ativo', 'true', 'boolean', 'comercial', 'Ativar bloqueio automático de inadimplentes'),
('default', 'bloqueio_dias_atraso', '2', 'number', 'comercial', 'Dias de atraso para bloquear cliente'),
('default', 'bloqueio_quem_desbloqueia', 'gerente', 'string', 'comercial', 'Quem pode desbloquear: qualquer, gerente, admin'),
('default', 'bloqueio_notif_vendedor', 'true', 'boolean', 'comercial', 'Notificar vendedor sobre bloqueio'),
('default', 'bloqueio_notif_cliente', 'true', 'boolean', 'comercial', 'Notificar cliente sobre bloqueio'),
('default', 'credito_apenas_pj', 'true', 'boolean', 'comercial', 'Limite de crédito apenas para PJ'),
('default', 'limite_padrao_pj', '0', 'number', 'comercial', 'Limite padrão para novos clientes PJ'),
('default', 'acao_excede_limite', 'bloquear', 'string', 'comercial', 'Ação quando excede: bloquear, aprovar, alertar'),
('default', 'desconto_max_vendedor', '15', 'number', 'comercial', 'Desconto máximo que vendedor pode dar (%)'),
('default', 'desconto_sem_aprovacao', '10', 'number', 'comercial', 'Desconto máximo sem aprovação (%)'),
('default', 'validade_orcamento', '15', 'number', 'comercial', 'Validade padrão do orçamento (dias)'),
('default', 'prefixo_orcamento', 'ORC-', 'string', 'comercial', 'Prefixo para número de orçamento'),
('default', 'cashback_ativo', 'true', 'boolean', 'comercial', 'Ativar programa de indicação'),
('default', 'cashback_percentual', '2', 'number', 'comercial', 'Percentual de cashback para indicações'),
('default', 'cashback_carencia', '30', 'number', 'comercial', 'Dias de carência para creditar cashback');

-- FISCAL
INSERT INTO configuracoes (empresa_id, chave, valor, tipo, categoria, descricao) VALUES
('default', 'ambiente_fiscal', 'homologacao', 'string', 'fiscal', 'Ambiente: homologacao ou producao'),
('default', 'regime_tributario', '1', 'number', 'fiscal', 'Regime: 1=Simples, 2=SN Excesso, 3=Lucro Real'),
('default', 'serie_nfe', '1', 'number', 'fiscal', 'Série da NF-e'),
('default', 'serie_nfce', '1', 'number', 'fiscal', 'Série da NFC-e'),
('default', 'serie_nfse', '1', 'number', 'fiscal', 'Série da NFS-e'),
('default', 'auto_emitir_nfe', 'true', 'boolean', 'fiscal', 'Emitir NF-e automaticamente ao faturar'),
('default', 'auto_enviar_email', 'true', 'boolean', 'fiscal', 'Enviar XML/PDF por e-mail automaticamente'),
('default', 'auto_enviar_whatsapp', 'true', 'boolean', 'fiscal', 'Enviar NF-e por WhatsApp automaticamente'),
('default', 'natureza_padrao', 'VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS', 'string', 'fiscal', 'Natureza de operação padrão'),
('default', 'danfe_formato', 'retrato', 'string', 'fiscal', 'Formato DANFE: retrato ou paisagem'),
('default', 'danfe_logo', 'true', 'boolean', 'fiscal', 'Imprimir logo no DANFE'),
('default', 'ibpt_ativo', 'true', 'boolean', 'fiscal', 'Ativar cálculo IBPT'),
('default', 'ibpt_uf', 'PR', 'string', 'fiscal', 'UF para cálculo IBPT');

-- FINANCEIRO
INSERT INTO configuracoes (empresa_id, chave, valor, tipo, categoria, descricao) VALUES
('default', 'boleto_auto', 'true', 'boolean', 'financeiro', 'Gerar boleto automaticamente'),
('default', 'boleto_dias_vencimento', '30', 'number', 'financeiro', 'Dias para vencimento padrão'),
('default', 'boleto_multa', '2', 'number', 'financeiro', 'Multa por atraso (%)'),
('default', 'boleto_juros_dia', '0.033', 'number', 'financeiro', 'Juros por dia (%)'),
('default', 'regua_cobranca_ativa', 'true', 'boolean', 'financeiro', 'Ativar régua de cobrança automática');

-- ESTOQUE
INSERT INTO configuracoes (empresa_id, chave, valor, tipo, categoria, descricao) VALUES
('default', 'controle_estoque', 'true', 'boolean', 'estoque', 'Controlar estoque por produto'),
('default', 'estoque_negativo', 'false', 'boolean', 'estoque', 'Permitir estoque negativo'),
('default', 'bloquear_sem_estoque', 'true', 'boolean', 'estoque', 'Bloquear venda sem estoque'),
('default', 'metodo_custeio', 'medio', 'string', 'estoque', 'Método: medio, peps, ultimo'),
('default', 'alerta_estoque_minimo', 'true', 'boolean', 'estoque', 'Alertar quando atingir mínimo');

-- SEGURANÇA
INSERT INTO configuracoes (empresa_id, chave, valor, tipo, categoria, descricao) VALUES
('default', 'senha_minimo', '8', 'number', 'seguranca', 'Tamanho mínimo da senha'),
('default', 'senha_maiuscula', 'true', 'boolean', 'seguranca', 'Exigir letra maiúscula'),
('default', 'senha_minuscula', 'true', 'boolean', 'seguranca', 'Exigir letra minúscula'),
('default', 'senha_numero', 'true', 'boolean', 'seguranca', 'Exigir número'),
('default', 'senha_especial', 'false', 'boolean', 'seguranca', 'Exigir caractere especial'),
('default', 'senha_expira_dias', '90', 'number', 'seguranca', 'Dias para expirar senha (0=nunca)'),
('default', 'sessao_timeout', '30', 'number', 'seguranca', 'Timeout de inatividade (minutos)'),
('default', 'tentativas_login', '5', 'number', 'seguranca', 'Máximo de tentativas de login'),
('default', 'bloqueio_login_minutos', '15', 'number', 'seguranca', 'Tempo de bloqueio após tentativas');

-- WHATSAPP
INSERT INTO configuracoes (empresa_id, chave, valor, tipo, categoria, descricao) VALUES
('default', 'whatsapp_hora_inicio', '08:00', 'string', 'whatsapp', 'Horário início envio'),
('default', 'whatsapp_hora_fim', '18:00', 'string', 'whatsapp', 'Horário fim envio'),
('default', 'whatsapp_fim_semana', 'false', 'boolean', 'whatsapp', 'Enviar nos fins de semana'),
('default', 'whatsapp_intervalo', '30', 'number', 'whatsapp', 'Intervalo entre mensagens (segundos)');

-- SISTEMA
INSERT INTO configuracoes (empresa_id, chave, valor, tipo, categoria, descricao) VALUES
('default', 'log_level', 'info', 'string', 'sistema', 'Nível de log: error, warn, info, debug'),
('default', 'auditoria_ativa', 'true', 'boolean', 'sistema', 'Ativar auditoria de ações'),
('default', 'auditoria_retencao', '365', 'number', 'sistema', 'Dias de retenção de logs');
```

---

## Queries Úteis

### Obter configuração específica
```sql
SELECT valor, tipo 
FROM configuracoes 
WHERE empresa_id = ? AND chave = ?;
```

### Obter todas de uma categoria
```sql
SELECT chave, valor, tipo, descricao 
FROM configuracoes 
WHERE empresa_id = ? AND categoria = ?
ORDER BY chave;
```

### Atualizar configuração
```sql
UPDATE configuracoes 
SET valor = ?, updated_at = CURRENT_TIMESTAMP 
WHERE empresa_id = ? AND chave = ?;
```

### Copiar configurações padrão para nova empresa
```sql
INSERT INTO configuracoes (empresa_id, chave, valor, tipo, categoria, descricao)
SELECT ?, chave, valor, tipo, categoria, descricao
FROM configuracoes
WHERE empresa_id = 'default';
```

### Histórico de alterações
```sql
SELECT h.*, u.nome as usuario_nome
FROM configuracoes_historico h
LEFT JOIN usuarios u ON h.usuario_id = u.id
WHERE h.configuracao_id = ?
ORDER BY h.created_at DESC;
```

---

**Última atualização:** 26/12/2025
