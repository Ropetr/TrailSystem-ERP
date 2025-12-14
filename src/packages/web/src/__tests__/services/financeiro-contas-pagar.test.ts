// =============================================
// PLANAC ERP - Testes do Serviço de Contas a Pagar
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface ContaPagar {
  id: string;
  valor_original: number;
  valor_pago: number;
  valor_aberto: number;
  data_vencimento: string;
  status: 'aberta' | 'parcial' | 'paga' | 'vencida' | 'cancelada';
}

interface Pagamento {
  valor: number;
  juros?: number;
  multa?: number;
  desconto?: number;
  data_pagamento: string;
  forma_pagamento: string;
}

const contasPagarService = {
  listar: async (filtros?: { status?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.status) params.append('status', filtros.status);
    
    const response = await fetch(`/api/financeiro/contas-pagar?${params}`);
    return response.json();
  },
  
  registrarPagamento: async (contaId: string, pagamento: Pagamento) => {
    const response = await fetch(`/api/financeiro/contas-pagar/${contaId}/pagar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pagamento),
    });
    return response.json();
  },
  
  calcularValorAberto: (valorOriginal: number, valorPago: number) => {
    return Math.max(0, valorOriginal - valorPago);
  },
  
  calcularValorPagamento: (pagamento: Pagamento) => {
    return pagamento.valor + 
      (pagamento.juros || 0) + 
      (pagamento.multa || 0) - 
      (pagamento.desconto || 0);
  },
  
  calcularJurosMora: (valor: number, diasAtraso: number, taxaDiaria: number = 0.033) => {
    if (diasAtraso <= 0) return 0;
    return valor * (taxaDiaria / 100) * diasAtraso;
  },
  
  calcularMulta: (valor: number, percentual: number = 2) => {
    return valor * (percentual / 100);
  },
  
  getDiasAtraso: (dataVencimento: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    
    const diff = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  },
  
  getDiasParaVencer: (dataVencimento: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    
    const diff = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  },
  
  determinarStatus: (conta: ContaPagar): string => {
    const hoje = new Date();
    const vencimento = new Date(conta.data_vencimento);
    
    if (conta.valor_aberto === 0) return 'paga';
    if (conta.valor_pago > 0 && conta.valor_aberto > 0) return 'parcial';
    if (vencimento < hoje) return 'vencida';
    return 'aberta';
  },
  
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      aberta: 'Aberta',
      parcial: 'Parcial',
      paga: 'Paga',
      vencida: 'Vencida',
      cancelada: 'Cancelada',
    };
    return labels[status] || status;
  },
  
  agruparPorVencimento: (contas: ContaPagar[]) => {
    const grupos: Record<string, ContaPagar[]> = {
      vencidas: [],
      hoje: [],
      proximos7dias: [],
      proximoMes: [],
      futuro: [],
    };
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    contas.forEach(conta => {
      const vencimento = new Date(conta.data_vencimento);
      vencimento.setHours(0, 0, 0, 0);
      
      const diffDias = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDias < 0) grupos.vencidas.push(conta);
      else if (diffDias === 0) grupos.hoje.push(conta);
      else if (diffDias <= 7) grupos.proximos7dias.push(conta);
      else if (diffDias <= 30) grupos.proximoMes.push(conta);
      else grupos.futuro.push(conta);
    });
    
    return grupos;
  },
};

describe('Serviço de Contas a Pagar', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('listar()', () => {
    it('deve listar todas as contas', async () => {
      const mockContas = [
        { id: '1', valor_original: 1000, status: 'aberta' },
        { id: '2', valor_original: 500, status: 'paga' },
      ];
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockContas }),
      });

      const result = await contasPagarService.listar();
      
      expect(result.data).toHaveLength(2);
    });

    it('deve filtrar por status', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await contasPagarService.listar({ status: 'vencida' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/financeiro/contas-pagar?status=vencida');
    });
  });

  describe('registrarPagamento()', () => {
    it('deve registrar pagamento', async () => {
      const pagamento: Pagamento = {
        valor: 1000,
        data_pagamento: '2025-01-15',
        forma_pagamento: 'pix',
      };
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await contasPagarService.registrarPagamento('123', pagamento);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/financeiro/contas-pagar/123/pagar', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  describe('calcularValorAberto()', () => {
    it('deve calcular valor aberto', () => {
      expect(contasPagarService.calcularValorAberto(1000, 300)).toBe(700);
      expect(contasPagarService.calcularValorAberto(1000, 1000)).toBe(0);
    });

    it('não deve retornar valor negativo', () => {
      expect(contasPagarService.calcularValorAberto(1000, 1200)).toBe(0);
    });
  });

  describe('calcularValorPagamento()', () => {
    it('deve calcular valor total do pagamento', () => {
      const pagamento: Pagamento = {
        valor: 1000,
        juros: 10,
        multa: 20,
        desconto: 50,
        data_pagamento: '2025-01-15',
        forma_pagamento: 'pix',
      };
      
      // 1000 + 10 + 20 - 50 = 980
      expect(contasPagarService.calcularValorPagamento(pagamento)).toBe(980);
    });

    it('deve funcionar sem encargos', () => {
      const pagamento: Pagamento = {
        valor: 500,
        data_pagamento: '2025-01-15',
        forma_pagamento: 'pix',
      };
      
      expect(contasPagarService.calcularValorPagamento(pagamento)).toBe(500);
    });
  });

  describe('calcularJurosMora()', () => {
    it('deve calcular juros de mora', () => {
      // 1000 * 0.033% * 30 dias = 9.90
      expect(contasPagarService.calcularJurosMora(1000, 30, 0.033)).toBeCloseTo(9.9);
    });

    it('deve retornar 0 para conta não vencida', () => {
      expect(contasPagarService.calcularJurosMora(1000, 0)).toBe(0);
      expect(contasPagarService.calcularJurosMora(1000, -5)).toBe(0);
    });
  });

  describe('calcularMulta()', () => {
    it('deve calcular multa padrão de 2%', () => {
      expect(contasPagarService.calcularMulta(1000)).toBe(20);
    });

    it('deve calcular multa customizada', () => {
      expect(contasPagarService.calcularMulta(1000, 5)).toBe(50);
    });
  });

  describe('getDiasAtraso()', () => {
    it('deve calcular dias de atraso', () => {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 5);
      
      expect(contasPagarService.getDiasAtraso(ontem.toISOString().split('T')[0])).toBe(5);
    });

    it('deve retornar 0 para conta não vencida', () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 10);
      
      expect(contasPagarService.getDiasAtraso(futuro.toISOString().split('T')[0])).toBe(0);
    });
  });

  describe('determinarStatus()', () => {
    it('deve retornar paga quando valor aberto é 0', () => {
      const conta: ContaPagar = {
        id: '1',
        valor_original: 1000,
        valor_pago: 1000,
        valor_aberto: 0,
        data_vencimento: '2025-01-01',
        status: 'aberta',
      };
      
      expect(contasPagarService.determinarStatus(conta)).toBe('paga');
    });

    it('deve retornar parcial quando há pagamento parcial', () => {
      const conta: ContaPagar = {
        id: '1',
        valor_original: 1000,
        valor_pago: 500,
        valor_aberto: 500,
        data_vencimento: '2099-12-31',
        status: 'aberta',
      };
      
      expect(contasPagarService.determinarStatus(conta)).toBe('parcial');
    });
  });

  describe('agruparPorVencimento()', () => {
    it('deve agrupar contas por período de vencimento', () => {
      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      
      const contas: ContaPagar[] = [
        { id: '1', valor_original: 100, valor_pago: 0, valor_aberto: 100, data_vencimento: ontem.toISOString().split('T')[0], status: 'vencida' },
        { id: '2', valor_original: 200, valor_pago: 0, valor_aberto: 200, data_vencimento: hoje.toISOString().split('T')[0], status: 'aberta' },
        { id: '3', valor_original: 300, valor_pago: 0, valor_aberto: 300, data_vencimento: amanha.toISOString().split('T')[0], status: 'aberta' },
      ];
      
      const grupos = contasPagarService.agruparPorVencimento(contas);
      
      expect(grupos.vencidas).toHaveLength(1);
      expect(grupos.hoje).toHaveLength(1);
      expect(grupos.proximos7dias).toHaveLength(1);
    });
  });
});
