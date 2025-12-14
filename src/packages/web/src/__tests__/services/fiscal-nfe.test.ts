// =============================================
// PLANAC ERP - Testes do Serviço de NF-e
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface ItemNFe {
  produto_id: string;
  ncm: string;
  cfop: string;
  quantidade: number;
  valor_unitario: number;
}

const nfeService = {
  listar: async (filtros?: { status?: string; tipo?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.status) params.append('status', filtros.status);
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    
    const response = await fetch(`/api/fiscal/notas?${params}`);
    return response.json();
  },
  
  emitir: async (notaId: string) => {
    const response = await fetch(`/api/fiscal/notas/${notaId}/emitir`, {
      method: 'POST',
    });
    return response.json();
  },
  
  cancelar: async (notaId: string, motivo: string) => {
    const response = await fetch(`/api/fiscal/notas/${notaId}/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    });
    return response.json();
  },
  
  consultarChave: async (chaveAcesso: string) => {
    const response = await fetch(`/api/fiscal/consultar/${chaveAcesso}`);
    return response.json();
  },
  
  gerarDANFE: async (notaId: string) => {
    const response = await fetch(`/api/fiscal/notas/${notaId}/danfe`);
    return response.json();
  },
  
  downloadXML: async (notaId: string) => {
    const response = await fetch(`/api/fiscal/notas/${notaId}/xml`);
    return response.json();
  },
  
  validarChaveAcesso: (chave: string) => {
    // Chave de acesso tem 44 dígitos
    const apenasNumeros = chave.replace(/\D/g, '');
    return apenasNumeros.length === 44;
  },
  
  extrairDadosChave: (chave: string) => {
    if (!nfeService.validarChaveAcesso(chave)) return null;
    
    const numeros = chave.replace(/\D/g, '');
    return {
      uf: numeros.substring(0, 2),
      anoMes: numeros.substring(2, 6),
      cnpj: numeros.substring(6, 20),
      modelo: numeros.substring(20, 22),
      serie: parseInt(numeros.substring(22, 25)),
      numero: parseInt(numeros.substring(25, 34)),
      tipoEmissao: numeros.substring(34, 35),
      codigoNumerico: numeros.substring(35, 43),
      digitoVerificador: numeros.substring(43, 44),
    };
  },
  
  calcularICMS: (baseCalculo: number, aliquota: number) => {
    return baseCalculo * (aliquota / 100);
  },
  
  calcularPIS: (baseCalculo: number, aliquota: number = 1.65) => {
    return baseCalculo * (aliquota / 100);
  },
  
  calcularCOFINS: (baseCalculo: number, aliquota: number = 7.6) => {
    return baseCalculo * (aliquota / 100);
  },
  
  validarCFOP: (cfop: string, operacao: 'entrada' | 'saida', destino: 'interno' | 'interestadual' | 'exterior') => {
    const primeiro = cfop.charAt(0);
    
    // CFOP começa com 1-3 para entrada, 5-7 para saída
    if (operacao === 'entrada') {
      if (!['1', '2', '3'].includes(primeiro)) return false;
    } else {
      if (!['5', '6', '7'].includes(primeiro)) return false;
    }
    
    // Validar destino
    if (destino === 'interno' && !['1', '5'].includes(primeiro)) return false;
    if (destino === 'interestadual' && !['2', '6'].includes(primeiro)) return false;
    if (destino === 'exterior' && !['3', '7'].includes(primeiro)) return false;
    
    return true;
  },
  
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      rascunho: 'Rascunho',
      validando: 'Validando',
      autorizada: 'Autorizada',
      rejeitada: 'Rejeitada',
      cancelada: 'Cancelada',
      inutilizada: 'Inutilizada',
    };
    return labels[status] || status;
  },
  
  podeCancelar: (status: string, dataAutorizacao?: string) => {
    if (status !== 'autorizada') return false;
    if (!dataAutorizacao) return false;
    
    // Cancelamento até 24h após autorização
    const horasDesdeAutorizacao = (Date.now() - new Date(dataAutorizacao).getTime()) / (1000 * 60 * 60);
    return horasDesdeAutorizacao <= 24;
  },
};

describe('Serviço de NF-e', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('listar()', () => {
    it('deve listar todas as notas', async () => {
      const mockNotas = [
        { id: '1', numero: 1, status: 'autorizada' },
        { id: '2', numero: 2, status: 'rascunho' },
      ];
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockNotas }),
      });

      const result = await nfeService.listar();
      
      expect(result.data).toHaveLength(2);
    });

    it('deve filtrar por status', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await nfeService.listar({ status: 'autorizada' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/fiscal/notas?status=autorizada');
    });
  });

  describe('emitir()', () => {
    it('deve emitir nota fiscal', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ 
          success: true, 
          data: { protocolo: '123456', chave_acesso: '35...' } 
        }),
      });

      const result = await nfeService.emitir('123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/fiscal/notas/123/emitir', { method: 'POST' });
      expect(result.success).toBe(true);
    });
  });

  describe('cancelar()', () => {
    it('deve cancelar nota com motivo', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await nfeService.cancelar('123', 'Erro no pedido do cliente');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/fiscal/notas/123/cancelar', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ motivo: 'Erro no pedido do cliente' }),
      }));
    });
  });

  describe('validarChaveAcesso()', () => {
    it('deve validar chave com 44 dígitos', () => {
      const chaveValida = '35231012345678000195550010000001231234567890';
      expect(nfeService.validarChaveAcesso(chaveValida)).toBe(true);
    });

    it('deve rejeitar chave inválida', () => {
      expect(nfeService.validarChaveAcesso('12345')).toBe(false);
      expect(nfeService.validarChaveAcesso('')).toBe(false);
    });
  });

  describe('extrairDadosChave()', () => {
    it('deve extrair dados da chave de acesso', () => {
      const chave = '35231012345678000195550010000001231234567890';
      const dados = nfeService.extrairDadosChave(chave);
      
      expect(dados).not.toBeNull();
      expect(dados?.uf).toBe('35'); // São Paulo
      expect(dados?.modelo).toBe('55'); // NF-e
      expect(dados?.serie).toBe(1);
    });

    it('deve retornar null para chave inválida', () => {
      expect(nfeService.extrairDadosChave('12345')).toBeNull();
    });
  });

  describe('calcularICMS()', () => {
    it('deve calcular ICMS corretamente', () => {
      expect(nfeService.calcularICMS(1000, 18)).toBe(180);
      expect(nfeService.calcularICMS(1000, 12)).toBe(120);
      expect(nfeService.calcularICMS(500, 7)).toBe(35);
    });
  });

  describe('calcularPIS()', () => {
    it('deve calcular PIS com alíquota padrão', () => {
      expect(nfeService.calcularPIS(1000)).toBe(16.5);
    });

    it('deve calcular PIS com alíquota customizada', () => {
      expect(nfeService.calcularPIS(1000, 0.65)).toBe(6.5);
    });
  });

  describe('calcularCOFINS()', () => {
    it('deve calcular COFINS com alíquota padrão', () => {
      expect(nfeService.calcularCOFINS(1000)).toBe(76);
    });
  });

  describe('validarCFOP()', () => {
    it('deve validar CFOP de saída interna', () => {
      expect(nfeService.validarCFOP('5102', 'saida', 'interno')).toBe(true);
      expect(nfeService.validarCFOP('5405', 'saida', 'interno')).toBe(true);
    });

    it('deve validar CFOP de saída interestadual', () => {
      expect(nfeService.validarCFOP('6102', 'saida', 'interestadual')).toBe(true);
    });

    it('deve rejeitar CFOP incorreto', () => {
      expect(nfeService.validarCFOP('5102', 'entrada', 'interno')).toBe(false);
      expect(nfeService.validarCFOP('6102', 'saida', 'interno')).toBe(false);
    });
  });

  describe('podeCancelar()', () => {
    it('deve permitir cancelar nota autorizada recente', () => {
      const dataRecente = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2h atrás
      expect(nfeService.podeCancelar('autorizada', dataRecente)).toBe(true);
    });

    it('deve bloquear cancelar nota após 24h', () => {
      const dataAntiga = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(); // 30h atrás
      expect(nfeService.podeCancelar('autorizada', dataAntiga)).toBe(false);
    });

    it('deve bloquear cancelar nota não autorizada', () => {
      expect(nfeService.podeCancelar('rascunho', undefined)).toBe(false);
      expect(nfeService.podeCancelar('cancelada', undefined)).toBe(false);
    });
  });

  describe('getStatusLabel()', () => {
    it('deve retornar labels corretos', () => {
      expect(nfeService.getStatusLabel('autorizada')).toBe('Autorizada');
      expect(nfeService.getStatusLabel('rejeitada')).toBe('Rejeitada');
      expect(nfeService.getStatusLabel('cancelada')).toBe('Cancelada');
    });
  });
});
