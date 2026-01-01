// =============================================
// PLANAC ERP - Sisprime Boleto Service
// Registro e consulta de boletos via API CobExpress
// =============================================

import type {
  SisprimeConfig,
  SisprimeTituloEnvio,
  SisprimeEnviarBoletoResponse,
  SisprimeConsultarBoletoResponse,
  SisprimeTituloConsulta,
  SisprimeError,
} from './types';
import { sisprimeRequest } from './auth';

// ===== ENVIAR BOLETO =====

/**
 * Registra um novo boleto ou altera um boleto existente
 * 
 * @param config - Configuração de autenticação Sisprime
 * @param titulo - Dados do título a ser registrado
 * @returns Resposta com dados do boleto registrado (id_boleto, nosso_numero, codigo_barras, linha_digitavel, qr_code)
 * 
 * @example
 * ```typescript
 * const response = await enviarBoleto(config, {
 *   numero_documento: 'FAT001',
 *   data_emissao: '2025-01-15',
 *   data_vencimento: '2025-01-30',
 *   valor_documento: 150.00,
 *   sacado_tipo: 'PJ',
 *   sacado_cpf_cnpj: '12345678000190',
 *   sacado_nome: 'Empresa Cliente LTDA',
 *   sacado_endereco: 'Rua das Flores, 123',
 *   sacado_bairro: 'Centro',
 *   sacado_cidade: 'São Paulo',
 *   sacado_uf: 'SP',
 *   sacado_cep: '01234567',
 * });
 * 
 * if (response.status === 'sucesso') {
 *   console.log('Boleto registrado:', response.dados?.id_boleto);
 *   console.log('Linha digitável:', response.dados?.linha_digitavel);
 *   console.log('QR Code PIX:', response.dados?.qr_code);
 * }
 * ```
 */
export async function enviarBoleto(
  config: SisprimeConfig,
  titulo: SisprimeTituloEnvio
): Promise<SisprimeEnviarBoletoResponse> {
  try {
    const response = await sisprimeRequest<SisprimeEnviarBoletoResponse>(
      config,
      'enviarboleto',
      { titulo }
    );
    
    return response;
  } catch (error) {
    const sisprimeError = error as SisprimeError;
    return {
      status: 'erro',
      mensagem: sisprimeError.message || 'Erro ao enviar boleto',
      erros: [{
        campo: 'geral',
        mensagem: sisprimeError.response 
          ? JSON.stringify(sisprimeError.response) 
          : sisprimeError.message,
      }],
    };
  }
}

// ===== CONSULTAR BOLETO =====

/**
 * Consulta um boleto pelo ID
 * 
 * @param config - Configuração de autenticação Sisprime
 * @param idBoleto - ID único do boleto no Sisprime (retornado no enviarBoleto)
 * @returns Dados completos do boleto incluindo situação atual
 * 
 * @example
 * ```typescript
 * const response = await consultarBoleto(config, '0855381d5ad42993148139f7e3b573j0');
 * 
 * if (response.status === 'sucesso' && response.dados) {
 *   console.log('Situação:', response.dados.descricao_situacao);
 *   console.log('Valor pago:', response.dados.valor_pago);
 * }
 * ```
 */
export async function consultarBoleto(
  config: SisprimeConfig,
  idBoleto: string
): Promise<SisprimeConsultarBoletoResponse> {
  try {
    const response = await sisprimeRequest<SisprimeConsultarBoletoResponse>(
      config,
      'consultarboleto',
      { id_boleto: idBoleto }
    );
    
    return response;
  } catch (error) {
    const sisprimeError = error as SisprimeError;
    return {
      status: 'erro',
      mensagem: sisprimeError.message || 'Erro ao consultar boleto',
    };
  }
}

// ===== HELPERS =====

/**
 * Formata CPF (11 dígitos) ou CNPJ (14 dígitos) removendo caracteres especiais
 */
export function formatarCpfCnpj(documento: string): string {
  return documento.replace(/\D/g, '');
}

/**
 * Formata CEP (8 dígitos) removendo caracteres especiais
 */
export function formatarCep(cep: string): string {
  return cep.replace(/\D/g, '').padStart(8, '0');
}

/**
 * Valida se o documento é CPF (11 dígitos) ou CNPJ (14 dígitos)
 */
export function identificarTipoDocumento(documento: string): 'PF' | 'PJ' {
  const limpo = formatarCpfCnpj(documento);
  return limpo.length <= 11 ? 'PF' : 'PJ';
}

/**
 * Converte dados do ERP para formato Sisprime
 * 
 * @param dados - Dados do boleto no formato do ERP
 * @returns Dados formatados para API Sisprime
 */
export function mapErpToSisprime(dados: {
  numero_documento: string;
  nosso_numero?: string;
  data_emissao: string;
  data_vencimento: string;
  valor_documento: number;
  valor_abatimento?: number;
  percentual_multa?: number;
  percentual_juros?: number;
  dias_protesto?: number;
  sacado_cpf_cnpj: string;
  sacado_nome: string;
  sacado_endereco?: string;
  sacado_numero?: string;
  sacado_complemento?: string;
  sacado_bairro?: string;
  sacado_cidade?: string;
  sacado_uf?: string;
  sacado_cep?: string;
  sacado_email?: string;
  sacado_telefone?: string;
  mensagem_1?: string;
  mensagem_2?: string;
  mensagem_3?: string;
}): SisprimeTituloEnvio {
  const cpfCnpjLimpo = formatarCpfCnpj(dados.sacado_cpf_cnpj);
  
  return {
    numero_documento: dados.numero_documento.substring(0, 10),
    nosso_numero: dados.nosso_numero,
    data_emissao: dados.data_emissao,
    data_vencimento: dados.data_vencimento,
    valor_documento: dados.valor_documento,
    valor_abatimento: dados.valor_abatimento,
    percentual_multa: dados.percentual_multa,
    percentual_juros: dados.percentual_juros,
    tipo_protesto_negativacao: dados.dias_protesto && dados.dias_protesto > 0 ? 1 : 0,
    prazo_protesto_negativacao: dados.dias_protesto,
    sacado_tipo: identificarTipoDocumento(cpfCnpjLimpo),
    sacado_cpf_cnpj: cpfCnpjLimpo,
    sacado_nome: dados.sacado_nome.substring(0, 40),
    sacado_endereco: dados.sacado_endereco || '',
    sacado_numero: dados.sacado_numero,
    sacado_complemento: dados.sacado_complemento,
    sacado_bairro: dados.sacado_bairro || '',
    sacado_cidade: dados.sacado_cidade || '',
    sacado_uf: dados.sacado_uf || '',
    sacado_cep: dados.sacado_cep ? formatarCep(dados.sacado_cep) : '',
    sacado_email: dados.sacado_email,
    sacado_telefone: dados.sacado_telefone,
    mensagem_1: dados.mensagem_1?.substring(0, 40),
    mensagem_2: dados.mensagem_2?.substring(0, 40),
    mensagem_3: dados.mensagem_3?.substring(0, 40),
    especie_documento: 'DM',
    aceite: 'N',
  };
}

/**
 * Converte resposta do Sisprime para formato do ERP
 * 
 * @param dados - Dados do boleto retornados pelo Sisprime
 * @returns Dados formatados para o ERP
 */
export function mapSisprimeToErp(dados: SisprimeTituloConsulta): {
  id_externo: string;
  nosso_numero: string;
  numero_documento: string;
  codigo_barras: string;
  linha_digitavel: string;
  data_emissao: string;
  data_vencimento: string;
  valor_documento: number;
  valor_pago: number | null;
  data_pagamento: string | null;
  data_credito: string | null;
  status: string;
  codigo_situacao: string;
  descricao_situacao: string;
  qr_code: string | null;
} {
  // Mapear situação Sisprime para status do ERP
  const statusMap: Record<string, string> = {
    '01': 'registrado',    // EM ABERTO
    '02': 'baixado',       // BAIXADO
    '03': 'protestado',    // PROTESTADO
    '04': 'protestado',    // NEGATIVADO
    '05': 'pago',          // LIQUIDADO CARTÓRIO
    '06': 'pago',          // LIQUIDADO APÓS BAIXA
    '07': 'pago',          // PAGO
    '08': 'pago',          // PAGO A MENOR
    '09': 'pago',          // PAGO A MAIOR
  };
  
  return {
    id_externo: dados.id_boleto,
    nosso_numero: dados.nosso_numero,
    numero_documento: dados.numero_documento,
    codigo_barras: dados.codigo_barras,
    linha_digitavel: dados.linha_digitavel,
    data_emissao: dados.data_emissao,
    data_vencimento: dados.data_vencimento,
    valor_documento: dados.valor_documento,
    valor_pago: dados.valor_pago || null,
    data_pagamento: dados.data_pagamento || null,
    data_credito: dados.data_credito || null,
    status: statusMap[dados.codigo_situacao] || 'registrado',
    codigo_situacao: dados.codigo_situacao,
    descricao_situacao: dados.descricao_situacao,
    qr_code: dados.qr_code || null,
  };
}

/**
 * Gera próximo nosso número baseado na sequência atual
 * 
 * @param sequenciaAtual - Número atual da sequência
 * @param digitosTotal - Total de dígitos do nosso número (padrão: 11)
 * @returns Nosso número formatado com zeros à esquerda
 */
export function gerarNossoNumero(sequenciaAtual: number, digitosTotal: number = 11): string {
  const proximo = sequenciaAtual + 1;
  return proximo.toString().padStart(digitosTotal, '0');
}

/**
 * Valida dados mínimos obrigatórios para envio de boleto
 * 
 * @param titulo - Dados do título
 * @returns Array de erros encontrados (vazio se válido)
 */
export function validarTitulo(titulo: Partial<SisprimeTituloEnvio>): string[] {
  const erros: string[] = [];
  
  if (!titulo.numero_documento) {
    erros.push('Número do documento é obrigatório');
  }
  
  if (!titulo.data_emissao) {
    erros.push('Data de emissão é obrigatória');
  }
  
  if (!titulo.data_vencimento) {
    erros.push('Data de vencimento é obrigatória');
  }
  
  if (!titulo.valor_documento || titulo.valor_documento <= 0) {
    erros.push('Valor do documento deve ser maior que zero');
  }
  
  if (!titulo.sacado_cpf_cnpj) {
    erros.push('CPF/CNPJ do sacado é obrigatório');
  } else {
    const cpfCnpjLimpo = formatarCpfCnpj(titulo.sacado_cpf_cnpj);
    if (cpfCnpjLimpo.length !== 11 && cpfCnpjLimpo.length !== 14) {
      erros.push('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos');
    }
  }
  
  if (!titulo.sacado_nome) {
    erros.push('Nome do sacado é obrigatório');
  }
  
  if (!titulo.sacado_endereco) {
    erros.push('Endereço do sacado é obrigatório');
  }
  
  if (!titulo.sacado_bairro) {
    erros.push('Bairro do sacado é obrigatório');
  }
  
  if (!titulo.sacado_cidade) {
    erros.push('Cidade do sacado é obrigatória');
  }
  
  if (!titulo.sacado_uf || titulo.sacado_uf.length !== 2) {
    erros.push('UF do sacado deve ter 2 caracteres');
  }
  
  if (!titulo.sacado_cep) {
    erros.push('CEP do sacado é obrigatório');
  } else {
    const cepLimpo = formatarCep(titulo.sacado_cep);
    if (cepLimpo.length !== 8) {
      erros.push('CEP deve ter 8 dígitos');
    }
  }
  
  return erros;
}
