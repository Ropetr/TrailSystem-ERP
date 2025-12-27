# Casos de Uso - Módulo Financeiro

Este documento contém os casos de uso do módulo financeiro.

## 3. MÓDULO FINANCEIRO

### 3.1 Contas a Receber

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| CRE-01 | Gerar Título a Receber | Sistema | Criar título automaticamente na venda |
| CRE-02 | Emitir Boleto | Financeiro | Gerar boleto bancário |
| CRE-03 | Gerar PIX | Sistema | Criar QR Code para pagamento |
| CRE-04 | Baixar Título Manualmente | Financeiro | Registrar recebimento em dinheiro |
| CRE-05 | Baixar Título Automaticamente | Sistema | Baixa via retorno bancário ou conciliação |
| CRE-06 | Renegociar Título | Financeiro | Alterar vencimento ou parcelar dívida |
| CRE-07 | Negativar Cliente | Financeiro | Incluir cliente no Serasa/SPC |
| CRE-08 | Baixar Negativação | Financeiro | Remover cliente do Serasa/SPC após pagamento |

### 3.2 Contas a Pagar

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| CPA-01 | Gerar Título a Pagar | Sistema | Criar título automaticamente na compra |
| CPA-02 | Agendar Pagamento | Financeiro | Programar data de pagamento |
| CPA-03 | Aprovar Pagamento | Gerente | Autorizar pagamento acima do limite |
| CPA-04 | Efetuar Pagamento | Financeiro | Realizar pagamento e baixar título |
| CPA-05 | Gerar Arquivo de Pagamento | Financeiro | Criar arquivo CNAB para banco |

### 3.3 Limite de Crédito

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| LIM-01 | Definir Limite de Crédito | Financeiro | Estabelecer limite para cliente |
| LIM-02 | Solicitar Aumento de Limite | Vendedor | Pedir aumento para cliente |
| LIM-03 | Analisar Crédito | Financeiro | Avaliar histórico e aprovar/negar |
| LIM-04 | Bloquear Cliente por Limite | Sistema | Impedir venda quando limite excedido |

---

