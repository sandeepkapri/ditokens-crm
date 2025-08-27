"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isSuperAdminUser } from "@/lib/admin-auth";

export default function SystemSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    emailNotifications: true,
    systemBackup: true,
    autoUpdate: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!isSuperAdminUser(session)) {
      router.push("/admin/dashboard");
      return;
    }

    // Load system settings
    loadSettings();
  }, [session, status, router]);

  const loadSettings = async () => {
    try {
      // Mock data for now - in production, fetch from API
      setSettings({
        maintenanceMode: false,
        registrationEnabled: true,
        maxLoginAttempts: 5,
        sessionTimeout: 30,
        emailNotifications: true,
        systemBackup: true,
        autoUpdate: false,
      });
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      // Mock API call - in production, send to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Error saving settings");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isSuperAdminUser(session)) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            System Settings
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={saveSettings}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mt-4 p-4 rounded-md ${
          message.includes("Error") 
            ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300" 
            : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
        }`}>
          {message}
        </div>
      )}

      <div className="mt-8 space-y-6">
        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              System Status
            </h3>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Maintenance Mode
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Temporarily disable user access for maintenance
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSettingChange("maintenanceMode", !settings.maintenanceMode)}
                  className={`${
                    settings.maintenanceMode
                      ? "bg-red-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      settings.maintenanceMode ? "translate-x-5" : "translate-x-0"
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    User Registration
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Allow new users to register
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSettingChange("registrationEnabled", !settings.registrationEnabled)}
                  className={`${
                    settings.registrationEnabled
                      ? "bg-green-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      settings.registrationEnabled ? "translate-x-5" : "translate-x-0"
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Security Settings
            </h3>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Maximum Login Attempts
                </label>
                <select
                  value={settings.maxLoginAttempts}
                  onChange={(e) => handleSettingChange("maxLoginAttempts", parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange("sessionTimeout", parseInt(e.target.value))}
                  min="15"
                  max="480"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Notification Settings
            </h3>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Notifications
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Send email notifications for system events
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSettingChange("emailNotifications", !settings.emailNotifications)}
                  className={`${
                    settings.emailNotifications
                      ? "bg-green-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      settings.emailNotifications ? "translate-x-5" : "translate-x-0"
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Maintenance */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              System Maintenance
            </h3>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Automatic Backups
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Enable automatic system backups
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSettingChange("systemBackup", !settings.systemBackup)}
                  className={`${
                    settings.systemBackup
                      ? "bg-green-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      settings.systemBackup ? "translate-x-5" : "translate-x-0"
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto Updates
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically apply system updates
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSettingChange("autoUpdate", !settings.autoUpdate)}
                  className={`${
                    settings.autoUpdate
                      ? "bg-green-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      settings.autoUpdate ? "translate-x-5" : "translate-x-0"
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
