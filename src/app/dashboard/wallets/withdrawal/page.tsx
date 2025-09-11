"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface WithdrawalWallet {
  id: string;
  address: string;
  network: string;
  label: string;
  isActive: boolean;
  isVerified: boolean;
  lastUsed: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  network: string;
  address: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  txHash?: string;
  fee: number;
  timestamp: string;
}

export default function WithdrawalWalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [withdrawalWallets, setWithdrawalWallets] = useState<WithdrawalWallet[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [newWallet, setNewWallet] = useState({
    network: "ethereum",
    label: "",
    address: "",
  });
  const [withdrawForm, setWithdrawForm] = useState({
    walletId: "",
    tokenAmount: "",
    network: "ethereum",
  });
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
        
        // Don't show duplicate message - already shown in UI
      } else if (statusResponse.status === 403) {
        // Handle 403 error from portfolio API
        setUserStatus({
          isActive: false,
          availableTokens: 0
        });
        // Don't show duplicate message - already shown in UI
      }

      // Load current token price
      const priceResponse = await fetch("/api/tokens/current-price");
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        setCurrentTokenPrice(priceData.price || 2.80);
      }
      
      // Load withdrawal data
      const response = await fetch("/api/wallets/withdrawal");
      if (response.ok) {
        const data = await response.json();
        setWithdrawalWallets(data.wallets || []);
        setWithdrawalRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Failed to load withdrawal data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWallet = async () => {
    try {
      const response = await fetch("/api/wallets/withdrawal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newWallet),
      });

      if (response.ok) {
        setShowAddWallet(false);
        setNewWallet({ network: "ethereum", label: "", address: "" });
        loadWithdrawalData();
      }
    } catch (error) {
      console.error("Failed to add wallet:", error);
    }
  };

  const handleDeleteWallet = async (walletId: string) => {
    if (!confirm("Are you sure you want to delete this wallet?")) {
      return;
    }

    try {
      const response = await fetch(`/api/wallets/withdrawal?id=${walletId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage("Wallet deleted successfully");
        setTimeout(() => setMessage(""), 5000);
        loadWithdrawalData();
      } else {
        const data = await response.json();
        setMessage(data.error || "Failed to delete wallet");
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (error) {
      console.error("Failed to delete wallet:", error);
      setMessage("Failed to delete wallet");
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawForm.walletId || !withdrawForm.tokenAmount) {
      setMessage("Please fill in all fields");
      setTimeout(() => setMessage(""), 5000);
      return;
    }

    const tokenAmount = parseFloat(withdrawForm.tokenAmount);
    if (tokenAmount <= 0) {
      setMessage("Token amount must be greater than 0");
      setTimeout(() => setMessage(""), 5000);
      return;
    }

    // Check if user has sufficient available tokens
    if (tokenAmount > userStatus.availableTokens) {
      setMessage(`Insufficient available tokens. You have ${userStatus.availableTokens.toFixed(2)} DIT tokens available for withdrawal.`);
      setTimeout(() => setMessage(""), 5000);
      return;
    }

    // Check if selected wallet is verified
    const selectedWallet = withdrawalWallets.find(w => w.id === withdrawForm.walletId);
    if (selectedWallet && !selectedWallet.isVerified) {
      setMessage("Please select a verified wallet for withdrawal");
      setTimeout(() => setMessage(""), 5000);
      return;
    }

    try {
      const response = await fetch("/api/tokens/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenAmount: tokenAmount, // Send DIT tokens
          network: withdrawForm.network,
          walletAddress: withdrawalWallets.find(w => w.id === withdrawForm.walletId)?.address,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const usdValue = (tokenAmount * currentTokenPrice).toFixed(2);
        setMessage(`Withdrawal request submitted successfully! ${tokenAmount.toFixed(2)} DIT tokens ($${usdValue}) will be processed after admin approval.`);
        setShowWithdraw(false);
        setWithdrawForm({ walletId: "", tokenAmount: "", network: "ethereum" });
        loadWithdrawalData();
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(`Error: ${data.error || "Failed to submit withdrawal request"}`);
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (error) {
      console.error("Failed to withdraw:", error);
      setMessage("Network error. Please try again.");
      setTimeout(() => setMessage(""), 5000);
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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-bold text-black dark:text-white">
          Withdrawal Wallets
        </h2>
        <button
          onClick={() => setShowAddWallet(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Add Wallet
        </button>
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

      {/* Withdrawal Wallets */}
      <div className="mb-8 rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-stroke-dark dark:bg-box-dark sm:px-7.5">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Your Withdrawal Wallets
        </h3>
        
        {!userStatus.isActive ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Account Not Active</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Please contact support to activate your account to manage withdrawal wallets.
              </p>
            </div>
          </div>
        ) : withdrawalWallets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {withdrawalWallets.map((wallet) => (
              <div key={wallet.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-black dark:text-white">{wallet.label}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      wallet.isVerified ? "bg-green-100 text-green-800" : 
                      wallet.isActive ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                    }`}>
                      {wallet.isVerified ? "Ready to Use" : 
                       wallet.isActive ? "Pending Verification" : "Rejected"}
                    </span>
                    <button
                      onClick={() => handleDeleteWallet(wallet.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Delete wallet"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {wallet.network.toUpperCase()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                  {wallet.address}
                </p>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Last used: {wallet.lastUsed ? new Date(wallet.lastUsed).toLocaleDateString() : "Never"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No withdrawal wallets</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add a wallet to start withdrawing funds.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Requests */}
      <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-stroke-dark dark:bg-box-dark sm:px-7.5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-black dark:text-white">
            Withdrawal Requests
          </h3>
          {userStatus.isActive && (
            <button
              onClick={() => setShowWithdraw(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
            >
              New Withdrawal
            </button>
          )}
        </div>
        
        {!userStatus.isActive ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Account Not Active</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Please contact support to activate your account to view withdrawal requests.
              </p>
            </div>
          </div>
        ) : withdrawalRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Network</th>
                  <th className="px-6 py-3">Wallet Address</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Transaction Hash</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalRequests.map((request) => (
                  <tr key={request.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {(request.amount || 0).toFixed(2)} DIT
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {request.network.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {request.address.slice(0, 10)}...{request.address.slice(-8)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {request.txHash ? (
                        <a 
                          href={`https://etherscan.io/tx/${request.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-mono text-xs"
                        >
                          {request.txHash.slice(0, 10)}...
                        </a>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.timestamp).toLocaleString()}
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
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No withdrawal requests</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Your withdrawal requests will appear here.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Wallet Modal */}
      {showAddWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-box-dark rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-black dark:text-white mb-4">
              Add Withdrawal Wallet
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
                  <option value="ethereum">Ethereum (ETH)</option>
                  <option value="usdt-erc20">USDT (ERC-20)</option>
                  <option value="usdt-trc20">USDT (TRC-20)</option>
                  <option value="usdt-bep20">USDT (BEP-20)</option>
                  <option value="usdt-polygon">USDT (Polygon)</option>
                  <option value="bitcoin">Bitcoin (BTC)</option>
                  <option value="polygon">Polygon (MATIC)</option>
                  <option value="bsc">Binance Smart Chain (BNB)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Label
                </label>
                <input
                  type="text"
                  value={newWallet.label}
                  onChange={(e) => setNewWallet({ ...newWallet, label: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., My Main Wallet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={newWallet.address}
                  onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono"
                  placeholder="0x..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddWallet(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWallet}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Add Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-box-dark rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-black dark:text-white mb-4">
              Withdraw Funds
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Network
                </label>
                <select
                  value={withdrawForm.network}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, network: e.target.value, walletId: "" })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="ethereum">Ethereum (ETH)</option>
                  <option value="usdt-erc20">USDT (ERC-20)</option>
                  <option value="usdt-trc20">USDT (TRC-20)</option>
                  <option value="usdt-bep20">USDT (BEP-20)</option>
                  <option value="usdt-polygon">USDT (Polygon)</option>
                  <option value="bitcoin">Bitcoin (BTC)</option>
                  <option value="polygon">Polygon (MATIC)</option>
                  <option value="bsc">Binance Smart Chain (BNB)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Wallet
                </label>
                <select
                  value={withdrawForm.walletId}
                  onChange={(e) => {
                    const wallet = withdrawalWallets.find(w => w.id === e.target.value);
                    setWithdrawForm({ 
                      ...withdrawForm, 
                      walletId: e.target.value,
                      network: wallet?.network || withdrawForm.network
                    });
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a wallet</option>
                  {withdrawalWallets
                    .filter(w => w.isVerified && w.network === withdrawForm.network)
                    .map(wallet => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.label} - {wallet.address.substring(0, 8)}...
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (DIT Tokens)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={withdrawForm.tokenAmount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, tokenAmount: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter DIT token amount"
                />
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Available: {userStatus.availableTokens.toFixed(2)} DIT tokens
                  </p>
                  {withdrawForm.tokenAmount && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      USD Value: ${(parseFloat(withdrawForm.tokenAmount) * currentTokenPrice).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                  ✅ Withdrawal Information
                </h4>
                <div className="text-xs text-green-800 dark:text-green-200 space-y-1">
                  <p>• Regular withdrawals have no lock period</p>
                  <p>• Only available tokens can be withdrawn (staked tokens are locked separately)</p>
                  <p>• Withdrawals are processed after admin approval</p>
                  <p>• Processing time: 1-3 business days after approval</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Network Information
                </h4>
                <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  {withdrawForm.network === 'ethereum' && (
                    <>
                      <p>• Network: Ethereum Mainnet</p>
                      <p>• Gas fees: ~$5-20 (varies with network congestion)</p>
                      <p>• Confirmation time: 1-5 minutes</p>
                    </>
                  )}
                  {withdrawForm.network === 'usdt-erc20' && (
                    <>
                      <p>• Network: USDT (ERC-20) on Ethereum</p>
                      <p>• Gas fees: ~$5-20 (varies with network congestion)</p>
                      <p>• Confirmation time: 1-5 minutes</p>
                      <p>• Contract: 0xdAC17F958D2ee523a2206206994597C13D831ec7</p>
                    </>
                  )}
                  {withdrawForm.network === 'usdt-trc20' && (
                    <>
                      <p>• Network: USDT (TRC-20) on Tron</p>
                      <p>• Transaction fees: ~$1 (very low)</p>
                      <p>• Confirmation time: 1-3 minutes</p>
                      <p>• Contract: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t</p>
                    </>
                  )}
                  {withdrawForm.network === 'usdt-bep20' && (
                    <>
                      <p>• Network: USDT (BEP-20) on BSC</p>
                      <p>• Gas fees: ~$0.10-0.50 (low)</p>
                      <p>• Confirmation time: 1-3 minutes</p>
                      <p>• Contract: 0x55d398326f99059fF775485246999027B3197955</p>
                    </>
                  )}
                  {withdrawForm.network === 'usdt-polygon' && (
                    <>
                      <p>• Network: USDT on Polygon</p>
                      <p>• Gas fees: ~$0.01-0.05 (very low)</p>
                      <p>• Confirmation time: 1-2 minutes</p>
                      <p>• Contract: 0xc2132D05D31c914a87C6611C10748AEb04B58e8F</p>
                    </>
                  )}
                  {withdrawForm.network === 'bitcoin' && (
                    <>
                      <p>• Network: Bitcoin</p>
                      <p>• Transaction fees: ~$1-10 (varies with network congestion)</p>
                      <p>• Confirmation time: 10-60 minutes</p>
                    </>
                  )}
                  {withdrawForm.network === 'polygon' && (
                    <>
                      <p>• Network: Polygon (MATIC)</p>
                      <p>• Gas fees: ~$0.01-0.05 (very low)</p>
                      <p>• Confirmation time: 1-2 minutes</p>
                    </>
                  )}
                  {withdrawForm.network === 'bsc' && (
                    <>
                      <p>• Network: Binance Smart Chain</p>
                      <p>• Gas fees: ~$0.10-0.50 (low)</p>
                      <p>• Confirmation time: 1-3 minutes</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowWithdraw(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}