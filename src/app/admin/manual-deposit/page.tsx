"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdminUser } from "@/lib/admin-auth";

export default function ManualDepositPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    userEmail: "",
    usdtAmount: "",
    txHash: "",
    fromWallet: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [recentDeposits, setRecentDeposits] = useState([]);

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
      loadRecentDeposits();
    }
  }, [status, router, session]);

  const loadRecentDeposits = async () => {
    try {
      const response = await fetch("/api/admin/usdt-transactions?limit=10");
      if (response.ok) {
        const data = await response.json();
        setRecentDeposits(data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to load recent deposits:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userEmail || !formData.usdtAmount || !formData.txHash || !formData.fromWallet) {
      setMessage("Please fill in all fields");
      return;
    }

    const usdtAmount = parseFloat(formData.usdtAmount);
    if (usdtAmount <= 0) {
      setMessage("USDT amount must be greater than 0");
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch("/api/admin/manual-deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: formData.userEmail,
          usdtAmount: usdtAmount,
          txHash: formData.txHash,
          fromWallet: formData.fromWallet
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Success! Processed ${data.transaction.usdtAmount} USDT → ${data.transaction.tokenAmount.toFixed(2)} DIT tokens for ${data.transaction.userEmail}`);
        setFormData({ userEmail: "", usdtAmount: "", txHash: "", fromWallet: "" });
        loadRecentDeposits();
        setTimeout(() => setMessage(""), 10000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (error) {
      setMessage("❌ Network error. Please try again.");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session || !isAdminUser(session)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">This page is only accessible to admins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-bold text-black dark:text-white">
          Manual USDT Deposit Processing
        </h2>
      </div>

      {/* Message */}
      {message && (
        <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className={`p-4 rounded-md ${
            message.includes("Success") 
              ? "bg-green-50 border border-green-200 text-green-800" 
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {message}
          </div>
        </div>
      )}

      {/* Manual Deposit Form */}
      <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Process USDT Deposit
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User Email *
              </label>
              <input
                type="email"
                value={formData.userEmail}
                onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="user@example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                USDT Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.usdtAmount}
                onChange={(e) => setFormData({ ...formData, usdtAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="100.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transaction Hash *
            </label>
            <input
              type="text"
              value={formData.txHash}
              onChange={(e) => setFormData({ ...formData, txHash: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
              placeholder="0x..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Wallet Address *
            </label>
            <input
              type="text"
              value={formData.fromWallet}
              onChange={(e) => setFormData({ ...formData, fromWallet: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
              placeholder="0x..."
              required
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              📋 Process:
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>User sends USDT to DiTokens company wallet</li>
              <li>Admin verifies the transaction on Etherscan</li>
              <li>Admin enters details here to process the deposit</li>
              <li>System automatically credits DIT tokens to user&apos;s account</li>
              <li>User and admin receive email notifications</li>
            </ol>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Process USDT Deposit"}
          </button>
        </form>
      </div>

      {/* Recent Deposits */}
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Recent USDT Deposits
        </h3>
        
        {recentDeposits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Tokens</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Hash</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentDeposits.map((deposit: any) => (
                  <tr key={deposit.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {deposit.user?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {deposit.user?.email || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        ${(deposit.amount || 0).toFixed(2)} USDT
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {(deposit.tokenAmount || 0).toFixed(2)} DIT
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        deposit.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {deposit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {deposit.txHash ? (
                        <a 
                          href={`https://etherscan.io/tx/${deposit.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-mono text-xs"
                        >
                          {deposit.txHash.slice(0, 10)}...
                        </a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(deposit.createdAt).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No recent deposits found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
