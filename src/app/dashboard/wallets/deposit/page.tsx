"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DepositWallet {
  id: string;
  address: string;
  network: string;
  label: string;
  isActive: boolean;
  balance: number;
  lastDeposit: string;
}

interface DepositTransaction {
  id: string;
  txHash: string;
  amount: number;
  network: string;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  confirmations: number;
  requiredConfirmations: number;
  timestamp: string;
}

export default function DepositWalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [depositWallets, setDepositWallets] = useState<DepositWallet[]>([]);
  const [depositTransactions, setDepositTransactions] = useState<DepositTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWallet, setNewWallet] = useState({
    network: "usdt",
    label: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
    }
    
    if (session?.user) {
      loadDepositData();
    }
  }, [status, router, session]);

  const loadDepositData = async () => {
    try {
      const response = await fetch("/api/wallets/deposit");
      if (response.ok) {
        const data = await response.json();
        setDepositWallets(data.wallets || []);
        setDepositTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to load deposit data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWallet = async () => {
    if (!newWallet.label.trim()) {
      alert("Please enter a wallet label");
      return;
    }

    try {
      const response = await fetch("/api/wallets/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newWallet),
      });

      if (response.ok) {
        setShowAddWallet(false);
        setNewWallet({ network: "ethereum", label: "" });
        loadDepositData(); // Reload data
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add wallet");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Address copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Confirmed
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Pending
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            Unknown
          </span>
        );
    }
  };

  const getNetworkIcon = (network: string) => {
    switch (network.toLowerCase()) {
      case "usdt":
        return "💚";
      case "ethereum":
        return "🔷";
      case "bitcoin":
        return "🟠";
      case "polygon":
        return "🟣";
      case "binance":
        return "🟡";
      default:
        return "💎";
    }
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

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-bold text-black dark:text-white">
            Deposit Wallets
          </h2>
          <button
            onClick={() => setShowAddWallet(true)}
            className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Wallet
          </button>
        </div>

        {/* Add Wallet Modal */}
        {showAddWallet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-box-dark rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-black dark:text-white mb-4">
                Add New Deposit Wallet
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Network
                  </label>
                  <select
                    value={newWallet.network}
                    onChange={(e) => setNewWallet({ ...newWallet, network: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="usdt">USDT (Tether)</option>
                    <option value="ethereum">Ethereum (ETH)</option>
                    <option value="bitcoin">Bitcoin (BTC)</option>
                    <option value="polygon">Polygon (MATIC)</option>
                    <option value="binance">Binance Smart Chain (BNB)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Wallet Label
                  </label>
                  <input
                    type="text"
                    value={newWallet.label}
                    onChange={(e) => setNewWallet({ ...newWallet, label: e.target.value })}
                    placeholder="e.g., Main Trading Wallet"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleAddWallet}
                  className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90"
                >
                  Add Wallet
                </button>
                <button
                  onClick={() => setShowAddWallet(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Wallets */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-black dark:text-white mb-4">
            Your Deposit Wallets
          </h3>
          
          {depositWallets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {depositWallets.map((wallet) => (
                <div key={wallet.id} className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{getNetworkIcon(wallet.network)}</span>
                      <div>
                        <h4 className="font-medium text-black dark:text-white capitalize">
                          {wallet.network}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {wallet.label}
                        </p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${wallet.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Wallet Address
                      </label>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                          {wallet.address}
                        </code>
                        <button
                          onClick={() => copyToClipboard(wallet.address)}
                          className="text-primary hover:text-opacity-80"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Balance:</span>
                        <p className="font-medium text-black dark:text-white">
                          {wallet.balance.toFixed(6)} {wallet.network.toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Last Deposit:</span>
                        <p className="font-medium text-black dark:text-white">
                          {wallet.lastDeposit ? new Date(wallet.lastDeposit).toLocaleDateString() : "Never"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No deposit wallets yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add your first deposit wallet to start receiving funds.
              </p>
            </div>
          )}
        </div>

        {/* Deposit Transactions */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <div className="p-4 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">
              Deposit History
            </h3>
          </div>

          {depositTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Network
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Confirmations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-box-dark divide-y divide-gray-200 dark:divide-gray-700">
                  {depositTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {transaction.txHash.substring(0, 8)}...{transaction.txHash.substring(transaction.txHash.length - 6)}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              <a 
                                href={`https://etherscan.io/tx/${transaction.txHash}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                View on Explorer
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {transaction.amount.toFixed(6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getNetworkIcon(transaction.network)}</span>
                          <span className="text-sm text-gray-900 dark:text-white capitalize">
                            {transaction.network}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {transaction.confirmations}/{transaction.requiredConfirmations}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No deposit transactions yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Deposit transactions will appear here once you receive funds.
              </p>
            </div>
          )}
        </div>

        {/* Important Information */}
        <div className="mt-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <h3 className="text-lg font-medium text-black dark:text-white mb-4">
            Important Information
          </h3>
          
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Only send supported cryptocurrencies to the corresponding wallet addresses
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Deposits require network confirmations before being credited to your account
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Minimum deposit amounts apply and vary by network
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Keep your wallet addresses secure and verify before sending funds
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
