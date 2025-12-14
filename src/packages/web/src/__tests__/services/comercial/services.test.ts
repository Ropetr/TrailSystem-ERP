// =============================================
// PLANAC ERP - Testes de Serviços Comercial
// =============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock do fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Serviço base de API
const API_BASE = 'https://planac-erp-api.workers.dev/api';

const createApiService = () => {
  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  return {
    get: async <T>(endpoint: string): Promise<T> => {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Request failed');
      return response.json();
    },
    
    post: async <T>(endpoint: string, data: unknown): Promise<T> => {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Request failed');
      return response.json();
    },
    
    put: async <T>(endpoint: string, data: unknown): Promise<T> => {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Request failed');
      return response.json();
    },
    
    delete: async (endpoint: string): Promise<void> => {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Request failed');
    },
  };
};

// =============================================
// TESTES DO SERVIÇO DE CLIENTES
// =============================================

describe('Serviço de Clientes', () => {
  const api = createApiService();
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-token');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('listar clientes', () => {
    it('deve listar todos os clientes', async () => {
      const mockClientes = [
        { id: '1', nome: 'Cliente 1', tipo: 'PF', cpf_cnpj: '12345678901' },
        { id: '2', razao_social: 'Empresa 2', tipo: 'PJ', cpf_cnpj: '12345678000190' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockClientes }),
      });

      const result = await api.get<{ success: boolean; data: typeof mockClientes }>('/clientes');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/clientes`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result.data).toEqual(mockClientes);
    });

    it('deve filtrar clientes por tipo', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await api.get('/clientes?tipo=PJ');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/clientes?tipo=PJ`,
        expect.any(Object)
      );
    });
  });

  describe('criar cliente', () => {
    it('deve criar cliente PF', async () => {
      const novoCliente = {
        tipo: 'PF',
        nome: 'João Silva',
        cpf_cnpj: '52998224725',
        email: 'joao@email.com',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: '1', ...novoCliente } }),
      });

      const result = await api.post('/clientes', novoCliente);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/clientes`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(novoCliente),
        })
      );
      expect(result).toBeDefined();
    });

    it('deve criar cliente PJ', async () => {
      const novoCliente = {
        tipo: 'PJ',
        razao_social: 'Empresa LTDA',
        nome_fantasia: 'Empresa',
        cpf_cnpj: '11222333000181',
        ie: '123456789',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: '2', ...novoCliente } }),
      });

      await api.post('/clientes', novoCliente);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/clientes`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(novoCliente),
        })
      );
    });
  });

  describe('atualizar cliente', () => {
    it('deve atualizar dados do cliente', async () => {
      const dadosAtualizados = {
        email: 'novo@email.com',
        telefone: '41999999999',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await api.put('/clientes/1', dadosAtualizados);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/clientes/1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(dadosAtualizados),
        })
      );
    });
  });

  describe('excluir cliente', () => {
    it('deve excluir cliente', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await api.delete('/clientes/1');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/clientes/1`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});

// =============================================
// TESTES DO SERVIÇO DE PRODUTOS
// =============================================

describe('Serviço de Produtos', () => {
  const api = createApiService();
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-token');
  });

  describe('listar produtos', () => {
    it('deve listar todos os produtos', async () => {
      const mockProdutos = [
        { id: '1', descricao: 'Placa Gesso', ncm: '68091100', preco: 45.90 },
        { id: '2', descricao: 'Perfil Montante', ncm: '73089090', preco: 12.50 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockProdutos }),
      });

      const result = await api.get<{ success: boolean; data: typeof mockProdutos }>('/produtos');

      expect(result.data).toEqual(mockProdutos);
    });

    it('deve filtrar produtos com estoque baixo', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await api.get('/produtos?estoque_baixo=true');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/produtos?estoque_baixo=true`,
        expect.any(Object)
      );
    });
  });

  describe('criar produto', () => {
    it('deve criar produto com dados fiscais', async () => {
      const novoProduto = {
        codigo: 'PG-001',
        descricao: 'Placa de Gesso Standard',
        ncm: '68091100',
        cest: '1000100',
        preco_custo: 35.00,
        preco_venda: 45.90,
        estoque_minimo: 10,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: '1', ...novoProduto } }),
      });

      await api.post('/produtos', novoProduto);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/produtos`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(novoProduto),
        })
      );
    });
  });

  describe('atualizar estoque', () => {
    it('deve atualizar quantidade em estoque', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await api.put('/produtos/1/estoque', { quantidade: 100, tipo: 'entrada' });

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/produtos/1/estoque`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ quantidade: 100, tipo: 'entrada' }),
        })
      );
    });
  });
});

// =============================================
// TESTES DO SERVIÇO DE ORÇAMENTOS
// =============================================

describe('Serviço de Orçamentos', () => {
  const api = createApiService();
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-token');
  });

  describe('listar orçamentos', () => {
    it('deve listar orçamentos com filtro de status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await api.get('/orcamentos?status=pendente');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/orcamentos?status=pendente`,
        expect.any(Object)
      );
    });
  });

  describe('criar orçamento', () => {
    it('deve criar orçamento com itens', async () => {
      const novoOrcamento = {
        cliente_id: '1',
        vendedor_id: '1',
        itens: [
          { produto_id: '1', quantidade: 10, preco_unitario: 45.90 },
          { produto_id: '2', quantidade: 20, preco_unitario: 12.50 },
        ],
        observacoes: 'Orçamento teste',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: '1', numero: 'ORC-001', ...novoOrcamento } }),
      });

      await api.post('/orcamentos', novoOrcamento);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/orcamentos`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(novoOrcamento),
        })
      );
    });
  });

  describe('mesclar orçamentos', () => {
    it('deve mesclar múltiplos orçamentos', async () => {
      const dadosMesclagem = {
        orcamento_ids: ['1', '2', '3'],
        regra_preco: 'menor', // menor, maior, media, primeiro
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { 
            id: '4', 
            numero: 'ORC-004',
            mesclado_de: ['ORC-001', 'ORC-002', 'ORC-003'],
          } 
        }),
      });

      await api.post('/orcamentos/mesclar', dadosMesclagem);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/orcamentos/mesclar`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(dadosMesclagem),
        })
      );
    });
  });

  describe('desmembrar itens', () => {
    it('deve criar novo orçamento a partir de itens selecionados', async () => {
      const dadosDesmembramento = {
        orcamento_id: '1',
        itens_ids: ['item-1', 'item-3'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { 
            orcamento_original: { id: '1', itens: [] },
            orcamento_novo: { id: '2', numero: 'ORC-002', itens: [] },
          } 
        }),
      });

      await api.post('/orcamentos/desmembrar', dadosDesmembramento);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/orcamentos/desmembrar`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(dadosDesmembramento),
        })
      );
    });
  });

  describe('converter em pedido', () => {
    it('deve converter orçamento em pedido', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { 
            pedido_id: 'PED-001',
            orcamento_id: '1',
          } 
        }),
      });

      await api.post('/orcamentos/1/converter', {});

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/orcamentos/1/converter`,
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});

// =============================================
// TESTES DO SERVIÇO DE VENDAS
// =============================================

describe('Serviço de Vendas', () => {
  const api = createApiService();
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-token');
  });

  describe('criar venda com entregas fracionadas', () => {
    it('deve criar venda com múltiplas entregas', async () => {
      const novaVenda = {
        orcamento_id: '1',
        cliente_id: '1',
        entregas: [
          {
            data_prevista: '2025-01-15',
            itens: [{ produto_id: '1', quantidade: 5 }],
            financeiro: 'integral',
          },
          {
            data_prevista: '2025-01-22',
            itens: [{ produto_id: '1', quantidade: 5 }],
            financeiro: 'proporcional',
          },
        ],
        uso_credito: {
          usar: true,
          creditos_ids: ['cred-1'],
          aplicar_em: 'venda', // venda, entregas, nao_usar
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { 
            id: '1',
            numero: 'VND-001',
            entregas: [
              { id: 'VND-001.E1', status: 'pendente' },
              { id: 'VND-001.E2', status: 'pendente' },
            ],
          } 
        }),
      });

      await api.post('/vendas', novaVenda);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/vendas`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(novaVenda),
        })
      );
    });
  });

  describe('atualizar status de entrega', () => {
    it('deve atualizar status de uma entrega específica', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await api.put('/vendas/1/entregas/E1', { status: 'separando' });

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/vendas/1/entregas/E1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'separando' }),
        })
      );
    });
  });

  describe('faturar entrega', () => {
    it('deve gerar NF-e para entrega', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { 
            nfe_id: 'NFE-001',
            chave: '35250112345678000190550010000000011000000011',
          } 
        }),
      });

      await api.post('/vendas/1/entregas/E1/faturar', {});

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/vendas/1/entregas/E1/faturar`,
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});

// =============================================
// TESTES DE INTEGRAÇÃO COSMOS (Bluesoft)
// =============================================

describe('Serviço Cosmos (Busca de Produtos)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve buscar produto por código de barras', async () => {
    const mockProduto = {
      gtin: '7891000315507',
      description: 'Produto Teste',
      ncm: { code: '04029900' },
      cest: { code: '1700700' },
      brand: { name: 'Marca Teste' },
      gross_weight: 0.41,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProduto,
    });

    const response = await fetch('https://api.cosmos.bluesoft.com.br/gtins/7891000315507.json', {
      headers: {
        'X-Cosmos-Token': 'test-token',
        'User-Agent': 'Planac ERP',
      },
    });
    const data = await response.json();

    expect(data.gtin).toBe('7891000315507');
    expect(data.ncm.code).toBe('04029900');
  });

  it('deve buscar produtos por descrição', async () => {
    const mockResultados = [
      { gtin: '1', description: 'Placa de Gesso 1' },
      { gtin: '2', description: 'Placa de Gesso 2' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResultados,
    });

    const response = await fetch('https://api.cosmos.bluesoft.com.br/products?query=placa%20gesso', {
      headers: {
        'X-Cosmos-Token': 'test-token',
        'User-Agent': 'Planac ERP',
      },
    });
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
  });
});

// =============================================
// TESTES DE BUSCA CEP (ViaCEP)
// =============================================

describe('Serviço ViaCEP', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve buscar endereço por CEP', async () => {
    const mockEndereco = {
      cep: '80000-000',
      logradouro: 'Rua das Flores',
      bairro: 'Centro',
      localidade: 'Curitiba',
      uf: 'PR',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEndereco,
    });

    const response = await fetch('https://viacep.com.br/ws/80000000/json/');
    const data = await response.json();

    expect(data.localidade).toBe('Curitiba');
    expect(data.uf).toBe('PR');
  });

  it('deve tratar CEP não encontrado', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ erro: true }),
    });

    const response = await fetch('https://viacep.com.br/ws/00000000/json/');
    const data = await response.json();

    expect(data.erro).toBe(true);
  });
});

// =============================================
// TESTES DE BUSCA CNPJ (CNPJá)
// =============================================

describe('Serviço CNPJá', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve buscar dados de empresa por CNPJ', async () => {
    const mockEmpresa = {
      razao_social: 'EMPRESA TESTE LTDA',
      nome_fantasia: 'Empresa Teste',
      cnpj: '11222333000181',
      situacao: 'ATIVA',
      endereco: {
        logradouro: 'Rua Teste',
        numero: '123',
        bairro: 'Centro',
        municipio: 'Curitiba',
        uf: 'PR',
        cep: '80000000',
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEmpresa,
    });

    const response = await fetch('https://api.cnpja.com/office/11222333000181', {
      headers: {
        Authorization: 'test-api-key',
      },
    });
    const data = await response.json();

    expect(data.razao_social).toBe('EMPRESA TESTE LTDA');
    expect(data.situacao).toBe('ATIVA');
  });
});
