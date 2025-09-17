import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDatabaseConnectionError, getDatabaseErrorMessage } from "@/lib/database-health";
import { getTodayString, getCurrentUTCDate } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all token prices ordered by date
    const prices = await prisma.tokenPrice.findMany({
      orderBy: { date: 'desc' },
      select: {
        price: true,
        date: true,
        createdAt: true
      }
    });

    if (prices.length === 0) {
      return NextResponse.json({
        currentPrice: 2.80,
        latestPrice: 2.80,
        totalUpdates: 0,
        highestPrice: 2.80,
        lowestPrice: 2.80,
        averagePrice: 2.80,
        priceChange24h: 0,
        priceChangePercent24h: 0,
        lastUpdated: new Date().toISOString()
      });
    }

    // Calculate statistics
    // Priority: Today's price > Most recent price
    const todayStr = getTodayString();
    const todayPrice = prices.find(p => p.date.toISOString().split('T')[0] === todayStr);
    
    const currentPrice = todayPrice ? todayPrice.price : prices[0].price;
    const latestPrice = prices[0].price;
    const totalUpdates = prices.length;
    
    // Find highest and lowest prices
    const pricesOnly = prices.map(p => p.price);
    const highestPrice = Math.max(...pricesOnly);
    const lowestPrice = Math.min(...pricesOnly);
    
    // Calculate average price
    const averagePrice = pricesOnly.reduce((sum, price) => sum + price, 0) / pricesOnly.length;
    
    // Calculate 24h change (compare with price from 24 hours ago or previous day)
    const now = getCurrentUTCDate();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Find price from yesterday or the most recent price before yesterday
    const yesterdayPrice = prices.find(p => {
      const priceDate = new Date(p.date);
      return priceDate <= yesterday;
    });
    
    const priceChange24h = yesterdayPrice ? currentPrice - yesterdayPrice.price : 0;
    const priceChangePercent24h = yesterdayPrice ? (priceChange24h / yesterdayPrice.price) * 100 : 0;
    
    // Get last updated timestamp
    const lastUpdated = prices[0].createdAt || prices[0].date;

    const stats = {
      currentPrice: Number(currentPrice.toFixed(2)),
      latestPrice: Number(latestPrice.toFixed(2)),
      totalUpdates,
      highestPrice: Number(highestPrice.toFixed(2)),
      lowestPrice: Number(lowestPrice.toFixed(2)),
      averagePrice: Number(averagePrice.toFixed(2)),
      priceChange24h: Number(priceChange24h.toFixed(2)),
      priceChangePercent24h: Number(priceChangePercent24h.toFixed(2)),
      lastUpdated: lastUpdated.toISOString()
    };

    return NextResponse.json(stats, { status: 200 });

  } catch (error) {
    console.error("Error fetching price statistics:", error);
    
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json(
        { 
          type: 'database_error',
          error: getDatabaseErrorMessage(error)
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch price statistics" },
      { status: 500 }
    );
  }
}
