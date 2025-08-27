"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isSuperAdminUser } from "@/lib/admin-auth";

export default function PlatformAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    averageTransactionValue: 0,
    userRetention: 0,
    platformUptime: 0,
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!isSuperAdminUser(session)) {
      router.push("/admin/dashboard");
      return;
    }

    // Load platform analytics data
    loadPlatformAnalytics();
  }, [session, status, router]);

  const loadPlatformAnalytics = async () => {
    try {
      // Fetch real data from multiple API endpoints
      const [usersResponse, transactionsResponse, referralsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/payments/transactions'),
        fetch('/api/admin/referrals/stats')
      ]);

      let totalUsers = 0;
      let activeUsers = 0;
      let newUsers = 0;
      let totalTransactions = 0;
      let totalRevenue = 0;
      let averageTransactionValue = 0;
      let userRetention = 0;
      let platformUptime = 99.9; // Hardcoded for now

      // Get user data
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('Users API response:', usersData);
        
        totalUsers = usersData.totalCount || usersData.users?.length || 0;
        activeUsers = usersData.users?.filter((user: any) => user.isActive)?.length || 0;
        
        // Calculate new users in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        newUsers = usersData.users?.filter((user: any) => 
          new Date(user.createdAt) >= thirtyDaysAgo
        )?.length || 0;
        
        console.log('Calculated metrics:', { totalUsers, activeUsers, newUsers });
      }

      // Get transaction data
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        totalTransactions = transactionsData.transactions?.length || 0;
        
        // Calculate revenue and average transaction value
        if (transactionsData.transactions && transactionsData.transactions.length > 0) {
          totalRevenue = transactionsData.transactions.reduce((sum: number, txn: any) => 
            sum + (txn.amount || 0), 0
          );
          averageTransactionValue = totalRevenue / totalTransactions;
        }
      }

      // Calculate user retention (simplified)
      userRetention = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

      setAnalyticsData({
        totalUsers,
        activeUsers,
        newUsers,
        totalTransactions,
        totalRevenue,
        averageTransactionValue,
        userRetention: Math.round(userRetention * 10) / 10, // Round to 1 decimal
        platformUptime,
      });
    } catch (error) {
      console.error("Error loading platform analytics:", error);
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
            Platform Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Comprehensive platform performance metrics and insights
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={loadPlatformAnalytics}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {analyticsData.totalUsers.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {analyticsData.activeUsers.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* New Users */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    New Users (30d)
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {analyticsData.newUsers.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Uptime */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Platform Uptime
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {analyticsData.platformUptime}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Revenue Metrics */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Revenue Metrics
            </h3>
            <div className="mt-5 space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Revenue:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  ${analyticsData.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Transactions:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {analyticsData.totalTransactions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Average Transaction:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  ${analyticsData.averageTransactionValue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Metrics */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              User Metrics
            </h3>
            <div className="mt-5 space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">User Retention:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {analyticsData.userRetention}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Active Rate:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {((analyticsData.activeUsers / analyticsData.totalUsers) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Growth Rate:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {((analyticsData.newUsers / analyticsData.totalUsers) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Performance Trends
            </h3>
            <div className="mt-5 h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">Performance charts will be displayed here</p>
                <p className="text-xs mt-1">User growth, revenue trends, and platform metrics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
