"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTokens: number;
  totalTokensValue: number;
  totalStaked: number;
  totalStakedValue: number;
  totalTransactions: number;
  pendingWithdrawals: number;
  totalReferrals: number;
  totalCommissions: number;
  newUsersThisMonth: number;
  transactionsThisMonth: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
  amount: number | null;
  status: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTokens: 0,
    totalTokensValue: 0,
    totalStaked: 0,
    totalStakedValue: 0,
    totalTransactions: 0,
    pendingWithdrawals: 0,
    totalReferrals: 0,
    totalCommissions: 0,
    newUsersThisMonth: 0,
    transactionsThisMonth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.email !== "admin@ditokens.com") {
      router.push("/auth/sign-in");
      return;
    }

    loadAdminData();
  }, [status, session, router]);

  const loadAdminData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
      } else {
        console.error("Failed to fetch admin data");
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "USER_REGISTRATION":
        return "👤";
      case "TOKEN_PURCHASE":
        return "💰";
      case "WITHDRAWAL":
        return "💸";
      case "REFERRAL_COMMISSION":
        return "🎯";
      case "STAKING":
        return "🔒";
      case "STAKING_REWARD":
        return "🎁";
      default:
        return "📝";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
      case "SUCCESS":
      case "PAID":
        return "text-green-600";
      case "PENDING":
        return "text-yellow-600";
      case "FAILED":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || session.user.email !== "admin@ditokens.com") {
    return null;
  }

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-title-md2 font-bold text-black dark:text-white">Superadmin Dashboard</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Welcome back, {session.user.name || "Admin"}. Manage your Ditokens CRM system.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">Total Users</h3>
                <p className="text-3xl font-bold text-primary">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  +{stats.newUsersThisMonth} this month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">Total Tokens</h3>
                <p className="text-3xl font-bold text-green-600">{stats.totalTokens.toLocaleString()}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ${stats.totalTokensValue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">Staked Tokens</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.totalStaked.toLocaleString()}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ${stats.totalStakedValue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">Transactions</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.totalTransactions.toLocaleString()}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  +{stats.transactionsThisMonth} this month
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="text-center">
              <h3 className="text-lg font-medium text-black dark:text-white mb-2">Active Users</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.activeUsers.toLocaleString()}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="text-center">
              <h3 className="text-lg font-medium text-black dark:text-white mb-2">Referrals</h3>
              <p className="text-2xl font-bold text-green-600">{stats.totalReferrals.toLocaleString()}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ${stats.totalCommissions.toFixed(2)} in commissions
              </p>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="text-center">
              <h3 className="text-lg font-medium text-black dark:text-white mb-2">Pending Actions</h3>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingWithdrawals.toLocaleString()}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Withdrawals to approve
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/users" className="block">
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default hover:shadow-lg transition-shadow dark:border-stroke-dark dark:bg-box-dark">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-black dark:text-white">User Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage {stats.totalUsers} users</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/payments" className="block">
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default hover:shadow-lg transition-shadow dark:border-stroke-dark dark:bg-box-dark">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-black dark:text-white">Payment Approvals</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stats.pendingWithdrawals} pending</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/tokens" className="block">
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default hover:shadow-lg transition-shadow dark:border-stroke-dark dark:bg-box-dark">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-black dark:text-white">Token Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stats.totalTokens.toLocaleString()} total tokens</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/referrals" className="block">
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default hover:shadow-lg transition-shadow dark:border-stroke-dark dark:bg-box-dark">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-black dark:text-white">Referral System</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stats.totalReferrals} referrals</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/staking" className="block">
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default hover:shadow-lg transition-shadow dark:border-stroke-dark dark:bg-box-dark">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-black dark:text-white">Staking Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stats.totalStaked.toLocaleString()} staked</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/history" className="block">
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default hover:shadow-lg transition-shadow dark:border-stroke-dark dark:bg-box-dark">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-black dark:text-white">Change History</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Track all changes</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <div className="p-4 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">Recent Activity</h3>
          </div>
          {recentActivity.length > 0 ? (
            <div className="p-4">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black dark:text-white">{activity.description}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {activity.amount && (
                        <p className="text-sm font-medium text-black dark:text-white">
                          ${activity.amount.toFixed(2)}
                        </p>
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No recent activity found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
