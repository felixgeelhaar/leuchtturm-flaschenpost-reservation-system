import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Reservation, User, Magazine } from "@/types";

describe("EmailService with proper mocking", () => {
  let EmailService: any;
  let mockTransporter: any;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    vi.resetModules();

    // Create mock transporter
    mockTransporter = {
      sendMail: vi.fn().mockResolvedValue({ messageId: "test-message-id" }),
      verify: vi.fn().mockResolvedValue(true),
    };

    // Mock nodemailer BEFORE importing EmailService
    vi.doMock("nodemailer", () => ({
      default: {
        createTransport: vi.fn(() => mockTransporter),
      },
    }));

    // Mock config modules
    vi.doMock("@/config/content", () => ({
      websiteContent: {
        kindergarten: {
          name: "Test Kindergarten",
          contact: {
            email: "info@test.de",
            address: {
              street: "Test St. 123",
              postalCode: "12345",
              city: "Berlin",
            },
          },
        },
        magazine: {
          title: "Test Magazine",
          subtitle: "Test Subtitle",
        },
        email: {
          from: "test@example.com",
          replyTo: "noreply@example.com",
          signature: "Test Signature",
        },
        pricing: {
          magazinePrice: 5.99,
          shippingCost: 2.5,
        },
      },
    }));

    vi.doMock("@/config/payment", () => ({
      paymentConfig: {
        paypal: {
          enabled: true,
          paypalMeLink: "https://paypal.me/test",
        },
      },
      generatePaymentReference: vi.fn(() => "PAY-123456"),
      formatCurrency: vi.fn((amount: number) => `€${amount.toFixed(2)}`),
    }));

    // Import EmailService after mocks are set up
    const module = await import("@/lib/email/email-service");
    EmailService = module.EmailService;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("should call nodemailer.createTransport", async () => {
    const nodemailer = (await import("nodemailer")).default;

    new EmailService({
      host: "smtp.test.com",
      port: 587,
      secure: false,
      auth: { user: "test@test.com", pass: "test-pass" },
      from: "noreply@test.com",
    });

    expect(nodemailer.createTransport).toHaveBeenCalled();
  });

  it("should send emails through mocked transporter", async () => {
    const emailService = new EmailService({
      host: "smtp.test.com",
      port: 587,
      secure: false,
      auth: { user: "test@test.com", pass: "test-pass" },
      from: "noreply@test.com",
    });

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

    const mockReservation: Reservation = {
      id: "res-123",
      userId: "user-123",
      magazineId: "mag-123",
      quantity: 2,
      status: "confirmed",
      reservationDate: "2024-01-01T00:00:00Z",
      deliveryMethod: "pickup",
      pickupLocation: "Berlin Mitte",
      pickupDate: "2024-01-02T00:00:00Z",
      paymentMethod: null,
      orderGroupPicture: false,
      orderVorschulPicture: false,
      childGroupName: "",
      childName: "",
      consentReference: "consent-ref-123",
      expiresAt: "2024-01-08T00:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    await emailService.sendReservationConfirmation({
      reservation: mockReservation,
      user: mockUser,
      magazine: mockMagazine,
    });

    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: mockUser.email,
        subject: expect.stringContaining("Reservierung"),
      }),
    );
  });

  it("should verify connection through mocked transporter", async () => {
    const emailService = new EmailService({
      host: "smtp.test.com",
      port: 587,
      secure: false,
      auth: { user: "test@test.com", pass: "test-pass" },
      from: "noreply@test.com",
    });

    await emailService.verifyConnection();

    expect(mockTransporter.verify).toHaveBeenCalledTimes(1);
  });
});
