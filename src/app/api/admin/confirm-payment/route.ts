import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdminUser } from "@/lib/admin-auth";
import { z } from "zod";
import { NotificationHelpers } from "@/lib/notifications";
import { sendPurchaseConfirmation, sendPaymentConfirmationAdmin, sendPaymentRejectionAdmin } from "@/lib/email-events";

const confirmPaymentSchema = z.object({
  transactionId: z.string(),
  action: z.enum(["confirm", "reject"]),
  adminNotes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isSuperAdminUser(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transactionId, action, adminNotes } = confirmPaymentSchema.parse(body);

    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            totalTokens: true,
            availableTokens: true,
            referredBy: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (transaction.status !== "PENDING") {
      return NextResponse.json({ 
        error: `Transaction is already ${transaction.status.toLowerCase()}` 
      }, { status: 400 });
    }

    if (action === "confirm") {
      // Confirm payment and credit tokens
      await prisma.$transaction(async (tx) => {
        // Update transaction status
        await tx.transaction.update({
          where: { id: transactionId },
          data: { 
            status: "COMPLETED",
            adminNotes: adminNotes || "Payment confirmed by admin"
          }
        });

        // Credit tokens to user
        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            totalTokens: { increment: transaction.tokenAmount },
            availableTokens: { increment: transaction.tokenAmount }
          }
        });

        // Handle referral commission if applicable
        if (transaction.user.referredBy) {
          const referrer = await tx.user.findUnique({
            where: { referralCode: transaction.user.referredBy }
          });

          if (referrer) {
            // Check if this is the user's first purchase
            const existingTransactions = await tx.transaction.count({
              where: {
                userId: transaction.userId,
                type: 'PURCHASE',
                status: 'COMPLETED'
              }
            });

            // Only create commission on FIRST purchase (existingTransactions = 1 means this is the first, since we're confirming it)
            if (existingTransactions === 1) {
              const commissionAmount = transaction.amount * 0.05; // 5% commission
              const commissionTokenAmount = transaction.tokenAmount * 0.05;

              // Check if referral commission already exists (shouldn't happen for first purchase)
              const existingCommission = await tx.referralCommission.findFirst({
                where: {
                  referrerId: referrer.id,
                  referredUserId: transaction.userId,
                }
              });

              if (!existingCommission) {
                // Create referral commission record for first purchase only
                await tx.referralCommission.create({
                  data: {
                    referrerId: referrer.id,
                    referredUserId: transaction.userId,
                    amount: commissionAmount,
                    tokenAmount: commissionTokenAmount,
                    pricePerToken: transaction.pricePerToken, // Save price at time of first purchase
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

                console.log(`FIRST PURCHASE: Referral commission created: $${commissionAmount} for referrer ${referrer.id} from user ${transaction.userId}'s $${transaction.amount} purchase at $${transaction.pricePerToken}/token`);

                // Create notification for referrer
                await NotificationHelpers.onReferralCommission(
                  referrer.id,
                  commissionAmount,
                  transaction.user.name || "User"
                );
              }
            } else {
              console.log(`SKIPPED: Commission not created - this is not user ${transaction.userId}'s first purchase (existing transactions: ${existingTransactions})`);
            }
          }
        }
      });

      // Create notification for successful purchase
      await NotificationHelpers.onTokenPurchase(
        transaction.userId,
        transaction.tokenAmount,
        transaction.amount
      );

      // Send confirmation email to user
      try {
        await sendPurchaseConfirmation(transaction.userId, {
          email: transaction.user.email,
          name: transaction.user.name || "User",
          tokens: transaction.tokenAmount.toString(),
          amount: transaction.amount.toString(),
          transactionId: transaction.id,
          paymentMethod: transaction.paymentMethod || "Unknown",
          tokenPrice: transaction.pricePerToken.toString(),
          processingFee: (transaction.processingFee || 0).toString(),
          currentValue: transaction.amount.toString()
        });
        console.log(`Purchase confirmation email sent to user: ${transaction.user.email}`);
      } catch (emailError) {
        console.error('Failed to send purchase confirmation email:', emailError);
      }

      // Send admin notification
      try {
        await sendPaymentConfirmationAdmin({
          userName: transaction.user.name || "User",
          userEmail: transaction.user.email,
          amount: transaction.amount.toString(),
          tokenAmount: transaction.tokenAmount.toString(),
          transactionId: transaction.id,
          paymentMethod: transaction.paymentMethod || "Unknown",
          adminNotes: adminNotes || "Payment confirmed by admin"
        });
        console.log(`Payment confirmation admin notification sent`);
      } catch (adminEmailError) {
        console.error('Failed to send payment confirmation admin notification:', adminEmailError);
      }

      return NextResponse.json({
        message: "Payment confirmed successfully",
        transactionId,
        tokensCredited: transaction.tokenAmount,
        userEmail: transaction.user.email
      });

    } else if (action === "reject") {
      // Reject payment
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { 
          status: "FAILED",
          adminNotes: adminNotes || "Payment rejected by admin"
        }
      });

      // Create notification for rejected purchase
      await NotificationHelpers.onTokenPurchaseRejected(
        transaction.userId,
        transaction.tokenAmount,
        transaction.amount,
        adminNotes || "Payment was rejected"
      );

      // Send admin notification for rejection
      try {
        await sendPaymentRejectionAdmin({
          userName: transaction.user.name || "User",
          userEmail: transaction.user.email,
          amount: transaction.amount.toString(),
          tokenAmount: transaction.tokenAmount.toString(),
          transactionId: transaction.id,
          paymentMethod: transaction.paymentMethod || "Unknown",
          adminNotes: adminNotes || "Payment rejected by admin"
        });
        console.log(`Payment rejection admin notification sent`);
      } catch (adminEmailError) {
        console.error('Failed to send payment rejection admin notification:', adminEmailError);
      }

      return NextResponse.json({
        message: "Payment rejected",
        transactionId,
        userEmail: transaction.user.email
      });
    }

  } catch (error) {
    console.error("Admin payment confirmation error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
