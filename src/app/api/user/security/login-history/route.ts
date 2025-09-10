import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch real login history from database
    const loginHistory = await prisma.loginHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 logins
    });

    // Calculate stats from real data
    const stats = {
      totalLogins: loginHistory.length,
      successfulLogins: loginHistory.filter(h => h.status === "SUCCESS").length,
      failedLogins: loginHistory.filter(h => h.status === "FAILED").length,
      uniqueIPs: new Set(loginHistory.map(h => h.ipAddress)).size,
      lastLogin: loginHistory[0]?.createdAt?.toISOString() || "",
    };

    // Format the history for the frontend
    const formattedHistory = loginHistory.map(record => ({
      id: record.id,
      timestamp: record.createdAt.toISOString(),
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      location: record.location || getLocationFromIP(record.ipAddress),
      status: record.status,
      deviceType: record.deviceType || getDeviceType(record.userAgent),
    }));

    return NextResponse.json({
      history: formattedHistory,
      stats,
    }, { status: 200 });

  } catch (error) {
    console.error("Login history fetch error:", error);
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

function getLocationFromIP(ip: string): string {
  // In a real application, you would use an IP geolocation service
  // For now, we'll show a placeholder
  if (ip === "127.0.0.1" || ip === "localhost") return "Local";
  if (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) return "Private Network";
  return "Unknown Location";
}
