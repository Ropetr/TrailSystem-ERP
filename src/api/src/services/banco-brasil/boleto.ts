// =============================================
// PLANAC ERP - Banco do Brasil Boleto Service
// Operações de boleto via API BB
// =============================================

import { bbRequest } from './auth';
import {
  BancoBrasilConfig,
  BBBoletoRegistro,
  BBBoletoResponse,
  BBBoletoConsulta,
  BBPagador,
  BB_TIPOS_TITULO,
} from './types';

// ===== REGISTRAR BOLETO =====

/**
 * Registra um novo boleto no Banco do Brasil
 */
export async function registrarBoleto(
  config: BancoBrasilConfig,
  boleto: BBBoletoRegistro,
  kvCache?: KVNamespace
): Promise<BBBoletoResponse> {
  const payload = {
    ...boleto,
    numeroConvenio: config.numeroConvenio,
    numeroCarteira: config.numeroCarteira,
    numeroVariacaoCarteira: config.numeroVariacaoCarteira,
  };

  const response = await bbRequest<BBBoletoResponse>(
    config,
    '/boletos',
    {
      method: 'POST',
      body: payload,
      kvCache,
    }
  );

  return response;
}

// ===== CONSULTAR BOLETO =====

/**
 * Consulta um boleto pelo número
 */
export async function consultarBoleto(
  config: BancoBrasilConfig,
  numeroBoleto: string,
  kvCache?: KVNamespace
): Promise<BBBoletoConsulta> {
  const response = await bbRequest<BBBoletoConsulta>(
    config,
    `/boletos/${numeroBoleto}`,
    {
      method: 'GET',
      queryParams: {
        numeroConvenio: config.numeroConvenio,
      },
      kvCache,
    }
  );

  return response;
}

/**
 * Lista boletos por período
 */
export async function listarBoletos(
  config: BancoBrasilConfig,
  filtros: {
    indicadorSituacao: 'A' | 'B'; // A=Em aberto, B=Baixado
    agenciaBeneficiario?: number;
    contaBeneficiario?: number;
    carteiraConvenio?: number;
    variacaoCarteiraConvenio?: number;
    modalidadeCobranca?: number;
    cnpjPagador?: number;
    digitoCNPJPagador?: number;
    cpfPagador?: number;
    digitoCPFPagador?: number;
    dataInicioVencimento?: string;
    dataFimVencimento?: string;
    dataInicioRegistro?: string;
    dataFimRegistro?: string;
    dataInicioMovimento?: string;
    dataFimMovimento?: string;
    codigoEstadoTituloCobranca?: number;
    boletoVencido?: string;
    indice?: number;
  },
  kvCache?: KVNamespace
): Promise<{ boletos: BBBoletoConsulta[]; quantidadeRegistros: number }> {
  const queryParams: Record<string, string | number> = {
    indicadorSituacao: filtros.indicadorSituacao,
  };

  // Adiciona filtros opcionais
  if (filtros.agenciaBeneficiario) queryParams.agenciaBeneficiario = filtros.agenciaBeneficiario;
  if (filtros.contaBeneficiario) queryParams.contaBeneficiario = filtros.contaBeneficiario;
  if (filtros.dataInicioVencimento) queryParams.dataInicioVencimento = filtros.dataInicioVencimento;
  if (filtros.dataFimVencimento) queryParams.dataFimVencimento = filtros.dataFimVencimento;
  if (filtros.dataInicioRegistro) queryParams.dataInicioRegistro = filtros.dataInicioRegistro;
  if (filtros.dataFimRegistro) queryParams.dataFimRegistro = filtros.dataFimRegistro;
  if (filtros.codigoEstadoTituloCobranca) queryParams.codigoEstadoTituloCobranca = filtros.codigoEstadoTituloCobranca;
  if (filtros.indice) queryParams.indice = filtros.indice;

  const response = await bbRequest<{
    indicadorContinuidade: string;
    quantidadeRegistros: number;
    proximoIndice: number;
    boletos: BBBoletoConsulta[];
  }>(config, '/boletos', {
    method: 'GET',
    queryParams,
    kvCache,
  });

  return {
    boletos: response.boletos || [],
    quantidadeRegistros: response.quantidadeRegistros,
  };
}

// ===== BAIXAR BOLETO =====

/**
 * Solicita baixa de um boleto
 */
export async function baixarBoleto(
  config: BancoBrasilConfig,
  numeroBoleto: string,
  kvCache?: KVNamespace
): Promise<void> {
  await bbRequest(
    config,
    `/boletos/${numeroBoleto}/baixar`,
    {
      method: 'POST',
      body: {
        numeroConvenio: config.numeroConvenio,
      },
      kvCache,
    }
  );
}

// ===== ALTERAR BOLETO =====

/**
 * Altera data de vencimento do boleto
 */
export async function alterarVencimento(
  config: BancoBrasilConfig,
  numeroBoleto: string,
  novaDataVencimento: string,
  kvCache?: KVNamespace
): Promise<void> {
  await bbRequest(
    config,
    `/boletos/${numeroBoleto}`,
    {
      method: 'PATCH',
      body: {
        numeroConvenio: config.numeroConvenio,
        novaDataVencimento,
      },
      kvCache,
    }
  );
}

/**
 * Altera valor do boleto (abatimento)
 */
export async function alterarAbatimento(
  config: BancoBrasilConfig,
  numeroBoleto: string,
  valorAbatimento: number,
  kvCache?: KVNamespace
): Promise<void> {
  await bbRequest(
    config,
    `/boletos/${numeroBoleto}`,
    {
      method: 'PATCH',
      body: {
        numeroConvenio: config.numeroConvenio,
        valorAbatimento,
      },
      kvCache,
    }
  );
}

/**
 * Protestar boleto
 */
export async function protestarBoleto(
  config: BancoBrasilConfig,
  numeroBoleto: string,
  quantidadeDiasProtesto: number,
  kvCache?: KVNamespace
): Promise<void> {
  await bbRequest(
    config,
    `/boletos/${numeroBoleto}`,
    {
      method: 'PATCH',
      body: {
        numeroConvenio: config.numeroConvenio,
        quantidadeDiasProtesto,
      },
      kvCache,
    }
  );
}

// ===== MAPEAMENTO ERP <-> BB =====

/**
 * Mapeia dados do ERP para formato Banco do Brasil
 */
export function mapErpToBB(dados: {
  numeroDocumento: string;
  dataEmissao: string;
  dataVencimento: string;
  valor: number;
  valorAbatimento?: number;
  especieDocumento?: string;
  gerarPix?: boolean;
  diasProtesto?: number;
  diasNegativacao?: number;
  // Pagador
  pagadorCpfCnpj: string;
  pagadorNome: string;
  pagadorEndereco: string;
  pagadorBairro: string;
  pagadorCidade: string;
  pagadorUf: string;
  pagadorCep: string;
  pagadorTelefone?: string;
  // Desconto
  descontoData?: string;
  descontoValor?: number;
  descontoTipo?: number;
  // Multa
  multaData?: string;
  multaValor?: number;
  multaTipo?: number;
  // Juros
  jurosValor?: number;
  jurosTipo?: number;
}): BBBoletoRegistro {
  // Mapeia espécie do documento
  const especieMap: Record<string, number> = {
    DM: 2,
    DS: 4,
    NP: 12,
    RC: 17,
    FAT: 18,
    ND: 19,
    OU: 99,
  };

  const tipoTitulo = dados.especieDocumento
    ? especieMap[dados.especieDocumento] || 99
    : 2; // DM como padrão

  // Formata datas para dd.mm.aaaa
  const formatarData = (data: string): string => {
    const [ano, mes, dia] = data.split('-');
    return `${dia}.${mes}.${ano}`;
  };

  // Identifica tipo de documento
  const cpfCnpj = dados.pagadorCpfCnpj.replace(/\D/g, '');
  const tipoInscricao = cpfCnpj.length === 11 ? 1 : 2;

  const boleto: BBBoletoRegistro = {
    numeroConvenio: 0, // Será preenchido pelo config
    numeroCarteira: 0, // Será preenchido pelo config
    numeroVariacaoCarteira: 0, // Será preenchido pelo config
    codigoModalidade: 1, // Simples
    dataEmissao: formatarData(dados.dataEmissao),
    dataVencimento: formatarData(dados.dataVencimento),
    valorOriginal: dados.valor,
    valorAbatimento: dados.valorAbatimento,
    codigoTipoTitulo: tipoTitulo,
    descricaoTipoTitulo: BB_TIPOS_TITULO[tipoTitulo],
    numeroTituloBeneficiario: dados.numeroDocumento,
    numeroTituloCliente: dados.numeroDocumento.padStart(20, '0'),
    indicadorPix: dados.gerarPix !== false ? 'S' : 'N',
    quantidadeDiasProtesto: dados.diasProtesto,
    quantidadeDiasNegativacao: dados.diasNegativacao,
    orgaoNegativador: dados.diasNegativacao ? 1 : undefined,
    pagador: {
      tipoInscricao,
      numeroInscricao: parseInt(cpfCnpj, 10),
      nome: dados.pagadorNome.substring(0, 60),
      endereco: dados.pagadorEndereco.substring(0, 60),
      bairro: dados.pagadorBairro.substring(0, 30),
      cidade: dados.pagadorCidade.substring(0, 30),
      uf: dados.pagadorUf.toUpperCase(),
      cep: parseInt(dados.pagadorCep.replace(/\D/g, ''), 10),
      telefone: dados.pagadorTelefone,
    },
  };

  // Desconto
  if (dados.descontoData && dados.descontoValor) {
    boleto.desconto = {
      tipo: dados.descontoTipo || 1,
      dataExpiracao: formatarData(dados.descontoData),
      valor: dados.descontoTipo === 2 ? undefined : dados.descontoValor,
      porcentagem: dados.descontoTipo === 2 ? dados.descontoValor : undefined,
    };
  }

  // Multa
  if (dados.multaData && dados.multaValor) {
    boleto.multa = {
      tipo: dados.multaTipo || 2, // Percentual
      data: formatarData(dados.multaData),
      valor: dados.multaTipo === 1 ? dados.multaValor : undefined,
      porcentagem: dados.multaTipo !== 1 ? dados.multaValor : undefined,
    };
  }

  // Juros
  if (dados.jurosValor) {
    boleto.jurosMora = {
      tipo: dados.jurosTipo || 2, // Taxa mensal
      valor: dados.jurosTipo === 1 ? dados.jurosValor : undefined,
      porcentagem: dados.jurosTipo !== 1 ? dados.jurosValor : undefined,
    };
  }

  return boleto;
}

/**
 * Mapeia dados do BB para formato ERP
 */
export function mapBBToErp(dados: BBBoletoConsulta): {
  idExterno: string;
  nossoNumero: string;
  codigoBarras: string;
  linhaDigitavel: string;
  dataRegistro: string;
  dataVencimento: string;
  valor: number;
  valorAtual: number;
  valorPago?: number;
  dataPagamento?: string;
  dataCredito?: string;
  status: string;
  qrCodePix?: string;
  pagadorNome: string;
  pagadorCpfCnpj: string;
} {
  // Mapeia estado para status do ERP
  const statusMap: Record<number, string> = {
    1: 'aberto',
    2: 'cartorio',
    3: 'cartorio',
    4: 'cartorio',
    5: 'protestado',
    6: 'pago',
    7: 'baixado',
    8: 'cartorio',
    9: 'protestado',
    10: 'pago',
    11: 'pago',
    12: 'pago',
    13: 'protestado',
    14: 'pago',
    15: 'agendado',
    16: 'pago',
    17: 'pago',
    18: 'pago',
  };

  // Converte data dd.mm.aaaa para yyyy-mm-dd
  const converterData = (data: string): string => {
    if (!data) return '';
    const [dia, mes, ano] = data.split('.');
    return `${ano}-${mes}-${dia}`;
  };

  return {
    idExterno: dados.numero,
    nossoNumero: dados.numero,
    codigoBarras: dados.codigoBarraNumerico,
    linhaDigitavel: dados.linhaDigitavel,
    dataRegistro: converterData(dados.dataRegistro),
    dataVencimento: converterData(dados.dataVencimento),
    valor: dados.valorOriginal,
    valorAtual: dados.valorAtual,
    valorPago: dados.valorPago,
    dataPagamento: dados.dataPagamento ? converterData(dados.dataPagamento) : undefined,
    dataCredito: dados.dataCredito ? converterData(dados.dataCredito) : undefined,
    status: statusMap[dados.codigoEstadoTituloCobranca] || 'desconhecido',
    qrCodePix: dados.qrCode?.emv,
    pagadorNome: dados.pagador.nome,
    pagadorCpfCnpj: String(dados.pagador.numeroInscricao),
  };
}

// ===== VALIDAÇÃO =====

/**
 * Valida dados do boleto antes de enviar
 */
export function validarBoleto(boleto: Partial<BBBoletoRegistro>): string[] {
  const erros: string[] = [];

  if (!boleto.dataEmissao) {
    erros.push('Data de emissão é obrigatória');
  }

  if (!boleto.dataVencimento) {
    erros.push('Data de vencimento é obrigatória');
  }

  if (!boleto.valorOriginal || boleto.valorOriginal <= 0) {
    erros.push('Valor original deve ser maior que zero');
  }

  if (!boleto.numeroTituloBeneficiario) {
    erros.push('Número do título do beneficiário é obrigatório');
  }

  if (!boleto.pagador) {
    erros.push('Dados do pagador são obrigatórios');
  } else {
    if (!boleto.pagador.numeroInscricao) {
      erros.push('CPF/CNPJ do pagador é obrigatório');
    }
    if (!boleto.pagador.nome) {
      erros.push('Nome do pagador é obrigatório');
    }
    if (!boleto.pagador.endereco) {
      erros.push('Endereço do pagador é obrigatório');
    }
    if (!boleto.pagador.cep) {
      erros.push('CEP do pagador é obrigatório');
    }
    if (!boleto.pagador.cidade) {
      erros.push('Cidade do pagador é obrigatória');
    }
    if (!boleto.pagador.uf) {
      erros.push('UF do pagador é obrigatória');
    }
  }

  return erros;
}

// ===== HELPERS =====

/**
 * Formata CPF/CNPJ removendo caracteres especiais
 */
export function formatarCpfCnpj(documento: string): string {
  return documento.replace(/\D/g, '');
}

/**
 * Formata CEP removendo caracteres especiais
 */
export function formatarCep(cep: string): string {
  return cep.replace(/\D/g, '');
}

/**
 * Identifica tipo de documento (PF ou PJ)
 */
export function identificarTipoDocumento(documento: string): 'PF' | 'PJ' {
  const limpo = documento.replace(/\D/g, '');
  return limpo.length === 11 ? 'PF' : 'PJ';
}

/**
 * Retorna descrição do tipo de título
 */
export function getTipoTituloDescricao(codigo: number): string {
  return BB_TIPOS_TITULO[codigo] || `Tipo ${codigo}`;
}

/**
 * Formata data de yyyy-mm-dd para dd.mm.aaaa
 */
export function formatarDataBB(data: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}.${mes}.${ano}`;
}

/**
 * Converte data de dd.mm.aaaa para yyyy-mm-dd
 */
export function converterDataBB(data: string): string {
  const [dia, mes, ano] = data.split('.');
  return `${ano}-${mes}-${dia}`;
}
