# Especificação de Telas - Módulo RH

Este documento contém as especificações de telas do módulo de recursos humanos.

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

