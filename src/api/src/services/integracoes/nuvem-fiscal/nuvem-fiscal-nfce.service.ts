// =============================================
// PLANAC ERP - Nuvem Fiscal NFC-e Service
// =============================================
// Emissão de NFC-e para PDV (Ponto de Venda)
// Documentação: https://dev.nuvemfiscal.com.br/docs/nfce

import { nuvemFiscalRequest } from './nuvem-fiscal-auth.service';

// =============================================
// Interfaces NFC-e
// =============================================

export interface NFCeDestinatario {
  cpf_cnpj?: string;
  id_estrangeiro?: string;
  nome?: string;
  email?: string;
}

export interface NFCeProduto {
  codigo: string;
  codigo_barras?: string;
  descricao: string;
  ncm: string;
  cest?: string;
  cfop: string;
  unidade_comercial: string;
  quantidade_comercial: number;
  valor_unitario_comercial: number;
  valor_bruto: number;
  codigo_barras_tributacao?: string;
  unidade_tributacao: string;
  quantidade_tributacao: number;
  valor_unitario_tributacao: number;
  valor_desconto?: number;
  indica_total: 1;
}

export interface NFCeItem {
  numero_item: number;
  produto: NFCeProduto;
  imposto: {
    valor_total_tributos?: number;
    icms: {
      origem: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      csosn?: string; // Para Simples Nacional
      cst?: string;
      aliquota?: number;
      valor?: number;
    };
    pis?: {
      cst: string;
      valor_base_calculo?: number;
      aliquota?: number;
      valor?: number;
    };
    cofins?: {
      cst: string;
      valor_base_calculo?: number;
      aliquota?: number;
      valor?: number;
    };
  };
}

export interface NFCePagamento {
  meio_pagamento: string;
  valor: number;
  // Para cartão
  tipo_integracao?: 1 | 2; // 1=Integrado TEF, 2=Não integrado
  cnpj_credenciadora?: string;
  bandeira?: string;
  autorizacao?: string;
}

export interface NFCeRequest {
  ambiente: 1 | 2;
  infNFe: {
    versao: string;
    identificacao: {
      codigo_uf: number;
      natureza_operacao: string;
      modelo: 65; // NFC-e
      serie: number;
      numero_nf: number;
      data_emissao: string;
      tipo_operacao: 1; // Sempre saída para NFC-e
      destino_operacao: 1; // Sempre interna para NFC-e
      codigo_municipio: string;
      tipo_impressao: 4; // DANFE NFC-e
      tipo_emissao: 1 | 9; // 1=Normal, 9=Contingência offline
      finalidade: 1; // Normal
      consumidor_final: 1; // Sempre consumidor final
      presenca_comprador: 1 | 4; // 1=Presencial, 4=NFCe entrega domicílio
      id_token?: number; // CSC ID
      csc?: string; // Código de Segurança do Contribuinte
    };
    destinatario?: NFCeDestinatario;
    itens: NFCeItem[];
    total: {
      icms_total: {
        valor_base_calculo?: number;
        valor_icms?: number;
        valor_icms_desonerado?: number;
        valor_produtos: number;
        valor_desconto?: number;
        valor_pis?: number;
        valor_cofins?: number;
        valor_nf: number;
        valor_total_tributos?: number;
      };
    };
    transporte: {
      modalidade_frete: 9; // Sem frete para NFC-e
    };
    pagamento: {
      pagamentos: NFCePagamento[];
      valor_troco?: number;
    };
    informacoes_adicionais?: {
      informacoes_contribuinte?: string;
    };
  };
}

export interface NFCeResponse {
  id: string;
  ambiente: 1 | 2;
  created_at: string;
  status: 'pendente' | 'autorizado' | 'rejeitado' | 'cancelado' | 'erro';
  motivo?: string;
  chave_acesso?: string;
  numero_protocolo?: string;
  data_autorizacao?: string;
  xml_autorizado?: string;
  danfe_url?: string;
  qrcode?: string;
  qrcode_url?: string;
  url_consulta?: string;
}

// =============================================
// Funções de Emissão
// =============================================

/**
 * Emite uma NFC-e
 */
export async function emitirNFCe(
  cpfCnpjEmitente: string,
  nfce: NFCeRequest,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<NFCeResponse> {
  const cnpjLimpo = cpfCnpjEmitente.replace(/\D/g, '');
  
  return nuvemFiscalRequest<NFCeResponse>('/nfce', {
    method: 'POST',
    body: {
      ...nfce,
      ambiente: ambiente === 'producao' ? 1 : 2,
    },
    ambiente,
  });
}

/**
 * Consulta uma NFC-e pelo ID
 */
export async function consultarNFCe(
  nfceId: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<NFCeResponse> {
  return nuvemFiscalRequest<NFCeResponse>(`/nfce/${nfceId}`, { ambiente });
}

/**
 * Consulta NFC-e pela chave de acesso
 */
export async function consultarNFCePorChave(
  chaveAcesso: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<NFCeResponse> {
  return nuvemFiscalRequest<NFCeResponse>(`/nfce/chave/${chaveAcesso}`, { ambiente });
}

/**
 * Lista NFC-e de uma empresa
 */
export async function listarNFCe(
  cpfCnpjEmitente: string,
  filtros?: {
    status?: string;
    data_inicio?: string;
    data_fim?: string;
    pagina?: number;
    limite?: number;
  },
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<{ data: NFCeResponse[]; total: number }> {
  const cnpjLimpo = cpfCnpjEmitente.replace(/\D/g, '');
  const params = new URLSearchParams();
  params.append('cpf_cnpj', cnpjLimpo);
  
  if (filtros?.status) params.append('status', filtros.status);
  if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio);
  if (filtros?.data_fim) params.append('data_fim', filtros.data_fim);
  if (filtros?.pagina) params.append('pagina', String(filtros.pagina));
  if (filtros?.limite) params.append('limite', String(filtros.limite));
  
  return nuvemFiscalRequest<{ data: NFCeResponse[]; total: number }>(
    `/nfce?${params.toString()}`,
    { ambiente }
  );
}

// =============================================
// Funções de Eventos
// =============================================

/**
 * Cancela uma NFC-e
 * IMPORTANTE: NFC-e só pode ser cancelada em até 30 minutos após autorização
 */
export async function cancelarNFCe(
  nfceId: string,
  justificativa: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<{ protocolo: string; status: string; data_evento: string }> {
  if (justificativa.length < 15) {
    throw new Error('Justificativa deve ter no mínimo 15 caracteres');
  }
  
  return nuvemFiscalRequest(`/nfce/${nfceId}/cancelamento`, {
    method: 'POST',
    body: { justificativa },
    ambiente,
  });
}

/**
 * Inutiliza faixa de numeração de NFC-e
 */
export async function inutilizarNumeracaoNFCe(
  cpfCnpjEmitente: string,
  dados: {
    ano: number;
    serie: number;
    numero_inicial: number;
    numero_final: number;
    justificativa: string;
  },
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<{ protocolo: string; status: string }> {
  const cnpjLimpo = cpfCnpjEmitente.replace(/\D/g, '');
  
  return nuvemFiscalRequest('/nfce/inutilizacao', {
    method: 'POST',
    body: {
      cpf_cnpj: cnpjLimpo,
      modelo: 65,
      ...dados,
    },
    ambiente,
  });
}

// =============================================
// Funções de Download
// =============================================

/**
 * Baixa o XML autorizado
 */
export async function downloadXmlNFCe(
  nfceId: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<string> {
  const response = await nuvemFiscalRequest<{ xml: string }>(
    `/nfce/${nfceId}/xml`,
    { ambiente }
  );
  return response.xml;
}

/**
 * Obtém URL do DANFE NFC-e
 */
export async function obterUrlDanfeNFCe(
  nfceId: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<string> {
  const nfce = await consultarNFCe(nfceId, ambiente);
  if (!nfce.danfe_url) {
    throw new Error('DANFE não disponível para esta NFC-e');
  }
  return nfce.danfe_url;
}

// =============================================
// Funções Auxiliares PDV PLANAC
// =============================================

/**
 * Monta NFC-e a partir de uma venda do PDV
 */
export function montarNFCeFromVendaPDV(venda: {
  id: string;
  numero: number;
  data: string;
  cliente?: {
    cpf?: string;
    nome?: string;
    email?: string;
  };
  itens: {
    codigo: string;
    codigoBarras?: string;
    descricao: string;
    ncm: string;
    cfop: string;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    desconto?: number;
    impostos: {
      icmsOrigem: number;
      icmsCsosn?: string; // Para Simples Nacional
      icmsCst?: string;
      pisCst: string;
      cofinsCst: string;
    };
  }[];
  pagamentos: {
    tipo: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'outros';
    valor: number;
    bandeira?: string;
    autorizacao?: string;
  }[];
  valorTotal: number;
  valorDesconto?: number;
  valorTroco?: number;
}, config: {
  serie: number;
  codigoUf: number;
  codigoMunicipio: string;
  cscId?: number;
  csc?: string;
}): NFCeRequest {
  // Monta itens
  const itens: NFCeItem[] = venda.itens.map((item, index) => ({
    numero_item: index + 1,
    produto: {
      codigo: item.codigo,
      codigo_barras: item.codigoBarras || 'SEM GTIN',
      descricao: item.descricao,
      ncm: item.ncm,
      cfop: item.cfop,
      unidade_comercial: item.unidade,
      quantidade_comercial: item.quantidade,
      valor_unitario_comercial: item.valorUnitario,
      valor_bruto: item.valorTotal,
      unidade_tributacao: item.unidade,
      quantidade_tributacao: item.quantidade,
      valor_unitario_tributacao: item.valorUnitario,
      valor_desconto: item.desconto,
      indica_total: 1,
    },
    imposto: {
      icms: {
        origem: item.impostos.icmsOrigem as 0,
        csosn: item.impostos.icmsCsosn,
        cst: item.impostos.icmsCst,
      },
      pis: {
        cst: item.impostos.pisCst,
      },
      cofins: {
        cst: item.impostos.cofinsCst,
      },
    },
  }));

  // Mapeia formas de pagamento
  const meioPagamentoMap: Record<string, string> = {
    'dinheiro': '01',
    'pix': '17',
    'cartao_credito': '03',
    'cartao_debito': '04',
    'outros': '99',
  };

  // Monta pagamentos
  const pagamentos: NFCePagamento[] = venda.pagamentos.map((pag) => ({
    meio_pagamento: meioPagamentoMap[pag.tipo] || '99',
    valor: pag.valor,
    tipo_integracao: pag.tipo.includes('cartao') ? 2 : undefined, // Não integrado
    bandeira: pag.bandeira,
    autorizacao: pag.autorizacao,
  }));

  // Calcula totais
  const valorProdutos = itens.reduce((sum, i) => sum + i.produto.valor_bruto, 0);
  const valorDesconto = venda.valorDesconto || itens.reduce((sum, i) => sum + (i.produto.valor_desconto || 0), 0);
  const valorNF = valorProdutos - valorDesconto;

  return {
    ambiente: 2, // Será sobrescrito na função de emissão
    infNFe: {
      versao: '4.00',
      identificacao: {
        codigo_uf: config.codigoUf,
        natureza_operacao: 'VENDA AO CONSUMIDOR',
        modelo: 65,
        serie: config.serie,
        numero_nf: venda.numero,
        data_emissao: new Date().toISOString(),
        tipo_operacao: 1, // Saída
        destino_operacao: 1, // Interna
        codigo_municipio: config.codigoMunicipio,
        tipo_impressao: 4, // DANFE NFC-e
        tipo_emissao: 1, // Normal
        finalidade: 1, // Normal
        consumidor_final: 1, // Sempre consumidor final
        presenca_comprador: 1, // Presencial
        id_token: config.cscId,
        csc: config.csc,
      },
      destinatario: venda.cliente?.cpf ? {
        cpf_cnpj: venda.cliente.cpf.replace(/\D/g, ''),
        nome: venda.cliente.nome,
        email: venda.cliente.email,
      } : undefined,
      itens,
      total: {
        icms_total: {
          valor_produtos: valorProdutos,
          valor_desconto: valorDesconto > 0 ? valorDesconto : undefined,
          valor_nf: valorNF,
        },
      },
      transporte: {
        modalidade_frete: 9, // Sem frete
      },
      pagamento: {
        pagamentos,
        valor_troco: venda.valorTroco,
      },
    },
  };
}

/**
 * Verifica se NFC-e ainda pode ser cancelada (prazo de 30 min)
 */
export function podeSerCancelada(dataAutorizacao: string): {
  pode: boolean;
  minutosRestantes: number;
  mensagem: string;
} {
  const dataAut = new Date(dataAutorizacao);
  const agora = new Date();
  const diffMs = agora.getTime() - dataAut.getTime();
  const diffMinutos = diffMs / (1000 * 60);
  const minutosRestantes = Math.max(0, 30 - diffMinutos);

  if (diffMinutos > 30) {
    return {
      pode: false,
      minutosRestantes: 0,
      mensagem: 'Prazo de cancelamento expirado (máximo 30 minutos)',
    };
  }

  return {
    pode: true,
    minutosRestantes: Math.floor(minutosRestantes),
    mensagem: `Pode ser cancelada. Restam ${Math.floor(minutosRestantes)} minutos.`,
  };
}

/**
 * Valida se CPF/CNPJ está formatado corretamente para NFC-e
 */
export function validarDocumentoNFCe(documento?: string): {
  valido: boolean;
  tipo: 'cpf' | 'cnpj' | 'nenhum';
  mensagem: string;
} {
  if (!documento) {
    return {
      valido: true,
      tipo: 'nenhum',
      mensagem: 'Documento não informado (permitido em NFC-e)',
    };
  }

  const docLimpo = documento.replace(/\D/g, '');

  if (docLimpo.length === 11) {
    // Validação simples de CPF
    return {
      valido: true,
      tipo: 'cpf',
      mensagem: 'CPF válido',
    };
  }

  if (docLimpo.length === 14) {
    return {
      valido: true,
      tipo: 'cnpj',
      mensagem: 'CNPJ válido',
    };
  }

  return {
    valido: false,
    tipo: 'nenhum',
    mensagem: 'Documento inválido. Informe CPF (11 dígitos) ou CNPJ (14 dígitos)',
  };
}

export default {
  emitirNFCe,
  consultarNFCe,
  consultarNFCePorChave,
  listarNFCe,
  cancelarNFCe,
  inutilizarNumeracaoNFCe,
  downloadXmlNFCe,
  obterUrlDanfeNFCe,
  montarNFCeFromVendaPDV,
  podeSerCancelada,
  validarDocumentoNFCe,
};
