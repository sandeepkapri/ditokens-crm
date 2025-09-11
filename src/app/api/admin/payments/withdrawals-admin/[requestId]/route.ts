import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdminUser } from "@/lib/admin-auth";
import { sendWithdrawalApproved, sendWithdrawalRejected, sendWithdrawalProcessingAdmin } from "@/lib/email-events";
import { logAdminAction } from "@/lib/admin-actions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isSuperAdminUser(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;
    const { action } = await request.json();

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Find the withdrawal request
    const withdrawalRequest = await prisma.transaction.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!withdrawalRequest) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    if (withdrawalRequest.type !== "WITHDRAWAL") {
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 }
      );
    }

    // Update the transaction status
    const newStatus = action === "approve" ? "COMPLETED" : "FAILED";
    
    const updatedTransaction = await prisma.transaction.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    // Also update the WithdrawalRequest table if it exists
    try {
      // Find matching WithdrawalRequest by userId, amount, and walletAddress
      // Use a more flexible matching approach
      const matchingRequests = await prisma.withdrawalRequest.findMany({
        where: { 
          userId: withdrawalRequest.userId,
          amount: withdrawalRequest.amount,
          walletAddress: withdrawalRequest.walletAddress || "N/A"
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      });

      if (matchingRequests.length > 0) {
        await prisma.withdrawalRequest.update({
          where: { id: matchingRequests[0].id },
          data: {
            status: newStatus === "COMPLETED" ? "APPROVED" : "REJECTED",
            processedDate: new Date(),
            updatedAt: new Date(),
          },
        });
        // WithdrawalRequest updated successfully
      } else {
        // No matching WithdrawalRequest found
      }
    } catch (error) {
      // Could not update WithdrawalRequest table - non-critical error
      // Don't fail the request if this fails
    }

    // If approved, tokens were already deducted when withdrawal was created
    // No need to deduct again - this was causing double deduction
    if (action === "approve") {
      // Tokens are already reserved in availableTokens when withdrawal was created
      // Just update the status - no additional deduction needed
      console.log(`Withdrawal approved for user ${withdrawalRequest.user.email} - tokens already reserved`);
    }

    // Log admin action
    await logAdminAction({
      adminId: session.user.id || "unknown",
      action: action.toUpperCase(),
      targetType: "WITHDRAWAL",
      targetId: requestId,
      targetName: `${withdrawalRequest.user.name} - $${withdrawalRequest.amount}`,
      oldValue: "PENDING",
      newValue: newStatus,
      reason: action === "reject" ? "Please contact support for more information." : undefined,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // Send email notification to user
    try {
      if (action === "approve") {
        await sendWithdrawalApproved(
          withdrawalRequest.userId,
          {
            email: withdrawalRequest.user.email,
            name: withdrawalRequest.user.name,
            amount: withdrawalRequest.amount.toString(),
            network: withdrawalRequest.paymentMethod || "USDT",
            walletAddress: withdrawalRequest.walletAddress || "N/A",
            transactionId: withdrawalRequest.id,
            processingTime: "1-3 business days"
          }
        );
      } else {
        await sendWithdrawalRejected(
          withdrawalRequest.userId,
          {
            email: withdrawalRequest.user.email,
            name: withdrawalRequest.user.name,
            amount: withdrawalRequest.amount.toString(),
            network: withdrawalRequest.paymentMethod || "USDT",
            walletAddress: withdrawalRequest.walletAddress || "N/A",
            transactionId: withdrawalRequest.id,
            reason: "Please contact support for more information.",
            supportContact: process.env.EMAIL_FROM || "support@ditokens.com"
          }
        );
      }
    } catch (emailError) {
      console.error("Failed to send withdrawal email:", emailError);
      // Don't fail the request if email fails
    }

    // Send admin notification
    try {
      await sendWithdrawalProcessingAdmin({
        userName: withdrawalRequest.user.name,
        userEmail: withdrawalRequest.user.email,
        userId: withdrawalRequest.userId,
        amount: withdrawalRequest.amount.toString(),
        network: withdrawalRequest.paymentMethod || "USDT",
        walletAddress: withdrawalRequest.walletAddress || "N/A",
        transactionId: withdrawalRequest.id,
        action: action === "approve" ? "Approved" : "Rejected",
        adminNotes: action === "reject" ? "Please contact support for more information." : undefined
      });
      console.log(`Admin withdrawal processing notification sent for ${withdrawalRequest.user.email}`);
    } catch (adminEmailError) {
      console.error('Failed to send admin withdrawal processing notification:', adminEmailError);
    }

    return NextResponse.json({
      success: true,
      message: `Withdrawal ${action}d successfully`,
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("Error updating withdrawal request:", error);
    return NextResponse.json(
      { error: "Failed to update withdrawal request" },
      { status: 500 }
    );
  }
}
