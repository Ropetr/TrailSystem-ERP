// =============================================
// PLANAC ERP - Banco Safra Service Factory
// Exportações e factory do serviço Safra
// =============================================

// Exportar tipos
export * from './types';

// Exportar funções de autenticação
export {
  createSafraConfig,
  getUrls,
  getAccessToken,
  safraRequest,
  safraMtlsRequest,
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
  mapErpToSafra,
  mapSafraToErp,
  validarBoleto,
  formatarCpfCnpj,
  formatarCep,
  identificarTipoDocumento,
  getEspecieDescricao,
  gerarNossoNumero,
} from './boleto';

// Exportar funções de webhook
export {
  processWebhook,
  validarAssinaturaWebhook,
  generateTituloUpdate,
  generateRetornoItem,
  isBoletoLiquidado,
  isBoletoBaixado,
  isBoletoRejeitado,
  isBoletoEmCartorio,
  getSituacaoDescricao,
  formatWebhookLogMessage,
  generateWebhookHash,
  shouldProcessWebhook,
} from './webhook';

// Importações para o factory
import { createSafraConfig, testConnection } from './auth';
import {
  registrarBoleto,
  consultarBoleto,
  listarBoletos,
  baixarBoleto,
  alterarVencimento,
  alterarAbatimento,
  protestarBoleto,
  mapErpToSafra,
  mapSafraToErp,
  validarBoleto,
  gerarNossoNumero,
} from './boleto';
import {
  processWebhook,
  validarAssinaturaWebhook,
  generateTituloUpdate,
  generateRetornoItem,
  generateWebhookHash,
} from './webhook';
import { SafraEnv, SafraConfig, SafraBoletoRegistro } from './types';

// ===== CONSTANTES =====

/** Código do banco */
export const SAFRA_CODIGO_BANCO = '422';

/** Nome do banco */
export const SAFRA_NOME_BANCO = 'Banco Safra';

/** Versão da API */
export const SAFRA_API_VERSAO = 'v1';

// ===== FACTORY =====

/**
 * Cria uma instância do serviço Safra com todas as funcionalidades
 */
export function createSafraService(env: SafraEnv) {
  const config = createSafraConfig(env);
  const ambiente = config.ambiente;

  return {
    // Configuração
    config,
    ambiente,
    codigoBanco: SAFRA_CODIGO_BANCO,
    nomeBanco: SAFRA_NOME_BANCO,

    // Boleto
    boleto: {
      /**
       * Registra um novo boleto
       */
      registrar: (boleto: SafraBoletoRegistro, kvCache?: KVNamespace) =>
        registrarBoleto(config, boleto, kvCache),

      /**
       * Consulta um boleto pelo nosso número
       */
      consultar: (nossoNumero: string, kvCache?: KVNamespace) =>
        consultarBoleto(config, nossoNumero, kvCache),

      /**
       * Lista boletos por período
       */
      listar: (
        filtros: {
          dataInicio: string;
          dataFim: string;
          situacao?: string;
          pagina?: number;
          tamanhoPagina?: number;
        },
        kvCache?: KVNamespace
      ) => listarBoletos(config, filtros, kvCache),

      /**
       * Solicita baixa de um boleto
       */
      baixar: (nossoNumero: string, kvCache?: KVNamespace) =>
        baixarBoleto(config, nossoNumero, kvCache),

      /**
       * Altera data de vencimento
       */
      alterarVencimento: (
        nossoNumero: string,
        novaData: string,
        kvCache?: KVNamespace
      ) => alterarVencimento(config, nossoNumero, novaData, kvCache),

      /**
       * Altera valor de abatimento
       */
      alterarAbatimento: (
        nossoNumero: string,
        valorAbatimento: number,
        kvCache?: KVNamespace
      ) => alterarAbatimento(config, nossoNumero, valorAbatimento, kvCache),

      /**
       * Protestar boleto
       */
      protestar: (
        nossoNumero: string,
        diasProtesto: number,
        kvCache?: KVNamespace
      ) => protestarBoleto(config, nossoNumero, diasProtesto, kvCache),

      /**
       * Valida dados do boleto
       */
      validar: validarBoleto,

      /**
       * Mapeia dados do ERP para formato Safra
       */
      mapFromErp: mapErpToSafra,

      /**
       * Mapeia dados do Safra para formato ERP
       */
      mapToErp: mapSafraToErp,

      /**
       * Gera nosso número no formato Safra
       */
      gerarNossoNumero,
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

export type SafraService = ReturnType<typeof createSafraService>;
