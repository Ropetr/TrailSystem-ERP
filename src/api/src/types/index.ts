// =============================================
// 🏢 PLANAC ERP - Definições de Tipos
// =============================================
// Atualizado: 26/12/2025 - Unificação APIs + Integrações Fiscais

// =============================================
// Bindings do Cloudflare Worker
// =============================================
export interface Bindings {
  // Database D1
  DB: D1Database;
  DB_IBPT: D1Database; // NOVO - Banco IBPT
  
  // KV Namespaces
  KV_CACHE: KVNamespace;
  KV_SESSIONS: KVNamespace;
  KV_RATE_LIMIT: KVNamespace; // NOVO
  
  // R2 Storage
  R2_STORAGE: R2Bucket;
  R2_DOCS: R2Bucket;
  R2_BACKUP: R2Bucket;
  R2_CERTIFICADOS: R2Bucket; // NOVO - Certificados A1
  
  // Environment Variables
  ENVIRONMENT: string;
  APP_NAME: string;
  APP_VERSION: string;
  
  // Secrets - Core
  JWT_SECRET: string;
  ENCRYPTION_KEY: string; // NOVO - Criptografia certificados
  
  // Secrets - Nuvem Fiscal
  NUVEM_FISCAL_URL?: string;
  NUVEM_FISCAL_CLIENT_ID?: string;
  NUVEM_FISCAL_CLIENT_SECRET?: string;
  NUVEM_FISCAL_AMBIENTE?: 'homologacao' | 'producao';
  NUVEM_FISCAL_TOKEN_CACHE?: KVNamespace;
  
  // Secrets - Notificações
  EMAIL_API_KEY?: string; // Resend
  WHATSAPP_API_KEY?: string; // API Brasil
  
  // Secrets - Cosmos/Bluesoft
  COSMOS_TOKEN?: string; // Token API Cosmos para cadastro automático de produtos
  
  // Secrets - CNPjá
  CNPJA_TOKEN?: string; // Token API CNPjá para consulta de CNPJ
  
  // Secrets - CPF.CNPJ
  CPFCNPJ_TOKEN?: string; // Token API CPF.CNPJ para consulta de CPF (consumidor final)
}

// =============================================
// Variáveis de Contexto do Hono
// =============================================
export interface Variables {
  usuario: Usuario;
  empresa_id: string;
  filial_id?: string;
}

// =============================================
// Usuário Autenticado
// =============================================
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  empresa_id: string;
  filial_id?: string;
  perfis: string[];
  permissoes: string[];
}

// =============================================
// Payload do JWT
// =============================================
export interface JWTPayload {
  sub: string;        // user_id
  email: string;
  empresa_id: string;
  filial_id?: string;
  perfis: string[];
  permissoes: string[];
  iat: number;        // issued at
  exp: number;        // expiration
}

// =============================================
// Resposta Padrão da API
// =============================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

// =============================================
// Paginação
// =============================================
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// =============================================
// Filtros de Listagem
// =============================================
export interface ListFilters {
  page?: string;
  limit?: string;
  busca?: string;
  ativo?: string;
  ordem?: string;
  direcao?: 'asc' | 'desc';
}

// =============================================
// Auditoria
// =============================================
export interface AuditoriaParams {
  empresa_id: string;
  usuario_id: string;
  acao: 'criar' | 'editar' | 'excluir' | 'aprovar' | 'cancelar' | 'login' | 'logout' | string;
  tabela: string;
  registro_id?: string;
  dados_anteriores?: any;
  dados_novos?: any;
  ip?: string;
  user_agent?: string;
}

// =============================================
// Entidades do Sistema
// =============================================

export interface Empresa {
  id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  regime_tributario: 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
  email?: string;
  telefone?: string;
  logo_url?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Filial {
  id: string;
  empresa_id: string;
  codigo: string;
  nome: string;
  cnpj?: string;
  inscricao_estadual?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  codigo_ibge?: string;
  email?: string;
  telefone?: string;
  matriz: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  empresa_id: string;
  tipo: 'PF' | 'PJ';
  razao_social?: string;
  nome_fantasia?: string;
  cpf_cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  vendedor_id?: string;
  tabela_preco_id?: string;
  condicao_pagamento_id?: string;
  limite_credito: number;
  segmento?: string;
  origem?: string;
  tags?: string[];
  bloqueado: boolean;
  motivo_bloqueio?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Fornecedor {
  id: string;
  empresa_id: string;
  tipo: 'PF' | 'PJ';
  razao_social?: string;
  nome_fantasia?: string;
  cpf_cnpj: string;
  inscricao_estadual?: string;
  email?: string;
  telefone?: string;
  prazo_entrega_padrao?: number;
  condicao_pagamento_padrao?: string;
  tipo_fornecedor?: 'fabricante' | 'distribuidor' | 'importador' | 'servicos';
  categorias?: string[];
  avaliacao?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  empresa_id: string;
  codigo: string;
  codigo_barras?: string;
  nome: string;
  descricao?: string;
  categoria_id?: string;
  marca?: string;
  modelo?: string;
  unidade_medida_id: string;
  peso_liquido?: number;
  peso_bruto?: number;
  largura?: number;
  altura?: number;
  profundidade?: number;
  ncm?: string;
  cest?: string;
  origem: number;
  preco_custo: number;
  preco_custo_medio: number;
  margem_lucro: number;
  preco_venda: number;
  estoque_minimo: number;
  estoque_maximo: number;
  ponto_pedido: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Orcamento {
  id: string;
  empresa_id: string;
  filial_id: string;
  numero: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_cpf_cnpj: string;
  vendedor_id?: string;
  vendedor_nome?: string;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'convertido' | 'expirado';
  data_emissao: string;
  validade_dias: number;
  data_validade: string;
  valor_subtotal: number;
  valor_desconto: number;
  valor_frete: number;
  valor_total: number;
  pedido_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PedidoVenda {
  id: string;
  empresa_id: string;
  filial_id: string;
  numero: string;
  orcamento_id?: string;
  canal: 'interno' | 'ecommerce' | 'marketplace' | 'whatsapp';
  cliente_id: string;
  cliente_nome: string;
  cliente_cpf_cnpj: string;
  vendedor_id?: string;
  vendedor_nome?: string;
  status: 'pendente' | 'aprovado' | 'separando' | 'separado' | 'faturado' | 'em_entrega' | 'entregue' | 'cancelado';
  data_emissao: string;
  data_aprovacao?: string;
  data_faturamento?: string;
  data_entrega_prevista?: string;
  data_entrega_realizada?: string;
  valor_subtotal: number;
  valor_desconto: number;
  valor_frete: number;
  valor_total: number;
  nfe_numero?: string;
  nfe_chave?: string;
  created_at: string;
  updated_at: string;
}

export interface MovimentacaoEstoque {
  id: string;
  empresa_id: string;
  filial_id: string;
  produto_id: string;
  local_id?: string;
  tipo: 'entrada' | 'saida' | 'ajuste' | 'transferencia' | 'reserva' | 'liberacao';
  subtipo?: string;
  quantidade: number;
  quantidade_anterior: number;
  quantidade_posterior: number;
  custo_unitario?: number;
  custo_total?: number;
  documento_tipo?: string;
  documento_id?: string;
  documento_numero?: string;
  observacao?: string;
  usuario_id: string;
  created_at: string;
}

// =============================================
// Tipos Fiscais (NOVO)
// =============================================

export interface CertificadoDigital {
  id: string;
  empresa_id: string;
  tipo: 'A1' | 'A3';
  arquivo_nome: string;
  arquivo_r2_key: string;
  senha_criptografada: string;
  cnpj: string;
  razao_social?: string;
  data_validade: string;
  data_upload: string;
  sincronizado_nuvem_fiscal: boolean;
  nuvem_fiscal_id?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface IBPTAliquota {
  id: string;
  ncm: string;
  ex?: string;
  tipo: 'nacional' | 'importado';
  descricao?: string;
  nacional_federal: number;
  importados_federal: number;
  estadual: number;
  municipal: number;
  vigencia_inicio: string;
  vigencia_fim: string;
  fonte: string;
  versao: string;
  created_at: string;
}

export interface NotaFiscal {
  id: string;
  empresa_id: string;
  filial_id: string;
  tipo: 'nfe' | 'nfce' | 'nfse' | 'cte' | 'mdfe';
  serie: string;
  numero: string;
  chave?: string;
  status: 'rascunho' | 'validando' | 'autorizada' | 'rejeitada' | 'cancelada' | 'inutilizada';
  ambiente: 'homologacao' | 'producao';
  cliente_id?: string;
  cliente_nome?: string;
  cliente_cpf_cnpj?: string;
  valor_total: number;
  valor_tributos?: number;
  xml_autorizado?: string;
  pdf_danfe?: string;
  protocolo?: string;
  data_emissao: string;
  data_autorizacao?: string;
  data_cancelamento?: string;
  motivo_cancelamento?: string;
  documento_origem_tipo?: string;
  documento_origem_id?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// Jobs Agendados (NOVO)
// =============================================

export interface JobExecucao {
  id: string;
  job_nome: string;
  tipo: 'certificados' | 'ibpt' | 'relatorio' | 'limpeza' | string;
  status: 'iniciado' | 'sucesso' | 'erro' | 'parcial';
  detalhes?: any;
  erro?: string;
  iniciado_em: string;
  finalizado_em?: string;
  duracao_ms?: number;
}
