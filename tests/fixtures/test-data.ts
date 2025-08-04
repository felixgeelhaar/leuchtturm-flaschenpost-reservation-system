import type { Magazine, User, ReservationFormData } from '@/types';

export const mockMagazines: Magazine[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Flaschenpost',
    issueNumber: '2024-01',
    publishDate: '2024-02-01',
    description: 'Test magazine description',
    totalCopies: 100,
    availableCopies: 95,
    coverImageUrl: '/test-cover.jpg',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    title: 'Flaschenpost',
    issueNumber: '2024-02',
    publishDate: '2024-03-01',
    description: 'Another test magazine',
    totalCopies: 100,
    availableCopies: 100,
    coverImageUrl: '/test-cover-2.jpg',
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
];

export const mockUser: User = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '+49123456789',
  street: 'Test Street',
  houseNumber: '123',
  addressLine2: '',
  postalCode: '10115',
  city: 'Berlin',
  country: 'DE',
  consentVersion: '1.0',
  lastActivity: '2024-01-01T00:00:00Z',
  retentionDate: '2025-01-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const validFormDataPickup: ReservationFormData = {
  firstName: 'Max',
  lastName: 'Mustermann',
  email: 'max@example.com',
  phone: '+49123456789',
  magazineId: '123e4567-e89b-12d3-a456-426614174000',
  quantity: 1,
  deliveryMethod: 'pickup',
  pickupLocation: 'Berlin Mitte',
  pickupDate: (() => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
    return futureDate.toISOString().split('T')[0];
  })(),
  notes: 'Test notes',
  consents: {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
  },
};

export const validFormDataShipping: ReservationFormData = {
  firstName: 'Anna',
  lastName: 'Schmidt',
  email: 'anna@example.com',
  phone: '+49987654321',
  magazineId: '123e4567-e89b-12d3-a456-426614174000',
  quantity: 2,
  deliveryMethod: 'shipping',
  pickupLocation: '',
  address: {
    street: 'Musterstraße',
    houseNumber: '123',
    postalCode: '10115',
    city: 'Berlin',
    country: 'DE',
    addressLine2: 'Apartment 5',
  },
  notes: 'Please ring the doorbell',
  consents: {
    essential: true,
    functional: true,
    analytics: false,
    marketing: true,
  },
};

export const invalidFormData: Partial<ReservationFormData> = {
  firstName: 'A', // Too short
  lastName: '', // Empty
  email: 'invalid-email', // Invalid format
  phone: '123', // Invalid format
  magazineId: '',
  quantity: 0, // Below minimum
  deliveryMethod: 'pickup',
  pickupLocation: '', // Required for pickup
  consents: {
    essential: false, // Must be true
    functional: false,
    analytics: false,
    marketing: false,
  },
};

export const mockApiResponse = {
  success: true,
  data: {
    id: '123e4567-e89b-12d3-a456-426614174003',
    status: 'pending',
    expiresAt: '2024-12-22T00:00:00Z',
    magazine: {
      title: 'Flaschenpost',
      issueNumber: '2024-01',
    },
  },
  message: 'Reservierung erfolgreich erstellt!',
};

// Aliases for backward compatibility
export const testMagazines = mockMagazines;
export const validFormData = validFormDataPickup;