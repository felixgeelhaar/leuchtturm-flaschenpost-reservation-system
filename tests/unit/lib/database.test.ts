import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseService } from '@/lib/database';
// Using inline test data instead of mock fixtures
// const mockUser = {
//   id: 'user-123',
//   email: 'test@example.com',
//   firstName: 'Test',
//   lastName: 'User',
//   phone: '+49123456789',
//   consentVersion: '1.0',
//   consentTimestamp: '2024-01-01T00:00:00Z',
//   lastActivity: '2024-01-01T00:00:00Z',
//   createdAt: '2024-01-01T00:00:00Z',
//   updatedAt: '2024-01-01T00:00:00Z',
// };

// const mockMagazines = [{
//   id: '123e4567-e89b-12d3-a456-426614174000',
//   title: 'Test Magazine',
//   issueNumber: '2024-01',
//   publishDate: '2024-01-01T00:00:00Z',
//   description: 'Test Magazine',
//   coverImageUrl: 'https://example.com/cover.jpg',
//   availableCopies: 10,
//   totalCopies: 100,
//   isActive: true,
//   createdAt: '2024-01-01T00:00:00Z',
//   updatedAt: '2024-01-01T00:00:00Z',
// }];

const validFormDataPickup = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  magazineId: '123e4567-e89b-12d3-a456-426614174000',
  quantity: 1,
  deliveryMethod: 'pickup' as const,
  pickupLocation: 'Berlin Mitte',
  consents: {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
  },
};

const validFormDataShipping = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  magazineId: '123e4567-e89b-12d3-a456-426614174000',
  quantity: 2,
  deliveryMethod: 'shipping' as const,
  pickupLocation: '',
  address: {
    street: 'Test Street',
    houseNumber: '123',
    postalCode: '10115',
    city: 'Berlin',
    country: 'DE',
  },
  consents: {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
  },
};

// Mock Supabase client with proper chaining support
const createMockChain = (): any => {
  const mockPromise = Promise.resolve({ data: {}, error: null });

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

const mockSupabaseClient = {
  from: vi.fn(() => createMockChain()),
};

vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: () => mockSupabaseClient,
}));

describe('DatabaseService', () => {
  let db: DatabaseService;
  let mockFromChain: any;

  beforeEach(() => {
    vi.clearAllMocks();
    db = new DatabaseService();

    // Setup mock chain - use the same structure as createMockChain
    mockFromChain = createMockChain();
    mockSupabaseClient.from.mockReturnValue(mockFromChain);
  });

  describe('User Operations', () => {
    it('creates a new user with address', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '+49123456789',
        address: {
          street: 'Test Street',
          houseNumber: '123',
          postalCode: '10115',
          city: 'Berlin',
          country: 'DE',
          addressLine2: 'Apt 5',
        },
        consentVersion: '1.0',
      };

      const expectedDbData = {
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        // phone and address fields are not stored in users table
        consent_version: userData.consentVersion,
        data_retention_until: expect.any(String),
      };

      mockFromChain.single.mockResolvedValue({
        data: {
          id: 'user-123',
          ...expectedDbData,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      await db.createUser(userData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockFromChain.insert).toHaveBeenCalledWith(expectedDbData);
    });

    it('creates a new user without address', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        consentVersion: '1.0',
      };

      mockFromChain.single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          consent_version: userData.consentVersion,
          data_retention_until: expect.any(String),
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      await db.createUser(userData);

      expect(mockFromChain.insert).toHaveBeenCalledWith({
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        // phone and address fields don't exist in users table
        consent_version: userData.consentVersion,
        data_retention_until: expect.any(String),
      });
    });

    it('handles user creation errors', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        consentVersion: '1.0',
      };

      mockFromChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' },
      });

      await expect(db.createUser(userData)).rejects.toThrow(
        'Failed to create user: Email already exists',
      );
    });

    it('gets user by email', async () => {
      const email = 'test@example.com';

      mockFromChain.single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: email,
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const user = await db.getUserByEmail(email);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockFromChain.eq).toHaveBeenCalledWith('email', email);
      // No is_active check in actual implementation
      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
    });

    it('returns null for non-existent user', async () => {
      mockFromChain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows returned
      });

      const user = await db.getUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });

    it('updates user activity', async () => {
      const userId = 'user-123';

      await db.updateUserActivity(userId);

      // Implementation is stubbed out - should not call database
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });
  });

  describe('Magazine Operations', () => {
    it('gets active magazines', async () => {
      mockFromChain.order.mockResolvedValue({
        data: [
          {
            id: 'mag-123',
            title: 'Test Magazine',
            issue_number: '2024-01',
            publish_date: '2024-01-01',
            total_copies: 100,
            available_copies: 95,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      const magazines = await db.getActiveMagazines();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('magazines');
      // No is_active check in actual implementation
      expect(mockFromChain.gt).toHaveBeenCalledWith('available_copies', 0);
      expect(mockFromChain.order).toHaveBeenCalledWith('publish_date', {
        ascending: false,
      });
      expect(magazines).toHaveLength(1);
    });

    it('gets magazine by id', async () => {
      const magazineId = 'mag-123';

      mockFromChain.single.mockResolvedValue({
        data: {
          id: magazineId,
          title: 'Test Magazine',
          issue_number: '2024-01',
          is_active: true,
        },
        error: null,
      });

      const magazine = await db.getMagazineById(magazineId);

      expect(mockFromChain.eq).toHaveBeenCalledWith('id', magazineId);
      // No is_active check in actual implementation
      expect(magazine).toBeDefined();
      expect(magazine?.id).toBe(magazineId);
    });

    it('returns null for non-existent magazine', async () => {
      mockFromChain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const magazine = await db.getMagazineById('nonexistent');
      expect(magazine).toBeNull();
    });
  });

  describe('Reservation Operations', () => {
    it('creates reservation with pickup delivery', async () => {
      // Mock user lookup
      mockFromChain.single.mockResolvedValueOnce({
        data: { id: 'user-123' },
        error: null,
      });

      // Mock reservation creation
      mockFromChain.single.mockResolvedValueOnce({
        data: {
          id: 'reservation-123',
          user_id: 'user-123',
          magazine_id: validFormDataPickup.magazineId,
          quantity: validFormDataPickup.quantity,
          delivery_method: 'pickup',
          pickup_location: validFormDataPickup.pickupLocation,
          users: { id: 'user-123', email: 'test@example.com' },
          magazines: { id: 'mag-123', title: 'Test Magazine' },
        },
        error: null,
      });

      // const reservation = await db.createReservation(validFormDataPickup);
      await db.createReservation(validFormDataPickup);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('reservations');

      expect(mockFromChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          magazine_id: validFormDataPickup.magazineId,
          quantity: validFormDataPickup.quantity,
          delivery_method: 'pickup',
          pickup_location: validFormDataPickup.pickupLocation,
          // consent_reference and expires_at columns don't exist
          payment_method: null, // null for pickup
          street: null,
          house_number: null,
          address_line2: null,
          postal_code: null,
          city: null,
          country: null,
          notes: null,
          order_group_picture: false,
          child_group_name: null,
          order_vorschul_picture: false,
          child_is_vorschueler: false,
          child_name: null,
        }),
      );
    });

    it('creates reservation with shipping delivery', async () => {
      // Mock user lookup
      mockFromChain.single.mockResolvedValueOnce({
        data: { id: 'user-123' },
        error: null,
      });

      // Mock reservation creation
      mockFromChain.single.mockResolvedValueOnce({
        data: {
          id: 'reservation-123',
          user_id: 'user-123',
          delivery_method: 'shipping',
        },
        error: null,
      });

      await db.createReservation(validFormDataShipping);

      expect(mockFromChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          magazine_id: validFormDataShipping.magazineId,
          quantity: validFormDataShipping.quantity,
          delivery_method: 'shipping',
          // Address fields use direct names, not shipping_ prefix
          street: validFormDataShipping.address?.street,
          house_number: validFormDataShipping.address?.houseNumber,
          postal_code: validFormDataShipping.address?.postalCode,
          city: validFormDataShipping.address?.city,
          country: validFormDataShipping.address?.country,
          address_line2: validFormDataShipping.address?.addressLine2,
          payment_method: 'paypal', // PayPal for shipping
          pickup_location: null, // null for shipping
          pickup_date: null,
          notes: null,
          order_group_picture: false,
          child_group_name: null,
          order_vorschul_picture: false,
          child_is_vorschueler: false,
          child_name: null,
        }),
      );
    });

    it('handles reservation creation for non-existent user', async () => {
      // Mock user lookup to return null (user not found)
      mockFromChain.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // No rows returned
      });

      // The implementation creates a new user automatically if not found
      // So we need to mock the user creation as well
      mockFromChain.single.mockResolvedValueOnce({
        data: {
          id: 'new-user-123',
          email: validFormDataPickup.email,
          first_name: validFormDataPickup.firstName,
          last_name: validFormDataPickup.lastName,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      // Mock successful reservation creation
      mockFromChain.single.mockResolvedValueOnce({
        data: {
          id: 'reservation-123',
          user_id: 'new-user-123',
          magazine_id: validFormDataPickup.magazineId,
          quantity: validFormDataPickup.quantity,
          delivery_method: 'pickup',
        },
        error: null,
      });

      const reservation = await db.createReservation(validFormDataPickup);

      // Should succeed by creating a new user and then the reservation
      expect(reservation).toBeDefined();
      expect(reservation.userId).toBe('new-user-123');
    });

    it('gets user reservations', async () => {
      const userId = 'user-123';

      mockFromChain.order.mockResolvedValue({
        data: [
          {
            id: 'reservation-123',
            user_id: userId,
            status: 'pending',
            magazines: { title: 'Test Magazine' },
          },
        ],
        error: null,
      });

      const reservations = await db.getUserReservations(userId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('reservations');
      expect(mockFromChain.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockFromChain.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(reservations).toHaveLength(1);
    });

    it('cancels reservation', async () => {
      const reservationId = 'reservation-123';
      const userId = 'user-123';

      // Mock the promise resolution for the entire chain
      Object.assign(mockFromChain, {
        then: vi.fn((onResolve) => onResolve({ data: {}, error: null })),
      });

      await db.cancelReservation(reservationId, userId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('reservations');
      expect(mockFromChain.update).toHaveBeenCalledWith({
        status: 'cancelled',
      });
      expect(mockFromChain.eq).toHaveBeenCalledWith('id', reservationId);
      expect(mockFromChain.eq).toHaveBeenCalledWith('user_id', userId);
    });
  });

  describe('GDPR Consent Operations', () => {
    it('records user consent', async () => {
      const userId = 'user-123';
      const consents = {
        essential: true,
        functional: false,
        analytics: true,
        marketing: false,
      };
      const metadata = {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      mockFromChain.insert.mockResolvedValue({ data: [], error: null });

      await db.recordConsent(userId, consents, metadata);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_consents');
      expect(mockFromChain.insert).toHaveBeenCalledWith([
        {
          user_id: userId,
          consent_type: 'essential',
          consent_given: true,
          consent_version: '1.0',
          // ip_address and user_agent fields don't exist in database
        },
        {
          user_id: userId,
          consent_type: 'functional',
          consent_given: false,
          consent_version: '1.0',
          // ip_address and user_agent fields don't exist in database
        },
        {
          user_id: userId,
          consent_type: 'analytics',
          consent_given: true,
          consent_version: '1.0',
          // ip_address and user_agent fields don't exist in database
        },
        {
          user_id: userId,
          consent_type: 'marketing',
          consent_given: false,
          consent_version: '1.0',
          // ip_address and user_agent fields don't exist in database
        },
      ]);
    });

    it('gets user consents', async () => {
      const userId = 'user-123';

      mockFromChain.order.mockResolvedValue({
        data: [
          {
            id: 'consent-123',
            user_id: userId,
            consent_type: 'essential',
            consent_given: true,
            timestamp: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      const consents = await db.getUserConsents(userId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_consents');
      expect(mockFromChain.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockFromChain.order).toHaveBeenCalledWith('timestamp', {
        ascending: false,
      });
      expect(consents).toHaveLength(1);
    });

    it('withdraws consent', async () => {
      const userId = 'user-123';
      const consentType = 'marketing';

      // Mock the promise resolution for the entire chain
      Object.assign(mockFromChain, {
        then: vi.fn((onResolve) => onResolve({ data: {}, error: null })),
      });

      await db.withdrawConsent(userId, consentType);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_consents');
      expect(mockFromChain.update).toHaveBeenCalledWith({
        consent_given: false,
        // withdrawal_timestamp field doesn't exist in database
      });
      expect(mockFromChain.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockFromChain.eq).toHaveBeenCalledWith(
        'consent_type',
        consentType,
      );
      // is() method not called in actual implementation
    });
  });

  describe('Data Processing Logs', () => {
    it('logs data processing activity', async () => {
      const logData = {
        userId: 'user-123',
        action: 'created' as const,
        dataType: 'user_data' as const,
        legalBasis: 'consent' as const,
        ipAddress: '127.0.0.1',
        details: 'Test log entry',
      };

      mockFromChain.insert.mockResolvedValue({ data: {}, error: null });

      await db.logDataProcessing(logData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        'data_processing_activity',
      );
      expect(mockFromChain.insert).toHaveBeenCalledWith({
        user_id: logData.userId,
        action: logData.action,
        data_type: logData.dataType,
        legal_basis: logData.legalBasis,
        ip_address: logData.ipAddress,
        details: logData.details,
        processor_id: null,
      });
    });

    it('handles optional fields in logging', async () => {
      const logData = {
        action: 'accessed' as const,
        dataType: 'reservation' as const,
        legalBasis: 'legitimate_interest' as const,
      };

      await db.logDataProcessing(logData);

      expect(mockFromChain.insert).toHaveBeenCalledWith({
        user_id: null,
        action: logData.action,
        data_type: logData.dataType,
        legal_basis: logData.legalBasis,
        ip_address: null,
        details: null,
        processor_id: null,
      });
    });
  });

  describe('Error Handling', () => {
    it('handles database connection errors', async () => {
      mockFromChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });

      await expect(db.getUserByEmail('test@example.com')).rejects.toThrow(
        'Failed to get user: Connection failed',
      );
    });

    it('handles insert errors', async () => {
      mockFromChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      await expect(
        db.createUser({
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          consentVersion: '1.0',
        }),
      ).rejects.toThrow('Failed to create user: Insert failed');
    });
  });
});
