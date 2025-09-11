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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    // Build where clause based on filter
    let whereClause: any = {};
    if (filter === 'unverified') {
      whereClause.isVerified = false;
    } else if (filter === 'verified') {
      whereClause.isVerified = true;
    }

    // Fetch withdrawal wallets with user information
    const wallets = await prisma.withdrawalWallet.findMany({
      where: whereClause,
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

    // Format wallets for frontend
    const formattedWallets = wallets.map(wallet => ({
      id: wallet.id,
      userId: wallet.userId,
      userEmail: wallet.user.email,
      userName: wallet.user.name || 'Unknown User',
      address: wallet.address,
      network: wallet.network,
      label: wallet.label,
      isActive: wallet.isActive,
      isVerified: wallet.isVerified,
      lastUsed: wallet.lastUsed?.toISOString() || null,
      createdAt: wallet.createdAt.toISOString()
    }));

    return NextResponse.json({
      wallets: formattedWallets,
      total: formattedWallets.length,
      filter
    });

  } catch (error) {
    console.error("Admin wallet management error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
