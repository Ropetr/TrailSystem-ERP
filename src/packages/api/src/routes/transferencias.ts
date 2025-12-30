// =============================================
// TRAILSYSTEM ERP - Rotas de Transferencias entre Filiais
// Fluxo completo: solicitacao, aprovacao, emissao NF-e, recebimento
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const transferencias = new Hono<{ Bindings: Env }>();

// =============================================
// CRUD DE TRANSFERENCIAS
// =============================================

// GET /transferencias - Listar transferencias
transferencias.get('/', async (c) => {
  const { page = '1', limit = '20', status, filial_origem_id, filial_destino_id, empresa_id } = c.req.query();

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

    if (filial_origem_id) {
      where += ' AND t.filial_origem_id = ?';
      params.push(filial_origem_id);
    }

    if (filial_destino_id) {
      where += ' AND t.filial_destino_id = ?';
      params.push(filial_destino_id);
    }

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM transferencias_filiais t ${where}
    `).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await c.env.DB.prepare(`
      SELECT t.*,
        CAST(julianday('now') - julianday(t.data_solicitacao) AS INTEGER) as dias_desde_solicitacao
      FROM transferencias_filiais t
      ${where}
      ORDER BY t.urgente DESC, t.created_at DESC
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
    console.error('Erro ao listar transferencias:', error);
    return c.json({ success: false, error: 'Erro ao listar transferencias' }, 500);
  }
});

// GET /transferencias/:id - Buscar transferencia por ID
transferencias.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const transferencia = await c.env.DB.prepare(`
      SELECT * FROM transferencias_filiais WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!transferencia) {
      return c.json({ success: false, error: 'Transferencia nao encontrada' }, 404);
    }

    // Buscar itens
    const itens = await c.env.DB.prepare(`
      SELECT * FROM transferencias_filiais_itens WHERE transferencia_id = ?
    `).bind(id).all();

    // Buscar historico
    const historico = await c.env.DB.prepare(`
      SELECT * FROM transferencias_filiais_historico 
      WHERE transferencia_id = ? 
      ORDER BY created_at DESC
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...transferencia,
        itens: itens.results,
        historico: historico.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar transferencia:', error);
    return c.json({ success: false, error: 'Erro ao buscar transferencia' }, 500);
  }
});

// POST /transferencias - Criar solicitacao de transferencia
transferencias.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      filial_origem_id: string;
      filial_origem_nome?: string;
      filial_destino_id: string;
      filial_destino_nome?: string;
      motivo: string;
      motivo_descricao?: string;
      itens: Array<{
        produto_id: string;
        produto_codigo?: string;
        produto_nome?: string;
        quantidade_solicitada: number;
        unidade?: string;
        valor_unitario?: number;
        local_estoque_origem_id?: string;
        local_estoque_destino_id?: string;
      }>;
      urgente?: boolean;
      observacao?: string;
      empresa_id: string;
      solicitante_id?: string;
      solicitante_nome?: string;
    }>();

    if (!body.filial_origem_id || !body.filial_destino_id || !body.motivo || !body.itens || body.itens.length === 0) {
      return c.json({ success: false, error: 'Filiais origem/destino, motivo e itens sao obrigatorios' }, 400);
    }

    if (body.filial_origem_id === body.filial_destino_id) {
      return c.json({ success: false, error: 'Filial origem e destino devem ser diferentes' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const dataSolicitacao = now.split('T')[0];

    // Gerar numero da transferencia
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM transferencias_filiais WHERE empresa_id = ?
    `).bind(body.empresa_id).first<{ total: number }>();
    const numero = `TRF-${String((countResult?.total || 0) + 1).padStart(6, '0')}`;

    // Calcular totais
    let valorTotal = 0;
    let qtdItens = 0;
    for (const item of body.itens) {
      valorTotal += item.quantidade_solicitada * (item.valor_unitario || 0);
      qtdItens += item.quantidade_solicitada;
    }

    await c.env.DB.prepare(`
      INSERT INTO transferencias_filiais (
        id, empresa_id, numero, filial_origem_id, filial_origem_nome,
        filial_destino_id, filial_destino_nome, motivo, motivo_descricao,
        data_solicitacao, status, qtd_itens, valor_total, urgente, observacao,
        solicitante_id, solicitante_nome, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'solicitado', ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.empresa_id, numero,
      body.filial_origem_id, body.filial_origem_nome || null,
      body.filial_destino_id, body.filial_destino_nome || null,
      body.motivo, body.motivo_descricao || null,
      dataSolicitacao, qtdItens, valorTotal, body.urgente ? 1 : 0,
      body.observacao || null, body.solicitante_id || null, body.solicitante_nome || null, now, now
    ).run();

    // Inserir itens
    for (const item of body.itens) {
      // Verificar estoque disponivel na origem
      const estoqueOrigem = await c.env.DB.prepare(`
        SELECT quantidade FROM estoque_saldos 
        WHERE empresa_id = ? AND produto_id = ? AND filial_id = ?
      `).bind(body.empresa_id, item.produto_id, body.filial_origem_id).first<{ quantidade: number }>();

      await c.env.DB.prepare(`
        INSERT INTO transferencias_filiais_itens (
          id, transferencia_id, produto_id, produto_codigo, produto_nome,
          quantidade_solicitada, unidade, valor_unitario, valor_total,
          estoque_disponivel_origem, local_estoque_origem_id, local_estoque_destino_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, item.produto_id,
        item.produto_codigo || null, item.produto_nome || null,
        item.quantidade_solicitada, item.unidade || 'UN',
        item.valor_unitario || 0, item.quantidade_solicitada * (item.valor_unitario || 0),
        estoqueOrigem?.quantidade || 0,
        item.local_estoque_origem_id || null, item.local_estoque_destino_id || null,
        now, now
      ).run();
    }

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO transferencias_filiais_historico (
        id, transferencia_id, acao, status_novo, usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'criacao', 'solicitado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id,
      body.solicitante_id || null, body.solicitante_nome || null,
      `Solicitacao de transferencia criada - ${body.itens.length} itens`, now
    ).run();

    return c.json({
      success: true,
      data: { id, numero },
      message: 'Solicitacao de transferencia criada com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar transferencia:', error);
    return c.json({ success: false, error: 'Erro ao criar transferencia' }, 500);
  }
});

// =============================================
// WORKFLOW - APROVACAO
// =============================================

// POST /transferencias/:id/aprovar - Aprovar transferencia
transferencias.post('/:id/aprovar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      itens_aprovados?: Array<{
        item_id: string;
        quantidade_aprovada: number;
      }>;
      usuario_id?: string;
      usuario_nome?: string;
      observacao?: string;
    }>();

    const transferencia = await c.env.DB.prepare(`
      SELECT * FROM transferencias_filiais WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!transferencia) {
      return c.json({ success: false, error: 'Transferencia nao encontrada' }, 404);
    }

    if (transferencia.status !== 'solicitado' && transferencia.status !== 'aguardando_aprovacao') {
      return c.json({ success: false, error: 'Transferencia nao esta aguardando aprovacao' }, 400);
    }

    const now = new Date().toISOString();

    // Se foram especificados itens aprovados, atualizar quantidades
    if (body.itens_aprovados && body.itens_aprovados.length > 0) {
      for (const item of body.itens_aprovados) {
        await c.env.DB.prepare(`
          UPDATE transferencias_filiais_itens SET 
            quantidade_aprovada = ?,
            updated_at = ?
          WHERE id = ?
        `).bind(item.quantidade_aprovada, now, item.item_id).run();
      }
    } else {
      // Aprovar todas as quantidades solicitadas
      await c.env.DB.prepare(`
        UPDATE transferencias_filiais_itens SET 
          quantidade_aprovada = quantidade_solicitada,
          updated_at = ?
        WHERE transferencia_id = ?
      `).bind(now, id).run();
    }

    await c.env.DB.prepare(`
      UPDATE transferencias_filiais SET 
        status = 'aprovado',
        data_aprovacao = ?,
        aprovador_id = ?,
        aprovador_nome = ?,
        observacao_interna = COALESCE(observacao_interna || ' | ', '') || ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      now.split('T')[0], body.usuario_id || null, body.usuario_nome || null,
      body.observacao || 'Aprovado', now, id
    ).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO transferencias_filiais_historico (
        id, transferencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'aprovacao', ?, 'aprovado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, transferencia.status,
      body.usuario_id || null, body.usuario_nome || null,
      'Transferencia aprovada', now
    ).run();

    return c.json({ success: true, message: 'Transferencia aprovada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao aprovar transferencia:', error);
    return c.json({ success: false, error: 'Erro ao aprovar transferencia' }, 500);
  }
});

// POST /transferencias/:id/reprovar - Reprovar transferencia
transferencias.post('/:id/reprovar', async (c) => {
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

    const transferencia = await c.env.DB.prepare(`
      SELECT * FROM transferencias_filiais WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!transferencia) {
      return c.json({ success: false, error: 'Transferencia nao encontrada' }, 404);
    }

    if (transferencia.status !== 'solicitado' && transferencia.status !== 'aguardando_aprovacao') {
      return c.json({ success: false, error: 'Transferencia nao esta aguardando aprovacao' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE transferencias_filiais SET 
        status = 'reprovado',
        aprovador_id = ?,
        aprovador_nome = ?,
        motivo_reprovacao = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(body.usuario_id || null, body.usuario_nome || null, body.motivo, now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO transferencias_filiais_historico (
        id, transferencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'reprovacao', ?, 'reprovado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, transferencia.status,
      body.usuario_id || null, body.usuario_nome || null,
      `Transferencia reprovada: ${body.motivo}`, now
    ).run();

    return c.json({ success: true, message: 'Transferencia reprovada' });
  } catch (error: any) {
    console.error('Erro ao reprovar transferencia:', error);
    return c.json({ success: false, error: 'Erro ao reprovar transferencia' }, 500);
  }
});

// =============================================
// WORKFLOW - EMISSAO NF-e
// =============================================

// POST /transferencias/:id/emitir-nfe - Emitir NF-e de transferencia
transferencias.post('/:id/emitir-nfe', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      nfe_numero?: string;
      nfe_chave?: string;
      nfe_cfop?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const transferencia = await c.env.DB.prepare(`
      SELECT * FROM transferencias_filiais WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!transferencia) {
      return c.json({ success: false, error: 'Transferencia nao encontrada' }, 404);
    }

    if (transferencia.status !== 'aprovado') {
      return c.json({ success: false, error: 'Transferencia nao esta aprovada' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE transferencias_filiais SET 
        status = 'nfe_emitida',
        data_emissao_nfe = ?,
        nfe_numero = ?,
        nfe_chave = ?,
        nfe_cfop = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      now.split('T')[0], body.nfe_numero || null, body.nfe_chave || null,
      body.nfe_cfop || '5.152', now, id
    ).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO transferencias_filiais_historico (
        id, transferencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'emissao_nfe', 'aprovado', 'nfe_emitida', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id,
      body.usuario_id || null, body.usuario_nome || null,
      `NF-e emitida${body.nfe_numero ? ` - Numero: ${body.nfe_numero}` : ''}`, now
    ).run();

    return c.json({ success: true, message: 'NF-e emitida com sucesso' });
  } catch (error: any) {
    console.error('Erro ao emitir NF-e:', error);
    return c.json({ success: false, error: 'Erro ao emitir NF-e' }, 500);
  }
});

// =============================================
// WORKFLOW - SEPARACAO E DESPACHO
// =============================================

// POST /transferencias/:id/iniciar-separacao - Iniciar separacao
transferencias.post('/:id/iniciar-separacao', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const transferencia = await c.env.DB.prepare(`
      SELECT * FROM transferencias_filiais WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!transferencia) {
      return c.json({ success: false, error: 'Transferencia nao encontrada' }, 404);
    }

    if (transferencia.status !== 'nfe_emitida' && transferencia.status !== 'aprovado') {
      return c.json({ success: false, error: 'Transferencia nao esta pronta para separacao' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE transferencias_filiais SET status = 'em_separacao', updated_at = ? WHERE id = ?
    `).bind(now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO transferencias_filiais_historico (
        id, transferencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'inicio_separacao', ?, 'em_separacao', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, transferencia.status,
      body.usuario_id || null, body.usuario_nome || null,
      'Separacao iniciada', now
    ).run();

    return c.json({ success: true, message: 'Separacao iniciada' });
  } catch (error: any) {
    console.error('Erro ao iniciar separacao:', error);
    return c.json({ success: false, error: 'Erro ao iniciar separacao' }, 500);
  }
});

// POST /transferencias/:id/despachar - Despachar mercadoria
transferencias.post('/:id/despachar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      transportadora_nome?: string;
      veiculo_placa?: string;
      motorista_nome?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const transferencia = await c.env.DB.prepare(`
      SELECT * FROM transferencias_filiais WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!transferencia) {
      return c.json({ success: false, error: 'Transferencia nao encontrada' }, 404);
    }

    if (transferencia.status !== 'em_separacao' && transferencia.status !== 'nfe_emitida') {
      return c.json({ success: false, error: 'Transferencia nao esta pronta para despacho' }, 400);
    }

    const now = new Date().toISOString();

    // Buscar itens para dar saida no estoque
    const itens = await c.env.DB.prepare(`
      SELECT * FROM transferencias_filiais_itens WHERE transferencia_id = ?
    `).bind(id).all();

    // Dar saida no estoque da filial origem
    for (const item of itens.results as any[]) {
      const qtdEnviar = item.quantidade_aprovada || item.quantidade_solicitada;

      // Registrar movimentacao de saida
      await c.env.DB.prepare(`
        INSERT INTO estoque_movimentacoes (
          id, empresa_id, produto_id, tipo, quantidade, 
          documento_tipo, documento_id, observacao, created_at
        ) VALUES (?, ?, ?, 'saida', ?, 'transferencia', ?, ?, ?)
      `).bind(
        crypto.randomUUID(), transferencia.empresa_id, item.produto_id,
        qtdEnviar, id,
        `Transferencia ${transferencia.numero} para ${transferencia.filial_destino_nome}`, now
      ).run();

      // Atualizar saldo do estoque na origem
      await c.env.DB.prepare(`
        UPDATE estoque_saldos SET 
          quantidade = quantidade - ?,
          updated_at = ?
        WHERE empresa_id = ? AND produto_id = ? AND filial_id = ?
      `).bind(qtdEnviar, now, transferencia.empresa_id, item.produto_id, transferencia.filial_origem_id).run();

      // Atualizar quantidade enviada no item
      await c.env.DB.prepare(`
        UPDATE transferencias_filiais_itens SET quantidade_enviada = ?, updated_at = ? WHERE id = ?
      `).bind(qtdEnviar, now, item.id).run();
    }

    await c.env.DB.prepare(`
      UPDATE transferencias_filiais SET 
        status = 'despachado',
        data_despacho = ?,
        transportadora_nome = ?,
        veiculo_placa = ?,
        motorista_nome = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      now.split('T')[0], body.transportadora_nome || null,
      body.veiculo_placa || null, body.motorista_nome || null, now, id
    ).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO transferencias_filiais_historico (
        id, transferencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'despacho', ?, 'despachado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, transferencia.status,
      body.usuario_id || null, body.usuario_nome || null,
      `Mercadoria despachada${body.transportadora_nome ? ` - Transportadora: ${body.transportadora_nome}` : ''}`, now
    ).run();

    return c.json({ success: true, message: 'Mercadoria despachada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao despachar:', error);
    return c.json({ success: false, error: 'Erro ao despachar' }, 500);
  }
});

// =============================================
// WORKFLOW - RECEBIMENTO
// =============================================

// POST /transferencias/:id/receber - Registrar recebimento na filial destino
transferencias.post('/:id/receber', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const transferencia = await c.env.DB.prepare(`
      SELECT * FROM transferencias_filiais WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!transferencia) {
      return c.json({ success: false, error: 'Transferencia nao encontrada' }, 404);
    }

    if (transferencia.status !== 'despachado' && transferencia.status !== 'em_transito') {
      return c.json({ success: false, error: 'Transferencia nao esta em transito' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE transferencias_filiais SET 
        status = 'recebido',
        data_recebimento = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(now.split('T')[0], now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO transferencias_filiais_historico (
        id, transferencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'recebimento', ?, 'recebido', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, transferencia.status,
      body.usuario_id || null, body.usuario_nome || null,
      'Mercadoria recebida na filial destino', now
    ).run();

    return c.json({ success: true, message: 'Recebimento registrado' });
  } catch (error: any) {
    console.error('Erro ao registrar recebimento:', error);
    return c.json({ success: false, error: 'Erro ao registrar recebimento' }, 500);
  }
});

// POST /transferencias/:id/conferir - Conferir itens recebidos
transferencias.post('/:id/conferir', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      itens_conferidos: Array<{
        item_id: string;
        quantidade_recebida: number;
        observacao?: string;
      }>;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    if (!body.itens_conferidos || body.itens_conferidos.length === 0) {
      return c.json({ success: false, error: 'Itens conferidos sao obrigatorios' }, 400);
    }

    const transferencia = await c.env.DB.prepare(`
      SELECT * FROM transferencias_filiais WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!transferencia) {
      return c.json({ success: false, error: 'Transferencia nao encontrada' }, 404);
    }

    if (transferencia.status !== 'recebido') {
      return c.json({ success: false, error: 'Transferencia nao esta pronta para conferencia' }, 400);
    }

    const now = new Date().toISOString();
    let temDivergencia = false;
    let qtdConferidos = 0;

    for (const item of body.itens_conferidos) {
      const itemDb = await c.env.DB.prepare(`
        SELECT * FROM transferencias_filiais_itens WHERE id = ?
      `).bind(item.item_id).first<any>();

      if (!itemDb) continue;

      const qtdEnviada = itemDb.quantidade_enviada || itemDb.quantidade_aprovada || itemDb.quantidade_solicitada;
      const divergencia = item.quantidade_recebida - qtdEnviada;

      if (divergencia !== 0) {
        temDivergencia = true;
      }

      await c.env.DB.prepare(`
        UPDATE transferencias_filiais_itens SET 
          quantidade_recebida = ?,
          quantidade_divergencia = ?,
          conferido = 1,
          conferido_por_id = ?,
          conferido_por_nome = ?,
          conferido_em = ?,
          observacao_conferencia = ?,
          updated_at = ?
        WHERE id = ?
      `).bind(
        item.quantidade_recebida, divergencia,
        body.usuario_id || null, body.usuario_nome || null, now,
        item.observacao || null, now, item.item_id
      ).run();

      // Dar entrada no estoque da filial destino
      if (item.quantidade_recebida > 0) {
        await c.env.DB.prepare(`
          INSERT INTO estoque_movimentacoes (
            id, empresa_id, produto_id, tipo, quantidade, 
            documento_tipo, documento_id, observacao, created_at
          ) VALUES (?, ?, ?, 'entrada', ?, 'transferencia', ?, ?, ?)
        `).bind(
          crypto.randomUUID(), transferencia.empresa_id, itemDb.produto_id,
          item.quantidade_recebida, id,
          `Transferencia ${transferencia.numero} de ${transferencia.filial_origem_nome}`, now
        ).run();

        // Atualizar ou criar saldo do estoque no destino
        const estoqueDestino = await c.env.DB.prepare(`
          SELECT id FROM estoque_saldos 
          WHERE empresa_id = ? AND produto_id = ? AND filial_id = ?
        `).bind(transferencia.empresa_id, itemDb.produto_id, transferencia.filial_destino_id).first();

        if (estoqueDestino) {
          await c.env.DB.prepare(`
            UPDATE estoque_saldos SET 
              quantidade = quantidade + ?,
              updated_at = ?
            WHERE empresa_id = ? AND produto_id = ? AND filial_id = ?
          `).bind(item.quantidade_recebida, now, transferencia.empresa_id, itemDb.produto_id, transferencia.filial_destino_id).run();
        } else {
          await c.env.DB.prepare(`
            INSERT INTO estoque_saldos (id, empresa_id, produto_id, filial_id, quantidade, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            crypto.randomUUID(), transferencia.empresa_id, itemDb.produto_id,
            transferencia.filial_destino_id, item.quantidade_recebida, now, now
          ).run();
        }
      }

      qtdConferidos++;
    }

    const novoStatus = temDivergencia ? 'divergencia' : 'conferido';

    await c.env.DB.prepare(`
      UPDATE transferencias_filiais SET 
        status = ?,
        qtd_itens_conferidos = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(novoStatus, qtdConferidos, now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO transferencias_filiais_historico (
        id, transferencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'conferencia', 'recebido', ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, novoStatus,
      body.usuario_id || null, body.usuario_nome || null,
      temDivergencia ? 'Conferencia com divergencias' : 'Conferencia OK', now
    ).run();

    return c.json({
      success: true,
      data: { status: novoStatus, tem_divergencia: temDivergencia },
      message: temDivergencia ? 'Conferencia com divergencias' : 'Conferencia concluida'
    });
  } catch (error: any) {
    console.error('Erro ao conferir:', error);
    return c.json({ success: false, error: 'Erro ao conferir' }, 500);
  }
});

// POST /transferencias/:id/concluir - Concluir transferencia
transferencias.post('/:id/concluir', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      nfe_entrada_numero?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const transferencia = await c.env.DB.prepare(`
      SELECT * FROM transferencias_filiais WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!transferencia) {
      return c.json({ success: false, error: 'Transferencia nao encontrada' }, 404);
    }

    if (transferencia.status !== 'conferido' && transferencia.status !== 'divergencia') {
      return c.json({ success: false, error: 'Transferencia nao esta pronta para conclusao' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE transferencias_filiais SET 
        status = 'concluido',
        nfe_entrada_numero = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(body.nfe_entrada_numero || null, now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO transferencias_filiais_historico (
        id, transferencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'conclusao', ?, 'concluido', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, transferencia.status,
      body.usuario_id || null, body.usuario_nome || null,
      'Transferencia concluida', now
    ).run();

    return c.json({ success: true, message: 'Transferencia concluida com sucesso' });
  } catch (error: any) {
    console.error('Erro ao concluir transferencia:', error);
    return c.json({ success: false, error: 'Erro ao concluir transferencia' }, 500);
  }
});

// POST /transferencias/:id/cancelar - Cancelar transferencia
transferencias.post('/:id/cancelar', async (c) => {
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

    const transferencia = await c.env.DB.prepare(`
      SELECT * FROM transferencias_filiais WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!transferencia) {
      return c.json({ success: false, error: 'Transferencia nao encontrada' }, 404);
    }

    if (['concluido', 'cancelado'].includes(transferencia.status)) {
      return c.json({ success: false, error: 'Transferencia ja foi finalizada' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE transferencias_filiais SET 
        status = 'cancelado',
        observacao_interna = COALESCE(observacao_interna || ' | ', '') || ?,
        updated_at = ?
      WHERE id = ?
    `).bind(`Cancelado: ${body.motivo}`, now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO transferencias_filiais_historico (
        id, transferencia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'cancelamento', ?, 'cancelado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, transferencia.status,
      body.usuario_id || null, body.usuario_nome || null,
      `Transferencia cancelada: ${body.motivo}`, now
    ).run();

    return c.json({ success: true, message: 'Transferencia cancelada' });
  } catch (error: any) {
    console.error('Erro ao cancelar transferencia:', error);
    return c.json({ success: false, error: 'Erro ao cancelar transferencia' }, 500);
  }
});

// =============================================
// DASHBOARD
// =============================================

// GET /transferencias/dashboard/resumo - Dashboard de transferencias
transferencias.get('/dashboard/resumo', async (c) => {
  const { empresa_id, filial_id } = c.req.query();

  try {
    let where = "WHERE t.deleted_at IS NULL";
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND t.empresa_id = ?';
      params.push(empresa_id);
    }

    if (filial_id) {
      where += ' AND (t.filial_origem_id = ? OR t.filial_destino_id = ?)';
      params.push(filial_id, filial_id);
    }

    // Por status
    const porStatus = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as quantidade, SUM(valor_total) as valor_total
      FROM transferencias_filiais t ${where}
      GROUP BY status
    `).bind(...params).all();

    // Pendentes
    const pendentes = await c.env.DB.prepare(`
      SELECT COUNT(*) as quantidade, SUM(valor_total) as valor_total
      FROM transferencias_filiais t ${where} 
      AND status IN ('solicitado', 'aguardando_aprovacao', 'aprovado', 'em_separacao')
    `).bind(...params).first();

    // Em transito
    const emTransito = await c.env.DB.prepare(`
      SELECT COUNT(*) as quantidade, SUM(valor_total) as valor_total
      FROM transferencias_filiais t ${where} 
      AND status IN ('despachado', 'em_transito')
    `).bind(...params).first();

    // Concluidas este mes
    const concluidasMes = await c.env.DB.prepare(`
      SELECT COUNT(*) as quantidade, SUM(valor_total) as valor_total
      FROM transferencias_filiais t ${where} 
      AND status = 'concluido'
      AND strftime('%Y-%m', data_recebimento) = strftime('%Y-%m', 'now')
    `).bind(...params).first();

    return c.json({
      success: true,
      data: {
        por_status: porStatus.results,
        pendentes: pendentes,
        em_transito: emTransito,
        concluidas_mes: concluidasMes
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar dashboard:', error);
    return c.json({ success: false, error: 'Erro ao buscar dashboard' }, 500);
  }
});

export default transferencias;
