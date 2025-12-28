# TrailSystem ERP - Schema de Banco de Dados

## Baseado na Análise do Projeto ACBr

Este schema foi criado a partir da análise meticulosa dos componentes ACBr:

### Módulos ACBr Analisados:
- **ACBrNFe** - NF-e, NFC-e (Notas Fiscais Eletrônicas)
- **ACBrCTe** - CT-e (Conhecimento de Transporte)
- **ACBrMDFe** - MDF-e (Manifesto de Documentos Fiscais)
- **ACBrNFSe** - NFS-e (Nota Fiscal de Serviços)
- **ACBrBoleto** - Cobrança Bancária (60+ bancos)
- **ACBrPIXCD** - PIX (Cobrança e Pagamento)
- **ACBrTEFD** - TEF (Transferência Eletrônica de Fundos)
- **ACBrSAT** - SAT/CF-e (Cupom Fiscal Eletrônico)
- **ACBreSocial** - eSocial (Eventos trabalhistas)
- **ACBrReinf** - EFD-Reinf (Retenções e contribuições)
- **ACBrSPED** - SPED Fiscal, Contribuições e Contábil
- **ACBrPagFor** - Pagamento de Fornecedores

## Estrutura de Módulos

| Módulo | Descrição | Tabelas |
|--------|-----------|---------|
| **Core** | Empresas, configurações, usuários, auditoria | tb_empresas, tb_filiais, tb_usuarios, tb_configuracoes |
| **Cadastros** | Pessoas, produtos, serviços, NCM, CFOP | tb_pessoas, tb_produtos, tb_servicos, tb_ncm, tb_cfop |
| **Fiscal** | Documentos fiscais eletrônicos | tb_documentos_fiscais, tb_documentos_fiscais_itens |
| **Financeiro** | Boletos, PIX, TEF, contas | tb_contas_receber, tb_contas_pagar, tb_pix_transacoes |
| **Estoque** | Movimentações, lotes, inventário | tb_estoque_saldos, tb_estoque_movimentacoes, tb_estoque_lotes |
| **Vendas** | Pedidos, orçamentos, tabelas de preço | tb_pedidos_venda, tb_tabelas_preco |
| **Compras** | Pedidos de compra | tb_pedidos_compra |
| **Transporte** | CT-e, MDF-e | tb_cte, tb_mdfe |
| **RH/eSocial** | Funcionários, folha, eventos | tb_funcionarios, tb_folha_pagamento, tb_esocial_eventos |
| **SPED** | Arquivos SPED | tb_sped_fiscal, tb_sped_contribuicoes, tb_sped_contabil |

## Banco de Dados

**PostgreSQL 15+** com suporte a:
- JSONB para dados flexíveis
- UUIDs como chave primária
- Triggers de auditoria automáticos
- Full-text search

## Convenções

- Prefixo `tb_` para tabelas
- Campos de auditoria: `created_at`, `updated_at`, `deleted_at`
- Soft delete padrão
- Suporte multi-tenant (campo `empresa_id`)

## Como Usar

```bash
# Executar o schema completo
psql -U postgres -d trailsystem -f database/migrations/schema_completo.sql
```

## Tabelas Criadas (Total: 65+)

### Core (6 tabelas)
- tb_paises
- tb_estados  
- tb_municipios
- tb_empresas
- tb_filiais
- tb_usuarios
- tb_configuracoes
- tb_audit_log

### Cadastros (12 tabelas)
- tb_pessoas
- tb_pessoas_enderecos
- tb_pessoas_contatos
- tb_pessoas_dados_bancarios
- tb_produtos
- tb_produtos_tributacao
- tb_produtos_categorias
- tb_servicos
- tb_ncm
- tb_cest
- tb_cfop
- tb_natureza_operacao

### Fiscal (8 tabelas)
- tb_documentos_fiscais
- tb_documentos_fiscais_itens
- tb_documentos_fiscais_itens_impostos
- tb_documentos_fiscais_pagamentos
- tb_documentos_fiscais_duplicatas
- tb_documentos_fiscais_transporte
- tb_documentos_fiscais_eventos
- tb_documentos_fiscais_inutilizacao

### Financeiro (14 tabelas)
- tb_bancos
- tb_contas_bancarias
- tb_formas_pagamento
- tb_condicoes_pagamento
- tb_contas_receber
- tb_contas_pagar
- tb_movimentacoes_bancarias
- tb_remessas_bancarias
- tb_retornos_bancarios
- tb_pix_transacoes
- tb_pix_devolucoes
- tb_tef_transacoes

### Estoque (5 tabelas)
- tb_locais_estoque
- tb_estoque_saldos
- tb_estoque_movimentacoes
- tb_estoque_lotes
- tb_inventarios

### Vendas (4 tabelas)
- tb_pedidos_venda
- tb_pedidos_venda_itens
- tb_tabelas_preco
- tb_tabelas_preco_itens

### Compras (2 tabelas)
- tb_pedidos_compra
- tb_pedidos_compra_itens

### Transporte (5 tabelas)
- tb_cte
- tb_cte_documentos
- tb_mdfe
- tb_mdfe_documentos
- tb_mdfe_percurso

### RH/eSocial (7 tabelas)
- tb_funcionarios
- tb_funcionarios_dependentes
- tb_esocial_eventos
- tb_folha_pagamento
- tb_folha_pagamento_funcionarios
- tb_folha_pagamento_eventos
- tb_reinf_eventos

### SPED (3 tabelas)
- tb_sped_fiscal
- tb_sped_contribuicoes
- tb_sped_contabil

---

**Versão:** 1.0.0  
**Data:** 2024-12-28  
**Baseado em:** Projeto ACBr (https://projetoacbr.com.br)  
**Desenvolvido para:** TrailSystem ERP - PLANAC Distribuidora
