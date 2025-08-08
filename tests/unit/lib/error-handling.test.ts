import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the environment config
vi.mock('@/lib/config/environment', () => ({
  isProduction: vi.fn(() => false),
}));

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Types and Classes', () => {
    it('imports error handling module without errors', async () => {
      expect(async () => {
        await import('@/lib/error-handling');
      }).not.toThrow();
    });

    it('exports ErrorCategory enum', async () => {
      const { ErrorCategory } = await import('@/lib/error-handling');
      
      expect(ErrorCategory.NETWORK).toBe('network');
      expect(ErrorCategory.VALIDATION).toBe('validation');
      expect(ErrorCategory.AUTHENTICATION).toBe('authentication');
      expect(ErrorCategory.AUTHORIZATION).toBe('authorization');
      expect(ErrorCategory.NOT_FOUND).toBe('not_found');
      expect(ErrorCategory.SERVER_ERROR).toBe('server_error');
      expect(ErrorCategory.CLIENT_ERROR).toBe('client_error');
      expect(ErrorCategory.UNKNOWN).toBe('unknown');
    });

    it('creates NetworkError with correct properties', async () => {
      const { NetworkError } = await import('@/lib/error-handling');
      
      const error = new NetworkError('Connection failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('Error');
      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.statusCode).toBe(0);
      expect(error.userMessage).toBe('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.');
    });

    it('creates ValidationError with correct properties', async () => {
      const { ValidationError } = await import('@/lib/error-handling');
      
      const error = new ValidationError('Invalid input', { field: 'email' });
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.context).toEqual({ field: 'email' });
    });

    it('creates AuthenticationError with correct properties', async () => {
      const { AuthenticationError } = await import('@/lib/error-handling');
      
      const error = new AuthenticationError('Invalid credentials');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Invalid credentials');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
    });

    it('creates AuthorizationError with correct properties', async () => {
      const { AuthorizationError } = await import('@/lib/error-handling');
      
      const error = new AuthorizationError('Access denied');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Access denied');
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.statusCode).toBe(403);
    });

    it('creates NotFoundError with correct properties', async () => {
      const { NotFoundError } = await import('@/lib/error-handling');
      
      const error = new NotFoundError('Resource not found');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Resource not found');
      expect(error.code).toBe('NOT_FOUND_ERROR');
      expect(error.statusCode).toBe(404);
    });

    it('creates ServerError with correct properties', async () => {
      const { ServerError } = await import('@/lib/error-handling');
      
      const error = new ServerError('Internal server error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Internal server error');
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('Error Helper Functions', () => {
    it('categorizes errors correctly', async () => {
      const { categorizeError } = await import('@/lib/error-handling');
      
      expect(categorizeError(new Error('fetch failed'))).toBe('network');
      expect(categorizeError(new Error('Invalid email'))).toBe('validation');
      expect(categorizeError(new Error('Unauthorized'))).toBe('authentication');
      expect(categorizeError(new Error('Forbidden'))).toBe('authorization');
      expect(categorizeError(new Error('Not found'))).toBe('not_found');
      expect(categorizeError(new Error('Internal server error'))).toBe('server_error');
      expect(categorizeError(new Error('Random error'))).toBe('unknown');
    });

    it('creates error reports', async () => {
      const { createErrorReport } = await import('@/lib/error-handling');
      
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test';
      
      const report = createErrorReport(error, 'https://example.com/test', 'Mozilla/5.0');
      
      expect(report).toMatchObject({
        message: 'Test error',
        stack: 'Error: Test error\n    at test',
        url: 'https://example.com/test',
        userAgent: 'Mozilla/5.0',
        timestamp: expect.any(String),
      });
      expect(new Date(report.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('formats errors for users', async () => {
      const { formatErrorForUser } = await import('@/lib/error-handling');
      
      const networkError = new Error('fetch failed');
      const validationError = new Error('Invalid email format');
      const unknownError = new Error('Something weird happened');
      
      expect(formatErrorForUser(networkError)).toBe('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.');
      expect(formatErrorForUser(validationError)).toBe('Ungültige Eingabe. Bitte überprüfen Sie Ihre Daten.');
      expect(formatErrorForUser(unknownError)).toBe('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    });

    it('checks if errors are retriable', async () => {
      const { isRetriableError } = await import('@/lib/error-handling');
      
      const networkError = new Error('fetch failed');
      const validationError = new Error('Invalid email');
      const serverError = new Error('Internal server error');
      
      expect(isRetriableError(networkError)).toBe(true);
      expect(isRetriableError(validationError)).toBe(false);
      expect(isRetriableError(serverError)).toBe(true);
    });
  });

  describe('Error Logging', () => {
    it('logs errors in development mode', async () => {
      const { isProduction } = await import('@/lib/config/environment');
      vi.mocked(isProduction).mockReturnValue(false);
      
      const { logError } = await import('@/lib/error-handling');
      
      const error = new Error('Test error');
      logError(error);
      
      expect(console.error).toHaveBeenCalledWith('❌ Error:', expect.objectContaining({
        message: 'Test error',
        timestamp: expect.any(String),
      }));
    });

    it('logs errors in production mode', async () => {
      const { isProduction } = await import('@/lib/config/environment');
      vi.mocked(isProduction).mockReturnValue(true);
      
      const { logError } = await import('@/lib/error-handling');
      
      const error = new Error('Test error');
      logError(error);
      
      expect(console.error).toHaveBeenCalledWith('Error logged:', expect.any(String));
    });

    it('logs error context when provided', async () => {
      const { logError } = await import('@/lib/error-handling');
      
      const error = new Error('Test error');
      const context = { userId: '123', action: 'submit_form' };
      
      logError(error, context);
      
      expect(console.error).toHaveBeenCalledWith('❌ Error:', expect.objectContaining({
        message: 'Test error',
        context: { userId: '123', action: 'submit_form' },
      }));
    });
  });

  describe('Error Recovery', () => {
    it('handles retry mechanism', async () => {
      const { withRetry } = await import('@/lib/error-handling');
      
      let attempts = 0;
      const mockFn = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });
      
      const result = await withRetry(mockFn, 3, 10);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('fails after max retries', async () => {
      const { withRetry } = await import('@/lib/error-handling');
      
      const mockFn = vi.fn(async () => {
        throw new Error('Persistent failure');
      });
      
      await expect(withRetry(mockFn, 2, 10)).rejects.toThrow('Persistent failure');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('does not retry non-retriable errors', async () => {
      const { withRetry } = await import('@/lib/error-handling');
      
      const mockFn = vi.fn(async () => {
        throw new Error('Invalid email'); // Validation error - not retriable
      });
      
      await expect(withRetry(mockFn, 3, 10)).rejects.toThrow('Invalid email');
      expect(mockFn).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('Error Boundaries', () => {
    it('handles async errors gracefully', async () => {
      const { handleAsyncError } = await import('@/lib/error-handling');
      
      const asyncFn = async () => {
        throw new Error('Async error');
      };
      
      const result = await handleAsyncError(asyncFn, 'default value');
      
      expect(result).toBe('default value');
      expect(console.error).toHaveBeenCalled();
    });

    it('returns result when no error occurs', async () => {
      const { handleAsyncError } = await import('@/lib/error-handling');
      
      const asyncFn = async () => 'success';
      
      const result = await handleAsyncError(asyncFn, 'default value');
      
      expect(result).toBe('success');
    });
  });

  describe('Error Context', () => {
    it('enriches errors with context', async () => {
      const { enrichError } = await import('@/lib/error-handling');
      
      const error = new Error('Base error');
      const context = {
        userId: '123',
        sessionId: 'abc',
        action: 'form_submit',
      };
      
      const enrichedError = enrichError(error, context);
      
      expect(enrichedError.message).toBe('Base error');
      expect(enrichedError.context).toEqual(context);
      expect(enrichedError.timestamp).toBeDefined();
    });

    it('preserves existing error properties', async () => {
      const { enrichError } = await import('@/lib/error-handling');
      
      const error = new Error('Base error');
      error.stack = 'original stack';
      
      const enrichedError = enrichError(error, { extra: 'data' });
      
      expect(enrichedError.stack).toBe('original stack');
      expect(enrichedError.message).toBe('Base error');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles null and undefined errors', async () => {
      const { formatErrorForUser, logError } = await import('@/lib/error-handling');
      
      expect(() => formatErrorForUser(null as any)).not.toThrow();
      expect(() => formatErrorForUser(undefined as any)).not.toThrow();
      expect(() => logError(null as any)).not.toThrow();
      expect(() => logError(undefined as any)).not.toThrow();
    });

    it('handles errors without messages', async () => {
      const { formatErrorForUser, createErrorReport } = await import('@/lib/error-handling');
      
      const error = new Error();
      error.message = '';
      
      expect(() => formatErrorForUser(error)).not.toThrow();
      expect(() => createErrorReport(error, '/', 'test')).not.toThrow();
    });

    it('handles circular references in error context', async () => {
      const { enrichError, logError } = await import('@/lib/error-handling');
      
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      const error = new Error('Test');
      
      expect(() => enrichError(error, { circular })).not.toThrow();
      expect(() => logError(error, { circular })).not.toThrow();
    });

    it('handles very large error messages', async () => {
      const { formatErrorForUser, logError } = await import('@/lib/error-handling');
      
      const largeMessage = 'x'.repeat(10000);
      const error = new Error(largeMessage);
      
      expect(() => formatErrorForUser(error)).not.toThrow();
      expect(() => logError(error)).not.toThrow();
    });
  });
});