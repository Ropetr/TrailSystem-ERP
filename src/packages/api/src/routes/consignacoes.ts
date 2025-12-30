// =============================================
// TRAILSYSTEM ERP - Rotas de Consignacoes
// Fluxo completo: criacao, emissao, acerto, encerramento
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const consignacoes = new Hono<{ Bindings: Env }>();

// =============================================
// CRUD DE CONSIGNACOES
// =============================================

// GET /consignacoes - Listar consignacoes
consignacoes.get('/', async (c) => {
  const { page = '1', limit = '20', status, cliente_id, empresa_id, vencendo } = c.req.query();

  try {
    let where = 'WHERE c.deleted_at IS NULL';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND c.empresa_id = ?';
      params.push(empresa_id);
    }

    if (status) {
      where += ' AND c.status = ?';
      params.push(status);
    }

    if (cliente_id) {
      where += ' AND c.cliente_id = ?';
      params.push(cliente_id);
    }

    if (vencendo === 'true') {
      where += " AND c.status IN ('ativo', 'acerto_parcial', 'entregue') AND julianday(c.data_prazo_acerto) - julianday('now') <= 7";
    }

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM consignacoes c ${where}
    `).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await c.env.DB.prepare(`
      SELECT c.*, 
        cl.razao_social as cliente_razao_social,
        CAST(julianday('now') - julianday(c.data_emissao) AS INTEGER) as dias_em_consignacao,
        CAST(julianday(c.data_prazo_acerto) - julianday('now') AS INTEGER) as dias_para_vencimento
      FROM consignacoes c
      LEFT JOIN clientes cl ON cl.id = c.cliente_id
      ${where}
      ORDER BY c.created_at DESC
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
    console.error('Erro ao listar consignacoes:', error);
    return c.json({ success: false, error: 'Erro ao listar consignacoes' }, 500);
  }
});

// GET /consignacoes/:id - Buscar consignacao por ID
consignacoes.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const consignacao = await c.env.DB.prepare(`
      SELECT c.*, 
        cl.razao_social as cliente_razao_social,
        cl.cnpj_cpf as cliente_documento,
        CAST(julianday('now') - julianday(c.data_emissao) AS INTEGER) as dias_em_consignacao,
        CAST(julianday(c.data_prazo_acerto) - julianday('now') AS INTEGER) as dias_para_vencimento
      FROM consignacoes c
      LEFT JOIN clientes cl ON cl.id = c.cliente_id
      WHERE c.id = ? AND c.deleted_at IS NULL
    `).bind(id).first();

    if (!consignacao) {
      return c.json({ success: false, error: 'Consignacao nao encontrada' }, 404);
    }

    // Buscar itens
    const itens = await c.env.DB.prepare(`
      SELECT * FROM consignacoes_itens WHERE consignacao_id = ?
    `).bind(id).all();

    // Buscar acertos
    const acertos = await c.env.DB.prepare(`
      SELECT * FROM consignacoes_acertos WHERE consignacao_id = ? ORDER BY created_at DESC
    `).bind(id).all();

    // Buscar historico
    const historico = await c.env.DB.prepare(`
      SELECT * FROM consignacoes_historico 
      WHERE consignacao_id = ? 
      ORDER BY created_at DESC
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...consignacao,
        itens: itens.results,
        acertos: acertos.results,
        historico: historico.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar consignacao:', error);
    return c.json({ success: false, error: 'Erro ao buscar consignacao' }, 500);
  }
});

// POST /consignacoes - Criar consignacao
consignacoes.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      cliente_id: string;
      prazo_acerto_dias?: number;
      itens: Array<{
        produto_id: string;
        produto_codigo?: string;
        produto_nome?: string;
        quantidade: number;
        unidade?: string;
        valor_unitario: number;
        local_estoque_id?: string;
      }>;
      observacao?: string;
      vendedor_id?: string;
      vendedor_nome?: string;
      criado_por_id?: string;
      criado_por_nome?: string;
      empresa_id?: string;
      local_estoque_origem_id?: string;
    }>();

    if (!body.cliente_id || !body.itens || body.itens.length === 0) {
      return c.json({ success: false, error: 'Cliente e itens sao obrigatorios' }, 400);
    }

    // Buscar cliente
    const cliente = await c.env.DB.prepare(`
      SELECT id, razao_social, empresa_id FROM clientes WHERE id = ? AND deleted_at IS NULL
    `).bind(body.cliente_id).first<any>();

    if (!cliente) {
      return c.json({ success: false, error: 'Cliente nao encontrado' }, 404);
    }

    const empresaId = body.empresa_id || cliente.empresa_id;

    // Buscar configuracao
    const config = await c.env.DB.prepare(`
      SELECT prazo_acerto_padrao_dias FROM config_consignacao WHERE empresa_id = ?
    `).bind(empresaId).first<any>();

    const prazoAcertoDias = body.prazo_acerto_dias || config?.prazo_acerto_padrao_dias || 30;

    // Calcular valores
    let valorTotalConsignado = 0;
    let qtdItensConsignados = 0;
    for (const item of body.itens) {
      valorTotalConsignado += item.quantidade * item.valor_unitario;
      qtdItensConsignados += item.quantidade;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const dataEmissao = now.split('T')[0];
    
    // Calcular data prazo
    const dataPrazo = new Date();
    dataPrazo.setDate(dataPrazo.getDate() + prazoAcertoDias);
    const dataPrazoAcerto = dataPrazo.toISOString().split('T')[0];

    // Gerar numero da consignacao
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM consignacoes WHERE empresa_id = ?
    `).bind(empresaId).first<{ total: number }>();
    const numero = `CONS-${String((countResult?.total || 0) + 1).padStart(6, '0')}`;

    await c.env.DB.prepare(`
      INSERT INTO consignacoes (
        id, empresa_id, cliente_id, cliente_nome, numero,
        data_emissao, data_prazo_acerto, status,
        valor_total_consignado, valor_saldo_consignado,
        qtd_itens_consignados, qtd_itens_saldo,
        prazo_acerto_dias, vendedor_id, vendedor_nome,
        local_estoque_origem_id, observacao,
        criado_por_id, criado_por_nome, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'rascunho', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, empresaId, body.cliente_id, cliente.razao_social, numero,
      dataEmissao, dataPrazoAcerto,
      valorTotalConsignado, valorTotalConsignado,
      qtdItensConsignados, qtdItensConsignados,
      prazoAcertoDias, body.vendedor_id || null, body.vendedor_nome || null,
      body.local_estoque_origem_id || null, body.observacao || null,
      body.criado_por_id || null, body.criado_por_nome || null, now, now
    ).run();

    // Inserir itens
    for (const item of body.itens) {
      await c.env.DB.prepare(`
        INSERT INTO consignacoes_itens (
          id, consignacao_id, produto_id, produto_codigo, produto_nome,
          quantidade_consignada, quantidade_saldo, unidade,
          valor_unitario, valor_total_consignado,
          local_estoque_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, item.produto_id,
        item.produto_codigo || null, item.produto_nome || null,
        item.quantidade, item.quantidade, item.unidade || 'UN',
        item.valor_unitario, item.quantidade * item.valor_unitario,
        item.local_estoque_id || null, now, now
      ).run();
    }

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO consignacoes_historico (
        id, consignacao_id, acao, status_novo, usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'criacao', 'rascunho', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id,
      body.criado_por_id || null, body.criado_por_nome || null,
      `Consignacao criada para cliente ${cliente.razao_social}`, now
    ).run();

    return c.json({
      success: true,
      data: { id, numero, data_prazo_acerto: dataPrazoAcerto },
      message: 'Consignacao criada com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar consignacao:', error);
    return c.json({ success: false, error: 'Erro ao criar consignacao' }, 500);
  }
});

// PUT /consignacoes/:id - Atualizar consignacao (apenas rascunho)
consignacoes.put('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      prazo_acerto_dias?: number;
      observacao?: string;
      vendedor_id?: string;
      vendedor_nome?: string;
      local_estoque_origem_id?: string;
    }>();

    const consignacao = await c.env.DB.prepare(`
      SELECT * FROM consignacoes WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!consignacao) {
      return c.json({ success: false, error: 'Consignacao nao encontrada' }, 404);
    }

    if (consignacao.status !== 'rascunho') {
      return c.json({ success: false, error: 'Apenas consignacoes em rascunho podem ser editadas' }, 400);
    }

    const now = new Date().toISOString();

    // Recalcular data prazo se alterou dias
    let dataPrazoAcerto = consignacao.data_prazo_acerto;
    if (body.prazo_acerto_dias && body.prazo_acerto_dias !== consignacao.prazo_acerto_dias) {
      const dataEmissao = new Date(consignacao.data_emissao);
      dataEmissao.setDate(dataEmissao.getDate() + body.prazo_acerto_dias);
      dataPrazoAcerto = dataEmissao.toISOString().split('T')[0];
    }

    await c.env.DB.prepare(`
      UPDATE consignacoes SET 
        prazo_acerto_dias = COALESCE(?, prazo_acerto_dias),
        data_prazo_acerto = ?,
        observacao = COALESCE(?, observacao),
        vendedor_id = COALESCE(?, vendedor_id),
        vendedor_nome = COALESCE(?, vendedor_nome),
        local_estoque_origem_id = COALESCE(?, local_estoque_origem_id),
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.prazo_acerto_dias || null, dataPrazoAcerto,
      body.observacao || null,
      body.vendedor_id || null, body.vendedor_nome || null,
      body.local_estoque_origem_id || null,
      now, id
    ).run();

    return c.json({ success: true, message: 'Consignacao atualizada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao atualizar consignacao:', error);
    return c.json({ success: false, error: 'Erro ao atualizar consignacao' }, 500);
  }
});

// =============================================
// WORKFLOW DE EMISSAO
// =============================================

// POST /consignacoes/:id/emitir - Emitir consignacao (gerar NF-e de remessa)
consignacoes.post('/:id/emitir', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      usuario_id?: string;
      usuario_nome?: string;
      nfe_remessa_numero?: string;
      nfe_remessa_chave?: string;
    }>();

    const consignacao = await c.env.DB.prepare(`
      SELECT * FROM consignacoes WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!consignacao) {
      return c.json({ success: false, error: 'Consignacao nao encontrada' }, 404);
    }

    if (consignacao.status !== 'rascunho') {
      return c.json({ success: false, error: 'Apenas consignacoes em rascunho podem ser emitidas' }, 400);
    }

    const now = new Date().toISOString();

    // Buscar itens para dar saida no estoque
    const itens = await c.env.DB.prepare(`
      SELECT * FROM consignacoes_itens WHERE consignacao_id = ?
    `).bind(id).all();

    // Dar saida no estoque proprio e entrada no estoque em consignacao
    for (const item of itens.results as any[]) {
      // Registrar movimentacao de saida
      await c.env.DB.prepare(`
        INSERT INTO estoque_movimentacoes (
          id, empresa_id, produto_id, tipo, quantidade, 
          documento_tipo, documento_id, observacao, created_at
        ) VALUES (?, ?, ?, 'saida', ?, 'consignacao', ?, ?, ?)
      `).bind(
        crypto.randomUUID(), consignacao.empresa_id, item.produto_id,
        item.quantidade_consignada, id,
        `Saida para consignacao ${consignacao.numero}`, now
      ).run();

      // Atualizar saldo do estoque
      await c.env.DB.prepare(`
        UPDATE estoque_saldos SET 
          quantidade = quantidade - ?,
          updated_at = ?
        WHERE empresa_id = ? AND produto_id = ? AND local_id = COALESCE(?, local_id)
      `).bind(
        item.quantidade_consignada, now,
        consignacao.empresa_id, item.produto_id, item.local_estoque_id
      ).run();

      // Criar registro de estoque em consignacao
      await c.env.DB.prepare(`
        INSERT INTO estoque_consignacao (
          id, empresa_id, consignacao_id, consignacao_item_id,
          cliente_id, produto_id, produto_codigo, produto_nome,
          quantidade, unidade, valor_unitario, valor_total,
          data_entrada, data_prazo, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo', ?, ?)
      `).bind(
        crypto.randomUUID(), consignacao.empresa_id, id, item.id,
        consignacao.cliente_id, item.produto_id, item.produto_codigo, item.produto_nome,
        item.quantidade_consignada, item.unidade, item.valor_unitario, item.valor_total_consignado,
        now.split('T')[0], consignacao.data_prazo_acerto, now, now
      ).run();

      // Marcar saida realizada no item
      await c.env.DB.prepare(`
        UPDATE consignacoes_itens SET estoque_saida_realizada = 1, updated_at = ? WHERE id = ?
      `).bind(now, item.id).run();
    }

    await c.env.DB.prepare(`
      UPDATE consignacoes SET 
        status = 'emitido',
        nfe_remessa_numero = ?,
        nfe_remessa_chave = ?,
        nfe_remessa_data = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.nfe_remessa_numero || null, body.nfe_remessa_chave || null,
      now.split('T')[0], now, id
    ).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO consignacoes_historico (
        id, consignacao_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'emissao', 'rascunho', 'emitido', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id,
      body.usuario_id || null, body.usuario_nome || null,
      'Consignacao emitida - NF-e de remessa gerada', now
    ).run();

    return c.json({ success: true, message: 'Consignacao emitida com sucesso' });
  } catch (error: any) {
    console.error('Erro ao emitir consignacao:', error);
    return c.json({ success: false, error: 'Erro ao emitir consignacao' }, 500);
  }
});

// POST /consignacoes/:id/confirmar-entrega - Confirmar entrega ao cliente
consignacoes.post('/:id/confirmar-entrega', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      usuario_id?: string;
      usuario_nome?: string;
      observacao?: string;
    }>();

    const consignacao = await c.env.DB.prepare(`
      SELECT * FROM consignacoes WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!consignacao) {
      return c.json({ success: false, error: 'Consignacao nao encontrada' }, 404);
    }

    if (consignacao.status !== 'emitido' && consignacao.status !== 'em_transito') {
      return c.json({ success: false, error: 'Consignacao nao esta em transito' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE consignacoes SET 
        status = 'ativo',
        observacao_interna = COALESCE(observacao_interna || ' | ', '') || ?,
        updated_at = ?
      WHERE id = ?
    `).bind(body.observacao || 'Entrega confirmada', now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO consignacoes_historico (
        id, consignacao_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'entrega', ?, 'ativo', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, consignacao.status,
      body.usuario_id || null, body.usuario_nome || null,
      'Entrega confirmada - Consignacao ativa', now
    ).run();

    return c.json({ success: true, message: 'Entrega confirmada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao confirmar entrega:', error);
    return c.json({ success: false, error: 'Erro ao confirmar entrega' }, 500);
  }
});

// =============================================
// ACERTO DE CONSIGNACAO
// =============================================

// POST /consignacoes/:id/acerto - Realizar acerto (parcial ou total)
consignacoes.post('/:id/acerto', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      tipo: 'parcial' | 'total';
      itens_vendidos?: Array<{
        consignacao_item_id: string;
        produto_id: string;
        produto_codigo?: string;
        produto_nome?: string;
        quantidade: number;
        valor_unitario: number;
      }>;
      itens_devolvidos?: Array<{
        consignacao_item_id: string;
        produto_id: string;
        produto_codigo?: string;
        produto_nome?: string;
        quantidade: number;
        valor_unitario: number;
        local_estoque_id?: string;
      }>;
      usuario_id?: string;
      usuario_nome?: string;
      observacao?: string;
    }>();

    if (!body.tipo) {
      return c.json({ success: false, error: 'Tipo de acerto e obrigatorio' }, 400);
    }

    const consignacao = await c.env.DB.prepare(`
      SELECT * FROM consignacoes WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!consignacao) {
      return c.json({ success: false, error: 'Consignacao nao encontrada' }, 404);
    }

    if (!['ativo', 'acerto_parcial', 'entregue'].includes(consignacao.status)) {
      return c.json({ success: false, error: 'Consignacao nao esta ativa para acerto' }, 400);
    }

    const now = new Date().toISOString();

    // Calcular valores
    let valorItensVendidos = 0;
    let valorItensDevolvidos = 0;

    if (body.itens_vendidos) {
      for (const item of body.itens_vendidos) {
        valorItensVendidos += item.quantidade * item.valor_unitario;
      }
    }

    if (body.itens_devolvidos) {
      for (const item of body.itens_devolvidos) {
        valorItensDevolvidos += item.quantidade * item.valor_unitario;
      }
    }

    // Gerar numero do acerto
    const countAcertos = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM consignacoes_acertos WHERE consignacao_id = ?
    `).bind(id).first<{ total: number }>();
    const numeroAcerto = `${consignacao.numero}-A${(countAcertos?.total || 0) + 1}`;

    // Criar acerto
    const acertoId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO consignacoes_acertos (
        id, consignacao_id, empresa_id, numero, tipo, data_acerto, status,
        valor_itens_vendidos, valor_itens_devolvidos, valor_financeiro_gerado,
        usuario_id, usuario_nome, observacao, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'processando', ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      acertoId, id, consignacao.empresa_id, numeroAcerto, body.tipo,
      now.split('T')[0], valorItensVendidos, valorItensDevolvidos, valorItensVendidos,
      body.usuario_id || null, body.usuario_nome || null, body.observacao || null, now, now
    ).run();

    // Processar itens vendidos
    if (body.itens_vendidos) {
      for (const item of body.itens_vendidos) {
        // Inserir item do acerto
        await c.env.DB.prepare(`
          INSERT INTO consignacoes_acertos_itens (
            id, acerto_id, consignacao_item_id, produto_id, produto_codigo, produto_nome,
            tipo, quantidade, unidade, valor_unitario, valor_total, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'vendido', ?, 'UN', ?, ?, ?)
        `).bind(
          crypto.randomUUID(), acertoId, item.consignacao_item_id, item.produto_id,
          item.produto_codigo || null, item.produto_nome || null,
          item.quantidade, item.valor_unitario, item.quantidade * item.valor_unitario, now
        ).run();

        // Atualizar item da consignacao
        await c.env.DB.prepare(`
          UPDATE consignacoes_itens SET 
            quantidade_vendida = quantidade_vendida + ?,
            quantidade_saldo = quantidade_saldo - ?,
            valor_total_vendido = valor_total_vendido + ?,
            updated_at = ?
          WHERE id = ?
        `).bind(
          item.quantidade, item.quantidade, item.quantidade * item.valor_unitario, now,
          item.consignacao_item_id
        ).run();

        // Atualizar estoque em consignacao
        await c.env.DB.prepare(`
          UPDATE estoque_consignacao SET 
            quantidade = quantidade - ?,
            status = CASE WHEN quantidade - ? <= 0 THEN 'vendido' ELSE status END,
            updated_at = ?
          WHERE consignacao_item_id = ?
        `).bind(item.quantidade, item.quantidade, now, item.consignacao_item_id).run();
      }
    }

    // Processar itens devolvidos
    if (body.itens_devolvidos) {
      for (const item of body.itens_devolvidos) {
        // Inserir item do acerto
        await c.env.DB.prepare(`
          INSERT INTO consignacoes_acertos_itens (
            id, acerto_id, consignacao_item_id, produto_id, produto_codigo, produto_nome,
            tipo, quantidade, unidade, valor_unitario, valor_total, 
            local_estoque_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'devolvido', ?, 'UN', ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(), acertoId, item.consignacao_item_id, item.produto_id,
          item.produto_codigo || null, item.produto_nome || null,
          item.quantidade, item.valor_unitario, item.quantidade * item.valor_unitario,
          item.local_estoque_id || null, now
        ).run();

        // Atualizar item da consignacao
        await c.env.DB.prepare(`
          UPDATE consignacoes_itens SET 
            quantidade_devolvida = quantidade_devolvida + ?,
            quantidade_saldo = quantidade_saldo - ?,
            valor_total_devolvido = valor_total_devolvido + ?,
            updated_at = ?
          WHERE id = ?
        `).bind(
          item.quantidade, item.quantidade, item.quantidade * item.valor_unitario, now,
          item.consignacao_item_id
        ).run();

        // Dar entrada no estoque proprio
        await c.env.DB.prepare(`
          INSERT INTO estoque_movimentacoes (
            id, empresa_id, produto_id, tipo, quantidade, 
            documento_tipo, documento_id, observacao, created_at
          ) VALUES (?, ?, ?, 'entrada', ?, 'acerto_consignacao', ?, ?, ?)
        `).bind(
          crypto.randomUUID(), consignacao.empresa_id, item.produto_id,
          item.quantidade, acertoId,
          `Retorno de consignacao ${consignacao.numero}`, now
        ).run();

        // Atualizar saldo do estoque
        await c.env.DB.prepare(`
          UPDATE estoque_saldos SET 
            quantidade = quantidade + ?,
            updated_at = ?
          WHERE empresa_id = ? AND produto_id = ?
        `).bind(item.quantidade, now, consignacao.empresa_id, item.produto_id).run();

        // Atualizar estoque em consignacao
        await c.env.DB.prepare(`
          UPDATE estoque_consignacao SET 
            quantidade = quantidade - ?,
            status = CASE WHEN quantidade - ? <= 0 THEN 'devolvido' ELSE status END,
            updated_at = ?
          WHERE consignacao_item_id = ?
        `).bind(item.quantidade, item.quantidade, now, item.consignacao_item_id).run();
      }
    }

    // Atualizar totais da consignacao
    const totaisItens = await c.env.DB.prepare(`
      SELECT 
        SUM(quantidade_vendida) as total_vendido,
        SUM(quantidade_devolvida) as total_devolvido,
        SUM(quantidade_saldo) as total_saldo,
        SUM(valor_total_vendido) as valor_vendido,
        SUM(valor_total_devolvido) as valor_devolvido
      FROM consignacoes_itens WHERE consignacao_id = ?
    `).bind(id).first<any>();

    const novoStatus = body.tipo === 'total' || (totaisItens?.total_saldo || 0) <= 0 
      ? 'acerto_total' 
      : 'acerto_parcial';

    await c.env.DB.prepare(`
      UPDATE consignacoes SET 
        status = ?,
        qtd_itens_vendidos = ?,
        qtd_itens_devolvidos = ?,
        qtd_itens_saldo = ?,
        valor_total_vendido = ?,
        valor_total_devolvido = ?,
        valor_saldo_consignado = valor_total_consignado - ? - ?,
        data_ultimo_acerto = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      novoStatus,
      totaisItens?.total_vendido || 0,
      totaisItens?.total_devolvido || 0,
      totaisItens?.total_saldo || 0,
      totaisItens?.valor_vendido || 0,
      totaisItens?.valor_devolvido || 0,
      totaisItens?.valor_vendido || 0, totaisItens?.valor_devolvido || 0,
      now.split('T')[0], now, id
    ).run();

    // Atualizar status do acerto
    await c.env.DB.prepare(`
      UPDATE consignacoes_acertos SET status = 'concluido', updated_at = ? WHERE id = ?
    `).bind(now, acertoId).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO consignacoes_historico (
        id, consignacao_id, acerto_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, ?, 'acerto', ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, acertoId, consignacao.status, novoStatus,
      body.usuario_id || null, body.usuario_nome || null,
      `Acerto ${body.tipo} realizado - Vendidos: ${valorItensVendidos}, Devolvidos: ${valorItensDevolvidos}`, now
    ).run();

    return c.json({
      success: true,
      data: { acerto_id: acertoId, numero: numeroAcerto, status: novoStatus },
      message: `Acerto ${body.tipo} realizado com sucesso`
    });
  } catch (error: any) {
    console.error('Erro ao realizar acerto:', error);
    return c.json({ success: false, error: 'Erro ao realizar acerto' }, 500);
  }
});

// =============================================
// ENCERRAMENTO E CANCELAMENTO
// =============================================

// POST /consignacoes/:id/encerrar - Encerrar consignacao
consignacoes.post('/:id/encerrar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      usuario_id?: string;
      usuario_nome?: string;
      observacao?: string;
    }>();

    const consignacao = await c.env.DB.prepare(`
      SELECT * FROM consignacoes WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!consignacao) {
      return c.json({ success: false, error: 'Consignacao nao encontrada' }, 404);
    }

    if (consignacao.status !== 'acerto_total') {
      return c.json({ success: false, error: 'Consignacao precisa ter acerto total para ser encerrada' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE consignacoes SET 
        status = 'encerrado',
        data_encerramento = ?,
        observacao_interna = COALESCE(observacao_interna || ' | ', '') || ?,
        updated_at = ?
      WHERE id = ?
    `).bind(now.split('T')[0], body.observacao || 'Consignacao encerrada', now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO consignacoes_historico (
        id, consignacao_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'encerramento', 'acerto_total', 'encerrado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id,
      body.usuario_id || null, body.usuario_nome || null,
      'Consignacao encerrada', now
    ).run();

    return c.json({ success: true, message: 'Consignacao encerrada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao encerrar consignacao:', error);
    return c.json({ success: false, error: 'Erro ao encerrar consignacao' }, 500);
  }
});

// POST /consignacoes/:id/cancelar - Cancelar consignacao
consignacoes.post('/:id/cancelar', async (c) => {
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

    const consignacao = await c.env.DB.prepare(`
      SELECT * FROM consignacoes WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!consignacao) {
      return c.json({ success: false, error: 'Consignacao nao encontrada' }, 404);
    }

    if (!['rascunho', 'emitido'].includes(consignacao.status)) {
      return c.json({ success: false, error: 'Apenas consignacoes em rascunho ou emitidas podem ser canceladas' }, 400);
    }

    const now = new Date().toISOString();

    // Se ja foi emitida, reverter estoque
    if (consignacao.status === 'emitido') {
      const itens = await c.env.DB.prepare(`
        SELECT * FROM consignacoes_itens WHERE consignacao_id = ?
      `).bind(id).all();

      for (const item of itens.results as any[]) {
        // Dar entrada no estoque proprio
        await c.env.DB.prepare(`
          INSERT INTO estoque_movimentacoes (
            id, empresa_id, produto_id, tipo, quantidade, 
            documento_tipo, documento_id, observacao, created_at
          ) VALUES (?, ?, ?, 'entrada', ?, 'cancelamento_consignacao', ?, ?, ?)
        `).bind(
          crypto.randomUUID(), consignacao.empresa_id, item.produto_id,
          item.quantidade_consignada, id,
          `Cancelamento de consignacao ${consignacao.numero}`, now
        ).run();

        // Atualizar saldo do estoque
        await c.env.DB.prepare(`
          UPDATE estoque_saldos SET 
            quantidade = quantidade + ?,
            updated_at = ?
          WHERE empresa_id = ? AND produto_id = ?
        `).bind(item.quantidade_consignada, now, consignacao.empresa_id, item.produto_id).run();

        // Remover do estoque em consignacao
        await c.env.DB.prepare(`
          DELETE FROM estoque_consignacao WHERE consignacao_item_id = ?
        `).bind(item.id).run();
      }
    }

    await c.env.DB.prepare(`
      UPDATE consignacoes SET 
        status = 'cancelado',
        observacao_interna = COALESCE(observacao_interna || ' | ', '') || ?,
        updated_at = ?
      WHERE id = ?
    `).bind(`Cancelado: ${body.motivo}`, now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO consignacoes_historico (
        id, consignacao_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'cancelamento', ?, 'cancelado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, consignacao.status,
      body.usuario_id || null, body.usuario_nome || null,
      `Consignacao cancelada: ${body.motivo}`, now
    ).run();

    return c.json({ success: true, message: 'Consignacao cancelada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao cancelar consignacao:', error);
    return c.json({ success: false, error: 'Erro ao cancelar consignacao' }, 500);
  }
});

// =============================================
// CONSULTAS E DASHBOARD
// =============================================

// GET /consignacoes/dashboard - Dashboard de consignacoes
consignacoes.get('/dashboard/resumo', async (c) => {
  const { empresa_id } = c.req.query();

  try {
    let where = "WHERE c.deleted_at IS NULL";
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND c.empresa_id = ?';
      params.push(empresa_id);
    }

    // Por status
    const porStatus = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as quantidade, SUM(valor_saldo_consignado) as valor_total
      FROM consignacoes c ${where}
      GROUP BY status
    `).bind(...params).all();

    // Ativas
    const ativas = await c.env.DB.prepare(`
      SELECT COUNT(*) as quantidade, SUM(valor_saldo_consignado) as valor_total
      FROM consignacoes c ${where} AND status IN ('ativo', 'acerto_parcial', 'entregue')
    `).bind(...params).first();

    // Vencendo em 7 dias
    const vencendo = await c.env.DB.prepare(`
      SELECT COUNT(*) as quantidade, SUM(valor_saldo_consignado) as valor_total
      FROM consignacoes c ${where} 
      AND status IN ('ativo', 'acerto_parcial', 'entregue')
      AND julianday(data_prazo_acerto) - julianday('now') <= 7
      AND julianday(data_prazo_acerto) >= julianday('now')
    `).bind(...params).first();

    // Vencidas
    const vencidas = await c.env.DB.prepare(`
      SELECT COUNT(*) as quantidade, SUM(valor_saldo_consignado) as valor_total
      FROM consignacoes c ${where} 
      AND status IN ('ativo', 'acerto_parcial', 'entregue')
      AND julianday('now') > julianday(data_prazo_acerto)
    `).bind(...params).first();

    // Top clientes com consignacao
    const topClientes = await c.env.DB.prepare(`
      SELECT c.cliente_id, cl.razao_social as cliente_nome,
        COUNT(*) as qtd_consignacoes,
        SUM(c.valor_saldo_consignado) as valor_total
      FROM consignacoes c
      JOIN clientes cl ON cl.id = c.cliente_id
      ${where} AND c.status IN ('ativo', 'acerto_parcial', 'entregue')
      GROUP BY c.cliente_id, cl.razao_social
      ORDER BY valor_total DESC
      LIMIT 10
    `).bind(...params).all();

    return c.json({
      success: true,
      data: {
        por_status: porStatus.results,
        ativas: ativas,
        vencendo_7_dias: vencendo,
        vencidas: vencidas,
        top_clientes: topClientes.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar dashboard:', error);
    return c.json({ success: false, error: 'Erro ao buscar dashboard' }, 500);
  }
});

// GET /consignacoes/estoque - Estoque em consignacao
consignacoes.get('/estoque/resumo', async (c) => {
  const { empresa_id, cliente_id, produto_id } = c.req.query();

  try {
    let where = "WHERE ec.status = 'ativo'";
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND ec.empresa_id = ?';
      params.push(empresa_id);
    }

    if (cliente_id) {
      where += ' AND ec.cliente_id = ?';
      params.push(cliente_id);
    }

    if (produto_id) {
      where += ' AND ec.produto_id = ?';
      params.push(produto_id);
    }

    const result = await c.env.DB.prepare(`
      SELECT 
        ec.produto_id,
        ec.produto_codigo,
        ec.produto_nome,
        ec.cliente_id,
        cl.razao_social as cliente_nome,
        SUM(ec.quantidade) as quantidade_total,
        SUM(ec.valor_total) as valor_total,
        MIN(ec.data_prazo) as menor_prazo
      FROM estoque_consignacao ec
      JOIN clientes cl ON cl.id = ec.cliente_id
      ${where}
      GROUP BY ec.produto_id, ec.produto_codigo, ec.produto_nome, ec.cliente_id, cl.razao_social
      ORDER BY ec.produto_nome
    `).bind(...params).all();

    return c.json({
      success: true,
      data: result.results
    });
  } catch (error: any) {
    console.error('Erro ao buscar estoque em consignacao:', error);
    return c.json({ success: false, error: 'Erro ao buscar estoque em consignacao' }, 500);
  }
});

export default consignacoes;
