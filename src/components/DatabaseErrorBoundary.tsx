'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
}

export class DatabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a database connection error
    const isDatabaseError = error.message?.toLowerCase().includes('database') ||
                           error.message?.toLowerCase().includes('connection') ||
                           error.message?.toLowerCase().includes('unavailable');
    
    return {
      hasError: isDatabaseError,
      error: isDatabaseError ? error : null,
      isRetrying: false
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Database Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true });
    
    try {
      // Test database connection
      const response = await fetch('/api/health/database');
      const healthStatus = await response.json();
      
      if (healthStatus.isConnected) {
        this.setState({ hasError: false, error: null, isRetrying: false });
        // Reload the page to retry
        window.location.reload();
      } else {
        this.setState({ isRetrying: false });
      }
    } catch (error) {
      console.error('Retry failed:', error);
      this.setState({ isRetrying: false });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <div className="w-8 h-8 text-red-600 text-2xl">⚠️</div>
            </div>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Database Connection Issue
              </h2>
              
              <p className="text-gray-600 mb-6">
                We&apos;re experiencing temporary connectivity issues with our database. 
                This usually resolves itself quickly.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {this.state.isRetrying ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Checking Connection...
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 mr-2">🔄</div>
                      Try Again
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Refresh Page
                </button>
              </div>
              
              <div className="mt-6 p-3 bg-yellow-50 rounded-md">
                <div className="flex items-start">
                  <div className="w-5 h-5 text-yellow-600 mt-0.5 mr-2">⚠️</div>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">What you can do:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Wait a moment and try again</li>
                      <li>Check your internet connection</li>
                      <li>Contact support if the issue persists</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling database errors in functional components
export function useDatabaseErrorHandler() {
  const handleApiError = (error: any, showToast?: (message: string) => void) => {
    if (error?.type === 'database_error' || 
        error?.message?.toLowerCase().includes('database') ||
        error?.message?.toLowerCase().includes('connection')) {
      
      const message = error.message || 'Database service is temporarily unavailable. Please try again later.';
      
      if (showToast) {
        showToast(message);
      } else {
        // Fallback to alert if no toast function provided
        alert(message);
      }
      
      return true; // Indicates this was a database error
    }
    
    return false; // Not a database error
  };

  return { handleApiError };
}
