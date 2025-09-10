import { NextRequest, NextResponse } from "next/server";
import { USDTMonitor } from "@/lib/usdt-monitor";

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "your-cron-secret";
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Start USDT monitoring
    await USDTMonitor.monitorTransactions();

    return NextResponse.json({
      success: true,
      message: "USDT monitoring completed",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in USDT monitoring cron job:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "USDT monitoring failed",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
