// =============================================
// PLANAC ERP - CNPjá Types
// Integração com API CNPjá para consulta de CNPJ
// =============================================

export interface CNPjaSimplesSimplesInfo {
  optant: boolean;
  since: string | null;
  history?: Array<{
    from: string;
    until: string;
    text: string;
  }>;
}

export interface CNPjaOfficeResponse {
  updated: string;
  taxId: string;
  company: {
    id: number;
    name: string;
    equity: number;
    nature: {
      id: number;
      text: string;
    };
    size: {
      id: number;
      acronym: string;
      text: string;
    };
    members?: Array<{
      since: string;
      role: {
        id: number;
        text: string;
      };
      person: {
        id: string;
        name: string;
        type: string;
        taxId: string;
        age?: string;
      };
    }>;
    simples?: CNPjaSimplesSimplesInfo;
    simei?: CNPjaSimplesSimplesInfo;
  };
  alias?: string;
  founded: string;
  head: boolean;
  statusDate: string;
  status: {
    id: number;
    text: string;
  };
  address: {
    municipality: number;
    street: string;
    number: string;
    details?: string | null;
    district: string;
    city: string;
    state: string;
    zip: string;
    country: {
      id: number;
      name: string;
    };
    latitude?: number;
    longitude?: number;
  };
  phones?: Array<{
    type: string;
    area: string;
    number: string;
  }>;
  emails?: Array<{
    ownership: string;
    address: string;
    domain: string;
  }>;
  mainActivity: {
    id: number;
    text: string;
  };
  sideActivities?: Array<{
    id: number;
    text: string;
  }>;
  registrations?: Array<{
    number: string;
    state: string;
    enabled: boolean;
    statusDate: string;
    status: {
      id: number;
      text: string;
    };
    type: {
      id: number;
      text: string;
    };
  }>;
  suframa?: Array<{
    number: string;
    status: {
      id: number;
      text: string;
    };
    incentives?: Array<{
      id: number;
      text: string;
    }>;
  }>;
}

export interface CNPjaSimplesResponse {
  updated: string;
  taxId: string;
  simples: {
    optant: boolean;
    since?: string;
    until?: string;
  };
  simei: {
    optant: boolean;
    since?: string;
    until?: string;
  };
}

export interface CNPjaSuframaResponse {
  updated: string;
  taxId: string;
  registration: string;
  status: {
    id: number;
    text: string;
  };
  incentives?: Array<{
    id: number;
    text: string;
  }>;
}

export interface CNPjaZipResponse {
  zip: string;
  street: string;
  district: string;
  city: string;
  cityIbge: number;
  state: string;
  stateIbge: number;
}

export interface CNPjaConsultaParams {
  strategy?: 'ONLINE' | 'CACHE_IF_FRESH' | 'CACHE_IF_ERROR' | 'CACHE';
  maxAge?: number;
  maxStale?: number;
}

export interface CNPjaClienteSugerido {
  tipo: 'PJ';
  razao_social: string;
  nome_fantasia?: string;
  cpf_cnpj: string;
  inscricao_estadual?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  
  indicador_ie: number;
  consumidor_final: number;
  regime_tributario?: string;
  simples_optante?: number;
  simples_desde?: string;
  
  cnae_principal?: string;
  cnae_principal_descricao?: string;
  natureza_juridica?: string;
  porte?: string;
  situacao_cadastral?: string;
  data_situacao?: string;
  capital_social?: number;
  
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    codigo_ibge: string;
  };
  
  socios?: Array<{
    nome: string;
    cargo: string;
    desde: string;
  }>;
}

export interface CNPjaConsultaResultado {
  cnpj: string;
  office?: CNPjaOfficeResponse;
  simples?: CNPjaSimplesResponse;
  cliente_sugerido?: CNPjaClienteSugerido;
  tempo_resposta_ms: number;
  fonte: string;
  cached: boolean;
}

export interface CNPjaCacheRecord {
  id: string;
  empresa_id: string;
  tax_id: string;
  tipo: 'office' | 'simples' | 'suframa' | 'zip';
  payload: string;
  source_updated: string;
  fetched_at: string;
  created_at: string;
}
