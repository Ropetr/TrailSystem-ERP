// =============================================
// PLANAC ERP - Sicoob Webhook Service
// Processamento de webhooks do Sicoob
// =============================================

import {
  SicoobWebhookBoleto,
  SicoobWebhookPix,
  SicoobApiError,
} from './types';

// ===== TIPOS DE WEBHOOK =====

export interface SicoobWebhookPayload {
  /** Tipo do webhook: boleto ou pix */
  tipo: 'boleto' | 'pix';
  /** Dados do boleto (se tipo = boleto) */
  boleto?: SicoobWebhookBoleto;
  /** Dados do PIX (se tipo = pix) */
  pix?: SicoobWebhookPix;
  /** Timestamp do evento */
  timestamp: string;
}

export interface WebhookProcessResult {
  success: boolean;
  tipo: 'boleto' | 'pix';
  idExterno: string;
  acao: string;
  dados: {
    nossoNumero?: string;
    txid?: string;
    valorPago?: number;
    dataPagamento?: string;
    situacao?: string;
  };
  erros?: string[];
}

// ===== PROCESSAMENTO DE WEBHOOK =====

/**
 * Processa webhook recebido do Sicoob
 */
export function processWebhook(payload: SicoobWebhookPayload): WebhookProcessResult {
  if (payload.tipo === 'boleto' && payload.boleto) {
    return processBoletoWebhook(payload.boleto);
  }

  if (payload.tipo === 'pix' && payload.pix) {
    return processPixWebhook(payload.pix);
  }

  return {
    success: false,
    tipo: payload.tipo,
    idExterno: '',
    acao: 'desconhecido',
    dados: {},
    erros: ['Tipo de webhook não reconhecido ou dados ausentes'],
  };
}

/**
 * Processa webhook de boleto
 */
function processBoletoWebhook(boleto: SicoobWebhookBoleto): WebhookProcessResult {
  const acao = determinarAcaoBoleto(boleto.situacaoBoleto);

  return {
    success: true,
    tipo: 'boleto',
    idExterno: String(boleto.nossoNumero),
    acao,
    dados: {
      nossoNumero: String(boleto.nossoNumero),
      valorPago: boleto.valorPago,
      dataPagamento: boleto.dataPagamento,
      situacao: boleto.situacaoBoleto,
    },
  };
}

/**
 * Processa webhook de PIX
 */
function processPixWebhook(pix: SicoobWebhookPix): WebhookProcessResult {
  return {
    success: true,
    tipo: 'pix',
    idExterno: pix.txid,
    acao: 'pagamento_recebido',
    dados: {
      txid: pix.txid,
      valorPago: parseFloat(pix.valor),
      dataPagamento: pix.horario,
    },
  };
}

/**
 * Determina a ação com base na situação do boleto
 */
function determinarAcaoBoleto(situacao: string): string {
  const acaoMap: Record<string, string> = {
    EM_ABERTO: 'boleto_registrado',
    BAIXADO: 'boleto_baixado',
    LIQUIDADO: 'boleto_pago',
    PROTESTADO: 'boleto_protestado',
    NEGATIVADO: 'boleto_negativado',
    EXPIRADO: 'boleto_expirado',
  };

  return acaoMap[situacao] || 'situacao_alterada';
}

// ===== VALIDAÇÃO DE WEBHOOK =====

/**
 * Valida assinatura do webhook (se aplicável)
 * O Sicoob pode enviar um header de assinatura para validação
 */
export async function validarAssinaturaWebhook(
  payload: string,
  assinatura: string,
  chaveSecreta: string
): Promise<boolean> {
  // Implementação de validação HMAC-SHA256
  const encoder = new TextEncoder();
  const keyData = encoder.encode(chaveSecreta);
  const payloadData = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signatureHex === assinatura.toLowerCase();
}

// ===== GERAÇÃO DE UPDATES PARA O BANCO =====

/**
 * Gera objeto de atualização para tabela boleto_titulos
 */
export function generateTituloUpdate(result: WebhookProcessResult): {
  status: string;
  valor_pago?: number;
  data_pagamento?: string;
  data_atualizacao: string;
} {
  const statusMap: Record<string, string> = {
    boleto_registrado: 'aberto',
    boleto_baixado: 'baixado',
    boleto_pago: 'pago',
    boleto_protestado: 'protestado',
    boleto_negativado: 'negativado',
    boleto_expirado: 'vencido',
    situacao_alterada: 'aberto',
  };

  const update: {
    status: string;
    valor_pago?: number;
    data_pagamento?: string;
    data_atualizacao: string;
  } = {
    status: statusMap[result.acao] || 'aberto',
    data_atualizacao: new Date().toISOString(),
  };

  if (result.dados.valorPago) {
    update.valor_pago = result.dados.valorPago;
  }

  if (result.dados.dataPagamento) {
    update.data_pagamento = result.dados.dataPagamento;
  }

  return update;
}

/**
 * Gera objeto para inserção em boleto_retornos_itens
 */
export function generateRetornoItem(result: WebhookProcessResult): {
  nosso_numero: string;
  ocorrencia: string;
  valor_pago?: number;
  data_ocorrencia: string;
  data_credito?: string;
} {
  const ocorrenciaMap: Record<string, string> = {
    boleto_registrado: '02', // Entrada confirmada
    boleto_baixado: '09', // Baixa
    boleto_pago: '06', // Liquidação
    boleto_protestado: '23', // Remessa a cartório
    boleto_negativado: '54', // Negativação
    boleto_expirado: '09', // Baixa
  };

  return {
    nosso_numero: result.dados.nossoNumero || '',
    ocorrencia: ocorrenciaMap[result.acao] || '00',
    valor_pago: result.dados.valorPago,
    data_ocorrencia: result.dados.dataPagamento || new Date().toISOString(),
    data_credito: result.dados.dataPagamento,
  };
}

// ===== HELPERS =====

/**
 * Verifica se o boleto foi liquidado
 */
export function isBoletoLiquidado(situacao: string): boolean {
  return situacao === 'LIQUIDADO';
}

/**
 * Verifica se o boleto foi baixado
 */
export function isBoletoBaixado(situacao: string): boolean {
  return situacao === 'BAIXADO';
}

/**
 * Verifica se o boleto está em aberto
 */
export function isBoletoEmAberto(situacao: string): boolean {
  return situacao === 'EM_ABERTO';
}

/**
 * Formata mensagem de log para o webhook
 */
export function formatWebhookLogMessage(
  result: WebhookProcessResult,
  empresaId: string
): string {
  const timestamp = new Date().toISOString();
  const status = result.success ? 'OK' : 'ERRO';
  
  return `[${timestamp}] [${status}] Empresa: ${empresaId} | Tipo: ${result.tipo} | ID: ${result.idExterno} | Ação: ${result.acao}`;
}

// ===== DEDUPLICAÇÃO =====

/**
 * Gera hash único para o webhook (para deduplicação)
 */
export async function generateWebhookHash(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica se o webhook já foi processado
 */
export function shouldProcessWebhook(
  hash: string,
  processedHashes: Set<string>
): boolean {
  if (processedHashes.has(hash)) {
    return false;
  }
  processedHashes.add(hash);
  return true;
}
