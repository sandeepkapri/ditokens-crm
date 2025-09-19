import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const withdrawSchema = z.object({
  amount: z.number().positive(),
  walletAddress: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, walletAddress } = withdrawSchema.parse(body);

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

    // Check if user has enough USDT balance
    if (user.usdtBalance < amount) {
      return NextResponse.json(
        { error: "Insufficient USDT balance" },
        { status: 400 }
      );
    }

    // Validate minimum withdrawal amount
    if (amount < 10) {
      return NextResponse.json(
        { error: "Minimum withdrawal amount is $10" },
        { status: 400 }
      );
    }

    // Create withdrawal request and deduct USDT balance
    const result = await prisma.$transaction(async (tx) => {
      // Create withdrawal request
      const withdrawalRequest = await tx.withdrawalRequest.create({
        data: {
          userId: user.id,
          amount: amount,
          tokenAmount: 0, // No tokens for USDT withdrawal
          network: "USDT",
          walletAddress: walletAddress,
          status: "PENDING",
        }
      });

      // Deduct USDT from user's balance
      await tx.user.update({
        where: { id: user.id },
        data: {
          usdtBalance: { decrement: amount }
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAWAL",
          amount: amount,
          tokenAmount: 0,
          pricePerToken: 0,
          paymentMethod: "USDT",
          status: "PENDING",
          description: `USDT withdrawal request to ${walletAddress}`,
          processingFee: 0,
          walletAddress: walletAddress,
        }
      });

      return withdrawalRequest;
    });

    return NextResponse.json({
      message: "USDT withdrawal request created successfully",
      withdrawalRequest: {
        id: result.id,
        amount: amount,
        walletAddress: walletAddress,
        status: "PENDING",
      }
    }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating USDT withdrawal request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
