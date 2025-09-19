import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const commissionSchema = z.object({
  referralRate: z.number().min(0).max(100), // Only referral commission, no staking
});

export async function GET(request: NextRequest) {
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

    // Get current commission settings
    let settings = await prisma.commissionSettings.findFirst();
    
    if (!settings) {
      // Create default settings if none exist - only referral commission
      settings = await prisma.commissionSettings.create({
        data: {
          referralRate: 5.0, // Only referral commission, no staking
          updatedBy: session.user.email || "system",
        }
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching commission settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch commission settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { referralRate } = commissionSchema.parse(body);

    // Update or create commission settings - only referral commission
    const existingSettings = await prisma.commissionSettings.findFirst();
    
    let settings;
    if (existingSettings) {
      settings = await prisma.commissionSettings.update({
        where: { id: existingSettings.id },
        data: {
          referralRate,
          updatedBy: session.user.email,
          updatedAt: new Date(),
        },
      });
    } else {
      settings = await prisma.commissionSettings.create({
        data: {
          referralRate,
          updatedBy: session.user.email,
        },
      });
    }

    return NextResponse.json({
      message: "Commission settings updated successfully",
      settings
    });
  } catch (error) {
    console.error("Error updating commission settings:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update commission settings" },
      { status: 500 }
    );
  }
}
