// =============================================
// TRAILSYSTEM ERP - Rotas de Entregas Fracionadas
// Gerenciamento de entregas parciais de pedidos de venda
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const entregas = new Hono<{ Bindings: Env }>();

// =============================================
// GET /entregas - Listar entregas pendentes
// =============================================
entregas.get('/', async (c) => {
  const { pedido_id, status, data_inicio, data_fim, empresa_id } = c.req.query();

  try {
    let query = `
      SELECT 
        e.*,
        pv.numero as pedido_numero,
        pv.cliente_id,
        pv.cliente_nome,
        pv.vendedor_nome,
        (SELECT COUNT(*) FROM pedidos_venda_entregas_itens WHERE entrega_id = e.id) as qtd_itens
      FROM pedidos_venda_entregas e
      JOIN pedidos_venda pv ON pv.id = e.pedido_venda_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (empresa_id) {
      query += ` AND pv.empresa_id = ?`;
      params.push(empresa_id);
    }

    if (pedido_id) {
      query += ` AND e.pedido_venda_id = ?`;
      params.push(pedido_id);
    }

    if (status) {
      query += ` AND e.status = ?`;
      params.push(status);
    }

    if (data_inicio) {
      query += ` AND e.data_prevista >= ?`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND e.data_prevista <= ?`;
      params.push(data_fim);
    }

    query += ` ORDER BY e.data_prevista ASC, e.created_at ASC`;

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: result.results
    });
  } catch (error: any) {
    console.error('Erro ao listar entregas:', error);
    return c.json({ success: false, error: 'Erro ao listar entregas' }, 500);
  }
});

// =============================================
// GET /entregas/:id - Buscar entrega com itens
// =============================================
entregas.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const entrega = await c.env.DB.prepare(`
      SELECT 
        e.*,
        pv.numero as pedido_numero,
        pv.cliente_id,
        pv.cliente_nome,
        pv.vendedor_nome,
        pv.endereco_entrega_logradouro,
        pv.endereco_entrega_numero,
        pv.endereco_entrega_bairro,
        pv.endereco_entrega_cidade,
        pv.endereco_entrega_uf,
        pv.endereco_entrega_cep
      FROM pedidos_venda_entregas e
      JOIN pedidos_venda pv ON pv.id = e.pedido_venda_id
      WHERE e.id = ?
    `).bind(id).first();

    if (!entrega) {
      return c.json({ success: false, error: 'Entrega não encontrada' }, 404);
    }

    const itens = await c.env.DB.prepare(`
      SELECT 
        ei.*,
        pvi.produto_id,
        pvi.produto_codigo,
        pvi.produto_nome,
        pvi.preco_unitario,
        pvi.quantidade as quantidade_pedido
      FROM pedidos_venda_entregas_itens ei
      JOIN pedidos_venda_itens pvi ON pvi.id = ei.item_id
      WHERE ei.entrega_id = ?
    `).bind(id).all();

    return c.json({
      success: true,
      data: { ...entrega, itens: itens.results }
    });
  } catch (error: any) {
    console.error('Erro ao buscar entrega:', error);
    return c.json({ success: false, error: 'Erro ao buscar entrega' }, 500);
  }
});

// =============================================
// POST /entregas - Criar nova entrega fracionada
// =============================================
entregas.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      pedido_venda_id: string;
      data_prevista: string;
      forma_financeiro?: string;
      itens: Array<{
        item_id: string;
        quantidade: number;
      }>;
      observacao?: string;
    }>();

    if (!body.pedido_venda_id) {
      return c.json({ success: false, error: 'Pedido de venda obrigatório' }, 400);
    }

    if (!body.itens || body.itens.length === 0) {
      return c.json({ success: false, error: 'Selecione pelo menos um item' }, 400);
    }

    // Buscar pedido
    const pedido = await c.env.DB.prepare(`
      SELECT * FROM pedidos_venda WHERE id = ?
    `).bind(body.pedido_venda_id).first<any>();

    if (!pedido) {
      return c.json({ success: false, error: 'Pedido não encontrado' }, 404);
    }

    // Contar entregas existentes para gerar número
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM pedidos_venda_entregas WHERE pedido_venda_id = ?
    `).bind(body.pedido_venda_id).first<{ total: number }>();

    const numeroEntrega = `.E${(countResult?.total || 0) + 1}`;

    // Calcular valor da entrega
    let valorProdutos = 0;
    for (const item of body.itens) {
      const itemPedido = await c.env.DB.prepare(`
        SELECT preco_unitario FROM pedidos_venda_itens WHERE id = ?
      `).bind(item.item_id).first<{ preco_unitario: number }>();
      
      if (itemPedido) {
        valorProdutos += item.quantidade * itemPedido.preco_unitario;
      }
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Criar entrega
    await c.env.DB.prepare(`
      INSERT INTO pedidos_venda_entregas (
        id, pedido_venda_id, numero, status, data_prevista,
        valor_produtos, valor_total, forma_financeiro, observacao,
        created_at, updated_at
      ) VALUES (?, ?, ?, 'pendente', ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.pedido_venda_id, numeroEntrega, body.data_prevista,
      valorProdutos, valorProdutos, body.forma_financeiro || 'proporcional',
      body.observacao || null, now, now
    ).run();

    // Criar itens da entrega
    const itemStatements = body.itens.map(item => {
      return c.env.DB.prepare(`
        INSERT INTO pedidos_venda_entregas_itens (
          id, entrega_id, item_id, quantidade, created_at
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), id, item.item_id, item.quantidade, now);
    });

    if (itemStatements.length > 0) {
      await c.env.DB.batch(itemStatements);
    }

    return c.json({
      success: true,
      data: { id, numero: numeroEntrega },
      message: 'Entrega criada com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar entrega:', error);
    return c.json({ success: false, error: 'Erro ao criar entrega' }, 500);
  }
});

// =============================================
// POST /entregas/:id/separar - Iniciar separação
// =============================================
entregas.post('/:id/separar', async (c) => {
  const { id } = c.req.param();

  try {
    const entrega = await c.env.DB.prepare(`
      SELECT status FROM pedidos_venda_entregas WHERE id = ?
    `).bind(id).first<{ status: string }>();

    if (!entrega) {
      return c.json({ success: false, error: 'Entrega não encontrada' }, 404);
    }

    if (entrega.status !== 'pendente') {
      return c.json({ success: false, error: 'Entrega não está pendente' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE pedidos_venda_entregas 
      SET status = 'separando', data_separacao = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Separação iniciada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao iniciar separação' }, 500);
  }
});

// =============================================
// POST /entregas/:id/confirmar-separacao - Confirmar separação
// =============================================
entregas.post('/:id/confirmar-separacao', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      itens?: Array<{ item_id: string; quantidade_separada: number }>;
    }>();

    const entrega = await c.env.DB.prepare(`
      SELECT status FROM pedidos_venda_entregas WHERE id = ?
    `).bind(id).first<{ status: string }>();

    if (!entrega) {
      return c.json({ success: false, error: 'Entrega não encontrada' }, 404);
    }

    if (entrega.status !== 'separando') {
      return c.json({ success: false, error: 'Entrega não está em separação' }, 400);
    }

    // Atualizar quantidades separadas se informadas
    if (body.itens && body.itens.length > 0) {
      const updateStatements = body.itens.map(item => {
        return c.env.DB.prepare(`
          UPDATE pedidos_venda_entregas_itens 
          SET quantidade_separada = ?
          WHERE entrega_id = ? AND item_id = ?
        `).bind(item.quantidade_separada, id, item.item_id);
      });
      await c.env.DB.batch(updateStatements);
    } else {
      // Se não informou, assume que separou tudo
      await c.env.DB.prepare(`
        UPDATE pedidos_venda_entregas_itens 
        SET quantidade_separada = quantidade
        WHERE entrega_id = ?
      `).bind(id).run();
    }

    await c.env.DB.prepare(`
      UPDATE pedidos_venda_entregas 
      SET status = 'separado', updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Separação confirmada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao confirmar separação' }, 500);
  }
});

// =============================================
// POST /entregas/:id/faturar - Faturar entrega (emitir NF-e)
// =============================================
entregas.post('/:id/faturar', async (c) => {
  const { id } = c.req.param();

  try {
    const entrega = await c.env.DB.prepare(`
      SELECT e.*, pv.empresa_id, pv.filial_id, pv.cliente_id
      FROM pedidos_venda_entregas e
      JOIN pedidos_venda pv ON pv.id = e.pedido_venda_id
      WHERE e.id = ?
    `).bind(id).first<any>();

    if (!entrega) {
      return c.json({ success: false, error: 'Entrega não encontrada' }, 404);
    }

    if (entrega.status !== 'separado') {
      return c.json({ success: false, error: 'Entrega precisa estar separada para faturar' }, 400);
    }

    // TODO: Integrar com emissão de NF-e
    // Por enquanto, apenas atualiza o status

    await c.env.DB.prepare(`
      UPDATE pedidos_venda_entregas 
      SET status = 'faturado', data_faturamento = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    // Gerar contas a receber se forma_financeiro = 'proporcional'
    if (entrega.forma_financeiro === 'proporcional' && !entrega.financeiro_gerado) {
      const contaId = crypto.randomUUID();
      const now = new Date().toISOString();
      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 30);

      await c.env.DB.prepare(`
        INSERT INTO contas_receber (
          id, empresa_id, filial_id, numero, cliente_id, descricao,
          valor_original, valor_saldo, data_emissao, data_vencimento,
          status, pedido_venda_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ABERTO', ?, ?, ?)
      `).bind(
        contaId, entrega.empresa_id, entrega.filial_id,
        `ENT-${entrega.numero}`, entrega.cliente_id,
        `Entrega ${entrega.numero} - Pedido ${entrega.pedido_venda_id}`,
        entrega.valor_total, entrega.valor_total,
        now.split('T')[0], vencimento.toISOString().split('T')[0],
        entrega.pedido_venda_id, now, now
      ).run();

      await c.env.DB.prepare(`
        UPDATE pedidos_venda_entregas SET financeiro_gerado = 1 WHERE id = ?
      `).bind(id).run();
    }

    return c.json({ success: true, message: 'Entrega faturada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao faturar entrega:', error);
    return c.json({ success: false, error: 'Erro ao faturar entrega' }, 500);
  }
});

// =============================================
// POST /entregas/:id/expedir - Expedir entrega
// =============================================
entregas.post('/:id/expedir', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      transportadora_id?: string;
      volumes?: number;
      peso_bruto?: number;
      peso_liquido?: number;
    }>();

    const entrega = await c.env.DB.prepare(`
      SELECT status FROM pedidos_venda_entregas WHERE id = ?
    `).bind(id).first<{ status: string }>();

    if (!entrega) {
      return c.json({ success: false, error: 'Entrega não encontrada' }, 404);
    }

    if (entrega.status !== 'faturado') {
      return c.json({ success: false, error: 'Entrega precisa estar faturada para expedir' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE pedidos_venda_entregas 
      SET status = 'em_transito', 
          data_expedicao = datetime('now'),
          transportadora_id = COALESCE(?, transportadora_id),
          volumes = COALESCE(?, volumes),
          peso_bruto = COALESCE(?, peso_bruto),
          peso_liquido = COALESCE(?, peso_liquido),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.transportadora_id || null,
      body.volumes || null,
      body.peso_bruto || null,
      body.peso_liquido || null,
      id
    ).run();

    return c.json({ success: true, message: 'Entrega expedida' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao expedir entrega' }, 500);
  }
});

// =============================================
// POST /entregas/:id/confirmar-entrega - Confirmar entrega realizada
// =============================================
entregas.post('/:id/confirmar-entrega', async (c) => {
  const { id } = c.req.param();

  try {
    const entrega = await c.env.DB.prepare(`
      SELECT e.*, pv.id as pedido_id
      FROM pedidos_venda_entregas e
      JOIN pedidos_venda pv ON pv.id = e.pedido_venda_id
      WHERE e.id = ?
    `).bind(id).first<any>();

    if (!entrega) {
      return c.json({ success: false, error: 'Entrega não encontrada' }, 404);
    }

    if (entrega.status !== 'em_transito' && entrega.status !== 'faturado') {
      return c.json({ success: false, error: 'Entrega não está em trânsito' }, 400);
    }

    // Atualizar quantidades entregues
    await c.env.DB.prepare(`
      UPDATE pedidos_venda_entregas_itens 
      SET quantidade_entregue = quantidade_separada
      WHERE entrega_id = ?
    `).bind(id).run();

    await c.env.DB.prepare(`
      UPDATE pedidos_venda_entregas 
      SET status = 'entregue', data_entrega = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    // Verificar se todas as entregas do pedido foram concluídas
    const pendentes = await c.env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM pedidos_venda_entregas 
      WHERE pedido_venda_id = ? AND status NOT IN ('entregue', 'cancelado')
    `).bind(entrega.pedido_id).first<{ total: number }>();

    if (pendentes?.total === 0) {
      // Todas entregas concluídas, atualizar pedido
      await c.env.DB.prepare(`
        UPDATE pedidos_venda 
        SET status = 'entregue', data_entrega_realizada = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).bind(entrega.pedido_id).run();
    }

    return c.json({ success: true, message: 'Entrega confirmada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao confirmar entrega' }, 500);
  }
});

// =============================================
// DELETE /entregas/:id - Cancelar entrega
// =============================================
entregas.delete('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const entrega = await c.env.DB.prepare(`
      SELECT status FROM pedidos_venda_entregas WHERE id = ?
    `).bind(id).first<{ status: string }>();

    if (!entrega) {
      return c.json({ success: false, error: 'Entrega não encontrada' }, 404);
    }

    if (entrega.status === 'faturado' || entrega.status === 'entregue') {
      return c.json({ success: false, error: 'Entrega já faturada/entregue não pode ser cancelada' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE pedidos_venda_entregas 
      SET status = 'cancelado', updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Entrega cancelada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao cancelar entrega' }, 500);
  }
});

export default entregas;
