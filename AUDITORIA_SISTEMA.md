# AUDITORIA COMPLETA - TrailSystem ERP
**Data:** 30/12/2025
**Objetivo:** Validar o que está pronto e o que falta acabar, tela por tela, botão por botão, endpoint por endpoint

---

## RESUMO EXECUTIVO

### Componentes do Sistema
- **Migrations:** 48 arquivos SQL
- **Routes (API):** 67 arquivos de rotas
- **Frontend Pages:** ~95 páginas TSX
- **Documentação:** 17 módulos documentados

---

## 1. INVENTÁRIO POR MÓDULO

### 1.1 AUTENTICAÇÃO (Auth)
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0002_core_usuarios.sql | Existe | Tabelas: usuarios, perfis, permissoes |
| **Routes:** auth.routes.ts, auth.ts | Existe | Login, registro, refresh token |
| **Frontend:** LoginPage, CadastroPage, EsqueciSenhaPage, RedefinirSenhaPage, VerificarEmailPage | Existe | Fluxo completo |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.2 CADASTROS - CLIENTES
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0005_cadastros.sql | Existe | Tabela clientes |
| **Routes:** clientes.routes.ts | Existe | CRUD completo |
| **Frontend:** ClientesPage (modal popup) | Existe | Sem página de formulário separada |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.3 CADASTROS - FORNECEDORES
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0005_cadastros.sql | Existe | Tabela fornecedores |
| **Routes:** fornecedores.routes.ts | Existe | CRUD completo |
| **Frontend:** FornecedoresPage, FornecedorFormPage | Existe | Fluxo completo |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.4 CADASTROS - PRODUTOS
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0005_cadastros.sql | Existe | Tabela produtos |
| **Routes:** produtos.routes.ts | Existe | CRUD completo |
| **Frontend:** ProdutosPage, ProdutoFormPage | Existe | Fluxo completo |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.5 CADASTROS - USUÁRIOS E PERFIS
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0002_core_usuarios.sql | Existe | Tabelas usuarios, perfis |
| **Routes:** usuarios.routes.ts, perfis.routes.ts | Existe | CRUD completo |
| **Frontend:** UsuariosPage, UsuarioFormPage, PerfisPage | Existe | Form de perfil "Em Desenvolvimento" |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.6 COMERCIAL - ORÇAMENTOS
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0007_comercial.sql, 0052_fluxo_orcamento_mesclar_desmembrar.sql | Existe | Tabelas orcamentos, orcamentos_itens |
| **Routes:** orcamentos.routes.ts | Existe | CRUD + mesclar/desmembrar |
| **Frontend:** OrcamentosPage, OrcamentoFormPage | Existe | Fluxo completo |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.7 COMERCIAL - VENDAS
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0007_comercial.sql, 0050_fluxo_venda_completa.sql | Existe | Tabelas vendas, vendas_itens |
| **Routes:** vendedores.routes.ts (?) | Verificar | Pode estar em outro arquivo |
| **Frontend:** VendasPage, VendaFormPage | Existe | Fluxo completo |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.8 ESTOQUE
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0006_estoque.sql | Existe | Tabelas estoque, movimentacoes |
| **Routes:** estoque.routes.ts, inventarios.routes.ts, transferencias.routes.ts | Existe | CRUD completo |
| **Frontend:** SaldosPage, MovimentacoesPage, TransferenciasPage, InventarioPage | Existe | MovimentacaoForm "Em Desenvolvimento" |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.9 FISCAL - NF-e
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0010_fiscal.sql, 0022_fiscal_dfe.sql | Existe | Tabelas notas_fiscais, nfe_* |
| **Routes:** fiscal.routes.ts, notas-fiscais.routes.ts | Existe | Emissão, cancelamento |
| **Frontend:** NotasPage, NotaFormPage, NFCePage | Existe | Fluxo completo |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.10 FINANCEIRO - CONTAS A RECEBER
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0009_financeiro.sql, 0051_fluxo_recebimento_financeiro.sql | Existe | Tabelas contas_receber |
| **Routes:** contas-receber.routes.ts | Existe | CRUD + baixa |
| **Frontend:** ContasReceberPage, ContaReceberFormPage | Existe | Fluxo completo |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.11 FINANCEIRO - CONTAS A PAGAR
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0009_financeiro.sql | Existe | Tabelas contas_pagar |
| **Routes:** contas-pagar.routes.ts | Existe | CRUD + baixa |
| **Frontend:** ContasPagarPage, ContaPagarFormPage | Existe | Fluxo completo |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.12 FINANCEIRO - FLUXO DE CAIXA
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0009_financeiro.sql | Existe | Views de fluxo |
| **Routes:** (parte de financeiro) | Verificar | |
| **Frontend:** FluxoCaixaPage | Existe | |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.13 COMPRAS
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0013_compras.sql, 0053_fluxo_compra_completa.sql | Existe | Tabelas cotacoes, pedidos_compra |
| **Routes:** compras.routes.ts (829 linhas) | Existe | CRUD completo |
| **Frontend:** CotacoesPage, CotacaoFormPage, PedidosCompraPage, PedidoCompraFormPage | Existe | Fluxo completo |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.14 LOGÍSTICA
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0014_logistica.sql, 0059_fluxo_entrega_gps.sql | Existe | Tabelas entregas, rotas |
| **Routes:** entregas.routes.ts, rotas.routes.ts, rastreamento.routes.ts | Existe | CRUD + GPS |
| **Frontend:** EntregasPage, RotasPage, RastreioPage | Existe | Fluxo completo |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.15 CRM
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0012_crm.sql | Existe | Tabelas leads, oportunidades |
| **Routes:** crm.routes.ts (755 linhas) | Existe | CRUD completo |
| **Frontend:** CRMDashboardPage, PipelinePage, LeadsPage, OportunidadesPage, AtividadesPage | Existe | Fluxo completo |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.16 RH - FUNCIONÁRIOS
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0015_rh.sql | Existe | Tabela funcionarios |
| **Routes:** rh.routes.ts | Existe | CRUD funcionarios |
| **Frontend:** FuncionariosPage | Existe | ColaboradorFormPage "Em Desenvolvimento" |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.17 RH - ADMISSÕES (NOVO - PR #46)
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0064_fluxo_rh_esocial.sql | Existe | Tabela admissoes |
| **Routes:** rh.routes.ts (endpoints admissoes) | Existe | CRUD + e-Social S-2200 |
| **Frontend:** | NAO EXISTE | Precisa criar página de admissões |
| **PROBLEMA:** | CRITICO | Schema mismatch: routes usam candidato_nome/candidato_cpf, migration usa nome/cpf |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | N/A | |

### 1.18 RH - FOLHA DE PAGAMENTO
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0015_rh.sql, 0064_fluxo_rh_esocial.sql | Existe | Tabelas folha_pagamento, folha_calculos |
| **Routes:** rh.routes.ts, folha-pagamento.routes.ts | Existe | Cálculos INSS/IRRF/FGTS |
| **Frontend:** FolhaPage | Existe | |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.19 RH - FÉRIAS
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0064_fluxo_rh_esocial.sql | Existe | Tabelas ferias_programacao, ferias_solicitacoes |
| **Routes:** rh.routes.ts (endpoints ferias) | Existe | CRUD + aprovação |
| **Frontend:** | "Em Desenvolvimento" | Rota existe mas página placeholder |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | N/A | |

### 1.20 E-COMMERCE - NUVEM SHOP (NOVO - PR #46)
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0065_fluxo_ecommerce_nuvemshop.sql | Existe | Tabelas nuvemshop_* |
| **Routes:** ecommerce.routes.ts | Existe | OAuth, produtos, pedidos, webhooks |
| **Frontend:** ProdutosOnlinePage, PedidosOnlinePage, IntegracaoPage | Existe | Config "Em Desenvolvimento" |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.21 CONTÁBIL
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0016_contabil.sql | Existe | Tabelas plano_contas, lancamentos |
| **Routes:** contabilidade.routes.ts | Existe | CRUD |
| **Frontend:** PlanoContasPage, LancamentosPage, DREPage, BalancoPage | Existe | Fechamento "Em Desenvolvimento" |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.22 PATRIMÔNIO
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** (verificar) | Verificar | |
| **Routes:** patrimonio.routes.ts | Existe | |
| **Frontend:** AtivosPage, DepreciacaoPage | Existe | Manutenção "Em Desenvolvimento" |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.23 BI / RELATÓRIOS
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** (views) | Verificar | |
| **Routes:** bi.routes.ts (483 linhas) | Existe | Dashboards, indicadores |
| **Frontend:** BIDashboardPage, RelatoriosPage, IndicadoresPage | Existe | |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.24 COMISSÕES
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0019_auditoria_comissoes.sql | Existe | Tabelas comissoes |
| **Routes:** comissoes.routes.ts (465 linhas) | Existe | CRUD + cálculo |
| **Frontend:** | NAO EXISTE | Não há página de comissões no frontend |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | N/A | |

### 1.25 PDV (NOVO - PR #45)
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0011_pdv.sql, 0063_fluxo_pdv.sql | Existe | Tabelas pdv_*, caixas |
| **Routes:** pdv.routes.ts, caixas.routes.ts | Existe | Abertura/fechamento, vendas |
| **Frontend:** NFCePage | Existe | |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | PENDENTE | |

### 1.26 PRECIFICAÇÃO (NOVO - PR #45)
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0061_fluxo_precificacao.sql | Existe | Tabelas tabelas_preco, custos_produtos |
| **Routes:** tabelas-preco.routes.ts | Existe | CRUD + simulação |
| **Frontend:** | "Em Desenvolvimento" | Rota existe mas página placeholder |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | N/A | |

### 1.27 BONIFICAÇÃO (NOVO - PR #45)
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0062_fluxo_bonificacao.sql | Existe | Tabelas bonificacoes |
| **Routes:** (verificar) | Verificar | |
| **Frontend:** | NAO EXISTE | Não há página de bonificações |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | N/A | |

### 1.28 CONSIGNAÇÕES
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0020_consignacoes_devolucoes.sql, 0057_fluxo_consignacao.sql | Existe | Tabelas consignacoes |
| **Routes:** consignacoes.routes.ts | Existe | CRUD |
| **Frontend:** | NAO EXISTE | Não há página de consignações |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | N/A | |

### 1.29 DEVOLUÇÕES E TROCAS
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0020_consignacoes_devolucoes.sql, 0056_fluxo_devolucao_troca.sql | Existe | Tabelas devolucoes, trocas |
| **Routes:** devolucoes.routes.ts, trocas.routes.ts | Existe | CRUD |
| **Frontend:** | NAO EXISTE | Não há páginas de devoluções/trocas |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | N/A | |

### 1.30 GARANTIAS
| Componente | Status | Observações |
|------------|--------|-------------|
| **Migration:** 0058_fluxo_garantia.sql | Existe | Tabelas garantias |
| **Routes:** garantias.routes.ts | Existe | CRUD |
| **Frontend:** | NAO EXISTE | Não há página de garantias |
| **Teste API:** | PENDENTE | |
| **Teste UI:** | N/A | |

---

## 2. PROBLEMAS CRÍTICOS IDENTIFICADOS

### 2.1 Schema Mismatch - RH Admissões
**Severidade:** CRÍTICA
**Descrição:** As rotas de admissões em `rh.routes.ts` usam `candidato_nome` e `candidato_cpf`, mas a migration `0064_fluxo_rh_esocial.sql` define as colunas como `nome` e `cpf`.
**Impacto:** Qualquer tentativa de criar uma admissão via API resultará em erro SQL.
**Correção:** Alinhar os nomes das colunas (preferível alterar as rotas para usar `nome` e `cpf`).

---

## 3. PÁGINAS "EM DESENVOLVIMENTO" (Frontend)

Estas páginas existem no router mas mostram placeholder:

1. `/cadastros/entidades/transportadoras` - Transportadoras
2. `/cadastros/entidades/colaboradores/novo` - Novo Colaborador
3. `/cadastros/entidades/parceiros` - Parceiros de Negócio
4. `/cadastros/financeiro/contas-bancarias` - Contas Bancárias
5. `/cadastros/financeiro/centros-custo` - Centros de Custo
6. `/cadastros/financeiro/condicoes-pagamento` - Condições de Pagamento
7. `/cadastros/comercial/tabelas-preco` - Tabelas de Preço
8. `/cadastros/patrimonio/veiculos` - Veículos
9. `/cadastros/patrimonio/bens/novo` - Novo Bem
10. `/cadastros/acessos/perfis/novo` - Novo Perfil
11. `/estoque/movimentacoes/novo` - Nova Movimentação
12. `/fiscal/nfse` - NFS-e (Serviços)
13. `/fiscal/cte` - CT-e / MDF-e
14. `/fiscal/sped` - SPED Fiscal
15. `/contabil/fechamento` - Fechamento Contábil
16. `/rh/ferias` - Férias
17. `/patrimonio/manutencao` - Manutenção
18. `/ecommerce/config` - Configurar Loja
19. `/ecommerce/banners` - Banners
20. `/ecommerce/cupons` - Cupons
21. `/configuracoes/impostos` - Configuração de Impostos
22. `/configuracoes/comercial` - Configurações Comerciais
23. `/configuracoes/email` - Configurações de E-mail

---

## 4. FUNCIONALIDADES SEM FRONTEND (Backend existe, UI não)

1. **Comissões** - comissoes.routes.ts existe, sem página
2. **Bonificações** - migration existe, sem página
3. **Consignações** - consignacoes.routes.ts existe, sem página
4. **Devoluções** - devolucoes.routes.ts existe, sem página
5. **Trocas** - trocas.routes.ts existe, sem página
6. **Garantias** - garantias.routes.ts existe, sem página
7. **Admissões RH** - endpoints existem, sem página
8. **Afastamentos RH** - endpoints existem, sem página
9. **Rescisões RH** - endpoints existem, sem página

---

## 5. PRÓXIMOS PASSOS

### Fase 1: Correções Críticas
- [ ] Corrigir schema mismatch em RH Admissões

### Fase 2: Testes de API
- [ ] Testar endpoints de autenticação
- [ ] Testar CRUD de cada módulo
- [ ] Verificar validações e erros

### Fase 3: Testes de UI
- [ ] Testar fluxo de login
- [ ] Testar cada página funcional
- [ ] Documentar bugs encontrados

### Fase 4: Melhorias
- [ ] Criar páginas faltantes para funcionalidades com backend pronto
- [ ] Completar páginas "Em Desenvolvimento"

---

## 6. CHECKLIST DE TESTES

### API Endpoints (Smoke Test)
- [ ] GET /health
- [ ] POST /api/auth/login
- [ ] GET /api/clientes
- [ ] GET /api/produtos
- [ ] GET /api/orcamentos
- [ ] GET /api/vendas
- [ ] GET /api/estoque/saldos
- [ ] GET /api/fiscal/notas
- [ ] GET /api/financeiro/contas-receber
- [ ] GET /api/financeiro/contas-pagar
- [ ] GET /api/compras/pedidos
- [ ] GET /api/logistica/entregas
- [ ] GET /api/crm/leads
- [ ] GET /api/rh/funcionarios
- [ ] GET /api/ecommerce/nuvemshop/lojas
- [ ] GET /api/contabilidade/lancamentos
- [ ] GET /api/bi/dashboards

### UI Pages (Visual Test)
- [ ] /login
- [ ] /dashboard
- [ ] /cadastros/entidades/clientes
- [ ] /cadastros/produtos/lista
- [ ] /comercial/orcamentos
- [ ] /comercial/vendas
- [ ] /estoque/saldos
- [ ] /fiscal/notas
- [ ] /financeiro/receber
- [ ] /financeiro/pagar
- [ ] /compras/pedidos
- [ ] /logistica/entregas
- [ ] /crm
- [ ] /rh/folha
- [ ] /ecommerce/produtos
- [ ] /contabil/lancamentos
- [ ] /bi/dashboards
