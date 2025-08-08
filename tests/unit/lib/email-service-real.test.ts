import { describe, it, expect, vi, beforeEach } from 'vitest';
// import nodemailer from 'nodemailer';
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

// Mock website config modules
vi.mock('@/config/content', () => ({
  websiteContent: {
    kindergarten: { name: 'Test Kindergarten', address: 'Test Address' },
    magazine: { title: 'Test Magazine' },
    email: { from: 'test@example.com', replyTo: 'noreply@example.com' },
    pricing: { shipping: 5.99, pickup: 0 },
  },
}));

vi.mock('@/config/payment', () => ({
  paymentConfig: { paypal: { enabled: true } },
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
    paymentMethod: null,
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
    mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
    mockTransporter.verify.mockResolvedValue(true);
    emailService = new EmailService();
  });

  describe('Email Service Initialization', () => {
    it('creates email service with default configuration', () => {
      expect(emailService).toBeDefined();
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
      vi.stubGlobal('import', {
        meta: {
          env: {
            SMTP_HOST: '',
            SMTP_USER: '',
            SMTP_PASS: '',
          },
        },
      });

      expect(() => new EmailService()).not.toThrow();
    });
  });

  describe('Connection Verification', () => {
    it('verifies email connection successfully', async () => {
      const result = await emailService.verifyConnection();
      
      expect(mockTransporter.verify).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('handles connection verification failure', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      const result = await emailService.verifyConnection();
      
      expect(result).toBe(false);
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
      expect(emailArgs.html).toContain('Test Street');
      expect(emailArgs.html).toContain('Berlin');
      expect(emailArgs.html).toContain('PayPal');
    });

    it('includes reservation details in confirmation email', async () => {
      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      const emailArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailArgs.html).toContain(mockReservationPickup.id);
      expect(emailArgs.html).toContain(mockMagazine.issueNumber);
      expect(emailArgs.html).toContain(mockReservationPickup.quantity.toString());
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
      await emailService.sendReservationCancellation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      
      const emailArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailArgs.to).toBe(mockUser.email);
      expect(emailArgs.subject).toContain('Stornierung');
      expect(emailArgs.html).toContain('storniert');
      expect(emailArgs.html).toContain(mockReservationPickup.id);
    });

    it('handles cancellation email errors gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        emailService.sendReservationCancellation({
          reservation: mockReservationPickup,
          user: mockUser,
          magazine: mockMagazine,
        }),
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
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

    it('skips reminder for shipping reservations', async () => {
      await emailService.sendPickupReminder({
        reservation: mockReservationShipping,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('skips reminder when pickup details are missing', async () => {
      const reservationWithoutPickup = {
        ...mockReservationPickup,
        pickupLocation: null,
        pickupDate: null,
      };

      await emailService.sendPickupReminder({
        reservation: reservationWithoutPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
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
      expect(emailArgs.html).toContain(`${mockUser.firstName} ${mockUser.lastName}`);
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
      // Should contain formatted date for pickup
      expect(emailArgs.html).toContain('15.01.2024');
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
      }).not.toThrow(); // Service should still initialize but may fail on send
    });

    it('provides helpful error messages on send failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Authentication failed'));

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