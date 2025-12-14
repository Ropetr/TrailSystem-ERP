// =============================================
// PLANAC ERP - Testes do Serviço de Movimentações
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface Movimentacao {
  tipo: 'entrada' | 'saida' | 'transferencia' | 'ajuste' | 'devolucao';
  produto_id: string;
  quantidade: number;
  motivo?: string;
  documento_tipo?: string;
  documento_numero?: string;
}

const movimentacoesService = {
  listar: async (filtros?: { tipo?: string; data_inicio?: string; data_fim?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio);
    if (filtros?.data_fim) params.append('data_fim', filtros.data_fim);
    
    const response = await fetch(`/api/estoque/movimentacoes?${params}`);
    return response.json();
  },
  
  registrar: async (dados: Movimentacao) => {
    const response = await fetch('/api/estoque/movimentacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  calcularNovoEstoque: (estoqueAtual: number, quantidade: number, tipo: string) => {
    switch (tipo) {
      case 'entrada':
      case 'devolucao':
        return estoqueAtual + quantidade;
      case 'saida':
        return estoqueAtual - quantidade;
      case 'ajuste':
        return quantidade; // Ajuste define o valor absoluto
      default:
        return estoqueAtual;
    }
  },
  
  validarMovimentacao: (estoqueAtual: number, quantidade: number, tipo: string) => {
    if (quantidade <= 0) {
      return { valid: false, error: 'Quantidade deve ser maior que zero' };
    }
    
    if (tipo === 'saida' && quantidade > estoqueAtual) {
      return { valid: false, error: 'Quantidade maior que estoque disponível' };
    }
    
    return { valid: true };
  },
  
  getTipoLabel: (tipo: string) => {
    const labels: Record<string, string> = {
      entrada: 'Entrada',
      saida: 'Saída',
      transferencia: 'Transferência',
      ajuste: 'Ajuste',
      devolucao: 'Devolução',
    };
    return labels[tipo] || tipo;
  },
};

describe('Serviço de Movimentações de Estoque', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('listar()', () => {
    it('deve listar todas as movimentações', async () => {
      const mockMovimentacoes = [
        { id: '1', tipo: 'entrada', quantidade: 100 },
        { id: '2', tipo: 'saida', quantidade: 50 },
      ];
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockMovimentacoes }),
      });

      const result = await movimentacoesService.listar();
      
      expect(result.data).toHaveLength(2);
    });

    it('deve filtrar por tipo', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await movimentacoesService.listar({ tipo: 'entrada' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/estoque/movimentacoes?tipo=entrada');
    });

    it('deve filtrar por período', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await movimentacoesService.listar({ 
        data_inicio: '2025-01-01', 
        data_fim: '2025-01-31' 
      });
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/estoque/movimentacoes?data_inicio=2025-01-01&data_fim=2025-01-31'
      );
    });
  });

  describe('registrar()', () => {
    it('deve registrar entrada de estoque', async () => {
      const movimentacao = {
        tipo: 'entrada' as const,
        produto_id: '123',
        quantidade: 100,
        motivo: 'Compra',
      };
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, novoEstoque: 200 }),
      });

      const result = await movimentacoesService.registrar(movimentacao);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/estoque/movimentacoes', expect.objectContaining({
        method: 'POST',
      }));
      expect(result.success).toBe(true);
    });

    it('deve registrar saída de estoque', async () => {
      const movimentacao = {
        tipo: 'saida' as const,
        produto_id: '123',
        quantidade: 50,
        documento_tipo: 'NF-e',
        documento_numero: '12345',
      };
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, novoEstoque: 150 }),
      });

      await movimentacoesService.registrar(movimentacao);
      
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('calcularNovoEstoque()', () => {
    it('deve calcular entrada corretamente', () => {
      expect(movimentacoesService.calcularNovoEstoque(100, 50, 'entrada')).toBe(150);
    });

    it('deve calcular saída corretamente', () => {
      expect(movimentacoesService.calcularNovoEstoque(100, 30, 'saida')).toBe(70);
    });

    it('deve calcular devolução como entrada', () => {
      expect(movimentacoesService.calcularNovoEstoque(100, 20, 'devolucao')).toBe(120);
    });

    it('deve calcular ajuste como valor absoluto', () => {
      expect(movimentacoesService.calcularNovoEstoque(100, 80, 'ajuste')).toBe(80);
    });
  });

  describe('validarMovimentacao()', () => {
    it('deve rejeitar quantidade zero ou negativa', () => {
      expect(movimentacoesService.validarMovimentacao(100, 0, 'entrada').valid).toBe(false);
      expect(movimentacoesService.validarMovimentacao(100, -10, 'entrada').valid).toBe(false);
    });

    it('deve rejeitar saída maior que estoque', () => {
      const result = movimentacoesService.validarMovimentacao(50, 100, 'saida');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('maior que estoque');
    });

    it('deve aceitar movimentação válida', () => {
      expect(movimentacoesService.validarMovimentacao(100, 50, 'saida').valid).toBe(true);
      expect(movimentacoesService.validarMovimentacao(100, 200, 'entrada').valid).toBe(true);
    });
  });

  describe('getTipoLabel()', () => {
    it('deve retornar labels corretos', () => {
      expect(movimentacoesService.getTipoLabel('entrada')).toBe('Entrada');
      expect(movimentacoesService.getTipoLabel('saida')).toBe('Saída');
      expect(movimentacoesService.getTipoLabel('ajuste')).toBe('Ajuste');
    });
  });
});
