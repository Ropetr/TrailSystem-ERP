# Casos de Uso - Módulo Estoque

Este documento contém os casos de uso do módulo de estoque.

## 5. MÓDULO ESTOQUE

### 5.1 Movimentações

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| EST-01 | Dar Entrada Manual | Estoque | Registrar entrada sem NF |
| EST-02 | Dar Saída Manual | Estoque | Registrar saída sem venda |
| EST-03 | Transferir entre Filiais | Estoque | Mover produtos entre unidades |
| EST-04 | Reservar Estoque | Sistema | Reservar produtos para venda |
| EST-05 | Liberar Reserva | Sistema | Cancelar reserva de estoque |

### 5.2 Inventário

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| INV-01 | Criar Inventário | Estoque | Iniciar processo de inventário |
| INV-02 | Registrar Contagem | Operador | Informar quantidade contada |
| INV-03 | Registrar Recontagem | Supervisor | Segunda contagem em caso de divergência |
| INV-04 | Aprovar Ajuste | Gerente | Autorizar ajuste de estoque |
| INV-05 | Efetuar Ajuste | Sistema | Atualizar saldo do sistema |

### 5.3 Kits

| ID | Caso de Uso | Ator Principal | Descrição |
|----|-------------|----------------|-----------|
| KIT-01 | Montar Kit | Estoque | Criar kit a partir de componentes |
| KIT-02 | Desmontar Kit | Estoque | Desfazer kit em componentes |

---

