// =============================================
// PLANAC ERP - Tributação Service
// Consulta de tributação por NCM
// =============================================

import type {
  TributacaoNCM,
  ConsultaTributacaoParams,
  ConsultaTributacaoResultado,
  TributacaoProduto,
} from './tributacao-types';

export async function consultarTributacaoPorNCM(
  db: D1Database,
  params: ConsultaTributacaoParams
): Promise<ConsultaTributacaoResultado> {
  const inicio = Date.now();
  const ncmLimpo = params.ncm.replace(/\D/g, '');
  
  if (ncmLimpo.length < 4 || ncmLimpo.length > 8) {
    return {
      ncm: ncmLimpo,
      tributacao: { ncm: ncmLimpo },
      tempo_resposta_ms: Date.now() - inicio,
      status: 'nao_encontrado',
      mensagem: 'NCM deve ter entre 4 e 8 dígitos',
    };
  }

  const tributacao: TributacaoNCM = { ncm: ncmLimpo };
  let encontrouAlgo = false;

  try {
    const ipi = await db.prepare(`
      SELECT ncm, ex, descricao, aliquota, vigencia_inicio, vigencia_fim
      FROM ipi_tipi
      WHERE ncm = ? AND ativo = 1
        AND vigencia_inicio <= date('now')
        AND (vigencia_fim IS NULL OR vigencia_fim >= date('now'))
      ORDER BY vigencia_inicio DESC
      LIMIT 1
    `).bind(ncmLimpo).first<{
      ncm: string;
      ex: string | null;
      descricao: string | null;
      aliquota: number;
      vigencia_inicio: string;
      vigencia_fim: string | null;
    }>();

    if (ipi) {
      tributacao.ipi = {
        aliquota: ipi.aliquota,
        ex: ipi.ex || undefined,
        descricao: ipi.descricao || undefined,
        vigencia_inicio: ipi.vigencia_inicio,
        vigencia_fim: ipi.vigencia_fim || undefined,
      };
      encontrouAlgo = true;
    }
  } catch {
    // Tabela pode não existir ainda
  }

  try {
    let mvaQuery = `
      SELECT uf_origem, uf_destino, mva_original, mva_ajustada, mva_importado,
             cest, protocolo, vigencia_inicio, vigencia_fim
      FROM icms_st_mva
      WHERE (ncm = ? OR (ncm_inicio <= ? AND ncm_fim >= ?))
        AND ativo = 1
        AND vigencia_inicio <= date('now')
        AND (vigencia_fim IS NULL OR vigencia_fim >= date('now'))
    `;
    const mvaParams: string[] = [ncmLimpo, ncmLimpo, ncmLimpo];

    if (params.uf_origem) {
      mvaQuery += ' AND uf_origem = ?';
      mvaParams.push(params.uf_origem);
    }
    if (params.uf_destino) {
      mvaQuery += ' AND uf_destino = ?';
      mvaParams.push(params.uf_destino);
    }

    mvaQuery += ' ORDER BY vigencia_inicio DESC LIMIT 10';

    const mvaResults = await db.prepare(mvaQuery).bind(...mvaParams).all<{
      uf_origem: string;
      uf_destino: string;
      mva_original: number;
      mva_ajustada: number | null;
      mva_importado: number | null;
      cest: string | null;
      protocolo: string | null;
      vigencia_inicio: string;
      vigencia_fim: string | null;
    }>();

    if (mvaResults.results && mvaResults.results.length > 0) {
      tributacao.icms_st = mvaResults.results.map(m => ({
        uf_origem: m.uf_origem,
        uf_destino: m.uf_destino,
        mva_original: m.mva_original,
        mva_ajustada: m.mva_ajustada || undefined,
        mva_importado: m.mva_importado || undefined,
        cest: m.cest || undefined,
        protocolo: m.protocolo || undefined,
        vigencia_inicio: m.vigencia_inicio,
        vigencia_fim: m.vigencia_fim || undefined,
      }));
      encontrouAlgo = true;
    }
  } catch {
    // Tabela pode não existir ainda
  }

  try {
    let fcpQuery = `
      SELECT uf, aliquota_fcp, aliquota_fcp_st, aliquota_fcp_difal,
             vigencia_inicio, vigencia_fim
      FROM fcp_uf
      WHERE ativo = 1
        AND vigencia_inicio <= date('now')
        AND (vigencia_fim IS NULL OR vigencia_fim >= date('now'))
    `;
    const fcpParams: string[] = [];

    if (params.uf_destino) {
      fcpQuery += ' AND uf = ?';
      fcpParams.push(params.uf_destino);
    }

    fcpQuery += ' ORDER BY uf, vigencia_inicio DESC';

    const fcpResults = await db.prepare(fcpQuery).bind(...fcpParams).all<{
      uf: string;
      aliquota_fcp: number;
      aliquota_fcp_st: number | null;
      aliquota_fcp_difal: number | null;
      vigencia_inicio: string;
      vigencia_fim: string | null;
    }>();

    if (fcpResults.results && fcpResults.results.length > 0) {
      tributacao.fcp = fcpResults.results.map(f => ({
        uf: f.uf,
        aliquota_fcp: f.aliquota_fcp,
        aliquota_fcp_st: f.aliquota_fcp_st || undefined,
        aliquota_fcp_difal: f.aliquota_fcp_difal || undefined,
        vigencia_inicio: f.vigencia_inicio,
        vigencia_fim: f.vigencia_fim || undefined,
      }));
      encontrouAlgo = true;
    }
  } catch {
    // Tabela pode não existir ainda
  }

  try {
    const cest = await db.prepare(`
      SELECT codigo, descricao, segmento
      FROM cest
      WHERE ncm_lista LIKE ? AND ativo = 1
        AND (vigencia_fim IS NULL OR vigencia_fim >= date('now'))
      LIMIT 1
    `).bind(`%${ncmLimpo}%`).first<{
      codigo: string;
      descricao: string;
      segmento: string | null;
    }>();

    if (cest) {
      tributacao.cest = {
        codigo: cest.codigo,
        descricao: cest.descricao,
        segmento: cest.segmento || undefined,
      };
      encontrouAlgo = true;
    }
  } catch {
    // Tabela pode não existir ainda
  }

  try {
    let pisQuery = `
      SELECT regime, cst_pis, cst_cofins, aliquota_pis, aliquota_cofins
      FROM pis_cofins_tabelas
      WHERE (ncm_lista LIKE ? OR ncm_lista IS NULL)
        AND ativo = 1
        AND (vigencia_fim IS NULL OR vigencia_fim >= date('now'))
    `;
    const pisParams: string[] = [`%${ncmLimpo}%`];

    if (params.regime) {
      const regimeMap: Record<string, string> = {
        'simples': 'cumulativo',
        'lucro_presumido': 'cumulativo',
        'lucro_real': 'nao_cumulativo',
      };
      pisQuery += ' AND regime = ?';
      pisParams.push(regimeMap[params.regime] || 'cumulativo');
    }

    pisQuery += ' ORDER BY regime LIMIT 5';

    const pisResults = await db.prepare(pisQuery).bind(...pisParams).all<{
      regime: string;
      cst_pis: string;
      cst_cofins: string;
      aliquota_pis: number;
      aliquota_cofins: number;
    }>();

    if (pisResults.results && pisResults.results.length > 0) {
      tributacao.pis_cofins = pisResults.results.map(p => ({
        regime: p.regime,
        cst_pis: p.cst_pis,
        cst_cofins: p.cst_cofins,
        aliquota_pis: p.aliquota_pis,
        aliquota_cofins: p.aliquota_cofins,
      }));
      encontrouAlgo = true;
    }
  } catch {
    // Tabela pode não existir ainda
  }

  try {
    let benefQuery = `
      SELECT bf.uf, bf.codigo, bf.nome, bf.tipo, 
             bf.percentual_reducao, bf.aliquota_efetiva,
             bf.vigencia_inicio, bf.vigencia_fim
      FROM beneficios_fiscais bf
      INNER JOIN beneficios_fiscais_regras bfr ON bf.id = bfr.beneficio_id
      WHERE (bfr.ncm_inicio <= ? AND (bfr.ncm_fim >= ? OR bfr.ncm_fim IS NULL))
         OR bfr.ncm_lista LIKE ?
        AND bf.ativo = 1 AND bfr.ativo = 1
        AND bf.vigencia_inicio <= date('now')
        AND (bf.vigencia_fim IS NULL OR bf.vigencia_fim >= date('now'))
    `;
    const benefParams: string[] = [ncmLimpo, ncmLimpo, `%${ncmLimpo}%`];

    if (params.uf_destino) {
      benefQuery += ' AND bf.uf = ?';
      benefParams.push(params.uf_destino);
    }

    benefQuery += ' ORDER BY bfr.prioridade LIMIT 10';

    const benefResults = await db.prepare(benefQuery).bind(...benefParams).all<{
      uf: string;
      codigo: string;
      nome: string;
      tipo: string;
      percentual_reducao: number | null;
      aliquota_efetiva: number | null;
      vigencia_inicio: string;
      vigencia_fim: string | null;
    }>();

    if (benefResults.results && benefResults.results.length > 0) {
      tributacao.beneficios = benefResults.results.map(b => ({
        uf: b.uf,
        codigo: b.codigo,
        nome: b.nome,
        tipo: b.tipo,
        percentual_reducao: b.percentual_reducao || undefined,
        aliquota_efetiva: b.aliquota_efetiva || undefined,
        vigencia_inicio: b.vigencia_inicio,
        vigencia_fim: b.vigencia_fim || undefined,
      }));
      encontrouAlgo = true;
    }
  } catch {
    // Tabela pode não existir ainda
  }

  return {
    ncm: ncmLimpo,
    tributacao,
    tempo_resposta_ms: Date.now() - inicio,
    status: encontrouAlgo ? 'encontrado' : 'nao_encontrado',
    mensagem: encontrouAlgo 
      ? undefined 
      : 'Nenhuma regra de tributação encontrada para este NCM. As tabelas de referência (TIPI, MVA, FCP) precisam ser importadas.',
  };
}

export async function consultarTributacaoProduto(
  db: D1Database,
  empresaId: string,
  produtoId: string,
  params?: { uf_origem?: string; uf_destino?: string; regime?: 'simples' | 'lucro_presumido' | 'lucro_real' }
): Promise<TributacaoProduto | null> {
  const produto = await db.prepare(`
    SELECT id, ncm, cest FROM produtos WHERE id = ? AND empresa_id = ?
  `).bind(produtoId, empresaId).first<{ id: string; ncm: string | null; cest: string | null }>();

  if (!produto || !produto.ncm) {
    return null;
  }

  const resultado = await consultarTributacaoPorNCM(db, {
    ncm: produto.ncm,
    uf_origem: params?.uf_origem,
    uf_destino: params?.uf_destino,
    regime: params?.regime,
  });

  const sugestoes: TributacaoProduto['sugestoes'] = {};

  if (resultado.tributacao.ipi) {
    sugestoes.cst_ipi_sugerido = resultado.tributacao.ipi.aliquota > 0 ? '00' : '03';
  }

  if (resultado.tributacao.pis_cofins && resultado.tributacao.pis_cofins.length > 0) {
    sugestoes.cst_pis_sugerido = resultado.tributacao.pis_cofins[0].cst_pis;
    sugestoes.cst_cofins_sugerido = resultado.tributacao.pis_cofins[0].cst_cofins;
  }

  if (resultado.tributacao.icms_st && resultado.tributacao.icms_st.length > 0) {
    sugestoes.cst_icms_sugerido = '10';
    sugestoes.csosn_sugerido = '201';
  } else {
    sugestoes.cst_icms_sugerido = '00';
    sugestoes.csosn_sugerido = '102';
  }

  if (resultado.tributacao.beneficios && resultado.tributacao.beneficios.length > 0) {
    const beneficio = resultado.tributacao.beneficios[0];
    if (beneficio.tipo === 'isencao') {
      sugestoes.cst_icms_sugerido = '40';
      sugestoes.csosn_sugerido = '400';
    } else if (beneficio.tipo === 'reducao_base') {
      sugestoes.cst_icms_sugerido = '20';
      sugestoes.csosn_sugerido = '900';
    }
  }

  return {
    produto_id: produto.id,
    ncm: produto.ncm,
    cest: produto.cest || undefined,
    tributacao: resultado.tributacao,
    sugestoes: Object.keys(sugestoes).length > 0 ? sugestoes : undefined,
  };
}

export async function listarAliquotasIPI(
  db: D1Database,
  ncmPrefixo?: string
): Promise<{ ncm: string; ex: string | null; aliquota: number; descricao: string | null }[]> {
  let query = `
    SELECT ncm, ex, aliquota, descricao
    FROM ipi_tipi
    WHERE ativo = 1
      AND vigencia_inicio <= date('now')
      AND (vigencia_fim IS NULL OR vigencia_fim >= date('now'))
  `;
  const params: string[] = [];

  if (ncmPrefixo) {
    query += ' AND ncm LIKE ?';
    params.push(`${ncmPrefixo}%`);
  }

  query += ' ORDER BY ncm LIMIT 100';

  try {
    const results = await db.prepare(query).bind(...params).all<{
      ncm: string;
      ex: string | null;
      aliquota: number;
      descricao: string | null;
    }>();

    return results.results || [];
  } catch {
    return [];
  }
}

export async function listarMVA(
  db: D1Database,
  ufOrigem?: string,
  ufDestino?: string
): Promise<{ uf_origem: string; uf_destino: string; ncm: string | null; mva_original: number; mva_ajustada: number | null }[]> {
  let query = `
    SELECT uf_origem, uf_destino, ncm, mva_original, mva_ajustada
    FROM icms_st_mva
    WHERE ativo = 1
      AND vigencia_inicio <= date('now')
      AND (vigencia_fim IS NULL OR vigencia_fim >= date('now'))
  `;
  const params: string[] = [];

  if (ufOrigem) {
    query += ' AND uf_origem = ?';
    params.push(ufOrigem);
  }
  if (ufDestino) {
    query += ' AND uf_destino = ?';
    params.push(ufDestino);
  }

  query += ' ORDER BY uf_origem, uf_destino, ncm LIMIT 100';

  try {
    const results = await db.prepare(query).bind(...params).all<{
      uf_origem: string;
      uf_destino: string;
      ncm: string | null;
      mva_original: number;
      mva_ajustada: number | null;
    }>();

    return results.results || [];
  } catch {
    return [];
  }
}

export async function listarFCP(
  db: D1Database,
  uf?: string
): Promise<{ uf: string; aliquota_fcp: number; aliquota_fcp_st: number | null }[]> {
  let query = `
    SELECT uf, aliquota_fcp, aliquota_fcp_st
    FROM fcp_uf
    WHERE ativo = 1
      AND vigencia_inicio <= date('now')
      AND (vigencia_fim IS NULL OR vigencia_fim >= date('now'))
  `;
  const params: string[] = [];

  if (uf) {
    query += ' AND uf = ?';
    params.push(uf);
  }

  query += ' ORDER BY uf';

  try {
    const results = await db.prepare(query).bind(...params).all<{
      uf: string;
      aliquota_fcp: number;
      aliquota_fcp_st: number | null;
    }>();

    return results.results || [];
  } catch {
    return [];
  }
}
