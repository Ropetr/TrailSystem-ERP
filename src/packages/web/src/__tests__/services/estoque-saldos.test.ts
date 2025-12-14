// =============================================
// PLANAC ERP - Testes do Serviço de Saldos
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface SaldoEstoque {
  produto_id: string;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo: number;
  estoque_reservado: number;
  preco_custo: number;
}

const saldosService = {
  listar: async (filtros?: { filial_id?: string; categoria?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.filial_id) params.append('filial_id', filtros.filial_id);
    if (filtros?.categoria) params.append('categoria', filtros.categoria);
    if (filtros?.status) params.append('status', filtros.status);
    
    const response = await fetch(`/api/estoque/saldos?${params}`);
    return response.json();
  },
  
  buscarPorProduto: async (produtoId: string, filialId?: string) => {
    const params = filialId ? `?filial_id=${filialId}` : '';
    const response = await fetch(`/api/estoque/saldos/produto/${produtoId}${params}`);
    return response.json();
  },
  
  calcularEstoqueDisponivel: (estoqueAtual: number, estoqueReservado: number) => {
    return Math.max(0, estoqueAtual - estoqueReservado);
  },
  
  calcularValorEstoque: (estoqueAtual: number, precoCusto: number) => {
    return estoqueAtual * precoCusto;
  },
  
  determinarStatus: (saldo: SaldoEstoque): 'normal' | 'baixo' | 'critico' | 'excesso' => {
    if (saldo.estoque_atual <= 0) return 'critico';
    if (saldo.estoque_atual < saldo.estoque_minimo) return 'baixo';
    if (saldo.estoque_atual > saldo.estoque_maximo) return 'excesso';
    return 'normal';
  },
  
  calcularDiasEstoque: (estoqueAtual: number, consumoMedioDiario: number) => {
    if (consumoMedioDiario <= 0) return Infinity;
    return Math.floor(estoqueAtual / consumoMedioDiario);
  },
  
  calcularPontoRessuprimento: (consumoMedioDiario: number, leadTimeDias: number, estoqueSeguranca: number) => {
    return (consumoMedioDiario * leadTimeDias) + estoqueSeguranca;
  },
  
  precisaReposicao: (saldo: SaldoEstoque) => {
    const disponivel = saldo.estoque_atual - saldo.estoque_reservado;
    return disponivel < saldo.estoque_minimo;
  },
  
  calcularQuantidadeReposicao: (saldo: SaldoEstoque) => {
    const disponivel = saldo.estoque_atual - saldo.estoque_reservado;
    if (disponivel >= saldo.estoque_minimo) return 0;
    
    // Repor até o estoque máximo
    return saldo.estoque_maximo - disponivel;
  },
};

describe('Serviço de Saldos de Estoque', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('listar()', () => {
    it('deve listar todos os saldos', async () => {
      const mockSaldos = [
        { produto_id: '1', estoque_atual: 100 },
        { produto_id: '2', estoque_atual: 50 },
      ];
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockSaldos }),
      });

      const result = await saldosService.listar();
      
      expect(result.data).toHaveLength(2);
    });

    it('deve filtrar por filial', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await saldosService.listar({ filial_id: '1' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/estoque/saldos?filial_id=1');
    });

    it('deve filtrar por status', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await saldosService.listar({ status: 'baixo' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/estoque/saldos?status=baixo');
    });
  });

  describe('calcularEstoqueDisponivel()', () => {
    it('deve calcular estoque disponível', () => {
      expect(saldosService.calcularEstoqueDisponivel(100, 30)).toBe(70);
    });

    it('deve retornar 0 se reservado maior que atual', () => {
      expect(saldosService.calcularEstoqueDisponivel(50, 80)).toBe(0);
    });

    it('deve retornar estoque total se sem reserva', () => {
      expect(saldosService.calcularEstoqueDisponivel(100, 0)).toBe(100);
    });
  });

  describe('calcularValorEstoque()', () => {
    it('deve calcular valor total em estoque', () => {
      expect(saldosService.calcularValorEstoque(100, 45.90)).toBe(4590);
    });

    it('deve retornar 0 para estoque zerado', () => {
      expect(saldosService.calcularValorEstoque(0, 45.90)).toBe(0);
    });
  });

  describe('determinarStatus()', () => {
    it('deve retornar crítico para estoque zerado', () => {
      const saldo: SaldoEstoque = {
        produto_id: '1',
        estoque_atual: 0,
        estoque_minimo: 10,
        estoque_maximo: 100,
        estoque_reservado: 0,
        preco_custo: 50,
      };
      expect(saldosService.determinarStatus(saldo)).toBe('critico');
    });

    it('deve retornar baixo quando abaixo do mínimo', () => {
      const saldo: SaldoEstoque = {
        produto_id: '1',
        estoque_atual: 5,
        estoque_minimo: 10,
        estoque_maximo: 100,
        estoque_reservado: 0,
        preco_custo: 50,
      };
      expect(saldosService.determinarStatus(saldo)).toBe('baixo');
    });

    it('deve retornar excesso quando acima do máximo', () => {
      const saldo: SaldoEstoque = {
        produto_id: '1',
        estoque_atual: 150,
        estoque_minimo: 10,
        estoque_maximo: 100,
        estoque_reservado: 0,
        preco_custo: 50,
      };
      expect(saldosService.determinarStatus(saldo)).toBe('excesso');
    });

    it('deve retornar normal quando dentro dos limites', () => {
      const saldo: SaldoEstoque = {
        produto_id: '1',
        estoque_atual: 50,
        estoque_minimo: 10,
        estoque_maximo: 100,
        estoque_reservado: 0,
        preco_custo: 50,
      };
      expect(saldosService.determinarStatus(saldo)).toBe('normal');
    });
  });

  describe('calcularDiasEstoque()', () => {
    it('deve calcular dias de estoque', () => {
      expect(saldosService.calcularDiasEstoque(100, 10)).toBe(10);
      expect(saldosService.calcularDiasEstoque(150, 10)).toBe(15);
    });

    it('deve retornar Infinity se sem consumo', () => {
      expect(saldosService.calcularDiasEstoque(100, 0)).toBe(Infinity);
    });
  });

  describe('calcularPontoRessuprimento()', () => {
    it('deve calcular ponto de ressuprimento', () => {
      // Consumo diário 10, lead time 5 dias, segurança 20
      expect(saldosService.calcularPontoRessuprimento(10, 5, 20)).toBe(70);
    });
  });

  describe('precisaReposicao()', () => {
    it('deve identificar necessidade de reposição', () => {
      const saldoBaixo: SaldoEstoque = {
        produto_id: '1',
        estoque_atual: 15,
        estoque_minimo: 20,
        estoque_maximo: 100,
        estoque_reservado: 0,
        preco_custo: 50,
      };
      expect(saldosService.precisaReposicao(saldoBaixo)).toBe(true);
    });

    it('deve considerar reservados na análise', () => {
      const saldo: SaldoEstoque = {
        produto_id: '1',
        estoque_atual: 30,
        estoque_minimo: 20,
        estoque_maximo: 100,
        estoque_reservado: 15, // Disponível = 15, abaixo do mínimo
        preco_custo: 50,
      };
      expect(saldosService.precisaReposicao(saldo)).toBe(true);
    });

    it('deve retornar false quando estoque suficiente', () => {
      const saldoOk: SaldoEstoque = {
        produto_id: '1',
        estoque_atual: 50,
        estoque_minimo: 20,
        estoque_maximo: 100,
        estoque_reservado: 10,
        preco_custo: 50,
      };
      expect(saldosService.precisaReposicao(saldoOk)).toBe(false);
    });
  });

  describe('calcularQuantidadeReposicao()', () => {
    it('deve calcular quantidade para repor até o máximo', () => {
      const saldo: SaldoEstoque = {
        produto_id: '1',
        estoque_atual: 10,
        estoque_minimo: 20,
        estoque_maximo: 100,
        estoque_reservado: 5, // Disponível = 5
        preco_custo: 50,
      };
      // Repor de 5 até 100 = 95
      expect(saldosService.calcularQuantidadeReposicao(saldo)).toBe(95);
    });

    it('deve retornar 0 se não precisa reposição', () => {
      const saldo: SaldoEstoque = {
        produto_id: '1',
        estoque_atual: 50,
        estoque_minimo: 20,
        estoque_maximo: 100,
        estoque_reservado: 0,
        preco_custo: 50,
      };
      expect(saldosService.calcularQuantidadeReposicao(saldo)).toBe(0);
    });
  });
});
