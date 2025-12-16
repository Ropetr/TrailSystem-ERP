// =============================================
// PLANAC ERP - Rotas de Contas a Receber
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const contasReceber = new Hono<{ Bindings: Env }>();

// =============================================
// GET /contas-receber - Listar
// =============================================
contasReceber.get('/', async (c) => {
  const { 
    page = '1', limit = '20', 
    status, cliente_id, 
    data_vencimento_inicio, data_vencimento_fim,
    vencidas, empresa_id 
  } = c.req.query();

  try {
    let where = 'WHERE cr.deleted_at IS NULL';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND cr.empresa_id = ?';
      params.push(empresa_id);
    }

    if (status) {
      where += ' AND cr.status = ?';
      params.push(status);
    }

    if (cliente_id) {
      where += ' AND cr.cliente_id = ?';
      params.push(cliente_id);
    }

    if (data_vencimento_inicio) {
      where += ' AND cr.data_vencimento >= ?';
      params.push(data_vencimento_inicio);
    }

    if (data_vencimento_fim) {
      where += ' AND cr.data_vencimento <= ?';
      params.push(data_vencimento_fim);
    }

    if (vencidas === 'true') {
      where += " AND cr.data_vencimento < date('now') AND cr.status = 'aberto'";
    }

    // Contar total
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM contas_receber cr ${where}
    `).bind(...params).first<{ total: number }>();

    // Buscar dados
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await c.env.DB.prepare(`
      SELECT 
        cr.*,
        cl.razao_social as cliente_nome,
        cl.email as cliente_email,
        julianday(cr.data_vencimento) - julianday('now') as dias_vencimento
      FROM contas_receber cr
      LEFT JOIN clientes cl ON cl.id = cr.cliente_id
      ${where}
      ORDER BY cr.data_vencimento ASC
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
    console.error('Erro ao listar contas a receber:', error);
    return c.json({ success: false, error: 'Erro ao listar contas a receber' }, 500);
  }
});

// =============================================
// GET /contas-receber/resumo - Resumo financeiro
// =============================================
contasReceber.get('/resumo', async (c) => {
  const { empresa_id } = c.req.query();

  try {
    let where = "WHERE deleted_at IS NULL";
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND empresa_id = ?';
      params.push(empresa_id);
    }

    const resumo = await c.env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'aberto' THEN valor_aberto ELSE 0 END) as total_aberto,
        SUM(CASE WHEN status = 'aberto' AND data_vencimento < date('now') THEN valor_aberto ELSE 0 END) as total_vencido,
        SUM(CASE WHEN status = 'aberto' AND data_vencimento >= date('now') AND data_vencimento <= date('now', '+7 days') THEN valor_aberto ELSE 0 END) as vence_7_dias,
        SUM(CASE WHEN status = 'aberto' AND data_vencimento >= date('now') AND data_vencimento <= date('now', '+30 days') THEN valor_aberto ELSE 0 END) as vence_30_dias,
        SUM(CASE WHEN status = 'pago' AND data_pagamento >= date('now', 'start of month') THEN valor_pago ELSE 0 END) as recebido_mes_atual,
        COUNT(CASE WHEN status = 'aberto' THEN 1 END) as qtd_aberto,
        COUNT(CASE WHEN status = 'aberto' AND data_vencimento < date('now') THEN 1 END) as qtd_vencido
      FROM contas_receber ${where}
    `).bind(...params).first();

    return c.json({ success: true, data: resumo });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao buscar resumo' }, 500);
  }
});

// =============================================
// GET /contas-receber/inadimplentes - Clientes inadimplentes
// =============================================
contasReceber.get('/inadimplentes', async (c) => {
  const { empresa_id, dias_atraso = '30' } = c.req.query();

  try {
    let where = "WHERE cr.deleted_at IS NULL AND cr.status = 'aberto' AND cr.data_vencimento < date('now')";
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND cr.empresa_id = ?';
      params.push(empresa_id);
    }

    const result = await c.env.DB.prepare(`
      SELECT 
        cl.id, cl.razao_social, cl.cpf_cnpj, cl.telefone, cl.email,
        COUNT(*) as titulos_vencidos,
        SUM(cr.valor_aberto) as valor_total_vencido,
        MIN(cr.data_vencimento) as vencimento_mais_antigo,
        MAX(julianday('now') - julianday(cr.data_vencimento)) as dias_maior_atraso
      FROM contas_receber cr
      INNER JOIN clientes cl ON cl.id = cr.cliente_id
      ${where}
      GROUP BY cr.cliente_id
      HAVING dias_maior_atraso >= ?
      ORDER BY valor_total_vencido DESC
    `).bind(...params, parseInt(dias_atraso)).all();

    return c.json({ success: true, data: result.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao buscar inadimplentes' }, 500);
  }
});

// =============================================
// GET /contas-receber/:id - Buscar por ID
// =============================================
contasReceber.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const conta = await c.env.DB.prepare(`
      SELECT cr.*, cl.razao_social as cliente_nome, cl.cpf_cnpj as cliente_documento, cl.email as cliente_email
      FROM contas_receber cr
      LEFT JOIN clientes cl ON cl.id = cr.cliente_id
      WHERE cr.id = ? AND cr.deleted_at IS NULL
    `).bind(id).first();

    if (!conta) {
      return c.json({ success: false, error: 'Conta não encontrada' }, 404);
    }

    // Buscar baixas
    const baixas = await c.env.DB.prepare(`
      SELECT * FROM contas_receber_baixas WHERE conta_receber_id = ? ORDER BY data_baixa DESC
    `).bind(id).all();

    return c.json({
      success: true,
      data: { ...conta, baixas: baixas.results }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao buscar conta' }, 500);
  }
});

// =============================================
// POST /contas-receber - Criar
// =============================================
contasReceber.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      cliente_id: string;
      numero_documento?: string;
      valor_original: number;
      data_emissao: string;
      data_vencimento: string;
      forma_pagamento_id?: string;
      observacao?: string;
      empresa_id?: string;
      filial_id?: string;
      parcelas?: number;
    }>();

    if (!body.cliente_id || !body.valor_original || !body.data_vencimento) {
      return c.json({ success: false, error: 'Cliente, valor e vencimento são obrigatórios' }, 400);
    }

    const empresaId = body.empresa_id || 'empresa_planac_001';
    const now = new Date().toISOString();
    const parcelas = body.parcelas || 1;
    const valorParcela = body.valor_original / parcelas;

    const ids: string[] = [];

    for (let i = 1; i <= parcelas; i++) {
      const id = crypto.randomUUID();
      ids.push(id);

      // Calcular vencimento da parcela
      const vencimentoBase = new Date(body.data_vencimento);
      vencimentoBase.setMonth(vencimentoBase.getMonth() + (i - 1));
      const dataVenc = vencimentoBase.toISOString().split('T')[0];

      await c.env.DB.prepare(`
        INSERT INTO contas_receber (
          id, empresa_id, filial_id, cliente_id, origem, numero_documento,
          numero_parcela, parcela_atual, parcelas_total,
          valor_original, valor_aberto, data_emissao, data_vencimento,
          forma_pagamento_id, status, observacao, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aberto', ?, ?, ?)
      `).bind(
        id, empresaId, body.filial_id || null, body.cliente_id,
        body.numero_documento || null,
        `${i}/${parcelas}`, i, parcelas,
        valorParcela, valorParcela,
        body.data_emissao || now.split('T')[0], dataVenc,
        body.forma_pagamento_id || null,
        body.observacao || null, now, now
      ).run();
    }

    return c.json({
      success: true,
      data: { ids, parcelas },
      message: `${parcelas} parcela(s) criada(s) com sucesso`
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar conta a receber:', error);
    return c.json({ success: false, error: 'Erro ao criar conta a receber' }, 500);
  }
});

// =============================================
// PUT /contas-receber/:id - Editar
// =============================================
contasReceber.put('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      data_vencimento?: string;
      observacao?: string;
    }>();

    const conta = await c.env.DB.prepare(`
      SELECT status FROM contas_receber WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<{ status: string }>();

    if (!conta) {
      return c.json({ success: false, error: 'Conta não encontrada' }, 404);
    }

    if (conta.status === 'pago') {
      return c.json({ success: false, error: 'Conta já paga não pode ser editada' }, 400);
    }

    const updates: string[] = ['updated_at = datetime("now")'];
    const params: any[] = [];

    if (body.data_vencimento) { updates.push('data_vencimento = ?'); params.push(body.data_vencimento); }
    if (body.observacao !== undefined) { updates.push('observacao = ?'); params.push(body.observacao); }

    params.push(id);

    await c.env.DB.prepare(`
      UPDATE contas_receber SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return c.json({ success: true, message: 'Conta atualizada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao editar conta' }, 500);
  }
});

// =============================================
// POST /contas-receber/:id/baixar - Baixar (receber)
// =============================================
contasReceber.post('/:id/baixar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      valor_pago: number;
      data_pagamento?: string;
      forma_pagamento_id?: string;
      conta_bancaria_id?: string;
      valor_juros?: number;
      valor_multa?: number;
      valor_desconto?: number;
      observacao?: string;
    }>();

    const conta = await c.env.DB.prepare(`
      SELECT * FROM contas_receber WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!conta) {
      return c.json({ success: false, error: 'Conta não encontrada' }, 404);
    }

    if (conta.status === 'pago') {
      return c.json({ success: false, error: 'Conta já está paga' }, 400);
    }

    const valorPago = body.valor_pago;
    const dataPagamento = body.data_pagamento || new Date().toISOString().split('T')[0];
    const novoValorPago = (conta.valor_pago || 0) + valorPago;
    const novoValorAberto = conta.valor_original + (body.valor_juros || 0) + (body.valor_multa || 0) - (body.valor_desconto || 0) - novoValorPago;
    const novoStatus = novoValorAberto <= 0.01 ? 'pago' : 'parcial';

    // Registrar baixa
    await c.env.DB.prepare(`
      INSERT INTO contas_receber_baixas (
        id, conta_receber_id, valor_pago, valor_juros, valor_multa, valor_desconto,
        data_baixa, forma_pagamento_id, conta_bancaria_id, observacao, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      crypto.randomUUID(), id, valorPago,
      body.valor_juros || 0, body.valor_multa || 0, body.valor_desconto || 0,
      dataPagamento, body.forma_pagamento_id || null, body.conta_bancaria_id || null,
      body.observacao || null
    ).run();

    // Atualizar conta
    await c.env.DB.prepare(`
      UPDATE contas_receber SET 
        valor_pago = ?, valor_aberto = ?, valor_juros = valor_juros + ?,
        valor_multa = valor_multa + ?, valor_desconto = valor_desconto + ?,
        data_pagamento = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      novoValorPago, Math.max(0, novoValorAberto),
      body.valor_juros || 0, body.valor_multa || 0, body.valor_desconto || 0,
      dataPagamento, novoStatus, id
    ).run();

    return c.json({
      success: true,
      message: novoStatus === 'pago' ? 'Conta recebida integralmente' : 'Baixa parcial registrada',
      data: { status: novoStatus, valor_aberto: Math.max(0, novoValorAberto) }
    });
  } catch (error: any) {
    console.error('Erro ao baixar conta:', error);
    return c.json({ success: false, error: 'Erro ao baixar conta' }, 500);
  }
});

// =============================================
// POST /contas-receber/:id/estornar - Estornar baixa
// =============================================
contasReceber.post('/:id/estornar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{ baixa_id: string; motivo?: string }>();

    const baixa = await c.env.DB.prepare(`
      SELECT * FROM contas_receber_baixas WHERE id = ? AND conta_receber_id = ?
    `).bind(body.baixa_id, id).first<any>();

    if (!baixa) {
      return c.json({ success: false, error: 'Baixa não encontrada' }, 404);
    }

    // Remover baixa
    await c.env.DB.prepare(`
      DELETE FROM contas_receber_baixas WHERE id = ?
    `).bind(body.baixa_id).run();

    // Recalcular valores
    const conta = await c.env.DB.prepare(`
      SELECT valor_original, valor_pago, valor_juros, valor_multa, valor_desconto
      FROM contas_receber WHERE id = ?
    `).bind(id).first<any>();

    const novoValorPago = (conta.valor_pago || 0) - baixa.valor_pago;
    const novoValorAberto = conta.valor_original + (conta.valor_juros - baixa.valor_juros) + (conta.valor_multa - baixa.valor_multa) - (conta.valor_desconto - baixa.valor_desconto) - novoValorPago;
    const novoStatus = novoValorPago <= 0 ? 'aberto' : 'parcial';

    await c.env.DB.prepare(`
      UPDATE contas_receber SET 
        valor_pago = ?, valor_aberto = ?,
        valor_juros = valor_juros - ?, valor_multa = valor_multa - ?, valor_desconto = valor_desconto - ?,
        status = ?, data_pagamento = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      novoValorPago, novoValorAberto,
      baixa.valor_juros, baixa.valor_multa, baixa.valor_desconto,
      novoStatus, id
    ).run();

    return c.json({ success: true, message: 'Baixa estornada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao estornar' }, 500);
  }
});

// =============================================
// DELETE /contas-receber/:id - Excluir (soft delete)
// =============================================
contasReceber.delete('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const conta = await c.env.DB.prepare(`
      SELECT status FROM contas_receber WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<{ status: string }>();

    if (!conta) {
      return c.json({ success: false, error: 'Conta não encontrada' }, 404);
    }

    if (conta.status === 'pago') {
      return c.json({ success: false, error: 'Conta paga não pode ser excluída' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE contas_receber SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Conta excluída' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao excluir' }, 500);
  }
});

export default contasReceber;
