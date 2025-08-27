"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isSuperAdminUser } from "@/lib/admin-auth";

export default function RevenueReports() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    transactionCount: 0,
    averageTransaction: 0,
    referralCommissions: 0,
    processingFees: 0,
    netRevenue: 0,
  });
  const [timeframe, setTimeframe] = useState("30d");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!isSuperAdminUser(session)) {
      router.push("/admin/dashboard");
      return;
    }

    // Load revenue data
    loadRevenueData();
  }, [session, status, router, timeframe]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from API endpoints
      const [transactionsResponse, referralsResponse] = await Promise.all([
        fetch('/api/admin/payments/transactions'),
        fetch('/api/admin/referrals/stats')
      ]);

      let totalRevenue = 0;
      let transactionCount = 0;
      let averageTransaction = 0;
      let referralCommissions = 0;
      let processingFees = 0;
      let netRevenue = 0;

      // Get transaction data
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        transactionCount = transactionsData.transactions?.length || 0;
        
        if (transactionsData.transactions && transactionsData.transactions.length > 0) {
          totalRevenue = transactionsData.transactions.reduce((sum: number, txn: any) => 
            sum + (txn.amount || 0), 0
          );
          averageTransaction = totalRevenue / transactionCount;
          
          // Calculate processing fees (simplified - 1.5% of transaction amount)
          processingFees = totalRevenue * 0.015;
        }
      }

      // Get referral commission data
      if (referralsResponse.ok) {
        const referralsData = await referralsResponse.json();
        referralCommissions = referralsData.stats?.totalCommissions || 0;
      }

      // Calculate net revenue
      netRevenue = totalRevenue - referralCommissions - processingFees;

      // Calculate monthly revenue based on timeframe
      let monthlyRevenue = totalRevenue;
      if (timeframe === "90d") {
        monthlyRevenue = totalRevenue / 3;
      } else if (timeframe === "1y") {
        monthlyRevenue = totalRevenue / 12;
      }

      setRevenueData({
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        transactionCount,
        averageTransaction: Math.round(averageTransaction * 100) / 100,
        referralCommissions: Math.round(referralCommissions * 100) / 100,
        processingFees: Math.round(processingFees * 100) / 100,
        netRevenue: Math.round(netRevenue * 100) / 100,
      });
    } catch (error) {
      console.error("Error loading revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      // Mock export functionality
      const csvContent = `Revenue Report (${timeframe})
Total Revenue,${revenueData.totalRevenue}
Monthly Revenue,${revenueData.monthlyRevenue}
Transaction Count,${revenueData.transactionCount}
Average Transaction,${revenueData.averageTransaction}
Referral Commissions,${revenueData.referralCommissions}
Processing Fees,${revenueData.processingFees}
Net Revenue,${revenueData.netRevenue}`;
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${timeframe}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isSuperAdminUser(session)) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Revenue Reports
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Comprehensive revenue analysis and financial reporting
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            type="button"
            onClick={exportReport}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
          >
            Export Report
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Revenue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    ${revenueData.totalRevenue.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Monthly Revenue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    ${revenueData.monthlyRevenue.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Count */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Transactions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {revenueData.transactionCount.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Net Revenue */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Net Revenue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    ${revenueData.netRevenue.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Revenue Breakdown */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Revenue Breakdown
            </h3>
            <div className="mt-5 space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Gross Revenue:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  ${revenueData.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Referral Commissions:</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  -${revenueData.referralCommissions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Processing Fees:</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  -${revenueData.processingFees.toLocaleString()}
                </span>
              </div>
              <hr className="border-gray-200 dark:border-gray-600" />
              <div className="flex justify-between font-medium">
                <span className="text-sm text-gray-900 dark:text-white">Net Revenue:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  ${revenueData.netRevenue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Metrics */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Transaction Metrics
            </h3>
            <div className="mt-5 space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Transactions:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {revenueData.transactionCount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Average Transaction:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  ${revenueData.averageTransaction.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Revenue per Transaction:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  ${(revenueData.totalRevenue / revenueData.transactionCount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Net per Transaction:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  ${(revenueData.netRevenue / revenueData.transactionCount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Revenue Trends
            </h3>
            <div className="mt-5 h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">Revenue charts will be displayed here</p>
                <p className="text-xs mt-1">Monthly trends, growth patterns, and forecasting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
