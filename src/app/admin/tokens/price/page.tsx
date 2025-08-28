"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isSuperAdminUser } from "@/lib/admin-auth";

interface TokenPrice {
  id: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
}

interface PriceHistory {
  date: string;
  price: number;
  volume: number;
}

export default function TokenPriceManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tokenPrice, setTokenPrice] = useState<TokenPrice>({
    id: "dit_001",
    price: 2.80,
    change24h: 0.05,
    changePercent24h: 1.82,
    volume24h: 1250000,
    marketCap: 140000000,
    lastUpdated: "2025-08-23T18:30:00Z",
  });
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPrice, setNewPrice] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || !isSuperAdminUser(session)) {
      router.push("/admin/dashboard");
      return;
    }

    loadTokenData();
  }, [status, session, router]);

  const loadTokenData = async () => {
    try {
      // Mock data for demonstration
      const mockPriceHistory: PriceHistory[] = [
        { date: "2025-08-17", price: 2.65, volume: 980000 },
        { date: "2025-08-18", price: 2.68, volume: 1050000 },
        { date: "2025-08-19", price: 2.72, volume: 1120000 },
        { date: "2025-08-20", price: 2.75, volume: 1180000 },
        { date: "2025-08-21", price: 2.78, volume: 1220000 },
        { date: "2025-08-22", price: 2.79, volume: 1240000 },
        { date: "2025-08-23", price: 2.80, volume: 1250000 },
      ];

      setPriceHistory(mockPriceHistory);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading token data:", error);
      setIsLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!newPrice || parseFloat(newPrice) <= 0) {
      alert("Please enter a valid price");
      return;
    }

    setIsUpdating(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const oldPrice = tokenPrice.price;
      const newPriceValue = parseFloat(newPrice);
      const change24h = newPriceValue - oldPrice;
      const changePercent24h = (change24h / oldPrice) * 100;

      setTokenPrice(prev => ({
        ...prev,
        price: newPriceValue,
        change24h: change24h,
        changePercent24h: changePercent24h,
        lastUpdated: new Date().toISOString(),
      }));

      // Add to price history
      setPriceHistory(prev => [
        ...prev,
        {
          date: new Date().toLocaleDateString(),
          price: newPriceValue,
          volume: prev[prev.length - 1]?.volume || 1250000,
        }
      ]);

      setNewPrice("");
      alert("Token price updated successfully!");
    } catch (error) {
      console.error("Error updating price:", error);
      alert("Error updating price");
    } finally {
      setIsUpdating(false);
    }
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-600" : "text-red-600";
  };

  const getChangeBgColor = (change: number) => {
    return change >= 0 ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900";
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !isSuperAdminUser(session)) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-title-md2 font-bold text-black dark:text-white">Token Price Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Monitor and update DIT token pricing and market data
          </p>
        </div>

        {/* Current Price Card */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark mb-8">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white mb-2">Current Price</h3>
                <p className="text-4xl font-bold text-primary">${tokenPrice.price.toFixed(2)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Last updated: {new Date(tokenPrice.lastUpdated).toLocaleString()}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white mb-2">24h Change</h3>
                <p className={`text-2xl font-bold ${getChangeColor(tokenPrice.change24h)}`}>
                  {tokenPrice.change24h >= 0 ? '+' : ''}{tokenPrice.change24h.toFixed(2)}
                </p>
                <p className={`text-sm ${getChangeColor(tokenPrice.changePercent24h)}`}>
                  {tokenPrice.changePercent24h >= 0 ? '+' : ''}{tokenPrice.changePercent24h.toFixed(2)}%
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white mb-2">24h Volume</h3>
                <p className="text-2xl font-bold text-black dark:text-white">
                  ${(tokenPrice.volume24h / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">USD</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white mb-2">Market Cap</h3>
                <p className="text-2xl font-bold text-black dark:text-white">
                  ${(tokenPrice.marketCap / 1000000).toFixed(0)}M
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">USD</p>
              </div>
            </div>
          </div>
        </div>

        {/* Price Update Form */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark mb-8">
          <div className="p-4 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">Update Token Price</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  New Price (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Enter new price..."
                  className="w-full px-4 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                />
              </div>
              <button
                onClick={handleUpdatePrice}
                disabled={isUpdating || !newPrice}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Updating..." : "Update Price"}
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Price updates will be reflected immediately across the platform
            </p>
          </div>
        </div>

        {/* Price History Chart */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark mb-8">
          <div className="p-4 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">Price History (Last 7 Days)</h3>
          </div>
          <div className="p-6">
            <div className="flex items-end justify-between h-64">
              {priceHistory.map((item, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div 
                    className="w-8 bg-primary rounded-t"
                    style={{ height: `${(item.price / Math.max(...priceHistory.map(p => p.price))) * 200}px` }}
                  ></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{item.date}</span>
                  <span className="text-xs font-medium text-black dark:text-white">${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Price History Table */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <div className="p-4 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">Detailed Price History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price (USD)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Volume (USD)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Change %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-box-dark divide-y divide-gray-200 dark:divide-gray-700">
                {priceHistory.map((item, index) => {
                  const prevPrice = index > 0 ? priceHistory[index - 1].price : item.price;
                  const change = item.price - prevPrice;
                  const changePercent = (change / prevPrice) * 100;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-black dark:text-white">{item.date}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-black dark:text-white">${item.price.toFixed(2)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-black dark:text-white">${(item.volume / 1000).toFixed(0)}K</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className={`text-sm font-medium ${getChangeColor(change)}`}>
                          {change >= 0 ? '+' : ''}{change.toFixed(2)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getChangeBgColor(changePercent)} ${getChangeColor(changePercent)}`}>
                          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
