import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayRange } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
    // Get current token price first
    const { start, end } = getTodayRange();
    
    // Try to get today's price first
    let currentPriceRecord = await prisma.tokenPrice.findFirst({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      orderBy: { date: 'desc' },
      select: { price: true }
    });
    
    // If no price for today, get the most recent price
    if (!currentPriceRecord) {
      currentPriceRecord = await prisma.tokenPrice.findFirst({
        orderBy: { date: 'desc' },
        select: { price: true }
      });
    }
    
    const currentPrice = currentPriceRecord?.price || 2.80;

    // Get real statistics from database
    const [
      totalUsers,
      activeUsers,
      totalTokens,
      totalStaked,
      totalTransactions,
      pendingWithdrawals,
      totalReferrals,
      totalCommissions,
      recentUsers,
      recentTransactions,
      recentStaking,
      recentReferrals,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active users (users with activity in last 30 days)
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Total tokens across all users
      prisma.user.aggregate({
        _sum: {
          totalTokens: true,
        },
      }),
      
      // Total staked tokens
      prisma.user.aggregate({
        _sum: {
          stakedTokens: true,
        },
      }),
      
      // Total transactions
      prisma.transaction.count(),
      
      // Pending withdrawals
      prisma.transaction.count({
        where: {
          type: "WITHDRAWAL",
          status: "PENDING",
        },
      }),
      
      // Total referrals
      prisma.user.count({
        where: {
          referredBy: {
            not: null,
          },
        },
      }),
      
      // Total commissions
      prisma.referralCommission.aggregate({
        _sum: {
          amount: true,
        },
      }),
      
      // Recent users (last 5)
      prisma.user.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          totalTokens: true,
        },
      }),
      
      // Recent transactions (last 5)
      prisma.transaction.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      
      // Recent staking (last 5)
      prisma.stakingRecord.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      
      // Recent referrals (last 5)
      prisma.referralCommission.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          referrer: {
            select: {
              name: true,
              email: true,
            },
          },
          referredUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Calculate additional statistics
    const totalTokensValue = (totalTokens._sum.totalTokens || 0) * currentPrice;
    const totalStakedValue = (totalStaked._sum.stakedTokens || 0) * currentPrice;
    const totalCommissionsValue = totalCommissions._sum.amount || 0;

    // Format recent activity
    const recentActivity = [
      ...recentUsers.map(user => ({
        id: user.id,
        type: "USER_REGISTRATION",
        description: `New user ${user.name} registered`,
        timestamp: user.createdAt,
        user: user.name,
        amount: null,
        status: "SUCCESS",
      })),
      ...recentTransactions.map(txn => ({
        id: txn.id,
        type: txn.type,
        description: txn.description,
        timestamp: txn.createdAt,
        user: txn.user.name,
        amount: txn.amount,
        status: txn.status,
      })),
      ...recentStaking.map(stake => ({
        id: stake.id,
        type: "STAKING",
        description: `${stake.user.name} staked ${stake.amount} tokens`,
        timestamp: stake.createdAt,
        user: stake.user.name,
        amount: stake.amount,
        status: stake.status,
      })),
      ...recentReferrals.map(ref => ({
        id: ref.id,
        type: "REFERRAL_COMMISSION",
        description: `${ref.referrer.name} earned $${ref.amount.toFixed(2)} from ${ref.referredUser.name}`,
        timestamp: ref.createdAt,
        user: ref.referrer.name,
        amount: ref.amount,
        status: ref.isPaid ? "PAID" : "PENDING",
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

    const stats = {
      totalUsers: totalUsers,
      activeUsers: activeUsers,
      totalTokens: totalTokens._sum.totalTokens || 0,
      totalTokensValue: totalTokensValue,
      totalStaked: totalStaked._sum.stakedTokens || 0,
      totalStakedValue: totalStakedValue,
      totalTransactions: totalTransactions,
      pendingWithdrawals: pendingWithdrawals,
      totalReferrals: totalReferrals,
      totalCommissions: totalCommissionsValue,
      newUsersThisMonth: await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      transactionsThisMonth: await prisma.transaction.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    };

    return NextResponse.json({
      stats,
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
