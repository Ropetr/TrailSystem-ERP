# 🛒 MÓDULO 5: COMERCIAL

## Diagrama - CRM

```mermaid
erDiagram
    crm_leads ||--o{ crm_atividades : possui
    crm_leads ||--o{ crm_historico : registra
    crm_leads }o--o| clientes : converte
    crm_leads }o--o| vendedores : atribuido
    
    crm_leads {
        text id PK
        text empresa_id FK
        text nome
        text email
        text telefone
        text empresa_nome
        text cargo
        text origem
        text origem_detalhe
        text etapa
        real valor_estimado
        date previsao_fechamento
        integer temperatura
        text tags
        text vendedor_id FK
        text cliente_id FK
        text observacoes
        datetime convertido_em
        datetime perdido_em
        text motivo_perda
        datetime created_at
        datetime updated_at
    }
    
    crm_atividades {
        text id PK
        text empresa_id FK
        text lead_id FK
        text cliente_id FK
        text tipo
        text titulo
        text descricao
        datetime data_agendada
        datetime data_realizada
        text status
        text resultado
        text usuario_id FK
        datetime created_at
        datetime updated_at
    }
    
    crm_historico {
        text id PK
        text lead_id FK
        text acao
        text descricao
        text dados
        text usuario_id FK
        datetime created_at
    }
```

## Diagrama - Orçamentos

```mermaid
erDiagram
    orcamentos ||--o{ orcamentos_itens : contem
    orcamentos ||--o{ orcamentos_pagamentos : possui
    orcamentos ||--o{ orcamentos_historico : registra
    orcamentos }o--o| pedidos : converte
    clientes ||--o{ orcamentos : solicita
    vendedores ||--o{ orcamentos : atende
    
    orcamentos {
        text id PK
        text empresa_id FK
        text filial_id FK
        text numero
        text numero_formatado
        text orcamento_pai_id FK
        text cliente_id FK
        text vendedor_id FK
        text tabela_preco_id FK
        text endereco_entrega_id FK
        date data_emissao
        date data_validade
        text status
        real valor_produtos
        real valor_desconto
        real valor_acrescimo
        real valor_frete
        real valor_total
        real percentual_desconto
        text tipo_desconto
        text observacoes
        text observacoes_internas
        integer versao
        text mesclado_de
        integer aprovacao_necessaria
        text aprovado_por FK
        datetime aprovado_em
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    
    orcamentos_itens {
        text id PK
        text orcamento_id FK
        text produto_id FK
        text variacao_id FK
        integer sequencia
        text descricao
        text unidade
        real quantidade
        real preco_unitario
        real preco_tabela
        real desconto_percentual
        real desconto_valor
        real valor_total
        text observacao
        datetime created_at
        datetime updated_at
    }
    
    orcamentos_pagamentos {
        text id PK
        text orcamento_id FK
        text forma_pagamento_id FK
        integer parcelas
        real valor
        text observacao
        datetime created_at
    }
    
    orcamentos_historico {
        text id PK
        text orcamento_id FK
        text acao
        text descricao
        text dados_anterior
        text dados_novo
        text usuario_id FK
        datetime created_at
    }
```

## Diagrama - Pedidos de Venda

```mermaid
erDiagram
    pedidos ||--o{ pedidos_itens : contem
    pedidos ||--o{ pedidos_entregas : possui
    pedidos ||--o{ pedidos_pagamentos : possui
    pedidos ||--o{ pedidos_historico : registra
    pedidos ||--o{ pedidos_aprovacoes : requer
    pedidos_entregas ||--o{ pedidos_entregas_itens : contem
    clientes ||--o{ pedidos : compra
    vendedores ||--o{ pedidos : vende
    
    pedidos {
        text id PK
        text empresa_id FK
        text filial_id FK
        text numero
        text numero_formatado
        text pedido_pai_id FK
        text orcamento_id FK
        text cliente_id FK
        text vendedor_id FK
        text tabela_preco_id FK
        date data_emissao
        date previsao_entrega
        text status
        text status_financeiro
        text status_entrega
        real valor_produtos
        real valor_desconto
        real valor_acrescimo
        real valor_frete
        real valor_total
        real valor_faturado
        real valor_entregue
        real valor_recebido
        real percentual_desconto
        text tipo_frete
        text transportadora_id FK
        real peso_total
        integer volumes
        integer bonificado
        text motivo_bonificado
        text aprovado_bonificacao_por FK
        text observacoes
        text observacoes_internas
        text observacoes_nf
        real comissao_percentual
        real comissao_valor
        text desmembrado_de
        datetime faturado_em
        datetime entregue_em
        datetime finalizado_em
        datetime cancelado_em
        text motivo_cancelamento
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    
    pedidos_itens {
        text id PK
        text pedido_id FK
        text produto_id FK
        text variacao_id FK
        integer sequencia
        text descricao
        text unidade
        real quantidade
        real quantidade_faturada
        real quantidade_entregue
        real preco_unitario
        real preco_tabela
        real desconto_percentual
        real desconto_valor
        real valor_total
        real custo_unitario
        real margem
        text cfop
        text ncm
        text cst_icms
        text cst_pis
        text cst_cofins
        integer bonificado
        text observacao
        datetime created_at
        datetime updated_at
    }
    
    pedidos_entregas {
        text id PK
        text pedido_id FK
        text numero
        text numero_formatado
        integer sequencia
        date data_prevista
        date data_entrega
        text endereco_id FK
        text endereco_completo
        text status
        text transportadora_id FK
        text motorista_id FK
        text veiculo_id FK
        real valor_frete
        real peso
        integer volumes
        text codigo_rastreio
        text observacoes
        datetime saiu_em
        datetime entregue_em
        text recebedor_nome
        text recebedor_documento
        text assinatura_url
        text foto_comprovante_url
        real latitude_entrega
        real longitude_entrega
        datetime created_at
        datetime updated_at
    }
    
    pedidos_entregas_itens {
        text id PK
        text entrega_id FK
        text pedido_item_id FK
        text produto_id FK
        real quantidade
        datetime created_at
    }
    
    pedidos_pagamentos {
        text id PK
        text pedido_id FK
        text entrega_id FK
        text forma_pagamento_id FK
        integer parcelas
        real valor
        text status
        text observacao
        datetime created_at
        datetime updated_at
    }
    
    pedidos_aprovacoes {
        text id PK
        text pedido_id FK
        text tipo
        text motivo
        real valor_referencia
        text status
        text usuario_solicitante_id FK
        text usuario_aprovador_id FK
        text observacao
        datetime solicitado_em
        datetime aprovado_em
        datetime created_at
    }
    
    pedidos_historico {
        text id PK
        text pedido_id FK
        text acao
        text descricao
        text dados
        text usuario_id FK
        datetime created_at
    }
```

## Diagrama - PDV

```mermaid
erDiagram
    pdv_caixas ||--o{ pdv_movimentacoes : possui
    pdv_caixas ||--o{ pdv_vendas : registra
    pdv_vendas ||--o{ pdv_vendas_itens : contem
    pdv_vendas ||--o{ pdv_vendas_pagamentos : possui
    
    pdv_caixas {
        text id PK
        text empresa_id FK
        text filial_id FK
        text terminal
        text usuario_abertura_id FK
        text usuario_fechamento_id FK
        real valor_abertura
        real valor_fechamento
        real valor_sistema
        real diferenca
        text status
        datetime abertura_em
        datetime fechamento_em
        text observacao_abertura
        text observacao_fechamento
        datetime created_at
        datetime updated_at
    }
    
    pdv_movimentacoes {
        text id PK
        text caixa_id FK
        text tipo
        real valor
        text motivo
        text observacao
        text usuario_id FK
        datetime created_at
    }
    
    pdv_vendas {
        text id PK
        text empresa_id FK
        text filial_id FK
        text caixa_id FK
        text numero
        text cliente_id FK
        text vendedor_id FK
        real valor_total
        real valor_desconto
        real valor_troco
        text status
        text pedido_id FK
        text nfce_id FK
        datetime created_at
        datetime updated_at
    }
    
    pdv_vendas_itens {
        text id PK
        text venda_id FK
        text produto_id FK
        real quantidade
        real preco_unitario
        real desconto
        real valor_total
        datetime created_at
    }
    
    pdv_vendas_pagamentos {
        text id PK
        text venda_id FK
        text forma_pagamento_id FK
        real valor
        real valor_recebido
        real troco
        text autorizacao
        text bandeira
        datetime created_at
    }
```

## Diagrama - Indicações, Devoluções, Trocas, Consignação, Garantia

```mermaid
erDiagram
    indicacoes ||--o{ indicacoes_creditos : gera
    clientes ||--o{ indicacoes : indica
    devolucoes ||--o{ devolucoes_itens : contem
    trocas ||--o{ trocas_itens_devolvidos : recebe
    trocas ||--o{ trocas_itens_novos : entrega
    consignacoes ||--o{ consignacoes_itens : contem
    garantias ||--o{ garantias_historico : registra
    
    indicacoes {
        text id PK
        text empresa_id FK
        text indicador_id FK
        text indicado_id FK
        text codigo
        text status
        real valor_geracao
        real credito_gerado
        datetime convertido_em
        datetime created_at
        datetime updated_at
    }
    
    indicacoes_creditos {
        text id PK
        text indicacao_id FK
        text indicador_id FK
        text pedido_id FK
        real valor_pedido
        real percentual
        real valor_credito
        text status
        text credito_cliente_id FK
        datetime creditado_em
        datetime created_at
    }
    
    devolucoes {
        text id PK
        text empresa_id FK
        text filial_id FK
        text numero
        text pedido_id FK
        text cliente_id FK
        text motivo
        text tipo_estorno
        real valor_total
        text status
        text aprovado_por FK
        datetime aprovado_em
        text nfe_entrada_id FK
        text credito_gerado_id FK
        text observacao
        datetime created_at
        datetime updated_at
    }
    
    devolucoes_itens {
        text id PK
        text devolucao_id FK
        text pedido_item_id FK
        text produto_id FK
        real quantidade
        real valor_unitario
        real valor_total
        text estado_produto
        text observacao
        datetime created_at
    }
    
    trocas {
        text id PK
        text empresa_id FK
        text filial_id FK
        text numero
        text pedido_original_id FK
        text cliente_id FK
        real valor_devolucao
        real valor_novos
        real diferenca
        text tipo_diferenca
        text status
        text aprovado_por FK
        datetime aprovado_em
        text observacao
        datetime created_at
        datetime updated_at
    }
    
    trocas_itens_devolvidos {
        text id PK
        text troca_id FK
        text produto_id FK
        real quantidade
        real valor_unitario
        real valor_total
        datetime created_at
    }
    
    trocas_itens_novos {
        text id PK
        text troca_id FK
        text produto_id FK
        real quantidade
        real valor_unitario
        real valor_total
        datetime created_at
    }
    
    consignacoes {
        text id PK
        text empresa_id FK
        text filial_id FK
        text numero
        text cliente_id FK
        date data_saida
        date data_retorno_previsto
        date data_acerto
        real valor_total
        real valor_vendido
        real valor_devolvido
        text status
        text observacao
        text nfe_saida_id FK
        text nfe_retorno_id FK
        datetime created_at
        datetime updated_at
    }
    
    consignacoes_itens {
        text id PK
        text consignacao_id FK
        text produto_id FK
        real quantidade_enviada
        real quantidade_vendida
        real quantidade_devolvida
        real valor_unitario
        text status
        datetime created_at
        datetime updated_at
    }
    
    garantias {
        text id PK
        text empresa_id FK
        text filial_id FK
        text numero
        text cliente_id FK
        text pedido_id FK
        text pedido_item_id FK
        text produto_id FK
        text defeito_relatado
        text analise_tecnica
        text status
        text resolucao
        text aprovado_por FK
        datetime aprovado_em
        datetime prazo_resposta
        text observacao
        datetime created_at
        datetime updated_at
    }
    
    garantias_historico {
        text id PK
        text garantia_id FK
        text status_anterior
        text status_novo
        text descricao
        text usuario_id FK
        datetime created_at
    }
    
    gamificacao_metas {
        text id PK
        text empresa_id FK
        text nome
        text tipo
        text periodo
        real valor_meta
        real pontos_premio
        text descricao
        integer ativo
        datetime created_at
        datetime updated_at
    }
    
    gamificacao_pontos {
        text id PK
        text empresa_id FK
        text vendedor_id FK
        text meta_id FK
        text origem
        text origem_id
        real valor_base
        integer pontos
        datetime created_at
    }
    
    gamificacao_premios {
        text id PK
        text empresa_id FK
        text nome
        text descricao
        integer pontos_necessarios
        text tipo
        real valor
        integer quantidade_disponivel
        integer ativo
        datetime created_at
        datetime updated_at
    }
    
    gamificacao_resgates {
        text id PK
        text empresa_id FK
        text vendedor_id FK
        text premio_id FK
        integer pontos_usados
        text status
        datetime resgatado_em
        datetime entregue_em
        datetime created_at
    }
```

---

