// =============================================
// PLANAC ERP - ADRC-ST Types
// =============================================
// Arquivo: src/api/src/services/adrcst/types.ts
// Tipos para geracao do arquivo ADRC-ST conforme Manual versao 1.6

// =============================================
// TIPOS DE REGISTRO
// =============================================

export type TipoRegistro = 
  | '0000' | '1000' | '1010' | '1100' | '1110' | '1115' | '1120'
  | '1200' | '1210' | '1220'
  | '1300' | '1310' | '1320'
  | '1400' | '1410' | '1420'
  | '1500' | '1510' | '1520'
  | '1999' | '9000' | '9999';

export type TipoDocumento = 
  | '1110'   // Entrada
  | '1120'   // Devolucao entrada
  | '1210'   // Saida consumidor final
  | '1220'   // Devolucao saida consumidor final
  | '1310'   // Saida interestadual
  | '1320'   // Devolucao saida interestadual
  | '1410'   // Saida art. 119
  | '1420'   // Devolucao saida art. 119
  | '1510'   // Saida Simples Nacional
  | '1520'; // Devolucao saida Simples Nacional

export type StatusApuracao = 
  | 'rascunho'
  | 'calculado'
  | 'gerado'
  | 'enviado'
  | 'protocolado'
  | 'substituido'
  | 'erro';

export type OpcaoRecuperacao = 0 | 1 | 2; // 0=Conta grafica, 1=Ressarcimento, 2=Complementacao (apenas R1200)

export type TipoGuia = 1 | 2; // 1=GNRE, 2=GR-PR

export type CodigoResponsavelRetencao = 1 | 2 | 3; // 1=Remetente direto, 2=Indireto, 3=Proprio

// =============================================
// REGISTRO 0000 - ABERTURA E IDENTIFICACAO
// =============================================

export interface Registro0000 {
  REG: '0000';
  COD_VERSAO: number;           // A02 - Versao do leiaute (110)
  MES_ANO: string;              // A03 - Periodo de referencia (MMAAAA)
  CNPJ: string;                 // A04 - CNPJ do declarante
  IE: string;                   // A05 - IE do declarante
  NOME: string;                 // A06 - Razao social
  CD_FIN: 0 | 1;                // A07 - Finalidade (0=Original, 1=Substituto)
  N_REG_ESPECIAL?: string;      // A08 - Numero regime especial
  CNPJ_CD?: string;             // A09 - CNPJ do CD
  IE_CD?: string;               // A10 - IE do CD
  OPCAO_R1200?: OpcaoRecuperacao; // A11 - Opcao R1200
  OPCAO_R1300?: 0 | 1;          // A12 - Opcao R1300
  OPCAO_R1400?: 0 | 1;          // A13 - Opcao R1400
  OPCAO_R1500?: 0 | 1;          // A14 - Opcao R1500
}

// =============================================
// REGISTRO 1000 - IDENTIFICACAO DO ITEM
// =============================================

export interface Registro1000 {
  REG: '1000';
  IND_FECOP: 0 | 1;             // B02 - Indicador FECOP
  COD_ITEM: string;             // B03 - Codigo do item
  COD_BARRAS?: string;          // B04 - GTIN/EAN
  COD_ANP?: string;             // B05 - Codigo ANP
  NCM: string;                  // B06 - NCM 8 digitos
  CEST: string;                 // B07 - CEST 7 digitos
  DESCR_ITEM: string;           // B08 - Descricao
  UNID_ITEM: string;            // B09 - Unidade de medida
  ALIQ_ICMS_ITEM: number;       // B10 - Aliquota ICMS interna
  ALIQ_FECOP?: number;          // B11 - Aliquota FECOP
  QTD_TOT_ENTRADA: number;      // B12 - Quantidade total entrada
  QTD_TOT_SAIDA: number;        // B13 - Quantidade total saida
}

// =============================================
// REGISTRO 1010 - INVENTARIO (Simples Nacional)
// =============================================

export interface Registro1010 {
  REG: '1010';
  COD_ITEM: string;             // C02 - Codigo do item
  UNID_ITEM: string;            // C03 - Unidade de medida
  QTD: number;                  // C04 - Quantidade
  VL_TOT_ITEM: number;          // C05 - Valor total
  TXT_COMPL?: string;           // C06 - Texto complementar
}

// =============================================
// REGISTRO 1100 - TOTALIZADOR ENTRADAS
// =============================================

export interface Registro1100 {
  REG: '1100';
  COD_ITEM: string;             // D02 - Codigo do item
  QTD_TOT_ENTRADA: number;      // D03 - Quantidade total entrada
  MENOR_VL_UNIT_ITEM: number;   // D04 - Menor valor unitario
  VL_BC_ICMSST_UNIT_MED: number; // D05 - BC ICMS-ST unitario medio
  VL_TOT_ICMS_SUPORT_ENTR: number; // D06 - Total ICMS suportado entrada
  VL_UNIT_MED_ICMS_SUPORT_ENTR: number; // D07 - Unitario medio ICMS suportado
}

// =============================================
// REGISTRO 1110 - NOTAS FISCAIS DE ENTRADA
// =============================================

export interface Registro1110 {
  REG: '1110';
  DT_DOC: string;               // E02 - Data emissao (DDMMAAAA)
  COD_RESP_RET: CodigoResponsavelRetencao; // E03 - Codigo responsavel retencao
  CST_CSOSN: string;            // E04 - CST ou CSOSN
  CHAVE: string;                // E05 - Chave de acesso 44 digitos
  N_NF: number;                 // E06 - Numero NF
  CNPJ_EMIT: string;            // E07 - CNPJ emitente
  UF_EMIT: string;              // E08 - UF emitente
  CNPJ_DEST: string;            // E09 - CNPJ destinatario
  UF_DEST: string;              // E10 - UF destinatario
  CFOP: string;                 // E11 - CFOP
  N_ITEM: number;               // E12 - Numero do item na NF
  COD_ITEM: string;             // E13 - Codigo do item
  UNID_ITEM: string;            // E14 - Unidade de medida
  QTD_ENTRADA: number;          // E15 - Quantidade entrada
  VL_UNIT_ITEM: number;         // E16 - Valor unitario
  VL_BC_ICMS_ST: number;        // E17 - BC ICMS-ST
  VL_ICMS_SUPORT_ENTR: number;  // E18 - ICMS suportado entrada
}

// =============================================
// REGISTRO 1115 - GUIA DE RECOLHIMENTO
// =============================================

export interface Registro1115 {
  REG: '1115';
  TP_GUIA: TipoGuia;            // Tipo guia (1=GNRE, 2=GR-PR)
  NUM_IDENT: string;            // Numero identificacao
  DT_DOC: string;               // Data emissao (DDMMAAAA)
  DT_PAG: string;               // Data pagamento (DDMMAAAA)
  COD_ARRECAD: string;          // Codigo arrecadacao
  VL_RECOL: number;             // Valor recolhido
}

// =============================================
// REGISTRO 1120 - DEVOLUCAO DE ENTRADA
// =============================================

export interface Registro1120 {
  REG: '1120';
  DT_DOC: string;               // Data emissao (DDMMAAAA)
  CST_CSOSN: string;            // CST ou CSOSN
  CHAVE: string;                // Chave de acesso 44 digitos
  N_NF: number;                 // Numero NF
  CNPJ_EMIT: string;            // CNPJ emitente
  UF_EMIT: string;              // UF emitente
  CNPJ_DEST: string;            // CNPJ destinatario
  UF_DEST: string;              // UF destinatario
  CFOP: string;                 // CFOP
  N_ITEM: number;               // Numero do item na NF
  COD_ITEM: string;             // Codigo do item
  UNID_ITEM: string;            // Unidade de medida
  QTD_DEVOLVIDA: number;        // Quantidade devolvida
  VL_UNIT_ITEM: number;         // Valor unitario
  VL_BC_ICMS_ST: number;        // BC ICMS-ST
  VL_ICMS_SUPORT_DEV: number;   // ICMS suportado devolucao
}

// =============================================
// REGISTRO 1200 - TOTALIZADOR SAIDAS CONSUMIDOR FINAL
// =============================================

export interface Registro1200 {
  REG: '1200';
  COD_ITEM: string;             // F02 - Codigo do item
  QTD_SAIDA: number;            // F03 - Quantidade saida
  VL_UNIT_ICMS_EFETIVO: number; // F04 - Unitario ICMS efetivo
  VL_ICMS_EFETIVO: number;      // F05 - Total ICMS efetivo
  VL_CONFRONTO: number;         // F06 - Valor de confronto
  VL_RESSARCIR: number;         // F07 - Valor a ressarcir
  VL_COMPLEMENTAR: number;      // F08 - Valor a complementar
  VL_ICMSST_RESSARCIR: number;  // F09 - ICMS-ST a ressarcir
  VL_ICMSST_COMPLEMENTAR: number; // F10 - ICMS-ST a complementar
  VL_FECOP_RESSARCIR: number;   // F11 - FECOP a ressarcir
  VL_FECOP_COMPLEMENTAR: number; // F12 - FECOP a complementar
}

// =============================================
// REGISTRO 1210 - NOTAS FISCAIS SAIDA CONSUMIDOR FINAL
// =============================================

export interface Registro1210 {
  REG: '1210';
  DT_DOC: string;               // Data emissao (DDMMAAAA)
  CST_CSOSN: string;            // CST ou CSOSN
  CHAVE: string;                // Chave de acesso 44 digitos
  N_NF: number;                 // Numero NF
  CNPJ_EMIT: string;            // CNPJ emitente
  UF_EMIT: string;              // UF emitente
  CNPJ_DEST: string;            // CNPJ destinatario
  UF_DEST: string;              // UF destinatario
  CFOP: string;                 // CFOP
  N_ITEM: number;               // Numero do item na NF
  COD_ITEM: string;             // Codigo do item
  UNID_ITEM: string;            // Unidade de medida
  QTD_SAIDA: number;            // Quantidade saida
  VL_UNIT_ICMS_EFETIVO: number; // Unitario ICMS efetivo
  VL_ICMS_EFETIVO: number;      // Total ICMS efetivo
}

// =============================================
// REGISTRO 1220 - DEVOLUCAO SAIDA CONSUMIDOR FINAL
// =============================================

export interface Registro1220 {
  REG: '1220';
  DT_DOC: string;               // Data emissao (DDMMAAAA)
  CST_CSOSN: string;            // CST ou CSOSN
  CHAVE: string;                // Chave de acesso 44 digitos
  N_NF: number;                 // Numero NF
  CNPJ_EMIT: string;            // CNPJ emitente
  UF_EMIT: string;              // UF emitente
  CNPJ_DEST: string;            // CNPJ destinatario
  UF_DEST: string;              // UF destinatario
  CFOP: string;                 // CFOP
  N_ITEM: number;               // Numero do item na NF
  COD_ITEM: string;             // Codigo do item
  UNID_ITEM: string;            // Unidade de medida
  QTD_DEVOLVIDA: number;        // Quantidade devolvida
  VL_UNIT_ICMS_EFETIVO: number; // Unitario ICMS efetivo
  VL_ICMS_EFETIVO: number;      // Total ICMS efetivo
}

// =============================================
// REGISTRO 1300 - TOTALIZADOR SAIDAS INTERESTADUAIS
// =============================================

export interface Registro1300 {
  REG: '1300';
  COD_ITEM: string;             // H02 - Codigo do item
  QTD_SAIDA: number;            // H03 - Quantidade saida
  VL_CONFRONTO: number;         // H04 - Valor de confronto
  VL_ICMSST_RECUPERAR: number;  // H05 - ICMS-ST a recuperar
  VL_FECOP_RECUPERAR: number;   // H06 - FECOP a recuperar
}

// =============================================
// REGISTRO 1310 - NOTAS FISCAIS SAIDA INTERESTADUAL
// =============================================

export interface Registro1310 {
  REG: '1310';
  DT_DOC: string;               // Data emissao (DDMMAAAA)
  CST_CSOSN: string;            // CST ou CSOSN
  CHAVE: string;                // Chave de acesso 44 digitos
  N_NF: number;                 // Numero NF
  CNPJ_EMIT: string;            // CNPJ emitente
  UF_EMIT: string;              // UF emitente
  CNPJ_DEST: string;            // CNPJ destinatario
  UF_DEST: string;              // UF destinatario
  CFOP: string;                 // CFOP
  N_ITEM: number;               // Numero do item na NF
  COD_ITEM: string;             // Codigo do item
  UNID_ITEM: string;            // Unidade de medida
  QTD_SAIDA: number;            // Quantidade saida
}

// =============================================
// REGISTRO 1320 - DEVOLUCAO SAIDA INTERESTADUAL
// =============================================

export interface Registro1320 {
  REG: '1320';
  DT_DOC: string;               // Data emissao (DDMMAAAA)
  CST_CSOSN: string;            // CST ou CSOSN
  CHAVE: string;                // Chave de acesso 44 digitos
  N_NF: number;                 // Numero NF
  CNPJ_EMIT: string;            // CNPJ emitente
  UF_EMIT: string;              // UF emitente
  CNPJ_DEST: string;            // CNPJ destinatario
  UF_DEST: string;              // UF destinatario
  CFOP: string;                 // CFOP
  N_ITEM: number;               // Numero do item na NF
  COD_ITEM: string;             // Codigo do item
  UNID_ITEM: string;            // Unidade de medida
  QTD_DEVOLVIDA: number;        // Quantidade devolvida
}

// =============================================
// REGISTRO 1400 - TOTALIZADOR SAIDAS ART. 119
// =============================================

export interface Registro1400 {
  REG: '1400';
  COD_ITEM: string;             // J02 - Codigo do item
  QTD_SAIDA: number;            // J03 - Quantidade saida
  VL_CONFRONTO: number;         // J04 - Valor de confronto
  VL_ICMSST_RECUPERAR: number;  // J05 - ICMS-ST a recuperar
  VL_FECOP_RECUPERAR: number;   // J06 - FECOP a recuperar
}

// =============================================
// REGISTRO 1410 - NOTAS FISCAIS SAIDA ART. 119
// =============================================

export interface Registro1410 {
  REG: '1410';
  DT_DOC: string;               // Data emissao (DDMMAAAA)
  CST_CSOSN: string;            // CST ou CSOSN
  CHAVE: string;                // Chave de acesso 44 digitos
  N_NF: number;                 // Numero NF
  CNPJ_EMIT: string;            // CNPJ emitente
  UF_EMIT: string;              // UF emitente
  CNPJ_DEST: string;            // CNPJ destinatario
  UF_DEST: string;              // UF destinatario
  CFOP: string;                 // CFOP
  N_ITEM: number;               // Numero do item na NF
  COD_ITEM: string;             // Codigo do item
  UNID_ITEM: string;            // Unidade de medida
  QTD_SAIDA: number;            // Quantidade saida
}

// =============================================
// REGISTRO 1420 - DEVOLUCAO SAIDA ART. 119
// =============================================

export interface Registro1420 {
  REG: '1420';
  DT_DOC: string;               // Data emissao (DDMMAAAA)
  CST_CSOSN: string;            // CST ou CSOSN
  CHAVE: string;                // Chave de acesso 44 digitos
  N_NF: number;                 // Numero NF
  CNPJ_EMIT: string;            // CNPJ emitente
  UF_EMIT: string;              // UF emitente
  CNPJ_DEST: string;            // CNPJ destinatario
  UF_DEST: string;              // UF destinatario
  CFOP: string;                 // CFOP
  N_ITEM: number;               // Numero do item na NF
  COD_ITEM: string;             // Codigo do item
  UNID_ITEM: string;            // Unidade de medida
  QTD_DEVOLVIDA: number;        // Quantidade devolvida
}

// =============================================
// REGISTRO 1500 - TOTALIZADOR SAIDAS SIMPLES NACIONAL
// =============================================

export interface Registro1500 {
  REG: '1500';
  COD_ITEM: string;             // L02 - Codigo do item
  QTD_SAIDA: number;            // L03 - Quantidade saida
  VL_UNIT_ICMS_EFETIVO: number; // L04 - Unitario ICMS efetivo
  VL_ICMS_EFETIVO: number;      // L05 - Total ICMS efetivo
  MVA_ICMSST: number;           // L06 - MVA ICMS-ST
  VL_CONFRONTO: number;         // L07 - Valor de confronto
  VL_ICMSST_RECUPERAR: number;  // L08 - ICMS-ST a recuperar
  VL_FECOP_RECUPERAR: number;   // L09 - FECOP a recuperar
}

// =============================================
// REGISTRO 1510 - NOTAS FISCAIS SAIDA SIMPLES NACIONAL
// =============================================

export interface Registro1510 {
  REG: '1510';
  DT_DOC: string;               // Data emissao (DDMMAAAA)
  CST_CSOSN: string;            // CST ou CSOSN
  CHAVE: string;                // Chave de acesso 44 digitos
  N_NF: number;                 // Numero NF
  CNPJ_EMIT: string;            // CNPJ emitente
  UF_EMIT: string;              // UF emitente
  CNPJ_DEST: string;            // CNPJ destinatario
  UF_DEST: string;              // UF destinatario
  CFOP: string;                 // CFOP
  N_ITEM: number;               // Numero do item na NF
  COD_ITEM: string;             // Codigo do item
  UNID_ITEM: string;            // Unidade de medida
  QTD_SAIDA: number;            // Quantidade saida
  VL_UNIT_ICMS_EFETIVO: number; // Unitario ICMS efetivo
  VL_ICMS_EFETIVO: number;      // Total ICMS efetivo
}

// =============================================
// REGISTRO 1520 - DEVOLUCAO SAIDA SIMPLES NACIONAL
// =============================================

export interface Registro1520 {
  REG: '1520';
  DT_DOC: string;               // Data emissao (DDMMAAAA)
  CST_CSOSN: string;            // CST ou CSOSN
  CHAVE: string;                // Chave de acesso 44 digitos
  N_NF: number;                 // Numero NF
  CNPJ_EMIT: string;            // CNPJ emitente
  UF_EMIT: string;              // UF emitente
  CNPJ_DEST: string;            // CNPJ destinatario
  UF_DEST: string;              // UF destinatario
  CFOP: string;                 // CFOP
  N_ITEM: number;               // Numero do item na NF
  COD_ITEM: string;             // Codigo do item
  UNID_ITEM: string;            // Unidade de medida
  QTD_DEVOLVIDA: number;        // Quantidade devolvida
  VL_UNIT_ICMS_EFETIVO: number; // Unitario ICMS efetivo
  VL_ICMS_EFETIVO: number;      // Total ICMS efetivo
}

// =============================================
// REGISTRO 1999 - ENCERRAMENTO BLOCO 1
// =============================================

export interface Registro1999 {
  REG: '1999';
  QTD_LIN_1: number;            // Quantidade de linhas do bloco 1
}

// =============================================
// REGISTRO 9000 - APURACAO TOTAL
// =============================================

export interface Registro9000 {
  REG: '9000';
  VL_ICMSST_RESSARCIR_R1200: number;    // X01
  VL_ICMSST_RECUPERAR_R1200: number;    // X02
  VL_ICMSST_COMPLEMENTAR_R1200: number; // X03
  VL_ICMSST_RECUPERAR_R1300: number;    // X04
  VL_ICMSST_RECUPERAR_R1400: number;    // X05
  VL_ICMSST_RECUPERAR_R1500: number;    // X06
  VL_FECOP_RESSARCIR_R1200: number;     // X07
  VL_FECOP_RECUPERAR_R1200: number;     // X08
  VL_FECOP_COMPLEMENTAR_R1200: number;  // X09
  VL_FECOP_RECUPERAR_R1300: number;     // X10
  VL_FECOP_RECUPERAR_R1400: number;     // X11
  VL_FECOP_RECUPERAR_R1500: number;     // X12
}

// =============================================
// REGISTRO 9999 - ENCERRAMENTO DO ARQUIVO
// =============================================

export interface Registro9999 {
  REG: '9999';
  QTD_LIN: number;              // Quantidade total de linhas
}

// =============================================
// TIPOS AUXILIARES
// =============================================

export type RegistroADRCST = 
  | Registro0000 | Registro1000 | Registro1010 | Registro1100 
  | Registro1110 | Registro1115 | Registro1120
  | Registro1200 | Registro1210 | Registro1220
  | Registro1300 | Registro1310 | Registro1320
  | Registro1400 | Registro1410 | Registro1420
  | Registro1500 | Registro1510 | Registro1520
  | Registro1999 | Registro9000 | Registro9999;

// =============================================
// INTERFACES DE DADOS DO BANCO
// =============================================

export interface ApuracaoADRCST {
  id: string;
  empresa_id: string;
  filial_id?: string;
  mes_ano: string;
  ano: number;
  mes: number;
  cod_versao: number;
  cd_fin: 0 | 1;
  n_reg_especial?: string;
  cnpj_cd?: string;
  ie_cd?: string;
  opcao_r1200?: OpcaoRecuperacao;
  opcao_r1300?: 0 | 1;
  opcao_r1400?: 0 | 1;
  opcao_r1500?: 0 | 1;
  status: StatusApuracao;
  protocolo_adrcst?: string;
  data_protocolo?: string;
  total_registros?: number;
  total_linhas?: number;
  arquivo_txt_storage_key?: string;
  arquivo_zip_storage_key?: string;
  hash_arquivo?: string;
  observacoes?: string;
  erro_mensagem?: string;
  created_at: string;
  updated_at: string;
  // Totais do Registro 9000
  x01_vl_icmsst_ressarcir_r1200?: number;
  x02_vl_icmsst_recuperar_r1200?: number;
  x03_vl_icmsst_complementar_r1200?: number;
  x04_vl_icmsst_recuperar_r1300?: number;
  x05_vl_icmsst_recuperar_r1400?: number;
  x06_vl_icmsst_recuperar_r1500?: number;
  x07_vl_fecop_ressarcir_r1200?: number;
  x08_vl_fecop_recuperar_r1200?: number;
  x09_vl_fecop_complementar_r1200?: number;
  x10_vl_fecop_recuperar_r1300?: number;
  x11_vl_fecop_recuperar_r1400?: number;
  x12_vl_fecop_recuperar_r1500?: number;
}

export interface ItemADRCST {
  id: string;
  apuracao_id: string;
  produto_id?: string;
  ind_fecop: 0 | 1;
  cod_item: string;
  cod_barras?: string;
  cod_anp?: string;
  ncm: string;
  cest: string;
  descr_item: string;
  unid_item: string;
  aliq_icms_item: number;
  aliq_fecop: number;
  qtd_tot_entrada: number;
  qtd_tot_saida: number;
  // Campos do Registro 1100
  d02_qtd_tot_entrada: number;
  d03_menor_vl_unit_item: number;
  d04_vl_bc_icmsst_unit_med: number;
  d05_vl_tot_icms_suport_entr: number;
  d06_vl_unit_med_icms_suport_entr: number;
  // Campos do Registro 1010 (Simples Nacional)
  c03_unid_item?: string;
  c04_qtd?: number;
  c05_vl_tot_item?: number;
  c06_txt_compl?: string;
  // Totais por cenario
  // R1200
  f02_qtd_saida_r1200: number;
  f03_vl_unit_icms_efetivo_r1200: number;
  f04_vl_icms_efetivo_r1200: number;
  f05_vl_confronto_r1200: number;
  f06_vl_ressarcir_r1200: number;
  f07_vl_complementar_r1200: number;
  f08_vl_icmsst_ressarcir_r1200: number;
  f09_vl_icmsst_complementar_r1200: number;
  f10_vl_fecop_ressarcir_r1200: number;
  f11_vl_fecop_complementar_r1200: number;
  // R1300
  h02_qtd_saida_r1300: number;
  h03_vl_confronto_r1300: number;
  h04_vl_icmsst_recuperar_r1300: number;
  h05_vl_fecop_recuperar_r1300: number;
  // R1400
  j02_qtd_saida_r1400: number;
  j03_vl_confronto_r1400: number;
  j04_vl_icmsst_recuperar_r1400: number;
  j05_vl_fecop_recuperar_r1400: number;
  // R1500
  l02_qtd_saida_r1500: number;
  l03_vl_unit_icms_efetivo_r1500: number;
  l04_vl_icms_efetivo_r1500: number;
  l05_mva_icmsst: number;
  l06_vl_confronto_r1500: number;
  l07_vl_icmsst_recuperar_r1500: number;
  l08_vl_fecop_recuperar_r1500: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentoADRCST {
  id: string;
  item_id: string;
  tipo_registro: TipoDocumento;
  dt_doc: string;
  cst_csosn?: string;
  chave: string;
  n_nf: number;
  cnpj_emit: string;
  uf_emit: string;
  cnpj_dest: string;
  uf_dest: string;
  cfop: string;
  n_item: number;
  unid_item: string;
  // Campos especificos de entrada (1110)
  cod_resp_ret?: CodigoResponsavelRetencao;
  qtd_entrada?: number;
  vl_unit_item?: number;
  vl_bc_icms_st?: number;
  vl_icms_suport_entr?: number;
  // Campos especificos de devolucao entrada (1120)
  qtd_devolvida_entrada?: number;
  vl_unit_item_dev_entrada?: number;
  vl_bc_icms_st_dev_entrada?: number;
  vl_icms_suport_dev_entrada?: number;
  // Campos especificos de saida
  qtd_saida?: number;
  vl_unit_icms_efetivo?: number;
  vl_icms_efetivo?: number;
  // Campos especificos de devolucao saida
  qtd_devolvida_saida?: number;
  vl_unit_icms_efetivo_dev?: number;
  vl_icms_efetivo_dev?: number;
  // Vinculacao
  dfe_documento_id?: string;
  nfe_id?: string;
  created_at: string;
}

export interface GuiaRecolhimentoADRCST {
  id: string;
  documento_id: string;
  tp_guia: TipoGuia;
  num_ident: string;
  dt_doc: string;
  dt_pag: string;
  cod_arrecad: string;
  vl_recol: number;
  created_at: string;
}

export interface ValidacaoADRCST {
  id: string;
  apuracao_id: string;
  item_id?: string;
  documento_id?: string;
  tipo: 'erro' | 'aviso' | 'info';
  codigo: string;
  mensagem: string;
  campo?: string;
  valor_encontrado?: string;
  valor_esperado?: string;
  resolvido: boolean;
  created_at: string;
}

export interface ConfiguracaoADRCST {
  id: string;
  empresa_id: string;
  opcao_padrao_r1200: OpcaoRecuperacao;
  opcao_padrao_r1300: 0 | 1;
  opcao_padrao_r1400: 0 | 1;
  opcao_padrao_r1500: 0 | 1;
  cnpj_cd_padrao?: string;
  ie_cd_padrao?: string;
  n_reg_especial?: string;
  alertar_entradas_insuficientes: boolean;
  alertar_unidade_divergente: boolean;
  alertar_inventario_faltante: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// INTERFACES DE REQUEST/RESPONSE
// =============================================

export interface CriarApuracaoRequest {
  empresa_id: string;
  filial_id?: string;
  mes: number;
  ano: number;
  cd_fin?: 0 | 1;
  opcao_r1200?: OpcaoRecuperacao;
  opcao_r1300?: 0 | 1;
  opcao_r1400?: 0 | 1;
  opcao_r1500?: 0 | 1;
  observacoes?: string;
}

export interface CalcularApuracaoRequest {
  apuracao_id: string;
  retroagir_entradas?: boolean;
  meses_retroacao?: number;
}

export interface GerarArquivoRequest {
  apuracao_id: string;
}

export interface RegistrarProtocoloRequest {
  apuracao_id: string;
  protocolo: string;
  data_protocolo?: string;
}

export interface ApuracaoResponse {
  success: boolean;
  data?: ApuracaoADRCST;
  itens?: ItemADRCST[];
  validacoes?: ValidacaoADRCST[];
  error?: string;
}

export interface ArquivoResponse {
  success: boolean;
  arquivo?: {
    nome: string;
    conteudo: string;
    total_linhas: number;
    hash: string;
  };
  error?: string;
}

// =============================================
// CODIGOS DE AJUSTE EFD
// =============================================

export const CODIGOS_AJUSTE_EFD = {
  RECUPERACAO_R1300: 'PR020211', // Saidas interestaduais
  RECUPERACAO_R1200: 'PR020170', // Saidas consumidor final
  RECUPERACAO_R1500: 'PR020222', // Saidas Simples Nacional
  RECUPERACAO_R1400: 'PR020171', // Saidas art. 119
  COMPLEMENTACAO_ICMS: 'PR000092', // Complementacao ICMS
  COMPLEMENTACAO_FECOP: '5037',    // GR-PR para FECOP
} as const;

// =============================================
// ALIQUOTAS VALIDAS
// =============================================

export const ALIQUOTAS_ICMS_VALIDAS = [7, 12, 18, 25, 29] as const;
export const ALIQUOTA_FECOP = 2;

// =============================================
// VERSAO DO LEIAUTE
// =============================================

export const VERSAO_LEIAUTE = 110;
