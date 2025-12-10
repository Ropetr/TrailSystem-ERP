// ============================================
// PLANAC ERP - Rotas de Comissões
// Bloco 3 - Remuneração Variável
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const comissoes = new Hono<{ Bindings: Env }>();

// ============================================
// REGRAS DE COMISSÃO
// ============================================

// GET /api/comissoes/regras - Listar regras
comissoes.get('/regras', async (c) => {
  const empresaId = c.get('empresaId');
  const { ativo, vendedor_id } = c.req.query();
  
  let query = `SELECT r.*, v.nome as vendedor_nome
               FROM comissoes_regras r
               LEFT JOIN vendedores v ON r.vendedor_id = v.id
               WHERE r.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (ativo !== undefined) {
    query += ` AND r.ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }
  
  if (vendedor_id) {
    query += ` AND (r.vendedor_id = ? OR r.vendedor_id IS NULL)`;
    params.push(vendedor_id);
  }
  
  query += ` ORDER BY r.prioridade DESC, r.nome`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ success: true, data: result.results });
});

// POST /api/comissoes/regras - Criar regra
comissoes.post('/regras', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    nome: z.string().min(1).max(100),
    tipo: z.enum(['PERCENTUAL', 'VALOR_FIXO', 'ESCALONADA']),
    vendedor_id: z.string().uuid().optional(),
    categoria_id: z.string().uuid().optional(),
    produto_id: z.string().uuid().optional(),
    percentual: z.number().min(0).max(100).optional(),
    valor_fixo: z.number().min(0).optional(),
    escala: z.array(z.object({
      meta_minima: z.number(),
      meta_maxima: z.number().optional(),
      percentual: z.number()
    })).optional(),
    base_calculo: z.enum(['VALOR_VENDA', 'VALOR_LIQUIDO', 'MARGEM']).default('VALOR_VENDA'),
    prioridade: z.number().int().default(0),
    data_inicio: z.string().optional(),
    data_fim: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO comissoes_regras (id, empresa_id, nome, tipo, vendedor_id, categoria_id, produto_id,
                                  percentual, valor_fixo, escala, base_calculo, prioridade,
                                  data_inicio, data_fim, ativo, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).bind(id, empresaId, data.nome, data.tipo, data.vendedor_id || null, data.categoria_id || null,
          data.produto_id || null, data.percentual || null, data.valor_fixo || null,
          data.escala ? JSON.stringify(data.escala) : null, data.base_calculo, data.prioridade,
          data.data_inicio || null, data.data_fim || null, usuarioId).run();
  
  return c.json({ id, message: 'Regra criada' }, 201);
});

// PUT /api/comissoes/regras/:id - Atualizar regra
comissoes.put('/regras/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const campos: string[] = [];
  const valores: any[] = [];
  
  if (body.nome) { campos.push('nome = ?'); valores.push(body.nome); }
  if (body.percentual !== undefined) { campos.push('percentual = ?'); valores.push(body.percentual); }
  if (body.valor_fixo !== undefined) { campos.push('valor_fixo = ?'); valores.push(body.valor_fixo); }
  if (body.escala) { campos.push('escala = ?'); valores.push(JSON.stringify(body.escala)); }
  if (body.prioridade !== undefined) { campos.push('prioridade = ?'); valores.push(body.prioridade); }
  if (body.ativo !== undefined) { campos.push('ativo = ?'); valores.push(body.ativo ? 1 : 0); }
  
  if (campos.length > 0) {
    await c.env.DB.prepare(`
      UPDATE comissoes_regras SET ${campos.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND empresa_id = ?
    `).bind(...valores, id, empresaId).run();
  }
  
  return c.json({ message: 'Regra atualizada' });
});

// ============================================
// COMISSÕES CALCULADAS
// ============================================

// GET /api/comissoes/calculadas - Listar comissões
comissoes.get('/calculadas', async (c) => {
  const empresaId = c.get('empresaId');
  const { vendedor_id, status, mes, ano, page = '1', limit = '50' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT cc.*, v.nome as vendedor_nome, p.numero as pedido_numero
               FROM comissoes_calculadas cc
               JOIN vendedores v ON cc.vendedor_id = v.id
               LEFT JOIN pedidos p ON cc.pedido_id = p.id
               WHERE cc.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (vendedor_id) {
    query += ` AND cc.vendedor_id = ?`;
    params.push(vendedor_id);
  }
  
  if (status) {
    query += ` AND cc.status = ?`;
    params.push(status);
  }
  
  if (mes && ano) {
    query += ` AND strftime('%m', cc.data_venda) = ? AND strftime('%Y', cc.data_venda) = ?`;
    params.push(String(mes).padStart(2, '0'), ano);
  }
  
  const countQuery = query.replace(/SELECT cc\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY cc.data_venda DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: result.results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult?.total || 0 }
  });
});

// POST /api/comissoes/calcular - Calcular comissões de um pedido
comissoes.post('/calcular', async (c) => {
  const empresaId = c.get('empresaId');
  const body = await c.req.json();
  
  const { pedido_id } = body;
  
  const pedido = await c.env.DB.prepare(`
    SELECT p.*, v.id as vendedor_id FROM pedidos p
    LEFT JOIN vendedores v ON p.vendedor_id = v.id
    WHERE p.id = ? AND p.empresa_id = ?
  `).bind(pedido_id, empresaId).first();
  
  if (!pedido || !pedido.vendedor_id) {
    return c.json({ error: 'Pedido não encontrado ou sem vendedor' }, 404);
  }
  
  // Buscar regra aplicável
  const regra = await c.env.DB.prepare(`
    SELECT * FROM comissoes_regras 
    WHERE empresa_id = ? AND ativo = 1
      AND (vendedor_id IS NULL OR vendedor_id = ?)
      AND (data_inicio IS NULL OR data_inicio <= date('now'))
      AND (data_fim IS NULL OR data_fim >= date('now'))
    ORDER BY prioridade DESC, vendedor_id DESC NULLS LAST
    LIMIT 1
  `).bind(empresaId, pedido.vendedor_id).first();
  
  if (!regra) {
    return c.json({ error: 'Nenhuma regra de comissão aplicável' }, 400);
  }
  
  // Calcular comissão
  let valorComissao = 0;
  const baseCalculo = regra.base_calculo === 'VALOR_LIQUIDO' 
    ? (pedido.valor_total as number) - (pedido.valor_desconto as number || 0)
    : pedido.valor_total as number;
  
  if (regra.tipo === 'PERCENTUAL') {
    valorComissao = baseCalculo * ((regra.percentual as number) / 100);
  } else if (regra.tipo === 'VALOR_FIXO') {
    valorComissao = regra.valor_fixo as number;
  } else if (regra.tipo === 'ESCALONADA' && regra.escala) {
    const escala = JSON.parse(regra.escala as string);
    for (const faixa of escala) {
      if (baseCalculo >= faixa.meta_minima && (!faixa.meta_maxima || baseCalculo <= faixa.meta_maxima)) {
        valorComissao = baseCalculo * (faixa.percentual / 100);
        break;
      }
    }
  }
  
  // Registrar comissão
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO comissoes_calculadas (id, empresa_id, vendedor_id, pedido_id, regra_id,
                                      valor_base, percentual_aplicado, valor_comissao,
                                      data_venda, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE')
  `).bind(id, empresaId, pedido.vendedor_id, pedido_id, regra.id, baseCalculo,
          regra.percentual || 0, valorComissao, pedido.data_pedido).run();
  
  return c.json({ id, valor_comissao: valorComissao, message: 'Comissão calculada' }, 201);
});

// PUT /api/comissoes/calculadas/:id/pagar - Marcar como paga
comissoes.put('/calculadas/:id/pagar', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE comissoes_calculadas SET status = 'PAGO', data_pagamento = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(body.data_pagamento || new Date().toISOString().split('T')[0], id, empresaId).run();
  
  return c.json({ message: 'Comissão marcada como paga' });
});

// POST /api/comissoes/calculadas/pagar-lote - Pagar várias comissões
comissoes.post('/calculadas/pagar-lote', async (c) => {
  const empresaId = c.get('empresaId');
  const body = await c.req.json();
  
  const { ids, data_pagamento } = body;
  
  await c.env.DB.prepare(`
    UPDATE comissoes_calculadas SET status = 'PAGO', data_pagamento = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id IN (${ids.map(() => '?').join(',')}) AND empresa_id = ?
  `).bind(data_pagamento || new Date().toISOString().split('T')[0], ...ids, empresaId).run();
  
  return c.json({ message: `${ids.length} comissões pagas` });
});

// ============================================
// BONIFICAÇÕES
// ============================================

// GET /api/comissoes/bonificacoes - Listar campanhas de bonificação
comissoes.get('/bonificacoes', async (c) => {
  const empresaId = c.get('empresaId');
  const { ativo } = c.req.query();
  
  let query = `SELECT b.*,
               (SELECT COUNT(*) FROM bonificacoes_participantes WHERE bonificacao_id = b.id) as total_participantes
               FROM bonificacoes b WHERE b.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (ativo !== undefined) {
    query += ` AND b.ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }
  
  query += ` ORDER BY b.data_fim DESC`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ success: true, data: result.results });
});

// POST /api/comissoes/bonificacoes - Criar campanha
comissoes.post('/bonificacoes', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    nome: z.string().min(1).max(100),
    descricao: z.string().optional(),
    tipo: z.enum(['META_VENDAS', 'META_PRODUTOS', 'META_CLIENTES', 'RANKING']),
    data_inicio: z.string(),
    data_fim: z.string(),
    meta_valor: z.number().optional(),
    meta_quantidade: z.number().int().optional(),
    premio: z.number().min(0),
    tipo_premio: z.enum(['DINHEIRO', 'PRODUTO', 'VIAGEM', 'OUTRO']).default('DINHEIRO'),
    regras: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO bonificacoes (id, empresa_id, nome, descricao, tipo, data_inicio, data_fim,
                              meta_valor, meta_quantidade, premio, tipo_premio, regras, ativo, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).bind(id, empresaId, data.nome, data.descricao || null, data.tipo, data.data_inicio, data.data_fim,
          data.meta_valor || null, data.meta_quantidade || null, data.premio, data.tipo_premio,
          data.regras || null, usuarioId).run();
  
  return c.json({ id, message: 'Campanha criada' }, 201);
});

// POST /api/comissoes/bonificacoes/:id/participantes - Adicionar participante
comissoes.post('/bonificacoes/:id/participantes', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const { vendedor_id } = body;
  
  const participanteId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO bonificacoes_participantes (id, bonificacao_id, vendedor_id, progresso_valor, progresso_quantidade)
    VALUES (?, ?, ?, 0, 0)
  `).bind(participanteId, id, vendedor_id).run();
  
  return c.json({ id: participanteId, message: 'Participante adicionado' }, 201);
});

// PUT /api/comissoes/bonificacoes/:id/atualizar-progresso - Atualizar progresso
comissoes.put('/bonificacoes/:id/atualizar-progresso', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const bonificacao = await c.env.DB.prepare(`
    SELECT * FROM bonificacoes WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!bonificacao) {
    return c.json({ error: 'Bonificação não encontrada' }, 404);
  }
  
  // Buscar participantes
  const participantes = await c.env.DB.prepare(`
    SELECT bp.*, v.nome as vendedor_nome FROM bonificacoes_participantes bp
    JOIN vendedores v ON bp.vendedor_id = v.id
    WHERE bp.bonificacao_id = ?
  `).bind(id).all();
  
  for (const participante of participantes.results as any[]) {
    // Calcular progresso baseado em vendas
    const vendas = await c.env.DB.prepare(`
      SELECT SUM(valor_total) as total_valor, COUNT(*) as total_quantidade
      FROM pedidos WHERE vendedor_id = ? AND empresa_id = ?
        AND data_pedido BETWEEN ? AND ? AND status NOT IN ('CANCELADO')
    `).bind(participante.vendedor_id, empresaId, bonificacao.data_inicio, bonificacao.data_fim).first();
    
    await c.env.DB.prepare(`
      UPDATE bonificacoes_participantes SET progresso_valor = ?, progresso_quantidade = ?,
                                            updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(vendas?.total_valor || 0, vendas?.total_quantidade || 0, participante.id).run();
  }
  
  return c.json({ message: 'Progresso atualizado' });
});

// GET /api/comissoes/bonificacoes/:id/ranking - Ranking da campanha
comissoes.get('/bonificacoes/:id/ranking', async (c) => {
  const { id } = c.req.param();
  
  const bonificacao = await c.env.DB.prepare(`SELECT * FROM bonificacoes WHERE id = ?`).bind(id).first();
  
  const result = await c.env.DB.prepare(`
    SELECT bp.*, v.nome as vendedor_nome,
           CASE WHEN ? = 'META_VENDAS' THEN bp.progresso_valor ELSE bp.progresso_quantidade END as progresso,
           CASE WHEN ? = 'META_VENDAS' THEN ? ELSE ? END as meta
    FROM bonificacoes_participantes bp
    JOIN vendedores v ON bp.vendedor_id = v.id
    WHERE bp.bonificacao_id = ?
    ORDER BY progresso DESC
  `).bind(bonificacao?.tipo, bonificacao?.tipo, bonificacao?.meta_valor, bonificacao?.meta_quantidade, id).all();
  
  return c.json({ success: true, data: result.results });
});

// ============================================
// RESUMOS E RELATÓRIOS
// ============================================

// GET /api/comissoes/resumo - Resumo de comissões por período
comissoes.get('/resumo', async (c) => {
  const empresaId = c.get('empresaId');
  const { mes, ano, vendedor_id } = c.req.query();
  
  if (!mes || !ano) {
    return c.json({ error: 'Mês e ano são obrigatórios' }, 400);
  }
  
  let query = `SELECT v.id as vendedor_id, v.nome as vendedor_nome,
               SUM(cc.valor_comissao) as total_comissao,
               SUM(CASE WHEN cc.status = 'PAGO' THEN cc.valor_comissao ELSE 0 END) as total_pago,
               SUM(CASE WHEN cc.status = 'PENDENTE' THEN cc.valor_comissao ELSE 0 END) as total_pendente,
               COUNT(*) as total_vendas
               FROM comissoes_calculadas cc
               JOIN vendedores v ON cc.vendedor_id = v.id
               WHERE cc.empresa_id = ?
                 AND strftime('%m', cc.data_venda) = ?
                 AND strftime('%Y', cc.data_venda) = ?`;
  const params: any[] = [empresaId, String(mes).padStart(2, '0'), ano];
  
  if (vendedor_id) {
    query += ` AND cc.vendedor_id = ?`;
    params.push(vendedor_id);
  }
  
  query += ` GROUP BY v.id ORDER BY total_comissao DESC`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  // Totais gerais
  const totais = (result.results as any[]).reduce((acc, r) => ({
    total_comissao: acc.total_comissao + r.total_comissao,
    total_pago: acc.total_pago + r.total_pago,
    total_pendente: acc.total_pendente + r.total_pendente
  }), { total_comissao: 0, total_pago: 0, total_pendente: 0 });
  
  return c.json({ success: true, data: { por_vendedor: result.results, totais } });
});

// GET /api/comissoes/extrato/:vendedorId - Extrato do vendedor
comissoes.get('/extrato/:vendedorId', async (c) => {
  const empresaId = c.get('empresaId');
  const { vendedorId } = c.req.param();
  const { mes, ano } = c.req.query();
  
  let query = `SELECT cc.*, p.numero as pedido_numero, p.cliente_id,
               cl.razao_social as cliente_nome
               FROM comissoes_calculadas cc
               LEFT JOIN pedidos p ON cc.pedido_id = p.id
               LEFT JOIN clientes cl ON p.cliente_id = cl.id
               WHERE cc.empresa_id = ? AND cc.vendedor_id = ?`;
  const params: any[] = [empresaId, vendedorId];
  
  if (mes && ano) {
    query += ` AND strftime('%m', cc.data_venda) = ? AND strftime('%Y', cc.data_venda) = ?`;
    params.push(String(mes).padStart(2, '0'), ano);
  }
  
  query += ` ORDER BY cc.data_venda DESC`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

export default comissoes;
