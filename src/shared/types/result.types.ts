/**
 * Canonical Result type for success/error responses
 * Used across all services in the application
 *
 * Pattern: NEVER throw from services - always return Result<T> objects
 */

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }
