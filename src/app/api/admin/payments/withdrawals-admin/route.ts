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

    // Fetch real withdrawal requests from transactions table
    const withdrawalRequests = await prisma.transaction.findMany({
      where: {
        type: "WITHDRAWAL",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to match expected format
    const requests = withdrawalRequests.map(txn => {
      const isUsdtWithdrawal = txn.paymentMethod === "USDT";
      
      return {
        id: txn.id,
        userId: txn.userId,
        userEmail: txn.user.email,
        userName: txn.user.name,
        amount: isUsdtWithdrawal ? txn.amount : txn.tokenAmount, // For USDT: amount in USD, For DIT: tokenAmount
        tokenAmount: isUsdtWithdrawal ? 0 : txn.tokenAmount, // For USDT: 0 tokens, For DIT: actual tokens
        usdAmount: isUsdtWithdrawal ? txn.amount : txn.amount, // USD value for both
        network: txn.paymentMethod || "USDT",
        address: txn.walletAddress || "N/A",
        status: txn.status,
        fee: txn.processingFee || 0,
        createdAt: txn.createdAt.toISOString(),
        updatedAt: txn.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      requests,
    });
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawal requests" },
      { status: 500 }
    );
  }
}
