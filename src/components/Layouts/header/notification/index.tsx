"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { formatNotificationTime, getNotificationIcon } from "@/lib/notifications";
import { BellIcon } from "./icons";

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  icon?: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const isMobile = useIsMobile();

  const loadNotifications = async () => {
    if (!session?.user?.email) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/user/notifications?limit=10");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/user/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/user/notifications/mark-all-read", {
        method: "POST",
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      loadNotifications();
    }
  }, [session?.user?.email]);

  // Refresh notifications when dropdown opens
  const handleDropdownToggle = (value: React.SetStateAction<boolean>) => {
    const open = typeof value === 'function' ? value(isOpen) : value;
    setIsOpen(open);
    if (open && session?.user?.email) {
      loadNotifications();
    }
  };

  return (
    <Dropdown
      isOpen={isOpen}
      setIsOpen={handleDropdownToggle}
    >
      <DropdownTrigger
        className="grid size-12 place-items-center rounded-full border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-3 dark:text-white dark:focus-visible:border-primary"
        aria-label="View Notifications"
      >
        <span className="relative">
          <BellIcon />

          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute right-0 top-0 z-1 size-2 rounded-full bg-red-500 ring-2 ring-gray-2 dark:ring-dark-3",
              )}
            >
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-500 opacity-75" />
            </span>
          )}
        </span>
      </DropdownTrigger>

      <DropdownContent
        align={isMobile ? "end" : "center"}
        className="border border-stroke bg-white px-3.5 py-3 shadow-md dark:border-dark-3 dark:bg-gray-dark min-[350px]:min-w-[22rem]"
      >
        <div className="mb-1 flex items-center justify-between px-2 py-1.5">
          <span className="text-lg font-medium text-dark dark:text-white">
            Notifications
          </span>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-primary px-[9px] py-0.5 text-xs font-medium text-white">
                {unreadCount} new
              </span>
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary-dark dark:text-primary-light"
              >
                Mark all read
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-2">🔔</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No notifications yet
            </p>
          </div>
        ) : (
          <ul className="mb-3 max-h-[23rem] space-y-1.5 overflow-y-auto">
            {notifications.map((notification) => (
              <li key={notification.id} role="menuitem">
                <button
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 rounded-lg px-2 py-2 outline-none text-left transition-colors",
                    "hover:bg-gray-100 focus-visible:bg-gray-100 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3",
                    !notification.isRead && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm">
                    {notification.icon || getNotificationIcon(notification.type as any)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <strong className={cn(
                          "block text-sm font-medium truncate",
                          notification.isRead 
                            ? "text-gray-700 dark:text-gray-300" 
                            : "text-gray-900 dark:text-white"
                        )}>
                          {notification.title}
                        </strong>
                        <p className={cn(
                          "text-sm mt-1 line-clamp-2",
                          notification.isRead 
                            ? "text-gray-500 dark:text-gray-400" 
                            : "text-gray-600 dark:text-gray-300"
                        )}>
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                      {formatNotificationTime(new Date(notification.createdAt))}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {notifications.length > 0 && (
          <button
            onClick={() => setIsOpen(false)}
            className="block w-full rounded-lg border border-primary p-2 text-center text-sm font-medium tracking-wide text-primary outline-none transition-colors hover:bg-blue-light-5 focus:bg-blue-light-5 focus:text-primary focus-visible:border-primary dark:border-dark-3 dark:text-dark-6 dark:hover:border-dark-5 dark:hover:bg-dark-3 dark:hover:text-dark-7 dark:focus-visible:border-dark-5 dark:focus-visible:bg-dark-3 dark:focus-visible:text-dark-7"
          >
            View all notifications
          </button>
        )}
      </DropdownContent>
    </Dropdown>
  );
}
