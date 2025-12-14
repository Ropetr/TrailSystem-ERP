// =============================================
// PLANAC ERP - Testes do Serviço de Fluxo de Caixa
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface Movimentacao {
  tipo: 'entrada' | 'saida';
  valor: number;
  data: string;
  categoria: string;
}

interface FluxoDia {
  data: string;
  saldo_inicial: number;
  entradas: number;
  saidas: number;
  saldo_final: number;
  movimentacoes: Movimentacao[];
}

const fluxoCaixaService = {
  getFluxo: async (dataInicio: string, dataFim: string) => {
    const params = new URLSearchParams({ data_inicio: dataInicio, data_fim: dataFim });
    const response = await fetch(`/api/financeiro/fluxo-caixa?${params}`);
    return response.json();
  },
  
  getPrevisao: async (dataInicio: string, dataFim: string) => {
    const params = new URLSearchParams({ data_inicio: dataInicio, data_fim: dataFim });
    const response = await fetch(`/api/financeiro/fluxo-caixa/previsao?${params}`);
    return response.json();
  },
  
  calcularSaldoPeriodo: (fluxo: FluxoDia[]) => {
    const totalEntradas = fluxo.reduce((acc, dia) => acc + dia.entradas, 0);
    const totalSaidas = fluxo.reduce((acc, dia) => acc + dia.saidas, 0);
    return totalEntradas - totalSaidas;
  },
  
  calcularSaldoFinal: (saldoInicial: number, entradas: number, saidas: number) => {
    return saldoInicial + entradas - saidas;
  },
  
  agruparPorSemana: (fluxo: FluxoDia[]) => {
    const semanas: Record<string, FluxoDia> = {};
    
    fluxo.forEach(dia => {
      const data = new Date(dia.data + 'T12:00:00');
      const inicioSemana = new Date(data);
      inicioSemana.setDate(data.getDate() - data.getDay());
      const chave = inicioSemana.toISOString().split('T')[0];
      
      if (!semanas[chave]) {
        semanas[chave] = {
          data: chave,
          saldo_inicial: dia.saldo_inicial,
          entradas: 0,
          saidas: 0,
          saldo_final: 0,
          movimentacoes: [],
        };
      }
      
      semanas[chave].entradas += dia.entradas;
      semanas[chave].saidas += dia.saidas;
      semanas[chave].saldo_final = dia.saldo_final;
      semanas[chave].movimentacoes.push(...dia.movimentacoes);
    });
    
    return Object.values(semanas);
  },
  
  agruparPorMes: (fluxo: FluxoDia[]) => {
    const meses: Record<string, FluxoDia> = {};
    
    fluxo.forEach(dia => {
      const data = new Date(dia.data + 'T12:00:00');
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-01`;
      
      if (!meses[chave]) {
        meses[chave] = {
          data: chave,
          saldo_inicial: dia.saldo_inicial,
          entradas: 0,
          saidas: 0,
          saldo_final: 0,
          movimentacoes: [],
        };
      }
      
      meses[chave].entradas += dia.entradas;
      meses[chave].saidas += dia.saidas;
      meses[chave].saldo_final = dia.saldo_final;
    });
    
    return Object.values(meses);
  },
  
  agruparPorCategoria: (movimentacoes: Movimentacao[]) => {
    const categorias: Record<string, { entradas: number; saidas: number }> = {};
    
    movimentacoes.forEach(mov => {
      if (!categorias[mov.categoria]) {
        categorias[mov.categoria] = { entradas: 0, saidas: 0 };
      }
      
      if (mov.tipo === 'entrada') {
        categorias[mov.categoria].entradas += mov.valor;
      } else {
        categorias[mov.categoria].saidas += mov.valor;
      }
    });
    
    return categorias;
  },
  
  calcularMediaDiaria: (fluxo: FluxoDia[]) => {
    if (fluxo.length === 0) return { entradas: 0, saidas: 0 };
    
    const totalEntradas = fluxo.reduce((acc, dia) => acc + dia.entradas, 0);
    const totalSaidas = fluxo.reduce((acc, dia) => acc + dia.saidas, 0);
    
    return {
      entradas: totalEntradas / fluxo.length,
      saidas: totalSaidas / fluxo.length,
    };
  },
  
  projetarSaldo: (saldoAtual: number, mediaEntradas: number, mediaSaidas: number, dias: number) => {
    return saldoAtual + (mediaEntradas - mediaSaidas) * dias;
  },
};

describe('Serviço de Fluxo de Caixa', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getFluxo()', () => {
    it('deve buscar fluxo do período', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await fluxoCaixaService.getFluxo('2025-01-01', '2025-01-31');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/financeiro/fluxo-caixa?data_inicio=2025-01-01&data_fim=2025-01-31');
    });
  });

  describe('calcularSaldoPeriodo()', () => {
    it('deve calcular saldo do período', () => {
      const fluxo: FluxoDia[] = [
        { data: '2025-01-01', saldo_inicial: 1000, entradas: 500, saidas: 200, saldo_final: 1300, movimentacoes: [] },
        { data: '2025-01-02', saldo_inicial: 1300, entradas: 300, saidas: 400, saldo_final: 1200, movimentacoes: [] },
      ];
      
      // 800 - 600 = 200
      expect(fluxoCaixaService.calcularSaldoPeriodo(fluxo)).toBe(200);
    });
  });

  describe('calcularSaldoFinal()', () => {
    it('deve calcular saldo final corretamente', () => {
      expect(fluxoCaixaService.calcularSaldoFinal(1000, 500, 300)).toBe(1200);
      expect(fluxoCaixaService.calcularSaldoFinal(1000, 200, 500)).toBe(700);
    });
  });

  describe('agruparPorSemana()', () => {
    it('deve agrupar movimentações por semana', () => {
      const fluxo: FluxoDia[] = [
        { data: '2025-01-06', saldo_inicial: 1000, entradas: 100, saidas: 50, saldo_final: 1050, movimentacoes: [] },
        { data: '2025-01-07', saldo_inicial: 1050, entradas: 200, saidas: 100, saldo_final: 1150, movimentacoes: [] },
        { data: '2025-01-13', saldo_inicial: 1150, entradas: 300, saidas: 150, saldo_final: 1300, movimentacoes: [] },
      ];
      
      const semanas = fluxoCaixaService.agruparPorSemana(fluxo);
      
      expect(semanas.length).toBe(2);
    });
  });

  describe('agruparPorMes()', () => {
    it('deve agrupar movimentações por mês', () => {
      const fluxo: FluxoDia[] = [
        { data: '2025-01-15', saldo_inicial: 1000, entradas: 100, saidas: 50, saldo_final: 1050, movimentacoes: [] },
        { data: '2025-01-20', saldo_inicial: 1050, entradas: 200, saidas: 100, saldo_final: 1150, movimentacoes: [] },
        { data: '2025-02-05', saldo_inicial: 1150, entradas: 300, saidas: 150, saldo_final: 1300, movimentacoes: [] },
      ];
      
      const meses = fluxoCaixaService.agruparPorMes(fluxo);
      
      expect(meses.length).toBe(2);
    });
  });

  describe('agruparPorCategoria()', () => {
    it('deve agrupar movimentações por categoria', () => {
      const movimentacoes: Movimentacao[] = [
        { tipo: 'entrada', valor: 1000, data: '2025-01-01', categoria: 'Vendas' },
        { tipo: 'entrada', valor: 500, data: '2025-01-02', categoria: 'Vendas' },
        { tipo: 'saida', valor: 300, data: '2025-01-01', categoria: 'Fornecedores' },
        { tipo: 'saida', valor: 200, data: '2025-01-02', categoria: 'Salários' },
      ];
      
      const categorias = fluxoCaixaService.agruparPorCategoria(movimentacoes);
      
      expect(categorias['Vendas'].entradas).toBe(1500);
      expect(categorias['Fornecedores'].saidas).toBe(300);
      expect(categorias['Salários'].saidas).toBe(200);
    });
  });

  describe('calcularMediaDiaria()', () => {
    it('deve calcular média diária de entradas e saídas', () => {
      const fluxo: FluxoDia[] = [
        { data: '2025-01-01', saldo_inicial: 1000, entradas: 300, saidas: 100, saldo_final: 1200, movimentacoes: [] },
        { data: '2025-01-02', saldo_inicial: 1200, entradas: 200, saidas: 200, saldo_final: 1200, movimentacoes: [] },
        { data: '2025-01-03', saldo_inicial: 1200, entradas: 400, saidas: 300, saldo_final: 1300, movimentacoes: [] },
      ];
      
      const media = fluxoCaixaService.calcularMediaDiaria(fluxo);
      
      expect(media.entradas).toBe(300); // (300+200+400)/3
      expect(media.saidas).toBe(200);   // (100+200+300)/3
    });

    it('deve retornar 0 para fluxo vazio', () => {
      const media = fluxoCaixaService.calcularMediaDiaria([]);
      expect(media.entradas).toBe(0);
      expect(media.saidas).toBe(0);
    });
  });

  describe('projetarSaldo()', () => {
    it('deve projetar saldo futuro', () => {
      // Saldo atual 10000, média entrada 500/dia, média saída 300/dia, 30 dias
      // 10000 + (500 - 300) * 30 = 10000 + 6000 = 16000
      expect(fluxoCaixaService.projetarSaldo(10000, 500, 300, 30)).toBe(16000);
    });

    it('deve projetar saldo negativo se saídas maiores', () => {
      // Saldo atual 1000, média entrada 100/dia, média saída 200/dia, 15 dias
      // 1000 + (100 - 200) * 15 = 1000 - 1500 = -500
      expect(fluxoCaixaService.projetarSaldo(1000, 100, 200, 15)).toBe(-500);
    });
  });
});
