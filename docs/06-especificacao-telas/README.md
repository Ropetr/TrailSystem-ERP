# 🖥️ Especificação de Telas - ERP PLANAC

Documentação completa das telas do sistema com campos, validações, máscaras e comportamentos.

**Status: ✅ Completo**

---

## Índice

| Parte | Módulo | Qtd Telas |
|-------|--------|-----------|
| [1. Core](#parte-1---core) | Empresas, Cadastros, Usuários | 15 |
| [2. Comercial](#parte-2---comercial) | CRM, Orçamentos, Vendas, PDV | 45 |
| [3. Compras](#parte-3---compras) | Cotações, Pedidos, Estoque | 30 |
| [4. Financeiro](#parte-4---financeiro) | Receber, Pagar, Fluxo, Bancos | 20 |
| [5. Fiscal](#parte-5---fiscal) | Tributário, Documentos, Contabilidade | 18 |
| [6. Expedição](#parte-6---expedição) | Separação, Entregas | 10 |
| [7. E-commerce](#parte-7---e-commerce) | Loja B2B/B2C, Área do Cliente | 25 |
| [8. RH](#parte-8---rh) | Colaboradores, Ponto, Folha | 20 |
| [9. Contratos](#parte-9---contratos) | Gestão de Contratos | 8 |
| [10. Configurações](#parte-10---configurações) | Parâmetros do Sistema | 12 |
| **TOTAL** | | **203** |

---

## Legenda

### Tipos de Campo
| Tipo | Descrição |
|------|-----------|
| `TEXT` | Texto livre |
| `NUMBER` | Numérico |
| `MONEY` | Monetário (R$) |
| `DATE` | Data (DD/MM/AAAA) |
| `DATETIME` | Data e hora |
| `SELECT` | Seleção de lista |
| `MULTISELECT` | Seleção múltipla |
| `CHECKBOX` | Sim/Não |
| `RADIO` | Opção única |
| `TEXTAREA` | Texto longo |
| `FILE` | Upload de arquivo |
| `IMAGE` | Upload de imagem |
| `PHONE` | Telefone |
| `EMAIL` | E-mail |
| `CPF` | CPF |
| `CNPJ` | CNPJ |
| `CEP` | CEP |
| `AUTOCOMPLETE` | Busca com sugestões |

### Obrigatoriedade
| Símbolo | Significado |
|---------|-------------|
| `*` | Obrigatório |
| `**` | Obrigatório condicional |
| `-` | Opcional |

---

# PARTE 1 - CORE

## 1.1 Gestão de Empresas

### Tela: Lista de Empresas
**Rota:** `/empresas`

| Elemento | Tipo | Descrição |
|----------|------|-----------|
| Busca | TEXT | Filtro por razão social, CNPJ ou fantasia |
| Tabela | GRID | Lista de empresas cadastradas |
| Botão Novo | BUTTON | Abre modal de cadastro |
| Ações | MENU | Editar, Ativar/Inativar, Excluir |

**Colunas da Tabela:**
| Coluna | Largura | Ordenável |
|--------|---------|-----------|
| CNPJ | 150px | Sim |
| Razão Social | 250px | Sim |
| Nome Fantasia | 200px | Sim |
| Cidade/UF | 150px | Sim |
| Status | 100px | Sim |
| Ações | 80px | Não |

---

### Tela: Cadastro de Empresa
**Rota:** `/empresas/novo` ou `/empresas/:id`

#### Aba: Dados Gerais

| Campo | Tipo | Obrig. | Máscara | Validação |
|-------|------|--------|---------|-----------|
| CNPJ | CNPJ | * | 99.999.999/9999-99 | Validar dígito verificador |
| Razão Social | TEXT | * | - | Min 3 caracteres |
| Nome Fantasia | TEXT | * | - | Min 3 caracteres |
| Inscrição Estadual | TEXT | ** | - | Obrigatório se contribuinte |
| Inscrição Municipal | TEXT | - | - | - |
| CNAE Principal | TEXT | * | 9999-9/99 | Validar formato |
| Data de Fundação | DATE | - | DD/MM/AAAA | Não pode ser futura |

#### Aba: Endereço

| Campo | Tipo | Obrig. | Máscara | Validação |
|-------|------|--------|---------|-----------|
| CEP | CEP | * | 99999-999 | Busca automática via API |
| Logradouro | TEXT | * | - | Preenchido via CEP |
| Número | TEXT | * | - | - |
| Complemento | TEXT | - | - | - |
| Bairro | TEXT | * | - | Preenchido via CEP |
| Cidade | TEXT | * | - | Preenchido via CEP |
| UF | SELECT | * | - | Lista de estados |

#### Aba: Contato

| Campo | Tipo | Obrig. | Máscara | Validação |
|-------|------|--------|---------|-----------|
| Telefone | PHONE | * | (99) 9999-9999 | - |
| Celular | PHONE | - | (99) 99999-9999 | - |
| E-mail | EMAIL | * | - | Formato válido |
| Site | TEXT | - | - | URL válida |

#### Aba: Fiscal

| Campo | Tipo | Obrig. | Opções |
|-------|------|--------|--------|
| Regime Tributário | SELECT | * | Simples Nacional, Lucro Presumido, Lucro Real |
| Tipo de Atividade | SELECT | * | Comércio, Indústria, Serviços |
| Contribuinte ICMS | CHECKBOX | * | - |
| Optante Simples | CHECKBOX | - | - |
| Série NF-e | NUMBER | * | Padrão: 1 |
| Série NFC-e | NUMBER | * | Padrão: 1 |
| Ambiente NF-e | SELECT | * | Produção, Homologação |
| Certificado Digital | FILE | * | Aceita .pfx ou .p12 |
| Senha Certificado | PASSWORD | * | - |
| Validade Certificado | DATE | - | Calculado automaticamente |

#### Aba: Logo

| Campo | Tipo | Obrig. | Validação |
|-------|------|--------|-----------|
| Logo Principal | IMAGE | - | PNG/JPG, máx 2MB, 500x500px |
| Logo para NF | IMAGE | - | PNG/JPG, máx 500KB |

**Botões:**
| Botão | Ação | Atalho |
|-------|------|--------|
| Salvar | Salva e fecha | Ctrl+S |
| Salvar e Continuar | Salva e permanece | Ctrl+Shift+S |
| Cancelar | Descarta alterações | Esc |
| Consultar CNPJ | Busca dados na Receita | - |

---

## 1.2 Cadastro de Clientes

### Tela: Lista de Clientes
**Rota:** `/clientes`

| Elemento | Tipo | Descrição |
|----------|------|-----------|
| Busca | TEXT | Filtro por nome, CPF/CNPJ, telefone |
| Filtro Tipo | SELECT | Todos, PF, PJ |
| Filtro Status | SELECT | Todos, Ativos, Inativos, Bloqueados |
| Filtro Vendedor | AUTOCOMPLETE | Filtrar por vendedor |
| Tabela | GRID | Lista de clientes |
| Botão Novo | BUTTON | Abre cadastro |
| Exportar | BUTTON | Exporta Excel/CSV |

**Colunas da Tabela:**
| Coluna | Largura | Descrição |
|--------|---------|-----------|
| Código | 80px | ID interno |
| CPF/CNPJ | 150px | Documento |
| Nome/Razão Social | 250px | Nome completo |
| Cidade/UF | 150px | Localização |
| Telefone | 130px | Telefone principal |
| Vendedor | 150px | Vendedor vinculado |
| Limite | 120px | Limite de crédito |
| Status | 100px | Ativo/Inativo/Bloqueado |
| Ações | 80px | Menu de ações |

---

### Tela: Cadastro de Cliente
**Rota:** `/clientes/novo` ou `/clientes/:id`

#### Aba: Dados Gerais

**Pessoa Física:**
| Campo | Tipo | Obrig. | Máscara | Validação |
|-------|------|--------|---------|-----------|
| Tipo Pessoa | RADIO | * | PF / PJ | - |
| CPF | CPF | * | 999.999.999-99 | Dígito verificador |
| Nome Completo | TEXT | * | - | Min 5 caracteres |
| RG | TEXT | - | - | - |
| Data Nascimento | DATE | - | DD/MM/AAAA | Idade > 18 anos |
| Sexo | SELECT | - | Masculino, Feminino, Outro |
| Estado Civil | SELECT | - | Solteiro, Casado, etc. |

**Pessoa Jurídica:**
| Campo | Tipo | Obrig. | Máscara | Validação |
|-------|------|--------|---------|-----------|
| Tipo Pessoa | RADIO | * | PF / PJ | - |
| CNPJ | CNPJ | * | 99.999.999/9999-99 | Dígito verificador |
| Razão Social | TEXT | * | - | Min 5 caracteres |
| Nome Fantasia | TEXT | - | - | - |
| Inscrição Estadual | TEXT | ** | - | Se contribuinte |
| Inscrição Municipal | TEXT | - | - | - |
| Data Fundação | DATE | - | DD/MM/AAAA | - |

**Campos Comuns:**
| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Tipo de Cliente | SELECT | * | Consumidor, Construtora, Instalador, Revendedor |
| Vendedor Padrão | AUTOCOMPLETE | - | Busca vendedores ativos |
| Quem Indicou | AUTOCOMPLETE | - | Busca clientes/parceiros |
| Tabela de Preço | SELECT | * | Varejo, Atacado, Especial |
| Observações | TEXTAREA | - | Notas internas |

#### Aba: Endereços

**Lista de Endereços (permite múltiplos):**
| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Tipo | SELECT | * | Principal, Entrega, Cobrança |
| CEP | CEP | * | Busca automática |
| Logradouro | TEXT | * | - |
| Número | TEXT | * | - |
| Complemento | TEXT | - | - |
| Bairro | TEXT | * | - |
| Cidade | TEXT | * | - |
| UF | SELECT | * | - |
| Referência | TEXT | - | Ponto de referência |
| Principal | CHECKBOX | - | Marcar como principal |

**Botões da lista:**
- Adicionar Endereço
- Editar (por linha)
- Excluir (por linha)
- Definir como Principal

#### Aba: Contatos

**Lista de Contatos (permite múltiplos):**
| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Nome | TEXT | * | Nome do contato |
| Cargo | TEXT | - | Cargo/Função |
| Telefone | PHONE | - | (99) 9999-9999 |
| Celular | PHONE | - | (99) 99999-9999 |
| WhatsApp | PHONE | - | (99) 99999-9999 |
| E-mail | EMAIL | - | - |
| Principal | CHECKBOX | - | Contato principal |
| Recebe NF | CHECKBOX | - | Recebe cópia da NF por e-mail |
| Recebe Cobrança | CHECKBOX | - | Recebe avisos de cobrança |

#### Aba: Financeiro

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Limite de Crédito | MONEY | - | R$ 0,00 = sem limite |
| Limite Utilizado | MONEY | - | Somente leitura |
| Limite Disponível | MONEY | - | Somente leitura |
| Prazo de Pagamento | SELECT | - | À vista, 7, 14, 21, 28, 35, 42 dias |
| Forma de Pagamento | SELECT | - | Boleto, Cartão, PIX, Faturado |
| Desconto Padrão | NUMBER | - | % de desconto automático |
| Bloqueado | CHECKBOX | - | Bloquear vendas |
| Motivo Bloqueio | TEXT | ** | Obrigatório se bloqueado |

**Cards informativos:**
| Card | Valor |
|------|-------|
| Total de Compras | Soma de todas as vendas |
| Última Compra | Data da última venda |
| Ticket Médio | Valor médio por pedido |
| Títulos em Aberto | Quantidade e valor |
| Títulos Vencidos | Quantidade e valor |
| Créditos Disponíveis | Valor em carteira |

#### Aba: Créditos

**Carteira de Créditos do Cliente:**
| Coluna | Descrição |
|--------|-----------|
| Data | Data do crédito |
| Origem | Indicação, Devolução, Bonificação, Adiantamento |
| Valor Original | Valor creditado |
| Valor Utilizado | Quanto já usou |
| Valor Disponível | Saldo atual |
| Validade | Data de expiração |
| Status | Disponível, Utilizado, Expirado |

**Botão:** Adicionar Crédito Manual (requer permissão)

#### Aba: Histórico

| Seção | Conteúdo |
|-------|----------|
| Orçamentos | Lista de orçamentos do cliente |
| Vendas | Lista de pedidos de venda |
| Financeiro | Títulos a receber |
| Indicações | Pessoas que indicou |
| Devoluções | Histórico de devoluções |
| Atendimentos | Histórico do CRM |

---

## 1.3 Cadastro de Produtos

### Tela: Lista de Produtos
**Rota:** `/produtos`

| Elemento | Tipo | Descrição |
|----------|------|-----------|
| Busca | TEXT | Código, nome, código de barras |
| Filtro Categoria | MULTISELECT | Categorias |
| Filtro Status | SELECT | Ativos, Inativos, Todos |
| Filtro Estoque | SELECT | Com estoque, Sem estoque, Abaixo do mínimo |
| Tabela | GRID | Lista de produtos |
| Botão Novo | BUTTON | Cadastrar produto |
| Importar | BUTTON | Importar planilha |
| Exportar | BUTTON | Exportar Excel |

**Colunas da Tabela:**
| Coluna | Largura | Descrição |
|--------|---------|-----------|
| Foto | 60px | Miniatura |
| Código | 100px | Código interno |
| Cód. Barras | 130px | EAN/GTIN |
| Descrição | 300px | Nome do produto |
| Categoria | 150px | Categoria |
| Unidade | 60px | UN, M, M², KG |
| Estoque | 80px | Quantidade atual |
| Preço Varejo | 100px | Preço de venda |
| Status | 80px | Ativo/Inativo |
| Ações | 80px | Menu |

---

### Tela: Cadastro de Produto
**Rota:** `/produtos/novo` ou `/produtos/:id`

#### Aba: Dados Gerais

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Código | TEXT | * | Gerado automaticamente ou manual |
| Código de Barras | TEXT | - | EAN-13 ou EAN-14 |
| Descrição | TEXT | * | Nome do produto |
| Descrição Complementar | TEXTAREA | - | Detalhes adicionais |
| Categoria | SELECT | * | Categorias cadastradas |
| Subcategoria | SELECT | - | Subcategorias da categoria |
| Marca | AUTOCOMPLETE | - | Marcas cadastradas |
| Fornecedor Principal | AUTOCOMPLETE | - | Fornecedores |
| Unidade de Medida | SELECT | * | UN, M, M², M³, KG, CX, PCT |
| Peso Bruto (kg) | NUMBER | - | Para cálculo de frete |
| Peso Líquido (kg) | NUMBER | - | - |
| Largura (cm) | NUMBER | - | - |
| Altura (cm) | NUMBER | - | - |
| Profundidade (cm) | NUMBER | - | - |
| Ativo | CHECKBOX | * | - |

#### Aba: Preços

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Custo de Aquisição | MONEY | - | Último custo de compra |
| Custo Médio | MONEY | - | Calculado automaticamente |
| Markup | NUMBER | - | % de margem |
| Preço Varejo | MONEY | * | Preço para consumidor |
| Preço Atacado | MONEY | - | Preço para revenda |
| Preço Promocional | MONEY | - | Preço em promoção |
| Início Promoção | DATE | ** | Se preço promocional |
| Fim Promoção | DATE | ** | Se preço promocional |

**Tabela de Preço por Quantidade (Atacarejo):**
| Campo | Descrição |
|-------|-----------|
| Quantidade Mínima | A partir de X unidades |
| Quantidade Máxima | Até Y unidades |
| Preço Unitário | Preço nessa faixa |

#### Aba: Estoque

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Controla Estoque | CHECKBOX | * | - |
| Estoque Atual | NUMBER | - | Somente leitura |
| Estoque Mínimo | NUMBER | - | Alerta quando atingir |
| Estoque Máximo | NUMBER | - | Limite de compra |
| Localização | TEXT | - | Endereço no armazém |
| Controla Lote | CHECKBOX | - | - |
| Controla Validade | CHECKBOX | - | - |
| Controla Série | CHECKBOX | - | - |

**Por Filial (se multi-empresa):**
| Coluna | Descrição |
|--------|-----------|
| Filial | Nome da filial |
| Estoque | Quantidade |
| Reservado | Quantidade reservada |
| Disponível | Estoque - Reservado |
| Mínimo | Estoque mínimo |
| Localização | Endereço |

#### Aba: Fiscal

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| NCM | TEXT | * | Nomenclatura Comum do Mercosul |
| CEST | TEXT | - | Código Especificador da ST |
| Origem | SELECT | * | 0-Nacional, 1-Estrangeira, etc. |
| Tipo de Item | SELECT | * | Mercadoria, Matéria-Prima, etc. |
| CFOP Venda Estadual | TEXT | - | Ex: 5.102 |
| CFOP Venda Interestadual | TEXT | - | Ex: 6.102 |
| Alíquota ICMS | NUMBER | - | % |
| Alíquota IPI | NUMBER | - | % |
| CST ICMS | SELECT | - | - |
| CST PIS | SELECT | - | - |
| CST COFINS | SELECT | - | - |

#### Aba: Imagens

| Elemento | Descrição |
|----------|-----------|
| Galeria | Upload de múltiplas imagens |
| Imagem Principal | Marcar uma como principal |
| Ordem | Arrastar para reordenar |
| Excluir | Remover imagem |

**Validações:**
- Formatos: JPG, PNG, WEBP
- Tamanho máximo: 5MB por imagem
- Resolução mínima: 800x800px

#### Aba: Kit (se produto for kit)

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| É um Kit | CHECKBOX | - | Marca como kit |
| Tipo de Kit | SELECT | ** | Virtual ou Montado |

**Composição do Kit:**
| Campo | Descrição |
|-------|-----------|
| Produto | Autocomplete de produtos |
| Quantidade | Quantidade no kit |
| Unidade | Unidade do componente |
| Custo | Custo do componente |

**Botões:**
- Adicionar Componente
- Remover (por linha)
- Calcular Custo Total

---

## 1.4 Gestão de Usuários

### Tela: Lista de Usuários
**Rota:** `/usuarios`

| Coluna | Descrição |
|--------|-----------|
| Avatar | Foto do usuário |
| Nome | Nome completo |
| E-mail | Login |
| Perfil | Perfil de acesso |
| Empresa | Empresas vinculadas |
| Último Acesso | Data/hora |
| Status | Ativo/Inativo |

---

### Tela: Cadastro de Usuário
**Rota:** `/usuarios/novo` ou `/usuarios/:id`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Nome Completo | TEXT | * | - |
| E-mail | EMAIL | * | Será o login |
| Senha | PASSWORD | * | Min 8 caracteres |
| Confirmar Senha | PASSWORD | * | Deve ser igual |
| Perfil | SELECT | * | Admin, Gerente, Vendedor, etc. |
| Empresas | MULTISELECT | * | Empresas que pode acessar |
| Vendedor Vinculado | AUTOCOMPLETE | - | Se for vendedor |
| Foto | IMAGE | - | Avatar |
| Ativo | CHECKBOX | * | - |
| 2FA Habilitado | CHECKBOX | - | Autenticação em dois fatores |

---

### Tela: Perfis de Acesso
**Rota:** `/perfis`

**Matriz de Permissões:**
| Módulo | Ver | Criar | Editar | Excluir | Aprovar |
|--------|-----|-------|--------|---------|---------|
| Clientes | ☑️ | ☑️ | ☑️ | ☐ | - |
| Produtos | ☑️ | ☑️ | ☑️ | ☐ | - |
| Orçamentos | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| Vendas | ☑️ | ☑️ | ☐ | ☐ | ☑️ |
| Financeiro | ☐ | ☐ | ☐ | ☐ | ☐ |
| ... | ... | ... | ... | ... | ... |

---

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

# PARTE 4 - FINANCEIRO

## 4.1 Contas a Receber

### Tela: Lista de Títulos a Receber
**Rota:** `/financeiro/receber`

| Filtro | Tipo | Descrição |
|--------|------|-----------|
| Período Vencimento | DATE_RANGE | Data de vencimento |
| Status | MULTISELECT | Aberto, Vencido, Pago, Pago Parcial, Cancelado |
| Cliente | AUTOCOMPLETE | - |
| Vendedor | AUTOCOMPLETE | - |
| Forma Pagamento | SELECT | Boleto, Cartão, PIX, etc. |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Documento | Número |
| Cliente | Nome |
| Emissão | Data de emissão |
| Vencimento | Data de vencimento |
| Valor Original | Valor do título |
| Juros/Multa | Se vencido |
| Valor Atual | Original + Juros |
| Pago | Valor já recebido |
| Saldo | A receber |
| Dias Atraso | Se vencido |
| Status | Badge |

**Cards Resumo:**
| Card | Valor |
|------|-------|
| A Receber Hoje | R$ 15.000 |
| A Receber na Semana | R$ 45.000 |
| A Receber no Mês | R$ 180.000 |
| Vencidos | R$ 25.000 |

**Ações:**
- Baixar Selecionados
- Enviar Cobrança
- Renegociar
- Exportar

---

### Tela: Baixa de Título
**Rota:** `/financeiro/receber/:id/baixa`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Título | TEXT | - | Somente leitura |
| Valor Original | MONEY | - | Somente leitura |
| Juros | MONEY | - | Calculado automaticamente |
| Multa | MONEY | - | Calculado automaticamente |
| Valor Atualizado | MONEY | - | Original + Juros + Multa |
| Desconto | MONEY | - | Desconto concedido |
| Valor Recebido | MONEY | * | Quanto recebeu |
| Data Recebimento | DATE | * | Quando recebeu |
| Forma Recebimento | SELECT | * | PIX, Dinheiro, etc. |
| Conta Bancária | SELECT | * | Onde entrou |
| Comprovante | FILE | - | Anexar comprovante |

**Opções:**
- Baixa Total
- Baixa Parcial (gera saldo)
- Baixa com Desconto (requer justificativa)

---

### Tela: Renegociação de Títulos
**Rota:** `/financeiro/receber/renegociacao`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Cliente | AUTOCOMPLETE | Cliente devedor |
| Títulos | MULTISELECT | Títulos em aberto |
| Total Original | MONEY | Soma dos títulos |
| Juros Acumulados | MONEY | Total de juros |
| Total da Dívida | MONEY | Original + Juros |

**Negociação:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| Desconto nos Juros | MONEY | Abatimento |
| Novo Valor | MONEY | Valor renegociado |
| Forma de Pagamento | SELECT | - |
| Número de Parcelas | NUMBER | - |
| Primeiro Vencimento | DATE | - |

**Preview das Parcelas:**
| Parcela | Vencimento | Valor |
|---------|------------|-------|
| 1/6 | 15/01/2025 | R$ 500,00 |
| 2/6 | 15/02/2025 | R$ 500,00 |
| ... | ... | ... |

---

## 4.2 Contas a Pagar

### Tela: Lista de Títulos a Pagar
**Rota:** `/financeiro/pagar`

| Filtro | Tipo | Descrição |
|--------|------|-----------|
| Período Vencimento | DATE_RANGE | - |
| Status | MULTISELECT | Aberto, Vencido, Pago, Parcial, Cancelado |
| Fornecedor | AUTOCOMPLETE | - |
| Categoria | SELECT | Mercadorias, Despesas, Impostos, etc. |
| Aprovação | SELECT | Pendente, Aprovado |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Documento | Número |
| Fornecedor | Nome |
| Categoria | Tipo de despesa |
| Emissão | Data |
| Vencimento | Data |
| Valor | Valor a pagar |
| Pago | Já pago |
| Saldo | Pendente |
| Aprovação | ✅ Aprovado / ⏳ Pendente |
| Status | Badge |

**Cards:**
| Card | Valor |
|------|-------|
| A Pagar Hoje | R$ 8.000 |
| A Pagar na Semana | R$ 35.000 |
| A Pagar no Mês | R$ 150.000 |
| Vencidos | R$ 5.000 |

---

### Tela: Novo Título a Pagar
**Rota:** `/financeiro/pagar/novo`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Fornecedor | AUTOCOMPLETE | * | Busca fornecedor |
| Documento | TEXT | * | Número do documento |
| Categoria | SELECT | * | Tipo de despesa |
| Centro de Custo | SELECT | - | Departamento |
| Data Emissão | DATE | * | - |
| Data Vencimento | DATE | * | - |
| Valor | MONEY | * | Valor a pagar |
| Forma Pagamento | SELECT | * | Boleto, Transferência, etc. |
| Código de Barras | TEXT | - | Para boleto |
| Chave PIX | TEXT | - | Para PIX |
| Recorrente | CHECKBOX | - | Gerar automaticamente |
| Frequência | SELECT | ** | Mensal, Semanal, etc. |
| Observações | TEXTAREA | - | - |
| Anexo | FILE | - | NF, Contrato, etc. |

---

### Tela: Pagamento de Títulos
**Rota:** `/financeiro/pagar/pagamento`

**Seleção em Lote:**
| Checkbox | Documento | Fornecedor | Vencimento | Valor |
|----------|-----------|------------|------------|-------|
| ☑ | NF 1234 | Fornecedor A | 01/12 | R$ 5.000 |
| ☑ | NF 5678 | Fornecedor B | 01/12 | R$ 3.000 |
| ☐ | NF 9012 | Fornecedor C | 02/12 | R$ 2.000 |

**Resumo do Pagamento:**
| Campo | Valor |
|-------|-------|
| Total Selecionado | R$ 8.000 |
| Descontos | R$ 0 |
| Total a Pagar | R$ 8.000 |

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Data Pagamento | DATE | Quando pagar |
| Conta Bancária | SELECT | De onde sai |
| Forma | SELECT | TED, PIX, Boleto |

**Ações:**
- Gerar Arquivo CNAB
- Pagar via Internet Banking
- Registrar Pagamento Manual

---

## 4.3 Fluxo de Caixa

### Tela: Fluxo de Caixa
**Rota:** `/financeiro/fluxo-caixa`

| Filtro | Descrição |
|--------|-----------|
| Período | Data inicial e final |
| Visão | Diária, Semanal, Mensal |
| Conta | Todas ou específica |
| Realizado/Previsto | Mostrar ambos ou só um |

**Tabela:**
| Data | Saldo Inicial | Entradas | Saídas | Saldo Final |
|------|---------------|----------|--------|-------------|
| 01/12 | R$ 50.000 | R$ 15.000 | R$ 8.000 | R$ 57.000 |
| 02/12 | R$ 57.000 | R$ 12.000 | R$ 20.000 | R$ 49.000 |
| 03/12 | R$ 49.000 | R$ 25.000 | R$ 10.000 | R$ 64.000 |
| ... | ... | ... | ... | ... |

**Gráfico:** Linha mostrando evolução do saldo

**Detalhamento (ao clicar no dia):**
| Tipo | Descrição | Valor |
|------|-----------|-------|
| ➕ Entrada | Recebimento NF 1234 | R$ 5.000 |
| ➕ Entrada | Recebimento NF 5678 | R$ 10.000 |
| ➖ Saída | Pagamento Fornecedor X | R$ 3.000 |
| ➖ Saída | Energia Elétrica | R$ 5.000 |

---

## 4.4 Gestão de Bancos

### Tela: Contas Bancárias
**Rota:** `/financeiro/bancos`

| Coluna | Descrição |
|--------|-----------|
| Banco | Nome do banco |
| Agência | Número |
| Conta | Número |
| Tipo | Corrente, Poupança |
| Saldo Sistema | Saldo no ERP |
| Saldo Banco | Saldo conciliado |
| Diferença | Pendências |
| Status | Ativo/Inativo |

---

### Tela: Extrato Bancário
**Rota:** `/financeiro/bancos/:id/extrato`

| Filtro | Descrição |
|--------|-----------|
| Período | Data inicial e final |
| Tipo | Entradas, Saídas, Todos |
| Conciliação | Conciliados, Pendentes, Todos |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Data | Data da movimentação |
| Histórico | Descrição |
| Documento | Referência |
| Entrada | Valor crédito |
| Saída | Valor débito |
| Saldo | Saldo atual |
| Conciliado | ✅ ou ⏳ |

---

### Tela: Conciliação Bancária
**Rota:** `/financeiro/bancos/:id/conciliacao`

**Lado Esquerdo: Extrato do Banco**
(Importado via OFX/CNAB)

**Lado Direito: Movimentações do Sistema**
(Baixas e pagamentos registrados)

**Ação:** Vincular movimentação do banco com lançamento do sistema

**Pendências:**
| Tipo | Descrição | Valor | Ação |
|------|-----------|-------|------|
| No banco, não no sistema | Tarifa bancária | R$ 35,00 | Criar lançamento |
| No sistema, não no banco | Cheque não compensado | R$ 500,00 | Aguardar |

---

## 4.5 DRE - Demonstrativo de Resultados

### Tela: DRE
**Rota:** `/financeiro/dre`

| Filtro | Descrição |
|--------|-----------|
| Período | Mês/Ano ou intervalo |
| Comparativo | Período anterior, Mesmo período ano anterior |
| Filial | Todas ou específica |

**Estrutura:**
```
RECEITA OPERACIONAL BRUTA
  (+) Vendas de Mercadorias         R$ 500.000    100%
  (-) Impostos sobre Vendas         R$ 60.000     12%
  (-) Devoluções                    R$ 5.000      1%
= RECEITA LÍQUIDA                   R$ 435.000    87%

(-) CUSTO DAS MERCADORIAS VENDIDAS
  CMV                               R$ 280.000    56%
= LUCRO BRUTO                       R$ 155.000    31%

(-) DESPESAS OPERACIONAIS
  Despesas com Pessoal              R$ 45.000     9%
  Despesas Administrativas          R$ 15.000     3%
  Despesas Comerciais               R$ 20.000     4%
  Despesas Financeiras              R$ 8.000      1.6%
= LUCRO OPERACIONAL                 R$ 67.000     13.4%

(-) OUTRAS DESPESAS/RECEITAS
  Receitas Financeiras              R$ 2.000      0.4%
= LUCRO ANTES DO IR                 R$ 69.000     13.8%

(-) IR/CSLL                         R$ 10.000     2%
= LUCRO LÍQUIDO                     R$ 59.000     11.8%
```

**Gráficos:**
- Pizza: Composição das despesas
- Barras: Comparativo de períodos

---

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

# PARTE 8 - RH

## 8.1 Colaboradores

### Tela: Lista de Colaboradores
**Rota:** `/rh/colaboradores`

| Filtro | Descrição |
|--------|-----------|
| Status | Ativo, Afastado, Férias, Desligado |
| Departamento | Setor |
| Cargo | Função |
| Filial | Unidade |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Foto | Avatar |
| Nome | Nome completo |
| CPF | Documento |
| Cargo | Função |
| Departamento | Setor |
| Admissão | Data |
| Status | Badge |
| Ações | Menu |

---

### Tela: Cadastro de Colaborador
**Rota:** `/rh/colaboradores/novo`

#### Aba: Dados Pessoais

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Nome Completo | TEXT | * | - |
| CPF | CPF | * | - |
| RG | TEXT | * | - |
| Data Nascimento | DATE | * | - |
| Sexo | SELECT | * | - |
| Estado Civil | SELECT | - | - |
| Nacionalidade | SELECT | * | - |
| Naturalidade | TEXT | - | Cidade/UF |
| Nome da Mãe | TEXT | * | - |
| Nome do Pai | TEXT | - | - |
| PIS/NIT | TEXT | * | - |
| CTPS | TEXT | * | Número e série |
| Título de Eleitor | TEXT | - | - |
| Certificado Reservista | TEXT | - | Se masculino |

#### Aba: Endereço e Contato

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| CEP | CEP | * | - |
| Logradouro | TEXT | * | - |
| Número | TEXT | * | - |
| Complemento | TEXT | - | - |
| Bairro | TEXT | * | - |
| Cidade | TEXT | * | - |
| UF | SELECT | * | - |
| Telefone | PHONE | - | - |
| Celular | PHONE | * | - |
| E-mail Pessoal | EMAIL | * | - |
| Contato de Emergência | TEXT | * | Nome e telefone |

#### Aba: Dados Profissionais

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Empresa | SELECT | * | - |
| Filial | SELECT | * | - |
| Departamento | SELECT | * | - |
| Cargo | SELECT | * | - |
| Data Admissão | DATE | * | - |
| Tipo Contrato | SELECT | * | CLT, Estágio, Temporário |
| Jornada | SELECT | * | 44h, 40h, 30h |
| Horário | TEXT | * | Ex: 08:00-18:00 |
| Salário | MONEY | * | - |
| VT | CHECKBOX | - | Recebe vale-transporte |
| VR | CHECKBOX | - | Recebe vale-refeição |
| Plano de Saúde | CHECKBOX | - | - |
| Centro de Custo | SELECT | - | - |

#### Aba: Documentos

| Documento | Tipo | Descrição |
|-----------|------|-----------|
| Foto 3x4 | IMAGE | - |
| RG | FILE | Frente e verso |
| CPF | FILE | - |
| CTPS | FILE | Foto das páginas |
| Comprovante Endereço | FILE | - |
| Certificados | FILE | Cursos, NRs |
| Exame Admissional | FILE | ASO |

#### Aba: Dependentes

| Campo | Descrição |
|-------|-----------|
| Nome | Nome do dependente |
| Parentesco | Cônjuge, Filho, etc. |
| Data Nascimento | - |
| CPF | - |
| IR | Deduz no IR? |
| Salário Família | Recebe? |

---

## 8.2 Controle de Ponto

### Tela: Espelho de Ponto
**Rota:** `/rh/ponto`

| Filtro | Descrição |
|--------|-----------|
| Colaborador | Busca |
| Período | Mês/Ano |
| Departamento | Setor |

**Por Colaborador:**
| Data | Entrada | Saída Almoço | Retorno Almoço | Saída | Trabalhado | Extra | Falta |
|------|---------|--------------|----------------|-------|------------|-------|-------|
| 01/12 | 08:02 | 12:00 | 13:00 | 18:00 | 08:58 | - | - |
| 02/12 | 08:15 | 12:05 | 13:00 | 19:30 | 09:20 | 01:20 | - |
| 03/12 | - | - | - | - | - | - | 08:00 |

**Resumo do Mês:**
| Campo | Valor |
|-------|-------|
| Dias Trabalhados | 21 |
| Horas Trabalhadas | 176h |
| Horas Extras 50% | 8h |
| Horas Extras 100% | 2h |
| Atrasos | 45min |
| Faltas | 1 dia |
| Banco de Horas | +10h |

---

### Tela: Registro de Ponto (App/Web)
**Rota:** `/app/ponto`

| Elemento | Descrição |
|----------|-----------|
| Relógio | Hora atual |
| Status | Próxima marcação esperada |
| Botão Bater Ponto | Grande, fácil de clicar |
| Localização | GPS ativo |
| Foto | Captura foto (opcional) |

**Últimas Marcações:**
| Data/Hora | Tipo | Local |
|-----------|------|-------|
| 02/12 08:02 | Entrada | Matriz |
| 02/12 12:00 | Saída Almoço | Matriz |
| 02/12 13:05 | Retorno | Matriz |

---

## 8.3 Férias

### Tela: Programação de Férias
**Rota:** `/rh/ferias`

| Filtro | Descrição |
|--------|-----------|
| Período | Mês de início |
| Departamento | Setor |
| Status | Programada, Em gozo, Concluída |

**Calendário Visual:**
Mostra férias de todos os colaboradores em timeline

**Por Colaborador:**
| Coluna | Descrição |
|--------|-----------|
| Colaborador | Nome |
| Período Aquisitivo | 01/01/24 a 31/12/24 |
| Dias de Direito | 30 |
| Dias Programados | 15 |
| Dias Gozados | 0 |
| Saldo | 30 |
| Próximas Férias | 15/01/25 a 29/01/25 |

---

### Tela: Solicitar Férias
**Rota:** `/rh/ferias/solicitar`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Colaborador | AUTOCOMPLETE | * | - |
| Período Aquisitivo | SELECT | * | Qual período usar |
| Data Início | DATE | * | Início das férias |
| Dias de Gozo | NUMBER | * | Quantos dias |
| Abono Pecuniário | CHECKBOX | - | Vender 10 dias |
| Adiantamento 13º | CHECKBOX | - | Receber 50% do 13º |

**Validações:**
- Mínimo 5 dias por período
- Máximo 3 períodos
- Não pode iniciar 2 dias antes de feriado
- Não pode iniciar sábado/domingo

**Fluxo:**
1. Colaborador solicita (ou RH)
2. Gestor aprova
3. RH confirma
4. Gera aviso e recibo de férias

---

## 8.4 Folha de Pagamento

### Tela: Folha de Pagamento
**Rota:** `/rh/folha`

| Filtro | Descrição |
|--------|-----------|
| Competência | Mês/Ano |
| Departamento | Setor |
| Status | Aberta, Calculada, Fechada, Paga |

**Por Colaborador:**
| Coluna | Descrição |
|--------|-----------|
| Colaborador | Nome |
| Salário Base | Valor |
| Proventos | Total de proventos |
| Descontos | Total de descontos |
| Líquido | A receber |
| Status | Calculado, Conferido |

---

### Tela: Cálculo Individual
**Rota:** `/rh/folha/:id`

**PROVENTOS:**
| Código | Descrição | Referência | Valor |
|--------|-----------|------------|-------|
| 001 | Salário Base | 30 dias | R$ 3.000 |
| 002 | Horas Extras 50% | 8h | R$ 163,64 |
| 003 | Adicional Noturno | 20h | R$ 150,00 |
| 005 | Comissões | 2% | R$ 500,00 |
| | **Total Proventos** | | **R$ 3.813,64** |

**DESCONTOS:**
| Código | Descrição | Referência | Valor |
|--------|-----------|------------|-------|
| 101 | INSS | 12% | R$ 360,00 |
| 102 | IRRF | 15% | R$ 250,00 |
| 103 | Vale Transporte | 6% | R$ 180,00 |
| 104 | Vale Refeição | - | R$ 100,00 |
| 105 | Faltas | 1 dia | R$ 100,00 |
| | **Total Descontos** | | **R$ 990,00** |

**LÍQUIDO:** R$ 2.823,64

**Ações:**
- Adicionar Evento
- Remover Evento
- Recalcular
- Gerar Holerite

---

## 8.5 App do Colaborador

### Tela: Home do App
**Rota:** `/app/colaborador`

**Cards:**
| Card | Valor |
|------|-------|
| Próximo Pagamento | 05/12 - R$ 2.823 |
| Saldo Banco de Horas | +10h |
| Férias Disponíveis | 30 dias |
| Próximas Férias | 15/01 a 29/01 |

**Menu:**
- Bater Ponto
- Espelho de Ponto
- Solicitar Férias
- Meus Holerites
- Enviar Atestado
- Comunicados
- Fale com o RH

---

### Tela: Meus Holerites
**Rota:** `/app/colaborador/holerites`

| Competência | Líquido | Status | Ação |
|-------------|---------|--------|------|
| Dezembro/24 | R$ 2.823 | Disponível | Baixar PDF |
| Novembro/24 | R$ 2.750 | Disponível | Baixar PDF |
| Outubro/24 | R$ 2.800 | Disponível | Baixar PDF |

---

### Tela: Enviar Atestado
**Rota:** `/app/colaborador/atestado`

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Data Início | DATE | * | Início do afastamento |
| Data Fim | DATE | * | Fim do afastamento |
| Tipo | SELECT | * | Atestado Médico, Comparecimento, Acompanhante |
| CID | TEXT | - | Código da doença (opcional) |
| Médico | TEXT | - | Nome do médico |
| CRM | TEXT | - | Registro do médico |
| Foto do Atestado | IMAGE | * | Frente do atestado |
| Foto Verso | IMAGE | - | Se houver |
| Observações | TEXTAREA | - | - |

---

# PARTE 9 - CONTRATOS

## 9.1 Gestão de Contratos

### Tela: Lista de Contratos
**Rota:** `/contratos`

| Filtro | Descrição |
|--------|-----------|
| Tipo | Cliente, Fornecedor |
| Status | Vigente, Vencido, Cancelado |
| Vencimento | Próximos 30/60/90 dias |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Número | Código do contrato |
| Tipo | Cliente ou Fornecedor |
| Parte | Nome do cliente/fornecedor |
| Objeto | Descrição resumida |
| Valor | Valor do contrato |
| Início | Data de início |
| Fim | Data de término |
| Renova | Automático ou Manual |
| Status | Badge |
| Ações | Menu |

---

### Tela: Cadastro de Contrato
**Rota:** `/contratos/novo`

#### Aba: Dados Gerais

| Campo | Tipo | Obrig. | Descrição |
|-------|------|--------|-----------|
| Número | TEXT | - | Gerado ou manual |
| Tipo | SELECT | * | Cliente, Fornecedor |
| Cliente/Fornecedor | AUTOCOMPLETE | * | Busca |
| Objeto | TEXT | * | Descrição do contrato |
| Valor Total | MONEY | - | Valor do contrato |
| Periodicidade | SELECT | - | Mensal, Anual, etc. |
| Data Início | DATE | * | Início da vigência |
| Data Fim | DATE | * | Término da vigência |
| Renovação | SELECT | * | Automática, Manual |
| Dias para Alerta | NUMBER | * | Dias antes de vencer |
| Responsável | AUTOCOMPLETE | * | Gestor do contrato |

#### Aba: Condições Comerciais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Tabela de Preço | SELECT | Tabela específica para este contrato |
| Desconto Especial | NUMBER | % de desconto |
| Prazo de Pagamento | SELECT | Condição especial |
| Frete | SELECT | CIF, FOB |
| Volume Acordado | NUMBER | Quantidade mensal/anual |
| Penalidades | TEXTAREA | Multas por descumprimento |

#### Aba: Documentos

| Documento | Descrição |
|-----------|-----------|
| Contrato Assinado | PDF do contrato |
| Aditivos | Alterações ao contrato |
| Anexos | Documentos complementares |

#### Aba: Histórico

| Data | Ação | Usuário | Descrição |
|------|------|---------|-----------|
| 01/12 | Criação | João | Contrato criado |
| 05/12 | Aditivo | Maria | Alteração de prazo |
| 10/12 | Renovação | Sistema | Renovação automática |

---

### Modal: Aditivo de Contrato
**Abre quando:** Clica "Novo Aditivo"

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Número do Aditivo | TEXT | Sequencial |
| Data | DATE | Data do aditivo |
| Tipo | SELECT | Prazo, Valor, Condições |
| Descrição | TEXTAREA | O que muda |
| Nova Data Fim | DATE | Se alterar prazo |
| Novo Valor | MONEY | Se alterar valor |
| Documento | FILE | PDF do aditivo assinado |

---

# PARTE 10 - CONFIGURAÇÕES

## 10.1 Configurações Gerais

### Tela: Configurações do Sistema
**Rota:** `/configuracoes`

**Menu Lateral de Categorias:**
- Empresa
- Usuários e Permissões
- Comercial
- Compras e Estoque
- Financeiro
- Fiscal
- Logística
- E-commerce
- RH
- Contratos
- Notificações
- Integrações
- Sistema

---

### Tela: Configurações Comerciais
**Rota:** `/configuracoes/comercial`

#### Orçamentos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Validade Padrão (dias) | NUMBER | 15 |
| Permitir Mesclar | CHECKBOX | ✅ |
| Regra Preço Duplicado | SELECT | Menor, Maior, Recente, Manual |
| Numeração Automática | CHECKBOX | ✅ |
| Prefixo | TEXT | ORC- |

#### Vendas

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Pedido Mínimo B2C | MONEY | R$ 0,00 |
| Pedido Mínimo B2B | MONEY | R$ 500,00 |
| Desconto Máx. Vendedor | NUMBER | 10% |
| Desconto Máx. Gerente | NUMBER | 20% |
| Reserva Estoque ao Criar | CHECKBOX | ✅ |
| Dias para Liberar Reserva | NUMBER | 7 |
| Permitir Venda Sem Estoque | CHECKBOX | ☐ |
| Permitir Venda Abaixo Custo | CHECKBOX | ☐ |
| Alerta Margem Mínima | NUMBER | 15% |

#### Bonificação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Limite Mensal (% vendas) | NUMBER | 2% |
| Requer Aprovação | CHECKBOX | ✅ |
| Aprovador | SELECT | Gerente |
| Motivos | LIST | Amostra, Acordo, Avaria |

#### Comissões

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Comissão Padrão | NUMBER | 3% |
| Momento Pagamento | SELECT | Faturamento, Recebimento |
| Desconto Afeta Comissão | CHECKBOX | ✅ |

#### Indicações

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Programa Ativo | CHECKBOX | ✅ |
| Tipo Benefício | SELECT | Crédito, Dinheiro |
| Valor/Percentual | NUMBER | 5% |
| Sobre | SELECT | 1ª Compra, Todas |
| Crédito Após | SELECT | Venda, Recebimento |
| Validade (dias) | NUMBER | 180 |
| Limite por Indicação | MONEY | R$ 500 |

---

### Tela: Configurações Financeiras
**Rota:** `/configuracoes/financeiro`

#### Contas a Receber

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Juros ao Mês | NUMBER | 1% |
| Multa por Atraso | NUMBER | 2% |
| Dias de Carência | NUMBER | 0 |
| Bloquear Cliente Inadimplente | CHECKBOX | ✅ |
| Dias para Bloqueio | NUMBER | 30 |
| Dias para Negativação | NUMBER | 90 |

#### Régua de Cobrança

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Cobrança Ativa | CHECKBOX | ✅ |
| Dias Antes Vencimento | LIST | -3, -1 |
| Dias Após Vencimento | LIST | 1, 7, 15, 30 |
| Canal | SELECT | E-mail, WhatsApp, Ambos |

#### Limite de Crédito

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Limite Padrão PF | MONEY | R$ 0 |
| Limite Padrão PJ | MONEY | R$ 5.000 |
| Bloquear Acima do Limite | CHECKBOX | ✅ |
| Considerar Pedidos Não Faturados | CHECKBOX | ✅ |

---

### Tela: Configurações de Notificações
**Rota:** `/configuracoes/notificacoes`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| E-mail do Sistema | EMAIL | sistema@planac.com.br |
| WhatsApp Business | PHONE | +55 44 99999-9999 |
| Notificar Vendedor - Novo Pedido | CHECKBOX | ✅ |
| Notificar Cliente - Status | CHECKBOX | ✅ |
| Notificar Financeiro - Recebimento | CHECKBOX | ✅ |
| Notificar Comprador - Estoque Baixo | CHECKBOX | ✅ |
| Notificar Gestor - Aprovação Pendente | CHECKBOX | ✅ |

---

### Tela: Integrações
**Rota:** `/configuracoes/integracoes`

#### Bancos

| Banco | Status | Ações |
|-------|--------|-------|
| Banco do Brasil | ✅ Conectado | Configurar, Desconectar |
| Itaú | ⏳ Pendente | Conectar |
| Sicredi | ⏳ Pendente | Conectar |

#### Pagamentos

| Integração | Status | Ações |
|------------|--------|-------|
| PagSeguro | ✅ Conectado | Configurar |
| Mercado Pago | ⏳ Pendente | Conectar |
| Stone | ⏳ Pendente | Conectar |

#### Fiscal

| Integração | Status | Ações |
|------------|--------|-------|
| SEFAZ - NF-e | ✅ Conectado | Testar |
| SEFAZ - NFC-e | ✅ Conectado | Testar |
| Receita Federal | ✅ Conectado | - |

#### Comunicação

| Integração | Status | Ações |
|------------|--------|-------|
| WhatsApp Business API | ✅ Conectado | Configurar |
| E-mail SMTP | ✅ Conectado | Testar |
| SMS | ⏳ Pendente | Conectar |

#### Marketing

| Integração | Status | Ações |
|------------|--------|-------|
| Google Analytics | ✅ Conectado | - |
| Meta Pixel | ✅ Conectado | - |
| Google Ads | ⏳ Pendente | Conectar |

---

### Tela: Configurações do Sistema
**Rota:** `/configuracoes/sistema`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Fuso Horário | SELECT | America/Sao_Paulo |
| Formato de Data | SELECT | DD/MM/AAAA |
| Moeda | SELECT | BRL |
| Casas Decimais | NUMBER | 2 |
| Backup Automático | CHECKBOX | ✅ |
| Frequência Backup | SELECT | Diário |
| Tema Padrão | SELECT | Claro |
| Logs de Auditoria | CHECKBOX | ✅ |
| Dias para Manter Logs | NUMBER | 365 |
| Manutenção Programada | TEXT | Domingos 02:00-04:00 |

---

## 10.2 Auditoria

### Tela: Log de Auditoria
**Rota:** `/configuracoes/auditoria`

| Filtro | Descrição |
|--------|-----------|
| Período | Data/hora |
| Usuário | Quem fez |
| Módulo | Onde foi |
| Ação | O que fez |

**Colunas:**
| Coluna | Descrição |
|--------|-----------|
| Data/Hora | Quando |
| Usuário | Quem |
| IP | De onde |
| Módulo | Onde |
| Ação | Criar, Editar, Excluir, Visualizar, Login, Logout |
| Registro | ID do registro afetado |
| Detalhes | Campos alterados |

**Expandir Detalhes:**
```
Alteração em Cliente #1234
Campo: Limite de Crédito
Valor Anterior: R$ 5.000,00
Valor Novo: R$ 10.000,00
```

---

# RESUMO FINAL

## Estatísticas

| Parte | Módulo | Telas Especificadas |
|-------|--------|---------------------|
| 1 | Core | 15 |
| 2 | Comercial | 45 |
| 3 | Compras | 30 |
| 4 | Financeiro | 20 |
| 5 | Fiscal | 18 |
| 6 | Expedição | 10 |
| 7 | E-commerce | 25 |
| 8 | RH | 20 |
| 9 | Contratos | 8 |
| 10 | Configurações | 12 |
| **TOTAL** | | **203 telas** |

## Tipos de Componentes Utilizados

| Componente | Quantidade |
|------------|------------|
| Formulários de Cadastro | 45 |
| Listas/Grids | 52 |
| Modais | 35 |
| Dashboards/Cards | 28 |
| Relatórios | 18 |
| Fluxos de Trabalho | 15 |
| Apps Mobile | 10 |

---

**Versão:** 1.0
**Última atualização:** 01/12/2025
**Total de Páginas:** Documento único

---

PLANAC Distribuidora - ERP - Documentação Oficial
