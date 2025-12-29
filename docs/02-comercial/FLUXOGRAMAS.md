# Fluxogramas - Módulo Comercial

Este documento contém os fluxogramas de processo do módulo comercial.

## 1. Fluxo de Venda Completa

```mermaid
flowchart TD
    A[Início] --> B{Origem?}
    B -->|Orçamento| C[Converter Orçamento em Venda]
    B -->|Direta| D[Criar Venda Direta]
    
    C --> E[Venda Criada #1000]
    D --> E
    
    E --> F{Cliente tem crédito?}
    F -->|Sim| G[Perguntar se usa crédito]
    F -->|Não| H[Definir forma de pagamento]
    
    G --> G1{Opção escolhida?}
    G1 -->|Usar na Venda Pai| G2[Abater crédito do total]
    G1 -->|Reservar para Entregas| G3[Manter crédito reservado]
    G1 -->|Não usar| H
    
    G2 --> H
    G3 --> H
    
    H --> I{Tipo de financeiro?}
    I -->|Recebimento Integral| J[Baixa total na hora]
    I -->|Contas a Receber na Pai| K[Gera parcelas no pedido principal]
    I -->|Financeiro por Entrega| L[Define em cada entrega]
    I -->|Sem Financeiro Agora| M[Define depois]
    
    J --> N[Reserva Estoque]
    K --> N
    L --> N
    M --> N
    
    N --> O{Tipo de entrega?}
    O -->|Total| P[Entrega única]
    O -->|Fracionada| Q[Entregas parciais]
    
    P --> R[Registrar Entrega]
    Q --> S[Registrar Entrega .E1]
    
    R --> T{Faturar?}
    S --> T
    
    T -->|Sim| U[Emitir NF-e]
    T -->|Depois| V[Faturamento Pendente]
    
    U --> W{Mais entregas?}
    V --> W
    
    W -->|Sim| X[Registrar Entrega .E2, .E3...]
    W -->|Não| Y{Tudo entregue e faturado?}
    
    X --> T
    
    Y -->|Sim| Z[Venda Finalizada]
    Y -->|Não| AA[Venda Parcial - Acompanhar]
    
    Z --> AB[Fim]
    AA --> AB
```

---

## 2. Fluxo de Orçamento (Mesclar/Desmembrar)

```mermaid
flowchart TD
    A[Início] --> B[Criar Orçamento]
    B --> C[Orçamento #1236]
    
    C --> D{Ação?}
    
    D -->|Aprovar| E[Converter em Venda]
    D -->|Mesclar| F[Selecionar outros orçamentos]
    D -->|Desmembrar| G[Selecionar itens para separar]
    D -->|Editar| H[Alterar itens/valores]
    D -->|Cancelar| I[Orçamento Cancelado]
    
    F --> J{Clientes diferentes?}
    J -->|Sim| K[Escolher cliente principal]
    J -->|Não| L[Manter cliente]
    
    K --> M[Mesclar orçamentos]
    L --> M
    
    M --> N{Itens duplicados?}
    N -->|Sim| O{Regra de preço?}
    N -->|Não| P[Orçamento Mesclado]
    
    O -->|Menor preço| Q[Usar menor valor]
    O -->|Maior preço| R[Usar maior valor]
    O -->|Mais recente| S[Usar último]
    O -->|Manual| T[Usuário escolhe]
    
    Q --> P
    R --> P
    S --> P
    T --> P
    
    P --> U[Orçamento Principal com dropdown de mesclados]
    
    G --> V[Criar orçamentos filhos]
    V --> W[#1236.1, #1236.2...]
    W --> X[Orçamentos vinculados ao pai]
    
    H --> C
    
    E --> Y[Venda Criada]
    U --> D
    X --> D
    
    Y --> Z[Fim]
    I --> Z
```

---

## 3. Fluxo de Uso de Crédito na Venda

```mermaid
flowchart TD
    A[Iniciar Venda] --> B{Cliente tem crédito?}
    
    B -->|Não| C[Prosseguir sem crédito]
    B -->|Sim| D[Exibir saldo de crédito]
    
    D --> E[Mostrar origem: Indicação, Devolução, etc.]
    E --> F[Mostrar validade]
    
    F --> G{Usar crédito?}
    
    G -->|Usar na Venda Pai| H[Informar valor a usar]
    G -->|Reservar para Entregas| I[Crédito fica disponível nas .E1, .E2...]
    G -->|Não usar agora| C
    
    H --> J{Valor >= Total da venda?}
    J -->|Sim| K[Venda 100% com crédito]
    J -->|Não| L[Crédito + Outra forma de pagamento]
    
    K --> M[Baixa do crédito]
    L --> N[Definir forma complementar]
    N --> M
    
    I --> O[Crédito reservado]
    O --> P[Na entrega .E1]
    
    P --> Q{Usar crédito reservado?}
    Q -->|Sim| R[Abater do valor da entrega]
    Q -->|Não| S[Usar outra forma]
    
    R --> T[Baixa parcial do crédito]
    S --> T
    
    C --> U[Definir forma de pagamento normal]
    M --> V[Venda finalizada]
    T --> V
    U --> V
    
    V --> W[Fim]
```

---

## 4. Fluxo de Devolução de Venda

```mermaid
flowchart TD
    A[Cliente solicita devolução] --> B[Localizar venda original]
    
    B --> C{Dentro do prazo?}
    C -->|Não| D[Devolução negada - Fora do prazo]
    C -->|Sim| E[Selecionar itens a devolver]
    
    E --> F[Informar motivo]
    F --> G[Registrar condição do produto]
    
    G --> H{Precisa aprovação?}
    H -->|Sim| I[Enviar para aprovação]
    H -->|Não| J[Devolução aprovada automaticamente]
    
    I --> K{Aprovado?}
    K -->|Não| L[Devolução negada]
    K -->|Sim| J
    
    J --> M[Gerar NF-e de Entrada - Devolução]
    M --> N[Dar entrada no estoque]
    
    N --> O{Tipo de estorno?}
    O -->|Dinheiro| P[Estornar pagamento]
    O -->|Crédito| Q[Gerar crédito na carteira do cliente]
    O -->|Escolher na hora| R[Perguntar ao cliente]
    
    R --> O
    
    P --> S[Registrar estorno no financeiro]
    Q --> T[Crédito disponível para próximas compras]
    
    S --> U[Devolução concluída]
    T --> U
    D --> V[Fim]
    L --> V
    U --> V
```

---

## 5. Fluxo de Troca de Venda

```mermaid
flowchart TD
    A[Cliente solicita troca] --> B[Localizar venda original]
    
    B --> C{Dentro do prazo?}
    C -->|Não| D[Troca negada - Fora do prazo]
    C -->|Sim| E[Selecionar itens a trocar]
    
    E --> F[Informar motivo]
    F --> G[Selecionar novos produtos]
    
    G --> H[Calcular diferença]
    
    H --> I{Valor da troca?}
    I -->|Novo maior que Antigo| J[Cliente paga diferença]
    I -->|Novo menor que Antigo| K[Cliente recebe crédito ou estorno]
    I -->|Igual| L[Troca sem diferença]
    
    J --> M{Precisa aprovação?}
    K --> M
    L --> M
    
    M -->|Sim| N[Enviar para aprovação]
    M -->|Não| O[Troca aprovada]
    
    N --> P{Aprovado?}
    P -->|Não| Q[Troca negada]
    P -->|Sim| O
    
    O --> R[Gerar NF-e Devolução - Produto antigo]
    R --> S[Entrada no estoque - Produto antigo]
    
    S --> T[Gerar NF-e Venda - Produto novo]
    T --> U[Saída do estoque - Produto novo]
    
    U --> V{Tem diferença a pagar?}
    V -->|Sim| W[Processar pagamento ou crédito]
    V -->|Não| X[Troca concluída]
    
    W --> X
    D --> Y[Fim]
    Q --> Y
    X --> Y
```

---

## 6. Fluxo de Consignação

```mermaid
flowchart TD
    A[Início] --> B[Criar Romaneio de Consignação]
    
    B --> C[Selecionar cliente depositário]
    C --> D[Selecionar produtos e quantidades]
    D --> E[Definir prazo para acerto]
    
    E --> F[Emitir NF-e Remessa em Consignação]
    F --> G[Saída do estoque próprio]
    G --> H[Entrada no estoque em consignação]
    
    H --> I[Consignação ativa]
    
    I --> J{Ação?}
    
    J -->|Acerto parcial| K[Informar itens vendidos pelo cliente]
    J -->|Acerto total| L[Informar todos os itens vendidos ou devolvidos]
    J -->|Devolução total| M[Cliente devolve tudo]
    J -->|Prazo vencendo| N[Alerta automático]
    
    N --> J
    
    K --> O[Separar: Vendidos x A devolver]
    L --> O
    M --> P[Todos os itens voltam]
    
    O --> Q[Gerar NF-e Venda - Itens vendidos]
    Q --> R[Gerar financeiro]
    
    O --> S{Tem itens a devolver?}
    S -->|Sim| T[Gerar NF-e Retorno de Consignação]
    S -->|Não| U[Acerto concluído]
    
    T --> V[Entrada no estoque próprio]
    V --> U
    
    P --> T
    
    R --> U
    
    U --> W{Ainda tem itens em consignação?}
    W -->|Sim| I
    W -->|Não| X[Consignação encerrada]
    
    X --> Y[Fim]
```

---

## 12. Fluxo de Garantia de Produtos

```mermaid
flowchart TD
    A[Cliente abre chamado de garantia] --> B[Informar NF ou nº de série]
    
    B --> C[Sistema localiza produto]
    C --> D{Produto encontrado?}
    
    D -->|Não| E[Solicitar documentação]
    D -->|Sim| F[Verificar prazo de garantia]
    
    E --> F
    
    F --> G{Dentro da garantia?}
    G -->|Não| H[Garantia expirada - Oferecer reparo pago]
    G -->|Sim| I[Garantia válida]
    
    I --> J[Cliente descreve o defeito]
    J --> K[Cliente envia fotos]
    
    K --> L[Criar chamado de garantia]
    L --> M[Enviar para análise técnica]
    
    M --> N[Técnico analisa]
    N --> O{Defeito confirmado?}
    
    O -->|Não| P[Garantia negada - Mau uso]
    O -->|Sim| Q{Tipo de resolução?}
    
    Q -->|Reparo| R[Agendar reparo]
    Q -->|Troca| S[Trocar por produto novo]
    Q -->|Devolução| T[Devolver valor]
    Q -->|Enviar ao fabricante| U[Encaminhar para assistência]
    
    R --> V[Produto reparado]
    S --> W[Gerar NF de troca]
    T --> X[Gerar crédito ou estorno]
    U --> Y[Aguardar retorno do fabricante]
    
    Y --> Z{Fabricante resolveu?}
    Z -->|Sim| AA[Devolver produto ao cliente]
    Z -->|Não| AB[Trocar ou devolver valor]
    
    V --> AC[Entregar ao cliente]
    W --> AC
    X --> AC
    AA --> AC
    AB --> AC
    
    AC --> AD[Fechar chamado]
    
    H --> AE[Fim]
    P --> AE
    AD --> AE
```

---

## 19. Fluxo de Precificação

```mermaid
flowchart TD
    A[Início] --> B{Origem?}
    
    B -->|Novo produto| C[Calcular preço inicial]
    B -->|Revisão periódica| D[Revisar preços existentes]
    B -->|Alteração de custo| E[Recalcular por mudança de custo]
    
    C --> F[Obter custo de aquisição]
    D --> F
    E --> F
    
    F --> G[Somar custos diretos]
    G --> G1[Preço de compra]
    G --> G2[Frete de compra]
    G --> G3[Impostos não recuperáveis]
    
    G1 --> H[Custo de aquisição]
    G2 --> H
    G3 --> H
    
    H --> I[Calcular custos indiretos rateados]
    I --> I1[Aluguel rateado]
    I --> I2[Salários rateados]
    I --> I3[Energia e utilidades]
    I --> I4[Marketing]
    
    I1 --> J[Custo total do produto]
    I2 --> J
    I3 --> J
    I4 --> J
    
    J --> K[Definir margem desejada]
    
    K --> L{Método de precificação?}
    L -->|Markup| M[Aplicar markup sobre custo]
    L -->|Margem| N[Calcular por margem de contribuição]
    L -->|Mercado| O[Basear no preço do concorrente]
    
    M --> P[Preço calculado]
    N --> P
    O --> P
    
    P --> Q[Verificar margem mínima]
    Q --> R{Margem ok?}
    
    R -->|Não| S[Alerta: abaixo da margem mínima]
    R -->|Sim| T[Preço aprovado]
    
    S --> U{Aprovar exceção?}
    U -->|Não| V[Ajustar preço ou custo]
    U -->|Sim| W[Registrar aprovação de exceção]
    
    V --> K
    W --> T
    
    T --> X[Definir preço por tabela]
    X --> X1[Preço varejo]
    X --> X2[Preço atacado]
    X --> X3[Preço por volume]
    
    X1 --> Y[Atualizar cadastro do produto]
    X2 --> Y
    X3 --> Y
    
    Y --> Z[Atualizar e-commerce]
    Z --> AA[Registrar histórico de preços]
    
    AA --> AB{Precificação em lote?}
    AB -->|Sim| AC[Próximo produto da lista]
    AB -->|Não| AD[Precificação concluída]
    
    AC --> F
    AD --> AE[Fim]
```

---

## 20. Fluxo de Bonificação (Venda)

```mermaid
flowchart TD
    A[Vendedor cria pedido] --> B{Tem item bonificado?}
    
    B -->|Não| C[Pedido normal]
    B -->|Sim| D[Marcar checkbox BONIFICADO]
    
    D --> E[Campo obrigatório: Motivo]
    E --> F{Motivo válido?}
    
    F -->|Amostra| G[Registrar como amostra]
    F -->|Acordo comercial| H[Registrar acordo]
    F -->|Avaria parcial| I[Registrar avaria]
    F -->|Outro| J[Descrever motivo]
    
    G --> K[Verificar limite de bonificação]
    H --> K
    I --> K
    J --> K
    
    K --> L{Dentro do limite mensal?}
    L -->|Não| M[Bloquear - limite excedido]
    L -->|Sim| N[Calcular CFOP de bonificação]
    
    M --> O[Solicitar aprovação especial]
    O --> P{Diretor aprovou?}
    
    P -->|Não| Q[Bonificação negada]
    P -->|Sim| N
    
    N --> R[CFOP 5.910 ou 6.910]
    R --> S[Item não gera financeiro]
    
    S --> T[Enviar para aprovação por alçada]
    T --> U{Aprovado?}
    
    U -->|Não| V[Pedido devolvido para ajuste]
    U -->|Sim| W[Pedido aprovado]
    
    V --> D
    
    W --> X[Emitir NF-e com CFOP de bonificação]
    X --> Y[Baixar estoque]
    Y --> Z[Não gerar contas a receber]
    
    Z --> AA[Registrar no relatório de bonificações]
    
    C --> AB[Fim]
    Q --> AB
    AA --> AB
```

---

## 21. Fluxo de Limite de Crédito

```mermaid
flowchart TD
    A[Cliente faz pedido] --> B[Verificar limite de crédito]
    
    B --> C[Obter limite aprovado]
    C --> D[Calcular saldo utilizado]
    
    D --> D1[Pedidos em aberto não faturados]
    D --> D2[Títulos a vencer]
    D --> D3[Títulos vencidos]
    
    D1 --> E[Saldo comprometido total]
    D2 --> E
    D3 --> E
    
    E --> F[Calcular limite disponível]
    F --> G[Limite aprovado - Saldo comprometido]
    
    G --> H{Pedido cabe no limite?}
    
    H -->|Sim| I[Pedido liberado]
    H -->|Não| J[Pedido bloqueado por limite]
    
    J --> K{Tem títulos vencidos?}
    K -->|Sim| L[Alerta: cliente inadimplente]
    K -->|Não| M[Apenas limite excedido]
    
    L --> N[Bloquear até regularização]
    M --> O{Solicitar aumento?}
    
    O -->|Não| P[Cliente deve pagar ou reduzir pedido]
    O -->|Sim| Q[Enviar para análise de crédito]
    
    Q --> R[Analisar histórico do cliente]
    R --> S[Verificar score de crédito]
    S --> T[Consultar Serasa e SPC]
    
    T --> U{Aprovar aumento?}
    U -->|Não| V[Manter limite atual]
    U -->|Sim| W[Definir novo limite]
    
    W --> X[Atualizar cadastro do cliente]
    X --> Y[Notificar vendedor]
    
    Y --> Z[Reprocessar pedido bloqueado]
    Z --> H
    
    V --> P
    N --> AA[Fim]
    P --> AA
    I --> AA
```

---

## 24. Fluxo do PDV (Ponto de Venda)

```mermaid
flowchart TD
    A[Abrir caixa] --> B[Informar valor de abertura]
    B --> C[Caixa aberto]
    
    C --> D[Iniciar venda]
    D --> E{Identificar cliente?}
    
    E -->|Sim| F[Buscar cliente - CPF ou CNPJ]
    E -->|Não| G[Consumidor final]
    
    F --> H{Cliente encontrado?}
    H -->|Não| I[Cadastro rápido]
    H -->|Sim| J[Carregar dados do cliente]
    
    I --> J
    G --> K[Adicionar produtos]
    J --> K
    
    K --> L[Ler código de barras ou buscar]
    L --> M[Adicionar ao carrinho]
    
    M --> N{Mais produtos?}
    N -->|Sim| K
    N -->|Não| O[Subtotal da venda]
    
    O --> P{Desconto?}
    P -->|Sim| Q[Aplicar desconto]
    P -->|Não| R[Valor final]
    
    Q --> R
    
    R --> S{Cliente tem crédito?}
    S -->|Sim| T[Perguntar se usa crédito]
    S -->|Não| U[Escolher forma de pagamento]
    
    T --> U
    
    U --> V{Forma de pagamento?}
    V -->|Dinheiro| W[Receber dinheiro]
    V -->|Cartão Crédito| X[Processar no TEF]
    V -->|Cartão Débito| Y[Processar no TEF]
    V -->|PIX| Z[Gerar QR Code]
    V -->|Múltiplas formas| AA[Combinar formas]
    
    W --> AB[Calcular troco]
    X --> AC{Aprovado?}
    Y --> AC
    Z --> AD[Aguardar confirmação]
    AA --> AE[Processar cada forma]
    
    AB --> AF[Pagamento OK]
    AC -->|Sim| AF
    AC -->|Não| AG[Tentar novamente ou outra forma]
    AD --> AF
    AE --> AF
    
    AG --> V
    
    AF --> AH[Emitir NFC-e]
    AH --> AI[Imprimir cupom]
    AI --> AJ[Abrir gaveta - se dinheiro]
    
    AJ --> AK[Venda concluída]
    AK --> AL{Continuar vendendo?}
    
    AL -->|Sim| D
    AL -->|Não| AM{Fechar caixa?}
    
    AM -->|Não| D
    AM -->|Sim| AN[Iniciar fechamento]
    
    AN --> AO[Contar dinheiro em caixa]
    AO --> AP[Informar valores por forma de pagamento]
    
    AP --> AQ{Valores conferem?}
    AQ -->|Não| AR[Registrar diferença]
    AQ -->|Sim| AS[Fechamento OK]
    
    AR --> AT{Diferença aceitável?}
    AT -->|Sim| AS
    AT -->|Não| AU[Investigar diferença]
    
    AU --> AS
    AS --> AV[Gerar relatório de fechamento]
    AV --> AW[Caixa fechado]
    
    AW --> AX[Fim]
```

---

