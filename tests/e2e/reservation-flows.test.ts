import { test, expect, Page } from '@playwright/test';

// Test data
// const testMagazine = {
//   id: '304db363-ab60-4e3c-8aec-98c4c16d45f2',
//   title: 'Flaschenpost Magazin',
//   issueNumber: 'Ausgabe 2024 / 2025',
// };

const fillPersonalInfo = async (page: Page) => {
  await page.fill('#firstName', 'Test');
  await page.fill('#lastName', 'User');
  await page.fill('#email', 'test@example.com');
  await page.fill('#phone', '+49123456789');
};

const acceptCookies = async (page: Page) => {
  // Accept essential cookies if banner appears
  const consentBanner = page.locator('[data-testid="consent-banner"]');
  if (await consentBanner.isVisible()) {
    await page.click('[data-testid="accept-essential"]');
  }
};

test.describe('Magazine Reservation System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await acceptCookies(page);

    // Wait for the form to be loaded
    await page.waitForSelector('#magazineId', { state: 'visible' });
  });

  test('should load the reservation form', async ({ page }) => {
    // Check main elements are visible
    await expect(page.locator('h1').first()).toContainText('Flaschenpost');
    await expect(page.locator('#magazineId')).toBeVisible();
    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#lastName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
  });

  test.describe('Pickup Flow', () => {
    test('should complete pickup reservation without pictures', async ({
      page,
    }) => {
      // Select magazine
      await page.selectOption('#magazineId', { index: 1 });
      await page.waitForTimeout(500); // Wait for magazine details to load

      // Fill personal information
      await fillPersonalInfo(page);

      // Ensure pickup is selected (default)
      const pickupRadio = page.locator('input[value="pickup"]');
      await expect(pickupRadio).toBeChecked();

      // Select pickup location
      await page.selectOption(
        '#pickupLocation',
        'BRK Haus für Kinder - Leuchtturm',
      );

      // Set pickup date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      await page.fill('#pickupDate', dateStr);

      // Accept consents
      await page.check('#consent-essential');
      await page.check('#consent-functional');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify success message
      await expect(page.locator('.alert-success')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('.alert-success')).toContainText(
        'Reservierung erfolgreich',
      );
    });

    test('should complete pickup reservation with group picture', async ({
      page,
    }) => {
      // Select magazine
      await page.selectOption('#magazineId', { index: 1 });
      await page.waitForTimeout(500);

      // Fill personal information
      await fillPersonalInfo(page);

      // Ensure pickup is selected
      await expect(page.locator('input[value="pickup"]')).toBeChecked();

      // Select pickup details
      await page.selectOption(
        '#pickupLocation',
        'BRK Haus für Kinder - Leuchtturm',
      );
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.fill('#pickupDate', tomorrow.toISOString().split('T')[0]);

      // Order group picture
      await page.check('#order-group-picture');
      await page.waitForSelector('#childName', { state: 'visible' });
      await page.fill('#childName', 'Max Mustermann');
      await page.selectOption('#childGroupName', 'Seesterne');

      // Accept consents
      await page.check('#consent-essential');
      await page.check('#consent-functional');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify success
      await expect(page.locator('.alert-success')).toBeVisible({
        timeout: 10000,
      });
    });

    test('should complete pickup with both group and vorschul pictures', async ({
      page,
    }) => {
      // Select magazine
      await page.selectOption('#magazineId', { index: 1 });
      await page.waitForTimeout(500);

      // Fill personal information
      await fillPersonalInfo(page);

      // Pickup details
      await page.selectOption(
        '#pickupLocation',
        'BRK Haus für Kinder - Leuchtturm',
      );
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.fill('#pickupDate', tomorrow.toISOString().split('T')[0]);

      // Order both pictures
      await page.check('#order-group-picture');
      await page.fill('#childName', 'Anna Schmidt');
      await page.selectOption('#childGroupName', 'Delfine');

      await page.check('#order-vorschul-picture');
      await page.check('#child-is-vorschueler');

      // Accept consents
      await page.check('#consent-essential');
      await page.check('#consent-functional');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify success
      await expect(page.locator('.alert-success')).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('Shipping Flow', () => {
    test('should complete shipping reservation with PayPal', async ({
      page,
    }) => {
      // Select magazine
      await page.selectOption('#magazineId', { index: 1 });
      await page.waitForTimeout(500);

      // Fill personal information
      await fillPersonalInfo(page);

      // Select shipping
      await page.click('input[value="shipping"]');
      await page.waitForSelector('#street', { state: 'visible' });

      // Fill address
      await page.fill('#street', 'Teststraße');
      await page.fill('#houseNumber', '123');
      await page.fill('#postalCode', '12345');
      await page.fill('#city', 'München');
      await page.selectOption('#country', 'DE');

      // Select payment method
      await page.click('input[value="paypal"]');

      // Accept consents
      await page.check('#consent-essential');
      await page.check('#consent-functional');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify success
      await expect(page.locator('.alert-success')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('.alert-success')).toContainText('PayPal');
    });

    test('should complete shipping with pictures', async ({ page }) => {
      // Select magazine
      await page.selectOption('#magazineId', { index: 1 });
      await page.waitForTimeout(500);

      // Fill personal information
      await fillPersonalInfo(page);

      // Select shipping
      await page.click('input[value="shipping"]');
      await page.waitForSelector('#street', { state: 'visible' });

      // Fill address
      await page.fill('#street', 'Musterstraße');
      await page.fill('#houseNumber', '456');
      await page.fill('#postalCode', '80331');
      await page.fill('#city', 'München');
      await page.selectOption('#country', 'DE');

      // Select payment method
      await page.click('input[value="paypal"]');

      // Order group picture
      await page.check('#order-group-picture');
      await page.fill('#childName', 'Lisa Weber');
      await page.selectOption('#childGroupName', 'Schildkröten');

      // Accept consents
      await page.check('#consent-essential');
      await page.check('#consent-functional');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify success
      await expect(page.locator('.alert-success')).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('Validation', () => {
    test('should show validation errors for required fields', async ({
      page,
    }) => {
      // Try to submit without filling anything
      await page.click('button[type="submit"]');

      // Check for validation messages
      await expect(page.locator('#magazineId:invalid')).toBeVisible();
      await expect(page.locator('#firstName:invalid')).toBeVisible();
      await expect(page.locator('#lastName:invalid')).toBeVisible();
      await expect(page.locator('#email:invalid')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.selectOption('#magazineId', { index: 1 });
      await page.fill('#firstName', 'Test');
      await page.fill('#lastName', 'User');
      await page.fill('#email', 'invalid-email');

      await page.click('button[type="submit"]');

      // Check for email validation error
      await expect(page.locator('#email:invalid')).toBeVisible();
    });

    test('should require address fields for shipping', async ({ page }) => {
      await page.selectOption('#magazineId', { index: 1 });
      await fillPersonalInfo(page);

      // Select shipping without filling address
      await page.click('input[value="shipping"]');

      // Accept consents
      await page.check('#consent-essential');
      await page.check('#consent-functional');

      // Try to submit
      await page.click('button[type="submit"]');

      // Check for address validation errors
      await expect(page.locator('#street:invalid')).toBeVisible();
      await expect(page.locator('#houseNumber:invalid')).toBeVisible();
      await expect(page.locator('#postalCode:invalid')).toBeVisible();
      await expect(page.locator('#city:invalid')).toBeVisible();
    });

    test('should require child info for picture orders', async ({ page }) => {
      await page.selectOption('#magazineId', { index: 1 });
      await fillPersonalInfo(page);

      // Check picture order without child info
      await page.check('#order-group-picture');

      // Accept consents
      await page.check('#consent-essential');
      await page.check('#consent-functional');

      // Try to submit
      await page.click('button[type="submit"]');

      // Check for validation errors
      await expect(page.locator('#childName:invalid')).toBeVisible();
      await expect(page.locator('#childGroupName:invalid')).toBeVisible();
    });

    test('should require consent', async ({ page }) => {
      await page.selectOption('#magazineId', { index: 1 });
      await fillPersonalInfo(page);

      // Try to submit without consent
      await page.click('button[type="submit"]');

      // Check for consent validation error
      await expect(page.locator('#consent-essential:invalid')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip();
      }

      // Select magazine
      await page.selectOption('#magazineId', { index: 1 });

      // Fill form on mobile
      await fillPersonalInfo(page);

      // Check that form is properly displayed
      await expect(page.locator('#pickupLocation')).toBeVisible();

      // Accept consents
      await page.check('#consent-essential');
      await page.check('#consent-functional');

      // Submit should work
      await page.click('button[type="submit"]');

      // Verify success on mobile
      await expect(page.locator('.alert-success')).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
