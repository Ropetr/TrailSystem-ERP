// =============================================
// PLANAC ERP - Nuvem Fiscal NF-e Service
// Emissão, consulta e eventos de NF-e
// =============================================

import type { 
  NuvemFiscalConfig, 
  Dfe,
  DfeListagem,
  DfeEvento,
  DfeSefazStatus,
  NfePedidoEmissao,
  NfePedidoCancelamento,
  NfePedidoCartaCorrecao,
  NfePedidoInutilizacao,
  NfeInutilizacao,
  PaginacaoParams 
} from './types';
import { nuvemFiscalRequest } from './auth';

// ===== EMISSÃO =====

/**
 * Emite uma NF-e
 */
export async function emitirNfe(
  config: NuvemFiscalConfig,
  pedido: NfePedidoEmissao,
  kv?: KVNamespace
): Promise<Dfe> {
  return nuvemFiscalRequest<Dfe>(
    config,
    '/nfe',
    {
      method: 'POST',
      body: JSON.stringify(pedido),
    },
    kv
  );
}

/**
 * Emite lote de NF-e (até 50 notas)
 */
export async function emitirLoteNfe(
  config: NuvemFiscalConfig,
  pedidos: NfePedidoEmissao[],
  idLote: string,
  ambiente: 'homologacao' | 'producao',
  kv?: KVNamespace
): Promise<Dfe> {
  return nuvemFiscalRequest<Dfe>(
    config,
    '/nfe/lotes',
    {
      method: 'POST',
      body: JSON.stringify({
        documentos: pedidos,
        ambiente,
        id_lote: idLote,
      }),
    },
    kv
  );
}

// ===== CONSULTAS =====

/**
 * Consulta NF-e pelo ID
 */
export async function consultarNfe(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Dfe> {
  return nuvemFiscalRequest<Dfe>(
    config,
    `/nfe/${id}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Lista NF-e emitidas
 */
export async function listarNfe(
  config: NuvemFiscalConfig,
  filtros?: {
    cpf_cnpj?: string;
    ambiente?: 'homologacao' | 'producao';
    referencia?: string;
    chave?: string;
  },
  paginacao?: PaginacaoParams,
  kv?: KVNamespace
): Promise<DfeListagem> {
  const params = new URLSearchParams();

  if (filtros?.cpf_cnpj) params.append('cpf_cnpj', filtros.cpf_cnpj.replace(/\D/g, ''));
  if (filtros?.ambiente) params.append('ambiente', filtros.ambiente);
  if (filtros?.referencia) params.append('referencia', filtros.referencia);
  if (filtros?.chave) params.append('chave', filtros.chave);
  if (paginacao?.$top) params.append('$top', paginacao.$top.toString());
  if (paginacao?.$skip) params.append('$skip', paginacao.$skip.toString());
  if (paginacao?.$inlinecount) params.append('$inlinecount', 'true');

  const query = params.toString();
  const endpoint = query ? `/nfe?${query}` : '/nfe';

  return nuvemFiscalRequest<DfeListagem>(config, endpoint, { method: 'GET' }, kv);
}

/**
 * Consulta status do serviço na SEFAZ
 */
export async function consultarStatusSefaz(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  autorizador?: string,
  kv?: KVNamespace
): Promise<DfeSefazStatus> {
  const params = new URLSearchParams({
    cpf_cnpj: cpf_cnpj.replace(/\D/g, ''),
  });
  if (autorizador) params.append('autorizador', autorizador);

  return nuvemFiscalRequest<DfeSefazStatus>(
    config,
    `/nfe/sefaz/status?${params.toString()}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Consulta cadastro do contribuinte na SEFAZ
 */
export async function consultarContribuinte(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  documento: string,
  argumento: 'CNPJ' | 'CPF' | 'IE',
  uf?: string,
  kv?: KVNamespace
): Promise<any> {
  const params = new URLSearchParams({
    cpf_cnpj: cpf_cnpj.replace(/\D/g, ''),
    argumento,
    documento: documento.replace(/\D/g, ''),
  });
  if (uf) params.append('uf', uf);

  return nuvemFiscalRequest<any>(
    config,
    `/nfe/cadastro-contribuinte?${params.toString()}`,
    { method: 'GET' },
    kv
  );
}

// ===== DOWNLOADS =====

/**
 * Baixa XML da NF-e
 */
export async function baixarXmlNfe(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/nfe/${id}/xml`,
    { method: 'GET' },
    kv
  );
}

/**
 * Baixa PDF (DANFE) da NF-e
 */
export async function baixarPdfNfe(
  config: NuvemFiscalConfig,
  id: string,
  opcoes?: {
    logo?: string;
    logotipo?: 'topo' | 'esquerda' | 'direita';
    mensagem_rodape?: string;
  },
  kv?: KVNamespace
): Promise<Blob> {
  const params = new URLSearchParams();
  if (opcoes?.logo) params.append('logo', opcoes.logo);
  if (opcoes?.logotipo) params.append('logotipo', opcoes.logotipo);
  if (opcoes?.mensagem_rodape) params.append('mensagem_rodape', opcoes.mensagem_rodape);

  const query = params.toString();
  const endpoint = query ? `/nfe/${id}/pdf?${query}` : `/nfe/${id}/pdf`;

  return nuvemFiscalRequest<Blob>(config, endpoint, { method: 'GET' }, kv);
}

// ===== CANCELAMENTO =====

/**
 * Cancela NF-e autorizada
 */
export async function cancelarNfe(
  config: NuvemFiscalConfig,
  id: string,
  justificativa: string,
  kv?: KVNamespace
): Promise<DfeEvento> {
  if (justificativa.length < 15 || justificativa.length > 255) {
    throw new Error('Justificativa deve ter entre 15 e 255 caracteres');
  }

  return nuvemFiscalRequest<DfeEvento>(
    config,
    `/nfe/${id}/cancelamento`,
    {
      method: 'POST',
      body: JSON.stringify({ justificativa }),
    },
    kv
  );
}

/**
 * Consulta cancelamento da NF-e
 */
export async function consultarCancelamento(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<DfeEvento | null> {
  try {
    return await nuvemFiscalRequest<DfeEvento>(
      config,
      `/nfe/${id}/cancelamento`,
      { method: 'GET' },
      kv
    );
  } catch (error: any) {
    if (error.status === 404) return null;
    throw error;
  }
}

/**
 * Baixa XML do cancelamento
 */
export async function baixarXmlCancelamento(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/nfe/${id}/cancelamento/xml`,
    { method: 'GET' },
    kv
  );
}

/**
 * Baixa PDF do cancelamento
 */
export async function baixarPdfCancelamento(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/nfe/${id}/cancelamento/pdf`,
    { method: 'GET' },
    kv
  );
}

// ===== CARTA DE CORREÇÃO =====

/**
 * Emite carta de correção
 */
export async function emitirCartaCorrecao(
  config: NuvemFiscalConfig,
  id: string,
  correcao: string,
  kv?: KVNamespace
): Promise<DfeEvento> {
  if (correcao.length < 15 || correcao.length > 1000) {
    throw new Error('Correção deve ter entre 15 e 1000 caracteres');
  }

  return nuvemFiscalRequest<DfeEvento>(
    config,
    `/nfe/${id}/carta-correcao`,
    {
      method: 'POST',
      body: JSON.stringify({ correcao }),
    },
    kv
  );
}

/**
 * Lista cartas de correção da NF-e
 */
export async function listarCartasCorrecao(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<DfeEvento[]> {
  const result = await nuvemFiscalRequest<{ data: DfeEvento[] }>(
    config,
    `/nfe/${id}/carta-correcao`,
    { method: 'GET' },
    kv
  );
  return result.data || [];
}

/**
 * Baixa XML da carta de correção
 */
export async function baixarXmlCartaCorrecao(
  config: NuvemFiscalConfig,
  idEvento: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/nfe/eventos/${idEvento}/xml`,
    { method: 'GET' },
    kv
  );
}

/**
 * Baixa PDF da carta de correção
 */
export async function baixarPdfCartaCorrecao(
  config: NuvemFiscalConfig,
  idEvento: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/nfe/eventos/${idEvento}/pdf`,
    { method: 'GET' },
    kv
  );
}

// ===== INUTILIZAÇÃO =====

/**
 * Inutiliza faixa de numeração
 */
export async function inutilizarNumeracao(
  config: NuvemFiscalConfig,
  pedido: NfePedidoInutilizacao,
  kv?: KVNamespace
): Promise<NfeInutilizacao> {
  if (pedido.justificativa.length < 15 || pedido.justificativa.length > 255) {
    throw new Error('Justificativa deve ter entre 15 e 255 caracteres');
  }

  return nuvemFiscalRequest<NfeInutilizacao>(
    config,
    '/nfe/inutilizacoes',
    {
      method: 'POST',
      body: JSON.stringify(pedido),
    },
    kv
  );
}

/**
 * Lista inutilizações
 */
export async function listarInutilizacoes(
  config: NuvemFiscalConfig,
  cpf_cnpj: string,
  ambiente?: 'homologacao' | 'producao',
  paginacao?: PaginacaoParams,
  kv?: KVNamespace
): Promise<{ data: NfeInutilizacao[]; '@count'?: number }> {
  const params = new URLSearchParams({
    cpf_cnpj: cpf_cnpj.replace(/\D/g, ''),
  });
  if (ambiente) params.append('ambiente', ambiente);
  if (paginacao?.$top) params.append('$top', paginacao.$top.toString());
  if (paginacao?.$skip) params.append('$skip', paginacao.$skip.toString());
  if (paginacao?.$inlinecount) params.append('$inlinecount', 'true');

  return nuvemFiscalRequest<{ data: NfeInutilizacao[]; '@count'?: number }>(
    config,
    `/nfe/inutilizacoes?${params.toString()}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Consulta inutilização pelo ID
 */
export async function consultarInutilizacao(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<NfeInutilizacao> {
  return nuvemFiscalRequest<NfeInutilizacao>(
    config,
    `/nfe/inutilizacoes/${id}`,
    { method: 'GET' },
    kv
  );
}

/**
 * Baixa XML da inutilização
 */
export async function baixarXmlInutilizacao(
  config: NuvemFiscalConfig,
  id: string,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    `/nfe/inutilizacoes/${id}/xml`,
    { method: 'GET' },
    kv
  );
}

// ===== EMAIL =====

/**
 * Envia NF-e por email
 */
export async function enviarEmailNfe(
  config: NuvemFiscalConfig,
  id: string,
  email: {
    para: string[];
    cc?: string[];
    cco?: string[];
    assunto?: string;
    corpo?: string;
    anexar_pdf?: boolean;
    anexar_xml?: boolean;
  },
  kv?: KVNamespace
): Promise<void> {
  await nuvemFiscalRequest<void>(
    config,
    `/nfe/${id}/email`,
    {
      method: 'POST',
      body: JSON.stringify(email),
    },
    kv
  );
}

// ===== PRÉVIA =====

/**
 * Gera prévia do XML (sem valor fiscal)
 */
export async function gerarPreviaXml(
  config: NuvemFiscalConfig,
  pedido: NfePedidoEmissao,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    '/nfe/previa/xml',
    {
      method: 'POST',
      body: JSON.stringify(pedido),
    },
    kv
  );
}

/**
 * Gera prévia do PDF (DANFE sem valor fiscal)
 */
export async function gerarPreviaPdf(
  config: NuvemFiscalConfig,
  pedido: NfePedidoEmissao,
  kv?: KVNamespace
): Promise<Blob> {
  return nuvemFiscalRequest<Blob>(
    config,
    '/nfe/previa/pdf',
    {
      method: 'POST',
      body: JSON.stringify(pedido),
    },
    kv
  );
}

