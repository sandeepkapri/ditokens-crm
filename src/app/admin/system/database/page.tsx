"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isSuperAdminUser } from "@/lib/admin-auth";

export default function DatabaseManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [databaseInfo, setDatabaseInfo] = useState({
    name: "ditokens_crm",
    version: "8.0.33",
    size: "2.4 GB",
    tables: 15,
    connections: 8,
    uptime: "15 days, 7 hours",
    lastBackup: "2025-08-26 14:30:00",
    backupSize: "2.1 GB",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!isSuperAdminUser(session)) {
      router.push("/admin/dashboard");
      return;
    }

    // Load database information
    loadDatabaseInfo();
  }, [session, status, router]);

  const loadDatabaseInfo = async () => {
    try {
      // Mock data for now - in production, fetch from API
      setDatabaseInfo({
        name: "ditokens_crm",
        version: "8.0.33",
        size: "2.4 GB",
        tables: 15,
        connections: 8,
        uptime: "15 days, 7 hours",
        lastBackup: "2025-08-26 14:30:00",
        backupSize: "2.1 GB",
      });
    } catch (error) {
      console.error("Error loading database info:", error);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      // Mock API call - in production, trigger backup
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setMessage("Database backup created successfully!");
      setTimeout(() => setMessage(""), 5000);
      
      // Update last backup time
      setDatabaseInfo(prev => ({
        ...prev,
        lastBackup: new Date().toISOString().replace('T', ' ').substring(0, 19)
      }));
    } catch (error) {
      setMessage("Error creating database backup");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const optimizeDatabase = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      // Mock API call - in production, optimize database
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage("Database optimization completed successfully!");
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      setMessage("Error optimizing database");
      setTimeout(() => setMessage(""), 5000);
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
            Database Management
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Monitor and manage database operations
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            type="button"
            onClick={createBackup}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Backup"}
          </button>
          <button
            type="button"
            onClick={optimizeDatabase}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto disabled:opacity-50"
          >
            {loading ? "Optimizing..." : "Optimize Database"}
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

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Database Name */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Database Name
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {databaseInfo.name}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Database Version */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Version
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {databaseInfo.version}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Database Size */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Size
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {databaseInfo.size}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Number of Tables */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Tables
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {databaseInfo.tables}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Database Status */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Database Status
            </h3>
            <div className="mt-5 space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Active Connections:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{databaseInfo.connections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Uptime:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{databaseInfo.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Last Backup:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{databaseInfo.lastBackup}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Backup Size:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{databaseInfo.backupSize}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Actions */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Quick Actions
            </h3>
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={loadDatabaseInfo}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Refresh Status
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Logs
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Performance Metrics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Database Tables Overview */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Database Tables
            </h3>
            <div className="mt-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  "users", "transactions", "token_prices", "staking_records", 
                  "withdrawal_requests", "referral_commissions", "notifications",
                  "commission_settings", "audit_logs", "system_settings",
                  "user_sessions", "api_keys", "webhooks", "backups", "migrations"
                ].map((table) => (
                  <div key={table} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {table.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Active
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
