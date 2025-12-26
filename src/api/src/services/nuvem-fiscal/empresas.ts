// =============================================
// PLANAC ERP - Nuvem Fiscal Empresas Service
// Gestão de empresas e certificados digitais
// =============================================

import type { 
  NuvemFiscalConfig, 
  Empresa, 
  EmpresaListagem, 
  EmpresaCertificado,
  EmpresaCertificadoInfo,
  EmpresaConfigNfe,
  PaginacaoParams 
} from './types';
import { nuvemFiscalRequest } from './auth';

/**
 * Lista empresas cadastradas
 */
export async function listarEmpresas(
  config: NuvemFiscalConfig,
  paginacao?: PaginacaoParams,
  cpf_cnpj?: string,
  kv?: KVNamespace
): Promise<EmpresaListagem> {
  const params = new URLSearchParams();
  
  if (paginacao?.$top) params.append('$top', paginacao.$top.toString());
  if (paginacao?.$skip) params.append('$skip', paginacao.$skip.toString());
  if (paginacao?.$inlinecount) params.append('$inlinecount', 'true');
  if (cpf_cnpj) params.append('cpf_cnpj', cpf_cnpj.replace(/\D/g, ''));

  const query = params.toString();
  const endpoint = query ? `/empresas?${query}` : '/empresas';

  return nuvemFiscalRequest<EmpresaListagem>(config, endpoint, { method: 'GET' }, kv);
}

/**
 * Busca empresa pelo CNPJ
 */
export async function buscarEmpresa(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  kv?: KVNamespace
): Promise<Empresa | null> {
  try {
    return await nuvemFiscalRequest<Empresa>(
      config,
      `/empresas/${cpf_cnpj.replace(/\D/g, '')}`,
      { method: 'GET' },
      kv
    );
  } catch (error: any) {
    if (error.status === 404) return null;
    throw error;
  }
}

/**
 * Cadastra nova empresa
 */
export async function cadastrarEmpresa(
  config: NuvemFiscalConfig,
  empresa: Empresa,
  kv?: KVNamespace
): Promise<Empresa> {
  return nuvemFiscalRequest<Empresa>(
    config,
    '/empresas',
    {
      method: 'POST',
      body: JSON.stringify(empresa),
    },
    kv
  );
}

/**
 * Atualiza empresa existente
 */
export async function atualizarEmpresa(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  empresa: Partial<Empresa>,
  kv?: KVNamespace
): Promise<Empresa> {
  return nuvemFiscalRequest<Empresa>(
    config,
    `/empresas/${cpf_cnpj.replace(/\D/g, '')}`,
    {
      method: 'PUT',
      body: JSON.stringify(empresa),
    },
    kv
  );
}

/**
 * Remove empresa
 */
export async function removerEmpresa(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  kv?: KVNamespace
): Promise<void> {
  await nuvemFiscalRequest<void>(
    config,
    `/empresas/${cpf_cnpj.replace(/\D/g, '')}`,
    { method: 'DELETE' },
    kv
  );
}

/**
 * Faz upload do certificado digital A1
 */
export async function uploadCertificado(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  certificado: EmpresaCertificado,
  kv?: KVNamespace
): Promise<EmpresaCertificadoInfo> {
  return nuvemFiscalRequest<EmpresaCertificadoInfo>(
    config,
    `/empresas/${cpf_cnpj.replace(/\D/g, '')}/certificado`,
    {
      method: 'PUT',
      body: JSON.stringify(certificado),
    },
    kv
  );
}

/**
 * Consulta informações do certificado digital
 */
export async function consultarCertificado(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  kv?: KVNamespace
): Promise<EmpresaCertificadoInfo | null> {
  try {
    return await nuvemFiscalRequest<EmpresaCertificadoInfo>(
      config,
      `/empresas/${cpf_cnpj.replace(/\D/g, '')}/certificado`,
      { method: 'GET' },
      kv
    );
  } catch (error: any) {
    if (error.status === 404) return null;
    throw error;
  }
}

/**
 * Remove certificado digital
 */
export async function removerCertificado(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  kv?: KVNamespace
): Promise<void> {
  await nuvemFiscalRequest<void>(
    config,
    `/empresas/${cpf_cnpj.replace(/\D/g, '')}/certificado`,
    { method: 'DELETE' },
    kv
  );
}

/**
 * Configura parâmetros de NF-e/NFC-e
 */
export async function configurarNfe(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  configNfe: EmpresaConfigNfe,
  kv?: KVNamespace
): Promise<EmpresaConfigNfe> {
  return nuvemFiscalRequest<EmpresaConfigNfe>(
    config,
    `/empresas/${cpf_cnpj.replace(/\D/g, '')}/nfe`,
    {
      method: 'PUT',
      body: JSON.stringify(configNfe),
    },
    kv
  );
}

/**
 * Consulta configuração de NF-e/NFC-e
 */
export async function consultarConfiguracaoNfe(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  kv?: KVNamespace
): Promise<EmpresaConfigNfe | null> {
  try {
    return await nuvemFiscalRequest<EmpresaConfigNfe>(
      config,
      `/empresas/${cpf_cnpj.replace(/\D/g, '')}/nfe`,
      { method: 'GET' },
      kv
    );
  } catch (error: any) {
    if (error.status === 404) return null;
    throw error;
  }
}

/**
 * Mapeia dados do PLANAC para formato Nuvem Fiscal
 */
export function mapPlanacToNuvemFiscal(empresaPlanac: any): Empresa {
  return {
    cpf_cnpj: empresaPlanac.cnpj || empresaPlanac.cpf,
    inscricao_estadual: empresaPlanac.inscricao_estadual,
    inscricao_municipal: empresaPlanac.inscricao_municipal,
    nome_razao_social: empresaPlanac.razao_social,
    nome_fantasia: empresaPlanac.nome_fantasia,
    fone: empresaPlanac.telefone,
    email: empresaPlanac.email,
    endereco: {
      logradouro: empresaPlanac.logradouro,
      numero: empresaPlanac.numero,
      complemento: empresaPlanac.complemento,
      bairro: empresaPlanac.bairro,
      codigo_municipio: empresaPlanac.codigo_ibge,
      cidade: empresaPlanac.cidade,
      uf: empresaPlanac.uf,
      cep: empresaPlanac.cep?.replace(/\D/g, ''),
      codigo_pais: '1058',
      pais: 'Brasil',
    },
    optante_simples_nacional: empresaPlanac.optante_simples,
    regime_tributacao: empresaPlanac.regime_tributario,
  };
}

/**
 * Mapeia dados da Nuvem Fiscal para formato PLANAC
 */
export function mapNuvemFiscalToPlanac(empresa: Empresa): any {
  return {
    cnpj: empresa.cpf_cnpj.length === 14 ? empresa.cpf_cnpj : null,
    cpf: empresa.cpf_cnpj.length === 11 ? empresa.cpf_cnpj : null,
    inscricao_estadual: empresa.inscricao_estadual,
    inscricao_municipal: empresa.inscricao_municipal,
    razao_social: empresa.nome_razao_social,
    nome_fantasia: empresa.nome_fantasia,
    telefone: empresa.fone,
    email: empresa.email,
    logradouro: empresa.endereco.logradouro,
    numero: empresa.endereco.numero,
    complemento: empresa.endereco.complemento,
    bairro: empresa.endereco.bairro,
    codigo_ibge: empresa.endereco.codigo_municipio,
    cidade: empresa.endereco.cidade,
    uf: empresa.endereco.uf,
    cep: empresa.endereco.cep,
    optante_simples: empresa.optante_simples_nacional,
    regime_tributario: empresa.regime_tributacao,
  };
}

