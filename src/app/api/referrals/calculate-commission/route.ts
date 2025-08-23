import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const commissionSchema = z.object({
  userId: z.string(),
  purchaseAmount: z.number().positive(),
  tokenAmount: z.number().positive(),
  pricePerToken: z.number().positive(),
  transactionId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, purchaseAmount, tokenAmount, pricePerToken, transactionId } = commissionSchema.parse(body);

    // Get the user to check if they were referred
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        referredBy: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If user was referred, calculate and record commission
    if (user.referredBy) {
      // Find the referrer
      const referrer = await prisma.user.findUnique({
        where: { referralCode: user.referredBy },
        select: { id: true },
      });

      if (referrer) {
        // Calculate 5% commission
        const commissionAmount = purchaseAmount * 0.05;
        const commissionTokenAmount = tokenAmount * 0.05;

        // Create or update commission record
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        await prisma.referralCommission.upsert({
          where: {
            referrer_referred_month_year: {
              referrerId: referrer.id,
              referredUserId: user.id,
              month: currentMonth,
              year: currentYear,
            },
          },
          update: {
            amount: {
              increment: commissionAmount,
            },
            tokenAmount: {
              increment: commissionTokenAmount,
            },
            pricePerToken: pricePerToken,
          },
          create: {
            referrerId: referrer.id,
            referredUserId: user.id,
            amount: commissionAmount,
            tokenAmount: commissionTokenAmount,
            pricePerToken: pricePerToken,
            month: currentMonth,
            year: currentYear,
          },
        });

        // Update referrer's referral earnings
        await prisma.user.update({
          where: { id: referrer.id },
          data: {
            referralEarnings: {
              increment: commissionAmount,
            },
          },
        });

        return NextResponse.json({
          message: "Commission calculated and recorded successfully",
          commissionAmount,
          commissionTokenAmount,
        }, { status: 200 });
      }
    }

    return NextResponse.json({
      message: "No referral commission applicable",
    }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Commission calculation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
