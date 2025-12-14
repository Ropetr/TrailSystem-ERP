import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../auth.service';
import api from '../api';

// Mock do API
vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('returns token and user on successful login', async () => {
      const mockResponse = {
        success: true,
        token: 'mock-token',
        usuario: { id: '1', nome: 'Test User', email: 'test@test.com' },
      };
      
      vi.mocked(api.post).mockResolvedValue(mockResponse);
      
      const result = await authService.login({ email: 'test@test.com', senha: '123456' });
      
      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'test@test.com', senha: '123456' });
    });

    it('handles login error', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Credenciais inválidas'));
      
      await expect(authService.login({ email: 'test@test.com', senha: 'wrong' }))
        .rejects.toThrow('Credenciais inválidas');
    });
  });

  describe('logout', () => {
    it('clears token from localStorage', () => {
      localStorage.setItem('planac_token', 'test-token');
      localStorage.setItem('planac_user', JSON.stringify({ id: '1' }));
      
      authService.logout();
      
      expect(localStorage.getItem('planac_token')).toBeNull();
      expect(localStorage.getItem('planac_user')).toBeNull();
    });
  });

  describe('me', () => {
    it('returns current user data', async () => {
      const mockUser = { id: '1', nome: 'Test', email: 'test@test.com' };
      vi.mocked(api.get).mockResolvedValue({ success: true, data: mockUser });
      
      const result = await authService.me();
      
      expect(result).toEqual({ success: true, data: mockUser });
      expect(api.get).toHaveBeenCalledWith('/auth/me');
    });
  });

  describe('alterarSenha', () => {
    it('calls API with correct parameters', async () => {
      vi.mocked(api.put).mockResolvedValue({ success: true });
      
      await authService.alterarSenha('oldPass', 'newPass');
      
      expect(api.put).toHaveBeenCalledWith('/auth/alterar-senha', {
        senha_atual: 'oldPass',
        nova_senha: 'newPass',
      });
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when token exists', () => {
      localStorage.setItem('planac_token', 'test-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('returns false when no token', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getStoredUser', () => {
    it('returns parsed user from localStorage', () => {
      const user = { id: '1', nome: 'Test' };
      localStorage.setItem('planac_user', JSON.stringify(user));
      
      expect(authService.getStoredUser()).toEqual(user);
    });

    it('returns null when no user stored', () => {
      expect(authService.getStoredUser()).toBeNull();
    });
  });
});
