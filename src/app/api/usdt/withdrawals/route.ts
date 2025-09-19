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

    // Get USDT withdrawal requests for the user
    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: {
        userId: user.id,
        network: "USDT"
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        amount: true,
        walletAddress: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        requestDate: true,
        processedDate: true,
        lockPeriod: true,
        canWithdraw: true
      }
    });

    return NextResponse.json({
      withdrawals
    });

  } catch (error) {
    console.error("Error fetching USDT withdrawals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
