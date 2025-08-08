/**
 * Environment Configuration Module
 *
 * Centralized configuration management with type safety and validation.
 * Handles both client-side and server-side environment variables.
 */

import { z } from 'zod';
// =============================================================================
// ENVIRONMENT SCHEMAS
// =============================================================================

const ServerEnvSchema = z.object({
  // Build environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  SITE_URL: z.string().url(),
  BASE_URL: z.string().default('/'),

  // Database (Supabase)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Authentication & Security
  JWT_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(32),
  CSRF_SECRET: z.string().min(32),

  // Email configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  UPTIME_WEBHOOK_URL: z.string().url().optional(),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // GDPR compliance
  DATA_RETENTION_DAYS: z.coerce.number().default(730), // 2 years
  PRIVACY_CONTACT_EMAIL: z.string().email(),
  COOKIE_DOMAIN: z.string(),
  COOKIE_SECURE: z.coerce.boolean().default(true),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),

  // Feature flags
  ENABLE_REGISTRATION: z.coerce.boolean().default(true),
  ENABLE_RESERVATIONS: z.coerce.boolean().default(true),
  ENABLE_ANALYTICS: z.coerce.boolean().default(true),
  MAINTENANCE_MODE: z.coerce.boolean().default(false),

  // Localization
  DEFAULT_LANGUAGE: z.string().default('de'),
  SUPPORTED_LANGUAGES: z.string().default('de,en'),

  // Security
  HONEYPOT_FIELD_NAME: z.string().default('website_url'),

  // Backup & Recovery
  BACKUP_ENCRYPTION_KEY: z.string().min(32).optional(),
  BACKUP_STORAGE_BUCKET: z.string().optional(),

  // Development
  DEBUG_MODE: z.coerce.boolean().default(false),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const ClientEnvSchema = z.object({
  // Public Supabase configuration
  PUBLIC_SUPABASE_URL: z.string().url().optional(),
  PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),

  // Site configuration
  SITE_URL: z.string().url().optional(),
  BASE_URL: z.string().default('/'),

  // Analytics (optional)
  GA_MEASUREMENT_ID: z.string().optional(),

  // Feature flags (public)
  ENABLE_REGISTRATION: z.coerce.boolean().default(true),
  ENABLE_RESERVATIONS: z.coerce.boolean().default(true),
  MAINTENANCE_MODE: z.coerce.boolean().default(false),

  // Localization
  DEFAULT_LANGUAGE: z.string().default('de'),
  SUPPORTED_LANGUAGES: z.string().default('de,en'),

  // Build information
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

function validateEnvironment() {
  // Server-side validation
  if (typeof process !== 'undefined' && process.env) {
    try {
      const serverEnv = ServerEnvSchema.parse(process.env);
      return { server: serverEnv, client: null };
    } catch (error) {
      console.error('❌ Server environment validation failed:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Invalid server environment configuration');
      }
    }
  }

  // Client-side validation
  if (typeof window !== 'undefined' || typeof import.meta !== 'undefined') {
    try {
      const clientEnv = import.meta.env || {};
      const validatedClientEnv = ClientEnvSchema.parse(clientEnv);
      return { server: null, client: validatedClientEnv };
    } catch (error) {
      console.warn('⚠️ Client environment validation failed, using defaults:', error);
      // Return default client config instead of throwing
      return { 
        server: null, 
        client: {
          PUBLIC_SUPABASE_URL: '',
          PUBLIC_SUPABASE_ANON_KEY: '',
          SITE_URL: 'http://localhost:4321',
          BASE_URL: '/',
          GA_MEASUREMENT_ID: undefined,
          ENABLE_REGISTRATION: true,
          ENABLE_RESERVATIONS: true,
          MAINTENANCE_MODE: false,
          DEFAULT_LANGUAGE: 'de',
          SUPPORTED_LANGUAGES: 'de,en',
          NODE_ENV: 'development' as const,
        },
      };
    }
  }

  return { server: null, client: null };
}

// =============================================================================
// CONFIGURATION OBJECTS
// =============================================================================

const { server: serverEnv, client: clientEnv } = validateEnvironment();

// Server-side configuration (only available on server)
export const serverConfig = serverEnv
  ? {
    // Database
    database: {
      supabaseServiceRoleKey: serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    },

    // Authentication
    auth: {
      jwtSecret: serverEnv.JWT_SECRET,
      sessionSecret: serverEnv.SESSION_SECRET,
      encryptionKey: serverEnv.ENCRYPTION_KEY,
      csrfSecret: serverEnv.CSRF_SECRET,
    },

    // Email
    email: {
      smtp: {
        host: serverEnv.SMTP_HOST,
        port: serverEnv.SMTP_PORT,
        user: serverEnv.SMTP_USER,
        pass: serverEnv.SMTP_PASS,
        from: serverEnv.SMTP_FROM,
      },
    },

    // Security
    security: {
      rateLimitWindowMs: serverEnv.RATE_LIMIT_WINDOW_MS,
      rateLimitMaxRequests: serverEnv.RATE_LIMIT_MAX_REQUESTS,
      honeypotFieldName: serverEnv.HONEYPOT_FIELD_NAME,
    },

    // GDPR
    gdpr: {
      dataRetentionDays: serverEnv.DATA_RETENTION_DAYS,
      privacyContactEmail: serverEnv.PRIVACY_CONTACT_EMAIL,
      cookieDomain: serverEnv.COOKIE_DOMAIN,
      cookieSecure: serverEnv.COOKIE_SECURE,
      cookieSameSite: serverEnv.COOKIE_SAME_SITE,
    },

    // Monitoring
    monitoring: {
      sentryDsn: serverEnv.SENTRY_DSN,
      uptimeWebhookUrl: serverEnv.UPTIME_WEBHOOK_URL,
    },

    // Features
    features: {
      enableRegistration: serverEnv.ENABLE_REGISTRATION,
      enableReservations: serverEnv.ENABLE_RESERVATIONS,
      enableAnalytics: serverEnv.ENABLE_ANALYTICS,
      maintenanceMode: serverEnv.MAINTENANCE_MODE,
    },

    // Localization
    i18n: {
      defaultLanguage: serverEnv.DEFAULT_LANGUAGE,
      supportedLanguages: serverEnv.SUPPORTED_LANGUAGES.split(','),
    },

    // Development
    dev: {
      debugMode: serverEnv.DEBUG_MODE,
      logLevel: serverEnv.LOG_LEVEL,
    },

    // Environment
    isProduction: serverEnv.NODE_ENV === 'production',
    isDevelopment: serverEnv.NODE_ENV === 'development',
    isTest: serverEnv.NODE_ENV === 'test',
  }
  : null;

// Client-side configuration (available everywhere)
export const clientConfig = clientEnv
  ? {
    // Supabase
    supabase: {
      url: clientEnv.PUBLIC_SUPABASE_URL,
      anonKey: clientEnv.PUBLIC_SUPABASE_ANON_KEY,
    },

    // Site
    site: {
      url: clientEnv.SITE_URL,
      baseUrl: clientEnv.BASE_URL,
    },

    // Analytics
    analytics: {
      gaMeasurementId: clientEnv.GA_MEASUREMENT_ID,
    },

    // Features
    features: {
      enableRegistration: clientEnv.ENABLE_REGISTRATION || true,
      enableReservations: clientEnv.ENABLE_RESERVATIONS || true,
      maintenanceMode: clientEnv.MAINTENANCE_MODE || false,
    },

    // Localization
    i18n: {
      defaultLanguage: clientEnv.DEFAULT_LANGUAGE || 'de',
      supportedLanguages: (clientEnv.SUPPORTED_LANGUAGES || 'de,en').split(','),
    },

    // Environment
    isProduction: (clientEnv.NODE_ENV || 'development') === 'production',
    isDevelopment: (clientEnv.NODE_ENV || 'development') === 'development',
    isTest: (clientEnv.NODE_ENV || 'development') === 'test',
  }
  : {
    // Default client configuration
    supabase: {
      url: undefined,
      anonKey: undefined,
    },
    site: {
      url: undefined,
      baseUrl: '/',
    },
    analytics: {
      gaMeasurementId: undefined,
    },
    features: {
      enableRegistration: true,
      enableReservations: true,
      maintenanceMode: false,
    },
    i18n: {
      defaultLanguage: 'de',
      supportedLanguages: ['de', 'en'],
    },
    isProduction: false,
    isDevelopment: true,
    isTest: false,
  };

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get configuration value with fallback
 */
export function getConfigValue<T>(
  serverPath: (config: typeof serverConfig) => T | undefined,
  clientPath: (config: typeof clientConfig) => T | undefined,
  fallback: T,
): T {
  if (serverConfig) {
    const serverValue = serverPath(serverConfig);
    if (serverValue !== undefined) return serverValue;
  }

  if (clientConfig) {
    const clientValue = clientPath(clientConfig);
    if (clientValue !== undefined) return clientValue;
  }

  return fallback;
}

/**
 * Check if running in production
 */
export const isProduction = getConfigValue(
  (server) => server?.isProduction,
  (client) => client?.isProduction,
  false,
);

/**
 * Check if running in development
 */
export const isDevelopment = getConfigValue(
  (server) => server?.isDevelopment,
  (client) => client?.isDevelopment,
  true,
);

/**
 * Get site URL
 */
export const siteUrl = getConfigValue(
  (server) => serverEnv?.SITE_URL,
  (client) => client?.site.url,
  'http://localhost:3000',
);

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate required environment variables on startup
 */
export function validateRequiredEnvVars() {
  const requiredVars = [
    'PUBLIC_SUPABASE_URL',
    'PUBLIC_SUPABASE_ANON_KEY',
    'SITE_URL',
  ];

  const serverOnlyVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'SESSION_SECRET',
    'ENCRYPTION_KEY',
    'CSRF_SECRET',
  ];

  const productionRequiredVars = [
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS', 
    'SMTP_FROM',
    'PRIVACY_CONTACT_EMAIL',
    'COOKIE_DOMAIN',
  ];

  // Check public vars
  for (const varName of requiredVars) {
    if (!import.meta.env[varName] && !process.env[varName]) {
      throw new Error(`Required environment variable ${varName} is not set`);
    }
  }

  // Check server-only vars (only in server context)
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    for (const varName of serverOnlyVars) {
      if (!process.env[varName]) {
        throw new Error(
          `Required server environment variable ${varName} is not set`,
        );
      }
    }
    
    // Additional production validation
    for (const varName of productionRequiredVars) {
      if (!process.env[varName]) {
        throw new Error(
          `Required production environment variable ${varName} is not set`,
        );
      }
    }
    
    // Validate secret lengths for security
    const secrets = ['JWT_SECRET', 'SESSION_SECRET', 'ENCRYPTION_KEY', 'CSRF_SECRET'];
    for (const secretName of secrets) {
      const secret = process.env[secretName];
      if (secret && secret.length < 32) {
        throw new Error(
          `${secretName} must be at least 32 characters long for security`,
        );
      }
    }
    
    // Validate URLs format
    const urls = ['PUBLIC_SUPABASE_URL', 'SITE_URL'];
    for (const urlName of urls) {
      const url = process.env[urlName] || import.meta.env?.[urlName];
      if (url && !url.match(/^https?:\/\//)) {
        throw new Error(`${urlName} must be a valid HTTP/HTTPS URL`);
      }
    }
    
    // Validate email format
    const emails = ['SMTP_FROM', 'PRIVACY_CONTACT_EMAIL'];
    for (const emailName of emails) {
      const email = process.env[emailName];
      if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error(`${emailName} must be a valid email address`);
      }
    }
  }
}

// Validate on module load
if (isProduction) {
  validateRequiredEnvVars();
}
