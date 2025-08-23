import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current token price (this would come from a price feed in production)
    const currentPrice = 2.8;

    // Calculate portfolio statistics
    const portfolioStats = {
      totalTokens: user.totalTokens || 0,
      totalValue: (user.totalTokens || 0) * currentPrice,
      stakedTokens: user.stakedTokens || 0,
      availableTokens: user.availableTokens || 0,
      totalEarnings: user.totalEarnings || 0,
      referralEarnings: user.referralEarnings || 0,
    };

    // Get transaction history
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to last 50 transactions
      select: {
        id: true,
        type: true,
        amount: true,
        tokenAmount: true,
        pricePerToken: true,
        status: true,
        description: true,
        createdAt: true,
      },
    });

    // Format transactions for frontend
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      tokenAmount: transaction.tokenAmount,
      pricePerToken: transaction.pricePerToken,
      status: transaction.status,
      description: transaction.description,
      timestamp: transaction.createdAt.toISOString(),
    }));

    return NextResponse.json({
      stats: portfolioStats,
      transactions: formattedTransactions,
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio data" },
      { status: 500 }
    );
  }
}
