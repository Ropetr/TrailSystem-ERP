# Especificação de Telas - Módulo CRM

Este documento contém as especificações de telas do módulo CRM.

## 2.1 CRM

### Tela: Funil de Vendas
**Rota:** `/crm/funil`

**Layout:** Kanban com colunas para cada etapa

| Etapa | Cor | Descrição |
|-------|-----|-----------|
| Lead | Cinza | Contato inicial |
| Contato | Azul | Em contato |
| Proposta | Amarelo | Orçamento enviado |
| Negociação | Laranja | Em negociação |
| Fechado | Verde | Venda realizada |
| Perdido | Vermelho | Não converteu |

**Card do Lead:**
| Elemento | Descrição |
|----------|-----------|
| Nome | Nome do cliente/lead |
| Empresa | Se PJ |
| Valor | Valor estimado |
| Dias na etapa | Contador |
| Vendedor | Responsável |
| Próxima ação | Data do follow-up |

**Ações no Card:**
- Arrastar para outra etapa
- Abrir detalhes
- Registrar interação
- Agendar tarefa
- Converter em cliente

---

### Tela: Cadastro de Lead/Oportunidade
**Rota:** `/crm/oportunidades/:id`

#### Aba: Dados

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Título | TEXT | * | Nome da oportunidade |
| Cliente/Lead | AUTOCOMPLETE | * | Cliente existente ou novo |
| Origem | SELECT | * | Site, Indicação, Telefone, WhatsApp, Feira |
| Etapa | SELECT | * | Etapa do funil |
| Valor Estimado | MONEY | - | Valor potencial da venda |
| Probabilidade | NUMBER | - | % de chance de fechar |
| Data Previsão | DATE | - | Previsão de fechamento |
| Vendedor | AUTOCOMPLETE | * | Responsável |
| Descrição | TEXTAREA | - | Detalhes da oportunidade |

#### Aba: Interações

**Histórico de contatos:**
| Campo | Descrição |
|-------|-----------|
| Data/Hora | Quando ocorreu |
| Tipo | Ligação, E-mail, WhatsApp, Reunião, Visita |
| Descrição | O que foi tratado |
| Próxima Ação | O que fazer a seguir |
| Data Próxima Ação | Quando fazer |
| Usuário | Quem registrou |

**Botão:** + Nova Interação

#### Aba: Tarefas

| Campo | Descrição |
|-------|-----------|
| Tarefa | Descrição da atividade |
| Responsável | Usuário |
| Prazo | Data limite |
| Prioridade | Alta, Média, Baixa |
| Status | Pendente, Em andamento, Concluída |

#### Aba: Orçamentos

- Lista de orçamentos vinculados a esta oportunidade
- Botão: Criar Novo Orçamento

---

