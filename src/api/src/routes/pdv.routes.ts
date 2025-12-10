// ============================================
// PLANAC ERP - Rotas de PDV
// Bloco 3 - Ponto de Venda
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const pdv = new Hono<{ Bindings: Env }>();

// ============================================
// TERMINAIS/CAIXAS PDV
// ============================================

// GET /api/pdv/terminais - Listar terminais
pdv.get('/terminais', async (c) => {
  const empresaId = c.get('empresaId');
  const { filial_id, ativo } = c.req.query();
  
  let query = `SELECT t.*, f.nome as filial_nome,
               (SELECT COUNT(*) FROM pdv_sessoes WHERE terminal_id = t.id AND status = 'ABERTA') as sessao_aberta
               FROM pdv_terminais t
               LEFT JOIN filiais f ON t.filial_id = f.id
               WHERE t.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (filial_id) {
    query += ` AND t.filial_id = ?`;
    params.push(filial_id);
  }
  
  if (ativo !== undefined) {
    query += ` AND t.ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }
  
  query += ` ORDER BY t.numero`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// POST /api/pdv/terminais - Criar terminal
pdv.post('/terminais', async (c) => {
  const empresaId = c.get('empresaId');
  const body = await c.req.json();
  
  const schema = z.object({
    filial_id: z.string().uuid(),
    numero: z.number().int().min(1),
    nome: z.string().max(50).optional(),
    serie_nfce: z.string().max(3).optional(),
    impressora: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO pdv_terminais (id, empresa_id, filial_id, numero, nome, serie_nfce, impressora, ativo)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).bind(id, empresaId, data.filial_id, data.numero, data.nome || `Terminal ${data.numero}`,
          data.serie_nfce || null, data.impressora || null).run();
  
  return c.json({ id, message: 'Terminal criado' }, 201);
});

// ============================================
// SESSÕES DE CAIXA
// ============================================

// GET /api/pdv/sessoes - Listar sessões
pdv.get('/sessoes', async (c) => {
  const empresaId = c.get('empresaId');
  const { terminal_id, status, operador_id, data } = c.req.query();
  
  let query = `SELECT s.*, t.numero as terminal_numero, t.nome as terminal_nome,
               u.nome as operador_nome
               FROM pdv_sessoes s
               JOIN pdv_terminais t ON s.terminal_id = t.id
               LEFT JOIN usuarios u ON s.operador_id = u.id
               WHERE t.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (terminal_id) {
    query += ` AND s.terminal_id = ?`;
    params.push(terminal_id);
  }
  
  if (status) {
    query += ` AND s.status = ?`;
    params.push(status);
  }
  
  if (operador_id) {
    query += ` AND s.operador_id = ?`;
    params.push(operador_id);
  }
  
  if (data) {
    query += ` AND DATE(s.data_abertura) = ?`;
    params.push(data);
  }
  
  query += ` ORDER BY s.data_abertura DESC`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// GET /api/pdv/sessoes/:id - Detalhes da sessão
pdv.get('/sessoes/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const sessao = await c.env.DB.prepare(`
    SELECT s.*, t.numero as terminal_numero, u.nome as operador_nome
    FROM pdv_sessoes s
    JOIN pdv_terminais t ON s.terminal_id = t.id
    LEFT JOIN usuarios u ON s.operador_id = u.id
    WHERE s.id = ? AND t.empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!sessao) {
    return c.json({ error: 'Sessão não encontrada' }, 404);
  }
  
  // Movimentações
  const movimentacoes = await c.env.DB.prepare(`
    SELECT * FROM pdv_movimentacoes WHERE sessao_id = ? ORDER BY created_at
  `).bind(id).all();
  
  // Vendas da sessão
  const vendas = await c.env.DB.prepare(`
    SELECT p.numero, p.valor_total, p.status, p.created_at
    FROM pedidos p WHERE p.sessao_pdv_id = ?
    ORDER BY p.created_at
  `).bind(id).all();
  
  // Resumo por forma de pagamento
  const resumoPagamentos = await c.env.DB.prepare(`
    SELECT forma_pagamento, SUM(valor) as total FROM pdv_movimentacoes 
    WHERE sessao_id = ? AND tipo = 'VENDA'
    GROUP BY forma_pagamento
  `).bind(id).all();
  
  return c.json({ 
    success: true, 
    data: { 
      ...sessao, 
      movimentacoes: movimentacoes.results,
      vendas: vendas.results,
      resumo_pagamentos: resumoPagamentos.results
    } 
  });
});

// POST /api/pdv/sessoes/abrir - Abrir sessão
pdv.post('/sessoes/abrir', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    terminal_id: z.string().uuid(),
    valor_abertura: z.number().min(0).default(0),
    observacao: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  const data = validation.data;
  
  // Verificar se já existe sessão aberta no terminal
  const sessaoAberta = await c.env.DB.prepare(`
    SELECT id FROM pdv_sessoes WHERE terminal_id = ? AND status = 'ABERTA'
  `).bind(data.terminal_id).first();
  
  if (sessaoAberta) {
    return c.json({ error: 'Já existe uma sessão aberta neste terminal' }, 400);
  }
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO pdv_sessoes (id, terminal_id, operador_id, data_abertura, valor_abertura, 
                             saldo_atual, status, observacao_abertura)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, 'ABERTA', ?)
  `).bind(id, data.terminal_id, usuarioId, data.valor_abertura, data.valor_abertura,
          data.observacao || null).run();
  
  // Registrar movimentação de abertura
  if (data.valor_abertura > 0) {
    await c.env.DB.prepare(`
      INSERT INTO pdv_movimentacoes (id, sessao_id, tipo, valor, forma_pagamento, descricao)
      VALUES (?, ?, 'ABERTURA', ?, 'DINHEIRO', 'Fundo de troco')
    `).bind(crypto.randomUUID(), id, data.valor_abertura).run();
  }
  
  return c.json({ id, message: 'Sessão aberta' }, 201);
});

// POST /api/pdv/sessoes/:id/fechar - Fechar sessão
pdv.post('/sessoes/:id/fechar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const sessao = await c.env.DB.prepare(`
    SELECT s.* FROM pdv_sessoes s
    JOIN pdv_terminais t ON s.terminal_id = t.id
    WHERE s.id = ? AND t.empresa_id = ? AND s.status = 'ABERTA'
  `).bind(id, empresaId).first();
  
  if (!sessao) {
    return c.json({ error: 'Sessão não encontrada ou já fechada' }, 404);
  }
  
  const { valor_fechamento, conferencia, observacao } = body;
  
  // Calcular diferença
  const diferenca = valor_fechamento - (sessao.saldo_atual as number);
  
  await c.env.DB.prepare(`
    UPDATE pdv_sessoes SET 
      status = 'FECHADA',
      data_fechamento = CURRENT_TIMESTAMP,
      valor_fechamento = ?,
      diferenca = ?,
      conferencia = ?,
      observacao_fechamento = ?,
      fechado_por = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(valor_fechamento, diferenca, conferencia ? JSON.stringify(conferencia) : null,
          observacao || null, usuarioId, id).run();
  
  return c.json({ 
    message: 'Sessão fechada',
    diferenca,
    status: diferenca === 0 ? 'CONFERIDO' : diferenca > 0 ? 'SOBRA' : 'FALTA'
  });
});

// ============================================
// MOVIMENTAÇÕES DE CAIXA
// ============================================

// POST /api/pdv/sessoes/:id/sangria - Registrar sangria
pdv.post('/sessoes/:id/sangria', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const { valor, motivo } = body;
  
  if (!valor || valor <= 0) {
    return c.json({ error: 'Valor inválido' }, 400);
  }
  
  const sessao = await c.env.DB.prepare(`
    SELECT s.* FROM pdv_sessoes s
    JOIN pdv_terminais t ON s.terminal_id = t.id
    WHERE s.id = ? AND t.empresa_id = ? AND s.status = 'ABERTA'
  `).bind(id, empresaId).first();
  
  if (!sessao) {
    return c.json({ error: 'Sessão não encontrada ou fechada' }, 404);
  }
  
  if (valor > (sessao.saldo_atual as number)) {
    return c.json({ error: 'Valor maior que saldo disponível' }, 400);
  }
  
  const movId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO pdv_movimentacoes (id, sessao_id, tipo, valor, forma_pagamento, descricao, usuario_id)
    VALUES (?, ?, 'SANGRIA', ?, 'DINHEIRO', ?, ?)
  `).bind(movId, id, -valor, motivo || 'Sangria de caixa', usuarioId).run();
  
  // Atualizar saldo
  await c.env.DB.prepare(`
    UPDATE pdv_sessoes SET saldo_atual = saldo_atual - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(valor, id).run();
  
  return c.json({ id: movId, message: 'Sangria registrada' }, 201);
});

// POST /api/pdv/sessoes/:id/suprimento - Registrar suprimento
pdv.post('/sessoes/:id/suprimento', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const { valor, motivo } = body;
  
  if (!valor || valor <= 0) {
    return c.json({ error: 'Valor inválido' }, 400);
  }
  
  const sessao = await c.env.DB.prepare(`
    SELECT s.* FROM pdv_sessoes s
    JOIN pdv_terminais t ON s.terminal_id = t.id
    WHERE s.id = ? AND t.empresa_id = ? AND s.status = 'ABERTA'
  `).bind(id, empresaId).first();
  
  if (!sessao) {
    return c.json({ error: 'Sessão não encontrada ou fechada' }, 404);
  }
  
  const movId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO pdv_movimentacoes (id, sessao_id, tipo, valor, forma_pagamento, descricao, usuario_id)
    VALUES (?, ?, 'SUPRIMENTO', ?, 'DINHEIRO', ?, ?)
  `).bind(movId, id, valor, motivo || 'Suprimento de caixa', usuarioId).run();
  
  // Atualizar saldo
  await c.env.DB.prepare(`
    UPDATE pdv_sessoes SET saldo_atual = saldo_atual + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(valor, id).run();
  
  return c.json({ id: movId, message: 'Suprimento registrado' }, 201);
});

// POST /api/pdv/sessoes/:id/venda - Registrar venda (recebimento)
pdv.post('/sessoes/:id/venda', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    pedido_id: z.string().uuid().optional(),
    valor: z.number().min(0.01),
    forma_pagamento: z.enum(['DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'CHEQUE', 'OUTROS']),
    troco: z.number().min(0).default(0),
    nsu: z.string().optional(),
    bandeira: z.string().optional(),
    parcelas: z.number().int().min(1).default(1)
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  const data = validation.data;
  
  const sessao = await c.env.DB.prepare(`
    SELECT s.* FROM pdv_sessoes s
    JOIN pdv_terminais t ON s.terminal_id = t.id
    WHERE s.id = ? AND t.empresa_id = ? AND s.status = 'ABERTA'
  `).bind(id, empresaId).first();
  
  if (!sessao) {
    return c.json({ error: 'Sessão não encontrada ou fechada' }, 404);
  }
  
  const movId = crypto.randomUUID();
  const valorLiquido = data.valor - data.troco;
  
  await c.env.DB.prepare(`
    INSERT INTO pdv_movimentacoes (id, sessao_id, tipo, valor, forma_pagamento, pedido_id, 
                                   troco, nsu, bandeira, parcelas, usuario_id)
    VALUES (?, ?, 'VENDA', ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(movId, id, valorLiquido, data.forma_pagamento, data.pedido_id || null,
          data.troco, data.nsu || null, data.bandeira || null, data.parcelas, usuarioId).run();
  
  // Atualizar saldo (apenas dinheiro afeta o saldo físico)
  if (data.forma_pagamento === 'DINHEIRO') {
    await c.env.DB.prepare(`
      UPDATE pdv_sessoes SET saldo_atual = saldo_atual + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(valorLiquido, id).run();
  }
  
  return c.json({ id: movId, message: 'Venda registrada' }, 201);
});

// ============================================
// VENDAS PDV
// ============================================

// POST /api/pdv/venda-rapida - Venda rápida (criar pedido + receber)
pdv.post('/venda-rapida', async (c) => {
  const empresaId = c.get('empresaId');
  const filialId = c.get('filialId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    sessao_id: z.string().uuid(),
    cliente_id: z.string().uuid().optional(),
    itens: z.array(z.object({
      produto_id: z.string().uuid(),
      quantidade: z.number().min(0.001),
      valor_unitario: z.number().min(0),
      desconto: z.number().min(0).default(0)
    })).min(1),
    pagamentos: z.array(z.object({
      forma: z.enum(['DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'CHEQUE']),
      valor: z.number().min(0.01),
      troco: z.number().min(0).default(0),
      nsu: z.string().optional(),
      bandeira: z.string().optional(),
      parcelas: z.number().int().min(1).default(1)
    })).min(1),
    cpf_nota: z.string().optional(),
    observacao: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const data = validation.data;
  
  // Verificar sessão
  const sessao = await c.env.DB.prepare(`
    SELECT s.*, t.filial_id FROM pdv_sessoes s
    JOIN pdv_terminais t ON s.terminal_id = t.id
    WHERE s.id = ? AND t.empresa_id = ? AND s.status = 'ABERTA'
  `).bind(data.sessao_id, empresaId).first();
  
  if (!sessao) {
    return c.json({ error: 'Sessão não encontrada ou fechada' }, 404);
  }
  
  // Calcular totais
  let valorTotal = 0;
  for (const item of data.itens) {
    valorTotal += (item.quantidade * item.valor_unitario) - item.desconto;
  }
  
  const totalPago = data.pagamentos.reduce((acc, p) => acc + p.valor - p.troco, 0);
  
  if (Math.abs(totalPago - valorTotal) > 0.01) {
    return c.json({ error: 'Valor dos pagamentos não confere com o total' }, 400);
  }
  
  // Obter próximo número
  const seqResult = await c.env.DB.prepare(`
    SELECT ultimo_numero FROM sequencias WHERE empresa_id = ? AND tipo = 'PEDIDO_PDV'
  `).bind(empresaId).first();
  
  const numeroSeq = ((seqResult?.ultimo_numero as number) || 0) + 1;
  const numeroPedido = `PDV${String(numeroSeq).padStart(8, '0')}`;
  
  // Criar pedido
  const pedidoId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO pedidos (id, empresa_id, filial_id, numero, cliente_id, vendedor_id,
                         valor_total, status, tipo, sessao_pdv_id, cpf_nota, observacao, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'FATURADO', 'PDV', ?, ?, ?, ?)
  `).bind(pedidoId, empresaId, sessao.filial_id, numeroPedido, data.cliente_id || null,
          usuarioId, valorTotal, data.sessao_id, data.cpf_nota || null, 
          data.observacao || null, usuarioId).run();
  
  // Inserir itens
  for (let i = 0; i < data.itens.length; i++) {
    const item = data.itens[i];
    await c.env.DB.prepare(`
      INSERT INTO pedidos_itens (id, pedido_id, produto_id, sequencia, quantidade, 
                                 valor_unitario, valor_desconto, valor_total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), pedidoId, item.produto_id, i + 1, item.quantidade,
            item.valor_unitario, item.desconto, (item.quantidade * item.valor_unitario) - item.desconto).run();
  }
  
  // Registrar pagamentos
  for (const pagamento of data.pagamentos) {
    await c.env.DB.prepare(`
      INSERT INTO pdv_movimentacoes (id, sessao_id, tipo, valor, forma_pagamento, pedido_id,
                                     troco, nsu, bandeira, parcelas, usuario_id)
      VALUES (?, ?, 'VENDA', ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), data.sessao_id, pagamento.valor - pagamento.troco, 
            pagamento.forma, pedidoId, pagamento.troco, pagamento.nsu || null,
            pagamento.bandeira || null, pagamento.parcelas, usuarioId).run();
    
    // Atualizar saldo se for dinheiro
    if (pagamento.forma === 'DINHEIRO') {
      await c.env.DB.prepare(`
        UPDATE pdv_sessoes SET saldo_atual = saldo_atual + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(pagamento.valor - pagamento.troco, data.sessao_id).run();
    }
  }
  
  // Atualizar sequência
  await c.env.DB.prepare(`
    UPDATE sequencias SET ultimo_numero = ? WHERE empresa_id = ? AND tipo = 'PEDIDO_PDV'
  `).bind(numeroSeq, empresaId).run();
  
  return c.json({ 
    pedido_id: pedidoId,
    numero: numeroPedido,
    valor_total: valorTotal,
    message: 'Venda realizada'
  }, 201);
});

// ============================================
// RELATÓRIOS PDV
// ============================================

// GET /api/pdv/relatorios/vendas-dia - Vendas do dia
pdv.get('/relatorios/vendas-dia', async (c) => {
  const empresaId = c.get('empresaId');
  const { data = new Date().toISOString().split('T')[0], terminal_id } = c.req.query();
  
  let query = `SELECT 
               COUNT(*) as total_vendas,
               SUM(m.valor) as valor_total,
               m.forma_pagamento
               FROM pdv_movimentacoes m
               JOIN pdv_sessoes s ON m.sessao_id = s.id
               JOIN pdv_terminais t ON s.terminal_id = t.id
               WHERE t.empresa_id = ? AND m.tipo = 'VENDA' AND DATE(m.created_at) = ?`;
  const params: any[] = [empresaId, data];
  
  if (terminal_id) {
    query += ` AND s.terminal_id = ?`;
    params.push(terminal_id);
  }
  
  query += ` GROUP BY m.forma_pagamento`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  // Totais gerais
  const totais = (result.results as any[]).reduce((acc, r) => ({
    vendas: acc.vendas + r.total_vendas,
    valor: acc.valor + r.valor_total
  }), { vendas: 0, valor: 0 });
  
  return c.json({ 
    success: true, 
    data: {
      data,
      por_forma_pagamento: result.results,
      totais
    }
  });
});

// GET /api/pdv/relatorios/fechamento - Relatório de fechamento
pdv.get('/relatorios/fechamento/:sessaoId', async (c) => {
  const empresaId = c.get('empresaId');
  const { sessaoId } = c.req.param();
  
  const sessao = await c.env.DB.prepare(`
    SELECT s.*, t.numero as terminal_numero, t.nome as terminal_nome,
           u.nome as operador_nome, f.nome as filial_nome
    FROM pdv_sessoes s
    JOIN pdv_terminais t ON s.terminal_id = t.id
    LEFT JOIN usuarios u ON s.operador_id = u.id
    LEFT JOIN filiais f ON t.filial_id = f.id
    WHERE s.id = ? AND t.empresa_id = ?
  `).bind(sessaoId, empresaId).first();
  
  if (!sessao) {
    return c.json({ error: 'Sessão não encontrada' }, 404);
  }
  
  // Resumo de movimentações
  const movimentacoes = await c.env.DB.prepare(`
    SELECT tipo, forma_pagamento, SUM(valor) as total, COUNT(*) as quantidade
    FROM pdv_movimentacoes WHERE sessao_id = ?
    GROUP BY tipo, forma_pagamento
  `).bind(sessaoId).all();
  
  // Vendas detalhadas
  const vendas = await c.env.DB.prepare(`
    SELECT m.*, p.numero as pedido_numero
    FROM pdv_movimentacoes m
    LEFT JOIN pedidos p ON m.pedido_id = p.id
    WHERE m.sessao_id = ? AND m.tipo = 'VENDA'
    ORDER BY m.created_at
  `).bind(sessaoId).all();
  
  return c.json({
    success: true,
    data: {
      sessao,
      movimentacoes: movimentacoes.results,
      vendas: vendas.results
    }
  });
});

export default pdv;
