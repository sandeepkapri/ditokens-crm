"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tokenPrice, setTokenPrice] = useState("2.80");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
    } else if (status === "authenticated" && session?.user?.role !== "SUPERADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const handleUpdateTokenPrice = async () => {
    if (!tokenPrice || isNaN(parseFloat(tokenPrice))) {
      alert("Please enter a valid price");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/tokens/price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ price: parseFloat(tokenPrice) }),
      });

      if (response.ok) {
        alert("Token price updated successfully!");
      } else {
        alert("Failed to update token price");
      }
    } catch (error) {
      alert("Error updating token price");
    } finally {
      setIsUpdating(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || session.user?.role !== "SUPERADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Ditokens CRM - Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Admin: {session.user?.name}</span>
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={() => signOut()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Token Price Management */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Price Management</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="tokenPrice" className="block text-sm font-medium text-gray-700">
                    New Token Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="tokenPrice"
                    value={tokenPrice}
                    onChange={(e) => setTokenPrice(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="2.80"
                  />
                </div>
                <button
                  onClick={handleUpdateTokenPrice}
                  disabled={isUpdating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Updating..." : "Update Price"}
                </button>
              </div>
            </div>

            {/* System Statistics */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Users:</span>
                  <span className="text-sm font-medium text-gray-900">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Tokens Sold:</span>
                  <span className="text-sm font-medium text-gray-900">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Stakes:</span>
                  <span className="text-sm font-medium text-gray-900">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Referral Commissions:</span>
                  <span className="text-sm font-medium text-gray-900">-</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  View All Users
                </button>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  View Transactions
                </button>
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Manage Referrals
                </button>
                <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  System Settings
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="text-center text-gray-500 py-8">
              <p>No recent activity to display</p>
              <p className="text-sm">Activity monitoring will be implemented in future updates</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
