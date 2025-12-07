# 🔗 Integrações Externas - ERP PLANAC

Documentação completa das integrações externas do sistema.

**Status: ✅ Completo**  
**Última Atualização:** 07/12/2025  
**Total de Integrações:** 8

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
| 8 | [IBPT - De Olho no Imposto](#8-ibpt---de-olho-no-imposto) | Tributário | ✅ Documentado | Alta |

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

# 8. IBPT - DE OLHO NO IMPOSTO

## 8.1 Visão Geral

| Item | Descrição |
|------|-----------|
| **Fornecedor** | IBPT - Instituto Brasileiro de Planejamento Tributário |
| **Site** | https://deolhonoimposto.ibpt.org.br |
| **Documentação API Produtos** | https://deolhonoimposto.ibpt.org.br/Site/API#!//Produtos_Get |
| **Documentação API Serviços** | https://deolhonoimposto.ibpt.org.br/Site/API#!//Servicos_Get |
| **Tipo** | API REST |
| **Autenticação** | Token |

## 8.2 Credenciais de Acesso

| Item | Valor |
|------|-------|
| **Token** | `ePNBuMey5VZ0OCw3ihiQQUAc9EQkKAbN9-TlaoLqAf9rpQVQbgoTMuawhjF_pn_o` |

> ⚠️ **IMPORTANTE:** Este token deve ser configurado como secret no Cloudflare Workers para automatizar a atualização das tabelas.

## 8.3 Base Legal

| Lei | Descrição |
|-----|-----------|
| **Lei 12.741/2012** | Lei da Transparência Fiscal |
| **Decreto 8.264/2014** | Regulamentação da Lei |
| **Portaria 85/2014** | Disposições complementares |

**Obrigatoriedade:** Vendas ao **consumidor final** (pessoa física ou jurídica para consumo próprio).

**Penalidades:** Multas de R$ 400,00 até R$ 7 milhões por descumprimento (Código de Defesa do Consumidor).

## 8.4 Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/v1/Produtos` | GET | Consulta alíquotas por NCM |
| `/api/v1/Servicos` | GET | Consulta alíquotas por NBS |

## 8.5 Parâmetros da Consulta (Produtos)

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `token` | string | Sim | Token de autenticação |
| `cnpj` | string | Sim | CNPJ da empresa (apenas números) |
| `codigo` | string | Sim | Código NCM (8 dígitos) |
| `uf` | string | Sim | UF de destino (2 caracteres) |
| `ex` | string | Não | Exceção TIPI (quando aplicável) |

## 8.6 Exemplo de Requisição

```bash
# Consulta alíquota para produto NCM 6809.11.00 no PR
curl "https://api.deolhonoimposto.ibpt.org.br/api/v1/Produtos?token=ePNBuMey5VZ0OCw3ihiQQUAc9EQkKAbN9-TlaoLqAf9rpQVQbgoTMuawhjF_pn_o&cnpj=12345678000190&codigo=68091100&uf=PR"
```

## 8.7 Resposta da API

```json
{
  "Codigo": "68091100",
  "UF": "PR",
  "EX": 0,
  "Descricao": "Chapas, placas, painéis, ladrilhos e semelhantes, de gesso",
  "Nacional": 15.28,
  "Estadual": 18.00,
  "Importado": 23.14,
  "Municipal": 0.00,
  "Tipo": "0",
  "VigenciaInicio": "01/01/2025",
  "VigenciaFim": "30/06/2025",
  "Chave": "ABC123",
  "Versao": "25.1.A",
  "Fonte": "IBPT/empresometro.com.br"
}
```

## 8.8 Campos Retornados

| Campo | Descrição | Uso |
|-------|-----------|-----|
| `Nacional` | % tributos federais (produtos nacionais) | CST origem 0, 3, 4, 5 |
| `Importado` | % tributos federais (produtos importados) | CST origem 1, 2, 6, 7 |
| `Estadual` | % tributos estaduais (ICMS) | Todos os produtos |
| `Municipal` | % tributos municipais | Serviços |
| `VigenciaInicio` | Início da vigência da tabela | Controle de atualização |
| `VigenciaFim` | Fim da vigência da tabela | Alerta de atualização |

## 8.9 Fórmula de Cálculo

```
Valor IBPT por item = Valor do Produto × (Alíquota Federal + Alíquota Estadual + Alíquota Municipal) / 100

Exemplo:
- Produto: R$ 100,00
- Alíquota Federal (Nacional): 15,28%
- Alíquota Estadual: 18,00%
- Alíquota Municipal: 0,00%
- TOTAL: 33,28%

Valor Aproximado dos Tributos = R$ 100,00 × 33,28% = R$ 33,28
```

## 8.10 Integração com Nuvem Fiscal

A Nuvem Fiscal **não calcula automaticamente** o IBPT. O Planac deve:

1. Consultar a API do IBPT para cada NCM do item
2. Calcular o valor aproximado dos tributos
3. Enviar o campo `vTotTrib` preenchido na NF-e/NFC-e

```json
// Exemplo de envio para Nuvem Fiscal
{
  "infNFe": {
    "det": [
      {
        "prod": {
          "NCM": "68091100",
          "vProd": "100.00"
        },
        "imposto": {
          "vTotTrib": "33.28"
        }
      }
    ],
    "total": {
      "ICMSTot": {
        "vTotTrib": "33.28"
      }
    },
    "infAdic": {
      "infCpl": "Valor aproximado dos tributos R$ 33,28 (33,28%) - Fonte: IBPT"
    }
  }
}
```

## 8.11 Estratégia de Cache e Atualização

| Estratégia | Descrição |
|------------|-----------|
| **Cache Local** | Armazenar tabela em KV (Cloudflare) por 30 dias |
| **Atualização** | Job semanal para verificar nova versão |
| **Fallback** | Se API indisponível, usar cache local |
| **Alerta** | Notificar quando `VigenciaFim` estiver próxima |

```typescript
// Estrutura de cache no KV
interface IBPTCache {
  ncm: string;
  uf: string;
  nacional: number;
  estadual: number;
  importado: number;
  municipal: number;
  vigenciaFim: string;
  atualizadoEm: string;
}
```

## 8.12 Módulos do Planac que Utilizam

| Módulo | Uso |
|--------|-----|
| **Faturamento** | Cálculo automático ao emitir NF-e/NFC-e |
| **PDV** | Exibição no cupom fiscal |
| **Produtos** | Armazenamento de alíquotas por NCM |
| **Configurações** | Gestão do token e atualização de tabelas |

## 8.13 Fluxo de Implementação

```mermaid
graph TD
    A[Emissão de NF-e/NFC-e] --> B{Venda p/ Consumidor Final?}
    B -->|Não| C[Não calcula IBPT]
    B -->|Sim| D[Para cada item]
    D --> E{NCM em cache?}
    E -->|Sim| F{Cache válido?}
    E -->|Não| G[Consulta API IBPT]
    F -->|Sim| H[Usa alíquota do cache]
    F -->|Não| G
    G --> I[Armazena no cache]
    I --> H
    H --> J[Calcula valor por item]
    J --> K[Soma vTotTrib total]
    K --> L[Envia para Nuvem Fiscal]
```

## 8.14 Quando NÃO Calcular

| Situação | Motivo |
|----------|--------|
| Venda B2B (revenda) | Não é consumidor final |
| Remessa para industrialização | Não é venda |
| Amostra grátis | Não é venda |
| Transferência entre filiais | Não é venda |
| Devolução | Não é venda |
| MEI (opcional) | Decreto 8.264/2014 torna facultativo |

## 8.15 Texto Padrão na Nota Fiscal

```
Valor aproximado dos tributos R$ {vTotTrib} ({percentual}%) - Fonte: IBPT
```

Onde:
- `{vTotTrib}` = soma dos valores de tributos de todos os itens
- `{percentual}` = média ponderada das alíquotas

---

# 9. CONFIGURAÇÃO NO CLOUDFLARE

## 9.1 Variáveis de Ambiente (.env)

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

# IBPT
IBPT_TOKEN=ePNBuMey5VZ0OCw3ihiQQUAc9EQkKAbN9-TlaoLqAf9rpQVQbgoTMuawhjF_pn_o
```

## 9.2 Configurar Secrets no Cloudflare

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

# IBPT
wrangler secret put IBPT_TOKEN
```

---

## 📝 Histórico de Atualizações

| Data | Alteração |
|------|-----------|
| 07/12/2025 | Adicionada integração #8: IBPT - De Olho no Imposto |
| 06/12/2025 | Adicionadas 6 novas integrações (Baselinker, CPF.CNPJ, CNPJá, SERPRO x3) |
| 06/12/2025 | Documentação inicial Nuvem Fiscal |

---

*Documentação mantida por 🏢 DEV.com - Mesa de Especialistas*
