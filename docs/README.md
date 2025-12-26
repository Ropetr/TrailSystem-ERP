# 📚 TrailSystem ERP - Documentação

> Documentação técnica completa do sistema ERP

## Módulos do Sistema

| # | Módulo | Descrição | Status |
|---|--------|-----------|--------|
| 00 | [Arquitetura](./00-arquitetura/) | Visão geral da arquitetura | ✅ |
| 01 | [Cadastros](./01-cadastros/) | Clientes, Produtos, Fornecedores | 📝 |
| 02 | [Comercial](./02-comercial/) | Orçamentos, Vendas, Tabelas Preço | 📝 |
| 03 | [Estoque](./03-estoque/) | Saldos, Movimentações, Inventário | 📝 |
| 04 | [Fiscal](./04-fiscal/) | NF-e, NFC-e, NFS-e, IBPT | ✅ |
| 05 | [Financeiro](./05-financeiro/) | Contas, Boletos, Fluxo Caixa | 📝 |
| 06 | [Compras](./06-compras/) | Cotações, Pedidos, Fornecedores | 📝 |
| 07 | [Logística](./07-logistica/) | Entregas, Rotas, Rastreamento | 📝 |
| 08 | [CRM](./08-crm/) | Pipeline, Leads, Oportunidades | 📝 |
| 09 | [RH](./09-rh/) | Colaboradores, Folha, Ponto | 📝 |
| 10 | [Contábil](./10-contabil/) | Lançamentos, DRE, Balanço | 📝 |
| 11 | [E-commerce](./11-ecommerce/) | Loja Online, Pedidos | 📝 |
| 12 | [Patrimônio](./12-patrimonio/) | Bens, Depreciação | 📝 |
| 13 | [BI](./13-bi/) | Dashboards, Relatórios | 📝 |
| 14 | [Suporte](./14-suporte/) | Tickets, Base Conhecimento | 📝 |
| 15 | [Configurações](./15-configuracoes/) | Parâmetros globais do sistema | ✅ |

## Legenda

| Status | Significado |
|--------|-------------|
| ✅ | Documentação completa |
| 📝 | Em desenvolvimento |
| ⏳ | Pendente |

## Estrutura de Cada Módulo

Cada módulo contém:

```
XX-modulo/
├── README.md        # Visão geral do módulo
├── REGRAS.md        # Regras de negócio
├── API.md           # Endpoints da API
└── MODELO_DADOS.md  # Estrutura do banco
```

## Prioridade de Documentação

### 🔴 Alta (Core Business)
1. **15-Configurações** ✅ - Base de todo o sistema
2. **01-Cadastros** 📝 - Clientes, Produtos
3. **02-Comercial** 📝 - Vendas
4. **03-Estoque** 📝 - Controle
5. **04-Fiscal** ✅ - NF-e, compliance

### 🟡 Média
6. **05-Financeiro** - Boletos, cobrança
7. **06-Compras** - Fornecedores
8. **08-CRM** - Relacionamento

### 🟢 Baixa
9. Demais módulos

## Links Úteis

- **Repositório:** https://github.com/Ropetr/TrailSystem-ERP
- **Frontend:** https://planac-erp.pages.dev (quando em produção)
- **API:** https://api.trailsystem.com.br (quando em produção)

---

**Última atualização:** 26/12/2025  
**Mantido por:** DEV.com - 57 Especialistas
