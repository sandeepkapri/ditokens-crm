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

    // Get unique visitors from login history
    const uniqueVisitors = await prisma.loginHistory.groupBy({
      by: ['userId'],
      _count: {
        userId: true
      }
    });

    const totalVisitors = uniqueVisitors.length;

    // Get daily login data for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyLogins = await prisma.loginHistory.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      _count: {
        id: true
      }
    });

    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const chart = dayNames.map((day, index) => {
      const dayData = dailyLogins.find(login => {
        const loginDay = new Date(login.createdAt).getDay();
        return loginDay === index;
      });
      return { x: day, y: dayData?._count.id || 0 };
    });

    // Calculate performance (simplified)
    const currentWeek = dailyLogins.reduce((sum, day) => sum + day._count.id, 0);
    const previousWeek = 0; // Would need to calculate from previous week
    const performance = previousWeek > 0 ? ((currentWeek - previousWeek) / previousWeek) * 100 : 0;

    return NextResponse.json({
      total_visitors: totalVisitors,
      performance: Math.round(performance * 10) / 10,
      chart
    });

  } catch (error) {
    console.error("Visitors analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
