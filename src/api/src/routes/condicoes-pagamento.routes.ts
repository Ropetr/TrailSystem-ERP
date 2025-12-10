// ============================================
// PLANAC ERP - Rotas de Condições de Pagamento
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const condicoesPagamento = new Hono<{ Bindings: Bindings; Variables: Variables }>();

condicoesPagamento.use('/*', requireAuth());

// Schemas
const condicaoSchema = z.object({
  nome: z.string().min(3),
  descricao: z.string().optional(),
  tipo: z.enum(['vista', 'prazo', 'entrada']).default('prazo'),
  parcelas: z.number().int().min(1).max(48).default(1),
  dias_primeira_parcela: z.number().int().min(0).default(30),
  intervalo_dias: z.number().int().min(0).default(30),
  taxa_juros: z.number().min(0).max(100).default(0),
  taxa_desconto: z.number().min(0).max(100).default(0),
  forma_pagamento_padrao: z.string().optional(),
  ativo: z.boolean().default(true)
});

// GET /condicoes-pagamento - Listar condições
condicoesPagamento.get('/', requirePermission('financeiro', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { ativo, tipo } = c.req.query();

  let query = `SELECT * FROM condicoes_pagamento WHERE empresa_id = ?`;
  const params: any[] = [usuario.empresa_id];

  if (ativo !== undefined) {
    query += ` AND ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }

  if (tipo) {
    query += ` AND tipo = ?`;
    params.push(tipo);
  }

  query += ` ORDER BY nome`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results
  });
});

// GET /condicoes-pagamento/:id - Buscar condição
condicoesPagamento.get('/:id', requirePermission('financeiro', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  const condicao = await c.env.DB.prepare(
    `SELECT * FROM condicoes_pagamento WHERE id = ? AND empresa_id = ?`
  ).bind(id, usuario.empresa_id).first();

  if (!condicao) {
    return c.json({ success: false, error: 'Condição de pagamento não encontrada' }, 404);
  }

  return c.json({ success: true, data: condicao });
});

// POST /condicoes-pagamento - Criar condição
condicoesPagamento.post('/', requirePermission('financeiro', 'criar'), async (c) => {
  const usuario = c.get('usuario');

  try {
    const body = await c.req.json();
    const dados = condicaoSchema.parse(body);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO condicoes_pagamento (
        id, empresa_id, nome, descricao, tipo, parcelas,
        dias_primeira_parcela, intervalo_dias, taxa_juros, taxa_desconto,
        forma_pagamento_padrao, ativo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, usuario.empresa_id, dados.nome, dados.descricao || null, dados.tipo, dados.parcelas,
      dados.dias_primeira_parcela, dados.intervalo_dias, dados.taxa_juros, dados.taxa_desconto,
      dados.forma_pagamento_padrao || null, dados.ativo ? 1 : 0, now, now
    ).run();

    await registrarAuditoria(c.env.DB, {
      usuario_id: usuario.id,
      empresa_id: usuario.empresa_id,
      acao: 'criar',
      entidade: 'condicoes_pagamento',
      entidade_id: id,
      dados_novos: dados
    });

    return c.json({ success: true, data: { id } }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: 'Dados inválidos', details: error.errors }, 400);
    }
    throw error;
  }
});

// PUT /condicoes-pagamento/:id - Atualizar condição
condicoesPagamento.put('/:id', requirePermission('financeiro', 'editar'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  try {
    const body = await c.req.json();
    const dados = condicaoSchema.partial().parse(body);

    const condicaoAtual = await c.env.DB.prepare(
      `SELECT * FROM condicoes_pagamento WHERE id = ? AND empresa_id = ?`
    ).bind(id, usuario.empresa_id).first();

    if (!condicaoAtual) {
      return c.json({ success: false, error: 'Condição não encontrada' }, 404);
    }

    const campos: string[] = [];
    const valores: any[] = [];

    Object.entries(dados).forEach(([key, value]) => {
      if (value !== undefined) {
        campos.push(`${key} = ?`);
        valores.push(key === 'ativo' ? (value ? 1 : 0) : value);
      }
    });

    if (campos.length > 0) {
      campos.push('updated_at = ?');
      valores.push(new Date().toISOString());
      valores.push(id, usuario.empresa_id);

      await c.env.DB.prepare(
        `UPDATE condicoes_pagamento SET ${campos.join(', ')} WHERE id = ? AND empresa_id = ?`
      ).bind(...valores).run();

      await registrarAuditoria(c.env.DB, {
        usuario_id: usuario.id,
        empresa_id: usuario.empresa_id,
        acao: 'editar',
        entidade: 'condicoes_pagamento',
        entidade_id: id,
        dados_anteriores: condicaoAtual,
        dados_novos: dados
      });
    }

    return c.json({ success: true, message: 'Condição atualizada' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: 'Dados inválidos', details: error.errors }, 400);
    }
    throw error;
  }
});

// DELETE /condicoes-pagamento/:id - Excluir condição
condicoesPagamento.delete('/:id', requirePermission('financeiro', 'excluir'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  const condicao = await c.env.DB.prepare(
    `SELECT * FROM condicoes_pagamento WHERE id = ? AND empresa_id = ?`
  ).bind(id, usuario.empresa_id).first();

  if (!condicao) {
    return c.json({ success: false, error: 'Condição não encontrada' }, 404);
  }

  // Verificar uso em clientes
  const emUsoClientes = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM clientes WHERE condicao_pagamento_id = ?`
  ).bind(id).first<{ total: number }>();

  if (emUsoClientes && emUsoClientes.total > 0) {
    return c.json({ 
      success: false, 
      error: `Condição vinculada a ${emUsoClientes.total} cliente(s)` 
    }, 400);
  }

  await c.env.DB.prepare(
    `DELETE FROM condicoes_pagamento WHERE id = ? AND empresa_id = ?`
  ).bind(id, usuario.empresa_id).run();

  await registrarAuditoria(c.env.DB, {
    usuario_id: usuario.id,
    empresa_id: usuario.empresa_id,
    acao: 'excluir',
    entidade: 'condicoes_pagamento',
    entidade_id: id,
    dados_anteriores: condicao
  });

  return c.json({ success: true, message: 'Condição excluída' });
});

// POST /condicoes-pagamento/:id/simular - Simular parcelas
condicoesPagamento.post('/:id/simular', requirePermission('financeiro', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  try {
    const body = await c.req.json();
    const { valor_total, data_base } = body;

    if (!valor_total || valor_total <= 0) {
      return c.json({ success: false, error: 'Valor total é obrigatório e deve ser maior que zero' }, 400);
    }

    const condicao = await c.env.DB.prepare(
      `SELECT * FROM condicoes_pagamento WHERE id = ? AND empresa_id = ?`
    ).bind(id, usuario.empresa_id).first<any>();

    if (!condicao) {
      return c.json({ success: false, error: 'Condição não encontrada' }, 404);
    }

    const dataBase = data_base ? new Date(data_base) : new Date();
    const parcelas: any[] = [];

    // Aplicar desconto ou juros
    let valorFinal = valor_total;
    if (condicao.tipo === 'vista' && condicao.taxa_desconto > 0) {
      valorFinal = valor_total * (1 - condicao.taxa_desconto / 100);
    } else if (condicao.tipo === 'prazo' && condicao.taxa_juros > 0) {
      valorFinal = valor_total * (1 + condicao.taxa_juros / 100);
    }

    const valorParcela = Math.floor((valorFinal / condicao.parcelas) * 100) / 100;
    const resto = Math.round((valorFinal - (valorParcela * condicao.parcelas)) * 100) / 100;

    for (let i = 0; i < condicao.parcelas; i++) {
      const diasVencimento = condicao.dias_primeira_parcela + (i * condicao.intervalo_dias);
      const dataVencimento = new Date(dataBase);
      dataVencimento.setDate(dataVencimento.getDate() + diasVencimento);

      parcelas.push({
        numero: i + 1,
        total_parcelas: condicao.parcelas,
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        dias: diasVencimento,
        valor: i === condicao.parcelas - 1 ? valorParcela + resto : valorParcela,
        forma_pagamento: condicao.forma_pagamento_padrao || 'Boleto'
      });
    }

    return c.json({
      success: true,
      data: {
        condicao: condicao.nome,
        valor_original: valor_total,
        valor_final: valorFinal,
        desconto_aplicado: condicao.taxa_desconto > 0 ? valor_total - valorFinal : 0,
        juros_aplicados: condicao.taxa_juros > 0 ? valorFinal - valor_total : 0,
        parcelas
      }
    });
  } catch (error) {
    return c.json({ success: false, error: 'Erro ao simular parcelas' }, 500);
  }
});

// GET /condicoes-pagamento/aux/formas - Listar formas de pagamento
condicoesPagamento.get('/aux/formas', async (c) => {
  return c.json({
    success: true,
    data: [
      { id: 'boleto', nome: 'Boleto Bancário' },
      { id: 'pix', nome: 'PIX' },
      { id: 'dinheiro', nome: 'Dinheiro' },
      { id: 'cartao_credito', nome: 'Cartão de Crédito' },
      { id: 'cartao_debito', nome: 'Cartão de Débito' },
      { id: 'cheque', nome: 'Cheque' },
      { id: 'transferencia', nome: 'Transferência Bancária' },
      { id: 'credito_cliente', nome: 'Crédito do Cliente' }
    ]
  });
});

export default condicoesPagamento;
