// ============================================
// PLANAC ERP - Rotas de Plano de Contas
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const planoContas = new Hono<{ Bindings: Bindings; Variables: Variables }>();

planoContas.use('/*', requireAuth());

// Schemas
const contaSchema = z.object({
  codigo: z.string().min(1).max(20),
  codigo_reduzido: z.string().max(10).optional().nullable(),
  nome: z.string().min(2).max(200),
  tipo: z.enum(['RECEITA', 'DESPESA', 'ATIVO', 'PASSIVO', 'PATRIMONIO']),
  natureza: z.enum(['DEVEDORA', 'CREDORA']),
  grupo: z.enum(['ATIVO', 'PASSIVO', 'PL', 'RECEITA', 'CUSTO', 'DESPESA', 'APURACAO']).optional().nullable(),
  sintetica: z.boolean().default(false),
  conta_pai_id: z.string().uuid().optional().nullable(),
  aceita_lancamento: z.boolean().default(true),
  conta_sped: z.string().max(20).optional().nullable(),
  conta_dre: z.string().max(50).optional().nullable(),
  observacoes: z.string().optional().nullable(),
  ativo: z.boolean().default(true)
});

// GET /plano-contas - Listar todas as contas
planoContas.get('/', requirePermission('financeiro', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { busca, tipo, grupo, ativo, sintetica, hierarquia } = c.req.query();

  let query = `
    SELECT 
      pc.*,
      cp.nome as conta_pai_nome,
      cp.codigo as conta_pai_codigo,
      (SELECT COUNT(*) FROM plano_contas sub WHERE sub.conta_pai_id = pc.id) as total_filhas
    FROM plano_contas pc
    LEFT JOIN plano_contas cp ON pc.conta_pai_id = cp.id
    WHERE pc.empresa_id = ?
  `;
  const params: any[] = [usuario.empresa_id];

  if (busca) {
    query += ` AND (pc.codigo LIKE ? OR pc.nome LIKE ? OR pc.codigo_reduzido LIKE ?)`;
    params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
  }

  if (tipo) {
    query += ` AND pc.tipo = ?`;
    params.push(tipo);
  }

  if (grupo) {
    query += ` AND pc.grupo = ?`;
    params.push(grupo);
  }

  if (ativo !== undefined) {
    query += ` AND pc.ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }

  if (sintetica !== undefined) {
    query += ` AND pc.sintetica = ?`;
    params.push(sintetica === 'true' ? 1 : 0);
  }

  // Se hierarquia=true, ordenar para exibir em arvore
  if (hierarquia === 'true') {
    query += ` ORDER BY pc.conta_pai_id NULLS FIRST, pc.codigo`;
  } else {
    query += ` ORDER BY pc.codigo`;
  }

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results
  });
});

// GET /plano-contas/arvore - Retornar em formato de arvore
planoContas.get('/arvore', requirePermission('financeiro', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { ativo } = c.req.query();

  let query = `
    SELECT * FROM plano_contas
    WHERE empresa_id = ?
  `;
  const params: any[] = [usuario.empresa_id];

  if (ativo !== 'false') {
    query += ` AND ativo = 1`;
  }

  query += ` ORDER BY codigo`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  // Montar arvore
  const contas = result.results as any[];
  const map = new Map();
  const roots: any[] = [];

  contas.forEach(conta => {
    map.set(conta.id, { ...conta, filhas: [] });
  });

  contas.forEach(conta => {
    const node = map.get(conta.id);
    if (conta.conta_pai_id && map.has(conta.conta_pai_id)) {
      map.get(conta.conta_pai_id).filhas.push(node);
    } else {
      roots.push(node);
    }
  });

  return c.json({ success: true, data: roots });
});

// GET /plano-contas/grupos - Listar contas agrupadas por tipo
planoContas.get('/grupos', requirePermission('financeiro', 'listar'), async (c) => {
  const usuario = c.get('usuario');

  const result = await c.env.DB.prepare(`
    SELECT 
      tipo,
      grupo,
      COUNT(*) as total,
      SUM(CASE WHEN sintetica = 1 THEN 1 ELSE 0 END) as sinteticas,
      SUM(CASE WHEN sintetica = 0 THEN 1 ELSE 0 END) as analiticas
    FROM plano_contas
    WHERE empresa_id = ? AND ativo = 1
    GROUP BY tipo, grupo
    ORDER BY tipo, grupo
  `).bind(usuario.empresa_id).all();

  return c.json({ success: true, data: result.results });
});

// GET /plano-contas/:id - Buscar por ID
planoContas.get('/:id', requirePermission('financeiro', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const conta = await c.env.DB.prepare(`
    SELECT 
      pc.*,
      cp.nome as conta_pai_nome,
      cp.codigo as conta_pai_codigo
    FROM plano_contas pc
    LEFT JOIN plano_contas cp ON pc.conta_pai_id = cp.id
    WHERE pc.id = ? AND pc.empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!conta) {
    return c.json({ success: false, error: 'Conta nao encontrada' }, 404);
  }

  // Buscar filhas
  const filhas = await c.env.DB.prepare(`
    SELECT id, codigo, nome, tipo, sintetica, ativo FROM plano_contas
    WHERE conta_pai_id = ? AND empresa_id = ?
    ORDER BY codigo
  `).bind(id, usuario.empresa_id).all();

  // Estatisticas de uso
  const estatisticas = await c.env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM contas_pagar WHERE plano_conta_id = ?) as contas_pagar,
      (SELECT COUNT(*) FROM contas_receber WHERE plano_conta_id = ?) as contas_receber,
      (SELECT COUNT(*) FROM lancamentos_contabeis WHERE conta_id = ?) as lancamentos
  `).bind(id, id, id).first();

  // Saldo atual (se conta analitica)
  let saldo = null;
  if (!(conta as any).sintetica) {
    const saldoResult = await c.env.DB.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN tipo_lancamento = 'DEBITO' THEN valor ELSE 0 END), 0) as debitos,
        COALESCE(SUM(CASE WHEN tipo_lancamento = 'CREDITO' THEN valor ELSE 0 END), 0) as creditos
      FROM lancamentos_contabeis
      WHERE conta_id = ? AND estornado = 0
    `).bind(id).first<{ debitos: number; creditos: number }>();

    if (saldoResult) {
      const natureza = (conta as any).natureza;
      saldo = natureza === 'DEVEDORA' 
        ? saldoResult.debitos - saldoResult.creditos
        : saldoResult.creditos - saldoResult.debitos;
    }
  }

  return c.json({
    success: true,
    data: {
      ...conta,
      filhas: filhas.results,
      estatisticas,
      saldo
    }
  });
});

// GET /plano-contas/:id/saldo - Saldo da conta
planoContas.get('/:id/saldo', requirePermission('financeiro', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const { ano, mes } = c.req.query();

  const conta = await c.env.DB.prepare(`
    SELECT id, codigo, nome, natureza, sintetica FROM plano_contas
    WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!conta) {
    return c.json({ success: false, error: 'Conta nao encontrada' }, 404);
  }

  // Se conta sintetica, somar saldos das filhas
  if ((conta as any).sintetica) {
    const filhasIds = await c.env.DB.prepare(`
      WITH RECURSIVE filhas AS (
        SELECT id FROM plano_contas WHERE id = ?
        UNION ALL
        SELECT pc.id FROM plano_contas pc
        INNER JOIN filhas f ON pc.conta_pai_id = f.id
      )
      SELECT id FROM filhas WHERE id != ?
    `).bind(id, id).all();

    const ids = (filhasIds.results as any[]).map(r => r.id);
    
    if (ids.length === 0) {
      return c.json({ success: true, data: { debitos: 0, creditos: 0, saldo: 0 } });
    }

    // Calcular saldo agregado
    let query = `
      SELECT 
        COALESCE(SUM(CASE WHEN tipo_lancamento = 'DEBITO' THEN valor ELSE 0 END), 0) as debitos,
        COALESCE(SUM(CASE WHEN tipo_lancamento = 'CREDITO' THEN valor ELSE 0 END), 0) as creditos
      FROM lancamentos_contabeis
      WHERE conta_id IN (${ids.map(() => '?').join(',')}) AND estornado = 0
    `;
    const params: any[] = [...ids];

    if (ano && mes) {
      query += ` AND strftime('%Y', data_competencia) = ? AND strftime('%m', data_competencia) = ?`;
      params.push(ano, mes.padStart(2, '0'));
    }

    const result = await c.env.DB.prepare(query).bind(...params).first<{ debitos: number; creditos: number }>();
    
    const natureza = (conta as any).natureza;
    const saldo = natureza === 'DEVEDORA' 
      ? (result?.debitos || 0) - (result?.creditos || 0)
      : (result?.creditos || 0) - (result?.debitos || 0);

    return c.json({ success: true, data: { ...result, saldo } });
  }

  // Conta analitica
  let query = `
    SELECT 
      COALESCE(SUM(CASE WHEN tipo_lancamento = 'DEBITO' THEN valor ELSE 0 END), 0) as debitos,
      COALESCE(SUM(CASE WHEN tipo_lancamento = 'CREDITO' THEN valor ELSE 0 END), 0) as creditos
    FROM lancamentos_contabeis
    WHERE conta_id = ? AND estornado = 0
  `;
  const params: any[] = [id];

  if (ano && mes) {
    query += ` AND strftime('%Y', data_competencia) = ? AND strftime('%m', data_competencia) = ?`;
    params.push(ano, mes.padStart(2, '0'));
  }

  const result = await c.env.DB.prepare(query).bind(...params).first<{ debitos: number; creditos: number }>();
  
  const natureza = (conta as any).natureza;
  const saldo = natureza === 'DEVEDORA' 
    ? (result?.debitos || 0) - (result?.creditos || 0)
    : (result?.creditos || 0) - (result?.debitos || 0);

  return c.json({ success: true, data: { ...result, saldo } });
});

// GET /plano-contas/:id/movimentacao - Extrato da conta
planoContas.get('/:id/movimentacao', requirePermission('financeiro', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const { data_inicio, data_fim, limite, offset } = c.req.query();

  const conta = await c.env.DB.prepare(`
    SELECT id FROM plano_contas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!conta) {
    return c.json({ success: false, error: 'Conta nao encontrada' }, 404);
  }

  let query = `
    SELECT 
      lc.*,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      u.nome as usuario_nome
    FROM lancamentos_contabeis lc
    LEFT JOIN centros_custo cc ON lc.centro_custo_id = cc.id
    LEFT JOIN usuarios u ON lc.usuario_id = u.id
    WHERE lc.conta_id = ?
  `;
  const params: any[] = [id];

  if (data_inicio) {
    query += ` AND lc.data_lancamento >= ?`;
    params.push(data_inicio);
  }

  if (data_fim) {
    query += ` AND lc.data_lancamento <= ?`;
    params.push(data_fim);
  }

  query += ` ORDER BY lc.data_lancamento DESC, lc.numero_lancamento DESC`;

  if (limite) {
    query += ` LIMIT ?`;
    params.push(parseInt(limite));
  }

  if (offset) {
    query += ` OFFSET ?`;
    params.push(parseInt(offset));
  }

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({ success: true, data: result.results });
});

// POST /plano-contas - Criar conta
planoContas.post('/', requirePermission('financeiro', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = contaSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados invalidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  // Verificar codigo duplicado
  const existe = await c.env.DB.prepare(`
    SELECT id FROM plano_contas WHERE empresa_id = ? AND codigo = ?
  `).bind(usuario.empresa_id, data.codigo).first();

  if (existe) {
    return c.json({ success: false, error: 'Codigo ja cadastrado' }, 400);
  }

  // Verificar conta pai
  let nivel = 1;
  if (data.conta_pai_id) {
    const pai = await c.env.DB.prepare(`
      SELECT id, nivel, sintetica FROM plano_contas WHERE id = ? AND empresa_id = ?
    `).bind(data.conta_pai_id, usuario.empresa_id).first<{ id: string; nivel: number; sintetica: number }>();

    if (!pai) {
      return c.json({ success: false, error: 'Conta pai nao encontrada' }, 400);
    }

    // Conta pai deve ser sintetica
    if (!pai.sintetica) {
      return c.json({ success: false, error: 'Conta pai deve ser sintetica para ter filhas' }, 400);
    }

    nivel = pai.nivel + 1;

    if (nivel > 7) {
      return c.json({ success: false, error: 'Nivel maximo de hierarquia atingido (7)' }, 400);
    }
  }

  // Conta sintetica nao aceita lancamento
  const aceitaLancamento = data.sintetica ? false : data.aceita_lancamento;

  const id = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO plano_contas (
      id, empresa_id, codigo, codigo_reduzido, nome, tipo, natureza, grupo,
      sintetica, conta_pai_id, nivel, aceita_lancamento, conta_sped, conta_dre,
      observacoes, ativo
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, usuario.empresa_id, data.codigo, data.codigo_reduzido || null, data.nome,
    data.tipo, data.natureza, data.grupo || null, data.sintetica ? 1 : 0,
    data.conta_pai_id || null, nivel, aceitaLancamento ? 1 : 0,
    data.conta_sped || null, data.conta_dre || null, data.observacoes || null,
    data.ativo ? 1 : 0
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'plano_contas',
    entidade_id: id,
    dados_novos: data
  });

  return c.json({ success: true, data: { id } }, 201);
});

// PUT /plano-contas/:id - Atualizar conta
planoContas.put('/:id', requirePermission('financeiro', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const contaAtual = await c.env.DB.prepare(`
    SELECT * FROM plano_contas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!contaAtual) {
    return c.json({ success: false, error: 'Conta nao encontrada' }, 404);
  }

  const validation = contaSchema.partial().safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados invalidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  // Verificar codigo duplicado
  if (data.codigo) {
    const existe = await c.env.DB.prepare(`
      SELECT id FROM plano_contas WHERE empresa_id = ? AND codigo = ? AND id != ?
    `).bind(usuario.empresa_id, data.codigo, id).first();

    if (existe) {
      return c.json({ success: false, error: 'Codigo ja cadastrado para outra conta' }, 400);
    }
  }

  // Verificar conta pai
  let nivel = (contaAtual as any).nivel;
  if (data.conta_pai_id !== undefined) {
    if (data.conta_pai_id === id) {
      return c.json({ success: false, error: 'Conta nao pode ser pai de si mesma' }, 400);
    }

    if (data.conta_pai_id) {
      const pai = await c.env.DB.prepare(`
        SELECT id, nivel, sintetica FROM plano_contas WHERE id = ? AND empresa_id = ?
      `).bind(data.conta_pai_id, usuario.empresa_id).first<{ id: string; nivel: number; sintetica: number }>();

      if (!pai) {
        return c.json({ success: false, error: 'Conta pai nao encontrada' }, 400);
      }

      if (!pai.sintetica) {
        return c.json({ success: false, error: 'Conta pai deve ser sintetica' }, 400);
      }

      nivel = pai.nivel + 1;
    } else {
      nivel = 1;
    }
  }

  // Se mudando para analitica, verificar se tem filhas
  if (data.sintetica === false && (contaAtual as any).sintetica) {
    const temFilhas = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM plano_contas WHERE conta_pai_id = ?
    `).bind(id).first<{ total: number }>();

    if (temFilhas && temFilhas.total > 0) {
      return c.json({ success: false, error: 'Conta possui filhas e nao pode ser convertida para analitica' }, 400);
    }
  }

  // Conta sintetica nao aceita lancamento
  let aceitaLancamento = data.aceita_lancamento;
  if (data.sintetica === true || (data.sintetica === undefined && (contaAtual as any).sintetica)) {
    aceitaLancamento = false;
  }

  await c.env.DB.prepare(`
    UPDATE plano_contas SET
      codigo = COALESCE(?, codigo),
      codigo_reduzido = COALESCE(?, codigo_reduzido),
      nome = COALESCE(?, nome),
      tipo = COALESCE(?, tipo),
      natureza = COALESCE(?, natureza),
      grupo = COALESCE(?, grupo),
      sintetica = COALESCE(?, sintetica),
      conta_pai_id = ?,
      nivel = ?,
      aceita_lancamento = COALESCE(?, aceita_lancamento),
      conta_sped = COALESCE(?, conta_sped),
      conta_dre = COALESCE(?, conta_dre),
      observacoes = COALESCE(?, observacoes),
      ativo = COALESCE(?, ativo),
      data_inativacao = CASE WHEN ? = 0 AND ativo = 1 THEN CURRENT_TIMESTAMP ELSE data_inativacao END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(
    data.codigo, data.codigo_reduzido, data.nome, data.tipo, data.natureza, data.grupo,
    data.sintetica !== undefined ? (data.sintetica ? 1 : 0) : null,
    data.conta_pai_id !== undefined ? data.conta_pai_id : (contaAtual as any).conta_pai_id,
    nivel,
    aceitaLancamento !== undefined ? (aceitaLancamento ? 1 : 0) : null,
    data.conta_sped, data.conta_dre, data.observacoes,
    data.ativo !== undefined ? (data.ativo ? 1 : 0) : null,
    data.ativo !== undefined ? (data.ativo ? 1 : 0) : 1,
    id, usuario.empresa_id
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'EDITAR',
    entidade: 'plano_contas',
    entidade_id: id,
    dados_anteriores: contaAtual,
    dados_novos: data
  });

  return c.json({ success: true });
});

// DELETE /plano-contas/:id - Excluir conta
planoContas.delete('/:id', requirePermission('financeiro', 'excluir'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const conta = await c.env.DB.prepare(`
    SELECT * FROM plano_contas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!conta) {
    return c.json({ success: false, error: 'Conta nao encontrada' }, 404);
  }

  // Verificar se tem filhas
  const temFilhas = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM plano_contas WHERE conta_pai_id = ?
  `).bind(id).first<{ total: number }>();

  if (temFilhas && temFilhas.total > 0) {
    return c.json({ success: false, error: 'Conta possui subcontas. Remova-as primeiro.' }, 400);
  }

  // Verificar se tem lancamentos
  const temLancamentos = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM lancamentos_contabeis WHERE conta_id = ?
  `).bind(id).first<{ total: number }>();

  if (temLancamentos && temLancamentos.total > 0) {
    return c.json({ success: false, error: 'Conta possui lancamentos e nao pode ser excluida' }, 400);
  }

  // Verificar se esta em uso em contas a pagar/receber
  const emUso = await c.env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM contas_pagar WHERE plano_conta_id = ?) +
      (SELECT COUNT(*) FROM contas_receber WHERE plano_conta_id = ?) as total
  `).bind(id, id).first<{ total: number }>();

  if (emUso && emUso.total > 0) {
    return c.json({ success: false, error: 'Conta esta em uso e nao pode ser excluida' }, 400);
  }

  await c.env.DB.prepare(`
    DELETE FROM plano_contas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'EXCLUIR',
    entidade: 'plano_contas',
    entidade_id: id,
    dados_anteriores: conta
  });

  return c.json({ success: true });
});

// POST /plano-contas/importar - Importar plano de contas padrao
planoContas.post('/importar', requirePermission('financeiro', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const { tipo } = await c.req.json();

  // Verificar se ja existe plano de contas
  const existente = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM plano_contas WHERE empresa_id = ?
  `).bind(usuario.empresa_id).first<{ total: number }>();

  if (existente && existente.total > 0) {
    return c.json({ success: false, error: 'Ja existe um plano de contas cadastrado. Exclua-o primeiro para importar um novo.' }, 400);
  }

  // Plano de contas padrao simplificado
  const planosPadrao: Record<string, any[]> = {
    'COMERCIO': [
      { codigo: '1', nome: 'ATIVO', tipo: 'ATIVO', natureza: 'DEVEDORA', grupo: 'ATIVO', sintetica: true },
      { codigo: '1.1', nome: 'ATIVO CIRCULANTE', tipo: 'ATIVO', natureza: 'DEVEDORA', grupo: 'ATIVO', sintetica: true, pai: '1' },
      { codigo: '1.1.1', nome: 'DISPONIBILIDADES', tipo: 'ATIVO', natureza: 'DEVEDORA', grupo: 'ATIVO', sintetica: true, pai: '1.1' },
      { codigo: '1.1.1.01', nome: 'CAIXA', tipo: 'ATIVO', natureza: 'DEVEDORA', grupo: 'ATIVO', sintetica: false, pai: '1.1.1' },
      { codigo: '1.1.1.02', nome: 'BANCOS CONTA MOVIMENTO', tipo: 'ATIVO', natureza: 'DEVEDORA', grupo: 'ATIVO', sintetica: false, pai: '1.1.1' },
      { codigo: '1.1.2', nome: 'CLIENTES', tipo: 'ATIVO', natureza: 'DEVEDORA', grupo: 'ATIVO', sintetica: true, pai: '1.1' },
      { codigo: '1.1.2.01', nome: 'DUPLICATAS A RECEBER', tipo: 'ATIVO', natureza: 'DEVEDORA', grupo: 'ATIVO', sintetica: false, pai: '1.1.2' },
      { codigo: '1.1.3', nome: 'ESTOQUES', tipo: 'ATIVO', natureza: 'DEVEDORA', grupo: 'ATIVO', sintetica: true, pai: '1.1' },
      { codigo: '1.1.3.01', nome: 'MERCADORIAS PARA REVENDA', tipo: 'ATIVO', natureza: 'DEVEDORA', grupo: 'ATIVO', sintetica: false, pai: '1.1.3' },
      { codigo: '2', nome: 'PASSIVO', tipo: 'PASSIVO', natureza: 'CREDORA', grupo: 'PASSIVO', sintetica: true },
      { codigo: '2.1', nome: 'PASSIVO CIRCULANTE', tipo: 'PASSIVO', natureza: 'CREDORA', grupo: 'PASSIVO', sintetica: true, pai: '2' },
      { codigo: '2.1.1', nome: 'FORNECEDORES', tipo: 'PASSIVO', natureza: 'CREDORA', grupo: 'PASSIVO', sintetica: true, pai: '2.1' },
      { codigo: '2.1.1.01', nome: 'DUPLICATAS A PAGAR', tipo: 'PASSIVO', natureza: 'CREDORA', grupo: 'PASSIVO', sintetica: false, pai: '2.1.1' },
      { codigo: '2.1.2', nome: 'OBRIGACOES FISCAIS', tipo: 'PASSIVO', natureza: 'CREDORA', grupo: 'PASSIVO', sintetica: true, pai: '2.1' },
      { codigo: '2.1.2.01', nome: 'ICMS A RECOLHER', tipo: 'PASSIVO', natureza: 'CREDORA', grupo: 'PASSIVO', sintetica: false, pai: '2.1.2' },
      { codigo: '3', nome: 'PATRIMONIO LIQUIDO', tipo: 'PATRIMONIO', natureza: 'CREDORA', grupo: 'PL', sintetica: true },
      { codigo: '3.1', nome: 'CAPITAL SOCIAL', tipo: 'PATRIMONIO', natureza: 'CREDORA', grupo: 'PL', sintetica: true, pai: '3' },
      { codigo: '3.1.1', nome: 'CAPITAL SUBSCRITO', tipo: 'PATRIMONIO', natureza: 'CREDORA', grupo: 'PL', sintetica: false, pai: '3.1' },
      { codigo: '4', nome: 'RECEITAS', tipo: 'RECEITA', natureza: 'CREDORA', grupo: 'RECEITA', sintetica: true },
      { codigo: '4.1', nome: 'RECEITA BRUTA DE VENDAS', tipo: 'RECEITA', natureza: 'CREDORA', grupo: 'RECEITA', sintetica: true, pai: '4' },
      { codigo: '4.1.1', nome: 'VENDAS DE MERCADORIAS', tipo: 'RECEITA', natureza: 'CREDORA', grupo: 'RECEITA', sintetica: false, pai: '4.1' },
      { codigo: '5', nome: 'CUSTOS', tipo: 'DESPESA', natureza: 'DEVEDORA', grupo: 'CUSTO', sintetica: true },
      { codigo: '5.1', nome: 'CUSTO DAS MERCADORIAS VENDIDAS', tipo: 'DESPESA', natureza: 'DEVEDORA', grupo: 'CUSTO', sintetica: true, pai: '5' },
      { codigo: '5.1.1', nome: 'CMV', tipo: 'DESPESA', natureza: 'DEVEDORA', grupo: 'CUSTO', sintetica: false, pai: '5.1' },
      { codigo: '6', nome: 'DESPESAS', tipo: 'DESPESA', natureza: 'DEVEDORA', grupo: 'DESPESA', sintetica: true },
      { codigo: '6.1', nome: 'DESPESAS ADMINISTRATIVAS', tipo: 'DESPESA', natureza: 'DEVEDORA', grupo: 'DESPESA', sintetica: true, pai: '6' },
      { codigo: '6.1.1', nome: 'SALARIOS E ORDENADOS', tipo: 'DESPESA', natureza: 'DEVEDORA', grupo: 'DESPESA', sintetica: false, pai: '6.1' },
      { codigo: '6.1.2', nome: 'ENCARGOS SOCIAIS', tipo: 'DESPESA', natureza: 'DEVEDORA', grupo: 'DESPESA', sintetica: false, pai: '6.1' },
      { codigo: '6.1.3', nome: 'ALUGUEL', tipo: 'DESPESA', natureza: 'DEVEDORA', grupo: 'DESPESA', sintetica: false, pai: '6.1' },
      { codigo: '6.1.4', nome: 'ENERGIA ELETRICA', tipo: 'DESPESA', natureza: 'DEVEDORA', grupo: 'DESPESA', sintetica: false, pai: '6.1' },
      { codigo: '6.2', nome: 'DESPESAS COMERCIAIS', tipo: 'DESPESA', natureza: 'DEVEDORA', grupo: 'DESPESA', sintetica: true, pai: '6' },
      { codigo: '6.2.1', nome: 'COMISSOES SOBRE VENDAS', tipo: 'DESPESA', natureza: 'DEVEDORA', grupo: 'DESPESA', sintetica: false, pai: '6.2' },
      { codigo: '6.2.2', nome: 'FRETE SOBRE VENDAS', tipo: 'DESPESA', natureza: 'DEVEDORA', grupo: 'DESPESA', sintetica: false, pai: '6.2' },
    ]
  };

  const plano = planosPadrao[tipo || 'COMERCIO'];
  if (!plano) {
    return c.json({ success: false, error: 'Tipo de plano nao encontrado' }, 400);
  }

  // Criar mapa de codigos para IDs
  const codigoParaId = new Map<string, string>();

  for (const conta of plano) {
    const id = crypto.randomUUID();
    codigoParaId.set(conta.codigo, id);

    const paiId = conta.pai ? codigoParaId.get(conta.pai) : null;
    const nivel = conta.codigo.split('.').length;

    await c.env.DB.prepare(`
      INSERT INTO plano_contas (
        id, empresa_id, codigo, nome, tipo, natureza, grupo,
        sintetica, conta_pai_id, nivel, aceita_lancamento, ativo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      id, usuario.empresa_id, conta.codigo, conta.nome, conta.tipo, conta.natureza,
      conta.grupo, conta.sintetica ? 1 : 0, paiId, nivel, conta.sintetica ? 0 : 1
    ).run();
  }

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'plano_contas',
    entidade_id: 'importacao',
    dados_novos: { tipo, total_contas: plano.length }
  });

  return c.json({ success: true, data: { total: plano.length } }, 201);
});

export default planoContas;
