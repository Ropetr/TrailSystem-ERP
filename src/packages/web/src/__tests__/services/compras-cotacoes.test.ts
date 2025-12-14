// =============================================
// PLANAC ERP - Testes do Serviço de Cotações
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface RespostaFornecedor {
  fornecedor_id: string;
  valor_total: number;
  prazo_entrega: number;
}

interface Cotacao {
  id: string;
  status: 'aberta' | 'em_analise' | 'finalizada' | 'cancelada';
  fornecedores_convidados: number;
  respostas: RespostaFornecedor[];
}

const cotacoesService = {
  criar: async (dados: {
    titulo: string;
    itens: { produto_id: string; quantidade: number }[];
    fornecedores: string[];
    data_encerramento: string;
  }) => {
    const response = await fetch('/api/compras/cotacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  enviarConvites: async (cotacaoId: string, fornecedores: string[]) => {
    const response = await fetch(`/api/compras/cotacoes/${cotacaoId}/convidar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fornecedores }),
    });
    return response.json();
  },
  
  selecionarVencedor: async (cotacaoId: string, fornecedorId: string) => {
    const response = await fetch(`/api/compras/cotacoes/${cotacaoId}/selecionar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fornecedor_id: fornecedorId }),
    });
    return response.json();
  },
  
  encerrar: async (cotacaoId: string) => {
    const response = await fetch(`/api/compras/cotacoes/${cotacaoId}/encerrar`, {
      method: 'POST',
    });
    return response.json();
  },
  
  calcularMelhorProposta: (respostas: RespostaFornecedor[]) => {
    if (respostas.length === 0) return null;
    
    return respostas.reduce((melhor, atual) => 
      atual.valor_total < melhor.valor_total ? atual : melhor
    );
  },
  
  calcularEconomia: (respostas: RespostaFornecedor[]) => {
    if (respostas.length < 2) return 0;
    
    const valores = respostas.map(r => r.valor_total);
    const maior = Math.max(...valores);
    const menor = Math.min(...valores);
    
    return maior - menor;
  },
  
  calcularEconomiaPercentual: (respostas: RespostaFornecedor[]) => {
    if (respostas.length < 2) return 0;
    
    const valores = respostas.map(r => r.valor_total);
    const maior = Math.max(...valores);
    const menor = Math.min(...valores);
    
    return ((maior - menor) / maior) * 100;
  },
  
  ordenarPorPreco: (respostas: RespostaFornecedor[]) => {
    return [...respostas].sort((a, b) => a.valor_total - b.valor_total);
  },
  
  ordenarPorPrazo: (respostas: RespostaFornecedor[]) => {
    return [...respostas].sort((a, b) => a.prazo_entrega - b.prazo_entrega);
  },
  
  calcularTaxaResposta: (cotacao: Cotacao) => {
    if (cotacao.fornecedores_convidados === 0) return 0;
    return (cotacao.respostas.length / cotacao.fornecedores_convidados) * 100;
  },
  
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      aberta: 'Aberta',
      em_analise: 'Em Análise',
      finalizada: 'Finalizada',
      cancelada: 'Cancelada',
    };
    return labels[status] || status;
  },
  
  podeSelecionar: (cotacao: Cotacao) => {
    return cotacao.status === 'em_analise' && cotacao.respostas.length > 0;
  },
};

describe('Serviço de Cotações', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('criar()', () => {
    it('deve criar cotação', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { id: '1' } }),
      });

      await cotacoesService.criar({
        titulo: 'Compra de materiais',
        itens: [{ produto_id: 'p1', quantidade: 100 }],
        fornecedores: ['f1', 'f2', 'f3'],
        data_encerramento: '2025-02-01',
      });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/compras/cotacoes', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  describe('selecionarVencedor()', () => {
    it('deve selecionar vencedor', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await cotacoesService.selecionarVencedor('cot-1', 'forn-2');
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.fornecedor_id).toBe('forn-2');
    });
  });

  describe('calcularMelhorProposta()', () => {
    it('deve retornar proposta de menor valor', () => {
      const respostas: RespostaFornecedor[] = [
        { fornecedor_id: '1', valor_total: 5000, prazo_entrega: 10 },
        { fornecedor_id: '2', valor_total: 4500, prazo_entrega: 15 },
        { fornecedor_id: '3', valor_total: 5200, prazo_entrega: 7 },
      ];
      
      const melhor = cotacoesService.calcularMelhorProposta(respostas);
      
      expect(melhor?.fornecedor_id).toBe('2');
      expect(melhor?.valor_total).toBe(4500);
    });

    it('deve retornar null para lista vazia', () => {
      expect(cotacoesService.calcularMelhorProposta([])).toBeNull();
    });
  });

  describe('calcularEconomia()', () => {
    it('deve calcular diferença entre maior e menor valor', () => {
      const respostas: RespostaFornecedor[] = [
        { fornecedor_id: '1', valor_total: 5000, prazo_entrega: 10 },
        { fornecedor_id: '2', valor_total: 4000, prazo_entrega: 15 },
        { fornecedor_id: '3', valor_total: 6000, prazo_entrega: 7 },
      ];
      
      // 6000 - 4000 = 2000
      expect(cotacoesService.calcularEconomia(respostas)).toBe(2000);
    });

    it('deve retornar 0 para menos de 2 respostas', () => {
      expect(cotacoesService.calcularEconomia([])).toBe(0);
      expect(cotacoesService.calcularEconomia([{ fornecedor_id: '1', valor_total: 1000, prazo_entrega: 5 }])).toBe(0);
    });
  });

  describe('calcularEconomiaPercentual()', () => {
    it('deve calcular economia percentual', () => {
      const respostas: RespostaFornecedor[] = [
        { fornecedor_id: '1', valor_total: 100, prazo_entrega: 10 },
        { fornecedor_id: '2', valor_total: 80, prazo_entrega: 15 },
      ];
      
      // (100 - 80) / 100 = 20%
      expect(cotacoesService.calcularEconomiaPercentual(respostas)).toBe(20);
    });
  });

  describe('ordenarPorPreco()', () => {
    it('deve ordenar por valor ascendente', () => {
      const respostas: RespostaFornecedor[] = [
        { fornecedor_id: '1', valor_total: 5000, prazo_entrega: 10 },
        { fornecedor_id: '2', valor_total: 3000, prazo_entrega: 15 },
        { fornecedor_id: '3', valor_total: 4000, prazo_entrega: 7 },
      ];
      
      const ordenadas = cotacoesService.ordenarPorPreco(respostas);
      
      expect(ordenadas[0].valor_total).toBe(3000);
      expect(ordenadas[1].valor_total).toBe(4000);
      expect(ordenadas[2].valor_total).toBe(5000);
    });
  });

  describe('ordenarPorPrazo()', () => {
    it('deve ordenar por prazo ascendente', () => {
      const respostas: RespostaFornecedor[] = [
        { fornecedor_id: '1', valor_total: 5000, prazo_entrega: 10 },
        { fornecedor_id: '2', valor_total: 3000, prazo_entrega: 5 },
        { fornecedor_id: '3', valor_total: 4000, prazo_entrega: 15 },
      ];
      
      const ordenadas = cotacoesService.ordenarPorPrazo(respostas);
      
      expect(ordenadas[0].prazo_entrega).toBe(5);
      expect(ordenadas[1].prazo_entrega).toBe(10);
      expect(ordenadas[2].prazo_entrega).toBe(15);
    });
  });

  describe('calcularTaxaResposta()', () => {
    it('deve calcular taxa de resposta', () => {
      const cotacao: Cotacao = {
        id: '1',
        status: 'em_analise',
        fornecedores_convidados: 10,
        respostas: [
          { fornecedor_id: '1', valor_total: 1000, prazo_entrega: 5 },
          { fornecedor_id: '2', valor_total: 1200, prazo_entrega: 7 },
          { fornecedor_id: '3', valor_total: 900, prazo_entrega: 10 },
        ],
      };
      
      // 3 / 10 = 30%
      expect(cotacoesService.calcularTaxaResposta(cotacao)).toBe(30);
    });
  });

  describe('podeSelecionar()', () => {
    it('deve permitir selecionar em análise com respostas', () => {
      const cotacao: Cotacao = {
        id: '1', status: 'em_analise', fornecedores_convidados: 5,
        respostas: [{ fornecedor_id: '1', valor_total: 1000, prazo_entrega: 5 }],
      };
      expect(cotacoesService.podeSelecionar(cotacao)).toBe(true);
    });

    it('não deve permitir selecionar cotação aberta', () => {
      const cotacao: Cotacao = {
        id: '1', status: 'aberta', fornecedores_convidados: 5,
        respostas: [{ fornecedor_id: '1', valor_total: 1000, prazo_entrega: 5 }],
      };
      expect(cotacoesService.podeSelecionar(cotacao)).toBe(false);
    });
  });
});
