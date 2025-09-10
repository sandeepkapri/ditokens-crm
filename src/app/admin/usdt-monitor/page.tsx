"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdminUser } from "@/lib/admin-auth";

interface USDTTransaction {
  id: string;
  hash: string;
  amount: number;
  tokenAmount: number;
  status: string;
  paymentMethod: string;
  txHash: string | null;
  walletAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    usdtWalletAddress: string | null;
    isActive: boolean;
  };
}

interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  totalTokens: number;
  pendingCount: number;
  failedCount: number;
}

export default function USDTMonitorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<USDTTransaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
      return;
    }
    
    if (!isAdminUser(session)) {
      router.push("/dashboard");
      return;
    }
    
    if (session?.user) {
      loadTransactions();
    }
  }, [status, router, session, currentPage, searchTerm, statusFilter]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        status: statusFilter,
        search: searchTerm
      });

      const response = await fetch(`/api/admin/usdt-transactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setSummary(data.summary);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Failed to load USDT transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (transactionId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/admin/usdt-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update_status",
          transactionId,
          status: newStatus
        }),
      });

      if (response.ok) {
        loadTransactions();
        alert("Transaction status updated successfully");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update transaction status");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    }
  };

  const handleManualVerification = async (transactionId: string) => {
    try {
      const response = await fetch("/api/admin/usdt-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "manual_verification",
          transactionId
        }),
      });

      if (response.ok) {
        loadTransactions();
        alert("Transaction manually verified and completed");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to verify transaction");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    }
  };

  const startMonitoring = async () => {
    try {
      const response = await fetch("/api/admin/monitor-usdt", {
        method: "POST"
      });

      if (response.ok) {
        alert("USDT monitoring started successfully");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to start monitoring");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session || !isAdminUser(session)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">This page is only accessible to admins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-bold text-black dark:text-white">
          USDT Transaction Monitor
        </h2>
        <button
          onClick={startMonitoring}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Start Monitoring
        </button>
      </div>

      {/* Company Wallet Info */}
      <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Company USDT Wallet
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Wallet Address
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
              0x7E874A697007965c6A3DdB1702828A764E7a91c3
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              USDT Contract
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
              0xdAC17F958D2ee523a2206206994597C13D831ec7
            </p>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                Total Transactions
              </h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {summary.totalTransactions}
              </div>
            </div>
          </div>
          <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                Total Amount
              </h3>
              <div className="text-3xl font-bold text-green-600 mb-2">
                ${summary.totalAmount.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                Total Tokens
              </h3>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {summary.totalTokens.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                Pending
              </h3>
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {summary.pendingCount}
              </div>
            </div>
          </div>
          <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                Failed
              </h3>
              <div className="text-3xl font-bold text-red-600 mb-2">
                {summary.failedCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by hash, wallet, or user..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadTransactions}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          USDT Transactions
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Tokens</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Wallet</th>
                <th className="px-6 py-3">Hash</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {transaction.user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.user.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        {transaction.user.isActive ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">
                      ${transaction.amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {transaction.tokenAmount.toFixed(2)} DIT
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
                      {transaction.walletAddress || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
                      {transaction.txHash ? (
                        <a 
                          href={`https://etherscan.io/tx/${transaction.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {transaction.txHash.slice(0, 10)}...
                        </a>
                      ) : "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {transaction.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(transaction.id, "COMPLETED")}
                            className="text-green-600 hover:text-green-800 text-xs"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleManualVerification(transaction.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            Verify
                          </button>
                        </>
                      )}
                      {transaction.status === "PENDING" && (
                        <button
                          onClick={() => handleStatusUpdate(transaction.id, "FAILED")}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Fail
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
