import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { NotificationHelpers } from "@/lib/notifications";

const purchaseSchema = z.object({
  amount: z.number().positive(),
  tokenAmount: z.number().positive(),
  paymentMethod: z.string(),
  currentPrice: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, tokenAmount, paymentMethod, currentPrice } = purchaseSchema.parse(body);

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

    // Validate minimum purchase amount
    if (amount < 10) {
      return NextResponse.json(
        { error: "Minimum purchase amount is $10" },
        { status: 400 }
      );
    }

    // No processing fees for USDT payments
    const processingFee = 0;
    const totalAmount = amount;

    // Create transaction record - PENDING until payment is confirmed
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "PURCHASE",
        amount: totalAmount,
        tokenAmount,
        pricePerToken: currentPrice,
        paymentMethod,
        status: "PENDING", // Stays pending until admin confirms payment
        description: `Token purchase via ${paymentMethod} - Awaiting payment confirmation`,
        processingFee,
        walletAddress: getWalletAddress(paymentMethod), // Add wallet address for payment
      },
    });

    // DO NOT credit tokens yet - wait for admin confirmation
    // Tokens will only be credited when admin confirms payment

    // Create notification for pending purchase
    await NotificationHelpers.onTokenPurchasePending(user.id, tokenAmount, amount, transaction.id);

    // Send email notification to user with payment instructions
    try {
      const { sendPurchasePending } = await import("@/lib/email-events");
      await sendPurchasePending(user.id, {
        email: user.email,
        name: user.name || "User"
      }, {
        amount: totalAmount,
        tokenAmount,
        walletAddress: getWalletAddress(paymentMethod),
        transactionId: transaction.id,
        paymentMethod
      });
    } catch (emailError) {
      console.error('Failed to send purchase pending email:', emailError);
    }

    return NextResponse.json({
      message: "Purchase request created. Please make payment to complete your purchase.",
      transactionId: transaction.id,
      amount: totalAmount,
      tokenAmount,
      processingFee,
      walletAddress: getWalletAddress(paymentMethod),
      status: "PENDING",
      instructions: "Send USDT to the provided wallet address. Your tokens will be credited after payment confirmation."
    }, { status: 200 });
  } catch (error) {
    console.error("Error processing token purchase:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process purchase" },
      { status: 500 }
    );
  }
}

function getWalletAddress(paymentMethod: string): string {
  // All USDT networks use the same wallet address
  return "0x7E874A697007965c6A3DdB1702828A764E7a91c3";
}
