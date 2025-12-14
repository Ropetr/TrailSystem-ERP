// =============================================
// PLANAC ERP - Testes do Módulo Suporte
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface Ticket {
  id: string;
  numero: string;
  status: string;
  prioridade: string;
  data_abertura: string;
  data_primeira_resposta?: string;
  sla_primeira_resposta: number;
  sla_resolucao: number;
}

const suporteService = {
  calcularSLA: (dataAbertura: string, slaMinutos: number) => {
    const abertura = new Date(dataAbertura);
    const prazo = new Date(abertura.getTime() + slaMinutos * 60 * 1000);
    const agora = new Date();
    
    const restante = prazo.getTime() - agora.getTime();
    const estourado = restante < 0;
    
    return {
      prazo,
      restanteMinutos: Math.floor(restante / (60 * 1000)),
      estourado,
    };
  },
  
  calcularTempoResposta: (dataAbertura: string, dataPrimeiraResposta: string) => {
    const abertura = new Date(dataAbertura);
    const resposta = new Date(dataPrimeiraResposta);
    const diffMs = resposta.getTime() - abertura.getTime();
    return Math.floor(diffMs / (60 * 1000)); // em minutos
  },
  
  calcularTempoAberto: (dataAbertura: string) => {
    const abertura = new Date(dataAbertura);
    const agora = new Date();
    const diffMs = agora.getTime() - abertura.getTime();
    
    const minutos = Math.floor(diffMs / (60 * 1000));
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    return { dias, horas: horas % 24, minutos: minutos % 60, totalMinutos: minutos };
  },
  
  formatarTempoAberto: (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) return `${dias}d ${horas % 24}h`;
    if (horas > 0) return `${horas}h ${minutos % 60}m`;
    return `${minutos}m`;
  },
  
  getPrioridadePeso: (prioridade: string) => {
    const pesos: Record<string, number> = {
      urgente: 4,
      alta: 3,
      media: 2,
      baixa: 1,
    };
    return pesos[prioridade] || 1;
  },
  
  ordenarPorPrioridade: (tickets: Ticket[]) => {
    return [...tickets].sort((a, b) => {
      const pesoA = suporteService.getPrioridadePeso(a.prioridade);
      const pesoB = suporteService.getPrioridadePeso(b.prioridade);
      
      if (pesoA !== pesoB) return pesoB - pesoA; // Maior prioridade primeiro
      
      // Mesmo peso: mais antigo primeiro
      return new Date(a.data_abertura).getTime() - new Date(b.data_abertura).getTime();
    });
  },
  
  calcularTaxaResolucao: (resolvidos: number, total: number) => {
    if (total === 0) return 100;
    return Math.round((resolvidos / total) * 10000) / 100;
  },
  
  calcularTMR: (tickets: Ticket[]) => {
    // Tempo Médio de Resposta
    const comResposta = tickets.filter(t => t.data_primeira_resposta);
    if (comResposta.length === 0) return 0;
    
    const totalMinutos = comResposta.reduce((acc, t) => {
      return acc + suporteService.calcularTempoResposta(t.data_abertura, t.data_primeira_resposta!);
    }, 0);
    
    return Math.round(totalMinutos / comResposta.length);
  },
  
  getSLAPorPrioridade: (prioridade: string) => {
    const slas: Record<string, { resposta: number; resolucao: number }> = {
      urgente: { resposta: 30, resolucao: 240 },      // 30min / 4h
      alta: { resposta: 60, resolucao: 480 },         // 1h / 8h
      media: { resposta: 120, resolucao: 1440 },      // 2h / 24h
      baixa: { resposta: 480, resolucao: 2880 },      // 8h / 48h
    };
    return slas[prioridade] || slas.media;
  },
  
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      aberto: 'Aberto',
      em_andamento: 'Em Andamento',
      aguardando_cliente: 'Aguardando Cliente',
      aguardando_terceiro: 'Aguardando Terceiro',
      resolvido: 'Resolvido',
      fechado: 'Fechado',
    };
    return labels[status] || status;
  },
  
  getPrioridadeLabel: (prioridade: string) => {
    const labels: Record<string, string> = {
      urgente: 'Urgente',
      alta: 'Alta',
      media: 'Média',
      baixa: 'Baixa',
    };
    return labels[prioridade] || prioridade;
  },
  
  podeFechar: (ticket: Ticket) => {
    return ['resolvido', 'aberto'].includes(ticket.status);
  },
  
  podeReabrir: (ticket: Ticket) => {
    return ticket.status === 'fechado';
  },
  
  gerarNumero: (ano: number, sequencial: number) => {
    return `${ano}${sequencial.toString().padStart(6, '0')}`;
  },
  
  calcularScoreAtendente: (tickets: Ticket[]) => {
    // Score baseado em: tempo de resposta, taxa de resolução, SLA
    const resolvidos = tickets.filter(t => ['resolvido', 'fechado'].includes(t.status)).length;
    const dentroSLA = tickets.filter(t => {
      if (!t.data_primeira_resposta) return false;
      const tempoResposta = suporteService.calcularTempoResposta(t.data_abertura, t.data_primeira_resposta);
      return tempoResposta <= t.sla_primeira_resposta;
    }).length;
    
    const taxaResolucao = tickets.length > 0 ? resolvidos / tickets.length : 0;
    const taxaSLA = tickets.length > 0 ? dentroSLA / tickets.length : 0;
    
    return Math.round((taxaResolucao * 50 + taxaSLA * 50));
  },
};

describe('Serviço de Suporte', () => {
  describe('calcularSLA()', () => {
    it('deve calcular SLA não estourado', () => {
      const agora = new Date();
      const abertura = new Date(agora.getTime() - 30 * 60 * 1000); // 30 min atrás
      
      const sla = suporteService.calcularSLA(abertura.toISOString(), 60); // SLA 60 min
      
      expect(sla.estourado).toBe(false);
      expect(sla.restanteMinutos).toBeGreaterThan(0);
    });

    it('deve detectar SLA estourado', () => {
      const agora = new Date();
      const abertura = new Date(agora.getTime() - 120 * 60 * 1000); // 2h atrás
      
      const sla = suporteService.calcularSLA(abertura.toISOString(), 60); // SLA 60 min
      
      expect(sla.estourado).toBe(true);
      expect(sla.restanteMinutos).toBeLessThan(0);
    });
  });

  describe('calcularTempoResposta()', () => {
    it('deve calcular tempo de resposta em minutos', () => {
      const abertura = '2025-01-15T10:00:00Z';
      const resposta = '2025-01-15T10:45:00Z';
      
      expect(suporteService.calcularTempoResposta(abertura, resposta)).toBe(45);
    });
  });

  describe('formatarTempoAberto()', () => {
    it('deve formatar apenas minutos', () => {
      expect(suporteService.formatarTempoAberto(45)).toBe('45m');
    });

    it('deve formatar horas e minutos', () => {
      expect(suporteService.formatarTempoAberto(135)).toBe('2h 15m');
    });

    it('deve formatar dias e horas', () => {
      expect(suporteService.formatarTempoAberto(1500)).toBe('1d 1h');
    });
  });

  describe('ordenarPorPrioridade()', () => {
    it('deve ordenar por prioridade (urgente primeiro)', () => {
      const tickets: Ticket[] = [
        { id: '1', numero: '1', status: 'aberto', prioridade: 'baixa', data_abertura: '2025-01-15T10:00:00Z', sla_primeira_resposta: 60, sla_resolucao: 480 },
        { id: '2', numero: '2', status: 'aberto', prioridade: 'urgente', data_abertura: '2025-01-15T11:00:00Z', sla_primeira_resposta: 30, sla_resolucao: 240 },
        { id: '3', numero: '3', status: 'aberto', prioridade: 'alta', data_abertura: '2025-01-15T09:00:00Z', sla_primeira_resposta: 60, sla_resolucao: 480 },
      ];
      
      const ordenados = suporteService.ordenarPorPrioridade(tickets);
      
      expect(ordenados[0].prioridade).toBe('urgente');
      expect(ordenados[1].prioridade).toBe('alta');
      expect(ordenados[2].prioridade).toBe('baixa');
    });
  });

  describe('calcularTaxaResolucao()', () => {
    it('deve calcular taxa de resolução', () => {
      expect(suporteService.calcularTaxaResolucao(75, 100)).toBe(75);
      expect(suporteService.calcularTaxaResolucao(3, 4)).toBe(75);
    });

    it('deve retornar 100% para nenhum ticket', () => {
      expect(suporteService.calcularTaxaResolucao(0, 0)).toBe(100);
    });
  });

  describe('getSLAPorPrioridade()', () => {
    it('deve retornar SLA correto por prioridade', () => {
      expect(suporteService.getSLAPorPrioridade('urgente')).toEqual({ resposta: 30, resolucao: 240 });
      expect(suporteService.getSLAPorPrioridade('baixa')).toEqual({ resposta: 480, resolucao: 2880 });
    });

    it('deve retornar SLA médio para prioridade desconhecida', () => {
      expect(suporteService.getSLAPorPrioridade('desconhecida')).toEqual({ resposta: 120, resolucao: 1440 });
    });
  });

  describe('podeFechar()', () => {
    it('deve permitir fechar ticket resolvido', () => {
      expect(suporteService.podeFechar({ status: 'resolvido' } as Ticket)).toBe(true);
    });

    it('não deve permitir fechar ticket em andamento', () => {
      expect(suporteService.podeFechar({ status: 'em_andamento' } as Ticket)).toBe(false);
    });
  });

  describe('gerarNumero()', () => {
    it('deve gerar número no formato correto', () => {
      expect(suporteService.gerarNumero(2025, 1)).toBe('2025000001');
      expect(suporteService.gerarNumero(2025, 12345)).toBe('2025012345');
    });
  });

  describe('calcularScoreAtendente()', () => {
    it('deve calcular score de atendente', () => {
      const tickets: Ticket[] = [
        { id: '1', numero: '1', status: 'resolvido', prioridade: 'media', data_abertura: '2025-01-15T10:00:00Z', data_primeira_resposta: '2025-01-15T10:30:00Z', sla_primeira_resposta: 120, sla_resolucao: 1440 },
        { id: '2', numero: '2', status: 'fechado', prioridade: 'alta', data_abertura: '2025-01-15T11:00:00Z', data_primeira_resposta: '2025-01-15T11:45:00Z', sla_primeira_resposta: 60, sla_resolucao: 480 },
      ];
      
      const score = suporteService.calcularScoreAtendente(tickets);
      
      // 100% resolvidos (50 pts) + 100% SLA (50 pts) = 100
      expect(score).toBe(100);
    });
  });
});
