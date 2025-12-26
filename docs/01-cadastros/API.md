# 🔌 API - Módulo Cadastros

## Base URL

```
https://api.trailsystem.com.br/v1
```

---

# 👥 CLIENTES

## Endpoints

### GET /clientes

Lista clientes com filtros e paginação.

**Query Parameters:**
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| page | number | 1 | Página atual |
| limit | number | 20 | Itens por página (max 100) |
| search | string | - | Busca por nome, CNPJ/CPF, código |
| tipo | string | - | `pf` ou `pj` |
| status | string | - | `ativo`, `inativo`, `bloqueado` |
| vendedor_id | string | - | UUID do vendedor |
| tipologia | string | - | `profissional`, `consumidor_final` |
| contribuinte | string | - | `sim`, `nao` |
| sort | string | nome | Campo para ordenação |
| order | string | asc | `asc` ou `desc` |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "codigo": "012345",
      "tipo": "pj",
      "documento": "02.953.009/0001-42",
      "nome": "COMERCIAL RSZ LTDA",
      "nome_fantasia": "RSZ Materiais",
      "cidade": "Maringá",
      "uf": "PR",
      "telefone": "(44) 3027-1234",
      "status": "ativo",
      "limite_credito": 50000.00,
      "saldo_devedor": 12350.00,
      "vendedor": {
        "id": "uuid",
        "nome": "Carlos Silva"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### GET /clientes/:id

Obtém cliente completo por ID.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "codigo": "012345",
    "tipo": "pj",
    "documento": "02.953.009/0001-42",
    "razao_social": "COMERCIAL R S Z LTDA",
    "nome_fantasia": "RSZ Materiais",
    "inscricao_estadual": "123.456.789",
    "inscricao_municipal": null,
    "contribuinte_icms": "contribuinte",
    "tipologia": "profissional",
    "origem": "indicacao",
    "parceiro_indicador_id": "uuid",
    "status": "ativo",
    "bloqueado": false,
    "motivo_bloqueio": null,
    "data_bloqueio": null,
    
    "enderecos": [
      {
        "id": "uuid",
        "tipo": "principal",
        "cep": "87020-000",
        "logradouro": "Av. Brasil",
        "numero": "1500",
        "complemento": "Sala 10",
        "bairro": "Centro",
        "cidade": "Maringá",
        "uf": "PR",
        "codigo_ibge": "4115200",
        "referencia": null,
        "principal": true
      }
    ],
    
    "contatos": [
      {
        "id": "uuid",
        "nome": "João da Silva",
        "cargo": "comprador",
        "email": "joao@empresa.com.br",
        "telefone": "(44) 3027-1234",
        "celular": "(44) 99999-1234",
        "whatsapp": true,
        "principal": true,
        "notificacoes": {
          "orcamentos": true,
          "pedidos": true,
          "nfe": true,
          "boletos": false,
          "vencimentos": false,
          "cobrancas": false
        }
      }
    ],
    
    "comercial": {
      "vendedor_id": "uuid",
      "tabela_preco_id": "uuid",
      "condicao_pagamento_id": "uuid",
      "limite_credito": 50000.00,
      "desconto_maximo": 10.00,
      "comissao_vendedor": 5.00
    },
    
    "financeiro": {
      "saldo_devedor": 12350.00,
      "saldo_disponivel": 37650.00,
      "titulos_vencidos": 1,
      "valor_vencido": 2500.00,
      "maior_atraso_dias": 3
    },
    
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2025-12-20T14:25:00Z"
  }
}
```

---

### POST /clientes

Cria novo cliente.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (PJ):**
```json
{
  "tipo": "pj",
  "documento": "02.953.009/0001-42",
  "razao_social": "COMERCIAL R S Z LTDA",
  "nome_fantasia": "RSZ Materiais",
  "inscricao_estadual": "123.456.789",
  "inscricao_municipal": null,
  "contribuinte_icms": "contribuinte",
  "tipologia": "profissional",
  "origem": "indicacao",
  "parceiro_indicador_id": "uuid-parceiro",
  
  "enderecos": [
    {
      "tipo": "principal",
      "cep": "87020-000",
      "logradouro": "Av. Brasil",
      "numero": "1500",
      "complemento": "Sala 10",
      "bairro": "Centro",
      "cidade": "Maringá",
      "uf": "PR",
      "codigo_ibge": "4115200",
      "principal": true
    }
  ],
  
  "contatos": [
    {
      "nome": "João da Silva",
      "cargo": "comprador",
      "email": "joao@empresa.com.br",
      "celular": "(44) 99999-1234",
      "whatsapp": true,
      "principal": true
    }
  ],
  
  "comercial": {
    "vendedor_id": "uuid",
    "tabela_preco_id": "uuid",
    "condicao_pagamento_id": "uuid",
    "limite_credito": 0
  }
}
```

**Body (PF):**
```json
{
  "tipo": "pf",
  "documento": "123.456.789-00",
  "nome": "Maria da Silva",
  "rg": "12.345.678-9",
  "data_nascimento": "1985-03-15",
  "sexo": "feminino",
  "tipologia": "consumidor_final",
  "origem": "anuncios",
  
  "enderecos": [...],
  "contatos": [...],
  "comercial": {
    "vendedor_id": "uuid",
    "tabela_preco_id": "uuid"
  }
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Cliente criado com sucesso",
  "data": {
    "id": "uuid",
    "codigo": "012346"
  }
}
```

**Response 400:**
```json
{
  "success": false,
  "error": "CNPJ já cadastrado",
  "field": "documento"
}
```

---

### PUT /clientes/:id

Atualiza cliente existente.

**Body:** (campos a atualizar)
```json
{
  "nome_fantasia": "RSZ Materiais de Construção",
  "comercial": {
    "limite_credito": 75000.00
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cliente atualizado com sucesso"
}
```

---

### DELETE /clientes/:id

Inativa cliente (soft delete).

**Response 200:**
```json
{
  "success": true,
  "message": "Cliente inativado com sucesso"
}
```

**Response 403:**
```json
{
  "success": false,
  "error": "Sem permissão para inativar clientes"
}
```

---

## Endpoints de Endereços

### POST /clientes/:id/enderecos

Adiciona novo endereço.

**Body:**
```json
{
  "tipo": "entrega",
  "cep": "87030-100",
  "logradouro": "Rua das Flores",
  "numero": "200",
  "bairro": "Zona 7",
  "cidade": "Maringá",
  "uf": "PR",
  "codigo_ibge": "4115200",
  "principal": false
}
```

### PUT /clientes/:id/enderecos/:endereco_id

Atualiza endereço.

### DELETE /clientes/:id/enderecos/:endereco_id

Remove endereço (não permite remover o único principal).

---

## Endpoints de Contatos

### POST /clientes/:id/contatos

Adiciona novo contato.

**Body:**
```json
{
  "nome": "Maria Santos",
  "cargo": "financeiro",
  "email": "financeiro@empresa.com.br",
  "celular": "(44) 98888-5678",
  "whatsapp": true,
  "principal": false,
  "notificacoes": {
    "boletos": true,
    "vencimentos": true,
    "cobrancas": true,
    "nfe": true
  }
}
```

### PUT /clientes/:id/contatos/:contato_id

Atualiza contato.

### DELETE /clientes/:id/contatos/:contato_id

Remove contato (não permite remover o único principal).

---

## Endpoints de Bloqueio

### POST /clientes/:id/bloquear

Bloqueia cliente manualmente.

**Body:**
```json
{
  "motivo": "Solicitação da diretoria"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cliente bloqueado com sucesso"
}
```

---

### POST /clientes/:id/desbloquear

Desbloqueia cliente (requer perfil Gerente+).

**Body:**
```json
{
  "justificativa": "Cliente regularizou pendências financeiras"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cliente desbloqueado com sucesso"
}
```

**Response 403:**
```json
{
  "success": false,
  "error": "Apenas gerentes podem desbloquear clientes"
}
```

---

## Endpoints Auxiliares

### GET /clientes/:id/historico

Obtém histórico de vendas do cliente.

**Query Parameters:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| tipo | string | `orcamentos`, `vendas`, `devolucoes` |
| page | number | Página |
| limit | number | Itens por página |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "resumo": {
      "total_compras": 125000.00,
      "quantidade_pedidos": 45,
      "ticket_medio": 2777.78,
      "ultima_compra": "2025-12-15"
    },
    "vendas": [
      {
        "id": "uuid",
        "numero": "12345",
        "data": "2025-12-15",
        "valor": 5500.00,
        "status": "faturado"
      }
    ]
  }
}
```

---

### GET /clientes/:id/titulos

Lista títulos em aberto do cliente.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nf_numero": "12345",
      "parcela": "1/3",
      "vencimento": "2025-12-22",
      "valor": 2500.00,
      "status": "vencido",
      "dias_atraso": 3
    }
  ]
}
```

---

### POST /clientes/consultar-cnpj

Consulta dados de CNPJ na Receita Federal via CNPJá.

**Body:**
```json
{
  "cnpj": "02.953.009/0001-42"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "cnpj": "02953009000142",
    "razao_social": "COMERCIAL R S Z LTDA",
    "nome_fantasia": "RSZ MATERIAIS",
    "situacao": "ATIVA",
    "endereco": {
      "logradouro": "AV BRASIL",
      "numero": "1500",
      "bairro": "CENTRO",
      "cidade": "MARINGA",
      "uf": "PR",
      "cep": "87020000"
    }
  }
}
```

---

### POST /clientes/validar-cpf

Valida CPF.

**Body:**
```json
{
  "cpf": "123.456.789-00"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "valido": true
  }
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Dados inválidos |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Cliente não encontrado |
| 409 | CNPJ/CPF já cadastrado |
| 422 | Validação falhou |
| 500 | Erro interno |

---

## Permissões

| Endpoint | Vendedor | Gerente | Admin | Financeiro |
|----------|----------|---------|-------|------------|
| GET /clientes | ✅ | ✅ | ✅ | ✅ |
| GET /clientes/:id | ✅ | ✅ | ✅ | ✅ |
| POST /clientes | ✅ | ✅ | ✅ | ❌ |
| PUT /clientes/:id | ✅ | ✅ | ✅ | ❌ |
| DELETE /clientes/:id | ❌ | ✅ | ✅ | ❌ |
| POST /bloquear | ❌ | ✅ | ✅ | ❌ |
| POST /desbloquear | ❌ | ✅ | ✅ | ❌ |
| PUT limite_credito | ❌ | ✅ | ✅ | ✅ |

---

**Última atualização:** 26/12/2025
