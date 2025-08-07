import { test, expect } from '@playwright/test';

test('submit button should be enabled for valid pickup form', async ({ page }) => {
  // Go to the page
  await page.goto('http://localhost:4321/');
  
  // Wait for form to load
  await page.waitForSelector('form');
  await page.waitForTimeout(3000);
  
  // Fill required fields for pickup
  await page.selectOption('#magazineId', { index: 1 }); // Select first available magazine
  await page.fill('#firstName', 'Max');
  await page.fill('#lastName', 'Mustermann');
  await page.fill('#email', 'test@example.com');
  await page.selectOption('#deliveryMethod', 'pickup');
  await page.check('#consent-essential');
  
  // Wait a bit for validation to complete
  await page.waitForTimeout(2000);
  
  // Check if submit button is enabled
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeEnabled();
  
  console.log('✅ Submit button is enabled for valid pickup form');
});

test('submit button should be enabled for valid shipping form', async ({ page }) => {
  // Go to the page
  await page.goto('http://localhost:4321/');
  
  // Wait for form to load
  await page.waitForSelector('form');
  await page.waitForTimeout(3000);
  
  // Fill required fields for shipping
  await page.selectOption('#magazineId', { index: 1 }); // Select first available magazine
  await page.fill('#firstName', 'Max');
  await page.fill('#lastName', 'Mustermann'); 
  await page.fill('#email', 'test@example.com');
  await page.selectOption('#deliveryMethod', 'shipping');
  await page.selectOption('#paymentMethod', 'paypal');
  
  // Fill shipping address
  await page.fill('#street', 'Musterstraße');
  await page.fill('#houseNumber', '123');
  await page.fill('#postalCode', '80331');
  await page.fill('#city', 'München');
  await page.selectOption('#country', 'DE');
  
  await page.check('#consent-essential');
  
  // Wait a bit for validation to complete
  await page.waitForTimeout(2000);
  
  // Check if submit button is enabled
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeEnabled();
  
  console.log('✅ Submit button is enabled for valid shipping form');
});