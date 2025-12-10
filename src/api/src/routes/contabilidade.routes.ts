// ============================================
// PLANAC ERP - Rotas de Contabilidade
// Bloco 3 - Contabilidade
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const contabilidade = new Hono<{ Bindings: Env }>();

// ============================================
// PLANO DE CONTAS
// ============================================

// GET /api/contabilidade/plano-contas - Listar plano de contas
contabilidade.get('/plano-contas', async (c) => {
  const empresaId = c.get('empresaId');
  const { tipo, natureza, sintetica } = c.req.query();
  
  let query = `SELECT pc.*, 
               (SELECT codigo FROM plano_contas WHERE id = pc.conta_pai_id) as conta_pai_codigo,
               (SELECT nome FROM plano_contas WHERE id = pc.conta_pai_id) as conta_pai_nome
               FROM plano_contas pc WHERE pc.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (tipo) {
    query += ` AND pc.tipo = ?`;
    params.push(tipo);
  }
  
  if (natureza) {
    query += ` AND pc.natureza = ?`;
    params.push(natureza);
  }
  
  if (sintetica !== undefined) {
    query += ` AND pc.sintetica = ?`;
    params.push(sintetica === 'true' ? 1 : 0);
  }
  
  query += ` ORDER BY pc.codigo`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// GET /api/contabilidade/plano-contas/arvore - Plano de contas em árvore
contabilidade.get('/plano-contas/arvore', async (c) => {
  const empresaId = c.get('empresaId');
  
  const contas = await c.env.DB.prepare(`
    SELECT * FROM plano_contas WHERE empresa_id = ? ORDER BY codigo
  `).bind(empresaId).all();
  
  // Montar árvore
  const contasMap: Record<string, any> = {};
  const raizes: any[] = [];
  
  for (const conta of contas.results as any[]) {
    conta.filhas = [];
    contasMap[conta.id] = conta;
  }
  
  for (const conta of contas.results as any[]) {
    if (conta.conta_pai_id && contasMap[conta.conta_pai_id]) {
      contasMap[conta.conta_pai_id].filhas.push(conta);
    } else {
      raizes.push(conta);
    }
  }
  
  return c.json({ success: true, data: raizes });
});

// GET /api/contabilidade/plano-contas/:id - Buscar conta
contabilidade.get('/plano-contas/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const conta = await c.env.DB.prepare(`
    SELECT * FROM plano_contas WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!conta) {
    return c.json({ error: 'Conta não encontrada' }, 404);
  }
  
  // Buscar filhas
  const filhas = await c.env.DB.prepare(`
    SELECT id, codigo, nome FROM plano_contas WHERE conta_pai_id = ?
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: { ...conta, contas_filhas: filhas.results }
  });
});

// POST /api/contabilidade/plano-contas - Criar conta
contabilidade.post('/plano-contas', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    codigo: z.string().min(1).max(20),
    nome: z.string().min(1).max(100),
    tipo: z.enum(['ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO', 'RECEITA', 'DESPESA']),
    natureza: z.enum(['DEVEDORA', 'CREDORA']),
    sintetica: z.boolean().default(false),
    conta_pai_id: z.string().uuid().optional(),
    aceita_lancamento: z.boolean().default(true),
    descricao: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  // Verificar código duplicado
  const existente = await c.env.DB.prepare(`
    SELECT id FROM plano_contas WHERE codigo = ? AND empresa_id = ?
  `).bind(validation.data.codigo, empresaId).first();
  
  if (existente) {
    return c.json({ error: 'Código de conta já existe' }, 409);
  }
  
  // Determinar nível
  let nivel = 1;
  if (validation.data.conta_pai_id) {
    const pai = await c.env.DB.prepare(`
      SELECT nivel FROM plano_contas WHERE id = ?
    `).bind(validation.data.conta_pai_id).first();
    nivel = ((pai?.nivel as number) || 0) + 1;
  }
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO plano_contas (id, empresa_id, codigo, nome, tipo, natureza, sintetica, 
                              conta_pai_id, nivel, aceita_lancamento, descricao, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, empresaId, data.codigo, data.nome, data.tipo, data.natureza,
          data.sintetica ? 1 : 0, data.conta_pai_id || null, nivel,
          data.aceita_lancamento ? 1 : 0, data.descricao || null, usuarioId).run();
  
  return c.json({ id, message: 'Conta criada com sucesso' }, 201);
});

// PUT /api/contabilidade/plano-contas/:id - Atualizar conta
contabilidade.put('/plano-contas/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  // Verificar se tem lançamentos
  const temLancamentos = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM lancamentos_itens WHERE conta_id = ?
  `).bind(id).first();
  
  if ((temLancamentos?.total as number) > 0 && (body.tipo || body.natureza)) {
    return c.json({ error: 'Não é possível alterar tipo/natureza de conta com lançamentos' }, 400);
  }
  
  const campos: string[] = [];
  const valores: any[] = [];
  
  const permitidos = ['nome', 'descricao', 'aceita_lancamento', 'sintetica'];
  
  for (const [key, value] of Object.entries(body)) {
    if (permitidos.includes(key)) {
      campos.push(`${key} = ?`);
      valores.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
    }
  }
  
  if (campos.length > 0) {
    await c.env.DB.prepare(`
      UPDATE plano_contas SET ${campos.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND empresa_id = ?
    `).bind(...valores, id, empresaId).run();
  }
  
  return c.json({ message: 'Conta atualizada' });
});

// ============================================
// LANÇAMENTOS CONTÁBEIS
// ============================================

// GET /api/contabilidade/lancamentos - Listar lançamentos
contabilidade.get('/lancamentos', async (c) => {
  const empresaId = c.get('empresaId');
  const { data_inicio, data_fim, status, page = '1', limit = '50' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT l.*, u.nome as usuario_nome,
               (SELECT SUM(CASE WHEN tipo = 'DEBITO' THEN valor ELSE 0 END) FROM lancamentos_itens WHERE lancamento_id = l.id) as total_debito,
               (SELECT SUM(CASE WHEN tipo = 'CREDITO' THEN valor ELSE 0 END) FROM lancamentos_itens WHERE lancamento_id = l.id) as total_credito
               FROM lancamentos l
               LEFT JOIN usuarios u ON l.created_by = u.id
               WHERE l.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (data_inicio) {
    query += ` AND l.data >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    query += ` AND l.data <= ?`;
    params.push(data_fim);
  }
  
  if (status) {
    query += ` AND l.status = ?`;
    params.push(status);
  }
  
  const countQuery = query.replace(/SELECT l\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY l.data DESC, l.numero DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: result.results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult?.total || 0 }
  });
});

// GET /api/contabilidade/lancamentos/:id - Buscar lançamento
contabilidade.get('/lancamentos/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const lancamento = await c.env.DB.prepare(`
    SELECT l.*, u.nome as usuario_nome
    FROM lancamentos l
    LEFT JOIN usuarios u ON l.created_by = u.id
    WHERE l.id = ? AND l.empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!lancamento) {
    return c.json({ error: 'Lançamento não encontrado' }, 404);
  }
  
  const itens = await c.env.DB.prepare(`
    SELECT li.*, pc.codigo as conta_codigo, pc.nome as conta_nome
    FROM lancamentos_itens li
    JOIN plano_contas pc ON li.conta_id = pc.id
    WHERE li.lancamento_id = ?
    ORDER BY li.tipo
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: { ...lancamento, itens: itens.results }
  });
});

// POST /api/contabilidade/lancamentos - Criar lançamento
contabilidade.post('/lancamentos', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    data: z.string(),
    historico: z.string().min(1).max(500),
    documento: z.string().optional(),
    itens: z.array(z.object({
      conta_id: z.string().uuid(),
      tipo: z.enum(['DEBITO', 'CREDITO']),
      valor: z.number().min(0.01)
    })).min(2)
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  // Validar partidas dobradas (débito = crédito)
  const totalDebito = validation.data.itens
    .filter(i => i.tipo === 'DEBITO')
    .reduce((sum, i) => sum + i.valor, 0);
  const totalCredito = validation.data.itens
    .filter(i => i.tipo === 'CREDITO')
    .reduce((sum, i) => sum + i.valor, 0);
  
  if (Math.abs(totalDebito - totalCredito) > 0.01) {
    return c.json({ 
      error: 'Lançamento não balanceado',
      details: { debito: totalDebito, credito: totalCredito }
    }, 400);
  }
  
  // Gerar número sequencial
  const ultimoNumero = await c.env.DB.prepare(`
    SELECT MAX(numero) as ultimo FROM lancamentos WHERE empresa_id = ?
  `).bind(empresaId).first();
  const numero = ((ultimoNumero?.ultimo as number) || 0) + 1;
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO lancamentos (id, empresa_id, numero, data, historico, documento, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'RASCUNHO', ?)
  `).bind(id, empresaId, numero, validation.data.data, validation.data.historico,
          validation.data.documento || null, usuarioId).run();
  
  // Inserir itens
  for (const item of validation.data.itens) {
    const itemId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO lancamentos_itens (id, lancamento_id, conta_id, tipo, valor)
      VALUES (?, ?, ?, ?, ?)
    `).bind(itemId, id, item.conta_id, item.tipo, item.valor).run();
  }
  
  return c.json({ id, numero, message: 'Lançamento criado' }, 201);
});

// POST /api/contabilidade/lancamentos/:id/confirmar - Confirmar lançamento
contabilidade.post('/lancamentos/:id/confirmar', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const lancamento = await c.env.DB.prepare(`
    SELECT status FROM lancamentos WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!lancamento) {
    return c.json({ error: 'Lançamento não encontrado' }, 404);
  }
  
  if (lancamento.status !== 'RASCUNHO') {
    return c.json({ error: 'Lançamento não está em rascunho' }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE lancamentos SET status = 'CONFIRMADO', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run();
  
  return c.json({ message: 'Lançamento confirmado' });
});

// POST /api/contabilidade/lancamentos/:id/estornar - Estornar lançamento
contabilidade.post('/lancamentos/:id/estornar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const lancamento = await c.env.DB.prepare(`
    SELECT * FROM lancamentos WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!lancamento || lancamento.status !== 'CONFIRMADO') {
    return c.json({ error: 'Lançamento não encontrado ou não confirmado' }, 400);
  }
  
  // Buscar itens originais
  const itensOriginais = await c.env.DB.prepare(`
    SELECT * FROM lancamentos_itens WHERE lancamento_id = ?
  `).bind(id).all();
  
  // Gerar número
  const ultimoNumero = await c.env.DB.prepare(`
    SELECT MAX(numero) as ultimo FROM lancamentos WHERE empresa_id = ?
  `).bind(empresaId).first();
  const numero = ((ultimoNumero?.ultimo as number) || 0) + 1;
  
  // Criar lançamento de estorno (invertido)
  const estornoId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO lancamentos (id, empresa_id, numero, data, historico, documento, 
                             status, lancamento_origem_id, created_by)
    VALUES (?, ?, ?, date('now'), ?, ?, 'CONFIRMADO', ?, ?)
  `).bind(estornoId, empresaId, numero, 
          `ESTORNO: ${lancamento.historico}`, body.motivo || null, id, usuarioId).run();
  
  // Inserir itens invertidos
  for (const item of itensOriginais.results as any[]) {
    const itemId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO lancamentos_itens (id, lancamento_id, conta_id, tipo, valor)
      VALUES (?, ?, ?, ?, ?)
    `).bind(itemId, estornoId, item.conta_id, 
            item.tipo === 'DEBITO' ? 'CREDITO' : 'DEBITO', item.valor).run();
  }
  
  // Marcar original como estornado
  await c.env.DB.prepare(`
    UPDATE lancamentos SET status = 'ESTORNADO', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(id).run();
  
  return c.json({ id: estornoId, message: 'Lançamento estornado' });
});

// ============================================
// BALANCETE / RAZÃO
// ============================================

// GET /api/contabilidade/balancete - Gerar balancete
contabilidade.get('/balancete', async (c) => {
  const empresaId = c.get('empresaId');
  const { data_inicio, data_fim } = c.req.query();
  
  if (!data_inicio || !data_fim) {
    return c.json({ error: 'Informe data_inicio e data_fim' }, 400);
  }
  
  const contas = await c.env.DB.prepare(`
    SELECT pc.id, pc.codigo, pc.nome, pc.tipo, pc.natureza,
           COALESCE(SUM(CASE WHEN li.tipo = 'DEBITO' THEN li.valor ELSE 0 END), 0) as debitos,
           COALESCE(SUM(CASE WHEN li.tipo = 'CREDITO' THEN li.valor ELSE 0 END), 0) as creditos
    FROM plano_contas pc
    LEFT JOIN lancamentos_itens li ON li.conta_id = pc.id
    LEFT JOIN lancamentos l ON li.lancamento_id = l.id 
                            AND l.status = 'CONFIRMADO'
                            AND l.data BETWEEN ? AND ?
    WHERE pc.empresa_id = ? AND pc.sintetica = 0
    GROUP BY pc.id
    ORDER BY pc.codigo
  `).bind(data_inicio, data_fim, empresaId).all();
  
  let totalDebitos = 0;
  let totalCreditos = 0;
  
  const resultado = (contas.results as any[]).map(conta => {
    const debitos = conta.debitos as number;
    const creditos = conta.creditos as number;
    let saldo = 0;
    
    if (conta.natureza === 'DEVEDORA') {
      saldo = debitos - creditos;
    } else {
      saldo = creditos - debitos;
    }
    
    totalDebitos += debitos;
    totalCreditos += creditos;
    
    return { ...conta, saldo };
  }).filter(c => c.debitos > 0 || c.creditos > 0 || c.saldo !== 0);
  
  return c.json({
    success: true,
    data: {
      periodo: { inicio: data_inicio, fim: data_fim },
      contas: resultado,
      totais: {
        debitos: totalDebitos,
        creditos: totalCreditos,
        diferenca: totalDebitos - totalCreditos
      }
    }
  });
});

// GET /api/contabilidade/razao/:contaId - Razão de uma conta
contabilidade.get('/razao/:contaId', async (c) => {
  const empresaId = c.get('empresaId');
  const { contaId } = c.req.param();
  const { data_inicio, data_fim } = c.req.query();
  
  const conta = await c.env.DB.prepare(`
    SELECT * FROM plano_contas WHERE id = ? AND empresa_id = ?
  `).bind(contaId, empresaId).first();
  
  if (!conta) {
    return c.json({ error: 'Conta não encontrada' }, 404);
  }
  
  let query = `SELECT l.numero, l.data, l.historico, li.tipo, li.valor
               FROM lancamentos_itens li
               JOIN lancamentos l ON li.lancamento_id = l.id
               WHERE li.conta_id = ? AND l.status = 'CONFIRMADO'`;
  const params: any[] = [contaId];
  
  if (data_inicio) {
    query += ` AND l.data >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    query += ` AND l.data <= ?`;
    params.push(data_fim);
  }
  
  query += ` ORDER BY l.data, l.numero`;
  
  const movimentos = await c.env.DB.prepare(query).bind(...params).all();
  
  // Calcular saldo acumulado
  let saldo = 0;
  const resultado = (movimentos.results as any[]).map(mov => {
    if (conta.natureza === 'DEVEDORA') {
      saldo += mov.tipo === 'DEBITO' ? mov.valor : -mov.valor;
    } else {
      saldo += mov.tipo === 'CREDITO' ? mov.valor : -mov.valor;
    }
    return { ...mov, saldo_acumulado: saldo };
  });
  
  return c.json({
    success: true,
    data: {
      conta: { codigo: conta.codigo, nome: conta.nome, natureza: conta.natureza },
      movimentos: resultado,
      saldo_final: saldo
    }
  });
});

// ============================================
// FECHAMENTO
// ============================================

// POST /api/contabilidade/fechamento - Realizar fechamento mensal
contabilidade.post('/fechamento', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    ano: z.number().int(),
    mes: z.number().int().min(1).max(12)
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  // Verificar se já existe
  const existente = await c.env.DB.prepare(`
    SELECT id FROM fechamentos WHERE empresa_id = ? AND ano = ? AND mes = ?
  `).bind(empresaId, validation.data.ano, validation.data.mes).first();
  
  if (existente) {
    return c.json({ error: 'Fechamento já realizado para este período' }, 409);
  }
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO fechamentos (id, empresa_id, ano, mes, status, fechado_por)
    VALUES (?, ?, ?, ?, 'FECHADO', ?)
  `).bind(id, empresaId, validation.data.ano, validation.data.mes, usuarioId).run();
  
  return c.json({ id, message: 'Fechamento realizado' }, 201);
});

export default contabilidade;
