// =============================================
// PLANAC ERP - Testes do Módulo Patrimônio
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface Ativo {
  id: string;
  valor_aquisicao: number;
  valor_residual: number;
  vida_util_meses: number;
  depreciacao_acumulada: number;
  data_aquisicao: string;
  status: string;
}

const patrimonioService = {
  calcularDepreciacaoLinear: (valorAquisicao: number, valorResidual: number, vidaUtilMeses: number) => {
    const valorDepreciavel = valorAquisicao - valorResidual;
    if (vidaUtilMeses <= 0 || valorDepreciavel <= 0) return 0;
    return Math.round((valorDepreciavel / vidaUtilMeses) * 100) / 100;
  },
  
  calcularDepreciacaoSomaDigitos: (valorAquisicao: number, valorResidual: number, vidaUtilMeses: number, mesAtual: number) => {
    const valorDepreciavel = valorAquisicao - valorResidual;
    if (vidaUtilMeses <= 0 || valorDepreciavel <= 0 || mesAtual > vidaUtilMeses) return 0;
    
    // Soma dos dígitos = n(n+1)/2
    const somaDigitos = (vidaUtilMeses * (vidaUtilMeses + 1)) / 2;
    const fator = (vidaUtilMeses - mesAtual + 1) / somaDigitos;
    
    return Math.round(valorDepreciavel * fator * 100) / 100;
  },
  
  calcularValorContabil: (valorAquisicao: number, depreciacaoAcumulada: number) => {
    return Math.max(0, valorAquisicao - depreciacaoAcumulada);
  },
  
  calcularTaxaMensal: (vidaUtilMeses: number) => {
    if (vidaUtilMeses <= 0) return 0;
    return Math.round((1 / vidaUtilMeses) * 10000) / 10000; // 4 casas decimais
  },
  
  calcularTaxaAnual: (vidaUtilMeses: number) => {
    if (vidaUtilMeses <= 0) return 0;
    return Math.round((12 / vidaUtilMeses) * 10000) / 10000;
  },
  
  calcularMesesRestantes: (dataAquisicao: string, vidaUtilMeses: number) => {
    const aquisicao = new Date(dataAquisicao);
    const hoje = new Date();
    const mesesDecorridos = (hoje.getFullYear() - aquisicao.getFullYear()) * 12 + (hoje.getMonth() - aquisicao.getMonth());
    return Math.max(0, vidaUtilMeses - mesesDecorridos);
  },
  
  calcularPercentualDepreciado: (valorAquisicao: number, valorResidual: number, depreciacaoAcumulada: number) => {
    const valorDepreciavel = valorAquisicao - valorResidual;
    if (valorDepreciavel <= 0) return 100;
    return Math.min(100, Math.round((depreciacaoAcumulada / valorDepreciavel) * 10000) / 100);
  },
  
  verificarTotalmenteDepreciado: (ativo: Ativo) => {
    return ativo.depreciacao_acumulada >= (ativo.valor_aquisicao - ativo.valor_residual);
  },
  
  calcularGanhoPerda: (valorContabil: number, valorVenda: number) => {
    return valorVenda - valorContabil;
  },
  
  validarVidaUtil: (categoria: string) => {
    // Vida útil mínima por categoria (em meses) - padrão Receita Federal
    const vidasUteis: Record<string, number> = {
      edificios: 300,        // 25 anos
      maquinas: 120,         // 10 anos
      veiculos: 60,          // 5 anos
      moveis: 120,           // 10 anos
      equipamentos_ti: 60,   // 5 anos
      instalacoes: 120,      // 10 anos
    };
    return vidasUteis[categoria] || 60;
  },
  
  gerarCodigo: (categoria: string, sequencial: number) => {
    const prefixos: Record<string, string> = {
      edificios: 'ED',
      maquinas: 'MQ',
      veiculos: 'VE',
      moveis: 'MV',
      equipamentos_ti: 'TI',
      instalacoes: 'IN',
    };
    const prefixo = prefixos[categoria] || 'AT';
    return `${prefixo}${sequencial.toString().padStart(5, '0')}`;
  },
  
  podeDepreciar: (ativo: Ativo) => {
    return ativo.status === 'ativo' && !patrimonioService.verificarTotalmenteDepreciado(ativo);
  },
};

describe('Serviço de Patrimônio', () => {
  describe('calcularDepreciacaoLinear()', () => {
    it('deve calcular depreciação linear corretamente', () => {
      // Ativo de R$12.000, residual R$0, vida útil 60 meses = R$200/mês
      expect(patrimonioService.calcularDepreciacaoLinear(12000, 0, 60)).toBe(200);
    });

    it('deve considerar valor residual', () => {
      // Ativo de R$12.000, residual R$2.000, vida útil 60 meses = R$166.67/mês
      expect(patrimonioService.calcularDepreciacaoLinear(12000, 2000, 60)).toBe(166.67);
    });

    it('deve retornar 0 para vida útil inválida', () => {
      expect(patrimonioService.calcularDepreciacaoLinear(12000, 0, 0)).toBe(0);
      expect(patrimonioService.calcularDepreciacaoLinear(12000, 0, -10)).toBe(0);
    });
  });

  describe('calcularDepreciacaoSomaDigitos()', () => {
    it('deve calcular depreciação por soma dos dígitos', () => {
      // Ativo de R$10.000, residual R$0, vida útil 5 meses
      // Soma = 1+2+3+4+5 = 15
      // Mês 1: 10000 * 5/15 = 3333.33
      expect(patrimonioService.calcularDepreciacaoSomaDigitos(10000, 0, 5, 1)).toBe(3333.33);
    });

    it('deve retornar 0 após vida útil', () => {
      expect(patrimonioService.calcularDepreciacaoSomaDigitos(10000, 0, 5, 6)).toBe(0);
    });
  });

  describe('calcularValorContabil()', () => {
    it('deve calcular valor contábil', () => {
      expect(patrimonioService.calcularValorContabil(10000, 3000)).toBe(7000);
    });

    it('não deve retornar valor negativo', () => {
      expect(patrimonioService.calcularValorContabil(10000, 15000)).toBe(0);
    });
  });

  describe('calcularTaxaMensal()', () => {
    it('deve calcular taxa mensal', () => {
      // 60 meses = 1/60 = 0.0167 (1.67%)
      expect(patrimonioService.calcularTaxaMensal(60)).toBe(0.0167);
    });
  });

  describe('calcularTaxaAnual()', () => {
    it('deve calcular taxa anual', () => {
      // 60 meses = 12/60 = 0.2 (20% ao ano)
      expect(patrimonioService.calcularTaxaAnual(60)).toBe(0.2);
    });
  });

  describe('calcularPercentualDepreciado()', () => {
    it('deve calcular percentual depreciado', () => {
      // 10000 aquisição, 0 residual, 5000 depreciado = 50%
      expect(patrimonioService.calcularPercentualDepreciado(10000, 0, 5000)).toBe(50);
    });

    it('não deve ultrapassar 100%', () => {
      expect(patrimonioService.calcularPercentualDepreciado(10000, 0, 15000)).toBe(100);
    });
  });

  describe('verificarTotalmenteDepreciado()', () => {
    it('deve identificar ativo totalmente depreciado', () => {
      const ativo: Ativo = {
        id: '1', valor_aquisicao: 10000, valor_residual: 0,
        vida_util_meses: 60, depreciacao_acumulada: 10000,
        data_aquisicao: '2020-01-01', status: 'ativo',
      };
      expect(patrimonioService.verificarTotalmenteDepreciado(ativo)).toBe(true);
    });

    it('deve identificar ativo não totalmente depreciado', () => {
      const ativo: Ativo = {
        id: '1', valor_aquisicao: 10000, valor_residual: 0,
        vida_util_meses: 60, depreciacao_acumulada: 5000,
        data_aquisicao: '2020-01-01', status: 'ativo',
      };
      expect(patrimonioService.verificarTotalmenteDepreciado(ativo)).toBe(false);
    });
  });

  describe('calcularGanhoPerda()', () => {
    it('deve calcular ganho na venda', () => {
      // Valor contábil 5000, vendido por 7000 = ganho de 2000
      expect(patrimonioService.calcularGanhoPerda(5000, 7000)).toBe(2000);
    });

    it('deve calcular perda na venda', () => {
      // Valor contábil 5000, vendido por 3000 = perda de -2000
      expect(patrimonioService.calcularGanhoPerda(5000, 3000)).toBe(-2000);
    });
  });

  describe('validarVidaUtil()', () => {
    it('deve retornar vida útil padrão por categoria', () => {
      expect(patrimonioService.validarVidaUtil('veiculos')).toBe(60);
      expect(patrimonioService.validarVidaUtil('edificios')).toBe(300);
      expect(patrimonioService.validarVidaUtil('equipamentos_ti')).toBe(60);
    });

    it('deve retornar 60 para categoria desconhecida', () => {
      expect(patrimonioService.validarVidaUtil('desconhecido')).toBe(60);
    });
  });

  describe('gerarCodigo()', () => {
    it('deve gerar código com prefixo correto', () => {
      expect(patrimonioService.gerarCodigo('veiculos', 1)).toBe('VE00001');
      expect(patrimonioService.gerarCodigo('equipamentos_ti', 123)).toBe('TI00123');
    });
  });

  describe('podeDepreciar()', () => {
    it('deve permitir depreciação de ativo ativo não totalmente depreciado', () => {
      const ativo: Ativo = {
        id: '1', valor_aquisicao: 10000, valor_residual: 0,
        vida_util_meses: 60, depreciacao_acumulada: 5000,
        data_aquisicao: '2020-01-01', status: 'ativo',
      };
      expect(patrimonioService.podeDepreciar(ativo)).toBe(true);
    });

    it('não deve permitir depreciação de ativo baixado', () => {
      const ativo: Ativo = {
        id: '1', valor_aquisicao: 10000, valor_residual: 0,
        vida_util_meses: 60, depreciacao_acumulada: 5000,
        data_aquisicao: '2020-01-01', status: 'baixado',
      };
      expect(patrimonioService.podeDepreciar(ativo)).toBe(false);
    });
  });
});
