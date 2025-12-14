// =============================================
// PLANAC ERP - IBPT Types
// Instituto Brasileiro de Planejamento e Tributação
// Lei da Transparência Fiscal (Lei 12.741/2012)
// =============================================

/**
 * Registro da tabela IBPT
 * Cada linha representa as alíquotas de um NCM específico
 */
export interface IBPTRegistro {
  /** Código NCM (8 dígitos) */
  ncm: string;
  
  /** Exceção tarifária (2 dígitos, opcional) */
  ex: string;
  
  /** Tipo: 0=Nacional, 1=Importado */
  tipo: 0 | 1;
  
  /** Descrição do produto/serviço */
  descricao: string;
  
  /** Alíquota Nacional Federal (%) */
  aliquota_nacional_federal: number;
  
  /** Alíquota Importado Federal (%) */
  aliquota_importado_federal: number;
  
  /** Alíquota Estadual (%) */
  aliquota_estadual: number;
  
  /** Alíquota Municipal (%) - para serviços */
  aliquota_municipal: number;
  
  /** Data início vigência */
  vigencia_inicio: string;
  
  /** Data fim vigência */
  vigencia_fim: string;
  
  /** Chave da tabela (ex: "23.1.A") */
  chave: string;
  
  /** Versão da tabela */
  versao: string;
  
  /** Fonte dos dados */
  fonte: string;
}

/**
 * Registro simplificado para NBS (serviços)
 */
export interface IBPTRegistroNBS {
  /** Código NBS (9 dígitos) */
  nbs: string;
  
  /** Descrição do serviço */
  descricao: string;
  
  /** Alíquota Federal (%) */
  aliquota_federal: number;
  
  /** Alíquota Municipal (%) */
  aliquota_municipal: number;
  
  /** Data início vigência */
  vigencia_inicio: string;
  
  /** Data fim vigência */
  vigencia_fim: string;
}

/**
 * Resultado do cálculo de tributos
 */
export interface IBPTCalculoTributos {
  /** Valor do produto/serviço */
  valor_base: number;
  
  /** Origem: 0=Nacional, 1-8=Importado */
  origem: number;
  
  /** Tributos federais */
  tributos_federais: {
    aliquota: number;
    valor: number;
  };
  
  /** Tributos estaduais */
  tributos_estaduais: {
    aliquota: number;
    valor: number;
  };
  
  /** Tributos municipais */
  tributos_municipais: {
    aliquota: number;
    valor: number;
  };
  
  /** Total de tributos */
  total: {
    aliquota: number;
    valor: number;
  };
  
  /** Fonte dos dados */
  fonte: string;
  
  /** Chave da tabela utilizada */
  chave_ibpt: string;
}

/**
 * Metadados da tabela IBPT
 */
export interface IBPTMetadados {
  /** Versão da tabela */
  versao: string;
  
  /** Data de atualização */
  data_atualizacao: string;
  
  /** UF da tabela */
  uf: string;
  
  /** Quantidade de registros */
  total_registros: number;
  
  /** Vigência início */
  vigencia_inicio: string;
  
  /** Vigência fim */
  vigencia_fim: string;
}

/**
 * Configuração do serviço IBPT
 */
export interface IBPTConfig {
  /** Token de acesso à API IBPT (se usar API) */
  token?: string;
  
  /** CNPJ da empresa (para API) */
  cnpj?: string;
  
  /** UF padrão */
  uf: string;
  
  /** Usar cache em KV */
  cache?: KVNamespace;
  
  /** TTL do cache em segundos (default: 86400 = 24h) */
  cache_ttl?: number;
}

/**
 * Parâmetros para busca na tabela
 */
export interface IBPTBuscaParams {
  /** NCM do produto */
  ncm: string;
  
  /** UF do estado */
  uf: string;
  
  /** Exceção tarifária (opcional) */
  ex?: string;
  
  /** Origem: 0=Nacional, 1-8=Importado */
  origem?: number;
}

/**
 * Resposta da API IBPT (quando usar API externa)
 */
export interface IBPTApiResponse {
  Codigo: string;
  UF: string;
  EX: string;
  Descricao: string;
  Nacional: number;
  Estadual: number;
  Importado: number;
  Municipal: number;
  Tipo: string;
  VigenciaInicio: string;
  VigenciaFim: string;
  Chave: string;
  Versao: string;
  Fonte: string;
}

/**
 * Item para cálculo em lote
 */
export interface IBPTItemCalculo {
  /** Identificador do item */
  id: string;
  
  /** NCM do produto */
  ncm: string;
  
  /** Valor do item */
  valor: number;
  
  /** Origem: 0=Nacional, 1-8=Importado */
  origem: number;
  
  /** Exceção tarifária (opcional) */
  ex?: string;
}

/**
 * Resultado do cálculo em lote
 */
export interface IBPTResultadoLote {
  /** Itens calculados */
  itens: Array<IBPTItemCalculo & IBPTCalculoTributos>;
  
  /** Totais consolidados */
  totais: {
    valor_produtos: number;
    tributos_federais: number;
    tributos_estaduais: number;
    tributos_municipais: number;
    tributos_total: number;
    aliquota_media: number;
  };
}

export type { IBPTRegistro as default };
