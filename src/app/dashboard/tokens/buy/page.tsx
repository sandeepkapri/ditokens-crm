"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  processingTime: string;
  fees: string;
}

export default function BuyTokensPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number>(2.8);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const paymentMethods: PaymentMethod[] = [
    {
      id: "credit_card",
      name: "Credit/Debit Card",
      icon: "💳",
      description: "Instant purchase with major credit cards",
      processingTime: "Instant",
      fees: "2.5%",
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      icon: "🏦",
      description: "Direct bank transfer for larger amounts",
      processingTime: "1-3 business days",
      fees: "0.5%",
    },
    {
      id: "crypto",
      name: "Cryptocurrency",
      icon: "₿",
      description: "Pay with Bitcoin, Ethereum, or USDT",
      processingTime: "10-30 minutes",
      fees: "1.0%",
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: "📱",
      description: "Quick payment with PayPal account",
      processingTime: "Instant",
      fees: "3.0%",
    },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
    }
    
    if (session?.user) {
      loadCurrentPrice();
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
      const response = await fetch("/api/tokens/price");
      if (response.ok) {
        const data = await response.json();
        setCurrentPrice(data.currentPrice || 2.8);
      }
    } catch (error) {
      console.error("Failed to load current price:", error);
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

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/tokens/purchase", {
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

      const data = await response.json();

      if (response.ok) {
        setMessage("Purchase successful! Redirecting to payment...");
        // In a real app, you would redirect to payment gateway
        setTimeout(() => {
          setMessage("Payment completed! Tokens added to your account.");
        }, 2000);
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
            Buy Tokens
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Purchase Ditokens using your preferred payment method
          </p>
        </div>

        {/* Status Messages */}
        {message && (
          <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
            <div className="text-sm text-green-700">{message}</div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Purchase Form */}
          <div className="space-y-6">
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
              <h3 className="text-lg font-medium text-black dark:text-white mb-4">
                Purchase Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (USD)
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Enter amount in USD"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Current Price:</span>
                    <span className="font-medium text-black dark:text-white">
                      ${currentPrice.toFixed(2)} per token
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-gray-600 dark:text-gray-400">Tokens to receive:</span>
                    <span className="font-medium text-black dark:text-white">
                      {tokenAmount.toFixed(2)} DIT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
              <h3 className="text-lg font-medium text-black dark:text-white mb-4">
                Select Payment Method
              </h3>
              
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => handlePaymentMethodSelect(method.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.id
                        ? "border-primary bg-primary bg-opacity-5"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <h4 className="font-medium text-black dark:text-white">
                            {method.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {method.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-500 dark:text-gray-400">
                          {method.processingTime}
                        </div>
                        <div className="font-medium text-black dark:text-white">
                          Fee: {method.fees}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={isLoading || !selectedPaymentMethod || !amount}
              className="w-full bg-primary text-white py-3 px-6 rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Processing...
                </>
              ) : (
                `Buy ${tokenAmount.toFixed(2)} DIT for $${amount || "0"}`
              )}
            </button>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
              <h3 className="text-lg font-medium text-black dark:text-white mb-4">
                Order Summary
              </h3>
              
              {selectedPaymentMethod && amount ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Token Amount:</span>
                    <span className="font-medium text-black dark:text-white">
                      {tokenAmount.toFixed(2)} DIT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Price per Token:</span>
                    <span className="font-medium text-black dark:text-white">
                      ${currentPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-medium text-black dark:text-white">
                      ${amount}
                    </span>
                  </div>
                  
                  {getSelectedMethod() && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Processing Fee:</span>
                      <span className="font-medium text-black dark:text-white">
                        ${(parseFloat(amount) * parseFloat(getSelectedMethod()!.fees.replace("%", "")) / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span className="text-primary">
                        ${getSelectedMethod() 
                          ? (parseFloat(amount) * (1 + parseFloat(getSelectedMethod()!.fees.replace("%", "")) / 100)).toFixed(2)
                          : amount
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Select payment method and enter amount to see order summary
                </div>
              )}
            </div>

            {/* Important Information */}
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
              <h3 className="text-lg font-medium text-black dark:text-white mb-4">
                Important Information
              </h3>
              
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tokens are delivered immediately after payment confirmation
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Minimum purchase amount: $10 USD
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  All purchases are final and non-refundable
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Processing fees vary by payment method
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
