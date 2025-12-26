# ⚡ BASELINKER API - RESUMO RÁPIDO

## Conexão
```bash
curl 'https://api.baselinker.com/connector.php' \
  -H 'X-BLToken: SEU_TOKEN' \
  --data-raw 'method=METODO&parameters={"param":"valor"}'
```

## Planac (Teste)
- **Token:** 8003146-8033898-532H6155RLJVRTS9GX0RKTKI8IO74JQ9PPAL391UOJZ9VGTP8QAT5N42HZMPC5IQ
- **Inventory:** 47551
- **Price Group:** 47607
- **Warehouse:** bl_53659

## 📊 Métodos Mais Usados

### Produtos
| Método | Uso |
|--------|-----|
| `getInventories` | Listar catálogos |
| `addInventoryProduct` | Criar/editar produto |
| `getInventoryProductsList` | Listar produtos |
| `updateInventoryProductsStock` | Atualizar estoque (1000/vez) |
| `updateInventoryProductsPrices` | Atualizar preços (1000/vez) |

### Pedidos
| Método | Uso |
|--------|-----|
| `getOrders` | Importar pedidos (100/vez) |
| `addOrder` | Criar pedido |
| `setOrderStatus` | Alterar status |
| `getOrderStatusList` | Listar status |
| `getOrderSources` | Listar marketplaces |

### Transportadoras
| Método | Uso |
|--------|-----|
| `getCouriersList` | Listar transportadoras |
| `createPackage` | Criar remessa |
| `getLabel` | Baixar etiqueta |

## 🔄 Fluxo Típico

### Planac → Baselinker (Produtos)
```
1. addInventoryCategory → Criar categorias
2. addInventoryManufacturer → Criar fabricantes  
3. addInventoryProduct → Criar produtos
4. updateInventoryProductsStock → Atualizar estoques
```

### Baselinker → Planac (Pedidos)
```
1. getOrders (date_confirmed_from) → Buscar novos
2. Mapear cliente + produtos
3. Criar no Planac
4. setOrderStatus → Confirmar
```

## 📦 Limites
- 100 requisições/minuto
- 100 pedidos por getOrders
- 1000 produtos por update de estoque/preço
- 16 imagens por produto

## 🇧🇷 Transportadoras BR
correios, melhorenvio, mandae, jadlog, loggi, tnt, azul, latam, totalexpress, sequoia, braspress, rodonaves

---
**139 métodos documentados** | Veja documentação completa nos outros arquivos
