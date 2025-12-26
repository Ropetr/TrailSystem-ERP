// =============================================
// PLANAC ERP - Rotas de Certificados Digitais
// =============================================
// Gestão de Certificados A1 para emissão fiscal
// Atualizado: 26/12/2025 - Adaptado para API Unificada

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';
import { CertificadoService } from '../services/empresas/certificado-service';

const certificados = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware de autenticação para todas as rotas
certificados.use('/*', requireAuth());

// =============================================
// UPLOAD E GESTÃO
// =============================================

// POST /certificados/upload - Upload de certificado A1
certificados.post('/upload', requirePermission('fiscal', 'configurar'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const contentType = c.req.header('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return c.json({
        success: false,
        error: 'Content-Type deve ser multipart/form-data'
      }, 400);
    }
    
    const formData = await c.req.formData();
    const arquivo = formData.get('arquivo') as File;
    const senha = formData.get('senha') as string;
    
    if (!arquivo) {
      return c.json({
        success: false,
        error: 'Arquivo do certificado não enviado'
      }, 400);
    }
    
    if (!senha) {
      return c.json({
        success: false,
        error: 'Senha do certificado não informada'
      }, 400);
    }
    
    // Validar extensão
    const nomeArquivo = arquivo.name.toLowerCase();
    if (!nomeArquivo.endsWith('.pfx') && !nomeArquivo.endsWith('.p12')) {
      return c.json({
        success: false,
        error: 'Arquivo deve ser .pfx ou .p12'
      }, 400);
    }
    
    const service = new CertificadoService({
      DB: c.env.DB,
      R2_CERTIFICADOS: c.env.R2_CERTIFICADOS,
      ENCRYPTION_KEY: c.env.ENCRYPTION_KEY,
      NUVEM_FISCAL_CLIENT_ID: c.env.NUVEM_FISCAL_CLIENT_ID,
      NUVEM_FISCAL_CLIENT_SECRET: c.env.NUVEM_FISCAL_CLIENT_SECRET
    });
    
    const arrayBuffer = await arquivo.arrayBuffer();
    const resultado = await service.upload({
      empresa_id: usuario.empresa_id,
      arquivo: new Uint8Array(arrayBuffer),
      nome_arquivo: arquivo.name,
      senha: senha
    });
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'upload_certificado',
      tabela: 'empresas_certificados',
      registro_id: resultado.id,
      dados_novos: {
        arquivo: arquivo.name,
        validade: resultado.data_validade
      }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'Certificado enviado com sucesso'
    });
  } catch (error: any) {
    console.error('[CERTIFICADOS] Erro ao fazer upload:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao fazer upload do certificado'
    }, 500);
  }
});

// GET /certificados - Listar certificados da empresa
certificados.get('/', requirePermission('fiscal', 'consultar'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const resultado = await c.env.DB.prepare(`
      SELECT 
        id, empresa_id, tipo, arquivo_nome,
        cnpj, razao_social, data_validade, data_upload,
        sincronizado_nuvem_fiscal, nuvem_fiscal_id, ativo,
        created_at, updated_at
      FROM empresas_certificados 
      WHERE empresa_id = ?
      ORDER BY created_at DESC
    `).bind(usuario.empresa_id).all();
    
    // Adicionar dias restantes
    const certificadosComDias = resultado.results.map((cert: any) => ({
      ...cert,
      dias_restantes: Math.ceil(
        (new Date(cert.data_validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      status: cert.ativo 
        ? (new Date(cert.data_validade) > new Date() ? 'valido' : 'vencido')
        : 'inativo'
    }));
    
    return c.json({
      success: true,
      data: certificadosComDias
    });
  } catch (error: any) {
    console.error('[CERTIFICADOS] Erro ao listar:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao listar certificados'
    }, 500);
  }
});

// GET /certificados/:id - Detalhes de um certificado
certificados.get('/:id', requirePermission('fiscal', 'consultar'), async (c) => {
  const usuario = c.get('usuario');
  const { id } = c.req.param();
  
  try {
    const certificado = await c.env.DB.prepare(`
      SELECT 
        id, empresa_id, tipo, arquivo_nome,
        cnpj, razao_social, data_validade, data_upload,
        sincronizado_nuvem_fiscal, nuvem_fiscal_id, ativo,
        created_at, updated_at
      FROM empresas_certificados 
      WHERE id = ? AND empresa_id = ?
    `).bind(id, usuario.empresa_id).first();
    
    if (!certificado) {
      return c.json({
        success: false,
        error: 'Certificado não encontrado'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: {
        ...certificado,
        dias_restantes: Math.ceil(
          (new Date(certificado.data_validade as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      }
    });
  } catch (error: any) {
    console.error('[CERTIFICADOS] Erro ao buscar:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao buscar certificado'
    }, 500);
  }
});

// DELETE /certificados/:id - Remover certificado
certificados.delete('/:id', requirePermission('fiscal', 'configurar'), async (c) => {
  const usuario = c.get('usuario');
  const { id } = c.req.param();
  
  try {
    // Verificar se existe
    const certificado = await c.env.DB.prepare(`
      SELECT * FROM empresas_certificados 
      WHERE id = ? AND empresa_id = ?
    `).bind(id, usuario.empresa_id).first();
    
    if (!certificado) {
      return c.json({
        success: false,
        error: 'Certificado não encontrado'
      }, 404);
    }
    
    const service = new CertificadoService({
      DB: c.env.DB,
      R2_CERTIFICADOS: c.env.R2_CERTIFICADOS,
      ENCRYPTION_KEY: c.env.ENCRYPTION_KEY
    });
    
    await service.remover(id, usuario.empresa_id);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'remover_certificado',
      tabela: 'empresas_certificados',
      registro_id: id,
      dados_anteriores: { cnpj: certificado.cnpj }
    });
    
    return c.json({
      success: true,
      message: 'Certificado removido com sucesso'
    });
  } catch (error: any) {
    console.error('[CERTIFICADOS] Erro ao remover:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao remover certificado'
    }, 500);
  }
});

// =============================================
// SINCRONIZAÇÃO NUVEM FISCAL
// =============================================

// POST /certificados/:id/sincronizar - Sincronizar com Nuvem Fiscal
certificados.post('/:id/sincronizar', requirePermission('fiscal', 'configurar'), async (c) => {
  const usuario = c.get('usuario');
  const { id } = c.req.param();
  
  try {
    const service = new CertificadoService({
      DB: c.env.DB,
      R2_CERTIFICADOS: c.env.R2_CERTIFICADOS,
      ENCRYPTION_KEY: c.env.ENCRYPTION_KEY,
      NUVEM_FISCAL_CLIENT_ID: c.env.NUVEM_FISCAL_CLIENT_ID,
      NUVEM_FISCAL_CLIENT_SECRET: c.env.NUVEM_FISCAL_CLIENT_SECRET
    });
    
    const resultado = await service.sincronizarNuvemFiscal(id, usuario.empresa_id);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'sincronizar_certificado',
      tabela: 'empresas_certificados',
      registro_id: id,
      dados_novos: { nuvem_fiscal_id: resultado.nuvem_fiscal_id }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'Certificado sincronizado com Nuvem Fiscal'
    });
  } catch (error: any) {
    console.error('[CERTIFICADOS] Erro ao sincronizar:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao sincronizar certificado'
    }, 500);
  }
});

// =============================================
// VALIDAÇÃO E STATUS
// =============================================

// POST /certificados/:id/validar - Validar certificado
certificados.post('/:id/validar', requirePermission('fiscal', 'consultar'), async (c) => {
  const usuario = c.get('usuario');
  const { id } = c.req.param();
  const { senha } = await c.req.json();
  
  try {
    const service = new CertificadoService({
      DB: c.env.DB,
      R2_CERTIFICADOS: c.env.R2_CERTIFICADOS,
      ENCRYPTION_KEY: c.env.ENCRYPTION_KEY
    });
    
    const resultado = await service.validar(id, usuario.empresa_id, senha);
    
    return c.json({
      success: true,
      data: resultado
    });
  } catch (error: any) {
    console.error('[CERTIFICADOS] Erro ao validar:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao validar certificado'
    }, 500);
  }
});

// GET /certificados/vencimentos - Verificar certificados a vencer
certificados.get('/vencimentos/proximos', requirePermission('fiscal', 'consultar'), async (c) => {
  const usuario = c.get('usuario');
  const { dias = '30' } = c.req.query();
  
  try {
    const resultado = await c.env.DB.prepare(`
      SELECT 
        id, cnpj, razao_social, data_validade,
        julianday(data_validade) - julianday('now') as dias_restantes
      FROM empresas_certificados 
      WHERE empresa_id = ?
        AND ativo = 1
        AND data_validade BETWEEN date('now') AND date('now', '+' || ? || ' days')
      ORDER BY data_validade ASC
    `).bind(usuario.empresa_id, parseInt(dias)).all();
    
    return c.json({
      success: true,
      data: resultado.results
    });
  } catch (error: any) {
    console.error('[CERTIFICADOS] Erro ao verificar vencimentos:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao verificar vencimentos'
    }, 500);
  }
});

// PATCH /certificados/:id/ativar - Ativar/desativar certificado
certificados.patch('/:id/ativar', requirePermission('fiscal', 'configurar'), async (c) => {
  const usuario = c.get('usuario');
  const { id } = c.req.param();
  const { ativo } = await c.req.json();
  
  try {
    await c.env.DB.prepare(`
      UPDATE empresas_certificados 
      SET ativo = ?, updated_at = datetime('now')
      WHERE id = ? AND empresa_id = ?
    `).bind(ativo ? 1 : 0, id, usuario.empresa_id).run();
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: ativo ? 'ativar_certificado' : 'desativar_certificado',
      tabela: 'empresas_certificados',
      registro_id: id
    });
    
    return c.json({
      success: true,
      message: ativo ? 'Certificado ativado' : 'Certificado desativado'
    });
  } catch (error: any) {
    console.error('[CERTIFICADOS] Erro ao atualizar status:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao atualizar status'
    }, 500);
  }
});

export default certificados;
