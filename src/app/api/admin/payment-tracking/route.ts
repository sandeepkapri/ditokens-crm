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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const amount = searchParams.get('amount');
    const date = searchParams.get('date');

    // Get pending transactions
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        type: 'PURCHASE'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // If amount is provided, filter by amount
    let filteredTransactions = pendingTransactions;
    if (amount) {
      const targetAmount = parseFloat(amount);
      filteredTransactions = pendingTransactions.filter(t => 
        Math.abs(t.amount - targetAmount) < 0.01 // Allow small rounding differences
      );
    }

    // If date is provided, filter by date
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      
      filteredTransactions = filteredTransactions.filter(t => 
        t.createdAt >= startOfDay && t.createdAt <= endOfDay
      );
    }

    // Format transactions for frontend
    const formattedTransactions = filteredTransactions.map(transaction => ({
      id: transaction.id,
      userId: transaction.userId,
      userEmail: transaction.user.email,
      userName: transaction.user.name || 'Unknown User',
      amount: transaction.amount,
      tokenAmount: transaction.tokenAmount,
      paymentMethod: transaction.paymentMethod || 'usdt',
      walletAddress: transaction.walletAddress || '0x7E874A697007965c6A3DdB1702828A764E7a91c3',
      createdAt: transaction.createdAt.toISOString(),
      description: transaction.description,
      // Add tracking info
      trackingInfo: {
        expectedAmount: transaction.amount,
        expectedTokens: transaction.tokenAmount,
        timeWindow: {
          start: new Date(transaction.createdAt.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes before
          end: new Date(transaction.createdAt.getTime() + 2 * 60 * 60 * 1000).toISOString() // 2 hours after
        }
      }
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
      total: formattedTransactions.length,
      searchParams: { amount, date },
      walletAddress: '0x7E874A697007965c6A3DdB1702828A764E7a91c3'
    });

  } catch (error) {
    console.error("Payment tracking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
