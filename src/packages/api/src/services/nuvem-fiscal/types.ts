// =============================================
// PLANAC ERP - Nuvem Fiscal Types
// Tipos compartilhados para toda integração
// =============================================

// ===== CONFIGURAÇÃO =====
export interface NuvemFiscalConfig {
  clientId: string;
  clientSecret: string;
  ambiente: 'homologacao' | 'producao';
}

export interface NuvemFiscalEnv {
  NUVEM_FISCAL_CLIENT_ID: string;
  NUVEM_FISCAL_CLIENT_SECRET: string;
  NUVEM_FISCAL_AMBIENTE?: 'homologacao' | 'producao';
  NUVEM_FISCAL_TOKEN_CACHE?: KVNamespace;
}

// ===== AUTENTICAÇÃO =====
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

// ===== CEP =====
export interface CepEndereco {
  cep: string;
  logradouro: string;
  complemento?: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  codigo_municipio?: string;
  nome_municipio?: string;
}

// ===== CNPJ =====
export interface CnpjEmpresa {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  data_inicio_atividade?: string;
  situacao_cadastral?: string;
  data_situacao_cadastral?: string;
  motivo_situacao_cadastral?: string;
  natureza_juridica?: CnpjNaturezaJuridica;
  porte?: string;
  capital_social?: number;
  endereco?: CnpjEndereco;
  telefones?: CnpjTelefone[];
  email?: string;
  atividade_principal?: CnpjAtividade;
  atividades_secundarias?: CnpjAtividade[];
  socios?: CnpjSocio[];
  simples?: CnpjSimples;
  simei?: CnpjSimei;
}

export interface CnpjNaturezaJuridica {
  codigo: string;
  descricao: string;
}

export interface CnpjEndereco {
  tipo_logradouro?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  uf: string;
  codigo_municipio: string;
  municipio: string;
  codigo_pais?: string;
  pais?: string;
}

export interface CnpjTelefone {
  ddd: string;
  numero: string;
}

export interface CnpjAtividade {
  codigo: string;
  descricao: string;
}

export interface CnpjSocio {
  cpf_cnpj?: string;
  nome: string;
  tipo: string;
  qualificacao?: CnpjQualificacao;
  data_entrada?: string;
  faixa_etaria?: string;
  pais_origem?: string;
  representante_legal?: CnpjRepresentanteLegal;
}

export interface CnpjQualificacao {
  codigo: string;
  descricao: string;
}

export interface CnpjRepresentanteLegal {
  cpf?: string;
  nome?: string;
  qualificacao?: CnpjQualificacao;
}

export interface CnpjSimples {
  optante: boolean;
  data_opcao?: string;
  data_exclusao?: string;
}

export interface CnpjSimei {
  optante: boolean;
  data_opcao?: string;
  data_exclusao?: string;
}

export interface CnpjListagem {
  data: CnpjEmpresa[];
  '@count'?: number;
}

// ===== EMPRESA =====
export interface Empresa {
  cpf_cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  nome_razao_social: string;
  nome_fantasia?: string;
  fone?: string;
  email?: string;
  endereco: EmpresaEndereco;
  optante_simples_nacional?: boolean;
  regime_tributacao?: number;
  regime_especial_tributacao?: number;
  incentivo_fiscal?: boolean;
  incentivador_cultural?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmpresaEndereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  codigo_municipio: string;
  cidade: string;
  uf: string;
  cep: string;
  codigo_pais?: string;
  pais?: string;
}

export interface EmpresaCertificado {
  certificado: string; // Base64 do arquivo .pfx
  password: string;
}

export interface EmpresaCertificadoInfo {
  serial_number?: string;
  issuer_name?: string;
  subject_name?: string;
  not_valid_before?: string;
  not_valid_after?: string;
}

export interface EmpresaConfigNfe {
  ambiente: 'homologacao' | 'producao';
  serie_nfe?: number;
  proximo_numero_nfe?: number;
  serie_nfce?: number;
  proximo_numero_nfce?: number;
  id_csc?: string;
  csc?: string;
}

export interface EmpresaListagem {
  data: Empresa[];
  '@count'?: number;
}

// ===== DOCUMENTOS FISCAIS COMUM =====
export interface Dfe {
  id: string;
  ambiente: 'homologacao' | 'producao';
  created_at: string;
  status: DfeStatus;
  modelo?: number;
  serie?: number;
  numero?: number;
  valor_total?: number;
  chave?: string;
  data_emissao?: string;
  referencia?: string;
  autorizacao?: DfeAutorizacao;
}

export type DfeStatus = 
  | 'pendente'
  | 'processando'
  | 'autorizado'
  | 'rejeitado'
  | 'cancelado'
  | 'erro'
  | 'denegado';

export interface DfeAutorizacao {
  data_hora?: string;
  protocolo?: string;
  digest_value?: string;
}

export interface DfeEvento {
  id: string;
  ambiente: 'homologacao' | 'producao';
  created_at: string;
  status: DfeStatus;
  tipo_evento: string;
  numero_sequencial?: number;
  data_evento?: string;
  autorizacao?: DfeEventoAutorizacao;
}

export interface DfeEventoAutorizacao {
  data_hora?: string;
  protocolo?: string;
}

export interface DfeListagem {
  data: Dfe[];
  '@count'?: number;
}

export interface DfeSefazStatus {
  status: string;
  motivo: string;
  data_hora: string;
  tempo_medio?: number;
  retorno?: string;
}

// ===== NF-e =====
export interface NfePedidoEmissao {
  ambiente: 'homologacao' | 'producao';
  referencia?: string;
  infNFe: NfeSefazInfNFe;
  infNFeSupl?: NfeSefazInfNFeSupl;
}

export interface NfeSefazInfNFe {
  versao?: string;
  ide: NfeSefazIde;
  emit: NfeSefazEmit;
  dest?: NfeSefazDest;
  det: NfeSefazDet[];
  total: NfeSefazTotal;
  transp: NfeSefazTransp;
  pag: NfeSefazPag;
  infAdic?: NfeSefazInfAdic;
  infRespTec?: NfeSefazInfRespTec;
}

export interface NfeSefazIde {
  cUF: number;
  cNF?: string;
  natOp: string;
  mod?: number;
  serie: number;
  nNF: number;
  dhEmi: string;
  dhSaiEnt?: string;
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
  indIntermed?: number;
  procEmi?: number;
  verProc?: string;
  NFref?: NfeSefazNFref[];
}

export interface NfeSefazNFref {
  refNFe?: string;
  refNFeSig?: string;
  refNF?: NfeSefazRefNF;
  refNFP?: NfeSefazRefNFP;
  refCTe?: string;
  refECF?: NfeSefazRefECF;
}

export interface NfeSefazRefNF {
  cUF: number;
  AAMM: string;
  CNPJ: string;
  mod: string;
  serie: number;
  nNF: number;
}

export interface NfeSefazRefNFP {
  cUF: number;
  AAMM: string;
  CNPJ?: string;
  CPF?: string;
  IE: string;
  mod: string;
  serie: number;
  nNF: number;
}

export interface NfeSefazRefECF {
  mod: string;
  nECF: number;
  nCOO: number;
}

export interface NfeSefazEmit {
  CNPJ?: string;
  CPF?: string;
  xNome: string;
  xFant?: string;
  enderEmit: NfeSefazEndereco;
  IE: string;
  IEST?: string;
  IM?: string;
  CNAE?: string;
  CRT: number;
}

export interface NfeSefazDest {
  CNPJ?: string;
  CPF?: string;
  idEstrangeiro?: string;
  xNome?: string;
  enderDest?: NfeSefazEndereco;
  indIEDest: number;
  IE?: string;
  ISUF?: string;
  IM?: string;
  email?: string;
}

export interface NfeSefazEndereco {
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

export interface NfeSefazDet {
  nItem: number;
  prod: NfeSefazProd;
  imposto: NfeSefazImposto;
  infAdProd?: string;
}

export interface NfeSefazProd {
  cProd: string;
  cEAN: string;
  cBarra?: string;
  xProd: string;
  NCM: string;
  NVE?: string[];
  CEST?: string;
  indEscala?: string;
  CNPJFab?: string;
  cBenef?: string;
  EXTIPI?: string;
  CFOP: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
  cEANTrib: string;
  cBarraTrib?: string;
  uTrib: string;
  qTrib: number;
  vUnTrib: number;
  vFrete?: number;
  vSeg?: number;
  vDesc?: number;
  vOutro?: number;
  indTot: number;
  xPed?: string;
  nItemPed?: number;
  nFCI?: string;
}

export interface NfeSefazImposto {
  vTotTrib?: number;
  ICMS?: NfeSefazICMS;
  IPI?: NfeSefazIPI;
  PIS?: NfeSefazPIS;
  COFINS?: NfeSefazCOFINS;
}

export interface NfeSefazICMS {
  ICMS00?: NfeSefazICMS00;
  ICMS10?: NfeSefazICMS10;
  ICMS20?: NfeSefazICMS20;
  ICMS30?: NfeSefazICMS30;
  ICMS40?: NfeSefazICMS40;
  ICMS51?: NfeSefazICMS51;
  ICMS60?: NfeSefazICMS60;
  ICMS70?: NfeSefazICMS70;
  ICMS90?: NfeSefazICMS90;
  ICMSSN101?: NfeSefazICMSSN101;
  ICMSSN102?: NfeSefazICMSSN102;
  ICMSSN201?: NfeSefazICMSSN201;
  ICMSSN202?: NfeSefazICMSSN202;
  ICMSSN500?: NfeSefazICMSSN500;
  ICMSSN900?: NfeSefazICMSSN900;
}

export interface NfeSefazICMS00 {
  orig: number;
  CST: string;
  modBC: number;
  vBC: number;
  pICMS: number;
  vICMS: number;
  pFCP?: number;
  vFCP?: number;
}

export interface NfeSefazICMS10 {
  orig: number;
  CST: string;
  modBC: number;
  vBC: number;
  pICMS: number;
  vICMS: number;
  vBCFCP?: number;
  pFCP?: number;
  vFCP?: number;
  modBCST: number;
  pMVAST?: number;
  pRedBCST?: number;
  vBCST: number;
  pICMSST: number;
  vICMSST: number;
  vBCFCPST?: number;
  pFCPST?: number;
  vFCPST?: number;
  vICMSSTDeson?: number;
  motDesICMSST?: number;
}

export interface NfeSefazICMS20 {
  orig: number;
  CST: string;
  modBC: number;
  pRedBC: number;
  vBC: number;
  pICMS: number;
  vICMS: number;
  vBCFCP?: number;
  pFCP?: number;
  vFCP?: number;
  vICMSDeson?: number;
  motDesICMS?: number;
  indDeduzDeson?: number;
}

export interface NfeSefazICMS30 {
  orig: number;
  CST: string;
  modBCST: number;
  pMVAST?: number;
  pRedBCST?: number;
  vBCST: number;
  pICMSST: number;
  vICMSST: number;
  vBCFCPST?: number;
  pFCPST?: number;
  vFCPST?: number;
  vICMSDeson?: number;
  motDesICMS?: number;
  indDeduzDeson?: number;
}

export interface NfeSefazICMS40 {
  orig: number;
  CST: string;
  vICMSDeson?: number;
  motDesICMS?: number;
  indDeduzDeson?: number;
}

export interface NfeSefazICMS51 {
  orig: number;
  CST: string;
  modBC?: number;
  pRedBC?: number;
  cBenefRBC?: string;
  vBC?: number;
  pICMS?: number;
  vICMSOp?: number;
  pDif?: number;
  vICMSDif?: number;
  vICMS?: number;
  vBCFCP?: number;
  pFCP?: number;
  vFCP?: number;
  pFCPDif?: number;
  vFCPDif?: number;
  vFCPEfet?: number;
}

export interface NfeSefazICMS60 {
  orig: number;
  CST: string;
  vBCSTRet?: number;
  pST?: number;
  vICMSSubstituto?: number;
  vICMSSTRet?: number;
  vBCFCPSTRet?: number;
  pFCPSTRet?: number;
  vFCPSTRet?: number;
  pRedBCEfet?: number;
  vBCEfet?: number;
  pICMSEfet?: number;
  vICMSEfet?: number;
}

export interface NfeSefazICMS70 {
  orig: number;
  CST: string;
  modBC: number;
  pRedBC: number;
  vBC: number;
  pICMS: number;
  vICMS: number;
  vBCFCP?: number;
  pFCP?: number;
  vFCP?: number;
  modBCST: number;
  pMVAST?: number;
  pRedBCST?: number;
  vBCST: number;
  pICMSST: number;
  vICMSST: number;
  vBCFCPST?: number;
  pFCPST?: number;
  vFCPST?: number;
  vICMSDeson?: number;
  motDesICMS?: number;
  indDeduzDeson?: number;
  vICMSSTDeson?: number;
  motDesICMSST?: number;
}

export interface NfeSefazICMS90 {
  orig: number;
  CST: string;
  modBC?: number;
  vBC?: number;
  pRedBC?: number;
  pICMS?: number;
  vICMS?: number;
  vBCFCP?: number;
  pFCP?: number;
  vFCP?: number;
  modBCST?: number;
  pMVAST?: number;
  pRedBCST?: number;
  vBCST?: number;
  pICMSST?: number;
  vICMSST?: number;
  vBCFCPST?: number;
  pFCPST?: number;
  vFCPST?: number;
  vICMSDeson?: number;
  motDesICMS?: number;
  indDeduzDeson?: number;
}

export interface NfeSefazICMSSN101 {
  orig: number;
  CSOSN: string;
  pCredSN: number;
  vCredICMSSN: number;
}

export interface NfeSefazICMSSN102 {
  orig: number;
  CSOSN: string;
}

export interface NfeSefazICMSSN201 {
  orig: number;
  CSOSN: string;
  modBCST: number;
  pMVAST?: number;
  pRedBCST?: number;
  vBCST: number;
  pICMSST: number;
  vICMSST: number;
  vBCFCPST?: number;
  pFCPST?: number;
  vFCPST?: number;
  pCredSN: number;
  vCredICMSSN: number;
}

export interface NfeSefazICMSSN202 {
  orig: number;
  CSOSN: string;
  modBCST: number;
  pMVAST?: number;
  pRedBCST?: number;
  vBCST: number;
  pICMSST: number;
  vICMSST: number;
  vBCFCPST?: number;
  pFCPST?: number;
  vFCPST?: number;
}

export interface NfeSefazICMSSN500 {
  orig: number;
  CSOSN: string;
  vBCSTRet?: number;
  pST?: number;
  vICMSSubstituto?: number;
  vICMSSTRet?: number;
  vBCFCPSTRet?: number;
  pFCPSTRet?: number;
  vFCPSTRet?: number;
  pRedBCEfet?: number;
  vBCEfet?: number;
  pICMSEfet?: number;
  vICMSEfet?: number;
}

export interface NfeSefazICMSSN900 {
  orig: number;
  CSOSN: string;
  modBC?: number;
  vBC?: number;
  pRedBC?: number;
  pICMS?: number;
  vICMS?: number;
  modBCST?: number;
  pMVAST?: number;
  pRedBCST?: number;
  vBCST?: number;
  pICMSST?: number;
  vICMSST?: number;
  vBCFCPST?: number;
  pFCPST?: number;
  vFCPST?: number;
  pCredSN?: number;
  vCredICMSSN?: number;
}

export interface NfeSefazIPI {
  CNPJProd?: string;
  cSelo?: string;
  qSelo?: number;
  cEnq: string;
  IPITrib?: NfeSefazIPITrib;
  IPINT?: NfeSefazIPINT;
}

export interface NfeSefazIPITrib {
  CST: string;
  vBC?: number;
  pIPI?: number;
  qUnid?: number;
  vUnid?: number;
  vIPI: number;
}

export interface NfeSefazIPINT {
  CST: string;
}

export interface NfeSefazPIS {
  PISAliq?: NfeSefazPISAliq;
  PISQtde?: NfeSefazPISQtde;
  PISNT?: NfeSefazPISNT;
  PISOutr?: NfeSefazPISOutr;
}

export interface NfeSefazPISAliq {
  CST: string;
  vBC: number;
  pPIS: number;
  vPIS: number;
}

export interface NfeSefazPISQtde {
  CST: string;
  qBCProd: number;
  vAliqProd: number;
  vPIS: number;
}

export interface NfeSefazPISNT {
  CST: string;
}

export interface NfeSefazPISOutr {
  CST: string;
  vBC?: number;
  pPIS?: number;
  qBCProd?: number;
  vAliqProd?: number;
  vPIS: number;
}

export interface NfeSefazCOFINS {
  COFINSAliq?: NfeSefazCOFINSAliq;
  COFINSQtde?: NfeSefazCOFINSQtde;
  COFINSNT?: NfeSefazCOFINSNT;
  COFINSOutr?: NfeSefazCOFINSOutr;
}

export interface NfeSefazCOFINSAliq {
  CST: string;
  vBC: number;
  pCOFINS: number;
  vCOFINS: number;
}

export interface NfeSefazCOFINSQtde {
  CST: string;
  qBCProd: number;
  vAliqProd: number;
  vCOFINS: number;
}

export interface NfeSefazCOFINSNT {
  CST: string;
}

export interface NfeSefazCOFINSOutr {
  CST: string;
  vBC?: number;
  pCOFINS?: number;
  qBCProd?: number;
  vAliqProd?: number;
  vCOFINS: number;
}

export interface NfeSefazTotal {
  ICMSTot: NfeSefazICMSTot;
  ISSQNtot?: NfeSefazISSQNtot;
  retTrib?: NfeSefazRetTrib;
}

export interface NfeSefazICMSTot {
  vBC: number;
  vICMS: number;
  vICMSDeson?: number;
  vFCPUFDest?: number;
  vICMSUFDest?: number;
  vICMSUFRemet?: number;
  vFCP?: number;
  vBCST: number;
  vST: number;
  vFCPST?: number;
  vFCPSTRet?: number;
  vProd: number;
  vFrete?: number;
  vSeg?: number;
  vDesc?: number;
  vII?: number;
  vIPI?: number;
  vIPIDevol?: number;
  vPIS: number;
  vCOFINS: number;
  vOutro?: number;
  vNF: number;
  vTotTrib?: number;
}

export interface NfeSefazISSQNtot {
  vServ?: number;
  vBC?: number;
  vISS?: number;
  vPIS?: number;
  vCOFINS?: number;
  dCompet?: string;
  vDeducao?: number;
  vOutro?: number;
  vDescIncond?: number;
  vDescCond?: number;
  vISSRet?: number;
  cRegTrib?: number;
}

export interface NfeSefazRetTrib {
  vRetPIS?: number;
  vRetCOFINS?: number;
  vRetCSLL?: number;
  vBCIRRF?: number;
  vIRRF?: number;
  vBCRetPrev?: number;
  vRetPrev?: number;
}

export interface NfeSefazTransp {
  modFrete: number;
  transporta?: NfeSefazTransporta;
  retTransp?: NfeSefazRetTransp;
  veicTransp?: NfeSefazVeiculo;
  reboque?: NfeSefazVeiculo[];
  vagao?: string;
  balsa?: string;
  vol?: NfeSefazVol[];
}

export interface NfeSefazTransporta {
  CNPJ?: string;
  CPF?: string;
  xNome?: string;
  IE?: string;
  xEnder?: string;
  xMun?: string;
  UF?: string;
}

export interface NfeSefazRetTransp {
  vServ: number;
  vBCRet: number;
  pICMSRet: number;
  vICMSRet: number;
  CFOP: string;
  cMunFG: string;
}

export interface NfeSefazVeiculo {
  placa: string;
  UF?: string;
  RNTC?: string;
}

export interface NfeSefazVol {
  qVol?: number;
  esp?: string;
  marca?: string;
  nVol?: string;
  pesoL?: number;
  pesoB?: number;
  lacres?: NfeSefazLacres[];
}

export interface NfeSefazLacres {
  nLacre: string;
}

export interface NfeSefazPag {
  detPag: NfeSefazDetPag[];
  vTroco?: number;
}

export interface NfeSefazDetPag {
  indPag?: number;
  tPag: string;
  xPag?: string;
  vPag: number;
  dPag?: string;
  CNPJPag?: string;
  UFPag?: string;
  card?: NfeSefazCard;
}

export interface NfeSefazCard {
  tpIntegra: number;
  CNPJ?: string;
  tBand?: string;
  cAut?: string;
  CNPJRecworked?: string;
  idTermPag?: string;
}

export interface NfeSefazInfAdic {
  infAdFisco?: string;
  infCpl?: string;
  obsCont?: NfeSefazObsCont[];
  obsFisco?: NfeSefazObsFisco[];
  procRef?: NfeSefazProcRef[];
}

export interface NfeSefazObsCont {
  xCampo: string;
  xTexto: string;
}

export interface NfeSefazObsFisco {
  xCampo: string;
  xTexto: string;
}

export interface NfeSefazProcRef {
  nProc: string;
  indProc: number;
  tpAto?: number;
}

export interface NfeSefazInfRespTec {
  CNPJ: string;
  xContato: string;
  email: string;
  fone: string;
  idCSRT?: number;
  hashCSRT?: string;
}

export interface NfeSefazInfNFeSupl {
  qrCode?: string;
  urlChave?: string;
}

// ===== CANCELAMENTO =====
export interface NfePedidoCancelamento {
  justificativa: string;
}

// ===== CARTA DE CORREÇÃO =====
export interface NfePedidoCartaCorrecao {
  correcao: string;
}

// ===== INUTILIZAÇÃO =====
export interface NfePedidoInutilizacao {
  ambiente: 'homologacao' | 'producao';
  cnpj: string;
  ano: number;
  serie: number;
  numero_inicial: number;
  numero_final: number;
  justificativa: string;
}

export interface NfeInutilizacao {
  id: string;
  ambiente: 'homologacao' | 'producao';
  created_at: string;
  status: DfeStatus;
  cnpj: string;
  ano: number;
  modelo: number;
  serie: number;
  numero_inicial: number;
  numero_final: number;
  justificativa: string;
  autorizacao?: DfeAutorizacao;
}

// ===== DISTRIBUIÇÃO NF-e =====
export interface DistribuicaoNfePedido {
  cpf_cnpj: string;
  ambiente: 'homologacao' | 'producao';
  dist_nsu?: number;
  cons_nsu?: number;
  cons_chave?: string;
}

export interface DistribuicaoNfe {
  id: string;
  ambiente: 'homologacao' | 'producao';
  created_at: string;
  status: string;
  cpf_cnpj: string;
  tipo_consulta: string;
  ult_nsu?: number;
  max_nsu?: number;
  documentos_encontrados?: number;
}

export interface DistribuicaoNfeDocumento {
  id: string;
  ambiente: 'homologacao' | 'producao';
  created_at: string;
  nsu: number;
  chave?: string;
  tipo_documento: 'nota' | 'evento';
  forma_distribuicao: 'resumida' | 'completa';
  cpf_cnpj_destinatario?: string;
  nome_destinatario?: string;
  data_emissao?: string;
  valor_total?: number;
}

export interface DistribuicaoNfeListagem {
  data: DistribuicaoNfe[];
  '@count'?: number;
}

export interface DistribuicaoNfeDocumentoListagem {
  data: DistribuicaoNfeDocumento[];
  '@count'?: number;
}

// ===== EMAIL =====
export interface EmailPedido {
  para: string[];
  cc?: string[];
  cco?: string[];
  assunto?: string;
  corpo?: string;
  anexar_pdf?: boolean;
  anexar_xml?: boolean;
}

// ===== ERROS =====
export class NuvemFiscalError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'NuvemFiscalError';
  }
}

// ===== PAGINAÇÃO =====
export interface PaginacaoParams {
  $top?: number;
  $skip?: number;
  $inlinecount?: boolean;
}
