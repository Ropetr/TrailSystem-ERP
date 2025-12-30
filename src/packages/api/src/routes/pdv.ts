// =============================================
// TRAILSYSTEM ERP - Rotas do PDV (Ponto de Venda)
// Fluxo completo: abertura/fechamento caixa, vendas, NFC-e
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const pdv = new Hono<{ Bindings: Env }>();

// =============================================
// CAIXAS/TERMINAIS
// =============================================

// GET /pdv/caixas - Listar caixas
pdv.get('/caixas', async (c) => {
  const { empresa_id, filial_id, ativo } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND empresa_id = ?';
      params.push(empresa_id);
    }

    if (filial_id) {
      where += ' AND filial_id = ?';
      params.push(filial_id);
    }

    if (ativo !== undefined) {
      where += ' AND ativo = ?';
      params.push(ativo === 'true' ? 1 : 0);
    }

    const result = await c.env.DB.prepare(`
      SELECT * FROM pdv_caixas ${where} ORDER BY codigo
    `).bind(...params).all();

    return c.json({ success: true, data: result.results });
  } catch (error: any) {
    console.error('Erro ao listar caixas:', error);
    return c.json({ success: false, error: 'Erro ao listar caixas' }, 500);
  }
});

// POST /pdv/caixas - Criar caixa
pdv.post('/caixas', async (c) => {
  try {
    const body = await c.req.json<{
      codigo: string;
      nome: string;
      tipo?: string;
      filial_id?: string;
      impressora_nfce?: string;
      impressora_cupom?: string;
      serie_nfce?: string;
      empresa_id: string;
    }>();

    if (!body.codigo || !body.nome) {
      return c.json({ success: false, error: 'Codigo e nome sao obrigatorios' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO pdv_caixas (
        id, empresa_id, filial_id, codigo, nome, tipo,
        impressora_nfce, impressora_cupom, serie_nfce, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.empresa_id, body.filial_id || null,
      body.codigo, body.nome, body.tipo || 'caixa',
      body.impressora_nfce || null, body.impressora_cupom || null,
      body.serie_nfce || null, now, now
    ).run();

    return c.json({ success: true, data: { id }, message: 'Caixa criado' }, 201);
  } catch (error: any) {
    console.error('Erro ao criar caixa:', error);
    return c.json({ success: false, error: 'Erro ao criar caixa' }, 500);
  }
});

// =============================================
// SESSOES (ABERTURA/FECHAMENTO)
// =============================================

// GET /pdv/sessoes - Listar sessoes
pdv.get('/sessoes', async (c) => {
  const { empresa_id, caixa_id, status, data } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND s.empresa_id = ?';
      params.push(empresa_id);
    }

    if (caixa_id) {
      where += ' AND s.caixa_id = ?';
      params.push(caixa_id);
    }

    if (status) {
      where += ' AND s.status = ?';
      params.push(status);
    }

    if (data) {
      where += ' AND date(s.data_abertura) = ?';
      params.push(data);
    }

    const result = await c.env.DB.prepare(`
      SELECT s.*, c.codigo as caixa_codigo, c.nome as caixa_nome
      FROM pdv_sessoes s
      JOIN pdv_caixas c ON c.id = s.caixa_id
      ${where}
      ORDER BY s.data_abertura DESC
    `).bind(...params).all();

    return c.json({ success: true, data: result.results });
  } catch (error: any) {
    console.error('Erro ao listar sessoes:', error);
    return c.json({ success: false, error: 'Erro ao listar sessoes' }, 500);
  }
});

// GET /pdv/sessoes/:id - Buscar sessao por ID
pdv.get('/sessoes/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const sessao = await c.env.DB.prepare(`
      SELECT s.*, c.codigo as caixa_codigo, c.nome as caixa_nome
      FROM pdv_sessoes s
      JOIN pdv_caixas c ON c.id = s.caixa_id
      WHERE s.id = ?
    `).bind(id).first();

    if (!sessao) {
      return c.json({ success: false, error: 'Sessao nao encontrada' }, 404);
    }

    const vendas = await c.env.DB.prepare(`
      SELECT id, numero, status, cliente_nome, total, data_venda
      FROM pdv_vendas WHERE sessao_id = ? ORDER BY created_at DESC
    `).bind(id).all();

    const movimentacoes = await c.env.DB.prepare(`
      SELECT * FROM pdv_movimentacoes WHERE sessao_id = ? ORDER BY created_at DESC
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...sessao,
        vendas: vendas.results,
        movimentacoes: movimentacoes.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar sessao:', error);
    return c.json({ success: false, error: 'Erro ao buscar sessao' }, 500);
  }
});

// POST /pdv/sessoes/abrir - Abrir caixa
pdv.post('/sessoes/abrir', async (c) => {
  try {
    const body = await c.req.json<{
      caixa_id: string;
      valor_abertura: number;
      operador_id?: string;
      operador_nome?: string;
      observacao?: string;
      empresa_id: string;
    }>();

    if (!body.caixa_id || body.valor_abertura === undefined) {
      return c.json({ success: false, error: 'Caixa e valor de abertura sao obrigatorios' }, 400);
    }

    const sessaoAberta = await c.env.DB.prepare(`
      SELECT id FROM pdv_sessoes WHERE caixa_id = ? AND status = 'aberto'
    `).bind(body.caixa_id).first();

    if (sessaoAberta) {
      return c.json({ success: false, error: 'Este caixa ja possui uma sessao aberta' }, 400);
    }

    const ultimaSessao = await c.env.DB.prepare(`
      SELECT MAX(numero_sessao) as ultimo FROM pdv_sessoes WHERE caixa_id = ?
    `).bind(body.caixa_id).first<{ ultimo: number }>();

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const numeroSessao = (ultimaSessao?.ultimo || 0) + 1;

    await c.env.DB.prepare(`
      INSERT INTO pdv_sessoes (
        id, empresa_id, caixa_id, numero_sessao, status, data_abertura,
        operador_abertura_id, operador_abertura_nome, valor_abertura,
        observacao_abertura, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'aberto', ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.empresa_id, body.caixa_id, numeroSessao, now,
      body.operador_id || null, body.operador_nome || null,
      body.valor_abertura, body.observacao || null, now, now
    ).run();

    return c.json({
      success: true,
      data: { id, numero_sessao: numeroSessao },
      message: 'Caixa aberto com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao abrir caixa:', error);
    return c.json({ success: false, error: 'Erro ao abrir caixa' }, 500);
  }
});

// POST /pdv/sessoes/:id/fechar - Fechar caixa
pdv.post('/sessoes/:id/fechar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      valor_dinheiro_informado: number;
      operador_id?: string;
      operador_nome?: string;
      observacao?: string;
    }>();

    const sessao = await c.env.DB.prepare(`
      SELECT * FROM pdv_sessoes WHERE id = ?
    `).bind(id).first<any>();

    if (!sessao) {
      return c.json({ success: false, error: 'Sessao nao encontrada' }, 404);
    }

    if (sessao.status !== 'aberto') {
      return c.json({ success: false, error: 'Sessao nao esta aberta' }, 400);
    }

    const vendas = await c.env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'finalizada' THEN 1 ELSE 0 END) as qtd_vendas,
        SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as qtd_cancelamentos
      FROM pdv_vendas WHERE sessao_id = ?
    `).bind(id).first<any>();

    const pagamentos = await c.env.DB.prepare(`
      SELECT 
        forma_pagamento,
        SUM(valor) as total
      FROM pdv_vendas_pagamentos p
      JOIN pdv_vendas v ON v.id = p.venda_id
      WHERE v.sessao_id = ? AND v.status = 'finalizada'
      GROUP BY forma_pagamento
    `).bind(id).all();

    let valorDinheiro = 0;
    let valorCartaoCredito = 0;
    let valorCartaoDebito = 0;
    let valorPix = 0;
    let valorOutros = 0;

    for (const pag of pagamentos.results as any[]) {
      switch (pag.forma_pagamento) {
        case 'dinheiro':
          valorDinheiro = pag.total;
          break;
        case 'cartao_credito':
          valorCartaoCredito = pag.total;
          break;
        case 'cartao_debito':
          valorCartaoDebito = pag.total;
          break;
        case 'pix':
          valorPix = pag.total;
          break;
        default:
          valorOutros += pag.total;
      }
    }

    const movimentacoes = await c.env.DB.prepare(`
      SELECT tipo, SUM(valor) as total FROM pdv_movimentacoes WHERE sessao_id = ? GROUP BY tipo
    `).bind(id).all();

    let valorSangrias = 0;
    let valorSuprimentos = 0;

    for (const mov of movimentacoes.results as any[]) {
      if (mov.tipo === 'sangria') valorSangrias = mov.total;
      if (mov.tipo === 'suprimento') valorSuprimentos = mov.total;
    }

    const valorVendasTotal = valorDinheiro + valorCartaoCredito + valorCartaoDebito + valorPix + valorOutros;
    const valorEsperado = sessao.valor_abertura + valorDinheiro + valorSuprimentos - valorSangrias;
    const valorDiferenca = body.valor_dinheiro_informado - valorEsperado;

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE pdv_sessoes SET
        status = 'fechado',
        data_fechamento = ?,
        operador_fechamento_id = ?,
        operador_fechamento_nome = ?,
        valor_vendas_dinheiro = ?,
        valor_vendas_cartao_credito = ?,
        valor_vendas_cartao_debito = ?,
        valor_vendas_pix = ?,
        valor_vendas_outros = ?,
        valor_vendas_total = ?,
        valor_sangrias = ?,
        valor_suprimentos = ?,
        valor_esperado = ?,
        valor_informado = ?,
        valor_diferenca = ?,
        qtd_vendas = ?,
        qtd_cancelamentos = ?,
        observacao_fechamento = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      now, body.operador_id || null, body.operador_nome || null,
      valorDinheiro, valorCartaoCredito, valorCartaoDebito, valorPix, valorOutros,
      valorVendasTotal, valorSangrias, valorSuprimentos,
      valorEsperado, body.valor_dinheiro_informado, valorDiferenca,
      vendas?.qtd_vendas || 0, vendas?.qtd_cancelamentos || 0,
      body.observacao || null, now, id
    ).run();

    return c.json({
      success: true,
      data: {
        valor_esperado: valorEsperado,
        valor_informado: body.valor_dinheiro_informado,
        diferenca: valorDiferenca,
        vendas_total: valorVendasTotal
      },
      message: 'Caixa fechado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao fechar caixa:', error);
    return c.json({ success: false, error: 'Erro ao fechar caixa' }, 500);
  }
});

// =============================================
// VENDAS PDV
// =============================================

// GET /pdv/vendas - Listar vendas
pdv.get('/vendas', async (c) => {
  const { empresa_id, sessao_id, status, data, page = '1', limit = '50' } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND v.empresa_id = ?';
      params.push(empresa_id);
    }

    if (sessao_id) {
      where += ' AND v.sessao_id = ?';
      params.push(sessao_id);
    }

    if (status) {
      where += ' AND v.status = ?';
      params.push(status);
    }

    if (data) {
      where += ' AND date(v.data_venda) = ?';
      params.push(data);
    }

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM pdv_vendas v ${where}
    `).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await c.env.DB.prepare(`
      SELECT v.*, c.codigo as caixa_codigo
      FROM pdv_vendas v
      JOIN pdv_caixas c ON c.id = v.caixa_id
      ${where}
      ORDER BY v.created_at DESC
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
    console.error('Erro ao listar vendas:', error);
    return c.json({ success: false, error: 'Erro ao listar vendas' }, 500);
  }
});

// GET /pdv/vendas/:id - Buscar venda por ID
pdv.get('/vendas/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const venda = await c.env.DB.prepare(`
      SELECT v.*, c.codigo as caixa_codigo, c.nome as caixa_nome
      FROM pdv_vendas v
      JOIN pdv_caixas c ON c.id = v.caixa_id
      WHERE v.id = ?
    `).bind(id).first();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada' }, 404);
    }

    const itens = await c.env.DB.prepare(`
      SELECT * FROM pdv_vendas_itens WHERE venda_id = ?
    `).bind(id).all();

    const pagamentos = await c.env.DB.prepare(`
      SELECT * FROM pdv_vendas_pagamentos WHERE venda_id = ?
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...venda,
        itens: itens.results,
        pagamentos: pagamentos.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar venda:', error);
    return c.json({ success: false, error: 'Erro ao buscar venda' }, 500);
  }
});

// POST /pdv/vendas - Iniciar venda
pdv.post('/vendas', async (c) => {
  try {
    const body = await c.req.json<{
      sessao_id: string;
      caixa_id: string;
      cliente_id?: string;
      cliente_nome?: string;
      cliente_cpf_cnpj?: string;
      vendedor_id?: string;
      vendedor_nome?: string;
      empresa_id: string;
    }>();

    if (!body.sessao_id || !body.caixa_id) {
      return c.json({ success: false, error: 'Sessao e caixa sao obrigatorios' }, 400);
    }

    const sessao = await c.env.DB.prepare(`
      SELECT * FROM pdv_sessoes WHERE id = ? AND status = 'aberto'
    `).bind(body.sessao_id).first();

    if (!sessao) {
      return c.json({ success: false, error: 'Sessao nao encontrada ou nao esta aberta' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const ultimaVenda = await c.env.DB.prepare(`
      SELECT MAX(CAST(numero AS INTEGER)) as ultimo FROM pdv_vendas WHERE empresa_id = ?
    `).bind(body.empresa_id).first<{ ultimo: number }>();

    const numero = String((ultimaVenda?.ultimo || 0) + 1).padStart(8, '0');

    await c.env.DB.prepare(`
      INSERT INTO pdv_vendas (
        id, empresa_id, sessao_id, caixa_id, numero, status,
        cliente_id, cliente_nome, cliente_cpf_cnpj,
        vendedor_id, vendedor_nome, data_venda, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'em_andamento', ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.empresa_id, body.sessao_id, body.caixa_id, numero,
      body.cliente_id || null, body.cliente_nome || null, body.cliente_cpf_cnpj || null,
      body.vendedor_id || null, body.vendedor_nome || null, now, now, now
    ).run();

    return c.json({
      success: true,
      data: { id, numero },
      message: 'Venda iniciada'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao iniciar venda:', error);
    return c.json({ success: false, error: 'Erro ao iniciar venda' }, 500);
  }
});

// POST /pdv/vendas/:id/itens - Adicionar item a venda
pdv.post('/vendas/:id/itens', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      produto_id: string;
      produto_codigo?: string;
      produto_nome?: string;
      produto_ean?: string;
      quantidade: number;
      valor_unitario: number;
      desconto_percentual?: number;
      desconto_valor?: number;
    }>();

    if (!body.produto_id || !body.quantidade || !body.valor_unitario) {
      return c.json({ success: false, error: 'Produto, quantidade e valor sao obrigatorios' }, 400);
    }

    const venda = await c.env.DB.prepare(`
      SELECT * FROM pdv_vendas WHERE id = ? AND status = 'em_andamento'
    `).bind(id).first();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada ou ja finalizada' }, 400);
    }

    const now = new Date().toISOString();

    const descontoPercentual = body.desconto_percentual || 0;
    const valorBruto = body.quantidade * body.valor_unitario;
    const descontoValor = body.desconto_valor || (valorBruto * descontoPercentual / 100);
    const valorTotal = valorBruto - descontoValor;

    const itemId = crypto.randomUUID();

    await c.env.DB.prepare(`
      INSERT INTO pdv_vendas_itens (
        id, venda_id, produto_id, produto_codigo, produto_nome, produto_ean,
        quantidade, unidade, valor_unitario, desconto_percentual, desconto_valor,
        valor_total, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'UN', ?, ?, ?, ?, ?)
    `).bind(
      itemId, id, body.produto_id, body.produto_codigo || null,
      body.produto_nome || null, body.produto_ean || null,
      body.quantidade, body.valor_unitario, descontoPercentual, descontoValor,
      valorTotal, now
    ).run();

    const totais = await c.env.DB.prepare(`
      SELECT SUM(valor_total) as subtotal, SUM(desconto_valor) as desconto_total
      FROM pdv_vendas_itens WHERE venda_id = ? AND cancelado = 0
    `).bind(id).first<any>();

    await c.env.DB.prepare(`
      UPDATE pdv_vendas SET 
        subtotal = ?,
        desconto_valor = ?,
        total = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      totais?.subtotal || 0, totais?.desconto_total || 0,
      totais?.subtotal || 0, now, id
    ).run();

    return c.json({
      success: true,
      data: { item_id: itemId, valor_total: valorTotal },
      message: 'Item adicionado'
    });
  } catch (error: any) {
    console.error('Erro ao adicionar item:', error);
    return c.json({ success: false, error: 'Erro ao adicionar item' }, 500);
  }
});

// DELETE /pdv/vendas/:id/itens/:item_id - Remover item da venda
pdv.delete('/vendas/:id/itens/:item_id', async (c) => {
  const { id, item_id } = c.req.param();

  try {
    const body = await c.req.json<{
      motivo?: string;
    }>();

    const venda = await c.env.DB.prepare(`
      SELECT * FROM pdv_vendas WHERE id = ? AND status = 'em_andamento'
    `).bind(id).first();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada ou ja finalizada' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE pdv_vendas_itens SET cancelado = 1, motivo_cancelamento = ? WHERE id = ?
    `).bind(body.motivo || null, item_id).run();

    const totais = await c.env.DB.prepare(`
      SELECT SUM(valor_total) as subtotal, SUM(desconto_valor) as desconto_total
      FROM pdv_vendas_itens WHERE venda_id = ? AND cancelado = 0
    `).bind(id).first<any>();

    await c.env.DB.prepare(`
      UPDATE pdv_vendas SET 
        subtotal = ?,
        desconto_valor = ?,
        total = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      totais?.subtotal || 0, totais?.desconto_total || 0,
      totais?.subtotal || 0, now, id
    ).run();

    return c.json({ success: true, message: 'Item removido' });
  } catch (error: any) {
    console.error('Erro ao remover item:', error);
    return c.json({ success: false, error: 'Erro ao remover item' }, 500);
  }
});

// POST /pdv/vendas/:id/pagamentos - Adicionar pagamento
pdv.post('/vendas/:id/pagamentos', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      forma_pagamento: string;
      valor: number;
      bandeira?: string;
      nsu?: string;
      autorizacao?: string;
      parcelas?: number;
      pix_txid?: string;
    }>();

    if (!body.forma_pagamento || !body.valor) {
      return c.json({ success: false, error: 'Forma de pagamento e valor sao obrigatorios' }, 400);
    }

    const venda = await c.env.DB.prepare(`
      SELECT * FROM pdv_vendas WHERE id = ? AND status = 'em_andamento'
    `).bind(id).first<any>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada ou ja finalizada' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO pdv_vendas_pagamentos (
        id, venda_id, forma_pagamento, valor, bandeira, nsu, autorizacao, parcelas, pix_txid, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, body.forma_pagamento, body.valor,
      body.bandeira || null, body.nsu || null, body.autorizacao || null,
      body.parcelas || 1, body.pix_txid || null, now
    ).run();

    const totalPago = await c.env.DB.prepare(`
      SELECT SUM(valor) as total FROM pdv_vendas_pagamentos WHERE venda_id = ?
    `).bind(id).first<{ total: number }>();

    const troco = (totalPago?.total || 0) > venda.total ? (totalPago?.total || 0) - venda.total : 0;

    await c.env.DB.prepare(`
      UPDATE pdv_vendas SET troco = ?, updated_at = ? WHERE id = ?
    `).bind(troco, now, id).run();

    return c.json({
      success: true,
      data: {
        total_pago: totalPago?.total || 0,
        total_venda: venda.total,
        troco: troco,
        falta: Math.max(0, venda.total - (totalPago?.total || 0))
      },
      message: 'Pagamento registrado'
    });
  } catch (error: any) {
    console.error('Erro ao adicionar pagamento:', error);
    return c.json({ success: false, error: 'Erro ao adicionar pagamento' }, 500);
  }
});

// POST /pdv/vendas/:id/finalizar - Finalizar venda
pdv.post('/vendas/:id/finalizar', async (c) => {
  const { id } = c.req.param();

  try {
    const venda = await c.env.DB.prepare(`
      SELECT * FROM pdv_vendas WHERE id = ? AND status = 'em_andamento'
    `).bind(id).first<any>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada ou ja finalizada' }, 400);
    }

    const totalPago = await c.env.DB.prepare(`
      SELECT SUM(valor) as total FROM pdv_vendas_pagamentos WHERE venda_id = ?
    `).bind(id).first<{ total: number }>();

    if ((totalPago?.total || 0) < venda.total) {
      return c.json({ 
        success: false, 
        error: 'Pagamento insuficiente',
        data: { falta: venda.total - (totalPago?.total || 0) }
      }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE pdv_vendas SET status = 'finalizada', updated_at = ? WHERE id = ?
    `).bind(now, id).run();

    const itens = await c.env.DB.prepare(`
      SELECT produto_id, quantidade FROM pdv_vendas_itens WHERE venda_id = ? AND cancelado = 0
    `).bind(id).all();

    for (const item of itens.results as any[]) {
      await c.env.DB.prepare(`
        INSERT INTO estoque_movimentacoes (
          id, empresa_id, produto_id, tipo, quantidade, documento_tipo, documento_id, observacao, created_at
        ) VALUES (?, ?, ?, 'saida', ?, 'pdv', ?, ?, ?)
      `).bind(
        crypto.randomUUID(), venda.empresa_id, item.produto_id,
        item.quantidade, id, `Venda PDV ${venda.numero}`, now
      ).run();
    }

    return c.json({
      success: true,
      data: { numero: venda.numero, total: venda.total, troco: venda.troco },
      message: 'Venda finalizada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao finalizar venda:', error);
    return c.json({ success: false, error: 'Erro ao finalizar venda' }, 500);
  }
});

// POST /pdv/vendas/:id/cancelar - Cancelar venda
pdv.post('/vendas/:id/cancelar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      motivo: string;
    }>();

    if (!body.motivo) {
      return c.json({ success: false, error: 'Motivo do cancelamento e obrigatorio' }, 400);
    }

    const venda = await c.env.DB.prepare(`
      SELECT * FROM pdv_vendas WHERE id = ?
    `).bind(id).first<any>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada' }, 404);
    }

    if (venda.status === 'cancelada') {
      return c.json({ success: false, error: 'Venda ja esta cancelada' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE pdv_vendas SET status = 'cancelada', motivo_cancelamento = ?, updated_at = ? WHERE id = ?
    `).bind(body.motivo, now, id).run();

    return c.json({ success: true, message: 'Venda cancelada' });
  } catch (error: any) {
    console.error('Erro ao cancelar venda:', error);
    return c.json({ success: false, error: 'Erro ao cancelar venda' }, 500);
  }
});

// =============================================
// MOVIMENTACOES (SANGRIA/SUPRIMENTO)
// =============================================

// POST /pdv/movimentacoes/sangria - Registrar sangria
pdv.post('/movimentacoes/sangria', async (c) => {
  try {
    const body = await c.req.json<{
      sessao_id: string;
      valor: number;
      motivo: string;
      operador_id?: string;
      operador_nome?: string;
      autorizado_por_id?: string;
      autorizado_por_nome?: string;
      empresa_id: string;
    }>();

    if (!body.sessao_id || !body.valor || !body.motivo) {
      return c.json({ success: false, error: 'Sessao, valor e motivo sao obrigatorios' }, 400);
    }

    const sessao = await c.env.DB.prepare(`
      SELECT * FROM pdv_sessoes WHERE id = ? AND status = 'aberto'
    `).bind(body.sessao_id).first();

    if (!sessao) {
      return c.json({ success: false, error: 'Sessao nao encontrada ou nao esta aberta' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO pdv_movimentacoes (
        id, empresa_id, sessao_id, tipo, valor, motivo,
        operador_id, operador_nome, autorizado_por_id, autorizado_por_nome, created_at
      ) VALUES (?, ?, ?, 'sangria', ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), body.empresa_id, body.sessao_id, body.valor, body.motivo,
      body.operador_id || null, body.operador_nome || null,
      body.autorizado_por_id || null, body.autorizado_por_nome || null, now
    ).run();

    return c.json({ success: true, message: 'Sangria registrada' });
  } catch (error: any) {
    console.error('Erro ao registrar sangria:', error);
    return c.json({ success: false, error: 'Erro ao registrar sangria' }, 500);
  }
});

// POST /pdv/movimentacoes/suprimento - Registrar suprimento
pdv.post('/movimentacoes/suprimento', async (c) => {
  try {
    const body = await c.req.json<{
      sessao_id: string;
      valor: number;
      motivo: string;
      operador_id?: string;
      operador_nome?: string;
      autorizado_por_id?: string;
      autorizado_por_nome?: string;
      empresa_id: string;
    }>();

    if (!body.sessao_id || !body.valor || !body.motivo) {
      return c.json({ success: false, error: 'Sessao, valor e motivo sao obrigatorios' }, 400);
    }

    const sessao = await c.env.DB.prepare(`
      SELECT * FROM pdv_sessoes WHERE id = ? AND status = 'aberto'
    `).bind(body.sessao_id).first();

    if (!sessao) {
      return c.json({ success: false, error: 'Sessao nao encontrada ou nao esta aberta' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO pdv_movimentacoes (
        id, empresa_id, sessao_id, tipo, valor, motivo,
        operador_id, operador_nome, autorizado_por_id, autorizado_por_nome, created_at
      ) VALUES (?, ?, ?, 'suprimento', ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), body.empresa_id, body.sessao_id, body.valor, body.motivo,
      body.operador_id || null, body.operador_nome || null,
      body.autorizado_por_id || null, body.autorizado_por_nome || null, now
    ).run();

    return c.json({ success: true, message: 'Suprimento registrado' });
  } catch (error: any) {
    console.error('Erro ao registrar suprimento:', error);
    return c.json({ success: false, error: 'Erro ao registrar suprimento' }, 500);
  }
});

// =============================================
// CONFIGURACOES
// =============================================

// GET /pdv/config - Buscar configuracoes
pdv.get('/config', async (c) => {
  const { empresa_id } = c.req.query();

  try {
    if (!empresa_id) {
      return c.json({ success: false, error: 'empresa_id e obrigatorio' }, 400);
    }

    let config = await c.env.DB.prepare(`
      SELECT * FROM config_pdv WHERE empresa_id = ?
    `).bind(empresa_id).first();

    if (!config) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await c.env.DB.prepare(`
        INSERT INTO config_pdv (id, empresa_id, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).bind(id, empresa_id, now, now).run();

      config = await c.env.DB.prepare(`
        SELECT * FROM config_pdv WHERE empresa_id = ?
      `).bind(empresa_id).first();
    }

    return c.json({ success: true, data: config });
  } catch (error: any) {
    console.error('Erro ao buscar config:', error);
    return c.json({ success: false, error: 'Erro ao buscar config' }, 500);
  }
});

// PUT /pdv/config - Atualizar configuracoes
pdv.put('/config', async (c) => {
  try {
    const body = await c.req.json<{
      permitir_desconto?: boolean;
      desconto_maximo_percentual?: number;
      desconto_requer_senha?: boolean;
      permitir_venda_sem_estoque?: boolean;
      identificar_cliente_obrigatorio?: boolean;
      cpf_na_nota_obrigatorio?: boolean;
      emitir_nfce_automatico?: boolean;
      imprimir_cupom_automatico?: boolean;
      abrir_gaveta_dinheiro?: boolean;
      sangria_requer_autorizacao?: boolean;
      suprimento_requer_autorizacao?: boolean;
      diferenca_caixa_tolerancia?: number;
      empresa_id: string;
    }>();

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE config_pdv SET
        permitir_desconto = COALESCE(?, permitir_desconto),
        desconto_maximo_percentual = COALESCE(?, desconto_maximo_percentual),
        desconto_requer_senha = COALESCE(?, desconto_requer_senha),
        permitir_venda_sem_estoque = COALESCE(?, permitir_venda_sem_estoque),
        identificar_cliente_obrigatorio = COALESCE(?, identificar_cliente_obrigatorio),
        cpf_na_nota_obrigatorio = COALESCE(?, cpf_na_nota_obrigatorio),
        emitir_nfce_automatico = COALESCE(?, emitir_nfce_automatico),
        imprimir_cupom_automatico = COALESCE(?, imprimir_cupom_automatico),
        abrir_gaveta_dinheiro = COALESCE(?, abrir_gaveta_dinheiro),
        sangria_requer_autorizacao = COALESCE(?, sangria_requer_autorizacao),
        suprimento_requer_autorizacao = COALESCE(?, suprimento_requer_autorizacao),
        diferenca_caixa_tolerancia = COALESCE(?, diferenca_caixa_tolerancia),
        updated_at = ?
      WHERE empresa_id = ?
    `).bind(
      body.permitir_desconto !== undefined ? (body.permitir_desconto ? 1 : 0) : null,
      body.desconto_maximo_percentual ?? null,
      body.desconto_requer_senha !== undefined ? (body.desconto_requer_senha ? 1 : 0) : null,
      body.permitir_venda_sem_estoque !== undefined ? (body.permitir_venda_sem_estoque ? 1 : 0) : null,
      body.identificar_cliente_obrigatorio !== undefined ? (body.identificar_cliente_obrigatorio ? 1 : 0) : null,
      body.cpf_na_nota_obrigatorio !== undefined ? (body.cpf_na_nota_obrigatorio ? 1 : 0) : null,
      body.emitir_nfce_automatico !== undefined ? (body.emitir_nfce_automatico ? 1 : 0) : null,
      body.imprimir_cupom_automatico !== undefined ? (body.imprimir_cupom_automatico ? 1 : 0) : null,
      body.abrir_gaveta_dinheiro !== undefined ? (body.abrir_gaveta_dinheiro ? 1 : 0) : null,
      body.sangria_requer_autorizacao !== undefined ? (body.sangria_requer_autorizacao ? 1 : 0) : null,
      body.suprimento_requer_autorizacao !== undefined ? (body.suprimento_requer_autorizacao ? 1 : 0) : null,
      body.diferenca_caixa_tolerancia ?? null,
      now, body.empresa_id
    ).run();

    return c.json({ success: true, message: 'Configuracoes atualizadas' });
  } catch (error: any) {
    console.error('Erro ao atualizar config:', error);
    return c.json({ success: false, error: 'Erro ao atualizar config' }, 500);
  }
});

// =============================================
// DASHBOARD
// =============================================

// GET /pdv/dashboard/resumo - Dashboard do PDV
pdv.get('/dashboard/resumo', async (c) => {
  const { empresa_id, data } = c.req.query();

  try {
    if (!empresa_id) {
      return c.json({ success: false, error: 'empresa_id e obrigatorio' }, 400);
    }

    const dataConsulta = data || new Date().toISOString().split('T')[0];

    const sessoesAbertas = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM pdv_sessoes WHERE empresa_id = ? AND status = 'aberto'
    `).bind(empresa_id).first<{ total: number }>();

    const vendasHoje = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_vendas,
        SUM(CASE WHEN status = 'finalizada' THEN total ELSE 0 END) as valor_total,
        SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as canceladas
      FROM pdv_vendas 
      WHERE empresa_id = ? AND date(data_venda) = ?
    `).bind(empresa_id, dataConsulta).first();

    const porFormaPagamento = await c.env.DB.prepare(`
      SELECT p.forma_pagamento, SUM(p.valor) as total
      FROM pdv_vendas_pagamentos p
      JOIN pdv_vendas v ON v.id = p.venda_id
      WHERE v.empresa_id = ? AND date(v.data_venda) = ? AND v.status = 'finalizada'
      GROUP BY p.forma_pagamento
    `).bind(empresa_id, dataConsulta).all();

    const ticketMedio = await c.env.DB.prepare(`
      SELECT AVG(total) as ticket_medio
      FROM pdv_vendas 
      WHERE empresa_id = ? AND date(data_venda) = ? AND status = 'finalizada'
    `).bind(empresa_id, dataConsulta).first<{ ticket_medio: number }>();

    return c.json({
      success: true,
      data: {
        sessoes_abertas: sessoesAbertas?.total || 0,
        vendas_hoje: vendasHoje,
        por_forma_pagamento: porFormaPagamento.results,
        ticket_medio: ticketMedio?.ticket_medio || 0
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar dashboard:', error);
    return c.json({ success: false, error: 'Erro ao buscar dashboard' }, 500);
  }
});

export default pdv;
