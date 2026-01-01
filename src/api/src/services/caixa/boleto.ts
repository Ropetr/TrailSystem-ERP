// =============================================
// PLANAC ERP - Caixa Econômica Federal Boleto Service
// Operações de boleto via API Caixa
// =============================================

import { caixaRequest } from './auth';
import {
  CaixaConfig,
  CaixaBoletoRegistro,
  CaixaBoletoResponse,
  CaixaBoletoConsulta,
  CaixaPagador,
  CAIXA_ESPECIES,
} from './types';

// ===== REGISTRAR BOLETO =====

/**
 * Registra um novo boleto na Caixa
 */
export async function registrarBoleto(
  config: CaixaConfig,
  boleto: CaixaBoletoRegistro,
  kvCache?: KVNamespace
): Promise<CaixaBoletoResponse> {
  const payload = {
    codigoBeneficiario: config.codigoBeneficiario,
    unidade: config.unidade,
    ...boleto,
  };

  const response = await caixaRequest<CaixaBoletoResponse>(
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
  config: CaixaConfig,
  nossoNumero: string,
  kvCache?: KVNamespace
): Promise<CaixaBoletoConsulta> {
  const response = await caixaRequest<CaixaBoletoConsulta>(
    config,
    `/boletos/${nossoNumero}`,
    {
      method: 'GET',
      queryParams: {
        codigoBeneficiario: config.codigoBeneficiario,
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
  config: CaixaConfig,
  filtros: {
    dataInicio: string;
    dataFim: string;
    situacao?: string;
    pagina?: number;
    tamanhoPagina?: number;
  },
  kvCache?: KVNamespace
): Promise<{ boletos: CaixaBoletoConsulta[]; totalRegistros: number }> {
  const queryParams: Record<string, string | number> = {
    codigoBeneficiario: config.codigoBeneficiario,
    dataInicio: filtros.dataInicio,
    dataFim: filtros.dataFim,
    pagina: filtros.pagina || 1,
    tamanhoPagina: filtros.tamanhoPagina || 100,
  };

  if (filtros.situacao) {
    queryParams.situacao = filtros.situacao;
  }

  const response = await caixaRequest<{
    boletos: CaixaBoletoConsulta[];
    totalRegistros: number;
  }>(config, '/boletos', {
    method: 'GET',
    queryParams,
    kvCache,
  });

  return {
    boletos: response.boletos || [],
    totalRegistros: response.totalRegistros,
  };
}

// ===== BAIXAR BOLETO =====

/**
 * Solicita baixa de um boleto
 */
export async function baixarBoleto(
  config: CaixaConfig,
  nossoNumero: string,
  kvCache?: KVNamespace
): Promise<void> {
  await caixaRequest(
    config,
    `/boletos/${nossoNumero}/baixar`,
    {
      method: 'POST',
      body: {
        codigoBeneficiario: config.codigoBeneficiario,
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
  config: CaixaConfig,
  nossoNumero: string,
  novaDataVencimento: string,
  kvCache?: KVNamespace
): Promise<void> {
  await caixaRequest(
    config,
    `/boletos/${nossoNumero}`,
    {
      method: 'PATCH',
      body: {
        codigoBeneficiario: config.codigoBeneficiario,
        dataVencimento: novaDataVencimento,
      },
      kvCache,
    }
  );
}

/**
 * Altera valor de abatimento do boleto
 */
export async function alterarAbatimento(
  config: CaixaConfig,
  nossoNumero: string,
  valorAbatimento: number,
  kvCache?: KVNamespace
): Promise<void> {
  await caixaRequest(
    config,
    `/boletos/${nossoNumero}`,
    {
      method: 'PATCH',
      body: {
        codigoBeneficiario: config.codigoBeneficiario,
        valorAbatimento,
      },
      kvCache,
    }
  );
}

// ===== MAPEAMENTO ERP <-> CAIXA =====

/**
 * Mapeia dados do ERP para formato Caixa
 */
export function mapErpToCaixa(dados: {
  nossoNumero: string;
  numeroDocumento: string;
  dataEmissao: string;
  dataVencimento: string;
  valor: number;
  valorAbatimento?: number;
  especieDocumento?: string;
  gerarPix?: boolean;
  // Pagador
  pagadorCpfCnpj: string;
  pagadorNome: string;
  pagadorEndereco: string;
  pagadorBairro: string;
  pagadorCidade: string;
  pagadorUf: string;
  pagadorCep: string;
  // Desconto
  descontoData?: string;
  descontoValor?: number;
  descontoTipo?: string;
  // Multa
  multaData?: string;
  multaValor?: number;
  multaTipo?: string;
  // Juros
  jurosData?: string;
  jurosValor?: number;
  jurosTipo?: string;
  // Mensagens
  mensagem1?: string;
  mensagem2?: string;
  mensagem3?: string;
}): CaixaBoletoRegistro {
  // Mapeia espécie do documento
  const especieMap: Record<string, string> = {
    DM: '02',
    DS: '04',
    NP: '12',
    RC: '17',
    FAT: '18',
    ND: '19',
    OU: '32',
  };

  const tipoEspecie = dados.especieDocumento
    ? especieMap[dados.especieDocumento] || '32'
    : '02'; // DM como padrão

  // Identifica tipo de documento
  const cpfCnpj = dados.pagadorCpfCnpj.replace(/\D/g, '');
  const tipoInscricao = cpfCnpj.length === 11 ? '1' : '2';

  const boleto: CaixaBoletoRegistro = {
    codigoBeneficiario: '', // Será preenchido pelo config
    unidade: '', // Será preenchido pelo config
    nossoNumero: dados.nossoNumero,
    numeroDocumento: dados.numeroDocumento,
    dataEmissao: dados.dataEmissao,
    dataVencimento: dados.dataVencimento,
    valor: dados.valor,
    tipoEspecie,
    flagAceite: 'S',
    valorAbatimento: dados.valorAbatimento,
    gerarPix: dados.gerarPix ?? true,
    pagador: {
      tipoInscricao,
      numeroInscricao: cpfCnpj,
      nome: dados.pagadorNome.substring(0, 40),
      endereco: dados.pagadorEndereco.substring(0, 40),
      bairro: dados.pagadorBairro.substring(0, 15),
      cidade: dados.pagadorCidade.substring(0, 15),
      uf: dados.pagadorUf.toUpperCase(),
      cep: dados.pagadorCep.replace(/\D/g, ''),
    },
  };

  // Desconto
  if (dados.descontoData && dados.descontoValor) {
    boleto.desconto = {
      tipo: dados.descontoTipo || '1',
      data: dados.descontoData,
      valor: dados.descontoValor,
    };
  }

  // Multa
  if (dados.multaData && dados.multaValor) {
    boleto.multa = {
      tipo: dados.multaTipo || '2', // Percentual
      data: dados.multaData,
      valor: dados.multaValor,
    };
  }

  // Juros
  if (dados.jurosData && dados.jurosValor) {
    boleto.juros = {
      tipo: dados.jurosTipo || '2', // Taxa mensal
      data: dados.jurosData,
      valor: dados.jurosValor,
    };
  }

  // Mensagens
  const mensagens: string[] = [];
  if (dados.mensagem1) mensagens.push(dados.mensagem1);
  if (dados.mensagem2) mensagens.push(dados.mensagem2);
  if (dados.mensagem3) mensagens.push(dados.mensagem3);
  if (mensagens.length > 0) {
    boleto.mensagens = mensagens;
  }

  return boleto;
}

/**
 * Mapeia dados da Caixa para formato ERP
 */
export function mapCaixaToErp(dados: CaixaBoletoConsulta): {
  idExterno: string;
  nossoNumero: string;
  codigoBarras: string;
  linhaDigitavel: string;
  dataEmissao: string;
  dataVencimento: string;
  valor: number;
  valorPago?: number;
  dataPagamento?: string;
  dataCredito?: string;
  status: string;
  qrCodePix?: string;
  pagadorNome: string;
  pagadorCpfCnpj: string;
} {
  // Mapeia situação para status do ERP
  const statusMap: Record<string, string> = {
    '01': 'aberto',
    '02': 'baixado',
    '03': 'pago',
    '04': 'protestado',
    '05': 'rejeitado',
    '06': 'negativado',
    '07': 'vencido',
  };

  return {
    idExterno: dados.nossoNumero,
    nossoNumero: dados.nossoNumero,
    codigoBarras: dados.codigoBarras,
    linhaDigitavel: dados.linhaDigitavel,
    dataEmissao: dados.dataEmissao,
    dataVencimento: dados.dataVencimento,
    valor: dados.valor,
    valorPago: dados.valorPago,
    dataPagamento: dados.dataPagamento,
    dataCredito: dados.dataCredito,
    status: statusMap[dados.codigoSituacao] || 'desconhecido',
    qrCodePix: dados.qrCode,
    pagadorNome: dados.pagador.nome,
    pagadorCpfCnpj: dados.pagador.numeroInscricao,
  };
}

// ===== VALIDAÇÃO =====

/**
 * Valida dados do boleto antes de enviar
 */
export function validarBoleto(boleto: Partial<CaixaBoletoRegistro>): string[] {
  const erros: string[] = [];

  if (!boleto.nossoNumero) {
    erros.push('Nosso número é obrigatório');
  }

  if (!boleto.dataEmissao) {
    erros.push('Data de emissão é obrigatória');
  }

  if (!boleto.dataVencimento) {
    erros.push('Data de vencimento é obrigatória');
  }

  if (!boleto.valor || boleto.valor <= 0) {
    erros.push('Valor deve ser maior que zero');
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

  // Valida nosso número (17 dígitos para Caixa)
  if (boleto.nossoNumero && boleto.nossoNumero.length > 17) {
    erros.push('Nosso número deve ter no máximo 17 dígitos');
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
export function getEspecieDescricao(codigo: string): string {
  return CAIXA_ESPECIES[codigo] || `Espécie ${codigo}`;
}

/**
 * Gera nosso número no formato Caixa (17 dígitos)
 * Formato: XXXXXX + NNNNNNNNNNN (6 dígitos código beneficiário + 11 dígitos sequencial)
 */
export function gerarNossoNumero(
  codigoBeneficiario: string,
  sequencial: number
): string {
  const codBenef = codigoBeneficiario.padStart(6, '0').substring(0, 6);
  const seq = String(sequencial).padStart(11, '0');
  return `${codBenef}${seq}`;
}

/**
 * Calcula dígito verificador do nosso número (módulo 11)
 */
export function calcularDigitoNossoNumero(nossoNumero: string): string {
  const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  let pesoIndex = 0;

  for (let i = nossoNumero.length - 1; i >= 0; i--) {
    soma += parseInt(nossoNumero[i], 10) * pesos[pesoIndex];
    pesoIndex = (pesoIndex + 1) % pesos.length;
  }

  const resto = soma % 11;
  const digito = 11 - resto;

  if (digito === 10 || digito === 11) {
    return '0';
  }

  return String(digito);
}
