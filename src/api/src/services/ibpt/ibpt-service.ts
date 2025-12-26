// =============================================
// PLANAC ERP - IBPT Service
// Lei da Transparência Fiscal (Lei 12.741/2012)
// =============================================

import type {
  IBPTRegistro,
  IBPTRegistroNBS,
  IBPTCalculoTributos,
  IBPTMetadados,
  IBPTConfig,
  IBPTBuscaParams,
  IBPTApiResponse,
  IBPTItemCalculo,
  IBPTResultadoLote,
} from './ibpt-types';

// ===== CONSTANTES =====

const IBPT_API_URL = 'https://api.deolhonoimposto.ibpt.org.br';
const CACHE_PREFIX = 'ibpt:';
const DEFAULT_TTL = 86400; // 24 horas

// ===== TABELA EM MEMÓRIA =====

// Cache em memória para a tabela IBPT
let tabelaCache: Map<string, IBPTRegistro> = new Map();
let metadadosCache: IBPTMetadados | null = null;

// ===== FUNÇÕES DE BUSCA =====

/**
 * Gera a chave de cache para um NCM
 */
function gerarChaveCache(ncm: string, uf: string, ex?: string): string {
  const ncmLimpo = ncm.replace(/\D/g, '');
  return `${CACHE_PREFIX}${uf}:${ncmLimpo}${ex ? `:${ex}` : ''}`;
}

/**
 * Busca registro IBPT por NCM (tabela local ou API)
 */
export async function buscarPorNCM(
  config: IBPTConfig,
  params: IBPTBuscaParams
): Promise<IBPTRegistro | null> {
  const { ncm, uf, ex } = params;
  const ncmLimpo = ncm.replace(/\D/g, '');
  const chaveCache = gerarChaveCache(ncmLimpo, uf, ex);

  // 1. Verificar cache KV
  if (config.cache) {
    try {
      const cached = await config.cache.get(chaveCache);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Erro ao ler cache IBPT:', e);
    }
  }

  // 2. Verificar cache em memória
  const chaveMemoria = `${uf}:${ncmLimpo}${ex ? `:${ex}` : ''}`;
  if (tabelaCache.has(chaveMemoria)) {
    return tabelaCache.get(chaveMemoria)!;
  }

  // 3. Buscar na API IBPT (se configurado)
  if (config.token && config.cnpj) {
    try {
      const registro = await buscarNaApiIBPT(config, params);
      if (registro) {
        // Salvar no cache
        if (config.cache) {
          await config.cache.put(
            chaveCache,
            JSON.stringify(registro),
            { expirationTtl: config.cache_ttl || DEFAULT_TTL }
          );
        }
        tabelaCache.set(chaveMemoria, registro);
        return registro;
      }
    } catch (e) {
      console.warn('Erro ao buscar na API IBPT:', e);
    }
  }

  // 4. Buscar NCM genérico (sem últimos dígitos)
  const ncmGenerico = buscarNCMGenerico(ncmLimpo, uf);
  if (ncmGenerico) {
    return ncmGenerico;
  }

  return null;
}

/**
 * Busca NCM genérico (removendo dígitos do final)
 */
function buscarNCMGenerico(ncm: string, uf: string): IBPTRegistro | null {
  // Tentar NCM com menos dígitos progressivamente
  for (let i = ncm.length - 1; i >= 4; i--) {
    const ncmParcial = ncm.substring(0, i).padEnd(8, '0');
    const chave = `${uf}:${ncmParcial}`;
    if (tabelaCache.has(chave)) {
      return tabelaCache.get(chave)!;
    }
  }
  return null;
}

/**
 * Busca na API oficial do IBPT
 */
async function buscarNaApiIBPT(
  config: IBPTConfig,
  params: IBPTBuscaParams
): Promise<IBPTRegistro | null> {
  const { ncm, uf, ex } = params;
  const ncmLimpo = ncm.replace(/\D/g, '');

  const url = new URL(`${IBPT_API_URL}/api/Produtos`);
  url.searchParams.append('token', config.token!);
  url.searchParams.append('cnpj', config.cnpj!.replace(/\D/g, ''));
  url.searchParams.append('codigo', ncmLimpo);
  url.searchParams.append('uf', uf);
  if (ex) url.searchParams.append('ex', ex);

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Erro na API IBPT: ${response.status}`);
  }

  const data: IBPTApiResponse = await response.json();

  return {
    ncm: data.Codigo,
    ex: data.EX || '',
    tipo: data.Tipo === '0' ? 0 : 1,
    descricao: data.Descricao,
    aliquota_nacional_federal: data.Nacional,
    aliquota_importado_federal: data.Importado,
    aliquota_estadual: data.Estadual,
    aliquota_municipal: data.Municipal,
    vigencia_inicio: data.VigenciaInicio,
    vigencia_fim: data.VigenciaFim,
    chave: data.Chave,
    versao: data.Versao,
    fonte: data.Fonte,
  };
}

// ===== CÁLCULO DE TRIBUTOS =====

/**
 * Calcula tributos aproximados para um item
 * Conforme Lei da Transparência Fiscal (Lei 12.741/2012)
 */
export async function calcularTributos(
  config: IBPTConfig,
  ncm: string,
  valor: number,
  origem: number = 0,
  ex?: string
): Promise<IBPTCalculoTributos> {
  const registro = await buscarPorNCM(config, {
    ncm,
    uf: config.uf,
    ex,
  });

  // Se não encontrar, retornar zeros
  if (!registro) {
    return {
      valor_base: valor,
      origem,
      tributos_federais: { aliquota: 0, valor: 0 },
      tributos_estaduais: { aliquota: 0, valor: 0 },
      tributos_municipais: { aliquota: 0, valor: 0 },
      total: { aliquota: 0, valor: 0 },
      fonte: 'Não encontrado',
      chave_ibpt: '',
    };
  }

  // Determinar se é nacional ou importado
  const isImportado = origem > 0;
  
  // Calcular alíquotas
  const aliquotaFederal = isImportado 
    ? registro.aliquota_importado_federal 
    : registro.aliquota_nacional_federal;
  const aliquotaEstadual = registro.aliquota_estadual;
  const aliquotaMunicipal = registro.aliquota_municipal;
  const aliquotaTotal = aliquotaFederal + aliquotaEstadual + aliquotaMunicipal;

  // Calcular valores
  const valorFederal = arredondar(valor * (aliquotaFederal / 100));
  const valorEstadual = arredondar(valor * (aliquotaEstadual / 100));
  const valorMunicipal = arredondar(valor * (aliquotaMunicipal / 100));
  const valorTotal = arredondar(valorFederal + valorEstadual + valorMunicipal);

  return {
    valor_base: valor,
    origem,
    tributos_federais: {
      aliquota: aliquotaFederal,
      valor: valorFederal,
    },
    tributos_estaduais: {
      aliquota: aliquotaEstadual,
      valor: valorEstadual,
    },
    tributos_municipais: {
      aliquota: aliquotaMunicipal,
      valor: valorMunicipal,
    },
    total: {
      aliquota: aliquotaTotal,
      valor: valorTotal,
    },
    fonte: registro.fonte,
    chave_ibpt: registro.chave,
  };
}

/**
 * Calcula tributos para múltiplos itens (lote)
 */
export async function calcularTributosLote(
  config: IBPTConfig,
  itens: IBPTItemCalculo[]
): Promise<IBPTResultadoLote> {
  const resultados: Array<IBPTItemCalculo & IBPTCalculoTributos> = [];
  
  let totalValorProdutos = 0;
  let totalFederais = 0;
  let totalEstaduais = 0;
  let totalMunicipais = 0;

  for (const item of itens) {
    const calculo = await calcularTributos(
      config,
      item.ncm,
      item.valor,
      item.origem,
      item.ex
    );

    resultados.push({
      ...item,
      ...calculo,
    });

    totalValorProdutos += item.valor;
    totalFederais += calculo.tributos_federais.valor;
    totalEstaduais += calculo.tributos_estaduais.valor;
    totalMunicipais += calculo.tributos_municipais.valor;
  }

  const totalTributos = totalFederais + totalEstaduais + totalMunicipais;
  const aliquotaMedia = totalValorProdutos > 0 
    ? (totalTributos / totalValorProdutos) * 100 
    : 0;

  return {
    itens: resultados,
    totais: {
      valor_produtos: arredondar(totalValorProdutos),
      tributos_federais: arredondar(totalFederais),
      tributos_estaduais: arredondar(totalEstaduais),
      tributos_municipais: arredondar(totalMunicipais),
      tributos_total: arredondar(totalTributos),
      aliquota_media: arredondar(aliquotaMedia),
    },
  };
}

// ===== IMPORTAÇÃO DA TABELA =====

/**
 * Importa tabela IBPT do formato CSV
 * Formato: NCM;EX;Tipo;Descrição;NacFed;ImpFed;Estadual;Municipal;VigInicio;VigFim;Chave;Versão;Fonte
 */
export function importarTabelaCSV(
  csv: string,
  uf: string
): { registros: number; erros: string[] } {
  const linhas = csv.split('\n');
  const erros: string[] = [];
  let registrosImportados = 0;

  // Pular cabeçalho se existir
  const inicio = linhas[0]?.includes('NCM') ? 1 : 0;

  for (let i = inicio; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;

    try {
      const campos = linha.split(';');
      if (campos.length < 13) {
        erros.push(`Linha ${i + 1}: campos insuficientes`);
        continue;
      }

      const registro: IBPTRegistro = {
        ncm: campos[0].replace(/\D/g, ''),
        ex: campos[1] || '',
        tipo: campos[2] === '1' ? 1 : 0,
        descricao: campos[3],
        aliquota_nacional_federal: parseFloat(campos[4].replace(',', '.')) || 0,
        aliquota_importado_federal: parseFloat(campos[5].replace(',', '.')) || 0,
        aliquota_estadual: parseFloat(campos[6].replace(',', '.')) || 0,
        aliquota_municipal: parseFloat(campos[7].replace(',', '.')) || 0,
        vigencia_inicio: campos[8],
        vigencia_fim: campos[9],
        chave: campos[10],
        versao: campos[11],
        fonte: campos[12],
      };

      // Gerar chave e salvar no cache
      const chave = `${uf}:${registro.ncm}${registro.ex ? `:${registro.ex}` : ''}`;
      tabelaCache.set(chave, registro);
      registrosImportados++;
    } catch (e) {
      erros.push(`Linha ${i + 1}: ${e}`);
    }
  }

  // Atualizar metadados
  if (registrosImportados > 0) {
    const primeiroRegistro = Array.from(tabelaCache.values())[0];
    metadadosCache = {
      versao: primeiroRegistro?.versao || '',
      data_atualizacao: new Date().toISOString(),
      uf,
      total_registros: tabelaCache.size,
      vigencia_inicio: primeiroRegistro?.vigencia_inicio || '',
      vigencia_fim: primeiroRegistro?.vigencia_fim || '',
    };
  }

  return { registros: registrosImportados, erros };
}

/**
 * Exporta tabela para KV Namespace (para cache distribuído)
 */
export async function exportarParaKV(
  kv: KVNamespace,
  uf: string,
  ttl: number = DEFAULT_TTL
): Promise<number> {
  let exportados = 0;

  for (const [chave, registro] of tabelaCache) {
    if (chave.startsWith(`${uf}:`)) {
      await kv.put(
        `${CACHE_PREFIX}${chave}`,
        JSON.stringify(registro),
        { expirationTtl: ttl }
      );
      exportados++;
    }
  }

  // Salvar metadados
  if (metadadosCache) {
    await kv.put(
      `${CACHE_PREFIX}metadados:${uf}`,
      JSON.stringify(metadadosCache),
      { expirationTtl: ttl }
    );
  }

  return exportados;
}

/**
 * Carrega tabela do KV Namespace
 */
export async function carregarDoKV(
  kv: KVNamespace,
  uf: string
): Promise<number> {
  // Carregar metadados
  const metaKey = `${CACHE_PREFIX}metadados:${uf}`;
  const metaJson = await kv.get(metaKey);
  if (metaJson) {
    metadadosCache = JSON.parse(metaJson);
  }

  // Nota: KV não suporta listar por prefixo de forma eficiente
  // A tabela deve ser carregada sob demanda ou pré-carregada na inicialização

  return metadadosCache?.total_registros || 0;
}

// ===== FORMATAÇÃO PARA NF-e =====

/**
 * Gera texto para campo infCpl da NF-e
 * Conforme Lei 12.741/2012
 */
export function gerarTextoLeiTransparencia(
  calculo: IBPTCalculoTributos
): string {
  const { total, tributos_federais, tributos_estaduais, tributos_municipais, fonte } = calculo;

  // Formato: "Val Aprox Tributos R$ X,XX (XX,XX%) Fonte: IBPT"
  const partes: string[] = [];
  
  if (tributos_federais.valor > 0) {
    partes.push(`Federal R$ ${formatarMoeda(tributos_federais.valor)}`);
  }
  if (tributos_estaduais.valor > 0) {
    partes.push(`Estadual R$ ${formatarMoeda(tributos_estaduais.valor)}`);
  }
  if (tributos_municipais.valor > 0) {
    partes.push(`Municipal R$ ${formatarMoeda(tributos_municipais.valor)}`);
  }

  return `Val Aprox Tributos R$ ${formatarMoeda(total.valor)} (${total.aliquota.toFixed(2)}%) ${partes.join(' ')} Fonte: ${fonte}`;
}

/**
 * Gera texto resumido para cupom fiscal
 */
export function gerarTextoResumido(
  totalTributos: number,
  aliquotaMedia: number
): string {
  return `Trib Aprox R$ ${formatarMoeda(totalTributos)} (${aliquotaMedia.toFixed(2)}%) Fonte: IBPT`;
}

/**
 * Retorna valor para campo vTotTrib da NF-e
 */
export function obterVTotTrib(resultado: IBPTResultadoLote): number {
  return resultado.totais.tributos_total;
}

// ===== UTILITÁRIOS =====

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function formatarMoeda(valor: number): string {
  return valor.toFixed(2).replace('.', ',');
}

/**
 * Obtém metadados da tabela carregada
 */
export function obterMetadados(): IBPTMetadados | null {
  return metadadosCache;
}

/**
 * Limpa cache em memória
 */
export function limparCache(): void {
  tabelaCache.clear();
  metadadosCache = null;
}

/**
 * Retorna estatísticas do cache
 */
export function obterEstatisticasCache(): {
  registros_memoria: number;
  ufs_carregadas: string[];
} {
  const ufs = new Set<string>();
  for (const chave of tabelaCache.keys()) {
    const uf = chave.split(':')[0];
    ufs.add(uf);
  }

  return {
    registros_memoria: tabelaCache.size,
    ufs_carregadas: Array.from(ufs),
  };
}

