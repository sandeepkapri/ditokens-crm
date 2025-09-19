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
  usdtBalance: number;
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
  const [commissionPercentage, setCommissionPercentage] = useState(5.0);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/sign-in");
      return;
    }

    loadDashboardData();
  }, [status, session, router]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      loadDashboardData();
      setLastRefresh(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [session]);

  const loadDashboardData = async () => {
    try {
      setDatabaseError(null); // Reset error state
      
      const [portfolioResponse, withdrawalsResponse, pricesResponse, currentPriceResponse, commissionResponse] = await Promise.all([
        fetch("/api/tokens/portfolio"),
        fetch("/api/tokens/withdrawals"),
        fetch("/api/tokens/price"),
        fetch("/api/tokens/current-price"),
        fetch("/api/admin/commission-settings")
      ]);

      // Check for database errors in portfolio response
      if (portfolioResponse.ok) {
        const portfolioData = await portfolioResponse.json();
        setUserStats(portfolioData.stats);
      } else if (portfolioResponse.status === 503) {
        const errorData = await portfolioResponse.json();
        if (errorData.type === 'database_error') {
          setDatabaseError(errorData.error);
          return;
        }
      }

      // Check for database errors in withdrawals response
      if (withdrawalsResponse.ok) {
        const withdrawalsData = await withdrawalsResponse.json();
        setWithdrawalRequests(withdrawalsData.withdrawals || []);
      } else if (withdrawalsResponse.status === 503) {
        const errorData = await withdrawalsResponse.json();
        if (errorData.type === 'database_error') {
          setDatabaseError(errorData.error);
          return;
        }
      }

      // Check for database errors in prices response
      if (pricesResponse.ok) {
        const pricesData = await pricesResponse.json();
        console.log('Price API response:', pricesData);
        setTokenPrices(pricesData.priceData || []);
      } else if (pricesResponse.status === 503) {
        const errorData = await pricesResponse.json();
        if (errorData.type === 'database_error') {
          setDatabaseError(errorData.error);
          return;
        }
      }

      // Get current price from dedicated API
      if (currentPriceResponse.ok) {
        const currentPriceData = await currentPriceResponse.json();
        console.log('Current price API response:', currentPriceData);
        setCurrentPrice(currentPriceData.price || 2.80);
      }

      // Get commission percentage
      if (commissionResponse.ok) {
        const commissionData = await commissionResponse.json();
        setCommissionPercentage(commissionData.settings?.referralRate || 5.0);
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
    
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    // Filter out future dates and sort by date
    const filteredPrices = tokenPrices.filter(price => {
      const priceDate = new Date(price.date);
      return priceDate <= today; // Only include dates up to today
    });
    
    const sortedPrices = [...filteredPrices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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

  // Show database error page if there's a database connection issue
  if (databaseError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
            <div className="w-8 h-8 text-red-600 text-2xl">⚠️</div>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Database Connection Issue
            </h2>
            
            <p className="text-gray-600 mb-6">
              {databaseError}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setDatabaseError(null);
                  setIsLoading(true);
                  loadDashboardData();
                }}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <div className="w-4 h-4 mr-2">🔄</div>
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Refresh Page
              </button>
            </div>
            
            <div className="mt-6 p-3 bg-yellow-50 rounded-md">
              <div className="flex items-start">
                <div className="w-5 h-5 text-yellow-600 mt-0.5 mr-2">⚠️</div>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">What you can do:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Wait a moment and try again</li>
                    <li>Check your internet connection</li>
                    <li>Contact support if the issue persists</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalValue = (userStats?.totalTokens || 0) * currentPrice;
  const stakedValue = (userStats?.stakedTokens || 0) * currentPrice;
  const availableValue = (userStats?.availableTokens || 0) * currentPrice;

  const priceChartData = getTokenPriceChartData();
  const portfolioData = getPortfolioDistributionData();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-bold text-black dark:text-white">
          Dashboard
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Current Token Price:
            </span>
            <span className="text-lg font-bold text-blue-600">
              ${currentPrice}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadDashboardData();
                setLastRefresh(new Date());
              }}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
              title="Refresh data"
            >
              🔄 Refresh
            </button>
            <span className="text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>



      {/* Token Balance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <div className="rounded-lg border border-stroke bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Tokens
            </h3>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {userStats?.totalTokens?.toLocaleString() || "0"}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              ${totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              Complete holdings
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-stroke bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Available Tokens
            </h3>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {userStats?.availableTokens?.toLocaleString() || "0"}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              ${availableValue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              Ready for withdrawal
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-stroke bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              USDT Balance
            </h3>
            <div className="text-2xl font-bold text-orange-600 mb-1">
              ${(userStats?.usdtBalance || 0).toLocaleString()}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Available for withdrawal
            </div>
            <p className="text-xs text-gray-500">
              Deposit/Withdrawal only
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-stroke bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Staked Tokens
            </h3>
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {userStats?.stakedTokens?.toLocaleString() || "0"}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              ${stakedValue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              Locked in staking
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-stroke bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Earnings
            </h3>
            <div className="text-2xl font-bold text-emerald-600 mb-1">
              ${(userStats?.totalEarnings || 0).toLocaleString()}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Referral: ${(userStats?.referralEarnings || 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              Price income only
            </p>
          </div>
        </div>
      </div>

      {/* Token Supply Status */}
      <div className="mb-8 rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Token Supply Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">50.0M</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Supply</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">~2.5M</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tokens Sold</div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-1">~47.5M</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Available for Sale</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 mb-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-300"
            style={{ width: '5%' }}
          ></div>
        </div>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
          5% of total supply utilized
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-sm text-blue-700 dark:text-blue-300 text-center">
            <strong>System Limit:</strong> Maximum 50,000,000 tokens can ever exist
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Token Price Trend Chart */}
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
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
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
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


      </div>

      {/* Withdrawal Status */}
      {withdrawalRequests.length > 0 && (
        <div className="mb-8 rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
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
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Quick Actions
          </h3>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push("/dashboard/tokens/buy")}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              💰 Purchase DIT Tokens
            </button>
            
            {userStats?.usdtBalance && userStats.usdtBalance > 0 && (
              <button
                onClick={() => router.push("/dashboard/wallets/usdt-withdraw")}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
              >
                💸 Withdraw USDT
              </button>
            )}
            
            {userStats?.availableTokens && userStats.availableTokens > 0 && (
              <button
                onClick={() => router.push("/dashboard/wallets/withdrawal")}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              >
                💸 Convert DIT to USDT
              </button>
            )}
            
            <button
              onClick={() => router.push("/dashboard/referrals/link")}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            >
              🎯 Referral Program
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Account Summary
          </h3>
          
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Account Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                userStats?.isActive ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}>
                {userStats?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
              <span className="font-semibold text-gray-900 dark:text-white">${totalValue.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Referral Earnings:</span>
              <span className="font-semibold text-gray-900 dark:text-white">${(userStats?.referralEarnings || 0).toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 dark:text-gray-400">Pending Withdrawals:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{withdrawalRequests.filter(w => w.status === "PENDING").length}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Important Notes
          </h3>
          
          <div className="space-y-4 text-sm">
            <div className="flex items-start p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-red-500 mr-3 mt-0.5">⚠️</span>
              <span className="text-red-700 dark:text-red-300">No staking income is generated</span>
            </div>
            
            <div className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-blue-500 mr-3 mt-0.5">ℹ️</span>
              <span className="text-blue-700 dark:text-blue-300">{commissionPercentage}% referral commission on first deposits</span>
            </div>
            
            <div className="flex items-start p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <span className="text-orange-500 mr-3 mt-0.5">🔒</span>
              <span className="text-orange-700 dark:text-orange-300">3-year lock period for all withdrawals</span>
            </div>
            
            <div className="flex items-start p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-green-500 mr-3 mt-0.5">✅</span>
              <span className="text-green-700 dark:text-green-300">Users are inactive by default</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
