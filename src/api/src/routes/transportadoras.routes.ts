// ============================================
// PLANAC ERP - Rotas de Transportadoras
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const transportadoras = new Hono<{ Bindings: Bindings; Variables: Variables }>();

transportadoras.use('/*', requireAuth());

// Schemas
const transportadoraSchema = z.object({
  razao_social: z.string().min(3),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().min(14),
  inscricao_estadual: z.string().optional(),
  rntrc: z.string().optional(), // Registro Nacional de Transportadores Rodoviários de Cargas
  tipo_frete: z.enum(['CIF', 'FOB', 'AMBOS']).default('AMBOS'),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2).optional(),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().email().optional(),
  contato: z.string().optional(),
  site: z.string().url().optional(),
  prazo_entrega_dias: z.number().int().min(0).default(0),
  valor_minimo_frete: z.number().min(0).default(0),
  percentual_frete: z.number().min(0).max(100).default(0),
  observacao: z.string().optional(),
  ativo: z.boolean().default(true)
});

const regiaoAtendimentoSchema = z.object({
  uf: z.string().length(2),
  cidade: z.string().optional(),
  cep_inicial: z.string().optional(),
  cep_final: z.string().optional(),
  prazo_dias: z.number().int().min(0).default(0),
  valor_adicional: z.number().min(0).default(0)
});

// GET /transportadoras - Listar transportadoras
transportadoras.get('/', requirePermission('logistica', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { ativo, tipo_frete, uf } = c.req.query();

  let query = `SELECT * FROM transportadoras WHERE empresa_id = ?`;
  const params: any[] = [usuario.empresa_id];

  if (ativo !== undefined) {
    query += ` AND ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }

  if (tipo_frete) {
    query += ` AND (tipo_frete = ? OR tipo_frete = 'AMBOS')`;
    params.push(tipo_frete);
  }

  if (uf) {
    query += ` AND id IN (SELECT transportadora_id FROM transportadoras_regioes WHERE uf = ?)`;
    params.push(uf);
  }

  query += ` ORDER BY razao_social`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results
  });
});

// GET /transportadoras/:id - Buscar transportadora
transportadoras.get('/:id', requirePermission('logistica', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  const transportadora = await c.env.DB.prepare(
    `SELECT * FROM transportadoras WHERE id = ? AND empresa_id = ?`
  ).bind(id, usuario.empresa_id).first();

  if (!transportadora) {
    return c.json({ success: false, error: 'Transportadora não encontrada' }, 404);
  }

  // Buscar regiões de atendimento
  const regioes = await c.env.DB.prepare(
    `SELECT * FROM transportadoras_regioes WHERE transportadora_id = ? ORDER BY uf, cidade`
  ).bind(id).all();

  return c.json({
    success: true,
    data: {
      ...transportadora,
      regioes: regioes.results
    }
  });
});

// POST /transportadoras - Criar transportadora
transportadoras.post('/', requirePermission('logistica', 'criar'), async (c) => {
  const usuario = c.get('usuario');

  try {
    const body = await c.req.json();
    const dados = transportadoraSchema.parse(body);

    // Verificar CNPJ duplicado
    const cnpjExiste = await c.env.DB.prepare(
      `SELECT id FROM transportadoras WHERE empresa_id = ? AND cnpj = ?`
    ).bind(usuario.empresa_id, dados.cnpj).first();

    if (cnpjExiste) {
      return c.json({ success: false, error: 'CNPJ já cadastrado' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO transportadoras (
        id, empresa_id, razao_social, nome_fantasia, cnpj, inscricao_estadual, rntrc, tipo_frete,
        cep, logradouro, numero, complemento, bairro, cidade, uf,
        telefone, celular, email, contato, site,
        prazo_entrega_dias, valor_minimo_frete, percentual_frete,
        observacao, ativo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, usuario.empresa_id, dados.razao_social, dados.nome_fantasia || null,
      dados.cnpj, dados.inscricao_estadual || null, dados.rntrc || null, dados.tipo_frete,
      dados.cep || null, dados.logradouro || null, dados.numero || null,
      dados.complemento || null, dados.bairro || null, dados.cidade || null, dados.uf || null,
      dados.telefone || null, dados.celular || null, dados.email || null,
      dados.contato || null, dados.site || null,
      dados.prazo_entrega_dias, dados.valor_minimo_frete, dados.percentual_frete,
      dados.observacao || null, dados.ativo ? 1 : 0, now, now
    ).run();

    await registrarAuditoria(c.env.DB, {
      usuario_id: usuario.id,
      empresa_id: usuario.empresa_id,
      acao: 'criar',
      entidade: 'transportadoras',
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

// PUT /transportadoras/:id - Atualizar transportadora
transportadoras.put('/:id', requirePermission('logistica', 'editar'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  try {
    const body = await c.req.json();
    const dados = transportadoraSchema.partial().parse(body);

    const transportadoraAtual = await c.env.DB.prepare(
      `SELECT * FROM transportadoras WHERE id = ? AND empresa_id = ?`
    ).bind(id, usuario.empresa_id).first();

    if (!transportadoraAtual) {
      return c.json({ success: false, error: 'Transportadora não encontrada' }, 404);
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
        `UPDATE transportadoras SET ${campos.join(', ')} WHERE id = ? AND empresa_id = ?`
      ).bind(...valores).run();

      await registrarAuditoria(c.env.DB, {
        usuario_id: usuario.id,
        empresa_id: usuario.empresa_id,
        acao: 'editar',
        entidade: 'transportadoras',
        entidade_id: id,
        dados_anteriores: transportadoraAtual,
        dados_novos: dados
      });
    }

    return c.json({ success: true, message: 'Transportadora atualizada' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: 'Dados inválidos', details: error.errors }, 400);
    }
    throw error;
  }
});

// DELETE /transportadoras/:id - Excluir transportadora
transportadoras.delete('/:id', requirePermission('logistica', 'excluir'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  const transportadora = await c.env.DB.prepare(
    `SELECT * FROM transportadoras WHERE id = ? AND empresa_id = ?`
  ).bind(id, usuario.empresa_id).first();

  if (!transportadora) {
    return c.json({ success: false, error: 'Transportadora não encontrada' }, 404);
  }

  // Verificar uso em pedidos
  const emUso = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM pedidos_venda WHERE transportadora_id = ?`
  ).bind(id).first<{ total: number }>();

  if (emUso && emUso.total > 0) {
    return c.json({ 
      success: false, 
      error: `Transportadora possui ${emUso.total} pedido(s). Inative-a ao invés de excluir.` 
    }, 400);
  }

  // Excluir regiões e transportadora
  await c.env.DB.prepare(`DELETE FROM transportadoras_regioes WHERE transportadora_id = ?`).bind(id).run();
  await c.env.DB.prepare(`DELETE FROM transportadoras WHERE id = ?`).bind(id).run();

  await registrarAuditoria(c.env.DB, {
    usuario_id: usuario.id,
    empresa_id: usuario.empresa_id,
    acao: 'excluir',
    entidade: 'transportadoras',
    entidade_id: id,
    dados_anteriores: transportadora
  });

  return c.json({ success: true, message: 'Transportadora excluída' });
});

// POST /transportadoras/:id/regioes - Adicionar região de atendimento
transportadoras.post('/:id/regioes', requirePermission('logistica', 'editar'), async (c) => {
  const usuario = c.get('usuario');
  const transportadoraId = c.req.param('id');

  try {
    const body = await c.req.json();
    const dados = regiaoAtendimentoSchema.parse(body);

    // Verificar transportadora
    const transportadora = await c.env.DB.prepare(
      `SELECT id FROM transportadoras WHERE id = ? AND empresa_id = ?`
    ).bind(transportadoraId, usuario.empresa_id).first();

    if (!transportadora) {
      return c.json({ success: false, error: 'Transportadora não encontrada' }, 404);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO transportadoras_regioes (
        id, transportadora_id, uf, cidade, cep_inicial, cep_final,
        prazo_dias, valor_adicional, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, transportadoraId, dados.uf, dados.cidade || null,
      dados.cep_inicial || null, dados.cep_final || null,
      dados.prazo_dias, dados.valor_adicional, now
    ).run();

    return c.json({ success: true, data: { id } }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: 'Dados inválidos', details: error.errors }, 400);
    }
    throw error;
  }
});

// DELETE /transportadoras/:id/regioes/:regiaoId - Remover região
transportadoras.delete('/:id/regioes/:regiaoId', requirePermission('logistica', 'editar'), async (c) => {
  const usuario = c.get('usuario');
  const transportadoraId = c.req.param('id');
  const regiaoId = c.req.param('regiaoId');

  // Verificar transportadora
  const transportadora = await c.env.DB.prepare(
    `SELECT id FROM transportadoras WHERE id = ? AND empresa_id = ?`
  ).bind(transportadoraId, usuario.empresa_id).first();

  if (!transportadora) {
    return c.json({ success: false, error: 'Transportadora não encontrada' }, 404);
  }

  await c.env.DB.prepare(
    `DELETE FROM transportadoras_regioes WHERE id = ? AND transportadora_id = ?`
  ).bind(regiaoId, transportadoraId).run();

  return c.json({ success: true, message: 'Região removida' });
});

// POST /transportadoras/calcular-frete - Calcular frete
transportadoras.post('/calcular-frete', requirePermission('logistica', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');

  try {
    const body = await c.req.json();
    const { cep_destino, uf_destino, valor_mercadoria, peso_kg, transportadora_id } = body;

    if (!uf_destino && !cep_destino) {
      return c.json({ success: false, error: 'Informe UF ou CEP de destino' }, 400);
    }

    let query = `
      SELECT t.*, 
        tr.prazo_dias as prazo_regiao,
        tr.valor_adicional
      FROM transportadoras t
      LEFT JOIN transportadoras_regioes tr ON tr.transportadora_id = t.id
      WHERE t.empresa_id = ? AND t.ativo = 1
    `;
    const params: any[] = [usuario.empresa_id];

    if (transportadora_id) {
      query += ` AND t.id = ?`;
      params.push(transportadora_id);
    }

    if (uf_destino) {
      query += ` AND (tr.uf = ? OR tr.uf IS NULL)`;
      params.push(uf_destino);
    }

    query += ` GROUP BY t.id ORDER BY t.razao_social`;

    const result = await c.env.DB.prepare(query).bind(...params).all();

    const cotacoes = result.results?.map((t: any) => {
      let valorFrete = t.valor_minimo_frete;
      
      if (valor_mercadoria && t.percentual_frete > 0) {
        const fretePercentual = valor_mercadoria * (t.percentual_frete / 100);
        valorFrete = Math.max(valorFrete, fretePercentual);
      }

      valorFrete += t.valor_adicional || 0;

      const prazo = (t.prazo_regiao || 0) + t.prazo_entrega_dias;

      return {
        transportadora_id: t.id,
        transportadora_nome: t.razao_social,
        tipo_frete: t.tipo_frete,
        valor_frete: Math.round(valorFrete * 100) / 100,
        prazo_entrega_dias: prazo,
        data_prevista: calcularDataEntrega(prazo)
      };
    }) || [];

    return c.json({
      success: true,
      data: cotacoes.sort((a: any, b: any) => a.valor_frete - b.valor_frete)
    });
  } catch (error) {
    return c.json({ success: false, error: 'Erro ao calcular frete' }, 500);
  }
});

// Função auxiliar
function calcularDataEntrega(dias: number): string {
  const data = new Date();
  let diasUteis = 0;
  
  while (diasUteis < dias) {
    data.setDate(data.getDate() + 1);
    const diaSemana = data.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasUteis++;
    }
  }
  
  return data.toISOString().split('T')[0];
}

export default transportadoras;
