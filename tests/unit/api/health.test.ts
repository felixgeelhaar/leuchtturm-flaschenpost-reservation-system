import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock import.meta.env before importing the module
const mockEnv = {
  MODE: 'development',
  SMTP_USER: '',
  SMTP_PASS: '',
  PUBLIC_SUPABASE_URL: '',
  PUBLIC_SUPABASE_ANON_KEY: '',
};

// Create mockImportMeta for backward compatibility
const mockImportMeta = { env: mockEnv };

vi.mock('import.meta', () => ({
  env: mockEnv,
}));

const { GET, OPTIONS } = await import('@/pages/api/health');

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    Object.assign(mockEnv, {
      MODE: 'development',
      SMTP_USER: '',
      SMTP_PASS: '',
      PUBLIC_SUPABASE_URL: '',
      PUBLIC_SUPABASE_ANON_KEY: '',
    });
  });

  describe('GET /api/health', () => {
    it('returns healthy status with all configurations present', async () => {
      Object.assign(mockEnv, {
        MODE: 'development',
        SMTP_USER: 'test@example.com',
        SMTP_PASS: 'password123',
        PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      });

      const response = await GET({} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
      expect(data.environment).toEqual({
        NODE_ENV: 'development',
        hasSmtpConfig: true,
        hasSupabaseConfig: true,
        smtpUser: 'tes...',
      });
      expect(data.services).toEqual({
        database: 'configured',
        email: 'configured',
      });
    });

    it('shows missing configuration when SMTP is not configured', async () => {
      mockImportMeta.env = {
        MODE: 'production',
        PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      };

      const response = await GET({} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.environment.hasSmtpConfig).toBe(false);
      expect(data.environment.hasSupabaseConfig).toBe(true);
      expect(data.environment.smtpUser).toBe('not set');
      expect(data.services.email).toBe('missing config');
      expect(data.services.database).toBe('configured');
    });

    it('shows missing configuration when Supabase is not configured', async () => {
      mockImportMeta.env = {
        MODE: 'test',
        SMTP_USER: 'test@example.com',
        SMTP_PASS: 'password123',
      };

      const response = await GET({} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.environment.hasSmtpConfig).toBe(true);
      expect(data.environment.hasSupabaseConfig).toBe(false);
      expect(data.services.email).toBe('configured');
      expect(data.services.database).toBe('missing config');
    });

    it('handles partial SMTP configuration (missing password)', async () => {
      mockImportMeta.env = {
        SMTP_USER: 'test@example.com',
        // SMTP_PASS is missing
        PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      };

      const response = await GET({} as any);
      const data = await response.json();

      expect(data.environment.hasSmtpConfig).toBe(false);
      expect(data.services.email).toBe('missing config');
    });

    it('handles partial SMTP configuration (missing user)', async () => {
      mockImportMeta.env = {
        SMTP_PASS: 'password123',
        // SMTP_USER is missing
        PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      };

      const response = await GET({} as any);
      const data = await response.json();

      expect(data.environment.hasSmtpConfig).toBe(false);
      expect(data.environment.smtpUser).toBe('not set');
      expect(data.services.email).toBe('missing config');
    });

    it('handles partial Supabase configuration (missing URL)', async () => {
      mockImportMeta.env = {
        SMTP_USER: 'test@example.com',
        SMTP_PASS: 'password123',
        PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        // PUBLIC_SUPABASE_URL is missing
      };

      const response = await GET({} as any);
      const data = await response.json();

      expect(data.environment.hasSupabaseConfig).toBe(false);
      expect(data.services.database).toBe('missing config');
    });

    it('handles partial Supabase configuration (missing anon key)', async () => {
      mockImportMeta.env = {
        SMTP_USER: 'test@example.com',
        SMTP_PASS: 'password123',
        PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        // PUBLIC_SUPABASE_ANON_KEY is missing
      };

      const response = await GET({} as any);
      const data = await response.json();

      expect(data.environment.hasSupabaseConfig).toBe(false);
      expect(data.services.database).toBe('missing config');
    });

    it('returns unknown environment when MODE is not set', async () => {
      mockImportMeta.env = {
        SMTP_USER: 'test@example.com',
        SMTP_PASS: 'password123',
        PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        // MODE is missing
      };

      const response = await GET({} as any);
      const data = await response.json();

      expect(data.environment.NODE_ENV).toBe('unknown');
    });

    it('properly masks SMTP user email address', async () => {
      mockImportMeta.env = {
        SMTP_USER: 'verylongemailtestuser@example.com',
        SMTP_PASS: 'password123',
        PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      };

      const response = await GET({} as any);
      const data = await response.json();

      expect(data.environment.smtpUser).toBe('ver...');
    });

    it('includes proper headers for health endpoint', async () => {
      mockImportMeta.env = {};

      const response = await GET({} as any);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('includes timestamp in response', async () => {
      const beforeTime = new Date().toISOString();
      
      const response = await GET({} as any);
      const data = await response.json();
      
      const afterTime = new Date().toISOString();

      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
      expect(new Date(data.timestamp).getTime()).toBeLessThanOrEqual(new Date(afterTime).getTime());
    });

    it('handles empty environment variables gracefully', async () => {
      mockImportMeta.env = {
        SMTP_USER: '',
        SMTP_PASS: '',
        PUBLIC_SUPABASE_URL: '',
        PUBLIC_SUPABASE_ANON_KEY: '',
      };

      const response = await GET({} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.environment.hasSmtpConfig).toBe(false);
      expect(data.environment.hasSupabaseConfig).toBe(false);
      expect(data.services.email).toBe('missing config');
      expect(data.services.database).toBe('missing config');
    });
  });

  describe('OPTIONS /api/health', () => {
    it('returns proper CORS headers for preflight request', async () => {
      const response = await OPTIONS({} as any);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });

    it('returns no body for OPTIONS request', async () => {
      const response = await OPTIONS({} as any);
      const text = await response.text();

      expect(text).toBe('');
    });
  });
});