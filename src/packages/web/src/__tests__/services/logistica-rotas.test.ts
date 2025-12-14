// =============================================
// PLANAC ERP - Testes do Serviço de Rotas
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface EntregaRota {
  id: string;
  cliente_nome: string;
  endereco: string;
  latitude?: number;
  longitude?: number;
  ordem: number;
  status: 'pendente' | 'em_rota' | 'entregue' | 'problema';
}

interface Rota {
  id: string;
  codigo: string;
  status: 'planejada' | 'em_andamento' | 'finalizada' | 'cancelada';
  entregas: EntregaRota[];
  total_entregas: number;
  entregas_realizadas: number;
  km_estimado: number;
}

const rotasService = {
  criar: async (dados: { motorista_id: string; veiculo_id: string; entregas: string[]; data: string }) => {
    const response = await fetch('/api/logistica/rotas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  iniciar: async (rotaId: string) => {
    const response = await fetch(`/api/logistica/rotas/${rotaId}/iniciar`, { method: 'POST' });
    return response.json();
  },
  
  finalizar: async (rotaId: string, kmPercorrido?: number) => {
    const response = await fetch(`/api/logistica/rotas/${rotaId}/finalizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ km_percorrido: kmPercorrido }),
    });
    return response.json();
  },
  
  otimizar: async (rotaId: string) => {
    const response = await fetch(`/api/logistica/rotas/${rotaId}/otimizar`, { method: 'POST' });
    return response.json();
  },
  
  reordenar: async (rotaId: string, novaOrdem: string[]) => {
    const response = await fetch(`/api/logistica/rotas/${rotaId}/reordenar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordem: novaOrdem }),
    });
    return response.json();
  },
  
  calcularProgresso: (rota: Rota) => {
    if (rota.total_entregas === 0) return 0;
    return Math.round((rota.entregas_realizadas / rota.total_entregas) * 100);
  },
  
  calcularTempoEstimado: (entregas: number, tempoMedioPorEntrega: number = 15) => {
    // Tempo em minutos: entregas * tempo médio + tempo de deslocamento
    const tempoEntregas = entregas * tempoMedioPorEntrega;
    const tempoDeslocamento = Math.max(0, (entregas - 1)) * 10; // 10 min entre entregas
    return tempoEntregas + tempoDeslocamento;
  },
  
  formatarTempoEstimado: (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas === 0) return `${mins}min`;
    return `${horas}h${mins > 0 ? ` ${mins}min` : ''}`;
  },
  
  calcularDistanciaHaversine: (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
  
  ordenarPorProximidade: (entregas: EntregaRota[], latOrigem: number, lonOrigem: number) => {
    return [...entregas].sort((a, b) => {
      if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return 0;
      const distA = rotasService.calcularDistanciaHaversine(latOrigem, lonOrigem, a.latitude, a.longitude);
      const distB = rotasService.calcularDistanciaHaversine(latOrigem, lonOrigem, b.latitude, b.longitude);
      return distA - distB;
    });
  },
  
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      planejada: 'Planejada',
      em_andamento: 'Em Andamento',
      finalizada: 'Finalizada',
      cancelada: 'Cancelada',
    };
    return labels[status] || status;
  },
  
  podeIniciar: (rota: Rota) => {
    return rota.status === 'planejada' && rota.entregas.length > 0;
  },
  
  podeFinalizar: (rota: Rota) => {
    return rota.status === 'em_andamento';
  },
  
  gerarCodigo: (data: string, sequencial: number) => {
    const dataFormatada = data.replace(/-/g, '');
    return `RT${dataFormatada}${sequencial.toString().padStart(3, '0')}`;
  },
};

describe('Serviço de Rotas', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('criar()', () => {
    it('deve criar rota', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { id: 'rota-1' } }),
      });

      await rotasService.criar({
        motorista_id: 'mot-1',
        veiculo_id: 'veic-1',
        entregas: ['ent-1', 'ent-2'],
        data: '2025-01-15',
      });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/logistica/rotas', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  describe('calcularProgresso()', () => {
    it('deve calcular progresso corretamente', () => {
      const rota: Rota = {
        id: '1', codigo: 'RT1', status: 'em_andamento',
        entregas: [], total_entregas: 10, entregas_realizadas: 7, km_estimado: 50,
      };
      
      expect(rotasService.calcularProgresso(rota)).toBe(70);
    });

    it('deve retornar 0 para rota sem entregas', () => {
      const rota: Rota = {
        id: '1', codigo: 'RT1', status: 'planejada',
        entregas: [], total_entregas: 0, entregas_realizadas: 0, km_estimado: 0,
      };
      
      expect(rotasService.calcularProgresso(rota)).toBe(0);
    });
  });

  describe('calcularTempoEstimado()', () => {
    it('deve calcular tempo para entregas', () => {
      // 5 entregas * 15min + 4 deslocamentos * 10min = 75 + 40 = 115min
      expect(rotasService.calcularTempoEstimado(5)).toBe(115);
    });

    it('deve calcular tempo com tempo médio personalizado', () => {
      // 3 entregas * 20min + 2 deslocamentos * 10min = 60 + 20 = 80min
      expect(rotasService.calcularTempoEstimado(3, 20)).toBe(80);
    });
  });

  describe('formatarTempoEstimado()', () => {
    it('deve formatar minutos', () => {
      expect(rotasService.formatarTempoEstimado(45)).toBe('45min');
    });

    it('deve formatar horas e minutos', () => {
      expect(rotasService.formatarTempoEstimado(90)).toBe('1h 30min');
    });

    it('deve formatar horas exatas', () => {
      expect(rotasService.formatarTempoEstimado(120)).toBe('2h');
    });
  });

  describe('calcularDistanciaHaversine()', () => {
    it('deve calcular distância entre dois pontos', () => {
      // São Paulo para Rio de Janeiro (aprox 360km)
      const distancia = rotasService.calcularDistanciaHaversine(
        -23.5505, -46.6333, // SP
        -22.9068, -43.1729  // RJ
      );
      
      expect(distancia).toBeGreaterThan(350);
      expect(distancia).toBeLessThan(400);
    });

    it('deve retornar 0 para mesma localização', () => {
      const distancia = rotasService.calcularDistanciaHaversine(-23.5505, -46.6333, -23.5505, -46.6333);
      expect(distancia).toBe(0);
    });
  });

  describe('podeIniciar()', () => {
    it('deve permitir iniciar rota planejada com entregas', () => {
      const rota: Rota = {
        id: '1', codigo: 'RT1', status: 'planejada',
        entregas: [{ id: '1', cliente_nome: '', endereco: '', ordem: 1, status: 'pendente' }],
        total_entregas: 1, entregas_realizadas: 0, km_estimado: 10,
      };
      expect(rotasService.podeIniciar(rota)).toBe(true);
    });

    it('não deve permitir iniciar rota em andamento', () => {
      const rota: Rota = {
        id: '1', codigo: 'RT1', status: 'em_andamento',
        entregas: [{ id: '1', cliente_nome: '', endereco: '', ordem: 1, status: 'pendente' }],
        total_entregas: 1, entregas_realizadas: 0, km_estimado: 10,
      };
      expect(rotasService.podeIniciar(rota)).toBe(false);
    });
  });

  describe('gerarCodigo()', () => {
    it('deve gerar código no formato correto', () => {
      expect(rotasService.gerarCodigo('2025-01-15', 1)).toBe('RT20250115001');
      expect(rotasService.gerarCodigo('2025-12-31', 99)).toBe('RT20251231099');
    });
  });
});
