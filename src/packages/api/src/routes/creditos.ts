// =============================================
// TRAILSYSTEM ERP - Rotas de Créditos do Cliente
// Gerenciamento de carteira de créditos (indicação, devolução, etc)
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const creditos = new Hono<{ Bindings: Env }>();

// =============================================
// GET /creditos - Listar créditos
// =============================================
creditos.get('/', async (c) => {
  const { cliente_id, status, empresa_id } = c.req.query();

  try {
    let query = `
      SELECT 
        cc.*,
        c.razao_social as cliente_nome
      FROM clientes_creditos cc
      JOIN clientes c ON c.id = cc.cliente_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (empresa_id) {
      query += ` AND cc.empresa_id = ?`;
      params.push(empresa_id);
    }

    if (cliente_id) {
      query += ` AND cc.cliente_id = ?`;
      params.push(cliente_id);
    }

    if (status) {
      query += ` AND cc.status = ?`;
      params.push(status);
    } else {
      query += ` AND cc.status = 'ativo'`;
    }

    query += ` ORDER BY cc.data_validade ASC, cc.created_at ASC`;

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: result.results
    });
  } catch (error: any) {
    console.error('Erro ao listar créditos:', error);
    return c.json({ success: false, error: 'Erro ao listar créditos' }, 500);
  }
});

// =============================================
// GET /creditos/cliente/:cliente_id - Saldo de crédito do cliente
// =============================================
creditos.get('/cliente/:cliente_id', async (c) => {
  const { cliente_id } = c.req.param();

  try {
    // Buscar créditos ativos
    const creditosAtivos = await c.env.DB.prepare(`
      SELECT * FROM clientes_creditos 
      WHERE cliente_id = ? AND status = 'ativo'
      ORDER BY data_validade ASC
    `).bind(cliente_id).all();

    // Calcular saldo total
    const saldoTotal = creditosAtivos.results.reduce((acc: number, c: any) => acc + c.valor_saldo, 0);

    // Buscar histórico de uso
    const historico = await c.env.DB.prepare(`
      SELECT 
        cu.*,
        pv.numero as pedido_numero,
        e.numero as entrega_numero
      FROM clientes_creditos_uso cu
      LEFT JOIN pedidos_venda pv ON pv.id = cu.pedido_venda_id
      LEFT JOIN pedidos_venda_entregas e ON e.id = cu.entrega_id
      JOIN clientes_creditos cc ON cc.id = cu.credito_id
      WHERE cc.cliente_id = ?
      ORDER BY cu.data_uso DESC
      LIMIT 20
    `).bind(cliente_id).all();

    return c.json({
      success: true,
      data: {
        saldo_total: saldoTotal,
        creditos: creditosAtivos.results,
        historico: historico.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar créditos do cliente:', error);
    return c.json({ success: false, error: 'Erro ao buscar créditos' }, 500);
  }
});

// =============================================
// POST /creditos - Criar novo crédito
// =============================================
creditos.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      empresa_id: string;
      cliente_id: string;
      origem: string;
      origem_id?: string;
      descricao?: string;
      valor: number;
      data_validade?: string;
    }>();

    if (!body.cliente_id || !body.valor || !body.origem) {
      return c.json({ success: false, error: 'Cliente, valor e origem são obrigatórios' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Validade padrão: 1 ano
    const validade = body.data_validade || (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    })();

    await c.env.DB.prepare(`
      INSERT INTO clientes_creditos (
        id, empresa_id, cliente_id, origem, origem_id, descricao,
        valor_original, valor_saldo, data_emissao, data_validade,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo', ?, ?)
    `).bind(
      id, body.empresa_id, body.cliente_id, body.origem,
      body.origem_id || null, body.descricao || null,
      body.valor, body.valor, now.split('T')[0], validade,
      now, now
    ).run();

    return c.json({
      success: true,
      data: { id },
      message: 'Crédito criado com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar crédito:', error);
    return c.json({ success: false, error: 'Erro ao criar crédito' }, 500);
  }
});

// =============================================
// POST /creditos/:id/usar - Usar crédito em venda/entrega
// =============================================
creditos.post('/:id/usar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      valor: number;
      pedido_venda_id?: string;
      entrega_id?: string;
      usuario_id?: string;
      observacao?: string;
    }>();

    if (!body.valor || body.valor <= 0) {
      return c.json({ success: false, error: 'Valor deve ser maior que zero' }, 400);
    }

    const credito = await c.env.DB.prepare(`
      SELECT * FROM clientes_creditos WHERE id = ? AND status = 'ativo'
    `).bind(id).first<any>();

    if (!credito) {
      return c.json({ success: false, error: 'Crédito não encontrado ou inativo' }, 404);
    }

    if (body.valor > credito.valor_saldo) {
      return c.json({ success: false, error: 'Valor excede o saldo disponível' }, 400);
    }

    // Verificar validade
    if (credito.data_validade && new Date(credito.data_validade) < new Date()) {
      await c.env.DB.prepare(`
        UPDATE clientes_creditos SET status = 'expirado', updated_at = datetime('now') WHERE id = ?
      `).bind(id).run();
      return c.json({ success: false, error: 'Crédito expirado' }, 400);
    }

    const novoSaldo = credito.valor_saldo - body.valor;
    const novoStatus = novoSaldo <= 0 ? 'usado' : 'ativo';
    const now = new Date().toISOString();

    // Atualizar crédito
    await c.env.DB.prepare(`
      UPDATE clientes_creditos 
      SET valor_usado = valor_usado + ?, 
          valor_saldo = ?,
          status = ?,
          pedido_venda_id = COALESCE(?, pedido_venda_id),
          entrega_id = COALESCE(?, entrega_id),
          updated_at = ?
      WHERE id = ?
    `).bind(
      body.valor, novoSaldo, novoStatus,
      body.pedido_venda_id || null, body.entrega_id || null,
      now, id
    ).run();

    // Registrar uso
    const usoId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO clientes_creditos_uso (
        id, credito_id, pedido_venda_id, entrega_id, valor, data_uso, usuario_id, observacao, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      usoId, id, body.pedido_venda_id || null, body.entrega_id || null,
      body.valor, now.split('T')[0], body.usuario_id || null,
      body.observacao || null, now
    ).run();

    return c.json({
      success: true,
      data: { saldo_restante: novoSaldo },
      message: 'Crédito utilizado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao usar crédito:', error);
    return c.json({ success: false, error: 'Erro ao usar crédito' }, 500);
  }
});

// =============================================
// POST /creditos/:id/cancelar - Cancelar crédito
// =============================================
creditos.post('/:id/cancelar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{ motivo?: string }>();

    const credito = await c.env.DB.prepare(`
      SELECT * FROM clientes_creditos WHERE id = ?
    `).bind(id).first<any>();

    if (!credito) {
      return c.json({ success: false, error: 'Crédito não encontrado' }, 404);
    }

    if (credito.status !== 'ativo') {
      return c.json({ success: false, error: 'Apenas créditos ativos podem ser cancelados' }, 400);
    }

    if (credito.valor_usado > 0) {
      return c.json({ success: false, error: 'Crédito já foi parcialmente utilizado' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE clientes_creditos 
      SET status = 'cancelado', 
          descricao = COALESCE(descricao, '') || ' | Cancelado: ' || ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(body.motivo || 'Não informado', id).run();

    return c.json({ success: true, message: 'Crédito cancelado' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao cancelar crédito' }, 500);
  }
});

// =============================================
// GET /creditos/expirados - Listar créditos próximos de expirar
// =============================================
creditos.get('/relatorio/expirados', async (c) => {
  const { empresa_id, dias = '30' } = c.req.query();

  try {
    let query = `
      SELECT 
        cc.*,
        c.razao_social as cliente_nome,
        c.email as cliente_email
      FROM clientes_creditos cc
      JOIN clientes c ON c.id = cc.cliente_id
      WHERE cc.status = 'ativo'
        AND cc.data_validade <= date('now', '+' || ? || ' days')
    `;
    const params: any[] = [dias];

    if (empresa_id) {
      query += ` AND cc.empresa_id = ?`;
      params.push(empresa_id);
    }

    query += ` ORDER BY cc.data_validade ASC`;

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: result.results
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao buscar créditos expirando' }, 500);
  }
});

export default creditos;
