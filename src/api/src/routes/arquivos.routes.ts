// ============================================
// PLANAC ERP - Rotas de Arquivos/Anexos
// Bloco 3 - Gestão Documental
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const arquivos = new Hono<{ Bindings: Env }>();

// ============================================
// ARQUIVOS
// ============================================

// GET /api/arquivos - Listar arquivos
arquivos.get('/', async (c) => {
  const empresaId = c.get('empresaId');
  const { tipo, entidade_tipo, entidade_id, page = '1', limit = '20' } = c.req.query();
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `SELECT a.*, u.nome as criado_por_nome
               FROM arquivos a
               LEFT JOIN usuarios u ON a.created_by = u.id
               WHERE a.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (tipo) {
    query += ` AND a.tipo = ?`;
    params.push(tipo);
  }
  
  if (entidade_tipo && entidade_id) {
    query += ` AND EXISTS (SELECT 1 FROM anexos WHERE arquivo_id = a.id AND entidade_tipo = ? AND entidade_id = ?)`;
    params.push(entidade_tipo, entidade_id);
  }
  
  query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// GET /api/arquivos/:id - Buscar arquivo
arquivos.get('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const arquivo = await c.env.DB.prepare(`
    SELECT a.*, u.nome as criado_por_nome
    FROM arquivos a
    LEFT JOIN usuarios u ON a.created_by = u.id
    WHERE a.id = ? AND a.empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!arquivo) {
    return c.json({ error: 'Arquivo não encontrado' }, 404);
  }
  
  // Buscar onde está anexado
  const anexos = await c.env.DB.prepare(`
    SELECT * FROM anexos WHERE arquivo_id = ?
  `).bind(id).all();
  
  return c.json({ success: true, data: { ...arquivo, anexos: anexos.results } });
});

// POST /api/arquivos - Upload de arquivo
arquivos.post('/', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    nome: z.string().min(1).max(255),
    nome_original: z.string().max(255),
    tipo: z.enum(['DOCUMENTO', 'IMAGEM', 'PLANILHA', 'PDF', 'OUTROS']),
    mime_type: z.string().max(100),
    tamanho: z.number().int().min(0),
    url: z.string().optional(),
    storage_key: z.string().optional(),
    base64: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  // Se tiver base64, salvar no R2
  let storageKey = data.storage_key;
  let url = data.url;
  
  if (data.base64) {
    storageKey = `${empresaId}/${id}/${data.nome_original}`;
    const buffer = Uint8Array.from(atob(data.base64), c => c.charCodeAt(0));
    await c.env.R2?.put(storageKey, buffer, { httpMetadata: { contentType: data.mime_type } });
    url = `/api/arquivos/${id}/download`;
  }
  
  await c.env.DB.prepare(`
    INSERT INTO arquivos (id, empresa_id, nome, nome_original, tipo, mime_type, tamanho, url, storage_key, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, empresaId, data.nome, data.nome_original, data.tipo, data.mime_type,
          data.tamanho, url || null, storageKey || null, usuarioId).run();
  
  return c.json({ id, url, message: 'Arquivo salvo' }, 201);
});

// GET /api/arquivos/:id/download - Download do arquivo
arquivos.get('/:id/download', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const arquivo = await c.env.DB.prepare(`
    SELECT * FROM arquivos WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!arquivo) {
    return c.json({ error: 'Arquivo não encontrado' }, 404);
  }
  
  if (arquivo.storage_key && c.env.R2) {
    const object = await c.env.R2.get(arquivo.storage_key as string);
    if (object) {
      return new Response(object.body, {
        headers: {
          'Content-Type': arquivo.mime_type as string,
          'Content-Disposition': `attachment; filename="${arquivo.nome_original}"`,
        },
      });
    }
  }
  
  if (arquivo.url) {
    return c.redirect(arquivo.url as string);
  }
  
  return c.json({ error: 'Arquivo não disponível' }, 404);
});

// DELETE /api/arquivos/:id - Excluir arquivo
arquivos.delete('/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const arquivo = await c.env.DB.prepare(`
    SELECT * FROM arquivos WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!arquivo) {
    return c.json({ error: 'Arquivo não encontrado' }, 404);
  }
  
  // Remover do R2
  if (arquivo.storage_key && c.env.R2) {
    await c.env.R2.delete(arquivo.storage_key as string);
  }
  
  // Remover anexos
  await c.env.DB.prepare(`DELETE FROM anexos WHERE arquivo_id = ?`).bind(id).run();
  
  // Remover arquivo
  await c.env.DB.prepare(`DELETE FROM arquivos WHERE id = ?`).bind(id).run();
  
  return c.json({ message: 'Arquivo excluído' });
});

// ============================================
// ANEXOS (VÍNCULOS)
// ============================================

// GET /api/arquivos/anexos/:entidadeTipo/:entidadeId - Listar anexos de uma entidade
arquivos.get('/anexos/:entidadeTipo/:entidadeId', async (c) => {
  const empresaId = c.get('empresaId');
  const { entidadeTipo, entidadeId } = c.req.param();
  
  const result = await c.env.DB.prepare(`
    SELECT an.*, ar.nome, ar.nome_original, ar.tipo, ar.mime_type, ar.tamanho, ar.url
    FROM anexos an
    JOIN arquivos ar ON an.arquivo_id = ar.id
    WHERE an.entidade_tipo = ? AND an.entidade_id = ? AND ar.empresa_id = ?
    ORDER BY an.created_at DESC
  `).bind(entidadeTipo, entidadeId, empresaId).all();
  
  return c.json({ success: true, data: result.results });
});

// POST /api/arquivos/anexos - Criar vínculo (anexar arquivo a entidade)
arquivos.post('/anexos', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    arquivo_id: z.string().uuid(),
    entidade_tipo: z.enum(['CLIENTE', 'FORNECEDOR', 'PRODUTO', 'PEDIDO', 'ORCAMENTO', 'NF', 'CONTRATO', 'TICKET', 'OS']),
    entidade_id: z.string().uuid(),
    descricao: z.string().optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO anexos (id, arquivo_id, entidade_tipo, entidade_id, descricao, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, validation.data.arquivo_id, validation.data.entidade_tipo,
          validation.data.entidade_id, validation.data.descricao || null, usuarioId).run();
  
  return c.json({ id, message: 'Arquivo anexado' }, 201);
});

// DELETE /api/arquivos/anexos/:id - Remover vínculo
arquivos.delete('/anexos/:id', async (c) => {
  const { id } = c.req.param();
  
  await c.env.DB.prepare(`DELETE FROM anexos WHERE id = ?`).bind(id).run();
  
  return c.json({ message: 'Anexo removido' });
});

// ============================================
// MODELOS DE DOCUMENTOS
// ============================================

// GET /api/arquivos/modelos - Listar modelos
arquivos.get('/modelos', async (c) => {
  const empresaId = c.get('empresaId');
  const { tipo, ativo } = c.req.query();
  
  let query = `SELECT * FROM modelos_documentos WHERE empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (tipo) {
    query += ` AND tipo = ?`;
    params.push(tipo);
  }
  
  if (ativo !== undefined) {
    query += ` AND ativo = ?`;
    params.push(ativo === 'true' ? 1 : 0);
  }
  
  query += ` ORDER BY nome`;
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// GET /api/arquivos/modelos/:id - Buscar modelo
arquivos.get('/modelos/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const modelo = await c.env.DB.prepare(`
    SELECT * FROM modelos_documentos WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!modelo) {
    return c.json({ error: 'Modelo não encontrado' }, 404);
  }
  
  return c.json({ success: true, data: modelo });
});

// POST /api/arquivos/modelos - Criar modelo
arquivos.post('/modelos', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    nome: z.string().min(1).max(100),
    tipo: z.enum(['PROPOSTA', 'CONTRATO', 'ORCAMENTO', 'RECIBO', 'DECLARACAO', 'OUTROS']),
    formato: z.enum(['HTML', 'MARKDOWN', 'DOCX']).default('HTML'),
    conteudo: z.string(),
    variaveis: z.array(z.object({
      nome: z.string(),
      descricao: z.string().optional(),
      exemplo: z.string().optional()
    })).optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO modelos_documentos (id, empresa_id, nome, tipo, formato, conteudo, variaveis, ativo, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).bind(id, empresaId, data.nome, data.tipo, data.formato, data.conteudo,
          data.variaveis ? JSON.stringify(data.variaveis) : null, usuarioId).run();
  
  return c.json({ id, message: 'Modelo criado' }, 201);
});

// PUT /api/arquivos/modelos/:id - Atualizar modelo
arquivos.put('/modelos/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const campos: string[] = [];
  const valores: any[] = [];
  
  if (body.nome) { campos.push('nome = ?'); valores.push(body.nome); }
  if (body.conteudo) { campos.push('conteudo = ?'); valores.push(body.conteudo); }
  if (body.variaveis) { campos.push('variaveis = ?'); valores.push(JSON.stringify(body.variaveis)); }
  if (body.ativo !== undefined) { campos.push('ativo = ?'); valores.push(body.ativo ? 1 : 0); }
  
  if (campos.length > 0) {
    await c.env.DB.prepare(`
      UPDATE modelos_documentos SET ${campos.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND empresa_id = ?
    `).bind(...valores, id, empresaId).run();
  }
  
  return c.json({ message: 'Modelo atualizado' });
});

// POST /api/arquivos/modelos/:id/gerar - Gerar documento a partir do modelo
arquivos.post('/modelos/:id/gerar', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const modelo = await c.env.DB.prepare(`
    SELECT * FROM modelos_documentos WHERE id = ? AND empresa_id = ? AND ativo = 1
  `).bind(id, empresaId).first();
  
  if (!modelo) {
    return c.json({ error: 'Modelo não encontrado' }, 404);
  }
  
  // Substituir variáveis
  let conteudo = modelo.conteudo as string;
  const variaveis = body.variaveis || {};
  
  for (const [chave, valor] of Object.entries(variaveis)) {
    conteudo = conteudo.replace(new RegExp(`{{${chave}}}`, 'g'), String(valor));
  }
  
  // Criar arquivo gerado
  const arquivoId = crypto.randomUUID();
  const nomeArquivo = `${modelo.nome}_${new Date().toISOString().split('T')[0]}.${modelo.formato === 'HTML' ? 'html' : modelo.formato === 'MARKDOWN' ? 'md' : 'docx'}`;
  
  await c.env.DB.prepare(`
    INSERT INTO arquivos (id, empresa_id, nome, nome_original, tipo, mime_type, tamanho, conteudo_texto, created_by)
    VALUES (?, ?, ?, ?, 'DOCUMENTO', ?, ?, ?, ?)
  `).bind(arquivoId, empresaId, nomeArquivo, nomeArquivo,
          modelo.formato === 'HTML' ? 'text/html' : 'text/plain',
          conteudo.length, conteudo, body.usuario_id || null).run();
  
  return c.json({
    arquivo_id: arquivoId,
    nome: nomeArquivo,
    conteudo,
    message: 'Documento gerado'
  }, 201);
});

// ============================================
// ESTATÍSTICAS
// ============================================

// GET /api/arquivos/estatisticas - Estatísticas de armazenamento
arquivos.get('/estatisticas', async (c) => {
  const empresaId = c.get('empresaId');
  
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_arquivos,
      SUM(tamanho) as tamanho_total,
      COUNT(DISTINCT tipo) as tipos_distintos
    FROM arquivos WHERE empresa_id = ?
  `).bind(empresaId).first();
  
  const porTipo = await c.env.DB.prepare(`
    SELECT tipo, COUNT(*) as quantidade, SUM(tamanho) as tamanho
    FROM arquivos WHERE empresa_id = ?
    GROUP BY tipo ORDER BY tamanho DESC
  `).bind(empresaId).all();
  
  const porMes = await c.env.DB.prepare(`
    SELECT strftime('%Y-%m', created_at) as mes, COUNT(*) as quantidade, SUM(tamanho) as tamanho
    FROM arquivos WHERE empresa_id = ?
    GROUP BY mes ORDER BY mes DESC LIMIT 12
  `).bind(empresaId).all();
  
  return c.json({
    success: true,
    data: {
      resumo: stats,
      por_tipo: porTipo.results,
      por_mes: porMes.results
    }
  });
});

export default arquivos;
