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
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    if (type && type !== 'all') {
      where.type = type.toUpperCase();
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { txHash: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Fetch transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
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
      prisma.transaction.count({ where })
    ]);

    // Format transactions for frontend
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      userId: transaction.userId,
      userEmail: transaction.user.email,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      description: transaction.description,
      createdAt: transaction.createdAt.toISOString(),
      paymentMethod: transaction.paymentMethod || 'UNKNOWN',
      reference: transaction.txHash || `TXN_${transaction.id.slice(-8).toUpperCase()}`,
      tokenAmount: transaction.tokenAmount,
      pricePerToken: transaction.pricePerToken,
      processingFee: transaction.processingFee,
      walletAddress: transaction.walletAddress
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
    console.error("Admin transactions fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
