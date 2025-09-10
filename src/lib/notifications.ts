import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  data?: any;
}

export async function createNotification(data: CreateNotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        icon: data.icon,
        data: data.data,
      },
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function createBulkNotifications(notifications: CreateNotificationData[]) {
  try {
    const result = await prisma.notification.createMany({
      data: notifications,
    });
    return result;
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return null;
  }
}

// Helper functions for common notification types
export const NotificationHelpers = {
  async onTokenPurchase(userId: string, tokenAmount: number, usdAmount: number) {
    return createNotification({
      userId,
      type: "TOKEN_PURCHASE",
      title: "Token Purchase Successful",
      message: `You have successfully purchased ${tokenAmount} DIT tokens for $${usdAmount.toFixed(2)}`,
      icon: "💰",
      data: { tokenAmount, usdAmount, type: "purchase" },
    });
  },

  async onTokenPurchasePending(userId: string, tokenAmount: number, usdAmount: number, transactionId: string) {
    return createNotification({
      userId,
      type: "TOKEN_PURCHASE",
      title: "Token Purchase Pending",
      message: `Your purchase of ${tokenAmount} DIT tokens for $${usdAmount.toFixed(2)} is pending payment confirmation. Transaction ID: ${transactionId}`,
      icon: "⏳",
      data: { tokenAmount, usdAmount, transactionId, type: "purchase_pending" },
    });
  },

  async onTokenPurchaseRejected(userId: string, tokenAmount: number, usdAmount: number, reason: string) {
    return createNotification({
      userId,
      type: "TOKEN_PURCHASE",
      title: "Token Purchase Rejected",
      message: `Your purchase of ${tokenAmount} DIT tokens for $${usdAmount.toFixed(2)} was rejected. Reason: ${reason}`,
      icon: "❌",
      data: { tokenAmount, usdAmount, reason, type: "purchase_rejected" },
    });
  },

  async onReferralCommission(userId: string, commissionAmount: number, referredUserName: string) {
    return createNotification({
      userId,
      type: "REFERRAL",
      title: "Referral Commission Earned",
      message: `You earned $${commissionAmount.toFixed(2)} commission from ${referredUserName}'s token purchase`,
      icon: "🎉",
      data: { commissionAmount, referredUserName, type: "commission" },
    });
  },

  async onStakingReward(userId: string, rewardAmount: number, stakingAmount: number) {
    // Staking rewards disabled - no notification sent
    return null;
  },

  async onWithdrawalRequest(userId: string, amount: number, status: string) {
    const statusEmoji = status === "COMPLETED" ? "✅" : status === "PENDING" ? "⏳" : "❌";
    const statusText = status === "COMPLETED" ? "completed" : status === "PENDING" ? "is being processed" : "failed";
    
    return createNotification({
      userId,
      type: "WITHDRAWAL",
      title: `Withdrawal ${status.toLowerCase()}`,
      message: `Your withdrawal request of $${amount.toFixed(2)} ${statusText}`,
      icon: statusEmoji,
      data: { amount, status, type: "withdrawal" },
    });
  },

  async onProfileUpdate(userId: string, field: string) {
    return createNotification({
      userId,
      type: "PROFILE_UPDATE",
      title: "Profile Updated",
      message: `Your ${field} has been successfully updated`,
      icon: "👤",
      data: { field, type: "profile_update" },
    });
  },

  async onSecurityAlert(userId: string, action: string, ipAddress?: string) {
    return createNotification({
      userId,
      type: "SECURITY",
      title: "Security Alert",
      message: `${action} detected on your account${ipAddress ? ` from ${ipAddress}` : ""}`,
      icon: "🔒",
      data: { action, ipAddress, type: "security" },
    });
  },

  async onSystemMessage(userId: string, title: string, message: string) {
    return createNotification({
      userId,
      type: "SYSTEM",
      title,
      message,
      icon: "📢",
      data: { type: "system_message" },
    });
  },

  async onAdminMessage(userId: string, title: string, message: string, adminName?: string) {
    return createNotification({
      userId,
      type: "ADMIN_MESSAGE",
      title,
      message: `${message}${adminName ? ` - ${adminName}` : ""}`,
      icon: "👨‍💼",
      data: { adminName, type: "admin_message" },
    });
  },
};

// Notification formatting helpers
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    SYSTEM: "📢",
    TRANSACTION: "💳",
    REFERRAL: "🎉",
    STAKING: "🏆",
    WITHDRAWAL: "💸",
    DEPOSIT: "💰",
    SECURITY: "🔒",
    PROFILE_UPDATE: "👤",
    TOKEN_PURCHASE: "🪙",
    ADMIN_MESSAGE: "👨‍💼",
  };
  return icons[type] || "📬";
}

export function formatNotificationTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
}
