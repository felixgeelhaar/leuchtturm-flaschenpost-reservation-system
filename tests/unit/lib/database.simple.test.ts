import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseService } from '@/lib/database';
import type { Magazine, ReservationFormData } from '@/types';

// Mock Supabase client with comprehensive method coverage
const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  insert: vi.fn(() => mockSupabaseClient),
  update: vi.fn(() => mockSupabaseClient),
  delete: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  gt: vi.fn(() => mockSupabaseClient),
  gte: vi.fn(() => mockSupabaseClient),
  lt: vi.fn(() => mockSupabaseClient),
  lte: vi.fn(() => mockSupabaseClient),
  is: vi.fn(() => mockSupabaseClient),
  single: vi.fn(),
  order: vi.fn(() => mockSupabaseClient),
  limit: vi.fn(() => mockSupabaseClient),
};

vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: vi.fn(() => mockSupabaseClient),
}));

describe('DatabaseService - Simple Tests', () => {
  let db: DatabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful responses
    mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });
    mockSupabaseClient.order.mockResolvedValue({ data: [], error: null });
    
    db = new DatabaseService();
  });

  describe('Magazine Operations', () => {
    it('should get active magazines', async () => {
      const mockMagazines = [
        { 
          id: '1', 
          title: 'Magazine 1', 
          issue_number: '2024-01',
          description: 'Test mag',
          cover_image_url: 'test.jpg',
          available_copies: 50,
          total_copies: 100,
          release_date: new Date().toISOString(),
          reservation_start_date: new Date().toISOString(),
          reservation_end_date: new Date().toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      mockSupabaseClient.order.mockResolvedValueOnce({ data: mockMagazines, error: null });

      const magazines = await db.getActiveMagazines();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('magazines');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockSupabaseClient.gt).toHaveBeenCalledWith('available_copies', 0);
      expect(magazines).toHaveLength(1);
    });

    it('should get magazine by ID', async () => {
      const mockMagazine = { 
        id: '123e4567-e89b-12d3-a456-426614174000', 
        title: 'Test Magazine',
        issue_number: '2024-01',
        description: 'Test mag',
        cover_image_url: 'test.jpg',
        available_copies: 50,
        total_copies: 100,
        release_date: new Date().toISOString(),
        reservation_start_date: new Date().toISOString(),
        reservation_end_date: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockMagazine, error: null });

      const magazine = await db.getMagazineById('123e4567-e89b-12d3-a456-426614174000');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('magazines');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
      expect(magazine).toBeTruthy();
      expect(magazine?.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should handle magazine not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      });

      const magazine = await db.getMagazineById('non-existent');

      expect(magazine).toBeNull();
    });

    it('should handle magazine database error', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'OTHER', message: 'Database error' } 
      });

      await expect(db.getMagazineById('test')).rejects.toThrow('Failed to get magazine: Database error');
    });
  });

  describe('User Operations', () => {
    it('should get user by email', async () => {
      const mockUser = { 
        id: 'user-123', 
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        phone: '+49123456789',
        consent_version: '1.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockUser, error: null });

      const user = await db.getUserByEmail('test@example.com');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(user).toBeTruthy();
      expect(user?.email).toBe('test@example.com');
    });

    it('should create a new user', async () => {
      const userData = {
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        consentVersion: '1.0',
      };

      const mockCreatedUser = { 
        id: 'user-456', 
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
        consent_version: '1.0',
        phone: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockCreatedUser, error: null });

      const user = await db.createUser(userData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
      expect(user).toBeTruthy();
      expect(user?.email).toBe('new@example.com');
    });

    it('should update user activity', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: {}, error: null });

      await expect(db.updateUserActivity('user-123')).resolves.not.toThrow();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseClient.update).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'user-123');
    });
  });

  describe('Reservation Operations', () => {
    it('should create a reservation', async () => {
      const formData: ReservationFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        magazineId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2,
        deliveryMethod: 'pickup',
        pickupLocation: 'Berlin Mitte',
        consents: {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
        },
      };

      // Mock getUserByEmail call (first single() call in createReservation)
      const mockUser = { id: 'user-123', email: 'john@example.com' };
      const mockReservation = { 
        id: 'res-123', 
        user_id: 'user-123',
        magazine_id: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2,
        status: 'pending',
        delivery_method: 'pickup',
        pickup_location: 'Berlin Mitte',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock the sequential calls: getUserByEmail -> insert.select.single -> logDataProcessing
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockUser, error: null })
        .mockResolvedValueOnce({ data: mockReservation, error: null });
      
      // Mock the insert.select call for reservation creation
      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      
      // Mock the insert call for logDataProcessing
      mockSupabaseClient.insert
        .mockResolvedValueOnce({ data: { id: 'log-123' }, error: null });

      const reservation = await db.createReservation(formData);

      expect(reservation).toBeTruthy();
      expect(reservation.id).toBe('res-123');
    });

    it('should handle reservation creation error', async () => {
      const formData: ReservationFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'nonexistent@example.com',
        magazineId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2,
        deliveryMethod: 'pickup',
        pickupLocation: 'Berlin Mitte',
        consents: {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
        },
      };

      // Mock getUserByEmail to return null (user not found)
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });

      try {
        await db.createReservation(formData);
        expect.fail('Expected createReservation to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('User not found');
      }
    });
  });

  describe('Consent Operations', () => {
    it('should record consent', async () => {
      const userId = 'user-123';
      const consents = {
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
      };
      const metadata = {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      // Mock the insert call (no return value expected)
      mockSupabaseClient.insert.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));

      await expect(db.recordConsent(userId, consents, metadata)).resolves.not.toThrow();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_consents');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should get user consents', async () => {
      const mockConsents = [
        {
          id: 'consent-123',
          user_id: 'user-123',
          consent_type: 'essential',
          granted: true,
          version: '1.0',
          created_at: new Date().toISOString()
        }
      ];

      mockSupabaseClient.order.mockResolvedValueOnce({ data: mockConsents, error: null });

      const consents = await db.getUserConsents('user-123');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_consents');
      expect(consents).toHaveLength(1);
      expect(consents[0].consentType).toBe('essential');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockSupabaseClient.order.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Connection failed' } 
      });

      await expect(db.getActiveMagazines()).rejects.toThrow('Failed to get magazines: Connection failed');
    });
  });
});