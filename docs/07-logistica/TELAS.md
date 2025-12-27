# Especificação de Telas - Módulo Logística/Expedição

Este documento contém as especificações de telas do módulo de logística.

# PARTE 6 - EXPEDIÇÃO

## 6.1 Separação de Pedidos

### Tela: Pedidos para Separar
**Rota:** `/expedicao/separacao`

| Filtro | Descrição |
|--------|-----------|
| Prioridade | Alta, Normal, Baixa |
| Data Entrega | Previsão |
| Status | Aguardando, Em Separação, Separado |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Pedido | Número |
| Cliente | Nome |
| Itens | Quantidade de produtos |
| Volumes | Quantidade de volumes |
| Previsão | Data de entrega |
| Prioridade | Badge |
| Status | Badge |
| Separador | Quem está separando |

**Ações:**
- Iniciar Separação
- Imprimir Picking List
- Reagendar

---

### Tela: Separação de Pedido
**Rota:** `/expedicao/separacao/:id`

**Picking List Digital:**

| Coluna | Descrição |
|--------|-----------|
| Localização | Endereço no armazém |
| Produto | Nome |
| Quantidade | Qtd a separar |
| Separado | Checkbox ou quantidade |
| Conferência | Código de barras |

**Workflow:**
1. Escaneia código de barras do produto
2. Sistema confirma produto correto
3. Informa quantidade separada
4. Próximo item

**Ações ao Finalizar:**
- Gerar Etiquetas
- Embalar
- Disponibilizar para Entrega

---

## 6.2 Entregas

### Tela: Entregas do Dia
**Rota:** `/expedicao/entregas`

| Filtro | Descrição |
|--------|-----------|
| Data | Data da entrega |
| Motorista | Quem vai entregar |
| Rota | Região/rota |
| Status | Pendente, Em Rota, Entregue, Problema |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Pedido | Número |
| Cliente | Nome |
| Endereço | Local de entrega |
| Cidade | Cidade/Bairro |
| Volumes | Quantidade |
| Valor | Valor da entrega |
| Horário | Previsão |
| Status | Badge |
| Motorista | Responsável |

**Mapa:** Visualização dos pontos de entrega no mapa

---

### Tela: Roteirização
**Rota:** `/expedicao/roteirizacao`

**Entregas a Roteirizar:**
Lista de entregas pendentes de agendamento

**Motoristas Disponíveis:**
Lista de motoristas e veículos

**Ação:** Arrastar entregas para motoristas

**Otimização:**
- Botão "Otimizar Rota" (ordena por proximidade)
- Visualização no mapa

---

### Tela: App do Motorista (Mobile)
**Rota:** `/app/motorista`

**Tela Principal:**
| Elemento | Descrição |
|----------|-----------|
| Entregas do Dia | Lista de entregas |
| Próxima Entrega | Destacada |
| Navegação | Botão "Ir" (abre Maps) |
| Status | Online/Offline |

**Por Entrega:**
| Ação | Descrição |
|------|-----------|
| Check-in | Registra chegada (GPS) |
| Entregar | Confirma entrega |
| Foto | Tira foto do comprovante |
| Assinatura | Coleta assinatura digital |
| Ocorrência | Registra problema |

**Tipos de Ocorrência:**
- Cliente ausente
- Endereço não encontrado
- Recusa de recebimento
- Avaria
- Entrega parcial
- Outros

---

## 6.3 Rastreamento

### Tela: Rastreamento em Tempo Real
**Rota:** `/expedicao/rastreamento`

**Mapa com:**
- Posição dos motoristas (GPS)
- Entregas pendentes (pins)
- Entregas realizadas (pins verdes)
- Rotas planejadas

**Painel Lateral:**
| Motorista | Status | Entregas | Última Posição |
|-----------|--------|----------|----------------|
| João | Em rota | 5/12 | Av. Brasil, 1234 |
| Pedro | Entregando | 3/8 | Rua das Flores, 56 |
| Maria | Retornando | 10/10 | BR-376, km 45 |

---

