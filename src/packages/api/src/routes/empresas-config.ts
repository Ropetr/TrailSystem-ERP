// =============================================
// PLANAC ERP - Empresas Config Routes
// Configurações locais das empresas
// =============================================

import { Hono } from 'hono';
import {
  buscarConfigEmpresa,
  listarConfigEmpresas,
  salvarConfigEmpresa,
  atualizarTokenIBPT,
  removerTokenIBPT,
  proximoNumeroNFe,
  proximoNumeroNFCe,
  desativarEmpresa,
  reativarEmpresa,
} from '../services/empresas/empresa-config-service';

// Tipos do ambiente
interface Env {
  DB: D1Database;
}

const empresasConfig = new Hono<{ Bindings: Env }>();

// ===== LISTAGEM =====

/**
 * Lista empresas configuradas
 * GET /empresas-config?ativas=true
 */
empresasConfig.get('/', async (c) => {
  try {
    const { ativas } = c.req.query();
    const apenasAtivas = ativas !== 'false';
    
    const empresas = await listarConfigEmpresas(c.env.DB, apenasAtivas);
    return c.json({ data: empresas, total: empresas.length });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== CONSULTA =====

/**
 * Busca configuração da empresa
 * GET /empresas-config/:cnpj
 */
empresasConfig.get('/:cnpj', async (c) => {
  try {
    const { cnpj } = c.req.param();
    const config = await buscarConfigEmpresa(c.env.DB, cnpj);
    
    if (!config) {
      return c.json({ error: 'Empresa não encontrada' }, 404);
    }
    
    return c.json(config);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== CRIAR/ATUALIZAR =====

/**
 * Cria ou atualiza configuração
 * POST /empresas-config
 * Body: { cnpj, razao_social, ibpt_token, ... }
 */
empresasConfig.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.cnpj) {
      return c.json({ error: 'CNPJ é obrigatório' }, 400);
    }
    
    const config = await salvarConfigEmpresa(c.env.DB, body);
    return c.json(config, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Atualiza configuração existente
 * PUT /empresas-config/:cnpj
 */
empresasConfig.put('/:cnpj', async (c) => {
  try {
    const { cnpj } = c.req.param();
    const body = await c.req.json();
    
    const config = await salvarConfigEmpresa(c.env.DB, { ...body, cnpj });
    return c.json(config);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== TOKEN IBPT =====

/**
 * Atualiza token IBPT da empresa
 * PUT /empresas-config/:cnpj/ibpt
 * Body: { token, uf? }
 */
empresasConfig.put('/:cnpj/ibpt', async (c) => {
  try {
    const { cnpj } = c.req.param();
    const { token, uf } = await c.req.json();
    
    if (!token) {
      return c.json({ error: 'Token é obrigatório' }, 400);
    }
    
    const config = await atualizarTokenIBPT(c.env.DB, cnpj, token, uf);
    
    if (!config) {
      return c.json({ error: 'Empresa não encontrada' }, 404);
    }
    
    return c.json({ 
      success: true, 
      message: 'Token IBPT atualizado',
      ibpt_token: config.ibpt_token ? '***configurado***' : null,
      ibpt_uf: config.ibpt_uf
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Remove token IBPT da empresa
 * DELETE /empresas-config/:cnpj/ibpt
 */
empresasConfig.delete('/:cnpj/ibpt', async (c) => {
  try {
    const { cnpj } = c.req.param();
    
    const removido = await removerTokenIBPT(c.env.DB, cnpj);
    
    if (!removido) {
      return c.json({ error: 'Empresa não encontrada' }, 404);
    }
    
    return c.json({ success: true, message: 'Token IBPT removido' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Consulta token IBPT (apenas verifica se existe)
 * GET /empresas-config/:cnpj/ibpt
 */
empresasConfig.get('/:cnpj/ibpt', async (c) => {
  try {
    const { cnpj } = c.req.param();
    const config = await buscarConfigEmpresa(c.env.DB, cnpj);
    
    if (!config) {
      return c.json({ error: 'Empresa não encontrada' }, 404);
    }
    
    return c.json({
      cnpj: config.cnpj,
      ibpt_configurado: !!config.ibpt_token,
      ibpt_uf: config.ibpt_uf,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== NUMERAÇÃO =====

/**
 * Obtém próximo número de NF-e
 * POST /empresas-config/:cnpj/nfe/proximo-numero
 */
empresasConfig.post('/:cnpj/nfe/proximo-numero', async (c) => {
  try {
    const { cnpj } = c.req.param();
    const { serie, numero } = await proximoNumeroNFe(c.env.DB, cnpj);
    
    return c.json({ serie, numero });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Obtém próximo número de NFC-e
 * POST /empresas-config/:cnpj/nfce/proximo-numero
 */
empresasConfig.post('/:cnpj/nfce/proximo-numero', async (c) => {
  try {
    const { cnpj } = c.req.param();
    const { serie, numero } = await proximoNumeroNFCe(c.env.DB, cnpj);
    
    return c.json({ serie, numero });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== ATIVAÇÃO =====

/**
 * Desativa empresa
 * DELETE /empresas-config/:cnpj
 */
empresasConfig.delete('/:cnpj', async (c) => {
  try {
    const { cnpj } = c.req.param();
    const desativada = await desativarEmpresa(c.env.DB, cnpj);
    
    if (!desativada) {
      return c.json({ error: 'Empresa não encontrada' }, 404);
    }
    
    return c.json({ success: true, message: 'Empresa desativada' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Reativa empresa
 * POST /empresas-config/:cnpj/reativar
 */
empresasConfig.post('/:cnpj/reativar', async (c) => {
  try {
    const { cnpj } = c.req.param();
    const reativada = await reativarEmpresa(c.env.DB, cnpj);
    
    if (!reativada) {
      return c.json({ error: 'Empresa não encontrada' }, 404);
    }
    
    return c.json({ success: true, message: 'Empresa reativada' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default empresasConfig;
