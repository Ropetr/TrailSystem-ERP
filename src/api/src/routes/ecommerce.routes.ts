// ============================================
// PLANAC ERP - Rotas de E-commerce
// Bloco 3 - E-commerce
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const ecommerce = new Hono<{ Bindings: Env }>();

// ============================================
// CARRINHOS
// ============================================

// GET /api/ecommerce/carrinhos - Listar carrinhos (admin)
ecommerce.get('/carrinhos', async (c) => {
  const empresaId = c.get('empresaId');
  const { cliente_id, status, abandonado, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT car.*, c.razao_social as cliente_nome, c.email as cliente_email,
               (SELECT COUNT(*) FROM carrinhos_itens WHERE carrinho_id = car.id) as total_itens,
               (SELECT SUM(quantidade * valor_unitario) FROM carrinhos_itens WHERE carrinho_id = car.id) as valor_total
               FROM carrinhos car
               LEFT JOIN clientes c ON car.cliente_id = c.id
               WHERE car.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (cliente_id) {
    query += ` AND car.cliente_id = ?`;
    params.push(cliente_id);
  }
  
  if (status) {
    query += ` AND car.status = ?`;
    params.push(status);
  }
  
  if (abandonado === 'true') {
    query += ` AND car.status = 'ATIVO' AND car.updated_at < datetime('now', '-24 hours')`;
  }
  
  const countQuery = query.replace(/SELECT car\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY car.updated_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: result.results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult?.total || 0 }
  });
});

// GET /api/ecommerce/carrinhos/:id - Buscar carrinho com itens
ecommerce.get('/carrinhos/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const carrinho = await c.env.DB.prepare(`
    SELECT car.*, c.razao_social as cliente_nome, c.email as cliente_email
    FROM carrinhos car
    LEFT JOIN clientes c ON car.cliente_id = c.id
    WHERE car.id = ? AND car.empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!carrinho) {
    return c.json({ error: 'Carrinho não encontrado' }, 404);
  }
  
  const itens = await c.env.DB.prepare(`
    SELECT ci.*, p.descricao as produto_descricao, p.codigo as produto_codigo,
           (ci.quantidade * ci.valor_unitario) as valor_total
    FROM carrinhos_itens ci
    JOIN produtos p ON ci.produto_id = p.id
    WHERE ci.carrinho_id = ?
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: {
      ...carrinho,
      itens: itens.results
    }
  });
});

// POST /api/ecommerce/carrinhos - Criar carrinho
ecommerce.post('/carrinhos', async (c) => {
  const empresaId = c.get('empresaId');
  const body = await c.req.json();
  
  const schema = z.object({
    cliente_id: z.string().uuid().optional(),
    session_id: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO carrinhos (id, empresa_id, cliente_id, session_id, status)
    VALUES (?, ?, ?, ?, 'ATIVO')
  `).bind(id, empresaId, validation.data?.cliente_id || null, validation.data?.session_id || null).run();
  
  return c.json({ id, message: 'Carrinho criado' }, 201);
});

// POST /api/ecommerce/carrinhos/:id/itens - Adicionar item
ecommerce.post('/carrinhos/:id/itens', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    produto_id: z.string().uuid(),
    quantidade: z.number().int().min(1),
    valor_unitario: z.number().min(0)
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  // Verificar se item já existe
  const existente = await c.env.DB.prepare(`
    SELECT id, quantidade FROM carrinhos_itens WHERE carrinho_id = ? AND produto_id = ?
  `).bind(id, validation.data.produto_id).first();
  
  if (existente) {
    // Atualizar quantidade
    await c.env.DB.prepare(`
      UPDATE carrinhos_itens SET quantidade = quantidade + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(validation.data.quantidade, existente.id).run();
    
    return c.json({ id: existente.id, message: 'Quantidade atualizada' });
  }
  
  const itemId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO carrinhos_itens (id, carrinho_id, produto_id, quantidade, valor_unitario)
    VALUES (?, ?, ?, ?, ?)
  `).bind(itemId, id, validation.data.produto_id, validation.data.quantidade, validation.data.valor_unitario).run();
  
  // Atualizar timestamp do carrinho
  await c.env.DB.prepare(`UPDATE carrinhos SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
  
  return c.json({ id: itemId, message: 'Item adicionado' }, 201);
});

// PUT /api/ecommerce/carrinhos/:id/itens/:itemId - Atualizar quantidade
ecommerce.put('/carrinhos/:id/itens/:itemId', async (c) => {
  const { id, itemId } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({ quantidade: z.number().int().min(1) });
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Quantidade inválida' }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE carrinhos_itens SET quantidade = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND carrinho_id = ?
  `).bind(validation.data.quantidade, itemId, id).run();
  
  await c.env.DB.prepare(`UPDATE carrinhos SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
  
  return c.json({ message: 'Quantidade atualizada' });
});

// DELETE /api/ecommerce/carrinhos/:id/itens/:itemId - Remover item
ecommerce.delete('/carrinhos/:id/itens/:itemId', async (c) => {
  const { id, itemId } = c.req.param();
  
  await c.env.DB.prepare(`DELETE FROM carrinhos_itens WHERE id = ? AND carrinho_id = ?`).bind(itemId, id).run();
  await c.env.DB.prepare(`UPDATE carrinhos SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
  
  return c.json({ message: 'Item removido' });
});

// GET /api/ecommerce/carrinhos/abandonados - Carrinhos abandonados
ecommerce.get('/carrinhos/abandonados', async (c) => {
  const empresaId = c.get('empresaId');
  const { horas = '24' } = c.req.query();
  
  const carrinhos = await c.env.DB.prepare(`
    SELECT car.*, c.razao_social as cliente_nome, c.email as cliente_email,
           (SELECT SUM(quantidade * valor_unitario) FROM carrinhos_itens WHERE carrinho_id = car.id) as valor_total
    FROM carrinhos car
    LEFT JOIN clientes c ON car.cliente_id = c.id
    WHERE car.empresa_id = ?
      AND car.status = 'ATIVO'
      AND car.updated_at < datetime('now', '-' || ? || ' hours')
      AND EXISTS (SELECT 1 FROM carrinhos_itens WHERE carrinho_id = car.id)
    ORDER BY car.updated_at DESC
  `).bind(empresaId, horas).all();
  
  return c.json({ success: true, data: carrinhos.results });
});

// ============================================
// CUPONS
// ============================================

// GET /api/ecommerce/cupons - Listar cupons
ecommerce.get('/cupons', async (c) => {
  const empresaId = c.get('empresaId');
  const { ativo, tipo } = c.req.query();
  
  let query = `SELECT cup.*, 
               (SELECT COUNT(*) FROM cupons_uso WHERE cupom_id = cup.id) as total_usos
               FROM cupons cup WHERE cup.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (ativo !== undefined) {
    query += ` AND cup.ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }
  
  if (tipo) {
    query += ` AND cup.tipo = ?`;
    params.push(tipo);
  }
  
  query += ` ORDER BY cup.created_at DESC`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// POST /api/ecommerce/cupons - Criar cupom
ecommerce.post('/cupons', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    codigo: z.string().min(3).max(20).toUpperCase(),
    descricao: z.string().optional(),
    tipo: z.enum(['PERCENTUAL', 'VALOR_FIXO', 'FRETE_GRATIS']),
    valor: z.number().min(0),
    valor_minimo_pedido: z.number().min(0).optional(),
    valor_maximo_desconto: z.number().min(0).optional(),
    data_inicio: z.string(),
    data_fim: z.string(),
    limite_uso_total: z.number().int().min(0).optional(),
    limite_uso_cliente: z.number().int().min(1).default(1),
    primeira_compra: z.boolean().default(false),
    categorias_ids: z.array(z.string().uuid()).optional(),
    produtos_ids: z.array(z.string().uuid()).optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  // Verificar código duplicado
  const existente = await c.env.DB.prepare(`
    SELECT id FROM cupons WHERE codigo = ? AND empresa_id = ?
  `).bind(validation.data.codigo, empresaId).first();
  
  if (existente) {
    return c.json({ error: 'Código de cupom já existe' }, 409);
  }
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO cupons (id, empresa_id, codigo, descricao, tipo, valor, valor_minimo_pedido,
                        valor_maximo_desconto, data_inicio, data_fim, limite_uso_total,
                        limite_uso_cliente, primeira_compra, categorias_ids, produtos_ids, ativo, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).bind(id, empresaId, data.codigo, data.descricao || null, data.tipo, data.valor,
          data.valor_minimo_pedido || null, data.valor_maximo_desconto || null,
          data.data_inicio, data.data_fim, data.limite_uso_total || null,
          data.limite_uso_cliente, data.primeira_compra ? 1 : 0,
          data.categorias_ids ? JSON.stringify(data.categorias_ids) : null,
          data.produtos_ids ? JSON.stringify(data.produtos_ids) : null, usuarioId).run();
  
  return c.json({ id, message: 'Cupom criado com sucesso' }, 201);
});

// POST /api/ecommerce/cupons/validar - Validar cupom
ecommerce.post('/cupons/validar', async (c) => {
  const empresaId = c.get('empresaId');
  const body = await c.req.json();
  
  const schema = z.object({
    codigo: z.string(),
    cliente_id: z.string().uuid().optional(),
    valor_carrinho: z.number().min(0)
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  const cupom = await c.env.DB.prepare(`
    SELECT * FROM cupons WHERE codigo = ? AND empresa_id = ? AND ativo = 1
  `).bind(validation.data.codigo.toUpperCase(), empresaId).first();
  
  if (!cupom) {
    return c.json({ error: 'Cupom não encontrado ou inativo', valido: false }, 404);
  }
  
  const hoje = new Date().toISOString().split('T')[0];
  
  // Verificar data
  if (cupom.data_inicio > hoje || cupom.data_fim < hoje) {
    return c.json({ error: 'Cupom fora do período de validade', valido: false }, 400);
  }
  
  // Verificar valor mínimo
  if (cupom.valor_minimo_pedido && validation.data.valor_carrinho < (cupom.valor_minimo_pedido as number)) {
    return c.json({ 
      error: `Valor mínimo do pedido: R$ ${cupom.valor_minimo_pedido}`, 
      valido: false 
    }, 400);
  }
  
  // Verificar limite de uso total
  if (cupom.limite_uso_total) {
    const usos = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM cupons_uso WHERE cupom_id = ?
    `).bind(cupom.id).first();
    
    if ((usos?.total as number) >= (cupom.limite_uso_total as number)) {
      return c.json({ error: 'Cupom esgotado', valido: false }, 400);
    }
  }
  
  // Verificar limite por cliente
  if (validation.data.cliente_id) {
    const usosCliente = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM cupons_uso WHERE cupom_id = ? AND cliente_id = ?
    `).bind(cupom.id, validation.data.cliente_id).first();
    
    if ((usosCliente?.total as number) >= (cupom.limite_uso_cliente as number)) {
      return c.json({ error: 'Você já utilizou este cupom', valido: false }, 400);
    }
  }
  
  // Calcular desconto
  let desconto = 0;
  if (cupom.tipo === 'PERCENTUAL') {
    desconto = validation.data.valor_carrinho * ((cupom.valor as number) / 100);
  } else if (cupom.tipo === 'VALOR_FIXO') {
    desconto = cupom.valor as number;
  }
  
  // Aplicar limite máximo
  if (cupom.valor_maximo_desconto && desconto > (cupom.valor_maximo_desconto as number)) {
    desconto = cupom.valor_maximo_desconto as number;
  }
  
  return c.json({
    valido: true,
    cupom: {
      id: cupom.id,
      codigo: cupom.codigo,
      tipo: cupom.tipo,
      valor: cupom.valor
    },
    desconto,
    valor_final: validation.data.valor_carrinho - desconto
  });
});

// PUT /api/ecommerce/cupons/:id - Atualizar cupom
ecommerce.put('/cupons/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const campos = Object.keys(body);
  const valores = Object.values(body);
  
  if (campos.length > 0) {
    const setClause = campos.map(c => `${c} = ?`).join(', ');
    await c.env.DB.prepare(`
      UPDATE cupons SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND empresa_id = ?
    `).bind(...valores, id, empresaId).run();
  }
  
  return c.json({ message: 'Cupom atualizado' });
});

// ============================================
// WISHLIST
// ============================================

// GET /api/ecommerce/wishlist/:clienteId - Listar wishlist do cliente
ecommerce.get('/wishlist/:clienteId', async (c) => {
  const empresaId = c.get('empresaId');
  const { clienteId } = c.req.param();
  
  const itens = await c.env.DB.prepare(`
    SELECT w.*, p.descricao as produto_descricao, p.codigo as produto_codigo,
           (SELECT valor FROM tabelas_preco_itens tpi 
            JOIN tabelas_preco tp ON tpi.tabela_id = tp.id 
            WHERE tpi.produto_id = w.produto_id AND tp.padrao = 1 AND tp.empresa_id = ?
            LIMIT 1) as preco
    FROM wishlists w
    JOIN produtos p ON w.produto_id = p.id
    WHERE w.cliente_id = ? AND w.empresa_id = ?
    ORDER BY w.created_at DESC
  `).bind(empresaId, clienteId, empresaId).all();
  
  return c.json({ success: true, data: itens.results });
});

// POST /api/ecommerce/wishlist - Adicionar à wishlist
ecommerce.post('/wishlist', async (c) => {
  const empresaId = c.get('empresaId');
  const body = await c.req.json();
  
  const schema = z.object({
    cliente_id: z.string().uuid(),
    produto_id: z.string().uuid()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  // Verificar se já existe
  const existente = await c.env.DB.prepare(`
    SELECT id FROM wishlists WHERE cliente_id = ? AND produto_id = ? AND empresa_id = ?
  `).bind(validation.data.cliente_id, validation.data.produto_id, empresaId).first();
  
  if (existente) {
    return c.json({ error: 'Produto já está na wishlist' }, 409);
  }
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO wishlists (id, empresa_id, cliente_id, produto_id)
    VALUES (?, ?, ?, ?)
  `).bind(id, empresaId, validation.data.cliente_id, validation.data.produto_id).run();
  
  return c.json({ id, message: 'Produto adicionado à wishlist' }, 201);
});

// DELETE /api/ecommerce/wishlist/:id - Remover da wishlist
ecommerce.delete('/wishlist/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  await c.env.DB.prepare(`DELETE FROM wishlists WHERE id = ? AND empresa_id = ?`).bind(id, empresaId).run();
  
  return c.json({ message: 'Produto removido da wishlist' });
});

// ============================================
// AVALIAÇÕES
// ============================================

// GET /api/ecommerce/avaliacoes - Listar avaliações
ecommerce.get('/avaliacoes', async (c) => {
  const empresaId = c.get('empresaId');
  const { produto_id, aprovada, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT av.*, c.razao_social as cliente_nome, p.descricao as produto_descricao
               FROM avaliacoes av
               JOIN clientes c ON av.cliente_id = c.id
               JOIN produtos p ON av.produto_id = p.id
               WHERE av.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (produto_id) {
    query += ` AND av.produto_id = ?`;
    params.push(produto_id);
  }
  
  if (aprovada !== undefined) {
    query += ` AND av.aprovada = ?`;
    params.push(aprovada === 'true' ? 1 : 0);
  }
  
  query += ` ORDER BY av.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// POST /api/ecommerce/avaliacoes - Criar avaliação
ecommerce.post('/avaliacoes', async (c) => {
  const empresaId = c.get('empresaId');
  const body = await c.req.json();
  
  const schema = z.object({
    cliente_id: z.string().uuid(),
    produto_id: z.string().uuid(),
    nota: z.number().int().min(1).max(5),
    titulo: z.string().max(100).optional(),
    comentario: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO avaliacoes (id, empresa_id, cliente_id, produto_id, nota, titulo, comentario, aprovada)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `).bind(id, empresaId, validation.data.cliente_id, validation.data.produto_id,
          validation.data.nota, validation.data.titulo || null, validation.data.comentario || null).run();
  
  return c.json({ id, message: 'Avaliação enviada para moderação' }, 201);
});

// POST /api/ecommerce/avaliacoes/:id/aprovar - Aprovar avaliação
ecommerce.post('/avaliacoes/:id/aprovar', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  await c.env.DB.prepare(`
    UPDATE avaliacoes SET aprovada = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).run();
  
  return c.json({ message: 'Avaliação aprovada' });
});

export default ecommerce;
