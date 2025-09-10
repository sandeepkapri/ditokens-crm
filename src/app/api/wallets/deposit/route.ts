import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addWalletSchema = z.object({
  network: z.string(),
  label: z.string().min(1),
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
        transactions: [],
        message: "Account is not active. Please contact support to activate your account."
      });
    }

    // Return empty data for now - no mock data
    const mockWallets: any[] = [];
    const mockTransactions: any[] = [];

    return NextResponse.json({
      wallets: mockWallets,
      transactions: mockTransactions,
    });
  } catch (error) {
    console.error("Error fetching deposit wallets:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposit wallets" },
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
    const { network, label } = addWalletSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a mock wallet address based on network
    const generateMockAddress = (network: string) => {
      const addresses = {
        usdt: "0x" + Math.random().toString(16).substr(2, 40),
        ethereum: "0x" + Math.random().toString(16).substr(2, 40),
        bitcoin: "bc1q" + Math.random().toString(16).substr(2, 38),
        polygon: "0x" + Math.random().toString(16).substr(2, 40),
        binance: "0x" + Math.random().toString(16).substr(2, 40),
      };
      return addresses[network as keyof typeof addresses] || addresses.usdt;
    };

    const newWallet = {
      id: Math.random().toString(36).substr(2, 9),
      address: generateMockAddress(network),
      network,
      label,
      isActive: true,
      balance: 0.0,
      lastDeposit: null,
    };

    // In production, you would save this to a database
    // await prisma.depositWallet.create({
    //   data: {
    //     userId: user.id,
    //     address: newWallet.address,
    //     network: newWallet.network,
    //     label: newWallet.label,
    //     isActive: true,
    //   },
    // });

    return NextResponse.json({
      message: "Deposit wallet added successfully",
      wallet: newWallet,
    });
  } catch (error) {
    console.error("Error adding deposit wallet:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add deposit wallet" },
      { status: 500 }
    );
  }
}
