import { test, expect } from '@playwright/test';

test.describe('Database Error Handling', () => {
  test('should test database error response format', async ({ request }) => {
    // Create a scenario that would cause a database error
    // by using an extremely long email that would exceed database limits
    const oversizedData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'a'.repeat(300) + '@example.com', // Very long email to trigger DB error
      magazineId: 'test-id-that-may-not-exist',
      quantity: 1,
      deliveryMethod: 'pickup',
      pickupLocation: 'Test Location',
      consents: {
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
      },
    };

    const response = await request.post('/api/reservations', {
      data: oversizedData,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Database test response status:', response.status());
    const data = await response.json();
    console.log('Database test response:', JSON.stringify(data, null, 2));
    
    // Regardless of status code, check that we don't leak technical info
    expect(data.success).toBe(false);
    
    // Should not contain technical database terms
    const responseText = JSON.stringify(data).toLowerCase();
    
    // Check for technical database error leakage
    expect(responseText).not.toMatch(/failed to create|failed to get|failed to/);
    expect(responseText).not.toMatch(/database error|sql error|constraint|foreign key/);
    expect(responseText).not.toMatch(/supabase|postgres|table|column/);
    expect(responseText).not.toMatch(/error code|error:/);
    
    // Should be a customer-friendly message
    if (data.message) {
      expect(data.message).toMatch(/german text|fehler|ungültig|versuchen|später|erneut/i);
    }
  });

  test('should check for leaked error details in validation', async ({ request }) => {
    // Test with data that should trigger specific validation errors
    const invalidData = {
      firstName: 'A', // Too short
      lastName: 'B', // Too short  
      email: 'invalid-email-format',
      magazineId: '', // Empty
      quantity: 10, // Too many
      deliveryMethod: 'invalid-method',
      consents: {
        essential: false, // Should be true
        functional: false,
        analytics: false,
        marketing: false,
      },
    };

    const response = await request.post('/api/reservations', {
      data: invalidData,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Validation test response:', JSON.stringify(data, null, 2));
    
    // Check that validation errors are user-friendly
    if (data.errors && Array.isArray(data.errors)) {
      data.errors.forEach(error => {
        console.log(`Field: ${error.field}, Message: ${error.message}`);
        
        // Should be German, user-friendly messages
        expect(error.message).not.toMatch(/string|number|boolean|array|object/i);
        expect(error.message).not.toMatch(/validation|schema|zod|parse/i);
        expect(error.message).not.toMatch(/expected|received|type/i);
      });
    }
  });
});