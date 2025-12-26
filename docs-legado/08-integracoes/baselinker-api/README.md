# 📦 Baselinker API - Documentação Completa

> Hub de integração de e-commerce para marketplaces

## 📋 Arquivos nesta pasta

| Arquivo | Descrição | Tamanho |
|---------|-----------|---------|
| `01-resumo-rapido.md` | Cheat sheet para consulta rápida | 2 KB |
| `02-documentacao-completa.md` | Documentação técnica organizada | 23 KB |
| `03-metodos-detalhados.md` | Todos os 139 métodos com parâmetros | 308 KB |
| `04-exemplos-praticos.md` | Exemplos de código TypeScript/cURL | 16 KB |
| `05-analise-gap-modelo-dados.md` | Tabelas necessárias no Planac | 10 KB |

## 🔗 Informações Gerais

- **Endpoint:** `https://api.baselinker.com/connector.php`
- **Método:** POST
- **Header:** `X-BLToken: {token}`
- **Limite:** 100 requisições/minuto
- **Última atualização API:** 21/10/2025

## 🔑 Credenciais Planac (Teste)

```
Token: 8003146-8033898-532H6155RLJVRTS9GX0RKTKI8IO74JQ9PPAL391UOJZ9VGTP8QAT5N42HZMPC5IQ
Inventory ID: 47551
Price Group ID: 47607
Warehouse ID: bl_53659
```

## 🎯 Propósito

O Baselinker será o HUB central de integração entre o ERP Planac e os marketplaces:
- Mercado Livre
- Amazon
- Shopee
- Outros marketplaces B2B/B2C

## 📊 Total de Métodos Documentados

| Categoria | Qtd |
|-----------|-----|
| Product Catalog | 29 |
| Orders | 34 |
| Courier Shipments | 15 |
| Order Returns | 16 |
| Inventory Documents | 6 |
| Purchase Orders | 6 |
| Suppliers/Payers | 6 |
| External Storages | 7 |
| Base Connect | 4 |
| Printouts | 2 |
| Products Storage [OBSOLETE] | 14 |
| **TOTAL** | **139** |

## 🔄 Fluxo de Integração

```
PLANAC ERP ──────► BASELINKER ──────► MARKETPLACES
(produtos)        (hub central)      (ML, Amazon, Shopee)

MARKETPLACES ────► BASELINKER ──────► PLANAC ERP
(vendas)          (consolida)        (pedidos)
```

## 📁 Tabelas Necessárias no Planac

1. **integracoes_canais** - Configuração de conexões
2. **integracoes_mapeamento** - Mapeamento de IDs
3. **integracoes_log** - Auditoria de sincronizações

---
*Documentação gerada em 08/12/2025 pela DEV.com*
