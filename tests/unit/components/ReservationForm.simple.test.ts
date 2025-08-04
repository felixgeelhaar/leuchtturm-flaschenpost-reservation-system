import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ReservationForm from '@/components/ReservationForm.vue';

// Mock fetch globally
global.fetch = vi.fn();

describe('ReservationForm - Simple Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { id: 'test-123' }
      }),
    });
  });

  it('renders the form', () => {
    const wrapper = mount(ReservationForm, {
      props: { magazines: [] }
    });
    
    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('h2').text()).toContain('Flaschenpost Magazin reservieren');
  });

  it('has all required form fields', () => {
    const wrapper = mount(ReservationForm, {
      props: { magazines: [] }
    });
    
    expect(wrapper.find('#firstName').exists()).toBe(true);
    expect(wrapper.find('#lastName').exists()).toBe(true);
    expect(wrapper.find('#email').exists()).toBe(true);
    expect(wrapper.find('#magazineId').exists()).toBe(true);
    expect(wrapper.find('#quantity').exists()).toBe(true);
    expect(wrapper.find('#deliveryMethod').exists()).toBe(true);
  });

  it('shows pickup fields when delivery method is pickup', async () => {
    const wrapper = mount(ReservationForm, {
      props: { magazines: [] }
    });
    
    // Ensure pickup is selected
    await wrapper.find('#deliveryMethod').setValue('pickup');
    
    expect(wrapper.find('#pickupLocation').exists()).toBe(true);
    expect(wrapper.find('#pickupDate').exists()).toBe(true);
  });

  it('shows address fields when delivery method is shipping', async () => {
    const wrapper = mount(ReservationForm, {
      props: { magazines: [] }
    });
    
    await wrapper.find('#deliveryMethod').setValue('shipping');
    
    expect(wrapper.find('#street').exists()).toBe(true);
    expect(wrapper.find('#houseNumber').exists()).toBe(true);
    expect(wrapper.find('#postalCode').exists()).toBe(true);
    expect(wrapper.find('#city').exists()).toBe(true);
  });

  it('has consent checkboxes', () => {
    const wrapper = mount(ReservationForm, {
      props: { magazines: [] }
    });
    
    expect(wrapper.find('#consent-essential').exists()).toBe(true);
    expect(wrapper.find('#consent-functional').exists()).toBe(true);
    expect(wrapper.find('#consent-analytics').exists()).toBe(true);
    expect(wrapper.find('#consent-marketing').exists()).toBe(true);
  });

  it('has submit and reset buttons', () => {
    const wrapper = mount(ReservationForm, {
      props: { magazines: [] }
    });
    
    const buttons = wrapper.findAll('button');
    const submitButton = buttons.find(b => b.text().includes('Reservierung absenden'));
    const resetButton = buttons.find(b => b.text().includes('Zurücksetzen'));
    
    expect(submitButton?.exists()).toBe(true);
    expect(resetButton?.exists()).toBe(true);
  });

  it('updates form data when fields change', async () => {
    const wrapper = mount(ReservationForm, {
      props: { magazines: [] },
      attachTo: document.body
    });
    
    // Wait for component to mount
    await wrapper.vm.$nextTick();
    
    await wrapper.find('#firstName').setValue('John');
    await wrapper.find('#lastName').setValue('Doe');
    await wrapper.find('#email').setValue('john@example.com');
    
    expect((wrapper.find('#firstName').element as HTMLInputElement).value).toBe('John');
    expect((wrapper.find('#lastName').element as HTMLInputElement).value).toBe('Doe');
    expect((wrapper.find('#email').element as HTMLInputElement).value).toBe('john@example.com');
    
    wrapper.unmount();
  });

  it('can select quantity', async () => {
    const wrapper = mount(ReservationForm, {
      props: { 
        magazines: [{
          id: 'test-mag',
          title: 'Test Magazine',
          issueNumber: '2024-01',
          availableCopies: 10,
          totalCopies: 100,
          description: 'Test',
          coverImageUrl: '',
          releaseDate: new Date().toISOString(),
          reservationStartDate: new Date().toISOString(),
          reservationEndDate: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]
      }
    });
    
    // Select a magazine first
    await wrapper.find('#magazineId').setValue('test-mag');
    await wrapper.vm.$nextTick();
    
    const quantitySelect = wrapper.find('#quantity');
    await quantitySelect.setValue('2');
    
    expect((quantitySelect.element as HTMLSelectElement).value).toBe('2');
  });

  it('shows notes textarea', () => {
    const wrapper = mount(ReservationForm, {
      props: { magazines: [] }
    });
    
    const notes = wrapper.find('#notes');
    expect(notes.exists()).toBe(true);
    expect(notes.element.tagName).toBe('TEXTAREA');
  });

  it('essential consent is unchecked by default', () => {
    const wrapper = mount(ReservationForm, {
      props: { magazines: [] }
    });
    
    const essentialConsent = wrapper.find('#consent-essential');
    expect((essentialConsent.element as HTMLInputElement).checked).toBe(false);
  });
});