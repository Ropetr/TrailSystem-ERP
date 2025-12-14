// =============================================
// PLANAC ERP - Testes de Validações Fiscais
// =============================================

import { describe, it, expect } from 'vitest';

const validacoesFiscais = {
  // Validar NCM (8 dígitos)
  validarNCM: (ncm: string) => {
    const numeros = ncm.replace(/\D/g, '');
    return numeros.length === 8;
  },
  
  // Formatar NCM
  formatarNCM: (ncm: string) => {
    const numeros = ncm.replace(/\D/g, '');
    return numeros.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3');
  },
  
  // Validar CFOP (4 dígitos)
  validarCFOP: (cfop: string) => {
    const numeros = cfop.replace(/\D/g, '');
    if (numeros.length !== 4) return false;
    
    const primeiro = parseInt(numeros[0]);
    // CFOP válidos começam de 1-7
    return primeiro >= 1 && primeiro <= 7;
  },
  
  // Obter tipo de operação pelo CFOP
  getTipoOperacaoCFOP: (cfop: string) => {
    const primeiro = cfop.charAt(0);
    if (['1', '2', '3'].includes(primeiro)) return 'entrada';
    if (['5', '6', '7'].includes(primeiro)) return 'saida';
    return null;
  },
  
  // Obter destino pelo CFOP
  getDestinoCFOP: (cfop: string) => {
    const primeiro = cfop.charAt(0);
    if (['1', '5'].includes(primeiro)) return 'estadual';
    if (['2', '6'].includes(primeiro)) return 'interestadual';
    if (['3', '7'].includes(primeiro)) return 'exterior';
    return null;
  },
  
  // Validar CST ICMS
  validarCSTICMS: (cst: string) => {
    const cstValidos = [
      '00', '10', '20', '30', '40', '41', '50', '51', 
      '60', '70', '90', '101', '102', '103', '201', 
      '202', '203', '300', '400', '500', '900'
    ];
    return cstValidos.includes(cst);
  },
  
  // Obter descrição do CST ICMS
  getDescricaoCSTICMS: (cst: string) => {
    const descricoes: Record<string, string> = {
      '00': 'Tributada integralmente',
      '10': 'Tributada com cobrança do ICMS por ST',
      '20': 'Com redução de base de cálculo',
      '30': 'Isenta ou não tributada com cobrança do ICMS por ST',
      '40': 'Isenta',
      '41': 'Não tributada',
      '50': 'Suspensão',
      '51': 'Diferimento',
      '60': 'ICMS cobrado anteriormente por ST',
      '70': 'Com redução de BC e cobrança do ICMS por ST',
      '90': 'Outras',
      // Simples Nacional
      '101': 'Tributada com permissão de crédito',
      '102': 'Tributada sem permissão de crédito',
      '103': 'Isenção do ICMS para faixa de receita bruta',
      '201': 'Tributada com permissão de crédito e com cobrança do ICMS por ST',
      '202': 'Tributada sem permissão de crédito e com cobrança do ICMS por ST',
      '203': 'Isenção do ICMS para faixa de receita bruta e com cobrança do ICMS por ST',
      '300': 'Imune',
      '400': 'Não tributada pelo Simples Nacional',
      '500': 'ICMS cobrado anteriormente por ST ou por antecipação',
      '900': 'Outros',
    };
    return descricoes[cst] || 'Desconhecido';
  },
  
  // Validar alíquota de ICMS
  validarAliquotaICMS: (aliquota: number, uf: string) => {
    // Alíquotas internas padrão por UF
    const aliquotasInternas: Record<string, number> = {
      'SP': 18, 'RJ': 20, 'MG': 18, 'PR': 19.5, 'SC': 17,
      'RS': 17, 'BA': 20.5, 'PE': 18, 'CE': 18, 'GO': 17,
    };
    
    // Alíquotas válidas
    const aliquotasValidas = [0, 4, 7, 12, 17, 17.5, 18, 19, 19.5, 20, 20.5, 25];
    return aliquotasValidas.includes(aliquota);
  },
  
  // Calcular ICMS ST (Substituição Tributária)
  calcularICMSST: (
    valorProduto: number,
    aliquotaInterna: number,
    mva: number, // Margem de Valor Agregado
    icmsProprio: number
  ) => {
    const baseCalculoST = valorProduto * (1 + mva / 100);
    const icmsST = (baseCalculoST * (aliquotaInterna / 100)) - icmsProprio;
    return Math.max(0, icmsST);
  },
  
  // Validar Inscrição Estadual
  validarInscricaoEstadual: (ie: string, uf: string) => {
    const numeros = ie.replace(/\D/g, '');
    
    // Cada estado tem um formato diferente
    const tamanhos: Record<string, number[]> = {
      'SP': [12],
      'RJ': [8],
      'MG': [13],
      'PR': [10],
      'SC': [9],
      'RS': [10],
    };
    
    const tamanhosUF = tamanhos[uf] || [8, 9, 10, 11, 12, 13, 14];
    return tamanhosUF.includes(numeros.length);
  },
  
  // Validar CNAE
  validarCNAE: (cnae: string) => {
    const numeros = cnae.replace(/\D/g, '');
    // CNAE tem 7 dígitos
    return numeros.length === 7;
  },
  
  // Formatar CNAE
  formatarCNAE: (cnae: string) => {
    const numeros = cnae.replace(/\D/g, '');
    return numeros.replace(/(\d{4})(\d{1})(\d{2})/, '$1-$2/$3');
  },
  
  // Calcular diferencial de alíquota (DIFAL)
  calcularDIFAL: (
    valorProduto: number,
    aliquotaOrigem: number,
    aliquotaDestino: number
  ) => {
    const diferencaAliquota = aliquotaDestino - aliquotaOrigem;
    if (diferencaAliquota <= 0) return 0;
    
    return valorProduto * (diferencaAliquota / 100);
  },
  
  // Validar código de benefício fiscal
  validarCodigoBeneficio: (codigo: string) => {
    // Formato: XX123456 (2 letras UF + 6 dígitos)
    const regex = /^[A-Z]{2}\d{6}$/;
    return regex.test(codigo);
  },
};

describe('Validações Fiscais', () => {
  describe('validarNCM()', () => {
    it('deve validar NCM com 8 dígitos', () => {
      expect(validacoesFiscais.validarNCM('68091100')).toBe(true);
      expect(validacoesFiscais.validarNCM('6809.11.00')).toBe(true);
    });

    it('deve rejeitar NCM inválido', () => {
      expect(validacoesFiscais.validarNCM('123456')).toBe(false);
      expect(validacoesFiscais.validarNCM('')).toBe(false);
    });
  });

  describe('formatarNCM()', () => {
    it('deve formatar NCM corretamente', () => {
      expect(validacoesFiscais.formatarNCM('68091100')).toBe('6809.11.00');
    });
  });

  describe('validarCFOP()', () => {
    it('deve validar CFOP correto', () => {
      expect(validacoesFiscais.validarCFOP('5102')).toBe(true);
      expect(validacoesFiscais.validarCFOP('6102')).toBe(true);
      expect(validacoesFiscais.validarCFOP('1102')).toBe(true);
    });

    it('deve rejeitar CFOP inválido', () => {
      expect(validacoesFiscais.validarCFOP('0102')).toBe(false);
      expect(validacoesFiscais.validarCFOP('8102')).toBe(false);
      expect(validacoesFiscais.validarCFOP('51')).toBe(false);
    });
  });

  describe('getTipoOperacaoCFOP()', () => {
    it('deve identificar entrada', () => {
      expect(validacoesFiscais.getTipoOperacaoCFOP('1102')).toBe('entrada');
      expect(validacoesFiscais.getTipoOperacaoCFOP('2102')).toBe('entrada');
      expect(validacoesFiscais.getTipoOperacaoCFOP('3102')).toBe('entrada');
    });

    it('deve identificar saída', () => {
      expect(validacoesFiscais.getTipoOperacaoCFOP('5102')).toBe('saida');
      expect(validacoesFiscais.getTipoOperacaoCFOP('6102')).toBe('saida');
      expect(validacoesFiscais.getTipoOperacaoCFOP('7102')).toBe('saida');
    });
  });

  describe('getDestinoCFOP()', () => {
    it('deve identificar operação estadual', () => {
      expect(validacoesFiscais.getDestinoCFOP('5102')).toBe('estadual');
      expect(validacoesFiscais.getDestinoCFOP('1102')).toBe('estadual');
    });

    it('deve identificar operação interestadual', () => {
      expect(validacoesFiscais.getDestinoCFOP('6102')).toBe('interestadual');
      expect(validacoesFiscais.getDestinoCFOP('2102')).toBe('interestadual');
    });

    it('deve identificar operação exterior', () => {
      expect(validacoesFiscais.getDestinoCFOP('7102')).toBe('exterior');
      expect(validacoesFiscais.getDestinoCFOP('3102')).toBe('exterior');
    });
  });

  describe('validarCSTICMS()', () => {
    it('deve validar CST do regime normal', () => {
      expect(validacoesFiscais.validarCSTICMS('00')).toBe(true);
      expect(validacoesFiscais.validarCSTICMS('10')).toBe(true);
      expect(validacoesFiscais.validarCSTICMS('60')).toBe(true);
    });

    it('deve validar CSOSN do Simples Nacional', () => {
      expect(validacoesFiscais.validarCSTICMS('101')).toBe(true);
      expect(validacoesFiscais.validarCSTICMS('102')).toBe(true);
      expect(validacoesFiscais.validarCSTICMS('500')).toBe(true);
    });

    it('deve rejeitar CST inválido', () => {
      expect(validacoesFiscais.validarCSTICMS('99')).toBe(false);
      expect(validacoesFiscais.validarCSTICMS('999')).toBe(false);
    });
  });

  describe('getDescricaoCSTICMS()', () => {
    it('deve retornar descrições corretas', () => {
      expect(validacoesFiscais.getDescricaoCSTICMS('00')).toBe('Tributada integralmente');
      expect(validacoesFiscais.getDescricaoCSTICMS('40')).toBe('Isenta');
      expect(validacoesFiscais.getDescricaoCSTICMS('60')).toBe('ICMS cobrado anteriormente por ST');
    });
  });

  describe('validarAliquotaICMS()', () => {
    it('deve validar alíquotas comuns', () => {
      expect(validacoesFiscais.validarAliquotaICMS(18, 'SP')).toBe(true);
      expect(validacoesFiscais.validarAliquotaICMS(12, 'SP')).toBe(true);
      expect(validacoesFiscais.validarAliquotaICMS(7, 'SP')).toBe(true);
      expect(validacoesFiscais.validarAliquotaICMS(4, 'SP')).toBe(true);
    });
  });

  describe('calcularICMSST()', () => {
    it('deve calcular ICMS ST corretamente', () => {
      // Produto de R$ 100, alíquota 18%, MVA 50%, ICMS próprio R$ 18
      const icmsST = validacoesFiscais.calcularICMSST(100, 18, 50, 18);
      // Base ST = 100 * 1.5 = 150
      // ICMS ST = 150 * 0.18 - 18 = 27 - 18 = 9
      expect(icmsST).toBe(9);
    });

    it('deve retornar 0 se ICMS próprio for maior', () => {
      const icmsST = validacoesFiscais.calcularICMSST(100, 10, 10, 20);
      expect(icmsST).toBe(0);
    });
  });

  describe('validarInscricaoEstadual()', () => {
    it('deve validar IE de SP (12 dígitos)', () => {
      expect(validacoesFiscais.validarInscricaoEstadual('123456789012', 'SP')).toBe(true);
    });

    it('deve rejeitar IE com tamanho incorreto', () => {
      expect(validacoesFiscais.validarInscricaoEstadual('12345', 'SP')).toBe(false);
    });
  });

  describe('validarCNAE()', () => {
    it('deve validar CNAE com 7 dígitos', () => {
      expect(validacoesFiscais.validarCNAE('4679601')).toBe(true);
      expect(validacoesFiscais.validarCNAE('4679-6/01')).toBe(true);
    });

    it('deve rejeitar CNAE inválido', () => {
      expect(validacoesFiscais.validarCNAE('12345')).toBe(false);
    });
  });

  describe('formatarCNAE()', () => {
    it('deve formatar CNAE corretamente', () => {
      expect(validacoesFiscais.formatarCNAE('4679601')).toBe('4679-6/01');
    });
  });

  describe('calcularDIFAL()', () => {
    it('deve calcular DIFAL quando há diferença de alíquota', () => {
      // Produto R$ 1000, origem 12%, destino 18%
      expect(validacoesFiscais.calcularDIFAL(1000, 12, 18)).toBe(60);
    });

    it('deve retornar 0 se alíquota destino for menor ou igual', () => {
      expect(validacoesFiscais.calcularDIFAL(1000, 18, 12)).toBe(0);
      expect(validacoesFiscais.calcularDIFAL(1000, 18, 18)).toBe(0);
    });
  });

  describe('validarCodigoBeneficio()', () => {
    it('deve validar código no formato correto', () => {
      expect(validacoesFiscais.validarCodigoBeneficio('SP123456')).toBe(true);
      expect(validacoesFiscais.validarCodigoBeneficio('PR654321')).toBe(true);
    });

    it('deve rejeitar formato inválido', () => {
      expect(validacoesFiscais.validarCodigoBeneficio('12345678')).toBe(false);
      expect(validacoesFiscais.validarCodigoBeneficio('SPX12345')).toBe(false);
    });
  });
});
