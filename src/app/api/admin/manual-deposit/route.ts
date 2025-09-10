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

    // Update user's token balance
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalTokens: { increment: tokenAmount },
        availableTokens: { increment: tokenAmount },
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
    const latestPrice = await prisma.tokenPrice.findFirst({
      orderBy: { date: 'desc' }
    });
    return latestPrice ? Number(latestPrice.price) : 2.80;
  } catch (error) {
    console.error('Error getting current token price:', error);
    return 2.80; // Fallback price
  }
}
