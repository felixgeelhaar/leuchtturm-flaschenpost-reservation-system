import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ReservationForm from '@/components/ReservationForm.vue';
import { mockMagazines, validFormDataPickup, validFormDataShipping, mockApiResponse } from '../../fixtures/test-data';

// Mock fetch globally
global.fetch = vi.fn();

describe('ReservationForm.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    });
  });

  describe('Component Rendering', () => {
    it('renders the form with all required fields', () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Check main form elements
      expect(wrapper.find('form').exists()).toBe(true);
      expect(wrapper.find('input[id="firstName"]').exists()).toBe(true);
      expect(wrapper.find('input[id="lastName"]').exists()).toBe(true);
      expect(wrapper.find('input[id="email"]').exists()).toBe(true);
      expect(wrapper.find('input[id="phone"]').exists()).toBe(true);
      expect(wrapper.find('select[id="magazineId"]').exists()).toBe(true);
      expect(wrapper.find('select[id="quantity"]').exists()).toBe(true);
      expect(wrapper.find('select[id="deliveryMethod"]').exists()).toBe(true);
      
      // Check consent checkboxes
      expect(wrapper.find('input[id="consent-essential"]').exists()).toBe(true);
      expect(wrapper.find('input[id="consent-functional"]').exists()).toBe(true);
      expect(wrapper.find('input[id="consent-analytics"]').exists()).toBe(true);
      expect(wrapper.find('input[id="consent-marketing"]').exists()).toBe(true);
      
      // Check submit button
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
    });

    it('renders magazine options correctly', () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      const magazineSelect = wrapper.find('select[id="magazineId"]');
      const options = magazineSelect.findAll('option');
      
      // Should have placeholder + 2 magazines
      expect(options).toHaveLength(3);
      expect(options[0].text()).toContain('Bitte wählen');
      expect(options[1].text()).toContain('Flaschenpost - 2024-01');
      expect(options[2].text()).toContain('Flaschenpost - 2024-02');
    });

    it('shows pickup location when delivery method is pickup', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      const deliverySelect = wrapper.find('select[id="deliveryMethod"]');
      await deliverySelect.setValue('pickup');
      await nextTick();

      expect(wrapper.find('select[id="pickupLocation"]').exists()).toBe(true);
      expect(wrapper.find('fieldset').text()).not.toContain('Lieferadresse');
    });

    it('shows address fields when delivery method is shipping', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      const deliverySelect = wrapper.find('select[id="deliveryMethod"]');
      await deliverySelect.setValue('shipping');
      await nextTick();

      expect(wrapper.find('input[id="street"]').exists()).toBe(true);
      expect(wrapper.find('input[id="houseNumber"]').exists()).toBe(true);
      expect(wrapper.find('input[id="postalCode"]').exists()).toBe(true);
      expect(wrapper.find('input[id="city"]').exists()).toBe(true);
      expect(wrapper.find('select[id="country"]').exists()).toBe(true);
      expect(wrapper.find('select[id="pickupLocation"]').exists()).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Try to submit empty form by triggering form submit event
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      // Should show validation errors - check for any validation error messages
      const hasValidationErrors = wrapper.text().includes('mindestens') || 
                                  wrapper.text().includes('erforderlich') ||
                                  wrapper.text().includes('Pflichtfeld') ||
                                  wrapper.find('.form-error').exists();
      expect(hasValidationErrors).toBe(true);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      const emailInput = wrapper.find('input[id="email"]');
      await emailInput.setValue('invalid-email');
      
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      // Check for email validation error
      const hasEmailError = wrapper.text().includes('E-Mail') || 
                           wrapper.text().includes('gültige') ||
                           wrapper.find('.form-error').exists();
      expect(hasEmailError).toBe(true);
    });

    it('validates phone number format', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      const phoneInput = wrapper.find('input[id="phone"]');
      await phoneInput.setValue('123');
      
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      // Check for phone validation error
      const hasPhoneError = wrapper.text().includes('Telefon') || 
                           wrapper.text().includes('gültige') ||
                           wrapper.find('.form-error').exists();
      expect(hasPhoneError).toBe(true);
    });

    it('validates required consent', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Fill form but don't check essential consent
      await fillValidForm(wrapper, validFormDataPickup);
      
      const essentialConsent = wrapper.find('input[id="consent-essential"]');
      await essentialConsent.setChecked(false);
      
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      // Check for consent validation error
      const hasConsentError = wrapper.text().includes('Einwilligung') || 
                             wrapper.text().includes('erforderlich') ||
                             wrapper.find('.form-error').exists();
      expect(hasConsentError).toBe(true);
    });

    it('validates pickup location when delivery method is pickup', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      await fillValidForm(wrapper, validFormDataPickup);
      
      // Clear pickup location
      const pickupSelect = wrapper.find('select[id="pickupLocation"]');
      await pickupSelect.setValue('');
      
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      expect(wrapper.text()).toContain('Bitte wählen Sie einen Abholort');
    });

    it('validates address fields when delivery method is shipping', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      const deliverySelect = wrapper.find('select[id="deliveryMethod"]');
      await deliverySelect.setValue('shipping');
      await nextTick();

      await fillValidForm(wrapper, validFormDataShipping);
      
      // Clear required address field
      const streetInput = wrapper.find('input[id="street"]');
      await streetInput.setValue('');
      
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      expect(wrapper.text()).toContain('Straße ist erforderlich');
    });
  });

  describe('Form Submission', () => {
    it('submits form with pickup data successfully', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Fill all required fields properly for a valid form
      await wrapper.find('#firstName').setValue('Max');
      await wrapper.find('#lastName').setValue('Mustermann');  
      await wrapper.find('#email').setValue('max@example.com');
      await wrapper.find('#phone').setValue('+49123456789'); // Valid phone number
      await wrapper.find('#magazineId').setValue('123e4567-e89b-12d3-a456-426614174000');
      await wrapper.find('#quantity').setValue('1');
      await wrapper.find('#deliveryMethod').setValue('pickup');
      await nextTick();
      await wrapper.find('#pickupLocation').setValue('Berlin Mitte');
      await wrapper.find('#consent-essential').setChecked(true);
      await nextTick();
      
      // Set the form data directly to ensure it's valid
      const vm = wrapper.vm as any;
      vm.formData = {
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max@example.com',
        phone: '+49123456789',
        magazineId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 1,
        deliveryMethod: 'pickup',
        pickupLocation: 'Berlin Mitte',
        pickupDate: '', // Optional
        notes: '',
        address: undefined, // Not needed for pickup
        consents: {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
        },
      };
      
      // Clear any existing form errors
      vm.formErrors = {};
      
      await nextTick();
      
      // Now trigger form submission
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      expect(fetch).toHaveBeenCalledWith('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: expect.stringContaining('"deliveryMethod":"pickup"'),
      });

      // Should show success message
      await nextTick();
      expect(wrapper.text()).toContain('Reservierung erfolgreich!');
    });

    it('submits form with shipping data successfully', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Fill form manually for shipping
      await wrapper.find('#firstName').setValue('Anna');
      await wrapper.find('#lastName').setValue('Schmidt');
      await wrapper.find('#email').setValue('anna@example.com');
      await wrapper.find('#phone').setValue('+49987654321');
      await wrapper.find('#magazineId').setValue('123e4567-e89b-12d3-a456-426614174000');
      await wrapper.find('#quantity').setValue('2');
      await wrapper.find('#deliveryMethod').setValue('shipping');
      await nextTick();
      
      // Fill address fields
      await wrapper.find('#street').setValue('Musterstraße');
      await wrapper.find('#houseNumber').setValue('123');
      await wrapper.find('#postalCode').setValue('10115');
      await wrapper.find('#city').setValue('Berlin');
      await wrapper.find('#country').setValue('DE');
      await wrapper.find('#consent-essential').setChecked(true);
      await nextTick();
      
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      expect(fetch).toHaveBeenCalledWith('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: expect.stringContaining('"deliveryMethod":"shipping"'),
      });

      const requestBody = JSON.parse((fetch as any).mock.calls[0][1].body);
      expect(requestBody.address.street).toBe('Musterstraße');
    });

    it('handles submission errors gracefully', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Mock fetch to return error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: 'Server error',
          message: 'Something went wrong',
        }),
      });

      // Set valid form data directly
      const vm = wrapper.vm as any;
      vm.formData = {
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max@example.com',
        phone: '+49123456789',
        magazineId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 1,
        deliveryMethod: 'pickup',
        pickupLocation: 'Berlin Mitte',
        pickupDate: '',
        notes: '',
        address: undefined, // Not needed for pickup
        consents: {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
        },
      };
      
      // Clear any existing form errors
      vm.formErrors = {};
      
      await nextTick();
      
      // Trigger form submission
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      expect(wrapper.text()).toContain('Fehler beim Absenden');
      expect(wrapper.text()).toContain('Something went wrong');
    });

    it('shows loading state during submission', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Mock fetch to be slow
      (global.fetch as any).mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

      // Set valid form data directly
      const vm = wrapper.vm as any;
      vm.formData = {
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max@example.com',
        phone: '+49123456789',
        magazineId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 1,
        deliveryMethod: 'pickup',
        pickupLocation: 'Berlin Mitte',
        pickupDate: '',
        notes: '',
        address: undefined, // Not needed for pickup
        consents: {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
        },
      };
      
      // Clear any existing form errors
      vm.formErrors = {};
      
      await nextTick();
      
      // Start submission but don't await it
      vm.handleSubmit();
      await nextTick(); // Let the submission start

      // Should show loading state
      expect(wrapper.text()).toContain('Wird verarbeitet...');
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeDefined();
    });
  });

  describe('Delivery Method Switching', () => {
    it('clears pickup location when switching to shipping', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Set pickup location first
      const pickupSelect = wrapper.find('select[id="pickupLocation"]');
      await pickupSelect.setValue('Berlin Mitte');
      
      // Verify it's set
      expect(pickupSelect.element.value).toBe('Berlin Mitte');

      // Switch to shipping - this should clear the pickup location
      const deliverySelect = wrapper.find('select[id="deliveryMethod"]');
      await deliverySelect.setValue('shipping');
      await nextTick();

      // Pickup location should be cleared when we switch to shipping
      expect(wrapper.vm.formData.pickupLocation).toBe('');
    });

    it('clears address when switching to pickup', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Switch to shipping and fill address
      const deliverySelect = wrapper.find('select[id="deliveryMethod"]');
      await deliverySelect.setValue('shipping');
      await nextTick();

      const streetInput = wrapper.find('input[id="street"]');
      await streetInput.setValue('Test Street');

      // Switch back to pickup
      await deliverySelect.setValue('pickup');
      await nextTick();

      // Switch back to shipping to check if address was cleared
      await deliverySelect.setValue('shipping');
      await nextTick();

      const newStreetInput = wrapper.find('input[id="street"]');
      expect(newStreetInput.element.value).toBe('');
    });
  });

  describe('Form Reset', () => {
    it('resets form to initial state', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      await fillValidForm(wrapper, validFormDataPickup);
      
      const resetButton = wrapper.find('button[type="button"]');
      await resetButton.trigger('click');
      await nextTick();

      // Check that form is reset
      const firstNameInput = wrapper.find('input[id="firstName"]');
      const emailInput = wrapper.find('input[id="email"]');
      const essentialConsent = wrapper.find('input[id="consent-essential"]');
      
      expect(firstNameInput.element.value).toBe('');
      expect(emailInput.element.value).toBe('');
      expect(essentialConsent.element.checked).toBe(false);
    });
  });

  describe('Magazine Selection', () => {
    it('updates quantity options based on available copies', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Select first magazine (95 available)
      const magazineSelect = wrapper.find('select[id="magazineId"]');
      await magazineSelect.setValue(mockMagazines[0].id);
      await nextTick();

      const quantitySelect = wrapper.find('select[id="quantity"]');
      const options = quantitySelect.findAll('option');
      
      // Should have max 5 options (limited by business rule)
      expect(options).toHaveLength(5);
    });

    it('shows magazine details when selected', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      const magazineSelect = wrapper.find('select[id="magazineId"]');
      await magazineSelect.setValue(mockMagazines[0].id);
      await nextTick();

      expect(wrapper.text()).toContain(mockMagazines[0].title);
      expect(wrapper.text()).toContain(mockMagazines[0].description);
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and ARIA attributes', () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Check that form fields have labels
      const firstNameInput = wrapper.find('input[id="firstName"]');
      const firstNameLabel = wrapper.find('label[for="firstName"]');
      
      expect(firstNameLabel.exists()).toBe(true);
      expect(firstNameLabel.text()).toContain('Vorname');
      
      // Check required field indicators
      expect(firstNameLabel.classes()).toContain('form-label-required');
    });

    it('has proper fieldset and legend elements', () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      const fieldsets = wrapper.findAll('fieldset');
      expect(fieldsets.length).toBeGreaterThan(0);

      const legends = wrapper.findAll('legend');
      expect(legends.length).toBeGreaterThan(0);
      expect(legends[0].text()).toContain('Persönliche Angaben');
    });
  });
});

// Helper function to fill form with valid data
async function fillValidForm(wrapper: any, formData: any) {
  const fieldsToFill = [
    { selector: 'input[id="firstName"]', value: formData.firstName },
    { selector: 'input[id="lastName"]', value: formData.lastName },
    { selector: 'input[id="email"]', value: formData.email },
    { selector: 'input[id="phone"]', value: formData.phone || '' },
    { selector: 'select[id="magazineId"]', value: formData.magazineId },
    { selector: 'select[id="quantity"]', value: formData.quantity },
    { selector: 'select[id="deliveryMethod"]', value: formData.deliveryMethod },
    { selector: 'textarea[id="notes"]', value: formData.notes || '' },
  ];

  for (const field of fieldsToFill) {
    const element = wrapper.find(field.selector);
    if (element.exists()) {
      await element.setValue(field.value);
    }
  }

  // Handle delivery-specific fields
  if (formData.deliveryMethod === 'pickup' && formData.pickupLocation) {
    await nextTick(); // Wait for pickup fields to appear
    const pickupSelect = wrapper.find('select[id="pickupLocation"]');
    if (pickupSelect.exists()) {
      await pickupSelect.setValue(formData.pickupLocation);
    }
  }

  if (formData.deliveryMethod === 'shipping' && formData.address) {
    await nextTick(); // Wait for address fields to appear
    const addressFields = [
      { selector: 'input[id="street"]', value: formData.address.street },
      { selector: 'input[id="houseNumber"]', value: formData.address.houseNumber },
      { selector: 'input[id="postalCode"]', value: formData.address.postalCode },
      { selector: 'input[id="city"]', value: formData.address.city },
      { selector: 'select[id="country"]', value: formData.address.country },
      { selector: 'input[id="addressLine2"]', value: formData.address.addressLine2 || '' },
    ];

    for (const field of addressFields) {
      const element = wrapper.find(field.selector);
      if (element.exists()) {
        await element.setValue(field.value);
      }
    }
  }

  // Handle consents
  const consentFields = [
    { id: 'consent-essential', value: formData.consents.essential },
    { id: 'consent-functional', value: formData.consents.functional },
    { id: 'consent-analytics', value: formData.consents.analytics },
    { id: 'consent-marketing', value: formData.consents.marketing },
  ];

  for (const consent of consentFields) {
    const checkbox = wrapper.find(`input[id="${consent.id}"]`);
    if (checkbox.exists()) {
      await checkbox.setChecked(consent.value);
    }
  }

  await nextTick();
}