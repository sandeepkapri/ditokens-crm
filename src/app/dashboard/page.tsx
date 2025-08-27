"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import charts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface UserStats {
  totalTokens: number;
  stakedTokens: number;
  availableTokens: number;
  totalEarnings: number; // Only price income, no staking rewards
  referralEarnings: number;
  isActive: boolean;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  tokenAmount: number;
  network: string;
  status: string;
  requestDate: string;
  canWithdraw: boolean;
  lockPeriod: number;
}

interface TokenPrice {
  date: string;
  price: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [tokenPrices, setTokenPrices] = useState<TokenPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(2.80);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/sign-in");
      return;
    }

    loadDashboardData();
  }, [status, session, router]);

  const loadDashboardData = async () => {
    try {
      const [portfolioResponse, withdrawalsResponse, pricesResponse] = await Promise.all([
        fetch("/api/tokens/portfolio"),
        fetch("/api/tokens/withdrawals"),
        fetch("/api/tokens/price")
      ]);

      if (portfolioResponse.ok) {
        const portfolioData = await portfolioResponse.json();
        setUserStats(portfolioData.stats);
      }

      if (withdrawalsResponse.ok) {
        const withdrawalsData = await withdrawalsResponse.json();
        setWithdrawalRequests(withdrawalsData.withdrawals || []);
      }

      if (pricesResponse.ok) {
        const pricesData = await pricesResponse.json();
        setTokenPrices(pricesData.prices || []);
        if (pricesData.prices && pricesData.prices.length > 0) {
          setCurrentPrice(pricesData.prices[0].price);
        }
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Chart data preparation
  const getTokenPriceChartData = () => {
    if (!tokenPrices || tokenPrices.length === 0) return { series: [], categories: [] };
    
    const sortedPrices = [...tokenPrices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const categories = sortedPrices.map(p => new Date(p.date).toLocaleDateString());
    const series = sortedPrices.map(p => p.price);
    
    return { series, categories };
  };

  const getPortfolioDistributionData = () => {
    if (!userStats) return [];
    
    return [
      { name: "Available Tokens", value: userStats.availableTokens || 0, color: "#10B981" },
      { name: "Staked Tokens", value: userStats.stakedTokens || 0, color: "#8B5CF6" },
      { name: "Referral Earnings", value: userStats.referralEarnings || 0, color: "#F59E0B" },
    ].filter(item => item.value > 0);
  };

  const getTransactionVolumeData = () => {
    // Mock data for transaction volume - in real app, fetch from API
    return {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      series: [
        {
          name: "Token Purchases",
          data: [65, 78, 90, 85, 95, 110]
        },
        {
          name: "Withdrawals",
          data: [25, 30, 35, 40, 45, 50]
        }
      ]
    };
  };

  const getUsersGrowthData = () => {
    // Mock data for user growth - in real app, fetch from API
    return {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      series: [120, 150, 180, 220, 280, 350]
    };
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const totalValue = (userStats?.totalTokens || 0) * currentPrice;
  const stakedValue = (userStats?.stakedTokens || 0) * currentPrice;
  const availableValue = (userStats?.availableTokens || 0) * currentPrice;

  const priceChartData = getTokenPriceChartData();
  const portfolioData = getPortfolioDistributionData();
  const transactionData = getTransactionVolumeData();
  const usersData = getUsersGrowthData();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-bold text-black dark:text-white">
          Dashboard
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Current Token Price:
          </span>
          <span className="text-lg font-bold text-blue-600">
            ${currentPrice}
          </span>
        </div>
      </div>

      {/* Account Status Alert */}
      {userStats && !userStats.isActive && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">⚠️</div>
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                Account Inactive
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Your account is currently inactive. Please contact support to activate your account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Token Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Total Tokens
            </h3>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {userStats?.totalTokens?.toLocaleString() || "0"}
            </div>
            <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
              ${totalValue.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Your complete token holdings
            </p>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Available Tokens
            </h3>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {userStats?.availableTokens?.toLocaleString() || "0"}
            </div>
            <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
              ${availableValue.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Ready for withdrawal
            </p>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Staked Tokens
            </h3>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {userStats?.stakedTokens?.toLocaleString() || "0"}
            </div>
            <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
              ${stakedValue.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Locked in staking (no income)
            </p>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Total Earnings
            </h3>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              ${(userStats?.totalEarnings || 0).toLocaleString()}
            </div>
            <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
              Referral: ${(userStats?.referralEarnings || 0).toLocaleString()}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Price income only - no staking rewards
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Token Price Trend Chart */}
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Token Price Trend
          </h3>
          {priceChartData.series.length > 0 ? (
            <Chart
              options={{
                chart: {
                  type: 'line',
                  toolbar: { show: false },
                  zoom: { enabled: false }
                },
                colors: ['#3B82F6'],
                xaxis: {
                  categories: priceChartData.categories,
                  labels: { style: { colors: '#6B7280' } }
                },
                yaxis: {
                  labels: { 
                    style: { colors: '#6B7280' },
                    formatter: (value: number) => `$${value.toFixed(2)}`
                  }
                },
                grid: {
                  borderColor: '#E5E7EB',
                  strokeDashArray: 5
                },
                stroke: {
                  curve: 'smooth',
                  width: 3
                },
                dataLabels: { enabled: false },
                tooltip: {
                  y: {
                    formatter: (value: number) => `$${value.toFixed(2)}`
                  }
                }
              }}
              series={[{ name: 'Token Price', data: priceChartData.series }]}
              type="line"
              height={300}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No price data available
            </div>
          )}
        </div>

        {/* Portfolio Distribution Chart */}
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Portfolio Distribution
          </h3>
          {portfolioData.length > 0 ? (
            <Chart
              options={{
                chart: {
                  type: 'donut',
                  toolbar: { show: false }
                },
                colors: portfolioData.map(item => item.color),
                labels: portfolioData.map(item => item.name),
                dataLabels: {
                  enabled: true,
                  formatter: (value: number) => `${value.toFixed(1)}%`
                },
                legend: {
                  position: 'bottom',
                  labels: { colors: '#6B7280' }
                },
                plotOptions: {
                  pie: {
                    donut: {
                      size: '60%'
                    }
                  }
                }
              }}
              series={portfolioData.map(item => item.value)}
              type="donut"
              height={300}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No portfolio data available
            </div>
          )}
        </div>

        {/* Transaction Volume Chart */}
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Transaction Volume
          </h3>
          <Chart
            options={{
              chart: {
                type: 'bar',
                toolbar: { show: false },
                zoom: { enabled: false }
              },
              colors: ['#10B981', '#EF4444'],
              xaxis: {
                categories: transactionData.categories,
                labels: { style: { colors: '#6B7280' } }
              },
              yaxis: {
                labels: { style: { colors: '#6B7280' } }
              },
              grid: {
                borderColor: '#E5E7EB',
                strokeDashArray: 5
              },
              dataLabels: { enabled: false },
              legend: {
                position: 'top',
                labels: { colors: '#6B7280' }
              }
            }}
            series={transactionData.series}
            type="bar"
            height={300}
          />
        </div>

        {/* Users Growth Chart */}
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Platform Growth
          </h3>
          <Chart
            options={{
              chart: {
                type: 'area',
                toolbar: { show: false },
                zoom: { enabled: false }
              },
              colors: ['#8B5CF6'],
              xaxis: {
                categories: usersData.categories,
                labels: { style: { colors: '#6B7280' } }
              },
              yaxis: {
                labels: { style: { colors: '#6B7280' } }
              },
              grid: {
                borderColor: '#E5E7EB',
                strokeDashArray: 5
              },
              stroke: {
                curve: 'smooth',
                width: 3
              },
              fill: {
                type: 'gradient',
                gradient: {
                  shadeIntensity: 1,
                  opacityFrom: 0.7,
                  opacityTo: 0.2,
                  stops: [0, 90, 100]
                }
              },
              dataLabels: { enabled: false }
            }}
            series={[{ name: 'Active Users', data: usersData.series }]}
            type="area"
            height={300}
          />
        </div>
      </div>

      {/* Withdrawal Status */}
      {withdrawalRequests.length > 0 && (
        <div className="mb-8 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Withdrawal Requests
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    Network
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    Request Date
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    Lock Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {withdrawalRequests.map(request => {
                  const requestDate = new Date(request.requestDate);
                  const lockEndDate = new Date(requestDate.getTime() + (request.lockPeriod * 24 * 60 * 60 * 1000));
                  const now = new Date();
                  const remainingDays = Math.ceil((lockEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
                  const isLocked = now < lockEndDate;
                  
                  return (
                    <tr key={request.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4 font-medium">
                        ${request.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {request.network}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                          request.status === "APPROVED" ? "bg-green-100 text-green-800" :
                          request.status === "REJECTED" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {requestDate.toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {isLocked ? (
                          <div className="text-sm">
                            <div className="text-red-600 font-medium">
                              🔒 Locked ({remainingDays} days remaining)
                            </div>
                            <div className="text-gray-500">
                              Unlocks: {lockEndDate.toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <div className="text-green-600 font-medium">
                              ✅ Unlocked
                            </div>
                            <div className="text-gray-500">
                              Ready for processing
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              ℹ️ Withdrawal Information
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• All withdrawals have a 3-year lock period</li>
              <li>• Tokens are automatically unlocked after the lock period</li>
              <li>• No staking income is generated during the lock period</li>
              <li>• Withdrawal requests are processed after unlock</li>
            </ul>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Quick Actions
          </h3>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push("/tokens/purchase")}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              💰 Purchase Tokens
            </button>
            
            {userStats?.availableTokens && userStats.availableTokens > 0 && (
              <button
                onClick={() => router.push("/tokens/withdraw")}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                💸 Request Withdrawal
              </button>
            )}
            
            <button
              onClick={() => router.push("/referrals")}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              🎯 Referral Program
            </button>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Account Summary
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Account Status:</span>
              <span className={`font-medium ${
                userStats?.isActive ? "text-green-600" : "text-red-600"
              }`}>
                {userStats?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
              <span className="font-medium">${totalValue.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Referral Earnings:</span>
              <span className="font-medium">${(userStats?.referralEarnings || 0).toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Pending Withdrawals:</span>
              <span className="font-medium">{withdrawalRequests.filter(w => w.status === "PENDING").length}</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Important Notes
          </h3>
          
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start">
              <span className="text-red-500 mr-2">⚠️</span>
              <span>No staking income is generated</span>
            </div>
            
            <div className="flex items-start">
              <span className="text-blue-500 mr-2">ℹ️</span>
              <span>5% referral commission on first deposits</span>
            </div>
            
            <div className="flex items-start">
              <span className="text-orange-500 mr-2">🔒</span>
              <span>3-year lock period for all withdrawals</span>
            </div>
            
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✅</span>
              <span>Users are inactive by default</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
