import { vi } from 'vitest';
import { config } from '@vue/test-utils';

// Set up mock environment variables before anything else
vi.stubGlobal('import', {
  meta: {
    env: {
      PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      SMTP_HOST: 'smtp.test.com',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'test@example.com',
      SMTP_PASS: 'password123',
      SMTP_FROM: 'noreply@example.com',
      MODE: 'test',
      NODE_ENV: 'test',
    },
  },
});

// Mock global objects
Object.defineProperty(window, 'fetch', {
  value: vi.fn(),
});

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

// Create a chainable mock for Supabase queries
const createMockChain = () => {
  const mockPromise = Promise.resolve({ data: [], error: null });
  
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lt: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    like: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    is: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    range: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: mockPromise.then.bind(mockPromise),
    catch: mockPromise.catch.bind(mockPromise),
    finally: mockPromise.finally.bind(mockPromise),
  };
  
  return chain;
};

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => createMockChain()),
  },
  createServerSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => createMockChain()),
  })),
  createClientSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => createMockChain()),
  })),
}));

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
      verify: vi.fn().mockResolvedValue(true),
    }),
  },
}));

// Mock the email service to prevent actual emails during tests
vi.mock('@/lib/email/email-service', () => ({
  emailService: {
    sendReservationConfirmation: vi.fn().mockResolvedValue(undefined),
    sendReservationCancellation: vi.fn().mockResolvedValue(undefined),
    sendPickupReminder: vi.fn().mockResolvedValue(undefined),
    verifyConnection: vi.fn().mockResolvedValue(true),
  },
  EmailService: vi.fn().mockImplementation(() => ({
    sendReservationConfirmation: vi.fn().mockResolvedValue(undefined),
    sendReservationCancellation: vi.fn().mockResolvedValue(undefined),
    sendPickupReminder: vi.fn().mockResolvedValue(undefined),
    verifyConnection: vi.fn().mockResolvedValue(true),
  })),
}));

// Global test utilities
config.global.stubs = {
  // Stub Astro-specific components if needed
};

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
};