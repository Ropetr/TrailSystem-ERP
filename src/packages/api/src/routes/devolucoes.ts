// =============================================
// TRAILSYSTEM ERP - Rotas de Devoluções
// Fluxo completo: solicitação, aprovação, processamento
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const devolucoes = new Hono<{ Bindings: Env }>();

// =============================================
// CRUD DE DEVOLUÇÕES
// =============================================

// GET /devolucoes - Listar devoluções
devolucoes.get('/', async (c) => {
  const { page = '1', limit = '20', status, cliente_id, empresa_id, venda_id } = c.req.query();

  try {
    let where = 'WHERE d.deleted_at IS NULL';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND d.empresa_id = ?';
      params.push(empresa_id);
    }

    if (status) {
      where += ' AND d.status = ?';
      params.push(status);
    }

    if (cliente_id) {
      where += ' AND d.cliente_id = ?';
      params.push(cliente_id);
    }

    if (venda_id) {
      where += ' AND d.venda_id = ?';
      params.push(venda_id);
    }

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM devolucoes d ${where}
    `).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await c.env.DB.prepare(`
      SELECT d.*, c.razao_social as cliente_nome
      FROM devolucoes d
      LEFT JOIN clientes c ON c.id = d.cliente_id
      ${where}
      ORDER BY d.created_at DESC
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
    console.error('Erro ao listar devoluções:', error);
    return c.json({ success: false, error: 'Erro ao listar devoluções' }, 500);
  }
});

// GET /devolucoes/:id - Buscar devolução por ID
devolucoes.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const devolucao = await c.env.DB.prepare(`
      SELECT d.*, c.razao_social as cliente_nome, c.cnpj_cpf as cliente_documento
      FROM devolucoes d
      LEFT JOIN clientes c ON c.id = d.cliente_id
      WHERE d.id = ? AND d.deleted_at IS NULL
    `).bind(id).first();

    if (!devolucao) {
      return c.json({ success: false, error: 'Devolução não encontrada' }, 404);
    }

    // Buscar itens
    const itens = await c.env.DB.prepare(`
      SELECT * FROM devolucoes_itens WHERE devolucao_id = ?
    `).bind(id).all();

    // Buscar histórico
    const historico = await c.env.DB.prepare(`
      SELECT * FROM devolucoes_trocas_historico 
      WHERE tipo = 'devolucao' AND referencia_id = ? 
      ORDER BY created_at DESC
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...devolucao,
        itens: itens.results,
        historico: historico.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar devolução:', error);
    return c.json({ success: false, error: 'Erro ao buscar devolução' }, 500);
  }
});

// POST /devolucoes - Criar devolução
devolucoes.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      venda_id: string;
      motivo: string;
      motivo_descricao?: string;
      condicao_produto?: string;
      tipo_estorno?: 'dinheiro' | 'credito';
      itens: Array<{
        venda_item_id?: string;
        produto_id: string;
        produto_codigo?: string;
        produto_nome?: string;
        quantidade_vendida: number;
        quantidade_devolvida: number;
        unidade?: string;
        valor_unitario: number;
        condicao?: string;
        motivo_item?: string;
      }>;
      observacao?: string;
      solicitante_id?: string;
      solicitante_nome?: string;
      empresa_id?: string;
    }>();

    if (!body.venda_id || !body.motivo || !body.itens || body.itens.length === 0) {
      return c.json({ success: false, error: 'Venda, motivo e itens são obrigatórios' }, 400);
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
      SELECT prazo_devolucao_dias, valor_minimo_aprovacao, tipo_estorno_padrao
      FROM config_devolucao_troca WHERE empresa_id = ?
    `).bind(venda.empresa_id).first<any>();

    const prazoDias = config?.prazo_devolucao_dias || 7;
    const valorMinimoAprovacao = config?.valor_minimo_aprovacao || 0;
    const tipoEstornoPadrao = config?.tipo_estorno_padrao || 'credito';

    // Verificar prazo
    const dataVenda = new Date(venda.data_venda || venda.created_at);
    const hoje = new Date();
    const diasDesdeVenda = Math.floor((hoje.getTime() - dataVenda.getTime()) / (1000 * 60 * 60 * 24));
    const dentroPrazo = diasDesdeVenda <= prazoDias;

    // Calcular valor total
    let valorTotalItens = 0;
    for (const item of body.itens) {
      valorTotalItens += item.quantidade_devolvida * item.valor_unitario;
    }

    // Verificar se requer aprovação
    const requerAprovacao = valorTotalItens >= valorMinimoAprovacao && valorMinimoAprovacao > 0;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const empresaId = body.empresa_id || venda.empresa_id;

    // Gerar número da devolução
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM devolucoes WHERE empresa_id = ?
    `).bind(empresaId).first<{ total: number }>();
    const numero = `DEV-${String((countResult?.total || 0) + 1).padStart(6, '0')}`;

    await c.env.DB.prepare(`
      INSERT INTO devolucoes (
        id, empresa_id, venda_id, venda_numero, cliente_id, numero,
        data_solicitacao, motivo, motivo_descricao, condicao_produto,
        status, requer_aprovacao, valor_total_itens, tipo_estorno,
        prazo_devolucao_dias, dentro_prazo, solicitante_id, solicitante_nome,
        observacao, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, empresaId, body.venda_id, venda.numero || venda.id, venda.cliente_id, numero,
      now.split('T')[0], body.motivo, body.motivo_descricao || null, body.condicao_produto || null,
      requerAprovacao ? 'pendente' : 'aprovado', requerAprovacao ? 1 : 0,
      valorTotalItens, body.tipo_estorno || tipoEstornoPadrao,
      prazoDias, dentroPrazo ? 1 : 0, body.solicitante_id || null, body.solicitante_nome || null,
      body.observacao || null, now, now
    ).run();

    // Inserir itens
    for (const item of body.itens) {
      await c.env.DB.prepare(`
        INSERT INTO devolucoes_itens (
          id, devolucao_id, venda_item_id, produto_id, produto_codigo, produto_nome,
          quantidade_vendida, quantidade_devolvida, unidade, valor_unitario, valor_total,
          condicao, motivo_item, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, item.venda_item_id || null, item.produto_id,
        item.produto_codigo || null, item.produto_nome || null,
        item.quantidade_vendida, item.quantidade_devolvida, item.unidade || 'UN',
        item.valor_unitario, item.quantidade_devolvida * item.valor_unitario,
        item.condicao || null, item.motivo_item || null, now
      ).run();
    }

    // Registrar histórico
    await c.env.DB.prepare(`
      INSERT INTO devolucoes_trocas_historico (
        id, tipo, referencia_id, acao, status_novo, usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, 'devolucao', ?, 'criacao', ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, requerAprovacao ? 'pendente' : 'aprovado',
      body.solicitante_id || null, body.solicitante_nome || null,
      `Devolução criada para venda ${venda.numero || venda.id}`, now
    ).run();

    return c.json({
      success: true,
      data: { id, numero, dentro_prazo: dentroPrazo, requer_aprovacao: requerAprovacao },
      message: dentroPrazo 
        ? (requerAprovacao ? 'Devolução criada e aguardando aprovação' : 'Devolução criada e aprovada automaticamente')
        : 'Devolução criada, mas fora do prazo de devolução'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar devolução:', error);
    return c.json({ success: false, error: 'Erro ao criar devolução' }, 500);
  }
});

// =============================================
// WORKFLOW DE APROVAÇÃO
// =============================================

// POST /devolucoes/:id/aprovar - Aprovar devolução
devolucoes.post('/:id/aprovar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      aprovador_id?: string;
      aprovador_nome?: string;
      observacao?: string;
    }>();

    const devolucao = await c.env.DB.prepare(`
      SELECT * FROM devolucoes WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!devolucao) {
      return c.json({ success: false, error: 'Devolução não encontrada' }, 404);
    }

    if (devolucao.status !== 'pendente' && devolucao.status !== 'em_analise') {
      return c.json({ success: false, error: 'Devolução não está pendente de aprovação' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE devolucoes SET 
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
      ) VALUES (?, 'devolucao', ?, 'aprovacao', ?, 'aprovado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, devolucao.status,
      body.aprovador_id || null, body.aprovador_nome || null,
      'Devolução aprovada', now
    ).run();

    return c.json({ success: true, message: 'Devolução aprovada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao aprovar devolução:', error);
    return c.json({ success: false, error: 'Erro ao aprovar devolução' }, 500);
  }
});

// POST /devolucoes/:id/reprovar - Reprovar devolução
devolucoes.post('/:id/reprovar', async (c) => {
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

    const devolucao = await c.env.DB.prepare(`
      SELECT * FROM devolucoes WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!devolucao) {
      return c.json({ success: false, error: 'Devolução não encontrada' }, 404);
    }

    if (devolucao.status !== 'pendente' && devolucao.status !== 'em_analise') {
      return c.json({ success: false, error: 'Devolução não está pendente de aprovação' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE devolucoes SET 
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
      ) VALUES (?, 'devolucao', ?, 'reprovacao', ?, 'reprovado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, devolucao.status,
      body.aprovador_id || null, body.aprovador_nome || null,
      `Devolução reprovada: ${body.motivo_reprovacao}`, now
    ).run();

    return c.json({ success: true, message: 'Devolução reprovada' });
  } catch (error: any) {
    console.error('Erro ao reprovar devolução:', error);
    return c.json({ success: false, error: 'Erro ao reprovar devolução' }, 500);
  }
});

// =============================================
// PROCESSAMENTO
// =============================================

// POST /devolucoes/:id/registrar-recebimento - Registrar recebimento do produto
devolucoes.post('/:id/registrar-recebimento', async (c) => {
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

    const devolucao = await c.env.DB.prepare(`
      SELECT * FROM devolucoes WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!devolucao) {
      return c.json({ success: false, error: 'Devolução não encontrada' }, 404);
    }

    if (devolucao.status !== 'aprovado' && devolucao.status !== 'aguardando_produto') {
      return c.json({ success: false, error: 'Devolução não está aguardando recebimento' }, 400);
    }

    const now = new Date().toISOString();

    // Atualizar condição dos itens se informado
    if (body.itens_conferidos) {
      for (const item of body.itens_conferidos) {
        await c.env.DB.prepare(`
          UPDATE devolucoes_itens SET condicao = ? WHERE id = ?
        `).bind(item.condicao, item.item_id).run();
      }
    }

    await c.env.DB.prepare(`
      UPDATE devolucoes SET 
        status = 'produto_recebido',
        observacao_interna = COALESCE(observacao_interna || ' | ', '') || ?,
        updated_at = ?
      WHERE id = ?
    `).bind(body.observacao || 'Produto recebido', now, id).run();

    // Registrar histórico
    await c.env.DB.prepare(`
      INSERT INTO devolucoes_trocas_historico (
        id, tipo, referencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, 'devolucao', ?, 'recebimento', ?, 'produto_recebido', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, devolucao.status,
      body.usuario_id || null, body.usuario_nome || null,
      'Produto devolvido recebido', now
    ).run();

    return c.json({ success: true, message: 'Recebimento registrado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao registrar recebimento:', error);
    return c.json({ success: false, error: 'Erro ao registrar recebimento' }, 500);
  }
});

// POST /devolucoes/:id/processar-estoque - Dar entrada no estoque
devolucoes.post('/:id/processar-estoque', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      local_estoque_id?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const devolucao = await c.env.DB.prepare(`
      SELECT * FROM devolucoes WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!devolucao) {
      return c.json({ success: false, error: 'Devolução não encontrada' }, 404);
    }

    if (devolucao.status !== 'produto_recebido' && devolucao.status !== 'aprovado') {
      return c.json({ success: false, error: 'Devolução não está pronta para entrada no estoque' }, 400);
    }

    const now = new Date().toISOString();

    // Buscar itens
    const itens = await c.env.DB.prepare(`
      SELECT * FROM devolucoes_itens WHERE devolucao_id = ?
    `).bind(id).all<any>();

    // Dar entrada no estoque para cada item
    for (const item of itens.results || []) {
      // Registrar movimentação de estoque (entrada)
      await c.env.DB.prepare(`
        INSERT INTO estoque_movimentacoes (
          id, empresa_id, produto_id, tipo, quantidade, 
          documento_tipo, documento_id, observacao, usuario_id, created_at
        ) VALUES (?, ?, ?, 'entrada', ?, 'devolucao', ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), devolucao.empresa_id, item.produto_id,
        item.quantidade_devolvida, id,
        `Entrada por devolução ${devolucao.numero}`,
        body.usuario_id || null, now
      ).run();

      // Atualizar saldo de estoque
      await c.env.DB.prepare(`
        UPDATE estoque_saldos SET 
          quantidade = quantidade + ?,
          updated_at = ?
        WHERE empresa_id = ? AND produto_id = ? AND local_id = COALESCE(?, local_id)
      `).bind(
        item.quantidade_devolvida, now, devolucao.empresa_id, item.produto_id,
        body.local_estoque_id || null
      ).run();

      // Marcar item como entrada realizada
      await c.env.DB.prepare(`
        UPDATE devolucoes_itens SET estoque_entrada_realizada = 1, local_estoque_id = ? WHERE id = ?
      `).bind(body.local_estoque_id || null, item.id).run();
    }

    await c.env.DB.prepare(`
      UPDATE devolucoes SET status = 'em_processamento', updated_at = ? WHERE id = ?
    `).bind(now, id).run();

    // Registrar histórico
    await c.env.DB.prepare(`
      INSERT INTO devolucoes_trocas_historico (
        id, tipo, referencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, 'devolucao', ?, 'entrada_estoque', ?, 'em_processamento', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, devolucao.status,
      body.usuario_id || null, body.usuario_nome || null,
      'Entrada no estoque realizada', now
    ).run();

    return c.json({ success: true, message: 'Entrada no estoque realizada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao processar estoque:', error);
    return c.json({ success: false, error: 'Erro ao processar estoque' }, 500);
  }
});

// POST /devolucoes/:id/processar-financeiro - Processar estorno/crédito
devolucoes.post('/:id/processar-financeiro', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      tipo_estorno?: 'dinheiro' | 'credito';
      usuario_id?: string;
      usuario_nome?: string;
      observacao?: string;
    }>();

    const devolucao = await c.env.DB.prepare(`
      SELECT * FROM devolucoes WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!devolucao) {
      return c.json({ success: false, error: 'Devolução não encontrada' }, 404);
    }

    const now = new Date().toISOString();
    const tipoEstorno = body.tipo_estorno || devolucao.tipo_estorno || 'credito';
    let creditoId = null;
    let estornoId = null;

    if (tipoEstorno === 'credito') {
      // Gerar crédito na carteira do cliente
      creditoId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO clientes_creditos (
          id, empresa_id, cliente_id, tipo, valor, saldo, origem, origem_id,
          descricao, data_validade, status, created_at, updated_at
        ) VALUES (?, ?, ?, 'devolucao', ?, ?, 'devolucao', ?, ?, date('now', '+365 days'), 'ativo', ?, ?)
      `).bind(
        creditoId, devolucao.empresa_id, devolucao.cliente_id,
        devolucao.valor_total_itens, devolucao.valor_total_itens, id,
        `Crédito por devolução ${devolucao.numero}`, now, now
      ).run();
    } else {
      // Registrar estorno financeiro
      estornoId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO contas_pagar (
          id, empresa_id, fornecedor_id, tipo, valor_original, valor_aberto,
          data_vencimento, status, observacao, created_at, updated_at
        ) VALUES (?, ?, ?, 'estorno_devolucao', ?, ?, date('now'), 'aberto', ?, ?, ?)
      `).bind(
        estornoId, devolucao.empresa_id, devolucao.cliente_id,
        devolucao.valor_total_itens, devolucao.valor_total_itens,
        `Estorno por devolução ${devolucao.numero}`, now, now
      ).run();
    }

    await c.env.DB.prepare(`
      UPDATE devolucoes SET 
        status = 'concluido',
        tipo_estorno = ?,
        credito_gerado_id = ?,
        estorno_financeiro_id = ?,
        valor_restituicao = ?,
        data_conclusao = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      tipoEstorno, creditoId, estornoId, devolucao.valor_total_itens, now, now, id
    ).run();

    // Registrar histórico
    await c.env.DB.prepare(`
      INSERT INTO devolucoes_trocas_historico (
        id, tipo, referencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, 'devolucao', ?, 'conclusao', ?, 'concluido', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, devolucao.status,
      body.usuario_id || null, body.usuario_nome || null,
      `Devolução concluída com ${tipoEstorno === 'credito' ? 'geração de crédito' : 'estorno financeiro'}`, now
    ).run();

    return c.json({
      success: true,
      data: {
        tipo_estorno: tipoEstorno,
        credito_id: creditoId,
        estorno_id: estornoId,
        valor: devolucao.valor_total_itens
      },
      message: tipoEstorno === 'credito' 
        ? 'Crédito gerado na carteira do cliente'
        : 'Estorno financeiro registrado'
    });
  } catch (error: any) {
    console.error('Erro ao processar financeiro:', error);
    return c.json({ success: false, error: 'Erro ao processar financeiro' }, 500);
  }
});

// =============================================
// CANCELAMENTO
// =============================================

// POST /devolucoes/:id/cancelar - Cancelar devolução
devolucoes.post('/:id/cancelar', async (c) => {
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

    const devolucao = await c.env.DB.prepare(`
      SELECT * FROM devolucoes WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!devolucao) {
      return c.json({ success: false, error: 'Devolução não encontrada' }, 404);
    }

    if (devolucao.status === 'concluido') {
      return c.json({ success: false, error: 'Devolução já concluída não pode ser cancelada' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE devolucoes SET 
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
      ) VALUES (?, 'devolucao', ?, 'cancelamento', ?, 'cancelado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, devolucao.status,
      body.usuario_id || null, body.usuario_nome || null,
      `Devolução cancelada: ${body.motivo}`, now
    ).run();

    return c.json({ success: true, message: 'Devolução cancelada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao cancelar devolução:', error);
    return c.json({ success: false, error: 'Erro ao cancelar devolução' }, 500);
  }
});

// =============================================
// DASHBOARD
// =============================================

// GET /devolucoes/dashboard/resumo - Dashboard de devoluções
devolucoes.get('/dashboard/resumo', async (c) => {
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
      SELECT status, COUNT(*) as quantidade, SUM(valor_total_itens) as valor_total
      FROM devolucoes ${where}
      GROUP BY status
    `).bind(...params).all();

    // Pendentes de aprovação
    const pendentes = await c.env.DB.prepare(`
      SELECT d.*, c.razao_social as cliente_nome
      FROM devolucoes d
      LEFT JOIN clientes c ON c.id = d.cliente_id
      ${where} AND d.status IN ('pendente', 'em_analise')
      ORDER BY d.created_at ASC
      LIMIT 10
    `).bind(...params).all();

    // Por motivo (últimos 30 dias)
    const porMotivo = await c.env.DB.prepare(`
      SELECT motivo, COUNT(*) as quantidade
      FROM devolucoes ${where} AND data_solicitacao >= date('now', '-30 days')
      GROUP BY motivo
      ORDER BY quantidade DESC
    `).bind(...params).all();

    // Valor total devolvido no mês
    const valorMes = await c.env.DB.prepare(`
      SELECT SUM(valor_total_itens) as total
      FROM devolucoes ${where} AND status = 'concluido' 
      AND data_conclusao >= date('now', 'start of month')
    `).bind(...params).first();

    return c.json({
      success: true,
      data: {
        por_status: porStatus.results,
        pendentes: pendentes.results,
        por_motivo: porMotivo.results,
        valor_mes: valorMes?.total || 0
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar dashboard:', error);
    return c.json({ success: false, error: 'Erro ao buscar dashboard' }, 500);
  }
});

export default devolucoes;
