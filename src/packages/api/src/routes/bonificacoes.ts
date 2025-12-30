// =============================================
// TRAILSYSTEM ERP - Rotas de Bonificacoes
// Fluxo completo: itens bonificados, limites, aprovacao
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const bonificacoes = new Hono<{ Bindings: Env }>();

// =============================================
// CRUD DE BONIFICACOES
// =============================================

// GET /bonificacoes - Listar bonificacoes
bonificacoes.get('/', async (c) => {
  const { page = '1', limit = '20', status, vendedor_id, empresa_id, mes, ano } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND b.empresa_id = ?';
      params.push(empresa_id);
    }

    if (status) {
      where += ' AND b.status = ?';
      params.push(status);
    }

    if (vendedor_id) {
      where += ' AND b.vendedor_id = ?';
      params.push(vendedor_id);
    }

    if (mes && ano) {
      where += " AND strftime('%Y', b.created_at) = ? AND strftime('%m', b.created_at) = ?";
      params.push(ano, mes.padStart(2, '0'));
    }

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM bonificacoes b ${where}
    `).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await c.env.DB.prepare(`
      SELECT b.*
      FROM bonificacoes b
      ${where}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limitNum, offset).all();

    return c.json({
      success: true,
      data: result.results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar bonificacoes:', error);
    return c.json({ success: false, error: 'Erro ao listar bonificacoes' }, 500);
  }
});

// GET /bonificacoes/:id - Buscar bonificacao por ID
bonificacoes.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const bonificacao = await c.env.DB.prepare(`
      SELECT * FROM bonificacoes WHERE id = ?
    `).bind(id).first();

    if (!bonificacao) {
      return c.json({ success: false, error: 'Bonificacao nao encontrada' }, 404);
    }

    const historico = await c.env.DB.prepare(`
      SELECT * FROM bonificacoes_historico WHERE bonificacao_id = ? ORDER BY created_at DESC
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...bonificacao,
        historico: historico.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar bonificacao:', error);
    return c.json({ success: false, error: 'Erro ao buscar bonificacao' }, 500);
  }
});

// POST /bonificacoes - Criar bonificacao
bonificacoes.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      venda_id?: string;
      venda_numero?: string;
      produto_id: string;
      produto_codigo?: string;
      produto_nome?: string;
      quantidade: number;
      unidade?: string;
      valor_unitario?: number;
      motivo: string;
      motivo_descricao?: string;
      cliente_id?: string;
      cliente_nome?: string;
      vendedor_id?: string;
      vendedor_nome?: string;
      empresa_id: string;
    }>();

    if (!body.produto_id || !body.quantidade || !body.motivo) {
      return c.json({ success: false, error: 'Produto, quantidade e motivo sao obrigatorios' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const valorTotal = body.quantidade * (body.valor_unitario || 0);

    const config = await c.env.DB.prepare(`
      SELECT * FROM config_bonificacao WHERE empresa_id = ?
    `).bind(body.empresa_id).first<any>();

    const verificarLimite = await verificarLimiteBonificacao(
      c.env.DB,
      body.empresa_id,
      body.vendedor_id || null,
      body.quantidade,
      valorTotal
    );

    if (verificarLimite.excedido && config?.bloquear_acima_limite) {
      return c.json({ 
        success: false, 
        error: 'Limite de bonificacao excedido',
        data: verificarLimite
      }, 400);
    }

    const cfop = config?.cfop_mesma_uf || '5.910';

    const statusInicial = config?.requer_aprovacao && valorTotal >= (config?.valor_minimo_aprovacao || 0)
      ? 'pendente'
      : 'aprovado';

    await c.env.DB.prepare(`
      INSERT INTO bonificacoes (
        id, empresa_id, venda_id, venda_numero, produto_id, produto_codigo, produto_nome,
        quantidade, unidade, valor_unitario, valor_total, motivo, motivo_descricao,
        cfop, status, cliente_id, cliente_nome, vendedor_id, vendedor_nome,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.empresa_id, body.venda_id || null, body.venda_numero || null,
      body.produto_id, body.produto_codigo || null, body.produto_nome || null,
      body.quantidade, body.unidade || 'UN', body.valor_unitario || 0, valorTotal,
      body.motivo, body.motivo_descricao || null, cfop, statusInicial,
      body.cliente_id || null, body.cliente_nome || null,
      body.vendedor_id || null, body.vendedor_nome || null, now, now
    ).run();

    await c.env.DB.prepare(`
      INSERT INTO bonificacoes_historico (id, bonificacao_id, acao, status_novo, usuario_id, usuario_nome, descricao, created_at)
      VALUES (?, ?, 'criacao', ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, statusInicial,
      body.vendedor_id || null, body.vendedor_nome || null,
      `Bonificacao criada - ${body.quantidade} ${body.unidade || 'UN'} de ${body.produto_nome || body.produto_id}`, now
    ).run();

    if (statusInicial === 'aprovado') {
      await atualizarSaldoBonificacao(c.env.DB, body.empresa_id, body.vendedor_id || null, body.quantidade, valorTotal);
    }

    return c.json({
      success: true,
      data: { id, status: statusInicial, limite_excedido: verificarLimite.excedido },
      message: statusInicial === 'pendente' ? 'Bonificacao criada e aguardando aprovacao' : 'Bonificacao aprovada automaticamente'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar bonificacao:', error);
    return c.json({ success: false, error: 'Erro ao criar bonificacao' }, 500);
  }
});

// =============================================
// WORKFLOW - APROVACAO
// =============================================

// POST /bonificacoes/:id/aprovar - Aprovar bonificacao
bonificacoes.post('/:id/aprovar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const bonificacao = await c.env.DB.prepare(`
      SELECT * FROM bonificacoes WHERE id = ?
    `).bind(id).first<any>();

    if (!bonificacao) {
      return c.json({ success: false, error: 'Bonificacao nao encontrada' }, 404);
    }

    if (bonificacao.status !== 'pendente') {
      return c.json({ success: false, error: 'Bonificacao nao esta pendente' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE bonificacoes SET
        status = 'aprovado',
        aprovador_id = ?,
        aprovador_nome = ?,
        data_aprovacao = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(body.usuario_id || null, body.usuario_nome || null, now, now, id).run();

    await c.env.DB.prepare(`
      INSERT INTO bonificacoes_historico (id, bonificacao_id, acao, status_anterior, status_novo, usuario_id, usuario_nome, descricao, created_at)
      VALUES (?, ?, 'aprovacao', 'pendente', 'aprovado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id,
      body.usuario_id || null, body.usuario_nome || null,
      'Bonificacao aprovada', now
    ).run();

    await atualizarSaldoBonificacao(
      c.env.DB, 
      bonificacao.empresa_id, 
      bonificacao.vendedor_id, 
      bonificacao.quantidade, 
      bonificacao.valor_total
    );

    return c.json({ success: true, message: 'Bonificacao aprovada' });
  } catch (error: any) {
    console.error('Erro ao aprovar bonificacao:', error);
    return c.json({ success: false, error: 'Erro ao aprovar bonificacao' }, 500);
  }
});

// POST /bonificacoes/:id/reprovar - Reprovar bonificacao
bonificacoes.post('/:id/reprovar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      motivo: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    if (!body.motivo) {
      return c.json({ success: false, error: 'Motivo da reprovacao e obrigatorio' }, 400);
    }

    const bonificacao = await c.env.DB.prepare(`
      SELECT * FROM bonificacoes WHERE id = ?
    `).bind(id).first<any>();

    if (!bonificacao) {
      return c.json({ success: false, error: 'Bonificacao nao encontrada' }, 404);
    }

    if (bonificacao.status !== 'pendente') {
      return c.json({ success: false, error: 'Bonificacao nao esta pendente' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE bonificacoes SET
        status = 'reprovado',
        aprovador_id = ?,
        aprovador_nome = ?,
        motivo_reprovacao = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(body.usuario_id || null, body.usuario_nome || null, body.motivo, now, id).run();

    await c.env.DB.prepare(`
      INSERT INTO bonificacoes_historico (id, bonificacao_id, acao, status_anterior, status_novo, usuario_id, usuario_nome, descricao, created_at)
      VALUES (?, ?, 'reprovacao', 'pendente', 'reprovado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id,
      body.usuario_id || null, body.usuario_nome || null,
      `Bonificacao reprovada: ${body.motivo}`, now
    ).run();

    return c.json({ success: true, message: 'Bonificacao reprovada' });
  } catch (error: any) {
    console.error('Erro ao reprovar bonificacao:', error);
    return c.json({ success: false, error: 'Erro ao reprovar bonificacao' }, 500);
  }
});

// POST /bonificacoes/:id/faturar - Marcar como faturado
bonificacoes.post('/:id/faturar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      nfe_id?: string;
      nfe_numero?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const bonificacao = await c.env.DB.prepare(`
      SELECT * FROM bonificacoes WHERE id = ?
    `).bind(id).first<any>();

    if (!bonificacao) {
      return c.json({ success: false, error: 'Bonificacao nao encontrada' }, 404);
    }

    if (bonificacao.status !== 'aprovado') {
      return c.json({ success: false, error: 'Bonificacao precisa estar aprovada' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE bonificacoes SET
        status = 'faturado',
        nfe_id = ?,
        nfe_numero = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(body.nfe_id || null, body.nfe_numero || null, now, id).run();

    await c.env.DB.prepare(`
      INSERT INTO bonificacoes_historico (id, bonificacao_id, acao, status_anterior, status_novo, usuario_id, usuario_nome, descricao, created_at)
      VALUES (?, ?, 'faturamento', 'aprovado', 'faturado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id,
      body.usuario_id || null, body.usuario_nome || null,
      `Bonificacao faturada${body.nfe_numero ? ` - NF-e ${body.nfe_numero}` : ''}`, now
    ).run();

    return c.json({ success: true, message: 'Bonificacao faturada' });
  } catch (error: any) {
    console.error('Erro ao faturar bonificacao:', error);
    return c.json({ success: false, error: 'Erro ao faturar bonificacao' }, 500);
  }
});

// POST /bonificacoes/:id/cancelar - Cancelar bonificacao
bonificacoes.post('/:id/cancelar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      motivo: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    if (!body.motivo) {
      return c.json({ success: false, error: 'Motivo do cancelamento e obrigatorio' }, 400);
    }

    const bonificacao = await c.env.DB.prepare(`
      SELECT * FROM bonificacoes WHERE id = ?
    `).bind(id).first<any>();

    if (!bonificacao) {
      return c.json({ success: false, error: 'Bonificacao nao encontrada' }, 404);
    }

    if (bonificacao.status === 'faturado') {
      return c.json({ success: false, error: 'Bonificacao ja faturada nao pode ser cancelada' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE bonificacoes SET status = 'cancelado', updated_at = ? WHERE id = ?
    `).bind(now, id).run();

    await c.env.DB.prepare(`
      INSERT INTO bonificacoes_historico (id, bonificacao_id, acao, status_anterior, status_novo, usuario_id, usuario_nome, descricao, created_at)
      VALUES (?, ?, 'cancelamento', ?, 'cancelado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, bonificacao.status,
      body.usuario_id || null, body.usuario_nome || null,
      `Bonificacao cancelada: ${body.motivo}`, now
    ).run();

    if (bonificacao.status === 'aprovado') {
      await atualizarSaldoBonificacao(
        c.env.DB, 
        bonificacao.empresa_id, 
        bonificacao.vendedor_id, 
        -bonificacao.quantidade, 
        -bonificacao.valor_total
      );
    }

    return c.json({ success: true, message: 'Bonificacao cancelada' });
  } catch (error: any) {
    console.error('Erro ao cancelar bonificacao:', error);
    return c.json({ success: false, error: 'Erro ao cancelar bonificacao' }, 500);
  }
});

// =============================================
// LIMITES
// =============================================

// GET /bonificacoes/limites - Listar limites
bonificacoes.get('/limites/todos', async (c) => {
  const { empresa_id, tipo } = c.req.query();

  try {
    let where = 'WHERE ativo = 1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND empresa_id = ?';
      params.push(empresa_id);
    }

    if (tipo) {
      where += ' AND tipo = ?';
      params.push(tipo);
    }

    const result = await c.env.DB.prepare(`
      SELECT * FROM limites_bonificacao ${where} ORDER BY tipo, referencia_nome
    `).bind(...params).all();

    return c.json({ success: true, data: result.results });
  } catch (error: any) {
    console.error('Erro ao listar limites:', error);
    return c.json({ success: false, error: 'Erro ao listar limites' }, 500);
  }
});

// POST /bonificacoes/limites - Criar/atualizar limite
bonificacoes.post('/limites', async (c) => {
  try {
    const body = await c.req.json<{
      tipo: 'vendedor' | 'equipe' | 'empresa';
      referencia_id?: string;
      referencia_nome?: string;
      periodo: 'diario' | 'semanal' | 'mensal' | 'anual';
      limite_quantidade?: number;
      limite_valor?: number;
      empresa_id: string;
    }>();

    if (!body.tipo || !body.periodo) {
      return c.json({ success: false, error: 'Tipo e periodo sao obrigatorios' }, 400);
    }

    const now = new Date().toISOString();

    const existing = await c.env.DB.prepare(`
      SELECT id FROM limites_bonificacao 
      WHERE empresa_id = ? AND tipo = ? AND COALESCE(referencia_id, '') = ? AND periodo = ?
    `).bind(body.empresa_id, body.tipo, body.referencia_id || '', body.periodo).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE limites_bonificacao SET
          referencia_nome = ?,
          limite_quantidade = ?,
          limite_valor = ?,
          updated_at = ?
        WHERE id = ?
      `).bind(
        body.referencia_nome || null,
        body.limite_quantidade || 0, body.limite_valor || 0,
        now, (existing as any).id
      ).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO limites_bonificacao (
          id, empresa_id, tipo, referencia_id, referencia_nome, periodo,
          limite_quantidade, limite_valor, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), body.empresa_id, body.tipo,
        body.referencia_id || null, body.referencia_nome || null, body.periodo,
        body.limite_quantidade || 0, body.limite_valor || 0, now, now
      ).run();
    }

    return c.json({ success: true, message: 'Limite configurado' });
  } catch (error: any) {
    console.error('Erro ao configurar limite:', error);
    return c.json({ success: false, error: 'Erro ao configurar limite' }, 500);
  }
});

// GET /bonificacoes/saldo/:vendedor_id - Verificar saldo do vendedor
bonificacoes.get('/saldo/:vendedor_id', async (c) => {
  const { vendedor_id } = c.req.param();
  const { empresa_id } = c.req.query();

  try {
    if (!empresa_id) {
      return c.json({ success: false, error: 'empresa_id e obrigatorio' }, 400);
    }

    const now = new Date();
    const ano = now.getFullYear();
    const mes = now.getMonth() + 1;

    const limite = await c.env.DB.prepare(`
      SELECT * FROM limites_bonificacao 
      WHERE empresa_id = ? AND tipo = 'vendedor' AND referencia_id = ? AND periodo = 'mensal' AND ativo = 1
    `).bind(empresa_id, vendedor_id).first<any>();

    const saldo = await c.env.DB.prepare(`
      SELECT * FROM saldos_bonificacao 
      WHERE empresa_id = ? AND tipo = 'vendedor' AND referencia_id = ? AND ano = ? AND mes = ?
    `).bind(empresa_id, vendedor_id, ano, mes).first<any>();

    const limiteEmpresa = await c.env.DB.prepare(`
      SELECT * FROM limites_bonificacao 
      WHERE empresa_id = ? AND tipo = 'empresa' AND periodo = 'mensal' AND ativo = 1
    `).bind(empresa_id).first<any>();

    return c.json({
      success: true,
      data: {
        limite_quantidade: limite?.limite_quantidade || limiteEmpresa?.limite_quantidade || 0,
        limite_valor: limite?.limite_valor || limiteEmpresa?.limite_valor || 0,
        quantidade_utilizada: saldo?.quantidade_utilizada || 0,
        valor_utilizado: saldo?.valor_utilizado || 0,
        quantidade_disponivel: (limite?.limite_quantidade || limiteEmpresa?.limite_quantidade || 0) - (saldo?.quantidade_utilizada || 0),
        valor_disponivel: (limite?.limite_valor || limiteEmpresa?.limite_valor || 0) - (saldo?.valor_utilizado || 0)
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar saldo:', error);
    return c.json({ success: false, error: 'Erro ao buscar saldo' }, 500);
  }
});

// =============================================
// CONFIGURACOES
// =============================================

// GET /bonificacoes/config - Buscar configuracoes
bonificacoes.get('/config', async (c) => {
  const { empresa_id } = c.req.query();

  try {
    if (!empresa_id) {
      return c.json({ success: false, error: 'empresa_id e obrigatorio' }, 400);
    }

    let config = await c.env.DB.prepare(`
      SELECT * FROM config_bonificacao WHERE empresa_id = ?
    `).bind(empresa_id).first();

    if (!config) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await c.env.DB.prepare(`
        INSERT INTO config_bonificacao (id, empresa_id, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).bind(id, empresa_id, now, now).run();

      config = await c.env.DB.prepare(`
        SELECT * FROM config_bonificacao WHERE empresa_id = ?
      `).bind(empresa_id).first();
    }

    return c.json({ success: true, data: config });
  } catch (error: any) {
    console.error('Erro ao buscar config:', error);
    return c.json({ success: false, error: 'Erro ao buscar config' }, 500);
  }
});

// PUT /bonificacoes/config - Atualizar configuracoes
bonificacoes.put('/config', async (c) => {
  try {
    const body = await c.req.json<{
      requer_aprovacao?: boolean;
      valor_minimo_aprovacao?: number;
      cfop_mesma_uf?: string;
      cfop_outra_uf?: string;
      motivos_permitidos?: string;
      limite_padrao_mensal_qtd?: number;
      limite_padrao_mensal_valor?: number;
      notificar_aprovador?: boolean;
      notificar_vendedor?: boolean;
      bloquear_acima_limite?: boolean;
      permitir_excecao_diretor?: boolean;
      empresa_id: string;
    }>();

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE config_bonificacao SET
        requer_aprovacao = COALESCE(?, requer_aprovacao),
        valor_minimo_aprovacao = COALESCE(?, valor_minimo_aprovacao),
        cfop_mesma_uf = COALESCE(?, cfop_mesma_uf),
        cfop_outra_uf = COALESCE(?, cfop_outra_uf),
        motivos_permitidos = COALESCE(?, motivos_permitidos),
        limite_padrao_mensal_qtd = COALESCE(?, limite_padrao_mensal_qtd),
        limite_padrao_mensal_valor = COALESCE(?, limite_padrao_mensal_valor),
        notificar_aprovador = COALESCE(?, notificar_aprovador),
        notificar_vendedor = COALESCE(?, notificar_vendedor),
        bloquear_acima_limite = COALESCE(?, bloquear_acima_limite),
        permitir_excecao_diretor = COALESCE(?, permitir_excecao_diretor),
        updated_at = ?
      WHERE empresa_id = ?
    `).bind(
      body.requer_aprovacao !== undefined ? (body.requer_aprovacao ? 1 : 0) : null,
      body.valor_minimo_aprovacao ?? null,
      body.cfop_mesma_uf || null, body.cfop_outra_uf || null,
      body.motivos_permitidos || null,
      body.limite_padrao_mensal_qtd ?? null, body.limite_padrao_mensal_valor ?? null,
      body.notificar_aprovador !== undefined ? (body.notificar_aprovador ? 1 : 0) : null,
      body.notificar_vendedor !== undefined ? (body.notificar_vendedor ? 1 : 0) : null,
      body.bloquear_acima_limite !== undefined ? (body.bloquear_acima_limite ? 1 : 0) : null,
      body.permitir_excecao_diretor !== undefined ? (body.permitir_excecao_diretor ? 1 : 0) : null,
      now, body.empresa_id
    ).run();

    return c.json({ success: true, message: 'Configuracoes atualizadas' });
  } catch (error: any) {
    console.error('Erro ao atualizar config:', error);
    return c.json({ success: false, error: 'Erro ao atualizar config' }, 500);
  }
});

// =============================================
// DASHBOARD
// =============================================

// GET /bonificacoes/dashboard/resumo - Dashboard de bonificacoes
bonificacoes.get('/dashboard/resumo', async (c) => {
  const { empresa_id, mes, ano } = c.req.query();

  try {
    if (!empresa_id) {
      return c.json({ success: false, error: 'empresa_id e obrigatorio' }, 400);
    }

    const now = new Date();
    const anoAtual = ano || now.getFullYear().toString();
    const mesAtual = mes || (now.getMonth() + 1).toString().padStart(2, '0');

    const porStatus = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as quantidade, SUM(valor_total) as valor_total
      FROM bonificacoes
      WHERE empresa_id = ? AND strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?
      GROUP BY status
    `).bind(empresa_id, anoAtual, mesAtual).all();

    const porMotivo = await c.env.DB.prepare(`
      SELECT motivo, COUNT(*) as quantidade, SUM(valor_total) as valor_total
      FROM bonificacoes
      WHERE empresa_id = ? AND strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?
      AND status IN ('aprovado', 'faturado')
      GROUP BY motivo
    `).bind(empresa_id, anoAtual, mesAtual).all();

    const porVendedor = await c.env.DB.prepare(`
      SELECT vendedor_id, vendedor_nome, COUNT(*) as quantidade, SUM(valor_total) as valor_total
      FROM bonificacoes
      WHERE empresa_id = ? AND strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?
      AND status IN ('aprovado', 'faturado')
      GROUP BY vendedor_id, vendedor_nome
      ORDER BY valor_total DESC
      LIMIT 10
    `).bind(empresa_id, anoAtual, mesAtual).all();

    const pendentes = await c.env.DB.prepare(`
      SELECT COUNT(*) as quantidade, SUM(valor_total) as valor_total
      FROM bonificacoes
      WHERE empresa_id = ? AND status = 'pendente'
    `).bind(empresa_id).first();

    return c.json({
      success: true,
      data: {
        por_status: porStatus.results,
        por_motivo: porMotivo.results,
        por_vendedor: porVendedor.results,
        pendentes: pendentes
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar dashboard:', error);
    return c.json({ success: false, error: 'Erro ao buscar dashboard' }, 500);
  }
});

// =============================================
// FUNCOES AUXILIARES
// =============================================

async function verificarLimiteBonificacao(
  db: any,
  empresaId: string,
  vendedorId: string | null,
  quantidade: number,
  valor: number
): Promise<{ excedido: boolean; limite_qtd: number; limite_valor: number; usado_qtd: number; usado_valor: number }> {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = now.getMonth() + 1;

  let limite = null;
  if (vendedorId) {
    limite = await db.prepare(`
      SELECT * FROM limites_bonificacao 
      WHERE empresa_id = ? AND tipo = 'vendedor' AND referencia_id = ? AND periodo = 'mensal' AND ativo = 1
    `).bind(empresaId, vendedorId).first();
  }

  if (!limite) {
    limite = await db.prepare(`
      SELECT * FROM limites_bonificacao 
      WHERE empresa_id = ? AND tipo = 'empresa' AND periodo = 'mensal' AND ativo = 1
    `).bind(empresaId).first();
  }

  if (!limite) {
    return { excedido: false, limite_qtd: 0, limite_valor: 0, usado_qtd: 0, usado_valor: 0 };
  }

  const saldo = await db.prepare(`
    SELECT * FROM saldos_bonificacao 
    WHERE empresa_id = ? AND tipo = ? AND COALESCE(referencia_id, '') = ? AND ano = ? AND mes = ?
  `).bind(
    empresaId, 
    vendedorId ? 'vendedor' : 'empresa', 
    vendedorId || '', 
    ano, 
    mes
  ).first();

  const usadoQtd = saldo?.quantidade_utilizada || 0;
  const usadoValor = saldo?.valor_utilizado || 0;

  const excedidoQtd = limite.limite_quantidade > 0 && (usadoQtd + quantidade) > limite.limite_quantidade;
  const excedidoValor = limite.limite_valor > 0 && (usadoValor + valor) > limite.limite_valor;

  return {
    excedido: excedidoQtd || excedidoValor,
    limite_qtd: limite.limite_quantidade,
    limite_valor: limite.limite_valor,
    usado_qtd: usadoQtd,
    usado_valor: usadoValor
  };
}

async function atualizarSaldoBonificacao(
  db: any,
  empresaId: string,
  vendedorId: string | null,
  quantidade: number,
  valor: number
): Promise<void> {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = now.getMonth() + 1;
  const timestamp = now.toISOString();

  const tipo = vendedorId ? 'vendedor' : 'empresa';
  const refId = vendedorId || '';

  const existing = await db.prepare(`
    SELECT id FROM saldos_bonificacao 
    WHERE empresa_id = ? AND tipo = ? AND COALESCE(referencia_id, '') = ? AND ano = ? AND mes = ?
  `).bind(empresaId, tipo, refId, ano, mes).first();

  if (existing) {
    await db.prepare(`
      UPDATE saldos_bonificacao SET
        quantidade_utilizada = quantidade_utilizada + ?,
        valor_utilizado = valor_utilizado + ?,
        updated_at = ?
      WHERE id = ?
    `).bind(quantidade, valor, timestamp, existing.id).run();
  } else {
    await db.prepare(`
      INSERT INTO saldos_bonificacao (
        id, empresa_id, tipo, referencia_id, ano, mes,
        quantidade_utilizada, valor_utilizado, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), empresaId, tipo, vendedorId || null,
      ano, mes, quantidade, valor, timestamp, timestamp
    ).run();
  }
}

export default bonificacoes;
