// ============================================
// PLANAC ERP - Rotas de Folha de Pagamento
// Bloco 3 - RH
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const folhaPagamento = new Hono<{ Bindings: Env }>();

// ============================================
// FOLHA DE PAGAMENTO
// ============================================

// GET /api/folha-pagamento - Listar folhas
folhaPagamento.get('/', async (c) => {
  const empresaId = c.get('empresaId');
  const { ano, mes, status } = c.req.query();
  
  let query = `SELECT fp.*, 
               (SELECT COUNT(*) FROM folha_eventos WHERE folha_id = fp.id) as total_eventos,
               (SELECT SUM(valor) FROM folha_eventos WHERE folha_id = fp.id AND tipo = 'PROVENTO') as total_proventos,
               (SELECT SUM(valor) FROM folha_eventos WHERE folha_id = fp.id AND tipo = 'DESCONTO') as total_descontos
               FROM folha_pagamento fp
               WHERE fp.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (ano) {
    query += ` AND fp.ano = ?`;
    params.push(parseInt(ano));
  }
  
  if (mes) {
    query += ` AND fp.mes = ?`;
    params.push(parseInt(mes));
  }
  
  if (status) {
    query += ` AND fp.status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY fp.ano DESC, fp.mes DESC`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// GET /api/folha-pagamento/:id - Buscar folha com eventos
folhaPagamento.get('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const folha = await c.env.DB.prepare(`
    SELECT * FROM folha_pagamento WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!folha) {
    return c.json({ error: 'Folha não encontrada' }, 404);
  }
  
  // Buscar eventos agrupados por funcionário
  const eventos = await c.env.DB.prepare(`
    SELECT fe.*, f.nome as funcionario_nome, f.matricula
    FROM folha_eventos fe
    JOIN funcionarios f ON fe.funcionario_id = f.id
    WHERE fe.folha_id = ?
    ORDER BY f.nome, fe.tipo, fe.codigo
  `).bind(id).all();
  
  // Agrupar por funcionário
  const funcionarios: Record<string, any> = {};
  for (const evento of eventos.results as any[]) {
    if (!funcionarios[evento.funcionario_id]) {
      funcionarios[evento.funcionario_id] = {
        funcionario_id: evento.funcionario_id,
        funcionario_nome: evento.funcionario_nome,
        matricula: evento.matricula,
        proventos: [],
        descontos: [],
        total_proventos: 0,
        total_descontos: 0,
        liquido: 0
      };
    }
    
    if (evento.tipo === 'PROVENTO') {
      funcionarios[evento.funcionario_id].proventos.push(evento);
      funcionarios[evento.funcionario_id].total_proventos += evento.valor;
    } else {
      funcionarios[evento.funcionario_id].descontos.push(evento);
      funcionarios[evento.funcionario_id].total_descontos += evento.valor;
    }
  }
  
  // Calcular líquido
  for (const func of Object.values(funcionarios)) {
    func.liquido = func.total_proventos - func.total_descontos;
  }
  
  return c.json({
    success: true,
    data: {
      ...folha,
      funcionarios: Object.values(funcionarios)
    }
  });
});

// POST /api/folha-pagamento - Criar folha do mês
folhaPagamento.post('/', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    ano: z.number().int().min(2020).max(2100),
    mes: z.number().int().min(1).max(12),
    tipo: z.enum(['MENSAL', 'ADIANTAMENTO', 'DECIMO_TERCEIRO', 'FERIAS', 'RESCISAO']).default('MENSAL')
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  // Verificar se já existe folha para o período
  const existente = await c.env.DB.prepare(`
    SELECT id FROM folha_pagamento WHERE empresa_id = ? AND ano = ? AND mes = ? AND tipo = ?
  `).bind(empresaId, validation.data.ano, validation.data.mes, validation.data.tipo).first();
  
  if (existente) {
    return c.json({ error: 'Já existe folha para este período' }, 409);
  }
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO folha_pagamento (id, empresa_id, ano, mes, tipo, status, created_by)
    VALUES (?, ?, ?, ?, ?, 'ABERTA', ?)
  `).bind(id, empresaId, validation.data.ano, validation.data.mes, validation.data.tipo, usuarioId).run();
  
  return c.json({ id, message: 'Folha criada com sucesso' }, 201);
});

// POST /api/folha-pagamento/:id/calcular - Calcular folha automaticamente
folhaPagamento.post('/:id/calcular', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  
  const folha = await c.env.DB.prepare(`
    SELECT * FROM folha_pagamento WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!folha) {
    return c.json({ error: 'Folha não encontrada' }, 404);
  }
  
  if (folha.status !== 'ABERTA') {
    return c.json({ error: 'Folha não está aberta para cálculo' }, 400);
  }
  
  // Limpar eventos anteriores
  await c.env.DB.prepare(`DELETE FROM folha_eventos WHERE folha_id = ?`).bind(id).run();
  
  // Buscar funcionários ativos
  const funcionarios = await c.env.DB.prepare(`
    SELECT id, salario, tipo_contrato FROM funcionarios 
    WHERE empresa_id = ? AND ativo = 1 AND tipo_contrato = 'CLT'
  `).bind(empresaId).all();
  
  let totalBruto = 0;
  let totalDescontos = 0;
  let totalLiquido = 0;
  
  for (const func of funcionarios.results as any[]) {
    const salario = func.salario as number;
    
    // PROVENTOS
    // Salário base
    const eventoSalarioId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO folha_eventos (id, folha_id, funcionario_id, tipo, codigo, descricao, referencia, valor)
      VALUES (?, ?, ?, 'PROVENTO', '001', 'Salário Base', 30, ?)
    `).bind(eventoSalarioId, id, func.id, salario).run();
    
    let brutoFunc = salario;
    let descontosFunc = 0;
    
    // DESCONTOS
    // INSS (tabela simplificada)
    let inss = 0;
    if (salario <= 1412) {
      inss = salario * 0.075;
    } else if (salario <= 2666.68) {
      inss = salario * 0.09;
    } else if (salario <= 4000.03) {
      inss = salario * 0.12;
    } else {
      inss = Math.min(salario * 0.14, 908.85); // Teto INSS 2024
    }
    
    const eventoInssId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO folha_eventos (id, folha_id, funcionario_id, tipo, codigo, descricao, referencia, valor)
      VALUES (?, ?, ?, 'DESCONTO', '101', 'INSS', ?, ?)
    `).bind(eventoInssId, id, func.id, (inss / salario * 100).toFixed(2), inss).run();
    descontosFunc += inss;
    
    // IRRF (tabela simplificada 2024)
    const baseIrrf = salario - inss;
    let irrf = 0;
    if (baseIrrf > 4664.68) {
      irrf = baseIrrf * 0.275 - 896.00;
    } else if (baseIrrf > 3751.05) {
      irrf = baseIrrf * 0.225 - 662.77;
    } else if (baseIrrf > 2826.65) {
      irrf = baseIrrf * 0.15 - 381.44;
    } else if (baseIrrf > 2259.20) {
      irrf = baseIrrf * 0.075 - 169.44;
    }
    
    if (irrf > 0) {
      const eventoIrrfId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO folha_eventos (id, folha_id, funcionario_id, tipo, codigo, descricao, referencia, valor)
        VALUES (?, ?, ?, 'DESCONTO', '102', 'IRRF', ?, ?)
      `).bind(eventoIrrfId, id, func.id, (irrf / salario * 100).toFixed(2), irrf).run();
      descontosFunc += irrf;
    }
    
    totalBruto += brutoFunc;
    totalDescontos += descontosFunc;
    totalLiquido += (brutoFunc - descontosFunc);
  }
  
  // Atualizar totais da folha
  await c.env.DB.prepare(`
    UPDATE folha_pagamento SET total_bruto = ?, total_descontos = ?, total_liquido = ?,
                               status = 'CALCULADA', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(totalBruto, totalDescontos, totalLiquido, id).run();
  
  return c.json({
    message: 'Folha calculada com sucesso',
    resumo: {
      funcionarios: funcionarios.results.length,
      total_bruto: totalBruto,
      total_descontos: totalDescontos,
      total_liquido: totalLiquido
    }
  });
});

// POST /api/folha-pagamento/:id/eventos - Adicionar evento manual
folhaPagamento.post('/:id/eventos', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const schema = z.object({
    funcionario_id: z.string().uuid(),
    tipo: z.enum(['PROVENTO', 'DESCONTO']),
    codigo: z.string().min(1).max(10),
    descricao: z.string().min(1).max(100),
    referencia: z.number().optional(),
    valor: z.number().min(0)
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const folha = await c.env.DB.prepare(`
    SELECT status FROM folha_pagamento WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!folha) {
    return c.json({ error: 'Folha não encontrada' }, 404);
  }
  
  if (folha.status === 'FECHADA') {
    return c.json({ error: 'Folha já está fechada' }, 400);
  }
  
  const eventoId = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO folha_eventos (id, folha_id, funcionario_id, tipo, codigo, descricao, referencia, valor, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(eventoId, id, data.funcionario_id, data.tipo, data.codigo, data.descricao,
          data.referencia || null, data.valor, usuarioId).run();
  
  // Recalcular totais
  const totais = await c.env.DB.prepare(`
    SELECT 
      SUM(CASE WHEN tipo = 'PROVENTO' THEN valor ELSE 0 END) as total_bruto,
      SUM(CASE WHEN tipo = 'DESCONTO' THEN valor ELSE 0 END) as total_descontos
    FROM folha_eventos WHERE folha_id = ?
  `).bind(id).first();
  
  await c.env.DB.prepare(`
    UPDATE folha_pagamento SET total_bruto = ?, total_descontos = ?, 
                               total_liquido = ? - ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(totais?.total_bruto || 0, totais?.total_descontos || 0,
          totais?.total_bruto || 0, totais?.total_descontos || 0, id).run();
  
  return c.json({ id: eventoId, message: 'Evento adicionado' }, 201);
});

// DELETE /api/folha-pagamento/:id/eventos/:eventoId - Remover evento
folhaPagamento.delete('/:id/eventos/:eventoId', async (c) => {
  const empresaId = c.get('empresaId');
  const { id, eventoId } = c.req.param();
  
  const folha = await c.env.DB.prepare(`
    SELECT status FROM folha_pagamento WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!folha || folha.status === 'FECHADA') {
    return c.json({ error: 'Folha não encontrada ou já fechada' }, 400);
  }
  
  await c.env.DB.prepare(`DELETE FROM folha_eventos WHERE id = ? AND folha_id = ?`).bind(eventoId, id).run();
  
  // Recalcular totais
  const totais = await c.env.DB.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN tipo = 'PROVENTO' THEN valor ELSE 0 END), 0) as total_bruto,
      COALESCE(SUM(CASE WHEN tipo = 'DESCONTO' THEN valor ELSE 0 END), 0) as total_descontos
    FROM folha_eventos WHERE folha_id = ?
  `).bind(id).first();
  
  const totalBruto = (totais?.total_bruto as number) || 0;
  const totalDescontos = (totais?.total_descontos as number) || 0;
  
  await c.env.DB.prepare(`
    UPDATE folha_pagamento SET total_bruto = ?, total_descontos = ?, 
                               total_liquido = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(totalBruto, totalDescontos, totalBruto - totalDescontos, id).run();
  
  return c.json({ message: 'Evento removido' });
});

// POST /api/folha-pagamento/:id/fechar - Fechar folha
folhaPagamento.post('/:id/fechar', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  
  const folha = await c.env.DB.prepare(`
    SELECT status FROM folha_pagamento WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!folha) {
    return c.json({ error: 'Folha não encontrada' }, 404);
  }
  
  if (folha.status === 'FECHADA') {
    return c.json({ error: 'Folha já está fechada' }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE folha_pagamento SET status = 'FECHADA', data_fechamento = CURRENT_TIMESTAMP,
                               fechado_por = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(usuarioId, id).run();
  
  return c.json({ message: 'Folha fechada com sucesso' });
});

// POST /api/folha-pagamento/:id/reabrir - Reabrir folha
folhaPagamento.post('/:id/reabrir', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const { id } = c.req.param();
  
  await c.env.DB.prepare(`
    UPDATE folha_pagamento SET status = 'CALCULADA', data_fechamento = NULL,
                               fechado_por = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).run();
  
  return c.json({ message: 'Folha reaberta' });
});

// GET /api/folha-pagamento/:id/holerite/:funcionarioId - Gerar holerite
folhaPagamento.get('/:id/holerite/:funcionarioId', async (c) => {
  const empresaId = c.get('empresaId');
  const { id, funcionarioId } = c.req.param();
  
  const folha = await c.env.DB.prepare(`
    SELECT * FROM folha_pagamento WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!folha) {
    return c.json({ error: 'Folha não encontrada' }, 404);
  }
  
  const funcionario = await c.env.DB.prepare(`
    SELECT f.*, c.nome as cargo_nome, d.nome as departamento_nome
    FROM funcionarios f
    LEFT JOIN cargos c ON f.cargo_id = c.id
    LEFT JOIN departamentos d ON f.departamento_id = d.id
    WHERE f.id = ? AND f.empresa_id = ?
  `).bind(funcionarioId, empresaId).first();
  
  if (!funcionario) {
    return c.json({ error: 'Funcionário não encontrado' }, 404);
  }
  
  const eventos = await c.env.DB.prepare(`
    SELECT * FROM folha_eventos WHERE folha_id = ? AND funcionario_id = ?
    ORDER BY tipo, codigo
  `).bind(id, funcionarioId).all();
  
  const proventos = (eventos.results as any[]).filter(e => e.tipo === 'PROVENTO');
  const descontos = (eventos.results as any[]).filter(e => e.tipo === 'DESCONTO');
  const totalProventos = proventos.reduce((sum, e) => sum + e.valor, 0);
  const totalDescontos = descontos.reduce((sum, e) => sum + e.valor, 0);
  
  return c.json({
    success: true,
    data: {
      folha: {
        ano: folha.ano,
        mes: folha.mes,
        tipo: folha.tipo
      },
      funcionario: {
        nome: funcionario.nome,
        matricula: funcionario.matricula,
        cpf: funcionario.cpf,
        cargo: funcionario.cargo_nome,
        departamento: funcionario.departamento_nome,
        data_admissao: funcionario.data_admissao
      },
      proventos,
      descontos,
      resumo: {
        total_proventos: totalProventos,
        total_descontos: totalDescontos,
        liquido: totalProventos - totalDescontos
      }
    }
  });
});

export default folhaPagamento;
