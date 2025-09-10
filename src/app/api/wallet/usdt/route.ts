import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { USDTMonitor } from "@/lib/usdt-monitor";
import { z } from "zod";

const usdtWalletSchema = z.object({
  walletAddress: z.string().min(42).max(42).regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { walletAddress } = usdtWalletSchema.parse(body);

    // Get user ID
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, isActive: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account is not active" }, { status: 403 });
    }

    // Set USDT wallet address
    const success = await USDTMonitor.setUserUSDTWallet(user.id, walletAddress);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "USDT wallet address updated successfully",
        walletAddress
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "Failed to update USDT wallet address"
      }, { status: 400 });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating USDT wallet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's USDT wallet address
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        usdtWalletAddress: true,
        isActive: true 
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account is not active" }, { status: 403 });
    }

    // Get transaction history
    const transactions = await USDTMonitor.getUserTransactionHistory(user.id);

    return NextResponse.json({
      walletAddress: user.usdtWalletAddress,
      transactions,
      companyWallet: "0x7E874A697007965c6A3DdB1702828A764E7a91c3"
    });

  } catch (error) {
    console.error("Error getting USDT wallet info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
