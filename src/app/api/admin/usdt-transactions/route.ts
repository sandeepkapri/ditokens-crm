import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminUser(session)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const status = url.searchParams.get("status") || "all";
    const search = url.searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      paymentMethod: "usdt_erc20"
    };

    if (status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { txHash: { contains: search, mode: "insensitive" } },
        { walletAddress: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } }
      ];
    }

    // Get transactions with user info
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            usdtWalletAddress: true,
            isActive: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    });

    // Get total count
    const totalCount = await prisma.transaction.count({ where });

    // Calculate summary statistics
    const summary = await prisma.transaction.aggregate({
      where: {
        paymentMethod: "usdt_erc20",
        status: "COMPLETED"
      },
      _sum: {
        amount: true,
        tokenAmount: true
      },
      _count: true
    });

    const pendingCount = await prisma.transaction.count({
      where: {
        paymentMethod: "usdt_erc20",
        status: "PENDING"
      }
    });

    const failedCount = await prisma.transaction.count({
      where: {
        paymentMethod: "usdt_erc20",
        status: "FAILED"
      }
    });

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      summary: {
        totalTransactions: summary._count,
        totalAmount: summary._sum.amount || 0,
        totalTokens: summary._sum.tokenAmount || 0,
        pendingCount,
        failedCount
      }
    });

  } catch (error) {
    console.error("Error fetching USDT transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminUser(session)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { action, transactionId, status } = body;

    if (action === "update_status") {
      if (!transactionId || !status) {
        return NextResponse.json(
          { error: "Transaction ID and status are required" },
          { status: 400 }
        );
      }

      const validStatuses = ["PENDING", "COMPLETED", "FAILED", "CANCELLED"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }

      const transaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: { status },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: "Transaction status updated successfully",
        transaction
      });
    }

    if (action === "manual_verification") {
      if (!transactionId) {
        return NextResponse.json(
          { error: "Transaction ID is required" },
          { status: 400 }
        );
      }

      // Mark transaction as manually verified
      const transaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: { 
          status: "COMPLETED",
          description: "Manually verified by admin"
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Update user's token balance if transaction was completed
      if (transaction.status === "COMPLETED") {
        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            totalTokens: { increment: transaction.tokenAmount },
            availableTokens: { increment: transaction.tokenAmount }
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: "Transaction manually verified and completed",
        transaction
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error processing USDT transaction action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
