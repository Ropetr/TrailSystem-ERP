// =============================================
// PLANAC ERP - Banco do Brasil Service Factory
// Exportações e factory do serviço BB
// =============================================

// Exportar tipos
export * from './types';

// Exportar funções de autenticação
export {
  createBancoBrasilConfig,
  getUrls,
  getAccessToken,
  bbRequest,
  bbMtlsRequest,
  testConnection,
} from './auth';

// Exportar funções de boleto
export {
  registrarBoleto,
  consultarBoleto,
  listarBoletos,
  baixarBoleto,
  alterarVencimento,
  alterarAbatimento,
  protestarBoleto,
  mapErpToBB,
  mapBBToErp,
  validarBoleto,
  formatarCpfCnpj,
  formatarCep,
  identificarTipoDocumento,
  getTipoTituloDescricao,
  formatarDataBB,
  converterDataBB,
} from './boleto';

// Exportar funções de webhook
export {
  processWebhook,
  validarAssinaturaWebhook,
  generateTituloUpdate,
  generateRetornoItem,
  isBoletoLiquidado,
  isBoletoBaixado,
  getEstadoDescricao,
  formatWebhookLogMessage,
  generateWebhookHash,
  shouldProcessWebhook,
} from './webhook';

// Importações para o factory
import { createBancoBrasilConfig, testConnection } from './auth';
import {
  registrarBoleto,
  consultarBoleto,
  listarBoletos,
  baixarBoleto,
  alterarVencimento,
  alterarAbatimento,
  protestarBoleto,
  mapErpToBB,
  mapBBToErp,
  validarBoleto,
} from './boleto';
import {
  processWebhook,
  validarAssinaturaWebhook,
  generateTituloUpdate,
  generateRetornoItem,
  generateWebhookHash,
} from './webhook';
import { BancoBrasilEnv, BancoBrasilConfig, BBBoletoRegistro } from './types';

// ===== CONSTANTES =====

/** Código do banco */
export const BB_CODIGO_BANCO = '001';

/** Nome do banco */
export const BB_NOME_BANCO = 'Banco do Brasil';

/** Versão da API */
export const BB_API_VERSAO = 'v2';

// ===== FACTORY =====

/**
 * Cria uma instância do serviço Banco do Brasil com todas as funcionalidades
 */
export function createBancoBrasilService(env: BancoBrasilEnv) {
  const config = createBancoBrasilConfig(env);
  const ambiente = config.ambiente;

  return {
    // Configuração
    config,
    ambiente,
    codigoBanco: BB_CODIGO_BANCO,
    nomeBanco: BB_NOME_BANCO,

    // Boleto
    boleto: {
      /**
       * Registra um novo boleto
       */
      registrar: (boleto: BBBoletoRegistro, kvCache?: KVNamespace) =>
        registrarBoleto(config, boleto, kvCache),

      /**
       * Consulta um boleto pelo número
       */
      consultar: (numeroBoleto: string, kvCache?: KVNamespace) =>
        consultarBoleto(config, numeroBoleto, kvCache),

      /**
       * Lista boletos por período
       */
      listar: (
        filtros: {
          indicadorSituacao: 'A' | 'B';
          dataInicioVencimento?: string;
          dataFimVencimento?: string;
          dataInicioRegistro?: string;
          dataFimRegistro?: string;
          codigoEstadoTituloCobranca?: number;
          indice?: number;
        },
        kvCache?: KVNamespace
      ) => listarBoletos(config, filtros, kvCache),

      /**
       * Solicita baixa de um boleto
       */
      baixar: (numeroBoleto: string, kvCache?: KVNamespace) =>
        baixarBoleto(config, numeroBoleto, kvCache),

      /**
       * Altera data de vencimento
       */
      alterarVencimento: (
        numeroBoleto: string,
        novaData: string,
        kvCache?: KVNamespace
      ) => alterarVencimento(config, numeroBoleto, novaData, kvCache),

      /**
       * Altera valor de abatimento
       */
      alterarAbatimento: (
        numeroBoleto: string,
        valorAbatimento: number,
        kvCache?: KVNamespace
      ) => alterarAbatimento(config, numeroBoleto, valorAbatimento, kvCache),

      /**
       * Protestar boleto
       */
      protestar: (
        numeroBoleto: string,
        diasProtesto: number,
        kvCache?: KVNamespace
      ) => protestarBoleto(config, numeroBoleto, diasProtesto, kvCache),

      /**
       * Valida dados do boleto
       */
      validar: validarBoleto,

      /**
       * Mapeia dados do ERP para formato BB
       */
      mapFromErp: mapErpToBB,

      /**
       * Mapeia dados do BB para formato ERP
       */
      mapToErp: mapBBToErp,
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

export type BancoBrasilService = ReturnType<typeof createBancoBrasilService>;
