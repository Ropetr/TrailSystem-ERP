// =============================================
// PLANAC ERP - Banco Safra Integration Types
// Tipos para integração com API Safra (Banco 422)
// Documentação: https://developers.safra.com.br
// =============================================

// ===== CONFIGURAÇÃO =====

export interface SafraConfig {
  /** Client ID obtido no portal developers */
  clientId: string;
  /** Client Secret obtido no portal developers */
  clientSecret: string;
  /** Certificado digital em formato PEM (chave pública) */
  certificadoPem: string;
  /** Chave privada do certificado em formato PEM */
  chavePrivadaPem: string;
  /** Ambiente de execução */
  ambiente: 'homologacao' | 'producao';
  /** Código do beneficiário */
  codigoBeneficiario: string;
  /** Agência */
  agencia: string;
  /** Conta corrente */
  contaCorrente: string;
  /** Código da carteira */
  carteira: string;
}

export interface SafraEnv {
  SAFRA_CLIENT_ID: string;
  SAFRA_CLIENT_SECRET: string;
  SAFRA_CERTIFICADO_PEM: string;
  SAFRA_CHAVE_PRIVADA_PEM: string;
  SAFRA_AMBIENTE?: 'homologacao' | 'producao';
  SAFRA_CODIGO_BENEFICIARIO: string;
  SAFRA_AGENCIA: string;
  SAFRA_CONTA_CORRENTE: string;
  SAFRA_CARTEIRA: string;
}

// ===== URLs da API =====

export const SAFRA_URLS = {
  homologacao: {
    auth: 'https://idcs-902a944ff6854c5fbe94750e48d66be5.identity.oraclecloud.com/oauth2/v1/token',
    api: 'https://api-sandbox.safra.com.br/cobranca/v1',
    pix: 'https://api-sandbox.safra.com.br/pix/v1',
  },
  producao: {
    auth: 'https://idcs-902a944ff6854c5fbe94750e48d66be5.identity.oraclecloud.com/oauth2/v1/token',
    api: 'https://api.safra.com.br/cobranca/v1',
    pix: 'https://api.safra.com.br/pix/v1',
  },
};

// ===== ESCOPOS DA API =====

export const SAFRA_ESCOPOS = {
  cobranca: 'cobranca',
  pix: 'pix',
};

// ===== TOKEN DE ACESSO =====

export interface SafraTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// ===== BOLETO - REGISTRO =====

export interface SafraBoletoRegistro {
  /** Código do beneficiário */
  codigoBeneficiario: string;
  /** Nosso número */
  nossoNumero: string;
  /** Seu número (número do documento) */
  seuNumero: string;
  /** Data de emissão (YYYY-MM-DD) */
  dataEmissao: string;
  /** Data de vencimento (YYYY-MM-DD) */
  dataVencimento: string;
  /** Valor do título */
  valorNominal: number;
  /** Tipo de espécie: DM, DS, NP, RC, etc. */
  especieDocumento: string;
  /** Aceite: A ou N */
  aceite: string;
  /** Data limite para pagamento (YYYY-MM-DD) */
  dataLimitePagamento?: string;
  
  // Pagador
  pagador: SafraPagador;
  
  // Beneficiário Final (avalista)
  beneficiarioFinal?: SafraBeneficiarioFinal;
  
  // Juros
  juros?: SafraJuros;
  
  // Multa
  multa?: SafraMulta;
  
  // Desconto
  desconto?: SafraDesconto;
  
  // Abatimento
  valorAbatimento?: number;
  
  // Mensagens
  instrucoes?: string[];
  
  // PIX
  gerarQrCode?: boolean;
}

export interface SafraPagador {
  /** Tipo de pessoa: F=Física, J=Jurídica */
  tipoPessoa: 'F' | 'J';
  /** CPF ou CNPJ */
  cpfCnpj: string;
  /** Nome/Razão Social */
  nome: string;
  /** Endereço */
  endereco: string;
  /** Número */
  numero?: string;
  /** Complemento */
  complemento?: string;
  /** Bairro */
  bairro: string;
  /** Cidade */
  cidade: string;
  /** UF */
  uf: string;
  /** CEP */
  cep: string;
  /** Email */
  email?: string;
  /** Telefone */
  telefone?: string;
}

export interface SafraBeneficiarioFinal {
  /** Tipo de pessoa: F=Física, J=Jurídica */
  tipoPessoa: 'F' | 'J';
  /** CPF ou CNPJ */
  cpfCnpj: string;
  /** Nome/Razão Social */
  nome: string;
}

export interface SafraJuros {
  /** Tipo: 1=Valor por dia, 2=Taxa mensal, 3=Isento */
  tipo: number;
  /** Data de início (YYYY-MM-DD) */
  data?: string;
  /** Valor ou taxa */
  valor?: number;
}

export interface SafraMulta {
  /** Tipo: 1=Valor fixo, 2=Percentual */
  tipo: number;
  /** Data de início (YYYY-MM-DD) */
  data?: string;
  /** Valor ou percentual */
  valor?: number;
}

export interface SafraDesconto {
  /** Tipo: 1=Valor fixo até data, 2=Percentual até data, 3=Valor por antecipação */
  tipo: number;
  /** Data limite (YYYY-MM-DD) */
  data?: string;
  /** Valor ou percentual */
  valor?: number;
}

// ===== BOLETO - RESPOSTA =====

export interface SafraBoletoResponse {
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
  /** Valor nominal */
  valorNominal: number;
  /** QR Code PIX (se gerarQrCode=true) */
  qrCode?: string;
  /** EMV do PIX */
  emvQrCode?: string;
}

export interface SafraBoletoConsulta {
  /** Nosso número */
  nossoNumero: string;
  /** Seu número */
  seuNumero: string;
  /** Data de emissão */
  dataEmissao: string;
  /** Data de vencimento */
  dataVencimento: string;
  /** Valor nominal */
  valorNominal: number;
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
  /** EMV do PIX */
  emvQrCode?: string;
  /** Dados do pagador */
  pagador: SafraPagador;
}

// ===== PIX - COBRANÇA =====

export interface SafraPixCob {
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

export interface SafraPixCobResponse {
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

export interface SafraWebhookBoleto {
  /** Nosso número */
  nossoNumero: string;
  /** Seu número */
  seuNumero: string;
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

export interface SafraWebhookPix {
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

export const SAFRA_SITUACOES: Record<string, string> = {
  '01': 'Em Aberto',
  '02': 'Baixado',
  '03': 'Liquidado',
  '04': 'Protestado',
  '05': 'Rejeitado',
  '06': 'Em Cartório',
  '07': 'Expirado',
};

// ===== TIPOS DE ESPÉCIE =====

export const SAFRA_ESPECIES: Record<string, string> = {
  DM: 'Duplicata Mercantil',
  DS: 'Duplicata de Serviço',
  NP: 'Nota Promissória',
  RC: 'Recibo',
  FAT: 'Fatura',
  ND: 'Nota de Débito',
  CH: 'Cheque',
  LC: 'Letra de Câmbio',
  OU: 'Outros',
};

// ===== ERROS =====

export interface SafraError {
  codigo: string;
  mensagem: string;
  detalhe?: string;
}

export class SafraApiError extends Error {
  constructor(
    public codigo: string,
    public mensagem: string,
    public detalhe?: string
  ) {
    super(`[${codigo}] ${mensagem}${detalhe ? `: ${detalhe}` : ''}`);
    this.name = 'SafraApiError';
  }
}

// ===== HELPERS =====

export function getSituacaoDescricao(codigo: string): string {
  return SAFRA_SITUACOES[codigo] || `Situação ${codigo}`;
}

export function getEspecieDescricao(codigo: string): string {
  return SAFRA_ESPECIES[codigo] || `Espécie ${codigo}`;
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

/**
 * Verifica se o título está em cartório
 */
export function isTituloEmCartorio(codigoSituacao: string): boolean {
  return codigoSituacao === '06';
}
