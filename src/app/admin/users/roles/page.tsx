"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isSuperAdminUser } from "@/lib/admin-auth";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UserRoleManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/sign-in");
      return;
    }

    // Only superadmin can access this page
    if (!isSuperAdminUser(session)) {
      router.push("/admin/dashboard");
      return;
    }

    loadUsers();
  }, [status, session, router]);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setMessage(`User role updated to ${newRole} successfully`);
        loadUsers(); // Reload users
        setTimeout(() => setMessage(""), 5000);
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error || "Failed to update user role"}`);
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      setMessage("Error: Failed to update user role");
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setMessage(`User ${!currentStatus ? "activated" : "deactivated"} successfully`);
        loadUsers(); // Reload users
        setTimeout(() => setMessage(""), 5000);
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error || "Failed to update user status"}`);
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      setMessage("Error: Failed to update user status");
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "bg-purple-100 text-purple-800";
      case "ADMIN":
        return "bg-blue-100 text-blue-800";
      case "USER":
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

  if (!session || session.user?.email !== "superadmin@ditokens.com") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">This page is only accessible to superadmins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          User Role Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage user roles and permissions (Superadmin Only)
        </p>
      </div>

      {message && (
        <div className={`mb-6 rounded-lg border p-4 ${
          message.includes("Error") 
            ? "bg-red-50 border-red-200 text-red-800" 
            : "bg-green-50 border-green-200 text-green-800"
        }`}>
          {message}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            All Users
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage user roles and account status
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Current Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {/* Role Change Buttons */}
                    {user.role !== "SUPERADMIN" && (
                      <>
                        {user.role !== "ADMIN" && (
                          <button
                            onClick={() => updateUserRole(user.id, "ADMIN")}
                            className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-300 hover:bg-blue-50"
                          >
                            Make Admin
                          </button>
                        )}
                        {user.role !== "USER" && (
                          <button
                            onClick={() => updateUserRole(user.id, "USER")}
                            className="text-gray-600 hover:text-gray-800 px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                          >
                            Make User
                          </button>
                        )}
                      </>
                    )}
                    
                    {/* Status Toggle */}
                    {user.email !== "superadmin@ditokens.com" && (
                      <button
                        onClick={() => toggleUserStatus(user.id, user.isActive)}
                        className={`px-2 py-1 rounded border ${
                          user.isActive
                            ? "text-red-600 hover:text-red-800 border-red-300 hover:bg-red-50"
                            : "text-green-600 hover:text-green-800 border-green-300 hover:bg-green-50"
                        }`}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}
                    
                    {user.email === "superadmin@ditokens.com" && (
                      <span className="text-gray-400 text-xs">Protected Account</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          🔒 Superadmin Privileges
        </h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>• <strong>Make Admin:</strong> Promote users to admin role (can manage most features)</p>
          <p>• <strong>Make User:</strong> Demote admins back to regular user role</p>
          <p>• <strong>Activate/Deactivate:</strong> Control user account access</p>
          <p>• <strong>Protected Accounts:</strong> Superadmin account cannot be modified</p>
        </div>
      </div>
    </div>
  );
}
