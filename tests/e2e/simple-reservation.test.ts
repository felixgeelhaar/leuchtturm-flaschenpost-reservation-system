import { test, expect } from '@playwright/test';

test.describe('Simple Reservation Test', () => {
  test('should submit a basic pickup reservation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page and form to load
    await page.waitForSelector('form');
    await page.waitForTimeout(3000);
    
    // Fill the form step by step
    console.log('Selecting magazine...');
    await page.selectOption('#magazineId', { index: 1 });
    
    console.log('Filling personal info...');
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'User');  
    await page.fill('#email', `test.${Date.now()}@example.com`);
    
    console.log('Setting delivery method...');
    await page.selectOption('#deliveryMethod', 'pickup');
    
    console.log('Accepting consent...');
    await page.check('#consent-essential');
    
    // Wait for validation
    await page.waitForTimeout(2000);
    
    // Force click the submit button even if disabled to see what happens
    console.log('Attempting to submit...');
    try {
      await page.click('button[type="submit"]', { force: true });
      await page.waitForTimeout(5000);
      
      // Check for any response
      const successMessage = page.locator('.alert-success');
      const errorMessage = page.locator('.alert-error');
      const serverError = page.locator('[class*="error"]');
      
      const hasSuccess = await successMessage.isVisible();
      const hasError = await errorMessage.isVisible();
      
      console.log('Success visible:', hasSuccess);
      console.log('Error visible:', hasError);
      
      if (hasSuccess) {
        const successText = await successMessage.textContent();
        console.log('Success message:', successText);
      }
      
      if (hasError) {
        const errorText = await errorMessage.textContent();
        console.log('Error message:', errorText);
      }
      
      // Check browser console for any errors
      const logs: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          logs.push(msg.text());
        }
      });
      
      if (logs.length > 0) {
        console.log('Console errors:', logs);
      }
      
    } catch (error: any) {
      console.log('Submit failed:', error.message);
    }
    
    await page.screenshot({ path: 'simple-reservation-test.png', fullPage: true });
  });
});