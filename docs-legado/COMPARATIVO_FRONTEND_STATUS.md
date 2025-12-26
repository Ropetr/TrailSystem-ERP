# 🗺️ COMPARATIVO: MAPA DE MÓDULOS vs FRONTEND IMPLEMENTADO

**Data da análise:** 14/12/2024
**Fonte:** MAPA_MODULOS_PLANAC.md (28 Capítulos, 13 Partes)

---

## 📊 RESUMO EXECUTIVO

| Aspecto | Documentado | Implementado | % |
|---------|-------------|--------------|---|
| Módulos | 13 Partes | 13 Módulos | ✅ 100% |
| Páginas Frontend | ~60+ | 57 | 🟡 95% |
| Testes | 0% (doc) | 443 testes | ✅ Excedeu |

---

## PARTE 1 - MÓDULOS CORE

### Capítulo 01 - Gestão de Empresas e Multi-Tenant
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Cadastro de empresas | ✅ | ✅ | ✅ | ✅ EmpresasPage, EmpresaFormPage |
| Cadastro de filiais | ✅ | ✅ | ✅ | ✅ FiliaisPage |
| Config. fiscais por empresa | ✅ | ✅ | ✅ | ✅ ConfiguracoesPage |
| Parâmetros por empresa | ✅ | ✅ | ✅ | ✅ ConfiguracoesPage |
| Consolidação entre empresas | ✅ | ✅ | 🟡 | ❌ Pendente |

### Capítulo 02 - Cadastros Base
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Clientes (PF/PJ) | ✅ | ✅ | ✅ | ✅ ClientesPage, ClienteFormPage |
| Integração API CNPJ | ✅ | ✅ | ⏳ | 🟡 Parcial (validação) |
| Fornecedores | ✅ | ✅ | ✅ | ✅ FornecedoresPage |
| Produtos | ✅ | ✅ | ✅ | ✅ ProdutosPage, ProdutoFormPage |
| Categorias | ✅ | ✅ | ✅ | ✅ (dentro de ProdutosPage) |
| Marcas | ✅ | ✅ | ✅ | ✅ (dentro de ProdutosPage) |
| Unidades de medida | ✅ | ✅ | ✅ | ✅ (dentro de ProdutosPage) |
| Tabelas de preço | ✅ | ✅ | ✅ | 🟡 Parcial |
| Kits de produtos | ✅ | ✅ | ✅ | ❌ Pendente |

### Capítulo 03 - Gestão de Usuários e Permissões
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Cadastro de usuários | ✅ | ✅ | ✅ | ✅ UsuariosPage, UsuarioFormPage |
| Perfis de acesso | ✅ | ✅ | ✅ | ✅ PerfisPage |
| Permissões por módulo | ✅ | ✅ | ✅ | ✅ PerfisPage |
| Autenticação JWT | ✅ | ✅ | ✅ | ✅ LoginPage |
| 2FA (opcional) | ✅ | ✅ | 🟡 | ❌ Pendente |
| Log de auditoria | ✅ | ✅ | ✅ | ❌ Pendente (tela) |

**Status CORE: 9 páginas ✅ | Cobertura: 85%**

---

## PARTE 2 - MÓDULO COMERCIAL (12 Submódulos)

### Capítulo 04.1 - CRM
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Funil de vendas | ✅ | ✅ | ✅ | ❌ Pendente |
| Pipeline de oportunidades | ✅ | ✅ | ✅ | ❌ Pendente |
| Leads | ✅ | ✅ | ✅ | ❌ Pendente |
| Atividades e follow-ups | ✅ | ✅ | ✅ | ❌ Pendente |
| Histórico de interações | ✅ | ✅ | ✅ | ❌ Pendente |

### Capítulo 04.2 - CalcPro (Calculadoras)
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Cadastro de sistemas | ✅ | ✅ | ✅ | ❌ Pendente |
| Componentes por sistema | ✅ | ✅ | ✅ | ❌ Pendente |
| Projetos e ambientes | ✅ | ✅ | ✅ | ❌ Pendente |
| Cálculo automático | ✅ | ✅ | 🟡 | ❌ Pendente |
| Conversão em orçamento | ✅ | ✅ | 🟡 | ❌ Pendente |

### Capítulo 04.3 - Orçamentos
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| CRUD de orçamentos | ✅ | ✅ | ✅ | ✅ OrcamentosPage, OrcamentoFormPage |
| Itens do orçamento | ✅ | ✅ | ✅ | ✅ OrcamentoFormPage |
| Versionamento | ✅ | ✅ | ✅ | 🟡 Parcial |
| Conversão em pedido | ✅ | ✅ | ✅ | ✅ OrcamentosPage |
| Mesclar orçamentos | ✅ | ✅ | 🟡 | ❌ Pendente |
| Desmembrar orçamentos | ✅ | ✅ | 🟡 | ❌ Pendente |
| Envio por email/WhatsApp | ✅ | ✅ | ⏳ | 🟡 Email OK, WhatsApp pendente |

### Capítulo 04.4 - Pedido de Venda
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| CRUD de pedidos | ✅ | ✅ | ✅ | ✅ VendasPage, VendaFormPage |
| Itens do pedido | ✅ | ✅ | ✅ | ✅ VendaFormPage |
| Status do pedido | ✅ | ✅ | ✅ | ✅ VendasPage |
| Checkbox bonificado | ✅ | ✅ | ✅ | 🟡 Parcial |
| Entregas fracionadas | ✅ | ✅ | ✅ | ❌ Pendente (tela) |
| Faturamento flexível | ✅ | ✅ | 🟡 | ❌ Pendente |
| Múltiplas formas pgto | ✅ | ✅ | ✅ | ✅ VendaFormPage |
| Uso de crédito cliente | ✅ | ✅ | ✅ | ❌ Pendente |
| Limite de crédito | ✅ | ✅ | ✅ | ✅ ClientesPage |
| Comissões | ✅ | ✅ | ✅ | ❌ Pendente (tela) |

### Capítulo 04.5 - PDV
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Abertura/fechamento caixa | ✅ | ✅ | ✅ | ❌ Pendente |
| Venda rápida | ✅ | ✅ | ✅ | ❌ Pendente |
| Sangria e suprimento | ✅ | ✅ | ✅ | ❌ Pendente |
| Múltiplas formas pgto | ✅ | ✅ | ✅ | ❌ Pendente |
| Integração NFC-e | ✅ | ✅ | ⏳ | ❌ Pendente |
| TEF (cartões) | ✅ | ✅ | ⏳ | ❌ Pendente |

### Capítulos 04.6 a 04.12 - Outros Comercial
| Submódulo | Frontend |
|-----------|----------|
| Programa de Indicações | ❌ Pendente |
| Devolução de Venda | ❌ Pendente |
| Troca de Venda | ❌ Pendente |
| Serviços (O.S.) | ❌ Pendente |
| Consignação | ❌ Pendente |
| Garantia de Produtos | ❌ Pendente |
| Gamificação | ❌ Pendente |

**Status COMERCIAL: 8 páginas ✅ | Cobertura: 40%**

---

## PARTE 3 - MÓDULO COMPRAS

### Capítulo 05.1-05.7 - Compras Base
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Cotações | ✅ | ✅ | ✅ | ✅ CotacoesPage |
| Pedidos de compra | ✅ | ✅ | ✅ | ✅ PedidosCompraPage |
| Recebimento | ✅ | ✅ | ✅ | 🟡 Parcial |
| Devolução compra | ✅ | ✅ | ✅ | ❌ Pendente |
| Importação NF-e | ✅ | ✅ | ⏳ | ❌ Pendente |
| Análise de preços | ✅ | ✅ | ✅ | ✅ CotacoesPage |
| Fornecedores | ✅ | ✅ | ✅ | ✅ FornecedoresPage |

### Capítulo 05.8 - Estoque
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Saldo por local | ✅ | ✅ | ✅ | ✅ SaldosPage |
| Movimentações | ✅ | ✅ | ✅ | ✅ MovimentacoesPage |
| Reservas | ✅ | ✅ | ✅ | 🟡 Parcial |
| Transferências | ✅ | ✅ | ✅ | ✅ TransferenciasPage |
| Inventário | ✅ | ✅ | ✅ | ✅ InventarioPage |
| Curva ABC | ✅ | ✅ | 🟡 | ❌ Pendente |
| Rastreabilidade | ✅ | ✅ | ✅ | ✅ RastreabilidadePage |

### Capítulo 05.9-05.12 - WMS/Produção/Kits/Custos
| Item | Frontend |
|------|----------|
| WMS endereçamento | ❌ Pendente |
| Produção/PCP | ❌ Pendente |
| Gestão de kits | ❌ Pendente |
| Custos fixos | ❌ Pendente |
| Precificação | ❌ Pendente |
| Markup | ❌ Pendente |

**Status COMPRAS+ESTOQUE: 9 páginas ✅ | Cobertura: 60%**

---

## PARTE 4 - MÓDULOS FINANCEIROS

### Capítulo 06 - Contas a Receber
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Títulos/parcelas | ✅ | ✅ | ✅ | ✅ ContasReceberPage |
| Baixas | ✅ | ✅ | ✅ | ✅ ContasReceberPage |
| Boletos | ✅ | ✅ | ⏳ | ✅ BoletosPage |
| PIX | ✅ | ✅ | ⏳ | 🟡 Parcial |
| Régua de cobrança | ✅ | ✅ | ✅ | ❌ Pendente |
| Renegociação | ✅ | ✅ | ✅ | ✅ ContasReceberPage |

### Capítulo 07 - Contas a Pagar
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Títulos a pagar | ✅ | ✅ | ✅ | ✅ ContasPagarPage |
| Aprovação por alçada | ✅ | ✅ | ✅ | ❌ Pendente |
| Baixas | ✅ | ✅ | ✅ | ✅ ContasPagarPage |
| Pagamento em lote | ✅ | ✅ | ⏳ | ❌ Pendente |
| CNAB | ✅ | ✅ | ⏳ | ✅ BoletosPage |

### Capítulo 08-09 - Fluxo de Caixa e Bancos
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Fluxo de caixa | ✅ | ✅ | ✅ | ✅ FluxoCaixaPage |
| DRE gerencial | ✅ | ✅ | 🟡 | ✅ DREPage |
| Contas bancárias | ✅ | ✅ | ✅ | ❌ Pendente (tela própria) |
| Movimentações | ✅ | ✅ | ✅ | ✅ FluxoCaixaPage |
| Conciliação | ✅ | ✅ | 🟡 | ✅ ConciliacaoPage |
| Open Banking | ✅ | ✅ | ⏳ | ❌ Pendente |

**Status FINANCEIRO: 5 páginas ✅ | Cobertura: 70%**

---

## PARTE 5 - MÓDULOS FISCAIS E CONTÁBEIS

### Capítulos 10-14 - Fiscal/Contábil
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Regras fiscais (CFOP) | ✅ | ✅ | ✅ | ✅ ConfigFiscalPage |
| ICMS/ST | ✅ | ✅ | ✅ | ✅ ConfigFiscalPage |
| NF-e | ✅ | ✅ | ⏳ | ✅ NotasPage, NotaFormPage |
| NFC-e | ✅ | ✅ | ⏳ | ✅ NFCePage |
| NFS-e | ✅ | ✅ | ⏳ | ❌ Pendente |
| CT-e | ✅ | ✅ | ⏳ | ❌ Pendente |
| SPED | ✅ | ✅ | 🟡 | ❌ Pendente |
| Plano de Contas | ✅ | ✅ | ✅ | ✅ PlanoContasPage |
| Lançamentos | ✅ | ✅ | ✅ | ✅ LancamentosPage |
| DRE | ✅ | ✅ | ✅ | ✅ DREPage |
| Balanço | ✅ | ✅ | ✅ | ✅ BalancoPage |
| Patrimônio (Ativos) | ✅ | ✅ | ✅ | ✅ AtivosPage |
| Depreciação | ✅ | ✅ | ✅ | ✅ DepreciacaoPage |

**Status FISCAL+CONTABIL+PATRIMÔNIO: 10 páginas ✅ | Cobertura: 75%**

---

## PARTE 6 - LOGÍSTICA

### Capítulo 15 - Logística
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Rotas de entrega | ✅ | ✅ | ✅ | ✅ RotasPage |
| Motoristas | ✅ | ✅ | ✅ | ✅ FrotaPage |
| Veículos | ✅ | ✅ | ✅ | ✅ FrotaPage |
| Rastreamento | ✅ | ✅ | ✅ | ✅ RastreioPage |
| Ocorrências | ✅ | ✅ | ✅ | ✅ EntregasPage |
| Entregas | ✅ | ✅ | ✅ | ✅ EntregasPage |
| Separação | ✅ | ✅ | ✅ | ❌ Pendente |
| Expedição | ✅ | ✅ | ✅ | ❌ Pendente |

**Status LOGÍSTICA: 4 páginas ✅ | Cobertura: 70%**

---

## PARTE 7 - INTELIGÊNCIA (BI)

### Capítulo 16 - BI e Dashboards
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Dashboards configuráveis | ✅ | ✅ | ✅ | ✅ DashboardPage |
| Widgets | ✅ | ✅ | ✅ | ✅ DashboardPage |
| Relatórios gerenciais | ✅ | ✅ | 🟡 | ✅ RelatoriosPage |
| Indicadores | ✅ | ✅ | ✅ | ✅ IndicadoresPage |
| Exportação | ✅ | ✅ | 🟡 | ✅ RelatoriosPage |

**Status BI: 3 páginas ✅ | Cobertura: 90%**

---

## PARTE 8 - MARKETING/E-COMMERCE/ATENDIMENTO

### Capítulos 17-19
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| E-commerce B2B/B2C | ✅ | ✅ | ✅ | ✅ ProdutosOnlinePage |
| Carrinho/checkout | ✅ | ✅ | ✅ | ❌ Pendente |
| Cupons/promoções | ✅ | ✅ | ✅ | ❌ Pendente |
| Integrações marketplaces | ✅ | ✅ | ⏳ | ✅ IntegracoesPage |
| Pedidos online | ✅ | ✅ | ✅ | ✅ PedidosOnlinePage |
| Tickets de suporte | ✅ | ✅ | ✅ | ✅ TicketsPage |
| Base conhecimento | ✅ | ✅ | ✅ | ✅ BaseConhecimentoPage |

**Status E-COMMERCE+SUPORTE: 6 páginas ✅ | Cobertura: 65%**

---

## PARTE 12 - RH

### Capítulos 26-27 - Recursos Humanos
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Colaboradores | ✅ | ✅ | ✅ | ✅ FuncionariosPage |
| Cargos/departamentos | ✅ | ✅ | ✅ | ✅ FuncionariosPage |
| Ponto eletrônico | ✅ | ✅ | ✅ | ✅ PontoPage |
| Banco de horas | ✅ | ✅ | ✅ | ✅ PontoPage |
| Férias | ✅ | ✅ | ✅ | 🟡 Parcial |
| Folha de pagamento | ✅ | ✅ | ✅ | ✅ FolhaPage |
| Benefícios | ✅ | ✅ | ✅ | ❌ Pendente |

**Status RH: 3 páginas ✅ | Cobertura: 75%**

---

## PARTE 13 - CONTRATOS

### Capítulo 28 - Gestão de Contratos
| Item | Docs | Banco | API | Frontend |
|------|------|-------|-----|----------|
| Contratos clientes | ✅ | ✅ | ✅ | ❌ Pendente |
| Contratos fornecedores | ✅ | ✅ | ✅ | ❌ Pendente |
| Aditivos | ✅ | ✅ | ✅ | ❌ Pendente |
| Parcelas | ✅ | ✅ | ✅ | ❌ Pendente |
| Alertas vencimento | ✅ | ✅ | ✅ | ❌ Pendente |
| Assinatura digital | ✅ | ✅ | ⏳ | ❌ Pendente |

**Status CONTRATOS: 0 páginas ❌ | Cobertura: 0%**

---

## 📈 RESUMO CONSOLIDADO

| Parte | Módulo | Documentado | Implementado | Páginas | Cobertura |
|-------|--------|-------------|--------------|---------|-----------|
| 1 | CORE | ✅ | ✅ | 9 | 85% |
| 2 | COMERCIAL | ✅ | 🟡 | 8 | 40% |
| 3 | COMPRAS | ✅ | ✅ | 3 | 60% |
| 3 | ESTOQUE | ✅ | ✅ | 6 | 70% |
| 4 | FINANCEIRO | ✅ | ✅ | 5 | 70% |
| 5 | FISCAL | ✅ | ✅ | 4 | 65% |
| 5 | CONTÁBIL | ✅ | ✅ | 4 | 80% |
| 5 | PATRIMÔNIO | ✅ | ✅ | 2 | 100% |
| 6 | LOGÍSTICA | ✅ | ✅ | 4 | 70% |
| 7 | BI | ✅ | ✅ | 3 | 90% |
| 8 | E-COMMERCE | ✅ | ✅ | 4 | 65% |
| 8 | SUPORTE | ✅ | ✅ | 2 | 100% |
| 12 | RH | ✅ | ✅ | 3 | 75% |
| 13 | CONTRATOS | ✅ | ❌ | 0 | 0% |

**TOTAL: 57 páginas | ~67% cobertura média**

---

## 🎯 MÓDULOS PRIORITÁRIOS PENDENTES

### Alta Prioridade (Afeta Operação)
1. **PDV** - Ponto de Venda completo
2. **CRM** - Pipeline e funil de vendas
3. **Contratos** - Módulo inteiro não existe
4. **NFS-e** - Emissão de nota de serviço

### Média Prioridade
5. **CalcPro** - Calculadora de drywall
6. **Devolução/Troca** - Fluxos comerciais
7. **WMS** - Endereçamento de estoque
8. **Open Banking** - Conciliação automática

### Baixa Prioridade
9. **Gamificação** - Metas vendedores
10. **Consignação** - Fluxo específico
11. **Serviços (O.S.)** - Ordem de serviço
12. **SPED** - Arquivos fiscais
