# 📊 DASHBOARDS TRAILSYSTEM ERP
## Documentação Técnica - 4 Dashboards por Perfil

**Data:** 26/12/2025  
**Versão:** 1.0  
**Status:** ✅ Completo

---

## 🎯 VISÃO GERAL

O TrailSystem ERP possui 4 dashboards personalizados por perfil de usuário, cada um com cores temáticas distintas, KPIs específicos e widgets relevantes para cada área de atuação.

### Resumo dos Dashboards

| Dashboard | Cor Tema | Perfil Alvo | Linhas |
|-----------|----------|-------------|--------|
| **Vendas** | 🔴 Vermelho (#ef4444) | Vendedores, Supervisores Comerciais | ~1.359 |
| **Compras** | 🔵 Azul (#3b82f6) | Compradores, Gestores de Compras | ~853 |
| **Financeiro** | 🟢 Esmeralda (#10b981) | Analistas, Tesouraria | ~750 |
| **Gestor** | 🟣 Violeta (#8b5cf6) | Diretores, Proprietários | ~584 |

---

## 📁 ARQUIVOS GERADOS

```
/dashboards/
├── DashboardVendas.jsx      # Dashboard de Vendas (Vermelho)
├── DashboardCompras.jsx     # Dashboard de Compras (Azul)
├── DashboardFinanceiro.jsx  # Dashboard Financeiro (Verde)
└── DashboardGestor.jsx      # Dashboard Executivo (Violeta)
```

---

## 🔴 DASHBOARD DE VENDAS

### Arquivo: `DashboardVendas.jsx`

**Perfil:** Vendedores, Supervisores, Gerentes Comerciais

### KPIs Principais
| KPI | Descrição | Meta |
|-----|-----------|------|
| Faturamento | Total de vendas no período | R$ 900.000 |
| Ticket Médio | Valor médio por venda | R$ 3.000 |
| Qtd. Vendas | Número de vendas | 300 |
| Taxa Conversão | Orçamentos convertidos | 75% |

### Widgets Incluídos
- ✅ Evolução de Vendas (gráfico barras comparativo)
- ✅ Vendas por Categoria (gráfico donut)
- ✅ Ranking de Vendedores (medalhas + metas)
- ✅ Top Produtos (mais vendidos)
- ✅ Produtos Parados (sem movimentação)
- ✅ Clientes Inativos (alertas)
- ✅ Principais Clientes (maior faturamento)
- ✅ Mapa de Vendas por Região
- ✅ Mentor IA (assistente inteligente)
- ✅ Insights Automáticos

### Filtros Disponíveis
- Período (DateRangePicker estilo Google Ads)
- Vendedor
- Parceiro
- Filial
- Categoria

---

## 🔵 DASHBOARD DE COMPRAS

### Arquivo: `DashboardCompras.jsx`

**Perfil:** Compradores, Gestores de Compras, Suprimentos

### KPIs Principais
| KPI | Descrição | Meta |
|-----|-----------|------|
| Total Compras | Volume de compras | R$ 500.000 |
| Economia | % economizado vs. referência | 15% |
| Pedidos Pendentes | Aguardando entrega | ≤ 15 |
| Lead Time Médio | Dias até entrega | ≤ 4 dias |

### Widgets Incluídos
- ✅ Evolução de Compras (gráfico barras)
- ✅ Compras por Categoria (donut)
- ✅ Alertas de Prazo (crítico/alto/médio)
- ✅ Pedidos Pendentes (com status)
- ✅ Cotações Abertas (em negociação)
- ✅ Top Fornecedores (avaliação + pontualidade)
- ✅ Assistente IA Compras
- ✅ Insights Automáticos

### Filtros Disponíveis
- Período
- Fornecedor
- Categoria
- Filial

---

## 🟢 DASHBOARD FINANCEIRO

### Arquivo: `DashboardFinanceiro.jsx`

**Perfil:** Analistas Financeiros, Tesouraria, Controllers

### KPIs Principais
| KPI | Descrição | Meta |
|-----|-----------|------|
| Saldo em Caixa | Disponível atual | - |
| A Receber | Total de recebíveis | - |
| A Pagar | Total de obrigações | - |
| Inadimplência | % títulos vencidos | ≤ 3% |

### Widgets Incluídos
- ✅ Fluxo de Caixa Projetado (30/60/90 dias)
- ✅ Contas Bancárias (saldos consolidados)
- ✅ Aging de Recebíveis (faixas de vencimento)
- ✅ Contas a Pagar (próximos vencimentos)
- ✅ Contas a Receber (vencidos + a vencer)
- ✅ Assistente IA Financeiro
- ✅ Insights Automáticos

### Filtros Disponíveis
- Período
- Conta Bancária
- Filial

---

## 🟣 DASHBOARD DO GESTOR

### Arquivo: `DashboardGestor.jsx`

**Perfil:** Diretores, Proprietários, C-Level

### KPIs Principais
| KPI | Descrição | Meta |
|-----|-----------|------|
| Faturamento | Total consolidado | R$ 2.000.000 |
| Margem | Margem bruta % | 30% |
| EBITDA | Resultado operacional | R$ 350.000 |
| Crescimento | YoY % | 15% |

### Widgets Incluídos
- ✅ Vendas vs Meta (gráfico comparativo)
- ✅ Comparativo Filiais (performance detalhada)
- ✅ Alertas Gerenciais (críticos/atenção/positivos)
- ✅ Top Vendedores (ranking consolidado)
- ✅ Top Produtos (mais rentáveis)
- ✅ Top Clientes (maior faturamento)
- ✅ Vendas por Região (mapa consolidado)
- ✅ Assistente Executivo IA
- ✅ Insights Estratégicos

### Filtros Disponíveis
- Período
- Filial

---

## 🧩 COMPONENTES COMPARTILHADOS

Todos os dashboards utilizam componentes padronizados:

### Componentes de UI
| Componente | Descrição |
|------------|-----------|
| `Skeleton` | Loading placeholder animado |
| `EmptyState` | Estado vazio com ícone e mensagem |
| `FilterDropdown` | Dropdown de filtro padronizado |
| `WidgetCard` | Card base com header e drag handle |
| `ResponsiveTabsGrid` | Grid em desktop, tabs em mobile |

### Componentes de Dados
| Componente | Descrição |
|------------|-----------|
| `KPICardContent` | Exibição de KPI com variação e meta |
| `BarChart` | Gráfico de barras SVG |
| `DonutChart` | Gráfico pizza/rosca SVG |
| `MentorIA` | Chat com assistente IA |
| `InsightsAutomaticos` | Lista de insights coloridos |

---

## 🎨 PADRÃO DE CORES POR DASHBOARD

```css
/* Vendas - Vermelho */
--primary: #ef4444;
--primary-hover: #dc2626;
--primary-light: #fee2e2;

/* Compras - Azul */
--primary: #3b82f6;
--primary-hover: #2563eb;
--primary-light: #dbeafe;

/* Financeiro - Esmeralda */
--primary: #10b981;
--primary-hover: #059669;
--primary-light: #d1fae5;

/* Gestor - Violeta */
--primary: #8b5cf6;
--primary-hover: #7c3aed;
--primary-light: #ede9fe;
```

---

## 📱 RESPONSIVIDADE

Todos os dashboards são totalmente responsivos:

| Breakpoint | Comportamento |
|------------|---------------|
| < 768px | KPIs em tabs, layout mobile |
| 768px - 1000px | Grid adaptativo |
| > 1000px | Grid completo, múltiplas colunas |

### Componente `ResponsiveTabsGrid`
- **Desktop:** Exibe widgets em grid responsivo
- **Mobile:** Converte para tabs navegáveis
- Configurável via `breakpoint` e `minWidth`

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### Em Todos os Dashboards
- [x] Header com logo, título e ações
- [x] Filtros sticky (fixos no scroll)
- [x] KPIs com variação % e meta
- [x] Gráficos interativos (hover tooltips)
- [x] Widgets com drag handle (preparado para reordenação)
- [x] Empty states para dados vazios
- [x] Loading states (skeletons)
- [x] Mentor IA com sugestões
- [x] Insights automáticos coloridos
- [x] Footer com dica de personalização
- [x] Encoding UTF-8 correto (acentos, emojis)

### Correções Aplicadas (vs versão anterior)
- [x] onKeyPress → onKeyDown
- [x] Botão enviar desabilitado quando vazio
- [x] Empty states em todos os componentes
- [x] Loading states com Skeleton
- [x] Dados mock consistentes
- [x] Componentes não utilizados removidos

---

## 🔄 PRÓXIMOS PASSOS

### Integração
1. [ ] Conectar à API real (substituir mockData)
2. [ ] Implementar WebSocket para dados em tempo real
3. [ ] Salvar layout personalizado por usuário

### Funcionalidades
4. [ ] Implementar drag & drop real (react-dnd)
5. [ ] Exportar dashboard como PDF
6. [ ] Modo tela cheia para apresentações
7. [ ] Temas claro/escuro

### Testes
8. [ ] Testes unitários (Jest)
9. [ ] Testes E2E (Playwright)
10. [ ] Testes de performance

---

## 📝 COMO USAR

### Instalação
```bash
# Os dashboards são componentes React standalone
# Basta importar e usar:

import DashboardVendas from './dashboards/DashboardVendas';
import DashboardCompras from './dashboards/DashboardCompras';
import DashboardFinanceiro from './dashboards/DashboardFinanceiro';
import DashboardGestor from './dashboards/DashboardGestor';
```

### Roteamento por Perfil
```jsx
// Exemplo de roteamento baseado em perfil
const dashboardByRole = {
  'vendedor': <DashboardVendas />,
  'supervisor_comercial': <DashboardVendas />,
  'comprador': <DashboardCompras />,
  'financeiro': <DashboardFinanceiro />,
  'diretor': <DashboardGestor />,
  'admin': <DashboardGestor />,
};

// No componente de rota
<Route path="/dashboard" element={dashboardByRole[userRole]} />
```

---

**Documento gerado:** 26/12/2025  
**TrailSystem ERP** - Mesa dos 57 Especialistas DEV.com
