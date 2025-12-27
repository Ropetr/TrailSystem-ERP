# Casos de Uso - Módulo Comercial

Este documento contém os casos de uso do módulo comercial.

## 1. MÓDULO COMERCIAL

### 1.1 CRM

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| CRM-01 | Cadastrar Lead | Vendedor | Registrar novo lead no funil de vendas |
| CRM-02 | Avançar Lead no Funil | Vendedor | Mover lead entre etapas (Lead → Contato → Proposta → Negociação → Fechado) |
| CRM-03 | Registrar Interação | Vendedor | Registrar ligação, email, visita ou reunião com cliente/lead |
| CRM-04 | Agendar Follow-up | Vendedor | Criar tarefa de acompanhamento futuro |
| CRM-05 | Converter Lead em Cliente | Vendedor | Transformar lead qualificado em cliente cadastrado |

### 1.2 Orçamentos

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| ORC-01 | Criar Orçamento | Vendedor | Criar novo orçamento para cliente |
| ORC-02 | Editar Orçamento | Vendedor | Alterar itens, quantidades ou preços do orçamento |
| ORC-03 | Mesclar Orçamentos | Vendedor | Combinar múltiplos orçamentos em um único (mesmo cliente ou clientes diferentes) |
| ORC-04 | Desmembrar Orçamento | Vendedor | Separar itens de um orçamento em orçamentos filhos (#1236.1, #1236.2) |
| ORC-05 | Aplicar Desconto | Vendedor | Aplicar desconto no orçamento (com ou sem aprovação) |
| ORC-06 | Aprovar Desconto | Gerente | Aprovar desconto acima do limite do vendedor |
| ORC-07 | Converter em Venda | Vendedor | Transformar orçamento aprovado em pedido de venda |
| ORC-08 | Enviar Orçamento | Vendedor | Enviar orçamento por email ou WhatsApp |
| ORC-09 | Duplicar Orçamento | Vendedor | Criar cópia de orçamento existente |
| ORC-10 | Cancelar Orçamento | Vendedor | Cancelar orçamento com motivo |

### 1.3 Pedido de Venda

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| VEN-01 | Criar Venda Direta | Vendedor | Criar pedido de venda sem orçamento prévio |
| VEN-02 | Criar Venda de Orçamento | Vendedor | Converter orçamento em pedido de venda |
| VEN-03 | Definir Forma de Pagamento | Vendedor | Escolher forma(s) de pagamento da venda |
| VEN-04 | Usar Crédito do Cliente | Vendedor | Utilizar crédito disponível (indicação, devolução) na venda |
| VEN-05 | Reservar Crédito para Entregas | Vendedor | Reservar crédito para uso nas entregas fracionadas |
| VEN-06 | Registrar Entrega Fracionada | Expedição | Registrar entrega parcial (.E1, .E2, .E3...) |
| VEN-07 | Definir Financeiro por Entrega | Vendedor | Definir forma de pagamento em cada entrega |
| VEN-08 | Marcar Item como Bonificado | Vendedor | Marcar item como bonificação (não gera financeiro) |
| VEN-09 | Aprovar Bonificação | Gerente | Aprovar venda com item bonificado |
| VEN-10 | Desmembrar Venda | Vendedor | Separar pedido em múltiplos (#1000.1, #1000.2) |
| VEN-11 | Faturar Venda Total | Faturamento | Emitir NF-e de todos os itens |
| VEN-12 | Faturar Venda Parcial | Faturamento | Emitir NF-e de itens/quantidades selecionados |
| VEN-13 | Faturar por Entrega | Faturamento | Emitir NF-e vinculada a uma entrega específica |
| VEN-14 | Trocar Destinatário da NF | Faturamento | Emitir NF em nome de outro CPF/CNPJ |
| VEN-15 | Consolidar Pedidos em NF | Faturamento | Juntar múltiplos pedidos em uma única NF |
| VEN-16 | Cancelar Venda | Gerente | Cancelar pedido de venda com motivo |

### 1.4 PDV (Ponto de Venda)

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| PDV-01 | Abrir Caixa | Operador | Iniciar operação do caixa com valor de abertura |
| PDV-02 | Realizar Venda no PDV | Operador | Venda rápida no balcão |
| PDV-03 | Aplicar Desconto no PDV | Operador | Aplicar desconto (dentro do limite permitido) |
| PDV-04 | Usar Crédito no PDV | Operador | Utilizar crédito do cliente na venda |
| PDV-05 | Receber Pagamento Múltiplo | Operador | Receber em mais de uma forma de pagamento |
| PDV-06 | Realizar Sangria | Operador | Retirar dinheiro do caixa |
| PDV-07 | Realizar Suprimento | Operador | Adicionar dinheiro ao caixa |
| PDV-08 | Fechar Caixa | Operador | Encerrar operação e conferir valores |
| PDV-09 | Emitir NFC-e | Sistema | Emitir cupom fiscal eletrônico |

### 1.5 Devolução e Troca

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| DEV-01 | Solicitar Devolução | Vendedor | Registrar solicitação de devolução do cliente |
| DEV-02 | Aprovar Devolução | Gerente | Aprovar ou negar devolução |
| DEV-03 | Processar Devolução | Estoque | Dar entrada no estoque e gerar NF de devolução |
| DEV-04 | Estornar Pagamento | Financeiro | Devolver valor ao cliente |
| DEV-05 | Gerar Crédito de Devolução | Financeiro | Criar crédito na carteira do cliente |
| DEV-06 | Solicitar Troca | Vendedor | Registrar solicitação de troca |
| DEV-07 | Processar Troca | Estoque | Entrada do produto devolvido, saída do novo |
| DEV-08 | Cobrar Diferença de Troca | Financeiro | Cobrar diferença quando produto novo é mais caro |

### 1.6 Programa de Indicações

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| IND-01 | Cadastrar Indicador | Vendedor | Registrar quem indicou o cliente |
| IND-02 | Gerar Crédito de Indicação | Sistema | Criar crédito automático após venda/recebimento |
| IND-03 | Consultar Saldo de Créditos | Cliente | Ver créditos disponíveis e validade |
| IND-04 | Usar Crédito de Indicação | Vendedor | Aplicar crédito em nova compra |

### 1.7 Consignação

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| CON-01 | Criar Romaneio de Consignação | Vendedor | Enviar produtos em consignação para cliente |
| CON-02 | Registrar Acerto de Consignação | Vendedor | Informar itens vendidos e devolvidos |
| CON-03 | Gerar NF de Venda (Consignação) | Faturamento | Emitir NF dos itens vendidos pelo cliente |
| CON-04 | Gerar NF de Retorno (Consignação) | Faturamento | Emitir NF de retorno dos itens devolvidos |

### 1.8 Garantia

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| GAR-01 | Abrir Chamado de Garantia | Atendimento | Registrar solicitação de garantia |
| GAR-02 | Analisar Chamado de Garantia | Técnico | Avaliar defeito e emitir laudo |
| GAR-03 | Aprovar Garantia | Gerente | Aprovar resolução (reparo, troca, devolução) |
| GAR-04 | Executar Garantia | Técnico | Realizar reparo ou troca |
| GAR-05 | Encaminhar para Fabricante | Técnico | Enviar produto para assistência do fabricante |

### 1.9 Gamificação

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| GAM-01 | Definir Metas | Gerente | Criar metas individuais ou de equipe |
| GAM-02 | Consultar Ranking | Vendedor | Ver posição no ranking de vendas |
| GAM-03 | Registrar Premiação | RH | Registrar prêmio ganho pelo vendedor |

---

