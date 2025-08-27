"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isAdminUser } from "@/lib/admin-auth";

export default function AdminAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!isAdminUser(session)) {
      router.push("/auth/sign-in");
      return;
    }

    // Load analytics data
    loadAnalyticsData();
  }, [session, status, router]);

  const loadAnalyticsData = async () => {
    try {
      // Fetch real data from API endpoints
      const [usersResponse, transactionsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/payments/transactions')
      ]);

      let totalUsers = 0;
      let activeUsers = 0;
      let totalTransactions = 0;
      let totalRevenue = 0;
      let monthlyGrowth = 0;

      // Get user data
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('Users API response (main analytics):', usersData);
        
        totalUsers = usersData.totalCount || usersData.users?.length || 0;
        activeUsers = usersData.users?.filter((user: any) => user.isActive)?.length || 0;
        
        console.log('Calculated metrics (main analytics):', { totalUsers, activeUsers });
      }

      // Get transaction data
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        totalTransactions = transactionsData.transactions?.length || 0;
        
        if (transactionsData.transactions && transactionsData.transactions.length > 0) {
          totalRevenue = transactionsData.transactions.reduce((sum: number, txn: any) => 
            sum + (txn.amount || 0), 0
          );
        }
      }

      // Calculate monthly growth (simplified)
      monthlyGrowth = totalUsers > 0 ? ((activeUsers / totalUsers) * 100) : 0;

      setAnalyticsData({
        totalUsers,
        activeUsers,
        totalTransactions,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAdminUser(session)) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            System Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Comprehensive overview of platform performance and user metrics
          </p>
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

        {/* Total Transactions */}
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
                    Total Transactions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {analyticsData.totalTransactions.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Growth */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Monthly Growth
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {analyticsData.monthlyGrowth}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Platform Overview
            </h3>
            <div className="mt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    User Engagement
                  </h4>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {((analyticsData.activeUsers / analyticsData.totalUsers) * 100).toFixed(1)}% of users are active
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Average Revenue per User
                  </h4>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    ${(analyticsData.totalRevenue / analyticsData.totalUsers).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
