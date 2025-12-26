// =============================================
// PLANAC ERP - Rotas Fiscais (Nuvem Fiscal)
// =============================================
// Endpoints para documentos fiscais eletrônicos
// NF-e, NFC-e, NFS-e, CT-e, MDF-e
// Atualizado: 26/12/2025 - Adaptado para API Unificada

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';
import { createNuvemFiscalService } from '../services/nuvem-fiscal';

const fiscal = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware de autenticação para todas as rotas
fiscal.use('/*', requireAuth());

// Helper para criar o service
const getService = (c: any) => createNuvemFiscalService({
  NUVEM_FISCAL_CLIENT_ID: c.env.NUVEM_FISCAL_CLIENT_ID,
  NUVEM_FISCAL_CLIENT_SECRET: c.env.NUVEM_FISCAL_CLIENT_SECRET,
  NUVEM_FISCAL_AMBIENTE: c.env.NUVEM_FISCAL_AMBIENTE,
  NUVEM_FISCAL_TOKEN_CACHE: c.env.KV_CACHE,
});

// =============================================
// CONSULTAS AUXILIARES (CEP, CNPJ)
// =============================================

// GET /fiscal/cep/:cep - Consultar CEP
fiscal.get('/cep/:cep', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const { cep } = c.req.param();
    const service = getService(c);
    const resultado = await service.consultarCEP(cep);
    
    return c.json({
      success: true,
      data: resultado
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao consultar CEP:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao consultar CEP'
    }, error.status || 500);
  }
});

// GET /fiscal/cnpj/:cnpj - Consultar CNPJ
fiscal.get('/cnpj/:cnpj', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const { cnpj } = c.req.param();
    const service = getService(c);
    const resultado = await service.consultarCNPJ(cnpj);
    
    return c.json({
      success: true,
      data: resultado
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao consultar CNPJ:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao consultar CNPJ'
    }, error.status || 500);
  }
});

// =============================================
// NF-e (Nota Fiscal Eletrônica)
// =============================================

// POST /fiscal/nfe/emitir - Emitir NF-e
fiscal.post('/nfe/emitir', requirePermission('fiscal', 'emitir_nfe'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const body = await c.req.json();
    const service = getService(c);
    
    const resultado = await service.emitirNFe(body);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'emitir_nfe',
      tabela: 'notas_fiscais',
      registro_id: resultado.id,
      dados_novos: { chave: resultado.chave, numero: resultado.numero }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'NF-e emitida com sucesso'
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao emitir NF-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao emitir NF-e'
    }, error.status || 500);
  }
});

// GET /fiscal/nfe/:chave - Consultar NF-e
fiscal.get('/nfe/:chave', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const { chave } = c.req.param();
    const service = getService(c);
    const resultado = await service.consultarNFe(chave);
    
    return c.json({
      success: true,
      data: resultado
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao consultar NF-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao consultar NF-e'
    }, error.status || 500);
  }
});

// POST /fiscal/nfe/:chave/cancelar - Cancelar NF-e
fiscal.post('/nfe/:chave/cancelar', requirePermission('fiscal', 'cancelar_nfe'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const { chave } = c.req.param();
    const { justificativa } = await c.req.json();
    
    if (!justificativa || justificativa.length < 15) {
      return c.json({
        success: false,
        error: 'Justificativa deve ter no mínimo 15 caracteres'
      }, 400);
    }
    
    const service = getService(c);
    const resultado = await service.cancelarNFe(chave, justificativa);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'cancelar_nfe',
      tabela: 'notas_fiscais',
      dados_novos: { chave, justificativa }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'NF-e cancelada com sucesso'
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao cancelar NF-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao cancelar NF-e'
    }, error.status || 500);
  }
});

// POST /fiscal/nfe/:chave/carta-correcao - Carta de Correção
fiscal.post('/nfe/:chave/carta-correcao', requirePermission('fiscal', 'emitir_nfe'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const { chave } = c.req.param();
    const { correcao } = await c.req.json();
    
    if (!correcao || correcao.length < 15) {
      return c.json({
        success: false,
        error: 'Correção deve ter no mínimo 15 caracteres'
      }, 400);
    }
    
    const service = getService(c);
    const resultado = await service.cartaCorrecaoNFe(chave, correcao);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'carta_correcao_nfe',
      tabela: 'notas_fiscais',
      dados_novos: { chave, correcao }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'Carta de correção registrada'
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao registrar carta de correção:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao registrar carta de correção'
    }, error.status || 500);
  }
});

// GET /fiscal/nfe/:chave/xml - Download XML
fiscal.get('/nfe/:chave/xml', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const { chave } = c.req.param();
    const service = getService(c);
    const xml = await service.downloadNFeXML(chave);
    
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="nfe-${chave}.xml"`
      }
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao baixar XML:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao baixar XML'
    }, error.status || 500);
  }
});

// GET /fiscal/nfe/:chave/pdf - Download PDF (DANFE)
fiscal.get('/nfe/:chave/pdf', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const { chave } = c.req.param();
    const service = getService(c);
    const pdf = await service.downloadNFePDF(chave);
    
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="danfe-${chave}.pdf"`
      }
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao baixar PDF:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao baixar PDF'
    }, error.status || 500);
  }
});

// =============================================
// NFC-e (Nota Fiscal Consumidor Eletrônica)
// =============================================

// POST /fiscal/nfce/emitir - Emitir NFC-e
fiscal.post('/nfce/emitir', requirePermission('fiscal', 'emitir_nfce'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const body = await c.req.json();
    const service = getService(c);
    
    const resultado = await service.emitirNFCe(body);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'emitir_nfce',
      tabela: 'notas_fiscais',
      registro_id: resultado.id,
      dados_novos: { chave: resultado.chave, numero: resultado.numero }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'NFC-e emitida com sucesso'
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao emitir NFC-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao emitir NFC-e'
    }, error.status || 500);
  }
});

// GET /fiscal/nfce/:chave - Consultar NFC-e
fiscal.get('/nfce/:chave', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const { chave } = c.req.param();
    const service = getService(c);
    const resultado = await service.consultarNFCe(chave);
    
    return c.json({
      success: true,
      data: resultado
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao consultar NFC-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao consultar NFC-e'
    }, error.status || 500);
  }
});

// POST /fiscal/nfce/:chave/cancelar - Cancelar NFC-e
fiscal.post('/nfce/:chave/cancelar', requirePermission('fiscal', 'cancelar_nfce'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const { chave } = c.req.param();
    const { justificativa } = await c.req.json();
    
    const service = getService(c);
    const resultado = await service.cancelarNFCe(chave, justificativa);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'cancelar_nfce',
      tabela: 'notas_fiscais',
      dados_novos: { chave, justificativa }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'NFC-e cancelada com sucesso'
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao cancelar NFC-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao cancelar NFC-e'
    }, error.status || 500);
  }
});

// =============================================
// NFS-e (Nota Fiscal de Serviços Eletrônica)
// =============================================

// POST /fiscal/nfse/emitir - Emitir NFS-e
fiscal.post('/nfse/emitir', requirePermission('fiscal', 'emitir_nfse'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const body = await c.req.json();
    const service = getService(c);
    
    const resultado = await service.emitirNFSe(body);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'emitir_nfse',
      tabela: 'notas_fiscais',
      registro_id: resultado.id,
      dados_novos: { numero: resultado.numero }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'NFS-e emitida com sucesso'
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao emitir NFS-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao emitir NFS-e'
    }, error.status || 500);
  }
});

// GET /fiscal/nfse/:id - Consultar NFS-e
fiscal.get('/nfse/:id', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c);
    const resultado = await service.consultarNFSe(id);
    
    return c.json({
      success: true,
      data: resultado
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao consultar NFS-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao consultar NFS-e'
    }, error.status || 500);
  }
});

// POST /fiscal/nfse/:id/cancelar - Cancelar NFS-e
fiscal.post('/nfse/:id/cancelar', requirePermission('fiscal', 'cancelar_nfse'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const { id } = c.req.param();
    const { justificativa } = await c.req.json();
    
    const service = getService(c);
    const resultado = await service.cancelarNFSe(id, justificativa);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'cancelar_nfse',
      tabela: 'notas_fiscais',
      dados_novos: { id, justificativa }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'NFS-e cancelada com sucesso'
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao cancelar NFS-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao cancelar NFS-e'
    }, error.status || 500);
  }
});

// =============================================
// CT-e (Conhecimento de Transporte Eletrônico)
// =============================================

// POST /fiscal/cte/emitir - Emitir CT-e
fiscal.post('/cte/emitir', requirePermission('fiscal', 'emitir_cte'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const body = await c.req.json();
    const service = getService(c);
    
    const resultado = await service.emitirCTe(body);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'emitir_cte',
      tabela: 'conhecimentos_transporte',
      registro_id: resultado.id,
      dados_novos: { chave: resultado.chave, numero: resultado.numero }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'CT-e emitido com sucesso'
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao emitir CT-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao emitir CT-e'
    }, error.status || 500);
  }
});

// GET /fiscal/cte/:chave - Consultar CT-e
fiscal.get('/cte/:chave', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const { chave } = c.req.param();
    const service = getService(c);
    const resultado = await service.consultarCTe(chave);
    
    return c.json({
      success: true,
      data: resultado
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao consultar CT-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao consultar CT-e'
    }, error.status || 500);
  }
});

// POST /fiscal/cte/:chave/cancelar - Cancelar CT-e
fiscal.post('/cte/:chave/cancelar', requirePermission('fiscal', 'cancelar_cte'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const { chave } = c.req.param();
    const { justificativa } = await c.req.json();
    
    const service = getService(c);
    const resultado = await service.cancelarCTe(chave, justificativa);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'cancelar_cte',
      tabela: 'conhecimentos_transporte',
      dados_novos: { chave, justificativa }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'CT-e cancelado com sucesso'
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao cancelar CT-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao cancelar CT-e'
    }, error.status || 500);
  }
});

// =============================================
// MDF-e (Manifesto de Documentos Fiscais)
// =============================================

// POST /fiscal/mdfe/emitir - Emitir MDF-e
fiscal.post('/mdfe/emitir', requirePermission('fiscal', 'emitir_mdfe'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const body = await c.req.json();
    const service = getService(c);
    
    const resultado = await service.emitirMDFe(body);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'emitir_mdfe',
      tabela: 'manifestos',
      registro_id: resultado.id,
      dados_novos: { chave: resultado.chave, numero: resultado.numero }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'MDF-e emitido com sucesso'
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao emitir MDF-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao emitir MDF-e'
    }, error.status || 500);
  }
});

// GET /fiscal/mdfe/:chave - Consultar MDF-e
fiscal.get('/mdfe/:chave', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const { chave } = c.req.param();
    const service = getService(c);
    const resultado = await service.consultarMDFe(chave);
    
    return c.json({
      success: true,
      data: resultado
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao consultar MDF-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao consultar MDF-e'
    }, error.status || 500);
  }
});

// POST /fiscal/mdfe/:chave/encerrar - Encerrar MDF-e
fiscal.post('/mdfe/:chave/encerrar', requirePermission('fiscal', 'emitir_mdfe'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const { chave } = c.req.param();
    const body = await c.req.json();
    
    const service = getService(c);
    const resultado = await service.encerrarMDFe(chave, body);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'encerrar_mdfe',
      tabela: 'manifestos',
      dados_novos: { chave }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'MDF-e encerrado com sucesso'
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao encerrar MDF-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao encerrar MDF-e'
    }, error.status || 500);
  }
});

// POST /fiscal/mdfe/:chave/cancelar - Cancelar MDF-e
fiscal.post('/mdfe/:chave/cancelar', requirePermission('fiscal', 'cancelar_mdfe'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const { chave } = c.req.param();
    const { justificativa } = await c.req.json();
    
    const service = getService(c);
    const resultado = await service.cancelarMDFe(chave, justificativa);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'cancelar_mdfe',
      tabela: 'manifestos',
      dados_novos: { chave, justificativa }
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'MDF-e cancelado com sucesso'
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao cancelar MDF-e:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao cancelar MDF-e'
    }, error.status || 500);
  }
});

// =============================================
// DISTRIBUIÇÃO DFe
// =============================================

// GET /fiscal/distribuicao/ultimas - Últimas notas recebidas
fiscal.get('/distribuicao/ultimas', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const { cnpj, ultNSU } = c.req.query();
    const service = getService(c);
    const resultado = await service.consultarDistribuicaoDFe(cnpj, ultNSU);
    
    return c.json({
      success: true,
      data: resultado
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao consultar distribuição:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao consultar distribuição'
    }, error.status || 500);
  }
});

// GET /fiscal/distribuicao/nsu/:nsu - Consultar por NSU
fiscal.get('/distribuicao/nsu/:nsu', requirePermission('fiscal', 'consultar'), async (c) => {
  try {
    const { nsu } = c.req.param();
    const { cnpj } = c.req.query();
    const service = getService(c);
    const resultado = await service.consultarNSU(cnpj, nsu);
    
    return c.json({
      success: true,
      data: resultado
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao consultar NSU:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao consultar NSU'
    }, error.status || 500);
  }
});

// POST /fiscal/distribuicao/manifestar - Manifestar conhecimento
fiscal.post('/distribuicao/manifestar', requirePermission('fiscal', 'manifestar'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const body = await c.req.json();
    const service = getService(c);
    const resultado = await service.manifestarNFe(body);
    
    // Registrar auditoria
    await registrarAuditoria(c.env.DB, {
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      acao: 'manifestar_nfe',
      tabela: 'notas_fiscais_recebidas',
      dados_novos: body
    });
    
    return c.json({
      success: true,
      data: resultado,
      message: 'Manifestação registrada'
    });
  } catch (error: any) {
    console.error('[FISCAL] Erro ao manifestar:', error);
    return c.json({
      success: false,
      error: error.message || 'Erro ao manifestar'
    }, error.status || 500);
  }
});

export default fiscal;
