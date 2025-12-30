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

// ============================================
// NUVEM SHOP - INTEGRAÇÃO
// ============================================

// GET /api/ecommerce/nuvemshop/lojas - Listar lojas conectadas
ecommerce.get('/nuvemshop/lojas', async (c) => {
  const empresaId = c.get('empresaId');
  
  const lojas = await c.env.DB.prepare(`
    SELECT nl.*, 
           (SELECT COUNT(*) FROM nuvemshop_produtos WHERE loja_id = nl.id AND ativo = 1) as produtos_vinculados,
           (SELECT COUNT(*) FROM nuvemshop_pedidos WHERE loja_id = nl.id AND status_erp = 'pendente') as pedidos_pendentes
    FROM nuvemshop_lojas nl
    WHERE nl.empresa_id = ?
    ORDER BY nl.created_at DESC
  `).bind(empresaId).all();
  
  return c.json({ success: true, data: lojas.results });
});

// GET /api/ecommerce/nuvemshop/lojas/:id - Buscar loja
ecommerce.get('/nuvemshop/lojas/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const loja = await c.env.DB.prepare(`
    SELECT * FROM nuvemshop_lojas WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!loja) {
    return c.json({ error: 'Loja não encontrada' }, 404);
  }
  
  return c.json({ success: true, data: loja });
});

// POST /api/ecommerce/nuvemshop/oauth/callback - Callback OAuth Nuvem Shop
ecommerce.post('/nuvemshop/oauth/callback', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    code: z.string(),
    store_id: z.string()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  // Buscar configurações
  const config = await c.env.DB.prepare(`
    SELECT * FROM config_ecommerce WHERE empresa_id = ?
  `).bind(empresaId).first() as any;
  
  if (!config || !config.nuvemshop_client_id || !config.nuvemshop_client_secret) {
    return c.json({ error: 'Configurações Nuvem Shop não encontradas' }, 400);
  }
  
  // Trocar code por access_token
  const tokenResponse = await fetch('https://www.tiendanube.com/apps/authorize/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.nuvemshop_client_id,
      client_secret: config.nuvemshop_client_secret,
      grant_type: 'authorization_code',
      code: validation.data.code
    })
  });
  
  if (!tokenResponse.ok) {
    return c.json({ error: 'Erro ao obter token de acesso' }, 400);
  }
  
  const tokenData = await tokenResponse.json() as any;
  
  // Buscar dados da loja
  const storeResponse = await fetch(`https://api.nuvemshop.com.br/v1/${tokenData.user_id}/store`, {
    headers: { 
      'Authentication': `bearer ${tokenData.access_token}`,
      'User-Agent': 'PLANAC ERP (planacacabamentos@gmail.com)'
    }
  });
  
  const storeData = storeResponse.ok ? await storeResponse.json() as any : null;
  
  // Verificar se loja já existe
  const existente = await c.env.DB.prepare(`
    SELECT id FROM nuvemshop_lojas WHERE empresa_id = ? AND store_id = ?
  `).bind(empresaId, tokenData.user_id).first();
  
  if (existente) {
    // Atualizar token
    await c.env.DB.prepare(`
      UPDATE nuvemshop_lojas SET access_token = ?, scope = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(tokenData.access_token, tokenData.scope, existente.id).run();
    
    return c.json({ id: existente.id, message: 'Token atualizado' });
  }
  
  // Criar nova loja
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO nuvemshop_lojas (id, empresa_id, store_id, store_name, store_url, access_token,
                                  token_type, scope, email, ativo)
    VALUES (?, ?, ?, ?, ?, ?, 'bearer', ?, ?, 1)
  `).bind(id, empresaId, tokenData.user_id, storeData?.name?.pt || null, 
          storeData?.url_with_protocol || null, tokenData.access_token, 
          tokenData.scope, storeData?.email || null).run();
  
  return c.json({ id, message: 'Loja conectada com sucesso' }, 201);
});

// PUT /api/ecommerce/nuvemshop/lojas/:id - Atualizar configurações da loja
ecommerce.put('/nuvemshop/lojas/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    sync_produtos: z.boolean().optional(),
    sync_estoque: z.boolean().optional(),
    sync_precos: z.boolean().optional(),
    sync_pedidos: z.boolean().optional(),
    sync_clientes: z.boolean().optional(),
    tabela_preco_id: z.string().uuid().optional(),
    local_estoque_id: z.string().optional(),
    vendedor_padrao_id: z.string().uuid().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  const campos = Object.keys(validation.data);
  const valores = Object.values(validation.data).map(v => typeof v === 'boolean' ? (v ? 1 : 0) : v);
  
  if (campos.length > 0) {
    const setClause = campos.map(c => `${c} = ?`).join(', ');
    await c.env.DB.prepare(`
      UPDATE nuvemshop_lojas SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND empresa_id = ?
    `).bind(...valores, id, empresaId).run();
  }
  
  return c.json({ message: 'Configurações atualizadas' });
});

// DELETE /api/ecommerce/nuvemshop/lojas/:id - Desconectar loja
ecommerce.delete('/nuvemshop/lojas/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  await c.env.DB.prepare(`
    UPDATE nuvemshop_lojas SET ativo = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).run();
  
  return c.json({ message: 'Loja desconectada' });
});

// ============================================
// NUVEM SHOP - PRODUTOS
// ============================================

// GET /api/ecommerce/nuvemshop/lojas/:lojaId/produtos - Listar produtos vinculados
ecommerce.get('/nuvemshop/lojas/:lojaId/produtos', async (c) => {
  const empresaId = c.get('empresaId');
  const { lojaId } = c.req.param();
  const { page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  const produtos = await c.env.DB.prepare(`
    SELECT np.*, p.codigo, p.descricao as produto_descricao, p.sku as produto_sku
    FROM nuvemshop_produtos np
    JOIN produtos p ON np.produto_id = p.id
    WHERE np.loja_id = ? AND np.empresa_id = ?
    ORDER BY p.descricao
    LIMIT ? OFFSET ?
  `).bind(lojaId, empresaId, parseInt(limit), offset).all();
  
  return c.json({ success: true, data: produtos.results });
});

// POST /api/ecommerce/nuvemshop/lojas/:lojaId/produtos/vincular - Vincular produto
ecommerce.post('/nuvemshop/lojas/:lojaId/produtos/vincular', async (c) => {
  const empresaId = c.get('empresaId');
  const { lojaId } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    produto_id: z.string().uuid(),
    nuvemshop_product_id: z.string()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  // Verificar se já existe vínculo
  const existente = await c.env.DB.prepare(`
    SELECT id FROM nuvemshop_produtos WHERE loja_id = ? AND produto_id = ?
  `).bind(lojaId, validation.data.produto_id).first();
  
  if (existente) {
    return c.json({ error: 'Produto já vinculado' }, 409);
  }
  
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO nuvemshop_produtos (id, empresa_id, loja_id, produto_id, nuvemshop_product_id, ativo)
    VALUES (?, ?, ?, ?, ?, 1)
  `).bind(id, empresaId, lojaId, validation.data.produto_id, validation.data.nuvemshop_product_id).run();
  
  return c.json({ id, message: 'Produto vinculado' }, 201);
});

// POST /api/ecommerce/nuvemshop/lojas/:lojaId/produtos/sincronizar - Sincronizar produtos
ecommerce.post('/nuvemshop/lojas/:lojaId/produtos/sincronizar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { lojaId } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    produto_ids: z.array(z.string().uuid()).optional(),
    direcao: z.enum(['erp_para_nuvemshop', 'nuvemshop_para_erp']).default('erp_para_nuvemshop')
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  // Buscar loja
  const loja = await c.env.DB.prepare(`
    SELECT * FROM nuvemshop_lojas WHERE id = ? AND empresa_id = ? AND ativo = 1
  `).bind(lojaId, empresaId).first() as any;
  
  if (!loja) {
    return c.json({ error: 'Loja não encontrada ou inativa' }, 404);
  }
  
  // Criar log de sincronização
  const syncId = crypto.randomUUID();
  const inicio = new Date().toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO nuvemshop_sync_log (id, empresa_id, loja_id, tipo, direcao, inicio, status, usuario_id)
    VALUES (?, ?, ?, 'produtos', ?, ?, 'em_andamento', ?)
  `).bind(syncId, empresaId, lojaId, validation.data.direcao, inicio, usuarioId).run();
  
  // Buscar produtos para sincronizar
  let produtosQuery = `
    SELECT np.*, p.codigo, p.descricao, p.sku, p.preco_venda, 
           (SELECT SUM(quantidade) FROM estoque WHERE produto_id = p.id) as estoque_total
    FROM nuvemshop_produtos np
    JOIN produtos p ON np.produto_id = p.id
    WHERE np.loja_id = ? AND np.ativo = 1
  `;
  const params: any[] = [lojaId];
  
  if (validation.data.produto_ids && validation.data.produto_ids.length > 0) {
    produtosQuery += ` AND np.produto_id IN (${validation.data.produto_ids.map(() => '?').join(',')})`;
    params.push(...validation.data.produto_ids);
  }
  
  const produtos = await c.env.DB.prepare(produtosQuery).bind(...params).all();
  
  let sucesso = 0;
  let erro = 0;
  const erros: string[] = [];
  
  for (const prod of produtos.results as any[]) {
    try {
      if (validation.data.direcao === 'erp_para_nuvemshop') {
        // Atualizar produto na Nuvem Shop
        const response = await fetch(
          `https://api.nuvemshop.com.br/v1/${loja.store_id}/products/${prod.nuvemshop_product_id}`,
          {
            method: 'PUT',
            headers: {
              'Authentication': `bearer ${loja.access_token}`,
              'Content-Type': 'application/json',
              'User-Agent': 'PLANAC ERP (planacacabamentos@gmail.com)'
            },
            body: JSON.stringify({
              name: { pt: prod.descricao },
              variants: [{
                sku: prod.sku,
                price: prod.preco_venda,
                stock: prod.estoque_total || 0
              }]
            })
          }
        );
        
        if (response.ok) {
          sucesso++;
          await c.env.DB.prepare(`
            UPDATE nuvemshop_produtos SET ultima_sincronizacao = CURRENT_TIMESTAMP, erro_sincronizacao = NULL
            WHERE id = ?
          `).bind(prod.id).run();
        } else {
          erro++;
          const errorText = await response.text();
          erros.push(`${prod.codigo}: ${errorText}`);
          await c.env.DB.prepare(`
            UPDATE nuvemshop_produtos SET erro_sincronizacao = ? WHERE id = ?
          `).bind(errorText, prod.id).run();
        }
      }
    } catch (e: any) {
      erro++;
      erros.push(`${prod.codigo}: ${e.message}`);
    }
  }
  
  // Atualizar log
  const fim = new Date().toISOString();
  const duracao = Math.round((new Date(fim).getTime() - new Date(inicio).getTime()) / 1000);
  
  await c.env.DB.prepare(`
    UPDATE nuvemshop_sync_log SET 
      total_itens = ?, itens_sucesso = ?, itens_erro = ?, 
      erros = ?, fim = ?, duracao_segundos = ?,
      status = ?
    WHERE id = ?
  `).bind(produtos.results.length, sucesso, erro, 
          erros.length > 0 ? JSON.stringify(erros) : null, fim, duracao,
          erro > 0 ? 'concluido_com_erros' : 'concluido', syncId).run();
  
  // Atualizar última sincronização da loja
  await c.env.DB.prepare(`
    UPDATE nuvemshop_lojas SET ultima_sincronizacao = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(lojaId).run();
  
  return c.json({
    sync_id: syncId,
    total: produtos.results.length,
    sucesso,
    erro,
    erros: erros.slice(0, 10),
    message: `Sincronização concluída: ${sucesso} sucesso, ${erro} erros`
  });
});

// ============================================
// NUVEM SHOP - PEDIDOS
// ============================================

// GET /api/ecommerce/nuvemshop/pedidos - Listar pedidos
ecommerce.get('/nuvemshop/pedidos', async (c) => {
  const empresaId = c.get('empresaId');
  const { loja_id, status_erp, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT np.*, nl.store_name as loja_nome
               FROM nuvemshop_pedidos np
               JOIN nuvemshop_lojas nl ON np.loja_id = nl.id
               WHERE np.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (loja_id) {
    query += ` AND np.loja_id = ?`;
    params.push(loja_id);
  }
  
  if (status_erp) {
    query += ` AND np.status_erp = ?`;
    params.push(status_erp);
  }
  
  const countQuery = query.replace(/SELECT np\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY np.data_pedido DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: result.results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult?.total || 0 }
  });
});

// GET /api/ecommerce/nuvemshop/pedidos/:id - Buscar pedido com itens
ecommerce.get('/nuvemshop/pedidos/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const pedido = await c.env.DB.prepare(`
    SELECT np.*, nl.store_name as loja_nome
    FROM nuvemshop_pedidos np
    JOIN nuvemshop_lojas nl ON np.loja_id = nl.id
    WHERE np.id = ? AND np.empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!pedido) {
    return c.json({ error: 'Pedido não encontrado' }, 404);
  }
  
  const itens = await c.env.DB.prepare(`
    SELECT npi.*, p.codigo as produto_codigo, p.descricao as produto_descricao
    FROM nuvemshop_pedidos_itens npi
    LEFT JOIN produtos p ON npi.produto_id = p.id
    WHERE npi.pedido_id = ?
  `).bind(id).all();
  
  return c.json({ success: true, data: { ...pedido, itens: itens.results } });
});

// POST /api/ecommerce/nuvemshop/lojas/:lojaId/pedidos/importar - Importar pedidos
ecommerce.post('/nuvemshop/lojas/:lojaId/pedidos/importar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { lojaId } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    desde: z.string().optional(),
    status: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  
  // Buscar loja
  const loja = await c.env.DB.prepare(`
    SELECT * FROM nuvemshop_lojas WHERE id = ? AND empresa_id = ? AND ativo = 1
  `).bind(lojaId, empresaId).first() as any;
  
  if (!loja) {
    return c.json({ error: 'Loja não encontrada ou inativa' }, 404);
  }
  
  // Buscar pedidos da Nuvem Shop
  let url = `https://api.nuvemshop.com.br/v1/${loja.store_id}/orders?per_page=50`;
  if (validation.data?.desde) {
    url += `&created_at_min=${validation.data.desde}`;
  }
  if (validation.data?.status) {
    url += `&status=${validation.data.status}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'Authentication': `bearer ${loja.access_token}`,
      'User-Agent': 'PLANAC ERP (planacacabamentos@gmail.com)'
    }
  });
  
  if (!response.ok) {
    return c.json({ error: 'Erro ao buscar pedidos da Nuvem Shop' }, 400);
  }
  
  const pedidos = await response.json() as any[];
  
  let importados = 0;
  let existentes = 0;
  
  for (const pedido of pedidos) {
    // Verificar se já existe
    const existente = await c.env.DB.prepare(`
      SELECT id FROM nuvemshop_pedidos WHERE loja_id = ? AND nuvemshop_order_id = ?
    `).bind(lojaId, String(pedido.id)).first();
    
    if (existente) {
      existentes++;
      continue;
    }
    
    const id = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO nuvemshop_pedidos (id, empresa_id, loja_id, nuvemshop_order_id, numero,
                                     status_nuvemshop, status_pagamento, status_envio,
                                     cliente_nome, cliente_email, cliente_cpf_cnpj, cliente_telefone,
                                     nuvemshop_customer_id, endereco_cep, endereco_rua, endereco_numero,
                                     endereco_complemento, endereco_bairro, endereco_cidade, endereco_uf,
                                     subtotal, desconto, frete, total, forma_pagamento, gateway,
                                     parcelas, transportadora, servico_frete, codigo_rastreio,
                                     cupom_codigo, cupom_desconto, data_pedido, dados_originais, status_erp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')
    `).bind(
      id, empresaId, lojaId, String(pedido.id), pedido.number,
      pedido.status, pedido.payment_status, pedido.shipping_status,
      pedido.customer?.name || null, pedido.customer?.email || null,
      pedido.customer?.identification || null, pedido.customer?.phone || null,
      pedido.customer?.id ? String(pedido.customer.id) : null,
      pedido.shipping_address?.zipcode || null, pedido.shipping_address?.address || null,
      pedido.shipping_address?.number || null, pedido.shipping_address?.floor || null,
      pedido.shipping_address?.locality || null, pedido.shipping_address?.city || null,
      pedido.shipping_address?.province || null,
      pedido.subtotal || 0, pedido.discount || 0, pedido.shipping_cost_customer || 0, pedido.total || 0,
      pedido.payment_details?.method || null, pedido.gateway || null,
      pedido.payment_details?.installments || 1,
      pedido.shipping_option?.name || null, pedido.shipping_option?.code || null,
      pedido.shipping_tracking_number || null,
      pedido.coupon?.[0]?.code || null, pedido.coupon?.[0]?.value || 0,
      pedido.created_at, JSON.stringify(pedido)
    ).run();
    
    // Importar itens
    for (const item of pedido.products || []) {
      const itemId = crypto.randomUUID();
      
      // Tentar vincular ao produto ERP
      const produtoVinculado = await c.env.DB.prepare(`
        SELECT produto_id FROM nuvemshop_produtos 
        WHERE loja_id = ? AND nuvemshop_product_id = ?
      `).bind(lojaId, String(item.product_id)).first();
      
      await c.env.DB.prepare(`
        INSERT INTO nuvemshop_pedidos_itens (id, pedido_id, nuvemshop_product_id, nuvemshop_variant_id,
                                             produto_id, sku, nome, quantidade, preco_unitario, desconto, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        itemId, id, String(item.product_id), item.variant_id ? String(item.variant_id) : null,
        produtoVinculado?.produto_id || null, item.sku || null, item.name || null,
        item.quantity || 1, item.price || 0, item.discount || 0,
        (item.quantity || 1) * (item.price || 0) - (item.discount || 0)
      ).run();
    }
    
    importados++;
  }
  
  return c.json({
    total_api: pedidos.length,
    importados,
    existentes,
    message: `${importados} pedidos importados, ${existentes} já existiam`
  });
});

// POST /api/ecommerce/nuvemshop/pedidos/:id/processar - Processar pedido (criar pedido de venda)
ecommerce.post('/nuvemshop/pedidos/:id/processar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  
  const pedido = await c.env.DB.prepare(`
    SELECT np.*, nl.vendedor_padrao_id
    FROM nuvemshop_pedidos np
    JOIN nuvemshop_lojas nl ON np.loja_id = nl.id
    WHERE np.id = ? AND np.empresa_id = ? AND np.status_erp = 'pendente'
  `).bind(id, empresaId).first() as any;
  
  if (!pedido) {
    return c.json({ error: 'Pedido não encontrado ou já processado' }, 404);
  }
  
  // Buscar ou criar cliente
  let clienteId = pedido.cliente_id;
  
  if (!clienteId && pedido.cliente_cpf_cnpj) {
    const clienteExistente = await c.env.DB.prepare(`
      SELECT id FROM clientes WHERE cpf_cnpj = ? AND empresa_id = ?
    `).bind(pedido.cliente_cpf_cnpj, empresaId).first();
    
    if (clienteExistente) {
      clienteId = clienteExistente.id;
    } else {
      // Criar cliente
      clienteId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO clientes (id, empresa_id, razao_social, cpf_cnpj, email, telefone,
                              endereco, numero, complemento, bairro, cidade, uf, cep, ativo, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `).bind(clienteId, empresaId, pedido.cliente_nome, pedido.cliente_cpf_cnpj,
              pedido.cliente_email, pedido.cliente_telefone, pedido.endereco_rua,
              pedido.endereco_numero, pedido.endereco_complemento, pedido.endereco_bairro,
              pedido.endereco_cidade, pedido.endereco_uf, pedido.endereco_cep, usuarioId).run();
    }
    
    // Atualizar cliente no pedido Nuvem Shop
    await c.env.DB.prepare(`
      UPDATE nuvemshop_pedidos SET cliente_id = ? WHERE id = ?
    `).bind(clienteId, id).run();
  }
  
  // Criar pedido de venda
  const pedidoVendaId = crypto.randomUUID();
  const numero = await c.env.DB.prepare(`
    SELECT COALESCE(MAX(CAST(numero AS INTEGER)), 0) + 1 as proximo FROM pedidos_venda WHERE empresa_id = ?
  `).bind(empresaId).first();
  
  await c.env.DB.prepare(`
    INSERT INTO pedidos_venda (id, empresa_id, numero, cliente_id, vendedor_id, data_pedido,
                               valor_produtos, valor_desconto, valor_frete, valor_total,
                               status, origem, observacoes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMADO', 'ECOMMERCE', ?, ?)
  `).bind(pedidoVendaId, empresaId, String(numero?.proximo || 1), clienteId,
          pedido.vendedor_padrao_id, pedido.data_pedido, pedido.subtotal,
          pedido.desconto, pedido.frete, pedido.total,
          `Pedido Nuvem Shop #${pedido.numero}`, usuarioId).run();
  
  // Buscar itens e criar itens do pedido de venda
  const itens = await c.env.DB.prepare(`
    SELECT * FROM nuvemshop_pedidos_itens WHERE pedido_id = ?
  `).bind(id).all();
  
  for (const item of itens.results as any[]) {
    if (item.produto_id) {
      const itemId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO pedidos_venda_itens (id, pedido_id, produto_id, quantidade, valor_unitario,
                                         valor_desconto, valor_total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(itemId, pedidoVendaId, item.produto_id, item.quantidade,
              item.preco_unitario, item.desconto, item.total).run();
    }
  }
  
  // Atualizar status do pedido Nuvem Shop
  await c.env.DB.prepare(`
    UPDATE nuvemshop_pedidos SET status_erp = 'importado', pedido_venda_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(pedidoVendaId, id).run();
  
  return c.json({ 
    pedido_venda_id: pedidoVendaId, 
    cliente_id: clienteId,
    message: 'Pedido processado e convertido em pedido de venda' 
  });
});

// ============================================
// NUVEM SHOP - WEBHOOKS
// ============================================

// POST /api/ecommerce/nuvemshop/webhook - Receber webhook
ecommerce.post('/nuvemshop/webhook', async (c) => {
  const body = await c.req.json();
  
  // Identificar loja pelo store_id
  const loja = await c.env.DB.prepare(`
    SELECT * FROM nuvemshop_lojas WHERE store_id = ? AND ativo = 1
  `).bind(String(body.store_id)).first() as any;
  
  if (!loja) {
    return c.json({ error: 'Loja não encontrada' }, 404);
  }
  
  // Registrar webhook
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO nuvemshop_webhooks_log (id, empresa_id, loja_id, evento, store_id, payload, processado)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).bind(id, loja.empresa_id, loja.id, body.event, String(body.store_id), JSON.stringify(body)).run();
  
  // Processar eventos específicos
  if (body.event === 'order/created' || body.event === 'order/updated') {
    // Importar/atualizar pedido automaticamente se configurado
    // (implementação simplificada - em produção seria mais robusta)
  }
  
  return c.json({ received: true, webhook_id: id });
});

// GET /api/ecommerce/nuvemshop/webhooks-log - Listar log de webhooks
ecommerce.get('/nuvemshop/webhooks-log', async (c) => {
  const empresaId = c.get('empresaId');
  const { loja_id, evento, processado, page = '1', limit = '50' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT wl.*, nl.store_name as loja_nome
               FROM nuvemshop_webhooks_log wl
               JOIN nuvemshop_lojas nl ON wl.loja_id = nl.id
               WHERE wl.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (loja_id) {
    query += ` AND wl.loja_id = ?`;
    params.push(loja_id);
  }
  
  if (evento) {
    query += ` AND wl.evento = ?`;
    params.push(evento);
  }
  
  if (processado !== undefined) {
    query += ` AND wl.processado = ?`;
    params.push(processado === 'true' ? 1 : 0);
  }
  
  query += ` ORDER BY wl.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// ============================================
// NUVEM SHOP - CONFIGURAÇÕES
// ============================================

// GET /api/ecommerce/config - Buscar configurações
ecommerce.get('/config', async (c) => {
  const empresaId = c.get('empresaId');
  
  const config = await c.env.DB.prepare(`
    SELECT * FROM config_ecommerce WHERE empresa_id = ?
  `).bind(empresaId).first();
  
  if (!config) {
    return c.json({ success: true, data: null });
  }
  
  // Ocultar secrets
  return c.json({ 
    success: true, 
    data: {
      ...config,
      nuvemshop_client_secret: config.nuvemshop_client_secret ? '********' : null
    }
  });
});

// PUT /api/ecommerce/config - Atualizar configurações
ecommerce.put('/config', async (c) => {
  const empresaId = c.get('empresaId');
  const body = await c.req.json();
  
  const schema = z.object({
    nuvemshop_client_id: z.string().optional(),
    nuvemshop_client_secret: z.string().optional(),
    nuvemshop_redirect_url: z.string().url().optional(),
    sync_automatica: z.boolean().optional(),
    intervalo_sync_minutos: z.number().int().min(5).max(1440).optional(),
    importar_pedidos_automatico: z.boolean().optional(),
    criar_cliente_automatico: z.boolean().optional(),
    gerar_pedido_venda_automatico: z.boolean().optional(),
    reservar_estoque_pedido: z.boolean().optional(),
    baixar_estoque_faturamento: z.boolean().optional(),
    notificar_novo_pedido: z.boolean().optional(),
    notificar_erro_sync: z.boolean().optional(),
    email_notificacoes: z.string().email().optional(),
    webhook_base_url: z.string().url().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  // Verificar se existe
  const existente = await c.env.DB.prepare(`
    SELECT id FROM config_ecommerce WHERE empresa_id = ?
  `).bind(empresaId).first();
  
  if (existente) {
    const campos = Object.keys(validation.data);
    const valores = Object.values(validation.data).map(v => typeof v === 'boolean' ? (v ? 1 : 0) : v);
    
    if (campos.length > 0) {
      const setClause = campos.map(c => `${c} = ?`).join(', ');
      await c.env.DB.prepare(`
        UPDATE config_ecommerce SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE empresa_id = ?
      `).bind(...valores, empresaId).run();
    }
  } else {
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO config_ecommerce (id, empresa_id) VALUES (?, ?)
    `).bind(id, empresaId).run();
    
    // Atualizar com os dados
    const campos = Object.keys(validation.data);
    const valores = Object.values(validation.data).map(v => typeof v === 'boolean' ? (v ? 1 : 0) : v);
    
    if (campos.length > 0) {
      const setClause = campos.map(c => `${c} = ?`).join(', ');
      await c.env.DB.prepare(`
        UPDATE config_ecommerce SET ${setClause} WHERE empresa_id = ?
      `).bind(...valores, empresaId).run();
    }
  }
  
  return c.json({ message: 'Configurações atualizadas' });
});

// GET /api/ecommerce/nuvemshop/sync-log - Listar log de sincronizações
ecommerce.get('/nuvemshop/sync-log', async (c) => {
  const empresaId = c.get('empresaId');
  const { loja_id, tipo, status, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT sl.*, nl.store_name as loja_nome, u.nome as usuario_nome
               FROM nuvemshop_sync_log sl
               JOIN nuvemshop_lojas nl ON sl.loja_id = nl.id
               LEFT JOIN usuarios u ON sl.usuario_id = u.id
               WHERE sl.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (loja_id) {
    query += ` AND sl.loja_id = ?`;
    params.push(loja_id);
  }
  
  if (tipo) {
    query += ` AND sl.tipo = ?`;
    params.push(tipo);
  }
  
  if (status) {
    query += ` AND sl.status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY sl.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

export default ecommerce;
