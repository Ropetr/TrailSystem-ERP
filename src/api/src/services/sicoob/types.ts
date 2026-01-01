// =============================================
// PLANAC ERP - Sicoob Integration Types
// Tipos para integração com API Sicoob (Banco 756)
// Documentação: https://developers.sicoob.com.br
// =============================================

// ===== CONFIGURAÇÃO =====

export interface SicoobConfig {
  /** Client ID obtido no portal developers */
  clientId: string;
  /** Certificado digital em formato PEM (chave pública) */
  certificadoPem: string;
  /** Chave privada do certificado em formato PEM */
  chavePrivadaPem: string;
  /** Ambiente de execução */
  ambiente: 'homologacao' | 'producao';
  /** Número do cooperado */
  numeroCooperado: number;
  /** Número da conta corrente */
  contaCorrente: number;
}

export interface SicoobEnv {
  SICOOB_CLIENT_ID: string;
  SICOOB_CERTIFICADO_PEM: string;
  SICOOB_CHAVE_PRIVADA_PEM: string;
  SICOOB_AMBIENTE?: 'homologacao' | 'producao';
  SICOOB_NUMERO_COOPERADO: string;
  SICOOB_CONTA_CORRENTE: string;
}

// ===== URLs da API =====

export const SICOOB_URLS = {
  homologacao: {
    auth: 'https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token',
    api: 'https://sandbox.sicoob.com.br/sicoob/cobranca-bancaria/v3',
  },
  producao: {
    auth: 'https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token',
    api: 'https://api.sicoob.com.br/cobranca-bancaria/v3',
  },
};

// ===== ESCOPOS DA API =====

export const SICOOB_ESCOPOS = [
  'cobranca_boletos_consultar',
  'cobranca_boletos_incluir',
  'cobranca_boletos_pagador',
  'cobranca_boletos_segunda_via',
  'cobranca_boletos_descontos',
  'cobranca_boletos_abatimentos',
  'cobranca_boletos_valor_nominal',
  'cobranca_boletos_seu_numero',
  'cobranca_boletos_especie_documento',
  'cobranca_boletos_baixa',
  'cobranca_boletos_rateio_credito',
  'cobranca_pagadores',
  'cob.write',
  'cob.read',
  'pix.write',
  'pix.read',
];

// ===== TOKEN DE ACESSO =====

export interface SicoobTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  'not-before-policy': number;
  scope: string;
}

// ===== DADOS DO BENEFICIÁRIO =====

export interface SicoobBeneficiario {
  /** Número do cooperado */
  numeroCooperado: number;
  /** Número da conta corrente */
  contaCorrente: number;
}

// ===== BOLETO - INCLUSÃO =====

export interface SicoobBoletoInclusao {
  /** Número do cliente (seu número) - até 25 caracteres */
  numeroCliente: string;
  /** Data de emissão (YYYY-MM-DD) */
  dataEmissao: string;
  /** Data de vencimento (YYYY-MM-DD) */
  dataVencimento: string;
  /** Valor nominal do título */
  valorNominal: number;
  /** Tipo de espécie do documento */
  tipoEspecieDocumento: number;
  /** Flag para gerar PIX junto com boleto */
  gerarPix?: boolean;
  /** Número de dias para negativação */
  numeroDiasNegativacao?: number;
  
  // Pagador
  pagador: SicoobPagador;
  
  // Mensagens
  mensagensInstrucao?: SicoobMensagemInstrucao;
  
  // Desconto
  desconto1?: SicoobDesconto;
  desconto2?: SicoobDesconto;
  desconto3?: SicoobDesconto;
  
  // Multa
  multa?: SicoobMulta;
  
  // Juros
  jurosMora?: SicoobJurosMora;
  
  // Abatimento
  valorAbatimento?: number;
}

export interface SicoobPagador {
  /** Número do CPF ou CNPJ */
  numeroCpfCnpj: string;
  /** Nome do pagador */
  nome: string;
  /** Endereço */
  endereco: string;
  /** Bairro */
  bairro: string;
  /** Cidade */
  cidade: string;
  /** CEP */
  cep: string;
  /** UF */
  uf: string;
  /** Email */
  email?: string;
}

export interface SicoobMensagemInstrucao {
  mensagem1?: string;
  mensagem2?: string;
  mensagem3?: string;
  mensagem4?: string;
  mensagem5?: string;
}

export interface SicoobDesconto {
  /** Tipo: 1=Valor fixo, 2=Percentual */
  tipo: number;
  /** Data limite para desconto */
  data: string;
  /** Valor ou percentual */
  valor: number;
}

export interface SicoobMulta {
  /** Tipo: 1=Valor fixo, 2=Percentual */
  tipo: number;
  /** Data de início da multa */
  data: string;
  /** Valor ou percentual */
  valor: number;
}

export interface SicoobJurosMora {
  /** Tipo: 1=Valor por dia, 2=Taxa mensal, 3=Isento */
  tipo: number;
  /** Data de início dos juros */
  data: string;
  /** Valor ou taxa */
  valor: number;
}

// ===== BOLETO - RESPOSTA =====

export interface SicoobBoletoResponse {
  /** Nosso número gerado */
  nossoNumero: number;
  /** Código de barras */
  codigoBarras: string;
  /** Linha digitável */
  linhaDigitavel: string;
  /** QR Code PIX (se gerarPix=true) */
  qrCode?: string;
  /** Situação do boleto */
  situacaoBoleto: string;
}

export interface SicoobBoletoConsulta {
  nossoNumero: number;
  seuNumero: string;
  codigoBarras: string;
  linhaDigitavel: string;
  dataEmissao: string;
  dataVencimento: string;
  valorNominal: number;
  valorAbatimento?: number;
  valorDesconto?: number;
  valorPago?: number;
  dataPagamento?: string;
  situacaoBoleto: string;
  qrCode?: string;
  pagador: SicoobPagador;
}

// ===== PIX - COBRANÇA =====

export interface SicoobPixCob {
  /** Chave PIX do recebedor */
  chave: string;
  /** Valor da cobrança */
  valor: {
    original: string;
  };
  /** Informações adicionais */
  infoAdicionais?: Array<{
    nome: string;
    valor: string;
  }>;
  /** Devedor */
  devedor?: {
    cpf?: string;
    cnpj?: string;
    nome: string;
  };
  /** Solicitação ao pagador */
  solicitacaoPagador?: string;
  /** Calendário */
  calendario?: {
    expiracao?: number;
    dataDeVencimento?: string;
  };
}

export interface SicoobPixCobResponse {
  txid: string;
  revisao: number;
  calendario: {
    criacao: string;
    expiracao: number;
  };
  devedor?: {
    cpf?: string;
    cnpj?: string;
    nome: string;
  };
  valor: {
    original: string;
  };
  chave: string;
  solicitacaoPagador?: string;
  infoAdicionais?: Array<{
    nome: string;
    valor: string;
  }>;
  loc: {
    id: number;
    location: string;
    tipoCob: string;
    criacao: string;
  };
  location: string;
  status: string;
  pixCopiaECola: string;
}

// ===== WEBHOOK =====

export interface SicoobWebhookBoleto {
  nossoNumero: number;
  seuNumero: string;
  situacaoBoleto: string;
  dataPagamento?: string;
  valorPago?: number;
  valorTarifa?: number;
}

export interface SicoobWebhookPix {
  endToEndId: string;
  txid: string;
  valor: string;
  horario: string;
  pagador?: {
    cpf?: string;
    cnpj?: string;
    nome: string;
  };
  infoPagador?: string;
}

// ===== SITUAÇÕES DO BOLETO =====

export const SICOOB_SITUACOES_BOLETO: Record<string, string> = {
  'EM_ABERTO': 'Em Aberto',
  'BAIXADO': 'Baixado',
  'LIQUIDADO': 'Liquidado',
  'PROTESTADO': 'Protestado',
  'NEGATIVADO': 'Negativado',
  'EXPIRADO': 'Expirado',
};

// ===== TIPOS DE ESPÉCIE DE DOCUMENTO =====

export const SICOOB_ESPECIES_DOCUMENTO: Record<number, string> = {
  1: 'CH - Cheque',
  2: 'DM - Duplicata Mercantil',
  3: 'DMI - Duplicata Mercantil p/ Indicação',
  4: 'DS - Duplicata de Serviço',
  5: 'DSI - Duplicata de Serviço p/ Indicação',
  6: 'DR - Duplicata Rural',
  7: 'LC - Letra de Câmbio',
  8: 'NCC - Nota de Crédito Comercial',
  9: 'NCE - Nota de Crédito a Exportação',
  10: 'NCI - Nota de Crédito Industrial',
  11: 'NCR - Nota de Crédito Rural',
  12: 'NP - Nota Promissória',
  13: 'NPR - Nota Promissória Rural',
  14: 'TM - Triplicata Mercantil',
  15: 'TS - Triplicata de Serviço',
  16: 'NS - Nota de Seguro',
  17: 'RC - Recibo',
  18: 'FAT - Fatura',
  19: 'ND - Nota de Débito',
  20: 'AP - Apólice de Seguro',
  21: 'ME - Mensalidade Escolar',
  22: 'PC - Parcela de Consórcio',
  23: 'NF - Nota Fiscal',
  24: 'DD - Documento de Dívida',
  25: 'CC - Cartão de Crédito',
  31: 'BP - Boleto de Proposta',
  32: 'OU - Outros',
};

// ===== ERROS =====

export interface SicoobError {
  codigo: string;
  mensagem: string;
  detalhe?: string;
}

export class SicoobApiError extends Error {
  constructor(
    public codigo: string,
    public mensagem: string,
    public detalhe?: string
  ) {
    super(`[${codigo}] ${mensagem}${detalhe ? `: ${detalhe}` : ''}`);
    this.name = 'SicoobApiError';
  }
}

// ===== HELPERS =====

export function getSituacaoDescricao(situacao: string): string {
  return SICOOB_SITUACOES_BOLETO[situacao] || situacao;
}

export function getEspecieDescricao(tipo: number): string {
  return SICOOB_ESPECIES_DOCUMENTO[tipo] || `Tipo ${tipo}`;
}
