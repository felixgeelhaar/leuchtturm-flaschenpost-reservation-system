import { test, expect } from '@playwright/test';

test.describe('Validation Debug', () => {
  test('should check form validation state in browser', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForSelector('form');
    await page.waitForTimeout(3000);
    
    // Fill all required fields
    await page.selectOption('#magazineId', { index: 1 });
    await page.fill('#firstName', 'Max');
    await page.fill('#lastName', 'Mustermann');
    await page.fill('#email', 'test@example.com');
    await page.selectOption('#deliveryMethod', 'pickup');
    await page.check('#consent-essential');
    
    await page.waitForTimeout(2000);
    
    // Execute JavaScript to check the form validation state
    const validationState = await page.evaluate(() => {
      // Get Vue app instance
      const app = document.querySelector('#app')?.__vueParentComponent;
      
      if (!app) {
        return { error: 'Vue app not found' };
      }
      
      // Try to access the form component data
      const formComponent = document.querySelector('form')?.__vueParentComponent;
      
      if (!formComponent) {
        return { error: 'Form component not found' };
      }
      
      // Get the reactive data
      const setupState = formComponent?.setupState;
      
      if (setupState) {
        return {
          formData: JSON.parse(JSON.stringify(setupState.formData || {})),
          isFormValid: setupState.isFormValid,
          formErrors: JSON.parse(JSON.stringify(setupState.formErrors || {})),
          isSubmitting: setupState.isSubmitting
        };
      }
      
      return { error: 'Setup state not accessible' };
    });
    
    console.log('Validation State:', validationState);
    
    // Also check form validity using DOM API
    const formValidity = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        return {
          checkValidity: form.checkValidity(),
          validationMessage: form.validationMessage || 'No message'
        };
      }
      return { error: 'Form not found' };
    });
    
    console.log('Form Validity (DOM):', formValidity);
    
    // Check individual field validity
    const fieldValidities = await page.evaluate(() => {
      const fields = ['#magazineId', '#firstName', '#lastName', '#email', '#consent-essential'];
      const results = {};
      
      fields.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          results[selector] = {
            value: element.value || (element.type === 'checkbox' ? element.checked : 'N/A'),
            validity: element.checkValidity ? element.checkValidity() : 'N/A',
            validationMessage: element.validationMessage || 'None'
          };
        }
      });
      
      return results;
    });
    
    console.log('Field Validities:', fieldValidities);
  });
});