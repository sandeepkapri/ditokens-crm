"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { isAdminUser } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Notification {
  id: string;
  userId: string | null;
  type: string;
  title: string;
  message: string;
  icon: string;
  isRead: boolean;
  isGlobal: boolean;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function NotificationManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSendForm, setShowSendForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "SYSTEM",
    isGlobal: true,
    userIds: [] as string[],
    icon: "📢",
  });
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || (!isAdminUser(session) && session.user.email !== "superadmin@ditokens.com")) {
      router.push("/auth/sign-in");
      return;
    }

    loadData();
  }, [status, session, router]);

  const loadData = async () => {
    try {
      const [notificationsResponse, usersResponse] = await Promise.all([
        fetch("/api/admin/notifications"),
        fetch("/api/admin/users")
      ]);

      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData.notifications || []);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!formData.title || !formData.message) {
      setMessage("Please fill in all required fields");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`Notification sent successfully to ${data.notificationsCreated} users!`);
        setShowSendForm(false);
        setFormData({
          title: "",
          message: "",
          type: "SYSTEM",
          isGlobal: true,
          userIds: [],
          icon: "📢",
        });
        loadData(); // Reload notifications
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
      setIsSending(false);
    }
  };

  const handleUserSelection = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter(id => id !== userId)
        : [...prev.userIds, userId]
    }));
  };

  const getNotificationTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      SYSTEM: "bg-blue-100 text-blue-800",
      ADMIN_MESSAGE: "bg-purple-100 text-purple-800",
      TRANSACTION: "bg-green-100 text-green-800",
      REFERRAL: "bg-yellow-100 text-yellow-800",
      WITHDRAWAL: "bg-red-100 text-red-800",
      DEPOSIT: "bg-emerald-100 text-emerald-800",
      SECURITY: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || (!isAdminUser(session) && session.user.email !== "superadmin@ditokens.com")) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-bold text-black dark:text-white">
          Notification Management
        </h2>
        <button
          onClick={() => setShowSendForm(!showSendForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {showSendForm ? "Cancel" : "Send New Notification"}
        </button>
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

      {/* Send Notification Form */}
      {showSendForm && (
        <div className="mb-8 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Send New Notification
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notification Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SYSTEM">System</option>
                <option value="ADMIN_MESSAGE">Admin Message</option>
                <option value="TRANSACTION">Transaction</option>
                <option value="REFERRAL">Referral</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="SECURITY">Security</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="📢"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter notification title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Enter notification message"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isGlobal}
                onChange={(e) => setFormData(prev => ({ ...prev, isGlobal: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Send to all active users
              </span>
            </label>
          </div>

          {!formData.isGlobal && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Users
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                {users.map(user => (
                  <label key={user.id} className="flex items-center py-1">
                    <input
                      type="checkbox"
                      checked={formData.userIds.includes(user.id)}
                      onChange={() => handleUserSelection(user.id)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {user.name} ({user.email})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleSendNotification}
              disabled={isSending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Recent Notifications
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  Type
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  Title
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  Message
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  Recipient
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(notification => (
                <tr key={notification.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNotificationTypeColor(notification.type)}`}>
                      {notification.icon} {notification.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {notification.title}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                    {notification.message}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {notification.isGlobal ? (
                      <span className="text-blue-600 font-medium">All Users</span>
                    ) : (
                      notification.user ? (
                        <span>{notification.user.name}</span>
                      ) : (
                        <span className="text-gray-400">Unknown User</span>
                      )
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      notification.isRead ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {notification.isRead ? "Read" : "Unread"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No notifications found
          </div>
        )}
      </div>
    </div>
  );
}
