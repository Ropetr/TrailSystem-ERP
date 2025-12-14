// =============================================
// PLANAC ERP - Testes do Serviço de Frota
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface Veiculo {
  id: string;
  placa: string;
  status: 'disponivel' | 'em_uso' | 'manutencao' | 'inativo';
  km_atual: number;
  proxima_revisao_km: number;
  vencimento_licenciamento: string;
  capacidade_kg: number;
  capacidade_volumes: number;
}

interface Motorista {
  id: string;
  nome: string;
  status: 'ativo' | 'ferias' | 'afastado' | 'inativo';
  vencimento_cnh: string;
  categoria_cnh: string;
}

const frotaService = {
  listarVeiculos: async () => {
    const response = await fetch('/api/logistica/veiculos');
    return response.json();
  },
  
  listarMotoristas: async () => {
    const response = await fetch('/api/logistica/motoristas');
    return response.json();
  },
  
  registrarKm: async (veiculoId: string, km: number) => {
    const response = await fetch(`/api/logistica/veiculos/${veiculoId}/km`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ km }),
    });
    return response.json();
  },
  
  agendarManutencao: async (dados: {
    veiculo_id: string;
    tipo: 'preventiva' | 'corretiva' | 'revisao';
    descricao: string;
    data_entrada: string;
  }) => {
    const response = await fetch('/api/logistica/manutencoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  verificarDisponibilidade: (veiculo: Veiculo) => {
    return veiculo.status === 'disponivel';
  },
  
  verificarAlertaRevisao: (veiculo: Veiculo, kmAntecedencia: number = 1000) => {
    return (veiculo.proxima_revisao_km - veiculo.km_atual) <= kmAntecedencia;
  },
  
  verificarAlertaLicenciamento: (veiculo: Veiculo, diasAntecedencia: number = 30) => {
    const hoje = new Date();
    const vencimento = new Date(veiculo.vencimento_licenciamento);
    const diffDias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diffDias <= diasAntecedencia;
  },
  
  verificarAlertaCNH: (motorista: Motorista, diasAntecedencia: number = 30) => {
    const hoje = new Date();
    const vencimento = new Date(motorista.vencimento_cnh);
    const diffDias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diffDias <= diasAntecedencia;
  },
  
  calcularKmRestante: (veiculo: Veiculo) => {
    return Math.max(0, veiculo.proxima_revisao_km - veiculo.km_atual);
  },
  
  calcularDiasVencimento: (data: string) => {
    const hoje = new Date();
    const vencimento = new Date(data);
    return Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  },
  
  validarPlaca: (placa: string) => {
    // Formato antigo: ABC-1234 ou ABC1234
    // Formato Mercosul: ABC1D23
    const formatoAntigo = /^[A-Z]{3}-?\d{4}$/i;
    const formatoMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/i;
    return formatoAntigo.test(placa) || formatoMercosul.test(placa);
  },
  
  formatarPlaca: (placa: string) => {
    const limpa = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (limpa.length === 7) {
      // Verifica se é Mercosul (4º caractere é letra)
      if (/[A-Z]/.test(limpa[4])) {
        return limpa; // Mercosul: ABC1D23
      }
      return `${limpa.slice(0, 3)}-${limpa.slice(3)}`; // Antigo: ABC-1234
    }
    return placa;
  },
  
  validarCNH: (motorista: Motorista, tipoVeiculo: 'carro' | 'van' | 'caminhao' | 'moto') => {
    const categorias = motorista.categoria_cnh.toUpperCase();
    const requisitos: Record<string, string[]> = {
      moto: ['A', 'AB', 'AC', 'AD', 'AE'],
      carro: ['B', 'AB', 'C', 'D', 'E', 'AC', 'AD', 'AE'],
      van: ['B', 'AB', 'C', 'D', 'E', 'AC', 'AD', 'AE'],
      caminhao: ['C', 'D', 'E', 'AC', 'AD', 'AE'],
    };
    return requisitos[tipoVeiculo].some(cat => categorias.includes(cat));
  },
  
  filtrarVeiculosDisponiveis: (veiculos: Veiculo[]) => {
    return veiculos.filter(v => v.status === 'disponivel');
  },
  
  filtrarVeiculosComAlerta: (veiculos: Veiculo[]) => {
    return veiculos.filter(v => 
      frotaService.verificarAlertaRevisao(v) || 
      frotaService.verificarAlertaLicenciamento(v)
    );
  },
  
  verificarCapacidade: (veiculo: Veiculo, pesoTotal: number, volumeTotal: number) => {
    return pesoTotal <= veiculo.capacidade_kg && volumeTotal <= veiculo.capacidade_volumes;
  },
  
  getStatusLabel: (status: string, tipo: 'veiculo' | 'motorista') => {
    const labelsVeiculo: Record<string, string> = {
      disponivel: 'Disponível',
      em_uso: 'Em Uso',
      manutencao: 'Manutenção',
      inativo: 'Inativo',
    };
    const labelsMotorista: Record<string, string> = {
      ativo: 'Ativo',
      ferias: 'Férias',
      afastado: 'Afastado',
      inativo: 'Inativo',
    };
    return tipo === 'veiculo' ? labelsVeiculo[status] : labelsMotorista[status];
  },
};

describe('Serviço de Frota', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('verificarDisponibilidade()', () => {
    it('deve retornar true para veículo disponível', () => {
      const veiculo: Veiculo = {
        id: '1', placa: 'ABC1234', status: 'disponivel',
        km_atual: 50000, proxima_revisao_km: 60000,
        vencimento_licenciamento: '2025-12-31',
        capacidade_kg: 1000, capacidade_volumes: 100,
      };
      expect(frotaService.verificarDisponibilidade(veiculo)).toBe(true);
    });

    it('deve retornar false para veículo em manutenção', () => {
      const veiculo = { status: 'manutencao' } as Veiculo;
      expect(frotaService.verificarDisponibilidade(veiculo)).toBe(false);
    });
  });

  describe('verificarAlertaRevisao()', () => {
    it('deve alertar quando próximo da revisão', () => {
      const veiculo: Veiculo = {
        id: '1', placa: 'ABC1234', status: 'disponivel',
        km_atual: 59500, proxima_revisao_km: 60000,
        vencimento_licenciamento: '2025-12-31',
        capacidade_kg: 1000, capacidade_volumes: 100,
      };
      expect(frotaService.verificarAlertaRevisao(veiculo)).toBe(true);
    });

    it('não deve alertar quando longe da revisão', () => {
      const veiculo: Veiculo = {
        id: '1', placa: 'ABC1234', status: 'disponivel',
        km_atual: 50000, proxima_revisao_km: 60000,
        vencimento_licenciamento: '2025-12-31',
        capacidade_kg: 1000, capacidade_volumes: 100,
      };
      expect(frotaService.verificarAlertaRevisao(veiculo)).toBe(false);
    });
  });

  describe('calcularKmRestante()', () => {
    it('deve calcular km restante até revisão', () => {
      const veiculo = { km_atual: 55000, proxima_revisao_km: 60000 } as Veiculo;
      expect(frotaService.calcularKmRestante(veiculo)).toBe(5000);
    });

    it('deve retornar 0 se km ultrapassado', () => {
      const veiculo = { km_atual: 62000, proxima_revisao_km: 60000 } as Veiculo;
      expect(frotaService.calcularKmRestante(veiculo)).toBe(0);
    });
  });

  describe('validarPlaca()', () => {
    it('deve validar placa formato antigo', () => {
      expect(frotaService.validarPlaca('ABC-1234')).toBe(true);
      expect(frotaService.validarPlaca('ABC1234')).toBe(true);
    });

    it('deve validar placa formato Mercosul', () => {
      expect(frotaService.validarPlaca('ABC1D23')).toBe(true);
    });

    it('deve rejeitar placa inválida', () => {
      expect(frotaService.validarPlaca('12345')).toBe(false);
      expect(frotaService.validarPlaca('ABCD1234')).toBe(false);
    });
  });

  describe('formatarPlaca()', () => {
    it('deve formatar placa antiga', () => {
      expect(frotaService.formatarPlaca('abc1234')).toBe('ABC-1234');
    });

    it('deve manter placa Mercosul', () => {
      expect(frotaService.formatarPlaca('abc1d23')).toBe('ABC1D23');
    });
  });

  describe('validarCNH()', () => {
    it('deve validar CNH para tipo de veículo', () => {
      const motoristaB: Motorista = { categoria_cnh: 'B' } as Motorista;
      const motoristaAB: Motorista = { categoria_cnh: 'AB' } as Motorista;
      const motoristaC: Motorista = { categoria_cnh: 'C' } as Motorista;
      
      expect(frotaService.validarCNH(motoristaB, 'carro')).toBe(true);
      expect(frotaService.validarCNH(motoristaB, 'moto')).toBe(false);
      expect(frotaService.validarCNH(motoristaAB, 'moto')).toBe(true);
      expect(frotaService.validarCNH(motoristaC, 'caminhao')).toBe(true);
      expect(frotaService.validarCNH(motoristaB, 'caminhao')).toBe(false);
    });
  });

  describe('verificarCapacidade()', () => {
    it('deve verificar se carga cabe no veículo', () => {
      const veiculo: Veiculo = {
        id: '1', placa: 'ABC1234', status: 'disponivel',
        km_atual: 50000, proxima_revisao_km: 60000,
        vencimento_licenciamento: '2025-12-31',
        capacidade_kg: 1000, capacidade_volumes: 50,
      };
      
      expect(frotaService.verificarCapacidade(veiculo, 800, 40)).toBe(true);
      expect(frotaService.verificarCapacidade(veiculo, 1200, 40)).toBe(false);
      expect(frotaService.verificarCapacidade(veiculo, 800, 60)).toBe(false);
    });
  });

  describe('filtrarVeiculosDisponiveis()', () => {
    it('deve filtrar apenas veículos disponíveis', () => {
      const veiculos: Veiculo[] = [
        { id: '1', status: 'disponivel' } as Veiculo,
        { id: '2', status: 'em_uso' } as Veiculo,
        { id: '3', status: 'disponivel' } as Veiculo,
        { id: '4', status: 'manutencao' } as Veiculo,
      ];
      
      const disponiveis = frotaService.filtrarVeiculosDisponiveis(veiculos);
      expect(disponiveis).toHaveLength(2);
    });
  });
});
