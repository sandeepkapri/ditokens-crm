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

    // Get recent transactions as invoice data
    const invoices = await prisma.transaction.findMany({
      where: {
        status: {
          in: ['COMPLETED', 'PENDING', 'FAILED']
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const invoiceData = invoices.map(transaction => {
      const statusMap = {
        'COMPLETED': 'Paid',
        'PENDING': 'Pending',
        'FAILED': 'Unpaid'
      };

      const packageNames = {
        'PURCHASE': 'Token Purchase Package',
        'STAKE': 'Staking Package',
        'WITHDRAWAL': 'Withdrawal Package',
        'DEPOSIT': 'Deposit Package'
      };

      return {
        name: packageNames[transaction.type as keyof typeof packageNames] || transaction.type,
        price: transaction.amount,
        date: transaction.createdAt.toISOString(),
        status: statusMap[transaction.status as keyof typeof statusMap] || transaction.status
      };
    });

    return NextResponse.json(invoiceData);

  } catch (error) {
    console.error("Invoices analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
