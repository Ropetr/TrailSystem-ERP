# 🔌 API - Módulo Configurações

## Base URL

```
https://api.trailsystem.com.br/v1/configuracoes
```

---

## Endpoints

### GET /configuracoes

Lista todas as configurações da empresa logada.

**Query Parameters:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| categoria | string | Filtrar por categoria (empresa, comercial, fiscal, etc) |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "chave": "bloqueio_dias_atraso",
      "valor": "2",
      "tipo": "number",
      "categoria": "comercial",
      "descricao": "Dias de atraso para bloquear cliente"
    }
  ]
}
```

---

### GET /configuracoes/:categoria

Lista configurações de uma categoria específica.

**Path Parameters:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| categoria | string | empresa, comercial, fiscal, financeiro, estoque, email, whatsapp, integracoes, seguranca, sistema |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "bloqueio_ativo": true,
    "bloqueio_dias_atraso": 2,
    "bloqueio_quem_desbloqueia": "gerente",
    "credito_apenas_pj": true,
    "limite_padrao_pj": 0,
    "desconto_max_vendedor": 15,
    "validade_orcamento": 15,
    "cashback_ativo": true,
    "cashback_percentual": 2
  }
}
```

---

### PUT /configuracoes/:categoria

Atualiza configurações de uma categoria.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "bloqueio_dias_atraso": 3,
  "desconto_max_vendedor": 20
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Configurações atualizadas com sucesso",
  "data": {
    "bloqueio_dias_atraso": 3,
    "desconto_max_vendedor": 20
  }
}
```

**Response 403:**
```json
{
  "success": false,
  "error": "Sem permissão para alterar configurações desta categoria"
}
```

---

### GET /configuracoes/chave/:chave

Obtém valor de uma configuração específica.

**Path Parameters:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| chave | string | Nome da configuração (ex: bloqueio_dias_atraso) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "chave": "bloqueio_dias_atraso",
    "valor": 2,
    "tipo": "number"
  }
}
```

---

### PUT /configuracoes/chave/:chave

Atualiza uma configuração específica.

**Body:**
```json
{
  "valor": 5
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Configuração atualizada",
  "data": {
    "chave": "bloqueio_dias_atraso",
    "valor": 5
  }
}
```

---

## Endpoints Específicos

### POST /configuracoes/empresa/logo

Upload do logo da empresa.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body:**
```
logo: [arquivo PNG/JPG, max 500KB]
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "url": "https://r2.trailsystem.com.br/empresa/123/logo.png"
  }
}
```

---

### POST /configuracoes/integracoes/testar

Testa conexão com uma integração.

**Body:**
```json
{
  "integracao": "nuvem_fiscal",
  "credenciais": {
    "client_id": "xxx",
    "client_secret": "xxx"
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Conexão estabelecida com sucesso",
  "data": {
    "integracao": "nuvem_fiscal",
    "status": "conectado",
    "ambiente": "homologacao"
  }
}
```

---

### GET /configuracoes/sistema/jobs

Lista status dos jobs agendados.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "nome": "bloqueio_clientes",
      "descricao": "Bloqueio automático de clientes inadimplentes",
      "cron": "0 0 * * *",
      "ultima_execucao": "2025-12-26T00:00:05Z",
      "proxima_execucao": "2025-12-27T00:00:00Z",
      "status": "sucesso"
    },
    {
      "nome": "atualizar_ibpt",
      "descricao": "Atualização da tabela IBPT",
      "cron": "0 4 * * *",
      "ultima_execucao": "2025-12-26T04:00:12Z",
      "proxima_execucao": "2025-12-27T04:00:00Z",
      "status": "sucesso"
    }
  ]
}
```

---

### POST /configuracoes/sistema/backup

Executa backup manual do banco de dados.

**Response 200:**
```json
{
  "success": true,
  "message": "Backup iniciado",
  "data": {
    "id": "backup_20251226_103045",
    "status": "em_andamento"
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
| 404 | Configuração não encontrada |
| 500 | Erro interno |

---

## Permissões por Categoria

| Categoria | GET | PUT |
|-----------|-----|-----|
| empresa | Todos | Admin |
| comercial | Todos | Gerente+ |
| fiscal | Todos | Admin |
| financeiro | Financeiro+ | Financeiro+ |
| estoque | Todos | Gerente+ |
| email | Todos | Admin |
| whatsapp | Todos | Admin |
| integracoes | Admin | Admin |
| seguranca | Admin | Admin |
| sistema | Admin | Admin |

---

**Última atualização:** 26/12/2025
