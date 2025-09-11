import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDatabaseConnectionError, getDatabaseErrorMessage } from "@/lib/database-health";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get timeframe from query params
    const url = new URL(request.url);
    const timeframe = url.searchParams.get("timeframe") || "7d";
    
    // Calculate days based on timeframe
    let days: number;
    switch (timeframe) {
      case "1d": days = 1; break;
      case "7d": days = 7; break;
      case "1m": days = 30; break;
      case "3m": days = 90; break;
      case "1y": days = 365; break;
      default: days = 7;
    }

    // Get token prices for the specified timeframe
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Set end date to today to prevent future dates
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today

    const prices = await prisma.tokenPrice.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate, // Only include dates up to today
        },
      },
      orderBy: { date: "asc" }, // Changed to ascending for chart display
      take: days * 2, // Get more points if available
    });

    return NextResponse.json({ 
      priceData: prices.map(price => ({
        date: price.date.toISOString().split('T')[0],
        price: Number(price.price),
        volume: 0 // Since we don't track volume yet
      })),
      count: prices.length,
      timeframe: timeframe
    });
  } catch (error) {
    console.error("Error fetching token prices:", error);
    
    // Handle database connection errors specifically
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json(
        { 
          error: getDatabaseErrorMessage(error),
          type: "database_error",
          priceData: [], // Return empty data for graceful degradation
          count: 0,
          timeframe: "7d"
        },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch token prices" },
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
