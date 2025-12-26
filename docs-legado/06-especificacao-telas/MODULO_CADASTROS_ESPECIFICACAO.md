# 📁 MÓDULO CADASTROS - ESPECIFICAÇÃO COMPLETA
## PLANAC ERP - Distribuidor de Drywall e Materiais de Construção

**Versão:** 1.0  
**Data:** 15/12/2025  
**Aprovado por:** Rodrigo (CEO PLANAC) + 21 Especialistas DEV.com  
**Status:** ✅ APROVADO UNANIMEMENTE

---

## 📋 SUMÁRIO EXECUTIVO

O módulo **CADASTROS** é o **DONO centralizado** de todos os dados base do ERP. Outros módulos apenas **CONSOMEM** esses dados via seleção (dropdown, busca, autocomplete).

### Benefícios da Centralização:
- ✅ Evita duplicidade de dados
- ✅ Facilita manutenção
- ✅ Garante integridade das informações
- ✅ Simplifica navegação para usuários

---

## 🏗️ ESTRUTURA APROVADA

```
📁 CADASTROS (16 itens em 7 categorias)
│
├── 👥 ENTIDADES (5 itens)
│   ├── Clientes
│   ├── Fornecedores
│   ├── Transportadoras
│   ├── Colaboradores
│   └── Parceiros de Negócio
│
├── 📦 PRODUTOS (1 item)
│   └── Produtos (flag: Produto ou Serviço)
│
├── 🏢 MATRIZ & FILIAIS (1 item)
│   └── Empresas (tela única para matriz e filiais)
│
├── 🏦 FINANCEIRO (4 itens)
│   ├── Contas Bancárias
│   ├── Plano de Contas
│   ├── Centros de Custo
│   └── Condições de Pagamento
│
├── 🏷️ COMERCIAL (1 item)
│   └── Tabelas de Preço
│
├── 🚗 PATRIMÔNIO (2 itens)
│   ├── Veículos
│   └── Bens
│
└── 🔐 ACESSOS (2 itens)
    ├── Usuários
    └── Perfis de Usuários

⚙️ CONFIGURAÇÕES (Módulo Separado)
└── Configurações Gerais do Sistema
```

---

## 📊 DETALHAMENTO POR CATEGORIA

---

### 👥 ENTIDADES

#### 1. CLIENTES
**O que é:** Pessoas físicas ou jurídicas que compram da PLANAC.

**Campos principais:**
- Razão Social / Nome
- CNPJ / CPF
- Inscrição Estadual / RG
- Endereço completo
- Telefones / WhatsApp
- Email
- Tipo (PF/PJ)
- Categoria (Consumidor Final, Revenda, Construtor, Instalador)

**Exemplo de uso na PLANAC:**
> Construtora ABC liga pedindo orçamento de 500 placas de drywall.
> Vendedor busca "ABC" → Sistema mostra dados completos → Já sabe tabela de preço, condição de pagamento padrão, endereço de entrega.

**Integra com:** Orçamentos, Vendas, NF-e, Contas a Receber, CRM

---

#### 2. FORNECEDORES
**O que é:** Empresas que vendem produtos/materiais para a PLANAC.

**Campos principais:**
- Razão Social
- CNPJ
- Inscrição Estadual
- Endereço
- Contatos
- Produtos que fornece
- Condições de pagamento
- Prazo de entrega médio

**Exemplo de uso na PLANAC:**
> Estoque de parafusos está baixo. Comprador abre tela de cotação → Seleciona fornecedores de parafusos (Gypsum, Placo, etc.) → Sistema já tem histórico de preços e prazos.

**Integra com:** Cotações, Pedidos de Compra, Contas a Pagar, NF-e entrada

---

#### 3. TRANSPORTADORAS ⭐ NOVO
**O que é:** Empresas que fazem a entrega dos produtos da PLANAC aos clientes.

**Campos principais:**
- Razão Social
- CNPJ
- Endereço
- Contatos
- Regiões atendidas
- Tipos de veículo
- Tabela de frete
- Prazo médio de entrega
- Avaliação de desempenho

**Para que serve:**
| Função | Benefício |
|--------|-----------|
| Gerenciar opções de entrega | Saber quem entrega onde |
| Calcular fretes automaticamente | Preço correto na hora da venda |
| Acompanhar prazos | Saber se entregou no prazo |
| Avaliar desempenho | Qual transportadora é mais confiável |

**Exemplo de uso na PLANAC:**
> Cliente de **Brasília** compra 50 placas de drywall.
> 
> O vendedor:
> 1. Abre o pedido no sistema
> 2. Sistema mostra transportadoras que atendem Brasília
> 3. Mostra preço do frete de cada uma:
>    - Jadlog: R$ 380, 7 dias
>    - Total Express: R$ 450, 5 dias
>    - Transprimo: R$ 320, 10 dias
> 4. Vendedor escolhe "Total Express" (cliente quer rápido)
> 5. Sistema rastreia se entregou no prazo

**Integra com:** Pedidos, NF-e, CT-e, Logística, Rastreamento

---

#### 4. COLABORADORES
**O que é:** Funcionários da PLANAC (vendedores, motoristas, administrativo, etc.)

**Campos principais:**
- Nome completo
- CPF
- Cargo
- Departamento
- Filial
- Data admissão
- Salário base
- Comissão %
- Usuário do sistema (se tiver)

**Exemplo de uso na PLANAC:**
> Vendedor Junior fecha venda de R$ 10.000.
> Sistema calcula automaticamente: Comissão = R$ 300 (3%)
> No fim do mês, RH gera relatório de comissões de todos os vendedores.

**Integra com:** RH, Folha de Pagamento, Ponto Eletrônico, Comissões, Usuários

---

#### 5. PARCEIROS DE NEGÓCIO ⭐ NOVO
**O que é:** Pessoas/empresas que indicam clientes e recebem cashback/comissão.

**Campos principais:**
- Nome / Razão Social
- CPF / CNPJ
- Contatos
- Tipo (Instalador, Arquiteto, Engenheiro, Loja parceira)
- % de cashback
- Forma de pagamento (PIX, depósito)
- Histórico de indicações
- Total acumulado

**Exemplo de uso na PLANAC:**
> Instalador João indica cliente para comprar R$ 5.000 em drywall.
> - Venda é realizada
> - Sistema registra: "Indicado por João"
> - Cashback de 2% = R$ 100 para João
> - No fim do mês, PLANAC paga via PIX

**Para que serve:**
- Fidelizar instaladores e profissionais
- Aumentar vendas por indicação
- Controlar pagamentos de comissões
- Relatórios de desempenho de parceiros

**Integra com:** Vendas, Financeiro, CRM

---

### 📦 PRODUTOS

#### PRODUTOS (com flag Produto/Serviço)
**O que é:** Itens comercializados pela PLANAC - podem ser produtos físicos ou serviços.

**Campos principais:**
- Código interno
- Código de barras (EAN)
- Descrição
- Descrição resumida
- **Tipo: PRODUTO ou SERVIÇO** ⭐
- Unidade (UN, M², KG, CX, etc.)
- NCM
- CEST
- Origem (Nacional, Importado)
- CST/CSOSN
- Preço de custo
- Margem %
- Preços por tabela
- Estoque mínimo
- Fornecedores

**Por que tela única com flag?**
> **Fiscalmente adequado**: Produtos = ICMS, Serviços = ISSQN
> Sistema diferencia automaticamente na emissão de NF-e ou NFS-e
> Simplifica manutenção - um só lugar para cadastrar tudo

**Exemplo de uso na PLANAC:**

| Tipo | Exemplo | Imposto |
|------|---------|---------|
| PRODUTO | Placa Drywall 1,20x1,80 | ICMS |
| PRODUTO | Parafuso Philips 25mm | ICMS |
| SERVIÇO | Instalação de Forro | ISSQN |
| SERVIÇO | Projeto Técnico | ISSQN |

**Integra com:** Estoque, Vendas, Compras, Fiscal, Tabelas de Preço

---

### 🏢 MATRIZ & FILIAIS

#### EMPRESAS (tela única)
**O que é:** Cadastro unificado da matriz e filiais da PLANAC.

**Campos principais:**
- Razão Social
- Nome Fantasia
- CNPJ
- Inscrição Estadual
- Inscrição Municipal
- Endereço completo
- **Tipo: MATRIZ ou FILIAL** ⭐
- CNPJ da Matriz (se filial)
- Certificado Digital A1
- Regime tributário
- CNAE
- Configurações fiscais específicas

**Por que tela única?**
> Visão consolidada de toda a estrutura
> Facilita comparação entre unidades
> Configuração centralizada

**Exemplo de uso na PLANAC:**
> PLANAC tem matriz em Londrina e filial em Maringá:
> 
> | Empresa | Tipo | CNPJ |
> |---------|------|------|
> | PLANAC Londrina | MATRIZ | 00.000.000/0001-00 |
> | PLANAC Maringá | FILIAL | 00.000.000/0002-00 |
> 
> Cada uma tem seu certificado digital, série de NF-e, estoque próprio.

**Integra com:** Fiscal, Estoque, Financeiro, Usuários

---

### 🏦 FINANCEIRO

#### 1. CONTAS BANCÁRIAS
**O que é:** Contas correntes da PLANAC nos bancos.

**Campos principais:**
- Banco
- Agência
- Conta
- Tipo (Corrente, Poupança)
- Empresa/Filial
- Saldo inicial
- Ativa (S/N)

**Exemplo de uso:**
> - Banco do Brasil - Ag 1234 - CC 56789-0 (Matriz)
> - Itaú - Ag 0001 - CC 12345-6 (Filial Maringá)
> - Caixa - Ag 0500 - CC 00001-0 (Recebimentos PIX)

**Integra com:** Contas a Receber, Contas a Pagar, Conciliação, Boletos

---

#### 2. PLANO DE CONTAS
**O que é:** Estrutura contábil de receitas e despesas.

**Campos principais:**
- Código
- Descrição
- Tipo (Receita, Despesa, Ativo, Passivo)
- Nível
- Conta pai
- Natureza

**Exemplo de uso:**
```
1. RECEITAS
   1.1 Vendas de Mercadorias
       1.1.1 Vendas Drywall
       1.1.2 Vendas Acessórios
   1.2 Receitas de Serviços
       1.2.1 Instalação
       
2. DESPESAS
   2.1 Custos de Mercadorias
   2.2 Despesas Operacionais
       2.2.1 Salários
       2.2.2 Aluguel
       2.2.3 Marketing
```

**Integra com:** Contabilidade, DRE, Balanço, Lançamentos

---

#### 3. CENTROS DE CUSTO ⭐ NOVO
**O que é:** Divisões organizacionais para controle de gastos.

**Campos principais:**
- Código
- Nome
- Tipo (Filial, Departamento, Projeto)
- Responsável
- Orçamento mensal
- Ativo (S/N)

**Para que serve:**
| Função | Benefício |
|--------|-----------|
| Saber quanto cada área gasta | Controle detalhado |
| Comparar filiais | Qual dá mais lucro |
| Fazer orçamentos | Previsão mais precisa |
| Tomar decisões | Baseadas em números reais |

**Exemplo de uso na PLANAC:**
> Centros de custo configurados:
> - **CC01 - Matriz Londrina**: todos os gastos da matriz
> - **CC02 - Filial Maringá**: gastos da filial
> - **CC03 - Marketing**: gastos com propaganda
> - **CC04 - Logística**: gastos com entregas
>
> **Relatório mensal:**
> | Centro de Custo | Receita | Despesa | Resultado |
> |-----------------|---------|---------|-----------|
> | Matriz Londrina | R$ 150.000 | R$ 100.000 | +R$ 50.000 |
> | Filial Maringá | R$ 45.000 | R$ 30.000 | +R$ 15.000 |
> | Marketing | - | R$ 8.000 | -R$ 8.000 |
> | Logística | - | R$ 12.000 | -R$ 12.000 |
>
> **Decisão:** "Maringá está com margem menor, precisa aumentar vendas ou reduzir custos"

**Integra com:** Contas a Pagar, Contabilidade, DRE por Centro de Custo

---

#### 4. CONDIÇÕES DE PAGAMENTO ⭐ NOVO
**O que é:** Regras de como receber dos clientes e pagar fornecedores.

**Campos principais:**
- Código
- Descrição
- Tipo (Recebimento, Pagamento)
- Parcelas
- Dias entre parcelas
- Desconto à vista %
- Forma padrão (Boleto, PIX, Cartão)
- Ativo (S/N)

**Para que serve:**
| Função | Benefício |
|--------|-----------|
| Padronizar formas de pagamento | Todos vendem igual |
| Descontos automáticos | Sistema calcula sozinho |
| Controlar prazos | Saber quando vai receber |
| Negociações mais rápidas | Cliente escolhe, sistema aplica |

**Exemplo de uso na PLANAC:**

**Condições cadastradas:**
| Código | Descrição | Parcelas | Desconto |
|--------|-----------|----------|----------|
| AV-PIX | À Vista PIX | 1 | 5% |
| AV-DIN | À Vista Dinheiro | 1 | 3% |
| 30D | 30 dias | 1 | 0% |
| 30-60 | 30/60 dias | 2 | 0% |
| 30-60-90 | 30/60/90 dias | 3 | 0% |
| 28-56-84 | Semanal (4 semanas) | 3 | 0% |

**Cenário prático:**
> Vendedor faz orçamento de R$ 10.000
> - Cliente pergunta: "Quanto fica à vista no PIX?"
> - Vendedor seleciona "AV-PIX"
> - Sistema mostra automaticamente: **R$ 9.500** (5% desconto)
> 
> Cliente aceita e paga no PIX → Venda fechada!

**Integra com:** Orçamentos, Vendas, Compras, Financeiro

---

### 🏷️ COMERCIAL

#### TABELAS DE PREÇO ⭐ NOVO
**O que é:** Listas com preços diferentes para tipos de clientes.

**Campos principais:**
- Código
- Nome
- Descrição
- Tipo (Varejo, Atacado, Revenda, Especial)
- Margem base %
- Validade
- Ativa (S/N)
- Produtos com preços específicos

**Para que serve:**
| Função | Benefício |
|--------|-----------|
| Preços por tipo de cliente | Revenda paga menos |
| Promoções específicas | Desconto para construtoras |
| Margens controladas | Saber se está lucrando |
| Competitividade | Preço certo para cada mercado |

**Exemplo de uso na PLANAC:**

**Tabelas configuradas:**
| Tabela | Público | Margem |
|--------|---------|--------|
| VAREJO | Consumidor final | 50% |
| REVENDA | Lojas parceiras | 25% |
| CONSTRUTOR | Construtoras | 30% |
| INSTALADOR | Gesseiros e instaladores | 28% |

**Preços por tabela:**
| Produto | Custo | Varejo | Revenda | Construtor |
|---------|-------|--------|---------|------------|
| Placa Drywall 1,20x1,80 | R$ 20,00 | R$ 35,00 | R$ 25,00 | R$ 28,00 |
| Perfil Montante 3m | R$ 8,00 | R$ 15,00 | R$ 10,00 | R$ 11,00 |
| Parafuso (cento) | R$ 5,00 | R$ 12,00 | R$ 7,00 | R$ 8,00 |

**Cenário prático:**
> Cliente liga: "Sou da Loja Casa do Gesso, quero orçamento"
> - Vendedor seleciona cliente (tipo: REVENDA)
> - Sistema carrega automaticamente **Tabela REVENDA**
> - Todos os produtos aparecem com preço de revenda!
> - Vendedor não precisa calcular nada

**Integra com:** Produtos, Orçamentos, Vendas, Clientes

---

### 🚗 PATRIMÔNIO

#### 1. VEÍCULOS
**O que é:** Frota própria da PLANAC (caminhões, utilitários, carros).

**Campos principais:**
- Placa
- Marca/Modelo
- Ano
- Renavam
- Tipo (Caminhão, Van, Carro)
- Capacidade de carga
- Motorista responsável
- Km atual
- Data última revisão
- Valor do bem
- Depreciação

**Exemplo de uso:**
> - HRV 5000 kg - Entregas grandes
> - Fiorino - Entregas pequenas
> - Celta - Uso administrativo

**Integra com:** Logística, Patrimônio, Manutenção, CT-e

---

#### 2. BENS
**O que é:** Ativos físicos da empresa (móveis, equipamentos, etc.)

**Campos principais:**
- Código patrimônio
- Descrição
- Categoria
- Localização
- Data aquisição
- Valor aquisição
- Valor residual
- Taxa depreciação
- Estado conservação

**Exemplo de uso:**
> - Computadores
> - Empilhadeira
> - Móveis de escritório
> - Prateleiras do estoque

**Integra com:** Contabilidade, Depreciação, Manutenção

---

### 🔐 ACESSOS

#### 1. USUÁRIOS
**O que é:** Pessoas que acessam o sistema.

**Campos principais:**
- Login
- Nome
- Email
- Senha (criptografada)
- Perfil
- Colaborador vinculado
- Filiais permitidas
- Ativo (S/N)
- Último acesso

**Integra com:** Perfis, Colaboradores, Log de Auditoria

---

#### 2. PERFIS DE USUÁRIOS
**O que é:** Grupos de permissões (o que cada tipo de usuário pode fazer).

**Campos principais:**
- Nome do perfil
- Descrição
- Módulos permitidos
- Ações permitidas (Criar, Editar, Excluir, Visualizar)
- Limites (ex: desconto máximo)

**Perfis sugeridos:**
| Perfil | Acesso |
|--------|--------|
| Administrador | Tudo |
| Gerente Comercial | Comercial, CRM, Relatórios |
| Vendedor | Orçamentos, Vendas (sem editar preço) |
| Estoquista | Estoque, Movimentações |
| Financeiro | Financeiro, Relatórios |
| Fiscal | Notas Fiscais, SPED |

---

## ⚙️ CONFIGURAÇÕES (Módulo Separado)

### CONFIGURAÇÕES GERAIS
**O que é:** Parâmetros que afetam todo o funcionamento do sistema.

**Categorias de configuração:**

#### Fiscal
- Alíquotas ICMS por UF
- CST padrão por tipo de operação
- Série de NF-e por filial
- Certificado Digital A1
- Ambiente (Homologação/Produção)

#### Comercial
- Comissão padrão vendedor %
- Desconto máximo sem aprovação %
- Prazo validade orçamento (dias)
- Reserva automática de estoque (S/N)

#### Financeiro
- Multa por atraso %
- Juros por dia %
- Dias para protesto
- Banco padrão para boletos

#### Sistema
- Logo da empresa
- Cor do tema
- Formato de data
- Casas decimais
- Backup automático

**Exemplo de uso na PLANAC:**
```
CONFIGURAÇÕES FISCAIS:
├── ICMS PR: 19%
├── ICMS SP: 18%
├── ICMS SC: 17%
├── Série NF-e Matriz: 1
├── Série NF-e Filial: 2
└── Ambiente: PRODUÇÃO

CONFIGURAÇÕES COMERCIAIS:
├── Comissão vendedor: 3%
├── Desconto máximo: 10%
├── Validade orçamento: 15 dias
└── Reserva estoque: SIM

CONFIGURAÇÕES FINANCEIRAS:
├── Multa atraso: 2%
├── Juros dia: 0,033%
├── Dias protesto: 5
└── Banco boletos: Banco do Brasil
```

---

## 📈 MÉTRICAS DO MÓDULO

| Métrica | Valor |
|---------|-------|
| Total de itens | 16 |
| Categorias | 7 |
| Itens novos (desta especificação) | 5 |
| Módulo separado | 1 (Configurações) |

### Itens por categoria:
| Categoria | Quantidade |
|-----------|------------|
| Entidades | 5 |
| Produtos | 1 |
| Matriz & Filiais | 1 |
| Financeiro | 4 |
| Comercial | 1 |
| Patrimônio | 2 |
| Acessos | 2 |

---

## ✅ APROVAÇÕES

### Especialistas DEV.com que aprovaram (21):
- 🎯 CEO DEV.com
- 📋 CPO / Product Manager
- 💰 CFO
- 📊 Especialista Tributário
- 📄 Especialista Sistemas Fiscais
- 🎨 UX/UI Designer
- 🎨 Frontend
- 🤖 Especialista IA & Automações
- ⚡ MLOps
- 🔌 Arquiteto de Integrações
- ☁️ GitHub & Cloudflare
- 🚀 DevOps / SRE
- 📊 Especialista BI
- 🔄 Data Engineer
- 💼 Gestor de Vendas
- 🤝 Especialista CRM/CS
- 🏠 Especialista Drywall
- 🎨 Designer Gráfico
- 📱 Mobile
- 📦 Especialista Compras
- 🏢 Especialista ERP

### Aprovação Final:
- ✅ **Rodrigo (CEO PLANAC)** - 15/12/2025

---

## 📝 HISTÓRICO DE VERSÕES

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 15/12/2025 | Claude + Especialistas DEV.com | Versão inicial aprovada |

---

## 🔗 DOCUMENTOS RELACIONADOS

- [STATUS_PLANAC_ERP_2025-12-14.md](./STATUS_PLANAC_ERP_2025-12-14.md)
- [REALINHAMENTO_PLANAC_2025-12-14.md](./REALINHAMENTO_PLANAC_2025-12-14.md)
- Modelo de Dados (docs/05-modelo-dados/)
- Especificação de Telas (docs/06-especificacao-telas/)

---

**Documento gerado:** 15/12/2025  
**Repositório:** https://github.com/Ropetr/Planac-Revisado  
**Próxima etapa:** Implementação do Sidebar com a nova estrutura
