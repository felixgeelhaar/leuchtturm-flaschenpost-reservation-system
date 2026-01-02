import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Reservation, User, Magazine } from '@/types';

// Unmock the EmailService to test the actual implementation
vi.unmock('@/lib/email/email-service');

// Mock nodemailer - create transporter mock before mocking
const mockTransporter = {
  sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  verify: vi.fn().mockResolvedValue(true),
};

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => mockTransporter),
  },
}));

// Mock website config modules
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
    magazine: {
      title: 'Test Magazine',
      subtitle: 'Test Subtitle',
    },
    email: {
      from: 'test@example.com',
      replyTo: 'noreply@example.com',
      signature: 'Test Signature',
    },
    pricing: {
      magazinePrice: 5.99,
      shippingCost: 2.5,
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

const { EmailService } = await import('@/lib/email/email-service');

describe('EmailService - Real Implementation', () => {
  let emailService: EmailService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    consentVersion: '1.0',
    consentTimestamp: '2024-01-01T00:00:00Z',
    dataRetentionUntil: '2025-01-01T00:00:00Z',
    lastActivity: '2024-01-01T00:00:00Z',
  };

  const mockMagazine: Magazine = {
    id: 'mag-123',
    title: 'Flaschenpost',
    issueNumber: '2024-01',
    publishDate: '2024-01-01T00:00:00Z',
    description: 'Test Magazine',
    totalCopies: 100,
    availableCopies: 95,
    coverImageUrl: 'https://example.com/cover.jpg',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockReservationPickup: Reservation = {
    id: 'res-123',
    userId: 'user-123',
    magazineId: 'mag-123',
    quantity: 1,
    status: 'confirmed',
    reservationDate: '2024-01-01T00:00:00Z',
    deliveryMethod: 'pickup',
    pickupDate: '2024-01-15T10:00:00Z',
    pickupLocation: 'Test Kindergarten',
    paymentMethod: undefined,
    consentReference: 'consent-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    expiresAt: '2024-01-08T00:00:00Z',
  };

  const mockReservationShipping: Reservation = {
    id: 'res-124',
    userId: 'user-123',
    magazineId: 'mag-123',
    quantity: 1,
    status: 'confirmed',
    reservationDate: '2024-01-01T00:00:00Z',
    deliveryMethod: 'shipping',
    paymentMethod: 'paypal',
    shippingAddress: {
      street: 'Test Street',
      houseNumber: '123',
      postalCode: '10115',
      city: 'Berlin',
      country: 'DE',
    },
    consentReference: 'consent-124',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    expiresAt: '2024-01-08T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTransporter.sendMail.mockClear();
    mockTransporter.verify.mockClear();
    mockTransporter.sendMail.mockResolvedValue({
      messageId: 'test-message-id',
    });
    mockTransporter.verify.mockResolvedValue(true);
    emailService = new EmailService({
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      auth: { user: 'test@test.com', pass: 'test-pass' },
      from: 'noreply@test.com',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Email Service Initialization', () => {
    it('creates email service with default configuration', () => {
      const service = new EmailService({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: { user: 'test@test.com', pass: 'test-pass' },
        from: 'noreply@test.com',
      });
      expect(service).toBeDefined();
    });

    it('creates email service with custom configuration', () => {
      const customConfig = {
        host: 'custom.smtp.com',
        port: 465,
        secure: true,
        auth: { user: 'custom@example.com', pass: 'custompass' },
        from: 'custom@example.com',
      };

      const customEmailService = new EmailService(customConfig);
      expect(customEmailService).toBeDefined();
    });

    it('handles missing SMTP credentials gracefully', () => {
      expect(
        () =>
          new EmailService({
            host: 'smtp.test.com',
            port: 587,
            secure: false,
            auth: { user: '', pass: '' },
            from: 'noreply@test.com',
          }),
      ).toThrow('SMTP credentials not configured');
    });
  });

  describe('Connection Verification', () => {
    it('verifies email connection successfully', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      await expect(emailService.verifyConnection()).resolves.not.toThrow();

      expect(mockTransporter.verify).toHaveBeenCalledTimes(1);
    });

    it('handles connection verification failure', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      await expect(emailService.verifyConnection()).rejects.toThrow();

      expect(mockTransporter.verify).toHaveBeenCalledTimes(1);
    });
  });

  describe('Reservation Confirmation Emails', () => {
    it('sends pickup confirmation email', async () => {
      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);

      const emailArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailArgs.to).toBe(mockUser.email);
      expect(emailArgs.subject).toContain('Reservierung');
      expect(emailArgs.subject).toContain(mockMagazine.title);
      expect(emailArgs.html).toContain('Abholung');
      expect(emailArgs.html).toContain(mockReservationPickup.pickupLocation);
      expect(emailArgs.html).toContain(mockUser.firstName);
    });

    it('sends shipping confirmation email', async () => {
      await emailService.sendReservationConfirmation({
        reservation: mockReservationShipping,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);

      const emailArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailArgs.subject).toContain('Reservierung');
      expect(emailArgs.html).toContain('Versand');
      expect(emailArgs.html).toContain('PayPal');
    });

    it('includes reservation details in confirmation email', async () => {
      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      const emailArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailArgs.html).toContain('RES-123'); // First 8 characters uppercase
      expect(emailArgs.html).toContain(mockMagazine.issueNumber);
      expect(emailArgs.html).toContain(
        mockReservationPickup.quantity.toString(),
      );
    });

    it('handles email sending errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));

      await expect(
        emailService.sendReservationConfirmation({
          reservation: mockReservationPickup,
          user: mockUser,
          magazine: mockMagazine,
        }),
      ).rejects.toThrow('Send failed');
    });
  });

  describe('Reservation Cancellation Emails', () => {
    it('sends cancellation email successfully', async () => {
      await emailService.sendCancellationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);

      const emailArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailArgs.to).toBe(mockUser.email);
      expect(emailArgs.subject).toContain('storniert');
      expect(emailArgs.html).toContain('storniert');
      expect(emailArgs.html).toContain('RES-123');
    });

    it('handles cancellation email errors gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));

      await expect(
        emailService.sendCancellationConfirmation({
          reservation: mockReservationPickup,
          user: mockUser,
          magazine: mockMagazine,
        }),
      ).rejects.toThrow('Failed to send cancellation email');
    });
  });

  describe('Pickup Reminder Emails', () => {
    it('sends pickup reminder for pickup reservations', async () => {
      await emailService.sendPickupReminder({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);

      const emailArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailArgs.subject).toContain('Erinnerung');
      expect(emailArgs.html).toContain('Abholung');
      expect(emailArgs.html).toContain(mockReservationPickup.pickupLocation);
    });

    it('sends reminder for all reservations', async () => {
      await emailService.sendPickupReminder({
        reservation: mockReservationShipping,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    });

    it('sends reminder even when pickup details are missing', async () => {
      const reservationWithoutPickup = {
        ...mockReservationPickup,
        pickupLocation: undefined,
        pickupDate: undefined,
      };

      await emailService.sendPickupReminder({
        reservation: reservationWithoutPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('Email Content Validation', () => {
    it('includes user name in all emails', async () => {
      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      const emailArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailArgs.html).toContain(
        `${mockUser.firstName} ${mockUser.lastName}`,
      );
    });

    it('includes magazine details in confirmation', async () => {
      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      const emailArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailArgs.html).toContain(mockMagazine.title);
      expect(emailArgs.html).toContain(mockMagazine.issueNumber);
    });

    it('formats dates correctly in emails', async () => {
      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      const emailArgs = mockTransporter.sendMail.mock.calls[0][0];
      // Should contain some date reference for pickup
      expect(emailArgs.html).toContain('Termin');
    });

    it('includes proper HTML structure', async () => {
      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      const emailArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailArgs.html).toContain('<!DOCTYPE html>');
      expect(emailArgs.html).toContain('<html');
      expect(emailArgs.html).toContain('</html>');
    });

    it('includes text version of emails', async () => {
      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      const emailArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailArgs.text).toBeDefined();
      expect(typeof emailArgs.text).toBe('string');
      expect(emailArgs.text.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('throws detailed error on configuration issues', () => {
      expect(() => {
        new EmailService({
          host: 'test.com',
          port: 587,
          secure: false,
          auth: { user: '', pass: '' }, // Empty credentials
          from: 'invalid-email', // Invalid email format
        });
      }).toThrow('SMTP credentials not configured'); // Should throw on empty credentials
    });

    it('provides helpful error messages on send failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error('Authentication failed'),
      );

      await expect(
        emailService.sendReservationConfirmation({
          reservation: mockReservationPickup,
          user: mockUser,
          magazine: mockMagazine,
        }),
      ).rejects.toThrow('Authentication failed');
    });
  });
});
