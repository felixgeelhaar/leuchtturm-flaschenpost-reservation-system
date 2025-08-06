/**
 * Error Tracking and Monitoring System
 * 
 * Comprehensive error tracking, logging, and monitoring solution with:
 * - Sentry integration for error tracking
 * - Custom logging with different levels
 * - Performance monitoring
 * - User session tracking
 * - GDPR-compliant error reporting
 */

import { serverConfig, clientConfig } from '../config/environment';
import type { PerformanceMetrics } from '../performance/optimization';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ErrorContext {
  user?: {
    id?: string;
    email?: string;
    role?: string;
  };
  request?: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    userAgent?: string;
    ip?: string;
  };
  extra?: Record<string, any>;
  tags?: Record<string, string>;
  level?: 'error' | 'warning' | 'info' | 'debug';
  fingerprint?: string[];
}

export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context?: ErrorContext;
  stack?: string;
  source: 'client' | 'server';
}

export interface MonitoringConfig {
  enabled: boolean;
  sentryDsn?: string;
  environment: string;
  release?: string;
  sampleRate: number;
  beforeSend?: (event: any) => any | null;
}

// =============================================================================
// ERROR SANITIZATION FOR GDPR COMPLIANCE
// =============================================================================

class ErrorSanitizer {
  private sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
    'email',
    'phone',
    'address',
    'ssn',
    'creditcard',
    'card',
  ];

  private emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
  private phoneRegex = /(\+?[\d\s\-\(\)]{10,})/g;
  private creditCardRegex = /\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}/g;
  private ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

  sanitizeError(error: Error): Error {
    const sanitizedError = new Error(this.sanitizeString(error.message));
    sanitizedError.name = error.name;
    sanitizedError.stack = this.sanitizeString(error.stack || '');
    return sanitizedError;
  }

  sanitizeContext(context: ErrorContext): ErrorContext {
    const sanitized: ErrorContext = { ...context };

    // Remove sensitive user data but keep minimal info for debugging
    if (sanitized.user) {
      sanitized.user = {
        id: sanitized.user.id ? this.hashString(sanitized.user.id) : undefined,
        role: sanitized.user.role,
        // Remove email entirely for GDPR compliance
      };
    }

    // Sanitize request data
    if (sanitized.request) {
      sanitized.request = {
        ...sanitized.request,
        ip: sanitized.request.ip ? this.maskIP(sanitized.request.ip) : undefined,
        headers: this.sanitizeHeaders(sanitized.request.headers || {}),
      };
    }

    // Sanitize extra data
    if (sanitized.extra) {
      sanitized.extra = this.sanitizeObject(sanitized.extra);
    }

    return sanitized;
  }

  sanitizeString(str: string): string {
    return str
      .replace(this.emailRegex, '[EMAIL_REDACTED]')
      .replace(this.phoneRegex, '[PHONE_REDACTED]')
      .replace(this.creditCardRegex, '[CARD_REDACTED]')
      .replace(this.ipRegex, '[IP_REDACTED]');
  }

  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return this.sanitizeString(obj);
    if (typeof obj !== 'object') return obj;

    const sanitized: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      if (this.sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      
      if (this.sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private maskIP(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      // Mask the last octet for IPv4
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
    return '[IP_MASKED]';
  }

  private hashString(str: string): string {
    // Simple hash function for anonymization
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash)}`;
  }
}

// =============================================================================
// LOGGER CLASS
// =============================================================================

class Logger {
  private sanitizer = new ErrorSanitizer();
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private logLevel: 'error' | 'warn' | 'info' | 'debug';

  constructor(logLevel: 'error' | 'warn' | 'info' | 'debug' = 'info') {
    this.logLevel = logLevel;
  }

  private shouldLog(level: 'error' | 'warn' | 'info' | 'debug'): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex <= currentIndex;
  }

  private addLog(entry: LogEntry): void {
    if (this.logs.length >= this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }
    this.logs.push(entry);
  }

  error(message: string, context?: ErrorContext): void {
    if (!this.shouldLog('error')) return;

    const sanitizedContext = context ? this.sanitizer.sanitizeContext(context) : undefined;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: this.sanitizer.sanitizeString(message),
      context: sanitizedContext,
      source: typeof window !== 'undefined' ? 'client' : 'server',
    };

    this.addLog(entry);
    console.error('🔴', message, sanitizedContext);

    // Send to external monitoring service
    this.sendToMonitoring(entry);
  }

  warn(message: string, context?: ErrorContext): void {
    if (!this.shouldLog('warn')) return;

    const sanitizedContext = context ? this.sanitizer.sanitizeContext(context) : undefined;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message: this.sanitizer.sanitizeString(message),
      context: sanitizedContext,
      source: typeof window !== 'undefined' ? 'client' : 'server',
    };

    this.addLog(entry);
    console.warn('🟡', message, sanitizedContext);

    // Send to external monitoring service
    this.sendToMonitoring(entry);
  }

  info(message: string, context?: ErrorContext): void {
    if (!this.shouldLog('info')) return;

    const sanitizedContext = context ? this.sanitizer.sanitizeContext(context) : undefined;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: this.sanitizer.sanitizeString(message),
      context: sanitizedContext,
      source: typeof window !== 'undefined' ? 'client' : 'server',
    };

    this.addLog(entry);
    console.info('🔵', message, sanitizedContext);
  }

  debug(message: string, context?: ErrorContext): void {
    if (!this.shouldLog('debug')) return;

    const sanitizedContext = context ? this.sanitizer.sanitizeContext(context) : undefined;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message: this.sanitizer.sanitizeString(message),
      context: sanitizedContext,
      source: typeof window !== 'undefined' ? 'client' : 'server',
    };

    this.addLog(entry);
    console.debug('⚪', message, sanitizedContext);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  private async sendToMonitoring(entry: LogEntry): Promise<void> {
    // Only send errors and warnings to external monitoring
    if (entry.level !== 'error' && entry.level !== 'warn') return;

    try {
      // Send to Sentry if configured
      if (clientConfig?.analytics?.gaMeasurementId || serverConfig?.monitoring.sentryDsn) {
        await this.sendToSentry(entry);
      }

      // Send to custom monitoring endpoint
      await this.sendToCustomEndpoint(entry);
    } catch (error) {
      console.error('Failed to send to monitoring:', error);
    }
  }

  private async sendToSentry(entry: LogEntry): Promise<void> {
    // Implementation would depend on Sentry SDK initialization
    // This is a placeholder for Sentry integration
    console.debug('Would send to Sentry:', entry);
  }

  private async sendToCustomEndpoint(entry: LogEntry): Promise<void> {
    if (typeof fetch === 'undefined') return;

    try {
      await fetch('/api/monitoring/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Silently fail to avoid infinite loops
      console.debug('Failed to send log to custom endpoint:', error);
    }
  }
}

// =============================================================================
// PERFORMANCE MONITOR
// =============================================================================

class PerformanceTracker {
  private metrics: PerformanceMetrics = {};
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.initializeTracking();
  }

  private initializeTracking(): void {
    if (typeof window === 'undefined') return;

    // Track page load performance
    window.addEventListener('load', () => {
      this.trackPageLoad();
    });

    // Track navigation performance
    this.trackNavigation();

    // Track resource loading errors
    this.trackResourceErrors();

    // Track JavaScript errors
    this.trackJavaScriptErrors();

    // Track unhandled promise rejections
    this.trackUnhandledRejections();
  }

  private trackPageLoad(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      domInteractive: navigation.domInteractive - navigation.fetchStart,
      firstByte: navigation.responseStart - navigation.requestStart,
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnection: navigation.connectEnd - navigation.connectStart,
      serverResponse: navigation.responseEnd - navigation.responseStart,
      domProcessing: navigation.domComplete - navigation.domContentLoadedEventStart,
    };

    this.logger.info('Page load performance metrics', {
      extra: { performanceMetrics: metrics },
      tags: { category: 'performance', type: 'page-load' },
    });

    // Alert on slow page loads
    if (metrics.loadComplete > 3000) {
      this.logger.warn('Slow page load detected', {
        extra: { loadTime: metrics.loadComplete },
        tags: { category: 'performance', type: 'slow-page-load' },
      });
    }
  }

  private trackNavigation(): void {
    // Track SPA navigation if using view transitions
    if ('navigation' in window) {
      // @ts-ignore - Navigation API is experimental
      window.navigation.addEventListener('navigate', (event) => {
        const startTime = performance.now();
        
        event.intercept({
          handler: async () => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.logger.info('SPA navigation performance', {
              extra: { 
                navigationDuration: duration,
                url: event.destination.url 
              },
              tags: { category: 'performance', type: 'spa-navigation' },
            });
          }
        });
      });
    }
  }

  private trackResourceErrors(): void {
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const element = event.target as HTMLElement;
        const resourceType = element.tagName.toLowerCase();
        const src = element.getAttribute('src') || element.getAttribute('href');
        
        this.logger.error('Resource loading failed', {
          extra: {
            resourceType,
            src,
            message: event.message,
          },
          tags: { category: 'resource', type: 'load-error' },
        });
      }
    }, true);
  }

  private trackJavaScriptErrors(): void {
    window.addEventListener('error', (event) => {
      if (event.target === window) {
        this.logger.error('JavaScript error', {
          extra: {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack,
          },
          tags: { category: 'javascript', type: 'runtime-error' },
        });
      }
    });
  }

  private trackUnhandledRejections(): void {
    window.addEventListener('unhandledrejection', (event) => {
      this.logger.error('Unhandled promise rejection', {
        extra: {
          reason: event.reason,
          stack: event.reason?.stack,
        },
        tags: { category: 'javascript', type: 'unhandled-rejection' },
      });
    });
  }

  trackCustomMetric(name: string, value: number, unit?: string): void {
    this.logger.info('Custom performance metric', {
      extra: {
        metricName: name,
        value,
        unit: unit || 'ms',
        timestamp: Date.now(),
      },
      tags: { category: 'performance', type: 'custom-metric' },
    });
  }

  trackUserAction(action: string, duration?: number): void {
    this.logger.info('User action tracked', {
      extra: {
        action,
        duration,
        timestamp: Date.now(),
      },
      tags: { category: 'user-interaction', type: 'action' },
    });
  }
}

// =============================================================================
// UPTIME MONITORING
// =============================================================================

class UptimeMonitor {
  private logger: Logger;
  private checkInterval: number;
  private endpoints: string[];
  private intervalId: number | null = null;

  constructor(logger: Logger, checkInterval = 300000) { // 5 minutes
    this.logger = logger;
    this.checkInterval = checkInterval;
    this.endpoints = ['/api/health', '/api/status'];
  }

  start(): void {
    if (typeof window !== 'undefined') return; // Only run on server

    this.intervalId = setInterval(() => {
      this.checkEndpoints();
    }, this.checkInterval) as unknown as number;

    // Initial check
    this.checkEndpoints();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async checkEndpoints(): Promise<void> {
    for (const endpoint of this.endpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(endpoint, { method: 'HEAD' });
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (response.ok) {
          this.logger.info('Health check passed', {
            extra: { endpoint, responseTime, status: response.status },
            tags: { category: 'uptime', type: 'health-check' },
          });
        } else {
          this.logger.warn('Health check failed', {
            extra: { endpoint, responseTime, status: response.status },
            tags: { category: 'uptime', type: 'health-check-failed' },
          });
        }

        // Alert on slow response times
        if (responseTime > 5000) {
          this.logger.warn('Slow health check response', {
            extra: { endpoint, responseTime },
            tags: { category: 'uptime', type: 'slow-response' },
          });
        }
      } catch (error) {
        this.logger.error('Health check error', {
          extra: { endpoint, error: error instanceof Error ? error.message : String(error) },
          tags: { category: 'uptime', type: 'health-check-error' },
        });
      }
    }
  }
}

// =============================================================================
// MAIN MONITORING CLASS
// =============================================================================

export class MonitoringService {
  public logger: Logger;
  public performanceTracker: PerformanceTracker;
  public uptimeMonitor: UptimeMonitor;
  private initialized = false;

  constructor(config?: Partial<MonitoringConfig>) {
    const logLevel = serverConfig?.dev.logLevel || clientConfig?.isDevelopment ? 'debug' : 'info';
    this.logger = new Logger(logLevel as any);
    this.performanceTracker = new PerformanceTracker(this.logger);
    this.uptimeMonitor = new UptimeMonitor(this.logger);
  }

  initialize(): void {
    if (this.initialized) return;

    this.logger.info('Monitoring service initialized', {
      tags: { category: 'system', type: 'initialization' },
    });

    // Start uptime monitoring on server
    if (typeof window === 'undefined') {
      this.uptimeMonitor.start();
    }

    this.initialized = true;
  }

  captureException(error: Error, context?: ErrorContext): void {
    this.logger.error(error.message, {
      ...context,
      extra: {
        ...context?.extra,
        stack: error.stack,
        name: error.name,
      },
    });
  }

  captureMessage(message: string, level: 'error' | 'warning' | 'info' = 'info', context?: ErrorContext): void {
    switch (level) {
      case 'error':
        this.logger.error(message, context);
        break;
      case 'warning':
        this.logger.warn(message, context);
        break;
      case 'info':
        this.logger.info(message, context);
        break;
    }
  }

  setUserContext(user: { id?: string; email?: string; role?: string }): void {
    // Store user context for future error reports
    // Note: This should be implemented with proper session management
    this.logger.info('User context set', {
      user,
      tags: { category: 'user', type: 'context-set' },
    });
  }

  addBreadcrumb(message: string, category?: string, data?: any): void {
    this.logger.debug('Breadcrumb added', {
      extra: { message, category, data },
      tags: { category: 'breadcrumb', type: category || 'default' },
    });
  }

  shutdown(): void {
    this.uptimeMonitor.stop();
    this.logger.info('Monitoring service shutdown', {
      tags: { category: 'system', type: 'shutdown' },
    });
  }
}

// =============================================================================
// GLOBAL INSTANCE
// =============================================================================

export const monitoring = new MonitoringService();

// Auto-initialize if in browser or server context
if (typeof window !== 'undefined' || typeof process !== 'undefined') {
  monitoring.initialize();
}

// Cleanup on exit (Node.js)
if (typeof process !== 'undefined') {
  process.on('exit', () => monitoring.shutdown());
  process.on('SIGINT', () => monitoring.shutdown());
  process.on('SIGTERM', () => monitoring.shutdown());
}