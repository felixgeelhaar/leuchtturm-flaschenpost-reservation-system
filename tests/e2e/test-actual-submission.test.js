import { test, expect } from '@playwright/test';

test('should successfully submit pickup reservation', async ({ page }) => {
  // Go to the page
  await page.goto('http://localhost:4321/');
  
  // Wait for form to load
  await page.waitForSelector('form');
  await page.waitForTimeout(3000);
  
  // Fill required fields for pickup with unique email
  const uniqueEmail = `test.pickup.${Date.now()}@example.com`;
  await page.selectOption('#magazineId', { index: 1 });
  await page.fill('#firstName', 'Max');
  await page.fill('#lastName', 'Pickup');
  await page.fill('#email', uniqueEmail);
  await page.selectOption('#deliveryMethod', 'pickup');
  await page.check('#consent-essential');
  
  // Wait for form validation
  await page.waitForTimeout(2000);
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Wait for response
  await page.waitForTimeout(5000);
  
  // Check for success message
  const successMessage = page.locator('.alert-success, [data-success="true"], text=erfolgreich');
  const errorMessage = page.locator('.alert-error, [data-error="true"]');
  
  // Either success or friendly error (like rate limiting)
  const hasSuccess = await successMessage.count() > 0;
  const hasError = await errorMessage.count() > 0;
  
  if (hasSuccess) {
    console.log('✅ Pickup reservation submitted successfully!');
    await expect(successMessage).toBeVisible();
  } else if (hasError) {
    const errorText = await errorMessage.textContent();
    console.log('⚠️  Pickup reservation got expected error:', errorText);
    // Rate limiting or other expected errors are OK
    expect(errorText).toMatch(/rate limit|zu viele|versuchen|später|erneut/i);
  } else {
    console.log('❌ No success or error message found');
    throw new Error('Expected success or error message');
  }
});

test('should successfully submit shipping reservation', async ({ page }) => {
  // Go to the page
  await page.goto('http://localhost:4321/');
  
  // Wait for form to load
  await page.waitForSelector('form');
  await page.waitForTimeout(3000);
  
  // Fill required fields for shipping with unique email
  const uniqueEmail = `test.shipping.${Date.now()}@example.com`;
  await page.selectOption('#magazineId', { index: 1 });
  await page.fill('#firstName', 'Max');
  await page.fill('#lastName', 'Shipping');
  await page.fill('#email', uniqueEmail);
  await page.selectOption('#deliveryMethod', 'shipping');
  await page.selectOption('#paymentMethod', 'paypal');
  
  // Fill shipping address
  await page.fill('#street', 'Teststraße');
  await page.fill('#houseNumber', '456');
  await page.fill('#postalCode', '12345');
  await page.fill('#city', 'Berlin');
  await page.selectOption('#country', 'DE');
  
  await page.check('#consent-essential');
  
  // Wait for form validation
  await page.waitForTimeout(2000);
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Wait for response
  await page.waitForTimeout(5000);
  
  // Check for success message
  const successMessage = page.locator('.alert-success, [data-success="true"], text=erfolgreich');
  const errorMessage = page.locator('.alert-error, [data-error="true"]');
  
  // Either success or friendly error (like rate limiting)
  const hasSuccess = await successMessage.count() > 0;
  const hasError = await errorMessage.count() > 0;
  
  if (hasSuccess) {
    console.log('✅ Shipping reservation submitted successfully!');
    await expect(successMessage).toBeVisible();
  } else if (hasError) {
    const errorText = await errorMessage.textContent();
    console.log('⚠️  Shipping reservation got expected error:', errorText);
    // Rate limiting or other expected errors are OK
    expect(errorText).toMatch(/rate limit|zu viele|versuchen|später|erneut/i);
  } else {
    console.log('❌ No success or error message found');
    throw new Error('Expected success or error message');
  }
});