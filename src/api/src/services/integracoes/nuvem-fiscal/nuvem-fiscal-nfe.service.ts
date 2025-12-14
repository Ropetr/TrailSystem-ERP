// =============================================
// PLANAC ERP - Nuvem Fiscal NF-e Service
// =============================================
// Emissão, consulta e eventos de NF-e
// Documentação: https://dev.nuvemfiscal.com.br/docs/nfe

import { nuvemFiscalRequest } from './nuvem-fiscal-auth.service';

// =============================================
// Interfaces NF-e
// =============================================

export interface NFeDestinatario {
  cpf_cnpj: string;
  id_estrangeiro?: string;
  nome: string;
  endereco?: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    codigo_municipio: string;
    nome_municipio: string;
    uf: string;
    cep: string;
    codigo_pais?: string;
    nome_pais?: string;
    fone?: string;
  };
  indicador_inscricao_estadual: 1 | 2 | 9; // 1=Contribuinte, 2=Isento, 9=Não contribuinte
  inscricao_estadual?: string;
  inscricao_suframa?: string;
  email?: string;
}

export interface NFeProduto {
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
  valor_frete?: number;
  valor_seguro?: number;
  valor_desconto?: number;
  valor_outras_despesas?: number;
  indica_total: 0 | 1; // 0=Não compõe total, 1=Compõe total
  numero_pedido?: string;
  numero_item_pedido?: number;
}

export interface NFeImposto {
  valor_total_tributos?: number;
  icms: {
    origem: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // Origem da mercadoria
    cst?: string;
    csosn?: string; // Para Simples Nacional
    modalidade_base_calculo?: 0 | 1 | 2 | 3;
    valor_base_calculo?: number;
    aliquota?: number;
    valor?: number;
    // ... outros campos ICMS conforme necessário
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
  ipi?: {
    cst: string;
    valor_base_calculo?: number;
    aliquota?: number;
    valor?: number;
  };
}

export interface NFeItem {
  numero_item: number;
  produto: NFeProduto;
  imposto: NFeImposto;
  informacoes_adicionais?: string;
}

export interface NFeTransporte {
  modalidade_frete: 0 | 1 | 2 | 3 | 4 | 9; // 0=Emitente, 1=Destinatário, 2=Terceiros, 3=Próprio remetente, 4=Próprio destinatário, 9=Sem frete
  transportadora?: {
    cpf_cnpj?: string;
    nome?: string;
    inscricao_estadual?: string;
    endereco?: string;
    nome_municipio?: string;
    uf?: string;
  };
  volumes?: {
    quantidade?: number;
    especie?: string;
    marca?: string;
    numeracao?: string;
    peso_liquido?: number;
    peso_bruto?: number;
  }[];
}

export interface NFePagamento {
  indicador_forma_pagamento: 0 | 1; // 0=À vista, 1=A prazo
  pagamentos: {
    meio_pagamento: string; // 01=Dinheiro, 02=Cheque, 03=Cartão Crédito, etc
    valor: number;
    data_vencimento?: string;
    cnpj_credenciadora?: string;
    bandeira?: string;
    autorizacao?: string;
  }[];
  valor_troco?: number;
}

export interface NFeRequest {
  ambiente: 1 | 2; // 1=Produção, 2=Homologação
  infNFe: {
    versao: string;
    identificacao: {
      codigo_uf: number;
      natureza_operacao: string;
      modelo: 55; // NF-e
      serie: number;
      numero_nf: number;
      data_emissao: string;
      data_saida_entrada?: string;
      tipo_operacao: 0 | 1; // 0=Entrada, 1=Saída
      destino_operacao: 1 | 2 | 3; // 1=Interna, 2=Interestadual, 3=Exterior
      codigo_municipio: string;
      tipo_impressao: 0 | 1 | 2 | 3 | 4 | 5;
      tipo_emissao: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 9;
      finalidade: 1 | 2 | 3 | 4; // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
      consumidor_final: 0 | 1; // 0=Não, 1=Sim
      presenca_comprador: 0 | 1 | 2 | 3 | 4 | 5 | 9;
    };
    destinatario?: NFeDestinatario;
    itens: NFeItem[];
    total: {
      icms_total: {
        valor_base_calculo?: number;
        valor_icms?: number;
        valor_icms_desonerado?: number;
        valor_fcp?: number;
        valor_base_calculo_st?: number;
        valor_st?: number;
        valor_fcp_st?: number;
        valor_fcp_st_retido?: number;
        valor_produtos: number;
        valor_frete?: number;
        valor_seguro?: number;
        valor_desconto?: number;
        valor_ii?: number;
        valor_ipi?: number;
        valor_ipi_devolvido?: number;
        valor_pis?: number;
        valor_cofins?: number;
        valor_outras_despesas?: number;
        valor_nf: number;
        valor_total_tributos?: number;
      };
    };
    transporte: NFeTransporte;
    pagamento: NFePagamento;
    informacoes_adicionais?: {
      informacoes_contribuinte?: string;
      informacoes_fisco?: string;
    };
  };
}

export interface NFeResponse {
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
  // Campos da requisição
  infNFe?: NFeRequest['infNFe'];
}

export interface NFeEvento {
  tipo: 'cancelamento' | 'carta_correcao' | 'manifestacao';
  justificativa?: string;
  correcao?: string;
  data_evento: string;
  numero_protocolo?: string;
}

// =============================================
// Funções de Emissão
// =============================================

/**
 * Emite uma NF-e
 */
export async function emitirNFe(
  cpfCnpjEmitente: string,
  nfe: NFeRequest,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<NFeResponse> {
  const cnpjLimpo = cpfCnpjEmitente.replace(/\D/g, '');
  
  return nuvemFiscalRequest<NFeResponse>('/nfe', {
    method: 'POST',
    body: {
      ...nfe,
      ambiente: ambiente === 'producao' ? 1 : 2,
    },
    ambiente,
  });
}

/**
 * Consulta uma NF-e pelo ID
 */
export async function consultarNFe(
  nfeId: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<NFeResponse> {
  return nuvemFiscalRequest<NFeResponse>(`/nfe/${nfeId}`, { ambiente });
}

/**
 * Consulta uma NF-e pela chave de acesso
 */
export async function consultarNFePorChave(
  chaveAcesso: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<NFeResponse> {
  return nuvemFiscalRequest<NFeResponse>(`/nfe/chave/${chaveAcesso}`, { ambiente });
}

/**
 * Lista NF-e de uma empresa
 */
export async function listarNFe(
  cpfCnpjEmitente: string,
  filtros?: {
    status?: string;
    data_inicio?: string;
    data_fim?: string;
    pagina?: number;
    limite?: number;
  },
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<{ data: NFeResponse[]; total: number }> {
  const cnpjLimpo = cpfCnpjEmitente.replace(/\D/g, '');
  const params = new URLSearchParams();
  params.append('cpf_cnpj', cnpjLimpo);
  
  if (filtros?.status) params.append('status', filtros.status);
  if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio);
  if (filtros?.data_fim) params.append('data_fim', filtros.data_fim);
  if (filtros?.pagina) params.append('pagina', String(filtros.pagina));
  if (filtros?.limite) params.append('limite', String(filtros.limite));
  
  return nuvemFiscalRequest<{ data: NFeResponse[]; total: number }>(
    `/nfe?${params.toString()}`,
    { ambiente }
  );
}

// =============================================
// Funções de Eventos
// =============================================

/**
 * Cancela uma NF-e
 */
export async function cancelarNFe(
  nfeId: string,
  justificativa: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<NFeEvento> {
  if (justificativa.length < 15) {
    throw new Error('Justificativa deve ter no mínimo 15 caracteres');
  }
  
  return nuvemFiscalRequest<NFeEvento>(`/nfe/${nfeId}/cancelamento`, {
    method: 'POST',
    body: { justificativa },
    ambiente,
  });
}

/**
 * Emite carta de correção para uma NF-e
 */
export async function cartaCorrecaoNFe(
  nfeId: string,
  correcao: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<NFeEvento> {
  if (correcao.length < 15) {
    throw new Error('Texto da correção deve ter no mínimo 15 caracteres');
  }
  
  return nuvemFiscalRequest<NFeEvento>(`/nfe/${nfeId}/carta-correcao`, {
    method: 'POST',
    body: { correcao },
    ambiente,
  });
}

/**
 * Inutiliza uma faixa de numeração
 */
export async function inutilizarNumeracao(
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
  
  return nuvemFiscalRequest<{ protocolo: string; status: string }>('/nfe/inutilizacao', {
    method: 'POST',
    body: {
      cpf_cnpj: cnpjLimpo,
      ...dados,
    },
    ambiente,
  });
}

// =============================================
// Funções de Download
// =============================================

/**
 * Baixa o XML autorizado da NF-e
 */
export async function downloadXmlNFe(
  nfeId: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<string> {
  const response = await nuvemFiscalRequest<{ xml: string }>(
    `/nfe/${nfeId}/xml`,
    { ambiente }
  );
  return response.xml;
}

/**
 * Obtém URL do DANFE
 */
export async function obterUrlDanfe(
  nfeId: string,
  ambiente: 'sandbox' | 'producao' = 'sandbox'
): Promise<string> {
  const nfe = await consultarNFe(nfeId, ambiente);
  if (!nfe.danfe_url) {
    throw new Error('DANFE não disponível para esta NF-e');
  }
  return nfe.danfe_url;
}

// =============================================
// Funções Auxiliares PLANAC
// =============================================

/**
 * Monta NF-e a partir de um pedido PLANAC
 */
export function montarNFeFromPedido(pedido: {
  id: string;
  numero: number;
  data: string;
  cliente: {
    cpf_cnpj: string;
    nome: string;
    inscricaoEstadual?: string;
    email?: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      codigoMunicipio: string;
      cidade: string;
      uf: string;
      cep: string;
    };
  };
  itens: {
    codigo: string;
    descricao: string;
    ncm: string;
    cfop: string;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    impostos: {
      icmsOrigem: number;
      icmsCst: string;
      pisCst: string;
      cofinsCst: string;
    };
  }[];
  valorTotal: number;
  valorFrete?: number;
  valorDesconto?: number;
  naturezaOperacao: string;
  tipoOperacao: 0 | 1;
  formaPagamento: string;
  informacoesAdicionais?: string;
}, config: {
  serie: number;
  codigoUf: number;
  codigoMunicipio: string;
}): NFeRequest {
  // Identifica se é consumidor final
  const cnpjLimpo = pedido.cliente.cpf_cnpj.replace(/\D/g, '');
  const isPF = cnpjLimpo.length === 11;
  const consumidorFinal = isPF || !pedido.cliente.inscricaoEstadual ? 1 : 0;
  
  // Indicador IE
  let indicadorIE: 1 | 2 | 9 = 9; // Não contribuinte
  if (pedido.cliente.inscricaoEstadual) {
    indicadorIE = 1; // Contribuinte
  } else if (isPF) {
    indicadorIE = 9; // Não contribuinte
  }

  // Destino da operação
  const ufEmitente = config.codigoMunicipio.substring(0, 2);
  const ufDestinatario = pedido.cliente.endereco.codigoMunicipio.substring(0, 2);
  const destinoOperacao = ufEmitente === ufDestinatario ? 1 : 2;

  // Monta itens
  const itens: NFeItem[] = pedido.itens.map((item, index) => ({
    numero_item: index + 1,
    produto: {
      codigo: item.codigo,
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
      indica_total: 1,
      numero_pedido: pedido.numero.toString(),
      numero_item_pedido: index + 1,
    },
    imposto: {
      icms: {
        origem: item.impostos.icmsOrigem as 0,
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

  // Calcula totais
  const valorProdutos = itens.reduce((sum, i) => sum + i.produto.valor_bruto, 0);
  const valorNF = valorProdutos + (pedido.valorFrete || 0) - (pedido.valorDesconto || 0);

  // Mapeia forma de pagamento
  const meioPagamentoMap: Record<string, string> = {
    'dinheiro': '01',
    'cheque': '02',
    'cartao_credito': '03',
    'cartao_debito': '04',
    'credito_loja': '05',
    'vale_alimentacao': '10',
    'vale_refeicao': '11',
    'vale_presente': '12',
    'vale_combustivel': '13',
    'boleto': '15',
    'pix': '17',
    'outros': '99',
  };

  return {
    ambiente: 2, // Será sobrescrito na função de emissão
    infNFe: {
      versao: '4.00',
      identificacao: {
        codigo_uf: config.codigoUf,
        natureza_operacao: pedido.naturezaOperacao,
        modelo: 55,
        serie: config.serie,
        numero_nf: pedido.numero,
        data_emissao: new Date().toISOString(),
        tipo_operacao: pedido.tipoOperacao,
        destino_operacao: destinoOperacao as 1 | 2 | 3,
        codigo_municipio: config.codigoMunicipio,
        tipo_impressao: 1, // DANFE Normal Retrato
        tipo_emissao: 1, // Normal
        finalidade: 1, // Normal
        consumidor_final: consumidorFinal as 0 | 1,
        presenca_comprador: 1, // Presencial
      },
      destinatario: {
        cpf_cnpj: cnpjLimpo,
        nome: pedido.cliente.nome,
        endereco: {
          logradouro: pedido.cliente.endereco.logradouro,
          numero: pedido.cliente.endereco.numero,
          complemento: pedido.cliente.endereco.complemento,
          bairro: pedido.cliente.endereco.bairro,
          codigo_municipio: pedido.cliente.endereco.codigoMunicipio,
          nome_municipio: pedido.cliente.endereco.cidade,
          uf: pedido.cliente.endereco.uf,
          cep: pedido.cliente.endereco.cep.replace(/\D/g, ''),
        },
        indicador_inscricao_estadual: indicadorIE,
        inscricao_estadual: pedido.cliente.inscricaoEstadual,
        email: pedido.cliente.email,
      },
      itens,
      total: {
        icms_total: {
          valor_produtos: valorProdutos,
          valor_frete: pedido.valorFrete,
          valor_desconto: pedido.valorDesconto,
          valor_nf: valorNF,
        },
      },
      transporte: {
        modalidade_frete: pedido.valorFrete && pedido.valorFrete > 0 ? 1 : 9,
      },
      pagamento: {
        indicador_forma_pagamento: 0,
        pagamentos: [{
          meio_pagamento: meioPagamentoMap[pedido.formaPagamento] || '99',
          valor: valorNF,
        }],
      },
      informacoes_adicionais: pedido.informacoesAdicionais ? {
        informacoes_contribuinte: pedido.informacoesAdicionais,
      } : undefined,
    },
  };
}

export default {
  emitirNFe,
  consultarNFe,
  consultarNFePorChave,
  listarNFe,
  cancelarNFe,
  cartaCorrecaoNFe,
  inutilizarNumeracao,
  downloadXmlNFe,
  obterUrlDanfe,
  montarNFeFromPedido,
};
