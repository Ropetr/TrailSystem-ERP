// =============================================
// PLANAC ERP - Sisprime Service
// Integração com API Sisprime/CobExpress para boletos bancários
// =============================================
// 
// Este módulo fornece integração completa com o Sisprime (Banco 084)
// para registro e gestão de boletos bancários via API REST.
//
// Funcionalidades:
// - Registro de boletos via API (enviar-boleto)
// - Consulta de boletos (consultar-boleto)
// - Processamento de webhooks (atualizações em tempo real)
// - PIX no boleto (QR Code)
//
// Autenticação:
// - JWT com algoritmo HS512
// - Duas chaves: geral (para assinatura) e conta (no payload)
// - Token válido por 10 minutos
//
// Webhooks:
// - Criptografados com AES-256-CBC
// - Formato: IV::ENCRYPTED_DATA
// - Contém: dados_titulo, lancamentos, emails
//
// =============================================

// ===== TIPOS =====
export type {
  SisprimeConfig,
  SisprimeEnv,
  SisprimeDadosCooperado,
  SisprimeTituloEnvio,
  SisprimeEnviarBoletoRequest,
  SisprimeEnviarBoletoResponse,
  SisprimeConsultarBoletoRequest,
  SisprimeConsultarBoletoResponse,
  SisprimeTituloConsulta,
  SisprimeWebhookPayload,
  SisprimeWebhookTitulo,
  SisprimeWebhookLancamento,
  SisprimeWebhookEmail,
  SisprimeError,
} from './types';

export {
  SISPRIME_SITUACOES,
  SISPRIME_OCORRENCIAS_RETORNO,
  SISPRIME_MOTIVOS_REJEICAO,
  getSituacaoDescricao,
  getOcorrenciaDescricao,
  getMotivoDescricao,
} from './types';

// ===== AUTH =====
export {
  createSisprimeConfig,
  getBaseUrl,
  generateJwtToken,
  sisprimeRequest,
  testConnection,
  URL_HOMOLOGACAO,
  URL_PRODUCAO,
} from './auth';

// ===== BOLETO =====
export {
  enviarBoleto,
  consultarBoleto,
  formatarCpfCnpj,
  formatarCep,
  identificarTipoDocumento,
  mapErpToSisprime,
  mapSisprimeToErp,
  gerarNossoNumero,
  validarTitulo,
} from './boleto';

// ===== CRYPTO =====
export {
  decryptWebhookPayload,
  encryptData,
  generateHash,
  isValidUuid,
  generateUuid,
} from './crypto';

// ===== WEBHOOK =====
export type {
  WebhookProcessResult,
  WebhookConfig,
} from './webhook';

export {
  processWebhook,
  processTituloData,
  processLancamentoData,
  generateTituloUpdate,
  generateRetornoItem,
  shouldProcessWebhook,
  extractPixInfo,
  isTituloLiquidado,
  isTituloRejeitado,
  formatWebhookLogMessage,
} from './webhook';

// ===== FACTORY =====

import type { SisprimeConfig, SisprimeEnv, SisprimeTituloEnvio } from './types';
import { createSisprimeConfig, testConnection, getBaseUrl } from './auth';
import { enviarBoleto, consultarBoleto, mapErpToSisprime, mapSisprimeToErp, validarTitulo, gerarNossoNumero } from './boleto';
import { processWebhook, generateTituloUpdate, generateRetornoItem, isTituloLiquidado, isTituloRejeitado } from './webhook';
import { decryptWebhookPayload, generateHash } from './crypto';

/**
 * Cria instância do serviço Sisprime com todas as funcionalidades
 * 
 * @param env - Variáveis de ambiente com credenciais Sisprime
 * @returns Objeto com todos os métodos do serviço
 * 
 * @example
 * ```typescript
 * const sisprime = createSisprimeService({
 *   SISPRIME_CHAVE_ACESSO_GERAL: 'f096f110d687f999537b70c8d4d11ec8',
 *   SISPRIME_CHAVE_ACESSO_CONTA: '0e20e34b76e4ddbe0997e9731562e026',
 *   SISPRIME_AMBIENTE: 'homologacao',
 * });
 * 
 * // Registrar boleto
 * const response = await sisprime.boleto.enviar({
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
 * // Consultar boleto
 * const consulta = await sisprime.boleto.consultar('id-boleto-123');
 * 
 * // Processar webhook
 * const webhookResult = await sisprime.webhook.process(encryptedPayload, {
 *   symmetricKey: 'uuid-key',
 *   empresaId: 'empresa-123',
 *   contaId: 'conta-456',
 * });
 * ```
 */
export function createSisprimeService(env: SisprimeEnv) {
  const config: SisprimeConfig = createSisprimeConfig(env);
  
  return {
    // Configuração
    config,
    ambiente: config.ambiente,
    baseUrl: getBaseUrl(config.ambiente),
    
    // Boleto
    boleto: {
      /**
       * Registra um novo boleto no Sisprime
       */
      enviar: (titulo: SisprimeTituloEnvio) => enviarBoleto(config, titulo),
      
      /**
       * Consulta um boleto pelo ID
       */
      consultar: (idBoleto: string) => consultarBoleto(config, idBoleto),
      
      /**
       * Valida dados do título antes de enviar
       */
      validar: validarTitulo,
      
      /**
       * Gera próximo nosso número
       */
      gerarNossoNumero,
      
      /**
       * Converte dados do ERP para formato Sisprime
       */
      mapFromErp: mapErpToSisprime,
      
      /**
       * Converte dados do Sisprime para formato ERP
       */
      mapToErp: mapSisprimeToErp,
    },
    
    // Webhook
    webhook: {
      /**
       * Processa webhook criptografado
       */
      process: processWebhook,
      
      /**
       * Decripta payload do webhook
       */
      decrypt: decryptWebhookPayload,
      
      /**
       * Gera hash para deduplicação
       */
      generateHash,
      
      /**
       * Gera dados para atualização do título
       */
      generateTituloUpdate,
      
      /**
       * Gera dados para item de retorno
       */
      generateRetornoItem,
      
      /**
       * Verifica se título foi liquidado
       */
      isTituloLiquidado,
      
      /**
       * Verifica se título foi rejeitado
       */
      isTituloRejeitado,
    },
    
    // Utilitários
    utils: {
      /**
       * Testa conexão com a API
       */
      testConnection: () => testConnection(config),
    },
  };
}

// ===== CONSTANTES =====

/** Código FEBRABAN do Sisprime */
export const SISPRIME_CODIGO_BANCO = '084';

/** Nome do banco */
export const SISPRIME_NOME_BANCO = 'Sisprime do Brasil';

/** Nome curto */
export const SISPRIME_NOME_CURTO = 'Sisprime';

/** Dados padrão do banco para seed */
export const SISPRIME_BANCO_SEED = {
  codigo: SISPRIME_CODIGO_BANCO,
  nome: SISPRIME_NOME_BANCO,
  nome_curto: SISPRIME_NOME_CURTO,
  suporta_api: 1,
  suporta_cnab240: 1,
  suporta_cnab400: 1,
  url_homologacao: 'https://homologa-ws.cobexpress.com.br/webservice',
  url_producao: 'https://sisprimebr.cobexpress.com.br/webservice',
  ativo: 1,
};
