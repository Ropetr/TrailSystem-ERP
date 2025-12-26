// =============================================
// PLANAC ERP - Routes Empresas Config
// Configuração de empresas incluindo IBPT
// =============================================

import { Hono } from 'hono';

interface Env {
  DB: D1Database;
}

const empresasConfig = new Hono<{ Bindings: Env }>();

// ===== IBPT =====

/**
 * Obter configuração IBPT de uma empresa
 * GET /empresas-config/:cnpj/ibpt
 */
empresasConfig.get('/:cnpj/ibpt', async (c) => {
  try {
    const { cnpj } = c.req.param();
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    const result = await c.env.DB
      .prepare(`
        SELECT ibpt_token, ibpt_uf, ibpt_configurado_em
        FROM empresas_config
        WHERE cnpj = ? AND ativo = 1
      `)
      .bind(cnpjLimpo)
      .first<any>();

    if (!result) {
      return c.json({ error: 'Empresa não encontrada' }, 404);
    }

    return c.json({
      configurado: !!result.ibpt_token,
      uf: result.ibpt_uf,
      token_parcial: result.ibpt_token ? `${result.ibpt_token.substring(0, 4)}****` : null,
      configurado_em: result.ibpt_configurado_em,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Configurar IBPT de uma empresa
 * PUT /empresas-config/:cnpj/ibpt
 * Body: { token: string, uf: string }
 */
empresasConfig.put('/:cnpj/ibpt', async (c) => {
  try {
    const { cnpj } = c.req.param();
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    const body = await c.req.json<{ token: string; uf: string }>();

    if (!body.token) {
      return c.json({ error: 'Token é obrigatório' }, 400);
    }

    if (!body.uf || body.uf.length !== 2) {
      return c.json({ error: 'UF inválida' }, 400);
    }

    // Verificar se empresa existe
    const empresa = await c.env.DB
      .prepare('SELECT id FROM empresas_config WHERE cnpj = ?')
      .bind(cnpjLimpo)
      .first();

    if (!empresa) {
      // Criar registro se não existe
      await c.env.DB
        .prepare(`
          INSERT INTO empresas_config (cnpj, ibpt_token, ibpt_uf, ibpt_configurado_em, ativo, created_at, updated_at)
          VALUES (?, ?, ?, datetime('now'), 1, datetime('now'), datetime('now'))
        `)
        .bind(cnpjLimpo, body.token, body.uf.toUpperCase())
        .run();
    } else {
      // Atualizar registro existente
      await c.env.DB
        .prepare(`
          UPDATE empresas_config 
          SET ibpt_token = ?, ibpt_uf = ?, ibpt_configurado_em = datetime('now'), updated_at = datetime('now')
          WHERE cnpj = ?
        `)
        .bind(body.token, body.uf.toUpperCase(), cnpjLimpo)
        .run();
    }

    return c.json({
      success: true,
      message: 'Configuração IBPT salva com sucesso',
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Remover configuração IBPT
 * DELETE /empresas-config/:cnpj/ibpt
 */
empresasConfig.delete('/:cnpj/ibpt', async (c) => {
  try {
    const { cnpj } = c.req.param();
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    await c.env.DB
      .prepare(`
        UPDATE empresas_config 
        SET ibpt_token = NULL, ibpt_uf = NULL, ibpt_configurado_em = NULL, updated_at = datetime('now')
        WHERE cnpj = ?
      `)
      .bind(cnpjLimpo)
      .run();

    return c.json({ success: true, message: 'Configuração IBPT removida' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== NUVEM FISCAL =====

/**
 * Obter configuração Nuvem Fiscal
 * GET /empresas-config/:cnpj/nuvem-fiscal
 */
empresasConfig.get('/:cnpj/nuvem-fiscal', async (c) => {
  try {
    const { cnpj } = c.req.param();
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    const result = await c.env.DB
      .prepare(`
        SELECT 
          nf_ambiente, nf_serie_nfe, nf_serie_nfce, nf_serie_nfse,
          nf_csc_id, nf_certificado_configurado
        FROM empresas_config
        WHERE cnpj = ? AND ativo = 1
      `)
      .bind(cnpjLimpo)
      .first<any>();

    if (!result) {
      return c.json({ error: 'Empresa não encontrada' }, 404);
    }

    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Configurar Nuvem Fiscal
 * PUT /empresas-config/:cnpj/nuvem-fiscal
 */
empresasConfig.put('/:cnpj/nuvem-fiscal', async (c) => {
  try {
    const { cnpj } = c.req.param();
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    const body = await c.req.json<{
      ambiente?: 'homologacao' | 'producao';
      serie_nfe?: number;
      serie_nfce?: number;
      serie_nfse?: number;
      csc_id?: string;
      csc_token?: string;
    }>();

    const updates: string[] = [];
    const params: any[] = [];

    if (body.ambiente) {
      updates.push('nf_ambiente = ?');
      params.push(body.ambiente);
    }
    if (body.serie_nfe !== undefined) {
      updates.push('nf_serie_nfe = ?');
      params.push(body.serie_nfe);
    }
    if (body.serie_nfce !== undefined) {
      updates.push('nf_serie_nfce = ?');
      params.push(body.serie_nfce);
    }
    if (body.serie_nfse !== undefined) {
      updates.push('nf_serie_nfse = ?');
      params.push(body.serie_nfse);
    }
    if (body.csc_id) {
      updates.push('nf_csc_id = ?');
      params.push(body.csc_id);
    }
    if (body.csc_token) {
      updates.push('nf_csc_token = ?');
      params.push(body.csc_token);
    }

    if (updates.length === 0) {
      return c.json({ error: 'Nenhum campo para atualizar' }, 400);
    }

    updates.push("updated_at = datetime('now')");
    params.push(cnpjLimpo);

    await c.env.DB
      .prepare(`UPDATE empresas_config SET ${updates.join(', ')} WHERE cnpj = ?`)
      .bind(...params)
      .run();

    return c.json({ success: true, message: 'Configuração atualizada' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ===== GERAL =====

/**
 * Obter configuração completa da empresa
 * GET /empresas-config/:cnpj
 */
empresasConfig.get('/:cnpj', async (c) => {
  try {
    const { cnpj } = c.req.param();
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    const result = await c.env.DB
      .prepare(`
        SELECT 
          id, cnpj, razao_social, nome_fantasia, inscricao_estadual,
          email_notificacao, telefone_notificacao,
          nf_ambiente, nf_serie_nfe, nf_serie_nfce, nf_serie_nfse,
          nf_certificado_configurado,
          ibpt_uf, ibpt_configurado_em,
          CASE WHEN ibpt_token IS NOT NULL THEN 1 ELSE 0 END as ibpt_configurado,
          tenant_id, ativo, created_at, updated_at
        FROM empresas_config
        WHERE cnpj = ?
      `)
      .bind(cnpjLimpo)
      .first();

    if (!result) {
      return c.json({ error: 'Empresa não encontrada' }, 404);
    }

    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Listar todas as empresas
 * GET /empresas-config?tenant_id=xxx&ativo=1
 */
empresasConfig.get('/', async (c) => {
  try {
    const { tenant_id, ativo } = c.req.query();

    let query = `
      SELECT 
        id, cnpj, razao_social, nome_fantasia,
        nf_ambiente, nf_certificado_configurado,
        ibpt_uf,
        CASE WHEN ibpt_token IS NOT NULL THEN 1 ELSE 0 END as ibpt_configurado,
        ativo, updated_at
      FROM empresas_config
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tenant_id) {
      query += ' AND tenant_id = ?';
      params.push(tenant_id);
    }

    if (ativo !== undefined) {
      query += ' AND ativo = ?';
      params.push(ativo === '1' || ativo === 'true' ? 1 : 0);
    }

    query += ' ORDER BY razao_social';

    const result = await c.env.DB.prepare(query).bind(...params).all<any>();

    return c.json({ data: result.results || [] });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default empresasConfig;

