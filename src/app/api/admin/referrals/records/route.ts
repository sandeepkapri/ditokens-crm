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

    // Fetch real referral records from database
    const records = await prisma.referralCommission.findMany({
      include: {
        referrer: {
          select: {
            name: true,
            email: true,
          },
        },
        referredUser: {
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
      referrerEmail: record.referrer.email,
      referrerName: record.referrer.name,
      referredEmail: record.referredUser.email,
      referredName: record.referredUser.name,
      commission: record.amount,
      status: record.isPaid ? "PAID" : "PENDING",
      month: new Date(0, record.month - 1).toLocaleString('default', { month: 'long' }),
      year: record.year,
      createdAt: record.createdAt.toISOString(),
    }));

    return NextResponse.json({
      records: formattedRecords,
    });
  } catch (error) {
    console.error("Error fetching referral records:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral records" },
      { status: 500 }
    );
  }
}
