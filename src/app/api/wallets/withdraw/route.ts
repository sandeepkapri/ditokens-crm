import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const withdrawSchema = z.object({
  walletId: z.string().min(1),
  amount: z.string().min(1),
  network: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { walletId, amount, network } = withdrawSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid withdrawal amount" },
        { status: 400 }
      );
    }

    // Check if user has sufficient balance
    const userBalance = user.availableTokens || 0;
    if (userBalance < withdrawAmount) {
      return NextResponse.json(
        { error: "Insufficient balance for withdrawal" },
        { status: 400 }
      );
    }

    // Check minimum withdrawal amounts
    const minWithdrawals = {
      usdt: 10.0,
      ethereum: 0.01,
      bitcoin: 0.001,
      polygon: 1.0,
      binance: 0.01,
    };

    const minAmount = minWithdrawals[network as keyof typeof minWithdrawals] || 0.01;
    if (withdrawAmount < minAmount) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount for ${network} is ${minAmount}` },
        { status: 400 }
      );
    }

    // Calculate network fees
    const networkFees = {
      usdt: 1.0,
      ethereum: 0.005,
      bitcoin: 0.0001,
      polygon: 0.01,
      binance: 0.005,
    };

    const fee = networkFees[network as keyof typeof networkFees] || 0.005;
    const totalAmount = withdrawAmount + fee;

    // Check if user has enough balance including fees
    if (userBalance < totalAmount) {
      return NextResponse.json(
        { error: "Insufficient balance to cover withdrawal amount and fees" },
        { status: 400 }
      );
    }

    // Create withdrawal request
    const withdrawalRequest = {
      id: Math.random().toString(36).substr(2, 9),
      amount: withdrawAmount,
      network,
      address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6", // Mock address from wallet
      status: "PENDING" as const,
      txHash: undefined,
      fee,
      timestamp: new Date().toISOString(),
    };

    // In production, you would:
    // 1. Create a withdrawal record in the database
    // 2. Deduct the amount from user's available balance
    // 3. Initiate the actual blockchain transaction
    // 4. Update the withdrawal status based on blockchain confirmations

    // Mock: Update user balance
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: { availableTokens: { decrement: totalAmount } },
    // });

    // Mock: Create withdrawal record
    // await prisma.withdrawalRequest.create({
    //   data: {
    //     userId: user.id,
    //     walletId,
    //     amount: withdrawAmount,
    //     network,
    //     address: withdrawalRequest.address,
    //     status: "PENDING",
    //     fee,
    //   },
    // });

    // Mock: Create transaction record
    // await prisma.transaction.create({
    //   data: {
    //     userId: user.id,
    //     type: "WITHDRAWAL",
    //     amount: -totalAmount,
    //     tokenAmount: -withdrawAmount,
    //     pricePerToken: 0,
    //     paymentMethod: "blockchain",
    //     status: "PENDING",
    //     description: `Withdrawal to ${network} wallet`,
    //     processingFee: fee,
    //   },
    // });

    return NextResponse.json({
      message: "Withdrawal request submitted successfully",
      withdrawal: withdrawalRequest,
      estimatedProcessingTime: "10-30 minutes",
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}
