// =============================================
// PLANAC ERP - Integração Vendas → NF-e
// Converte venda ganha em nota fiscal
// =============================================

import type { 
  NuvemFiscalConfig,
  NfePedidoEmissao,
  NfeSefazInfNFe,
  NfeSefazIde,
  NfeSefazEmit,
  NfeSefazDest,
  NfeSefazDet,
  NfeSefazProd,
  NfeSefazImposto,
  NfeSefazTotal,
  NfeSefazTransp,
  NfeSefazPag,
  Dfe
} from '../services/nuvem-fiscal/types';
import { emitirNfe, consultarNfe } from '../services/nuvem-fiscal/nfe';

// ===== TIPOS DE VENDA PLANAC =====

export interface VendaPlanac {
  id: string;
  numero: number;
  data_venda: string;
  
  // Empresa emitente
  empresa: {
    cnpj: string;
    razao_social: string;
    nome_fantasia?: string;
    inscricao_estadual: string;
    inscricao_municipal?: string;
    endereco: EnderecoEmpresa;
    crt: number; // 1=Simples Nacional, 2=SN Excesso, 3=Normal
  };
  
  // Cliente
  cliente: {
    tipo: 'PF' | 'PJ';
    cpf_cnpj: string;
    nome: string;
    inscricao_estadual?: string;
    email?: string;
    telefone?: string;
    endereco?: EnderecoCliente;
    contribuinte: boolean; // É contribuinte de ICMS?
  };
  
  // Itens da venda
  itens: ItemVenda[];
  
  // Totais
  subtotal: number;
  desconto: number;
  frete: number;
  seguro: number;
  outras_despesas: number;
  total: number;
  
  // Pagamento
  pagamentos: PagamentoVenda[];
  
  // Transporte
  frete_por_conta: 'emitente' | 'destinatario' | 'terceiros' | 'proprio_rem' | 'proprio_dest' | 'sem_frete';
  transportadora?: Transportadora;
  volumes?: Volume[];
  
  // Informações adicionais
  informacoes_complementares?: string;
  informacoes_fisco?: string;
}

export interface EnderecoEmpresa {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  codigo_municipio: string;
  municipio: string;
  uf: string;
  cep: string;
}

export interface EnderecoCliente {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  codigo_municipio: string;
  municipio: string;
  uf: string;
  cep?: string;
  codigo_pais?: string;
  pais?: string;
  telefone?: string;
}

export interface ItemVenda {
  numero_item: number;
  produto: {
    codigo: string;
    codigo_barras?: string;
    descricao: string;
    ncm: string;
    cest?: string;
    cfop: string;
    unidade: string;
    origem: number; // 0=Nacional, 1-8=Importado
  };
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  desconto?: number;
  frete?: number;
  seguro?: number;
  outras_despesas?: number;
  
  // Impostos
  impostos: {
    icms: ImpostoICMS;
    pis: ImpostoPIS;
    cofins: ImpostoCOFINS;
    ipi?: ImpostoIPI;
  };
  
  informacoes_adicionais?: string;
}

export interface ImpostoICMS {
  situacao_tributaria: string; // CST ou CSOSN
  base_calculo?: number;
  aliquota?: number;
  valor?: number;
  // ST
  base_calculo_st?: number;
  aliquota_st?: number;
  valor_st?: number;
  // Simples Nacional
  aliquota_credito_sn?: number;
  valor_credito_sn?: number;
}

export interface ImpostoPIS {
  situacao_tributaria: string;
  base_calculo?: number;
  aliquota?: number;
  valor?: number;
}

export interface ImpostoCOFINS {
  situacao_tributaria: string;
  base_calculo?: number;
  aliquota?: number;
  valor?: number;
}

export interface ImpostoIPI {
  situacao_tributaria: string;
  base_calculo?: number;
  aliquota?: number;
  valor?: number;
}

export interface PagamentoVenda {
  forma: string; // 01=Dinheiro, 02=Cheque, 03=Cartão Crédito, etc
  valor: number;
  bandeira?: string;
  autorizacao?: string;
  cnpj_credenciadora?: string;
}

export interface Transportadora {
  cnpj?: string;
  cpf?: string;
  nome?: string;
  inscricao_estadual?: string;
  endereco?: string;
  municipio?: string;
  uf?: string;
  placa?: string;
  uf_veiculo?: string;
}

export interface Volume {
  quantidade?: number;
  especie?: string;
  marca?: string;
  numeracao?: string;
  peso_liquido?: number;
  peso_bruto?: number;
}

// ===== CONFIGURAÇÕES =====

export interface ConfiguracaoNfe {
  ambiente: 'homologacao' | 'producao';
  serie: number;
  proximo_numero: number;
  natureza_operacao: string;
  finalidade: number; // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
  tipo_impressao: number; // 1=Retrato, 2=Paisagem, 4=DANFE simplificado, 5=DANFE NFC-e
  tipo_emissao: number; // 1=Normal, 6=SCAN, 7=SVAN, 9=Offline
  indicador_consumidor_final: number; // 0=Normal, 1=Consumidor Final
  indicador_presenca: number; // 0=Não se aplica, 1=Presencial, 2=Internet, etc
}

// ===== FUNÇÃO PRINCIPAL =====

/**
 * Converte uma venda PLANAC em pedido de emissão de NF-e
 */
export function vendaParaNfe(
  venda: VendaPlanac,
  config: ConfiguracaoNfe
): NfePedidoEmissao {
  
  // Identificação da NF-e
  const ide: NfeSefazIde = {
    cUF: parseInt(venda.empresa.endereco.codigo_municipio.substring(0, 2)),
    natOp: config.natureza_operacao,
    mod: 55, // NF-e
    serie: config.serie,
    nNF: config.proximo_numero,
    dhEmi: new Date(venda.data_venda).toISOString(),
    tpNF: 1, // 1=Saída
    idDest: calcularDestinoOperacao(venda.empresa.endereco.uf, venda.cliente.endereco?.uf),
    cMunFG: venda.empresa.endereco.codigo_municipio,
    tpImp: config.tipo_impressao,
    tpEmis: config.tipo_emissao,
    finNFe: config.finalidade,
    indFinal: config.indicador_consumidor_final,
    indPres: config.indicador_presenca,
  };

  // Emitente
  const emit: NfeSefazEmit = {
    CNPJ: venda.empresa.cnpj.replace(/\D/g, ''),
    xNome: venda.empresa.razao_social,
    xFant: venda.empresa.nome_fantasia,
    enderEmit: {
      xLgr: venda.empresa.endereco.logradouro,
      nro: venda.empresa.endereco.numero,
      xCpl: venda.empresa.endereco.complemento,
      xBairro: venda.empresa.endereco.bairro,
      cMun: venda.empresa.endereco.codigo_municipio,
      xMun: venda.empresa.endereco.municipio,
      UF: venda.empresa.endereco.uf,
      CEP: venda.empresa.endereco.cep?.replace(/\D/g, ''),
      cPais: '1058',
      xPais: 'Brasil',
    },
    IE: venda.empresa.inscricao_estadual.replace(/\D/g, ''),
    IM: venda.empresa.inscricao_municipal?.replace(/\D/g, ''),
    CRT: venda.empresa.crt,
  };

  // Destinatário
  const dest: NfeSefazDest | undefined = venda.cliente ? {
    ...(venda.cliente.tipo === 'PJ' 
      ? { CNPJ: venda.cliente.cpf_cnpj.replace(/\D/g, '') }
      : { CPF: venda.cliente.cpf_cnpj.replace(/\D/g, '') }
    ),
    xNome: venda.cliente.nome,
    enderDest: venda.cliente.endereco ? {
      xLgr: venda.cliente.endereco.logradouro,
      nro: venda.cliente.endereco.numero,
      xCpl: venda.cliente.endereco.complemento,
      xBairro: venda.cliente.endereco.bairro,
      cMun: venda.cliente.endereco.codigo_municipio,
      xMun: venda.cliente.endereco.municipio,
      UF: venda.cliente.endereco.uf,
      CEP: venda.cliente.endereco.cep?.replace(/\D/g, ''),
      cPais: venda.cliente.endereco.codigo_pais || '1058',
      xPais: venda.cliente.endereco.pais || 'Brasil',
      fone: venda.cliente.telefone?.replace(/\D/g, ''),
    } : undefined,
    indIEDest: calcularIndicadorIE(venda.cliente),
    IE: venda.cliente.inscricao_estadual?.replace(/\D/g, ''),
    email: venda.cliente.email,
  } : undefined;

  // Itens
  const det: NfeSefazDet[] = venda.itens.map(item => ({
    nItem: item.numero_item,
    prod: {
      cProd: item.produto.codigo,
      cEAN: item.produto.codigo_barras || 'SEM GTIN',
      xProd: item.produto.descricao,
      NCM: item.produto.ncm.replace(/\D/g, ''),
      CEST: item.produto.cest?.replace(/\D/g, ''),
      CFOP: item.produto.cfop.replace(/\D/g, ''),
      uCom: item.produto.unidade,
      qCom: item.quantidade,
      vUnCom: item.valor_unitario,
      vProd: item.valor_total,
      cEANTrib: item.produto.codigo_barras || 'SEM GTIN',
      uTrib: item.produto.unidade,
      qTrib: item.quantidade,
      vUnTrib: item.valor_unitario,
      vDesc: item.desconto,
      vFrete: item.frete,
      vSeg: item.seguro,
      vOutro: item.outras_despesas,
      indTot: 1,
    },
    imposto: montarImpostos(item, venda.empresa.crt),
    infAdProd: item.informacoes_adicionais,
  }));

  // Totais
  const total: NfeSefazTotal = calcularTotais(venda);

  // Transporte
  const transp: NfeSefazTransp = {
    modFrete: mapearModalidadeFrete(venda.frete_por_conta),
    transporta: venda.transportadora ? {
      CNPJ: venda.transportadora.cnpj?.replace(/\D/g, ''),
      CPF: venda.transportadora.cpf?.replace(/\D/g, ''),
      xNome: venda.transportadora.nome,
      IE: venda.transportadora.inscricao_estadual?.replace(/\D/g, ''),
      xEnder: venda.transportadora.endereco,
      xMun: venda.transportadora.municipio,
      UF: venda.transportadora.uf,
    } : undefined,
    veicTransp: venda.transportadora?.placa ? {
      placa: venda.transportadora.placa,
      UF: venda.transportadora.uf_veiculo,
    } : undefined,
    vol: venda.volumes?.map(v => ({
      qVol: v.quantidade,
      esp: v.especie,
      marca: v.marca,
      nVol: v.numeracao,
      pesoL: v.peso_liquido,
      pesoB: v.peso_bruto,
    })),
  };

  // Pagamento
  const pag: NfeSefazPag = {
    detPag: venda.pagamentos.map(p => ({
      tPag: p.forma,
      vPag: p.valor,
      card: p.bandeira ? {
        tpIntegra: 1,
        CNPJ: p.cnpj_credenciadora?.replace(/\D/g, ''),
        tBand: p.bandeira,
        cAut: p.autorizacao,
      } : undefined,
    })),
    vTroco: calcularTroco(venda),
  };

  // Montar pedido
  const infNFe: NfeSefazInfNFe = {
    ide,
    emit,
    dest,
    det,
    total,
    transp,
    pag,
    infAdic: {
      infCpl: venda.informacoes_complementares,
      infAdFisco: venda.informacoes_fisco,
    },
  };

  return {
    ambiente: config.ambiente,
    referencia: venda.id,
    infNFe,
  };
}

// ===== HELPERS =====

function calcularDestinoOperacao(ufEmitente: string, ufDestino?: string): number {
  if (!ufDestino) return 1;
  if (ufEmitente === ufDestino) return 1; // Operação interna
  if (ufDestino === 'EX') return 3; // Exportação
  return 2; // Interestadual
}

function calcularIndicadorIE(cliente: VendaPlanac['cliente']): number {
  if (cliente.tipo === 'PF') return 9; // Não contribuinte
  if (!cliente.inscricao_estadual) return 9; // Não contribuinte
  if (cliente.inscricao_estadual.toUpperCase() === 'ISENTO') return 2; // Isento
  return 1; // Contribuinte
}

function montarImpostos(item: ItemVenda, crt: number): NfeSefazImposto {
  const icms = item.impostos.icms;
  const pis = item.impostos.pis;
  const cofins = item.impostos.cofins;
  
  // Determinar se usa CST ou CSOSN
  const usaSimples = crt === 1 || crt === 2;
  
  const impostoICMS: any = {};
  
  if (usaSimples) {
    // Simples Nacional - usa CSOSN
    const csosn = icms.situacao_tributaria;
    
    if (csosn === '101') {
      impostoICMS.ICMSSN101 = {
        orig: item.produto.origem,
        CSOSN: csosn,
        pCredSN: icms.aliquota_credito_sn || 0,
        vCredICMSSN: icms.valor_credito_sn || 0,
      };
    } else if (['102', '103', '300', '400'].includes(csosn)) {
      impostoICMS.ICMSSN102 = {
        orig: item.produto.origem,
        CSOSN: csosn,
      };
    } else if (csosn === '500') {
      impostoICMS.ICMSSN500 = {
        orig: item.produto.origem,
        CSOSN: csosn,
        vBCSTRet: icms.base_calculo_st,
        pST: icms.aliquota_st,
        vICMSSTRet: icms.valor_st,
      };
    } else {
      impostoICMS.ICMSSN900 = {
        orig: item.produto.origem,
        CSOSN: csosn,
        modBC: 3,
        vBC: icms.base_calculo,
        pICMS: icms.aliquota,
        vICMS: icms.valor,
      };
    }
  } else {
    // Regime Normal - usa CST
    const cst = icms.situacao_tributaria;
    
    if (cst === '00') {
      impostoICMS.ICMS00 = {
        orig: item.produto.origem,
        CST: cst,
        modBC: 3,
        vBC: icms.base_calculo || 0,
        pICMS: icms.aliquota || 0,
        vICMS: icms.valor || 0,
      };
    } else if (['40', '41', '50'].includes(cst)) {
      impostoICMS.ICMS40 = {
        orig: item.produto.origem,
        CST: cst,
      };
    } else if (cst === '60') {
      impostoICMS.ICMS60 = {
        orig: item.produto.origem,
        CST: cst,
        vBCSTRet: icms.base_calculo_st,
        vICMSSTRet: icms.valor_st,
      };
    } else {
      impostoICMS.ICMS90 = {
        orig: item.produto.origem,
        CST: cst,
        modBC: 3,
        vBC: icms.base_calculo,
        pICMS: icms.aliquota,
        vICMS: icms.valor,
      };
    }
  }
  
  // PIS
  const impostoPIS: any = {};
  if (['04', '05', '06', '07', '08', '09'].includes(pis.situacao_tributaria)) {
    impostoPIS.PISNT = { CST: pis.situacao_tributaria };
  } else if (['01', '02'].includes(pis.situacao_tributaria)) {
    impostoPIS.PISAliq = {
      CST: pis.situacao_tributaria,
      vBC: pis.base_calculo || 0,
      pPIS: pis.aliquota || 0,
      vPIS: pis.valor || 0,
    };
  } else {
    impostoPIS.PISOutr = {
      CST: pis.situacao_tributaria,
      vBC: pis.base_calculo,
      pPIS: pis.aliquota,
      vPIS: pis.valor || 0,
    };
  }

  // COFINS
  const impostoCOFINS: any = {};
  if (['04', '05', '06', '07', '08', '09'].includes(cofins.situacao_tributaria)) {
    impostoCOFINS.COFINSNT = { CST: cofins.situacao_tributaria };
  } else if (['01', '02'].includes(cofins.situacao_tributaria)) {
    impostoCOFINS.COFINSAliq = {
      CST: cofins.situacao_tributaria,
      vBC: cofins.base_calculo || 0,
      pCOFINS: cofins.aliquota || 0,
      vCOFINS: cofins.valor || 0,
    };
  } else {
    impostoCOFINS.COFINSOutr = {
      CST: cofins.situacao_tributaria,
      vBC: cofins.base_calculo,
      pCOFINS: cofins.aliquota,
      vCOFINS: cofins.valor || 0,
    };
  }

  return {
    ICMS: impostoICMS,
    PIS: impostoPIS,
    COFINS: impostoCOFINS,
  };
}

function calcularTotais(venda: VendaPlanac): NfeSefazTotal {
  let vBC = 0, vICMS = 0, vBCST = 0, vST = 0, vProd = 0;
  let vFrete = 0, vSeg = 0, vDesc = 0, vOutro = 0;
  let vPIS = 0, vCOFINS = 0, vIPI = 0;

  for (const item of venda.itens) {
    vProd += item.valor_total;
    vDesc += item.desconto || 0;
    vFrete += item.frete || 0;
    vSeg += item.seguro || 0;
    vOutro += item.outras_despesas || 0;
    
    vBC += item.impostos.icms.base_calculo || 0;
    vICMS += item.impostos.icms.valor || 0;
    vBCST += item.impostos.icms.base_calculo_st || 0;
    vST += item.impostos.icms.valor_st || 0;
    
    vPIS += item.impostos.pis.valor || 0;
    vCOFINS += item.impostos.cofins.valor || 0;
    vIPI += item.impostos.ipi?.valor || 0;
  }

  // Adicionar frete/seguro/outras despesas da venda (se não estiver nos itens)
  vFrete += venda.frete || 0;
  vSeg += venda.seguro || 0;
  vOutro += venda.outras_despesas || 0;
  vDesc += venda.desconto || 0;

  const vNF = vProd - vDesc + vST + vFrete + vSeg + vOutro + vIPI;

  return {
    ICMSTot: {
      vBC,
      vICMS,
      vICMSDeson: 0,
      vBCST,
      vST,
      vProd,
      vFrete,
      vSeg,
      vDesc,
      vII: 0,
      vIPI,
      vPIS,
      vCOFINS,
      vOutro,
      vNF,
    },
  };
}

function mapearModalidadeFrete(tipo: string): number {
  const mapa: Record<string, number> = {
    'emitente': 0,
    'destinatario': 1,
    'terceiros': 2,
    'proprio_rem': 3,
    'proprio_dest': 4,
    'sem_frete': 9,
  };
  return mapa[tipo] ?? 9;
}

function calcularTroco(venda: VendaPlanac): number {
  const totalPago = venda.pagamentos.reduce((acc, p) => acc + p.valor, 0);
  const troco = totalPago - venda.total;
  return troco > 0 ? troco : 0;
}

// ===== FUNÇÕES DE EMISSÃO =====

/**
 * Emite NF-e a partir de uma venda
 */
export async function emitirNfeDeVenda(
  config: NuvemFiscalConfig,
  venda: VendaPlanac,
  configNfe: ConfiguracaoNfe,
  kv?: KVNamespace
): Promise<Dfe> {
  const pedido = vendaParaNfe(venda, configNfe);
  return emitirNfe(config, pedido, kv);
}

/**
 * Aguarda emissão de NF-e (polling)
 */
export async function aguardarEmissaoNfe(
  config: NuvemFiscalConfig,
  idNfe: string,
  timeoutMs: number = 60000,
  kv?: KVNamespace
): Promise<Dfe> {
  const inicio = Date.now();
  
  while (Date.now() - inicio < timeoutMs) {
    const nfe = await consultarNfe(config, idNfe, kv);
    
    if (nfe.status === 'autorizado' || nfe.status === 'rejeitado' || 
        nfe.status === 'denegado' || nfe.status === 'erro') {
      return nfe;
    }
    
    // Aguardar 2 segundos antes de consultar novamente
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Timeout aguardando emissão da NF-e');
}

/**
 * Emite NF-e e aguarda resultado
 */
export async function emitirEAguardar(
  config: NuvemFiscalConfig,
  venda: VendaPlanac,
  configNfe: ConfiguracaoNfe,
  kv?: KVNamespace
): Promise<Dfe> {
  const nfe = await emitirNfeDeVenda(config, venda, configNfe, kv);
  return aguardarEmissaoNfe(config, nfe.id, 60000, kv);
}

export type { VendaPlanac, ConfiguracaoNfe, ItemVenda };
