// =============================================
// PLANAC ERP - Nuvem Fiscal Distribuição NF-e
// Receber notas emitidas contra o CNPJ
// =============================================

import type { 
  NuvemFiscalConfig, 
  PaginacaoParams 
} from './types';
import { nuvemFiscalRequest } from './auth';

// ===== TIPOS =====

export interface DistribuicaoNfe {
  id: string;
  ambiente: 'homologacao' | 'producao';
  created_at: string;
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  cpf_cnpj: string;
  tipo_consulta: 'dist-nsu' | 'cons-nsu' | 'cons-chave';
  ult_nsu?: number;
  max_nsu?: number;
  documentos_encontrados?: number;
}

export interface DistribuicaoNfeDocumento {
  id: string;
  ambiente: 'homologacao' | 'producao';
  created_at: string;
  nsu: number;
  chave?: string;
  tipo_documento: 'nota' | 'evento';
  forma_distribuicao: 'resumida' | 'completa';
  cpf_cnpj_emitente?: string;
  nome_emitente?: string;
  cpf_cnpj_destinatario?: string;
  nome_destinatario?: string;
  data_emissao?: string;
  valor_total?: number;
  situacao?: string;
  tipo_nfe?: number;
}

export interface DistribuicaoNfeListagem {
  data: DistribuicaoNfe[];
  '@count'?: number;
}

export interface DistribuicaoNfeDocumentoListagem {
  data: DistribuicaoNfeDocumento[];
  '@count'?: number;
}

export interface DistribuicaoNfePedido {
  cpf_cnpj: string;
  ambiente: 'homologacao' | 'producao';
  dist_nsu?: number;
  cons_nsu?: number;
  cons_chave?: string;
}

export interface ManifestacaoNfe {
  id: string;
  ambiente: 'homologacao' | 'producao';
  created_at: string;
  status: string;
  tipo_evento: string;
  chave_nfe: string;
  data_evento?: string;
  protocolo?: string;
}

export interface ManifestacaoNfeListagem {
  data: ManifestacaoNfe[];
  '@count'?: number;
}

export type TipoManifestacao = 
  | 'ciencia'           // 210210 - Ciência da Operação
  | 'confirmacao'       // 210200 - Confirmação da Operação
  | 'desconhecimento'   // 210220 - Desconhecimento da Operação
  | 'nao_realizada';    // 210240 - Operação não Realizada

// ===== DISTRIBUIÇÃO =====

/**
 * Solicita distribuição de NF-e
 * Busca documentos fiscais emitidos contra o CNPJ/CPF
 */
export async function gerarDistribuicao(
  config: NuvemFiscalConfig,
  pedido: DistribuicaoNfePedido,
  kv?: KVNamespace
): Promise<DistribuicaoNfe> {
  return nuvemFiscalRequest<DistribuicaoNfe>(
    config,
    '/distribuicao/nfe',
    {
      method: 'POST',
      body: JSON.stringify({
        cpf_cnpj: pedido.cpf_cnpj.replace(/\D/g, ''),
        ambiente: pedido.ambiente,
        dist_nsu: pedido.dist_nsu,
        cons_nsu: pedido.cons_nsu,
        cons_chave: pedido.cons_chave,
      }),
    },
    kv
  );
}

/**
 * Consulta status de uma distribuição
 */
export async function consultarDistribuicao(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<DistribuicaoNfe> {
  return nuvemFiscalRequest<DistribuicaoNfe>(
    config,
    `/distribuicao/nfe/${id}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Lista distribuições realizadas
 */
export async function listarDistribuicoes(
  config: NuvemFiscalConfig,
  filtros: {
    cpf_cnpj: string;
    ambiente: 'homologacao' | 'producao';
  },
  paginacao?: PaginacaoParams,
  kv?: KVNamespace
): Promise<DistribuicaoNfeListagem> {
  const params = new URLSearchParams({
    cpf_cnpj: filtros.cpf_cnpj.replace(/\D/g, ''),
    ambiente: filtros.ambiente,
  });

  if (paginacao?.$top) params.append('$top', paginacao.$top.toString());
  if (paginacao?.$skip) params.append('$skip', paginacao.$skip.toString());
  if (paginacao?.$inlinecount) params.append('$inlinecount', 'true');

  return nuvemFiscalRequest<DistribuicaoNfeListagem>(
    config,
    `/distribuicao/nfe?${params.toString()}`,
    { method: 'GET' },
    kv
  );
}

// ===== DOCUMENTOS =====

/**
 * Lista documentos recebidos na distribuição
 */
export async function listarDocumentos(
  config: NuvemFiscalConfig,
  filtros: {
    cpf_cnpj: string;
    ambiente: 'homologacao' | 'producao';
    tipo_documento?: 'nota' | 'evento';
    forma_distribuicao?: 'resumida' | 'completa';
    chave_acesso?: string;
  },
  paginacao?: PaginacaoParams,
  kv?: KVNamespace
): Promise<DistribuicaoNfeDocumentoListagem> {
  const params = new URLSearchParams({
    cpf_cnpj: filtros.cpf_cnpj.replace(/\D/g, ''),
    ambiente: filtros.ambiente,
  });

  if (filtros.tipo_documento) params.append('tipo_documento', filtros.tipo_documento);
  if (filtros.forma_distribuicao) params.append('forma_distribuicao', filtros.forma_distribuicao);
  if (filtros.chave_acesso) params.append('chave_acesso', filtros.chave_acesso);
  if (paginacao?.$top) params.append('$top', paginacao.$top.toString());
  if (paginacao?.$skip) params.append('$skip', paginacao.$skip.toString());
  if (paginacao?.$inlinecount) params.append('$inlinecount', 'true');

  return nuvemFiscalRequest<DistribuicaoNfeDocumentoListagem>(
    config,
    `/distribuicao/nfe/documentos?${params.toString()}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Consulta documento específico
 */
export async function consultarDocumento(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<DistribuicaoNfeDocumento> {
  return nuvemFiscalRequest<DistribuicaoNfeDocumento>(
    config,
    `/distribuicao/nfe/documentos/${id}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Baixa XML do documento
 */
export async function baixarXmlDocumento(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/distribuicao/nfe/documentos/${id}/xml`,
    { method: 'GET' },
    kv
  );
}

/**
 * Lista notas sem manifestação
 * Útil para identificar notas pendentes de confirmação
 */
export async function listarNotasSemManifestacao(
  config: NuvemFiscalConfig,
  filtros: {
    cpf_cnpj: string;
    ambiente: 'homologacao' | 'producao';
  },
  paginacao?: PaginacaoParams,
  kv?: KVNamespace
): Promise<DistribuicaoNfeDocumentoListagem> {
  const params = new URLSearchParams({
    cpf_cnpj: filtros.cpf_cnpj.replace(/\D/g, ''),
    ambiente: filtros.ambiente,
  });

  if (paginacao?.$top) params.append('$top', paginacao.$top.toString());
  if (paginacao?.$skip) params.append('$skip', paginacao.$skip.toString());
  if (paginacao?.$inlinecount) params.append('$inlinecount', 'true');

  return nuvemFiscalRequest<DistribuicaoNfeDocumentoListagem>(
    config,
    `/distribuicao/nfe/notas-sem-manifestacao?${params.toString()}`,
    { method: 'GET' },
    kv
  );
}

// ===== MANIFESTAÇÃO DO DESTINATÁRIO =====

/**
 * Manifesta nota fiscal (confirmar, desconhecer, etc)
 */
export async function manifestarNota(
  config: NuvemFiscalConfig,
  dados: {
    cpf_cnpj: string;
    ambiente: 'homologacao' | 'producao';
    chave: string;
    tipo_evento: TipoManifestacao;
    justificativa?: string; // Obrigatório para 'nao_realizada'
  },
  kv?: KVNamespace
): Promise<ManifestacaoNfe> {
  // Mapear tipo para código do evento
  const codigoEvento: Record<TipoManifestacao, number> = {
    'confirmacao': 210200,
    'ciencia': 210210,
    'desconhecimento': 210220,
    'nao_realizada': 210240,
  };

  if (dados.tipo_evento === 'nao_realizada' && !dados.justificativa) {
    throw new Error('Justificativa é obrigatória para "Operação não Realizada"');
  }

  return nuvemFiscalRequest<ManifestacaoNfe>(
    config,
    '/distribuicao/nfe/manifestacoes',
    {
      method: 'POST',
      body: JSON.stringify({
        cpf_cnpj: dados.cpf_cnpj.replace(/\D/g, ''),
        ambiente: dados.ambiente,
        chave: dados.chave,
        tipo_evento: codigoEvento[dados.tipo_evento],
        justificativa: dados.justificativa,
      }),
    },
    kv
  );
}

/**
 * Consulta manifestação específica
 */
export async function consultarManifestacao(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<ManifestacaoNfe> {
  return nuvemFiscalRequest<ManifestacaoNfe>(
    config,
    `/distribuicao/nfe/manifestacoes/${id}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Lista manifestações realizadas
 */
export async function listarManifestacoes(
  config: NuvemFiscalConfig,
  filtros: {
    cpf_cnpj: string;
    ambiente: 'homologacao' | 'producao';
  },
  paginacao?: PaginacaoParams,
  kv?: KVNamespace
): Promise<ManifestacaoNfeListagem> {
  const params = new URLSearchParams({
    cpf_cnpj: filtros.cpf_cnpj.replace(/\D/g, ''),
    ambiente: filtros.ambiente,
  });

  if (paginacao?.$top) params.append('$top', paginacao.$top.toString());
  if (paginacao?.$skip) params.append('$skip', paginacao.$skip.toString());
  if (paginacao?.$inlinecount) params.append('$inlinecount', 'true');

  return nuvemFiscalRequest<ManifestacaoNfeListagem>(
    config,
    `/distribuicao/nfe/manifestacoes?${params.toString()}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Baixa XML da manifestação
 */
export async function baixarXmlManifestacao(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/distribuicao/nfe/manifestacoes/${id}/xml`,
    { method: 'GET' },
    kv
  );
}

// ===== HELPERS =====

/**
 * Busca todas as notas recebidas desde o último NSU
 * Faz polling até concluir
 */
export async function sincronizarNotas(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  ambiente: 'homologacao' | 'producao',
  ultimo_nsu: number = 0,
  kv?: KVNamespace,
  onProgress?: (status: string, documentos: number) => void
): Promise<DistribuicaoNfeDocumento[]> {
  const documentos: DistribuicaoNfeDocumento[] = [];
  let nsu_atual = ultimo_nsu;
  let continuar = true;

  while (continuar) {
    // Solicitar distribuição
    const distribuicao = await gerarDistribuicao(config, {
      cpf_cnpj,
      ambiente,
      dist_nsu: nsu_atual,
    }, kv);

    // Aguardar processamento
    let status = distribuicao.status;
    while (status === 'processando' || status === 'pendente') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const consulta = await consultarDistribuicao(config, distribuicao.id, kv);
      status = consulta.status;
      
      if (onProgress) {
        onProgress(status, documentos.length);
      }
    }

    if (status === 'erro') {
      throw new Error('Erro ao processar distribuição');
    }

    // Buscar documentos desta distribuição
    const docs = await listarDocumentos(config, {
      cpf_cnpj,
      ambiente,
    }, { $top: 100 }, kv);

    if (docs.data.length === 0) {
      continuar = false;
    } else {
      documentos.push(...docs.data);
      
      // Atualizar NSU para próxima iteração
      const maxNsu = Math.max(...docs.data.map(d => d.nsu));
      if (maxNsu <= nsu_atual) {
        continuar = false;
      } else {
        nsu_atual = maxNsu;
      }
    }
  }

  return documentos;
}

/**
 * Confirma todas as notas pendentes de manifestação
 */
export async function confirmarNotasPendentes(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  ambiente: 'homologacao' | 'producao',
  kv?: KVNamespace
): Promise<ManifestacaoNfe[]> {
  const pendentes = await listarNotasSemManifestacao(config, {
    cpf_cnpj,
    ambiente,
  }, { $top: 100 }, kv);

  const manifestacoes: ManifestacaoNfe[] = [];

  for (const nota of pendentes.data) {
    if (nota.chave) {
      try {
        const manifestacao = await manifestarNota(config, {
          cpf_cnpj,
          ambiente,
          chave: nota.chave,
          tipo_evento: 'confirmacao',
        }, kv);
        manifestacoes.push(manifestacao);
      } catch (error) {
        console.error(`Erro ao manifestar nota ${nota.chave}:`, error);
      }
    }
  }

  return manifestacoes;
}
