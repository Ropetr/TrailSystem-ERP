// =============================================
// PLANAC ERP - Nuvem Fiscal Integration
// Exporta todos os services e tipos
// =============================================

// Types
export * from './types';

// Auth
export {
  createNuvemFiscalConfig,
  getBaseUrl,
  getAccessToken,
  getAccessTokenWithKV,
  nuvemFiscalRequest,
  testConnection,
  clearTokenCache,
  AUTH_URL,
  API_URL_SANDBOX,
  API_URL_PRODUCAO,
  SCOPES,
} from './auth';

// CEP
export {
  consultarCep,
  formatarCep,
  validarCep,
} from './cep';

// CNPJ
export {
  consultarCnpj,
  listarCnpj,
  formatarCnpj,
  formatarCpf,
  validarCnpj,
  validarCpf,
  identificarDocumento,
} from './cnpj';

// Empresas
export {
  listarEmpresas,
  buscarEmpresa,
  cadastrarEmpresa,
  atualizarEmpresa,
  removerEmpresa,
  uploadCertificado,
  consultarCertificado,
  removerCertificado,
  configurarNfe,
  consultarConfiguracaoNfe,
  mapPlanacToNuvemFiscal,
  mapNuvemFiscalToPlanac,
} from './empresas';

// NF-e
export {
  // Emissão
  emitirNfe,
  emitirLoteNfe,
  // Consultas
  consultarNfe,
  listarNfe,
  consultarStatusSefaz,
  consultarContribuinte,
  // Downloads
  baixarXmlNfe,
  baixarPdfNfe,
  // Cancelamento
  cancelarNfe,
  consultarCancelamento,
  baixarXmlCancelamento,
  baixarPdfCancelamento,
  // Carta de Correção
  emitirCartaCorrecao,
  listarCartasCorrecao,
  baixarXmlCartaCorrecao,
  baixarPdfCartaCorrecao,
  // Inutilização
  inutilizarNumeracao,
  listarInutilizacoes,
  consultarInutilizacao,
  baixarXmlInutilizacao,
  // Email
  enviarEmailNfe,
  // Prévia
  gerarPreviaXml,
  gerarPreviaPdf,
} from './nfe';

// ===== HELPERS =====

/**
 * Cria instância configurada para uso no PLANAC
 */
export function createNuvemFiscalService(env: {
  NUVEM_FISCAL_CLIENT_ID: string;
  NUVEM_FISCAL_CLIENT_SECRET: string;
  NUVEM_FISCAL_AMBIENTE?: 'homologacao' | 'producao';
  NUVEM_FISCAL_TOKEN_CACHE?: KVNamespace;
}) {
  const config = {
    clientId: env.NUVEM_FISCAL_CLIENT_ID,
    clientSecret: env.NUVEM_FISCAL_CLIENT_SECRET,
    ambiente: env.NUVEM_FISCAL_AMBIENTE || 'homologacao' as const,
  };
  
  const kv = env.NUVEM_FISCAL_TOKEN_CACHE;

  return {
    config,
    
    // CEP
    cep: {
      consultar: (cep: string) => consultarCep(config, cep, kv),
    },
    
    // CNPJ
    cnpj: {
      consultar: (cnpj: string) => consultarCnpj(config, cnpj, kv),
      listar: (cnae: string, municipio: string, natureza: string, paginacao?: any) => 
        listarCnpj(config, cnae, municipio, natureza, paginacao, kv),
    },
    
    // Empresas
    empresas: {
      listar: (paginacao?: any, cpf_cnpj?: string) => listarEmpresas(config, paginacao, cpf_cnpj, kv),
      buscar: (cpf_cnpj: string) => buscarEmpresa(config, cpf_cnpj, kv),
      cadastrar: (empresa: any) => cadastrarEmpresa(config, empresa, kv),
      atualizar: (cpf_cnpj: string, empresa: any) => atualizarEmpresa(config, cpf_cnpj, empresa, kv),
      remover: (cpf_cnpj: string) => removerEmpresa(config, cpf_cnpj, kv),
      certificado: {
        upload: (cpf_cnpj: string, cert: any) => uploadCertificado(config, cpf_cnpj, cert, kv),
        consultar: (cpf_cnpj: string) => consultarCertificado(config, cpf_cnpj, kv),
        remover: (cpf_cnpj: string) => removerCertificado(config, cpf_cnpj, kv),
      },
      configNfe: {
        alterar: (cpf_cnpj: string, configNfe: any) => configurarNfe(config, cpf_cnpj, configNfe, kv),
        consultar: (cpf_cnpj: string) => consultarConfiguracaoNfe(config, cpf_cnpj, kv),
      },
    },
    
    // NF-e
    nfe: {
      emitir: (pedido: any) => emitirNfe(config, pedido, kv),
      emitirLote: (pedidos: any[], idLote: string, ambiente: any) => 
        emitirLoteNfe(config, pedidos, idLote, ambiente, kv),
      consultar: (id: string) => consultarNfe(config, id, kv),
      listar: (filtros?: any, paginacao?: any) => listarNfe(config, filtros, paginacao, kv),
      statusSefaz: (cpf_cnpj: string, autorizador?: string) => 
        consultarStatusSefaz(config, cpf_cnpj, autorizador, kv),
      consultarContribuinte: (cpf_cnpj: string, doc: string, arg: any, uf?: string) =>
        consultarContribuinte(config, cpf_cnpj, doc, arg, uf, kv),
      baixarXml: (id: string) => baixarXmlNfe(config, id, kv),
      baixarPdf: (id: string, opcoes?: any) => baixarPdfNfe(config, id, opcoes, kv),
      cancelar: (id: string, justificativa: string) => cancelarNfe(config, id, justificativa, kv),
      consultarCancelamento: (id: string) => consultarCancelamento(config, id, kv),
      cartaCorrecao: {
        emitir: (id: string, correcao: string) => emitirCartaCorrecao(config, id, correcao, kv),
        listar: (id: string) => listarCartasCorrecao(config, id, kv),
        baixarXml: (idEvento: string) => baixarXmlCartaCorrecao(config, idEvento, kv),
        baixarPdf: (idEvento: string) => baixarPdfCartaCorrecao(config, idEvento, kv),
      },
      inutilizar: (pedido: any) => inutilizarNumeracao(config, pedido, kv),
      listarInutilizacoes: (cpf_cnpj: string, ambiente?: any, paginacao?: any) =>
        listarInutilizacoes(config, cpf_cnpj, ambiente, paginacao, kv),
      enviarEmail: (id: string, email: any) => enviarEmailNfe(config, id, email, kv),
      previa: {
        xml: (pedido: any) => gerarPreviaXml(config, pedido, kv),
        pdf: (pedido: any) => gerarPreviaPdf(config, pedido, kv),
      },
    },

    // Utilitários
    utils: {
      formatarCep,
      formatarCnpj,
      formatarCpf,
      validarCep,
      validarCnpj,
      validarCpf,
      identificarDocumento,
      mapPlanacToNuvemFiscal,
      mapNuvemFiscalToPlanac,
    },
  };
}

// Re-exportar importações necessárias para os tipos do helper
import { 
  consultarCep, formatarCep, validarCep,
  consultarCnpj, listarCnpj, formatarCnpj, formatarCpf, validarCnpj, validarCpf, identificarDocumento,
  listarEmpresas, buscarEmpresa, cadastrarEmpresa, atualizarEmpresa, removerEmpresa,
  uploadCertificado, consultarCertificado, removerCertificado,
  configurarNfe, consultarConfiguracaoNfe,
  mapPlanacToNuvemFiscal, mapNuvemFiscalToPlanac,
  emitirNfe, emitirLoteNfe, consultarNfe, listarNfe, consultarStatusSefaz, consultarContribuinte,
  baixarXmlNfe, baixarPdfNfe,
  cancelarNfe, consultarCancelamento, baixarXmlCancelamento, baixarPdfCancelamento,
  emitirCartaCorrecao, listarCartasCorrecao, baixarXmlCartaCorrecao, baixarPdfCartaCorrecao,
  inutilizarNumeracao, listarInutilizacoes, consultarInutilizacao, baixarXmlInutilizacao,
  enviarEmailNfe,
  gerarPreviaXml, gerarPreviaPdf
} from './nfe';
