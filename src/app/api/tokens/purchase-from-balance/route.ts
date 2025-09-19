import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const purchaseSchema = z.object({
  amount: z.number().min(0.01), // Amount in USDT
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = purchaseSchema.parse(body);

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account is not active" }, { status: 403 });
    }

    // Check if user has sufficient USDT balance
    if (user.usdtBalance < amount) {
      return NextResponse.json({ 
        error: `Insufficient USDT balance. Available: $${user.usdtBalance.toFixed(2)}` 
      }, { status: 400 });
    }

    // Get current token price
    const latestPrice = await prisma.tokenPrice.findFirst({
      orderBy: { date: 'desc' },
    });

    if (!latestPrice) {
      return NextResponse.json({ error: "Token price not available" }, { status: 500 });
    }

    const currentPrice = latestPrice.price;
    const tokenAmount = amount / currentPrice;

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update user balances
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          usdtBalance: { decrement: amount },
          totalTokens: { increment: tokenAmount },
          availableTokens: { increment: tokenAmount },
        },
      });

      // Create purchase transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: "PURCHASE",
          amount: amount,
          tokenAmount: tokenAmount,
          pricePerToken: currentPrice,
          paymentMethod: "usdt_balance",
          status: "COMPLETED",
          description: `DIT purchase using USDT balance: ${tokenAmount.toFixed(2)} DIT for $${amount.toFixed(2)} USDT`,
        }
      });

      return { updatedUser, transaction };
    });

    // Check if this is the user's first purchase for referral commission
    const existingPurchases = await prisma.transaction.count({
      where: {
        userId: user.id,
        type: "PURCHASE",
        status: "COMPLETED",
      },
    });

    // If this is the first purchase and user has a referrer, calculate commission
    if (existingPurchases === 1 && user.referredBy) {
      try {
        // Get commission settings
        let commissionSettings = await prisma.commissionSettings.findFirst();
        if (!commissionSettings) {
          commissionSettings = await prisma.commissionSettings.create({
            data: {
              referralRate: 5.0,
              updatedBy: session.user.email || "system",
            }
          });
        }

        const commissionPercentage = commissionSettings.referralRate / 100;
        const commissionAmount = amount * commissionPercentage;
        const commissionTokenAmount = tokenAmount * commissionPercentage;

        // Find the referrer
        const referrer = await prisma.user.findUnique({
          where: { referralCode: user.referredBy },
        });

        if (referrer) {
          await prisma.$transaction(async (tx) => {
            // Update referrer's earnings
            await tx.user.update({
              where: { id: referrer.id },
              data: {
                referralEarnings: { increment: commissionAmount },
                totalEarnings: { increment: commissionAmount },
                usdtBalance: { increment: commissionAmount },
              },
            });

            // Create referral commission record
            await tx.referralCommission.upsert({
              where: {
                referrer_referred_month_year: {
                  referrerId: referrer.id,
                  referredUserId: user.id,
                  month: new Date().getMonth() + 1,
                  year: new Date().getFullYear(),
                },
              },
              update: {
                amount: { increment: commissionAmount },
                tokenAmount: { increment: commissionTokenAmount },
              },
              create: {
                referrerId: referrer.id,
                referredUserId: user.id,
                amount: commissionAmount,
                tokenAmount: commissionTokenAmount,
                pricePerToken: currentPrice,
                commissionPercentage: commissionSettings.referralRate,
                status: "APPROVED", // Automatically approved for balance purchases
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
              },
            });

            // Create commission transaction for referrer
            await tx.transaction.create({
              data: {
                userId: referrer.id,
                type: "REFERRAL_COMMISSION",
                amount: commissionAmount,
                tokenAmount: 0,
                pricePerToken: 0,
                paymentMethod: "referral_bonus",
                status: "COMPLETED",
                description: `Referral commission from ${user.email}: $${commissionAmount.toFixed(2)} USDT`,
              },
            });
          });
        }
      } catch (commissionError) {
        console.error("Failed to process referral commission:", commissionError);
        // Don't fail the main transaction if commission fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${tokenAmount.toFixed(2)} DIT tokens for $${amount.toFixed(2)} USDT`,
      transaction: {
        id: result.transaction.id,
        amount: amount,
        tokenAmount: tokenAmount,
        pricePerToken: currentPrice,
        status: "COMPLETED",
      },
      newBalances: {
        usdtBalance: result.updatedUser.usdtBalance,
        totalTokens: result.updatedUser.totalTokens,
        availableTokens: result.updatedUser.availableTokens,
      },
    }, { status: 200 });

  } catch (error) {
    console.error("Error purchasing tokens from balance:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
