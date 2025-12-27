# 🤖 Sistema Orquestrador DEV.com

> **Governança automatizada do desenvolvimento do PLANAC ERP**

---

## 📋 Visão Geral

O **Orquestrador DEV.com** é o sistema de governança que coordena **57 especialistas virtuais** para auxiliar no desenvolvimento do PLANAC ERP. Ele usa a **Arquitetura Duas Cabeças** (Claude + GPT) para análises profundas e decisões estratégicas.

| Atributo | Valor |
|----------|-------|
| **Worker** | `devcom-orchestrator` |
| **URL** | https://devcom-orchestrator.planacacabamentos.workers.dev |
| **Banco D1** | `orquestrador-database` |
| **Cache KV** | `orquestrador-cache` |
| **Especialistas** | **57 ativos** |

---

## 🏢 Estrutura de Especialistas (57)

### 🎭 Orquestração (3)
| ID | Nome | Função |
|----|------|--------|
| maestro | Maestro | Coordenador geral das análises |
| escrivao | Escrivão | Registra decisões e contexto |
| moderador | Moderador | Facilita debates entre especialistas |

### 🎯 Estratégia (4)
| ID | Nome | Função |
|----|------|--------|
| ceo | CEO | Visão estratégica e de negócios |
| cpo | CPO | Gestão de produto |
| guardiao | Guardião | Custodia documentação e decisões |
| scrum_master | Scrum Master | Metodologia ágil |

### 🤝 Comercial (5)
| ID | Nome | Função |
|----|------|--------|
| gestor_vendas | Vendas | Estratégias comerciais |
| especialista_marketplaces | Marketplaces | Integrações e-commerce |
| especialista_omnichannel | Omnichannel | Canais de venda |
| ecommerce | E-commerce | Loja virtual |
| crm_cs | CRM/CS | Customer Success |

### 💰 Financeiro (4)
| ID | Nome | Função |
|----|------|--------|
| cfo | CFO | Gestão financeira |
| tributario | Tributário | Compliance fiscal |
| economista | Economista | Análises econômicas |
| pricing | Pricing | Precificação |

### 🚚 Operações (3)
| ID | Nome | Função |
|----|------|--------|
| logistica | Logística | Supply chain |
| compras | Compras | Procurement |
| estoque | Estoque | Gestão de inventário |

### 📊 Dados & IA (6)
| ID | Nome | Função |
|----|------|--------|
| bi | BI | Business Intelligence |
| ga4 | GA4 | Google Analytics |
| gtm | GTM | Google Tag Manager |
| ia_automacoes | IA & Automações | Automação inteligente |
| engenheiro_dados | Data Engineer | Pipelines de dados |
| mlops | MLOps | Machine Learning Operations |

### 🧩 Técnica (11)
| ID | Nome | Função |
|----|------|--------|
| cto | CTO | Arquitetura técnica |
| dev_senior | Dev Senior | Desenvolvimento avançado |
| frontend | Frontend | Interface do usuário |
| backend | Backend | APIs e serviços |
| devops | DevOps | CI/CD e infraestrutura |
| github_cloudflare | GitHub/Cloudflare | Versionamento e deploy |
| seguranca | Segurança | Cybersecurity |
| infra_ti | Infra TI | Infraestrutura |
| dba | DBA | Database Administrator |
| mobile | Mobile | Apps móveis |
| qa_tecnico | QA Técnico | Qualidade de código |

### 📢 Marketing (6)
| ID | Nome | Função |
|----|------|--------|
| seo | SEO | Search Engine Optimization |
| copywriter | Copywriter | Textos persuasivos |
| email_mkt | Email Marketing | Campanhas de email |
| social_media | Social Media | Redes sociais |
| video | Vídeo | Conteúdo audiovisual |
| growth | Growth | Crescimento |

### 🎨 Experiência (6)
| ID | Nome | Função |
|----|------|--------|
| ux_ui | UX/UI | Design de interfaces |
| ux_writer | UX Writer | Textos de interface |
| branding | Branding | Identidade visual |
| cx | CX | Customer Experience |
| onboarding | Onboarding | Primeira experiência do usuário |
| treinamentos | Treinamentos | Capacitação |

### ⚖️ Jurídico (1)
| ID | Nome | Função |
|----|------|--------|
| legal | Legal | Compliance e contratos |

### 👥 People (1)
| ID | Nome | Função |
|----|------|--------|
| rh | RH | Recursos Humanos |

### ✅ Qualidade (1)
| ID | Nome | Função |
|----|------|--------|
| qa_processos | QA Processos | Qualidade de processos |

### 🏗️ Construção Civil (4)
| ID | Nome | Função |
|----|------|--------|
| consultor_construcao | Consultor Construção | Conhecimento do setor drywall/steel frame |
| consultor_fiscal_comex | Fiscal/Comex | Tributação e comércio exterior |
| fiscal_projeto | Fiscal de Projeto | Acompanhamento de prazo/escopo |
| revisor_codigo | Revisor de Código | Code review especializado |

### 💼 CFO Digital (2)
| ID | Nome | Função |
|----|------|--------|
| fiscal_fiscal | Fiscal Fiscal | Compliance tributário digital |
| controller | Controller | Controladoria |

---

## 🧠 Arquitetura Duas Cabeças

O orquestrador usa dois modelos de IA complementares:

```
┌─────────────────────────────────────────────────────────────────┐
│                   ARQUITETURA DUAS CABEÇAS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   📨 Requisição                                                 │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────┐                                               │
│   │   Maestro   │  ← Coordena e distribui                      │
│   └──────┬──────┘                                               │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────────────────────────────────┐                 │
│   │          Mesa de Especialistas           │                 │
│   │  (2-5 especialistas por consulta)        │                 │
│   └──────────────────────────────────────────┘                 │
│          │                                                      │
│          ▼                                                      │
│   ┌─────────────────────┬─────────────────────┐                │
│   │                     │                     │                │
│   │   🔵 Claude         │    🟢 GPT           │                │
│   │   (4000 RPM)        │    (3 RPM)          │                │
│   │                     │                     │                │
│   │   • Análise         │    • Visão          │                │
│   │     técnica         │      estratégica    │                │
│   │   • Código          │    • Validação      │                │
│   │   • Detalhes        │    • Síntese        │                │
│   │                     │                     │                │
│   └─────────────────────┴─────────────────────┘                │
│          │                                                      │
│          ▼                                                      │
│   ┌─────────────┐                                               │
│   │   Síntese   │  ← Combina perspectivas                      │
│   └──────┬──────┘                                               │
│          │                                                      │
│          ▼                                                      │
│   📤 Resposta Final                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Quando cada IA é usada:

| Claude (Primário) | GPT (Validador) |
|-------------------|-----------------|
| Toda consulta | Consultas estratégicas |
| Análise de código | Validação de decisões |
| Implementação técnica | Segunda opinião |
| Rate limit: 4000 RPM | Rate limit: 3 RPM |

---

## 💾 Sistema de Memória Ampliada

O orquestrador mantém memória persistente do projeto em 7 tabelas:

| Tabela | Propósito | Registros |
|--------|-----------|-----------|
| `memoria_modulos` | Decisões por módulo | 11 |
| `memoria_tecnica` | Decisões de arquitetura | 10 |
| `memoria_integracoes` | Status das integrações | 10 |
| `memoria_historico` | Histórico de eventos | 5+ |
| `memoria_marcos` | Milestones do projeto | - |
| `memoria_pendencias` | Tarefas pendentes | - |
| `memoria_responsaveis` | Atribuições | - |

### Decisões Técnicas Registradas:

1. Cloudflare Workers como backend
2. Cloudflare D1 como banco principal
3. Cloudflare KV para cache
4. Cloudflare R2 para arquivos
5. React como framework frontend
6. Hono como framework de API
7. Arquitetura Duas Cabeças (Claude+GPT)
8. TecnoSpeed como provedor fiscal
9. GitHub como repositório
10. Prefixo `Planac-erp` em recursos Cloudflare

---

## 🔗 Integração com Planac ERP

### Repositórios Vinculados:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   📁 Ropetr/Planac-Revisado                                     │
│   └── PLANAC ERP API                                            │
│       • 207 tabelas                                             │
│       • ~95 rotas                                               │
│       • Worker: planac-erp-api                                  │
│                                                                 │
│                    ▲                                            │
│                    │ Governa                                    │
│                    │                                            │
│                                                                 │
│   📁 Ropetr/dev.com-orquestrador                                │
│   └── Orquestrador DEV.com                                      │
│       • 57 especialistas                                        │
│       • Memória ampliada                                        │
│       • Worker: devcom-orchestrator                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Trabalho:

1. **Análise** → Consulta ao orquestrador antes de implementar
2. **Implementação** → Código no Planac-Revisado
3. **Documentação** → Orquestrador registra decisões
4. **Validação** → Especialistas revisam mudanças

---

## 📡 Endpoints do Orquestrador

| Método | Endpoint | Função |
|--------|----------|--------|
| POST | `/api/chat` | Consulta aos especialistas |
| GET | `/api/especialistas` | Lista especialistas disponíveis |
| GET | `/api/memoria/:projeto` | Recupera memória do projeto |
| POST | `/api/mesa` | Cria mesa de debate |

### Exemplo de Consulta:

```bash
curl -X POST https://devcom-orchestrator.planacacabamentos.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "mensagem": "Qual a melhor abordagem para implementar o módulo fiscal?",
    "projeto": "planac-erp",
    "especialistas": ["cto", "tributario", "backend"]
  }'
```

---

## 🔐 Credenciais Configuradas

| Secret | Serviço | Status |
|--------|---------|--------|
| `ANTHROPIC_API_KEY` | Claude AI | ✅ Ativo |
| `OPENAI_API_KEY` | GPT | ✅ Ativo |
| `GITHUB_TOKEN` | GitHub API | ✅ Ativo |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API | ✅ Ativo |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account | ✅ Ativo |

---

## 📊 Integrações Monitoradas

O orquestrador rastreia o status de todas as integrações do Planac ERP:

| Integração | Provedor | Status |
|------------|----------|--------|
| IA Orquestrador | Anthropic Claude | ✅ Ativa |
| IA Estratégica | OpenAI GPT | ✅ Ativa |
| Versionamento | GitHub | ✅ Ativa |
| Consulta CNPJ | CNPJá | 🟡 Configurada |
| Validação CPF/CNPJ | cpfcnpj.com.br | 🟡 Configurada |
| Fiscal Nuvem | Nuvem Fiscal | 🟡 Configurada |
| Emissão NFe/NFCe | TecnoSpeed | ⬜ Planejada |
| E-commerce | Baselinker | ⬜ Planejada |
| WhatsApp | API Brasil | ⬜ Planejada |
| Banking | TecnoSpeed | ⬜ Planejada |

---

## 🚀 Como Usar

### 1. Antes de Implementar
Consulte o orquestrador para análise:
```
"Preciso implementar [funcionalidade]. Quais considerações devo ter?"
```

### 2. Para Decisões Arquiteturais
Convoque uma mesa de especialistas:
```
"Convoque CTO, Backend e DBA para discutir a estrutura de [módulo]"
```

### 3. Para Documentar Decisões
O orquestrador registra automaticamente na memória ampliada.

### 4. Para Validação
Use a Arquitetura Duas Cabeças para validar decisões importantes:
```
"Valide com GPT esta decisão: [decisão]"
```

---

## 📁 Arquivos Relacionados

| Arquivo | Localização | Descrição |
|---------|-------------|-----------|
| `DEV.com.md` | `/DEV.com.md` | Documentação da fábrica virtual |
| `PROJECT_MEMORY.md` | `/docs/00-devcom/PROJECT_MEMORY.md` | Memória do projeto |
| `WORKFLOW.md` | `/docs/00-devcom/WORKFLOW.md` | Fluxos de trabalho |
| `RUNBOOK.md` | `/docs/00-devcom/RUNBOOK.md` | Procedimentos operacionais |

---

*Última atualização: 13/12/2025*
