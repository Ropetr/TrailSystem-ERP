# 📊 MAPA DE MÓDULOS - ERP PLANAC

> **Sistema ERP Completo | Multi-Empresas | Atacado, Varejo e Atacarejo**

**Gerado em:** 14/12/2025  
**Versão do Sistema:** 7.0  
**Total de Módulos:** 15 Domínios Principais

---

## 📈 RESUMO EXECUTIVO

| Área | Documentação | Backend | Tabelas | Frontend | Testes | Status Geral |
|------|-------------|---------|---------|----------|--------|--------------|
| **Core** | ✅ 100% | ✅ 100% | ✅ 100% | ⏳ 0% | ⏳ 0% | 🟡 60% |
| **Comercial** | ✅ 100% | ✅ 100% | ✅ 100% | ⏳ 0% | ⏳ 0% | 🟡 60% |
| **Produtos/Estoque** | ✅ 100% | ✅ 100% | ✅ 100% | ⏳ 0% | ⏳ 0% | 🟡 60% |
| **Compras** | ✅ 100% | ✅ 100% | ✅ 100% | ⏳ 0% | ⏳ 0% | 🟡 60% |
| **Financeiro** | ✅ 100% | ✅ 100% | ✅ 100% | ⏳ 0% | ⏳ 0% | 🟡 60% |
| **Fiscal** | ✅ 100% | 🟡 50% | ✅ 100% | ⏳ 0% | ⏳ 0% | 🟡 50% |
| **Logística** | ✅ 100% | ✅ 100% | ✅ 100% | ⏳ 0% | ⏳ 0% | 🟡 60% |
| **Precificação** | ✅ 100% | ✅ 100% | ✅ 100% | ⏳ 0% | ⏳ 0% | 🟡 60% |
| **RH** | ✅ 100% | ✅ 100% | ✅ 100% | ⏳ 0% | ⏳ 0% | 🟡 60% |
| **E-commerce** | ✅ 100% | ✅ 100% | ✅ 100% | ⏳ 0% | ⏳ 0% | 🟡 60% |
| **BI/Relatórios** | ✅ 100% | 🟡 50% | ✅ 100% | ⏳ 0% | ⏳ 0% | 🟡 50% |
| **Integrações** | ✅ 100% | 🟡 30% | ✅ 100% | ⏳ 0% | ⏳ 0% | 🟡 46% |
| **Suporte** | ✅ 100% | ✅ 100% | ✅ 100% | ⏳ 0% | ⏳ 0% | 🟡 60% |
| **Contábil** | ✅ 100% | ✅ 100% | ✅ 100% | ⏳ 0% | ⏳ 0% | 🟡 60% |
| **Patrimônio** | ✅ 100% | ✅ 100% | ✅ 100% | ⏳ 0% | ⏳ 0% | 🟡 60% |

### Totais Gerais

| Métrica | Quantidade | Status |
|---------|------------|--------|
| Regras de Negócio | 313 | ✅ Documentadas |
| Casos de Uso | 185 | ✅ Documentados |
| Fluxogramas | 25 | ✅ Documentados |
| Tabelas D1 | 207 | ✅ Criadas |
| Rotas API | 63 | ✅ Implementadas |
| Telas Especificadas | 203 | ✅ Documentadas |
| Telas Implementadas | ~5 | ⏳ 2% |
| Testes | 0 | ⏳ 0% |

---

## 🔷 MÓDULO 1: CORE (Fundação)

### Visão Geral
O módulo Core é a **fundação do sistema**, responsável por multi-tenancy, autenticação, autorização e configurações base.

### Rotas API (6 arquivos)
- `auth.routes.ts` - Login, Logout, Refresh, 2FA ✅
- `empresas.routes.ts` - CRUD Empresas ✅
- `filiais.routes.ts` - CRUD Filiais ✅
- `usuarios.routes.ts` - CRUD Usuários ✅
- `perfis.routes.ts` - CRUD Perfis/Permissões ✅
- `configuracoes.routes.ts` - Parâmetros do Sistema ✅

### Tabelas D1 (14 tabelas)
empresas, filiais, usuarios, usuarios_perfis, usuarios_sessoes, usuarios_tokens, perfis, perfis_permissoes, permissoes, configuracoes, audit_logs, notificacoes, notificacoes_config, arquivos

### Checklist de Finalização
```
DOCUMENTAÇÃO.............. [✅] Completa
BACKEND (Rotas)........... [✅] 6/6 implementadas
BACKEND (Migrations)...... [✅] Criadas
FRONTEND (Telas).......... [⏳] 0/8 telas
  [ ] Tela de Login
  [ ] Tela de Cadastro de Empresas
  [ ] Tela de Filiais
  [ ] Tela de Usuários
  [ ] Tela de Perfis/Permissões
  [ ] Layout base (sidebar, header)
  [ ] Componentes base (tabelas, forms)
  [ ] Dashboard inicial
TESTES.................... [⏳] 0% cobertura
DEPLOY.................... [✅] Worker configurado
```

---

## 🔷 MÓDULO 2: COMERCIAL (Vendas)

### Visão Geral
Módulo completo de vendas com CRM, Orçamentos, Pedidos, PDV, CalcPro e gestão de clientes.

### Submódulos (12)
1. CRM (Funil de vendas)
2. CalcPro (Calculadoras drywall/steel frame)
3. Orçamentos
4. Pedido de Venda
5. PDV (Ponto de Venda)
6. Programa de Indicações
7. Devolução de Venda
8. Troca de Venda
9. Serviços
10. Consignação
11. Garantia de Produtos
12. Gamificação

### Rotas API (14 arquivos)
- `clientes.routes.ts` ✅
- `vendedores.routes.ts` ✅
- `orcamentos.routes.ts` ✅
- `pedidos.routes.ts` ✅
- `entregas.routes.ts` ✅
- `devolucoes.routes.ts` ✅
- `trocas.routes.ts` ✅
- `garantias.routes.ts` ✅
- `consignacoes.routes.ts` ✅
- `crm.routes.ts` ✅
- `pdv.routes.ts` ✅
- `comissoes.routes.ts` ✅
- `ordens-servico.routes.ts` ✅
- `agenda.routes.ts` ✅

### Tabelas D1 (45+ tabelas)
Clientes, CRM, Orçamentos, Pedidos, PDV, CalcPro, Indicações, Comissões, etc.

### Checklist de Finalização
```
DOCUMENTAÇÃO.............. [✅] 48 regras, 32 casos de uso
BACKEND (Rotas)........... [✅] 14/14 implementadas
BACKEND (Migrations)...... [✅] Criadas
BACKEND (Pendências)...... 
  [ ] Regras de comissão automática
  [ ] Mescla de orçamentos
  [ ] CalcPro cálculos
FRONTEND (Telas).......... [⏳] 0/35 telas
  [ ] Dashboard Comercial
  [ ] Tela Clientes (CRUD completo)
  [ ] Tela Orçamentos
  [ ] Tela Pedidos
  [ ] Tela PDV
  [ ] Tela CRM/Funil
  [ ] CalcPro interface
INTEGRAÇÕES...............
  [ ] WhatsApp (envio de orçamentos)
  [ ] Email (envio de orçamentos)
  [ ] CPF/CNPJ (validação cadastro)
TESTES.................... [⏳] 0% cobertura
```

---

## 🔷 MÓDULO 3: PRODUTOS E ESTOQUE

### Visão Geral
Gestão completa de catálogo de produtos, estoque, inventário, transferências.

### Rotas API (8 arquivos)
- `produtos.routes.ts` ✅
- `categorias.routes.ts` ✅
- `marcas.routes.ts` ✅
- `unidades.routes.ts` ✅
- `estoque.routes.ts` ✅
- `locais-estoque.routes.ts` ✅
- `inventarios.routes.ts` ✅
- `transferencias.routes.ts` ✅

### Tabelas D1 (22 tabelas)
produtos, produtos_imagens, categorias, marcas, unidades_medida, estoque, estoque_movimentacoes, locais_estoque, inventarios, transferencias, ncm, cfop, etc.

### Checklist de Finalização
```
DOCUMENTAÇÃO.............. [✅] 28 regras, 18 casos de uso
BACKEND (Rotas)........... [✅] 8/8 implementadas
BACKEND (Pendências)......
  [ ] Cálculo automático de custo médio
  [ ] Curva ABC automática
  [ ] Ponto de reposição
FRONTEND (Telas).......... [⏳] 0/15 telas
  [ ] Tela Produtos (CRUD)
  [ ] Tela Estoque (saldos)
  [ ] Tela Movimentações
  [ ] Tela Inventário
  [ ] Tela Transferências
INTEGRAÇÕES...............
  [ ] Bluesoft Cosmos (catálogo)
  [ ] IBPT (impostos)
  [ ] Import XML NF-e
TESTES.................... [⏳] 0% cobertura
```

---

## 🔷 MÓDULO 4: COMPRAS

### Rotas API (2 arquivos)
- `fornecedores.routes.ts` ✅
- `compras.routes.ts` ✅

### Tabelas D1 (9 tabelas)
fornecedores, fornecedores_contatos, requisicoes_compra, cotacoes_compra, pedidos_compra, etc.

### Checklist de Finalização
```
DOCUMENTAÇÃO.............. [✅] 18 regras, 12 casos de uso
BACKEND (Rotas)........... [✅] 2/2 implementadas
BACKEND (Pendências)......
  [ ] Comparativo de cotações
  [ ] Análise de fornecedores
FRONTEND (Telas).......... [⏳] 0/8 telas
  [ ] Tela Fornecedores
  [ ] Tela Cotações
  [ ] Tela Pedidos de Compra
  [ ] Tela Recebimento
TESTES.................... [⏳] 0% cobertura
```

---

## 🔷 MÓDULO 5: FINANCEIRO

### Rotas API (4 arquivos)
- `contas-receber.routes.ts` ✅
- `contas-pagar.routes.ts` ✅
- `bancos.routes.ts` ✅
- `caixas.routes.ts` ✅

### Tabelas D1 (16 tabelas)
contas_receber, contas_pagar, contas_bancarias, movimentacoes_bancarias, conciliacoes, cobrancas_regua, etc.

### Checklist de Finalização
```
DOCUMENTAÇÃO.............. [✅] 35 regras, 22 casos de uso
BACKEND (Rotas)........... [✅] 4/4 implementadas
BACKEND (Pendências)......
  [ ] Régua de cobrança automática
  [ ] Conciliação automática
  [ ] Fluxo de caixa projetado
FRONTEND (Telas).......... [⏳] 0/12 telas
  [ ] Tela Contas a Receber
  [ ] Tela Contas a Pagar
  [ ] Tela Bancos
  [ ] Tela Caixa
  [ ] Dashboard Financeiro
INTEGRAÇÕES (CRÍTICO).....
  [ ] TecnoSpeed Boletos
  [ ] TecnoSpeed PIX
  [ ] OFX Import
TESTES.................... [⏳] 0% cobertura
```

---

## 🔷 MÓDULO 6: FISCAL ⚠️ CRÍTICO

### Rotas API (1 arquivo)
- `notas-fiscais.routes.ts` 🟡 50%

### Tabelas D1 (14 tabelas)
nfe, nfe_itens, nfce, nfse, regras_fiscais, icms_uf, aliquotas_interestaduais, sped_arquivos, etc.

### Checklist de Finalização
```
DOCUMENTAÇÃO.............. [✅] 42 regras, 18 casos de uso
BACKEND (Rotas)........... [🟡] 1/1 parcialmente implementada
BACKEND (Pendências CRÍTICO)
  [ ] Cálculo automático de impostos
  [ ] Validação SEFAZ
  [ ] Geração XML NF-e
  [ ] Geração XML NFC-e
  [ ] Manifestação
FRONTEND (Telas).......... [⏳] 0/10 telas
  [ ] Tela Emissão NF-e
  [ ] Tela Emissão NFC-e
  [ ] Tela Consulta Notas
  [ ] Tela Manifestação
INTEGRAÇÕES (CRÍTICO).....
  [ ] Nuvem Fiscal - Emissão NF-e
  [ ] Nuvem Fiscal - Emissão NFC-e
  [ ] TecnoSpeed - Alternativa
  [ ] IBPT - Impostos
  [ ] SERPRO - Dados fiscais
TESTES.................... [⏳] 0% cobertura
HOMOLOGAÇÃO SEFAZ......... [⏳] Pendente
```

---

## 🔷 MÓDULO 7: LOGÍSTICA

### Rotas API (6 arquivos)
- `transportadoras.routes.ts` ✅
- `motoristas.routes.ts` ✅
- `veiculos.routes.ts` ✅
- `rotas.routes.ts` ✅
- `rastreamento.routes.ts` ✅
- `ocorrencias.routes.ts` ✅

### Checklist de Finalização
```
DOCUMENTAÇÃO.............. [✅] 15 regras, 10 casos de uso
BACKEND (Rotas)........... [✅] 6/6 implementadas
BACKEND (Pendências)......
  [ ] Roteirização automática
  [ ] Cálculo de frete
FRONTEND (Telas).......... [⏳] 0/8 telas
  [ ] Tela Transportadoras
  [ ] Tela Motoristas
  [ ] Tela Rotas
  [ ] App Motorista (PWA)
TESTES.................... [⏳] 0% cobertura
```

---

## 🔷 MÓDULO 8: PRECIFICAÇÃO

### Rotas API (3 arquivos)
- `tabelas-preco.routes.ts` ✅
- `condicoes-pagamento.routes.ts` ✅
- `comissoes.routes.ts` ✅

### Checklist de Finalização
```
BACKEND (Rotas)........... [✅] 3/3 implementadas
BACKEND (Pendências)......
  [ ] Motor de promoções
  [ ] Cálculo automático de markup
FRONTEND (Telas).......... [⏳] 0/6 telas
TESTES.................... [⏳] 0% cobertura
```

---

## 🔷 MÓDULO 9: RH

### Rotas API (2 arquivos)
- `rh.routes.ts` ✅
- `folha-pagamento.routes.ts` ✅

### Checklist de Finalização
```
BACKEND (Rotas)........... [✅] 2/2 implementadas
BACKEND (Pendências)......
  [ ] Cálculo de folha
  [ ] Controle de ponto
FRONTEND (Telas).......... [⏳] 0/10 telas
  [ ] Tela Colaboradores
  [ ] Tela Ponto
  [ ] Tela Férias
  [ ] App do Colaborador
TESTES.................... [⏳] 0% cobertura
```

---

## 🔷 MÓDULO 10: E-COMMERCE

### Rotas API (1 arquivo)
- `ecommerce.routes.ts` ✅

### Checklist de Finalização
```
BACKEND (Rotas)........... [✅] 1/1 implementada
BACKEND (Pendências)......
  [ ] Checkout completo
  [ ] Gateway de pagamento
FRONTEND.................. [⏳] 0/15 telas
  [ ] Loja Virtual (React)
  [ ] Carrinho
  [ ] Checkout
  [ ] Área do Cliente
INTEGRAÇÕES...............
  [ ] Plug4Market (marketplaces)
  [ ] Gateway de Pagamento
TESTES.................... [⏳] 0% cobertura
```

---

## 🔷 MÓDULOS 11-15: BI, INTEGRAÇÕES, SUPORTE, CONTÁBIL, PATRIMÔNIO

| Módulo | Rotas | Status Backend | Frontend | Testes |
|--------|-------|----------------|----------|--------|
| BI/Relatórios | 2 | 🟡 50% | ⏳ 0% | ⏳ 0% |
| Integrações | 0 | 🟡 30% | ⏳ 0% | ⏳ 0% |
| Suporte | 2 | ✅ 100% | ⏳ 0% | ⏳ 0% |
| Contábil | 1 | ✅ 100% | ⏳ 0% | ⏳ 0% |
| Patrimônio | 1 | ✅ 100% | ⏳ 0% | ⏳ 0% |

---

## 📊 PRIORIZAÇÃO RECOMENDADA

### Fase 1 - Fundação (Semanas 1-4)
1. ✅ Core (Multi-tenant, Auth, Permissões) - BACKEND PRONTO
2. ⏳ Frontend - Layout base + Login
3. ⏳ Testes - Suite básica

### Fase 2 - Operacional (Semanas 5-12)
4. Comercial (Clientes, Orçamentos, Pedidos)
5. Produtos/Estoque (Catálogo, Saldos)
6. Financeiro (Receber, Pagar, Caixa)

### Fase 3 - Fiscal (Semanas 13-16) ⚠️ CRÍTICO
7. Fiscal (NF-e, NFC-e)
8. Integrações (Nuvem Fiscal / TecnoSpeed)

### Fase 4 - Avançado (Semanas 17-24)
9. Compras
10. Logística
11. RH
12. E-commerce
13. BI/Relatórios

### Fase 5 - Complementar (Semanas 25+)
14. Contabilidade
15. Patrimônio
16. Suporte/Tickets

---

## 📁 ARQUIVOS DE REFERÊNCIA

| Arquivo | Localização |
|---------|-------------|
| Sumário Completo | docs/01-sumario/README.md |
| Regras de Negócio | docs/02-regras-negocio/README.md |
| Casos de Uso | docs/03-casos-uso/README.md |
| Fluxogramas | docs/04-fluxogramas/README.md |
| Modelo de Dados | docs/05-modelo-dados/README.md |
| Telas | docs/06-especificacao-telas/README.md |
| Integrações | docs/08-integracoes/ |
| Module Map | docs/00-devcom/MAP/module-map.json |
| Orquestrador | docs/00-devcom/ORQUESTRADOR.md |

---

*Documento gerado em 14/12/2025 - ERP PLANAC v7.0*
