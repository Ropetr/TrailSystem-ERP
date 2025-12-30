// =============================================
// TRAILSYSTEM ERP - Rotas de Garantias
// Fluxo completo: abertura, analise, resolucao, fechamento
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const garantias = new Hono<{ Bindings: Env }>();

// =============================================
// CRUD DE GARANTIAS
// =============================================

// GET /garantias - Listar chamados de garantia
garantias.get('/', async (c) => {
  const { page = '1', limit = '20', status, cliente_id, produto_id, empresa_id, prioridade } = c.req.query();

  try {
    let where = 'WHERE g.deleted_at IS NULL';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND g.empresa_id = ?';
      params.push(empresa_id);
    }

    if (status) {
      where += ' AND g.status = ?';
      params.push(status);
    }

    if (cliente_id) {
      where += ' AND g.cliente_id = ?';
      params.push(cliente_id);
    }

    if (produto_id) {
      where += ' AND g.produto_id = ?';
      params.push(produto_id);
    }

    if (prioridade) {
      where += ' AND g.prioridade = ?';
      params.push(prioridade);
    }

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM garantias g ${where}
    `).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await c.env.DB.prepare(`
      SELECT g.*, 
        CAST(julianday('now') - julianday(g.data_abertura) AS INTEGER) as dias_aberto
      FROM garantias g
      ${where}
      ORDER BY 
        CASE g.prioridade 
          WHEN 'urgente' THEN 1 
          WHEN 'alta' THEN 2 
          WHEN 'normal' THEN 3 
          ELSE 4 
        END,
        g.created_at DESC
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
    console.error('Erro ao listar garantias:', error);
    return c.json({ success: false, error: 'Erro ao listar garantias' }, 500);
  }
});

// GET /garantias/:id - Buscar chamado por ID
garantias.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const garantia = await c.env.DB.prepare(`
      SELECT g.*,
        CAST(julianday('now') - julianday(g.data_abertura) AS INTEGER) as dias_aberto
      FROM garantias g
      WHERE g.id = ? AND g.deleted_at IS NULL
    `).bind(id).first();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado de garantia nao encontrado' }, 404);
    }

    // Buscar anexos
    const anexos = await c.env.DB.prepare(`
      SELECT * FROM garantias_anexos WHERE garantia_id = ? ORDER BY created_at DESC
    `).bind(id).all();

    // Buscar interacoes
    const interacoes = await c.env.DB.prepare(`
      SELECT * FROM garantias_interacoes WHERE garantia_id = ? ORDER BY created_at DESC
    `).bind(id).all();

    // Buscar historico
    const historico = await c.env.DB.prepare(`
      SELECT * FROM garantias_historico WHERE garantia_id = ? ORDER BY created_at DESC
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...garantia,
        anexos: anexos.results,
        interacoes: interacoes.results,
        historico: historico.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar garantia:', error);
    return c.json({ success: false, error: 'Erro ao buscar garantia' }, 500);
  }
});

// POST /garantias - Abrir chamado de garantia
garantias.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      cliente_id?: string;
      cliente_nome?: string;
      cliente_documento?: string;
      cliente_telefone?: string;
      cliente_email?: string;
      produto_id?: string;
      produto_codigo?: string;
      produto_nome?: string;
      numero_serie?: string;
      nfe_origem_numero?: string;
      nfe_origem_chave?: string;
      data_compra?: string;
      descricao_defeito: string;
      fotos_urls?: string;
      prioridade?: string;
      empresa_id: string;
      criado_por_id?: string;
      criado_por_nome?: string;
    }>();

    if (!body.descricao_defeito || !body.empresa_id) {
      return c.json({ success: false, error: 'Descricao do defeito e empresa sao obrigatorios' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const dataAbertura = now.split('T')[0];

    // Gerar numero do chamado
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM garantias WHERE empresa_id = ?
    `).bind(body.empresa_id).first<{ total: number }>();
    const numero = `GAR-${String((countResult?.total || 0) + 1).padStart(6, '0')}`;

    // Buscar configuracao de garantia
    const config = await c.env.DB.prepare(`
      SELECT prazo_garantia_padrao_meses FROM config_garantia WHERE empresa_id = ?
    `).bind(body.empresa_id).first<any>();

    const prazoGarantiaMeses = config?.prazo_garantia_padrao_meses || 12;

    // Verificar se produto tem garantia especifica
    let prazoFinal = prazoGarantiaMeses;
    if (body.produto_id) {
      const produtoGarantia = await c.env.DB.prepare(`
        SELECT prazo_garantia_meses FROM produtos_garantia 
        WHERE empresa_id = ? AND produto_id = ?
      `).bind(body.empresa_id, body.produto_id).first<any>();
      
      if (produtoGarantia) {
        prazoFinal = produtoGarantia.prazo_garantia_meses;
      }
    }

    // Calcular data fim garantia se tiver data de compra
    let dataFimGarantia = null;
    let garantiaValida = 0;
    if (body.data_compra) {
      const dataCompra = new Date(body.data_compra);
      dataCompra.setMonth(dataCompra.getMonth() + prazoFinal);
      dataFimGarantia = dataCompra.toISOString().split('T')[0];
      garantiaValida = new Date(dataFimGarantia) >= new Date() ? 1 : 0;
    }

    // Determinar status inicial
    let statusInicial = 'aberto';
    if (!body.nfe_origem_numero && !body.numero_serie) {
      statusInicial = 'aguardando_documentacao';
    }

    await c.env.DB.prepare(`
      INSERT INTO garantias (
        id, empresa_id, numero, cliente_id, cliente_nome, cliente_documento,
        cliente_telefone, cliente_email, produto_id, produto_codigo, produto_nome,
        numero_serie, nfe_origem_numero, nfe_origem_chave, data_compra,
        prazo_garantia_meses, data_fim_garantia, garantia_valida,
        data_abertura, descricao_defeito, fotos_urls, status, prioridade,
        criado_por_id, criado_por_nome, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.empresa_id, numero,
      body.cliente_id || null, body.cliente_nome || null, body.cliente_documento || null,
      body.cliente_telefone || null, body.cliente_email || null,
      body.produto_id || null, body.produto_codigo || null, body.produto_nome || null,
      body.numero_serie || null, body.nfe_origem_numero || null, body.nfe_origem_chave || null,
      body.data_compra || null, prazoFinal, dataFimGarantia, garantiaValida,
      dataAbertura, body.descricao_defeito, body.fotos_urls || null,
      statusInicial, body.prioridade || 'normal',
      body.criado_por_id || null, body.criado_por_nome || null, now, now
    ).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO garantias_historico (
        id, garantia_id, acao, status_novo, usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'abertura', ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, statusInicial,
      body.criado_por_id || null, body.criado_por_nome || null,
      `Chamado de garantia aberto: ${body.descricao_defeito.substring(0, 100)}`, now
    ).run();

    return c.json({
      success: true,
      data: { id, numero, status: statusInicial, garantia_valida: garantiaValida },
      message: 'Chamado de garantia aberto com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao abrir chamado de garantia:', error);
    return c.json({ success: false, error: 'Erro ao abrir chamado de garantia' }, 500);
  }
});

// PUT /garantias/:id - Atualizar chamado
garantias.put('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      cliente_nome?: string;
      cliente_telefone?: string;
      cliente_email?: string;
      numero_serie?: string;
      nfe_origem_numero?: string;
      data_compra?: string;
      descricao_defeito?: string;
      prioridade?: string;
      observacao_interna?: string;
    }>();

    const garantia = await c.env.DB.prepare(`
      SELECT * FROM garantias WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado nao encontrado' }, 404);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE garantias SET 
        cliente_nome = COALESCE(?, cliente_nome),
        cliente_telefone = COALESCE(?, cliente_telefone),
        cliente_email = COALESCE(?, cliente_email),
        numero_serie = COALESCE(?, numero_serie),
        nfe_origem_numero = COALESCE(?, nfe_origem_numero),
        data_compra = COALESCE(?, data_compra),
        descricao_defeito = COALESCE(?, descricao_defeito),
        prioridade = COALESCE(?, prioridade),
        observacao_interna = COALESCE(?, observacao_interna),
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.cliente_nome || null, body.cliente_telefone || null, body.cliente_email || null,
      body.numero_serie || null, body.nfe_origem_numero || null, body.data_compra || null,
      body.descricao_defeito || null, body.prioridade || null, body.observacao_interna || null,
      now, id
    ).run();

    return c.json({ success: true, message: 'Chamado atualizado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao atualizar chamado:', error);
    return c.json({ success: false, error: 'Erro ao atualizar chamado' }, 500);
  }
});

// =============================================
// WORKFLOW - VERIFICACAO DE GARANTIA
// =============================================

// POST /garantias/:id/verificar-garantia - Verificar se produto esta na garantia
garantias.post('/:id/verificar-garantia', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      nfe_origem_numero?: string;
      nfe_origem_chave?: string;
      data_compra?: string;
      numero_serie?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const garantia = await c.env.DB.prepare(`
      SELECT * FROM garantias WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado nao encontrado' }, 404);
    }

    const now = new Date().toISOString();
    const dataCompra = body.data_compra || garantia.data_compra;

    if (!dataCompra) {
      return c.json({ success: false, error: 'Data de compra e obrigatoria para verificar garantia' }, 400);
    }

    // Calcular data fim garantia
    const dataCompraDate = new Date(dataCompra);
    dataCompraDate.setMonth(dataCompraDate.getMonth() + garantia.prazo_garantia_meses);
    const dataFimGarantia = dataCompraDate.toISOString().split('T')[0];
    const garantiaValida = new Date(dataFimGarantia) >= new Date() ? 1 : 0;

    let novoStatus = garantia.status;
    if (!garantiaValida) {
      novoStatus = 'garantia_expirada';
    } else if (garantia.status === 'aguardando_documentacao') {
      novoStatus = 'aberto';
    }

    await c.env.DB.prepare(`
      UPDATE garantias SET 
        nfe_origem_numero = COALESCE(?, nfe_origem_numero),
        nfe_origem_chave = COALESCE(?, nfe_origem_chave),
        data_compra = ?,
        numero_serie = COALESCE(?, numero_serie),
        data_fim_garantia = ?,
        garantia_valida = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.nfe_origem_numero || null, body.nfe_origem_chave || null,
      dataCompra, body.numero_serie || null,
      dataFimGarantia, garantiaValida, novoStatus, now, id
    ).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO garantias_historico (
        id, garantia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'verificacao_garantia', ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, garantia.status, novoStatus,
      body.usuario_id || null, body.usuario_nome || null,
      garantiaValida ? `Garantia valida ate ${dataFimGarantia}` : 'Garantia expirada', now
    ).run();

    return c.json({
      success: true,
      data: {
        garantia_valida: garantiaValida === 1,
        data_fim_garantia: dataFimGarantia,
        status: novoStatus
      },
      message: garantiaValida ? 'Produto dentro da garantia' : 'Garantia expirada'
    });
  } catch (error: any) {
    console.error('Erro ao verificar garantia:', error);
    return c.json({ success: false, error: 'Erro ao verificar garantia' }, 500);
  }
});

// =============================================
// WORKFLOW - ANALISE TECNICA
// =============================================

// POST /garantias/:id/enviar-analise - Enviar para analise tecnica
garantias.post('/:id/enviar-analise', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      tecnico_id?: string;
      tecnico_nome?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const garantia = await c.env.DB.prepare(`
      SELECT * FROM garantias WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado nao encontrado' }, 404);
    }

    if (!garantia.garantia_valida) {
      return c.json({ success: false, error: 'Garantia expirada ou nao verificada' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE garantias SET 
        status = 'em_analise',
        tecnico_id = ?,
        tecnico_nome = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(body.tecnico_id || null, body.tecnico_nome || null, now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO garantias_historico (
        id, garantia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'envio_analise', ?, 'em_analise', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, garantia.status,
      body.usuario_id || null, body.usuario_nome || null,
      `Enviado para analise tecnica${body.tecnico_nome ? ` - Tecnico: ${body.tecnico_nome}` : ''}`, now
    ).run();

    return c.json({ success: true, message: 'Chamado enviado para analise tecnica' });
  } catch (error: any) {
    console.error('Erro ao enviar para analise:', error);
    return c.json({ success: false, error: 'Erro ao enviar para analise' }, 500);
  }
});

// POST /garantias/:id/registrar-analise - Registrar resultado da analise tecnica
garantias.post('/:id/registrar-analise', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      defeito_confirmado: boolean;
      parecer_tecnico: string;
      motivo_negacao?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    if (body.defeito_confirmado === undefined || !body.parecer_tecnico) {
      return c.json({ success: false, error: 'Parecer tecnico e confirmacao de defeito sao obrigatorios' }, 400);
    }

    const garantia = await c.env.DB.prepare(`
      SELECT * FROM garantias WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado nao encontrado' }, 404);
    }

    if (garantia.status !== 'em_analise') {
      return c.json({ success: false, error: 'Chamado nao esta em analise' }, 400);
    }

    const now = new Date().toISOString();
    const novoStatus = body.defeito_confirmado ? 'defeito_confirmado' : 'garantia_negada';

    await c.env.DB.prepare(`
      UPDATE garantias SET 
        status = ?,
        data_analise = ?,
        parecer_tecnico = ?,
        defeito_confirmado = ?,
        motivo_negacao = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      novoStatus, now.split('T')[0], body.parecer_tecnico,
      body.defeito_confirmado ? 1 : 0, body.motivo_negacao || null, now, id
    ).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO garantias_historico (
        id, garantia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'analise_tecnica', 'em_analise', ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, novoStatus,
      body.usuario_id || null, body.usuario_nome || null,
      body.defeito_confirmado 
        ? `Defeito confirmado: ${body.parecer_tecnico.substring(0, 100)}`
        : `Garantia negada: ${body.motivo_negacao || 'Mau uso'}`,
      now
    ).run();

    return c.json({
      success: true,
      data: { status: novoStatus, defeito_confirmado: body.defeito_confirmado },
      message: body.defeito_confirmado ? 'Defeito confirmado' : 'Garantia negada'
    });
  } catch (error: any) {
    console.error('Erro ao registrar analise:', error);
    return c.json({ success: false, error: 'Erro ao registrar analise' }, 500);
  }
});

// =============================================
// WORKFLOW - RESOLUCAO
// =============================================

// POST /garantias/:id/iniciar-reparo - Iniciar reparo do produto
garantias.post('/:id/iniciar-reparo', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      descricao_reparo?: string;
      custo_reparo?: number;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const garantia = await c.env.DB.prepare(`
      SELECT * FROM garantias WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado nao encontrado' }, 404);
    }

    if (garantia.status !== 'defeito_confirmado' && garantia.status !== 'aguardando_resolucao') {
      return c.json({ success: false, error: 'Chamado nao esta pronto para reparo' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE garantias SET 
        status = 'em_reparo',
        tipo_resolucao = 'reparo',
        data_inicio_reparo = ?,
        descricao_reparo = ?,
        custo_reparo = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(now.split('T')[0], body.descricao_reparo || null, body.custo_reparo || 0, now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO garantias_historico (
        id, garantia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'inicio_reparo', ?, 'em_reparo', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, garantia.status,
      body.usuario_id || null, body.usuario_nome || null,
      'Reparo iniciado', now
    ).run();

    return c.json({ success: true, message: 'Reparo iniciado' });
  } catch (error: any) {
    console.error('Erro ao iniciar reparo:', error);
    return c.json({ success: false, error: 'Erro ao iniciar reparo' }, 500);
  }
});

// POST /garantias/:id/concluir-reparo - Concluir reparo
garantias.post('/:id/concluir-reparo', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      descricao_reparo: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const garantia = await c.env.DB.prepare(`
      SELECT * FROM garantias WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado nao encontrado' }, 404);
    }

    if (garantia.status !== 'em_reparo') {
      return c.json({ success: false, error: 'Chamado nao esta em reparo' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE garantias SET 
        status = 'resolvido',
        data_fim_reparo = ?,
        descricao_reparo = ?,
        data_fechamento = ?,
        motivo_fechamento = 'Reparo concluido',
        updated_at = ?
      WHERE id = ?
    `).bind(now.split('T')[0], body.descricao_reparo, now.split('T')[0], now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO garantias_historico (
        id, garantia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'conclusao_reparo', 'em_reparo', 'resolvido', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id,
      body.usuario_id || null, body.usuario_nome || null,
      `Reparo concluido: ${body.descricao_reparo.substring(0, 100)}`, now
    ).run();

    return c.json({ success: true, message: 'Reparo concluido com sucesso' });
  } catch (error: any) {
    console.error('Erro ao concluir reparo:', error);
    return c.json({ success: false, error: 'Erro ao concluir reparo' }, 500);
  }
});

// POST /garantias/:id/iniciar-troca - Iniciar troca de produto
garantias.post('/:id/iniciar-troca', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      produto_troca_id?: string;
      produto_troca_codigo?: string;
      produto_troca_nome?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const garantia = await c.env.DB.prepare(`
      SELECT * FROM garantias WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado nao encontrado' }, 404);
    }

    if (garantia.status !== 'defeito_confirmado' && garantia.status !== 'aguardando_resolucao') {
      return c.json({ success: false, error: 'Chamado nao esta pronto para troca' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE garantias SET 
        status = 'em_troca',
        tipo_resolucao = 'troca',
        produto_troca_id = ?,
        produto_troca_codigo = ?,
        produto_troca_nome = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.produto_troca_id || garantia.produto_id,
      body.produto_troca_codigo || garantia.produto_codigo,
      body.produto_troca_nome || garantia.produto_nome,
      now, id
    ).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO garantias_historico (
        id, garantia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'inicio_troca', ?, 'em_troca', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, garantia.status,
      body.usuario_id || null, body.usuario_nome || null,
      `Troca iniciada - Produto: ${body.produto_troca_nome || garantia.produto_nome}`, now
    ).run();

    return c.json({ success: true, message: 'Troca iniciada' });
  } catch (error: any) {
    console.error('Erro ao iniciar troca:', error);
    return c.json({ success: false, error: 'Erro ao iniciar troca' }, 500);
  }
});

// POST /garantias/:id/concluir-troca - Concluir troca
garantias.post('/:id/concluir-troca', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      nfe_troca_numero?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const garantia = await c.env.DB.prepare(`
      SELECT * FROM garantias WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado nao encontrado' }, 404);
    }

    if (garantia.status !== 'em_troca') {
      return c.json({ success: false, error: 'Chamado nao esta em troca' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE garantias SET 
        status = 'resolvido',
        nfe_troca_numero = ?,
        data_fechamento = ?,
        motivo_fechamento = 'Troca realizada',
        updated_at = ?
      WHERE id = ?
    `).bind(body.nfe_troca_numero || null, now.split('T')[0], now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO garantias_historico (
        id, garantia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'conclusao_troca', 'em_troca', 'resolvido', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id,
      body.usuario_id || null, body.usuario_nome || null,
      `Troca concluida${body.nfe_troca_numero ? ` - NF-e: ${body.nfe_troca_numero}` : ''}`, now
    ).run();

    return c.json({ success: true, message: 'Troca concluida com sucesso' });
  } catch (error: any) {
    console.error('Erro ao concluir troca:', error);
    return c.json({ success: false, error: 'Erro ao concluir troca' }, 500);
  }
});

// POST /garantias/:id/iniciar-devolucao - Iniciar devolucao de valor
garantias.post('/:id/iniciar-devolucao', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      valor_devolucao: number;
      forma_devolucao: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    if (!body.valor_devolucao || !body.forma_devolucao) {
      return c.json({ success: false, error: 'Valor e forma de devolucao sao obrigatorios' }, 400);
    }

    const garantia = await c.env.DB.prepare(`
      SELECT * FROM garantias WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado nao encontrado' }, 404);
    }

    if (garantia.status !== 'defeito_confirmado' && garantia.status !== 'aguardando_resolucao') {
      return c.json({ success: false, error: 'Chamado nao esta pronto para devolucao' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE garantias SET 
        status = 'em_devolucao',
        tipo_resolucao = 'devolucao_valor',
        valor_devolucao = ?,
        forma_devolucao = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(body.valor_devolucao, body.forma_devolucao, now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO garantias_historico (
        id, garantia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'inicio_devolucao', ?, 'em_devolucao', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, garantia.status,
      body.usuario_id || null, body.usuario_nome || null,
      `Devolucao iniciada - Valor: R$ ${body.valor_devolucao.toFixed(2)} - Forma: ${body.forma_devolucao}`, now
    ).run();

    return c.json({ success: true, message: 'Devolucao de valor iniciada' });
  } catch (error: any) {
    console.error('Erro ao iniciar devolucao:', error);
    return c.json({ success: false, error: 'Erro ao iniciar devolucao' }, 500);
  }
});

// POST /garantias/:id/concluir-devolucao - Concluir devolucao
garantias.post('/:id/concluir-devolucao', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      credito_id?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const garantia = await c.env.DB.prepare(`
      SELECT * FROM garantias WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado nao encontrado' }, 404);
    }

    if (garantia.status !== 'em_devolucao') {
      return c.json({ success: false, error: 'Chamado nao esta em devolucao' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE garantias SET 
        status = 'resolvido',
        credito_id = ?,
        data_fechamento = ?,
        motivo_fechamento = 'Valor devolvido',
        updated_at = ?
      WHERE id = ?
    `).bind(body.credito_id || null, now.split('T')[0], now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO garantias_historico (
        id, garantia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'conclusao_devolucao', 'em_devolucao', 'resolvido', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id,
      body.usuario_id || null, body.usuario_nome || null,
      `Devolucao concluida - Valor: R$ ${garantia.valor_devolucao?.toFixed(2) || '0.00'}`, now
    ).run();

    return c.json({ success: true, message: 'Devolucao concluida com sucesso' });
  } catch (error: any) {
    console.error('Erro ao concluir devolucao:', error);
    return c.json({ success: false, error: 'Erro ao concluir devolucao' }, 500);
  }
});

// POST /garantias/:id/enviar-fabricante - Enviar para fabricante
garantias.post('/:id/enviar-fabricante', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      fabricante_protocolo?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const garantia = await c.env.DB.prepare(`
      SELECT * FROM garantias WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado nao encontrado' }, 404);
    }

    if (garantia.status !== 'defeito_confirmado' && garantia.status !== 'aguardando_resolucao') {
      return c.json({ success: false, error: 'Chamado nao esta pronto para envio ao fabricante' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE garantias SET 
        status = 'enviado_fabricante',
        tipo_resolucao = 'envio_fabricante',
        fabricante_protocolo = ?,
        fabricante_data_envio = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(body.fabricante_protocolo || null, now.split('T')[0], now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO garantias_historico (
        id, garantia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'envio_fabricante', ?, 'enviado_fabricante', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, garantia.status,
      body.usuario_id || null, body.usuario_nome || null,
      `Enviado ao fabricante${body.fabricante_protocolo ? ` - Protocolo: ${body.fabricante_protocolo}` : ''}`, now
    ).run();

    return c.json({ success: true, message: 'Produto enviado ao fabricante' });
  } catch (error: any) {
    console.error('Erro ao enviar ao fabricante:', error);
    return c.json({ success: false, error: 'Erro ao enviar ao fabricante' }, 500);
  }
});

// POST /garantias/:id/retorno-fabricante - Registrar retorno do fabricante
garantias.post('/:id/retorno-fabricante', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      fabricante_resolveu: boolean;
      fabricante_parecer: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    if (body.fabricante_resolveu === undefined || !body.fabricante_parecer) {
      return c.json({ success: false, error: 'Parecer do fabricante e obrigatorio' }, 400);
    }

    const garantia = await c.env.DB.prepare(`
      SELECT * FROM garantias WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado nao encontrado' }, 404);
    }

    if (garantia.status !== 'enviado_fabricante' && garantia.status !== 'aguardando_fabricante') {
      return c.json({ success: false, error: 'Chamado nao esta aguardando retorno do fabricante' }, 400);
    }

    const now = new Date().toISOString();
    const novoStatus = body.fabricante_resolveu ? 'resolvido' : 'aguardando_resolucao';

    await c.env.DB.prepare(`
      UPDATE garantias SET 
        status = ?,
        fabricante_data_retorno = ?,
        fabricante_parecer = ?,
        fabricante_resolveu = ?,
        data_fechamento = ?,
        motivo_fechamento = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      novoStatus, now.split('T')[0], body.fabricante_parecer,
      body.fabricante_resolveu ? 1 : 0,
      body.fabricante_resolveu ? now.split('T')[0] : null,
      body.fabricante_resolveu ? 'Resolvido pelo fabricante' : null,
      now, id
    ).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO garantias_historico (
        id, garantia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'retorno_fabricante', ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, garantia.status, novoStatus,
      body.usuario_id || null, body.usuario_nome || null,
      body.fabricante_resolveu 
        ? `Fabricante resolveu: ${body.fabricante_parecer.substring(0, 100)}`
        : `Fabricante nao resolveu: ${body.fabricante_parecer.substring(0, 100)}`,
      now
    ).run();

    return c.json({
      success: true,
      data: { status: novoStatus, fabricante_resolveu: body.fabricante_resolveu },
      message: body.fabricante_resolveu ? 'Problema resolvido pelo fabricante' : 'Aguardando nova resolucao'
    });
  } catch (error: any) {
    console.error('Erro ao registrar retorno do fabricante:', error);
    return c.json({ success: false, error: 'Erro ao registrar retorno do fabricante' }, 500);
  }
});

// =============================================
// CANCELAMENTO E FECHAMENTO
// =============================================

// POST /garantias/:id/cancelar - Cancelar chamado
garantias.post('/:id/cancelar', async (c) => {
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

    const garantia = await c.env.DB.prepare(`
      SELECT * FROM garantias WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado nao encontrado' }, 404);
    }

    if (garantia.status === 'resolvido' || garantia.status === 'cancelado') {
      return c.json({ success: false, error: 'Chamado ja foi finalizado' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE garantias SET 
        status = 'cancelado',
        data_fechamento = ?,
        motivo_fechamento = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(now.split('T')[0], body.motivo, now, id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO garantias_historico (
        id, garantia_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, 'cancelamento', ?, 'cancelado', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, garantia.status,
      body.usuario_id || null, body.usuario_nome || null,
      `Chamado cancelado: ${body.motivo}`, now
    ).run();

    return c.json({ success: true, message: 'Chamado cancelado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao cancelar chamado:', error);
    return c.json({ success: false, error: 'Erro ao cancelar chamado' }, 500);
  }
});

// =============================================
// ANEXOS E INTERACOES
// =============================================

// POST /garantias/:id/anexos - Adicionar anexo
garantias.post('/:id/anexos', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      tipo: string;
      nome: string;
      url: string;
      tamanho_bytes?: number;
      mime_type?: string;
      descricao?: string;
      enviado_por_id?: string;
      enviado_por_nome?: string;
    }>();

    if (!body.tipo || !body.nome || !body.url) {
      return c.json({ success: false, error: 'Tipo, nome e URL sao obrigatorios' }, 400);
    }

    const garantia = await c.env.DB.prepare(`
      SELECT id FROM garantias WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado nao encontrado' }, 404);
    }

    const anexoId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO garantias_anexos (
        id, garantia_id, tipo, nome, url, tamanho_bytes, mime_type,
        descricao, enviado_por_id, enviado_por_nome, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      anexoId, id, body.tipo, body.nome, body.url,
      body.tamanho_bytes || null, body.mime_type || null,
      body.descricao || null, body.enviado_por_id || null, body.enviado_por_nome || null, now
    ).run();

    return c.json({
      success: true,
      data: { id: anexoId },
      message: 'Anexo adicionado com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao adicionar anexo:', error);
    return c.json({ success: false, error: 'Erro ao adicionar anexo' }, 500);
  }
});

// POST /garantias/:id/interacoes - Adicionar interacao
garantias.post('/:id/interacoes', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      tipo: string;
      direcao: string;
      conteudo: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    if (!body.tipo || !body.direcao || !body.conteudo) {
      return c.json({ success: false, error: 'Tipo, direcao e conteudo sao obrigatorios' }, 400);
    }

    const garantia = await c.env.DB.prepare(`
      SELECT id FROM garantias WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!garantia) {
      return c.json({ success: false, error: 'Chamado nao encontrado' }, 404);
    }

    const interacaoId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO garantias_interacoes (
        id, garantia_id, tipo, direcao, conteudo, usuario_id, usuario_nome, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      interacaoId, id, body.tipo, body.direcao, body.conteudo,
      body.usuario_id || null, body.usuario_nome || null, now
    ).run();

    return c.json({
      success: true,
      data: { id: interacaoId },
      message: 'Interacao registrada com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao registrar interacao:', error);
    return c.json({ success: false, error: 'Erro ao registrar interacao' }, 500);
  }
});

// =============================================
// DASHBOARD
// =============================================

// GET /garantias/dashboard/resumo - Dashboard de garantias
garantias.get('/dashboard/resumo', async (c) => {
  const { empresa_id } = c.req.query();

  try {
    let where = "WHERE g.deleted_at IS NULL";
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND g.empresa_id = ?';
      params.push(empresa_id);
    }

    // Por status
    const porStatus = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as quantidade
      FROM garantias g ${where}
      GROUP BY status
    `).bind(...params).all();

    // Abertos
    const abertos = await c.env.DB.prepare(`
      SELECT COUNT(*) as quantidade,
        AVG(CAST(julianday('now') - julianday(data_abertura) AS INTEGER)) as media_dias
      FROM garantias g ${where} 
      AND status NOT IN ('resolvido', 'cancelado', 'garantia_expirada', 'garantia_negada')
    `).bind(...params).first();

    // Resolvidos este mes
    const resolvidosMes = await c.env.DB.prepare(`
      SELECT COUNT(*) as quantidade
      FROM garantias g ${where} 
      AND status = 'resolvido'
      AND strftime('%Y-%m', data_fechamento) = strftime('%Y-%m', 'now')
    `).bind(...params).first();

    // Por tipo de resolucao
    const porResolucao = await c.env.DB.prepare(`
      SELECT tipo_resolucao, COUNT(*) as quantidade
      FROM garantias g ${where} AND tipo_resolucao IS NOT NULL
      GROUP BY tipo_resolucao
    `).bind(...params).all();

    // Produtos com mais chamados
    const topProdutos = await c.env.DB.prepare(`
      SELECT produto_id, produto_codigo, produto_nome, COUNT(*) as total_chamados
      FROM garantias g ${where} AND produto_id IS NOT NULL
      GROUP BY produto_id, produto_codigo, produto_nome
      ORDER BY total_chamados DESC
      LIMIT 10
    `).bind(...params).all();

    return c.json({
      success: true,
      data: {
        por_status: porStatus.results,
        abertos: abertos,
        resolvidos_mes: resolvidosMes,
        por_resolucao: porResolucao.results,
        top_produtos: topProdutos.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar dashboard:', error);
    return c.json({ success: false, error: 'Erro ao buscar dashboard' }, 500);
  }
});

export default garantias;
