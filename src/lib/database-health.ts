import { prisma } from './prisma';

export interface DatabaseHealthStatus {
  isConnected: boolean;
  error?: string;
  timestamp: string;
}

/**
 * Check if the database connection is healthy
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  try {
    // Simple query to test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return {
      isConnected: true,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('Database health check failed:', error);
    
    return {
      isConnected: false,
      error: error.message || 'Database connection failed',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check if the error is a database connection error
 */
export function isDatabaseConnectionError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  // Common database connection error patterns
  const connectionErrorPatterns = [
    'can\'t reach database server',
    'connection refused',
    'connection timeout',
    'database server is running',
    'connection lost',
    'connection closed',
    'connection reset',
    'host not found',
    'network unreachable',
    'timeout',
    'econnrefused',
    'econnreset',
    'enotfound',
    'etimedout'
  ];
  
  return connectionErrorPatterns.some(pattern => 
    errorMessage.includes(pattern) || errorCode.includes(pattern)
  );
}

/**
 * Get user-friendly error message for database connection issues
 */
export function getDatabaseErrorMessage(error: any): string {
  if (isDatabaseConnectionError(error)) {
    return 'Database service is temporarily unavailable. Please try again later or contact support if the issue persists.';
  }
  
  return 'An unexpected error occurred. Please try again later.';
}

/**
 * Handle database operations with proper error handling
 */
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  fallbackValue?: T
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error: any) {
    console.error('Database operation failed:', error);
    
    if (isDatabaseConnectionError(error)) {
      return {
        success: false,
        error: getDatabaseErrorMessage(error),
        data: fallbackValue
      };
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again later.'
    };
  }
}
