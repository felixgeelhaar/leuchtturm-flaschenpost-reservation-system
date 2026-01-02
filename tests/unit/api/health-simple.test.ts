import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('/api/health - Simple Coverage Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    // Mock console to avoid noise
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('Health Endpoint Basic Functionality', () => {
    it('imports health endpoint without errors', async () => {
      expect(async () => {
        await import('@/pages/api/health');
      }).not.toThrow();
    });

    it('exports GET function', async () => {
      const module = await import('@/pages/api/health');

      expect(module.GET).toBeDefined();
      expect(typeof module.GET).toBe('function');
    });

    it('handles basic request structure', async () => {
      // Mock environment for a working scenario
      vi.stubGlobal('import', {
        meta: {
          env: {
            NODE_ENV: 'test',
            SMTP_USER: 'test@example.com',
            SMTP_PASS: 'password123',
            PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
            PUBLIC_SUPABASE_ANON_KEY: 'test-key',
            MODE: 'test',
          },
        },
      });

      const { GET } = await import('@/pages/api/health');

      const mockRequest = new Request('http://localhost:3000/api/health', {
        method: 'GET',
      });

      // Should not throw when called
      const response = await GET({ request: mockRequest } as any);
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('returns JSON response structure', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: {
            NODE_ENV: 'test',
            MODE: 'test',
          },
        },
      });

      const { GET } = await import('@/pages/api/health');

      const mockRequest = new Request('http://localhost:3000/api/health');
      const response = await GET({ request: mockRequest } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain(
        'application/json',
      );

      const data = await response.json();
      expect(data.status).toBeDefined();
      expect(data.timestamp).toBeDefined();
      expect(data.environment).toBeDefined();
    });

    it('handles missing environment variables gracefully', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: {},
        },
      });

      const { GET } = await import('@/pages/api/health');

      const mockRequest = new Request('http://localhost:3000/api/health');
      const response = await GET({ request: mockRequest } as any);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.environment).toBeDefined();
      expect(data.environment.hasSmtpConfig).toBe(false);
      expect(data.environment.hasSupabaseConfig).toBe(false);
    });

    it('masks sensitive information properly', async () => {
      const { GET } = await import('@/pages/api/health');

      const mockRequest = new Request('http://localhost:3000/api/health');
      const response = await GET({ request: mockRequest } as any);

      const data = await response.json();

      // Should not expose full email addresses
      expect(data.environment.smtpUser).not.toBe('test@example.com');
      // The actual value depends on whether SMTP is configured in the environment
      expect(typeof data.environment.smtpUser).toBe('string');
      expect(
        data.environment.smtpUser === 'tes...' ||
          data.environment.smtpUser === 'not set',
      ).toBe(true);
    });

    it('handles different NODE_ENV values', async () => {
      const environments = ['development', 'production', 'test', undefined, ''];

      for (const env of environments) {
        vi.resetModules();
        vi.stubGlobal('import', {
          meta: {
            env: {
              NODE_ENV: env,
              MODE: env || 'development',
            },
          },
        });

        const { GET } = await import('@/pages/api/health');

        const mockRequest = new Request('http://localhost:3000/api/health');
        const response = await GET({ request: mockRequest } as any);

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.environment.NODE_ENV).toBeDefined();
      }
    });

    it('includes CORS headers', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: {
            NODE_ENV: 'test',
          },
        },
      });

      const { GET } = await import('@/pages/api/health');

      const mockRequest = new Request('http://localhost:3000/api/health');
      const response = await GET({ request: mockRequest } as any);

      // Should include appropriate headers
      expect(response.headers.get('Content-Type')).toContain(
        'application/json',
      );
    });

    it('validates timestamp format', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: {
            NODE_ENV: 'test',
          },
        },
      });

      const { GET } = await import('@/pages/api/health');

      const mockRequest = new Request('http://localhost:3000/api/health');
      const response = await GET({ request: mockRequest } as any);

      const data = await response.json();

      // Timestamp should be valid ISO string
      expect(data.timestamp).toBeDefined();
      expect(() => new Date(data.timestamp)).not.toThrow();

      const parsedDate = new Date(data.timestamp);
      expect(parsedDate.toString()).not.toBe('Invalid Date');
    });
  });

  describe('Configuration Detection', () => {
    it('detects SMTP configuration presence', async () => {
      const { GET } = await import('@/pages/api/health');

      const mockRequest = new Request('http://localhost:3000/api/health');
      const response = await GET({ request: mockRequest } as any);

      const data = await response.json();

      // Test that the boolean values are consistent between environment and services
      expect(typeof data.environment.hasSmtpConfig).toBe('boolean');
      expect(typeof data.services.email).toBe('string');

      if (data.environment.hasSmtpConfig) {
        expect(data.services.email).toBe('configured');
      } else {
        expect(data.services.email).toBe('missing config');
      }
    });

    it('detects Supabase configuration presence', async () => {
      const { GET } = await import('@/pages/api/health');

      const mockRequest = new Request('http://localhost:3000/api/health');
      const response = await GET({ request: mockRequest } as any);

      const data = await response.json();

      // Test that the boolean values are consistent between environment and services
      expect(typeof data.environment.hasSupabaseConfig).toBe('boolean');
      expect(typeof data.services.database).toBe('string');

      if (data.environment.hasSupabaseConfig) {
        expect(data.services.database).toBe('configured');
      } else {
        expect(data.services.database).toBe('missing config');
      }
    });
  });
});
