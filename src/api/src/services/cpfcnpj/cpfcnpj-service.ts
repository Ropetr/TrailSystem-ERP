// =============================================
// PLANAC ERP - CPF.CNPJ Service
// Integração com API CPF.CNPJ para consulta de CPF
// API: https://api.cpfcnpj.com.br
// =============================================

import type {
  CpfCnpjPacote,
  CpfCnpjCpfResponse,
  CpfCnpjClienteSugeridoPF,
  CpfCnpjConsultaResultado,
  CpfCnpjCacheRecord,
  CpfCnpjSaldoResponse,
} from './cpfcnpj-types';
import { CPFCNPJ_PACOTES } from './cpfcnpj-types';

const CPFCNPJ_API_URL = 'https://api.cpfcnpj.com.br';
const CACHE_MAX_AGE_DAYS = 30;

function formatCpf(cpf: string): string {
  return cpf.replace(/\D/g, '').padStart(11, '0');
}

function validarCpf(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpfLimpo)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo[9])) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo[10])) return false;
  
  return true;
}

function formatarTelefone(ddd?: string, numero?: string): string | undefined {
  if (!ddd || !numero) return undefined;
  return `(${ddd}) ${numero}`;
}

function transformarParaClienteSugerido(
  dadosBasicos: CpfCnpjCpfResponse
): CpfCnpjClienteSugeridoPF {
  const telefones = dadosBasicos.telefones || [];
  const whatsapps = dadosBasicos.whatsapp || [];
  const emails = dadosBasicos.emails || [];
  
  const telefonePrincipal = telefones[0];
  const celularPrincipal = telefones.find(t => t.numero?.startsWith('9')) || telefones[1];
  const whatsappPrincipal = whatsapps[0];
  
  return {
    tipo: 'PF',
    razao_social: dadosBasicos.nome || '',
    cpf_cnpj: dadosBasicos.cpf?.replace(/\D/g, '') || '',
    data_nascimento: dadosBasicos.nascimento,
    genero: dadosBasicos.genero === 'M' ? 'Masculino' : dadosBasicos.genero === 'F' ? 'Feminino' : undefined,
    nome_mae: dadosBasicos.mae,
    situacao_cadastral: dadosBasicos.situacao,
    
    email: emails[0],
    telefone: formatarTelefone(telefonePrincipal?.ddd, telefonePrincipal?.numero),
    celular: formatarTelefone(celularPrincipal?.ddd, celularPrincipal?.numero),
    whatsapp: formatarTelefone(whatsappPrincipal?.ddd, whatsappPrincipal?.numero),
    
    indicador_ie: 9,
    consumidor_final: 1,
    
    endereco: dadosBasicos.endereco ? {
      cep: dadosBasicos.cep || '',
      logradouro: dadosBasicos.endereco,
      numero: dadosBasicos.numero || 'S/N',
      complemento: dadosBasicos.complemento,
      bairro: dadosBasicos.bairro || '',
      cidade: dadosBasicos.cidade || '',
      uf: dadosBasicos.uf || '',
    } : undefined,
    
    emails_adicionais: emails.slice(1),
    telefones_adicionais: telefones.slice(2).map(t => formatarTelefone(t.ddd, t.numero)).filter(Boolean) as string[],
  };
}

export async function consultarCpf(
  cpf: string,
  token: string,
  pacote: CpfCnpjPacote = CPFCNPJ_PACOTES.CPF_LOOKALIKE
): Promise<CpfCnpjCpfResponse> {
  const cpfLimpo = formatCpf(cpf);
  
  if (!validarCpf(cpfLimpo)) {
    throw new Error('CPF inválido');
  }
  
  const url = `${CPFCNPJ_API_URL}/${token}/${pacote}/${cpfLimpo}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'PLANAC-ERP/1.0',
    },
  });
  
  if (!response.ok) {
    throw new Error(`CPF.CNPJ API error: ${response.status}`);
  }
  
  const data = await response.json() as CpfCnpjCpfResponse;
  
  if (data.status === 0 && data.erro) {
    throw new Error(data.erro);
  }
  
  return data;
}

export async function consultarCpfCompleto(
  cpf: string,
  token: string,
  db: D1Database,
  empresaId: string,
  pacote: CpfCnpjPacote = CPFCNPJ_PACOTES.CPF_LOOKALIKE
): Promise<CpfCnpjConsultaResultado> {
  const cpfLimpo = formatCpf(cpf);
  const startTime = Date.now();
  
  const cached = await verificarCache(db, empresaId, cpfLimpo, 'cpf', pacote);
  if (cached) {
    const dados = JSON.parse(cached.payload) as CpfCnpjCpfResponse;
    return {
      cpf: cpfLimpo,
      dados_basicos: dados,
      cliente_sugerido: transformarParaClienteSugerido(dados),
      tempo_resposta_ms: Date.now() - startTime,
      fonte: 'cache',
      cached: true,
      pacotes_usados: [pacote],
      custo_estimado: 0,
    };
  }
  
  const dados = await consultarCpf(cpfLimpo, token, pacote);
  
  await salvarCache(db, empresaId, cpfLimpo, 'cpf', pacote, dados);
  
  const custos: Record<number, number> = {
    1: 0.15, 7: 0.22, 2: 0.25, 8: 0.36, 9: 0.47,
    3: 1.20, 18: 1.40, 21: 0.24,
  };
  
  return {
    cpf: cpfLimpo,
    dados_basicos: dados,
    cliente_sugerido: transformarParaClienteSugerido(dados),
    tempo_resposta_ms: Date.now() - startTime,
    fonte: 'cpfcnpj',
    cached: false,
    pacotes_usados: [pacote],
    custo_estimado: custos[pacote] || 0,
  };
}

export async function consultarSaldo(
  token: string,
  pacote: CpfCnpjPacote
): Promise<CpfCnpjSaldoResponse> {
  const url = `${CPFCNPJ_API_URL}/${token}/saldo/${pacote}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'PLANAC-ERP/1.0',
    },
  });
  
  if (!response.ok) {
    throw new Error(`CPF.CNPJ API error: ${response.status}`);
  }
  
  return response.json() as Promise<CpfCnpjSaldoResponse>;
}

async function verificarCache(
  db: D1Database,
  empresaId: string,
  documento: string,
  tipo: string,
  pacote: number
): Promise<CpfCnpjCacheRecord | null> {
  const maxAgeDate = new Date();
  maxAgeDate.setDate(maxAgeDate.getDate() - CACHE_MAX_AGE_DAYS);
  
  const result = await db.prepare(`
    SELECT * FROM cpfcnpj_cache 
    WHERE empresa_id = ? AND documento = ? AND tipo = ? AND pacote = ? AND fetched_at > ?
    ORDER BY fetched_at DESC
    LIMIT 1
  `).bind(empresaId, documento, tipo, pacote, maxAgeDate.toISOString()).first<CpfCnpjCacheRecord>();
  
  return result || null;
}

async function salvarCache(
  db: D1Database,
  empresaId: string,
  documento: string,
  tipo: string,
  pacote: number,
  payload: CpfCnpjCpfResponse
): Promise<void> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO cpfcnpj_cache (id, empresa_id, documento, tipo, pacote, payload, fetched_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (empresa_id, documento, tipo, pacote) DO UPDATE SET
      payload = excluded.payload,
      fetched_at = excluded.fetched_at
  `).bind(
    id,
    empresaId,
    documento,
    tipo,
    pacote,
    JSON.stringify(payload),
    now,
    now
  ).run();
}

export async function importarClienteDoCpf(
  cpf: string,
  token: string,
  db: D1Database,
  empresaId: string,
  userId: string,
  sobrescrever: boolean = false
): Promise<{ cliente_id: string; criado: boolean; atualizado: boolean }> {
  const resultado = await consultarCpfCompleto(cpf, token, db, empresaId);
  
  if (!resultado.cliente_sugerido) {
    throw new Error('Não foi possível obter dados do CPF');
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
        email = COALESCE(?, email),
        telefone = COALESCE(?, telefone),
        celular = COALESCE(?, celular),
        data_nascimento = COALESCE(?, data_nascimento),
        indicador_ie = ?,
        consumidor_final = ?,
        fonte_regime = 'cpfcnpj',
        regime_atualizado_em = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      sugerido.razao_social,
      sugerido.email,
      sugerido.telefone,
      sugerido.celular,
      sugerido.data_nascimento,
      sugerido.indicador_ie,
      sugerido.consumidor_final,
      now,
      now,
      existente.id
    ).run();
    
    return { cliente_id: existente.id, criado: false, atualizado: true };
  }
  
  const clienteId = crypto.randomUUID();
  
  await db.prepare(`
    INSERT INTO clientes (
      id, empresa_id, tipo, razao_social, cpf_cnpj,
      email, telefone, celular, data_nascimento,
      indicador_ie, consumidor_final,
      fonte_regime, regime_atualizado_em,
      ativo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    clienteId,
    empresaId,
    'PF',
    sugerido.razao_social,
    sugerido.cpf_cnpj,
    sugerido.email,
    sugerido.telefone,
    sugerido.celular,
    sugerido.data_nascimento,
    sugerido.indicador_ie,
    sugerido.consumidor_final,
    'cpfcnpj',
    now,
    1,
    now,
    now
  ).run();
  
  return { cliente_id: clienteId, criado: true, atualizado: false };
}

export async function enriquecerClienteComCpf(
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
  
  if (cliente.tipo !== 'PF' || !cliente.cpf_cnpj) {
    throw new Error('Cliente deve ser PF com CPF cadastrado');
  }
  
  const resultado = await consultarCpfCompleto(
    cliente.cpf_cnpj as string,
    token,
    db,
    empresaId
  );
  
  if (!resultado.cliente_sugerido) {
    throw new Error('Não foi possível obter dados do CPF');
  }
  
  const sugerido = resultado.cliente_sugerido;
  const camposAtualizados: string[] = [];
  const updates: Record<string, unknown> = {};
  
  if (sobrescrever || !cliente.razao_social) {
    if (sugerido.razao_social && sugerido.razao_social !== cliente.razao_social) {
      updates.razao_social = sugerido.razao_social;
      camposAtualizados.push('razao_social');
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
  
  if (sobrescrever || !cliente.celular) {
    if (sugerido.celular && sugerido.celular !== cliente.celular) {
      updates.celular = sugerido.celular;
      camposAtualizados.push('celular');
    }
  }
  
  updates.indicador_ie = sugerido.indicador_ie;
  updates.consumidor_final = sugerido.consumidor_final;
  
  if (camposAtualizados.length === 0) {
    return { atualizado: false, campos_atualizados: [] };
  }
  
  const now = new Date().toISOString();
  updates.fonte_regime = 'cpfcnpj';
  updates.regime_atualizado_em = now;
  updates.updated_at = now;
  
  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), clienteId];
  
  await db.prepare(`UPDATE clientes SET ${setClauses} WHERE id = ?`).bind(...values).run();
  
  return { atualizado: true, campos_atualizados: camposAtualizados };
}

export async function importarFornecedorDoCpf(
  cpf: string,
  token: string,
  db: D1Database,
  empresaId: string,
  userId: string,
  sobrescrever: boolean = false
): Promise<{ fornecedor_id: string; criado: boolean; atualizado: boolean }> {
  const resultado = await consultarCpfCompleto(cpf, token, db, empresaId);
  
  if (!resultado.cliente_sugerido) {
    throw new Error('Não foi possível obter dados do CPF');
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
        email = COALESCE(?, email),
        telefone = COALESCE(?, telefone),
        celular = COALESCE(?, celular),
        updated_at = ?
      WHERE id = ?
    `).bind(
      sugerido.razao_social,
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
      id, empresa_id, tipo, razao_social, cpf_cnpj,
      email, telefone, celular,
      ativo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    fornecedorId,
    empresaId,
    'PF',
    sugerido.razao_social,
    sugerido.cpf_cnpj,
    sugerido.email,
    sugerido.telefone,
    sugerido.celular,
    1,
    now,
    now
  ).run();
  
  return { fornecedor_id: fornecedorId, criado: true, atualizado: false };
}

export async function enriquecerFornecedorComCpf(
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
  
  if (fornecedor.tipo !== 'PF' || !fornecedor.cpf_cnpj) {
    throw new Error('Fornecedor deve ser PF com CPF cadastrado');
  }
  
  const resultado = await consultarCpfCompleto(
    fornecedor.cpf_cnpj as string,
    token,
    db,
    empresaId
  );
  
  if (!resultado.cliente_sugerido) {
    throw new Error('Não foi possível obter dados do CPF');
  }
  
  const sugerido = resultado.cliente_sugerido;
  const camposAtualizados: string[] = [];
  const updates: Record<string, unknown> = {};
  
  if (sobrescrever || !fornecedor.razao_social) {
    if (sugerido.razao_social && sugerido.razao_social !== fornecedor.razao_social) {
      updates.razao_social = sugerido.razao_social;
      camposAtualizados.push('razao_social');
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
