# Casos de Uso - Módulo Compras

Este documento contém os casos de uso do módulo de compras.

## 2. MÓDULO COMPRAS

### 2.1 Cotações

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| COT-01 | Criar Solicitação de Compra | Comprador | Solicitar compra de produtos |
| COT-02 | Criar Cotação | Comprador | Solicitar cotação de fornecedores |
| COT-03 | Registrar Proposta de Fornecedor | Comprador | Cadastrar resposta do fornecedor |
| COT-04 | Comparar Cotações | Comprador | Analisar propostas lado a lado |
| COT-05 | Selecionar Melhor Oferta | Comprador | Escolher fornecedor vencedor |

### 2.2 Pedido de Compra

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| COM-01 | Criar Pedido de Compra | Comprador | Gerar pedido para fornecedor |
| COM-02 | Aprovar Pedido de Compra | Gerente/Diretor | Aprovar compra acima do limite |
| COM-03 | Enviar Pedido ao Fornecedor | Comprador | Transmitir pedido ao fornecedor |
| COM-04 | Marcar Compra como Bonificação | Comprador | Registrar recebimento de bonificação |

### 2.3 Recebimento

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| REC-01 | Importar NF-e de Compra | Comprador | Importar XML da NF do fornecedor |
| REC-02 | Manifestar NF-e | Comprador | Confirmar ciência da operação no SEFAZ |
| REC-03 | Conferir Mercadoria | Estoque | Conferir física x NF |
| REC-04 | Registrar Divergência | Estoque | Informar falta, sobra ou avaria |
| REC-05 | Dar Entrada no Estoque | Estoque | Confirmar entrada dos produtos |

### 2.4 Devolução de Compra

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| DVC-01 | Solicitar Devolução ao Fornecedor | Comprador | Iniciar devolução de compra |
| DVC-02 | Emitir NF de Devolução | Faturamento | Gerar NF de saída (devolução) |
| DVC-03 | Registrar Crédito do Fornecedor | Financeiro | Lançar crédito a receber do fornecedor |

### 2.5 Produção (PCP)

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| PCP-01 | Criar Ordem de Produção | PCP | Gerar OP para fabricação |
| PCP-02 | Reservar Insumos | PCP | Reservar matéria-prima para produção |
| PCP-03 | Apontar Produção | Operador | Registrar quantidade produzida |
| PCP-04 | Registrar Perda/Refugo | Operador | Informar perdas na produção |
| PCP-05 | Finalizar OP | PCP | Encerrar ordem e dar entrada no estoque |

---

