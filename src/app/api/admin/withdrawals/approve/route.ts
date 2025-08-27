import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const approvalSchema = z.object({
  withdrawalId: z.string(),
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { withdrawalId, action, reason } = approvalSchema.parse(body);

    // Get withdrawal request
    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!withdrawalRequest) {
      return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });
    }

    if (withdrawalRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Withdrawal request is not pending" }, { status: 400 });
    }

    // Check if 3-year lock period has passed
    const lockEndDate = new Date(withdrawalRequest.createdAt.getTime() + (3 * 365 * 24 * 60 * 60 * 1000));
    const now = new Date();
    
    if (now < lockEndDate) {
      const remainingDays = Math.ceil((lockEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return NextResponse.json({
        error: "3-year lock period has not ended",
        remainingDays,
        lockEndDate: lockEndDate.toISOString(),
      }, { status: 400 });
    }

    let newStatus: string;
    let message: string;

    if (action === "approve") {
      newStatus = "APPROVED";
      message = "Withdrawal approved successfully";
      
      // Update withdrawal request
      await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "APPROVED",
          processedDate: new Date(),
          canWithdraw: true,
        },
      });

      // Update transaction status
      await prisma.transaction.updateMany({
        where: {
          userId: withdrawalRequest.userId,
          type: "WITHDRAWAL",
          status: "PENDING",
        },
        data: {
          status: "COMPLETED",
        },
      });

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: withdrawalRequest.userId,
          type: "WITHDRAWAL",
          title: "Withdrawal Approved",
          message: `Your withdrawal request for $${withdrawalRequest.amount} has been approved and processed.`,
          icon: "✅",
        },
      });

    } else {
      newStatus = "REJECTED";
      message = "Withdrawal rejected";
      
      // Update withdrawal request
      await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "REJECTED",
          processedDate: new Date(),
        },
      });

      // Update transaction status
      await prisma.transaction.updateMany({
        where: {
          userId: withdrawalRequest.userId,
          type: "WITHDRAWAL",
          status: "PENDING",
        },
        data: {
          status: "FAILED",
        },
      });

      // Return tokens to user's available balance
      await prisma.user.update({
        where: { id: withdrawalRequest.userId },
        data: {
          availableTokens: { increment: withdrawalRequest.tokenAmount },
        },
      });

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: withdrawalRequest.userId,
          type: "WITHDRAWAL",
          title: "Withdrawal Rejected",
          message: `Your withdrawal request for $${withdrawalRequest.amount} has been rejected. Reason: ${reason || "No reason provided"}`,
          icon: "❌",
        },
      });
    }

    return NextResponse.json({
      message,
      status: newStatus,
      withdrawalId,
      processedBy: session.user.email,
      processedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error processing withdrawal approval:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process withdrawal approval" },
      { status: 500 }
    );
  }
}
