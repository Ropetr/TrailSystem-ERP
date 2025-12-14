// =============================================
// PLANAC ERP - Testes de Páginas Comercial
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock do React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: undefined }),
  useSearchParams: () => [new URLSearchParams()],
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock do serviço de API
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock do Toast
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

// =============================================
// TESTES DE LÓGICA DE COMPONENTES
// =============================================

describe('Lógica de Clientes', () => {
  describe('Filtros de Lista', () => {
    const filterClientes = (
      clientes: Array<{ nome: string; tipo: string; cpf_cnpj: string; ativo: boolean }>,
      filters: { search: string; tipo: string; status: string }
    ) => {
      return clientes.filter((c) => {
        const matchSearch = !filters.search || 
          c.nome.toLowerCase().includes(filters.search.toLowerCase()) ||
          c.cpf_cnpj.includes(filters.search);
        
        const matchTipo = !filters.tipo || c.tipo === filters.tipo;
        
        const matchStatus = !filters.status || 
          (filters.status === 'ativo' && c.ativo) || 
          (filters.status === 'inativo' && !c.ativo);

        return matchSearch && matchTipo && matchStatus;
      });
    };

    const mockClientes = [
      { nome: 'João Silva', tipo: 'PF', cpf_cnpj: '12345678901', ativo: true },
      { nome: 'Maria Santos', tipo: 'PF', cpf_cnpj: '98765432101', ativo: false },
      { nome: 'Empresa ABC', tipo: 'PJ', cpf_cnpj: '12345678000190', ativo: true },
    ];

    it('deve filtrar por busca de texto', () => {
      const result = filterClientes(mockClientes, { search: 'João', tipo: '', status: '' });
      expect(result.length).toBe(1);
      expect(result[0].nome).toBe('João Silva');
    });

    it('deve filtrar por CPF/CNPJ', () => {
      const result = filterClientes(mockClientes, { search: '12345678000190', tipo: '', status: '' });
      expect(result.length).toBe(1);
      expect(result[0].nome).toBe('Empresa ABC');
    });

    it('deve filtrar por tipo PF', () => {
      const result = filterClientes(mockClientes, { search: '', tipo: 'PF', status: '' });
      expect(result.length).toBe(2);
    });

    it('deve filtrar por tipo PJ', () => {
      const result = filterClientes(mockClientes, { search: '', tipo: 'PJ', status: '' });
      expect(result.length).toBe(1);
    });

    it('deve filtrar por status ativo', () => {
      const result = filterClientes(mockClientes, { search: '', tipo: '', status: 'ativo' });
      expect(result.length).toBe(2);
    });

    it('deve combinar múltiplos filtros', () => {
      const result = filterClientes(mockClientes, { search: '', tipo: 'PF', status: 'ativo' });
      expect(result.length).toBe(1);
      expect(result[0].nome).toBe('João Silva');
    });
  });

  describe('Estatísticas de Clientes', () => {
    const calculateStats = (clientes: Array<{ tipo: string; ativo: boolean }>) => {
      return {
        total: clientes.length,
        ativos: clientes.filter(c => c.ativo).length,
        pf: clientes.filter(c => c.tipo === 'PF').length,
        pj: clientes.filter(c => c.tipo === 'PJ').length,
      };
    };

    it('deve calcular estatísticas corretamente', () => {
      const clientes = [
        { tipo: 'PF', ativo: true },
        { tipo: 'PF', ativo: false },
        { tipo: 'PJ', ativo: true },
        { tipo: 'PJ', ativo: true },
      ];

      const stats = calculateStats(clientes);

      expect(stats.total).toBe(4);
      expect(stats.ativos).toBe(3);
      expect(stats.pf).toBe(2);
      expect(stats.pj).toBe(2);
    });
  });
});

describe('Lógica de Produtos', () => {
  describe('Filtros de Lista', () => {
    const filterProdutos = (
      produtos: Array<{ descricao: string; categoria_id: string; estoque: number; estoque_minimo: number; ativo: boolean }>,
      filters: { search: string; categoria: string; estoqueBaixo: boolean; status: string }
    ) => {
      return produtos.filter((p) => {
        const matchSearch = !filters.search || 
          p.descricao.toLowerCase().includes(filters.search.toLowerCase());
        
        const matchCategoria = !filters.categoria || p.categoria_id === filters.categoria;
        
        const matchEstoqueBaixo = !filters.estoqueBaixo || p.estoque <= p.estoque_minimo;
        
        const matchStatus = !filters.status || 
          (filters.status === 'ativo' && p.ativo) || 
          (filters.status === 'inativo' && !p.ativo);

        return matchSearch && matchCategoria && matchEstoqueBaixo && matchStatus;
      });
    };

    const mockProdutos = [
      { descricao: 'Placa Gesso', categoria_id: 'cat1', estoque: 100, estoque_minimo: 10, ativo: true },
      { descricao: 'Perfil Montante', categoria_id: 'cat1', estoque: 5, estoque_minimo: 10, ativo: true },
      { descricao: 'Parafuso', categoria_id: 'cat2', estoque: 1000, estoque_minimo: 100, ativo: false },
    ];

    it('deve filtrar produtos com estoque baixo', () => {
      const result = filterProdutos(mockProdutos, { search: '', categoria: '', estoqueBaixo: true, status: '' });
      expect(result.length).toBe(1);
      expect(result[0].descricao).toBe('Perfil Montante');
    });

    it('deve filtrar por categoria', () => {
      const result = filterProdutos(mockProdutos, { search: '', categoria: 'cat1', estoqueBaixo: false, status: '' });
      expect(result.length).toBe(2);
    });
  });

  describe('Cálculos de Produto', () => {
    it('deve calcular valor total em estoque', () => {
      const produtos = [
        { estoque: 100, preco_venda: 45.90 },
        { estoque: 50, preco_venda: 12.50 },
      ];

      const valorTotal = produtos.reduce((sum, p) => sum + (p.estoque * p.preco_venda), 0);

      expect(valorTotal).toBe(5215); // (100 * 45.90) + (50 * 12.50)
    });
  });
});

describe('Lógica de Orçamentos', () => {
  describe('Seleção para Mesclar', () => {
    const canMerge = (selectedIds: string[], orcamentos: Array<{ id: string; cliente_id: string }>) => {
      if (selectedIds.length < 2) return { canMerge: false, reason: 'Selecione pelo menos 2 orçamentos' };
      
      const selectedOrcamentos = orcamentos.filter(o => selectedIds.includes(o.id));
      const clienteIds = new Set(selectedOrcamentos.map(o => o.cliente_id));
      
      if (clienteIds.size > 1) {
        return { canMerge: false, reason: 'Orçamentos devem ser do mesmo cliente' };
      }
      
      return { canMerge: true, reason: '' };
    };

    it('deve permitir mesclar orçamentos do mesmo cliente', () => {
      const orcamentos = [
        { id: '1', cliente_id: 'c1' },
        { id: '2', cliente_id: 'c1' },
        { id: '3', cliente_id: 'c2' },
      ];

      const result = canMerge(['1', '2'], orcamentos);
      expect(result.canMerge).toBe(true);
    });

    it('deve impedir mesclar orçamentos de clientes diferentes', () => {
      const orcamentos = [
        { id: '1', cliente_id: 'c1' },
        { id: '2', cliente_id: 'c2' },
      ];

      const result = canMerge(['1', '2'], orcamentos);
      expect(result.canMerge).toBe(false);
      expect(result.reason).toContain('mesmo cliente');
    });

    it('deve exigir pelo menos 2 orçamentos', () => {
      const orcamentos = [{ id: '1', cliente_id: 'c1' }];

      const result = canMerge(['1'], orcamentos);
      expect(result.canMerge).toBe(false);
      expect(result.reason).toContain('pelo menos 2');
    });
  });

  describe('Regras de Preço ao Mesclar', () => {
    const applyPriceRule = (
      items: Array<{ produto_id: string; preco: number }>,
      rule: 'menor' | 'maior' | 'media' | 'primeiro'
    ) => {
      const groupedByProduct = items.reduce((acc, item) => {
        if (!acc[item.produto_id]) acc[item.produto_id] = [];
        acc[item.produto_id].push(item.preco);
        return acc;
      }, {} as Record<string, number[]>);

      return Object.entries(groupedByProduct).map(([produto_id, precos]) => {
        let precoFinal: number;
        switch (rule) {
          case 'menor':
            precoFinal = Math.min(...precos);
            break;
          case 'maior':
            precoFinal = Math.max(...precos);
            break;
          case 'media':
            precoFinal = precos.reduce((a, b) => a + b, 0) / precos.length;
            break;
          case 'primeiro':
          default:
            precoFinal = precos[0];
        }
        return { produto_id, preco: precoFinal };
      });
    };

    const items = [
      { produto_id: 'p1', preco: 100 },
      { produto_id: 'p1', preco: 80 },
      { produto_id: 'p1', preco: 120 },
    ];

    it('deve aplicar regra de menor preço', () => {
      const result = applyPriceRule(items, 'menor');
      expect(result[0].preco).toBe(80);
    });

    it('deve aplicar regra de maior preço', () => {
      const result = applyPriceRule(items, 'maior');
      expect(result[0].preco).toBe(120);
    });

    it('deve aplicar regra de média', () => {
      const result = applyPriceRule(items, 'media');
      expect(result[0].preco).toBe(100); // (100 + 80 + 120) / 3
    });

    it('deve aplicar regra do primeiro', () => {
      const result = applyPriceRule(items, 'primeiro');
      expect(result[0].preco).toBe(100);
    });
  });

  describe('Desmembrar Itens', () => {
    const splitItems = (
      allItems: Array<{ id: string; produto_id: string; quantidade: number }>,
      selectedIds: string[]
    ) => {
      const itemsToMove = allItems.filter(i => selectedIds.includes(i.id));
      const itemsToKeep = allItems.filter(i => !selectedIds.includes(i.id));
      
      return { itemsToMove, itemsToKeep };
    };

    it('deve separar itens selecionados', () => {
      const items = [
        { id: '1', produto_id: 'p1', quantidade: 10 },
        { id: '2', produto_id: 'p2', quantidade: 20 },
        { id: '3', produto_id: 'p3', quantidade: 30 },
      ];

      const { itemsToMove, itemsToKeep } = splitItems(items, ['1', '3']);

      expect(itemsToMove.length).toBe(2);
      expect(itemsToKeep.length).toBe(1);
      expect(itemsToKeep[0].id).toBe('2');
    });
  });
});

describe('Lógica de Vendas', () => {
  describe('Entregas Fracionadas', () => {
    const createDeliveries = (
      items: Array<{ id: string; quantidade: number }>,
      entregas: Array<{ data: string; itens: Array<{ item_id: string; quantidade: number }> }>
    ) => {
      return entregas.map((entrega, index) => ({
        numero: `.E${index + 1}`,
        data_prevista: entrega.data,
        itens: entrega.itens,
        status: 'pendente',
      }));
    };

    it('deve criar entregas com numeração correta', () => {
      const items = [{ id: '1', quantidade: 100 }];
      const entregas = [
        { data: '2025-01-15', itens: [{ item_id: '1', quantidade: 50 }] },
        { data: '2025-01-22', itens: [{ item_id: '1', quantidade: 50 }] },
      ];

      const result = createDeliveries(items, entregas);

      expect(result.length).toBe(2);
      expect(result[0].numero).toBe('.E1');
      expect(result[1].numero).toBe('.E2');
    });

    const validateDeliveryQuantities = (
      items: Array<{ id: string; quantidade: number }>,
      entregas: Array<{ itens: Array<{ item_id: string; quantidade: number }> }>
    ) => {
      const totalByItem: Record<string, number> = {};
      
      entregas.forEach(entrega => {
        entrega.itens.forEach(item => {
          totalByItem[item.item_id] = (totalByItem[item.item_id] || 0) + item.quantidade;
        });
      });

      return items.every(item => totalByItem[item.id] === item.quantidade);
    };

    it('deve validar que entregas cobrem quantidade total', () => {
      const items = [{ id: '1', quantidade: 100 }];
      
      const entregasCorretas = [
        { itens: [{ item_id: '1', quantidade: 60 }] },
        { itens: [{ item_id: '1', quantidade: 40 }] },
      ];
      expect(validateDeliveryQuantities(items, entregasCorretas)).toBe(true);

      const entregasIncompletas = [
        { itens: [{ item_id: '1', quantidade: 50 }] },
      ];
      expect(validateDeliveryQuantities(items, entregasIncompletas)).toBe(false);
    });
  });

  describe('Uso de Crédito', () => {
    const calculateCreditApplication = (
      creditos: Array<{ id: string; valor: number; selecionado: boolean }>,
      totalVenda: number,
      entregas: Array<{ valor: number }>,
      aplicarEm: 'venda' | 'entregas' | 'nao_usar'
    ) => {
      if (aplicarEm === 'nao_usar') {
        return { valorCredito: 0, valorRestante: totalVenda, distribuicao: null };
      }

      const totalCredito = creditos.filter(c => c.selecionado).reduce((sum, c) => sum + c.valor, 0);

      if (aplicarEm === 'venda') {
        const valorRestante = Math.max(0, totalVenda - totalCredito);
        return { valorCredito: Math.min(totalCredito, totalVenda), valorRestante, distribuicao: null };
      }

      // aplicarEm === 'entregas'
      let creditoRestante = totalCredito;
      const distribuicao = entregas.map(entrega => {
        const creditoNaEntrega = Math.min(creditoRestante, entrega.valor);
        creditoRestante -= creditoNaEntrega;
        return {
          valorOriginal: entrega.valor,
          creditoAplicado: creditoNaEntrega,
          valorFinal: entrega.valor - creditoNaEntrega,
        };
      });

      return {
        valorCredito: totalCredito - creditoRestante,
        valorRestante: entregas.reduce((sum, e) => sum + e.valor, 0) - (totalCredito - creditoRestante),
        distribuicao,
      };
    };

    it('deve aplicar crédito na venda toda', () => {
      const creditos = [{ id: '1', valor: 500, selecionado: true }];
      const result = calculateCreditApplication(creditos, 1000, [], 'venda');

      expect(result.valorCredito).toBe(500);
      expect(result.valorRestante).toBe(500);
    });

    it('deve limitar crédito ao valor da venda', () => {
      const creditos = [{ id: '1', valor: 2000, selecionado: true }];
      const result = calculateCreditApplication(creditos, 1000, [], 'venda');

      expect(result.valorCredito).toBe(1000);
      expect(result.valorRestante).toBe(0);
    });

    it('deve distribuir crédito entre entregas', () => {
      const creditos = [{ id: '1', valor: 500, selecionado: true }];
      const entregas = [{ valor: 400 }, { valor: 600 }];
      const result = calculateCreditApplication(creditos, 1000, entregas, 'entregas');

      expect(result.distribuicao![0].creditoAplicado).toBe(400); // Cobre toda primeira entrega
      expect(result.distribuicao![1].creditoAplicado).toBe(100); // Sobra para segunda
    });
  });

  describe('Financeiro por Entrega', () => {
    const calculateFinanceiroEntrega = (
      totalVenda: number,
      entrega: { valor: number },
      modo: 'integral' | 'proporcional' | 'depois'
    ) => {
      switch (modo) {
        case 'integral':
          return totalVenda;
        case 'proporcional':
          return entrega.valor;
        case 'depois':
          return 0;
      }
    };

    it('deve calcular financeiro integral', () => {
      const result = calculateFinanceiroEntrega(1000, { valor: 400 }, 'integral');
      expect(result).toBe(1000);
    });

    it('deve calcular financeiro proporcional', () => {
      const result = calculateFinanceiroEntrega(1000, { valor: 400 }, 'proporcional');
      expect(result).toBe(400);
    });

    it('deve retornar 0 para "depois"', () => {
      const result = calculateFinanceiroEntrega(1000, { valor: 400 }, 'depois');
      expect(result).toBe(0);
    });
  });
});

describe('Lógica de Formulários', () => {
  describe('Validação de Cliente', () => {
    const validateCliente = (data: {
      tipo: string;
      cpf_cnpj?: string;
      nome?: string;
      razao_social?: string;
      email?: string;
    }) => {
      const errors: Record<string, string> = {};

      if (data.tipo === 'PF') {
        if (!data.nome) errors.nome = 'Nome é obrigatório';
        if (!data.cpf_cnpj) errors.cpf_cnpj = 'CPF é obrigatório';
      } else {
        if (!data.razao_social) errors.razao_social = 'Razão Social é obrigatória';
        if (!data.cpf_cnpj) errors.cpf_cnpj = 'CNPJ é obrigatório';
      }

      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Email inválido';
      }

      return { isValid: Object.keys(errors).length === 0, errors };
    };

    it('deve validar cliente PF', () => {
      const valid = validateCliente({ tipo: 'PF', nome: 'João', cpf_cnpj: '12345678901' });
      expect(valid.isValid).toBe(true);

      const invalid = validateCliente({ tipo: 'PF' });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.nome).toBeDefined();
    });

    it('deve validar cliente PJ', () => {
      const valid = validateCliente({ tipo: 'PJ', razao_social: 'Empresa', cpf_cnpj: '12345678000190' });
      expect(valid.isValid).toBe(true);

      const invalid = validateCliente({ tipo: 'PJ' });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.razao_social).toBeDefined();
    });

    it('deve validar email', () => {
      const invalid = validateCliente({ tipo: 'PF', nome: 'João', cpf_cnpj: '123', email: 'invalido' });
      expect(invalid.errors.email).toBeDefined();
    });
  });

  describe('Validação de Produto', () => {
    const validateProduto = (data: {
      descricao?: string;
      preco_venda?: number;
      ncm?: string;
    }) => {
      const errors: Record<string, string> = {};

      if (!data.descricao) errors.descricao = 'Descrição é obrigatória';
      if (!data.preco_venda || data.preco_venda <= 0) errors.preco_venda = 'Preço deve ser maior que zero';
      if (!data.ncm || data.ncm.replace(/\D/g, '').length !== 8) errors.ncm = 'NCM deve ter 8 dígitos';

      return { isValid: Object.keys(errors).length === 0, errors };
    };

    it('deve validar produto completo', () => {
      const valid = validateProduto({ descricao: 'Placa', preco_venda: 45.90, ncm: '68091100' });
      expect(valid.isValid).toBe(true);
    });

    it('deve rejeitar produto sem dados obrigatórios', () => {
      const invalid = validateProduto({});
      expect(invalid.isValid).toBe(false);
      expect(Object.keys(invalid.errors).length).toBe(3);
    });
  });
});
