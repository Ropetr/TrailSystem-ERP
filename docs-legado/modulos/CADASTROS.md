# 📁 MÓDULO CADASTROS - PLANAC ERP
## Especificação Completa e Aprovada
**Data de Aprovação:** 15/12/2025  
**Aprovado por:** Rodrigo (CEO PLANAC) + 57 Especialistas DEV.com  
**Versão:** 1.0

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Estrutura do Módulo](#estrutura-do-módulo)
3. [Entidades](#-entidades)
4. [Produtos](#-produtos)
5. [Matriz & Filiais](#-matriz--filiais)
6. [Financeiro](#-financeiro)
7. [Comercial](#-comercial)
8. [Patrimônio](#-patrimônio)
9. [Acessos](#-acessos)
10. [Módulo Configurações](#-módulo-configurações)

---

## Visão Geral

O módulo **CADASTROS** é o coração do PLANAC ERP. Ele centraliza todos os **dados mestres** (master data) que são utilizados por todos os outros módulos do sistema.

### Princípio Fundamental
> "Cadastra uma vez, usa em todo lugar"

Ao invés de cada módulo ter seu próprio cadastro de clientes, produtos, etc., tudo fica centralizado aqui. Os outros módulos apenas **consomem** esses dados via dropdowns e selects.

### Benefícios
- ✅ **Consistência**: Mesmos dados em todo sistema
- ✅ **Manutenção**: Atualiza em um lugar, reflete em todos
- ✅ **Integridade**: Sem duplicação de informações
- ✅ **Rastreabilidade**: Histórico centralizado

---

## Estrutura do Módulo

```
📁 CADASTROS (16 itens em 7 categorias)
│
├── 👥 Entidades (5 itens)
│   ├── Clientes
│   ├── Fornecedores
│   ├── Transportadoras
│   ├── Colaboradores
│   └── Parceiros de Negócio
│
├── 📦 Produtos (1 item)
│   └── Produtos (flag: Produto/Serviço)
│
├── 🏢 Matriz & Filiais (1 item)
│   └── Matriz & Filiais
│
├── 🏦 Financeiro (4 itens)
│   ├── Contas Bancárias
│   ├── Plano de Contas
│   ├── Centros de Custo
│   └── Condições de Pagamento
│
├── 🏷️ Comercial (1 item)
│   └── Tabelas de Preço
│
├── 🚗 Patrimônio (2 itens)
│   ├── Veículos
│   └── Bens
│
└── 🔐 Acessos (2 itens)
    ├── Usuários
    └── Perfis de Usuários

⚙️ CONFIGURAÇÕES (Módulo Separado)
└── Configurações Gerais
```

---

## 👥 ENTIDADES

### 1. Clientes

**O que é?**
Cadastro de todas as pessoas (físicas ou jurídicas) que compram da PLANAC.

**Campos principais:**
- Tipo: PF ou PJ
- CPF/CNPJ
- Nome/Razão Social
- Endereço completo
- Contatos (telefone, email, WhatsApp)
- Tipo de cliente (Revenda, Construtor, Consumidor Final)
- Limite de crédito
- Condição de pagamento padrão
- Tabela de preço vinculada

**Exemplo prático:**
```
Cliente: CONSTRUTORA ABC LTDA
CNPJ: 12.345.678/0001-90
Tipo: Construtor
Limite: R$ 50.000,00
Condição: 30/60/90 dias
Tabela: Construtor
```

**Usado em:** Orçamentos, Vendas, NF-e, Financeiro (Contas a Receber)

---

### 2. Fornecedores

**O que é?**
Cadastro de empresas que vendem produtos/serviços para a PLANAC.

**Campos principais:**
- CNPJ
- Razão Social
- Endereço
- Contatos
- Produtos que fornece
- Condições de pagamento
- Prazo de entrega médio

**Exemplo prático:**
```
Fornecedor: PLACO DO BRASIL S.A.
CNPJ: 00.123.456/0001-00
Produtos: Placas de Gesso, Perfis
Prazo entrega: 7 dias úteis
Condição: 28 dias
```

**Usado em:** Pedidos de Compra, Cotações, NF-e (entrada), Contas a Pagar

---

### 3. Transportadoras ⭐ NOVO

**O que é?**
Empresas que fazem a entrega dos produtos da PLANAC aos clientes.

**Por que separar de Fornecedores?**
Transportadoras têm dados específicos que fornecedores normais não têm:
- Frota de veículos
- Rotas de atendimento
- Tabelas de frete
- Rastreamento
- Prazos por região

**Campos principais:**
- CNPJ
- Razão Social
- Tipo de veículos (VUC, Toco, Truck, Carreta)
- Regiões atendidas
- Tabela de frete (peso/volume/distância)
- Prazo de entrega por região
- Contato do rastreamento
- Avaliação (pontualidade, avarias)

**Exemplo prático:**
```
Transportadora: JADLOG LOGÍSTICA
CNPJ: 04.884.082/0001-35
Tipo: Rodoviário fracionado
Atende: Todo Brasil
Prazo SP: 3 dias | Prazo NE: 7 dias
Frete mínimo: R$ 50,00
Avaliação: ⭐⭐⭐⭐ (4.2)
```

**Fluxo de uso na venda:**
1. Vendedor fecha pedido → R$ 10.000 em placas (500kg)
2. Cliente em Brasília
3. Sistema consulta transportadoras que atendem DF
4. Mostra opções:
   - Jadlog: R$ 380 (5 dias)
   - Total Express: R$ 420 (4 dias)
   - Transportadora Local: R$ 350 (7 dias)
5. Vendedor/cliente escolhe
6. Sistema gera CT-e (conhecimento de transporte)
7. Rastreamento disponível

**Usado em:** Vendas, Logística, CT-e, MDF-e, Rastreamento

---

### 4. Colaboradores

**O que é?**
Funcionários da PLANAC (vendedores, estoquistas, administrativo, etc.)

**Campos principais:**
- CPF
- Nome completo
- Cargo/Função
- Departamento
- Data admissão
- Salário base
- Comissão (se vendedor)
- Usuário vinculado no sistema

**Exemplo prático:**
```
Colaborador: JOÃO SILVA
CPF: 123.456.789-00
Cargo: Vendedor Externo
Departamento: Comercial
Admissão: 01/03/2020
Comissão: 3%
Meta mensal: R$ 100.000
```

**Integração com RH:**
- Folha de Pagamento: puxa salário e comissões
- Ponto Eletrônico: registra entrada/saída
- Férias: controla período aquisitivo

**Usado em:** Vendas (comissão), RH (folha), Usuários (acesso)

---

### 5. Parceiros de Negócio ⭐ NOVO

**O que é?**
Pessoas ou empresas que indicam clientes para a PLANAC e recebem comissão por isso.

**Diferença de Cliente/Fornecedor:**
- Não compra da PLANAC (não é cliente)
- Não vende para PLANAC (não é fornecedor)
- Apenas INDICA clientes e ganha cashback

**Campos principais:**
- CPF/CNPJ
- Nome
- Contatos
- Tipo de parceria (Arquiteto, Engenheiro, Instalador, Influencer)
- Percentual de comissão
- Chave PIX para pagamento
- Histórico de indicações

**Exemplo prático:**
```
Parceiro: ARQ. MARIA SANTOS
CPF: 987.654.321-00
Tipo: Arquiteta
Comissão: 2% sobre vendas indicadas
Chave PIX: maria@email.com

Indicações este mês:
- Cliente ABC: R$ 15.000 → Comissão R$ 300
- Cliente XYZ: R$ 8.000 → Comissão R$ 160
Total a pagar: R$ 460
```

**Programa de Indicações:**
1. Arquiteto indica cliente para PLANAC
2. Cliente compra R$ 10.000
3. Sistema registra origem da indicação
4. Calcula 2% = R$ 200
5. No fechamento do mês, gera pagamento ao parceiro
6. Parceiro recebe via PIX

**Usado em:** Vendas (origem), Financeiro (comissões), CRM (relacionamento)

---

## 📦 PRODUTOS

### Produtos (com flag Produto/Serviço)

**O que é?**
Cadastro unificado de tudo que a PLANAC vende: produtos físicos E serviços.

**Por que unificar?**
- Mesma estrutura de dados
- Mesmo fluxo de venda
- Diferença apenas fiscal (ICMS vs ISSQN)
- Simplifica o sistema

**Campos principais:**
- Código interno
- Código de barras (EAN)
- Descrição
- **Tipo: PRODUTO ou SERVIÇO** ← Flag principal
- NCM (produtos) / Código Serviço (serviços)
- Unidade de medida
- Preço de custo
- Margem de lucro
- Estoque mínimo
- Fornecedor principal
- Foto

**Exemplo - Produto:**
```
Código: 001234
EAN: 7891234567890
Descrição: PLACA DRYWALL ST 1,20x1,80m
Tipo: PRODUTO
NCM: 6809.11.00
Unidade: UN
Custo: R$ 22,00
Margem: 35%
Preço venda: R$ 29,70
Estoque mínimo: 100 un
ICMS: 18% (SP)
```

**Exemplo - Serviço:**
```
Código: SRV001
Descrição: INSTALAÇÃO DE FORRO DRYWALL
Tipo: SERVIÇO
Código Serviço: 07.02
Unidade: M²
Custo: R$ 25,00/m²
Margem: 40%
Preço venda: R$ 35,00/m²
ISSQN: 5%
```

**Tributação automática:**
- Se PRODUTO → calcula ICMS, IPI, PIS, COFINS
- Se SERVIÇO → calcula ISSQN, PIS, COFINS
- Sistema diferencia automaticamente na NF-e/NFS-e

**Usado em:** Orçamentos, Vendas, Estoque, NF-e, NFS-e, Compras

---

## 🏢 MATRIZ & FILIAIS

### Matriz & Filiais (Página Unificada)

**O que é?**
Cadastro da empresa principal (matriz) e suas filiais em uma única tela.

**Por que unificar?**
- Mesmos campos para matriz e filial
- Visão consolidada da empresa
- Facilita gestão multi-filial

**Campos principais:**
- CNPJ
- Razão Social
- Nome Fantasia
- Tipo: MATRIZ ou FILIAL
- Endereço completo
- Inscrição Estadual
- Inscrição Municipal
- Regime tributário (Simples, Lucro Presumido, Real)
- Certificado Digital A1
- Configurações fiscais (série NF-e, ambiente)

**Exemplo:**
```
┌─────────────────────────────────────────────────┐
│ MATRIZ                                          │
├─────────────────────────────────────────────────┤
│ PLANAC DIVISÓRIAS LTDA                          │
│ CNPJ: 12.345.678/0001-00                        │
│ Londrina - PR                                   │
│ IE: 123.456.789                                 │
│ Regime: Lucro Presumido                         │
│ Certificado: Válido até 15/03/2025              │
└─────────────────────────────────────────────────┘
          │
          ├── FILIAL 01
          │   CNPJ: 12.345.678/0002-00
          │   Maringá - PR
          │
          └── FILIAL 02
              CNPJ: 12.345.678/0003-00
              Curitiba - PR
```

**Usado em:** NF-e (emitente), Configurações Fiscais, Relatórios por filial

---

## 🏦 FINANCEIRO

### 1. Contas Bancárias

**O que é?**
Cadastro das contas correntes da PLANAC nos bancos.

**Campos principais:**
- Banco (código e nome)
- Agência
- Conta corrente
- Tipo (Corrente, Poupança, Investimento)
- Titular
- Chave PIX
- Saldo inicial

**Exemplo:**
```
Banco: 001 - Banco do Brasil
Agência: 1234-5
Conta: 12345-6
Tipo: Corrente
Chave PIX: 12345678000100
Saldo atual: R$ 45.230,00
```

**Usado em:** Contas a Pagar, Contas a Receber, Conciliação, Boletos, PIX

---

### 2. Plano de Contas

**O que é?**
Estrutura contábil que organiza todas as contas da empresa (receitas, despesas, ativos, passivos).

**Estrutura padrão:**
```
1. ATIVO
   1.1 Circulante
       1.1.1 Caixa
       1.1.2 Bancos
       1.1.3 Clientes
   1.2 Não Circulante
       1.2.1 Imobilizado

2. PASSIVO
   2.1 Circulante
       2.1.1 Fornecedores
       2.1.2 Impostos a Pagar
   2.2 Não Circulante

3. RECEITAS
   3.1 Vendas de Produtos
   3.2 Vendas de Serviços

4. DESPESAS
   4.1 Operacionais
       4.1.1 Salários
       4.1.2 Aluguel
   4.2 Financeiras
```

**Usado em:** Contabilidade, DRE, Balanço, Lançamentos

---

### 3. Centros de Custo ⭐ NOVO

**O que é?**
"Gavetas organizadoras" dos gastos - cada gaveta representa uma área, filial ou departamento.

**Para que serve?**
- Saber quanto cada área gasta
- Comparar lucratividade entre filiais
- Fazer orçamentos mais precisos
- Tomar decisões baseadas em números

**Campos principais:**
- Código
- Descrição
- Tipo (Filial, Departamento, Projeto)
- Responsável
- Orçamento mensal
- Status (Ativo/Inativo)

**Exemplos de Centros de Custo:**
```
CC001 - Matriz Londrina (Filial)
CC002 - Filial Maringá (Filial)
CC003 - Comercial (Departamento)
CC004 - Administrativo (Departamento)
CC005 - Logística (Departamento)
CC006 - Marketing (Departamento)
CC007 - Obra Shopping Norte (Projeto)
```

**Exemplo de uso prático:**
```
Relatório Mensal - Dezembro/2025

Centro de Custo      | Receita    | Despesa    | Resultado
---------------------|------------|------------|------------
CC001 Matriz         | R$ 250.000 | R$ 180.000 | R$ 70.000 ✅
CC002 Maringá        | R$ 80.000  | R$ 75.000  | R$ 5.000 ⚠️
CC006 Marketing      | -          | R$ 15.000  | -R$ 15.000
---------------------|------------|------------|------------
TOTAL                | R$ 330.000 | R$ 270.000 | R$ 60.000
```

**Decisão do Rodrigo:**
> "Maringá está quase no zero a zero. Preciso analisar se aumentamos vendas ou cortamos custos."

**Usado em:** Lançamentos contábeis, Relatórios gerenciais, Orçamentos

---

### 4. Condições de Pagamento ⭐ NOVO

**O que é?**
Regras de como receber dos clientes e pagar fornecedores.

**Para que serve?**
- Padronizar formas de pagamento
- Dar descontos automáticos
- Controlar prazos de recebimento
- Facilitar negociações

**Campos principais:**
- Código
- Descrição
- Tipo (À Vista, A Prazo, Entrada + Parcelas)
- Quantidade de parcelas
- Dias entre parcelas
- Desconto à vista (%)
- Acréscimo a prazo (%)
- Formas de pagamento aceitas

**Exemplos:**
```
┌────────────────────────────────────────────────────────┐
│ CONDIÇÃO: À VISTA PIX                                  │
├────────────────────────────────────────────────────────┤
│ Parcelas: 1                                            │
│ Vencimento: Imediato                                   │
│ Desconto: 5%                                           │
│ Formas: PIX                                            │
│                                                        │
│ Venda R$ 10.000 → Cliente paga R$ 9.500                │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ CONDIÇÃO: 30/60/90                                     │
├────────────────────────────────────────────────────────┤
│ Parcelas: 3                                            │
│ Intervalo: 30 dias                                     │
│ Desconto: 0%                                           │
│ Formas: Boleto, Cheque                                 │
│                                                        │
│ Venda R$ 10.000:                                       │
│ - 1ª parcela: R$ 3.333,33 (30 dias)                    │
│ - 2ª parcela: R$ 3.333,33 (60 dias)                    │
│ - 3ª parcela: R$ 3.333,34 (90 dias)                    │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ CONDIÇÃO: ENTRADA + 2X                                 │
├────────────────────────────────────────────────────────┤
│ Parcelas: 3 (1 entrada + 2)                            │
│ Entrada: 30%                                           │
│ Intervalo: 30 dias                                     │
│ Formas: Dinheiro (entrada), Boleto (parcelas)          │
│                                                        │
│ Venda R$ 10.000:                                       │
│ - Entrada: R$ 3.000 (hoje)                             │
│ - 1ª parcela: R$ 3.500 (30 dias)                       │
│ - 2ª parcela: R$ 3.500 (60 dias)                       │
└────────────────────────────────────────────────────────┘
```

**Fluxo na venda:**
1. Vendedor seleciona cliente
2. Sistema mostra condições disponíveis para aquele cliente
3. Vendedor escolhe (ex: "30/60/90")
4. Sistema calcula parcelas automaticamente
5. Gera boletos/PIX conforme configurado

**Usado em:** Orçamentos, Vendas, Contas a Receber, Contas a Pagar

---

## 🏷️ COMERCIAL

### Tabelas de Preço ⭐ NOVO

**O que é?**
Listas com preços diferentes para tipos de clientes.

**Para que serve?**
- Preços automáticos por tipo de cliente
- Promoções específicas
- Margens de lucro controladas
- Competitividade no mercado

**Campos principais:**
- Código
- Descrição
- Tipo (Padrão, Revenda, Atacado, Construtor, Promocional)
- Percentual sobre custo ou valor fixo
- Validade (para promoções)
- Clientes vinculados

**Exemplo de estrutura:**
```
┌─────────────────────────────────────────────────────────────────┐
│ TABELAS DE PREÇO - PLANAC                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ TAB01 - CONSUMIDOR FINAL (Padrão)                               │
│ Margem: 50% sobre custo                                         │
│                                                                 │
│ TAB02 - REVENDA                                                 │
│ Margem: 25% sobre custo                                         │
│ Mínimo: 10 unidades por item                                    │
│                                                                 │
│ TAB03 - CONSTRUTOR                                              │
│ Margem: 35% sobre custo                                         │
│ Requisito: Cadastro com CREA                                    │
│                                                                 │
│ TAB04 - ATACADO                                                 │
│ Margem: 15% sobre custo                                         │
│ Mínimo: R$ 10.000 por pedido                                    │
│                                                                 │
│ TAB05 - PROMOÇÃO DEZEMBRO                                       │
│ Desconto: 10% sobre TAB01                                       │
│ Validade: 01/12 a 31/12/2025                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Exemplo de preços por tabela:**
```
Produto: PLACA DRYWALL ST 1,20x1,80m
Custo: R$ 22,00

Tabela           | Margem | Preço Venda
-----------------|--------|------------
Consumidor Final | 50%    | R$ 33,00
Construtor       | 35%    | R$ 29,70
Revenda          | 25%    | R$ 27,50
Atacado          | 15%    | R$ 25,30
```

**Fluxo de uso:**
1. Vendedor seleciona cliente "CONSTRUTORA ABC"
2. Cliente está marcado como "Construtor"
3. Sistema carrega automaticamente TAB03
4. Todos os produtos aparecem com preço de construtor
5. Vendedor pode trocar tabela se tiver permissão

**Usado em:** Orçamentos, Vendas, E-commerce

---

## 🚗 PATRIMÔNIO

### 1. Veículos

**O que é?**
Cadastro de veículos próprios da PLANAC (frota para entregas).

**Campos principais:**
- Placa
- Renavam
- Tipo (VUC, Toco, Truck, Carreta, Moto)
- Marca/Modelo
- Ano fabricação/modelo
- Capacidade de carga (kg)
- Motorista responsável
- Data aquisição
- Valor do bem
- Seguro (apólice, vencimento)
- IPVA (vencimento)
- Licenciamento

**Exemplo:**
```
Veículo: VUC PLANAC 01
Placa: ABC-1234
Tipo: VUC (Veículo Urbano de Carga)
Modelo: Iveco Daily 35S14
Ano: 2023
Capacidade: 1.500 kg
Motorista: José Silva
Valor: R$ 180.000,00
Seguro: Válido até 15/06/2025
IPVA: Pago 2025
```

**Integração com Patrimônio:**
- Registrado como BEM (ativo imobilizado)
- Calcula depreciação mensal
- Controla manutenções

**Usado em:** Logística (entregas), CT-e/MDF-e, Patrimônio

---

### 2. Bens

**O que é?**
Outros ativos da empresa: móveis, computadores, máquinas, equipamentos.

**Campos principais:**
- Código patrimonial
- Descrição
- Categoria (Móveis, Informática, Máquinas, Veículos)
- Data aquisição
- Valor de aquisição
- Vida útil (anos)
- Taxa de depreciação
- Localização
- Responsável
- Número nota fiscal de compra

**Exemplo:**
```
Código: PAT-2025-001
Descrição: Empilhadeira elétrica Yale
Categoria: Máquinas e Equipamentos
Aquisição: 10/01/2025
Valor: R$ 85.000,00
Vida útil: 10 anos
Depreciação: 10% a.a. (R$ 8.500/ano)
Localização: Galpão Principal
NF Compra: 12345
```

**Depreciação automática:**
```
Valor original:        R$ 85.000,00
Depreciação acumulada: R$ 7.083,33 (10 meses)
Valor residual:        R$ 77.916,67
```

**Usado em:** Contabilidade, Inventário patrimonial, Manutenção

---

## 🔐 ACESSOS

### 1. Usuários

**O que é?**
Pessoas que acessam o sistema PLANAC ERP.

**Campos principais:**
- Login (email)
- Senha (criptografada)
- Nome completo
- Colaborador vinculado
- Perfil de acesso
- Filiais com acesso
- Status (Ativo/Inativo/Bloqueado)
- Último acesso
- Autenticação 2FA

**Exemplo:**
```
Usuário: joao.silva@planac.com.br
Nome: João Silva
Colaborador: JOÃO SILVA (Vendedor)
Perfil: Vendedor
Filiais: Matriz, Maringá
Status: Ativo
Último acesso: 15/12/2025 14:30
2FA: Ativado
```

**Usado em:** Login, Auditoria, Permissões

---

### 2. Perfis de Usuários

**O que é?**
Grupos de permissões que definem o que cada tipo de usuário pode fazer.

**Campos principais:**
- Nome do perfil
- Descrição
- Permissões por módulo
- Nível de acesso (Visualizar, Criar, Editar, Excluir)

**Exemplos de perfis:**
```
┌─────────────────────────────────────────────────────────────┐
│ PERFIL: ADMINISTRADOR                                       │
├─────────────────────────────────────────────────────────────┤
│ Acesso total a todos os módulos                             │
│ Pode criar/editar/excluir qualquer registro                 │
│ Acesso a configurações do sistema                           │
│ Visualiza todas as filiais                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PERFIL: VENDEDOR                                            │
├─────────────────────────────────────────────────────────────┤
│ Módulos: Comercial (total), Estoque (visualizar)            │
│ Pode: Criar orçamentos, vendas                              │
│ Não pode: Alterar preços, dar descontos > 5%                │
│ Visualiza: Apenas sua filial                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PERFIL: ESTOQUISTA                                          │
├─────────────────────────────────────────────────────────────┤
│ Módulos: Estoque (total), Compras (visualizar)              │
│ Pode: Movimentar estoque, fazer inventário                  │
│ Não pode: Acessar financeiro, ver custos                    │
│ Visualiza: Apenas sua filial                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PERFIL: FINANCEIRO                                          │
├─────────────────────────────────────────────────────────────┤
│ Módulos: Financeiro (total), Contábil (total)               │
│ Pode: Baixar títulos, emitir boletos, conciliar             │
│ Não pode: Alterar cadastros de produtos                     │
│ Visualiza: Todas as filiais                                 │
└─────────────────────────────────────────────────────────────┘
```

**Usado em:** Controle de acesso, Auditoria, Segurança

---

## ⚙️ MÓDULO CONFIGURAÇÕES

### Configurações Gerais (Módulo Separado)

**Por que módulo separado?**
Configurações são muito importantes e sensíveis para ficarem misturadas com cadastros normais. Apenas administradores devem ter acesso.

**Categorias de configuração:**

#### 1. Configurações Fiscais
```
- Ambiente NF-e: Produção / Homologação
- Série NF-e: 1
- Próximo número NF-e: 12345
- CSC (Código de Segurança do Contribuinte)
- Token IBPT
- Certificado Digital: arquivo + senha
```

#### 2. Configurações de Impostos
```
- ICMS por UF (tabela)
- Alíquota ISSQN padrão: 5%
- PIS: 0,65%
- COFINS: 3%
- IPI por NCM
```

#### 3. Configurações Comerciais
```
- Validade padrão orçamento: 15 dias
- Comissão vendedor padrão: 3%
- Desconto máximo sem aprovação: 5%
- Prazo entrega padrão: 5 dias úteis
```

#### 4. Configurações de E-mail
```
- SMTP servidor
- E-mail de envio de NF-e
- E-mail de cobrança
- Assinatura padrão
```

#### 5. Configurações de Integração
```
- API Nuvem Fiscal (Client ID/Secret)
- API TecnoSpeed (Token)
- WhatsApp Business (Token)
- Gateway de pagamento
```

**Exemplo de tela:**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️ CONFIGURAÇÕES DO SISTEMA                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [🧾 Fiscal]  [💰 Impostos]  [📊 Comercial]  [📧 E-mail]  [🔗 Integrações]
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CONFIGURAÇÕES COMERCIAIS                                │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                                                         │ │
│ │ Validade orçamento:     [15] dias                       │ │
│ │                                                         │ │
│ │ Comissão vendedor:      [3] %                           │ │
│ │                                                         │ │
│ │ Desconto máx. s/ aprov: [5] %                           │ │
│ │                                                         │ │
│ │ Prazo entrega padrão:   [5] dias úteis                  │ │
│ │                                                         │ │
│ │ [💾 Salvar Configurações]                               │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Usado em:** Todo o sistema (parâmetros globais)

---

## 📊 RESUMO FINAL

| Categoria | Itens | Descrição |
|-----------|-------|-----------|
| 👥 Entidades | 5 | Clientes, Fornecedores, Transportadoras, Colaboradores, Parceiros |
| 📦 Produtos | 1 | Produtos e Serviços (flag) |
| 🏢 Matriz & Filiais | 1 | Empresas do grupo |
| 🏦 Financeiro | 4 | Contas, Plano de Contas, Centros de Custo, Condições |
| 🏷️ Comercial | 1 | Tabelas de Preço |
| 🚗 Patrimônio | 2 | Veículos, Bens |
| 🔐 Acessos | 2 | Usuários, Perfis |
| **TOTAL CADASTROS** | **16** | |
| ⚙️ Configurações | 1 | Módulo separado |
| **TOTAL GERAL** | **17** | |

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Estrutura aprovada pelo Rodrigo e especialistas
2. ⏳ Implementar Sidebar com novo menu
3. ⏳ Criar páginas de cadastro
4. ⏳ Criar APIs (routes + services)
5. ⏳ Integrar com módulos existentes

---

**Documento gerado:** 15/12/2025  
**Aprovação:** Rodrigo (CEO PLANAC) + 57 Especialistas DEV.com  
**Repositório:** https://github.com/Ropetr/Planac-Revisado
