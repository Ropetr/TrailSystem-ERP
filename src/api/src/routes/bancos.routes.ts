// ============================================
// PLANAC ERP - Rotas de Bancos e Tesouraria
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const bancos = new Hono<{ Bindings: Bindings; Variables: Variables }>();

bancos.use('/*', requireAuth());

// Schemas
const contaBancariaSchema = z.object({
  banco_codigo: z.string(),
  banco_nome: z.string(),
  agencia: z.string(),
  agencia_digito: z.string().optional(),
  conta: z.string(),
  conta_digito: z.string().optional(),
  tipo: z.enum(['CORRENTE', 'POUPANCA', 'INVESTIMENTO', 'PAGAMENTOS']),
  descricao: z.string().optional(),
  saldo_inicial: z.number().default(0),
  data_saldo_inicial: z.string().optional(),
  limite_credito: z.number().default(0),
  ativa: z.boolean().default(true)
});

const movimentacaoBancariaSchema = z.object({
  conta_bancaria_id: z.string().uuid(),
  tipo: z.enum(['CREDITO', 'DEBITO']),
  valor: z.number().positive(),
  data: z.string(),
  descricao: z.string(),
  categoria: z.string().optional(),
  documento: z.string().optional(),
  compensado: z.boolean().default(false),
  referencia_tipo: z.string().optional(),
  referencia_id: z.string().uuid().optional()
});

const transferenciaContasSchema = z.object({
  conta_origem_id: z.string().uuid(),
  conta_destino_id: z.string().uuid(),
  valor: z.number().positive(),
  data: z.string(),
  descricao: z.string().optional()
});

// ==========================================
// CONTAS BANCÁRIAS
// ==========================================

// GET /bancos/contas - Listar contas
bancos.get('/contas', requirePermission('financeiro', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { ativa } = c.req.query();

  let query = `
    SELECT 
      cb.*,
      (
        SELECT COALESCE(SUM(CASE WHEN tipo = 'CREDITO' THEN valor ELSE -valor END), 0)
        FROM movimentacoes_bancarias 
        WHERE conta_bancaria_id = cb.id AND compensado = 1
      ) as saldo_compensado,
      (
        SELECT COALESCE(SUM(CASE WHEN tipo = 'CREDITO' THEN valor ELSE -valor END), 0)
        FROM movimentacoes_bancarias 
        WHERE conta_bancaria_id = cb.id
      ) as saldo_previsto
    FROM contas_bancarias cb
    WHERE cb.empresa_id = ?
  `;
  const params: any[] = [usuario.empresa_id];

  if (ativa !== undefined) {
    query += ` AND cb.ativa = ?`;
    params.push(ativa === 'true' ? 1 : 0);
  }

  query += ` ORDER BY cb.banco_nome, cb.agencia`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  // Calcular saldo atual (inicial + movimentações)
  const contas = (result.results as any[]).map(conta => ({
    ...conta,
    saldo_atual: conta.saldo_inicial + (conta.saldo_compensado || 0),
    saldo_previsto: conta.saldo_inicial + (conta.saldo_previsto || 0)
  }));

  return c.json({ success: true, data: contas });
});

// GET /bancos/resumo - Dashboard financeiro
bancos.get('/resumo', requirePermission('financeiro', 'listar'), async (c) => {
  const usuario = c.get('usuario');

  // Saldo total
  const saldoTotal = await c.env.DB.prepare(`
    SELECT 
      SUM(cb.saldo_inicial + COALESCE(m.saldo, 0)) as saldo_total
    FROM contas_bancarias cb
    LEFT JOIN (
      SELECT 
        conta_bancaria_id,
        SUM(CASE WHEN tipo = 'CREDITO' THEN valor ELSE -valor END) as saldo
      FROM movimentacoes_bancarias
      WHERE compensado = 1
      GROUP BY conta_bancaria_id
    ) m ON cb.id = m.conta_bancaria_id
    WHERE cb.empresa_id = ? AND cb.ativa = 1
  `).bind(usuario.empresa_id).first<{ saldo_total: number }>();

  // Entradas/saídas do mês
  const mesAtual = await c.env.DB.prepare(`
    SELECT 
      SUM(CASE WHEN tipo = 'CREDITO' THEN valor ELSE 0 END) as entradas,
      SUM(CASE WHEN tipo = 'DEBITO' THEN valor ELSE 0 END) as saidas
    FROM movimentacoes_bancarias mb
    JOIN contas_bancarias cb ON mb.conta_bancaria_id = cb.id
    WHERE cb.empresa_id = ? 
      AND strftime('%Y-%m', mb.data) = strftime('%Y-%m', 'now')
  `).bind(usuario.empresa_id).first<{ entradas: number; saidas: number }>();

  // Pendentes de conciliação
  const pendentes = await c.env.DB.prepare(`
    SELECT COUNT(*) as total
    FROM movimentacoes_bancarias mb
    JOIN contas_bancarias cb ON mb.conta_bancaria_id = cb.id
    WHERE cb.empresa_id = ? AND mb.compensado = 0
  `).bind(usuario.empresa_id).first<{ total: number }>();

  // Saldo por conta
  const saldoPorConta = await c.env.DB.prepare(`
    SELECT 
      cb.id,
      cb.banco_nome,
      cb.agencia,
      cb.conta,
      cb.tipo,
      cb.saldo_inicial + COALESCE(
        (SELECT SUM(CASE WHEN tipo = 'CREDITO' THEN valor ELSE -valor END) 
         FROM movimentacoes_bancarias WHERE conta_bancaria_id = cb.id AND compensado = 1), 0
      ) as saldo
    FROM contas_bancarias cb
    WHERE cb.empresa_id = ? AND cb.ativa = 1
    ORDER BY saldo DESC
  `).bind(usuario.empresa_id).all();

  return c.json({
    success: true,
    data: {
      saldo_total: saldoTotal?.saldo_total || 0,
      entradas_mes: mesAtual?.entradas || 0,
      saidas_mes: mesAtual?.saidas || 0,
      pendentes_conciliacao: pendentes?.total || 0,
      saldo_por_conta: saldoPorConta.results
    }
  });
});

// GET /bancos/contas/:id - Buscar conta
bancos.get('/contas/:id', requirePermission('financeiro', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const conta = await c.env.DB.prepare(`
    SELECT * FROM contas_bancarias WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!conta) {
    return c.json({ success: false, error: 'Conta não encontrada' }, 404);
  }

  // Últimas movimentações
  const movimentacoes = await c.env.DB.prepare(`
    SELECT * FROM movimentacoes_bancarias
    WHERE conta_bancaria_id = ?
    ORDER BY data DESC, created_at DESC
    LIMIT 50
  `).bind(id).all();

  // Saldo calculado
  const saldo = await c.env.DB.prepare(`
    SELECT 
      SUM(CASE WHEN tipo = 'CREDITO' THEN valor ELSE -valor END) as total,
      SUM(CASE WHEN tipo = 'CREDITO' AND compensado = 1 THEN valor 
              WHEN tipo = 'DEBITO' AND compensado = 1 THEN -valor 
              ELSE 0 END) as compensado
    FROM movimentacoes_bancarias
    WHERE conta_bancaria_id = ?
  `).bind(id).first<{ total: number; compensado: number }>();

  return c.json({
    success: true,
    data: {
      ...(conta as any),
      saldo_atual: (conta as any).saldo_inicial + (saldo?.compensado || 0),
      saldo_previsto: (conta as any).saldo_inicial + (saldo?.total || 0),
      movimentacoes: movimentacoes.results
    }
  });
});

// POST /bancos/contas - Criar conta
bancos.post('/contas', requirePermission('financeiro', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = contaBancariaSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;
  const id = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO contas_bancarias (
      id, empresa_id, banco_codigo, banco_nome, agencia, agencia_digito,
      conta, conta_digito, tipo, descricao, saldo_inicial, data_saldo_inicial,
      limite_credito, ativa
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, usuario.empresa_id, data.banco_codigo, data.banco_nome, data.agencia,
    data.agencia_digito || null, data.conta, data.conta_digito || null,
    data.tipo, data.descricao || null, data.saldo_inicial,
    data.data_saldo_inicial || new Date().toISOString().split('T')[0],
    data.limite_credito, data.ativa ? 1 : 0
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'contas_bancarias',
    entidade_id: id,
    dados_novos: data
  });

  return c.json({ success: true, data: { id } }, 201);
});

// PUT /bancos/contas/:id - Atualizar conta
bancos.put('/contas/:id', requirePermission('financeiro', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const contaAtual = await c.env.DB.prepare(`
    SELECT * FROM contas_bancarias WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!contaAtual) {
    return c.json({ success: false, error: 'Conta não encontrada' }, 404);
  }

  const validation = contaBancariaSchema.partial().safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  await c.env.DB.prepare(`
    UPDATE contas_bancarias SET
      banco_codigo = COALESCE(?, banco_codigo),
      banco_nome = COALESCE(?, banco_nome),
      agencia = COALESCE(?, agencia),
      agencia_digito = COALESCE(?, agencia_digito),
      conta = COALESCE(?, conta),
      conta_digito = COALESCE(?, conta_digito),
      tipo = COALESCE(?, tipo),
      descricao = COALESCE(?, descricao),
      limite_credito = COALESCE(?, limite_credito),
      ativa = COALESCE(?, ativa),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(
    data.banco_codigo, data.banco_nome, data.agencia, data.agencia_digito,
    data.conta, data.conta_digito, data.tipo, data.descricao, data.limite_credito,
    data.ativa !== undefined ? (data.ativa ? 1 : 0) : null,
    id, usuario.empresa_id
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'ATUALIZAR',
    entidade: 'contas_bancarias',
    entidade_id: id,
    dados_anteriores: contaAtual,
    dados_novos: data
  });

  return c.json({ success: true, message: 'Conta atualizada' });
});

// ==========================================
// MOVIMENTAÇÕES BANCÁRIAS
// ==========================================

// GET /bancos/movimentacoes - Listar movimentações
bancos.get('/movimentacoes', requirePermission('financeiro', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { conta_id, data_inicio, data_fim, tipo, compensado, page = '1', limit = '50' } = c.req.query();

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT 
      mb.*,
      cb.banco_nome,
      cb.agencia,
      cb.conta
    FROM movimentacoes_bancarias mb
    JOIN contas_bancarias cb ON mb.conta_bancaria_id = cb.id
    WHERE cb.empresa_id = ?
  `;
  const params: any[] = [usuario.empresa_id];

  if (conta_id) {
    query += ` AND mb.conta_bancaria_id = ?`;
    params.push(conta_id);
  }

  if (data_inicio) {
    query += ` AND mb.data >= ?`;
    params.push(data_inicio);
  }

  if (data_fim) {
    query += ` AND mb.data <= ?`;
    params.push(data_fim);
  }

  if (tipo) {
    query += ` AND mb.tipo = ?`;
    params.push(tipo);
  }

  if (compensado !== undefined) {
    query += ` AND mb.compensado = ?`;
    params.push(compensado === 'true' ? 1 : 0);
  }

  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
  const totalResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();

  query += ` ORDER BY mb.data DESC, mb.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalResult?.total || 0,
      pages: Math.ceil((totalResult?.total || 0) / parseInt(limit))
    }
  });
});

// POST /bancos/movimentacoes - Criar movimentação
bancos.post('/movimentacoes', requirePermission('financeiro', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = movimentacaoBancariaSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  // Verificar conta
  const conta = await c.env.DB.prepare(`
    SELECT id FROM contas_bancarias WHERE id = ? AND empresa_id = ?
  `).bind(data.conta_bancaria_id, usuario.empresa_id).first();

  if (!conta) {
    return c.json({ success: false, error: 'Conta não encontrada' }, 404);
  }

  const id = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO movimentacoes_bancarias (
      id, conta_bancaria_id, tipo, valor, data, descricao,
      categoria, documento, compensado, referencia_tipo, referencia_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, data.conta_bancaria_id, data.tipo, data.valor, data.data, data.descricao,
    data.categoria || null, data.documento || null, data.compensado ? 1 : 0,
    data.referencia_tipo || null, data.referencia_id || null
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'movimentacoes_bancarias',
    entidade_id: id,
    dados_novos: data
  });

  return c.json({ success: true, data: { id } }, 201);
});

// POST /bancos/movimentacoes/:id/compensar - Compensar
bancos.post('/movimentacoes/:id/compensar', requirePermission('financeiro', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const mov = await c.env.DB.prepare(`
    SELECT mb.* FROM movimentacoes_bancarias mb
    JOIN contas_bancarias cb ON mb.conta_bancaria_id = cb.id
    WHERE mb.id = ? AND cb.empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!mov) {
    return c.json({ success: false, error: 'Movimentação não encontrada' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE movimentacoes_bancarias SET 
      compensado = 1, 
      data_compensacao = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run();

  return c.json({ success: true, message: 'Movimentação compensada' });
});

// POST /bancos/movimentacoes/compensar-lote - Compensar em lote
bancos.post('/movimentacoes/compensar-lote', requirePermission('financeiro', 'editar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const { ids } = body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return c.json({ success: false, error: 'Informe os IDs' }, 400);
  }

  let compensados = 0;
  for (const id of ids) {
    const mov = await c.env.DB.prepare(`
      SELECT mb.id FROM movimentacoes_bancarias mb
      JOIN contas_bancarias cb ON mb.conta_bancaria_id = cb.id
      WHERE mb.id = ? AND cb.empresa_id = ? AND mb.compensado = 0
    `).bind(id, usuario.empresa_id).first();

    if (mov) {
      await c.env.DB.prepare(`
        UPDATE movimentacoes_bancarias SET 
          compensado = 1, 
          data_compensacao = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(id).run();
      compensados++;
    }
  }

  return c.json({ success: true, message: `${compensados} movimentações compensadas` });
});

// DELETE /bancos/movimentacoes/:id - Excluir
bancos.delete('/movimentacoes/:id', requirePermission('financeiro', 'excluir'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const mov = await c.env.DB.prepare(`
    SELECT mb.* FROM movimentacoes_bancarias mb
    JOIN contas_bancarias cb ON mb.conta_bancaria_id = cb.id
    WHERE mb.id = ? AND cb.empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!mov) {
    return c.json({ success: false, error: 'Movimentação não encontrada' }, 404);
  }

  // Não permitir excluir se tiver referência
  if ((mov as any).referencia_tipo && (mov as any).referencia_id) {
    return c.json({ success: false, error: 'Movimentação vinculada a outro documento' }, 400);
  }

  await c.env.DB.prepare(`DELETE FROM movimentacoes_bancarias WHERE id = ?`).bind(id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'EXCLUIR',
    entidade: 'movimentacoes_bancarias',
    entidade_id: id,
    dados_anteriores: mov
  });

  return c.json({ success: true, message: 'Movimentação excluída' });
});

// ==========================================
// TRANSFERÊNCIAS ENTRE CONTAS
// ==========================================

// POST /bancos/transferencia - Transferir entre contas
bancos.post('/transferencia', requirePermission('financeiro', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = transferenciaContasSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  if (data.conta_origem_id === data.conta_destino_id) {
    return c.json({ success: false, error: 'Contas devem ser diferentes' }, 400);
  }

  // Verificar contas
  const contaOrigem = await c.env.DB.prepare(`
    SELECT id, banco_nome FROM contas_bancarias WHERE id = ? AND empresa_id = ?
  `).bind(data.conta_origem_id, usuario.empresa_id).first<any>();

  const contaDestino = await c.env.DB.prepare(`
    SELECT id, banco_nome FROM contas_bancarias WHERE id = ? AND empresa_id = ?
  `).bind(data.conta_destino_id, usuario.empresa_id).first<any>();

  if (!contaOrigem || !contaDestino) {
    return c.json({ success: false, error: 'Conta não encontrada' }, 404);
  }

  const idSaida = crypto.randomUUID();
  const idEntrada = crypto.randomUUID();
  const descricao = data.descricao || `Transferência para ${contaDestino.banco_nome}`;

  // Débito na origem
  await c.env.DB.prepare(`
    INSERT INTO movimentacoes_bancarias (
      id, conta_bancaria_id, tipo, valor, data, descricao, categoria, compensado
    ) VALUES (?, ?, 'DEBITO', ?, ?, ?, 'TRANSFERENCIA', 1)
  `).bind(idSaida, data.conta_origem_id, data.valor, data.data, `Transf. para ${contaDestino.banco_nome}`).run();

  // Crédito no destino
  await c.env.DB.prepare(`
    INSERT INTO movimentacoes_bancarias (
      id, conta_bancaria_id, tipo, valor, data, descricao, categoria, compensado
    ) VALUES (?, ?, 'CREDITO', ?, ?, ?, 'TRANSFERENCIA', 1)
  `).bind(idEntrada, data.conta_destino_id, data.valor, data.data, `Transf. de ${contaOrigem.banco_nome}`).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'TRANSFERENCIA',
    entidade: 'contas_bancarias',
    entidade_id: data.conta_origem_id,
    dados_novos: data
  });

  return c.json({ success: true, message: 'Transferência realizada' });
});

// ==========================================
// CONCILIAÇÃO BANCÁRIA
// ==========================================

// GET /bancos/conciliacao/:conta_id - Pendentes de conciliação
bancos.get('/conciliacao/:conta_id', requirePermission('financeiro', 'listar'), async (c) => {
  const { conta_id } = c.req.param();
  const usuario = c.get('usuario');

  const conta = await c.env.DB.prepare(`
    SELECT * FROM contas_bancarias WHERE id = ? AND empresa_id = ?
  `).bind(conta_id, usuario.empresa_id).first();

  if (!conta) {
    return c.json({ success: false, error: 'Conta não encontrada' }, 404);
  }

  const pendentes = await c.env.DB.prepare(`
    SELECT * FROM movimentacoes_bancarias
    WHERE conta_bancaria_id = ? AND compensado = 0
    ORDER BY data, created_at
  `).bind(conta_id).all();

  const saldoSistema = await c.env.DB.prepare(`
    SELECT 
      SUM(CASE WHEN tipo = 'CREDITO' THEN valor ELSE -valor END) as total
    FROM movimentacoes_bancarias
    WHERE conta_bancaria_id = ?
  `).bind(conta_id).first<{ total: number }>();

  return c.json({
    success: true,
    data: {
      conta,
      saldo_inicial: (conta as any).saldo_inicial,
      saldo_sistema: (conta as any).saldo_inicial + (saldoSistema?.total || 0),
      pendentes: pendentes.results,
      total_pendentes: pendentes.results?.length || 0
    }
  });
});

export default bancos;
