"use client";

import { useSession } from "next-auth/react";
import { isSuperAdminUser } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number; // Amount in USD (for USDT) or DIT tokens (for DIT)
  tokenAmount?: number; // DIT tokens (for DIT withdrawals)
  usdAmount?: number; // USD value (for DIT withdrawals)
  network: string;
  address: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING";
  fee: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminWithdrawalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all"); // all, usdt, dit

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
      return;
    }
    
    if (!isSuperAdminUser(session)) {
      router.push("/admin/dashboard");
      return;
    }
    
    if (session?.user) {
      loadWithdrawalData();
    }
  }, [status, session]);

  const loadWithdrawalData = async () => {
    try {
      const response = await fetch("/api/admin/payments/withdrawals-admin");
      
      if (response.ok) {
        const data = await response.json();
        setWithdrawalRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to load withdrawal data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawalAction = async (requestId: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/admin/payments/withdrawals-admin/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        loadWithdrawalData(); // Reload data
        alert(`Withdrawal ${action}ed successfully`);
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${action} withdrawal`);
      }
    } catch (error) {
      alert(`Network error. Please try again.`);
    }
  };

  const filteredWithdrawals = withdrawalRequests.filter(request => {
    const matchesStatus = filterStatus === "all" || request.status === filterStatus.toUpperCase();
    const matchesType = filterType === "all" || 
      (filterType === "usdt" && request.network === "USDT") ||
      (filterType === "dit" && request.network !== "USDT");
    
    return matchesStatus && matchesType;
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || !isSuperAdminUser(session)) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-title-md2 font-bold text-black dark:text-white">
            Withdrawal Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Approve or reject withdrawal requests from users
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Withdrawals
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {filteredWithdrawals.filter(r => r.status === "PENDING").length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  {filteredWithdrawals.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Approved Today
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {filteredWithdrawals.filter(r => 
                    r.status === "APPROVED" && 
                    new Date(r.createdAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Amount
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  ${filteredWithdrawals
                    .filter(r => r.status === "PENDING")
                    .reduce((sum, r) => {
                      // For USDT withdrawals, amount is already in USD
                      // For DIT withdrawals, use usdAmount or amount
                      return sum + (r.network === "USDT" ? r.amount : (r.usdAmount || r.amount));
                    }, 0)
                    .toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Requests */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-black dark:text-white">
              Withdrawal Requests
            </h3>
            <div className="flex space-x-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="usdt">USDT Only</option>
                <option value="dit">DIT Only</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="processing">Processing</option>
              </select>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
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
                      Network
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
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
                  {filteredWithdrawals.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {request.userName}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {request.userEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {request.network === "USDT" ? (
                          <div className="font-medium">
                            ${request.amount.toFixed(2)} USDT
                          </div>
                        ) : (
                          <>
                            <div className="font-medium">
                              {request.tokenAmount?.toFixed(2) || request.amount.toFixed(2)} DIT
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ${request.usdAmount?.toFixed(2) || request.amount.toFixed(2)} USD
                            </div>
                          </>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Fee: ${request.fee.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                        {request.network}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {request.address.substring(0, 8)}...{request.address.substring(request.address.length - 6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === "APPROVED" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                          request.status === "PENDING" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                          request.status === "REJECTED" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="text-gray-900 dark:text-white">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                        {request.status === "APPROVED" && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Approved: {new Date(request.updatedAt).toLocaleDateString()}
                          </div>
                        )}
                        {request.status === "REJECTED" && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            Rejected: {new Date(request.updatedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === "PENDING" && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleWithdrawalAction(request.id, "approve")}
                              className="text-green-600 hover:text-green-800"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleWithdrawalAction(request.id, "reject")}
                              className="text-red-600 hover:text-red-800"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {request.status === "APPROVED" && (
                          <span className="text-green-600">Approved</span>
                        )}
                        {request.status === "REJECTED" && (
                          <span className="text-red-600">Rejected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredWithdrawals.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No withdrawal requests found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {filterStatus === "all" ? "No withdrawal requests yet." : `No ${filterStatus} withdrawal requests.`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
