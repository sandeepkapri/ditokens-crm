"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isSuperAdminUser } from "@/lib/admin-auth";

interface PendingTransaction {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  tokenAmount: number;
  paymentMethod: string;
  walletAddress: string;
  createdAt: string;
  description: string;
  trackingInfo: {
    expectedAmount: number;
    expectedTokens: number;
    timeWindow: {
      start: string;
      end: string;
    };
  };
}

export default function PaymentTrackingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAmount, setSearchAmount] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchAmount) params.append('amount', searchAmount);
      if (searchDate) params.append('date', searchDate);
      
      const response = await fetch(`/api/admin/payment-tracking?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      } else {
        console.error('Failed to load transactions');
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [searchAmount, searchDate]);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!isSuperAdminUser(session)) {
      router.push("/admin/dashboard");
      return;
    }

    loadTransactions();
  }, [status, session?.user?.email, loadTransactions]);

  const handleSearch = () => {
    loadTransactions();
  };

  const handleConfirmPayment = async (transactionId: string) => {
    try {
      const response = await fetch('/api/admin/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          action: 'confirm',
          adminNotes: 'Payment confirmed via tracking system'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message
        });
        await loadTransactions();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to confirm payment'
        });
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      setMessage({
        type: 'error',
        text: 'Failed to confirm payment'
      });
    }
  };

  const handleRejectPayment = async (transactionId: string) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    try {
      const response = await fetch('/api/admin/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          action: 'reject',
          adminNotes: reason
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message
        });
        await loadTransactions();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to reject payment'
        });
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      setMessage({
        type: 'error',
        text: 'Failed to reject payment'
      });
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

  const isWithinTimeWindow = (transaction: PendingTransaction) => {
    const now = new Date();
    const start = new Date(transaction.trackingInfo.timeWindow.start);
    const end = new Date(transaction.trackingInfo.timeWindow.end);
    return now >= start && now <= end;
  };

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
            Payment Tracking
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track and verify pending payments
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

        {/* Search Filters */}
        <div className="mb-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <h3 className="text-lg font-medium text-black dark:text-white mb-4">
            Search Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={searchAmount}
                onChange={(e) => setSearchAmount(e.target.value)}
                placeholder="Enter amount to search"
                className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Wallet Address */}
        <div className="mb-6 rounded-sm border border-stroke bg-blue-50 p-4 dark:border-stroke-dark dark:bg-blue-900/20">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
            Company Wallet Address
          </h3>
          <div className="flex items-center space-x-2">
            <div className="flex-1 p-3 bg-white dark:bg-gray-800 rounded-lg font-mono text-sm break-all">
              0x7E874A697007965c6A3DdB1702828A764E7a91c3
            </div>
            <button
              onClick={() => copyToClipboard('0x7E874A697007965c6A3DdB1702828A764E7a91c3')}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Pending Transactions */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <div className="p-6 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">
              Pending Payments ({transactions.length})
            </h3>
          </div>

          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Time Window
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-box-dark divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.userName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.userEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {transaction.tokenAmount.toFixed(2)} DIT
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          <div>Start: {formatDate(transaction.trackingInfo.timeWindow.start)}</div>
                          <div>End: {formatDate(transaction.trackingInfo.timeWindow.end)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isWithinTimeWindow(transaction) 
                            ? 'text-green-600 bg-green-100' 
                            : 'text-yellow-600 bg-yellow-100'
                        }`}>
                          {isWithinTimeWindow(transaction) ? 'Active' : 'Expired'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleConfirmPayment(transaction.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleRejectPayment(transaction.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                          >
                            Reject
                          </button>
                        </div>
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
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pending payments</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchAmount || searchDate ? 'No payments match your search criteria.' : 'All payments have been processed.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
