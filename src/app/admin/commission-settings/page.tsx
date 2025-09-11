"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isAdminUser } from "@/lib/admin-auth";

interface CommissionSettings {
  id: string;
  referralRate: number; // Only referral commission, no staking
  updatedBy: string;
  updatedAt: string;
  createdAt: string;
}

export default function CommissionSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<CommissionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    referralRate: 5.0, // Only referral commission
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || !isAdminUser(session)) {
      router.push("/auth/sign-in");
      return;
    }

    loadSettings();
  }, [status, session, router]);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/commission-settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setFormData({
          referralRate: data.settings.referralRate, // Only referral commission
        });
      }
    } catch (error) {
      console.error("Error loading commission settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/admin/commission-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setIsEditing(false);
        setMessage("Commission settings updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      referralRate: settings?.referralRate || 5.0, // Only referral commission
    });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || !isAdminUser(session)) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-bold text-black dark:text-white">
          Commission Settings
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

      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
            Current Commission Structure
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Referral Commission Rate
              </h4>
              <p className="text-2xl font-bold text-blue-600">
                {settings?.referralRate || 5.0}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Earned on first deposit of referred users
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Income Model
              </h4>
              <p className="text-2xl font-bold text-green-600">
                Price Only
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                No staking income - only token price appreciation
              </p>
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Referral Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.referralRate}
                onChange={(e) => setFormData(prev => ({ ...prev, referralRate: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Percentage of first deposit amount earned as referral commission
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Staking Income
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Staking income is permanently disabled. The platform only generates income through token price appreciation.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-4">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit Settings
            </button>
          </div>
        )}

        {settings && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
              Settings History
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Last updated: {new Date(settings.updatedAt).toLocaleString()}</p>
              <p>Updated by: {settings.updatedBy}</p>
              <p>Created: {new Date(settings.createdAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
