# 🏗️ Arquitetura do Sistema

**Última atualização:** 26/12/2025  
**Status:** 🟢 Definido

---

## 📋 Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18.x | UI Framework |
| TypeScript | 5.x | Tipagem |
| TailwindCSS | 3.x | Estilização |
| React Router | 6.x | Navegação |
| Zustand | 4.x | Estado global |
| React Query | 5.x | Cache de dados |

### Backend
| Tecnologia | Uso |
|------------|-----|
| Cloudflare Workers | Runtime serverless |
| Hono | Framework HTTP |
| TypeScript | Tipagem |

### Infraestrutura Cloudflare
| Serviço | Recurso | Uso |
|---------|---------|-----|
| D1 | `Planac-erp-database` | Banco principal (211 tabelas) |
| D1 | `planac-erp-ibpt` | Cache IBPT |
| R2 | `planac-erp-storage` | Arquivos gerais |
| R2 | `planac-erp-certificados` | Certificados A1 |
| KV | `Planac-erp-cache` | Cache geral |
| KV | `Planac-erp-sessions` | Sessões |

### Integrações Externas
| Serviço | Uso | Status |
|---------|-----|--------|
| Nuvem Fiscal | NF-e, NFC-e, NFS-e, CT-e, MDF-e | ✅ 100% |
| IBPT | Tributos (Lei 12.741) | ✅ 100% |
| TecnoSpeed | Boletos, PIX | ⏳ Planejado |
| API Brasil | WhatsApp, Consultas | ⏳ Parcial |

---

## 🔐 Autenticação

- **Método:** JWT (JSON Web Token)
- **Expiração:** 24 horas
- **Refresh:** Automático
- **2FA:** Opcional por usuário

---

## 🏢 Multi-Tenant

- **Isolamento:** Por `empresa_id` em todas as tabelas
- **Consolidação:** Usuário pode ver múltiplas empresas
- **Filiais:** Relacionadas à matriz por `matriz_id`

---

## 📁 Arquivos deste Módulo

| Arquivo | Descrição |
|---------|-----------|
| [DECISOES.md](./DECISOES.md) | Decisões arquiteturais (ADRs) |
| [INTEGRACOES.md](./INTEGRACOES.md) | Detalhes das integrações |

---

## 🔗 Credenciais (Ambiente)

> ⚠️ **Nunca commitar credenciais!** Usar secrets do Cloudflare.

| Variável | Descrição |
|----------|-----------|
| `JWT_SECRET` | Chave para tokens |
| `ENCRYPTION_KEY` | Criptografia de dados sensíveis |
| `NUVEM_FISCAL_CLIENT_ID` | API Nuvem Fiscal |
| `NUVEM_FISCAL_CLIENT_SECRET` | API Nuvem Fiscal |
