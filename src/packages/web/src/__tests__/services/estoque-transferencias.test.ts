// =============================================
// PLANAC ERP - Testes do Serviço de Transferências
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface ItemTransferencia {
  produto_id: string;
  quantidade: number;
}

const transferenciasService = {
  listar: async (filtros?: { status?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.status) params.append('status', filtros.status);
    
    const response = await fetch(`/api/estoque/transferencias?${params}`);
    return response.json();
  },
  
  criar: async (dados: { 
    filial_origem_id: string; 
    filial_destino_id: string; 
    itens: ItemTransferencia[];
    observacao?: string;
  }) => {
    const response = await fetch('/api/estoque/transferencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  enviar: async (id: string) => {
    const response = await fetch(`/api/estoque/transferencias/${id}/enviar`, {
      method: 'POST',
    });
    return response.json();
  },
  
  receber: async (id: string, itensRecebidos?: { produto_id: string; quantidade_recebida: number }[]) => {
    const response = await fetch(`/api/estoque/transferencias/${id}/receber`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens: itensRecebidos }),
    });
    return response.json();
  },
  
  cancelar: async (id: string, motivo: string) => {
    const response = await fetch(`/api/estoque/transferencias/${id}/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    });
    return response.json();
  },
  
  validarTransferencia: (filialOrigem: string, filialDestino: string, itens: ItemTransferencia[]) => {
    if (filialOrigem === filialDestino) {
      return { valid: false, error: 'Origem e destino devem ser diferentes' };
    }
    
    if (itens.length === 0) {
      return { valid: false, error: 'Adicione pelo menos um item' };
    }
    
    const itemInvalido = itens.find(i => i.quantidade <= 0);
    if (itemInvalido) {
      return { valid: false, error: 'Quantidade deve ser maior que zero' };
    }
    
    return { valid: true };
  },
  
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      rascunho: 'Rascunho',
      enviada: 'Enviada',
      em_transito: 'Em Trânsito',
      recebida: 'Recebida',
      cancelada: 'Cancelada',
    };
    return labels[status] || status;
  },
  
  podeEnviar: (status: string) => status === 'rascunho',
  podeReceber: (status: string) => ['enviada', 'em_transito'].includes(status),
  podeCancelar: (status: string) => ['rascunho', 'enviada'].includes(status),
};

describe('Serviço de Transferências de Estoque', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('listar()', () => {
    it('deve listar todas as transferências', async () => {
      const mockTransferencias = [
        { id: '1', numero: 'TRF-001', status: 'rascunho' },
        { id: '2', numero: 'TRF-002', status: 'enviada' },
      ];
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockTransferencias }),
      });

      const result = await transferenciasService.listar();
      
      expect(result.data).toHaveLength(2);
    });

    it('deve filtrar por status', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await transferenciasService.listar({ status: 'enviada' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/estoque/transferencias?status=enviada');
    });
  });

  describe('criar()', () => {
    it('deve criar transferência com itens', async () => {
      const dados = {
        filial_origem_id: '1',
        filial_destino_id: '2',
        itens: [
          { produto_id: 'P1', quantidade: 100 },
          { produto_id: 'P2', quantidade: 50 },
        ],
      };
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { id: '1', numero: 'TRF-001' } }),
      });

      const result = await transferenciasService.criar(dados);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/estoque/transferencias', expect.objectContaining({
        method: 'POST',
      }));
      expect(result.success).toBe(true);
    });
  });

  describe('enviar()', () => {
    it('deve enviar transferência', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, status: 'enviada' }),
      });

      await transferenciasService.enviar('123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/estoque/transferencias/123/enviar', { method: 'POST' });
    });
  });

  describe('receber()', () => {
    it('deve receber transferência', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, status: 'recebida' }),
      });

      await transferenciasService.receber('123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/estoque/transferencias/123/receber', expect.any(Object));
    });

    it('deve receber com divergência de quantidade', async () => {
      const itensRecebidos = [
        { produto_id: 'P1', quantidade_recebida: 95 }, // Faltaram 5
      ];
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, divergencias: [{ produto_id: 'P1', diferenca: -5 }] }),
      });

      await transferenciasService.receber('123', itensRecebidos);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/estoque/transferencias/123/receber', expect.objectContaining({
        body: JSON.stringify({ itens: itensRecebidos }),
      }));
    });
  });

  describe('cancelar()', () => {
    it('deve cancelar transferência com motivo', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await transferenciasService.cancelar('123', 'Erro no pedido');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/estoque/transferencias/123/cancelar', expect.objectContaining({
        body: JSON.stringify({ motivo: 'Erro no pedido' }),
      }));
    });
  });

  describe('validarTransferencia()', () => {
    it('deve rejeitar origem igual ao destino', () => {
      const result = transferenciasService.validarTransferencia('1', '1', [{ produto_id: 'P1', quantidade: 10 }]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('diferentes');
    });

    it('deve rejeitar transferência sem itens', () => {
      const result = transferenciasService.validarTransferencia('1', '2', []);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('item');
    });

    it('deve rejeitar quantidade inválida', () => {
      const result = transferenciasService.validarTransferencia('1', '2', [{ produto_id: 'P1', quantidade: 0 }]);
      expect(result.valid).toBe(false);
    });

    it('deve aceitar transferência válida', () => {
      const result = transferenciasService.validarTransferencia('1', '2', [{ produto_id: 'P1', quantidade: 10 }]);
      expect(result.valid).toBe(true);
    });
  });

  describe('permissões de status', () => {
    it('deve permitir enviar apenas rascunho', () => {
      expect(transferenciasService.podeEnviar('rascunho')).toBe(true);
      expect(transferenciasService.podeEnviar('enviada')).toBe(false);
    });

    it('deve permitir receber quando enviada ou em trânsito', () => {
      expect(transferenciasService.podeReceber('enviada')).toBe(true);
      expect(transferenciasService.podeReceber('em_transito')).toBe(true);
      expect(transferenciasService.podeReceber('recebida')).toBe(false);
    });

    it('deve permitir cancelar rascunho ou enviada', () => {
      expect(transferenciasService.podeCancelar('rascunho')).toBe(true);
      expect(transferenciasService.podeCancelar('enviada')).toBe(true);
      expect(transferenciasService.podeCancelar('recebida')).toBe(false);
    });
  });
});
