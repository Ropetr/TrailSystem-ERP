// ============================================
// PLANAC ERP - Rotas de Consignações
// Bloco 3 - Pós-venda
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const consignacoes = new Hono<{ Bindings: Env }>();

// Schemas
const consignacaoSchema = z.object({
  cliente_id: z.string().uuid(),
  vendedor_id: z.string().uuid().optional(),
  data_envio: z.string(),
  data_retorno_prevista: z.string(),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    produto_id: z.string().uuid(),
    quantidade: z.number().int().min(1),
    valor_unitario: z.number().min(0),
    observacao: z.string().optional()
  })).min(1)
});

const retornoItemSchema = z.object({
  consignacao_item_id: z.string().uuid(),
  quantidade_vendida: z.number().int().min(0),
  quantidade_devolvida: z.number().int().min(0),
  observacao: z.string().optional()
});

// GET /api/consignacoes - Listar consignações
consignacoes.get('/', async (c) => {
  const empresaId = c.get('empresaId');
  const { cliente_id, vendedor_id, status, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT con.*, c.razao_social as cliente_nome, v.nome as vendedor_nome,
               (SELECT COUNT(*) FROM consignacoes_itens WHERE consignacao_id = con.id) as total_itens,
               (SELECT SUM(quantidade * valor_unitario) FROM consignacoes_itens WHERE consignacao_id = con.id) as valor_total
               FROM consignacoes con
               JOIN clientes c ON con.cliente_id = c.id
               LEFT JOIN vendedores v ON con.vendedor_id = v.id
               WHERE con.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (cliente_id) {
    query += ` AND con.cliente_id = ?`;
    params.push(cliente_id);
  }
  
  if (vendedor_id) {
    query += ` AND con.vendedor_id = ?`;
    params.push(vendedor_id);
  }
  
  if (status) {
    query += ` AND con.status = ?`;
    params.push(status);
  }
  
  // Contagem
  const countQuery = query.replace(/SELECT con\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY con.data_envio DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: result.results,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: countResult?.total || 0
    }
  });
});

// GET /api/consignacoes/:id - Buscar consignação com itens
consignacoes.get('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const consignacao = await c.env.DB.prepare(`
    SELECT con.*, c.razao_social as cliente_nome, c.telefone as cliente_telefone,
           v.nome as vendedor_nome
    FROM consignacoes con
    JOIN clientes c ON con.cliente_id = c.id
    LEFT JOIN vendedores v ON con.vendedor_id = v.id
    WHERE con.id = ? AND con.empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!consignacao) {
    return c.json({ error: 'Consignação não encontrada' }, 404);
  }
  
  // Buscar itens
  const itens = await c.env.DB.prepare(`
    SELECT ci.*, p.descricao as produto_descricao, p.codigo as produto_codigo,
           (ci.quantidade * ci.valor_unitario) as valor_total
    FROM consignacoes_itens ci
    JOIN produtos p ON ci.produto_id = p.id
    WHERE ci.consignacao_id = ?
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: {
      ...consignacao,
      itens: itens.results
    }
  });
});

// POST /api/consignacoes - Criar consignação
consignacoes.post('/', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const validation = consignacaoSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const { cliente_id, vendedor_id, data_envio, data_retorno_prevista, observacoes, itens } = validation.data;
  
  // Gerar número da consignação
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM consignacoes WHERE empresa_id = ?
  `).bind(empresaId).first();
  const numero = `CON${String(((countResult?.total as number) || 0) + 1).padStart(6, '0')}`;
  
  const id = crypto.randomUUID();
  
  // Criar consignação
  await c.env.DB.prepare(`
    INSERT INTO consignacoes (id, empresa_id, numero, cliente_id, vendedor_id, data_envio,
                              data_retorno_prevista, observacoes, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ENVIADA', ?)
  `).bind(id, empresaId, numero, cliente_id, vendedor_id || null, data_envio,
          data_retorno_prevista, observacoes || null, usuarioId).run();
  
  // Criar itens e reservar estoque
  for (const item of itens) {
    const itemId = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO consignacoes_itens (id, consignacao_id, produto_id, quantidade, valor_unitario, observacao)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(itemId, id, item.produto_id, item.quantidade, item.valor_unitario, item.observacao || null).run();
    
    // Reservar estoque (criar movimentação de saída tipo CONSIGNACAO)
    const movId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO estoque_movimentacoes (id, empresa_id, produto_id, tipo, quantidade, 
                                         motivo, documento_tipo, documento_id, created_by)
      VALUES (?, ?, ?, 'SAIDA', ?, 'CONSIGNACAO', 'CONSIGNACAO', ?, ?)
    `).bind(movId, empresaId, item.produto_id, item.quantidade, id, usuarioId).run();
  }
  
  return c.json({ id, numero, message: 'Consignação criada com sucesso' }, 201);
});

// POST /api/consignacoes/:id/retorno - Processar retorno de consignação
consignacoes.post('/:id/retorno', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    itens: z.array(retornoItemSchema),
    gerar_pedido: z.boolean().default(true),
    observacoes: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const consignacao = await c.env.DB.prepare(`
    SELECT id, status, cliente_id FROM consignacoes WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!consignacao) {
    return c.json({ error: 'Consignação não encontrada' }, 404);
  }
  
  if (consignacao.status !== 'ENVIADA') {
    return c.json({ error: 'Consignação já foi processada' }, 400);
  }
  
  let valorVendido = 0;
  const itensVendidos: any[] = [];
  
  for (const retorno of validation.data.itens) {
    // Buscar item da consignação
    const item = await c.env.DB.prepare(`
      SELECT ci.*, p.descricao as produto_descricao
      FROM consignacoes_itens ci
      JOIN produtos p ON ci.produto_id = p.id
      WHERE ci.id = ? AND ci.consignacao_id = ?
    `).bind(retorno.consignacao_item_id, id).first();
    
    if (!item) {
      return c.json({ error: `Item ${retorno.consignacao_item_id} não encontrado` }, 404);
    }
    
    // Validar quantidades
    const qtdTotal = retorno.quantidade_vendida + retorno.quantidade_devolvida;
    if (qtdTotal !== item.quantidade) {
      return c.json({ 
        error: `Quantidade inconsistente para ${item.produto_descricao}. Enviado: ${item.quantidade}, Retorno: ${qtdTotal}` 
      }, 400);
    }
    
    // Atualizar item
    await c.env.DB.prepare(`
      UPDATE consignacoes_itens SET quantidade_vendida = ?, quantidade_devolvida = ?,
                                    observacao_retorno = ?, data_retorno = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(retorno.quantidade_vendida, retorno.quantidade_devolvida, retorno.observacao || null, retorno.consignacao_item_id).run();
    
    // Se houve devolução, devolver ao estoque
    if (retorno.quantidade_devolvida > 0) {
      const movId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO estoque_movimentacoes (id, empresa_id, produto_id, tipo, quantidade,
                                           motivo, documento_tipo, documento_id, created_by)
        VALUES (?, ?, ?, 'ENTRADA', ?, 'RETORNO_CONSIGNACAO', 'CONSIGNACAO', ?, ?)
      `).bind(movId, empresaId, item.produto_id, retorno.quantidade_devolvida, id, usuarioId).run();
    }
    
    if (retorno.quantidade_vendida > 0) {
      valorVendido += retorno.quantidade_vendida * (item.valor_unitario as number);
      itensVendidos.push({
        produto_id: item.produto_id,
        quantidade: retorno.quantidade_vendida,
        valor_unitario: item.valor_unitario
      });
    }
  }
  
  // Atualizar consignação
  await c.env.DB.prepare(`
    UPDATE consignacoes SET status = 'RETORNADA', data_retorno = CURRENT_TIMESTAMP,
                           observacoes_retorno = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(validation.data.observacoes || null, id).run();
  
  let pedidoId = null;
  
  // Gerar pedido de venda se houver itens vendidos
  if (validation.data.gerar_pedido && itensVendidos.length > 0) {
    // Gerar número do pedido
    const countPedidos = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM pedidos WHERE empresa_id = ?
    `).bind(empresaId).first();
    const numeroPedido = `PED${String(((countPedidos?.total as number) || 0) + 1).padStart(6, '0')}`;
    
    pedidoId = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO pedidos (id, empresa_id, numero, cliente_id, origem, status, 
                           valor_total, observacoes, created_by)
      VALUES (?, ?, ?, ?, 'CONSIGNACAO', 'CONFIRMADO', ?, ?, ?)
    `).bind(pedidoId, empresaId, numeroPedido, consignacao.cliente_id, valorVendido,
            `Gerado a partir da consignação ${id}`, usuarioId).run();
    
    // Criar itens do pedido
    for (const item of itensVendidos) {
      const itemPedidoId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO pedidos_itens (id, pedido_id, produto_id, quantidade, valor_unitario, valor_total)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(itemPedidoId, pedidoId, item.produto_id, item.quantidade, 
              item.valor_unitario, item.quantidade * item.valor_unitario).run();
    }
    
    // Vincular pedido à consignação
    await c.env.DB.prepare(`
      UPDATE consignacoes SET pedido_gerado_id = ? WHERE id = ?
    `).bind(pedidoId, id).run();
  }
  
  return c.json({
    message: 'Retorno processado com sucesso',
    valor_vendido: valorVendido,
    pedido_id: pedidoId
  });
});

// GET /api/consignacoes/vencendo - Consignações próximas do vencimento
consignacoes.get('/vencendo', async (c) => {
  const empresaId = c.get('empresaId');
  const { dias = '7' } = c.req.query();
  
  const consignacoes_list = await c.env.DB.prepare(`
    SELECT con.*, c.razao_social as cliente_nome, c.telefone as cliente_telefone,
           julianday(con.data_retorno_prevista) - julianday(date('now')) as dias_restantes
    FROM consignacoes con
    JOIN clientes c ON con.cliente_id = c.id
    WHERE con.empresa_id = ?
      AND con.status = 'ENVIADA'
      AND con.data_retorno_prevista BETWEEN date('now') AND date('now', '+' || ? || ' days')
    ORDER BY con.data_retorno_prevista ASC
  `).bind(empresaId, dias).all();
  
  return c.json({
    success: true,
    data: consignacoes_list.results
  });
});

// GET /api/consignacoes/atrasadas - Consignações atrasadas
consignacoes.get('/atrasadas', async (c) => {
  const empresaId = c.get('empresaId');
  
  const consignacoes_list = await c.env.DB.prepare(`
    SELECT con.*, c.razao_social as cliente_nome, c.telefone as cliente_telefone,
           julianday(date('now')) - julianday(con.data_retorno_prevista) as dias_atraso
    FROM consignacoes con
    JOIN clientes c ON con.cliente_id = c.id
    WHERE con.empresa_id = ?
      AND con.status = 'ENVIADA'
      AND con.data_retorno_prevista < date('now')
    ORDER BY con.data_retorno_prevista ASC
  `).bind(empresaId).all();
  
  return c.json({
    success: true,
    data: consignacoes_list.results
  });
});

// POST /api/consignacoes/:id/cancelar - Cancelar consignação
consignacoes.post('/:id/cancelar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    motivo: z.string().min(1)
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Informe o motivo do cancelamento' }, 400);
  }
  
  const consignacao = await c.env.DB.prepare(`
    SELECT id, status FROM consignacoes WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!consignacao) {
    return c.json({ error: 'Consignação não encontrada' }, 404);
  }
  
  if (consignacao.status !== 'ENVIADA') {
    return c.json({ error: 'Só é possível cancelar consignações enviadas' }, 400);
  }
  
  // Devolver todos os itens ao estoque
  const itens = await c.env.DB.prepare(`
    SELECT produto_id, quantidade FROM consignacoes_itens WHERE consignacao_id = ?
  `).bind(id).all();
  
  for (const item of itens.results as any[]) {
    const movId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO estoque_movimentacoes (id, empresa_id, produto_id, tipo, quantidade,
                                         motivo, documento_tipo, documento_id, created_by)
      VALUES (?, ?, ?, 'ENTRADA', ?, 'CANCELAMENTO_CONSIGNACAO', 'CONSIGNACAO', ?, ?)
    `).bind(movId, empresaId, item.produto_id, item.quantidade, id, usuarioId).run();
  }
  
  await c.env.DB.prepare(`
    UPDATE consignacoes SET status = 'CANCELADA', motivo_cancelamento = ?,
                           updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(validation.data.motivo, id).run();
  
  return c.json({ message: 'Consignação cancelada' });
});

export default consignacoes;
