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

    // Get the most recent token price
    const currentPrice = await prisma.tokenPrice.findFirst({
      orderBy: { date: 'desc' },
      select: { price: true, date: true }
    });

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
