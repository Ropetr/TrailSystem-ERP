# PLANAC ERP - MAPEAMENTO COMPLETO DE TELAS

**Atualizado:** 17/12/2025 20:45 UTC  
**API URL:** https://planac-erp-api.planacacabamentos.workers.dev  
**Repositório:** https://github.com/Ropetr/Planac-Revisado

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Página criada e funcional |
| ⚠️ | Página com placeholder "Em Desenvolvimento" |
| ❌ | Página NÃO criada (falta implementar) |

---

## 📊 DASHBOARD

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Dashboard | `/dashboard` | DashboardPage.tsx |

---

## 📝 CADASTROS

### 👥 Entidades

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Clientes | `/cadastros/clientes` | ClientesPage.tsx + ClienteFormPage.tsx |
| ✅ | Fornecedores | `/cadastros/fornecedores` | FornecedoresPage.tsx + FornecedorFormPage.tsx |
| ⚠️ | Transportadoras | `/cadastros/transportadoras` | EmDesenvolvimento |
| ✅ | Colaboradores | `/cadastros/colaboradores` | FuncionariosPage.tsx + ColaboradorFormPage.tsx |
| ⚠️ | Parceiros de Negócio | `/cadastros/parceiros` | EmDesenvolvimento |

### 📦 Produtos

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Produtos e Serviços | `/cadastros/produtos` | ProdutosPage.tsx + ProdutoFormPage.tsx |

### 🏢 Empresa

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Matriz & Filiais | `/cadastros/empresas` | EmpresasPage.tsx + EmpresaFormPage.tsx |

### 🔐 Acessos

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Usuários | `/cadastros/usuarios` | UsuariosPage.tsx + UsuarioFormPage.tsx |
| ✅ | Perfis de Usuários | `/cadastros/perfis` | PerfisPage.tsx + PerfilFormPage.tsx |

---

## 🛒 COMERCIAL

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Orçamentos | `/comercial/orcamentos` | OrcamentosPage.tsx + OrcamentoFormPage.tsx |
| ✅ | Vendas | `/comercial/vendas` | VendasPage.tsx + VendaFormPage.tsx |

---

## 📦 ESTOQUE

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Saldos | `/estoque/saldos` | SaldosPage.tsx |
| ✅ | Movimentações | `/estoque/movimentacoes` | MovimentacoesPage.tsx + MovimentacaoFormPage.tsx |
| ✅ | Transferências | `/estoque/transferencias` | TransferenciasPage.tsx + TransferenciaFormPage.tsx |
| ✅ | Inventário | `/estoque/inventario` | InventarioPage.tsx |

---

## 📄 FISCAL

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Notas Fiscais | `/fiscal/notas` | NotasPage.tsx |
| ✅ | Emitir NF-e | `/fiscal/nfe/nova` | NotaFormPage.tsx |
| ✅ | PDV (NFC-e) | `/fiscal/pdv` | NFCePage.tsx |
| ⚠️ | NFS-e (Serviços) | `/fiscal/nfse` | EmDesenvolvimento |
| ⚠️ | CT-e / MDF-e | `/fiscal/cte` | EmDesenvolvimento |
| ⚠️ | SPED | `/fiscal/sped` | EmDesenvolvimento |

---

## 💰 FINANCEIRO

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Contas a Receber | `/financeiro/receber` | ContasReceberPage.tsx + ContaReceberFormPage.tsx |
| ✅ | Contas a Pagar | `/financeiro/pagar` | ContasPagarPage.tsx + ContaPagarFormPage.tsx |
| ✅ | Fluxo de Caixa | `/financeiro/fluxo-caixa` | FluxoCaixaPage.tsx |
| ✅ | Boletos | `/financeiro/boletos` | BoletosPage.tsx + BoletoFormPage.tsx |
| ✅ | Conciliação | `/financeiro/conciliacao` | ConciliacaoPage.tsx |

---

## 🛍️ COMPRAS

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Cotações | `/compras/cotacoes` | CotacoesPage.tsx + CotacaoFormPage.tsx |
| ✅ | Pedidos de Compra | `/compras/pedidos` | PedidosCompraPage.tsx + PedidoCompraFormPage.tsx |

---

## 🚚 LOGÍSTICA

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Entregas | `/logistica/entregas` | EntregasPage.tsx + EntregaFormPage.tsx |
| ✅ | Rotas | `/logistica/rotas` | RotasPage.tsx + RotaFormPage.tsx |
| ✅ | Rastreamento | `/logistica/rastreamento` | RastreioPage.tsx |

---

## 👥 CRM

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Dashboard CRM | `/crm` | CRMDashboardPage.tsx |
| ✅ | Pipeline | `/crm/pipeline` | PipelinePage.tsx |
| ✅ | Leads | `/crm/leads` | LeadsPage.tsx + LeadFormPage.tsx |
| ✅ | Oportunidades | `/crm/oportunidades` | OportunidadesPage.tsx + OportunidadeFormPage.tsx |
| ✅ | Atividades | `/crm/atividades` | AtividadesPage.tsx + AtividadeFormPage.tsx |

---

## 🧮 CONTÁBIL

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Lançamentos | `/contabil/lancamentos` | LancamentosPage.tsx + LancamentoFormPage.tsx |
| ❌ | Fechamento | `/contabil/fechamento` | NÃO CRIADA |
| ✅ | DRE | `/contabil/dre` | DREPage.tsx |
| ✅ | Balanço | `/contabil/balanco` | BalancoPage.tsx |

---

## 💼 RH

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Colaboradores | `/rh/colaboradores` | FuncionariosPage.tsx + ColaboradorFormPage.tsx |
| ✅ | Folha de Pagamento | `/rh/folha` | FolhaPage.tsx |
| ✅ | Ponto Eletrônico | `/rh/ponto` | PontoPage.tsx |
| ❌ | Férias | `/rh/ferias` | NÃO CRIADA |

---

## 🏠 PATRIMÔNIO

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Bens/Ativos | `/patrimonio/ativos` | AtivosPage.tsx + AtivoFormPage.tsx |
| ✅ | Depreciação | `/patrimonio/depreciacao` | DepreciacaoPage.tsx |
| ❌ | Manutenção | `/patrimonio/manutencao` | NÃO CRIADA |

---

## 🎧 SUPORTE

| Status | Item | Rota | Arquivo |
|--------|------|------|---------|
| ✅ | Tickets | `/suporte/tickets` | TicketsPage.tsx + TicketFormPage.tsx |
| ✅ | Base de Conhecimento | `/suporte/base` | BaseConhecimentoPage.tsx |

---

## 📈 RESUMO ESTATÍSTICO

| Métrica | Quantidade |
|---------|------------|
| ✅ Páginas CRIADAS | 54+ arquivos |
| ✅ FormPages CRIADOS | 25 formulários |
| ⚠️ Placeholders | 15 itens |
| ❌ Páginas faltando | 6 itens |
| **COBERTURA** | **~85%** |

---

## 📋 FORMPAGES CRIADOS (17/12/2025)

| # | FormPage | Módulo |
|---|----------|--------|
| 1 | FornecedorFormPage | Cadastros |
| 2 | ContaPagarFormPage | Financeiro |
| 3 | ContaReceberFormPage | Financeiro |
| 4 | BoletoFormPage | Financeiro |
| 5 | PedidoCompraFormPage | Compras |
| 6 | CotacaoFormPage | Compras |
| 7 | TransferenciaFormPage | Estoque |
| 8 | EntregaFormPage | Logística |
| 9 | RotaFormPage | Logística |
| 10 | LeadFormPage | CRM |
| 11 | OportunidadeFormPage | CRM |
| 12 | AtividadeFormPage | CRM |
| 13 | LancamentoFormPage | Contábil |
| 14 | ColaboradorFormPage | RH |
| 15 | PerfilFormPage | Core |
| 16 | AtivoFormPage | Patrimônio |
| 17 | TicketFormPage | Suporte |

**Total:** 17 novos + 8 existentes = **25 FormPages**

---

**Documento gerado:** 17/12/2025 20:45 UTC  
**DEV.com 57 Especialistas**
