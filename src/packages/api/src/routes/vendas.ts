// =============================================
// PLANAC ERP - Rotas de Vendas (Pedidos de Venda)
// Tabela: pedidos_venda
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const vendas = new Hono<{ Bindings: Env }>();

// =============================================
// GET /vendas - Listar
// =============================================
vendas.get('/', async (c) => {
  const { page = '1', limit = '20', busca, status, cliente_id, vendedor_id, data_inicio, data_fim, empresa_id } = c.req.query();

  try {
    let query = `
      SELECT pv.*, c.razao_social as cliente_razao_social
      FROM pedidos_venda pv
      LEFT JOIN clientes c ON c.id = pv.cliente_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (empresa_id) {
      query += ` AND pv.empresa_id = ?`;
      params.push(empresa_id);
    }

    if (busca) {
      query += ` AND (CAST(pv.numero AS TEXT) LIKE ? OR pv.cliente_nome LIKE ?)`;
      params.push(`%${busca}%`, `%${busca}%`);
    }

    if (status) {
      query += ` AND pv.status = ?`;
      params.push(status);
    }

    if (cliente_id) {
      query += ` AND pv.cliente_id = ?`;
      params.push(cliente_id);
    }

    if (vendedor_id) {
      query += ` AND pv.vendedor_id = ?`;
      params.push(vendedor_id);
    }

    if (data_inicio) {
      query += ` AND pv.data_emissao >= ?`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND pv.data_emissao <= ?`;
      params.push(data_fim);
    }

    const countQuery = query.replace('SELECT pv.*, c.razao_social as cliente_razao_social', 'SELECT COUNT(*) as total');
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    query += ` ORDER BY pv.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limitNum, (pageNum - 1) * limitNum);

    const result = await c.env.DB.prepare(query).bind(...params).all();

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

// =============================================
// GET /vendas/:id - Buscar
// =============================================
vendas.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const venda = await c.env.DB.prepare(`
      SELECT pv.*, c.razao_social as cliente_razao_social, c.email as cliente_email,
             c.limite_credito as cliente_limite_credito
      FROM pedidos_venda pv
      LEFT JOIN clientes c ON c.id = pv.cliente_id
      WHERE pv.id = ?
    `).bind(id).first();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada' }, 404);
    }

    const itens = await c.env.DB.prepare(`
      SELECT pvi.*, p.nome as produto_nome, p.codigo as produto_codigo
      FROM pedidos_venda_itens pvi
      LEFT JOIN produtos p ON p.id = pvi.produto_id
      WHERE pvi.pedido_id = ?
      ORDER BY pvi.sequencia
    `).bind(id).all();

    const parcelas = await c.env.DB.prepare(`
      SELECT * FROM pedidos_venda_parcelas WHERE pedido_id = ? ORDER BY numero
    `).bind(id).all();

    // Buscar entregas fracionadas
    const entregas = await c.env.DB.prepare(`
      SELECT * FROM pedidos_venda_entregas WHERE pedido_venda_id = ? ORDER BY numero
    `).bind(id).all();

    // Buscar créditos usados
    const creditosUsados = await c.env.DB.prepare(`
      SELECT cu.*, cc.origem, cc.descricao as credito_descricao
      FROM clientes_creditos_uso cu
      JOIN clientes_creditos cc ON cc.id = cu.credito_id
      WHERE cu.pedido_venda_id = ?
    `).bind(id).all();

    // Buscar saldo de crédito disponível do cliente
    const vendaData = venda as any;
    const saldoCredito = await c.env.DB.prepare(`
      SELECT SUM(valor_saldo) as saldo_disponivel
      FROM clientes_creditos
      WHERE cliente_id = ? AND status = 'ativo'
    `).bind(vendaData.cliente_id).first<{ saldo_disponivel: number }>();

    return c.json({
      success: true,
      data: { 
        ...venda, 
        itens: itens.results, 
        parcelas: parcelas.results,
        entregas: entregas.results,
        creditos_usados: creditosUsados.results,
        cliente_saldo_credito: saldoCredito?.saldo_disponivel || 0
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar venda:', error);
    return c.json({ success: false, error: 'Erro ao buscar venda' }, 500);
  }
});

// =============================================
// POST /vendas - Criar
// =============================================
vendas.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      cliente_id: string;
      cliente_nome: string;
      vendedor_id?: string;
      vendedor_nome?: string;
      observacao_interna?: string;
      observacao_nf?: string;
      empresa_id?: string;
      filial_id?: string;
      itens: Array<{
        produto_id: string;
        quantidade: number;
        valor_unitario: number;
        desconto_percentual?: number;
        desconto_valor?: number;
      }>;
    }>();

    if (!body.cliente_id) {
      return c.json({ success: false, error: 'Cliente obrigatorio' }, 400);
    }

    if (!body.itens || body.itens.length === 0) {
      return c.json({ success: false, error: 'Adicione ao menos um item' }, 400);
    }

    const empresaId = body.empresa_id || 'empresa_planac_001';
    const filialId = body.filial_id || 'filial_matriz_001';

    // Gerar numero sequencial
    const ultimoNumero = await c.env.DB.prepare(`
      SELECT MAX(numero) as max_numero FROM pedidos_venda WHERE empresa_id = ?
    `).bind(empresaId).first<{ max_numero: number }>();
    const novoNumero = (ultimoNumero?.max_numero || 0) + 1;

    // Calcular totais
    let subtotal = 0;
    let totalDesconto = 0;

    for (const item of body.itens) {
      const valorBruto = item.quantidade * item.valor_unitario;
      const desconto = item.desconto_valor || (valorBruto * (item.desconto_percentual || 0) / 100);
      subtotal += valorBruto;
      totalDesconto += desconto;
    }

    const valorTotal = subtotal - totalDesconto;

    // Criar venda
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO pedidos_venda (
        id, empresa_id, filial_id, numero, cliente_id, cliente_nome,
        vendedor_id, vendedor_nome, status, data_emissao,
        subtotal, desconto_valor, valor_total,
        observacao_interna, observacao_nf, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, empresaId, filialId, novoNumero, body.cliente_id, body.cliente_nome,
      body.vendedor_id || null, body.vendedor_nome || null, now.split('T')[0],
      subtotal, totalDesconto, valorTotal,
      body.observacao_interna || null, body.observacao_nf || null, now, now
    ).run();

    // Criar itens usando batch para melhor performance
    // Ao inves de N queries sequenciais, executa todas em uma unica operacao
    const itemStatements = body.itens.map((item, index) => {
      const valorBruto = item.quantidade * item.valor_unitario;
      const descontoValor = item.desconto_valor || (valorBruto * (item.desconto_percentual || 0) / 100);
      const valorLiquido = valorBruto - descontoValor;

      return c.env.DB.prepare(`
        INSERT INTO pedidos_venda_itens (
          id, pedido_venda_id, item, produto_id, quantidade, valor_unitario,
          desconto_percentual, desconto_valor, valor_total, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, index + 1, item.produto_id,
        item.quantidade, item.valor_unitario,
        item.desconto_percentual || 0, descontoValor, valorLiquido, now
      );
    });

    if (itemStatements.length > 0) {
      await c.env.DB.batch(itemStatements);
    }

    return c.json({
      success: true,
      data: { id, numero: novoNumero },
      message: 'Venda criada com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar venda:', error);
    return c.json({ success: false, error: 'Erro ao criar venda' }, 500);
  }
});

// =============================================
// PUT /vendas/:id - Editar
// =============================================
vendas.put('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      vendedor_id?: string;
      vendedor_nome?: string;
      observacao_interna?: string;
      observacao_nf?: string;
    }>();

    const venda = await c.env.DB.prepare(`
      SELECT * FROM pedidos_venda WHERE id = ?
    `).bind(id).first<any>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada' }, 404);
    }

    if (venda.status !== 'pendente') {
      return c.json({ success: false, error: 'Apenas vendas pendentes podem ser editadas' }, 400);
    }

    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [new Date().toISOString()];

    if (body.vendedor_id !== undefined) { updates.push('vendedor_id = ?'); params.push(body.vendedor_id); }
    if (body.vendedor_nome !== undefined) { updates.push('vendedor_nome = ?'); params.push(body.vendedor_nome); }
    if (body.observacao_interna !== undefined) { updates.push('observacao_interna = ?'); params.push(body.observacao_interna); }
    if (body.observacao_nf !== undefined) { updates.push('observacao_nf = ?'); params.push(body.observacao_nf); }

    params.push(id);

    await c.env.DB.prepare(`
      UPDATE pedidos_venda SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return c.json({ success: true, message: 'Venda atualizada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao editar venda' }, 500);
  }
});

// =============================================
// POST /vendas/:id/aprovar - Aprovar venda
// =============================================
vendas.post('/:id/aprovar', async (c) => {
  const { id } = c.req.param();

  try {
    const venda = await c.env.DB.prepare(`
      SELECT status FROM pedidos_venda WHERE id = ?
    `).bind(id).first<{ status: string }>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada' }, 404);
    }

    if (venda.status !== 'pendente') {
      return c.json({ success: false, error: 'Venda ja foi processada' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE pedidos_venda SET status = 'aprovada', data_aprovacao = datetime('now'), updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Venda aprovada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao aprovar venda' }, 500);
  }
});

// =============================================
// POST /vendas/:id/faturar - Faturar venda
// =============================================
vendas.post('/:id/faturar', async (c) => {
  const { id } = c.req.param();

  try {
    const venda = await c.env.DB.prepare(`
      SELECT * FROM pedidos_venda WHERE id = ?
    `).bind(id).first<any>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada' }, 404);
    }

    if (venda.status !== 'aprovada' && venda.status !== 'pendente') {
      return c.json({ success: false, error: 'Venda nao pode ser faturada' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE pedidos_venda SET status = 'faturada', data_faturamento = datetime('now'), updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Venda faturada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao faturar venda:', error);
    return c.json({ success: false, error: 'Erro ao faturar venda' }, 500);
  }
});

// =============================================
// POST /vendas/:id/cancelar - Cancelar venda
// =============================================
vendas.post('/:id/cancelar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{ motivo?: string }>();

    const venda = await c.env.DB.prepare(`
      SELECT status FROM pedidos_venda WHERE id = ?
    `).bind(id).first<{ status: string }>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda nao encontrada' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE pedidos_venda SET status = 'cancelada', observacao_interna = COALESCE(observacao_interna, '') || ' | Cancelado: ' || ?, updated_at = datetime('now') WHERE id = ?
    `).bind(body.motivo || 'Nao informado', id).run();

    return c.json({ success: true, message: 'Venda cancelada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao cancelar venda' }, 500);
  }
});

// =============================================
// GET /vendas/dashboard - Dashboard de vendas
// =============================================
vendas.get('/relatorio/dashboard', async (c) => {
  const { empresa_id, periodo = '30' } = c.req.query();

  try {
    const dias = parseInt(periodo);
    
    let where = `WHERE data_emissao >= date('now', '-${dias} days')`;
    const params: any[] = [];

    if (empresa_id) {
      where += ` AND empresa_id = ?`;
      params.push(empresa_id);
    }

    // Total de vendas
    const totais = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as quantidade,
        SUM(valor_total) as valor_total,
        SUM(CASE WHEN status = 'faturada' THEN valor_total ELSE 0 END) as valor_faturado,
        SUM(CASE WHEN status = 'pendente' THEN valor_total ELSE 0 END) as valor_pendente
      FROM pedidos_venda ${where}
    `).bind(...params).first();

    // Vendas por status
    const porStatus = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as quantidade, SUM(valor_total) as valor
      FROM pedidos_venda ${where}
      GROUP BY status
    `).bind(...params).all();

    // Top vendedores
    const topVendedores = await c.env.DB.prepare(`
      SELECT vendedor_nome as nome, COUNT(*) as quantidade, SUM(valor_total) as valor
      FROM pedidos_venda 
      ${where} AND vendedor_nome IS NOT NULL
      GROUP BY vendedor_id
      ORDER BY valor DESC
      LIMIT 5
    `).bind(...params).all();

    return c.json({
      success: true,
      data: {
        totais,
        por_status: porStatus.results,
        top_vendedores: topVendedores.results
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao gerar dashboard' }, 500);
  }
});

// =============================================
// POST /vendas/:id/usar-credito - Usar crédito na venda
// =============================================
vendas.post('/:id/usar-credito', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      credito_id: string;
      valor: number;
      usuario_id?: string;
    }>();

    if (!body.credito_id || !body.valor) {
      return c.json({ success: false, error: 'Crédito e valor são obrigatórios' }, 400);
    }

    const venda = await c.env.DB.prepare(`
      SELECT * FROM pedidos_venda WHERE id = ?
    `).bind(id).first<any>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda não encontrada' }, 404);
    }

    if (venda.status !== 'pendente' && venda.status !== 'aprovada') {
      return c.json({ success: false, error: 'Venda não pode mais receber créditos' }, 400);
    }

    // Verificar crédito
    const credito = await c.env.DB.prepare(`
      SELECT * FROM clientes_creditos WHERE id = ? AND status = 'ativo'
    `).bind(body.credito_id).first<any>();

    if (!credito) {
      return c.json({ success: false, error: 'Crédito não encontrado ou inativo' }, 404);
    }

    if (credito.cliente_id !== venda.cliente_id) {
      return c.json({ success: false, error: 'Crédito não pertence ao cliente da venda' }, 400);
    }

    if (body.valor > credito.valor_saldo) {
      return c.json({ success: false, error: 'Valor excede o saldo do crédito' }, 400);
    }

    const now = new Date().toISOString();
    const novoSaldo = credito.valor_saldo - body.valor;
    const novoStatus = novoSaldo <= 0 ? 'usado' : 'ativo';

    // Atualizar crédito
    await c.env.DB.prepare(`
      UPDATE clientes_creditos 
      SET valor_usado = valor_usado + ?, 
          valor_saldo = ?,
          status = ?,
          pedido_venda_id = ?,
          updated_at = ?
      WHERE id = ?
    `).bind(body.valor, novoSaldo, novoStatus, id, now, body.credito_id).run();

    // Registrar uso
    const usoId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO clientes_creditos_uso (
        id, credito_id, pedido_venda_id, valor, data_uso, usuario_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(usoId, body.credito_id, id, body.valor, now.split('T')[0], body.usuario_id || null, now).run();

    return c.json({
      success: true,
      message: 'Crédito aplicado com sucesso',
      data: { valor_aplicado: body.valor, saldo_restante: novoSaldo }
    });
  } catch (error: any) {
    console.error('Erro ao usar crédito:', error);
    return c.json({ success: false, error: 'Erro ao usar crédito' }, 500);
  }
});

// =============================================
// POST /vendas/:id/reservar-estoque - Reservar estoque para a venda
// =============================================
vendas.post('/:id/reservar-estoque', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{ usuario_id?: string }>();

    const venda = await c.env.DB.prepare(`
      SELECT * FROM pedidos_venda WHERE id = ?
    `).bind(id).first<any>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda não encontrada' }, 404);
    }

    // Buscar itens da venda
    const itens = await c.env.DB.prepare(`
      SELECT * FROM pedidos_venda_itens WHERE pedido_id = ?
    `).bind(id).all();

    if (!itens.results || itens.results.length === 0) {
      return c.json({ success: false, error: 'Venda sem itens' }, 400);
    }

    const now = new Date().toISOString();
    const validade = new Date();
    validade.setDate(validade.getDate() + 7); // Reserva válida por 7 dias

    const reservaStatements = (itens.results as any[]).map(item => {
      return c.env.DB.prepare(`
        INSERT INTO estoque_reservas (
          id, empresa_id, filial_id, produto_id, pedido_venda_id, item_id,
          quantidade_reservada, quantidade_saldo, status, data_reserva, data_validade,
          usuario_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ativo', ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), venda.empresa_id, venda.filial_id, item.produto_id,
        id, item.id, item.quantidade, item.quantidade, now.split('T')[0],
        validade.toISOString().split('T')[0], body.usuario_id || null, now, now
      );
    });

    await c.env.DB.batch(reservaStatements);

    return c.json({
      success: true,
      message: 'Estoque reservado com sucesso',
      data: { itens_reservados: itens.results.length }
    });
  } catch (error: any) {
    console.error('Erro ao reservar estoque:', error);
    return c.json({ success: false, error: 'Erro ao reservar estoque' }, 500);
  }
});

// =============================================
// POST /vendas/:id/criar-entregas - Criar entregas fracionadas
// =============================================
vendas.post('/:id/criar-entregas', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      entregas: Array<{
        data_prevista: string;
        forma_financeiro?: string;
        itens: Array<{
          item_id: string;
          quantidade: number;
        }>;
        observacao?: string;
      }>;
    }>();

    if (!body.entregas || body.entregas.length === 0) {
      return c.json({ success: false, error: 'Informe pelo menos uma entrega' }, 400);
    }

    const venda = await c.env.DB.prepare(`
      SELECT * FROM pedidos_venda WHERE id = ?
    `).bind(id).first<any>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda não encontrada' }, 404);
    }

    // Contar entregas existentes
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM pedidos_venda_entregas WHERE pedido_venda_id = ?
    `).bind(id).first<{ total: number }>();

    let numeroBase = (countResult?.total || 0) + 1;
    const now = new Date().toISOString();
    const entregasCriadas: Array<{ id: string; numero: string }> = [];

    for (const entrega of body.entregas) {
      const entregaId = crypto.randomUUID();
      const numeroEntrega = `.E${numeroBase}`;

      // Calcular valor da entrega
      let valorProdutos = 0;
      for (const item of entrega.itens) {
        const itemPedido = await c.env.DB.prepare(`
          SELECT preco_unitario FROM pedidos_venda_itens WHERE id = ?
        `).bind(item.item_id).first<{ preco_unitario: number }>();
        
        if (itemPedido) {
          valorProdutos += item.quantidade * itemPedido.preco_unitario;
        }
      }

      // Criar entrega
      await c.env.DB.prepare(`
        INSERT INTO pedidos_venda_entregas (
          id, pedido_venda_id, numero, status, data_prevista,
          valor_produtos, valor_total, forma_financeiro, observacao,
          created_at, updated_at
        ) VALUES (?, ?, ?, 'pendente', ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        entregaId, id, numeroEntrega, entrega.data_prevista,
        valorProdutos, valorProdutos, entrega.forma_financeiro || 'proporcional',
        entrega.observacao || null, now, now
      ).run();

      // Criar itens da entrega
      const itemStatements = entrega.itens.map(item => {
        return c.env.DB.prepare(`
          INSERT INTO pedidos_venda_entregas_itens (
            id, entrega_id, item_id, quantidade, created_at
          ) VALUES (?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), entregaId, item.item_id, item.quantidade, now);
      });

      if (itemStatements.length > 0) {
        await c.env.DB.batch(itemStatements);
      }

      entregasCriadas.push({ id: entregaId, numero: numeroEntrega });
      numeroBase++;
    }

    return c.json({
      success: true,
      message: `${entregasCriadas.length} entrega(s) criada(s) com sucesso`,
      data: { entregas: entregasCriadas }
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar entregas:', error);
    return c.json({ success: false, error: 'Erro ao criar entregas' }, 500);
  }
});

// =============================================
// GET /vendas/:id/entregas - Listar entregas da venda
// =============================================
vendas.get('/:id/entregas', async (c) => {
  const { id } = c.req.param();

  try {
    const entregas = await c.env.DB.prepare(`
      SELECT e.*,
        (SELECT COUNT(*) FROM pedidos_venda_entregas_itens WHERE entrega_id = e.id) as qtd_itens
      FROM pedidos_venda_entregas e
      WHERE e.pedido_venda_id = ?
      ORDER BY e.numero
    `).bind(id).all();

    return c.json({
      success: true,
      data: entregas.results
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao listar entregas' }, 500);
  }
});

// =============================================
// POST /vendas/:id/separar - Iniciar separação da venda (entrega única)
// =============================================
vendas.post('/:id/separar', async (c) => {
  const { id } = c.req.param();

  try {
    const venda = await c.env.DB.prepare(`
      SELECT status FROM pedidos_venda WHERE id = ?
    `).bind(id).first<{ status: string }>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda não encontrada' }, 404);
    }

    if (venda.status !== 'aprovada' && venda.status !== 'pendente') {
      return c.json({ success: false, error: 'Venda não pode ser separada' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE pedidos_venda 
      SET status = 'separando', data_separacao = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Separação iniciada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao iniciar separação' }, 500);
  }
});

// =============================================
// POST /vendas/:id/confirmar-separacao - Confirmar separação
// =============================================
vendas.post('/:id/confirmar-separacao', async (c) => {
  const { id } = c.req.param();

  try {
    const venda = await c.env.DB.prepare(`
      SELECT status FROM pedidos_venda WHERE id = ?
    `).bind(id).first<{ status: string }>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda não encontrada' }, 404);
    }

    if (venda.status !== 'separando') {
      return c.json({ success: false, error: 'Venda não está em separação' }, 400);
    }

    // Atualizar quantidades separadas nos itens
    await c.env.DB.prepare(`
      UPDATE pedidos_venda_itens 
      SET quantidade_separada = quantidade
      WHERE pedido_id = ?
    `).bind(id).run();

    await c.env.DB.prepare(`
      UPDATE pedidos_venda 
      SET status = 'separado', updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Separação confirmada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao confirmar separação' }, 500);
  }
});

// =============================================
// POST /vendas/:id/confirmar-entrega - Confirmar entrega realizada
// =============================================
vendas.post('/:id/confirmar-entrega', async (c) => {
  const { id } = c.req.param();

  try {
    const venda = await c.env.DB.prepare(`
      SELECT status FROM pedidos_venda WHERE id = ?
    `).bind(id).first<{ status: string }>();

    if (!venda) {
      return c.json({ success: false, error: 'Venda não encontrada' }, 404);
    }

    if (venda.status !== 'faturada' && venda.status !== 'em_entrega') {
      return c.json({ success: false, error: 'Venda não está em entrega' }, 400);
    }

    // Atualizar quantidades entregues
    await c.env.DB.prepare(`
      UPDATE pedidos_venda_itens 
      SET quantidade_entregue = quantidade_separada
      WHERE pedido_id = ?
    `).bind(id).run();

    // Baixar reservas de estoque
    await c.env.DB.prepare(`
      UPDATE estoque_reservas 
      SET status = 'baixado', quantidade_baixada = quantidade_reservada, quantidade_saldo = 0, data_baixa = datetime('now'), updated_at = datetime('now')
      WHERE pedido_venda_id = ? AND status = 'ativo'
    `).bind(id).run();

    await c.env.DB.prepare(`
      UPDATE pedidos_venda 
      SET status = 'entregue', data_entrega_realizada = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Entrega confirmada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao confirmar entrega' }, 500);
  }
});

export default vendas;
