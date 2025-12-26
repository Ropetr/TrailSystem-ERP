# 🔌 API - Módulo Cadastros

**Última atualização:** 26/12/2025  
**Base URL:** `/api/v1`

---

## 👥 Clientes

### Listar Clientes
```http
GET /clientes
```

**Query Parameters:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `page` | number | Página (default: 1) |
| `limit` | number | Itens por página (default: 20) |
| `search` | string | Busca por nome/CPF/CNPJ |
| `tipo` | string | PF ou PJ |
| `ativo` | boolean | Filtrar ativos/inativos |
| `vendedor_id` | string | Filtrar por vendedor |

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "pages": 25
  }
}
```

### Buscar Cliente por ID
```http
GET /clientes/:id
```

### Criar Cliente
```http
POST /clientes
```

**Body:**
```json
{
  "tipo": "PJ",
  "nome_razao": "Empresa Exemplo LTDA",
  "apelido_fantasia": "Empresa Exemplo",
  "cpf_cnpj": "12.345.678/0001-90",
  "email": "contato@empresa.com",
  "telefone": "(43) 3333-4444",
  "vendedor_id": "uuid",
  "tabela_preco_id": "uuid"
}
```

### Atualizar Cliente
```http
PUT /clientes/:id
```

### Excluir Cliente (Soft Delete)
```http
DELETE /clientes/:id
```

---

## 📍 Endereços do Cliente

### Listar Endereços
```http
GET /clientes/:cliente_id/enderecos
```

### Adicionar Endereço
```http
POST /clientes/:cliente_id/enderecos
```

**Body:**
```json
{
  "tipo": "entrega",
  "cep": "86000-000",
  "logradouro": "Rua Exemplo",
  "numero": "123",
  "bairro": "Centro",
  "cidade": "Londrina",
  "uf": "PR",
  "principal": true
}
```

### Atualizar Endereço
```http
PUT /clientes/:cliente_id/enderecos/:id
```

### Remover Endereço
```http
DELETE /clientes/:cliente_id/enderecos/:id
```

---

## 👤 Contatos do Cliente

### Listar Contatos
```http
GET /clientes/:cliente_id/contatos
```

### Adicionar Contato
```http
POST /clientes/:cliente_id/contatos
```

**Body:**
```json
{
  "nome": "João Silva",
  "cargo": "Comprador",
  "email": "joao@empresa.com",
  "telefone": "(43) 99999-8888",
  "principal": true
}
```

---

## 📦 Produtos

### Listar Produtos
```http
GET /produtos
```

**Query Parameters:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `search` | string | Busca por descrição/código |
| `categoria_id` | string | Filtrar por categoria |
| `tipo` | string | PRODUTO ou SERVICO |
| `ativo` | boolean | Filtrar ativos |

### Buscar Produto
```http
GET /produtos/:id
```

### Buscar por Código de Barras
```http
GET /produtos/codigo-barras/:codigo
```

### Criar Produto
```http
POST /produtos
```

### Atualizar Produto
```http
PUT /produtos/:id
```

---

## 🏭 Fornecedores

### Listar Fornecedores
```http
GET /fornecedores
```

### Buscar Fornecedor
```http
GET /fornecedores/:id
```

### Criar Fornecedor
```http
POST /fornecedores
```

### Atualizar Fornecedor
```http
PUT /fornecedores/:id
```

---

## 👤 Usuários

### Listar Usuários
```http
GET /usuarios
```

### Criar Usuário
```http
POST /usuarios
```

### Atualizar Usuário
```http
PUT /usuarios/:id
```

### Alterar Senha
```http
PUT /usuarios/:id/senha
```

---

## 🔐 Perfis

### Listar Perfis
```http
GET /perfis
```

### Criar Perfil
```http
POST /perfis
```

### Atualizar Permissões
```http
PUT /perfis/:id/permissoes
```

---

## 🔍 Consultas Externas

### Consultar CNPJ
```http
GET /consultas/cnpj/:cnpj
```
> Integração com CPF.CNPJ ou CNPJá

### Consultar CEP
```http
GET /consultas/cep/:cep
```
> Integração com ViaCEP
