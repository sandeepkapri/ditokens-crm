import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin-auth";
import { USDTMonitor } from "@/lib/usdt-monitor";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminUser(session)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Start USDT monitoring
    await USDTMonitor.monitorTransactions();

    return NextResponse.json({
      success: true,
      message: "USDT monitoring started successfully"
    });

  } catch (error) {
    console.error("Error starting USDT monitoring:", error);
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

    if (!isAdminUser(session)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Return monitoring status and configuration
    return NextResponse.json({
      monitoring: {
        companyWallet: "0x7E874A697007965c6A3DdB1702828A764E7a91c3",
        usdtContract: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        minConfirmations: 3,
        suspiciousThreshold: 10000
      },
      endpoints: {
        monitor: "/api/admin/monitor-usdt",
        transactions: "/api/admin/usdt-transactions",
        userWallet: "/api/wallet/usdt"
      }
    });

  } catch (error) {
    console.error("Error getting USDT monitoring status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
