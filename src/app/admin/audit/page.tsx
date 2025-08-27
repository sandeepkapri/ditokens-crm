"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdminUser } from "@/lib/admin-auth";

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: string;
  severity: string;
}

export default function AuditLogs() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || !isAdminUser(session)) {
      router.push("/auth/sign-in");
      return;
    }

    loadAuditLogs();
  }, [status, session, router]);

  const loadAuditLogs = async () => {
    try {
      // Mock data for demonstration
      const mockAuditLogs: AuditLog[] = [
        {
          id: "audit_001",
          timestamp: "2025-08-23T18:30:00Z",
          userId: "user_001",
          userEmail: "john.doe@example.com",
          action: "LOGIN",
          resource: "AUTH",
          resourceId: "auth_001",
          details: "User logged in successfully",
          ipAddress: "192.168.1.100",
          userAgent: "Chrome 120.0.0.0",
          status: "SUCCESS",
          severity: "LOW",
        },
        {
          id: "audit_002",
          timestamp: "2025-08-23T18:25:00Z",
          userId: "admin_001",
          userEmail: "admin@ditokens.com",
          action: "UPDATE_USER",
          resource: "USER",
          resourceId: "user_002",
          details: "Updated user profile information",
          ipAddress: "192.168.1.100",
          userAgent: "Chrome 120.0.0.0",
          status: "SUCCESS",
          severity: "MEDIUM",
        },
        {
          id: "audit_003",
          timestamp: "2025-08-23T18:20:00Z",
          userId: "user_003",
          userEmail: "mike.johnson@example.com",
          action: "PURCHASE_TOKENS",
          resource: "TOKEN",
          resourceId: "token_001",
          details: "Purchased 1000 DIT tokens for $250.00",
          ipAddress: "203.45.67.89",
          userAgent: "Firefox 119.0.0.0",
          status: "SUCCESS",
          severity: "MEDIUM",
        },
        {
          id: "audit_004",
          timestamp: "2025-08-23T18:15:00Z",
          userId: "user_004",
          userEmail: "sarah.wilson@example.com",
          action: "WITHDRAWAL_REQUEST",
          resource: "WALLET",
          resourceId: "wallet_001",
          details: "Requested withdrawal of $100.00 USDT",
          ipAddress: "192.168.1.100",
          userAgent: "Chrome 120.0.0.0",
          status: "PENDING",
          severity: "HIGH",
        },
        {
          id: "audit_005",
          timestamp: "2025-08-23T18:10:00Z",
          userId: "admin_001",
          userEmail: "admin@ditokens.com",
          action: "APPROVE_WITHDRAWAL",
          resource: "WITHDRAWAL",
          resourceId: "withdrawal_001",
          details: "Approved withdrawal request for user_005",
          ipAddress: "192.168.1.100",
          userAgent: "Chrome 120.0.0.0",
          status: "SUCCESS",
          severity: "HIGH",
        },
        {
          id: "audit_006",
          timestamp: "2025-08-23T18:05:00Z",
          userId: "user_006",
          userEmail: "emma.davis@example.com",
          action: "LOGIN",
          resource: "AUTH",
          resourceId: "auth_002",
          details: "Failed login attempt - incorrect password",
          ipAddress: "192.168.1.100",
          userAgent: "Chrome 120.0.0.0",
          status: "FAILED",
          severity: "MEDIUM",
        },
        {
          id: "audit_007",
          timestamp: "2025-08-23T18:00:00Z",
          userId: "admin_001",
          userEmail: "admin@ditokens.com",
          action: "UPDATE_TOKEN_PRICE",
          resource: "TOKEN",
          resourceId: "token_price_001",
          details: "Updated token price from $2.75 to $2.80",
          ipAddress: "192.168.1.100",
          userAgent: "Chrome 120.0.0.0",
          status: "SUCCESS",
          severity: "HIGH",
        },
        {
          id: "audit_008",
          timestamp: "2025-08-23T17:55:00Z",
          userId: "user_007",
          userEmail: "alex.taylor@example.com",
          action: "STAKE_TOKENS",
          resource: "STAKING",
          resourceId: "staking_001",
          details: "Staked 500 DIT tokens for 3 years",
          ipAddress: "192.168.1.100",
          userAgent: "Chrome 120.0.0.0",
          status: "SUCCESS",
          severity: "MEDIUM",
        },
      ];

      setAuditLogs(mockAuditLogs);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesFilter = filter === "all" || log.status.toLowerCase() === filter.toLowerCase();
    const matchesSeverity = severityFilter === "all" || log.severity.toLowerCase() === severityFilter.toLowerCase();
    const matchesSearch = log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSeverity && matchesSearch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "LOW":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "HIGH":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "CRITICAL":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "PENDING":
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
          <h2 className="text-title-md2 font-bold text-black dark:text-white">Audit Logs</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Monitor system activities and security events
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by user, action, resource, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
          >
            <option value="all">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Audit Logs Table */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <div className="p-4 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">
              System Audit Logs ({filteredLogs.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-box-dark divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4">
                      <p className="text-sm text-black dark:text-white">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-black dark:text-white">{log.userEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-black dark:text-white">{log.action}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-black dark:text-white">{log.resource}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">ID: {log.resourceId}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-black dark:text-white max-w-xs truncate" title={log.details}>
                        {log.details}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-black dark:text-white">{log.ipAddress}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-24" title={log.userAgent}>
                        {log.userAgent}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No audit logs found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Export Options */}
        <div className="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <div className="p-4 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">Export Options</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                Export to CSV
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Export to PDF
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
                Generate Report
              </button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
                Clear Old Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
