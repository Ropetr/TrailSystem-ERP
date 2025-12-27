# Especificação de Telas - Módulo Compras

Este documento contém as especificações de telas do módulo de compras.

# PARTE 3 - COMPRAS

## 3.1 Cotações com Fornecedores

### Tela: Lista de Cotações
**Rota:** `/cotacoes`

| Filtro | Tipo | Descrição |
|--------|------|-----------|
| Período | DATE_RANGE | Data de criação |
| Status | SELECT | Aberta, Em Andamento, Finalizada, Cancelada |
| Comprador | AUTOCOMPLETE | Responsável |
| Fornecedor | AUTOCOMPLETE | Fornecedores cotados |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Número | Número da cotação |
| Data | Data de criação |
| Descrição | Título/motivo da cotação |
| Fornecedores | Qtd de fornecedores |
| Respostas | Qtd de respostas recebidas |
| Prazo | Data limite |
| Status | Badge |
| Ações | Menu |

---

### Tela: Nova Cotação
**Rota:** `/cotacoes/novo`

#### Cabeçalho

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Número | TEXT | - | Gerado automaticamente |
| Data | DATE | * | Data de hoje |
| Descrição | TEXT | * | Título da cotação |
| Prazo para Resposta | DATE | * | Data limite |
| Comprador | AUTOCOMPLETE | * | Responsável |
| Observações | TEXTAREA | - | Instruções aos fornecedores |

#### Itens a Cotar

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| Produto | AUTOCOMPLETE | Busca produtos |
| Descrição | TEXT | Descrição do produto |
| Quantidade | NUMBER | Qtd necessária |
| Unidade | TEXT | UN, CX, etc. |
| Última Compra | MONEY | Último preço pago (info) |
| Fornecedor Anterior | TEXT | Quem vendeu (info) |

**Botão:** Importar do Estoque Mínimo (traz produtos abaixo do mínimo)

#### Fornecedores a Cotar

| Coluna | Descrição |
|--------|-----------|
| Fornecedor | Autocomplete de fornecedores |
| Contato | E-mail/telefone |
| Enviar Por | E-mail, WhatsApp |

**Botões:**
- Adicionar Fornecedor
- Sugerir Fornecedores (baseado em compras anteriores)
- Salvar
- Enviar Cotação

---

### Tela: Comparativo de Cotação
**Rota:** `/cotacoes/:id/comparativo`

**Tabela Comparativa:**
| Produto | Qtd | Forn. A | Forn. B | Forn. C | Menor |
|---------|-----|---------|---------|---------|-------|
| Placa Drywall 1,20x2,40 | 100 | R$ 45,00 ✓ | R$ 48,00 | R$ 46,50 | Forn. A |
| Perfil Montante 48mm | 200 | R$ 12,00 | R$ 11,50 ✓ | R$ 12,20 | Forn. B |
| Parafuso Cabeça Trombeta | 5000 | R$ 0,08 | R$ 0,07 ✓ | R$ 0,09 | Forn. B |

**Totais:**
| Fornecedor | Total | Prazo | Frete | Condição |
|------------|-------|-------|-------|----------|
| Fornecedor A | R$ 5.200 | 7 dias | Grátis | 28 DDL |
| Fornecedor B | R$ 4.950 | 10 dias | R$ 150 | 21 DDL |
| Fornecedor C | R$ 5.100 | 5 dias | R$ 200 | À vista |

**Ações:**
| Botão | Descrição |
|-------|-----------|
| Selecionar Menor Global | Escolhe fornecedor com menor total |
| Selecionar Menor por Item | Divide pedido entre fornecedores |
| Gerar Pedido de Compra | Cria pedido(s) |

---

## 3.2 Pedido de Compra

### Tela: Lista de Pedidos de Compra
**Rota:** `/compras`

| Filtro | Tipo | Descrição |
|--------|------|-----------|
| Período | DATE_RANGE | Data do pedido |
| Status | SELECT | Rascunho, Aguardando Aprovação, Aprovado, Parcial Recebido, Recebido, Cancelado |
| Fornecedor | AUTOCOMPLETE | - |
| Comprador | AUTOCOMPLETE | - |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Número | Número do pedido |
| Data | Data do pedido |
| Fornecedor | Nome do fornecedor |
| Comprador | Responsável |
| Valor | Total do pedido |
| Recebido | % recebido |
| Status | Badge |
| Ações | Menu |

---

### Tela: Novo Pedido de Compra
**Rota:** `/compras/novo`

#### Cabeçalho

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Número | TEXT | - | Gerado automaticamente |
| Data | DATE | * | Data do pedido |
| Fornecedor | AUTOCOMPLETE | * | Busca fornecedores |
| Comprador | AUTOCOMPLETE | * | Responsável |
| Cotação | AUTOCOMPLETE | - | Vincula a cotação |
| Condição Pagamento | SELECT | * | À vista, 28, 35, 42 DDL |
| Previsão Entrega | DATE | * | Data esperada |
| Frete | SELECT | * | CIF, FOB |
| Valor Frete | MONEY | - | Se FOB |
| Observações | TEXTAREA | - | - |

#### Itens do Pedido

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| Produto | AUTOCOMPLETE | Busca produtos |
| Descrição | TEXT | Descrição |
| Quantidade | NUMBER | Qtd a comprar |
| Unidade | TEXT | UN, CX |
| Preço Unit. | MONEY | Preço negociado |
| IPI % | NUMBER | Se aplicável |
| Subtotal | MONEY | Calculado |
| Bonificado | CHECKBOX | Item bonificado |

**Se Bonificado:**
- Não gera contas a pagar
- CFOP de entrada ajustado automaticamente

#### Totais

| Campo | Valor |
|-------|-------|
| Subtotal Produtos | Soma dos itens |
| IPI | Total de IPI |
| Frete | Valor do frete |
| Outras Despesas | Seguro, embalagem |
| Total | Valor final |

#### Aprovação

**Se valor > alçada do comprador:**
| Campo | Descrição |
|-------|-----------|
| Aprovador | Quem deve aprovar |
| Justificativa | Motivo da compra |
| Urgência | Baixa, Média, Alta |

**Botões:**
- Salvar Rascunho
- Enviar para Aprovação
- Aprovar (se tem alçada)
- Enviar ao Fornecedor

---

### Tela: Aprovação de Compras
**Rota:** `/compras/aprovacoes`

**Lista de Pedidos Pendentes:**
| Coluna | Descrição |
|--------|-----------|
| Número | Pedido |
| Solicitante | Quem pediu |
| Fornecedor | - |
| Valor | Total |
| Justificativa | Motivo |
| Urgência | Badge |
| Aguardando há | Dias |

**Ações:**
- Aprovar
- Reprovar (exige motivo)
- Solicitar Informações

---

## 3.3 Recebimento de Mercadorias

### Tela: Recebimentos Pendentes
**Rota:** `/recebimentos/pendentes`

| Coluna | Descrição |
|--------|-----------|
| Pedido | Número do pedido |
| Fornecedor | Nome |
| Previsão | Data prevista |
| Dias Atraso | Se atrasado |
| Valor | Total pendente |
| Status | Aguardando, Atrasado |

---

### Tela: Novo Recebimento
**Rota:** `/recebimentos/novo`

#### Etapa 1: Identificação

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Pedido de Compra | AUTOCOMPLETE | * | Busca pedidos pendentes |
| Nota Fiscal | TEXT | * | Número da NF do fornecedor |
| Série | TEXT | * | Série da NF |
| Chave NF-e | TEXT | * | 44 dígitos |
| Data Emissão | DATE | * | Data da NF |
| Data Entrada | DATE | * | Data de hoje |

**Botão:** Importar XML (preenche automaticamente)

#### Etapa 2: Conferência de Itens

| Coluna | Descrição |
|--------|-----------|
| Produto | Nome |
| Pedido | Qtd no pedido |
| NF | Qtd na nota |
| Recebido | Qtd física recebida |
| Divergência | Diferença |
| Preço Pedido | Preço negociado |
| Preço NF | Preço na nota |
| Dif. Preço | Diferença |

**Alertas:**
- 🔴 Quantidade divergente
- 🟡 Preço divergente
- 🟢 Conforme

**Tratamento de Divergências:**
| Campo | Opções |
|-------|--------|
| Quantidade menor | Receber parcial, Recusar tudo |
| Quantidade maior | Receber conforme pedido, Aceitar excedente |
| Preço diferente | Manter pedido, Aceitar NF, Recusar |

#### Etapa 3: Dados Fiscais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| CFOP | TEXT | Preenchido via XML |
| Base ICMS | MONEY | - |
| Valor ICMS | MONEY | - |
| Base IPI | MONEY | - |
| Valor IPI | MONEY | - |
| Base ST | MONEY | - |
| Valor ST | MONEY | - |

#### Etapa 4: Armazenamento (se WMS)

| Coluna | Descrição |
|--------|-----------|
| Produto | Nome |
| Quantidade | Qtd recebida |
| Localização | Endereço no armazém |
| Lote | Se controla lote |
| Validade | Se controla validade |

**Botões:**
- Sugerir Localizações
- Confirmar Recebimento
- Imprimir Etiquetas

---

## 3.4 Devolução de Compra

### Tela: Nova Devolução ao Fornecedor
**Rota:** `/compras/devolucoes/novo`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Nota Fiscal Original | AUTOCOMPLETE | * | NF de entrada |
| Fornecedor | TEXT | - | Preenchido automaticamente |
| Motivo | SELECT | * | Defeito, Erro, Divergência, Acordo |
| Descrição | TEXTAREA | * | Detalhes |

**Itens a Devolver:**
| Coluna | Descrição |
|--------|-----------|
| Produto | Nome |
| Qtd Recebida | Original |
| Qtd a Devolver | Informar |
| Valor Unit. | Preço da NF |
| Subtotal | Calculado |

**Ações:**
- Salvar Rascunho
- Gerar NF de Devolução
- Aguardar Autorização (se fornecedor exige)

---

## 3.5 Gestão de Estoque

### Tela: Posição de Estoque
**Rota:** `/estoque`

| Filtro | Tipo | Descrição |
|--------|------|-----------|
| Busca | TEXT | Código, nome |
| Categoria | MULTISELECT | Categorias |
| Situação | SELECT | Normal, Abaixo Mínimo, Zerado, Negativo |
| Filial | SELECT | Se multi-empresa |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Código | Código do produto |
| Produto | Nome |
| Unidade | UN, M, etc. |
| Estoque | Quantidade atual |
| Reservado | Reservado para vendas |
| Disponível | Estoque - Reservado |
| Mínimo | Estoque mínimo |
| Máximo | Estoque máximo |
| Situação | Badge (Normal, Baixo, Crítico) |
| Localização | Endereço WMS |

**Cards Resumo:**
| Card | Valor |
|------|-------|
| Total de Itens | 1.250 produtos |
| Valor em Estoque | R$ 850.000 |
| Abaixo do Mínimo | 45 itens |
| Zerados | 12 itens |

---

### Tela: Movimentações de Estoque
**Rota:** `/estoque/movimentacoes`

| Filtro | Descrição |
|--------|-----------|
| Período | Data das movimentações |
| Produto | Específico |
| Tipo | Entrada, Saída, Ajuste, Transferência |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Data/Hora | Quando ocorreu |
| Produto | Nome |
| Tipo | Entrada/Saída/Ajuste |
| Origem | Compra, Venda, Devolução, Manual |
| Documento | NF, Pedido, etc. |
| Quantidade | Qtd movimentada |
| Saldo Anterior | Antes |
| Saldo Atual | Depois |
| Usuário | Quem fez |

---

### Tela: Ajuste de Estoque
**Rota:** `/estoque/ajuste`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Produto | AUTOCOMPLETE | * | Busca produto |
| Estoque Atual | NUMBER | - | Somente leitura |
| Novo Estoque | NUMBER | * | Quantidade correta |
| Diferença | NUMBER | - | Calculado |
| Motivo | SELECT | * | Inventário, Avaria, Roubo, Erro, Outros |
| Justificativa | TEXTAREA | * | Detalhes |
| Documento | FILE | - | Comprovante |

**Aprovação:** Se diferença > X%, requer aprovação

---

### Tela: Transferência entre Filiais
**Rota:** `/estoque/transferencia`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Filial Origem | SELECT | * | De onde sai |
| Filial Destino | SELECT | * | Para onde vai |
| Data | DATE | * | Data da transferência |
| Responsável | AUTOCOMPLETE | * | Quem solicita |

**Itens:**
| Coluna | Descrição |
|--------|-----------|
| Produto | Nome |
| Estoque Origem | Disponível na origem |
| Quantidade | Qtd a transferir |

**Fluxo:**
1. Criar Solicitação
2. Aprovar (se necessário)
3. Emitir NF de Transferência
4. Expedir na Origem
5. Receber no Destino
6. Dar Entrada

---

### Tela: Inventário
**Rota:** `/estoque/inventario`

#### Lista de Inventários

| Coluna | Descrição |
|--------|-----------|
| Número | Código |
| Data | Início |
| Tipo | Total, Parcial, Rotativo |
| Abrangência | Todas categorias ou específicas |
| Status | Em Andamento, Finalizado, Cancelado |
| Divergências | Quantidade de itens com diferença |

---

#### Novo Inventário

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Tipo | SELECT | * | Total, Parcial, Rotativo |
| Categorias | MULTISELECT | ** | Se parcial |
| Localizações | MULTISELECT | ** | Se por endereço |
| Data Início | DATE | * | - |
| Responsável | AUTOCOMPLETE | * | - |
| Bloquear Movimentações | CHECKBOX | - | Impede entradas/saídas |

---

#### Contagem de Inventário

**Por produto ou por localização:**

| Coluna | Descrição |
|--------|-----------|
| Produto | Nome |
| Localização | Endereço |
| Sistema | Qtd no sistema |
| 1ª Contagem | Primeira contagem |
| 2ª Contagem | Se divergente |
| 3ª Contagem | Desempate |
| Final | Quantidade aceita |
| Diferença | Sistema - Final |
| Valor Diferença | Impacto financeiro |

**Ações:**
- Registrar Contagem
- Solicitar Recontagem
- Aprovar Diferenças
- Gerar Ajustes

---

## 3.6 Gestão de Kits

### Tela: Lista de Kits
**Rota:** `/estoque/kits`

| Coluna | Descrição |
|--------|-----------|
| Código | Código do kit |
| Nome | Descrição |
| Tipo | Virtual ou Montado |
| Componentes | Qtd de componentes |
| Custo | Soma dos componentes |
| Preço | Preço de venda |
| Estoque | Se montado: qtd; Se virtual: menor componente |
| Status | Ativo/Inativo |

---

### Tela: Montagem de Kit
**Rota:** `/estoque/kits/:id/montagem`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Kit | TEXT | Nome do kit (somente leitura) |
| Quantidade a Montar | NUMBER | Quantos kits |
| Data | DATE | Data da montagem |

**Componentes Necessários:**
| Coluna | Descrição |
|--------|-----------|
| Componente | Nome |
| Qtd por Kit | Quantidade unitária |
| Qtd Total | x Quantidade a montar |
| Disponível | Estoque atual |
| Status | ✅ Suficiente / ❌ Insuficiente |

**Ações:**
- Montar (baixa componentes, entra kit)
- Desmontar (entra componentes, baixa kit)

---

## 3.7 Custos e Precificação

### Tela: Painel de Custos
**Rota:** `/custos`

**Cards:**
| Card | Valor |
|------|-------|
| Custos Fixos Mensais | R$ 45.000 |
| Custos Variáveis (mês atual) | R$ 28.000 |
| CMV (mês atual) | R$ 320.000 |
| Margem Média | 32% |

---

### Tela: Custos Fixos
**Rota:** `/custos/fixos`

| Coluna | Descrição |
|--------|-----------|
| Categoria | Tipo do custo |
| Descrição | Detalhe |
| Valor Mensal | Valor fixo |
| Rateio | Por faturamento, Por m², Por unidade |
| Início | Data de início |
| Fim | Data fim (se temporário) |
| Status | Ativo/Inativo |

**Categorias:**
- Aluguel
- Salários e Encargos
- Energia Elétrica
- Água
- Internet/Telefone
- Contabilidade
- Seguros
- Manutenção
- Marketing
- Outros

---

### Tela: Precificação de Produtos
**Rota:** `/custos/precificacao`

| Filtro | Descrição |
|--------|-----------|
| Categoria | Filtrar por categoria |
| Margem | Abaixo da mínima, Normal, Acima |
| Atualização | Desatualizado (> 30 dias) |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Produto | Nome |
| Custo Aquisição | Último custo |
| Custo Médio | Média ponderada |
| Custos Rateados | Fixos + variáveis |
| Custo Total | Custo + rateio |
| Markup | % aplicado |
| Preço Sugerido | Calculado |
| Preço Atual | Preço de venda |
| Margem Real | % real |

**Ações em massa:**
- Aplicar Markup
- Atualizar Preços
- Simular Cenário

---

### Modal: Simulador de Preços
**Abre quando:** Clica em "Simular" no produto

| Campo | Descrição |
|-------|-----------|
| Custo do Produto | R$ 100,00 |
| + Frete (%) | 3% = R$ 3,00 |
| + Impostos (%) | 12% = R$ 12,00 |
| + Custos Fixos (rateio) | R$ 5,00 |
| = Custo Total | R$ 120,00 |
| Margem Desejada (%) | 30% |
| = Preço Sugerido | R$ 156,00 |
| Preço Concorrente | R$ 150,00 |
| Margem com Preço Conc. | 25% |

---

## 3.8 Produção / PCP

### Tela: Ordens de Produção
**Rota:** `/producao`

| Filtro | Descrição |
|--------|-----------|
| Status | Planejada, Em Produção, Finalizada, Cancelada |
| Período | Data da OP |
| Produto | Produto final |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Número | Número da OP |
| Data | Data da ordem |
| Produto | O que vai ser produzido |
| Quantidade | Qtd planejada |
| Produzido | Qtd já produzida |
| Previsão | Data prevista |
| Status | Badge |

---

### Tela: Nova Ordem de Produção
**Rota:** `/producao/novo`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Produto | AUTOCOMPLETE | * | Produto a produzir |
| Quantidade | NUMBER | * | Qtd a produzir |
| Data Início | DATE | * | Início planejado |
| Data Fim | DATE | * | Término planejado |
| Prioridade | SELECT | * | Baixa, Normal, Alta, Urgente |
| Observações | TEXTAREA | - | - |

**Insumos Necessários:**
| Coluna | Descrição |
|--------|-----------|
| Insumo | Componente |
| Qtd por Unidade | Consumo unitário |
| Qtd Total | x Quantidade |
| Em Estoque | Disponível |
| Status | Suficiente/Faltante |

**Ações:**
- Salvar Rascunho
- Liberar para Produção
- Reservar Insumos

---

### Tela: Apontamento de Produção
**Rota:** `/producao/:id/apontamento`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Data/Hora | DATETIME | Quando produziu |
| Quantidade Produzida | NUMBER | Qtd boa |
| Quantidade Refugo | NUMBER | Qtd com defeito |
| Operador | AUTOCOMPLETE | Quem produziu |
| Observações | TEXTAREA | Ocorrências |

---

