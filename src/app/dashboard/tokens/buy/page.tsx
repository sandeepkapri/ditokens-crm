"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  processingTime: string;
  walletAddress: string;
  qrCode: string;
}

interface Transaction {
  id: string;
  amount: number;
  tokenAmount: number;
  status: string;
  createdAt: string;
  paymentMethod: string;
}

export default function BuyTokensPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("usdt_balance");
  const [amount, setAmount] = useState<string>("");
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number>(2.8);
  const [usdtBalance, setUsdtBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);

  const paymentMethods: PaymentMethod[] = [
    {
      id: "usdt_balance",
      name: "USDT Balance",
      icon: "💰",
      description: "Use your existing USDT balance",
      processingTime: "Instant",
      walletAddress: "",
      qrCode: ""
    },
    {
      id: "usdt",
      name: "USDT (ERC-20)",
      icon: "₿",
      description: "Pay with USDT on Ethereum network",
      processingTime: "10-30 minutes",
      walletAddress: "0x7E874A697007965c6A3DdB1702828A764E7a91c3",
      qrCode: "/images/qr/usdt-trc20-qr.jpeg"
    },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
    }
    
    if (session?.user) {
      loadCurrentPrice();
      loadPortfolioData();
    }
  }, [status, router, session]);

  useEffect(() => {
    if (amount && currentPrice) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount)) {
        setTokenAmount(numAmount / currentPrice);
      }
    } else {
      setTokenAmount(0);
    }
  }, [amount, currentPrice]);

  const loadCurrentPrice = async () => {
    try {
      const response = await fetch("/api/tokens/current-price");
      if (response.ok) {
        const data = await response.json();
        setCurrentPrice(data.price || 2.8);
      }
    } catch (error) {
      console.error("Failed to load current price:", error);
    }
  };

  const loadPortfolioData = async () => {
    try {
      const response = await fetch("/api/tokens/portfolio");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.recentTransactions || []);
        setUsdtBalance(data.usdtBalance || 0);
      }
    } catch (error) {
      console.error("Failed to load portfolio data:", error);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    setError("");
    setMessage("");
  };

  const handlePurchase = async () => {
    if (!selectedPaymentMethod) {
      setError("Please select a payment method");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    // Check USDT balance if using balance payment
    if (selectedPaymentMethod === "usdt_balance" && parseFloat(amount) > usdtBalance) {
      setError(`Insufficient USDT balance. Available: $${usdtBalance.toFixed(2)}`);
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      let response;
      
      if (selectedPaymentMethod === "usdt_balance") {
        // Purchase using USDT balance
        response = await fetch("/api/tokens/purchase-from-balance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: parseFloat(amount),
          }),
        });
      } else {
        // External payment method
        response = await fetch("/api/tokens/purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: parseFloat(amount),
            tokenAmount,
            paymentMethod: selectedPaymentMethod,
            currentPrice,
          }),
        });
      }

      const data = await response.json();

      if (response.ok) {
        if (selectedPaymentMethod === "usdt_balance") {
          // Instant purchase completed
          setMessage(data.message || "Purchase completed successfully!");
          await loadPortfolioData(); // Refresh transactions and USDT balance
        } else {
          // External payment - show instructions
          setPendingTransaction(data);
          setShowPaymentInstructions(true);
          setMessage("Purchase request created! Please make payment to complete your purchase.");
          await loadPortfolioData(); // Refresh transactions
        }
      } else {
        setError(data.error || "Purchase failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedMethod = () => {
    return paymentMethods.find(method => method.id === selectedPaymentMethod);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage("Wallet address copied to clipboard!");
    setTimeout(() => setMessage(""), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (status === "loading") {
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
            Buy DIT Tokens
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Purchase DIT tokens using USDT
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Purchase Form */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="p-6 border-b border-stroke dark:border-stroke-dark">
              <h3 className="text-lg font-medium text-black dark:text-white">
                Purchase Tokens
              </h3>
            </div>

            <div className="p-6">
              {/* Current Price and USDT Balance */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Current DIT Price
                    </span>
                    <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      ${currentPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      USDT Balance
                    </span>
                    <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                      ${usdtBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (USD)
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount in USD"
                  className="w-full px-4 py-3 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                />
                {amount && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    You will receive: <span className="font-semibold">{tokenAmount.toFixed(2)} DIT tokens</span>
                  </p>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Payment Method
                </label>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => handlePaymentMethodSelect(method.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPaymentMethod === method.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{method.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-black dark:text-white">
                            {method.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {method.description}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Processing time: {method.processingTime}
                          </div>
                        </div>
                        {method.id === "usdt_balance" && (
                          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                            ${usdtBalance.toFixed(2)} available
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Purchase Button */}
              <button
                onClick={handlePurchase}
                disabled={isLoading || !amount || !selectedPaymentMethod}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading 
                  ? "Processing..." 
                  : selectedPaymentMethod === "usdt_balance" 
                    ? "Buy DIT Tokens Now" 
                    : "Create Purchase Request"
                }
              </button>

              {/* Messages */}
              {message && (
                <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm">
                  {message}
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Payment Instructions - Only for external payments */}
          {showPaymentInstructions && pendingTransaction && selectedPaymentMethod !== "usdt_balance" && (
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
              <div className="p-6 border-b border-stroke dark:border-stroke-dark">
                <h3 className="text-lg font-medium text-black dark:text-white">
                  Payment Instructions
                </h3>
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="mb-4">
                    <Image
                      src={getSelectedMethod()?.qrCode || "/images/qr/usdt-erc20-qr.jpeg"}
                      alt="USDT QR Code"
                      width={200}
                      height={200}
                      className="mx-auto rounded-lg"
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Scan QR code or copy wallet address below
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Send exactly:
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg font-mono text-lg font-bold text-center">
                      ${pendingTransaction.amount} USDT
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      To wallet address:
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg font-mono text-sm break-all">
                        {pendingTransaction.walletAddress}
                      </div>
                      <button
                        onClick={() => copyToClipboard(pendingTransaction.walletAddress)}
                        className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <p className="font-medium mb-1">Important:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Send the exact amount: ${pendingTransaction.amount}</li>
                          <li>Use the correct network: {getSelectedMethod()?.name}</li>
                          <li>Transaction ID: {pendingTransaction.transactionId} (for reference)</li>
                          <li>Wait for 3-6 confirmations</li>
                          <li>Your tokens will be credited after admin confirmation</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction History */}
          <div className="lg:col-span-2 rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="p-6 border-b border-stroke dark:border-stroke-dark">
              <h3 className="text-lg font-medium text-black dark:text-white">
                Purchase History
              </h3>
            </div>

            <div className="p-6">
              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tokens
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-box-dark divide-y divide-gray-200 dark:divide-gray-700">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(transaction.createdAt)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            ${transaction.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {transaction.tokenAmount.toFixed(2)} DIT
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {transaction.paymentMethod.toUpperCase()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No purchases yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Your purchase history will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}