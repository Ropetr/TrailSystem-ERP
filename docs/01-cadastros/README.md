# 👥 MÓDULO CADASTROS

**Última atualização:** 26/12/2025  
**Status:** 🟡 Em Desenvolvimento  
**Responsável:** Equipe Core

---

## 📋 Visão Geral

O módulo **CADASTROS** é o **dono centralizado** de todos os dados base do ERP. Outros módulos apenas **consomem** esses dados via seleção (dropdown, busca, autocomplete).

### Benefícios da Centralização
- ✅ Evita duplicidade de dados
- ✅ Facilita manutenção
- ✅ Garante integridade das informações
- ✅ Simplifica navegação para usuários

---

## 🗂️ Estrutura do Módulo

```
📁 CADASTROS (16 itens em 7 categorias)
│
├── 👥 ENTIDADES (5 itens)
│   ├── Clientes
│   ├── Fornecedores
│   ├── Transportadoras
│   ├── Colaboradores
│   └── Parceiros de Negócio
│
├── 📦 PRODUTOS (1 item)
│   └── Produtos e Serviços
│
├── 🏢 EMPRESA (1 item)
│   └── Matriz & Filiais
│
├── 🏦 FINANCEIRO (4 itens)
│   ├── Contas Bancárias
│   ├── Plano de Contas
│   ├── Centros de Custo
│   └── Condições de Pagamento
│
├── 🏷️ COMERCIAL (1 item)
│   └── Tabelas de Preço
│
├── 🚗 PATRIMÔNIO (2 itens)
│   ├── Veículos
│   └── Bens
│
└── 🔐 ACESSOS (2 itens)
    ├── Usuários
    └── Perfis de Usuários
```

---

## 📊 Status de Implementação

| Entidade | Listagem | Formulário | Múlt. Endereços | Múlt. Contatos | API |
|----------|:--------:|:----------:|:---------------:|:--------------:|:---:|
| Clientes | ✅ | 🟡 Básico | ❌ | ❌ | ✅ |
| Fornecedores | ✅ | 🟡 Básico | ❌ | ❌ | ✅ |
| Transportadoras | ❌ | ❌ | - | - | ❌ |
| Colaboradores | ✅ | 🟡 Básico | - | - | ✅ |
| Parceiros | ❌ | ❌ | - | - | ❌ |
| Produtos | ✅ | ✅ | - | - | ✅ |
| Empresas | ✅ | ✅ | ❌ | ❌ | ✅ |
| Usuários | ✅ | ✅ | - | - | ✅ |
| Perfis | ✅ | ✅ | - | - | ✅ |

**Legenda:** ✅ Completo | 🟡 Parcial | ❌ Não implementado

---

## 🎯 Funcionalidades Principais

### Clientes
- Cadastro PF (CPF) e PJ (CNPJ)
- Classificação: Consumidor, Revenda, Construtor, Instalador
- Múltiplos endereços (entrega, cobrança, correspondência)
- Múltiplos contatos (comprador, financeiro, dono)
- Limite de crédito
- Tabela de preço vinculada
- Vendedor responsável
- Indicador (programa de indicações)
- Bloqueio automático por inadimplência

### Fornecedores
- Cadastro com CNPJ
- Múltiplos endereços
- Múltiplos contatos
- Prazo médio de entrega
- Condições de pagamento
- Score de avaliação

### Produtos
- Flag: Produto ou Serviço
- NCM, CEST, Origem fiscal
- Múltiplas fotos
- Código de barras EAN
- Estoque mínimo/máximo
- Múltiplos fornecedores

---

## 📁 Arquivos deste Módulo

| Arquivo | Descrição |
|---------|-----------|
| [REGRAS.md](./REGRAS.md) | Regras de negócio (25 regras) |
| [TELAS.md](./TELAS.md) | Especificação de telas |
| [API.md](./API.md) | Endpoints da API |
| [MODELO_DADOS.md](./MODELO_DADOS.md) | Tabelas e relacionamentos |

---

## 🔗 Dependências

Este módulo é **consumido por:**
- Comercial (Orçamentos, Vendas)
- Compras (Pedidos, Cotações)
- Financeiro (Contas a Pagar/Receber)
- Fiscal (NF-e)
- CRM (Leads, Oportunidades)
- Logística (Entregas)

---

## 📝 Próximas Tarefas

1. [ ] Implementar múltiplos endereços em Clientes
2. [ ] Implementar múltiplos contatos em Clientes
3. [ ] Criar tela de Transportadoras
4. [ ] Criar tela de Parceiros de Negócio
5. [ ] Criar tela de Centros de Custo
6. [ ] Criar tela de Condições de Pagamento
7. [ ] Criar tela de Tabelas de Preço
