import { describe, it, expect } from 'vitest';
import type { Reservation, User, Magazine } from '@/types';

describe('EmailService with mocking', () => {
  // Test that the global mock works as expected for basic functionality
  it('should use the global email service mock', async () => {
    const { emailService } = await import('@/lib/email/email-service');

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

    const mockReservation: Reservation = {
      id: 'res-123',
      userId: 'user-123',
      magazineId: 'mag-123',
      quantity: 2,
      status: 'confirmed',
      reservationDate: '2024-01-01T00:00:00Z',
      deliveryMethod: 'pickup',
      pickupLocation: 'Berlin Mitte',
      pickupDate: '2024-01-02T00:00:00Z',
      paymentMethod: null,
      orderGroupPicture: false,
      orderVorschulPicture: false,
      childGroupName: '',
      childName: '',
      consentReference: 'consent-ref-123',
      expiresAt: '2024-01-08T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    // This should call the mocked function
    await expect(
      emailService.sendReservationConfirmation({
        reservation: mockReservation,
        user: mockUser,
        magazine: mockMagazine,
      }),
    ).resolves.toBeUndefined();

    // Verify the mock was called
    expect(emailService.sendReservationConfirmation).toHaveBeenCalledTimes(1);
  });

  it('should handle email service verification', async () => {
    const { emailService } = await import('@/lib/email/email-service');

    // This should call the mocked function without throwing
    await expect(emailService.verifyConnection()).resolves.toBe(true);

    // Verify the mock was called
    expect(emailService.verifyConnection).toHaveBeenCalledTimes(1);
  });

  it('should handle cancellation confirmation', async () => {
    const { emailService } = await import('@/lib/email/email-service');

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

    const mockReservation: Reservation = {
      id: 'res-123',
      userId: 'user-123',
      magazineId: 'mag-123',
      quantity: 1,
      status: 'cancelled',
      reservationDate: '2024-01-01T00:00:00Z',
      deliveryMethod: 'pickup',
      pickupLocation: 'Berlin Mitte',
      pickupDate: '2024-01-02T00:00:00Z',
      paymentMethod: null,
      orderGroupPicture: false,
      orderVorschulPicture: false,
      childGroupName: '',
      childName: '',
      consentReference: 'consent-ref-123',
      expiresAt: '2024-01-08T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    // This should call the mocked function
    await expect(
      emailService.sendCancellationConfirmation({
        reservation: mockReservation,
        user: mockUser,
        magazine: mockMagazine,
      }),
    ).resolves.toBeUndefined();

    // Verify the mock was called
    expect(emailService.sendCancellationConfirmation).toHaveBeenCalledTimes(1);
  });
});
