# 📜 Regras de Negócio - Módulo Cadastros

**Última atualização:** 26/12/2025

---

## 👥 CLIENTES (CAD-01 a CAD-10)

| ID | Regra | Descrição |
|----|-------|-----------|
| CAD-01 | Tipos | Cliente pode ser PF (CPF) ou PJ (CNPJ) |
| CAD-02 | Classificação | Categorias: Consumidor Final, Revenda, Construtor, Instalador |
| CAD-03 | Vendedor padrão | Cada cliente tem um vendedor responsável |
| CAD-04 | Indicador | Cliente pode ter sido indicado por outro cliente ou parceiro |
| CAD-05 | Múltiplos endereços | Tipos: Entrega, Cobrança, Correspondência. Um deve ser principal |
| CAD-06 | Múltiplos contatos | Tipos: Comprador, Financeiro, Dono. Um deve ser principal |
| CAD-07 | Limite de crédito | Valor máximo que pode comprar a prazo |
| CAD-08 | Tabela de preço | Cliente vinculado a uma tabela (Varejo, Atacado, etc.) |
| CAD-09 | Validação CNPJ | CNPJ validado via API Receita Federal (CPF.CNPJ ou CNPJá) |
| CAD-10 | Bloqueio automático | Cliente bloqueado após X dias de inadimplência |

---

## 🏭 FORNECEDORES (CAD-11 a CAD-15)

| ID | Regra | Descrição |
|----|-------|-----------|
| CAD-11 | Cadastro obrigatório | CNPJ obrigatório para fornecedores |
| CAD-12 | Múltiplos endereços | Endereço fiscal e de entrega podem ser diferentes |
| CAD-13 | Múltiplos contatos | Contatos: Comercial, Financeiro, Logística |
| CAD-14 | Prazo de entrega | Prazo médio de entrega em dias |
| CAD-15 | Score | Avaliação do fornecedor (1-5 estrelas) |

---

## 📦 PRODUTOS (CAD-16 a CAD-23)

| ID | Regra | Descrição |
|----|-------|-----------|
| CAD-16 | Tipo | Flag indica se é PRODUTO ou SERVIÇO |
| CAD-17 | Fiscal obrigatório | NCM, CEST e Origem são obrigatórios para produtos |
| CAD-18 | Código de barras | EAN/GTIN único por produto |
| CAD-19 | Unidade de medida | UN, M², KG, CX, etc. |
| CAD-20 | Conversão de unidades | Produto pode ter fator de conversão (1 CX = 100 UN) |
| CAD-21 | Múltiplas fotos | Até 10 fotos por produto |
| CAD-22 | Múltiplos fornecedores | Produto pode ser comprado de N fornecedores |
| CAD-23 | Produto inativo | Produto inativo não aparece em vendas |

---

## 🏢 EMPRESAS (CAD-24 a CAD-25)

| ID | Regra | Descrição |
|----|-------|-----------|
| CAD-24 | Tipo empresa | MATRIZ ou FILIAL |
| CAD-25 | Filial vinculada | Filial deve ter CNPJ da matriz vinculado |

---

## 🔄 VALIDAÇÕES GERAIS

| Validação | Descrição |
|-----------|-----------|
| CPF | Dígitos verificadores validados |
| CNPJ | Dígitos verificadores validados |
| Email | Formato válido |
| Telefone | Formato brasileiro (XX) XXXXX-XXXX |
| CEP | Busca automática via API |
| Duplicidade | Não permite CPF/CNPJ duplicado na mesma empresa |

---

## 🔐 PERMISSÕES SUGERIDAS

| Ação | Vendedor | Gerente | Admin |
|------|:--------:|:-------:|:-----:|
| Visualizar clientes | ✅ | ✅ | ✅ |
| Criar cliente | ✅ | ✅ | ✅ |
| Editar cliente | ❌ | ✅ | ✅ |
| Excluir cliente | ❌ | ❌ | ✅ |
| Alterar limite crédito | ❌ | ✅ | ✅ |
| Bloquear/Desbloquear | ❌ | ✅ | ✅ |
