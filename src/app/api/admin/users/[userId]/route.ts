import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminUser(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { action, value } = body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from modifying superadmin
    if (user.role === "SUPERADMIN" && !isAdminUser(session)) {
      return NextResponse.json({ error: "Cannot modify superadmin user" }, { status: 403 });
    }

    let updateData: any = {};

    switch (action) {
      case "toggleStatus":
        updateData.isActive = !user.isActive;
        break;

      case "changeRole":
        if (value === "SUPERADMIN") {
          return NextResponse.json({ error: "Cannot promote user to superadmin" }, { status: 403 });
        }
        updateData.role = value;
        break;

      case "updateTokens":
        if (typeof value.totalTokens === "number") updateData.totalTokens = value.totalTokens;
        if (typeof value.stakedTokens === "number") updateData.stakedTokens = value.stakedTokens;
        if (typeof value.availableTokens === "number") updateData.availableTokens = value.availableTokens;
        break;

      case "updateEarnings":
        if (typeof value.totalEarnings === "number") updateData.totalEarnings = value.totalEarnings;
        if (typeof value.referralEarnings === "number") updateData.referralEarnings = value.referralEarnings;
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Log the admin action
    // In production, you might want to log this to an audit log table
    console.log(`Admin ${session.user.email} performed action ${action} on user ${userId}`);

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
