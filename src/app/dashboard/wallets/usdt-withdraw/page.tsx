"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UserStats {
  totalTokens: number;
  stakedTokens: number;
  availableTokens: number;
  usdtBalance: number;
  totalEarnings: number;
  referralEarnings: number;
  isActive: boolean;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  walletAddress: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  requestDate: string;
  processedDate?: string;
  lockPeriod: number;
  canWithdraw: boolean;
}

export default function USDTWithdrawPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
    }
    
    if (session?.user) {
      loadUserData();
    }
  }, [status, router, session]);

  const loadUserData = async () => {
    try {
      const [portfolioResponse, withdrawalsResponse] = await Promise.all([
        fetch("/api/tokens/portfolio"),
        fetch("/api/usdt/withdrawals")
      ]);

      if (portfolioResponse.ok) {
        const portfolioData = await portfolioResponse.json();
        setUserStats(portfolioData.stats);
      }

      if (withdrawalsResponse.ok) {
        const withdrawalsData = await withdrawalsResponse.json();
        setWithdrawalHistory(withdrawalsData.withdrawals || []);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const handleWithdrawAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setWithdrawAmount(value);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!walletAddress.trim()) {
      setError("Please enter a valid wallet address");
      return;
    }

    if (parseFloat(withdrawAmount) > (userStats?.usdtBalance || 0)) {
      setError("Insufficient USDT balance");
      return;
    }

    if (parseFloat(withdrawAmount) < 10) {
      setError("Minimum withdrawal amount is $10");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/usdt/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          walletAddress: walletAddress.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`USDT withdrawal request created successfully! Amount: $${data.withdrawalRequest.amount.toFixed(2)} to ${data.withdrawalRequest.walletAddress}`);
        setWithdrawAmount("");
        setWalletAddress("");
        // Reload user data
        setTimeout(() => {
          loadUserData();
        }, 1000);
      } else {
        setError(data.error || "Withdrawal request failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-bold text-black dark:text-white">
            Withdraw USDT
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Withdraw your USDT balance to your wallet
          </p>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
            <div className="text-sm text-green-700">{message}</div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Balance Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-2 2xl:gap-7.5 mb-6">
          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-2">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  ${(userStats?.usdtBalance || 0).toFixed(2)}
                </h4>
                <span className="text-sm font-medium">Available USDT Balance</span>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  $10.00
                </h4>
                <span className="text-sm font-medium">Minimum Withdrawal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <h3 className="text-lg font-medium text-black dark:text-white mb-4">
              Withdraw USDT
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount to Withdraw (USDT)
                </label>
                <input
                  type="text"
                  value={withdrawAmount}
                  onChange={handleWithdrawAmountChange}
                  placeholder="Enter amount in USDT"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Available: ${(userStats?.usdtBalance || 0).toFixed(2)} USDT
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter your USDT wallet address"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Make sure this is a valid USDT wallet address
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount to Withdraw:</span>
                    <span className="font-medium text-black dark:text-white">
                      ${withdrawAmount || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Wallet Address:</span>
                    <span className="font-medium text-black dark:text-white text-xs">
                      {walletAddress ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-10)}` : "Not entered"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Remaining Balance:</span>
                    <span className="font-medium text-black dark:text-white">
                      ${((userStats?.usdtBalance || 0) - parseFloat(withdrawAmount || "0")).toFixed(2)} USDT
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={isLoading || !withdrawAmount || !walletAddress || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > (userStats?.usdtBalance || 0)}
                className="w-full bg-primary text-white py-3 px-6 rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Processing...
                  </>
                ) : (
                  `Withdraw ${withdrawAmount || "0"} USDT`
                )}
              </button>
            </div>
          </div>

          {/* Information */}
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <h3 className="text-lg font-medium text-black dark:text-white mb-4">
              Withdrawal Information
            </h3>
            
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Withdrawal requests are processed manually by administrators
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Minimum withdrawal amount is $10 USDT
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Make sure the wallet address is correct and supports USDT
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Processing time varies depending on network conditions
              </li>
            </ul>
          </div>

          {/* Withdrawal History */}
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <h3 className="text-lg font-medium text-black dark:text-white mb-4">
              Withdrawal History
            </h3>
            
            {withdrawalHistory.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">No withdrawal requests yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your withdrawal history will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Wallet Address</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Request Date</th>
                      <th className="px-6 py-3">Processed Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalHistory.map((withdrawal) => (
                      <tr key={withdrawal.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            ${withdrawal.amount.toFixed(2)} USDT
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white text-xs">
                            {withdrawal.walletAddress.slice(0, 10)}...{withdrawal.walletAddress.slice(-10)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            withdrawal.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-800' 
                              : withdrawal.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : withdrawal.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {withdrawal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 dark:text-white">
                            {new Date(withdrawal.requestDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(withdrawal.requestDate).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {withdrawal.processedDate ? (
                            <>
                              <div className="text-gray-900 dark:text-white">
                                {new Date(withdrawal.processedDate).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(withdrawal.processedDate).toLocaleTimeString()}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
