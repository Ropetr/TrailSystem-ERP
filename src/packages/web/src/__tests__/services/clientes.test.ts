// =============================================
// PLANAC ERP - Testes do Serviço de Clientes
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Simular serviço de clientes
const clientesService = {
  listar: async (filtros?: { tipo?: string; ativo?: boolean }) => {
    const params = new URLSearchParams();
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.ativo !== undefined) params.append('ativo', String(filtros.ativo));
    
    const response = await fetch(`/api/clientes?${params}`);
    return response.json();
  },
  
  buscarPorId: async (id: string) => {
    const response = await fetch(`/api/clientes/${id}`);
    return response.json();
  },
  
  criar: async (dados: any) => {
    const response = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  atualizar: async (id: string, dados: any) => {
    const response = await fetch(`/api/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },
  
  excluir: async (id: string) => {
    const response = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
    return response.json();
  },
  
  buscarCNPJ: async (cnpj: string) => {
    const response = await fetch(`/api/integracoes/cnpj/${cnpj}`);
    return response.json();
  },
};

describe('Serviço de Clientes', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('listar()', () => {
    it('deve listar todos os clientes', async () => {
      const mockClientes = [
        { id: '1', nome: 'Cliente 1', tipo: 'PF' },
        { id: '2', razao_social: 'Empresa 2', tipo: 'PJ' },
      ];
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockClientes }),
      });

      const result = await clientesService.listar();
      
      expect(mockFetch).toHaveBeenCalledWith('/api/clientes?');
      expect(result.data).toHaveLength(2);
    });

    it('deve filtrar por tipo PJ', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await clientesService.listar({ tipo: 'PJ' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/clientes?tipo=PJ');
    });

    it('deve filtrar por status ativo', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await clientesService.listar({ ativo: true });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/clientes?ativo=true');
    });
  });

  describe('buscarPorId()', () => {
    it('deve buscar cliente por ID', async () => {
      const mockCliente = { id: '123', nome: 'Cliente Teste' };
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockCliente }),
      });

      const result = await clientesService.buscarPorId('123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/clientes/123');
      expect(result.data.nome).toBe('Cliente Teste');
    });
  });

  describe('criar()', () => {
    it('deve criar cliente PF', async () => {
      const novoCliente = {
        tipo: 'PF',
        nome: 'João Silva',
        cpf_cnpj: '12345678901',
      };
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { id: '1', ...novoCliente } }),
      });

      const result = await clientesService.criar(novoCliente);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/clientes', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(novoCliente),
      }));
      expect(result.success).toBe(true);
    });

    it('deve criar cliente PJ', async () => {
      const novoCliente = {
        tipo: 'PJ',
        razao_social: 'Empresa LTDA',
        cpf_cnpj: '12345678000199',
      };
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { id: '2', ...novoCliente } }),
      });

      const result = await clientesService.criar(novoCliente);
      
      expect(result.success).toBe(true);
    });
  });

  describe('atualizar()', () => {
    it('deve atualizar cliente existente', async () => {
      const dadosAtualizados = { nome: 'Nome Atualizado' };
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await clientesService.atualizar('123', dadosAtualizados);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/clientes/123', expect.objectContaining({
        method: 'PUT',
      }));
    });
  });

  describe('excluir()', () => {
    it('deve excluir cliente', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      const result = await clientesService.excluir('123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/clientes/123', { method: 'DELETE' });
      expect(result.success).toBe(true);
    });
  });

  describe('buscarCNPJ()', () => {
    it('deve buscar dados do CNPJ via integração', async () => {
      const mockDadosCNPJ = {
        razao_social: 'Empresa Encontrada LTDA',
        nome_fantasia: 'Empresa',
        endereco: { logradouro: 'Rua Teste', cidade: 'Curitiba', uf: 'PR' },
      };
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockDadosCNPJ }),
      });

      const result = await clientesService.buscarCNPJ('12345678000199');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/integracoes/cnpj/12345678000199');
      expect(result.data.razao_social).toBe('Empresa Encontrada LTDA');
    });
  });
});
