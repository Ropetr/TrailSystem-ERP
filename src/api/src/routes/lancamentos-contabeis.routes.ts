// ============================================
// PLANAC ERP - Rotas de Lancamentos Contabeis
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const lancamentosContabeis = new Hono<{ Bindings: Bindings; Variables: Variables }>();

lancamentosContabeis.use('/*', requireAuth());

// Schemas
const partidaSchema = z.object({
  conta_id: z.string().uuid(),
  centro_custo_id: z.string().uuid().optional().nullable(),
  tipo_lancamento: z.enum(['DEBITO', 'CREDITO']),
  valor: z.number().positive(),
  historico: z.string().min(1)
});

const lancamentoSchema = z.object({
  data_lancamento: z.string(),
  data_competencia: z.string(),
  partidas: z.array(partidaSchema).min(2),
  documento_origem_tipo: z.string().optional().nullable(),
  documento_origem_id: z.string().uuid().optional().nullable(),
  lote_id: z.string().uuid().optional().nullable()
});

// GET /lancamentos-contabeis - Listar lancamentos
lancamentosContabeis.get('/', requirePermission('financeiro', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { data_inicio, data_fim, conta_id, centro_custo_id, tipo, limite, offset } = c.req.query();

  let query = `
    SELECT 
      lc.*,
      pc.codigo as conta_codigo,
      pc.nome as conta_nome,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      u.nome as usuario_nome
    FROM lancamentos_contabeis lc
    LEFT JOIN plano_contas pc ON lc.conta_id = pc.id
    LEFT JOIN centros_custo cc ON lc.centro_custo_id = cc.id
    LEFT JOIN usuarios u ON lc.usuario_id = u.id
    WHERE lc.empresa_id = ?
  `;
  const params: any[] = [usuario.empresa_id];

  if (data_inicio) {
    query += ` AND lc.data_lancamento >= ?`;
    params.push(data_inicio);
  }

  if (data_fim) {
    query += ` AND lc.data_lancamento <= ?`;
    params.push(data_fim);
  }

  if (conta_id) {
    query += ` AND lc.conta_id = ?`;
    params.push(conta_id);
  }

  if (centro_custo_id) {
    query += ` AND lc.centro_custo_id = ?`;
    params.push(centro_custo_id);
  }

  if (tipo) {
    query += ` AND lc.tipo_lancamento = ?`;
    params.push(tipo);
  }

  query += ` ORDER BY lc.data_lancamento DESC, lc.numero_lancamento DESC`;

  if (limite) {
    query += ` LIMIT ?`;
    params.push(parseInt(limite));
  } else {
    query += ` LIMIT 100`;
  }

  if (offset) {
    query += ` OFFSET ?`;
    params.push(parseInt(offset));
  }

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({ success: true, data: result.results });
});

// GET /lancamentos-contabeis/diario - Livro diario
lancamentosContabeis.get('/diario', requirePermission('financeiro', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { ano, mes } = c.req.query();

  if (!ano || !mes) {
    return c.json({ success: false, error: 'Ano e mes sao obrigatorios' }, 400);
  }

  const result = await c.env.DB.prepare(`
    SELECT 
      lc.*,
      pc.codigo as conta_codigo,
      pc.nome as conta_nome,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome
    FROM lancamentos_contabeis lc
    LEFT JOIN plano_contas pc ON lc.conta_id = pc.id
    LEFT JOIN centros_custo cc ON lc.centro_custo_id = cc.id
    WHERE lc.empresa_id = ?
      AND strftime('%Y', lc.data_lancamento) = ?
      AND strftime('%m', lc.data_lancamento) = ?
      AND lc.estornado = 0
    ORDER BY lc.data_lancamento, lc.numero_lancamento
  `).bind(usuario.empresa_id, ano, mes.padStart(2, '0')).all();

  return c.json({ success: true, data: result.results });
});

// GET /lancamentos-contabeis/razao/:conta_id - Razao da conta
lancamentosContabeis.get('/razao/:conta_id', requirePermission('financeiro', 'listar'), async (c) => {
  const { conta_id } = c.req.param();
  const usuario = c.get('usuario');
  const { ano, mes, data_inicio, data_fim } = c.req.query();

  // Verificar se conta existe
  const conta = await c.env.DB.prepare(`
    SELECT id, codigo, nome, natureza FROM plano_contas
    WHERE id = ? AND empresa_id = ?
  `).bind(conta_id, usuario.empresa_id).first();

  if (!conta) {
    return c.json({ success: false, error: 'Conta nao encontrada' }, 404);
  }

  let query = `
    SELECT 
      lc.*,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome
    FROM lancamentos_contabeis lc
    LEFT JOIN centros_custo cc ON lc.centro_custo_id = cc.id
    WHERE lc.conta_id = ? AND lc.estornado = 0
  `;
  const params: any[] = [conta_id];

  if (ano && mes) {
    query += ` AND strftime('%Y', lc.data_competencia) = ? AND strftime('%m', lc.data_competencia) = ?`;
    params.push(ano, mes.padStart(2, '0'));
  } else if (data_inicio && data_fim) {
    query += ` AND lc.data_competencia BETWEEN ? AND ?`;
    params.push(data_inicio, data_fim);
  }

  query += ` ORDER BY lc.data_lancamento, lc.numero_lancamento`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  // Calcular saldo acumulado
  const natureza = (conta as any).natureza;
  let saldoAcumulado = 0;
  const lancamentosComSaldo = (result.results as any[]).map(lc => {
    if (natureza === 'DEVEDORA') {
      saldoAcumulado += lc.tipo_lancamento === 'DEBITO' ? lc.valor : -lc.valor;
    } else {
      saldoAcumulado += lc.tipo_lancamento === 'CREDITO' ? lc.valor : -lc.valor;
    }
    return { ...lc, saldo_acumulado: saldoAcumulado };
  });

  return c.json({
    success: true,
    data: {
      conta,
      lancamentos: lancamentosComSaldo,
      saldo_final: saldoAcumulado
    }
  });
});

// GET /lancamentos-contabeis/:id - Buscar por ID
lancamentosContabeis.get('/:id', requirePermission('financeiro', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const lancamento = await c.env.DB.prepare(`
    SELECT 
      lc.*,
      pc.codigo as conta_codigo,
      pc.nome as conta_nome,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      u.nome as usuario_nome
    FROM lancamentos_contabeis lc
    LEFT JOIN plano_contas pc ON lc.conta_id = pc.id
    LEFT JOIN centros_custo cc ON lc.centro_custo_id = cc.id
    LEFT JOIN usuarios u ON lc.usuario_id = u.id
    WHERE lc.id = ? AND lc.empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!lancamento) {
    return c.json({ success: false, error: 'Lancamento nao encontrado' }, 404);
  }

  return c.json({ success: true, data: lancamento });
});

// POST /lancamentos-contabeis - Criar lancamento (partidas dobradas)
lancamentosContabeis.post('/', requirePermission('financeiro', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = lancamentoSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados invalidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  // Verificar se periodo esta fechado
  const dataComp = new Date(data.data_competencia);
  const ano = dataComp.getFullYear();
  const mes = dataComp.getMonth() + 1;

  const fechamento = await c.env.DB.prepare(`
    SELECT id FROM fechamentos_contabeis
    WHERE empresa_id = ? AND ano = ? AND mes = ? AND status = 'FECHADO'
  `).bind(usuario.empresa_id, ano, mes).first();

  if (fechamento) {
    return c.json({ success: false, error: 'Periodo contabil fechado. Nao e possivel lancar.' }, 400);
  }

  // Validar partidas dobradas (debito = credito)
  let totalDebitos = 0;
  let totalCreditos = 0;

  for (const partida of data.partidas) {
    if (partida.tipo_lancamento === 'DEBITO') {
      totalDebitos += partida.valor;
    } else {
      totalCreditos += partida.valor;
    }

    // Verificar se conta existe e aceita lancamento
    const conta = await c.env.DB.prepare(`
      SELECT id, aceita_lancamento, tipo FROM plano_contas
      WHERE id = ? AND empresa_id = ?
    `).bind(partida.conta_id, usuario.empresa_id).first<{ id: string; aceita_lancamento: number; tipo: string }>();

    if (!conta) {
      return c.json({ success: false, error: `Conta ${partida.conta_id} nao encontrada` }, 400);
    }

    if (!conta.aceita_lancamento) {
      return c.json({ success: false, error: `Conta ${partida.conta_id} nao aceita lancamentos (sintetica)` }, 400);
    }

    // Verificar se centro de custo e obrigatorio para despesas
    if (conta.tipo === 'DESPESA' && !partida.centro_custo_id) {
      return c.json({ success: false, error: `Centro de custo obrigatorio para contas de despesa` }, 400);
    }

    // Verificar centro de custo se informado
    if (partida.centro_custo_id) {
      const cc = await c.env.DB.prepare(`
        SELECT id, aceita_lancamento FROM centros_custo
        WHERE id = ? AND empresa_id = ?
      `).bind(partida.centro_custo_id, usuario.empresa_id).first<{ id: string; aceita_lancamento: number }>();

      if (!cc) {
        return c.json({ success: false, error: `Centro de custo ${partida.centro_custo_id} nao encontrado` }, 400);
      }

      if (!cc.aceita_lancamento) {
        return c.json({ success: false, error: `Centro de custo ${partida.centro_custo_id} nao aceita lancamentos` }, 400);
      }
    }
  }

  // Validar debito = credito
  if (Math.abs(totalDebitos - totalCreditos) > 0.01) {
    return c.json({ 
      success: false, 
      error: `Lancamento desbalanceado. Debitos: ${totalDebitos.toFixed(2)}, Creditos: ${totalCreditos.toFixed(2)}` 
    }, 400);
  }

  // Obter proximo numero de lancamento
  const ultimoNumero = await c.env.DB.prepare(`
    SELECT MAX(numero_lancamento) as ultimo FROM lancamentos_contabeis
    WHERE empresa_id = ?
  `).bind(usuario.empresa_id).first<{ ultimo: number }>();

  let numeroLancamento = (ultimoNumero?.ultimo || 0) + 1;
  const lancamentosIds: string[] = [];

  // Criar lancamentos
  for (const partida of data.partidas) {
    const id = crypto.randomUUID();
    lancamentosIds.push(id);

    await c.env.DB.prepare(`
      INSERT INTO lancamentos_contabeis (
        id, empresa_id, numero_lancamento, data_lancamento, data_competencia,
        conta_id, centro_custo_id, tipo_lancamento, valor, historico,
        documento_origem_tipo, documento_origem_id, lote_id, usuario_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, usuario.empresa_id, numeroLancamento, data.data_lancamento, data.data_competencia,
      partida.conta_id, partida.centro_custo_id || null, partida.tipo_lancamento, partida.valor,
      partida.historico, data.documento_origem_tipo || null, data.documento_origem_id || null,
      data.lote_id || null, usuario.id
    ).run();

    numeroLancamento++;
  }

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'lancamentos_contabeis',
    entidade_id: lancamentosIds[0],
    dados_novos: { ...data, ids: lancamentosIds }
  });

  return c.json({ success: true, data: { ids: lancamentosIds } }, 201);
});

// POST /lancamentos-contabeis/:id/estornar - Estornar lancamento
lancamentosContabeis.post('/:id/estornar', requirePermission('financeiro', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const { motivo } = await c.req.json();

  const lancamento = await c.env.DB.prepare(`
    SELECT * FROM lancamentos_contabeis WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!lancamento) {
    return c.json({ success: false, error: 'Lancamento nao encontrado' }, 404);
  }

  if ((lancamento as any).estornado) {
    return c.json({ success: false, error: 'Lancamento ja foi estornado' }, 400);
  }

  // Verificar se periodo esta fechado
  const dataComp = new Date((lancamento as any).data_competencia);
  const ano = dataComp.getFullYear();
  const mes = dataComp.getMonth() + 1;

  const fechamento = await c.env.DB.prepare(`
    SELECT id FROM fechamentos_contabeis
    WHERE empresa_id = ? AND ano = ? AND mes = ? AND status = 'FECHADO'
  `).bind(usuario.empresa_id, ano, mes).first();

  if (fechamento) {
    return c.json({ success: false, error: 'Periodo contabil fechado. Nao e possivel estornar.' }, 400);
  }

  // Marcar como estornado
  await c.env.DB.prepare(`
    UPDATE lancamentos_contabeis SET
      estornado = 1,
      data_estorno = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run();

  // Criar lancamento de estorno (invertido)
  const ultimoNumero = await c.env.DB.prepare(`
    SELECT MAX(numero_lancamento) as ultimo FROM lancamentos_contabeis
    WHERE empresa_id = ?
  `).bind(usuario.empresa_id).first<{ ultimo: number }>();

  const estornoId = crypto.randomUUID();
  const tipoInvertido = (lancamento as any).tipo_lancamento === 'DEBITO' ? 'CREDITO' : 'DEBITO';

  await c.env.DB.prepare(`
    INSERT INTO lancamentos_contabeis (
      id, empresa_id, numero_lancamento, data_lancamento, data_competencia,
      conta_id, centro_custo_id, tipo_lancamento, valor, historico,
      lancamento_original_id, usuario_id
    )
    VALUES (?, ?, ?, CURRENT_DATE, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    estornoId, usuario.empresa_id, (ultimoNumero?.ultimo || 0) + 1,
    (lancamento as any).data_competencia, (lancamento as any).conta_id,
    (lancamento as any).centro_custo_id, tipoInvertido, (lancamento as any).valor,
    `ESTORNO: ${motivo || (lancamento as any).historico}`, id, usuario.id
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'ESTORNAR',
    entidade: 'lancamentos_contabeis',
    entidade_id: id,
    dados_anteriores: lancamento,
    dados_novos: { estorno_id: estornoId, motivo }
  });

  return c.json({ success: true, data: { estorno_id: estornoId } });
});

export default lancamentosContabeis;
