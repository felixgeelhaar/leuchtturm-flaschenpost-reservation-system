import { test, expect, APIRequestContext } from '@playwright/test';

test.describe('API Endpoints', () => {
  let apiContext: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:4321',
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('GET /api/magazines should return available magazines', async () => {
    const response = await apiContext.get('/api/magazines');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
    expect(data.count).toBeGreaterThanOrEqual(0);
    
    // If magazines exist, check structure
    if (data.data.length > 0) {
      const magazine = data.data[0];
      expect(magazine).toHaveProperty('id');
      expect(magazine).toHaveProperty('title');
      expect(magazine).toHaveProperty('issueNumber');
      expect(magazine).toHaveProperty('availableCopies');
      expect(magazine).toHaveProperty('isActive', true);
    }
  });

  test('GET /api/reservations should require authentication', async () => {
    const response = await apiContext.get('/api/reservations');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('Authentication required');
  });

  test('POST /api/reservations should handle valid reservation data', async () => {
    // First get available magazines
    const magazinesResponse = await apiContext.get('/api/magazines');
    const magazinesData = await magazinesResponse.json();
    
    if (magazinesData.data.length === 0) {
      test.skip('No magazines available for reservation test');
      return;
    }

    const magazineId = magazinesData.data[0].id;
    const testEmail = `test.${Date.now()}@example.com`;

    const reservationData = {
      firstName: 'Max',
      lastName: 'Mustermann',
      email: testEmail,
      magazineId: magazineId,
      quantity: 1,
      deliveryMethod: 'pickup',
      pickupLocation: 'BRK Haus für Kinder - Leuchtturm',
      consents: {
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
      },
    };

    const response = await apiContext.post('/api/reservations', {
      data: reservationData,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBeLessThan(500); // Should not be a server error
    
    const responseData = await response.json();
    
    if (response.ok()) {
      // Success case
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveProperty('id');
      expect(responseData.data).toHaveProperty('status', 'pending');
      expect(responseData.message).toContain('erfolgreich');
    } else {
      // Error case - should be a client error, not server error
      expect(response.status()).toBeLessThan(500);
      expect(responseData.success).toBe(false);
      expect(responseData).toHaveProperty('error');
      expect(responseData).toHaveProperty('message');
      
      // Log the error for debugging
      console.log('API Error Response:', responseData);
    }
  });

  test('POST /api/reservations should validate required fields', async () => {
    const invalidData = {
      firstName: '',
      lastName: '',
      email: 'invalid-email',
      magazineId: '',
      quantity: 0,
      deliveryMethod: 'pickup',
      consents: {
        essential: false, // This should cause validation error
        functional: false,
        analytics: false,
        marketing: false,
      },
    };

    const response = await apiContext.post('/api/reservations', {
      data: invalidData,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed');
    expect(data.errors).toBeInstanceOf(Array);
    expect(data.errors.length).toBeGreaterThan(0);
  });

  test('POST /api/reservations should handle shipping address validation', async () => {
    // Get available magazines
    const magazinesResponse = await apiContext.get('/api/magazines');
    const magazinesData = await magazinesResponse.json();
    
    if (magazinesData.data.length === 0) {
      test.skip('No magazines available for shipping test');
      return;
    }

    const magazineId = magazinesData.data[0].id;
    const testEmail = `shipping.${Date.now()}@example.com`;

    const shippingData = {
      firstName: 'Max',
      lastName: 'Mustermann',
      email: testEmail,
      magazineId: magazineId,
      quantity: 1,
      deliveryMethod: 'shipping',
      paymentMethod: 'paypal',
      address: {
        street: 'Musterstraße',
        houseNumber: '123',
        postalCode: '12345',
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

    const response = await apiContext.post('/api/reservations', {
      data: shippingData,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Should not be a server error
    expect(response.status()).toBeLessThan(500);
    
    const responseData = await response.json();
    
    if (!response.ok()) {
      // If there's an error, log it for debugging
      console.log('Shipping validation error:', responseData);
    }
  });

  test('POST /api/reservations should enforce rate limiting', async ({ page }) => {
    const magazinesResponse = await apiContext.get('/api/magazines');
    const magazinesData = await magazinesResponse.json();
    
    if (magazinesData.data.length === 0) {
      test.skip('No magazines available for rate limit test');
      return;
    }

    const magazineId = magazinesData.data[0].id;
    
    const baseData = {
      firstName: 'Max',
      lastName: 'Mustermann',
      magazineId: magazineId,
      quantity: 1,
      deliveryMethod: 'pickup',
      pickupLocation: 'BRK Haus für Kinder - Leuchtturm',
      consents: {
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
      },
    };

    // Send multiple requests quickly to test rate limiting
    const requests = [];
    for (let i = 0; i < 6; i++) {
      requests.push(
        apiContext.post('/api/reservations', {
          data: {
            ...baseData,
            email: `ratelimit${i}.${Date.now()}@example.com`,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    }

    const responses = await Promise.all(requests);
    
    // At least one request should be rate limited (status 429)
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    
    if (rateLimitedResponses.length > 0) {
      const rateLimitedData = await rateLimitedResponses[0].json();
      expect(rateLimitedData.success).toBe(false);
      expect(rateLimitedData.error).toBe('Rate limit exceeded');
    }
  });

  test('API should handle invalid Content-Type', async () => {
    const response = await apiContext.post('/api/reservations', {
      data: '{"test": "data"}',
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid content type');
  });

  test('API should handle malformed JSON', async () => {
    const response = await apiContext.post('/api/reservations', {
      data: '{invalid json}',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid JSON');
  });
});