import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const withdrawSchema = z.object({
  amount: z.number().positive(),
  network: z.string().min(1),
  walletAddress: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, network, walletAddress } = withdrawSchema.parse(body);

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        withdrawalRequests: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({ error: "Account is not active" }, { status: 403 });
    }

    // Check if user has sufficient balance
    if (user.availableTokens < amount) {
      return NextResponse.json(
        { error: "Insufficient tokens available for withdrawal" },
        { status: 400 }
      );
    }

    // Check if user has any pending withdrawal requests
    if (user.withdrawalRequests.length > 0) {
      return NextResponse.json(
        { error: "You already have a pending withdrawal request" },
        { status: 400 }
      );
    }

    // Calculate token value at current price
    const currentPrice = await getCurrentTokenPrice();
    const tokenAmount = amount / currentPrice;

    // Create withdrawal request with 3-year lock
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        userId: user.id,
        amount,
        tokenAmount,
        network,
        walletAddress,
        status: "PENDING",
        lockPeriod: 1095, // 3 years in days
        canWithdraw: false, // Will be set to true after 3 years
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "WITHDRAWAL",
        amount,
        tokenAmount,
        pricePerToken: currentPrice,
        paymentMethod: network,
        status: "PENDING",
        description: `Withdrawal request via ${network}`,
        processingFee: 0,
        walletAddress,
      },
    });

    // Update user's available tokens (reserve them)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        availableTokens: { decrement: tokenAmount },
      },
    });

    return NextResponse.json({
      message: "Withdrawal request submitted successfully",
      withdrawalId: withdrawalRequest.id,
      amount,
      tokenAmount,
      network,
      walletAddress,
      lockPeriod: "3 years",
      estimatedUnlockDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error("Error processing withdrawal request:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process withdrawal request" },
      { status: 500 }
    );
  }
}

async function getCurrentTokenPrice(): Promise<number> {
  try {
    const latestPrice = await prisma.tokenPrice.findFirst({
      orderBy: { date: "desc" }
    });
    return latestPrice?.price || 2.80; // Default fallback price
  } catch (error) {
    console.error("Error fetching token price:", error);
    return 2.80; // Default fallback price
  }
}
