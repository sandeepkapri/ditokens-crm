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

    // Get current token price
    const currentPrice = 2.8; // This would come from a price feed in production

    // Get total supply and market data
    const totalSupply = 50000000; // 50M total supply
    const totalHolders = await prisma.user.count({
      where: { totalTokens: { gt: 0 } }
    });

    // Calculate market statistics
    const marketCap = totalSupply * currentPrice;
    const availableTokens = totalSupply * 0.7; // 70% available for purchase
    const stakedTokens = totalSupply * 0.3; // 30% staked

    const stats = {
      totalSupply,
      availableTokens,
      stakedTokens,
      currentPrice,
      marketCap,
      totalHolders,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("Error fetching token stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch token statistics" },
      { status: 500 }
    );
  }
}
