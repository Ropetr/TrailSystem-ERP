# Fluxogramas - Módulo Logística

Este documento contém os fluxogramas de processo do módulo de logística/expedição.

## 11. Fluxo de Entrega com Rastreamento GPS

```mermaid
flowchart TD
    A[Pedidos prontos para entrega] --> B[Montar romaneio de carga]
    
    B --> C[Roteirização automática]
    C --> D[Atribuir motorista]
    
    D --> E[Motorista abre App]
    E --> F[Ver lista de entregas do dia]
    
    F --> G[Iniciar rota]
    G --> H[GPS ativado - Rastreamento em tempo real]
    
    H --> I[Cliente pode acompanhar no mapa]
    
    I --> J[Motorista chega no endereço]
    J --> K[Check-in automático por GPS]
    
    K --> L[Notificar cliente: Motorista chegou!]
    
    L --> M{Cliente presente?}
    
    M -->|Sim| N[Entregar mercadoria]
    M -->|Não| O[Registrar ocorrência: Ausente]
    
    N --> P[Coletar assinatura digital]
    P --> Q[Tirar foto do comprovante]
    Q --> R[Confirmar entrega no App]
    
    R --> S[Baixa automática no sistema]
    S --> T[Notificar cliente: Entrega realizada!]
    
    O --> U{Reagendar?}
    U -->|Sim| V[Agendar nova tentativa]
    U -->|Não| W[Retornar mercadoria]
    
    V --> X[Próxima entrega da lista]
    W --> X
    T --> X
    
    X --> Y{Mais entregas?}
    Y -->|Sim| J
    Y -->|Não| Z[Finalizar rota]
    
    Z --> AA[Retornar ao CD]
    AA --> AB[Fechar romaneio]
    
    AB --> AC[Fim]
```

---

## 23. Fluxo de Transferência entre Filiais

```mermaid
flowchart TD
    A[Início] --> B{Motivo?}
    
    B -->|Solicitação de filial| C[Filial destino solicita produtos]
    B -->|Balanceamento de estoque| D[Sistema sugere transferência]
    B -->|Venda de outra filial| E[Pedido requer estoque de outra filial]
    
    C --> F[Criar solicitação de transferência]
    D --> F
    E --> F
    
    F --> G[Selecionar produtos e quantidades]
    G --> H[Definir filial origem]
    H --> I[Definir filial destino]
    
    I --> J[Verificar estoque na origem]
    J --> K{Tem estoque?}
    
    K -->|Não| L[Solicitação negada - sem estoque]
    K -->|Sim| M[Reservar estoque na origem]
    
    M --> N[Enviar para aprovação]
    N --> O{Aprovado?}
    
    O -->|Não| P[Solicitação cancelada]
    O -->|Sim| Q[Gerar NF-e de Transferência]
    
    Q --> R[CFOP 5.152 ou 6.152]
    R --> S[Emitir NF-e]
    
    S --> T[Baixar estoque na filial origem]
    T --> U[Separar mercadoria]
    U --> V[Despachar para filial destino]
    
    V --> W[Mercadoria em trânsito]
    W --> X[Filial destino recebe]
    
    X --> Y[Conferir mercadoria x NF]
    Y --> Z{Confere?}
    
    Z -->|Não| AA[Registrar divergência]
    Z -->|Sim| AB[Confirmar recebimento]
    
    AA --> AC[Notificar filial origem]
    AC --> AB
    
    AB --> AD[Dar entrada no estoque destino]
    AD --> AE[Vincular NF de entrada]
    
    AE --> AF[Transferência concluída]
    
    L --> AG[Fim]
    P --> AG
    AF --> AG
```

---

