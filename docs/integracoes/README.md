# 🔗 Integrações Externas - ERP PLANAC

Documentação completa das integrações externas do sistema.

**Status: ✅ Completo**  
**Última Atualização:** 14/12/2025  
**Total de Integrações:** 11

---

## Índice

| # | Integração | Tipo | Status | Prioridade |
|---|------------|------|--------|------------|
| 1 | [Nuvem Fiscal](#1-nuvem-fiscal) | Fiscal | ✅ Configurado | Alta |
| 2 | [Nuvemshop](#2-nuvemshop) | E-Commerce | ✅ Documentado | Alta |
| 3 | [CPF.CNPJ](#3-cpfcnpj) | Validação Docs | ✅ Documentado | Alta |
| 4 | [CNPJá](#4-cnpjá) | Consulta CNPJ | ✅ Documentado | Média |
| 5 | [SERPRO Integra Contador](#5-serpro-integra-contador) | Dados Fiscais | ✅ Documentado | Média |
| 6 | [SERPRO Consulta Renda](#6-serpro-consulta-renda) | Análise Crédito | ✅ Documentado | Baixa |
| 7 | [SERPRO Consulta Faturamento](#7-serpro-consulta-faturamento) | Análise Crédito | ✅ Documentado | Baixa |
| 8 | [IBPT - De Olho no Imposto](#8-ibpt---de-olho-no-imposto) | Tributário | ✅ Documentado | Alta |
| 9 | [Bluesoft Cosmos](#9-bluesoft-cosmos) | Catálogo Produtos | ✅ Documentado | Alta |
| 10 | [API Brasil](#10-api-brasil) | Análise Crédito + WhatsApp | ✅ Documentado | Alta |

---

# 1. NUVEM FISCAL

## 1.1 Visão Geral

| Item | Descrição |
|------|-----------|
| **Fornecedor** | Nuvem Fiscal |
| **Site** | https://www.nuvemfiscal.com.br |
| **Documentação** | https://dev.nuvemfiscal.com.br/docs |
| **Tipo** | API REST |
| **Autenticação** | OAuth 2.0 (Client Credentials) |

## 1.2 Credenciais de Acesso

| Ambiente | Client ID | Client Secret |
|----------|-----------|---------------|
| **Produção** | \`AJReDlHes8aBNlTzTF9X\` | \`3yMYNk2hzBLQihujZf0jfFyAKDRc403v4D1SBDFL\` |

> ⚠️ **IMPORTANTE:** As credenciais acima são sensíveis. Em produção, devem ser armazenadas como secrets no Cloudflare Workers.

## 1.3 Endpoints Base

| Ambiente | URL |
|----------|-----|
| Produção | \`https://api.nuvemfiscal.com.br\` |
| Sandbox | \`https://api.sandbox.nuvemfiscal.com.br\` |

## 1.4 Serviços Utilizados

| Serviço | Descrição | Uso no Planac |
|---------|-----------|---------------|
| **NF-e** | Nota Fiscal Eletrônica | Vendas B2B |
| **NFC-e** | Nota Fiscal Consumidor | PDV / Varejo |
| **NFS-e** | Nota Fiscal de Serviço | Serviços |
| **CT-e** | Conhecimento de Transporte | Frete próprio |
| **MDF-e** | Manifesto de Documentos | Expedição |

## 1.5 Fluxo de Autenticação

\`\`\`bash
# Obter token de acesso
curl -X POST "https://api.nuvemfiscal.com.br/oauth/token" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials" \\
  -d "client_id=AJReDlHes8aBNlTzTF9X" \\
  -d "client_secret=3yMYNk2hzBLQihujZf0jfFyAKDRc403v4D1SBDFL"
\`\`\`

## 1.6 Módulos do Planac que Utilizam

- **Faturamento** - Emissão de NF-e e NFC-e
- **PDV** - Emissão de NFC-e
- **Serviços** - Emissão de NFS-e
- **Expedição** - Emissão de CT-e e MDF-e

---

# 2. NUVEMSHOP

## 2.1 Visão Geral

| Item | Descrição |
|------|-----------|
| **Fornecedor** | Nuvemshop (Brasil) / Tiendanube (LATAM) |
| **Site** | https://www.nuvemshop.com.br |
| **Documentação** | https://dev.nuvemshop.com.br/docs |
| **API Reference** | https://tiendanube.github.io/api-documentation |
| **Tipo** | API REST |
| **Autenticação** | OAuth 2.0 (Authorization Code) |

## 2.2 O que é a Nuvemshop

A **Nuvemshop** é a maior plataforma de e-commerce da América Latina, com mais de 120.000 lojas ativas. Para o ERP Planac, a integração permite:

| Funcionalidade | Benefício |
|----------------|-----------|
| **Sincronização de Produtos** | Catálogo unificado ERP ↔ Loja Virtual |
| **Importação de Pedidos** | Pedidos da loja viram vendas no ERP automaticamente |
| **Sincronização de Estoque** | Estoque sempre atualizado em tempo real |
| **Gestão de Clientes** | Base de clientes unificada |
| **Emissão de NF-e** | Faturamento integrado via Planac |

## 2.3 Credenciais de Acesso

> ⚠️ **IMPORTANTE:** As credenciais são obtidas após criação do app no Portal de Parceiros Nuvemshop.

| Item | Descrição |
|------|-----------|
| **App ID** | ID do aplicativo (obtido no portal) |
| **Client Secret** | Chave secreta do app |
| **Access Token** | Token OAuth obtido após instalação na loja |
| **User ID (Store ID)** | ID da loja conectada |

## 2.4 Endpoints Base

| Região | URL |
|--------|-----|
| Brasil | \`https://api.nuvemshop.com.br/v1/{store_id}\` |
| LATAM | \`https://api.tiendanube.com/v1/{store_id}\` |

## 2.5 Fluxo de Autenticação OAuth 2.0

### Passo 1: Redirecionar usuário para autorização
\`\`\`
https://www.nuvemshop.com.br/apps/{app_id}/authorize
\`\`\`

### Passo 2: Usuário autoriza → Recebe código
O usuário é redirecionado para sua URL com \`?code=AUTHORIZATION_CODE\`

### Passo 3: Trocar código por Access Token
\`\`\`bash
curl -X POST "https://www.nuvemshop.com.br/apps/authorize/token" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "client_id={APP_ID}" \\
  -d "client_secret={CLIENT_SECRET}" \\
  -d "grant_type=authorization_code" \\
  -d "code={AUTHORIZATION_CODE}"
\`\`\`

**Resposta:**
\`\`\`json
{
  "access_token": "88a2fdd17e10327ed96f4f2dc96b00bca60dfe60",
  "token_type": "bearer",
  "scope": "write_products read_orders",
  "user_id": 123456
}
\`\`\`

> 💡 O \`access_token\` **não expira** até ser revogado ou o app desinstalado.

## 2.6 Recursos da API (Endpoints)

### 2.6.1 Produtos

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| \`/products\` | GET | Listar produtos |
| \`/products/{id}\` | GET | Detalhes do produto |
| \`/products\` | POST | Criar produto |
| \`/products/{id}\` | PUT | Atualizar produto |
| \`/products/{id}\` | DELETE | Excluir produto |
| \`/products/{id}/variants\` | GET | Listar variantes |
| \`/products/{id}/images\` | GET | Listar imagens |

**Exemplo - Listar Produtos:**
\`\`\`bash
curl "https://api.nuvemshop.com.br/v1/123456/products" \\
  -H "Authentication: bearer ACCESS_TOKEN" \\
  -H "User-Agent: Planac ERP (contato@planac.com.br)"
\`\`\`

### 2.6.2 Pedidos

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| \`/orders\` | GET | Listar pedidos |
| \`/orders/{id}\` | GET | Detalhes do pedido |
| \`/orders/{id}\` | PUT | Atualizar pedido |
| \`/orders/{id}/fulfill\` | POST | Marcar como enviado |
| \`/orders/{id}/close\` | POST | Fechar pedido |
| \`/orders/{id}/cancel\` | POST | Cancelar pedido |

### 2.6.3 Estoque

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| \`/products/{id}/variants/{variant_id}\` | PUT | Atualizar estoque |

### 2.6.4 Clientes

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| \`/customers\` | GET | Listar clientes |
| \`/customers/{id}\` | GET | Detalhes do cliente |
| \`/customers\` | POST | Criar cliente |
| \`/customers/{id}\` | PUT | Atualizar cliente |

### 2.6.5 Categorias

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| \`/categories\` | GET | Listar categorias |
| \`/categories/{id}\` | GET | Detalhes da categoria |
| \`/categories\` | POST | Criar categoria |

## 2.7 Webhooks

A Nuvemshop envia notificações em tempo real para eventos importantes:

| Evento | Descrição | Uso no Planac |
|--------|-----------|---------------|
| \`orders/created\` | Novo pedido | Importar como venda |
| \`orders/paid\` | Pedido pago | Liberar para faturamento |
| \`orders/packed\` | Pedido embalado | Atualizar status |
| \`orders/fulfilled\` | Pedido enviado | Registrar expedição |
| \`orders/cancelled\` | Pedido cancelado | Cancelar venda |
| \`products/created\` | Produto criado | Sincronizar catálogo |
| \`products/updated\` | Produto atualizado | Atualizar dados |
| \`products/deleted\` | Produto excluído | Inativar no ERP |

## 2.8 Fluxo de Integração com Planac

\`\`\`mermaid
graph TD
    A[Loja Nuvemshop] -->|Webhook: Novo Pedido| B[Planac API]
    B --> C{Pedido válido?}
    C -->|Sim| D[Criar Venda no Planac]
    D --> E[Verificar Estoque]
    E -->|OK| F[Separar Mercadoria]
    F --> G[Faturar NF-e]
    G --> H[Marcar como Enviado na Nuvemshop]
    H --> I[Atualizar Estoque na Nuvemshop]
\`\`\`

## 2.9 Mapeamento de Status

| Status Nuvemshop | Status Planac |
|------------------|---------------|
| \`open\` | Pendente |
| \`closed\` | Finalizado |
| \`cancelled\` | Cancelado |
| \`pending\` (payment) | Aguardando Pagamento |
| \`paid\` (payment) | Pago |
| \`unshipped\` (shipping) | Não Enviado |
| \`shipped\` (shipping) | Enviado |

## 2.10 Limites e Rate Limiting

| Limite | Valor |
|--------|-------|
| Requisições por minuto | 60 |
| Requisições por dia | 10.000 |
| Tamanho máximo payload | 1 MB |

## 2.11 Módulos do Planac que Utilizam

| Módulo | Uso |
|--------|-----|
| **E-commerce** | Importação de pedidos, sincronização |
| **Estoque** | Atualização de quantidades em tempo real |
| **Produtos** | Sincronização de catálogo |
| **Clientes** | Cadastro automático de clientes |
| **Faturamento** | Emissão de NF-e para pedidos |
| **Expedição** | Atualização de rastreamento |

---

# 3. CPF.CNPJ

## 3.1 Visão Geral

| Item | Descrição |
|------|-----------|
| **Fornecedor** | CPF.CNPJ |
| **Site** | https://www.cpfcnpj.com.br |
| **Documentação** | https://www.cpfcnpj.com.br/dev/ |
| **Tipo** | API REST |
| **Autenticação** | ID + Token |

## 3.2 Credenciais de Acesso

| Item | Valor |
|------|-------|
| **ID** | `JWXN` |
| **Token** | `fb2868083821ff14de07e91ebac9e959` |

## 3.3 Endpoints Disponíveis

| Endpoint | Descrição |
|----------|-----------|
| `/cpf/{cpf}` | Consulta dados de CPF |
| `/cnpj/{cnpj}` | Consulta dados de CNPJ |
| `/cep/{cep}` | Consulta endereço por CEP |

## 3.4 Módulos do Planac que Utilizam

- **Clientes** - Validação e preenchimento automático de cadastro PJ
- **Fornecedores** - Validação de CNPJ
- **Fiscal** - Validação antes de emissão de NF-e

---

# 4. CNPJá

## 4.1 Visão Geral

| Item | Descrição |
|------|-----------|
| **Fornecedor** | CNPJá |
| **Site** | https://cnpja.com |
| **Documentação** | https://cnpja.com/docs |
| **Tipo** | API REST |
| **Autenticação** | API Key |

## 4.2 Credenciais de Acesso

| Item | Valor |
|------|-------|
| **API Key** | `35f092ea-0922-4231-bc05-181aa4062731-11a1649b-2933-44ca-9d30-9c862a03ebb3` |

## 4.3 Endpoint Base

```
https://api.cnpja.com
```

## 4.4 Endpoints Disponíveis

| Endpoint | Descrição |
|----------|-----------|
| `GET /office/{cnpj}` | Consulta completa de CNPJ |
| `GET /office/{cnpj}/simples` | Consulta Simples Nacional |
| `GET /office/{cnpj}/sintegra/{uf}` | Consulta SINTEGRA |
| `GET /office/{cnpj}/suframa` | Consulta SUFRAMA |

## 4.5 Módulos do Planac que Utilizam

- **Clientes** - Cadastro enriquecido de PJ
- **Crédito** - Análise de cliente
- **Fiscal** - Validação de IE e regime tributário

---

# 5. SERPRO INTEGRA CONTADOR

## 5.1 Visão Geral

| Item | Descrição |
|------|-----------|
| **Fornecedor** | SERPRO |
| **Site** | https://servicos.serpro.gov.br |
| **Tipo** | API REST |
| **Autenticação** | OAuth 2.0 (Client Credentials) |

## 5.2 Credenciais de Acesso

| Item | Valor |
|------|-------|
| **Consumer Key** | `xulEzvzZKabUXeTQXNYPu9OZwkEa` |
| **Consumer Secret** | `tbquSwPldBI4A5fCv0ftqFmo_3Ma` |
| **Contrato** | `229986` |

## 5.3 Módulos do Planac que Utilizam

- **Fornecedores** - Validação fiscal
- **Contabilidade** - Consultas para contador

---

# 6. SERPRO CONSULTA RENDA

## 6.1 Visão Geral

| Item | Descrição |
|------|-----------|
| **Fornecedor** | SERPRO |
| **Tipo** | API REST |
| **Autenticação** | OAuth 2.0 |
| **Finalidade** | Análise de crédito pessoa física |

## 6.2 Credenciais de Acesso

| Item | Valor |
|------|-------|
| **Consumer Key** | `xulEzvzZKabUXeTQXNYPu9OZwkEa` |
| **Consumer Secret** | `tbquSwPldBI4A5fCv0ftqFmo_3Ma` |
| **Contrato** | `261076` |

## 6.3 Módulos do Planac que Utilizam

- **Crédito** - Análise de limite para pessoa física
- **Financeiro** - Score de risco

---

# 7. SERPRO CONSULTA FATURAMENTO

## 7.1 Visão Geral

| Item | Descrição |
|------|-----------|
| **Fornecedor** | SERPRO |
| **Tipo** | API REST |
| **Autenticação** | OAuth 2.0 |
| **Finalidade** | Análise de crédito pessoa jurídica |

## 7.2 Credenciais de Acesso

| Item | Valor |
|------|-------|
| **Consumer Key** | `xulEzvzZKabUXeTQXNYPu9OZwkEa` |
| **Consumer Secret** | `tbquSwPldBI4A5fCv0ftqFmo_3Ma` |
| **Contrato** | `261077` |

## 7.3 Módulos do Planac que Utilizam

- **Crédito** - Análise de limite para pessoa jurídica
- **Comercial** - Classificação de clientes

---

# 8. IBPT - DE OLHO NO IMPOSTO

## 8.1 Visão Geral

| Item | Descrição |
|------|-----------|
| **Fornecedor** | IBPT - Instituto Brasileiro de Planejamento Tributário |
| **Site** | https://deolhonoimposto.ibpt.org.br |
| **Tipo** | API REST |
| **Autenticação** | Token |

## 8.2 Credenciais de Acesso

| Item | Valor |
|------|-------|
| **Token** | `ePNBuMey5VZ0OCw3ihiQQUAc9EQkKAbN9-TlaoLqAf9rpQVQbgoTMuawhjF_pn_o` |

## 8.3 Base Legal

| Lei | Descrição |
|-----|-----------|
| **Lei 12.741/2012** | Lei da Transparência Fiscal |
| **Decreto 8.264/2014** | Regulamentação da Lei |

**Obrigatoriedade:** Vendas ao **consumidor final** (pessoa física ou jurídica para consumo próprio).

## 8.4 Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/v1/Produtos` | GET | Consulta alíquotas por NCM |
| `/api/v1/Servicos` | GET | Consulta alíquotas por NBS |

## 8.5 Exemplo de Requisição

```bash
curl "https://api.deolhonoimposto.ibpt.org.br/api/v1/Produtos?token=TOKEN&cnpj=12345678000190&codigo=68091100&uf=PR"
```

## 8.6 Módulos do Planac que Utilizam

| Módulo | Uso |
|--------|-----|
| **Faturamento** | Cálculo automático ao emitir NF-e/NFC-e |
| **PDV** | Exibição no cupom fiscal |
| **Produtos** | Armazenamento de alíquotas por NCM |

---

# 9. BLUESOFT COSMOS

## 9.1 Visão Geral

| Item | Descrição |
|------|-----------|
| **Fornecedor** | Bluesoft |
| **Site** | https://cosmos.bluesoft.com.br |
| **Documentação** | https://cosmos.bluesoft.com.br/api |
| **Tipo** | API REST |
| **Autenticação** | Token no Header |
| **Base de Dados** | +26 milhões de produtos cadastrados |

## 9.2 Credenciais de Acesso

| Item | Valor |
|------|-------|
| **Token** | `mK7UKgCycAPW1Nr_7QDkdw` |
| **Header** | `X-Cosmos-Token` |
| **User-Agent** | Obrigatório (ex: `Planac ERP (planac@email.com)`) |

## 9.3 Endpoint Base

```
https://api.cosmos.bluesoft.com.br
```

## 9.4 Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/gtins/{gtin}` | GET | Busca por código de barras |
| `/products?query={termo}` | GET | Busca por descrição |
| `/ncms/{ncm}/products` | GET | Lista produtos de um NCM |

## 9.5 Dados Retornados

| Campo API | Campo no Planac |
|-----------|-----------------|
| `gtin` | `produto.codigo_barras` |
| `description` | `produto.descricao` |
| `brand.name` | `produto.marca` |
| `ncm.code` | `produto.ncm` |
| `cest.code` | `produto.cest` |
| `gross_weight` | `produto.peso_bruto` |
| `thumbnail` | `produto.foto_url` |

## 9.6 Módulos do Planac que Utilizam

| Módulo | Uso |
|--------|-----|
| **Produtos** | Auto cadastro por código de barras |
| **Compras** | Validação de produtos recebidos |
| **Fiscal** | Obtenção automática de NCM e CEST |

---

# 10. API BRASIL

## 10.1 Visão Geral

| Item | Descrição |
|------|-----------|
| **Fornecedor** | APIBrasil Processamento de Dados LTDA |
| **Site** | https://apibrasil.com.br |
| **Documentação** | https://doc.apibrasil.io |
| **Tipo** | API REST |
| **Autenticação** | Bearer Token + Device Token |

## 10.2 APIs de Análise de Crédito

| API | Preço/Requisição | Uso Recomendado |
|-----|------------------|-----------------|
| **Protesto Nacional** | R$ 1,72 | Verificação rápida (sempre usar) |
| **SPC Boa Vista** | R$ 5,00 | Vendas a prazo PF/PJ |
| **SCR Bacen + Score** | R$ 6,19 | Vendas de alto valor |
| **Define Limite PJ Plus** | R$ 12,39 | Abertura de crediário B2B |

## 10.3 API WhatsApp Baileys

| Função | Descrição | Uso no Planac |
|--------|-----------|---------------|
| `sendText` | Enviar mensagem de texto | Notificações, confirmações |
| `sendImage` | Enviar imagem | Fotos de produtos |
| `sendDocument` | Enviar documento | PDFs de orçamentos, NF-e |

## 10.4 Módulos do Planac que Utilizam

- **Crédito** - Análise antes de vendas a prazo
- **Comercial** - Notificações via WhatsApp
- **Financeiro** - Cobrança automatizada

---

# 11. CONFIGURAÇÃO NO CLOUDFLARE

## 11.1 Variáveis de Ambiente

```bash
# NUVEM FISCAL
NUVEM_FISCAL_CLIENT_ID=AJReDlHes8aBNlTzTF9X
NUVEM_FISCAL_CLIENT_SECRET=3yMYNk2hzBLQihujZf0jfFyAKDRc403v4D1SBDFL

# NUVEMSHOP (preencher após criar app)
NUVEMSHOP_APP_ID=
NUVEMSHOP_CLIENT_SECRET=
NUVEMSHOP_ACCESS_TOKEN=
NUVEMSHOP_STORE_ID=

# CPF.CNPJ
CPFCNPJ_ID=JWXN
CPFCNPJ_TOKEN=fb2868083821ff14de07e91ebac9e959

# CNPJá
CNPJA_API_KEY=35f092ea-0922-4231-bc05-181aa4062731-11a1649b-2933-44ca-9d30-9c862a03ebb3

# SERPRO
SERPRO_CONSUMER_KEY=xulEzvzZKabUXeTQXNYPu9OZwkEa
SERPRO_CONSUMER_SECRET=tbquSwPldBI4A5fCv0ftqFmo_3Ma

# IBPT
IBPT_TOKEN=ePNBuMey5VZ0OCw3ihiQQUAc9EQkKAbN9-TlaoLqAf9rpQVQbgoTMuawhjF_pn_o

# BLUESOFT COSMOS
COSMOS_TOKEN=mK7UKgCycAPW1Nr_7QDkdw
```

---

## 📝 Histórico de Atualizações

| Data | Alteração |
|------|-----------|
| 14/12/2025 | **Substituído Baselinker por Nuvemshop** como plataforma de e-commerce |
| 07/12/2025 | Adicionada integração #10: API Brasil |
| 07/12/2025 | Adicionada integração #9: Bluesoft Cosmos |
| 07/12/2025 | Adicionada integração #8: IBPT |
| 06/12/2025 | Documentação inicial |

---

*Documentação mantida por 🏢 DEV.com - Mesa de Especialistas*
