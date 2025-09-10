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

    // Get top products based on transaction data
    const topProducts = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        status: 'COMPLETED',
        type: {
          in: ['PURCHASE', 'STAKE', 'WITHDRAWAL']
        }
      },
      _count: {
        id: true
      },
      _sum: {
        amount: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 4
    });

    const products = topProducts.map((product, index) => {
      const productNames = {
        'PURCHASE': 'DIT Token Purchase',
        'STAKE': 'DIT Token Staking',
        'WITHDRAWAL': 'DIT Token Withdrawal'
      };

      return {
        image: `/images/product/product-0${index + 1}.png`,
        name: productNames[product.type as keyof typeof productNames] || product.type,
        category: "Cryptocurrency",
        price: product._sum.amount || 0,
        sold: product._count.id,
        profit: Math.round((product._sum.amount || 0) * 0.1) // 10% profit margin
      };
    });

    return NextResponse.json(products);

  } catch (error) {
    console.error("Top products analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
