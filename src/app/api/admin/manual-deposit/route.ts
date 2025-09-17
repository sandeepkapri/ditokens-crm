import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/email-events";
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
        totalTokens: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "User account is not active" }, { status: 400 });
    }

    // Get current token price
    const currentPrice = await getCurrentTokenPrice();
    const tokenAmount = usdtAmount / currentPrice;

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'PURCHASE',
        amount: usdtAmount,
        tokenAmount: tokenAmount,
        pricePerToken: currentPrice,
        paymentMethod: 'usdt_erc20',
        status: 'COMPLETED',
        description: `Manual USDT deposit processing - ${txHash}`,
        txHash: txHash,
        walletAddress: fromWallet,
      }
    });

    // Update user's token balance and handle referral commission
    await prisma.$transaction(async (tx) => {
      // Update user's token balance
      await tx.user.update({
        where: { id: user.id },
        data: {
          totalTokens: { increment: tokenAmount },
          availableTokens: { increment: tokenAmount },
        }
      });

      // Handle referral commission if user was referred (FIRST PURCHASE ONLY)
      if (user.referredBy) {
        const referrer = await tx.user.findUnique({
          where: { referralCode: user.referredBy },
          select: { id: true, name: true, email: true }
        });

        if (referrer) {
          // Check if this is the user's first purchase
          const existingTransactions = await tx.transaction.count({
            where: {
              userId: user.id,
              type: 'PURCHASE',
              status: 'COMPLETED'
            }
          });

          // Only create commission on FIRST purchase (existingTransactions = 0 means this is the first)
          if (existingTransactions === 0) {
            const commissionAmount = usdtAmount * 0.05; // 5% commission
            const commissionTokenAmount = tokenAmount * 0.05;

            // Check if referral commission already exists (shouldn't happen for first purchase)
            const existingCommission = await tx.referralCommission.findFirst({
              where: {
                referrerId: referrer.id,
                referredUserId: user.id,
              }
            });

            if (!existingCommission) {
              // Create referral commission record for first purchase only
              await tx.referralCommission.create({
                data: {
                  referrerId: referrer.id,
                  referredUserId: user.id,
                  amount: commissionAmount,
                  tokenAmount: commissionTokenAmount,
                  pricePerToken: currentPrice, // Save current price at time of first purchase
                  month: new Date().getMonth() + 1,
                  year: new Date().getFullYear(),
                }
              });

              // Update referrer's earnings
              await tx.user.update({
                where: { id: referrer.id },
                data: {
                  referralEarnings: { increment: commissionAmount }
                }
              });

              // Create notification for referrer
              await tx.notification.create({
                data: {
                  userId: referrer.id,
                  title: 'Referral Commission Earned',
                  message: `You earned $${commissionAmount.toFixed(2)} commission from ${user.name}'s first purchase of $${usdtAmount.toFixed(2)} at $${currentPrice}/token`,
                  type: 'INFO',
                  priority: 'medium',
                  isRead: false,
                }
              });

              console.log(`FIRST PURCHASE: Referral commission created: $${commissionAmount} for referrer ${referrer.email} from ${user.email}'s $${usdtAmount} purchase at $${currentPrice}/token`);
            }
          } else {
            console.log(`SKIPPED: Commission not created - this is not ${user.email}'s first purchase (existing transactions: ${existingTransactions})`);
          }
        }
      }
    });

    // Send notification to user
    await sendNotification(user.id, {
      email: user.email,
      name: user.name,
      title: 'USDT Deposit Processed',
      message: `Your USDT deposit of $${usdtAmount.toFixed(2)} has been processed. You received ${tokenAmount.toFixed(2)} DIT tokens.`,
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
        message: `Admin processed USDT deposit for ${user.email}: $${usdtAmount.toFixed(2)} USDT → ${tokenAmount.toFixed(2)} DIT tokens`,
        priority: 'low'
      });
    }

    return NextResponse.json({
      success: true,
      message: "USDT deposit processed successfully",
      transaction: {
        id: transaction.id,
        usdtAmount,
        tokenAmount,
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
