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

    // Get user's withdrawal requests
    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      withdrawals: withdrawals.map(w => ({
        id: w.id,
        amount: w.amount,
        tokenAmount: w.tokenAmount,
        network: w.network,
        status: w.status,
        requestDate: w.requestDate.toISOString(),
        canWithdraw: w.canWithdraw,
        lockPeriod: w.lockPeriod,
      })),
    });
  } catch (error) {
    console.error("Error fetching user withdrawals:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawal requests" },
      { status: 500 }
    );
  }
}
