// =============================================
// PLANAC ERP - Nuvem Fiscal MDF-e Service
// Manifesto Eletrônico de Documentos Fiscais
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

// ===== TIPOS ESPECÍFICOS MDF-e =====

export interface MdfePedidoEmissao {
  ambiente: 'homologacao' | 'producao';
  referencia?: string;
  infMDFe: MdfeSefazInfMDFe;
}

export interface MdfeSefazInfMDFe {
  versao?: string;
  ide: MdfeSefazIde;
  emit: MdfeSefazEmit;
  infModal: MdfeSefazInfModal;
  infDoc: MdfeSefazInfDoc;
  seg?: MdfeSefazSeg[];
  prodPred?: MdfeSefazProdPred;
  tot: MdfeSefazTot;
  lacres?: MdfeSefazLacres[];
  autXML?: MdfeSefazAutXML[];
  infAdic?: MdfeSefazInfAdic;
  infRespTec?: MdfeSefazInfRespTec;
}

export interface MdfeSefazIde {
  cUF: number;
  tpAmb?: number;
  tpEmit: number;
  tpTransp?: number;
  mod?: number;
  serie: number;
  nMDF: number;
  cMDF?: string;
  cDV?: number;
  modal: number;
  dhEmi: string;
  tpEmis: number;
  procEmi?: string;
  verProc?: string;
  UFIni: string;
  UFFim: string;
  infMunCarrega: MdfeSefazInfMunCarrega[];
  infPercurso?: MdfeSefazInfPercurso[];
  dhIniViagem?: string;
  indCanalVerde?: number;
  indCarregaPosterior?: number;
}

export interface MdfeSefazInfMunCarrega {
  cMunCarrega: string;
  xMunCarrega: string;
}

export interface MdfeSefazInfPercurso {
  UFPer: string;
}

export interface MdfeSefazEmit {
  CNPJ?: string;
  CPF?: string;
  IE: string;
  xNome: string;
  xFant?: string;
  enderEmit: MdfeSefazEnderEmit;
}

export interface MdfeSefazEnderEmit {
  xLgr: string;
  nro: string;
  xCpl?: string;
  xBairro: string;
  cMun: string;
  xMun: string;
  CEP?: string;
  UF: string;
  fone?: string;
  email?: string;
}

export interface MdfeSefazInfModal {
  versaoModal?: string;
  rodo?: MdfeSefazRodo;
  aereo?: MdfeSefazAereo;
  ferrov?: MdfeSefazFerrov;
  aquav?: MdfeSefazAquav;
}

export interface MdfeSefazRodo {
  infANTT?: MdfeSefazInfANTT;
  veicTracao: MdfeSefazVeicTracao;
  veicReboque?: MdfeSefazVeicReboque[];
  codAgPorto?: string;
  lacRodo?: MdfeSefazLacRodo[];
}

export interface MdfeSefazInfANTT {
  RNTRC?: string;
  infCIOT?: MdfeSefazInfCIOT[];
  valePed?: MdfeSefazValePed;
  infContratante?: MdfeSefazInfContratante[];
  infPag?: MdfeSefazInfPag[];
}

export interface MdfeSefazInfCIOT {
  CIOT: string;
  CNPJ?: string;
  CPF?: string;
}

export interface MdfeSefazValePed {
  disp?: MdfeSefazDisp[];
  categCombVeic?: string;
}

export interface MdfeSefazDisp {
  CNPJForn: string;
  CNPJPg?: string;
  CPFPg?: string;
  nCompra?: string;
  vValePed?: number;
  tpValePed?: string;
}

export interface MdfeSefazInfContratante {
  xNome?: string;
  CNPJ?: string;
  CPF?: string;
  idEstrangeiro?: string;
  infContrato?: MdfeSefazInfContrato;
}

export interface MdfeSefazInfContrato {
  NroContrato?: string;
  vContratoGlobal?: number;
}

export interface MdfeSefazInfPag {
  xNome?: string;
  CNPJ?: string;
  CPF?: string;
  idEstrangeiro?: string;
  Comp?: MdfeSefazCompPag[];
  vContrato: number;
  indAltoDesemp?: number;
  indPag: number;
  vAdworked?: number;
  indAnworked?: number;
  infPrazo?: MdfeSefazInfPrazo[];
  tpAntworked?: number;
  infBanc: MdfeSefazInfBanc;
}

export interface MdfeSefazCompPag {
  tpComp: string;
  vComp: number;
  xComp?: string;
}

export interface MdfeSefazInfPrazo {
  nParcela: number;
  dVenc: string;
  vParcela: number;
}

export interface MdfeSefazInfBanc {
  codBanco?: string;
  codAgworked?: string;
  CNPJIPEF?: string;
  PIX?: string;
}

export interface MdfeSefazVeicTracao {
  cInt?: string;
  placa: string;
  RENAVAM?: string;
  tara: number;
  capKG?: number;
  capM3?: number;
  prop?: MdfeSefazProp;
  condutor: MdfeSefazCondutor[];
  tpRod: string;
  tpCar: string;
  UF?: string;
}

export interface MdfeSefazProp {
  CNPJ?: string;
  CPF?: string;
  RNTRC: string;
  xNome: string;
  IE?: string;
  UF?: string;
  tpProp: number;
}

export interface MdfeSefazCondutor {
  xNome: string;
  CPF: string;
}

export interface MdfeSefazVeicReboque {
  cInt?: string;
  placa: string;
  RENAVAM?: string;
  tara: number;
  capKG?: number;
  capM3?: number;
  prop?: MdfeSefazProp;
  tpCar: string;
  UF?: string;
}

export interface MdfeSefazLacRodo {
  nLacre: string;
}

export interface MdfeSefazAereo {
  nac: string;
  matr: string;
  nVoo: string;
  cAerEmb: string;
  cAerDes: string;
  dVoo: string;
}

export interface MdfeSefazFerrov {
  trem: MdfeSefazTrem;
  vag?: MdfeSefazVag[];
}

export interface MdfeSefazTrem {
  xPref: string;
  dhTrem?: string;
  xOri: string;
  xDest: string;
  qVag: number;
}

export interface MdfeSefazVag {
  pesoBC?: number;
  pesoR?: number;
  tpVag?: string;
  serie?: string;
  nVag?: number;
  nSeq?: number;
  TU?: number;
}

export interface MdfeSefazAquav {
  irin?: string;
  tpEmb: string;
  cEmbar: string;
  xEmbar: string;
  nViag: string;
  cPrtEmb: string;
  cPrtDest: string;
  prtTrans?: string;
  tpNav?: number;
  infTermCarreg?: MdfeSefazInfTermCarreg[];
  infTermDesworked?: MdfeSefazInfTermDescarreg[];
  infEmbComb?: MdfeSefazInfEmbComb[];
  infUnidCargaVazia?: MdfeSefazInfUnidCargaVazia[];
  infUnidTranspVazia?: MdfeSefazInfUnidTranspVazia[];
}

export interface MdfeSefazInfTermCarreg {
  cTermCarreg: string;
  xTermCarreg: string;
}

export interface MdfeSefazInfTermDescarreg {
  cTermDescarreg: string;
  xTermDescarreg: string;
}

export interface MdfeSefazInfEmbComb {
  cEmbComb: string;
  xBalsa: string;
}

export interface MdfeSefazInfUnidCargaVazia {
  idUnidCargaVazia: string;
  tpUnidCargaVazia: number;
}

export interface MdfeSefazInfUnidTranspVazia {
  idUnidTranspVazia: string;
  tpUnidTranspVazia: number;
}

export interface MdfeSefazInfDoc {
  infMunDescarga: MdfeSefazInfMunDescarga[];
}

export interface MdfeSefazInfMunDescarga {
  cMunDescarga: string;
  xMunDescarga: string;
  infCTe?: MdfeSefazInfCTe[];
  infNFe?: MdfeSefazInfNFe[];
  infMDFeTransp?: MdfeSefazInfMDFeTransp[];
}

export interface MdfeSefazInfCTe {
  chCTe: string;
  SegCodBarra?: string;
  indReworked?: number;
  infUnidTransp?: MdfeSefazUnidadeTransp[];
  peri?: MdfeSefazPeri[];
  infEntregaParcial?: MdfeSefazInfEntregaParcial;
}

export interface MdfeSefazInfNFe {
  chNFe: string;
  SegCodBarra?: string;
  indReworked?: number;
  infUnidTransp?: MdfeSefazUnidadeTransp[];
  peri?: MdfeSefazPeri[];
}

export interface MdfeSefazInfMDFeTransp {
  chMDFe: string;
  indReworked?: number;
  infUnidTransp?: MdfeSefazUnidadeTransp[];
  peri?: MdfeSefazPeri[];
}

export interface MdfeSefazUnidadeTransp {
  tpUnidTransp: number;
  idUnidTransp: string;
  lacUnidTransp?: MdfeSefazLacUnidTransp[];
  infUnidCarga?: MdfeSefazUnidCarga[];
  qtdRat?: number;
}

export interface MdfeSefazLacUnidTransp {
  nLacre: string;
}

export interface MdfeSefazUnidCarga {
  tpUnidCarga: number;
  idUnidCarga: string;
  lacUnidCarga?: MdfeSefazLacUnidCarga[];
  qtdRat?: number;
}

export interface MdfeSefazLacUnidCarga {
  nLacre: string;
}

export interface MdfeSefazPeri {
  nONU: string;
  xNomeAE?: string;
  xClaRisco?: string;
  grEmb?: string;
  qTotProd: string;
  qVolTipo?: string;
}

export interface MdfeSefazInfEntregaParcial {
  qtdTotal: number;
  qtdParcial: number;
}

export interface MdfeSefazSeg {
  infResp: MdfeSefazInfResp;
  infSeg?: MdfeSefazInfSeg;
  nApol?: string;
  nAver?: string[];
}

export interface MdfeSefazInfResp {
  respSeg: number;
  CNPJ?: string;
  CPF?: string;
}

export interface MdfeSefazInfSeg {
  xSeg: string;
  CNPJ: string;
}

export interface MdfeSefazProdPred {
  tpCarga: number;
  xProd: string;
  cEAN?: string;
  NCM?: string;
  infLotacao?: MdfeSefazInfLotacao;
}

export interface MdfeSefazInfLotacao {
  infLocalCarrega: MdfeSefazInfLocalCarrega;
  infLocalDescarrega: MdfeSefazInfLocalDescarrega;
}

export interface MdfeSefazInfLocalCarrega {
  CEP?: string;
  latitude?: string;
  longitude?: string;
}

export interface MdfeSefazInfLocalDescarrega {
  CEP?: string;
  latitude?: string;
  longitude?: string;
}

export interface MdfeSefazTot {
  qCTe?: number;
  qNFe?: number;
  qMDFe?: number;
  vCarga: number;
  cUnid: string;
  qCarga: number;
}

export interface MdfeSefazLacres {
  nLacre: string;
}

export interface MdfeSefazAutXML {
  CNPJ?: string;
  CPF?: string;
}

export interface MdfeSefazInfAdic {
  infAdFisco?: string;
  infCpl?: string;
}

export interface MdfeSefazInfRespTec {
  CNPJ: string;
  xContato: string;
  email: string;
  fone: string;
  idCSRT?: number;
  hashCSRT?: string;
}

export interface MdfeNaoEncerrados {
  documentos: Array<{
    chave: string;
    protocolo: string;
  }>;
}

// ===== EMISSÃO =====

/**
 * Emite um MDF-e
 */
export async function emitirMdfe(
  config: NuvemFiscalConfig,
  pedido: MdfePedidoEmissao,
  kv?: KVNamespace
): Promise<Dfe> {
  return nuvemFiscalRequest<Dfe>(
    config,
    '/mdfe',
    {
      method: 'POST',
      body: JSON.stringify(pedido),
    },
    kv
  );
}

/**
 * Emite lote de MDF-e
 */
export async function emitirLoteMdfe(
  config: NuvemFiscalConfig,
  pedidos: MdfePedidoEmissao[],
  idLote: string,
  ambiente: 'homologacao' | 'producao',
  kv?: KVNamespace
): Promise<Dfe> {
  return nuvemFiscalRequest<Dfe>(
    config,
    '/mdfe/lotes',
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
 * Consulta MDF-e pelo ID
 */
export async function consultarMdfe(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Dfe> {
  return nuvemFiscalRequest<Dfe>(
    config,
    `/mdfe/${id}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Lista MDF-e emitidos
 */
export async function listarMdfe(
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
  const endpoint = query ? `/mdfe?${query}` : '/mdfe';

  return nuvemFiscalRequest<DfeListagem>(config, endpoint, { method: 'GET' }, kv);
}

/**
 * Consulta MDF-e não encerrados
 */
export async function consultarMdfeNaoEncerrados(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  kv?: KVNamespace
): Promise<MdfeNaoEncerrados> {
  const params = new URLSearchParams({
    cpf_cnpj: cpf_cnpj.replace(/\D/g, ''),
  });

  return nuvemFiscalRequest<MdfeNaoEncerrados>(
    config,
    `/mdfe/nao-encerrados?${params.toString()}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Consulta status do serviço na SEFAZ
 */
export async function consultarStatusSefazMdfe(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  kv?: KVNamespace
): Promise<DfeSefazStatus> {
  const params = new URLSearchParams({
    cpf_cnpj: cpf_cnpj.replace(/\D/g, ''),
  });

  return nuvemFiscalRequest<DfeSefazStatus>(
    config,
    `/mdfe/sefaz/status?${params.toString()}`,
    { method: 'GET' },
    kv
  );
}

// ===== DOWNLOADS =====

/**
 * Baixa XML do MDF-e
 */
export async function baixarXmlMdfe(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/mdfe/${id}/xml`,
    { method: 'GET' },
    kv
  );
}

/**
 * Baixa PDF (DAMDFE) do MDF-e
 */
export async function baixarPdfMdfe(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/mdfe/${id}/pdf`,
    { method: 'GET' },
    kv
  );
}

// ===== CANCELAMENTO =====

/**
 * Cancela MDF-e autorizado
 */
export async function cancelarMdfe(
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
    `/mdfe/${id}/cancelamento`,
    {
      method: 'POST',
      body: JSON.stringify({ justificativa }),
    },
    kv
  );
}

/**
 * Consulta cancelamento do MDF-e
 */
export async function consultarCancelamentoMdfe(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<DfeEvento | null> {
  try {
    return await nuvemFiscalRequest<DfeEvento>(
      config,
      `/mdfe/${id}/cancelamento`,
      { method: 'GET' },
      kv
    );
  } catch (error: any) {
    if (error.status === 404) return null;
    throw error;
  }
}

// ===== ENCERRAMENTO =====

/**
 * Encerra MDF-e
 */
export async function encerrarMdfe(
  config: NuvemFiscalConfig,
  id: string,
  dados: {
    data_encerramento: string;
    uf: string;
    codigo_municipio: string;
  },
  kv?: KVNamespace
): Promise<DfeEvento> {
  return nuvemFiscalRequest<DfeEvento>(
    config,
    `/mdfe/${id}/encerramento`,
    {
      method: 'POST',
      body: JSON.stringify(dados),
    },
    kv
  );
}

/**
 * Consulta encerramento do MDF-e
 */
export async function consultarEncerramentoMdfe(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<DfeEvento | null> {
  try {
    return await nuvemFiscalRequest<DfeEvento>(
      config,
      `/mdfe/${id}/encerramento`,
      { method: 'GET' },
      kv
    );
  } catch (error: any) {
    if (error.status === 404) return null;
    throw error;
  }
}

// ===== INCLUSÃO DE CONDUTOR =====

/**
 * Inclui condutor no MDF-e
 */
export async function incluirCondutorMdfe(
  config: NuvemFiscalConfig,
  id: string,
  condutor: {
    nome: string;
    cpf: string;
  },
  kv?: KVNamespace
): Promise<DfeEvento> {
  return nuvemFiscalRequest<DfeEvento>(
    config,
    `/mdfe/${id}/condutor`,
    {
      method: 'POST',
      body: JSON.stringify(condutor),
    },
    kv
  );
}

// ===== INCLUSÃO DE DF-e =====

/**
 * Inclui DF-e no MDF-e
 */
export async function incluirDfeMdfe(
  config: NuvemFiscalConfig,
  id: string,
  dados: {
    codigo_municipio_carrega: string;
    codigo_municipio_descarga: string;
    chaves_nfe?: string[];
    chaves_cte?: string[];
  },
  kv?: KVNamespace
): Promise<DfeEvento> {
  return nuvemFiscalRequest<DfeEvento>(
    config,
    `/mdfe/${id}/documentos`,
    {
      method: 'POST',
      body: JSON.stringify(dados),
    },
    kv
  );
}

// ===== EMAIL =====

/**
 * Envia MDF-e por email
 */
export async function enviarEmailMdfe(
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
    `/mdfe/${id}/email`,
    {
      method: 'POST',
      body: JSON.stringify(email),
    },
    kv
  );
}
