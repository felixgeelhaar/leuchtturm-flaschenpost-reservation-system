/**
 * Security Middleware for Astro Application
 * 
 * Implements comprehensive security measures including CSRF protection,
 * rate limiting, input validation, and GDPR compliance.
 */

import type { APIContext, MiddlewareNext } from 'astro';
import { serverConfig } from '../lib/config/environment';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface SecurityHeaders {
  [key: string]: string;
}

interface RateLimitStore {
  [key: string]: {
    requests: number;
    resetTime: number;
  };
}

// =============================================================================
// RATE LIMITING
// =============================================================================

class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs = 900000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getClientKey(context: APIContext): string {
    // Use multiple factors for client identification
    const forwarded = context.request.headers.get('x-forwarded-for');
    const realIp = context.request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIp || context.clientAddress || 'unknown';
    
    const userAgent = context.request.headers.get('user-agent') || 'unknown';
    const hash = btoa(`${ip}:${userAgent}`).substring(0, 16);
    
    return hash;
  }

  public isRateLimited(context: APIContext): boolean {
    if (!serverConfig) return false;

    const key = this.getClientKey(context);
    const now = Date.now();
    
    // Initialize or reset if window expired
    if (!this.store[key] || this.store[key].resetTime <= now) {
      this.store[key] = {
        requests: 1,
        resetTime: now + this.windowMs,
      };
      return false;
    }

    // Increment request count
    this.store[key].requests++;
    
    // Check if limit exceeded
    return this.store[key].requests > this.maxRequests;
  }

  public getRemainingRequests(context: APIContext): number {
    const key = this.getClientKey(context);
    const entry = this.store[key];
    
    if (!entry) return this.maxRequests;
    
    return Math.max(0, this.maxRequests - entry.requests);
  }

  public getResetTime(context: APIContext): number {
    const key = this.getClientKey(context);
    const entry = this.store[key];
    
    return entry?.resetTime || Date.now() + this.windowMs;
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter(
  serverConfig?.security.rateLimitWindowMs,
  serverConfig?.security.rateLimitMaxRequests
);

// =============================================================================
// CSRF PROTECTION
// =============================================================================

class CSRFProtection {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  public generateToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const data = `${sessionId}:${timestamp}`;
    
    // Simple HMAC-like implementation (in production, use proper crypto)
    const hash = btoa(`${data}:${this.secret}`).replace(/[^a-zA-Z0-9]/g, '');
    
    return `${timestamp}.${hash}`;
  }

  public validateToken(token: string, sessionId: string): boolean {
    try {
      const [timestamp, hash] = token.split('.');
      const age = Date.now() - parseInt(timestamp);
      
      // Token expires after 1 hour
      if (age > 3600000) return false;
      
      const expectedToken = this.generateToken(sessionId);
      const [, expectedHash] = expectedToken.split('.');
      
      return hash === expectedHash;
    } catch {
      return false;
    }
  }
}

const csrfProtection = serverConfig 
  ? new CSRFProtection(serverConfig.auth.csrfSecret)
  : null;

// =============================================================================
// SECURITY HEADERS
// =============================================================================

function getSecurityHeaders(): SecurityHeaders {
  const headers: SecurityHeaders = {
    // HTTPS enforcement
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // XSS Protection
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy
    'Permissions-Policy': [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'speaker=()',
      'vibrate=()',
      'fullscreen=(self)',
      'sync-xhr=()',
    ].join(', '),
    
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "media-src 'self'",
      "worker-src 'self'",
      "manifest-src 'self'",
    ].join('; '),
    
    // GDPR-related headers
    'X-Robots-Tag': 'index, follow',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  return headers;
}

// =============================================================================
// INPUT VALIDATION AND SANITIZATION
// =============================================================================

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

function validateContentType(contentType: string): boolean {
  const allowedTypes = [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain',
  ];
  
  return allowedTypes.some(type => contentType.includes(type));
}

// =============================================================================
// HONEYPOT PROTECTION
// =============================================================================

function checkHoneypot(formData: FormData): boolean {
  if (!serverConfig) return true;
  
  const honeypotField = serverConfig.security.honeypotFieldName;
  const honeypotValue = formData.get(honeypotField);
  
  // If honeypot field is filled, it's likely a bot
  return !honeypotValue || honeypotValue === '';
}

// =============================================================================
// MAIN SECURITY MIDDLEWARE
// =============================================================================

export async function securityMiddleware(
  context: APIContext,
  next: MiddlewareNext
) {
  const { request, url } = context;
  const method = request.method;

  // Skip security checks for static assets
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    return next();
  }

  // Apply security headers to all responses
  const response = await next();
  const headers = getSecurityHeaders();
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Rate limiting
  if (rateLimiter.isRateLimited(context)) {
    const resetTime = rateLimiter.getResetTime(context);
    const remaining = rateLimiter.getRemainingRequests(context);
    
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: resetTime,
        remaining: remaining,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': serverConfig?.security.rateLimitMaxRequests.toString() || '100',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': resetTime.toString(),
          ...headers,
        },
      }
    );
  }

  // CSRF protection for state-changing operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const contentType = request.headers.get('content-type') || '';
    
    // Validate content type
    if (!validateContentType(contentType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid content type' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        }
      );
    }

    // CSRF token validation
    if (csrfProtection && !url.pathname.startsWith('/api/auth/')) {
      const csrfToken = request.headers.get('x-csrf-token') || 
                       request.headers.get('x-requested-with');
      const sessionId = request.headers.get('x-session-id') || 'anonymous';

      if (!csrfToken || !csrfProtection.validateToken(csrfToken, sessionId)) {
        return new Response(
          JSON.stringify({ error: 'CSRF token validation failed' }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
          }
        );
      }
    }

    // Honeypot validation for form submissions
    if (contentType.includes('form-data') || contentType.includes('form-urlencoded')) {
      try {
        const formData = await request.clone().formData();
        if (!checkHoneypot(formData)) {
          // Log suspicious activity but don't reveal honeypot
          console.warn(`Potential bot detected from ${context.clientAddress}`);
          
          return new Response(
            JSON.stringify({ error: 'Invalid form submission' }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...headers,
              },
            }
          );
        }
      } catch (error) {
        console.error('Error parsing form data:', error);
      }
    }
  }

  return response;
}

// =============================================================================
// UTILITY FUNCTIONS FOR COMPONENTS
// =============================================================================

/**
 * Generate CSRF token for forms
 */
export function generateCSRFToken(sessionId: string): string {
  if (!csrfProtection) return '';
  return csrfProtection.generateToken(sessionId);
}

/**
 * Get security headers for manual application
 */
export function getHeaders(): SecurityHeaders {
  return getSecurityHeaders();
}

/**
 * Sanitize user input
 */
export function sanitize(input: string): string {
  return sanitizeInput(input);
}

/**
 * Generate honeypot field name
 */
export function getHoneypotFieldName(): string {
  return serverConfig?.security.honeypotFieldName || 'website_url';
}