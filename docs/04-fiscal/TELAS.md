# Especificação de Telas - Módulo Fiscal

Este documento contém as especificações de telas do módulo fiscal.

# PARTE 5 - FISCAL

## 5.1 Configurações Fiscais

### Tela: Regras Fiscais
**Rota:** `/fiscal/regras`

| Filtro | Descrição |
|--------|-----------|
| UF Origem | Estado de origem |
| UF Destino | Estado de destino |
| NCM | Classificação fiscal |
| Operação | Venda, Compra, Devolução |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| NCM | Código |
| UF Origem | Estado |
| UF Destino | Estado |
| CFOP | Código fiscal |
| CST ICMS | Situação tributária |
| Alíq. ICMS | Percentual |
| Red. BC | Redução de base |
| MVA | Margem de valor agregado |
| CST PIS | Situação tributária |
| CST COFINS | Situação tributária |
| Alíq. IPI | Se aplicável |

---

### Tela: Cadastro de Regra Fiscal
**Rota:** `/fiscal/regras/novo`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Descrição | TEXT | * | Nome da regra |
| NCM | TEXT | * | Código NCM |
| UF Origem | SELECT | * | Estado |
| UF Destino | SELECT | * | Estado (ou "Todos") |
| Operação | SELECT | * | Venda, Compra, Devolução, etc. |
| Tipo Cliente | SELECT | - | Consumidor, Contribuinte, etc. |

**ICMS:**
| Campo | Descrição |
|-------|-----------|
| CST | Código de situação |
| Alíquota | Percentual |
| Redução de Base | Percentual |
| Diferimento | Se aplicável |

**ICMS ST:**
| Campo | Descrição |
|-------|-----------|
| Tem ST | Checkbox |
| MVA | Margem de valor agregado |
| Alíquota Interna | Alíquota do estado destino |

**IPI:**
| Campo | Descrição |
|-------|-----------|
| CST | Código |
| Alíquota | Percentual |

**PIS/COFINS:**
| Campo | Descrição |
|-------|-----------|
| CST PIS | Código |
| Alíquota PIS | Percentual |
| CST COFINS | Código |
| Alíquota COFINS | Percentual |

---

## 5.2 Documentos Fiscais

### Tela: NF-e Emitidas
**Rota:** `/fiscal/nfe`

| Filtro | Descrição |
|--------|-----------|
| Período | Data de emissão |
| Status | Autorizada, Cancelada, Inutilizada, Rejeitada, Pendente |
| Cliente | Busca |
| Série | Série da NF |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Número | Número da NF |
| Série | Série |
| Data | Emissão |
| Cliente | Destinatário |
| Valor | Total da NF |
| Status | Badge |
| Ações | Visualizar, Baixar XML, Baixar PDF, Cancelar, Carta Correção |

---

### Tela: Emissão de NF-e
**Rota:** `/fiscal/nfe/emitir`

**Normalmente acessada via Venda ou Devolução**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Natureza Operação | SELECT | Venda, Devolução, Remessa, etc. |
| Tipo | SELECT | Saída (1) ou Entrada (0) |
| Finalidade | SELECT | Normal, Complementar, Ajuste, Devolução |
| Destinatário | AUTOCOMPLETE | Cliente/Fornecedor |
| Endereço Entrega | SELECT | Se diferente |

**Itens:**
| Coluna | Descrição |
|--------|-----------|
| Produto | Descrição |
| NCM | Código |
| CFOP | Operação |
| Quantidade | Qtd |
| Valor Unit. | Preço |
| Subtotal | Calculado |
| ICMS | Valores |
| IPI | Valores |
| PIS/COFINS | Valores |

**Totais:**
| Campo | Valor |
|-------|-------|
| Base ICMS | R$ |
| Valor ICMS | R$ |
| Base ST | R$ |
| Valor ST | R$ |
| Valor IPI | R$ |
| Total Produtos | R$ |
| Total NF | R$ |

**Transporte:**
| Campo | Descrição |
|-------|-----------|
| Modalidade | CIF, FOB, etc. |
| Transportadora | Se houver |
| Volumes | Quantidade, espécie, peso |

**Ações:**
- Validar (verifica regras)
- Pré-visualizar (DANFE)
- Transmitir (envia para SEFAZ)

---

### Modal: Carta de Correção
**Abre quando:** Clica "Carta de Correção" na NF

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| NF-e | TEXT | - | Número (somente leitura) |
| Chave | TEXT | - | Chave (somente leitura) |
| Correção | TEXTAREA | * | Texto da correção (15-1000 caracteres) |
| Sequência | NUMBER | - | Número da CC-e |

**Aviso:** Não pode corrigir valores, quantidades, CFOP, etc.

---

### Modal: Cancelamento de NF-e
**Abre quando:** Clica "Cancelar" na NF

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Justificativa | TEXTAREA | * | Motivo (15-255 caracteres) |

**Validações:**
- Prazo máximo: 24 horas (ou conforme UF)
- Não pode ter CT-e vinculado
- Não pode ter manifestação de recusa

---

## 5.3 NF-e Recebidas

### Tela: NF-e de Entrada
**Rota:** `/fiscal/nfe-entrada`

| Filtro | Descrição |
|--------|-----------|
| Período | Data de emissão |
| Fornecedor | Busca |
| Manifestação | Pendente, Confirmada, Desconhecida |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Chave | Chave de acesso |
| Número | Número da NF |
| Emitente | Fornecedor |
| Data | Emissão |
| Valor | Total |
| Manifestação | Status |
| Vinculação | Pedido vinculado |
| Ações | Manifestar, Baixar XML, Vincular |

**Ações em Lote:**
- Manifestar Ciência
- Manifestar Confirmação
- Baixar XMLs

---

### Tela: Manifestação do Destinatário
**Rota:** `/fiscal/manifestacao`

**Por NF-e:**
| Opção | Descrição |
|-------|-----------|
| Ciência da Operação | Tomou conhecimento |
| Confirmação da Operação | Confirma recebimento |
| Operação Não Realizada | Não houve a operação |
| Desconhecimento da Operação | Desconhece a NF |

---

## 5.4 Contabilidade

### Tela: Plano de Contas
**Rota:** `/contabilidade/plano-contas`

**Estrutura em Árvore:**
```
1 - ATIVO
  1.1 - Ativo Circulante
    1.1.1 - Caixa e Equivalentes
      1.1.1.01 - Caixa Geral
      1.1.1.02 - Banco Conta Movimento
    1.1.2 - Contas a Receber
      1.1.2.01 - Clientes
      1.1.2.02 - (-) PDD
  1.2 - Ativo Não Circulante
    1.2.1 - Imobilizado
2 - PASSIVO
  2.1 - Passivo Circulante
    2.1.1 - Fornecedores
    2.1.2 - Impostos a Recolher
3 - PATRIMÔNIO LÍQUIDO
4 - RECEITAS
5 - DESPESAS
```

**Ações:**
- Adicionar Conta
- Editar
- Desativar
- Importar Plano Padrão

---

### Tela: Lançamentos Contábeis
**Rota:** `/contabilidade/lancamentos`

| Filtro | Descrição |
|--------|-----------|
| Período | Data do lançamento |
| Conta | Busca conta |
| Origem | Manual, Automático |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Data | Data do lançamento |
| Lote | Número do lote |
| Conta Débito | Conta debitada |
| Conta Crédito | Conta creditada |
| Histórico | Descrição |
| Valor | Valor do lançamento |
| Origem | Manual ou Automático |

---

### Tela: Novo Lançamento Contábil
**Rota:** `/contabilidade/lancamentos/novo`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Data | DATE | * | Data do lançamento |
| Conta Débito | AUTOCOMPLETE | * | Conta a debitar |
| Conta Crédito | AUTOCOMPLETE | * | Conta a creditar |
| Valor | MONEY | * | Valor |
| Histórico | TEXT | * | Descrição |
| Documento | TEXT | - | Referência |

**Para lançamentos múltiplos:**
- Permite adicionar várias linhas
- Soma de débitos = Soma de créditos

---

## 5.5 Patrimônio

### Tela: Lista de Bens Patrimoniais
**Rota:** `/patrimonio`

| Filtro | Descrição |
|--------|-----------|
| Categoria | Veículos, Equipamentos, Móveis, TI, Imóveis |
| Localização | Filial/Setor |
| Status | Ativo, Baixado, Em Manutenção |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Plaqueta | Número de patrimônio |
| Descrição | Nome do bem |
| Categoria | Tipo |
| Data Aquisição | Quando comprou |
| Valor Aquisição | Quanto custou |
| Depreciação Acum. | Total depreciado |
| Valor Atual | Valor residual |
| Localização | Onde está |
| Responsável | Quem cuida |
| Status | Badge |

---

### Tela: Cadastro de Bem Patrimonial
**Rota:** `/patrimonio/novo`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Plaqueta | TEXT | * | Número de identificação |
| Descrição | TEXT | * | Nome do bem |
| Categoria | SELECT | * | Tipo do bem |
| Fornecedor | AUTOCOMPLETE | - | De quem comprou |
| Nota Fiscal | TEXT | - | NF de aquisição |
| Data Aquisição | DATE | * | Quando comprou |
| Valor Aquisição | MONEY | * | Quanto custou |
| Vida Útil (meses) | NUMBER | * | Para depreciação |
| Taxa Depreciação | NUMBER | - | % ao mês |
| Valor Residual | MONEY | - | Valor ao final |
| Localização | SELECT | * | Filial/Setor |
| Responsável | AUTOCOMPLETE | - | Quem cuida |
| Número de Série | TEXT | - | Se equipamento |
| Observações | TEXTAREA | - | - |
| Foto | IMAGE | - | Imagem do bem |

---

### Tela: Inventário de Patrimônio
**Rota:** `/patrimonio/inventario`

**Similar ao inventário de estoque, mas para bens:**

| Coluna | Descrição |
|--------|-----------|
| Plaqueta | Número |
| Descrição | Nome |
| Localização Esperada | Onde deveria estar |
| Localização Encontrada | Onde está |
| Status | Encontrado, Não Encontrado, Em Local Errado |
| Observações | Notas |

---

