// =============================================
// PLANAC ERP - Testes do Serviço de Entregas
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface Entrega {
  id: string;
  codigo: string;
  status: 'pendente' | 'em_rota' | 'entregue' | 'tentativa' | 'devolvido' | 'cancelado';
  data_previsao: string;
  volumes: number;
  peso: number;
}

interface Ocorrencia {
  tipo: string;
  descricao: string;
  data: string;
}

const entregasService = {
  listar: async (data: string) => {
    const response = await fetch(`/api/logistica/entregas?data=${data}`);
    return response.json();
  },
  
  confirmarEntrega: async (entregaId: string, dados?: { recebedor?: string; documento?: string }) => {
    const response = await fetch(`/api/logistica/entregas/${entregaId}/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados || {}),
    });
    return response.json();
  },
  
  registrarOcorrencia: async (entregaId: string, ocorrencia: { tipo: string; descricao: string }) => {
    const response = await fetch(`/api/logistica/entregas/${entregaId}/ocorrencia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ocorrencia),
    });
    return response.json();
  },
  
  reagendar: async (entregaId: string, novaData: string) => {
    const response = await fetch(`/api/logistica/entregas/${entregaId}/reagendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data_previsao: novaData }),
    });
    return response.json();
  },
  
  calcularTaxaEntrega: (entregas: Entrega[]) => {
    const total = entregas.length;
    if (total === 0) return 100;
    
    const entregues = entregas.filter(e => e.status === 'entregue').length;
    return (entregues / total) * 100;
  },
  
  calcularTaxaProblema: (entregas: Entrega[]) => {
    const total = entregas.length;
    if (total === 0) return 0;
    
    const problemas = entregas.filter(e => ['tentativa', 'devolvido'].includes(e.status)).length;
    return (problemas / total) * 100;
  },
  
  calcularVolumeTotal: (entregas: Entrega[]) => {
    return entregas.reduce((acc, e) => acc + e.volumes, 0);
  },
  
  calcularPesoTotal: (entregas: Entrega[]) => {
    return entregas.reduce((acc, e) => acc + e.peso, 0);
  },
  
  filtrarPorStatus: (entregas: Entrega[], status: string) => {
    return entregas.filter(e => e.status === status);
  },
  
  ordenarPorPrioridade: (entregas: Entrega[]) => {
    const prioridade = { pendente: 1, em_rota: 2, tentativa: 3, entregue: 4, devolvido: 5, cancelado: 6 };
    return [...entregas].sort((a, b) => prioridade[a.status] - prioridade[b.status]);
  },
  
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      pendente: 'Pendente',
      em_rota: 'Em Rota',
      entregue: 'Entregue',
      tentativa: 'Tentativa',
      devolvido: 'Devolvido',
      cancelado: 'Cancelado',
    };
    return labels[status] || status;
  },
  
  podeConfirmar: (entrega: Entrega) => {
    return entrega.status === 'em_rota';
  },
  
  podeReagendar: (entrega: Entrega) => {
    return ['tentativa', 'pendente'].includes(entrega.status);
  },
  
  gerarCodigoRastreio: (pedidoId: string) => {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `PLN${timestamp}${pedidoId.slice(-4).toUpperCase()}`;
  },
};

describe('Serviço de Entregas', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('listar()', () => {
    it('deve listar entregas por data', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await entregasService.listar('2025-01-15');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/logistica/entregas?data=2025-01-15');
    });
  });

  describe('confirmarEntrega()', () => {
    it('deve confirmar entrega', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await entregasService.confirmarEntrega('ent-1', { recebedor: 'João Silva' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/logistica/entregas/ent-1/confirmar', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  describe('registrarOcorrencia()', () => {
    it('deve registrar ocorrência', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await entregasService.registrarOcorrencia('ent-1', { tipo: 'ausente', descricao: 'Cliente não encontrado' });
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.tipo).toBe('ausente');
    });
  });

  describe('calcularTaxaEntrega()', () => {
    it('deve calcular taxa de entrega', () => {
      const entregas: Entrega[] = [
        { id: '1', codigo: 'E1', status: 'entregue', data_previsao: '', volumes: 1, peso: 10 },
        { id: '2', codigo: 'E2', status: 'entregue', data_previsao: '', volumes: 2, peso: 20 },
        { id: '3', codigo: 'E3', status: 'pendente', data_previsao: '', volumes: 1, peso: 5 },
        { id: '4', codigo: 'E4', status: 'tentativa', data_previsao: '', volumes: 1, peso: 15 },
      ];
      
      // 2 entregues de 4 = 50%
      expect(entregasService.calcularTaxaEntrega(entregas)).toBe(50);
    });

    it('deve retornar 100% para lista vazia', () => {
      expect(entregasService.calcularTaxaEntrega([])).toBe(100);
    });
  });

  describe('calcularTaxaProblema()', () => {
    it('deve calcular taxa de problemas', () => {
      const entregas: Entrega[] = [
        { id: '1', codigo: 'E1', status: 'entregue', data_previsao: '', volumes: 1, peso: 10 },
        { id: '2', codigo: 'E2', status: 'tentativa', data_previsao: '', volumes: 2, peso: 20 },
        { id: '3', codigo: 'E3', status: 'devolvido', data_previsao: '', volumes: 1, peso: 5 },
        { id: '4', codigo: 'E4', status: 'pendente', data_previsao: '', volumes: 1, peso: 15 },
      ];
      
      // 2 problemas de 4 = 50%
      expect(entregasService.calcularTaxaProblema(entregas)).toBe(50);
    });
  });

  describe('calcularVolumeTotal()', () => {
    it('deve somar volumes', () => {
      const entregas: Entrega[] = [
        { id: '1', codigo: 'E1', status: 'pendente', data_previsao: '', volumes: 3, peso: 10 },
        { id: '2', codigo: 'E2', status: 'pendente', data_previsao: '', volumes: 5, peso: 20 },
      ];
      
      expect(entregasService.calcularVolumeTotal(entregas)).toBe(8);
    });
  });

  describe('calcularPesoTotal()', () => {
    it('deve somar pesos', () => {
      const entregas: Entrega[] = [
        { id: '1', codigo: 'E1', status: 'pendente', data_previsao: '', volumes: 1, peso: 15.5 },
        { id: '2', codigo: 'E2', status: 'pendente', data_previsao: '', volumes: 1, peso: 24.5 },
      ];
      
      expect(entregasService.calcularPesoTotal(entregas)).toBe(40);
    });
  });

  describe('podeConfirmar()', () => {
    it('deve permitir confirmar apenas entrega em rota', () => {
      expect(entregasService.podeConfirmar({ status: 'em_rota' } as Entrega)).toBe(true);
      expect(entregasService.podeConfirmar({ status: 'pendente' } as Entrega)).toBe(false);
      expect(entregasService.podeConfirmar({ status: 'entregue' } as Entrega)).toBe(false);
    });
  });

  describe('podeReagendar()', () => {
    it('deve permitir reagendar tentativa ou pendente', () => {
      expect(entregasService.podeReagendar({ status: 'tentativa' } as Entrega)).toBe(true);
      expect(entregasService.podeReagendar({ status: 'pendente' } as Entrega)).toBe(true);
      expect(entregasService.podeReagendar({ status: 'entregue' } as Entrega)).toBe(false);
    });
  });

  describe('gerarCodigoRastreio()', () => {
    it('deve gerar código com prefixo PLN', () => {
      const codigo = entregasService.gerarCodigoRastreio('pedido-1234');
      expect(codigo.startsWith('PLN')).toBe(true);
      expect(codigo.length).toBeGreaterThan(5);
    });
  });
});
