// =============================================
// PLANAC ERP - Banco do Brasil Integration Types
// Tipos para integração com API BB (Banco 001)
// Documentação: https://developers.bb.com.br
// =============================================

// ===== CONFIGURAÇÃO =====

export interface BancoBrasilConfig {
  /** Client ID obtido no portal developers */
  clientId: string;
  /** Client Secret obtido no portal developers */
  clientSecret: string;
  /** Developer Application Key */
  developerApplicationKey: string;
  /** Certificado digital em formato PEM (chave pública) */
  certificadoPem: string;
  /** Chave privada do certificado em formato PEM */
  chavePrivadaPem: string;
  /** Ambiente de execução */
  ambiente: 'homologacao' | 'producao';
  /** Número do convênio de cobrança */
  numeroConvenio: number;
  /** Número da carteira */
  numeroCarteira: number;
  /** Número da variação da carteira */
  numeroVariacaoCarteira: number;
  /** Agência */
  agencia: number;
  /** Conta corrente */
  contaCorrente: number;
}

export interface BancoBrasilEnv {
  BB_CLIENT_ID: string;
  BB_CLIENT_SECRET: string;
  BB_DEVELOPER_APPLICATION_KEY: string;
  BB_CERTIFICADO_PEM: string;
  BB_CHAVE_PRIVADA_PEM: string;
  BB_AMBIENTE?: 'homologacao' | 'producao';
  BB_NUMERO_CONVENIO: string;
  BB_NUMERO_CARTEIRA: string;
  BB_NUMERO_VARIACAO_CARTEIRA: string;
  BB_AGENCIA: string;
  BB_CONTA_CORRENTE: string;
}

// ===== URLs da API =====

export const BB_URLS = {
  homologacao: {
    auth: 'https://oauth.hm.bb.com.br/oauth/token',
    api: 'https://api.hm.bb.com.br/cobrancas/v2',
    pix: 'https://api.hm.bb.com.br/pix/v2',
  },
  producao: {
    auth: 'https://oauth.bb.com.br/oauth/token',
    api: 'https://api.bb.com.br/cobrancas/v2',
    pix: 'https://api.bb.com.br/pix/v2',
  },
};

// ===== ESCOPOS DA API =====

export const BB_ESCOPOS = {
  cobranca: 'cobrancas.boletos-info cobrancas.boletos-requisicao',
  pix: 'cob.write cob.read pix.write pix.read',
};

// ===== TOKEN DE ACESSO =====

export interface BancoBrasilTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ===== BOLETO - REGISTRO =====

export interface BBBoletoRegistro {
  /** Número do convênio */
  numeroConvenio: number;
  /** Número da carteira */
  numeroCarteira: number;
  /** Número da variação da carteira */
  numeroVariacaoCarteira: number;
  /** Código do canal */
  codigoModalidade: number;
  /** Data de emissão (dd.mm.aaaa) */
  dataEmissao: string;
  /** Data de vencimento (dd.mm.aaaa) */
  dataVencimento: string;
  /** Valor original do título */
  valorOriginal: number;
  /** Valor de abatimento */
  valorAbatimento?: number;
  /** Quantidade de dias para protesto */
  quantidadeDiasProtesto?: number;
  /** Quantidade de dias para negativação */
  quantidadeDiasNegativacao?: number;
  /** Órgão negativador: 1=SERASA */
  orgaoNegativador?: number;
  /** Indicador de aceite: A=Aceite, N=Não aceite */
  indicadorAceiteTituloVencido?: string;
  /** Número de dias limite para recebimento */
  numeroDiasLimiteRecebimento?: number;
  /** Código de aceite */
  codigoAceite?: string;
  /** Código do tipo de título */
  codigoTipoTitulo: number;
  /** Descrição do tipo de título */
  descricaoTipoTitulo?: string;
  /** Indicador de permissão para recebimento parcial */
  indicadorPermissaoRecebimentoParcial?: string;
  /** Número do título do beneficiário (seu número) */
  numeroTituloBeneficiario: string;
  /** Campo utilizado para informações do beneficiário */
  campoUtilizacaoBeneficiario?: string;
  /** Número do título do cliente */
  numeroTituloCliente: string;
  /** Mensagem do bloqueto */
  mensagemBloquetoOcorrencia?: string;
  
  // Desconto
  desconto?: BBDesconto;
  segundoDesconto?: BBDesconto;
  terceiroDesconto?: BBDesconto;
  
  // Juros
  jurosMora?: BBJurosMora;
  
  // Multa
  multa?: BBMulta;
  
  // Pagador
  pagador: BBPagador;
  
  // Beneficiário Final (avalista)
  beneficiarioFinal?: BBBeneficiarioFinal;
  
  // PIX
  indicadorPix?: string;
}

export interface BBDesconto {
  /** Tipo: 0=Sem desconto, 1=Valor fixo até data, 2=Percentual até data, 3=Valor por antecipação dia corrido */
  tipo: number;
  /** Data de expiração (dd.mm.aaaa) */
  dataExpiracao?: string;
  /** Percentual */
  porcentagem?: number;
  /** Valor */
  valor?: number;
}

export interface BBJurosMora {
  /** Tipo: 0=Dispensar, 1=Valor dia, 2=Taxa mensal, 3=Isento */
  tipo: number;
  /** Percentual */
  porcentagem?: number;
  /** Valor */
  valor?: number;
}

export interface BBMulta {
  /** Tipo: 0=Sem multa, 1=Valor fixo, 2=Percentual */
  tipo: number;
  /** Data de início (dd.mm.aaaa) */
  data?: string;
  /** Percentual */
  porcentagem?: number;
  /** Valor */
  valor?: number;
}

export interface BBPagador {
  /** Tipo de inscrição: 1=CPF, 2=CNPJ */
  tipoInscricao: number;
  /** Número do CPF ou CNPJ */
  numeroInscricao: number;
  /** Nome */
  nome: string;
  /** Endereço */
  endereco: string;
  /** CEP */
  cep: number;
  /** Cidade */
  cidade: string;
  /** Bairro */
  bairro: string;
  /** UF */
  uf: string;
  /** Telefone */
  telefone?: string;
}

export interface BBBeneficiarioFinal {
  /** Tipo de inscrição: 1=CPF, 2=CNPJ */
  tipoInscricao: number;
  /** Número do CPF ou CNPJ */
  numeroInscricao: number;
  /** Nome */
  nome: string;
}

// ===== BOLETO - RESPOSTA =====

export interface BBBoletoResponse {
  /** Número do boleto */
  numero: string;
  /** Número do convênio */
  numeroConvenio: number;
  /** Número da carteira */
  numeroCarteira: number;
  /** Número da variação da carteira */
  numeroVariacaoCarteira: number;
  /** Código de barras */
  codigoBarraNumerico: string;
  /** Linha digitável */
  linhaDigitavel: string;
  /** Data de registro */
  dataRegistro: string;
  /** Data de vencimento */
  dataVencimento: string;
  /** Valor original */
  valorOriginal: number;
  /** Código do cliente */
  codigoCliente: number;
  /** QR Code PIX */
  qrCode?: {
    url: string;
    txId: string;
    emv: string;
  };
}

export interface BBBoletoConsulta {
  /** Número do boleto */
  numero: string;
  /** Data de registro */
  dataRegistro: string;
  /** Data de vencimento */
  dataVencimento: string;
  /** Valor original */
  valorOriginal: number;
  /** Valor atual */
  valorAtual: number;
  /** Valor pago */
  valorPago?: number;
  /** Data de pagamento */
  dataPagamento?: string;
  /** Data de crédito */
  dataCredito?: string;
  /** Código de barras */
  codigoBarraNumerico: string;
  /** Linha digitável */
  linhaDigitavel: string;
  /** Código de estado do título */
  codigoEstadoTituloCobranca: number;
  /** Descrição do estado */
  estadoTituloCobranca: string;
  /** QR Code PIX */
  qrCode?: {
    url: string;
    txId: string;
    emv: string;
  };
  /** Dados do pagador */
  pagador: BBPagador;
}

// ===== PIX - COBRANÇA =====

export interface BBPixCob {
  /** Calendário */
  calendario: {
    expiracao: number;
  };
  /** Devedor */
  devedor?: {
    cpf?: string;
    cnpj?: string;
    nome: string;
  };
  /** Valor */
  valor: {
    original: string;
  };
  /** Chave PIX */
  chave: string;
  /** Solicitação ao pagador */
  solicitacaoPagador?: string;
  /** Informações adicionais */
  infoAdicionais?: Array<{
    nome: string;
    valor: string;
  }>;
}

export interface BBPixCobResponse {
  /** Calendário */
  calendario: {
    criacao: string;
    expiracao: number;
  };
  /** TXID */
  txid: string;
  /** Revisão */
  revisao: number;
  /** Location */
  loc: {
    id: number;
    location: string;
    tipoCob: string;
  };
  /** Location URL */
  location: string;
  /** Status */
  status: string;
  /** Devedor */
  devedor?: {
    cpf?: string;
    cnpj?: string;
    nome: string;
  };
  /** Valor */
  valor: {
    original: string;
  };
  /** Chave */
  chave: string;
  /** PIX Copia e Cola */
  pixCopiaECola: string;
}

// ===== WEBHOOK =====

export interface BBWebhookBoleto {
  /** Número do boleto */
  numero: string;
  /** Código do estado */
  codigoEstadoTituloCobranca: number;
  /** Descrição do estado */
  estadoTituloCobranca: string;
  /** Data de pagamento */
  dataPagamento?: string;
  /** Valor pago */
  valorPago?: number;
  /** Data de crédito */
  dataCredito?: string;
}

export interface BBWebhookPix {
  /** End to End ID */
  endToEndId: string;
  /** TXID */
  txid: string;
  /** Valor */
  valor: string;
  /** Horário */
  horario: string;
  /** Info do pagador */
  infoPagador?: string;
  /** Pagador */
  pagador?: {
    cpf?: string;
    cnpj?: string;
    nome: string;
  };
}

// ===== ESTADOS DO TÍTULO =====

export const BB_ESTADOS_TITULO: Record<number, string> = {
  1: 'Normal',
  2: 'Movimento Cartório',
  3: 'Em Cartório',
  4: 'Título com Ocorrência de Cartório',
  5: 'Protestado Eletrônico',
  6: 'Liquidado',
  7: 'Baixado',
  8: 'Título com Pendência de Cartório',
  9: 'Título Protestado Manual',
  10: 'Título Baixado/Pago em Cartório',
  11: 'Título Liquidado/Protestado',
  12: 'Título Liquid./Pgcrto',
  13: 'Título Protestado Aguardando Baixa',
  14: 'Título em Liquidação',
  15: 'Título Agendado',
  16: 'Título Creditado',
  17: 'Pago em Cheque - Loss',
  18: 'Pago em Cheque - Vinculado',
};

// ===== TIPOS DE TÍTULO =====

export const BB_TIPOS_TITULO: Record<number, string> = {
  1: 'Cheque',
  2: 'Duplicata Mercantil',
  3: 'Duplicata Mtil por Indicação',
  4: 'Duplicata de Serviço',
  5: 'Duplicata de Srvc p/ Indicação',
  6: 'Duplicata Rural',
  7: 'Letra de Câmbio',
  8: 'Nota de Crédito Comercial',
  9: 'Nota de Crédito a Exportação',
  10: 'Nota de Crédito Indultrial',
  11: 'Nota de Crédito Rural',
  12: 'Nota Promissória',
  13: 'Nota Promissória Rural',
  14: 'Triplicata Mercantil',
  15: 'Triplicata de Serviço',
  16: 'Nota de Seguro',
  17: 'Recibo',
  18: 'Fatura',
  19: 'Nota de Débito',
  20: 'Apólice de Seguro',
  21: 'Mensalidade Escolar',
  22: 'Parcela de Consórcio',
  23: 'Dívida Ativa da União',
  24: 'Dívida Ativa de Estado',
  25: 'Dívida Ativa de Município',
  31: 'Cartão de Crédito',
  32: 'Boleto de Proposta',
  33: 'Boleto Aporte',
  99: 'Outros',
};

// ===== ERROS =====

export interface BBError {
  erros: Array<{
    codigo: string;
    versao: string;
    mensagem: string;
    ocorrencia: string;
  }>;
}

export class BancoBrasilApiError extends Error {
  constructor(
    public codigo: string,
    public mensagem: string,
    public ocorrencia?: string
  ) {
    super(`[${codigo}] ${mensagem}${ocorrencia ? ` (${ocorrencia})` : ''}`);
    this.name = 'BancoBrasilApiError';
  }
}

// ===== HELPERS =====

export function getEstadoDescricao(codigo: number): string {
  return BB_ESTADOS_TITULO[codigo] || `Estado ${codigo}`;
}

export function getTipoTituloDescricao(codigo: number): string {
  return BB_TIPOS_TITULO[codigo] || `Tipo ${codigo}`;
}

/**
 * Verifica se o título está liquidado
 */
export function isTituloLiquidado(codigoEstado: number): boolean {
  return [6, 10, 11, 12, 14, 16].includes(codigoEstado);
}

/**
 * Verifica se o título está baixado
 */
export function isTituloBaixado(codigoEstado: number): boolean {
  return codigoEstado === 7;
}
