// @ts-nocheck
import { test, expect, type Page } from '@playwright/test';

test.describe('Debug Form Issues', () => {
  test('should debug form validation step by step', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('form');
    await page.waitForTimeout(3000); // Wait for Vue to initialize
    
    // Check initial state
    console.log('=== Initial State ===');
    const submitButton = page.locator('button[type="submit"]');
    console.log('Submit button disabled:', await submitButton.isDisabled());
    
    // Step 1: Check magazine options
    const magazineSelect = page.locator('#magazineId');
    const options = await magazineSelect.locator('option').count();
    console.log('Magazine options available:', options);
    
    if (options > 1) {
      await magazineSelect.selectOption({ index: 1 });
      console.log('Selected magazine');
      await page.waitForTimeout(1000);
      console.log('Submit button disabled after magazine:', await submitButton.isDisabled());
    } else {
      console.log('❌ No magazines available!');
      return;
    }
    
    // Step 2: Fill personal info
    await page.fill('#firstName', 'Max');
    await page.waitForTimeout(500);
    console.log('Submit button disabled after firstName:', await submitButton.isDisabled());
    
    await page.fill('#lastName', 'Mustermann');
    await page.waitForTimeout(500);
    console.log('Submit button disabled after lastName:', await submitButton.isDisabled());
    
    await page.fill('#email', 'test@example.com');
    await page.waitForTimeout(500);
    console.log('Submit button disabled after email:', await submitButton.isDisabled());
    
    // Step 3: Set delivery method
    await page.selectOption('#deliveryMethod', 'pickup');
    await page.waitForTimeout(1000);
    console.log('Submit button disabled after delivery method:', await submitButton.isDisabled());
    
    // Step 4: Check consent
    const consentCheckbox = page.locator('#consent-essential');
    await consentCheckbox.check();
    await page.waitForTimeout(1000);
    console.log('Submit button disabled after consent:', await submitButton.isDisabled());
    
    // Final check
    await page.waitForTimeout(2000);
    const finalDisabled = await submitButton.isDisabled();
    console.log('=== Final State ===');
    console.log('Submit button disabled:', finalDisabled);
    
    if (!finalDisabled) {
      console.log('✅ Form is ready to submit!');
      // Try submitting
      await submitButton.click();
      await page.waitForTimeout(5000);
      
      // Check for success or error messages
      const successMessage = page.locator('.alert-success');
      const errorMessage = page.locator('.alert-error');
      
      const hasSuccess = await successMessage.isVisible();
      const hasError = await errorMessage.isVisible();
      
      console.log('Success message visible:', hasSuccess);
      console.log('Error message visible:', hasError);
      
      if (hasError) {
        const errorText = await errorMessage.textContent();
        console.log('Error message:', errorText);
      }
    } else {
      console.log('❌ Form is still not ready');
      
      // Debug what's missing
      const magazineValue = await magazineSelect.inputValue();
      const firstNameValue = await page.inputValue('#firstName');
      const lastNameValue = await page.inputValue('#lastName');
      const emailValue = await page.inputValue('#email');
      const pickupLocationValue = await page.inputValue('#pickupLocation');
      const consentChecked = await consentCheckbox.isChecked();
      
      console.log('=== Form Values ===');
      console.log('Magazine:', magazineValue);
      console.log('First name:', firstNameValue);
      console.log('Last name:', lastNameValue);
      console.log('Email:', emailValue);
      console.log('Pickup location:', pickupLocationValue);
      console.log('Consent checked:', consentChecked);
      
      // Check for any validation errors displayed
      const errorElements = await page.locator('.form-field-error, .text-error-700').all();
      if (errorElements.length > 0) {
        console.log('=== Validation Errors ===');
        for (const error of errorElements) {
          const errorText = await error.textContent();
          if (errorText && errorText.trim()) {
            console.log('Error:', errorText);
          }
        }
      }
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-form-state.png', fullPage: true });
  });
});