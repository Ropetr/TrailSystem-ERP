// =============================================
// PLANAC ERP - Tributação Types
// Consulta de tributação por NCM
// =============================================

export interface TributacaoNCM {
  ncm: string;
  descricao_ncm?: string;
  
  ipi?: {
    aliquota: number;
    ex?: string;
    descricao?: string;
    vigencia_inicio: string;
    vigencia_fim?: string;
  };
  
  icms_st?: {
    uf_origem: string;
    uf_destino: string;
    mva_original: number;
    mva_ajustada?: number;
    mva_importado?: number;
    cest?: string;
    protocolo?: string;
    vigencia_inicio: string;
    vigencia_fim?: string;
  }[];
  
  fcp?: {
    uf: string;
    aliquota_fcp: number;
    aliquota_fcp_st?: number;
    aliquota_fcp_difal?: number;
    vigencia_inicio: string;
    vigencia_fim?: string;
  }[];
  
  cest?: {
    codigo: string;
    descricao: string;
    segmento?: string;
  };
  
  pis_cofins?: {
    regime: string;
    cst_pis: string;
    cst_cofins: string;
    aliquota_pis: number;
    aliquota_cofins: number;
  }[];
  
  beneficios?: {
    uf: string;
    codigo: string;
    nome: string;
    tipo: string;
    percentual_reducao?: number;
    aliquota_efetiva?: number;
    vigencia_inicio: string;
    vigencia_fim?: string;
  }[];
}

export interface ConsultaTributacaoParams {
  ncm: string;
  uf_origem?: string;
  uf_destino?: string;
  regime?: 'simples' | 'lucro_presumido' | 'lucro_real';
}

export interface ConsultaTributacaoResultado {
  ncm: string;
  tributacao: TributacaoNCM;
  tempo_resposta_ms: number;
  status: 'encontrado' | 'parcial' | 'nao_encontrado';
  mensagem?: string;
}

export interface TributacaoProduto {
  produto_id: string;
  ncm: string;
  cest?: string;
  tributacao: TributacaoNCM;
  sugestoes?: {
    cst_icms_sugerido?: string;
    csosn_sugerido?: string;
    cst_pis_sugerido?: string;
    cst_cofins_sugerido?: string;
    cst_ipi_sugerido?: string;
  };
}
