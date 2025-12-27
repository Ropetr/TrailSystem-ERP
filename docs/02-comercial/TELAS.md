# Especificação de Telas - Módulo Comercial

Este documento contém as especificações de telas do módulo comercial.

# PARTE 2 - COMERCIAL

## 2.1 CRM

### Tela: Funil de Vendas
**Rota:** `/crm/funil`

**Layout:** Kanban com colunas para cada etapa

| Etapa | Cor | Descrição |
|-------|-----|-----------|
| Lead | Cinza | Contato inicial |
| Contato | Azul | Em contato |
| Proposta | Amarelo | Orçamento enviado |
| Negociação | Laranja | Em negociação |
| Fechado | Verde | Venda realizada |
| Perdido | Vermelho | Não converteu |

**Card do Lead:**
| Elemento | Descrição |
|----------|-----------|
| Nome | Nome do cliente/lead |
| Empresa | Se PJ |
| Valor | Valor estimado |
| Dias na etapa | Contador |
| Vendedor | Responsável |
| Próxima ação | Data do follow-up |

**Ações no Card:**
- Arrastar para outra etapa
- Abrir detalhes
- Registrar interação
- Agendar tarefa
- Converter em cliente

---

### Tela: Cadastro de Lead/Oportunidade
**Rota:** `/crm/oportunidades/:id`

#### Aba: Dados

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Título | TEXT | * | Nome da oportunidade |
| Cliente/Lead | AUTOCOMPLETE | * | Cliente existente ou novo |
| Origem | SELECT | * | Site, Indicação, Telefone, WhatsApp, Feira |
| Etapa | SELECT | * | Etapa do funil |
| Valor Estimado | MONEY | - | Valor potencial da venda |
| Probabilidade | NUMBER | - | % de chance de fechar |
| Data Previsão | DATE | - | Previsão de fechamento |
| Vendedor | AUTOCOMPLETE | * | Responsável |
| Descrição | TEXTAREA | - | Detalhes da oportunidade |

#### Aba: Interações

**Histórico de contatos:**
| Campo | Descrição |
|-------|-----------|
| Data/Hora | Quando ocorreu |
| Tipo | Ligação, E-mail, WhatsApp, Reunião, Visita |
| Descrição | O que foi tratado |
| Próxima Ação | O que fazer a seguir |
| Data Próxima Ação | Quando fazer |
| Usuário | Quem registrou |

**Botão:** + Nova Interação

#### Aba: Tarefas

| Campo | Descrição |
|-------|-----------|
| Tarefa | Descrição da atividade |
| Responsável | Usuário |
| Prazo | Data limite |
| Prioridade | Alta, Média, Baixa |
| Status | Pendente, Em andamento, Concluída |

#### Aba: Orçamentos

- Lista de orçamentos vinculados a esta oportunidade
- Botão: Criar Novo Orçamento

---

## 2.2 Orçamentos

### Tela: Lista de Orçamentos
**Rota:** `/orcamentos`

| Filtro | Tipo | Descrição |
|--------|------|-----------|
| Período | DATE_RANGE | Data de criação |
| Status | SELECT | Aberto, Aprovado, Convertido, Vencido, Cancelado |
| Vendedor | AUTOCOMPLETE | - |
| Cliente | AUTOCOMPLETE | - |
| Busca | TEXT | Número, cliente |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Número | #1234 ou #1234.1 (desmembrado) |
| Data | Data de criação |
| Cliente | Nome do cliente |
| Vendedor | Quem criou |
| Valor | Total do orçamento |
| Validade | Data limite |
| Status | Badge colorido |
| Origem | Novo, Mesclado, Desmembrado |
| Ações | Menu |

**Botões:**
- Novo Orçamento
- Mesclar Selecionados
- Exportar

---

### Tela: Cadastro de Orçamento
**Rota:** `/orcamentos/novo` ou `/orcamentos/:id`

#### Cabeçalho

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Número | TEXT | - | Gerado automaticamente |
| Data | DATE | * | Data do orçamento |
| Validade | DATE | * | Data limite |
| Cliente | AUTOCOMPLETE | * | Busca clientes |
| Vendedor | AUTOCOMPLETE | * | Padrão: usuário logado |
| Tabela de Preço | SELECT | * | Varejo, Atacado, etc. |
| Condição Pagamento | SELECT | - | À vista, 28 dias, etc. |
| Observações | TEXTAREA | - | Notas para o cliente |
| Observações Internas | TEXTAREA | - | Notas internas (não imprime) |

#### Itens do Orçamento

**Tabela de Itens:**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| # | NUMBER | Sequência |
| Produto | AUTOCOMPLETE | Busca produtos |
| Descrição | TEXT | Descrição do produto |
| Quantidade | NUMBER | Qtd solicitada |
| Unidade | TEXT | UN, M, etc. |
| Preço Unitário | MONEY | Preço de venda |
| Desconto % | NUMBER | Desconto em % |
| Desconto R$ | MONEY | Desconto em valor |
| Subtotal | MONEY | Calculado |
| Ações | BUTTON | Remover |

**Botões:**
- Adicionar Item
- Adicionar por Código de Barras
- Importar Lista

#### Totais

| Campo | Descrição |
|-------|-----------|
| Subtotal | Soma dos itens |
| Desconto | Desconto total |
| Frete | Valor do frete |
| Total | Valor final |

#### Ações do Orçamento

| Botão | Ação | Condição |
|-------|------|----------|
| Salvar | Salva rascunho | Sempre |
| Salvar e Enviar | Salva e envia por e-mail/WhatsApp | Sempre |
| Converter em Venda | Cria pedido de venda | Status = Aprovado |
| Duplicar | Cria cópia | Sempre |
| Desmembrar | Separa em múltiplos | Tem mais de 1 item |
| Imprimir | PDF do orçamento | Sempre |
| Cancelar | Cancela orçamento | Status ≠ Convertido |

---

### Modal: Mesclar Orçamentos
**Abre quando:** Seleciona múltiplos orçamentos e clica "Mesclar"

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Orçamentos Selecionados | LIST | Lista dos orçamentos a mesclar |
| Cliente Principal | SELECT | Qual cliente ficará no mesclado |
| Regra Preço Duplicado | SELECT | Menor, Maior, Mais Recente, Manual |

**Preview:** Mostra como ficará o orçamento mesclado

**Botões:**
- Confirmar Mesclagem
- Cancelar

---

### Modal: Desmembrar Orçamento
**Abre quando:** Clica "Desmembrar" no orçamento

| Elemento | Descrição |
|----------|-----------|
| Lista de Itens | Checkboxes para selecionar quais itens separar |
| Preview | Mostra orçamento original e novo(s) |

**Resultado:** 
- Orçamento original fica com itens não selecionados
- Novo orçamento com itens selecionados recebe número #1234.1

---

## 2.3 Pedido de Venda

### Tela: Lista de Vendas
**Rota:** `/vendas`

| Filtro | Tipo | Descrição |
|--------|------|-----------|
| Período | DATE_RANGE | Data do pedido |
| Status | MULTISELECT | Aberto, Parc. Faturado, Total Faturado, Parc. Entregue, Total Entregue, Finalizado |
| Vendedor | AUTOCOMPLETE | - |
| Cliente | AUTOCOMPLETE | - |
| Faturamento | SELECT | Pendente, Parcial, Completo |
| Entrega | SELECT | Pendente, Parcial, Completo |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Número | #1000 ou #1000.1 (desmembrado) |
| Data | Data do pedido |
| Cliente | Nome |
| Vendedor | Responsável |
| Total | Valor da venda |
| Faturado | % faturado |
| Entregue | % entregue |
| Recebido | % recebido |
| Status | Badge |
| Ações | Menu |

**Indicadores visuais:**
- 🟢 Verde: Totalmente faturado e entregue
- 🟡 Amarelo: Parcialmente faturado/entregue
- 🔴 Vermelho: Pendente há mais de X dias
- ⚪ Cinza: Aberto

---

### Tela: Cadastro de Venda
**Rota:** `/vendas/novo` ou `/vendas/:id`

#### Cabeçalho

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Número | TEXT | - | Gerado automaticamente |
| Data | DATE | * | Data do pedido |
| Cliente | AUTOCOMPLETE | * | Com indicador de limite/crédito |
| Vendedor | AUTOCOMPLETE | * | Padrão: usuário logado |
| Tabela de Preço | SELECT | * | - |
| Origem | SELECT | - | Orçamento #X, Venda Direta, E-commerce |

**Alertas automáticos:**
| Alerta | Condição | Cor |
|--------|----------|-----|
| Cliente com crédito disponível | Saldo > 0 | Verde |
| Cliente com títulos vencidos | Títulos em atraso | Vermelho |
| Limite de crédito estourado | Venda > limite disponível | Vermelho |
| Cliente bloqueado | Status = Bloqueado | Vermelho |

#### Itens da Venda

**Igual à tabela de orçamento, com adição de:**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| Bonificado | CHECKBOX | Marca item como bonificação |
| Estoque | NUMBER | Estoque disponível (info) |
| Reservado | NUMBER | Já reservado para esta venda |

**Ao marcar Bonificado:**
- Campo "Motivo da Bonificação" aparece (obrigatório)
- CFOP muda automaticamente para 5.910/6.910
- Item não gera financeiro

#### Seção: Uso de Crédito

**Aparece se cliente tem crédito:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Crédito Disponível | MONEY | Saldo total (somente leitura) |
| Detalhamento | EXPAND | Clique para ver origem dos créditos |
| Usar Crédito | RADIO | Não usar / Usar na Venda Pai / Reservar para Entregas |
| Valor a Usar | MONEY | Se "Usar na Venda Pai" |

#### Seção: Financeiro

| Campo | Tipo | Obrig. | Opções |
|-------|------|--------|--------|
| Tipo de Financeiro | RADIO | * | Recebimento Integral, Contas a Receber, Por Entrega, Definir Depois |

**Se "Recebimento Integral":**
| Campo | Descrição |
|-------|-----------|
| Forma de Pagamento | Múltipla seleção |
| Valor por Forma | Quanto em cada forma |

**Se "Contas a Receber":**
| Campo | Descrição |
|-------|-----------|
| Condição | 28/35/42 dias, etc. |
| Primeira Parcela | Data do primeiro vencimento |
| Número de Parcelas | Quantidade |

#### Seção: Entrega

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Tipo | RADIO | Retirada, Entrega |
| Endereço | SELECT | Endereços do cliente |
| Previsão | DATE | Data prevista |
| Frete | MONEY | Valor do frete |
| Transportadora | AUTOCOMPLETE | Se entrega |

#### Totais

| Campo | Descrição |
|-------|-----------|
| Subtotal | Soma dos itens |
| Descontos | Total de descontos |
| Frete | Valor do frete |
| Crédito Utilizado | Se usou crédito |
| Total | Valor final |
| A Receber | Total - Crédito Utilizado |

---

### Modal: Registrar Entrega
**Abre quando:** Clica "Registrar Entrega" na venda

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Número da Entrega | TEXT | - | Gerado (.E1, .E2...) |
| Data | DATETIME | * | Data/hora da entrega |
| Tipo | SELECT | * | Retirada, Entrega |
| Responsável | TEXT | * | Quem retirou ou motorista |
| Documento | TEXT | - | RG/CPF de quem retirou |

**Itens da Entrega:**
| Coluna | Descrição |
|--------|-----------|
| Produto | Nome do produto |
| Pedido | Quantidade no pedido |
| Já Entregue | Quantidade já entregue |
| Entregar Agora | Quantidade nesta entrega |
| Restante | O que sobra |

**Seção Financeiro (se "Por Entrega"):**
| Campo | Descrição |
|-------|-----------|
| Forma de Pagamento | Como vai pagar esta entrega |
| Valor | Valor cobrado |
| Usar Crédito | Se tem crédito reservado |

---

### Modal: Faturar Venda
**Abre quando:** Clica "Faturar" na venda

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Tipo de Faturamento | RADIO | Total, Parcial, Por Entrega |
| Destinatário | RADIO | Cliente da venda, Outro |
| CNPJ/CPF Destinatário | CNPJ/CPF | Se "Outro" |

**Se Parcial:**
- Lista de itens com checkbox e quantidade a faturar

**Se Por Entrega:**
- Lista de entregas não faturadas para selecionar

**Botões:**
- Pré-visualizar NF
- Emitir NF-e
- Cancelar

---

### Tela: Visão Consolidada da Venda
**Rota:** `/vendas/:id/consolidado`

**Cards de resumo:**
| Card | Valor |
|------|-------|
| Total da Venda | R$ X.XXX,XX |
| Faturado | R$ X.XXX,XX (XX%) |
| Entregue | R$ X.XXX,XX (XX%) |
| Recebido | R$ X.XXX,XX (XX%) |
| Crédito Utilizado | R$ X.XXX,XX |
| A Receber | R$ X.XXX,XX |

**Linha do tempo:**
```
[Pedido Criado] → [Faturado Parcial] → [Entrega .E1] → [Entrega .E2] → [Faturado Total] → [Finalizado]
     01/12              02/12              03/12           05/12            05/12            06/12
```

**Abas:**
- Itens: Lista de produtos
- Entregas: Histórico de entregas
- Notas Fiscais: NFs emitidas
- Financeiro: Títulos gerados
- Histórico: Log de alterações

---

## 2.4 PDV (Ponto de Venda)

### Tela: PDV
**Rota:** `/pdv`
**Layout:** Tela cheia, otimizada para touch

#### Lado Esquerdo (60%)

**Busca de Produtos:**
| Elemento | Descrição |
|----------|-----------|
| Campo de busca | Código, nome ou código de barras |
| Leitor | Integração com leitor de código de barras |
| Últimos | Produtos recentemente vendidos |

**Lista de Itens:**
| Coluna | Descrição |
|--------|-----------|
| Produto | Nome |
| Qtd | Quantidade (editável) |
| Preço | Unitário |
| Subtotal | Qtd x Preço |
| Remover | Botão X |

**Totais:**
| Campo | Valor |
|-------|-------|
| Subtotal | Soma dos itens |
| Desconto | Valor ou % |
| Total | Valor final |

#### Lado Direito (40%)

**Identificação:**
| Campo | Descrição |
|-------|-----------|
| Cliente | Busca ou "Consumidor Final" |
| CPF na Nota | Para NFC-e |
| Vendedor | Usuário logado |

**Formas de Pagamento:**
| Botão | Ação |
|-------|------|
| 💵 Dinheiro | Abre calculadora de troco |
| 💳 Cartão Crédito | Integra com TEF |
| 💳 Cartão Débito | Integra com TEF |
| 📱 PIX | Gera QR Code |
| 📄 Boleto | Gera boleto |
| 💰 Crédito Cliente | Usa saldo |

**Ações:**
| Botão | Ação |
|-------|------|
| Finalizar Venda | Conclui e emite NFC-e |
| Cancelar | Cancela venda atual |
| Consulta | Consulta preço sem vender |
| Sangria | Retira dinheiro do caixa |
| Suprimento | Adiciona dinheiro ao caixa |

---

### Modal: Recebimento em Dinheiro
| Campo | Descrição |
|-------|-----------|
| Total da Venda | Valor a pagar |
| Valor Recebido | Quanto o cliente deu |
| Troco | Calculado automaticamente |

**Teclado numérico virtual para touch**

---

### Modal: Pagamento PIX
| Elemento | Descrição |
|----------|-----------|
| QR Code | Código para o cliente escanear |
| Código Copia e Cola | Alternativa ao QR |
| Timer | Tempo restante (5 minutos) |
| Status | Aguardando → Confirmado |

---

### Tela: Abertura de Caixa
**Rota:** `/pdv/abertura`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Data | DATE | * | Data de hoje |
| Operador | TEXT | - | Usuário logado |
| Caixa | SELECT | * | Número do caixa |
| Valor de Abertura | MONEY | * | Dinheiro inicial |
| Observações | TEXTAREA | - | - |

---

### Tela: Fechamento de Caixa
**Rota:** `/pdv/fechamento`

**Resumo do Dia:**
| Forma | Qtd Vendas | Valor |
|-------|------------|-------|
| Dinheiro | 15 | R$ 2.500,00 |
| Cartão Crédito | 25 | R$ 5.800,00 |
| Cartão Débito | 18 | R$ 3.200,00 |
| PIX | 30 | R$ 4.500,00 |
| Crédito Cliente | 2 | R$ 350,00 |
| **Total** | **90** | **R$ 16.350,00** |

**Conferência de Caixa:**
| Campo | Sistema | Informado | Diferença |
|-------|---------|-----------|-----------|
| Dinheiro | R$ 2.500 | R$ 2.480 | -R$ 20,00 |
| Sangrias | R$ 1.500 | - | - |
| Suprimentos | R$ 200 | - | - |
| **Saldo Dinheiro** | **R$ 1.200** | **R$ 1.180** | **-R$ 20,00** |

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| Valor em Caixa | MONEY | Quanto tem no caixa |
| Observações | TEXTAREA | Justificativa de diferença |

---

## 2.5 Programa de Indicações

### Tela: Indicadores
**Rota:** `/indicacoes/indicadores`

| Filtro | Descrição |
|--------|-----------|
| Período | Data das indicações |
| Status | Ativo, Inativo |
| Tipo | Cliente, Parceiro Externo |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Código | ID do indicador |
| Nome | Nome do indicador |
| Tipo | Cliente ou Parceiro |
| Indicações | Quantidade de indicações |
| Créditos Gerados | Valor total gerado |
| Status | Ativo/Inativo |

---

### Tela: Minhas Indicações (Área do Cliente)
**Rota:** `/minha-conta/indicacoes`

**Cards:**
| Card | Valor |
|------|-------|
| Meu Link de Indicação | https://planac.com.br/i/CODIGO |
| Pessoas Indicadas | Quantidade |
| Créditos Gerados | Valor total |
| Crédito Disponível | Saldo atual |

**Lista de Indicados:**
| Coluna | Descrição |
|--------|-----------|
| Nome | Quem foi indicado |
| Data Cadastro | Quando se cadastrou |
| Primeira Compra | Data da primeira compra |
| Crédito Gerado | Valor creditado |
| Status | Pendente, Creditado |

---

## 2.6 Devolução de Venda

### Tela: Nova Devolução
**Rota:** `/devolucoes/novo`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Venda Original | AUTOCOMPLETE | * | Busca vendas do cliente |
| Cliente | TEXT | - | Preenchido automaticamente |
| Data | DATE | * | Data da devolução |
| Motivo | SELECT | * | Defeito, Arrependimento, Erro, Outro |
| Descrição | TEXTAREA | * | Detalhes do motivo |

**Itens a Devolver:**
| Coluna | Descrição |
|--------|-----------|
| Produto | Nome |
| Qtd na Venda | Quantidade original |
| Já Devolvido | Se houve devolução anterior |
| Qtd a Devolver | Quantidade agora |
| Valor Unit. | Preço na venda |
| Subtotal | Valor a devolver |

**Tratamento Financeiro:**
| Opção | Descrição |
|-------|-----------|
| Estornar Pagamento | Devolver dinheiro ao cliente |
| Gerar Crédito | Criar crédito na carteira |
| Abater de Título | Se ainda tem título em aberto |

**Botões:**
- Salvar Rascunho
- Enviar para Aprovação
- Cancelar

---

## 2.7 Troca de Venda

### Tela: Nova Troca
**Rota:** `/trocas/novo`

**Seção 1: Produto Devolvido**
(Igual devolução - seleciona venda e itens)

**Seção 2: Produto Novo**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| Produto | AUTOCOMPLETE | Busca produtos |
| Quantidade | NUMBER | Quantidade |
| Preço | MONEY | Preço de venda |
| Subtotal | MONEY | Calculado |

**Diferença:**
| Campo | Valor |
|-------|-------|
| Valor Devolvido | R$ XXX |
| Valor Novo | R$ YYY |
| Diferença | R$ ZZZ (Cliente paga / Gera crédito) |

---

## 2.8 Consignação

### Tela: Lista de Consignações
**Rota:** `/consignacoes`

| Filtro | Descrição |
|--------|-----------|
| Status | Aberta, Acertada, Vencida |
| Cliente | Busca cliente |
| Período | Data de envio |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Número | Número da consignação |
| Data Envio | Quando foi enviado |
| Cliente | Depositário |
| Valor | Valor total |
| Prazo | Data limite |
| Status | Badge |
| Ações | Menu |

---

### Tela: Nova Consignação
**Rota:** `/consignacoes/novo`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Cliente | AUTOCOMPLETE | * | Cliente depositário |
| Data Envio | DATE | * | Data de hoje |
| Prazo Acerto | DATE | * | Data limite |
| Observações | TEXTAREA | - | - |

**Itens:**
| Coluna | Descrição |
|--------|-----------|
| Produto | Busca produto |
| Quantidade | Qtd enviada |
| Preço | Preço de venda se vendido |
| Subtotal | Valor total |

---

### Tela: Acerto de Consignação
**Rota:** `/consignacoes/:id/acerto`

| Coluna | Descrição |
|--------|-----------|
| Produto | Nome |
| Enviado | Qtd original |
| Vendido | Qtd vendida pelo cliente |
| Devolvido | Qtd devolvida |
| Diferença | Divergência |

**Totais:**
| Campo | Valor |
|-------|-------|
| Total Vendido | Gera NF de venda |
| Total Devolvido | Gera NF de retorno |
| A Receber | Valor do cliente |

---

## 2.9 Garantia de Produtos

### Tela: Chamados de Garantia
**Rota:** `/garantias`

| Filtro | Descrição |
|--------|-----------|
| Status | Aberto, Em Análise, Aprovado, Reprovado, Resolvido |
| Período | Data de abertura |
| Cliente | Busca |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Número | Número do chamado |
| Data | Abertura |
| Cliente | Nome |
| Produto | Produto em garantia |
| NF Original | Nota fiscal da compra |
| Status | Badge |
| Prazo | Dias para resposta |

---

### Tela: Novo Chamado de Garantia
**Rota:** `/garantias/novo`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Cliente | AUTOCOMPLETE | * | - |
| Nota Fiscal | AUTOCOMPLETE | * | NFs do cliente |
| Produto | SELECT | * | Produtos da NF |
| Número de Série | TEXT | - | Se aplicável |
| Defeito Relatado | TEXTAREA | * | Descrição do problema |
| Fotos | IMAGE | - | Até 5 fotos |

---

### Tela: Análise de Garantia
**Rota:** `/garantias/:id/analise`

**Dados do Chamado:** (somente leitura)

**Campos de Análise:**
| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Laudo Técnico | TEXTAREA | * | Análise do defeito |
| Parecer | SELECT | * | Aprovado, Reprovado |
| Motivo Reprovação | TEXTAREA | ** | Se reprovado |
| Resolução | SELECT | ** | Reparo, Troca, Devolução |
| Encaminhar Fabricante | CHECKBOX | - | Se precisa enviar para fabricante |

---

## 2.10 Gamificação

### Tela: Metas
**Rota:** `/gamificacao/metas`

**Painel do Vendedor:**

| Card | Descrição |
|------|-----------|
| Meta do Mês | R$ 50.000 |
| Realizado | R$ 35.000 (70%) |
| Faltam | R$ 15.000 |
| Dias Restantes | 10 dias |

**Barra de Progresso Visual**

**Metas Detalhadas:**
| Meta | Objetivo | Realizado | % | Pontos |
|------|----------|-----------|---|--------|
| Volume de Vendas | R$ 50.000 | R$ 35.000 | 70% | 700 |
| Novos Clientes | 10 | 7 | 70% | 350 |
| Ticket Médio | R$ 800 | R$ 750 | 94% | 470 |
| Mix de Produtos | 5 categorias | 4 | 80% | 400 |

---

### Tela: Ranking
**Rota:** `/gamificacao/ranking`

| Posição | Vendedor | Pontos | Vendas | Badge |
|---------|----------|--------|--------|-------|
| 🥇 1º | João Silva | 2.500 | R$ 80.000 | ⭐⭐⭐ |
| 🥈 2º | Maria Santos | 2.200 | R$ 72.000 | ⭐⭐ |
| 🥉 3º | Pedro Lima | 1.900 | R$ 65.000 | ⭐⭐ |
| 4º | Ana Costa | 1.700 | R$ 58.000 | ⭐ |
| 5º | Carlos Souza | 1.500 | R$ 52.000 | ⭐ |

**Filtros:**
- Período: Dia, Semana, Mês, Ano
- Filial: Todas ou específica
- Equipe: Todas ou específica

---

