"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isAdminUser } from "@/lib/admin-auth";

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
}

export default function PendingPayments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!isAdminUser(session)) {
      router.push("/auth/sign-in");
      return;
    }

    loadPendingTransactions();
  }, [status, session, router]);

  const loadPendingTransactions = async () => {
    try {
      const response = await fetch('/api/admin/payments/pending');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      } else {
        console.error('Failed to load pending transactions');
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error loading pending transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async (transactionId: string, action: 'confirm' | 'reject', adminNotes?: string) => {
    setProcessing(transactionId);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          action,
          adminNotes
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message
        });
        // Reload transactions
        await loadPendingTransactions();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to process payment'
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setMessage({
        type: 'error',
        text: 'Failed to process payment'
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
            Pending Payments
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review and confirm pending token purchases
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

        {/* Pending Transactions */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <div className="p-4 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">
              Pending Token Purchases ({transactions.length})
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
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Wallet Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
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
                        {transaction.paymentMethod.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900 dark:text-white font-mono">
                            {transaction.walletAddress.slice(0, 10)}...{transaction.walletAddress.slice(-6)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(transaction.walletAddress)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            Copy
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePaymentAction(transaction.id, 'confirm')}
                            disabled={processing === transaction.id}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs"
                          >
                            {processing === transaction.id ? 'Processing...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection:');
                              if (reason) {
                                handlePaymentAction(transaction.id, 'reject', reason);
                              }
                            }}
                            disabled={processing === transaction.id}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs"
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
                All payments have been processed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
