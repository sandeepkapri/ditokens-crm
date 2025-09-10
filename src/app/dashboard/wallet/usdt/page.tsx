"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface USDTTransaction {
  id: string;
  amount: number;
  tokenAmount: number;
  status: string;
  txHash: string | null;
  walletAddress: string | null;
  createdAt: string;
}

interface USDTWalletInfo {
  walletAddress: string | null;
  transactions: USDTTransaction[];
  companyWallet: string;
}

export default function USDTWalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [walletInfo, setWalletInfo] = useState<USDTWalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
      return;
    }
    
    if (session?.user) {
      loadUSDTWalletInfo();
    }
  }, [status, router, session]);

  const loadUSDTWalletInfo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/wallet/usdt");
      if (response.ok) {
        const data = await response.json();
        setWalletInfo(data);
        setNewWalletAddress(data.walletAddress || "");
      }
    } catch (error) {
      console.error("Failed to load USDT wallet info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateWalletAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWalletAddress) {
      setMessage("Please enter a wallet address");
      return;
    }

    if (!isValidEthereumAddress(newWalletAddress)) {
      setMessage("Please enter a valid Ethereum address");
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch("/api/wallet/usdt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: newWalletAddress
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("USDT wallet address updated successfully");
        loadUSDTWalletInfo();
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(data.error || "Failed to update wallet address");
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setIsUpdating(false);
    }
  };

  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage("Copied to clipboard!");
    setTimeout(() => setMessage(""), 2000);
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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-bold text-black dark:text-white">
          USDT Wallet
        </h2>
      </div>

      {/* Message */}
      {message && (
        <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
          <div className={`p-4 rounded-md ${
            message.includes("successfully") || message.includes("Copied") 
              ? "bg-green-50 border border-green-200 text-green-800" 
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {message}
          </div>
        </div>
      )}

      {/* Company Wallet Info */}
      <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Send USDT to Company Wallet
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company USDT Wallet Address
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={walletInfo?.companyWallet || ""}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(walletInfo?.companyWallet || "")}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Send USDT (ERC-20) to this address to purchase DIT tokens
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              USDT Contract Address
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value="0xdAC17F958D2ee523a2206206994597C13D831ec7"
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard("0xdAC17F958D2ee523a2206206994597C13D831ec7")}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              USDT ERC-20 contract on Ethereum
            </p>
          </div>
        </div>
      </div>

      {/* User Wallet Management */}
      <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Your USDT Wallet Address
        </h3>
        <form onSubmit={updateWalletAddress} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ethereum Wallet Address
            </label>
            <input
              type="text"
              value={newWalletAddress}
              onChange={(e) => setNewWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your Ethereum wallet address to receive USDT refunds
            </p>
          </div>
          <button
            type="submit"
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? "Updating..." : "Update Wallet Address"}
          </button>
        </form>
      </div>

      {/* Transaction History */}
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          USDT Transaction History
        </h3>
        
        {walletInfo?.transactions && walletInfo.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Tokens</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Transaction Hash</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {walletInfo.transactions.map((transaction) => (
                  <tr key={transaction.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        ${transaction.amount.toFixed(2)} USDT
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {transaction.tokenAmount.toFixed(2)} DIT
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {transaction.txHash ? (
                        <a 
                          href={`https://etherscan.io/tx/${transaction.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-mono text-xs"
                        >
                          {transaction.txHash.slice(0, 10)}...
                        </a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.createdAt).toLocaleString()}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No transactions</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Your USDT transaction history will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
