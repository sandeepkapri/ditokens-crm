/**
 * Utility functions for consistent date handling across the application
 * All dates are handled in UTC to prevent timezone issues
 */

/**
 * Gets the current date in UTC (server timezone independent)
 */
export function getCurrentUTCDate(): Date {
  return new Date();
}

/**
 * Gets today's date string in YYYY-MM-DD format (UTC)
 */
export function getTodayString(): string {
  const now = getCurrentUTCDate();
  return now.toISOString().split('T')[0];
}

/**
 * Normalizes a date to the start of the day in UTC
 * This prevents timezone issues when storing dates in the database
 */
export function normalizeToStartOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Use UTC methods to avoid timezone conversion issues
  return new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));
}

/**
 * Gets the start of today in UTC
 */
export function getStartOfToday(): Date {
  const today = getCurrentUTCDate();
  return normalizeToStartOfDay(today);
}

/**
 * Gets the date range for today (start and end of day in UTC)
 */
export function getTodayRange(): { start: Date; end: Date } {
  const todayStr = getTodayString();
  const start = new Date(todayStr + 'T00:00:00.000Z');
  const end = new Date(todayStr + 'T23:59:59.999Z');
  return { start, end };
}

/**
 * Gets the date range for a specific day (start and end of day in UTC)
 */
export function getDayRange(date: Date | string): { start: Date; end: Date } {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  const start = new Date(dateStr + 'T00:00:00.000Z');
  const end = new Date(dateStr + 'T23:59:59.999Z');
  return { start, end };
}

/**
 * Formats a date for display in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Checks if two dates are on the same day (ignoring time)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  const normalized1 = normalizeToStartOfDay(date1);
  const normalized2 = normalizeToStartOfDay(date2);
  return normalized1.getTime() === normalized2.getTime();
}

/**
 * Checks if a date is today (in UTC)
 */
export function isToday(date: Date): boolean {
  const todayStr = getTodayString();
  const dateStr = date.toISOString().split('T')[0];
  return todayStr === dateStr;
}
