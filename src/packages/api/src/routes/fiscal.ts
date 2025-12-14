// =============================================
// PLANAC ERP - Fiscal API Routes
// Endpoints para documentos fiscais
// =============================================

import { Hono } from 'hono';
import { createNuvemFiscalService } from '../services/nuvem-fiscal';

// Tipos do ambiente
interface Env {
  NUVEM_FISCAL_CLIENT_ID: string;
  NUVEM_FISCAL_CLIENT_SECRET: string;
  NUVEM_FISCAL_AMBIENTE?: 'homologacao' | 'producao';
  NUVEM_FISCAL_TOKEN_CACHE?: KVNamespace;
}

const fiscal = new Hono<{ Bindings: Env }>();

// Helper para criar o service
const getService = (env: Env) => createNuvemFiscalService({
  NUVEM_FISCAL_CLIENT_ID: env.NUVEM_FISCAL_CLIENT_ID,
  NUVEM_FISCAL_CLIENT_SECRET: env.NUVEM_FISCAL_CLIENT_SECRET,
  NUVEM_FISCAL_AMBIENTE: env.NUVEM_FISCAL_AMBIENTE,
  NUVEM_FISCAL_TOKEN_CACHE: env.NUVEM_FISCAL_TOKEN_CACHE,
});

// ===== CEP =====
fiscal.get('/cep/:cep', async (c) => {
  try {
    const { cep } = c.req.param();
    const service = getService(c.env);
    const endereco = await service.cep.consultar(cep);
    return c.json(endereco);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

// ===== CNPJ =====
fiscal.get('/cnpj/:cnpj', async (c) => {
  try {
    const { cnpj } = c.req.param();
    const service = getService(c.env);
    const empresa = await service.cnpj.consultar(cnpj);
    return c.json(empresa);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

// ===== EMPRESAS =====
fiscal.get('/empresas', async (c) => {
  try {
    const service = getService(c.env);
    const { $top, $skip, cpf_cnpj } = c.req.query();
    const empresas = await service.empresas.listar(
      { $top: $top ? parseInt($top) : undefined, $skip: $skip ? parseInt($skip) : undefined },
      cpf_cnpj
    );
    return c.json(empresas);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/empresas/:cpf_cnpj', async (c) => {
  try {
    const { cpf_cnpj } = c.req.param();
    const service = getService(c.env);
    const empresa = await service.empresas.buscar(cpf_cnpj);
    if (!empresa) {
      return c.json({ error: 'Empresa não encontrada' }, 404);
    }
    return c.json(empresa);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.post('/empresas', async (c) => {
  try {
    const service = getService(c.env);
    const body = await c.req.json();
    const empresa = await service.empresas.cadastrar(body);
    return c.json(empresa, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.put('/empresas/:cpf_cnpj', async (c) => {
  try {
    const { cpf_cnpj } = c.req.param();
    const service = getService(c.env);
    const body = await c.req.json();
    const empresa = await service.empresas.atualizar(cpf_cnpj, body);
    return c.json(empresa);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.delete('/empresas/:cpf_cnpj', async (c) => {
  try {
    const { cpf_cnpj } = c.req.param();
    const service = getService(c.env);
    await service.empresas.remover(cpf_cnpj);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

// Certificado
fiscal.put('/empresas/:cpf_cnpj/certificado', async (c) => {
  try {
    const { cpf_cnpj } = c.req.param();
    const service = getService(c.env);
    const body = await c.req.json();
    const resultado = await service.empresas.certificado.upload(cpf_cnpj, body);
    return c.json(resultado);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/empresas/:cpf_cnpj/certificado', async (c) => {
  try {
    const { cpf_cnpj } = c.req.param();
    const service = getService(c.env);
    const certificado = await service.empresas.certificado.consultar(cpf_cnpj);
    return c.json(certificado || { message: 'Certificado não cadastrado' });
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

// ===== NF-e =====
fiscal.post('/nfe', async (c) => {
  try {
    const service = getService(c.env);
    const body = await c.req.json();
    const nfe = await service.nfe.emitir(body);
    return c.json(nfe, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/nfe', async (c) => {
  try {
    const service = getService(c.env);
    const { cpf_cnpj, ambiente, referencia, chave, $top, $skip } = c.req.query();
    const notas = await service.nfe.listar(
      { cpf_cnpj, ambiente: ambiente as any, referencia, chave },
      { $top: $top ? parseInt($top) : undefined, $skip: $skip ? parseInt($skip) : undefined }
    );
    return c.json(notas);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/nfe/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const nfe = await service.nfe.consultar(id);
    return c.json(nfe);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/nfe/:id/xml', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const xml = await service.nfe.baixarXml(id);
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="nfe-${id}.xml"`,
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/nfe/:id/pdf', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const pdf = await service.nfe.baixarPdf(id);
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="danfe-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.post('/nfe/:id/cancelamento', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const { justificativa } = await c.req.json();
    const resultado = await service.nfe.cancelar(id, justificativa);
    return c.json(resultado);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.post('/nfe/:id/carta-correcao', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const { correcao } = await c.req.json();
    const resultado = await service.nfe.cartaCorrecao.emitir(id, correcao);
    return c.json(resultado);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.post('/nfe/:id/email', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const body = await c.req.json();
    await service.nfe.enviarEmail(id, body);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.post('/nfe/inutilizacao', async (c) => {
  try {
    const service = getService(c.env);
    const body = await c.req.json();
    const resultado = await service.nfe.inutilizar(body);
    return c.json(resultado, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/nfe/sefaz/status', async (c) => {
  try {
    const service = getService(c.env);
    const { cpf_cnpj, autorizador } = c.req.query();
    if (!cpf_cnpj) {
      return c.json({ error: 'cpf_cnpj é obrigatório' }, 400);
    }
    const status = await service.nfe.statusSefaz(cpf_cnpj, autorizador);
    return c.json(status);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

// ===== NFC-e =====
fiscal.post('/nfce', async (c) => {
  try {
    const service = getService(c.env);
    const body = await c.req.json();
    const nfce = await service.nfce.emitir(body);
    return c.json(nfce, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/nfce', async (c) => {
  try {
    const service = getService(c.env);
    const { cpf_cnpj, ambiente, $top, $skip } = c.req.query();
    const notas = await service.nfce.listar(
      { cpf_cnpj, ambiente: ambiente as any },
      { $top: $top ? parseInt($top) : undefined, $skip: $skip ? parseInt($skip) : undefined }
    );
    return c.json(notas);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/nfce/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const nfce = await service.nfce.consultar(id);
    return c.json(nfce);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/nfce/:id/pdf', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const pdf = await service.nfce.baixarPdf(id);
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="danfce-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.post('/nfce/:id/cancelamento', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const { justificativa } = await c.req.json();
    const resultado = await service.nfce.cancelar(id, justificativa);
    return c.json(resultado);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

// ===== CT-e =====
fiscal.post('/cte', async (c) => {
  try {
    const service = getService(c.env);
    const body = await c.req.json();
    const cte = await service.cte.emitir(body);
    return c.json(cte, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/cte', async (c) => {
  try {
    const service = getService(c.env);
    const { cpf_cnpj, ambiente, $top, $skip } = c.req.query();
    const conhecimentos = await service.cte.listar(
      { cpf_cnpj, ambiente: ambiente as any },
      { $top: $top ? parseInt($top) : undefined, $skip: $skip ? parseInt($skip) : undefined }
    );
    return c.json(conhecimentos);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/cte/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const cte = await service.cte.consultar(id);
    return c.json(cte);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/cte/:id/pdf', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const pdf = await service.cte.baixarPdf(id);
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="dacte-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.post('/cte/:id/cancelamento', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const { justificativa } = await c.req.json();
    const resultado = await service.cte.cancelar(id, justificativa);
    return c.json(resultado);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

// ===== MDF-e =====
fiscal.post('/mdfe', async (c) => {
  try {
    const service = getService(c.env);
    const body = await c.req.json();
    const mdfe = await service.mdfe.emitir(body);
    return c.json(mdfe, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/mdfe', async (c) => {
  try {
    const service = getService(c.env);
    const { cpf_cnpj, ambiente, $top, $skip } = c.req.query();
    const manifestos = await service.mdfe.listar(
      { cpf_cnpj, ambiente: ambiente as any },
      { $top: $top ? parseInt($top) : undefined, $skip: $skip ? parseInt($skip) : undefined }
    );
    return c.json(manifestos);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/mdfe/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const mdfe = await service.mdfe.consultar(id);
    return c.json(mdfe);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/mdfe/:id/pdf', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const pdf = await service.mdfe.baixarPdf(id);
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="damdfe-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.post('/mdfe/:id/encerramento', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const body = await c.req.json();
    const resultado = await service.mdfe.encerrar(id, body);
    return c.json(resultado);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.post('/mdfe/:id/condutor', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const body = await c.req.json();
    const resultado = await service.mdfe.incluirCondutor(id, body);
    return c.json(resultado);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/mdfe/nao-encerrados', async (c) => {
  try {
    const service = getService(c.env);
    const { cpf_cnpj } = c.req.query();
    if (!cpf_cnpj) {
      return c.json({ error: 'cpf_cnpj é obrigatório' }, 400);
    }
    const resultado = await service.mdfe.naoEncerrados(cpf_cnpj);
    return c.json(resultado);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

// ===== DISTRIBUIÇÃO (Notas de Fornecedores) =====
fiscal.post('/distribuicao/nfe', async (c) => {
  try {
    const service = getService(c.env);
    const body = await c.req.json();
    const resultado = await service.distribuicao.gerar(body);
    return c.json(resultado, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/distribuicao/nfe/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const distribuicao = await service.distribuicao.consultar(id);
    return c.json(distribuicao);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/distribuicao/nfe/documentos', async (c) => {
  try {
    const service = getService(c.env);
    const { cpf_cnpj, ambiente, tipo_documento, $top, $skip } = c.req.query();
    if (!cpf_cnpj || !ambiente) {
      return c.json({ error: 'cpf_cnpj e ambiente são obrigatórios' }, 400);
    }
    const documentos = await service.distribuicao.documentos.listar(
      { cpf_cnpj, ambiente: ambiente as any, tipo_documento: tipo_documento as any },
      { $top: $top ? parseInt($top) : undefined, $skip: $skip ? parseInt($skip) : undefined }
    );
    return c.json(documentos);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/distribuicao/nfe/documentos/:id/xml', async (c) => {
  try {
    const { id } = c.req.param();
    const service = getService(c.env);
    const xml = await service.distribuicao.documentos.baixarXml(id);
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="documento-${id}.xml"`,
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.get('/distribuicao/nfe/notas-sem-manifestacao', async (c) => {
  try {
    const service = getService(c.env);
    const { cpf_cnpj, ambiente, $top, $skip } = c.req.query();
    if (!cpf_cnpj || !ambiente) {
      return c.json({ error: 'cpf_cnpj e ambiente são obrigatórios' }, 400);
    }
    const notas = await service.distribuicao.notasSemManifestacao(
      { cpf_cnpj, ambiente: ambiente as any },
      { $top: $top ? parseInt($top) : undefined, $skip: $skip ? parseInt($skip) : undefined }
    );
    return c.json(notas);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

fiscal.post('/distribuicao/nfe/manifestacao', async (c) => {
  try {
    const service = getService(c.env);
    const body = await c.req.json();
    const resultado = await service.distribuicao.manifestar(body);
    return c.json(resultado, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

export default fiscal;
