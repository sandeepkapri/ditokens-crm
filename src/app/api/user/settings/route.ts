import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const settingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updateData = settingsSchema.parse(body);

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update or create user settings
    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId: currentUser.id },
      update: updateData,
      create: {
        userId: currentUser.id,
        ...updateData,
      },
    });

    // Create profile update tracking record
    await prisma.profileUpdate.create({
      data: {
        userId: currentUser.id,
        field: "settings",
        oldValue: "Previous settings",
        newValue: JSON.stringify(updateData),
        updateType: "SETTINGS_UPDATE",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json(
      { 
        message: "Settings updated successfully",
        settings: updatedSettings
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user settings
    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    // Return default settings if none exist
    const defaultSettings = {
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: true,
      darkMode: false,
      language: "en",
      timezone: "UTC",
    };

    return NextResponse.json({ 
      settings: settings ? { ...defaultSettings, ...settings } : defaultSettings
    }, { status: 200 });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
