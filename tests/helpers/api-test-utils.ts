import { vi } from 'vitest';

/**
 * API Testing Utilities for the Reservation System
 */

// Mock request/response types
export interface MockRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
}

export interface MockResponse {
  status: number;
  data?: any;
  error?: any;
  headers?: Record<string, string>;
}

/**
 * Mock API Response Builder
 */
export class MockApiBuilder {
  private responses: Map<string, MockResponse> = new Map();

  /**
   * Add a mock response for a specific endpoint
   */
  mockEndpoint(method: string, path: string, response: MockResponse) {
    const key = `${method.toUpperCase()}:${path}`;
    this.responses.set(key, response);
    return this;
  }

  /**
   * Mock successful response
   */
  success(method: string, path: string, data: any, status = 200) {
    return this.mockEndpoint(method, path, { status, data });
  }

  /**
   * Mock error response
   */
  error(method: string, path: string, error: any, status = 400) {
    return this.mockEndpoint(method, path, { status, error });
  }

  /**
   * Mock network error
   */
  networkError(method: string, path: string) {
    const key = `${method.toUpperCase()}:${path}`;
    this.responses.set(key, { status: 0, error: new Error('Network Error') });
    return this;
  }

  /**
   * Apply all mocked responses to global fetch
   */
  apply() {
    (global.fetch as any) = vi.fn().mockImplementation(async (url: string, options: any = {}) => {
      const method = options.method || 'GET';
      const key = `${method.toUpperCase()}:${url}`;
      
      const mockResponse = this.responses.get(key);
      
      if (!mockResponse) {
        throw new Error(`No mock response defined for ${key}`);
      }

      if (mockResponse.status === 0) {
        throw mockResponse.error;
      }

      const response = {
        ok: mockResponse.status >= 200 && mockResponse.status < 300,
        status: mockResponse.status,
        statusText: mockResponse.status === 200 ? 'OK' : 'Error',
        headers: new Headers(mockResponse.headers || {}),
        json: async () => {
          if (mockResponse.data) {
            return { data: mockResponse.data, error: null };
          } else {
            return { data: null, error: mockResponse.error };
          }
        },
        text: async () => JSON.stringify(mockResponse.data || mockResponse.error)
      };

      return response;
    });
  }

  /**
   * Clear all mocked responses
   */
  clear() {
    this.responses.clear();
    vi.clearAllMocks();
  }
}

/**
 * Common API mocks for the reservation system
 */
export const commonApiMocks = {
  /**
   * Mock magazines API responses
   */
  magazines: {
    success: (magazines: any[]) => new MockApiBuilder()
      .success('GET', '/api/magazines', magazines),
    
    empty: () => new MockApiBuilder()
      .success('GET', '/api/magazines', []),
    
    error: () => new MockApiBuilder()
      .error('GET', '/api/magazines', { message: 'Failed to fetch magazines' }, 500)
  },

  /**
   * Mock reservations API responses
   */
  reservations: {
    createSuccess: (reservation: any) => new MockApiBuilder()
      .success('POST', '/api/reservations', reservation, 201),
    
    createValidationError: () => new MockApiBuilder()
      .error('POST', '/api/reservations', { 
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Invalid email address' }
        ]
      }, 400),
    
    createServerError: () => new MockApiBuilder()
      .error('POST', '/api/reservations', { message: 'Internal server error' }, 500),
    
    getUserReservations: (reservations: any[]) => new MockApiBuilder()
      .success('GET', '/api/reservations', reservations)
  },

  /**
   * Mock GDPR API responses
   */
  gdpr: {
    consentSuccess: () => new MockApiBuilder()
      .success('POST', '/api/gdpr/consent', { message: 'Consent recorded' }),
    
    exportSuccess: (userData: any) => new MockApiBuilder()
      .success('GET', '/api/gdpr/export-data', userData),
    
    deleteSuccess: () => new MockApiBuilder()
      .success('DELETE', '/api/gdpr/delete-data', { message: 'Data deleted successfully' })
  }
};

/**
 * Test request/response validation helpers
 */
export const requestValidators = {
  /**
   * Validate reservation creation request
   */
  validateReservationRequest(requestBody: any) {
    expect(requestBody).toHaveProperty('firstName');
    expect(requestBody).toHaveProperty('lastName');
    expect(requestBody).toHaveProperty('email');
    expect(requestBody).toHaveProperty('magazineId');
    expect(requestBody).toHaveProperty('quantity');
    expect(requestBody).toHaveProperty('deliveryMethod');
    expect(requestBody).toHaveProperty('consents');
    
    // Validate required fields are not empty
    expect(requestBody.firstName).toBeTruthy();
    expect(requestBody.lastName).toBeTruthy();
    expect(requestBody.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(requestBody.magazineId).toBeTruthy();
    expect(requestBody.quantity).toBeGreaterThan(0);
    expect(['pickup', 'shipping']).toContain(requestBody.deliveryMethod);
    expect(requestBody.consents.essential).toBe(true);
  },

  /**
   * Validate GDPR consent request
   */
  validateConsentRequest(requestBody: any) {
    expect(requestBody).toHaveProperty('consents');
    expect(requestBody.consents).toHaveProperty('essential');
    expect(requestBody.consents).toHaveProperty('functional');
    expect(requestBody.consents).toHaveProperty('analytics');
    expect(requestBody.consents).toHaveProperty('marketing');
    
    // Essential consent is always required
    expect(requestBody.consents.essential).toBe(true);
  }
};

/**
 * Test response validation helpers
 */
export const responseValidators = {
  /**
   * Validate successful API response structure
   */
  validateSuccessResponse(response: any) {
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('error');
    expect(response.error).toBeNull();
  },

  /**
   * Validate error API response structure
   */
  validateErrorResponse(response: any) {
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('error');
    expect(response.data).toBeNull();
    expect(response.error).toBeTruthy();
    expect(response.error).toHaveProperty('message');
  },

  /**
   * Validate magazine response
   */
  validateMagazineResponse(magazine: any) {
    expect(magazine).toHaveProperty('id');
    expect(magazine).toHaveProperty('title');
    expect(magazine).toHaveProperty('issueNumber');
    expect(magazine).toHaveProperty('publishDate');
    expect(magazine).toHaveProperty('availableCopies');
    expect(magazine.availableCopies).toBeGreaterThanOrEqual(0);
  },

  /**
   * Validate reservation response
   */
  validateReservationResponse(reservation: any) {
    expect(reservation).toHaveProperty('id');
    expect(reservation).toHaveProperty('userId');
    expect(reservation).toHaveProperty('magazineId');
    expect(reservation).toHaveProperty('quantity');
    expect(reservation).toHaveProperty('status');
    expect(reservation).toHaveProperty('createdAt');
    expect(['pending', 'confirmed', 'cancelled', 'expired']).toContain(reservation.status);
  }
};

/**
 * API call tracking utilities
 */
export class ApiCallTracker {
  private calls: MockRequest[] = [];

  constructor() {
    this.setupTracking();
  }

  private setupTracking() {
    const originalFetch = global.fetch;
    
    (global.fetch as any) = vi.fn().mockImplementation(async (url: string, options: any = {}) => {
      // Track the call
      this.calls.push({
        method: options.method || 'GET',
        url,
        headers: options.headers || {},
        body: options.body ? JSON.parse(options.body) : undefined
      });

      // Call original or mocked fetch
      return originalFetch ? originalFetch(url, options) : Promise.reject(new Error('No fetch mock'));
    });
  }

  /**
   * Get all tracked API calls
   */
  getCalls(): MockRequest[] {
    return [...this.calls];
  }

  /**
   * Get calls to a specific endpoint
   */
  getCallsTo(method: string, path: string): MockRequest[] {
    return this.calls.filter(call => 
      call.method.toUpperCase() === method.toUpperCase() && 
      call.url.includes(path)
    );
  }

  /**
   * Check if an API call was made
   */
  wasCallMade(method: string, path: string): boolean {
    return this.getCallsTo(method, path).length > 0;
  }

  /**
   * Get the last call to an endpoint
   */
  getLastCallTo(method: string, path: string): MockRequest | null {
    const calls = this.getCallsTo(method, path);
    return calls.length > 0 ? calls[calls.length - 1] : null;
  }

  /**
   * Clear all tracked calls
   */
  clear() {
    this.calls = [];
  }

  /**
   * Expect a specific API call was made
   */
  expectCallMade(method: string, path: string, expectedBody?: any) {
    const calls = this.getCallsTo(method, path);
    expect(calls.length).toBeGreaterThan(0);

    if (expectedBody) {
      const lastCall = calls[calls.length - 1];
      expect(lastCall.body).toEqual(expectedBody);
    }
  }

  /**
   * Expect a specific number of calls to an endpoint
   */
  expectCallCount(method: string, path: string, count: number) {
    const calls = this.getCallsTo(method, path);
    expect(calls).toHaveLength(count);
  }
}

/**
 * Test utilities for API testing
 */
export const apiTestUtils = {
  /**
   * Create a new mock API builder
   */
  createMockApi(): MockApiBuilder {
    return new MockApiBuilder();
  },

  /**
   * Create a new API call tracker
   */
  createCallTracker(): ApiCallTracker {
    return new ApiCallTracker();
  },

  /**
   * Setup common test scenario
   */
  setupTestScenario(scenario: 'success' | 'error' | 'loading') {
    const mockApi = new MockApiBuilder();

    switch (scenario) {
      case 'success':
        return mockApi
          .success('GET', '/api/magazines', [
            { id: '1', title: 'Test Magazine', availableCopies: 10 }
          ])
          .success('POST', '/api/reservations', { id: 'res-123' });

      case 'error':
        return mockApi
          .error('GET', '/api/magazines', { message: 'Server error' }, 500)
          .error('POST', '/api/reservations', { message: 'Validation failed' }, 400);

      case 'loading':
        // Simulate slow responses for loading state testing
        return mockApi
          .mockEndpoint('GET', '/api/magazines', { status: 200, data: [] })
          .mockEndpoint('POST', '/api/reservations', { status: 201, data: { id: 'res-123' } });

      default:
        return mockApi;
    }
  }
};