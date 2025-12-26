# ⚙️ Módulo 15: Configurações

> Base de configurações globais do sistema

## Visão Geral

O módulo de Configurações centraliza todos os parâmetros que afetam o comportamento dos demais módulos. É a **BASE** de todo o sistema.

## Por que é crítico?

- Parâmetros como "dias para bloqueio" devem ser configuráveis, não hardcoded
- Integrações precisam de credenciais armazenadas
- Cada empresa/filial pode ter configurações diferentes
- Facilita manutenção e personalização

## Estrutura de Abas

| # | Aba | Descrição | Prioridade |
|---|-----|-----------|------------|
| 1 | **Empresa** | Dados cadastrais, logo, regional | 🔴 Alta |
| 2 | **Comercial** | Bloqueio, crédito, descontos, cashback | 🔴 Alta |
| 3 | **Fiscal** | Certificado, séries, IBPT, ambiente | 🔴 Alta |
| 4 | **Financeiro** | Contas, boletos, régua cobrança | 🔴 Alta |
| 5 | **Estoque** | Controle, alertas, inventário | 🟡 Média |
| 6 | **E-mail** | SMTP, templates | 🟡 Média |
| 7 | **WhatsApp** | API Brasil, templates, horários | 🟡 Média |
| 8 | **Integrações** | Nuvem Fiscal, CNPJá, TecnoSpeed | 🔴 Alta |
| 9 | **Segurança** | Senhas, sessão, 2FA, auditoria | 🟡 Média |
| 10 | **Sistema** | Jobs, backup, logs, manutenção | 🟢 Baixa |

## Funcionalidades Principais

### Aba 1: Empresa
- Dados cadastrais (CNPJ, Razão Social, Endereço)
- Upload de logo (para DANFE e relatórios)
- Configurações regionais (fuso, formato data, moeda)

### Aba 2: Comercial
- **Bloqueio automático:** Dias de atraso (default: 2)
- **Quem desbloqueia:** Apenas Gerentes
- **Limite de crédito:** Apenas PJ
- **Descontos:** Máximo permitido por vendedor
- **Cashback:** Programa de indicação (2%)

### Aba 3: Fiscal
- Ambiente (Homologação/Produção)
- Regime tributário
- Certificado digital A1
- Séries e numeração (NF-e, NFC-e, NFS-e)
- IBPT (Lei da Transparência)

### Aba 4: Financeiro
- Contas bancárias
- Configuração de boletos (multa, juros)
- Régua de cobrança automática
- Formas e condições de pagamento

### Aba 5: Estoque
- Controle de estoque por produto
- Alertas de estoque mínimo
- Método de custeio (Médio, PEPS)
- Configurações de inventário

### Aba 6: E-mail
- Configuração SMTP
- Templates de e-mail (NF-e, Boleto, Cobrança)

### Aba 7: WhatsApp
- Integração API Brasil
- Templates de mensagem
- Horários permitidos para envio

### Aba 8: Integrações
- Nuvem Fiscal (documentos fiscais)
- CNPJá (consulta CNPJ)
- CPF.CNPJ (validação)
- TecnoSpeed (boletos/PIX)
- ViaCEP (consulta CEP)

### Aba 9: Segurança
- Política de senhas
- Timeout de sessão
- Tentativas de login
- 2FA (autenticação dois fatores)
- Auditoria

### Aba 10: Sistema
- Jobs agendados
- Backup automático
- Logs do sistema
- Manutenção

## Arquivos do Módulo

- [REGRAS.md](./REGRAS.md) - Regras de negócio
- [API.md](./API.md) - Endpoints da API
- [MODELO_DADOS.md](./MODELO_DADOS.md) - Estrutura do banco

## Status

| Item | Status |
|------|--------|
| Especificação | ✅ Completa |
| Banco de Dados | ⏳ Pendente |
| API Backend | ⏳ Pendente |
| Frontend | ⏳ Pendente |
| Testes | ⏳ Pendente |

---

**Última atualização:** 26/12/2025
