// =============================================
// PLANAC ERP - Banco Safra Boleto Service
// Operações de boleto via API Safra
// =============================================

import { safraRequest } from './auth';
import {
  SafraConfig,
  SafraBoletoRegistro,
  SafraBoletoResponse,
  SafraBoletoConsulta,
  SafraPagador,
  SAFRA_ESPECIES,
} from './types';

// ===== REGISTRAR BOLETO =====

/**
 * Registra um novo boleto no Safra
 */
export async function registrarBoleto(
  config: SafraConfig,
  boleto: SafraBoletoRegistro,
  kvCache?: KVNamespace
): Promise<SafraBoletoResponse> {
  const payload = {
    codigoBeneficiario: config.codigoBeneficiario,
    ...boleto,
  };

  const response = await safraRequest<SafraBoletoResponse>(
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
  config: SafraConfig,
  nossoNumero: string,
  kvCache?: KVNamespace
): Promise<SafraBoletoConsulta> {
  const response = await safraRequest<SafraBoletoConsulta>(
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
  config: SafraConfig,
  filtros: {
    dataInicio: string;
    dataFim: string;
    situacao?: string;
    pagina?: number;
    tamanhoPagina?: number;
  },
  kvCache?: KVNamespace
): Promise<{ boletos: SafraBoletoConsulta[]; totalRegistros: number }> {
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

  const response = await safraRequest<{
    boletos: SafraBoletoConsulta[];
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
  config: SafraConfig,
  nossoNumero: string,
  kvCache?: KVNamespace
): Promise<void> {
  await safraRequest(
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
  config: SafraConfig,
  nossoNumero: string,
  novaDataVencimento: string,
  kvCache?: KVNamespace
): Promise<void> {
  await safraRequest(
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
  config: SafraConfig,
  nossoNumero: string,
  valorAbatimento: number,
  kvCache?: KVNamespace
): Promise<void> {
  await safraRequest(
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

/**
 * Protestar boleto
 */
export async function protestarBoleto(
  config: SafraConfig,
  nossoNumero: string,
  diasProtesto: number,
  kvCache?: KVNamespace
): Promise<void> {
  await safraRequest(
    config,
    `/boletos/${nossoNumero}/protestar`,
    {
      method: 'POST',
      body: {
        codigoBeneficiario: config.codigoBeneficiario,
        diasProtesto,
      },
      kvCache,
    }
  );
}

// ===== MAPEAMENTO ERP <-> SAFRA =====

/**
 * Mapeia dados do ERP para formato Safra
 */
export function mapErpToSafra(dados: {
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
  pagadorNumero?: string;
  pagadorComplemento?: string;
  pagadorBairro: string;
  pagadorCidade: string;
  pagadorUf: string;
  pagadorCep: string;
  pagadorEmail?: string;
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
  jurosData?: string;
  jurosValor?: number;
  jurosTipo?: number;
  // Instruções
  instrucao1?: string;
  instrucao2?: string;
  instrucao3?: string;
}): SafraBoletoRegistro {
  // Identifica tipo de documento
  const cpfCnpj = dados.pagadorCpfCnpj.replace(/\D/g, '');
  const tipoPessoa = cpfCnpj.length === 11 ? 'F' : 'J';

  const boleto: SafraBoletoRegistro = {
    codigoBeneficiario: '', // Será preenchido pelo config
    nossoNumero: dados.nossoNumero,
    seuNumero: dados.numeroDocumento,
    dataEmissao: dados.dataEmissao,
    dataVencimento: dados.dataVencimento,
    valorNominal: dados.valor,
    especieDocumento: dados.especieDocumento || 'DM',
    aceite: 'N',
    valorAbatimento: dados.valorAbatimento,
    gerarQrCode: dados.gerarPix ?? true,
    pagador: {
      tipoPessoa,
      cpfCnpj,
      nome: dados.pagadorNome.substring(0, 40),
      endereco: dados.pagadorEndereco.substring(0, 40),
      numero: dados.pagadorNumero,
      complemento: dados.pagadorComplemento,
      bairro: dados.pagadorBairro.substring(0, 15),
      cidade: dados.pagadorCidade.substring(0, 15),
      uf: dados.pagadorUf.toUpperCase(),
      cep: dados.pagadorCep.replace(/\D/g, ''),
      email: dados.pagadorEmail,
      telefone: dados.pagadorTelefone,
    },
  };

  // Desconto
  if (dados.descontoData && dados.descontoValor) {
    boleto.desconto = {
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
    boleto.juros = {
      tipo: dados.jurosTipo || 2, // Taxa mensal
      data: dados.jurosData,
      valor: dados.jurosValor,
    };
  }

  // Instruções
  const instrucoes: string[] = [];
  if (dados.instrucao1) instrucoes.push(dados.instrucao1);
  if (dados.instrucao2) instrucoes.push(dados.instrucao2);
  if (dados.instrucao3) instrucoes.push(dados.instrucao3);
  if (instrucoes.length > 0) {
    boleto.instrucoes = instrucoes;
  }

  return boleto;
}

/**
 * Mapeia dados do Safra para formato ERP
 */
export function mapSafraToErp(dados: SafraBoletoConsulta): {
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
    '06': 'cartorio',
    '07': 'vencido',
  };

  return {
    idExterno: dados.nossoNumero,
    nossoNumero: dados.nossoNumero,
    codigoBarras: dados.codigoBarras,
    linhaDigitavel: dados.linhaDigitavel,
    dataEmissao: dados.dataEmissao,
    dataVencimento: dados.dataVencimento,
    valor: dados.valorNominal,
    valorPago: dados.valorPago,
    dataPagamento: dados.dataPagamento,
    dataCredito: dados.dataCredito,
    status: statusMap[dados.codigoSituacao] || 'desconhecido',
    qrCodePix: dados.emvQrCode || dados.qrCode,
    pagadorNome: dados.pagador.nome,
    pagadorCpfCnpj: dados.pagador.cpfCnpj,
  };
}

// ===== VALIDAÇÃO =====

/**
 * Valida dados do boleto antes de enviar
 */
export function validarBoleto(boleto: Partial<SafraBoletoRegistro>): string[] {
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

  if (!boleto.valorNominal || boleto.valorNominal <= 0) {
    erros.push('Valor nominal deve ser maior que zero');
  }

  if (!boleto.pagador) {
    erros.push('Dados do pagador são obrigatórios');
  } else {
    if (!boleto.pagador.cpfCnpj) {
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

  // Valida espécie do documento
  if (boleto.especieDocumento && !SAFRA_ESPECIES[boleto.especieDocumento]) {
    erros.push(`Espécie de documento inválida: ${boleto.especieDocumento}`);
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
  return SAFRA_ESPECIES[codigo] || `Espécie ${codigo}`;
}

/**
 * Gera nosso número no formato Safra
 */
export function gerarNossoNumero(sequencial: number): string {
  return String(sequencial).padStart(11, '0');
}
