// ============================================
// PLANAC ERP - Rotas de Filiais
// Inclui gerenciamento de Inscrições Estaduais
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../types';
import { requireAuth, requirePermission } from '../middleware/auth';
import { registrarAuditoria } from '../utils/auditoria';

// =============================================
// TIPOS PARA INSCRIÇÕES ESTADUAIS
// =============================================

interface InscricaoEstadual {
  id: string;
  empresa_id: string;
  filial_id: string;
  uf: string;
  inscricao_estadual: string;
  tipo: 'normal' | 'st' | 'produtor_rural';
  indicador_ie: '1' | '2' | '9';
  data_inicio?: string;
  data_fim?: string;
  situacao_cadastral: 'ativa' | 'suspensa' | 'cancelada' | 'baixada';
  data_situacao?: string;
  regime_especial?: string;
  regime_especial_descricao?: string;
  regime_especial_validade?: string;
  principal: number;
  ativo: number;
  observacoes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface InscricaoEstadualConfig {
  id: string;
  inscricao_estadual_id: string;
  empresa_id: string;
  aliquota_icms_interna?: number;
  aliquota_icms_interestadual_sul_sudeste?: number;
  aliquota_icms_interestadual_outros?: number;
  responsavel_st: number;
  mva_padrao?: number;
  recolhe_difal: number;
  aliquota_fcp?: number;
  beneficio_fiscal_id?: string;
  codigo_beneficio?: string;
  cfop_venda_interna?: string;
  cfop_venda_interestadual?: string;
  cfop_devolucao?: string;
  informacoes_complementares?: string;
  ativo: number;
  created_at: string;
  updated_at: string;
}

const filiais = new Hono<{ Bindings: Bindings; Variables: Variables }>();

filiais.use('/*', requireAuth());

// =============================================
// SCHEMAS DE VALIDAÇÃO
// =============================================

const filialSchema = z.object({
  nome: z.string().min(3),
  cnpj: z.string().optional(),
  inscricao_estadual: z.string().optional(),
  tipo: z.number().min(1).max(4).default(2), // 1=Matriz, 2=Filial, 3=CD, 4=Loja
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2).optional(),
  ibge: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
  responsavel: z.string().optional(),
  ativo: z.boolean().default(true)
});

// Schema para Inscrição Estadual
const inscricaoEstadualSchema = z.object({
  uf: z.string().length(2),
  inscricao_estadual: z.string().min(1),
  tipo: z.enum(['normal', 'st', 'produtor_rural']).default('normal'),
  indicador_ie: z.enum(['1', '2', '9']).default('1'),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  situacao_cadastral: z.enum(['ativa', 'suspensa', 'cancelada', 'baixada']).default('ativa'),
  data_situacao: z.string().optional(),
  regime_especial: z.string().optional(),
  regime_especial_descricao: z.string().optional(),
  regime_especial_validade: z.string().optional(),
  principal: z.boolean().default(false),
  observacoes: z.string().optional(),
});

// Schema para Configuração Tributária da IE
const inscricaoEstadualConfigSchema = z.object({
  aliquota_icms_interna: z.number().optional(),
  aliquota_icms_interestadual_sul_sudeste: z.number().optional(),
  aliquota_icms_interestadual_outros: z.number().optional(),
  responsavel_st: z.boolean().default(false),
  mva_padrao: z.number().optional(),
  recolhe_difal: z.boolean().default(false),
  aliquota_fcp: z.number().optional(),
  beneficio_fiscal_id: z.string().optional(),
  codigo_beneficio: z.string().optional(),
  cfop_venda_interna: z.string().optional(),
  cfop_venda_interestadual: z.string().optional(),
  cfop_devolucao: z.string().optional(),
  informacoes_complementares: z.string().optional(),
});

// GET /filiais - Listar filiais da empresa
filiais.get('/', requirePermission('filiais', 'listar'), async (c) => {
  const usuario = c.get('usuario');
  const { ativo } = c.req.query();

  let query = `SELECT * FROM filiais WHERE empresa_id = ?`;
  const params: any[] = [usuario.empresa_id];

  if (ativo !== undefined) {
    query += ` AND ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }

  query += ` ORDER BY tipo, nome`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results
  });
});

// GET /filiais/:id - Buscar filial por ID
filiais.get('/:id', requirePermission('filiais', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  const filial = await c.env.DB.prepare(
    `SELECT * FROM filiais WHERE id = ? AND empresa_id = ?`
  ).bind(id, usuario.empresa_id).first();

  if (!filial) {
    return c.json({ success: false, error: 'Filial não encontrada' }, 404);
  }

  return c.json({ success: true, data: filial });
});

// POST /filiais - Criar filial
filiais.post('/', requirePermission('filiais', 'criar'), async (c) => {
  const usuario = c.get('usuario');
  
  try {
    const body = await c.req.json();
    const dados = filialSchema.parse(body);
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO filiais (
        id, empresa_id, nome, cnpj, inscricao_estadual, tipo,
        cep, logradouro, numero, complemento, bairro, cidade, uf, ibge,
        telefone, email, responsavel, ativo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, usuario.empresa_id, dados.nome, dados.cnpj || null, dados.inscricao_estadual || null, dados.tipo,
      dados.cep || null, dados.logradouro || null, dados.numero || null, dados.complemento || null,
      dados.bairro || null, dados.cidade || null, dados.uf || null, dados.ibge || null,
      dados.telefone || null, dados.email || null, dados.responsavel || null,
      dados.ativo ? 1 : 0, now, now
    ).run();

    await registrarAuditoria(c.env.DB, {
      usuario_id: usuario.id,
      empresa_id: usuario.empresa_id,
      acao: 'criar',
      entidade: 'filiais',
      entidade_id: id,
      dados_novos: dados
    });

    return c.json({ success: true, data: { id } }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: 'Dados inválidos', details: error.errors }, 400);
    }
    throw error;
  }
});

// PUT /filiais/:id - Atualizar filial
filiais.put('/:id', requirePermission('filiais', 'editar'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  try {
    const body = await c.req.json();
    const dados = filialSchema.partial().parse(body);

    // Verificar se existe
    const filialAtual = await c.env.DB.prepare(
      `SELECT * FROM filiais WHERE id = ? AND empresa_id = ?`
    ).bind(id, usuario.empresa_id).first();

    if (!filialAtual) {
      return c.json({ success: false, error: 'Filial não encontrada' }, 404);
    }

    const campos: string[] = [];
    const valores: any[] = [];

    Object.entries(dados).forEach(([key, value]) => {
      if (value !== undefined) {
        campos.push(`${key} = ?`);
        valores.push(key === 'ativo' ? (value ? 1 : 0) : value);
      }
    });

    if (campos.length > 0) {
      campos.push('updated_at = ?');
      valores.push(new Date().toISOString());
      valores.push(id, usuario.empresa_id);

      await c.env.DB.prepare(
        `UPDATE filiais SET ${campos.join(', ')} WHERE id = ? AND empresa_id = ?`
      ).bind(...valores).run();

      await registrarAuditoria(c.env.DB, {
        usuario_id: usuario.id,
        empresa_id: usuario.empresa_id,
        acao: 'editar',
        entidade: 'filiais',
        entidade_id: id,
        dados_anteriores: filialAtual,
        dados_novos: dados
      });
    }

    return c.json({ success: true, message: 'Filial atualizada' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: 'Dados inválidos', details: error.errors }, 400);
    }
    throw error;
  }
});

// DELETE /filiais/:id - Excluir filial
filiais.delete('/:id', requirePermission('filiais', 'excluir'), async (c) => {
  const usuario = c.get('usuario');
  const id = c.req.param('id');

  // Verificar se é matriz
  const filial = await c.env.DB.prepare(
    `SELECT * FROM filiais WHERE id = ? AND empresa_id = ?`
  ).bind(id, usuario.empresa_id).first<any>();

  if (!filial) {
    return c.json({ success: false, error: 'Filial não encontrada' }, 404);
  }

  if (filial.tipo === 1) {
    return c.json({ success: false, error: 'Não é possível excluir a matriz' }, 400);
  }

  // Verificar dependências
  const deps = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM pedidos_venda WHERE filial_id = ?`
  ).bind(id).first<{ total: number }>();

  if (deps && deps.total > 0) {
    return c.json({ 
      success: false, 
      error: 'Filial possui pedidos vinculados. Inative-a ao invés de excluir.' 
    }, 400);
  }

  await c.env.DB.prepare(
    `DELETE FROM filiais WHERE id = ? AND empresa_id = ?`
  ).bind(id, usuario.empresa_id).run();

  await registrarAuditoria(c.env.DB, {
    usuario_id: usuario.id,
    empresa_id: usuario.empresa_id,
    acao: 'excluir',
    entidade: 'filiais',
    entidade_id: id,
    dados_anteriores: filial
  });

  return c.json({ success: true, message: 'Filial excluída' });
});

// =============================================
// ROTAS DE INSCRIÇÕES ESTADUAIS
// =============================================

// GET /filiais/:filialId/inscricoes-estaduais - Listar IEs da filial
filiais.get('/:filialId/inscricoes-estaduais', requirePermission('filiais', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const filialId = c.req.param('filialId');
  const { uf, tipo, ativo } = c.req.query();

  // Verificar se a filial pertence à empresa
  const filial = await c.env.DB.prepare(
    `SELECT id FROM filiais WHERE id = ? AND empresa_id = ?`
  ).bind(filialId, usuario.empresa_id).first();

  if (!filial) {
    return c.json({ success: false, error: 'Filial não encontrada' }, 404);
  }

  let query = `
    SELECT fie.*, iec.aliquota_icms_interna, iec.responsavel_st, iec.recolhe_difal, iec.aliquota_fcp
    FROM filiais_inscricoes_estaduais fie
    LEFT JOIN inscricoes_estaduais_config iec ON iec.inscricao_estadual_id = fie.id AND iec.ativo = 1
    WHERE fie.filial_id = ? AND fie.empresa_id = ?
  `;
  const params: any[] = [filialId, usuario.empresa_id];

  if (uf) {
    query += ` AND fie.uf = ?`;
    params.push(uf);
  }

  if (tipo) {
    query += ` AND fie.tipo = ?`;
    params.push(tipo);
  }

  if (ativo !== undefined) {
    query += ` AND fie.ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }

  query += ` ORDER BY fie.uf, fie.tipo`;

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results
  });
});

// GET /filiais/:filialId/inscricoes-estaduais/:id - Buscar IE por ID
filiais.get('/:filialId/inscricoes-estaduais/:id', requirePermission('filiais', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const filialId = c.req.param('filialId');
  const id = c.req.param('id');

  const ie = await c.env.DB.prepare(`
    SELECT fie.*, iec.*
    FROM filiais_inscricoes_estaduais fie
    LEFT JOIN inscricoes_estaduais_config iec ON iec.inscricao_estadual_id = fie.id AND iec.ativo = 1
    WHERE fie.id = ? AND fie.filial_id = ? AND fie.empresa_id = ?
  `).bind(id, filialId, usuario.empresa_id).first<InscricaoEstadual & InscricaoEstadualConfig>();

  if (!ie) {
    return c.json({ success: false, error: 'Inscrição Estadual não encontrada' }, 404);
  }

  return c.json({ success: true, data: ie });
});

// POST /filiais/:filialId/inscricoes-estaduais - Criar IE
filiais.post('/:filialId/inscricoes-estaduais', requirePermission('filiais', 'editar'), async (c) => {
  const usuario = c.get('usuario');
  const filialId = c.req.param('filialId');

  try {
    const body = await c.req.json();
    const dados = inscricaoEstadualSchema.parse(body);
    const configDados = body.config ? inscricaoEstadualConfigSchema.parse(body.config) : null;

    // Verificar se a filial pertence à empresa
    const filial = await c.env.DB.prepare(
      `SELECT id, uf FROM filiais WHERE id = ? AND empresa_id = ?`
    ).bind(filialId, usuario.empresa_id).first<{ id: string; uf: string }>();

    if (!filial) {
      return c.json({ success: false, error: 'Filial não encontrada' }, 404);
    }

    // Verificar se já existe IE para esta UF e tipo
    const existente = await c.env.DB.prepare(`
      SELECT id FROM filiais_inscricoes_estaduais 
      WHERE filial_id = ? AND uf = ? AND tipo = ?
    `).bind(filialId, dados.uf, dados.tipo).first();

    if (existente) {
      return c.json({ 
        success: false, 
        error: `Já existe uma IE do tipo '${dados.tipo}' para a UF '${dados.uf}' nesta filial` 
      }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Se marcou como principal, desmarcar outras da mesma UF
    if (dados.principal) {
      await c.env.DB.prepare(`
        UPDATE filiais_inscricoes_estaduais 
        SET principal = 0, updated_at = ?
        WHERE filial_id = ? AND uf = ?
      `).bind(now, filialId, dados.uf).run();
    }

    // Inserir IE
    await c.env.DB.prepare(`
      INSERT INTO filiais_inscricoes_estaduais (
        id, empresa_id, filial_id, uf, inscricao_estadual, tipo, indicador_ie,
        data_inicio, data_fim, situacao_cadastral, data_situacao,
        regime_especial, regime_especial_descricao, regime_especial_validade,
        principal, ativo, observacoes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).bind(
      id, usuario.empresa_id, filialId, dados.uf, dados.inscricao_estadual, dados.tipo, dados.indicador_ie,
      dados.data_inicio || null, dados.data_fim || null, dados.situacao_cadastral, dados.data_situacao || null,
      dados.regime_especial || null, dados.regime_especial_descricao || null, dados.regime_especial_validade || null,
      dados.principal ? 1 : 0, dados.observacoes || null, usuario.id, now, now
    ).run();

    // Inserir configuração tributária se fornecida
    if (configDados) {
      const configId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO inscricoes_estaduais_config (
          id, inscricao_estadual_id, empresa_id,
          aliquota_icms_interna, aliquota_icms_interestadual_sul_sudeste, aliquota_icms_interestadual_outros,
          responsavel_st, mva_padrao, recolhe_difal, aliquota_fcp,
          beneficio_fiscal_id, codigo_beneficio,
          cfop_venda_interna, cfop_venda_interestadual, cfop_devolucao,
          informacoes_complementares, ativo, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).bind(
        configId, id, usuario.empresa_id,
        configDados.aliquota_icms_interna || null, configDados.aliquota_icms_interestadual_sul_sudeste || null, configDados.aliquota_icms_interestadual_outros || null,
        configDados.responsavel_st ? 1 : 0, configDados.mva_padrao || null, configDados.recolhe_difal ? 1 : 0, configDados.aliquota_fcp || null,
        configDados.beneficio_fiscal_id || null, configDados.codigo_beneficio || null,
        configDados.cfop_venda_interna || null, configDados.cfop_venda_interestadual || null, configDados.cfop_devolucao || null,
        configDados.informacoes_complementares || null, now, now
      ).run();
    }

    // Registrar histórico
    await c.env.DB.prepare(`
      INSERT INTO inscricoes_estaduais_historico (
        id, inscricao_estadual_id, empresa_id, tipo_alteracao, usuario_id, created_at
      ) VALUES (?, ?, ?, 'criacao', ?, ?)
    `).bind(crypto.randomUUID(), id, usuario.empresa_id, usuario.id, now).run();

    // Auditoria
    await registrarAuditoria(c.env.DB, {
      usuario_id: usuario.id,
      empresa_id: usuario.empresa_id,
      acao: 'criar',
      tabela: 'filiais_inscricoes_estaduais',
      registro_id: id,
      dados_novos: { ...dados, config: configDados }
    });

    return c.json({ success: true, data: { id }, message: 'Inscrição Estadual criada com sucesso' }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: 'Dados inválidos', details: error.errors }, 400);
    }
    throw error;
  }
});

// PUT /filiais/:filialId/inscricoes-estaduais/:id - Atualizar IE
filiais.put('/:filialId/inscricoes-estaduais/:id', requirePermission('filiais', 'editar'), async (c) => {
  const usuario = c.get('usuario');
  const filialId = c.req.param('filialId');
  const id = c.req.param('id');

  try {
    const body = await c.req.json();
    const dados = inscricaoEstadualSchema.partial().parse(body);
    const configDados = body.config ? inscricaoEstadualConfigSchema.partial().parse(body.config) : null;

    // Buscar IE atual
    const ieAtual = await c.env.DB.prepare(`
      SELECT * FROM filiais_inscricoes_estaduais 
      WHERE id = ? AND filial_id = ? AND empresa_id = ?
    `).bind(id, filialId, usuario.empresa_id).first<InscricaoEstadual>();

    if (!ieAtual) {
      return c.json({ success: false, error: 'Inscrição Estadual não encontrada' }, 404);
    }

    const now = new Date().toISOString();

    // Se marcou como principal, desmarcar outras da mesma UF
    if (dados.principal) {
      await c.env.DB.prepare(`
        UPDATE filiais_inscricoes_estaduais 
        SET principal = 0, updated_at = ?
        WHERE filial_id = ? AND uf = ? AND id != ?
      `).bind(now, filialId, ieAtual.uf, id).run();
    }

    // Atualizar IE
    const campos: string[] = [];
    const valores: any[] = [];

    Object.entries(dados).forEach(([key, value]) => {
      if (value !== undefined) {
        campos.push(`${key} = ?`);
        if (key === 'principal') {
          valores.push(value ? 1 : 0);
        } else {
          valores.push(value);
        }
      }
    });

    if (campos.length > 0) {
      campos.push('updated_at = ?');
      valores.push(now, id);

      await c.env.DB.prepare(
        `UPDATE filiais_inscricoes_estaduais SET ${campos.join(', ')} WHERE id = ?`
      ).bind(...valores).run();

      // Registrar histórico de alteração
      await c.env.DB.prepare(`
        INSERT INTO inscricoes_estaduais_historico (
          id, inscricao_estadual_id, empresa_id, tipo_alteracao, campo_alterado, 
          valor_anterior, valor_novo, usuario_id, created_at
        ) VALUES (?, ?, ?, 'alteracao', ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, usuario.empresa_id, 'dados',
        JSON.stringify(ieAtual), JSON.stringify(dados), usuario.id, now
      ).run();
    }

    // Atualizar configuração tributária se fornecida
    if (configDados && Object.keys(configDados).length > 0) {
      // Verificar se existe configuração
      const configExistente = await c.env.DB.prepare(`
        SELECT id FROM inscricoes_estaduais_config WHERE inscricao_estadual_id = ? AND ativo = 1
      `).bind(id).first<{ id: string }>();

      if (configExistente) {
        // Atualizar
        const configCampos: string[] = [];
        const configValores: any[] = [];

        Object.entries(configDados).forEach(([key, value]) => {
          if (value !== undefined) {
            configCampos.push(`${key} = ?`);
            if (key === 'responsavel_st' || key === 'recolhe_difal') {
              configValores.push(value ? 1 : 0);
            } else {
              configValores.push(value);
            }
          }
        });

        if (configCampos.length > 0) {
          configCampos.push('updated_at = ?');
          configValores.push(now, configExistente.id);

          await c.env.DB.prepare(
            `UPDATE inscricoes_estaduais_config SET ${configCampos.join(', ')} WHERE id = ?`
          ).bind(...configValores).run();
        }
      } else {
        // Criar nova configuração
        const configId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO inscricoes_estaduais_config (
            id, inscricao_estadual_id, empresa_id,
            aliquota_icms_interna, aliquota_icms_interestadual_sul_sudeste, aliquota_icms_interestadual_outros,
            responsavel_st, mva_padrao, recolhe_difal, aliquota_fcp,
            beneficio_fiscal_id, codigo_beneficio,
            cfop_venda_interna, cfop_venda_interestadual, cfop_devolucao,
            informacoes_complementares, ativo, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `).bind(
          configId, id, usuario.empresa_id,
          configDados.aliquota_icms_interna || null, configDados.aliquota_icms_interestadual_sul_sudeste || null, configDados.aliquota_icms_interestadual_outros || null,
          configDados.responsavel_st ? 1 : 0, configDados.mva_padrao || null, configDados.recolhe_difal ? 1 : 0, configDados.aliquota_fcp || null,
          configDados.beneficio_fiscal_id || null, configDados.codigo_beneficio || null,
          configDados.cfop_venda_interna || null, configDados.cfop_venda_interestadual || null, configDados.cfop_devolucao || null,
          configDados.informacoes_complementares || null, now, now
        ).run();
      }
    }

    // Auditoria
    await registrarAuditoria(c.env.DB, {
      usuario_id: usuario.id,
      empresa_id: usuario.empresa_id,
      acao: 'editar',
      tabela: 'filiais_inscricoes_estaduais',
      registro_id: id,
      dados_anteriores: ieAtual,
      dados_novos: { ...dados, config: configDados }
    });

    return c.json({ success: true, message: 'Inscrição Estadual atualizada com sucesso' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: 'Dados inválidos', details: error.errors }, 400);
    }
    throw error;
  }
});

// DELETE /filiais/:filialId/inscricoes-estaduais/:id - Excluir IE (soft delete)
filiais.delete('/:filialId/inscricoes-estaduais/:id', requirePermission('filiais', 'editar'), async (c) => {
  const usuario = c.get('usuario');
  const filialId = c.req.param('filialId');
  const id = c.req.param('id');

  // Buscar IE
  const ie = await c.env.DB.prepare(`
    SELECT * FROM filiais_inscricoes_estaduais 
    WHERE id = ? AND filial_id = ? AND empresa_id = ?
  `).bind(id, filialId, usuario.empresa_id).first<InscricaoEstadual>();

  if (!ie) {
    return c.json({ success: false, error: 'Inscrição Estadual não encontrada' }, 404);
  }

  // Verificar se é a única IE ativa da filial (não pode excluir)
  const outrasIEs = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM filiais_inscricoes_estaduais 
    WHERE filial_id = ? AND id != ? AND ativo = 1
  `).bind(filialId, id).first<{ total: number }>();

  if (!outrasIEs || outrasIEs.total === 0) {
    // Verificar se a filial tem IE no campo legado
    const filial = await c.env.DB.prepare(`
      SELECT inscricao_estadual FROM filiais WHERE id = ?
    `).bind(filialId).first<{ inscricao_estadual: string }>();

    if (!filial?.inscricao_estadual) {
      return c.json({ 
        success: false, 
        error: 'Não é possível excluir a única Inscrição Estadual ativa da filial' 
      }, 400);
    }
  }

  const now = new Date().toISOString();

  // Soft delete
  await c.env.DB.prepare(`
    UPDATE filiais_inscricoes_estaduais 
    SET ativo = 0, situacao_cadastral = 'baixada', data_situacao = ?, updated_at = ?
    WHERE id = ?
  `).bind(now, now, id).run();

  // Registrar histórico
  await c.env.DB.prepare(`
    INSERT INTO inscricoes_estaduais_historico (
      id, inscricao_estadual_id, empresa_id, tipo_alteracao, usuario_id, created_at
    ) VALUES (?, ?, ?, 'baixa', ?, ?)
  `).bind(crypto.randomUUID(), id, usuario.empresa_id, usuario.id, now).run();

  // Auditoria
  await registrarAuditoria(c.env.DB, {
    usuario_id: usuario.id,
    empresa_id: usuario.empresa_id,
    acao: 'excluir',
    tabela: 'filiais_inscricoes_estaduais',
    registro_id: id,
    dados_anteriores: ie
  });

  return c.json({ success: true, message: 'Inscrição Estadual desativada com sucesso' });
});

// =============================================
// ROTAS AUXILIARES PARA NF-e
// =============================================

// GET /filiais/:filialId/inscricoes-estaduais/buscar-para-nfe - Buscar IE correta para emissão de NF-e
filiais.get('/:filialId/inscricoes-estaduais/buscar-para-nfe', requirePermission('filiais', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');
  const filialId = c.req.param('filialId');
  const { uf_destino, tem_st } = c.req.query();

  if (!uf_destino) {
    return c.json({ success: false, error: 'UF de destino é obrigatória' }, 400);
  }

  // Buscar filial
  const filial = await c.env.DB.prepare(`
    SELECT id, uf, inscricao_estadual FROM filiais WHERE id = ? AND empresa_id = ?
  `).bind(filialId, usuario.empresa_id).first<{ id: string; uf: string; inscricao_estadual: string }>();

  if (!filial) {
    return c.json({ success: false, error: 'Filial não encontrada' }, 404);
  }

  const isOperacaoInterna = filial.uf === uf_destino;
  const temSubstituicaoTributaria = tem_st === 'true';

  let ieParaUsar: any = null;
  let iestParaUsar: any = null;

  if (isOperacaoInterna) {
    // Operação interna: usar IE normal da filial
    ieParaUsar = await c.env.DB.prepare(`
      SELECT fie.*, iec.aliquota_icms_interna, iec.responsavel_st
      FROM filiais_inscricoes_estaduais fie
      LEFT JOIN inscricoes_estaduais_config iec ON iec.inscricao_estadual_id = fie.id AND iec.ativo = 1
      WHERE fie.filial_id = ? AND fie.uf = ? AND fie.tipo = 'normal' AND fie.ativo = 1 AND fie.situacao_cadastral = 'ativa'
      ORDER BY fie.principal DESC
      LIMIT 1
    `).bind(filialId, filial.uf).first();
  } else {
    // Operação interestadual
    // Buscar IE normal da filial (origem)
    ieParaUsar = await c.env.DB.prepare(`
      SELECT fie.*, iec.aliquota_icms_interestadual_sul_sudeste, iec.aliquota_icms_interestadual_outros
      FROM filiais_inscricoes_estaduais fie
      LEFT JOIN inscricoes_estaduais_config iec ON iec.inscricao_estadual_id = fie.id AND iec.ativo = 1
      WHERE fie.filial_id = ? AND fie.uf = ? AND fie.tipo = 'normal' AND fie.ativo = 1 AND fie.situacao_cadastral = 'ativa'
      ORDER BY fie.principal DESC
      LIMIT 1
    `).bind(filialId, filial.uf).first();

    // Se tem ST, buscar IEST no estado de destino
    if (temSubstituicaoTributaria) {
      iestParaUsar = await c.env.DB.prepare(`
        SELECT fie.*, iec.responsavel_st, iec.mva_padrao
        FROM filiais_inscricoes_estaduais fie
        LEFT JOIN inscricoes_estaduais_config iec ON iec.inscricao_estadual_id = fie.id AND iec.ativo = 1
        WHERE fie.filial_id = ? AND fie.uf = ? AND fie.tipo = 'st' AND fie.ativo = 1 AND fie.situacao_cadastral = 'ativa'
        LIMIT 1
      `).bind(filialId, uf_destino).first();
    }
  }

  // Fallback para IE legada da filial se não encontrou na nova tabela
  if (!ieParaUsar && filial.inscricao_estadual) {
    ieParaUsar = {
      inscricao_estadual: filial.inscricao_estadual,
      uf: filial.uf,
      tipo: 'normal',
      indicador_ie: '1',
      _fonte: 'legado'
    };
  }

  return c.json({
    success: true,
    data: {
      operacao_interna: isOperacaoInterna,
      ie_emitente: ieParaUsar,
      iest_destino: iestParaUsar,
      filial_uf: filial.uf,
      destino_uf: uf_destino
    }
  });
});

// GET /empresas/inscricoes-estaduais/iest - Listar todas as IEST da empresa
filiais.get('/empresa/iest', requirePermission('filiais', 'visualizar'), async (c) => {
  const usuario = c.get('usuario');

  const result = await c.env.DB.prepare(`
    SELECT 
      fie.id, fie.filial_id, f.nome as filial_nome, f.cnpj as filial_cnpj,
      fie.uf as uf_destino, fie.inscricao_estadual as iest,
      fie.situacao_cadastral, fie.regime_especial,
      iec.responsavel_st, iec.mva_padrao
    FROM filiais_inscricoes_estaduais fie
    JOIN filiais f ON f.id = fie.filial_id
    LEFT JOIN inscricoes_estaduais_config iec ON iec.inscricao_estadual_id = fie.id AND iec.ativo = 1
    WHERE fie.empresa_id = ? AND fie.tipo = 'st' AND fie.ativo = 1
    ORDER BY f.nome, fie.uf
  `).bind(usuario.empresa_id).all();

  return c.json({
    success: true,
    data: result.results
  });
});

export default filiais;
