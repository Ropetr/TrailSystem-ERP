// =============================================
// PLANAC ERP - Sisprime Integration Types
// Tipos para integração com API Sisprime/CobExpress
// =============================================

// ===== CONFIGURAÇÃO =====

export interface SisprimeConfig {
  /** Chave de acesso geral (fornecida no processo de homologação) */
  chaveAcessoGeral: string;
  /** Chave de acesso da conta (específica por cooperado) */
  chaveAcessoConta: string;
  /** Ambiente de execução */
  ambiente: 'homologacao' | 'producao';
}

export interface SisprimeEnv {
  SISPRIME_CHAVE_ACESSO_GERAL: string;
  SISPRIME_CHAVE_ACESSO_CONTA: string;
  SISPRIME_AMBIENTE?: 'homologacao' | 'producao';
}

// ===== DADOS DO COOPERADO =====

export interface SisprimeDadosCooperado {
  /** Número da instituição financeira (084) */
  instituicao: string;
  /** Número da agência com DV (ex: 0016-7) */
  agencia: string;
  /** Número da conta corrente com DV (ex: 117811-3) */
  conta: string;
  /** Código da carteira de cobrança (ex: 009) */
  carteira: string;
  /** Código do convênio (ex: 000001) */
  convenio: string;
  /** Nome do beneficiário */
  beneficiarioNome: string;
  /** CPF/CNPJ do beneficiário */
  beneficiarioCpfCnpj: string;
}

// ===== ENVIAR BOLETO =====

export interface SisprimeTituloEnvio {
  // Identificação
  /** Número do documento (seu número) - até 10 caracteres */
  numero_documento: string;
  /** Nosso número - até 11 dígitos (gerado automaticamente se não informado) */
  nosso_numero?: string;

  // Datas
  /** Data de emissão (YYYY-MM-DD) */
  data_emissao: string;
  /** Data de vencimento (YYYY-MM-DD) */
  data_vencimento: string;

  // Valores
  /** Valor do documento */
  valor_documento: number;
  /** Valor de abatimento */
  valor_abatimento?: number;

  // Desconto
  /** Data limite para desconto 1 (YYYY-MM-DD) */
  data_desconto_1?: string;
  /** Valor do desconto 1 */
  valor_desconto_1?: number;
  /** Data limite para desconto 2 (YYYY-MM-DD) */
  data_desconto_2?: string;
  /** Valor do desconto 2 */
  valor_desconto_2?: number;
  /** Data limite para desconto 3 (YYYY-MM-DD) */
  data_desconto_3?: string;
  /** Valor do desconto 3 */
  valor_desconto_3?: number;

  // Multa e Juros
  /** Percentual de multa após vencimento */
  percentual_multa?: number;
  /** Percentual de juros ao mês */
  percentual_juros?: number;
  /** Valor de juros por dia (alternativa ao percentual) */
  valor_juros?: number;

  // Protesto/Negativação
  /** Tipo: 0=Sem protesto, 1=Protestar dias corridos, 2=Protestar dias úteis, 3=Negativar */
  tipo_protesto_negativacao?: number;
  /** Prazo em dias para protesto/negativação */
  prazo_protesto_negativacao?: number;

  // Sacado (Pagador)
  /** Tipo de pessoa: PF ou PJ */
  sacado_tipo: 'PF' | 'PJ';
  /** CPF (11 dígitos) ou CNPJ (14 dígitos) */
  sacado_cpf_cnpj: string;
  /** Nome/Razão Social */
  sacado_nome: string;
  /** Endereço */
  sacado_endereco: string;
  /** Número */
  sacado_numero?: string;
  /** Complemento */
  sacado_complemento?: string;
  /** Bairro */
  sacado_bairro: string;
  /** Cidade */
  sacado_cidade: string;
  /** UF (2 caracteres) */
  sacado_uf: string;
  /** CEP (8 dígitos) */
  sacado_cep: string;
  /** Email para envio do boleto */
  sacado_email?: string;
  /** Telefone */
  sacado_telefone?: string;

  // Sacador Avalista (opcional)
  /** CPF/CNPJ do avalista */
  avalista_cpf_cnpj?: string;
  /** Nome do avalista */
  avalista_nome?: string;

  // Espécie do documento
  /** DM=Duplicata Mercantil, DS=Duplicata Serviço, NP=Nota Promissória, etc. */
  especie_documento?: string;

  // Aceite
  /** A=Aceite, N=Não aceite */
  aceite?: string;

  // Mensagens
  /** Mensagem 1 (até 40 caracteres) */
  mensagem_1?: string;
  /** Mensagem 2 (até 40 caracteres) */
  mensagem_2?: string;
  /** Mensagem 3 (até 40 caracteres) */
  mensagem_3?: string;

  // Ocorrência (para alterações)
  /** Código de ocorrência de remessa (01=Entrada, 02=Baixa, etc.) */
  ocorrencia_remessa?: string;
}

export interface SisprimeEnviarBoletoRequest {
  token: string;
  titulo: SisprimeTituloEnvio;
}

export interface SisprimeEnviarBoletoResponse {
  /** Status da operação */
  status: 'sucesso' | 'erro';
  /** Mensagem de retorno */
  mensagem?: string;
  /** Dados do título registrado */
  dados?: {
    /** ID único do boleto no Sisprime */
    id_boleto: string;
    /** Nosso número gerado */
    nosso_numero: string;
    /** Código de barras */
    codigo_barras: string;
    /** Linha digitável */
    linha_digitavel: string;
    /** QR Code PIX (se habilitado) */
    qr_code?: string;
  };
  /** Erros de validação */
  erros?: Array<{
    campo: string;
    mensagem: string;
  }>;
}

// ===== CONSULTAR BOLETO =====

export interface SisprimeConsultarBoletoRequest {
  token: string;
  id_boleto: string;
}

export interface SisprimeConsultarBoletoResponse {
  status: 'sucesso' | 'erro';
  mensagem?: string;
  dados?: SisprimeTituloConsulta;
}

export interface SisprimeTituloConsulta {
  id_boleto: string;
  nosso_numero: string;
  numero_documento: string;
  codigo_barras: string;
  linha_digitavel: string;
  data_emissao: string;
  data_vencimento: string;
  valor_documento: number;
  valor_abatimento?: number;
  valor_desconto?: number;
  valor_juros?: number;
  valor_multa?: number;
  valor_pago?: number;
  data_pagamento?: string;
  data_credito?: string;
  codigo_situacao: string;
  descricao_situacao: string;
  qr_code?: string;
  sacado_nome: string;
  sacado_cpf_cnpj: string;
}

// ===== WEBHOOK =====

export interface SisprimeWebhookPayload {
  /** Dados do título */
  dados_titulo: SisprimeWebhookTitulo;
  /** Lançamentos (créditos/débitos) */
  lancamentos?: SisprimeWebhookLancamento[];
  /** Emails enviados */
  emails?: SisprimeWebhookEmail[];
}

export interface SisprimeWebhookTitulo {
  id_boleto: string;
  codigo_barras: string;
  linha_digitavel: string;
  nosso_numero: string;
  numero_documento: string;
  data_vencimento: string;
  valor_documento: string;
  especie_documento: string;
  valor_abatimento?: string;
  data_desconto_1?: string | null;
  valor_desconto_1?: string | null;
  data_desconto_2?: string | null;
  valor_desconto_2?: string | null;
  data_desconto_3?: string | null;
  valor_desconto_3?: string | null;
  tipo_protesto_negativacao?: string;
  prazo_protesto_negativacao?: string | null;
  valor_juros?: string;
  percentual_juros?: string;
  percentual_multa?: string;
  codigo_situacao: string;
  descricao_situacao: string;
  codigo_ocorrencia_remessa?: string;
  codigo_ocorrencia_retorno?: string;
  codigo_motivo1?: string;
  descricao_motivo1?: string;
  codigo_motivo2?: string;
  descricao_motivo2?: string;
  codigo_motivo3?: string;
  descricao_motivo3?: string;
  codigo_motivo4?: string;
  descricao_motivo4?: string;
  codigo_motivo5?: string;
  descricao_motivo5?: string;
  qr_code?: string;
}

export interface SisprimeWebhookLancamento {
  /** CREDITO ou DEBITO */
  tipo_lancamento: 'CREDITO' | 'DEBITO';
  /** Data da ocorrência (YYYY-MM-DD) */
  data_ocorrencia: string;
  /** Data do lançamento (YYYY-MM-DD) */
  data_lancamento: string;
  /** Valor do lançamento */
  valor_lancamento: string;
  /** ID único do lançamento */
  identificador_lancamento: string;
}

export interface SisprimeWebhookEmail {
  /** Data/hora do envio */
  data_hora_envio: string;
}

// ===== SITUAÇÕES DO TÍTULO =====

export const SISPRIME_SITUACOES: Record<string, string> = {
  '01': 'EM ABERTO',
  '02': 'BAIXADO',
  '03': 'PROTESTADO',
  '04': 'NEGATIVADO',
  '05': 'LIQUIDADO CARTÓRIO',
  '06': 'LIQUIDADO APÓS BAIXA',
  '07': 'PAGO',
  '08': 'PAGO A MENOR',
  '09': 'PAGO A MAIOR',
};

// ===== OCORRÊNCIAS DE RETORNO =====

export const SISPRIME_OCORRENCIAS_RETORNO: Record<string, string> = {
  '02': 'ENTRADA CONFIRMADA',
  '03': 'ENTRADA REJEITADA',
  '04': 'TRANSFERÊNCIA DE CARTEIRA/ENTRADA',
  '05': 'TRANSFERÊNCIA DE CARTEIRA/BAIXA',
  '06': 'LIQUIDAÇÃO',
  '09': 'BAIXA',
  '11': 'TÍTULOS EM CARTEIRA (EM SER)',
  '12': 'CONFIRMAÇÃO RECEBIMENTO INSTRUÇÃO DE ABATIMENTO',
  '13': 'CONFIRMAÇÃO RECEBIMENTO INSTRUÇÃO DE CANCELAMENTO ABATIMENTO',
  '14': 'CONFIRMAÇÃO RECEBIMENTO INSTRUÇÃO ALTERAÇÃO DE VENCIMENTO',
  '17': 'LIQUIDAÇÃO APÓS BAIXA OU LIQUIDAÇÃO TÍTULO NÃO REGISTRADO',
  '19': 'CONFIRMAÇÃO RECEBIMENTO INSTRUÇÃO DE PROTESTO',
  '20': 'CONFIRMAÇÃO RECEBIMENTO INSTRUÇÃO DE SUSTAÇÃO/CANCELAMENTO DE PROTESTO',
  '23': 'REMESSA A CARTÓRIO (APONTE EM CARTÓRIO)',
  '24': 'RETIRADA DE CARTÓRIO E MANUTENÇÃO EM CARTEIRA',
  '25': 'PROTESTADO E BAIXADO (BAIXA POR TER SIDO PROTESTADO)',
  '26': 'INSTRUÇÃO REJEITADA',
  '27': 'CONFIRMAÇÃO DO PEDIDO DE ALTERAÇÃO DE OUTROS DADOS',
  '28': 'DÉBITO DE TARIFAS/CUSTAS',
  '29': 'OCORRÊNCIAS DO PAGADOR',
  '30': 'ALTERAÇÃO DE DADOS REJEITADA',
  '33': 'CONFIRMAÇÃO DA ALTERAÇÃO DOS DADOS DO RATEIO DE CRÉDITO',
  '34': 'CONFIRMAÇÃO DO CANCELAMENTO DOS DADOS DO RATEIO DE CRÉDITO',
  '35': 'CONFIRMAÇÃO DO DESAGENDAMENTO DO DÉBITO AUTOMÁTICO',
  '36': 'CONFIRMAÇÃO DE ENVIO DE E-MAIL/SMS',
  '37': 'ENVIO DE E-MAIL/SMS REJEITADO',
  '38': 'CONFIRMAÇÃO DE ALTERAÇÃO DO PRAZO LIMITE DE RECEBIMENTO',
  '39': 'CONFIRMAÇÃO DE DISPENSA DE PRAZO LIMITE DE RECEBIMENTO',
  '40': 'CONFIRMAÇÃO DA ALTERAÇÃO DO NÚMERO DO TÍTULO DADO PELO BENEFICIÁRIO',
  '41': 'CONFIRMAÇÃO DA ALTERAÇÃO DO NÚMERO CONTROLE DO PARTICIPANTE',
  '42': 'CONFIRMAÇÃO DA ALTERAÇÃO DOS DADOS DO PAGADOR',
  '43': 'CONFIRMAÇÃO DA ALTERAÇÃO DOS DADOS DO SACADOR/AVALISTA',
  '44': 'TÍTULO PAGO COM CHEQUE DEVOLVIDO',
  '45': 'TÍTULO PAGO COM CHEQUE COMPENSADO',
  '46': 'INSTRUÇÃO PARA CANCELAR PROTESTO CONFIRMADA',
  '47': 'INSTRUÇÃO PARA PROTESTO PARA FINS FALIMENTARES CONFIRMADA',
  '48': 'CONFIRMAÇÃO DE INSTRUÇÃO DE TRANSFERÊNCIA DE CARTEIRA/MODALIDADE DE COBRANÇA',
  '49': 'ALTERAÇÃO DE CONTRATO DE COBRANÇA',
  '50': 'TÍTULO PAGO COM CHEQUE PENDENTE DE LIQUIDAÇÃO',
  '51': 'TÍTULO DDA RECONHECIDO PELO PAGADOR',
  '52': 'TÍTULO DDA NÃO RECONHECIDO PELO PAGADOR',
  '53': 'TÍTULO DDA RECUSADO PELA CIP',
  '54': 'CONFIRMAÇÃO DA INSTRUÇÃO DE BAIXA DE TÍTULO NEGATIVADO SEM PROTESTO',
  '55': 'CONFIRMAÇÃO DE PEDIDO DE DISPENSA DE MULTA',
  '56': 'CONFIRMAÇÃO DO PEDIDO DE COBRANÇA DE MULTA',
  '57': 'CONFIRMAÇÃO DO PEDIDO DE ALTERAÇÃO DE COBRANÇA DE JUROS',
  '58': 'CONFIRMAÇÃO DO PEDIDO DE ALTERAÇÃO DO VALOR/PERCENTUAL DE MULTA',
  '59': 'CONFIRMAÇÃO DO PEDIDO DE ALTERAÇÃO DO VALOR/DATA DE DESCONTO',
  '60': 'CONFIRMAÇÃO DO PEDIDO DE ALTERAÇÃO DO BENEFICIÁRIO DO TÍTULO',
  '61': 'CONFIRMAÇÃO DO PEDIDO DE DISPENSA DE JUROS DE MORA',
  '85': 'CONFIRMAÇÃO DE DESISTÊNCIA DE PROTESTO',
};

// ===== MOTIVOS DE REJEIÇÃO =====

export const SISPRIME_MOTIVOS_REJEICAO: Record<string, string> = {
  '00': 'TÍTULO PAGO COM DINHEIRO',
  '01': 'CÓDIGO DO BANCO INVÁLIDO',
  '02': 'CÓDIGO DO REGISTRO DETALHE INVÁLIDO',
  '03': 'CÓDIGO DO SEGMENTO INVÁLIDO',
  '04': 'CÓDIGO DE MOVIMENTO NÃO PERMITIDO PARA CARTEIRA',
  '05': 'CÓDIGO DE MOVIMENTO INVÁLIDO',
  '06': 'TIPO/NÚMERO DE INSCRIÇÃO DO BENEFICIÁRIO INVÁLIDOS',
  '07': 'AGÊNCIA/CONTA/DV INVÁLIDO',
  '08': 'NOSSO NÚMERO INVÁLIDO',
  '09': 'NOSSO NÚMERO DUPLICADO',
  '10': 'CARTEIRA INVÁLIDA',
  '11': 'FORMA DE CADASTRAMENTO DO TÍTULO INVÁLIDO',
  '12': 'TIPO DE DOCUMENTO INVÁLIDO',
  '13': 'IDENTIFICAÇÃO DA EMISSÃO DO BOLETO INVÁLIDA',
  '14': 'IDENTIFICAÇÃO DA DISTRIBUIÇÃO DO BOLETO INVÁLIDA',
  '15': 'CARACTERÍSTICAS DA COBRANÇA INCOMPATÍVEIS',
  '16': 'DATA DE VENCIMENTO INVÁLIDA',
  '17': 'DATA DE VENCIMENTO ANTERIOR A DATA DE EMISSÃO',
  '18': 'VENCIMENTO FORA DO PRAZO DE OPERAÇÃO',
  '19': 'TÍTULO A CARGO DE BANCOS CORRESPONDENTES COM VENCIMENTO INFERIOR A XX DIAS',
  '20': 'VALOR DO TÍTULO INVÁLIDO',
  '21': 'ESPÉCIE DO TÍTULO INVÁLIDA',
  '22': 'ESPÉCIE DO TÍTULO NÃO PERMITIDA PARA A CARTEIRA',
  '23': 'ACEITE INVÁLIDO',
  '24': 'DATA DA EMISSÃO INVÁLIDA',
  '25': 'DATA DA EMISSÃO POSTERIOR A DATA DE ENTRADA',
  '26': 'CÓDIGO DE JUROS DE MORA INVÁLIDO',
  '27': 'VALOR/TAXA DE JUROS DE MORA INVÁLIDO',
  '28': 'CÓDIGO DO DESCONTO INVÁLIDO',
  '29': 'VALOR DO DESCONTO MAIOR OU IGUAL AO VALOR DO TÍTULO',
  '30': 'DESCONTO A CONCEDER NÃO CONFERE',
  '31': 'CONCESSÃO DE DESCONTO - JÁ EXISTE DESCONTO ANTERIOR',
  '32': 'VALOR DO IOF INVÁLIDO',
  '33': 'VALOR DO ABATIMENTO INVÁLIDO',
  '34': 'VALOR DO ABATIMENTO MAIOR OU IGUAL AO VALOR DO TÍTULO',
  '35': 'VALOR A CONCEDER NÃO CONFERE',
  '36': 'CONCESSÃO DE ABATIMENTO - JÁ EXISTE ABATIMENTO ANTERIOR',
  '37': 'CÓDIGO PARA PROTESTO INVÁLIDO',
  '38': 'PRAZO PARA PROTESTO INVÁLIDO',
  '39': 'PEDIDO DE PROTESTO NÃO PERMITIDO PARA O TÍTULO',
  '40': 'TÍTULO COM ORDEM DE PROTESTO EMITIDA',
  '41': 'PEDIDO DE CANCELAMENTO/SUSTAÇÃO PARA TÍTULOS SEM INSTRUÇÃO DE PROTESTO',
  '42': 'CÓDIGO PARA BAIXA/DEVOLUÇÃO INVÁLIDO',
  '43': 'PRAZO PARA BAIXA/DEVOLUÇÃO INVÁLIDO',
  '44': 'CÓDIGO DA MOEDA INVÁLIDO',
  '45': 'NOME DO PAGADOR NÃO INFORMADO',
  '46': 'TIPO/NÚMERO DE INSCRIÇÃO DO PAGADOR INVÁLIDOS',
  '47': 'ENDEREÇO DO PAGADOR NÃO INFORMADO',
  '48': 'CEP INVÁLIDO',
  '49': 'CEP SEM PRAÇA DE COBRANÇA (NÃO LOCALIZADO)',
  '50': 'CEP REFERENTE A UM BANCO CORRESPONDENTE',
  '51': 'CEP INCOMPATÍVEL COM A UNIDADE DA FEDERAÇÃO',
  '52': 'UNIDADE DA FEDERAÇÃO INVÁLIDA',
  '53': 'TIPO/NÚMERO DE INSCRIÇÃO DO SACADOR/AVALISTA INVÁLIDOS',
  '54': 'SACADOR/AVALISTA NÃO INFORMADO',
  '55': 'NOSSO NÚMERO NO BANCO CORRESPONDENTE NÃO INFORMADO',
  '56': 'CÓDIGO DO BANCO CORRESPONDENTE INVÁLIDO',
  '57': 'CÓDIGO DA MULTA INVÁLIDO',
  '58': 'DATA DA MULTA INVÁLIDA',
  '59': 'VALOR/PERCENTUAL DA MULTA INVÁLIDO',
  '60': 'MOVIMENTO PARA TÍTULO NÃO CADASTRADO',
  '61': 'ALTERAÇÃO DA AGÊNCIA COBRADORA/DV INVÁLIDA',
  '62': 'TIPO DE IMPRESSÃO INVÁLIDO',
  '63': 'ENTRADA PARA TÍTULO JÁ CADASTRADO',
  '64': 'NÚMERO DA LINHA INVÁLIDO',
  '65': 'CÓDIGO DO BANCO PARA DÉBITO INVÁLIDO',
  '66': 'AGÊNCIA/CONTA/DV PARA DÉBITO INVÁLIDO',
  '67': 'DADOS PARA DÉBITO INCOMPATÍVEL COM A IDENTIFICAÇÃO DA EMISSÃO DO BOLETO',
  '68': 'DÉBITO AUTOMÁTICO AGENDADO',
  '69': 'DÉBITO NÃO AGENDADO - ERRO NOS DADOS DA REMESSA',
  '70': 'DÉBITO NÃO AGENDADO - PAGADOR NÃO CONSTA NO CADASTRO DE AUTORIZANTE',
  '71': 'DÉBITO NÃO AGENDADO - BENEFICIÁRIO NÃO AUTORIZADO PELO PAGADOR',
  '72': 'DÉBITO NÃO AGENDADO - BENEFICIÁRIO NÃO PARTICIPA DA MODALIDADE DÉBITO AUTOMÁTICO',
  '73': 'DÉBITO NÃO AGENDADO - CÓDIGO DE MOEDA DIFERENTE DE REAL (R$)',
  '74': 'DÉBITO NÃO AGENDADO - DATA VENCIMENTO INVÁLIDA',
  '75': 'DÉBITO NÃO AGENDADO - CONFORME SEU PEDIDO, TÍTULO NÃO REGISTRADO',
  '76': 'DÉBITO NÃO AGENDADO - TIPO/NUM. INSCRIÇÃO DO DEBITADO, INVÁLIDO',
  '77': 'TRANSFERÊNCIA PARA DESCONTO NÃO PERMITIDA PARA A CARTEIRA DO TÍTULO',
  '78': 'DATA INFERIOR OU IGUAL AO VENCIMENTO PARA DÉBITO AUTOMÁTICO',
  '79': 'DATA JUROS DE MORA INVÁLIDO',
  '80': 'DATA DO DESCONTO INVÁLIDA',
  '81': 'TENTATIVAS DE DÉBITO ESGOTADAS - BAIXADO',
  '82': 'TENTATIVAS DE DÉBITO ESGOTADAS - PENDENTE',
  '83': 'LIMITE EXCEDIDO',
  '84': 'NÚMERO AUTORIZAÇÃO INEXISTENTE',
  '85': 'TÍTULO COM PAGAMENTO VINCULADO',
  '86': 'SEU NÚMERO INVÁLIDO',
  '87': 'E-MAIL/SMS ENVIADO',
  '88': 'E-MAIL LIDO',
  '89': 'E-MAIL/SMS DEVOLVIDO - ENDEREÇO DE E-MAIL OU NÚMERO DO CELULAR INEXISTENTE',
  '90': 'E-MAIL DEVOLVIDO - CAIXA POSTAL CHEIA',
  '91': 'E-MAIL/CELULAR DO PAGADOR NÃO INFORMADO',
  '92': 'PAGADOR OPTANTE POR BOLETO ELETRÔNICO - E-MAIL NÃO ENVIADO',
  '93': 'CÓDIGO PARA EMISSÃO DE BOLETO NÃO PERMITE ENVIO DE E-MAIL',
  '94': 'CÓDIGO DA CARTEIRA INVÁLIDO PARA ENVIO E-MAIL',
  '95': 'CONTRATO NÃO PERMITE O ENVIO DE E-MAIL',
  '96': 'NÚMERO DE CONTRATO INVÁLIDO',
  '97': 'REJEIÇÃO DA ALTERAÇÃO DO PRAZO LIMITE DE RECEBIMENTO',
  '98': 'REJEIÇÃO DE DISPENSA DE PRAZO LIMITE DE RECEBIMENTO',
  '99': 'REJEIÇÃO DA ALTERAÇÃO DO NÚMERO DO TÍTULO DADO PELO BENEFICIÁRIO',
};

// ===== ERROS =====

export interface SisprimeError extends Error {
  code?: string;
  status?: number;
  response?: unknown;
}

// ===== HELPERS =====

export function getSituacaoDescricao(codigo: string): string {
  return SISPRIME_SITUACOES[codigo] || `SITUAÇÃO DESCONHECIDA (${codigo})`;
}

export function getOcorrenciaDescricao(codigo: string): string {
  return SISPRIME_OCORRENCIAS_RETORNO[codigo] || `OCORRÊNCIA DESCONHECIDA (${codigo})`;
}

export function getMotivoDescricao(codigo: string): string {
  return SISPRIME_MOTIVOS_REJEICAO[codigo] || `MOTIVO DESCONHECIDO (${codigo})`;
}
