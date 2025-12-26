// =============================================
// PLANAC ERP - Empresa Config Service
// Configurações locais das empresas (D1)
// =============================================

// ===== TIPOS =====

export interface EmpresaConfig {
  id?: number;
  cnpj: string;
  razao_social?: string;
  nome_fantasia?: string;
  
  // IBPT
  ibpt_token?: string;
  ibpt_uf?: string;
  
  // Configurações fiscais
  regime_tributario?: number;
  ambiente_fiscal?: 'homologacao' | 'producao';
  
  // Séries e numeração
  nfe_serie?: number;
  nfe_proximo_numero?: number;
  nfce_serie?: number;
  nfce_proximo_numero?: number;
  
  // Impressão
  logo_url?: string;
  danfe_tipo?: number;
  
  // Padrões
  natureza_operacao_padrao?: string;
  informacoes_complementares_padrao?: string;
  
  // Automação
  emitir_nfe_automatico?: boolean;
  enviar_email_automatico?: boolean;
  
  // Controle
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmpresaConfigInput {
  cnpj: string;
  razao_social?: string;
  nome_fantasia?: string;
  ibpt_token?: string;
  ibpt_uf?: string;
  regime_tributario?: number;
  ambiente_fiscal?: 'homologacao' | 'producao';
  nfe_serie?: number;
  nfe_proximo_numero?: number;
  nfce_serie?: number;
  nfce_proximo_numero?: number;
  logo_url?: string;
  danfe_tipo?: number;
  natureza_operacao_padrao?: string;
  informacoes_complementares_padrao?: string;
  emitir_nfe_automatico?: boolean;
  enviar_email_automatico?: boolean;
}

// ===== D1 DATABASE INTERFACE =====

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
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
  meta: any;
}

// ===== FUNÇÕES =====

/**
 * Busca configuração da empresa pelo CNPJ
 */
export async function buscarConfigEmpresa(
  db: D1Database,
  cnpj: string
): Promise<EmpresaConfig | null> {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  const result = await db
    .prepare('SELECT * FROM empresas_config WHERE cnpj = ? AND ativo = 1')
    .bind(cnpjLimpo)
    .first<any>();
  
  if (!result) return null;
  
  return mapRowToConfig(result);
}

/**
 * Lista todas as empresas configuradas
 */
export async function listarConfigEmpresas(
  db: D1Database,
  apenasAtivas: boolean = true
): Promise<EmpresaConfig[]> {
  const query = apenasAtivas 
    ? 'SELECT * FROM empresas_config WHERE ativo = 1 ORDER BY razao_social'
    : 'SELECT * FROM empresas_config ORDER BY razao_social';
  
  const result = await db.prepare(query).all<any>();
  
  return (result.results || []).map(mapRowToConfig);
}

/**
 * Cria ou atualiza configuração da empresa
 */
export async function salvarConfigEmpresa(
  db: D1Database,
  config: EmpresaConfigInput
): Promise<EmpresaConfig> {
  const cnpjLimpo = config.cnpj.replace(/\D/g, '');
  
  // Verificar se já existe
  const existente = await buscarConfigEmpresa(db, cnpjLimpo);
  
  if (existente) {
    // Update
    const campos: string[] = [];
    const valores: any[] = [];
    
    if (config.razao_social !== undefined) {
      campos.push('razao_social = ?');
      valores.push(config.razao_social);
    }
    if (config.nome_fantasia !== undefined) {
      campos.push('nome_fantasia = ?');
      valores.push(config.nome_fantasia);
    }
    if (config.ibpt_token !== undefined) {
      campos.push('ibpt_token = ?');
      valores.push(config.ibpt_token);
    }
    if (config.ibpt_uf !== undefined) {
      campos.push('ibpt_uf = ?');
      valores.push(config.ibpt_uf);
    }
    if (config.regime_tributario !== undefined) {
      campos.push('regime_tributario = ?');
      valores.push(config.regime_tributario);
    }
    if (config.ambiente_fiscal !== undefined) {
      campos.push('ambiente_fiscal = ?');
      valores.push(config.ambiente_fiscal);
    }
    if (config.nfe_serie !== undefined) {
      campos.push('nfe_serie = ?');
      valores.push(config.nfe_serie);
    }
    if (config.nfe_proximo_numero !== undefined) {
      campos.push('nfe_proximo_numero = ?');
      valores.push(config.nfe_proximo_numero);
    }
    if (config.nfce_serie !== undefined) {
      campos.push('nfce_serie = ?');
      valores.push(config.nfce_serie);
    }
    if (config.nfce_proximo_numero !== undefined) {
      campos.push('nfce_proximo_numero = ?');
      valores.push(config.nfce_proximo_numero);
    }
    if (config.logo_url !== undefined) {
      campos.push('logo_url = ?');
      valores.push(config.logo_url);
    }
    if (config.danfe_tipo !== undefined) {
      campos.push('danfe_tipo = ?');
      valores.push(config.danfe_tipo);
    }
    if (config.natureza_operacao_padrao !== undefined) {
      campos.push('natureza_operacao_padrao = ?');
      valores.push(config.natureza_operacao_padrao);
    }
    if (config.informacoes_complementares_padrao !== undefined) {
      campos.push('informacoes_complementares_padrao = ?');
      valores.push(config.informacoes_complementares_padrao);
    }
    if (config.emitir_nfe_automatico !== undefined) {
      campos.push('emitir_nfe_automatico = ?');
      valores.push(config.emitir_nfe_automatico ? 1 : 0);
    }
    if (config.enviar_email_automatico !== undefined) {
      campos.push('enviar_email_automatico = ?');
      valores.push(config.enviar_email_automatico ? 1 : 0);
    }
    
    campos.push("updated_at = datetime('now')");
    valores.push(cnpjLimpo);
    
    await db
      .prepare(`UPDATE empresas_config SET ${campos.join(', ')} WHERE cnpj = ?`)
      .bind(...valores)
      .run();
  } else {
    // Insert
    await db
      .prepare(`
        INSERT INTO empresas_config (
          cnpj, razao_social, nome_fantasia,
          ibpt_token, ibpt_uf,
          regime_tributario, ambiente_fiscal,
          nfe_serie, nfe_proximo_numero,
          nfce_serie, nfce_proximo_numero,
          logo_url, danfe_tipo,
          natureza_operacao_padrao, informacoes_complementares_padrao,
          emitir_nfe_automatico, enviar_email_automatico
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        cnpjLimpo,
        config.razao_social || null,
        config.nome_fantasia || null,
        config.ibpt_token || null,
        config.ibpt_uf || 'PR',
        config.regime_tributario || 1,
        config.ambiente_fiscal || 'homologacao',
        config.nfe_serie || 1,
        config.nfe_proximo_numero || 1,
        config.nfce_serie || 1,
        config.nfce_proximo_numero || 1,
        config.logo_url || null,
        config.danfe_tipo || 1,
        config.natureza_operacao_padrao || 'VENDA DE MERCADORIA',
        config.informacoes_complementares_padrao || null,
        config.emitir_nfe_automatico ? 1 : 0,
        config.enviar_email_automatico ? 1 : 0
      )
      .run();
  }
  
  return (await buscarConfigEmpresa(db, cnpjLimpo))!;
}

/**
 * Atualiza apenas o token IBPT
 */
export async function atualizarTokenIBPT(
  db: D1Database,
  cnpj: string,
  token: string,
  uf?: string
): Promise<EmpresaConfig | null> {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  // Verificar se empresa existe
  const existente = await buscarConfigEmpresa(db, cnpjLimpo);
  
  if (existente) {
    // Update
    const query = uf
      ? "UPDATE empresas_config SET ibpt_token = ?, ibpt_uf = ?, updated_at = datetime('now') WHERE cnpj = ?"
      : "UPDATE empresas_config SET ibpt_token = ?, updated_at = datetime('now') WHERE cnpj = ?";
    
    const params = uf ? [token, uf, cnpjLimpo] : [token, cnpjLimpo];
    await db.prepare(query).bind(...params).run();
  } else {
    // Criar registro mínimo
    await db
      .prepare(`
        INSERT INTO empresas_config (cnpj, ibpt_token, ibpt_uf) 
        VALUES (?, ?, ?)
      `)
      .bind(cnpjLimpo, token, uf || 'PR')
      .run();
  }
  
  return buscarConfigEmpresa(db, cnpjLimpo);
}

/**
 * Remove token IBPT
 */
export async function removerTokenIBPT(
  db: D1Database,
  cnpj: string
): Promise<boolean> {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  const result = await db
    .prepare("UPDATE empresas_config SET ibpt_token = NULL, updated_at = datetime('now') WHERE cnpj = ?")
    .bind(cnpjLimpo)
    .run();
  
  return (result.meta?.changes || 0) > 0;
}

/**
 * Incrementa número da NF-e e retorna o novo valor
 */
export async function proximoNumeroNFe(
  db: D1Database,
  cnpj: string
): Promise<{ serie: number; numero: number }> {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  // Buscar e incrementar atomicamente
  const config = await buscarConfigEmpresa(db, cnpjLimpo);
  
  if (!config) {
    throw new Error('Empresa não configurada');
  }
  
  const serie = config.nfe_serie || 1;
  const numero = config.nfe_proximo_numero || 1;
  
  // Incrementar
  await db
    .prepare("UPDATE empresas_config SET nfe_proximo_numero = nfe_proximo_numero + 1, updated_at = datetime('now') WHERE cnpj = ?")
    .bind(cnpjLimpo)
    .run();
  
  return { serie, numero };
}

/**
 * Incrementa número da NFC-e e retorna o novo valor
 */
export async function proximoNumeroNFCe(
  db: D1Database,
  cnpj: string
): Promise<{ serie: number; numero: number }> {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  const config = await buscarConfigEmpresa(db, cnpjLimpo);
  
  if (!config) {
    throw new Error('Empresa não configurada');
  }
  
  const serie = config.nfce_serie || 1;
  const numero = config.nfce_proximo_numero || 1;
  
  await db
    .prepare("UPDATE empresas_config SET nfce_proximo_numero = nfce_proximo_numero + 1, updated_at = datetime('now') WHERE cnpj = ?")
    .bind(cnpjLimpo)
    .run();
  
  return { serie, numero };
}

/**
 * Desativa empresa
 */
export async function desativarEmpresa(
  db: D1Database,
  cnpj: string
): Promise<boolean> {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  const result = await db
    .prepare("UPDATE empresas_config SET ativo = 0, updated_at = datetime('now') WHERE cnpj = ?")
    .bind(cnpjLimpo)
    .run();
  
  return (result.meta?.changes || 0) > 0;
}

/**
 * Reativa empresa
 */
export async function reativarEmpresa(
  db: D1Database,
  cnpj: string
): Promise<boolean> {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  const result = await db
    .prepare("UPDATE empresas_config SET ativo = 1, updated_at = datetime('now') WHERE cnpj = ?")
    .bind(cnpjLimpo)
    .run();
  
  return (result.meta?.changes || 0) > 0;
}

// ===== HELPERS =====

function mapRowToConfig(row: any): EmpresaConfig {
  return {
    id: row.id,
    cnpj: row.cnpj,
    razao_social: row.razao_social,
    nome_fantasia: row.nome_fantasia,
    ibpt_token: row.ibpt_token,
    ibpt_uf: row.ibpt_uf,
    regime_tributario: row.regime_tributario,
    ambiente_fiscal: row.ambiente_fiscal,
    nfe_serie: row.nfe_serie,
    nfe_proximo_numero: row.nfe_proximo_numero,
    nfce_serie: row.nfce_serie,
    nfce_proximo_numero: row.nfce_proximo_numero,
    logo_url: row.logo_url,
    danfe_tipo: row.danfe_tipo,
    natureza_operacao_padrao: row.natureza_operacao_padrao,
    informacoes_complementares_padrao: row.informacoes_complementares_padrao,
    emitir_nfe_automatico: row.emitir_nfe_automatico === 1,
    enviar_email_automatico: row.enviar_email_automatico === 1,
    ativo: row.ativo === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export type { D1Database };

