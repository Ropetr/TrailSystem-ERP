# 📊 IBPT API - Documentação Completa

> **Instituto Brasileiro de Planejamento e Tributação**  
> API "De Olho no Imposto" para transparência tributária

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Lei 12.741/2012](#2-lei-127412012)
3. [Autenticação](#3-autenticação)
4. [Endpoints](#4-endpoints)
5. [Estrutura de Dados](#5-estrutura-de-dados)
6. [Exemplos Práticos](#6-exemplos-práticos)
7. [Integração com Planac](#7-integração-com-planac)
8. [Fluxo de Implementação](#8-fluxo-de-implementação)

---

## 1. Visão Geral

### O que é?

A API do IBPT permite consultar a **carga tributária aproximada** de produtos e serviços, necessária para informar ao consumidor nos documentos fiscais (NF-e, NFC-e, CF-e SAT).

### Informações Gerais

| Item | Valor |
|------|-------|
| **Base URL** | `https://apidoni.ibpt.org.br/api/v1` |
| **Protocolo** | HTTPS |
| **Método** | GET |
| **Formatos** | JSON, XML |
| **Autenticação** | Token + CNPJ |

### Endpoints Disponíveis

| Endpoint | Descrição |
|----------|-----------|
| `/produtos` | Consulta tributos por NCM (produtos) |
| `/servicos` | Consulta tributos por NBS/LC116 (serviços) |

---

## 2. Lei 12.741/2012

### Obrigatoriedade

A **Lei 12.741/2012** (Lei da Transparência Tributária) determina que:

> Todo documento fiscal emitido ao consumidor deve conter a informação do **valor aproximado correspondente à totalidade dos tributos** federais, estaduais e municipais.

### Tributos Informados

| Esfera | Tributos Incluídos |
|--------|-------------------|
| **Federal** | IRPJ, CSLL, PIS, COFINS, IPI, IOF, II |
| **Estadual** | ICMS |
| **Municipal** | ISS |

### Penalidades

O não cumprimento pode resultar em:
- Multas administrativas
- Autos de infração
- Problemas com fiscalização

### Fonte de Isenção

> Empresários e contadores são **isentados de responsabilidade** sobre o cálculo do tributo desde que a fonte (IBPT) seja citada no documento fiscal.

---

## 3. Autenticação

### Obtenção do Token

1. Acesse: https://deolhonoimposto.ibpt.org.br
2. Cadastre pessoa física (nome, email, celular)
3. Valide códigos enviados por SMS e email
4. Cadastre a empresa (CNPJ)
5. Obtenha o **Token** da empresa

### Parâmetros de Autenticação

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `token` | string | ✅ Sim | Token da empresa (obtido no site) |
| `cnpj` | string | ✅ Sim | CNPJ da empresa consultante |

---

## 4. Endpoints

### 4.1 Consulta de Produtos (NCM)

```
GET https://apidoni.ibpt.org.br/api/v1/produtos
```

#### Parâmetros de Entrada

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `token` | string | ✅ Sim | Token da empresa |
| `cnpj` | string | ✅ Sim | CNPJ da empresa |
| `codigo` | string | ✅ Sim | Código NCM do produto (8 dígitos) |
| `uf` | string | ✅ Sim | UF do estado (2 letras) |
| `ex` | integer | ✅ Sim | Código de exceção (0 se não houver) |
| `descricao` | string | ❌ Não | Descrição do produto |
| `unidadeMedida` | string | ❌ Não | Unidade de medida |
| `valor` | number | ❌ Não | Valor unitário |
| `gtin` | string | ❌ Não | Código GTIN/EAN |

#### Resposta de Sucesso

```json
[
  {
    "Codigo": "68091100",
    "UF": "PR",
    "EX": 0,
    "Descricao": "Placas, chapas, painéis, ladrilhos e semelhantes",
    "Nacional": 15.98,
    "Estadual": 18.00,
    "Importado": 26.45,
    "Municipal": 0.00,
    "Tipo": "0",
    "VigenciaInicio": "01/01/2024",
    "VigenciaFim": "30/06/2024",
    "Chave": "ABC123...",
    "Versao": "24.1.A",
    "Fonte": "IBPT"
  }
]
```

---

### 4.2 Consulta de Serviços (NBS/LC116)

```
GET https://apidoni.ibpt.org.br/api/v1/servicos
```

#### Parâmetros de Entrada

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `token` | string | ✅ Sim | Token da empresa |
| `cnpj` | string | ✅ Sim | CNPJ da empresa |
| `codigo` | string | ✅ Sim | Código NBS ou LC116 |
| `uf` | string | ✅ Sim | UF do estado (2 letras) |
| `descricao` | string | ❌ Não | Descrição do serviço |
| `unidadeMedida` | string | ❌ Não | Unidade de medida |
| `valor` | number | ❌ Não | Valor do serviço |

#### Resposta de Sucesso

```json
[
  {
    "Codigo": "1.05",
    "UF": "PR",
    "Descricao": "Licenciamento ou cessão de direito de uso de programas de computação",
    "Tipo": "LC116",
    "Nacional": 13.45,
    "Estadual": 0.00,
    "Municipal": 5.00,
    "Importado": 15.45,
    "VigenciaInicio": "01/01/2024",
    "VigenciaFim": "30/06/2024",
    "Chave": "DEF456...",
    "Versao": "24.1.A",
    "Fonte": "IBPT"
  }
]
```

---

## 5. Estrutura de Dados

### 5.1 ProdutoDTO (Resposta de Produtos)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `Codigo` | string | Código NCM consultado |
| `UF` | string | UF do estado |
| `EX` | integer | Código de exceção |
| `Descricao` | string | Descrição oficial do NCM |
| `Nacional` | number | **% tributos federais** (produto nacional) |
| `Estadual` | number | **% ICMS** |
| `Importado` | number | **% tributos** (produto importado) |
| `Municipal` | number | **% ISS** (normalmente 0 para produtos) |
| `Tipo` | string | Tipo do código (0=NCM) |
| `VigenciaInicio` | string | Data início vigência (dd/mm/yyyy) |
| `VigenciaFim` | string | Data fim vigência (dd/mm/yyyy) |
| `Chave` | string | Chave de validação da consulta |
| `Versao` | string | Versão da tabela IBPT |
| `Fonte` | string | Fonte dos dados (IBPT) |

### 5.2 ServicoDTO (Resposta de Serviços)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `Codigo` | string | Código NBS ou LC116 |
| `UF` | string | UF do estado |
| `Descricao` | string | Descrição do serviço |
| `Tipo` | string | Tipo: "NBS" ou "LC116" |
| `Nacional` | number | **% tributos federais** |
| `Estadual` | number | **% tributos estaduais** (geralmente 0) |
| `Municipal` | number | **% ISS** |
| `Importado` | number | **% tributos** (serviço importado) |
| `VigenciaInicio` | string | Data início vigência |
| `VigenciaFim` | string | Data fim vigência |
| `Chave` | string | Chave de validação |
| `Versao` | string | Versão da tabela |
| `Fonte` | string | Fonte (IBPT) |

### 5.3 Cálculo do Valor Aproximado

```
Valor_Tributos = Valor_Produto × (Aliquota / 100)
```

**Para produtos nacionais:**
```
Total_Tributos = (Nacional + Estadual + Municipal) / 100 × Valor
```

**Para produtos importados:**
```
Total_Tributos = (Importado + Estadual + Municipal) / 100 × Valor
```

---

## 6. Exemplos Práticos

### 6.1 Consulta via cURL

#### Produto (Placa de Gesso - NCM 68091100)

```bash
curl -X GET "https://apidoni.ibpt.org.br/api/v1/produtos?\
token=SEU_TOKEN&\
cnpj=12345678000190&\
codigo=68091100&\
uf=PR&\
ex=0&\
descricao=Placa%20de%20gesso%20para%20drywall&\
unidadeMedida=UN&\
valor=89.90"
```

#### Serviço (Instalação - LC116 7.02)

```bash
curl -X GET "https://apidoni.ibpt.org.br/api/v1/servicos?\
token=SEU_TOKEN&\
cnpj=12345678000190&\
codigo=7.02&\
uf=PR&\
descricao=Instalacao%20de%20drywall&\
valor=500.00"
```

### 6.2 Código TypeScript

```typescript
interface IBPTConfig {
  token: string;
  cnpj: string;
}

interface ProdutoParams {
  ncm: string;
  uf: string;
  ex?: number;
  descricao?: string;
  valor?: number;
  gtin?: string;
}

interface ServicoParams {
  codigo: string;
  uf: string;
  descricao?: string;
  valor?: number;
}

interface TributoResponse {
  Codigo: string;
  UF: string;
  Descricao: string;
  Nacional: number;
  Estadual: number;
  Municipal: number;
  Importado: number;
  VigenciaInicio: string;
  VigenciaFim: string;
  Versao: string;
  Fonte: string;
}

class IBPTClient {
  private baseUrl = 'https://apidoni.ibpt.org.br/api/v1';
  private token: string;
  private cnpj: string;

  constructor(config: IBPTConfig) {
    this.token = config.token;
    this.cnpj = config.cnpj;
  }

  /**
   * Consulta tributos de produto por NCM
   */
  async consultarProduto(params: ProdutoParams): Promise<TributoResponse[]> {
    const queryParams = new URLSearchParams({
      token: this.token,
      cnpj: this.cnpj,
      codigo: params.ncm,
      uf: params.uf,
      ex: String(params.ex || 0),
    });

    if (params.descricao) queryParams.set('descricao', params.descricao);
    if (params.valor) queryParams.set('valor', String(params.valor));
    if (params.gtin) queryParams.set('gtin', params.gtin);

    const response = await fetch(`${this.baseUrl}/produtos?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`IBPT Error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Consulta tributos de serviço por NBS/LC116
   */
  async consultarServico(params: ServicoParams): Promise<TributoResponse[]> {
    const queryParams = new URLSearchParams({
      token: this.token,
      cnpj: this.cnpj,
      codigo: params.codigo,
      uf: params.uf,
    });

    if (params.descricao) queryParams.set('descricao', params.descricao);
    if (params.valor) queryParams.set('valor', String(params.valor));

    const response = await fetch(`${this.baseUrl}/servicos?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`IBPT Error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Calcula valor aproximado dos tributos
   */
  calcularTributos(
    valor: number, 
    tributo: TributoResponse, 
    importado: boolean = false
  ): {
    federal: number;
    estadual: number;
    municipal: number;
    total: number;
  } {
    const aliquotaFederal = importado ? tributo.Importado : tributo.Nacional;
    
    const federal = valor * (aliquotaFederal / 100);
    const estadual = valor * (tributo.Estadual / 100);
    const municipal = valor * (tributo.Municipal / 100);
    const total = federal + estadual + municipal;

    return {
      federal: Math.round(federal * 100) / 100,
      estadual: Math.round(estadual * 100) / 100,
      municipal: Math.round(municipal * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }
}

// Exemplo de uso
const ibpt = new IBPTClient({
  token: 'SEU_TOKEN_AQUI',
  cnpj: '12345678000190'
});

// Consultar tributos de Placa de Gesso
const tributos = await ibpt.consultarProduto({
  ncm: '68091100',
  uf: 'PR',
  descricao: 'Placa de Gesso Standard',
  valor: 89.90
});

// Calcular valor dos tributos
const valores = ibpt.calcularTributos(89.90, tributos[0]);
console.log(`Tributos aproximados: R$ ${valores.total}`);
```

---

## 7. Integração com Planac

### 7.1 Onde Usar

| Módulo | Uso |
|--------|-----|
| **Cadastro de Produtos** | Consultar e armazenar alíquotas por NCM |
| **Emissão de NF-e** | Calcular e informar tributos |
| **Emissão de NFC-e** | Calcular e informar tributos |
| **Orçamentos** | Mostrar tributos ao cliente |

### 7.2 Tabela de Cache (Sugerida)

```sql
CREATE TABLE ibpt_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL,
  codigo VARCHAR(20) NOT NULL,        -- NCM ou NBS
  tipo VARCHAR(10) NOT NULL,          -- 'NCM' ou 'NBS'
  uf CHAR(2) NOT NULL,
  ex INTEGER DEFAULT 0,
  descricao TEXT,
  nacional DECIMAL(10,4) NOT NULL,
  estadual DECIMAL(10,4) NOT NULL,
  municipal DECIMAL(10,4) NOT NULL,
  importado DECIMAL(10,4) NOT NULL,
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE NOT NULL,
  versao VARCHAR(20),
  chave VARCHAR(100),
  consultado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(empresa_id, codigo, uf, ex),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE INDEX idx_ibpt_codigo_uf ON ibpt_cache(codigo, uf);
CREATE INDEX idx_ibpt_vigencia ON ibpt_cache(vigencia_fim);
```

### 7.3 Estratégia de Cache

```typescript
async function obterTributos(ncm: string, uf: string): Promise<TributoResponse> {
  // 1. Verificar cache local
  const cache = await db.query(
    `SELECT * FROM ibpt_cache 
     WHERE codigo = ? AND uf = ? 
     AND vigencia_fim >= DATE('now')`,
    [ncm, uf]
  );

  if (cache.length > 0) {
    return cache[0];
  }

  // 2. Consultar API
  const tributos = await ibpt.consultarProduto({ ncm, uf });
  
  // 3. Salvar no cache
  await db.execute(
    `INSERT OR REPLACE INTO ibpt_cache 
     (codigo, tipo, uf, nacional, estadual, municipal, importado, 
      vigencia_inicio, vigencia_fim, versao) 
     VALUES (?, 'NCM', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ncm, uf, tributos[0].Nacional, tributos[0].Estadual, 
     tributos[0].Municipal, tributos[0].Importado,
     tributos[0].VigenciaInicio, tributos[0].VigenciaFim, 
     tributos[0].Versao]
  );

  return tributos[0];
}
```

### 7.4 Informação no Documento Fiscal

Na NF-e/NFC-e, deve constar:

```
Valor aproximado dos tributos: R$ 15,28 (16,99%)
Fonte: IBPT
```

**Campo XML na NF-e:**
```xml
<infAdProd>
  Valor aproximado dos tributos: R$ 15,28 (16,99%) - Fonte: IBPT
</infAdProd>

<!-- Ou no grupo vTotTrib -->
<ICMSTot>
  <vTotTrib>15.28</vTotTrib>
</ICMSTot>
```

---

## 8. Fluxo de Implementação

### 8.1 Passo a Passo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE IMPLEMENTAÇÃO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CADASTRO IBPT                                               │
│     ├── Criar conta em deolhonoimposto.ibpt.org.br              │
│     ├── Validar email e celular                                 │
│     └── Cadastrar empresa e obter TOKEN                         │
│                                                                  │
│  2. CONFIGURAÇÃO NO PLANAC                                      │
│     ├── Salvar token e CNPJ nas configurações                   │
│     └── Criar tabela de cache ibpt_cache                        │
│                                                                  │
│  3. CADASTRO DE PRODUTOS                                        │
│     ├── Ao salvar produto com NCM                               │
│     ├── Consultar IBPT (se não estiver em cache)                │
│     └── Armazenar alíquotas no cache                            │
│                                                                  │
│  4. EMISSÃO DE DOCUMENTO FISCAL                                 │
│     ├── Para cada item, buscar tributos (cache/API)             │
│     ├── Calcular: Valor × (Alíquota/100)                        │
│     ├── Somar total de tributos                                 │
│     └── Informar no XML e DANFe                                 │
│                                                                  │
│  5. MANUTENÇÃO                                                  │
│     ├── Job diário: limpar cache expirado                       │
│     └── Atualizar quando vigência expirar                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Checklist de Implementação

- [ ] Obter token no site IBPT
- [ ] Configurar credenciais no Planac
- [ ] Criar tabela de cache
- [ ] Implementar consulta de produtos
- [ ] Implementar consulta de serviços
- [ ] Integrar no cadastro de produtos
- [ ] Integrar na emissão de NF-e
- [ ] Integrar na emissão de NFC-e
- [ ] Criar job de limpeza de cache
- [ ] Testar com NCMs reais da Planac

---

## Apêndice A: NCMs Comuns - Drywall/Construção

| NCM | Descrição | Categoria |
|-----|-----------|-----------|
| 68091100 | Placas, chapas, painéis - não revestidos | Placas |
| 68091900 | Placas, chapas, painéis - outros | Placas |
| 68099000 | Outras obras de gesso | Acessórios |
| 72142000 | Barras de ferro/aço - dentadas | Perfis |
| 73089090 | Outras construções de ferro/aço | Estruturas |
| 39259090 | Outros artigos para construção - plástico | Acessórios |
| 32091010 | Tintas à base de polímeros acrílicos | Acabamento |

---

## Apêndice B: Códigos de Erro

| Código | Descrição | Solução |
|--------|-----------|---------|
| 401 | Token inválido | Verificar token no site IBPT |
| 400 | Parâmetros inválidos | Verificar NCM/CNPJ |
| 404 | NCM não encontrado | Verificar código NCM |
| 500 | Erro interno IBPT | Tentar novamente |

---

## Apêndice C: Diferença Nacional vs Importado

| Cenário | Usar Alíquota |
|---------|---------------|
| Produto fabricado no Brasil | `Nacional` |
| Produto importado (origem 1,2,3,8) | `Importado` |
| Serviço prestado no Brasil | `Nacional` |
| Serviço importado | `Importado` |

**Origem da Mercadoria (CST):**
- 0 = Nacional
- 1, 2, 3, 8 = Importado
- 4, 5, 6, 7 = Nacional (com componente importado)

---

**Documento gerado em:** 08/12/2025  
**Para o projeto:** Planac ERP  
**Desenvolvido por:** DEV.com
