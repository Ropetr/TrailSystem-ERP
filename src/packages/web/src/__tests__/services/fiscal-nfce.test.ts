// =============================================
// PLANAC ERP - Testes do Serviço de NFC-e
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface ItemNFCe {
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
}

interface Pagamento {
  tipo: 'dinheiro' | 'credito' | 'debito' | 'pix' | 'outros';
  valor: number;
}

const nfceService = {
  emitir: async (dados: {
    cpf_cliente?: string;
    itens: ItemNFCe[];
    pagamentos: Pagamento[];
    troco: number;
  }) => {
    const response = await fetch('/api/fiscal/nfce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  cancelar: async (id: string, motivo: string) => {
    const response = await fetch(`/api/fiscal/nfce/${id}/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    });
    return response.json();
  },
  
  gerarDANFCe: async (id: string) => {
    const response = await fetch(`/api/fiscal/nfce/${id}/danfce`);
    return response.json();
  },
  
  calcularTotalVenda: (itens: ItemNFCe[]) => {
    return itens.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0);
  },
  
  calcularTroco: (totalVenda: number, totalPago: number) => {
    return Math.max(0, totalPago - totalVenda);
  },
  
  calcularFaltaPagar: (totalVenda: number, totalPago: number) => {
    return Math.max(0, totalVenda - totalPago);
  },
  
  validarPagamento: (totalVenda: number, pagamentos: Pagamento[]) => {
    const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
    
    if (totalPago < totalVenda) {
      return { valid: false, error: 'Valor pago insuficiente' };
    }
    
    // Troco só é permitido em pagamento com dinheiro
    if (totalPago > totalVenda) {
      const temDinheiro = pagamentos.some(p => p.tipo === 'dinheiro');
      if (!temDinheiro) {
        return { valid: false, error: 'Troco só é permitido para pagamento em dinheiro' };
      }
    }
    
    return { valid: true };
  },
  
  validarCPF: (cpf: string) => {
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numeros)) return false;
    
    // Validar dígitos verificadores
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
  
  getTipoPagamentoLabel: (tipo: string) => {
    const labels: Record<string, string> = {
      dinheiro: 'Dinheiro',
      credito: 'Cartão de Crédito',
      debito: 'Cartão de Débito',
      pix: 'PIX',
      outros: 'Outros',
    };
    return labels[tipo] || tipo;
  },
  
  // Código de meio de pagamento para XML da NFC-e
  getCodigoMeioPagamento: (tipo: string) => {
    const codigos: Record<string, string> = {
      dinheiro: '01',
      credito: '03',
      debito: '04',
      pix: '17',
      outros: '99',
    };
    return codigos[tipo] || '99';
  },
};

describe('Serviço de NFC-e', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('emitir()', () => {
    it('deve emitir NFC-e com sucesso', async () => {
      const dados = {
        itens: [
          { produto_id: '1', quantidade: 2, valor_unitario: 50 },
        ],
        pagamentos: [
          { tipo: 'dinheiro' as const, valor: 100 },
        ],
        troco: 0,
      };
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ 
          success: true, 
          data: { numero: 1, chave_acesso: '35...' } 
        }),
      });

      const result = await nfceService.emitir(dados);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/fiscal/nfce', expect.objectContaining({
        method: 'POST',
      }));
      expect(result.success).toBe(true);
    });

    it('deve emitir NFC-e com CPF na nota', async () => {
      const dados = {
        cpf_cliente: '12345678909',
        itens: [{ produto_id: '1', quantidade: 1, valor_unitario: 100 }],
        pagamentos: [{ tipo: 'pix' as const, valor: 100 }],
        troco: 0,
      };
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await nfceService.emitir(dados);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.cpf_cliente).toBe('12345678909');
    });
  });

  describe('calcularTotalVenda()', () => {
    it('deve calcular total corretamente', () => {
      const itens: ItemNFCe[] = [
        { produto_id: '1', quantidade: 2, valor_unitario: 50 },
        { produto_id: '2', quantidade: 3, valor_unitario: 30 },
      ];
      
      expect(nfceService.calcularTotalVenda(itens)).toBe(190);
    });

    it('deve retornar 0 para venda sem itens', () => {
      expect(nfceService.calcularTotalVenda([])).toBe(0);
    });
  });

  describe('calcularTroco()', () => {
    it('deve calcular troco corretamente', () => {
      expect(nfceService.calcularTroco(80, 100)).toBe(20);
    });

    it('deve retornar 0 se valor exato', () => {
      expect(nfceService.calcularTroco(100, 100)).toBe(0);
    });

    it('deve retornar 0 se pago menos (não tem troco negativo)', () => {
      expect(nfceService.calcularTroco(100, 80)).toBe(0);
    });
  });

  describe('calcularFaltaPagar()', () => {
    it('deve calcular valor faltante', () => {
      expect(nfceService.calcularFaltaPagar(100, 80)).toBe(20);
    });

    it('deve retornar 0 se pagou suficiente', () => {
      expect(nfceService.calcularFaltaPagar(100, 100)).toBe(0);
      expect(nfceService.calcularFaltaPagar(100, 120)).toBe(0);
    });
  });

  describe('validarPagamento()', () => {
    it('deve aceitar pagamento exato', () => {
      const result = nfceService.validarPagamento(100, [
        { tipo: 'pix', valor: 100 },
      ]);
      expect(result.valid).toBe(true);
    });

    it('deve aceitar troco em dinheiro', () => {
      const result = nfceService.validarPagamento(80, [
        { tipo: 'dinheiro', valor: 100 },
      ]);
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar troco sem dinheiro', () => {
      const result = nfceService.validarPagamento(80, [
        { tipo: 'pix', valor: 100 },
      ]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dinheiro');
    });

    it('deve rejeitar pagamento insuficiente', () => {
      const result = nfceService.validarPagamento(100, [
        { tipo: 'dinheiro', valor: 50 },
      ]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('insuficiente');
    });

    it('deve aceitar múltiplas formas de pagamento', () => {
      const result = nfceService.validarPagamento(150, [
        { tipo: 'credito', valor: 100 },
        { tipo: 'dinheiro', valor: 60 },
      ]);
      expect(result.valid).toBe(true);
    });
  });

  describe('validarCPF()', () => {
    it('deve validar CPF correto', () => {
      expect(nfceService.validarCPF('529.982.247-25')).toBe(true);
      expect(nfceService.validarCPF('52998224725')).toBe(true);
    });

    it('deve rejeitar CPF inválido', () => {
      expect(nfceService.validarCPF('111.111.111-11')).toBe(false);
      expect(nfceService.validarCPF('123.456.789-00')).toBe(false);
    });

    it('deve rejeitar CPF com tamanho incorreto', () => {
      expect(nfceService.validarCPF('12345')).toBe(false);
    });
  });

  describe('formatarCPF()', () => {
    it('deve formatar CPF corretamente', () => {
      expect(nfceService.formatarCPF('52998224725')).toBe('529.982.247-25');
    });
  });

  describe('getCodigoMeioPagamento()', () => {
    it('deve retornar códigos corretos para XML', () => {
      expect(nfceService.getCodigoMeioPagamento('dinheiro')).toBe('01');
      expect(nfceService.getCodigoMeioPagamento('credito')).toBe('03');
      expect(nfceService.getCodigoMeioPagamento('debito')).toBe('04');
      expect(nfceService.getCodigoMeioPagamento('pix')).toBe('17');
    });
  });
});
