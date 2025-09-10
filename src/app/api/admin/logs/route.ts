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
    const level = searchParams.get('level');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    if (level && level !== 'all') {
      where.level = level.toUpperCase();
    }

    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } }
      ];
    }

    // For now, we'll generate logs from existing data since we don't have a dedicated logs table
    // In a real application, you would have a proper logging system
    
    // Get login history as logs
    const loginHistory = await prisma.loginHistory.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Get transaction logs
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Convert to log format
    const logs = [
      ...loginHistory.map(login => ({
        id: `login_${login.id}`,
        timestamp: login.createdAt.toISOString(),
        level: login.status === 'SUCCESS' ? 'INFO' : 'WARN',
        message: login.status === 'SUCCESS' 
          ? `User login successful: ${login.user.email}`
          : `Failed login attempt: ${login.user.email}`,
        userId: login.user.email,
        ipAddress: login.ipAddress,
        userAgent: login.userAgent
      })),
      ...transactions.map(tx => ({
        id: `tx_${tx.id}`,
        timestamp: tx.createdAt.toISOString(),
        level: tx.status === 'COMPLETED' ? 'INFO' : tx.status === 'FAILED' ? 'ERROR' : 'WARN',
        message: `Transaction ${tx.status.toLowerCase()}: ${tx.type} - $${tx.amount}`,
        userId: tx.user.email,
        ipAddress: 'N/A',
        userAgent: 'System'
      }))
    ];

    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply filters
    let filteredLogs = logs;
    if (level && level !== 'all') {
      filteredLogs = logs.filter(log => log.level === level.toUpperCase());
    }
    if (search) {
      filteredLogs = logs.filter(log => 
        log.message.toLowerCase().includes(search.toLowerCase()) ||
        log.userId.toLowerCase().includes(search.toLowerCase()) ||
        log.ipAddress.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    return NextResponse.json({
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total: filteredLogs.length,
        pages: Math.ceil(filteredLogs.length / limit)
      }
    });

  } catch (error) {
    console.error("Admin logs fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
