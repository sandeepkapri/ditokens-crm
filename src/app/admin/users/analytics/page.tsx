"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByCountry: { country: string; count: number }[];
  usersByRole: { role: string; count: number }[];
  userGrowth: { month: string; count: number }[];
  topReferrers: { name: string; referrals: number; earnings: number }[];
}

export default function UserAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<UserAnalytics>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    usersByCountry: [],
    usersByRole: [],
    userGrowth: [],
    topReferrers: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.email !== "admin@ditokens.com") {
      router.push("/auth/sign-in");
      return;
    }

    loadAnalytics();
  }, [status, session, router]);

  const loadAnalytics = async () => {
    try {
      // Mock data for demonstration
      setAnalytics({
        totalUsers: 1250,
        activeUsers: 1180,
        newUsersThisMonth: 45,
        usersByCountry: [
          { country: "United States", count: 450 },
          { country: "United Kingdom", count: 280 },
          { country: "Canada", count: 180 },
          { country: "Australia", count: 120 },
          { country: "Germany", count: 95 },
          { country: "Others", count: 125 },
        ],
        usersByRole: [
          { role: "USER", count: 1200 },
          { role: "ADMIN", count: 45 },
          { role: "MODERATOR", count: 5 },
        ],
        userGrowth: [
          { month: "Jan", count: 850 },
          { month: "Feb", count: 920 },
          { month: "Mar", count: 980 },
          { month: "Apr", count: 1050 },
          { month: "May", count: 1120 },
          { month: "Jun", count: 1180 },
          { month: "Jul", count: 1220 },
          { month: "Aug", count: 1250 },
        ],
        topReferrers: [
          { name: "John Doe", referrals: 25, earnings: 1250.00 },
          { name: "Jane Smith", referrals: 18, earnings: 900.00 },
          { name: "Mike Johnson", referrals: 15, earnings: 750.00 },
          { name: "Sarah Wilson", referrals: 12, earnings: 600.00 },
          { name: "David Brown", referrals: 10, earnings: 500.00 },
        ],
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
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
          <h2 className="text-title-md2 font-bold text-black dark:text-white">User Analytics</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive insights into user behavior and demographics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">Total Users</h3>
                <p className="text-3xl font-bold text-primary">{analytics.totalUsers.toLocaleString()}</p>
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
                <h3 className="text-lg font-medium text-black dark:text-white">Active Users</h3>
                <p className="text-3xl font-bold text-green-600">{analytics.activeUsers.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">New This Month</h3>
                <p className="text-3xl font-bold text-orange-600">{analytics.newUsersThisMonth}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Users by Country */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="p-4 border-b border-stroke dark:border-stroke-dark">
              <h3 className="text-lg font-medium text-black dark:text-white">Users by Country</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {analytics.usersByCountry.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.country}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(item.count / analytics.totalUsers) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-black dark:text-white">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Referrers */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="p-4 border-b border-stroke dark:border-stroke-dark">
              <h3 className="text-lg font-medium text-black dark:text-white">Top Referrers</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {analytics.topReferrers.map((referrer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-black dark:text-white">{referrer.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{referrer.referrals} referrals</p>
                    </div>
                    <span className="text-lg font-bold text-green-600">${referrer.earnings.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <div className="p-4 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">User Growth (Last 8 Months)</h3>
          </div>
          <div className="p-6">
            <div className="flex items-end justify-between h-64">
              {analytics.userGrowth.map((item, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div 
                    className="w-8 bg-primary rounded-t"
                    style={{ height: `${(item.count / Math.max(...analytics.userGrowth.map(g => g.count))) * 200}px` }}
                  ></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{item.month}</span>
                  <span className="text-xs font-medium text-black dark:text-white">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
