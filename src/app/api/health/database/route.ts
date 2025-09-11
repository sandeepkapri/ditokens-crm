import { NextRequest, NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/database-health";

export async function GET(request: NextRequest) {
  try {
    const healthStatus = await checkDatabaseHealth();
    
    return NextResponse.json(healthStatus, {
      status: healthStatus.isConnected ? 200 : 503
    });
  } catch (error: any) {
    console.error("Health check error:", error);
    
    return NextResponse.json(
      {
        isConnected: false,
        error: error.message || "Health check failed",
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
