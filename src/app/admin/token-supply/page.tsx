"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isSuperAdminUser } from "@/lib/admin-auth";

interface TokenSupplyData {
  totalSupply: number;
  tokensSold: number;
  tokensAvailable: number;
  lastUpdated: string;
  updatedBy: string;
}

export default function TokenSupplyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tokenSupply, setTokenSupply] = useState<TokenSupplyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    totalSupply: 50000000,
    tokensSold: 0,
    tokensAvailable: 50000000
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || !isSuperAdminUser(session)) {
      router.push("/admin/dashboard");
      return;
    }

    loadTokenSupply();
  }, [status, session, router]);

  const loadTokenSupply = async () => {
    try {
      const response = await fetch('/api/admin/token-supply');
      if (response.ok) {
        const data = await response.json();
        setTokenSupply(data);
        setFormData({
          totalSupply: data.totalSupply,
          tokensSold: data.tokensSold,
          tokensAvailable: data.tokensAvailable
        });
      }
    } catch (error) {
      console.error("Error loading token supply:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (formData.totalSupply < formData.tokensSold) {
      alert("Total supply cannot be less than tokens sold!");
      return;
    }

    if (formData.tokensAvailable < 0) {
      alert("Available tokens cannot be negative!");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/token-supply', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert("Token supply updated successfully!");
        loadTokenSupply();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating token supply:", error);
      alert("Failed to update token supply");
    } finally {
      setIsUpdating(false);
    }
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

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Token Supply Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage the 50M total token supply limit and track token sales
        </p>
      </div>

      {/* Current Status */}
      {tokenSupply && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total Supply
            </h3>
            <div className="text-3xl font-bold text-blue-600">
              {(tokenSupply.totalSupply / 1000000).toFixed(1)}M
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Maximum tokens in system
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Tokens Sold
            </h3>
            <div className="text-3xl font-bold text-green-600">
              {(tokenSupply.tokensSold / 1000000).toFixed(1)}M
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Total tokens sold to users
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Available for Sale
            </h3>
            <div className="text-3xl font-bold text-orange-600">
              {(tokenSupply.tokensAvailable / 1000000).toFixed(1)}M
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Remaining tokens to sell
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {tokenSupply && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Supply Utilization
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${(tokenSupply.tokensSold / tokenSupply.totalSupply) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
            <span>0</span>
            <span>{((tokenSupply.tokensSold / tokenSupply.totalSupply) * 100).toFixed(1)}% Used</span>
            <span>{(tokenSupply.totalSupply / 1000000).toFixed(1)}M</span>
          </div>
        </div>
      )}

      {/* Update Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Update Token Supply
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Total Supply (50M limit)
            </label>
            <input
              type="number"
              value={formData.totalSupply}
              onChange={(e) => setFormData(prev => ({ ...prev, totalSupply: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="50000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tokens Sold
            </label>
            <input
              type="number"
              value={formData.tokensSold}
              onChange={(e) => setFormData(prev => ({ ...prev, tokensSold: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available for Sale
            </label>
            <input
              type="number"
              value={formData.tokensAvailable}
              onChange={(e) => setFormData(prev => ({ ...prev, tokensAvailable: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="50000000"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isUpdating ? "Updating..." : "Update Supply"}
          </button>
          
          <button
            onClick={() => setFormData({
              totalSupply: 50000000,
              tokensSold: 0,
              tokensAvailable: 50000000
            })}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset to Default
          </button>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
            ⚠️ Important Notes
          </h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Total supply cannot exceed 50M tokens</li>
            <li>• Tokens sold cannot exceed total supply</li>
            <li>• Available tokens = Total supply - Tokens sold</li>
            <li>• Changes affect the entire system</li>
          </ul>
        </div>
      </div>

      {/* Last Updated Info */}
      {tokenSupply && (
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date(tokenSupply.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}
