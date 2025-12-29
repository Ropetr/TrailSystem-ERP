// =============================================
// PLANAC ERP - CNPjá Service
// Integração com API CNPjá para consulta de CNPJ
// =============================================

import type {
  CNPjaOfficeResponse,
  CNPjaSimplesResponse,
  CNPjaZipResponse,
  CNPjaConsultaParams,
  CNPjaClienteSugerido,
  CNPjaConsultaResultado,
  CNPjaCacheRecord,
} from './cnpja-types';

const CNPJA_API_URL = 'https://api.cnpja.com';
const CACHE_MAX_AGE_DAYS = 7;

function formatCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

function determinarIndicadorIE(registrations?: CNPjaOfficeResponse['registrations']): number {
  if (!registrations || registrations.length === 0) {
    return 9;
  }
  
  const ieAtiva = registrations.find(r => r.enabled && r.type?.id === 1);
  if (ieAtiva) {
    return 1;
  }
  
  const ieIsenta = registrations.find(r => r.type?.id === 2 || r.type?.text?.toLowerCase().includes('isent'));
  if (ieIsenta) {
    return 2;
  }
  
  return 9;
}

function determinarRegimeTributario(office: CNPjaOfficeResponse): string | undefined {
  if (office.company?.simples?.optant) {
    return 'simples';
  }
  return undefined;
}

function extrairInscricaoEstadual(registrations?: CNPjaOfficeResponse['registrations'], uf?: string): string | undefined {
  if (!registrations || registrations.length === 0) {
    return undefined;
  }
  
  if (uf) {
    const ieUf = registrations.find(r => r.state === uf && r.enabled);
    if (ieUf) {
      return ieUf.number;
    }
  }
  
  const iePrimeira = registrations.find(r => r.enabled);
  return iePrimeira?.number;
}

function transformarParaClienteSugerido(office: CNPjaOfficeResponse): CNPjaClienteSugerido {
  const telefone = office.phones?.find(p => p.type === 'LANDLINE');
  const celular = office.phones?.find(p => p.type === 'MOBILE');
  const email = office.emails?.find(e => e.ownership === 'CORPORATE') || office.emails?.[0];
  
  return {
    tipo: 'PJ',
    razao_social: office.company.name,
    nome_fantasia: office.alias || undefined,
    cpf_cnpj: office.taxId,
    inscricao_estadual: extrairInscricaoEstadual(office.registrations, office.address?.state),
    email: email?.address,
    telefone: telefone ? `(${telefone.area}) ${telefone.number}` : undefined,
    celular: celular ? `(${celular.area}) ${celular.number}` : undefined,
    
    indicador_ie: determinarIndicadorIE(office.registrations),
    consumidor_final: 0,
    regime_tributario: determinarRegimeTributario(office),
    simples_optante: office.company?.simples?.optant ? 1 : 0,
    simples_desde: office.company?.simples?.since || undefined,
    
    cnae_principal: office.mainActivity?.id?.toString(),
    cnae_principal_descricao: office.mainActivity?.text,
    natureza_juridica: office.company?.nature?.text,
    porte: office.company?.size?.text,
    situacao_cadastral: office.status?.text,
    data_situacao: office.statusDate,
    capital_social: office.company?.equity,
    
    endereco: office.address ? {
      cep: office.address.zip,
      logradouro: office.address.street,
      numero: office.address.number,
      complemento: office.address.details || undefined,
      bairro: office.address.district,
      cidade: office.address.city,
      uf: office.address.state,
      codigo_ibge: office.address.municipality?.toString(),
    } : undefined,
    
    socios: office.company?.members?.map(m => ({
      nome: m.person.name,
      cargo: m.role.text,
      desde: m.since,
    })),
  };
}

export async function consultarOfficePorCnpj(
  cnpj: string,
  token: string,
  params?: CNPjaConsultaParams
): Promise<CNPjaOfficeResponse> {
  const taxId = formatCnpj(cnpj);
  
  const queryParams = new URLSearchParams();
  if (params?.strategy) {
    queryParams.set('strategy', params.strategy);
  }
  if (params?.maxAge !== undefined) {
    queryParams.set('maxAge', params.maxAge.toString());
  }
  if (params?.maxStale !== undefined) {
    queryParams.set('maxStale', params.maxStale.toString());
  }
  
  const url = `${CNPJA_API_URL}/office/${taxId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': token,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CNPjá API error: ${response.status} - ${errorText}`);
  }
  
  return response.json() as Promise<CNPjaOfficeResponse>;
}

export async function consultarSimplesPorCnpj(
  cnpj: string,
  token: string,
  params?: CNPjaConsultaParams
): Promise<CNPjaSimplesResponse> {
  const taxId = formatCnpj(cnpj);
  
  const queryParams = new URLSearchParams();
  if (params?.strategy) {
    queryParams.set('strategy', params.strategy);
  }
  if (params?.maxAge !== undefined) {
    queryParams.set('maxAge', params.maxAge.toString());
  }
  
  const url = `${CNPJA_API_URL}/simples/${taxId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': token,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CNPjá API error: ${response.status} - ${errorText}`);
  }
  
  return response.json() as Promise<CNPjaSimplesResponse>;
}

export async function consultarCnpjCompleto(
  cnpj: string,
  token: string,
  db: D1Database,
  empresaId: string,
  params?: CNPjaConsultaParams
): Promise<CNPjaConsultaResultado> {
  const taxId = formatCnpj(cnpj);
  const startTime = Date.now();
  
  const cached = await verificarCache(db, empresaId, taxId, 'office');
  if (cached && !params?.strategy) {
    const office = JSON.parse(cached.payload) as CNPjaOfficeResponse;
    return {
      cnpj: taxId,
      office,
      cliente_sugerido: transformarParaClienteSugerido(office),
      tempo_resposta_ms: Date.now() - startTime,
      fonte: 'cache',
      cached: true,
    };
  }
  
  const office = await consultarOfficePorCnpj(taxId, token, params);
  
  await salvarCache(db, empresaId, taxId, 'office', office);
  
  return {
    cnpj: taxId,
    office,
    cliente_sugerido: transformarParaClienteSugerido(office),
    tempo_resposta_ms: Date.now() - startTime,
    fonte: 'cnpja',
    cached: false,
  };
}

async function verificarCache(
  db: D1Database,
  empresaId: string,
  taxId: string,
  tipo: string
): Promise<CNPjaCacheRecord | null> {
  const maxAgeDate = new Date();
  maxAgeDate.setDate(maxAgeDate.getDate() - CACHE_MAX_AGE_DAYS);
  
  const result = await db.prepare(`
    SELECT * FROM cnpja_cache 
    WHERE empresa_id = ? AND tax_id = ? AND tipo = ? AND fetched_at > ?
    ORDER BY fetched_at DESC
    LIMIT 1
  `).bind(empresaId, taxId, tipo, maxAgeDate.toISOString()).first<CNPjaCacheRecord>();
  
  return result || null;
}

async function salvarCache(
  db: D1Database,
  empresaId: string,
  taxId: string,
  tipo: string,
  payload: CNPjaOfficeResponse | CNPjaSimplesResponse
): Promise<void> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const sourceUpdated = 'updated' in payload ? payload.updated : now;
  
  await db.prepare(`
    INSERT INTO cnpja_cache (id, empresa_id, tax_id, tipo, payload, source_updated, fetched_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (empresa_id, tax_id, tipo) DO UPDATE SET
      payload = excluded.payload,
      source_updated = excluded.source_updated,
      fetched_at = excluded.fetched_at
  `).bind(
    id,
    empresaId,
    taxId,
    tipo,
    JSON.stringify(payload),
    sourceUpdated,
    now,
    now
  ).run();
}

export async function importarClienteDoCnpj(
  cnpj: string,
  token: string,
  db: D1Database,
  empresaId: string,
  userId: string,
  sobrescrever: boolean = false
): Promise<{ cliente_id: string; criado: boolean; atualizado: boolean }> {
  const resultado = await consultarCnpjCompleto(cnpj, token, db, empresaId);
  
  if (!resultado.cliente_sugerido) {
    throw new Error('Não foi possível obter dados do CNPJ');
  }
  
  const sugerido = resultado.cliente_sugerido;
  
  const existente = await db.prepare(`
    SELECT id FROM clientes WHERE empresa_id = ? AND cpf_cnpj = ?
  `).bind(empresaId, sugerido.cpf_cnpj).first<{ id: string }>();
  
  const now = new Date().toISOString();
  
  if (existente) {
    if (!sobrescrever) {
      return { cliente_id: existente.id, criado: false, atualizado: false };
    }
    
    await db.prepare(`
      UPDATE clientes SET
        razao_social = COALESCE(?, razao_social),
        nome_fantasia = COALESCE(?, nome_fantasia),
        inscricao_estadual = COALESCE(?, inscricao_estadual),
        email = COALESCE(?, email),
        telefone = COALESCE(?, telefone),
        celular = COALESCE(?, celular),
        indicador_ie = ?,
        consumidor_final = ?,
        regime_tributario = COALESCE(?, regime_tributario),
        simples_optante = ?,
        fonte_regime = 'cnpja',
        regime_atualizado_em = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      sugerido.razao_social,
      sugerido.nome_fantasia,
      sugerido.inscricao_estadual,
      sugerido.email,
      sugerido.telefone,
      sugerido.celular,
      sugerido.indicador_ie,
      sugerido.consumidor_final,
      sugerido.regime_tributario,
      sugerido.simples_optante,
      now,
      now,
      existente.id
    ).run();
    
    return { cliente_id: existente.id, criado: false, atualizado: true };
  }
  
  const clienteId = crypto.randomUUID();
  
  await db.prepare(`
    INSERT INTO clientes (
      id, empresa_id, tipo, razao_social, nome_fantasia, cpf_cnpj,
      inscricao_estadual, email, telefone, celular,
      indicador_ie, consumidor_final, regime_tributario, simples_optante,
      fonte_regime, regime_atualizado_em,
      ativo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    clienteId,
    empresaId,
    'PJ',
    sugerido.razao_social,
    sugerido.nome_fantasia,
    sugerido.cpf_cnpj,
    sugerido.inscricao_estadual,
    sugerido.email,
    sugerido.telefone,
    sugerido.celular,
    sugerido.indicador_ie,
    sugerido.consumidor_final,
    sugerido.regime_tributario,
    sugerido.simples_optante,
    'cnpja',
    now,
    1,
    now,
    now
  ).run();
  
  if (sugerido.endereco) {
    const enderecoId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO clientes_enderecos (
        id, cliente_id, tipo, cep, logradouro, numero, complemento,
        bairro, cidade, uf, codigo_ibge, principal, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      enderecoId,
      clienteId,
      'comercial',
      sugerido.endereco.cep,
      sugerido.endereco.logradouro,
      sugerido.endereco.numero,
      sugerido.endereco.complemento,
      sugerido.endereco.bairro,
      sugerido.endereco.cidade,
      sugerido.endereco.uf,
      sugerido.endereco.codigo_ibge,
      1,
      now,
      now
    ).run();
  }
  
  return { cliente_id: clienteId, criado: true, atualizado: false };
}

export async function enriquecerClienteComCnpj(
  clienteId: string,
  token: string,
  db: D1Database,
  empresaId: string,
  sobrescrever: boolean = false
): Promise<{ atualizado: boolean; campos_atualizados: string[] }> {
  const cliente = await db.prepare(`
    SELECT * FROM clientes WHERE id = ? AND empresa_id = ?
  `).bind(clienteId, empresaId).first<Record<string, unknown>>();
  
  if (!cliente) {
    throw new Error('Cliente não encontrado');
  }
  
  if (cliente.tipo !== 'PJ' || !cliente.cpf_cnpj) {
    throw new Error('Cliente deve ser PJ com CNPJ cadastrado');
  }
  
  const resultado = await consultarCnpjCompleto(
    cliente.cpf_cnpj as string,
    token,
    db,
    empresaId
  );
  
  if (!resultado.cliente_sugerido) {
    throw new Error('Não foi possível obter dados do CNPJ');
  }
  
  const sugerido = resultado.cliente_sugerido;
  const camposAtualizados: string[] = [];
  const updates: Record<string, unknown> = {};
  
  if (sobrescrever || !cliente.razao_social) {
    if (sugerido.razao_social !== cliente.razao_social) {
      updates.razao_social = sugerido.razao_social;
      camposAtualizados.push('razao_social');
    }
  }
  
  if (sobrescrever || !cliente.nome_fantasia) {
    if (sugerido.nome_fantasia && sugerido.nome_fantasia !== cliente.nome_fantasia) {
      updates.nome_fantasia = sugerido.nome_fantasia;
      camposAtualizados.push('nome_fantasia');
    }
  }
  
  if (sobrescrever || !cliente.inscricao_estadual) {
    if (sugerido.inscricao_estadual && sugerido.inscricao_estadual !== cliente.inscricao_estadual) {
      updates.inscricao_estadual = sugerido.inscricao_estadual;
      camposAtualizados.push('inscricao_estadual');
    }
  }
  
  if (sobrescrever || !cliente.email) {
    if (sugerido.email && sugerido.email !== cliente.email) {
      updates.email = sugerido.email;
      camposAtualizados.push('email');
    }
  }
  
  if (sobrescrever || !cliente.telefone) {
    if (sugerido.telefone && sugerido.telefone !== cliente.telefone) {
      updates.telefone = sugerido.telefone;
      camposAtualizados.push('telefone');
    }
  }
  
  updates.indicador_ie = sugerido.indicador_ie;
  if (sugerido.indicador_ie !== cliente.indicador_ie) {
    camposAtualizados.push('indicador_ie');
  }
  
  updates.consumidor_final = sugerido.consumidor_final;
  if (sugerido.consumidor_final !== cliente.consumidor_final) {
    camposAtualizados.push('consumidor_final');
  }
  
  if (sugerido.regime_tributario) {
    updates.regime_tributario = sugerido.regime_tributario;
    if (sugerido.regime_tributario !== cliente.regime_tributario) {
      camposAtualizados.push('regime_tributario');
    }
  }
  
  updates.simples_optante = sugerido.simples_optante;
  if (sugerido.simples_optante !== cliente.simples_optante) {
    camposAtualizados.push('simples_optante');
  }
  
  if (camposAtualizados.length === 0) {
    return { atualizado: false, campos_atualizados: [] };
  }
  
  const now = new Date().toISOString();
  updates.fonte_regime = 'cnpja';
  updates.regime_atualizado_em = now;
  updates.updated_at = now;
  
  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), clienteId];
  
  await db.prepare(`UPDATE clientes SET ${setClauses} WHERE id = ?`).bind(...values).run();
  
  return { atualizado: true, campos_atualizados: camposAtualizados };
}

export async function consultarCep(
  cep: string,
  token: string
): Promise<CNPjaZipResponse> {
  const cepLimpo = cep.replace(/\D/g, '');
  
  if (cepLimpo.length !== 8) {
    throw new Error('CEP inválido - deve ter 8 dígitos');
  }
  
  const url = `${CNPJA_API_URL}/zip/${cepLimpo}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': token,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('CEP não encontrado');
    }
    const errorText = await response.text();
    throw new Error(`CNPjá API error: ${response.status} - ${errorText}`);
  }
  
  return response.json() as Promise<CNPjaZipResponse>;
}

export async function importarFornecedorDoCnpj(
  cnpj: string,
  token: string,
  db: D1Database,
  empresaId: string,
  userId: string,
  sobrescrever: boolean = false
): Promise<{ fornecedor_id: string; criado: boolean; atualizado: boolean }> {
  const resultado = await consultarCnpjCompleto(cnpj, token, db, empresaId);
  
  if (!resultado.cliente_sugerido) {
    throw new Error('Não foi possível obter dados do CNPJ');
  }
  
  const sugerido = resultado.cliente_sugerido;
  
  const existente = await db.prepare(`
    SELECT id FROM fornecedores WHERE empresa_id = ? AND cpf_cnpj = ?
  `).bind(empresaId, sugerido.cpf_cnpj).first<{ id: string }>();
  
  const now = new Date().toISOString();
  
  if (existente) {
    if (!sobrescrever) {
      return { fornecedor_id: existente.id, criado: false, atualizado: false };
    }
    
    await db.prepare(`
      UPDATE fornecedores SET
        razao_social = COALESCE(?, razao_social),
        nome_fantasia = COALESCE(?, nome_fantasia),
        inscricao_estadual = COALESCE(?, inscricao_estadual),
        email = COALESCE(?, email),
        telefone = COALESCE(?, telefone),
        celular = COALESCE(?, celular),
        updated_at = ?
      WHERE id = ?
    `).bind(
      sugerido.razao_social,
      sugerido.nome_fantasia,
      sugerido.inscricao_estadual,
      sugerido.email,
      sugerido.telefone,
      sugerido.celular,
      now,
      existente.id
    ).run();
    
    return { fornecedor_id: existente.id, criado: false, atualizado: true };
  }
  
  const fornecedorId = crypto.randomUUID();
  
  await db.prepare(`
    INSERT INTO fornecedores (
      id, empresa_id, tipo, razao_social, nome_fantasia, cpf_cnpj,
      inscricao_estadual, email, telefone, celular,
      ativo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    fornecedorId,
    empresaId,
    'PJ',
    sugerido.razao_social,
    sugerido.nome_fantasia,
    sugerido.cpf_cnpj,
    sugerido.inscricao_estadual,
    sugerido.email,
    sugerido.telefone,
    sugerido.celular,
    1,
    now,
    now
  ).run();
  
  if (sugerido.endereco) {
    const enderecoId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO fornecedores_enderecos (
        id, fornecedor_id, tipo, cep, logradouro, numero, complemento,
        bairro, cidade, uf, codigo_ibge, padrao, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      enderecoId,
      fornecedorId,
      'principal',
      sugerido.endereco.cep,
      sugerido.endereco.logradouro,
      sugerido.endereco.numero,
      sugerido.endereco.complemento,
      sugerido.endereco.bairro,
      sugerido.endereco.cidade,
      sugerido.endereco.uf,
      sugerido.endereco.codigo_ibge,
      1,
      now
    ).run();
  }
  
  return { fornecedor_id: fornecedorId, criado: true, atualizado: false };
}

export async function enriquecerFornecedorComCnpj(
  fornecedorId: string,
  token: string,
  db: D1Database,
  empresaId: string,
  sobrescrever: boolean = false
): Promise<{ atualizado: boolean; campos_atualizados: string[] }> {
  const fornecedor = await db.prepare(`
    SELECT * FROM fornecedores WHERE id = ? AND empresa_id = ?
  `).bind(fornecedorId, empresaId).first<Record<string, unknown>>();
  
  if (!fornecedor) {
    throw new Error('Fornecedor não encontrado');
  }
  
  if (fornecedor.tipo !== 'PJ' || !fornecedor.cpf_cnpj) {
    throw new Error('Fornecedor deve ser PJ com CNPJ cadastrado');
  }
  
  const resultado = await consultarCnpjCompleto(
    fornecedor.cpf_cnpj as string,
    token,
    db,
    empresaId
  );
  
  if (!resultado.cliente_sugerido) {
    throw new Error('Não foi possível obter dados do CNPJ');
  }
  
  const sugerido = resultado.cliente_sugerido;
  const camposAtualizados: string[] = [];
  const updates: Record<string, unknown> = {};
  
  if (sobrescrever || !fornecedor.razao_social) {
    if (sugerido.razao_social !== fornecedor.razao_social) {
      updates.razao_social = sugerido.razao_social;
      camposAtualizados.push('razao_social');
    }
  }
  
  if (sobrescrever || !fornecedor.nome_fantasia) {
    if (sugerido.nome_fantasia && sugerido.nome_fantasia !== fornecedor.nome_fantasia) {
      updates.nome_fantasia = sugerido.nome_fantasia;
      camposAtualizados.push('nome_fantasia');
    }
  }
  
  if (sobrescrever || !fornecedor.inscricao_estadual) {
    if (sugerido.inscricao_estadual && sugerido.inscricao_estadual !== fornecedor.inscricao_estadual) {
      updates.inscricao_estadual = sugerido.inscricao_estadual;
      camposAtualizados.push('inscricao_estadual');
    }
  }
  
  if (sobrescrever || !fornecedor.email) {
    if (sugerido.email && sugerido.email !== fornecedor.email) {
      updates.email = sugerido.email;
      camposAtualizados.push('email');
    }
  }
  
  if (sobrescrever || !fornecedor.telefone) {
    if (sugerido.telefone && sugerido.telefone !== fornecedor.telefone) {
      updates.telefone = sugerido.telefone;
      camposAtualizados.push('telefone');
    }
  }
  
  if (sobrescrever || !fornecedor.celular) {
    if (sugerido.celular && sugerido.celular !== fornecedor.celular) {
      updates.celular = sugerido.celular;
      camposAtualizados.push('celular');
    }
  }
  
  if (camposAtualizados.length === 0) {
    return { atualizado: false, campos_atualizados: [] };
  }
  
  const now = new Date().toISOString();
  updates.updated_at = now;
  
  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), fornecedorId];
  
  await db.prepare(`UPDATE fornecedores SET ${setClauses} WHERE id = ?`).bind(...values).run();
  
  return { atualizado: true, campos_atualizados: camposAtualizados };
}
