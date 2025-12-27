# Regras de Negócio - Módulo Estoque

Este documento contém as regras de negócio do módulo de estoque.

### 4.4 Estoque

| ID | Regra | Descrição |
|----|-------|-----------|
| CPR-14 | Estoque mínimo | Quantidade mínima definida por dias de venda |
| CPR-15 | Estoque máximo | Limite máximo para evitar over-stock |
| CPR-16 | Alerta de reposição | Sistema alerta quando atinge mínimo |
| CPR-17 | Curva ABC | Classificação automática de produtos |
| CPR-18 | Lote e validade | Controle opcional por produto |

### 4.5 Inventário

| ID | Regra | Descrição |
|----|-------|-----------|
| CPR-19 | Frequência | Configurável (mensal, trimestral, anual) |
| CPR-20 | Contagem dupla | Recontagem obrigatória em caso de divergência |
| CPR-21 | Tolerância | Percentual de divergência aceitável |
| CPR-22 | Aprovação de ajuste | Ajustes requerem aprovação |

### 4.6 Transferência entre Filiais

| ID | Regra | Descrição |
|----|-------|-----------|
| CPR-23 | NF de transferência | Gera NF de saída na origem e entrada no destino |
| CPR-24 | Conferência | Destino confere e confirma recebimento |
| CPR-25 | Aprovação | Transferência pode requerer aprovação |

### 4.7 Kits

| ID | Regra | Descrição |
|----|-------|-----------|
| CPR-26 | Montagem | Criar kit a partir de componentes |
| CPR-27 | Desmontagem | Desfazer kit em componentes |
| CPR-28 | Baixa automática | Kit virtual baixa componentes na venda |
| CPR-29 | Alerta componente | Alerta se componente em falta para montar kit |
| CPR-30 | Custo do kit | Soma dos custos dos componentes |

### 4.8 Custos e Precificação

| ID | Regra | Descrição |
|----|-------|-----------|
| CPR-31 | Custos fixos | Cadastro de custos fixos mensais (aluguel, salários, etc.) |
| CPR-32 | Custos variáveis | Comissões, impostos, frete (% sobre venda) |
| CPR-33 | Rateio | Custos fixos rateados por faturamento ou m² |
| CPR-34 | Método de custo | Custo médio ponderado ou PEPS |
| CPR-35 | Markup | Percentual de margem por categoria/produto |
| CPR-36 | Margem mínima | Alerta ou bloqueio se margem abaixo do mínimo |
| CPR-37 | Precificação automática | Recalcular preços em lote |
| CPR-38 | Simulador | What-if para simular cenários de preço |
| CPR-39 | DRE por produto | Resultado por produto, categoria, cliente |

---

