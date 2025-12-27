# Fluxogramas - Módulo Financeiro

Este documento contém os fluxogramas de processo do módulo financeiro.

## 8. Fluxo Financeiro - Recebimento

```mermaid
flowchart TD
    A[Título gerado] --> B[Contas a Receber]
    
    B --> C{Vencimento?}
    C -->|Futuro| D[Aguardar vencimento]
    C -->|Hoje| E[Dia do vencimento]
    C -->|Vencido| F[Título em atraso]
    
    D --> G{Pagamento antecipado?}
    G -->|Sim| H[Baixa com desconto]
    G -->|Não| C
    
    E --> I{Cliente pagou?}
    I -->|Sim| J[Identificar pagamento]
    I -->|Não| F
    
    F --> K[Iniciar régua de cobrança]
    K --> L[Enviar cobrança: Email e WhatsApp]
    
    L --> M{Dias de atraso?}
    M -->|1-7 dias| N[Cobrança amigável]
    M -->|8-30 dias| O[Cobrança firme]
    M -->|31-60 dias| P[Bloquear cliente]
    M -->|Mais de 60 dias| Q[Negativação]
    
    N --> I
    O --> I
    P --> I
    Q --> R{Cliente pagou?}
    
    R -->|Sim| S[Baixar negativação]
    R -->|Não| T[Cobrança judicial]
    
    S --> J
    
    J --> U{Forma de pagamento?}
    U -->|PIX| V[Baixa automática]
    U -->|Boleto| W[Baixa via retorno bancário]
    U -->|Cartão| X[Baixa via conciliadora]
    U -->|Dinheiro| Y[Baixa manual]
    
    V --> Z[Título baixado]
    W --> Z
    X --> Z
    Y --> Z
    
    H --> Z
    
    Z --> AA{Valor correto?}
    AA -->|Sim| AB[Recebimento concluído]
    AA -->|Menor| AC[Baixa parcial - Gerar novo título]
    AA -->|Maior| AD[Gerar crédito para cliente]
    
    AC --> AB
    AD --> AB
    
    T --> AE[Fim]
    AB --> AE
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

## 22. Fluxo de Cobrança (Régua)

```mermaid
flowchart TD
    A[Título vencido] --> B[Entrar na régua de cobrança]
    
    B --> C{Dias de atraso?}
    
    C -->|1 dia| D[Cobrança D+1]
    C -->|3 dias| E[Cobrança D+3]
    C -->|7 dias| F[Cobrança D+7]
    C -->|15 dias| G[Cobrança D+15]
    C -->|30 dias| H[Cobrança D+30]
    C -->|45 dias| I[Cobrança D+45]
    C -->|60 dias| J[Cobrança D+60]
    
    D --> K[Enviar lembrete amigável]
    K --> K1[Email: Seu boleto venceu ontem]
    K --> K2[WhatsApp: Lembrete de pagamento]
    
    E --> L[Segundo lembrete]
    L --> L1[Email com 2ª via do boleto]
    
    F --> M[Cobrança mais firme]
    M --> M1[Email: Regularize seu pagamento]
    M --> M2[WhatsApp: Evite negativação]
    
    G --> N[Notificação de bloqueio iminente]
    N --> N1[Email: Cadastro será bloqueado em 15 dias]
    
    H --> O[Bloquear cliente]
    O --> O1[Impedir novas vendas]
    O --> O2[Notificar vendedor responsável]
    
    I --> P[Aviso de negativação]
    P --> P1[Email: Última chance antes do Serasa]
    
    J --> Q[Negativar cliente]
    Q --> Q1[Incluir no Serasa e SPC]
    Q --> Q2[Registrar no sistema]
    
    K1 --> R{Cliente pagou?}
    K2 --> R
    L1 --> R
    M1 --> R
    M2 --> R
    N1 --> R
    O1 --> R
    O2 --> R
    P1 --> R
    
    R -->|Sim| S[Baixar título]
    R -->|Não| C
    
    S --> T{Estava negativado?}
    T -->|Sim| U[Baixar negativação]
    T -->|Não| V[Título quitado]
    
    U --> W{Estava bloqueado?}
    V --> W
    
    W -->|Sim| X[Desbloquear cliente]
    W -->|Não| Y[Fim]
    
    X --> Y
    Q1 --> Z[Iniciar cobrança judicial]
    Q2 --> Z
    Z --> Y
```

---

