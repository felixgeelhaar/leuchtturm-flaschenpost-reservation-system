import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GDPRComplianceManager } from '@/lib/gdpr-compliance';
import type { ConsentData } from '@/types';

// Mock globals
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Test Browser)',
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});
global.fetch = vi.fn();

describe('GDPRComplianceManager', () => {
  const mockConsents: ConsentData = {
    essential: true,
    functional: false,
    analytics: true,
    marketing: false,
  };

  // Removed unused mockUser variable

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful fetch responses by default
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
      blob: () => Promise.resolve(new Blob(['test data'])),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Consent Management', () => {
    describe('recordConsent', () => {
      it('records consent successfully with default metadata', async () => {
        await GDPRComplianceManager.recordConsent('user-123', mockConsents);

        expect(global.fetch).toHaveBeenCalledWith('/api/gdpr/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"userId":"user-123"'),
        });

        const callArgs = (global.fetch as any).mock.calls[0][1];
        const bodyData = JSON.parse(callArgs.body);
        
        expect(bodyData.userId).toBe('user-123');
        expect(bodyData.consents).toEqual(mockConsents);
        expect(bodyData.version).toBe('1.0');
        expect(bodyData.timestamp).toBeDefined();
        expect(bodyData.userAgent).toBe('Mozilla/5.0 (Test Browser)');
      });

      it('records consent with custom metadata', async () => {
        const metadata = {
          ipAddress: '192.168.1.100',
          userAgent: 'Custom Agent',
          timestamp: '2024-01-01T00:00:00Z',
        };

        await GDPRComplianceManager.recordConsent('user-123', mockConsents, metadata);

        const callArgs = (global.fetch as any).mock.calls[0][1];
        const bodyData = JSON.parse(callArgs.body);
        
        expect(bodyData.ipAddress).toBe('192.168.1.100');
        expect(bodyData.userAgent).toBe('Custom Agent');
        expect(bodyData.timestamp).toBe('2024-01-01T00:00:00Z');
      });

      it('stores consent locally after successful API call', async () => {
        await GDPRComplianceManager.recordConsent('user-123', mockConsents);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'gdpr-consent', 
          expect.stringContaining('"essential":true'),
        );
      });

      it('throws error when API call fails', async () => {
        (global.fetch as any).mockResolvedValue({
          ok: false,
          status: 500,
        });

        await expect(
          GDPRComplianceManager.recordConsent('user-123', mockConsents),
        ).rejects.toThrow('Failed to record consent');
      });

      it('handles network errors gracefully', async () => {
        (global.fetch as any).mockRejectedValue(new Error('Network error'));

        await expect(
          GDPRComplianceManager.recordConsent('user-123', mockConsents),
        ).rejects.toThrow('Network error');
      });
    });

    describe('withdrawConsent', () => {
      it('withdraws consent successfully', async () => {
        await GDPRComplianceManager.withdrawConsent('user-123', 'marketing');

        expect(global.fetch).toHaveBeenCalledWith('/api/gdpr/consent/withdraw', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"consentType":"marketing"'),
        });
      });

      it('updates local consent after successful withdrawal', async () => {
        // Mock existing local consent
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
          consents: { ...mockConsents, marketing: true },
          version: '1.0',
          timestamp: new Date().toISOString(),
        }));

        await GDPRComplianceManager.withdrawConsent('user-123', 'marketing');

        const setItemCall = mockLocalStorage.setItem.mock.calls.find(
          call => call[0] === 'gdpr-consent',
        );
        expect(setItemCall).toBeDefined();
        
        const storedData = JSON.parse(setItemCall[1]);
        expect(storedData.consents.marketing).toBe(false);
      });

      it('handles withdrawal when no local consent exists', async () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        await expect(
          GDPRComplianceManager.withdrawConsent('user-123', 'analytics'),
        ).resolves.not.toThrow();
      });

      it('throws error when API call fails', async () => {
        (global.fetch as any).mockResolvedValue({
          ok: false,
          status: 500,
        });

        await expect(
          GDPRComplianceManager.withdrawConsent('user-123', 'functional'),
        ).rejects.toThrow('Failed to withdraw consent');
      });
    });
  });

  describe('Local Consent Storage', () => {
    describe('getLocalConsent', () => {
      it('returns valid consent from localStorage', () => {
        const storedConsent = {
          consents: mockConsents,
          version: '1.0',
          timestamp: new Date().toISOString(),
        };
        
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedConsent));

        const result = GDPRComplianceManager.getLocalConsent();
        expect(result).toEqual(mockConsents);
      });

      it('returns null when no consent is stored', () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        const result = GDPRComplianceManager.getLocalConsent();
        expect(result).toBeNull();
      });

      it('returns null and clears expired consent', () => {
        const expiredDate = new Date();
        expiredDate.setDate(expiredDate.getDate() - 400); // Over retention period
        
        const expiredConsent = {
          consents: mockConsents,
          version: '1.0',
          timestamp: expiredDate.toISOString(),
        };
        
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredConsent));

        const result = GDPRComplianceManager.getLocalConsent();
        
        expect(result).toBeNull();
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('gdpr-consent');
      });

      it('handles malformed JSON gracefully', () => {
        mockLocalStorage.getItem.mockReturnValue('invalid json');
        
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const result = GDPRComplianceManager.getLocalConsent();
        
        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('storeLocalConsent', () => {
      it('stores consent data with version and timestamp', () => {
        GDPRComplianceManager.storeLocalConsent(mockConsents);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'gdpr-consent',
          expect.stringContaining('"version":"1.0"'),
        );

        const storedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
        expect(storedData.consents).toEqual(mockConsents);
        expect(storedData.timestamp).toBeDefined();
      });

      it('handles localStorage errors gracefully', () => {
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        expect(() => {
          GDPRComplianceManager.storeLocalConsent(mockConsents);
        }).not.toThrow();
        
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('clearLocalConsent', () => {
      it('removes consent from localStorage', () => {
        GDPRComplianceManager.clearLocalConsent();
        
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('gdpr-consent');
      });

      it('handles localStorage errors gracefully', () => {
        mockLocalStorage.removeItem.mockImplementation(() => {
          throw new Error('Storage error');
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        expect(() => {
          GDPRComplianceManager.clearLocalConsent();
        }).not.toThrow();
        
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  });

  describe('Data Subject Rights', () => {
    describe('requestDataExport', () => {
      it('requests and returns data export blob', async () => {
        const mockBlob = new Blob(['user data export']);
        (global.fetch as any).mockResolvedValue({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
        });

        const result = await GDPRComplianceManager.requestDataExport('user-123');

        expect(global.fetch).toHaveBeenCalledWith('/api/gdpr/export-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"userId":"user-123"'),
        });

        expect(result).toBe(mockBlob);
      });

      it('throws error when export fails', async () => {
        (global.fetch as any).mockResolvedValue({
          ok: false,
          status: 500,
        });

        await expect(
          GDPRComplianceManager.requestDataExport('user-123'),
        ).rejects.toThrow('Failed to export data');
      });
    });

    describe('requestDataDeletion', () => {
      it('requests data deletion with default reason', async () => {
        await GDPRComplianceManager.requestDataDeletion('user-123');

        expect(global.fetch).toHaveBeenCalledWith('/api/gdpr/delete-data', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"reason":"user_request"'),
        });

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('gdpr-consent');
      });

      it('requests data deletion with custom reason', async () => {
        await GDPRComplianceManager.requestDataDeletion('user-123', 'account_closure');

        const callArgs = (global.fetch as any).mock.calls[0][1];
        const bodyData = JSON.parse(callArgs.body);
        
        expect(bodyData.reason).toBe('account_closure');
      });

      it('clears local data after successful deletion', async () => {
        // Mock clearLocalUserData method being called
        const clearUserDataSpy = vi.spyOn(GDPRComplianceManager, 'clearLocalUserData' as any)
          .mockImplementation(() => {});

        await GDPRComplianceManager.requestDataDeletion('user-123');

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('gdpr-consent');
        expect(clearUserDataSpy).toHaveBeenCalled();

        clearUserDataSpy.mockRestore();
      });

      it('throws error when deletion fails', async () => {
        (global.fetch as any).mockResolvedValue({
          ok: false,
          status: 500,
        });

        await expect(
          GDPRComplianceManager.requestDataDeletion('user-123'),
        ).rejects.toThrow('Failed to delete data');
      });
    });

    describe('requestDataRectification', () => {
      it('requests data rectification successfully', async () => {
        const updates = {
          firstName: 'Jane',
          lastName: 'Smith',
        };

        await GDPRComplianceManager.requestDataRectification('user-123', updates);

        expect(global.fetch).toHaveBeenCalledWith('/api/gdpr/rectify-data', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"firstName":"Jane"'),
        });
      });

      it('throws error when rectification fails', async () => {
        (global.fetch as any).mockResolvedValue({
          ok: false,
          status: 500,
        });

        await expect(
          GDPRComplianceManager.requestDataRectification('user-123', { firstName: 'Jane' }),
        ).rejects.toThrow('Failed to rectify data');
      });
    });
  });

  describe('Data Processing Logging', () => {
    describe('logDataProcessing', () => {
      it('logs data processing activity successfully', async () => {
        const logEntry = {
          userId: 'user-123',
          action: 'created' as const,
          dataType: 'user_data' as const,
          legalBasis: 'consent' as const,
          details: { field: 'email' },
        };

        await GDPRComplianceManager.logDataProcessing(logEntry);

        expect(global.fetch).toHaveBeenCalledWith('/api/gdpr/log-processing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"action":"created"'),
        });

        const callArgs = (global.fetch as any).mock.calls[0][1];
        const bodyData = JSON.parse(callArgs.body);
        
        expect(bodyData.timestamp).toBeDefined();
        expect(bodyData.userAgent).toBe('Mozilla/5.0 (Test Browser)');
        expect(bodyData.details).toBe('{"field":"email"}');
      });

      it('handles logging without optional fields', async () => {
        const logEntry = {
          action: 'accessed' as const,
          dataType: 'reservation' as const,
          legalBasis: 'legitimate_interest' as const,
        };

        await GDPRComplianceManager.logDataProcessing(logEntry);

        const callArgs = (global.fetch as any).mock.calls[0][1];
        const bodyData = JSON.parse(callArgs.body);
        
        expect(bodyData.userId).toBeUndefined();
        expect(bodyData.details).toBeNull();
      });

      it('continues silently when logging fails', async () => {
        (global.fetch as any).mockResolvedValue({
          ok: false,
          status: 500,
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(
          GDPRComplianceManager.logDataProcessing({
            action: 'created' as const,
            dataType: 'user_data' as const,
            legalBasis: 'consent' as const,
          }),
        ).resolves.not.toThrow();

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });

      it('handles network errors gracefully', async () => {
        (global.fetch as any).mockRejectedValue(new Error('Network error'));

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(
          GDPRComplianceManager.logDataProcessing({
            action: 'created' as const,
            dataType: 'user_data' as const,
            legalBasis: 'consent' as const,
          }),
        ).resolves.not.toThrow();

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  });

  describe('Utility Methods', () => {
    it('has proper consent version constant', () => {
      // Access private constant through reflection or test behavior
      const testConsent = { essential: true, functional: false, analytics: false, marketing: false };
      GDPRComplianceManager.storeLocalConsent(testConsent);
      
      const storedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(storedData.version).toBe('1.0');
    });

    it('uses proper retention period for consent validation', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() - 300); // Within retention period
      
      const recentConsent = {
        consents: mockConsents,
        version: '1.0',
        timestamp: futureDate.toISOString(),
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(recentConsent));

      const result = GDPRComplianceManager.getLocalConsent();
      expect(result).toEqual(mockConsents); // Should be valid
    });
  });
});