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

    // Get daily login data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyLogins = await prisma.loginHistory.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Create a map for easy lookup
    const loginMap = new Map();
    dailyLogins.forEach(login => {
      const date = new Date(login.createdAt).toDateString();
      loginMap.set(date, login._count.id);
    });

    // Generate data for last 30 days
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();
      const count = loginMap.get(dateString) || 0;
      result.push({ x: (30 - i).toString(), y: count });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Daily visitors analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
