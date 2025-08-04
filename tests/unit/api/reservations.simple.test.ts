import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database service
const mockDb = {
  getMagazineById: vi.fn(),
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
  createReservation: vi.fn(),
  updateUserActivity: vi.fn(),
  recordConsent: vi.fn(),
  getUserConsents: vi.fn(),
  logDataProcessing: vi.fn(),
};

// Mock the email service
const mockEmailService = {
  sendReservationConfirmation: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/lib/database', () => ({
  DatabaseService: vi.fn().mockImplementation(() => mockDb),
}));

vi.mock('@/lib/email/email-service', () => ({
  emailService: mockEmailService,
}));

describe('Reservations API - Simple Tests', () => {
  let POST: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Clear module cache to reset rate limiting
    vi.resetModules();
    
    // Setup default mock responses
    mockDb.getMagazineById.mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Magazine',
      issueNumber: '2024-01',
      availableCopies: 10,
    });
    
    mockDb.getUserByEmail.mockResolvedValue(null);
    
    mockDb.createUser.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    });
    
    mockDb.createReservation.mockResolvedValue({
      id: 'res-123',
      status: 'pending',
      expiresAt: '2024-12-31T00:00:00Z',
    });
    
    mockDb.recordConsent.mockResolvedValue(undefined);
    mockDb.logDataProcessing.mockResolvedValue(undefined);
    
    // Import the API function
    const apiModule = await import('@/pages/api/reservations');
    POST = apiModule.POST;
  });

  it('creates a reservation successfully', async () => {
    const validData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      magazineId: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 1,
      deliveryMethod: 'pickup',
      pickupLocation: 'Berlin Mitte',
      consents: {
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
      },
    };

    const request = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validData),
    });

    const response = await POST({ request } as any);
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('res-123');
  });

  it('validates required fields', async () => {
    const invalidData = {
      firstName: '', // Empty required field
      lastName: 'Doe',
      email: 'john@example.com',
      magazineId: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 1,
      deliveryMethod: 'pickup',
      pickupLocation: 'Berlin Mitte',
      consents: { essential: true },
    };

    const request = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData),
    });

    const response = await POST({ request } as any);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
  });

  it('checks magazine availability', async () => {
    const validData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      magazineId: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 20, // More than available
      deliveryMethod: 'pickup',
      pickupLocation: 'Berlin Mitte',
      consents: { essential: true, functional: false, analytics: false, marketing: false },
    };

    const request = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validData),
    });

    const response = await POST({ request } as any);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
  });

  it('handles non-existent magazine', async () => {
    mockDb.getMagazineById.mockResolvedValue(null);

    const validData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      magazineId: '987fcdeb-51a2-43d4-b678-123456789abc',
      quantity: 1,
      deliveryMethod: 'pickup',
      pickupLocation: 'Berlin Mitte',
      consents: { essential: true, functional: false, analytics: false, marketing: false },
    };

    const request = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validData),
    });

    const response = await POST({ request } as any);
    const result = await response.json();

    expect(response.status).toBe(404);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Magazine not found');
  });

  it('validates content type', async () => {
    const request = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'invalid',
    });

    const response = await POST({ request } as any);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid content type');
  });

  it('sends confirmation email', async () => {
    const validData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      magazineId: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 1,
      deliveryMethod: 'pickup',
      pickupLocation: 'Berlin Mitte',
      consents: { essential: true, functional: false, analytics: false, marketing: false },
    };

    const request = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validData),
    });

    const response = await POST({ request } as any);
    
    // Wait a moment for the async email call
    await new Promise(resolve => setTimeout(resolve, 10));

    // Email should be sent
    expect(mockEmailService.sendReservationConfirmation).toHaveBeenCalledTimes(1);
  });

  it('validates shipping address when delivery method is shipping', async () => {
    const invalidData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      magazineId: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 1,
      deliveryMethod: 'shipping',
      // Missing address
      consents: { essential: true, functional: false, analytics: false, marketing: false },
    };

    const request = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData),
    });

    const response = await POST({ request } as any);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    if (result.errors) {
      expect(result.errors.some((e: any) => e.field?.includes('address'))).toBe(true);
    } else {
      expect(result.error).toContain('address');
    }
  });

  it('includes security headers in response', async () => {
    const validData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      magazineId: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 1,
      deliveryMethod: 'pickup',
      pickupLocation: 'Berlin Mitte',
      consents: { essential: true, functional: false, analytics: false, marketing: false },
    };

    const request = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validData),
    });

    const response = await POST({ request } as any);

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });
});