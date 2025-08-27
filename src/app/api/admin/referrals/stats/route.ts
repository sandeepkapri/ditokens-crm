import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminUser(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get referral statistics
    const [
      totalReferrals,
      totalCommissions,
      activeReferrers
    ] = await Promise.all([
      prisma.user.count({
        where: { referredBy: { not: null } }
      }),
      prisma.referralCommission.aggregate({
        _sum: { amount: true }
      }),
      prisma.user.count({
        where: {
          referredBy: { not: null },
          isActive: true
        }
      })
    ]);

    // Calculate monthly growth (demo data)
    const monthlyGrowth = 15.5; // In production, calculate from actual data

    const stats = {
      totalReferrals,
      totalCommissions: totalCommissions._sum.amount || 0,
      activeReferrers,
      monthlyGrowth,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral stats" },
      { status: 500 }
    );
  }
}
