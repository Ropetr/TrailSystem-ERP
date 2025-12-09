// =============================================
// 🔐 PLANAC ERP - Rotas de Autenticação
// =============================================
// Arquivo: src/api/src/routes/auth.routes.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { 
  hashSenha, 
  verificarSenha, 
  gerarToken, 
  gerarRefreshToken,
  hashToken,
  criarSessao,
  revogarSessao,
  revogarTodasSessoes,
  registrarAuditoria
} from '../services/auth.service';
import { authMiddleware, getClientIP, getUserAgent } from '../middleware/auth.middleware';

// Tipos
interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
}

// Schemas de Validação
const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória')
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token obrigatório')
});

const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Senha atual obrigatória'),
  novaSenha: z.string().min(8, 'Nova senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter ao menos um número')
});

const recuperarSenhaSchema = z.object({
  email: z.string().email('E-mail inválido')
});

// Criar router
const auth = new Hono<{ Bindings: Env }>();

// =============================================
// POST /auth/login
// =============================================
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, senha } = c.req.valid('json');
  const ip = getClientIP(c);
  const userAgent = getUserAgent(c);
  
  try {
    // Buscar usuário
    const usuario = await c.env.DB.prepare(`
      SELECT 
        u.id, u.empresa_id, u.nome, u.email, u.senha_hash, u.avatar_url,
        u.ativo, u.bloqueado, u.tentativas_login, u.bloqueado_ate,
        u.two_factor_ativo
      FROM usuarios u
      WHERE u.email = ?
    `).bind(email.toLowerCase()).first<any>();
    
    if (!usuario) {
      return c.json({ success: false, error: 'Credenciais inválidas' }, 401);
    }
    
    // Verificar se está bloqueado
    if (usuario.bloqueado && usuario.bloqueado_ate) {
      const bloqueadoAte = new Date(usuario.bloqueado_ate);
      if (bloqueadoAte > new Date()) {
        return c.json({ 
          success: false, 
          error: `Conta bloqueada até ${bloqueadoAte.toLocaleString('pt-BR')}` 
        }, 401);
      }
      // Desbloquear se o tempo passou
      await c.env.DB.prepare(`
        UPDATE usuarios SET bloqueado = 0, tentativas_login = 0, bloqueado_ate = NULL WHERE id = ?
      `).bind(usuario.id).run();
    }
    
    // Verificar se está ativo
    if (!usuario.ativo) {
      return c.json({ success: false, error: 'Usuário inativo' }, 401);
    }
    
    // Verificar senha
    const senhaValida = await verificarSenha(senha, usuario.senha_hash);
    
    if (!senhaValida) {
      // Incrementar tentativas
      const tentativas = (usuario.tentativas_login || 0) + 1;
      
      if (tentativas >= 5) {
        // Bloquear por 15 minutos
        const bloqueadoAte = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await c.env.DB.prepare(`
          UPDATE usuarios SET tentativas_login = ?, bloqueado = 1, bloqueado_ate = ? WHERE id = ?
        `).bind(tentativas, bloqueadoAte, usuario.id).run();
        
        await registrarAuditoria(c.env.DB, usuario.empresa_id, usuario.id, 
          'bloqueio', 'auth', 'Conta bloqueada por excesso de tentativas', ip, userAgent);
        
        return c.json({ 
          success: false, 
          error: 'Conta bloqueada por excesso de tentativas. Tente novamente em 15 minutos.' 
        }, 401);
      }
      
      await c.env.DB.prepare(`
        UPDATE usuarios SET tentativas_login = ? WHERE id = ?
      `).bind(tentativas, usuario.id).run();
      
      return c.json({ success: false, error: 'Credenciais inválidas' }, 401);
    }
    
    // TODO: Verificar 2FA se ativo
    if (usuario.two_factor_ativo) {
      // Por enquanto, retornar que precisa de 2FA
      return c.json({ 
        success: false, 
        requires2FA: true,
        error: '2FA necessário (não implementado ainda)' 
      }, 401);
    }
    
    // Buscar perfis e permissões
    const perfisResult = await c.env.DB.prepare(`
      SELECT p.id, p.nome
      FROM perfis p
      INNER JOIN usuarios_perfis up ON up.perfil_id = p.id
      WHERE up.usuario_id = ? AND p.ativo = 1
    `).bind(usuario.id).all<{ id: string; nome: string }>();
    
    const perfisIds = perfisResult.results.map(p => p.id);
    
    // Buscar permissões dos perfis
    let permissoes: string[] = [];
    if (perfisIds.length > 0) {
      const placeholders = perfisIds.map(() => '?').join(',');
      const permissoesResult = await c.env.DB.prepare(`
        SELECT DISTINCT p.modulo || ':' || p.acao as permissao
        FROM permissoes p
        INNER JOIN perfis_permissoes pp ON pp.permissao_id = p.id
        WHERE pp.perfil_id IN (${placeholders})
      `).bind(...perfisIds).all<{ permissao: string }>();
      
      permissoes = permissoesResult.results.map(p => p.permissao);
    }
    
    // Gerar tokens
    const tokenPayload = {
      sub: usuario.id,
      email: usuario.email,
      empresa_id: usuario.empresa_id,
      perfis: perfisIds,
      permissoes: permissoes
    };
    
    const token = await gerarToken(tokenPayload, c.env.JWT_SECRET);
    const refreshToken = await gerarRefreshToken(usuario.id, c.env.JWT_SECRET);
    
    // Criar sessão
    const tokenHash = await hashToken(token);
    const refreshTokenHash = await hashToken(refreshToken);
    
    await criarSessao(c.env.DB, c.env.SESSIONS, usuario.id, tokenHash, refreshTokenHash, ip, userAgent);
    
    // Atualizar último login e zerar tentativas
    await c.env.DB.prepare(`
      UPDATE usuarios SET ultimo_login = datetime('now'), tentativas_login = 0 WHERE id = ?
    `).bind(usuario.id).run();
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, usuario.empresa_id, usuario.id, 
      'login', 'auth', 'Login realizado com sucesso', ip, userAgent);
    
    return c.json({
      success: true,
      token,
      refreshToken,
      expiresIn: 8 * 60 * 60, // 8 horas em segundos
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        empresa_id: usuario.empresa_id,
        avatar_url: usuario.avatar_url,
        perfis: perfisResult.results
      }
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    return c.json({ success: false, error: 'Erro interno no servidor' }, 500);
  }
});

// =============================================
// POST /auth/logout
// =============================================
auth.post('/logout', authMiddleware(), async (c) => {
  const user = c.get('user');
  const ip = getClientIP(c);
  const userAgent = getUserAgent(c);
  
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    
    if (token) {
      const tokenHash = await hashToken(token);
      await revogarSessao(c.env.DB, c.env.SESSIONS, tokenHash);
    }
    
    await registrarAuditoria(c.env.DB, user.empresa_id, user.id, 
      'logout', 'auth', 'Logout realizado', ip, userAgent);
    
    return c.json({ success: true, message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    return c.json({ success: false, error: 'Erro ao realizar logout' }, 500);
  }
});

// =============================================
// POST /auth/logout-all
// =============================================
auth.post('/logout-all', authMiddleware(), async (c) => {
  const user = c.get('user');
  const ip = getClientIP(c);
  const userAgent = getUserAgent(c);
  
  try {
    await revogarTodasSessoes(c.env.DB, c.env.SESSIONS, user.id);
    
    await registrarAuditoria(c.env.DB, user.empresa_id, user.id, 
      'logout_all', 'auth', 'Todas as sessões encerradas', ip, userAgent);
    
    return c.json({ success: true, message: 'Todas as sessões encerradas' });
  } catch (error) {
    console.error('Erro no logout-all:', error);
    return c.json({ success: false, error: 'Erro ao encerrar sessões' }, 500);
  }
});

// =============================================
// GET /auth/me
// =============================================
auth.get('/me', authMiddleware(), async (c) => {
  const user = c.get('user');
  
  try {
    const usuario = await c.env.DB.prepare(`
      SELECT 
        u.id, u.nome, u.email, u.telefone, u.avatar_url, u.cargo,
        u.two_factor_ativo, u.ultimo_login,
        e.razao_social as empresa_nome, e.nome_fantasia as empresa_fantasia
      FROM usuarios u
      INNER JOIN empresas e ON e.id = u.empresa_id
      WHERE u.id = ?
    `).bind(user.id).first<any>();
    
    if (!usuario) {
      return c.json({ success: false, error: 'Usuário não encontrado' }, 404);
    }
    
    // Buscar perfis
    const perfis = await c.env.DB.prepare(`
      SELECT p.id, p.nome
      FROM perfis p
      INNER JOIN usuarios_perfis up ON up.perfil_id = p.id
      WHERE up.usuario_id = ?
    `).bind(user.id).all<{ id: string; nome: string }>();
    
    return c.json({
      success: true,
      usuario: {
        ...usuario,
        perfis: perfis.results,
        permissoes: user.permissoes
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return c.json({ success: false, error: 'Erro ao buscar dados do usuário' }, 500);
  }
});

// =============================================
// POST /auth/alterar-senha
// =============================================
auth.post('/alterar-senha', authMiddleware(), zValidator('json', alterarSenhaSchema), async (c) => {
  const user = c.get('user');
  const { senhaAtual, novaSenha } = c.req.valid('json');
  const ip = getClientIP(c);
  const userAgent = getUserAgent(c);
  
  try {
    // Buscar senha atual
    const usuario = await c.env.DB.prepare(`
      SELECT senha_hash FROM usuarios WHERE id = ?
    `).bind(user.id).first<{ senha_hash: string }>();
    
    if (!usuario) {
      return c.json({ success: false, error: 'Usuário não encontrado' }, 404);
    }
    
    // Verificar senha atual
    const senhaValida = await verificarSenha(senhaAtual, usuario.senha_hash);
    if (!senhaValida) {
      return c.json({ success: false, error: 'Senha atual incorreta' }, 400);
    }
    
    // Hash da nova senha
    const novaSenhaHash = await hashSenha(novaSenha);
    
    // Atualizar senha
    await c.env.DB.prepare(`
      UPDATE usuarios SET senha_hash = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(novaSenhaHash, user.id).run();
    
    // Revogar outras sessões (segurança)
    const authHeader = c.req.header('Authorization');
    const tokenAtual = authHeader?.substring(7);
    const tokenHashAtual = tokenAtual ? await hashToken(tokenAtual) : null;
    
    // Revogar todas as sessões exceto a atual
    await c.env.DB.prepare(`
      UPDATE usuarios_sessoes SET revogado = 1 
      WHERE usuario_id = ? AND token_hash != ?
    `).bind(user.id, tokenHashAtual).run();
    
    await registrarAuditoria(c.env.DB, user.empresa_id, user.id, 
      'alterar_senha', 'auth', 'Senha alterada com sucesso', ip, userAgent);
    
    return c.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return c.json({ success: false, error: 'Erro ao alterar senha' }, 500);
  }
});

// =============================================
// GET /auth/sessoes
// =============================================
auth.get('/sessoes', authMiddleware(), async (c) => {
  const user = c.get('user');
  
  try {
    const sessoes = await c.env.DB.prepare(`
      SELECT id, ip_address, user_agent, device_info, created_at, expires_at
      FROM usuarios_sessoes
      WHERE usuario_id = ? AND revogado = 0 AND expires_at > datetime('now')
      ORDER BY created_at DESC
    `).bind(user.id).all();
    
    return c.json({
      success: true,
      sessoes: sessoes.results
    });
  } catch (error) {
    console.error('Erro ao listar sessões:', error);
    return c.json({ success: false, error: 'Erro ao listar sessões' }, 500);
  }
});

export default auth;
