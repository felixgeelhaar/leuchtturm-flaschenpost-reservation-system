import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Reservation, User, Magazine } from "@/types";

// Mock nodemailer at the top level
const mockSendMail = vi.fn();
const mockVerify = vi.fn();

vi.mock("nodemailer", () => ({
  default: {
    createTransporter: vi.fn(() => ({
      sendMail: mockSendMail,
      verify: mockVerify,
    })),
  },
}));

// Mock config modules
vi.mock("@/config/content", () => ({
  websiteContent: {
    kindergarten: {
      name: "Test Kindergarten",
      address: "Test St. 123, Berlin",
    },
    magazine: { title: "Flaschenpost", subtitle: "Das Kita-Magazin" },
    email: {
      from: "noreply@test-kindergarten.de",
      replyTo: "info@test-kindergarten.de",
      signature: "Ihr Team von Test Kindergarten",
    },
    pricing: { shipping: 5.99, pickup: 0 },
  },
}));

vi.mock("@/config/payment", () => ({
  paymentConfig: { paypal: { enabled: true } },
  generatePaymentReference: vi.fn(() => "PAY-123456"),
  formatCurrency: vi.fn((amount) => `€${amount.toFixed(2)}`),
}));

// Mock import.meta.env
vi.stubGlobal("import", {
  meta: {
    env: {
      SMTP_HOST: "smtp.test.com",
      SMTP_PORT: "587",
      SMTP_SECURE: "false",
      SMTP_USER: "test@example.com",
      SMTP_PASS: "password123",
      SMTP_FROM: "noreply@example.com",
      MODE: "test",
    },
  },
});

// Import the EmailService after all mocks
const { EmailService } = await import("@/lib/email/email-service");

describe("EmailService - Working Tests", () => {
  let emailService: EmailService;

  const mockUser: User = {
    id: "user-123",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    consentVersion: "1.0",
    consentTimestamp: "2024-01-01T00:00:00Z",
    dataRetentionUntil: "2025-01-01T00:00:00Z",
    lastActivity: "2024-01-01T00:00:00Z",
  };

  const mockMagazine: Magazine = {
    id: "mag-123",
    title: "Flaschenpost",
    issueNumber: "2024-01",
    publishDate: "2024-01-01T00:00:00Z",
    description: "Test Magazine",
    totalCopies: 100,
    availableCopies: 95,
    coverImageUrl: "https://example.com/cover.jpg",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  const mockReservationPickup: Reservation = {
    id: "res-123",
    userId: "user-123",
    magazineId: "mag-123",
    quantity: 1,
    status: "confirmed",
    reservationDate: "2024-01-01T00:00:00Z",
    deliveryMethod: "pickup",
    pickupDate: "2024-01-15T10:00:00Z",
    pickupLocation: "Test Kindergarten",
    paymentMethod: null,
    consentReference: "consent-123",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    expiresAt: "2024-01-08T00:00:00Z",
  };

  const mockReservationShipping: Reservation = {
    id: "res-124",
    userId: "user-123",
    magazineId: "mag-123",
    quantity: 2,
    status: "confirmed",
    reservationDate: "2024-01-01T00:00:00Z",
    deliveryMethod: "shipping",
    paymentMethod: "paypal",
    shippingAddress: {
      street: "Test Street",
      houseNumber: "123",
      postalCode: "10115",
      city: "Berlin",
      country: "DE",
    },
    consentReference: "consent-124",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    expiresAt: "2024-01-08T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockResolvedValue({ messageId: "test-message-id" });
    mockVerify.mockResolvedValue(true);
    emailService = new EmailService();
  });

  describe("Email Service Initialization", () => {
    it("initializes with default SMTP configuration", () => {
      expect(emailService).toBeDefined();
    });

    it("initializes with custom configuration", () => {
      const customEmailService = new EmailService({
        host: "custom.smtp.com",
        port: 465,
        secure: true,
        auth: { user: "custom@test.com", pass: "custompass" },
        from: "custom@test.com",
      });
      expect(customEmailService).toBeDefined();
    });

    it("throws error when SMTP credentials are missing", () => {
      vi.stubGlobal("import", {
        meta: {
          env: {
            SMTP_USER: "",
            SMTP_PASS: "",
          },
        },
      });

      expect(() => new EmailService()).toThrow(
        "SMTP credentials not configured",
      );
    });
  });

  describe("Connection Verification", () => {
    it("verifies connection successfully", async () => {
      await emailService.verifyConnection();
      expect(mockVerify).toHaveBeenCalledTimes(1);
    });

    it("throws error on verification failure", async () => {
      mockVerify.mockRejectedValue(new Error("Connection failed"));

      await expect(emailService.verifyConnection()).rejects.toThrow(
        "Email service verification failed",
      );
    });
  });

  describe("Reservation Confirmation Emails", () => {
    it("sends pickup confirmation email successfully", async () => {
      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const emailOptions = mockSendMail.mock.calls[0][0];

      expect(emailOptions.to).toBe(mockUser.email);
      expect(emailOptions.subject).toContain("Reservierungsbestätigung");
      expect(emailOptions.subject).toContain(mockMagazine.title);
      expect(emailOptions.html).toContain(mockUser.firstName);
      expect(emailOptions.html).toContain(mockReservationPickup.id);
      expect(emailOptions.headers["X-Reservation-ID"]).toBe(
        mockReservationPickup.id,
      );
    });

    it("sends shipping confirmation email successfully", async () => {
      await emailService.sendReservationConfirmation({
        reservation: mockReservationShipping,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const emailOptions = mockSendMail.mock.calls[0][0];

      expect(emailOptions.html).toContain("Test Street");
      expect(emailOptions.html).toContain("Berlin");
      expect(emailOptions.html).toContain("123");
    });

    it("includes proper email headers", async () => {
      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      const emailOptions = mockSendMail.mock.calls[0][0];
      expect(emailOptions.headers["X-Priority"]).toBe("1");
      expect(emailOptions.headers["X-Reservation-ID"]).toBe(
        mockReservationPickup.id,
      );
    });

    it("handles email send timeout", async () => {
      // Mock a slow email send that would timeout
      mockSendMail.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 15000)),
      );

      await expect(
        emailService.sendReservationConfirmation({
          reservation: mockReservationPickup,
          user: mockUser,
          magazine: mockMagazine,
        }),
      ).rejects.toThrow("Email send timeout after 10 seconds");
    });

    it("handles email send errors gracefully", async () => {
      mockSendMail.mockRejectedValue(new Error("SMTP server error"));

      await expect(
        emailService.sendReservationConfirmation({
          reservation: mockReservationPickup,
          user: mockUser,
          magazine: mockMagazine,
        }),
      ).rejects.toThrow("SMTP server error");
    });
  });

  describe("Email Content Generation", () => {
    it("generates HTML content for pickup reservation", async () => {
      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      const emailOptions = mockSendMail.mock.calls[0][0];
      expect(emailOptions.html).toContain("<!DOCTYPE html>");
      expect(emailOptions.html).toContain("<html");
      expect(emailOptions.html).toContain("</html>");
      expect(emailOptions.html).toContain(mockReservationPickup.pickupLocation);
    });

    it("generates text content alongside HTML", async () => {
      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      const emailOptions = mockSendMail.mock.calls[0][0];
      expect(emailOptions.text).toBeDefined();
      expect(typeof emailOptions.text).toBe("string");
      expect(emailOptions.text.length).toBeGreaterThan(0);
    });

    it("includes magazine and user details in content", async () => {
      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      const emailOptions = mockSendMail.mock.calls[0][0];
      expect(emailOptions.html).toContain(mockMagazine.issueNumber);
      expect(emailOptions.html).toContain(mockUser.firstName);
      expect(emailOptions.html).toContain(mockUser.lastName);
      expect(emailOptions.html).toContain(
        mockReservationPickup.quantity.toString(),
      );
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("handles missing pickup location gracefully", async () => {
      const reservationWithoutLocation = {
        ...mockReservationPickup,
        pickupLocation: null,
      };

      await emailService.sendReservationConfirmation({
        reservation: reservationWithoutLocation,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      // Should still send email even without pickup location
    });

    it("handles missing shipping address gracefully", async () => {
      const reservationWithoutAddress = {
        ...mockReservationShipping,
        shippingAddress: undefined,
      };

      await emailService.sendReservationConfirmation({
        reservation: reservationWithoutAddress,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it("handles special characters in user names", async () => {
      const userWithSpecialChars = {
        ...mockUser,
        firstName: "José",
        lastName: "Müller-Schmidt",
      };

      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: userWithSpecialChars,
        magazine: mockMagazine,
      });

      const emailOptions = mockSendMail.mock.calls[0][0];
      expect(emailOptions.html).toContain("José");
      expect(emailOptions.html).toContain("Müller-Schmidt");
    });

    it("escapes HTML in user-provided content", async () => {
      const userWithHtml = {
        ...mockUser,
        firstName: '<script>alert("xss")</script>John',
      };

      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: userWithHtml,
        magazine: mockMagazine,
      });

      const emailOptions = mockSendMail.mock.calls[0][0];
      // Should escape the HTML content
      expect(emailOptions.html).not.toContain("<script>");
    });
  });

  describe("Development Mode Logging", () => {
    it("logs email details in development mode", async () => {
      vi.stubGlobal("import", {
        meta: {
          env: {
            MODE: "development",
            SMTP_USER: "test@example.com",
            SMTP_PASS: "password123",
          },
        },
      });

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Email sent to ${mockUser.email}`),
      );

      consoleSpy.mockRestore();
    });

    it("does not log email details in production mode", async () => {
      vi.stubGlobal("import", {
        meta: {
          env: {
            MODE: "production",
            SMTP_USER: "test@example.com",
            SMTP_PASS: "password123",
          },
        },
      });

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await emailService.sendReservationConfirmation({
        reservation: mockReservationPickup,
        user: mockUser,
        magazine: mockMagazine,
      });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
