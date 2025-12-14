// =============================================
// PLANAC ERP - Testes de Ponto e Folha
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface RegistroPonto {
  entrada1?: string;
  saida1?: string;
  entrada2?: string;
  saida2?: string;
  status: string;
}

const pontoService = {
  calcularHorasTrabalhadas: (registro: RegistroPonto) => {
    if (!registro.entrada1 || !registro.saida2) return 0;
    
    const parseTime = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m; // em minutos
    };
    
    let totalMinutos = 0;
    
    // Primeiro período
    if (registro.entrada1 && registro.saida1) {
      totalMinutos += parseTime(registro.saida1) - parseTime(registro.entrada1);
    }
    
    // Segundo período
    if (registro.entrada2 && registro.saida2) {
      totalMinutos += parseTime(registro.saida2) - parseTime(registro.entrada2);
    }
    
    return totalMinutos / 60; // em horas
  },
  
  calcularHorasExtras: (horasTrabalhadas: number, jornadaDiaria: number = 8) => {
    return Math.max(0, horasTrabalhadas - jornadaDiaria);
  },
  
  calcularHorasFaltantes: (horasTrabalhadas: number, jornadaDiaria: number = 8) => {
    return Math.max(0, jornadaDiaria - horasTrabalhadas);
  },
  
  verificarAtraso: (horaEntrada: string, horaPrevista: string = '08:00') => {
    const parseTime = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    
    const entrada = parseTime(horaEntrada);
    const prevista = parseTime(horaPrevista);
    
    return entrada > prevista ? entrada - prevista : 0; // em minutos
  },
  
  formatarHoras: (horas: number) => {
    const h = Math.floor(horas);
    const m = Math.round((horas - h) * 60);
    if (h === 0) return `${m}min`;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  },
  
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      normal: 'Normal',
      falta: 'Falta',
      atraso: 'Atraso',
      hora_extra: 'Hora Extra',
      abono: 'Abono',
      ferias: 'Férias',
      atestado: 'Atestado',
    };
    return labels[status] || status;
  },
};

const folhaService = {
  calcularINSS: (salario: number) => {
    // Tabela INSS 2024 (simplificada)
    const faixas = [
      { limite: 1412.00, aliquota: 0.075 },
      { limite: 2666.68, aliquota: 0.09 },
      { limite: 4000.03, aliquota: 0.12 },
      { limite: 7786.02, aliquota: 0.14 },
    ];
    
    let inss = 0;
    let salarioRestante = salario;
    let faixaAnterior = 0;
    
    for (const faixa of faixas) {
      if (salarioRestante <= 0) break;
      
      const base = Math.min(salarioRestante, faixa.limite - faixaAnterior);
      inss += base * faixa.aliquota;
      salarioRestante -= base;
      faixaAnterior = faixa.limite;
    }
    
    return Math.round(inss * 100) / 100;
  },
  
  calcularIRRF: (salarioBase: number, inss: number, dependentes: number = 0) => {
    // Tabela IRRF 2024 (simplificada)
    const deducaoPorDependente = 189.59;
    const baseCalculo = salarioBase - inss - (dependentes * deducaoPorDependente);
    
    if (baseCalculo <= 2259.20) return 0;
    if (baseCalculo <= 2826.65) return Math.round((baseCalculo * 0.075 - 169.44) * 100) / 100;
    if (baseCalculo <= 3751.05) return Math.round((baseCalculo * 0.15 - 381.44) * 100) / 100;
    if (baseCalculo <= 4664.68) return Math.round((baseCalculo * 0.225 - 662.77) * 100) / 100;
    return Math.round((baseCalculo * 0.275 - 896.00) * 100) / 100;
  },
  
  calcularFGTS: (salario: number) => {
    return Math.round(salario * 0.08 * 100) / 100;
  },
  
  calcularHoraExtra: (valorHora: number, quantidade: number, percentual: number = 50) => {
    return Math.round(valorHora * quantidade * (1 + percentual / 100) * 100) / 100;
  },
  
  calcularValorHora: (salario: number, horasMensais: number = 220) => {
    return Math.round((salario / horasMensais) * 100) / 100;
  },
  
  calcularDSR: (totalHorasExtras: number, valorHora: number, diasUteis: number, domingos: number) => {
    // Descanso Semanal Remunerado sobre horas extras
    if (diasUteis === 0) return 0;
    return Math.round((totalHorasExtras * valorHora * domingos / diasUteis) * 100) / 100;
  },
  
  calcularSalarioLiquido: (proventos: number, descontos: number) => {
    return Math.round((proventos - descontos) * 100) / 100;
  },
};

describe('Serviço de Ponto', () => {
  describe('calcularHorasTrabalhadas()', () => {
    it('deve calcular horas trabalhadas', () => {
      const registro: RegistroPonto = {
        entrada1: '08:00',
        saida1: '12:00',
        entrada2: '13:00',
        saida2: '17:00',
        status: 'normal',
      };
      
      // 4h manhã + 4h tarde = 8h
      expect(pontoService.calcularHorasTrabalhadas(registro)).toBe(8);
    });

    it('deve calcular com hora extra', () => {
      const registro: RegistroPonto = {
        entrada1: '08:00',
        saida1: '12:00',
        entrada2: '13:00',
        saida2: '19:00',
        status: 'hora_extra',
      };
      
      // 4h + 6h = 10h
      expect(pontoService.calcularHorasTrabalhadas(registro)).toBe(10);
    });
  });

  describe('calcularHorasExtras()', () => {
    it('deve calcular horas extras', () => {
      expect(pontoService.calcularHorasExtras(10)).toBe(2);
      expect(pontoService.calcularHorasExtras(8)).toBe(0);
      expect(pontoService.calcularHorasExtras(6)).toBe(0);
    });
  });

  describe('verificarAtraso()', () => {
    it('deve detectar atraso', () => {
      expect(pontoService.verificarAtraso('08:15', '08:00')).toBe(15);
      expect(pontoService.verificarAtraso('09:00', '08:00')).toBe(60);
    });

    it('deve retornar 0 sem atraso', () => {
      expect(pontoService.verificarAtraso('08:00', '08:00')).toBe(0);
      expect(pontoService.verificarAtraso('07:45', '08:00')).toBe(0);
    });
  });

  describe('formatarHoras()', () => {
    it('deve formatar horas', () => {
      expect(pontoService.formatarHoras(8)).toBe('8h');
      expect(pontoService.formatarHoras(8.5)).toBe('8h 30min');
      expect(pontoService.formatarHoras(0.5)).toBe('30min');
    });
  });
});

describe('Serviço de Folha', () => {
  describe('calcularINSS()', () => {
    it('deve calcular INSS progressivo', () => {
      // Salário mínimo (aprox)
      const inss1 = folhaService.calcularINSS(1412);
      expect(inss1).toBeGreaterThan(100);
      expect(inss1).toBeLessThan(120);
      
      // Salário médio
      const inss2 = folhaService.calcularINSS(3000);
      expect(inss2).toBeGreaterThan(250);
      expect(inss2).toBeLessThan(350);
    });
  });

  describe('calcularIRRF()', () => {
    it('deve retornar 0 para salário isento', () => {
      const irrf = folhaService.calcularIRRF(2000, 150);
      expect(irrf).toBe(0);
    });

    it('deve calcular IRRF para salário tributável', () => {
      const irrf = folhaService.calcularIRRF(5000, 400);
      expect(irrf).toBeGreaterThan(0);
    });
  });

  describe('calcularFGTS()', () => {
    it('deve calcular 8% do salário', () => {
      expect(folhaService.calcularFGTS(3000)).toBe(240);
      expect(folhaService.calcularFGTS(5000)).toBe(400);
    });
  });

  describe('calcularHoraExtra()', () => {
    it('deve calcular hora extra 50%', () => {
      // R$20/hora * 10h * 1.5 = R$300
      expect(folhaService.calcularHoraExtra(20, 10, 50)).toBe(300);
    });

    it('deve calcular hora extra 100%', () => {
      // R$20/hora * 5h * 2.0 = R$200
      expect(folhaService.calcularHoraExtra(20, 5, 100)).toBe(200);
    });
  });

  describe('calcularValorHora()', () => {
    it('deve calcular valor da hora', () => {
      // R$2200 / 220h = R$10/hora
      expect(folhaService.calcularValorHora(2200)).toBe(10);
    });
  });

  describe('calcularSalarioLiquido()', () => {
    it('deve calcular salário líquido', () => {
      expect(folhaService.calcularSalarioLiquido(5000, 800)).toBe(4200);
    });
  });
});
