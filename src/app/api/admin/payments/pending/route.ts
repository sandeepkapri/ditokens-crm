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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch pending transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.transaction.count({
        where: {
          status: 'PENDING',
          type: 'PURCHASE'
        }
      })
    ]);

    // Format transactions for frontend
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      userId: transaction.userId,
      userEmail: transaction.user.email,
      userName: transaction.user.name || 'Unknown User',
      amount: transaction.amount,
      tokenAmount: transaction.tokenAmount,
      paymentMethod: transaction.paymentMethod || 'unknown',
      walletAddress: transaction.walletAddress || 'N/A',
      createdAt: transaction.createdAt.toISOString(),
      description: transaction.description
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Pending payments fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
