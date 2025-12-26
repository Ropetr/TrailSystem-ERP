# 📚 TrailSystem ERP - Documentação

**Última atualização:** 26/12/2025  
**Versão:** 2.0 (Estrutura Modular)

---

## 🎯 Sobre o Projeto

**TrailSystem ERP** é um sistema de gestão empresarial completo, desenvolvido inicialmente para a **PLANAC Distribuidora** (drywall e materiais de construção), com arquitetura preparada para revenda multi-tenant.

### Stack Tecnológica
- **Frontend:** React + TypeScript + TailwindCSS
- **Backend:** Cloudflare Workers + Hono
- **Banco de Dados:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2
- **Cache:** Cloudflare KV

---

## 📂 Estrutura da Documentação

| Pasta | Módulo | Status | Descrição |
|-------|--------|--------|-----------|
| [00-arquitetura](./00-arquitetura/) | Arquitetura | 🟢 | Stack, decisões técnicas, integrações |
| [01-cadastros](./01-cadastros/) | Cadastros | 🟡 | Clientes, Fornecedores, Produtos, Usuários |
| [02-comercial](./02-comercial/) | Comercial | 🟡 | Orçamentos, Vendas, PDV |
| [03-estoque](./03-estoque/) | Estoque | 🟡 | Movimentações, Inventário, Saldos |
| [04-fiscal](./04-fiscal/) | Fiscal | 🟢 | NF-e, NFC-e, NFS-e, SPED |
| [05-financeiro](./05-financeiro/) | Financeiro | 🟡 | Contas a Pagar/Receber, Boletos |
| [06-compras](./06-compras/) | Compras | 🟡 | Cotações, Pedidos, Recebimento |
| [07-logistica](./07-logistica/) | Logística | 🟡 | Entregas, Rotas, Rastreamento |
| [08-crm](./08-crm/) | CRM | 🟡 | Leads, Pipeline, Atividades |
| [09-rh](./09-rh/) | RH | 🔴 | Colaboradores, Folha, Ponto |
| [10-contabil](./10-contabil/) | Contábil | 🔴 | Plano de Contas, Lançamentos, DRE |
| [11-ecommerce](./11-ecommerce/) | E-commerce | 🔴 | B2B, B2C, Integrações |
| [12-patrimonio](./12-patrimonio/) | Patrimônio | 🔴 | Bens, Depreciação |
| [13-bi](./13-bi/) | BI | 🟢 | Dashboards, Relatórios |
| [14-suporte](./14-suporte/) | Suporte | 🔴 | Tickets, Base de Conhecimento |

**Legenda:** 🟢 Produção | 🟡 Desenvolvimento | 🔴 Planejado

---

## 🔗 Links Úteis

- **Repositório:** https://github.com/Ropetr/TrailSystem-ERP
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Nuvem Fiscal:** https://nuvemfiscal.com.br

---

## 📋 Convenções

### Nomenclatura de Arquivos
- `README.md` - Visão geral do módulo
- `REGRAS.md` - Regras de negócio
- `TELAS.md` - Especificação de telas
- `API.md` - Endpoints da API
- `MODELO_DADOS.md` - Tabelas e relacionamentos
- `FLUXOGRAMAS.md` - Fluxos de processo (Mermaid)

### Nomenclatura Cloudflare
- Prefixo: `Planac-erp-` para todos os recursos
- Exemplos: `Planac-erp-database`, `Planac-erp-cache`

---

## 📊 Status Geral do Projeto

| Área | Progresso | Observações |
|------|-----------|-------------|
| Modelo de Dados | 100% | 211 tabelas no D1 |
| API Backend | 85% | Services e Routes principais |
| Frontend | 80% | 77 páginas |
| Integrações Fiscais | 100% | Nuvem Fiscal completo |
| Dashboards | 100% | 4 dashboards criados |
| Testes | 40% | Em desenvolvimento |
| Deploy Produção | 0% | Pendente |

---

**Documentação reorganizada em:** 26/12/2025
