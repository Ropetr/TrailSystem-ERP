// =============================================
// PLANAC ERP - IBPT Integration
// Lei da Transparência Fiscal (Lei 12.741/2012)
// =============================================

// Types
export * from './ibpt-types';

// Service (cache em memória)
export {
  buscarPorNCM,
  calcularTributos,
  calcularTributosLote,
  importarTabelaCSV,
  exportarParaKV,
  carregarDoKV,
  gerarTextoLeiTransparencia,
  gerarTextoResumido,
  obterVTotTrib,
  obterMetadados,
  limparCache,
  obterEstatisticasCache,
} from './ibpt-service';

// D1 Service (persistência)
export {
  buscarPorNCM_D1,
  buscarPorNBS_D1,
  calcularTributos_D1,
  calcularTributosLote_D1,
  importarCSV_D1,
  obterMetadados_D1,
  contarRegistros_D1,
  limparRegistrosAntigos_D1,
} from './ibpt-d1-service';

// ===== FACTORY HELPER =====

import type { IBPTConfig, IBPTItemCalculo, IBPTCalculoTributos } from './ibpt-types';
import * as service from './ibpt-service';
import * as d1Service from './ibpt-d1-service';

/**
 * Cria instância do serviço IBPT
 */
export function createIBPTService(config: IBPTConfig & { db?: D1Database }) {
  const usaD1 = !!config.db;
  
  return {
    config,
    
    /**
     * Busca alíquota por NCM
     */
    buscarNCM: async (ncm: string, ex?: string) => {
      if (usaD1) {
        return d1Service.buscarPorNCM_D1(config.db!, ncm, config.uf, ex);
      }
      return service.buscarPorNCM(config, { ncm, uf: config.uf, ex });
    },
    
    /**
     * Busca alíquota por NBS (serviços)
     */
    buscarNBS: async (nbs: string) => {
      if (usaD1) {
        return d1Service.buscarPorNBS_D1(config.db!, nbs, config.uf);
      }
      throw new Error('Busca NBS requer D1');
    },
    
    /**
     * Calcula tributos de um item
     */
    calcular: async (ncm: string, valor: number, origem?: number, ex?: string): Promise<IBPTCalculoTributos> => {
      if (usaD1) {
        return d1Service.calcularTributos_D1(config.db!, ncm, config.uf, valor, origem || 0, ex);
      }
      return service.calcularTributos(config, ncm, valor, origem || 0, ex);
    },
    
    /**
     * Calcula tributos em lote
     */
    calcularLote: async (itens: IBPTItemCalculo[]) => {
      if (usaD1) {
        return d1Service.calcularTributosLote_D1(config.db!, config.uf, itens);
      }
      return service.calcularTributosLote(config, itens);
    },
    
    /**
     * Importa tabela CSV
     */
    importar: async (csv: string) => {
      if (usaD1) {
        return d1Service.importarCSV_D1(config.db!, csv, config.uf);
      }
      return service.importarTabelaCSV(csv, config.uf);
    },
    
    /**
     * Obtém metadados da tabela
     */
    metadados: async () => {
      if (usaD1) {
        return d1Service.obterMetadados_D1(config.db!, config.uf);
      }
      return service.obterMetadados();
    },
    
    /**
     * Contagem de registros
     */
    contagem: async () => {
      if (usaD1) {
        return d1Service.contarRegistros_D1(config.db!, config.uf);
      }
      return service.obterEstatisticasCache();
    },
    
    // Utilitários de formatação
    utils: {
      gerarTextoNFe: service.gerarTextoLeiTransparencia,
      gerarTextoCupom: service.gerarTextoResumido,
      obterVTotTrib: service.obterVTotTrib,
    },
  };
}

/**
 * Helper para integrar com NF-e
 * Calcula e retorna os valores formatados para os campos da nota
 */
export async function calcularTributosNFe(
  ibptService: ReturnType<typeof createIBPTService>,
  itens: Array<{
    ncm: string;
    valor: number;
    origem: number;
  }>
): Promise<{
  vTotTrib: number;
  itens: Array<{
    vTotTrib: number;
    infAdProd: string;
  }>;
  infCpl: string;
}> {
  const resultado = await ibptService.calcularLote(
    itens.map((item, index) => ({
      id: `item-${index}`,
      ncm: item.ncm,
      valor: item.valor,
      origem: item.origem,
    }))
  );
  
  const itensFormatados = resultado.itens.map(item => ({
    vTotTrib: item.total.valor,
    infAdProd: service.gerarTextoLeiTransparencia(item),
  }));
  
  return {
    vTotTrib: resultado.totais.tributos_total,
    itens: itensFormatados,
    infCpl: service.gerarTextoResumido(
      resultado.totais.tributos_total,
      resultado.totais.aliquota_media
    ),
  };
}
