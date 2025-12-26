# 📋 Regras de Negócio - Módulo Cadastros

## Submódulo: Clientes

### CAD-01: Tipos de Cliente

**Descrição:** Sistema suporta dois tipos de cliente com campos específicos.

**Regras:**
- **Pessoa Jurídica (PJ):** CNPJ, Razão Social, Nome Fantasia, IE, IM
- **Pessoa Física (PF):** CPF, Nome Completo, RG, Data Nascimento, Sexo

**Validações:**
- CNPJ: Validação módulo 11 + dígitos verificadores
- CPF: Validação módulo 11
- CNPJ/CPF deve ser único por empresa (tenant)

---

### CAD-02: Classificação Fiscal (Contribuinte ICMS)

**Descrição:** Define se o cliente é contribuinte de ICMS, afetando tributação e preço.

**Regras:**
| Classificação | Quem se enquadra | Impacto |
|---------------|------------------|---------|
| **Contribuinte** | PJ com Inscrição Estadual válida | ICMS destacado na NF-e |
| **Não Contribuinte** | PF ou PJ sem IE | ICMS embutido no preço (mais caro) |

**Comportamento automático:**
- PJ com IE preenchida → Auto-seleciona "Contribuinte"
- PJ sem IE ou com IE "ISENTO" → Auto-seleciona "Não Contribuinte"
- PF → Sempre "Não Contribuinte" (campo bloqueado)

---

### CAD-03: Tipologia do Cliente

**Descrição:** Classifica o perfil de compra do cliente para controle interno.

**Regras:**
| Tipologia | Descrição | Perfil |
|-----------|-----------|--------|
| **Profissional** | Construtoras, Arquitetos, Engenheiros, Montadores, Instaladores | Compra recorrente |
| **Consumidor Final** | Pessoa física reformando, compra pontual | Compra esporádica |

**Defaults:**
- PJ: Default "Profissional"
- PF: Default "Consumidor Final"

---

### CAD-04: Origem do Cliente

**Descrição:** Rastreia de onde veio o cliente para análise de marketing.

**Regras:**
| Origem | Descrição | Ação |
|--------|-----------|------|
| **Prospecção** | Vendedor fez contato ativo | Comissão normal |
| **Indicação** | Parceiro de Negócio indicou | **Gera cashback para o Parceiro** |
| **Anúncios** | Google Ads, Meta Ads, etc | Rastrear ROI de campanha |

**Se Origem = "Indicação":**
- Campo "Parceiro Indicador" é exibido e obrigatório
- Ao realizar primeira venda, sistema calcula cashback (configurável)
- Cashback creditado após período de carência (default 30 dias)

---

### CAD-05: Múltiplos Endereços

**Descrição:** Cliente pode ter múltiplos endereços cadastrados.

**Regras:**
- Tipos: Principal, Entrega, Cobrança, Obra, Outro
- **Obrigatório:** Mínimo 1 endereço marcado como Principal
- Ao marcar novo endereço como Principal, o anterior é desmarcado
- CEP auto-preenche via ViaCEP: Logradouro, Bairro, Cidade, UF, Código IBGE

---

### CAD-06: Múltiplos Contatos

**Descrição:** Cliente pode ter múltiplos contatos com diferentes funções.

**Regras:**
- Cargos: Comprador, Financeiro, Diretor, Sócio, Outro
- Cada contato pode ter WhatsApp habilitado
- Configuração de notificações por contato

**Notificações automáticas por cargo:**
| Cargo | Recebe por Padrão |
|-------|-------------------|
| Comprador | Orçamentos, Pedidos Confirmados, NF-e |
| Financeiro | Boletos, Avisos Vencimento, Cobranças, NF-e |
| Diretor/Sócio | Relatório Mensal de Fechamento |

---

### CAD-07: Limite de Crédito

**Descrição:** Controle de crédito para vendas a prazo.

**Regras:**
- **Disponível apenas para PJ** (configurável em 15-Configurações)
- PF: Sempre à vista ou com aprovação gerencial
- Limite padrão para novos clientes: R$ 0,00 (configurável)
- Saldo Utilizado = Soma de títulos em aberto
- Saldo Disponível = Limite - Utilizado

**Quando excede limite:**
| Ação (configurável) | Comportamento |
|---------------------|---------------|
| Bloquear | Sistema não permite finalizar venda |
| Aprovar | Gerente deve aprovar para continuar |
| Alertar | Apenas aviso, permite venda |

---

### CAD-08: Vendedor Responsável

**Descrição:** Vincula vendedor padrão ao cliente.

**Regras:**
- Vendedor recebe comissão sobre vendas do cliente
- Ao criar orçamento/venda, vendedor é pré-selecionado
- Pode ser alterado na venda individual
- Relatórios de carteira por vendedor

---

### CAD-09: Tabela de Preço Vinculada

**Descrição:** Define tabela de preço padrão do cliente.

**Regras:**
- Ao criar orçamento/venda, tabela é pré-selecionada
- Pode ser alterada na venda individual
- Tipos: Varejo, Atacado, Especial, etc.

---

### CAD-10: Consulta CNPJ Automática

**Descrição:** Ao digitar CNPJ, sistema consulta dados na Receita Federal via CNPJá.

**Regras:**
- Botão "Consultar" ao lado do campo CNPJ
- Preenche automaticamente: Razão Social, Nome Fantasia, Endereço completo
- Se CNPJ inativo ou irregular: Exibe alerta ao usuário
- Limite de consultas: Conforme plano CNPJá

**Credenciais:**
- API: CNPJá
- Chave: Configurada em 15-Configurações > Integrações

---

### CAD-11: Bloqueio Automático por Inadimplência

**Descrição:** Sistema bloqueia automaticamente clientes com títulos vencidos.

**Regras:**
- **Dias de atraso para bloqueio:** 2 dias (configurável)
- Job executa diariamente às 00:00 (BRT)
- Cliente bloqueado não pode realizar vendas a prazo
- Vendas à vista continuam liberadas

**Notificações ao bloquear:**
- Vendedor responsável (e-mail + sistema)
- Cliente - contato Financeiro (WhatsApp, se configurado)

**Desbloqueio:**
- **Quem pode:** Apenas Gerente (configurável)
- Requer justificativa obrigatória
- Registra log: quem desbloqueou, quando, motivo

---

### CAD-12: Status do Cliente

**Descrição:** Controle de situação do cadastro.

**Regras:**
| Status | Descrição | Permite Venda |
|--------|-----------|---------------|
| 🟢 Ativo | Cliente normal | Sim |
| 🔴 Bloqueado | Inadimplente ou manual | Apenas à vista |
| ⚫ Inativo | Desativado manualmente | Não |

**Transições:**
- Ativo → Bloqueado: Automático (inadimplência) ou manual
- Bloqueado → Ativo: Manual (gerente) após regularização
- Ativo ↔ Inativo: Manual (gerente)

---

### CAD-13: Código Sequencial

**Descrição:** Sistema gera código único sequencial para cada cliente.

**Regras:**
- Formato: 6 dígitos (ex: 000001, 012345)
- Sequencial por empresa (tenant)
- Não é editável após criação
- Usado para identificação rápida

---

### CAD-14: Soft Delete

**Descrição:** Exclusão lógica de clientes.

**Regras:**
- Cliente nunca é deletado fisicamente
- Campo `ativo = false` marca como excluído
- Clientes inativos não aparecem em buscas padrão
- Histórico de vendas é preservado
- Pode ser reativado pelo gerente

---

### CAD-15: Permissões

**Descrição:** Controle de acesso por perfil.

| Ação | Vendedor | Gerente | Admin | Financeiro |
|------|----------|---------|-------|------------|
| Listar/Visualizar | ✅ | ✅ | ✅ | ✅ |
| Criar | ✅ | ✅ | ✅ | ❌ |
| Editar | ✅ | ✅ | ✅ | ❌ |
| Excluir (inativar) | ❌ | ✅ | ✅ | ❌ |
| Alterar limite crédito | ❌ | ✅ | ✅ | ✅ |
| Desbloquear | ❌ | ✅ | ✅ | ❌ |
| Ver aba Financeiro | ❌ | ✅ | ✅ | ✅ |
| Exportar | ❌ | ✅ | ✅ | ✅ |

---

## Submódulo: Produtos

### PROD-01 a PROD-XX
*A documentar*

---

## Submódulo: Fornecedores

### FORN-01 a FORN-XX
*A documentar*

---

**Última atualização:** 26/12/2025
