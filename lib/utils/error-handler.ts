// lib/utils/error-handler.ts

import { toast } from "sonner";

export type ErrorCode = 
  | "NETWORK_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: string;
  timestamp: Date;
  userMessage?: string;
}

export class AppErrorHandler {
  private static instance: AppErrorHandler;
  private errors: AppError[] = [];

  private constructor() {}

  static getInstance(): AppErrorHandler {
    if (!AppErrorHandler.instance) {
      AppErrorHandler.instance = new AppErrorHandler();
    }
    return AppErrorHandler.instance;
  }

  /**
   * Handle and log errors consistently
   */
  handleError(error: unknown, context?: string): AppError {
    const appError = this.parseError(error, context);
    
    // Log error for debugging
    console.error(`[${appError.code}] ${context || 'Unknown context'}:`, {
      message: appError.message,
      details: appError.details,
      timestamp: appError.timestamp,
      originalError: error,
    });

    // Store error for debugging
    this.errors.push(appError);

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors.shift();
    }

    return appError;
  }

  /**
   * Handle error and show toast notification
   */
  handleErrorWithToast(error: unknown, context?: string): AppError {
    const appError = this.handleError(error, context);
    
    // Show user-friendly toast
    toast.error(appError.userMessage || appError.message, {
      description: appError.details,
    });

    return appError;
  }

  /**
   * Parse different types of errors into consistent format
   */
  private parseError(error: unknown, context?: string): AppError {
    const timestamp = new Date();

    // Handle different error types
    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          code: "NETWORK_ERROR",
          message: error.message,
          details: context,
          timestamp,
          userMessage: "Network error. Please check your connection and try again.",
        };
      }

      // Supabase Auth errors
      if (error.message.includes('Invalid login credentials')) {
        return {
          code: "UNAUTHORIZED",
          message: error.message,
          details: context,
          timestamp,
          userMessage: "Invalid email or password. Please try again.",
        };
      }

      // Supabase validation errors
      if (error.message.includes('duplicate key') || error.message.includes('violates')) {
        return {
          code: "VALIDATION_ERROR",
          message: error.message,
          details: context,
          timestamp,
          userMessage: "This data conflicts with existing records. Please try different values.",
        };
      }

      // Generic error
      return {
        code: "SERVER_ERROR",
        message: error.message,
        details: context,
        timestamp,
        userMessage: "Something went wrong. Please try again.",
      };
    }

    // String errors
    if (typeof error === 'string') {
      return {
        code: "UNKNOWN_ERROR",
        message: error,
        details: context,
        timestamp,
        userMessage: error,
      };
    }

    // Object errors (like from server actions)
    if (error && typeof error === 'object' && 'message' in error) {
      return {
        code: "SERVER_ERROR",
        message: (error as any).message,
        details: context,
        timestamp,
        userMessage: (error as any).message,
      };
    }

    // Unknown error type
    return {
      code: "UNKNOWN_ERROR",
      message: "An unexpected error occurred",
      details: context ? `${context}: ${String(error)}` : String(error),
      timestamp,
      userMessage: "An unexpected error occurred. Please try again.",
    };
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 10): AppError[] {
    return this.errors.slice(-limit);
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errors = [];
  }
}

// Export singleton instance
export const errorHandler = AppErrorHandler.getInstance();

// Convenience functions
export const handleError = (error: unknown, context?: string) => 
  errorHandler.handleError(error, context);

export const handleErrorWithToast = (error: unknown, context?: string) => 
  errorHandler.handleErrorWithToast(error, context);

// React hook for error handling
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    return errorHandler.handleErrorWithToast(error, context);
  };

  const handleErrorSilently = (error: unknown, context?: string) => {
    return errorHandler.handleError(error, context);
  };

  return {
    handleError,
    handleErrorSilently,
    getRecentErrors: () => errorHandler.getRecentErrors(),
  };
}