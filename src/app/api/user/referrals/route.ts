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

    // Get referral statistics
    const totalReferrals = await prisma.user.count({
      where: { referredBy: user.referralCode },
    });

    // Get total commission earned
    const totalCommission = await prisma.referralCommission.aggregate({
      where: { referrerId: user.id },
      _sum: { amount: true },
    });

    // Get pending commission (not yet paid)
    const pendingCommission = await prisma.referralCommission.aggregate({
      where: { 
        referrerId: user.id,
        isPaid: false,
      },
      _sum: { amount: true },
    });

    // Build referral link
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const referralLink = `${baseUrl}/auth/sign-up?ref=${user.referralCode}`;

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink,
      totalReferrals,
      totalEarnings: totalCommission._sum.amount || 0,
      pendingEarnings: pendingCommission._sum.amount || 0,
    }, { status: 200 });
  } catch (error) {
    console.error("Referrals fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
