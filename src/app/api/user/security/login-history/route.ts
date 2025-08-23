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

    // For now, we'll return mock data since we don't have a login history table yet
    // In a real application, you would create a LoginHistory model and track all login attempts
    
    const mockHistory = [
      {
        id: "1",
        timestamp: new Date().toISOString(),
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        location: "Local Network",
        status: "SUCCESS" as const,
        deviceType: "Mac",
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        location: "Local Network",
        status: "SUCCESS" as const,
        deviceType: "Mac",
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        location: "Local Network",
        status: "SUCCESS" as const,
        deviceType: "Mac",
      },
      {
        id: "4",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        location: "Local Network",
        status: "FAILED" as const,
        deviceType: "Windows",
      },
    ];

    const stats = {
      totalLogins: mockHistory.length,
      successfulLogins: mockHistory.filter(h => h.status === "SUCCESS").length,
      failedLogins: mockHistory.filter(h => h.status === "FAILED").length,
      uniqueIPs: new Set(mockHistory.map(h => h.ipAddress)).size,
      lastLogin: mockHistory[0]?.timestamp || "",
    };

    return NextResponse.json({
      history: mockHistory,
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
