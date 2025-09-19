import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const convertSchema = z.object({
  tokenAmount: z.number().positive(), // Amount of DIT tokens to convert
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tokenAmount } = convertSchema.parse(body);

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({ error: "Account is not active" }, { status: 403 });
    }

    // Check if user has enough available tokens
    if (user.availableTokens < tokenAmount) {
      return NextResponse.json(
        { error: "Insufficient available DIT tokens" },
        { status: 400 }
      );
    }

    // Validate minimum conversion amount
    if (tokenAmount < 1) {
      return NextResponse.json(
        { error: "Minimum conversion amount is 1 DIT token" },
        { status: 400 }
      );
    }

    // Get current token price
    const currentPrice = await getCurrentTokenPrice();
    const usdtAmount = tokenAmount * currentPrice;

    // Process the conversion
    await prisma.$transaction(async (tx) => {
      // Deduct DIT tokens from user's balance
      await tx.user.update({
        where: { id: user.id },
        data: {
          totalTokens: { decrement: tokenAmount },
          availableTokens: { decrement: tokenAmount },
        }
      });

      // Add USDT to user's balance
      await tx.user.update({
        where: { id: user.id },
        data: {
          usdtBalance: { increment: usdtAmount },
        }
      });

      // Create conversion transaction record
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "SALE", // DIT to USDT conversion
          amount: usdtAmount,
          tokenAmount: tokenAmount,
          pricePerToken: currentPrice,
          paymentMethod: "internal_conversion",
          status: "COMPLETED",
          description: `DIT to USDT conversion: ${tokenAmount} DIT → $${usdtAmount.toFixed(2)} USDT`,
        }
      });
    });

    return NextResponse.json({
      message: "DIT tokens converted to USDT successfully",
      conversion: {
        tokenAmount: tokenAmount,
        usdtAmount: usdtAmount,
        currentPrice: currentPrice,
        newUsdtBalance: user.usdtBalance + usdtAmount,
        newAvailableTokens: user.availableTokens - tokenAmount,
      }
    }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error converting DIT to USDT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getCurrentTokenPrice(): Promise<number> {
  try {
    // Get today's price first, then fall back to most recent price
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let currentPrice = await prisma.tokenPrice.findFirst({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: { date: 'desc' },
      select: { price: true }
    });

    // If no price for today, get the most recent price
    if (!currentPrice) {
      currentPrice = await prisma.tokenPrice.findFirst({
        orderBy: { date: 'desc' },
        select: { price: true }
      });
    }

    return currentPrice?.price || 2.8; // Default price
  } catch (error) {
    console.error("Error fetching current token price:", error);
    return 2.8; // Default price
  }
}
