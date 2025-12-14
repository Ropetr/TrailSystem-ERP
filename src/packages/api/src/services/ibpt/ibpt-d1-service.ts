// =============================================
// PLANAC ERP - IBPT D1 Service
// Persistência em Cloudflare D1
// =============================================

import type {
  IBPTRegistro,
  IBPTRegistroNBS,
  IBPTCalculoTributos,
  IBPTMetadados,
  IBPTItemCalculo,
  IBPTResultadoLote,
} from './ibpt-types';

// ===== TIPOS D1 =====

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: object;
}

interface D1ExecResult {
  count: number;
  duration: number;
}

// ===== CONSULTAS =====

/**
 * Busca alíquota IBPT por NCM no D1
 */
export async function buscarPorNCM_D1(
  db: D1Database,
  ncm: string,
  uf: string,
  ex?: string
): Promise<IBPTRegistro | null> {
  const ncmLimpo = ncm.replace(/\D/g, '');
  
  // Busca exata
  const queryExata = `
    SELECT * FROM ibpt_aliquotas 
    WHERE ncm = ? AND uf = ? AND ex = ?
    AND (vigencia_fim >= date('now') OR vigencia_fim IS NULL)
    LIMIT 1
  `;
  
  const resultExato = await db
    .prepare(queryExata)
    .bind(ncmLimpo, uf.toUpperCase(), ex || '')
    .first<IBPTRegistro>();
  
  if (resultExato) {
    return resultExato;
  }
  
  // Busca genérica (NCM parcial)
  const queryGenerica = `
    SELECT * FROM ibpt_aliquotas 
    WHERE uf = ? AND ncm LIKE ?
    AND (vigencia_fim >= date('now') OR vigencia_fim IS NULL)
    ORDER BY length(ncm) DESC
    LIMIT 1
  `;
  
  // Tentar com NCMs progressivamente menores
  for (let len = 7; len >= 4; len--) {
    const ncmParcial = ncmLimpo.substring(0, len) + '%';
    const result = await db
      .prepare(queryGenerica)
      .bind(uf.toUpperCase(), ncmParcial)
      .first<IBPTRegistro>();
    
    if (result) {
      return result;
    }
  }
  
  return null;
}

/**
 * Busca alíquota NBS por código no D1
 */
export async function buscarPorNBS_D1(
  db: D1Database,
  nbs: string,
  uf: string
): Promise<IBPTRegistroNBS | null> {
  const nbsLimpo = nbs.replace(/\D/g, '');
  
  const query = `
    SELECT * FROM ibpt_nbs 
    WHERE nbs = ? AND uf = ?
    AND (vigencia_fim >= date('now') OR vigencia_fim IS NULL)
    LIMIT 1
  `;
  
  return db
    .prepare(query)
    .bind(nbsLimpo, uf.toUpperCase())
    .first<IBPTRegistroNBS>();
}

/**
 * Calcula tributos usando D1
 */
export async function calcularTributos_D1(
  db: D1Database,
  ncm: string,
  uf: string,
  valor: number,
  origem: number = 0,
  ex?: string
): Promise<IBPTCalculoTributos> {
  const registro = await buscarPorNCM_D1(db, ncm, uf, ex);
  
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
  
  const isImportado = origem > 0;
  
  const aliquotaFederal = isImportado 
    ? registro.aliquota_importado_federal 
    : registro.aliquota_nacional_federal;
  const aliquotaEstadual = registro.aliquota_estadual;
  const aliquotaMunicipal = registro.aliquota_municipal;
  const aliquotaTotal = aliquotaFederal + aliquotaEstadual + aliquotaMunicipal;
  
  const valorFederal = arredondar(valor * (aliquotaFederal / 100));
  const valorEstadual = arredondar(valor * (aliquotaEstadual / 100));
  const valorMunicipal = arredondar(valor * (aliquotaMunicipal / 100));
  const valorTotal = arredondar(valorFederal + valorEstadual + valorMunicipal);
  
  return {
    valor_base: valor,
    origem,
    tributos_federais: { aliquota: aliquotaFederal, valor: valorFederal },
    tributos_estaduais: { aliquota: aliquotaEstadual, valor: valorEstadual },
    tributos_municipais: { aliquota: aliquotaMunicipal, valor: valorMunicipal },
    total: { aliquota: aliquotaTotal, valor: valorTotal },
    fonte: registro.fonte || 'IBPT',
    chave_ibpt: registro.chave_ibpt || '',
  };
}

/**
 * Calcula tributos em lote usando D1
 */
export async function calcularTributosLote_D1(
  db: D1Database,
  uf: string,
  itens: IBPTItemCalculo[]
): Promise<IBPTResultadoLote> {
  const resultados: Array<IBPTItemCalculo & IBPTCalculoTributos> = [];
  
  let totalValorProdutos = 0;
  let totalFederais = 0;
  let totalEstaduais = 0;
  let totalMunicipais = 0;
  
  for (const item of itens) {
    const calculo = await calcularTributos_D1(
      db,
      item.ncm,
      uf,
      item.valor,
      item.origem,
      item.ex
    );
    
    resultados.push({ ...item, ...calculo });
    
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

// ===== IMPORTAÇÃO =====

/**
 * Importa tabela IBPT do CSV para D1
 */
export async function importarCSV_D1(
  db: D1Database,
  csv: string,
  uf: string
): Promise<{ registros: number; erros: string[] }> {
  const linhas = csv.split('\n');
  const erros: string[] = [];
  let registrosImportados = 0;
  
  // Preparar statements
  const insertStmt = `
    INSERT OR REPLACE INTO ibpt_aliquotas (
      ncm, ex, tipo, uf, descricao,
      aliquota_nacional_federal, aliquota_importado_federal,
      aliquota_estadual, aliquota_municipal,
      vigencia_inicio, vigencia_fim,
      chave_ibpt, versao, fonte, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `;
  
  // Processar em lotes de 100
  const batchSize = 100;
  let batch: D1PreparedStatement[] = [];
  
  const inicio = linhas[0]?.includes('NCM') || linhas[0]?.includes('codigo') ? 1 : 0;
  
  for (let i = inicio; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;
    
    try {
      const campos = linha.split(';');
      if (campos.length < 13) {
        erros.push(`Linha ${i + 1}: campos insuficientes`);
        continue;
      }
      
      const stmt = db.prepare(insertStmt).bind(
        campos[0].replace(/\D/g, ''),           // ncm
        campos[1] || '',                         // ex
        campos[2] === '1' ? 1 : 0,              // tipo
        uf.toUpperCase(),                        // uf
        campos[3],                               // descricao
        parseFloat(campos[4].replace(',', '.')) || 0,  // nacional_federal
        parseFloat(campos[5].replace(',', '.')) || 0,  // importado_federal
        parseFloat(campos[6].replace(',', '.')) || 0,  // estadual
        parseFloat(campos[7].replace(',', '.')) || 0,  // municipal
        campos[8],                               // vigencia_inicio
        campos[9],                               // vigencia_fim
        campos[10],                              // chave_ibpt
        campos[11],                              // versao
        campos[12]                               // fonte
      );
      
      batch.push(stmt);
      
      // Executar batch quando atingir tamanho
      if (batch.length >= batchSize) {
        await db.batch(batch);
        registrosImportados += batch.length;
        batch = [];
      }
    } catch (e) {
      erros.push(`Linha ${i + 1}: ${e}`);
    }
  }
  
  // Executar batch restante
  if (batch.length > 0) {
    await db.batch(batch);
    registrosImportados += batch.length;
  }
  
  // Registrar importação
  await db.prepare(`
    INSERT INTO ibpt_importacoes (uf, versao, total_registros, status)
    VALUES (?, ?, ?, 'concluido')
  `).bind(uf.toUpperCase(), new Date().toISOString().split('T')[0], registrosImportados).run();
  
  return { registros: registrosImportados, erros };
}

/**
 * Obtém metadados da última importação
 */
export async function obterMetadados_D1(
  db: D1Database,
  uf: string
): Promise<IBPTMetadados | null> {
  const query = `
    SELECT 
      versao,
      importado_em as data_atualizacao,
      uf,
      total_registros,
      vigencia_inicio,
      vigencia_fim
    FROM ibpt_importacoes
    WHERE uf = ? AND status = 'concluido'
    ORDER BY importado_em DESC
    LIMIT 1
  `;
  
  return db.prepare(query).bind(uf.toUpperCase()).first<IBPTMetadados>();
}

/**
 * Conta registros por UF
 */
export async function contarRegistros_D1(
  db: D1Database,
  uf?: string
): Promise<{ uf: string; total: number }[]> {
  const query = uf
    ? `SELECT uf, COUNT(*) as total FROM ibpt_aliquotas WHERE uf = ? GROUP BY uf`
    : `SELECT uf, COUNT(*) as total FROM ibpt_aliquotas GROUP BY uf`;
  
  const result = uf
    ? await db.prepare(query).bind(uf.toUpperCase()).all<{ uf: string; total: number }>()
    : await db.prepare(query).all<{ uf: string; total: number }>();
  
  return result.results || [];
}

/**
 * Limpa registros antigos
 */
export async function limparRegistrosAntigos_D1(
  db: D1Database,
  diasAntigos: number = 30
): Promise<number> {
  const result = await db.prepare(`
    DELETE FROM ibpt_aliquotas 
    WHERE vigencia_fim < date('now', '-' || ? || ' days')
  `).bind(diasAntigos).run();
  
  return result.meta ? (result.meta as any).changes || 0 : 0;
}

// ===== UTILITÁRIOS =====

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}
