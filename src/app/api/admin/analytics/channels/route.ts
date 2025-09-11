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

    // Get channel data based on payment methods and user agents
    const channelData = await prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: {
        status: 'COMPLETED'
      },
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    });

    // Map payment methods to channels
    const channelMap = {
      'USDT': { name: 'USDT Network', logo: 'USDT' },
      'ETH': { name: 'Ethereum', logo: 'ETH' },
      'BTC': { name: 'Bitcoin', logo: 'BTC' },
      'BSC': { name: 'BSC Network', logo: 'BSC' },
      'POLYGON': { name: 'Polygon', logo: 'POLYGON' }
    };

    const channels = channelData.map(channel => {
      const channelInfo = channelMap[channel.paymentMethod as keyof typeof channelMap] || {
        name: channel.paymentMethod,
        logo: channel.paymentMethod
      };

      const visitors = channel._count.id;
      const revenues = channel._sum.amount || 0;
      const sales = channel._count.id;
      const conversion = visitors > 0 ? (sales / visitors) * 100 : 0;

      return {
        name: channelInfo.name,
        visitors,
        revenues: Math.round(revenues * 100) / 100,
        sales,
        conversion: Math.round(conversion * 100) / 100,
        logo: channelInfo.logo
      };
    });

    // Sort by visitors descending
    channels.sort((a, b) => b.visitors - a.visitors);

    return NextResponse.json(channels);

  } catch (error) {
    console.error("Channels analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
