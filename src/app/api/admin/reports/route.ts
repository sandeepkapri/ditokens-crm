import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reportSchema = z.object({
  type: z.enum(["transactions", "withdrawals", "users", "referrals", "commissions"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { type, startDate, endDate, format } = reportSchema.parse(body);

    // Build date filter with inclusive boundaries
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        // Start date: beginning of the day (00:00:00.000)
        dateFilter.createdAt.gte = new Date(startDate + 'T00:00:00.000Z');
      }
      if (endDate) {
        // End date: end of the day (23:59:59.999)
        dateFilter.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    let reportData: any = {};
    let totalRecords = 0;

    switch (type) {
      case "transactions":
        const transactions = await prisma.transaction.findMany({
          where: dateFilter,
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          },
          orderBy: { createdAt: "desc" },
        });
        
        reportData = transactions.map(txn => ({
          id: txn.id,
          userId: txn.userId,
          userName: txn.user.name,
          userEmail: txn.user.email,
          type: txn.type,
          amount: txn.amount,
          tokenAmount: txn.tokenAmount,
          pricePerToken: txn.pricePerToken,
          status: txn.status,
          paymentMethod: txn.paymentMethod,
          description: txn.description,
          processingFee: txn.processingFee,
          walletAddress: txn.walletAddress,
          createdAt: txn.createdAt,
          updatedAt: txn.updatedAt,
        }));
        totalRecords = transactions.length;
        break;

      case "withdrawals":
        const withdrawals = await prisma.withdrawalRequest.findMany({
          where: dateFilter,
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          },
          orderBy: { createdAt: "desc" },
        });
        
        reportData = withdrawals.map(w => ({
          id: w.id,
          userId: w.userId,
          userName: w.user.name,
          userEmail: w.user.email,
          amount: w.amount,
          tokenAmount: w.tokenAmount,
          network: w.network,
          walletAddress: w.walletAddress,
          status: w.status,
          requestDate: w.requestDate,
          processedDate: w.processedDate,
          lockPeriod: w.lockPeriod,
          canWithdraw: w.canWithdraw,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        }));
        totalRecords = withdrawals.length;
        break;

      case "users":
        const users = await prisma.user.findMany({
          where: dateFilter,
          orderBy: { createdAt: "desc" },
        });
        
        reportData = users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          contactNumber: u.contactNumber,
          country: u.country,
          state: u.state,
          role: u.role,
          isActive: u.isActive,
          emailVerified: u.emailVerified,
          referralCode: u.referralCode,
          referredBy: u.referredBy,
          walletAddress: u.walletAddress,
          totalTokens: u.totalTokens,
          stakedTokens: u.stakedTokens,
          availableTokens: u.availableTokens,
          totalEarnings: u.totalEarnings,
          referralEarnings: u.referralEarnings,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        }));
        totalRecords = users.length;
        break;

      case "referrals":
        const referrals = await prisma.user.findMany({
          where: {
            ...dateFilter,
            referredBy: { not: null },
          },
          include: {
            referrer: {
              select: {
                name: true,
                email: true,
              }
            }
          },
          orderBy: { createdAt: "desc" },
        });
        
        reportData = referrals.map(r => ({
          id: r.id,
          name: r.name,
          email: r.email,
          referralCode: r.referralCode,
          referredBy: r.referredBy,
          referrerName: r.referrer?.name,
          referrerEmail: r.referrer?.email,
          totalTokens: r.totalTokens,
          createdAt: r.createdAt,
        }));
        totalRecords = referrals.length;
        break;

      case "commissions":
        const commissions = await prisma.referralCommission.findMany({
          where: dateFilter,
          include: {
            referrer: {
              select: {
                name: true,
                email: true,
              }
            },
            referredUser: {
              select: {
                name: true,
                email: true,
              }
            }
          },
          orderBy: { createdAt: "desc" },
        });
        
        reportData = commissions.map(c => ({
          id: c.id,
          referrerId: c.referrerId,
          referrerName: c.referrer.name,
          referrerEmail: c.referrer.email,
          referredUserId: c.referredUserId,
          referredUserName: c.referredUser.name,
          referredUserEmail: c.referredUser.email,
          amount: c.amount,
          tokenAmount: c.tokenAmount,
          pricePerToken: c.pricePerToken,
          isPaid: c.isPaid,
          paidAt: c.paidAt,
          month: c.month,
          year: c.year,
          createdAt: c.createdAt,
        }));
        totalRecords = commissions.length;
        break;

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    // Log the report generation with date range info
    console.log(`Admin ${session.user.email} generated ${type} report with ${totalRecords} records`);
    if (startDate || endDate) {
      console.log(`Date range: ${startDate || 'unlimited'} to ${endDate || 'unlimited'}`);
    }

    if (format === "csv") {
      // Convert to CSV format
      const csvData = convertToCSV(reportData);
      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type}_report_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      message: `${type} report generated successfully`,
      type,
      totalRecords,
      data: reportData,
      generatedAt: new Date().toISOString(),
      generatedBy: session.user.email,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
        filterApplied: !!(startDate || endDate)
      }
    });

  } catch (error) {
    console.error("Error generating report:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    )
  ];
  
  return csvRows.join("\n");
}
