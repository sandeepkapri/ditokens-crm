"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isSuperAdminUser } from "@/lib/admin-auth";

interface TokenPrice {
  id: string;
  price: number;
  date: string;
  createdAt: string;
}

interface PriceUpdateForm {
  price: number;
  date: string;
  note: string;
}

export default function TokenPricePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tokenPrices, setTokenPrices] = useState<TokenPrice[]>([]);
  const [priceStats, setPriceStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [formData, setFormData] = useState<PriceUpdateForm>({
    price: 2.80,
    date: new Date().toISOString().split('T')[0],
    note: "",
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/sign-in");
      return;
    }

    // Check if user is superadmin
    if (!isSuperAdminUser(session)) {
      router.push("/admin/dashboard");
      return;
    }

    loadTokenPrices();
  }, [status, session, router]);

  const loadTokenPrices = async () => {
    try {
      const [pricesResponse, statsResponse] = await Promise.all([
        fetch("/api/admin/token-price"),
        fetch("/api/tokens/price-stats")
      ]);
      
      if (pricesResponse.ok) {
        const data = await pricesResponse.json();
        console.log('Token prices loaded:', data.prices);
        setTokenPrices(data.prices || []);
      }
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('Price stats loaded:', statsData);
        setPriceStats(statsData);
      }
    } catch (error) {
      console.error("Error loading token prices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!formData.price || !formData.date) {
      setMessage("Please fill in all required fields");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/admin/token-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price: formData.price,
          date: formData.date,
        }),
      });

      if (response.ok) {
        setMessage("Token price updated successfully!");
        setShowUpdateForm(false);
        setFormData({
          price: 2.80,
          date: new Date().toISOString().split('T')[0],
          note: "",
        });
        loadTokenPrices();
        setTimeout(() => setMessage(""), 5000);
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setIsUpdating(false);
    }
  };

  const getCurrentPrice = () => {
    // Use priceStats if available, otherwise fall back to tokenPrices
    if (priceStats?.currentPrice) {
      return priceStats.currentPrice;
    }
    if (tokenPrices.length === 0) return 0;
    const today = new Date().toISOString().split('T')[0];
    const todayPrice = tokenPrices.find(p => p.date === today);
    return todayPrice ? todayPrice.price : tokenPrices[0].price;
  };

  const getPriceForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    const price = tokenPrices.find(p => {
      // Convert the stored date to a comparable string format
      let priceDateStr: string;
      if (typeof p.date === 'string') {
        priceDateStr = p.date.split('T')[0];
      } else {
        // If it's a Date object, convert to string
        priceDateStr = new Date(p.date).toISOString().split('T')[0];
      }
      return priceDateStr === dateStr;
    });
    
    return price ? price.price : null;
  };

  const getMonthName = (month: number) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[month];
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Use UTC date creation to avoid timezone issues
      const date = new Date(Date.UTC(selectedYear, selectedMonth, day));
      const price = getPriceForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isPast = date < new Date();
      const isFuture = date > new Date();

      days.push(
        <div
          key={day}
          className={`p-2 border border-gray-200 min-h-[80px] relative ${
            isToday ? 'bg-blue-50 border-blue-300' : ''
          } ${isPast ? 'bg-gray-50' : ''} ${isFuture ? 'bg-green-50' : ''}`}
        >
          <div className="text-sm font-medium mb-1">{day}</div>
          {price ? (
            <div className="text-xs">
              <div className="font-bold text-green-600">${price}</div>
              <div className="text-gray-500">Set</div>
            </div>
          ) : (
            <div className="text-xs text-gray-400">
              {isPast ? 'No price set' : 'Not set'}
            </div>
          )}
          {isToday && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      );
    }

    return days;
  };

  const getPriceStats = () => {
    if (tokenPrices.length === 0) return null;

    const prices = tokenPrices.map(p => p.price);
    const totalUpdates = tokenPrices.length;
    const highest = Math.max(...prices);
    const lowest = Math.min(...prices);
    const average = prices.reduce((a, b) => a + b, 0) / prices.length;
    const currentPrice = getCurrentPrice();

    return { totalUpdates, highest, lowest, average, currentPrice };
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || !isSuperAdminUser(session)) {
    return null;
  }

  const stats = getPriceStats();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-bold text-black dark:text-white">
          Token Price Management
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              loadTokenPrices();
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowUpdateForm(!showUpdateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showUpdateForm ? "Cancel" : "Update Token Price"}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-md ${
          message.includes("Error") 
            ? "bg-red-100 text-red-700 border border-red-300" 
            : "bg-green-100 text-green-700 border border-green-300"
        }`}>
          {message}
        </div>
      )}

      {/* Current Price and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Current Price
            </h3>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              ${priceStats?.currentPrice?.toFixed(2) || stats?.currentPrice?.toFixed(2) || "0.00"}
            </div>
            <p className="text-sm text-gray-500">Latest token value</p>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Total Updates
            </h3>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {priceStats?.totalUpdates || stats?.totalUpdates || 0}
            </div>
            <p className="text-sm text-gray-500">Price changes made</p>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Highest Price
            </h3>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              ${priceStats?.highestPrice?.toFixed(2) || stats?.highest?.toFixed(2) || "0.00"}
            </div>
            <p className="text-sm text-gray-500">Peak value</p>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Average Price
            </h3>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              ${priceStats?.averagePrice?.toFixed(2) || stats?.average?.toFixed(2) || "0.00"}
            </div>
            <p className="text-sm text-gray-500">Mean value</p>
          </div>
        </div>
      </div>

      {/* Update Price Form */}
      {showUpdateForm && (
        <div className="mb-8 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Update Token Price
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2.80"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Note (Optional)
              </label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Reason for price change"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleUpdatePrice}
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Updating..." : "Update Price"}
            </button>
          </div>
        </div>
      )}

      {/* Monthly Calendar View */}
      <div className="mb-8 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-black dark:text-white">
            Price Calendar - {getMonthName(selectedMonth)} {selectedYear}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              ←
            </button>
            <button
              onClick={() => {
                setSelectedMonth(new Date().getMonth());
                setSelectedYear(new Date().getFullYear());
              }}
              className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-md text-sm"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {renderCalendar()}
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            📅 Calendar Legend
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
              <span>Past Days</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
              <span>Future Days</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
              <span>Current Month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Price History Table */}
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Recent Price History
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  Price (USD)
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  Change
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody>
              {tokenPrices.slice(0, 20).map((price, index) => {
                const prevPrice = index < tokenPrices.length - 1 ? tokenPrices[index + 1].price : price.price;
                const change = price.price - prevPrice;
                const changePercent = ((change / prevPrice) * 100);
                
                return (
                  <tr key={price.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {new Date(price.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                      ${price.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {index < tokenPrices.length - 1 ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          change > 0 ? "bg-green-100 text-green-800" :
                          change < 0 ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {change > 0 ? "+" : ""}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Initial price</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {new Date(price.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {tokenPrices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No price history found
          </div>
        )}
      </div>
    </div>
  );
}
