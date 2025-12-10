// ============================================
// PLANAC ERP - Rotas de Entregas
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

const entregas = new Hono<{ Bindings: Bindings; Variables: Variables }>();

entregas.use('/*', requireAuth());

// Schemas
const entregaSchema = z.object({
  pedido_id: z.string().uuid(),
  filial_id: z.string().uuid(),
  transportadora_id: z.string().uuid().optional(),
  motorista_id: z.string().uuid().optional(),
  veiculo_id: z.string().uuid().optional(),
  rota_id: z.string().uuid().optional(),
  tipo: z.enum(['ENTREGA', 'RETIRADA', 'TRANSFERENCIA']).default('ENTREGA'),
  data_prevista: z.string(),
  hora_prevista_inicio: z.string().optional(),
  hora_prevista_fim: z.string().optional(),
  endereco_cep: z.string().optional(),
  endereco_logradouro: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_uf: z.string().optional(),
  peso_total: z.number().min(0).default(0),
  volume_total: z.number().min(0).default(0),
  valor_frete: z.number().min(0).default(0),
  observacao: z.string().optional(),
  itens: z.array(z.object({
    pedido_item_id: z.string().uuid(),
    produto_id: z.string().uuid(),
    quantidade: z.number().min(0.001)
  })).optional()
});

// GET /entregas - Listar
entregas.get('/', requirePermission('entregas', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { page = '1', limit = '20', status, data_inicio, data_fim, motorista_id, transportadora_id, filial_id } = c.req.query();

  let query = `
    SELECT e.*, 
           p.numero as pedido_numero,
           c.razao_social as cliente_nome,
           t.razao_social as transportadora_nome,
           m.nome as motorista_nome,
           v.placa as veiculo_placa,
           f.nome as filial_nome
    FROM entregas e
    JOIN pedidos p ON e.pedido_id = p.id
    JOIN clientes c ON p.cliente_id = c.id
    LEFT JOIN transportadoras t ON e.transportadora_id = t.id
    LEFT JOIN motoristas m ON e.motorista_id = m.id
    LEFT JOIN veiculos v ON e.veiculo_id = v.id
    JOIN filiais f ON e.filial_id = f.id
    WHERE e.empresa_id = ?
  `;
  const params: any[] = [usuario.empresa_id];

  if (status) {
    query += ` AND e.status = ?`;
    params.push(status);
  }

  if (data_inicio) {
    query += ` AND e.data_prevista >= ?`;
    params.push(data_inicio);
  }

  if (data_fim) {
    query += ` AND e.data_prevista <= ?`;
    params.push(data_fim);
  }

  if (motorista_id) {
    query += ` AND e.motorista_id = ?`;
    params.push(motorista_id);
  }

  if (transportadora_id) {
    query += ` AND e.transportadora_id = ?`;
    params.push(transportadora_id);
  }

  if (filial_id) {
    query += ` AND e.filial_id = ?`;
    params.push(filial_id);
  }

  // Contagem
  const countQuery = query.replace(/SELECT e\.\*, [\s\S]*? FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();

  // Paginação
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  query += ` ORDER BY e.data_prevista DESC, e.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limitNum, (pageNum - 1) * limitNum);

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: countResult?.total || 0,
      pages: Math.ceil((countResult?.total || 0) / limitNum)
    }
  });
});

// GET /entregas/hoje - Entregas do dia
entregas.get('/hoje', requirePermission('entregas', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { filial_id, motorista_id } = c.req.query();

  let query = `
    SELECT e.*, 
           p.numero as pedido_numero,
           c.razao_social as cliente_nome, c.telefone as cliente_telefone, c.celular as cliente_celular,
           m.nome as motorista_nome
    FROM entregas e
    JOIN pedidos p ON e.pedido_id = p.id
    JOIN clientes c ON p.cliente_id = c.id
    LEFT JOIN motoristas m ON e.motorista_id = m.id
    WHERE e.empresa_id = ? AND e.data_prevista = date('now')
  `;
  const params: any[] = [usuario.empresa_id];

  if (filial_id) {
    query += ` AND e.filial_id = ?`;
    params.push(filial_id);
  }

  if (motorista_id) {
    query += ` AND e.motorista_id = ?`;
    params.push(motorista_id);
  }

  query += ` ORDER BY e.ordem_rota, e.hora_prevista_inicio`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  // Resumo
  const resumo = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'PENDENTE' THEN 1 ELSE 0 END) as pendentes,
      SUM(CASE WHEN status = 'EM_TRANSITO' THEN 1 ELSE 0 END) as em_transito,
      SUM(CASE WHEN status = 'ENTREGUE' THEN 1 ELSE 0 END) as entregues,
      SUM(CASE WHEN status = 'CANCELADA' THEN 1 ELSE 0 END) as canceladas
    FROM entregas WHERE empresa_id = ? AND data_prevista = date('now')
  `).bind(usuario.empresa_id).first();

  return c.json({
    success: true,
    data: result.results,
    resumo
  });
});

// GET /entregas/:id - Buscar
entregas.get('/:id', requirePermission('entregas', 'visualizar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');

  const entrega = await c.env.DB.prepare(`
    SELECT e.*, 
           p.numero as pedido_numero, p.valor_total as pedido_valor,
           c.razao_social as cliente_nome, c.cpf_cnpj as cliente_documento,
           c.telefone as cliente_telefone, c.celular as cliente_celular,
           t.razao_social as transportadora_nome,
           m.nome as motorista_nome, m.celular as motorista_celular,
           v.placa as veiculo_placa, v.modelo as veiculo_modelo,
           f.nome as filial_nome
    FROM entregas e
    JOIN pedidos p ON e.pedido_id = p.id
    JOIN clientes c ON p.cliente_id = c.id
    LEFT JOIN transportadoras t ON e.transportadora_id = t.id
    LEFT JOIN motoristas m ON e.motorista_id = m.id
    LEFT JOIN veiculos v ON e.veiculo_id = v.id
    JOIN filiais f ON e.filial_id = f.id
    WHERE e.id = ? AND e.empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!entrega) {
    return c.json({ success: false, error: 'Entrega não encontrada' }, 404);
  }

  // Itens da entrega
  const itens = await c.env.DB.prepare(`
    SELECT ei.*, p.codigo as produto_codigo, p.descricao as produto_descricao, p.unidade
    FROM entregas_itens ei
    JOIN produtos p ON ei.produto_id = p.id
    WHERE ei.entrega_id = ?
  `).bind(id).all();

  // Ocorrências
  const ocorrencias = await c.env.DB.prepare(`
    SELECT * FROM entregas_ocorrencias WHERE entrega_id = ? ORDER BY created_at DESC
  `).bind(id).all();

  // Tentativas
  const tentativas = await c.env.DB.prepare(`
    SELECT * FROM entregas_tentativas WHERE entrega_id = ? ORDER BY data_tentativa DESC
  `).bind(id).all();

  // Rastreamento
  const rastreamento = await c.env.DB.prepare(`
    SELECT * FROM entregas_rastreamento WHERE entrega_id = ? ORDER BY data_hora DESC LIMIT 20
  `).bind(id).all();

  return c.json({
    success: true,
    data: {
      ...entrega,
      itens: itens.results,
      ocorrencias: ocorrencias.results,
      tentativas: tentativas.results,
      rastreamento: rastreamento.results
    }
  });
});

// POST /entregas - Criar
entregas.post('/', requirePermission('entregas', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const validation = entregaSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;
  const id = crypto.randomUUID();

  // Gerar número da entrega
  const ultimaEntrega = await c.env.DB.prepare(`
    SELECT numero FROM entregas WHERE empresa_id = ? ORDER BY numero DESC LIMIT 1
  `).bind(usuario.empresa_id).first<{ numero: string }>();
  
  const num = ultimaEntrega?.numero ? parseInt(ultimaEntrega.numero) + 1 : 1;
  const numero = num.toString().padStart(6, '0');

  // Buscar endereço do pedido se não informado
  let endereco = {
    cep: data.endereco_cep,
    logradouro: data.endereco_logradouro,
    numero: data.endereco_numero,
    complemento: data.endereco_complemento,
    bairro: data.endereco_bairro,
    cidade: data.endereco_cidade,
    uf: data.endereco_uf
  };

  if (!endereco.logradouro) {
    const pedido = await c.env.DB.prepare(`
      SELECT endereco_cep, endereco_logradouro, endereco_numero, endereco_complemento,
             endereco_bairro, endereco_cidade, endereco_uf
      FROM pedidos WHERE id = ?
    `).bind(data.pedido_id).first<any>();
    
    if (pedido) {
      endereco = {
        cep: pedido.endereco_cep,
        logradouro: pedido.endereco_logradouro,
        numero: pedido.endereco_numero,
        complemento: pedido.endereco_complemento,
        bairro: pedido.endereco_bairro,
        cidade: pedido.endereco_cidade,
        uf: pedido.endereco_uf
      };
    }
  }

  await c.env.DB.prepare(`
    INSERT INTO entregas (
      id, empresa_id, filial_id, pedido_id, numero, transportadora_id, motorista_id,
      veiculo_id, rota_id, tipo, status, data_prevista, hora_prevista_inicio, hora_prevista_fim,
      endereco_cep, endereco_logradouro, endereco_numero, endereco_complemento,
      endereco_bairro, endereco_cidade, endereco_uf,
      peso_total, volume_total, valor_frete, observacao
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, usuario.empresa_id, data.filial_id, data.pedido_id, numero,
    data.transportadora_id || null, data.motorista_id || null, data.veiculo_id || null,
    data.rota_id || null, data.tipo, data.data_prevista,
    data.hora_prevista_inicio || null, data.hora_prevista_fim || null,
    endereco.cep || null, endereco.logradouro || null, endereco.numero || null,
    endereco.complemento || null, endereco.bairro || null, endereco.cidade || null,
    endereco.uf || null, data.peso_total, data.volume_total, data.valor_frete,
    data.observacao || null
  ).run();

  // Inserir itens
  if (data.itens && data.itens.length > 0) {
    for (const item of data.itens) {
      const itemId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO entregas_itens (id, entrega_id, pedido_item_id, produto_id, quantidade)
        VALUES (?, ?, ?, ?, ?)
      `).bind(itemId, id, item.pedido_item_id, item.produto_id, item.quantidade).run();
    }
  }

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CRIAR',
    entidade: 'entregas',
    entidade_id: id,
    dados_novos: { ...data, numero }
  });

  return c.json({ success: true, data: { id, numero } }, 201);
});

// PUT /entregas/:id - Atualizar
entregas.put('/:id', requirePermission('entregas', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const body = await c.req.json();

  const entregaAtual = await c.env.DB.prepare(`
    SELECT * FROM entregas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!entregaAtual) {
    return c.json({ success: false, error: 'Entrega não encontrada' }, 404);
  }

  const validation = entregaSchema.partial().safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, error: 'Dados inválidos', details: validation.error.errors }, 400);
  }

  const data = validation.data;

  await c.env.DB.prepare(`
    UPDATE entregas SET
      transportadora_id = COALESCE(?, transportadora_id),
      motorista_id = COALESCE(?, motorista_id),
      veiculo_id = COALESCE(?, veiculo_id),
      rota_id = COALESCE(?, rota_id),
      data_prevista = COALESCE(?, data_prevista),
      hora_prevista_inicio = COALESCE(?, hora_prevista_inicio),
      hora_prevista_fim = COALESCE(?, hora_prevista_fim),
      peso_total = COALESCE(?, peso_total),
      volume_total = COALESCE(?, volume_total),
      valor_frete = COALESCE(?, valor_frete),
      observacao = COALESCE(?, observacao),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(
    data.transportadora_id, data.motorista_id, data.veiculo_id, data.rota_id,
    data.data_prevista, data.hora_prevista_inicio, data.hora_prevista_fim,
    data.peso_total, data.volume_total, data.valor_frete, data.observacao,
    id, usuario.empresa_id
  ).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'ATUALIZAR',
    entidade: 'entregas',
    entidade_id: id,
    dados_anteriores: entregaAtual,
    dados_novos: data
  });

  return c.json({ success: true, message: 'Entrega atualizada' });
});

// POST /entregas/:id/status - Alterar status
entregas.post('/:id/status', requirePermission('entregas', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const { status, observacao, latitude, longitude, foto_url } = await c.req.json();

  const entrega = await c.env.DB.prepare(`
    SELECT * FROM entregas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!entrega) {
    return c.json({ success: false, error: 'Entrega não encontrada' }, 404);
  }

  // Validar transição de status
  const transicoesValidas: Record<string, string[]> = {
    'PENDENTE': ['EM_SEPARACAO', 'CANCELADA'],
    'EM_SEPARACAO': ['SEPARADA', 'PENDENTE', 'CANCELADA'],
    'SEPARADA': ['EM_TRANSITO', 'EM_SEPARACAO', 'CANCELADA'],
    'EM_TRANSITO': ['ENTREGUE', 'NAO_ENTREGUE', 'CANCELADA'],
    'NAO_ENTREGUE': ['EM_TRANSITO', 'CANCELADA'],
    'ENTREGUE': [],
    'CANCELADA': []
  };

  const statusAtual = (entrega as any).status;
  if (!transicoesValidas[statusAtual]?.includes(status)) {
    return c.json({ success: false, error: `Não é possível mudar de ${statusAtual} para ${status}` }, 400);
  }

  // Atualizar status
  const updates: Record<string, any> = { status };
  if (status === 'EM_TRANSITO') {
    updates.data_saida = 'CURRENT_TIMESTAMP';
  } else if (status === 'ENTREGUE') {
    updates.data_entrega = 'CURRENT_TIMESTAMP';
  }

  await c.env.DB.prepare(`
    UPDATE entregas SET 
      status = ?,
      data_saida = ${status === 'EM_TRANSITO' ? 'CURRENT_TIMESTAMP' : 'data_saida'},
      data_entrega = ${status === 'ENTREGUE' ? 'CURRENT_TIMESTAMP' : 'data_entrega'},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(status, id).run();

  // Registrar rastreamento
  const rastreamentoId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO entregas_rastreamento (id, entrega_id, status, observacao, latitude, longitude, foto_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(rastreamentoId, id, status, observacao || null, latitude || null, longitude || null, foto_url || null).run();

  // Se não entregue, registrar tentativa
  if (status === 'NAO_ENTREGUE') {
    const tentativaId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO entregas_tentativas (id, entrega_id, motivo, observacao, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(tentativaId, id, observacao || 'Não informado', observacao || null, latitude || null, longitude || null).run();
  }

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'ALTERAR_STATUS',
    entidade: 'entregas',
    entidade_id: id,
    dados_anteriores: { status: statusAtual },
    dados_novos: { status, observacao }
  });

  return c.json({ success: true, message: `Status alterado para ${status}` });
});

// POST /entregas/:id/ocorrencia - Registrar ocorrência
entregas.post('/:id/ocorrencia', requirePermission('entregas', 'editar'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const { tipo, descricao, foto_url, latitude, longitude } = await c.req.json();

  const ocorrenciaId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO entregas_ocorrencias (id, entrega_id, tipo, descricao, foto_url, latitude, longitude, usuario_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(ocorrenciaId, id, tipo, descricao, foto_url || null, latitude || null, longitude || null, usuario.id).run();

  return c.json({ success: true, data: { id: ocorrenciaId } }, 201);
});

// POST /entregas/:id/rastreamento - Registrar posição GPS
entregas.post('/:id/rastreamento', requirePermission('entregas', 'editar'), async (c) => {
  const { id } = c.req.param();
  const { latitude, longitude, velocidade, precisao } = await c.req.json();

  const rastreamentoId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO entregas_rastreamento (id, entrega_id, latitude, longitude, velocidade, precisao)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(rastreamentoId, id, latitude, longitude, velocidade || null, precisao || null).run();

  return c.json({ success: true, data: { id: rastreamentoId } }, 201);
});

// DELETE /entregas/:id - Cancelar entrega
entregas.delete('/:id', requirePermission('entregas', 'excluir'), async (c) => {
  const { id } = c.req.param();
  const usuario = c.get('usuario');
  const { motivo } = await c.req.json().catch(() => ({ motivo: null }));

  const entrega = await c.env.DB.prepare(`
    SELECT * FROM entregas WHERE id = ? AND empresa_id = ?
  `).bind(id, usuario.empresa_id).first();

  if (!entrega) {
    return c.json({ success: false, error: 'Entrega não encontrada' }, 404);
  }

  if ((entrega as any).status === 'ENTREGUE') {
    return c.json({ success: false, error: 'Não é possível cancelar entrega já realizada' }, 400);
  }

  await c.env.DB.prepare(`
    UPDATE entregas SET status = 'CANCELADA', observacao = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(motivo || (entrega as any).observacao, id).run();

  await registrarAuditoria(c.env.DB, {
    empresa_id: usuario.empresa_id,
    usuario_id: usuario.id,
    acao: 'CANCELAR',
    entidade: 'entregas',
    entidade_id: id,
    dados_anteriores: entrega,
    dados_novos: { status: 'CANCELADA', motivo }
  });

  return c.json({ success: true, message: 'Entrega cancelada' });
});

export default entregas;
