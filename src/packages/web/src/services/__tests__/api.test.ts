import { describe, it, expect, vi, beforeEach } from 'vitest';

// Precisamos mockar o fetch global
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('includes Authorization header when token exists', async () => {
    localStorage.setItem('planac_token', 'test-token');
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    // Import fresh to get localStorage value
    const { default: api } = await import('../api');
    await api.get('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
        }),
      })
    );
  });

  it('handles 401 response by clearing token', async () => {
    localStorage.setItem('planac_token', 'expired-token');
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });

    const { default: api } = await import('../api');
    
    try {
      await api.get('/test');
    } catch (e) {
      // Expected to throw
    }

    // Token should be cleared on 401
    expect(localStorage.getItem('planac_token')).toBeNull();
  });
});
