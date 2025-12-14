import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '@/services/auth.service';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.getItem = vi.fn();
    localStorage.setItem = vi.fn();
    localStorage.removeItem = vi.fn();
  });

  describe('login', () => {
    it('salva token no localStorage após login bem-sucedido', async () => {
      const mockResponse = {
        success: true,
        token: 'jwt-token-123',
        usuario: { id: '1', nome: 'Usuário', email: 'user@test.com' },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authService.login({ email: 'user@test.com', senha: '123456' });

      expect(localStorage.setItem).toHaveBeenCalledWith('planac_token', 'jwt-token-123');
      expect(result.success).toBe(true);
      expect(result.usuario?.nome).toBe('Usuário');
    });

    it('retorna erro em credenciais inválidas', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Credenciais inválidas' }),
      });

      const result = await authService.login({ email: 'wrong@test.com', senha: 'wrong' });

      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
    });
  });

  describe('logout', () => {
    it('remove tokens do localStorage', async () => {
      await authService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('planac_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('planac_user');
    });
  });

  describe('isAuthenticated', () => {
    it('retorna true quando token existe', () => {
      localStorage.getItem = vi.fn().mockReturnValue('token-123');
      
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('retorna false quando token não existe', () => {
      localStorage.getItem = vi.fn().mockReturnValue(null);
      
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getStoredUser', () => {
    it('retorna usuário parseado do localStorage', () => {
      const user = { id: '1', nome: 'Teste', email: 'teste@test.com' };
      localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(user));

      const result = authService.getStoredUser();

      expect(result).toEqual(user);
    });

    it('retorna null se não houver usuário', () => {
      localStorage.getItem = vi.fn().mockReturnValue(null);

      const result = authService.getStoredUser();

      expect(result).toBeNull();
    });
  });
});
