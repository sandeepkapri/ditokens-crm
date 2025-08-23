import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== "admin@ditokens.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get staking statistics
    const [
      totalStakers,
      totalStaked,
      totalRewards,
      activeStakes,
      completedStakes
    ] = await Promise.all([
      prisma.stakingRecord.count({
        where: { status: "ACTIVE" }
      }),
      prisma.stakingRecord.aggregate({
        where: { status: "ACTIVE" },
        _sum: { amount: true }
      }),
      prisma.stakingRecord.aggregate({
        where: { status: "ACTIVE" },
        _sum: { rewards: true }
      }),
      prisma.stakingRecord.count({
        where: { status: "ACTIVE" }
      }),
      prisma.stakingRecord.count({
        where: { status: "COMPLETED" }
      })
    ]);

    const stats = {
      totalStakers,
      totalStaked: totalStaked._sum.amount || 0,
      totalRewards: totalRewards._sum.rewards || 0,
      activeStakes,
      completedStakes,
      averageAPY: 12.5, // Fixed APY for demo
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching staking stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch staking stats" },
      { status: 500 }
    );
  }
}
