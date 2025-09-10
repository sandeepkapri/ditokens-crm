import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin-auth";
import { z } from "zod";
import { NotificationHelpers } from "@/lib/notifications";
import { sendPurchaseConfirmation } from "@/lib/email-events";

const confirmPaymentSchema = z.object({
  transactionId: z.string(),
  action: z.enum(["confirm", "reject"]),
  adminNotes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdminUser(session)) {
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
            const commissionAmount = transaction.amount * 0.05; // 5% commission
            const commissionTokenAmount = transaction.tokenAmount * 0.05;

            // Create referral commission record
            await tx.referralCommission.create({
              data: {
                referrerId: referrer.id,
                referredUserId: transaction.userId,
                amount: commissionAmount,
                tokenAmount: commissionTokenAmount,
                pricePerToken: transaction.pricePerToken,
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
            await NotificationHelpers.onReferralCommission(
              referrer.id,
              commissionAmount,
              transaction.user.name || "User"
            );
          }
        }
      });

      // Create notification for successful purchase
      await NotificationHelpers.onTokenPurchase(
        transaction.userId,
        transaction.tokenAmount,
        transaction.amount
      );

      // Send confirmation email
      try {
        await sendPurchaseConfirmation(transaction.userId, {
          email: transaction.user.email,
          name: transaction.user.name || "User"
        }, {
          amount: transaction.amount,
          tokenAmount: transaction.tokenAmount,
          transactionId: transaction.id
        });
      } catch (emailError) {
        console.error('Failed to send purchase confirmation email:', emailError);
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
