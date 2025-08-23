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

    // Get all users referred by this user
    const referredUsers = await prisma.user.findMany({
      where: { referredBy: user.referralCode },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        totalTokens: true,
        transactions: {
          where: { type: "PURCHASE" },
          select: {
            amount: true,
            createdAt: true,
          },
        },
      },
    });

    // Get commission records
    const commissionRecords = await prisma.referralCommission.findMany({
      where: { referrerId: user.id },
      select: {
        id: true,
        referredUserId: true,
        amount: true,
        isPaid: true,
        createdAt: true,
      },
    });

    // Process referrals with commission data
    const referrals = referredUsers.map(referredUser => {
      const userCommissions = commissionRecords.filter(
        record => record.referredUserId === referredUser.id
      );
      
      const totalSpent = referredUser.transactions.reduce(
        (sum, transaction) => sum + transaction.amount, 0
      );
      
      const commissionEarned = userCommissions.reduce(
        (sum, commission) => sum + commission.amount, 0
      );
      
      const lastPurchase = referredUser.transactions.length > 0 
        ? referredUser.transactions.reduce((latest, transaction) => 
            transaction.createdAt > latest.createdAt ? transaction : latest
          ).createdAt
        : null;

      // Determine status based on activity
      let status: "ACTIVE" | "PENDING" | "INACTIVE" = "INACTIVE";
      if (totalSpent > 0) {
        status = "ACTIVE";
      } else if (referredUser.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        status = "PENDING";
      }

      return {
        id: referredUser.id,
        referredUser: {
          name: referredUser.name,
          email: referredUser.email,
          createdAt: referredUser.createdAt,
        },
        status,
        totalSpent,
        commissionEarned,
        lastPurchase,
      };
    });

    // Calculate statistics
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(r => r.status === "ACTIVE").length;
    const totalCommission = referrals.reduce((sum, r) => sum + r.commissionEarned, 0);
    const pendingCommission = commissionRecords
      .filter(record => !record.isPaid)
      .reduce((sum, record) => sum + record.amount, 0);

    return NextResponse.json({
      referrals,
      stats: {
        totalReferrals,
        activeReferrals,
        totalCommission,
        pendingCommission,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Referral history fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
