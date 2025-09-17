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

    // Debug logging
    console.log(`Referral History API - Current user: ${user.name} (${user.email}), Referral Code: ${user.referralCode}`);

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
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    console.log(`Referral History API - Found ${referredUsers.length} referred users for ${user.referralCode}`);
    
    if (referredUsers.length > 0) {
      referredUsers.forEach((refUser, index) => {
        console.log(`   ${index + 1}. ${refUser.name} (${refUser.email}) - ${refUser.transactions.length} transactions`);
      });
    }

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
      
      // Calculate total spent from all transactions
      const totalSpent = referredUser.transactions.reduce(
        (sum, transaction) => sum + transaction.amount, 0
      );
      
      // Calculate confirmed commission from commission records (original values, not recalculated)
      const confirmedCommission = userCommissions.reduce(
        (sum, commission) => sum + commission.amount, 0
      );
      
      // For first-time purchase logic: only show commission if it exists (first purchase only)
      // No pending commission calculation since commission is only on first purchase
      const pendingCommission = 0; // No pending commission for first-purchase-only logic
      
      // Total commission earned (only from first purchase)
      const commissionEarned = confirmedCommission;
      
      // Find the first completed transaction that earned commission
      const firstCommissionTransaction = referredUser.transactions
        .filter(t => t.status === "COMPLETED")
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      
      const firstCommissionDate = firstCommissionTransaction?.createdAt || null;
      const firstCommissionAmount = firstCommissionTransaction?.amount || 0;

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
        confirmedCommission,
        pendingCommission,
        firstCommissionDate,
        firstCommissionAmount,
        // Debug info
        transactionCounts: {
          total: referredUser.transactions.length,
          completed: referredUser.transactions.filter(t => t.status === "COMPLETED").length,
          pending: referredUser.transactions.filter(t => t.status === "PENDING").length,
          failed: referredUser.transactions.filter(t => t.status === "FAILED").length
        }
      };
    });

    // Calculate statistics
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(r => r.status === "ACTIVE").length;
    const totalCommission = referrals.reduce((sum, r) => sum + r.commissionEarned, 0);
    const totalPendingCommission = 0; // No pending commission for first-purchase-only logic
    const totalCommissionEarned = referrals.reduce((sum, r) => sum + r.commissionEarned, 0);

    const response = {
      referrals,
      stats: {
        totalReferrals,
        activeReferrals,
        totalCommission,
        totalPendingCommission,
        totalCommissionEarned,
      },
    };

    console.log(`Referral History API - Final response:`, {
      referralsCount: referrals.length,
      stats: response.stats
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Referral history fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
