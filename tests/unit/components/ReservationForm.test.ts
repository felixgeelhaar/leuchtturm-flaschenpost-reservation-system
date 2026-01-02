import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ReservationForm from '@/components/ReservationForm.vue';
// Using inline test data instead of mock fixtures
const mockMagazines = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Flaschenpost',
    issueNumber: '2024-01',
    publishDate: '2024-01-01T00:00:00Z',
    description: 'Test Magazine',
    coverImageUrl: 'https://example.com/cover.jpg',
    availableCopies: 10,
    totalCopies: 100,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    title: 'Flaschenpost',
    issueNumber: '2024-02',
    publishDate: '2024-02-01T00:00:00Z',
    description: 'Test Magazine',
    coverImageUrl: 'https://example.com/cover2.jpg',
    availableCopies: 5,
    totalCopies: 100,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const validFormDataPickup = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  magazineId: '123e4567-e89b-12d3-a456-426614174000',
  quantity: 1,
  deliveryMethod: 'pickup',
  pickupLocation: '', // Pickup location is hardcoded in component
  consents: { essential: true },
};

const validFormDataShipping = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  magazineId: '123e4567-e89b-12d3-a456-426614174000',
  quantity: 1,
  deliveryMethod: 'shipping',
  paymentMethod: 'paypal',
  address: {
    street: 'Test Street',
    houseNumber: '123',
    postalCode: '10115',
    city: 'Berlin',
    country: 'DE',
  },
  consents: { essential: true },
};

const mockApiResponse = {
  success: true,
  data: {
    id: 'res-123',
    status: 'pending',
    expiresAt: '2024-12-31T00:00:00Z',
  },
  message: 'Reservierung erfolgreich erstellt!',
};

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
      // Phone field removed per user feedback
      expect(wrapper.find('select[id="magazineId"]').exists()).toBe(true);
      expect(wrapper.find('input[id="quantity"]').exists()).toBe(true);
      expect(wrapper.find('select[id="deliveryMethod"]').exists()).toBe(true);

      // Check consent checkbox (only essential is required)
      expect(wrapper.find('input[id="consent-essential"]').exists()).toBe(true);

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

      expect(wrapper.find('input[id="pickupLocation"]').exists()).toBe(true);
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
      const hasValidationErrors =
        wrapper.text().includes('mindestens') ||
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
      const hasEmailError =
        wrapper.text().includes('E-Mail') ||
        wrapper.text().includes('gültige') ||
        wrapper.find('.form-error').exists();
      expect(hasEmailError).toBe(true);
    });

    // Phone validation test removed - phone field no longer exists

    it('validates required consent', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Fill form with valid data except consent
      await fillValidForm(wrapper, {
        ...validFormDataPickup,
        consents: { essential: false },
      });

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      // Check that form was not submitted (no API call made)
      expect(fetch).not.toHaveBeenCalled();

      // Check form validation failed by checking formErrors in component
      const vm = wrapper.vm as any;
      const hasValidationErrors = Object.keys(vm.formErrors).length > 0;
      expect(hasValidationErrors).toBe(true);
    });

    it('validates pickup location when delivery method is pickup', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      await fillValidForm(wrapper, validFormDataPickup);

      // Pickup location is pre-filled and readonly, so it should be valid
      const pickupInput = wrapper.find('input[id="pickupLocation"]');
      expect(pickupInput.exists()).toBe(true);
      expect((pickupInput.element as HTMLInputElement).disabled).toBe(true);
      expect((pickupInput.element as HTMLInputElement).value).toContain(
        'Leuchtturm',
      );
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

      // Check that some validation error is shown
      const hasValidationError =
        wrapper.text().includes('Bitte füllen Sie alle Pflichtfelder aus') ||
        wrapper
          .text()
          .includes('Alle Adressfelder sind bei Versand erforderlich') ||
        wrapper.find('.form-field-error').exists() ||
        wrapper.find('.alert-error').exists();
      expect(hasValidationError).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('submits form with pickup data successfully', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Fill form manually for pickup
      await wrapper.find('#firstName').setValue('John');
      await wrapper.find('#lastName').setValue('Doe');
      await wrapper.find('#email').setValue('john@example.com');
      await wrapper
        .find('#magazineId')
        .setValue('123e4567-e89b-12d3-a456-426614174000');
      // Quantity is fixed to 1, skip setting it
      await wrapper.find('#deliveryMethod').setValue('pickup');
      await nextTick();

      // Pickup location is hardcoded and readonly, no date field needed
      await wrapper.find('#consent-essential').setValue(true);
      await nextTick();

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(fetch).toHaveBeenCalledWith('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: expect.stringContaining('"deliveryMethod":"pickup"'),
      });

      const requestBody = JSON.parse((fetch as any).mock.calls[0][1].body);
      expect(requestBody.deliveryMethod).toBe('pickup');
    });

    it('submits form with shipping data successfully', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Fill form manually for shipping
      await wrapper.find('#firstName').setValue('Anna');
      await wrapper.find('#lastName').setValue('Schmidt');
      await wrapper.find('#email').setValue('anna@example.com');
      // Phone field removed
      await wrapper
        .find('#magazineId')
        .setValue('123e4567-e89b-12d3-a456-426614174000');
      // Quantity is fixed to 1, skip setting it
      await wrapper.find('#deliveryMethod').setValue('shipping');
      await nextTick();

      // Fill address fields
      await wrapper.find('#street').setValue('Musterstraße');
      await wrapper.find('#houseNumber').setValue('123');
      await wrapper.find('#postalCode').setValue('10115');
      await wrapper.find('#city').setValue('Berlin');
      await wrapper.find('#country').setValue('DE');
      await wrapper.find('#consent-essential').setValue(true);
      await nextTick();

      // Add payment method for shipping
      await wrapper.find('#paymentMethod').setValue('paypal');
      await nextTick();

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

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
      // Mock fetch to return an error response
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Validation failed',
            errors: [{ field: 'email', message: 'Invalid email' }],
          }),
      });

      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Fill form with valid data
      await wrapper.find('#firstName').setValue('John');
      await wrapper.find('#lastName').setValue('Doe');
      await wrapper.find('#email').setValue('john@example.com');
      await wrapper
        .find('#magazineId')
        .setValue('123e4567-e89b-12d3-a456-426614174000');
      await wrapper.find('#deliveryMethod').setValue('pickup');
      await nextTick();

      // Pickup location is hardcoded and readonly, no date field needed
      await wrapper.find('#consent-essential').setValue(true);
      await nextTick();

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Check that error message is displayed
      const errorMessage = wrapper.find('.alert-error');
      expect(errorMessage.exists()).toBe(true);
      expect(errorMessage.text()).toContain('Fehler bei der Reservierung');
    });

    it('shows loading state during submission', async () => {
      // Mock fetch with a delay to catch loading state
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as any).mockReturnValue(fetchPromise);

      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Fill form with valid data
      await wrapper.find('#firstName').setValue('John');
      await wrapper.find('#lastName').setValue('Doe');
      await wrapper.find('#email').setValue('john@example.com');
      await wrapper
        .find('#magazineId')
        .setValue('123e4567-e89b-12d3-a456-426614174000');
      await wrapper.find('#deliveryMethod').setValue('pickup');
      await nextTick();

      // Pickup location is hardcoded and readonly, no date field needed
      await wrapper.find('#consent-essential').setValue(true);
      await nextTick();

      const form = wrapper.find('form');
      const submitButton = wrapper.find('button[type="submit"]');

      // Submit form
      await form.trigger('submit.prevent');
      await nextTick();

      // Check loading state is active
      expect(submitButton.attributes('disabled')).toBeDefined();
      expect(submitButton.text()).toContain('Wird verarbeitet');

      // Resolve the promise to complete submission
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      // Wait for state to update
      await new Promise((resolve) => setTimeout(resolve, 10));
      await nextTick();

      // Loading state should be cleared
      expect(submitButton.attributes('disabled')).toBeUndefined();
      expect(submitButton.text()).not.toContain('Wird verarbeitet');
    });
  });

  describe('Delivery Method Switching', () => {
    it('clears pickup location when switching to shipping', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Start with pickup method (default)
      expect(wrapper.vm.formData.deliveryMethod).toBe('pickup');

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
      expect((newStreetInput.element as HTMLInputElement).value).toBe('');
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

      expect((firstNameInput.element as HTMLInputElement).value).toBe('');
      expect((emailInput.element as HTMLInputElement).value).toBe('');
      expect((essentialConsent.element as HTMLInputElement).checked).toBe(
        false,
      );
    });
  });

  describe('Magazine Selection', () => {
    it('quantity is fixed to 1 exemplar per family', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Select first magazine (95 available)
      const magazineSelect = wrapper.find('select[id="magazineId"]');
      await magazineSelect.setValue(mockMagazines[0].id);
      await nextTick();

      const quantityInput = wrapper.find('input[id="quantity"]');

      // Quantity should be fixed to 1 exemplar and disabled
      expect((quantityInput.element as HTMLInputElement).disabled).toBe(true);
      expect((quantityInput.element as HTMLInputElement).value).toBe(
        '1 Exemplar',
      );
    });

    it('shows magazine details when selected', async () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      const magazineSelect = wrapper.find('select[id="magazineId"]');
      await magazineSelect.setValue(mockMagazines[0].id);
      await nextTick();

      expect(wrapper.text()).toContain(mockMagazines[0].title);
      // Check that the magazine was selected
      expect((magazineSelect.element as HTMLSelectElement).value).toBe(
        mockMagazines[0].id,
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and ARIA attributes', () => {
      const wrapper = mount(ReservationForm, {
        props: { magazines: mockMagazines },
      });

      // Check that form fields have labels
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
    // Phone field removed per user feedback
    { selector: 'select[id="magazineId"]', value: formData.magazineId },
    // Quantity is disabled input field, skip setting it
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
  if (formData.deliveryMethod === 'pickup') {
    await nextTick(); // Wait for pickup fields to appear
    // Pickup location is readonly/disabled, no need to set it
  }

  if (formData.deliveryMethod === 'shipping' && formData.address) {
    await nextTick(); // Wait for address fields to appear
    const addressFields = [
      { selector: 'input[id="street"]', value: formData.address.street },
      {
        selector: 'input[id="houseNumber"]',
        value: formData.address.houseNumber,
      },
      {
        selector: 'input[id="postalCode"]',
        value: formData.address.postalCode,
      },
      { selector: 'input[id="city"]', value: formData.address.city },
      { selector: 'select[id="country"]', value: formData.address.country },
      {
        selector: 'input[id="addressLine2"]',
        value: formData.address.addressLine2 || '',
      },
    ];

    for (const field of addressFields) {
      const element = wrapper.find(field.selector);
      if (element.exists()) {
        await element.setValue(field.value);
      }
    }
  }

  // Handle paymentMethod for shipping
  if (formData.deliveryMethod === 'shipping' && formData.paymentMethod) {
    const paymentSelect = wrapper.find('select[id="paymentMethod"]');
    if (paymentSelect.exists()) {
      await paymentSelect.setValue(formData.paymentMethod);
    }
  }

  // Handle consents (only essential consent exists in component)
  if (formData.consents && formData.consents.essential !== undefined) {
    const essentialCheckbox = wrapper.find('input[id="consent-essential"]');
    if (essentialCheckbox.exists()) {
      await essentialCheckbox.setChecked(formData.consents.essential);
    }
  }

  await nextTick();
}
