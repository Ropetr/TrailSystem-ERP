# 📁 Módulo 01: Cadastros

> Gestão de entidades básicas do sistema

## Visão Geral

O módulo de Cadastros gerencia todas as entidades fundamentais do ERP: Clientes, Produtos, Fornecedores, Transportadoras e outras entidades de apoio.

## Submódulos

| Submódulo | Descrição | Status |
|-----------|-----------|--------|
| [Clientes](#clientes) | Pessoas físicas e jurídicas | ✅ Especificado |
| Produtos | Produtos e serviços | 📝 Pendente |
| Fornecedores | Fornecedores de mercadorias | 📝 Pendente |
| Transportadoras | Empresas de transporte | 📝 Pendente |
| Parceiros de Negócio | Indicadores com cashback | 📝 Pendente |
| Colaboradores | Funcionários da empresa | 📝 Pendente |

---

# 👥 CLIENTES

## Estrutura do Formulário (7 Abas)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 👤 CLIENTE #012345                                      [Salvar]    │
├─────────────────────────────────────────────────────────────────────┤
│ Tipo: (●) Pessoa Jurídica   ( ) Pessoa Física                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ [1.Dados Gerais] [2.Endereços] [3.Contatos] [4.Comercial]          │
│ [5.Financeiro] [6.Histórico] [7.Arquivos]                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Aba 1: Dados Gerais

### Campos Pessoa Jurídica (PJ)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| CNPJ | Input + Botão | ✅ | Consulta automática via CNPJá |
| Razão Social | Input | ✅ | Preenchido automaticamente |
| Nome Fantasia | Input | Não | |
| Inscrição Estadual | Input | Não | Se vazio, marca ISENTO |
| Inscrição Municipal | Input | Não | |
| Contribuinte ICMS | Select | ✅ | Auto: Contribuinte (se tem IE) ou Não Contribuinte |

### Campos Pessoa Física (PF)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| CPF | Input | ✅ | Validação módulo 11 |
| Nome Completo | Input | ✅ | |
| RG | Input | Não | |
| Data Nascimento | Date | Não | |
| Sexo | Select | Não | Masculino, Feminino, Outro |
| Contribuinte ICMS | - | - | Sempre "Não Contribuinte" (bloqueado) |

### Classificações (Ambos)

| Campo | Opções | Descrição |
|-------|--------|-----------|
| **Contribuinte ICMS** | Contribuinte, Não Contribuinte | Afeta tributação e preço |
| **Tipologia** | Profissional, Consumidor Final | Perfil de compra |
| **Origem** | Prospecção, Indicação, Anúncios | De onde veio o cliente |
| **Parceiro Indicador** | Autocomplete | Só aparece se Origem = Indicação |

### Detalhamento das Classificações

#### Contribuinte ICMS (Fiscal)
- **Contribuinte:** PJ com Inscrição Estadual válida → Tributos destacados na NF
- **Não Contribuinte:** PF ou PJ sem IE → Tributos embutidos no preço

#### Tipologia (Controle Interno)
- **Profissional:** Construtoras, Arquitetos, Engenheiros, Montadores → Compra recorrente
- **Consumidor Final:** Pessoas reformando → Compra esporádica

#### Origem (Marketing)
- **Prospecção:** Vendedor fez contato ativo
- **Indicação:** Cliente indicou → **Gera cashback para Parceiro de Negócio**
- **Anúncios:** Google Ads, Meta Ads, etc

---

## Aba 2: Endereços

Permite múltiplos endereços por cliente.

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ ENDEREÇOS                                         [+ Novo Endereço] │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ⭐ PRINCIPAL                                         [✏️] [🗑️]  │ │
│ │ Av. Brasil, 1500 - Centro                                       │ │
│ │ Maringá/PR - CEP 87020-000                                      │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 📦 ENTREGA                                           [✏️] [🗑️]  │ │
│ │ Rua das Flores, 200 - Zona 7                                    │ │
│ │ Maringá/PR - CEP 87030-100                                      │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Campos do Endereço

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| Tipo | Select | ✅ | Principal, Entrega, Cobrança, Obra, Outro |
| CEP | Input | ✅ | Auto-preenche via ViaCEP |
| Logradouro | Input | ✅ | |
| Número | Input | ✅ | |
| Complemento | Input | Não | |
| Bairro | Input | ✅ | |
| Cidade | Input | ✅ | |
| UF | Select | ✅ | |
| Código IBGE | Input | Auto | Preenchido pelo ViaCEP |
| Referência | Input | Não | Ponto de referência |
| Principal | Checkbox | Não | Endereço principal |

### Regras
- Mínimo 1 endereço principal obrigatório
- Ao marcar novo como principal, desmarca o anterior

---

## Aba 3: Contatos

Permite múltiplos contatos por cliente com configuração de notificações WhatsApp.

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ CONTATOS                                          [+ Novo Contato]  │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ⭐ João da Silva - Comprador                         [✏️] [🗑️]  │ │
│ │ 📧 joao@empresa.com.br                                          │ │
│ │ 📞 (44) 3027-1234  📱 (44) 99999-1234 [WhatsApp ✓]              │ │
│ │ 🔔 Recebe: Orçamentos, Pedidos                                  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │    Maria Santos - Financeiro                         [✏️] [🗑️]  │ │
│ │ 📧 financeiro@empresa.com.br                                    │ │
│ │ 📞 (44) 3027-1235  📱 (44) 98888-5678 [WhatsApp ✓]              │ │
│ │ 🔔 Recebe: NF-e, Boletos, Vencimentos, Cobranças               │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Campos do Contato

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| Nome | Input | ✅ | Nome do contato |
| Cargo/Setor | Select | ✅ | Comprador, Financeiro, Diretor, Sócio, Outro |
| E-mail | Input | Não | |
| Telefone Fixo | Input | Não | |
| Celular | Input | Não | |
| WhatsApp | Checkbox | Não | Celular é WhatsApp |
| Principal | Checkbox | Não | Contato principal |

### Notificações por Cargo

| Cargo | Notificações Padrão |
|-------|---------------------|
| **Comprador** | ✅ Orçamentos, ✅ Pedidos, ✅ NF-e |
| **Financeiro** | ✅ Boletos, ✅ Vencimentos, ✅ Cobranças, ✅ NF-e |
| **Diretor/Sócio** | ✅ Relatório Mensal |

---

## Aba 4: Comercial

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ CONFIGURAÇÕES COMERCIAIS                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Vendedor Responsável     Tabela de Preço        Cond. Pagamento     │
│ [Carlos Silva      ▼]   [Atacado         ▼]   [30/60/90       ▼]   │
│                                                                      │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│ LIMITE DE CRÉDITO (Apenas PJ)                                       │
│ ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐ │
│ │ Limite Aprovado   │  │ Saldo Utilizado   │  │ Saldo Disponível  │ │
│ │ R$ 50.000,00      │  │ R$ 12.350,00      │  │ R$ 37.650,00      │ │
│ └───────────────────┘  └───────────────────┘  └───────────────────┘ │
│                                                                      │
│ ⚠️ Para PF: Vendas apenas à vista ou com aprovação do gerente       │
│                                                                      │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│ Desconto Máximo: [10] %    Comissão Vendedor: [5] %                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| Vendedor Responsável | Select | Não | Vendedor padrão |
| Tabela de Preço | Select | Não | Tabela vinculada |
| Condição Pagamento | Select | Não | Condição padrão |
| Limite de Crédito | Money | Não | **Apenas PJ** |
| Desconto Máximo | Percent | Não | % máximo permitido |
| Comissão Vendedor | Percent | Não | % de comissão |

---

## Aba 5: Financeiro

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ SITUAÇÃO FINANCEIRA                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🔴 CLIENTE BLOQUEADO                                            │ │
│ │ Motivo: Título NF 12345 vencido há 3 dias                       │ │
│ │ Bloqueado em: 24/12/2025 às 00:05                               │ │
│ │                                                                  │ │
│ │ [🔓 Desbloquear] (Apenas Gerente)                               │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ RESUMO                                                              │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│ │ A Receber   │ │ Vencidos    │ │ A Vencer    │ │ Maior Atraso│    │
│ │ R$ 15.000   │ │ R$ 2.500 🔴 │ │ R$ 12.500 🟢│ │ 3 dias 🔴   │    │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │
│                                                                      │
│ TÍTULOS EM ABERTO                                                   │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ NF     │ Parcela │ Vencimento │ Valor     │ Status           │   │
│ │ 12345  │ 1/3     │ 22/12/2025 │ R$ 2.500  │ 🔴 Vencido 3d    │   │
│ │ 12345  │ 2/3     │ 15/01/2026 │ R$ 2.500  │ 🟢 A vencer      │   │
│ │ 12345  │ 3/3     │ 15/02/2026 │ R$ 2.500  │ 🟢 A vencer      │   │
│ └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Bloqueio Automático

| Parâmetro | Valor |
|-----------|-------|
| Dias de atraso | **2 dias** (configurável em 15-Configurações) |
| Quem desbloqueia | **Apenas Gerente** |
| Requer justificativa | Sim |

---

## Aba 6: Histórico

### Sub-abas
- Orçamentos
- Vendas
- Devoluções
- Atendimentos

### Cards Resumo
- Total de Compras (lifetime)
- Quantidade de Pedidos
- Ticket Médio
- Última Compra

### Tabela de Vendas Recentes
| Coluna | Descrição |
|--------|-----------|
| NF/Pedido | Número do documento |
| Data | Data da venda |
| Valor | Valor total |
| Status | Faturado, Pendente, Cancelado |
| Ver | Link para detalhes |

---

## Aba 7: Arquivos

Upload de documentos relacionados ao cliente.

| Campo | Descrição |
|-------|-----------|
| Nome | Nome do arquivo |
| Tipo | Contrato, Procuração, RG, CNPJ, Outro |
| Tamanho | Em KB/MB |
| Data | Data do upload |
| Ações | Visualizar, Download, Excluir |

**Storage:** R2 Bucket `planac-erp-storage`

---

## Listagem de Clientes

### Filtros
| Filtro | Opções |
|--------|--------|
| Tipo | Todos, PF, PJ |
| Status | Todos, Ativos, Inativos, Bloqueados |
| Vendedor | Lista de vendedores |
| Tipologia | Profissional, Consumidor Final |
| Contribuinte | Contribuinte, Não Contribuinte |

### Colunas da Tabela
| Coluna | Descrição |
|--------|-----------|
| Tipo | 🏢 PJ ou 👤 PF |
| Código | Código sequencial |
| Nome/Razão | Nome ou Razão Social |
| CPF/CNPJ | Documento |
| Cidade/UF | Localização |
| Telefone | Principal |
| Status | 🟢 Ativo, 🔴 Bloqueado, ⚫ Inativo |
| Limite | Limite de crédito (PJ) |
| Ações | Editar, WhatsApp, Histórico, Mais... |

### Ações em Lote
- Ativar/Inativar selecionados
- Alterar vendedor
- Exportar Excel

---

## Arquivos do Submódulo

- [REGRAS.md](./REGRAS.md) - Regras de negócio CAD-01 a CAD-15
- [API.md](./API.md) - Endpoints da API
- [MODELO_DADOS.md](./MODELO_DADOS.md) - Estrutura do banco

---

## Status de Implementação

| Item | Status |
|------|--------|
| Especificação | ✅ Completa |
| Banco de Dados | ⏳ Ajustes pendentes |
| API Backend | ⏳ Ajustes pendentes |
| Frontend | ⏳ Ajustes pendentes |
| Testes | ⏳ Pendente |

---

**Última atualização:** 26/12/2025
