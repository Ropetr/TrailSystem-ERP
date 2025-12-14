// =============================================
// PLANAC ERP - Nuvem Fiscal Services Index
// =============================================
// Integração completa com Nuvem Fiscal
// Documentação: https://dev.nuvemfiscal.com.br/docs

export * from './nuvem-fiscal-auth.service';
export * from './nuvem-fiscal-empresas.service';
export * from './nuvem-fiscal-nfe.service';
export * from './nuvem-fiscal-nfce.service';

// Re-export defaults
export { default as authService } from './nuvem-fiscal-auth.service';
export { default as empresasService } from './nuvem-fiscal-empresas.service';
export { default as nfeService } from './nuvem-fiscal-nfe.service';
export { default as nfceService } from './nuvem-fiscal-nfce.service';

/**
 * Configuração padrão DEV.com (Software House)
 */
export const NUVEM_FISCAL_CONFIG = {
  clientId: 'AJReDlHes8aBNlTzTF9X',
  // Client Secret deve ser mantido em variável de ambiente
  ambiente: 'sandbox' as const,
  
  // URLs da API
  urls: {
    auth: 'https://auth.nuvemfiscal.com.br/oauth/token',
    sandbox: 'https://api.sandbox.nuvemfiscal.com.br',
    producao: 'https://api.nuvemfiscal.com.br',
  },
  
  // Scopes disponíveis
  scopes: ['empresa', 'cep', 'cnpj', 'nfe', 'nfce', 'mdfe', 'cte', 'nfse'],
  
  // Documentos fiscais suportados
  documentos: {
    'NF-e': { modelo: 55, descricao: 'Nota Fiscal Eletrônica' },
    'NFC-e': { modelo: 65, descricao: 'Nota Fiscal de Consumidor Eletrônica' },
    'CT-e': { modelo: 57, descricao: 'Conhecimento de Transporte Eletrônico' },
    'MDF-e': { modelo: 58, descricao: 'Manifesto Eletrônico de Documentos Fiscais' },
    'NFS-e': { modelo: 0, descricao: 'Nota Fiscal de Serviços Eletrônica' },
  },
};

/**
 * Helper para verificar se ambiente está configurado corretamente
 */
export async function verificarConfiguracao(): Promise<{
  autenticacao: boolean;
  empresaCadastrada: boolean;
  certificadoValido: boolean;
  prontoParaEmissao: boolean;
  detalhes: Record<string, string>;
}> {
  const { verificarConexao } = await import('./nuvem-fiscal-auth.service');
  const { listarEmpresas, verificarCertificado } = await import('./nuvem-fiscal-empresas.service');
  
  const resultado = {
    autenticacao: false,
    empresaCadastrada: false,
    certificadoValido: false,
    prontoParaEmissao: false,
    detalhes: {} as Record<string, string>,
  };
  
  // 1. Verifica autenticação
  try {
    const auth = await verificarConexao();
    resultado.autenticacao = auth.conectado;
    resultado.detalhes.autenticacao = auth.mensagem;
  } catch (error) {
    resultado.detalhes.autenticacao = `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`;
  }
  
  // 2. Verifica empresas cadastradas
  if (resultado.autenticacao) {
    try {
      const empresas = await listarEmpresas('sandbox');
      resultado.empresaCadastrada = empresas.length > 0;
      resultado.detalhes.empresas = `${empresas.length} empresa(s) cadastrada(s)`;
      
      // 3. Verifica certificado da primeira empresa
      if (empresas.length > 0) {
        const certStatus = await verificarCertificado(empresas[0].cpf_cnpj, 'sandbox');
        resultado.certificadoValido = certStatus.valido;
        resultado.detalhes.certificado = certStatus.mensagem;
      }
    } catch (error) {
      resultado.detalhes.empresas = `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`;
    }
  }
  
  // 4. Determina se está pronto para emissão
  resultado.prontoParaEmissao = 
    resultado.autenticacao && 
    resultado.empresaCadastrada && 
    resultado.certificadoValido;
  
  return resultado;
}
