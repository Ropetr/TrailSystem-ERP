// =============================================
// PLANAC ERP - CPF.CNPJ Types
// Integração com API CPF.CNPJ para consulta de CPF
// API: https://api.cpfcnpj.com.br
// =============================================

// Pacotes disponíveis na API CPF.CNPJ
export const CPFCNPJ_PACOTES = {
  // CPF
  CPF_A: 1,           // Nome Completo (R$ 0,15)
  CPF_B: 7,           // Nome + Nascimento (R$ 0,22)
  CPF_C: 2,           // Nome + Nascimento + Mãe + Gênero (R$ 0,25)
  CPF_D: 8,           // Nome + Nascimento + Situação + Óbito + PDF (R$ 0,36)
  CPF_E: 9,           // Nome + Mãe + Nascimento + Gênero + Situação + Óbito + PDF (R$ 0,47)
  CPF_F: 3,           // Nome + Nascimento + Gênero + Endereço (R$ 1,20)
  CPF_K: 18,          // Nome + Nascimento + Endereço + Situação (R$ 1,40)
  CPF_LOOKALIKE: 21,  // Nome + Emails + Telefones + WhatsApp (R$ 0,24) - RECOMENDADO
  // CNPJ
  CNPJ_A: 4,          // Razão Social (R$ 0,13)
  CNPJ_B: 5,          // Razão + Fantasia + Endereço (R$ 0,24)
  CNPJ_C: 10,         // Razão + Fantasia + Endereço + Telefones + Email + Situação (R$ 0,32)
  CNPJ_D: 6,          // Completo com QSA e Simples (R$ 0,45)
} as const;

export type CpfCnpjPacote = typeof CPFCNPJ_PACOTES[keyof typeof CPFCNPJ_PACOTES];

export interface CpfCnpjConfig {
  token: string;
  pacote_cpf_padrao: CpfCnpjPacote;
  pacote_cpf_contatos: CpfCnpjPacote;
  pacote_cnpj_padrao: CpfCnpjPacote;
  cache_ttl_dias: number;
  buscar_contatos: boolean;
}

export interface CpfCnpjCpfResponse {
  status: number;
  cpf?: string;
  nome?: string;
  nomeSocial?: string;
  nascimento?: string;
  mae?: string;
  genero?: 'M' | 'F' | 'O';
  situacao?: string;
  situacaoDigito?: string;
  situacaoMotivo?: string;
  situacaoAnoObito?: string;
  situacaoInscricao?: string;
  situacaoComprovante?: string;
  situacaoComprovanteEmissao?: string;
  situacaoComprovantePdf?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  uf?: string;
  enderecos?: Array<{
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cep?: string;
    cidade?: string;
    uf?: string;
  }>;
  telefones?: Array<{
    ddd?: string;
    numero?: string;
  }>;
  whatsapp?: Array<{
    ddd?: string;
    numero?: string;
  }>;
  emails?: string[];
  empresas?: Array<{
    cnpj?: string;
    razao?: string;
  }>;
  pacoteUsado?: number;
  saldo?: number;
  consultaID?: string;
  delay?: number;
  erro?: string;
  erroCodigo?: number;
}

export interface CpfCnpjCnpjResponse {
  status: number;
  cnpj?: string;
  razao?: string;
  fantasia?: string;
  inicioAtividade?: string;
  email?: string;
  responsavel?: string;
  responsavelCpf?: string;
  simplesNacional?: {
    optante?: string;
    inicio?: string;
    fim?: string;
  };
  simei?: {
    optante?: string;
    anteriores?: Array<{
      inicio?: string;
      fim?: string;
      detalhamento?: string;
    }>;
  };
  matrizEndereco?: {
    cep?: string;
    tipo?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
  };
  matrizfilial?: {
    id?: number;
    tipo?: string;
  };
  telefones?: Array<{
    ddd?: string;
    numero?: string;
  }>;
  fax?: {
    ddd?: string;
    numero?: string;
  };
  situacao?: {
    id?: number;
    nome?: string;
    data?: string;
  };
  naturezaJuridica?: {
    codigo?: string;
    descricao?: string;
  };
  cnae?: {
    divisao?: string;
    grupo?: string;
    classe?: string;
    subClasse?: string;
    fiscal?: string;
    descricao?: string;
  };
  porte?: {
    id?: string;
    descricao?: string;
  };
  socios?: Array<{
    cpf_cnpj_socio?: string;
    nome?: string;
    tipo?: string;
    data_entrada?: string;
    cpf_representante_legal?: string;
    nome_representante?: string;
    faixa_etaria?: string;
    atualizado_em?: string;
    pais_id?: string;
    qualificacao_socio?: {
      id?: number;
      descricao?: string;
    };
    qualificacao_representante?: {
      id?: number;
      descricao?: string;
    };
    pais?: {
      id?: number;
      iso2?: string;
      iso3?: string;
      nome?: string;
      comex_id?: string;
    };
  }>;
  pacoteUsado?: number;
  saldo?: number;
  consultaID?: string;
  delay?: number;
  erro?: string;
  erroCodigo?: number;
}

export interface CpfCnpjClienteSugeridoPF {
  tipo: 'PF';
  razao_social: string;
  nome_fantasia?: string;
  cpf_cnpj: string;
  data_nascimento?: string;
  genero?: string;
  nome_mae?: string;
  situacao_cadastral?: string;
  
  email?: string;
  telefone?: string;
  celular?: string;
  whatsapp?: string;
  
  indicador_ie: number;
  consumidor_final: number;
  
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  
  emails_adicionais?: string[];
  telefones_adicionais?: string[];
}

export interface CpfCnpjConsultaResultado {
  cpf: string;
  dados_basicos?: CpfCnpjCpfResponse;
  dados_contatos?: CpfCnpjCpfResponse;
  cliente_sugerido?: CpfCnpjClienteSugeridoPF;
  tempo_resposta_ms: number;
  fonte: string;
  cached: boolean;
  pacotes_usados: number[];
  custo_estimado: number;
}

export interface CpfCnpjCacheRecord {
  id: string;
  empresa_id: string;
  documento: string;
  tipo: 'cpf' | 'cnpj';
  pacote: number;
  payload: string;
  fetched_at: string;
  created_at: string;
}

export interface CpfCnpjSaldoResponse {
  status: number;
  pacote?: {
    id: number;
    nome: string;
    saldo: number;
  };
  erro?: string;
  erroCodigo?: number;
}
