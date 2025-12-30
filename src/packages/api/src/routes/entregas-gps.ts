// =============================================
// TRAILSYSTEM ERP - Rotas de Entregas com GPS
// Fluxo completo: romaneio, rastreamento, entrega
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const entregasGps = new Hono<{ Bindings: Env }>();

// =============================================
// CRUD DE ROMANEIOS
// =============================================

// GET /entregas-gps/romaneios - Listar romaneios
entregasGps.get('/romaneios', async (c) => {
  const { page = '1', limit = '20', status, motorista_id, empresa_id, data } = c.req.query();

  try {
    let where = 'WHERE r.deleted_at IS NULL';
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND r.empresa_id = ?';
      params.push(empresa_id);
    }

    if (status) {
      where += ' AND r.status = ?';
      params.push(status);
    }

    if (motorista_id) {
      where += ' AND r.motorista_id = ?';
      params.push(motorista_id);
    }

    if (data) {
      where += ' AND r.data_romaneio = ?';
      params.push(data);
    }

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM romaneios_carga r ${where}
    `).bind(...params).first<{ total: number }>();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await c.env.DB.prepare(`
      SELECT r.*
      FROM romaneios_carga r
      ${where}
      ORDER BY r.data_romaneio DESC, r.created_at DESC
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
    console.error('Erro ao listar romaneios:', error);
    return c.json({ success: false, error: 'Erro ao listar romaneios' }, 500);
  }
});

// GET /entregas-gps/romaneios/:id - Buscar romaneio por ID
entregasGps.get('/romaneios/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const romaneio = await c.env.DB.prepare(`
      SELECT * FROM romaneios_carga WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!romaneio) {
      return c.json({ success: false, error: 'Romaneio nao encontrado' }, 404);
    }

    // Buscar entregas
    const entregas = await c.env.DB.prepare(`
      SELECT * FROM romaneios_entregas WHERE romaneio_id = ? ORDER BY sequencia
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...romaneio,
        entregas: entregas.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar romaneio:', error);
    return c.json({ success: false, error: 'Erro ao buscar romaneio' }, 500);
  }
});

// POST /entregas-gps/romaneios - Criar romaneio
entregasGps.post('/romaneios', async (c) => {
  try {
    const body = await c.req.json<{
      motorista_id?: string;
      motorista_nome?: string;
      motorista_telefone?: string;
      veiculo_placa?: string;
      veiculo_modelo?: string;
      data_romaneio: string;
      observacao?: string;
      empresa_id: string;
      criado_por_id?: string;
      criado_por_nome?: string;
    }>();

    if (!body.data_romaneio || !body.empresa_id) {
      return c.json({ success: false, error: 'Data do romaneio e empresa sao obrigatorios' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Gerar numero do romaneio
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM romaneios_carga WHERE empresa_id = ?
    `).bind(body.empresa_id).first<{ total: number }>();
    const numero = `ROM-${String((countResult?.total || 0) + 1).padStart(6, '0')}`;

    await c.env.DB.prepare(`
      INSERT INTO romaneios_carga (
        id, empresa_id, numero, motorista_id, motorista_nome, motorista_telefone,
        veiculo_placa, veiculo_modelo, data_romaneio, status, observacao,
        criado_por_id, criado_por_nome, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'rascunho', ?, ?, ?, ?, ?)
    `).bind(
      id, body.empresa_id, numero,
      body.motorista_id || null, body.motorista_nome || null, body.motorista_telefone || null,
      body.veiculo_placa || null, body.veiculo_modelo || null, body.data_romaneio,
      body.observacao || null, body.criado_por_id || null, body.criado_por_nome || null, now, now
    ).run();

    return c.json({
      success: true,
      data: { id, numero },
      message: 'Romaneio criado com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar romaneio:', error);
    return c.json({ success: false, error: 'Erro ao criar romaneio' }, 500);
  }
});

// POST /entregas-gps/romaneios/:id/entregas - Adicionar entrega ao romaneio
entregasGps.post('/romaneios/:id/entregas', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      pedido_id?: string;
      pedido_numero?: string;
      nfe_numero?: string;
      cliente_id?: string;
      cliente_nome?: string;
      cliente_telefone?: string;
      cliente_email?: string;
      endereco_cep?: string;
      endereco_logradouro?: string;
      endereco_numero?: string;
      endereco_complemento?: string;
      endereco_bairro?: string;
      endereco_cidade?: string;
      endereco_uf?: string;
      endereco_latitude?: number;
      endereco_longitude?: number;
      peso?: number;
      volumes?: number;
      valor?: number;
      data_prevista?: string;
      hora_prevista_inicio?: string;
      hora_prevista_fim?: string;
    }>();

    const romaneio = await c.env.DB.prepare(`
      SELECT * FROM romaneios_carga WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!romaneio) {
      return c.json({ success: false, error: 'Romaneio nao encontrado' }, 404);
    }

    if (romaneio.status !== 'rascunho' && romaneio.status !== 'planejado') {
      return c.json({ success: false, error: 'Romaneio nao pode ser alterado' }, 400);
    }

    // Buscar proxima sequencia
    const seqResult = await c.env.DB.prepare(`
      SELECT MAX(sequencia) as max_seq FROM romaneios_entregas WHERE romaneio_id = ?
    `).bind(id).first<{ max_seq: number }>();
    const sequencia = (seqResult?.max_seq || 0) + 1;

    const entregaId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO romaneios_entregas (
        id, romaneio_id, empresa_id, pedido_id, pedido_numero, nfe_numero,
        cliente_id, cliente_nome, cliente_telefone, cliente_email,
        endereco_cep, endereco_logradouro, endereco_numero, endereco_complemento,
        endereco_bairro, endereco_cidade, endereco_uf,
        endereco_latitude, endereco_longitude, sequencia, status,
        peso, volumes, valor, data_prevista, hora_prevista_inicio, hora_prevista_fim,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      entregaId, id, romaneio.empresa_id,
      body.pedido_id || null, body.pedido_numero || null, body.nfe_numero || null,
      body.cliente_id || null, body.cliente_nome || null, body.cliente_telefone || null, body.cliente_email || null,
      body.endereco_cep || null, body.endereco_logradouro || null, body.endereco_numero || null, body.endereco_complemento || null,
      body.endereco_bairro || null, body.endereco_cidade || null, body.endereco_uf || null,
      body.endereco_latitude || null, body.endereco_longitude || null, sequencia,
      body.peso || 0, body.volumes || 1, body.valor || 0,
      body.data_prevista || null, body.hora_prevista_inicio || null, body.hora_prevista_fim || null,
      now, now
    ).run();

    // Atualizar totais do romaneio
    await c.env.DB.prepare(`
      UPDATE romaneios_carga SET 
        qtd_entregas = qtd_entregas + 1,
        qtd_entregas_pendentes = qtd_entregas_pendentes + 1,
        peso_total = peso_total + ?,
        valor_total = valor_total + ?,
        updated_at = ?
      WHERE id = ?
    `).bind(body.peso || 0, body.valor || 0, now, id).run();

    return c.json({
      success: true,
      data: { id: entregaId, sequencia },
      message: 'Entrega adicionada ao romaneio'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao adicionar entrega:', error);
    return c.json({ success: false, error: 'Erro ao adicionar entrega' }, 500);
  }
});

// =============================================
// WORKFLOW - ROTA
// =============================================

// POST /entregas-gps/romaneios/:id/iniciar-rota - Motorista inicia a rota
entregasGps.post('/romaneios/:id/iniciar-rota', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      km_inicial?: number;
      latitude?: number;
      longitude?: number;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const romaneio = await c.env.DB.prepare(`
      SELECT * FROM romaneios_carga WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!romaneio) {
      return c.json({ success: false, error: 'Romaneio nao encontrado' }, 404);
    }

    if (romaneio.status !== 'planejado' && romaneio.status !== 'em_carregamento') {
      return c.json({ success: false, error: 'Romaneio nao esta pronto para iniciar rota' }, 400);
    }

    const now = new Date().toISOString();
    const hora = now.split('T')[1].substring(0, 5);

    await c.env.DB.prepare(`
      UPDATE romaneios_carga SET 
        status = 'em_rota',
        data_saida = ?,
        hora_saida = ?,
        km_inicial = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(now.split('T')[0], hora, body.km_inicial || null, now, id).run();

    // Registrar posicao inicial
    if (body.latitude && body.longitude) {
      await c.env.DB.prepare(`
        INSERT INTO rastreamento_gps (
          id, empresa_id, romaneio_id, motorista_id, latitude, longitude, data_hora, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), romaneio.empresa_id, id, romaneio.motorista_id,
        body.latitude, body.longitude, now, now
      ).run();
    }

    // Atualizar entregas para em_transito
    await c.env.DB.prepare(`
      UPDATE romaneios_entregas SET status = 'em_transito', updated_at = ? WHERE romaneio_id = ? AND status = 'pendente'
    `).bind(now, id).run();

    return c.json({ success: true, message: 'Rota iniciada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao iniciar rota:', error);
    return c.json({ success: false, error: 'Erro ao iniciar rota' }, 500);
  }
});

// POST /entregas-gps/romaneios/:id/finalizar-rota - Motorista finaliza a rota
entregasGps.post('/romaneios/:id/finalizar-rota', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      km_final?: number;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const romaneio = await c.env.DB.prepare(`
      SELECT * FROM romaneios_carga WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first<any>();

    if (!romaneio) {
      return c.json({ success: false, error: 'Romaneio nao encontrado' }, 404);
    }

    if (romaneio.status !== 'em_rota') {
      return c.json({ success: false, error: 'Romaneio nao esta em rota' }, 400);
    }

    const now = new Date().toISOString();
    const hora = now.split('T')[1].substring(0, 5);
    const kmPercorrido = body.km_final && romaneio.km_inicial ? body.km_final - romaneio.km_inicial : null;

    await c.env.DB.prepare(`
      UPDATE romaneios_carga SET 
        status = 'finalizado',
        data_retorno = ?,
        hora_retorno = ?,
        km_final = ?,
        km_percorrido = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(now.split('T')[0], hora, body.km_final || null, kmPercorrido, now, id).run();

    return c.json({ success: true, message: 'Rota finalizada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao finalizar rota:', error);
    return c.json({ success: false, error: 'Erro ao finalizar rota' }, 500);
  }
});

// =============================================
// RASTREAMENTO GPS
// =============================================

// POST /entregas-gps/rastreamento - Registrar posicao GPS
entregasGps.post('/rastreamento', async (c) => {
  try {
    const body = await c.req.json<{
      romaneio_id: string;
      motorista_id: string;
      latitude: number;
      longitude: number;
      precisao?: number;
      velocidade?: number;
      direcao?: number;
      altitude?: number;
      bateria_nivel?: number;
      conexao_tipo?: string;
      empresa_id: string;
    }>();

    if (!body.latitude || !body.longitude || !body.romaneio_id) {
      return c.json({ success: false, error: 'Latitude, longitude e romaneio_id sao obrigatorios' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO rastreamento_gps (
        id, empresa_id, romaneio_id, motorista_id, latitude, longitude,
        precisao, velocidade, direcao, altitude, bateria_nivel, conexao_tipo,
        data_hora, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), body.empresa_id, body.romaneio_id, body.motorista_id,
      body.latitude, body.longitude, body.precisao || null, body.velocidade || null,
      body.direcao || null, body.altitude || null, body.bateria_nivel || null,
      body.conexao_tipo || null, now, now
    ).run();

    // Atualizar posicao do motorista
    await c.env.DB.prepare(`
      UPDATE motoristas SET 
        ultima_latitude = ?,
        ultima_longitude = ?,
        ultima_atualizacao = ?
      WHERE usuario_id = ?
    `).bind(body.latitude, body.longitude, now, body.motorista_id).run();

    return c.json({ success: true, message: 'Posicao registrada' });
  } catch (error: any) {
    console.error('Erro ao registrar posicao:', error);
    return c.json({ success: false, error: 'Erro ao registrar posicao' }, 500);
  }
});

// GET /entregas-gps/rastreamento/:romaneio_id - Buscar historico de posicoes
entregasGps.get('/rastreamento/:romaneio_id', async (c) => {
  const { romaneio_id } = c.req.param();
  const { limit = '100' } = c.req.query();

  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM rastreamento_gps 
      WHERE romaneio_id = ? 
      ORDER BY data_hora DESC 
      LIMIT ?
    `).bind(romaneio_id, parseInt(limit)).all();

    return c.json({
      success: true,
      data: result.results
    });
  } catch (error: any) {
    console.error('Erro ao buscar rastreamento:', error);
    return c.json({ success: false, error: 'Erro ao buscar rastreamento' }, 500);
  }
});

// GET /entregas-gps/rastreamento/:romaneio_id/atual - Posicao atual do motorista
entregasGps.get('/rastreamento/:romaneio_id/atual', async (c) => {
  const { romaneio_id } = c.req.param();

  try {
    const posicao = await c.env.DB.prepare(`
      SELECT * FROM rastreamento_gps 
      WHERE romaneio_id = ? 
      ORDER BY data_hora DESC 
      LIMIT 1
    `).bind(romaneio_id).first();

    if (!posicao) {
      return c.json({ success: false, error: 'Nenhuma posicao encontrada' }, 404);
    }

    return c.json({
      success: true,
      data: posicao
    });
  } catch (error: any) {
    console.error('Erro ao buscar posicao atual:', error);
    return c.json({ success: false, error: 'Erro ao buscar posicao atual' }, 500);
  }
});

// =============================================
// WORKFLOW - ENTREGA
// =============================================

// POST /entregas-gps/entregas/:id/checkin - Check-in no endereco
entregasGps.post('/entregas/:id/checkin', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      latitude: number;
      longitude: number;
      automatico?: boolean;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    if (!body.latitude || !body.longitude) {
      return c.json({ success: false, error: 'Latitude e longitude sao obrigatorios' }, 400);
    }

    const entrega = await c.env.DB.prepare(`
      SELECT e.*, r.empresa_id FROM romaneios_entregas e
      JOIN romaneios_carga r ON r.id = e.romaneio_id
      WHERE e.id = ?
    `).bind(id).first<any>();

    if (!entrega) {
      return c.json({ success: false, error: 'Entrega nao encontrada' }, 404);
    }

    const now = new Date().toISOString();
    const hora = now.split('T')[1].substring(0, 5);

    await c.env.DB.prepare(`
      UPDATE romaneios_entregas SET 
        status = 'chegou',
        checkin_latitude = ?,
        checkin_longitude = ?,
        checkin_data = ?,
        checkin_hora = ?,
        checkin_automatico = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.latitude, body.longitude, now.split('T')[0], hora,
      body.automatico ? 1 : 0, now, id
    ).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO entregas_historico (
        id, entrega_id, romaneio_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, latitude, longitude, created_at
      ) VALUES (?, ?, ?, 'checkin', ?, 'chegou', ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, entrega.romaneio_id, entrega.status,
      body.usuario_id || null, body.usuario_nome || null,
      body.automatico ? 'Check-in automatico por GPS' : 'Check-in manual',
      body.latitude, body.longitude, now
    ).run();

    return c.json({ success: true, message: 'Check-in realizado' });
  } catch (error: any) {
    console.error('Erro ao fazer check-in:', error);
    return c.json({ success: false, error: 'Erro ao fazer check-in' }, 500);
  }
});

// POST /entregas-gps/entregas/:id/confirmar - Confirmar entrega
entregasGps.post('/entregas/:id/confirmar', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      assinatura_url?: string;
      assinatura_nome?: string;
      assinatura_documento?: string;
      foto_comprovante_url?: string;
      observacao?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    const entrega = await c.env.DB.prepare(`
      SELECT e.*, r.empresa_id FROM romaneios_entregas e
      JOIN romaneios_carga r ON r.id = e.romaneio_id
      WHERE e.id = ?
    `).bind(id).first<any>();

    if (!entrega) {
      return c.json({ success: false, error: 'Entrega nao encontrada' }, 404);
    }

    if (entrega.status !== 'chegou' && entrega.status !== 'em_transito') {
      return c.json({ success: false, error: 'Entrega nao esta pronta para confirmacao' }, 400);
    }

    const now = new Date().toISOString();
    const hora = now.split('T')[1].substring(0, 5);

    await c.env.DB.prepare(`
      UPDATE romaneios_entregas SET 
        status = 'entregue',
        data_entrega = ?,
        hora_entrega = ?,
        assinatura_url = ?,
        assinatura_nome = ?,
        assinatura_documento = ?,
        foto_comprovante_url = ?,
        observacao = COALESCE(observacao || ' | ', '') || ?,
        notificacao_entrega_enviada = 1,
        updated_at = ?
      WHERE id = ?
    `).bind(
      now.split('T')[0], hora,
      body.assinatura_url || null, body.assinatura_nome || null, body.assinatura_documento || null,
      body.foto_comprovante_url || null, body.observacao || 'Entrega confirmada', now, id
    ).run();

    // Atualizar totais do romaneio
    await c.env.DB.prepare(`
      UPDATE romaneios_carga SET 
        qtd_entregas_realizadas = qtd_entregas_realizadas + 1,
        qtd_entregas_pendentes = qtd_entregas_pendentes - 1,
        updated_at = ?
      WHERE id = ?
    `).bind(now, entrega.romaneio_id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO entregas_historico (
        id, entrega_id, romaneio_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, ?, 'entrega', ?, 'entregue', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, entrega.romaneio_id, entrega.status,
      body.usuario_id || null, body.usuario_nome || null,
      `Entrega confirmada${body.assinatura_nome ? ` - Recebido por: ${body.assinatura_nome}` : ''}`, now
    ).run();

    return c.json({ success: true, message: 'Entrega confirmada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao confirmar entrega:', error);
    return c.json({ success: false, error: 'Erro ao confirmar entrega' }, 500);
  }
});

// POST /entregas-gps/entregas/:id/ocorrencia - Registrar ocorrencia
entregasGps.post('/entregas/:id/ocorrencia', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      tipo: string;
      descricao: string;
      reagendar?: boolean;
      reagendamento_data?: string;
      usuario_id?: string;
      usuario_nome?: string;
    }>();

    if (!body.tipo || !body.descricao) {
      return c.json({ success: false, error: 'Tipo e descricao da ocorrencia sao obrigatorios' }, 400);
    }

    const entrega = await c.env.DB.prepare(`
      SELECT e.*, r.empresa_id FROM romaneios_entregas e
      JOIN romaneios_carga r ON r.id = e.romaneio_id
      WHERE e.id = ?
    `).bind(id).first<any>();

    if (!entrega) {
      return c.json({ success: false, error: 'Entrega nao encontrada' }, 404);
    }

    const now = new Date().toISOString();
    let novoStatus = body.tipo === 'ausente' ? 'ausente' : 
                     body.tipo === 'recusado' ? 'recusado' : 'pendente';
    
    if (body.reagendar) {
      novoStatus = 'reagendado';
    }

    await c.env.DB.prepare(`
      UPDATE romaneios_entregas SET 
        status = ?,
        ocorrencia_tipo = ?,
        ocorrencia_descricao = ?,
        ocorrencia_data = ?,
        reagendamento_data = ?,
        reagendamento_motivo = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      novoStatus, body.tipo, body.descricao, now.split('T')[0],
      body.reagendamento_data || null, body.reagendar ? body.descricao : null, now, id
    ).run();

    // Atualizar totais do romaneio
    await c.env.DB.prepare(`
      UPDATE romaneios_carga SET 
        qtd_ocorrencias = qtd_ocorrencias + 1,
        updated_at = ?
      WHERE id = ?
    `).bind(now, entrega.romaneio_id).run();

    // Registrar historico
    await c.env.DB.prepare(`
      INSERT INTO entregas_historico (
        id, entrega_id, romaneio_id, acao, status_anterior, status_novo,
        usuario_id, usuario_nome, descricao, created_at
      ) VALUES (?, ?, ?, 'ocorrencia', ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), id, entrega.romaneio_id, entrega.status, novoStatus,
      body.usuario_id || null, body.usuario_nome || null,
      `Ocorrencia: ${body.tipo} - ${body.descricao}`, now
    ).run();

    return c.json({ success: true, message: 'Ocorrencia registrada' });
  } catch (error: any) {
    console.error('Erro ao registrar ocorrencia:', error);
    return c.json({ success: false, error: 'Erro ao registrar ocorrencia' }, 500);
  }
});

// =============================================
// RASTREAMENTO PUBLICO (para cliente)
// =============================================

// GET /entregas-gps/rastrear/:codigo - Cliente rastreia entrega
entregasGps.get('/rastrear/:codigo', async (c) => {
  const { codigo } = c.req.param();

  try {
    // Buscar entrega pelo numero do pedido ou NF
    const entrega = await c.env.DB.prepare(`
      SELECT e.*, r.motorista_nome, r.status as romaneio_status
      FROM romaneios_entregas e
      JOIN romaneios_carga r ON r.id = e.romaneio_id
      WHERE (e.pedido_numero = ? OR e.nfe_numero = ?)
      AND r.deleted_at IS NULL
      ORDER BY e.created_at DESC
      LIMIT 1
    `).bind(codigo, codigo).first<any>();

    if (!entrega) {
      return c.json({ success: false, error: 'Entrega nao encontrada' }, 404);
    }

    // Buscar posicao atual do motorista se em rota
    let posicaoMotorista = null;
    if (entrega.romaneio_status === 'em_rota') {
      posicaoMotorista = await c.env.DB.prepare(`
        SELECT latitude, longitude, data_hora FROM rastreamento_gps 
        WHERE romaneio_id = ? 
        ORDER BY data_hora DESC 
        LIMIT 1
      `).bind(entrega.romaneio_id).first();
    }

    return c.json({
      success: true,
      data: {
        status: entrega.status,
        cliente_nome: entrega.cliente_nome,
        endereco: {
          logradouro: entrega.endereco_logradouro,
          numero: entrega.endereco_numero,
          bairro: entrega.endereco_bairro,
          cidade: entrega.endereco_cidade,
          uf: entrega.endereco_uf
        },
        data_prevista: entrega.data_prevista,
        hora_prevista_inicio: entrega.hora_prevista_inicio,
        hora_prevista_fim: entrega.hora_prevista_fim,
        data_entrega: entrega.data_entrega,
        hora_entrega: entrega.hora_entrega,
        motorista_nome: entrega.motorista_nome,
        em_rota: entrega.romaneio_status === 'em_rota',
        posicao_motorista: posicaoMotorista
      }
    });
  } catch (error: any) {
    console.error('Erro ao rastrear entrega:', error);
    return c.json({ success: false, error: 'Erro ao rastrear entrega' }, 500);
  }
});

// =============================================
// DASHBOARD
// =============================================

// GET /entregas-gps/dashboard/resumo - Dashboard de entregas
entregasGps.get('/dashboard/resumo', async (c) => {
  const { empresa_id, data } = c.req.query();

  try {
    let where = "WHERE r.deleted_at IS NULL";
    const params: any[] = [];

    if (empresa_id) {
      where += ' AND r.empresa_id = ?';
      params.push(empresa_id);
    }

    const dataFiltro = data || new Date().toISOString().split('T')[0];
    where += ' AND r.data_romaneio = ?';
    params.push(dataFiltro);

    // Romaneios do dia
    const romaneios = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as quantidade
      FROM romaneios_carga r ${where}
      GROUP BY status
    `).bind(...params).all();

    // Entregas do dia
    const entregas = await c.env.DB.prepare(`
      SELECT e.status, COUNT(*) as quantidade
      FROM romaneios_entregas e
      JOIN romaneios_carga r ON r.id = e.romaneio_id
      ${where}
      GROUP BY e.status
    `).bind(...params).all();

    // Motoristas em rota
    const motoristasEmRota = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT motorista_id) as quantidade
      FROM romaneios_carga r ${where} AND status = 'em_rota'
    `).bind(...params).first();

    return c.json({
      success: true,
      data: {
        data: dataFiltro,
        romaneios: romaneios.results,
        entregas: entregas.results,
        motoristas_em_rota: motoristasEmRota?.quantidade || 0
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar dashboard:', error);
    return c.json({ success: false, error: 'Erro ao buscar dashboard' }, 500);
  }
});

export default entregasGps;
