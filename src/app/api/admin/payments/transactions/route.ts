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

    // Fetch real transactions from database
    const transactions = await prisma.transaction.findMany({
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
    const formattedTransactions = transactions.map(txn => ({
      id: txn.id,
      userId: txn.userId,
      userEmail: txn.user.email,
      userName: txn.user.name,
      type: txn.type,
      amount: txn.amount,
      tokenAmount: txn.tokenAmount,
      status: txn.status,
      paymentMethod: txn.paymentMethod || "SYSTEM",
      createdAt: txn.createdAt.toISOString(),
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
