import { Hono } from 'hono';
import type { Env } from '../types';

const compras = new Hono<{ Bindings: Env }>();

// =============================================
// SOLICITAÇÕES DE COMPRA
// =============================================

// GET /compras/solicitacoes - Listar solicitações
compras.get('/solicitacoes', async (c) => {
  const { status, origem, urgencia, data_inicio, data_fim, limit = '50', offset = '0' } = c.req.query();

  try {
    let query = `
      SELECT s.*, u.nome as solicitante_nome_usuario
      FROM solicitacoes_compra s
      LEFT JOIN usuarios u ON u.id = s.solicitante_id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (status) {
      query += ` AND s.status = ?`;
      params.push(status);
    }
    if (origem) {
      query += ` AND s.origem = ?`;
      params.push(origem);
    }
    if (urgencia) {
      query += ` AND s.urgencia = ?`;
      params.push(urgencia);
    }
    if (data_inicio) {
      query += ` AND s.data_solicitacao >= ?`;
      params.push(data_inicio);
    }
    if (data_fim) {
      query += ` AND s.data_solicitacao <= ?`;
      params.push(data_fim);
    }

    query += ` ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: result.results });
  } catch (error: unknown) {
    console.error('Erro ao listar solicitações:', error);
    return c.json({ success: false, error: 'Erro ao listar solicitações' }, 500);
  }
});

// GET /compras/solicitacoes/:id - Buscar solicitação com itens
compras.get('/solicitacoes/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const solicitacao = await c.env.DB.prepare(`
      SELECT s.*, u.nome as solicitante_nome_usuario
      FROM solicitacoes_compra s
      LEFT JOIN usuarios u ON u.id = s.solicitante_id
      WHERE s.id = ?
    `).bind(id).first();

    if (!solicitacao) {
      return c.json({ success: false, error: 'Solicitação não encontrada' }, 404);
    }

    const itens = await c.env.DB.prepare(`
      SELECT si.*, p.codigo as produto_codigo_atual, p.descricao as produto_descricao_atual
      FROM solicitacoes_compra_itens si
      LEFT JOIN produtos p ON p.id = si.produto_id
      WHERE si.solicitacao_id = ?
      ORDER BY si.created_at
    `).bind(id).all();

    return c.json({
      success: true,
      data: { ...solicitacao, itens: itens.results }
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar solicitação:', error);
    return c.json({ success: false, error: 'Erro ao buscar solicitação' }, 500);
  }
});

// POST /compras/solicitacoes - Criar solicitação
compras.post('/solicitacoes', async (c) => {
  try {
    const body = await c.req.json<{
      empresa_id: string;
      filial_id?: string;
      origem?: string;
      solicitante_id?: string;
      solicitante_nome?: string;
      departamento?: string;
      urgencia?: string;
      data_necessidade?: string;
      justificativa?: string;
      observacao?: string;
      itens: Array<{
        produto_id: string;
        produto_codigo?: string;
        produto_descricao?: string;
        unidade?: string;
        quantidade: number;
        valor_unitario_estimado?: number;
        observacao?: string;
      }>;
    }>();

    if (!body.empresa_id || !body.itens || body.itens.length === 0) {
      return c.json({ success: false, error: 'Empresa e itens são obrigatórios' }, 400);
    }

    // Obter próximo número
    const maxNumero = await c.env.DB.prepare(`
      SELECT MAX(numero) as max FROM solicitacoes_compra WHERE empresa_id = ?
    `).bind(body.empresa_id).first<{ max: number }>();
    const numero = (maxNumero?.max || 0) + 1;

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    // Calcular valor estimado total
    let valorEstimado = 0;
    for (const item of body.itens) {
      if (item.valor_unitario_estimado) {
        valorEstimado += item.quantidade * item.valor_unitario_estimado;
      }
    }

    // Inserir solicitação
    await c.env.DB.prepare(`
      INSERT INTO solicitacoes_compra (
        id, empresa_id, filial_id, numero, data_solicitacao, origem,
        solicitante_id, solicitante_nome, departamento, status, urgencia,
        data_necessidade, justificativa, observacao, valor_estimado, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.empresa_id, body.filial_id || null, numero, now.split('T')[0],
      body.origem || 'manual', body.solicitante_id || null, body.solicitante_nome || null,
      body.departamento || null, body.urgencia || 'normal', body.data_necessidade || null,
      body.justificativa || null, body.observacao || null, valorEstimado, now, now
    ).run();

    // Inserir itens
    for (const item of body.itens) {
      const valorTotal = item.valor_unitario_estimado 
        ? item.quantidade * item.valor_unitario_estimado 
        : null;

      await c.env.DB.prepare(`
        INSERT INTO solicitacoes_compra_itens (
          id, solicitacao_id, produto_id, produto_codigo, produto_descricao,
          unidade, quantidade, valor_unitario_estimado, valor_total_estimado, observacao, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, item.produto_id, item.produto_codigo || null,
        item.produto_descricao || null, item.unidade || null, item.quantidade,
        item.valor_unitario_estimado || null, valorTotal, item.observacao || null, now
      ).run();
    }

    return c.json({
      success: true,
      data: { id, numero },
      message: `Solicitação ${numero} criada com ${body.itens.length} itens`
    });
  } catch (error: unknown) {
    console.error('Erro ao criar solicitação:', error);
    return c.json({ success: false, error: 'Erro ao criar solicitação' }, 500);
  }
});

// =============================================
// COTAÇÕES DE COMPRA
// =============================================

// GET /compras/cotacoes - Listar cotações
compras.get('/cotacoes', async (c) => {
  const { status, limit = '50', offset = '0' } = c.req.query();

  try {
    let query = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM cotacoes_compra_fornecedores cf WHERE cf.cotacao_id = c.id) as total_fornecedores,
        (SELECT COUNT(*) FROM cotacoes_compra_fornecedores cf WHERE cf.cotacao_id = c.id AND cf.status = 'respondido') as fornecedores_respondidos
      FROM cotacoes_compra c
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: result.results });
  } catch (error: unknown) {
    console.error('Erro ao listar cotações:', error);
    return c.json({ success: false, error: 'Erro ao listar cotações' }, 500);
  }
});

// GET /compras/cotacoes/:id - Buscar cotação completa
compras.get('/cotacoes/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const cotacao = await c.env.DB.prepare(`
      SELECT * FROM cotacoes_compra WHERE id = ?
    `).bind(id).first();

    if (!cotacao) {
      return c.json({ success: false, error: 'Cotação não encontrada' }, 404);
    }

    const itens = await c.env.DB.prepare(`
      SELECT * FROM cotacoes_compra_itens WHERE cotacao_id = ? ORDER BY created_at
    `).bind(id).all();

    const fornecedores = await c.env.DB.prepare(`
      SELECT cf.*, f.razao_social, f.nome_fantasia, f.cnpj
      FROM cotacoes_compra_fornecedores cf
      LEFT JOIN fornecedores f ON f.id = cf.fornecedor_id
      WHERE cf.cotacao_id = ?
      ORDER BY cf.valor_total ASC
    `).bind(id).all();

    // Buscar respostas de cada fornecedor
    const fornecedoresComRespostas = [];
    for (const forn of fornecedores.results as Array<{ id: string }>) {
      const respostas = await c.env.DB.prepare(`
        SELECT cr.*, ci.produto_descricao
        FROM cotacoes_compra_respostas cr
        LEFT JOIN cotacoes_compra_itens ci ON ci.id = cr.cotacao_item_id
        WHERE cr.cotacao_fornecedor_id = ?
      `).bind(forn.id).all();

      fornecedoresComRespostas.push({
        ...forn,
        respostas: respostas.results
      });
    }

    return c.json({
      success: true,
      data: {
        ...cotacao,
        itens: itens.results,
        fornecedores: fornecedoresComRespostas
      }
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar cotação:', error);
    return c.json({ success: false, error: 'Erro ao buscar cotação' }, 500);
  }
});

// POST /compras/cotacoes - Criar cotação
compras.post('/cotacoes', async (c) => {
  try {
    const body = await c.req.json<{
      empresa_id: string;
      filial_id?: string;
      solicitacao_id?: string;
      comprador_id?: string;
      comprador_nome?: string;
      data_validade?: string;
      criterio_selecao?: string;
      observacao?: string;
      itens: Array<{
        produto_id: string;
        produto_codigo?: string;
        produto_descricao?: string;
        unidade?: string;
        quantidade: number;
        especificacao?: string;
      }>;
      fornecedores_ids: string[];
    }>();

    if (!body.empresa_id || !body.itens || body.itens.length === 0) {
      return c.json({ success: false, error: 'Empresa e itens são obrigatórios' }, 400);
    }

    if (!body.fornecedores_ids || body.fornecedores_ids.length === 0) {
      return c.json({ success: false, error: 'Selecione pelo menos um fornecedor' }, 400);
    }

    // Obter próximo número
    const maxNumero = await c.env.DB.prepare(`
      SELECT MAX(numero) as max FROM cotacoes_compra WHERE empresa_id = ?
    `).bind(body.empresa_id).first<{ max: number }>();
    const numero = (maxNumero?.max || 0) + 1;

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    // Inserir cotação
    await c.env.DB.prepare(`
      INSERT INTO cotacoes_compra (
        id, empresa_id, filial_id, numero, data_abertura, data_validade,
        solicitacao_id, status, comprador_id, comprador_nome,
        observacao, criterio_selecao, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'aberta', ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.empresa_id, body.filial_id || null, numero, now.split('T')[0],
      body.data_validade || null, body.solicitacao_id || null,
      body.comprador_id || null, body.comprador_nome || null,
      body.observacao || null, body.criterio_selecao || 'menor_preco', now, now
    ).run();

    // Inserir itens
    for (const item of body.itens) {
      await c.env.DB.prepare(`
        INSERT INTO cotacoes_compra_itens (
          id, cotacao_id, produto_id, produto_codigo, produto_descricao,
          unidade, quantidade, especificacao, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, item.produto_id, item.produto_codigo || null,
        item.produto_descricao || null, item.unidade || null, item.quantidade,
        item.especificacao || null, now
      ).run();
    }

    // Convidar fornecedores
    for (const fornecedorId of body.fornecedores_ids) {
      await c.env.DB.prepare(`
        INSERT INTO cotacoes_compra_fornecedores (
          id, cotacao_id, fornecedor_id, status, data_convite, created_at, updated_at
        ) VALUES (?, ?, ?, 'convidado', ?, ?, ?)
      `).bind(crypto.randomUUID(), id, fornecedorId, now.split('T')[0], now, now).run();
    }

    // Atualizar status da solicitação se vinculada
    if (body.solicitacao_id) {
      await c.env.DB.prepare(`
        UPDATE solicitacoes_compra SET status = 'em_cotacao', updated_at = ? WHERE id = ?
      `).bind(now, body.solicitacao_id).run();
    }

    return c.json({
      success: true,
      data: { id, numero },
      message: `Cotação ${numero} criada com ${body.itens.length} itens e ${body.fornecedores_ids.length} fornecedores`
    });
  } catch (error: unknown) {
    console.error('Erro ao criar cotação:', error);
    return c.json({ success: false, error: 'Erro ao criar cotação' }, 500);
  }
});

// POST /compras/cotacoes/:id/resposta - Registrar resposta de fornecedor
compras.post('/cotacoes/:id/resposta', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      fornecedor_id: string;
      prazo_entrega_dias?: number;
      condicao_pagamento?: string;
      validade_proposta_dias?: number;
      frete?: string;
      valor_frete?: number;
      observacao?: string;
      itens: Array<{
        cotacao_item_id: string;
        valor_unitario: number;
        desconto_percentual?: number;
        quantidade_disponivel?: number;
        prazo_entrega_dias?: number;
        observacao?: string;
      }>;
    }>();

    // Buscar cotação_fornecedor
    const cotacaoFornecedor = await c.env.DB.prepare(`
      SELECT * FROM cotacoes_compra_fornecedores WHERE cotacao_id = ? AND fornecedor_id = ?
    `).bind(id, body.fornecedor_id).first<{ id: string }>();

    if (!cotacaoFornecedor) {
      return c.json({ success: false, error: 'Fornecedor não está na cotação' }, 404);
    }

    const now = new Date().toISOString();
    let valorTotal = 0;

    // Inserir respostas dos itens
    for (const item of body.itens) {
      const desconto = item.desconto_percentual || 0;
      const valorComDesconto = item.valor_unitario * (1 - desconto / 100);
      
      // Buscar quantidade do item
      const cotacaoItem = await c.env.DB.prepare(`
        SELECT quantidade FROM cotacoes_compra_itens WHERE id = ?
      `).bind(item.cotacao_item_id).first<{ quantidade: number }>();
      
      const quantidade = item.quantidade_disponivel || cotacaoItem?.quantidade || 0;
      const valorTotalItem = valorComDesconto * quantidade;
      valorTotal += valorTotalItem;

      await c.env.DB.prepare(`
        INSERT INTO cotacoes_compra_respostas (
          id, cotacao_fornecedor_id, cotacao_item_id, valor_unitario,
          desconto_percentual, valor_total, quantidade_disponivel,
          prazo_entrega_dias, observacao, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), cotacaoFornecedor.id, item.cotacao_item_id,
        item.valor_unitario, desconto, valorTotalItem,
        item.quantidade_disponivel || null, item.prazo_entrega_dias || null,
        item.observacao || null, now
      ).run();
    }

    // Atualizar cotação_fornecedor
    await c.env.DB.prepare(`
      UPDATE cotacoes_compra_fornecedores SET
        status = 'respondido', data_resposta = ?, prazo_entrega_dias = ?,
        condicao_pagamento = ?, validade_proposta_dias = ?, frete = ?,
        valor_frete = ?, valor_total = ?, observacao = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      now.split('T')[0], body.prazo_entrega_dias || null, body.condicao_pagamento || null,
      body.validade_proposta_dias || null, body.frete || null, body.valor_frete || 0,
      valorTotal + (body.valor_frete || 0), body.observacao || null, now, cotacaoFornecedor.id
    ).run();

    return c.json({
      success: true,
      message: 'Resposta registrada com sucesso'
    });
  } catch (error: unknown) {
    console.error('Erro ao registrar resposta:', error);
    return c.json({ success: false, error: 'Erro ao registrar resposta' }, 500);
  }
});

// POST /compras/cotacoes/:id/selecionar - Selecionar fornecedor vencedor
compras.post('/cotacoes/:id/selecionar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      cotacao_fornecedor_id: string;
      motivo_selecao?: string;
      gerar_pedido?: boolean;
    }>();

    const now = new Date().toISOString();

    // Marcar fornecedor como selecionado
    await c.env.DB.prepare(`
      UPDATE cotacoes_compra_fornecedores SET
        status = 'selecionado', selecionado = 1, motivo_selecao = ?, updated_at = ?
      WHERE id = ?
    `).bind(body.motivo_selecao || null, now, body.cotacao_fornecedor_id).run();

    // Fechar cotação
    await c.env.DB.prepare(`
      UPDATE cotacoes_compra SET status = 'fechada', data_fechamento = ?, updated_at = ?
      WHERE id = ?
    `).bind(now.split('T')[0], now, id).run();

    // Gerar pedido automaticamente se solicitado
    if (body.gerar_pedido) {
      // Buscar dados da cotação e fornecedor
      const cotacao = await c.env.DB.prepare(`
        SELECT * FROM cotacoes_compra WHERE id = ?
      `).bind(id).first<{ empresa_id: string; filial_id: string; solicitacao_id: string; comprador_id: string; comprador_nome: string }>();

      const fornecedor = await c.env.DB.prepare(`
        SELECT cf.*, f.razao_social, f.cnpj
        FROM cotacoes_compra_fornecedores cf
        JOIN fornecedores f ON f.id = cf.fornecedor_id
        WHERE cf.id = ?
      `).bind(body.cotacao_fornecedor_id).first<{
        fornecedor_id: string;
        razao_social: string;
        cnpj: string;
        prazo_entrega_dias: number;
        condicao_pagamento: string;
        frete: string;
        valor_frete: number;
        valor_total: number;
      }>();

      if (cotacao && fornecedor) {
        // Obter próximo número de pedido
        const maxNumero = await c.env.DB.prepare(`
          SELECT MAX(numero) as max FROM pedidos_compra WHERE empresa_id = ?
        `).bind(cotacao.empresa_id).first<{ max: number }>();
        const numeroPedido = (maxNumero?.max || 0) + 1;

        const pedidoId = crypto.randomUUID();
        const dataPrevisao = new Date(Date.now() + (fornecedor.prazo_entrega_dias || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Buscar respostas do fornecedor
        const respostas = await c.env.DB.prepare(`
          SELECT cr.*, ci.produto_id, ci.produto_codigo, ci.produto_descricao, ci.unidade, ci.quantidade
          FROM cotacoes_compra_respostas cr
          JOIN cotacoes_compra_itens ci ON ci.id = cr.cotacao_item_id
          WHERE cr.cotacao_fornecedor_id = ?
        `).bind(body.cotacao_fornecedor_id).all<{
          produto_id: string;
          produto_codigo: string;
          produto_descricao: string;
          unidade: string;
          quantidade: number;
          valor_unitario: number;
          desconto_percentual: number;
          valor_total: number;
        }>();

        let subtotal = 0;
        let descontoTotal = 0;

        // Inserir pedido
        await c.env.DB.prepare(`
          INSERT INTO pedidos_compra (
            id, empresa_id, filial_id, numero, data_emissao, data_previsao_entrega,
            fornecedor_id, fornecedor_nome, fornecedor_cnpj, cotacao_id, cotacao_fornecedor_id,
            solicitacao_id, comprador_id, comprador_nome, status, condicao_pagamento,
            frete, valor_frete, subtotal, desconto_total, valor_total, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'rascunho', ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          pedidoId, cotacao.empresa_id, cotacao.filial_id || null, numeroPedido,
          now.split('T')[0], dataPrevisao, fornecedor.fornecedor_id, fornecedor.razao_social,
          fornecedor.cnpj, id, body.cotacao_fornecedor_id, cotacao.solicitacao_id || null,
          cotacao.comprador_id || null, cotacao.comprador_nome || null,
          fornecedor.condicao_pagamento || null, fornecedor.frete || 'CIF',
          fornecedor.valor_frete || 0, 0, 0, 0, now, now
        ).run();

        // Inserir itens do pedido
        for (const resp of (respostas.results || [])) {
          const desconto = resp.desconto_percentual || 0;
          const valorDesconto = resp.valor_unitario * resp.quantidade * (desconto / 100);
          const valorTotal = resp.valor_unitario * resp.quantidade - valorDesconto;
          
          subtotal += resp.valor_unitario * resp.quantidade;
          descontoTotal += valorDesconto;

          await c.env.DB.prepare(`
            INSERT INTO pedidos_compra_itens (
              id, pedido_id, produto_id, produto_codigo, produto_descricao, unidade,
              quantidade, valor_unitario, desconto_percentual, desconto_valor, valor_total, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            crypto.randomUUID(), pedidoId, resp.produto_id, resp.produto_codigo,
            resp.produto_descricao, resp.unidade, resp.quantidade, resp.valor_unitario,
            desconto, valorDesconto, valorTotal, now
          ).run();
        }

        // Atualizar totais do pedido
        const valorTotalPedido = subtotal - descontoTotal + (fornecedor.valor_frete || 0);
        await c.env.DB.prepare(`
          UPDATE pedidos_compra SET subtotal = ?, desconto_total = ?, valor_total = ? WHERE id = ?
        `).bind(subtotal, descontoTotal, valorTotalPedido, pedidoId).run();

        return c.json({
          success: true,
          data: { pedido_id: pedidoId, pedido_numero: numeroPedido },
          message: `Fornecedor selecionado e pedido ${numeroPedido} gerado`
        });
      }
    }

    return c.json({
      success: true,
      message: 'Fornecedor selecionado com sucesso'
    });
  } catch (error: unknown) {
    console.error('Erro ao selecionar fornecedor:', error);
    return c.json({ success: false, error: 'Erro ao selecionar fornecedor' }, 500);
  }
});

// =============================================
// PEDIDOS DE COMPRA
// =============================================

// GET /compras/pedidos - Listar pedidos
compras.get('/pedidos', async (c) => {
  const { status, fornecedor_id, limit = '50', offset = '0' } = c.req.query();

  try {
    let query = `
      SELECT p.*, f.razao_social as fornecedor_razao_social
      FROM pedidos_compra p
      LEFT JOIN fornecedores f ON f.id = p.fornecedor_id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }
    if (fornecedor_id) {
      query += ` AND p.fornecedor_id = ?`;
      params.push(fornecedor_id);
    }

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: result.results });
  } catch (error: unknown) {
    console.error('Erro ao listar pedidos:', error);
    return c.json({ success: false, error: 'Erro ao listar pedidos' }, 500);
  }
});

// GET /compras/pedidos/:id - Buscar pedido com itens
compras.get('/pedidos/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const pedido = await c.env.DB.prepare(`
      SELECT p.*, f.razao_social as fornecedor_razao_social, f.email as fornecedor_email
      FROM pedidos_compra p
      LEFT JOIN fornecedores f ON f.id = p.fornecedor_id
      WHERE p.id = ?
    `).bind(id).first();

    if (!pedido) {
      return c.json({ success: false, error: 'Pedido não encontrado' }, 404);
    }

    const itens = await c.env.DB.prepare(`
      SELECT * FROM pedidos_compra_itens WHERE pedido_id = ? ORDER BY created_at
    `).bind(id).all();

    const aprovacoes = await c.env.DB.prepare(`
      SELECT * FROM pedidos_compra_aprovacoes WHERE pedido_id = ? ORDER BY created_at DESC
    `).bind(id).all();

    return c.json({
      success: true,
      data: { ...pedido, itens: itens.results, aprovacoes: aprovacoes.results }
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar pedido:', error);
    return c.json({ success: false, error: 'Erro ao buscar pedido' }, 500);
  }
});

// POST /compras/pedidos - Criar pedido direto (sem cotação)
compras.post('/pedidos', async (c) => {
  try {
    const body = await c.req.json<{
      empresa_id: string;
      filial_id?: string;
      fornecedor_id: string;
      comprador_id?: string;
      comprador_nome?: string;
      data_previsao_entrega?: string;
      condicao_pagamento?: string;
      prazo_pagamento_dias?: number;
      forma_pagamento?: string;
      frete?: string;
      valor_frete?: number;
      observacao?: string;
      itens: Array<{
        produto_id: string;
        produto_codigo?: string;
        produto_descricao?: string;
        unidade?: string;
        ncm?: string;
        quantidade: number;
        valor_unitario: number;
        desconto_percentual?: number;
        ipi_percentual?: number;
        observacao?: string;
      }>;
    }>();

    if (!body.empresa_id || !body.fornecedor_id || !body.itens || body.itens.length === 0) {
      return c.json({ success: false, error: 'Empresa, fornecedor e itens são obrigatórios' }, 400);
    }

    // Buscar dados do fornecedor
    const fornecedor = await c.env.DB.prepare(`
      SELECT razao_social, cnpj FROM fornecedores WHERE id = ?
    `).bind(body.fornecedor_id).first<{ razao_social: string; cnpj: string }>();

    if (!fornecedor) {
      return c.json({ success: false, error: 'Fornecedor não encontrado' }, 404);
    }

    // Obter próximo número
    const maxNumero = await c.env.DB.prepare(`
      SELECT MAX(numero) as max FROM pedidos_compra WHERE empresa_id = ?
    `).bind(body.empresa_id).first<{ max: number }>();
    const numero = (maxNumero?.max || 0) + 1;

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    // Calcular totais
    let subtotal = 0;
    let descontoTotal = 0;

    for (const item of body.itens) {
      const desconto = item.desconto_percentual || 0;
      const valorBruto = item.quantidade * item.valor_unitario;
      const valorDesconto = valorBruto * (desconto / 100);
      subtotal += valorBruto;
      descontoTotal += valorDesconto;
    }

    const valorTotal = subtotal - descontoTotal + (body.valor_frete || 0);

    // Inserir pedido
    await c.env.DB.prepare(`
      INSERT INTO pedidos_compra (
        id, empresa_id, filial_id, numero, data_emissao, data_previsao_entrega,
        fornecedor_id, fornecedor_nome, fornecedor_cnpj, comprador_id, comprador_nome,
        status, condicao_pagamento, prazo_pagamento_dias, forma_pagamento,
        frete, valor_frete, subtotal, desconto_total, valor_total, observacao, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'rascunho', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.empresa_id, body.filial_id || null, numero, now.split('T')[0],
      body.data_previsao_entrega || null, body.fornecedor_id, fornecedor.razao_social,
      fornecedor.cnpj, body.comprador_id || null, body.comprador_nome || null,
      body.condicao_pagamento || null, body.prazo_pagamento_dias || null,
      body.forma_pagamento || null, body.frete || 'CIF', body.valor_frete || 0,
      subtotal, descontoTotal, valorTotal, body.observacao || null, now, now
    ).run();

    // Inserir itens
    for (const item of body.itens) {
      const desconto = item.desconto_percentual || 0;
      const valorBruto = item.quantidade * item.valor_unitario;
      const valorDesconto = valorBruto * (desconto / 100);
      const ipi = item.ipi_percentual || 0;
      const valorIpi = (valorBruto - valorDesconto) * (ipi / 100);
      const valorTotal = valorBruto - valorDesconto + valorIpi;

      await c.env.DB.prepare(`
        INSERT INTO pedidos_compra_itens (
          id, pedido_id, produto_id, produto_codigo, produto_descricao, unidade, ncm,
          quantidade, valor_unitario, desconto_percentual, desconto_valor, valor_total,
          ipi_percentual, ipi_valor, observacao, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, item.produto_id, item.produto_codigo || null,
        item.produto_descricao || null, item.unidade || null, item.ncm || null,
        item.quantidade, item.valor_unitario, desconto, valorDesconto, valorTotal,
        ipi, valorIpi, item.observacao || null, now
      ).run();
    }

    return c.json({
      success: true,
      data: { id, numero },
      message: `Pedido ${numero} criado com ${body.itens.length} itens`
    });
  } catch (error: unknown) {
    console.error('Erro ao criar pedido:', error);
    return c.json({ success: false, error: 'Erro ao criar pedido' }, 500);
  }
});

// POST /compras/pedidos/:id/enviar-aprovacao - Enviar para aprovação
compras.post('/pedidos/:id/enviar-aprovacao', async (c) => {
  const { id } = c.req.param();

  try {
    const pedido = await c.env.DB.prepare(`
      SELECT * FROM pedidos_compra WHERE id = ?
    `).bind(id).first<{ status: string; valor_total: number; empresa_id: string }>();

    if (!pedido) {
      return c.json({ success: false, error: 'Pedido não encontrado' }, 404);
    }

    if (pedido.status !== 'rascunho') {
      return c.json({ success: false, error: 'Apenas pedidos em rascunho podem ser enviados para aprovação' }, 400);
    }

    const now = new Date().toISOString();

    // Verificar se precisa de aprovação (baseado em limite configurado)
    const limite = await c.env.DB.prepare(`
      SELECT * FROM limites_aprovacao_compra 
      WHERE empresa_id = ? AND ativo = 1 AND valor_maximo >= ?
      ORDER BY valor_maximo ASC LIMIT 1
    `).bind(pedido.empresa_id, pedido.valor_total).first();

    if (limite) {
      // Precisa de aprovação
      await c.env.DB.prepare(`
        UPDATE pedidos_compra SET status = 'aguardando_aprovacao', valor_limite_aprovacao = ?, updated_at = ?
        WHERE id = ?
      `).bind(pedido.valor_total, now, id).run();

      return c.json({
        success: true,
        message: 'Pedido enviado para aprovação'
      });
    } else {
      // Não precisa de aprovação, aprovar automaticamente
      await c.env.DB.prepare(`
        UPDATE pedidos_compra SET status = 'aprovado', data_aprovacao = ?, updated_at = ?
        WHERE id = ?
      `).bind(now, now, id).run();

      return c.json({
        success: true,
        message: 'Pedido aprovado automaticamente (sem limite de aprovação configurado)'
      });
    }
  } catch (error: unknown) {
    console.error('Erro ao enviar para aprovação:', error);
    return c.json({ success: false, error: 'Erro ao enviar para aprovação' }, 500);
  }
});

// POST /compras/pedidos/:id/aprovar - Aprovar pedido
compras.post('/pedidos/:id/aprovar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      aprovador_id: string;
      aprovador_nome?: string;
      motivo?: string;
    }>();

    const pedido = await c.env.DB.prepare(`
      SELECT * FROM pedidos_compra WHERE id = ?
    `).bind(id).first<{ status: string; valor_total: number }>();

    if (!pedido) {
      return c.json({ success: false, error: 'Pedido não encontrado' }, 404);
    }

    if (pedido.status !== 'aguardando_aprovacao') {
      return c.json({ success: false, error: 'Pedido não está aguardando aprovação' }, 400);
    }

    const now = new Date().toISOString();

    // Registrar aprovação
    await c.env.DB.prepare(`
      INSERT INTO pedidos_compra_aprovacoes (
        id, pedido_id, aprovador_id, aprovador_nome, decisao, motivo, valor_pedido, created_at
      ) VALUES (?, ?, ?, ?, 'aprovado', ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, body.aprovador_id, body.aprovador_nome || null,
      body.motivo || null, pedido.valor_total, now
    ).run();

    // Atualizar pedido
    await c.env.DB.prepare(`
      UPDATE pedidos_compra SET 
        status = 'aprovado', aprovador_id = ?, aprovador_nome = ?, data_aprovacao = ?, updated_at = ?
      WHERE id = ?
    `).bind(body.aprovador_id, body.aprovador_nome || null, now, now, id).run();

    return c.json({
      success: true,
      message: 'Pedido aprovado com sucesso'
    });
  } catch (error: unknown) {
    console.error('Erro ao aprovar pedido:', error);
    return c.json({ success: false, error: 'Erro ao aprovar pedido' }, 500);
  }
});

// POST /compras/pedidos/:id/reprovar - Reprovar pedido
compras.post('/pedidos/:id/reprovar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      aprovador_id: string;
      aprovador_nome?: string;
      motivo: string;
    }>();

    if (!body.motivo) {
      return c.json({ success: false, error: 'Motivo da reprovação é obrigatório' }, 400);
    }

    const pedido = await c.env.DB.prepare(`
      SELECT * FROM pedidos_compra WHERE id = ?
    `).bind(id).first<{ status: string; valor_total: number }>();

    if (!pedido) {
      return c.json({ success: false, error: 'Pedido não encontrado' }, 404);
    }

    if (pedido.status !== 'aguardando_aprovacao') {
      return c.json({ success: false, error: 'Pedido não está aguardando aprovação' }, 400);
    }

    const now = new Date().toISOString();

    // Registrar reprovação
    await c.env.DB.prepare(`
      INSERT INTO pedidos_compra_aprovacoes (
        id, pedido_id, aprovador_id, aprovador_nome, decisao, motivo, valor_pedido, created_at
      ) VALUES (?, ?, ?, ?, 'reprovado', ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, body.aprovador_id, body.aprovador_nome || null,
      body.motivo, pedido.valor_total, now
    ).run();

    // Atualizar pedido
    await c.env.DB.prepare(`
      UPDATE pedidos_compra SET status = 'reprovado', motivo_reprovacao = ?, updated_at = ?
      WHERE id = ?
    `).bind(body.motivo, now, id).run();

    return c.json({
      success: true,
      message: 'Pedido reprovado'
    });
  } catch (error: unknown) {
    console.error('Erro ao reprovar pedido:', error);
    return c.json({ success: false, error: 'Erro ao reprovar pedido' }, 500);
  }
});

// POST /compras/pedidos/:id/enviar - Enviar pedido ao fornecedor
compras.post('/pedidos/:id/enviar', async (c) => {
  const { id } = c.req.param();

  try {
    const pedido = await c.env.DB.prepare(`
      SELECT * FROM pedidos_compra WHERE id = ?
    `).bind(id).first<{ status: string }>();

    if (!pedido) {
      return c.json({ success: false, error: 'Pedido não encontrado' }, 404);
    }

    if (pedido.status !== 'aprovado') {
      return c.json({ success: false, error: 'Apenas pedidos aprovados podem ser enviados' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE pedidos_compra SET status = 'enviado', updated_at = ? WHERE id = ?
    `).bind(now, id).run();

    return c.json({
      success: true,
      message: 'Pedido enviado ao fornecedor'
    });
  } catch (error: unknown) {
    console.error('Erro ao enviar pedido:', error);
    return c.json({ success: false, error: 'Erro ao enviar pedido' }, 500);
  }
});

// =============================================
// RECEBIMENTOS
// =============================================

// GET /compras/recebimentos - Listar recebimentos
compras.get('/recebimentos', async (c) => {
  const { status, pedido_id, limit = '50', offset = '0' } = c.req.query();

  try {
    let query = `
      SELECT r.*, f.razao_social as fornecedor_razao_social
      FROM recebimentos_compra r
      LEFT JOIN fornecedores f ON f.id = r.fornecedor_id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }
    if (pedido_id) {
      query += ` AND r.pedido_id = ?`;
      params.push(pedido_id);
    }

    query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: result.results });
  } catch (error: unknown) {
    console.error('Erro ao listar recebimentos:', error);
    return c.json({ success: false, error: 'Erro ao listar recebimentos' }, 500);
  }
});

// POST /compras/recebimentos - Criar recebimento (importar NF-e)
compras.post('/recebimentos', async (c) => {
  try {
    const body = await c.req.json<{
      empresa_id: string;
      filial_id?: string;
      pedido_id?: string;
      fornecedor_id: string;
      nfe_chave?: string;
      nfe_numero?: string;
      nfe_serie?: string;
      nfe_data_emissao?: string;
      nfe_valor_total?: number;
      conferente_id?: string;
      conferente_nome?: string;
      observacao?: string;
      itens: Array<{
        pedido_item_id?: string;
        produto_id: string;
        produto_codigo?: string;
        produto_descricao?: string;
        unidade?: string;
        quantidade_nfe: number;
        valor_unitario: number;
      }>;
    }>();

    if (!body.empresa_id || !body.fornecedor_id || !body.itens || body.itens.length === 0) {
      return c.json({ success: false, error: 'Empresa, fornecedor e itens são obrigatórios' }, 400);
    }

    // Buscar dados do fornecedor
    const fornecedor = await c.env.DB.prepare(`
      SELECT razao_social FROM fornecedores WHERE id = ?
    `).bind(body.fornecedor_id).first<{ razao_social: string }>();

    // Obter próximo número
    const maxNumero = await c.env.DB.prepare(`
      SELECT MAX(numero) as max FROM recebimentos_compra WHERE empresa_id = ?
    `).bind(body.empresa_id).first<{ max: number }>();
    const numero = (maxNumero?.max || 0) + 1;

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    // Calcular valor total
    let valorTotal = 0;
    for (const item of body.itens) {
      valorTotal += item.quantidade_nfe * item.valor_unitario;
    }

    // Inserir recebimento
    await c.env.DB.prepare(`
      INSERT INTO recebimentos_compra (
        id, empresa_id, filial_id, numero, data_recebimento, pedido_id,
        nfe_chave, nfe_numero, nfe_serie, nfe_data_emissao, nfe_valor_total,
        fornecedor_id, fornecedor_nome, conferente_id, conferente_nome,
        status, valor_total_nfe, observacao, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'em_conferencia', ?, ?, ?, ?)
    `).bind(
      id, body.empresa_id, body.filial_id || null, numero, now.split('T')[0],
      body.pedido_id || null, body.nfe_chave || null, body.nfe_numero || null,
      body.nfe_serie || null, body.nfe_data_emissao || null, body.nfe_valor_total || valorTotal,
      body.fornecedor_id, fornecedor?.razao_social || null, body.conferente_id || null,
      body.conferente_nome || null, valorTotal, body.observacao || null, now, now
    ).run();

    // Inserir itens
    for (const item of body.itens) {
      await c.env.DB.prepare(`
        INSERT INTO recebimentos_compra_itens (
          id, recebimento_id, pedido_item_id, produto_id, produto_codigo,
          produto_descricao, unidade, quantidade_nfe, valor_unitario, valor_total, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, item.pedido_item_id || null, item.produto_id,
        item.produto_codigo || null, item.produto_descricao || null, item.unidade || null,
        item.quantidade_nfe, item.valor_unitario, item.quantidade_nfe * item.valor_unitario, now
      ).run();
    }

    return c.json({
      success: true,
      data: { id, numero },
      message: `Recebimento ${numero} criado para conferência`
    });
  } catch (error: unknown) {
    console.error('Erro ao criar recebimento:', error);
    return c.json({ success: false, error: 'Erro ao criar recebimento' }, 500);
  }
});

// POST /compras/recebimentos/:id/conferir - Conferir item
compras.post('/recebimentos/:id/conferir', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      item_id: string;
      quantidade_conferida: number;
      quantidade_aceita: number;
      divergencia?: {
        tipo: string;
        descricao?: string;
        acao?: string;
      };
    }>();

    const now = new Date().toISOString();

    // Buscar item
    const item = await c.env.DB.prepare(`
      SELECT * FROM recebimentos_compra_itens WHERE id = ? AND recebimento_id = ?
    `).bind(body.item_id, id).first<{ quantidade_nfe: number }>();

    if (!item) {
      return c.json({ success: false, error: 'Item não encontrado' }, 404);
    }

    // Atualizar item
    await c.env.DB.prepare(`
      UPDATE recebimentos_compra_itens SET
        quantidade_conferida = ?, quantidade_aceita = ?, conferido = 1
      WHERE id = ?
    `).bind(body.quantidade_conferida, body.quantidade_aceita, body.item_id).run();

    // Registrar divergência se houver
    if (body.divergencia && body.quantidade_conferida !== item.quantidade_nfe) {
      await c.env.DB.prepare(`
        INSERT INTO recebimentos_divergencias (
          id, recebimento_id, recebimento_item_id, tipo,
          quantidade_esperada, quantidade_recebida, quantidade_divergente,
          descricao, acao, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?)
      `).bind(
        crypto.randomUUID(), id, body.item_id, body.divergencia.tipo,
        item.quantidade_nfe, body.quantidade_conferida,
        Math.abs(item.quantidade_nfe - body.quantidade_conferida),
        body.divergencia.descricao || null, body.divergencia.acao || null, now, now
      ).run();

      // Marcar recebimento com divergência
      await c.env.DB.prepare(`
        UPDATE recebimentos_compra SET tem_divergencia = 1, updated_at = ? WHERE id = ?
      `).bind(now, id).run();
    }

    return c.json({
      success: true,
      message: 'Item conferido'
    });
  } catch (error: unknown) {
    console.error('Erro ao conferir item:', error);
    return c.json({ success: false, error: 'Erro ao conferir item' }, 500);
  }
});

// POST /compras/recebimentos/:id/finalizar - Finalizar recebimento
compras.post('/recebimentos/:id/finalizar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      gerar_entrada_estoque?: boolean;
      gerar_contas_pagar?: boolean;
    }>();

    const recebimento = await c.env.DB.prepare(`
      SELECT * FROM recebimentos_compra WHERE id = ?
    `).bind(id).first<{
      empresa_id: string;
      filial_id: string;
      pedido_id: string;
      fornecedor_id: string;
      nfe_numero: string;
      tem_divergencia: number;
      valor_total_nfe: number;
    }>();

    if (!recebimento) {
      return c.json({ success: false, error: 'Recebimento não encontrado' }, 404);
    }

    const now = new Date().toISOString();

    // Verificar se todos os itens foram conferidos
    const itensNaoConferidos = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM recebimentos_compra_itens WHERE recebimento_id = ? AND conferido = 0
    `).bind(id).first<{ count: number }>();

    if (itensNaoConferidos && itensNaoConferidos.count > 0) {
      return c.json({ success: false, error: `Ainda há ${itensNaoConferidos.count} itens não conferidos` }, 400);
    }

    // Calcular valor total conferido
    const totalConferido = await c.env.DB.prepare(`
      SELECT SUM(quantidade_aceita * valor_unitario) as total FROM recebimentos_compra_itens WHERE recebimento_id = ?
    `).bind(id).first<{ total: number }>();

    // Atualizar status do recebimento
    const status = recebimento.tem_divergencia ? 'com_divergencia' : 'conferido';
    await c.env.DB.prepare(`
      UPDATE recebimentos_compra SET 
        status = ?, conferencia_ok = ?, valor_total_conferido = ?, updated_at = ?
      WHERE id = ?
    `).bind(status, recebimento.tem_divergencia ? 0 : 1, totalConferido?.total || 0, now, id).run();

    // Atualizar quantidades recebidas no pedido
    if (recebimento.pedido_id) {
      const itensRecebimento = await c.env.DB.prepare(`
        SELECT pedido_item_id, quantidade_aceita FROM recebimentos_compra_itens 
        WHERE recebimento_id = ? AND pedido_item_id IS NOT NULL
      `).bind(id).all<{ pedido_item_id: string; quantidade_aceita: number }>();

      for (const item of (itensRecebimento.results || [])) {
        await c.env.DB.prepare(`
          UPDATE pedidos_compra_itens SET quantidade_recebida = quantidade_recebida + ? WHERE id = ?
        `).bind(item.quantidade_aceita, item.pedido_item_id).run();
      }

      // Verificar se pedido foi totalmente recebido
      const pedidoItens = await c.env.DB.prepare(`
        SELECT SUM(quantidade) as total, SUM(quantidade_recebida) as recebido FROM pedidos_compra_itens WHERE pedido_id = ?
      `).bind(recebimento.pedido_id).first<{ total: number; recebido: number }>();

      if (pedidoItens) {
        const statusPedido = pedidoItens.recebido >= pedidoItens.total ? 'recebido' : 'parcialmente_recebido';
        await c.env.DB.prepare(`
          UPDATE pedidos_compra SET status = ?, updated_at = ? WHERE id = ?
        `).bind(statusPedido, now, recebimento.pedido_id).run();
      }
    }

    // Gerar contas a pagar se solicitado
    if (body.gerar_contas_pagar) {
      const contaId = crypto.randomUUID();
      const dataVencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await c.env.DB.prepare(`
        INSERT INTO contas_pagar (
          id, empresa_id, filial_id, fornecedor_id, documento, tipo,
          valor, valor_original, data_emissao, data_vencimento, status,
          observacao, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'nfe', ?, ?, ?, ?, 'aberto', ?, ?, ?)
      `).bind(
        contaId, recebimento.empresa_id, recebimento.filial_id || null,
        recebimento.fornecedor_id, recebimento.nfe_numero || `REC-${id.substring(0, 8)}`,
        totalConferido?.total || recebimento.valor_total_nfe,
        totalConferido?.total || recebimento.valor_total_nfe,
        now.split('T')[0], dataVencimento,
        `Ref. Recebimento ${id.substring(0, 8)}`, now, now
      ).run();
    }

    // Finalizar recebimento
    await c.env.DB.prepare(`
      UPDATE recebimentos_compra SET status = 'finalizado', updated_at = ? WHERE id = ?
    `).bind(now, id).run();

    return c.json({
      success: true,
      message: 'Recebimento finalizado com sucesso'
    });
  } catch (error: unknown) {
    console.error('Erro ao finalizar recebimento:', error);
    return c.json({ success: false, error: 'Erro ao finalizar recebimento' }, 500);
  }
});

// GET /compras/recebimentos/:id/divergencias - Listar divergências
compras.get('/recebimentos/:id/divergencias', async (c) => {
  const { id } = c.req.param();

  try {
    const divergencias = await c.env.DB.prepare(`
      SELECT d.*, ri.produto_descricao
      FROM recebimentos_divergencias d
      LEFT JOIN recebimentos_compra_itens ri ON ri.id = d.recebimento_item_id
      WHERE d.recebimento_id = ?
      ORDER BY d.created_at DESC
    `).bind(id).all();

    return c.json({ success: true, data: divergencias.results });
  } catch (error: unknown) {
    console.error('Erro ao listar divergências:', error);
    return c.json({ success: false, error: 'Erro ao listar divergências' }, 500);
  }
});

// POST /compras/divergencias/:id/resolver - Resolver divergência
compras.post('/divergencias/:id/resolver', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      acao: string;
      acao_descricao?: string;
      resolucao_descricao: string;
    }>();

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE recebimentos_divergencias SET
        acao = ?, acao_descricao = ?, status = 'resolvida',
        data_resolucao = ?, resolucao_descricao = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.acao, body.acao_descricao || null, now,
      body.resolucao_descricao, now, id
    ).run();

    return c.json({
      success: true,
      message: 'Divergência resolvida'
    });
  } catch (error: unknown) {
    console.error('Erro ao resolver divergência:', error);
    return c.json({ success: false, error: 'Erro ao resolver divergência' }, 500);
  }
});

// =============================================
// DASHBOARD DE COMPRAS
// =============================================

compras.get('/dashboard', async (c) => {
  const { empresa_id } = c.req.query();

  try {
    let whereClause = '';
    const params: string[] = [];

    if (empresa_id) {
      whereClause = ' WHERE empresa_id = ?';
      params.push(empresa_id);
    }

    // Solicitações pendentes
    const solicitacoesPendentes = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM solicitacoes_compra${whereClause} ${whereClause ? 'AND' : 'WHERE'} status = 'pendente'
    `).bind(...params).first<{ count: number }>();

    // Cotações abertas
    const cotacoesAbertas = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM cotacoes_compra${whereClause} ${whereClause ? 'AND' : 'WHERE'} status IN ('aberta', 'em_analise')
    `).bind(...params).first<{ count: number }>();

    // Pedidos aguardando aprovação
    const pedidosAguardando = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM pedidos_compra${whereClause} ${whereClause ? 'AND' : 'WHERE'} status = 'aguardando_aprovacao'
    `).bind(...params).first<{ count: number }>();

    // Pedidos enviados (aguardando entrega)
    const pedidosEnviados = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM pedidos_compra${whereClause} ${whereClause ? 'AND' : 'WHERE'} status IN ('enviado', 'confirmado')
    `).bind(...params).first<{ count: number }>();

    // Recebimentos em conferência
    const recebimentosConferencia = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM recebimentos_compra${whereClause} ${whereClause ? 'AND' : 'WHERE'} status = 'em_conferencia'
    `).bind(...params).first<{ count: number }>();

    // Divergências pendentes
    const divergenciasPendentes = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM recebimentos_divergencias WHERE status = 'pendente'
    `).first<{ count: number }>();

    // Valor total em pedidos do mês
    const inicioMes = new Date();
    inicioMes.setDate(1);
    const valorPedidosMes = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(valor_total), 0) as total FROM pedidos_compra${whereClause} 
      ${whereClause ? 'AND' : 'WHERE'} data_emissao >= ? AND status NOT IN ('cancelado', 'reprovado')
    `).bind(...params, inicioMes.toISOString().split('T')[0]).first<{ total: number }>();

    return c.json({
      success: true,
      data: {
        solicitacoes_pendentes: solicitacoesPendentes?.count || 0,
        cotacoes_abertas: cotacoesAbertas?.count || 0,
        pedidos_aguardando_aprovacao: pedidosAguardando?.count || 0,
        pedidos_aguardando_entrega: pedidosEnviados?.count || 0,
        recebimentos_em_conferencia: recebimentosConferencia?.count || 0,
        divergencias_pendentes: divergenciasPendentes?.count || 0,
        valor_pedidos_mes: valorPedidosMes?.total || 0
      }
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar dashboard:', error);
    return c.json({ success: false, error: 'Erro ao buscar dashboard' }, 500);
  }
});

export default compras;
