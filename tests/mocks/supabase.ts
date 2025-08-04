import { vi } from 'vitest';
import type { 
  SupabaseClient, 
  PostgrestFilterBuilder, 
  PostgrestQueryBuilder, 
  PostgrestBuilder 
} from '@supabase/supabase-js';

// Mock data for testing
export const mockMagazines = [
  {
    id: 'mag-1',
    title: 'Flaschenpost Ausgabe 1',
    issue_number: '2024-01',
    publish_date: '2024-01-15',
    description: 'Die erste Ausgabe des Jahres 2024',
    total_copies: 100,
    available_copies: 85,
    cover_image_url: 'https://example.com/cover1.jpg',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'mag-2',
    title: 'Flaschenpost Ausgabe 2',
    issue_number: '2024-02',
    publish_date: '2024-02-15',
    description: 'Die zweite Ausgabe des Jahres 2024',
    total_copies: 120,
    available_copies: 95,
    cover_image_url: 'https://example.com/cover2.jpg',
    is_active: true,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z'
  }
];

export const mockUsers = [
  {
    id: 'user-1',
    email: 'test@example.com',
    first_name: 'Max',
    last_name: 'Mustermann',
    phone: '+49123456789',
    street: 'Musterstraße',
    house_number: '123',
    address_line2: '',
    postal_code: '12345',
    city: 'Berlin',
    country: 'DE',
    consent_version: '1.0',
    consent_timestamp: '2024-01-01T00:00:00Z',
    data_retention_until: '2025-01-01T00:00:00Z',
    last_activity: '2024-01-01T00:00:00Z',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockReservations = [
  {
    id: 'res-1',
    user_id: 'user-1',
    magazine_id: 'mag-1',
    quantity: 2,
    status: 'pending',
    delivery_method: 'pickup',
    pickup_location: 'Berlin Mitte',
    pickup_date: '2024-02-01',
    shipping_street: null,
    shipping_house_number: null,
    shipping_address_line2: null,
    shipping_postal_code: null,
    shipping_city: null,
    shipping_country: null,
    notes: 'Test reservation',
    consent_reference: 'consent-user-1-123456789',
    reservation_date: '2024-01-15',
    expires_at: '2024-01-22T00:00:00Z',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    users: mockUsers[0],
    magazines: mockMagazines[0]
  }
];

export const mockConsents = [
  {
    id: 'consent-1',
    user_id: 'user-1',
    consent_type: 'essential',
    consent_given: true,
    consent_version: '1.0',
    timestamp: '2024-01-01T00:00:00Z',
    ip_address: '127.0.0.1',
    user_agent: 'Test Browser',
    withdrawal_timestamp: null
  },
  {
    id: 'consent-2',
    user_id: 'user-1',
    consent_type: 'functional',
    consent_given: false,
    consent_version: '1.0',
    timestamp: '2024-01-01T00:00:00Z',
    ip_address: '127.0.0.1',
    user_agent: 'Test Browser',
    withdrawal_timestamp: null
  }
];

// Create a mock Supabase query builder
function createMockQueryBuilder(tableName: string, mockData: any[]) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockData[0] || null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: mockData[0] || null, error: null }),
    csv: vi.fn().mockResolvedValue({ data: '', error: null }),
    explain: vi.fn().mockResolvedValue({ data: '', error: null }),
    then: vi.fn().mockResolvedValue({ data: mockData, error: null }),
  };

  // Add async methods that return promises
  builder.single.mockImplementation(() => 
    Promise.resolve({ data: mockData[0] || null, error: null })
  );
  
  builder.maybeSingle.mockImplementation(() => 
    Promise.resolve({ data: mockData[0] || null, error: null })
  );

  // The builder itself is a promise that resolves to the data
  Object.defineProperty(builder, 'then', {
    value: vi.fn().mockImplementation((resolve) => {
      return Promise.resolve(resolve({ data: mockData, error: null }));
    })
  });

  return builder;
}

// Create the main Supabase client mock
export function createSupabaseMock(): Partial<SupabaseClient> {
  const supabaseMock = {
    from: vi.fn().mockImplementation((tableName: string) => {
      let mockData: any[] = [];
      
      switch (tableName) {
        case 'magazines':
          mockData = mockMagazines;
          break;
        case 'users':
          mockData = mockUsers;
          break;
        case 'reservations':
          mockData = mockReservations;
          break;
        case 'user_consents':
          mockData = mockConsents;
          break;
        case 'data_processing_logs':
          mockData = [];
          break;
        default:
          mockData = [];
      }
      
      return createMockQueryBuilder(tableName, mockData);
    }),
    
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null
      }),
      signIn: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })
    },
    
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null
        }),
        download: vi.fn().mockResolvedValue({
          data: new Blob(),
          error: null
        }),
        remove: vi.fn().mockResolvedValue({
          data: [],
          error: null
        }),
        list: vi.fn().mockResolvedValue({
          data: [],
          error: null
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test.jpg' }
        })
      })
    },
    
    rpc: vi.fn().mockResolvedValue({
      data: null,
      error: null
    }),
    
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn().mockReturnThis()
    })
  };

  return supabaseMock as Partial<SupabaseClient>;
}

// Utility functions for tests
export const supabaseTestUtils = {
  // Reset all mock call history
  resetMocks: () => {
    vi.clearAllMocks();
  },
  
  // Configure specific responses for different operations
  mockResponse: (tableName: string, operation: string, response: any) => {
    const mock = createSupabaseMock();
    if (operation === 'select') {
      (mock.from as any)(tableName).then.mockResolvedValue(response);
    }
    return mock;
  },
  
  // Mock error responses
  mockError: (tableName: string, operation: string, error: any) => {
    const mock = createSupabaseMock();
    if (operation === 'select') {
      (mock.from as any)(tableName).then.mockResolvedValue({ data: null, error });
    }
    return mock;
  },
  
  // Mock specific magazine data
  setMockMagazines: (magazines: any[]) => {
    mockMagazines.splice(0, mockMagazines.length, ...magazines);
  },
  
  // Mock specific user data
  setMockUsers: (users: any[]) => {
    mockUsers.splice(0, mockUsers.length, ...users);
  },
  
  // Mock specific reservation data
  setMockReservations: (reservations: any[]) => {
    mockReservations.splice(0, mockReservations.length, ...reservations);
  }
};

export default createSupabaseMock;