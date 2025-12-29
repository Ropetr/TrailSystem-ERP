# Regras de Negócio - Módulo Comercial

Este documento contém as regras de negócio do módulo comercial.

## 3. COMERCIAL

### 3.1 CRM

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-01 | Funil de vendas | Etapas: Lead → Contato → Proposta → Negociação → Fechado/Perdido |
| COM-02 | Tempo máximo | Alerta se lead ficar mais de X dias na mesma etapa |
| COM-03 | Follow-up obrigatório | Sistema cobra registro de interação a cada X dias |

### 3.2 Orçamentos

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-04 | Validade | Orçamento tem prazo de validade configurável (padrão: 15 dias) |
| COM-05 | Versionamento | Alterações geram nova versão do orçamento |
| COM-06 | Mesclar orçamentos | Permite combinar múltiplos orçamentos em um único |
| COM-07 | Mesclar clientes diferentes | Ao mesclar de clientes diferentes, usuário escolhe cliente principal |
| COM-08 | Item duplicado | Regra parametrizável: usar menor preço, maior, mais recente ou manual |
| COM-09 | Desmembrar orçamento | Separar itens gera orçamentos filhos (#1236.1, #1236.2) |
| COM-10 | Rastreabilidade | Orçamento mesclado/desmembrado mantém vínculo com originais |
| COM-11 | Aprovação de desconto | Desconto acima do limite do vendedor requer aprovação |
| COM-12 | Conversão em venda | Orçamento aprovado pode virar pedido de venda |
| COM-13 | Orçamento vencido | Orçamento vencido é arquivado, pode ser reativado |

### 3.3 Pedido de Venda

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-14 | Pedido mínimo | Valor mínimo configurável por tipo de cliente (B2B/B2C) |
| COM-15 | Desconto máximo | Cada perfil tem limite de desconto sem aprovação |
| COM-16 | Reserva de estoque | Estoque é reservado ao criar o pedido (mesmo sem faturar) |
| COM-17 | Tempo de reserva | Reserva expira após X dias sem faturamento |
| COM-18 | Venda sem estoque | Configurável: permitir ou bloquear venda sem estoque |
| COM-19 | Venda abaixo do custo | Configurável: bloquear ou exigir aprovação especial |
| COM-20 | Desmembrar venda | Separar pedido em múltiplos (#1000.1, #1000.2) |

### 3.4 Status do Pedido

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-21 | Aberto | Pedido criado, nada faturado ou entregue |
| COM-22 | Parcialmente Faturado | Algumas NFs emitidas, mas não todas |
| COM-23 | Totalmente Faturado | 100% do pedido com NF emitida |
| COM-24 | Parcialmente Entregue | Algumas entregas realizadas |
| COM-25 | Totalmente Entregue | 100% do pedido entregue |
| COM-26 | Finalizado | Pedido 100% faturado E 100% entregue |

### 3.5 Entregas Fracionadas

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-27 | Numeração | Entregas parciais recebem sufixo .E1, .E2, .E3... |
| COM-28 | Tipo de entrega | Retirada pelo cliente OU Entrega no endereço |
| COM-29 | Responsável | Registra quem retirou ou motorista que entregou |
| COM-30 | Vínculo com NF | Cada entrega pode ter NF vinculada ou não |
| COM-31 | Histórico | Sistema mantém histórico completo de movimentações |

### 3.6 Faturamento

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-32 | Faturar total | Emitir NF de todos os itens do pedido |
| COM-33 | Faturar parcial | Emitir NF de itens/quantidades selecionados |
| COM-34 | Faturar por entrega | Emitir NF vinculada a uma entrega específica (.E1, .E2) |
| COM-35 | Trocar destinatário | Emitir NF em nome de outro CPF/CNPJ |
| COM-36 | Consolidar pedidos | Juntar múltiplos pedidos em uma única NF |
| COM-37 | NF Consumidor Final | Emitir sem identificação do cliente (CPF genérico) |
| COM-38 | Alerta pendência | Sistema alerta pedidos há X dias sem faturar |

### 3.7 Financeiro da Venda

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-39 | Opção 1 - Integral | Recebimento total na hora (baixa imediata) |
| COM-40 | Opção 2 - Venda Pai | Parcelas geradas no pedido principal |
| COM-41 | Opção 3 - Por Entrega | Financeiro definido em cada entrega fracionada |
| COM-42 | Opção 4 - Definir Depois | Financeiro não definido no momento da venda |
| COM-43 | Múltiplas formas | Permite combinar formas na mesma venda (PIX + Cartão + Crédito) |
| COM-44 | Formas por entrega | Cada entrega pode ter forma de pagamento diferente |

### 3.8 Crédito do Cliente

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-45 | Alerta automático | Sistema avisa se cliente tem crédito disponível |
| COM-46 | Tipos de crédito | Indicação, Devolução, Bonificação, Adiantamento |
| COM-47 | Usar na Venda Pai | Abater crédito do total da venda principal |
| COM-48 | Reservar para entregas | Manter crédito para uso nas entregas fracionadas |
| COM-49 | Uso parcial | Permite usar apenas parte do crédito disponível |
| COM-50 | Combinar formas | Crédito pode ser combinado com outras formas de pagamento |
| COM-51 | Carteira unificada | Todos os créditos ficam em carteira única do cliente |
| COM-52 | Validade do crédito | Crédito pode ter data de expiração configurável |

### 3.9 Limite de Crédito

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-53 | Compromete na venda | Limite é comprometido ao criar pedido (mesmo sem faturar) |
| COM-54 | Libera no recebimento | Limite é liberado conforme recebimento |
| COM-55 | Alerta de estouro | Sistema alerta quando venda ultrapassa limite |
| COM-56 | Bloqueio configurável | Pode bloquear ou apenas alertar quando limite excedido |

### 3.10 Bonificação

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-57 | Checkbox bonificado | Marcar item como bonificação no pedido |
| COM-58 | CFOP automático | Sistema usa CFOP 5.910 (estadual) ou 6.910 (interestadual) |
| COM-59 | Sem financeiro | Item bonificado não gera contas a receber |
| COM-60 | Motivo obrigatório | Campo de motivo da bonificação é obrigatório |
| COM-61 | Aprovação | Bonificação requer aprovação por alçada específica |
| COM-62 | Limite por período | Limite de bonificação por % sobre vendas do período |

### 3.11 Comissões

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-63 | Comissão padrão | Percentual base configurável |
| COM-64 | Comissão por categoria | Pode variar por categoria de produto |
| COM-65 | Comissão por cliente | Pode ter regra especial por cliente |
| COM-66 | Momento do pagamento | Configurável: no faturamento ou no recebimento |
| COM-67 | Desconto reduz comissão | Se vendedor der desconto, comissão pode ser reduzida |
| COM-68 | Divisão de comissão | Regra para venda de cliente de outro vendedor |

### 3.12 PDV

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-69 | Abertura de caixa | Operador informa valor de abertura |
| COM-70 | Sangria | Retirada de dinheiro quando atinge limite configurado |
| COM-71 | Suprimento | Adição de troco ao caixa |
| COM-72 | Limite de caixa | Valor máximo permitido em espécie |
| COM-73 | Fechamento | Conferência de valores no encerramento |
| COM-74 | Tolerância | Diferença aceitável no fechamento (ex: R$ 5,00) |
| COM-75 | NFC-e automática | Emissão de cupom fiscal eletrônico |

### 3.13 Programa de Indicações

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-76 | Quem indica | Cliente ativo ou Parceiro Externo cadastrado |
| COM-77 | Tipo de benefício | Dinheiro (saque) ou Crédito na Loja |
| COM-78 | Valor/Percentual | Configurável por % ou valor fixo |
| COM-79 | Base de cálculo | Sobre 1ª compra ou todas as compras do indicado |
| COM-80 | Momento do crédito | Imediato na venda ou após recebimento |
| COM-81 | Validade | Crédito expira após X dias (configurável) |
| COM-82 | Limite máximo | Valor máximo de crédito por indicação |

### 3.14 Devolução e Troca

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-83 | Prazo devolução | Dias permitidos após a compra (configurável) |
| COM-84 | Prazo troca | Dias permitidos para troca (pode ser diferente) |
| COM-85 | Aprovação | Devolução/troca requer aprovação configurável |
| COM-86 | Forma de estorno | Devolve dinheiro, gera crédito ou escolha no momento |
| COM-87 | Troca com diferença | Cliente paga diferença se produto novo for mais caro |
| COM-88 | Crédito de troca | Produto mais barato gera crédito |

### 3.15 Consignação

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-89 | Prazo padrão | Dias para acerto (30, 60, 90 - configurável) |
| COM-90 | Limite por cliente | Valor máximo em consignação por cliente |
| COM-91 | Alerta de vencimento | Sistema alerta X dias antes do prazo |
| COM-92 | Acerto parcial | Permite acertar apenas parte da consignação |
| COM-93 | NF de remessa | Emite NF de remessa em consignação |
| COM-94 | NF de venda/retorno | No acerto, emite NF de venda (vendidos) e retorno (devolvidos) |

### 3.16 Garantia

| ID | Regra | Descrição |
|----|-------|-----------|
| COM-95 | Prazo padrão | Dias de garantia configurável por produto/categoria |
| COM-96 | Tipo de garantia | Fabricante ou Loja |
| COM-97 | Prazo de análise | Dias para responder chamado de garantia |
| COM-98 | Resolução | Reparo, Troca ou Devolução |
| COM-99 | Encaminhamento | Pode enviar para assistência do fabricante |

---

