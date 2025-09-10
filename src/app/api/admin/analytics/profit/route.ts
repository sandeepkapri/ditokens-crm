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

    const { searchParams } = new URL(request.url);
    const timeFrame = searchParams.get('timeFrame') || 'current';

    const now = new Date();
    let startDate: Date;

    if (timeFrame === 'last week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // Last 2 weeks
    }

    // Get transactions for the period
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        amount: true,
        createdAt: true,
        type: true
      }
    });

    // Group by day of week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const groupedData: { [key: string]: { sales: number, revenue: number } } = {};

    transactions.forEach(transaction => {
      const dayName = dayNames[transaction.createdAt.getDay()];
      
      if (!groupedData[dayName]) {
        groupedData[dayName] = { sales: 0, revenue: 0 };
      }

      if (transaction.type === 'PURCHASE' || transaction.type === 'DEPOSIT') {
        groupedData[dayName].sales += 1; // Count of transactions
        groupedData[dayName].revenue += transaction.amount;
      }
    });

    // Convert to arrays
    const sales = Object.entries(groupedData).map(([x, data]) => ({ x, y: data.sales }));
    const revenue = Object.entries(groupedData).map(([x, data]) => ({ x, y: data.revenue }));

    return NextResponse.json({
      sales,
      revenue
    });

  } catch (error) {
    console.error("Profit analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
