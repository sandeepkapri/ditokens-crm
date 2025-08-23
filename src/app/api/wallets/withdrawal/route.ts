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

    // For demo purposes, return mock data
    // In production, you would fetch from actual wallet tables
    const mockWallets = [
      {
        id: "1",
        address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        network: "usdt",
        label: "USDT Trading Wallet",
        isActive: true,
        isVerified: true,
        lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        address: "0x9876543210fedcba9876543210fedcba98765432",
        network: "ethereum",
        label: "ETH Hardware Wallet",
        isActive: true,
        isVerified: true,
        lastUsed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "3",
        address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        network: "bitcoin",
        label: "BTC Cold Storage",
        isActive: true,
        isVerified: true,
        lastUsed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "4",
        address: "0xabcdef1234567890abcdef1234567890abcdef12",
        network: "polygon",
        label: "MATIC DeFi Wallet",
        isActive: true,
        isVerified: false,
        lastUsed: null,
      },
    ];

    const mockRequests = [
      {
        id: "1",
        amount: 100.0,
        network: "usdt",
        address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        status: "COMPLETED",
        txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        fee: 1.0,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        amount: 0.1,
        network: "ethereum",
        address: "0x9876543210fedcba9876543210fedcba98765432",
        status: "COMPLETED",
        txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        fee: 0.005,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "3",
        amount: 0.05,
        network: "bitcoin",
        address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        status: "PROCESSING",
        txHash: undefined,
        fee: 0.0001,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return NextResponse.json({
      wallets: mockWallets,
      requests: mockRequests,
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

    const newWallet = {
      id: Math.random().toString(36).substr(2, 9),
      address,
      network,
      label,
      isActive: true,
      isVerified: false, // New wallets need verification
      lastUsed: null,
    };

    // In production, you would save this to a database
    // await prisma.withdrawalWallet.create({
    //   data: {
    //     userId: user.id,
    //     address: newWallet.address,
    //     network: newWallet.network,
    //     label: newWallet.label,
    //     isActive: true,
    //     isVerified: false,
    //   },
    // });

    return NextResponse.json({
      message: "Withdrawal wallet added successfully",
      wallet: newWallet,
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
