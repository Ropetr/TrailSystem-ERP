// =============================================
// 🛡️ PLANAC ERP - Rotas de Perfis e Permissões
// =============================================
// Arquivo: src/api/src/routes/perfis.routes.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { registrarAuditoria } from '../services/auth.service';
import { authMiddleware, requirePermission, getClientIP, getUserAgent } from '../middleware/auth.middleware';

// Tipos
interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
}

// Schemas de Validação
const criarPerfilSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  descricao: z.string().optional(),
  nivel: z.number().min(1).max(10).default(5),
  permissoes: z.array(z.string()).default([])
});

const editarPerfilSchema = z.object({
  nome: z.string().min(2).optional(),
  descricao: z.string().optional().nullable(),
  nivel: z.number().min(1).max(10).optional(),
  ativo: z.boolean().optional(),
  permissoes: z.array(z.string()).optional()
});

// Criar router
const perfis = new Hono<{ Bindings: Env }>();

// Aplicar autenticação em todas as rotas
perfis.use('*', authMiddleware());

// =============================================
// GET /perfis - Listar perfis
// =============================================
perfis.get('/', requirePermission('perfis', 'ver'), async (c) => {
  const empresaId = c.get('empresa_id');
  const { ativo } = c.req.query();
  
  try {
    let whereClause = 'WHERE p.empresa_id = ?';
    const params: any[] = [empresaId];
    
    if (ativo !== undefined && ativo !== '') {
      whereClause += ' AND p.ativo = ?';
      params.push(ativo === 'true' ? 1 : 0);
    }
    
    const perfisResult = await c.env.DB.prepare(`
      SELECT 
        p.id, p.nome, p.descricao, p.nivel, p.padrao, p.ativo,
        p.created_at, p.updated_at,
        (SELECT COUNT(*) FROM usuarios_perfis up WHERE up.perfil_id = p.id) as qtd_usuarios
      FROM perfis p
      ${whereClause}
      ORDER BY p.nivel, p.nome
    `).bind(...params).all();
    
    return c.json({
      success: true,
      data: perfisResult.results
    });
  } catch (error) {
    console.error('Erro ao listar perfis:', error);
    return c.json({ success: false, error: 'Erro ao listar perfis' }, 500);
  }
});

// =============================================
// GET /perfis/permissoes - Listar todas as permissões
// =============================================
perfis.get('/permissoes', requirePermission('perfis', 'ver'), async (c) => {
  try {
    const permissoes = await c.env.DB.prepare(`
      SELECT id, modulo, acao, descricao
      FROM permissoes
      ORDER BY modulo, acao
    `).all();
    
    // Agrupar por módulo
    const modulosMap: { [key: string]: any[] } = {};
    
    for (const perm of permissoes.results as any[]) {
      if (!modulosMap[perm.modulo]) {
        modulosMap[perm.modulo] = [];
      }
      modulosMap[perm.modulo].push({
        id: perm.id,
        acao: perm.acao,
        descricao: perm.descricao
      });
    }
    
    // Converter para array
    const modulos = Object.entries(modulosMap).map(([modulo, acoes]) => ({
      modulo,
      acoes
    }));
    
    return c.json({
      success: true,
      data: modulos
    });
  } catch (error) {
    console.error('Erro ao listar permissões:', error);
    return c.json({ success: false, error: 'Erro ao listar permissões' }, 500);
  }
});

// =============================================
// GET /perfis/:id - Buscar perfil por ID
// =============================================
perfis.get('/:id', requirePermission('perfis', 'ver'), async (c) => {
  const empresaId = c.get('empresa_id');
  const { id } = c.req.param();
  
  try {
    const perfil = await c.env.DB.prepare(`
      SELECT 
        p.id, p.nome, p.descricao, p.nivel, p.padrao, p.ativo,
        p.created_at, p.updated_at
      FROM perfis p
      WHERE p.id = ? AND p.empresa_id = ?
    `).bind(id, empresaId).first();
    
    if (!perfil) {
      return c.json({ success: false, error: 'Perfil não encontrado' }, 404);
    }
    
    // Buscar permissões do perfil
    const permissoes = await c.env.DB.prepare(`
      SELECT p.id, p.modulo, p.acao, p.descricao
      FROM permissoes p
      INNER JOIN perfis_permissoes pp ON pp.permissao_id = p.id
      WHERE pp.perfil_id = ?
      ORDER BY p.modulo, p.acao
    `).bind(id).all();
    
    // Buscar usuários com este perfil
    const usuarios = await c.env.DB.prepare(`
      SELECT u.id, u.nome, u.email
      FROM usuarios u
      INNER JOIN usuarios_perfis up ON up.usuario_id = u.id
      WHERE up.perfil_id = ?
      ORDER BY u.nome
    `).bind(id).all();
    
    return c.json({
      success: true,
      data: {
        ...perfil,
        permissoes: permissoes.results,
        usuarios: usuarios.results
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return c.json({ success: false, error: 'Erro ao buscar perfil' }, 500);
  }
});

// =============================================
// POST /perfis - Criar perfil
// =============================================
perfis.post('/', requirePermission('perfis', 'criar'), zValidator('json', criarPerfilSchema), async (c) => {
  const empresaId = c.get('empresa_id');
  const user = c.get('user');
  const body = c.req.valid('json');
  const ip = getClientIP(c);
  const userAgent = getUserAgent(c);
  
  try {
    // Verificar se nome já existe
    const existe = await c.env.DB.prepare(`
      SELECT id FROM perfis WHERE nome = ? AND empresa_id = ?
    `).bind(body.nome, empresaId).first();
    
    if (existe) {
      return c.json({ success: false, error: 'Já existe um perfil com este nome' }, 400);
    }
    
    const perfilId = crypto.randomUUID();
    
    // Criar perfil
    await c.env.DB.prepare(`
      INSERT INTO perfis (id, empresa_id, nome, descricao, nivel)
      VALUES (?, ?, ?, ?, ?)
    `).bind(perfilId, empresaId, body.nome, body.descricao || null, body.nivel).run();
    
    // Vincular permissões
    if (body.permissoes.length > 0) {
      for (const permissaoId of body.permissoes) {
        await c.env.DB.prepare(`
          INSERT INTO perfis_permissoes (id, perfil_id, permissao_id)
          VALUES (?, ?, ?)
        `).bind(crypto.randomUUID(), perfilId, permissaoId).run();
      }
    }
    
    // Auditoria
    await registrarAuditoria(c.env.DB, empresaId, user.id,
      'criar', 'perfis', `Perfil ${body.nome} criado`, ip, userAgent,
      'perfis', perfilId, null, body);
    
    return c.json({
      success: true,
      message: 'Perfil criado com sucesso',
      data: { id: perfilId }
    }, 201);
  } catch (error) {
    console.error('Erro ao criar perfil:', error);
    return c.json({ success: false, error: 'Erro ao criar perfil' }, 500);
  }
});

// =============================================
// PUT /perfis/:id - Editar perfil
// =============================================
perfis.put('/:id', requirePermission('perfis', 'editar'), zValidator('json', editarPerfilSchema), async (c) => {
  const empresaId = c.get('empresa_id');
  const user = c.get('user');
  const { id } = c.req.param();
  const body = c.req.valid('json');
  const ip = getClientIP(c);
  const userAgent = getUserAgent(c);
  
  try {
    // Verificar se perfil existe
    const perfilAtual = await c.env.DB.prepare(`
      SELECT * FROM perfis WHERE id = ? AND empresa_id = ?
    `).bind(id, empresaId).first<any>();
    
    if (!perfilAtual) {
      return c.json({ success: false, error: 'Perfil não encontrado' }, 404);
    }
    
    // Verificar se nome já existe (se estiver alterando)
    if (body.nome && body.nome !== perfilAtual.nome) {
      const existe = await c.env.DB.prepare(`
        SELECT id FROM perfis WHERE nome = ? AND empresa_id = ? AND id != ?
      `).bind(body.nome, empresaId, id).first();
      
      if (existe) {
        return c.json({ success: false, error: 'Já existe um perfil com este nome' }, 400);
      }
    }
    
    // Construir update
    const updates: string[] = [];
    const params: any[] = [];
    
    if (body.nome !== undefined) {
      updates.push('nome = ?');
      params.push(body.nome);
    }
    if (body.descricao !== undefined) {
      updates.push('descricao = ?');
      params.push(body.descricao);
    }
    if (body.nivel !== undefined) {
      updates.push('nivel = ?');
      params.push(body.nivel);
    }
    if (body.ativo !== undefined) {
      updates.push('ativo = ?');
      params.push(body.ativo ? 1 : 0);
    }
    
    if (updates.length > 0) {
      updates.push('updated_at = datetime(\'now\')');
      params.push(id);
      
      await c.env.DB.prepare(`
        UPDATE perfis SET ${updates.join(', ')} WHERE id = ?
      `).bind(...params).run();
    }
    
    // Atualizar permissões se fornecidas
    if (body.permissoes !== undefined) {
      // Remover permissões antigas
      await c.env.DB.prepare(`
        DELETE FROM perfis_permissoes WHERE perfil_id = ?
      `).bind(id).run();
      
      // Adicionar novas
      for (const permissaoId of body.permissoes) {
        await c.env.DB.prepare(`
          INSERT INTO perfis_permissoes (id, perfil_id, permissao_id)
          VALUES (?, ?, ?)
        `).bind(crypto.randomUUID(), id, permissaoId).run();
      }
      
      // Invalidar cache de sessões dos usuários com este perfil
      // (Na próxima requisição, eles terão as permissões atualizadas)
    }
    
    // Auditoria
    await registrarAuditoria(c.env.DB, empresaId, user.id,
      'editar', 'perfis', `Perfil ${perfilAtual.nome} editado`, ip, userAgent,
      'perfis', id, perfilAtual, body);
    
    return c.json({ success: true, message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao editar perfil:', error);
    return c.json({ success: false, error: 'Erro ao editar perfil' }, 500);
  }
});

// =============================================
// DELETE /perfis/:id - Desativar perfil
// =============================================
perfis.delete('/:id', requirePermission('perfis', 'excluir'), async (c) => {
  const empresaId = c.get('empresa_id');
  const user = c.get('user');
  const { id } = c.req.param();
  const ip = getClientIP(c);
  const userAgent = getUserAgent(c);
  
  try {
    // Verificar se perfil existe
    const perfil = await c.env.DB.prepare(`
      SELECT nome, padrao FROM perfis WHERE id = ? AND empresa_id = ?
    `).bind(id, empresaId).first<{ nome: string; padrao: number }>();
    
    if (!perfil) {
      return c.json({ success: false, error: 'Perfil não encontrado' }, 404);
    }
    
    // Não pode excluir perfil padrão
    if (perfil.padrao) {
      return c.json({ success: false, error: 'Não é possível excluir o perfil padrão' }, 400);
    }
    
    // Verificar se há usuários vinculados
    const usuarios = await c.env.DB.prepare(`
      SELECT COUNT(*) as qtd FROM usuarios_perfis WHERE perfil_id = ?
    `).bind(id).first<{ qtd: number }>();
    
    if (usuarios && usuarios.qtd > 0) {
      return c.json({ 
        success: false, 
        error: `Não é possível excluir: ${usuarios.qtd} usuário(s) vinculado(s)` 
      }, 400);
    }
    
    // Desativar (soft delete)
    await c.env.DB.prepare(`
      UPDATE perfis SET ativo = 0, updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();
    
    // Auditoria
    await registrarAuditoria(c.env.DB, empresaId, user.id,
      'excluir', 'perfis', `Perfil ${perfil.nome} desativado`, ip, userAgent,
      'perfis', id);
    
    return c.json({ success: true, message: 'Perfil desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar perfil:', error);
    return c.json({ success: false, error: 'Erro ao desativar perfil' }, 500);
  }
});

// =============================================
// GET /perfis/:id/matriz - Matriz de permissões
// =============================================
perfis.get('/:id/matriz', requirePermission('perfis', 'ver'), async (c) => {
  const empresaId = c.get('empresa_id');
  const { id } = c.req.param();
  
  try {
    // Verificar se perfil existe
    const perfil = await c.env.DB.prepare(`
      SELECT id, nome FROM perfis WHERE id = ? AND empresa_id = ?
    `).bind(id, empresaId).first();
    
    if (!perfil) {
      return c.json({ success: false, error: 'Perfil não encontrado' }, 404);
    }
    
    // Buscar todas as permissões
    const todasPermissoes = await c.env.DB.prepare(`
      SELECT id, modulo, acao, descricao FROM permissoes ORDER BY modulo, acao
    `).all();
    
    // Buscar permissões do perfil
    const permissoesPerfil = await c.env.DB.prepare(`
      SELECT permissao_id FROM perfis_permissoes WHERE perfil_id = ?
    `).bind(id).all<{ permissao_id: string }>();
    
    const permissoesAtivas = new Set(permissoesPerfil.results.map(p => p.permissao_id));
    
    // Montar matriz
    const modulosMap: { [key: string]: any } = {};
    
    for (const perm of todasPermissoes.results as any[]) {
      if (!modulosMap[perm.modulo]) {
        modulosMap[perm.modulo] = {
          modulo: perm.modulo,
          acoes: {}
        };
      }
      
      modulosMap[perm.modulo].acoes[perm.acao] = {
        id: perm.id,
        descricao: perm.descricao,
        ativo: permissoesAtivas.has(perm.id)
      };
    }
    
    return c.json({
      success: true,
      data: {
        perfil,
        matriz: Object.values(modulosMap)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar matriz:', error);
    return c.json({ success: false, error: 'Erro ao buscar matriz de permissões' }, 500);
  }
});

export default perfis;
