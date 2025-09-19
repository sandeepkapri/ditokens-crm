"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


interface ConversionTransaction {
  id: string;
  amount: number;
  tokenAmount: number;
  pricePerToken: number;
  status: string;
  description: string;
  createdAt: string;
}

export default function WithdrawalWalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showConversion, setShowConversion] = useState(false);
  const [conversionAmount, setConversionAmount] = useState("");
  const [conversionHistory, setConversionHistory] = useState<ConversionTransaction[]>([]);
  const [message, setMessage] = useState("");
  const [userStatus, setUserStatus] = useState({ isActive: true, availableTokens: 0 });
  const [currentTokenPrice, setCurrentTokenPrice] = useState(2.80);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
      return;
    }
    
    if (session?.user) {
      loadWithdrawalData();
    }
  }, [status, router, session]);

  const loadWithdrawalData = async () => {
    try {
      setIsLoading(true);
      
      // Load user status
      const statusResponse = await fetch("/api/tokens/portfolio");
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setUserStatus({
          isActive: statusData.isActive === true,
          availableTokens: statusData.availableTokens || 0
        });
      } else if (statusResponse.status === 403) {
        setUserStatus({
          isActive: false,
          availableTokens: 0
        });
      }

      // Load current token price
      const priceResponse = await fetch("/api/tokens/current-price");
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        setCurrentTokenPrice(priceData.price || 2.80);
      }
      

      // Load conversion history
      const conversionResponse = await fetch("/api/tokens/conversions");
      if (conversionResponse.ok) {
        const conversionData = await conversionResponse.json();
        setConversionHistory(conversionData.conversions || []);
      }
    } catch (error) {
      console.error("Failed to load withdrawal data:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleConversion = async () => {
    if (!conversionAmount || parseFloat(conversionAmount) <= 0) {
      setMessage("Please enter a valid amount");
      return;
    }

    if (parseFloat(conversionAmount) > userStatus.availableTokens) {
      setMessage("Insufficient available tokens");
      return;
    }

    try {
      const response = await fetch("/api/tokens/convert-to-usdt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenAmount: parseFloat(conversionAmount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Successfully converted ${data.conversion.tokenAmount} DIT tokens to $${data.conversion.usdtAmount.toFixed(2)} USDT!`);
        setConversionAmount("");
        setShowConversion(false);
        loadWithdrawalData();
      } else {
        setMessage(data.error || "Conversion failed");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h2 className="text-title-md2 font-bold text-black dark:text-white">
          Convert DIT to USDT
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Convert your DIT tokens to USDT at current market price, then withdraw USDT to your wallet
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className="mb-6 rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
          <div className={`p-4 rounded-md ${
            message.includes("successfully") 
              ? "bg-green-50 border border-green-200 text-green-800" 
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {message}
          </div>
        </div>
      )}

      {/* User Balance */}
      <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Your Account Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${userStatus.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {userStatus.isActive ? '✅ Active' : '❌ Inactive'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Account Status
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {userStatus.availableTokens.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Available DIT Tokens
            </div>
          </div>
        </div>
      </div>


      {/* Conversion Section */}
      <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-stroke-dark dark:bg-box-dark sm:px-7.5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-black dark:text-white">
            Convert DIT to USDT
          </h3>
          {userStatus.isActive && (
            <button
              onClick={() => setShowConversion(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Convert DIT to USDT
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Available DIT</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {userStatus.availableTokens.toFixed(2)} DIT
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Price</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              ${currentTokenPrice.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Max USDT Value</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              ${(userStatus.availableTokens * currentTokenPrice).toFixed(2)}
            </div>
          </div>
        </div>
        
        <div className="text-center py-4">
          <div className="text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-8 w-8 text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Convert your DIT tokens to USDT at current market price, then withdraw USDT to your wallet.
            </p>
          </div>
        </div>
      </div>

      {/* Conversion History */}
      <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-stroke-dark dark:bg-box-dark sm:px-7.5">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Conversion History
        </h3>
        
        {!userStatus.isActive ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Account Not Active</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Please contact support to activate your account to view conversion history.
              </p>
            </div>
          </div>
        ) : conversionHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">DIT Tokens</th>
                  <th className="px-6 py-3">USDT Received</th>
                  <th className="px-6 py-3">Price per Token</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {conversionHistory.map((conversion) => (
                  <tr key={conversion.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {conversion.tokenAmount.toFixed(2)} DIT
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        ${conversion.amount.toFixed(2)} USDT
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        ${conversion.pricePerToken.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        conversion.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {conversion.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(conversion.createdAt).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No conversion history</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Your DIT to USDT conversions will appear here.
              </p>
            </div>
          </div>
        )}
      </div>


      {/* Conversion Modal */}
      {showConversion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-box-dark rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-black dark:text-white mb-4">
              Convert DIT to USDT
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (DIT Tokens)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={conversionAmount}
                  onChange={(e) => setConversionAmount(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter DIT token amount"
                />
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Available: {userStatus.availableTokens.toFixed(2)} DIT tokens
                  </p>
                  {conversionAmount && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Will receive: ${(parseFloat(conversionAmount) * currentTokenPrice).toFixed(2)} USDT
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  ℹ️ Conversion Information
                </h4>
                <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <p>• DIT tokens will be converted to USDT at current market price</p>
                  <p>• Conversion is instant and irreversible</p>
                  <p>• USDT can then be withdrawn to your wallet</p>
                  <p>• Only available tokens can be converted (staked tokens are locked)</p>
              </div>
            </div>

              <div className="flex space-x-3">
              <button
                  onClick={() => setShowConversion(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                  onClick={handleConversion}
                  disabled={!conversionAmount || parseFloat(conversionAmount) <= 0 || parseFloat(conversionAmount) > userStatus.availableTokens}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  Convert to USDT
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}