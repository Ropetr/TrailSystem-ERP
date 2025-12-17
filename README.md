# 🏢 PLANAC ERP

Sistema ERP completo para distribuidoras de drywall e materiais de construção.

[![Security Scan](https://github.com/Ropetr/Planac-Revisado/actions/workflows/security.yml/badge.svg)](https://github.com/Ropetr/Planac-Revisado/actions)
[![CodeQL](https://github.com/Ropetr/Planac-Revisado/actions/workflows/codeql.yml/badge.svg)](https://github.com/Ropetr/Planac-Revisado/actions)

**Última Atualização:** 17/12/2025  
**Versão:** 2.1.0  
**Status:** ✅ Em Produção

---

## 🚀 Quick Links

| Recurso | URL |
|---------|-----|
| 🖥️ **Frontend** | https://planac-erp.pages.dev |
| 🔌 **API** | https://planac-erp-api.planacacabamentos.workers.dev |
| 📋 **Health Check** | https://planac-erp-api.planacacabamentos.workers.dev/health |

---

## 📊 Status do Projeto

| Componente | Progresso | Status |
|------------|-----------|--------|
| Backend API | 85% | ✅ Online |
| Frontend | 80% | ✅ Deployed |
| Database | 100% | ✅ 207 tabelas |
| Integrações Fiscais | 100% | ✅ Configurado |
| Infraestrutura Cloud | 100% | ✅ Cloudflare |

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Linguagem** | TypeScript |
| **Frontend** | React + Vite + TailwindCSS |
| **Backend** | Hono Framework |
| **Runtime** | Cloudflare Workers |
| **Database** | Cloudflare D1 (SQLite) |
| **Storage** | Cloudflare R2 |
| **Cache** | Cloudflare KV |
| **CI/CD** | GitHub Actions |

---

## 📦 Módulos do Sistema

### Core
- ✅ Autenticação JWT
- ✅ Gestão de Usuários
- ✅ Perfis e Permissões
- ✅ Multi-tenant (Empresas/Filiais)
- ✅ Audit Logs

### Comercial
- ✅ Clientes (CRUD completo)
- ✅ Fornecedores (CRUD completo)
- ✅ Produtos e Serviços
- ✅ Orçamentos
- ✅ Vendas/Pedidos
- ✅ Tabelas de Preço

### Estoque
- ✅ Saldos por Local
- ✅ Movimentações
- ✅ Transferências entre Filiais
- ✅ Inventário
- ✅ Reservas

### Fiscal
- ✅ NF-e (Nota Fiscal Eletrônica)
- ✅ NFC-e (Cupom Fiscal)
- ✅ NFS-e (Serviços)
- ✅ CT-e / MDF-e
- ✅ IBPT (Lei da Transparência)
- ✅ SPED

### Financeiro
- ✅ Contas a Pagar
- ✅ Contas a Receber
- ✅ Fluxo de Caixa
- ✅ Conciliação Bancária
- ⏳ Boletos (TecnoSpeed)

### CRM
- ✅ Leads
- ✅ Oportunidades
- ✅ Pipeline Kanban
- ✅ Atividades
- ✅ Funis de Venda

### RH
- ✅ Colaboradores
- ✅ Folha de Pagamento
- ✅ Ponto Eletrônico
- ✅ Férias

### Outros
- ✅ Logística (Entregas, Rotas)
- ✅ Contábil (Plano de Contas, DRE)
- ✅ Patrimônio (Bens, Depreciação)
- ✅ Suporte (Tickets)
- ✅ BI (Dashboards)
- ✅ E-Commerce

---

## 🗄️ Infraestrutura Cloudflare

### Databases (D1)
| Database | Tabelas | Uso |
|----------|---------|-----|
| Planac-erp-database | 207 | Principal |
| planac-erp-ibpt | 5 | Cache IBPT |

### Storage (R2)
- `planac-erp-storage` - Arquivos gerais
- `planac-erp-certificados` - Certificados A1
- `planac-images` - Imagens de produtos
- `planac-cms-media` - Mídia e-commerce

### Cache (KV)
- `Planac-erp-cache` - Cache geral
- `Planac-erp-sessions` - Sessões
- `Planac-erp-rate-limit` - Rate limiting

---

## 🔗 Integrações

| Serviço | Uso | Status |
|---------|-----|--------|
| **Nuvem Fiscal** | NF-e, NFC-e, NFS-e, CT-e, MDF-e | ✅ Configurado |
| **IBPT** | Lei da Transparência Fiscal | ✅ Funcionando |
| **CPF.CNPJ** | Consulta documentos | ✅ Configurado |
| **CNPJá** | Consulta empresas | ✅ Configurado |
| **TecnoSpeed** | Boletos, PIX | ⏳ Pendente |

---

## 📁 Estrutura do Projeto

```
src/
├── packages/
│   ├── api/                 # Backend Hono
│   │   ├── src/
│   │   │   ├── routes/      # Rotas da API
│   │   │   ├── services/    # Lógica de negócio
│   │   │   └── middleware/  # Middlewares
│   │   └── wrangler.toml    # Config Workers
│   │
│   └── web/                 # Frontend React
│       ├── src/
│       │   ├── pages/       # 77 páginas
│       │   ├── components/  # Componentes
│       │   └── hooks/       # React Hooks
│       └── vite.config.ts
│
├── docs/                    # Documentação
└── scripts/                 # Scripts utilitários
```

---

## 🚀 Deploy

### API (Workers)
```bash
cd src/packages/api
wrangler deploy
```

### Frontend (Pages)
O deploy é automático via GitHub.

---

## 📋 Documentação Completa

Veja a documentação detalhada em:
- [docs/PLANAC_ERP_STATUS_2025-12-17.md](docs/PLANAC_ERP_STATUS_2025-12-17.md)

---

## 👥 Equipe

Desenvolvido por **DEV.com** - 57 Especialistas IA  
Cliente: **PLANAC Distribuidora**

---

## 📄 Licença

Proprietário - Todos os direitos reservados.
