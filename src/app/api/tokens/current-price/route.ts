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

    // Get today's price first, then fall back to most recent price
    const { start, end } = getTodayRange();
    
    // Try to get today's price first
    let currentPrice = await prisma.tokenPrice.findFirst({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      orderBy: { date: 'desc' },
      select: { price: true, date: true }
    });
    
    // If no price for today, get the most recent price
    if (!currentPrice) {
      currentPrice = await prisma.tokenPrice.findFirst({
        orderBy: { date: 'desc' },
        select: { price: true, date: true }
      });
    }

    if (!currentPrice) {
      return NextResponse.json({ error: "No token price found" }, { status: 404 });
    }

    // Return the actual latest price from database for consistent calculations
    const actualPrice = currentPrice.price;
    
    return NextResponse.json({
      price: actualPrice,
      date: currentPrice.date,
      timestamp: new Date().toISOString(),
      note: `Current price $${actualPrice} from database`
    });
  } catch (error) {
    console.error("Error fetching current token price:", error);
    return NextResponse.json(
      { error: "Failed to fetch current token price" },
      { status: 500 }
    );
  }
}
