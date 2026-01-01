// =============================================
// PLANAC ERP - ADRC-ST File Writer
// =============================================
// Arquivo: src/api/src/services/adrcst/adrcst-writer.ts
// Gerador do arquivo TXT ADRC-ST conforme Manual versao 1.6

import {
  Registro0000, Registro1000, Registro1010, Registro1100,
  Registro1110, Registro1115, Registro1120,
  Registro1200, Registro1210, Registro1220,
  Registro1300, Registro1310, Registro1320,
  Registro1400, Registro1410, Registro1420,
  Registro1500, Registro1510, Registro1520,
  Registro1999, Registro9000, Registro9999,
  RegistroADRCST, VERSAO_LEIAUTE
} from './types';

// =============================================
// CONSTANTES
// =============================================

const PIPE = '|';
const CRLF = '\r\n';

// =============================================
// FUNCOES DE FORMATACAO
// =============================================

/**
 * Formata um valor numerico para o formato do arquivo
 * Usa ponto como separador decimal, sem separador de milhar
 */
function formatarNumero(valor: number | undefined | null, casasDecimais: number = 2): string {
  if (valor === undefined || valor === null) return '';
  return valor.toFixed(casasDecimais);
}

/**
 * Formata um valor inteiro
 */
function formatarInteiro(valor: number | undefined | null): string {
  if (valor === undefined || valor === null) return '';
  return Math.floor(valor).toString();
}

/**
 * Formata uma string, removendo pipes e caracteres especiais
 */
function formatarTexto(valor: string | undefined | null): string {
  if (valor === undefined || valor === null) return '';
  // Remove pipes e caracteres de controle
  return valor.replace(/\|/g, '').replace(/[\r\n]/g, ' ').trim();
}

/**
 * Formata uma data para o formato DDMMAAAA
 */
function formatarData(data: string | Date | undefined | null): string {
  if (!data) return '';
  
  let d: Date;
  if (typeof data === 'string') {
    // Se ja esta no formato DDMMAAAA, retorna
    if (/^\d{8}$/.test(data)) return data;
    d = new Date(data);
  } else {
    d = data;
  }
  
  const dia = d.getDate().toString().padStart(2, '0');
  const mes = (d.getMonth() + 1).toString().padStart(2, '0');
  const ano = d.getFullYear().toString();
  
  return `${dia}${mes}${ano}`;
}

/**
 * Formata CNPJ (apenas numeros, 14 digitos)
 */
function formatarCNPJ(cnpj: string | undefined | null): string {
  if (!cnpj) return '';
  return cnpj.replace(/\D/g, '').padStart(14, '0');
}

/**
 * Formata IE (apenas numeros)
 */
function formatarIE(ie: string | undefined | null): string {
  if (!ie) return '';
  return ie.replace(/\D/g, '');
}

/**
 * Formata NCM (8 digitos)
 */
function formatarNCM(ncm: string | undefined | null): string {
  if (!ncm) return '';
  return ncm.replace(/\D/g, '').padStart(8, '0');
}

/**
 * Formata CEST (7 digitos)
 */
function formatarCEST(cest: string | undefined | null): string {
  if (!cest) return '';
  return cest.replace(/\D/g, '').padStart(7, '0');
}

/**
 * Formata chave de acesso (44 digitos)
 */
function formatarChave(chave: string | undefined | null): string {
  if (!chave) return '';
  return chave.replace(/\D/g, '').padStart(44, '0');
}

/**
 * Formata CFOP (4 digitos)
 */
function formatarCFOP(cfop: string | undefined | null): string {
  if (!cfop) return '';
  return cfop.replace(/\D/g, '').padStart(4, '0');
}

/**
 * Formata UF (2 caracteres)
 */
function formatarUF(uf: string | undefined | null): string {
  if (!uf) return '';
  return uf.toUpperCase().substring(0, 2);
}

// =============================================
// FUNCOES DE ESCRITA DE REGISTROS
// =============================================

/**
 * Escreve o Registro 0000 - Abertura e Identificacao
 */
function escreverRegistro0000(reg: Registro0000): string {
  const campos = [
    reg.REG,
    formatarInteiro(reg.COD_VERSAO),
    formatarTexto(reg.MES_ANO),
    formatarCNPJ(reg.CNPJ),
    formatarIE(reg.IE),
    formatarTexto(reg.NOME),
    formatarInteiro(reg.CD_FIN),
    formatarTexto(reg.N_REG_ESPECIAL),
    formatarCNPJ(reg.CNPJ_CD),
    formatarIE(reg.IE_CD),
    reg.OPCAO_R1200 !== undefined ? formatarInteiro(reg.OPCAO_R1200) : '',
    reg.OPCAO_R1300 !== undefined ? formatarInteiro(reg.OPCAO_R1300) : '',
    reg.OPCAO_R1400 !== undefined ? formatarInteiro(reg.OPCAO_R1400) : '',
    reg.OPCAO_R1500 !== undefined ? formatarInteiro(reg.OPCAO_R1500) : '',
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1000 - Identificacao do Item
 */
function escreverRegistro1000(reg: Registro1000): string {
  const campos = [
    reg.REG,
    formatarInteiro(reg.IND_FECOP),
    formatarTexto(reg.COD_ITEM),
    formatarTexto(reg.COD_BARRAS),
    formatarTexto(reg.COD_ANP),
    formatarNCM(reg.NCM),
    formatarCEST(reg.CEST),
    formatarTexto(reg.DESCR_ITEM),
    formatarTexto(reg.UNID_ITEM),
    formatarNumero(reg.ALIQ_ICMS_ITEM, 2),
    formatarNumero(reg.ALIQ_FECOP, 2),
    formatarNumero(reg.QTD_TOT_ENTRADA, 3),
    formatarNumero(reg.QTD_TOT_SAIDA, 3),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1010 - Inventario (Simples Nacional)
 */
function escreverRegistro1010(reg: Registro1010): string {
  const campos = [
    reg.REG,
    formatarTexto(reg.COD_ITEM),
    formatarTexto(reg.UNID_ITEM),
    formatarNumero(reg.QTD, 3),
    formatarNumero(reg.VL_TOT_ITEM, 2),
    formatarTexto(reg.TXT_COMPL),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1100 - Totalizador Entradas
 */
function escreverRegistro1100(reg: Registro1100): string {
  const campos = [
    reg.REG,
    formatarTexto(reg.COD_ITEM),
    formatarNumero(reg.QTD_TOT_ENTRADA, 3),
    formatarNumero(reg.MENOR_VL_UNIT_ITEM, 4),
    formatarNumero(reg.VL_BC_ICMSST_UNIT_MED, 4),
    formatarNumero(reg.VL_TOT_ICMS_SUPORT_ENTR, 2),
    formatarNumero(reg.VL_UNIT_MED_ICMS_SUPORT_ENTR, 4),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1110 - Notas Fiscais de Entrada
 */
function escreverRegistro1110(reg: Registro1110): string {
  const campos = [
    reg.REG,
    formatarData(reg.DT_DOC),
    formatarInteiro(reg.COD_RESP_RET),
    formatarTexto(reg.CST_CSOSN),
    formatarChave(reg.CHAVE),
    formatarInteiro(reg.N_NF),
    formatarCNPJ(reg.CNPJ_EMIT),
    formatarUF(reg.UF_EMIT),
    formatarCNPJ(reg.CNPJ_DEST),
    formatarUF(reg.UF_DEST),
    formatarCFOP(reg.CFOP),
    formatarInteiro(reg.N_ITEM),
    formatarTexto(reg.COD_ITEM),
    formatarTexto(reg.UNID_ITEM),
    formatarNumero(reg.QTD_ENTRADA, 3),
    formatarNumero(reg.VL_UNIT_ITEM, 4),
    formatarNumero(reg.VL_BC_ICMS_ST, 2),
    formatarNumero(reg.VL_ICMS_SUPORT_ENTR, 2),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1115 - Guia de Recolhimento
 */
function escreverRegistro1115(reg: Registro1115): string {
  const campos = [
    reg.REG,
    formatarInteiro(reg.TP_GUIA),
    formatarTexto(reg.NUM_IDENT),
    formatarData(reg.DT_DOC),
    formatarData(reg.DT_PAG),
    formatarTexto(reg.COD_ARRECAD),
    formatarNumero(reg.VL_RECOL, 2),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1120 - Devolucao de Entrada
 */
function escreverRegistro1120(reg: Registro1120): string {
  const campos = [
    reg.REG,
    formatarData(reg.DT_DOC),
    formatarTexto(reg.CST_CSOSN),
    formatarChave(reg.CHAVE),
    formatarInteiro(reg.N_NF),
    formatarCNPJ(reg.CNPJ_EMIT),
    formatarUF(reg.UF_EMIT),
    formatarCNPJ(reg.CNPJ_DEST),
    formatarUF(reg.UF_DEST),
    formatarCFOP(reg.CFOP),
    formatarInteiro(reg.N_ITEM),
    formatarTexto(reg.COD_ITEM),
    formatarTexto(reg.UNID_ITEM),
    formatarNumero(reg.QTD_DEVOLVIDA, 3),
    formatarNumero(reg.VL_UNIT_ITEM, 4),
    formatarNumero(reg.VL_BC_ICMS_ST, 2),
    formatarNumero(reg.VL_ICMS_SUPORT_DEV, 2),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1200 - Totalizador Saidas Consumidor Final
 */
function escreverRegistro1200(reg: Registro1200): string {
  const campos = [
    reg.REG,
    formatarTexto(reg.COD_ITEM),
    formatarNumero(reg.QTD_SAIDA, 3),
    formatarNumero(reg.VL_UNIT_ICMS_EFETIVO, 4),
    formatarNumero(reg.VL_ICMS_EFETIVO, 2),
    formatarNumero(reg.VL_CONFRONTO, 2),
    formatarNumero(reg.VL_RESSARCIR, 2),
    formatarNumero(reg.VL_COMPLEMENTAR, 2),
    formatarNumero(reg.VL_ICMSST_RESSARCIR, 2),
    formatarNumero(reg.VL_ICMSST_COMPLEMENTAR, 2),
    formatarNumero(reg.VL_FECOP_RESSARCIR, 2),
    formatarNumero(reg.VL_FECOP_COMPLEMENTAR, 2),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1210 - Notas Fiscais Saida Consumidor Final
 */
function escreverRegistro1210(reg: Registro1210): string {
  const campos = [
    reg.REG,
    formatarData(reg.DT_DOC),
    formatarTexto(reg.CST_CSOSN),
    formatarChave(reg.CHAVE),
    formatarInteiro(reg.N_NF),
    formatarCNPJ(reg.CNPJ_EMIT),
    formatarUF(reg.UF_EMIT),
    formatarCNPJ(reg.CNPJ_DEST),
    formatarUF(reg.UF_DEST),
    formatarCFOP(reg.CFOP),
    formatarInteiro(reg.N_ITEM),
    formatarTexto(reg.COD_ITEM),
    formatarTexto(reg.UNID_ITEM),
    formatarNumero(reg.QTD_SAIDA, 3),
    formatarNumero(reg.VL_UNIT_ICMS_EFETIVO, 4),
    formatarNumero(reg.VL_ICMS_EFETIVO, 2),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1220 - Devolucao Saida Consumidor Final
 */
function escreverRegistro1220(reg: Registro1220): string {
  const campos = [
    reg.REG,
    formatarData(reg.DT_DOC),
    formatarTexto(reg.CST_CSOSN),
    formatarChave(reg.CHAVE),
    formatarInteiro(reg.N_NF),
    formatarCNPJ(reg.CNPJ_EMIT),
    formatarUF(reg.UF_EMIT),
    formatarCNPJ(reg.CNPJ_DEST),
    formatarUF(reg.UF_DEST),
    formatarCFOP(reg.CFOP),
    formatarInteiro(reg.N_ITEM),
    formatarTexto(reg.COD_ITEM),
    formatarTexto(reg.UNID_ITEM),
    formatarNumero(reg.QTD_DEVOLVIDA, 3),
    formatarNumero(reg.VL_UNIT_ICMS_EFETIVO, 4),
    formatarNumero(reg.VL_ICMS_EFETIVO, 2),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1300 - Totalizador Saidas Interestaduais
 */
function escreverRegistro1300(reg: Registro1300): string {
  const campos = [
    reg.REG,
    formatarTexto(reg.COD_ITEM),
    formatarNumero(reg.QTD_SAIDA, 3),
    formatarNumero(reg.VL_CONFRONTO, 2),
    formatarNumero(reg.VL_ICMSST_RECUPERAR, 2),
    formatarNumero(reg.VL_FECOP_RECUPERAR, 2),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1310 - Notas Fiscais Saida Interestadual
 */
function escreverRegistro1310(reg: Registro1310): string {
  const campos = [
    reg.REG,
    formatarData(reg.DT_DOC),
    formatarTexto(reg.CST_CSOSN),
    formatarChave(reg.CHAVE),
    formatarInteiro(reg.N_NF),
    formatarCNPJ(reg.CNPJ_EMIT),
    formatarUF(reg.UF_EMIT),
    formatarCNPJ(reg.CNPJ_DEST),
    formatarUF(reg.UF_DEST),
    formatarCFOP(reg.CFOP),
    formatarInteiro(reg.N_ITEM),
    formatarTexto(reg.COD_ITEM),
    formatarTexto(reg.UNID_ITEM),
    formatarNumero(reg.QTD_SAIDA, 3),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1320 - Devolucao Saida Interestadual
 */
function escreverRegistro1320(reg: Registro1320): string {
  const campos = [
    reg.REG,
    formatarData(reg.DT_DOC),
    formatarTexto(reg.CST_CSOSN),
    formatarChave(reg.CHAVE),
    formatarInteiro(reg.N_NF),
    formatarCNPJ(reg.CNPJ_EMIT),
    formatarUF(reg.UF_EMIT),
    formatarCNPJ(reg.CNPJ_DEST),
    formatarUF(reg.UF_DEST),
    formatarCFOP(reg.CFOP),
    formatarInteiro(reg.N_ITEM),
    formatarTexto(reg.COD_ITEM),
    formatarTexto(reg.UNID_ITEM),
    formatarNumero(reg.QTD_DEVOLVIDA, 3),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1400 - Totalizador Saidas Art. 119
 */
function escreverRegistro1400(reg: Registro1400): string {
  const campos = [
    reg.REG,
    formatarTexto(reg.COD_ITEM),
    formatarNumero(reg.QTD_SAIDA, 3),
    formatarNumero(reg.VL_CONFRONTO, 2),
    formatarNumero(reg.VL_ICMSST_RECUPERAR, 2),
    formatarNumero(reg.VL_FECOP_RECUPERAR, 2),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1410 - Notas Fiscais Saida Art. 119
 */
function escreverRegistro1410(reg: Registro1410): string {
  const campos = [
    reg.REG,
    formatarData(reg.DT_DOC),
    formatarTexto(reg.CST_CSOSN),
    formatarChave(reg.CHAVE),
    formatarInteiro(reg.N_NF),
    formatarCNPJ(reg.CNPJ_EMIT),
    formatarUF(reg.UF_EMIT),
    formatarCNPJ(reg.CNPJ_DEST),
    formatarUF(reg.UF_DEST),
    formatarCFOP(reg.CFOP),
    formatarInteiro(reg.N_ITEM),
    formatarTexto(reg.COD_ITEM),
    formatarTexto(reg.UNID_ITEM),
    formatarNumero(reg.QTD_SAIDA, 3),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1420 - Devolucao Saida Art. 119
 */
function escreverRegistro1420(reg: Registro1420): string {
  const campos = [
    reg.REG,
    formatarData(reg.DT_DOC),
    formatarTexto(reg.CST_CSOSN),
    formatarChave(reg.CHAVE),
    formatarInteiro(reg.N_NF),
    formatarCNPJ(reg.CNPJ_EMIT),
    formatarUF(reg.UF_EMIT),
    formatarCNPJ(reg.CNPJ_DEST),
    formatarUF(reg.UF_DEST),
    formatarCFOP(reg.CFOP),
    formatarInteiro(reg.N_ITEM),
    formatarTexto(reg.COD_ITEM),
    formatarTexto(reg.UNID_ITEM),
    formatarNumero(reg.QTD_DEVOLVIDA, 3),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1500 - Totalizador Saidas Simples Nacional
 */
function escreverRegistro1500(reg: Registro1500): string {
  const campos = [
    reg.REG,
    formatarTexto(reg.COD_ITEM),
    formatarNumero(reg.QTD_SAIDA, 3),
    formatarNumero(reg.VL_UNIT_ICMS_EFETIVO, 4),
    formatarNumero(reg.VL_ICMS_EFETIVO, 2),
    formatarNumero(reg.MVA_ICMSST, 2),
    formatarNumero(reg.VL_CONFRONTO, 2),
    formatarNumero(reg.VL_ICMSST_RECUPERAR, 2),
    formatarNumero(reg.VL_FECOP_RECUPERAR, 2),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1510 - Notas Fiscais Saida Simples Nacional
 */
function escreverRegistro1510(reg: Registro1510): string {
  const campos = [
    reg.REG,
    formatarData(reg.DT_DOC),
    formatarTexto(reg.CST_CSOSN),
    formatarChave(reg.CHAVE),
    formatarInteiro(reg.N_NF),
    formatarCNPJ(reg.CNPJ_EMIT),
    formatarUF(reg.UF_EMIT),
    formatarCNPJ(reg.CNPJ_DEST),
    formatarUF(reg.UF_DEST),
    formatarCFOP(reg.CFOP),
    formatarInteiro(reg.N_ITEM),
    formatarTexto(reg.COD_ITEM),
    formatarTexto(reg.UNID_ITEM),
    formatarNumero(reg.QTD_SAIDA, 3),
    formatarNumero(reg.VL_UNIT_ICMS_EFETIVO, 4),
    formatarNumero(reg.VL_ICMS_EFETIVO, 2),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1520 - Devolucao Saida Simples Nacional
 */
function escreverRegistro1520(reg: Registro1520): string {
  const campos = [
    reg.REG,
    formatarData(reg.DT_DOC),
    formatarTexto(reg.CST_CSOSN),
    formatarChave(reg.CHAVE),
    formatarInteiro(reg.N_NF),
    formatarCNPJ(reg.CNPJ_EMIT),
    formatarUF(reg.UF_EMIT),
    formatarCNPJ(reg.CNPJ_DEST),
    formatarUF(reg.UF_DEST),
    formatarCFOP(reg.CFOP),
    formatarInteiro(reg.N_ITEM),
    formatarTexto(reg.COD_ITEM),
    formatarTexto(reg.UNID_ITEM),
    formatarNumero(reg.QTD_DEVOLVIDA, 3),
    formatarNumero(reg.VL_UNIT_ICMS_EFETIVO, 4),
    formatarNumero(reg.VL_ICMS_EFETIVO, 2),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 1999 - Encerramento Bloco 1
 */
function escreverRegistro1999(reg: Registro1999): string {
  const campos = [
    reg.REG,
    formatarInteiro(reg.QTD_LIN_1),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 9000 - Apuracao Total
 */
function escreverRegistro9000(reg: Registro9000): string {
  const campos = [
    reg.REG,
    formatarNumero(reg.VL_ICMSST_RESSARCIR_R1200, 2),
    formatarNumero(reg.VL_ICMSST_RECUPERAR_R1200, 2),
    formatarNumero(reg.VL_ICMSST_COMPLEMENTAR_R1200, 2),
    formatarNumero(reg.VL_ICMSST_RECUPERAR_R1300, 2),
    formatarNumero(reg.VL_ICMSST_RECUPERAR_R1400, 2),
    formatarNumero(reg.VL_ICMSST_RECUPERAR_R1500, 2),
    formatarNumero(reg.VL_FECOP_RESSARCIR_R1200, 2),
    formatarNumero(reg.VL_FECOP_RECUPERAR_R1200, 2),
    formatarNumero(reg.VL_FECOP_COMPLEMENTAR_R1200, 2),
    formatarNumero(reg.VL_FECOP_RECUPERAR_R1300, 2),
    formatarNumero(reg.VL_FECOP_RECUPERAR_R1400, 2),
    formatarNumero(reg.VL_FECOP_RECUPERAR_R1500, 2),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

/**
 * Escreve o Registro 9999 - Encerramento do Arquivo
 */
function escreverRegistro9999(reg: Registro9999): string {
  const campos = [
    reg.REG,
    formatarInteiro(reg.QTD_LIN),
  ];
  return campos.join(PIPE) + PIPE + CRLF;
}

// =============================================
// FUNCAO PRINCIPAL DE ESCRITA
// =============================================

/**
 * Escreve um registro generico
 */
export function escreverRegistro(registro: RegistroADRCST): string {
  switch (registro.REG) {
    case '0000': return escreverRegistro0000(registro as Registro0000);
    case '1000': return escreverRegistro1000(registro as Registro1000);
    case '1010': return escreverRegistro1010(registro as Registro1010);
    case '1100': return escreverRegistro1100(registro as Registro1100);
    case '1110': return escreverRegistro1110(registro as Registro1110);
    case '1115': return escreverRegistro1115(registro as Registro1115);
    case '1120': return escreverRegistro1120(registro as Registro1120);
    case '1200': return escreverRegistro1200(registro as Registro1200);
    case '1210': return escreverRegistro1210(registro as Registro1210);
    case '1220': return escreverRegistro1220(registro as Registro1220);
    case '1300': return escreverRegistro1300(registro as Registro1300);
    case '1310': return escreverRegistro1310(registro as Registro1310);
    case '1320': return escreverRegistro1320(registro as Registro1320);
    case '1400': return escreverRegistro1400(registro as Registro1400);
    case '1410': return escreverRegistro1410(registro as Registro1410);
    case '1420': return escreverRegistro1420(registro as Registro1420);
    case '1500': return escreverRegistro1500(registro as Registro1500);
    case '1510': return escreverRegistro1510(registro as Registro1510);
    case '1520': return escreverRegistro1520(registro as Registro1520);
    case '1999': return escreverRegistro1999(registro as Registro1999);
    case '9000': return escreverRegistro9000(registro as Registro9000);
    case '9999': return escreverRegistro9999(registro as Registro9999);
    default:
      throw new Error(`Tipo de registro desconhecido: ${(registro as RegistroADRCST).REG}`);
  }
}

/**
 * Gera o arquivo ADRC-ST completo a partir de uma lista de registros
 */
export function gerarArquivoADRCST(registros: RegistroADRCST[]): string {
  let conteudo = '';
  
  for (const registro of registros) {
    conteudo += escreverRegistro(registro);
  }
  
  return conteudo;
}

/**
 * Calcula o hash SHA-256 do conteudo do arquivo
 */
export async function calcularHashArquivo(conteudo: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(conteudo);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Gera o nome do arquivo ADRC-ST
 * Formato: ADRCST_CNPJ_MMAAAA_VVV.txt
 */
export function gerarNomeArquivo(cnpj: string, mesAno: string, versao: number = 1): string {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  const versaoStr = versao.toString().padStart(3, '0');
  return `ADRCST_${cnpjLimpo}_${mesAno}_${versaoStr}.txt`;
}

// =============================================
// EXPORTS
// =============================================

export {
  formatarNumero,
  formatarInteiro,
  formatarTexto,
  formatarData,
  formatarCNPJ,
  formatarIE,
  formatarNCM,
  formatarCEST,
  formatarChave,
  formatarCFOP,
  formatarUF,
  VERSAO_LEIAUTE,
};
