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

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "7d";

    // Current price (this would come from a price feed in production)
    const currentPrice = 2.8;

    // Generate historical price data based on timeframe
    let priceData = [];
    const now = new Date();
    let days = 7;

    switch (timeframe) {
      case "1d":
        days = 1;
        break;
      case "7d":
        days = 7;
        break;
      case "1m":
        days = 30;
        break;
      case "3m":
        days = 90;
        break;
      case "1y":
        days = 365;
        break;
      default:
        days = 7;
    }

    // Generate mock price data with realistic variations
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some realistic price volatility
      const volatility = 0.05; // 5% daily volatility
      const randomChange = (Math.random() - 0.5) * volatility;
      const price = currentPrice * (1 + randomChange);
      
      priceData.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(price.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 500000, // Random volume between 500K and 1.5M
      });
    }

    return NextResponse.json({
      currentPrice,
      priceData,
      timeframe,
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching token price:", error);
    return NextResponse.json(
      { error: "Failed to fetch token price data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { price } = body;

    if (!price || isNaN(price)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Valid price is required' 
        },
        { status: 400 }
      );
    }

    // Create new token price entry
    const tokenPrice = await prisma.tokenPrice.create({
      data: {
        price: parseFloat(price),
        date: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: tokenPrice,
      message: 'Token price updated successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error updating token price:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update token price' 
      },
      { status: 500 }
    );
  }
}
