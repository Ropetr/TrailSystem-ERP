// =============================================
// PLANAC ERP - Caixa Econômica Federal Service Factory
// Exportações e factory do serviço Caixa
// =============================================

// Exportar tipos
export * from './types';

// Exportar funções de autenticação
export {
  createCaixaConfig,
  getUrls,
  getAccessToken,
  caixaRequest,
  caixaMtlsRequest,
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
  mapErpToCaixa,
  mapCaixaToErp,
  validarBoleto,
  formatarCpfCnpj,
  formatarCep,
  identificarTipoDocumento,
  getEspecieDescricao,
  gerarNossoNumero,
  calcularDigitoNossoNumero,
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
  getSituacaoDescricao,
  formatWebhookLogMessage,
  generateWebhookHash,
  shouldProcessWebhook,
} from './webhook';

// Importações para o factory
import { createCaixaConfig, testConnection } from './auth';
import {
  registrarBoleto,
  consultarBoleto,
  listarBoletos,
  baixarBoleto,
  alterarVencimento,
  alterarAbatimento,
  mapErpToCaixa,
  mapCaixaToErp,
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
import { CaixaEnv, CaixaConfig, CaixaBoletoRegistro } from './types';

// ===== CONSTANTES =====

/** Código do banco */
export const CAIXA_CODIGO_BANCO = '104';

/** Nome do banco */
export const CAIXA_NOME_BANCO = 'Caixa Econômica Federal';

/** Versão da API */
export const CAIXA_API_VERSAO = 'v2';

// ===== FACTORY =====

/**
 * Cria uma instância do serviço Caixa com todas as funcionalidades
 */
export function createCaixaService(env: CaixaEnv) {
  const config = createCaixaConfig(env);
  const ambiente = config.ambiente;

  return {
    // Configuração
    config,
    ambiente,
    codigoBanco: CAIXA_CODIGO_BANCO,
    nomeBanco: CAIXA_NOME_BANCO,

    // Boleto
    boleto: {
      /**
       * Registra um novo boleto
       */
      registrar: (boleto: CaixaBoletoRegistro, kvCache?: KVNamespace) =>
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
       * Valida dados do boleto
       */
      validar: validarBoleto,

      /**
       * Mapeia dados do ERP para formato Caixa
       */
      mapFromErp: mapErpToCaixa,

      /**
       * Mapeia dados da Caixa para formato ERP
       */
      mapToErp: mapCaixaToErp,

      /**
       * Gera nosso número no formato Caixa
       */
      gerarNossoNumero: (sequencial: number) =>
        gerarNossoNumero(config.codigoBeneficiario, sequencial),
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

export type CaixaService = ReturnType<typeof createCaixaService>;
