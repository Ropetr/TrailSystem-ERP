// =============================================
// PLANAC ERP - Testes do Serviço de Fornecedores
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface Fornecedor {
  id: string;
  cnpj: string;
  razao_social: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
  avaliacao: number;
  categorias: string[];
  total_compras: number;
}

const fornecedoresService = {
  listar: async (filtros?: { status?: string; categoria?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.status) params.append('status', filtros.status);
    if (filtros?.categoria) params.append('categoria', filtros.categoria);
    
    const response = await fetch(`/api/compras/fornecedores?${params}`);
    return response.json();
  },
  
  buscarPorCNPJ: async (cnpj: string) => {
    const response = await fetch(`/api/integracoes/cnpj/${cnpj}`);
    return response.json();
  },
  
  criar: async (dados: any) => {
    const response = await fetch('/api/compras/fornecedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  alterarStatus: async (fornecedorId: string, status: string) => {
    const response = await fetch(`/api/compras/fornecedores/${fornecedorId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return response.json();
  },
  
  validarCNPJ: (cnpj: string) => {
    const numeros = cnpj.replace(/\D/g, '');
    if (numeros.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(numeros)) return false;
    
    // Validação do primeiro dígito verificador
    let soma = 0;
    let peso = 5;
    for (let i = 0; i < 12; i++) {
      soma += parseInt(numeros[i]) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    let resto = soma % 11;
    const dig1 = resto < 2 ? 0 : 11 - resto;
    if (parseInt(numeros[12]) !== dig1) return false;
    
    // Validação do segundo dígito verificador
    soma = 0;
    peso = 6;
    for (let i = 0; i < 13; i++) {
      soma += parseInt(numeros[i]) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    resto = soma % 11;
    const dig2 = resto < 2 ? 0 : 11 - resto;
    if (parseInt(numeros[13]) !== dig2) return false;
    
    return true;
  },
  
  formatarCNPJ: (cnpj: string) => {
    const numeros = cnpj.replace(/\D/g, '');
    return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  },
  
  calcularAvaliacaoMedia: (fornecedores: Fornecedor[]) => {
    if (fornecedores.length === 0) return 0;
    const soma = fornecedores.reduce((acc, f) => acc + f.avaliacao, 0);
    return soma / fornecedores.length;
  },
  
  filtrarPorCategoria: (fornecedores: Fornecedor[], categoria: string) => {
    return fornecedores.filter(f => f.categorias.includes(categoria));
  },
  
  ordenarPorAvaliacao: (fornecedores: Fornecedor[]) => {
    return [...fornecedores].sort((a, b) => b.avaliacao - a.avaliacao);
  },
  
  ordenarPorCompras: (fornecedores: Fornecedor[]) => {
    return [...fornecedores].sort((a, b) => b.total_compras - a.total_compras);
  },
  
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      ativo: 'Ativo',
      inativo: 'Inativo',
      bloqueado: 'Bloqueado',
    };
    return labels[status] || status;
  },
  
  podeComprar: (fornecedor: Fornecedor) => {
    return fornecedor.status === 'ativo';
  },
  
  gerarCodigo: (sequencial: number) => {
    return `FORN${sequencial.toString().padStart(5, '0')}`;
  },
};

describe('Serviço de Fornecedores', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('listar()', () => {
    it('deve listar fornecedores', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await fornecedoresService.listar();
      
      expect(mockFetch).toHaveBeenCalledWith('/api/compras/fornecedores?');
    });

    it('deve filtrar por categoria', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await fornecedoresService.listar({ categoria: 'Drywall' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/compras/fornecedores?categoria=Drywall');
    });
  });

  describe('validarCNPJ()', () => {
    it('deve validar CNPJ correto', () => {
      expect(fornecedoresService.validarCNPJ('11.222.333/0001-81')).toBe(true);
      expect(fornecedoresService.validarCNPJ('11222333000181')).toBe(true);
    });

    it('deve rejeitar CNPJ inválido', () => {
      expect(fornecedoresService.validarCNPJ('11.111.111/1111-11')).toBe(false);
      expect(fornecedoresService.validarCNPJ('12345678901234')).toBe(false);
    });

    it('deve rejeitar CNPJ com tamanho incorreto', () => {
      expect(fornecedoresService.validarCNPJ('123')).toBe(false);
    });
  });

  describe('formatarCNPJ()', () => {
    it('deve formatar CNPJ corretamente', () => {
      expect(fornecedoresService.formatarCNPJ('11222333000181')).toBe('11.222.333/0001-81');
    });
  });

  describe('calcularAvaliacaoMedia()', () => {
    it('deve calcular média de avaliações', () => {
      const fornecedores: Fornecedor[] = [
        { id: '1', cnpj: '', razao_social: '', status: 'ativo', avaliacao: 4, categorias: [], total_compras: 0 },
        { id: '2', cnpj: '', razao_social: '', status: 'ativo', avaliacao: 5, categorias: [], total_compras: 0 },
        { id: '3', cnpj: '', razao_social: '', status: 'ativo', avaliacao: 3, categorias: [], total_compras: 0 },
      ];
      
      expect(fornecedoresService.calcularAvaliacaoMedia(fornecedores)).toBe(4);
    });

    it('deve retornar 0 para lista vazia', () => {
      expect(fornecedoresService.calcularAvaliacaoMedia([])).toBe(0);
    });
  });

  describe('filtrarPorCategoria()', () => {
    it('deve filtrar por categoria', () => {
      const fornecedores: Fornecedor[] = [
        { id: '1', cnpj: '', razao_social: '', status: 'ativo', avaliacao: 4, categorias: ['Drywall', 'Ferramentas'], total_compras: 0 },
        { id: '2', cnpj: '', razao_social: '', status: 'ativo', avaliacao: 5, categorias: ['Elétrica'], total_compras: 0 },
        { id: '3', cnpj: '', razao_social: '', status: 'ativo', avaliacao: 3, categorias: ['Drywall'], total_compras: 0 },
      ];
      
      const filtrados = fornecedoresService.filtrarPorCategoria(fornecedores, 'Drywall');
      
      expect(filtrados).toHaveLength(2);
    });
  });

  describe('ordenarPorAvaliacao()', () => {
    it('deve ordenar por avaliação descendente', () => {
      const fornecedores: Fornecedor[] = [
        { id: '1', cnpj: '', razao_social: '', status: 'ativo', avaliacao: 3, categorias: [], total_compras: 0 },
        { id: '2', cnpj: '', razao_social: '', status: 'ativo', avaliacao: 5, categorias: [], total_compras: 0 },
        { id: '3', cnpj: '', razao_social: '', status: 'ativo', avaliacao: 4, categorias: [], total_compras: 0 },
      ];
      
      const ordenados = fornecedoresService.ordenarPorAvaliacao(fornecedores);
      
      expect(ordenados[0].avaliacao).toBe(5);
      expect(ordenados[1].avaliacao).toBe(4);
      expect(ordenados[2].avaliacao).toBe(3);
    });
  });

  describe('podeComprar()', () => {
    it('deve permitir comprar de fornecedor ativo', () => {
      expect(fornecedoresService.podeComprar({ status: 'ativo' } as Fornecedor)).toBe(true);
    });

    it('não deve permitir comprar de fornecedor bloqueado', () => {
      expect(fornecedoresService.podeComprar({ status: 'bloqueado' } as Fornecedor)).toBe(false);
      expect(fornecedoresService.podeComprar({ status: 'inativo' } as Fornecedor)).toBe(false);
    });
  });

  describe('gerarCodigo()', () => {
    it('deve gerar código no formato correto', () => {
      expect(fornecedoresService.gerarCodigo(1)).toBe('FORN00001');
      expect(fornecedoresService.gerarCodigo(123)).toBe('FORN00123');
    });
  });
});
