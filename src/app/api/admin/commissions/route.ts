import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdminUser } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isSuperAdminUser(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    // Get commissions with pagination
    const [commissions, totalCount] = await Promise.all([
      prisma.referralCommission.findMany({
        where,
        include: {
          referrer: {
            select: {
              id: true,
              name: true,
              email: true,
              referralEarnings: true,
              createdAt: true
            }
          },
          referredUser: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.referralCommission.count({ where })
    ]);

    // Calculate summary statistics
    const summaryStats = await prisma.referralCommission.groupBy({
      by: ['status'],
      _sum: {
        amount: true,
        tokenAmount: true
      },
      _count: {
        id: true
      }
    });

    const stats = {
      total: totalCount,
      pending: summaryStats.find(s => s.status === 'PENDING')?._count.id || 0,
      approved: summaryStats.find(s => s.status === 'APPROVED')?._count.id || 0,
      rejected: summaryStats.find(s => s.status === 'REJECTED')?._count.id || 0,
      totalAmount: summaryStats.reduce((sum, s) => sum + (s._sum.amount || 0), 0),
      totalTokenAmount: summaryStats.reduce((sum, s) => sum + (s._sum.tokenAmount || 0), 0)
    };

    return NextResponse.json({
      commissions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats
    });

  } catch (error) {
    console.error("Admin commissions fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
