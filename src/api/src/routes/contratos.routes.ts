// ============================================
// PLANAC ERP - Rotas de Contratos
// Bloco 3 - Gestão de Contratos
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const contratos = new Hono<{ Bindings: Env }>();

// ============================================
// CONTRATOS
// ============================================

// GET /api/contratos - Listar contratos
contratos.get('/', async (c) => {
  const empresaId = c.get('empresaId');
  const { tipo, status, cliente_id, fornecedor_id, vencendo, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT ct.*, 
               cl.razao_social as cliente_nome,
               f.razao_social as fornecedor_nome,
               (SELECT COUNT(*) FROM contratos_aditivos WHERE contrato_id = ct.id) as total_aditivos
               FROM contratos ct
               LEFT JOIN clientes cl ON ct.cliente_id = cl.id
               LEFT JOIN fornecedores f ON ct.fornecedor_id = f.id
               WHERE ct.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (tipo) {
    query += ` AND ct.tipo = ?`;
    params.push(tipo);
  }
  
  if (status) {
    query += ` AND ct.status = ?`;
    params.push(status);
  }
  
  if (cliente_id) {
    query += ` AND ct.cliente_id = ?`;
    params.push(cliente_id);
  }
  
  if (fornecedor_id) {
    query += ` AND ct.fornecedor_id = ?`;
    params.push(fornecedor_id);
  }
  
  if (vencendo) {
    query += ` AND ct.data_fim <= date('now', '+' || ? || ' days') AND ct.status = 'ATIVO'`;
    params.push(vencendo);
  }
  
  const countQuery = query.replace(/SELECT ct\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY ct.data_fim LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: result.results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult?.total || 0 }
  });
});

// GET /api/contratos/:id - Buscar contrato com detalhes
contratos.get('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const contrato = await c.env.DB.prepare(`
    SELECT ct.*, 
           cl.razao_social as cliente_nome, cl.cnpj_cpf as cliente_documento,
           f.razao_social as fornecedor_nome, f.cnpj as fornecedor_documento
    FROM contratos ct
    LEFT JOIN clientes cl ON ct.cliente_id = cl.id
    LEFT JOIN fornecedores f ON ct.fornecedor_id = f.id
    WHERE ct.id = ? AND ct.empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!contrato) {
    return c.json({ error: 'Contrato não encontrado' }, 404);
  }
  
  const aditivos = await c.env.DB.prepare(`
    SELECT * FROM contratos_aditivos WHERE contrato_id = ? ORDER BY numero
  `).bind(id).all();
  
  const parcelas = await c.env.DB.prepare(`
    SELECT * FROM contratos_parcelas WHERE contrato_id = ? ORDER BY data_vencimento
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: { ...contrato, aditivos: aditivos.results, parcelas: parcelas.results }
  });
});

// POST /api/contratos - Criar contrato
contratos.post('/', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    tipo: z.enum(['VENDA', 'COMPRA', 'SERVICO', 'LOCACAO', 'PARCERIA', 'OUTROS']),
    cliente_id: z.string().uuid().optional(),
    fornecedor_id: z.string().uuid().optional(),
    objeto: z.string().min(1),
    descricao: z.string().optional(),
    data_inicio: z.string(),
    data_fim: z.string(),
    valor_total: z.number().min(0),
    valor_mensal: z.number().min(0).optional(),
    dia_vencimento: z.number().int().min(1).max(31).optional(),
    forma_pagamento: z.string().optional(),
    indice_reajuste: z.enum(['IGPM', 'IPCA', 'INPC', 'SELIC', 'FIXO', 'NENHUM']).default('NENHUM'),
    percentual_reajuste: z.number().optional(),
    periodicidade_reajuste: z.number().int().optional(), // meses
    clausulas: z.string().optional(),
    gerar_parcelas: z.boolean().default(false)
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  // Gerar número do contrato
  const seq = await c.env.DB.prepare(`
    SELECT COALESCE(MAX(CAST(numero AS INTEGER)), 0) + 1 as proximo 
    FROM contratos WHERE empresa_id = ?
  `).bind(empresaId).first();
  
  const numero = String(seq?.proximo || 1).padStart(6, '0');
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO contratos (id, empresa_id, numero, tipo, cliente_id, fornecedor_id, objeto,
                           descricao, data_inicio, data_fim, valor_total, valor_mensal,
                           dia_vencimento, forma_pagamento, indice_reajuste, percentual_reajuste,
                           periodicidade_reajuste, clausulas, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RASCUNHO', ?)
  `).bind(id, empresaId, numero, data.tipo, data.cliente_id || null, data.fornecedor_id || null,
          data.objeto, data.descricao || null, data.data_inicio, data.data_fim, data.valor_total,
          data.valor_mensal || null, data.dia_vencimento || null, data.forma_pagamento || null,
          data.indice_reajuste, data.percentual_reajuste || null, data.periodicidade_reajuste || null,
          data.clausulas || null, usuarioId).run();
  
  // Gerar parcelas se solicitado
  if (data.gerar_parcelas && data.valor_mensal && data.dia_vencimento) {
    await gerarParcelasContrato(c.env.DB, id, data);
  }
  
  return c.json({ id, numero, message: 'Contrato criado' }, 201);
});

// PUT /api/contratos/:id - Atualizar contrato
contratos.put('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const campos: string[] = [];
  const valores: any[] = [];
  
  if (body.objeto) { campos.push('objeto = ?'); valores.push(body.objeto); }
  if (body.descricao !== undefined) { campos.push('descricao = ?'); valores.push(body.descricao); }
  if (body.data_fim) { campos.push('data_fim = ?'); valores.push(body.data_fim); }
  if (body.valor_total !== undefined) { campos.push('valor_total = ?'); valores.push(body.valor_total); }
  if (body.valor_mensal !== undefined) { campos.push('valor_mensal = ?'); valores.push(body.valor_mensal); }
  if (body.clausulas !== undefined) { campos.push('clausulas = ?'); valores.push(body.clausulas); }
  if (body.status) { campos.push('status = ?'); valores.push(body.status); }
  
  if (campos.length > 0) {
    await c.env.DB.prepare(`
      UPDATE contratos SET ${campos.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND empresa_id = ?
    `).bind(...valores, id, empresaId).run();
  }
  
  return c.json({ message: 'Contrato atualizado' });
});

// POST /api/contratos/:id/ativar - Ativar contrato
contratos.post('/:id/ativar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  
  await c.env.DB.prepare(`
    UPDATE contratos SET status = 'ATIVO', data_ativacao = CURRENT_TIMESTAMP,
                         ativado_por = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(usuarioId, id, empresaId).run();
  
  return c.json({ message: 'Contrato ativado' });
});

// POST /api/contratos/:id/encerrar - Encerrar contrato
contratos.post('/:id/encerrar', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const { motivo } = body;
  
  await c.env.DB.prepare(`
    UPDATE contratos SET status = 'ENCERRADO', data_encerramento = CURRENT_TIMESTAMP,
                         motivo_encerramento = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(motivo || null, id, empresaId).run();
  
  return c.json({ message: 'Contrato encerrado' });
});

// ============================================
// ADITIVOS
// ============================================

// POST /api/contratos/:id/aditivos - Criar aditivo
contratos.post('/:id/aditivos', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    tipo: z.enum(['PRORROGACAO', 'VALOR', 'OBJETO', 'RESCISAO', 'OUTROS']),
    descricao: z.string().min(1),
    nova_data_fim: z.string().optional(),
    novo_valor: z.number().optional(),
    alteracoes: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  // Gerar número do aditivo
  const seq = await c.env.DB.prepare(`
    SELECT COALESCE(MAX(numero), 0) + 1 as proximo FROM contratos_aditivos WHERE contrato_id = ?
  `).bind(id).first();
  
  const aditivoId = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO contratos_aditivos (id, contrato_id, numero, tipo, descricao, nova_data_fim,
                                    novo_valor, alteracoes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(aditivoId, id, seq?.proximo || 1, data.tipo, data.descricao, data.nova_data_fim || null,
          data.novo_valor || null, data.alteracoes || null, usuarioId).run();
  
  // Atualizar contrato se necessário
  if (data.nova_data_fim) {
    await c.env.DB.prepare(`UPDATE contratos SET data_fim = ? WHERE id = ?`).bind(data.nova_data_fim, id).run();
  }
  if (data.novo_valor) {
    await c.env.DB.prepare(`UPDATE contratos SET valor_total = ? WHERE id = ?`).bind(data.novo_valor, id).run();
  }
  
  return c.json({ id: aditivoId, message: 'Aditivo criado' }, 201);
});

// ============================================
// PARCELAS
// ============================================

// GET /api/contratos/:id/parcelas - Listar parcelas do contrato
contratos.get('/:id/parcelas', async (c) => {
  const { id } = c.req.param();
  const { status } = c.req.query();
  
  let query = `SELECT * FROM contratos_parcelas WHERE contrato_id = ?`;
  const params: any[] = [id];
  
  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY data_vencimento`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// POST /api/contratos/:id/parcelas/gerar - Gerar parcelas
contratos.post('/:id/parcelas/gerar', async (c) => {
  const { id } = c.req.param();
  
  const contrato = await c.env.DB.prepare(`
    SELECT * FROM contratos WHERE id = ?
  `).bind(id).first();
  
  if (!contrato) {
    return c.json({ error: 'Contrato não encontrado' }, 404);
  }
  
  if (!contrato.valor_mensal || !contrato.dia_vencimento) {
    return c.json({ error: 'Contrato não tem valor mensal ou dia de vencimento definidos' }, 400);
  }
  
  // Limpar parcelas existentes não pagas
  await c.env.DB.prepare(`
    DELETE FROM contratos_parcelas WHERE contrato_id = ? AND status = 'PENDENTE'
  `).bind(id).run();
  
  await gerarParcelasContrato(c.env.DB, id, contrato as any);
  
  return c.json({ message: 'Parcelas geradas' });
});

// PUT /api/contratos/:id/parcelas/:parcelaId/pagar - Registrar pagamento
contratos.put('/:id/parcelas/:parcelaId/pagar', async (c) => {
  const { id, parcelaId } = c.req.param();
  const body = await c.req.json();
  
  const { data_pagamento, valor_pago } = body;
  
  await c.env.DB.prepare(`
    UPDATE contratos_parcelas SET status = 'PAGO', data_pagamento = ?, valor_pago = ?,
                                  updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND contrato_id = ?
  `).bind(data_pagamento || new Date().toISOString().split('T')[0], valor_pago, parcelaId, id).run();
  
  return c.json({ message: 'Pagamento registrado' });
});

// ============================================
// REAJUSTES
// ============================================

// POST /api/contratos/:id/reajustar - Aplicar reajuste
contratos.post('/:id/reajustar', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const { percentual, data_vigencia } = body;
  
  const contrato = await c.env.DB.prepare(`
    SELECT * FROM contratos WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!contrato) {
    return c.json({ error: 'Contrato não encontrado' }, 404);
  }
  
  const valorAnterior = contrato.valor_total as number;
  const novoValor = valorAnterior * (1 + percentual / 100);
  
  // Criar aditivo de reajuste
  const aditivoId = crypto.randomUUID();
  const seq = await c.env.DB.prepare(`
    SELECT COALESCE(MAX(numero), 0) + 1 as proximo FROM contratos_aditivos WHERE contrato_id = ?
  `).bind(id).first();
  
  await c.env.DB.prepare(`
    INSERT INTO contratos_aditivos (id, contrato_id, numero, tipo, descricao, novo_valor)
    VALUES (?, ?, ?, 'VALOR', ?, ?)
  `).bind(aditivoId, id, seq?.proximo || 1, `Reajuste de ${percentual}%`, novoValor).run();
  
  // Atualizar contrato
  await c.env.DB.prepare(`
    UPDATE contratos SET valor_total = ?, valor_mensal = CASE WHEN valor_mensal IS NOT NULL 
           THEN valor_mensal * ? ELSE NULL END, ultimo_reajuste = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(novoValor, 1 + percentual / 100, data_vigencia, id).run();
  
  return c.json({ 
    message: 'Reajuste aplicado',
    valor_anterior: valorAnterior,
    novo_valor: novoValor,
    aditivo_id: aditivoId
  });
});

// ============================================
// ALERTAS
// ============================================

// GET /api/contratos/alertas/vencimento - Contratos próximos do vencimento
contratos.get('/alertas/vencimento', async (c) => {
  const empresaId = c.get('empresaId');
  const { dias = '30' } = c.req.query();
  
  const result = await c.env.DB.prepare(`
    SELECT ct.*, cl.razao_social as cliente_nome, f.razao_social as fornecedor_nome,
           julianday(ct.data_fim) - julianday('now') as dias_restantes
    FROM contratos ct
    LEFT JOIN clientes cl ON ct.cliente_id = cl.id
    LEFT JOIN fornecedores f ON ct.fornecedor_id = f.id
    WHERE ct.empresa_id = ? AND ct.status = 'ATIVO'
      AND ct.data_fim <= date('now', '+' || ? || ' days')
    ORDER BY ct.data_fim
  `).bind(empresaId, dias).all();
  
  return c.json({ success: true, data: result.results });
});

// GET /api/contratos/alertas/reajuste - Contratos com reajuste pendente
contratos.get('/alertas/reajuste', async (c) => {
  const empresaId = c.get('empresaId');
  
  const result = await c.env.DB.prepare(`
    SELECT ct.*, cl.razao_social as cliente_nome,
           CASE 
             WHEN ct.ultimo_reajuste IS NULL THEN ct.data_inicio
             ELSE ct.ultimo_reajuste
           END as ultima_referencia
    FROM contratos ct
    LEFT JOIN clientes cl ON ct.cliente_id = cl.id
    WHERE ct.empresa_id = ? AND ct.status = 'ATIVO'
      AND ct.indice_reajuste != 'NENHUM'
      AND ct.periodicidade_reajuste IS NOT NULL
      AND date(COALESCE(ct.ultimo_reajuste, ct.data_inicio), '+' || ct.periodicidade_reajuste || ' months') <= date('now')
    ORDER BY ultima_referencia
  `).bind(empresaId).all();
  
  return c.json({ success: true, data: result.results });
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function gerarParcelasContrato(db: any, contratoId: string, contrato: any) {
  const dataInicio = new Date(contrato.data_inicio);
  const dataFim = new Date(contrato.data_fim);
  const valorMensal = contrato.valor_mensal;
  const diaVencimento = contrato.dia_vencimento;
  
  let dataAtual = new Date(dataInicio);
  dataAtual.setDate(diaVencimento);
  
  if (dataAtual < dataInicio) {
    dataAtual.setMonth(dataAtual.getMonth() + 1);
  }
  
  let numero = 1;
  
  while (dataAtual <= dataFim) {
    const parcelaId = crypto.randomUUID();
    
    await db.prepare(`
      INSERT INTO contratos_parcelas (id, contrato_id, numero, data_vencimento, valor, status)
      VALUES (?, ?, ?, ?, ?, 'PENDENTE')
    `).bind(parcelaId, contratoId, numero, dataAtual.toISOString().split('T')[0], valorMensal).run();
    
    dataAtual.setMonth(dataAtual.getMonth() + 1);
    numero++;
  }
}

export default contratos;
