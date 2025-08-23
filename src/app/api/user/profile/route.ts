import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  contactNumber: z.string().min(1, "Contact number is required").optional(),
  country: z.string().min(1, "Country is required").optional(),
  state: z.string().min(1, "State is required").optional(),
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
    const updateData = profileUpdateSchema.parse(body);

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prepare update data and track changes
    const updates: any = {};
    const profileUpdates: any[] = [];

    if (updateData.name && updateData.name !== currentUser.name) {
      updates.name = updateData.name;
      profileUpdates.push({
        userId: currentUser.id,
        field: "name",
        oldValue: currentUser.name,
        newValue: updateData.name,
        updateType: "PROFILE_UPDATE",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      });
    }

    if (updateData.contactNumber && updateData.contactNumber !== currentUser.contactNumber) {
      updates.contactNumber = updateData.contactNumber;
      profileUpdates.push({
        userId: currentUser.id,
        field: "contactNumber",
        oldValue: currentUser.contactNumber,
        newValue: updateData.contactNumber,
        updateType: "PROFILE_UPDATE",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      });
    }

    if (updateData.country && updateData.country !== currentUser.country) {
      updates.country = updateData.country;
      profileUpdates.push({
        userId: currentUser.id,
        field: "country",
        oldValue: currentUser.country,
        newValue: updateData.country,
        updateType: "PROFILE_UPDATE",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      });
    }

    if (updateData.state && updateData.state !== currentUser.state) {
      updates.state = updateData.state;
      profileUpdates.push({
        userId: currentUser.id,
        field: "state",
        oldValue: currentUser.state,
        newValue: updateData.state,
        updateType: "PROFILE_UPDATE",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "No changes detected" },
        { status: 200 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updates,
    });

    // Create profile update tracking records
    if (profileUpdates.length > 0) {
      await prisma.profileUpdate.createMany({
        data: profileUpdates,
      });
    }

    return NextResponse.json(
      { 
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          contactNumber: updatedUser.contactNumber,
          country: updatedUser.country,
          state: updatedUser.state,
        }
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

    console.error("Profile update error:", error);
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
      select: {
        id: true,
        name: true,
        email: true,
        contactNumber: true,
        country: true,
        state: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
