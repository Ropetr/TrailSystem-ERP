// =============================================
// PLANAC ERP - Testes de BI e Indicadores
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface Venda {
  data: string;
  valor: number;
  quantidade: number;
}

interface Indicador {
  valor_atual: number;
  valor_anterior: number;
  meta?: number;
}

const biService = {
  // === CÁLCULOS DE VENDAS ===
  calcularTotalVendas: (vendas: Venda[]) => {
    return vendas.reduce((acc, v) => acc + v.valor, 0);
  },
  
  calcularTicketMedio: (vendas: Venda[]) => {
    if (vendas.length === 0) return 0;
    const total = vendas.reduce((acc, v) => acc + v.valor, 0);
    return total / vendas.length;
  },
  
  calcularQuantidadeVendas: (vendas: Venda[]) => {
    return vendas.reduce((acc, v) => acc + v.quantidade, 0);
  },
  
  calcularVariacaoPercentual: (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / anterior) * 100;
  },
  
  // === CÁLCULOS DE METAS ===
  calcularProgressoMeta: (realizado: number, meta: number) => {
    if (meta === 0) return 0;
    return (realizado / meta) * 100;
  },
  
  calcularMetaDiaria: (metaMensal: number, diasUteis: number = 22) => {
    return metaMensal / diasUteis;
  },
  
  calcularProjecaoMes: (realizadoAtual: number, diasPassados: number, diasTotais: number) => {
    if (diasPassados === 0) return 0;
    const mediaDiaria = realizadoAtual / diasPassados;
    return mediaDiaria * diasTotais;
  },
  
  // === ANÁLISE DE TENDÊNCIA ===
  calcularTendencia: (valores: number[]) => {
    if (valores.length < 2) return 'estavel';
    
    const ultimos3 = valores.slice(-3);
    const media = ultimos3.reduce((a, b) => a + b, 0) / ultimos3.length;
    const ultimoValor = valores[valores.length - 1];
    const penultimoValor = valores[valores.length - 2];
    
    if (ultimoValor > penultimoValor * 1.05) return 'alta';
    if (ultimoValor < penultimoValor * 0.95) return 'baixa';
    return 'estavel';
  },
  
  calcularMediaMovel: (valores: number[], periodo: number = 3) => {
    if (valores.length < periodo) return valores[valores.length - 1] || 0;
    
    const ultimosN = valores.slice(-periodo);
    return ultimosN.reduce((a, b) => a + b, 0) / periodo;
  },
  
  // === INDICADORES FINANCEIROS ===
  calcularMargemLucro: (receita: number, custo: number) => {
    if (receita === 0) return 0;
    return ((receita - custo) / receita) * 100;
  },
  
  calcularROI: (lucro: number, investimento: number) => {
    if (investimento === 0) return 0;
    return (lucro / investimento) * 100;
  },
  
  calcularLiquidezCorrente: (ativoCirculante: number, passivoCirculante: number) => {
    if (passivoCirculante === 0) return 0;
    return ativoCirculante / passivoCirculante;
  },
  
  // === INDICADORES DE ESTOQUE ===
  calcularGiroEstoque: (custoMercadoriasVendidas: number, estoqueMedia: number) => {
    if (estoqueMedia === 0) return 0;
    return custoMercadoriasVendidas / estoqueMedia;
  },
  
  calcularDiasEstoque: (estoqueAtual: number, vendaMediaDiaria: number) => {
    if (vendaMediaDiaria === 0) return Infinity;
    return estoqueAtual / vendaMediaDiaria;
  },
  
  calcularCobertura: (estoque: number, consumoMedio: number) => {
    if (consumoMedio === 0) return Infinity;
    return estoque / consumoMedio;
  },
  
  // === INDICADORES DE CLIENTES ===
  calcularTaxaRetencao: (clientesIniciais: number, novosClientes: number, clientesFinais: number) => {
    if (clientesIniciais === 0) return 0;
    const clientesPerdidos = (clientesIniciais + novosClientes) - clientesFinais;
    return ((clientesIniciais - clientesPerdidos) / clientesIniciais) * 100;
  },
  
  calcularLTV: (ticketMedio: number, frequenciaCompra: number, tempoRetencaoMeses: number) => {
    return ticketMedio * frequenciaCompra * tempoRetencaoMeses;
  },
  
  calcularCAC: (custoMarketing: number, novosClientes: number) => {
    if (novosClientes === 0) return 0;
    return custoMarketing / novosClientes;
  },
  
  // === FORMATAÇÃO ===
  formatarVariacao: (variacao: number) => {
    const sinal = variacao >= 0 ? '+' : '';
    return `${sinal}${variacao.toFixed(1)}%`;
  },
  
  classificarDesempenho: (progresso: number) => {
    if (progresso >= 100) return 'excelente';
    if (progresso >= 80) return 'bom';
    if (progresso >= 60) return 'regular';
    return 'critico';
  },
};

describe('Serviço de BI', () => {
  describe('calcularTotalVendas()', () => {
    it('deve somar todas as vendas', () => {
      const vendas: Venda[] = [
        { data: '2025-01-01', valor: 1000, quantidade: 5 },
        { data: '2025-01-02', valor: 2000, quantidade: 10 },
        { data: '2025-01-03', valor: 1500, quantidade: 7 },
      ];
      
      expect(biService.calcularTotalVendas(vendas)).toBe(4500);
    });
  });

  describe('calcularTicketMedio()', () => {
    it('deve calcular ticket médio', () => {
      const vendas: Venda[] = [
        { data: '2025-01-01', valor: 100, quantidade: 1 },
        { data: '2025-01-02', valor: 200, quantidade: 1 },
        { data: '2025-01-03', valor: 300, quantidade: 1 },
      ];
      
      expect(biService.calcularTicketMedio(vendas)).toBe(200);
    });

    it('deve retornar 0 para lista vazia', () => {
      expect(biService.calcularTicketMedio([])).toBe(0);
    });
  });

  describe('calcularVariacaoPercentual()', () => {
    it('deve calcular variação positiva', () => {
      expect(biService.calcularVariacaoPercentual(120, 100)).toBe(20);
    });

    it('deve calcular variação negativa', () => {
      expect(biService.calcularVariacaoPercentual(80, 100)).toBe(-20);
    });

    it('deve tratar valor anterior zero', () => {
      expect(biService.calcularVariacaoPercentual(100, 0)).toBe(100);
      expect(biService.calcularVariacaoPercentual(0, 0)).toBe(0);
    });
  });

  describe('calcularProgressoMeta()', () => {
    it('deve calcular progresso', () => {
      expect(biService.calcularProgressoMeta(7500, 10000)).toBe(75);
      expect(biService.calcularProgressoMeta(10000, 10000)).toBe(100);
      expect(biService.calcularProgressoMeta(12000, 10000)).toBe(120);
    });
  });

  describe('calcularProjecaoMes()', () => {
    it('deve projetar valor para o mês', () => {
      // R$15000 em 15 dias, projetando para 30 dias
      const projecao = biService.calcularProjecaoMes(15000, 15, 30);
      expect(projecao).toBe(30000);
    });
  });

  describe('calcularTendencia()', () => {
    it('deve identificar tendência de alta', () => {
      expect(biService.calcularTendencia([100, 105, 115, 130])).toBe('alta');
    });

    it('deve identificar tendência de baixa', () => {
      expect(biService.calcularTendencia([130, 115, 105, 90])).toBe('baixa');
    });

    it('deve identificar estabilidade', () => {
      expect(biService.calcularTendencia([100, 101, 99, 100])).toBe('estavel');
    });
  });

  describe('calcularMediaMovel()', () => {
    it('deve calcular média móvel de 3 períodos', () => {
      const valores = [100, 110, 120, 130, 140];
      // Média dos últimos 3: (120 + 130 + 140) / 3 = 130
      expect(biService.calcularMediaMovel(valores, 3)).toBeCloseTo(130);
    });
  });

  describe('calcularMargemLucro()', () => {
    it('deve calcular margem de lucro', () => {
      // Receita 1000, Custo 700 = Margem 30%
      expect(biService.calcularMargemLucro(1000, 700)).toBe(30);
    });
  });

  describe('calcularROI()', () => {
    it('deve calcular ROI', () => {
      // Lucro 500, Investimento 1000 = ROI 50%
      expect(biService.calcularROI(500, 1000)).toBe(50);
    });
  });

  describe('calcularGiroEstoque()', () => {
    it('deve calcular giro de estoque', () => {
      // CMV 120000, Estoque Médio 30000 = Giro 4x
      expect(biService.calcularGiroEstoque(120000, 30000)).toBe(4);
    });
  });

  describe('calcularLTV()', () => {
    it('deve calcular lifetime value do cliente', () => {
      // Ticket 500, Frequência 2x/mês, 24 meses = LTV 24000
      expect(biService.calcularLTV(500, 2, 24)).toBe(24000);
    });
  });

  describe('calcularCAC()', () => {
    it('deve calcular custo de aquisição', () => {
      // Marketing 10000, 50 novos clientes = CAC 200
      expect(biService.calcularCAC(10000, 50)).toBe(200);
    });
  });

  describe('classificarDesempenho()', () => {
    it('deve classificar desempenho corretamente', () => {
      expect(biService.classificarDesempenho(105)).toBe('excelente');
      expect(biService.classificarDesempenho(85)).toBe('bom');
      expect(biService.classificarDesempenho(65)).toBe('regular');
      expect(biService.classificarDesempenho(50)).toBe('critico');
    });
  });
});
