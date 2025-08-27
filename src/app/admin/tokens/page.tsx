"use client";

import { useSession } from "next-auth/react";
import { isAdminUser } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface TokenStats {
  currentPrice: number;
  totalSupply: number;
  circulatingSupply: number;
  stakedSupply: number;
  marketCap: number;
  totalStakers: number;
  averageStakingAPY: number;
  totalStakingRewards: number;
}

interface PriceHistory {
  date: string;
  price: number;
  volume: number;
}

export default function AdminTokensPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tokenStats, setTokenStats] = useState<TokenStats>({
    currentPrice: 2.80,
    totalSupply: 50000000,
    circulatingSupply: 0,
    stakedSupply: 0,
    marketCap: 0,
    totalStakers: 0,
    averageStakingAPY: 12.5,
    totalStakingRewards: 0,
  });
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPrice, setNewPrice] = useState("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
      return;
    }
    
    if (!isAdminUser(session)) {
      router.push("/dashboard");
      return;
    }
    
    if (session?.user) {
      loadTokenData();
    }
  }, [status, router, session]);

  const loadTokenData = async () => {
    try {
      const [statsResponse, priceResponse] = await Promise.all([
        fetch("/api/admin/tokens/stats"),
        fetch("/api/admin/tokens/price-history")
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setTokenStats(statsData.stats);
      }

      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        setPriceHistory(priceData.history);
      }
    } catch (error) {
      console.error("Failed to load token data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!newPrice || isNaN(parseFloat(newPrice))) {
      alert("Please enter a valid price");
      return;
    }

    const price = parseFloat(newPrice);
    if (price <= 0) {
      alert("Price must be greater than 0");
      return;
    }

    setIsUpdatingPrice(true);
    try {
      const response = await fetch("/api/tokens/price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ price }),
      });

      if (response.ok) {
        setNewPrice("");
        loadTokenData(); // Reload data
        alert("Token price updated successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update token price");
      }
    } catch (error) {
      alert("Error updating token price");
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
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
          <h2 className="text-title-md2 font-bold text-black dark:text-white">
            Token Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Manage token prices, supply, and staking parameters
          </p>
        </div>

        {/* Token Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Current Price
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  ${tokenStats.currentPrice.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Market Cap
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  ${tokenStats.marketCap.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Supply
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {tokenStats.totalSupply.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Staking APY
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {tokenStats.averageStakingAPY}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Price Management */}
        <div className="mb-8">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <h3 className="text-lg font-medium text-black dark:text-white mb-4">
              Update Token Price
            </h3>
            
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Token Price (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="2.80"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <button
                onClick={handleUpdatePrice}
                disabled={isUpdatingPrice || !newPrice}
                className="bg-primary text-white px-6 py-2 rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingPrice ? "Updating..." : "Update Price"}
              </button>
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Current Token Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Circulating Supply:</span>
                  <p className="font-medium text-black dark:text-white">
                    {tokenStats.circulatingSupply.toLocaleString()} tokens
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Staked Supply:</span>
                  <p className="font-medium text-black dark:text-white">
                    {tokenStats.stakedSupply.toLocaleString()} tokens
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Total Stakers:</span>
                  <p className="font-medium text-black dark:text-white">
                    {tokenStats.totalStakers.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Total Rewards:</span>
                  <p className="font-medium text-black dark:text-white">
                    ${tokenStats.totalStakingRewards.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Supply Distribution */}
        <div className="mb-8">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <h3 className="text-lg font-medium text-black dark:text-white mb-4">
              Supply Distribution
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {((tokenStats.circulatingSupply / tokenStats.totalSupply) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Circulating</div>
                <div className="text-lg font-medium text-black dark:text-white">
                  {tokenStats.circulatingSupply.toLocaleString()} tokens
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {((tokenStats.stakedSupply / tokenStats.totalSupply) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Staked</div>
                <div className="text-lg font-medium text-black dark:text-white">
                  {tokenStats.stakedSupply.toLocaleString()} tokens
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {(((tokenStats.totalSupply - tokenStats.circulatingSupply - tokenStats.stakedSupply) / tokenStats.totalSupply) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Reserved</div>
                <div className="text-lg font-medium text-black dark:text-white">
                  {(tokenStats.totalSupply - tokenStats.circulatingSupply - tokenStats.stakedSupply).toLocaleString()} tokens
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price History Chart */}
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <h3 className="text-lg font-medium text-black dark:text-white mb-4">
            Price History (Last 30 Days)
          </h3>
          
          {priceHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price (USD)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-box-dark divide-y divide-gray-200 dark:divide-gray-700">
                  {priceHistory.slice(0, 10).map((record, index) => {
                    const previousPrice = index < priceHistory.length - 1 ? priceHistory[index + 1].price : record.price;
                    const change = ((record.price - previousPrice) / previousPrice) * 100;
                    
                    return (
                      <tr key={record.date} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ${record.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {record.volume.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            change > 0 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                            change < 0 ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                            "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}>
                            {change > 0 ? "+" : ""}{change.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No price history available</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Price history will appear here once you start updating prices.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
