# Especificação de Telas - Módulo Financeiro

Este documento contém as especificações de telas do módulo financeiro.

# PARTE 4 - FINANCEIRO

## 4.1 Contas a Receber

### Tela: Lista de Títulos a Receber
**Rota:** `/financeiro/receber`

| Filtro | Tipo | Descrição |
|--------|------|-----------|
| Período Vencimento | DATE_RANGE | Data de vencimento |
| Status | MULTISELECT | Aberto, Vencido, Pago, Pago Parcial, Cancelado |
| Cliente | AUTOCOMPLETE | - |
| Vendedor | AUTOCOMPLETE | - |
| Forma Pagamento | SELECT | Boleto, Cartão, PIX, etc. |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Documento | Número |
| Cliente | Nome |
| Emissão | Data de emissão |
| Vencimento | Data de vencimento |
| Valor Original | Valor do título |
| Juros/Multa | Se vencido |
| Valor Atual | Original + Juros |
| Pago | Valor já recebido |
| Saldo | A receber |
| Dias Atraso | Se vencido |
| Status | Badge |

**Cards Resumo:**
| Card | Valor |
|------|-------|
| A Receber Hoje | R$ 15.000 |
| A Receber na Semana | R$ 45.000 |
| A Receber no Mês | R$ 180.000 |
| Vencidos | R$ 25.000 |

**Ações:**
- Baixar Selecionados
- Enviar Cobrança
- Renegociar
- Exportar

---

### Tela: Baixa de Título
**Rota:** `/financeiro/receber/:id/baixa`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Título | TEXT | - | Somente leitura |
| Valor Original | MONEY | - | Somente leitura |
| Juros | MONEY | - | Calculado automaticamente |
| Multa | MONEY | - | Calculado automaticamente |
| Valor Atualizado | MONEY | - | Original + Juros + Multa |
| Desconto | MONEY | - | Desconto concedido |
| Valor Recebido | MONEY | * | Quanto recebeu |
| Data Recebimento | DATE | * | Quando recebeu |
| Forma Recebimento | SELECT | * | PIX, Dinheiro, etc. |
| Conta Bancária | SELECT | * | Onde entrou |
| Comprovante | FILE | - | Anexar comprovante |

**Opções:**
- Baixa Total
- Baixa Parcial (gera saldo)
- Baixa com Desconto (requer justificativa)

---

### Tela: Renegociação de Títulos
**Rota:** `/financeiro/receber/renegociacao`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Cliente | AUTOCOMPLETE | Cliente devedor |
| Títulos | MULTISELECT | Títulos em aberto |
| Total Original | MONEY | Soma dos títulos |
| Juros Acumulados | MONEY | Total de juros |
| Total da Dívida | MONEY | Original + Juros |

**Negociação:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| Desconto nos Juros | MONEY | Abatimento |
| Novo Valor | MONEY | Valor renegociado |
| Forma de Pagamento | SELECT | - |
| Número de Parcelas | NUMBER | - |
| Primeiro Vencimento | DATE | - |

**Preview das Parcelas:**
| Parcela | Vencimento | Valor |
|---------|------------|-------|
| 1/6 | 15/01/2025 | R$ 500,00 |
| 2/6 | 15/02/2025 | R$ 500,00 |
| ... | ... | ... |

---

## 4.2 Contas a Pagar

### Tela: Lista de Títulos a Pagar
**Rota:** `/financeiro/pagar`

| Filtro | Tipo | Descrição |
|--------|------|-----------|
| Período Vencimento | DATE_RANGE | - |
| Status | MULTISELECT | Aberto, Vencido, Pago, Parcial, Cancelado |
| Fornecedor | AUTOCOMPLETE | - |
| Categoria | SELECT | Mercadorias, Despesas, Impostos, etc. |
| Aprovação | SELECT | Pendente, Aprovado |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Documento | Número |
| Fornecedor | Nome |
| Categoria | Tipo de despesa |
| Emissão | Data |
| Vencimento | Data |
| Valor | Valor a pagar |
| Pago | Já pago |
| Saldo | Pendente |
| Aprovação | ✅ Aprovado / ⏳ Pendente |
| Status | Badge |

**Cards:**
| Card | Valor |
|------|-------|
| A Pagar Hoje | R$ 8.000 |
| A Pagar na Semana | R$ 35.000 |
| A Pagar no Mês | R$ 150.000 |
| Vencidos | R$ 5.000 |

---

### Tela: Novo Título a Pagar
**Rota:** `/financeiro/pagar/novo`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Fornecedor | AUTOCOMPLETE | * | Busca fornecedor |
| Documento | TEXT | * | Número do documento |
| Categoria | SELECT | * | Tipo de despesa |
| Centro de Custo | SELECT | - | Departamento |
| Data Emissão | DATE | * | - |
| Data Vencimento | DATE | * | - |
| Valor | MONEY | * | Valor a pagar |
| Forma Pagamento | SELECT | * | Boleto, Transferência, etc. |
| Código de Barras | TEXT | - | Para boleto |
| Chave PIX | TEXT | - | Para PIX |
| Recorrente | CHECKBOX | - | Gerar automaticamente |
| Frequência | SELECT | ** | Mensal, Semanal, etc. |
| Observações | TEXTAREA | - | - |
| Anexo | FILE | - | NF, Contrato, etc. |

---

### Tela: Pagamento de Títulos
**Rota:** `/financeiro/pagar/pagamento`

**Seleção em Lote:**
| Checkbox | Documento | Fornecedor | Vencimento | Valor |
|----------|-----------|------------|------------|-------|
| ☑ | NF 1234 | Fornecedor A | 01/12 | R$ 5.000 |
| ☑ | NF 5678 | Fornecedor B | 01/12 | R$ 3.000 |
| ☐ | NF 9012 | Fornecedor C | 02/12 | R$ 2.000 |

**Resumo do Pagamento:**
| Campo | Valor |
|-------|-------|
| Total Selecionado | R$ 8.000 |
| Descontos | R$ 0 |
| Total a Pagar | R$ 8.000 |

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Data Pagamento | DATE | Quando pagar |
| Conta Bancária | SELECT | De onde sai |
| Forma | SELECT | TED, PIX, Boleto |

**Ações:**
- Gerar Arquivo CNAB
- Pagar via Internet Banking
- Registrar Pagamento Manual

---

## 4.3 Fluxo de Caixa

### Tela: Fluxo de Caixa
**Rota:** `/financeiro/fluxo-caixa`

| Filtro | Descrição |
|--------|-----------|
| Período | Data inicial e final |
| Visão | Diária, Semanal, Mensal |
| Conta | Todas ou específica |
| Realizado/Previsto | Mostrar ambos ou só um |

**Tabela:**
| Data | Saldo Inicial | Entradas | Saídas | Saldo Final |
|------|---------------|----------|--------|-------------|
| 01/12 | R$ 50.000 | R$ 15.000 | R$ 8.000 | R$ 57.000 |
| 02/12 | R$ 57.000 | R$ 12.000 | R$ 20.000 | R$ 49.000 |
| 03/12 | R$ 49.000 | R$ 25.000 | R$ 10.000 | R$ 64.000 |
| ... | ... | ... | ... | ... |

**Gráfico:** Linha mostrando evolução do saldo

**Detalhamento (ao clicar no dia):**
| Tipo | Descrição | Valor |
|------|-----------|-------|
| ➕ Entrada | Recebimento NF 1234 | R$ 5.000 |
| ➕ Entrada | Recebimento NF 5678 | R$ 10.000 |
| ➖ Saída | Pagamento Fornecedor X | R$ 3.000 |
| ➖ Saída | Energia Elétrica | R$ 5.000 |

---

## 4.4 Gestão de Bancos

### Tela: Contas Bancárias
**Rota:** `/financeiro/bancos`

| Coluna | Descrição |
|--------|-----------|
| Banco | Nome do banco |
| Agência | Número |
| Conta | Número |
| Tipo | Corrente, Poupança |
| Saldo Sistema | Saldo no ERP |
| Saldo Banco | Saldo conciliado |
| Diferença | Pendências |
| Status | Ativo/Inativo |

---

### Tela: Extrato Bancário
**Rota:** `/financeiro/bancos/:id/extrato`

| Filtro | Descrição |
|--------|-----------|
| Período | Data inicial e final |
| Tipo | Entradas, Saídas, Todos |
| Conciliação | Conciliados, Pendentes, Todos |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Data | Data da movimentação |
| Histórico | Descrição |
| Documento | Referência |
| Entrada | Valor crédito |
| Saída | Valor débito |
| Saldo | Saldo atual |
| Conciliado | ✅ ou ⏳ |

---

### Tela: Conciliação Bancária
**Rota:** `/financeiro/bancos/:id/conciliacao`

**Lado Esquerdo: Extrato do Banco**
(Importado via OFX/CNAB)

**Lado Direito: Movimentações do Sistema**
(Baixas e pagamentos registrados)

**Ação:** Vincular movimentação do banco com lançamento do sistema

**Pendências:**
| Tipo | Descrição | Valor | Ação |
|------|-----------|-------|------|
| No banco, não no sistema | Tarifa bancária | R$ 35,00 | Criar lançamento |
| No sistema, não no banco | Cheque não compensado | R$ 500,00 | Aguardar |

---

## 4.5 DRE - Demonstrativo de Resultados

### Tela: DRE
**Rota:** `/financeiro/dre`

| Filtro | Descrição |
|--------|-----------|
| Período | Mês/Ano ou intervalo |
| Comparativo | Período anterior, Mesmo período ano anterior |
| Filial | Todas ou específica |

**Estrutura:**
```
RECEITA OPERACIONAL BRUTA
  (+) Vendas de Mercadorias         R$ 500.000    100%
  (-) Impostos sobre Vendas         R$ 60.000     12%
  (-) Devoluções                    R$ 5.000      1%
= RECEITA LÍQUIDA                   R$ 435.000    87%

(-) CUSTO DAS MERCADORIAS VENDIDAS
  CMV                               R$ 280.000    56%
= LUCRO BRUTO                       R$ 155.000    31%

(-) DESPESAS OPERACIONAIS
  Despesas com Pessoal              R$ 45.000     9%
  Despesas Administrativas          R$ 15.000     3%
  Despesas Comerciais               R$ 20.000     4%
  Despesas Financeiras              R$ 8.000      1.6%
= LUCRO OPERACIONAL                 R$ 67.000     13.4%

(-) OUTRAS DESPESAS/RECEITAS
  Receitas Financeiras              R$ 2.000      0.4%
= LUCRO ANTES DO IR                 R$ 69.000     13.8%

(-) IR/CSLL                         R$ 10.000     2%
= LUCRO LÍQUIDO                     R$ 59.000     11.8%
```

**Gráficos:**
- Pizza: Composição das despesas
- Barras: Comparativo de períodos

---

