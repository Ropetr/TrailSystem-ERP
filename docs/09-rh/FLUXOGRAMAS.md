# Fluxogramas - Módulo RH

Este documento contém os fluxogramas de processo do módulo de recursos humanos.

## 15. Fluxo de RH - Admissão

```mermaid
flowchart TD
    A[Início] --> B[Vaga aprovada]
    
    B --> C[Publicar vaga]
    C --> D[Receber currículos]
    
    D --> E[Triagem de currículos]
    E --> F[Selecionar candidatos]
    
    F --> G[Agendar entrevistas]
    G --> H[Realizar entrevistas]
    
    H --> I{Aprovado na entrevista?}
    I -->|Não| J[Dispensar candidato]
    I -->|Sim| K[Aplicar testes - se houver]
    
    J --> D
    
    K --> L{Aprovado nos testes?}
    L -->|Não| J
    L -->|Sim| M[Selecionar candidato final]
    
    M --> N[Fazer proposta]
    N --> O{Candidato aceitou?}
    
    O -->|Não| P[Negociar ou próximo candidato]
    O -->|Sim| Q[Solicitar documentos]
    
    P --> N
    
    Q --> R[Candidato envia documentos]
    R --> S{Documentação completa?}
    
    S -->|Não| T[Solicitar documentos faltantes]
    S -->|Sim| U[Validar documentos]
    
    T --> R
    
    U --> V[Agendar exame admissional]
    V --> W[Realizar exame]
    
    W --> X{Apto?}
    X -->|Não| Y[Admissão cancelada]
    X -->|Sim| Z[Cadastrar colaborador no sistema]
    
    Z --> AA[Definir cargo e salário]
    AA --> AB[Definir departamento e gestor]
    AB --> AC[Configurar benefícios]
    
    AC --> AD[Gerar contrato de trabalho]
    AD --> AE[Assinar contrato]
    
    AE --> AF[Registrar na carteira - eSocial]
    AF --> AG[Criar usuário no sistema]
    AG --> AH[Configurar ponto eletrônico]
    
    AH --> AI[Agendar integração e onboarding]
    AI --> AJ[Colaborador admitido]
    
    Y --> AK[Fim]
    AJ --> AK
```

---

## 16. Fluxo de RH - Folha de Pagamento

```mermaid
flowchart TD
    A[Início do mês] --> B[Fechar ponto do mês anterior]
    
    B --> C[Importar registros de ponto]
    C --> D[Calcular horas trabalhadas]
    
    D --> E[Identificar ocorrências]
    E --> F{Tem ocorrências?}
    
    F -->|Sim| G[Processar ocorrências]
    F -->|Não| H[Prosseguir]
    
    G --> I[Faltas]
    G --> J[Atrasos]
    G --> K[Horas extras]
    G --> L[Banco de horas]
    
    I --> M[Calcular descontos de faltas]
    J --> N[Calcular descontos de atrasos]
    K --> O[Calcular adicional de horas extras]
    L --> P[Compensar ou pagar banco]
    
    M --> H
    N --> H
    O --> H
    P --> H
    
    H --> Q[Calcular salário base]
    
    Q --> R[Adicionar proventos]
    R --> R1[Comissões - integração vendas]
    R --> R2[Gratificações]
    R --> R3[Adicional noturno]
    R --> R4[Periculosidade e insalubridade]
    
    R1 --> S[Calcular descontos]
    R2 --> S
    R3 --> S
    R4 --> S
    
    S --> S1[INSS]
    S --> S2[IRRF]
    S --> S3[Vale transporte]
    S --> S4[Vale refeição]
    S --> S5[Plano de saúde]
    S --> S6[Outros descontos]
    
    S1 --> T[Calcular líquido]
    S2 --> T
    S3 --> T
    S4 --> T
    S5 --> T
    S6 --> T
    
    T --> U[Gerar prévia da folha]
    U --> V[Conferência pelo RH]
    
    V --> W{Aprovado?}
    W -->|Não| X[Corrigir divergências]
    W -->|Sim| Y[Aprovar folha]
    
    X --> U
    
    Y --> Z[Gerar holerites]
    Z --> AA[Disponibilizar no App do Colaborador]
    
    AA --> AB[Gerar arquivo bancário]
    AB --> AC[Enviar para banco]
    
    AC --> AD[Pagamento efetuado]
    
    AD --> AE[Gerar guias]
    AE --> AE1[INSS - GPS]
    AE --> AE2[IRRF - DARF]
    AE --> AE3[FGTS - GRF]
    
    AE1 --> AF[Contabilizar folha]
    AE2 --> AF
    AE3 --> AF
    
    AF --> AG[Lançamentos contábeis automáticos]
    AG --> AH[Folha finalizada]
    
    AH --> AI[Fim]
```

---

## 17. Fluxo de RH - Férias

```mermaid
flowchart TD
    A[Início] --> B{Origem?}
    
    B -->|Solicitação do colaborador| C[Colaborador solicita pelo App]
    B -->|Programação da empresa| D[RH programa férias]
    
    C --> E[Verificar período aquisitivo]
    D --> E
    
    E --> F{Tem direito?}
    F -->|Não| G[Informar período restante]
    F -->|Sim| H[Verificar saldo de dias]
    
    G --> I[Fim]
    
    H --> J[Selecionar período de gozo]
    J --> K{Fracionamento?}
    
    K -->|Não| L[Férias de 30 dias]
    K -->|Sim| M[Dividir em períodos]
    
    M --> N{Períodos válidos?}
    N -->|Não - mínimo 14 dias no 1º| O[Ajustar períodos]
    N -->|Sim| P[Confirmar fracionamento]
    
    O --> M
    L --> P
    
    P --> Q{Vender dias - abono?}
    Q -->|Sim| R[Calcular abono pecuniário - máx 10 dias]
    Q -->|Não| S[Sem abono]
    
    R --> T[Calcular valores]
    S --> T
    
    T --> U[Salário do período]
    U --> V[Adicionar 1/3 constitucional]
    V --> W[Calcular descontos]
    
    W --> X[Enviar para aprovação do gestor]
    X --> Y{Gestor aprovou?}
    
    Y -->|Não| Z[Devolver para ajuste de datas]
    Y -->|Sim| AA[Férias aprovadas]
    
    Z --> J
    
    AA --> AB[Gerar recibo de férias]
    AB --> AC[Pagar até 2 dias antes do início]
    
    AC --> AD[Colaborador entra em férias]
    AD --> AE[Registrar afastamento no ponto]
    
    AE --> AF[Colaborador retorna]
    AF --> AG[Baixar férias no sistema]
    AG --> AH[Atualizar saldo]
    
    AH --> I
```

---

