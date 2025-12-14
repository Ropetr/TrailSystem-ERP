// =============================================
// PLANAC ERP - Testes do Serviço de Contas a Receber
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface ContaReceber {
  id: string;
  valor_original: number;
  valor_recebido: number;
  valor_aberto: number;
  data_vencimento: string;
  status: 'aberta' | 'parcial' | 'recebida' | 'vencida' | 'cancelada';
  boleto_id?: string;
}

const contasReceberService = {
  listar: async (filtros?: { status?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.status) params.append('status', filtros.status);
    
    const response = await fetch(`/api/financeiro/contas-receber?${params}`);
    return response.json();
  },
  
  registrarRecebimento: async (contaId: string, dados: {
    valor: number;
    data_recebimento: string;
    forma_pagamento: string;
  }) => {
    const response = await fetch(`/api/financeiro/contas-receber/${contaId}/receber`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  emitirBoleto: async (contaId: string) => {
    const response = await fetch(`/api/financeiro/contas-receber/${contaId}/boleto`, {
      method: 'POST',
    });
    return response.json();
  },
  
  enviarCobranca: async (contaId: string, canais: string[]) => {
    const response = await fetch(`/api/financeiro/contas-receber/${contaId}/enviar-cobranca`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canais }),
    });
    return response.json();
  },
  
  calcularTaxaInadimplencia: (contas: ContaReceber[]) => {
    const total = contas.length;
    if (total === 0) return 0;
    
    const vencidas = contas.filter(c => c.status === 'vencida').length;
    return (vencidas / total) * 100;
  },
  
  calcularPrazoMedioRecebimento: (contas: ContaReceber[]) => {
    const recebidas = contas.filter(c => c.status === 'recebida');
    if (recebidas.length === 0) return 0;
    
    // Simplificado: retorna média de dias entre emissão e recebimento
    return 15; // placeholder
  },
  
  gerarLinhaDigitavelBoleto: (dados: {
    banco: string;
    valor: number;
    vencimento: string;
    nossoNumero: string;
  }) => {
    // Simplificado para testes
    return `${dados.banco}.00000 00000.${dados.nossoNumero} 00000.000000 0 00000000000000`;
  },
  
  calcularValorComDesconto: (valor: number, desconto: number, tipo: 'percentual' | 'fixo') => {
    if (tipo === 'percentual') {
      return valor * (1 - desconto / 100);
    }
    return Math.max(0, valor - desconto);
  },
  
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      aberta: 'Aberta',
      parcial: 'Parcial',
      recebida: 'Recebida',
      vencida: 'Vencida',
      cancelada: 'Cancelada',
    };
    return labels[status] || status;
  },
  
  ordenarPorPrioridade: (contas: ContaReceber[]) => {
    const prioridade = { vencida: 1, aberta: 2, parcial: 3, recebida: 4, cancelada: 5 };
    return [...contas].sort((a, b) => prioridade[a.status] - prioridade[b.status]);
  },
};

describe('Serviço de Contas a Receber', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('listar()', () => {
    it('deve listar todas as contas', async () => {
      const mockContas = [
        { id: '1', valor_original: 1000, status: 'aberta' },
        { id: '2', valor_original: 500, status: 'recebida' },
      ];
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockContas }),
      });

      const result = await contasReceberService.listar();
      
      expect(result.data).toHaveLength(2);
    });
  });

  describe('registrarRecebimento()', () => {
    it('deve registrar recebimento', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await contasReceberService.registrarRecebimento('123', {
        valor: 1000,
        data_recebimento: '2025-01-15',
        forma_pagamento: 'pix',
      });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/financeiro/contas-receber/123/receber', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  describe('emitirBoleto()', () => {
    it('deve emitir boleto para conta', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ 
          success: true, 
          data: { boleto_id: 'BOL-001', linha_digitavel: '...' } 
        }),
      });

      const result = await contasReceberService.emitirBoleto('123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/financeiro/contas-receber/123/boleto', { method: 'POST' });
      expect(result.success).toBe(true);
    });
  });

  describe('enviarCobranca()', () => {
    it('deve enviar cobrança por múltiplos canais', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await contasReceberService.enviarCobranca('123', ['email', 'whatsapp']);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/financeiro/contas-receber/123/enviar-cobranca', expect.objectContaining({
        body: JSON.stringify({ canais: ['email', 'whatsapp'] }),
      }));
    });
  });

  describe('calcularTaxaInadimplencia()', () => {
    it('deve calcular taxa de inadimplência', () => {
      const contas: ContaReceber[] = [
        { id: '1', valor_original: 100, valor_recebido: 0, valor_aberto: 100, data_vencimento: '2025-01-01', status: 'vencida' },
        { id: '2', valor_original: 200, valor_recebido: 0, valor_aberto: 200, data_vencimento: '2025-01-01', status: 'vencida' },
        { id: '3', valor_original: 300, valor_recebido: 300, valor_aberto: 0, data_vencimento: '2025-01-01', status: 'recebida' },
        { id: '4', valor_original: 400, valor_recebido: 0, valor_aberto: 400, data_vencimento: '2025-12-31', status: 'aberta' },
      ];
      
      // 2 vencidas de 4 = 50%
      expect(contasReceberService.calcularTaxaInadimplencia(contas)).toBe(50);
    });

    it('deve retornar 0 se não houver contas', () => {
      expect(contasReceberService.calcularTaxaInadimplencia([])).toBe(0);
    });
  });

  describe('calcularValorComDesconto()', () => {
    it('deve calcular desconto percentual', () => {
      expect(contasReceberService.calcularValorComDesconto(1000, 10, 'percentual')).toBe(900);
      expect(contasReceberService.calcularValorComDesconto(500, 5, 'percentual')).toBe(475);
    });

    it('deve calcular desconto fixo', () => {
      expect(contasReceberService.calcularValorComDesconto(1000, 100, 'fixo')).toBe(900);
    });

    it('não deve retornar valor negativo', () => {
      expect(contasReceberService.calcularValorComDesconto(100, 200, 'fixo')).toBe(0);
    });
  });

  describe('ordenarPorPrioridade()', () => {
    it('deve ordenar vencidas primeiro', () => {
      const contas: ContaReceber[] = [
        { id: '1', valor_original: 100, valor_recebido: 0, valor_aberto: 100, data_vencimento: '2025-01-01', status: 'aberta' },
        { id: '2', valor_original: 200, valor_recebido: 200, valor_aberto: 0, data_vencimento: '2025-01-01', status: 'recebida' },
        { id: '3', valor_original: 300, valor_recebido: 0, valor_aberto: 300, data_vencimento: '2025-01-01', status: 'vencida' },
      ];
      
      const ordenadas = contasReceberService.ordenarPorPrioridade(contas);
      
      expect(ordenadas[0].status).toBe('vencida');
      expect(ordenadas[1].status).toBe('aberta');
      expect(ordenadas[2].status).toBe('recebida');
    });
  });
});
