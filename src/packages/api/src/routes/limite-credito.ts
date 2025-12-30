// =============================================
// TRAILSYSTEM ERP - Rotas de Limite de Crédito
// Fluxo completo: verificação, análise, aprovação
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const limiteCredito = new Hono<{ Bindings: Env }>();

// =============================================
// VERIFICAÇÃO DE LIMITE
// =============================================

// GET /limite-credito/verificar/:cliente_id - Verificar limite disponível
limiteCredito.get('/verificar/:cliente_id', async (c) => {
  const { cliente_id } = c.req.param();

  try {
    // Buscar cliente
    const cliente = await c.env.DB.prepare(`
      SELECT id, empresa_id, razao_social, limite_credito FROM clientes WHERE id = ? AND deleted_at IS NULL
    `).bind(cliente_id).first<{
      id: string;
      empresa_id: string;
      razao_social: string;
      limite_credito: number;
    }>();

    if (!cliente) {
      return c.json({ success: false, error: 'Cliente não encontrado' }, 404);
    }

    // Calcular saldo comprometido
    // 1. Pedidos em aberto (não faturados)
    const pedidosAbertos = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(valor_total), 0) as total
      FROM vendas
      WHERE cliente_id = ? AND status IN ('pendente', 'aprovado', 'em_separacao') AND deleted_at IS NULL
    `).bind(cliente_id).first<{ total: number }>();

    // 2. Títulos a vencer
    const titulosVencer = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(valor_aberto), 0) as total
      FROM contas_receber
      WHERE cliente_id = ? AND status = 'aberto' AND data_vencimento >= date('now') AND deleted_at IS NULL
    `).bind(cliente_id).first<{ total: number }>();

    // 3. Títulos vencidos
    const titulosVencidos = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(valor_aberto), 0) as total, MAX(CAST(julianday('now') - julianday(data_vencimento) AS INTEGER)) as maior_atraso
      FROM contas_receber
      WHERE cliente_id = ? AND status = 'aberto' AND data_vencimento < date('now') AND deleted_at IS NULL
    `).bind(cliente_id).first<{ total: number; maior_atraso: number }>();

    // 4. Verificar bloqueio
    const bloqueio = await c.env.DB.prepare(`
      SELECT id, motivo, descricao FROM clientes_bloqueios WHERE cliente_id = ? AND status = 'ativo' LIMIT 1
    `).bind(cliente_id).first<{ id: string; motivo: string; descricao: string }>();

    const limiteAprovado = cliente.limite_credito || 0;
    const saldoPedidosAbertos = pedidosAbertos?.total || 0;
    const saldoTitulosVencer = titulosVencer?.total || 0;
    const saldoTitulosVencidos = titulosVencidos?.total || 0;
    const maiorAtraso = titulosVencidos?.maior_atraso || 0;
    const saldoComprometido = saldoPedidosAbertos + saldoTitulosVencer + saldoTitulosVencidos;
    const limiteDisponivel = limiteAprovado - saldoComprometido;

    let situacao = 'disponivel';
    if (bloqueio) {
      situacao = 'bloqueado';
    } else if (saldoTitulosVencidos > 0) {
      situacao = 'inadimplente';
    } else if (limiteDisponivel <= 0) {
      situacao = 'sem_limite';
    }

    return c.json({
      success: true,
      data: {
        cliente_id: cliente.id,
        cliente_nome: cliente.razao_social,
        limite_aprovado: limiteAprovado,
        saldo_pedidos_abertos: saldoPedidosAbertos,
        saldo_titulos_vencer: saldoTitulosVencer,
        saldo_titulos_vencidos: saldoTitulosVencidos,
        saldo_comprometido: saldoComprometido,
        limite_disponivel: limiteDisponivel,
        maior_atraso_dias: maiorAtraso,
        cliente_bloqueado: !!bloqueio,
        bloqueio: bloqueio || null,
        situacao
      }
    });
  } catch (error: any) {
    console.error('Erro ao verificar limite:', error);
    return c.json({ success: false, error: 'Erro ao verificar limite de crédito' }, 500);
  }
});

// POST /limite-credito/validar-pedido - Validar se pedido cabe no limite
limiteCredito.post('/validar-pedido', async (c) => {
  try {
    const body = await c.req.json<{
      cliente_id: string;
      valor_pedido: number;
      pedido_id?: string;
      pedido_tipo?: 'venda' | 'orcamento';
    }>();

    if (!body.cliente_id || !body.valor_pedido) {
      return c.json({ success: false, error: 'Cliente e valor do pedido são obrigatórios' }, 400);
    }

    // Buscar cliente
    const cliente = await c.env.DB.prepare(`
      SELECT id, empresa_id, razao_social, limite_credito FROM clientes WHERE id = ? AND deleted_at IS NULL
    `).bind(body.cliente_id).first<{
      id: string;
      empresa_id: string;
      razao_social: string;
      limite_credito: number;
    }>();

    if (!cliente) {
      return c.json({ success: false, error: 'Cliente não encontrado' }, 404);
    }

    // Verificar bloqueio
    const bloqueio = await c.env.DB.prepare(`
      SELECT id, motivo FROM clientes_bloqueios WHERE cliente_id = ? AND status = 'ativo' LIMIT 1
    `).bind(body.cliente_id).first<{ id: string; motivo: string }>();

    if (bloqueio) {
      // Registrar pedido bloqueado
      if (body.pedido_id) {
        const bloqueioId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO pedidos_bloqueados_credito (
            id, empresa_id, cliente_id, pedido_id, pedido_tipo, valor_pedido,
            limite_disponivel, valor_excedente, motivo, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'cliente_bloqueado', 'bloqueado', datetime('now'), datetime('now'))
        `).bind(
          bloqueioId, cliente.empresa_id, body.cliente_id, body.pedido_id,
          body.pedido_tipo || 'venda', body.valor_pedido, body.valor_pedido
        ).run();
      }

      return c.json({
        success: false,
        data: {
          liberado: false,
          motivo: 'cliente_bloqueado',
          mensagem: 'Cliente bloqueado. Regularize a situação antes de fazer novos pedidos.'
        }
      });
    }

    // Calcular saldo comprometido
    const saldos = await c.env.DB.prepare(`
      SELECT 
        COALESCE((SELECT SUM(valor_total) FROM vendas WHERE cliente_id = ? AND status IN ('pendente', 'aprovado', 'em_separacao') AND deleted_at IS NULL), 0) as pedidos_abertos,
        COALESCE((SELECT SUM(valor_aberto) FROM contas_receber WHERE cliente_id = ? AND status = 'aberto' AND data_vencimento >= date('now') AND deleted_at IS NULL), 0) as titulos_vencer,
        COALESCE((SELECT SUM(valor_aberto) FROM contas_receber WHERE cliente_id = ? AND status = 'aberto' AND data_vencimento < date('now') AND deleted_at IS NULL), 0) as titulos_vencidos
    `).bind(body.cliente_id, body.cliente_id, body.cliente_id).first<{
      pedidos_abertos: number;
      titulos_vencer: number;
      titulos_vencidos: number;
    }>();

    const limiteAprovado = cliente.limite_credito || 0;
    const saldoComprometido = (saldos?.pedidos_abertos || 0) + (saldos?.titulos_vencer || 0) + (saldos?.titulos_vencidos || 0);
    const limiteDisponivel = limiteAprovado - saldoComprometido;

    // Verificar inadimplência
    if ((saldos?.titulos_vencidos || 0) > 0) {
      if (body.pedido_id) {
        const bloqueioId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO pedidos_bloqueados_credito (
            id, empresa_id, cliente_id, pedido_id, pedido_tipo, valor_pedido,
            limite_disponivel, valor_excedente, motivo, 
            saldo_pedidos_abertos, saldo_titulos_vencer, saldo_titulos_vencidos,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'cliente_inadimplente', ?, ?, ?, 'bloqueado', datetime('now'), datetime('now'))
        `).bind(
          bloqueioId, cliente.empresa_id, body.cliente_id, body.pedido_id,
          body.pedido_tipo || 'venda', body.valor_pedido, limiteDisponivel,
          Math.max(0, body.valor_pedido - limiteDisponivel),
          saldos?.pedidos_abertos || 0, saldos?.titulos_vencer || 0, saldos?.titulos_vencidos || 0
        ).run();
      }

      return c.json({
        success: false,
        data: {
          liberado: false,
          motivo: 'cliente_inadimplente',
          mensagem: 'Cliente possui títulos vencidos. Regularize antes de fazer novos pedidos.',
          titulos_vencidos: saldos?.titulos_vencidos || 0
        }
      });
    }

    // Verificar se cabe no limite
    if (body.valor_pedido > limiteDisponivel) {
      if (body.pedido_id) {
        const bloqueioId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO pedidos_bloqueados_credito (
            id, empresa_id, cliente_id, pedido_id, pedido_tipo, valor_pedido,
            limite_disponivel, valor_excedente, motivo,
            saldo_pedidos_abertos, saldo_titulos_vencer, saldo_titulos_vencidos,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'limite_excedido', ?, ?, ?, 'bloqueado', datetime('now'), datetime('now'))
        `).bind(
          bloqueioId, cliente.empresa_id, body.cliente_id, body.pedido_id,
          body.pedido_tipo || 'venda', body.valor_pedido, limiteDisponivel,
          body.valor_pedido - limiteDisponivel,
          saldos?.pedidos_abertos || 0, saldos?.titulos_vencer || 0, saldos?.titulos_vencidos || 0
        ).run();
      }

      return c.json({
        success: false,
        data: {
          liberado: false,
          motivo: 'limite_excedido',
          mensagem: 'Pedido excede o limite de crédito disponível.',
          limite_disponivel: limiteDisponivel,
          valor_excedente: body.valor_pedido - limiteDisponivel
        }
      });
    }

    return c.json({
      success: true,
      data: {
        liberado: true,
        limite_disponivel: limiteDisponivel,
        limite_apos_pedido: limiteDisponivel - body.valor_pedido
      }
    });
  } catch (error: any) {
    console.error('Erro ao validar pedido:', error);
    return c.json({ success: false, error: 'Erro ao validar pedido' }, 500);
  }
});

// =============================================
// SOLICITAÇÕES DE AUMENTO DE LIMITE
// =============================================

// GET /limite-credito/solicitacoes - Listar solicitações
limiteCredito.get('/solicitacoes', async (c) => {
  const { page = '1', limit = '20', status, cliente_id, empresa_id } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND s.empresa_id = ?';
      params.push(empresa_id);
    }

    if (status) {
      where += ' AND s.status = ?';
      params.push(status);
    }

    if (cliente_id) {
      where += ' AND s.cliente_id = ?';
      params.push(cliente_id);
    }

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM solicitacoes_limite_credito s ${where}
    `).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await c.env.DB.prepare(`
      SELECT s.*, c.razao_social as cliente_nome
      FROM solicitacoes_limite_credito s
      LEFT JOIN clientes c ON c.id = s.cliente_id
      ${where}
      ORDER BY s.created_at DESC
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
    console.error('Erro ao listar solicitações:', error);
    return c.json({ success: false, error: 'Erro ao listar solicitações' }, 500);
  }
});

// GET /limite-credito/solicitacoes/:id - Buscar solicitação por ID
limiteCredito.get('/solicitacoes/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const solicitacao = await c.env.DB.prepare(`
      SELECT s.*, c.razao_social as cliente_nome, c.cnpj_cpf as cliente_documento
      FROM solicitacoes_limite_credito s
      LEFT JOIN clientes c ON c.id = s.cliente_id
      WHERE s.id = ?
    `).bind(id).first();

    if (!solicitacao) {
      return c.json({ success: false, error: 'Solicitação não encontrada' }, 404);
    }

    // Buscar histórico de limite do cliente
    const historico = await c.env.DB.prepare(`
      SELECT * FROM historico_limite_credito WHERE cliente_id = ? ORDER BY created_at DESC LIMIT 10
    `).bind((solicitacao as any).cliente_id).all();

    return c.json({
      success: true,
      data: {
        ...solicitacao,
        historico_limite: historico.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar solicitação:', error);
    return c.json({ success: false, error: 'Erro ao buscar solicitação' }, 500);
  }
});

// POST /limite-credito/solicitacoes - Criar solicitação de aumento
limiteCredito.post('/solicitacoes', async (c) => {
  try {
    const body = await c.req.json<{
      cliente_id: string;
      limite_solicitado: number;
      origem?: 'manual' | 'pedido_bloqueado' | 'renovacao';
      pedido_origem_id?: string;
      solicitante_id?: string;
      solicitante_nome?: string;
      vendedor_id?: string;
      justificativa_solicitacao?: string;
      empresa_id?: string;
    }>();

    if (!body.cliente_id || !body.limite_solicitado) {
      return c.json({ success: false, error: 'Cliente e limite solicitado são obrigatórios' }, 400);
    }

    // Buscar cliente
    const cliente = await c.env.DB.prepare(`
      SELECT id, empresa_id, limite_credito FROM clientes WHERE id = ? AND deleted_at IS NULL
    `).bind(body.cliente_id).first<{ id: string; empresa_id: string; limite_credito: number }>();

    if (!cliente) {
      return c.json({ success: false, error: 'Cliente não encontrado' }, 404);
    }

    const id = crypto.randomUUID();
    const empresaId = body.empresa_id || cliente.empresa_id;

    await c.env.DB.prepare(`
      INSERT INTO solicitacoes_limite_credito (
        id, empresa_id, cliente_id, limite_atual, limite_solicitado,
        origem, pedido_origem_id, solicitante_id, solicitante_nome, vendedor_id,
        justificativa_solicitacao, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', datetime('now'), datetime('now'))
    `).bind(
      id, empresaId, body.cliente_id, cliente.limite_credito || 0, body.limite_solicitado,
      body.origem || 'manual', body.pedido_origem_id || null,
      body.solicitante_id || null, body.solicitante_nome || null, body.vendedor_id || null,
      body.justificativa_solicitacao || null
    ).run();

    return c.json({
      success: true,
      data: { id },
      message: 'Solicitação criada com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar solicitação:', error);
    return c.json({ success: false, error: 'Erro ao criar solicitação' }, 500);
  }
});

// POST /limite-credito/solicitacoes/:id/analisar - Iniciar análise
limiteCredito.post('/solicitacoes/:id/analisar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      analista_id?: string;
      analista_nome?: string;
    }>();

    const solicitacao = await c.env.DB.prepare(`
      SELECT * FROM solicitacoes_limite_credito WHERE id = ?
    `).bind(id).first<any>();

    if (!solicitacao) {
      return c.json({ success: false, error: 'Solicitação não encontrada' }, 404);
    }

    if (solicitacao.status !== 'pendente') {
      return c.json({ success: false, error: 'Solicitação não está pendente' }, 400);
    }

    // Buscar histórico de pagamentos do cliente
    const historicoPagamentos = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_titulos,
        SUM(CASE WHEN status = 'pago' THEN 1 ELSE 0 END) as titulos_pagos,
        SUM(CASE WHEN status = 'pago' AND data_pagamento > data_vencimento THEN 1 ELSE 0 END) as pagos_com_atraso,
        AVG(CASE WHEN status = 'pago' AND data_pagamento > data_vencimento 
            THEN CAST(julianday(data_pagamento) - julianday(data_vencimento) AS INTEGER) 
            ELSE 0 END) as media_dias_atraso,
        SUM(valor_original) as valor_total_historico
      FROM contas_receber
      WHERE cliente_id = ? AND deleted_at IS NULL
    `).bind(solicitacao.cliente_id).first();

    // Calcular score interno (simplificado)
    let scoreInterno = 500; // Base
    if (historicoPagamentos) {
      const hp = historicoPagamentos as any;
      if (hp.total_titulos > 0) {
        const taxaPagamento = (hp.titulos_pagos || 0) / hp.total_titulos;
        scoreInterno += Math.round(taxaPagamento * 200); // +200 se paga tudo
        
        const taxaAtraso = (hp.pagos_com_atraso || 0) / Math.max(1, hp.titulos_pagos || 1);
        scoreInterno -= Math.round(taxaAtraso * 100); // -100 se sempre atrasa
        
        if ((hp.media_dias_atraso || 0) > 30) {
          scoreInterno -= 100; // Penalidade por atraso médio alto
        }
      }
    }

    await c.env.DB.prepare(`
      UPDATE solicitacoes_limite_credito SET 
        status = 'em_analise',
        analista_id = ?,
        analista_nome = ?,
        score_credito = ?,
        historico_pagamentos = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.analista_id || null, body.analista_nome || null,
      scoreInterno, JSON.stringify(historicoPagamentos), id
    ).run();

    return c.json({
      success: true,
      data: {
        score_credito: scoreInterno,
        historico_pagamentos: historicoPagamentos
      },
      message: 'Análise iniciada'
    });
  } catch (error: any) {
    console.error('Erro ao iniciar análise:', error);
    return c.json({ success: false, error: 'Erro ao iniciar análise' }, 500);
  }
});

// POST /limite-credito/solicitacoes/:id/aprovar - Aprovar solicitação
limiteCredito.post('/solicitacoes/:id/aprovar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      limite_aprovado: number;
      justificativa_decisao?: string;
      analista_id?: string;
      analista_nome?: string;
    }>();

    if (!body.limite_aprovado) {
      return c.json({ success: false, error: 'Limite aprovado é obrigatório' }, 400);
    }

    const solicitacao = await c.env.DB.prepare(`
      SELECT * FROM solicitacoes_limite_credito WHERE id = ?
    `).bind(id).first<any>();

    if (!solicitacao) {
      return c.json({ success: false, error: 'Solicitação não encontrada' }, 404);
    }

    if (solicitacao.status !== 'pendente' && solicitacao.status !== 'em_analise') {
      return c.json({ success: false, error: 'Solicitação não pode ser aprovada neste status' }, 400);
    }

    const now = new Date().toISOString();
    const status = body.limite_aprovado >= solicitacao.limite_solicitado ? 'aprovado' : 'aprovado_parcial';

    // Atualizar solicitação
    await c.env.DB.prepare(`
      UPDATE solicitacoes_limite_credito SET 
        status = ?,
        limite_aprovado = ?,
        justificativa_decisao = ?,
        analista_id = COALESCE(?, analista_id),
        analista_nome = COALESCE(?, analista_nome),
        data_analise = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      status, body.limite_aprovado, body.justificativa_decisao || null,
      body.analista_id || null, body.analista_nome || null, now, now, id
    ).run();

    // Atualizar limite do cliente
    await c.env.DB.prepare(`
      UPDATE clientes SET limite_credito = ?, updated_at = ? WHERE id = ?
    `).bind(body.limite_aprovado, now, solicitacao.cliente_id).run();

    // Registrar histórico
    const historicoId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO historico_limite_credito (
        id, empresa_id, cliente_id, limite_anterior, limite_novo, motivo,
        solicitacao_id, usuario_id, usuario_nome, observacao, created_at
      ) VALUES (?, ?, ?, ?, ?, 'aumento_aprovado', ?, ?, ?, ?, ?)
    `).bind(
      historicoId, solicitacao.empresa_id, solicitacao.cliente_id,
      solicitacao.limite_atual, body.limite_aprovado, id,
      body.analista_id || null, body.analista_nome || null,
      body.justificativa_decisao || null, now
    ).run();

    // Liberar pedidos bloqueados se houver
    if (solicitacao.pedido_origem_id) {
      await c.env.DB.prepare(`
        UPDATE pedidos_bloqueados_credito SET 
          status = 'liberado',
          liberado_por_id = ?,
          liberado_por_nome = ?,
          data_liberacao = ?,
          motivo_liberacao = 'Limite de crédito aprovado',
          solicitacao_limite_id = ?,
          updated_at = ?
        WHERE pedido_id = ? AND status = 'bloqueado'
      `).bind(
        body.analista_id || null, body.analista_nome || null, now, id, now,
        solicitacao.pedido_origem_id
      ).run();
    }

    return c.json({
      success: true,
      message: status === 'aprovado' ? 'Solicitação aprovada integralmente' : 'Solicitação aprovada parcialmente'
    });
  } catch (error: any) {
    console.error('Erro ao aprovar solicitação:', error);
    return c.json({ success: false, error: 'Erro ao aprovar solicitação' }, 500);
  }
});

// POST /limite-credito/solicitacoes/:id/reprovar - Reprovar solicitação
limiteCredito.post('/solicitacoes/:id/reprovar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      justificativa_decisao: string;
      analista_id?: string;
      analista_nome?: string;
    }>();

    if (!body.justificativa_decisao) {
      return c.json({ success: false, error: 'Justificativa é obrigatória para reprovação' }, 400);
    }

    const solicitacao = await c.env.DB.prepare(`
      SELECT * FROM solicitacoes_limite_credito WHERE id = ?
    `).bind(id).first<any>();

    if (!solicitacao) {
      return c.json({ success: false, error: 'Solicitação não encontrada' }, 404);
    }

    if (solicitacao.status !== 'pendente' && solicitacao.status !== 'em_analise') {
      return c.json({ success: false, error: 'Solicitação não pode ser reprovada neste status' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE solicitacoes_limite_credito SET 
        status = 'reprovado',
        justificativa_decisao = ?,
        analista_id = COALESCE(?, analista_id),
        analista_nome = COALESCE(?, analista_nome),
        data_analise = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.justificativa_decisao, body.analista_id || null, body.analista_nome || null,
      now, now, id
    ).run();

    return c.json({
      success: true,
      message: 'Solicitação reprovada'
    });
  } catch (error: any) {
    console.error('Erro ao reprovar solicitação:', error);
    return c.json({ success: false, error: 'Erro ao reprovar solicitação' }, 500);
  }
});

// =============================================
// PEDIDOS BLOQUEADOS
// =============================================

// GET /limite-credito/pedidos-bloqueados - Listar pedidos bloqueados
limiteCredito.get('/pedidos-bloqueados', async (c) => {
  const { page = '1', limit = '20', status, cliente_id, empresa_id } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND pb.empresa_id = ?';
      params.push(empresa_id);
    }

    if (status) {
      where += ' AND pb.status = ?';
      params.push(status);
    }

    if (cliente_id) {
      where += ' AND pb.cliente_id = ?';
      params.push(cliente_id);
    }

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM pedidos_bloqueados_credito pb ${where}
    `).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await c.env.DB.prepare(`
      SELECT pb.*, c.razao_social as cliente_nome
      FROM pedidos_bloqueados_credito pb
      LEFT JOIN clientes c ON c.id = pb.cliente_id
      ${where}
      ORDER BY pb.created_at DESC
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
    console.error('Erro ao listar pedidos bloqueados:', error);
    return c.json({ success: false, error: 'Erro ao listar pedidos bloqueados' }, 500);
  }
});

// POST /limite-credito/pedidos-bloqueados/:id/liberar - Liberar pedido manualmente
limiteCredito.post('/pedidos-bloqueados/:id/liberar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      motivo_liberacao: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    if (!body.motivo_liberacao) {
      return c.json({ success: false, error: 'Motivo da liberação é obrigatório' }, 400);
    }

    const pedido = await c.env.DB.prepare(`
      SELECT * FROM pedidos_bloqueados_credito WHERE id = ?
    `).bind(id).first<any>();

    if (!pedido) {
      return c.json({ success: false, error: 'Pedido bloqueado não encontrado' }, 404);
    }

    if (pedido.status !== 'bloqueado') {
      return c.json({ success: false, error: 'Pedido não está bloqueado' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE pedidos_bloqueados_credito SET 
        status = 'liberado',
        liberado_por_id = ?,
        liberado_por_nome = ?,
        data_liberacao = ?,
        motivo_liberacao = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.usuario_id || null, body.usuario_nome || null, now,
      body.motivo_liberacao, now, id
    ).run();

    return c.json({
      success: true,
      message: 'Pedido liberado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao liberar pedido:', error);
    return c.json({ success: false, error: 'Erro ao liberar pedido' }, 500);
  }
});

// =============================================
// HISTÓRICO E AJUSTES
// =============================================

// GET /limite-credito/historico/:cliente_id - Histórico de alterações de limite
limiteCredito.get('/historico/:cliente_id', async (c) => {
  const { cliente_id } = c.req.param();

  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM historico_limite_credito WHERE cliente_id = ? ORDER BY created_at DESC
    `).bind(cliente_id).all();

    return c.json({ success: true, data: result.results });
  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);
    return c.json({ success: false, error: 'Erro ao buscar histórico' }, 500);
  }
});

// POST /limite-credito/ajustar - Ajustar limite manualmente
limiteCredito.post('/ajustar', async (c) => {
  try {
    const body = await c.req.json<{
      cliente_id: string;
      novo_limite: number;
      motivo: 'reducao' | 'ajuste_manual';
      observacao?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    if (!body.cliente_id || body.novo_limite === undefined) {
      return c.json({ success: false, error: 'Cliente e novo limite são obrigatórios' }, 400);
    }

    const cliente = await c.env.DB.prepare(`
      SELECT id, empresa_id, limite_credito FROM clientes WHERE id = ? AND deleted_at IS NULL
    `).bind(body.cliente_id).first<{ id: string; empresa_id: string; limite_credito: number }>();

    if (!cliente) {
      return c.json({ success: false, error: 'Cliente não encontrado' }, 404);
    }

    const now = new Date().toISOString();
    const limiteAnterior = cliente.limite_credito || 0;

    // Atualizar limite do cliente
    await c.env.DB.prepare(`
      UPDATE clientes SET limite_credito = ?, updated_at = ? WHERE id = ?
    `).bind(body.novo_limite, now, body.cliente_id).run();

    // Registrar histórico
    const historicoId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO historico_limite_credito (
        id, empresa_id, cliente_id, limite_anterior, limite_novo, motivo,
        usuario_id, usuario_nome, observacao, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      historicoId, cliente.empresa_id, body.cliente_id,
      limiteAnterior, body.novo_limite, body.motivo,
      body.usuario_id || null, body.usuario_nome || null,
      body.observacao || null, now
    ).run();

    return c.json({
      success: true,
      data: {
        limite_anterior: limiteAnterior,
        limite_novo: body.novo_limite
      },
      message: 'Limite ajustado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao ajustar limite:', error);
    return c.json({ success: false, error: 'Erro ao ajustar limite' }, 500);
  }
});

// =============================================
// DASHBOARD
// =============================================

// GET /limite-credito/dashboard - Dashboard de crédito
limiteCredito.get('/dashboard/resumo', async (c) => {
  const { empresa_id } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND empresa_id = ?';
      params.push(empresa_id);
    }

    // Solicitações por status
    const solicitacoesPorStatus = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as quantidade
      FROM solicitacoes_limite_credito ${where}
      GROUP BY status
    `).bind(...params).all();

    // Solicitações pendentes
    const pendentes = await c.env.DB.prepare(`
      SELECT s.*, c.razao_social as cliente_nome
      FROM solicitacoes_limite_credito s
      LEFT JOIN clientes c ON c.id = s.cliente_id
      ${where} AND s.status IN ('pendente', 'em_analise')
      ORDER BY s.created_at ASC
      LIMIT 10
    `).bind(...params).all();

    // Pedidos bloqueados
    const pedidosBloqueados = await c.env.DB.prepare(`
      SELECT COUNT(*) as total, SUM(valor_pedido) as valor_total
      FROM pedidos_bloqueados_credito ${where} AND status = 'bloqueado'
    `).bind(...params).first();

    // Clientes inadimplentes
    const inadimplentes = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT cr.cliente_id) as total
      FROM contas_receber cr
      ${where.replace('empresa_id', 'cr.empresa_id')} 
      AND cr.status = 'aberto' AND cr.data_vencimento < date('now') AND cr.deleted_at IS NULL
    `).bind(...params).first();

    return c.json({
      success: true,
      data: {
        solicitacoes_por_status: solicitacoesPorStatus.results,
        solicitacoes_pendentes: pendentes.results,
        pedidos_bloqueados: pedidosBloqueados,
        clientes_inadimplentes: inadimplentes
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar dashboard:', error);
    return c.json({ success: false, error: 'Erro ao buscar dashboard' }, 500);
  }
});

export default limiteCredito;
