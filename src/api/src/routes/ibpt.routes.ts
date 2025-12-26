// =============================================
// PLANAC ERP - IBPT Routes v2
// API com cache inteligente + importação CSV
// =============================================

import { Hono } from 'hono';
import { createIBPTApiService } from '../services/ibpt/ibpt-api-service';
import { importarCSVIBPT, listarImportacoes } from '../services/ibpt/ibpt-csv-importer';
import { jobAtualizarTabelaIBPT, verificarNecessidadeAtualizacao } from '../services/ibpt/ibpt-auto-update-job';

interface Env {
  DB: D1Database;
  DB_IBPT: D1Database;
  IBPT_TOKEN?: string;
}

const ibpt = new Hono<{ Bindings: Env }>();

// ===== CONSULTAS =====

/**
 * Consulta alíquota IBPT por NCM
 * GET /ibpt/consultar/:ncm?uf=PR&ex=0&descricao=Produto&valor=100
 */
ibpt.get('/consultar/:ncm', async (c) => {
  try {
    const { ncm } = c.req.param();
    const { uf, ex, descricao, valor, unidade, origem } = c.req.query();

    // Buscar token da empresa
    const config = await buscarConfigIBPT(c.env);
    if (!config) {
      return c.json({ error: 'Token IBPT não configurado. Configure em Empresas > Configurações > IBPT' }, 400);
    }

    const service = createIBPTApiService(c.env.DB_IBPT, config);

    const resultado = await service.calcularTributosCompleto(
      {
        codigo: ncm,
        uf: uf || config.uf,
        ex: ex ? parseInt(ex) : 0,
        descricao: descricao || 'Produto',
        unidadeMedida: unidade || 'UN',
        valor: valor ? parseFloat(valor) : 100,
      },
      (origem as 'nacional' | 'importado') || 'nacional'
    );

    return c.json(resultado);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Consulta alíquota IBPT por NBS (serviços)
 * GET /ibpt/servico/:nbs?uf=PR&descricao=Servico&valor=100
 */
ibpt.get('/servico/:nbs', async (c) => {
  try {
    const { nbs } = c.req.param();
    const { uf, descricao, valor, unidade } = c.req.query();

    const config = await buscarConfigIBPT(c.env);
    if (!config) {
      return c.json({ error: 'Token IBPT não configurado' }, 400);
    }

    const service = createIBPTApiService(c.env.DB_IBPT, config);

    const resultado = await service.consultarServico({
      codigo: nbs,
      uf: uf || config.uf,
      descricao: descricao || 'Serviço',
      unidadeMedida: unidade || 'UN',
      valor: valor ? parseFloat(valor) : 100,
    });

    return c.json(resultado);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Calcula tributos para múltiplos itens
 * POST /ibpt/calcular/lote
 * Body: { uf: "PR", itens: [{ codigo, descricao, unidadeMedida, valor, origem? }] }
 */
ibpt.post('/calcular/lote', async (c) => {
  try {
    const body = await c.req.json<{
      uf: string;
      itens: Array<{
        codigo: string;
        descricao: string;
        unidadeMedida: string;
        valor: number;
        origem?: 'nacional' | 'importado';
      }>;
    }>();

    if (!body.itens || !Array.isArray(body.itens)) {
      return c.json({ error: 'Array de itens é obrigatório' }, 400);
    }

    const config = await buscarConfigIBPT(c.env);
    if (!config) {
      return c.json({ error: 'Token IBPT não configurado' }, 400);
    }

    const service = createIBPTApiService(c.env.DB_IBPT, config);
    const resultado = await service.consultarLote(body.itens, body.uf || config.uf);

    return c.json(resultado);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== IMPORTAÇÃO CSV =====

/**
 * Importa arquivo CSV do IBPT
 * POST /ibpt/importar/csv
 * Body: multipart/form-data com arquivo CSV
 */
ibpt.post('/importar/csv', async (c) => {
  try {
    const formData = await c.req.formData();
    const arquivo = formData.get('arquivo') as File | null;
    const uf = formData.get('uf') as string | null;

    if (!arquivo) {
      return c.json({ error: 'Arquivo CSV é obrigatório' }, 400);
    }

    if (!uf) {
      return c.json({ error: 'UF é obrigatória' }, 400);
    }

    // Ler conteúdo do arquivo
    const csvContent = await arquivo.text();

    // Importar
    const resultado = await importarCSVIBPT(c.env.DB_IBPT, csvContent, uf);

    if (!resultado.sucesso) {
      return c.json({
        error: 'Falha na importação',
        detalhes: resultado,
      }, 400);
    }

    return c.json({
      success: true,
      message: `Importação concluída: ${resultado.registros_inseridos} registros`,
      ...resultado,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Lista histórico de importações
 * GET /ibpt/importacoes?uf=PR
 */
ibpt.get('/importacoes', async (c) => {
  try {
    const { uf } = c.req.query();
    const importacoes = await listarImportacoes(c.env.DB_IBPT, uf);
    return c.json({ data: importacoes });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== ATUALIZAÇÃO AUTOMÁTICA =====

/**
 * Verifica se precisa atualizar a tabela
 * GET /ibpt/status/atualizacao
 */
ibpt.get('/status/atualizacao', async (c) => {
  try {
    const status = await verificarNecessidadeAtualizacao(c.env as any);
    return c.json(status);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Força atualização manual da tabela
 * POST /ibpt/atualizar
 */
ibpt.post('/atualizar', async (c) => {
  try {
    // Verificar se é admin ou cron
    const authHeader = c.req.header('Authorization');
    const cronSecret = c.req.header('X-Cron-Secret');
    
    // Em produção, validar autenticação
    
    const resultado = await jobAtualizarTabelaIBPT(c.env as any);

    return c.json({
      success: resultado.sucesso,
      message: resultado.sucesso 
        ? `Atualização concluída: ${resultado.registros_atualizados} registros`
        : 'Falha na atualização',
      ...resultado,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== CACHE =====

/**
 * Estatísticas do cache
 * GET /ibpt/cache/estatisticas
 */
ibpt.get('/cache/estatisticas', async (c) => {
  try {
    const config = await buscarConfigIBPT(c.env);
    if (!config) {
      // Retornar estatísticas mesmo sem token
      const stats = await c.env.DB_IBPT.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN vigencia_fim >= date('now') THEN 1 ELSE 0 END) as validos,
          SUM(CASE WHEN vigencia_fim < date('now') THEN 1 ELSE 0 END) as expirados,
          MAX(atualizado_em) as ultima_atualizacao
        FROM ibpt_cache
      `).first<any>();

      return c.json({
        total_registros: stats?.total || 0,
        registros_validos: stats?.validos || 0,
        registros_expirados: stats?.expirados || 0,
        ultima_atualizacao: stats?.ultima_atualizacao,
        token_configurado: false,
      });
    }

    const service = createIBPTApiService(c.env.DB_IBPT, config);
    const estatisticas = await service.obterEstatisticasCache();

    return c.json({
      ...estatisticas,
      token_configurado: true,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Busca registro específico do cache
 * GET /ibpt/cache/:codigo?uf=PR&ex=0
 */
ibpt.get('/cache/:codigo', async (c) => {
  try {
    const { codigo } = c.req.param();
    const { uf, ex } = c.req.query();

    const result = await c.env.DB_IBPT
      .prepare(`
        SELECT * FROM ibpt_cache 
        WHERE codigo = ? AND uf = ? AND ex = ?
      `)
      .bind(codigo, uf || 'PR', ex ? parseInt(ex) : 0)
      .first();

    if (!result) {
      return c.json({ error: 'Registro não encontrado no cache' }, 404);
    }

    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Limpa cache antigo
 * DELETE /ibpt/cache/antigos?dias=180
 */
ibpt.delete('/cache/antigos', async (c) => {
  try {
    const { dias } = c.req.query();
    const diasRetencao = dias ? parseInt(dias) : 180;

    const result = await c.env.DB_IBPT
      .prepare(`
        DELETE FROM ibpt_cache 
        WHERE vigencia_fim < date('now', '-' || ? || ' days')
      `)
      .bind(diasRetencao)
      .run();

    return c.json({
      success: true,
      registros_removidos: result.meta?.changes || 0,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== CONFIGURAÇÃO =====

/**
 * Verifica configuração IBPT da empresa
 * GET /ibpt/config
 */
ibpt.get('/config', async (c) => {
  try {
    const config = await buscarConfigIBPT(c.env);
    
    return c.json({
      configurado: !!config,
      uf: config?.uf || null,
      cnpj: config ? `${config.cnpj.substring(0, 8)}****` : null,
      token_parcial: config ? `${config.token.substring(0, 4)}****` : null,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== TEXTO LEI TRANSPARÊNCIA =====

/**
 * Gera texto para NF-e (infCpl)
 * POST /ibpt/texto-nfe
 * Body: { itens: [{ codigo, descricao, valor, origem? }], uf: "PR" }
 */
ibpt.post('/texto-nfe', async (c) => {
  try {
    const body = await c.req.json<{
      itens: Array<{
        codigo: string;
        descricao: string;
        valor: number;
        origem?: 'nacional' | 'importado';
      }>;
      uf?: string;
    }>();

    const config = await buscarConfigIBPT(c.env);
    if (!config) {
      return c.json({ error: 'Token IBPT não configurado' }, 400);
    }

    const service = createIBPTApiService(c.env.DB_IBPT, config);
    
    const resultado = await service.consultarLote(
      body.itens.map(i => ({
        codigo: i.codigo,
        descricao: i.descricao,
        unidadeMedida: 'UN',
        valor: i.valor,
        origem: i.origem,
      })),
      body.uf || config.uf
    );

    // Gerar texto para infCpl
    const { tributo_federal, tributo_estadual, tributo_municipal, tributo_total } = resultado.totais;
    
    const textoInfCpl = `Val Aprox Tributos R$ ${tributo_total.toFixed(2)} ` +
      `(${tributo_federal.toFixed(2)} Federal, ${tributo_estadual.toFixed(2)} Estadual, ${tributo_municipal.toFixed(2)} Municipal) ` +
      `Fonte: IBPT - Lei 12.741/2012`;

    // Gerar texto resumido (para cupom fiscal)
    const textoResumido = `Tributos Aprox: R$ ${tributo_total.toFixed(2)} (Lei 12.741/12)`;

    return c.json({
      texto_infCpl: textoInfCpl,
      texto_resumido: textoResumido,
      vTotTrib: tributo_total,
      totais: resultado.totais,
      itens: resultado.itens.map(i => ({
        codigo: i.codigo,
        vTotTrib: i.valor_tributo_total,
        infAdProd: `Trib aprox R$${i.valor_tributo_total.toFixed(2)}`,
      })),
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== HEALTH =====

ibpt.get('/health', async (c) => {
  try {
    const [cacheCount, config] = await Promise.all([
      c.env.DB_IBPT.prepare('SELECT COUNT(*) as count FROM ibpt_cache').first<{ count: number }>(),
      buscarConfigIBPT(c.env),
    ]);

    return c.json({
      status: 'healthy',
      cache_registros: cacheCount?.count || 0,
      token_configurado: !!config,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return c.json({
      status: 'unhealthy',
      error: error.message,
    }, 503);
  }
});

// ===== HELPER =====

async function buscarConfigIBPT(env: Env): Promise<{ token: string; cnpj: string; uf: string } | null> {
  // Primeiro tenta variável de ambiente
  if (env.IBPT_TOKEN) {
    const empresa = await env.DB
      .prepare('SELECT cnpj, ibpt_uf FROM empresas_config WHERE ativo = 1 LIMIT 1')
      .first<{ cnpj: string; ibpt_uf: string }>();

    if (empresa) {
      return {
        token: env.IBPT_TOKEN,
        cnpj: empresa.cnpj,
        uf: empresa.ibpt_uf || 'PR',
      };
    }
  }

  // Senão, busca do cadastro de empresas
  const empresaComToken = await env.DB
    .prepare(`
      SELECT cnpj, ibpt_token, ibpt_uf 
      FROM empresas_config 
      WHERE ibpt_token IS NOT NULL AND ibpt_token != '' AND ativo = 1
      LIMIT 1
    `)
    .first<{ cnpj: string; ibpt_token: string; ibpt_uf: string }>();

  if (empresaComToken) {
    return {
      token: empresaComToken.ibpt_token,
      cnpj: empresaComToken.cnpj,
      uf: empresaComToken.ibpt_uf || 'PR',
    };
  }

  return null;
}

export default ibpt;

