# 📋 TECNOSPEED FISCAL - DOCUMENTAÇÃO TÉCNICA DETALHADA

> **Data:** 12/12/2025  
> **Projeto:** PLANAC ERP Multi-tenant  
> **Foco:** PlugNotas (Emissão) + PlugStorage (Captação)

---

## 📑 ÍNDICE

1. [Arquitetura Fiscal TecnoSpeed](#1-arquitetura-fiscal-tecnospeed)
2. [PlugNotas - API de Emissão](#2-plugnotas---api-de-emissão)
3. [PlugStorage - Captação e Armazenamento](#3-plugstorage---captação-e-armazenamento)
4. [Endpoints Completos](#4-endpoints-completos)
5. [Exemplos de JSON](#5-exemplos-de-json)
6. [Webhooks e Notificações](#6-webhooks-e-notificações)
7. [Fluxos de Integração](#7-fluxos-de-integração)
8. [Tratamento de Erros](#8-tratamento-de-erros)
9. [Implementação PLANAC](#9-implementação-planac)

---

## 1. ARQUITETURA FISCAL TECNOSPEED

### 1.1 Visão Geral da Suíte Fiscal

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TECNOSPEED FISCAL                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐          ┌─────────────────────┐               │
│  │     PLUGNOTAS       │          │    PLUGSTORAGE      │               │
│  │   (API de Emissão)  │          │ (Armazenamento/DFe) │               │
│  ├─────────────────────┤          ├─────────────────────┤               │
│  │ • NF-e (mod. 55)    │          │ • Notas Destinadas  │               │
│  │ • NFC-e (mod. 65)   │          │ • Manifestação      │               │
│  │ • NFS-e (+2000 cid) │          │ • Armazenamento 5a  │               │
│  │ • MDF-e (mod. 58)   │          │ • Integração Domínio│               │
│  │ • CF-e/SAT (mod.59) │          │ • Envio Automático  │               │
│  └─────────────────────┘          └─────────────────────┘               │
│              │                              │                            │
│              │         SEFAZ/Prefeituras    │                            │
│              └──────────────┬───────────────┘                            │
│                             │                                            │
│                    ┌────────▼────────┐                                   │
│                    │   CERTIFICADO   │                                   │
│                    │   DIGITAL A1    │                                   │
│                    └─────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Credenciais e Ambientes

| Ambiente | Base URL PlugNotas | Base URL PlugStorage |
|----------|-------------------|---------------------|
| **Sandbox** | `https://api.sandbox.plugnotas.com.br` | N/A (mock) |
| **Produção** | `https://api.plugnotas.com.br` | `https://app.plugstorage.com.br/api` |

| Autenticação | PlugNotas | PlugStorage |
|--------------|-----------|-------------|
| **Tipo** | Bearer Token | Basic Auth |
| **Header** | `x-api-key: {token}` | `Authorization: Basic {base64}` |
| **Token Sandbox** | `2da392a6-79d2-4304-a8b7-959572c7e44d` | N/A |

### 1.3 Requisitos Técnicos

- **Certificado Digital**: Apenas A1 (.pfx ou .p12)
- **Protocolo**: HTTPS obrigatório
- **Formato**: JSON (request/response)
- **Encoding**: UTF-8
- **Rate Limit**: Não especificado (consultar TecnoSpeed)

---

## 2. PLUGNOTAS - API DE EMISSÃO

### 2.1 Documentos Suportados

| Documento | Modelo | Rota | Uso |
|-----------|--------|------|-----|
| **NF-e** | 55 | `/nfe` | Vendas B2B, remessa, devolução |
| **NFC-e** | 65 | `/nfce` | PDV, varejo presencial |
| **NFS-e** | - | `/nfse` | Serviços (+2000 cidades) |
| **NFS-e Nacional** | - | `/nfse` | Padrão ABRASF unificado |
| **MDF-e** | 58 | `/mdfe` | Manifesto de transporte |
| **CF-e/SAT** | 59 | `/cfe` | Cupom fiscal (SP) |

### 2.2 Fluxo de Emissão (Assíncrono)

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  ERP    │────▶│ PlugNotas│────▶│  SEFAZ   │────▶│ Retorno  │
│ (JSON)  │     │  (API)   │     │Prefeitura│     │ Webhook  │
└─────────┘     └──────────┘     └──────────┘     └──────────┘
     │               │                                  │
     │               ▼                                  │
     │         ┌──────────┐                             │
     │         │   ID     │◀────────────────────────────┘
     │         │ Retorno  │
     │         └──────────┘
     │               │
     │               ▼
     │         ┌──────────┐
     └────────▶│ Consulta │ (polling ou webhook)
               │ Status   │
               └──────────┘
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
    CONCLUÍDO   REJEITADO  PROCESSANDO
```

### 2.3 Status de Notas

| Status | Descrição | Ação |
|--------|-----------|------|
| `PROCESSANDO` | Aguardando SEFAZ | Aguardar/consultar |
| `CONCLUÍDO` | Autorizada | Baixar XML/PDF |
| `REJEITADO` | Erro SEFAZ/API | Corrigir e reenviar |
| `CANCELADO` | Cancelamento aceito | Arquivar |
| `INTERROMPIDO` | Parado pela interface | Verificar manualmente |

---

## 3. PLUGSTORAGE - CAPTAÇÃO E ARMAZENAMENTO

### 3.1 Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **Consulta DFe** | Busca automática de notas destinadas ao CNPJ |
| **Manifestação** | Ciência, Confirmação, Desconhecimento, Não Realizada |
| **Armazenamento** | Guarda XML por 5 anos + ano vigente |
| **Envio Automático** | E-mail para destinatário após autorização |
| **Integração Domínio** | Envio para sistema contábil |
| **CT-e Destinados** | Conhecimentos de transporte recebidos |

### 3.2 Fluxo de Captação de Notas de Entrada

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE CAPTAÇÃO DFe                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CONFIGURAR CERTIFICADO                                       │
│     └── Upload do certificado A1 no painel PlugStorage           │
│                                                                  │
│  2. CONSULTA AUTOMÁTICA (via NSU)                                │
│     └── PlugStorage consulta SEFAZ periodicamente                │
│     └── Retorna notas resumidas (sem XML completo)               │
│                                                                  │
│  3. MANIFESTAÇÃO DO DESTINATÁRIO                                 │
│     └── Via API ou interface                                     │
│     └── Tipos: CIENCIA, CONFIRMAR, DESCONHECIMENTO, NAO_REALIZADA│
│                                                                  │
│  4. DOWNLOAD XML COMPLETO                                        │
│     └── Disponível após manifestação                             │
│     └── GET /invoices/xml/{chave}                                │
│                                                                  │
│  5. PROCESSAMENTO ERP                                            │
│     └── Extrair dados fiscais (ICMS, PIS, COFINS, IPI)           │
│     └── Lançar entrada de mercadoria                             │
│     └── Contabilizar créditos                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 NSU (Número Sequencial Único)

O NSU é o identificador único de cada documento/evento na SEFAZ:

- Cada nota ou evento tem um NSU único
- Consulta retorna até 50 documentos por requisição
- Deve-se salvar último NSU para evitar bloqueio SEFAZ
- Regras de uso indevido: NT 2014.002

```
Exemplo de fluxo NSU:
ultNSU = 000000000000000  (primeira consulta)
maxNSU = 000000000000150  (SEFAZ retorna)

Consultar de ultNSU até maxNSU em batches de 50
Salvar ultNSU para próxima consulta
```

### 3.4 Tipos de Manifestação

| Código | Tipo | Descrição | Uso |
|--------|------|-----------|-----|
| 210210 | `CIENCIA` | Ciência da Operação | Libera XML completo (temporário) |
| 210200 | `CONFIRMAR` | Confirmação da Operação | Evento definitivo (operação ocorreu) |
| 210220 | `DESCONHECIMENTO` | Desconhecimento | Não reconhece a operação |
| 210240 | `NAO_REALIZADA` | Não Realizada | Operação não ocorreu |
| - | `DESACORDO` | Desacordo (CT-e) | Prestação divergente |

**Importante:**
- Manifestação `CIENCIA` é temporária e recomendada inicialmente
- Após `CIENCIA`, pode-se manifestar definitivamente
- `DESCONHECIMENTO` e `NAO_REALIZADA` requerem justificativa

---

## 4. ENDPOINTS COMPLETOS

### 4.1 PlugNotas - Configuração

```http
# Cadastrar empresa emissora
POST /empresa
Content-Type: application/json
x-api-key: {token}

{
  "cpfCnpj": "00000000000000",
  "razaoSocial": "EMPRESA TESTE LTDA",
  "nomeFantasia": "EMPRESA TESTE",
  "inscricaoEstadual": "123456789",
  "inscricaoMunicipal": "12345",
  "regimeTributario": "3",
  "endereco": {
    "logradouro": "Rua Teste",
    "numero": "100",
    "bairro": "Centro",
    "codigoCidade": "4115200",
    "descricaoCidade": "MARINGÁ",
    "estado": "PR",
    "cep": "87000000"
  },
  "email": "fiscal@empresa.com.br",
  "telefone": "4433331234"
}

# Atualizar empresa
PUT /empresa/{cpfCnpj}

# Consultar empresa
GET /empresa/{cpfCnpj}

# Cadastrar certificado A1
POST /certificado
Content-Type: multipart/form-data
x-api-key: {token}

arquivo: [arquivo.pfx]
senha: [senha_certificado]
cpfCnpj: [cnpj_empresa]
email: [email_notificacao]

# Remover certificado
DELETE /certificado/{cpfCnpj}
```

### 4.2 PlugNotas - NF-e

```http
# Emitir NF-e (array de notas)
POST /nfe
Content-Type: application/json
x-api-key: {token}

[{...nota1...}, {...nota2...}]

# Consulta resumida
GET /nfe?cpfCnpj={cnpj}&dataInicio={data}&dataFim={data}&status={status}

# Consulta por ID
GET /nfe/{id}

# Consulta completa por ID
GET /nfe/{id}/resumo

# Download XML
GET /nfe/{id}/xml

# Download PDF (DANFE)
GET /nfe/{id}/pdf

# Cancelar NF-e
POST /nfe/{id}/cancelar
{
  "justificativa": "Motivo do cancelamento com mínimo 15 caracteres"
}

# Carta de Correção (CC-e)
POST /nfe/{id}/cce
{
  "correcao": "Texto da correção com mínimo 15 caracteres"
}

# Inutilizar numeração
POST /nfe/inutilizar
{
  "cpfCnpj": "00000000000000",
  "serie": "1",
  "numeroInicial": "100",
  "numeroFinal": "110",
  "justificativa": "Motivo da inutilização"
}

# Status SEFAZ por UF
GET /nfe/status/{uf}

# Consultar notas destinadas
GET /nfe/consultar-destinadas?cpfCnpj={cnpj}
```

### 4.3 PlugNotas - NFC-e

```http
# Emitir NFC-e
POST /nfce
Content-Type: application/json
x-api-key: {token}

# Consultar NFC-e
GET /nfce/{id}

# Download XML
GET /nfce/{id}/xml

# Download PDF (DANFCE)
GET /nfce/{id}/pdf

# Cancelar NFC-e
POST /nfce/{id}/cancelar
{
  "justificativa": "Motivo do cancelamento"
}

# Inutilizar numeração
POST /nfce/inutilizar
```

### 4.4 PlugNotas - NFS-e

```http
# Emitir NFS-e
POST /nfse
Content-Type: application/json
x-api-key: {token}

# Consultar NFS-e
GET /nfse/{id}

# Download XML
GET /nfse/{id}/xml

# Download PDF
GET /nfse/{id}/pdf

# Cancelar NFS-e
POST /nfse/{id}/cancelar
{
  "justificativa": "Motivo do cancelamento"
}

# Listar cidades homologadas
GET /nfse/cidades

# Consultar cidade específica
GET /nfse/cidades/{codigoIBGE}
```

### 4.5 PlugNotas - MDF-e

```http
# Emitir MDF-e
POST /mdfe
Content-Type: application/json
x-api-key: {token}

# Consultar MDF-e
GET /mdfe/{id}

# Download XML
GET /mdfe/{id}/xml

# Download PDF (DAMDFE)
GET /mdfe/{id}/pdf

# Encerrar MDF-e
POST /mdfe/{id}/encerrar
{
  "codigoCidade": "4115200",
  "estado": "PR"
}

# Cancelar MDF-e (até 24h)
POST /mdfe/{id}/cancelar
{
  "justificativa": "Motivo do cancelamento"
}

# Incluir condutor
POST /mdfe/{id}/condutor
{
  "nome": "NOME DO CONDUTOR",
  "cpf": "00000000000"
}

# Incluir DF-e
POST /mdfe/{id}/dfe
{
  "municipioCarregamento": "4115200",
  "chaveAcesso": "41..."
}
```

### 4.6 PlugStorage - Consultas

```http
# Listar chaves de notas (v1)
GET /invoices/keys?token={token}&cpf_cnpj={cnpj}

# Listar chaves de notas (v2 - com filtros)
GET /v2/invoices/keys
    ?token={token}
    &cpf_cnpj={cnpj}
    &date_ini={AAAA-MM-DD}
    &date_end={AAAA-MM-DD}
    &mod={NFE|CTE|NFCE|CCE|SAT|CTEOS}
    &transaction={received|sent|other|all}
    &limit={numero}
    &last_id={ultimo_id}
    &environment={1|2}
    &manifests={1}
    &resume={true|false}
    &cnpj_cpf_recipient={cnpj}

# Download XML
GET /invoices/xml/{chave}?token={token}
Authorization: Basic {base64(login:senha)}

# Download PDF/DANFE
GET /invoices/pdf/{chave}?token={token}
Authorization: Basic {base64(login:senha)}

# Upload XML (importação manual)
POST /invoices?token={token}
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(login:senha)}

xml={xml_completo}
```

### 4.7 PlugStorage - Manifestação

```http
# Manifestar nota (via API)
POST /invoices/manifest?token={token}
Authorization: Basic {base64(login:senha)}
Content-Type: application/json

{
  "chave": "41200000000000000000550010000000011000000019",
  "tipo": "CIENCIA",
  "justificativa": "" // obrigatório para DESCONHECIMENTO e NAO_REALIZADA
}

# Tipos válidos:
# - CIENCIA (210210)
# - CONFIRMAR (210200)
# - DESCONHECIMENTO (210220)
# - NAO_REALIZADA (210240)
```

---

## 5. EXEMPLOS DE JSON

### 5.1 NF-e Completa (Venda)

```json
[{
  "idIntegracao": "VENDA-2025-001234",
  "presencial": false,
  "natureza": "VENDA",
  "finalidade": "NORMAL",
  "consumidorFinal": true,
  "dataEmissao": "2025-12-12T10:30:00-03:00",
  "emitente": {
    "cpfCnpj": "00000000000000"
  },
  "destinatario": {
    "cpfCnpj": "11111111111111",
    "razaoSocial": "CLIENTE TESTE LTDA",
    "email": "cliente@teste.com.br",
    "indicadorContribuinte": "1",
    "inscricaoEstadual": "123456789",
    "endereco": {
      "tipoLogradouro": "RUA",
      "logradouro": "DAS FLORES",
      "numero": "500",
      "complemento": "SALA 10",
      "bairro": "CENTRO",
      "codigoCidade": "4115200",
      "descricaoCidade": "MARINGÁ",
      "estado": "PR",
      "cep": "87000000",
      "codigoPais": "1058",
      "descricaoPais": "BRASIL",
      "telefone": "4433331234"
    }
  },
  "itens": [{
    "codigo": "PROD-001",
    "descricao": "PLACA DE GESSO DRYWALL 1200X2400MM",
    "ncm": "68091900",
    "cest": "1000100",
    "cfop": "5102",
    "unidade": "UN",
    "quantidade": 50,
    "valorUnitario": 45.00,
    "valorDesconto": 0,
    "informacoesAdicionais": "Placa standard 12,5mm",
    "tributos": {
      "icms": {
        "origem": "0",
        "cst": "00",
        "aliquota": 18,
        "baseCalculo": {
          "modalidade": "0",
          "valor": 2250.00
        }
      },
      "pis": {
        "cst": "01",
        "aliquota": 1.65,
        "baseCalculo": 2250.00
      },
      "cofins": {
        "cst": "01",
        "aliquota": 7.60,
        "baseCalculo": 2250.00
      },
      "ipi": {
        "cst": "50",
        "aliquota": 0,
        "baseCalculo": 0
      }
    }
  }],
  "transporte": {
    "modalidade": "9",
    "volumes": [{
      "quantidade": 50,
      "especie": "PACOTE",
      "marca": "DRYWALL",
      "numeracao": "1",
      "pesoLiquido": 500.00,
      "pesoBruto": 550.00
    }]
  },
  "pagamentos": [{
    "aVista": true,
    "tipo": "DINHEIRO",
    "valor": 2250.00
  }],
  "informacoesComplementares": "Venda de materiais de construção",
  "responsavelTecnico": {
    "cpfCnpj": "00000000000000",
    "contato": "SUPORTE",
    "email": "suporte@software.com.br",
    "telefone": "4433339999",
    "idCsrt": "1",
    "hashCsrt": "ABCDEF..."
  }
}]
```

### 5.2 NFC-e (PDV)

```json
[{
  "idIntegracao": "PDV-001-2025121201",
  "presencial": true,
  "natureza": "VENDA",
  "finalidade": "NORMAL",
  "consumidorFinal": true,
  "emitente": {
    "cpfCnpj": "00000000000000"
  },
  "destinatario": {
    "cpfCnpj": "00000000000"
  },
  "itens": [{
    "codigo": "001",
    "descricao": "PRODUTO TESTE",
    "ncm": "94036000",
    "cfop": "5102",
    "unidade": "UN",
    "quantidade": 2,
    "valorUnitario": 50.00,
    "tributos": {
      "icms": {
        "origem": "0",
        "cst": "00",
        "aliquota": 18,
        "baseCalculo": {
          "modalidade": "0",
          "valor": 100.00
        }
      }
    }
  }],
  "pagamentos": [{
    "aVista": true,
    "tipo": "PIX",
    "valor": 100.00
  }]
}]
```

### 5.3 NFS-e (Serviço)

```json
[{
  "idIntegracao": "SERVICO-2025-001",
  "prestador": {
    "cpfCnpj": "00000000000000"
  },
  "tomador": {
    "cpfCnpj": "11111111111111",
    "razaoSocial": "CLIENTE SERVICO LTDA",
    "email": "cliente@servico.com.br",
    "endereco": {
      "logradouro": "Av. Brasil",
      "numero": "1000",
      "bairro": "Centro",
      "codigoCidade": "4115200",
      "descricaoCidade": "MARINGÁ",
      "estado": "PR",
      "cep": "87000000"
    }
  },
  "servico": [{
    "codigo": "1.02",
    "idIntegracao": "SRV-001",
    "discriminacao": "Serviços de instalação de drywall",
    "cnae": "4330499",
    "codigoTributacao": "4115200",
    "iss": {
      "aliquota": 5.00,
      "tipoTributacao": "1",
      "exigibilidade": "1"
    },
    "valor": {
      "servico": 5000.00,
      "baseCalculo": 5000.00
    },
    "retencao": {
      "pis": {
        "aliquota": 0.65,
        "valor": 32.50
      },
      "cofins": {
        "aliquota": 3.00,
        "valor": 150.00
      },
      "csll": {
        "aliquota": 1.00,
        "valor": 50.00
      },
      "irrf": {
        "aliquota": 1.50,
        "valor": 75.00
      },
      "inss": {
        "aliquota": 11.00,
        "valor": 550.00
      }
    }
  }]
}]
```

### 5.4 MDF-e (Manifesto)

```json
[{
  "serie": "1",
  "tipoEmitente": "1",
  "modalidadeDeTransporte": "1",
  "tipoTransportador": "1",
  "emitente": {
    "cpfCnpj": "00000000000000"
  },
  "carregamento": [{
    "codigoCidade": "4115200",
    "descricaoCidade": "MARINGÁ"
  }],
  "descarregamento": [{
    "codigoCidade": "3550308",
    "descricaoCidade": "SÃO PAULO",
    "documentos": {
      "nfe": [{
        "chaveAcesso": "41251200000000000000550010000000011000000019"
      }]
    }
  }],
  "total": {
    "quantidadeNfe": 1,
    "quantidadeCte": 0,
    "valorCarga": 10000.00,
    "unidadeMedidaPesoBruto": "KG",
    "pesoBruto": 1500.00
  },
  "modalRodoviario": {
    "rntrc": "12345678",
    "veiculo": {
      "placa": "ABC1234",
      "renavam": "123456789",
      "tara": 3000,
      "capacidadeKg": 5000,
      "capacidadeM3": 20,
      "tipoRodado": "02",
      "tipoCarroceria": "00",
      "uf": "PR",
      "condutor": [{
        "nome": "MOTORISTA TESTE",
        "cpf": "00000000000"
      }]
    }
  },
  "seguro": {
    "responsavel": "1",
    "seguradora": {
      "cnpj": "00000000000000",
      "nome": "SEGURADORA TESTE"
    },
    "apolice": "123456",
    "averbacao": "654321"
  }
}]
```

---

## 6. WEBHOOKS E NOTIFICAÇÕES

### 6.1 Configuração de Webhook

```http
# Cadastrar webhook global (todos os CNPJs)
POST /webhook
Content-Type: application/json
x-api-key: {token}

{
  "url": "https://api.planac.com.br/webhook/plugnotas",
  "eventos": ["AUTORIZADO", "REJEITADO", "CANCELADO"]
}

# Cadastrar webhook por CNPJ
POST /webhook
{
  "url": "https://api.planac.com.br/webhook/plugnotas/{cnpj}",
  "cpfCnpj": "00000000000000",
  "eventos": ["AUTORIZADO", "REJEITADO", "CANCELADO"]
}

# Listar webhooks
GET /webhook

# Remover webhook
DELETE /webhook/{id}
```

### 6.2 Payload do Webhook

```json
{
  "id": "abc123-def456-ghi789",
  "idIntegracao": "VENDA-2025-001234",
  "status": "CONCLUIDO",
  "documento": "NFE",
  "cpfCnpjEmitente": "00000000000000",
  "chaveAcesso": "41251200000000000000550010000000011000000019",
  "numero": "1",
  "serie": "1",
  "dataAutorizacao": "2025-12-12T10:35:00-03:00",
  "protocolo": "141250000000001",
  "xml": "https://api.plugnotas.com.br/nfe/abc123/xml",
  "pdf": "https://api.plugnotas.com.br/nfe/abc123/pdf"
}
```

### 6.3 Eventos Disponíveis

| Evento | Descrição |
|--------|-----------|
| `AUTORIZADO` | Nota autorizada pela SEFAZ |
| `REJEITADO` | Nota rejeitada (erro SEFAZ ou validação) |
| `CANCELADO` | Cancelamento autorizado |
| `CCE` | Carta de correção autorizada |
| `INUTILIZADO` | Numeração inutilizada |

### 6.4 Retentativas

- 3 tentativas em caso de falha
- Intervalos: 1min, 5min, 15min
- Resposta esperada: HTTP 200

---

## 7. FLUXOS DE INTEGRAÇÃO

### 7.1 Fluxo Completo de Venda (NF-e)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE VENDA - NF-e                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [PLANAC ERP]                                                    │
│       │                                                          │
│       ▼                                                          │
│  1. Montar pedido de venda                                       │
│       │                                                          │
│       ▼                                                          │
│  2. Gerar JSON da NF-e                                           │
│       │                                                          │
│       ▼                                                          │
│  3. POST /nfe ───────────────────▶ [PLUGNOTAS]                  │
│       │                                   │                      │
│       │                                   ▼                      │
│       │                           Valida JSON                    │
│       │                                   │                      │
│       │                                   ▼                      │
│       │                           Monta XML                      │
│       │                                   │                      │
│       │                                   ▼                      │
│       │                           Assina XML                     │
│       │                                   │                      │
│       │                                   ▼                      │
│       │                           Envia SEFAZ                    │
│       │                                   │                      │
│       │◀──────────────────────────────────┘                      │
│       │  Retorna ID                                              │
│       │                                                          │
│       ▼                                                          │
│  4. Salvar ID no banco                                           │
│       │                                                          │
│       ▼                                                          │
│  5. Aguardar webhook OU polling                                  │
│       │                                                          │
│       ├───▶ AUTORIZADO                                           │
│       │         │                                                │
│       │         ▼                                                │
│       │    Baixar XML/PDF                                        │
│       │         │                                                │
│       │         ▼                                                │
│       │    Armazenar R2                                          │
│       │         │                                                │
│       │         ▼                                                │
│       │    Atualizar status pedido                               │
│       │         │                                                │
│       │         ▼                                                │
│       │    Enviar e-mail cliente                                 │
│       │                                                          │
│       └───▶ REJEITADO                                            │
│                 │                                                │
│                 ▼                                                │
│            Analisar erro                                         │
│                 │                                                │
│                 ▼                                                │
│            Corrigir dados                                        │
│                 │                                                │
│                 ▼                                                │
│            Reenviar NF-e                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Fluxo de Entrada de Mercadoria (DFe)

```
┌─────────────────────────────────────────────────────────────────┐
│                FLUXO DE ENTRADA - DFe                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [PLUGSTORAGE]                                                   │
│       │                                                          │
│       ▼                                                          │
│  1. Consulta automática SEFAZ (via NSU)                          │
│       │                                                          │
│       ▼                                                          │
│  2. Armazena notas resumidas                                     │
│       │                                                          │
│       ▼                                                          │
│  [PLANAC ERP]                                                    │
│       │                                                          │
│       ▼                                                          │
│  3. GET /v2/invoices/keys (notas destinadas)                     │
│       │                                                          │
│       ▼                                                          │
│  4. Exibir lista de notas pendentes                              │
│       │                                                          │
│       ▼                                                          │
│  5. Usuário seleciona nota para entrada                          │
│       │                                                          │
│       ▼                                                          │
│  6. POST /invoices/manifest (CIENCIA)                            │
│       │                                                          │
│       ▼                                                          │
│  7. GET /invoices/xml/{chave}                                    │
│       │                                                          │
│       ▼                                                          │
│  8. Parser XML - Extrair dados:                                  │
│       │  - Itens (código, descrição, quantidade, valor)          │
│       │  - ICMS (base, alíquota, valor, ST)                      │
│       │  - PIS (CST, base, alíquota, valor)                      │
│       │  - COFINS (CST, base, alíquota, valor)                   │
│       │  - IPI (CST, base, alíquota, valor)                      │
│       │  - Frete, seguro, desconto                               │
│       │                                                          │
│       ▼                                                          │
│  9. Vincular produtos (código fornecedor → código interno)       │
│       │                                                          │
│       ▼                                                          │
│  10. Gerar entrada de mercadoria                                 │
│       │                                                          │
│       ▼                                                          │
│  11. Atualizar estoque                                           │
│       │                                                          │
│       ▼                                                          │
│  12. Lançar contas a pagar (se aplicável)                        │
│       │                                                          │
│       ▼                                                          │
│  13. Contabilizar créditos fiscais                               │
│       │                                                          │
│       ▼                                                          │
│  14. POST /invoices/manifest (CONFIRMAR) - definitivo            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. TRATAMENTO DE ERROS

### 8.1 Códigos de Erro PlugNotas

```json
{
  "error": {
    "message": "Falha na validação do JSON de NFe",
    "data": {
      "fields": {
        "documento[0].itens[0].cest": "Tamanho mínimo (sem máscara): 7",
        "documento[0].destinatario.cpfCnpj": "Preenchimento obrigatório"
      }
    }
  }
}
```

### 8.2 Rejeições SEFAZ Comuns

| Código | Descrição | Solução |
|--------|-----------|---------|
| 204 | Duplicidade de NF-e | Verificar se já foi emitida |
| 217 | CNPJ do destinatário não cadastrado | Validar CNPJ |
| 301 | Uso denegado | Verificar situação cadastral |
| 539 | Duplicidade de número | Inutilizar ou usar próximo |
| 564 | Total de tributos difere | Recalcular tributos |
| 690 | NF-e referenciada em CT-e/MDF-e | Cancelar CT-e/MDF-e primeiro |

### 8.3 Tratamento Recomendado

```javascript
async function emitirNFe(dadosNota) {
  try {
    const response = await fetch('https://api.plugnotas.com.br/nfe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PLUGNOTAS_TOKEN
      },
      body: JSON.stringify([dadosNota])
    });

    const result = await response.json();

    if (response.status === 200) {
      // Nota aceita para processamento
      return {
        success: true,
        id: result.documents[0].id,
        status: 'PROCESSANDO'
      };
    } else if (response.status === 400) {
      // Erro de validação
      return {
        success: false,
        error: 'VALIDACAO',
        campos: result.error.data.fields
      };
    } else if (response.status === 401) {
      // Token inválido
      return {
        success: false,
        error: 'AUTENTICACAO'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'CONEXAO',
      message: error.message
    };
  }
}
```

---

## 9. IMPLEMENTAÇÃO PLANAC

### 9.1 Estrutura de Service

```typescript
// src/api/src/services/tecnospeed.service.ts

interface TecnoSpeedConfig {
  plugnotasToken: string;
  plugstorageToken: string;
  plugstorageLogin: string;
  plugstorageSenha: string;
  ambiente: 'sandbox' | 'producao';
}

interface EmissaoResult {
  success: boolean;
  id?: string;
  status?: string;
  error?: string;
  campos?: Record<string, string>;
}

export class TecnoSpeedService {
  private config: TecnoSpeedConfig;
  private baseUrlPlugNotas: string;
  private baseUrlPlugStorage: string;

  constructor(config: TecnoSpeedConfig) {
    this.config = config;
    this.baseUrlPlugNotas = config.ambiente === 'sandbox'
      ? 'https://api.sandbox.plugnotas.com.br'
      : 'https://api.plugnotas.com.br';
    this.baseUrlPlugStorage = 'https://app.plugstorage.com.br/api';
  }

  // ==================== PLUGNOTAS ====================

  async emitirNFe(nota: NFeDados): Promise<EmissaoResult> {
    // ...
  }

  async emitirNFCe(nota: NFCeDados): Promise<EmissaoResult> {
    // ...
  }

  async emitirNFSe(nota: NFSeDados): Promise<EmissaoResult> {
    // ...
  }

  async emitirMDFe(manifesto: MDFeDados): Promise<EmissaoResult> {
    // ...
  }

  async consultarNota(tipo: 'nfe' | 'nfce' | 'nfse' | 'mdfe', id: string) {
    // ...
  }

  async cancelarNota(tipo: string, id: string, justificativa: string) {
    // ...
  }

  async cartaCorrecao(tipo: string, id: string, correcao: string) {
    // ...
  }

  async downloadXML(tipo: string, id: string): Promise<string> {
    // ...
  }

  async downloadPDF(tipo: string, id: string): Promise<Buffer> {
    // ...
  }

  // ==================== PLUGSTORAGE ====================

  async listarNotasDestinadas(cnpj: string, filtros: FiltrosDestinadas) {
    // ...
  }

  async manifestarNota(chave: string, tipo: TipoManifestacao, justificativa?: string) {
    // ...
  }

  async downloadXMLEntrada(chave: string): Promise<string> {
    // ...
  }

  async processarXMLEntrada(xml: string): Promise<DadosNotaEntrada> {
    // Parser XML para extrair dados fiscais
  }
}
```

### 9.2 Tabelas D1 Necessárias

```sql
-- Configurações por empresa
CREATE TABLE empresa_fiscal_config (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  plugnotas_token TEXT,
  plugstorage_token TEXT,
  plugstorage_login TEXT,
  plugstorage_senha TEXT,
  ambiente TEXT DEFAULT 'homologacao',
  certificado_validade DATE,
  ultimo_nsu TEXT DEFAULT '000000000000000',
  webhook_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Notas fiscais emitidas
CREATE TABLE notas_fiscais (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- NFE, NFCE, NFSE, MDFE
  id_integracao TEXT NOT NULL,
  id_plugnotas TEXT,
  numero INTEGER,
  serie TEXT,
  chave_acesso TEXT,
  status TEXT DEFAULT 'PROCESSANDO',
  data_emissao DATETIME,
  data_autorizacao DATETIME,
  protocolo TEXT,
  xml_url TEXT,
  pdf_url TEXT,
  xml_r2_key TEXT,
  pdf_r2_key TEXT,
  valor_total REAL,
  destinatario_cnpj TEXT,
  destinatario_nome TEXT,
  natureza_operacao TEXT,
  dados_json TEXT,
  erro_mensagem TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Notas de entrada (destinadas)
CREATE TABLE notas_entrada (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- NFE, CTE
  chave_acesso TEXT UNIQUE NOT NULL,
  numero INTEGER,
  serie TEXT,
  emitente_cnpj TEXT,
  emitente_nome TEXT,
  data_emissao DATETIME,
  valor_total REAL,
  status_manifestacao TEXT, -- PENDENTE, CIENCIA, CONFIRMADO, etc
  data_manifestacao DATETIME,
  xml_completo INTEGER DEFAULT 0,
  xml_r2_key TEXT,
  entrada_mercadoria_id TEXT,
  dados_fiscais_json TEXT, -- ICMS, PIS, COFINS extraídos
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Log de eventos fiscais
CREATE TABLE fiscal_eventos_log (
  id TEXT PRIMARY KEY,
  nota_id TEXT,
  nota_entrada_id TEXT,
  tipo_evento TEXT NOT NULL,
  status TEXT,
  mensagem TEXT,
  dados_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 9.3 Endpoints API PLANAC

```typescript
// Rotas fiscais a implementar

// EMISSÃO
POST   /api/fiscal/nfe              // Emitir NF-e
POST   /api/fiscal/nfce             // Emitir NFC-e
POST   /api/fiscal/nfse             // Emitir NFS-e
POST   /api/fiscal/mdfe             // Emitir MDF-e

// CONSULTAS
GET    /api/fiscal/notas            // Listar notas emitidas
GET    /api/fiscal/notas/:id        // Consultar nota específica
GET    /api/fiscal/notas/:id/xml    // Download XML
GET    /api/fiscal/notas/:id/pdf    // Download PDF

// EVENTOS
POST   /api/fiscal/notas/:id/cancelar   // Cancelar nota
POST   /api/fiscal/notas/:id/cce        // Carta de correção
POST   /api/fiscal/nfe/inutilizar       // Inutilizar numeração

// ENTRADA (DFe)
GET    /api/fiscal/entrada/destinadas       // Listar notas destinadas
POST   /api/fiscal/entrada/:chave/manifestar // Manifestar nota
GET    /api/fiscal/entrada/:chave/xml       // Download XML entrada
POST   /api/fiscal/entrada/:chave/processar // Processar entrada

// WEBHOOK
POST   /api/webhook/plugnotas       // Receber notificações

// CONFIG
GET    /api/fiscal/config           // Configurações fiscais
PUT    /api/fiscal/config           // Atualizar configurações
POST   /api/fiscal/certificado      // Upload certificado
```

---

## 📌 CONCLUSÃO

Este documento detalha toda a integração fiscal com TecnoSpeed para o PLANAC ERP:

1. **PlugNotas** - Emissão de NF-e, NFC-e, NFS-e, MDF-e via API REST
2. **PlugStorage** - Captação de notas de entrada (DFe) e armazenamento

### Próximos Passos:

1. ✅ Documentação completa (este documento)
2. ⏳ Contratar TecnoSpeed (PlugNotas + PlugStorage)
3. ⏳ Obter tokens de produção
4. ⏳ Implementar `tecnospeed.service.ts`
5. ⏳ Criar tabelas D1
6. ⏳ Implementar endpoints API
7. ⏳ Configurar webhook
8. ⏳ Testes em homologação
9. ⏳ Go-live produção

---

**Documento gerado em:** 12/12/2025  
**Projeto:** PLANAC ERP Multi-tenant  
**Autor:** Claude (DEV.com Orquestrador)
