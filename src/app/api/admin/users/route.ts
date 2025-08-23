import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== "admin@ditokens.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        name: true,
        email: true,
        contactNumber: true,
        country: true,
        state: true,
        role: true,
        isActive: true,
        emailVerified: true,
        referralCode: true,
        referredBy: true,
        totalTokens: true,
        stakedTokens: true,
        availableTokens: true,
        totalEarnings: true,
        referralEarnings: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      users: users.map(user => ({
        ...user,
        totalTokens: user.totalTokens || 0,
        stakedTokens: user.stakedTokens || 0,
        availableTokens: user.availableTokens || 0,
        totalEarnings: user.totalEarnings || 0,
        referralEarnings: user.referralEarnings || 0,
      }))
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
