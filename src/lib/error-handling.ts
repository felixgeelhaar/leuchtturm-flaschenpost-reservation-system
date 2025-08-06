/**
 * Global Error Handling Utilities
 * 
 * Provides centralized error handling, reporting, and recovery mechanisms
 * for the application.
 */

import { isProduction } from './config/environment';

// Error types
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  userMessage?: string;
  context?: Record<string, any>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  context?: Record<string, any>;
}

// Error categories for better handling
export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER_ERROR = 'server_error',
  CLIENT_ERROR = 'client_error',
  UNKNOWN = 'unknown'
}

// Create custom error types
export class NetworkError extends Error implements AppError {
  code = 'NETWORK_ERROR';
  statusCode = 0;
  userMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
  category = ErrorCategory.NETWORK;
  timestamp = new Date().toISOString();
  context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = 'NetworkError';
    this.context = context;
  }
}

export class ValidationError extends Error implements AppError {
  code = 'VALIDATION_ERROR';
  statusCode = 400;
  userMessage = 'Die eingegebenen Daten sind ungültig. Bitte überprüfen Sie Ihre Eingaben.';
  category = ErrorCategory.VALIDATION;
  timestamp = new Date().toISOString();
  context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = 'ValidationError';
    this.context = context;
  }
}

export class AuthenticationError extends Error implements AppError {
  code = 'AUTH_ERROR';
  statusCode = 401;
  userMessage = 'Authentifizierung fehlgeschlagen. Bitte melden Sie sich erneut an.';
  category = ErrorCategory.AUTHENTICATION;
  timestamp = new Date().toISOString();
  context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = 'AuthenticationError';
    this.context = context;
  }
}

export class AuthorizationError extends Error implements AppError {
  code = 'AUTHORIZATION_ERROR';
  statusCode = 403;
  userMessage = 'Sie haben keine Berechtigung für diese Aktion.';
  category = ErrorCategory.AUTHORIZATION;
  timestamp = new Date().toISOString();
  context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = 'AuthorizationError';
    this.context = context;
  }
}

export class NotFoundError extends Error implements AppError {
  code = 'NOT_FOUND';
  statusCode = 404;
  userMessage = 'Die angeforderte Ressource wurde nicht gefunden.';
  category = ErrorCategory.NOT_FOUND;
  timestamp = new Date().toISOString();
  context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = 'NotFoundError';
    this.context = context;
  }
}

export class ServerError extends Error implements AppError {
  code = 'SERVER_ERROR';
  statusCode = 500;
  userMessage = 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
  category = ErrorCategory.SERVER_ERROR;
  timestamp = new Date().toISOString();
  context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = 'ServerError';
    this.context = context;
  }
}

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorReportingEnabled: boolean = isProduction;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle errors with appropriate user feedback and reporting
   */
  async handleError(error: Error | AppError, context?: Record<string, any>): Promise<void> {
    const appError = this.normalizeError(error, context);
    
    // Log error locally
    this.logError(appError);
    
    // Report error to monitoring service
    if (this.errorReportingEnabled) {
      await this.reportError(appError);
    }
    
    // Show user-friendly message
    this.notifyUser(appError);
  }

  /**
   * Normalize any error to AppError format
   */
  private normalizeError(error: Error | AppError, context?: Record<string, any>): AppError {
    if (this.isAppError(error)) {
      return { ...error, context: { ...error.context, ...context } };
    }

    // Convert generic errors to AppError
    const appError: AppError = {
      ...error,
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
      userMessage: 'Ein unerwarteter Fehler ist aufgetreten.',
      context,
      timestamp: new Date().toISOString()
    };

    // Categorize based on error message or type
    if (error.message.includes('network') || error.message.includes('fetch')) {
      appError.code = 'NETWORK_ERROR';
      appError.userMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
    } else if (error.message.includes('validation') || error.message.includes('invalid')) {
      appError.code = 'VALIDATION_ERROR';
      appError.statusCode = 400;
      appError.userMessage = 'Die eingegebenen Daten sind ungültig.';
    }

    return appError;
  }

  /**
   * Check if error is already an AppError
   */
  private isAppError(error: any): error is AppError {
    return error && typeof error.code === 'string' && typeof error.userMessage === 'string';
  }

  /**
   * Log error to console with structured format
   */
  private logError(error: AppError): void {
    const logData = {
      timestamp: error.timestamp,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      context: error.context,
      stack: error.stack
    };

    if (isProduction) {
      console.error('[ERROR]', JSON.stringify(logData));
    } else {
      console.group('🚨 Application Error');
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('User Message:', error.userMessage);
      console.error('Status Code:', error.statusCode);
      console.error('Context:', error.context);
      console.error('Stack:', error.stack);
      console.groupEnd();
    }
  }

  /**
   * Report error to monitoring service
   */
  private async reportError(error: AppError): Promise<void> {
    try {
      const report: ErrorReport = {
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode,
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        timestamp: error.timestamp || new Date().toISOString(),
        context: error.context
      };

      // Send to monitoring service (implement based on your choice)
      // Examples: Sentry, LogRocket, DataDog, etc.
      
      // For now, send to our own error endpoint
      if (typeof fetch !== 'undefined') {
        await this.sendErrorReport(report);
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  /**
   * Send error report with retry logic
   */
  private async sendErrorReport(report: ErrorReport, retries: number = 0): Promise<void> {
    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });

      if (!response.ok) {
        throw new Error(`Error reporting failed: ${response.status}`);
      }
    } catch (error) {
      if (retries < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retries + 1)));
        return this.sendErrorReport(report, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Show user-friendly error notification
   */
  private notifyUser(error: AppError): void {
    // In a real app, you might use a toast notification library
    // For now, we'll use the browser's built-in notification
    if (typeof window !== 'undefined' && !isProduction) {
      // Only show notifications in development
      console.warn('User Notification:', error.userMessage);
    }
    
    // You could dispatch a custom event that your UI components listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-error', {
        detail: {
          message: error.userMessage,
          code: error.code,
          statusCode: error.statusCode
        }
      }));
    }
  }

  /**
   * Retry a failed operation with exponential backoff
   */
  async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.maxRetries,
    baseDelay: number = this.retryDelay
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions
export const handleError = (error: Error | AppError, context?: Record<string, any>) => 
  errorHandler.handleError(error, context);

export const retry = <T>(operation: () => Promise<T>, maxRetries?: number, baseDelay?: number) =>
  errorHandler.retry(operation, maxRetries, baseDelay);

// Global error handlers setup
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      handleError(new Error(event.reason || 'Unhandled promise rejection'));
      event.preventDefault();
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      handleError(event.error || new Error(event.message));
    });
  }
  
  // Node.js process handlers (for SSR)
  if (typeof process !== 'undefined') {
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
      handleError(new Error(String(reason)));
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      handleError(error);
    });
  }
};