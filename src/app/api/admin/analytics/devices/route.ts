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

    // Get device data from login history
    const deviceData = await prisma.loginHistory.groupBy({
      by: ['deviceType'],
      _count: {
        deviceType: true
      }
    });

    const total = deviceData.reduce((sum, item) => sum + item._count.deviceType, 0);

    const devices = deviceData.map(item => ({
      name: item.deviceType || 'Unknown',
      amount: item._count.deviceType,
      percentage: total > 0 ? item._count.deviceType / total : 0
    }));

    // Sort by amount descending
    devices.sort((a, b) => b.amount - a.amount);

    return NextResponse.json(devices);

  } catch (error) {
    console.error("Devices analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
