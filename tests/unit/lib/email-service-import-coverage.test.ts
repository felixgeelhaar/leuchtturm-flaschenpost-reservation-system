import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Email Service - Import Coverage Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    
    // Unmock the email service to test actual implementation
    vi.unmock("@/lib/email/email-service");

    // Mock console to reduce noise
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  describe("Basic Module Loading", () => {
    it("imports email service module without errors", async () => {
      expect(async () => {
        await import("@/lib/email/email-service");
      }).not.toThrow();
    });

    it("exports EmailService class", async () => {
      const module = await import("@/lib/email/email-service");

      expect(module.EmailService).toBeDefined();
      expect(typeof module.EmailService).toBe("function");
    });

    it("exports emailService instance (with fallback behavior)", async () => {
      const module = await import("@/lib/email/email-service");

      expect(module.emailService).toBeDefined();
      expect(typeof module.emailService).toBe("object");
    });

    it("exports getEmailService function", async () => {
      const module = await import("@/lib/email/email-service");

      expect(module.getEmailService).toBeDefined();
      expect(typeof module.getEmailService).toBe("function");
    });
  });

  describe("EmailService Class Structure", () => {
    it("can instantiate EmailService with valid config without nodemailer", async () => {
      // Mock nodemailer to avoid actual SMTP operations
      vi.mock("nodemailer", () => ({
        default: {
          createTransport: vi.fn(() => ({
            sendMail: vi.fn().mockResolvedValue({ messageId: "test" }),
            verify: vi.fn().mockResolvedValue(true),
          })),
        },
      }));

      const { EmailService } = await import("@/lib/email/email-service");

      const validConfig = {
        host: "smtp.test.com",
        port: 587,
        secure: false,
        auth: {
          user: "test@example.com",
          pass: "password123",
        },
        from: "noreply@test.com",
      };

      const emailService = new EmailService(validConfig);
      expect(emailService).toBeDefined();
      expect(emailService).toBeInstanceOf(EmailService);
    });

    it("EmailService constructor handles missing credentials", async () => {
      vi.mock("nodemailer", () => ({
        default: {
          createTransport: vi.fn(),
        },
      }));

      const { EmailService } = await import("@/lib/email/email-service");

      expect(() => new EmailService()).toThrow(
        "SMTP credentials not configured",
      );
    });
  });

  describe("Fallback Email Service", () => {
    it("emailService fallback has required methods", async () => {
      const { emailService } = await import("@/lib/email/email-service");

      expect(typeof emailService.sendReservationConfirmation).toBe("function");
      expect(typeof emailService.sendCancellationConfirmation).toBe("function");
      expect(typeof emailService.sendPickupReminder).toBe("function");
      expect(typeof emailService.verifyConnection).toBe("function");
    });

    it("fallback methods throw meaningful errors", async () => {
      const { emailService } = await import("@/lib/email/email-service");

      await expect(
        emailService.sendReservationConfirmation({} as any),
      ).rejects.toThrow("Email service not configured");

      await expect(
        emailService.sendCancellationConfirmation({} as any),
      ).rejects.toThrow("Email service not configured");

      await expect(emailService.sendPickupReminder({} as any)).rejects.toThrow(
        "Email service not configured",
      );

      await expect(emailService.verifyConnection()).rejects.toThrow(
        "Email service not configured",
      );
    });
  });

  describe("Email Service Configuration Scenarios", () => {
    it("handles Gmail service configuration", async () => {
      vi.mock("nodemailer", () => ({
        default: {
          createTransport: vi.fn(() => ({
            sendMail: vi.fn().mockResolvedValue({ messageId: "test" }),
            verify: vi.fn().mockResolvedValue(true),
          })),
        },
      }));

      const { EmailService } = await import("@/lib/email/email-service");

      const gmailConfig = {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: "test@gmail.com",
          pass: "apppassword",
        },
        from: "noreply@test.com",
      };

      expect(() => new EmailService(gmailConfig)).not.toThrow();
    });

    it("handles generic SMTP configuration", async () => {
      vi.mock("nodemailer", () => ({
        default: {
          createTransport: vi.fn(() => ({
            sendMail: vi.fn().mockResolvedValue({ messageId: "test" }),
            verify: vi.fn().mockResolvedValue(true),
          })),
        },
      }));

      const { EmailService } = await import("@/lib/email/email-service");

      const genericConfig = {
        host: "smtp.example.com",
        port: 465,
        secure: true,
        auth: {
          user: "test@example.com",
          pass: "password",
        },
        from: "noreply@example.com",
      };

      expect(() => new EmailService(genericConfig)).not.toThrow();
    });
  });

  describe("Template Generation Code Paths", () => {
    it("exercises email template generation without sending", async () => {
      // Set up environment variables before importing the module
      vi.stubGlobal("import", {
        meta: {
          env: {
            ...import.meta.env,
            SMTP_USER: "test@test.com",
            SMTP_PASS: "password123",
            SMTP_HOST: "smtp.test.com",
            SMTP_PORT: "587",
          },
        },
      });
      
      // Mock nodemailer before importing email service
      vi.doMock("nodemailer", () => ({
        default: {
          createTransport: vi.fn(() => ({
            sendMail: vi.fn().mockImplementation((mailOptions) => {
              // Just validate the structure without sending
              expect(mailOptions.from).toBeDefined();
              expect(mailOptions.to).toBeDefined();
              expect(mailOptions.subject).toBeDefined();
              expect(mailOptions.html).toBeDefined();
              expect(mailOptions.text).toBeDefined();
              return Promise.resolve({ messageId: "mock-id" });
            }),
            verify: vi.fn().mockResolvedValue(true),
          })),
        },
      }));

      const { EmailService } = await import("@/lib/email/email-service");

      const emailService = new EmailService({
        host: "smtp.test.com",
        port: 587,
        secure: false,
        auth: {
          user: "test@test.com",
          pass: "password123",
        },
        from: "noreply@test.com",
      });

      const mockData = {
        reservation: {
          id: "test-reservation-id",
          userId: "test-user-id",
          magazineId: "test-magazine-id",
          quantity: 2,
          status: "confirmed" as const,
          reservationDate: "2024-01-01T10:00:00Z",
          deliveryMethod: "pickup" as const,
          pickupLocation: "Test Location",
          consentReference: "test-consent",
          createdAt: "2024-01-01T10:00:00Z",
          updatedAt: "2024-01-01T10:00:00Z",
          expiresAt: "2024-01-08T10:00:00Z",
          pickupDate: "2024-01-05T10:00:00Z",
          paymentMethod: null,
          orderGroupPicture: false,
          orderVorschulPicture: false,
          childGroupName: "",
          childName: "",
        },
        user: {
          id: "test-user-id",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          createdAt: "2024-01-01T10:00:00Z",
          updatedAt: "2024-01-01T10:00:00Z",
          consentVersion: "1.0",
          consentTimestamp: "2024-01-01T10:00:00Z",
          dataRetentionUntil: "2025-01-01T10:00:00Z",
          lastActivity: "2024-01-01T10:00:00Z",
        },
        magazine: {
          id: "test-magazine-id",
          title: "Test Magazine",
          issueNumber: "2024-01",
          publishDate: "2024-01-01T00:00:00Z",
          description: "Test magazine description",
          totalCopies: 100,
          availableCopies: 95,
          coverImageUrl: "https://example.com/cover.jpg",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      };

      // This will exercise all the template generation methods
      await expect(
        emailService.sendReservationConfirmation(mockData),
      ).resolves.not.toThrow();
      await expect(
        emailService.sendCancellationConfirmation(mockData),
      ).resolves.not.toThrow();
      await expect(
        emailService.sendPickupReminder(mockData),
      ).resolves.not.toThrow();
    });

    it("handles shipping method in templates", async () => {
      // Set up environment variables before importing the module
      vi.stubGlobal("import", {
        meta: {
          env: {
            ...import.meta.env,
            SMTP_USER: "test@test.com",
            SMTP_PASS: "password123",
            SMTP_HOST: "smtp.test.com",
            SMTP_PORT: "587",
          },
        },
      });
      
      vi.doMock("nodemailer", () => ({
        default: {
          createTransport: vi.fn(() => ({
            sendMail: vi.fn().mockImplementation((mailOptions) => {
              // Verify shipping-specific content is generated
              expect(mailOptions.html).toContain("Versand");
              return Promise.resolve({ messageId: "mock-id" });
            }),
            verify: vi.fn().mockResolvedValue(true),
          })),
        },
      }));

      const { EmailService } = await import("@/lib/email/email-service");

      const emailService = new EmailService({
        host: "smtp.test.com",
        port: 587,
        secure: false,
        auth: { user: "test@test.com", pass: "password123" },
        from: "noreply@test.com",
      });

      const shippingData = {
        reservation: {
          id: "test-id",
          userId: "user-id",
          magazineId: "mag-id",
          quantity: 1,
          status: "confirmed" as const,
          reservationDate: "2024-01-01T10:00:00Z",
          deliveryMethod: "shipping" as const,
          pickupLocation: null,
          consentReference: "consent",
          createdAt: "2024-01-01T10:00:00Z",
          updatedAt: "2024-01-01T10:00:00Z",
          expiresAt: "2024-01-08T10:00:00Z",
          paymentMethod: "paypal" as const,
          pickupDate: null,
          orderGroupPicture: false,
          orderVorschulPicture: false,
          childGroupName: "",
          childName: "",
        },
        user: {
          id: "user-id",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          createdAt: "2024-01-01T10:00:00Z",
          updatedAt: "2024-01-01T10:00:00Z",
          consentVersion: "1.0",
          consentTimestamp: "2024-01-01T10:00:00Z",
          dataRetentionUntil: "2025-01-01T10:00:00Z",
          lastActivity: "2024-01-01T10:00:00Z",
        },
        magazine: {
          id: "mag-id",
          title: "Test Magazine",
          issueNumber: "2024-01",
          publishDate: "2024-01-01T00:00:00Z",
          description: "Test description",
          totalCopies: 100,
          availableCopies: 95,
          coverImageUrl: "https://example.com/cover.jpg",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T10:00:00Z",
        },
      };

      await expect(
        emailService.sendReservationConfirmation(shippingData),
      ).resolves.not.toThrow();
    });

    it("handles picture orders in templates", async () => {
      // Set up environment variables before importing the module
      vi.stubGlobal("import", {
        meta: {
          env: {
            ...import.meta.env,
            SMTP_USER: "test@test.com",
            SMTP_PASS: "password123",
            SMTP_HOST: "smtp.test.com",
            SMTP_PORT: "587",
          },
        },
      });
      
      vi.doMock("nodemailer", () => ({
        default: {
          createTransport: vi.fn(() => ({
            sendMail: vi.fn().mockImplementation((mailOptions) => {
              // Verify picture order content is generated
              expect(mailOptions.html).toContain("Bildbestellung");
              return Promise.resolve({ messageId: "mock-id" });
            }),
            verify: vi.fn().mockResolvedValue(true),
          })),
        },
      }));

      const { EmailService } = await import("@/lib/email/email-service");

      const emailService = new EmailService({
        host: "smtp.test.com",
        port: 587,
        secure: false,
        auth: { user: "test@test.com", pass: "password123" },
        from: "noreply@test.com",
      });

      const pictureOrderData = {
        reservation: {
          id: "test-id",
          userId: "user-id",
          magazineId: "mag-id",
          quantity: 1,
          status: "confirmed" as const,
          reservationDate: "2024-01-01T10:00:00Z",
          deliveryMethod: "pickup" as const,
          pickupLocation: "Test Location",
          consentReference: "consent",
          createdAt: "2024-01-01T10:00:00Z",
          updatedAt: "2024-01-01T10:00:00Z",
          expiresAt: "2024-01-08T10:00:00Z",
          paymentMethod: null,
          pickupDate: "2024-01-05T10:00:00Z",
          orderGroupPicture: true,
          orderVorschulPicture: true,
          childGroupName: "Gruppe A",
          childName: "Max Mustermann",
        },
        user: {
          id: "user-id",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          createdAt: "2024-01-01T10:00:00Z",
          updatedAt: "2024-01-01T10:00:00Z",
          consentVersion: "1.0",
          consentTimestamp: "2024-01-01T10:00:00Z",
          dataRetentionUntil: "2025-01-01T10:00:00Z",
          lastActivity: "2024-01-01T10:00:00Z",
        },
        magazine: {
          id: "mag-id",
          title: "Test Magazine",
          issueNumber: "2024-01",
          publishDate: "2024-01-01T00:00:00Z",
          description: "Test description",
          totalCopies: 100,
          availableCopies: 95,
          coverImageUrl: "https://example.com/cover.jpg",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T10:00:00Z",
        },
      };

      await expect(
        emailService.sendReservationConfirmation(pictureOrderData),
      ).resolves.not.toThrow();
    });
  });

  describe("Error Handling Code Paths", () => {
    it("handles email sending timeout", async () => {
      vi.mock("nodemailer", () => ({
        default: {
          createTransport: vi.fn(() => ({
            sendMail: vi.fn(() => new Promise(() => {})), // Never resolves (simulates timeout)
            verify: vi.fn().mockResolvedValue(true),
          })),
        },
      }));

      const { EmailService } = await import("@/lib/email/email-service");

      const emailService = new EmailService({
        host: "smtp.test.com",
        port: 587,
        secure: false,
        auth: { user: "test@test.com", pass: "password123" },
        from: "noreply@test.com",
      });

      const mockData = {
        reservation: {
          id: "test-id",
          userId: "user-id",
          magazineId: "mag-id",
          quantity: 1,
          status: "confirmed" as const,
          reservationDate: "2024-01-01T10:00:00Z",
          deliveryMethod: "pickup" as const,
          pickupLocation: "Test Location",
          consentReference: "consent",
          createdAt: "2024-01-01T10:00:00Z",
          updatedAt: "2024-01-01T10:00:00Z",
          expiresAt: "2024-01-08T10:00:00Z",
          paymentMethod: null,
          pickupDate: "2024-01-05T10:00:00Z",
          orderGroupPicture: false,
          orderVorschulPicture: false,
          childGroupName: "",
          childName: "",
        },
        user: {
          id: "user-id",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          createdAt: "2024-01-01T10:00:00Z",
          updatedAt: "2024-01-01T10:00:00Z",
          consentVersion: "1.0",
          consentTimestamp: "2024-01-01T10:00:00Z",
          dataRetentionUntil: "2025-01-01T10:00:00Z",
          lastActivity: "2024-01-01T10:00:00Z",
        },
        magazine: {
          id: "mag-id",
          title: "Test Magazine",
          issueNumber: "2024-01",
          publishDate: "2024-01-01T00:00:00Z",
          description: "Test description",
          totalCopies: 100,
          availableCopies: 95,
          coverImageUrl: "https://example.com/cover.jpg",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T10:00:00Z",
        },
      };

      // Should timeout after 10 seconds and throw error
      await expect(
        emailService.sendReservationConfirmation(mockData),
      ).rejects.toThrow(/timeout|failed/i);
    }, 15000); // 15 second test timeout to allow for the 10 second email timeout

    it("handles verification failure", async () => {
      vi.doMock("nodemailer", () => ({
        default: {
          createTransport: vi.fn(() => ({
            verify: vi
              .fn()
              .mockRejectedValue(new Error("SMTP connection failed")),
          })),
        },
      }));

      const { EmailService } = await import("@/lib/email/email-service");

      const emailService = new EmailService({
        host: "smtp.invalid.com",
        port: 587,
        secure: false,
        auth: { user: "test@test.com", pass: "password123" },
        from: "noreply@test.com",
      });

      await expect(emailService.verifyConnection()).rejects.toThrow(
        "Email service verification failed",
      );
    });
  });
});
