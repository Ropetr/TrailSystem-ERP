// =============================================
// PLANAC ERP - Integração Venda→NF-e com IBPT
// Adiciona vTotTrib automaticamente
// =============================================

import { createIBPTApiService, IBPTCalculoResultado } from '../services/ibpt/ibpt-api-service';

// ===== TIPOS =====

interface ItemVenda {
  id: string;
  produto_id: string;
  ncm: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  unidade: string;
  cfop: string;
  origem: number; // 0=Nacional, 1-7=Importado
}

interface Venda {
  id: string;
  numero: number;
  cliente_id: string;
  itens: ItemVenda[];
  valor_produtos: number;
  valor_frete: number;
  valor_desconto: number;
  valor_total: number;
}

interface NFeProduto {
  nItem: number;
  cProd: string;
  cEAN: string;
  xProd: string;
  NCM: string;
  CFOP: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
  cEANTrib: string;
  uTrib: string;
  qTrib: number;
  vUnTrib: number;
  indTot: number;
  // Campos IBPT adicionados
  vTotTrib?: number;
  infAdProd?: string;
}

interface NFeTotal {
  vBC: number;
  vICMS: number;
  vProd: number;
  vFrete: number;
  vDesc: number;
  vNF: number;
  // Campo IBPT
  vTotTrib: number;
}

interface NFeInfAdic {
  infCpl?: string;
  infAdFisco?: string;
}

interface NFeComIBPT {
  produtos: NFeProduto[];
  total: NFeTotal;
  infAdic: NFeInfAdic;
  ibpt: {
    calculado: boolean;
    fonte: string;
    versao?: string;
    estatisticas: {
      itens_calculados: number;
      itens_cache: number;
      itens_api: number;
      itens_erro: number;
    };
  };
}

// ===== FUNÇÃO PRINCIPAL =====

/**
 * Converte venda para NF-e com cálculo automático de IBPT
 */
export async function converterVendaParaNFeComIBPT(
  db: D1Database,
  dbIbpt: D1Database,
  venda: Venda,
  empresaCnpj: string,
  uf: string
): Promise<NFeComIBPT> {
  // 1. Buscar configuração IBPT da empresa
  const config = await db
    .prepare(`
      SELECT ibpt_token, ibpt_uf 
      FROM empresas_config 
      WHERE cnpj = ? AND ativo = 1
    `)
    .bind(empresaCnpj.replace(/\D/g, ''))
    .first<{ ibpt_token: string; ibpt_uf: string }>();

  // 2. Preparar produtos base
  const produtos: NFeProduto[] = venda.itens.map((item, index) => ({
    nItem: index + 1,
    cProd: item.produto_id,
    cEAN: 'SEM GTIN',
    xProd: item.descricao,
    NCM: item.ncm.replace(/\D/g, ''),
    CFOP: item.cfop,
    uCom: item.unidade,
    qCom: item.quantidade,
    vUnCom: item.valor_unitario,
    vProd: item.valor_total,
    cEANTrib: 'SEM GTIN',
    uTrib: item.unidade,
    qTrib: item.quantidade,
    vUnTrib: item.valor_unitario,
    indTot: 1,
  }));

  // 3. Se não tem token IBPT, retorna sem cálculo
  if (!config?.ibpt_token) {
    return {
      produtos,
      total: {
        vBC: 0,
        vICMS: 0,
        vProd: venda.valor_produtos,
        vFrete: venda.valor_frete,
        vDesc: venda.valor_desconto,
        vNF: venda.valor_total,
        vTotTrib: 0,
      },
      infAdic: {},
      ibpt: {
        calculado: false,
        fonte: 'Token IBPT não configurado',
        estatisticas: {
          itens_calculados: 0,
          itens_cache: 0,
          itens_api: 0,
          itens_erro: 0,
        },
      },
    };
  }

  // 4. Criar serviço IBPT
  const ibptService = createIBPTApiService(dbIbpt, {
    token: config.ibpt_token,
    cnpj: empresaCnpj,
    uf: config.ibpt_uf || uf,
  });

  // 5. Preparar itens para consulta
  const itensParaConsulta = venda.itens.map(item => ({
    codigo: item.ncm,
    descricao: item.descricao,
    unidadeMedida: item.unidade,
    valor: item.valor_total,
    origem: (item.origem >= 1 && item.origem <= 7) ? 'importado' as const : 'nacional' as const,
  }));

  // 6. Calcular tributos em lote
  const resultadoIBPT = await ibptService.consultarLote(
    itensParaConsulta,
    config.ibpt_uf || uf
  );

  // 7. Adicionar vTotTrib e infAdProd em cada produto
  const produtosComIBPT: NFeProduto[] = produtos.map((prod, index) => {
    const tributo = resultadoIBPT.itens[index];
    return {
      ...prod,
      vTotTrib: tributo?.valor_tributo_total || 0,
      infAdProd: tributo?.valor_tributo_total 
        ? `Trib aprox R$${tributo.valor_tributo_total.toFixed(2)} (${tributo.aliquota_federal.toFixed(2)}% Fed, ${tributo.aliquota_estadual.toFixed(2)}% Est) Fonte: IBPT`
        : undefined,
    };
  });

  // 8. Montar totais
  const total: NFeTotal = {
    vBC: 0, // Será calculado pelo serviço fiscal
    vICMS: 0,
    vProd: venda.valor_produtos,
    vFrete: venda.valor_frete,
    vDesc: venda.valor_desconto,
    vNF: venda.valor_total,
    vTotTrib: resultadoIBPT.totais.tributo_total,
  };

  // 9. Montar informações complementares
  const { tributo_federal, tributo_estadual, tributo_municipal, tributo_total } = resultadoIBPT.totais;
  
  const textoIBPT = `Val Aprox Tributos R$ ${tributo_total.toFixed(2)} ` +
    `(${tributo_federal.toFixed(2)} Federal, ${tributo_estadual.toFixed(2)} Estadual` +
    (tributo_municipal > 0 ? `, ${tributo_municipal.toFixed(2)} Municipal` : '') +
    `) Fonte: IBPT - Lei 12.741/2012`;

  const infAdic: NFeInfAdic = {
    infCpl: textoIBPT,
  };

  // 10. Buscar versão do cache
  const versaoCache = await dbIbpt
    .prepare('SELECT versao FROM ibpt_cache ORDER BY atualizado_em DESC LIMIT 1')
    .first<{ versao: string }>();

  return {
    produtos: produtosComIBPT,
    total,
    infAdic,
    ibpt: {
      calculado: true,
      fonte: 'IBPT/empresometro.com.br',
      versao: versaoCache?.versao,
      estatisticas: {
        itens_calculados: resultadoIBPT.estatisticas.total,
        itens_cache: resultadoIBPT.estatisticas.cache_hits,
        itens_api: resultadoIBPT.estatisticas.api_calls,
        itens_erro: resultadoIBPT.itens.filter(i => i.fonte === 'ERRO').length,
      },
    },
  };
}

/**
 * Adiciona IBPT a uma NF-e já existente
 */
export async function adicionarIBPTaNFe(
  dbIbpt: D1Database,
  nfe: {
    produtos: Array<{
      NCM: string;
      xProd: string;
      uCom: string;
      vProd: number;
      orig: number;
    }>;
    total: { vNF: number };
    infAdic?: { infCpl?: string };
  },
  config: { token: string; cnpj: string; uf: string }
): Promise<{
  vTotTrib: number;
  infCplIBPT: string;
  itens: Array<{ vTotTrib: number; infAdProd: string }>;
}> {
  const ibptService = createIBPTApiService(dbIbpt, config);

  const itens = nfe.produtos.map(p => ({
    codigo: p.NCM,
    descricao: p.xProd,
    unidadeMedida: p.uCom,
    valor: p.vProd,
    origem: (p.orig >= 1 && p.orig <= 7) ? 'importado' as const : 'nacional' as const,
  }));

  const resultado = await ibptService.consultarLote(itens, config.uf);

  const { tributo_federal, tributo_estadual, tributo_municipal, tributo_total } = resultado.totais;
  
  const infCplIBPT = `Val Aprox Tributos R$ ${tributo_total.toFixed(2)} ` +
    `(${tributo_federal.toFixed(2)} Federal, ${tributo_estadual.toFixed(2)} Estadual` +
    (tributo_municipal > 0 ? `, ${tributo_municipal.toFixed(2)} Municipal` : '') +
    `) Fonte: IBPT - Lei 12.741/2012`;

  return {
    vTotTrib: tributo_total,
    infCplIBPT,
    itens: resultado.itens.map(i => ({
      vTotTrib: i.valor_tributo_total,
      infAdProd: `Trib aprox R$${i.valor_tributo_total.toFixed(2)} (${i.aliquota_federal.toFixed(2)}% Fed, ${i.aliquota_estadual.toFixed(2)}% Est) Fonte: IBPT`,
    })),
  };
}

/**
 * Gera XML do campo vTotTrib para NF-e
 */
export function gerarXMLvTotTrib(vTotTrib: number): string {
  return `<vTotTrib>${vTotTrib.toFixed(2)}</vTotTrib>`;
}

/**
 * Gera texto resumido para cupom fiscal (NFC-e)
 */
export function gerarTextoNFCe(vTotTrib: number): string {
  return `Tributos Totais Incidentes (Lei Federal 12.741/12): R$ ${vTotTrib.toFixed(2)}`;
}

export type { ItemVenda, Venda, NFeProduto, NFeTotal, NFeInfAdic, NFeComIBPT };
