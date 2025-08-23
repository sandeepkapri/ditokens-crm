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

    // Fetch real change history from database
    const [
      profileUpdates,
      transactions,
      stakingRecords,
      referralCommissions
    ] = await Promise.all([
      prisma.profileUpdate.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.transaction.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.stakingRecord.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.referralCommission.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          referrer: {
            select: { name: true, email: true }
          },
          referredUser: {
            select: { name: true, email: true }
          }
        }
      })
    ]);

    // Combine and format all activity into change history
    const allRecords = [
      ...profileUpdates.map(update => ({
        id: update.id,
        adminEmail: "admin@ditokens.com",
        adminName: "System",
        action: "UPDATE",
        targetType: "USER_PROFILE",
        targetId: update.userId,
        targetName: update.user.name,
        oldValue: update.oldValue || "N/A",
        newValue: update.newValue || "N/A",
        timestamp: update.createdAt.toISOString(),
        ipAddress: update.ipAddress || "N/A",
      })),
      ...transactions.map(txn => ({
        id: txn.id,
        adminEmail: "admin@ditokens.com",
        adminName: "System",
        action: "CREATE",
        targetType: "TRANSACTION",
        targetId: txn.id,
        targetName: `${txn.type} - ${txn.user.name}`,
        oldValue: "N/A",
        newValue: `$${txn.amount.toFixed(2)}`,
        timestamp: txn.createdAt.toISOString(),
        ipAddress: "N/A",
      })),
      ...stakingRecords.map(stake => ({
        id: stake.id,
        adminEmail: "admin@ditokens.com",
        adminName: "System",
        action: "CREATE",
        targetType: "STAKING",
        targetId: stake.id,
        targetName: `${stake.user.name} - ${stake.amount} tokens`,
        oldValue: "N/A",
        newValue: `APY: ${stake.apy}%`,
        timestamp: stake.createdAt.toISOString(),
        ipAddress: "N/A",
      })),
      ...referralCommissions.map(comm => ({
        id: comm.id,
        adminEmail: "admin@ditokens.com",
        adminName: "System",
        action: "CREATE",
        targetType: "REFERRAL",
        targetId: comm.id,
        targetName: `${comm.referrer.name} → ${comm.referredUser.name}`,
        oldValue: "N/A",
        newValue: `$${comm.amount.toFixed(2)}`,
        timestamp: comm.createdAt.toISOString(),
        ipAddress: "N/A",
      }))
    ];

    // Sort by timestamp and take top 20
    const sortedRecords = allRecords
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return NextResponse.json({ records: sortedRecords });
  } catch (error) {
    console.error("Error fetching change history:", error);
    return NextResponse.json({ error: "Failed to fetch change history" }, { status: 500 });
  }
}
