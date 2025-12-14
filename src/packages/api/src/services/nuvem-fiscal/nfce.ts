// =============================================
// PLANAC ERP - Nuvem Fiscal NFC-e Service
// Nota Fiscal de Consumidor Eletrônica
// =============================================

import type { 
  NuvemFiscalConfig, 
  Dfe,
  DfeListagem,
  DfeEvento,
  DfeSefazStatus,
  PaginacaoParams 
} from './types';
import { nuvemFiscalRequest } from './auth';

// ===== TIPOS ESPECÍFICOS NFC-e =====

export interface NfcePedidoEmissao {
  ambiente: 'homologacao' | 'producao';
  referencia?: string;
  infNFe: NfceSefazInfNFe;
}

export interface NfceSefazInfNFe {
  versao?: string;
  ide: NfceSefazIde;
  emit: NfceSefazEmit;
  dest?: NfceSefazDest;
  det: NfceSefazDet[];
  total: NfceSefazTotal;
  transp: NfceSefazTransp;
  pag: NfceSefazPag;
  infAdic?: NfceSefazInfAdic;
}

export interface NfceSefazIde {
  cUF: number;
  cNF?: string;
  natOp: string;
  mod?: number; // 65 para NFC-e
  serie: number;
  nNF: number;
  dhEmi: string;
  tpNF: number;
  idDest: number;
  cMunFG: string;
  tpImp: number;
  tpEmis: number;
  cDV?: number;
  tpAmb?: number;
  finNFe: number;
  indFinal: number;
  indPres: number;
  procEmi?: number;
  verProc?: string;
}

export interface NfceSefazEmit {
  CNPJ?: string;
  CPF?: string;
  xNome: string;
  xFant?: string;
  enderEmit: NfceSefazEndereco;
  IE: string;
  IM?: string;
  CRT: number;
}

export interface NfceSefazDest {
  CNPJ?: string;
  CPF?: string;
  xNome?: string;
  enderDest?: NfceSefazEndereco;
  indIEDest: number;
  email?: string;
}

export interface NfceSefazEndereco {
  xLgr: string;
  nro: string;
  xCpl?: string;
  xBairro: string;
  cMun: string;
  xMun: string;
  UF: string;
  CEP?: string;
  cPais?: string;
  xPais?: string;
  fone?: string;
}

export interface NfceSefazDet {
  nItem: number;
  prod: NfceSefazProd;
  imposto: NfceSefazImposto;
  infAdProd?: string;
}

export interface NfceSefazProd {
  cProd: string;
  cEAN: string;
  xProd: string;
  NCM: string;
  CFOP: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
  cEANTrib: string;
  uTrib: string;
  qTrib: number;
  vUnTrib: number;
  indTot: number;
  vDesc?: number;
  vOutro?: number;
}

export interface NfceSefazImposto {
  vTotTrib?: number;
  ICMS: any; // Mesma estrutura da NF-e
  PIS: any;
  COFINS: any;
}

export interface NfceSefazTotal {
  ICMSTot: {
    vBC: number;
    vICMS: number;
    vICMSDeson?: number;
    vBCST: number;
    vST: number;
    vProd: number;
    vFrete?: number;
    vSeg?: number;
    vDesc?: number;
    vII?: number;
    vIPI?: number;
    vPIS: number;
    vCOFINS: number;
    vOutro?: number;
    vNF: number;
    vTotTrib?: number;
  };
}

export interface NfceSefazTransp {
  modFrete: number;
}

export interface NfceSefazPag {
  detPag: NfceSefazDetPag[];
  vTroco?: number;
}

export interface NfceSefazDetPag {
  indPag?: number;
  tPag: string;
  vPag: number;
  card?: {
    tpIntegra: number;
    CNPJ?: string;
    tBand?: string;
    cAut?: string;
  };
}

export interface NfceSefazInfAdic {
  infCpl?: string;
}

// ===== EMISSÃO =====

/**
 * Emite uma NFC-e
 */
export async function emitirNfce(
  config: NuvemFiscalConfig,
  pedido: NfcePedidoEmissao,
  kv?: KVNamespace
): Promise<Dfe> {
  return nuvemFiscalRequest<Dfe>(
    config,
    '/nfce',
    {
      method: 'POST',
      body: JSON.stringify(pedido),
    },
    kv
  );
}

/**
 * Emite lote de NFC-e
 */
export async function emitirLoteNfce(
  config: NuvemFiscalConfig,
  pedidos: NfcePedidoEmissao[],
  idLote: string,
  ambiente: 'homologacao' | 'producao',
  kv?: KVNamespace
): Promise<Dfe> {
  return nuvemFiscalRequest<Dfe>(
    config,
    '/nfce/lotes',
    {
      method: 'POST',
      body: JSON.stringify({
        documentos: pedidos,
        ambiente,
        id_lote: idLote,
      }),
    },
    kv
  );
}

// ===== CONSULTAS =====

/**
 * Consulta NFC-e pelo ID
 */
export async function consultarNfce(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Dfe> {
  return nuvemFiscalRequest<Dfe>(
    config,
    `/nfce/${id}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Lista NFC-e emitidas
 */
export async function listarNfce(
  config: NuvemFiscalConfig,
  filtros?: {
    cpf_cnpj?: string;
    ambiente?: 'homologacao' | 'producao';
    referencia?: string;
    chave?: string;
  },
  paginacao?: PaginacaoParams,
  kv?: KVNamespace
): Promise<DfeListagem> {
  const params = new URLSearchParams();

  if (filtros?.cpf_cnpj) params.append('cpf_cnpj', filtros.cpf_cnpj.replace(/\D/g, ''));
  if (filtros?.ambiente) params.append('ambiente', filtros.ambiente);
  if (filtros?.referencia) params.append('referencia', filtros.referencia);
  if (filtros?.chave) params.append('chave', filtros.chave);
  if (paginacao?.$top) params.append('$top', paginacao.$top.toString());
  if (paginacao?.$skip) params.append('$skip', paginacao.$skip.toString());
  if (paginacao?.$inlinecount) params.append('$inlinecount', 'true');

  const query = params.toString();
  const endpoint = query ? `/nfce?${query}` : '/nfce';

  return nuvemFiscalRequest<DfeListagem>(config, endpoint, { method: 'GET' }, kv);
}

/**
 * Consulta status do serviço na SEFAZ
 */
export async function consultarStatusSefazNfce(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  kv?: KVNamespace
): Promise<DfeSefazStatus> {
  const params = new URLSearchParams({
    cpf_cnpj: cpf_cnpj.replace(/\D/g, ''),
  });

  return nuvemFiscalRequest<DfeSefazStatus>(
    config,
    `/nfce/sefaz/status?${params.toString()}`,
    { method: 'GET' },
    kv
  );
}

// ===== DOWNLOADS =====

/**
 * Baixa XML da NFC-e
 */
export async function baixarXmlNfce(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/nfce/${id}/xml`,
    { method: 'GET' },
    kv
  );
}

/**
 * Baixa PDF (DANFCE) da NFC-e
 */
export async function baixarPdfNfce(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/nfce/${id}/pdf`,
    { method: 'GET' },
    kv
  );
}

// ===== CANCELAMENTO =====

/**
 * Cancela NFC-e autorizada
 */
export async function cancelarNfce(
  config: NuvemFiscalConfig,
  id: string,
  justificativa: string,
  kv?: KVNamespace
): Promise<DfeEvento> {
  if (justificativa.length < 15 || justificativa.length > 255) {
    throw new Error('Justificativa deve ter entre 15 e 255 caracteres');
  }

  return nuvemFiscalRequest<DfeEvento>(
    config,
    `/nfce/${id}/cancelamento`,
    {
      method: 'POST',
      body: JSON.stringify({ justificativa }),
    },
    kv
  );
}

/**
 * Consulta cancelamento da NFC-e
 */
export async function consultarCancelamentoNfce(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<DfeEvento | null> {
  try {
    return await nuvemFiscalRequest<DfeEvento>(
      config,
      `/nfce/${id}/cancelamento`,
      { method: 'GET' },
      kv
    );
  } catch (error: any) {
    if (error.status === 404) return null;
    throw error;
  }
}

// ===== INUTILIZAÇÃO =====

/**
 * Inutiliza faixa de numeração NFC-e
 */
export async function inutilizarNumeracaoNfce(
  config: NuvemFiscalConfig,
  pedido: {
    ambiente: 'homologacao' | 'producao';
    cnpj: string;
    ano: number;
    serie: number;
    numero_inicial: number;
    numero_final: number;
    justificativa: string;
  },
  kv?: KVNamespace
): Promise<any> {
  if (pedido.justificativa.length < 15 || pedido.justificativa.length > 255) {
    throw new Error('Justificativa deve ter entre 15 e 255 caracteres');
  }

  return nuvemFiscalRequest<any>(
    config,
    '/nfce/inutilizacoes',
    {
      method: 'POST',
      body: JSON.stringify(pedido),
    },
    kv
  );
}

// ===== EMAIL =====

/**
 * Envia NFC-e por email
 */
export async function enviarEmailNfce(
  config: NuvemFiscalConfig,
  id: string,
  email: {
    para: string[];
    cc?: string[];
    assunto?: string;
    corpo?: string;
    anexar_pdf?: boolean;
    anexar_xml?: boolean;
  },
  kv?: KVNamespace
): Promise<void> {
  await nuvemFiscalRequest<void>(
    config,
    `/nfce/${id}/email`,
    {
      method: 'POST',
      body: JSON.stringify(email),
    },
    kv
  );
}
