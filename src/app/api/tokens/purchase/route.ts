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

    // Validate minimum purchase amount
    if (amount < 10) {
      return NextResponse.json(
        { error: "Minimum purchase amount is $10" },
        { status: 400 }
      );
    }

    // Calculate processing fee based on payment method
    let processingFee = 0;
    switch (paymentMethod) {
      case "credit_card":
        processingFee = amount * 0.025; // 2.5%
        break;
      case "bank_transfer":
        processingFee = amount * 0.005; // 0.5%
        break;
      case "crypto":
        processingFee = amount * 0.01; // 1.0%
        break;
      case "paypal":
        processingFee = amount * 0.03; // 3.0%
        break;
      default:
        processingFee = amount * 0.025; // Default 2.5%
    }

    const totalAmount = amount + processingFee;

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "PURCHASE",
        amount: totalAmount,
        tokenAmount,
        pricePerToken: currentPrice,
        paymentMethod,
        status: "PENDING",
        description: `Token purchase via ${paymentMethod}`,
        processingFee,
      },
    });

    // Update user's token balance
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalTokens: { increment: tokenAmount },
        availableTokens: { increment: tokenAmount },
      },
    });

    // If user was referred, calculate referral commission
    if (user.referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: user.referredBy },
      });

      if (referrer) {
        const commissionAmount = amount * 0.05; // 5% commission
        const commissionTokenAmount = tokenAmount * 0.05;

        // Create referral commission record
        await prisma.referralCommission.create({
          data: {
            referrerId: referrer.id,
            referredUserId: user.id,
            amount: commissionAmount,
            tokenAmount: commissionTokenAmount,
            pricePerToken: currentPrice,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
        });

        // Update referrer's earnings
        await prisma.user.update({
          where: { id: referrer.id },
          data: {
            referralEarnings: { increment: commissionAmount },
          },
        });
      }
    }

    // In a real application, you would integrate with a payment gateway here
    // For now, we'll simulate a successful payment
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "COMPLETED" },
    });

    // Create notification for successful purchase
    await NotificationHelpers.onTokenPurchase(user.id, tokenAmount, amount);

    // Create notification for referrer if applicable
    if (user.referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: user.referredBy },
      });

      if (referrer) {
        const commissionAmount = amount * 0.05; // 5% commission
        await NotificationHelpers.onReferralCommission(
          referrer.id, 
          commissionAmount, 
          user.name || "User"
        );
      }
    }

    return NextResponse.json({
      message: "Purchase successful",
      transactionId: transaction.id,
      amount: totalAmount,
      tokenAmount,
      processingFee,
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
