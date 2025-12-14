// =============================================
// PLANAC ERP - Testes do Serviço de Boletos
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface Boleto {
  id: string;
  numero: string;
  nosso_numero: string;
  codigo_barras: string;
  linha_digitavel: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'emitido' | 'registrado' | 'pago' | 'vencido' | 'cancelado' | 'protestado';
}

const boletosService = {
  listar: async (filtros?: { status?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.status) params.append('status', filtros.status);
    
    const response = await fetch(`/api/financeiro/boletos?${params}`);
    return response.json();
  },
  
  emitir: async (dados: {
    cliente_id: string;
    valor: number;
    data_vencimento: string;
    descricao?: string;
  }) => {
    const response = await fetch('/api/financeiro/boletos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  cancelar: async (boletoId: string) => {
    const response = await fetch(`/api/financeiro/boletos/${boletoId}/cancelar`, {
      method: 'POST',
    });
    return response.json();
  },
  
  protestar: async (boletoId: string) => {
    const response = await fetch(`/api/financeiro/boletos/${boletoId}/protestar`, {
      method: 'POST',
    });
    return response.json();
  },
  
  sincronizar: async () => {
    const response = await fetch('/api/financeiro/boletos/sincronizar', {
      method: 'POST',
    });
    return response.json();
  },
  
  gerarLinhaDigitavel: (codigoBarras: string) => {
    // Simplificado para testes - formato real é mais complexo
    if (codigoBarras.length !== 44) return '';
    
    const campo1 = codigoBarras.substr(0, 4) + codigoBarras.substr(19, 5);
    const campo2 = codigoBarras.substr(24, 10);
    const campo3 = codigoBarras.substr(34, 10);
    const campo4 = codigoBarras.substr(4, 1);
    const campo5 = codigoBarras.substr(5, 14);
    
    return `${campo1}.${campo2} ${campo3}.${campo4} ${campo5}`;
  },
  
  validarCodigoBarras: (codigo: string) => {
    // Boleto bancário tem 44 dígitos
    if (!/^\d{44}$/.test(codigo)) return false;
    return true;
  },
  
  calcularDiasAtraso: (dataVencimento: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    
    const diff = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  },
  
  calcularJuros: (valor: number, diasAtraso: number, taxaDiaria: number = 0.033) => {
    if (diasAtraso <= 0) return 0;
    return valor * (taxaDiaria / 100) * diasAtraso;
  },
  
  calcularMulta: (valor: number, percentual: number = 2) => {
    return valor * (percentual / 100);
  },
  
  calcularValorAtualizado: (boleto: Boleto) => {
    const diasAtraso = boletosService.calcularDiasAtraso(boleto.data_vencimento);
    
    if (diasAtraso === 0) return boleto.valor;
    
    const juros = boletosService.calcularJuros(boleto.valor, diasAtraso);
    const multa = boletosService.calcularMulta(boleto.valor);
    
    return boleto.valor + juros + multa;
  },
  
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      emitido: 'Emitido',
      registrado: 'Registrado',
      pago: 'Pago',
      vencido: 'Vencido',
      cancelado: 'Cancelado',
      protestado: 'Protestado',
    };
    return labels[status] || status;
  },
  
  podeProtestar: (boleto: Boleto) => {
    // Só pode protestar boleto vencido há mais de 3 dias úteis
    if (boleto.status !== 'vencido') return false;
    
    const diasAtraso = boletosService.calcularDiasAtraso(boleto.data_vencimento);
    return diasAtraso >= 3;
  },
  
  podeCancelar: (boleto: Boleto) => {
    return ['emitido', 'registrado'].includes(boleto.status);
  },
  
  extrairDadosCodigoBarras: (codigo: string) => {
    if (codigo.length !== 44) return null;
    
    return {
      banco: codigo.substr(0, 3),
      moeda: codigo.substr(3, 1),
      dv: codigo.substr(4, 1),
      fatorVencimento: codigo.substr(5, 4),
      valor: parseInt(codigo.substr(9, 10)) / 100,
      campoLivre: codigo.substr(19, 25),
    };
  },
  
  getBancoNome: (codigo: string) => {
    const bancos: Record<string, string> = {
      '001': 'Banco do Brasil',
      '033': 'Santander',
      '104': 'Caixa Econômica',
      '237': 'Bradesco',
      '341': 'Itaú',
      '748': 'Sicredi',
      '756': 'Sicoob',
    };
    return bancos[codigo] || 'Banco Desconhecido';
  },
};

describe('Serviço de Boletos', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('emitir()', () => {
    it('deve emitir novo boleto', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ 
          success: true, 
          data: { id: '1', numero: 'BOL-001' } 
        }),
      });

      const result = await boletosService.emitir({
        cliente_id: 'cli-1',
        valor: 1500,
        data_vencimento: '2025-02-15',
        descricao: 'Venda 001',
      });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/financeiro/boletos', expect.objectContaining({
        method: 'POST',
      }));
      expect(result.success).toBe(true);
    });
  });

  describe('cancelar()', () => {
    it('deve cancelar boleto', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await boletosService.cancelar('bol-123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/financeiro/boletos/bol-123/cancelar', { method: 'POST' });
    });
  });

  describe('protestar()', () => {
    it('deve enviar boleto para protesto', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await boletosService.protestar('bol-123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/financeiro/boletos/bol-123/protestar', { method: 'POST' });
    });
  });

  describe('validarCodigoBarras()', () => {
    it('deve validar código de barras com 44 dígitos', () => {
      const codigoValido = '23793381286000000000100000250010184550000012345';
      expect(boletosService.validarCodigoBarras(codigoValido.substr(0, 44))).toBe(true);
    });

    it('deve rejeitar código com tamanho incorreto', () => {
      expect(boletosService.validarCodigoBarras('123456')).toBe(false);
      expect(boletosService.validarCodigoBarras('')).toBe(false);
    });

    it('deve rejeitar código com letras', () => {
      expect(boletosService.validarCodigoBarras('2379338128600000000010000025001018455000001234A')).toBe(false);
    });
  });

  describe('calcularDiasAtraso()', () => {
    it('deve calcular dias de atraso', () => {
      const cincodiasAtras = new Date();
      cincodiasAtras.setDate(cincodiasAtras.getDate() - 5);
      
      expect(boletosService.calcularDiasAtraso(cincodiasAtras.toISOString().split('T')[0])).toBe(5);
    });

    it('deve retornar 0 para boleto não vencido', () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 10);
      
      expect(boletosService.calcularDiasAtraso(futuro.toISOString().split('T')[0])).toBe(0);
    });
  });

  describe('calcularJuros()', () => {
    it('deve calcular juros de mora', () => {
      // 1000 * 0.033% * 30 dias = 9.90
      expect(boletosService.calcularJuros(1000, 30)).toBeCloseTo(9.9);
    });

    it('deve retornar 0 se não houver atraso', () => {
      expect(boletosService.calcularJuros(1000, 0)).toBe(0);
    });
  });

  describe('calcularMulta()', () => {
    it('deve calcular multa de 2%', () => {
      expect(boletosService.calcularMulta(1000)).toBe(20);
      expect(boletosService.calcularMulta(5000)).toBe(100);
    });
  });

  describe('calcularValorAtualizado()', () => {
    it('deve calcular valor com juros e multa', () => {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 10);
      
      const boleto: Boleto = {
        id: '1',
        numero: 'BOL-001',
        nosso_numero: '000001',
        codigo_barras: '23793381286000000000100000250010184550000012345'.substr(0, 44),
        linha_digitavel: '...',
        valor: 1000,
        data_vencimento: ontem.toISOString().split('T')[0],
        status: 'vencido',
      };
      
      const valorAtualizado = boletosService.calcularValorAtualizado(boleto);
      
      // Valor original + juros (10 dias) + multa (2%)
      // 1000 + (1000 * 0.00033 * 10) + 20 = 1000 + 3.3 + 20 = 1023.3
      expect(valorAtualizado).toBeGreaterThan(1020);
    });

    it('deve retornar valor original se não vencido', () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 10);
      
      const boleto: Boleto = {
        id: '1',
        numero: 'BOL-001',
        nosso_numero: '000001',
        codigo_barras: '23793381286000000000100000250010184550000012345'.substr(0, 44),
        linha_digitavel: '...',
        valor: 1000,
        data_vencimento: futuro.toISOString().split('T')[0],
        status: 'emitido',
      };
      
      expect(boletosService.calcularValorAtualizado(boleto)).toBe(1000);
    });
  });

  describe('podeProtestar()', () => {
    it('deve permitir protesto de boleto vencido há mais de 3 dias', () => {
      const dezDiasAtras = new Date();
      dezDiasAtras.setDate(dezDiasAtras.getDate() - 10);
      
      const boleto: Boleto = {
        id: '1',
        numero: 'BOL-001',
        nosso_numero: '000001',
        codigo_barras: '23793381286000000000100000250010184550000012345'.substr(0, 44),
        linha_digitavel: '...',
        valor: 1000,
        data_vencimento: dezDiasAtras.toISOString().split('T')[0],
        status: 'vencido',
      };
      
      expect(boletosService.podeProtestar(boleto)).toBe(true);
    });

    it('não deve permitir protesto de boleto pago', () => {
      const boleto: Boleto = {
        id: '1',
        numero: 'BOL-001',
        nosso_numero: '000001',
        codigo_barras: '23793381286000000000100000250010184550000012345'.substr(0, 44),
        linha_digitavel: '...',
        valor: 1000,
        data_vencimento: '2025-01-01',
        status: 'pago',
      };
      
      expect(boletosService.podeProtestar(boleto)).toBe(false);
    });
  });

  describe('podeCancelar()', () => {
    it('deve permitir cancelar boleto emitido', () => {
      const boleto: Boleto = {
        id: '1',
        numero: 'BOL-001',
        nosso_numero: '000001',
        codigo_barras: '23793381286000000000100000250010184550000012345'.substr(0, 44),
        linha_digitavel: '...',
        valor: 1000,
        data_vencimento: '2025-02-15',
        status: 'emitido',
      };
      
      expect(boletosService.podeCancelar(boleto)).toBe(true);
    });

    it('não deve permitir cancelar boleto pago', () => {
      const boleto: Boleto = {
        id: '1',
        numero: 'BOL-001',
        nosso_numero: '000001',
        codigo_barras: '23793381286000000000100000250010184550000012345'.substr(0, 44),
        linha_digitavel: '...',
        valor: 1000,
        data_vencimento: '2025-01-01',
        status: 'pago',
      };
      
      expect(boletosService.podeCancelar(boleto)).toBe(false);
    });
  });

  describe('getBancoNome()', () => {
    it('deve retornar nome do banco pelo código', () => {
      expect(boletosService.getBancoNome('001')).toBe('Banco do Brasil');
      expect(boletosService.getBancoNome('341')).toBe('Itaú');
      expect(boletosService.getBancoNome('237')).toBe('Bradesco');
      expect(boletosService.getBancoNome('104')).toBe('Caixa Econômica');
    });

    it('deve retornar "Banco Desconhecido" para código inválido', () => {
      expect(boletosService.getBancoNome('999')).toBe('Banco Desconhecido');
    });
  });
});
