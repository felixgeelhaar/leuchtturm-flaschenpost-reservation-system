import { vi } from 'vitest';
import { config } from '@vue/test-utils';

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

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
    })),
  })),
  createClientSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
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