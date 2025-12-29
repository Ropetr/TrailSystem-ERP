# Especificação de Telas - Módulo E-commerce

Este documento contém as especificações de telas do módulo e-commerce.

# PARTE 7 - E-COMMERCE

## 7.1 Configurações da Loja

### Tela: Configurações Gerais
**Rota:** `/ecommerce/config`

#### Dados da Loja

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome da Loja | TEXT | Nome exibido |
| Domínio | TEXT | URL da loja |
| Logo | IMAGE | Logo principal |
| Favicon | IMAGE | Ícone da aba |
| Cores Primárias | COLOR | Esquema de cores |
| Descrição SEO | TEXTAREA | Meta description |
| Google Analytics | TEXT | ID de rastreamento |
| Meta Pixel | TEXT | ID do pixel |

#### Políticas

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Política de Privacidade | RICHTEXT | Texto completo |
| Termos de Uso | RICHTEXT | Texto completo |
| Política de Troca | RICHTEXT | Texto completo |
| Política de Frete | RICHTEXT | Texto completo |

---

### Tela: Catálogo Online
**Rota:** `/ecommerce/catalogo`

| Coluna | Descrição |
|--------|-----------|
| Produto | Nome |
| Categoria | Categoria online |
| Visível | Sim/Não |
| Destaque | Sim/Não |
| Estoque | Quantidade |
| Preço | Preço online |
| Última Atualização | Data |

**Ações:**
- Sincronizar com ERP
- Publicar/Despublicar
- Editar Descrição Online
- Adicionar Fotos

---

## 7.2 Pedidos Online

### Tela: Pedidos do E-commerce
**Rota:** `/ecommerce/pedidos`

| Filtro | Descrição |
|--------|-----------|
| Período | Data do pedido |
| Status | Novo, Pago, Separando, Enviado, Entregue, Cancelado |
| Tipo | B2B, B2C |
| Pagamento | Status do pagamento |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Número | Número do pedido |
| Data | Data/hora |
| Cliente | Nome |
| Tipo | B2B ou B2C |
| Itens | Quantidade |
| Total | Valor |
| Pagamento | Status |
| Status | Status do pedido |
| Ações | Menu |

**Workflow Visual:**
```
[Novo] → [Pagamento Confirmado] → [Separando] → [Enviado] → [Entregue]
```

---

## 7.3 Área do Cliente (Minha Conta)

### Tela: Meus Pedidos
**Rota:** `/minha-conta/pedidos`

| Coluna | Descrição |
|--------|-----------|
| Número | Número do pedido |
| Data | Data da compra |
| Itens | Quantidade |
| Total | Valor |
| Status | Status atual |
| Rastreamento | Link/código |
| Ações | Ver detalhes, 2ª via boleto, Download NF |

---

### Tela: Rastreamento de Entrega
**Rota:** `/minha-conta/pedidos/:id/rastreamento`

**Mapa:** Posição em tempo real do entregador

**Timeline:**
```
✅ Pedido Confirmado - 01/12 às 10:30
✅ Pagamento Aprovado - 01/12 às 10:35
✅ Em Separação - 01/12 às 14:00
✅ Enviado - 02/12 às 08:00
🔵 Em Rota - Previsão: 02/12 às 15:00
⚪ Entregue
```

**Notificações:**
- SMS/WhatsApp: "Seu pedido saiu para entrega"
- Push: "Faltam 10 minutos para a entrega"

---

### Tela: Meus Boletos
**Rota:** `/minha-conta/boletos`

| Coluna | Descrição |
|--------|-----------|
| Número | Número do título |
| Pedido | Pedido relacionado |
| Vencimento | Data |
| Valor | Valor a pagar |
| Status | Aberto, Vencido, Pago |
| Ações | Baixar PDF, Copiar código de barras |

---

### Tela: Minhas Notas Fiscais
**Rota:** `/minha-conta/notas-fiscais`

| Coluna | Descrição |
|--------|-----------|
| Número | Número da NF |
| Data | Data de emissão |
| Valor | Total da NF |
| Ações | Download PDF, Download XML |

---

### Tela: Meus Créditos
**Rota:** `/minha-conta/creditos`

**Card Saldo:**
| Campo | Valor |
|-------|-------|
| Créditos Disponíveis | R$ 350,00 |

**Extrato:**
| Data | Descrição | Entrada | Saída | Saldo |
|------|-----------|---------|-------|-------|
| 01/12 | Indicação - Maria | R$ 100 | - | R$ 350 |
| 28/11 | Uso no pedido #123 | - | R$ 50 | R$ 250 |
| 25/11 | Devolução - Pedido #100 | R$ 200 | - | R$ 300 |

---

### Tela: Minhas Indicações
**Rota:** `/minha-conta/indicacoes`

**Meu Link:**
```
https://planac.com.br/i/ABC123
```

**Botões:** Copiar | Compartilhar WhatsApp | Compartilhar E-mail

**Estatísticas:**
| Card | Valor |
|------|-------|
| Pessoas Indicadas | 5 |
| Compras Realizadas | 3 |
| Créditos Gerados | R$ 250 |
| Crédito Disponível | R$ 150 |

**Lista de Indicados:**
| Nome | Data Cadastro | Status | Crédito |
|------|---------------|--------|---------|
| Maria Silva | 01/11/2024 | Comprou | R$ 50 |
| João Santos | 15/11/2024 | Cadastrado | - |
| Ana Costa | 20/11/2024 | Comprou | R$ 100 |

---

## 7.4 Portal B2B

### Tela: Área do Vendedor
**Rota:** `/b2b/vendedor`

**Minha Carteira de Clientes:**
| Coluna | Descrição |
|--------|-----------|
| Cliente | Nome |
| Último Pedido | Data |
| Ticket Médio | Valor |
| Status | Ativo, Inativo |
| Ações | Ver pedidos, Novo pedido |

**Fazer Pedido pelo Cliente:**
- Seleciona cliente
- Monta carrinho
- Escolhe condição de pagamento
- Finaliza

**Minhas Comissões:**
| Período | Vendas | Comissão | Status |
|---------|--------|----------|--------|
| Dez/24 | R$ 50.000 | R$ 1.500 | A receber |
| Nov/24 | R$ 45.000 | R$ 1.350 | Pago |

---

### Tela: Aprovação de Cadastro B2B
**Rota:** `/ecommerce/aprovacoes`

**Cadastros Pendentes:**
| Coluna | Descrição |
|--------|-----------|
| Data | Quando cadastrou |
| Empresa | Razão Social |
| CNPJ | Documento |
| Cidade | Localização |
| Documentos | Anexos enviados |
| Ações | Aprovar, Solicitar Docs, Reprovar |

**Modal de Aprovação:**
| Campo | Descrição |
|-------|-----------|
| Vendedor | Vincular vendedor |
| Tabela de Preço | Qual tabela aplicar |
| Limite de Crédito | Valor inicial |
| Prazo de Pagamento | Condição |

---

## 7.5 Carrinho Abandonado

### Tela: Carrinhos Abandonados
**Rota:** `/ecommerce/carrinhos-abandonados`

| Coluna | Descrição |
|--------|-----------|
| Data | Quando abandonou |
| Cliente | Nome (se logado) |
| E-mail | Contato |
| Itens | Produtos no carrinho |
| Valor | Total |
| Última Ação | Quando acessou por último |
| Tentativas | E-mails enviados |

**Ações:**
- Enviar E-mail de Recuperação
- Oferecer Cupom
- Entrar em Contato

**Configurações:**
| Campo | Descrição |
|-------|-----------|
| Tempo para 1º e-mail | 2 horas |
| Tempo para 2º e-mail | 24 horas |
| Tempo para 3º e-mail | 72 horas |
| Cupom Automático | 5% de desconto |

---

