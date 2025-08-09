import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock environment variables
const mockProcessEnv = {
  NODE_ENV: "test",
  SITE_URL: "https://example.com",
  BASE_URL: "/",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  JWT_SECRET: "this-is-a-32-character-jwt-secret",
  SESSION_SECRET: "this-is-a-32-char-session-secret",
  ENCRYPTION_KEY: "12345678901234567890123456789012", // Exactly 32 characters
  CSRF_SECRET: "this-is-a-32-character-csrf-secret",
  PRIVACY_CONTACT_EMAIL: "privacy@example.com",
  COOKIE_DOMAIN: "example.com",
};

const mockImportMeta = {
  env: {
    PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    SITE_URL: "https://example.com",
    BASE_URL: "/",
    NODE_ENV: "test",
  },
};

// Store original values
const originalProcess = global.process;
const originalWindow = global.window;

describe("Environment Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original values
    global.process = originalProcess;
    global.window = originalWindow;
    vi.restoreAllMocks();
  });

  describe("Server Environment Validation", () => {
    it("validates complete server environment successfully", async () => {
      // Mock server environment
      global.process = {
        env: mockProcessEnv,
      } as any;

      // Delete window to simulate server environment
      delete (global as any).window;

      // Mock import.meta to be undefined
      vi.stubGlobal("import", { meta: undefined });

      // Import module after setting up environment
      const { serverConfig } = await import("@/lib/config/environment");

      expect(serverConfig).toBeDefined();
      expect(serverConfig?.database.supabaseServiceRoleKey).toBe(
        "test-service-role-key",
      );
      expect(serverConfig?.auth.jwtSecret).toBe(
        "this-is-a-32-character-jwt-secret",
      );
      expect(serverConfig?.gdpr.privacyContactEmail).toBe(
        "privacy@example.com",
      );
    });

    it("validates server environment with optional fields", async () => {
      const envWithOptionals = {
        ...mockProcessEnv,
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "587",
        SMTP_USER: "test@example.com",
        SMTP_PASS: "password123",
        SMTP_FROM: "noreply@example.com",
        SENTRY_DSN: "https://sentry.example.com/123",
        DEBUG_MODE: "true",
        LOG_LEVEL: "debug",
      };

      global.process = {
        env: envWithOptionals,
      } as any;

      delete (global as any).window;
      vi.stubGlobal("import", { meta: undefined });

      const { serverConfig } = await import("@/lib/config/environment");

      expect(serverConfig?.email.smtp.host).toBe("smtp.example.com");
      expect(serverConfig?.email.smtp.port).toBe(587);
      expect(serverConfig?.monitoring?.sentryDsn).toBe(
        "https://sentry.example.com/123",
      );
    });

    it("applies default values for optional server fields", async () => {
      global.process = {
        env: mockProcessEnv,
      } as any;

      delete (global as any).window;
      vi.stubGlobal("import", { meta: undefined });

      const { serverConfig } = await import("@/lib/config/environment");

      expect(serverConfig?.security.rateLimitWindowMs).toBe(900000); // 15 minutes default
      expect(serverConfig?.security.rateLimitMaxRequests).toBe(100); // default
      expect(serverConfig?.gdpr.dataRetentionDays).toBe(730); // 2 years default
    });

    it("throws error on invalid server environment in production", async () => {
      const invalidEnv = {
        ...mockProcessEnv,
        NODE_ENV: "production",
        JWT_SECRET: "too-short", // Invalid: less than 32 characters
      };

      global.process = {
        env: invalidEnv,
      } as any;

      delete (global as any).window;
      vi.stubGlobal("import", { meta: undefined });

      await expect(() => import("@/lib/config/environment")).rejects.toThrow(
        "Invalid server environment configuration",
      );
    });

    it("logs error but continues on invalid server environment in development", async () => {
      const invalidEnv = {
        ...mockProcessEnv,
        NODE_ENV: "development",
        JWT_SECRET: "too-short", // Invalid
      };

      global.process = {
        env: invalidEnv,
      } as any;

      delete (global as any).window;
      vi.stubGlobal("import", { meta: undefined });

      const { serverConfig } = await import("@/lib/config/environment");

      expect(serverConfig).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("❌ Server environment validation failed:"),
        expect.any(Object),
      );
    });

    it("validates feature flags correctly", async () => {
      const envWithFeatures = {
        ...mockProcessEnv,
        ENABLE_REGISTRATION: "false",
        ENABLE_RESERVATIONS: "true",
        MAINTENANCE_MODE: "true",
      };

      global.process = {
        env: envWithFeatures,
      } as any;

      delete (global as any).window;
      vi.stubGlobal("import", { meta: undefined });

      const { serverConfig } = await import("@/lib/config/environment");

      expect(serverConfig?.features?.enableRegistration).toBe(false);
      expect(serverConfig?.features?.enableReservations).toBe(true);
      expect(serverConfig?.features?.maintenanceMode).toBe(true);
    });
  });

  describe("Client Environment Validation", () => {
    it("validates complete client environment successfully", async () => {
      // Mock client environment
      global.process = undefined as any;
      global.window = {} as any;

      vi.stubGlobal("import", { meta: mockImportMeta });

      const { clientConfig } = await import("@/lib/config/environment");

      expect(clientConfig).toBeDefined();
      expect(clientConfig?.supabase.url).toBe("https://test.supabase.co");
      expect(clientConfig?.supabase.anonKey).toBe("test-anon-key");
      expect(clientConfig?.site.url).toBe("https://example.com");
    });

    it("uses defaults when client environment validation fails", async () => {
      global.process = undefined as any;
      global.window = {} as any;

      // Mock invalid client environment
      vi.stubGlobal("import", {
        meta: {
          env: {
            PUBLIC_SUPABASE_URL: "invalid-url", // Invalid URL
            NODE_ENV: "test",
          },
        },
      });

      const { clientConfig } = await import("@/lib/config/environment");

      expect(clientConfig).toBeDefined();
      expect(clientConfig?.site.url).toBe("http://localhost:4321"); // Default fallback
      expect(clientConfig?.supabase.url).toBe("");
      expect(clientConfig?.localization.defaultLanguage).toBe("de");
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          "⚠️ Client environment validation failed, using defaults:",
        ),
        expect.any(Object),
      );
    });

    it("handles missing client environment gracefully", async () => {
      global.process = undefined as any;
      global.window = {} as any;

      vi.stubGlobal("import", { meta: { env: {} } });

      const { clientConfig } = await import("@/lib/config/environment");

      expect(clientConfig?.features.enableRegistration).toBe(true); // Default
      expect(clientConfig?.features.enableReservations).toBe(true); // Default
      expect(clientConfig?.features.maintenanceMode).toBe(false); // Default
      expect(clientConfig?.localization.supportedLanguages).toBe("de,en"); // Default
    });
  });

  describe("Environment Detection", () => {
    it("returns null configs when neither server nor client environment is available", async () => {
      global.process = undefined as any;
      delete (global as any).window;
      vi.stubGlobal("import", { meta: undefined });

      const { serverConfig, clientConfig } = await import(
        "@/lib/config/environment"
      );

      expect(serverConfig).toBeNull();
      expect(clientConfig).toBeNull();
    });

    it("prioritizes server environment when both are available", async () => {
      global.process = {
        env: mockProcessEnv,
      } as any;
      global.window = {} as any;
      vi.stubGlobal("import", { meta: mockImportMeta });

      const { serverConfig, clientConfig } = await import(
        "@/lib/config/environment"
      );

      expect(serverConfig).toBeDefined();
      expect(clientConfig).toBeNull(); // Client should be null when server is available
    });
  });

  describe("Configuration Structure", () => {
    it("structures server configuration correctly", async () => {
      const completeEnv = {
        ...mockProcessEnv,
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "587",
        SENTRY_DSN: "https://sentry.example.com/123",
        RATE_LIMIT_WINDOW_MS: "300000",
        RATE_LIMIT_MAX_REQUESTS: "50",
        DATA_RETENTION_DAYS: "365",
        ENABLE_ANALYTICS: "true",
      };

      global.process = {
        env: completeEnv,
      } as any;

      delete (global as any).window;
      vi.stubGlobal("import", { meta: undefined });

      const { serverConfig } = await import("@/lib/config/environment");

      expect(serverConfig).toMatchObject({
        database: expect.objectContaining({
          supabaseServiceRoleKey: expect.any(String),
        }),
        auth: expect.objectContaining({
          jwtSecret: expect.any(String),
          sessionSecret: expect.any(String),
          encryptionKey: expect.any(String),
          csrfSecret: expect.any(String),
        }),
        email: expect.objectContaining({
          smtp: expect.objectContaining({
            host: "smtp.example.com",
            port: 587,
          }),
        }),
        security: expect.objectContaining({
          rateLimitWindowMs: 300000,
          rateLimitMaxRequests: 50,
        }),
        gdpr: expect.objectContaining({
          dataRetentionDays: 365,
          privacyContactEmail: "privacy@example.com",
        }),
      });
    });

    it("structures client configuration correctly", async () => {
      global.process = undefined as any;
      global.window = {} as any;

      const completeClientEnv = {
        ...mockImportMeta.env,
        GA_MEASUREMENT_ID: "GA-123456789",
        ENABLE_REGISTRATION: "false",
        DEFAULT_LANGUAGE: "en",
        SUPPORTED_LANGUAGES: "en,de,fr",
      };

      vi.stubGlobal("import", { meta: { env: completeClientEnv } });

      const { clientConfig } = await import("@/lib/config/environment");

      expect(clientConfig).toMatchObject({
        supabase: expect.objectContaining({
          url: "https://test.supabase.co",
          anonKey: "test-anon-key",
        }),
        site: expect.objectContaining({
          url: "https://example.com",
          baseUrl: "/",
        }),
        analytics: expect.objectContaining({
          gaMeasurementId: "GA-123456789",
        }),
        features: expect.objectContaining({
          enableRegistration: false,
          enableReservations: true,
        }),
        localization: expect.objectContaining({
          defaultLanguage: "en",
          supportedLanguages: "en,de,fr",
        }),
      });
    });
  });

  describe("Validation Edge Cases", () => {
    it("handles string coercion for boolean and numeric fields", async () => {
      const envWithStrings = {
        ...mockProcessEnv,
        SMTP_PORT: "587", // String that should become number
        COOKIE_SECURE: "false", // String that should become boolean
        RATE_LIMIT_MAX_REQUESTS: "200", // String that should become number
        ENABLE_REGISTRATION: "0", // Falsy string that should become boolean
      };

      global.process = {
        env: envWithStrings,
      } as any;

      delete (global as any).window;
      vi.stubGlobal("import", { meta: undefined });

      const { serverConfig } = await import("@/lib/config/environment");

      expect(serverConfig?.email.smtp.port).toBe(587); // Coerced to number
      expect(serverConfig?.gdpr.cookieSecure).toBe(false); // Coerced to boolean
      expect(serverConfig?.security.rateLimitMaxRequests).toBe(200); // Coerced to number
      expect(serverConfig?.features?.enableRegistration).toBe(false); // Coerced to boolean
    });

    it("validates required field lengths correctly", async () => {
      const envWithShortSecrets = {
        ...mockProcessEnv,
        JWT_SECRET: "short", // Too short (< 32 chars)
        ENCRYPTION_KEY: "12345", // Wrong length (not 32 chars)
      };

      global.process = {
        env: envWithShortSecrets,
      } as any;

      delete (global as any).window;
      vi.stubGlobal("import", { meta: undefined });

      const { serverConfig } = await import("@/lib/config/environment");

      expect(serverConfig).toBeNull(); // Should fail validation
      expect(console.error).toHaveBeenCalled();
    });

    it("validates enum fields correctly", async () => {
      const envWithInvalidEnums = {
        ...mockProcessEnv,
        NODE_ENV: "invalid-env",
        COOKIE_SAME_SITE: "invalid-same-site",
        LOG_LEVEL: "invalid-level",
      };

      global.process = {
        env: envWithInvalidEnums,
      } as any;

      delete (global as any).window;
      vi.stubGlobal("import", { meta: undefined });

      const { serverConfig } = await import("@/lib/config/environment");

      expect(serverConfig).toBeNull(); // Should fail validation
      expect(console.error).toHaveBeenCalled();
    });
  });
});
