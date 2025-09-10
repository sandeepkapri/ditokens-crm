"use client";

import { useEffect, useState } from "react";

interface AccountStatus {
  isActive: boolean;
  availableTokens: number;
}

export default function AccountStatusAlert() {
  const [accountStatus, setAccountStatus] = useState<AccountStatus>({ isActive: true, availableTokens: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAccountStatus();
  }, []);

  const checkAccountStatus = async () => {
    try {
      const response = await fetch("/api/tokens/portfolio");
      if (response.ok) {
        const data = await response.json();
        setAccountStatus({
          isActive: data.isActive === true,
          availableTokens: data.availableTokens || 0
        });
      } else if (response.status === 403) {
        setAccountStatus({
          isActive: false,
          availableTokens: 0
        });
      }
    } catch (error) {
      console.error("Failed to check account status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (accountStatus.isActive) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 shadow-sm">
      <div className="flex items-center">
        <svg className="w-5 h-5 mr-3 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
            Account Not Active
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            Your account is currently inactive. Please contact support to activate your account to access all features.
          </p>
        </div>
      </div>
    </div>
  );
}
