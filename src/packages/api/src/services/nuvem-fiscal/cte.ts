// =============================================
// PLANAC ERP - Nuvem Fiscal CT-e Service
// Conhecimento de Transporte Eletrônico
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

// ===== TIPOS ESPECÍFICOS CT-e =====

export interface CtePedidoEmissao {
  ambiente: 'homologacao' | 'producao';
  referencia?: string;
  infCte: CteSefazInfCte;
}

export interface CteSefazInfCte {
  versao?: string;
  ide: CteSefazIde;
  compl?: CteSefazCompl;
  emit: CteSefazEmit;
  rem?: CteSefazRem;
  exped?: CteSefazExped;
  receb?: CteSefazReceb;
  dest?: CteSefazDest;
  vPrest: CteSefazVPrest;
  imp: CteSefazImp;
  infCTeNorm?: CteSefazInfCTeNorm;
  infCteComp?: CteSefazInfCteComp;
  autXML?: CteSefazAutXML[];
  infRespTec?: CteSefazInfRespTec;
}

export interface CteSefazIde {
  cUF: number;
  cCT?: string;
  CFOP: string;
  natOp: string;
  mod?: number;
  serie: number;
  nCT: number;
  dhEmi: string;
  tpImp: number;
  tpEmis: number;
  cDV?: number;
  tpAmb?: number;
  tpCTe: number;
  procEmi?: number;
  verProc?: string;
  indGlobalizado?: number;
  cMunEnv: string;
  xMunEnv: string;
  UFEnv: string;
  modal: string;
  tpServ: number;
  cMunIni: string;
  xMunIni: string;
  UFIni: string;
  cMunFim: string;
  xMunFim: string;
  UFFim: string;
  retira: number;
  xDetRetira?: string;
  indIEToma: number;
  toma3?: CteSefazToma3;
  toma4?: CteSefazToma4;
  dhCont?: string;
  xJust?: string;
}

export interface CteSefazToma3 {
  toma: number;
}

export interface CteSefazToma4 {
  toma: number;
  CNPJ?: string;
  CPF?: string;
  IE?: string;
  xNome: string;
  xFant?: string;
  fone?: string;
  enderToma: CteSefazEndereco;
  email?: string;
}

export interface CteSefazCompl {
  xCaracAd?: string;
  xCaracSer?: string;
  xEmi?: string;
  fluxo?: CteSefazFluxo;
  Entrega?: CteSefazEntrega;
  origCalc?: string;
  destCalc?: string;
  xObs?: string;
  ObsCont?: CteSefazObsCont[];
  ObsFisco?: CteSefazObsFisco[];
}

export interface CteSefazFluxo {
  xOrig?: string;
  pass?: CteSefazPass[];
  xDest?: string;
  xRota?: string;
}

export interface CteSefazPass {
  xPass?: string;
}

export interface CteSefazEntrega {
  semData?: CteSefazSemData;
  comData?: CteSefazComData;
  noPeriodo?: CteSefazNoPeriodo;
  semHora?: CteSefazSemHora;
  comHora?: CteSefazComHora;
  noInter?: CteSefazNoInter;
}

export interface CteSefazSemData {
  tpPer: number;
}

export interface CteSefazComData {
  tpPer: number;
  dProg: string;
}

export interface CteSefazNoPeriodo {
  tpPer: number;
  dIni: string;
  dFim: string;
}

export interface CteSefazSemHora {
  tpHor: number;
}

export interface CteSefazComHora {
  tpHor: number;
  hProg: string;
}

export interface CteSefazNoInter {
  tpHor: number;
  hIni: string;
  hFim: string;
}

export interface CteSefazObsCont {
  xCampo: string;
  xTexto: string;
}

export interface CteSefazObsFisco {
  xCampo: string;
  xTexto: string;
}

export interface CteSefazEmit {
  CNPJ?: string;
  CPF?: string;
  IE: string;
  IEST?: string;
  xNome: string;
  xFant?: string;
  enderEmit: CteSefazEndereco;
  CRT?: number;
}

export interface CteSefazRem {
  CNPJ?: string;
  CPF?: string;
  IE?: string;
  xNome: string;
  xFant?: string;
  fone?: string;
  enderReme: CteSefazEndereco;
  email?: string;
}

export interface CteSefazExped {
  CNPJ?: string;
  CPF?: string;
  IE?: string;
  xNome: string;
  fone?: string;
  enderExped: CteSefazEndereco;
  email?: string;
}

export interface CteSefazReceb {
  CNPJ?: string;
  CPF?: string;
  IE?: string;
  xNome: string;
  fone?: string;
  enderReceb: CteSefazEndereco;
  email?: string;
}

export interface CteSefazDest {
  CNPJ?: string;
  CPF?: string;
  IE?: string;
  xNome: string;
  fone?: string;
  ISUF?: string;
  enderDest: CteSefazEndereco;
  email?: string;
}

export interface CteSefazEndereco {
  xLgr: string;
  nro: string;
  xCpl?: string;
  xBairro: string;
  cMun: string;
  xMun: string;
  CEP?: string;
  UF: string;
  cPais?: string;
  xPais?: string;
}

export interface CteSefazVPrest {
  vTPrest: number;
  vRec: number;
  Comp?: CteSefazComp[];
}

export interface CteSefazComp {
  xNome: string;
  vComp: number;
}

export interface CteSefazImp {
  ICMS: CteSefazICMS;
  vTotTrib?: number;
  infAdFisco?: string;
  ICMSUFFim?: CteSefazICMSUFFim;
}

export interface CteSefazICMS {
  ICMS00?: CteSefazICMS00;
  ICMS20?: CteSefazICMS20;
  ICMS45?: CteSefazICMS45;
  ICMS60?: CteSefazICMS60;
  ICMS90?: CteSefazICMS90;
  ICMSOutraUF?: CteSefazICMSOutraUF;
  ICMSSN?: CteSefazICMSSN;
}

export interface CteSefazICMS00 {
  CST: string;
  vBC: number;
  pICMS: number;
  vICMS: number;
}

export interface CteSefazICMS20 {
  CST: string;
  pRedBC: number;
  vBC: number;
  pICMS: number;
  vICMS: number;
}

export interface CteSefazICMS45 {
  CST: string;
}

export interface CteSefazICMS60 {
  CST: string;
  vBCSTRet: number;
  vICMSSTRet: number;
  pICMSSTRet: number;
  vCred?: number;
}

export interface CteSefazICMS90 {
  CST: string;
  pRedBC?: number;
  vBC: number;
  pICMS: number;
  vICMS: number;
  vCred?: number;
}

export interface CteSefazICMSOutraUF {
  CST: string;
  pRedBCOutraUF?: number;
  vBCOutraUF: number;
  pICMSOutraUF: number;
  vICMSOutraUF: number;
}

export interface CteSefazICMSSN {
  CST: string;
  indSN: number;
}

export interface CteSefazICMSUFFim {
  vBCUFFim: number;
  pFCPUFFim: number;
  pICMSUFFim: number;
  pICMSInter: number;
  vFCPUFFim: number;
  vICMSUFFim: number;
  vICMSUFIni: number;
}

export interface CteSefazInfCTeNorm {
  infCarga: CteSefazInfCarga;
  infDoc?: CteSefazInfDoc;
  docAnt?: CteSefazDocAnt;
  infModal: CteSefazInfModal;
  veicNovos?: CteSefazVeicNovos[];
  cobr?: CteSefazCobr;
  infCteSub?: CteSefazInfCteSub;
  infGlobalizado?: CteSefazInfGlobalizado;
  infServVinc?: CteSefazInfServVinc;
}

export interface CteSefazInfCarga {
  vCarga?: number;
  proPred: string;
  xOutCat?: string;
  infQ: CteSefazInfQ[];
  vCargaAverb?: number;
}

export interface CteSefazInfQ {
  cUnid: string;
  tpMed: string;
  qCarga: number;
}

export interface CteSefazInfDoc {
  infNF?: CteSefazInfNF[];
  infNFe?: CteSefazInfNFe[];
  infOutros?: CteSefazInfOutros[];
}

export interface CteSefazInfNF {
  nRoma?: string;
  nPed?: string;
  mod: string;
  serie: string;
  nDoc: string;
  dEmi: string;
  vBC: number;
  vICMS: number;
  vBCST: number;
  vST: number;
  vProd: number;
  vNF: number;
  nCFOP: string;
  nPeso?: number;
  PIN?: string;
  dPrev?: string;
  infUnidCarga?: CteSefazUnidCarga[];
  infUnidTransp?: CteSefazUnidadeTransp[];
}

export interface CteSefazInfNFe {
  chave: string;
  PIN?: string;
  dPrev?: string;
  infUnidCarga?: CteSefazUnidCarga[];
  infUnidTransp?: CteSefazUnidadeTransp[];
}

export interface CteSefazInfOutros {
  tpDoc: string;
  descOutros?: string;
  nDoc?: string;
  dEmi?: string;
  vDocFisc?: number;
  dPrev?: string;
  infUnidCarga?: CteSefazUnidCarga[];
  infUnidTransp?: CteSefazUnidadeTransp[];
}

export interface CteSefazUnidCarga {
  tpUnidCarga: string;
  idUnidCarga: string;
  lacUnidCarga?: CteSefazLacUnidCarga[];
  qtdRat?: number;
}

export interface CteSefazLacUnidCarga {
  nLacre: string;
}

export interface CteSefazUnidadeTransp {
  tpUnidTransp: string;
  idUnidTransp: string;
  lacUnidTransp?: CteSefazLacUnidTransp[];
  infUnidCarga?: CteSefazUnidCarga[];
  qtdRat?: number;
}

export interface CteSefazLacUnidTransp {
  nLacre: string;
}

export interface CteSefazDocAnt {
  emiDocAnt: CteSefazEmiDocAnt[];
}

export interface CteSefazEmiDocAnt {
  CNPJ?: string;
  CPF?: string;
  IE?: string;
  UF?: string;
  xNome: string;
  idDocAnt: CteSefazIdDocAnt[];
}

export interface CteSefazIdDocAnt {
  idDocAntPap?: CteSefazIdDocAntPap[];
  idDocAntEle?: CteSefazIdDocAntEle[];
}

export interface CteSefazIdDocAntPap {
  tpDoc: string;
  serie: string;
  subser?: string;
  nDoc: string;
  dEmi: string;
}

export interface CteSefazIdDocAntEle {
  chCTe: string;
}

export interface CteSefazInfModal {
  versaoModal?: string;
  rodo?: any; // Modal Rodoviário
  aereo?: any; // Modal Aéreo
  aquav?: any; // Modal Aquaviário
  ferrov?: any; // Modal Ferroviário
  duto?: any; // Modal Dutoviário
  multimodal?: any; // Multimodal
}

export interface CteSefazVeicNovos {
  chassi: string;
  cCor: string;
  xCor: string;
  cMod: string;
  vUnit: number;
  vFrete: number;
}

export interface CteSefazCobr {
  fat?: CteSefazFat;
  dup?: CteSefazDup[];
}

export interface CteSefazFat {
  nFat?: string;
  vOrig?: number;
  vDesc?: number;
  vLiq?: number;
}

export interface CteSefazDup {
  nDup?: string;
  dVenc?: string;
  vDup?: number;
}

export interface CteSefazInfCteSub {
  chCte?: string;
  refCteAnu?: string;
  tomaICMS?: CteSefazTomaICMS;
  indAlteraToma?: number;
}

export interface CteSefazTomaICMS {
  refNFe?: string;
  refNF?: CteSefazRefNF;
  refCte?: string;
}

export interface CteSefazRefNF {
  CNPJ?: string;
  CPF?: string;
  mod: string;
  serie: number;
  subserie?: number;
  nro: number;
  valor: number;
  dEmi: string;
}

export interface CteSefazInfGlobalizado {
  xObs?: string;
}

export interface CteSefazInfServVinc {
  infCTeMultimodal: CteSefazInfCTeMultimodal[];
}

export interface CteSefazInfCTeMultimodal {
  chCTeMultimodal: string;
}

export interface CteSefazInfCteComp {
  chCTe: string;
}

export interface CteSefazAutXML {
  CNPJ?: string;
  CPF?: string;
}

export interface CteSefazInfRespTec {
  CNPJ: string;
  xContato: string;
  email: string;
  fone: string;
  idCSRT?: number;
  hashCSRT?: string;
}

// ===== EMISSÃO =====

/**
 * Emite um CT-e
 */
export async function emitirCte(
  config: NuvemFiscalConfig,
  pedido: CtePedidoEmissao,
  kv?: KVNamespace
): Promise<Dfe> {
  return nuvemFiscalRequest<Dfe>(
    config,
    '/cte',
    {
      method: 'POST',
      body: JSON.stringify(pedido),
    },
    kv
  );
}

/**
 * Emite lote de CT-e
 */
export async function emitirLoteCte(
  config: NuvemFiscalConfig,
  pedidos: CtePedidoEmissao[],
  idLote: string,
  ambiente: 'homologacao' | 'producao',
  kv?: KVNamespace
): Promise<Dfe> {
  return nuvemFiscalRequest<Dfe>(
    config,
    '/cte/lotes',
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
 * Consulta CT-e pelo ID
 */
export async function consultarCte(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Dfe> {
  return nuvemFiscalRequest<Dfe>(
    config,
    `/cte/${id}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Lista CT-e emitidos
 */
export async function listarCte(
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
  const endpoint = query ? `/cte?${query}` : '/cte';

  return nuvemFiscalRequest<DfeListagem>(config, endpoint, { method: 'GET' }, kv);
}

/**
 * Consulta status do serviço na SEFAZ
 */
export async function consultarStatusSefazCte(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  autorizador?: string,
  kv?: KVNamespace
): Promise<DfeSefazStatus> {
  const params = new URLSearchParams({
    cpf_cnpj: cpf_cnpj.replace(/\D/g, ''),
  });
  if (autorizador) params.append('autorizador', autorizador);

  return nuvemFiscalRequest<DfeSefazStatus>(
    config,
    `/cte/sefaz/status?${params.toString()}`,
    { method: 'GET' },
    kv
  );
}

// ===== DOWNLOADS =====

/**
 * Baixa XML do CT-e
 */
export async function baixarXmlCte(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/cte/${id}/xml`,
    { method: 'GET' },
    kv
  );
}

/**
 * Baixa PDF (DACTE) do CT-e
 */
export async function baixarPdfCte(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/cte/${id}/pdf`,
    { method: 'GET' },
    kv
  );
}

// ===== CANCELAMENTO =====

/**
 * Cancela CT-e autorizado
 */
export async function cancelarCte(
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
    `/cte/${id}/cancelamento`,
    {
      method: 'POST',
      body: JSON.stringify({ justificativa }),
    },
    kv
  );
}

/**
 * Consulta cancelamento do CT-e
 */
export async function consultarCancelamentoCte(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<DfeEvento | null> {
  try {
    return await nuvemFiscalRequest<DfeEvento>(
      config,
      `/cte/${id}/cancelamento`,
      { method: 'GET' },
      kv
    );
  } catch (error: any) {
    if (error.status === 404) return null;
    throw error;
  }
}

// ===== CARTA DE CORREÇÃO =====

/**
 * Emite carta de correção do CT-e
 */
export async function emitirCartaCorrecaoCte(
  config: NuvemFiscalConfig,
  id: string,
  correcoes: Array<{
    grupo_corrigido: string;
    campo_corrigido: string;
    valor_corrigido: string;
    numero_item_corrigido?: number;
  }>,
  kv?: KVNamespace
): Promise<DfeEvento> {
  return nuvemFiscalRequest<DfeEvento>(
    config,
    `/cte/${id}/carta-correcao`,
    {
      method: 'POST',
      body: JSON.stringify({ correcoes }),
    },
    kv
  );
}

/**
 * Lista cartas de correção do CT-e
 */
export async function listarCartasCorrecaoCte(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<DfeEvento[]> {
  const result = await nuvemFiscalRequest<{ data: DfeEvento[] }>(
    config,
    `/cte/${id}/carta-correcao`,
    { method: 'GET' },
    kv
  );
  return result.data || [];
}

// ===== INUTILIZAÇÃO =====

/**
 * Inutiliza faixa de numeração CT-e
 */
export async function inutilizarNumeracaoCte(
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
    '/cte/inutilizacoes',
    {
      method: 'POST',
      body: JSON.stringify(pedido),
    },
    kv
  );
}

// ===== EVENTOS =====

/**
 * Registra prestação de serviço em desacordo
 */
export async function registrarDesacordoCte(
  config: NuvemFiscalConfig,
  id: string,
  observacao: string,
  kv?: KVNamespace
): Promise<DfeEvento> {
  return nuvemFiscalRequest<DfeEvento>(
    config,
    `/cte/${id}/prestacao-desacordo`,
    {
      method: 'POST',
      body: JSON.stringify({ observacao }),
    },
    kv
  );
}

// ===== EMAIL =====

/**
 * Envia CT-e por email
 */
export async function enviarEmailCte(
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
    `/cte/${id}/email`,
    {
      method: 'POST',
      body: JSON.stringify(email),
    },
    kv
  );
}
