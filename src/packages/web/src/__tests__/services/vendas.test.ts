// =============================================
// PLANAC ERP - Testes do Serviço de Vendas
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface Entrega {
  numero: string; // .E1, .E2, etc
  data_prevista: string;
  itens: { produto_id: string; quantidade: number }[];
  status: 'pendente' | 'separando' | 'expedido' | 'entregue';
  financeiro: 'integral' | 'proporcional' | 'definir_depois';
}

const vendasService = {
  listar: async (filtros?: { status?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.status) params.append('status', filtros.status);
    
    const response = await fetch(`/api/vendas?${params}`);
    return response.json();
  },
  
  criarComEntregas: async (dados: { orcamento_id: string; entregas: Entrega[] }) => {
    const response = await fetch('/api/vendas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  usarCredito: async (vendaId: string, creditoIds: string[], modo: 'na_venda' | 'por_entrega') => {
    const response = await fetch(`/api/vendas/${vendaId}/usar-credito`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credito_ids: creditoIds, modo }),
    });
    return response.json();
  },
  
  emitirNFe: async (vendaId: string, entregaNumero?: string) => {
    const url = entregaNumero 
      ? `/api/vendas/${vendaId}/nfe?entrega=${entregaNumero}`
      : `/api/vendas/${vendaId}/nfe`;
    
    const response = await fetch(url, { method: 'POST' });
    return response.json();
  },
  
  gerarNumeroEntrega: (vendaNumero: string, sequencia: number) => {
    return `${vendaNumero}.E${sequencia}`;
  },
  
  calcularValorEntrega: (totalVenda: number, itensEntrega: number, totalItens: number) => {
    if (totalItens === 0) return 0;
    return (totalVenda * itensEntrega) / totalItens;
  },
  
  verificarCreditoCobreTotal: (saldoCredito: number, totalVenda: number) => {
    return saldoCredito >= totalVenda;
  },
};

describe('Serviço de Vendas', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('listar()', () => {
    it('deve listar vendas', async () => {
      const mockVendas = [
        { id: '1', numero: 'VND-001', status: 'pendente', total: 5000 },
        { id: '2', numero: 'VND-002', status: 'faturado', total: 3000 },
      ];
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockVendas }),
      });

      const result = await vendasService.listar();
      
      expect(result.data).toHaveLength(2);
    });

    it('deve filtrar por status', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await vendasService.listar({ status: 'faturado' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/vendas?status=faturado');
    });
  });

  describe('criarComEntregas()', () => {
    it('deve criar venda com múltiplas entregas', async () => {
      const dados = {
        orcamento_id: '123',
        entregas: [
          { numero: '.E1', data_prevista: '2025-01-15', itens: [], status: 'pendente' as const, financeiro: 'proporcional' as const },
          { numero: '.E2', data_prevista: '2025-01-20', itens: [], status: 'pendente' as const, financeiro: 'proporcional' as const },
        ],
      };
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { id: '1', entregas: dados.entregas } }),
      });

      const result = await vendasService.criarComEntregas(dados);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/vendas', expect.objectContaining({
        method: 'POST',
      }));
      expect(result.data.entregas).toHaveLength(2);
    });
  });

  describe('usarCredito()', () => {
    it('deve usar crédito na venda', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, creditoUtilizado: 500 }),
      });

      const result = await vendasService.usarCredito('1', ['cred1', 'cred2'], 'na_venda');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/vendas/1/usar-credito', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ credito_ids: ['cred1', 'cred2'], modo: 'na_venda' }),
      }));
    });

    it('deve reservar crédito por entrega', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await vendasService.usarCredito('1', ['cred1'], 'por_entrega');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/vendas/1/usar-credito', expect.objectContaining({
        body: JSON.stringify({ credito_ids: ['cred1'], modo: 'por_entrega' }),
      }));
    });
  });

  describe('emitirNFe()', () => {
    it('deve emitir NF-e para venda completa', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, nfe: { chave: '12345' } }),
      });

      await vendasService.emitirNFe('1');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/vendas/1/nfe', { method: 'POST' });
    });

    it('deve emitir NF-e para entrega específica', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, nfe: { chave: '12345' } }),
      });

      await vendasService.emitirNFe('1', '.E1');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/vendas/1/nfe?entrega=.E1', { method: 'POST' });
    });
  });

  describe('gerarNumeroEntrega()', () => {
    it('deve gerar número de entrega correto', () => {
      expect(vendasService.gerarNumeroEntrega('VND-001', 1)).toBe('VND-001.E1');
      expect(vendasService.gerarNumeroEntrega('VND-001', 2)).toBe('VND-001.E2');
      expect(vendasService.gerarNumeroEntrega('VND-001', 10)).toBe('VND-001.E10');
    });
  });

  describe('calcularValorEntrega()', () => {
    it('deve calcular valor proporcional da entrega', () => {
      const valor = vendasService.calcularValorEntrega(10000, 30, 100);
      expect(valor).toBe(3000); // 30% dos itens = 30% do valor
    });

    it('deve retornar 0 se total de itens for zero', () => {
      const valor = vendasService.calcularValorEntrega(10000, 30, 0);
      expect(valor).toBe(0);
    });
  });

  describe('verificarCreditoCobreTotal()', () => {
    it('deve retornar true se crédito cobre total', () => {
      expect(vendasService.verificarCreditoCobreTotal(5000, 4000)).toBe(true);
      expect(vendasService.verificarCreditoCobreTotal(5000, 5000)).toBe(true);
    });

    it('deve retornar false se crédito não cobre total', () => {
      expect(vendasService.verificarCreditoCobreTotal(3000, 5000)).toBe(false);
    });
  });
});
