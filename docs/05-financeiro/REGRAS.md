# Regras de Negócio - Módulo Financeiro

Este documento contém as regras de negócio do módulo financeiro.

## 5. FINANCEIRO

### 5.1 Contas a Receber

| ID | Regra | Descrição |
|----|-------|-----------|
| FIN-01 | Geração automática | Título gerado automaticamente na venda |
| FIN-02 | Baixa manual | Permite baixar título manualmente |
| FIN-03 | Baixa automática | Baixa via retorno bancário ou conciliação |
| FIN-04 | Juros de mora | Percentual ao mês configurável |
| FIN-05 | Multa | Percentual de multa por atraso |
| FIN-06 | Carência | Dias de tolerância sem juros/multa |

### 5.2 Cobrança

| ID | Regra | Descrição |
|----|-------|-----------|
| FIN-07 | Régua de cobrança | Ações automáticas por dias de atraso |
| FIN-08 | Aviso antes | Enviar lembrete X dias antes do vencimento |
| FIN-09 | Cobrança após | Sequência de ações após vencimento (1, 7, 15, 30 dias) |
| FIN-10 | Canal de cobrança | E-mail, WhatsApp ou ambos |
| FIN-11 | Negativação | Incluir no Serasa/SPC após X dias |
| FIN-12 | Bloqueio de cliente | Bloquear venda após X dias de atraso |

### 5.3 Contas a Pagar

| ID | Regra | Descrição |
|----|-------|-----------|
| FIN-13 | Geração automática | Título gerado na compra |
| FIN-14 | Dias de pagamento | Dias fixos para pagamento (ex: terça e sexta) |
| FIN-15 | Aprovação por valor | Pagamentos acima de X requerem aprovação |
| FIN-16 | Arquivo CNAB | Geração de remessa para banco |

### 5.4 Limite de Crédito

| ID | Regra | Descrição |
|----|-------|-----------|
| FIN-17 | Limite padrão PF | Valor inicial para pessoa física |
| FIN-18 | Limite padrão PJ | Valor inicial para pessoa jurídica |
| FIN-19 | Análise de crédito | Processo de avaliação para aumento |
| FIN-20 | Considerar pedidos | Limite considera pedidos não faturados |

### 5.5 Conciliação

| ID | Regra | Descrição |
|----|-------|-----------|
| FIN-21 | Frequência | Diária, semanal ou mensal |
| FIN-22 | Extrato bancário | Importação de OFX/OFC |
| FIN-23 | Conciliação automática | Match por valor e data |
| FIN-24 | Divergências | Tratamento de lançamentos não conciliados |

### 5.6 Fluxo de Caixa

| ID | Regra | Descrição |
|----|-------|-----------|
| FIN-25 | Visão | Diária, semanal e mensal |
| FIN-26 | Projeção | Previsão baseada em recorrências |
| FIN-27 | Caixa mínimo | Alerta quando saldo projetado abaixo do mínimo |
| FIN-28 | Centro de custos | Classificação por centro de custo |
| FIN-29 | DRE gerencial | Demonstrativo de resultado mensal |
| FIN-30 | Comparativo | Realizado x Orçado x Período anterior |

---

