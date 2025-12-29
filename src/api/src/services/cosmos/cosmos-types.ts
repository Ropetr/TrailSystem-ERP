// =============================================
// PLANAC ERP - Cosmos/Bluesoft Types
// Cadastro automático de produtos via GTIN
// =============================================

/**
 * Configuração do serviço Cosmos
 */
export interface CosmosConfig {
  /** Token de acesso à API Cosmos */
  token: string;
  
  /** Ambiente: producao ou sandbox */
  ambiente: 'producao' | 'sandbox';
  
  /** TTL do cache em segundos (default: 604800 = 7 dias) */
  cache_ttl?: number;
  
  /** Limite de consultas por dia */
  limite_consultas_dia?: number;
  
  /** Auto-enriquecer cadastro ao buscar */
  auto_enriquecer?: boolean;
  
  /** Sobrescrever dados manuais */
  sobrescrever_dados_manuais?: boolean;
  
  /** Campos a preencher automaticamente */
  preencher_descricao?: boolean;
  preencher_ncm?: boolean;
  preencher_cest?: boolean;
  preencher_marca?: boolean;
  preencher_categoria?: boolean;
  preencher_peso?: boolean;
  preencher_dimensoes?: boolean;
  preencher_imagem?: boolean;
}

/**
 * Resposta da API Cosmos para um produto
 */
export interface CosmosProduto {
  /** GTIN/EAN do produto */
  gtin: number;
  
  /** Descrição do produto */
  description: string;
  
  /** Descrição curta */
  short_description?: string;
  
  /** Largura em cm */
  width?: number;
  
  /** Altura em cm */
  height?: number;
  
  /** Profundidade em cm */
  depth?: number;
  
  /** Peso bruto em kg */
  gross_weight?: number;
  
  /** Peso líquido em kg */
  net_weight?: number;
  
  /** Conteúdo líquido */
  net_content?: number;
  
  /** Unidade do conteúdo */
  net_content_unit?: string;
  
  /** URL da imagem */
  thumbnail?: string;
  
  /** Data de criação */
  created_at?: string;
  
  /** Data de atualização */
  updated_at?: string;
  
  /** Preço médio */
  avg_price?: number;
  
  /** Preço máximo */
  max_price?: number;
  
  /** Preço mínimo */
  min_price?: number;
  
  /** Marca */
  brand?: CosmosBrand;
  
  /** Categoria */
  gpc?: CosmosGpc;
  
  /** NCM */
  ncm?: CosmosNcm;
  
  /** CEST */
  cest?: CosmosCest;
  
  /** GTINs alternativos */
  gtins?: CosmosGtinAlternativo[];
  
  /** Origem do produto */
  origin?: string;
  
  /** País de origem */
  country?: string;
}

/**
 * Marca do produto
 */
export interface CosmosBrand {
  /** ID da marca */
  id: number;
  
  /** Nome da marca */
  name: string;
  
  /** URL do logo */
  picture?: string;
}

/**
 * Categoria GPC (Global Product Classification)
 */
export interface CosmosGpc {
  /** Código GPC */
  code: string;
  
  /** Descrição */
  description: string;
}

/**
 * NCM do produto
 */
export interface CosmosNcm {
  /** Código NCM */
  code: string;
  
  /** Descrição */
  description: string;
  
  /** Descrição completa */
  full_description?: string;
  
  /** Exceção tarifária */
  ex?: string;
}

/**
 * CEST do produto
 */
export interface CosmosCest {
  /** Código CEST */
  code: string;
  
  /** Descrição */
  description: string;
  
  /** Segmento */
  segment?: string;
}

/**
 * GTIN alternativo
 */
export interface CosmosGtinAlternativo {
  /** GTIN */
  gtin: number;
  
  /** Tipo (comercial, logístico, etc) */
  commercial_unit?: {
    type_packaging?: string;
    quantity_packaging?: number;
  };
}

/**
 * Resultado da busca por GTIN
 */
export interface CosmosBuscaResultado {
  /** Produto encontrado */
  produto: CosmosProduto | null;
  
  /** Se veio do cache */
  cache_hit: boolean;
  
  /** Tempo de resposta em ms */
  tempo_resposta_ms: number;
  
  /** Status da busca */
  status: 'encontrado' | 'nao_encontrado' | 'erro';
  
  /** Mensagem de erro (se houver) */
  erro?: string;
}

/**
 * Dados para enriquecer um produto
 */
export interface CosmosEnriquecimento {
  /** Descrição */
  descricao?: string;
  
  /** NCM */
  ncm?: string;
  
  /** CEST */
  cest?: string;
  
  /** Marca */
  marca?: string;
  
  /** Categoria sugerida */
  categoria_sugerida?: string;
  
  /** Peso líquido em kg */
  peso_liquido?: number;
  
  /** Peso bruto em kg */
  peso_bruto?: number;
  
  /** Largura em cm */
  largura?: number;
  
  /** Altura em cm */
  altura?: number;
  
  /** Profundidade em cm */
  profundidade?: number;
  
  /** URL da imagem */
  imagem_url?: string;
  
  /** Preço médio de mercado */
  preco_medio?: number;
  
  /** Preço mínimo de mercado */
  preco_minimo?: number;
  
  /** Preço máximo de mercado */
  preco_maximo?: number;
  
  /** Origem do dado */
  origem: 'cosmos' | 'nfe' | 'manual';
  
  /** Data da consulta */
  consultado_em: string;
}

/**
 * Estatísticas de uso da API
 */
export interface CosmosEstatisticas {
  /** Consultas hoje */
  consultas_hoje: number;
  
  /** Consultas no mês */
  consultas_mes: number;
  
  /** Cache hits hoje */
  cache_hits_hoje: number;
  
  /** Taxa de cache hit */
  taxa_cache_hit: number;
  
  /** Limite diário */
  limite_diario: number;
  
  /** Consultas restantes hoje */
  consultas_restantes: number;
}

/**
 * Job de sincronização em lote
 */
export interface CosmosSyncJob {
  /** ID do job */
  id: string;
  
  /** Empresa ID */
  empresa_id: string;
  
  /** Tipo do job */
  tipo: 'enriquecimento_lote' | 'atualizacao_cache' | 'importacao_nfe';
  
  /** Status */
  status: 'pendente' | 'processando' | 'concluido' | 'erro' | 'cancelado';
  
  /** Total de itens */
  total_itens: number;
  
  /** Itens processados */
  itens_processados: number;
  
  /** Itens com sucesso */
  itens_sucesso: number;
  
  /** Itens com erro */
  itens_erro: number;
  
  /** Itens do cache */
  itens_cache_hit: number;
  
  /** Data de início */
  iniciado_em?: string;
  
  /** Data de conclusão */
  concluido_em?: string;
  
  /** Erros */
  erros?: string;
}

/**
 * Vínculo produto interno ↔ Cosmos
 */
export interface CosmosProductLink {
  /** ID do vínculo */
  id: string;
  
  /** Empresa ID */
  empresa_id: string;
  
  /** Produto ID interno */
  produto_id: string;
  
  /** GTIN principal */
  gtin_principal: string;
  
  /** GTINs alternativos (JSON) */
  gtins_alternativos?: string;
  
  /** Origem de cada campo */
  origem_descricao?: 'cosmos' | 'nfe' | 'manual';
  origem_ncm?: 'cosmos' | 'nfe' | 'manual';
  origem_cest?: 'cosmos' | 'nfe' | 'manual';
  origem_marca?: 'cosmos' | 'nfe' | 'manual';
  origem_peso?: 'cosmos' | 'nfe' | 'manual';
  origem_dimensoes?: 'cosmos' | 'nfe' | 'manual';
  origem_imagem?: 'cosmos' | 'nfe' | 'manual';
  
  /** Última sincronização */
  ultima_sincronizacao?: string;
  
  /** Dados do Cosmos (JSON) */
  dados_cosmos?: string;
}

/**
 * Log de consulta à API
 */
export interface CosmosLog {
  /** ID do log */
  id: string;
  
  /** Empresa ID */
  empresa_id: string;
  
  /** GTIN consultado */
  gtin: string;
  
  /** Origem da consulta */
  origem: 'cadastro_produto' | 'importacao_nfe' | 'sync_job' | 'manual';
  
  /** Status HTTP */
  status_code: number;
  
  /** Cache hit */
  cache_hit: boolean;
  
  /** Tempo de resposta em ms */
  tempo_resposta_ms: number;
  
  /** Erro (se houver) */
  erro?: string;
  
  /** Data da consulta */
  created_at: string;
}

/**
 * Resultado da busca por NCM
 */
export interface CosmosBuscaPorNcmResultado {
  /** Produtos encontrados */
  produtos: CosmosProduto[];
  
  /** Página atual */
  pagina_atual: number;
  
  /** Itens por página */
  itens_por_pagina: number;
  
  /** Total de páginas */
  total_paginas: number;
  
  /** Total de produtos */
  total_produtos: number;
  
  /** Informações do NCM */
  ncm_info?: CosmosNcm;
  
  /** Tempo de resposta em ms */
  tempo_resposta_ms: number;
  
  /** Status da busca */
  status: 'encontrado' | 'nao_encontrado' | 'erro';
  
  /** Mensagem de erro (se houver) */
  erro?: string;
}

/**
 * Parâmetros para busca por NCM
 */
export interface CosmosBuscaPorNcmParams {
  /** Código NCM (8 dígitos) */
  ncm: string;
  
  /** Página (default: 1) */
  pagina?: number;
  
  /** Itens por página (default: 30, max: 100) */
  itens_por_pagina?: number;
  
  /** Filtro por descrição */
  descricao?: string;
  
  /** Filtro por marca */
  marca?: string;
}

/**
 * Dados para importar produto do Cosmos
 */
export interface CosmosImportarProdutoParams {
  /** GTIN do produto a importar */
  gtin: string;
  
  /** Código interno do produto (se não informado, gera automaticamente) */
  codigo?: string;
  
  /** ID da unidade de medida */
  unidade_medida_id: string;
  
  /** ID da categoria (opcional) */
  categoria_id?: string;
  
  /** Preço de custo (opcional) */
  preco_custo?: number;
  
  /** Margem de lucro (opcional) */
  margem_lucro?: number;
  
  /** Preço de venda (opcional, se não informado calcula pela margem) */
  preco_venda?: number;
  
  /** Estoque mínimo (opcional) */
  estoque_minimo?: number;
}

export type { CosmosProduto as default };
