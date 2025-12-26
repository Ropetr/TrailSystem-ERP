// =============================================
// PLANAC ERP - Rotas de Configuração de Empresas
// =============================================
// Configurações específicas por empresa (IBPT, fiscal, etc)
// Atualizado: 26/12/2025 - Adaptado para API Unificada

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';
import { EmpresaConfigService } from '../services/empresas/empresa-config-service';

const empresasConfig = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware de autenticação para todas as rotas
empresasConfig.use('/*', requireAuth());

// Schemas de validação
const ibptConfigSchema = z.object({
  habilitado: z.boolean(),
  token_ibpt: z.string().optional(),
  uf_padrao: z.string().length(2).optional(),
  exibir_tributos_nfe: z.boolean().optional(),
  exibir_tributos_nfce: z.boolean().optional(),
  fonte_dados: z.enum(['api', 'csv', 'cache']).optional(),
  notificar_atualizacoes: z.boolean().optional(),
  emails_notificacao: z.array(z.string().email()).optional(),
  whatsapp_notificacao: z.string().optional()
});

const fiscalConfigSchema = z.object({
  ambiente: z.enum(['homologacao', 'producao']),
  serie_nfe: z.number().min(1).max(999).optional(),
  serie_nfce: z.number().min(1).max(999).optional(),
  serie_nfse: z.number().min(1).max(999).optional(),
  csc_nfce: z.string().optional(),
  csc_id_nfce: z.string().optional(),
  regime_tributario: z.enum(['simples_nacional', 'lucro_presumido', 'lucro_real']).optional(),
  certificado_id: z.string().uuid().optional()
});

// =============================================
// CONFIGURAÇÕES GERAIS
// =============================================

// GET /empresas-config - Obter configurações da empresa
empresasConfig.get('/', requirePermission('empresa', 'configurar'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const service = new EmpresaConfigService(c.env.DB);
    const config = await service.getConfig(usuario.empresa_id);
    
    return c.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    console.error('[EMPRESAS-CONFIG] Erro ao obter config:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao obter configurações'
    }, 500);
  }
});

// PATCH /empresas-config - Atualizar configurações gerais
empresasConfig.patch('/', requirePermission('empresa', 'configurar'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const body = await c.req.json();
    const service = new EmpresaConfigService(c.env.DB);
    
    const configAnterior = await service.getConfig(usuario.empresa_id);
    const resultado = await service.updateConfig(usuario.empresa_id, body);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'atualizar_config',
      tabela: 'empresas_config',
      dados_anteriores: configAnterior,
      dados_novos: body
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'Configurações atualizadas'
    });
  } catch (error: any) {
    console.error('[EMPRESAS-CONFIG] Erro ao atualizar:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao atualizar configurações'
    }, 500);
  }
});

// =============================================
// CONFIGURAÇÕES IBPT
// =============================================

// GET /empresas-config/ibpt - Obter configurações IBPT
empresasConfig.get('/ibpt', requirePermission('fiscal', 'consultar'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const config = await c.env.DB.prepare(`
      SELECT ibpt_config FROM empresas_config WHERE empresa_id = ?
    `).bind(usuario.empresa_id).first<{ ibpt_config: string }>();
    
    const ibptConfig = config?.ibpt_config 
      ? JSON.parse(config.ibpt_config)
      : {
          habilitado: true,
          uf_padrao: 'PR',
          exibir_tributos_nfe: true,
          exibir_tributos_nfce: true,
          fonte_dados: 'cache',
          notificar_atualizacoes: true
        };
    
    return c.json({
      success: true,
      data: ibptConfig
    });
  } catch (error: any) {
    console.error('[EMPRESAS-CONFIG] Erro ao obter IBPT:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao obter configurações IBPT'
    }, 500);
  }
});

// PATCH /empresas-config/ibpt - Atualizar configurações IBPT
empresasConfig.patch('/ibpt', requirePermission('fiscal', 'configurar'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const body = await c.req.json();
    const validado = ibptConfigSchema.parse(body);
    
    // Obter config atual
    const configAtual = await c.env.DB.prepare(`
      SELECT ibpt_config FROM empresas_config WHERE empresa_id = ?
    `).bind(usuario.empresa_id).first<{ ibpt_config: string }>();
    
    const ibptAnterior = configAtual?.ibpt_config 
      ? JSON.parse(configAtual.ibpt_config) 
      : {};
    
    // Merge com config existente
    const novoConfig = { ...ibptAnterior, ...validado };
    
    // Verificar se registro existe
    const existe = await c.env.DB.prepare(`
      SELECT 1 FROM empresas_config WHERE empresa_id = ?
    `).bind(usuario.empresa_id).first();
    
    if (existe) {
      await c.env.DB.prepare(`
        UPDATE empresas_config 
        SET ibpt_config = ?, updated_at = datetime('now')
        WHERE empresa_id = ?
      `).bind(JSON.stringify(novoConfig), usuario.empresa_id).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO empresas_config (empresa_id, ibpt_config, created_at, updated_at)
        VALUES (?, ?, datetime('now'), datetime('now'))
      `).bind(usuario.empresa_id, JSON.stringify(novoConfig)).run();
    }
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'atualizar_config_ibpt',
      tabela: 'empresas_config',
      dados_anteriores: ibptAnterior,
      dados_novos: novoConfig
    });
    
    return c.json({
      success: true,
      data: novoConfig,
      message: 'Configurações IBPT atualizadas'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      }, 400);
    }
    
    console.error('[EMPRESAS-CONFIG] Erro ao atualizar IBPT:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao atualizar configurações IBPT'
    }, 500);
  }
});

// =============================================
// CONFIGURAÇÕES FISCAIS
// =============================================

// GET /empresas-config/fiscal - Obter configurações fiscais
empresasConfig.get('/fiscal', requirePermission('fiscal', 'consultar'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const config = await c.env.DB.prepare(`
      SELECT fiscal_config FROM empresas_config WHERE empresa_id = ?
    `).bind(usuario.empresa_id).first<{ fiscal_config: string }>();
    
    const fiscalConfig = config?.fiscal_config 
      ? JSON.parse(config.fiscal_config)
      : {
          ambiente: 'homologacao',
          serie_nfe: 1,
          serie_nfce: 1,
          serie_nfse: 1
        };
    
    return c.json({
      success: true,
      data: fiscalConfig
    });
  } catch (error: any) {
    console.error('[EMPRESAS-CONFIG] Erro ao obter fiscal:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao obter configurações fiscais'
    }, 500);
  }
});

// PATCH /empresas-config/fiscal - Atualizar configurações fiscais
empresasConfig.patch('/fiscal', requirePermission('fiscal', 'configurar'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const body = await c.req.json();
    const validado = fiscalConfigSchema.parse(body);
    
    // Obter config atual
    const configAtual = await c.env.DB.prepare(`
      SELECT fiscal_config FROM empresas_config WHERE empresa_id = ?
    `).bind(usuario.empresa_id).first<{ fiscal_config: string }>();
    
    const fiscalAnterior = configAtual?.fiscal_config 
      ? JSON.parse(configAtual.fiscal_config) 
      : {};
    
    // Merge com config existente
    const novoConfig = { ...fiscalAnterior, ...validado };
    
    // Verificar se registro existe
    const existe = await c.env.DB.prepare(`
      SELECT 1 FROM empresas_config WHERE empresa_id = ?
    `).bind(usuario.empresa_id).first();
    
    if (existe) {
      await c.env.DB.prepare(`
        UPDATE empresas_config 
        SET fiscal_config = ?, updated_at = datetime('now')
        WHERE empresa_id = ?
      `).bind(JSON.stringify(novoConfig), usuario.empresa_id).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO empresas_config (empresa_id, fiscal_config, created_at, updated_at)
        VALUES (?, ?, datetime('now'), datetime('now'))
      `).bind(usuario.empresa_id, JSON.stringify(novoConfig)).run();
    }
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'atualizar_config_fiscal',
      tabela: 'empresas_config',
      dados_anteriores: fiscalAnterior,
      dados_novos: novoConfig
    });
    
    return c.json({
      success: true,
      data: novoConfig,
      message: 'Configurações fiscais atualizadas'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      }, 400);
    }
    
    console.error('[EMPRESAS-CONFIG] Erro ao atualizar fiscal:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao atualizar configurações fiscais'
    }, 500);
  }
});

// =============================================
// RESET / DEFAULTS
// =============================================

// POST /empresas-config/reset - Restaurar configurações padrão
empresasConfig.post('/reset', requirePermission('empresa', 'configurar'), async (c) => {
  const usuario = c.get('usuario');
  const { modulo } = await c.req.json();
  
  try {
    let campo = '';
    let valorPadrao = '';
    
    switch (modulo) {
      case 'ibpt':
        campo = 'ibpt_config';
        valorPadrao = JSON.stringify({
          habilitado: true,
          uf_padrao: 'PR',
          exibir_tributos_nfe: true,
          exibir_tributos_nfce: true,
          fonte_dados: 'cache',
          notificar_atualizacoes: true
        });
        break;
        
      case 'fiscal':
        campo = 'fiscal_config';
        valorPadrao = JSON.stringify({
          ambiente: 'homologacao',
          serie_nfe: 1,
          serie_nfce: 1,
          serie_nfse: 1
        });
        break;
        
      default:
        return c.json({
          success: false,
          error: 'Módulo inválido. Válidos: ibpt, fiscal'
        }, 400);
    }
    
    await c.env.DB.prepare(`
      UPDATE empresas_config 
      SET ${campo} = ?, updated_at = datetime('now')
      WHERE empresa_id = ?
    `).bind(valorPadrao, usuario.empresa_id).run();
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: `reset_config_${modulo}`,
      tabela: 'empresas_config',
      dados_novos: { modulo, restaurado: true }
    });
    
    return c.json({
      success: true,
      message: `Configurações de ${modulo} restauradas para o padrão`
    });
  } catch (error: any) {
    console.error('[EMPRESAS-CONFIG] Erro ao resetar:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao restaurar configurações'
    }, 500);
  }
});

export default empresasConfig;
