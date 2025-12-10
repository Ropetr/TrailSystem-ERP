// ============================================
// PLANAC ERP - Rotas de Auditoria
// Bloco 3 - Rastro de Alterações
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const auditoria = new Hono<{ Bindings: Env }>();

// ============================================
// LOGS DE AUDITORIA
// ============================================

// GET /api/auditoria - Listar logs de auditoria
auditoria.get('/', async (c) => {
  const empresaId = c.get('empresaId');
  const { 
    entidade_tipo, entidade_id, acao, usuario_id,
    data_inicio, data_fim, page = '1', limit = '50' 
  } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT a.*, u.nome as usuario_nome, u.email as usuario_email
               FROM auditoria_logs a
               LEFT JOIN usuarios u ON a.usuario_id = u.id
               WHERE a.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (entidade_tipo) {
    query += ` AND a.entidade_tipo = ?`;
    params.push(entidade_tipo);
  }
  
  if (entidade_id) {
    query += ` AND a.entidade_id = ?`;
    params.push(entidade_id);
  }
  
  if (acao) {
    query += ` AND a.acao = ?`;
    params.push(acao);
  }
  
  if (usuario_id) {
    query += ` AND a.usuario_id = ?`;
    params.push(usuario_id);
  }
  
  if (data_inicio) {
    query += ` AND a.created_at >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    query += ` AND a.created_at <= ?`;
    params.push(data_fim + ' 23:59:59');
  }
  
  // Contagem total
  const countQuery = query.replace(/SELECT a\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
  
  query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: result.results,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: countResult?.total || 0,
      pages: Math.ceil((countResult?.total as number || 0) / parseInt(limit))
    }
  });
});

// GET /api/auditoria/:id - Detalhes de um log
auditoria.get('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const log = await c.env.DB.prepare(`
    SELECT a.*, u.nome as usuario_nome, u.email as usuario_email
    FROM auditoria_logs a
    LEFT JOIN usuarios u ON a.usuario_id = u.id
    WHERE a.id = ? AND a.empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!log) {
    return c.json({ error: 'Log não encontrado' }, 404);
  }
  
  // Parse dos dados JSON
  const dados_anteriores = log.dados_anteriores ? JSON.parse(log.dados_anteriores as string) : null;
  const dados_novos = log.dados_novos ? JSON.parse(log.dados_novos as string) : null;
  
  return c.json({ 
    success: true, 
    data: { ...log, dados_anteriores, dados_novos } 
  });
});

// GET /api/auditoria/entidade/:tipo/:id - Histórico de uma entidade
auditoria.get('/entidade/:tipo/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { tipo, id } = c.req.param();
  
  const result = await c.env.DB.prepare(`
    SELECT a.*, u.nome as usuario_nome
    FROM auditoria_logs a
    LEFT JOIN usuarios u ON a.usuario_id = u.id
    WHERE a.empresa_id = ? AND a.entidade_tipo = ? AND a.entidade_id = ?
    ORDER BY a.created_at DESC
  `).bind(empresaId, tipo, id).all();
  
  return c.json({ success: true, data: result.results });
});

// POST /api/auditoria - Registrar log (interno)
auditoria.post('/', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    entidade_tipo: z.string().max(50),
    entidade_id: z.string().uuid(),
    acao: z.enum(['CRIAR', 'ATUALIZAR', 'EXCLUIR', 'VISUALIZAR', 'EXPORTAR', 'IMPRIMIR', 'LOGIN', 'LOGOUT']),
    descricao: z.string().optional(),
    dados_anteriores: z.any().optional(),
    dados_novos: z.any().optional(),
    ip: z.string().optional(),
    user_agent: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO auditoria_logs (id, empresa_id, usuario_id, entidade_tipo, entidade_id, acao,
                                descricao, dados_anteriores, dados_novos, ip, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, empresaId, usuarioId, data.entidade_tipo, data.entidade_id, data.acao,
          data.descricao || null,
          data.dados_anteriores ? JSON.stringify(data.dados_anteriores) : null,
          data.dados_novos ? JSON.stringify(data.dados_novos) : null,
          data.ip || c.req.header('CF-Connecting-IP') || null,
          data.user_agent || c.req.header('User-Agent') || null).run();
  
  return c.json({ id, message: 'Log registrado' }, 201);
});

// ============================================
// LOGS DE ACESSO
// ============================================

// GET /api/auditoria/acessos - Listar logs de acesso
auditoria.get('/acessos', async (c) => {
  const empresaId = c.get('empresaId');
  const { usuario_id, tipo, sucesso, data_inicio, data_fim, page = '1', limit = '50' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT la.*, u.nome as usuario_nome, u.email as usuario_email
               FROM logs_acesso la
               LEFT JOIN usuarios u ON la.usuario_id = u.id
               WHERE la.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (usuario_id) {
    query += ` AND la.usuario_id = ?`;
    params.push(usuario_id);
  }
  
  if (tipo) {
    query += ` AND la.tipo = ?`;
    params.push(tipo);
  }
  
  if (sucesso !== undefined) {
    query += ` AND la.sucesso = ?`;
    params.push(sucesso === 'true' ? 1 : 0);
  }
  
  if (data_inicio) {
    query += ` AND la.created_at >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    query += ` AND la.created_at <= ?`;
    params.push(data_fim + ' 23:59:59');
  }
  
  query += ` ORDER BY la.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// POST /api/auditoria/acessos - Registrar acesso
auditoria.post('/acessos', async (c) => {
  const body = await c.req.json();
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO logs_acesso (id, empresa_id, usuario_id, tipo, sucesso, ip, user_agent, motivo_falha)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, body.empresa_id || null, body.usuario_id || null, body.tipo || 'LOGIN',
          body.sucesso ? 1 : 0,
          body.ip || c.req.header('CF-Connecting-IP') || null,
          body.user_agent || c.req.header('User-Agent') || null,
          body.motivo_falha || null).run();
  
  return c.json({ id }, 201);
});

// ============================================
// RELATÓRIOS DE AUDITORIA
// ============================================

// GET /api/auditoria/relatorios/atividades - Relatório de atividades
auditoria.get('/relatorios/atividades', async (c) => {
  const empresaId = c.get('empresaId');
  const { data_inicio, data_fim, agrupar = 'dia' } = c.req.query();
  
  let groupBy = "strftime('%Y-%m-%d', created_at)";
  if (agrupar === 'mes') groupBy = "strftime('%Y-%m', created_at)";
  if (agrupar === 'hora') groupBy = "strftime('%Y-%m-%d %H:00', created_at)";
  
  let query = `SELECT ${groupBy} as periodo, acao, COUNT(*) as quantidade
               FROM auditoria_logs WHERE empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (data_inicio) {
    query += ` AND created_at >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    query += ` AND created_at <= ?`;
    params.push(data_fim + ' 23:59:59');
  }
  
  query += ` GROUP BY periodo, acao ORDER BY periodo DESC`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// GET /api/auditoria/relatorios/usuarios - Atividades por usuário
auditoria.get('/relatorios/usuarios', async (c) => {
  const empresaId = c.get('empresaId');
  const { data_inicio, data_fim } = c.req.query();
  
  let query = `SELECT u.id, u.nome, u.email,
               COUNT(*) as total_acoes,
               COUNT(CASE WHEN a.acao = 'CRIAR' THEN 1 END) as criados,
               COUNT(CASE WHEN a.acao = 'ATUALIZAR' THEN 1 END) as atualizados,
               COUNT(CASE WHEN a.acao = 'EXCLUIR' THEN 1 END) as excluidos,
               MAX(a.created_at) as ultima_atividade
               FROM auditoria_logs a
               JOIN usuarios u ON a.usuario_id = u.id
               WHERE a.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (data_inicio) {
    query += ` AND a.created_at >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    query += ` AND a.created_at <= ?`;
    params.push(data_fim + ' 23:59:59');
  }
  
  query += ` GROUP BY u.id ORDER BY total_acoes DESC`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// GET /api/auditoria/relatorios/entidades - Entidades mais alteradas
auditoria.get('/relatorios/entidades', async (c) => {
  const empresaId = c.get('empresaId');
  const { data_inicio, data_fim, limit = '20' } = c.req.query();
  
  let query = `SELECT entidade_tipo, COUNT(*) as total_alteracoes,
               COUNT(DISTINCT entidade_id) as entidades_distintas,
               COUNT(DISTINCT usuario_id) as usuarios_distintos
               FROM auditoria_logs WHERE empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (data_inicio) {
    query += ` AND created_at >= ?`;
    params.push(data_inicio);
  }
  
  if (data_fim) {
    query += ` AND created_at <= ?`;
    params.push(data_fim + ' 23:59:59');
  }
  
  query += ` GROUP BY entidade_tipo ORDER BY total_alteracoes DESC LIMIT ?`;
  params.push(parseInt(limit));
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// GET /api/auditoria/relatorios/seguranca - Relatório de segurança
auditoria.get('/relatorios/seguranca', async (c) => {
  const empresaId = c.get('empresaId');
  const { dias = '30' } = c.req.query();
  
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - parseInt(dias));
  
  // Tentativas de login falhas
  const loginsFalhos = await c.env.DB.prepare(`
    SELECT DATE(created_at) as data, COUNT(*) as quantidade, ip
    FROM logs_acesso 
    WHERE empresa_id = ? AND sucesso = 0 AND created_at >= ?
    GROUP BY data, ip
    ORDER BY quantidade DESC
  `).bind(empresaId, dataInicio.toISOString()).all();
  
  // IPs mais ativos
  const ipsMaisAtivos = await c.env.DB.prepare(`
    SELECT ip, COUNT(*) as acessos, 
           COUNT(DISTINCT usuario_id) as usuarios_distintos,
           MIN(created_at) as primeiro_acesso,
           MAX(created_at) as ultimo_acesso
    FROM logs_acesso
    WHERE empresa_id = ? AND created_at >= ? AND ip IS NOT NULL
    GROUP BY ip ORDER BY acessos DESC LIMIT 20
  `).bind(empresaId, dataInicio.toISOString()).all();
  
  // Atividades fora do horário (antes 6h ou depois 22h)
  const foraHorario = await c.env.DB.prepare(`
    SELECT u.nome as usuario, COUNT(*) as acoes, 
           MIN(a.created_at) as primeira, MAX(a.created_at) as ultima
    FROM auditoria_logs a
    JOIN usuarios u ON a.usuario_id = u.id
    WHERE a.empresa_id = ? AND a.created_at >= ?
      AND (CAST(strftime('%H', a.created_at) AS INTEGER) < 6 
           OR CAST(strftime('%H', a.created_at) AS INTEGER) > 22)
    GROUP BY u.id
  `).bind(empresaId, dataInicio.toISOString()).all();
  
  // Exclusões em massa (mais de 5 no mesmo dia pelo mesmo usuário)
  const exclusoesMassa = await c.env.DB.prepare(`
    SELECT u.nome as usuario, DATE(a.created_at) as data, a.entidade_tipo, COUNT(*) as quantidade
    FROM auditoria_logs a
    JOIN usuarios u ON a.usuario_id = u.id
    WHERE a.empresa_id = ? AND a.acao = 'EXCLUIR' AND a.created_at >= ?
    GROUP BY u.id, data, a.entidade_tipo
    HAVING quantidade > 5
  `).bind(empresaId, dataInicio.toISOString()).all();
  
  return c.json({
    success: true,
    data: {
      logins_falhos: loginsFalhos.results,
      ips_mais_ativos: ipsMaisAtivos.results,
      atividades_fora_horario: foraHorario.results,
      exclusoes_em_massa: exclusoesMassa.results
    }
  });
});

// ============================================
// LGPD
// ============================================

// GET /api/auditoria/lgpd/dados-pessoais/:usuarioId - Dados pessoais do usuário
auditoria.get('/lgpd/dados-pessoais/:usuarioId', async (c) => {
  const empresaId = c.get('empresaId');
  const { usuarioId } = c.req.param();
  
  // Dados do usuário
  const usuario = await c.env.DB.prepare(`
    SELECT id, nome, email, telefone, created_at FROM usuarios WHERE id = ? AND empresa_id = ?
  `).bind(usuarioId, empresaId).first();
  
  // Logs de atividade
  const logs = await c.env.DB.prepare(`
    SELECT entidade_tipo, acao, created_at FROM auditoria_logs
    WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 100
  `).bind(usuarioId).all();
  
  // Acessos
  const acessos = await c.env.DB.prepare(`
    SELECT tipo, ip, created_at FROM logs_acesso
    WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 50
  `).bind(usuarioId).all();
  
  return c.json({
    success: true,
    data: {
      dados_cadastrais: usuario,
      historico_atividades: logs.results,
      historico_acessos: acessos.results,
      data_exportacao: new Date().toISOString()
    }
  });
});

// DELETE /api/auditoria/lgpd/anonimizar/:usuarioId - Anonimizar dados
auditoria.delete('/lgpd/anonimizar/:usuarioId', async (c) => {
  const empresaId = c.get('empresaId');
  const { usuarioId } = c.req.param();
  
  // Anonimizar dados do usuário
  await c.env.DB.prepare(`
    UPDATE usuarios SET 
      nome = 'Usuário Removido',
      email = ?,
      telefone = NULL,
      ativo = 0,
      anonimizado = 1,
      data_anonimizacao = CURRENT_TIMESTAMP
    WHERE id = ? AND empresa_id = ?
  `).bind(`anonimo_${usuarioId.substring(0,8)}@removed.com`, usuarioId, empresaId).run();
  
  // Anonimizar logs (mantém para auditoria mas sem identificação)
  await c.env.DB.prepare(`
    UPDATE auditoria_logs SET usuario_id = NULL, ip = NULL, user_agent = NULL
    WHERE usuario_id = ?
  `).bind(usuarioId).run();
  
  // Registrar ação
  await c.env.DB.prepare(`
    INSERT INTO auditoria_logs (id, empresa_id, entidade_tipo, entidade_id, acao, descricao)
    VALUES (?, ?, 'USUARIO', ?, 'ANONIMIZAR', 'Dados anonimizados por solicitação LGPD')
  `).bind(crypto.randomUUID(), empresaId, usuarioId).run();
  
  return c.json({ message: 'Dados anonimizados conforme LGPD' });
});

export default auditoria;
