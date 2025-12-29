# 📚 BASELINKER API - DOCUMENTAÇÃO TÉCNICA COMPLETA v2.0

> **Data:** 08/12/2025  
> **Total de Métodos:** 139  
> **Última Atualização API:** 21/10/2025  
> **Limite:** 100 requisições/minuto  
> **Encoding:** UTF-8  

---

## 📋 ÍNDICE

1. [Autenticação e Configuração](#1-autenticação-e-configuração)
2. [Product Catalog (29 métodos)](#2-product-catalog)
3. [Inventory Documents (6 métodos)](#3-inventory-documents)
4. [Inventory Purchase Orders (6 métodos)](#4-inventory-purchase-orders)
5. [Inventory Suppliers (3 métodos)](#5-inventory-suppliers)
6. [Inventory Payers (3 métodos)](#6-inventory-payers)
7. [External Storages (7 métodos)](#7-external-storages)
8. [Orders (34 métodos)](#8-orders)
9. [Order Returns (16 métodos)](#9-order-returns)
10. [Courier Shipments (15 métodos)](#10-courier-shipments)
11. [Products Storage OBSOLETE (14 métodos)](#11-products-storage-obsolete)
12. [Printouts (2 métodos)](#12-printouts)
13. [Base Connect (4 métodos)](#13-base-connect)

---

## 1. AUTENTICAÇÃO E CONFIGURAÇÃO

### Endpoint
```
POST https://api.baselinker.com/connector.php
```

### Headers
```
X-BLToken: {seu_token}
Content-Type: application/x-www-form-urlencoded
```

### Formato Requisição
```
method={nome_metodo}&parameters={json_parameters}
```

### Exemplo cURL
```bash
curl 'https://api.baselinker.com/connector.php' \
  -H 'X-BLToken: 1-23-ABC' \
  --data-raw 'method=getOrders&parameters={"date_from":1407341754}'
```

### Credenciais Planac (Teste)
```
Token: 8003146-8033898-532H6155RLJVRTS9GX0RKTKI8IO74JQ9PPAL391UOJZ9VGTP8QAT5N42HZMPC5IQ
Inventory ID: 47551
Price Group ID: 47607
Warehouse ID: bl_53659
```

---

## 2. PRODUCT CATALOG

### 2.1 Grupos de Preço

| Método | Descrição |
|--------|-----------|
| `addInventoryPriceGroup` | Criar/atualizar grupo de preço |
| `deleteInventoryPriceGroup` | Remover grupo de preço |
| `getInventoryPriceGroups` | Listar grupos de preço |

#### getInventoryPriceGroups
**Input:** Nenhum parâmetro obrigatório

**Output:**
```json
{
  "status": "SUCCESS",
  "price_groups": {
    "105": {
      "price_group_id": 105,
      "name": "Preço Varejo",
      "description": "Tabela para clientes finais",
      "currency": "BRL",
      "is_default": true
    }
  }
}
```

---

### 2.2 Armazéns

| Método | Descrição |
|--------|-----------|
| `addInventoryWarehouse` | Criar/atualizar armazém |
| `deleteInventoryWarehouse` | Remover armazém |
| `getInventoryWarehouses` | Listar armazéns |

#### getInventoryWarehouses
**Output:**
```json
{
  "status": "SUCCESS",
  "warehouses": {
    "bl_206": {
      "warehouse_id": 206,
      "name": "Armazém Principal",
      "description": "Matriz Curitiba",
      "stock_edition": true,
      "is_default": true
    }
  }
}
```

---

### 2.3 Catálogos (Inventories)

| Método | Descrição |
|--------|-----------|
| `addInventory` | Criar/atualizar catálogo |
| `deleteInventory` | Remover catálogo |
| `getInventories` | Listar catálogos |

#### getInventories
**Output:**
```json
{
  "status": "SUCCESS",
  "inventories": [
    {
      "inventory_id": 307,
      "name": "Catálogo Principal",
      "description": "Produtos Drywall",
      "languages": ["pt", "en"],
      "default_language": "pt",
      "price_groups": [105, 106],
      "default_price_group": 105,
      "warehouses": ["bl_206", "bl_207"],
      "default_warehouse": "bl_206",
      "reservations": true
    }
  ]
}
```

---

### 2.4 Categorias

| Método | Descrição |
|--------|-----------|
| `addInventoryCategory` | Criar/atualizar categoria |
| `deleteInventoryCategory` | Remover categoria |
| `getInventoryCategories` | Listar categorias |

#### addInventoryCategory
**Input:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| inventory_id | varchar(30) | Sim | ID do catálogo |
| category_id | int | Não | ID para atualização |
| name | varchar(200) | Sim | Nome da categoria |
| parent_id | int | Não | ID da categoria pai |

**Output:**
```json
{
  "status": "SUCCESS",
  "category_id": 145
}
```

---

### 2.5 Fabricantes

| Método | Descrição |
|--------|-----------|
| `addInventoryManufacturer` | Criar/atualizar fabricante |
| `deleteInventoryManufacturer` | Remover fabricante |
| `getInventoryManufacturers` | Listar fabricantes |

#### addInventoryManufacturer
**Input:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| manufacturer_id | int | Não | ID para atualização |
| name | varchar(200) | Sim | Nome do fabricante |

---

### 2.6 Produtos

| Método | Descrição | Crítico |
|--------|-----------|---------|
| `addInventoryProduct` | Criar/atualizar produto | ⭐ |
| `deleteInventoryProduct` | Remover produto | |
| `getInventoryProductsData` | Dados detalhados (por IDs) | ⭐ |
| `getInventoryProductsList` | Listagem básica | ⭐ |
| `getInventoryProductsStock` | Apenas estoques | |
| `updateInventoryProductsStock` | Atualizar estoques (bulk 1000) | ⭐ |
| `getInventoryProductsPrices` | Apenas preços | |
| `updateInventoryProductsPrices` | Atualizar preços (bulk 1000) | ⭐ |
| `getInventoryProductLogs` | Histórico de alterações | |
| `runProductMacroTrigger` | Executar macro em produto | |

#### addInventoryProduct (PRINCIPAL)
**Input Completo:**
```json
{
  "inventory_id": "307",
  "product_id": "2685",
  "parent_id": "",
  "is_bundle": false,
  "sku": "PLACA-ST-1200X2400",
  "ean": "7891234567890",
  "ean_additional": [
    {"ean": "7891234567891", "quantity": 4},
    {"ean": "7891234567892", "quantity": 8}
  ],
  "asin": "B07EXAMPLE1",
  "tags": ["Drywall", "Placa"],
  "tax_rate": 18,
  "weight": 25.5,
  "height": 240,
  "width": 120,
  "length": 1.25,
  "average_cost": 45.90,
  "star": 2,
  "manufacturer_id": 5,
  "category_id": 3,
  "prices": {
    "47607": 89.90,
    "47608": 85.00
  },
  "stock": {
    "bl_53659": 150,
    "bl_53660": 75
  },
  "locations": {
    "bl_53659": "A-01-03",
    "bl_53660": "B-02-01"
  },
  "text_fields": {
    "name": "Placa de Gesso Standard 1200x2400mm",
    "description": "Placa de gesso para drywall...",
    "description_extra1": "Ficha técnica completa",
    "features": {
      "Espessura": "12.5mm",
      "Tipo": "Standard",
      "Aplicação": "Áreas secas"
    },
    "name|en": "Standard Gypsum Board 1200x2400mm"
  },
  "images": {
    "0": "url:https://planac.com.br/img/placa-st.jpg",
    "1": "url:https://planac.com.br/img/placa-st-2.jpg"
  },
  "links": {
    "shop_23": {
      "product_id": "8",
      "variant_id": "3"
    }
  },
  "bundle_products": {}
}
```

**Campos de tax_rate especiais:**
- `0-100`: Alíquota normal
- `-1`: Isento (EXPT/ZW)
- `-0.02`: NP
- `-0.03`: OO (Reverse charge)

**Output:**
```json
{
  "status": "SUCCESS",
  "product_id": 2685,
  "warnings": {}
}
```

#### getInventoryProductsList
**Input:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| inventory_id | varchar(30) | ID do catálogo |
| filter_id | int | Filtrar por ID |
| filter_category_id | int | Filtrar por categoria |
| filter_ean | varchar | Filtrar por EAN |
| filter_sku | varchar | Filtrar por SKU |
| filter_name | varchar | Filtrar por nome |
| filter_price_from | float | Preço mínimo |
| filter_price_to | float | Preço máximo |
| filter_stock_from | int | Estoque mínimo |
| filter_stock_to | int | Estoque máximo |
| filter_sort | varchar | Ordenação |
| page | int | Página |

**Output:**
```json
{
  "status": "SUCCESS",
  "products": {
    "2685": {
      "id": 2685,
      "sku": "PLACA-ST-1200X2400",
      "ean": "7891234567890",
      "name": "Placa de Gesso Standard",
      "prices": {"47607": 89.90},
      "stock": {"bl_53659": 150}
    }
  }
}
```

#### updateInventoryProductsStock (BULK)
**Input:**
```json
{
  "inventory_id": "307",
  "products": {
    "2685": {
      "bl_53659": 150,
      "bl_53660": 75
    },
    "2686": {
      "bl_53659": 200
    }
  }
}
```

**Limites:**
- Máximo 1000 produtos por requisição

---

### 2.7 Outros Métodos de Catálogo

| Método | Descrição |
|--------|-----------|
| `getInventoryTags` | Listar tags disponíveis |
| `getInventoryExtraFields` | Campos extras do produto |
| `getInventoryIntegrations` | Integrações disponíveis |
| `getInventoryAvailableTextFieldKeys` | Chaves de campos texto |

---

## 3. INVENTORY DOCUMENTS

Documentos de movimentação de estoque (entrada, saída, transferência).

| Método | Descrição |
|--------|-----------|
| `addInventoryDocument` | Criar documento (rascunho) |
| `setInventoryDocumentStatusConfirmed` | Confirmar documento |
| `getInventoryDocuments` | Listar documentos |
| `getInventoryDocumentItems` | Itens do documento |
| `addInventoryDocumentItems` | Adicionar itens |
| `getInventoryDocumentSeries` | Séries de numeração |

#### addInventoryDocument
**Input:**
```json
{
  "document_type": "mm",
  "warehouse_id": "bl_206",
  "contra_warehouse_id": "bl_207",
  "date": 1699999999,
  "description": "Transferência entre filiais",
  "series_id": 1
}
```

**Tipos de documento:**
- `mm`: Transferência (requer contra_warehouse_id)
- `pz`: Entrada (compra)
- `wz`: Saída (venda)

---

## 4. INVENTORY PURCHASE ORDERS

Ordens de compra para fornecedores.

| Método | Descrição |
|--------|-----------|
| `getInventoryPurchaseOrders` | Listar ordens de compra |
| `getInventoryPurchaseOrderItems` | Itens da ordem |
| `getInventoryPurchaseOrderSeries` | Séries de numeração |
| `addInventoryPurchaseOrder` | Criar ordem de compra |
| `addInventoryPurchaseOrderItems` | Adicionar itens |
| `setInventoryPurchaseOrderStatus` | Alterar status |

---

## 5. INVENTORY SUPPLIERS

| Método | Descrição |
|--------|-----------|
| `getInventorySuppliers` | Listar fornecedores |
| `addInventorySupplier` | Criar/atualizar fornecedor |
| `deleteInventorySupplier` | Remover fornecedor |

---

## 6. INVENTORY PAYERS

| Método | Descrição |
|--------|-----------|
| `getInventoryPayers` | Listar pagadores |
| `addInventoryPayer` | Criar/atualizar pagador |
| `deleteInventoryPayer` | Remover pagador |

---

## 7. EXTERNAL STORAGES

Conexão com lojas externas e atacadistas.

| Método | Descrição |
|--------|-----------|
| `getExternalStoragesList` | Listar storages externos |
| `getExternalStorageCategories` | Categorias do storage |
| `getExternalStorageProductsData` | Dados de produtos |
| `getExternalStorageProductsList` | Lista de produtos |
| `getExternalStorageProductsQuantity` | Estoques |
| `getExternalStorageProductsPrices` | Preços |
| `updateExternalStorageProductsQuantity` | Atualizar estoques |

---

## 8. ORDERS

### 8.1 Métodos Principais

| Método | Descrição | Crítico |
|--------|-----------|---------|
| `getOrders` | Buscar pedidos | ⭐ |
| `addOrder` | Criar pedido | ⭐ |
| `setOrderStatus` | Alterar status | ⭐ |
| `setOrderStatuses` | Alterar status em lote | |
| `setOrderFields` | Editar campos do pedido | |
| `getOrderStatusList` | Listar status disponíveis | ⭐ |
| `getOrderSources` | Listar origens (marketplaces) | ⭐ |

#### getOrders (PRINCIPAL)
**Input:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| order_id | int | ID específico |
| date_confirmed_from | int | Data confirmação (unix) |
| date_from | int | Data criação (unix) |
| id_from | int | ID inicial para paginação |
| get_unconfirmed_orders | bool | Incluir não confirmados (false) |
| status_id | int | Filtrar por status |
| filter_email | varchar | Filtrar por email |
| filter_order_source | varchar | Filtrar por origem |
| filter_order_source_id | int | ID da origem |
| include_custom_extra_fields | bool | Incluir campos extras |
| include_commission_data | bool | Incluir comissões |

**Output Completo:**
```json
{
  "status": "SUCCESS",
  "orders": [
    {
      "order_id": 1630473,
      "shop_order_id": 2824,
      "external_order_id": "MLB123456789",
      "order_source": "mercadolivre",
      "order_source_id": 2598,
      "order_status_id": 299122,
      "date_add": 1407841161,
      "date_confirmed": 1407841256,
      "date_in_status": 1407841256,
      "confirmed": true,
      "user_login": "comprador123",
      "currency": "BRL",
      "payment_method": "Mercado Pago",
      "payment_method_cod": "0",
      "payment_done": 289.70,
      "user_comments": "Entregar pela manhã",
      "admin_comments": "Cliente VIP",
      "email": "cliente@email.com",
      "phone": "41999998888",
      "delivery_method_id": 15,
      "delivery_method": "Transportadora",
      "delivery_price": 25.00,
      "delivery_package_module": "correios",
      "delivery_package_nr": "BR123456789BR",
      "delivery_fullname": "João da Silva",
      "delivery_company": "Silva Construções",
      "delivery_address": "Rua das Flores, 123",
      "delivery_postcode": "80000-000",
      "delivery_city": "Curitiba",
      "delivery_state": "PR",
      "delivery_country": "Brazil",
      "delivery_country_code": "BR",
      "delivery_point_id": "",
      "delivery_point_name": "",
      "invoice_fullname": "Silva Construções LTDA",
      "invoice_company": "Silva Construções LTDA",
      "invoice_nip": "12.345.678/0001-90",
      "invoice_address": "Rua das Flores, 123",
      "invoice_postcode": "80000-000",
      "invoice_city": "Curitiba",
      "invoice_country": "Brazil",
      "invoice_country_code": "BR",
      "want_invoice": "1",
      "extra_field_1": "",
      "extra_field_2": "",
      "pick_state": 1,
      "pack_state": 0,
      "commission": {
        "net": 15.50,
        "gross": 18.76,
        "currency": "BRL"
      },
      "products": [
        {
          "storage": "db",
          "storage_id": 0,
          "order_product_id": 154904741,
          "product_id": "2685",
          "variant_id": 0,
          "name": "Placa de Gesso Standard 1200x2400mm",
          "attributes": "",
          "sku": "PLACA-ST-1200X2400",
          "ean": "7891234567890",
          "location": "A-01-03",
          "warehouse_id": 53659,
          "auction_id": "0",
          "price_brutto": 89.90,
          "tax_rate": 18,
          "quantity": 3,
          "weight": 25.5,
          "bundle_id": 0
        }
      ]
    }
  ]
}
```

#### addOrder
**Input Completo:**
```json
{
  "order_status_id": 299122,
  "custom_source_id": 1,
  "date_add": 1699999999,
  "currency": "BRL",
  "payment_method": "Boleto",
  "payment_method_cod": false,
  "paid": true,
  "user_comments": "Entregar pela manhã",
  "admin_comments": "Pedido via sistema Planac",
  "email": "cliente@email.com",
  "phone": "41999998888",
  "user_login": "",
  "delivery_method": "Transportadora Própria",
  "delivery_price": 25.00,
  "delivery_fullname": "João da Silva",
  "delivery_company": "Silva Construções",
  "delivery_address": "Rua das Flores, 123",
  "delivery_postcode": "80000-000",
  "delivery_city": "Curitiba",
  "delivery_state": "PR",
  "delivery_country_code": "BR",
  "invoice_fullname": "Silva Construções LTDA",
  "invoice_company": "Silva Construções LTDA",
  "invoice_nip": "12.345.678/0001-90",
  "invoice_address": "Rua das Flores, 123",
  "invoice_postcode": "80000-000",
  "invoice_city": "Curitiba",
  "invoice_country_code": "BR",
  "want_invoice": true,
  "products": [
    {
      "storage": "db",
      "storage_id": 0,
      "product_id": "2685",
      "variant_id": 0,
      "name": "Placa de Gesso Standard",
      "sku": "PLACA-ST-1200X2400",
      "ean": "7891234567890",
      "location": "A-01-03",
      "warehouse_id": 53659,
      "price_brutto": 89.90,
      "tax_rate": 18,
      "quantity": 3,
      "weight": 25.5
    }
  ]
}
```

**Output:**
```json
{
  "status": "SUCCESS",
  "order_id": 16331079
}
```

---

### 8.2 Produtos do Pedido

| Método | Descrição |
|--------|-----------|
| `addOrderProduct` | Adicionar produto ao pedido |
| `setOrderProductFields` | Editar produto do pedido |
| `deleteOrderProduct` | Remover produto do pedido |

---

### 8.3 Pagamentos

| Método | Descrição |
|--------|-----------|
| `setOrderPayment` | Registrar pagamento |
| `getOrderPaymentsHistory` | Histórico de pagamentos |
| `getOrderTransactionData` | Dados da transação |

---

### 8.4 Notas Fiscais

| Método | Descrição |
|--------|-----------|
| `addInvoice` | Emitir nota fiscal |
| `addInvoiceCorrection` | Emitir correção |
| `getInvoices` | Listar notas |
| `getInvoiceFile` | Download da nota |
| `addOrderInvoiceFile` | Anexar nota externa |
| `getSeries` | Séries de numeração |

---

### 8.5 Recibos

| Método | Descrição |
|--------|-----------|
| `getNewReceipts` | Recibos pendentes (impressora fiscal) |
| `getReceipts` | Listar recibos emitidos |
| `getReceipt` | Buscar recibo específico |
| `setOrderReceipt` | Marcar como emitido |
| `addOrderReceiptFile` | Anexar recibo externo |

---

### 8.6 Outros

| Método | Descrição |
|--------|-----------|
| `getJournalList` | Eventos de pedidos (3 dias) |
| `addOrderDuplicate` | Duplicar pedido |
| `addOrderBySplit` | Dividir pedido |
| `setOrdersMerge` | Mesclar pedidos |
| `deleteOrders` | Remover pedidos |
| `getOrdersByEmail` | Buscar por email |
| `getOrdersByPhone` | Buscar por telefone |
| `getOrderExtraFields` | Campos extras disponíveis |
| `getOrderPickPackHistory` | Histórico pick/pack |
| `runOrderMacroTrigger` | Executar macro |

---

## 9. ORDER RETURNS

Gestão de devoluções.

| Método | Descrição |
|--------|-----------|
| `addOrderReturn` | Criar devolução |
| `getOrderReturns` | Listar devoluções |
| `getOrderReturnStatusList` | Status disponíveis |
| `setOrderReturnStatus` | Alterar status |
| `setOrderReturnStatuses` | Alterar em lote |
| `setOrderReturnFields` | Editar campos |
| `addOrderReturnProduct` | Adicionar produto |
| `setOrderReturnProductFields` | Editar produto |
| `deleteOrderReturnProduct` | Remover produto |
| `setOrderReturnRefund` | Marcar reembolso |
| `getOrderReturnReasonsList` | Motivos de devolução |
| `getOrderReturnProductStatuses` | Status de produtos |
| `getOrderReturnExtraFields` | Campos extras |
| `getOrderReturnPaymentsHistory` | Histórico pagamentos |
| `getOrderReturnJournalList` | Eventos (3 dias) |
| `runOrderReturnMacroTrigger` | Executar macro |

---

## 10. COURIER SHIPMENTS

Integração com transportadoras.

### 10.1 Métodos Principais

| Método | Descrição | Crítico |
|--------|-----------|---------|
| `createPackage` | Criar remessa | ⭐ |
| `createPackageManual` | Registrar remessa manual | |
| `getCouriersList` | Listar transportadoras | ⭐ |
| `getCourierFields` | Campos do formulário | ⭐ |
| `getCourierAccounts` | Contas configuradas | |
| `getCourierServices` | Serviços adicionais | |
| `getLabel` | Download etiqueta | ⭐ |
| `getProtocol` | Download protocolo | |

#### createPackage
**Input:**
```json
{
  "order_id": 6910995,
  "courier_code": "correios",
  "account_id": 33,
  "fields": [
    {"id": "service", "value": "sedex"},
    {"id": "cod", "value": "0"},
    {"id": "insurance", "value": "289.70"},
    {"id": "package_description", "value": "Material construção"}
  ],
  "packages": [
    {
      "weight": 25.5,
      "length": 240,
      "height": 120,
      "width": 5
    }
  ]
}
```

**Output:**
```json
{
  "status": "SUCCESS",
  "package_id": 12345,
  "package_number": "BR123456789BR",
  "courier_inner_number": "ABC123"
}
```

#### getLabel
**Input:**
```json
{
  "courier_code": "correios",
  "package_id": 12345,
  "package_number": "BR123456789BR"
}
```

**Output:** PDF em base64

---

### 10.2 Outros Métodos

| Método | Descrição |
|--------|-----------|
| `getCourierDocument` | Download documento |
| `getOrderPackages` | Remessas do pedido |
| `getPackageDetails` | Detalhes da remessa |
| `getCourierPackagesStatusHistory` | Histórico de status |
| `deleteCourierPackage` | Cancelar remessa |
| `runRequestParcelPickup` | Solicitar coleta |
| `getRequestParcelPickupFields` | Campos de coleta |

---

## 11. PRODUCTS STORAGE [OBSOLETE]

> ⚠️ **OBSOLETO** - Use os métodos de Product Catalog

| Método | Substituto |
|--------|------------|
| `getStoragesList` | `getInventories` |
| `addCategory` | `addInventoryCategory` |
| `addProduct` | `addInventoryProduct` |
| `addProductVariant` | `addInventoryProduct` (parent_id) |
| `deleteCategory` | `deleteInventoryCategory` |
| `deleteProduct` | `deleteInventoryProduct` |
| `getCategories` | `getInventoryCategories` |
| `getProductsData` | `getInventoryProductsData` |
| `getProductsList` | `getInventoryProductsList` |
| `getProductsQuantity` | `getInventoryProductsStock` |
| `getProductsPrices` | `getInventoryProductsPrices` |
| `updateProductsQuantity` | `updateInventoryProductsStock` |
| `updateProductsPrices` | `updateInventoryProductsPrices` |

---

## 12. PRINTOUTS

Templates de impressão configurados.

| Método | Descrição |
|--------|-----------|
| `getOrderPrintoutTemplates` | Templates de pedidos |
| `getInventoryPrintoutTemplates` | Templates de produtos |

---

## 13. BASE CONNECT

Integração B2B entre empresas.

| Método | Descrição |
|--------|-----------|
| `getConnectIntegrations` | Listar integrações |
| `getConnectIntegrationContractors` | Listar parceiros |
| `getConnectContractorCreditHistory` | Histórico de crédito |
| `setConnectContractorCreditLimit` | Definir limite |

---

## APÊNDICE A: CÓDIGOS DE ERRO

| Código | Descrição |
|--------|-----------|
| `ERROR_NO_TOKEN` | Token não fornecido |
| `ERROR_INVALID_TOKEN` | Token inválido |
| `ERROR_ACCOUNT_BLOCKED` | Conta bloqueada |
| `ERROR_METHOD_NOT_FOUND` | Método não existe |
| `ERROR_INVALID_PARAMETERS` | Parâmetros inválidos |
| `ERROR_REQUEST_LIMIT` | Limite de requisições |
| `ERROR_INTERNAL` | Erro interno |

---

## APÊNDICE B: TRANSPORTADORAS BRASILEIRAS

| Código | Nome |
|--------|------|
| `correios` | Correios |
| `melhorenvio` | Melhor Envio |
| `mandae` | Mandaê |
| `jadlog` | JadLog |
| `loggi` | Loggi |
| `tnt` | TNT/FedEx |
| `azul` | Azul Cargo |
| `latam` | LATAM Cargo |
| `totalexpress` | Total Express |
| `sequoia` | Sequoia |
| `braspress` | Braspress |
| `rodonaves` | Rodonaves |

---

## APÊNDICE C: FLUXOS DE INTEGRAÇÃO PLANAC

### Sincronização de Produtos (Planac → Baselinker)
```
1. getInventoryCategories → Verificar/criar categorias
2. getInventoryManufacturers → Verificar/criar fabricantes
3. addInventoryProduct → Criar/atualizar produtos
4. updateInventoryProductsStock → Sincronizar estoques
5. updateInventoryProductsPrices → Sincronizar preços
```

### Importação de Pedidos (Baselinker → Planac)
```
1. getOrders (date_confirmed_from) → Buscar novos pedidos
2. Para cada pedido:
   - Mapear cliente (CPF/CNPJ)
   - Mapear produtos (SKU)
   - Criar pedido no Planac
3. setOrderStatus → Confirmar processamento
```

### Atualização de Estoque em Tempo Real
```
1. Movimento no Planac (venda, compra, transferência)
2. Trigger → Chamar updateInventoryProductsStock
3. Baselinker propaga para marketplaces
```

---

**Documento gerado em:** 08/12/2025  
**Para o projeto:** Planac ERP  
**Desenvolvido por:** DEV.com
