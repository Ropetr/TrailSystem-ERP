// =============================================
// PLANAC ERP - Testes do Serviço de Inventário
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface ItemInventario {
  id: string;
  produto_id: string;
  estoque_sistema: number;
  estoque_contado: number | null;
}

const inventarioService = {
  listar: async (filtros?: { status?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.status) params.append('status', filtros.status);
    
    const response = await fetch(`/api/estoque/inventarios?${params}`);
    return response.json();
  },
  
  criar: async (dados: { tipo: string; filial_id: string; observacao?: string }) => {
    const response = await fetch('/api/estoque/inventarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  registrarContagem: async (inventarioId: string, itemId: string, quantidade: number) => {
    const response = await fetch(`/api/estoque/inventarios/${inventarioId}/itens/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estoque_contado: quantidade }),
    });
    return response.json();
  },
  
  finalizar: async (inventarioId: string) => {
    const response = await fetch(`/api/estoque/inventarios/${inventarioId}/finalizar`, {
      method: 'POST',
    });
    return response.json();
  },
  
  calcularDiferenca: (estoqueSistema: number, estoqueContado: number) => {
    return estoqueContado - estoqueSistema;
  },
  
  calcularProgresso: (itensContados: number, totalItens: number) => {
    if (totalItens === 0) return 0;
    return Math.round((itensContados / totalItens) * 100);
  },
  
  identificarDivergencias: (itens: ItemInventario[]) => {
    return itens.filter(item => 
      item.estoque_contado !== null && 
      item.estoque_contado !== item.estoque_sistema
    );
  },
  
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      aberto: 'Aberto',
      em_contagem: 'Em Contagem',
      em_conferencia: 'Em Conferência',
      finalizado: 'Finalizado',
      cancelado: 'Cancelado',
    };
    return labels[status] || status;
  },
  
  getTipoLabel: (tipo: string) => {
    const labels: Record<string, string> = {
      geral: 'Geral',
      parcial: 'Parcial',
      rotativo: 'Rotativo',
    };
    return labels[tipo] || tipo;
  },
};

describe('Serviço de Inventário', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('listar()', () => {
    it('deve listar todos os inventários', async () => {
      const mockInventarios = [
        { id: '1', numero: 'INV-001', status: 'aberto' },
        { id: '2', numero: 'INV-002', status: 'finalizado' },
      ];
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockInventarios }),
      });

      const result = await inventarioService.listar();
      
      expect(result.data).toHaveLength(2);
    });

    it('deve filtrar por status', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await inventarioService.listar({ status: 'em_contagem' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/estoque/inventarios?status=em_contagem');
    });
  });

  describe('criar()', () => {
    it('deve criar inventário geral', async () => {
      const dados = {
        tipo: 'geral',
        filial_id: '1',
        observacao: 'Inventário anual',
      };
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { id: '1', numero: 'INV-001', total_itens: 500 } }),
      });

      const result = await inventarioService.criar(dados);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/estoque/inventarios', expect.objectContaining({
        method: 'POST',
      }));
      expect(result.success).toBe(true);
    });
  });

  describe('registrarContagem()', () => {
    it('deve registrar contagem de item', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, diferenca: -5 }),
      });

      await inventarioService.registrarContagem('INV-001', 'ITEM-001', 95);
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/estoque/inventarios/INV-001/itens/ITEM-001',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ estoque_contado: 95 }),
        })
      );
    });
  });

  describe('finalizar()', () => {
    it('deve finalizar inventário e ajustar estoque', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, ajustes_realizados: 15 }),
      });

      const result = await inventarioService.finalizar('INV-001');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/estoque/inventarios/INV-001/finalizar', { method: 'POST' });
      expect(result.ajustes_realizados).toBe(15);
    });
  });

  describe('calcularDiferenca()', () => {
    it('deve calcular diferença positiva (sobra)', () => {
      expect(inventarioService.calcularDiferenca(100, 105)).toBe(5);
    });

    it('deve calcular diferença negativa (falta)', () => {
      expect(inventarioService.calcularDiferenca(100, 95)).toBe(-5);
    });

    it('deve calcular diferença zero', () => {
      expect(inventarioService.calcularDiferenca(100, 100)).toBe(0);
    });
  });

  describe('calcularProgresso()', () => {
    it('deve calcular progresso corretamente', () => {
      expect(inventarioService.calcularProgresso(50, 100)).toBe(50);
      expect(inventarioService.calcularProgresso(75, 100)).toBe(75);
      expect(inventarioService.calcularProgresso(100, 100)).toBe(100);
    });

    it('deve retornar 0 para inventário sem itens', () => {
      expect(inventarioService.calcularProgresso(0, 0)).toBe(0);
    });

    it('deve arredondar o progresso', () => {
      expect(inventarioService.calcularProgresso(33, 100)).toBe(33);
      expect(inventarioService.calcularProgresso(1, 3)).toBe(33);
    });
  });

  describe('identificarDivergencias()', () => {
    it('deve identificar itens com divergência', () => {
      const itens: ItemInventario[] = [
        { id: '1', produto_id: 'P1', estoque_sistema: 100, estoque_contado: 100 },
        { id: '2', produto_id: 'P2', estoque_sistema: 50, estoque_contado: 45 },
        { id: '3', produto_id: 'P3', estoque_sistema: 30, estoque_contado: 35 },
        { id: '4', produto_id: 'P4', estoque_sistema: 20, estoque_contado: null },
      ];
      
      const divergencias = inventarioService.identificarDivergencias(itens);
      
      expect(divergencias).toHaveLength(2);
      expect(divergencias[0].produto_id).toBe('P2');
      expect(divergencias[1].produto_id).toBe('P3');
    });

    it('deve retornar vazio quando não há divergências', () => {
      const itens: ItemInventario[] = [
        { id: '1', produto_id: 'P1', estoque_sistema: 100, estoque_contado: 100 },
        { id: '2', produto_id: 'P2', estoque_sistema: 50, estoque_contado: 50 },
      ];
      
      const divergencias = inventarioService.identificarDivergencias(itens);
      
      expect(divergencias).toHaveLength(0);
    });
  });

  describe('labels', () => {
    it('deve retornar labels de status corretos', () => {
      expect(inventarioService.getStatusLabel('aberto')).toBe('Aberto');
      expect(inventarioService.getStatusLabel('em_contagem')).toBe('Em Contagem');
      expect(inventarioService.getStatusLabel('finalizado')).toBe('Finalizado');
    });

    it('deve retornar labels de tipo corretos', () => {
      expect(inventarioService.getTipoLabel('geral')).toBe('Geral');
      expect(inventarioService.getTipoLabel('parcial')).toBe('Parcial');
      expect(inventarioService.getTipoLabel('rotativo')).toBe('Rotativo');
    });
  });
});
