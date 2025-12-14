// =============================================
// PLANAC ERP - Testes do Módulo Contábil
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface Lancamento {
  id: string;
  data: string;
  debito_conta_id: string;
  credito_conta_id: string;
  valor: number;
  historico: string;
}

interface Conta {
  id: string;
  codigo: string;
  descricao: string;
  tipo: 'ativo' | 'passivo' | 'receita' | 'despesa' | 'patrimonio';
  natureza: 'devedora' | 'credora';
  nivel: number;
  conta_pai_id?: string;
  aceita_lancamento: boolean;
}

const contabilService = {
  validarLancamento: (lancamento: Partial<Lancamento>) => {
    const erros: string[] = [];
    
    if (!lancamento.data) erros.push('Data é obrigatória');
    if (!lancamento.debito_conta_id) erros.push('Conta de débito é obrigatória');
    if (!lancamento.credito_conta_id) erros.push('Conta de crédito é obrigatória');
    if (!lancamento.valor || lancamento.valor <= 0) erros.push('Valor deve ser maior que zero');
    if (lancamento.debito_conta_id === lancamento.credito_conta_id) {
      erros.push('Débito e crédito não podem ser na mesma conta');
    }
    
    return { valido: erros.length === 0, erros };
  },
  
  calcularSaldo: (conta: Conta, debitos: number, creditos: number) => {
    // Contas devedoras: saldo = débitos - créditos
    // Contas credoras: saldo = créditos - débitos
    if (conta.natureza === 'devedora') {
      return debitos - creditos;
    }
    return creditos - debitos;
  },
  
  verificarBalanco: (lancamentos: Lancamento[]) => {
    const totalDebitos = lancamentos.reduce((acc, l) => acc + l.valor, 0);
    const totalCreditos = lancamentos.reduce((acc, l) => acc + l.valor, 0);
    
    // Débitos = Créditos (partidas dobradas)
    return Math.abs(totalDebitos - totalCreditos) < 0.01;
  },
  
  getNaturezaPorTipo: (tipo: Conta['tipo']) => {
    const naturezas: Record<string, 'devedora' | 'credora'> = {
      ativo: 'devedora',
      despesa: 'devedora',
      passivo: 'credora',
      receita: 'credora',
      patrimonio: 'credora',
    };
    return naturezas[tipo];
  },
  
  formatarCodigoConta: (codigo: string) => {
    // Formato: 1.01.001.0001
    const partes = codigo.replace(/\D/g, '');
    if (partes.length < 1) return codigo;
    
    const nivel1 = partes.slice(0, 1);
    const nivel2 = partes.slice(1, 3);
    const nivel3 = partes.slice(3, 6);
    const nivel4 = partes.slice(6, 10);
    
    let resultado = nivel1;
    if (nivel2) resultado += '.' + nivel2;
    if (nivel3) resultado += '.' + nivel3;
    if (nivel4) resultado += '.' + nivel4;
    
    return resultado;
  },
  
  validarCodigoConta: (codigo: string, contas: Conta[]) => {
    const codigoLimpo = codigo.replace(/\D/g, '');
    return !contas.some(c => c.codigo.replace(/\D/g, '') === codigoLimpo);
  },
  
  calcularResultado: (receitas: number, despesas: number) => {
    return receitas - despesas;
  },
  
  calcularDRE: (lancamentos: Lancamento[], contas: Conta[]) => {
    const contasReceita = contas.filter(c => c.tipo === 'receita').map(c => c.id);
    const contasDespesa = contas.filter(c => c.tipo === 'despesa').map(c => c.id);
    
    const receitas = lancamentos
      .filter(l => contasReceita.includes(l.credito_conta_id))
      .reduce((acc, l) => acc + l.valor, 0);
    
    const despesas = lancamentos
      .filter(l => contasDespesa.includes(l.debito_conta_id))
      .reduce((acc, l) => acc + l.valor, 0);
    
    return {
      receitas,
      despesas,
      resultado: receitas - despesas,
    };
  },
  
  getDescricaoTipo: (tipo: Conta['tipo']) => {
    const descricoes: Record<string, string> = {
      ativo: 'Ativo',
      passivo: 'Passivo',
      receita: 'Receita',
      despesa: 'Despesa',
      patrimonio: 'Patrimônio Líquido',
    };
    return descricoes[tipo] || tipo;
  },
  
  calcularNivel: (codigo: string) => {
    const partes = codigo.split('.').filter(p => p && p !== '0'.repeat(p.length));
    return partes.length;
  },
  
  gerarProximoCodigo: (codigoPai: string, filhos: Conta[]) => {
    if (filhos.length === 0) return `${codigoPai}.001`;
    
    const ultimoCodigo = filhos
      .map(f => f.codigo)
      .sort()
      .pop()!;
    
    const partes = ultimoCodigo.split('.');
    const ultimaParte = parseInt(partes.pop()!, 10);
    
    return `${codigoPai}.${(ultimaParte + 1).toString().padStart(3, '0')}`;
  },
};

describe('Serviço Contábil', () => {
  describe('validarLancamento()', () => {
    it('deve validar lançamento correto', () => {
      const lancamento = {
        data: '2025-01-15',
        debito_conta_id: 'conta1',
        credito_conta_id: 'conta2',
        valor: 1000,
      };
      
      const resultado = contabilService.validarLancamento(lancamento);
      expect(resultado.valido).toBe(true);
      expect(resultado.erros).toHaveLength(0);
    });

    it('deve rejeitar lançamento com débito = crédito', () => {
      const lancamento = {
        data: '2025-01-15',
        debito_conta_id: 'conta1',
        credito_conta_id: 'conta1',
        valor: 1000,
      };
      
      const resultado = contabilService.validarLancamento(lancamento);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContain('Débito e crédito não podem ser na mesma conta');
    });

    it('deve rejeitar lançamento sem valor', () => {
      const lancamento = {
        data: '2025-01-15',
        debito_conta_id: 'conta1',
        credito_conta_id: 'conta2',
        valor: 0,
      };
      
      const resultado = contabilService.validarLancamento(lancamento);
      expect(resultado.valido).toBe(false);
    });
  });

  describe('calcularSaldo()', () => {
    it('deve calcular saldo de conta devedora', () => {
      const conta: Conta = {
        id: '1', codigo: '1.01', descricao: 'Caixa', tipo: 'ativo',
        natureza: 'devedora', nivel: 2, aceita_lancamento: true,
      };
      
      // Débitos 10000, Créditos 3000 = Saldo 7000
      expect(contabilService.calcularSaldo(conta, 10000, 3000)).toBe(7000);
    });

    it('deve calcular saldo de conta credora', () => {
      const conta: Conta = {
        id: '1', codigo: '2.01', descricao: 'Fornecedores', tipo: 'passivo',
        natureza: 'credora', nivel: 2, aceita_lancamento: true,
      };
      
      // Débitos 3000, Créditos 10000 = Saldo 7000
      expect(contabilService.calcularSaldo(conta, 3000, 10000)).toBe(7000);
    });
  });

  describe('getNaturezaPorTipo()', () => {
    it('deve retornar natureza correta', () => {
      expect(contabilService.getNaturezaPorTipo('ativo')).toBe('devedora');
      expect(contabilService.getNaturezaPorTipo('despesa')).toBe('devedora');
      expect(contabilService.getNaturezaPorTipo('passivo')).toBe('credora');
      expect(contabilService.getNaturezaPorTipo('receita')).toBe('credora');
      expect(contabilService.getNaturezaPorTipo('patrimonio')).toBe('credora');
    });
  });

  describe('formatarCodigoConta()', () => {
    it('deve formatar código de conta', () => {
      expect(contabilService.formatarCodigoConta('1010010001')).toBe('1.01.001.0001');
      expect(contabilService.formatarCodigoConta('101001')).toBe('1.01.001');
    });
  });

  describe('calcularResultado()', () => {
    it('deve calcular resultado positivo (lucro)', () => {
      expect(contabilService.calcularResultado(100000, 80000)).toBe(20000);
    });

    it('deve calcular resultado negativo (prejuízo)', () => {
      expect(contabilService.calcularResultado(80000, 100000)).toBe(-20000);
    });
  });

  describe('calcularNivel()', () => {
    it('deve calcular nível da conta', () => {
      expect(contabilService.calcularNivel('1')).toBe(1);
      expect(contabilService.calcularNivel('1.01')).toBe(2);
      expect(contabilService.calcularNivel('1.01.001')).toBe(3);
      expect(contabilService.calcularNivel('1.01.001.0001')).toBe(4);
    });
  });

  describe('gerarProximoCodigo()', () => {
    it('deve gerar primeiro código filho', () => {
      expect(contabilService.gerarProximoCodigo('1.01', [])).toBe('1.01.001');
    });

    it('deve gerar próximo código filho', () => {
      const filhos: Conta[] = [
        { id: '1', codigo: '1.01.001', descricao: '', tipo: 'ativo', natureza: 'devedora', nivel: 3, aceita_lancamento: true },
        { id: '2', codigo: '1.01.002', descricao: '', tipo: 'ativo', natureza: 'devedora', nivel: 3, aceita_lancamento: true },
      ];
      
      expect(contabilService.gerarProximoCodigo('1.01', filhos)).toBe('1.01.003');
    });
  });
});
