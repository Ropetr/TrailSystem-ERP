// =============================================
// PLANAC ERP - Testes de Validações Comerciais
// =============================================

import { describe, it, expect } from 'vitest';

// Funções de validação comercial
const validacoes = {
  validarCPF: (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false; // Todos dígitos iguais
    
    // Cálculo dos dígitos verificadores
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleaned.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleaned.charAt(10))) return false;
    
    return true;
  },
  
  validarCNPJ: (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    
    if (cleaned.length !== 14) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false;
    
    // Cálculo do primeiro dígito
    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < 12; i++) {
      soma += parseInt(cleaned.charAt(i)) * pesos1[i];
    }
    let resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;
    if (digito1 !== parseInt(cleaned.charAt(12))) return false;
    
    // Cálculo do segundo dígito
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    soma = 0;
    for (let i = 0; i < 13; i++) {
      soma += parseInt(cleaned.charAt(i)) * pesos2[i];
    }
    resto = soma % 11;
    const digito2 = resto < 2 ? 0 : 11 - resto;
    if (digito2 !== parseInt(cleaned.charAt(13))) return false;
    
    return true;
  },
  
  validarEmail: (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  
  validarTelefone: (telefone: string) => {
    const cleaned = telefone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  },
  
  validarCEP: (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    return cleaned.length === 8;
  },
  
  formatarCPF: (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },
  
  formatarCNPJ: (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  },
  
  formatarTelefone: (telefone: string) => {
    const cleaned = telefone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  },
  
  formatarCEP: (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  },
  
  formatarMoeda: (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  },
  
  validarNCM: (ncm: string) => {
    const cleaned = ncm.replace(/\D/g, '');
    return cleaned.length === 8;
  },
  
  validarGTIN: (gtin: string) => {
    const cleaned = gtin.replace(/\D/g, '');
    return [8, 12, 13, 14].includes(cleaned.length);
  },
};

describe('Validações Comerciais', () => {
  
  describe('validarCPF()', () => {
    it('deve validar CPF correto', () => {
      expect(validacoes.validarCPF('529.982.247-25')).toBe(true);
      expect(validacoes.validarCPF('52998224725')).toBe(true);
    });

    it('deve rejeitar CPF inválido', () => {
      expect(validacoes.validarCPF('111.111.111-11')).toBe(false);
      expect(validacoes.validarCPF('123.456.789-00')).toBe(false);
    });

    it('deve rejeitar CPF com tamanho incorreto', () => {
      expect(validacoes.validarCPF('123456')).toBe(false);
      expect(validacoes.validarCPF('123456789012')).toBe(false);
    });
  });

  describe('validarCNPJ()', () => {
    it('deve validar CNPJ correto', () => {
      expect(validacoes.validarCNPJ('11.222.333/0001-81')).toBe(true);
      expect(validacoes.validarCNPJ('11222333000181')).toBe(true);
    });

    it('deve rejeitar CNPJ inválido', () => {
      expect(validacoes.validarCNPJ('11.111.111/1111-11')).toBe(false);
      expect(validacoes.validarCNPJ('12.345.678/0001-99')).toBe(false);
    });

    it('deve rejeitar CNPJ com tamanho incorreto', () => {
      expect(validacoes.validarCNPJ('123456')).toBe(false);
    });
  });

  describe('validarEmail()', () => {
    it('deve validar email correto', () => {
      expect(validacoes.validarEmail('teste@email.com')).toBe(true);
      expect(validacoes.validarEmail('nome.sobrenome@empresa.com.br')).toBe(true);
    });

    it('deve rejeitar email inválido', () => {
      expect(validacoes.validarEmail('email-invalido')).toBe(false);
      expect(validacoes.validarEmail('email@')).toBe(false);
      expect(validacoes.validarEmail('@email.com')).toBe(false);
    });
  });

  describe('validarTelefone()', () => {
    it('deve validar telefone com DDD', () => {
      expect(validacoes.validarTelefone('(41) 99999-9999')).toBe(true);
      expect(validacoes.validarTelefone('(41) 3333-3333')).toBe(true);
      expect(validacoes.validarTelefone('41999999999')).toBe(true);
    });

    it('deve rejeitar telefone inválido', () => {
      expect(validacoes.validarTelefone('999999')).toBe(false);
    });
  });

  describe('validarCEP()', () => {
    it('deve validar CEP correto', () => {
      expect(validacoes.validarCEP('80000-000')).toBe(true);
      expect(validacoes.validarCEP('80000000')).toBe(true);
    });

    it('deve rejeitar CEP inválido', () => {
      expect(validacoes.validarCEP('8000')).toBe(false);
      expect(validacoes.validarCEP('800000000')).toBe(false);
    });
  });

  describe('formatarCPF()', () => {
    it('deve formatar CPF corretamente', () => {
      expect(validacoes.formatarCPF('52998224725')).toBe('529.982.247-25');
    });
  });

  describe('formatarCNPJ()', () => {
    it('deve formatar CNPJ corretamente', () => {
      expect(validacoes.formatarCNPJ('11222333000181')).toBe('11.222.333/0001-81');
    });
  });

  describe('formatarTelefone()', () => {
    it('deve formatar celular', () => {
      expect(validacoes.formatarTelefone('41999999999')).toBe('(41) 99999-9999');
    });

    it('deve formatar fixo', () => {
      expect(validacoes.formatarTelefone('4133333333')).toBe('(41) 3333-3333');
    });
  });

  describe('formatarCEP()', () => {
    it('deve formatar CEP', () => {
      expect(validacoes.formatarCEP('80000000')).toBe('80000-000');
    });
  });

  describe('formatarMoeda()', () => {
    it('deve formatar valor em reais', () => {
      expect(validacoes.formatarMoeda(1500.50)).toBe('R$ 1.500,50');
      expect(validacoes.formatarMoeda(0)).toBe('R$ 0,00');
    });
  });

  describe('validarNCM()', () => {
    it('deve validar NCM correto', () => {
      expect(validacoes.validarNCM('68091100')).toBe(true);
      expect(validacoes.validarNCM('6809.11.00')).toBe(true);
    });

    it('deve rejeitar NCM inválido', () => {
      expect(validacoes.validarNCM('123456')).toBe(false);
    });
  });

  describe('validarGTIN()', () => {
    it('deve validar códigos de barras', () => {
      expect(validacoes.validarGTIN('7891234567890')).toBe(true); // EAN-13
      expect(validacoes.validarGTIN('789123456789')).toBe(true);  // EAN-12
      expect(validacoes.validarGTIN('78912345')).toBe(true);      // EAN-8
    });

    it('deve rejeitar código inválido', () => {
      expect(validacoes.validarGTIN('123')).toBe(false);
    });
  });
});
