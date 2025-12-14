import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/services/api';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.getItem = vi.fn();
    localStorage.setItem = vi.fn();
    localStorage.removeItem = vi.fn();
  });

  it('faz requisição GET corretamente', async () => {
    const mockData = { success: true, data: [{ id: '1', nome: 'Teste' }] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await api.get('/empresas');
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/empresas'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual(mockData);
  });

  it('faz requisição POST corretamente', async () => {
    const mockData = { success: true };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const payload = { nome: 'Nova Empresa' };
    await api.post('/empresas', payload);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/empresas'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  });

  it('faz requisição PUT corretamente', async () => {
    const mockData = { success: true };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const payload = { nome: 'Empresa Atualizada' };
    await api.put('/empresas/1', payload);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/empresas/1'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    );
  });

  it('faz requisição DELETE corretamente', async () => {
    const mockData = { success: true };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    await api.delete('/empresas/1');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/empresas/1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('adiciona token de autenticação quando presente', async () => {
    localStorage.getItem = vi.fn().mockReturnValue('token-123');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await api.get('/empresas');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    );
  });

  it('limpa token e redireciona em erro 401', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });

    // Mock window.location
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { href: '' } as any;

    try {
      await api.get('/empresas');
    } catch (error) {
      // Esperado
    }

    expect(localStorage.removeItem).toHaveBeenCalledWith('planac_token');
    expect(window.location.href).toBe('/login');

    window.location = originalLocation;
  });

  it('lança erro em requisição falha', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal Server Error' }),
    });

    await expect(api.get('/empresas')).rejects.toThrow();
  });
});
