import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addWalletSchema = z.object({
  network: z.string(),
  label: z.string().min(1),
  address: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is active first
    if (!user.isActive) {
      return NextResponse.json({ 
        wallets: [], 
        requests: [],
        message: "Account is not active. Please contact support to activate your account."
      });
    }

    // Fetch real wallets from database
    const wallets = await prisma.withdrawalWallet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch withdrawal requests
    const withdrawalRequests = await prisma.withdrawalRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      wallets: wallets.map(wallet => ({
        id: wallet.id,
        address: wallet.address,
        network: wallet.network,
        label: wallet.label,
        isActive: wallet.isActive,
        isVerified: wallet.isVerified,
        lastUsed: wallet.lastUsed?.toISOString() || null,
      })),
      requests: withdrawalRequests.map(request => ({
        id: request.id,
        amount: request.amount,
        network: request.network,
        address: request.walletAddress,
        status: request.status,
        txHash: request.txHash,
        fee: request.fee,
        timestamp: request.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching withdrawal wallets:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawal wallets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { network, label, address } = addWalletSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Basic address validation
    const addressValidation = {
      usdt: /^0x[a-fA-F0-9]{40}$/,
      ethereum: /^0x[a-fA-F0-9]{40}$/,
      bitcoin: /^(bc1|[13])[a-zA-Z0-9]{25,62}$/,
      polygon: /^0x[a-fA-F0-9]{40}$/,
      binance: /^0x[a-fA-F0-9]{40}$/,
    };

    const validator = addressValidation[network as keyof typeof addressValidation];
    if (validator && !validator.test(address)) {
      return NextResponse.json(
        { error: `Invalid ${network} address format` },
        { status: 400 }
      );
    }

    // Save wallet to database
    const savedWallet = await prisma.withdrawalWallet.create({
      data: {
        userId: user.id,
        address,
        network,
        label,
        isActive: true,
        isVerified: true, // Auto-verify new wallets for simplicity
      },
    });

    return NextResponse.json({
      message: "Withdrawal wallet added successfully",
      wallet: {
        id: savedWallet.id,
        address: savedWallet.address,
        network: savedWallet.network,
        label: savedWallet.label,
        isActive: savedWallet.isActive,
        isVerified: savedWallet.isVerified,
        lastUsed: savedWallet.lastUsed?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Error adding withdrawal wallet:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add withdrawal wallet" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('id');

    if (!walletId) {
      return NextResponse.json({ error: "Wallet ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if wallet belongs to user
    const wallet = await prisma.withdrawalWallet.findFirst({
      where: { id: walletId, userId: user.id },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Delete the wallet
    await prisma.withdrawalWallet.delete({
      where: { id: walletId },
    });

    return NextResponse.json({
      message: "Withdrawal wallet deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting withdrawal wallet:", error);
    return NextResponse.json(
      { error: "Failed to delete withdrawal wallet" },
      { status: 500 }
    );
  }
}
