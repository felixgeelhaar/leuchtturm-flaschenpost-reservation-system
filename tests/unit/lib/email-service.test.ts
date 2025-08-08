import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Reservation, User, Magazine } from '@/types';

// Mock nodemailer
const mockTransporter = {
  sendMail: vi.fn(),
  verify: vi.fn(),
};

vi.mock('nodemailer', () => ({
  default: {
    createTransporter: vi.fn(() => mockTransporter),
  },
}));

// Mock config modules
vi.mock('@/config/content', () => ({
  websiteContent: {
    kindergarten: { 
      name: 'Test Kindergarten', 
      contact: {
        email: 'info@test.de',
        address: {
          street: 'Test St. 123',
          postalCode: '12345',
          city: 'Berlin',
        },
      },
    },
    magazine: { title: 'Flaschenpost', subtitle: 'Das Kita-Magazin' },
    email: { 
      from: 'noreply@test-kindergarten.de',
      replyTo: 'info@test-kindergarten.de',
      signature: 'Ihr Team von Test Kindergarten',
    },
    pricing: { 
      magazinePrice: 5.99,
      shippingCost: 2.50,
    },
  },
}));

vi.mock('@/config/payment', () => ({
  paymentConfig: { 
    paypal: { 
      enabled: true,
      paypalMeLink: 'https://paypal.me/test',
    },
  },
  generatePaymentReference: vi.fn(() => 'PAY-123456'),
  formatCurrency: vi.fn((amount) => `€${amount.toFixed(2)}`),
}));

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      SMTP_HOST: 'smtp.test.com',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'test@example.com',
      SMTP_PASS: 'password123',
      SMTP_FROM: 'noreply@example.com',
      MODE: 'test',
    },
  },
});

describe('EmailService', () => {
  let EmailService: any;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    consentVersion: '1.0',
    consentTimestamp: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    dataRetentionUntil: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockMagazine: Magazine = {
    id: 'mag-123',
    title: 'Flaschenpost',
    issueNumber: '2024-01',
    publishDate: new Date().toISOString(),
    description: 'Test Magazine',
    coverImageUrl: 'https://example.com/cover.jpg',
    availableCopies: 50,
    totalCopies: 100,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockReservation: Reservation = {
    id: 'res-123',
    userId: mockUser.id,
    magazineId: mockMagazine.id,
    quantity: 2,
    status: 'confirmed',
    reservationDate: new Date().toISOString(),
    deliveryMethod: 'pickup',
    pickupLocation: 'Berlin Mitte',
    pickupDate: new Date().toISOString(),
    paymentMethod: null,
    orderGroupPicture: false,
    orderVorschulPicture: false,
    childGroupName: '',
    childName: '',
    consentReference: 'consent-ref-123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockTransporter.verify.mockResolvedValue(true);
    mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

    // Import after mocks are set up
    const module = await import('@/lib/email/email-service');
    EmailService = module.EmailService;
  });

  describe('constructor', () => {
    it('should create EmailService instance with valid config', () => {
      expect(() => new EmailService({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@test.com',
          pass: 'test-pass',
        },
        from: 'noreply@test.com',
      })).not.toThrow();
    });

    it('should throw error without credentials', () => {
      expect(() => new EmailService({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: '',
          pass: '',
        },
        from: 'noreply@test.com',
      })).toThrow('SMTP credentials not configured');
    });
  });

  describe('verifyConnection', () => {
    it('should verify email connection successfully', async () => {
      const emailService = new EmailService({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: { user: 'test@test.com', pass: 'test-pass' },
        from: 'noreply@test.com',
      });

      await expect(emailService.verifyConnection()).resolves.not.toThrow();
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle verification failure', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));
      
      const emailService = new EmailService({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: { user: 'test@test.com', pass: 'test-pass' },
        from: 'noreply@test.com',
      });

      await expect(emailService.verifyConnection()).rejects.toThrow('Email service verification failed');
    });
  });

  describe('sendReservationConfirmation', () => {
    it('should send reservation confirmation email', async () => {
      const emailService = new EmailService({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: { user: 'test@test.com', pass: 'test-pass' },
        from: 'noreply@test.com',
      });

      await emailService.sendReservationConfirmation({
        reservation: mockReservation,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Test Kindergarten <noreply@test.com>',
          to: 'test@example.com',
          subject: expect.stringContaining('Flaschenpost'),
          html: expect.stringContaining('Reservierung bestätigt'),
          text: expect.stringContaining('Reservierung bestätigt'),
        }),
      );
    });

    it('should throw error on email send failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const emailService = new EmailService({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: { user: 'test@test.com', pass: 'test-pass' },
        from: 'noreply@test.com',
      });

      await expect(
        emailService.sendReservationConfirmation({
          reservation: mockReservation,
          user: mockUser,
          magazine: mockMagazine,
        }),
      ).rejects.toThrow('Failed to send confirmation email');
    });
  });

  describe('sendCancellationConfirmation', () => {
    it('should send cancellation confirmation email', async () => {
      const emailService = new EmailService({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: { user: 'test@test.com', pass: 'test-pass' },
        from: 'noreply@test.com',
      });

      await emailService.sendCancellationConfirmation({
        reservation: mockReservation,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('storniert'),
          html: expect.stringContaining('storniert'),
          text: expect.stringContaining('storniert'),
        }),
      );
    });
  });

  describe('sendPickupReminder', () => {
    it('should send pickup reminder email', async () => {
      const emailService = new EmailService({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: { user: 'test@test.com', pass: 'test-pass' },
        from: 'noreply@test.com',
      });

      await emailService.sendPickupReminder({
        reservation: mockReservation,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Erinnerung'),
          html: expect.stringContaining('Erinnerung'),
          text: expect.stringContaining('Erinnerung'),
        }),
      );
    });
  });
});