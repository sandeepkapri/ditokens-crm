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
    const timeFrame = searchParams.get('timeFrame') || 'monthly';

    const now = new Date();
    let startDate: Date;

    if (timeFrame === 'yearly') {
      startDate = new Date(now.getFullYear() - 4, 0, 1); // Last 5 years
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Last 12 months
    }

    // Get completed transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'COMPLETED',
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

    // Group by time period
    const groupedData: { [key: string]: { received: number, due: number } } = {};

    transactions.forEach(transaction => {
      let key: string;
      
      if (timeFrame === 'yearly') {
        key = transaction.createdAt.getFullYear().toString();
      } else {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        key = monthNames[transaction.createdAt.getMonth()];
      }

      if (!groupedData[key]) {
        groupedData[key] = { received: 0, due: 0 };
      }

      if (transaction.type === 'PURCHASE' || transaction.type === 'DEPOSIT') {
        groupedData[key].received += transaction.amount;
      } else if (transaction.type === 'WITHDRAWAL' || transaction.type === 'SALE') {
        groupedData[key].due += transaction.amount;
      }
    });

    // Convert to arrays
    const received = Object.entries(groupedData).map(([x, data]) => ({ x, y: data.received }));
    const due = Object.entries(groupedData).map(([x, data]) => ({ x, y: data.due }));

    return NextResponse.json({
      received,
      due
    });

  } catch (error) {
    console.error("Payments analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
