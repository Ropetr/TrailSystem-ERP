// =============================================
// PLANAC ERP - Nuvem Fiscal Empresas Service
// =============================================
// Gerencia cadastro de empresas na Nuvem Fiscal
// Cada cliente PLANAC = 1 empresa na Nuvem Fiscal

import { nuvemFiscalRequest } from './nuvem-fiscal-auth.service';

// =============================================
// Interfaces
// =============================================

export interface EnderecoNuvemFiscal {
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
  telefone?: string;
}

export interface EmpresaNuvemFiscal {
  cpf_cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  nome_razao_social: string;
  nome_fantasia?: string;
  fone?: string;
  email?: string;
  endereco: EnderecoNuvemFiscal;
  optante_simples_nacional?: boolean;
  regime_tributacao?: 'simples_nacional' | 'simples_nacional_excesso' | 'lucro_presumido' | 'lucro_real';
  regime_especial_tributacao?: string;
  incentivo_fiscal?: boolean;
}

export interface EmpresaResponse extends EmpresaNuvemFiscal {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface CertificadoUpload {
  certificado: string; // Base64 do arquivo .pfx
  senha: string;
}

export interface CertificadoResponse {
  id: string;
  serial_number: string;
  issuer_name: string;
  subject_name: string;
  not_valid_before: string;
  not_valid_after: string;
  thumbprint: string;
}

// =============================================
// Funções de Empresa
// =============================================

/**
 * Lista todas as empresas cadastradas
 */
export async function listarEmpresas(
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<EmpresaResponse[]> {
  return nuvemFiscalRequest<EmpresaResponse[]>('/empresas', { ambiente });
}

/**
 * Busca uma empresa pelo CNPJ
 */
export async function buscarEmpresa(
  cpfCnpj: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<EmpresaResponse | null> {
  try {
    // Remove formatação do CNPJ
    const cnpjLimpo = cpfCnpj.replace(/\D/g, '');
    return await nuvemFiscalRequest<EmpresaResponse>(
      `/empresas/${cnpjLimpo}`,
      { ambiente }
    );
  } catch (error) {
    // Se 404, retorna null
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Cadastra uma nova empresa
 */
export async function cadastrarEmpresa(
  empresa: EmpresaNuvemFiscal,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<EmpresaResponse> {
  // Limpa CNPJ antes de enviar
  const empresaData = {
    ...empresa,
    cpf_cnpj: empresa.cpf_cnpj.replace(/\D/g, ''),
  };

  return nuvemFiscalRequest<EmpresaResponse>('/empresas', {
    method: 'POST',
    body: empresaData,
    ambiente,
  });
}

/**
 * Atualiza dados de uma empresa existente
 */
export async function atualizarEmpresa(
  cpfCnpj: string,
  empresa: Partial<EmpresaNuvemFiscal>,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<EmpresaResponse> {
  const cnpjLimpo = cpfCnpj.replace(/\D/g, '');
  
  return nuvemFiscalRequest<EmpresaResponse>(`/empresas/${cnpjLimpo}`, {
    method: 'PUT',
    body: empresa,
    ambiente,
  });
}

/**
 * Remove uma empresa
 */
export async function removerEmpresa(
  cpfCnpj: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<void> {
  const cnpjLimpo = cpfCnpj.replace(/\D/g, '');
  
  await nuvemFiscalRequest(`/empresas/${cnpjLimpo}`, {
    method: 'DELETE',
    ambiente,
  });
}

// =============================================
// Funções de Certificado Digital
// =============================================

/**
 * Lista certificados de uma empresa
 */
export async function listarCertificados(
  cpfCnpj: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<CertificadoResponse[]> {
  const cnpjLimpo = cpfCnpj.replace(/\D/g, '');
  
  return nuvemFiscalRequest<CertificadoResponse[]>(
    `/empresas/${cnpjLimpo}/certificado`,
    { ambiente }
  );
}

/**
 * Faz upload do certificado digital A1 (.pfx)
 */
export async function uploadCertificado(
  cpfCnpj: string,
  certificadoBase64: string,
  senha: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<CertificadoResponse> {
  const cnpjLimpo = cpfCnpj.replace(/\D/g, '');
  
  return nuvemFiscalRequest<CertificadoResponse>(
    `/empresas/${cnpjLimpo}/certificado`,
    {
      method: 'PUT',
      body: {
        certificado: certificadoBase64,
        password: senha,
      },
      ambiente,
    }
  );
}

/**
 * Remove certificado de uma empresa
 */
export async function removerCertificado(
  cpfCnpj: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<void> {
  const cnpjLimpo = cpfCnpj.replace(/\D/g, '');
  
  await nuvemFiscalRequest(`/empresas/${cnpjLimpo}/certificado`, {
    method: 'DELETE',
    ambiente,
  });
}

/**
 * Verifica se certificado está válido
 */
export async function verificarCertificado(
  cpfCnpj: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<{
  valido: boolean;
  vencimento?: string;
  diasParaVencer?: number;
  mensagem: string;
}> {
  try {
    const certs = await listarCertificados(cpfCnpj, ambiente);
    
    if (!certs || certs.length === 0) {
      return {
        valido: false,
        mensagem: 'Nenhum certificado cadastrado',
      };
    }

    const cert = certs[0];
    const vencimento = new Date(cert.not_valid_after);
    const hoje = new Date();
    const diasParaVencer = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diasParaVencer < 0) {
      return {
        valido: false,
        vencimento: cert.not_valid_after,
        diasParaVencer,
        mensagem: 'Certificado vencido',
      };
    }

    if (diasParaVencer < 30) {
      return {
        valido: true,
        vencimento: cert.not_valid_after,
        diasParaVencer,
        mensagem: `Certificado vence em ${diasParaVencer} dias - RENOVAR!`,
      };
    }

    return {
      valido: true,
      vencimento: cert.not_valid_after,
      diasParaVencer,
      mensagem: 'Certificado válido',
    };
  } catch (error) {
    return {
      valido: false,
      mensagem: error instanceof Error ? error.message : 'Erro ao verificar certificado',
    };
  }
}

// =============================================
// Funções Auxiliares
// =============================================

/**
 * Cadastra empresa PLANAC com dados do sistema
 */
export async function cadastrarEmpresaPlanac(
  dadosEmpresa: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string;
    inscricaoEstadual?: string;
    inscricaoMunicipal?: string;
    email?: string;
    telefone?: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      codigoMunicipio: string;
      cidade: string;
      uf: string;
      cep: string;
    };
    regimeTributario?: 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
  },
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<EmpresaResponse> {
  const empresa: EmpresaNuvemFiscal = {
    cpf_cnpj: dadosEmpresa.cnpj,
    nome_razao_social: dadosEmpresa.razaoSocial,
    nome_fantasia: dadosEmpresa.nomeFantasia,
    inscricao_estadual: dadosEmpresa.inscricaoEstadual,
    inscricao_municipal: dadosEmpresa.inscricaoMunicipal,
    email: dadosEmpresa.email,
    fone: dadosEmpresa.telefone,
    endereco: {
      logradouro: dadosEmpresa.endereco.logradouro,
      numero: dadosEmpresa.endereco.numero,
      complemento: dadosEmpresa.endereco.complemento,
      bairro: dadosEmpresa.endereco.bairro,
      codigo_municipio: dadosEmpresa.endereco.codigoMunicipio,
      cidade: dadosEmpresa.endereco.cidade,
      uf: dadosEmpresa.endereco.uf,
      cep: dadosEmpresa.endereco.cep.replace(/\D/g, ''),
    },
    regime_tributacao: dadosEmpresa.regimeTributario,
    optante_simples_nacional: dadosEmpresa.regimeTributario === 'simples_nacional',
  };

  // Verifica se já existe
  const existente = await buscarEmpresa(dadosEmpresa.cnpj, ambiente);
  if (existente) {
    // Atualiza se já existe
    return atualizarEmpresa(dadosEmpresa.cnpj, empresa, ambiente);
  }

  // Cadastra nova
  return cadastrarEmpresa(empresa, ambiente);
}

export default {
  listarEmpresas,
  buscarEmpresa,
  cadastrarEmpresa,
  atualizarEmpresa,
  removerEmpresa,
  listarCertificados,
  uploadCertificado,
  removerCertificado,
  verificarCertificado,
  cadastrarEmpresaPlanac,
};
