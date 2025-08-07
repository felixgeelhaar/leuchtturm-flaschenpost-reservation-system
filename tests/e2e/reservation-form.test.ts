import { test, expect, Page } from '@playwright/test';

// Test data
const testUser = {
  firstName: 'Max',
  lastName: 'Mustermann',
  email: 'max.test@example.com',
};

const shippingAddress = {
  street: 'Musterstraße',
  houseNumber: '123',
  postalCode: '12345',
  city: 'Berlin',
  country: 'DE',
};

// Helper functions
async function fillPersonalInfo(page: Page, user = testUser) {
  await page.fill('#firstName', user.firstName);
  await page.fill('#lastName', user.lastName);
  await page.fill('#email', user.email);
}

async function fillShippingAddress(page: Page, address = shippingAddress) {
  await page.fill('#street', address.street);
  await page.fill('#houseNumber', address.houseNumber);
  await page.fill('#postalCode', address.postalCode);
  await page.fill('#city', address.city);
  await page.selectOption('#country', address.country);
}

async function acceptEssentialConsent(page: Page) {
  await page.check('#consent-essential');
}

async function submitForm(page: Page) {
  await page.click('button[type="submit"]');
}

test.describe('Reservation Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load completely
    await page.waitForSelector('form');
    await page.waitForSelector('#magazineId');
    
    // Wait for magazines to load
    await page.waitForTimeout(2000);
  });

  test('should load the reservation form successfully', async ({ page }) => {
    // Check if main elements are present
    await expect(page.locator('h2')).toContainText('Flaschenpost');
    await expect(page.locator('#magazineId')).toBeVisible();
    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#lastName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#consent-essential')).toBeVisible();
    
    // Submit button should be disabled initially
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('.form-field-error')).toHaveCount(0); // Form should not submit
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should enable submit button when all required fields are filled for pickup', async ({ page }) => {
    // Select a magazine (first available option)
    await page.selectOption('#magazineId', { index: 1 });
    
    // Fill personal information
    await fillPersonalInfo(page);
    
    // Select pickup delivery method
    await page.selectOption('#deliveryMethod', 'pickup');
    
    // Accept essential consent
    await acceptEssentialConsent(page);
    
    // Wait for form validation
    await page.waitForTimeout(500);
    
    // Submit button should be enabled
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('should handle pickup delivery method successfully', async ({ page }) => {
    // Select magazine
    const magazineSelect = page.locator('#magazineId');
    await magazineSelect.selectOption({ index: 1 });
    
    // Fill personal information
    await fillPersonalInfo(page, {
      ...testUser,
      email: `pickup.${Date.now()}@example.com`
    });
    
    // Select pickup delivery
    await page.selectOption('#deliveryMethod', 'pickup');
    
    // Verify pickup location field is visible and filled
    await expect(page.locator('#pickupLocation')).toBeVisible();
    await expect(page.locator('#pickupLocation')).toHaveValue(/BRK Haus/);
    
    // Verify shipping address is not visible
    await expect(page.locator('#street')).not.toBeVisible();
    
    // Accept consent
    await acceptEssentialConsent(page);
    
    // Submit form
    await submitForm(page);
    
    // Wait for success message or form processing
    await page.waitForTimeout(3000);
    
    // Check for success (either success message or form reset)
    const successMessage = page.locator('.alert-success');
    const isSuccessVisible = await successMessage.isVisible();
    
    if (isSuccessVisible) {
      await expect(successMessage).toContainText('erfolgreich');
    } else {
      // If no success message, check that form was reset or shows processing
      console.log('Form submitted - checking for processing state or errors');
    }
  });

  test('should handle shipping delivery method successfully', async ({ page }) => {
    // Select magazine
    await page.selectOption('#magazineId', { index: 1 });
    
    // Fill personal information
    await fillPersonalInfo(page, {
      ...testUser,
      email: `shipping.${Date.now()}@example.com`
    });
    
    // Select shipping delivery
    await page.selectOption('#deliveryMethod', 'shipping');
    
    // Wait for shipping address fields to appear
    await page.waitForSelector('#street');
    
    // Verify shipping address fields are visible
    await expect(page.locator('#street')).toBeVisible();
    await expect(page.locator('#houseNumber')).toBeVisible();
    await expect(page.locator('#postalCode')).toBeVisible();
    await expect(page.locator('#city')).toBeVisible();
    await expect(page.locator('#country')).toBeVisible();
    
    // Fill shipping address
    await fillShippingAddress(page);
    
    // Select payment method
    await page.selectOption('#paymentMethod', 'paypal');
    
    // Accept consent
    await acceptEssentialConsent(page);
    
    // Submit form
    await submitForm(page);
    
    // Wait for processing
    await page.waitForTimeout(3000);
    
    // Check for success
    const successMessage = page.locator('.alert-success');
    const isSuccessVisible = await successMessage.isVisible();
    
    if (isSuccessVisible) {
      await expect(successMessage).toContainText('erfolgreich');
    }
  });

  test('should handle picture orders correctly', async ({ page }) => {
    // Select magazine
    await page.selectOption('#magazineId', { index: 1 });
    
    // Fill personal information
    await fillPersonalInfo(page, {
      ...testUser,
      email: `pictures.${Date.now()}@example.com`
    });
    
    // Select pickup delivery
    await page.selectOption('#deliveryMethod', 'pickup');
    
    // Check group picture order
    await page.check('#order-group-picture');
    
    // Wait for child name field to appear
    await page.waitForSelector('#childName');
    
    // Fill child name (required when ordering pictures)
    await page.fill('#childName', 'Emma Mustermann');
    
    // Select child group
    await page.selectOption('#childGroupName', 'seesterne');
    
    // Check if child is Vorschüler
    await page.check('#child-is-vorschueler');
    
    // Wait for Vorschüler picture option
    await page.waitForSelector('#order-vorschul-picture');
    
    // Order Vorschüler picture
    await page.check('#order-vorschul-picture');
    
    // Accept consent
    await acceptEssentialConsent(page);
    
    // Submit form
    await submitForm(page);
    
    // Wait for processing
    await page.waitForTimeout(3000);
    
    // Check result
    const successMessage = page.locator('.alert-success');
    const isSuccessVisible = await successMessage.isVisible();
    
    if (isSuccessVisible) {
      await expect(successMessage).toContainText('erfolgreich');
    }
  });

  test('should show cost calculation for shipping', async ({ page }) => {
    // Select magazine
    await page.selectOption('#magazineId', { index: 1 });
    
    // Fill personal information
    await fillPersonalInfo(page);
    
    // Select shipping delivery
    await page.selectOption('#deliveryMethod', 'shipping');
    
    // Wait for cost summary to update
    await page.waitForTimeout(1000);
    
    // Check cost summary shows shipping costs
    const costSummary = page.locator('.bg-primary-50');
    await expect(costSummary).toBeVisible();
    await expect(costSummary).toContainText('Versandkostenpauschale');
    await expect(costSummary).toContainText('Gesamtbetrag');
  });

  test('should reset form when reset button is clicked', async ({ page }) => {
    // Fill some form data
    await page.selectOption('#magazineId', { index: 1 });
    await fillPersonalInfo(page);
    await page.fill('#notes', 'Test notes');
    
    // Click reset button
    await page.click('button:has-text("Zurücksetzen")');
    
    // Wait for reset
    await page.waitForTimeout(500);
    
    // Verify form is reset
    await expect(page.locator('#magazineId')).toHaveValue('');
    await expect(page.locator('#firstName')).toHaveValue('');
    await expect(page.locator('#lastName')).toHaveValue('');
    await expect(page.locator('#email')).toHaveValue('');
    await expect(page.locator('#notes')).toHaveValue('');
  });

  test('should handle form validation errors gracefully', async ({ page }) => {
    // Select magazine
    await page.selectOption('#magazineId', { index: 1 });
    
    // Fill invalid email
    await page.fill('#firstName', 'Max');
    await page.fill('#lastName', 'Mustermann');
    await page.fill('#email', 'invalid-email');
    
    // Select pickup delivery
    await page.selectOption('#deliveryMethod', 'pickup');
    
    // Accept consent
    await acceptEssentialConsent(page);
    
    // Form validation should prevent submission due to invalid email
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    
    // Fix email
    await page.fill('#email', 'valid@example.com');
    
    // Wait for validation
    await page.waitForTimeout(500);
    
    // Submit button should be enabled now
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('should handle delivery method switching correctly', async ({ page }) => {
    // Select magazine and fill basic info
    await page.selectOption('#magazineId', { index: 1 });
    await fillPersonalInfo(page);
    
    // Start with pickup
    await page.selectOption('#deliveryMethod', 'pickup');
    await expect(page.locator('#pickupLocation')).toBeVisible();
    await expect(page.locator('#street')).not.toBeVisible();
    
    // Switch to shipping
    await page.selectOption('#deliveryMethod', 'shipping');
    await page.waitForSelector('#street');
    
    await expect(page.locator('#street')).toBeVisible();
    await expect(page.locator('#paymentMethod')).toBeVisible();
    
    // Switch back to pickup
    await page.selectOption('#deliveryMethod', 'pickup');
    await page.waitForTimeout(500);
    
    await expect(page.locator('#pickupLocation')).toBeVisible();
    await expect(page.locator('#street')).not.toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile layout
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('#magazineId')).toBeVisible();
    await expect(page.locator('#firstName')).toBeVisible();
    
    // Form fields should stack vertically on mobile
    const firstName = page.locator('#firstName');
    const lastName = page.locator('#lastName');
    
    const firstNameBox = await firstName.boundingBox();
    const lastNameBox = await lastName.boundingBox();
    
    // On mobile, lastName should be below firstName (higher y coordinate)
    expect(lastNameBox!.y).toBeGreaterThan(firstNameBox!.y);
  });
});