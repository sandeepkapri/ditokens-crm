import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin-auth";
import { z } from "zod";

const verifyWalletSchema = z.object({
  walletId: z.string(),
  action: z.enum(["verify", "reject"]),
  reason: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdminUser(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { walletId, action, reason } = verifyWalletSchema.parse(body);

    // Find the wallet
    const wallet = await prisma.withdrawalWallet.findUnique({
      where: { id: walletId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (action === "verify") {
      // Verify the wallet
      await prisma.withdrawalWallet.update({
        where: { id: walletId },
        data: { 
          isVerified: true,
          isActive: true // Also activate when verifying
        }
      });

      return NextResponse.json({
        message: "Wallet verified successfully",
        walletId,
        userEmail: wallet.user.email
      });

    } else if (action === "reject") {
      // Reject the wallet (deactivate it)
      await prisma.withdrawalWallet.update({
        where: { id: walletId },
        data: { 
          isActive: false,
          isVerified: false
        }
      });

      return NextResponse.json({
        message: "Wallet rejected successfully",
        walletId,
        userEmail: wallet.user.email,
        reason: reason || "Rejected by admin"
      });
    }

  } catch (error) {
    console.error("Admin wallet verification error:", error);
    
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
