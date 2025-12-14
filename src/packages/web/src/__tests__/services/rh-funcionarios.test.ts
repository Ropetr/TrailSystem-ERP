// =============================================
// PLANAC ERP - Testes do Serviço de RH
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface Funcionario {
  id: string;
  nome: string;
  cpf: string;
  data_admissao: string;
  data_demissao?: string;
  salario: number;
  status: 'ativo' | 'ferias' | 'afastado' | 'desligado';
  tipo_contrato: 'clt' | 'pj' | 'estagio' | 'temporario';
}

const rhService = {
  listarFuncionarios: async (filtros?: { status?: string; departamento_id?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.status) params.append('status', filtros.status);
    if (filtros?.departamento_id) params.append('departamento_id', filtros.departamento_id);
    
    const response = await fetch(`/api/rh/funcionarios?${params}`);
    return response.json();
  },
  
  criar: async (dados: any) => {
    const response = await fetch('/api/rh/funcionarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  validarCPF: (cpf: string) => {
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numeros)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(numeros[i]) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(numeros[9])) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(numeros[i]) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(numeros[10])) return false;
    
    return true;
  },
  
  formatarCPF: (cpf: string) => {
    const numeros = cpf.replace(/\D/g, '');
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },
  
  calcularTempoEmpresa: (dataAdmissao: string, dataReferencia?: string) => {
    const admissao = new Date(dataAdmissao);
    const referencia = dataReferencia ? new Date(dataReferencia) : new Date();
    
    const diffMs = referencia.getTime() - admissao.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    const anos = Math.floor(diffDias / 365);
    const meses = Math.floor((diffDias % 365) / 30);
    const dias = diffDias % 30;
    
    return { anos, meses, dias, totalDias: diffDias };
  },
  
  calcularIdade: (dataNascimento: string) => {
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  },
  
  calcularFerias: (dataAdmissao: string) => {
    const tempo = rhService.calcularTempoEmpresa(dataAdmissao);
    
    // Período aquisitivo: 12 meses de trabalho
    const periodoAquisitivo = Math.floor(tempo.totalDias / 365);
    
    // Dias de férias proporcionais (até completar 1 ano)
    const diasProporcionais = tempo.totalDias < 365 
      ? Math.floor((tempo.totalDias / 365) * 30) 
      : 30;
    
    return {
      periodosCompletos: periodoAquisitivo,
      diasDisponiveis: periodoAquisitivo * 30,
      diasProporcionais,
    };
  },
  
  calcularDecimo: (salario: number, mesesTrabalhados: number) => {
    // Décimo terceiro proporcional
    return (salario / 12) * Math.min(mesesTrabalhados, 12);
  },
  
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      ativo: 'Ativo',
      ferias: 'Férias',
      afastado: 'Afastado',
      desligado: 'Desligado',
    };
    return labels[status] || status;
  },
  
  getTipoContratoLabel: (tipo: string) => {
    const labels: Record<string, string> = {
      clt: 'CLT',
      pj: 'PJ',
      estagio: 'Estágio',
      temporario: 'Temporário',
    };
    return labels[tipo] || tipo;
  },
  
  podeDesligar: (funcionario: Funcionario) => {
    return ['ativo', 'afastado'].includes(funcionario.status);
  },
  
  gerarMatricula: (sequencial: number, ano: number = new Date().getFullYear()) => {
    return `${ano}${sequencial.toString().padStart(5, '0')}`;
  },
};

describe('Serviço de RH - Funcionários', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('validarCPF()', () => {
    it('deve validar CPF correto', () => {
      expect(rhService.validarCPF('529.982.247-25')).toBe(true);
      expect(rhService.validarCPF('52998224725')).toBe(true);
    });

    it('deve rejeitar CPF inválido', () => {
      expect(rhService.validarCPF('111.111.111-11')).toBe(false);
      expect(rhService.validarCPF('123.456.789-00')).toBe(false);
    });

    it('deve rejeitar CPF com tamanho incorreto', () => {
      expect(rhService.validarCPF('123')).toBe(false);
    });
  });

  describe('formatarCPF()', () => {
    it('deve formatar CPF corretamente', () => {
      expect(rhService.formatarCPF('52998224725')).toBe('529.982.247-25');
    });
  });

  describe('calcularTempoEmpresa()', () => {
    it('deve calcular tempo de empresa', () => {
      // 1 ano e 6 meses atrás
      const dataAdmissao = new Date();
      dataAdmissao.setFullYear(dataAdmissao.getFullYear() - 1);
      dataAdmissao.setMonth(dataAdmissao.getMonth() - 6);
      
      const tempo = rhService.calcularTempoEmpresa(dataAdmissao.toISOString().split('T')[0]);
      
      expect(tempo.anos).toBe(1);
      expect(tempo.meses).toBeGreaterThanOrEqual(5);
    });
  });

  describe('calcularIdade()', () => {
    it('deve calcular idade corretamente', () => {
      const dataNascimento = new Date();
      dataNascimento.setFullYear(dataNascimento.getFullYear() - 30);
      
      const idade = rhService.calcularIdade(dataNascimento.toISOString().split('T')[0]);
      
      expect(idade).toBe(30);
    });
  });

  describe('calcularFerias()', () => {
    it('deve calcular férias para funcionário com mais de 1 ano', () => {
      const dataAdmissao = new Date();
      dataAdmissao.setFullYear(dataAdmissao.getFullYear() - 2);
      
      const ferias = rhService.calcularFerias(dataAdmissao.toISOString().split('T')[0]);
      
      expect(ferias.periodosCompletos).toBe(2);
      expect(ferias.diasDisponiveis).toBe(60);
    });

    it('deve calcular férias proporcionais para menos de 1 ano', () => {
      const dataAdmissao = new Date();
      dataAdmissao.setMonth(dataAdmissao.getMonth() - 6);
      
      const ferias = rhService.calcularFerias(dataAdmissao.toISOString().split('T')[0]);
      
      expect(ferias.periodosCompletos).toBe(0);
      expect(ferias.diasProporcionais).toBeGreaterThan(0);
      expect(ferias.diasProporcionais).toBeLessThan(30);
    });
  });

  describe('calcularDecimo()', () => {
    it('deve calcular décimo terceiro proporcional', () => {
      // 6 meses trabalhados com salário de 3000
      const decimo = rhService.calcularDecimo(3000, 6);
      
      // 3000/12 * 6 = 1500
      expect(decimo).toBe(1500);
    });

    it('deve limitar a 12 meses', () => {
      const decimo = rhService.calcularDecimo(2400, 14);
      
      // Deve considerar apenas 12 meses
      expect(decimo).toBe(2400);
    });
  });

  describe('podeDesligar()', () => {
    it('deve permitir desligar funcionário ativo', () => {
      expect(rhService.podeDesligar({ status: 'ativo' } as Funcionario)).toBe(true);
    });

    it('não deve permitir desligar funcionário já desligado', () => {
      expect(rhService.podeDesligar({ status: 'desligado' } as Funcionario)).toBe(false);
    });

    it('não deve permitir desligar funcionário de férias', () => {
      expect(rhService.podeDesligar({ status: 'ferias' } as Funcionario)).toBe(false);
    });
  });

  describe('gerarMatricula()', () => {
    it('deve gerar matrícula no formato correto', () => {
      expect(rhService.gerarMatricula(1, 2025)).toBe('202500001');
      expect(rhService.gerarMatricula(123, 2025)).toBe('202500123');
    });
  });
});
