// =============================================
// TRAILSYSTEM ERP - Rotas de Cobrança (Régua)
// Fluxo de Recebimento Financeiro
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const cobranca = new Hono<{ Bindings: Env }>();

// =============================================
// RÉGUA DE COBRANÇA
// =============================================

// GET /cobranca/reguas - Listar réguas de cobrança
cobranca.get('/reguas', async (c) => {
  const { empresa_id } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: string[] = [];

    if (empresa_id) {
      where += ' AND empresa_id = ?';
      params.push(empresa_id);
    }

    const result = await c.env.DB.prepare(`
      SELECT r.*, 
        (SELECT COUNT(*) FROM regua_cobranca_etapas WHERE regua_id = r.id) as total_etapas
      FROM regua_cobranca r
      ${where}
      ORDER BY r.is_default DESC, r.nome ASC
    `).bind(...params).all();

    return c.json({ success: true, data: result.results });
  } catch (error: unknown) {
    console.error('Erro ao listar réguas:', error);
    return c.json({ success: false, error: 'Erro ao listar réguas de cobrança' }, 500);
  }
});

// GET /cobranca/reguas/:id - Buscar régua com etapas
cobranca.get('/reguas/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const regua = await c.env.DB.prepare(`
      SELECT * FROM regua_cobranca WHERE id = ?
    `).bind(id).first();

    if (!regua) {
      return c.json({ success: false, error: 'Régua não encontrada' }, 404);
    }

    const etapas = await c.env.DB.prepare(`
      SELECT * FROM regua_cobranca_etapas WHERE regua_id = ? ORDER BY ordem ASC
    `).bind(id).all();

    return c.json({
      success: true,
      data: { ...regua, etapas: etapas.results }
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar régua:', error);
    return c.json({ success: false, error: 'Erro ao buscar régua' }, 500);
  }
});

// POST /cobranca/reguas - Criar régua de cobrança
cobranca.post('/reguas', async (c) => {
  try {
    const body = await c.req.json<{
      empresa_id: string;
      nome: string;
      is_default?: boolean;
      etapas?: Array<{
        dias_atraso: number;
        tipo: string;
        enviar_email?: boolean;
        enviar_whatsapp?: boolean;
        enviar_sms?: boolean;
        bloquear_cliente?: boolean;
        negativar_cliente?: boolean;
        assunto_email?: string;
        template_email?: string;
        template_whatsapp?: string;
      }>;
    }>();

    if (!body.empresa_id || !body.nome) {
      return c.json({ success: false, error: 'Empresa e nome são obrigatórios' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Se for default, remover default das outras
    if (body.is_default) {
      await c.env.DB.prepare(`
        UPDATE regua_cobranca SET is_default = 0 WHERE empresa_id = ?
      `).bind(body.empresa_id).run();
    }

    await c.env.DB.prepare(`
      INSERT INTO regua_cobranca (id, empresa_id, nome, ativo, is_default, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?, ?)
    `).bind(id, body.empresa_id, body.nome, body.is_default ? 1 : 0, now, now).run();

    // Criar etapas se fornecidas
    if (body.etapas && body.etapas.length > 0) {
      for (let i = 0; i < body.etapas.length; i++) {
        const etapa = body.etapas[i];
        await c.env.DB.prepare(`
          INSERT INTO regua_cobranca_etapas (
            id, regua_id, dias_atraso, tipo, enviar_email, enviar_whatsapp, enviar_sms,
            bloquear_cliente, negativar_cliente, assunto_email, template_email, template_whatsapp, ordem, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(), id, etapa.dias_atraso, etapa.tipo,
          etapa.enviar_email ? 1 : 0, etapa.enviar_whatsapp ? 1 : 0, etapa.enviar_sms ? 1 : 0,
          etapa.bloquear_cliente ? 1 : 0, etapa.negativar_cliente ? 1 : 0,
          etapa.assunto_email || null, etapa.template_email || null, etapa.template_whatsapp || null,
          i + 1, now
        ).run();
      }
    }

    return c.json({ success: true, data: { id }, message: 'Régua criada com sucesso' }, 201);
  } catch (error: unknown) {
    console.error('Erro ao criar régua:', error);
    return c.json({ success: false, error: 'Erro ao criar régua' }, 500);
  }
});

// =============================================
// TÍTULOS VENCIDOS E COBRANÇA
// =============================================

// GET /cobranca/titulos-vencidos - Listar títulos vencidos para cobrança
cobranca.get('/titulos-vencidos', async (c) => {
  const { empresa_id, dias_atraso_min, dias_atraso_max, cliente_id } = c.req.query();

  try {
    let where = "WHERE cr.status = 'aberto' AND cr.data_vencimento < date('now') AND cr.deleted_at IS NULL";
    const params: string[] = [];

    if (empresa_id) {
      where += ' AND cr.empresa_id = ?';
      params.push(empresa_id);
    }

    if (cliente_id) {
      where += ' AND cr.cliente_id = ?';
      params.push(cliente_id);
    }

    const result = await c.env.DB.prepare(`
      SELECT 
        cr.id,
        cr.empresa_id,
        cr.cliente_id,
        cr.numero_documento,
        cr.valor_original,
        cr.valor_aberto,
        cr.data_vencimento,
        CAST(julianday('now') - julianday(cr.data_vencimento) AS INTEGER) as dias_atraso,
        c.razao_social as cliente_nome,
        c.email as cliente_email,
        c.telefone as cliente_telefone,
        (SELECT MAX(ch.dias_atraso) FROM cobrancas_historico ch WHERE ch.conta_receber_id = cr.id) as ultima_cobranca_dias,
        (SELECT COUNT(*) FROM cobrancas_historico ch WHERE ch.conta_receber_id = cr.id) as total_cobrancas
      FROM contas_receber cr
      JOIN clientes c ON c.id = cr.cliente_id
      ${where}
      ${dias_atraso_min ? `AND CAST(julianday('now') - julianday(cr.data_vencimento) AS INTEGER) >= ${parseInt(dias_atraso_min)}` : ''}
      ${dias_atraso_max ? `AND CAST(julianday('now') - julianday(cr.data_vencimento) AS INTEGER) <= ${parseInt(dias_atraso_max)}` : ''}
      ORDER BY dias_atraso DESC
    `).bind(...params).all();

    return c.json({ success: true, data: result.results });
  } catch (error: unknown) {
    console.error('Erro ao listar títulos vencidos:', error);
    return c.json({ success: false, error: 'Erro ao listar títulos vencidos' }, 500);
  }
});

// GET /cobranca/pendentes - Títulos que precisam de cobrança (próxima etapa da régua)
cobranca.get('/pendentes', async (c) => {
  const { empresa_id } = c.req.query();

  try {
    // Buscar régua padrão
    const regua = await c.env.DB.prepare(`
      SELECT id FROM regua_cobranca WHERE empresa_id = ? AND is_default = 1 AND ativo = 1
    `).bind(empresa_id || '01PLANAC00000000000000000000').first<{ id: string }>();

    if (!regua) {
      return c.json({ success: true, data: [], message: 'Nenhuma régua de cobrança configurada' });
    }

    // Buscar etapas da régua
    const etapas = await c.env.DB.prepare(`
      SELECT * FROM regua_cobranca_etapas WHERE regua_id = ? ORDER BY dias_atraso ASC
    `).bind(regua.id).all<{
      id: string;
      dias_atraso: number;
      tipo: string;
      enviar_email: number;
      enviar_whatsapp: number;
      bloquear_cliente: number;
      negativar_cliente: number;
    }>();

    // Buscar títulos vencidos
    let where = "WHERE cr.status = 'aberto' AND cr.data_vencimento < date('now') AND cr.deleted_at IS NULL";
    const params: string[] = [];

    if (empresa_id) {
      where += ' AND cr.empresa_id = ?';
      params.push(empresa_id);
    }

    const titulos = await c.env.DB.prepare(`
      SELECT 
        cr.id,
        cr.empresa_id,
        cr.cliente_id,
        cr.numero_documento,
        cr.valor_original,
        cr.valor_aberto,
        cr.data_vencimento,
        CAST(julianday('now') - julianday(cr.data_vencimento) AS INTEGER) as dias_atraso,
        c.razao_social as cliente_nome,
        c.email as cliente_email,
        c.telefone as cliente_telefone,
        (SELECT MAX(ch.dias_atraso) FROM cobrancas_historico ch WHERE ch.conta_receber_id = cr.id) as ultima_cobranca_dias
      FROM contas_receber cr
      JOIN clientes c ON c.id = cr.cliente_id
      ${where}
      ORDER BY dias_atraso DESC
    `).bind(...params).all<{
      id: string;
      empresa_id: string;
      cliente_id: string;
      numero_documento: string;
      valor_original: number;
      valor_aberto: number;
      data_vencimento: string;
      dias_atraso: number;
      cliente_nome: string;
      cliente_email: string;
      cliente_telefone: string;
      ultima_cobranca_dias: number | null;
    }>();

    // Identificar próxima etapa para cada título
    const pendentes = titulos.results?.map(titulo => {
      const ultimaCobranca = titulo.ultima_cobranca_dias || 0;
      
      // Encontrar próxima etapa
      const proximaEtapa = etapas.results?.find(e => 
        e.dias_atraso > ultimaCobranca && e.dias_atraso <= titulo.dias_atraso
      );

      if (proximaEtapa) {
        return {
          ...titulo,
          proxima_etapa: proximaEtapa,
          acao_pendente: true
        };
      }
      return null;
    }).filter(Boolean);

    return c.json({ success: true, data: pendentes });
  } catch (error: unknown) {
    console.error('Erro ao buscar cobranças pendentes:', error);
    return c.json({ success: false, error: 'Erro ao buscar cobranças pendentes' }, 500);
  }
});

// POST /cobranca/executar - Executar cobrança para um título
cobranca.post('/executar', async (c) => {
  try {
    const body = await c.req.json<{
      conta_receber_id: string;
      etapa_id?: string;
      tipo?: string;
      enviar_email?: boolean;
      enviar_whatsapp?: boolean;
      bloquear_cliente?: boolean;
      negativar_cliente?: boolean;
      observacao?: string;
      usuario_id?: string;
    }>();

    if (!body.conta_receber_id) {
      return c.json({ success: false, error: 'ID da conta a receber é obrigatório' }, 400);
    }

    // Buscar título
    const titulo = await c.env.DB.prepare(`
      SELECT cr.*, c.razao_social as cliente_nome, c.email as cliente_email,
        CAST(julianday('now') - julianday(cr.data_vencimento) AS INTEGER) as dias_atraso
      FROM contas_receber cr
      JOIN clientes c ON c.id = cr.cliente_id
      WHERE cr.id = ? AND cr.deleted_at IS NULL
    `).bind(body.conta_receber_id).first<{
      id: string;
      empresa_id: string;
      cliente_id: string;
      valor_aberto: number;
      dias_atraso: number;
      cliente_nome: string;
      cliente_email: string;
    }>();

    if (!titulo) {
      return c.json({ success: false, error: 'Título não encontrado' }, 404);
    }

    const now = new Date().toISOString();
    const historicoId = crypto.randomUUID();

    // Registrar histórico de cobrança
    await c.env.DB.prepare(`
      INSERT INTO cobrancas_historico (
        id, empresa_id, conta_receber_id, cliente_id, regua_etapa_id, dias_atraso, tipo,
        email_enviado, whatsapp_enviado, status, usuario_id, observacao, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'enviado', ?, ?, ?)
    `).bind(
      historicoId, titulo.empresa_id, titulo.id, titulo.cliente_id,
      body.etapa_id || null, titulo.dias_atraso, body.tipo || 'manual',
      body.enviar_email ? 1 : 0, body.enviar_whatsapp ? 1 : 0,
      body.usuario_id || null, body.observacao || null, now
    ).run();

    // Bloquear cliente se solicitado
    if (body.bloquear_cliente) {
      const bloqueioId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO clientes_bloqueios (
          id, empresa_id, cliente_id, motivo, descricao, conta_receber_id, cobranca_historico_id,
          status, data_bloqueio, created_at, updated_at
        ) VALUES (?, ?, ?, 'inadimplencia', ?, ?, ?, 'ativo', ?, ?, ?)
      `).bind(
        bloqueioId, titulo.empresa_id, titulo.cliente_id,
        `Bloqueio automático por título vencido há ${titulo.dias_atraso} dias`,
        titulo.id, historicoId, now.split('T')[0], now, now
      ).run();
    }

    // Negativar cliente se solicitado
    if (body.negativar_cliente) {
      const negativacaoId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO clientes_negativacoes (
          id, empresa_id, cliente_id, orgao, valor_negativado, conta_receber_id,
          status, data_negativacao, created_at, updated_at
        ) VALUES (?, ?, ?, 'serasa', ?, ?, 'ativo', ?, ?, ?)
      `).bind(
        negativacaoId, titulo.empresa_id, titulo.cliente_id,
        titulo.valor_aberto, titulo.id, now.split('T')[0], now, now
      ).run();
    }

    return c.json({
      success: true,
      data: { historico_id: historicoId },
      message: 'Cobrança executada com sucesso'
    });
  } catch (error: unknown) {
    console.error('Erro ao executar cobrança:', error);
    return c.json({ success: false, error: 'Erro ao executar cobrança' }, 500);
  }
});

// POST /cobranca/executar-lote - Executar cobrança em lote
cobranca.post('/executar-lote', async (c) => {
  try {
    const body = await c.req.json<{
      empresa_id: string;
      dias_atraso?: number;
      usuario_id?: string;
    }>();

    if (!body.empresa_id) {
      return c.json({ success: false, error: 'Empresa é obrigatória' }, 400);
    }

    // Buscar régua padrão
    const regua = await c.env.DB.prepare(`
      SELECT id FROM regua_cobranca WHERE empresa_id = ? AND is_default = 1 AND ativo = 1
    `).bind(body.empresa_id).first<{ id: string }>();

    if (!regua) {
      return c.json({ success: false, error: 'Nenhuma régua de cobrança configurada' }, 400);
    }

    // Buscar etapas
    const etapas = await c.env.DB.prepare(`
      SELECT * FROM regua_cobranca_etapas WHERE regua_id = ? ORDER BY dias_atraso ASC
    `).bind(regua.id).all<{
      id: string;
      dias_atraso: number;
      tipo: string;
      enviar_email: number;
      enviar_whatsapp: number;
      bloquear_cliente: number;
      negativar_cliente: number;
    }>();

    // Buscar títulos vencidos
    let where = `WHERE cr.status = 'aberto' AND cr.data_vencimento < date('now') AND cr.deleted_at IS NULL AND cr.empresa_id = ?`;
    const params: string[] = [body.empresa_id];

    if (body.dias_atraso) {
      where += ` AND CAST(julianday('now') - julianday(cr.data_vencimento) AS INTEGER) = ?`;
      params.push(body.dias_atraso.toString());
    }

    const titulos = await c.env.DB.prepare(`
      SELECT 
        cr.id,
        cr.empresa_id,
        cr.cliente_id,
        cr.valor_aberto,
        CAST(julianday('now') - julianday(cr.data_vencimento) AS INTEGER) as dias_atraso,
        (SELECT MAX(ch.dias_atraso) FROM cobrancas_historico ch WHERE ch.conta_receber_id = cr.id) as ultima_cobranca_dias
      FROM contas_receber cr
      ${where}
    `).bind(...params).all<{
      id: string;
      empresa_id: string;
      cliente_id: string;
      valor_aberto: number;
      dias_atraso: number;
      ultima_cobranca_dias: number | null;
    }>();

    const now = new Date().toISOString();
    let processados = 0;
    let bloqueados = 0;
    let negativados = 0;

    for (const titulo of titulos.results || []) {
      const ultimaCobranca = titulo.ultima_cobranca_dias || 0;
      
      // Encontrar próxima etapa
      const proximaEtapa = etapas.results?.find(e => 
        e.dias_atraso > ultimaCobranca && e.dias_atraso <= titulo.dias_atraso
      );

      if (proximaEtapa) {
        const historicoId = crypto.randomUUID();

        // Registrar histórico
        await c.env.DB.prepare(`
          INSERT INTO cobrancas_historico (
            id, empresa_id, conta_receber_id, cliente_id, regua_etapa_id, dias_atraso, tipo,
            email_enviado, whatsapp_enviado, status, usuario_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'enviado', ?, ?)
        `).bind(
          historicoId, titulo.empresa_id, titulo.id, titulo.cliente_id,
          proximaEtapa.id, titulo.dias_atraso, proximaEtapa.tipo,
          proximaEtapa.enviar_email, proximaEtapa.enviar_whatsapp,
          body.usuario_id || null, now
        ).run();

        processados++;

        // Bloquear se necessário
        if (proximaEtapa.bloquear_cliente) {
          await c.env.DB.prepare(`
            INSERT OR IGNORE INTO clientes_bloqueios (
              id, empresa_id, cliente_id, motivo, conta_receber_id, cobranca_historico_id,
              status, data_bloqueio, created_at, updated_at
            ) VALUES (?, ?, ?, 'inadimplencia', ?, ?, 'ativo', ?, ?, ?)
          `).bind(
            crypto.randomUUID(), titulo.empresa_id, titulo.cliente_id,
            titulo.id, historicoId, now.split('T')[0], now, now
          ).run();
          bloqueados++;
        }

        // Negativar se necessário
        if (proximaEtapa.negativar_cliente) {
          await c.env.DB.prepare(`
            INSERT OR IGNORE INTO clientes_negativacoes (
              id, empresa_id, cliente_id, orgao, valor_negativado, conta_receber_id,
              status, data_negativacao, created_at, updated_at
            ) VALUES (?, ?, ?, 'serasa', ?, ?, 'ativo', ?, ?, ?)
          `).bind(
            crypto.randomUUID(), titulo.empresa_id, titulo.cliente_id,
            titulo.valor_aberto, titulo.id, now.split('T')[0], now, now
          ).run();
          negativados++;
        }
      }
    }

    return c.json({
      success: true,
      data: { processados, bloqueados, negativados },
      message: `${processados} cobrança(s) executada(s)`
    });
  } catch (error: unknown) {
    console.error('Erro ao executar cobrança em lote:', error);
    return c.json({ success: false, error: 'Erro ao executar cobrança em lote' }, 500);
  }
});

// =============================================
// HISTÓRICO DE COBRANÇA
// =============================================

// GET /cobranca/historico - Listar histórico de cobranças
cobranca.get('/historico', async (c) => {
  const { empresa_id, cliente_id, conta_receber_id, page = '1', limit = '20' } = c.req.query();

  try {
    let where = 'WHERE 1=1';
    const params: string[] = [];

    if (empresa_id) {
      where += ' AND ch.empresa_id = ?';
      params.push(empresa_id);
    }

    if (cliente_id) {
      where += ' AND ch.cliente_id = ?';
      params.push(cliente_id);
    }

    if (conta_receber_id) {
      where += ' AND ch.conta_receber_id = ?';
      params.push(conta_receber_id);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM cobrancas_historico ch ${where}
    `).bind(...params).first<{ total: number }>();

    const result = await c.env.DB.prepare(`
      SELECT 
        ch.*,
        c.razao_social as cliente_nome,
        cr.numero_documento,
        cr.valor_aberto
      FROM cobrancas_historico ch
      JOIN clientes c ON c.id = ch.cliente_id
      JOIN contas_receber cr ON cr.id = ch.conta_receber_id
      ${where}
      ORDER BY ch.created_at DESC
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
  } catch (error: unknown) {
    console.error('Erro ao listar histórico:', error);
    return c.json({ success: false, error: 'Erro ao listar histórico de cobranças' }, 500);
  }
});

// =============================================
// BLOQUEIOS DE CLIENTES
// =============================================

// GET /cobranca/bloqueios - Listar clientes bloqueados
cobranca.get('/bloqueios', async (c) => {
  const { empresa_id, status = 'ativo' } = c.req.query();

  try {
    let where = 'WHERE cb.status = ?';
    const params: string[] = [status];

    if (empresa_id) {
      where += ' AND cb.empresa_id = ?';
      params.push(empresa_id);
    }

    const result = await c.env.DB.prepare(`
      SELECT 
        cb.*,
        c.razao_social as cliente_nome,
        c.cpf_cnpj as cliente_documento,
        cr.numero_documento,
        cr.valor_aberto
      FROM clientes_bloqueios cb
      JOIN clientes c ON c.id = cb.cliente_id
      LEFT JOIN contas_receber cr ON cr.id = cb.conta_receber_id
      ${where}
      ORDER BY cb.data_bloqueio DESC
    `).bind(...params).all();

    return c.json({ success: true, data: result.results });
  } catch (error: unknown) {
    console.error('Erro ao listar bloqueios:', error);
    return c.json({ success: false, error: 'Erro ao listar bloqueios' }, 500);
  }
});

// POST /cobranca/bloqueios/:id/liberar - Liberar cliente bloqueado
cobranca.post('/bloqueios/:id/liberar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      motivo_liberacao: string;
      usuario_id?: string;
    }>();

    const bloqueio = await c.env.DB.prepare(`
      SELECT * FROM clientes_bloqueios WHERE id = ? AND status = 'ativo'
    `).bind(id).first();

    if (!bloqueio) {
      return c.json({ success: false, error: 'Bloqueio não encontrado ou já liberado' }, 404);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE clientes_bloqueios SET 
        status = 'liberado', data_liberacao = ?, liberado_por = ?, motivo_liberacao = ?, updated_at = ?
      WHERE id = ?
    `).bind(now.split('T')[0], body.usuario_id || null, body.motivo_liberacao, now, id).run();

    return c.json({ success: true, message: 'Cliente liberado com sucesso' });
  } catch (error: unknown) {
    console.error('Erro ao liberar bloqueio:', error);
    return c.json({ success: false, error: 'Erro ao liberar cliente' }, 500);
  }
});

// GET /cobranca/cliente/:cliente_id/bloqueado - Verificar se cliente está bloqueado
cobranca.get('/cliente/:cliente_id/bloqueado', async (c) => {
  const { cliente_id } = c.req.param();

  try {
    const bloqueio = await c.env.DB.prepare(`
      SELECT cb.*, cr.numero_documento, cr.valor_aberto
      FROM clientes_bloqueios cb
      LEFT JOIN contas_receber cr ON cr.id = cb.conta_receber_id
      WHERE cb.cliente_id = ? AND cb.status = 'ativo'
      ORDER BY cb.data_bloqueio DESC
      LIMIT 1
    `).bind(cliente_id).first();

    return c.json({
      success: true,
      data: {
        bloqueado: !!bloqueio,
        bloqueio: bloqueio || null
      }
    });
  } catch (error: unknown) {
    console.error('Erro ao verificar bloqueio:', error);
    return c.json({ success: false, error: 'Erro ao verificar bloqueio' }, 500);
  }
});

// =============================================
// NEGATIVAÇÕES
// =============================================

// GET /cobranca/negativacoes - Listar negativações
cobranca.get('/negativacoes', async (c) => {
  const { empresa_id, status = 'ativo' } = c.req.query();

  try {
    let where = 'WHERE cn.status = ?';
    const params: string[] = [status];

    if (empresa_id) {
      where += ' AND cn.empresa_id = ?';
      params.push(empresa_id);
    }

    const result = await c.env.DB.prepare(`
      SELECT 
        cn.*,
        c.razao_social as cliente_nome,
        c.cpf_cnpj as cliente_documento,
        cr.numero_documento
      FROM clientes_negativacoes cn
      JOIN clientes c ON c.id = cn.cliente_id
      LEFT JOIN contas_receber cr ON cr.id = cn.conta_receber_id
      ${where}
      ORDER BY cn.data_negativacao DESC
    `).bind(...params).all();

    return c.json({ success: true, data: result.results });
  } catch (error: unknown) {
    console.error('Erro ao listar negativações:', error);
    return c.json({ success: false, error: 'Erro ao listar negativações' }, 500);
  }
});

// POST /cobranca/negativacoes/:id/baixar - Baixar negativação
cobranca.post('/negativacoes/:id/baixar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      motivo_baixa: string;
      usuario_id?: string;
    }>();

    const negativacao = await c.env.DB.prepare(`
      SELECT * FROM clientes_negativacoes WHERE id = ? AND status = 'ativo'
    `).bind(id).first();

    if (!negativacao) {
      return c.json({ success: false, error: 'Negativação não encontrada ou já baixada' }, 404);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE clientes_negativacoes SET 
        status = 'baixado', data_baixa = ?, baixado_por = ?, motivo_baixa = ?, updated_at = ?
      WHERE id = ?
    `).bind(now.split('T')[0], body.usuario_id || null, body.motivo_baixa, now, id).run();

    return c.json({ success: true, message: 'Negativação baixada com sucesso' });
  } catch (error: unknown) {
    console.error('Erro ao baixar negativação:', error);
    return c.json({ success: false, error: 'Erro ao baixar negativação' }, 500);
  }
});

// =============================================
// DASHBOARD DE COBRANÇA
// =============================================

// GET /cobranca/dashboard - Resumo de cobrança
cobranca.get('/dashboard', async (c) => {
  const { empresa_id } = c.req.query();

  try {
    let whereEmpresa = '';
    const params: string[] = [];

    if (empresa_id) {
      whereEmpresa = ' AND empresa_id = ?';
      params.push(empresa_id);
    }

    // Total vencido
    const vencido = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as qtd,
        SUM(valor_aberto) as valor
      FROM contas_receber 
      WHERE status = 'aberto' AND data_vencimento < date('now') AND deleted_at IS NULL ${whereEmpresa}
    `).bind(...params).first<{ qtd: number; valor: number }>();

    // Por faixa de atraso
    const faixas = await c.env.DB.prepare(`
      SELECT 
        CASE 
          WHEN julianday('now') - julianday(data_vencimento) BETWEEN 1 AND 7 THEN '1-7 dias'
          WHEN julianday('now') - julianday(data_vencimento) BETWEEN 8 AND 30 THEN '8-30 dias'
          WHEN julianday('now') - julianday(data_vencimento) BETWEEN 31 AND 60 THEN '31-60 dias'
          ELSE 'Mais de 60 dias'
        END as faixa,
        COUNT(*) as qtd,
        SUM(valor_aberto) as valor
      FROM contas_receber 
      WHERE status = 'aberto' AND data_vencimento < date('now') AND deleted_at IS NULL ${whereEmpresa}
      GROUP BY faixa
    `).bind(...params).all();

    // Clientes bloqueados
    const bloqueados = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT cliente_id) as qtd FROM clientes_bloqueios WHERE status = 'ativo' ${whereEmpresa}
    `).bind(...params).first<{ qtd: number }>();

    // Clientes negativados
    const negativados = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT cliente_id) as qtd FROM clientes_negativacoes WHERE status = 'ativo' ${whereEmpresa}
    `).bind(...params).first<{ qtd: number }>();

    // Cobranças do mês
    const cobrancasMes = await c.env.DB.prepare(`
      SELECT COUNT(*) as qtd FROM cobrancas_historico 
      WHERE created_at >= date('now', 'start of month') ${whereEmpresa}
    `).bind(...params).first<{ qtd: number }>();

    return c.json({
      success: true,
      data: {
        total_vencido: {
          quantidade: vencido?.qtd || 0,
          valor: vencido?.valor || 0
        },
        por_faixa: faixas.results,
        clientes_bloqueados: bloqueados?.qtd || 0,
        clientes_negativados: negativados?.qtd || 0,
        cobrancas_mes: cobrancasMes?.qtd || 0
      }
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar dashboard:', error);
    return c.json({ success: false, error: 'Erro ao buscar dashboard de cobrança' }, 500);
  }
});

export default cobranca;
