import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get profile update history
    const history = await prisma.profileUpdate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20, // Limit to last 20 updates
      select: {
        id: true,
        field: true,
        oldValue: true,
        newValue: true,
        updateType: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ 
      history,
      totalUpdates: history.length 
    }, { status: 200 });
  } catch (error) {
    console.error("Profile history fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
