import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import { NotificationHelpers } from "@/lib/notifications";

const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  contactNumber: z.string().min(1, "Contact number is required").optional(),
  country: z.string().min(1, "Country is required").optional(),
  state: z.string().min(1, "State is required").optional(),
  profilePicture: z.string().optional(), // Base64 image data
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

    // Handle profile picture upload
    if (updateData.profilePicture) {
      try {
        // Validate base64 image data
        const base64Data = updateData.profilePicture.replace(/^data:image\/[a-z]+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${currentUser.id}_${timestamp}.jpg`;
        const filepath = join(process.cwd(), 'public', 'images', 'avatars', filename);
        
        // Save file
        await writeFile(filepath, buffer);
        
        const profilePictureUrl = `/images/avatars/${filename}`;
        updates.profilePicture = profilePictureUrl;
        
        profileUpdates.push({
          userId: currentUser.id,
          field: "profilePicture",
          oldValue: currentUser.profilePicture || "default",
          newValue: profilePictureUrl,
          updateType: "PROFILE_UPDATE",
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        });
      } catch (error) {
        console.error("Profile picture upload error:", error);
        return NextResponse.json(
          { error: "Failed to upload profile picture" },
          { status: 400 }
        );
      }
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

      // Create notification for profile update
      const updatedFields = profileUpdates.map(update => update.field).join(", ");
      await NotificationHelpers.onProfileUpdate(currentUser.id, updatedFields);
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
          profilePicture: updatedUser.profilePicture,
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
        profilePicture: true,
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
