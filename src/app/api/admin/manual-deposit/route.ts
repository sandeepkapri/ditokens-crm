import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/email-events";
import { NotificationHelpers } from "@/lib/notifications";
import { z } from "zod";

const manualDepositSchema = z.object({
  userEmail: z.string().email(),
  usdtAmount: z.number().positive(),
  txHash: z.string().min(1),
  fromWallet: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminUser(session)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { userEmail, usdtAmount, txHash, fromWallet } = manualDepositSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        availableTokens: true,
        totalTokens: true,
        referredBy: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "User account is not active" }, { status: 400 });
    }

    // Create USDT deposit transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'DEPOSIT',
        amount: usdtAmount,
        tokenAmount: 0, // No tokens - USDT only
        pricePerToken: 0, // No price for USDT deposits
        paymentMethod: 'usdt_erc20',
        status: 'COMPLETED',
        description: `Manual USDT deposit processing - ${txHash}`,
        txHash: txHash,
        walletAddress: fromWallet,
      }
    });

    // Update user's USDT balance only
    await prisma.$transaction(async (tx) => {
      // Update user's USDT balance
      await tx.user.update({
        where: { id: user.id },
        data: {
          usdtBalance: { increment: usdtAmount }, // Add to USDT balance only
        }
      });

      // Note: Deposits do not trigger referral commissions
      // Commissions are only triggered when users actually purchase DIT tokens
      if (false && user?.referredBy) {
        const referrer = await tx.user.findUnique({
          where: { referralCode: user?.referredBy || undefined },
          select: { id: true, name: true, email: true }
        });

        if (referrer && user) {
          // Check if this is the user's first purchase
          const existingTransactions = await tx.transaction.count({
            where: {
              userId: user?.id,
              type: 'PURCHASE',
              status: 'COMPLETED'
            }
          });

          // Only create commission on FIRST purchase (existingTransactions = 0 means this is the first)
          if (existingTransactions === 0) {
            // Get current commission percentage from settings
            let commissionSettings = await tx.commissionSettings.findFirst();
            if (!commissionSettings) {
              // Create default settings if none exist
                commissionSettings = await tx.commissionSettings.create({
        data: {
          referralRate: 5.0,
          updatedBy: session?.user?.email || "system",
        }
              });
            }

            const commissionPercentage = (commissionSettings?.referralRate || 5.0) / 100; // Convert percentage to decimal
            const commissionAmount = usdtAmount * commissionPercentage; // Commission in USDT
            const commissionTokenAmount = 0; // No tokens for USDT deposits

            // Check if referral commission already exists (shouldn't happen for first purchase)
            const existingCommission = await tx.referralCommission.findFirst({
              where: {
                referrerId: referrer?.id,
                referredUserId: user?.id,
              }
            });

            if (!existingCommission) {
              // Create referral commission record for first purchase only
              await tx.referralCommission.create({
                data: {
                  referrerId: referrer?.id || "",
                  referredUserId: user?.id || "",
                  amount: commissionAmount,
                  tokenAmount: commissionTokenAmount,
                  pricePerToken: 2.8, // Default price for USDT deposits
                  commissionPercentage: commissionSettings?.referralRate || 5.0, // Save the percentage used
                  status: "APPROVED", // Automatically approved for manual deposits
                  month: new Date().getMonth() + 1,
                  year: new Date().getFullYear(),
                }
              });

              // Update referrer's earnings
              await tx.user.update({
                where: { id: referrer?.id },
                data: {
                  referralEarnings: { increment: commissionAmount }
                }
              });

              // Create notification for referrer
              await NotificationHelpers.onReferralCommission(
                referrer?.id || "",
                commissionAmount,
                user?.name || "User"
              );

              console.log(`FIRST PURCHASE: Referral commission created: $${commissionAmount} for referrer ${referrer?.email} from ${user?.email}'s $${usdtAmount} purchase at $2.8/token`);
            }
          } else {
            console.log(`SKIPPED: Commission not created - this is not ${user?.email}'s first purchase (existing transactions: ${existingTransactions})`);
          }
        }
      }
    });

    // Send notification to user
    await sendNotification(user.id, {
      email: user.email,
      name: user.name,
      title: 'USDT Deposit Processed',
      message: `Your USDT deposit of $${usdtAmount.toFixed(2)} has been added to your USDT balance. You can withdraw this USDT or use it for other purposes.`,
      priority: 'medium'
    });

    // Send notification to all admins
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPERADMIN'] },
        isActive: true
      },
      select: { id: true, email: true, name: true }
    });

    for (const admin of admins) {
      await sendNotification(admin.id, {
        email: admin.email,
        name: admin.name,
        title: 'Manual USDT Deposit Processed',
        message: `Admin processed USDT deposit for ${user.email}: $${usdtAmount.toFixed(2)} USDT added to balance`,
        priority: 'low'
      });
    }

    return NextResponse.json({
      success: true,
      message: "USDT deposit processed successfully",
      transaction: {
        id: transaction.id,
        usdtAmount,
        userEmail: user.email,
        txHash
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error processing manual deposit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
      orderBy: { date: 'desc' }
    });
    
    // If no price for today, get the most recent price
    if (!currentPrice) {
      currentPrice = await prisma.tokenPrice.findFirst({
        orderBy: { date: 'desc' }
      });
    }
    
    return currentPrice ? Number(currentPrice.price) : 2.80;
  } catch (error) {
    console.error('Error getting current token price:', error);
    return 2.80; // Fallback price
  }
}
