import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const priceSchema = z.object({
  price: z.number().positive(),
  date: z.string().optional(), // ISO date string
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Access denied. Only superadmin can view price history." }, { status: 403 });
    }

    // Get price history
    const prices = await prisma.tokenPrice.findMany({
      orderBy: { date: "desc" },
      take: 100, // Last 100 price updates
    });

    return NextResponse.json({ prices });
  } catch (error) {
    console.error("Error fetching token prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch token prices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Access denied. Only superadmin can update token prices." }, { status: 403 });
    }

    const body = await request.json();
    const { price, date } = priceSchema.parse(body);

    // Use provided date or default to today
    const targetDate = date ? new Date(date) : new Date();
    
    // Check if a price already exists for this date
    const existingPrice = await prisma.tokenPrice.findFirst({
      where: {
        date: {
          gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
          lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1),
        },
      },
    });

    let result;
    if (existingPrice) {
      // Update existing price for this date
      result = await prisma.tokenPrice.update({
        where: { id: existingPrice.id },
        data: {
          price,
        },
      });
      console.log(`Superadmin ${session.user.email} updated existing token price for ${targetDate.toISOString().split('T')[0]} to $${price}`);
    } else {
      // Create new price record for this date
      result = await prisma.tokenPrice.create({
        data: {
          price,
          date: targetDate,
        },
      });
      console.log(`Superadmin ${session.user.email} created new token price for ${targetDate.toISOString().split('T')[0]}: $${price}`);
    }

    return NextResponse.json({
      message: existingPrice ? "Token price updated successfully" : "Token price created successfully",
      price: result,
      action: existingPrice ? "updated" : "created",
    });
  } catch (error) {
    console.error("Error updating token price:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update token price" },
      { status: 500 }
    );
  }
}
