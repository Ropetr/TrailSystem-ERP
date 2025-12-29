# 🧠 Claude.md - Memória do Projeto TrailSystem

**Última Atualização:** 27/12/2025  
**Responsável:** Claude AI / DEV.com - 57 Especialistas  
**Propósito:** Documento de memória para manter contexto atualizado do projeto

---

## 📋 Índice

1. [Acesso e Credenciais](#-acesso-e-credenciais)
2. [Status Real do Projeto](#-status-real-do-projeto)
3. [O Que Funciona vs Não Funciona](#-o-que-funciona-vs-não-funciona)
4. [Próximos Passos Prioritários](#-próximos-passos-prioritários)
5. [Padrões de Design](#-padrões-de-design)

---

## 🔐 Acesso e Credenciais

### ⚠️ IMPORTANTE: Acesso via API REST

O acesso a GitHub e Cloudflare deve ser feito via **API REST**, não via MCP/conectores diretos.

```bash
# GitHub API
curl -H "Authorization: token {TOKEN}" https://api.github.com/repos/Ropetr/TrailSystem-ERP/contents/

# Cloudflare API
curl -H "Authorization: Bearer {TOKEN}" https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/
```

---

### GitHub

| Recurso | Valor |
|---------|-------|
| **Repositório ERP** | https://github.com/Ropetr/TrailSystem-ERP.git |
| **Repositório Site** | https://github.com/Ropetr/TrailSystem-Site.git |
| **PAT Token** | `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` |

---

### Cloudflare

| Recurso | Valor |
|---------|-------|
| **Account ID** | `f14d821b52a4f6ecbad7fb0e0afba8e5` |
| **Access Token FULL** | `fevwOGy0f_0RFP80L7EUZgxvVttRQpMST1IkJp7T` |
| **ALLinONE Token ID** | `897903319c79ccef1bf0e0c32153c1be` |

**Databases D1 (existentes):**
- `Planac-erp-database` - Principal (**46 tabelas criadas**)
- `planac-erp-ibpt` - Cache IBPT
- `orquestrador-database` - DEV.com Especialistas

**R2 Buckets:**
- `planac-erp-storage` - Arquivos gerais
- `planac-erp-certificados` - Certificados A1
- `planac-images` - Imagens de produtos
- `planac-cms-media` - Mídia e-commerce

**KV Namespaces:**
- `Planac-erp-cache` - Cache geral
- `Planac-erp-sessions` - Sessões
- `Planac-erp-rate-limit` - Rate limiting

---

### Nuvem Fiscal

| Recurso | Valor |
|---------|-------|
| **Client ID** | `AJReDlHes8aBNlTzTF9X` |
| **Client Secret** | `3yMYNk2hzBLQihujZf0jfFyAKDRc403v4D1SBDFL` |

---

### CPF.CNPJ

| Recurso | Valor |
|---------|-------|
| **Documentação** | https://www.cpfcnpj.com.br/dev/ |
| **ID** | `JWXN` |
| **Token** | `fb2868083821ff14de07e91ebac9e959` |

---

### CNPJá

| Recurso | Valor |
|---------|-------|
| **Chave API** | `35f092ea-0922-4231-bc05-181aa4062731-11a1649b-2933-44ca-9d30-9c862a03ebb3` |

---

### APIs de IA

| Serviço | Chave |
|---------|-------|
| **Anthropic API** | `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` |
| **OpenAI API** | `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` |

---

## 📊 Status Real do Projeto

### Números Reais (validado por Devin em 27/12/2025)

| Métrica | Valor Real | Observação |
|---------|------------|------------|
| **Linhas de código** | 188.565 | TypeScript |
| **Tabelas D1 criadas** | **46** | ⚠️ Faltam ~120 tabelas |
| **Tabelas referenciadas no código** | 166+ | Backend espera tabelas que não existem |
| **Arquivos de rotas (backend)** | 68 | API implementada |
| **Páginas frontend** | 83 | Telas criadas |
| **Arquivos de testes** | 197 | Cobertura parcial |
| **Serviços implementados** | 91 | Business logic |

### Diagnóstico Principal

> **O frontend (telas) e backend (código) existem, mas as TABELAS DO BANCO DE DADOS não foram criadas.**
> 
> É como ter um armário com etiquetas nas portas, mas sem as prateleiras dentro.

### Progresso Real por Área

| Área | Frontend | Backend | Database | Status |
|------|----------|---------|----------|--------|
| Código/Telas | ✅ 83 páginas | ✅ 68 rotas | ❌ 46/166 tabelas | **~30%** |

---

## ✅ O Que Funciona vs Não Funciona

### 🟢 FUNCIONA (17 módulos) - Tabelas existem

| Módulo | Status |
|--------|--------|
| Login/Autenticação | ✅ OK |
| Usuários | ✅ OK |
| Perfis/Permissões | ✅ OK |
| Empresas/Filiais | ✅ OK |
| Produtos | ✅ OK |
| Orçamentos | ✅ OK |
| Pedidos de Venda | ✅ OK |
| Estoque (saldos, movimentações) | ✅ OK |
| Inventários | ✅ OK |
| Transferências | ✅ OK |
| Fornecedores | ✅ OK |
| Transportadoras | ✅ OK |
| Tabelas de Preço | ✅ OK |
| Condições de Pagamento | ✅ OK |
| Configurações | ✅ OK |
| Locais de Estoque | ✅ OK |

**O que um cliente consegue fazer HOJE:**
- Cadastrar empresas, filiais, usuários
- Cadastrar produtos, fornecedores, transportadoras
- Criar orçamentos e pedidos de venda
- Controlar estoque básico (entradas, saídas, transferências)
- Fazer inventários

---

### 🔴 NÃO FUNCIONA (37 módulos) - Tabelas NÃO existem

| Módulo | % Pronto | Impacto |
|--------|----------|---------|
| **Financeiro** (Contas Pagar/Receber) | 0% | 🔴 CRÍTICO |
| **Caixas/Tesouraria** | 0% | 🔴 CRÍTICO |
| **PDV** (Ponto de Venda) | 0% | 🔴 CRÍTICO |
| **Notas Fiscais** (NF-e/NFC-e/NFS-e) | 0% | 🔴 CRÍTICO |
| **CRM** (Funil de Vendas) | 0% | 🟡 ALTO |
| **Contratos** | 0% | 🟡 ALTO |
| **Compras** (Cotações, Pedidos) | 13% | 🟡 ALTO |
| **Logística** (Entregas, Rotas) | 0% | 🟡 MÉDIO |
| **RH** (Funcionários, Folha, Ponto) | 0% | 🟡 MÉDIO |
| **Contabilidade** | 0% | 🟡 MÉDIO |
| **E-commerce** | 15% | 🔵 BAIXO |

**O que um cliente NÃO consegue fazer:**
- ❌ Controlar financeiro (contas a pagar/receber)
- ❌ Usar PDV (caixa de loja)
- ❌ Emitir notas fiscais
- ❌ Gerenciar entregas
- ❌ Usar CRM (funil de vendas)
- ❌ Controlar RH/folha de pagamento

---

## 🎯 Próximos Passos Prioritários

### Para o sistema ficar PRONTO PARA VENDA:

**Prioridade 1 - CRÍTICO (essencial para qualquer empresa):**
1. ⬜ Criar migrações **Financeiro** (contas_pagar, contas_receber, caixas, movimentacoes)
2. ⬜ Criar migrações **Notas Fiscais** (nfe, nfce, nfse, eventos_fiscais)
3. ⬜ Criar migrações **PDV** (pdv_terminais, pdv_sessoes, pdv_vendas)

**Prioridade 2 - ALTO:**
4. ⬜ Criar migrações **Compras** (cotacoes, pedidos_compra, requisicoes)
5. ⬜ Criar migrações **CRM** (oportunidades, leads, atividades, tarefas)
6. ⬜ Criar migrações **Contratos** (contratos, aditivos, parcelas)

**Prioridade 3 - MÉDIO:**
7. ⬜ Criar migrações **Logística** (entregas, rotas, motoristas, veiculos)
8. ⬜ Criar migrações **RH** (funcionarios, folha, ponto, ferias)
9. ⬜ Criar migrações **Contabilidade** (lancamentos, plano_contas, fechamentos)

### PRs Pendentes
- **PR #20** - perf(api): batch inserts para vendas - Aguardando revisão

---

## 🎨 Padrões de Design

### Cores Primárias (Tema Vermelho TrailSystem)
```css
--primary-500: #ef4444;      /* Cor principal */
--primary-600: #dc2626;      /* Hover */
--primary-700: #b91c1c;      /* Active */
```

### Gradiente para Ícones/Avatares
```jsx
className="bg-gradient-to-br from-red-500 to-red-700"
```

### Cores Neutras
```css
--gray-50:  #f9fafb;   /* Background página */
--gray-100: #f3f4f6;   /* Background cards */
--gray-200: #e5e7eb;   /* Bordas */
--gray-400: #9ca3af;   /* Placeholder */
--gray-600: #4b5563;   /* Texto normal */
--gray-800: #1f2937;   /* Títulos */
```

### Estilos de Foco (inputs)
```css
input:focus, textarea:focus {
  outline: none !important;
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
}
```

### Padrões de Componentes

**Botão Primário:**
```jsx
className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
```

**Card:**
```jsx
className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
```

**Input:**
```jsx
className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
```

**Tabela:**
```jsx
// thead
className="bg-gray-50 border-b border-gray-200"
// th
className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase"
// tbody
className="divide-y divide-gray-100"
// tr
className="hover:bg-gray-50"
```

### Padrões de Menu/Sidebar
- Hierarquia: **Módulo > Categoria > Item**
- Usar chevrons para expand/collapse
- Indentação: `ml-3`
- **SEM emojis** nos itens do menu

### Ícones SVG
- Tamanho padrão: `w-5 h-5`
- Tamanho pequeno: `w-4 h-4`
- Stroke: `stroke="currentColor"`
- Fill: `fill="none"`
- StrokeWidth: `strokeWidth={2}`

---

## 📝 Notas Importantes

1. **Este documento NÃO deve ser versionado no GitHub** (contém tokens)
2. **Manter na raiz do projeto** para fácil acesso
3. **Atualizar sempre** que houver mudanças significativas no projeto
4. **Rodrigo não é programador** - explicar conceitos de forma simples

---

## 📅 Histórico de Atualizações

| Data | Alteração |
|------|-----------|
| 27/12/2025 | Criação inicial com status real do projeto |
| 27/12/2025 | Correção: 46 tabelas (não 211), ~30% funcional |

---

**Repositórios:**
- https://github.com/Ropetr/TrailSystem-ERP
- https://github.com/Ropetr/TrailSystem-Site
