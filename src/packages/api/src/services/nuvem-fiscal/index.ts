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
export * from './cep';

// CNPJ
export * from './cnpj';

// Empresas
export * from './empresas';

// NF-e
export * from './nfe';

// NFC-e
export * from './nfce';

// NFS-e
export * from './nfse';

// CT-e
export * from './cte';

// MDF-e
export * from './mdfe';

// Distribuição NF-e
export * from './distribuicao';

// ===== FACTORY HELPER =====

import type { NuvemFiscalConfig } from './types';

// CEP imports
import { consultarCep, formatarCep, validarCep } from './cep';

// CNPJ imports
import { 
  consultarCnpj, listarCnpj, 
  formatarCnpj, formatarCpf, 
  validarCnpj, validarCpf, 
  identificarDocumento 
} from './cnpj';

// Empresas imports
import {
  listarEmpresas, buscarEmpresa, cadastrarEmpresa, atualizarEmpresa, removerEmpresa,
  uploadCertificado, consultarCertificado, removerCertificado,
  configurarNfe, consultarConfiguracaoNfe,
  mapPlanacToNuvemFiscal, mapNuvemFiscalToPlanac,
} from './empresas';

// NF-e imports
import {
  emitirNfe, emitirLoteNfe, consultarNfe, listarNfe, 
  consultarStatusSefaz, consultarContribuinte,
  baixarXmlNfe, baixarPdfNfe,
  cancelarNfe, consultarCancelamento,
  emitirCartaCorrecao, listarCartasCorrecao,
  inutilizarNumeracao, listarInutilizacoes,
  enviarEmailNfe,
  gerarPreviaXml, gerarPreviaPdf,
} from './nfe';

// NFC-e imports
import {
  emitirNfce, emitirLoteNfce, consultarNfce, listarNfce,
  consultarStatusSefazNfce,
  baixarXmlNfce, baixarPdfNfce,
  cancelarNfce, consultarCancelamentoNfce,
  inutilizarNumeracaoNfce,
  enviarEmailNfce,
} from './nfce';

// NFS-e imports
import {
  emitirNfse, emitirLoteNfse, consultarNfse, listarNfse,
  listarCidadesNfse,
  baixarXmlNfse, baixarPdfNfse,
  cancelarNfse, consultarCancelamentoNfse,
  enviarEmailNfse,
} from './nfse';

// CT-e imports
import {
  emitirCte, emitirLoteCte, consultarCte, listarCte,
  consultarStatusSefazCte,
  baixarXmlCte, baixarPdfCte,
  cancelarCte, consultarCancelamentoCte,
  emitirCartaCorrecaoCte, listarCartasCorrecaoCte,
  inutilizarNumeracaoCte,
  registrarDesacordoCte,
  enviarEmailCte,
} from './cte';

// MDF-e imports
import {
  emitirMdfe, emitirLoteMdfe, consultarMdfe, listarMdfe,
  consultarMdfeNaoEncerrados, consultarStatusSefazMdfe,
  baixarXmlMdfe, baixarPdfMdfe,
  cancelarMdfe, consultarCancelamentoMdfe,
  encerrarMdfe, consultarEncerramentoMdfe,
  incluirCondutorMdfe, incluirDfeMdfe,
  enviarEmailMdfe,
} from './mdfe';

// Distribuição imports
import {
  gerarDistribuicao, consultarDistribuicao, listarDistribuicoes,
  listarDocumentos, consultarDocumento, baixarXmlDocumento,
  listarNotasSemManifestacao,
  manifestarNota, consultarManifestacao, listarManifestacoes, baixarXmlManifestacao,
  sincronizarNotas, confirmarNotasPendentes,
} from './distribuicao';

/**
 * Cria instância configurada para uso no PLANAC
 * Facilita o uso de todos os serviços com uma única configuração
 */
export function createNuvemFiscalService(env: {
  NUVEM_FISCAL_CLIENT_ID: string;
  NUVEM_FISCAL_CLIENT_SECRET: string;
  NUVEM_FISCAL_AMBIENTE?: 'homologacao' | 'producao';
  NUVEM_FISCAL_TOKEN_CACHE?: KVNamespace;
}) {
  const config: NuvemFiscalConfig = {
    clientId: env.NUVEM_FISCAL_CLIENT_ID,
    clientSecret: env.NUVEM_FISCAL_CLIENT_SECRET,
    ambiente: env.NUVEM_FISCAL_AMBIENTE || 'homologacao',
  };
  
  const kv = env.NUVEM_FISCAL_TOKEN_CACHE;

  return {
    config,
    
    // ===== CEP =====
    cep: {
      consultar: (cep: string) => consultarCep(config, cep, kv),
      formatar: formatarCep,
      validar: validarCep,
    },
    
    // ===== CNPJ =====
    cnpj: {
      consultar: (cnpj: string) => consultarCnpj(config, cnpj, kv),
      listar: (cnae: string, municipio: string, natureza: string, paginacao?: any) => 
        listarCnpj(config, cnae, municipio, natureza, paginacao, kv),
      formatar: formatarCnpj,
      formatarCpf,
      validar: validarCnpj,
      validarCpf,
      identificarDocumento,
    },
    
    // ===== EMPRESAS =====
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
    
    // ===== NF-e =====
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

    // ===== NFC-e =====
    nfce: {
      emitir: (pedido: any) => emitirNfce(config, pedido, kv),
      emitirLote: (pedidos: any[], idLote: string, ambiente: any) =>
        emitirLoteNfce(config, pedidos, idLote, ambiente, kv),
      consultar: (id: string) => consultarNfce(config, id, kv),
      listar: (filtros?: any, paginacao?: any) => listarNfce(config, filtros, paginacao, kv),
      statusSefaz: (cpf_cnpj: string) => consultarStatusSefazNfce(config, cpf_cnpj, kv),
      baixarXml: (id: string) => baixarXmlNfce(config, id, kv),
      baixarPdf: (id: string) => baixarPdfNfce(config, id, kv),
      cancelar: (id: string, justificativa: string) => cancelarNfce(config, id, justificativa, kv),
      consultarCancelamento: (id: string) => consultarCancelamentoNfce(config, id, kv),
      inutilizar: (pedido: any) => inutilizarNumeracaoNfce(config, pedido, kv),
      enviarEmail: (id: string, email: any) => enviarEmailNfce(config, id, email, kv),
    },

    // ===== NFS-e =====
    nfse: {
      emitir: (pedido: any) => emitirNfse(config, pedido, kv),
      emitirLote: (pedidos: any[], idLote: string, ambiente: any) =>
        emitirLoteNfse(config, pedidos, idLote, ambiente, kv),
      consultar: (id: string) => consultarNfse(config, id, kv),
      listar: (filtros?: any, paginacao?: any) => listarNfse(config, filtros, paginacao, kv),
      listarCidades: (uf?: string) => listarCidadesNfse(config, uf, kv),
      baixarXml: (id: string) => baixarXmlNfse(config, id, kv),
      baixarPdf: (id: string) => baixarPdfNfse(config, id, kv),
      cancelar: (id: string, justificativa: string) => cancelarNfse(config, id, justificativa, kv),
      consultarCancelamento: (id: string) => consultarCancelamentoNfse(config, id, kv),
      enviarEmail: (id: string, email: any) => enviarEmailNfse(config, id, email, kv),
    },

    // ===== CT-e =====
    cte: {
      emitir: (pedido: any) => emitirCte(config, pedido, kv),
      emitirLote: (pedidos: any[], idLote: string, ambiente: any) =>
        emitirLoteCte(config, pedidos, idLote, ambiente, kv),
      consultar: (id: string) => consultarCte(config, id, kv),
      listar: (filtros?: any, paginacao?: any) => listarCte(config, filtros, paginacao, kv),
      statusSefaz: (cpf_cnpj: string, autorizador?: string) =>
        consultarStatusSefazCte(config, cpf_cnpj, autorizador, kv),
      baixarXml: (id: string) => baixarXmlCte(config, id, kv),
      baixarPdf: (id: string) => baixarPdfCte(config, id, kv),
      cancelar: (id: string, justificativa: string) => cancelarCte(config, id, justificativa, kv),
      consultarCancelamento: (id: string) => consultarCancelamentoCte(config, id, kv),
      cartaCorrecao: {
        emitir: (id: string, correcoes: any[]) => emitirCartaCorrecaoCte(config, id, correcoes, kv),
        listar: (id: string) => listarCartasCorrecaoCte(config, id, kv),
      },
      inutilizar: (pedido: any) => inutilizarNumeracaoCte(config, pedido, kv),
      registrarDesacordo: (id: string, obs: string) => registrarDesacordoCte(config, id, obs, kv),
      enviarEmail: (id: string, email: any) => enviarEmailCte(config, id, email, kv),
    },

    // ===== MDF-e =====
    mdfe: {
      emitir: (pedido: any) => emitirMdfe(config, pedido, kv),
      emitirLote: (pedidos: any[], idLote: string, ambiente: any) =>
        emitirLoteMdfe(config, pedidos, idLote, ambiente, kv),
      consultar: (id: string) => consultarMdfe(config, id, kv),
      listar: (filtros?: any, paginacao?: any) => listarMdfe(config, filtros, paginacao, kv),
      naoEncerrados: (cpf_cnpj: string) => consultarMdfeNaoEncerrados(config, cpf_cnpj, kv),
      statusSefaz: (cpf_cnpj: string) => consultarStatusSefazMdfe(config, cpf_cnpj, kv),
      baixarXml: (id: string) => baixarXmlMdfe(config, id, kv),
      baixarPdf: (id: string) => baixarPdfMdfe(config, id, kv),
      cancelar: (id: string, justificativa: string) => cancelarMdfe(config, id, justificativa, kv),
      consultarCancelamento: (id: string) => consultarCancelamentoMdfe(config, id, kv),
      encerrar: (id: string, dados: any) => encerrarMdfe(config, id, dados, kv),
      consultarEncerramento: (id: string) => consultarEncerramentoMdfe(config, id, kv),
      incluirCondutor: (id: string, condutor: any) => incluirCondutorMdfe(config, id, condutor, kv),
      incluirDfe: (id: string, dados: any) => incluirDfeMdfe(config, id, dados, kv),
      enviarEmail: (id: string, email: any) => enviarEmailMdfe(config, id, email, kv),
    },

    // ===== DISTRIBUIÇÃO (Notas de Fornecedores) =====
    distribuicao: {
      gerar: (pedido: any) => gerarDistribuicao(config, pedido, kv),
      consultar: (id: string) => consultarDistribuicao(config, id, kv),
      listar: (filtros: any, paginacao?: any) => listarDistribuicoes(config, filtros, paginacao, kv),
      documentos: {
        listar: (filtros: any, paginacao?: any) => listarDocumentos(config, filtros, paginacao, kv),
        consultar: (id: string) => consultarDocumento(config, id, kv),
        baixarXml: (id: string) => baixarXmlDocumento(config, id, kv),
      },
      notasSemManifestacao: (filtros: any, paginacao?: any) => 
        listarNotasSemManifestacao(config, filtros, paginacao, kv),
      manifestar: (dados: any) => manifestarNota(config, dados, kv),
      manifestacoes: {
        consultar: (id: string) => consultarManifestacao(config, id, kv),
        listar: (filtros: any, paginacao?: any) => listarManifestacoes(config, filtros, paginacao, kv),
        baixarXml: (id: string) => baixarXmlManifestacao(config, id, kv),
      },
      // Helpers
      sincronizar: (cpf_cnpj: string, ambiente: any, ultimo_nsu?: number, onProgress?: any) =>
        sincronizarNotas(config, cpf_cnpj, ambiente, ultimo_nsu, kv, onProgress),
      confirmarPendentes: (cpf_cnpj: string, ambiente: any) =>
        confirmarNotasPendentes(config, cpf_cnpj, ambiente, kv),
    },

    // ===== UTILITÁRIOS =====
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
