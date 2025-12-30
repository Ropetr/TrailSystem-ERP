// =============================================
// TRAILSYSTEM ERP - Rotas de Inventário
// Fluxo completo: contagens, divergências, ajustes
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const inventario = new Hono<{ Bindings: Env }>();

// =============================================
// GET /inventario - Listar inventários
// =============================================
inventario.get('/', async (c) => {
  const { 
    page = '1', limit = '20', 
    status, tipo, data_inicio, data_fim,
    empresa_id 
  } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND i.empresa_id = ?';
      params.push(empresa_id);
    }

    if (status) {
      where += ' AND i.status = ?';
      params.push(status);
    }

    if (tipo) {
      where += ' AND i.tipo = ?';
      params.push(tipo);
    }

    if (data_inicio) {
      where += ' AND i.data_abertura >= ?';
      params.push(data_inicio);
    }

    if (data_fim) {
      where += ' AND i.data_abertura <= ?';
      params.push(data_fim + 'T23:59:59');
    }

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM inventarios i ${where}
    `).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await c.env.DB.prepare(`
      SELECT 
        i.*,
        (SELECT COUNT(*) FROM inventarios_itens ii WHERE ii.inventario_id = i.id) as total_itens,
        (SELECT COUNT(*) FROM inventarios_itens ii WHERE ii.inventario_id = i.id AND ii.status IN ('validado', 'ajustado')) as itens_concluidos,
        (SELECT COUNT(*) FROM inventarios_itens ii WHERE ii.inventario_id = i.id AND ii.tem_divergencia = 1) as itens_divergentes
      FROM inventarios i
      ${where}
      ORDER BY i.data_abertura DESC
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
    console.error('Erro ao listar inventários:', error);
    return c.json({ success: false, error: 'Erro ao listar inventários' }, 500);
  }
});

// =============================================
// GET /inventario/:id - Buscar inventário por ID
// =============================================
inventario.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const inv = await c.env.DB.prepare(`
      SELECT * FROM inventarios WHERE id = ?
    `).bind(id).first();

    if (!inv) {
      return c.json({ success: false, error: 'Inventário não encontrado' }, 404);
    }

    // Buscar itens
    const itens = await c.env.DB.prepare(`
      SELECT 
        ii.*,
        p.codigo as produto_codigo_atual,
        p.nome as produto_nome_atual
      FROM inventarios_itens ii
      LEFT JOIN produtos p ON p.id = ii.produto_id
      WHERE ii.inventario_id = ?
      ORDER BY p.nome
    `).bind(id).all();

    // Buscar divergências
    const divergencias = await c.env.DB.prepare(`
      SELECT * FROM inventarios_divergencias WHERE inventario_id = ? ORDER BY created_at DESC
    `).bind(id).all();

    // Buscar fichas
    const fichas = await c.env.DB.prepare(`
      SELECT * FROM inventarios_fichas WHERE inventario_id = ? ORDER BY numero
    `).bind(id).all();

    // Estatísticas
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_itens,
        SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN status = 'contagem_1' THEN 1 ELSE 0 END) as em_contagem_1,
        SUM(CASE WHEN status = 'contagem_2' THEN 1 ELSE 0 END) as em_contagem_2,
        SUM(CASE WHEN status = 'contagem_3' THEN 1 ELSE 0 END) as em_contagem_3,
        SUM(CASE WHEN status = 'validado' THEN 1 ELSE 0 END) as validados,
        SUM(CASE WHEN status = 'ajustado' THEN 1 ELSE 0 END) as ajustados,
        SUM(CASE WHEN tem_divergencia = 1 THEN 1 ELSE 0 END) as com_divergencia,
        SUM(valor_divergencia) as valor_total_divergencia
      FROM inventarios_itens WHERE inventario_id = ?
    `).bind(id).first();

    return c.json({
      success: true,
      data: {
        ...inv,
        itens: itens.results,
        divergencias: divergencias.results,
        fichas: fichas.results,
        estatisticas: stats
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar inventário:', error);
    return c.json({ success: false, error: 'Erro ao buscar inventário' }, 500);
  }
});

// =============================================
// POST /inventario - Criar novo inventário
// =============================================
inventario.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      descricao?: string;
      tipo: 'geral' | 'rotativo' | 'por_categoria';
      responsavel_id?: string;
      responsavel_nome?: string;
      bloquear_movimentacao?: boolean;
      categorias_ids?: string[];
      produtos_ids?: string[];
      local_id?: string;
      observacao?: string;
      empresa_id?: string;
      filial_id?: string;
    }>();

    if (!body.tipo) {
      return c.json({ success: false, error: 'Tipo de inventário é obrigatório' }, 400);
    }

    const empresaId = body.empresa_id || 'empresa_planac_001';
    const filialId = body.filial_id || null;

    // Gerar número sequencial
    const lastNum = await c.env.DB.prepare(`
      SELECT MAX(numero) as ultimo FROM inventarios WHERE empresa_id = ?
    `).bind(empresaId).first<{ ultimo: number }>();
    const numero = (lastNum?.ultimo || 0) + 1;

    const id = crypto.randomUUID();
    const dataAbertura = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO inventarios (
        id, empresa_id, filial_id, numero, descricao, tipo,
        data_abertura, responsavel_id, responsavel_nome,
        status, bloquear_movimentacao, categorias_ids, produtos_ids,
        local_id, observacao, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'aberto', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id, empresaId, filialId, numero, body.descricao || `Inventário #${numero}`, body.tipo,
      dataAbertura, body.responsavel_id || null, body.responsavel_nome || null,
      body.bloquear_movimentacao ? 1 : 0,
      body.categorias_ids ? JSON.stringify(body.categorias_ids) : null,
      body.produtos_ids ? JSON.stringify(body.produtos_ids) : null,
      body.local_id || null, body.observacao || null
    ).run();

    return c.json({
      success: true,
      data: { id, numero },
      message: 'Inventário criado com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar inventário:', error);
    return c.json({ success: false, error: 'Erro ao criar inventário' }, 500);
  }
});

// =============================================
// POST /inventario/:id/gerar-itens - Gerar lista de itens para contagem
// =============================================
inventario.post('/:id/gerar-itens', async (c) => {
  const { id } = c.req.param();

  try {
    const inv = await c.env.DB.prepare(`
      SELECT * FROM inventarios WHERE id = ?
    `).bind(id).first<any>();

    if (!inv) {
      return c.json({ success: false, error: 'Inventário não encontrado' }, 404);
    }

    if (inv.status !== 'aberto') {
      return c.json({ success: false, error: 'Inventário não está aberto para geração de itens' }, 400);
    }

    // Construir query baseado no tipo de inventário
    let where = 'WHERE e.empresa_id = ?';
    const params: any[] = [inv.empresa_id];

    if (inv.local_id) {
      where += ' AND e.local_id = ?';
      params.push(inv.local_id);
    }

    if (inv.tipo === 'por_categoria' && inv.categorias_ids) {
      const categorias = JSON.parse(inv.categorias_ids);
      if (categorias.length > 0) {
        where += ` AND p.categoria_id IN (${categorias.map(() => '?').join(',')})`;
        params.push(...categorias);
      }
    }

    if (inv.tipo === 'rotativo' && inv.produtos_ids) {
      const produtos = JSON.parse(inv.produtos_ids);
      if (produtos.length > 0) {
        where += ` AND e.produto_id IN (${produtos.map(() => '?').join(',')})`;
        params.push(...produtos);
      }
    }

    // Buscar produtos com saldo
    const produtos = await c.env.DB.prepare(`
      SELECT 
        e.produto_id, e.local_id, e.quantidade as quantidade_sistema, e.custo_medio,
        p.codigo, p.nome, p.unidade,
        l.nome as local_nome
      FROM estoque e
      LEFT JOIN produtos p ON p.id = e.produto_id
      LEFT JOIN locais_estoque l ON l.id = e.local_id
      ${where}
      ORDER BY p.nome
    `).bind(...params).all();

    // Inserir itens
    let totalItens = 0;
    for (const prod of produtos.results as any[]) {
      const itemId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO inventarios_itens (
          id, inventario_id, produto_id, produto_codigo, produto_descricao, unidade,
          local_id, local_nome, quantidade_sistema, custo_unitario, status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', datetime('now'), datetime('now'))
      `).bind(
        itemId, id, prod.produto_id, prod.codigo, prod.nome, prod.unidade,
        prod.local_id, prod.local_nome, prod.quantidade_sistema, prod.custo_medio
      ).run();
      totalItens++;
    }

    // Atualizar inventário
    await c.env.DB.prepare(`
      UPDATE inventarios SET 
        status = 'em_contagem',
        total_produtos = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(totalItens, id).run();

    // Bloquear movimentação se configurado
    if (inv.bloquear_movimentacao) {
      // TODO: Implementar bloqueio de movimentação
    }

    return c.json({
      success: true,
      data: { total_itens: totalItens },
      message: `${totalItens} itens gerados para contagem`
    });
  } catch (error: any) {
    console.error('Erro ao gerar itens:', error);
    return c.json({ success: false, error: 'Erro ao gerar itens do inventário' }, 500);
  }
});

// =============================================
// POST /inventario/:id/gerar-fichas - Gerar fichas de contagem
// =============================================
inventario.post('/:id/gerar-fichas', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      itens_por_ficha?: number;
      agrupar_por?: 'local' | 'categoria' | 'nenhum';
    }>();

    const inv = await c.env.DB.prepare(`
      SELECT * FROM inventarios WHERE id = ?
    `).bind(id).first<any>();

    if (!inv) {
      return c.json({ success: false, error: 'Inventário não encontrado' }, 404);
    }

    const itensPorFicha = body.itens_por_ficha || 50;

    // Buscar itens pendentes
    const itens = await c.env.DB.prepare(`
      SELECT id, local_id FROM inventarios_itens 
      WHERE inventario_id = ? AND status = 'pendente'
      ORDER BY local_nome, produto_descricao
    `).bind(id).all();

    // Agrupar itens em fichas
    const fichas: { itens: string[]; local_id?: string }[] = [];
    let fichaAtual: string[] = [];
    let localAtual: string | null = null;

    for (const item of itens.results as any[]) {
      if (body.agrupar_por === 'local' && item.local_id !== localAtual) {
        if (fichaAtual.length > 0) {
          fichas.push({ itens: fichaAtual, local_id: localAtual || undefined });
        }
        fichaAtual = [];
        localAtual = item.local_id;
      }

      fichaAtual.push(item.id);

      if (fichaAtual.length >= itensPorFicha) {
        fichas.push({ itens: fichaAtual, local_id: localAtual || undefined });
        fichaAtual = [];
      }
    }

    if (fichaAtual.length > 0) {
      fichas.push({ itens: fichaAtual, local_id: localAtual || undefined });
    }

    // Criar fichas no banco
    let numeroFicha = 1;
    for (const ficha of fichas) {
      const fichaId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO inventarios_fichas (
          id, inventario_id, numero, local_id, status, itens_ids, total_itens,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'gerada', ?, ?, datetime('now'), datetime('now'))
      `).bind(
        fichaId, id, numeroFicha, ficha.local_id || null,
        JSON.stringify(ficha.itens), ficha.itens.length
      ).run();
      numeroFicha++;
    }

    return c.json({
      success: true,
      data: { total_fichas: fichas.length },
      message: `${fichas.length} fichas de contagem geradas`
    });
  } catch (error: any) {
    console.error('Erro ao gerar fichas:', error);
    return c.json({ success: false, error: 'Erro ao gerar fichas de contagem' }, 500);
  }
});

// =============================================
// POST /inventario/itens/:item_id/contagem - Registrar contagem
// =============================================
inventario.post('/itens/:item_id/contagem', async (c) => {
  const { item_id } = c.req.param();

  try {
    const body = await c.req.json<{
      quantidade: number;
      usuario_id?: string;
      usuario_nome?: string;
      observacao?: string;
    }>();

    if (body.quantidade === undefined || body.quantidade === null) {
      return c.json({ success: false, error: 'Quantidade é obrigatória' }, 400);
    }

    const item = await c.env.DB.prepare(`
      SELECT ii.*, i.id as inventario_id, i.status as inventario_status
      FROM inventarios_itens ii
      JOIN inventarios i ON i.id = ii.inventario_id
      WHERE ii.id = ?
    `).bind(item_id).first<any>();

    if (!item) {
      return c.json({ success: false, error: 'Item não encontrado' }, 404);
    }

    if (item.inventario_status === 'finalizado' || item.inventario_status === 'cancelado') {
      return c.json({ success: false, error: 'Inventário já foi finalizado ou cancelado' }, 400);
    }

    const dataContagem = new Date().toISOString();
    let novoStatus = item.status;
    let updates: string[] = [];
    const updateParams: any[] = [];

    // Determinar qual contagem registrar
    if (item.status === 'pendente' || item.status === 'contagem_1') {
      // 1ª Contagem
      updates.push('contagem_1 = ?', 'contagem_1_usuario_id = ?', 'contagem_1_usuario_nome = ?', 'contagem_1_data = ?');
      updateParams.push(body.quantidade, body.usuario_id || null, body.usuario_nome || null, dataContagem);
      
      // Verificar divergência
      const divergencia = Math.abs(body.quantidade - item.quantidade_sistema);
      if (divergencia > 0) {
        novoStatus = 'contagem_1'; // Precisa de 2ª contagem
        await c.env.DB.prepare(`
          UPDATE inventarios SET status = 'aguardando_recontagem', updated_at = datetime('now') WHERE id = ?
        `).bind(item.inventario_id).run();
      } else {
        novoStatus = 'validado';
        updates.push('quantidade_final = ?', 'tem_divergencia = 0');
        updateParams.push(body.quantidade);
      }
    } else if (item.status === 'contagem_1') {
      // 2ª Contagem
      updates.push('contagem_2 = ?', 'contagem_2_usuario_id = ?', 'contagem_2_usuario_nome = ?', 'contagem_2_data = ?');
      updateParams.push(body.quantidade, body.usuario_id || null, body.usuario_nome || null, dataContagem);
      
      // Comparar com 1ª contagem
      if (body.quantidade === item.contagem_1) {
        // Confirma divergência - precisa de 3ª contagem (supervisor)
        novoStatus = 'contagem_2';
      } else if (body.quantidade === item.quantidade_sistema) {
        // Erro na 1ª contagem - validado
        novoStatus = 'validado';
        updates.push('quantidade_final = ?', 'tem_divergencia = 0');
        updateParams.push(body.quantidade);
      } else {
        // Ainda divergente - precisa de 3ª contagem
        novoStatus = 'contagem_2';
      }
    } else if (item.status === 'contagem_2') {
      // 3ª Contagem (supervisor)
      updates.push('contagem_3 = ?', 'contagem_3_usuario_id = ?', 'contagem_3_usuario_nome = ?', 'contagem_3_data = ?');
      updateParams.push(body.quantidade, body.usuario_id || null, body.usuario_nome || null, dataContagem);
      
      // Contagem final - registrar divergência se houver
      const divergencia = body.quantidade - item.quantidade_sistema;
      if (divergencia !== 0) {
        novoStatus = 'contagem_3';
        updates.push('quantidade_final = ?', 'tem_divergencia = 1', 'quantidade_divergencia = ?', 'tipo_divergencia = ?', 'valor_divergencia = ?');
        updateParams.push(
          body.quantidade, 
          Math.abs(divergencia), 
          divergencia > 0 ? 'sobra' : 'falta',
          Math.abs(divergencia) * (item.custo_unitario || 0)
        );

        // Criar registro de divergência
        const divId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO inventarios_divergencias (
            id, inventario_id, inventario_item_id, produto_id, produto_codigo, produto_descricao,
            quantidade_sistema, quantidade_contada, quantidade_divergencia, tipo,
            custo_unitario, valor_divergencia, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', datetime('now'), datetime('now'))
        `).bind(
          divId, item.inventario_id, item_id, item.produto_id, item.produto_codigo, item.produto_descricao,
          item.quantidade_sistema, body.quantidade, Math.abs(divergencia),
          divergencia > 0 ? 'sobra' : 'falta',
          item.custo_unitario || 0, Math.abs(divergencia) * (item.custo_unitario || 0)
        ).run();

        // Atualizar totais do inventário
        await c.env.DB.prepare(`
          UPDATE inventarios SET 
            total_divergencias = total_divergencias + 1,
            valor_divergencia = valor_divergencia + ?,
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(Math.abs(divergencia) * (item.custo_unitario || 0), item.inventario_id).run();
      } else {
        novoStatus = 'validado';
        updates.push('quantidade_final = ?', 'tem_divergencia = 0');
        updateParams.push(body.quantidade);
      }
    }

    updates.push('status = ?', 'updated_at = datetime(\'now\')');
    updateParams.push(novoStatus);

    if (body.observacao) {
      updates.push('observacao = ?');
      updateParams.push(body.observacao);
    }

    updateParams.push(item_id);

    await c.env.DB.prepare(`
      UPDATE inventarios_itens SET ${updates.join(', ')} WHERE id = ?
    `).bind(...updateParams).run();

    // Atualizar contador de itens contados
    await c.env.DB.prepare(`
      UPDATE inventarios SET 
        total_itens_contados = (SELECT COUNT(*) FROM inventarios_itens WHERE inventario_id = ? AND status != 'pendente'),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(item.inventario_id, item.inventario_id).run();

    return c.json({
      success: true,
      data: { status: novoStatus },
      message: 'Contagem registrada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao registrar contagem:', error);
    return c.json({ success: false, error: 'Erro ao registrar contagem' }, 500);
  }
});

// =============================================
// POST /inventario/divergencias/:id/resolver - Resolver divergência
// =============================================
inventario.post('/divergencias/:id/resolver', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      causa: 'furto' | 'erro_lancamento' | 'quebra' | 'vencimento' | 'nao_identificada';
      causa_descricao?: string;
      acao: 'ajuste_entrada' | 'ajuste_saida' | 'ocorrencia' | 'correcao_historico';
      acao_descricao?: string;
      gerar_ajuste?: boolean;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    if (!body.causa || !body.acao) {
      return c.json({ success: false, error: 'Causa e ação são obrigatórias' }, 400);
    }

    const div = await c.env.DB.prepare(`
      SELECT d.*, ii.produto_id, ii.local_id, ii.quantidade_sistema, ii.quantidade_final, ii.custo_unitario,
             i.empresa_id, i.filial_id
      FROM inventarios_divergencias d
      JOIN inventarios_itens ii ON ii.id = d.inventario_item_id
      JOIN inventarios i ON i.id = d.inventario_id
      WHERE d.id = ?
    `).bind(id).first<any>();

    if (!div) {
      return c.json({ success: false, error: 'Divergência não encontrada' }, 404);
    }

    if (div.status === 'resolvida') {
      return c.json({ success: false, error: 'Divergência já foi resolvida' }, 400);
    }

    let movimentacaoId: string | null = null;

    // Gerar ajuste de estoque se solicitado
    if (body.gerar_ajuste && (body.acao === 'ajuste_entrada' || body.acao === 'ajuste_saida')) {
      const tipoMov = div.tipo === 'sobra' ? 'entrada' : 'saida';
      movimentacaoId = crypto.randomUUID();

      // Buscar saldo atual
      const saldoAtual = await c.env.DB.prepare(`
        SELECT * FROM estoque WHERE produto_id = ? AND local_id = ? AND empresa_id = ?
      `).bind(div.produto_id, div.local_id, div.empresa_id).first<any>();

      const qtdAnterior = saldoAtual?.quantidade || 0;
      const qtdPosterior = div.quantidade_final;

      // Atualizar estoque
      if (saldoAtual) {
        await c.env.DB.prepare(`
          UPDATE estoque SET quantidade = ?, updated_at = datetime('now') WHERE id = ?
        `).bind(qtdPosterior, saldoAtual.id).run();
      }

      // Registrar movimentação
      await c.env.DB.prepare(`
        INSERT INTO estoque_movimentacoes (
          id, empresa_id, filial_id, produto_id, local_id, tipo, quantidade,
          quantidade_anterior, quantidade_posterior, custo_unitario, custo_total,
          observacao, created_at
        ) VALUES (?, ?, ?, ?, ?, 'ajuste', ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        movimentacaoId, div.empresa_id, div.filial_id, div.produto_id, div.local_id,
        Math.abs(div.quantidade_divergencia), qtdAnterior, qtdPosterior,
        div.custo_unitario || 0, Math.abs(div.quantidade_divergencia) * (div.custo_unitario || 0),
        `Ajuste de inventário - ${body.causa}: ${body.causa_descricao || ''}`
      ).run();

      // Registrar ajuste
      const ajusteId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO inventarios_ajustes (
          id, inventario_id, divergencia_id, produto_id, local_id, tipo,
          quantidade, quantidade_anterior, quantidade_posterior,
          custo_unitario, valor_ajuste, motivo, usuario_id, usuario_nome,
          movimentacao_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        ajusteId, div.inventario_id, id, div.produto_id, div.local_id, tipoMov,
        Math.abs(div.quantidade_divergencia), qtdAnterior, qtdPosterior,
        div.custo_unitario || 0, Math.abs(div.quantidade_divergencia) * (div.custo_unitario || 0),
        `${body.causa}: ${body.causa_descricao || ''}`,
        body.usuario_id || null, body.usuario_nome || null, movimentacaoId
      ).run();

      // Atualizar item do inventário
      await c.env.DB.prepare(`
        UPDATE inventarios_itens SET status = 'ajustado', updated_at = datetime('now') WHERE id = ?
      `).bind(div.inventario_item_id).run();
    }

    // Atualizar divergência
    await c.env.DB.prepare(`
      UPDATE inventarios_divergencias SET 
        causa = ?, causa_descricao = ?, acao = ?, acao_descricao = ?,
        status = 'resolvida', resolvido_por_id = ?, resolvido_por_nome = ?,
        data_resolucao = datetime('now'), movimentacao_ajuste_id = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.causa, body.causa_descricao || null, body.acao, body.acao_descricao || null,
      body.usuario_id || null, body.usuario_nome || null, movimentacaoId, id
    ).run();

    return c.json({
      success: true,
      data: { movimentacao_id: movimentacaoId },
      message: 'Divergência resolvida com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao resolver divergência:', error);
    return c.json({ success: false, error: 'Erro ao resolver divergência' }, 500);
  }
});

// =============================================
// POST /inventario/:id/finalizar - Finalizar inventário
// =============================================
inventario.post('/:id/finalizar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      ajustar_divergencias_pendentes?: boolean;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const inv = await c.env.DB.prepare(`
      SELECT * FROM inventarios WHERE id = ?
    `).bind(id).first<any>();

    if (!inv) {
      return c.json({ success: false, error: 'Inventário não encontrado' }, 404);
    }

    if (inv.status === 'finalizado') {
      return c.json({ success: false, error: 'Inventário já foi finalizado' }, 400);
    }

    // Verificar itens pendentes
    const pendentes = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM inventarios_itens WHERE inventario_id = ? AND status = 'pendente'
    `).bind(id).first<{ total: number }>();

    if (pendentes && pendentes.total > 0) {
      return c.json({ 
        success: false, 
        error: `Ainda existem ${pendentes.total} itens pendentes de contagem` 
      }, 400);
    }

    // Verificar divergências não resolvidas
    const divPendentes = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM inventarios_divergencias WHERE inventario_id = ? AND status = 'pendente'
    `).bind(id).first<{ total: number }>();

    if (divPendentes && divPendentes.total > 0 && !body.ajustar_divergencias_pendentes) {
      return c.json({ 
        success: false, 
        error: `Existem ${divPendentes.total} divergências não resolvidas. Use ajustar_divergencias_pendentes=true para ajustar automaticamente.` 
      }, 400);
    }

    // Ajustar divergências pendentes automaticamente se solicitado
    if (body.ajustar_divergencias_pendentes && divPendentes && divPendentes.total > 0) {
      const divergencias = await c.env.DB.prepare(`
        SELECT d.*, ii.produto_id, ii.local_id, ii.quantidade_sistema, ii.quantidade_final, ii.custo_unitario
        FROM inventarios_divergencias d
        JOIN inventarios_itens ii ON ii.id = d.inventario_item_id
        WHERE d.inventario_id = ? AND d.status = 'pendente'
      `).bind(id).all();

      for (const div of divergencias.results as any[]) {
        // Gerar ajuste
        const movId = crypto.randomUUID();
        const saldoAtual = await c.env.DB.prepare(`
          SELECT * FROM estoque WHERE produto_id = ? AND local_id = ? AND empresa_id = ?
        `).bind(div.produto_id, div.local_id, inv.empresa_id).first<any>();

        const qtdAnterior = saldoAtual?.quantidade || 0;
        const qtdPosterior = div.quantidade_final;

        if (saldoAtual) {
          await c.env.DB.prepare(`
            UPDATE estoque SET quantidade = ?, updated_at = datetime('now') WHERE id = ?
          `).bind(qtdPosterior, saldoAtual.id).run();
        }

        await c.env.DB.prepare(`
          INSERT INTO estoque_movimentacoes (
            id, empresa_id, filial_id, produto_id, local_id, tipo, quantidade,
            quantidade_anterior, quantidade_posterior, custo_unitario, custo_total,
            observacao, created_at
          ) VALUES (?, ?, ?, ?, ?, 'ajuste', ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          movId, inv.empresa_id, inv.filial_id, div.produto_id, div.local_id,
          Math.abs(div.quantidade_divergencia), qtdAnterior, qtdPosterior,
          div.custo_unitario || 0, Math.abs(div.quantidade_divergencia) * (div.custo_unitario || 0),
          'Ajuste automático de inventário'
        ).run();

        // Atualizar divergência
        await c.env.DB.prepare(`
          UPDATE inventarios_divergencias SET 
            causa = 'nao_identificada', acao = ?, status = 'resolvida',
            resolvido_por_id = ?, resolvido_por_nome = ?, data_resolucao = datetime('now'),
            movimentacao_ajuste_id = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          div.tipo === 'sobra' ? 'ajuste_entrada' : 'ajuste_saida',
          body.usuario_id || null, body.usuario_nome || null, movId, div.id
        ).run();

        // Atualizar item
        await c.env.DB.prepare(`
          UPDATE inventarios_itens SET status = 'ajustado', updated_at = datetime('now') WHERE id = ?
        `).bind(div.inventario_item_id).run();
      }
    }

    // Finalizar inventário
    await c.env.DB.prepare(`
      UPDATE inventarios SET 
        status = 'finalizado',
        data_fechamento = datetime('now'),
        bloquear_movimentacao = 0,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    return c.json({
      success: true,
      message: 'Inventário finalizado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao finalizar inventário:', error);
    return c.json({ success: false, error: 'Erro ao finalizar inventário' }, 500);
  }
});

// =============================================
// POST /inventario/:id/cancelar - Cancelar inventário
// =============================================
inventario.post('/:id/cancelar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      motivo?: string;
    }>();

    const inv = await c.env.DB.prepare(`
      SELECT * FROM inventarios WHERE id = ?
    `).bind(id).first<any>();

    if (!inv) {
      return c.json({ success: false, error: 'Inventário não encontrado' }, 404);
    }

    if (inv.status === 'finalizado') {
      return c.json({ success: false, error: 'Inventário já foi finalizado e não pode ser cancelado' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE inventarios SET 
        status = 'cancelado',
        bloquear_movimentacao = 0,
        observacao = COALESCE(observacao || ' | ', '') || 'Cancelado: ' || ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(body.motivo || 'Sem motivo informado', id).run();

    return c.json({
      success: true,
      message: 'Inventário cancelado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao cancelar inventário:', error);
    return c.json({ success: false, error: 'Erro ao cancelar inventário' }, 500);
  }
});

// =============================================
// GET /inventario/:id/relatorio - Relatório de divergências
// =============================================
inventario.get('/:id/relatorio', async (c) => {
  const { id } = c.req.param();

  try {
    const inv = await c.env.DB.prepare(`
      SELECT * FROM inventarios WHERE id = ?
    `).bind(id).first<any>();

    if (!inv) {
      return c.json({ success: false, error: 'Inventário não encontrado' }, 404);
    }

    // Resumo geral
    const resumo = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_itens,
        SUM(CASE WHEN tem_divergencia = 1 THEN 1 ELSE 0 END) as itens_com_divergencia,
        SUM(CASE WHEN tipo_divergencia = 'sobra' THEN quantidade_divergencia ELSE 0 END) as total_sobras,
        SUM(CASE WHEN tipo_divergencia = 'falta' THEN quantidade_divergencia ELSE 0 END) as total_faltas,
        SUM(CASE WHEN tipo_divergencia = 'sobra' THEN valor_divergencia ELSE 0 END) as valor_sobras,
        SUM(CASE WHEN tipo_divergencia = 'falta' THEN valor_divergencia ELSE 0 END) as valor_faltas
      FROM inventarios_itens WHERE inventario_id = ?
    `).bind(id).first();

    // Divergências por causa
    const porCausa = await c.env.DB.prepare(`
      SELECT 
        causa,
        COUNT(*) as quantidade,
        SUM(valor_divergencia) as valor_total
      FROM inventarios_divergencias 
      WHERE inventario_id = ?
      GROUP BY causa
    `).bind(id).all();

    // Lista de divergências
    const divergencias = await c.env.DB.prepare(`
      SELECT 
        d.*,
        ii.produto_codigo, ii.produto_descricao
      FROM inventarios_divergencias d
      JOIN inventarios_itens ii ON ii.id = d.inventario_item_id
      WHERE d.inventario_id = ?
      ORDER BY d.valor_divergencia DESC
    `).bind(id).all();

    // Ajustes realizados
    const ajustes = await c.env.DB.prepare(`
      SELECT * FROM inventarios_ajustes WHERE inventario_id = ? ORDER BY created_at
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        inventario: inv,
        resumo,
        divergencias_por_causa: porCausa.results,
        divergencias: divergencias.results,
        ajustes: ajustes.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao gerar relatório:', error);
    return c.json({ success: false, error: 'Erro ao gerar relatório' }, 500);
  }
});

// =============================================
// GET /inventario/dashboard - Dashboard de inventários
// =============================================
inventario.get('/dashboard/resumo', async (c) => {
  const { empresa_id } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND empresa_id = ?';
      params.push(empresa_id);
    }

    // Inventários por status
    const porStatus = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as quantidade
      FROM inventarios ${where}
      GROUP BY status
    `).bind(...params).all();

    // Inventários em andamento
    const emAndamento = await c.env.DB.prepare(`
      SELECT * FROM inventarios 
      ${where} AND status IN ('aberto', 'em_contagem', 'aguardando_recontagem', 'em_ajuste')
      ORDER BY data_abertura DESC
      LIMIT 5
    `).bind(...params).all();

    // Divergências pendentes
    const divPendentes = await c.env.DB.prepare(`
      SELECT COUNT(*) as total, SUM(valor_divergencia) as valor_total
      FROM inventarios_divergencias d
      JOIN inventarios i ON i.id = d.inventario_id
      ${where.replace('WHERE', 'WHERE i.')} AND d.status = 'pendente'
    `).bind(...params).first();

    // Últimos inventários finalizados
    const ultimosFinalizados = await c.env.DB.prepare(`
      SELECT * FROM inventarios 
      ${where} AND status = 'finalizado'
      ORDER BY data_fechamento DESC
      LIMIT 5
    `).bind(...params).all();

    return c.json({
      success: true,
      data: {
        por_status: porStatus.results,
        em_andamento: emAndamento.results,
        divergencias_pendentes: divPendentes,
        ultimos_finalizados: ultimosFinalizados.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar dashboard:', error);
    return c.json({ success: false, error: 'Erro ao buscar dashboard' }, 500);
  }
});

export default inventario;
