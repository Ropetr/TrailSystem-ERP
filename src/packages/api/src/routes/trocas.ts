// =============================================
// TRAILSYSTEM ERP - Rotas de Trocas
// Fluxo completo: solicitação, aprovação, processamento
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const trocas = new Hono<{ Bindings: Env }>();

// =============================================
// CRUD DE TROCAS
// =============================================

// GET /trocas - Listar trocas
trocas.get('/', async (c) => {
  const { page = '1', limit = '20', status, cliente_id, empresa_id, venda_id } = c.req.query();

  try {
    let where = 'WHERE t.deleted_at IS NULL';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND t.empresa_id = ?';
      params.push(empresa_id);
    }

    if (status) {
      where += ' AND t.status = ?';
      params.push(status);
    }

    if (cliente_id) {
      where += ' AND t.cliente_id = ?';
      params.push(cliente_id);
    }

    if (venda_id) {
      where += ' AND t.venda_id = ?';
      params.push(venda_id);
    }

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM trocas t ${where}
    `).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await c.env.DB.prepare(`
      SELECT t.*, c.razao_social as cliente_nome
      FROM trocas t
      LEFT JOIN clientes c ON c.id = t.cliente_id
      ${where}
      ORDER BY t.created_at DESC
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
    console.error('Erro ao listar trocas:', error);
    return c.json({ success: false, error: 'Erro ao listar trocas' }, 500);
  }
});

// GET /trocas/:id - Buscar troca por ID
trocas.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const troca = await c.env.DB.prepare(`
      SELECT t.*, c.razao_social as cliente_nome, c.cnpj_cpf as cliente_documento
      FROM trocas t
      LEFT JOIN clientes c ON c.id = t.cliente_id
      WHERE t.id = ? AND t.deleted_at IS NULL
    `).bind(id).first();

    if (!troca) {
      return c.json({ success: false, error: 'Troca não encontrada' }, 404);
    }

    // Buscar itens antigos (devolvidos)
    const itensAntigos = await c.env.DB.prepare(`
      SELECT * FROM trocas_itens_antigos WHERE troca_id = ?
    `).bind(id).all();

    // Buscar itens novos (enviados)
    const itensNovos = await c.env.DB.prepare(`
      SELECT * FROM trocas_itens_novos WHERE troca_id = ?
    `).bind(id).all();

    // Buscar histórico
    const historico = await c.env.DB.prepare(`
      SELECT * FROM devolucoes_trocas_historico 
      WHERE tipo = 'troca' AND referencia_id = ? 
      ORDER BY created_at DESC
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...troca,
        itens_antigos: itensAntigos.results,
        itens_novos: itensNovos.results,
        historico: historico.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar troca:', error);
    return c.json({ success: false, error: 'Erro ao buscar troca' }, 500);
  }
});

// POST /trocas - Criar troca
trocas.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      venda_id: string;
      motivo: string;
      motivo_descricao?: string;
      itens_antigos: Array<{
        venda_item_id?: string;
        produto_id: string;
        produto_codigo?: string;
        produto_nome?: string;
        quantidade: number;
        unidade?: string;
        valor_unitario: number;
        condicao?: string;
      }>;
      itens_novos: Array<{
        produto_id: string;
        produto_codigo?: string;
        produto_nome?: string;
        quantidade: number;
        unidade?: string;
        valor_unitario: number;
      }>;
      observacao?: string;
      solicitante_id?: string;
      solicitante_nome?: string;
      empresa_id?: string;
    }>();

    if (!body.venda_id || !body.motivo || !body.itens_antigos || body.itens_antigos.length === 0 || !body.itens_novos || body.itens_novos.length === 0) {
      return c.json({ success: false, error: 'Venda, motivo, itens antigos e itens novos são obrigatórios' }, 400);
    }

    // Buscar venda original
    const venda = await c.env.DB.prepare(`
      SELECT v.*, c.razao_social as cliente_nome
      FROM vendas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      WHERE v.id = ? AND v.deleted_at IS NULL
    `).bind(body.venda_id).first<any>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda não encontrada' }, 404);
    }

    // Buscar configuração de prazo
    const config = await c.env.DB.prepare(`
      SELECT prazo_troca_dias, valor_minimo_aprovacao
      FROM config_devolucao_troca WHERE empresa_id = ?
    `).bind(venda.empresa_id).first<any>();

    const prazoDias = config?.prazo_troca_dias || 30;
    const valorMinimoAprovacao = config?.valor_minimo_aprovacao || 0;

    // Verificar prazo
    const dataVenda = new Date(venda.data_venda || venda.created_at);
    const hoje = new Date();
    const diasDesdeVenda = Math.floor((hoje.getTime() - dataVenda.getTime()) / (1000 * 60 * 60 * 24));
    const dentroPrazo = diasDesdeVenda <= prazoDias;

    // Calcular valores
    let valorItensAntigos = 0;
    for (const item of body.itens_antigos) {
      valorItensAntigos += item.quantidade * item.valor_unitario;
    }

    let valorItensNovos = 0;
    for (const item of body.itens_novos) {
      valorItensNovos += item.quantidade * item.valor_unitario;
    }

    const valorDiferenca = valorItensNovos - valorItensAntigos;
    let tipoDiferenca: 'cliente_paga' | 'cliente_recebe' | 'sem_diferenca' = 'sem_diferenca';
    if (valorDiferenca > 0) {
      tipoDiferenca = 'cliente_paga';
    } else if (valorDiferenca < 0) {
      tipoDiferenca = 'cliente_recebe';
    }

    // Verificar se requer aprovação
    const valorMaximo = Math.max(valorItensAntigos, valorItensNovos);
    const requerAprovacao = valorMaximo >= valorMinimoAprovacao && valorMinimoAprovacao > 0;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const empresaId = body.empresa_id || venda.empresa_id;

    // Gerar número da troca
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM trocas WHERE empresa_id = ?
    `).bind(empresaId).first<{ total: number }>();
    const numero = `TRC-${String((countResult?.total || 0) + 1).padStart(6, '0')}`;

    await c.env.DB.prepare(`
      INSERT INTO trocas (
        id, empresa_id, venda_id, venda_numero, cliente_id, numero,
        data_solicitacao, motivo, motivo_descricao, status, requer_aprovacao,
        valor_itens_antigos, valor_itens_novos, valor_diferenca, tipo_diferenca,
        prazo_troca_dias, dentro_prazo, solicitante_id, solicitante_nome,
        observacao, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, empresaId, body.venda_id, venda.numero || venda.id, venda.cliente_id, numero,
      now.split('T')[0], body.motivo, body.motivo_descricao || null,
      requerAprovacao ? 'pendente' : 'aprovado', requerAprovacao ? 1 : 0,
      valorItensAntigos, valorItensNovos, valorDiferenca, tipoDiferenca,
      prazoDias, dentroPrazo ? 1 : 0, body.solicitante_id || null, body.solicitante_nome || null,
      body.observacao || null, now, now
    ).run();

    // Inserir itens antigos
    for (const item of body.itens_antigos) {
      await c.env.DB.prepare(`
        INSERT INTO trocas_itens_antigos (
          id, troca_id, venda_item_id, produto_id, produto_codigo, produto_nome,
          quantidade, unidade, valor_unitario, valor_total, condicao, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, item.venda_item_id || null, item.produto_id,
        item.produto_codigo || null, item.produto_nome || null,
        item.quantidade, item.unidade || 'UN', item.valor_unitario,
        item.quantidade * item.valor_unitario, item.condicao || null, now
      ).run();
    }

    // Inserir itens novos
    for (const item of body.itens_novos) {
      await c.env.DB.prepare(`
        INSERT INTO trocas_itens_novos (
          id, troca_id, produto_id, produto_codigo, produto_nome,
          quantidade, unidade, valor_unitario, valor_total, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, item.produto_id,
        item.produto_codigo || null, item.produto_nome || null,
        item.quantidade, item.unidade || 'UN', item.valor_unitario,
        item.quantidade * item.valor_unitario, now
      ).run();
    }

    // Registrar histórico
    await c.env.DB.prepare(`
      INSERT INTO devolucoes_trocas_historico (
        id, tipo, referencia_id, acao, status_novo, usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, 'troca', ?, 'criacao', ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, requerAprovacao ? 'pendente' : 'aprovado',
      body.solicitante_id || null, body.solicitante_nome || null,
      `Troca criada para venda ${venda.numero || venda.id}`, now
    ).run();

    return c.json({
      success: true,
      data: { 
        id, 
        numero, 
        dentro_prazo: dentroPrazo, 
        requer_aprovacao: requerAprovacao,
        valor_diferenca: valorDiferenca,
        tipo_diferenca: tipoDiferenca
      },
      message: dentroPrazo 
        ? (requerAprovacao ? 'Troca criada e aguardando aprovação' : 'Troca criada e aprovada automaticamente')
        : 'Troca criada, mas fora do prazo de troca'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar troca:', error);
    return c.json({ success: false, error: 'Erro ao criar troca' }, 500);
  }
});

// =============================================
// WORKFLOW DE APROVAÇÃO
// =============================================

// POST /trocas/:id/aprovar - Aprovar troca
trocas.post('/:id/aprovar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      aprovador_id?: string;
      aprovador_nome?: string;
      observacao?: string;
    }>();

    const troca = await c.env.DB.prepare(`
      SELECT * FROM trocas WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!troca) {
      return c.json({ success: false, error: 'Troca não encontrada' }, 404);
    }

    if (troca.status !== 'pendente' && troca.status !== 'em_analise') {
      return c.json({ success: false, error: 'Troca não está pendente de aprovação' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE trocas SET 
        status = 'aprovado',
        aprovador_id = ?,
        aprovador_nome = ?,
        data_aprovacao = ?,
        observacao_interna = COALESCE(observacao_interna || ' | ', '') || ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.aprovador_id || null, body.aprovador_nome || null, now,
      body.observacao || '', now, id
    ).run();

    // Registrar histórico
    await c.env.DB.prepare(`
      INSERT INTO devolucoes_trocas_historico (
        id, tipo, referencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, 'troca', ?, 'aprovacao', ?, 'aprovado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, troca.status,
      body.aprovador_id || null, body.aprovador_nome || null,
      'Troca aprovada', now
    ).run();

    return c.json({ success: true, message: 'Troca aprovada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao aprovar troca:', error);
    return c.json({ success: false, error: 'Erro ao aprovar troca' }, 500);
  }
});

// POST /trocas/:id/reprovar - Reprovar troca
trocas.post('/:id/reprovar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      motivo_reprovacao: string;
      aprovador_id?: string;
      aprovador_nome?: string;
    }>();

    if (!body.motivo_reprovacao) {
      return c.json({ success: false, error: 'Motivo da reprovação é obrigatório' }, 400);
    }

    const troca = await c.env.DB.prepare(`
      SELECT * FROM trocas WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!troca) {
      return c.json({ success: false, error: 'Troca não encontrada' }, 404);
    }

    if (troca.status !== 'pendente' && troca.status !== 'em_analise') {
      return c.json({ success: false, error: 'Troca não está pendente de aprovação' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE trocas SET 
        status = 'reprovado',
        aprovador_id = ?,
        aprovador_nome = ?,
        motivo_reprovacao = ?,
        data_aprovacao = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.aprovador_id || null, body.aprovador_nome || null,
      body.motivo_reprovacao, now, now, id
    ).run();

    // Registrar histórico
    await c.env.DB.prepare(`
      INSERT INTO devolucoes_trocas_historico (
        id, tipo, referencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, 'troca', ?, 'reprovacao', ?, 'reprovado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, troca.status,
      body.aprovador_id || null, body.aprovador_nome || null,
      `Troca reprovada: ${body.motivo_reprovacao}`, now
    ).run();

    return c.json({ success: true, message: 'Troca reprovada' });
  } catch (error: any) {
    console.error('Erro ao reprovar troca:', error);
    return c.json({ success: false, error: 'Erro ao reprovar troca' }, 500);
  }
});

// =============================================
// PROCESSAMENTO
// =============================================

// POST /trocas/:id/registrar-recebimento - Registrar recebimento do produto antigo
trocas.post('/:id/registrar-recebimento', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      usuario_id?: string;
      usuario_nome?: string;
      observacao?: string;
      itens_conferidos?: Array<{
        item_id: string;
        condicao: string;
        quantidade_recebida: number;
      }>;
    }>();

    const troca = await c.env.DB.prepare(`
      SELECT * FROM trocas WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!troca) {
      return c.json({ success: false, error: 'Troca não encontrada' }, 404);
    }

    if (troca.status !== 'aprovado' && troca.status !== 'aguardando_produto_antigo') {
      return c.json({ success: false, error: 'Troca não está aguardando recebimento' }, 400);
    }

    const now = new Date().toISOString();

    // Atualizar condição dos itens se informado
    if (body.itens_conferidos) {
      for (const item of body.itens_conferidos) {
        await c.env.DB.prepare(`
          UPDATE trocas_itens_antigos SET condicao = ? WHERE id = ?
        `).bind(item.condicao, item.item_id).run();
      }
    }

    await c.env.DB.prepare(`
      UPDATE trocas SET 
        status = 'produto_antigo_recebido',
        observacao_interna = COALESCE(observacao_interna || ' | ', '') || ?,
        updated_at = ?
      WHERE id = ?
    `).bind(body.observacao || 'Produto antigo recebido', now, id).run();

    // Registrar histórico
    await c.env.DB.prepare(`
      INSERT INTO devolucoes_trocas_historico (
        id, tipo, referencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, 'troca', ?, 'recebimento_antigo', ?, 'produto_antigo_recebido', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, troca.status,
      body.usuario_id || null, body.usuario_nome || null,
      'Produto antigo recebido', now
    ).run();

    return c.json({ success: true, message: 'Recebimento do produto antigo registrado' });
  } catch (error: any) {
    console.error('Erro ao registrar recebimento:', error);
    return c.json({ success: false, error: 'Erro ao registrar recebimento' }, 500);
  }
});

// POST /trocas/:id/processar-estoque - Processar entrada e saída de estoque
trocas.post('/:id/processar-estoque', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      local_estoque_id?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const troca = await c.env.DB.prepare(`
      SELECT * FROM trocas WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!troca) {
      return c.json({ success: false, error: 'Troca não encontrada' }, 404);
    }

    if (troca.status !== 'produto_antigo_recebido' && troca.status !== 'aprovado') {
      return c.json({ success: false, error: 'Troca não está pronta para processamento de estoque' }, 400);
    }

    const now = new Date().toISOString();

    // Buscar itens antigos (entrada)
    const itensAntigos = await c.env.DB.prepare(`
      SELECT * FROM trocas_itens_antigos WHERE troca_id = ?
    `).bind(id).all<any>();

    // Dar entrada no estoque (produtos antigos)
    for (const item of itensAntigos.results || []) {
      await c.env.DB.prepare(`
        INSERT INTO estoque_movimentacoes (
          id, empresa_id, produto_id, tipo, quantidade,
          documento_tipo, documento_id, observacao, usuario_id, created_at
        ) VALUES (?, ?, ?, 'entrada', ?, 'troca', ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), troca.empresa_id, item.produto_id,
        item.quantidade, id,
        `Entrada por troca ${troca.numero} (produto antigo)`,
        body.usuario_id || null, now
      ).run();

      await c.env.DB.prepare(`
        UPDATE estoque_saldos SET quantidade = quantidade + ?, updated_at = ?
        WHERE empresa_id = ? AND produto_id = ? AND local_id = COALESCE(?, local_id)
      `).bind(item.quantidade, now, troca.empresa_id, item.produto_id, body.local_estoque_id || null).run();

      await c.env.DB.prepare(`
        UPDATE trocas_itens_antigos SET estoque_entrada_realizada = 1, local_estoque_id = ? WHERE id = ?
      `).bind(body.local_estoque_id || null, item.id).run();
    }

    // Buscar itens novos (saída)
    const itensNovos = await c.env.DB.prepare(`
      SELECT * FROM trocas_itens_novos WHERE troca_id = ?
    `).bind(id).all<any>();

    // Dar saída no estoque (produtos novos)
    for (const item of itensNovos.results || []) {
      await c.env.DB.prepare(`
        INSERT INTO estoque_movimentacoes (
          id, empresa_id, produto_id, tipo, quantidade,
          documento_tipo, documento_id, observacao, usuario_id, created_at
        ) VALUES (?, ?, ?, 'saida', ?, 'troca', ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), troca.empresa_id, item.produto_id,
        item.quantidade, id,
        `Saída por troca ${troca.numero} (produto novo)`,
        body.usuario_id || null, now
      ).run();

      await c.env.DB.prepare(`
        UPDATE estoque_saldos SET quantidade = quantidade - ?, updated_at = ?
        WHERE empresa_id = ? AND produto_id = ? AND local_id = COALESCE(?, local_id)
      `).bind(item.quantidade, now, troca.empresa_id, item.produto_id, body.local_estoque_id || null).run();

      await c.env.DB.prepare(`
        UPDATE trocas_itens_novos SET estoque_saida_realizada = 1, local_estoque_id = ? WHERE id = ?
      `).bind(body.local_estoque_id || null, item.id).run();
    }

    await c.env.DB.prepare(`
      UPDATE trocas SET status = 'em_processamento', updated_at = ? WHERE id = ?
    `).bind(now, id).run();

    // Registrar histórico
    await c.env.DB.prepare(`
      INSERT INTO devolucoes_trocas_historico (
        id, tipo, referencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, 'troca', ?, 'processamento_estoque', ?, 'em_processamento', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, troca.status,
      body.usuario_id || null, body.usuario_nome || null,
      'Estoque processado (entrada produtos antigos, saída produtos novos)', now
    ).run();

    return c.json({ success: true, message: 'Estoque processado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao processar estoque:', error);
    return c.json({ success: false, error: 'Erro ao processar estoque' }, 500);
  }
});

// POST /trocas/:id/processar-diferenca - Processar diferença de valores
trocas.post('/:id/processar-diferenca', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      forma_pagamento?: string; // Se cliente paga
      gerar_credito?: boolean; // Se cliente recebe
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const troca = await c.env.DB.prepare(`
      SELECT * FROM trocas WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!troca) {
      return c.json({ success: false, error: 'Troca não encontrada' }, 404);
    }

    const now = new Date().toISOString();
    let financeiroId = null;
    let creditoId = null;

    if (troca.tipo_diferenca === 'cliente_paga' && troca.valor_diferenca > 0) {
      // Cliente deve pagar a diferença - gerar conta a receber
      financeiroId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO contas_receber (
          id, empresa_id, cliente_id, tipo, valor_original, valor_aberto,
          data_vencimento, status, observacao, created_at, updated_at
        ) VALUES (?, ?, ?, 'diferenca_troca', ?, ?, date('now', '+7 days'), 'aberto', ?, ?, ?)
      `).bind(
        financeiroId, troca.empresa_id, troca.cliente_id,
        troca.valor_diferenca, troca.valor_diferenca,
        `Diferença a pagar por troca ${troca.numero}`, now, now
      ).run();
    } else if (troca.tipo_diferenca === 'cliente_recebe' && troca.valor_diferenca < 0) {
      // Cliente deve receber - gerar crédito
      creditoId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO clientes_creditos (
          id, empresa_id, cliente_id, tipo, valor, saldo, origem, origem_id,
          descricao, data_validade, status, created_at, updated_at
        ) VALUES (?, ?, ?, 'troca', ?, ?, 'troca', ?, ?, date('now', '+365 days'), 'ativo', ?, ?)
      `).bind(
        creditoId, troca.empresa_id, troca.cliente_id,
        Math.abs(troca.valor_diferenca), Math.abs(troca.valor_diferenca), id,
        `Crédito por diferença de troca ${troca.numero}`, now, now
      ).run();
    }

    await c.env.DB.prepare(`
      UPDATE trocas SET 
        status = 'concluido',
        financeiro_diferenca_id = ?,
        credito_gerado_id = ?,
        data_conclusao = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(financeiroId, creditoId, now, now, id).run();

    // Registrar histórico
    await c.env.DB.prepare(`
      INSERT INTO devolucoes_trocas_historico (
        id, tipo, referencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, 'troca', ?, 'conclusao', ?, 'concluido', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, troca.status,
      body.usuario_id || null, body.usuario_nome || null,
      `Troca concluída. ${troca.tipo_diferenca === 'cliente_paga' ? 'Gerado título a receber' : troca.tipo_diferenca === 'cliente_recebe' ? 'Gerado crédito para cliente' : 'Sem diferença'}`, now
    ).run();

    return c.json({
      success: true,
      data: {
        tipo_diferenca: troca.tipo_diferenca,
        valor_diferenca: troca.valor_diferenca,
        financeiro_id: financeiroId,
        credito_id: creditoId
      },
      message: 'Troca concluída com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao processar diferença:', error);
    return c.json({ success: false, error: 'Erro ao processar diferença' }, 500);
  }
});

// =============================================
// CANCELAMENTO
// =============================================

// POST /trocas/:id/cancelar - Cancelar troca
trocas.post('/:id/cancelar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      motivo: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    if (!body.motivo) {
      return c.json({ success: false, error: 'Motivo do cancelamento é obrigatório' }, 400);
    }

    const troca = await c.env.DB.prepare(`
      SELECT * FROM trocas WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!troca) {
      return c.json({ success: false, error: 'Troca não encontrada' }, 404);
    }

    if (troca.status === 'concluido') {
      return c.json({ success: false, error: 'Troca já concluída não pode ser cancelada' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE trocas SET 
        status = 'cancelado',
        observacao_interna = COALESCE(observacao_interna || ' | ', '') || ?,
        updated_at = ?
      WHERE id = ?
    `).bind(`Cancelado: ${body.motivo}`, now, id).run();

    // Registrar histórico
    await c.env.DB.prepare(`
      INSERT INTO devolucoes_trocas_historico (
        id, tipo, referencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, 'troca', ?, 'cancelamento', ?, 'cancelado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, troca.status,
      body.usuario_id || null, body.usuario_nome || null,
      `Troca cancelada: ${body.motivo}`, now
    ).run();

    return c.json({ success: true, message: 'Troca cancelada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao cancelar troca:', error);
    return c.json({ success: false, error: 'Erro ao cancelar troca' }, 500);
  }
});

// =============================================
// DASHBOARD
// =============================================

// GET /trocas/dashboard/resumo - Dashboard de trocas
trocas.get('/dashboard/resumo', async (c) => {
  const { empresa_id } = c.req.query();

  try {
    let where = 'WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND empresa_id = ?';
      params.push(empresa_id);
    }

    // Por status
    const porStatus = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as quantidade, SUM(valor_itens_novos) as valor_total
      FROM trocas ${where}
      GROUP BY status
    `).bind(...params).all();

    // Pendentes de aprovação
    const pendentes = await c.env.DB.prepare(`
      SELECT t.*, c.razao_social as cliente_nome
      FROM trocas t
      LEFT JOIN clientes c ON c.id = t.cliente_id
      ${where} AND t.status IN ('pendente', 'em_analise')
      ORDER BY t.created_at ASC
      LIMIT 10
    `).bind(...params).all();

    // Por motivo (últimos 30 dias)
    const porMotivo = await c.env.DB.prepare(`
      SELECT motivo, COUNT(*) as quantidade
      FROM trocas ${where} AND data_solicitacao >= date('now', '-30 days')
      GROUP BY motivo
      ORDER BY quantidade DESC
    `).bind(...params).all();

    // Diferenças no mês
    const diferencasMes = await c.env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN tipo_diferenca = 'cliente_paga' THEN valor_diferenca ELSE 0 END) as a_receber,
        SUM(CASE WHEN tipo_diferenca = 'cliente_recebe' THEN ABS(valor_diferenca) ELSE 0 END) as creditos_gerados
      FROM trocas ${where} AND status = 'concluido' 
      AND data_conclusao >= date('now', 'start of month')
    `).bind(...params).first();

    return c.json({
      success: true,
      data: {
        por_status: porStatus.results,
        pendentes: pendentes.results,
        por_motivo: porMotivo.results,
        diferencas_mes: diferencasMes
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar dashboard:', error);
    return c.json({ success: false, error: 'Erro ao buscar dashboard' }, 500);
  }
});

export default trocas;
