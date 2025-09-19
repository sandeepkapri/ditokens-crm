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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      type: 'STAKE' // Only staking transactions
    };
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Fetch staking transactions with pagination
    const [stakingTransactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    // Get staking records for these transactions
    const userIds = stakingTransactions.map(t => t.userId);
    const stakingRecords = await prisma.stakingRecord.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        stakingPeriod: true,
        startDate: true,
        endDate: true
      }
    });

    // Calculate rewards for each staking transaction
    const rewards = stakingTransactions.map(transaction => {
      const stakingAmount = transaction.tokenAmount || 0;
      const apy = 12.5; // Default APY
      
      // Find the staking record for this user
      const stakingRecord = stakingRecords.find(record => record.userId === transaction.userId);
      const stakingPeriod = stakingRecord?.stakingPeriod || 3; // Use actual staking period or default to 3
      
      const rewards = (stakingAmount * apy / 100) / 12; // Monthly rewards
      const totalRewardsEarned = rewards; // Simplified calculation
      
      const startDate = transaction.createdAt;
      const endDate = stakingRecord?.endDate || new Date(startDate.getTime() + (stakingPeriod * 365 * 24 * 60 * 60 * 1000));
      
      const lastRewardDate = new Date();
      lastRewardDate.setMonth(lastRewardDate.getMonth() - 1);

      return {
        id: transaction.id,
        userId: transaction.userId,
        userEmail: transaction.user.email,
        stakingAmount,
        apy,
        rewards,
        stakingPeriod,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: transaction.status === 'COMPLETED' ? 'ACTIVE' : transaction.status,
        lastRewardDate: lastRewardDate.toISOString(),
        totalRewardsEarned
      };
    });

    return NextResponse.json({
      rewards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Admin staking rewards fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
