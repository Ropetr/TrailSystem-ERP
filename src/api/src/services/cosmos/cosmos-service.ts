// =============================================
// PLANAC ERP - Cosmos/Bluesoft Service
// Cadastro automático de produtos via GTIN
// API: https://cosmos.bluesoft.com.br/api
// =============================================

import type {
  CosmosConfig,
  CosmosProduto,
  CosmosBuscaResultado,
  CosmosEnriquecimento,
  CosmosEstatisticas,
  CosmosLog,
  CosmosProductLink,
} from './cosmos-types';

// ===== CONSTANTES =====

const COSMOS_API_URL = 'https://api.cosmos.bluesoft.com.br';
const CACHE_PREFIX = 'cosmos:';
const DEFAULT_TTL = 604800; // 7 dias em segundos

// ===== CACHE EM MEMÓRIA =====

const cacheMemoria: Map<string, { produto: CosmosProduto; expires_at: number }> = new Map();

// ===== FUNÇÕES AUXILIARES =====

function limparGtin(gtin: string): string {
  return gtin.replace(/\D/g, '').padStart(13, '0');
}

function gerarChaveCache(gtin: string): string {
  return `${CACHE_PREFIX}${limparGtin(gtin)}`;
}

// ===== BUSCA DE PRODUTO =====

/**
 * Busca produto por GTIN na API Cosmos
 */
export async function buscarPorGtin(
  config: CosmosConfig,
  gtin: string,
  db?: D1Database,
  empresaId?: string
): Promise<CosmosBuscaResultado> {
  const inicio = Date.now();
  const gtinLimpo = limparGtin(gtin);
  const chaveCache = gerarChaveCache(gtinLimpo);

  // 1. Verificar cache em memória
  const cacheItem = cacheMemoria.get(chaveCache);
  if (cacheItem && cacheItem.expires_at > Date.now()) {
    const tempoResposta = Date.now() - inicio;
    
    if (db && empresaId) {
      await registrarLog(db, {
        empresa_id: empresaId,
        gtin: gtinLimpo,
        origem: 'cadastro_produto',
        status_code: 200,
        cache_hit: true,
        tempo_resposta_ms: tempoResposta,
      });
    }

    return {
      produto: cacheItem.produto,
      cache_hit: true,
      tempo_resposta_ms: tempoResposta,
      status: 'encontrado',
    };
  }

  // 2. Verificar cache no D1 (se disponível)
  if (db && empresaId) {
    try {
      const cacheD1 = await db.prepare(`
        SELECT response_json, expires_at FROM cosmos_cache 
        WHERE gtin = ? AND expires_at > datetime('now')
      `).bind(gtinLimpo).first<{ response_json: string; expires_at: string }>();

      if (cacheD1) {
        const produto = JSON.parse(cacheD1.response_json) as CosmosProduto;
        const tempoResposta = Date.now() - inicio;

        // Atualizar hit_count
        await db.prepare(`
          UPDATE cosmos_cache SET hit_count = hit_count + 1 WHERE gtin = ?
        `).bind(gtinLimpo).run();

        await registrarLog(db, {
          empresa_id: empresaId,
          gtin: gtinLimpo,
          origem: 'cadastro_produto',
          status_code: 200,
          cache_hit: true,
          tempo_resposta_ms: tempoResposta,
        });

        // Salvar em memória também
        cacheMemoria.set(chaveCache, {
          produto,
          expires_at: new Date(cacheD1.expires_at).getTime(),
        });

        return {
          produto,
          cache_hit: true,
          tempo_resposta_ms: tempoResposta,
          status: 'encontrado',
        };
      }
    } catch (e) {
      console.warn('Erro ao ler cache D1 Cosmos:', e);
    }
  }

  // 3. Buscar na API Cosmos
  try {
    const response = await fetch(`${COSMOS_API_URL}/gtins/${gtinLimpo}`, {
      headers: {
        'X-Cosmos-Token': config.token,
        'User-Agent': 'PLANAC-ERP/1.0',
        'Accept': 'application/json',
      },
    });

    const tempoResposta = Date.now() - inicio;

    if (response.status === 404) {
      if (db && empresaId) {
        await registrarLog(db, {
          empresa_id: empresaId,
          gtin: gtinLimpo,
          origem: 'cadastro_produto',
          status_code: 404,
          cache_hit: false,
          tempo_resposta_ms: tempoResposta,
        });
      }

      return {
        produto: null,
        cache_hit: false,
        tempo_resposta_ms: tempoResposta,
        status: 'nao_encontrado',
      };
    }

    if (!response.ok) {
      const erro = `Erro na API Cosmos: ${response.status} ${response.statusText}`;
      
      if (db && empresaId) {
        await registrarLog(db, {
          empresa_id: empresaId,
          gtin: gtinLimpo,
          origem: 'cadastro_produto',
          status_code: response.status,
          cache_hit: false,
          tempo_resposta_ms: tempoResposta,
          erro,
        });
      }

      return {
        produto: null,
        cache_hit: false,
        tempo_resposta_ms: tempoResposta,
        status: 'erro',
        erro,
      };
    }

    const produto: CosmosProduto = await response.json();

    // Salvar no cache D1
    if (db) {
      const ttl = config.cache_ttl || DEFAULT_TTL;
      const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

      try {
        await db.prepare(`
          INSERT INTO cosmos_cache (gtin, response_json, fetched_at, expires_at, status_code, hit_count)
          VALUES (?, ?, datetime('now'), ?, 200, 0)
          ON CONFLICT(gtin) DO UPDATE SET
            response_json = excluded.response_json,
            fetched_at = excluded.fetched_at,
            expires_at = excluded.expires_at,
            status_code = excluded.status_code,
            hit_count = hit_count + 1
        `).bind(gtinLimpo, JSON.stringify(produto), expiresAt).run();
      } catch (e) {
        console.warn('Erro ao salvar cache D1 Cosmos:', e);
      }
    }

    // Salvar em memória
    const ttl = config.cache_ttl || DEFAULT_TTL;
    cacheMemoria.set(chaveCache, {
      produto,
      expires_at: Date.now() + ttl * 1000,
    });

    if (db && empresaId) {
      await registrarLog(db, {
        empresa_id: empresaId,
        gtin: gtinLimpo,
        origem: 'cadastro_produto',
        status_code: 200,
        cache_hit: false,
        tempo_resposta_ms: tempoResposta,
      });
    }

    return {
      produto,
      cache_hit: false,
      tempo_resposta_ms: tempoResposta,
      status: 'encontrado',
    };
  } catch (e) {
    const tempoResposta = Date.now() - inicio;
    const erro = e instanceof Error ? e.message : 'Erro desconhecido';

    if (db && empresaId) {
      await registrarLog(db, {
        empresa_id: empresaId,
        gtin: gtinLimpo,
        origem: 'cadastro_produto',
        status_code: 0,
        cache_hit: false,
        tempo_resposta_ms: tempoResposta,
        erro,
      });
    }

    return {
      produto: null,
      cache_hit: false,
      tempo_resposta_ms: tempoResposta,
      status: 'erro',
      erro,
    };
  }
}

// ===== ENRIQUECIMENTO DE PRODUTO =====

/**
 * Converte dados do Cosmos para formato de enriquecimento
 */
export function extrairEnriquecimento(
  produto: CosmosProduto,
  config: CosmosConfig
): CosmosEnriquecimento {
  const enriquecimento: CosmosEnriquecimento = {
    origem: 'cosmos',
    consultado_em: new Date().toISOString(),
  };

  if (config.preencher_descricao !== false && produto.description) {
    enriquecimento.descricao = produto.description;
  }

  if (config.preencher_ncm !== false && produto.ncm?.code) {
    enriquecimento.ncm = produto.ncm.code.replace(/\D/g, '');
  }

  if (config.preencher_cest !== false && produto.cest?.code) {
    enriquecimento.cest = produto.cest.code.replace(/\D/g, '');
  }

  if (config.preencher_marca !== false && produto.brand?.name) {
    enriquecimento.marca = produto.brand.name;
  }

  if (config.preencher_categoria !== false && produto.gpc?.description) {
    enriquecimento.categoria_sugerida = produto.gpc.description;
  }

  if (config.preencher_peso !== false) {
    if (produto.net_weight) {
      enriquecimento.peso_liquido = produto.net_weight;
    }
    if (produto.gross_weight) {
      enriquecimento.peso_bruto = produto.gross_weight;
    }
  }

  if (config.preencher_dimensoes !== false) {
    if (produto.width) enriquecimento.largura = produto.width;
    if (produto.height) enriquecimento.altura = produto.height;
    if (produto.depth) enriquecimento.profundidade = produto.depth;
  }

  if (config.preencher_imagem !== false && produto.thumbnail) {
    enriquecimento.imagem_url = produto.thumbnail;
  }

  if (produto.avg_price) enriquecimento.preco_medio = produto.avg_price;
  if (produto.min_price) enriquecimento.preco_minimo = produto.min_price;
  if (produto.max_price) enriquecimento.preco_maximo = produto.max_price;

  return enriquecimento;
}

/**
 * Busca e enriquece dados de um produto pelo GTIN
 */
export async function buscarEEnriquecer(
  config: CosmosConfig,
  gtin: string,
  db?: D1Database,
  empresaId?: string
): Promise<CosmosEnriquecimento | null> {
  const resultado = await buscarPorGtin(config, gtin, db, empresaId);

  if (resultado.status !== 'encontrado' || !resultado.produto) {
    return null;
  }

  return extrairEnriquecimento(resultado.produto, config);
}

// ===== VÍNCULO PRODUTO ↔ COSMOS =====

/**
 * Vincula um produto interno ao Cosmos
 */
export async function vincularProduto(
  db: D1Database,
  empresaId: string,
  produtoId: string,
  gtin: string,
  dadosCosmos: CosmosProduto,
  origens: Partial<CosmosProductLink>
): Promise<void> {
  const gtinLimpo = limparGtin(gtin);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const gtinsAlternativos = dadosCosmos.gtins
    ? JSON.stringify(dadosCosmos.gtins.map(g => g.gtin.toString()))
    : null;

  await db.prepare(`
    INSERT INTO cosmos_product_links (
      id, empresa_id, produto_id, gtin_principal, gtins_alternativos,
      origem_descricao, origem_ncm, origem_cest, origem_marca,
      origem_peso, origem_dimensoes, origem_imagem,
      ultima_sincronizacao, dados_cosmos, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(empresa_id, produto_id) DO UPDATE SET
      gtin_principal = excluded.gtin_principal,
      gtins_alternativos = excluded.gtins_alternativos,
      origem_descricao = COALESCE(excluded.origem_descricao, origem_descricao),
      origem_ncm = COALESCE(excluded.origem_ncm, origem_ncm),
      origem_cest = COALESCE(excluded.origem_cest, origem_cest),
      origem_marca = COALESCE(excluded.origem_marca, origem_marca),
      origem_peso = COALESCE(excluded.origem_peso, origem_peso),
      origem_dimensoes = COALESCE(excluded.origem_dimensoes, origem_dimensoes),
      origem_imagem = COALESCE(excluded.origem_imagem, origem_imagem),
      ultima_sincronizacao = excluded.ultima_sincronizacao,
      dados_cosmos = excluded.dados_cosmos,
      updated_at = excluded.updated_at
  `).bind(
    id,
    empresaId,
    produtoId,
    gtinLimpo,
    gtinsAlternativos,
    origens.origem_descricao || 'cosmos',
    origens.origem_ncm || 'cosmos',
    origens.origem_cest || 'cosmos',
    origens.origem_marca || 'cosmos',
    origens.origem_peso || 'cosmos',
    origens.origem_dimensoes || 'cosmos',
    origens.origem_imagem || 'cosmos',
    now,
    JSON.stringify(dadosCosmos),
    now,
    now
  ).run();
}

/**
 * Busca vínculo de um produto
 */
export async function buscarVinculo(
  db: D1Database,
  empresaId: string,
  produtoId: string
): Promise<CosmosProductLink | null> {
  const result = await db.prepare(`
    SELECT * FROM cosmos_product_links
    WHERE empresa_id = ? AND produto_id = ?
  `).bind(empresaId, produtoId).first<CosmosProductLink>();

  return result || null;
}

/**
 * Busca produto por GTIN no vínculo
 */
export async function buscarProdutoPorGtin(
  db: D1Database,
  empresaId: string,
  gtin: string
): Promise<{ produto_id: string; dados_cosmos: string } | null> {
  const gtinLimpo = limparGtin(gtin);

  const result = await db.prepare(`
    SELECT produto_id, dados_cosmos FROM cosmos_product_links
    WHERE empresa_id = ? AND (
      gtin_principal = ? OR 
      gtins_alternativos LIKE ?
    )
  `).bind(empresaId, gtinLimpo, `%${gtinLimpo}%`).first<{ produto_id: string; dados_cosmos: string }>();

  return result || null;
}

// ===== CONFIGURAÇÃO =====

/**
 * Obtém configuração do Cosmos para uma empresa
 */
export async function obterConfig(
  db: D1Database,
  empresaId: string
): Promise<CosmosConfig | null> {
  const config = await db.prepare(`
    SELECT * FROM cosmos_config WHERE empresa_id = ? AND habilitado = 1
  `).bind(empresaId).first();

  if (!config) return null;

  return {
    token: '', // Token deve vir de variável de ambiente, não do banco
    ambiente: (config.ambiente as 'producao' | 'sandbox') || 'producao',
    cache_ttl: (config.cache_ttl_horas as number || 168) * 3600,
    limite_consultas_dia: config.limite_consultas_dia as number || 1000,
    auto_enriquecer: config.auto_enriquecer_cadastro === 1,
    sobrescrever_dados_manuais: config.sobrescrever_dados_manuais === 1,
    preencher_descricao: config.preencher_descricao === 1,
    preencher_ncm: config.preencher_ncm === 1,
    preencher_cest: config.preencher_cest === 1,
    preencher_marca: config.preencher_marca === 1,
    preencher_categoria: config.preencher_categoria === 1,
    preencher_peso: config.preencher_peso === 1,
    preencher_dimensoes: config.preencher_dimensoes === 1,
    preencher_imagem: config.preencher_imagem === 1,
  };
}

/**
 * Salva configuração do Cosmos para uma empresa
 */
export async function salvarConfig(
  db: D1Database,
  empresaId: string,
  config: Partial<CosmosConfig>
): Promise<void> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO cosmos_config (
      id, empresa_id, habilitado, ambiente, cache_ttl_horas,
      auto_enriquecer_cadastro, sobrescrever_dados_manuais, limite_consultas_dia,
      preencher_descricao, preencher_ncm, preencher_cest, preencher_marca,
      preencher_categoria, preencher_peso, preencher_dimensoes, preencher_imagem,
      created_at, updated_at
    ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(empresa_id) DO UPDATE SET
      ambiente = excluded.ambiente,
      cache_ttl_horas = excluded.cache_ttl_horas,
      auto_enriquecer_cadastro = excluded.auto_enriquecer_cadastro,
      sobrescrever_dados_manuais = excluded.sobrescrever_dados_manuais,
      limite_consultas_dia = excluded.limite_consultas_dia,
      preencher_descricao = excluded.preencher_descricao,
      preencher_ncm = excluded.preencher_ncm,
      preencher_cest = excluded.preencher_cest,
      preencher_marca = excluded.preencher_marca,
      preencher_categoria = excluded.preencher_categoria,
      preencher_peso = excluded.preencher_peso,
      preencher_dimensoes = excluded.preencher_dimensoes,
      preencher_imagem = excluded.preencher_imagem,
      updated_at = excluded.updated_at
  `).bind(
    id,
    empresaId,
    config.ambiente || 'producao',
    config.cache_ttl ? Math.floor(config.cache_ttl / 3600) : 168,
    config.auto_enriquecer ? 1 : 0,
    config.sobrescrever_dados_manuais ? 1 : 0,
    config.limite_consultas_dia || 1000,
    config.preencher_descricao !== false ? 1 : 0,
    config.preencher_ncm !== false ? 1 : 0,
    config.preencher_cest !== false ? 1 : 0,
    config.preencher_marca !== false ? 1 : 0,
    config.preencher_categoria !== false ? 1 : 0,
    config.preencher_peso !== false ? 1 : 0,
    config.preencher_dimensoes !== false ? 1 : 0,
    config.preencher_imagem !== false ? 1 : 0,
    now,
    now
  ).run();
}

// ===== ESTATÍSTICAS =====

/**
 * Obtém estatísticas de uso da API
 */
export async function obterEstatisticas(
  db: D1Database,
  empresaId: string
): Promise<CosmosEstatisticas> {
  const hoje = new Date().toISOString().split('T')[0];
  const inicioMes = `${hoje.substring(0, 7)}-01`;

  const [consultasHoje, consultasMes, cacheHitsHoje, config] = await Promise.all([
    db.prepare(`
      SELECT COUNT(*) as total FROM cosmos_logs
      WHERE empresa_id = ? AND date(created_at) = date(?)
    `).bind(empresaId, hoje).first<{ total: number }>(),

    db.prepare(`
      SELECT COUNT(*) as total FROM cosmos_logs
      WHERE empresa_id = ? AND date(created_at) >= date(?)
    `).bind(empresaId, inicioMes).first<{ total: number }>(),

    db.prepare(`
      SELECT COUNT(*) as total FROM cosmos_logs
      WHERE empresa_id = ? AND date(created_at) = date(?) AND cache_hit = 1
    `).bind(empresaId, hoje).first<{ total: number }>(),

    db.prepare(`
      SELECT limite_consultas_dia FROM cosmos_config WHERE empresa_id = ?
    `).bind(empresaId).first<{ limite_consultas_dia: number }>(),
  ]);

  const totalHoje = consultasHoje?.total || 0;
  const cacheHits = cacheHitsHoje?.total || 0;
  const limiteDiario = config?.limite_consultas_dia || 1000;

  return {
    consultas_hoje: totalHoje,
    consultas_mes: consultasMes?.total || 0,
    cache_hits_hoje: cacheHits,
    taxa_cache_hit: totalHoje > 0 ? (cacheHits / totalHoje) * 100 : 0,
    limite_diario: limiteDiario,
    consultas_restantes: Math.max(0, limiteDiario - totalHoje),
  };
}

// ===== LOGS =====

/**
 * Registra log de consulta
 */
async function registrarLog(
  db: D1Database,
  log: Omit<CosmosLog, 'id' | 'created_at'>
): Promise<void> {
  const id = crypto.randomUUID();

  try {
    await db.prepare(`
      INSERT INTO cosmos_logs (
        id, empresa_id, gtin, origem, status_code, cache_hit, tempo_resposta_ms, erro, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      id,
      log.empresa_id,
      log.gtin,
      log.origem,
      log.status_code,
      log.cache_hit ? 1 : 0,
      log.tempo_resposta_ms,
      log.erro || null
    ).run();
  } catch (e) {
    console.warn('Erro ao registrar log Cosmos:', e);
  }
}

// ===== UTILITÁRIOS =====

/**
 * Limpa cache em memória
 */
export function limparCacheMemoria(): void {
  cacheMemoria.clear();
}

/**
 * Obtém estatísticas do cache em memória
 */
export function obterEstatisticasCacheMemoria(): {
  total_itens: number;
  itens_validos: number;
  itens_expirados: number;
} {
  const agora = Date.now();
  let validos = 0;
  let expirados = 0;

  for (const item of cacheMemoria.values()) {
    if (item.expires_at > agora) {
      validos++;
    } else {
      expirados++;
    }
  }

  return {
    total_itens: cacheMemoria.size,
    itens_validos: validos,
    itens_expirados: expirados,
  };
}

/**
 * Valida GTIN (EAN-8, EAN-13, UPC-A)
 */
export function validarGtin(gtin: string): boolean {
  const gtinLimpo = gtin.replace(/\D/g, '');
  
  if (![8, 12, 13, 14].includes(gtinLimpo.length)) {
    return false;
  }

  // Validar dígito verificador
  const digitos = gtinLimpo.split('').map(Number);
  const digitoVerificador = digitos.pop()!;
  
  let soma = 0;
  const multiplicadores = gtinLimpo.length === 8 ? [3, 1, 3, 1, 3, 1, 3] : 
    digitos.map((_, i) => (i % 2 === 0 ? 1 : 3));
  
  for (let i = 0; i < digitos.length; i++) {
    soma += digitos[i] * multiplicadores[i];
  }

  const digitoCalculado = (10 - (soma % 10)) % 10;
  return digitoCalculado === digitoVerificador;
}
