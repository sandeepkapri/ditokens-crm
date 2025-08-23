"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  referralEnabled: boolean;
  stakingEnabled: boolean;
  tokenPrice: number;
  referralCommission: number;
  stakingAPY: number;
  minStakingPeriod: number;
  maxWithdrawalLimit: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export default function SystemSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: "Ditokens CRM",
    siteDescription: "Professional CRM system for token management",
    maintenanceMode: false,
    registrationEnabled: true,
    referralEnabled: true,
    stakingEnabled: true,
    tokenPrice: 2.80,
    referralCommission: 5.0,
    stakingAPY: 12.5,
    minStakingPeriod: 3,
    maxWithdrawalLimit: 10000,
    emailNotifications: true,
    smsNotifications: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.email !== "admin@ditokens.com") {
      router.push("/auth/sign-in");
      return;
    }

    loadSettings();
  }, [status, session, router]);

  const loadSettings = async () => {
    try {
      // Mock data for demonstration
      // In real app, this would fetch from API
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading settings:", error);
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || session.user.email !== "admin@ditokens.com") {
    return null;
  }

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-title-md2 font-bold text-black dark:text-white">System Settings</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Configure system-wide settings and parameters
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {/* General Settings */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark mb-6">
            <div className="p-4 border-b border-stroke dark:border-stroke-dark">
              <h3 className="text-lg font-medium text-black dark:text-white">General Settings</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => handleInputChange("siteName", e.target.value)}
                    className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Site Description
                  </label>
                  <input
                    type="text"
                    value={settings.siteDescription}
                    onChange={(e) => handleInputChange("siteDescription", e.target.value)}
                    className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* System Features */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark mb-6">
            <div className="p-4 border-b border-stroke dark:border-stroke-dark">
              <h3 className="text-lg font-medium text-black dark:text-white">System Features</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleInputChange("maintenanceMode", e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="maintenanceMode" className="text-sm font-medium text-black dark:text-white">
                    Maintenance Mode
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="registrationEnabled"
                    checked={settings.registrationEnabled}
                    onChange={(e) => handleInputChange("registrationEnabled", e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="registrationEnabled" className="text-sm font-medium text-black dark:text-white">
                    Enable Registration
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="referralEnabled"
                    checked={settings.referralEnabled}
                    onChange={(e) => handleInputChange("referralEnabled", e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="referralEnabled" className="text-sm font-medium text-black dark:text-white">
                    Enable Referral System
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="stakingEnabled"
                    checked={settings.stakingEnabled}
                    onChange={(e) => handleInputChange("stakingEnabled", e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="stakingEnabled" className="text-sm font-medium text-black dark:text-white">
                    Enable Staking
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Token Settings */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark mb-6">
            <div className="p-4 border-b border-stroke dark:border-stroke-dark">
              <h3 className="text-lg font-medium text-black dark:text-white">Token Settings</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Token Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.tokenPrice}
                    onChange={(e) => handleInputChange("tokenPrice", parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Referral Commission (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.referralCommission}
                    onChange={(e) => handleInputChange("referralCommission", parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Staking APY (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.stakingAPY}
                    onChange={(e) => handleInputChange("stakingAPY", parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Min Staking Period (Years)
                  </label>
                  <input
                    type="number"
                    value={settings.minStakingPeriod}
                    onChange={(e) => handleInputChange("minStakingPeriod", parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Financial Settings */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark mb-6">
            <div className="p-4 border-b border-stroke dark:border-stroke-dark">
              <h3 className="text-lg font-medium text-black dark:text-white">Financial Settings</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Max Withdrawal Limit (USD)
                  </label>
                  <input
                    type="number"
                    value={settings.maxWithdrawalLimit}
                    onChange={(e) => handleInputChange("maxWithdrawalLimit", parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark mb-6">
            <div className="p-4 border-b border-stroke dark:border-stroke-dark">
              <h3 className="text-lg font-medium text-black dark:text-white">Notification Settings</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleInputChange("emailNotifications", e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="emailNotifications" className="text-sm font-medium text-black dark:text-white">
                    Email Notifications
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="smsNotifications"
                    checked={settings.smsNotifications}
                    onChange={(e) => handleInputChange("smsNotifications", e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="smsNotifications" className="text-sm font-medium text-black dark:text-white">
                    SMS Notifications
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
