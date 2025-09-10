"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

interface DepositTransaction {
  id: string;
  amount: number;
  tokenAmount: number;
  status: string;
  txHash: string | null;
  walletAddress: string | null;
  createdAt: string;
}

export default function DepositWalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [depositTransactions, setDepositTransactions] = useState<DepositTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  const [selectedNetwork, setSelectedNetwork] = useState("usdt-erc20");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
      return;
    }
    
    if (session?.user) {
      loadDepositData();
    }
  }, [status, router, session]);

  const loadDepositData = async () => {
    try {
      setIsLoading(true);
      
      // Load user balance
      const balanceResponse = await fetch("/api/tokens/portfolio");
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setUserBalance(balanceData.availableTokens || 0);
      }

      // Load deposit transactions
      const response = await fetch("/api/wallets/deposit");
      if (response.ok) {
        const data = await response.json();
        setDepositTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to load deposit data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage("Copied to clipboard!");
    setTimeout(() => setMessage(""), 2000);
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
          💰 USDT Deposit to DiTokens
        </h2>
      </div>

      {/* Message */}
      {message && (
        <div className="mb-6 rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
          <div className={`p-4 rounded-md ${
            message.includes("successfully") || message.includes("Copied") 
              ? "bg-green-50 border border-green-200 text-green-800" 
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {message}
          </div>
        </div>
      )}

      {/* Network Selection */}
      <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          🌐 Select USDT Network
        </h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Choose your preferred USDT network:
          </label>
          <div className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            USDT (ERC-20) on Ethereum
          </div>
        </div>
      </div>

      {/* USDT Deposit Instructions */}
      <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          💰 Send USDT to DiTokens Company Wallet
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company USDT Wallet Address
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={
                  '0x7E874A697007965c6A3DdB1702828A764E7a91c3'
                }
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(
                  '0x7E874A697007965c6A3DdB1702828A764E7a91c3'
                )}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Send USDT ({selectedNetwork.toUpperCase().replace('USDT-', '')}) to this address to purchase DIT tokens
            </p>
          </div>
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              QR Code
            </label>
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
              <Image
                src="/images/qr/usdt-trc20-qr.jpeg"
                alt="USDT Wallet QR Code"
                width={200}
                height={200}
                className="rounded"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Scan to get wallet address
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            📋 How to Deposit USDT to DiTokens:
          </h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li><strong>Copy the DiTokens company wallet address above</strong> or scan the QR code</li>
            <li><strong>Open your crypto wallet (MetaMask, Trust Wallet, etc.)</strong></li>
            <li><strong>Send USDT (ERC-20) from your wallet to the DiTokens company wallet address</strong></li>
            <li><strong>Wait for 3 blockchain confirmations</strong> (usually 5-10 minutes)</li>
            <li><strong>Our admin team will verify your transaction</strong></li>
            <li><strong>DIT tokens will be manually credited to your DiTokens account</strong></li>
            <li>You'll receive an email confirmation when processing is complete</li>
          </ol>
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ Important:</strong> Send USDT TO the DiTokens company wallet address above. 
              Do NOT send to your own wallet address - that won't work!
            </p>
          </div>
          
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
            <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">
              💡 How It Works:
            </h5>
            <p className="text-sm text-green-800 dark:text-green-200">
              When you send USDT to our company wallet, our admin team will verify your transaction 
              and manually process your deposit. We'll calculate how many DIT tokens you should receive 
              based on the current price and credit them to your DiTokens account. Processing typically 
              takes 1-24 hours during business days. You'll receive an email confirmation once processing is complete.
            </p>
          </div>
        </div>
      </div>

      {/* User Balance */}
      <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Your Balance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {(userBalance || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Available DIT Tokens
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${((userBalance || 0) * 2.80).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Estimated Value (USD)
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {((userBalance || 0) * 2.80 / 1).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Equivalent USDT
            </div>
          </div>
        </div>
      </div>

      {/* USDT Contract Information */}
      <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          USDT Contract Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Network Details
            </label>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Network:</span>
                <span className="text-black dark:text-white font-medium">Ethereum (ERC-20)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Decimals:</span>
                <span className="text-black dark:text-white font-medium">6</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Confirmations:</span>
                <span className="text-black dark:text-white font-medium">3 blocks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Processing Time:</span>
                <span className="text-black dark:text-white font-medium">5-10 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit History */}
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Deposit History
        </h3>
        
        {depositTransactions.length > 0 ? (
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
                {depositTransactions.map((transaction) => (
                  <tr key={transaction.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        ${(transaction.amount || 0).toFixed(2)} USDT
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {(transaction.tokenAmount || 0).toFixed(2)} DIT
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
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No deposits yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Your USDT deposits will appear here.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Important Information */}
      <div className="mt-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <h3 className="text-lg font-medium text-black dark:text-white mb-4">
          ⚠️ Important USDT Information
        </h3>
        
        <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start">
            <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong>Only send USDT (ERC-20)</strong> to our company wallet. Other tokens will be lost.
            </div>
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong>Wait for 3 confirmations</strong> (5-10 minutes) before tokens are credited to your account.
            </div>
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <strong>Ethereum network fees</strong> apply for USDT transactions. Check gas fees before sending.
            </div>
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <strong>Automatic processing:</strong> DIT tokens are credited automatically after confirmation.
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}