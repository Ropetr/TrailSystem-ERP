// =============================================
// PLANAC ERP - IBPT API Service
// Consulta API oficial + Cache inteligente
// Atualização automática
// =============================================

// ===== TIPOS =====

export interface IBPTApiConfig {
  token: string;
  cnpj: string;
  uf: string;
}

export interface IBPTConsultaParams {
  codigo: string;        // NCM (8 dígitos) ou NBS
  uf: string;
  ex?: number;           // Exceção tarifária
  descricao: string;
  unidadeMedida: string;
  valor: number;
  gtin?: string;
}

export interface IBPTApiResponse {
  Codigo: string;
  UF: string;
  EX: number;
  Descricao: string;
  Tipo: number;          // 0=NCM, 1=NBS, 2=LC116
  Nacional: number;      // Alíquota federal (nacional)
  Estadual: number;      // Alíquota estadual
  Municipal: number;     // Alíquota municipal
  Importado: number;     // Alíquota federal (importado)
  VigenciaInicio: string;
  VigenciaFim: string;
  Chave: string;
  Versao: string;
  Fonte: string;
  Valor: number;
  ValorTributoNacional: number;
  ValorTributoEstadual: number;
  ValorTributoImportado: number;
  ValorTributoMunicipal: number;
}

export interface IBPTCacheRecord {
  id?: number;
  codigo: string;
  tipo: 'NCM' | 'NBS';
  uf: string;
  ex: number;
  descricao: string;
  aliquota_nacional: number;
  aliquota_importado: number;
  aliquota_estadual: number;
  aliquota_municipal: number;
  vigencia_inicio: string;
  vigencia_fim: string;
  versao: string;
  fonte: string;
  consultado_em: string;
  atualizado_em: string;
}

export interface IBPTCalculoResultado {
  codigo: string;
  descricao: string;
  valor_produto: number;
  origem: 'nacional' | 'importado';
  aliquota_federal: number;
  aliquota_estadual: number;
  aliquota_municipal: number;
  valor_tributo_federal: number;
  valor_tributo_estadual: number;
  valor_tributo_municipal: number;
  valor_tributo_total: number;
  vigencia_fim: string;
  fonte: string;
  cache_hit: boolean;
}

// ===== CONSTANTES =====

const IBPT_API_BASE_URL = 'https://apidoni.ibpt.org.br/api/v1';
const CACHE_EXPIRY_DAYS = 60; // Considera cache válido por 60 dias
const DIAS_ANTECEDENCIA_ATUALIZACAO = 7; // Atualiza 7 dias antes de expirar

// ===== CLASSE PRINCIPAL =====

export class IBPTApiService {
  private db: D1Database;
  private config: IBPTApiConfig;

  constructor(db: D1Database, config: IBPTApiConfig) {
    this.db = db;
    this.config = config;
  }

  // ===== CONSULTA PRINCIPAL (COM CACHE) =====

  /**
   * Consulta alíquota IBPT com cache inteligente
   * 1. Verifica se existe no cache e está válido
   * 2. Se não, consulta API e armazena no cache
   */
  async consultarAliquota(params: IBPTConsultaParams): Promise<IBPTCalculoResultado> {
    const codigoLimpo = params.codigo.replace(/\D/g, '');
    const uf = params.uf.toUpperCase();
    const ex = params.ex || 0;

    // 1. Tentar buscar do cache
    const cacheRecord = await this.buscarCache(codigoLimpo, uf, ex);
    
    if (cacheRecord && this.isCacheValido(cacheRecord)) {
      // Cache válido - usar dados do cache
      return this.calcularTributos(cacheRecord, params.valor, 'nacional', true);
    }

    // 2. Cache inválido ou inexistente - consultar API
    try {
      const apiResponse = await this.consultarApi(params);
      
      // 3. Salvar no cache
      const novoCache = await this.salvarCache(apiResponse, codigoLimpo, uf, ex);
      
      return this.calcularTributos(novoCache, params.valor, 'nacional', false);
    } catch (error) {
      // Se API falhar e tiver cache expirado, usar mesmo assim
      if (cacheRecord) {
        console.warn('[IBPT] API falhou, usando cache expirado:', error);
        return this.calcularTributos(cacheRecord, params.valor, 'nacional', true);
      }
      throw error;
    }
  }

  /**
   * Consulta e calcula tributos considerando origem do produto
   */
  async calcularTributosCompleto(
    params: IBPTConsultaParams,
    origem: 'nacional' | 'importado' = 'nacional'
  ): Promise<IBPTCalculoResultado> {
    const resultado = await this.consultarAliquota(params);
    
    // Recalcular com a origem correta
    if (origem === 'importado') {
      const cacheRecord = await this.buscarCache(
        params.codigo.replace(/\D/g, ''),
        params.uf.toUpperCase(),
        params.ex || 0
      );
      
      if (cacheRecord) {
        return this.calcularTributos(cacheRecord, params.valor, 'importado', resultado.cache_hit);
      }
    }
    
    return resultado;
  }

  // ===== CONSULTA API OFICIAL =====

  private async consultarApi(params: IBPTConsultaParams): Promise<IBPTApiResponse> {
    const queryParams = new URLSearchParams({
      token: this.config.token,
      cnpj: this.config.cnpj.replace(/\D/g, ''),
      codigo: params.codigo.replace(/\D/g, ''),
      uf: params.uf.toUpperCase(),
      ex: String(params.ex || 0),
      descricao: params.descricao.substring(0, 100),
      unidadeMedida: params.unidadeMedida,
      valor: String(params.valor),
      gtin: params.gtin || 'SEM GTIN',
    });

    const url = `${IBPT_API_BASE_URL}/produtos?${queryParams}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`IBPT API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json() as IBPTApiResponse;
    
    // Validar resposta
    if (!data.Codigo || data.Nacional === undefined) {
      throw new Error('Resposta inválida da API IBPT');
    }

    return data;
  }

  /**
   * Consulta serviço (NBS/LC116)
   */
  async consultarServico(params: {
    codigo: string;
    uf: string;
    descricao: string;
    unidadeMedida: string;
    valor: number;
  }): Promise<IBPTApiResponse> {
    const queryParams = new URLSearchParams({
      token: this.config.token,
      cnpj: this.config.cnpj.replace(/\D/g, ''),
      codigo: params.codigo,
      uf: params.uf.toUpperCase(),
      descricao: params.descricao.substring(0, 100),
      unidadeMedida: params.unidadeMedida,
      valor: String(params.valor),
    });

    const url = `${IBPT_API_BASE_URL}/servicos?${queryParams}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`IBPT API Error ${response.status}`);
    }

    return response.json() as Promise<IBPTApiResponse>;
  }

  // ===== CACHE D1 =====

  private async buscarCache(codigo: string, uf: string, ex: number): Promise<IBPTCacheRecord | null> {
    const result = await this.db
      .prepare(`
        SELECT * FROM ibpt_cache 
        WHERE codigo = ? AND uf = ? AND ex = ?
        LIMIT 1
      `)
      .bind(codigo, uf, ex)
      .first<IBPTCacheRecord>();

    return result;
  }

  private isCacheValido(record: IBPTCacheRecord): boolean {
    if (!record.vigencia_fim) return false;
    
    const vigenciaFim = new Date(record.vigencia_fim);
    const hoje = new Date();
    const diasRestantes = Math.ceil((vigenciaFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    // Cache válido se ainda não expirou
    return diasRestantes > 0;
  }

  private async salvarCache(apiResponse: IBPTApiResponse, codigo: string, uf: string, ex: number): Promise<IBPTCacheRecord> {
    const tipo = apiResponse.Tipo === 0 ? 'NCM' : 'NBS';
    const agora = new Date().toISOString();

    // Converter datas do formato DD/MM/YYYY para ISO
    const vigenciaInicio = this.converterDataBR(apiResponse.VigenciaInicio);
    const vigenciaFim = this.converterDataBR(apiResponse.VigenciaFim);

    await this.db
      .prepare(`
        INSERT OR REPLACE INTO ibpt_cache (
          codigo, tipo, uf, ex, descricao,
          aliquota_nacional, aliquota_importado, aliquota_estadual, aliquota_municipal,
          vigencia_inicio, vigencia_fim, versao, fonte,
          consultado_em, atualizado_em
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        codigo, tipo, uf, ex, apiResponse.Descricao,
        apiResponse.Nacional, apiResponse.Importado, apiResponse.Estadual, apiResponse.Municipal,
        vigenciaInicio, vigenciaFim, apiResponse.Versao, apiResponse.Fonte,
        agora, agora
      )
      .run();

    return {
      codigo,
      tipo,
      uf,
      ex,
      descricao: apiResponse.Descricao,
      aliquota_nacional: apiResponse.Nacional,
      aliquota_importado: apiResponse.Importado,
      aliquota_estadual: apiResponse.Estadual,
      aliquota_municipal: apiResponse.Municipal,
      vigencia_inicio: vigenciaInicio,
      vigencia_fim: vigenciaFim,
      versao: apiResponse.Versao,
      fonte: apiResponse.Fonte,
      consultado_em: agora,
      atualizado_em: agora,
    };
  }

  private converterDataBR(dataBR: string): string {
    if (!dataBR) return '';
    
    // Se já está em ISO, retorna
    if (dataBR.includes('-')) return dataBR;
    
    // Converte DD/MM/YYYY para YYYY-MM-DD
    const partes = dataBR.split('/');
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return dataBR;
  }

  // ===== CÁLCULO DE TRIBUTOS =====

  private calcularTributos(
    record: IBPTCacheRecord,
    valor: number,
    origem: 'nacional' | 'importado',
    cacheHit: boolean
  ): IBPTCalculoResultado {
    const aliquotaFederal = origem === 'nacional' 
      ? record.aliquota_nacional 
      : record.aliquota_importado;

    const valorTributoFederal = (valor * aliquotaFederal) / 100;
    const valorTributoEstadual = (valor * record.aliquota_estadual) / 100;
    const valorTributoMunicipal = (valor * record.aliquota_municipal) / 100;

    return {
      codigo: record.codigo,
      descricao: record.descricao,
      valor_produto: valor,
      origem,
      aliquota_federal: aliquotaFederal,
      aliquota_estadual: record.aliquota_estadual,
      aliquota_municipal: record.aliquota_municipal,
      valor_tributo_federal: Math.round(valorTributoFederal * 100) / 100,
      valor_tributo_estadual: Math.round(valorTributoEstadual * 100) / 100,
      valor_tributo_municipal: Math.round(valorTributoMunicipal * 100) / 100,
      valor_tributo_total: Math.round((valorTributoFederal + valorTributoEstadual + valorTributoMunicipal) * 100) / 100,
      vigencia_fim: record.vigencia_fim,
      fonte: record.fonte,
      cache_hit: cacheHit,
    };
  }

  // ===== CONSULTA EM LOTE =====

  /**
   * Consulta múltiplos NCMs de uma vez
   */
  async consultarLote(
    itens: Array<{
      codigo: string;
      descricao: string;
      unidadeMedida: string;
      valor: number;
      origem?: 'nacional' | 'importado';
    }>,
    uf: string
  ): Promise<{
    itens: IBPTCalculoResultado[];
    totais: {
      valor_produtos: number;
      tributo_federal: number;
      tributo_estadual: number;
      tributo_municipal: number;
      tributo_total: number;
    };
    estatisticas: {
      total: number;
      cache_hits: number;
      api_calls: number;
    };
  }> {
    const resultados: IBPTCalculoResultado[] = [];
    let cacheHits = 0;
    let apiCalls = 0;

    for (const item of itens) {
      try {
        const resultado = await this.calcularTributosCompleto(
          {
            codigo: item.codigo,
            uf,
            descricao: item.descricao,
            unidadeMedida: item.unidadeMedida,
            valor: item.valor,
          },
          item.origem || 'nacional'
        );

        resultados.push(resultado);
        
        if (resultado.cache_hit) {
          cacheHits++;
        } else {
          apiCalls++;
        }
      } catch (error) {
        console.error(`[IBPT] Erro ao consultar ${item.codigo}:`, error);
        // Adicionar resultado zerado para não quebrar o lote
        resultados.push({
          codigo: item.codigo,
          descricao: item.descricao,
          valor_produto: item.valor,
          origem: item.origem || 'nacional',
          aliquota_federal: 0,
          aliquota_estadual: 0,
          aliquota_municipal: 0,
          valor_tributo_federal: 0,
          valor_tributo_estadual: 0,
          valor_tributo_municipal: 0,
          valor_tributo_total: 0,
          vigencia_fim: '',
          fonte: 'ERRO',
          cache_hit: false,
        });
      }
    }

    // Calcular totais
    const totais = resultados.reduce(
      (acc, r) => ({
        valor_produtos: acc.valor_produtos + r.valor_produto,
        tributo_federal: acc.tributo_federal + r.valor_tributo_federal,
        tributo_estadual: acc.tributo_estadual + r.valor_tributo_estadual,
        tributo_municipal: acc.tributo_municipal + r.valor_tributo_municipal,
        tributo_total: acc.tributo_total + r.valor_tributo_total,
      }),
      { valor_produtos: 0, tributo_federal: 0, tributo_estadual: 0, tributo_municipal: 0, tributo_total: 0 }
    );

    return {
      itens: resultados,
      totais: {
        valor_produtos: Math.round(totais.valor_produtos * 100) / 100,
        tributo_federal: Math.round(totais.tributo_federal * 100) / 100,
        tributo_estadual: Math.round(totais.tributo_estadual * 100) / 100,
        tributo_municipal: Math.round(totais.tributo_municipal * 100) / 100,
        tributo_total: Math.round(totais.tributo_total * 100) / 100,
      },
      estatisticas: {
        total: itens.length,
        cache_hits: cacheHits,
        api_calls: apiCalls,
      },
    };
  }

  // ===== ATUALIZAÇÃO AUTOMÁTICA =====

  /**
   * Busca registros próximos de expirar para atualização
   */
  async buscarRegistrosParaAtualizar(diasAntecedencia: number = DIAS_ANTECEDENCIA_ATUALIZACAO): Promise<IBPTCacheRecord[]> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + diasAntecedencia);

    const result = await this.db
      .prepare(`
        SELECT * FROM ibpt_cache 
        WHERE vigencia_fim <= ? AND vigencia_fim >= date('now')
        ORDER BY vigencia_fim ASC
        LIMIT 100
      `)
      .bind(dataLimite.toISOString().split('T')[0])
      .all<IBPTCacheRecord>();

    return result.results || [];
  }

  /**
   * Atualiza registros expirados ou próximos de expirar
   */
  async atualizarRegistrosExpirados(): Promise<{
    atualizados: number;
    erros: number;
    detalhes: Array<{ codigo: string; status: 'sucesso' | 'erro'; mensagem?: string }>;
  }> {
    const registros = await this.buscarRegistrosParaAtualizar();
    const detalhes: Array<{ codigo: string; status: 'sucesso' | 'erro'; mensagem?: string }> = [];
    let atualizados = 0;
    let erros = 0;

    for (const registro of registros) {
      try {
        await this.consultarAliquota({
          codigo: registro.codigo,
          uf: registro.uf,
          ex: registro.ex,
          descricao: registro.descricao,
          unidadeMedida: 'UN',
          valor: 100,
        });

        atualizados++;
        detalhes.push({ codigo: registro.codigo, status: 'sucesso' });
      } catch (error: any) {
        erros++;
        detalhes.push({ codigo: registro.codigo, status: 'erro', mensagem: error.message });
      }

      // Rate limiting - aguardar 200ms entre requisições
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return { atualizados, erros, detalhes };
  }

  // ===== ESTATÍSTICAS =====

  /**
   * Retorna estatísticas do cache
   */
  async obterEstatisticasCache(): Promise<{
    total_registros: number;
    registros_validos: number;
    registros_expirados: number;
    registros_expirando_7_dias: number;
    ultima_atualizacao: string | null;
    versao_mais_recente: string | null;
    por_uf: Array<{ uf: string; total: number }>;
  }> {
    const [total, validos, expirados, expirando, ultima, versao, porUf] = await Promise.all([
      this.db.prepare('SELECT COUNT(*) as count FROM ibpt_cache').first<{ count: number }>(),
      this.db.prepare(`SELECT COUNT(*) as count FROM ibpt_cache WHERE vigencia_fim >= date('now')`).first<{ count: number }>(),
      this.db.prepare(`SELECT COUNT(*) as count FROM ibpt_cache WHERE vigencia_fim < date('now')`).first<{ count: number }>(),
      this.db.prepare(`SELECT COUNT(*) as count FROM ibpt_cache WHERE vigencia_fim BETWEEN date('now') AND date('now', '+7 days')`).first<{ count: number }>(),
      this.db.prepare('SELECT MAX(atualizado_em) as data FROM ibpt_cache').first<{ data: string }>(),
      this.db.prepare('SELECT versao FROM ibpt_cache ORDER BY atualizado_em DESC LIMIT 1').first<{ versao: string }>(),
      this.db.prepare('SELECT uf, COUNT(*) as total FROM ibpt_cache GROUP BY uf ORDER BY total DESC').all<{ uf: string; total: number }>(),
    ]);

    return {
      total_registros: total?.count || 0,
      registros_validos: validos?.count || 0,
      registros_expirados: expirados?.count || 0,
      registros_expirando_7_dias: expirando?.count || 0,
      ultima_atualizacao: ultima?.data || null,
      versao_mais_recente: versao?.versao || null,
      por_uf: porUf.results || [],
    };
  }

  // ===== LIMPEZA =====

  /**
   * Remove registros muito antigos do cache
   */
  async limparCacheAntigo(diasRetencao: number = 180): Promise<number> {
    const result = await this.db
      .prepare(`
        DELETE FROM ibpt_cache 
        WHERE vigencia_fim < date('now', '-' || ? || ' days')
      `)
      .bind(diasRetencao)
      .run();

    return result.meta?.changes || 0;
  }
}

// ===== FACTORY =====

export function createIBPTApiService(db: D1Database, config: IBPTApiConfig): IBPTApiService {
  return new IBPTApiService(db, config);
}

export type { D1Database };
