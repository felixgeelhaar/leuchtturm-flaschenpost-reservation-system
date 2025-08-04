import { mount, VueWrapper, MountingOptions } from '@vue/test-utils';
import { Component } from 'vue';
import { vi } from 'vitest';

/**
 * Enhanced Vue Test Utils helpers for the reservation system
 */

// Default global configuration for Vue components
export const defaultMountOptions: MountingOptions<any> = {
  global: {
    stubs: {
      // Stub Heroicons to prevent import issues
      CheckCircleIcon: { template: '<div data-testid="check-circle-icon"></div>' },
      ExclamationTriangleIcon: { template: '<div data-testid="exclamation-triangle-icon"></div>' },
      XMarkIcon: { template: '<div data-testid="x-mark-icon"></div>' },
      InformationCircleIcon: { template: '<div data-testid="information-circle-icon"></div>' }
    },
    mocks: {
      // Mock common browser APIs
      $router: {
        push: vi.fn(),
        replace: vi.fn(),
        go: vi.fn(),
        back: vi.fn(),
        forward: vi.fn()
      },
      $route: {
        path: '/',
        query: {},
        params: {},
        name: 'home'
      }
    }
  }
};

/**
 * Enhanced mount function with default options
 */
export function mountComponent<T extends Component>(
  component: T,
  options: MountingOptions<any> = {}
): VueWrapper<any> {
  const mergedOptions = {
    ...defaultMountOptions,
    ...options,
    global: {
      ...defaultMountOptions.global,
      ...options.global,
      stubs: {
        ...defaultMountOptions.global?.stubs,
        ...options.global?.stubs
      },
      mocks: {
        ...defaultMountOptions.global?.mocks,
        ...options.global?.mocks
      }
    }
  };

  return mount(component, mergedOptions);
}

/**
 * Helper to create mock props for components
 */
export function createMockProps<T extends Record<string, any>>(
  defaultProps: T,
  overrides: Partial<T> = {}
): T {
  return { ...defaultProps, ...overrides };
}

/**
 * Helper to trigger form submission events
 */
export async function submitForm(wrapper: VueWrapper<any>, formSelector = 'form') {
  const form = wrapper.find(formSelector);
  await form.trigger('submit.prevent');
  await wrapper.vm.$nextTick();
}

/**
 * Helper to fill form fields
 */
export async function fillFormField(
  wrapper: VueWrapper<any>,
  selector: string,
  value: string | number | boolean
) {
  const field = wrapper.find(selector);
  
  if (field.element.tagName === 'INPUT') {
    const input = field.element as HTMLInputElement;
    
    if (input.type === 'checkbox' || input.type === 'radio') {
      await field.setChecked(value as boolean);
    } else {
      await field.setValue(value);
    }
  } else if (field.element.tagName === 'SELECT') {
    await field.setValue(value);
  } else if (field.element.tagName === 'TEXTAREA') {
    await field.setValue(value);
  }
  
  await wrapper.vm.$nextTick();
}

/**
 * Helper to fill multiple form fields at once
 */
export async function fillFormFields(
  wrapper: VueWrapper<any>,
  fields: Record<string, string | number | boolean>
) {
  for (const [selector, value] of Object.entries(fields)) {
    await fillFormField(wrapper, selector, value);
  }
}

/**
 * Helper to wait for Vue's reactive updates
 */
export async function waitForReactivity(wrapper: VueWrapper<any>, timeout = 1000) {
  await wrapper.vm.$nextTick();
  
  // Wait for any async operations to complete
  await new Promise(resolve => {
    const start = Date.now();
    const check = () => {
      if (Date.now() - start > timeout) {
        resolve(void 0);
        return;
      }
      
      wrapper.vm.$nextTick().then(() => {
        setTimeout(check, 10);
      });
    };
    check();
  });
}

/**
 * Helper to simulate user typing with delays
 */
export async function typeInField(
  wrapper: VueWrapper<any>,
  selector: string,
  text: string,
  delay = 50
) {
  const field = wrapper.find(selector);
  
  for (let i = 0; i <= text.length; i++) {
    await field.setValue(text.substring(0, i));
    await wrapper.vm.$nextTick();
    
    if (delay > 0 && i < text.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Helper to check for validation errors
 */
export function expectValidationError(
  wrapper: VueWrapper<any>,
  fieldName: string,
  errorMessage?: string
) {
  const errorElement = wrapper.find(`[data-testid="${fieldName}-error"]`);
  
  expect(errorElement.exists()).toBe(true);
  expect(errorElement.isVisible()).toBe(true);
  
  if (errorMessage) {
    expect(errorElement.text()).toContain(errorMessage);
  }
}

/**
 * Helper to check that no validation errors are present
 */
export function expectNoValidationErrors(wrapper: VueWrapper<any>) {
  const errorElements = wrapper.findAll('[data-testid$="-error"]');
  
  errorElements.forEach(error => {
    expect(error.text()).toBe('');
  });
}

/**
 * Helper to mock fetch responses for components that make API calls
 */
export function mockFetchResponse(data: any, status = 200, ok = true) {
  const mockResponse = {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data))
  };
  
  (global.fetch as any).mockResolvedValueOnce(mockResponse);
  
  return mockResponse;
}

/**
 * Helper to mock fetch errors
 */
export function mockFetchError(error: Error) {
  (global.fetch as any).mockRejectedValueOnce(error);
}

/**
 * Helper to create form data objects for testing
 */
export function createFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  });
  
  return formData;
}

/**
 * Helper to test component accessibility
 */
export function expectAccessibleForm(wrapper: VueWrapper<any>) {
  // Check that all form fields have associated labels
  const inputs = wrapper.findAll('input, select, textarea');
  
  inputs.forEach(input => {
    const id = input.attributes('id');
    if (id) {
      const label = wrapper.find(`label[for="${id}"]`);
      expect(label.exists()).toBe(true);
    }
  });
  
  // Check that required fields are properly marked
  const requiredInputs = wrapper.findAll('input[required], select[required], textarea[required]');
  
  requiredInputs.forEach(input => {
    const id = input.attributes('id');
    if (id) {
      const label = wrapper.find(`label[for="${id}"]`);
      // Should have some indication of being required (*, aria-required, etc.)
      expect(
        label.text().includes('*') || 
        input.attributes('aria-required') === 'true' ||
        label.classes().some(cls => cls.includes('required'))
      ).toBe(true);
    }
  });
}

/**
 * Helper to test loading states
 */
export async function expectLoadingState(
  wrapper: VueWrapper<any>,
  loadingSelector = '[data-testid="loading"]',
  action?: () => Promise<void>
) {
  if (action) {
    const actionPromise = action();
    
    // Check loading state is visible
    expect(wrapper.find(loadingSelector).exists()).toBe(true);
    
    await actionPromise;
    await waitForReactivity(wrapper);
    
    // Check loading state is hidden
    expect(wrapper.find(loadingSelector).exists()).toBe(false);
  } else {
    expect(wrapper.find(loadingSelector).exists()).toBe(true);
  }
}

/**
 * Helper to test error states
 */
export function expectErrorState(
  wrapper: VueWrapper<any>,
  errorMessage: string,
  errorSelector = '[data-testid="error-message"]'
) {
  const errorElement = wrapper.find(errorSelector);
  
  expect(errorElement.exists()).toBe(true);
  expect(errorElement.isVisible()).toBe(true);
  expect(errorElement.text()).toContain(errorMessage);
}

/**
 * Helper to test success states
 */
export function expectSuccessState(
  wrapper: VueWrapper<any>,
  successMessage: string,
  successSelector = '[data-testid="success-message"]'
) {
  const successElement = wrapper.find(successSelector);
  
  expect(successElement.exists()).toBe(true);
  expect(successElement.isVisible()).toBe(true);
  expect(successElement.text()).toContain(successMessage);
}

/**
 * Helper to debug component state
 */
export function debugComponent(wrapper: VueWrapper<any>) {
  console.log('Component HTML:', wrapper.html());
  console.log('Component Data:', wrapper.vm.$data);
  console.log('Component Props:', wrapper.props());
}

/**
 * Helper to create mock event objects
 */
export function createMockEvent(type: string, properties: Record<string, any> = {}) {
  return {
    type,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: { value: '' },
    ...properties
  };
}