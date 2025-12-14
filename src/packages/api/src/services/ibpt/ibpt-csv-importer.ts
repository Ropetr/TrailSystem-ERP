// =============================================
// PLANAC ERP - IBPT CSV Importer
// Importação de tabela CSV oficial do IBPT
// =============================================

export interface IBPTCSVRecord {
  codigo: string;
  ex: string;
  tipo: string;
  descricao: string;
  nacionalfederal: string;
  importadosfederal: string;
  estadual: string;
  municipal: string;
  vigenciainicio: string;
  vigenciafim: string;
  chave: string;
  versao: string;
  fonte: string;
}

export interface ImportacaoResultado {
  sucesso: boolean;
  uf: string;
  registros_processados: number;
  registros_inseridos: number;
  registros_atualizados: number;
  registros_erro: number;
  versao: string;
  vigencia_fim: string;
  tempo_ms: number;
  erros: string[];
}

/**
 * Importa arquivo CSV do IBPT para o banco D1
 * Formato esperado: arquivo CSV baixado do deolhonoimposto.ibpt.org.br
 */
export async function importarCSVIBPT(
  db: D1Database,
  csvContent: string,
  uf: string
): Promise<ImportacaoResultado> {
  const inicio = Date.now();
  const erros: string[] = [];
  let registrosProcessados = 0;
  let registrosInseridos = 0;
  let registrosAtualizados = 0;
  let registrosErro = 0;
  let versao = '';
  let vigenciaFim = '';

  try {
    // 1. Parsear CSV
    const linhas = csvContent.split('\n');
    const cabecalho = linhas[0].toLowerCase();
    
    // Detectar delimitador (pode ser ; ou ,)
    const delimitador = cabecalho.includes(';') ? ';' : ',';
    
    // Mapear colunas
    const colunas = cabecalho.split(delimitador).map(c => c.trim().replace(/"/g, ''));
    const indiceMap: Record<string, number> = {};
    
    colunas.forEach((col, idx) => {
      // Normalizar nomes de colunas
      const colNorm = col
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .toLowerCase()
        .replace(/\s+/g, '');
      indiceMap[colNorm] = idx;
    });

    // Mapear índices esperados
    const getIndex = (possibleNames: string[]): number => {
      for (const name of possibleNames) {
        if (indiceMap[name] !== undefined) return indiceMap[name];
      }
      return -1;
    };

    const indices = {
      codigo: getIndex(['codigo', 'ncm', 'nbs', 'cod']),
      ex: getIndex(['ex', 'extarif', 'excecao']),
      tipo: getIndex(['tipo']),
      descricao: getIndex(['descricao', 'desc']),
      nacionalfederal: getIndex(['nacionalfederal', 'nacional', 'aliqnacional', 'aliquotanacional']),
      importadosfederal: getIndex(['importadosfederal', 'importado', 'aliqimportado', 'aliquotaimportado']),
      estadual: getIndex(['estadual', 'aliqestadual', 'aliquotaestadual']),
      municipal: getIndex(['municipal', 'aliqmunicipal', 'aliquotamunicipal']),
      vigenciainicio: getIndex(['vigenciainicio', 'inicio', 'dtinicio']),
      vigenciafim: getIndex(['vigenciafim', 'fim', 'dtfim']),
      versao: getIndex(['versao', 'ver']),
      fonte: getIndex(['fonte']),
    };

    // Validar colunas obrigatórias
    if (indices.codigo === -1) {
      throw new Error('Coluna "codigo" não encontrada no CSV');
    }

    // 2. Processar em lotes
    const BATCH_SIZE = 100;
    const registros: any[] = [];

    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      if (!linha) continue;

      registrosProcessados++;

      try {
        const valores = parseCSVLine(linha, delimitador);
        
        const codigo = valores[indices.codigo]?.replace(/"/g, '').trim();
        if (!codigo) continue;

        const record = {
          codigo,
          tipo: indices.tipo !== -1 ? (valores[indices.tipo]?.includes('NBS') || valores[indices.tipo] === '1' ? 'NBS' : 'NCM') : 'NCM',
          uf: uf.toUpperCase(),
          ex: indices.ex !== -1 ? parseInt(valores[indices.ex] || '0') || 0 : 0,
          descricao: indices.descricao !== -1 ? valores[indices.descricao]?.replace(/"/g, '').trim().substring(0, 500) : '',
          aliquota_nacional: parseFloat(valores[indices.nacionalfederal]?.replace(',', '.') || '0') || 0,
          aliquota_importado: parseFloat(valores[indices.importadosfederal]?.replace(',', '.') || '0') || 0,
          aliquota_estadual: parseFloat(valores[indices.estadual]?.replace(',', '.') || '0') || 0,
          aliquota_municipal: parseFloat(valores[indices.municipal]?.replace(',', '.') || '0') || 0,
          vigencia_inicio: indices.vigenciainicio !== -1 ? converterData(valores[indices.vigenciainicio]) : '',
          vigencia_fim: indices.vigenciafim !== -1 ? converterData(valores[indices.vigenciafim]) : '',
          versao: indices.versao !== -1 ? valores[indices.versao]?.replace(/"/g, '').trim() : '',
          fonte: indices.fonte !== -1 ? valores[indices.fonte]?.replace(/"/g, '').trim() : 'IBPT/CSV',
        };

        // Capturar versão e vigência do primeiro registro válido
        if (!versao && record.versao) versao = record.versao;
        if (!vigenciaFim && record.vigencia_fim) vigenciaFim = record.vigencia_fim;

        registros.push(record);
      } catch (parseError: any) {
        registrosErro++;
        if (erros.length < 10) {
          erros.push(`Linha ${i + 1}: ${parseError.message}`);
        }
      }
    }

    // 3. Inserir em lotes usando transação
    for (let i = 0; i < registros.length; i += BATCH_SIZE) {
      const batch = registros.slice(i, i + BATCH_SIZE);
      
      const statements = batch.map(r => 
        db.prepare(`
          INSERT OR REPLACE INTO ibpt_cache (
            codigo, tipo, uf, ex, descricao,
            aliquota_nacional, aliquota_importado, aliquota_estadual, aliquota_municipal,
            vigencia_inicio, vigencia_fim, versao, fonte,
            consultado_em, atualizado_em
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          r.codigo, r.tipo, r.uf, r.ex, r.descricao,
          r.aliquota_nacional, r.aliquota_importado, r.aliquota_estadual, r.aliquota_municipal,
          r.vigencia_inicio, r.vigencia_fim, r.versao, r.fonte
        )
      );

      await db.batch(statements);
      registrosInseridos += batch.length;
    }

    // 4. Registrar importação
    await db.prepare(`
      INSERT INTO ibpt_importacoes (
        uf, versao, vigencia_fim, registros_total, 
        registros_inseridos, registros_erro,
        importado_em, fonte
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'CSV')
    `).bind(
      uf.toUpperCase(),
      versao,
      vigenciaFim,
      registrosProcessados,
      registrosInseridos,
      registrosErro
    ).run();

    return {
      sucesso: true,
      uf: uf.toUpperCase(),
      registros_processados: registrosProcessados,
      registros_inseridos: registrosInseridos,
      registros_atualizados: 0, // INSERT OR REPLACE não diferencia
      registros_erro: registrosErro,
      versao,
      vigencia_fim: vigenciaFim,
      tempo_ms: Date.now() - inicio,
      erros,
    };

  } catch (error: any) {
    return {
      sucesso: false,
      uf: uf.toUpperCase(),
      registros_processados: registrosProcessados,
      registros_inseridos: registrosInseridos,
      registros_atualizados: 0,
      registros_erro: registrosErro,
      versao,
      vigencia_fim: vigenciaFim,
      tempo_ms: Date.now() - inicio,
      erros: [...erros, error.message],
    };
  }
}

/**
 * Parser de linha CSV que lida com campos entre aspas
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Converte data do formato BR (DD/MM/YYYY) para ISO (YYYY-MM-DD)
 */
function converterData(data: string): string {
  if (!data) return '';
  
  const clean = data.replace(/"/g, '').trim();
  
  // Se já está em ISO
  if (clean.match(/^\d{4}-\d{2}-\d{2}/)) {
    return clean.split('T')[0];
  }
  
  // Formato BR
  const match = clean.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  
  return clean;
}

/**
 * Lista histórico de importações
 */
export async function listarImportacoes(
  db: D1Database,
  uf?: string
): Promise<Array<{
  id: number;
  uf: string;
  versao: string;
  vigencia_fim: string;
  registros_total: number;
  registros_inseridos: number;
  registros_erro: number;
  importado_em: string;
  fonte: string;
}>> {
  const query = uf
    ? db.prepare('SELECT * FROM ibpt_importacoes WHERE uf = ? ORDER BY importado_em DESC LIMIT 50').bind(uf.toUpperCase())
    : db.prepare('SELECT * FROM ibpt_importacoes ORDER BY importado_em DESC LIMIT 50');

  const result = await query.all<any>();
  return result.results || [];
}

export type { D1Database };
