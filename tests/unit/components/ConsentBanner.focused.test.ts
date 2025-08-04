import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { mountComponent } from '../../helpers/vue-test-utils';
import ConsentBanner from '@/components/ConsentBanner.vue';
import type { ConsentData } from '@/types';

// Mock fetch globally
global.fetch = vi.fn();

// Mock gtag global function
global.gtag = vi.fn();

describe('ConsentBanner Component - Focused Tests', () => {
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Reset DOM classes
    document.body.className = '';
    
    // Mock successful fetch
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render banner when no consent is saved', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner);
      
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
      expect(wrapper.text()).toContain('Cookies und Datenschutz');
      expect(wrapper.text()).toContain('Wir verwenden Cookies');
    });

    it('should not render banner when consent exists and is valid', async () => {
      const validConsent = {
        consents: {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false
        },
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(validConsent));

      const wrapper = mountComponent(ConsentBanner);
      await nextTick();
      
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
      expect(wrapper.vm.hasConsent).toBe(true);
    });

    it('should render banner when consent is expired', () => {
      const expiredConsent = {
        consents: {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false
        },
        timestamp: new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString(), // Over 1 year ago
        version: '1.0'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredConsent));

      const wrapper = mountComponent(ConsentBanner);
      
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cookie-consent');
    });
  });

  describe('Consent Actions', () => {
    it('should accept all cookies when "Alle akzeptieren" is clicked', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner);
      
      const buttons = wrapper.findAll('button');
      const acceptAllButton = buttons.find(btn => btn.text().includes('Alle akzeptieren'));
      expect(acceptAllButton).toBeTruthy();
      
      if (acceptAllButton) {
        await acceptAllButton.trigger('click');
        await nextTick();
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'cookie-consent',
          expect.stringContaining('"essential":true,"functional":true,"analytics":true,"marketing":true')
        );
        
        expect(wrapper.emitted('accept')).toBeTruthy();
        const emittedConsent = wrapper.emitted('accept')![0][0] as ConsentData;
        expect(emittedConsent.essential).toBe(true);
        expect(emittedConsent.functional).toBe(true);
        expect(emittedConsent.analytics).toBe(true);
        expect(emittedConsent.marketing).toBe(true);
      }
    });

    it('should accept only necessary cookies when "Nur notwendige" is clicked', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner);
      
      const buttons = wrapper.findAll('button');
      const necessaryButton = buttons.find(btn => btn.text().includes('Nur notwendige'));
      expect(necessaryButton).toBeTruthy();
      
      if (necessaryButton) {
        await necessaryButton.trigger('click');
        await nextTick();
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'cookie-consent',
          expect.stringContaining('"essential":true,"functional":false,"analytics":false,"marketing":false')
        );
        
        expect(wrapper.emitted('accept')).toBeTruthy();
        const emittedConsent = wrapper.emitted('accept')![0][0] as ConsentData;
        expect(emittedConsent.essential).toBe(true);
        expect(emittedConsent.functional).toBe(false);
        expect(emittedConsent.analytics).toBe(false);
        expect(emittedConsent.marketing).toBe(false);
      }
    });

    it('should open detailed settings when "Einstellungen" is clicked', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner);
      
      const buttons = wrapper.findAll('button');
      const settingsButton = buttons.find(btn => btn.text().includes('Einstellungen'));
      expect(settingsButton).toBeTruthy();
      
      if (settingsButton) {
        await settingsButton.trigger('click');
        await nextTick();
        
        expect(wrapper.vm.showDetailedSettings).toBe(true);
      }
    });
  });

  describe('Local Storage Management', () => {
    it('should save consent with correct format', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner);
      
      const buttons = wrapper.findAll('button');
      const acceptAllButton = buttons.find(btn => btn.text().includes('Alle akzeptieren'));
      
      if (acceptAllButton) {
        await acceptAllButton.trigger('click');
        await nextTick();
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'cookie-consent',
          expect.stringMatching(/\{"consents":\{.*\},"timestamp":".*","version":"1\.0"\}/)
        );
      }
    });

    it('should load saved consent on mount', () => {
      const savedConsent = {
        consents: {
          essential: true,
          functional: true,
          analytics: false,
          marketing: true
        },
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedConsent));

      const wrapper = mountComponent(ConsentBanner);
      
      expect(wrapper.vm.hasConsent).toBe(true);
      expect(wrapper.vm.detailedConsents.functional).toBe(true);
      expect(wrapper.vm.detailedConsents.analytics).toBe(false);
      expect(wrapper.vm.detailedConsents.marketing).toBe(true);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const wrapper = mountComponent(ConsentBanner);
      
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load saved consent:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Consent Application', () => {
    it('should apply functional cookie settings', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner);
      
      // Test enabling functional cookies
      wrapper.vm.applyConsentSettings({
        essential: true,
        functional: true,
        analytics: false,
        marketing: false
      });
      
      expect(document.body.classList.contains('functional-cookies-enabled')).toBe(true);
      
      // Test disabling functional cookies
      wrapper.vm.applyConsentSettings({
        essential: true,
        functional: false,
        analytics: false,
        marketing: false
      });
      
      expect(document.body.classList.contains('functional-cookies-enabled')).toBe(false);
    });

    it('should call gtag for analytics consent', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner);
      
      wrapper.vm.applyConsentSettings({
        essential: true,
        functional: false,
        analytics: true,
        marketing: false
      });
      
      expect(global.gtag).toHaveBeenCalledWith('consent', 'update', {
        analytics_storage: 'granted'
      });
    });

    it('should call gtag for marketing consent', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner);
      
      wrapper.vm.applyConsentSettings({
        essential: true,
        functional: false,
        analytics: false,
        marketing: true
      });
      
      expect(global.gtag).toHaveBeenCalledWith('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted'
      });
    });

    it('should handle missing gtag gracefully', () => {
      delete (global as any).gtag;
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner);
      
      expect(() => {
        wrapper.vm.applyConsentSettings({
          essential: true,
          functional: false,
          analytics: true,
          marketing: true
        });
      }).not.toThrow();
    });
  });

  describe('Server Communication', () => {
    it('should send consent to server', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner);
      
      const buttons = wrapper.findAll('button');
      const acceptAllButton = buttons.find(btn => btn.text().includes('Alle akzeptieren'));
      
      if (acceptAllButton) {
        await acceptAllButton.trigger('click');
        await nextTick();
        
        expect(global.fetch).toHaveBeenCalledWith('/api/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"consents"')
        });
      }
    });

    it('should handle server errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Server error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner);
      
      const buttons = wrapper.findAll('button');
      const acceptAllButton = buttons.find(btn => btn.text().includes('Alle akzeptieren'));
      
      if (acceptAllButton) {
        await acceptAllButton.trigger('click');
        await nextTick();
        
        // Should still save to localStorage even if server fails
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to save consent to server:',
          expect.any(Error)
        );
      }

      consoleSpy.mockRestore();
    });
  });

  describe('Consent Revocation', () => {
    it('should revoke consent and reset to defaults', () => {
      const validConsent = {
        consents: {
          essential: true,
          functional: true,
          analytics: true,
          marketing: true
        },
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(validConsent));

      const wrapper = mountComponent(ConsentBanner);
      
      wrapper.vm.revokeConsent();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cookie-consent');
      expect(wrapper.vm.hasConsent).toBe(false);
      expect(wrapper.vm.detailedConsents).toEqual({
        essential: true,
        functional: false,
        analytics: false,
        marketing: false
      });
      expect(wrapper.emitted('decline')).toBeTruthy();
    });
  });

  describe('Props and Visibility', () => {
    it('should respect isVisible prop', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner, {
        props: { isVisible: false }
      });
      
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    });

    it('should show banner when isVisible is true and no consent', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner, {
        props: { isVisible: true }
      });
      
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for banner', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner);
      
      const banner = wrapper.find('[role="dialog"]');
      expect(banner.attributes('role')).toBe('dialog');
      expect(banner.attributes('aria-labelledby')).toBe('consent-banner-title');
      expect(banner.attributes('aria-describedby')).toBe('consent-banner-description');
    });

    it('should provide external link security attributes', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner);
      
      const externalLinks = wrapper.findAll('a[target="_blank"]');
      externalLinks.forEach(link => {
        expect(link.attributes('rel')).toContain('noopener');
        expect(link.attributes('rel')).toContain('noreferrer');
      });
    });
  });

  describe('Component API', () => {
    it('should expose required methods and properties', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner);
      
      expect(wrapper.vm.revokeConsent).toBeDefined();
      expect(wrapper.vm.hasConsent).toBeDefined();
      expect(wrapper.vm.showSettings).toBeDefined();
    });

    it('should allow external triggering of settings modal', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = mountComponent(ConsentBanner);
      
      wrapper.vm.showSettings();
      await nextTick();
      
      expect(wrapper.vm.showDetailedSettings).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const wrapper = mountComponent(ConsentBanner);
      
      const buttons = wrapper.findAll('button');
      const acceptAllButton = buttons.find(btn => btn.text().includes('Alle akzeptieren'));
      
      if (acceptAllButton) {
        await acceptAllButton.trigger('click');
        await nextTick();
        
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to save consent:',
          expect.any(Error)
        );
      }

      consoleSpy.mockRestore();
    });

    it('should handle missing consent properties gracefully', () => {
      const incompleteConsent = {
        timestamp: new Date().toISOString(),
        version: '1.0'
        // Missing consents property
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(incompleteConsent));

      const wrapper = mountComponent(ConsentBanner);
      
      // Should render banner when consent data is incomplete
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    });
  });

  describe('Cookie Settings Link', () => {
    it('should show cookie settings link when consent has been given', async () => {
      const validConsent = {
        consents: {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false
        },
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(validConsent));

      const wrapper = mountComponent(ConsentBanner);
      await nextTick();
      
      // Should show settings link
      const settingsLink = wrapper.find('button').element;
      expect(settingsLink.textContent).toContain('Cookie-Einstellungen');
    });
  });
});