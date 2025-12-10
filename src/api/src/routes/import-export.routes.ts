// ============================================
// PLANAC ERP - Rotas de Importação/Exportação
// Bloco 3 - Carga de Dados
// ============================================

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

const importExport = new Hono<{ Bindings: Env }>();

// ============================================
// IMPORTAÇÕES
// ============================================

// GET /api/importacoes - Listar importações
importExport.get('/importacoes', async (c) => {
  const empresaId = c.get('empresaId');
  const { tipo, status, limit = '20' } = c.req.query();
  
  let query = `SELECT i.*, u.nome as usuario_nome
               FROM importacoes i
               LEFT JOIN usuarios u ON i.created_by = u.id
               WHERE i.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (tipo) {
    query += ` AND i.tipo = ?`;
    params.push(tipo);
  }
  
  if (status) {
    query += ` AND i.status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY i.created_at DESC LIMIT ?`;
  params.push(parseInt(limit));
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// GET /api/importacoes/:id - Buscar importação com erros
importExport.get('/importacoes/:id', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const importacao = await c.env.DB.prepare(`
    SELECT * FROM importacoes WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).first();
  
  if (!importacao) {
    return c.json({ error: 'Importação não encontrada' }, 404);
  }
  
  const erros = await c.env.DB.prepare(`
    SELECT * FROM importacoes_erros WHERE importacao_id = ? ORDER BY linha
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: { ...importacao, erros: erros.results }
  });
});

// POST /api/importacoes - Criar importação
importExport.post('/importacoes', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    tipo: z.enum(['CLIENTES', 'PRODUTOS', 'FORNECEDORES', 'ESTOQUE', 'PRECOS', 'VENDEDORES']),
    arquivo_nome: z.string(),
    arquivo_url: z.string().optional(),
    dados: z.array(z.record(z.any())), // Array de objetos
    opcoes: z.object({
      atualizar_existentes: z.boolean().default(false),
      ignorar_erros: z.boolean().default(false),
      mapeamento: z.record(z.string()).optional()
    }).optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos', details: validation.error.errors }, 400);
  }
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO importacoes (id, empresa_id, tipo, arquivo_nome, arquivo_url, total_linhas,
                             opcoes, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDENTE', ?)
  `).bind(id, empresaId, data.tipo, data.arquivo_nome, data.arquivo_url || null,
          data.dados.length, data.opcoes ? JSON.stringify(data.opcoes) : null, usuarioId).run();
  
  // Processar importação
  const resultado = await processarImportacao(c.env, id, empresaId, data);
  
  return c.json({
    id,
    message: 'Importação processada',
    resultado
  }, 201);
});

// POST /api/importacoes/:id/reprocessar - Reprocessar importação
importExport.post('/importacoes/:id/reprocessar', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  // Limpar erros anteriores
  await c.env.DB.prepare(`DELETE FROM importacoes_erros WHERE importacao_id = ?`).bind(id).run();
  
  // Resetar contadores
  await c.env.DB.prepare(`
    UPDATE importacoes SET status = 'PROCESSANDO', processados = 0, sucesso = 0, erros = 0,
                           data_inicio = CURRENT_TIMESTAMP, data_conclusao = NULL
    WHERE id = ? AND empresa_id = ?
  `).bind(id, empresaId).run();
  
  return c.json({ message: 'Reprocessamento iniciado' });
});

// ============================================
// TEMPLATES DE IMPORTAÇÃO
// ============================================

// GET /api/importacoes/templates/:tipo - Obter template de importação
importExport.get('/templates/:tipo', async (c) => {
  const { tipo } = c.req.param();
  
  const templates: Record<string, any> = {
    CLIENTES: {
      colunas: [
        { nome: 'codigo', obrigatorio: false, tipo: 'string', descricao: 'Código do cliente' },
        { nome: 'tipo_pessoa', obrigatorio: true, tipo: 'enum', valores: ['F', 'J'], descricao: 'F=Física, J=Jurídica' },
        { nome: 'razao_social', obrigatorio: true, tipo: 'string', descricao: 'Nome/Razão Social' },
        { nome: 'nome_fantasia', obrigatorio: false, tipo: 'string' },
        { nome: 'cnpj_cpf', obrigatorio: true, tipo: 'string', descricao: 'CPF ou CNPJ (somente números)' },
        { nome: 'ie_rg', obrigatorio: false, tipo: 'string' },
        { nome: 'email', obrigatorio: false, tipo: 'email' },
        { nome: 'telefone', obrigatorio: false, tipo: 'string' },
        { nome: 'celular', obrigatorio: false, tipo: 'string' },
        { nome: 'cep', obrigatorio: false, tipo: 'string' },
        { nome: 'logradouro', obrigatorio: false, tipo: 'string' },
        { nome: 'numero', obrigatorio: false, tipo: 'string' },
        { nome: 'complemento', obrigatorio: false, tipo: 'string' },
        { nome: 'bairro', obrigatorio: false, tipo: 'string' },
        { nome: 'cidade', obrigatorio: false, tipo: 'string' },
        { nome: 'uf', obrigatorio: false, tipo: 'string', tamanho: 2 }
      ],
      exemplo: [
        { tipo_pessoa: 'J', razao_social: 'Empresa Exemplo LTDA', cnpj_cpf: '12345678000199', email: 'contato@exemplo.com' }
      ]
    },
    PRODUTOS: {
      colunas: [
        { nome: 'codigo', obrigatorio: false, tipo: 'string' },
        { nome: 'codigo_barras', obrigatorio: false, tipo: 'string' },
        { nome: 'descricao', obrigatorio: true, tipo: 'string' },
        { nome: 'descricao_reduzida', obrigatorio: false, tipo: 'string' },
        { nome: 'categoria', obrigatorio: false, tipo: 'string', descricao: 'Nome da categoria' },
        { nome: 'marca', obrigatorio: false, tipo: 'string', descricao: 'Nome da marca' },
        { nome: 'unidade', obrigatorio: true, tipo: 'string', descricao: 'UN, CX, KG, etc' },
        { nome: 'ncm', obrigatorio: false, tipo: 'string' },
        { nome: 'preco_custo', obrigatorio: false, tipo: 'number' },
        { nome: 'preco_venda', obrigatorio: false, tipo: 'number' },
        { nome: 'estoque_minimo', obrigatorio: false, tipo: 'number' },
        { nome: 'estoque_maximo', obrigatorio: false, tipo: 'number' },
        { nome: 'peso_bruto', obrigatorio: false, tipo: 'number' },
        { nome: 'peso_liquido', obrigatorio: false, tipo: 'number' }
      ],
      exemplo: [
        { descricao: 'Placa de Gesso 1200x600', unidade: 'UN', preco_venda: 45.90 }
      ]
    },
    FORNECEDORES: {
      colunas: [
        { nome: 'codigo', obrigatorio: false, tipo: 'string' },
        { nome: 'razao_social', obrigatorio: true, tipo: 'string' },
        { nome: 'nome_fantasia', obrigatorio: false, tipo: 'string' },
        { nome: 'cnpj', obrigatorio: true, tipo: 'string' },
        { nome: 'ie', obrigatorio: false, tipo: 'string' },
        { nome: 'email', obrigatorio: false, tipo: 'email' },
        { nome: 'telefone', obrigatorio: false, tipo: 'string' },
        { nome: 'contato', obrigatorio: false, tipo: 'string' },
        { nome: 'cep', obrigatorio: false, tipo: 'string' },
        { nome: 'logradouro', obrigatorio: false, tipo: 'string' },
        { nome: 'numero', obrigatorio: false, tipo: 'string' },
        { nome: 'cidade', obrigatorio: false, tipo: 'string' },
        { nome: 'uf', obrigatorio: false, tipo: 'string' }
      ],
      exemplo: [
        { razao_social: 'Fornecedor Exemplo LTDA', cnpj: '98765432000188' }
      ]
    },
    ESTOQUE: {
      colunas: [
        { nome: 'produto_codigo', obrigatorio: true, tipo: 'string', descricao: 'Código do produto' },
        { nome: 'quantidade', obrigatorio: true, tipo: 'number' },
        { nome: 'local', obrigatorio: false, tipo: 'string', descricao: 'Nome do local de estoque' },
        { nome: 'lote', obrigatorio: false, tipo: 'string' },
        { nome: 'data_validade', obrigatorio: false, tipo: 'date' }
      ],
      exemplo: [
        { produto_codigo: 'PRD001', quantidade: 100 }
      ]
    },
    PRECOS: {
      colunas: [
        { nome: 'produto_codigo', obrigatorio: true, tipo: 'string' },
        { nome: 'tabela', obrigatorio: false, tipo: 'string', descricao: 'Nome da tabela de preço' },
        { nome: 'preco', obrigatorio: true, tipo: 'number' },
        { nome: 'preco_minimo', obrigatorio: false, tipo: 'number' },
        { nome: 'preco_maximo', obrigatorio: false, tipo: 'number' }
      ],
      exemplo: [
        { produto_codigo: 'PRD001', preco: 99.90 }
      ]
    }
  };
  
  const template = templates[tipo];
  
  if (!template) {
    return c.json({ error: 'Tipo de importação não suportado' }, 400);
  }
  
  return c.json({ success: true, data: template });
});

// ============================================
// EXPORTAÇÕES
// ============================================

// GET /api/exportacoes - Listar exportações
importExport.get('/exportacoes', async (c) => {
  const empresaId = c.get('empresaId');
  const { tipo, limit = '20' } = c.req.query();
  
  let query = `SELECT e.*, u.nome as usuario_nome
               FROM exportacoes e
               LEFT JOIN usuarios u ON e.created_by = u.id
               WHERE e.empresa_id = ?`;
  const params: any[] = [empresaId];
  
  if (tipo) {
    query += ` AND e.tipo = ?`;
    params.push(tipo);
  }
  
  query += ` ORDER BY e.created_at DESC LIMIT ?`;
  params.push(parseInt(limit));
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ success: true, data: result.results });
});

// POST /api/exportacoes - Criar exportação
importExport.post('/exportacoes', async (c) => {
  const empresaId = c.get('empresaId');
  const usuarioId = c.get('usuarioId');
  const body = await c.req.json();
  
  const schema = z.object({
    tipo: z.enum(['CLIENTES', 'PRODUTOS', 'FORNECEDORES', 'ESTOQUE', 'PEDIDOS', 'NOTAS_FISCAIS']),
    formato: z.enum(['CSV', 'XLSX', 'JSON']).default('CSV'),
    filtros: z.record(z.any()).optional(),
    campos: z.array(z.string()).optional()
  });
  
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos' }, 400);
  }
  
  const id = crypto.randomUUID();
  const data = validation.data;
  
  await c.env.DB.prepare(`
    INSERT INTO exportacoes (id, empresa_id, tipo, formato, filtros, campos, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'PROCESSANDO', ?)
  `).bind(id, empresaId, data.tipo, data.formato, 
          data.filtros ? JSON.stringify(data.filtros) : null,
          data.campos ? JSON.stringify(data.campos) : null, usuarioId).run();
  
  // Processar exportação
  const resultado = await processarExportacao(c.env, id, empresaId, data);
  
  return c.json({
    id,
    message: 'Exportação processada',
    resultado
  }, 201);
});

// GET /api/exportacoes/:id/download - Download da exportação
importExport.get('/exportacoes/:id/download', async (c) => {
  const empresaId = c.get('empresaId');
  const { id } = c.req.param();
  
  const exportacao = await c.env.DB.prepare(`
    SELECT * FROM exportacoes WHERE id = ? AND empresa_id = ? AND status = 'CONCLUIDO'
  `).bind(id, empresaId).first();
  
  if (!exportacao) {
    return c.json({ error: 'Exportação não encontrada ou não concluída' }, 404);
  }
  
  // Retornar URL do arquivo ou dados
  return c.json({
    success: true,
    data: {
      arquivo_url: exportacao.arquivo_url,
      dados: exportacao.dados ? JSON.parse(exportacao.dados as string) : null
    }
  });
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function processarImportacao(env: Env, importacaoId: string, empresaId: string, data: any) {
  let processados = 0;
  let sucesso = 0;
  let erros = 0;
  
  await env.DB.prepare(`
    UPDATE importacoes SET status = 'PROCESSANDO', data_inicio = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(importacaoId).run();
  
  for (let i = 0; i < data.dados.length; i++) {
    const linha = data.dados[i];
    processados++;
    
    try {
      switch (data.tipo) {
        case 'CLIENTES':
          await importarCliente(env.DB, empresaId, linha, data.opcoes);
          break;
        case 'PRODUTOS':
          await importarProduto(env.DB, empresaId, linha, data.opcoes);
          break;
        case 'FORNECEDORES':
          await importarFornecedor(env.DB, empresaId, linha, data.opcoes);
          break;
        default:
          throw new Error('Tipo não suportado');
      }
      sucesso++;
    } catch (e: any) {
      erros++;
      
      // Registrar erro
      const erroId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO importacoes_erros (id, importacao_id, linha, campo, erro, dados_linha)
        VALUES (?, ?, ?, NULL, ?, ?)
      `).bind(erroId, importacaoId, i + 1, e.message, JSON.stringify(linha)).run();
      
      if (!data.opcoes?.ignorar_erros) {
        break;
      }
    }
  }
  
  // Atualizar importação
  await env.DB.prepare(`
    UPDATE importacoes SET status = ?, processados = ?, sucesso = ?, erros = ?,
                           data_conclusao = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(erros > 0 && !data.opcoes?.ignorar_erros ? 'ERRO' : 'CONCLUIDO', 
          processados, sucesso, erros, importacaoId).run();
  
  return { processados, sucesso, erros };
}

async function importarCliente(db: any, empresaId: string, dados: any, opcoes: any) {
  // Validar campos obrigatórios
  if (!dados.razao_social || !dados.cnpj_cpf) {
    throw new Error('Campos obrigatórios: razao_social, cnpj_cpf');
  }
  
  // Verificar se existe
  const existente = await db.prepare(`
    SELECT id FROM clientes WHERE cnpj_cpf = ? AND empresa_id = ?
  `).bind(dados.cnpj_cpf.replace(/\D/g, ''), empresaId).first();
  
  if (existente) {
    if (opcoes?.atualizar_existentes) {
      await db.prepare(`
        UPDATE clientes SET razao_social = ?, nome_fantasia = ?, email = ?, 
               telefone = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(dados.razao_social, dados.nome_fantasia || null, 
              dados.email || null, dados.telefone || null, existente.id).run();
    } else {
      throw new Error('Cliente já existe');
    }
  } else {
    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO clientes (id, empresa_id, tipo_pessoa, razao_social, nome_fantasia, 
                            cnpj_cpf, ie_rg, email, telefone, celular, ativo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(id, empresaId, dados.tipo_pessoa || 'J', dados.razao_social,
            dados.nome_fantasia || null, dados.cnpj_cpf.replace(/\D/g, ''),
            dados.ie_rg || null, dados.email || null, 
            dados.telefone || null, dados.celular || null).run();
  }
}

async function importarProduto(db: any, empresaId: string, dados: any, opcoes: any) {
  if (!dados.descricao || !dados.unidade) {
    throw new Error('Campos obrigatórios: descricao, unidade');
  }
  
  const id = crypto.randomUUID();
  const codigo = dados.codigo || `PRD${Date.now()}`;
  
  await db.prepare(`
    INSERT INTO produtos (id, empresa_id, codigo, codigo_barras, descricao, descricao_reduzida,
                          unidade, ncm, preco_custo, preco_venda, ativo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).bind(id, empresaId, codigo, dados.codigo_barras || null, dados.descricao,
          dados.descricao_reduzida || null, dados.unidade, dados.ncm || null,
          dados.preco_custo || 0, dados.preco_venda || 0).run();
}

async function importarFornecedor(db: any, empresaId: string, dados: any, opcoes: any) {
  if (!dados.razao_social || !dados.cnpj) {
    throw new Error('Campos obrigatórios: razao_social, cnpj');
  }
  
  const id = crypto.randomUUID();
  
  await db.prepare(`
    INSERT INTO fornecedores (id, empresa_id, razao_social, nome_fantasia, cnpj, ie, email, telefone, ativo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).bind(id, empresaId, dados.razao_social, dados.nome_fantasia || null,
          dados.cnpj.replace(/\D/g, ''), dados.ie || null, 
          dados.email || null, dados.telefone || null).run();
}

async function processarExportacao(env: Env, exportacaoId: string, empresaId: string, data: any) {
  let query = '';
  
  switch (data.tipo) {
    case 'CLIENTES':
      query = `SELECT * FROM clientes WHERE empresa_id = ? AND ativo = 1`;
      break;
    case 'PRODUTOS':
      query = `SELECT * FROM produtos WHERE empresa_id = ? AND ativo = 1`;
      break;
    case 'FORNECEDORES':
      query = `SELECT * FROM fornecedores WHERE empresa_id = ? AND ativo = 1`;
      break;
    case 'PEDIDOS':
      query = `SELECT * FROM pedidos WHERE empresa_id = ?`;
      break;
    default:
      throw new Error('Tipo não suportado');
  }
  
  const result = await env.DB.prepare(query).bind(empresaId).all();
  
  // Atualizar exportação
  await env.DB.prepare(`
    UPDATE exportacoes SET status = 'CONCLUIDO', total_registros = ?, dados = ?,
                           data_conclusao = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(result.results.length, JSON.stringify(result.results), exportacaoId).run();
  
  return { total_registros: result.results.length };
}

export default importExport;
