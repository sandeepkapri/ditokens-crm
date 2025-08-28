import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdminUser } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isSuperAdminUser(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get token supply information
    const tokenSupply = await prisma.tokenSupply.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!tokenSupply) {
      return NextResponse.json({ error: "Token supply not configured" }, { status: 404 });
    }

    return NextResponse.json({
      totalSupply: tokenSupply.totalSupply,
      tokensSold: tokenSupply.tokensSold,
      tokensAvailable: tokenSupply.tokensAvailable,
      lastUpdated: tokenSupply.updatedAt,
      updatedBy: tokenSupply.updatedBy
    });
  } catch (error) {
    console.error("Error fetching token supply:", error);
    return NextResponse.json(
      { error: "Failed to fetch token supply" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isSuperAdminUser(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { totalSupply, tokensSold, tokensAvailable } = body;

    if (totalSupply < tokensSold) {
      return NextResponse.json(
        { error: "Total supply cannot be less than tokens sold" },
        { status: 400 }
      );
    }

    if (tokensAvailable < 0) {
      return NextResponse.json(
        { error: "Available tokens cannot be negative" },
        { status: 400 }
      );
    }

    // Update or create token supply record
    const tokenSupply = await prisma.tokenSupply.upsert({
      where: { id: "default" },
      update: {
        totalSupply,
        tokensSold,
        tokensAvailable,
        updatedBy: session?.user?.id || "unknown",
        updatedAt: new Date()
      },
      create: {
        id: "default",
        totalSupply,
        tokensSold,
        tokensAvailable,
        updatedBy: session?.user?.id || "unknown"
      }
    });

    return NextResponse.json({
      success: true,
      data: tokenSupply,
      message: "Token supply updated successfully"
    });
  } catch (error) {
    console.error("Error updating token supply:", error);
    return NextResponse.json(
      { error: "Failed to update token supply" },
      { status: 500 }
    );
  }
}
