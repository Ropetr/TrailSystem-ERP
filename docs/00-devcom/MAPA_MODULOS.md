# 🗺️ MAPA DOS MÓDULOS - PLANAC ERP

> **Versão:** 1.0 | **Data:** 13/12/2024 | **Total:** 28 Capítulos | 13 Partes

---

## 📊 VISÃO GERAL DO SISTEMA

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           PLANAC ERP - MAPA DE MÓDULOS                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                          🏢 PARTE 1 - CORE                                  │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │   │
│   │  │  Empresas   │  │  Cadastros  │  │  Usuários   │                          │   │
│   │  │  Multi-Tenant│  │    Base    │  │  Permissões │                          │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘                          │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│   ┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐  │
│   │      💼 PARTE 2 - COMERCIAL        │  │       📦 PARTE 3 - COMPRAS         │  │
│   │  ┌─────┐┌─────┐┌─────┐┌─────┐      │  │  ┌─────┐┌─────┐┌─────┐┌─────┐      │  │
│   │  │ CRM ││Calc ││Orça ││Pedi │      │  │  │Cotaç││Pedi ││Receb││Devol│      │  │
│   │  │     ││Pro  ││mentos│dos  │      │  │  │ões  ││dos  ││imento│ução │      │  │
│   │  └─────┘└─────┘└─────┘└─────┘      │  │  └─────┘└─────┘└─────┘└─────┘      │  │
│   │  ┌─────┐┌─────┐┌─────┐┌─────┐      │  │  ┌─────┐┌─────┐┌─────┐┌─────┐      │  │
│   │  │ PDV ││Indic││Devol││Troca│      │  │  │Estoq││ WMS ││Prod ││Kits │      │  │
│   │  │     ││ações││ução ││     │      │  │  │ue   ││     ││ução ││     │      │  │
│   │  └─────┘└─────┘└─────┘└─────┘      │  │  └─────┘└─────┘└─────┘└─────┘      │  │
│   │  ┌─────┐┌─────┐┌─────┐┌─────┐      │  │  ┌─────┐┌─────┐                    │  │
│   │  │Servi││Consi││Garan││Gamif│      │  │  │Custo││Impor│                    │  │
│   │  │ços  ││gnação│tia  ││icação│     │  │  │s    ││tação│                    │  │
│   │  └─────┘└─────┘└─────┘└─────┘      │  │  └─────┘└─────┘                    │  │
│   └─────────────────────────────────────┘  └─────────────────────────────────────┘  │
│                                                                                     │
│   ┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐  │
│   │     💰 PARTE 4 - FINANCEIRO        │  │     📋 PARTE 5 - FISCAL/CONTÁBIL   │  │
│   │  ┌─────┐┌─────┐┌─────┐┌─────┐      │  │  ┌─────┐┌─────┐┌─────┐┌─────┐      │  │
│   │  │Contas│Contas│Fluxo ││Bancos│     │  │  │Tribu││NF-e ││Obrig││Contab│     │  │
│   │  │Receb││Pagar││Caixa ││     │      │  │  │tário││NFCe ││ações││ilidade│    │  │
│   │  └─────┘└─────┘└─────┘└─────┘      │  │  └─────┘└─────┘└─────┘└─────┘      │  │
│   │                                     │  │  ┌─────┐                           │  │
│   │                                     │  │  │Patri│                           │  │
│   │                                     │  │  │mônio│                           │  │
│   │                                     │  │  └─────┘                           │  │
│   └─────────────────────────────────────┘  └─────────────────────────────────────┘  │
│                                                                                     │
│   ┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐  │
│   │    🚚 PARTE 6 - LOGÍSTICA          │  │     📊 PARTE 7 - INTELIGÊNCIA      │  │
│   │  ┌─────┐┌─────┐┌─────┐              │  │  ┌─────┐┌─────┐┌─────┐              │  │
│   │  │Separ││Exped││Rastrea│            │  │  │ BI  ││Dashb││Relat│              │  │
│   │  │ação ││ição ││mento │             │  │  │     ││oards││órios│              │  │
│   │  └─────┘└─────┘└─────┘              │  │  └─────┘└─────┘└─────┘              │  │
│   └─────────────────────────────────────┘  └─────────────────────────────────────┘  │
│                                                                                     │
│   ┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐  │
│   │  📱 PARTE 8 - MKT/ECOMM/ATEND      │  │     🔌 PARTE 9 - INTEGRAÇÃO        │  │
│   │  ┌─────┐┌─────┐┌─────┐              │  │  ┌─────┐┌─────┐┌─────┐              │  │
│   │  │Marke││E-com││Atendi│             │  │  │ APIs ││Fiscal││Banking│          │  │
│   │  │ting ││merce││mento │             │  │  │     ││     ││      │             │  │
│   │  └─────┘└─────┘└─────┘              │  │  └─────┘└─────┘└─────┘              │  │
│   └─────────────────────────────────────┘  └─────────────────────────────────────┘  │
│                                                                                     │
│   ┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐  │
│   │   📲 PARTE 10/11 - INTERFACE       │  │    👥 PARTE 12 - RH                │  │
│   │  ┌─────┐┌─────┐┌─────┐┌─────┐      │  │  ┌─────┐┌─────┐┌─────┐              │  │
│   │  │Mobile│Notifi││Ajuda ││Tickets│   │  │  │Colab││Ponto ││Folha │            │  │
│   │  │     ││cações││      ││      │    │  │  │orad.││      ││Pagto │            │  │
│   │  └─────┘└─────┘└─────┘└─────┘      │  │  └─────┘└─────┘└─────┘              │  │
│   └─────────────────────────────────────┘  └─────────────────────────────────────┘  │
│                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                     📝 PARTE 13 - CONTRATOS                                 │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │   │
│   │  │  Contratos  │  │  Aditivos   │  │  Assinatura │                          │   │
│   │  │  Clientes   │  │             │  │   Digital   │                          │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘                          │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📈 RESUMO DE STATUS

| Fase | Descrição | Progresso |
|------|-----------|-----------|
| 📚 **Documentação** | Regras de negócio, casos de uso | ✅ 100% |
| 🗄️ **Banco de Dados** | 207 tabelas criadas | ✅ 100% |
| ⚙️ **API Backend** | ~600 endpoints em 63 arquivos | ✅ 100% |
| 🧪 **Testes** | Cobertura automatizada | ❌ 0% |
| 🎨 **Frontend** | Interfaces React | ❌ 5% |
| 🔗 **Integrações** | APIs externas | 🟡 30% |

---

## 📋 CHECKLIST POR MÓDULO

### LEGENDA
- ✅ Concluído
- 🟡 Em progresso / Parcial
- ❌ Não iniciado
- ⏳ Pendente de integração externa

---

# PARTE 1 - MÓDULOS CORE

## 📦 Capítulo 01 - Gestão de Empresas e Multi-Tenant

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Cadastro de empresas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cadastro de filiais | ✅ | ✅ | ✅ | ❌ | ❌ |
| Config. fiscais por empresa | ✅ | ✅ | ✅ | ❌ | ❌ |
| Parâmetros por empresa | ✅ | ✅ | ✅ | ❌ | ❌ |
| Consolidação entre empresas | ✅ | ✅ | 🟡 | ❌ | ❌ |

**Tabelas:** `empresas`, `filiais`, `configuracoes`  
**Rotas:** `empresas.routes.ts`, `filiais.routes.ts`, `configuracoes.routes.ts`

### Checklist para Finalização:
- [ ] Criar testes unitários para CRUD de empresas
- [ ] Criar testes de integração para multi-tenant
- [ ] Desenvolver tela de cadastro de empresas
- [ ] Desenvolver tela de configurações fiscais
- [ ] Implementar consolidação de dados

---

## 📦 Capítulo 02 - Cadastros Base

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Clientes (PF/PJ) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Integração API CNPJ | ✅ | ✅ | ⏳ | ❌ | ❌ |
| Fornecedores | ✅ | ✅ | ✅ | ❌ | ❌ |
| Produtos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Categorias | ✅ | ✅ | ✅ | ❌ | ❌ |
| Marcas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Unidades de medida | ✅ | ✅ | ✅ | ❌ | ❌ |
| Tabelas de preço | ✅ | ✅ | ✅ | ❌ | ❌ |
| Kits de produtos | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `clientes`, `clientes_contatos`, `clientes_enderecos`, `fornecedores`, `produtos`, `categorias`, `marcas`, `unidades_medida`, `tabelas_preco`, `tabelas_preco_itens`  
**Rotas:** `clientes.routes.ts`, `fornecedores.routes.ts`, `produtos.routes.ts`, `categorias.routes.ts`, `marcas.routes.ts`, `unidades.routes.ts`, `tabelas-preco.routes.ts`

### Checklist para Finalização:
- [ ] Integrar API CNPJá para consulta automática
- [ ] Integrar API CPF/CNPJ para validação
- [ ] Criar testes para todos os cadastros
- [ ] Desenvolver telas de cadastro (CRUD completo)
- [ ] Implementar busca avançada com filtros
- [ ] Upload de imagens de produtos

---

## 📦 Capítulo 03 - Gestão de Usuários e Permissões

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Cadastro de usuários | ✅ | ✅ | ✅ | ❌ | ❌ |
| Perfis de acesso | ✅ | ✅ | ✅ | ❌ | ❌ |
| Permissões por módulo | ✅ | ✅ | ✅ | ❌ | ❌ |
| Autenticação JWT | ✅ | ✅ | ✅ | ❌ | ❌ |
| 2FA (opcional) | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Log de auditoria | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `usuarios`, `perfis`, `permissoes`, `perfis_permissoes`, `usuarios_perfis`, `usuarios_sessoes`, `audit_logs`  
**Rotas:** `auth.routes.ts`, `usuarios.routes.ts`, `perfis.routes.ts`, `auditoria.routes.ts`

### Checklist para Finalização:
- [ ] Implementar 2FA completo
- [ ] Criar testes de autenticação
- [ ] Desenvolver tela de login
- [ ] Desenvolver gestão de usuários
- [ ] Desenvolver gestão de perfis e permissões
- [ ] Dashboard de auditoria

---

# PARTE 2 - MÓDULO COMERCIAL (12 Submódulos)

## 📦 Capítulo 04.1 - CRM

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Funil de vendas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Pipeline de oportunidades | ✅ | ✅ | ✅ | ❌ | ❌ |
| Leads | ✅ | ✅ | ✅ | ❌ | ❌ |
| Atividades e follow-ups | ✅ | ✅ | ✅ | ❌ | ❌ |
| Histórico de interações | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `crm_funis`, `crm_etapas`, `crm_leads`, `crm_oportunidades`, `crm_atividades`, `crm_historico`, `crm_notas`  
**Rotas:** `crm.routes.ts`

### Checklist para Finalização:
- [ ] Testes unitários do CRM
- [ ] Tela de pipeline visual (Kanban)
- [ ] Tela de gestão de leads
- [ ] Relatórios de conversão

---

## 📦 Capítulo 04.2 - CalcPro (Calculadoras)

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Cadastro de sistemas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Componentes por sistema | ✅ | ✅ | ✅ | ❌ | ❌ |
| Projetos e ambientes | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cálculo automático | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Conversão em orçamento | ✅ | ✅ | 🟡 | ❌ | ❌ |

**Tabelas:** `calcpro_sistemas`, `calcpro_sistemas_componentes`, `calcpro_projetos`, `calcpro_ambientes`, `calcpro_paredes`, `calcpro_calculos`, `calcpro_calculos_itens`  
**Rotas:** Embutido em orçamentos

### Checklist para Finalização:
- [ ] Finalizar lógica de cálculo por sistema
- [ ] Testes das fórmulas de cálculo
- [ ] Interface visual do CalcPro
- [ ] Integração com orçamentos

---

## 📦 Capítulo 04.3 - Orçamentos

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| CRUD de orçamentos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Itens do orçamento | ✅ | ✅ | ✅ | ❌ | ❌ |
| Versionamento | ✅ | ✅ | ✅ | ❌ | ❌ |
| Conversão em pedido | ✅ | ✅ | ✅ | ❌ | ❌ |
| Mesclar orçamentos | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Desmembrar orçamentos | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Envio por email/WhatsApp | ✅ | ✅ | ⏳ | ❌ | ❌ |

**Tabelas:** `orcamentos`, `orcamentos_itens`, `orcamentos_historico`  
**Rotas:** `orcamentos.routes.ts`

### Checklist para Finalização:
- [ ] Implementar mescla de orçamentos
- [ ] Implementar desmembramento
- [ ] Integrar envio por WhatsApp (API Brasil)
- [ ] Testes completos
- [ ] Tela de criação/edição
- [ ] Impressão PDF personalizada

---

## 📦 Capítulo 04.4 - Pedido de Venda

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| CRUD de pedidos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Itens do pedido | ✅ | ✅ | ✅ | ❌ | ❌ |
| Status do pedido | ✅ | ✅ | ✅ | ❌ | ❌ |
| Checkbox bonificado | ✅ | ✅ | ✅ | ❌ | ❌ |
| Entregas fracionadas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Faturamento flexível | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Múltiplas formas pgto | ✅ | ✅ | ✅ | ❌ | ❌ |
| Uso de crédito cliente | ✅ | ✅ | ✅ | ❌ | ❌ |
| Limite de crédito | ✅ | ✅ | ✅ | ❌ | ❌ |
| Comissões | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `pedidos_venda`, `pedidos_venda_itens`, `pedidos_venda_parcelas`, `pedidos_venda_historico`  
**Rotas:** `pedidos.routes.ts`, `comissoes.routes.ts`

### Checklist para Finalização:
- [ ] Implementar faturamento parcial completo
- [ ] Integrar com emissão de NF-e
- [ ] Testes de fluxo completo
- [ ] Tela de pedidos
- [ ] Tela de entregas fracionadas
- [ ] Painel de faturamento pendente

---

## 📦 Capítulo 04.5 - PDV

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Abertura/fechamento caixa | ✅ | ✅ | ✅ | ❌ | ❌ |
| Venda rápida | ✅ | ✅ | ✅ | ❌ | ❌ |
| Sangria e suprimento | ✅ | ✅ | ✅ | ❌ | ❌ |
| Múltiplas formas pgto | ✅ | ✅ | ✅ | ❌ | ❌ |
| Integração NFC-e | ✅ | ✅ | ⏳ | ❌ | ❌ |
| TEF (cartões) | ✅ | ✅ | ⏳ | ❌ | ❌ |

**Tabelas:** `pdv_caixas`, `pdv_sessoes`, `pdv_movimentacoes`  
**Rotas:** `pdv.routes.ts`, `caixas.routes.ts`

### Checklist para Finalização:
- [ ] Integrar emissão NFC-e (TecnoSpeed/Nuvem Fiscal)
- [ ] Integrar TEF
- [ ] Testes de fluxo de caixa
- [ ] Interface PDV completa
- [ ] Integração com balança/leitor

---

## 📦 Capítulo 04.6 - Programa de Indicações

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Cadastro de indicadores | ✅ | ✅ | ✅ | ❌ | ❌ |
| Vínculo cliente-indicador | ✅ | ✅ | ✅ | ❌ | ❌ |
| Geração de créditos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Carteira de créditos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Uso em vendas | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `indicacoes`, `indicacoes_creditos`  
**Rotas:** Embutido em clientes e pedidos

### Checklist para Finalização:
- [ ] Testes do fluxo de indicação
- [ ] Tela de indicadores
- [ ] Relatório de indicações
- [ ] Ranking de indicadores

---

## 📦 Capítulo 04.7 - Devolução de Venda

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Registro de devolução | ✅ | ✅ | ✅ | ❌ | ❌ |
| Itens devolvidos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Entrada no estoque | ✅ | ✅ | ✅ | ❌ | ❌ |
| Geração de crédito | ✅ | ✅ | ✅ | ❌ | ❌ |
| NF-e de entrada | ✅ | ✅ | ⏳ | ❌ | ❌ |

**Tabelas:** `devolucoes`, `devolucoes_itens`  
**Rotas:** `devolucoes.routes.ts`

### Checklist para Finalização:
- [ ] Integrar emissão NF-e devolução
- [ ] Testes de fluxo
- [ ] Tela de devolução

---

## 📦 Capítulo 04.8 - Troca de Venda

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Registro de troca | ✅ | ✅ | ✅ | ❌ | ❌ |
| Itens devolvidos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Itens novos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Diferença a pagar/receber | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `trocas`, `trocas_itens_devolvidos`, `trocas_itens_novos`  
**Rotas:** `trocas.routes.ts`

### Checklist para Finalização:
- [ ] Integrar com NF-e
- [ ] Testes de fluxo
- [ ] Tela de troca

---

## 📦 Capítulo 04.9 - Serviços (O.S.)

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Ordem de Serviço | ✅ | ✅ | ✅ | ❌ | ❌ |
| Itens/materiais | ✅ | ✅ | ✅ | ❌ | ❌ |
| Histórico de status | ✅ | ✅ | ✅ | ❌ | ❌ |
| Agendamento | ✅ | ✅ | ✅ | ❌ | ❌ |
| NFS-e | ✅ | ✅ | ⏳ | ❌ | ❌ |

**Tabelas:** `ordens_servico`, `ordens_servico_itens`, `ordens_servico_historico`  
**Rotas:** `ordens-servico.routes.ts`

### Checklist para Finalização:
- [ ] Integrar emissão NFS-e
- [ ] Testes de fluxo
- [ ] Tela de O.S.
- [ ] Assinatura digital do cliente

---

## 📦 Capítulo 04.10 - Consignação

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Envio em consignação | ✅ | ✅ | ✅ | ❌ | ❌ |
| Itens consignados | ✅ | ✅ | ✅ | ❌ | ❌ |
| Retorno/venda | ✅ | ✅ | ✅ | ❌ | ❌ |
| Controle de prazo | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `consignacoes`, `consignacoes_itens`  
**Rotas:** `consignacoes.routes.ts`

### Checklist para Finalização:
- [ ] Testes de fluxo
- [ ] Tela de consignação
- [ ] Alertas de vencimento

---

## 📦 Capítulo 04.11 - Garantia de Produtos

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Abertura de chamado | ✅ | ✅ | ✅ | ❌ | ❌ |
| Histórico | ✅ | ✅ | ✅ | ❌ | ❌ |
| Análise técnica | ✅ | ✅ | ✅ | ❌ | ❌ |
| Resolução | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `garantias`, `garantias_historico`  
**Rotas:** `garantias.routes.ts`

### Checklist para Finalização:
- [ ] Testes de fluxo
- [ ] Tela de garantias
- [ ] Relatórios de garantia

---

## 📦 Capítulo 04.12 - Gamificação

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Metas de vendedores | ✅ | ✅ | ✅ | ❌ | ❌ |
| Sistema de pontuação | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Ranking | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Premiações | ✅ | ✅ | 🟡 | ❌ | ❌ |

**Tabelas:** `vendedores`, `vendedores_metas`, `bonificacoes`, `bonificacoes_participantes`  
**Rotas:** `vendedores.routes.ts`

### Checklist para Finalização:
- [ ] Completar lógica de pontuação
- [ ] Testes de gamificação
- [ ] Dashboard de performance
- [ ] Tela de ranking

---

# PARTE 3 - MÓDULO COMPRAS (12 Submódulos)

## 📦 Capítulo 05.1-05.7 - Compras Base

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Cotações | ✅ | ✅ | ✅ | ❌ | ❌ |
| Pedidos de compra | ✅ | ✅ | ✅ | ❌ | ❌ |
| Recebimento | ✅ | ✅ | ✅ | ❌ | ❌ |
| Devolução compra | ✅ | ✅ | ✅ | ❌ | ❌ |
| Importação NF-e | ✅ | ✅ | ⏳ | ❌ | ❌ |
| Análise de preços | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `cotacoes_compra`, `pedidos_compra`, `pedidos_compra_itens`, `requisicoes_compra`  
**Rotas:** `compras.routes.ts`

### Checklist para Finalização:
- [ ] Integrar importação de XML NF-e
- [ ] Manifestação do destinatário
- [ ] Testes completos
- [ ] Telas de compras

---

## 📦 Capítulo 05.8 - Estoque

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Saldo por local | ✅ | ✅ | ✅ | ❌ | ❌ |
| Movimentações | ✅ | ✅ | ✅ | ❌ | ❌ |
| Reservas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Transferências | ✅ | ✅ | ✅ | ❌ | ❌ |
| Inventário | ✅ | ✅ | ✅ | ❌ | ❌ |
| Curva ABC | ✅ | ✅ | 🟡 | ❌ | ❌ |

**Tabelas:** `estoque`, `estoque_movimentacoes`, `estoque_reservas`, `locais_estoque`, `transferencias`, `inventarios`  
**Rotas:** `estoque.routes.ts`, `locais-estoque.routes.ts`, `transferencias.routes.ts`, `inventarios.routes.ts`

### Checklist para Finalização:
- [ ] Implementar curva ABC completa
- [ ] Testes de movimentação
- [ ] Telas de estoque
- [ ] Dashboard de estoque

---

## 📦 Capítulo 05.9-05.12 - WMS/Produção/Kits/Custos

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| WMS endereçamento | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Produção/PCP | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Gestão de kits | ✅ | ✅ | ✅ | ❌ | ❌ |
| Custos fixos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Precificação | ✅ | ✅ | ✅ | ❌ | ❌ |
| Markup | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `custos_fixos`, `custos_rateios`, `markup_categorias`, `precos_custos_historico`  
**Rotas:** Embutido em produtos e configurações

### Checklist para Finalização:
- [ ] Completar WMS
- [ ] Completar PCP
- [ ] Testes de custos
- [ ] Tela de formação de preço

---

# PARTE 4 - MÓDULOS FINANCEIROS

## 📦 Capítulo 06 - Contas a Receber

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Títulos/parcelas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Baixas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Boletos | ✅ | ✅ | ⏳ | ❌ | ❌ |
| PIX | ✅ | ✅ | ⏳ | ❌ | ❌ |
| Régua de cobrança | ✅ | ✅ | ✅ | ❌ | ❌ |
| Renegociação | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `contas_receber`, `contas_receber_baixas`, `contas_receber_historico`, `cobrancas_regua`, `cobrancas_enviadas`  
**Rotas:** `contas-receber.routes.ts`

### Checklist para Finalização:
- [ ] Integrar emissão de boletos (TecnoSpeed)
- [ ] Integrar PIX (TecnoSpeed)
- [ ] Conciliação automática
- [ ] Testes completos
- [ ] Telas de contas a receber

---

## 📦 Capítulo 07 - Contas a Pagar

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Títulos a pagar | ✅ | ✅ | ✅ | ❌ | ❌ |
| Aprovação por alçada | ✅ | ✅ | ✅ | ❌ | ❌ |
| Baixas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Pagamento em lote | ✅ | ✅ | ⏳ | ❌ | ❌ |
| CNAB | ✅ | ✅ | ⏳ | ❌ | ❌ |

**Tabelas:** `contas_pagar`, `contas_pagar_baixas`, `contas_pagar_aprovacoes`, `alcadas_aprovacao`  
**Rotas:** `contas-pagar.routes.ts`

### Checklist para Finalização:
- [ ] Integrar pagamento bancário (TecnoSpeed)
- [ ] Integrar CNAB
- [ ] Testes completos
- [ ] Telas de contas a pagar

---

## 📦 Capítulo 08-09 - Fluxo de Caixa e Bancos

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Fluxo de caixa | ✅ | ✅ | ✅ | ❌ | ❌ |
| DRE gerencial | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Contas bancárias | ✅ | ✅ | ✅ | ❌ | ❌ |
| Movimentações | ✅ | ✅ | ✅ | ❌ | ❌ |
| Conciliação | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Open Banking | ✅ | ✅ | ⏳ | ❌ | ❌ |

**Tabelas:** `contas_bancarias`, `movimentacoes_bancarias`, `conciliacoes`  
**Rotas:** `bancos.routes.ts`

### Checklist para Finalização:
- [ ] Completar DRE gerencial
- [ ] Integrar Open Banking (TecnoSpeed)
- [ ] Conciliação automática
- [ ] Testes completos
- [ ] Telas financeiras

---

# PARTE 5 - MÓDULOS FISCAIS E CONTÁBEIS

## 📦 Capítulos 10-14 - Fiscal/Contábil

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Regras fiscais (CFOP) | ✅ | ✅ | ✅ | ❌ | ❌ |
| ICMS/ST | ✅ | ✅ | ✅ | ❌ | ❌ |
| NF-e | ✅ | ✅ | ⏳ | ❌ | ❌ |
| NFC-e | ✅ | ✅ | ⏳ | ❌ | ❌ |
| NFS-e | ✅ | ✅ | ⏳ | ❌ | ❌ |
| CT-e | ✅ | ✅ | ⏳ | ❌ | ❌ |
| SPED | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Contabilidade | ✅ | ✅ | ✅ | ❌ | ❌ |
| Patrimônio | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `cfop`, `cfop_operacoes`, `icms_uf`, `icms_st_uf`, `aliquotas_interestaduais`, `regras_fiscais`, `ncm`, `nfe`, `nfe_itens`, `nfce`, `nfse`, `sped_arquivos`, `contabil_*`, `patrimonio_*`  
**Rotas:** `notas-fiscais.routes.ts`, `contabilidade.routes.ts`, `patrimonio.routes.ts`

### Checklist para Finalização:
- [ ] **CRÍTICO:** Integrar TecnoSpeed/Nuvem Fiscal para emissão
- [ ] Integrar consulta SEFAZ
- [ ] Gerar arquivos SPED
- [ ] Testes fiscais completos
- [ ] Telas de documentos fiscais
- [ ] Dashboard fiscal

---

# PARTE 6-7 - LOGÍSTICA E INTELIGÊNCIA

## 📦 Capítulo 15 - Logística

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Rotas de entrega | ✅ | ✅ | ✅ | ❌ | ❌ |
| Motoristas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Veículos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Rastreamento | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ocorrências | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `rotas`, `rotas_entregas`, `motoristas`, `veiculos`, `entregas_rastreamento`, `entregas_ocorrencias`  
**Rotas:** `rotas.routes.ts`, `motoristas.routes.ts`, `veiculos.routes.ts`, `entregas.routes.ts`, `rastreamento.routes.ts`

### Checklist para Finalização:
- [ ] Testes de logística
- [ ] Tela de roteirização
- [ ] Mapa de entregas
- [ ] App do motorista (mobile)

---

## 📦 Capítulo 16 - BI e Dashboards

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Dashboards configuráveis | ✅ | ✅ | ✅ | ❌ | ❌ |
| Widgets | ✅ | ✅ | ✅ | ❌ | ❌ |
| Relatórios gerenciais | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Exportação | ✅ | ✅ | 🟡 | ❌ | ❌ |

**Tabelas:** `dashboards`, `dashboards_widgets`, `relatorios`, `relatorios_agendados`, `relatorios_execucoes`  
**Rotas:** `bi.routes.ts`

### Checklist para Finalização:
- [ ] Completar relatórios gerenciais
- [ ] Testes de BI
- [ ] Interface de dashboards
- [ ] Gráficos interativos

---

# PARTE 8 - MARKETING/E-COMMERCE/ATENDIMENTO

## 📦 Capítulos 17-19

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| E-commerce B2B/B2C | ✅ | ✅ | ✅ | ❌ | ❌ |
| Carrinho/checkout | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cupons/promoções | ✅ | ✅ | ✅ | ❌ | ❌ |
| Integ. marketplaces | ✅ | ✅ | ⏳ | ❌ | ❌ |
| Tickets de suporte | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `loja_*`, `carrinhos`, `carrinhos_itens`, `cupons`, `promocoes`, `tickets`, `tickets_mensagens`  
**Rotas:** `ecommerce.routes.ts`, `tickets.routes.ts`

### Checklist para Finalização:
- [ ] Integrar Baselinker (marketplaces)
- [ ] Testes de e-commerce
- [ ] Loja virtual completa
- [ ] Tela de tickets

---

# PARTE 9-11 - INTEGRAÇÃO/INTERFACE/SUPORTE

## 📦 Integrações e Interfaces

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Configuração integrações | ✅ | ✅ | ✅ | ❌ | ❌ |
| Logs de integração | ✅ | ✅ | ✅ | ❌ | ❌ |
| Filas de processamento | ✅ | ✅ | ✅ | ❌ | ❌ |
| Notificações push | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ajuda contextual | ✅ | ✅ | ✅ | ❌ | ❌ |
| Import/Export | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `integracoes`, `integracoes_logs`, `integracoes_filas`, `notificacoes`, `ajuda_*`, `importacoes`, `exportacoes`  
**Rotas:** `notificacoes.routes.ts`, `import-export.routes.ts`

### Checklist para Finalização:
- [ ] Configurar integrações externas
- [ ] Testes de notificações
- [ ] Telas de configuração

---

# PARTE 12 - RH

## 📦 Capítulos 26-27 - Recursos Humanos

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Colaboradores | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cargos/departamentos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ponto eletrônico | ✅ | ✅ | ✅ | ❌ | ❌ |
| Banco de horas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Férias | ✅ | ✅ | ✅ | ❌ | ❌ |
| Folha de pagamento | ✅ | ✅ | ✅ | ❌ | ❌ |
| Benefícios | ✅ | ✅ | ✅ | ❌ | ❌ |

**Tabelas:** `colaboradores`, `colaboradores_*`, `cargos`, `departamentos`, `pontos`, `banco_horas`, `ferias`, `folha_pagamento`, `beneficios`  
**Rotas:** `rh.routes.ts`, `folha-pagamento.routes.ts`

### Checklist para Finalização:
- [ ] Testes de RH completos
- [ ] Telas de gestão de pessoas
- [ ] App do colaborador (mobile)
- [ ] Integração eSocial

---

# PARTE 13 - CONTRATOS

## 📦 Capítulo 28 - Gestão de Contratos

| Item | Docs | Banco | API | Testes | Frontend |
|------|:----:|:-----:|:---:|:------:|:--------:|
| Contratos clientes | ✅ | ✅ | ✅ | ❌ | ❌ |
| Contratos fornecedores | ✅ | ✅ | ✅ | ❌ | ❌ |
| Aditivos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Parcelas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Alertas vencimento | ✅ | ✅ | ✅ | ❌ | ❌ |
| Assinatura digital | ✅ | ✅ | ⏳ | ❌ | ❌ |

**Tabelas:** `contratos`, `contratos_aditivos`, `contratos_parcelas`  
**Rotas:** `contratos.routes.ts`

### Checklist para Finalização:
- [ ] Integrar assinatura digital
- [ ] Testes de contratos
- [ ] Telas de contratos

---

# 📊 RESUMO EXECUTIVO

## Contadores Gerais

| Métrica | Quantidade |
|---------|------------|
| **Capítulos documentados** | 28 |
| **Tabelas no banco** | 207 |
| **Arquivos de rotas** | 63 |
| **Endpoints estimados** | ~600 |
| **Integrações planejadas** | 10 |

## Status por Fase

| Fase | Progresso | Observação |
|------|-----------|------------|
| 📚 Documentação | ✅ 100% | 313 regras, 185 casos de uso |
| 🗄️ Banco de Dados | ✅ 100% | 207 tabelas criadas |
| ⚙️ API Backend | ✅ 100% | ~600 endpoints |
| 🔗 Integrações | 🟡 30% | TecnoSpeed/Nuvem Fiscal pendente |
| 🧪 Testes | ❌ 0% | Próxima prioridade |
| 🎨 Frontend | ❌ 5% | Por último |

## Integrações Críticas Pendentes

| Integração | Provedor | Uso | Prioridade |
|------------|----------|-----|------------|
| **Emissão NF-e/NFC-e** | TecnoSpeed/Nuvem Fiscal | Documentos fiscais | 🔴 ALTA |
| **Boletos** | TecnoSpeed | Financeiro | 🔴 ALTA |
| **PIX** | TecnoSpeed | Financeiro | 🔴 ALTA |
| **Consulta CNPJ** | CNPJá | Cadastros | 🟡 MÉDIA |
| **WhatsApp** | API Brasil | Comunicação | 🟡 MÉDIA |
| **Marketplaces** | Baselinker | E-commerce | 🟢 BAIXA |

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### Fase Imediata (Dezembro/Janeiro)
1. ⚙️ Configurar integrações fiscais (TecnoSpeed/Nuvem Fiscal)
2. 🧪 Criar testes para módulos CORE
3. 🔗 Integrar emissão de boletos e PIX

### Fase Curto Prazo (Fevereiro)
4. 🧪 Testes dos módulos Comercial e Compras
5. 🔗 Integrar consulta CNPJ/CPF
6. 📊 Completar relatórios gerenciais

### Fase Médio Prazo (Março)
7. 🎨 Iniciar desenvolvimento Frontend
8. 📱 Desenvolver PWA/Mobile
9. 🔗 Integrar marketplaces

---

*Documento gerado em: 13/12/2024*  
*Versão: 1.0*
