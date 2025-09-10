import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin-auth";
import * as logos from "@/assets/logos";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdminUser(session)) {
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
      'USDT': { name: 'USDT Network', logo: logos.google },
      'ETH': { name: 'Ethereum', logo: logos.github },
      'BTC': { name: 'Bitcoin', logo: logos.x },
      'BSC': { name: 'BSC Network', logo: logos.facebook },
      'POLYGON': { name: 'Polygon', logo: logos.vimeo }
    };

    const channels = channelData.map(channel => {
      const channelInfo = channelMap[channel.paymentMethod as keyof typeof channelMap] || {
        name: channel.paymentMethod,
        logo: logos.google
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
