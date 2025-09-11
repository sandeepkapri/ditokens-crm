import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdminUser } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isSuperAdminUser(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, pending, completed, rejected
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause based on type
    let whereClause: any = {};
    
    if (type === 'pending') {
      whereClause.status = 'PENDING';
    } else if (type === 'completed') {
      whereClause.status = 'COMPLETED';
    } else if (type === 'rejected') {
      whereClause.status = 'REJECTED';
    }
    // If type is 'all', no additional filters

    // Fetch payment approvals (PURCHASE transactions that need admin approval)
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          ...whereClause,
          type: 'PURCHASE' // Only purchase transactions for payment approvals
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
          ...whereClause,
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
      pricePerToken: transaction.pricePerToken,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod || 'unknown',
      walletAddress: transaction.walletAddress || 'N/A',
      adminNotes: transaction.adminNotes || null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
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
    console.error("Payment approvals fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
