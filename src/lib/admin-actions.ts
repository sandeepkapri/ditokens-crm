import { prisma } from "@/lib/prisma";

export interface AdminActionData {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an admin action to the database
 */
export async function logAdminAction(data: AdminActionData) {
  try {
    // TODO: Add AdminAction model to Prisma schema
    // For now, just log to console to avoid build errors
    console.log("Admin action:", data);
  } catch (error) {
    console.error("Failed to log admin action:", error);
    // Don't throw error to avoid breaking the main operation
  }
}

/**
 * Get admin actions for history display
 */
export async function getAdminActions(limit: number = 50) {
  try {
    // TODO: Add AdminAction model to Prisma schema
    // For now, return empty array to avoid build errors
    return [];
  } catch (error) {
    console.error("Failed to fetch admin actions:", error);
    return [];
  }
}
