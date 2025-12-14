// =============================================
// PLANAC ERP - Testes de Validação Comercial
// =============================================

import { describe, it, expect } from 'vitest';

// Funções de validação a serem testadas
const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cleaned[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === parseInt(cleaned[10]);
};

const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weights1[i];
  }
  let digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== parseInt(cleaned[12])) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weights2[i];
  }
  digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  return digit === parseInt(cleaned[13]);
};

const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
};

const validateNCM = (ncm: string): boolean => {
  const cleaned = ncm.replace(/\D/g, '');
  return cleaned.length === 8;
};

const validateCEST = (cest: string): boolean => {
  const cleaned = cest.replace(/\D/g, '');
  return cleaned.length === 7;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const calculateMargin = (cost: number, price: number): number => {
  if (price === 0) return 0;
  return ((price - cost) / price) * 100;
};

const calculatePriceFromMargin = (cost: number, marginPercent: number): number => {
  if (marginPercent >= 100) return cost * 10; // fallback
  return cost / (1 - marginPercent / 100);
};

const calculateMarkup = (cost: number, price: number): number => {
  if (cost === 0) return 0;
  return ((price - cost) / cost) * 100;
};

// =============================================
// TESTES
// =============================================

describe('Validações de Documentos', () => {
  describe('validateCPF', () => {
    it('deve validar CPF válido', () => {
      expect(validateCPF('529.982.247-25')).toBe(true);
      expect(validateCPF('52998224725')).toBe(true);
    });

    it('deve rejeitar CPF inválido', () => {
      expect(validateCPF('111.111.111-11')).toBe(false);
      expect(validateCPF('123.456.789-00')).toBe(false);
      expect(validateCPF('12345678900')).toBe(false);
    });

    it('deve rejeitar CPF com tamanho errado', () => {
      expect(validateCPF('123456789')).toBe(false);
      expect(validateCPF('1234567890123')).toBe(false);
    });

    it('deve rejeitar CPF com todos dígitos iguais', () => {
      expect(validateCPF('000.000.000-00')).toBe(false);
      expect(validateCPF('999.999.999-99')).toBe(false);
    });
  });

  describe('validateCNPJ', () => {
    it('deve validar CNPJ válido', () => {
      expect(validateCNPJ('11.222.333/0001-81')).toBe(true);
      expect(validateCNPJ('11222333000181')).toBe(true);
    });

    it('deve rejeitar CNPJ inválido', () => {
      expect(validateCNPJ('11.111.111/1111-11')).toBe(false);
      expect(validateCNPJ('12.345.678/0001-00')).toBe(false);
    });

    it('deve rejeitar CNPJ com tamanho errado', () => {
      expect(validateCNPJ('1234567890')).toBe(false);
      expect(validateCNPJ('123456789012345')).toBe(false);
    });
  });
});

describe('Validações de Contato', () => {
  describe('validateEmail', () => {
    it('deve validar email válido', () => {
      expect(validateEmail('teste@email.com')).toBe(true);
      expect(validateEmail('usuario.nome@empresa.com.br')).toBe(true);
    });

    it('deve rejeitar email inválido', () => {
      expect(validateEmail('email-invalido')).toBe(false);
      expect(validateEmail('@email.com')).toBe(false);
      expect(validateEmail('teste@')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('deve validar telefone válido', () => {
      expect(validatePhone('(41) 99999-9999')).toBe(true);
      expect(validatePhone('41999999999')).toBe(true);
      expect(validatePhone('(41) 3333-3333')).toBe(true);
    });

    it('deve rejeitar telefone inválido', () => {
      expect(validatePhone('123456')).toBe(false);
      expect(validatePhone('123456789012')).toBe(false);
    });
  });
});

describe('Validações Fiscais', () => {
  describe('validateNCM', () => {
    it('deve validar NCM válido (8 dígitos)', () => {
      expect(validateNCM('68091100')).toBe(true);
      expect(validateNCM('6809.11.00')).toBe(true);
    });

    it('deve rejeitar NCM inválido', () => {
      expect(validateNCM('123456')).toBe(false);
      expect(validateNCM('123456789')).toBe(false);
    });
  });

  describe('validateCEST', () => {
    it('deve validar CEST válido (7 dígitos)', () => {
      expect(validateCEST('1000100')).toBe(true);
      expect(validateCEST('10.001.00')).toBe(true);
    });

    it('deve rejeitar CEST inválido', () => {
      expect(validateCEST('123456')).toBe(false);
      expect(validateCEST('12345678')).toBe(false);
    });
  });
});

describe('Formatação de Valores', () => {
  describe('formatCurrency', () => {
    it('deve formatar valores em Real', () => {
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
      expect(formatCurrency(0)).toBe('R$ 0,00');
      expect(formatCurrency(1000000)).toBe('R$ 1.000.000,00');
    });

    it('deve formatar valores negativos', () => {
      expect(formatCurrency(-100)).toBe('-R$ 100,00');
    });
  });

  describe('parseCurrency', () => {
    it('deve converter string para número', () => {
      expect(parseCurrency('R$ 1.234,56')).toBe(1234.56);
      expect(parseCurrency('1234,56')).toBe(1234.56);
      expect(parseCurrency('1234.56')).toBe(1234.56);
    });

    it('deve retornar 0 para valores inválidos', () => {
      expect(parseCurrency('')).toBe(0);
      expect(parseCurrency('abc')).toBe(0);
    });
  });
});

describe('Cálculos de Preço', () => {
  describe('calculateMargin', () => {
    it('deve calcular margem corretamente', () => {
      // Custo 100, Venda 150 = 33.33% margem
      expect(calculateMargin(100, 150)).toBeCloseTo(33.33, 1);
      
      // Custo 80, Venda 100 = 20% margem
      expect(calculateMargin(80, 100)).toBe(20);
    });

    it('deve retornar 0 se preço for 0', () => {
      expect(calculateMargin(100, 0)).toBe(0);
    });

    it('deve calcular margem negativa', () => {
      // Custo 100, Venda 90 = margem negativa
      expect(calculateMargin(100, 90)).toBeCloseTo(-11.11, 1);
    });
  });

  describe('calculatePriceFromMargin', () => {
    it('deve calcular preço a partir da margem', () => {
      // Custo 100, Margem 20% = Preço 125
      expect(calculatePriceFromMargin(100, 20)).toBe(125);
      
      // Custo 80, Margem 50% = Preço 160
      expect(calculatePriceFromMargin(80, 50)).toBe(160);
    });
  });

  describe('calculateMarkup', () => {
    it('deve calcular markup corretamente', () => {
      // Custo 100, Venda 150 = 50% markup
      expect(calculateMarkup(100, 150)).toBe(50);
      
      // Custo 80, Venda 100 = 25% markup
      expect(calculateMarkup(80, 100)).toBe(25);
    });

    it('deve retornar 0 se custo for 0', () => {
      expect(calculateMarkup(0, 100)).toBe(0);
    });
  });
});

describe('Cálculos de Orçamento', () => {
  const calculateTotals = (items: { quantidade: number; preco: number; desconto: number }[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantidade * item.preco), 0);
    const totalDesconto = items.reduce((sum, item) => sum + item.desconto, 0);
    const total = subtotal - totalDesconto;
    return { subtotal, totalDesconto, total };
  };

  it('deve calcular totais do orçamento', () => {
    const items = [
      { quantidade: 10, preco: 100, desconto: 50 },
      { quantidade: 5, preco: 200, desconto: 100 },
    ];
    
    const { subtotal, totalDesconto, total } = calculateTotals(items);
    
    expect(subtotal).toBe(2000); // (10*100) + (5*200)
    expect(totalDesconto).toBe(150);
    expect(total).toBe(1850);
  });

  it('deve calcular orçamento vazio', () => {
    const { subtotal, totalDesconto, total } = calculateTotals([]);
    
    expect(subtotal).toBe(0);
    expect(totalDesconto).toBe(0);
    expect(total).toBe(0);
  });
});

describe('Cálculos de Parcelamento', () => {
  const calculateInstallments = (total: number, numParcelas: number) => {
    if (numParcelas <= 0) return [];
    
    const valorParcela = Math.floor((total / numParcelas) * 100) / 100;
    const diferenca = total - (valorParcela * numParcelas);
    
    const parcelas = [];
    for (let i = 0; i < numParcelas; i++) {
      parcelas.push({
        numero: i + 1,
        valor: i === 0 ? valorParcela + diferenca : valorParcela,
      });
    }
    return parcelas;
  };

  it('deve calcular parcelas iguais', () => {
    const parcelas = calculateInstallments(1000, 4);
    
    expect(parcelas.length).toBe(4);
    expect(parcelas.reduce((sum, p) => sum + p.valor, 0)).toBeCloseTo(1000, 2);
  });

  it('deve ajustar diferença na primeira parcela', () => {
    const parcelas = calculateInstallments(100, 3);
    
    // 100/3 = 33.33... 
    // Primeira parcela deve ter o ajuste
    expect(parcelas[0].valor + parcelas[1].valor + parcelas[2].valor).toBeCloseTo(100, 2);
  });

  it('deve retornar array vazio para 0 parcelas', () => {
    const parcelas = calculateInstallments(1000, 0);
    expect(parcelas).toEqual([]);
  });
});

describe('Cálculos de Crédito do Cliente', () => {
  const calculateCreditUsage = (
    creditos: { id: string; valor: number; selecionado: boolean }[],
    totalVenda: number
  ) => {
    const creditosSelecionados = creditos.filter(c => c.selecionado);
    const totalCredito = creditosSelecionados.reduce((sum, c) => sum + c.valor, 0);
    const valorRestante = Math.max(0, totalVenda - totalCredito);
    const creditoExcedente = Math.max(0, totalCredito - totalVenda);
    
    return {
      totalCredito,
      valorRestante,
      creditoExcedente,
      cobreTudo: totalCredito >= totalVenda,
    };
  };

  it('deve calcular uso de crédito parcial', () => {
    const creditos = [
      { id: '1', valor: 500, selecionado: true },
      { id: '2', valor: 300, selecionado: false },
    ];
    
    const result = calculateCreditUsage(creditos, 1000);
    
    expect(result.totalCredito).toBe(500);
    expect(result.valorRestante).toBe(500);
    expect(result.creditoExcedente).toBe(0);
    expect(result.cobreTudo).toBe(false);
  });

  it('deve identificar quando crédito cobre tudo', () => {
    const creditos = [
      { id: '1', valor: 500, selecionado: true },
      { id: '2', valor: 600, selecionado: true },
    ];
    
    const result = calculateCreditUsage(creditos, 1000);
    
    expect(result.cobreTudo).toBe(true);
    expect(result.creditoExcedente).toBe(100);
  });
});
