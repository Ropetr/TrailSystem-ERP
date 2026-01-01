// =============================================
// PLANAC ERP - Banco Safra Webhook Service
// Processamento de webhooks do Safra
// =============================================

import {
  SafraWebhookBoleto,
  SafraWebhookPix,
  SAFRA_SITUACOES,
  isTituloLiquidado,
  isTituloBaixado,
  isTituloRejeitado,
  isTituloEmCartorio,
} from './types';

// ===== TIPOS DE WEBHOOK =====

export interface SafraWebhookPayload {
  /** Tipo do webhook: boleto ou pix */
  tipo: 'boleto' | 'pix';
  /** Dados do boleto (se tipo = boleto) */
  boleto?: SafraWebhookBoleto;
  /** Lista de PIX recebidos (se tipo = pix) */
  pix?: SafraWebhookPix[];
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
    codigoSituacao?: string;
  };
  erros?: string[];
}

// ===== PROCESSAMENTO DE WEBHOOK =====

/**
 * Processa webhook recebido do Safra
 */
export function processWebhook(payload: SafraWebhookPayload): WebhookProcessResult[] {
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
function processBoletoWebhook(boleto: SafraWebhookBoleto): WebhookProcessResult {
  const acao = determinarAcaoBoleto(boleto.codigoSituacao);

  return {
    success: true,
    tipo: 'boleto',
    idExterno: boleto.nossoNumero,
    acao,
    dados: {
      nossoNumero: boleto.nossoNumero,
      valorPago: boleto.valorPago,
      dataPagamento: boleto.dataPagamento,
      dataCredito: boleto.dataCredito,
      situacao: boleto.situacao,
      codigoSituacao: boleto.codigoSituacao,
    },
  };
}

/**
 * Processa webhook de PIX
 */
function processPixWebhook(pix: SafraWebhookPix): WebhookProcessResult {
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
 * Determina a ação com base no código de situação do boleto
 */
function determinarAcaoBoleto(codigoSituacao: string): string {
  if (isTituloLiquidado(codigoSituacao)) {
    return 'boleto_pago';
  }

  if (isTituloBaixado(codigoSituacao)) {
    return 'boleto_baixado';
  }

  if (isTituloRejeitado(codigoSituacao)) {
    return 'boleto_rejeitado';
  }

  if (isTituloEmCartorio(codigoSituacao)) {
    return 'boleto_cartorio';
  }

  const acaoMap: Record<string, string> = {
    '01': 'boleto_registrado',
    '04': 'boleto_protestado',
    '07': 'boleto_expirado',
  };

  return acaoMap[codigoSituacao] || 'situacao_alterada';
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
    boleto_expirado: 'vencido',
    boleto_rejeitado: 'rejeitado',
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
    boleto_expirado: '09', // Baixa
    boleto_rejeitado: '03', // Rejeição
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
export function isBoletoLiquidado(codigoSituacao: string): boolean {
  return isTituloLiquidado(codigoSituacao);
}

/**
 * Verifica se o boleto foi baixado
 */
export function isBoletoBaixado(codigoSituacao: string): boolean {
  return isTituloBaixado(codigoSituacao);
}

/**
 * Verifica se o boleto foi rejeitado
 */
export function isBoletoRejeitado(codigoSituacao: string): boolean {
  return isTituloRejeitado(codigoSituacao);
}

/**
 * Verifica se o boleto está em cartório
 */
export function isBoletoEmCartorio(codigoSituacao: string): boolean {
  return isTituloEmCartorio(codigoSituacao);
}

/**
 * Retorna descrição da situação do título
 */
export function getSituacaoDescricao(codigoSituacao: string): string {
  return SAFRA_SITUACOES[codigoSituacao] || `Situação ${codigoSituacao}`;
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
