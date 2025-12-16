// =============================================
// PLANAC ERP - Rotas de Contas a Pagar
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const contasPagar = new Hono<{ Bindings: Env }>();

// =============================================
// GET /contas-pagar - Listar
// =============================================
contasPagar.get('/', async (c) => {
  const { 
    page = '1', limit = '20', 
    status, fornecedor_id, 
    data_vencimento_inicio, data_vencimento_fim,
    vencidas, empresa_id 
  } = c.req.query();

  try {
    let where = 'WHERE cp.deleted_at IS NULL';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND cp.empresa_id = ?';
      params.push(empresa_id);
    }

    if (status) {
      where += ' AND cp.status = ?';
      params.push(status);
    }

    if (fornecedor_id) {
      where += ' AND cp.fornecedor_id = ?';
      params.push(fornecedor_id);
    }

    if (data_vencimento_inicio) {
      where += ' AND cp.data_vencimento >= ?';
      params.push(data_vencimento_inicio);
    }

    if (data_vencimento_fim) {
      where += ' AND cp.data_vencimento <= ?';
      params.push(data_vencimento_fim);
    }

    if (vencidas === 'true') {
      where += " AND cp.data_vencimento < date('now') AND cp.status = 'aberto'";
    }

    // Contar total
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM contas_pagar cp ${where}
    `).bind(...params).first<{ total: number }>();

    // Buscar dados
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await c.env.DB.prepare(`
      SELECT 
        cp.*,
        f.razao_social as fornecedor_nome,
        julianday(cp.data_vencimento) - julianday('now') as dias_vencimento
      FROM contas_pagar cp
      LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
      ${where}
      ORDER BY cp.data_vencimento ASC
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
    console.error('Erro ao listar contas a pagar:', error);
    return c.json({ success: false, error: 'Erro ao listar contas a pagar' }, 500);
  }
});

// =============================================
// GET /contas-pagar/resumo - Resumo financeiro
// =============================================
contasPagar.get('/resumo', async (c) => {
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
        SUM(CASE WHEN status = 'pago' AND data_pagamento >= date('now', 'start of month') THEN valor_pago ELSE 0 END) as pago_mes_atual,
        COUNT(CASE WHEN status = 'aberto' THEN 1 END) as qtd_aberto,
        COUNT(CASE WHEN status = 'aberto' AND data_vencimento < date('now') THEN 1 END) as qtd_vencido
      FROM contas_pagar ${where}
    `).bind(...params).first();

    return c.json({ success: true, data: resumo });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao buscar resumo' }, 500);
  }
});

// =============================================
// GET /contas-pagar/:id - Buscar por ID
// =============================================
contasPagar.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const conta = await c.env.DB.prepare(`
      SELECT cp.*, f.razao_social as fornecedor_nome, f.cpf_cnpj as fornecedor_documento
      FROM contas_pagar cp
      LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
      WHERE cp.id = ? AND cp.deleted_at IS NULL
    `).bind(id).first();

    if (!conta) {
      return c.json({ success: false, error: 'Conta não encontrada' }, 404);
    }

    // Buscar baixas
    const baixas = await c.env.DB.prepare(`
      SELECT * FROM contas_pagar_baixas WHERE conta_pagar_id = ? ORDER BY data_baixa DESC
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
// POST /contas-pagar - Criar
// =============================================
contasPagar.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      fornecedor_id: string;
      numero_documento?: string;
      valor_original: number;
      data_emissao: string;
      data_vencimento: string;
      categoria?: string;
      centro_custo?: string;
      forma_pagamento_id?: string;
      codigo_barras?: string;
      linha_digitavel?: string;
      pix_copia_cola?: string;
      observacao?: string;
      empresa_id?: string;
      filial_id?: string;
      parcelas?: number;
    }>();

    if (!body.fornecedor_id || !body.valor_original || !body.data_vencimento) {
      return c.json({ success: false, error: 'Fornecedor, valor e vencimento são obrigatórios' }, 400);
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
        INSERT INTO contas_pagar (
          id, empresa_id, filial_id, fornecedor_id, origem, numero_documento,
          numero_parcela, parcela_atual, parcelas_total,
          valor_original, valor_aberto, data_emissao, data_vencimento,
          categoria, centro_custo, forma_pagamento_id,
          codigo_barras, linha_digitavel, pix_copia_cola,
          status, observacao, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aberto', ?, ?, ?)
      `).bind(
        id, empresaId, body.filial_id || null, body.fornecedor_id,
        body.numero_documento || null,
        `${i}/${parcelas}`, i, parcelas,
        valorParcela, valorParcela,
        body.data_emissao || now.split('T')[0], dataVenc,
        body.categoria || null, body.centro_custo || null,
        body.forma_pagamento_id || null,
        body.codigo_barras || null, body.linha_digitavel || null, body.pix_copia_cola || null,
        body.observacao || null, now, now
      ).run();
    }

    return c.json({
      success: true,
      data: { ids, parcelas },
      message: `${parcelas} parcela(s) criada(s) com sucesso`
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar conta a pagar:', error);
    return c.json({ success: false, error: 'Erro ao criar conta a pagar' }, 500);
  }
});

// =============================================
// PUT /contas-pagar/:id - Editar
// =============================================
contasPagar.put('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      data_vencimento?: string;
      categoria?: string;
      centro_custo?: string;
      observacao?: string;
      codigo_barras?: string;
      linha_digitavel?: string;
      pix_copia_cola?: string;
    }>();

    const conta = await c.env.DB.prepare(`
      SELECT status FROM contas_pagar WHERE id = ? AND deleted_at IS NULL
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
    if (body.categoria !== undefined) { updates.push('categoria = ?'); params.push(body.categoria); }
    if (body.centro_custo !== undefined) { updates.push('centro_custo = ?'); params.push(body.centro_custo); }
    if (body.observacao !== undefined) { updates.push('observacao = ?'); params.push(body.observacao); }
    if (body.codigo_barras !== undefined) { updates.push('codigo_barras = ?'); params.push(body.codigo_barras); }
    if (body.linha_digitavel !== undefined) { updates.push('linha_digitavel = ?'); params.push(body.linha_digitavel); }
    if (body.pix_copia_cola !== undefined) { updates.push('pix_copia_cola = ?'); params.push(body.pix_copia_cola); }

    params.push(id);

    await c.env.DB.prepare(`
      UPDATE contas_pagar SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return c.json({ success: true, message: 'Conta atualizada' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao editar conta' }, 500);
  }
});

// =============================================
// POST /contas-pagar/:id/baixar - Baixar (pagar)
// =============================================
contasPagar.post('/:id/baixar', async (c) => {
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
      SELECT * FROM contas_pagar WHERE id = ? AND deleted_at IS NULL
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
      INSERT INTO contas_pagar_baixas (
        id, conta_pagar_id, valor_pago, valor_juros, valor_multa, valor_desconto,
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
      UPDATE contas_pagar SET 
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
      message: novoStatus === 'pago' ? 'Conta paga integralmente' : 'Baixa parcial registrada',
      data: { status: novoStatus, valor_aberto: Math.max(0, novoValorAberto) }
    });
  } catch (error: any) {
    console.error('Erro ao baixar conta:', error);
    return c.json({ success: false, error: 'Erro ao baixar conta' }, 500);
  }
});

// =============================================
// POST /contas-pagar/:id/estornar - Estornar baixa
// =============================================
contasPagar.post('/:id/estornar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{ baixa_id: string; motivo?: string }>();

    const baixa = await c.env.DB.prepare(`
      SELECT * FROM contas_pagar_baixas WHERE id = ? AND conta_pagar_id = ?
    `).bind(body.baixa_id, id).first<any>();

    if (!baixa) {
      return c.json({ success: false, error: 'Baixa não encontrada' }, 404);
    }

    // Remover baixa
    await c.env.DB.prepare(`
      DELETE FROM contas_pagar_baixas WHERE id = ?
    `).bind(body.baixa_id).run();

    // Recalcular valores
    const conta = await c.env.DB.prepare(`
      SELECT valor_original, valor_pago, valor_juros, valor_multa, valor_desconto
      FROM contas_pagar WHERE id = ?
    `).bind(id).first<any>();

    const novoValorPago = (conta.valor_pago || 0) - baixa.valor_pago;
    const novoValorAberto = conta.valor_original + (conta.valor_juros - baixa.valor_juros) + (conta.valor_multa - baixa.valor_multa) - (conta.valor_desconto - baixa.valor_desconto) - novoValorPago;
    const novoStatus = novoValorPago <= 0 ? 'aberto' : 'parcial';

    await c.env.DB.prepare(`
      UPDATE contas_pagar SET 
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
// DELETE /contas-pagar/:id - Excluir (soft delete)
// =============================================
contasPagar.delete('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const conta = await c.env.DB.prepare(`
      SELECT status FROM contas_pagar WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<{ status: string }>();

    if (!conta) {
      return c.json({ success: false, error: 'Conta não encontrada' }, 404);
    }

    if (conta.status === 'pago') {
      return c.json({ success: false, error: 'Conta paga não pode ser excluída' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE contas_pagar SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Conta excluída' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Erro ao excluir' }, 500);
  }
});

export default contasPagar;
