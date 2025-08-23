import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const stakeSchema = z.object({
  amount: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = stakeSchema.parse(body);

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has enough available tokens
    if (user.availableTokens < amount) {
      return NextResponse.json(
        { error: "Insufficient tokens available for staking" },
        { status: 400 }
      );
    }

    // Calculate staking period (3 years minimum)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 3);

    // Create staking record
    const stakingRecord = await prisma.stakingRecord.create({
      data: {
        userId: user.id,
        amount,
        startDate,
        endDate,
        status: "ACTIVE",
        apy: 12.5, // 12.5% APY
        rewards: 0, // Initial rewards
      },
    });

    // Update user's token balances
    await prisma.user.update({
      where: { id: user.id },
      data: {
        availableTokens: { decrement: amount },
        stakedTokens: { increment: amount },
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "STAKE",
        amount: 0, // No USD amount for staking
        tokenAmount: amount,
        pricePerToken: 0, // Not applicable for staking
        paymentMethod: "staking",
        status: "COMPLETED",
        description: `Staked ${amount} DIT tokens`,
        processingFee: 0,
      },
    });

    return NextResponse.json({
      message: "Tokens staked successfully",
      stakingId: stakingRecord.id,
      amount,
      startDate,
      endDate,
      apy: 12.5,
    }, { status: 200 });
  } catch (error) {
    console.error("Error processing token staking:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process staking" },
      { status: 500 }
    );
  }
}
