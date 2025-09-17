import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayRange } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current token price from database (today's price first, then most recent)
    const { start, end } = getTodayRange();
    
    // Try to get today's price first
    let currentPriceRecord = await prisma.tokenPrice.findFirst({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      orderBy: { date: 'desc' },
      select: { price: true }
    });
    
    // If no price for today, get the most recent price
    if (!currentPriceRecord) {
      currentPriceRecord = await prisma.tokenPrice.findFirst({
        orderBy: { date: 'desc' },
        select: { price: true }
      });
    }
    
    const currentPrice = currentPriceRecord?.price || 2.8;

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
