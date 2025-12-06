# 🔗 Integrações Externas - ERP PLANAC

Documentação completa das integrações externas do sistema.

**Status: ✅ Completo**  
**Última Atualização:** 06/12/2025  
**Total de Integrações:** 7

---

## Índice

| # | Integração | Tipo | Status | Prioridade |
|---|------------|------|--------|------------|
| 1 | [Nuvem Fiscal](#1-nuvem-fiscal) | Fiscal | ✅ Configurado | Alta |
| 2 | [Baselinker](#2-baselinker) | Hub e-Commerce | ✅ Documentado | Alta |
| 3 | [CPF.CNPJ](#3-cpfcnpj) | Validação Docs | ✅ Documentado | Alta |
| 4 | [CNPJá](#4-cnpjá) | Consulta CNPJ | ✅ Documentado | Média |
| 5 | [SERPRO Integra Contador](#5-serpro-integra-contador) | Dados Fiscais | ✅ Documentado | Média |
| 6 | [SERPRO Consulta Renda](#6-serpro-consulta-renda) | Análise Crédito | ✅ Documentado | Baixa |
| 7 | [SERPRO Consulta Faturamento](#7-serpro-consulta-faturamento) | Análise Crédito | ✅ Documentado | Baixa |

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
| **Produção** | `AJReDlHes8aBNlTzTF9X` | `3yMYNk2hzBLQihujZf0jfFyAKDRc403v4D1SBDFL` |

> ⚠️ **IMPORTANTE:** As credenciais acima são sensíveis. Em produção, devem ser armazenadas como secrets no Cloudflare Workers.

## 1.3 Endpoints Base

| Ambiente | URL |
|----------|-----|
| Produção | `https://api.nuvemfiscal.com.br` |
| Sandbox | `https://api.sandbox.nuvemfiscal.com.br` |

## 1.4 Serviços Utilizados

| Serviço | Descrição | Uso no Planac |
|---------|-----------|---------------|
| **NF-e** | Nota Fiscal Eletrônica | Vendas B2B |
| **NFC-e** | Nota Fiscal Consumidor | PDV / Varejo |
| **NFS-e** | Nota Fiscal de Serviço | Serviços |
| **CT-e** | Conhecimento de Transporte | Frete próprio |
| **MDF-e** | Manifesto de Documentos | Expedição |

## 1.5 Fluxo de Autenticação

```bash
# Obter token de acesso
curl -X POST "https://api.nuvemfiscal.com.br/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=AJReDlHes8aBNlTzTF9X" \
  -d "client_secret=3yMYNk2hzBLQihujZf0jfFyAKDRc403v4D1SBDFL"
```

## 1.6 Módulos do Planac que Utilizam

- **Faturamento** - Emissão de NF-e e NFC-e
- **PDV** - Emissão de NFC-e
- **Serviços** - Emissão de NFS-e
- **Expedição** - Emissão de CT-e e MDF-e

---

# 2. BASELINKER

## 2.1 Visão Geral

| Item | Descrição |
|------|-----------|
| **Fornecedor** | Baselinker (BASE.COM) |
| **Site** | https://baselinker.com |
| **Documentação** | https://api.baselinker.com |
| **Tipo** | API REST |
| **Autenticação** | Token Bearer |

## 2.2 Credenciais de Acesso

| Item | Valor |
|------|-------|
| **Token** | `8003146-8033898-532H6155RLJVRTS9GX0RKTKI8IO74JQ9PPAL391UOJZ9VGTP8QAT5N42HZMPC5IQ` |

## 2.3 Endpoint Base

```
https://api.baselinker.com/connector.php
```

## 2.4 Funcionalidades Principais

| Método | Descrição | Uso no Planac |
|--------|-----------|---------------|
| `getOrders` | Lista pedidos de marketplaces | Importação de vendas |
| `getOrderStatusList` | Status disponíveis | Sincronização |
| `setOrderStatus` | Atualiza status | Atualização de status |
| `getInventoryProductsList` | Lista produtos | Sincronização de catálogo |
| `updateInventoryProductsStock` | Atualiza estoque | Sincronização de estoque |
| `getInventoryProductsPrices` | Lista preços | Sincronização de preços |

## 2.5 Marketplaces Suportados

| Marketplace | Código |
|-------------|--------|
| Mercado Livre | `ml` |
| Amazon | `amazon` |
| Shopee | `shopee` |
| Magazine Luiza | `magalu` |
| Americanas | `americanas` |
| Via Varejo | `viavarejo` |
| B2W | `b2w` |

## 2.6 Exemplo de Requisição

```bash
curl -X POST "https://api.baselinker.com/connector.php" \
  -H "X-BLToken: 8003146-8033898-532H6155RLJVRTS9GX0RKTKI8IO74JQ9PPAL391UOJZ9VGTP8QAT5N42HZMPC5IQ" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "method=getOrders" \
  -d "parameters={\"date_from\": 1700000000}"
```

## 2.7 Módulos do Planac que Utilizam

- **E-commerce** - Importação de pedidos
- **Estoque** - Sincronização de quantidades
- **Produtos** - Sincronização de catálogo
- **Preços** - Sincronização de tabelas

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

## 3.4 Exemplo de Requisição

```bash
# Consulta CNPJ
curl "https://www.cpfcnpj.com.br/api/cnpj/12345678000190" \
  -H "Authorization: Basic SldYTjpmYjI4NjgwODM4MjFmZjE0ZGUwN2U5MWViYWM5ZTk1OQ=="
```

## 3.5 Campos Retornados (CNPJ)

| Campo | Descrição |
|-------|-----------|
| `razao_social` | Razão social |
| `nome_fantasia` | Nome fantasia |
| `cnpj` | CNPJ formatado |
| `situacao` | Situação cadastral |
| `data_abertura` | Data de abertura |
| `endereco` | Endereço completo |
| `telefone` | Telefone |
| `email` | E-mail |
| `atividade_principal` | CNAE principal |

## 3.6 Módulos do Planac que Utilizam

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

## 4.5 Exemplo de Requisição

```bash
curl "https://api.cnpja.com/office/12345678000190" \
  -H "Authorization: 35f092ea-0922-4231-bc05-181aa4062731-11a1649b-2933-44ca-9d30-9c862a03ebb3"
```

## 4.6 Dados Enriquecidos Disponíveis

| Categoria | Campos |
|-----------|--------|
| **Básico** | Razão social, fantasia, CNPJ, situação |
| **Endereço** | Logradouro, número, bairro, cidade, UF, CEP |
| **Contato** | Telefones, e-mails |
| **Fiscal** | Simples Nacional, MEI, IE, IM |
| **Sócios** | Nome, CPF, qualificação, participação |
| **CNAE** | Principal e secundárias |
| **Capital** | Capital social |

## 4.7 Módulos do Planac que Utilizam

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
| **Documentação** | https://apicenter.estaleiro.serpro.gov.br |
| **Tipo** | API REST |
| **Autenticação** | OAuth 2.0 (Client Credentials) |

## 5.2 Credenciais de Acesso

| Item | Valor |
|------|-------|
| **Consumer Key** | `xulEzvzZKabUXeTQXNYPu9OZwkEa` |
| **Consumer Secret** | `tbquSwPldBI4A5fCv0ftqFmo_3Ma` |
| **Contrato** | `229986` |

## 5.3 Obter Token de Acesso

```bash
curl -X POST "https://gateway.apiserpro.serpro.gov.br/token" \
  -H "Authorization: Basic eHVsRXp2elpLYWJVWGVUUVhOWVB1OU9ad2tFYTp0YnF1U3dQbGRCSTRBNWZDdjBmdHFGbW9fM01h" \
  -d "grant_type=client_credentials"
```

## 5.4 Funcionalidades

| Serviço | Descrição |
|---------|-----------|
| **Consulta CNPJ** | Dados cadastrais da empresa |
| **Consulta CPF** | Validação de pessoa física |
| **Consulta INSS** | Situação previdenciária |
| **Consulta FGTS** | Regularidade do FGTS |

## 5.5 Módulos do Planac que Utilizam

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

## 6.3 Obter Token de Acesso

```bash
curl -X POST "https://gateway.apiserpro.serpro.gov.br/token" \
  -H "Authorization: Basic eHVsRXp2elpLYWJVWGVUUVhOWVB1OU9ad2tFYTp0YnF1U3dQbGRCSTRBNWZDdjBmdHFGbW9fM01h" \
  -d "grant_type=client_credentials"
```

## 6.4 Dados Disponíveis

| Dado | Descrição |
|------|-----------|
| **Renda declarada** | Valor declarado no IR |
| **Faixa de renda** | Classificação por faixa |
| **Ano base** | Exercício fiscal |

## 6.5 Módulos do Planac que Utilizam

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

## 7.3 Obter Token de Acesso

```bash
curl -X POST "https://gateway.apiserpro.serpro.gov.br/token" \
  -H "Authorization: Basic eHVsRXp2elpLYWJVWGVUUVhOWVB1OU9ad2tFYTp0YnF1U3dQbGRCSTRBNWZDdjBmdHFGbW9fM01h" \
  -d "grant_type=client_credentials"
```

## 7.4 Dados Disponíveis

| Dado | Descrição |
|------|-----------|
| **Faturamento presumido** | Valor estimado de faturamento |
| **Porte da empresa** | MEI, ME, EPP, Normal |
| **Ano base** | Exercício fiscal |

## 7.5 Módulos do Planac que Utilizam

- **Crédito** - Análise de limite para pessoa jurídica
- **Comercial** - Classificação de clientes

---

# 8. CONFIGURAÇÃO NO CLOUDFLARE

## 8.1 Variáveis de Ambiente (.env)

```bash
# NUVEM FISCAL
NUVEM_FISCAL_CLIENT_ID=AJReDlHes8aBNlTzTF9X
NUVEM_FISCAL_CLIENT_SECRET=3yMYNk2hzBLQihujZf0jfFyAKDRc403v4D1SBDFL
NUVEM_FISCAL_URL=https://api.nuvemfiscal.com.br

# BASELINKER
BASELINKER_TOKEN=8003146-8033898-532H6155RLJVRTS9GX0RKTKI8IO74JQ9PPAL391UOJZ9VGTP8QAT5N42HZMPC5IQ

# CPF.CNPJ
CPFCNPJ_ID=JWXN
CPFCNPJ_TOKEN=fb2868083821ff14de07e91ebac9e959

# CNPJá
CNPJA_API_KEY=35f092ea-0922-4231-bc05-181aa4062731-11a1649b-2933-44ca-9d30-9c862a03ebb3

# SERPRO
SERPRO_CONSUMER_KEY=xulEzvzZKabUXeTQXNYPu9OZwkEa
SERPRO_CONSUMER_SECRET=tbquSwPldBI4A5fCv0ftqFmo_3Ma
SERPRO_CONTRATO_INTEGRA=229986
SERPRO_CONTRATO_RENDA=261076
SERPRO_CONTRATO_FATURAMENTO=261077
```

## 8.2 Configurar Secrets no Cloudflare

```bash
# Nuvem Fiscal
wrangler secret put NUVEM_FISCAL_CLIENT_ID
wrangler secret put NUVEM_FISCAL_CLIENT_SECRET

# Baselinker
wrangler secret put BASELINKER_TOKEN

# CPF.CNPJ
wrangler secret put CPFCNPJ_ID
wrangler secret put CPFCNPJ_TOKEN

# CNPJá
wrangler secret put CNPJA_API_KEY

# SERPRO
wrangler secret put SERPRO_CONSUMER_KEY
wrangler secret put SERPRO_CONSUMER_SECRET
```

---

## 📝 Histórico de Atualizações

| Data | Alteração |
|------|-----------|
| 06/12/2025 | Adicionadas 6 novas integrações (Baselinker, CPF.CNPJ, CNPJá, SERPRO x3) |
| 06/12/2025 | Documentação inicial Nuvem Fiscal |

---

*Documentação mantida por 🏢 DEV.com - Mesa de Especialistas*
