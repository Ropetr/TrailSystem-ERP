// =============================================
// PLANAC ERP - Banco do Brasil Webhook Service
// Processamento de webhooks do BB
// =============================================

import {
  BBWebhookBoleto,
  BBWebhookPix,
  BB_ESTADOS_TITULO,
  isTituloLiquidado,
  isTituloBaixado,
} from './types';

// ===== TIPOS DE WEBHOOK =====

export interface BBWebhookPayload {
  /** Tipo do webhook: boleto ou pix */
  tipo: 'boleto' | 'pix';
  /** Dados do boleto (se tipo = boleto) */
  boleto?: BBWebhookBoleto;
  /** Lista de PIX recebidos (se tipo = pix) */
  pix?: BBWebhookPix[];
  /** Timestamp do evento */
  timestamp?: string;
}

export interface WebhookProcessResult {
  success: boolean;
  tipo: 'boleto' | 'pix';
  idExterno: string;
  acao: string;
  dados: {
    nossoNumero?: string;
    txid?: string;
    endToEndId?: string;
    valorPago?: number;
    dataPagamento?: string;
    dataCredito?: string;
    situacao?: string;
    codigoEstado?: number;
  };
  erros?: string[];
}

// ===== PROCESSAMENTO DE WEBHOOK =====

/**
 * Processa webhook recebido do Banco do Brasil
 */
export function processWebhook(payload: BBWebhookPayload): WebhookProcessResult[] {
  const results: WebhookProcessResult[] = [];

  if (payload.tipo === 'boleto' && payload.boleto) {
    results.push(processBoletoWebhook(payload.boleto));
  }

  if (payload.tipo === 'pix' && payload.pix) {
    for (const pix of payload.pix) {
      results.push(processPixWebhook(pix));
    }
  }

  if (results.length === 0) {
    results.push({
      success: false,
      tipo: payload.tipo,
      idExterno: '',
      acao: 'desconhecido',
      dados: {},
      erros: ['Tipo de webhook não reconhecido ou dados ausentes'],
    });
  }

  return results;
}

/**
 * Processa webhook de boleto
 */
function processBoletoWebhook(boleto: BBWebhookBoleto): WebhookProcessResult {
  const acao = determinarAcaoBoleto(boleto.codigoEstadoTituloCobranca);

  return {
    success: true,
    tipo: 'boleto',
    idExterno: boleto.numero,
    acao,
    dados: {
      nossoNumero: boleto.numero,
      valorPago: boleto.valorPago,
      dataPagamento: boleto.dataPagamento,
      dataCredito: boleto.dataCredito,
      situacao: boleto.estadoTituloCobranca,
      codigoEstado: boleto.codigoEstadoTituloCobranca,
    },
  };
}

/**
 * Processa webhook de PIX
 */
function processPixWebhook(pix: BBWebhookPix): WebhookProcessResult {
  return {
    success: true,
    tipo: 'pix',
    idExterno: pix.txid,
    acao: 'pagamento_recebido',
    dados: {
      txid: pix.txid,
      endToEndId: pix.endToEndId,
      valorPago: parseFloat(pix.valor),
      dataPagamento: pix.horario,
    },
  };
}

/**
 * Determina a ação com base no código de estado do boleto
 */
function determinarAcaoBoleto(codigoEstado: number): string {
  if (isTituloLiquidado(codigoEstado)) {
    return 'boleto_pago';
  }

  if (isTituloBaixado(codigoEstado)) {
    return 'boleto_baixado';
  }

  const acaoMap: Record<number, string> = {
    1: 'boleto_registrado',
    2: 'boleto_cartorio',
    3: 'boleto_cartorio',
    4: 'boleto_cartorio',
    5: 'boleto_protestado',
    9: 'boleto_protestado',
    13: 'boleto_protestado',
    15: 'boleto_agendado',
  };

  return acaoMap[codigoEstado] || 'situacao_alterada';
}

// ===== VALIDAÇÃO DE WEBHOOK =====

/**
 * Valida assinatura do webhook (HMAC-SHA256)
 */
export async function validarAssinaturaWebhook(
  payload: string,
  assinatura: string,
  chaveSecreta: string
): Promise<boolean> {
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
  data_credito?: string;
  data_atualizacao: string;
} {
  const statusMap: Record<string, string> = {
    boleto_registrado: 'aberto',
    boleto_baixado: 'baixado',
    boleto_pago: 'pago',
    boleto_protestado: 'protestado',
    boleto_cartorio: 'cartorio',
    boleto_agendado: 'agendado',
    situacao_alterada: 'aberto',
  };

  const update: {
    status: string;
    valor_pago?: number;
    data_pagamento?: string;
    data_credito?: string;
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

  if (result.dados.dataCredito) {
    update.data_credito = result.dados.dataCredito;
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
    boleto_cartorio: '23', // Remessa a cartório
    boleto_agendado: '02', // Entrada confirmada
  };

  return {
    nosso_numero: result.dados.nossoNumero || '',
    ocorrencia: ocorrenciaMap[result.acao] || '00',
    valor_pago: result.dados.valorPago,
    data_ocorrencia: result.dados.dataPagamento || new Date().toISOString(),
    data_credito: result.dados.dataCredito,
  };
}

// ===== HELPERS =====

/**
 * Verifica se o boleto foi liquidado
 */
export function isBoletoLiquidado(codigoEstado: number): boolean {
  return isTituloLiquidado(codigoEstado);
}

/**
 * Verifica se o boleto foi baixado
 */
export function isBoletoBaixado(codigoEstado: number): boolean {
  return isTituloBaixado(codigoEstado);
}

/**
 * Retorna descrição do estado do título
 */
export function getEstadoDescricao(codigoEstado: number): string {
  return BB_ESTADOS_TITULO[codigoEstado] || `Estado ${codigoEstado}`;
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
