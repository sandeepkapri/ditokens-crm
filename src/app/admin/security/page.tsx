"use client";

import { useSession } from "next-auth/react";
import { isAdminUser } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordExpiryDays: number;
  ipWhitelist: string[];
  lastPasswordChange: string;
  securityLevel: string;
}

interface LoginHistory {
  id: string;
  timestamp: string;
  ipAddress: string;
  location: string;
  device: string;
  browser: string;
  status: string;
}

export default function AdminSecurity() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: true,
    loginNotifications: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordExpiryDays: 90,
    ipWhitelist: ["192.168.1.0/24", "10.0.0.0/8"],
    lastPasswordChange: "2025-07-15T10:30:00Z",
    securityLevel: "HIGH"
  });
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || !isAdminUser(session)) {
      router.push("/auth/sign-in");
      return;
    }

    loadSecurityData();
  }, [status, session, router]);

  const loadSecurityData = async () => {
    try {
      const response = await fetch('/api/admin/security/login-history');
      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data.history || []);
      } else {
        console.error('Failed to load security data');
        setLoginHistory([]);
      }
    } catch (error) {
      console.error("Error loading security data:", error);
      setLoginHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Security settings updated successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters long!");
      return;
    }

    try {
      // Mock password change operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Error changing password");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "BLOCKED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "FAILED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !isAdminUser(session)) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-title-md2 font-bold text-black dark:text-white">Security Settings</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Manage your account security and access controls
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security Settings */}
          <div className="space-y-6">
            {/* Account Security */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
              <div className="p-4 border-b border-stroke dark:border-stroke-dark">
                <h3 className="text-lg font-medium text-black dark:text-white">Account Security</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black dark:text-white">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.twoFactorEnabled}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black dark:text-white">Login Notifications</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Get notified of new logins</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.loginNotifications}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, loginNotifications: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Max Login Attempts
                  </label>
                  <input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Password Expiry (days)
                  </label>
                  <input
                    type="number"
                    value={securitySettings.passwordExpiryDays}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordExpiryDays: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                  />
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Security Settings"}
                </button>
              </div>
            </div>

            {/* Password Change */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
              <div className="p-4 border-b border-stroke dark:border-stroke-dark">
                <h3 className="text-lg font-medium text-black dark:text-white">Change Password</h3>
              </div>
              <div className="p-6">
                {!showPasswordForm ? (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    Change Password
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handlePasswordChange}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        Update Password
                      </button>
                      <button
                        onClick={() => setShowPasswordForm(false)}
                        className="flex-1 px-4 py-2 border border-stroke text-black dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Login History */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="p-4 border-b border-stroke dark:border-stroke-dark">
              <h3 className="text-lg font-medium text-black dark:text-white">Recent Login History</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {loginHistory.map((login) => (
                  <div key={login.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(login.status)}`}>
                        {login.status}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(login.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-black dark:text-white">
                        <span className="font-medium">IP:</span> {login.ipAddress}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Location:</span> {login.location}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Device:</span> {login.device} • {login.browser}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security Level Indicator */}
        <div className="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <div className="p-4 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">Security Level</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-black dark:text-white">Current Level:</span>
                  <span className="inline-flex px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-200">
                    {securitySettings.securityLevel}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                <p className="text-sm font-medium text-black dark:text-white">
                  {new Date(securitySettings.lastPasswordChange).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
