import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdminUser(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all login history from database
    const loginHistory = await prisma.loginHistory.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to last 100 logins
    });

    // Format the history for the frontend
    const formattedHistory = loginHistory.map(record => ({
      id: record.id,
      timestamp: record.createdAt.toISOString(),
      ipAddress: record.ipAddress,
      location: record.location || getLocationFromIP(record.ipAddress),
      device: record.deviceType || getDeviceType(record.userAgent),
      browser: record.browser || getBrowser(record.userAgent),
      status: record.status,
      user: {
        name: record.user.name,
        email: record.user.email
      }
    }));

    return NextResponse.json({
      history: formattedHistory,
      total: loginHistory.length
    });

  } catch (error) {
    console.error("Admin security data fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getDeviceType(userAgent: string): string {
  if (userAgent.includes("Mobile")) return "Mobile";
  if (userAgent.includes("Tablet")) return "Tablet";
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "Mac";
  if (userAgent.includes("Linux")) return "Linux";
  return "Unknown";
}

function getBrowser(userAgent: string): string {
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  if (userAgent.includes("Opera")) return "Opera";
  return "Unknown";
}

function getLocationFromIP(ip: string): string {
  if (ip === "127.0.0.1" || ip === "localhost" || ip === "unknown") return "Local";
  if (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) return "Private Network";
  return "Unknown Location";
}
