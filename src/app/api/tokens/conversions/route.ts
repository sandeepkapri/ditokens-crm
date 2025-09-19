import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get conversion transactions (SALE type with internal_conversion payment method)
    const conversions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "SALE",
        paymentMethod: "internal_conversion",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        tokenAmount: true,
        pricePerToken: true,
        status: true,
        description: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      conversions: conversions,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching conversion history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
