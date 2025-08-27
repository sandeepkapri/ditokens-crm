"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { isAdminUser } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";

interface ReportForm {
  type: "transactions" | "withdrawals" | "users" | "referrals" | "commissions";
  startDate: string;
  endDate: string;
  format: "json" | "csv";
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState<ReportForm>({
    type: "transactions",
    startDate: "",
    endDate: "",
    format: "json",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");

  // Set default date range (last 30 days)
  useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    setFormData(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }));
  });

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || (!isAdminUser(session) && session.user.email !== "superadmin@ditokens.com")) {
    router.push("/auth/sign-in");
    return null;
  }

  const handleGenerateReport = async () => {
    if (!formData.startDate || !formData.endDate) {
      setMessage("Please select both start and end dates");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/admin/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        if (formData.format === "csv") {
          // Handle CSV download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${formData.type}_report_${formData.startDate}_to_${formData.endDate}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          setMessage("Report downloaded successfully!");
        } else {
          // Handle JSON response
          const data = await response.json();
          setMessage(`Report generated successfully! ${data.totalRecords} records found.`);
        }
        setTimeout(() => setMessage(""), 5000);
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const getReportDescription = (type: string) => {
    const descriptions: { [key: string]: string } = {
      transactions: "All token transactions including purchases, sales, and transfers",
      withdrawals: "Withdrawal requests and their status with 3-year lock information",
      users: "Complete user database with balances, status, and referral information",
      referrals: "Referral relationships and user connections",
      commissions: "Referral commission calculations and payment status",
    };
    return descriptions[type] || "";
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-bold text-black dark:text-white">
          Reports & Analytics
        </h2>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-md ${
          message.includes("Error") 
            ? "bg-red-100 text-red-700 border border-red-300" 
            : "bg-green-100 text-green-700 border border-green-300"
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Report Generation Form */}
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Generate Report
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Report Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="transactions">Transactions Report</option>
                <option value="withdrawals">Withdrawals Report</option>
                <option value="users">Users Report</option>
                <option value="referrals">Referrals Report</option>
                <option value="commissions">Commissions Report</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {getReportDescription(formData.type)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Output Format
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="json"
                    checked={formData.format === "json"}
                    onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as any }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">JSON (View in browser)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="csv"
                    checked={formData.format === "csv"}
                    onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as any }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">CSV (Download)</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Generating Report..." : "Generate Report"}
            </button>
          </div>
        </div>

        {/* Report Types Information */}
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Available Reports
          </h3>
          
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                📊 Transactions Report
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Complete transaction history with user details, amounts, and status
              </p>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                💰 Withdrawals Report
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Withdrawal requests with 3-year lock status and processing information
              </p>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                👥 Users Report
              </h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                User database with balances, referral information, and account status
              </p>
            </div>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                🎯 Referrals Report
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Referral relationships and user connections for tracking growth
              </p>
            </div>

            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-1">
                💸 Commissions Report
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Referral commission calculations, payments, and pending amounts
              </p>
            </div>
          </div>

          <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              💡 Tips
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Use date ranges to focus on specific periods</li>
              <li>• CSV format is best for data analysis in Excel</li>
              <li>• JSON format shows data directly in the browser</li>
              <li>• Large reports may take a few moments to generate</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Quick Report Actions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              const today = new Date();
              const lastMonth = new Date();
              lastMonth.setMonth(lastMonth.getMonth() - 1);
              
              setFormData({
                type: "transactions",
                startDate: lastMonth.toISOString().split('T')[0],
                endDate: today.toISOString().split('T')[0],
                format: "csv"
              });
            }}
            className="p-4 text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="font-medium text-blue-900 dark:text-blue-100">Last Month Transactions</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">CSV Download</div>
          </button>

          <button
            onClick={() => {
              const today = new Date();
              const lastWeek = new Date();
              lastWeek.setDate(lastWeek.getDate() - 7);
              
              setFormData({
                type: "withdrawals",
                startDate: lastWeek.toISOString().split('T')[0],
                endDate: today.toISOString().split('T')[0],
                format: "json"
              });
            }}
            className="p-4 text-center bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
          >
            <div className="text-2xl mb-2">💸</div>
            <div className="font-medium text-green-900 dark:text-green-100">Recent Withdrawals</div>
            <div className="text-sm text-green-700 dark:text-green-300">Browser View</div>
          </button>

          <button
            onClick={() => {
              setFormData({
                type: "users",
                startDate: "",
                endDate: "",
                format: "csv"
              });
            }}
            className="p-4 text-center bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="font-medium text-purple-900 dark:text-purple-100">All Users</div>
            <div className="text-sm text-purple-700 dark:text-purple-300">CSV Download</div>
          </button>
        </div>
      </div>
    </div>
  );
}
