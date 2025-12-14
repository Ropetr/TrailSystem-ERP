// =============================================
// PLANAC ERP - Testes do Serviço de Pedidos de Compra
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface ItemPedido {
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
}

interface PedidoCompra {
  id: string;
  numero: string;
  fornecedor_id: string;
  status: 'rascunho' | 'enviado' | 'confirmado' | 'em_transito' | 'entregue_parcial' | 'entregue' | 'cancelado';
  itens: ItemPedido[];
  valor_total: number;
}

const pedidosCompraService = {
  listar: async (filtros?: { status?: string; fornecedor_id?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.status) params.append('status', filtros.status);
    if (filtros?.fornecedor_id) params.append('fornecedor_id', filtros.fornecedor_id);
    
    const response = await fetch(`/api/compras/pedidos?${params}`);
    return response.json();
  },
  
  criar: async (dados: { fornecedor_id: string; itens: ItemPedido[]; observacao?: string }) => {
    const response = await fetch('/api/compras/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  enviar: async (pedidoId: string) => {
    const response = await fetch(`/api/compras/pedidos/${pedidoId}/enviar`, {
      method: 'POST',
    });
    return response.json();
  },
  
  cancelar: async (pedidoId: string, motivo: string) => {
    const response = await fetch(`/api/compras/pedidos/${pedidoId}/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    });
    return response.json();
  },
  
  calcularTotal: (itens: ItemPedido[]) => {
    return itens.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0);
  },
  
  validarPedido: (pedido: { fornecedor_id: string; itens: ItemPedido[] }) => {
    const erros: string[] = [];
    
    if (!pedido.fornecedor_id) {
      erros.push('Fornecedor é obrigatório');
    }
    
    if (!pedido.itens || pedido.itens.length === 0) {
      erros.push('Adicione pelo menos um item');
    }
    
    pedido.itens?.forEach((item, index) => {
      if (item.quantidade <= 0) {
        erros.push(`Item ${index + 1}: quantidade deve ser maior que zero`);
      }
      if (item.valor_unitario <= 0) {
        erros.push(`Item ${index + 1}: valor deve ser maior que zero`);
      }
    });
    
    return { valid: erros.length === 0, errors: erros };
  },
  
  podeEnviar: (pedido: PedidoCompra) => {
    return pedido.status === 'rascunho' && pedido.itens.length > 0;
  },
  
  podeCancelar: (pedido: PedidoCompra) => {
    return ['rascunho', 'enviado'].includes(pedido.status);
  },
  
  podeReceber: (pedido: PedidoCompra) => {
    return ['confirmado', 'em_transito'].includes(pedido.status);
  },
  
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      rascunho: 'Rascunho',
      enviado: 'Enviado',
      confirmado: 'Confirmado',
      em_transito: 'Em Trânsito',
      entregue_parcial: 'Entrega Parcial',
      entregue: 'Entregue',
      cancelado: 'Cancelado',
    };
    return labels[status] || status;
  },
  
  gerarNumero: (sequencial: number, ano: number = new Date().getFullYear()) => {
    return `PC${ano}${sequencial.toString().padStart(6, '0')}`;
  },
};

describe('Serviço de Pedidos de Compra', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('listar()', () => {
    it('deve listar pedidos', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await pedidosCompraService.listar();
      
      expect(mockFetch).toHaveBeenCalledWith('/api/compras/pedidos?');
    });

    it('deve filtrar por status', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await pedidosCompraService.listar({ status: 'enviado' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/compras/pedidos?status=enviado');
    });
  });

  describe('criar()', () => {
    it('deve criar pedido', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { id: '1' } }),
      });

      await pedidosCompraService.criar({
        fornecedor_id: 'forn-1',
        itens: [{ produto_id: 'prod-1', quantidade: 10, valor_unitario: 50 }],
      });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/compras/pedidos', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  describe('calcularTotal()', () => {
    it('deve calcular total do pedido', () => {
      const itens: ItemPedido[] = [
        { produto_id: '1', quantidade: 10, valor_unitario: 50 },
        { produto_id: '2', quantidade: 5, valor_unitario: 100 },
      ];
      
      // 10*50 + 5*100 = 500 + 500 = 1000
      expect(pedidosCompraService.calcularTotal(itens)).toBe(1000);
    });

    it('deve retornar 0 para lista vazia', () => {
      expect(pedidosCompraService.calcularTotal([])).toBe(0);
    });
  });

  describe('validarPedido()', () => {
    it('deve validar pedido correto', () => {
      const result = pedidosCompraService.validarPedido({
        fornecedor_id: 'forn-1',
        itens: [{ produto_id: 'prod-1', quantidade: 10, valor_unitario: 50 }],
      });
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar pedido sem fornecedor', () => {
      const result = pedidosCompraService.validarPedido({
        fornecedor_id: '',
        itens: [{ produto_id: 'prod-1', quantidade: 10, valor_unitario: 50 }],
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Fornecedor é obrigatório');
    });

    it('deve rejeitar pedido sem itens', () => {
      const result = pedidosCompraService.validarPedido({
        fornecedor_id: 'forn-1',
        itens: [],
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Adicione pelo menos um item');
    });

    it('deve rejeitar item com quantidade zero', () => {
      const result = pedidosCompraService.validarPedido({
        fornecedor_id: 'forn-1',
        itens: [{ produto_id: 'prod-1', quantidade: 0, valor_unitario: 50 }],
      });
      
      expect(result.valid).toBe(false);
    });
  });

  describe('podeEnviar()', () => {
    it('deve permitir enviar rascunho com itens', () => {
      const pedido: PedidoCompra = {
        id: '1', numero: 'PC001', fornecedor_id: 'f1', status: 'rascunho',
        itens: [{ produto_id: 'p1', quantidade: 1, valor_unitario: 10 }], valor_total: 10,
      };
      expect(pedidosCompraService.podeEnviar(pedido)).toBe(true);
    });

    it('não deve permitir enviar pedido já enviado', () => {
      const pedido: PedidoCompra = {
        id: '1', numero: 'PC001', fornecedor_id: 'f1', status: 'enviado',
        itens: [{ produto_id: 'p1', quantidade: 1, valor_unitario: 10 }], valor_total: 10,
      };
      expect(pedidosCompraService.podeEnviar(pedido)).toBe(false);
    });
  });

  describe('podeCancelar()', () => {
    it('deve permitir cancelar rascunho ou enviado', () => {
      expect(pedidosCompraService.podeCancelar({ status: 'rascunho' } as PedidoCompra)).toBe(true);
      expect(pedidosCompraService.podeCancelar({ status: 'enviado' } as PedidoCompra)).toBe(true);
    });

    it('não deve permitir cancelar pedido confirmado ou entregue', () => {
      expect(pedidosCompraService.podeCancelar({ status: 'confirmado' } as PedidoCompra)).toBe(false);
      expect(pedidosCompraService.podeCancelar({ status: 'entregue' } as PedidoCompra)).toBe(false);
    });
  });

  describe('podeReceber()', () => {
    it('deve permitir receber pedido confirmado ou em trânsito', () => {
      expect(pedidosCompraService.podeReceber({ status: 'confirmado' } as PedidoCompra)).toBe(true);
      expect(pedidosCompraService.podeReceber({ status: 'em_transito' } as PedidoCompra)).toBe(true);
    });

    it('não deve permitir receber pedido em rascunho', () => {
      expect(pedidosCompraService.podeReceber({ status: 'rascunho' } as PedidoCompra)).toBe(false);
    });
  });

  describe('gerarNumero()', () => {
    it('deve gerar número no formato correto', () => {
      expect(pedidosCompraService.gerarNumero(1, 2025)).toBe('PC2025000001');
      expect(pedidosCompraService.gerarNumero(123, 2025)).toBe('PC2025000123');
    });
  });
});
