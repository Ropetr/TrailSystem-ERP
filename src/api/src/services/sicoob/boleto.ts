// =============================================
// PLANAC ERP - Sicoob Boleto Service
// Operações de boleto via API Sicoob
// =============================================

import { sicoobRequest } from './auth';
import {
  SicoobConfig,
  SicoobBoletoInclusao,
  SicoobBoletoResponse,
  SicoobBoletoConsulta,
  SicoobPagador,
  SicoobApiError,
  SICOOB_ESPECIES_DOCUMENTO,
} from './types';

// ===== INCLUIR BOLETO =====

/**
 * Inclui um novo boleto no Sicoob
 */
export async function incluirBoleto(
  config: SicoobConfig,
  boleto: SicoobBoletoInclusao,
  kvCache?: KVNamespace
): Promise<SicoobBoletoResponse> {
  const payload = {
    numeroContrato: config.numeroCooperado,
    modalidade: 1, // Simples com registro
    numeroContaCorrente: config.contaCorrente,
    especieDocumento: boleto.tipoEspecieDocumento,
    dataEmissao: boleto.dataEmissao,
    nossoNumero: 0, // Gerado automaticamente
    seuNumero: boleto.numeroCliente,
    identificacaoBoletoEmpresa: boleto.numeroCliente,
    identificacaoEmissaoBoleto: 2, // Beneficiário emite
    identificacaoDistribuicaoBoleto: 2, // Beneficiário distribui
    valor: boleto.valorNominal,
    dataVencimento: boleto.dataVencimento,
    dataLimitePagamento: boleto.dataVencimento,
    valorAbatimento: boleto.valorAbatimento || 0,
    tipoDesconto: boleto.desconto1 ? boleto.desconto1.tipo : 0,
    dataPrimeiroDesconto: boleto.desconto1?.data || '',
    valorPrimeiroDesconto: boleto.desconto1?.valor || 0,
    dataSegundoDesconto: boleto.desconto2?.data || '',
    valorSegundoDesconto: boleto.desconto2?.valor || 0,
    dataTerceiroDesconto: boleto.desconto3?.data || '',
    valorTerceiroDesconto: boleto.desconto3?.valor || 0,
    tipoMulta: boleto.multa ? boleto.multa.tipo : 0,
    dataMulta: boleto.multa?.data || '',
    valorMulta: boleto.multa?.valor || 0,
    tipoJurosMora: boleto.jurosMora ? boleto.jurosMora.tipo : 3, // 3 = Isento
    dataJurosMora: boleto.jurosMora?.data || '',
    valorJurosMora: boleto.jurosMora?.valor || 0,
    numeroParcela: 1,
    aceite: true,
    codigoNegativacao: boleto.numeroDiasNegativacao ? 2 : 0,
    numeroDiasNegativacao: boleto.numeroDiasNegativacao || 0,
    codigoProtesto: 0,
    numeroDiasProtesto: 0,
    pagador: {
      numeroCpfCnpj: boleto.pagador.numeroCpfCnpj.replace(/\D/g, ''),
      nome: boleto.pagador.nome.substring(0, 40),
      endereco: boleto.pagador.endereco.substring(0, 40),
      bairro: boleto.pagador.bairro.substring(0, 30),
      cidade: boleto.pagador.cidade.substring(0, 20),
      cep: boleto.pagador.cep.replace(/\D/g, ''),
      uf: boleto.pagador.uf.toUpperCase(),
      email: boleto.pagador.email || '',
    },
    mensagensInstrucao: boleto.mensagensInstrucao || {},
    gerarPix: boleto.gerarPix ?? true, // Gera PIX por padrão (boleto híbrido)
  };

  const response = await sicoobRequest<SicoobBoletoResponse>(
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
 * Consulta um boleto pelo nosso número
 */
export async function consultarBoleto(
  config: SicoobConfig,
  nossoNumero: number,
  kvCache?: KVNamespace
): Promise<SicoobBoletoConsulta> {
  const response = await sicoobRequest<SicoobBoletoConsulta>(
    config,
    `/boletos/${nossoNumero}`,
    {
      method: 'GET',
      queryParams: {
        numeroContrato: config.numeroCooperado,
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
  config: SicoobConfig,
  filtros: {
    dataInicio: string;
    dataFim: string;
    codigoSituacao?: number;
    paginaAtual?: number;
    itensPorPagina?: number;
  },
  kvCache?: KVNamespace
): Promise<{ boletos: SicoobBoletoConsulta[]; totalPaginas: number; totalRegistros: number }> {
  const queryParams: Record<string, string | number> = {
    numeroContrato: config.numeroCooperado,
    dataInicio: filtros.dataInicio,
    dataFim: filtros.dataFim,
    paginaAtual: filtros.paginaAtual || 0,
    itensPorPagina: filtros.itensPorPagina || 100,
  };

  if (filtros.codigoSituacao !== undefined) {
    queryParams.codigoSituacao = filtros.codigoSituacao;
  }

  const response = await sicoobRequest<{
    resultado: SicoobBoletoConsulta[];
    quantidadeTotalRegistros: number;
    quantidadeTotalPaginas: number;
  }>(config, '/boletos', {
    method: 'GET',
    queryParams,
    kvCache,
  });

  return {
    boletos: response.resultado || [],
    totalPaginas: response.quantidadeTotalPaginas,
    totalRegistros: response.quantidadeTotalRegistros,
  };
}

// ===== BAIXAR BOLETO =====

/**
 * Solicita baixa de um boleto
 */
export async function baixarBoleto(
  config: SicoobConfig,
  nossoNumero: number,
  kvCache?: KVNamespace
): Promise<void> {
  await sicoobRequest(
    config,
    `/boletos/${nossoNumero}/baixar`,
    {
      method: 'PATCH',
      body: {
        numeroContrato: config.numeroCooperado,
      },
      kvCache,
    }
  );
}

// ===== SEGUNDA VIA =====

/**
 * Gera segunda via do boleto (PDF)
 */
export async function segundaViaBoleto(
  config: SicoobConfig,
  nossoNumero: number,
  kvCache?: KVNamespace
): Promise<{ pdf: string }> {
  const response = await sicoobRequest<{ arquivo: string }>(
    config,
    `/boletos/${nossoNumero}/segunda-via`,
    {
      method: 'GET',
      queryParams: {
        numeroContrato: config.numeroCooperado,
      },
      kvCache,
    }
  );

  return { pdf: response.arquivo };
}

// ===== ALTERAR BOLETO =====

/**
 * Altera data de vencimento do boleto
 */
export async function alterarVencimento(
  config: SicoobConfig,
  nossoNumero: number,
  novaDataVencimento: string,
  kvCache?: KVNamespace
): Promise<void> {
  await sicoobRequest(
    config,
    `/boletos/${nossoNumero}/data-vencimento`,
    {
      method: 'PATCH',
      body: {
        numeroContrato: config.numeroCooperado,
        dataVencimento: novaDataVencimento,
      },
      kvCache,
    }
  );
}

/**
 * Altera valor do boleto
 */
export async function alterarValor(
  config: SicoobConfig,
  nossoNumero: number,
  novoValor: number,
  kvCache?: KVNamespace
): Promise<void> {
  await sicoobRequest(
    config,
    `/boletos/${nossoNumero}/valor-nominal`,
    {
      method: 'PATCH',
      body: {
        numeroContrato: config.numeroCooperado,
        valorNominal: novoValor,
      },
      kvCache,
    }
  );
}

/**
 * Altera desconto do boleto
 */
export async function alterarDesconto(
  config: SicoobConfig,
  nossoNumero: number,
  desconto: {
    tipo: number;
    data: string;
    valor: number;
  },
  kvCache?: KVNamespace
): Promise<void> {
  await sicoobRequest(
    config,
    `/boletos/${nossoNumero}/desconto`,
    {
      method: 'PATCH',
      body: {
        numeroContrato: config.numeroCooperado,
        tipoDesconto: desconto.tipo,
        dataPrimeiroDesconto: desconto.data,
        valorPrimeiroDesconto: desconto.valor,
      },
      kvCache,
    }
  );
}

// ===== MAPEAMENTO ERP <-> SICOOB =====

/**
 * Mapeia dados do ERP para formato Sicoob
 */
export function mapErpToSicoob(dados: {
  numeroDocumento: string;
  dataEmissao: string;
  dataVencimento: string;
  valor: number;
  valorAbatimento?: number;
  especieDocumento?: string;
  gerarPix?: boolean;
  diasNegativacao?: number;
  // Pagador
  pagadorCpfCnpj: string;
  pagadorNome: string;
  pagadorEndereco: string;
  pagadorBairro: string;
  pagadorCidade: string;
  pagadorUf: string;
  pagadorCep: string;
  pagadorEmail?: string;
  // Desconto
  descontoData?: string;
  descontoValor?: number;
  descontoTipo?: number;
  // Multa
  multaData?: string;
  multaValor?: number;
  multaTipo?: number;
  // Juros
  jurosData?: string;
  jurosValor?: number;
  jurosTipo?: number;
  // Mensagens
  mensagem1?: string;
  mensagem2?: string;
  mensagem3?: string;
}): SicoobBoletoInclusao {
  // Mapeia espécie do documento
  const especieMap: Record<string, number> = {
    DM: 2,
    DS: 4,
    NP: 12,
    RC: 17,
    FAT: 18,
    ND: 19,
    OU: 32,
  };

  const tipoEspecie = dados.especieDocumento
    ? especieMap[dados.especieDocumento] || 32
    : 2; // DM como padrão

  const boleto: SicoobBoletoInclusao = {
    numeroCliente: dados.numeroDocumento,
    dataEmissao: dados.dataEmissao,
    dataVencimento: dados.dataVencimento,
    valorNominal: dados.valor,
    tipoEspecieDocumento: tipoEspecie,
    gerarPix: dados.gerarPix ?? true,
    numeroDiasNegativacao: dados.diasNegativacao,
    valorAbatimento: dados.valorAbatimento,
    pagador: {
      numeroCpfCnpj: dados.pagadorCpfCnpj,
      nome: dados.pagadorNome,
      endereco: dados.pagadorEndereco,
      bairro: dados.pagadorBairro,
      cidade: dados.pagadorCidade,
      uf: dados.pagadorUf,
      cep: dados.pagadorCep,
      email: dados.pagadorEmail,
    },
  };

  // Desconto
  if (dados.descontoData && dados.descontoValor) {
    boleto.desconto1 = {
      tipo: dados.descontoTipo || 1,
      data: dados.descontoData,
      valor: dados.descontoValor,
    };
  }

  // Multa
  if (dados.multaData && dados.multaValor) {
    boleto.multa = {
      tipo: dados.multaTipo || 2, // Percentual
      data: dados.multaData,
      valor: dados.multaValor,
    };
  }

  // Juros
  if (dados.jurosData && dados.jurosValor) {
    boleto.jurosMora = {
      tipo: dados.jurosTipo || 2, // Taxa mensal
      data: dados.jurosData,
      valor: dados.jurosValor,
    };
  }

  // Mensagens
  if (dados.mensagem1 || dados.mensagem2 || dados.mensagem3) {
    boleto.mensagensInstrucao = {
      mensagem1: dados.mensagem1,
      mensagem2: dados.mensagem2,
      mensagem3: dados.mensagem3,
    };
  }

  return boleto;
}

/**
 * Mapeia dados do Sicoob para formato ERP
 */
export function mapSicoobToErp(dados: SicoobBoletoConsulta): {
  idExterno: string;
  nossoNumero: string;
  codigoBarras: string;
  linhaDigitavel: string;
  dataEmissao: string;
  dataVencimento: string;
  valor: number;
  valorAbatimento?: number;
  valorDesconto?: number;
  valorPago?: number;
  dataPagamento?: string;
  status: string;
  qrCodePix?: string;
  pagadorNome: string;
  pagadorCpfCnpj: string;
} {
  // Mapeia situação para status do ERP
  const statusMap: Record<string, string> = {
    EM_ABERTO: 'aberto',
    BAIXADO: 'baixado',
    LIQUIDADO: 'pago',
    PROTESTADO: 'protestado',
    NEGATIVADO: 'negativado',
    EXPIRADO: 'vencido',
  };

  return {
    idExterno: String(dados.nossoNumero),
    nossoNumero: String(dados.nossoNumero),
    codigoBarras: dados.codigoBarras,
    linhaDigitavel: dados.linhaDigitavel,
    dataEmissao: dados.dataEmissao,
    dataVencimento: dados.dataVencimento,
    valor: dados.valorNominal,
    valorAbatimento: dados.valorAbatimento,
    valorDesconto: dados.valorDesconto,
    valorPago: dados.valorPago,
    dataPagamento: dados.dataPagamento,
    status: statusMap[dados.situacaoBoleto] || 'desconhecido',
    qrCodePix: dados.qrCode,
    pagadorNome: dados.pagador.nome,
    pagadorCpfCnpj: dados.pagador.numeroCpfCnpj,
  };
}

// ===== VALIDAÇÃO =====

/**
 * Valida dados do boleto antes de enviar
 */
export function validarBoleto(boleto: Partial<SicoobBoletoInclusao>): string[] {
  const erros: string[] = [];

  if (!boleto.numeroCliente) {
    erros.push('Número do cliente é obrigatório');
  }

  if (!boleto.dataEmissao) {
    erros.push('Data de emissão é obrigatória');
  }

  if (!boleto.dataVencimento) {
    erros.push('Data de vencimento é obrigatória');
  }

  if (!boleto.valorNominal || boleto.valorNominal <= 0) {
    erros.push('Valor nominal deve ser maior que zero');
  }

  if (!boleto.pagador) {
    erros.push('Dados do pagador são obrigatórios');
  } else {
    if (!boleto.pagador.numeroCpfCnpj) {
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

  // Valida datas
  if (boleto.dataEmissao && boleto.dataVencimento) {
    const emissao = new Date(boleto.dataEmissao);
    const vencimento = new Date(boleto.dataVencimento);
    
    if (vencimento < emissao) {
      erros.push('Data de vencimento não pode ser anterior à data de emissão');
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
 * Retorna descrição da espécie do documento
 */
export function getEspecieDescricao(tipo: number): string {
  return SICOOB_ESPECIES_DOCUMENTO[tipo] || `Tipo ${tipo}`;
}
