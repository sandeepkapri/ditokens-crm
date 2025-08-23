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

    // Get staking information
    const stakingInfo = {
      totalStaked: user.stakedTokens || 0,
      availableTokens: user.availableTokens || 0,
      stakingRewards: user.totalEarnings || 0,
      stakingAPY: 12.5, // Fixed APY for now
      lockPeriod: 1095, // 3 years in days
      nextRewardDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Next month
    };

    // Get staking records
    const stakingRecords = await prisma.stakingRecord.findMany({
      where: { userId: user.id },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        amount: true,
        startDate: true,
        endDate: true,
        status: true,
        rewards: true,
        apy: true,
      },
    });

    return NextResponse.json({
      stakingInfo,
      stakingRecords,
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching staking data:", error);
    return NextResponse.json(
      { error: "Failed to fetch staking data" },
      { status: 500 }
    );
  }
}
