// =============================================
// PLANAC ERP - Sicoob Service Factory
// Exportações e factory do serviço Sicoob
// =============================================

// Exportar tipos
export * from './types';

// Exportar funções de autenticação
export {
  createSicoobConfig,
  getUrls,
  getAccessToken,
  sicoobRequest,
  sicoobMtlsRequest,
  testConnection,
} from './auth';

// Exportar funções de boleto
export {
  incluirBoleto,
  consultarBoleto,
  listarBoletos,
  baixarBoleto,
  segundaViaBoleto,
  alterarVencimento,
  alterarValor,
  alterarDesconto,
  mapErpToSicoob,
  mapSicoobToErp,
  validarBoleto,
  formatarCpfCnpj,
  formatarCep,
  identificarTipoDocumento,
  getEspecieDescricao,
} from './boleto';

// Exportar funções de webhook
export {
  processWebhook,
  validarAssinaturaWebhook,
  generateTituloUpdate,
  generateRetornoItem,
  isBoletoLiquidado,
  isBoletoBaixado,
  isBoletoEmAberto,
  formatWebhookLogMessage,
  generateWebhookHash,
  shouldProcessWebhook,
} from './webhook';

// Importações para o factory
import { createSicoobConfig, testConnection, sicoobRequest } from './auth';
import {
  incluirBoleto,
  consultarBoleto,
  listarBoletos,
  baixarBoleto,
  segundaViaBoleto,
  alterarVencimento,
  alterarValor,
  alterarDesconto,
  mapErpToSicoob,
  mapSicoobToErp,
  validarBoleto,
} from './boleto';
import {
  processWebhook,
  validarAssinaturaWebhook,
  generateTituloUpdate,
  generateRetornoItem,
  generateWebhookHash,
} from './webhook';
import { SicoobEnv, SicoobConfig, SicoobBoletoInclusao } from './types';

// ===== CONSTANTES =====

/** Código do banco Sicoob */
export const SICOOB_CODIGO_BANCO = '756';

/** Nome do banco */
export const SICOOB_NOME_BANCO = 'Sicoob';

/** Versão da API */
export const SICOOB_API_VERSAO = 'v3';

// ===== FACTORY =====

/**
 * Cria uma instância do serviço Sicoob com todas as funcionalidades
 */
export function createSicoobService(env: SicoobEnv) {
  const config = createSicoobConfig(env);
  const ambiente = config.ambiente;

  return {
    // Configuração
    config,
    ambiente,
    codigoBanco: SICOOB_CODIGO_BANCO,
    nomeBanco: SICOOB_NOME_BANCO,

    // Boleto
    boleto: {
      /**
       * Inclui um novo boleto
       */
      incluir: (boleto: SicoobBoletoInclusao, kvCache?: KVNamespace) =>
        incluirBoleto(config, boleto, kvCache),

      /**
       * Consulta um boleto pelo nosso número
       */
      consultar: (nossoNumero: number, kvCache?: KVNamespace) =>
        consultarBoleto(config, nossoNumero, kvCache),

      /**
       * Lista boletos por período
       */
      listar: (
        filtros: {
          dataInicio: string;
          dataFim: string;
          codigoSituacao?: number;
          paginaAtual?: number;
          itensPorPagina?: number;
        },
        kvCache?: KVNamespace
      ) => listarBoletos(config, filtros, kvCache),

      /**
       * Solicita baixa de um boleto
       */
      baixar: (nossoNumero: number, kvCache?: KVNamespace) =>
        baixarBoleto(config, nossoNumero, kvCache),

      /**
       * Gera segunda via do boleto
       */
      segundaVia: (nossoNumero: number, kvCache?: KVNamespace) =>
        segundaViaBoleto(config, nossoNumero, kvCache),

      /**
       * Altera data de vencimento
       */
      alterarVencimento: (
        nossoNumero: number,
        novaData: string,
        kvCache?: KVNamespace
      ) => alterarVencimento(config, nossoNumero, novaData, kvCache),

      /**
       * Altera valor nominal
       */
      alterarValor: (
        nossoNumero: number,
        novoValor: number,
        kvCache?: KVNamespace
      ) => alterarValor(config, nossoNumero, novoValor, kvCache),

      /**
       * Altera desconto
       */
      alterarDesconto: (
        nossoNumero: number,
        desconto: { tipo: number; data: string; valor: number },
        kvCache?: KVNamespace
      ) => alterarDesconto(config, nossoNumero, desconto, kvCache),

      /**
       * Valida dados do boleto
       */
      validar: validarBoleto,

      /**
       * Mapeia dados do ERP para formato Sicoob
       */
      mapFromErp: mapErpToSicoob,

      /**
       * Mapeia dados do Sicoob para formato ERP
       */
      mapToErp: mapSicoobToErp,
    },

    // Webhook
    webhook: {
      /**
       * Processa payload do webhook
       */
      process: processWebhook,

      /**
       * Valida assinatura do webhook
       */
      validarAssinatura: validarAssinaturaWebhook,

      /**
       * Gera hash para deduplicação
       */
      generateHash: generateWebhookHash,

      /**
       * Gera update para tabela boleto_titulos
       */
      generateTituloUpdate,

      /**
       * Gera item para tabela boleto_retornos_itens
       */
      generateRetornoItem,
    },

    // Utilitários
    utils: {
      /**
       * Testa conexão com a API
       */
      testConnection: (kvCache?: KVNamespace) => testConnection(config, kvCache),
    },
  };
}

// ===== TIPO DO SERVIÇO =====

export type SicoobService = ReturnType<typeof createSicoobService>;
