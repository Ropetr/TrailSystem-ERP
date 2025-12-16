// =============================================
// PLANAC ERP - Rotas de Perfis e Permissoes
// Migrado de src/api/ para src/packages/api/
// =============================================

import { Hono } from 'hono';
import type { Env } from '../types/env';

const perfis = new Hono<{ Bindings: Env }>();

// =============================================
// GET /perfis - Listar perfis
// =============================================
perfis.get('/', async (c) => {
  const { ativo, empresa_id } = c.req.query();

  try {
    let query = `
      SELECT 
        p.id, p.nome, p.descricao, p.nivel, p.padrao, p.ativo, p.created_at,
        (SELECT COUNT(*) FROM usuarios_perfis WHERE perfil_id = p.id) as total_usuarios,
        (SELECT COUNT(*) FROM perfis_permissoes WHERE perfil_id = p.id) as total_permissoes
      FROM perfis p
      WHERE 1=1
    `;
    const params: any[] = [];

    if (empresa_id) {
      query += ` AND p.empresa_id = ?`;
      params.push(empresa_id);
    }

    if (ativo !== undefined && ativo !== '') {
      query += ` AND p.ativo = ?`;
      params.push(ativo === 'true' ? 1 : 0);
    }

    query += ` ORDER BY p.nome`;

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: result.results
    });
  } catch (error: any) {
    console.error('Erro ao listar perfis:', error);
    return c.json({ success: false, error: 'Erro ao listar perfis' }, 500);
  }
});

// =============================================
// GET /perfis/:id - Buscar perfil
// =============================================
perfis.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const perfil = await c.env.DB.prepare(`
      SELECT * FROM perfis WHERE id = ?
    `).bind(id).first();

    if (!perfil) {
      return c.json({ success: false, error: 'Perfil nao encontrado' }, 404);
    }

    // Buscar permissoes
    const permissoes = await c.env.DB.prepare(`
      SELECT pm.id, pm.modulo, pm.acao, pm.descricao
      FROM perfis_permissoes pp
      JOIN permissoes pm ON pp.permissao_id = pm.id
      WHERE pp.perfil_id = ?
      ORDER BY pm.modulo, pm.acao
    `).bind(id).all();

    // Buscar usuarios
    const usuarios = await c.env.DB.prepare(`
      SELECT u.id, u.nome, u.email
      FROM usuarios_perfis up
      JOIN usuarios u ON up.usuario_id = u.id
      WHERE up.perfil_id = ?
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...perfil,
        permissoes: permissoes.results,
        usuarios: usuarios.results
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar perfil:', error);
    return c.json({ success: false, error: 'Erro ao buscar perfil' }, 500);
  }
});

// =============================================
// POST /perfis - Criar perfil
// =============================================
perfis.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      nome: string;
      codigo: string;
      descricao?: string;
      empresa_id?: string;
      permissoes?: string[];
    }>();

    // Validacoes
    if (!body.nome || body.nome.length < 3) {
      return c.json({ success: false, error: 'Nome deve ter no minimo 3 caracteres' }, 400);
    }
    if (!body.codigo || body.codigo.length < 2) {
      return c.json({ success: false, error: 'Codigo deve ter no minimo 2 caracteres' }, 400);
    }

    const empresaId = body.empresa_id || 'empresa_planac_001';

    // Verificar codigo unico
    const codigoExiste = await c.env.DB.prepare(`
      SELECT id FROM perfis WHERE codigo = ? AND empresa_id = ?
    `).bind(body.codigo, empresaId).first();

    if (codigoExiste) {
      return c.json({ success: false, error: 'Codigo ja existe' }, 400);
    }

    // Criar perfil
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO perfis (id, empresa_id, nome, codigo, descricao, sistema, ativo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, 1, ?, ?)
    `).bind(
      id,
      empresaId,
      body.nome,
      body.codigo,
      body.descricao || null,
      now,
      now
    ).run();

    // Vincular permissoes
    if (body.permissoes && body.permissoes.length > 0) {
      for (const permissaoId of body.permissoes) {
        await c.env.DB.prepare(`
          INSERT INTO perfis_permissoes (id, perfil_id, permissao_id, created_at)
          VALUES (?, ?, ?, ?)
        `).bind(crypto.randomUUID(), id, permissaoId, now).run();
      }
    }

    return c.json({
      success: true,
      data: { id },
      message: 'Perfil criado com sucesso'
    }, 201);
  } catch (error: any) {
    console.error('Erro ao criar perfil:', error);
    return c.json({ success: false, error: 'Erro ao criar perfil' }, 500);
  }
});

// =============================================
// PUT /perfis/:id - Editar perfil
// =============================================
perfis.put('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const body = await c.req.json<{
      nome?: string;
      descricao?: string;
      ativo?: boolean;
      permissoes?: string[];
    }>();

    // Verificar se perfil existe
    const perfil = await c.env.DB.prepare(`
      SELECT * FROM perfis WHERE id = ?
    `).bind(id).first<any>();

    if (!perfil) {
      return c.json({ success: false, error: 'Perfil nao encontrado' }, 404);
    }

    // Perfis do sistema nao podem ser editados
    if (perfil.sistema) {
      return c.json({ success: false, error: 'Perfis do sistema nao podem ser editados' }, 400);
    }

    // Montar update
    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [new Date().toISOString()];

    if (body.nome !== undefined) {
      updates.push('nome = ?');
      params.push(body.nome);
    }

    if (body.descricao !== undefined) {
      updates.push('descricao = ?');
      params.push(body.descricao);
    }

    if (body.ativo !== undefined) {
      updates.push('ativo = ?');
      params.push(body.ativo ? 1 : 0);
    }

    params.push(id);

    await c.env.DB.prepare(`
      UPDATE perfis SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    // Atualizar permissoes se informadas
    if (body.permissoes !== undefined) {
      // Remover permissoes atuais
      await c.env.DB.prepare(`
        DELETE FROM perfis_permissoes WHERE perfil_id = ?
      `).bind(id).run();

      // Adicionar novas permissoes
      const now = new Date().toISOString();
      for (const permissaoId of body.permissoes) {
        await c.env.DB.prepare(`
          INSERT INTO perfis_permissoes (id, perfil_id, permissao_id, created_at)
          VALUES (?, ?, ?, ?)
        `).bind(crypto.randomUUID(), id, permissaoId, now).run();
      }
    }

    return c.json({ success: true, message: 'Perfil atualizado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao editar perfil:', error);
    return c.json({ success: false, error: 'Erro ao editar perfil' }, 500);
  }
});

// =============================================
// DELETE /perfis/:id - Desativar perfil
// =============================================
perfis.delete('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const perfil = await c.env.DB.prepare(`
      SELECT * FROM perfis WHERE id = ?
    `).bind(id).first<any>();

    if (!perfil) {
      return c.json({ success: false, error: 'Perfil nao encontrado' }, 404);
    }

    if (perfil.sistema) {
      return c.json({ success: false, error: 'Perfis do sistema nao podem ser excluidos' }, 400);
    }

    // Verificar se ha usuarios vinculados
    const usuariosVinculados = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM usuarios_perfis WHERE perfil_id = ?
    `).bind(id).first<{ total: number }>();

    if (usuariosVinculados && usuariosVinculados.total > 0) {
      return c.json({ 
        success: false, 
        error: `Existem ${usuariosVinculados.total} usuarios vinculados a este perfil` 
      }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE perfis SET ativo = 0, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), id).run();

    return c.json({ success: true, message: 'Perfil desativado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desativar perfil:', error);
    return c.json({ success: false, error: 'Erro ao desativar perfil' }, 500);
  }
});

// =============================================
// GET /perfis/permissoes/todas - Listar permissoes
// =============================================
perfis.get('/permissoes/todas', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT id, modulo, acao, descricao
      FROM permissoes
      ORDER BY modulo, acao
    `).all();

    // Agrupar por modulo
    const agrupado: Record<string, any[]> = {};
    for (const p of result.results as any[]) {
      if (!agrupado[p.modulo]) {
        agrupado[p.modulo] = [];
      }
      agrupado[p.modulo].push(p);
    }

    return c.json({
      success: true,
      data: agrupado
    });
  } catch (error: any) {
    console.error('Erro ao listar permissoes:', error);
    return c.json({ success: false, error: 'Erro ao listar permissoes' }, 500);
  }
});

export default perfis;
