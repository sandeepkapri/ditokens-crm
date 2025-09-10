"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isAdminUser } from "@/lib/admin-auth";

interface WithdrawalWallet {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  address: string;
  network: string;
  label: string;
  isActive: boolean;
  isVerified: boolean;
  lastUsed: string | null;
  createdAt: string;
}

export default function ManageWalletsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wallets, setWallets] = useState<WithdrawalWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'unverified' | 'verified'>('unverified');

  useEffect(() => {
    if (status === "loading") return;
    
    if (!isAdminUser(session)) {
      router.push("/auth/sign-in");
      return;
    }

    loadWallets();
  }, [status, session, router]);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/wallets/manage');
      if (response.ok) {
        const data = await response.json();
        setWallets(data.wallets || []);
      } else {
        console.error('Failed to load wallets');
        setWallets([]);
      }
    } catch (error) {
      console.error("Error loading wallets:", error);
      setWallets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyWallet = async (walletId: string) => {
    setProcessing(walletId);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/wallets/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletId,
          action: 'verify'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message
        });
        await loadWallets();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to verify wallet'
        });
      }
    } catch (error) {
      console.error('Error verifying wallet:', error);
      setMessage({
        type: 'error',
        text: 'Failed to verify wallet'
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectWallet = async (walletId: string) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    setProcessing(walletId);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/wallets/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletId,
          action: 'reject',
          reason
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message
        });
        await loadWallets();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to reject wallet'
        });
      }
    } catch (error) {
      console.error('Error rejecting wallet:', error);
      setMessage({
        type: 'error',
        text: 'Failed to reject wallet'
      });
    } finally {
      setProcessing(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({
      type: 'success',
      text: 'Copied to clipboard!'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredWallets = wallets.filter(wallet => {
    switch (filter) {
      case 'unverified':
        return !wallet.isVerified;
      case 'verified':
        return wallet.isVerified;
      default:
        return true;
    }
  });

  if (status === "loading" || loading) {
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
            Manage User Wallets
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Verify and manage user withdrawal wallets
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setFilter('unverified')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'unverified'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Unverified ({wallets.filter(w => !w.isVerified).length})
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'verified'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Verified ({wallets.filter(w => w.isVerified).length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All ({wallets.length})
            </button>
          </div>
        </div>

        {/* Wallets Table */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <div className="p-6 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">
              User Withdrawal Wallets ({filteredWallets.length})
            </h3>
          </div>

          {filteredWallets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Wallet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Network
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-box-dark divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredWallets.map((wallet) => (
                    <tr key={wallet.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {wallet.userName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {wallet.userEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {wallet.label}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                              {wallet.address.slice(0, 10)}...{wallet.address.slice(-6)}
                            </span>
                            <button
                              onClick={() => copyToClipboard(wallet.address)}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {wallet.network.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            wallet.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {wallet.isActive ? "Active" : "Inactive"}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            wallet.isVerified ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {wallet.isVerified ? "Verified" : "Unverified"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(wallet.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!wallet.isVerified ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleVerifyWallet(wallet.id)}
                              disabled={processing === wallet.id}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs"
                            >
                              {processing === wallet.id ? 'Processing...' : 'Verify'}
                            </button>
                            <button
                              onClick={() => handleRejectWallet(wallet.id)}
                              disabled={processing === wallet.id}
                              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-green-600 text-xs">Verified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No wallets found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filter === 'unverified' ? 'No unverified wallets.' : 'No wallets match your filter.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
