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

    // Get current token price
    const currentPrice = 2.80; // In production, fetch from database
    
    // Get user statistics
    const [
      totalUsers,
      totalStakers,
      totalStakingRewards
    ] = await Promise.all([
      prisma.user.count(),
      prisma.stakingRecord.count({
        where: { status: "ACTIVE" }
      }),
      prisma.stakingRecord.aggregate({
        where: { status: "ACTIVE" },
        _sum: { rewards: true }
      })
    ]);

    // Calculate token statistics from real data
    const totalSupply = 50000000; // 50M total supply
    const totalTokensData = await prisma.user.aggregate({
      _sum: { totalTokens: true }
    });
    const totalStakedData = await prisma.user.aggregate({
      _sum: { stakedTokens: true }
    });
    
    const circulatingSupply = totalTokensData._sum.totalTokens || 0;
    const stakedSupply = totalStakedData._sum.stakedTokens || 0;
    const marketCap = currentPrice * circulatingSupply;
    
    // Calculate average APY from staking records
    const stakingRecords = await prisma.stakingRecord.findMany({
      where: { status: "ACTIVE" },
      select: { apy: true }
    });
    const averageStakingAPY = stakingRecords.length > 0 
      ? stakingRecords.reduce((sum, record) => sum + record.apy, 0) / stakingRecords.length 
      : 12.5;

    const stats = {
      currentPrice,
      totalSupply,
      circulatingSupply,
      stakedSupply,
      marketCap,
      totalStakers,
      averageStakingAPY,
      totalStakingRewards: totalStakingRewards._sum.rewards || 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching token stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch token stats" },
      { status: 500 }
    );
  }
}
