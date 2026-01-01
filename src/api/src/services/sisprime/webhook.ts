// =============================================
// PLANAC ERP - Sisprime Webhook Handler
// Processamento de webhooks de atualização de títulos
// =============================================

import type {
  SisprimeWebhookPayload,
  SisprimeWebhookTitulo,
  SisprimeWebhookLancamento,
} from './types';
import { getSituacaoDescricao, getOcorrenciaDescricao, getMotivoDescricao } from './types';
import { decryptWebhookPayload, generateHash } from './crypto';

// ===== TIPOS =====

export interface WebhookProcessResult {
  success: boolean;
  message: string;
  tituloId?: string;
  idBoleto?: string;
  situacao?: string;
  lancamentos?: number;
  hash?: string;
  error?: string;
}

export interface WebhookConfig {
  /** Chave simétrica para decriptação (UUID) */
  symmetricKey: string;
  /** ID da empresa (para multi-tenant) */
  empresaId: string;
  /** ID da conta bancária */
  contaId: string;
}

// ===== PROCESSAMENTO =====

/**
 * Processa webhook recebido do Sisprime
 * 
 * O webhook é enviado criptografado com AES-256-CBC.
 * Após decriptação, contém dados do título e lançamentos.
 * 
 * @param encryptedPayload - Payload criptografado (IV::ENCRYPTED_DATA)
 * @param config - Configuração do webhook (chave, empresa, conta)
 * @returns Resultado do processamento
 * 
 * @example
 * ```typescript
 * const result = await processWebhook(encryptedPayload, {
 *   symmetricKey: 'uuid-key',
 *   empresaId: 'empresa-123',
 *   contaId: 'conta-456',
 * });
 * 
 * if (result.success) {
 *   console.log('Título atualizado:', result.idBoleto);
 * }
 * ```
 */
export async function processWebhook(
  encryptedPayload: string,
  config: WebhookConfig
): Promise<WebhookProcessResult> {
  try {
    // Decriptar payload
    const decryptedJson = await decryptWebhookPayload(
      encryptedPayload,
      config.symmetricKey
    );
    
    // Parse JSON
    const payload: SisprimeWebhookPayload = JSON.parse(decryptedJson);
    
    // Gerar hash para deduplicação
    const hash = await generateHash(decryptedJson);
    
    // Extrair dados
    const { dados_titulo, lancamentos } = payload;
    
    if (!dados_titulo) {
      return {
        success: false,
        message: 'Payload não contém dados_titulo',
        hash,
        error: 'MISSING_DADOS_TITULO',
      };
    }
    
    // Processar título
    const tituloProcessado = processTituloData(dados_titulo);
    
    // Processar lançamentos
    const lancamentosProcessados = lancamentos?.map(processLancamentoData) || [];
    
    return {
      success: true,
      message: `Webhook processado: ${tituloProcessado.descricao_situacao}`,
      tituloId: tituloProcessado.nosso_numero,
      idBoleto: tituloProcessado.id_boleto,
      situacao: tituloProcessado.codigo_situacao,
      lancamentos: lancamentosProcessados.length,
      hash,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      success: false,
      message: `Erro ao processar webhook: ${errorMessage}`,
      error: errorMessage,
    };
  }
}

/**
 * Processa dados do título do webhook
 */
export function processTituloData(dados: SisprimeWebhookTitulo): {
  id_boleto: string;
  nosso_numero: string;
  numero_documento: string;
  codigo_barras: string;
  linha_digitavel: string;
  data_vencimento: string;
  valor_documento: number;
  codigo_situacao: string;
  descricao_situacao: string;
  qr_code: string | null;
  status_erp: string;
  ocorrencia_retorno: string | null;
  motivos: string[];
} {
  // Mapear situação para status do ERP
  const statusMap: Record<string, string> = {
    '01': 'registrado',    // EM ABERTO
    '02': 'baixado',       // BAIXADO
    '03': 'protestado',    // PROTESTADO
    '04': 'protestado',    // NEGATIVADO
    '05': 'pago',          // LIQUIDADO CARTÓRIO
    '06': 'pago',          // LIQUIDADO APÓS BAIXA
    '07': 'pago',          // PAGO
    '08': 'pago',          // PAGO A MENOR
    '09': 'pago',          // PAGO A MAIOR
  };
  
  // Coletar motivos de rejeição/ocorrência
  const motivos: string[] = [];
  if (dados.codigo_motivo1 && dados.descricao_motivo1) {
    motivos.push(`${dados.codigo_motivo1}: ${dados.descricao_motivo1}`);
  }
  if (dados.codigo_motivo2 && dados.descricao_motivo2) {
    motivos.push(`${dados.codigo_motivo2}: ${dados.descricao_motivo2}`);
  }
  if (dados.codigo_motivo3 && dados.descricao_motivo3) {
    motivos.push(`${dados.codigo_motivo3}: ${dados.descricao_motivo3}`);
  }
  if (dados.codigo_motivo4 && dados.descricao_motivo4) {
    motivos.push(`${dados.codigo_motivo4}: ${dados.descricao_motivo4}`);
  }
  if (dados.codigo_motivo5 && dados.descricao_motivo5) {
    motivos.push(`${dados.codigo_motivo5}: ${dados.descricao_motivo5}`);
  }
  
  return {
    id_boleto: dados.id_boleto,
    nosso_numero: dados.nosso_numero,
    numero_documento: dados.numero_documento,
    codigo_barras: dados.codigo_barras,
    linha_digitavel: dados.linha_digitavel,
    data_vencimento: dados.data_vencimento,
    valor_documento: parseFloat(dados.valor_documento) || 0,
    codigo_situacao: dados.codigo_situacao,
    descricao_situacao: dados.descricao_situacao || getSituacaoDescricao(dados.codigo_situacao),
    qr_code: dados.qr_code || null,
    status_erp: statusMap[dados.codigo_situacao] || 'registrado',
    ocorrencia_retorno: dados.codigo_ocorrencia_retorno 
      ? getOcorrenciaDescricao(dados.codigo_ocorrencia_retorno)
      : null,
    motivos,
  };
}

/**
 * Processa dados de lançamento do webhook
 */
export function processLancamentoData(lancamento: SisprimeWebhookLancamento): {
  tipo: 'CREDITO' | 'DEBITO';
  data_ocorrencia: string;
  data_lancamento: string;
  valor: number;
  identificador: string;
} {
  return {
    tipo: lancamento.tipo_lancamento,
    data_ocorrencia: lancamento.data_ocorrencia,
    data_lancamento: lancamento.data_lancamento,
    valor: parseFloat(lancamento.valor_lancamento) || 0,
    identificador: lancamento.identificador_lancamento,
  };
}

/**
 * Gera dados para atualização do boleto_titulos
 */
export function generateTituloUpdate(
  tituloProcessado: ReturnType<typeof processTituloData>,
  lancamentos: ReturnType<typeof processLancamentoData>[]
): {
  status: string;
  codigo_situacao: string;
  motivo_ocorrencia: string | null;
  valor_pago: number | null;
  data_pagamento: string | null;
  data_credito: string | null;
  codigo_barras: string;
  linha_digitavel: string;
  qr_code: string | null;
} {
  // Encontrar lançamento de crédito (pagamento)
  const creditoLancamento = lancamentos.find(l => l.tipo === 'CREDITO');
  
  // Determinar se foi pago
  const isPago = ['05', '06', '07', '08', '09'].includes(tituloProcessado.codigo_situacao);
  
  return {
    status: tituloProcessado.status_erp,
    codigo_situacao: tituloProcessado.codigo_situacao,
    motivo_ocorrencia: tituloProcessado.motivos.length > 0 
      ? tituloProcessado.motivos.join('; ')
      : null,
    valor_pago: isPago && creditoLancamento ? creditoLancamento.valor : null,
    data_pagamento: isPago && creditoLancamento ? creditoLancamento.data_ocorrencia : null,
    data_credito: isPago && creditoLancamento ? creditoLancamento.data_lancamento : null,
    codigo_barras: tituloProcessado.codigo_barras,
    linha_digitavel: tituloProcessado.linha_digitavel,
    qr_code: tituloProcessado.qr_code,
  };
}

/**
 * Gera dados para inserção no boleto_retornos_itens
 */
export function generateRetornoItem(
  tituloProcessado: ReturnType<typeof processTituloData>,
  lancamento: ReturnType<typeof processLancamentoData>
): {
  nosso_numero: string;
  codigo_ocorrencia: string;
  descricao_ocorrencia: string;
  valor_titulo: number;
  valor_pago: number | null;
  valor_credito: number | null;
  data_ocorrencia: string;
  data_credito: string | null;
  data_pagamento: string | null;
  motivos_rejeicao: string | null;
} {
  const isCredito = lancamento.tipo === 'CREDITO';
  
  return {
    nosso_numero: tituloProcessado.nosso_numero,
    codigo_ocorrencia: tituloProcessado.codigo_situacao,
    descricao_ocorrencia: tituloProcessado.descricao_situacao,
    valor_titulo: tituloProcessado.valor_documento,
    valor_pago: isCredito ? lancamento.valor : null,
    valor_credito: isCredito ? lancamento.valor : null,
    data_ocorrencia: lancamento.data_ocorrencia,
    data_credito: isCredito ? lancamento.data_lancamento : null,
    data_pagamento: isCredito ? lancamento.data_ocorrencia : null,
    motivos_rejeicao: tituloProcessado.motivos.length > 0
      ? JSON.stringify(tituloProcessado.motivos)
      : null,
  };
}

/**
 * Valida se o webhook deve ser processado (deduplicação)
 * 
 * @param hash - Hash do payload
 * @param processedHashes - Set de hashes já processados
 * @returns true se deve processar, false se já foi processado
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

/**
 * Extrai informações de PIX do webhook (se disponível)
 */
export function extractPixInfo(dados: SisprimeWebhookTitulo): {
  hasPixQrCode: boolean;
  qrCodePayload: string | null;
} {
  return {
    hasPixQrCode: !!dados.qr_code,
    qrCodePayload: dados.qr_code || null,
  };
}

/**
 * Determina se o título foi liquidado (pago)
 */
export function isTituloLiquidado(codigoSituacao: string): boolean {
  // Situações que indicam pagamento
  const situacoesPagas = ['05', '06', '07', '08', '09'];
  return situacoesPagas.includes(codigoSituacao);
}

/**
 * Determina se o título foi rejeitado
 */
export function isTituloRejeitado(codigoOcorrenciaRetorno: string | undefined): boolean {
  // Ocorrência 03 = ENTRADA REJEITADA
  return codigoOcorrenciaRetorno === '03';
}

/**
 * Formata mensagem de log para o webhook
 */
export function formatWebhookLogMessage(
  result: WebhookProcessResult,
  empresaId: string
): string {
  if (result.success) {
    return `[Sisprime Webhook] Empresa: ${empresaId} | Boleto: ${result.idBoleto} | Situação: ${result.situacao} | Lançamentos: ${result.lancamentos}`;
  }
  return `[Sisprime Webhook] Empresa: ${empresaId} | Erro: ${result.error}`;
}
