import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdminUser } from "@/lib/admin-auth";
import { z } from "zod";
import { NotificationHelpers } from "@/lib/notifications";

const approveCommissionSchema = z.object({
  commissionId: z.string(),
  action: z.enum(["approve", "reject"]),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isSuperAdminUser(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { commissionId, action, adminNotes, rejectionReason } = approveCommissionSchema.parse(body);

    // Find the commission
    const commission = await prisma.referralCommission.findUnique({
      where: { id: commissionId },
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true,
            referralEarnings: true
          }
        },
        referredUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!commission) {
      return NextResponse.json({ error: "Commission not found" }, { status: 404 });
    }

    if (commission.status !== "PENDING") {
      return NextResponse.json({ 
        error: `Commission is already ${commission.status.toLowerCase()}` 
      }, { status: 400 });
    }

    if (action === "approve") {
      // Approve commission
      await prisma.$transaction(async (tx) => {
        // Update commission status
        await tx.referralCommission.update({
          where: { id: commissionId },
          data: { 
            status: "APPROVED",
            // Note: We don't update isPaid here as that's handled separately
          }
        });

        // Update referrer's earnings (only if not already updated)
        if (commission.amount > 0) {
          await tx.user.update({
            where: { id: commission.referrer.id },
            data: {
              referralEarnings: { increment: commission.amount },
              totalEarnings: { increment: commission.amount },
              usdtBalance: { increment: commission.amount }
            }
          });

          // Create commission transaction for referrer
          await tx.transaction.create({
            data: {
              userId: commission.referrer.id,
              type: "REFERRAL_COMMISSION",
              amount: commission.amount,
              tokenAmount: commission.tokenAmount,
              pricePerToken: commission.pricePerToken,
              paymentMethod: "referral_bonus",
              status: "COMPLETED",
              description: `Referral commission approved: $${commission.amount.toFixed(2)} USDT from ${commission.referredUser.email}`,
            }
          });
        }
      });

      // Send notification to referrer
      await NotificationHelpers.onReferralCommission(
        commission.referrer.id,
        commission.amount,
        commission.referredUser.name || "User"
      );

      return NextResponse.json({
        message: "Commission approved successfully",
        commissionId,
        amount: commission.amount,
        referrerEmail: commission.referrer.email
      });

    } else if (action === "reject") {
      // Reject commission
      await prisma.referralCommission.update({
        where: { id: commissionId },
        data: { 
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectedBy: session.user.email,
          rejectionReason: rejectionReason || adminNotes || "Commission rejected by admin"
        }
      });

      return NextResponse.json({
        message: "Commission rejected successfully",
        commissionId,
        referrerEmail: commission.referrer.email
      });
    }

  } catch (error) {
    console.error("Admin commission approval error:", error);
    
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
