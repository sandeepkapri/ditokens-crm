import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== "admin@ditokens.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch real staking records from database
    const records = await prisma.stakingRecord.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to match expected format
    const formattedRecords = records.map(record => ({
      id: record.id,
      userEmail: record.user.email,
      userName: record.user.name,
      amount: record.amount,
      apy: record.apy,
      startDate: record.startDate.toISOString(),
      endDate: record.endDate.toISOString(),
      status: record.status,
      rewards: record.rewards,
      createdAt: record.createdAt.toISOString(),
    }));

    return NextResponse.json({
      records: formattedRecords,
    });
  } catch (error) {
    console.error("Error fetching staking records:", error);
    return NextResponse.json(
      { error: "Failed to fetch staking records" },
      { status: 500 }
    );
  }
}
