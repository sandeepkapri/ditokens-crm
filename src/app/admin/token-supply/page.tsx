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

  if (status === "loading") {
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
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-title-md2 font-bold text-black dark:text-white">
            Token Supply Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Monitor DIT token supply and distribution (Updates Disabled)
          </p>
        </div>

        {/* Current Token Supply */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark mb-8">
          <div className="p-6">
            <h3 className="text-lg font-medium text-black dark:text-white mb-4">
              Current Token Supply
            </h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {tokenSupply?.totalSupply?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Supply
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {tokenSupply?.tokensSold?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Tokens Sold
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {tokenSupply?.tokensAvailable?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Available for Sale
                  </div>
                </div>
              </div>
            )}
            
            {tokenSupply && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Last updated: {new Date(tokenSupply.lastUpdated).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Updated by: {tokenSupply.updatedBy}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Update Token Supply Form - DISABLED */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-black dark:text-white">
                Update Token Supply
              </h3>
              <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                DISABLED
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex items-start">
                <div className="w-5 h-5 text-yellow-600 mt-0.5 mr-2">⚠️</div>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Update functionality has been disabled</p>
                  <p className="mt-1">Manual updates to token supply are temporarily disabled to prevent calculation errors and data inconsistencies.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 opacity-50 pointer-events-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Supply (50M limit)
                  </label>
                  <input
                    type="number"
                    value={formData.totalSupply}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    max="50000000"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tokens Sold
                  </label>
                  <input
                    type="number"
                    value={formData.tokensSold}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available for Sale
                  </label>
                  <input
                    type="number"
                    value={formData.tokensAvailable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    disabled
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled
                  className="px-6 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed opacity-50"
                >
                  Update Supply (Disabled)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}