// =============================================
// PLANAC ERP - Caixa Econômica Federal Integration Types
// Tipos para integração com API Caixa (Banco 104)
// Documentação: SIGCB - Sistema de Gestão de Cobrança Bancária
// =============================================

// ===== CONFIGURAÇÃO =====

export interface CaixaConfig {
  /** Código do beneficiário */
  codigoBeneficiario: string;
  /** CNPJ do beneficiário */
  cnpjBeneficiario: string;
  /** Unidade (agência) */
  unidade: string;
  /** Código do convênio */
  codigoConvenio: string;
  /** Certificado digital em formato PEM (chave pública) */
  certificadoPem: string;
  /** Chave privada do certificado em formato PEM */
  chavePrivadaPem: string;
  /** Ambiente de execução */
  ambiente: 'homologacao' | 'producao';
  /** Client ID para OAuth2 */
  clientId: string;
  /** Client Secret para OAuth2 */
  clientSecret: string;
}

export interface CaixaEnv {
  CAIXA_CODIGO_BENEFICIARIO: string;
  CAIXA_CNPJ_BENEFICIARIO: string;
  CAIXA_UNIDADE: string;
  CAIXA_CODIGO_CONVENIO: string;
  CAIXA_CERTIFICADO_PEM: string;
  CAIXA_CHAVE_PRIVADA_PEM: string;
  CAIXA_AMBIENTE?: 'homologacao' | 'producao';
  CAIXA_CLIENT_ID: string;
  CAIXA_CLIENT_SECRET: string;
}

// ===== URLs da API =====

export const CAIXA_URLS = {
  homologacao: {
    auth: 'https://oauth.hom.caixa.gov.br/oauth/token',
    api: 'https://apihom.caixa.gov.br/cobranca-bancaria/v2',
    pix: 'https://apihom.caixa.gov.br/pix/v2',
    soap: 'https://barramento.caixa.gov.br/sibar/ManutencaoCobrancaBancaria/Boleto/Externo',
  },
  producao: {
    auth: 'https://oauth.caixa.gov.br/oauth/token',
    api: 'https://api.caixa.gov.br/cobranca-bancaria/v2',
    pix: 'https://api.caixa.gov.br/pix/v2',
    soap: 'https://barramento.caixa.gov.br/sibar/ManutencaoCobrancaBancaria/Boleto/Externo',
  },
};

// ===== TOKEN DE ACESSO =====

export interface CaixaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// ===== BOLETO - REGISTRO =====

export interface CaixaBoletoRegistro {
  /** Código do beneficiário */
  codigoBeneficiario: string;
  /** Unidade (agência) */
  unidade: string;
  /** Nosso número (17 dígitos) */
  nossoNumero: string;
  /** Número do documento */
  numeroDocumento: string;
  /** Data de emissão (YYYY-MM-DD) */
  dataEmissao: string;
  /** Data de vencimento (YYYY-MM-DD) */
  dataVencimento: string;
  /** Valor do título */
  valor: number;
  /** Tipo de espécie: 01=CH, 02=DM, 03=DMI, 04=DS, 05=DSI, 06=DR, 07=LC, 08=NCC, 09=NCE, 10=NCI, 11=NCR, 12=NP, 13=NPR, 14=TM, 15=TS, 16=NS, 17=RC, 18=FAT, 19=ND, 20=AP, 21=ME, 22=PC, 23=NF, 24=DD, 25=CC, 31=BP, 32=OU */
  tipoEspecie: string;
  /** Flag para aceite: S ou N */
  flagAceite: string;
  /** Data limite para pagamento (YYYY-MM-DD) */
  dataLimitePagamento?: string;
  
  // Pagador
  pagador: CaixaPagador;
  
  // Sacador Avalista (opcional)
  sacadorAvalista?: CaixaSacadorAvalista;
  
  // Juros
  juros?: CaixaJuros;
  
  // Multa
  multa?: CaixaMulta;
  
  // Desconto
  desconto?: CaixaDesconto;
  
  // Abatimento
  valorAbatimento?: number;
  
  // Mensagens
  mensagens?: string[];
  
  // PIX
  gerarPix?: boolean;
}

export interface CaixaPagador {
  /** Tipo de inscrição: 1=CPF, 2=CNPJ */
  tipoInscricao: string;
  /** Número do CPF ou CNPJ */
  numeroInscricao: string;
  /** Nome */
  nome: string;
  /** Endereço */
  endereco: string;
  /** Bairro */
  bairro: string;
  /** Cidade */
  cidade: string;
  /** UF */
  uf: string;
  /** CEP */
  cep: string;
}

export interface CaixaSacadorAvalista {
  /** Tipo de inscrição: 1=CPF, 2=CNPJ */
  tipoInscricao: string;
  /** Número do CPF ou CNPJ */
  numeroInscricao: string;
  /** Nome */
  nome: string;
}

export interface CaixaJuros {
  /** Tipo: 1=Valor por dia, 2=Taxa mensal, 3=Isento */
  tipo: string;
  /** Data de início (YYYY-MM-DD) */
  data?: string;
  /** Valor ou percentual */
  valor?: number;
}

export interface CaixaMulta {
  /** Tipo: 1=Valor fixo, 2=Percentual */
  tipo: string;
  /** Data de início (YYYY-MM-DD) */
  data?: string;
  /** Valor ou percentual */
  valor?: number;
}

export interface CaixaDesconto {
  /** Tipo: 1=Valor fixo até data, 2=Percentual até data, 3=Valor por antecipação */
  tipo: string;
  /** Data limite (YYYY-MM-DD) */
  data?: string;
  /** Valor ou percentual */
  valor?: number;
}

// ===== BOLETO - RESPOSTA =====

export interface CaixaBoletoResponse {
  /** Código de retorno */
  codigoRetorno: string;
  /** Mensagem de retorno */
  mensagemRetorno: string;
  /** Nosso número */
  nossoNumero: string;
  /** Código de barras */
  codigoBarras: string;
  /** Linha digitável */
  linhaDigitavel: string;
  /** Data de vencimento */
  dataVencimento: string;
  /** Valor */
  valor: number;
  /** QR Code PIX (se gerarPix=true) */
  qrCode?: string;
  /** URL do QR Code */
  urlQrCode?: string;
}

export interface CaixaBoletoConsulta {
  /** Nosso número */
  nossoNumero: string;
  /** Número do documento */
  numeroDocumento: string;
  /** Data de emissão */
  dataEmissao: string;
  /** Data de vencimento */
  dataVencimento: string;
  /** Valor nominal */
  valor: number;
  /** Valor pago */
  valorPago?: number;
  /** Data de pagamento */
  dataPagamento?: string;
  /** Data de crédito */
  dataCredito?: string;
  /** Código de barras */
  codigoBarras: string;
  /** Linha digitável */
  linhaDigitavel: string;
  /** Situação */
  situacao: string;
  /** Código da situação */
  codigoSituacao: string;
  /** QR Code PIX */
  qrCode?: string;
  /** Dados do pagador */
  pagador: CaixaPagador;
}

// ===== PIX - COBRANÇA =====

export interface CaixaPixCob {
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

export interface CaixaPixCobResponse {
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

export interface CaixaWebhookBoleto {
  /** Nosso número */
  nossoNumero: string;
  /** Número do documento */
  numeroDocumento: string;
  /** Situação */
  situacao: string;
  /** Código da situação */
  codigoSituacao: string;
  /** Data de pagamento */
  dataPagamento?: string;
  /** Valor pago */
  valorPago?: number;
  /** Data de crédito */
  dataCredito?: string;
}

export interface CaixaWebhookPix {
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

// ===== SITUAÇÕES DO TÍTULO =====

export const CAIXA_SITUACOES: Record<string, string> = {
  '01': 'Em Aberto',
  '02': 'Baixado',
  '03': 'Liquidado',
  '04': 'Protestado',
  '05': 'Rejeitado',
  '06': 'Negativado',
  '07': 'Expirado',
};

// ===== TIPOS DE ESPÉCIE =====

export const CAIXA_ESPECIES: Record<string, string> = {
  '01': 'CH - Cheque',
  '02': 'DM - Duplicata Mercantil',
  '03': 'DMI - Duplicata Mercantil p/ Indicação',
  '04': 'DS - Duplicata de Serviço',
  '05': 'DSI - Duplicata de Serviço p/ Indicação',
  '06': 'DR - Duplicata Rural',
  '07': 'LC - Letra de Câmbio',
  '08': 'NCC - Nota de Crédito Comercial',
  '09': 'NCE - Nota de Crédito a Exportação',
  '10': 'NCI - Nota de Crédito Industrial',
  '11': 'NCR - Nota de Crédito Rural',
  '12': 'NP - Nota Promissória',
  '13': 'NPR - Nota Promissória Rural',
  '14': 'TM - Triplicata Mercantil',
  '15': 'TS - Triplicata de Serviço',
  '16': 'NS - Nota de Seguro',
  '17': 'RC - Recibo',
  '18': 'FAT - Fatura',
  '19': 'ND - Nota de Débito',
  '20': 'AP - Apólice de Seguro',
  '21': 'ME - Mensalidade Escolar',
  '22': 'PC - Parcela de Consórcio',
  '23': 'NF - Nota Fiscal',
  '24': 'DD - Documento de Dívida',
  '25': 'CC - Cartão de Crédito',
  '31': 'BP - Boleto de Proposta',
  '32': 'OU - Outros',
};

// ===== ERROS =====

export interface CaixaError {
  codigo: string;
  mensagem: string;
  detalhe?: string;
}

export class CaixaApiError extends Error {
  constructor(
    public codigo: string,
    public mensagem: string,
    public detalhe?: string
  ) {
    super(`[${codigo}] ${mensagem}${detalhe ? `: ${detalhe}` : ''}`);
    this.name = 'CaixaApiError';
  }
}

// ===== HELPERS =====

export function getSituacaoDescricao(codigo: string): string {
  return CAIXA_SITUACOES[codigo] || `Situação ${codigo}`;
}

export function getEspecieDescricao(codigo: string): string {
  return CAIXA_ESPECIES[codigo] || `Espécie ${codigo}`;
}

/**
 * Verifica se o título está liquidado
 */
export function isTituloLiquidado(codigoSituacao: string): boolean {
  return codigoSituacao === '03';
}

/**
 * Verifica se o título está baixado
 */
export function isTituloBaixado(codigoSituacao: string): boolean {
  return codigoSituacao === '02';
}

/**
 * Verifica se o título foi rejeitado
 */
export function isTituloRejeitado(codigoSituacao: string): boolean {
  return codigoSituacao === '05';
}
