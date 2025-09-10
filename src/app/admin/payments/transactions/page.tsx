"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdminUser } from "@/lib/admin-auth";

interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  paymentMethod: string;
  reference: string;
}

export default function TransactionHistory() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || !isAdminUser(session)) {
      router.push("/auth/sign-in");
      return;
    }

    loadTransactions();
  }, [status, session, router]);

  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/admin/transactions');
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
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filter === "all" || transaction.status.toLowerCase() === filter.toLowerCase();
    const matchesSearch = transaction.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "TOKEN_PURCHASE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "WITHDRAWAL":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "REFERRAL_COMMISSION":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "STAKING_REWARD":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !isAdminUser(session)) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-title-md2 font-bold text-black dark:text-white">Transaction History</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Monitor all system transactions and payment activities
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by email, description, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Transaction Table */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <div className="p-4 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">
              All Transactions ({filteredTransactions.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-box-dark divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-black dark:text-white">
                          {transaction.reference}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {transaction.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-black dark:text-white">{transaction.userEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(transaction.type)}`}>
                        {transaction.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-black dark:text-white">
                        ${transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {transaction.paymentMethod}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-black dark:text-white">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.createdAt).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex space-x-2">
                        <button className="text-primary hover:text-primary-dark text-sm font-medium">
                          View
                        </button>
                        {transaction.status === "PENDING" && (
                          <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No transactions found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
