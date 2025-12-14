// =============================================
// PLANAC ERP - Testes do Serviço de Orçamentos
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface ItemOrcamento {
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  desconto_percentual?: number;
}

const orcamentosService = {
  listar: async (filtros?: { status?: string; cliente_id?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.status) params.append('status', filtros.status);
    if (filtros?.cliente_id) params.append('cliente_id', filtros.cliente_id);
    
    const response = await fetch(`/api/orcamentos?${params}`);
    return response.json();
  },
  
  mesclar: async (ids: string[]) => {
    const response = await fetch('/api/orcamentos/mesclar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orcamento_ids: ids }),
    });
    return response.json();
  },
  
  desmembrar: async (orcamentoId: string, itensIds: string[]) => {
    const response = await fetch(`/api/orcamentos/${orcamentoId}/desmembrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens_ids: itensIds }),
    });
    return response.json();
  },
  
  converter: async (orcamentoId: string) => {
    const response = await fetch(`/api/orcamentos/${orcamentoId}/converter`, {
      method: 'POST',
    });
    return response.json();
  },
  
  calcularTotalItem: (item: ItemOrcamento) => {
    const subtotal = item.quantidade * item.preco_unitario;
    const desconto = subtotal * ((item.desconto_percentual || 0) / 100);
    return subtotal - desconto;
  },
  
  calcularTotalOrcamento: (itens: ItemOrcamento[]) => {
    return itens.reduce((total, item) => total + orcamentosService.calcularTotalItem(item), 0);
  },
  
  resolverPrecoMesclagem: (precos: number[], regra: 'maior' | 'menor' | 'media') => {
    if (precos.length === 0) return 0;
    
    switch (regra) {
      case 'maior':
        return Math.max(...precos);
      case 'menor':
        return Math.min(...precos);
      case 'media':
        return precos.reduce((a, b) => a + b, 0) / precos.length;
    }
  },
};

describe('Serviço de Orçamentos', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('listar()', () => {
    it('deve listar orçamentos', async () => {
      const mockOrcamentos = [
        { id: '1', numero: 'ORC-001', status: 'pendente', total: 1500 },
        { id: '2', numero: 'ORC-002', status: 'aprovado', total: 2500 },
      ];
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockOrcamentos }),
      });

      const result = await orcamentosService.listar();
      
      expect(result.data).toHaveLength(2);
    });

    it('deve filtrar por status', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await orcamentosService.listar({ status: 'aprovado' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/orcamentos?status=aprovado');
    });

    it('deve filtrar por cliente', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await orcamentosService.listar({ cliente_id: '123' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/orcamentos?cliente_id=123');
    });
  });

  describe('mesclar()', () => {
    it('deve mesclar múltiplos orçamentos', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ 
          success: true, 
          data: { id: '99', numero: 'ORC-099', mesclado_de: ['1', '2', '3'] } 
        }),
      });

      const result = await orcamentosService.mesclar(['1', '2', '3']);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/orcamentos/mesclar', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ orcamento_ids: ['1', '2', '3'] }),
      }));
      expect(result.data.mesclado_de).toHaveLength(3);
    });
  });

  describe('desmembrar()', () => {
    it('deve desmembrar itens para novo orçamento', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ 
          success: true, 
          data: { 
            orcamento_original: { id: '1' },
            novo_orcamento: { id: '2', numero: 'ORC-002' } 
          } 
        }),
      });

      const result = await orcamentosService.desmembrar('1', ['item1', 'item2']);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/orcamentos/1/desmembrar', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ itens_ids: ['item1', 'item2'] }),
      }));
      expect(result.data.novo_orcamento).toBeDefined();
    });
  });

  describe('converter()', () => {
    it('deve converter orçamento em pedido', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ 
          success: true, 
          data: { pedido_id: 'PED-001' } 
        }),
      });

      const result = await orcamentosService.converter('123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/orcamentos/123/converter', { method: 'POST' });
      expect(result.data.pedido_id).toBe('PED-001');
    });
  });

  describe('calcularTotalItem()', () => {
    it('deve calcular total do item sem desconto', () => {
      const item = { produto_id: '1', quantidade: 10, preco_unitario: 45.90 };
      const total = orcamentosService.calcularTotalItem(item);
      expect(total).toBe(459);
    });

    it('deve calcular total do item com desconto', () => {
      const item = { produto_id: '1', quantidade: 10, preco_unitario: 100, desconto_percentual: 10 };
      const total = orcamentosService.calcularTotalItem(item);
      expect(total).toBe(900); // 1000 - 10% = 900
    });
  });

  describe('calcularTotalOrcamento()', () => {
    it('deve calcular total do orçamento', () => {
      const itens = [
        { produto_id: '1', quantidade: 10, preco_unitario: 100 },
        { produto_id: '2', quantidade: 5, preco_unitario: 50 },
      ];
      const total = orcamentosService.calcularTotalOrcamento(itens);
      expect(total).toBe(1250); // 1000 + 250
    });

    it('deve retornar 0 para orçamento vazio', () => {
      const total = orcamentosService.calcularTotalOrcamento([]);
      expect(total).toBe(0);
    });
  });

  describe('resolverPrecoMesclagem()', () => {
    it('deve retornar maior preço', () => {
      const preco = orcamentosService.resolverPrecoMesclagem([100, 150, 120], 'maior');
      expect(preco).toBe(150);
    });

    it('deve retornar menor preço', () => {
      const preco = orcamentosService.resolverPrecoMesclagem([100, 150, 120], 'menor');
      expect(preco).toBe(100);
    });

    it('deve retornar média dos preços', () => {
      const preco = orcamentosService.resolverPrecoMesclagem([100, 150, 110], 'media');
      expect(preco).toBe(120);
    });

    it('deve retornar 0 para array vazio', () => {
      const preco = orcamentosService.resolverPrecoMesclagem([], 'maior');
      expect(preco).toBe(0);
    });
  });
});
