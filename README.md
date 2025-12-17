# PLANAC ERP

Sistema de Gestão Empresarial completo para distribuidoras de materiais de construção.

![Version](https://img.shields.io/badge/version-2.1.0-blue)
![Status](https://img.shields.io/badge/status-production-green)
![License](https://img.shields.io/badge/license-proprietary-red)

---

## 📋 Sobre o Projeto

O **PLANAC ERP** é um sistema de gestão empresarial desenvolvido para a PLANAC Distribuidora de Materiais para Construção. O sistema é completo e abrange todos os módulos necessários para a operação de uma distribuidora.

### Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Linguagem** | TypeScript |
| **Frontend** | React + Tailwind CSS |
| **Backend** | Hono Framework |
| **Runtime** | Cloudflare Workers |
| **Banco de Dados** | Cloudflare D1 (SQLite) |
| **Storage** | Cloudflare R2 |
| **Cache** | Cloudflare KV |

---

## 📊 Status do Projeto (17/12/2025)

| Recurso | Status | Progresso |
|---------|--------|-----------|
| Infraestrutura Cloudflare | ✅ Completo | 100% |
| Backend (207 tabelas D1) | ✅ Completo | 100% |
| API Routes | ✅ Funcionando | 85% |
| Frontend Pages | ✅ 54+ páginas | 80% |
| FormPages | ✅ 25 formulários | 100% |
| Integrações Fiscais | ✅ Nuvem Fiscal | 100% |
| Deploy Produção | ✅ Workers.dev | Online |

---

## ☁️ Infraestrutura Cloudflare

### Databases D1
- `Planac-erp-database` - 207 tabelas, 4.2MB (Principal)
- `planac-erp-ibpt` - Cache IBPT
- `orquestrador-database` - DEV.com Especialistas

### Storage R2
- `planac-erp-storage` - Arquivos gerais
- `planac-erp-certificados` - Certificados A1
- `planac-images` - Imagens produtos
- `planac-cms-media` - Mídia e-commerce

### KV Namespaces
- `Planac-erp-cache` - Cache geral
- `Planac-erp-sessions` - Sessões usuários
- `Planac-erp-rate-limit` - Rate limiting

### Workers
- `planac-erp-api` - API Principal (production)

---

## 🌐 API Endpoints

**Base URL:** `https://planac-erp-api.planacacabamentos.workers.dev`

### Endpoints Disponíveis

| Rota | Método | Descrição |
|------|--------|-----------|
| `/health` | GET | Health check |
| `/v1/usuarios` | GET, POST | Usuários |
| `/v1/perfis` | GET, POST | Perfis de acesso |
| `/v1/clientes` | GET, POST | Clientes |
| `/v1/fornecedores` | GET, POST | Fornecedores |
| `/v1/produtos` | GET, POST | Produtos |
| `/v1/orcamentos` | GET, POST | Orçamentos |
| `/v1/vendas` | GET, POST | Vendas |
| `/v1/fiscal/*` | * | Módulo Fiscal |
| `/v1/ibpt/*` | * | IBPT |
| `/v1/certificados/*` | * | Certificados A1 |

---

## 📁 Estrutura do Projeto

```
src/
├── packages/
│   ├── api/                    # Backend Hono
│   │   └── src/
│   │       ├── routes/         # Rotas API
│   │       ├── services/       # Serviços
│   │       └── middleware/     # Middlewares
│   └── web/                    # Frontend React
│       └── src/
│           ├── pages/          # Páginas
│           ├── components/     # Componentes
│           └── hooks/          # React Hooks
└── shared/                     # Código compartilhado
```

---

## 🔧 Módulos do Sistema

### ✅ Implementados

- **Core** - Empresas, Filiais, Usuários, Perfis
- **Comercial** - Clientes, Produtos, Orçamentos, Vendas
- **Estoque** - Movimentações, Transferências, Inventário
- **Fiscal** - NF-e, NFC-e, NFS-e, CT-e, MDF-e
- **Financeiro** - Contas a Pagar/Receber, Boletos
- **Compras** - Pedidos, Cotações, Fornecedores
- **Logística** - Entregas, Rotas, Rastreamento
- **CRM** - Leads, Oportunidades, Pipeline
- **Contábil** - Plano de Contas, Lançamentos, DRE
- **RH** - Colaboradores, Folha, Ponto
- **Patrimônio** - Bens, Depreciação
- **Suporte** - Tickets, Base de Conhecimento
- **BI** - Dashboards, Relatórios

### ⏳ Em Desenvolvimento

- **CalcPro** - Calculadora técnica drywall
- **PDV** - Ponto de venda offline-first
- **E-commerce** - Loja virtual integrada

---

## 🔗 Integrações

### ✅ Ativas

| Integração | Uso | Status |
|------------|-----|--------|
| **Nuvem Fiscal** | Emissão NF-e/NFC-e/NFS-e | ✅ Configurado |
| **IBPT** | Impostos (Lei 12.741) | ✅ Implementado |
| **ViaCEP** | Consulta CEP | ✅ Funcionando |
| **CNPJá** | Consulta CNPJ | ✅ Configurado |
| **cpf.CNPJ** | Consulta CPF/CNPJ | ✅ Configurado |

### ⏳ Planejadas

- TecnoSpeed (Boletos, PIX)
- Nuvemshop (E-commerce)
- Gateway de Pagamento

---

## 🚀 Deploy

### Produção

```bash
# Deploy do Worker
wrangler deploy

# Configurar secrets
wrangler secret put JWT_SECRET
wrangler secret put NUVEM_FISCAL_CLIENT_ID
wrangler secret put NUVEM_FISCAL_CLIENT_SECRET
```

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build
npm run build
```

---

## 📄 Documentação

- [Auditoria Cloudflare 17/12/2025](./PLANAC_ERP_AUDITORIA_2025-12-17.md)
- [Mapeamento de Telas](./MAPEAMENTO_TELAS_PLANAC_ERP.md)
- [Status do Projeto 14/12/2025](./STATUS_PLANAC_ERP_2025-12-14.md)
- [Realinhamento DEV.com](./REALINHAMENTO_PLANAC_2025-12-14.md)

---

## 👥 Equipe

Desenvolvido pela **DEV.com** com governança de 57 Especialistas IA.

- **CEO:** Rodrigo
- **CTO Virtual:** Claude (Anthropic)
- **Arquitetura:** DEV.com Especialistas

---

## 📞 Suporte

- **Email:** rodrigo@planacdivisorias.com.br
- **Cliente:** PLANAC Distribuidora

---

**Última atualização:** 17/12/2025  
**Versão:** 2.1.0
