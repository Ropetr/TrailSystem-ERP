# 📋 Regras de Negócio - Módulo Configurações

## CFG-01: Configurações por Empresa

**Descrição:** Cada empresa (tenant) possui suas próprias configurações isoladas.

**Regras:**
- Configurações são vinculadas ao `empresa_id`
- Existe um conjunto de valores padrão (seed) para novas empresas
- Alterações em uma empresa não afetam outras

---

## CFG-02: Bloqueio Automático de Clientes

**Descrição:** Sistema bloqueia automaticamente clientes inadimplentes.

**Regras:**
- Parâmetro `bloqueio_dias_atraso`: Default **2 dias**
- Job executa diariamente às 00:00 (BRT)
- Cliente com qualquer título vencido há X dias é bloqueado
- Bloqueio impede novas vendas a prazo
- Notifica vendedor responsável
- Notifica cliente via WhatsApp (se configurado)

**Quem pode desbloquear:**
- Parâmetro `bloqueio_quem_desbloqueia`: Default **gerente**
- Opções: `qualquer`, `gerente`, `admin`
- Requer justificativa obrigatória
- Registra log de desbloqueio

---

## CFG-03: Limite de Crédito

**Descrição:** Controle de crédito para vendas a prazo.

**Regras:**
- Parâmetro `credito_apenas_pj`: Default **true**
- PJ: Pode ter limite de crédito definido
- PF: Sempre à vista ou aprovação gerencial
- Parâmetro `limite_padrao_pj`: Default **0** (sem limite inicial)

**Quando excede limite:**
- Parâmetro `acao_excede_limite`: Default **bloquear**
- Opções: `bloquear`, `aprovar`, `alertar`
- Se `aprovar`: Gerente deve liberar a venda

---

## CFG-04: Programa de Indicação (Cashback)

**Descrição:** Parceiros de negócio recebem cashback por indicações.

**Regras:**
- Parâmetro `cashback_ativo`: Default **true**
- Parâmetro `cashback_percentual`: Default **2%**
- Calcula sobre valor líquido da venda
- Parâmetro `cashback_carencia`: Default **30 dias**
- Só credita após pagamento confirmado

---

## CFG-05: Descontos

**Descrição:** Limites de desconto por perfil.

**Regras:**
- Parâmetro `desconto_max_vendedor`: Default **15%**
- Parâmetro `desconto_sem_aprovacao`: Default **10%**
- Acima do limite sem aprovação: Requer gerente
- Acima do máximo: Bloqueado no sistema

---

## CFG-06: Validade de Orçamentos

**Descrição:** Prazo padrão de validade para orçamentos.

**Regras:**
- Parâmetro `validade_orcamento`: Default **15 dias**
- Após vencimento: Orçamento fica com status "Vencido"
- Pode ser convertido em venda mesmo vencido (confirmar preços)

---

## CFG-07: Ambiente Fiscal

**Descrição:** Define se NF-e é emitida em homologação ou produção.

**Regras:**
- Parâmetro `ambiente_fiscal`: Default **homologacao**
- Homologação: NF-e não tem validade fiscal
- Produção: NF-e válida legalmente
- Mudança requer confirmação do admin
- Certificado digital deve ser válido

---

## CFG-08: Emissão Automática de NF-e

**Descrição:** Automatiza emissão de documentos fiscais.

**Regras:**
- Parâmetro `auto_emitir_nfe`: Default **true**
- Ao faturar venda: Sistema emite NF-e automaticamente
- Se erro: Venda fica pendente de faturamento
- Parâmetro `auto_enviar_email`: Default **true**
- Parâmetro `auto_enviar_whatsapp`: Default **true**

---

## CFG-09: IBPT - Lei da Transparência

**Descrição:** Cálculo automático de tributos no cupom/NF.

**Regras:**
- Parâmetro `ibpt_ativo`: Default **true**
- Parâmetro `ibpt_uf`: UF para cálculo (ex: PR)
- Tabela atualizada automaticamente (job diário)
- Valor total de tributos exibido na NF-e (vTotTrib)

---

## CFG-10: Régua de Cobrança

**Descrição:** Automação de notificações de cobrança.

**Regras:**
- Parâmetro `regua_cobranca_ativa`: Default **true**
- Etapas configuráveis:
  - -3 dias: Lembrete de vencimento
  - 0 dias: Vence hoje
  - +1 dia: Venceu ontem
  - +3 dias: Cobrança
  - +7 dias: Cobrança urgente
  - +15 dias: Aviso de negativação
  - +30 dias: Negativar SPC/Serasa

---

## CFG-11: Política de Senhas

**Descrição:** Requisitos de segurança para senhas.

**Regras:**
- Parâmetro `senha_minimo`: Default **8 caracteres**
- Parâmetro `senha_maiuscula`: Default **true**
- Parâmetro `senha_minuscula`: Default **true**
- Parâmetro `senha_numero`: Default **true**
- Parâmetro `senha_especial`: Default **false**
- Parâmetro `senha_expira_dias`: Default **90** (0 = nunca)
- Parâmetro `senha_historico`: Default **5** (não repetir)

---

## CFG-12: Sessão e Tentativas

**Descrição:** Controle de acesso e sessões.

**Regras:**
- Parâmetro `sessao_timeout`: Default **30 minutos**
- Parâmetro `sessao_max_simultaneas`: Default **3**
- Parâmetro `tentativas_login`: Default **5**
- Parâmetro `bloqueio_login_minutos`: Default **15**
- Após X tentativas: Conta bloqueada por Y minutos

---

## CFG-13: Auditoria

**Descrição:** Registro de ações para compliance.

**Regras:**
- Parâmetro `auditoria_ativa`: Default **true**
- Registra: Login, Logout, CRUD de entidades
- Registra: Alterações em dados sensíveis
- Parâmetro `auditoria_retencao_dias`: Default **365**
- Logs não podem ser alterados ou excluídos (append-only)

---

## CFG-14: Horário de Envio WhatsApp

**Descrição:** Respeitar horário comercial para mensagens.

**Regras:**
- Parâmetro `whatsapp_hora_inicio`: Default **08:00**
- Parâmetro `whatsapp_hora_fim`: Default **18:00**
- Fora do horário: Mensagem agendada para próximo dia útil
- Parâmetro `whatsapp_fim_semana`: Default **false**
- Parâmetro `whatsapp_feriados`: Default **false**

---

## CFG-15: Permissões de Configuração

**Descrição:** Quem pode alterar configurações.

**Regras:**
| Categoria | Permissão Mínima |
|-----------|------------------|
| Empresa | Admin |
| Comercial | Gerente |
| Fiscal | Admin |
| Financeiro | Financeiro + Gerente |
| Estoque | Gerente |
| E-mail | Admin |
| WhatsApp | Admin |
| Integrações | Admin |
| Segurança | Admin |
| Sistema | Admin |

---

**Última atualização:** 26/12/2025
