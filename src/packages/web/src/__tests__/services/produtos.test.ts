// =============================================
// PLANAC ERP - Testes do Serviço de Produtos
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const produtosService = {
  listar: async (filtros?: { categoria?: string; ativo?: boolean; estoqueBaixo?: boolean }) => {
    const params = new URLSearchParams();
    if (filtros?.categoria) params.append('categoria', filtros.categoria);
    if (filtros?.ativo !== undefined) params.append('ativo', String(filtros.ativo));
    if (filtros?.estoqueBaixo) params.append('estoque_baixo', 'true');
    
    const response = await fetch(`/api/produtos?${params}`);
    return response.json();
  },
  
  buscarPorCodigo: async (codigo: string) => {
    const response = await fetch(`/api/produtos/codigo/${codigo}`);
    return response.json();
  },
  
  buscarPorCodigoBarras: async (gtin: string) => {
    const response = await fetch(`/api/integracoes/cosmos/${gtin}`);
    return response.json();
  },
  
  criar: async (dados: any) => {
    const response = await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  atualizarEstoque: async (id: string, quantidade: number, tipo: 'entrada' | 'saida') => {
    const response = await fetch(`/api/produtos/${id}/estoque`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantidade, tipo }),
    });
    return response.json();
  },
  
  calcularMargem: (precoCusto: number, precoVenda: number) => {
    if (precoCusto <= 0) return 0;
    return ((precoVenda - precoCusto) / precoCusto) * 100;
  },
  
  calcularPrecoVenda: (precoCusto: number, margemDesejada: number) => {
    return precoCusto * (1 + margemDesejada / 100);
  },
};

describe('Serviço de Produtos', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('listar()', () => {
    it('deve listar todos os produtos', async () => {
      const mockProdutos = [
        { id: '1', descricao: 'Placa de Gesso', estoque_atual: 100 },
        { id: '2', descricao: 'Perfil Montante', estoque_atual: 500 },
      ];
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockProdutos }),
      });

      const result = await produtosService.listar();
      
      expect(result.data).toHaveLength(2);
    });

    it('deve filtrar por estoque baixo', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await produtosService.listar({ estoqueBaixo: true });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/produtos?estoque_baixo=true');
    });

    it('deve filtrar por categoria', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await produtosService.listar({ categoria: 'drywall' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/produtos?categoria=drywall');
    });
  });

  describe('buscarPorCodigoBarras()', () => {
    it('deve buscar produto no Cosmos pelo GTIN', async () => {
      const mockCosmosData = {
        gtin: '7891234567890',
        description: 'Placa de Gesso Standard',
        ncm: { code: '68091100' },
        brand: { name: 'PLACO' },
      };
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockCosmosData }),
      });

      const result = await produtosService.buscarPorCodigoBarras('7891234567890');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/integracoes/cosmos/7891234567890');
      expect(result.data.ncm.code).toBe('68091100');
    });
  });

  describe('calcularMargem()', () => {
    it('deve calcular margem corretamente', () => {
      const margem = produtosService.calcularMargem(100, 150);
      expect(margem).toBe(50);
    });

    it('deve retornar 0 se custo for zero', () => {
      const margem = produtosService.calcularMargem(0, 150);
      expect(margem).toBe(0);
    });

    it('deve calcular margem negativa', () => {
      const margem = produtosService.calcularMargem(100, 80);
      expect(margem).toBe(-20);
    });
  });

  describe('calcularPrecoVenda()', () => {
    it('deve calcular preço de venda com margem', () => {
      const preco = produtosService.calcularPrecoVenda(100, 50);
      expect(preco).toBe(150);
    });

    it('deve calcular preço com margem de 100%', () => {
      const preco = produtosService.calcularPrecoVenda(100, 100);
      expect(preco).toBe(200);
    });
  });

  describe('atualizarEstoque()', () => {
    it('deve registrar entrada de estoque', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, novoEstoque: 150 }),
      });

      const result = await produtosService.atualizarEstoque('123', 50, 'entrada');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/produtos/123/estoque', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ quantidade: 50, tipo: 'entrada' }),
      }));
    });

    it('deve registrar saída de estoque', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, novoEstoque: 50 }),
      });

      const result = await produtosService.atualizarEstoque('123', 50, 'saida');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/produtos/123/estoque', expect.objectContaining({
        body: JSON.stringify({ quantidade: 50, tipo: 'saida' }),
      }));
    });
  });
});
