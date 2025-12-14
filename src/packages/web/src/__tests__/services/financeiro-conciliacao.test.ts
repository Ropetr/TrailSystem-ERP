// =============================================
// PLANAC ERP - Testes do Serviço de Conciliação Bancária
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface ExtratoItem {
  id: string;
  data: string;
  descricao: string;
  tipo: 'credito' | 'debito';
  valor: number;
  status: 'pendente' | 'conciliado' | 'ignorado';
  movimentacao_id?: string;
}

interface MovimentacaoSistema {
  id: string;
  data: string;
  descricao: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  conciliado: boolean;
}

const conciliacaoService = {
  importarOFX: async (contaBancariaId: string, arquivo: File) => {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    formData.append('conta_bancaria_id', contaBancariaId);
    
    const response = await fetch('/api/financeiro/conciliacao/importar-ofx', {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },
  
  conciliarAutomatico: async (contaBancariaId: string) => {
    const response = await fetch('/api/financeiro/conciliacao/automatico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conta_bancaria_id: contaBancariaId }),
    });
    return response.json();
  },
  
  conciliarManual: async (extratoId: string, movimentacaoId: string) => {
    const response = await fetch('/api/financeiro/conciliacao/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extrato_id: extratoId, movimentacao_id: movimentacaoId }),
    });
    return response.json();
  },
  
  ignorarLancamento: async (extratoId: string) => {
    const response = await fetch(`/api/financeiro/conciliacao/extrato/${extratoId}/ignorar`, {
      method: 'POST',
    });
    return response.json();
  },
  
  calcularDiferenca: (saldoBanco: number, saldoSistema: number) => {
    return saldoBanco - saldoSistema;
  },
  
  encontrarCorrespondencias: (
    extrato: ExtratoItem,
    movimentacoes: MovimentacaoSistema[],
    toleranciaDias: number = 3
  ) => {
    return movimentacoes.filter(mov => {
      // Tipo deve corresponder
      const tipoCompativel = 
        (extrato.tipo === 'credito' && mov.tipo === 'entrada') ||
        (extrato.tipo === 'debito' && mov.tipo === 'saida');
      
      if (!tipoCompativel) return false;
      
      // Valor deve ser igual
      if (Math.abs(extrato.valor - mov.valor) > 0.01) return false;
      
      // Data deve estar dentro da tolerância
      const dataExtrato = new Date(extrato.data);
      const dataMov = new Date(mov.data);
      const diffDias = Math.abs(dataExtrato.getTime() - dataMov.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDias > toleranciaDias) return false;
      
      // Não pode estar já conciliado
      if (mov.conciliado) return false;
      
      return true;
    });
  },
  
  calcularScoreCorrespondencia: (extrato: ExtratoItem, movimentacao: MovimentacaoSistema) => {
    let score = 0;
    
    // Valor exato
    if (Math.abs(extrato.valor - movimentacao.valor) < 0.01) score += 50;
    
    // Data exata
    const dataExtrato = new Date(extrato.data);
    const dataMov = new Date(movimentacao.data);
    const diffDias = Math.abs(dataExtrato.getTime() - dataMov.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDias === 0) score += 30;
    else if (diffDias <= 1) score += 20;
    else if (diffDias <= 3) score += 10;
    
    // Descrição similar (simplificado)
    const palavrasExtrato = extrato.descricao.toLowerCase().split(' ');
    const palavrasMov = movimentacao.descricao.toLowerCase().split(' ');
    const comuns = palavrasExtrato.filter(p => palavrasMov.includes(p));
    score += Math.min(20, comuns.length * 5);
    
    return score;
  },
  
  getStatusConciliacao: (extrato: ExtratoItem[], movimentacoes: MovimentacaoSistema[]) => {
    const pendentesExtrato = extrato.filter(e => e.status === 'pendente').length;
    const conciliadosExtrato = extrato.filter(e => e.status === 'conciliado').length;
    const pendentesMovimentacoes = movimentacoes.filter(m => !m.conciliado).length;
    
    return {
      pendentesExtrato,
      conciliadosExtrato,
      pendentesMovimentacoes,
      percentualConciliado: extrato.length > 0 
        ? (conciliadosExtrato / extrato.length) * 100 
        : 0,
    };
  },
  
  parseOFX: (conteudo: string) => {
    // Simplificado para testes
    const transacoes: Partial<ExtratoItem>[] = [];
    
    const regex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match;
    
    while ((match = regex.exec(conteudo)) !== null) {
      const trn = match[1];
      
      const tipo = trn.includes('<TRNTYPE>CREDIT') ? 'credito' : 'debito';
      const valorMatch = trn.match(/<TRNAMT>([-\d.]+)/);
      const dataMatch = trn.match(/<DTPOSTED>(\d{8})/);
      const descMatch = trn.match(/<MEMO>([^<]+)/);
      
      if (valorMatch && dataMatch) {
        transacoes.push({
          tipo,
          valor: Math.abs(parseFloat(valorMatch[1])),
          data: `${dataMatch[1].substr(0, 4)}-${dataMatch[1].substr(4, 2)}-${dataMatch[1].substr(6, 2)}`,
          descricao: descMatch ? descMatch[1] : '',
          status: 'pendente',
        });
      }
    }
    
    return transacoes;
  },
};

describe('Serviço de Conciliação Bancária', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('conciliarAutomatico()', () => {
    it('deve chamar endpoint de conciliação automática', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { conciliados: 5 } }),
      });

      const result = await conciliacaoService.conciliarAutomatico('conta-123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/financeiro/conciliacao/automatico', expect.objectContaining({
        method: 'POST',
      }));
      expect(result.data.conciliados).toBe(5);
    });
  });

  describe('conciliarManual()', () => {
    it('deve conciliar extrato com movimentação', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await conciliacaoService.conciliarManual('ext-1', 'mov-1');
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.extrato_id).toBe('ext-1');
      expect(body.movimentacao_id).toBe('mov-1');
    });
  });

  describe('calcularDiferenca()', () => {
    it('deve calcular diferença entre saldos', () => {
      expect(conciliacaoService.calcularDiferenca(10000, 9500)).toBe(500);
      expect(conciliacaoService.calcularDiferenca(9500, 10000)).toBe(-500);
      expect(conciliacaoService.calcularDiferenca(10000, 10000)).toBe(0);
    });
  });

  describe('encontrarCorrespondencias()', () => {
    it('deve encontrar movimentações correspondentes', () => {
      const extrato: ExtratoItem = {
        id: '1',
        data: '2025-01-15',
        descricao: 'PIX RECEBIDO',
        tipo: 'credito',
        valor: 1500,
        status: 'pendente',
      };
      
      const movimentacoes: MovimentacaoSistema[] = [
        { id: '1', data: '2025-01-15', descricao: 'Venda 001', tipo: 'entrada', valor: 1500, conciliado: false },
        { id: '2', data: '2025-01-14', descricao: 'Venda 002', tipo: 'entrada', valor: 1500, conciliado: false },
        { id: '3', data: '2025-01-15', descricao: 'Pagamento', tipo: 'saida', valor: 1500, conciliado: false },
        { id: '4', data: '2025-01-15', descricao: 'Venda 003', tipo: 'entrada', valor: 2000, conciliado: false },
      ];
      
      const correspondencias = conciliacaoService.encontrarCorrespondencias(extrato, movimentacoes);
      
      // Deve encontrar 2: mesma data e dia anterior
      expect(correspondencias).toHaveLength(2);
      expect(correspondencias.every(c => c.tipo === 'entrada')).toBe(true);
    });

    it('não deve retornar movimentações já conciliadas', () => {
      const extrato: ExtratoItem = {
        id: '1',
        data: '2025-01-15',
        descricao: 'PIX',
        tipo: 'credito',
        valor: 1000,
        status: 'pendente',
      };
      
      const movimentacoes: MovimentacaoSistema[] = [
        { id: '1', data: '2025-01-15', descricao: 'Venda', tipo: 'entrada', valor: 1000, conciliado: true },
      ];
      
      const correspondencias = conciliacaoService.encontrarCorrespondencias(extrato, movimentacoes);
      
      expect(correspondencias).toHaveLength(0);
    });
  });

  describe('calcularScoreCorrespondencia()', () => {
    it('deve dar score máximo para correspondência perfeita', () => {
      const extrato: ExtratoItem = {
        id: '1',
        data: '2025-01-15',
        descricao: 'PIX VENDA LOJA',
        tipo: 'credito',
        valor: 1500,
        status: 'pendente',
      };
      
      const movimentacao: MovimentacaoSistema = {
        id: '1',
        data: '2025-01-15',
        descricao: 'Venda Loja',
        tipo: 'entrada',
        valor: 1500,
        conciliado: false,
      };
      
      const score = conciliacaoService.calcularScoreCorrespondencia(extrato, movimentacao);
      
      // 50 (valor) + 30 (data) + palavras comuns
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('deve dar score menor para datas diferentes', () => {
      const extrato: ExtratoItem = {
        id: '1',
        data: '2025-01-15',
        descricao: 'PIX',
        tipo: 'credito',
        valor: 1000,
        status: 'pendente',
      };
      
      const movMesmaData: MovimentacaoSistema = {
        id: '1', data: '2025-01-15', descricao: 'Venda', tipo: 'entrada', valor: 1000, conciliado: false,
      };
      
      const movDataDiferente: MovimentacaoSistema = {
        id: '2', data: '2025-01-13', descricao: 'Venda', tipo: 'entrada', valor: 1000, conciliado: false,
      };
      
      const scoreMesmaData = conciliacaoService.calcularScoreCorrespondencia(extrato, movMesmaData);
      const scoreDataDiferente = conciliacaoService.calcularScoreCorrespondencia(extrato, movDataDiferente);
      
      expect(scoreMesmaData).toBeGreaterThan(scoreDataDiferente);
    });
  });

  describe('getStatusConciliacao()', () => {
    it('deve calcular status da conciliação', () => {
      const extrato: ExtratoItem[] = [
        { id: '1', data: '2025-01-01', descricao: 'A', tipo: 'credito', valor: 100, status: 'conciliado' },
        { id: '2', data: '2025-01-02', descricao: 'B', tipo: 'debito', valor: 200, status: 'conciliado' },
        { id: '3', data: '2025-01-03', descricao: 'C', tipo: 'credito', valor: 300, status: 'pendente' },
        { id: '4', data: '2025-01-04', descricao: 'D', tipo: 'debito', valor: 400, status: 'ignorado' },
      ];
      
      const movimentacoes: MovimentacaoSistema[] = [
        { id: '1', data: '2025-01-01', descricao: 'X', tipo: 'entrada', valor: 100, conciliado: true },
        { id: '2', data: '2025-01-02', descricao: 'Y', tipo: 'saida', valor: 200, conciliado: true },
        { id: '3', data: '2025-01-05', descricao: 'Z', tipo: 'entrada', valor: 500, conciliado: false },
      ];
      
      const status = conciliacaoService.getStatusConciliacao(extrato, movimentacoes);
      
      expect(status.pendentesExtrato).toBe(1);
      expect(status.conciliadosExtrato).toBe(2);
      expect(status.pendentesMovimentacoes).toBe(1);
      expect(status.percentualConciliado).toBe(50);
    });
  });

  describe('parseOFX()', () => {
    it('deve parsear arquivo OFX', () => {
      const ofxContent = `
        <STMTTRN>
          <TRNTYPE>CREDIT
          <DTPOSTED>20250115
          <TRNAMT>1500.00
          <MEMO>PIX RECEBIDO
        </STMTTRN>
        <STMTTRN>
          <TRNTYPE>DEBIT
          <DTPOSTED>20250116
          <TRNAMT>-500.00
          <MEMO>PAGAMENTO BOLETO
        </STMTTRN>
      `;
      
      const transacoes = conciliacaoService.parseOFX(ofxContent);
      
      expect(transacoes).toHaveLength(2);
      expect(transacoes[0].tipo).toBe('credito');
      expect(transacoes[0].valor).toBe(1500);
      expect(transacoes[0].data).toBe('2025-01-15');
      expect(transacoes[1].tipo).toBe('debito');
    });
  });
});
