"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface WalletSummary {
  totalDeposits: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  activeDepositWallets: number;
  activeWithdrawalWallets: number;
  lastDeposit: string | null;
  lastWithdrawal: string | null;
}

export default function WalletsOverviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [walletSummary, setWalletSummary] = useState<WalletSummary>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    activeDepositWallets: 1, // Only USDT wallet
    activeWithdrawalWallets: 0, // No withdrawal wallets for users
    lastDeposit: null,
    lastWithdrawal: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
    }
    
    if (session?.user) {
      loadWalletSummary();
    }
  }, [status, router, session]);

  const loadWalletSummary = async () => {
    try {
      // Load deposit data
      const depositResponse = await fetch("/api/wallets/deposit");
      const depositData = depositResponse.ok ? await depositResponse.json() : { wallets: [], transactions: [] };
      
      // Load withdrawal data
      const withdrawalResponse = await fetch("/api/wallets/withdrawal");
      const withdrawalData = withdrawalResponse.ok ? await withdrawalResponse.json() : { wallets: [], requests: [] };

      // Calculate summary
      const summary: WalletSummary = {
        totalDeposits: depositData.transactions?.reduce((sum: number, tx: any) => sum + tx.amount, 0) || 0,
        totalWithdrawals: withdrawalData.requests?.reduce((sum: number, req: any) => 
          req.status === "COMPLETED" ? sum + req.amount : sum, 0) || 0,
        pendingWithdrawals: withdrawalData.requests?.filter((req: any) => 
          req.status === "PENDING" || req.status === "PROCESSING").length || 0,
        activeDepositWallets: depositData.wallets?.filter((w: any) => w.isActive).length || 0,
        activeWithdrawalWallets: withdrawalData.wallets?.filter((w: any) => w.isVerified).length || 0,
        lastDeposit: depositData.transactions?.[0]?.timestamp || null,
        lastWithdrawal: withdrawalData.requests?.[0]?.timestamp || null,
      };

      setWalletSummary(summary);
    } catch (error) {
      console.error("Failed to load wallet summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
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
        <div className="mb-6">
          <h2 className="text-title-md2 font-bold text-black dark:text-white">
            Wallet Overview
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Manage your cryptocurrency wallets for deposits and withdrawals
          </p>
        </div>

        {/* Wallet Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Deposits
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {(walletSummary.totalDeposits || 0).toFixed(6)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Withdrawals
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {(walletSummary.totalWithdrawals || 0).toFixed(6)}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Wallets
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {walletSummary.activeDepositWallets + walletSummary.activeWithdrawalWallets}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Withdrawals
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {walletSummary.pendingWithdrawals}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* USDT Wallet Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-black dark:text-white">
              💰 USDT Deposit to DiTokens
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ERC-20
            </span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Send USDT to DiTokens company wallet to automatically receive DIT tokens
          </p>

            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 w-24">Company Wallet:</span>
                <span className="text-black dark:text-white font-mono text-xs">
                  0x7E874A697007965c6A3DdB1702828A764E7a91c3
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 w-24">Last Deposit:</span>
                <span className="text-black dark:text-white">
                  {walletSummary.lastDeposit 
                    ? new Date(walletSummary.lastDeposit).toLocaleDateString()
                    : "Never"
                  }
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/dashboard/wallets/deposit"
                className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-4 text-center font-medium text-white hover:bg-opacity-90"
              >
                Deposit USDT
              </Link>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-black dark:text-white">
                📤 USDT Withdrawal
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Request Only
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Request USDT withdrawal from your DIT tokens (3-year lock applies)
            </p>

            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 w-24">Last Withdrawal:</span>
                <span className="text-black dark:text-white">
                  {walletSummary.lastWithdrawal 
                    ? new Date(walletSummary.lastWithdrawal).toLocaleDateString()
                    : "Never"
                  }
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 w-24">Pending:</span>
                <span className="text-black dark:text-white">
                  {walletSummary.pendingWithdrawals} requests
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/dashboard/wallets/withdrawal"
                className="inline-flex items-center justify-center rounded-md bg-success py-2 px-4 text-center font-medium text-white hover:bg-opacity-90"
              >
                Manage Withdrawals
              </Link>
            </div>
          </div>
        </div>

        {/* USDT Information */}
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <h3 className="text-lg font-medium text-black dark:text-white mb-4">
            💰 USDT ERC-20 Payment
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-4xl mb-2">💚</div>
              <h4 className="font-medium text-black dark:text-white text-lg">USDT (Tether)</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">ERC-20 on Ethereum</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Send USDT to our company wallet to automatically receive DIT tokens
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 w-20">Network:</span>
                <span className="text-black dark:text-white font-medium">Ethereum (ERC-20)</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 w-20">Contract:</span>
                <span className="text-black dark:text-white font-mono text-xs">
                  0xdAC17F958D2ee523a2206206994597C13D831ec7
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 w-20">Company:</span>
                <span className="text-black dark:text-white font-mono text-xs">
                  0x7E874A697007965c6A3DdB1702828A764E7a91c3
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 w-20">Confirmations:</span>
                <span className="text-black dark:text-white">3 blocks required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="mt-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <h3 className="text-lg font-medium text-black dark:text-white mb-4">
            ⚠️ Important USDT Information
          </h3>
          
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong>Only send USDT (ERC-20)</strong> to our company wallet. Other tokens will be lost.
              </div>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong>Wait for 3 confirmations</strong> (5-10 minutes) before tokens are credited to your account.
              </div>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <strong>Ethereum network fees</strong> apply for USDT transactions. Check gas fees before sending.
              </div>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <strong>Automatic processing:</strong> DIT tokens are credited automatically after confirmation.
              </div>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong>Withdrawal lock:</strong> Withdrawn tokens have a 3-year lock period before they can be used.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
