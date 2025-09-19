"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TokenStats {
  totalSupply: number;
  availableTokens: number;
  stakedTokens: number;
  currentPrice: number;
  latestPrice: number;
  totalUpdates: number;
  highestPrice: number;
  averagePrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCap: number;
  totalHolders: number;
}

interface PriceData {
  date: string;
  price: number;
  volume: number;
}

export default function TokenOverviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tokenStats, setTokenStats] = useState<TokenStats>({
    totalSupply: 50000000,
    availableTokens: 35000000,
    stakedTokens: 15000000,
    currentPrice: 2.8,
    latestPrice: 2.8,
    totalUpdates: 0,
    highestPrice: 2.8,
    averagePrice: 2.8,
    priceChange24h: 0,
    priceChangePercent24h: 0,
    marketCap: 140000000,
    totalHolders: 1250,
  });
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("7d");
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
    }
    
    if (session?.user) {
      loadTokenData();
    }
  }, [status, router, session, timeframe]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!session?.user) return;

    const interval = setInterval(() => {
      loadTokenData();
      setLastRefresh(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [session, timeframe]);

  const loadTokenData = async () => {
    try {
      setDatabaseError(null); // Reset error state
      
      // Load token statistics and price stats
      const [statsResponse, priceStatsResponse] = await Promise.all([
        fetch("/api/tokens/stats"),
        fetch("/api/tokens/price-stats")
      ]);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setTokenStats(statsData);
      } else if (statsResponse.status === 503) {
        // Database error - check if it's a database connection issue
        const errorData = await statsResponse.json();
        if (errorData.type === 'database_error') {
          setDatabaseError(errorData.error);
          return;
        }
      }

      if (priceStatsResponse.ok) {
        const priceStatsData = await priceStatsResponse.json();
        // Update token stats with real-time price data
        setTokenStats(prev => ({
          ...prev,
          currentPrice: priceStatsData.currentPrice,
          latestPrice: priceStatsData.latestPrice,
          totalUpdates: priceStatsData.totalUpdates,
          highestPrice: priceStatsData.highestPrice,
          averagePrice: priceStatsData.averagePrice,
          priceChange24h: priceStatsData.priceChange24h,
          priceChangePercent24h: priceStatsData.priceChangePercent24h
        }));
      }

      // Load price data
      const priceResponse = await fetch(`/api/tokens/price?timeframe=${timeframe}`);
      if (priceResponse.ok) {
        const data = await priceResponse.json();
        console.log("Price data received:", data);
        console.log("Number of data points:", data.priceData?.length || 0);
        console.log("Sample data point:", data.priceData?.[0]);
        
        // Filter out future dates as additional safety
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const filteredData = (data.priceData || []).filter((item: PriceData) => {
          const itemDate = new Date(item.date);
          return itemDate <= today;
        });
        
        setPriceData(filteredData);
      } else if (priceResponse.status === 503) {
        // Database error - check if it's a database connection issue
        const errorData = await priceResponse.json();
        if (errorData.type === 'database_error') {
          setDatabaseError(errorData.error);
          return;
        }
      } else {
        console.error("Failed to fetch price data:", priceResponse.status);
        const errorText = await priceResponse.text();
        console.error("Error response:", errorText);
      }
    } catch (error) {
      console.error("Failed to load token data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
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
                  loadTokenData();
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

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-title-md2 font-bold text-black dark:text-white">
              Token Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor and manage your Ditokens portfolio
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadTokenData();
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

        {/* Token Statistics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 2xl:gap-7.5 mb-6">
          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-2">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  {formatNumber(tokenStats.totalSupply)}
                </h4>
                <span className="text-sm font-medium">Total Supply</span>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-2">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  {formatNumber(tokenStats.availableTokens)}
                </h4>
                <span className="text-sm font-medium">Available</span>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-2">
              <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  {formatNumber(tokenStats.stakedTokens)}
                </h4>
                <span className="text-sm font-medium">Staked</span>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-2">
              <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  {formatCurrency(tokenStats.currentPrice)}
                </h4>
                <span className="text-sm font-medium">Current Price</span>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-2">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  {formatCurrency(tokenStats.marketCap)}
                </h4>
                <span className="text-sm font-medium">Market Cap</span>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-2">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  {formatNumber(tokenStats.totalHolders)}
                </h4>
                <span className="text-sm font-medium">Total Holders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-black dark:text-white">
              Token Price Chart
            </h3>
            <div className="flex space-x-2">
              {["1d", "7d", "1m", "3m", "1y"].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    timeframe === period
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-80">
            {priceData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">No price data available</p>
                  <p className="text-sm">Data points: {priceData.length}</p>
                  <p className="text-sm">Timeframe: {timeframe}</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary bg-opacity-10">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-black dark:text-white">Buy Tokens</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Purchase Ditokens using various payment methods
            </p>
            <button
              onClick={() => router.push("/dashboard/tokens/buy")}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors"
            >
              Buy Now
            </button>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success bg-opacity-10">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-black dark:text-white">Stake Tokens</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Stake your tokens to earn rewards over time
            </p>
            <button
              onClick={() => router.push("/dashboard/tokens/stake")}
              className="w-full bg-success text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors"
            >
              Start Staking
            </button>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning bg-opacity-10">
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-black dark:text-white">Portfolio</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              View your token portfolio and transaction history
            </p>
            <button
              onClick={() => router.push("/dashboard/tokens/portfolio")}
              className="w-full bg-warning text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors"
            >
              View Portfolio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
