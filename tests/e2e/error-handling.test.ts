import { test, expect, type APIRequestContext } from '@playwright/test';

test.describe('Error Handling - Customer-Facing Messages', () => {
  let apiContext: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:4321',
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('should return user-friendly error for malformed JSON', async () => {
    const response = await apiContext.post('/api/reservations', {
      data: '{invalid json}',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(400);
    
    const data = await response.json();
    console.log('Malformed JSON response:', data);
    
    // Should be customer-friendly, not technical
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid JSON');
    expect(data.message).toBe('Ungültiger JSON-Body.');
    
    // Should not contain technical details
    expect(data.message).not.toMatch(/parse|syntax|unexpected token/i);
  });

  test('should return user-friendly error for missing required fields', async () => {
    const invalidData = {
      firstName: '',
      lastName: '',
      email: 'invalid-email',
      magazineId: '',
    };

    const response = await apiContext.post('/api/reservations', {
      data: invalidData,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(400);
    
    const data = await response.json();
    console.log('Validation error response:', data);
    
    // Should be customer-friendly validation messages
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed');
    expect(data.message).toBe('Eingabedaten sind ungültig.');
    
    // Check if individual field errors are customer-friendly
    expect(data.errors).toBeDefined();
    expect(Array.isArray(data.errors)).toBe(true);
    
    // Errors should be in German and user-friendly
    const errorMessages = data.errors.map((err: any) => err.message).join(' ');
    console.log('Individual error messages:', errorMessages);
    
    // Should not contain technical terms like "string", "required", "validation"
    expect(errorMessages).not.toMatch(/string|required|validation|schema/i);
  });

  test('should return user-friendly error for invalid magazine ID', async () => {
    const invalidData = {
      firstName: 'Max',
      lastName: 'Mustermann',
      email: 'test@example.com',
      magazineId: 'non-existent-id',
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

    const response = await apiContext.post('/api/reservations', {
      data: invalidData,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Invalid magazine response status:', response.status());
    const data = await response.json();
    console.log('Invalid magazine response:', data);
    
    // Should be customer-friendly error
    expect(data.success).toBe(false);
    
    if (response.status() === 404) {
      expect(data.message).toBe('Die gewählte Magazin-Ausgabe ist nicht verfügbar.');
    } else if (response.status() === 500) {
      // If it's a 500 error, it should still be user-friendly
      expect(data.message).toBe('Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
    }
    
    // Should not contain technical database terms
    expect(data.message).not.toMatch(/database|sql|query|table|record/i);
    expect(JSON.stringify(data)).not.toMatch(/Failed to|Error:|exception/i);
  });

  test('should handle server errors gracefully in frontend', async ({ page }) => {
    await page.goto('/');
    
    // Wait for form to load
    await page.waitForSelector('form');
    await page.waitForTimeout(3000);
    
    // Fill form with potentially problematic data
    await page.selectOption('#magazineId', { index: 1 });
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'User');
    await page.fill('#email', `test.error.${Date.now()}@example.com`);
    await page.selectOption('#deliveryMethod', 'pickup');
    await page.check('#consent-essential');
    
    // Force submit
    await page.click('button[type="submit"]', { force: true });
    await page.waitForTimeout(3000);
    
    // Check if any error messages are displayed
    const errorMessages = await page.locator('[class*="error"], .alert-error').all();
    
    if (errorMessages.length > 0) {
      console.log('Found error messages on page');
      
      for (const errorEl of errorMessages) {
        const errorText = await errorEl.textContent();
        if (errorText && errorText.trim()) {
          console.log('Error message:', errorText);
          
          // Should be customer-friendly German messages
          expect(errorText).not.toMatch(/failed to|error:|exception|stack trace/i);
          expect(errorText).not.toMatch(/database|sql|query/i);
        }
      }
    }
  });

  test('should not expose technical details in console errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errorMessages: string[] = [];
    
    page.on('console', msg => {
      consoleMessages.push(msg.text());
      if (msg.type() === 'error') {
        errorMessages.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForSelector('form');
    await page.waitForTimeout(3000);
    
    // Fill and submit form
    await page.selectOption('#magazineId', { index: 1 });
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'User');
    await page.fill('#email', `test.console.${Date.now()}@example.com`);
    await page.selectOption('#deliveryMethod', 'pickup');
    await page.check('#consent-essential');
    
    await page.click('button[type="submit"]', { force: true });
    await page.waitForTimeout(3000);
    
    console.log('Console messages found:', consoleMessages.length);
    console.log('Error messages found:', errorMessages.length);
    
    if (errorMessages.length > 0) {
      console.log('Console errors:', errorMessages);
      
      // Check that console errors don't expose sensitive information
      errorMessages.forEach((msg: string) => {
        expect(msg).not.toMatch(/password|key|token|secret/i);
        expect(msg).not.toMatch(/database.*error|sql.*error/i);
      });
    }
  });
});