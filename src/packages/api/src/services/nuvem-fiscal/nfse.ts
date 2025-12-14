// =============================================
// PLANAC ERP - Nuvem Fiscal NFS-e Service
// Nota Fiscal de Serviço Eletrônica
// =============================================

import type { 
  NuvemFiscalConfig, 
  PaginacaoParams 
} from './types';
import { nuvemFiscalRequest } from './auth';

// ===== TIPOS ESPECÍFICOS NFS-e =====

export interface NfseDfe {
  id: string;
  ambiente: 'homologacao' | 'producao';
  created_at: string;
  status: string;
  numero?: string;
  codigo_verificacao?: string;
  data_emissao?: string;
  valor_total?: number;
  referencia?: string;
}

export interface NfseListagem {
  data: NfseDfe[];
  '@count'?: number;
}

export interface NfsePedidoEmissao {
  ambiente: 'homologacao' | 'producao';
  referencia?: string;
  provedor?: string; // Código do provedor/prefeitura
  infDPS: NfseInfDPS;
}

export interface NfseInfDPS {
  tpAmb?: number;
  dhEmi: string;
  verAplic?: string;
  serie?: string;
  nDPS?: number;
  dCompet: string;
  tpEmit?: number;
  cLocEmi?: number;
  subst?: NfseSubstituicao;
  prest: NfsePrestador;
  toma: NfseTomador;
  interm?: NfseIntermediario;
  serv: NfseServico;
  valores: NfseValores;
  infNFSe?: NfseInfoComplementar;
}

export interface NfseSubstituicao {
  chSubstda?: string;
  cMotivo?: number;
  xMotivo?: string;
}

export interface NfsePrestador {
  CNPJ?: string;
  CPF?: string;
  IM?: string;
  regTrib?: NfseRegimeTributario;
}

export interface NfseRegimeTributario {
  opSimpNac?: number;
  regApTribSN?: number;
  regEspTrib?: number;
}

export interface NfseTomador {
  CNPJ?: string;
  CPF?: string;
  NIF?: string;
  cNaoNIF?: number;
  CAEPF?: string;
  IM?: string;
  xNome: string;
  end?: NfseEndereco;
  fone?: string;
  email?: string;
}

export interface NfseIntermediario {
  CNPJ?: string;
  CPF?: string;
  NIF?: string;
  IM?: string;
  xNome?: string;
}

export interface NfseEndereco {
  xLgr?: string;
  nro?: string;
  xCpl?: string;
  xBairro?: string;
  cMun?: number;
  UF?: string;
  CEP?: string;
  cPais?: string;
  xPais?: string;
}

export interface NfseServico {
  cServ: NfseCodigoServico;
  xDescServ: string;
  locPrest?: NfseLocalPrestacao;
  cPaisResult?: string;
}

export interface NfseCodigoServico {
  cTribNac: string;
  cTribMun?: string;
  CNAE?: string;
  cNBS?: string;
  cIntContworked?: string;
}

export interface NfseLocalPrestacao {
  cLocPrestacao?: number;
  cPaisPrestacao?: string;
  opConsworked?: number;
}

export interface NfseValores {
  vServPrest: NfseValorServico;
  vDescCondworked?: NfseDescontoCondicional;
  vDedRed?: NfseDeducaoReducao;
  trib: NfseTributacao;
}

export interface NfseValorServico {
  vReceb?: number;
  vServ: number;
}

export interface NfseDescontoCondicional {
  vDescIncworked?: number;
  vDescCondworked?: number;
}

export interface NfseDeducaoReducao {
  pDR?: number;
  vDR?: number;
}

export interface NfseTributacao {
  tribMun: NfseTribMunicipal;
  tribFed?: NfseTribFederal;
  totTrib?: NfseTotalTributos;
}

export interface NfseTribMunicipal {
  tribISSQN?: number;
  cPaisResult?: string;
  BM?: NfseBaseISS;
  exigISS?: number;
  tpImworked?: number;
  pAliq?: number;
  tpRetISS?: number;
}

export interface NfseBaseISS {
  vBC?: number;
  pRedBC?: number;
  vISSQN?: number;
}

export interface NfseTribFederal {
  piscofins?: NfsePisCofins;
  vRetCP?: number;
  vRetIRRF?: number;
  vRetCSLL?: number;
}

export interface NfsePisCofins {
  vPIS?: number;
  vCOFINS?: number;
  vRetPIS?: number;
  vRetCOFINS?: number;
}

export interface NfseTotalTributos {
  vTotTrib?: number;
  pTotTrib?: number;
  indTotTrib?: number;
  pTotTribSN?: number;
}

export interface NfseInfoComplementar {
  xInfPrest?: string;
  xInfToma?: string;
  xInfInt?: string;
}

// ===== EMISSÃO =====

/**
 * Emite uma NFS-e
 */
export async function emitirNfse(
  config: NuvemFiscalConfig,
  pedido: NfsePedidoEmissao,
  kv?: KVNamespace
): Promise<NfseDfe> {
  return nuvemFiscalRequest<NfseDfe>(
    config,
    '/nfse/dps',
    {
      method: 'POST',
      body: JSON.stringify(pedido),
    },
    kv
  );
}

/**
 * Emite lote de NFS-e
 */
export async function emitirLoteNfse(
  config: NuvemFiscalConfig,
  pedidos: NfsePedidoEmissao[],
  idLote: string,
  ambiente: 'homologacao' | 'producao',
  kv?: KVNamespace
): Promise<any> {
  return nuvemFiscalRequest<any>(
    config,
    '/nfse/dps/lotes',
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
 * Consulta NFS-e pelo ID
 */
export async function consultarNfse(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<NfseDfe> {
  return nuvemFiscalRequest<NfseDfe>(
    config,
    `/nfse/dps/${id}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Lista NFS-e emitidas
 */
export async function listarNfse(
  config: NuvemFiscalConfig,
  filtros?: {
    cpf_cnpj?: string;
    ambiente?: 'homologacao' | 'producao';
    referencia?: string;
  },
  paginacao?: PaginacaoParams,
  kv?: KVNamespace
): Promise<NfseListagem> {
  const params = new URLSearchParams();

  if (filtros?.cpf_cnpj) params.append('cpf_cnpj', filtros.cpf_cnpj.replace(/\D/g, ''));
  if (filtros?.ambiente) params.append('ambiente', filtros.ambiente);
  if (filtros?.referencia) params.append('referencia', filtros.referencia);
  if (paginacao?.$top) params.append('$top', paginacao.$top.toString());
  if (paginacao?.$skip) params.append('$skip', paginacao.$skip.toString());
  if (paginacao?.$inlinecount) params.append('$inlinecount', 'true');

  const query = params.toString();
  const endpoint = query ? `/nfse/dps?${query}` : '/nfse/dps';

  return nuvemFiscalRequest<NfseListagem>(config, endpoint, { method: 'GET' }, kv);
}

/**
 * Lista cidades com NFS-e habilitada
 */
export async function listarCidadesNfse(
  config: NuvemFiscalConfig,
  uf?: string,
  kv?: KVNamespace
): Promise<any[]> {
  const params = new URLSearchParams();
  if (uf) params.append('uf', uf);

  const query = params.toString();
  const endpoint = query ? `/nfse/cidades?${query}` : '/nfse/cidades';

  const result = await nuvemFiscalRequest<{ data: any[] }>(config, endpoint, { method: 'GET' }, kv);
  return result.data || [];
}

// ===== DOWNLOADS =====

/**
 * Baixa XML da NFS-e
 */
export async function baixarXmlNfse(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/nfse/dps/${id}/xml`,
    { method: 'GET' },
    kv
  );
}

/**
 * Baixa PDF da NFS-e
 */
export async function baixarPdfNfse(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/nfse/dps/${id}/pdf`,
    { method: 'GET' },
    kv
  );
}

// ===== CANCELAMENTO =====

/**
 * Cancela NFS-e
 */
export async function cancelarNfse(
  config: NuvemFiscalConfig,
  id: string,
  justificativa: string,
  kv?: KVNamespace
): Promise<any> {
  return nuvemFiscalRequest<any>(
    config,
    `/nfse/dps/${id}/cancelamento`,
    {
      method: 'POST',
      body: JSON.stringify({ justificativa }),
    },
    kv
  );
}

/**
 * Consulta cancelamento da NFS-e
 */
export async function consultarCancelamentoNfse(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<any> {
  try {
    return await nuvemFiscalRequest<any>(
      config,
      `/nfse/dps/${id}/cancelamento`,
      { method: 'GET' },
      kv
    );
  } catch (error: any) {
    if (error.status === 404) return null;
    throw error;
  }
}

// ===== EMAIL =====

/**
 * Envia NFS-e por email
 */
export async function enviarEmailNfse(
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
    `/nfse/dps/${id}/email`,
    {
      method: 'POST',
      body: JSON.stringify(email),
    },
    kv
  );
}
