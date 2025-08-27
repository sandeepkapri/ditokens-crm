import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSuperAdminUser } from "@/lib/admin-auth";

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
    const body = await request.json();
    const { action } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // For demo purposes, simulate approval/rejection
    // In production, you would update the actual withdrawal request in the database
    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    // Log the admin action
    console.log(`Admin ${session.user.email} ${action}ed withdrawal request ${requestId}`);

    // In production, you would:
    // 1. Update the withdrawal request status
    // 2. If approved, process the actual withdrawal
    // 3. Update user balance
    // 4. Send notification to user
    // 5. Log the transaction

    return NextResponse.json({
      message: `Withdrawal ${action}ed successfully`,
      status: newStatus,
      requestId,
      adminEmail: session.user.email,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing withdrawal action:", error);
    return NextResponse.json(
      { error: "Failed to process withdrawal action" },
      { status: 500 }
    );
  }
}
