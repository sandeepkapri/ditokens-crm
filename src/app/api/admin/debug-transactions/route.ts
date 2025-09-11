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

    // Get ALL transactions to debug
    const allTransactions = await prisma.transaction.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get pending transactions specifically
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        type: 'PURCHASE'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      totalTransactions: allTransactions.length,
      pendingTransactions: pendingTransactions.length,
      allTransactions: allTransactions.map(t => ({
        id: t.id,
        type: t.type,
        status: t.status,
        amount: t.amount,
        userEmail: t.user.email,
        createdAt: t.createdAt.toISOString()
      })),
      pendingOnly: pendingTransactions.map(t => ({
        id: t.id,
        type: t.type,
        status: t.status,
        amount: t.amount,
        userEmail: t.user.email,
        createdAt: t.createdAt.toISOString()
      }))
    });

  } catch (error) {
    console.error("Debug transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
