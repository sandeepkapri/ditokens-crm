import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendWithdrawalRequest, sendWithdrawalRequestAdmin } from "@/lib/email-events";

const withdrawSchema = z.object({
  tokenAmount: z.number().positive(), // DIT tokens to withdraw
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
    const { tokenAmount, network, walletAddress } = withdrawSchema.parse(body);

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
      return NextResponse.json({ 
        error: "Account is not active. Please contact support to activate your account." 
      }, { status: 403 });
    }

    // Check if user has sufficient available tokens (not staked tokens)
    if (user.availableTokens < tokenAmount) {
      return NextResponse.json(
        { error: `Insufficient available tokens. You have ${user.availableTokens.toFixed(2)} DIT tokens available for withdrawal.` },
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

    // Calculate USD value at current price
    const currentPrice = await getCurrentTokenPrice();
    const amount = tokenAmount * currentPrice;

    // Create withdrawal request (no lock period for regular withdrawals)
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        userId: user.id,
        amount, // USD value
        tokenAmount, // DIT tokens
        network,
        walletAddress,
        status: "PENDING",
        lockPeriod: 0, // No lock period for regular withdrawals
        canWithdraw: true, // Can be withdrawn immediately after approval
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "WITHDRAWAL",
        amount, // USD value
        tokenAmount, // DIT tokens
        pricePerToken: currentPrice,
        paymentMethod: network,
        status: "PENDING",
        description: `Withdrawal request via ${network}`,
        processingFee: 0,
        walletAddress,
      },
    });

    // Update user's available tokens (reserve them for withdrawal)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        availableTokens: { decrement: tokenAmount },
      },
    });

    // Send notifications
    // Send notification to user
    try {
      await sendWithdrawalRequest(user.id, {
        email: user.email,
        name: user.name,
        amount: amount.toString(), // USD value
        network,
        walletAddress,
        withdrawalId: withdrawalRequest.id,
        lockPeriod: "No lock period", // Regular withdrawals have no lock
        estimatedUnlockDate: "Immediate processing after approval",
      });
    } catch (emailError) {
      console.error('Failed to send user withdrawal notification:', emailError);
      // Don't fail the withdrawal if email fails
    }

    // Send notification to admin
    try {
      await sendWithdrawalRequestAdmin({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        amount: amount.toString(), // USD value
        network,
        walletAddress,
        withdrawalId: withdrawalRequest.id,
        lockPeriod: "No lock period", // Regular withdrawals have no lock
        estimatedUnlockDate: "Immediate processing after approval",
        userBalance: (user.availableTokens + tokenAmount).toString(), // Show balance before withdrawal
      });
    } catch (emailError) {
      console.error('Failed to send admin withdrawal notification:', emailError);
      // Don't fail the withdrawal if email fails
    }

    return NextResponse.json({
      message: "Withdrawal request submitted successfully",
      withdrawalId: withdrawalRequest.id,
      tokenAmount, // DIT tokens
      amount, // USD value
      network,
      walletAddress,
      lockPeriod: "No lock period", // Regular withdrawals have no lock
      estimatedUnlockDate: "Immediate processing after approval",
      currentPrice,
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
    // Get today's price first, then fall back to most recent price
    const todayStr = new Date().toISOString().split('T')[0];
    const start = new Date(todayStr + 'T00:00:00.000Z');
    const end = new Date(todayStr + 'T23:59:59.999Z');
    
    // Try to get today's price first
    let currentPrice = await prisma.tokenPrice.findFirst({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      orderBy: { date: "desc" }
    });
    
    // If no price for today, get the most recent price
    if (!currentPrice) {
      currentPrice = await prisma.tokenPrice.findFirst({
        orderBy: { date: "desc" }
      });
    }
    
    return currentPrice?.price || 2.80; // Default fallback price
  } catch (error) {
    console.error("Error fetching token price:", error);
    return 2.80; // Default fallback price
  }
}
